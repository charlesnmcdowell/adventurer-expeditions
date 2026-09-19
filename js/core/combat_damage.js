// Damage subsystem. Dependencies are supplied by the combat facade.
(function(){
'use strict';
ADV.CombatModules=ADV.CombatModules||{};
ADV.CombatModules.damage=function({Ch, Sys, SK, C, perkVal, LANE_IDX, livingUnits, POS_STATUSES, isGod, removeStatus, ev, tryEvade, addStatus, healUnit, findGuard, manifestFor, laneUnits, noteDamageShare, Combat, checkEnd, onUnitDown, applyStealth, HIDE_CAP}){
function computeDamage(st, atkUnit, defUnit, m, opts) {
  opts = opts || {};
  const ch = atkUnit.ch;
  const atk = Ch().effStat(ch, 'atk');
  let power = opts.power != null ? opts.power : (m.data.power || 0);
  if (opts.power == null && m.data.fullHpBackstabPct && defUnit && defUnit.chp >= defUnit.maxHp) {
    const bsM = Sys().manifest(ch, { skillId: 'backstab', level: m.level || 1 });
    const bsPower = (bsM && bsM.data && bsM.data.power) || (SK().backstab && SK().backstab.power);
    if (bsPower) power = bsPower * m.data.fullHpBackstabPct;
  }
  if (power <= 0) return 0;
  const tierMult = m.data.noTierGrowth ? 1.0 : C().TIER_MULT[m.tier];
  const lvl = m.level;
  let dmg = atk * power * tierMult * (1 + lvl * C().LEVEL_DAMAGE_SCALAR);

  // Perk modifiers
  const flare = m.flare;
  if (flare && flare.shockBonus && defUnit && defUnit.statuses
    && defUnit.statuses.some(s => s.kind === 'shocked' || s.kind === 'shock')) {
    dmg *= (1 + flare.shockBonus);
  }
  if (atkUnit.stormMark && ((m.data.element === 'lightning') || m.data.shock)) {
    dmg *= (1 + atkUnit.stormMark);
    atkUnit.stormMark = 0;
  }
  const af = perkVal(ch, 'arcane_focus', null);
  if (af && m.data.elemental) dmg *= af.eleDmgMult;
  const wf = perkVal(ch, 'wild_form', null);
  if (wf) dmg *= wf.dmgMult;
  const mk = perkVal(ch, 'marksman', null);
  if (mk && atkUnit.lane === 'back' && m.data.target !== 'allEnemies' && m.data.target !== 'enemyLane') {
    dmg *= mk.backLaneBonus;
  }
  // Fifty Names: the clan writes down every kill, and the tally never resets
  const fn = perkVal(ch, 'fifty_names', 'lifeKillScale');
  if (fn) dmg *= 1 + (ch.lifeKills || 0) * fn;
  // Rising Cut / Before the Breath: doubled on anyone who has not moved yet
  if (m.data.unactedDouble && defUnit && !defUnit.attackedThisRound && !defUnit.actedThisRound) dmg *= 1.5;   // balance pass: was ×2
  // Ranging Cannon: every consecutive round on the same lane finds the range
  if (m.data.laneFocusScale && defUnit) {
    if (atkUnit.laneFocus.lane === defUnit.lane) atkUnit.laneFocus.n++;
    else atkUnit.laneFocus = { lane: defUnit.lane, n: 0 };
    dmg *= 1 + atkUnit.laneFocus.n * m.data.laneFocusScale;
  }
  const ac = perkVal(ch, 'arena_champion', null);
  if (ac && atkUnit.arenaStacks) dmg *= 1 + atkUnit.arenaStacks * ac.stackPct;
  const mo = perkVal(ch, 'momentum', null);
  if (mo && defUnit) {
    dmg *= (1 + (atkUnit.momentumStacks || 0) * mo.stackMult);
  }
  // Beast shape / auras / campaign self-buffs
  for (const s of atkUnit.statuses) {
    if (s.kind === 'atkBuff' || s.kind === 'beastShape') dmg *= s.mult;
    if (s.kind === 'aura') dmg *= s.atk;
    if (s.kind === 'suppressed') dmg *= s.mult;        // Suppressing Volley
    if (s.kind === 'advance') dmg *= s.mult;           // Line Advance
    if (s.kind === 'bond') dmg *= s.mult;              // Elemental Bond
    if (s.kind === 'warhound') dmg *= s.mult;          // Warhound Form
    if (s.kind === 'spellblade') dmg *= (1 + m.level * 0.02); // Spellblade: scales with skill level
  }
  // ---- campaign scalers (§13) ----
  const D = m.data;
  if (D.killStreakScale) dmg *= 1 + atkUnit.killStreak * D.killStreakScale;         // Executioner's Rhythm
  if (D.idleScale) dmg *= 1 + atkUnit.idleRounds * D.idleScale;                     // Spider's Patience
  if (D.encounterScale) dmg *= 1 + (st.encounterIndex || 0) * D.encounterScale;    // Veteran's Cut
  if (D.castScale) dmg *= 1 + atkUnit.castsThisBattle * D.castScale;               // Arcane Cascade
  if (D.tierScale) dmg *= 1 + ((st.questTier === 'boss' ? 4 : (st.questTier || 1)) - 1) * D.tierScale; // Paid Shot
  if (D.alliesBetweenScale && defUnit) {                                            // Killing Angle
    const a = LANE_IDX[atkUnit.lane];
    const between = livingUnits(st, atkUnit.side).filter(x => x !== atkUnit && LANE_IDX[x.lane] < a).length;
    dmg *= 1 + between * D.alliesBetweenScale;
  }
  if (D.buffCountScale && defUnit) {                                                // Focal Shot
    const n = defUnit.statuses.filter(x => POS_STATUSES.includes(x.kind)).length;
    dmg *= 1 + n * D.buffCountScale;
  }
  if (D.flankScale && defUnit) {                                                    // Flanking Pay
    if (defUnit.attackedThisRoundBy.some(uid => uid !== atkUnit.uid)) dmg *= 1 + D.flankScale;
  }
  if (D.laneStreakScale && defUnit) {                                               // Ranged Discipline
    dmg *= 1 + (atkUnit.laneStreak.lane === defUnit.lane ? atkUnit.laneStreak.n : 0) * D.laneStreakScale;
  }
  if (D.distanceScale && defUnit) {                                                 // Shadow Lance
    const dist = LANE_IDX[defUnit.lane] + LANE_IDX[atkUnit.lane];
    dmg *= 1 + dist * D.distanceScale;
  }
  // Contract Mark: every ally deals bonus damage to the marked target
  if (defUnit && defUnit.statuses.some(x => x.kind === 'contractMark' && x.side === atkUnit.side)) dmg *= 1.25;
  dmg = Math.round(dmg);
  if (defUnit && atkUnit && atkUnit.ch) {
    // balance pass: a boss blow still bites whatever your health bar says, but a
    // two-turn boss no longer ends anyone in three rounds regardless of level
    if (isGod(atkUnit.ch)) dmg += Math.round((defUnit.maxHp || 0) * C().GOD_HIT_PCT);
    else if (atkUnit.ch.boss) dmg += Math.round((defUnit.maxHp || 0) * C().BOSS_HIT_PCT);
  }
  let def = defUnit ? Ch().effStat(defUnit.ch, 'def') + (defUnit.armorBonus || 0) - (defUnit.defStripped || 0) : 0;
  if (defUnit) {
    // Marked for the Knife: the marker ignores 50% of the target's Defence
    if (defUnit.statuses.some(x => x.kind === 'marked' && x.srcUid === atkUnit.uid)) def = Math.round(def * 0.5);
    // Saber Thrust: through the guard — ignores a set fraction of Defence
    if (m.data.defIgnorePct) def = Math.round(def * (1 - m.data.defIgnorePct));
    // Burning: reduces Defence while active (campaign §13e)
    if (defUnit.statuses.some(x => x.kind === 'burn')) def -= 4;
    // Beast Handler: followers gain their handler's Defence bonus
    if ((defUnit.ch.isConscript || defUnit.ch.isUndead) &&
        livingUnits(st, defUnit.side).some(x => x !== defUnit && perkVal(x.ch, 'beast_handler', null))) def += 4;
  }
  if (ADV.GatePerkCombat && ADV.GatePerkCombat.focus(st, atkUnit)) def = Math.round(Math.max(0, def) * 0.8);
  let out = Math.max(C().MIN_DAMAGE, dmg - Math.max(0, def));
  // Normal and above: one use of a BASIC-tier skill takes at most a third of a foe's maximum
  // health, however far its wielder outclasses them — a basic skill is an opener, not an
  // execution. Measured before this, every basic-tier skill in the game cleared a third
  // against a low-level mook and most of them killed outright, including a plain attack; that
  // is a property of the gap between the two characters, not of any skill's numbers, so it
  // belongs here rather than in a hundred power values. The running total for one action —
  // extra hits, and riders the skill sets off — is held to the same share by the budget below.
  const capPct = (ADV.Difficulty && ADV.Difficulty.basicHitCap) ? ADV.Difficulty.basicHitCap() : 0;
  if (capPct && m.tier === 'basic' && defUnit && defUnit.maxHp && ADV.Difficulty.isFoe(defUnit.ch)) {
    const cap = Math.max(C().MIN_DAMAGE, Math.floor(defUnit.maxHp * capPct));
    if (out > cap) out = cap;
  }
  return out;
}

// Apply damage with all defensive triggers. Returns actual damage dealt to hp.
function dealDamage(st, src, tgt, amount, tag, opts) {
  opts = opts || {};
  if (tgt.downed || tgt.fled) return 0;
  if (ADV.GatePerkCombat) ADV.GatePerkCombat.attempt(st, src, tgt, tag);
  if (src && tag !== 'dot' && tag !== 'reflect' && tag !== 'retaliation') {
    if (!tgt.attackedThisRoundBy.includes(src.uid)) tgt.attackedThisRoundBy.push(src.uid);
  }
  // Reflect immunity: Ghoststep's next attack, and Marksman firing from the
  // back lane, take no reflect damage from ANY source (campaign §0c/§13a)
  const mkA = src ? perkVal(src.ch, 'marksman', null) : null;
  const noReflect = !!(opts.noReflect || (src && (src.reflectImmuneNext || (mkA && mkA.noReflect && src.lane === 'back'))));
  const bounce = (owner, victim, dmgBack, kind) => { if (!noReflect) applyRawDamage(st, owner, victim, dmgBack, kind || 'reflect'); };
  // Shocked (lightning): the target takes more damage from EVERY source
  const sh = tgt.statuses.find(x => x.kind === 'shocked');
  if (sh && tag !== 'dot') amount = Math.round(amount * (1 + sh.pct));
  // Constructs / undead: no blood to spoil. Ice and lightning bite steel harder.
  if (tag !== 'dot' && !Ch().isOrganic(tgt.ch)) {
    const el = opts.element;
    if (el === 'lightning' || el === 'ice') {
      amount = Math.round(amount * (C().ICE_LIGHTNING_INORGANIC || 1.75));
    } else if (!el || el === 'physical') {
      amount = Math.round(amount * (C().NON_ORGANIC_WEAK || 1.35));
    }
  }
  // Exposed (campaign §13e): melee hits consume every stack for +20% each
  if (opts.melee && tag === 'attack') {
    const ex = tgt.statuses.find(x => x.kind === 'exposed');
    if (ex && ex.stacks > 0) { amount = Math.round(amount * (1 + 0.2 * ex.stacks)); removeStatus(tgt, ex); ev(st, { t: 'exposedBurst', uid: tgt.uid, stacks: ex.stacks }); }
  }
  if (tryEvade(st, src, tgt, tag, opts)) return 0;
  opts.evadeChecked = true;
  const locked = tgt.statuses.some(x => x.kind === 'reactionLock');   // Bell-Silence
  if (tgt.counter > 0 && src && tag === 'attack' && !locked) {
    tgt.counter--;
    ev(st, { t: 'counter', uid: tgt.uid, by: src.uid, dmg: amount });
    bounce(tgt, src, amount);
    if (tgt.counterRiposte && Combat.riposte) Combat.riposte(st, tgt, src);
    return 0;
  }
  let dmg = amount;
  const prismatic = opts.element === 'prismatic';   // Prismatic Bolt: no resistance applies
  // Fire Barrier: party fire resistance + Burning on attackers
  const fb = tgt.statuses.find(x => x.kind === 'fireBarrier');
  if (fb) {
    if (opts.element === 'fire' && !prismatic) dmg = Math.round(dmg * (1 - fb.resist));
    if (src && tag === 'attack') addStatus(st, src, { kind: 'burn', power: 0.8, rounds: 3, srcAtk: Ch().effStat(tgt.ch, 'atk'), srcLevel: 1 });
  }
  // Ash Ward / Cinder Screen: the company takes less from every element
  const eg = tgt.statuses.find(x => x.kind === 'elemGuard');
  if (eg && opts.element && !prismatic) dmg = Math.round(dmg * eg.mult);
  // The Clan Watches / Hold Fast: an ally in the lane shelters the rest
  if (src) {
    for (const a of livingUnits(st, tgt.side)) {
      if (a === tgt || a.lane !== tgt.lane) continue;
      let g = perkVal(a.ch, 'the_clan_watches', 'laneAllyGuard');
      if (!g) { const cl = a.statuses.find(x => x.kind === 'laneGuard'); if (cl) g = cl.mult; }
      if (g) { dmg = Math.round(dmg * g); break; }
    }
  }
  // Absorption Field: elemental damage reduced for the party, the caster healed by it
  const ab = tgt.statuses.find(x => x.kind === 'absorb');
  if (ab && opts.element && !prismatic) {
    const cut = Math.round(dmg * ab.pct); dmg -= cut;
    const owner = st.units.find(x => x.uid === ab.srcUid);
    if (owner && !owner.downed && cut > 0) healUnit(st, null, owner, cut);
  }
  // Cloak of Shadows: reduction + reflect using Backstab's calculation
  const ck = tgt.statuses.find(x => x.kind === 'cloak');
  if (ck && tag === 'attack') {
    dmg = Math.round(dmg * (1 - ck.reduce));
    if (src) {
      const back = Math.max(1, Math.round(Ch().effStat(tgt.ch, 'atk') * 6.0 * C().TIER_MULT[ck.tier || 'basic'] * 0.5) - Math.max(0, Ch().effStat(src.ch, 'def')));
      bounce(tgt, src, back);
    }
  }
  // Pyromaniac: fire resistance on the defender (request 4)
  if (opts.element === 'fire' && !prismatic) {
    const py = perkVal(tgt.ch, 'pyromaniac', null);
    if (py && py.fireResist) dmg = Math.round(dmg * (1 - py.fireResist));
  }
  // Bulwark reflect is calculated here; the reduction itself lands in
  // applyTakenReduction after the hit (including % HP) is finalized.
  const bw = perkVal(tgt.ch, 'bulwark', null);
  let reflectPct = 0;
  if (bw && tag !== 'dot') reflectPct += bw.reflectPct;
  // Aura defense
  for (const s of tgt.statuses) if (s.kind === 'aura') dmg = Math.round(dmg / s.def);
  // Guard (Shield Wall): absorb fraction of incoming strikes, spells, and
  // percent-HP ticks; prevented damage is dealt to the attacker.
  let prevented = 0;
  const guarded = opts.ignoreGuards ? null : findGuard(st, tgt);
  if (guarded && (tag === 'attack' || tag === 'spell' || tag === 'dot')) {
    let absorb = guarded.absorb != null ? guarded.absorb : 0.5;
    // A full-negate wall is for the people you cover. Once your own bar is
    // gone — or so thin it paints as empty on a Gate-sized pool — the next
    // blow finishes you. Otherwise a tank mini recasts the wall forever.
    const life = Math.max(0, tgt.chp) + Math.max(0, tgt.tempHp || 0);
    const sliver = tgt.maxHp > 0 && life / tgt.maxHp <= 0.02;
    if (absorb >= 1 && guarded.owner === tgt && (life <= 0 || sliver)) absorb = 0;
    prevented = Math.ceil(dmg * absorb);
    dmg -= prevented;
    guarded.owner.preventedStored += prevented;               // Paid in Full ledger
    if (src) bounce(guarded.owner, src, prevented);
    // Unseen Guard: the interceptor is unseen and the attacker bleeds
    if (guarded.unseen && src) { const ug = manifestFor(guarded.owner, 'unseen_guard'); addStatus(st, src, { kind: 'bleed', tier: ug ? ug.tier : 'basic', power: 0.6, rounds: 3, stacks: true, srcAtk: Ch().effStat(guarded.owner.ch, 'atk'), srcUid: guarded.owner.uid }); }
  }
  // Ward shields (Guardian Ward): the next hit, strike or spell
  const ward = tgt.statuses.find(s => s.kind === 'ward' && (s.hits > 0 || s.rounds > 0));
  if (ward && (tag === 'attack' || tag === 'spell')) {
    if (ward.hits > 0) ward.hits--;
    tgt.preventedStored += dmg;
    ev(st, { t: 'ward', uid: tgt.uid, blocked: dmg });
    if (ward.reflect && src) bounce(tgt, src, dmg);
    // Warding Stance: when the ward breaks it discharges into the attacker's lane
    if (ward.discharge && ward.hits <= 0 && src) {
      for (const x of laneUnits(st, src.side, src.lane)) bounce(tgt, x, Math.round(ward.discharge));
      removeStatus(tgt, ward);
    }
    return 0;
  }
  // Thorn shield (druid heal, A3): a pool that drinks the hit and gives half of it back
  const tsh = (tag === 'attack' || tag === 'spell') ? tgt.statuses.find(s => s.kind === 'thornShield' && s.pool > 0) : null;
  if (tsh) {
    const absorbed = Math.min(dmg, tsh.pool);
    tsh.pool -= absorbed; dmg -= absorbed;
    tgt.preventedStored += absorbed;
    ev(st, { t: 'shieldAbsorb', uid: tgt.uid, absorbed, left: tsh.pool, by: src ? src.uid : null });
    if (src && absorbed > 0) bounce(tgt, src, Math.max(1, Math.round(absorbed * (tsh.reflectPct || 0.5))));
    if (tsh.pool <= 0) { removeStatus(tgt, tsh); ev(st, { t: 'shieldBreak', uid: tgt.uid }); }
    if (dmg <= 0) return 0;
  }
  // Thorns
  const thorn = tgt.statuses.some(x => x.kind === 'reactionLock') ? null : tgt.statuses.find(s => s.kind === 'thorns');
  if (thorn && src && tag === 'attack') bounce(tgt, src, Math.round(dmg * thorn.pct));
  if (reflectPct > 0 && src && (tag === 'attack' || tag === 'spell')) bounce(tgt, src, Math.round(dmg * reflectPct));
  // Blood Price: one-shot 200% reflect, stacks additively on top of everything
  const bp = tgt.statuses.find(s => s.kind === 'bloodPrice');
  if (bp && src && tag === 'attack') { removeStatus(tgt, bp); bounce(tgt, src, Math.round(dmg * bp.pct)); }
  // Taunt retaliation: marked attacker strikes the marker (§3a)
  if (src && (tag === 'attack' || tag === 'spell') && src.marksBy.length) {
    for (const markerUid of src.marksBy) {
      if (markerUid === tgt.uid) {
        const marker = st.units.find(x => x.uid === markerUid);
        if (marker && !marker.downed && !marker.fled) {
          const tm = manifestFor(marker, 'taunt');
          const rp = (tm ? tm.data.retaliationPower : 1.5) || 1.5;
          // Fixed retaliation — no DEF subtraction (§15a worked check: ATK 9 -> 14)
          const rdmg = Math.max(1, Math.round(Ch().effStat(marker.ch, 'atk') * rp *
            C().TIER_MULT[tm ? tm.tier : 'basic']));
          applyRawDamage(st, marker, src, rdmg, 'retaliation');
          addExposed(st, src, 1);                                // retaliation is melee (§0d)
        }
      }
    }
  }
  // Bulwark Formation / Contract Bound: damage shared equally across the group
  const share = tgt.statuses.find(s => s.kind === 'share');
  let dealt;
  if (share && tag !== 'dot') {
    const group = livingUnits(st, tgt.side).filter(x => x.statuses.some(s => s.kind === 'share' && s.group === share.group));
    if (group.length > 1) {
      const each = Math.max(1, Math.round(dmg / group.length));
      dealt = 0;
      for (const g of group) dealt += applyRawDamage(st, src, g, each, tag, opts);
    } else dealt = applyRawDamage(st, src, tgt, dmg, tag, opts);
  } else dealt = applyRawDamage(st, src, tgt, dmg, tag, opts);
  if (src && dealt > 0 && tag !== 'dot' && tag !== 'reflect' && tag !== 'retaliation') noteDamageShare(st, src, dealt);
  if (opts.element) tgt.lastElementTaken = opts.element;
  if (src && src.reflectImmuneNext && tag !== 'dot') src.reflectImmuneNext = false;
  if (src && dealt > 0 && opts.element === 'fire') {
    const py = perkVal(src.ch, 'pyromaniac', null);
    if (py && py.fireLeech) healUnit(st, null, src, Math.max(1, Math.round(dealt * py.fireLeech)));
  }
  if (src && dealt > 0 && opts.element === 'ice') {
    const iq = perkVal(src.ch, 'ice_queen', null);
    if (iq && iq.iceArmorPerHit) {
      let armor = src.statuses.find(x => x.kind === 'iceArmor');
      if (!armor) { armor = { kind: 'iceArmor', pct: 0 }; src.statuses.push(armor); }
      armor.pct = Math.min(0.5, Math.round((armor.pct + iq.iceArmorPerHit) * 100) / 100);
      ev(st, { t: 'status', uid: src.uid, kind: 'iceArmor' });
    }
  }
  return dealt;
}

// Exposed stacks (campaign §13e): applied by every melee hit, consumed by the next one.
function addExposed(st, tgt, n) {
  if (!tgt || tgt.downed || tgt.fled) return;
  if (tgt.statuses.some(x => x.kind === 'purified')) return;
  const ex = tgt.statuses.find(x => x.kind === 'exposed');
  if (ex) ex.stacks += n; else tgt.statuses.push({ kind: 'exposed', stacks: n });
  ev(st, { t: 'status', uid: tgt.uid, kind: 'exposed' });
}
Combat.addExposed = addExposed;

function applyRankRiders(st, src, tgt) {
  if (!src || !tgt || tgt.downed) return;
  const list = [];
  if (src.ch.hitStatus) list.push(src.ch.hitStatus);
  for (const s of (src.ch.hitStatuses || [])) list.push(s);
  const atk = Ch().effStat(src.ch, 'atk');
  for (const s of list) {
    if (!s || !s.kind) continue;
    addStatus(st, tgt, Object.assign({ srcAtk: atk, srcUid: src.uid, srcLevel: src.ch.enemyLevel || 1 }, s, { ticks: undefined, dealt: undefined, ticksTotal: undefined }));
  }
}

function applyOpportunist(src, tgt, dmg, opts) {
  if (!src || !src.ch || !tgt || src === tgt) return dmg;
  if (opts && opts.noExecute) return dmg;
  const opp = perkVal(src.ch, 'opportunist', null);
  if (!opp) return dmg;
  const thresh = opp.executeThreshold != null ? opp.executeThreshold : 0.5;
  if ((tgt.chp / tgt.maxHp) >= thresh) return dmg;
  if (opp.bonusHpPct) return dmg + Math.round(tgt.maxHp * opp.bonusHpPct);
  if (opp.bonusMult) return Math.round(dmg * opp.bonusMult);
  return dmg;
}

// Personal damage reduction — after the hit is calculated (atk, def, % HP
// riders, Opportunist). A 50% HP blow still eats Bulwark / Frost Armor.
function isPhysicalTaken(opts) {
  const tag = opts && opts.tag;
  if (opts && opts.melee) return true;
  return tag === 'attack' || tag === 'dot' || tag === 'retaliation';
}

function applyTakenReduction(tgt, dmg, opts) {
  if (!tgt || dmg <= 0) return dmg;
  opts = opts || {};
  let mult = 1;
  for (const e of (tgt.ch.perks || [])) {
    const m = manifestFor(tgt, e.skillId);
    if (!m || !m.data || typeof m.data.dmgTakenMult !== 'number') continue;
    if (m.data.physicalTaken && !isPhysicalTaken(opts)) continue;
    mult *= m.data.dmgTakenMult;
  }
  const prismatic = opts.element === 'prismatic';
  for (const s of tgt.statuses || []) {
    if (typeof s.dmgTakenMult === 'number') mult *= s.dmgTakenMult;
    if (s.kind === 'iceArmor' && s.pct && !prismatic) mult *= (1 - s.pct);
  }
  if (mult === 1) return dmg;
  return Math.max(0, Math.round(dmg * mult));
}
Combat.applyTakenReduction = applyTakenReduction;

// One use of a basic-tier skill is allowed a fixed share of each foe it hits — its own blow
// and everything that blow sets off (extra strikes, an Exposed burst, an on-hit rider, a gate
// perk's modifier) drawing on the same allowance. Opened at the top of every action and spent
// last in applyRawDamage, which every damage path funnels through, so nothing downstream can
// push a basic blow past its share. Reflects and retaliation onto the actor are not charged to
// it: the allowance is about what the actor can take off a foe.
function openBasicBudget(st, u, m) {
  st.basicBudget = null;
  const capPct = (ADV.Difficulty && ADV.Difficulty.basicHitCap) ? ADV.Difficulty.basicHitCap() : 0;
  if (!capPct || !u || !m || m.tier !== 'basic') return;
  st.basicBudget = { uid: u.uid, pct: capPct, spent: {} };
}
function spendBasicBudget(st, src, tgt, dmg) {
  const b = st && st.basicBudget;
  if (!b || !src || src.uid !== b.uid || !tgt || !tgt.maxHp || dmg <= 0) return dmg;
  if (!ADV.Difficulty.isFoe(tgt.ch)) return dmg;
  const cap = Math.max(C().MIN_DAMAGE, Math.floor(tgt.maxHp * b.pct));
  const left = Math.max(0, cap - (b.spent[tgt.uid] || 0));
  const out = Math.min(dmg, left);
  b.spent[tgt.uid] = (b.spent[tgt.uid] || 0) + out;
  return out;
}

function resolveLethal(st, src, tgt, dmg, tag) {
  if (!tgt || tgt.downed || tgt.fled || tgt.chp > 0) return;
  // Vital Anchor: holds at 1 HP — but an anchor is spent by the blow it
  // catches, and each unit can be anchored only once per battle (no 45-round
  // stalemates against a re-casting healer)
  const anc = tgt.statuses.find(x => x.kind === 'anchor');
  if (anc) { removeStatus(tgt, anc); tgt.anchorSpent = true; tgt.chp = 1; ev(st, { t: 'anchored', uid: tgt.uid }); return; }
  // Wild Form advanced: survive one lethal blow per battle at 1 HP
  const wf = perkVal(tgt.ch, 'wild_form', null);
  if (wf && wf.surviveLethal && !tgt.survivedLethal) {
    tgt.survivedLethal = true; tgt.chp = 1;
    ev(st, { t: 'surviveLethal', uid: tgt.uid });
    return;
  }
  if (tgt.ch.campaignExit && !tgt.ch.__scriptedDeath) {
    // Campaign rivals/bosses cannot die in combat (§5a): they exit the
    // encounter with their signature line and return next encounter.
    tgt.chp = 0; tgt.fled = true; tgt.exited = true;
    ev(st, { t: 'campaignExit', uid: tgt.uid, name: tgt.ch.name });
    checkEnd(st);
    return;
  }
  tgt.chp = 0; tgt.downed = true;
  ev(st, { t: 'down', uid: tgt.uid, by: src ? src.uid : null });
  onUnitDown(st, tgt);
  if (src && tgt.downed) {
    Combat.addThreat(st, src, 20, 'kill');
    src.killStreak++;                                        // Executioner's Rhythm
    src.ch.lifeKills = (src.ch.lifeKills || 0) + 1;          // Fifty Names' tally
    if (src.stealthOnKillPending) { applyStealth(src, HIDE_CAP); src.stealthOnKillPending = false; ev(st, { t: 'stealth', uid: src.uid }); }
    // Opportunist advanced: kills refund your action
    const opp = perkVal(src.ch, 'opportunist', null);
    if (opp && opp.killRefundsAction && (tag === 'attack' || tag === 'spell')) src.refundAction = true;
    // Arena Champion: every kill heals half, stacks damage, and taunts the field
    const ac = perkVal(src.ch, 'arena_champion', null);
    if (ac) {
      healUnit(st, null, src, Math.max(1, Math.round(src.maxHp * ac.killHealPct)));
      src.arenaStacks = (src.arenaStacks || 0) + 1;
      for (const f of livingUnits(st, tgt.side)) {
        if (!f.marksBy.includes(src.uid)) f.marksBy.push(src.uid);
        const existing = f.statuses.find(x => x.kind === 'taunted' && x.srcUid === src.uid);
        if (existing) existing.rounds = ac.tauntRounds; else addStatus(st, f, { kind: 'taunted', srcUid: src.uid, rounds: ac.tauntRounds });
      }
      Combat.resetThreat(st, src.side);
      Combat.addThreat(st, src, 40, 'taunt');
      ev(st, { t: 'arenaChampion', uid: src.uid, stacks: src.arenaStacks });
    }
  }
}

function applyRawDamage(st, src, tgt, dmg, tag, opts) {
  if (!tgt || tgt.downed || tgt.fled) return 0;
  opts = opts || {};
  // A fully absorbed hit used to return before this check, so a 0-HP body
  // behind Shield Wall kept taking turns. Empty is empty.
  if ((tgt.chp || 0) <= 0 && (tgt.tempHp || 0) <= 0) {
    resolveLethal(st, src, tgt, dmg, tag);
    return 0;
  }
  if (!opts.evadeChecked && tryEvade(st, src, tgt, tag, opts)) return 0;
  // Hollow Discipline: being hit does not break stealth. Only attacking does.
  if (tgt.stealth && !perkVal(tgt.ch, 'hollow_discipline', 'stealthKeepsOnHit')) { /* base rules elsewhere */ }
  dmg = applyOpportunist(src, tgt, dmg, opts);
  dmg = applyTakenReduction(tgt, dmg, Object.assign({}, opts, { tag }));
  if (ADV.GatePerkCombat) dmg = ADV.GatePerkCombat.modifyDamage(st, src, tgt, dmg, tag, opts);
  if (src && src.ch && src.ch.c3FoeDmg && src.ch.c3FoeDmg !== 1) dmg = Math.max(C().MIN_DAMAGE, Math.round(dmg * src.ch.c3FoeDmg));
  dmg = spendBasicBudget(st, src, tgt, dmg);
  if (dmg <= 0) return 0;
  // Temp HP consumed first — still counts as damage taken for reflect/retaliation (§15a),
  // which is honored because those triggers fire in dealDamage before this point.
  let remaining = dmg;
  const hpBefore = Math.max(0, tgt.chp);
  if (tgt.tempHp > 0) {
    const absorbed = Math.min(tgt.tempHp, remaining);
    if (ADV.GatePerkCombat) ADV.GatePerkCombat.absorb(tgt, absorbed);
    tgt.tempHp -= absorbed; remaining -= absorbed;
  }
  tgt.chp -= remaining;
  tgt.damageTaken = (tgt.damageTaken || 0) + remaining;
  // Paper Charm / Sealed: whoever strikes the warded ally is poisoned for it
  const pc = tgt.statuses.find(x => x.kind === 'charmWard');
  if (pc && src && tag !== 'dot' && tag !== 'reflect') {
    addStatus(st, src, { kind: 'poison', tier: pc.tier || 'basic', power: pc.power, rounds: pc.rounds, stacks: true, srcAtk: Ch().effStat(tgt.ch, 'atk'), srcUid: tgt.uid });
  }
  // Come Aboard: the next one to swing at you comes over the rail
  const bp = tgt.statuses.find(x => x.kind === 'railGuard');
  if (bp && src && tag === 'attack') { removeStatus(tgt, bp); Combat.moveLane(st, src, tgt.lane); }
  if (src && src.ch && tag !== 'dot' && tag !== 'reflect' && tag !== 'retaliation') applyRankRiders(st, src, tgt);
  const hitEvent = { t: 'damage', uid: tgt.uid, by: src ? src.uid : null, dmg, tag };
  // Keep the visual cause after a final tick removes its status or lane hazard.
  if (opts.visual) hitEvent.visual = opts.visual;
  ev(st, hitEvent);
  if (ADV.GatePerkCombat) ADV.GatePerkCombat.damaged(st, src, tgt, Math.min(hpBefore, remaining), tag);
  if (tgt.chp <= 0) {
    resolveLethal(st, src, tgt, dmg, tag);
    if (tgt.chp > 0) return dmg;
    if (tgt.fled) return dmg;
  }
  checkEnd(st);
  return dmg;
}


return {computeDamage, dealDamage, addExposed, applyRankRiders, applyOpportunist, isPhysicalTaken, applyTakenReduction, openBasicBudget, spendBasicBudget, applyRawDamage};
};
})();
