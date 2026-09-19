// Three-lane turn-based tactical combat (§4, §15a).
// Pure logic: emits an event list the UI animates. No Phaser here.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const SK = () => ADV.DATA.SKILLS;
const Sys = () => ADV.SkillSys;
const Ch = () => ADV.Character;

const Combat = {};

// Status taxonomy — one authority for "what counts as negative" (Demigod
// immunity, Cleanse) vs "what ticks as damage over time".
const NEG_STATUSES = ['reactionLock', 'rooted', 'burn', 'bleed', 'poison', 'healcut', 'frozen', 'shocked', 'sealed',
  'withering', 'exposed', 'shock', 'suppressed', 'marked', 'contractMark', 'shadowDot'];
const DOT_STATUSES = ['burn', 'bleed', 'poison', 'shadowDot'];
// Buffs and wards — what Dispel/Ward Thief can strip (perks are never statuses, §13d-2)
const POS_STATUSES = ['guard', 'ward', 'atkBuff', 'thorns', 'aura', 'hot', 'iceArmor', 'takenReduce', 'purified', 'thornShield', 'grove', 'wings', 'form',
  'cloak', 'bloodPrice', 'serpent', 'storm', 'bond', 'spellblade', 'warhound', 'fireBarrier',
  'absorb', 'anchor', 'advance', 'lifesteal', 'holdRoad', 'countersign', 'runic',
  'elemGuard', 'volley', 'closed', 'laneGuard', 'immovable', 'charmWard', 'railGuard',
  'venomTouch', 'openingTouch', 'beastShape'];
Combat.NEG_STATUSES = NEG_STATUSES; Combat.POS_STATUSES = POS_STATUSES;
Combat.isGod = isGod;

// ---------------------------------------------------------------- unit wrap
function makeUnit(ch, side, idx) {
  const maxHp = Math.max(Ch().maxHp(ch), ch.hpFloor || 0);   // boss floor (DOT_PROMPT.md §11)
  return {
    uid: side + idx, ch, side,
    lane: null, slot: 0,
    chp: ch.combatHp != null ? ch.combatHp : maxHp,
    maxHp, tempHp: 0,
    downed: false, fled: false, reserved: false,
    statuses: [],           // {kind, rounds, power, stacks, srcUid, scope...}
    marksBy: [],            // taunt marks: uids this unit MUST attack
    threat: 0,              // current threat (kit + fight events)
    threatBase: 0,          // what the kit alone is worth; taunt resets to this
    threatDamage: 0,        // recomputed excess-damage component
    threatWhy: '',          // one-line reason for the hover
    damageDealt: 0,         // for the over-share rule
    healingDone: 0,
    rangerUsesLeft: 0,      // Sniper extra ranger use this round
    momentumTarget: null, momentumStacks: 0, consecutiveCount: 0, momentumArmed: false,
    guard: null,            // {scope, srcUid} shield wall
    evade: 0, untargetable: 0, counter: 0,
    usedOncePerBattle: {},
    planned: null,          // intent {skillId, targetUid, label}
    witnessedHere: [],      // [{skillId, tier}] skills seen this battle
    turnsPerRound: rankTurns(ch).n,
    consecutiveTurns: rankTurns(ch).consecutive,
    delayed: 0,             // frost/snare turn-order penalty (acts later)
    loseNextAction: false,
    survivedLethal: false,  // wild form advanced once/battle
    // campaign primitives
    stealth: false, stealthRounds: 0, actedThisEncounter: false, reflectImmuneNext: false,
    killStreak: 0, idleRounds: 0, castsThisBattle: 0, laneStreak: { lane: null, n: 0 },
    preventedStored: 0, attackedThisRoundBy: [], lastElementTaken: null,
    // ninja/pirate primitives (add-on §3)
    reloadLock: {},            // skillId -> true while it needs reloading
    laneFocus: { lane: null, n: 0 },  // Ranging Cannon: consecutive rounds on a lane
    damageTaken: 0,            // Clan Blood heals from this
    grantedTurns: 0,
    freeActionUsed: false,
  };
}

function isGod(ch) {
  return !!(ch && (ch.isGod || ch.role === 'god' || ch.godLine));
}
function rankTurns(ch) {
  const perkN = Math.max(Sys().knownVal(ch, 'turnsPerRound') || 1, 1);
  const consecPerk = !!Sys().knownVal(ch, 'consecutive');
  const place = Sys().knownVal(ch, 'turnPlacement');
  if (isGod(ch)) return { n: Math.max(3, perkN), consecutive: true };
  if (ch && ch.boss) return { n: Math.max(2, perkN), consecutive: true };
  return { n: perkN, consecutive: consecPerk && place !== 'distributed' };
}

const HIDE_CAP = 2;
const VANISH_CAP = 1;
Combat.HIDE_CAP = HIDE_CAP;
Combat.VANISH_CAP = VANISH_CAP;

function hideRounds(n, cap) {
  const v = Math.floor(Number(n));
  const top = cap || HIDE_CAP;
  if (!Number.isFinite(v) || v <= 0) return top;
  return Math.min(top, v);
}
function applyStealth(u, rounds) {
  if (!u) return;
  u.stealth = true;
  u.stealthRounds = Math.min(HIDE_CAP, Math.max(u.stealthRounds || 0, hideRounds(rounds, HIDE_CAP)));
}
function applyUntargetable(u) {
  if (!u) return;
  // One vanished round, never stacked. The next round they can be hit,
  // with one free evade granted when this flag falls off.
  u.untargetable = VANISH_CAP;
}
function tickHide(u) {
  if ((u.untargetable || 0) > VANISH_CAP) u.untargetable = VANISH_CAP;
  if ((u.stealthRounds || 0) > HIDE_CAP) u.stealthRounds = HIDE_CAP;
  if (u.stealth && !(u.stealthRounds > 0) && !(u.untargetable > 0)) {
    u.stealth = false;
    u.stealthRounds = 0;
    u.untargetable = 0;
    return;
  }
  if (u.stealthRounds > 0) u.stealthRounds--;
  if (u.untargetable > 0) {
    u.untargetable--;
    if (u.untargetable <= 0) u.evade = Math.max(u.evade || 0, 1);
  }
  if (!(u.stealthRounds > 0) && !(u.untargetable > 0)) {
    u.stealth = false;
    u.stealthRounds = 0;
    u.untargetable = 0;
  }
}
Combat.applyStealth = applyStealth;
Combat.applyUntargetable = applyUntargetable;

function perkVal(ch, perkId, key) {
  const p = ch.perks.find(e => e.skillId === perkId);
  if (!p) return null;
  const sk = SK()[perkId];
  if (!sk) return null;
  const m = Sys().manifest(ch, p);
  const data = m ? m.data : Object.assign({}, sk, (sk.tiers && (sk.tiers.basic || sk.tiers.advanced)) || {});
  return key ? data[key] : data;
}

// ---------------------------------------------------------------- threat (THREAT_PROMPT.md)
const THREAT_ARCH = { tank: 18, fighter: 14, ranger: 5, druid: 5, healer: 5, mage: 5, rogue: -6 };
function clampThreat(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
Combat.threatBaseFor = function (ch) {
  if (!ch) return 40;
  let sum = 0;
  for (const e of (ch.actives || []).concat(ch.perks || [])) {
    const sk = SK()[e.skillId];
    if (sk && sk.campaignReward) continue;
    const arch = sk && sk.archetype;
    sum += THREAT_ARCH[arch] != null ? THREAT_ARCH[arch] : 5;
    if (ADV.Campaign && ADV.Campaign.isTankSkill && ADV.Campaign.isTankSkill(e.skillId)) sum += 6;
  }
  let base = clampThreat(40 + sum, 15, 160);
  if (ch.boss || ch.isGod || ch.status === 'hero' || isGod(ch)) base = Math.round(base * 1.3);
  return base;
};
Combat.threatOf = function (u) {
  if (!u || u.downed || u.fled || u.reserved) return 0;
  if (u.stealth) return 0;
  return (u.threat || 0) + (u.threatDamage || 0);
};
Combat.addThreat = function (st, u, n, why) {
  if (!u || !n) return u;
  const before = u.threat || 0;
  u.threat = Math.max(0, Math.round(before + n));
  if (why) u.threatWhy = why;
  if (st && Math.abs(u.threat - before) >= 8) ev(st, { t: 'threat', uid: u.uid, n: u.threat - before, why: why || '', value: u.threat });
  return u;
};
Combat.resetThreat = function (st, side) {
  for (const u of (st.units || [])) {
    if (u.side !== side || u.reserved) continue;
    u.threat = u.threatBase || Combat.threatBaseFor(u.ch);
    u.threatDamage = 0;
    u.threatWhy = 'base';
  }
  if (st) ev(st, { t: 'threatReset', side });
};
Combat.threatLeader = function (st, side) {
  const live = livingUnits(st, side);
  if (!live.length) return null;
  let best = live[0], bestV = Combat.threatOf(best), tied = false;
  for (let i = 1; i < live.length; i++) {
    const v = Combat.threatOf(live[i]);
    if (v > bestV) { best = live[i]; bestV = v; tied = false; }
    else if (v === bestV) tied = true;
  }
  if (bestV <= 0 || tied) return null;
  return best;
};
function expectedHit(st, u, t) {
  try {
    const m = manifestFor(u, 'basic_attack');
    return computeDamage(st, u, t, m);
  } catch (e) {
    return Math.max(1, Math.round(Ch().effStat(u.ch, 'atk') * 2) - Math.max(0, Ch().effStat(t.ch, 'def')));
  }
}
function noteDamageShare(st, src, dealt) {
  if (!src || !dealt || src.downed) return;
  src.damageDealt = (src.damageDealt || 0) + dealt;
  const living = livingUnits(st, src.side);
  if (!living.length) return;
  const share = living.reduce((s, x) => s + (x.damageDealt || 0), 0) / living.length;
  const excess = Math.max(0, src.damageDealt - share);
  src.threatDamage = Math.min(90, Math.round(excess / Math.max(1, share) * 45));
  if (src.threatDamage > 0) src.threatWhy = 'damage share';
  for (const x of living) {
    if (x === src) continue;
    const ex = Math.max(0, (x.damageDealt || 0) - share);
    x.threatDamage = Math.min(90, Math.round(ex / Math.max(1, share) * 45));
  }
}
Combat.threatTargets = function (st, u, pool) {
  const list = (pool || []).filter(x => x && !x.downed && !x.fled && !x.reserved);
  if (!list.length) return [];
  if (u && u.marksBy && u.marksBy.length) {
    const forced = list.filter(x => u.marksBy.includes(x.uid));
    if (forced.length) return forced.slice();
  }
  const rng = (st && st.rng) || { float: () => 0.5 };
  const weights = list.map(t => {
    let w = Math.max(1, Combat.threatOf(t));
    const hp = (t.chp || 0) + (t.tempHp || 0);
    if (u && hp > 0 && hp <= expectedHit(st, u, t)) w *= 2.5;
    if (t.ch && Sys().knownVal(t.ch, 'targetedLast')) w *= 0.35;
    if (u && t.lane === u.lane) w *= 1.35;
    return Math.max(0.01, w);
  });
  let total = weights.reduce((s, w) => s + w, 0);
  const floor = total * 0.08;
  for (let i = 0; i < weights.length; i++) if (weights[i] < floor) { total += floor - weights[i]; weights[i] = floor; }
  const scored = list.map((t, i) => ({ t, key: rng.float() / weights[i] }));
  scored.sort((a, b) => a.key - b.key);
  return scored.map(x => x.t);
};

Combat.evadeChance = function (st, u, opts) {
  opts = opts || {};
  if (!u || u.downed) return 0;
  if (opts.cannotMiss) return 0;
  if (opts.tag === 'dot' || opts.tag === 'reflect' || opts.tag === 'retaliation') return 0;
  if (u.statuses && u.statuses.some(s => s.kind === 'runic')) return 0;
  let p = 0;
  const perk = u.ch ? Sys().knownVal(u.ch, 'evadePct') : 0;
  if (perk) p += perk;
  for (const s of u.statuses || []) if (s.kind === 'aura' && s.evadePct) p += s.evadePct;
  return Math.max(0, Math.min(0.75, p));
};

function tryEvade(st, src, tgt, tag, opts) {
  opts = opts || {};
  if (!src || !tgt) return false;
  if (opts.cannotMiss || tag === 'dot' || tag === 'reflect' || tag === 'retaliation' || tag === 'smite') return false;
  const pct = Math.max(0, Combat.evadeChance(st, tgt, Object.assign({}, opts, { tag })) - (ADV.GatePerkCombat ? ADV.GatePerkCombat.evasionCut(src) : 0));
  if (pct > 0 && st.rng && st.rng.float() < pct) {
    ev(st, { t: 'evade', uid: tgt.uid, by: src.uid, pct: true, power: opts.power || 0 });
    return true;
  }
  if (tgt.evade > 0) {
    tgt.evade--;
    if (ADV.GatePerkCombat && ADV.GatePerkCombat.bypassDodge(st, src)) return false;
    ev(st, { t: 'evade', uid: tgt.uid, by: src.uid, power: opts.power || 0 });
    return true;
  }
  return false;
}

function initUnitThreat(u) {
  if (!u) return;
  u.threatBase = Combat.threatBaseFor(u.ch);
  u.threat = u.threatBase;
  u.threatWhy = 'base';
}

// ---- lane geometry & positional casting rules -------------------------------
const LANE_IDX = { front: 0, mid: 1, back: 2 };
// Restorative healing on OTHERS requires standing exactly one lane behind the
// target (self-healing works anywhere).
// Healing reaches any ally in any lane (request: allies must be healable).
function canHealOther(caster, tgt) { return true; }
// Protective (tank-style) support requires being on the target's lane or a
// lane ahead of them — you shield what stands behind you.
function canWard(caster, tgt) {
  // Wards reach any ally in any lane, same as heals.
  return !!(caster && tgt);
}

// -------------------------------------------------------------- lane layout
function layoutSide(units) {
  // Highest-threat kits fill front first; healers keep mid; explicit inclination wins.
  const backish = ['mage', 'ranger'];
  const midish = ['healer'];
  const frontish = ['tank', 'fighter', 'druid'];
  const lanes = { front: [], mid: [], back: [] };
  const solo = units.length === 1;
  const live = units.filter(u => !u.reserved);

  function place(u, prefer) {
    const order = prefer === 'front' ? ['front', 'mid', 'back'] :
                  prefer === 'back' ? ['back', 'mid', 'front'] : ['mid', 'front', 'back'];
    for (const L of order) {
      if (lanes[L].length < C().LANE_CAP) {
        lanes[L].push(u); u.lane = L; u.slot = lanes[L].length - 1;
        return;
      }
    }
    u.reserved = true;
  }

  if (solo) {
    for (const u of live) place(u, 'front');
    return lanes;
  }

  const explicit = [];
  const rest = [];
  for (const u of live) {
    if (u.ch.archetypeInclination && u.ch.archetypeInclination[0]) explicit.push(u);
    else rest.push(u);
  }
  for (const u of explicit) {
    const inc = u.ch.archetypeInclination[0];
    let lane = 'mid';
    if (frontish.includes(inc)) lane = 'front';
    else if (midish.includes(inc)) lane = 'mid';
    else if (backish.includes(inc)) lane = 'back';
    place(u, lane);
  }
  const healers = rest.filter(u => midish.includes(mainArchetype(u.ch)));
  const others = rest.filter(u => !midish.includes(mainArchetype(u.ch)));
  others.sort((a, b) => (b.threatBase || Combat.threatBaseFor(b.ch)) - (a.threatBase || Combat.threatBaseFor(a.ch)));
  for (const u of healers) place(u, 'mid');
  const cap = C().LANE_CAP;
  const frontBound = [];
  const backBound = [];
  for (const u of others) {
    const arch = mainArchetype(u.ch);
    const tb = u.threatBase || Combat.threatBaseFor(u.ch);
    if (backish.includes(arch) || tb < 45) backBound.push(u);
    else frontBound.push(u);
  }
  while (frontBound.length && lanes.front.length < cap) place(frontBound.shift(), 'front');
  for (const u of frontBound) place(u, 'mid');
  for (const u of backBound) {
    const arch = mainArchetype(u.ch);
    const tb = u.threatBase || Combat.threatBaseFor(u.ch);
    place(u, (backish.includes(arch) || tb < 45) ? 'back' : 'mid');
  }
  if (!lanes.front.length) {
    const src = lanes.mid.length ? 'mid' : 'back';
    const u = lanes[src].shift();
    if (u) {
      lanes.front.push(u); u.lane = 'front'; u.slot = 0;
      lanes[src].forEach((x, i) => { x.slot = i; });
    }
  }
  return lanes;
}

function mainArchetype(ch) {
  const counts = {};
  for (const e of ch.actives.concat(ch.perks)) {
    const sk = SK()[e.skillId];
    if (sk && sk.archetype) counts[sk.archetype] = (counts[sk.archetype] || 0) + 1;
  }
  let best = null, n = 0;
  for (const [k, v] of Object.entries(counts)) if (v > n) { best = k; n = v; }
  return best || 'fighter';
}

// ---------------------------------------------------------------- creation
// sideA/sideB: arrays of characters. opts: {ambushBy: characterId, rng}
Combat.create = function (charsA, charsB, opts) {
  opts = opts || {};
  if (ADV.Character.syncNpcHeroFloor) ADV.Character.syncNpcHeroFloor((charsA || []).concat(charsB || []));
  const rng = opts.rng || new ADV.RNG(12345);
  const st = {
    rng, round: 0, events: [], over: false, winner: null,
    units: [], reservesA: [], reservesB: [],
    ambushUid: null, turnQueue: [], turnIdx: 0,
    context: opts.context || 'quest',
    hazards: [],                              // lane hazards: {side, lane, kind, power, rounds, srcUid, srcAtk}
    questTier: opts.questTier || 1,           // Paid Shot scaling
    encounterIndex: opts.encounterIndex || 0, // Veteran's Cut scaling
    leaderId: opts.leaderId || null,
    leaderDowned: false,
    leaderFell: false,
    leaderFled: false,
    dotHopDone: false,
    turnsSinceHatred: 99,
    hatredSpoken: {},
  };
  let i = 0;
  for (const ch of charsA) st.units.push(makeUnit(ch, 'a', i++));
  i = 0;
  for (const ch of charsB) st.units.push(makeUnit(ch, 'b', i++));
  for (const u of st.units) initUnitThreat(u);
  // field cap
  for (const side of ['a', 'b']) {
    const mine = st.units.filter(u => u.side === side);
    mine.slice(C().FIELD_CAP).forEach(u => { u.reserved = true; });
    layoutSide(mine);
  }
  if (opts.ambushBy) {
    const u = st.units.find(x => x.ch.id === opts.ambushBy);
    if (u) st.ambushUid = u.uid;
  }
  ev(st, { t: 'start', ambush: !!st.ambushUid });
  if (ADV.GatePerkCombat) ADV.GatePerkCombat.start(st);
  startRound(st);
  for (const u of st.units) refreshFreeBuffs(st, u);
  return st;
};

const {ev} = ADV.CombatModules.events({});

function livingUnits(st, side) {
  return st.units.filter(u => u.side === side && !u.downed && !u.fled && !u.reserved);
}

function battleUseCount(u, skillId) {
  const v = u && u.usedOncePerBattle && u.usedOncePerBattle[skillId];
  if (!v) return 0;
  return v === true ? 1 : v;
}

function battleUseLimit(d) {
  if (!d) return 0;
  if (d.usesPerBattle != null) return d.usesPerBattle;
  if (d.reviveUses != null) return d.reviveUses;
  if (d.oncePerBattle) return 1;
  return 0;
}

function canSpendBattleUse(u, skillId, d) {
  const limit = battleUseLimit(d);
  if (!limit) return true;
  return battleUseCount(u, skillId) < limit;
}

function spendBattleUse(u, skillId) {
  u.usedOncePerBattle = u.usedOncePerBattle || {};
  u.usedOncePerBattle[skillId] = battleUseCount(u, skillId) + 1;
}

function downedAllies(st, side) {
  return st.units.filter(x => x.side === side && x.downed && !x.fled && !x.reserved);
}

function pickReviveTargets(st, side, preferred, n) {
  const downed = downedAllies(st, side);
  const lead = st.leaderId ? downed.find(x => x.ch && x.ch.id === st.leaderId) : null;
  const out = [];
  if (preferred && preferred.downed && downed.includes(preferred)) out.push(preferred);
  else if (lead) out.push(lead);
  if (lead && !out.includes(lead)) out.push(lead);
  for (const x of downed) {
    if (out.length >= n) break;
    if (!out.includes(x)) out.push(x);
  }
  return out.slice(0, n);
}

function applyRevive(st, src, tgt, d, skillId) {
  const pct = d.reviveHp != null ? d.reviveHp : 0.4;
  tgt.downed = false;
  tgt.chp = Math.max(1, Math.round(tgt.maxHp * pct));
  if (d.shieldHits) addStatus(st, tgt, { kind: 'ward', hits: d.shieldHits, reflect: !!d.wardReflect });
  if (d.reviveAtkMult) addStatus(st, tgt, { kind: 'atkBuff', mult: d.reviveAtkMult, rounds: d.reviveBuffRounds || 2 });
  if (d.reviveStealthRounds) {
    applyStealth(tgt, d.reviveStealthRounds);
    ev(st, { t: 'stealth', uid: tgt.uid });
  }
  if (d.reviveEvade) tgt.evade += d.reviveEvade;
  if (d.grantSelfTurn) Combat.grantTurn(st, src || tgt, tgt, d.grantSelfTurn);
  // Part B3/C3: the mark the risen wears, and the reviver's word (once per fight, guaranteed)
  const arch = skillArchetype(skillId);
  if (arch === 'druid' || arch === 'healer') healCleanse(st, tgt, 'all', src ? src.uid : null);
  if (arch === 'druid') addStatus(st, tgt, { kind: 'grove', rounds: d.buffRounds || d.reviveBuffRounds || 3, srcUid: src ? src.uid : null });
  else if (arch === 'healer') addStatus(st, tgt, { kind: 'wings', rounds: d.reviveBuffRounds || 2, srcUid: src ? src.uid : null });
  ev(st, { t: 'revive', uid: tgt.uid, by: src ? src.uid : tgt.uid, skillId: skillId || null, arch });
  if (st.leaderId && tgt.ch && tgt.ch.id === st.leaderId) {
    st.leaderDowned = false;
    st.leaderFell = false;
  }
  if (src) Combat.addThreat(st, src, 40, 'healing');
  if (src && (arch === 'druid' || arch === 'healer')) {
    st.revLines = st.revLines || {};
    const first = !st.revLines[src.uid];
    if (first || st.rng.chance(0.35)) {
      st.revLines[src.uid] = (st.revLines[src.uid] || 0) + 1;
      const table = (ADV.DATA.REVIVE_LINES && ADV.DATA.REVIVE_LINES[arch]) || [];
      if (table.length) {
        const text = table[Math.abs(((src.ch.id || '').length * 31 + st.round)) % table.length];
        ev(st, { t: 'line', uid: src.uid, target: tgt.uid, kind: arch, text, tag: arch === 'healer' ? 'warm' : 'flat' });
      }
    }
  }
}

function trySelfRevive(st, u) {
  if (!u || !u.ch) return false;
  for (const e of (u.ch.actives || [])) {
    const m = manifestFor(u, e.skillId);
    if (!m || !m.data.selfRevive) continue;
    if (!canSpendBattleUse(u, e.skillId, m.data)) continue;
    spendBattleUse(u, e.skillId);
    applyRevive(st, u, u, m.data, e.skillId);
    const lv = Sys().recordUse(u.ch, e.skillId);
    if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId: e.skillId, level: lv.level, tier: lv.tier });
    recordSighting(st, u, e.skillId, m.tier);
    return true;
  }
  return false;
}
Combat.living = livingUnits;

// ---- lane movement (add-on §3) --------------------------------------------
// Pulls, hooks and shoves all come through here. Sea Legs, Bear Stance, Close
// Order and Stone Stance make a unit immovable; Chain-and-Weight roots it.
function isImmovable(u) {
  if (u.statuses.some(x => x.kind === 'immovable')) return true;
  for (const e of u.ch.perks) { const sk = SK()[e.skillId]; if (sk && sk.immovable) return true; }
  return false;
}
function laneClosed(st, u) {
  return livingUnits(st, u.side).some(x => x.lane === u.lane && x.statuses.some(y => y.kind === 'closed'));
}
Combat.moveLane = function (st, u, toLane) {
  if (!toLane || toLane === u.lane) return false;
  if (isImmovable(u) || laneClosed(st, u) || u.statuses.some(x => x.kind === 'rooted')) {
    ev(st, { t: 'heldFast', uid: u.uid }); return false;
  }
  const occupants = laneUnits(st, u.side, toLane).length;
  if (occupants >= C().LANE_CAP) return false;
  u.lane = toLane; u.slot = occupants;
  ev(st, { t: 'moved', uid: u.uid, lane: toLane });
  return true;
};
// Drag a unit `n` lanes toward the front of its own side.
Combat.pullForward = function (st, u, n) {
  const order = ['back', 'mid', 'front'];
  let idx = order.indexOf(u.lane);
  let moved = false;
  for (let i = 0; i < (n || 1) && idx < order.length - 1; i++) {
    if (!Combat.moveLane(st, u, order[idx + 1])) break;
    idx++; moved = true;
  }
  return moved;
};

function laneUnits(st, side, lane) {
  return livingUnits(st, side).filter(u => u.lane === lane);
}

// -------------------------------------------------------- turn order (§15)
const {buildTurnQueue} = ADV.CombatModules.turns({Ch:(...args)=>Ch(...args), livingUnits:(...args)=>livingUnits(...args), Sys:(...args)=>Sys(...args), perkVal:(...args)=>perkVal(...args), Combat, ev:(...args)=>ev(...args)});

function beastShapeUp(u) {
  return !!(u && u.statuses.some(s => s.kind === 'beastShape'));
}

const BEASTS = ['werewolf', 'werebear', 'panther'];
Combat.BEASTS = BEASTS;
// C1: the portrait becomes the beast. Some forms have a fixed animal; the rest roll.
function beastFor(st, skillId) {
  if (skillId === 'bear_stance') return 'werebear';
  if (skillId === 'warhound_form') return 'hound';
  if (skillId === 'serpent_form') return 'serpent';
  if (skillId === 'fox_form') return 'fox';
  if (skillId === 'storm_shape') return 'storm';
  // These are disciplined human stances, not an arbitrary animal disguise.
  if (skillId === 'marine_form') return 'marine';
  if (skillId === 'sea_dog_form') return 'sea_dog';
  if (skillId === 'spellblade_form') return 'spellblade';
  if (skillId === 'unbroken_form') return 'unbroken';
  if (skillId === 'wild_form') return 'wild';
  return st.rng.pick(BEASTS);
}
function applyForm(st, u, skillId, rounds) {
  let beast = beastFor(st, skillId);
  if(skillId==='fox_form'){
    const tier=manifestFor(u,skillId)?.tier;
    beast=tier==='advanced'?'fox_nine':tier==='intermediate'?'fox_three':'fox';
  }
  const old = u.statuses.find(x => x.kind === 'form');
  if (old) removeStatus(u, old);
  u.form = beast;
  addStatus(st, u, { kind: 'form', beast, rounds: rounds || 3, skillId });
  ev(st, { t: 'shapeshift', uid: u.uid, beast, skillId });
  return beast;
}
Combat.applyForm = applyForm;
Combat.isShapeshift = function (skillId) { const d = SK()[skillId]; return !!(d && (d.shapeshift || skillId === 'beast_shape' || /_form$|bear_stance|storm_shape/.test(skillId))); };
function applyBeastShape(st, u, m, skillId) {
  if (!u || !m) return false;
  const d = m.data || {};
  const already = beastShapeUp(u);
  if (!already) applyForm(st, u, skillId || 'beast_shape', d.rounds || 3);
  addStatus(st, u, {
    kind: 'beastShape',
    mult: d.atkMult || 1.25,
    lifeSteal: d.lifeSteal || 0,
    splashAdjacent: !!d.splashAdjacent,
    rounds: d.rounds || 3,
  });
  if (!already) {
    const lv = Sys().recordUse(u.ch, skillId || 'beast_shape');
    if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId: skillId || 'beast_shape', level: lv.level, tier: lv.tier });
  }
  return !already;
}

function refreshFreeBuffs(st, u) {
  if (!u || u.downed || u.fled || u.reserved) return;
  for (const e of u.ch.actives || []) {
    const m = manifestFor(u, e.skillId);
    if (!m || !m.data.freeBuff) continue;
    const seal = u.statuses.find(x => x.kind === 'sealed');
    if (seal && (seal.tiers || []).includes(m.tier)) continue;
    if (e.skillId === 'beast_shape' || m.data.atkMult) {
      if (!beastShapeUp(u)) applyBeastShape(st, u, m, e.skillId);
    }
  }
}
Combat.refreshFreeBuffs = refreshFreeBuffs;

function startRound(st) {
  st.round++;
  tickCooldowns(st);
  for (const u of st.units) {
    u.delayed = 0; u.attackedThisRoundBy = [];
    u.rangerUsesLeft = Sys().knownVal(u.ch, 'rangerExtraUse') || 0;
    // A counter stance expires on its own clock; leftover charges do not carry.
    if (u.counterUntil != null && st.round > u.counterUntil) {
      u.counter = 0; u.counterUntil = null; u.counterRiposte = null;
    }
  }
  reviveTheFallen(st);
  // scripted reinforcements (The Quiet raises the Risen mid-fight, §6a)
  if (st.spawnQueue) {
    for (const spec of st.spawnQueue.filter(x => x.round === st.round)) Combat.spawnReinforcement(st, spec.ch, spec.side || 'b');
  }
  buildTurnQueue(st);
  st.turnIdx = 0;
  // plan intents for everyone (telegraphed ally intent, §4)
  for (const u of st.units) {
    if (u.downed || u.fled || u.reserved) continue;
    if (!u.ch.isPlayer) u.planned = Combat.planFor(st, u);
  }
  ev(st, { t: 'round', n: st.round, order: st.turnQueue.map(e => e.uid) });
}

// Whose turn is it? Returns {unit, isPlayer} or advances rounds; null if over.
Combat.currentTurn = function (st) {
  if (st.over) return null;
  while (true) {
    if (st.turnIdx >= st.turnQueue.length) {
      endRoundTicks(st);
      if (st.over) return null;
      startRound(st);
    }
    const entry = st.turnQueue[st.turnIdx];
    const u = st.units.find(x => x.uid === entry.uid);
    if (!u || u.downed || u.fled || u.reserved) { st.turnIdx++; continue; }
    if (entry.extra && !entry.extraShown) { entry.extraShown = true; ev(st, { t: 'extraTurn', uid: u.uid }); }
    if (u.loseNextAction) {
      u.loseNextAction = false;
      breakMomentum(u);
      ev(st, { t: 'skip', uid: u.uid, reason: 'bound' });
      st.turnIdx++; tickHatredClock(st); continue;
    }
    const fz = u.statuses.find(x => x.kind === 'frozen');
    if (fz) {
      fz.skips = (fz.skips || 1) - 1;
      breakMomentum(u);
      ev(st, { t: 'skip', uid: u.uid, reason: 'frozen' });
      if (fz.skips <= 0) {
        removeStatus(u, fz);
        // thaw immunity: no re-freeze stunlock (3 rounds)
        u.statuses.push({ kind: 'freezeImmune', rounds: 3 });
      }
      st.turnIdx++; tickHatredClock(st); continue;
    }
    refreshFreeBuffs(st, u);
    if (ADV.GatePerkCombat) ADV.GatePerkCombat.turn(st, u);
    return { unit: u, isPlayer: !!u.ch.isPlayer };
  }
};

function tickHatredClock(st) {
  st.turnsSinceHatred = (st.turnsSinceHatred == null ? 99 : st.turnsSinceHatred) + 1;
}

Combat.advance = function (st) {
  st.basicBudget = null;          // no action in flight: end-of-round ticks are not charged to one
  const entry = st.turnQueue[st.turnIdx];
  const u = entry && st.units.find(x => x.uid === entry.uid);
  if (u) u.freeActionUsed = false;
  st.turnIdx++;
  tickHatredClock(st);
  checkEnd(st);
};

// Named guild foes (assassination, ambush, rival intercept) each get one
// hatred line. After anyone speaks, the next speaker waits two turns.
Combat.hatredRemarkDue = function (st, opts) {
  opts = opts || {};
  if (!st) return null;
  const since = st.turnsSinceHatred == null ? 99 : st.turnsSinceHatred;
  const spoken = st.hatredSpoken || {};
  const foeSide = opts.foeSide || 'b';
  const cands = (st.units || []).filter(u => {
    const ch = u.ch;
    if (!ch || u.downed || u.fled || u.reserved) return false;
    if (u.side !== foeSide) return false;
    if (ch.isPlayer || ch.isQuestThrall) return false;
    if (ch.isUndead && !ch.boss && !isGod(ch)) return false;
    if (ch.isMonster && !ch.boss && !isGod(ch)) return false;
    if (ch.noCombatVoice) return false;          // story campaigns: no stock or monster barks in a fight
    if (spoken[ch.id]) return false;
    return true;
  });
  if (!cands.length) return null;
  const acting = opts.acting;
  const pick = acting && cands.indexOf(acting) >= 0 ? acting : cands[0];
  const already = Object.keys(spoken).length;
  if (!already) return pick;
  if (since < 2) return null;
  return pick;
};

Combat.noteHatredRemark = function (st, ch) {
  if (!st || !ch) return;
  st.hatredSpoken = st.hatredSpoken || {};
  st.hatredSpoken[ch.id] = true;
  st.turnsSinceHatred = 0;
};

// -------------------------------------------------------------- targeting
const {canMelee} = ADV.CombatModules.targeting({laneUnits:(...args)=>laneUnits(...args), Combat, manifestFor:(...args)=>manifestFor(...args), livingUnits:(...args)=>livingUnits(...args), downedAllies:(...args)=>downedAllies(...args), canHealOther:(...args)=>canHealOther(...args), canWard:(...args)=>canWard(...args), Sys:(...args)=>Sys(...args), foeSideOf:(...args)=>foeSideOf(...args)});

Combat.skillAutocasts = function (u, action) {
  if (!u || !action || action.isBribe) return false;
  const skillId = action.isAttack ? 'basic_attack' : action.skillId;
  const m = manifestFor(u, skillId);
  if (!m) return false;
  const d = m.data;
  let target = d.target;
  if (action.off && d.offensive) target = d.offensive.target || 'enemy';
  if (d.selfRevive || d.freeBuff) return true;
  // enemyFront picks its own row and targetHighestHp picks its own victim, so neither needs
  // the caller to name one — same as the other skills that choose for themselves.
  if (target === 'self' || target === 'party' || target === 'allEnemies' || target === 'postVictory'
    || target === 'enemyFront' || d.targetHighestHp) return true;
  const heal = d.heal && !action.off;
  if (u.marksBy.length && !heal && target !== 'ally' && target !== 'allyLane') {
    const pool = action.pool || [];
    return pool.length === 1 && u.marksBy.includes(pool[0].uid);
  }
  return false;
};

// Lowest current health in a target pool (temp HP counts). Ties keep the
// first unit so auto-target is deterministic.
Combat.lowestHealth = function (pool) {
  if (!pool || !pool.length) return null;
  let best = pool[0];
  let bestHp = best.chp + (best.tempHp || 0);
  for (let i = 1; i < pool.length; i++) {
    const u = pool[i];
    const hp = u.chp + (u.tempHp || 0);
    if (hp < bestHp) { best = u; bestHp = hp; }
  }
  return best;
};

Combat.skillNeedsAuto = function (ch, skillId, offensiveMode) {
  if (skillId === 'basic_attack') return true;
  const sk = SK()[skillId];
  if (!sk || sk.target === 'postVictory') return false;
  const entry = ch && Sys().entryFor(ch, skillId);
  const data = entry ? Sys().manifest(ch, entry).data : sk;
  let tgt = data.target;
  if (offensiveMode && data.offensive) tgt = data.offensive.target || 'enemy';
  if (data.freeBuff) return false;
  if (data.selfRevive) return false;
  return !!tgt;
};

Combat.clearAutoFlags = function (ch) {
  if (!ch) return;
  ch.autoAttack = false;
  ch.autoRepeat = null;
  ch.autoOrder = [];
  ch.autoIdx = 0;
  ch.autoAdopted = true;
  for (const e of (ch.actives || []).concat(ch.perks || [])) {
    if (e.auto || e.autoOff) {
      e.auto = false;
      e.autoOff = false;
      Sys().storeProgress(ch, e);
    }
  }
};

function sameAuto(a, skillId, off) {
  return a && a.skillId === skillId && !!a.off === !!off;
}

// Queue of auto skills, oldest first. Older saves only have a single
// autoRepeat / per-skill flag — fold those in once, then autoOrder is law.
// An empty list after that means the player turned everything off.
Combat.autoList = function (ch) {
  if (!ch) return [];
  let stored = (ch.autoOrder || []).filter(x => x && x.skillId);
  if (!stored.length && !ch.autoAdopted) {
    if (ch.autoRepeat && ch.autoRepeat.skillId) stored.push({ skillId: ch.autoRepeat.skillId, off: !!ch.autoRepeat.off });
    if (ch.autoAttack && !stored.some(x => sameAuto(x, 'basic_attack', false))) stored.push({ skillId: 'basic_attack', off: false });
    for (const e of ch.actives || []) {
      if (e.autoOff && !stored.some(x => sameAuto(x, e.skillId, true))) stored.push({ skillId: e.skillId, off: true });
      else if (e.auto && !stored.some(x => sameAuto(x, e.skillId, false))) stored.push({ skillId: e.skillId, off: false });
    }
  }
  ch.autoOrder = stored;
  ch.autoAdopted = true;
  const list = stored.filter(x => x.skillId === 'basic_attack' || Sys().entryFor(ch, x.skillId));
  ch.autoAttack = list.some(x => sameAuto(x, 'basic_attack', false));
  ch.autoRepeat = list[0] || null;
  return list;
};

Combat.ensureAutoRepeat = function (ch) {
  const list = Combat.autoList(ch);
  return list[0] || null;
};

Combat.skillAutoOn = function (ch, skillId, offensiveMode) {
  return Combat.autoList(ch).some(x => sameAuto(x, skillId, offensiveMode));
};

Combat.setSkillAuto = function (ch, skillId, on, offensiveMode) {
  Combat.autoList(ch);
  const list = ch.autoOrder || (ch.autoOrder = []);
  const off = !!offensiveMode;
  const i = list.findIndex(x => sameAuto(x, skillId, off));
  if (on && i < 0) list.push({ skillId, off });
  if (!on && i >= 0) list.splice(i, 1);
  ch.autoAdopted = true;
  if (skillId === 'basic_attack' && !off) ch.autoAttack = !!on && list.some(x => sameAuto(x, 'basic_attack', false));
  if (!on && ch.autoRepeat && sameAuto(ch.autoRepeat, skillId, off)) ch.autoRepeat = list[0] || null;
  const live = Combat.autoList(ch);
  ch.autoIdx = live.length ? ((ch.autoIdx || 0) % live.length) : 0;
  if (skillId === 'basic_attack') return;
  const e = Sys().entryFor(ch, skillId);
  if (!e) return;
  e.auto = live.some(x => sameAuto(x, skillId, false));
  e.autoOff = live.some(x => sameAuto(x, skillId, true));
  Sys().storeProgress(ch, e);
};

function autoUsable(st, u, r) {
  if (!r) return null;
  if (r.skillId !== 'basic_attack' && !Sys().entryFor(u.ch, r.skillId)) return null;
  const m = manifestFor(u, r.skillId);
  if (!m) return null;
  const d = m.data;
  const seal = u.statuses.find(x => x.kind === 'sealed');
  if (seal && r.skillId !== 'basic_attack' && (seal.tiers || []).includes(m.tier)) return null;
  if (d.interrupt && u.statuses.some(x => x.kind === 'shock' || x.kind === 'shocked')) return null;
  if (d.reload && u.reloadLock[r.skillId] && !perkVal(u.ch, 'powder_discipline', 'noReload')) return null;
  if (d.openerOnly && u.actedThisEncounter) return null;
  if (d.freeBuff) return null;
  if (d.freeAction && u.freeActionUsed) return null;
  if (cooldownLeft(u, r.skillId) > 0) return null;
  if (d.selfRevive) return null;
  if (d.revive && !canSpendBattleUse(u, r.skillId, d)) return null;
  let pool = Combat.validTargets(st, u, r.skillId, r.off);
  if (!pool.length) return null;
  const off = r.off && d.offensive;
  if (!off && d.heal && (d.power || d.hotRounds || d.healFromTaken) && !d.shieldHits && !d.shieldRounds) {
    const needy = pool.filter(x => x.downed || x.chp < x.maxHp);
    if (!needy.length) return null;
    pool = needy;
  }
  const hostile = pool[0] && pool[0].side !== u.side;
  const lead = !hostile && st.leaderId ? pool.find(x => x.ch && x.ch.id === st.leaderId) : null;
  const tgt = hostile ? (Combat.threatTargets(st, u, pool)[0] || null)
    : ((d.revive && lead) || Combat.lowestHealth(pool));
  if (!tgt) return null;
  return {
    action: { skillId: r.skillId, off: !!r.off, isAttack: r.skillId === 'basic_attack', pool },
    tgt,
  };
}

// NPC heroes and villains (never the player) smite the healthiest foe once
// per battle: leave them at 10% of the HP they had, after a hatred line.
Combat.tryNpcSmite = function (st, u) {
  if (!u || !u.ch || u.ch.isPlayer) return false;
  if (u.ch.status !== 'hero' && u.ch.status !== 'villain') return false;
  if (u.usedOncePerBattle && u.usedOncePerBattle.npcSmite) return false;
  const foes = livingUnits(st, u.side === 'a' ? 'b' : 'a').filter(x => ADV.GatePerkCombat ? ADV.GatePerkCombat.canTarget(u, x) : !x.untargetable);
  if (!foes.length) return false;
  let tgt = foes[0];
  let best = tgt.chp + (tgt.tempHp || 0);
  for (let i = 1; i < foes.length; i++) {
    const hp = foes[i].chp + (foes[i].tempHp || 0);
    if (hp > best) { tgt = foes[i]; best = hp; }
  }
  u.usedOncePerBattle = u.usedOncePerBattle || {};
  u.usedOncePerBattle.npcSmite = true;
  const leave = Math.max(1, Math.ceil(best * 0.1));
  const dmg = Math.max(0, best - leave);
  ev(st, { t: 'npcSmite', uid: tgt.uid, by: u.uid, dmg });
  if (dmg > 0) applyRawDamage(st, u, tgt, dmg, 'smite');
  return true;
};

// Ready-to-fire player auto: the next skill in the rotation that has a target.
Combat.autoReadyAction = function (st, u) {
  const list = Combat.autoList(u.ch);
  if (!list.length) return null;
  const n = list.length;
  const start = ((u.ch.autoIdx || 0) % n + n) % n;
  for (let k = 0; k < n; k++) {
    const ready = autoUsable(st, u, list[(start + k) % n]);
    if (!ready) continue;
    u.ch.autoIdx = (start + k + 1) % n;
    return ready;
  }
  return null;
};

// A living foe the player can actually swing at. Vanish empties this for
// one round; self-heals can stay legal and are not a hit.
Combat.hasOffensiveTarget = function (st, u) {
  return Combat.playerTargets(st, u, 'basic_attack', false).length > 0;
};

// True if the unit can spend the turn on a skill or a basic attack. Smoke and
// cover can empty every pool; the UI must still let the turn pass.
Combat.hasLegalCombatAction = function (st, u) {
  const seal = u.statuses.find(x => x.kind === 'sealed');
  for (const e of u.ch.actives || []) {
    const sk = SK()[e.skillId];
    if (!sk || sk.target === 'postVictory') continue;
    const m = manifestFor(u, e.skillId);
    if (!m) continue;
    if (seal && (seal.tiers || []).includes(m.tier)) continue;
    if (Combat.validTargets(st, u, e.skillId, false).length) return true;
    if (m.data.offensive && Combat.validTargets(st, u, e.skillId, true).length) return true;
  }
  return Combat.validTargets(st, u, 'basic_attack', false).length > 0;
};

function manifestFor(u, skillId) {
  if (skillId === 'basic_attack') {
    const sk = SK().basic_attack;
    return { skill: sk, tier: 'basic', level: 1, data: Object.assign({}, sk, sk.tiers.basic) };
  }
  const entry = u.ch.actives.find(a => a.skillId === skillId) || u.ch.perks.find(p => p.skillId === skillId);
  if (!entry) return null;
  const m = Sys().manifest(u.ch, entry);
  return ADV.Campaign3?.combatManifest ? ADV.Campaign3.combatManifest(u, skillId, m) : m;
}
Combat.manifestFor = manifestFor;
Combat.canSpendBattleUse = canSpendBattleUse;
Combat.battleUseCount = battleUseCount;

// ------------------------------------------------------------- damage core
const {computeDamage, dealDamage, addExposed, applyTakenReduction, openBasicBudget, applyRawDamage} = ADV.CombatModules.damage({Ch:(...args)=>Ch(...args), Sys:(...args)=>Sys(...args), SK:(...args)=>SK(...args), C:(...args)=>C(...args), perkVal:(...args)=>perkVal(...args), LANE_IDX, livingUnits:(...args)=>livingUnits(...args), POS_STATUSES, isGod:(...args)=>isGod(...args), removeStatus:(...args)=>removeStatus(...args), ev:(...args)=>ev(...args), tryEvade:(...args)=>tryEvade(...args), addStatus:(...args)=>addStatus(...args), healUnit:(...args)=>healUnit(...args), findGuard:(...args)=>findGuard(...args), manifestFor:(...args)=>manifestFor(...args), laneUnits:(...args)=>laneUnits(...args), noteDamageShare:(...args)=>noteDamageShare(...args), Combat, checkEnd:(...args)=>checkEnd(...args), onUnitDown:(...args)=>onUnitDown(...args), applyStealth:(...args)=>applyStealth(...args), HIDE_CAP});

Combat.spawnReinforcement = function (st, ch, side) {
  const idx = st.units.filter(x => x.side === side).length;
  ch.combatHp = null;
  const u = makeUnit(ch, side, idx);
  initUnitThreat(u);
  st.units.push(u);
  const lanes = { front: laneUnits(st, side, 'front'), mid: laneUnits(st, side, 'mid'), back: laneUnits(st, side, 'back') };
  for (const L of ['front', 'mid', 'back']) {
    if (lanes[L].length < C().LANE_CAP) { u.lane = L; u.slot = lanes[L].length; break; }
  }
  if (!u.lane) u.reserved = true;
  ev(st, { t: 'reinforce', uid: u.uid, lane: u.lane, name: ch.name });
  return u;
};

function noteLeaderOut(st, u, died) {
  if (!st.leaderId || !u.ch || u.ch.id !== st.leaderId || u.ch.isPlayer) return;
  if (!died) {
    st.leaderFled = true;
    if (st.over) return;
    st.over = true;
    st.winner = u.side === 'a' ? 'b' : 'a';
    Combat.applySurvivalGrowth(st);
    ev(st, { t: 'end', winner: st.winner, reason: 'leaderFled' });
    return;
  }
  // Stay downed, not dead: a healer or druid still has their turn to Raise.
  st.leaderDowned = true;
}

function confirmLeaderOutcome(st) {
  if (!st.leaderId || st.leaderFled) return;
  const lead = st.units.find(u => u.ch && u.ch.id === st.leaderId);
  if (!lead || lead.ch.isPlayer) return;
  if (lead.fled) { st.leaderFled = true; return; }
  if (lead.downed && st.winner !== lead.side) st.leaderFell = true;
}

const DOT_HOP = { basic: 0, intermediate: 1, advanced: 3 };
Combat.DOT_HOP = DOT_HOP;
function hopDots(st, dead) {
  if (st.dotHopDone) return;
  const dots = (dead.statuses || []).filter(s => isPctDot(s.kind) && !s.__hopped);
  if (!dots.length) return;
  const rank = { basic: 0, intermediate: 1, advanced: 2 };
  let best = 'basic';
  for (const s of dots) if ((rank[s.tier] || 0) > (rank[best] || 0)) best = s.tier;
  const n = DOT_HOP[best] || 0;
  if (n <= 0) return;
  const order = { front: 0, mid: 1, back: 2 };
  const cand = livingUnits(st, dead.side).filter(x => {
    if (x === dead) return false;
    if (x.statuses.some(s => s.kind === 'purified')) return false;
    const dm = perkVal(x.ch, 'demigod', null);
    if (dm && dm.statusImmune) return false;
    return true;
  }).filter(x => {
    const imm = x.ch.statusImmunities || [];
    return dots.some(s => !imm.includes(s.kind));
  });
  if (!cand.length) return;
  cand.sort((a, b) => {
    const da = Math.abs((order[a.lane] || 0) - (order[dead.lane] || 0));
    const db = Math.abs((order[b.lane] || 0) - (order[dead.lane] || 0));
    if (da !== db) return da - db;
    return (a.slot || 0) - (b.slot || 0);
  });
  const tgts = cand.slice(0, n);
  st.dotHopDone = true;
  for (const s of dots) s.__hopped = true;
  for (const tgt of tgts) {
    const imm = tgt.ch.statusImmunities || [];
    let hopped = 0;
    for (const s of dots) {
      if (imm.includes(s.kind)) continue;
      addStatus(st, tgt, reseatDot(Object.assign({}, s, { fresh: true, __hopped: true, _spread: true }), tgt));
      hopped++;
    }
    if (hopped) ev(st, { t: 'poisonHop', from: dead.uid, to: tgt.uid, n: hopped, kinds: dots.map(s => s.kind) });
  }
}
function hopPoison(st, dead) { hopDots(st, dead); }

function pickAdjacentFoe(st, primary) {
  if (!primary) return null;
  const mates = laneUnits(st, primary.side, primary.lane).filter(x => x !== primary);
  return mates[0] || null;
}

function bulwarkOnEnemyDown(st, dead) {
  const foeSide = dead.side === 'a' ? 'b' : 'a';
  for (const u of livingUnits(st, foeSide)) {
    const bw = perkVal(u.ch, 'bulwark', null);
    if (!bw || !bw.killHealPct) continue;
    healUnit(st, null, u, Math.max(1, Math.round(u.maxHp * bw.killHealPct)), { noCleanse: true });
    if (bw.killCleanse) healCleanse(st, u, 'all', u.uid);
    ev(st, { t: 'bulwarkKill', uid: u.uid, from: dead.uid });
  }
}

// Demigod does not stay down. Two rounds after he falls he stands again, provided someone on
// his side is still fighting — a defeat that has already ended does not get undone.
function reviveTheFallen(st) {
  for (const u of st.units) {
    if (!u.downed || u.fled || u.reserved || u.__revivedOnce) continue;
    const n = Sys().knownVal(u.ch, 'autoReviveRounds');
    if (!n || u.downedAtRound == null || st.round - u.downedAtRound < n) continue;
    if (!livingUnits(st, u.side).length) continue;
    u.__revivedOnce = true;
    u.downed = false; u.chp = Math.max(1, Math.round(u.maxHp * 0.5)); u.tempHp = 0;
    u.statuses = u.statuses.filter(x => !NEG_STATUSES.includes(x.kind));
    ev(st, { t: 'selfRevive', uid: u.uid, why: 'demigod' });
    if (st.leaderId && u.ch && u.ch.id === st.leaderId) st.leaderDowned = false;
  }
}

function onUnitDown(st, u) {
  if (trySelfRevive(st, u)) return;
  u.downedAtRound = st.round;
  hopDots(st, u);
  bulwarkOnEnemyDown(st, u);
  noteLeaderOut(st, u, true);
  // step a reserve into the field on the following turn (§15a)
  const side = u.side;
  const res = st.units.find(x => x.side === side && x.reserved && !x.downed && !x.fled);
  if (res) {
    res.reserved = false;
    const lanes = { front: laneUnits(st, side, 'front'), mid: laneUnits(st, side, 'mid'), back: laneUnits(st, side, 'back') };
    for (const L of ['front', 'mid', 'back']) {
      if (lanes[L].length < C().LANE_CAP) { res.lane = L; res.slot = lanes[L].length; break; }
    }
    ev(st, { t: 'reserveIn', uid: res.uid, lane: res.lane });
  }
}

function findGuard(st, tgt) {
  for (const u of livingUnits(st, tgt.side)) {
    const g = u.statuses.find(s => s.kind === 'guard' || s.kind === 'warhound');
    if (!g) continue;
    if (u === tgt && g.kind === 'guard') return { owner: u, absorb: g.absorb };
    if (g.kind === 'warhound') { if (u !== tgt && u.lane === tgt.lane) return { owner: u, absorb: g.absorb }; continue; }
    // Unseen Guard: guards one named ally; the interceptor is not seen
    if (g.scope === 'ally') { if (g.targetUid === tgt.uid) return { owner: u, unseen: true, absorb: g.absorb }; continue; }
    // a guard covers only those on the tank's lane or behind it (request 3)
    if (g.scope === 'party' && canWard(u, tgt)) return { owner: u, absorb: g.absorb };
    if (g.scope === 'behind' && (LANE_IDX[tgt.lane] || 0) >= (LANE_IDX[u.lane] || 0)) return { owner: u, absorb: g.absorb };
    if (g.scope === 'lane' && u.lane === tgt.lane) return { owner: u, absorb: g.absorb };
  }
  // Bulwark+ / Rampart: cover an ally in an adjacent lane with no extra stance
  for (const u of livingUnits(st, tgt.side)) {
    const bw = perkVal(u.ch, 'bulwark', null);
    if (!bw || !bw.protectAdjacent || u === tgt) continue;
    if (Math.abs((LANE_IDX[u.lane] || 0) - (LANE_IDX[tgt.lane] || 0)) === 1) return { owner: u, absorb: 0.5 };
  }
  return null;
}

// ---------------------------------------------------------------- healing
// Heals cleanse (DOT_PROMPT.md §9). `scope`: 'stack' (one poison + one bleed,
// oldest first), 'dots' (every poison + bleed), 'dots+' (plus burn, healcut),
// 'all' (the full negative list). Emits `cleansed` with byHeal so the field shows it.
const {healCleanse, healerCleanseScope, recoveryLeft, healUnit, REGEN_TICKS, REGEN_COOLDOWN, healPct, skillArchetype, pickHealTargets, applyDruidHeal, cooldownLeft, tickCooldowns} = ADV.CombatModules.healing({removeStatus:(...args)=>removeStatus(...args), NEG_STATUSES, ev:(...args)=>ev(...args), Combat, perkVal:(...args)=>perkVal(...args), C:(...args)=>C(...args), SK:(...args)=>SK(...args), livingUnits:(...args)=>livingUnits(...args), dealDamage:(...args)=>dealDamage(...args), Ch:(...args)=>Ch(...args), addStatus:(...args)=>addStatus(...args)});

const {isPctDot, reseatDot, addStatus, endRoundTicks, removeStatus} = ADV.CombatModules.statuses({Combat, C:(...args)=>C(...args), perkVal:(...args)=>perkVal(...args), NEG_STATUSES, ev:(...args)=>ev(...args), spreadSeptic:(...args)=>spreadSeptic(...args), laneUnits:(...args)=>laneUnits(...args), healUnit:(...args)=>healUnit(...args), applyRawDamage:(...args)=>applyRawDamage(...args), onUnitDown:(...args)=>onUnitDown(...args), tickHide:(...args)=>tickHide(...args), DOT_STATUSES, feedSepticLeech:(...args)=>feedSepticLeech(...args), healCleanse:(...args)=>healCleanse(...args), checkEnd:(...args)=>checkEnd(...args)});

function breakMomentum(u) {
  if (!u) return;
  u.momentumArmed = false;
  u.momentumStacks = 0;
  u.momentumTarget = null;
  u.consecutiveCount = 0;
}

function noteMomentumAttack(u) {
  const mo = perkVal(u.ch, 'momentum', null);
  if (!mo) return;
  if (u.momentumArmed) {
    u.momentumStacks = Math.min(mo.maxStacks, (u.momentumStacks || 0) + 1);
    u.consecutiveCount = (u.consecutiveCount || 0) + 1;
  } else {
    u.momentumStacks = 0;
    u.consecutiveCount = 1;
  }
  u.momentumArmed = true;
}

function meleeExtraCap(m) {
  const d = m && m.data;
  if (!d) return 0;
  if (d.id === 'cleave' || d.id === 'basic_attack') return 0;
  if (d.stun || d.critSecondAdjacent) return 0;
  if (d.cleaveRows || d.hitScale) return 0;
  if (d.elemental) return 0;
  if (!d.power || d.power <= 0) return 0;
  if (d.target === 'allEnemies' || d.target === 'enemyLane' || d.target === 'enemyFront' || d.spreadLanes) return 0;
  if (d.pctMaxHp || d.targetHighestHp) return 0;
  if (!(d.melee || d.reach === 'front')) return 0;
  return m.tier === 'advanced' ? 3 : m.tier === 'intermediate' ? 2 : 1;
}

function fillMeleeExtras(st, targets, cap, side, attacker) {
  if (targets.length >= cap) return targets;
  const have = new Set(targets.map(x => x.uid));
  const foes = livingUnits(st, side).filter(x => !have.has(x.uid) && (!attacker || canMelee(st, attacker, x)));
  const prim = targets[0];
  foes.sort((a, b) => {
    const da = Math.abs(LANE_IDX[a.lane] - LANE_IDX[prim.lane]);
    const db = Math.abs(LANE_IDX[b.lane] - LANE_IDX[prim.lane]);
    return da - db;
  });
  for (const x of foes) {
    if (targets.length >= cap) break;
    targets.push(x);
  }
  return targets;
}

function feedSepticLeech(st, dealt, srcU, tgtU) {
  if (!(dealt > 0)) return;
  for (const unit of st.units) {
    if (unit.downed || unit.fled || unit.reserved) continue;
    const septic = perkVal(unit.ch, 'septic_sanguine', null);
    if (!septic || !septic.dotLeech) continue;
    const involved = unit === srcU || unit === tgtU;
    if (!septic.leechAny && !involved) continue;
    healUnit(st, null, unit, Math.max(1, Math.round(dealt * septic.dotLeech)));
  }
}

function offensiveDotVictims(st, u, tgt, skillId, o) {
  const pool = Combat.validTargets(st, u, skillId, true).filter(x => x.side !== u.side && !x.downed);
  if (!pool.length) return [];
  const mode = (o && o.target) || 'enemy';
  if (mode === 'allEnemies') return pool;
  if (mode === 'enemyLane') {
    const primary = tgt && pool.includes(tgt) ? tgt : pool[0];
    return pool.filter(x => x.lane === primary.lane);
  }
  if (tgt && pool.includes(tgt)) return [tgt];
  return [pool[0]];
}

function spreadSeptic(st, origin, status) {
  if (!st || !origin || !status || status._spread) return;
  if (status.kind !== 'bleed' && status.kind !== 'poison') return;
  const src = status.srcUid && st.units.find(x => x.uid === status.srcUid);
  if (!src || !perkVal(src.ch, 'septic_sanguine', null)) return;
  const li = LANE_IDX[origin.lane];
  const cand = livingUnits(st, origin.side).filter(o => {
    if (o.uid === origin.uid) return false;
    return Math.abs(LANE_IDX[o.lane] - li) <= 2;
  });
  if (!cand.length) return;
  cand.sort((a, b) => Math.abs(LANE_IDX[a.lane] - li) - Math.abs(LANE_IDX[b.lane] - li));
  const copy = Object.assign({}, status, { _spread: true, ticks: status.ticksTotal, dealt: 0 });
  addStatus(st, cand[0], copy);
}

function foeSideOf(u) { return u.side === 'a' ? 'b' : 'a'; }
function isHostileDot(kind) { return kind === 'poison' || kind === 'bleed' || kind === 'burn'; }
function hostileSkill(d, off) {
  if (off && d.offensive) {
    const t = d.offensive.target || 'enemy';
    return t === 'enemy' || t === 'enemyLane' || t === 'allEnemies';
  }
  if (d.heal && !off) return false;
  const t = d.target;
  if (t === 'self' || t === 'ally' || t === 'allyLane' || t === 'party' || t === 'postVictory') return false;
  return t === 'enemy' || t === 'enemyLane' || t === 'enemyFront' || t === 'allEnemies' || !t;
}
function resolveSkillTarget(st, u, skillId, action, d, off) {
  const named = action.targetUid != null ? st.units.find(x => x.uid === action.targetUid) : null;
  const living = named && !named.downed && !named.fled && !named.reserved;
  if (!hostileSkill(d, off)) {
    if (living && named.side === u.side) return named;
    return u;
  }
  let foes = livingUnits(st, foeSideOf(u)).filter(x => !x.downed && (ADV.GatePerkCombat ? ADV.GatePerkCombat.canTarget(u, x) : !x.untargetable));
  // An execution cannot be talked into a target it is incapable of killing. A taunt can force
  // whom you fight, not whether a finishing blow finishes: without this a marked character
  // spends the skill on a healthy boss and the turn is simply gone.
  if (d.requireBelowPct) {
    const dying = foes.filter(x => x.maxHp && (x.chp + (x.tempHp || 0)) / x.maxHp < d.requireBelowPct);
    if (!dying.length) return null;
    foes = dying;
  }
  // Skills that choose their own victim do it here, ahead of everything else, so the name in
  // the "uses" line is the one who actually gets hit. A taunt can't pull a sweep off the front
  // rank, and it can't talk the boss out of challenging the biggest body on the field.
  if (d.targetHighestHp) {
    return foes.slice().sort((a, b) => (b.maxHp || 0) - (a.maxHp || 0))[0] || null;
  }
  if (d.target === 'enemyFront') {
    const rows = ['front', 'mid', 'back'];
    const row = rows.find(r => foes.some(x => x.lane === r));
    return row ? foes.find(x => x.lane === row) : null;
  }
  if (u.marksBy.length) {
    const forced = foes.filter(x => u.marksBy.includes(x.uid));
    if (forced.length) {
      if (living && forced.includes(named)) return named;
      return forced[0];
    }
  }
  if (living && foes.includes(named)) return named;
  const legal = Combat.validTargets(st, u, skillId, !!off).filter(x => x.side !== u.side && !x.downed);
  return legal[0] || null;
}

// ---------------------------------------------------------------- actions
// action: {kind:'skill', skillId, targetUid, offensiveMode} | {kind:'flee'} | {kind:'attack', targetUid} | {kind:'hold'}
Combat.act = function (st, u, action) {
  u.planned = null;
  if (action.kind === 'hold') { breakMomentum(u); ev(st, { t: 'hold', uid: u.uid }); return { ok: true }; }
  if (action.kind === 'skill') {
    const pre = manifestFor(u, action.skillId);
    if (pre && pre.data && pre.data.passive) { ev(st, { t: 'use', uid: u.uid, skillId: action.skillId, tier: pre.tier, name: pre.data.name, target: u.uid }); return { ok: true }; }
  }
  if (action.kind === 'flee') return doFlee(st, u);
  if (action.kind === 'bribe') return doBribe(st, u, action);
  const skillId = action.kind === 'attack' ? 'basic_attack' : action.skillId;
  const m = manifestFor(u, skillId);
  if (!m) return { ok: false, error: 'unknown skill' };
  openBasicBudget(st, u, m);
  // Bind/Root Field seal: skills of the sealed tiers are unusable; the
  // universal Basic Attack never seals (no unit may be left without a move)
  if (skillId !== 'basic_attack') {
    const seal = u.statuses.find(x => x.kind === 'sealed');
    if (seal && (seal.tiers || []).includes(m.tier)) {
      ev(st, { t: 'sealedBlock', uid: u.uid, skillId });
      return { ok: false, error: 'sealed' };
    }
  }
  const d = Object.assign({}, m.data);
  const off = action.offensiveMode && d.offensive;
  const tgt = resolveSkillTarget(st, u, skillId, action, d, off);
  if (!tgt) return { ok: false, error: 'no target' };
  if (d.freeAction && u.freeActionUsed) return { ok: false, error: 'already used a free action' };
  if (cooldownLeft(u, skillId) > 0) return { ok: false, error: 'recovering (' + cooldownLeft(u, skillId) + ')' };
  if (battleUseLimit(d) && !canSpendBattleUse(u, skillId, d)) return { ok: false, error: 'once per battle' };
  // Shock: cannot use interrupt skills
  if (d.interrupt && u.statuses.some(x => x.kind === 'shock')) return { ok: false, error: 'shocked' };
  // Flintlock Shot: you are holding an empty gun (Powder Discipline cancels it)
  if (d.reload && u.reloadLock[skillId] && !Sys().knownVal(u.ch, 'noReload')) {
    return { ok: false, error: 'needs reloading' };
  }
  // Iai Draw: one motion, sheath to sheath — the opening action only
  if (d.openerOnly && u.actedThisEncounter) return { ok: false, error: 'opening action only' };

  // witness: everyone on the field sees this use (registered for survivors at end)
  recordSighting(st, u, skillId, m.tier);

  if (ADV.GatePerkCombat) ADV.GatePerkCombat.beginAction(st, u);

  ev(st, { t: 'use', uid: u.uid, skillId, tier: m.tier, name: off ? d.offensive.name : d.name, target: tgt.uid, offensive: !!off });
  // flush any first-sighting the player just got, so the beat lands after the blow
  if (st.__witnessPending && st.__witnessPending.length) {
    for (const w of st.__witnessPending) ev(st, { t: 'witness', skillId: w.skillId, tier: w.tier, from: w.from, uid: w.uid });
    st.__witnessPending = null;
  }

  // Countersign: a lane holding an interrupt negates the next enemy skill aimed at it
  if (skillId !== 'basic_attack' && tgt.side !== u.side) {
    const holder = laneUnits(st, tgt.side, tgt.lane).find(x => x.statuses.some(y => y.kind === 'countersign'));
    if (holder) {
      removeStatus(holder, holder.statuses.find(y => y.kind === 'countersign'));
      ev(st, { t: 'interrupted', uid: u.uid, by: holder.uid, skillId });
      return finishAction(st, u, skillId, { fizzled: true });
    }
  }
  // stealth bookkeeping: any non-silent hostile act breaks stealth
  if (tgt.side !== u.side && !d.silent && u.stealth) { u.stealth = false; u.stealthRounds = 0; }
  if (d.stealthOnUse) { applyStealth(u, d.stealthRounds); ev(st, { t: 'stealth', uid: u.uid }); }
  if (d.stealthOnKill) u.stealthOnKillPending = true;
  if (d.reflectImmuneNext) u.reflectImmuneNext = true;

  // ----- bespoke campaign effects (js/core/combat_effects.js) -----
  if (d.effect && Combat.EFFECTS && Combat.EFFECTS[d.effect]) {
    const r = Combat.EFFECTS[d.effect](Combat._internals, st, u, tgt, d, m);
    if (r !== undefined) return r;
    return finishAction(st, u, skillId);
  }
  // ----- generic status placements -----
  if (d.selfStatus) {
    const self = Object.assign({ tier: m.tier, srcUid: u.uid }, d.selfStatus);
    if (d.dmgTakenMult != null) self.dmgTakenMult = d.dmgTakenMult;
    addStatus(st, u, self);
    if (Combat.isShapeshift(skillId) && !u.form) applyForm(st, u, skillId, d.selfStatus.rounds || d.rounds || 3);
    if (!d.power) return finishAction(st, u, skillId);
  } else if (d.dmgTakenMult != null) {
    addStatus(st, u, { kind: 'takenReduce', dmgTakenMult: d.dmgTakenMult, rounds: d.rounds || 4, srcUid: u.uid });
  }
  if (d.partyStatus) { for (const x of livingUnits(st, u.side)) addStatus(st, x, Object.assign({ srcUid: u.uid }, d.partyStatus)); return finishAction(st, u, skillId); }
  if (d.allyStatus) { addStatus(st, tgt.side === u.side ? tgt : u, Object.assign({ srcUid: u.uid }, d.allyStatus)); return finishAction(st, u, skillId); }
  if (d.laneStatus) { for (const x of laneUnits(st, u.side, u.lane)) addStatus(st, x, Object.assign({ srcUid: u.uid }, d.laneStatus)); return finishAction(st, u, skillId); }
  if (d.hazard) {
    const h = d.hazard;
    const side = h.on === 'allyLane' ? u.side : tgt.side;
    const lane = h.on === 'allyLane' ? (tgt.side === u.side ? tgt.lane : u.lane) : tgt.lane;
    st.hazards = st.hazards.filter(x => !(x.side === side && x.lane === lane && x.kind === h.kind));
    st.hazards.push({ side, lane, kind: h.kind, power: h.power * C().TIER_MULT[m.tier], heal: !!h.heal, rounds: h.rounds || 3, fresh: true, srcUid: u.uid, srcAtk: Ch().effStat(u.ch, 'atk'), skillId, tier:m.tier });
    ev(st, { t: 'hazard', side, lane, kind: h.kind });
    // a druid's healing terrain also lays the heal-over-time and thorn shield on the lane (A3)
    if (d.archetype === 'druid' && d.heal && h.heal) {
      for (const t of laneUnits(st, side, lane)) if (!t.downed) applyDruidHeal(st, u, t, m.tier, healPct(st, u, t, skillId, m.tier, d));
    }
    return finishAction(st, u, skillId);
  }

  if (skillId === 'true_rest') {
    // Jiro is undead but no longer animated by the working that raised him
    // (add-on §2a): True Rest has nothing to switch off.
    if (tgt.ch.trueRestImmune) { ev(st, { t: 'immune', uid: tgt.uid, kind: 'trueRest' }); return finishAction(st, u, skillId); }
    if (tgt.ch.isUndead) {
      tgt.chp = 0; tgt.downed = true;
      ev(st, { t: 'trueRest', uid: tgt.uid });
      onUnitDown(st, tgt); checkEnd(st);
    }
    return finishAction(st, u, skillId);
  }

  // ----- healing family -----
  if (d.heal && !off) {
    const atk = Ch().effStat(u.ch, 'atk');
    const restores = !!(d.power || d.hotRounds || d.healFromTaken);
    const druid = d.archetype === 'druid';
    if (cooldownLeft(u, skillId) > 0) return { ok: false, error: 'recovering (' + cooldownLeft(u, skillId) + ')' };
    // percentage of each target's max HP (Part A1); the flare and Clan Blood still shape it
    const pctOf = (t) => {
      let a = healPct(st, u, t, skillId, m.tier, d);
      if (m.flare && m.flare.healMult) a = Math.round(a * m.flare.healMult);
      if (d.healFromTaken) a = Math.max(1, Math.round((u.damageTaken || 0) * d.healFromTaken));
      return a;
    };
    let targets = d.target === 'party' ? livingUnits(st, u.side)
      : d.target === 'allyLane' ? laneUnits(st, u.side, tgt.lane)
      : (restores && d.healTargets !== 1 ? pickHealTargets(st, u, tgt, m.tier) : [tgt]);
    // Breath of the Bell: only those who have not moved yet this round
    if (d.unactedOnly) targets = targets.filter(x => !x.attackedThisRound);
    // Clan Blood's share of damage-taken is applied inside pctOf
    if (d.healBehind) targets = targets.filter(x => canHealOther(u, x));
    else if (d.wardAhead) targets = targets.filter(x => canWard(u, x));
    // A heal never crosses the line. Every path that builds `targets` is side-correct today,
    // but the primary target arrives from the caller on trust (the player's auto list, the
    // AI, a campaign script), so this is the backstop rather than an assumption: a healer on
    // auto can never top up, ward or cleanse the people it is fighting.
    targets = targets.filter(x => x.side === u.side);
    if (!targets.length) return { ok: false, error: 'no ally to heal' };
    if (d.revive && !d.selfRevive && (tgt.downed || downedAllies(st, u.side).length)) {
      if (!canSpendBattleUse(u, skillId, d)) return { ok: false, error: 'once per battle' };
      const picks = pickReviveTargets(st, u.side, tgt, d.reviveCount || 1);
      if (!picks.length) return { ok: false, error: 'no fallen allies' };
      spendBattleUse(u, skillId);
      for (const t of picks) applyRevive(st, u, t, d, skillId);
      return finishAction(st, u, skillId);
    }
    for (const t of targets) {
      if (t.downed) continue;
      let amt = restores ? pctOf(t) : 0;
      if (d.doubleBelow && (t.chp / t.maxHp) < d.doubleBelow) amt *= 2;
      if (d.fullHealBelow && (t.chp / t.maxHp) < d.fullHealBelow) amt = t.maxHp;
      if (d.shieldHits) { addStatus(st, t, { kind: 'ward', hits: d.shieldHits, reflect: !!d.wardReflect }); continue; }
      if (d.shieldRounds) { addStatus(st, t, { kind: 'ward', rounds: d.shieldRounds, hits: 999, reflect: !!d.wardReflect, all: !!d.wardAll }); continue; }
      if (d.purifyRounds && !d.power) { addStatus(st, t, { kind: 'purified', rounds: d.purifyRounds }); continue; }
      if (d.grantEvade) t.evade += d.grantEvade;
      // Field Suture: closed up and put somewhere nobody is looking
      if (d.allyStealth) { applyStealth(t, d.allyStealth); ev(st, { t: 'stealth', uid: t.uid }); }
      // Paper Charm: the ward answers with poison
      if (d.wardPoison) addStatus(st, t, { kind: 'charmWard', tier: m.tier, power: d.wardPoison.power, rounds: d.wardPoison.rounds });
      // Signal Flags: this ally moves the moment you are done
      if (d.grantTurn && t !== u && !t.grantedTurns) Combat.grantTurn(st, u, t, d.grantTurn);
      // Surgeon's Saw: it works, and they will bleed for a while
      if (d.selfBleedOnTarget) addStatus(st, t, { kind: 'bleed', tier: m.tier, power: d.selfBleedOnTarget.power, rounds: d.selfBleedOnTarget.rounds, srcAtk: atk, srcUid: u.uid });
      // Regeneration (A2): double the tier value over 5 ticks; refreshes, never stacks; 3-turn cooldown
      if (d.hotRounds) {
        healCleanse(st, t, d.archetype === 'healer' ? healerCleanseScope(m.tier) : 'dots', u.uid);
        const old = t.statuses.find(x => x.kind === 'hot' && x.regen);
        if (old) removeStatus(t, old);
        addStatus(st, t, { kind: 'hot', regen: true, ticks: REGEN_TICKS, perTick: Math.max(1, Math.round(amt * 2 / REGEN_TICKS)), srcUid: u.uid, tier: m.tier });
        u.cooldowns = u.cooldowns || {}; u.cooldowns[skillId] = REGEN_COOLDOWN;
        continue;
      }
      // Druid heals (A3): the same total over 3 ticks, plus a thorn shield that absorbs and reflects
      if (druid && amt > 0) { applyDruidHeal(st, u, t, m.tier, amt); continue; }
      if (d.cureCount) {
        let cured = 0;
        for (const s of t.statuses.slice()) {
          if (NEG_STATUSES.includes(s.kind) && cured < d.cureCount) { removeStatus(t, s); cured++; }
        }
        if (!cured && amt <= 0) continue;
      }
      if (d.cures) for (const kind of d.cures) { const s = t.statuses.find(x => x.kind === kind); if (s) removeStatus(t, s); }
      if (amt > 0) {
        if (!d.noCleanse) healCleanse(st, t, d.archetype === 'healer' ? healerCleanseScope(m.tier) : 'dots', u.uid);
        healUnit(st, u, t, amt, { noCleanse: true });
      }
    }
    return finishAction(st, u, skillId);
  }

  // ----- offensive modes of healing skills -----
  if (off) {
    const o = d.offensive;
    const atk = Ch().effStat(u.ch, 'atk');
    const tierMult = C().TIER_MULT[m.tier];
    if (o.statusTransfer) {
      const mine = u.statuses.find(s => DOT_STATUSES.includes(s.kind));
      if (mine) { removeStatus(u, mine); addStatus(st, tgt, reseatDot(Object.assign({}, mine), tgt)); }
      else dealDamage(st, u, tgt, Math.max(1, Math.round(atk * 1.0 * tierMult) - Ch().effStat(tgt.ch, 'def')), 'spell');
      return finishAction(st, u, skillId);
    }
    if (o.dotRounds) {
      const victims = offensiveDotVictims(st, u, tgt, skillId, o);
      for (const v of victims) {
        addStatus(st, v, { kind: 'poison', tier: m.tier, rounds: o.dotRounds, power: o.power, srcAtk: atk, srcUid: u.uid });
      }
      return finishAction(st, u, skillId);
    }
    if (o.wardReflect) {
      addStatus(st, tgt, { kind: 'ward', hits: 1, reflect: true });
      return finishAction(st, u, skillId);
    }
    if (o.healReduction) {
      addStatus(st, tgt, { kind: 'healcut', rounds: 3, pct: o.healReduction });
    }
    if (o.power) {
      const dmg = computeDamage(st, u, tgt, m, { power: o.power });
      const dealt = dealDamage(st, u, tgt, dmg, 'spell');
      if (o.lifeSteal) healUnit(st, null, u, Math.round(dealt * o.lifeSteal));
    }
    return finishAction(st, u, skillId);
  }

  // ----- blood pact: damage + heal same amount (§3a) -----
  if (d.dualHeal) {
    const targets = d.target === 'enemyLane' ? laneUnits(st, tgt.side, tgt.lane) : [tgt];
    let total = 0;
    for (const t of targets) {
      const dmg = computeDamage(st, u, t, m);
      total += dealDamage(st, u, t, dmg, 'spell');
    }
    const allies = livingUnits(st, u.side).sort((x, y) => (x.chp / x.maxHp) - (y.chp / y.maxHp));
    const healTargets = d.healTargets === 'party' ? allies : allies.slice(0, d.healTargets || 1);
    for (const a of healTargets) {
      const amt = Math.round(total / Math.max(1, healTargets.length));
      healCleanse(st, a, d.archetype === 'healer' ? healerCleanseScope(m.tier) : 'dots', u.uid);
      healUnit(st, u, a, amt, { noCleanse: true });
    }
    return finishAction(st, u, skillId);
  }

  // ----- self buffs / guards -----
  if (d.guardScope) {
    addStatus(st, u, {
      kind: 'guard', scope: d.guardScope, rounds: d.guardRounds || 3,
      absorb: d.guardAbsorb != null ? d.guardAbsorb : 0.5,
    });
    return finishAction(st, u, skillId);
  }
  if (d.thornPct) {
    const targets = d.thornScope === 'party' ? livingUnits(st, u.side)
      : d.thornScope === 'lane' ? laneUnits(st, u.side, u.lane) : [u];
    for (const t of targets) addStatus(st, t, { kind: 'thorns', pct: d.thornPct, rounds: d.rounds || 3 });
    return finishAction(st, u, skillId);
  }
  if (d.atkMult) {
    if (d.freeBuff) applyBeastShape(st, u, m, skillId);
    else {
      addStatus(st, u, { kind: 'atkBuff', mult: d.atkMult, rounds: d.rounds || 3 });
      if (d.lifeSteal) addStatus(st, u, { kind: 'lifesteal', pct: d.lifeSteal, rounds: d.rounds || 3 });
    }
    return finishAction(st, u, skillId);
  }
  if (d.auraAtk) {
    for (const t of livingUnits(st, u.side)) addStatus(st, t, { kind: 'aura', atk: d.auraAtk, def: d.auraDef, evadePct: d.auraEvade, rounds: d.rounds || 3 });
    return finishAction(st, u, skillId);
  }
  if (d.evadeNext) { addStatus(st, u, { kind: 'evadeS' }); u.evade += d.evadeNext; return finishAction(st, u, skillId); }
  if (d.untargetableRounds) {
    applyUntargetable(u, d.untargetableRounds);
    if (d.freeStrike && tgt && tgt.side !== u.side) {
      const dmg = computeDamage(st, u, tgt, m, { power: 2.0 });
      dealDamage(st, u, tgt, dmg, 'attack');
    }
    return finishAction(st, u, skillId);
  }
  if (d.counterNext) {
    u.counter += d.counterNext;
    // A stance holds for a set number of rounds rather than until it is spent, and it names
    // the blow it answers with. Both are cleared by the clock in startRound.
    if (d.counterRounds) u.counterUntil = st.round + d.counterRounds - 1;
    u.counterRiposte = d.counterRiposte || null;
    if (d.thornPct) addStatus(st, u, { kind: 'thorns', pct: d.thornPct, rounds: d.rounds || 1 });
    return finishAction(st, u, skillId);
  }
  // ---- ninja/pirate party and lane states (add-on §3) ----
  if (d.partyStatus && !d.heal) {
    for (const t of livingUnits(st, u.side)) {
      if (d.partyStatus.elemGuard) addStatus(st, t, { kind: 'elemGuard', mult: d.partyStatus.elemGuard.mult, rounds: d.partyStatus.elemGuard.rounds });
      if (d.partyStatus.volley) addStatus(st, t, { kind: 'volley', extra: d.partyStatus.volley.extra, rounds: d.partyStatus.volley.rounds });
    }
    ev(st, { t: 'status', uid: u.uid, kind: 'party' });
    return finishAction(st, u, skillId);
  }
  if (d.laneStatus && d.laneStatus.closed) {
    const R = d.laneStatus.closed.rounds;
    for (const t of laneUnits(st, u.side, u.lane)) {
      addStatus(st, t, { kind: 'closed', rounds: R });
      if (d.laneAllyGuard && t !== u) addStatus(st, t, { kind: 'laneGuard', mult: d.laneAllyGuard, rounds: R });
    }
    if (d.immovable) addStatus(st, u, { kind: 'immovable', rounds: R });
    ev(st, { t: 'status', uid: u.uid, kind: 'closed' });
    return finishAction(st, u, skillId);
  }
  if (d.pullAttacker) {
    addStatus(st, u, { kind: 'guard', scope: d.guardScope || 'self', rounds: d.rounds || 2 });
    addStatus(st, u, { kind: 'railGuard', rounds: d.rounds || 2 });
    if (d.thornPct) addStatus(st, u, { kind: 'thorns', pct: d.thornPct, rounds: d.rounds || 2 });
    return finishAction(st, u, skillId);
  }

  // ----- taunt -----
  if (d.marks != null) {
    const allFoes = livingUnits(st, tgt.side);
    const list = d.marks === 'all' ? allFoes
      : d.marks === 'lane' ? laneUnits(st, tgt.side, tgt.lane)
      : (tgt ? [tgt].concat(allFoes.filter(f => f !== tgt)).slice(0, d.marks) : allFoes.slice(0, d.marks));
    for (const f of list) {
      if (!f.marksBy.includes(u.uid)) f.marksBy.push(u.uid);
      // timed mark: expires via the status clock, then unhooks from marksBy
      const existing = f.statuses.find(x => x.kind === 'taunted' && x.srcUid === u.uid);
      if (existing) existing.rounds = d.markRounds || 3;
      else f.statuses.push({ kind: 'taunted', srcUid: u.uid, rounds: d.markRounds || 3 });
      ev(st, { t: 'taunted', uid: f.uid, by: u.uid });
    }
    Combat.resetThreat(st, u.side);
    Combat.addThreat(st, u, 40, 'taunt');
    return finishAction(st, u, skillId);
  }

  // ----- damaging actives & basic attack -----
  let targets = [tgt];
  if (d.cleaveRows) {
    const rows = d.cleaveRows;
    const li = LANE_IDX[tgt.lane];
    targets = livingUnits(st, foeSideOf(u)).filter(x => Math.abs(LANE_IDX[x.lane] - li) < rows && canMelee(st, u, x));
  } else if (d.spreadLanes) {
    const li = LANE_IDX[tgt.lane];
    targets = livingUnits(st, foeSideOf(u)).filter(x => Math.abs(LANE_IDX[x.lane] - li) <= 1);
  } else if (d.target === 'enemyFront') {
    // The front ROW, not the row of whoever happened to be targeted. A boss sweep aimed at
    // the line in front of it should never become a single-target poke because the AI's
    // threat pick landed on someone at the back; if the front rank is empty it falls to the
    // frontmost row that still has anyone standing, so the skill is never a wasted turn.
    const foes = livingUnits(st, foeSideOf(u));
    const rows = ['front', 'mid', 'back'];
    const row = rows.find(r => foes.some(x => x.lane === r));
    targets = row ? foes.filter(x => x.lane === row) : [];
  } else if (d.target === 'enemyLane') targets = laneUnits(st, foeSideOf(u), tgt.lane);
  else if (d.target === 'allEnemies') targets = livingUnits(st, foeSideOf(u));
  else if (d.multiTarget) {
    const foes = livingUnits(st, foeSideOf(u)).filter(x => x !== tgt);
    targets = [tgt].concat(foes.slice(0, d.multiTarget - 1));
  } else if (d.adjacent) {
    const laneMates = laneUnits(st, foeSideOf(u), tgt.lane).filter(x => x !== tgt);
    targets = [tgt].concat(laneMates.slice(0, d.adjacent));
  }
  if (d.pierceBehind) {
    const laneOrder = ['front', 'mid', 'back'];
    const behindLane = laneOrder[laneOrder.indexOf(tgt.lane) + 1];
    if (behindLane) {
      const behind = laneUnits(st, tgt.side, behindLane)[0];
      if (behind) targets.push(behind);
    }
  }
  const af = perkVal(u.ch, 'arcane_focus', null);
  if (af && af.splashAdjacent && d.elemental && targets.length === 1) {
    const extra = laneUnits(st, tgt.side, tgt.lane).find(x => x !== tgt);
    if (extra) targets.push(extra);
  }
  // Chain Lightning (campaign): jumps to every enemy, losing power each jump
  if (d.chainDecay) targets = [tgt].concat(livingUnits(st, tgt.side).filter(x => x !== tgt));
  // Primal Form: splash one more enemy in the same lane
  const shape = u.statuses.find(x => x.kind === 'beastShape');
  if (shape && shape.splashAdjacent && targets.length === 1) {
    const extra = laneUnits(st, tgt.side, tgt.lane).find(x => x !== tgt);
    if (extra) targets.push(extra);
  }
  // Storm Shape: attacks also hit one enemy in an adjacent lane
  if (u.statuses.some(x => x.kind === 'storm') && targets.length === 1) {
    const li = LANE_IDX[tgt.lane];
    const extra = livingUnits(st, tgt.side).find(x => x !== tgt && Math.abs(LANE_IDX[x.lane] - li) === 1);
    if (extra) targets.push(extra);
  }
  // spells: elemental, or ranged non-katana. attacks: melee & katana (these
  // trigger guards/thorns/counters; both feed Taunt retaliation).
  const isSpell = d.elemental || (d.reach === 'any' && !d.katana && !d.melee);
  const tag = isSpell ? 'spell' : 'attack';
  const isMelee = !isSpell;                      // §0d: every melee skill applies Exposed
  u.attackedThisRound = true;
  if (isSpell) u.castsThisBattle++;
  if (d.laneStreakScale) { if (u.laneStreak.lane === tgt.lane) u.laneStreak.n++; else u.laneStreak = { lane: tgt.lane, n: 0 }; }
  if (d.randomElemental) {
    const pick = st.rng.pick(['burn', 'frozen', 'shocked']);
    d.status = Object.assign({}, d.status, pick === 'burn' ? { burn: { power: 0.8, rounds: 2 } } : {});
    if (pick === 'frozen') d.freeze = 1;
    if (pick === 'shocked') { d.shock = 0.1; d.shockRounds = 2; }
  }
  const hits = d.hits || 1;
  const aoe = !!(d.cleaveRows || d.hitScale || d.target === 'allEnemies' || d.target === 'enemyLane'
    || d.spreadLanes || (d.multiTarget && d.multiTarget > 1));
  const flareHits = aoe ? 0 : ((m.flare && (m.flare.bonusHits || m.flare.extraHit)) || 0);
  const flareHitMult = m.flare && (m.flare.hitPowerMult || m.flare.extraHitMult);
  if (d.reload) u.reloadLock[skillId] = true;             // Flintlock Shot is now empty
  // Volley Fire / Broadside Doctrine: one more body in the same lane
  const vol = u.statuses.find(x => x.kind === 'volley');
  const bsd = perkVal(u.ch, 'broadside_doctrine', 'rangedExtraTarget');
  const extraTargets = (vol ? vol.extra : 0) + ((bsd && isSpell) ? bsd : 0);
  if (extraTargets > 0 && targets.length) {
    const li = LANE_IDX[targets[0].lane];
    const more = livingUnits(st, targets[0].side)
      .filter(x => !targets.includes(x) && LANE_IDX[x.lane] === li)
      .slice(0, extraTargets);
    if (more.length) targets = targets.concat(more);
    if (vol) removeStatus(u, vol);
  }
  const meleeCap = meleeExtraCap(m);
  if (meleeCap > 1) targets = fillMeleeExtras(st, targets, meleeCap, tgt.side, u);
  // Taunt: marked attackers dump only on the marker — no splash onto the back line.
  if (u.marksBy.length) {
    const locked = targets.filter(t => u.marksBy.includes(t.uid));
    if (locked.length) targets = locked;
  }
  noteMomentumAttack(u);
  // A skill may speak for its user: `say.on` before the blow lands, then `say.survived` or
  // `say.killed` depending on what is left of whoever it was aimed at. The keys are campaign
  // dialogue, played through the same banter channel the scene already knows how to show.
  sayBeat(st, u, d.say, 'on');
  const hitScale = (d.hitScale && targets.length) ? (1 + (targets.length - 1) * 0.5) : 1;
  const felled = new Set();
  for (let hi = 0; hi < hits + flareHits; hi++) {
    let wave = targets;
    if (d.critSecondAdjacent && hi === 1) {
      noteMomentumAttack(u);
      const adj = pickAdjacentFoe(st, tgt);
      wave = [adj || tgt];
    }
    for (const t of wave) {
    if (t.downed || felled.has(t.uid)) continue;
    if (d.chainDecay && targets.indexOf(t) > 0) { /* decayed power handled below */ }
    if (d.oneShotUndead && t.ch && (t.ch.isUndead || t.ch.isMonster && t.ch.undead)) {
      applyRawDamage(st, u, t, Math.max(t.chp, 1), 'spell');
      continue;
    }
    if (d.instantKillIfMaxHp && (t.maxHp || 0) > d.instantKillIfMaxHp) {
      ev(st, { t: 'godJudgment', uid: t.uid, by: u.uid, who: u.ch.campaignId || u.ch.enemyTypeId, targetName: t.ch.name, skillId });
      t.chp = 0; t.tempHp = 0; t.downed = true;
      ev(st, { t: 'execute', uid: t.uid, by: u.uid, skillId });
      onUnitDown(st, t); checkEnd(st);
      continue;
    }
    // autoKillPct: a clean cut. Rolled for each body the swing reaches, and never against a
    // boss — a 25% chance to end an ordinary opponent is a katana's whole reputation, but it
    // must not be allowed to delete an authored encounter.
    if (d.autoKillPct && !t.ch.boss && st.rng.chance(d.autoKillPct)) {
      t.chp = 0; t.tempHp = 0; t.downed = true;
      ev(st, { t: 'execute', uid: t.uid, by: u.uid, skillId, clean: true });
      onUnitDown(st, t); checkEnd(st);
      felled.add(t.uid);
      continue;
    }
    // Executes
    if (d.executeBelow && (t.chp + t.tempHp) / t.maxHp < d.executeBelow && !t.ch.boss) {
      t.chp = 0; t.tempHp = 0; t.downed = true;
      ev(st, { t: 'execute', uid: t.uid, by: u.uid, skillId });
      onUnitDown(st, t); checkEnd(st);
      if (!t.downed) continue;
      if (d.healOnKillPct) {
        healUnit(st, null, u, Math.round(u.maxHp * d.healOnKillPct));
        // The skill names where you end up. Healing multipliers decide how easily you get
        // there, not how far past it you go.
        const ceiling = Math.round(u.maxHp * d.healOnKillPct);
        if (u.chp + (u.tempHp || 0) > ceiling) u.tempHp = Math.max(0, ceiling - u.chp);
      }
      if (d.permStatGain) {
        for (const k of ['hp', 'atk', 'def', 'spd']) u.ch.bonusStats[k] = (u.ch.bonusStats[k] || 0) + d.permStatGain;
        u.ch.finisherGains = (u.ch.finisherGains || 0) + d.permStatGain;
        u.maxHp = Math.max(Ch().maxHp(u.ch), u.ch.hpFloor || 0);
        ev(st, { t: 'permGain', uid: u.uid });
      }
      continue;
    }
    // spreadPct: the body you aimed at takes the skill's full power and everyone else takes
    // a share of it. It lets a skill widen on its top tier without paying for the spread out
    // of the single-target number — the shape that made Volley weaker than the tier below it
    // against a boss, where there is only ever one body to hit.
    const spread = (d.spreadPct != null && t !== tgt) ? (d.power || 0) * d.spreadPct : undefined;
    const powerOverride = d.chainDecay ? (d.power || 2.0) * Math.pow(d.chainDecay, targets.indexOf(t))
      : spread;
    const flarePower = (hi >= hits && flareHitMult) ? (d.power || 0) * flareHitMult : undefined;
    // pctMaxHp: the blow is a share of what the target can take, not a product of the
    // attacker's numbers. A boss sweep written this way threatens a full party the same way
    // whatever their gear, and it cannot be outscaled by a defence stat. It still travels
    // through dealDamage, so guards, wards and Bulwark all answer it as they would any hit.
    let dmg = d.pctMaxHp
      ? Math.max(C().MIN_DAMAGE, Math.round((t.maxHp || 0) * d.pctMaxHp))
      : computeDamage(st, u, t, m, flarePower != null ? { power: flarePower }
        : (powerOverride != null ? { power: powerOverride } : undefined));
    if (hitScale > 1 && !d.pctMaxHp) dmg *= hitScale;
    if (d.critSecondAdjacent && hi === 1 && t !== tgt) dmg *= 2;
    const dealt = dealDamage(st, u, t, dmg, tag, { element: d.element, melee: isMelee,
      cannotMiss: !!d.cannotMiss || !!(Sys().knownVal(u.ch, 'accuracy') && u.momentumArmed), ignoreGuards: !!d.ignoreGuards, noReflect: !!d.noReflect,
      noExecute: hi >= hits, power: d.power });
    for (let ei = st.events.length - 1; ei >= 0 && ei >= st.events.length - 8; ei--) {
      if (st.events[ei].t === 'down' && st.events[ei].uid === t.uid) { felled.add(t.uid); break; }
    }
    if (isMelee && !t.downed) addExposed(st, t, 1);
    // ---- ninja/pirate on-hit riders (add-on §3) ----
    if (dealt > 0 && !t.downed) {
      if (d.reactionLock) addStatus(st, t, { kind: 'reactionLock', rounds: d.reactionLock });
      if (d.pull) Combat.pullForward(st, t, d.pull);
      if (d.rootRounds) addStatus(st, t, { kind: 'rooted', rounds: d.rootRounds });
      if (d.exposedOnSecond && hi === 1) addExposed(st, t, d.exposedOnSecond);
      const vt = u.statuses.find(x => x.kind === 'venomTouch');          // Fox Form
      if (vt && t.side !== u.side) addStatus(st, t, { kind: 'poison', tier: vt.tier || 'basic', power: vt.power, rounds: vt.dot.rounds, stacks: true, srcAtk: Ch().effStat(u.ch, 'atk'), srcUid: u.uid });
      const ot = u.statuses.find(x => x.kind === 'openingTouch');        // Marine Form
      if (ot) addExposed(st, t, ot.stacks);
    }
    if (dealt > 0 && !t.downed && d.stripGuards) {
      for (const x of t.statuses.slice()) if (x.kind === 'guard' || x.kind === 'ward' || x.kind === 'warhound') removeStatus(t, x);
      t.armorBonus = 0; ev(st, { t: 'sundered', uid: t.uid });
    }
    if (dealt > 0 && !t.downed && d.stealBuff) {
      const b = t.statuses.find(x => POS_STATUSES.includes(x.kind));
      if (b) { removeStatus(t, b); addStatus(st, u, Object.assign({}, b)); ev(st, { t: 'stolen', uid: t.uid, by: u.uid, kind: b.kind }); }
    }
    if (dealt > 0 && !t.downed && d.silence) addStatus(st, t, { kind: 'sealed', tiers: ['basic', 'intermediate', 'advanced'], rounds: d.silence });
    if (dealt > 0 && !t.downed && d.withering) addStatus(st, t, { kind: 'withering', rounds: d.withering });
    if (dealt > 0 && !t.downed && d.healcutRounds) addStatus(st, t, { kind: 'healcut', rounds: d.healcutRounds, pct: 0.5 });
    if (dealt > 0 && !t.downed && d.runic) { t.evade = 0; addStatus(st, t, { kind: 'runic', rounds: 2, srcUid: u.uid }); }
    if (dealt > 0 && !t.downed && t.side !== u.side) { const sp = u.statuses.find(x => x.kind === 'serpent'); if (sp) addStatus(st, t, { kind: 'poison', tier: sp.tier || 'basic', power: 0.6, rounds: 3, stacks: true, srcAtk: Ch().effStat(u.ch, 'atk'), srcUid: u.uid }); }
    if (dealt > 0 && u.statuses.some(x => x.kind === 'storm') && !t.downed) addStatus(st, t, { kind: 'shock', rounds: 1 });
    if (d.selfWardPct && dealt > 0) addStatus(st, u, { kind: 'ward', hits: 1, pool: Math.round(dealt * d.selfWardPct) });
    if (d.laneBuff) for (const x of laneUnits(st, u.side, u.lane)) addStatus(st, x, Object.assign({}, d.laneBuff));
    if (d.reveal) st.revealNext = true;
    if (d.immovable) addStatus(st, u, { kind: 'immovable', rounds: (d.selfStatus && d.selfStatus.rounds) || d.rounds || 4 });
    if (d.selfRoot) addStatus(st, u, { kind: 'rooted', rounds: d.rounds || 2 });
    if (d.onHitPoison) addStatus(st, u, { kind: 'venomTouch', power: d.onHitPoison.power, rounds: d.onHitPoison.rounds + 2, dot: d.onHitPoison });
    if (d.onHitExposed) addStatus(st, u, { kind: 'openingTouch', stacks: d.onHitExposed, rounds: 4 });
    if (d.revealIntents) st.revealIntents = Math.max(st.revealIntents || 0, d.revealIntents);
    if (d.revealGold) st.revealGold = true;
    // Momentum advanced: every third consecutive attacking turn strikes twice
    // (single-target only — whirlwinds already scale with bodies hit)
    const mo = perkVal(u.ch, 'momentum', null);
    if (mo && mo.thirdHitTwice && u.consecutiveCount % 3 === 0 && !t.downed && targets.length === 1 && hitScale <= 1) {
      let extra = computeDamage(st, u, t, m);
      if (hitScale > 1) extra *= hitScale;
      dealDamage(st, u, t, extra, tag, { element: d.element, melee: isMelee,
        cannotMiss: !!d.cannotMiss || !!(Sys().knownVal(u.ch, 'accuracy') && u.momentumArmed), ignoreGuards: !!d.ignoreGuards, noReflect: !!d.noReflect });
    }
    // riders
    if (d.status && dealt > 0) {
      for (const [kind, sdef] of Object.entries(d.status)) {
        if (isHostileDot(kind) && t.side === u.side) continue;
        addStatus(st, t, Object.assign({ kind, tier: m.tier, srcAtk: Ch().effStat(u.ch, 'atk'), srcLevel: m.level, srcUid: u.uid }, sdef));
      }
      // A killing blow still leaves its poison on the corpse so it can leap.
      if (t.downed) hopPoison(st, t);
    }
    if ((d.freeze || d.stun) && !t.downed) addStatus(st, t, { kind: 'frozen', skips: d.freeze || d.stun });
    if (d.shock && !t.downed) addStatus(st, t, { kind: 'shocked', pct: d.shock, rounds: d.shockRounds || 3 });
    if (d.seal && !t.downed) addStatus(st, t, { kind: 'sealed', tiers: d.seal.slice(), rounds: d.sealRounds || 2 });
    if (d.defStrip && !t.downed) { t.defStripped = Math.max(t.defStripped || 0, d.defStrip); ev(st, { t: 'sundered', uid: t.uid }); }
    if (d.defStripAll && !t.downed) { t.defStripped = 999; ev(st, { t: 'sundered', uid: t.uid }); }
    if (d.delayTarget && !t.downed) { t.delayed += 4; ev(st, { t: 'delayed', uid: t.uid }); }
    if (d.loseAction && !t.downed) { t.loseNextAction = true; ev(st, { t: 'bound', uid: t.uid }); }
    const ls = u.statuses.find(s => s.kind === 'lifesteal');
    if (ls && dealt > 0) healUnit(st, null, u, Math.round(dealt * ls.pct));
    const bs = u.statuses.find(s => s.kind === 'beastShape');
    if (bs && bs.lifeSteal && dealt > 0) healUnit(st, null, u, Math.round(dealt * bs.lifeSteal));
    // Finisher-like heal riders on damage
    if (d.lifeSteal && dealt > 0) healUnit(st, null, u, Math.round(dealt * d.lifeSteal));
    if (hi === 0 && dealt > 0) applyFlareOnHit(st, u, t, m);
    }
  }
  sayBeat(st, u, d.say, (tgt.downed || felled.has(tgt.uid)) ? 'killed' : 'survived');
  return finishAction(st, u, skillId);
}

// Campaign speech attached to a skill. Silent for anyone without a campaign identity, so a
// kit copied onto an ordinary enemy never tries to deliver a named character's lines.
function sayBeat(st, u, say, slot) {
  const key = say && say[slot];
  if (!key || !u.ch || !u.ch.campaignId) return;
  ev(st, { t: 'campaignBanter', beat: {
    c3: true, combat: true, to: say.to || 'company',
    fid: say.fid || 'gate', who: say.who || u.ch.campaignId, key,
  } });
}

// A parried attacker is cut on the way out. This is the katana's own strike, auto-kill roll
// and all, but it is deliberately not a full action: it cannot be countered back, it does not
// build momentum, and it never chains into a second riposte.
Combat.riposte = function (st, defender, attacker) {
  const skillId = defender.counterRiposte;
  if (!skillId || st.__riposting || !attacker || attacker.downed || attacker.fled) return;
  const m = manifestFor(defender, skillId);
  if (!m) return;
  st.__riposting = true;
  try {
    const d = m.data;
    if (d.autoKillPct && !attacker.ch.boss && st.rng.chance(d.autoKillPct)) {
      attacker.chp = 0; attacker.tempHp = 0; attacker.downed = true;
      ev(st, { t: 'execute', uid: attacker.uid, by: defender.uid, skillId, clean: true, riposte: true });
      onUnitDown(st, attacker); checkEnd(st);
      return;
    }
    ev(st, { t: 'riposte', uid: defender.uid, target: attacker.uid, skillId, name: d.name });
    const dmg = computeDamage(st, defender, attacker, m);
    dealDamage(st, defender, attacker, dmg, 'attack', { melee: true, noReflect: true });
    if (d.status && !attacker.downed) {
      for (const [kind, sdef] of Object.entries(d.status)) {
        addStatus(st, attacker, Object.assign({ kind, tier: m.tier, srcAtk: Ch().effStat(defender.ch, 'atk'), srcLevel: m.level, srcUid: defender.uid }, sdef));
      }
    }
  } finally { st.__riposting = false; }
};

function applyFlareOnHit(st, u, t, m) {
  const f = m && m.flare;
  if (!f || !t || t.downed) return;
  const atk = Ch().effStat(u.ch, 'atk');
  // the flare's cut is a garnish, not the kill tool: half a tier's poison and bleed
  if (f.poison && t.side !== u.side) addStatus(st, t, { kind: 'poison', tier: m.tier, pctMult: 0.5, power: f.poison.power, rounds: f.poison.rounds, stacks: true, srcAtk: atk, srcUid: u.uid });
  if (f.bleed) addStatus(st, t, { kind: 'bleed', tier: m.tier, pctMult: 0.5, power: f.bleed.power, rounds: f.bleed.rounds, stacks: true, srcAtk: atk, srcUid: u.uid });
  if (f.rootRounds) addStatus(st, t, { kind: 'rooted', rounds: f.rootRounds });
  if (f.defStrip) { t.defStripped = Math.max(t.defStripped || 0, f.defStrip); ev(st, { t: 'sundered', uid: t.uid }); }
}

function applyFlareSelf(st, u, m) {
  const f = m && m.flare;
  if (!f) return;
  if (f.guardRounds) addStatus(st, u, { kind: 'guard', scope: 'self', rounds: f.guardRounds });
  if (f.markStorm) u.stormMark = Math.max(u.stormMark || 0, f.markStorm);
  if (f.thornPct) addStatus(st, u, { kind: 'thorns', pct: f.thornPct, rounds: f.thornRounds || 2 });
}

function finishAction(st, u, skillId, opts) {
  if (ADV.GatePerkCombat) ADV.GatePerkCombat.finishAction(st, u);
  opts = opts || {};
  const m = skillId && skillId !== 'basic_attack' ? manifestFor(u, skillId) : null;
  if (m?.data.usesPerBattle != null && !opts.fizzled) spendBattleUse(u, skillId);
  if (skillId !== 'basic_attack' && m && m.data && !(m.data.power > 0) && !m.data.hitScale && !m.data.cleaveRows) {
    breakMomentum(u);
  }
  applyFlareSelf(st, u, m);
  if (m && m.data && m.data.cooldown) {
    u.cooldowns = u.cooldowns || {};
    u.cooldowns[skillId] = m.data.cooldown;
  }
  const freeBuff = !!(m && m.data && m.data.freeBuff);
  const freeAction = !!(m && m.data && m.data.freeAction) && !u.freeActionUsed;
  if (freeAction) u.freeActionUsed = true;
  const free = freeBuff || freeAction;
  if (!free) u.actedThisEncounter = true;
  if (!freeBuff && skillId && skillId !== 'basic_attack') {
    const lv = Sys().recordUse(u.ch, skillId);
    if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId, level: lv.level, tier: lv.tier });
  }
  if (free || u.refundAction) {
    u.refundAction = false;
    ev(st, { t: 'refund', uid: u.uid });
    return { ok: true, refund: true };
  }
  const arch = (m && m.data && m.data.archetype) || (skillId && SK()[skillId] && SK()[skillId].archetype);
  if (!opts.fizzled && arch === 'ranger' && (u.rangerUsesLeft || 0) > 0) {
    u.rangerUsesLeft--;
    ev(st, { t: 'refund', uid: u.uid, why: 'sniper' });
    return { ok: true, refund: true };
  }
  return { ok: true };
}

// Charm's battlefield bribe (request 6): pay a hostile named enemy to walk.
// The fee is spent whether they take it or not; heroes, conscripts and the
// undead cannot be bought. Fee/chance are computed by Game.bribeOffer.
function doBribe(st, u, action) {
  const tgt = st.units.find(x => x.uid === action.targetUid);
  if (!tgt || tgt.downed || tgt.fled) return { ok: false, error: 'no target' };
  const fee = action.fee || 0;
  if ((u.ch.inventory.gold || 0) < fee) return { ok: false, error: 'cannot afford the bribe' };
  u.ch.inventory.gold -= fee;
  tgt.ch.inventory.gold = (tgt.ch.inventory.gold || 0) + fee;
  const success = st.rng.chance(action.chance || 0.5);
  ev(st, { t: 'bribe', uid: u.uid, target: tgt.uid, fee, success });
  if (success) {
    if (Sys().knownVal(u.ch, 'recruitForEncounter')) {
      tgt.side = u.side;
      tgt.ch.recruitedThisEncounter = true;
      ev(st, { t: 'recruit', uid: tgt.uid, by: u.uid });
    } else tgt.fled = true;
    checkEnd(st);
  }
  return { ok: true, success, fee };
}

function combatSolo(st, u) {
  return livingUnits(st, u.side).every(x => x === u);
}
Combat.fleeChance = function (st, u) {
  if (!u || !u.ch) return 0;
  if (u.ch.isConscript || u.ch.isUndead || (u.ch.status === 'hero' && u.ch.grantsHeld)) return 0;
  if (combatSolo(st, u)) return 1;
  const foes = livingUnits(st, u.side === 'a' ? 'b' : 'a');
  const fastest = Math.max(...foes.map(f => Ch().effStat(f.ch, 'spd')), 0);
  let p = C().FLEE_BASE + (Ch().effStat(u.ch, 'spd') - fastest) * C().FLEE_PER_SPD;
  const fleeB = Sys().knownSum(u.ch, 'fleeBonus');
  if (fleeB) p += fleeB;
  if (ADV.GatePerks && ADV.GatePerks.has(u.ch, 'routes')) p += 0.15;
  return Math.max(C().FLEE_MIN, Math.min(C().FLEE_MAX, p));
};
function doFlee(st, u) {
  const p = Combat.fleeChance(st, u);
  if (p <= 0) {
    ev(st, { t: 'fleeBlocked', uid: u.uid });
    return { ok: true, fled: false };
  }
  let success = p >= 1 || st.rng.chance(p);
  if (!success && Sys().knownVal(u.ch, 'autoFlee') && !u.ch.__fallbackUsed) { success = true; u.ch.__fallbackUsed = true; }
  ev(st, { t: 'flee', uid: u.uid, success, chance: p });
  if (success) { u.fled = true; noteLeaderOut(st, u, false); checkEnd(st); }
  return { ok: true, fled: success };
}

// -------------------------------------------------------- sighting/witness
function recordSighting(st, user, skillId, tier) {
  const sk = SK()[skillId];
  if (!sk || sk.universal || sk.unique) return;
  const teacher = (user && user.ch && user.ch.name) || '';
  for (const u of st.units) {
    if (u === user || u.reserved) continue;
    if (!u.witnessedHere.some(w => w.skillId === skillId && w.tier === tier)) {
      u.witnessedHere.push({ skillId, tier, from: teacher });
      // The player learns by being shown. That moment is the whole hook, so it
      // gets announced live instead of being banked silently until the fight
      // ends — the UI drains this right after the 'use' beat.
      if (u.ch && u.ch.isPlayer && !ADV.SkillSys.isWitnessed(u.ch, skillId)) {
        st.__witnessShown = st.__witnessShown || 0;
        if (st.__witnessShown < 2) {
          st.__witnessPending = st.__witnessPending || [];
          if (!st.__witnessPending.some(w => w.skillId === skillId)) {
            st.__witnessShown++;
            st.__witnessPending.push({ skillId, tier, from: teacher, uid: user.uid });
          }
        }
      }
    }
  }
}

// Called by the quest layer when the encounter resolves: survivors register sightings.
// Survival, not consciousness: downed-but-alive still witnessed everything (§3).
Combat.registerWitnesses = function (st) {
  const out = [];
  for (const u of st.units) {
    if (u.fled && u.witnessedHere.length === 0) continue;
    if (u.ch.isMonster && u.downed) continue;              // dead monsters learn nothing
    if (u.downed && !u.survivor) { /* downed units survive if their side didn't wipe — handled by caller flag */ }
    for (const w of u.witnessedHere) {
      const before = ADV.SkillSys.isWitnessed(u.ch, w.skillId);
      ADV.SkillSys.witness(u.ch, w.skillId, w.tier, w.from);
      if (!before && u.ch.isPlayer) out.push(w);
    }
  }
  return out;
};

// A perk is passive, so nothing in an action could ever charge it: SkillSys.recordUse is
// called from the three active-skill paths only, and perk entries sat at 0 uses forever.
// Measured before this: 200 fights, Arcane Focus still level 1. That put every perk's
// intermediate and advanced manifestation — Rampart, Arcane Mastery, Fire Lord, Winter
// Court, Storm Sovereign — out of reach of play entirely, leaving the trainer and gear sets
// as the only routes to half the progression in the game.
//
// One use per perk per battle fought, which is parity rather than generosity: an active in
// an ordinary three-skill kit earns about one use a fight too, because the three of them
// share the same turns. A perk competes for nothing, so it must not earn more than that.
// Only the party side: an enemy's kit is re-derived from __kit0 by Difficulty.toughen every
// time the setting is read, so charging foes would be wasted work.
Combat.recordPerkUse = function (st) {
  if (!st || st.__perksCharged) return;
  st.__perksCharged = true;
  for (const u of st.units) {
    if (u.side !== 'a' || !u.ch || u.downed || u.fled) continue;
    if (ADV.Difficulty && ADV.Difficulty.isFoe(u.ch)) continue;
    for (const e of (u.ch.perks || []).slice()) {
      const lv = Sys().recordUse(u.ch, e.skillId);
      if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId: e.skillId, level: lv.level, tier: lv.tier });
    }
  }
};

// ---------------------------------------------------------------- end check
function checkEnd(st) {
  if (st.over) return;
  const a = livingUnits(st, 'a').length + st.units.filter(u => u.side === 'a' && u.reserved && !u.downed && !u.fled).length;
  const b = livingUnits(st, 'b').length + st.units.filter(u => u.side === 'b' && u.reserved && !u.downed && !u.fled).length;
  // Combat ends only when one side is entirely dead or fled (§15a)
  if (a === 0 || b === 0) {
    st.over = true;
    st.winner = a > 0 ? 'a' : (b > 0 ? 'b' : null);
    confirmLeaderOutcome(st);
    Combat.applySurvivalGrowth(st);
    Combat.recordPerkUse(st);
    ev(st, { t: 'end', winner: st.winner, reason: st.leaderFell ? 'leaderFell' : (st.leaderFled ? 'leaderFled' : undefined) });
  }
}

// Post-victory recovery: winners restore the active difficulty's share of max HP.
Combat.applyPostVictoryRecovery = function (chars) {
  for (const ch of chars) {
    if (ch.combatHp == null) continue;
    const max = Ch().maxHp(ch);
    const pct = ADV.Difficulty ? ADV.Difficulty.recoverPct() : C().POST_VICTORY_RECOVERY_PCT;   // a difficulty lever
    ch.combatHp = Math.min(max, ch.combatHp + Math.round(max * pct));
  }
};

// Export end-of-encounter HP back onto characters for attrition across the quest (§8).
// Survival growth (request, balance pass): Bulwark and Arena Champion holders gain
// 20 max HP for every battle they come out of alive — each encounter of a quest
// counts — but it is a quest's worth of health: `questHp` rides on max HP until the
// company is home again (Game.startQuest / completeQuest clear it). Applied once
// per battle, on export.
Combat.applySurvivalGrowth = function (st) {
  if (st.__growthApplied) return [];
  st.__growthApplied = true;
  const grown = [];
  for (const u of st.units) {
    const ch = u.ch;
    if (ch.isMonster || ch.campaign) continue;
    const alive = !u.downed || st.winner === u.side;       // downed on the winning side gets up at 1 HP
    if (!alive) continue;
    let gain = 0;
    for (const e of ch.perks) { const sk = SK()[e.skillId]; if (sk && sk.survivalHp) gain += sk.survivalHp; }
    if (!gain) continue;
    ch.questHp = (ch.questHp || 0) + gain;
    ch.survivalBattles = (ch.survivalBattles || 0) + 1;
    if (u.gateBaseMax) {
      const bonus = u.maxHp - u.gateBaseMax;
      u.gateBaseMax = Math.max(Ch().maxHp(ch), ch.hpFloor || 0);
      u.maxHp = u.gateBaseMax + bonus;
    } else u.maxHp = Math.max(Ch().maxHp(ch), ch.hpFloor || 0);
    if (!u.downed) u.chp += gain;                           // the new headroom is real at once
    ev(st, { t: 'survivalGrowth', uid: u.uid, gain, total: ch.survivalBattles });
    grown.push({ ch, gain });
  }
  return grown;
};

Combat.exportHp = function (st) {
  Combat.applySurvivalGrowth(st);
  for (const u of st.units) {
    u.ch.combatHp = u.downed ? 0 : (ADV.GatePerkCombat ? ADV.GatePerkCombat.exportHp(u) : u.chp);
    u.ch.wasDowned = u.downed;
    u.ch.hasFled = u.fled;
    // Purify's ward outlasts the battle just long enough to refuse the chains (request 7)
    u.ch.__purifiedAtEnd = u.statuses.some(x => x.kind === 'purified');
  }
};

// Internals handed to js/core/combat_effects.js (bespoke campaign skills).
Combat._internals = {
  dealDamage, computeDamage, healUnit, addStatus, removeStatus, livingUnits, laneUnits,
  applyTakenReduction, recoveryLeft,
  ev, perkVal, LANE_IDX, checkEnd, onUnitDown, finishAction, addExposed, canHealOther, canWard,
  NEG_STATUSES, POS_STATUSES, DOT_STATUSES, endRoundTicks, applyRawDamage, applyDruidHeal,
  applyStealth, applyUntargetable, HIDE_CAP,
  hopDots, hopPoison, pickAdjacentFoe,
};
ADV.Combat = Combat;
})();
