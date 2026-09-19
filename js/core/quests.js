// Quest board, encounter verbs, payouts, faction shifts (§8, §15a, §16).
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Sys = () => ADV.SkillSys;

const Quests = {};
let QID = 1;
Quests.resetIds = function (n) { QID = n || 1; };

Quests.tutorialNeedsNeutral = function (game) {
  const t = game && game.tutorial;
  if (!t || (t.step !== 'tour' && t.step !== 'firstQuest')) return false;
  // Headless soaks never load the tutor module and never leave 'tour', so
  // they must not freeze every refresh on the first-hour board.
  if (typeof ADV.Tutor === 'undefined') return false;
  if (game.meta && game.meta.lives > 1) return false;
  const p = game.player || (game.world && ADV.World && ADV.World.byId(game.world, game.world.playerId));
  if (p && (p.fatherId || p.motherId)) return false;
  return true;
};

Quests.generateBoard = function (world, rng, game) {
  // Keep board rolls off the world clock stream so a refresh cannot
  // rewrite the next tick's assassinations and outings.
  if (rng && typeof rng.fork === 'function') rng = rng.fork('board:' + ((world && world.questClock) || 0));
  const board = [];
  const factions = ['law', 'criminal', 'neutral'];
  const forceTutNeutral = Quests.tutorialNeedsNeutral(game);
  for (const tier of [1, 2, 3]) {
    for (const track of ['solo', 'party']) {
      const n = tier === 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const fac = (forceTutNeutral && tier === 1 && track === 'solo') ? 'neutral' : rng.pick(factions);
        board.push(Quests.make(rng, tier, track, fac));
      }
    }
  }
  board.push(Quests.make(rng, 'boss', 'party', rng.pick(factions)));
  // named solo bounties: 300g at reputation 10, 600g mini-boss at 15
  board.push(Quests.makeSoloPremium(rng, 'solo300', rng.pick(factions)));
  board.push(Quests.makeSoloPremium(rng, 'solo600', 'neutral'));
  // the debuff contracts (request 14): poison, fire, frozen, heal-cancel crews
  for (const hz of ['hazard2', 'hazard2', 'hazard3', 'hazard3']) board.push(Quests.makeHazard(rng, hz, rng.pick(factions)));
  // the faction war (add-on §6): two rotating contracts against the four
  // ninja/pirate factions — the only place most players ever see them
  for (const q of Quests.makeWarBoard(world, rng)) board.push(q);
  for (const q of Quests.makeGodBoard(world, rng)) board.push(q);
  if (forceTutNeutral) Quests.forceTutorialNeutrals(board, rng);
  return board;
};

// Live saves from before camp-locked generation can still be on firstQuest
// with a law or criminal Tier-1 solo. Rewrite those so the tour cannot
// push the player into a banner.
Quests.forceTutorialNeutrals = function (board, rng) {
  if (!board) return board;
  let n = 0;
  for (let i = 0; i < board.length; i++) {
    const q = board[i];
    if (!q || q.track !== 'solo' || q.tier !== 1) continue;
    if (q.factionAlignment !== 'neutral' || !Quests.foesMatchAlignment(q)) {
      board[i] = Quests.make(rng, 1, 'solo', 'neutral');
    }
    n++;
  }
  while (n < 2) {
    board.unshift(Quests.make(rng, 1, 'solo', 'neutral'));
    n++;
  }
  return board;
};

// ---- Alignment camps -------------------------------------------------------
// A contract of one banner never fields its own people.
Quests.campOf = function (tid) {
  const t = (ADV.DATA.ENEMIES && ADV.DATA.ENEMIES[tid])
    || (ADV.DATA.BOSSES && ADV.DATA.BOSSES[tid]);
  return (t && t.camp) || null;
};
Quests.foeCamps = function (faction) {
  if (faction === 'law') return ['criminal'];
  if (faction === 'criminal') return ['law'];
  return ['wild'];
};
Quests.alignmentVs = function (camp) {
  if (camp === 'criminal') return 'law';
  if (camp === 'law') return 'criminal';
  return 'neutral';
};
Quests.enemyLevelsFor = function (tier) {
  const T = C().QUEST_TIERS[tier] || C().QUEST_TIERS[1];
  return T.enemyLevels;
};
// DOT_PROMPT.md §10: at tier 2+, roughly one fight in three carries a healer of
// the same camp. Never at tier 1; never replaces the lead; appends or swaps a filler.
Quests.maybeHealer = function (ids, pool, rng, tier) {
  if (!ids || !ids.length || (tier | 0) < 2) return ids;
  if (ids.some(id => ADV.DATA.ENEMIES[id] && ADV.DATA.ENEMIES[id].healer)) return ids;
  if (!rng.chance(1 / 3)) return ids;
  const camp = Quests.campOf(ids[0]);
  const healers = (pool || []).filter(id => ADV.DATA.ENEMIES[id] && ADV.DATA.ENEMIES[id].healer && (!camp || Quests.campOf(id) === camp));
  if (!healers.length) return ids;
  const h = rng.pick(healers);
  if (ids.length >= 4) ids[ids.length - 1] = h; else ids.push(h);
  return ids;
};
Quests.enemyPool = function (tier, faction, opts) {
  opts = opts || {};
  const camps = Quests.foeCamps(faction);
  const [lo, hi] = opts.levels || Quests.enemyLevelsFor(tier);
  const book = opts.bosses ? ADV.DATA.BOSSES : ADV.DATA.ENEMIES;
  const ids = Object.keys(book).filter(id => {
    const e = book[id];
    if (!e || !camps.includes(e.camp)) return false;
    if (opts.bosses) {
      if (opts.minibossOnly) return !!e.miniboss;
      return !e.miniboss;
    }
    const [elo, ehi] = e.levels || [1, 99];
    return elo <= hi && ehi >= lo;
  });
  if (ids.length) return ids;
  return Object.keys(book).filter(id => book[id] && camps.includes(book[id].camp));
};
function fillTheme(text, enemy) {
  const one = (enemy && enemy.name) || 'beast';
  const many = (enemy && enemy.plural) || (one + 's');
  return String(text || '').replace(/\{es\}/g, many).replace(/\{e\}/g, one);
}

Quests.foesMatchAlignment = function (quest) {
  if (!quest) return true;
  if (quest.war || quest.campaign || quest.godLine) return true;
  const camps = Quests.foeCamps(quest.factionAlignment);
  for (const enc of quest.encounters || []) {
    for (const id of enc.enemyTypeIds || []) {
      const camp = Quests.campOf(id);
      if (camp && !camps.includes(camp)) return false;
    }
  }
  return true;
};

// ---- The faction war (add-on §6) -------------------------------------------
// Ordinary contracts in every respect; the enemies are faction members with
// their full pools, so these are the witnessing ground for all 64 skills.
// A member never sees a contract against their own faction.
Quests.makeWarBoard = function (world, rng) {
  const W = ADV.DATA.FACTION_WAR;
  if (!W) return [];
  const player = ADV.World.byId(world, world.playerId);
  const joined = (player && player.factionTitles || []).map(t => t.factionId);
  const open = Object.keys(W).filter(fid => !joined.includes(fid));
  const pool = open.length >= 2 ? open : Object.keys(W);
  const pick = rng.shuffle(pool.slice()).slice(0, 2);
  return pick.map(fid => Quests.makeWarQuest(rng, fid, 2));
};
Quests.makeWarQuest = function (rng, fid, tier) {
  const w = ADV.DATA.FACTION_WAR[fid];
  const T = C().QUEST_TIERS[tier] || C().QUEST_TIERS[2];
  const bosses = (w.bosses || []).slice(0, 2);
  while (bosses.length < 2 && w.types.length) bosses.push(null);
  const pack = (n) => {
    const ids = [];
    for (let k = 0; k < n; k++) ids.push(rng.pick(w.types));
    return ids;
  };
  const cEnc = [
    { types: pack(3) },
    { types: pack(2), mini: bosses[0] || undefined },
    { types: pack(2), mini: bosses[1] || undefined },
  ];
  const encounters = cEnc.map((e, i) => ({
    enemyTypeIds: (e.types || []).slice(), boss: i > 0, campaign: true,
  }));
  return {
    id: 'war' + (QID++), tier, track: 'party', factionAlignment: w.shift,
    warAgainst: fid, campaign: true, campaign2: true, war: true, special: true,
    name: w.quest, brief: w.brief, speaker: w.speaker || null,
    payout: T.partyPay, enemyLevels: T.enemyLevels,
    encounters, cEnc, isBoss: true,
  };
};

// ---- The god line (add-on §7) ----------------------------------------------
// Party-only, rank 25+, 1000g halving per clear. Two bosses, two routes each:
// one is a healing-denial check, the other a reflect-immunity check.
Quests.godPayout = function (game) {
  const G = ADV.DATA.GOD_LINE;
  const runs = (game.campaign2 && game.campaign2.godRuns) || 0;
  return Math.max(G.minPay, Math.round(G.basePay / Math.pow(2, runs)));
};
Quests.makeGodBoard = function (world, rng) {
  const G = ADV.DATA.GOD_LINE;
  if (!G || !G.routes) return [];
  const seen = {};
  const out = [];
  for (const route of G.routes) {
    if (!route || seen[route.boss]) continue;
    seen[route.boss] = true;
    out.push(Quests.makeGodQuest(world, rng, route));
  }
  return out;
};
Quests.makeGodQuest = function (world, rng, route) {
  const G = ADV.DATA.GOD_LINE;
  if (!G) return null;
  route = route || (rng && rng.pick(G.routes));
  if (!route) return null;
  const T = C().QUEST_TIERS.boss;
  const cEnc = (route.enc || []).map(e => Object.assign({}, e));
  const last = cEnc[cEnc.length - 1] || {};
  if (!last.boss) cEnc.push({ types: (route.adds || []).slice(), boardBoss: route.escortBoss, boss: route.boss });
  const encounters = cEnc.map((e, i) => ({
    enemyTypeIds: (e.types || []).slice(),
    boss: !!(e.boss || e.boardBoss || e.mini || i === cEnc.length - 1),
    campaign: true,
  }));
  return {
    id: 'god_' + route.id, tier: 'boss', track: 'party', factionAlignment: 'neutral',
    campaign: true, campaign2: true, godLine: true, special: true,
    routeId: route.id, godBoss: route.boss, godDomain: route.domain,
    name: route.name, brief: route.brief, isBoss: true,
    payout: G.basePay, enemyLevels: T.enemyLevels,
    encounters, cEnc,
  };
};

const HAZARD_THEMES = {
  marsh_stalker: {
    names: ['Drain the {e} marsh', 'Bounty: the {e} nest'],
    briefs: [
      'The writ wants the {e} nest emptied. Bring proof. Do not come back with a story.',
      'A posted bounty. The {es} stop taking from the reed-road, dead or bound.',
    ],
    theme: 'marsh bounty',
  },
  ember_cultist: {
    names: ['Put out the {e} fires', 'The {e} pyre'],
    briefs: [
      'A cult is lighting the outskirts. The magistrate wants the pyre cold.',
      'The {e} has a house of fire. The county pays to see it dark.',
    ],
    theme: 'cult pyre',
  },
  frost_hag: {
    names: ['Break the {e} coven', 'Thaw the {e} pass'],
    briefs: [
      'The pass is iced shut. No banners — just the {e} and the road.',
      'A coven of {es} has nested in the stones. Map them, then thin them.',
    ],
    theme: 'coven thaw',
  },
  gravewarden: {
    names: ['Unseal the {e} crypt', 'The {e} vigil'],
    briefs: [
      'The crypt should have stayed shut. The law wants the {e} put down.',
      'A vigil that will not end. Cut it, and the county sleeps.',
    ],
    theme: 'crypt vigil',
  },
  plague_knave: {
    names: ['Burn the {e} nest', 'The {e} ward'],
    briefs: [
      'A poison crew has a house. The county pays to see it empty.',
      'The {e} is why the well went sour. Bring proof. Do not drink.',
    ],
    theme: 'plague nest',
  },
};

Quests.repGate = function (quest, player) {
  const need = (quest && quest.minRep) || 0;
  if (!need) return { ok: true, need: 0, have: (player && player.reputation) || 0 };
  const have = (player && player.reputation) || 0;
  if (have >= need) return { ok: true, need, have };
  return { ok: false, need, have, error: 'reputation ' + need + '+' };
};

// Named solo bounties: a 300g hunt at reputation 10, and a 600g mini-boss
// contract at 15. The 600g finale uses the same mini-boss + tank + healer
// setup as the other board bosses.
Quests.makeSoloPremium = function (rng, kind, faction) {
  const T = C().QUEST_TIERS[kind];
  const tier = T.tier;
  const wantBoss = kind === 'solo600';
  faction = wantBoss ? 'neutral' : (faction || rng.pick(['law', 'criminal', 'neutral']));
  const encN = rng.int(C().SOLO_ENCOUNTERS[0], C().SOLO_ENCOUNTERS[1]);
  const pool = Quests.enemyPool(tier, faction, { levels: T.enemyLevels });
  const use = pool.length ? pool : Quests.enemyPool(tier, faction);
  const encounters = [];
  for (let i = 0; i < encN; i++) {
    const last = i === encN - 1;
    const nEnemies = (last && !wantBoss) ? rng.int(C().SOLO_ENEMIES[0], C().SOLO_ENEMIES[1]) : 1;
    const ids = [];
    for (let k = 0; k < nEnemies; k++) ids.push(rng.pick(use.length ? use : ['dire_wolf']));
    encounters.push({ enemyTypeIds: ids, boss: false });
  }
  const mainEnemy = ADV.DATA.ENEMIES[encounters[0].enemyTypeIds[0]] || ADV.DATA.BOSSES[encounters[0].enemyTypeIds[0]];
  const pack = rng.pick(QUEST_THEMES[faction] || QUEST_THEMES.neutral);
  const q = {
    id: 'q' + (QID++), tier, track: 'solo', factionAlignment: faction,
    theme: pack.theme, soloPremium: true, soloKind: kind, minRep: T.minRep,
    name: fillTheme(pack.name, mainEnemy),
    brief: fillTheme(pack.brief, mainEnemy),
    payout: T.soloPay, enemyLevels: T.enemyLevels, encounters, isBoss: false,
  };
  if (wantBoss) return Quests.attachMonsterBoss(rng, q);
  return q;
};

Quests.scaleSoloMook = function (ch) {
  const m = C().SOLO_STAT_MULT;
  if (!ch || ch.boss || m == null) return ch;
  const def = (ADV.DATA.BOSSES && ADV.DATA.BOSSES[ch.enemyTypeId]) || null;
  if (def && (def.boss || def.miniboss)) return ch;
  for (const k of ['hp', 'atk', 'def', 'spd']) {
    ch.stats[k] = Math.max(k === 'hp' ? 8 : 1, Math.round((ch.stats[k] || 1) * m));
  }
  return ch;
};

Quests.campRoleIds = function (camp, role) {
  return Object.keys(ADV.DATA.ENEMIES || {}).filter(id => {
    const e = ADV.DATA.ENEMIES[id];
    if (!e || e.camp !== camp) return false;
    if (role === 'healer') return !!e.healer;
    if (role === 'tank') {
      if (e.armored) return true;
      const ids = (e.actives || []).concat(e.perks || []);
      return ids.some(sid => ADV.Campaign && ADV.Campaign.isTankSkill(sid));
    }
    return false;
  });
};

// Board mini-boss fights: floor the boss at the player's max HP and make
// sure a tank and a healer of the same camp are on the field.
Quests.guardBoardBoss = function (out, quest, rng, game) {
  if (!out || !out.length) return out;
  const p = game && ADV.Game && ADV.Game.player(game);
  // Player safety HP does not scale enemies — and the buffer is 2.0 only on Easy, so a
  // literal 2 here left part of it in the floor on Normal and Hard (see Campaign.guardBoss).
  const floor = p ? ADV.Character.maxHp(p) / (ADV.Difficulty ? ADV.Difficulty.playerHpMult() : 2) : 0;
  for (const ch of out) {
    const def = ADV.DATA.BOSSES[ch.enemyTypeId];
    if (ch.boss || (def && (def.boss || def.miniboss))) {
      ch.boss = true;
      if (floor) ch.hpFloor = Math.max(ch.hpFloor || 0, floor);
    }
  }
  const camp = Quests.campOf(out[0].enemyTypeId) || 'wild';
  const skillsOf = (ch) => (ch.actives || []).concat(ch.perks || []).map(a => a.skillId);
  const restores = (id) => {
    const d = ADV.DATA.SKILLS[id];
    return !!(d && d.heal && (d.power || d.hotRounds || d.healFromTaken || d.revive) && d.target !== 'enemy');
  };
  const tankish = (ch) => !!(ch.armored || skillsOf(ch).some(id => ADV.Campaign && ADV.Campaign.isTankSkill(id)));
  const hasHealer = out.some(ch => !ch.boss && (skillsOf(ch).some(restores) || (ADV.DATA.ENEMIES[ch.enemyTypeId] && ADV.DATA.ENEMIES[ch.enemyTypeId].healer)));
  const hasTank = out.some(ch => !ch.boss && tankish(ch));
  const [lo, hi] = quest.enemyLevels || [12, 24];
  const lvl = hi || 20;
  const world = game && game.world;
  const fallback = { healer: { wild: 'moss_matron', law: 'field_chaplain', criminal: 'cutpurse_leech' },
    tank: { wild: 'shadow_beast', law: 'plated_sentinel', criminal: 'bandit' } };
  if (!hasTank) {
    const ids = Quests.campRoleIds(camp, 'tank');
    const tid = (ids.length ? rng.pick(ids) : null) || fallback.tank[camp] || 'dire_wolf';
    if (ADV.DATA.ENEMIES[tid] || ADV.DATA.BOSSES[tid]) out.push(ADV.Character.makeEnemy(rng, tid, { level: lvl, world }));
  }
  if (!hasHealer) {
    const ids = Quests.campRoleIds(camp, 'healer');
    const hid = (ids.length ? rng.pick(ids) : null) || fallback.healer[camp] || 'moss_matron';
    if (ADV.DATA.ENEMIES[hid] || ADV.DATA.BOSSES[hid]) out.push(ADV.Character.makeEnemy(rng, hid, { level: lvl, world }));
  }
  return out;
};

Quests.attachMonsterBoss = function (rng, quest) {
  if (!quest || quest.factionAlignment !== 'neutral') return quest;
  if (quest.soloPremium && quest.soloKind === 'solo300') return quest;
  if ((quest.payout || 0) < 300) return quest;
  const encs = quest.encounters;
  if (!encs || !encs.length) return quest;
  const pool = Quests.enemyPool('boss', 'neutral', { bosses: true, minibossOnly: true });
  const escortPool = Quests.enemyPool(quest.tier === 'boss' ? 3 : (quest.tier || 2), 'neutral');
  const book = ADV.DATA.MINIBOSSES || ADV.DATA.BOSSES;
  const bossId = rng.pick(pool.length ? pool : Object.keys(book));
  const escort = quest.hazard || rng.pick(escortPool.length ? escortPool : ['dire_wolf']);
  const last = encs[encs.length - 1];
  last.enemyTypeIds = [bossId, escort];
  last.boss = true;
  quest.monsterBoss = true;
  quest.isBoss = true;
  if (quest.name && !/^BOSS:/i.test(quest.name)) quest.name = 'BOSS: ' + quest.name;
  return quest;
};

// A party contract built around one debuff crew (with a second type mixed in)
Quests.makeHazard = function (rng, hz, faction) {
  const T = C().QUEST_TIERS[hz];
  const debuff = ADV.DATA.TIER_ENEMY_TABLE.debuff;
  const camps = Quests.foeCamps(faction);
  let leads = debuff.filter(id => camps.includes(Quests.campOf(id)));
  if (!leads.length) {
    const lead0 = rng.pick(debuff);
    faction = Quests.alignmentVs(Quests.campOf(lead0));
    leads = debuff.filter(id => Quests.foeCamps(faction).includes(Quests.campOf(id)));
    if (!leads.length) leads = [lead0];
  }
  const lead = rng.pick(leads);
  const sameCamp = debuff.filter(t => t !== lead && Quests.campOf(t) === Quests.campOf(lead));
  const pool = Quests.enemyPool(T.tier, faction, { levels: T.enemyLevels });
  const other = sameCamp.length ? rng.pick(sameCamp) : (pool.filter(t => t !== lead)[0] || lead);
  const filler = rng.pick(pool.length ? pool : [lead]);
  const encN = rng.int(3, 4);
  const encounters = [];
  for (let i = 0; i < encN; i++) {
    const n = rng.int(3, 4);
    const ids = [lead];
    for (let k = 1; k < n; k++) ids.push(rng.chance(0.5) ? lead : rng.chance(0.5) ? other : filler);
    Quests.maybeHealer(ids, pool, rng, T.tier);
    encounters.push({ enemyTypeIds: rng.shuffle(ids), boss: false });
  }
  const e = ADV.DATA.ENEMIES[lead];
  const pack = HAZARD_THEMES[lead] || { names: ['Hazard: {e}'], briefs: ['A crew of {es} holds the ground.'], theme: 'hazard' };
  const q = {
    id: 'q' + (QID++), tier: T.tier, track: 'party', factionAlignment: faction, hazard: lead,
    theme: pack.theme,
    name: fillTheme(rng.pick(pack.names), e),
    brief: fillTheme(rng.pick(pack.briefs), e),
    payout: T.partyPay, enemyLevels: T.enemyLevels, encounters, isBoss: false,
  };
  return Quests.attachMonsterBoss(rng, q);
};

const QUEST_THEMES = {
  law: [
    { theme: 'warrant', name: 'Warrant: {e} den', brief: 'The magistrate wants the {e} nest emptied. Bring proof. Do not come back with a story.' },
    { theme: 'road clear', name: 'Clear the {e} road', brief: 'Caravans will not move while {es} hold the mile-marker. The writ says drive them off.' },
    { theme: 'bounty', name: 'Bounty: {e} raids', brief: 'A posted bounty. Dead or bound, the {e} stops taking from the county.' },
    { theme: 'escort', name: 'Escort the magistrate', brief: 'Walk the magistrate through {e} country. The law does not duck into alleys.' },
  ],
  criminal: [
    { theme: 'quiet run', name: 'Quiet delivery past the {e}', brief: 'A crate needs to move. The {e} is why it has not. Quiet is paid extra.' },
    { theme: 'breakout', name: 'Crack the {e} lockup', brief: 'Someone inside is worth more than the lock. The {e} will not open the door.' },
    { theme: 'heist', name: 'Lift the {e} payroll', brief: 'The watch chest sits behind a {e}. Take it. Leave nothing that talks.' },
    { theme: 'settle', name: 'Settle the {e} matter', brief: 'A rival paid the {e} to lean on our people. Lean back.' },
  ],
  neutral: [
    { theme: 'beast cull', name: 'Cull the {e}', brief: 'The woods have too many {es}. The village pays for a thinner count, not a speech.' },
    { theme: 'salvage', name: 'Lost cargo, {e} country', brief: 'A wagon spilled in {e} territory. Bring back what the beasts have not ruined.' },
    { theme: 'survey', name: 'Survey the {e} ruin', brief: 'Map the old stones. The {es} that nest there are not the point, but they will be.' },
    { theme: 'caravan', name: 'Caravan guard: {e} road', brief: 'Walk the wagons through {e} country. No banners. No writs. Just the road.' },
  ],
};

Quests.make = function (rng, tier, track, faction) {
  const T = C().QUEST_TIERS[tier];
  const isBoss = tier === 'boss';
  const encN = isBoss ? 3 : (track === 'solo' ? rng.int(C().SOLO_ENCOUNTERS[0], C().SOLO_ENCOUNTERS[1])
                                              : rng.int(C().PARTY_ENCOUNTERS[0], C().PARTY_ENCOUNTERS[1]));
  const pool = Quests.enemyPool(isBoss ? 3 : tier, faction);
  const encounters = [];
  for (let i = 0; i < encN; i++) {
    const last = i === encN - 1;
    if (isBoss && last) {
      const bossPool = Quests.enemyPool('boss', faction, { bosses: true });
      const bossId = rng.pick(bossPool.length ? bossPool : Object.keys(ADV.DATA.BOSSES));
      const escortPool = Quests.enemyPool(3, faction);
      encounters.push({ enemyTypeIds: [bossId, rng.pick(escortPool.length ? escortPool : pool)], boss: true });
      continue;
    }
    // Solo: single enemies at tier 1; pairs only in tier 2+ finales (§15a curve)
    const nEnemies = track === 'solo'
      ? ((last && tier !== 1) ? rng.int(C().SOLO_ENEMIES[0], C().SOLO_ENEMIES[1]) : 1)
      : rng.int(C().PARTY_ENEMIES[0], C().PARTY_ENEMIES[1]);
    const ids = [];
    const use = pool.length ? pool : Quests.enemyPool(tier, faction);
    for (let k = 0; k < nEnemies; k++) ids.push(rng.pick(use));
    if (track !== 'solo') Quests.maybeHealer(ids, use, rng, tier);
    encounters.push({ enemyTypeIds: ids, boss: false });
  }
  const mainEnemy = ADV.DATA.ENEMIES[encounters[0].enemyTypeIds[0]] || ADV.DATA.BOSSES[encounters[0].enemyTypeIds[0]];
  const pack = rng.pick(QUEST_THEMES[faction] || QUEST_THEMES.neutral);
  const q = {
    id: 'q' + (QID++), tier, track, factionAlignment: faction,
    theme: pack.theme,
    name: (isBoss ? 'BOSS: ' : '') + fillTheme(pack.name, mainEnemy),
    brief: fillTheme(pack.brief, mainEnemy),
    payout: isBoss ? C().QUEST_TIERS.boss.partyPay : (track === 'solo' ? T.soloPay : T.partyPay),
    enemyLevels: (isBoss ? C().QUEST_TIERS.boss : T).enemyLevels,
    encounters, isBoss,
  };
  return Quests.attachMonsterBoss(rng, q);
};

// Guided first party job: two single beasts so the NPC lead does not die
// on a 3–5 enemy board contract before the player has learned the ropes.
// Neutral on purpose — the tour must not push a banner.
Quests.makeTutorialParty = function () {
  const T = C().QUEST_TIERS[1];
  return {
    id: 'q_tut_party',
    tier: 1, track: 'party', factionAlignment: 'neutral',
    theme: 'beast cull',
    name: 'A short road job',
    brief: 'Two beasts on the mile-road. The village pays to have them gone. No banners. No writs.',
    payout: T.partyPay,
    enemyLevels: [1, 2],
    encounters: [
      { enemyTypeIds: ['dire_wolf'], boss: false },
      { enemyTypeIds: ['dire_wolf'], boss: false },
    ],
    isBoss: false, tutorialEasy: true,
  };
};

// Spawn enemy characters for one encounter.
Quests.spawnEncounter = function (rng, quest, encIdx, world, game) {
  const enc = quest.encounters[encIdx];
  // Difficulty curve inside the quest: early encounters sit near the tier's
  // low bound, the finale reaches its high bound (keeps first fights fair
  // while the tier's top level still appears — §15a levels are the dial).
  const n = quest.encounters.length;
  const t01 = n > 1 ? encIdx / (n - 1) : 0.5;
  const [lo, hi] = quest.enemyLevels;
  let mid = lo + (hi - lo) * t01;
  // A solo finale that fields two enemies fields two LESSER enemies —
  // total threat stays near one top-of-tier opponent (§15a balance targets).
  if (quest.track === 'solo' && enc.enemyTypeIds.length > 1 && !enc.boss) {
    mid = lo + (hi - lo) * t01 * 0.5;
  }
  const weaken = quest.track === 'solo' && !quest.soloPremium && !enc.boss;
  const out = enc.enemyTypeIds.map(tid => {
    const t = ADV.DATA.ENEMIES[tid] || ADV.DATA.BOSSES[tid];
    const typeMin = quest.tutorialEasy ? lo : t.levels[0];
    const lvl = Math.round(Math.max(typeMin, Math.min(t.levels[1],
      Math.max(lo, Math.min(hi, mid + rng.int(-1, 1))))));
    const e = ADV.Character.makeEnemy(rng, tid, { level: lvl, world });
    if (e.armored) e.armorBonus = C().ARMORED_BONUS_DEF;
    if (weaken) Quests.scaleSoloMook(e);
    return e;
  });
  if (enc.boss && (quest.monsterBoss || quest.soloKind === 'solo600')) {
    Quests.guardBoardBoss(out, quest, rng, game);
  }
  return out;
};

// ---- Encounter verbs (§8) ---------------------------------------------------
// If the player owns a bypass perk, that route is offered at EVERY encounter.
// What varies is cost/odds, never availability.
Quests.availableVerbs = function (world, player, party, quest, enemies) {
  const verbs = [{ verb: 'fight', ok: true }];
  const lead = enemies[0];
  const enemyRank = Math.ceil((lead.enemyLevel || 1) / 8);
  const enemyLevel = lead.enemyLevel || 1;
  const playerRank = player.rank;
  const playerLevel = avgSkillLevel(player);
  for (const perkId of ['persuade', 'charm', 'intimidate', 'sneak', 'quiet_word']) {
    const entry = player.perks.find(p => p.skillId === perkId);
    if (!entry) continue;
    const m = Sys().manifest(player, entry);
    const vs = m.data.vs;
    let odds = 0.85;
    let note = '';
    if (perkId === 'quiet_word') {                       // Threaten (§13 Maw): works on the isolated
      odds = enemies.length === 1 ? 0.85 : 0.3;
      if (enemies.length > 1) note = 'too many ears';
    }
    if (perkId === 'persuade') {
      odds = vs === 'any' ? 0.9 : vs === 'equalRank' ? (enemyRank <= playerRank ? 0.85 : 0.35) : (enemyRank < playerRank ? 0.85 : 0.3);
    } else if (perkId === 'charm') {
      const anySex = vs !== 'oppositeSex';
      const applies = anySex || lead.sex !== player.sex;
      odds = applies ? 0.8 : 0.25;
      if (!applies) note = 'they seem unmoved';
    } else if (perkId === 'intimidate' || perkId === 'sneak') {
      odds = vs === 'any' ? 0.9 : vs === 'equalLevel' ? (enemyLevel <= playerLevel + 3 ? 0.8 : 0.35)
        : (enemyLevel < playerLevel ? 0.8 : 0.3);
    }
    // monsters can't be talked to — social verbs need a human opponent; sneak works on anything
    if (['persuade', 'charm', 'intimidate', 'quiet_word'].includes(perkId) && lead.species !== 'human') {
      note = 'beasts do not bargain'; odds = 0;
    }
    const soloSneak = perkId === 'sneak' && party.length === 0;
    verbs.push({
      verb: perkId, ok: odds > 0, odds, note, label: perkId === 'quiet_word' ? 'Threaten' : undefined,
      mode: perkId === 'sneak' ? (soloSneak ? 'bypass' : 'ambush') : 'bypass',
      tier: m.tier,
    });
  }
  // ---- Second campaign's four encounter verbs (add-on §3) ------------------
  // Each is a perk with its own stated resolution condition, so they are not
  // reskins of Persuade: Bribe reads wealth, Command and Requisition read the
  // opponent's alignment, Black Flag reads what they are carrying.
  const carriedGold = (lead.inventory && lead.inventory.gold) || 0;
  const enemyAlign = lead.factionAlignment
    || (lead.factionStanding && lead.factionStanding.law >= 30 ? 'law'
      : lead.factionStanding && lead.factionStanding.criminal >= 30 ? 'criminal' : null);
  const hasCargo = !!(quest && (quest.cargo || /cargo|prize|smuggl|merchant|blockade/i.test(quest.name || ''))) || carriedGold >= 25;
  const C2VERBS = {
    // §3a Silent Trade — Bribe: resolves against anyone poorer than you
    silent_trade: { label: 'Bribe them', test: () => player.inventory.gold > carriedGold,
      fail: 'they have more coin than you do' },
    // §3b Standing Order — Command: resolves against anyone lawfully aligned
    standing_order: { label: 'Give them an order', test: () => enemyAlign === 'law',
      fail: 'they answer to no lawful authority' },
    // §3c Black Flag — Intimidate at Sea: against anyone carrying cargo or coin
    black_flag: { label: 'Run up the colours', test: () => hasCargo,
      fail: 'they are carrying nothing worth losing' },
    // §3d Colours and Papers — Requisition: lawfully aligned, or carrying cargo
    colours_and_papers: { label: 'Requisition it', test: () => enemyAlign === 'law' || hasCargo,
      fail: 'nothing here answers to papers' },
  };
  for (const [perkId, spec] of Object.entries(C2VERBS)) {
    const entry = player.perks.find(p => p.skillId === perkId);
    if (!entry) continue;
    const m = Sys().manifest(player, entry);
    const applies = spec.test();
    let odds = applies ? 0.85 : 0.25;
    let note = applies ? '' : spec.fail;
    if (lead.species !== 'human') { odds = 0; note = 'beasts do not bargain'; }
    verbs.push({ verb: perkId, ok: odds > 0, odds, note, label: spec.label, mode: 'bypass', tier: m.tier });
  }

  // Alignment pass (§8): criminal standing talks past outlaws, law past the watch
  const fs = player.factionStanding;
  const foeCamp = Quests.campOf(lead.enemyTypeId) || lead.factionAlignment;
  if (foeCamp === 'criminal' && fs.criminal >= 30) {
    verbs.push({ verb: 'alignment', ok: true, odds: 0.95, label: 'Flash criminal standing', mode: 'bypass' });
  }
  if (foeCamp === 'law' && fs.law >= 30) {
    verbs.push({ verb: 'alignment', ok: true, odds: 0.95, label: 'Show the law\'s writ', mode: 'bypass' });
  }
  return verbs;
};

function avgSkillLevel(ch) {
  const all = ch.perks.concat(ch.actives);
  if (!all.length) return 1;
  return Math.round(all.reduce((s, e) => s + e.level, 0) / all.length);
}
Quests.avgSkillLevel = avgSkillLevel;

// Attempt a bypass. Returns {success, stolen, mode}.
// Bypassing witnesses nothing (§8) — that's the core tradeoff.
Quests.attemptBypass = function (world, rng, player, party, verbInfo, enemies) {
  const success = rng.chance(verbInfo.odds);
  const out = { success, mode: verbInfo.mode, verb: verbInfo.verb, stolen: 0 };
  if (!success) return out; // failed bypass -> fight, enemies unimpressed
  if (verbInfo.verb === 'sneak') {
    // A successful Sneak always steals (§3a) — inventory only, never equipped (§10)
    const entry = player.perks.find(p => p.skillId === 'sneak');
    const m = Sys().manifest(player, entry);
    const targets = m.data.stealAll ? enemies : [enemies[0]];
    for (const e of targets) {
      const g = rng.int(5, 15) + (e.enemyLevel || 1) * 2;
      out.stolen += g;
    }
    player.inventory.gold += out.stolen;
  }
  if (verbInfo.verb === 'silent_trade') {
    // A bribe is paid, not threatened: it costs, which is what separates it
    // from Persuade and why it works on people stronger than you.
    const cost = Math.min(player.inventory.gold, rng.int(10, 20) + (enemies[0].enemyLevel || 1) * 2);
    player.inventory.gold -= cost;
    out.stolen = -cost;
  }
  if (verbInfo.verb === 'black_flag') {
    // Colours up: they hand over what they were carrying rather than fight for it.
    out.stolen = rng.int(15, 30) + (enemies[0].enemyLevel || 1) * 3;
    player.inventory.gold += out.stolen;
  }
  if (verbInfo.verb === 'intimidate') {
    const entry = player.perks.find(p => p.skillId === 'intimidate');
    const m = Sys().manifest(player, entry);
    if (m.data.fleersDropLoot) {
      out.stolen = rng.int(10, 25);
      player.inventory.gold += out.stolen;
    }
  }
  return out;
};

// ---- Payout & reputation (§16, §9) -----------------------------------------
Quests.payout = function (world, quest, leader, hires) {
  const goldMult = leader.registryId && ADV.DATA.REGISTRY[leader.registryId] &&
    leader.perks.some(p => p.skillId === 'rich') ? 10 : 1;
  const gross = quest.payout * goldMult;
  let payroll = 0;
  for (const h of hires) payroll += h.wage || 0;
  return { gross, payroll, net: gross - payroll };
};

Quests.applyFactionShift = function (world, ch, quest) {
  const f = quest.factionAlignment;
  const amt = C().FACTION_SHIFT_PER_QUEST;
  if (f === 'law') { ch.factionStanding.law += amt; ch.factionStanding.criminal -= Math.round(amt / 2); }
  else if (f === 'criminal') { ch.factionStanding.criminal += amt; ch.factionStanding.law -= Math.round(amt / 2); }
  else ch.factionStanding.neutral += amt;
  for (const k of Object.keys(ch.factionStanding)) {
    ch.factionStanding[k] = Math.max(-100, Math.min(100, ch.factionStanding[k]));
  }
};

ADV.Quests = Quests;
})();
