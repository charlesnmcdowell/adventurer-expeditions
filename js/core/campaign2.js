// Ninja vs Pirates campaign core (add-on §1, §1a-§1d, §5, §6, §7).
//
// Differs from the first campaign in three ways, and only three:
//   1. Up to THREE factions per life, if alignment permits (§1b).
//   2. An alignment lock: law and criminal are incompatible, criminal is
//      permanent for that life, only death clears it (§1a).
//   3. Progress lives in WORLD state, so a nepotism heir resumes it and a
//      reincarnated character is locked out of it (§1c).
//
// Everything else — enemy spawning, actors, beats, the rival's scripted death,
// the Q5 boss ally — reuses ADV.Campaign's generic helpers against the shared
// data tables. This file installs itself over those entry points at the bottom,
// so game.js and the UI need no changes to drive either campaign.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const D = () => ADV.DATA;
const C2 = {};

C2.FACTIONS = ['bell', 'green', 'tally', 'navy'];
C2.MAX_PER_LIFE = 3;
C2.WAR_CLOSES_AT = 3;          // §6: 3 quests against a faction and it stops asking
C2.WAR_OPENS_AT = 3;           // §6: 3 against its enemy and the other side asks anyway

C2.isC2 = (fid) => C2.FACTIONS.includes(fid);
C2.faction = (fid) => D().FACTIONS[fid];

// ---------------------------------------------------------------- state
C2.fresh = function () {
  return {
    alignment: null,            // null | 'law' | 'criminal' — the life's lock (§1a)
    joined: [],                 // faction ids, in join order
    m: {},                      // per-faction membership records
    pendingOffer: null, offers: {}, declined: {},
    contractsTotal: 0, war: {}, // war[fid] = quests completed AGAINST that faction
    beats: [], actors: {},
    godRuns: 0,                 // god-line clears this life (payout halves each time)
  };
};
C2.state = function (game) {
  if (!game.campaign2) game.campaign2 = C2.fresh();
  const w = game.world;
  if (!w.campaignProgress) w.campaignProgress = [];      // §9 world-state addition
  if (!w.campaignWorld) w.campaignWorld = { antlerFirstHorn: 'crane' };
  return game.campaign2;
};
C2.member = function (game, fid) { return C2.state(game).m[fid] || null; };
C2.joined = function (game) { return C2.state(game).joined.slice(); };
C2.freshMember = function () {
  return { stage: 0, titleTier: 0, rivalAlive: true, rivalToggle: false, completed: false,
           gearIssued: false, reissued: false, seenBoss: false, endCardDue: false, repeatables: [] };
};

// ---------------------------------------------------------------- world progress (§1c)
// One row per faction any character in this bloodline has accepted. The row is
// what a nepotism heir reads and what locks a reincarnation out.
C2.progressRow = function (world, fid) {
  return (world.campaignProgress || []).find(r => r.factionId === fid) || null;
};
C2.writeProgress = function (game, fid) {
  const world = game.world; const m = C2.member(game, fid);
  if (!m) return;
  world.campaignProgress = world.campaignProgress || [];
  let row = C2.progressRow(world, fid);
  if (!row) { row = { factionId: fid }; world.campaignProgress.push(row); }
  row.questReached = m.stage; row.titleTier = m.titleTier;
  row.rivalAlive = m.rivalAlive; row.completed = m.completed;
  row.consumed = true;                                    // §1c: accepting consumes it
  C2.markConsumed(game, fid);
};
// A campaign the bloodline has already started is closed to a reincarnation.
// The row lives in world state so a nepotism heir (same world) resumes it; the
// consumed flag is ALSO mirrored into meta, because reincarnation builds a
// fresh world and would otherwise forget. (Deviation from §9, which assumed
// world state survives reincarnation in this engine. It does not.)
C2.markConsumed = function (game, fid) {
  game.meta.campaign2Consumed = game.meta.campaign2Consumed || {};
  game.meta.campaign2Consumed[fid] = true;
  ADV.Save.saveMeta(game);
};
C2.consumed = function (game, fid) {
  const row = C2.progressRow(game.world, fid);
  if (row && row.consumed) return true;
  return !!(game.meta.campaign2Consumed || {})[fid];
};

// ---------------------------------------------------------------- alignment lock (§1a)
C2.alignmentOf = function (game) { return C2.state(game).alignment; };
C2.alignmentAllows = function (game, fid) {
  const f = C2.faction(fid); if (!f) return false;
  if (f.alignment === 'neutral') return true;             // the Bell fits anything
  const lock = C2.state(game).alignment;
  if (!lock) return true;
  return lock === f.alignment;
};
function applyLock(game, fid) {
  const s = C2.state(game); const f = C2.faction(fid);
  if (f.alignment !== 'neutral' && !s.alignment) s.alignment = f.alignment;
}

// ---------------------------------------------------------------- eligibility (§1, §6)
C2.eligibleFor = function (game, fid) {
  const s = C2.state(game); const f = C2.faction(fid);
  if (!f || !C2.isC2(fid)) return false;
  if (s.m[fid]) return false;                             // already in
  if (s.declined[fid]) return false;
  if (s.joined.length >= C2.MAX_PER_LIFE) return false;
  if (!C2.alignmentAllows(game, fid)) return false;
  if (C2.consumed(game, fid) && !s.m[fid]) return false;  // §1c the line has burned it
  if ((s.war[fid] || 0) >= C2.WAR_CLOSES_AT) return false;  // §6.1 you fought them
  // §6.2 proven hostility to the other side opens this one regardless of contracts
  if ((s.war[f.opposed] || 0) >= C2.WAR_OPENS_AT) return true;
  const gate = f.gate || { contracts: 0 };
  if (s.contractsTotal < Math.max(1, gate.contracts)) return false;
  if (gate.alignment) {
    const got = (s.byAlignment || {})[gate.alignment] || 0;
    if (got < gate.contracts) return false;
  }
  return true;
};

// Called after every ordinary contract (including faction-war ones).
C2.onContractComplete = function (game, quest, failed) {
  const s = C2.state(game);
  if (failed) return;
  s.contractsTotal++;
  s.byAlignment = s.byAlignment || {};
  const al = quest.factionAlignment;
  if (al === 'criminal' || al === 'law') s.byAlignment[al] = (s.byAlignment[al] || 0) + 1;
  if (quest.warAgainst) s.war[quest.warAgainst] = (s.war[quest.warAgainst] || 0) + 1;
  C2.considerOffers(game);
};

// §1: first contact after the first contract, alignment decided by what they took.
C2.considerOffers = function (game) {
  const s = C2.state(game);
  if (s.pendingOffer) return;
  const order = C2.offerOrder(game);
  for (const fid of order) if (C2.eligibleFor(game, fid)) { s.pendingOffer = fid; s.offers[fid] = true; return; }
};
C2.offerOrder = function (game) {
  const s = C2.state(game);
  const crim = (s.byAlignment || {}).criminal || 0, law = (s.byAlignment || {}).law || 0;
  if (crim > law) return ['tally', 'bell', 'green', 'navy'];
  if (law > crim) return ['green', 'navy', 'bell', 'tally'];
  return ['bell', 'green', 'navy', 'tally'];
};
C2.currentOffer = function (game) {
  const s = C2.state(game);
  if (!s.pendingOffer) return null;
  return C2.eligibleFor(game, s.pendingOffer) ? s.pendingOffer : (s.pendingOffer = null);
};

// ---------------------------------------------------------------- joining
C2.accept = function (game, fid) {
  const s = C2.state(game);
  if (!C2.eligibleFor(game, fid)) return { ok: false, why: 'not eligible' };
  s.m[fid] = C2.freshMember();
  s.joined.push(fid);
  s.pendingOffer = null;
  applyLock(game, fid);
  C2.setTitle(game, fid, 1);
  const f = C2.faction(fid);
  C2.pushBeat(game, f.recruiter, 'tutorial', fid);
  C2.pushBeat(game, C2.bossId(game, fid), 'first', fid);
  C2.ensureActors(game, fid);
  C2.writeProgress(game, fid);
  ADV.Save.saveGame(game);
  return { ok: true };
};
C2.decline = function (game, fid) {
  const s = C2.state(game);
  s.declined[fid] = true; s.pendingOffer = null;
  C2.considerOffers(game);
  ADV.Save.saveGame(game);
};
C2.menuVisible = function (game) {
  const s = C2.state(game);
  return !!(s.joined.length || s.pendingOffer || Object.keys(s.offers).length);
};

// The Admiralty's boss is dead in a world where a previous life killed him (§2e).
C2.bossId = function (game, fid) {
  if (fid === 'navy' && game.world.campaignWorld.vaneKesslerDead) return 'crell';
  return C2.faction(fid).boss;
};

// ---------------------------------------------------------------- titles (§5)
C2.setTitle = function (game, fid, tier) {
  const p = ADV.Game.player(game);
  p.factionTitles = p.factionTitles || [];
  const row = p.factionTitles.find(t => t.factionId === fid);
  if (row) row.tier = tier; else p.factionTitles.push({ factionId: fid, tier });
  const m = C2.member(game, fid); if (m) m.titleTier = tier;
};
C2.titleNames = function (ch) {
  return (ch.factionTitles || []).map(t => D().FACTIONS[t.factionId].titles[t.tier - 1]);
};

// ---------------------------------------------------------------- actors & enemies
C2.ensureActors = function (game, fid) {
  const s = C2.state(game); const f = C2.faction(fid);
  for (const role of ['rival', 'boss', 'antagonist', 'recruiter']) {
    const id = f[role];
    if (id && !s.actors[id]) s.actors[id] = ADV.Campaign.makeActor(D().CAMPAIGN_CHARS[id]);
  }
};
C2.actor = function (game, id) {
  const s = C2.state(game);
  if (!s.actors[id]) s.actors[id] = ADV.Campaign.makeActor(D().CAMPAIGN_CHARS[id]);
  return s.actors[id];
};

// A skin is a name + palette variant, rolled at spawn (§4).
C2.applySkin = function (rng, ch, typeId) {
  const t = D().CAMPAIGN_ENEMIES[typeId];
  if (!t || !t.skins || !t.skins.length) return ch;
  const skin = rng.pick(t.skins);
  ch.skin = skin.name; ch.skinTint = skin.tint;
  ch.name = t.name + ' · ' + skin.name;
  return ch;
};
C2.spawnEnemy = function (rng, typeId, level, opts) {
  const ch = ADV.Campaign.spawnEnemy(rng, typeId, level, opts);
  if (!opts || !opts.name) C2.applySkin(rng, ch, typeId);
  return ch;
};

C2.spawnEncounter = function (game, quest, encIdx) {
  const rng = game.rng.fork('c2q' + quest.id + ':' + encIdx);
  const spec = (quest.cEnc && quest.cEnc[encIdx]) || {};
  const [lo, hi] = quest.enemyLevels;
  const lvl = Math.round(lo + (hi - lo) * (encIdx / Math.max(1, quest.cEnc.length - 1)));
  const out = [];
  const world = game.world;
  for (const t of spec.types || []) {
    if (D().CAMPAIGN_ENEMIES[t]) out.push(C2.spawnEnemy(rng, t, lvl, { world }));
    else out.push(ADV.Character.makeEnemy(rng, t, { level: lvl, world }));
  }
  if (spec.mini) {
    const mbd = D().CAMPAIGN_MINIBOSSES[spec.mini];
    if (mbd) {
      const count = mbd.count || 1;
      for (let i = 0; i < count; i++) {
        out.push(C2.spawnEnemy(rng, mbd.base, hi, {
          boss: count === 1, name: mbd.name + (count > 1 ? ' ' + (i + 1) : ''),
          signature: mbd.signature, equips: mbd.equips, undead: mbd.undead,
          world,
        }));
      }
    }
  }
  for (const t of spec.with || []) out.push(C2.spawnEnemy(rng, t, lvl, { world }));
  if (spec.boardBoss) {
    const bb = ADV.Character.makeEnemy(rng, spec.boardBoss, { level: hi, world });
    if (quest.godLine) { bb.godLineBoss = true; ADV.Campaign.grantGodsEdict(bb); }
    out.unshift(bb);
  }
  if (spec.boss) {
    const boss = C2.actor(game, spec.boss);
    boss.combatHp = null; boss.campaignExit = false; boss.boss = true; boss.isBossFight = true;
    out.unshift(boss);
  }
  if ((spec.mini || spec.boss || spec.boardBoss) && !quest.war) ADV.Campaign.guardBoss(game, out, quest.factionId, hi, rng, (t, l, o) => C2.spawnEnemy(rng, t, l, Object.assign({ world }, o || {})));
  return out;
};

// ---------------------------------------------------------------- the god line (§7)
// The Pale Mother raises what falls, on either side, at 1.5x stats. Called
// from the combat loop by the UI/harness after each round of a god fight.
C2.godRaise = function (game, st) {
  const boss = st.units.find(u => u.ch.raisesTheDead && !u.downed);
  if (!boss) return [];
  const raised = [];
  for (const u of st.units) {
    if (!u.downed || u.__raisedByGod) continue;
    if (u.side === boss.side) continue;
    u.__raisedByGod = true;
    const ch = u.ch;
    const copy = ADV.Character.base({
      name: 'The Risen ' + ch.name, sex: ch.sex, species: 'human',
      stats: Object.assign({}, ch.stats), portraitSeed: ch.portraitSeed, portraitKind: 'enemy',
      portraitId: 'grave_acolyte', isMonster: true, isUndead: true, campaignEnemy: true,
      perkCap: 8, activeCap: 8, statusImmunities: ['poison', 'bleed', 'burn'],
      personality: { aggression: 80, greed: 0, caution: 0, loyalty: 0, pride: 0 },
    });
    for (const k of ['hp', 'atk', 'def', 'spd']) copy.stats[k] = Math.round(copy.stats[k] * 1.5);
    for (const e of ch.actives.slice(0, 3)) copy.actives.push({ skillId: e.skillId, level: e.level, uses: 0 });
    ADV.Combat.spawnReinforcement(st, copy, boss.side);
    raised.push(copy);
  }
  return raised;
};

// ---------------------------------------------------------------- quests (§5)
C2.buildQuest = function (game, fid, n) {
  const f = C2.faction(fid);
  const src = D().CAMPAIGN_QUESTS[fid][n - 1];
  const T = C().QUEST_TIERS;
  return {
    id: 'c2_' + fid + '_' + n, campaign: true, campaign2: true, factionId: fid, n,
    name: src.name, brief: src.brief, storyCaption: src.storyCaption, tier: src.tier, track: 'campaign',
    factionAlignment: f.alignment === 'neutral' ? 'neutral' : f.alignment,
    payout: Math.max(C().CAMPAIGN_MIN_PAY || 500, n === 5 ? T.boss.partyPay : T[src.tier].partyPay),
    enemyLevels: T[src.tier].enemyLevels,
    encounters: src.enc.map(e => ({ enemyTypeIds: [], boss: !!e.boss, mini: !!e.mini, campaign: true })),
    cEnc: src.enc, rival: !!src.rival, rivalDies: !!src.rivalDies, bossAlly: !!src.bossAlly, isBoss: n === 5,
  };
};
C2.questStatus = function (game, fid, n) {
  const m = C2.member(game, fid); if (!m) return 'locked';
  if (n <= m.stage) return 'done';
  return n === m.stage + 1 ? 'open' : 'locked';
};
C2.hallView = function (game, fid) {
  const m = C2.member(game, fid); const f = C2.faction(fid);
  if (!m) return null;
  const p = ADV.Game.player(game);
  const title = (p.factionTitles || []).find(t => t.factionId === fid);
  return {
    faction: f, stage: m.stage, titleTier: m.titleTier,
    title: title ? f.titles[title.tier - 1] : null,
    nextTitle: m.titleTier < 3 ? f.titles[m.titleTier] : null,
    nextTitleAt: m.titleTier === 1 ? 'complete quest 2' : m.titleTier === 2 ? 'complete quest 4' : null,
    quests: [1, 2, 3, 4, 5].map(n => Object.assign({ n, status: C2.questStatus(game, fid, n) }, D().CAMPAIGN_QUESTS[fid][n - 1])),
    rivalAvailable: m.stage >= 2 && m.rivalAlive, rivalToggle: m.rivalToggle,
    rival: D().CAMPAIGN_CHARS[f.rival], boss: D().CAMPAIGN_CHARS[C2.bossId(game, fid)],
    completed: m.completed, canReissue: m.completed && !m.reissued && p.equippedSet !== f.gearSet,
    speechUnlocked: m.stage >= 2,
    alsoIn: C2.joined(game).filter(x => x !== fid).map(x => C2.faction(x).name),
  };
};

// Rival / boss riding along on a campaign2 quest (§5).
C2.alliesFor = function (game, q) {
  if (!q || !q.campaign2) return [];
  const fid = q.factionId; const m = C2.member(game, fid); const f = C2.faction(fid);
  if (!m) return [];
  const out = [];
  if (q.rival && m.rivalAlive && m.rivalToggle) out.push(C2.actor(game, f.rival));
  if (q.bossAlly) out.push(C2.actor(game, C2.bossId(game, fid)));
  return out;
};

// ---------------------------------------------------------------- beats (§2)
C2.lines = function (fid, who, key) {
  const dlg = (D().CAMPAIGN2_DIALOGUE || {})[fid];
  return (dlg && dlg[who] && dlg[who][key]) ? dlg[who][key] : [];
};
C2.pushBeat = function (game, who, key, fid, extra) {
  C2.state(game).beats.push(Object.assign({ who, key, fid, c2: true }, extra || {}));
};
C2.takeBeats = function (game) { const s = C2.state(game); const b = s.beats; s.beats = []; return b; };

C2.departureBeats = function (game, q) {
  const fid = q.factionId; const f = C2.faction(fid); const m = C2.member(game, fid);
  const out = [];
  if (!m) return out;
  if (q.n === 3 && m.rivalToggle) out.push({ who: f.rival, key: 'join3', fid, c2: true });
  if (q.n === 4 && m.rivalToggle) out.push({ who: f.rival, key: 'before4', fid, c2: true });
  if (q.n === 5) out.push({ who: C2.bossId(game, fid), key: 'hunt', fid, c2: true });
  return out;
};
C2.banter = function (game, st, roundN) {
  const q = game.quest && game.quest.quest;
  if (!q || !q.campaign2) return null;
  if ((roundN || st.round) !== 2 || st.__bantered) return null;
  st.__bantered = true;
  const fid = q.factionId; const f = C2.faction(fid); const m = C2.member(game, fid);
  if (!m) return null;
  let who = null, key = null;
  if (q.bossAlly) { who = C2.bossId(game, fid); key = 'fight'; }
  else if (q.rival && m.rivalToggle && m.rivalAlive) { who = f.rival; key = 'banter'; }
  if (!who) return null;
  if (st && st.units && !st.units.some(u => u.ch && u.ch.campaignId === who && !u.downed && !u.fled)) return null;
  const lines = ADV.Campaign.pickSpoken(game, who, C2.lines(fid, who, key), { limit: 1 });
  if (!lines.length) return null;
  const line = game.rng.pick(lines);
  const all = C2.lines(fid, who, key);
  return { who, key, line, voOffset: Math.max(0, all.indexOf(line)), fid, c2: true };
};
C2.rivalDeathSequence = function (game, fid) {
  const f = C2.faction(fid);
  return [
    { who: f.antagonist, key: 'appear', fid, c2: true },
    { who: f.rival, key: 'death', fid, c2: true, death: true },
    { who: f.antagonist, key: 'afterKill', fid, c2: true },
  ];
};
C2.finalOpener = function (game, fid) {
  return [{ who: C2.faction(fid).antagonist, key: 'final', fid, c2: true }];
};
C2.afterBossBeats = function (game, fid) {
  const boss = C2.bossId(game, fid);
  return [{ who: boss, key: 'afterFall', fid, c2: true }, { who: boss, key: 'ending', fid, c2: true }];
};

// ---------------------------------------------------------------- progression
C2.onQuestDone = function (game, q) {
  const fid = q.factionId; const m = C2.member(game, fid); const f = C2.faction(fid);
  if (!m || q.n !== m.stage + 1) return;
  m.stage = q.n;
  const rec = f.recruiter, riv = f.rival;
  if (q.n === 1) { C2.pushBeat(game, rec, 'debrief1', fid); C2.pushBeat(game, riv, 'after1', fid); }
  if (q.n === 2) { C2.pushBeat(game, rec, 'debrief2', fid); C2.pushBeat(game, riv, 'after2', fid); C2.setTitle(game, fid, 2); }
  if (q.n === 3) { C2.pushBeat(game, rec, 'debrief3', fid); if (m.rivalToggle) C2.pushBeat(game, riv, 'after3', fid); }
  if (q.n === 4) { m.rivalAlive = false; m.rivalToggle = false; C2.pushBeat(game, rec, 'debrief4', fid); C2.setTitle(game, fid, 3); }
  if (q.n === 5) C2.complete(game, fid);
  C2.writeProgress(game, fid);
  ADV.Save.saveGame(game);
};

C2.complete = function (game, fid) {
  const m = C2.member(game, fid); const f = C2.faction(fid);
  const p = ADV.Game.player(game); const world = game.world;
  m.completed = true; m.endCardDue = true;
  p.ownedSets = (p.ownedSets || []).concat(f.gearSet);
  if (!p.equippedSet) p.equippedSet = f.gearSet;
  m.gearIssued = true;
  // §1d horizontal slice: one completion unlocks all 64, alignment be damned
  game.meta.campaign2SkillsUnlocked = true;
  ADV.Save.saveMeta(game);
  // §2e: killing Vane-Kessler is a world fact the Admiralty remembers
  if (fid === 'tally') {
    world.campaignWorld.vaneKesslerDead = true;
    ADV.World.feed(world, 'The Admiralty has lost its admiral. Every captain in the fleet knows the name of who took him.', [p.id]);
  }
  if (fid === 'navy') ADV.World.feed(world, 'The Tide-Taker is dead and the shallows are quiet. The Admiralty writes it down as the tenth engagement.', [p.id]);
  if (fid === 'bell') ADV.World.feed(world, 'A bell that has not rung in twenty years rang once, at night, and stopped.', [p.id]);
  if (fid === 'green') ADV.World.feed(world, 'The Green-Eyed buried a woman nobody would admit was a swordsman. Lord Isamu attended.', [p.id]);
};

C2.reissue = function (game, fid) {
  const m = C2.member(game, fid); const f = C2.faction(fid); const p = ADV.Game.player(game);
  if (!m || !m.completed || m.reissued) return false;
  p.equippedSet = f.gearSet; m.reissued = true;
  ADV.Save.saveGame(game);
  return true;
};

// §1d: all 64 purchasable once ANY of the four completes; a faction's own
// perks open the moment you join it; otherwise witness-only.
C2.skillPurchasable = function (ch, skillId, meta) {
  const sk = D().SKILLS[skillId];
  if (!sk || !sk.campaign2) return null;                  // not ours to judge
  if (meta && meta.campaign2SkillsUnlocked) return true;
  if (ADV.SkillSys.isWitnessed(ch, skillId)) return true;
  const titles = ch.factionTitles || [];
  if (sk.kind === 'perk' && titles.some(t => t.factionId === sk.faction)) return true;
  return false;
};

// ---------------------------------------------------------------- death (§1c)
// Reincarnation: everything the line started is closed. Nepotism: resumed.
C2.onReincarnate = function (game) {
  game.campaign2 = C2.fresh();
};
C2.onInherit = function (game) {
  const s = game.campaign2 = C2.fresh();
  const world = game.world;
  const p = ADV.Game.player(game);
  for (const row of (world.campaignProgress || [])) {
    if (!C2.isC2(row.factionId)) continue;
    const m = C2.freshMember();
    m.stage = row.questReached || 0;
    m.titleTier = row.titleTier || 0;
    m.rivalAlive = row.rivalAlive !== false;
    m.completed = !!row.completed;
    s.m[row.factionId] = m; s.joined.push(row.factionId);
    applyLock(game, row.factionId);
    if (m.titleTier > 0) {
      p.factionTitles = p.factionTitles || [];
      p.factionTitles.push({ factionId: row.factionId, tier: m.titleTier });
    }
    C2.ensureActors(game, row.factionId);
  }
  return s.joined.slice();
};

// ---------------------------------------------------------------- debug (§11a parity)
C2.debugJump = function (game, fid, n) {
  const s = C2.state(game);
  if (!s.m[fid]) { s.m[fid] = C2.freshMember(); s.joined.push(fid); applyLock(game, fid); }
  const m = s.m[fid];
  m.stage = n - 1;
  const tier = m.stage >= 4 ? 3 : m.stage >= 2 ? 2 : 1;
  C2.setTitle(game, fid, tier);
  m.rivalAlive = m.stage < 4;
  m.rivalToggle = m.stage >= 2 && m.rivalAlive;
  C2.ensureActors(game, fid);
  C2.writeProgress(game, fid);
  ADV.Save.saveGame(game);
  return m;
};

ADV.Campaign2 = C2;

// =====================================================================
// Installation: wrap ADV.Campaign so both campaigns run through the same
// hooks in game.js and the UI. campaign2 quests dispatch here; everything
// else falls through to the original implementation untouched.
// =====================================================================
(function install() {
  const O = {};
  for (const k of ['spawnEncounter', 'alliesFor', 'departureBeats', 'banter', 'takeBeats',
                   'onContractComplete', 'onCampaignQuestDone', 'rivalDeathSequence',
                   'finalOpener', 'afterBossBeats', 'skillPurchasable', 'reset',
                   'affects', 'levelRate', 'titleLifts', 'lines']) O[k] = ADV.Campaign[k];

  ADV.CampaignRoutes.register('factions', {...C2,
    onCampaignQuestDone:C2.onQuestDone, acceptsFaction:fid=>C2.isC2(fid)});

  // Skills: campaign2 skills answer to campaign2's rules, the rest to campaign1's.
  ADV.Campaign.skillPurchasable = function (ch, skillId, meta) {
    const sk = ADV.DATA.SKILLS[skillId];
    if (!sk || !sk.campaign2) return O.skillPurchasable(ch, skillId, meta);
    if (meta && meta.campaign2SkillsUnlocked) return true;
    if (ADV.SkillSys.isWitnessed(ch, skillId)) return true;
    const titles = ch.factionTitles || [];
    return sk.kind === 'perk' && titles.some(t => t.factionId === sk.faction);
  };

  // Titles: a character may now hold up to four at once (one campaign1 + three
  // campaign2). Every title lifts its own faction's skills and archetypes.
  function titleList(ch) {
    const out = [];
    if (ch.factionTitle) out.push(ch.factionTitle);
    for (const t of (ch.factionTitles || [])) out.push(t);
    return out;
  }
  ADV.Campaign.titles = titleList;
  function affectsTitle(t, skillId) {
    const sk = ADV.DATA.SKILLS[skillId];
    if (!sk || !t) return false;
    if (sk.faction === t.factionId) return true;
    const f = ADV.DATA.FACTIONS[t.factionId];
    return !!(sk.archetype && f && f.archetypes.includes(sk.archetype));
  }
  ADV.Campaign.affects = (ch, skillId) => titleList(ch).some(t => affectsTitle(t, skillId));
  ADV.Campaign.levelRate = function (ch, skillId) {
    let rate = 1;
    for (const t of titleList(ch)) {
      if (!affectsTitle(t, skillId)) continue;
      rate = Math.max(rate, t.tier >= 2 ? 3 : 2);
    }
    return rate;
  };
  ADV.Campaign.titleLifts = (ch, skillId) =>
    titleList(ch).some(t => t.tier >= 3 && affectsTitle(t, skillId));

  // Campaign.reset is the NEPOTISM path in game.js: campaign1 clears (the heir
  // is uncontacted), campaign2 resumes from world progress (§1c).
  ADV.Campaign.reset = function (game) {
    O.reset(game);
    C2.onInherit(game);
  };
})();
})();
