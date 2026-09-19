// Campaign core (campaign doc §2-§5c, §7, §10-§11a). Per-life state lives on
// game.campaign; the one world-level outcome (who runs the Antler) on
// world.campaignWorld; the cross-life unlock on meta.campaignSkillsUnlocked.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const D = () => ADV.DATA;
const Campaign = {};

// ---------------------------------------------------------------- state
Campaign.fresh = function () {
  return {
    factionId: null, stage: 0, titleTier: 0,
    offers: { maw: false, varenholm: false }, declined: { maw: false, varenholm: false },
    pendingOffer: null, antlerAdvertised: false, antlerOpen: false,
    alignedContracts: { criminal: 0, law: 0 }, contractsTotal: 0, factionContracts: 0,
    rivalAlive: true, rivalToggle: false, branch: null, completed: false,
    gearIssued: false, reissued: false, beats: [], actors: {}, seenBoss: false,
    supportAskDue: false, endCardDue: false, endCardSeen: false, speechUnlocked: false,
    repeatables: [], revealNext: false,
  };
};
Campaign.state = function (game) {
  if (!game.campaign) game.campaign = Campaign.fresh();
  const w = game.world;
  if (!w.campaignWorld) w.campaignWorld = { antlerFirstHorn: 'crane' };
  return game.campaign;
};
Campaign.faction = function (game) {
  const s = Campaign.state(game);
  return s.factionId ? D().FACTIONS[s.factionId] : null;
};

// ---------------------------------------------------------------- titles (§10)
Campaign.affects = function (ch, skillId) {
  const t = ch.factionTitle;
  if (!t) return false;
  const sk = D().SKILLS[skillId];
  if (!sk) return false;
  if (sk.faction === t.factionId) return true;
  const f = D().FACTIONS[t.factionId];
  return !!(sk.archetype && f && f.archetypes.includes(sk.archetype));
};
Campaign.levelRate = function (ch, skillId) {
  const t = ch.factionTitle;
  if (!t || !Campaign.affects(ch, skillId)) return 1;
  return t.tier >= 2 ? 3 : 2;
};
Campaign.titleLifts = function (ch, skillId) {
  const t = ch.factionTitle;
  return !!(t && t.tier >= 3 && Campaign.affects(ch, skillId));
};
Campaign.titleName = function (ch) {
  const t = ch.factionTitle;
  if (!t) return null;
  return D().FACTIONS[t.factionId].titles[t.tier - 1];
};
function setTitle(game, tier) {
  const s = Campaign.state(game);
  const p = ADV.Game.player(game);
  p.factionTitle = { factionId: s.factionId, tier };
  s.titleTier = tier;
}

// campaign skills: witness-only during a campaign; all 72 purchasable after
// any campaign completes; a faction's perks open on joining (§13, §13d-2)
Campaign.skillPurchasable = function (ch, skillId, meta) {
  const sk = D().SKILLS[skillId];
  if (!sk || !sk.faction) return true;
  if (meta && meta.campaignSkillsUnlocked) return true;
  if (ADV.SkillSys.isWitnessed(ch, skillId)) return true;
  if (sk.kind === 'perk' && ch.factionTitle && ch.factionTitle.factionId === sk.faction) return true;
  return false;
};

// ---------------------------------------------------------------- recruitment (§3)
// Called after every ordinary contract resolves.
Campaign.onContractComplete = function (game, quest, failed) {
  const s = Campaign.state(game);
  if (failed) return;
  s.contractsTotal++;
  if (s.factionId) { if (quest.campaign || quest.factionRepeatable) s.factionContracts++; return; }
  const al = quest.factionAlignment;
  if (al === 'criminal' || al === 'law') s.alignedContracts[al]++;
  Campaign.considerOffers(game);
};

// Recruiters wait (request): nobody approaches before the player has finished
// four contracts and holds a moderate reputation. The lawful house never
// contacts someone with criminal work on their record, and the Maw never
// contacts someone who has worked for the law. A mixed or unaligned record
// gets the Antler, which takes anyone.
Campaign.eligibleFor = function (game, fid) {
  const s = Campaign.state(game);
  const p = ADV.Game.player(game);
  const G = C().CAMPAIGN_GATE;
  if (p.questsCompleted < G.minQuests || p.reputation < G.minRep) return false;
  if (s.declined[fid]) return false;
  const crim = s.alignedContracts.criminal, law = s.alignedContracts.law;
  if (fid === 'maw') return crim >= 1 && law === 0;
  if (fid === 'varenholm') return law >= 1 && crim === 0;
  return true;   // the Antler
};
Campaign.considerOffers = function (game) {
  const s = Campaign.state(game);
  if (s.factionId || s.pendingOffer) return;
  if (Campaign.eligibleFor(game, 'maw')) { s.pendingOffer = 'maw'; s.offers.maw = true; return; }
  if (Campaign.eligibleFor(game, 'varenholm')) { s.pendingOffer = 'varenholm'; s.offers.varenholm = true; return; }
  if (!s.antlerAdvertised && Campaign.eligibleFor(game, 'antler')) s.pendingOffer = 'antler';
};

// Presenting: returns the recruiter's offer to show, or null.
Campaign.currentOffer = function (game) {
  const s = Campaign.state(game);
  if (s.factionId || !s.pendingOffer) return null;
  return s.pendingOffer;
};

Campaign.accept = function (game, fid) {
  const s = Campaign.state(game);
  if (s.factionId) return { ok: false };
  s.factionId = fid; s.pendingOffer = null; s.stage = 0;
  setTitle(game, 1);                                            // basic title on joining
  s.beats.push({ who: D().FACTIONS[fid].recruiter, key: 'tutorial' });
  s.beats.push({ who: D().FACTIONS[fid].boss, key: 'first' });   // the boss appears early (§3)
  Campaign.ensureActors(game);
  ADV.Save.saveGame(game);
  return { ok: true };
};
Campaign.decline = function (game, fid) {
  const s = Campaign.state(game);
  s.pendingOffer = null;
  if (fid === 'antler') { s.antlerAdvertised = true; s.antlerOpen = true; return; }
  s.declined[fid] = true;
  // an aligned refusal brings the Antler on the next return (once), forever open after
  if (!s.antlerAdvertised && Campaign.eligibleFor(game, 'antler')) s.pendingOffer = 'antler';
  ADV.Save.saveGame(game);
};
// The Antler's standing option (§3): advertised once, open forever.
Campaign.antlerAvailable = function (game) {
  const s = Campaign.state(game);
  return !s.factionId && s.antlerOpen;
};
Campaign.menuVisible = function (game) {
  const s = Campaign.state(game);
  return !!(s.factionId || s.antlerOpen || s.pendingOffer || s.offers.maw || s.offers.varenholm);
};

// ---------------------------------------------------------------- actors (§1, §6a)
Campaign.grantGodsEdict = function (ch) {
  if (!ch || !ch.actives) return;
  if (ch.actives.some(e => e.skillId === 'gods_edict')) return;
  ch.actives.push({ skillId: 'gods_edict', level: 1, uses: 0 });
};
Campaign.makeActor = function (def) {
  const rng = ADV.rngFromString('campaign:' + def.id);
  const ch = ADV.Character.base({
    id: 'cmp_' + def.id, name: def.name, sex: def.sex, species: 'human',
    stats: { hp: rng.int(105, 120), atk: rng.int(11, 13), def: rng.int(10, 13), spd: rng.int(10, 13) },
    portraitSeed: ADV.hashStr(def.id), portraitKind: 'campaign', portraitId: def.id,
    campaign: true, campaignId: def.id, campaignExit: !!def.campaignExit, title: def.epithet || null,
    perkCap: 8, activeCap: 8,
    personality: { aggression: 60, greed: 40, caution: 40, loyalty: 70, pride: 60 },
    archetypeInclination: [def.role === 'antagonist' && def.id === 'arden' ? 'ranger' : (D().SKILLS[(def.actives || [])[0]] || {}).archetype || 'fighter'],
  });
  const lvl = def.level || 18;
  for (const id of def.perks || []) ch.perks.push({ skillId: id, level: lvl, uses: lvl * 10 });
  for (const id of def.actives || []) ch.actives.push({ skillId: id, level: lvl, uses: lvl * 10 });
  if (def.hero) {
    ch.status = 'hero'; ch.grantsHeld = true; ch.heroPowerMult = C().HERO_POWER_BASE;
    ch.actives.push({ skillId: 'true_rest', level: 1, uses: 0 });
    ch.perks.push({ skillId: 'hero', level: 1, uses: 0 });
  }
  if (def.backLaneOnly) ch.archetypeInclination = ['ranger'];
  if (def.role === 'god' || def.godLine) {
    ch.isGod = true; ch.role = 'god'; ch.godLine = true; ch.boss = true;
    ch.godDomain = def.domain || null;
    ch.raisesTheDead = !!def.raisesTheDead;
    const gPers = ADV.Character.pickPersonality({ pick: a => a[ADV.hashStr(def.id) % a.length] }, def.sex === 'f' ? 'f' : 'm');
    if (gPers) ch.personalityId = gPers.id;
    if (def.statMult) for (const k of ['hp', 'atk', 'def', 'spd']) ch.stats[k] = Math.round(ch.stats[k] * def.statMult);
    const DOT = {
      bleed: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
      poison: { kind: 'poison', power: 0.6, rounds: 3, stacks: true },
      burn: { kind: 'burn', power: 0.8, rounds: 2 },
    };
    ch.hitStatuses = [DOT.bleed, DOT.poison, DOT.burn];
    Campaign.grantGodsEdict(ch);
  }
  if (def.hitStatus) ch.hitStatus = def.hitStatus;
  if (def.hitStatuses) ch.hitStatuses = def.hitStatuses;
  ch.freeSkillsUsed = 3;
  return ch;
};
Campaign.ensureActors = function (game) {
  const s = Campaign.state(game);
  const f = Campaign.faction(game);
  if (!f) return;
  for (const role of ['rival', 'boss', 'antagonist']) {
    const id = f[role];
    if (!s.actors[id]) s.actors[id] = Campaign.makeActor(D().CAMPAIGN_CHARS[id]);
  }
};
Campaign.actor = function (game, id) { Campaign.ensureActors(game); return Campaign.state(game).actors[id]; };
// The Antler's boss after the branch (§5c faction continuity)
Campaign.bossId = function (game) {
  const f = Campaign.faction(game);
  if (!f) return null;
  if (f.id === 'antler' && game.world.campaignWorld.antlerFirstHorn === 'holloway') return 'holloway';
  return f.boss;
};

// ---------------------------------------------------------------- enemies (§14)
Campaign.spawnEnemy = function (rng, typeId, level, opts) {
  opts = opts || {};
  const t = D().CAMPAIGN_ENEMIES[typeId];
  const ch = ADV.Character.base({
    name: opts.name || t.name, sex: 'm', species: t.species,
    stats: ADV.Character.rollStats(rng, 'human'),
    portraitSeed: ADV.hashStr(typeId), portraitKind: 'enemy', portraitId: t.portrait,
    enemyTypeId: typeId, isMonster: true, boss: !!opts.boss, campaignEnemy: true,
    perkCap: 8, activeCap: 8,
    personality: { aggression: 65, greed: 50, caution: 35, loyalty: 30, pride: 50 },
  });
  // mooks roll lighter than veterans; mini-bosses are full-strength
  if (!opts.boss) { ch.stats.hp = Math.round(ch.stats.hp * 0.7); ch.stats.atk = Math.max(8, ch.stats.atk - 1); }
  else ch.stats.hp = Math.round(ch.stats.hp * 1.4);
  if (t.statMult) for (const k of ['hp', 'atk', 'def', 'spd']) ch.stats[k] = Math.round(ch.stats[k] * t.statMult);
  if (opts.boss) {
    const pers = ADV.Character.pickPersonality(rng, ch.sex || 'm', opts.world);
    if (pers) ch.personalityId = pers.id;
    const riders = [
      { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
      { kind: 'poison', power: 0.5, rounds: 3, stacks: true },
      { kind: 'burn', power: 0.8, rounds: 2 },
    ];
    const kit=t.pool||[];
    const burning=kit.some(id=>/fire|flame|ember|ashfall|siege/.test(id));
    const venom=kit.some(id=>/poison|venom|serpent|wither/.test(id));
    ch.hitStatus = riders[burning?2:venom?1:0];
  }
  if (t.undead || opts.undead) { ch.isUndead = true; ch.statusImmunities = t.statusImmunities || []; }
  if (t.statusImmunities) ch.statusImmunities = t.statusImmunities;
  if (opts.conscript) ch.isConscript = true;
  if (ADV.Character.applyNonOrganic) ADV.Character.applyNonOrganic(ch);
  // roll the equipped subset from the pool (signature always included)
  const pool = t.pool.slice();
  const picks = [];
  if (!opts.signature && t.tactics && pool.includes(t.tactics.signature)) opts = Object.assign({}, opts, { signature: t.tactics.signature });
  if (opts.signature && pool.includes(opts.signature)) { picks.push(opts.signature); pool.splice(pool.indexOf(opts.signature), 1); }
  const n = opts.equips != null ? opts.equips : t.equips;
  const shuffled = rng.shuffle(pool);
  while (picks.length < n && shuffled.length) picks.push(shuffled.shift());
  for (const id of picks) {
    const sk = D().SKILLS[id];
    (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level, uses: level * 10 });
  }
  ch.enemyLevel = level;
  if (t.skins && t.skins.length && ADV.Character.applyEnemyLook) ADV.Character.applyEnemyLook(rng, ch, t);
  if (ADV.Difficulty) ADV.Difficulty.toughen(ch, t);   // veterans on the harder roads
  return ch;
};

// DOT_PROMPT.md §11: boss fights are never softer than the player.
// - every boss / mini-boss unit floors its max HP at the player's max HP
//   (on the combat unit via ch.hpFloor, never on saved stats; never lowered)
// - the escort always holds a tank and a healer of the faction; missing ones
//   are APPENDED (the quest author's list is kept whole)
// a "tank" skill: a guard, ward, thorns, lane hold, or one of the faction stances (any tier)
Campaign.isTankSkill = function (id) {
  const d = D().SKILLS[id];
  if (!d || d.kind === 'perk') return false;
  const G = D().CAMPAIGN_BOSS_GUARD || {};
  if (Object.values(G).some(g => g.tankSkill === id)) return true;
  if (['bulwark_formation', 'shield_wall', 'guardian_ward', 'crossing_guard', 'bear_stance', 'chain_and_bar', 'aegis_protocol', 'thorn_skin', 'line_advance', 'iron_fan_guard', 'unseen_guard'].includes(id)) return true;
  const tiers = d.tiers ? Object.values(d.tiers) : [];
  return [d].concat(tiers).some(t => t.guardScope || t.shieldHits || t.shieldRounds || t.thornPct || t.laneGuard || t.immovable || (t.selfStatus && ['ward', 'guard', 'thorns'].includes(t.selfStatus.kind)) || (t.laneStatus && (t.laneStatus.kind === 'holdRoad' || t.laneStatus.closed)));
};
Campaign.guardBoss = function (game, out, factionId, level, rng, spawn) {
  const p = ADV.Game.player(game);
  // Exclude the player's safety buffer, which is a difficulty lever and not part of how
  // tough the character actually is. Dividing by a literal 2 only undid it on Easy, where
  // playerHp happens to be 2.0: on Normal and Hard the boss kept part of a buffer the
  // player no longer had. Because nothing scales the player's DAMAGE with difficulty, a
  // bigger floor is purely a longer fight, so Easy was fielding bosses at twice the health
  // of Hard and taking twice as many rounds to put them down — with the companions, who
  // get no buffer at all, absorbing every extra round. Character.syncNpcHeroFloor has
  // divided the buffer out correctly all along; this is the same sum.
  const floor = p ? ADV.Character.maxHp(p) / (ADV.Difficulty ? ADV.Difficulty.playerHpMult() : 2) : 0;
  const restores = (id) => { const d = D().SKILLS[id]; return !!(d && d.heal && (d.power || d.hotRounds || d.healFromTaken || d.revive) && d.target !== 'enemy'); };
  const guardish = (id) => Campaign.isTankSkill(id);
  const skillsOf = (ch) => (ch.actives || []).concat(ch.perks || []).map(a => a.skillId);
  for (const ch of out) if (ch.boss || ch.isBossFight || ch.godLineBoss) { ch.hpFloor = Math.max(ch.hpFloor || 0, floor); }
  const G = D().CAMPAIGN_BOSS_GUARD && D().CAMPAIGN_BOSS_GUARD[factionId];
  if (!G) return out;
  const hasHealer = out.some(ch => !ch.boss && !ch.isBossFight && skillsOf(ch).some(restores));
  const hasTank = out.some(ch => !ch.boss && !ch.isBossFight && skillsOf(ch).some(guardish));
  const mk = spawn || ((t, l, o) => Campaign.spawnEnemy(rng, t, l, Object.assign({ world: game.world }, o || {})));
  if (!hasTank && D().CAMPAIGN_ENEMIES[G.tank]) out.push(mk(G.tank, level, { signature: G.tankSkill, guard: true }));
  if (!hasHealer && D().CAMPAIGN_ENEMIES[G.healer]) out.push(mk(G.healer, level, { signature: G.heal, guard: true }));
  return out;
};

// Build the enemy roster for one campaign encounter.
Campaign.spawnEncounter = function (game, quest, encIdx) {
  const s = Campaign.state(game);
  const rng = game.rng.fork('cq' + quest.n + ':' + encIdx);
  const spec = quest.cEnc[encIdx];
  const lo = quest.enemyLevels[0], hi = quest.enemyLevels[1];
  const lvl = Math.round(lo + (hi - lo) * (encIdx / Math.max(1, quest.cEnc.length - 1)));
  const out = [];
  const world = game.world;
  for (const t of spec.types || []) {
    if (D().CAMPAIGN_ENEMIES[t]) out.push(Campaign.spawnEnemy(rng, t, lvl, { world }));
    else out.push(ADV.Character.makeEnemy(rng, t, { level: lvl, world }));
  }
  if (spec.mini) {
    const mb = D().CAMPAIGN_MINIBOSSES[spec.mini];
    const count = mb.count || (mb.pair ? 2 : 1);
    for (let i = 0; i < count; i++) {
      out.push(Campaign.spawnEnemy(rng, mb.base, hi, { boss: !mb.count, name: mb.name + (count > 1 ? ' ' + (i + 1) : ''), signature: mb.signature, equips: mb.equips || mb.base === 'risen' ? 0 : 4, undead: mb.undead, conscript: mb.conscript, world }));
    }
  }
  for (const t of spec.with || []) out.push(Campaign.spawnEnemy(rng, t, lvl, { world }));
  if (spec.boardBoss) {
    const bb = ADV.Character.makeEnemy(rng, spec.boardBoss, { level: hi, world });
    if (quest.godLine) { bb.godLineBoss = true; Campaign.grantGodsEdict(bb); }
    out.unshift(bb);
  }
  if (spec.boss) {
    let bossId = spec.boss;
    if (bossId === 'branch') bossId = s.branch === 'holloway' ? 'crane' : 'holloway';
    const boss = Campaign.actor(game, bossId);
    boss.combatHp = null; boss.campaignExit = false; boss.boss = true; boss.isBossFight = true;
    out.unshift(boss);
    if (bossId === 'quiet') quest.spawnQueue = [2, 4].map(r => ({ round: r, ch: Campaign.spawnEnemy(rng, 'risen', hi, { world }) }));
  }
  // §11 floor + guard on the campaign's own boss fights. War contracts are ordinary board work that
  // borrows campaign spawning (see Quests.makeWarQuest); their named bosses are left as authored.
  if ((spec.mini || spec.boss || spec.boardBoss) && !quest.war) Campaign.guardBoss(game, out, quest.factionId || (Campaign.faction(game) || {}).id, hi, rng);
  return out;
};

// ---------------------------------------------------------------- quests (§15)
Campaign.buildQuest = function (game, n) {
  const f = Campaign.faction(game);
  const src = D().CAMPAIGN_QUESTS[f.id][n - 1];
  const tierPay = { 1: C().QUEST_TIERS[1].partyPay, 2: C().QUEST_TIERS[2].partyPay, 3: C().QUEST_TIERS[3].partyPay };
  const q = {
    id: 'cq_' + f.id + '_' + n, campaign: true, factionId: f.id, n, name: src.name, brief: src.brief, storyCaption: src.storyCaption,
    tier: src.tier, track: 'campaign', factionAlignment: f.alignment,
    payout: Math.max(C().CAMPAIGN_MIN_PAY || 500, n === 5 ? C().QUEST_TIERS.boss.partyPay : tierPay[src.tier]),
    enemyLevels: C().QUEST_TIERS[src.tier].enemyLevels,
    encounters: src.enc.map((e, i) => ({ enemyTypeIds: [], boss: !!e.boss, mini: !!e.mini, campaign: true })),
    cEnc: src.enc, rival: !!src.rival, rivalDies: !!src.rivalDies, bossAlly: !!src.bossAlly, branch: !!src.branch, isBoss: n === 5,
  };
  return q;
};
Campaign.questStatus = function (game, n) {
  const s = Campaign.state(game);
  if (n <= s.stage) return 'done';
  if (n === s.stage + 1) return 'open';
  return 'locked';
};
Campaign.hallView = function (game) {
  const s = Campaign.state(game);
  const f = Campaign.faction(game);
  if (!f) return null;
  const p = ADV.Game.player(game);
  return {
    faction: f, stage: s.stage, titleTier: s.titleTier, title: Campaign.titleName(p),
    nextTitle: s.titleTier < 3 ? f.titles[s.titleTier] : null,
    nextTitleAt: s.titleTier === 1 ? 'complete quest 2' : s.titleTier === 2 ? 'complete quest 4' : null,
    quests: [1, 2, 3, 4, 5].map(n => Object.assign({ n, status: Campaign.questStatus(game, n) }, D().CAMPAIGN_QUESTS[f.id][n - 1])),
    rivalAvailable: s.stage >= 2 && s.rivalAlive, rivalToggle: s.rivalToggle,
    rival: D().CAMPAIGN_CHARS[f.rival], boss: D().CAMPAIGN_CHARS[Campaign.bossId(game)],
    completed: s.completed, canReissue: s.completed && !s.reissued && p.equippedSet !== f.gearSet,
    speechUnlocked: s.stage >= 2, factionContracts: s.factionContracts, endCardSeen: s.endCardSeen,
    repeatables: s.completed ? Campaign.repeatables(game) : [],
  };
};

// Campaign allies joining the roster for a campaign quest (§5a).
Campaign.allies = function (game) {
  const q = game.quest && game.quest.quest;
  return Campaign.alliesFor(game, q);
};
Campaign.alliesFor = function (game, q) {
  const s = Campaign.state(game);
  if (!q || !q.campaign) return [];
  const f = Campaign.faction(game);
  const out = [];
  if (q.rival && s.rivalAlive && s.rivalToggle) out.push(Campaign.actor(game, f.rival));
  if (q.bossAlly) {
    if (f.id === 'antler' && s.branch === 'holloway') out.push(Campaign.actor(game, 'holloway'));
    else out.push(Campaign.actor(game, f.boss));
  }
  return out;
};

// Repeatable faction contracts after the campaign (§4a).
Campaign.repeatables = function (game) {
  const s = Campaign.state(game);
  if (!s.repeatables.length) {
    const f = Campaign.faction(game);
    const rng = game.rng.fork('rep' + game.world.questClock);
    const types = Object.keys(D().CAMPAIGN_ENEMIES).filter(t => D().CAMPAIGN_ENEMIES[t].faction === f.id && t !== 'risen');
    for (let i = 0; i < 2; i++) {
      const tier = i === 0 ? 2 : 3;
      const enc = [];
      for (let e = 0; e < 3; e++) enc.push({ types: [rng.pick(types), rng.pick(types), rng.pick(types)] });
      s.repeatables.push({ id: 'rep_' + f.id + '_' + i + '_' + game.world.questClock, campaign: true, factionRepeatable: true, factionId: f.id,
        n: 0, name: f.short + ' contract', tier, track: 'campaign', factionAlignment: f.alignment,
        payout: Math.max(C().CAMPAIGN_MIN_PAY || 500, C().QUEST_TIERS[tier].partyPay), enemyLevels: C().QUEST_TIERS[tier].enemyLevels,
        encounters: enc.map(() => ({ enemyTypeIds: [], campaign: true })), cEnc: enc });
    }
  }
  return s.repeatables;
};

// ---------------------------------------------------------------- beats (§8)
Campaign.lines = function (fid, who, key) {
  const dlg = D().CAMPAIGN_DIALOGUE[fid];
  return (dlg && dlg[who] && dlg[who][key]) ? dlg[who][key] : [];
};
Campaign.normalizeLine = function (line) {
  if (line && typeof line.t === 'string') return line;
  if (typeof line === 'string') return { t: line };
  return null;
};
Campaign.lineKey = function (text) {
  return String(text || '').replace(/\[[a-z ]+\]\s*/gi, '').replace(/\{[^}]+\}/g, ' ')
    .replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase().replace(/\s+/g, ' ');
};
Campaign.lineIds = function (who, line) {
  const text = line && line.t != null ? line.t : line;
  const body = Campaign.lineKey(text);
  if (!body) return [];
  const ids = [who + ':' + body];
  if (/hanged/.test(body)) ids.push(who + ':hanged-people');
  return ids;
};
Campaign.heardSet = function (game) {
  const meta = game.meta || (game.meta = {});
  if (!Array.isArray(meta.heardCampaign)) meta.heardCampaign = [];
  return meta.heardCampaign;
};
Campaign.lastSpoken = function (game, who) {
  const meta = game.meta || (game.meta = {});
  meta.lastCampaign = meta.lastCampaign || {};
  return meta.lastCampaign[who] || '';
};
Campaign.wasSpoken = function (game, who, line) {
  const heard = Campaign.heardSet(game);
  return Campaign.lineIds(who, line).some(id => heard.indexOf(id) >= 0);
};
Campaign.markSpoken = function (game, who, line) {
  const heard = Campaign.heardSet(game);
  const ids = Campaign.lineIds(who, line);
  for (let i = 0; i < ids.length; i++) if (heard.indexOf(ids[i]) < 0) heard.push(ids[i]);
  const meta = game.meta || (game.meta = {});
  meta.lastCampaign = meta.lastCampaign || {};
  if (ids[0]) meta.lastCampaign[who] = ids[0];
  if (heard.length > 500) heard.splice(0, heard.length - 400);
};
// Unused lines first, then anything but the last clip this speaker used.
// `limit` keeps war openers to a couple of remarks instead of the whole pool.
Campaign.pickSpoken = function (game, who, lines, opts) {
  opts = opts || {};
  const list = [];
  for (let i = 0; i < (lines || []).length; i++) {
    const n = Campaign.normalizeLine(lines[i]);
    if (!n) continue;
    if (n._i == null) n._i = i + 1;
    list.push(n);
  }
  if (!list.length) return [];
  const last = Campaign.lastSpoken(game, who);
  const fresh = list.filter(l => !Campaign.wasSpoken(game, who, l));
  let pool = fresh;
  if (!pool.length) pool = list.filter(l => Campaign.lineIds(who, l)[0] !== last);
  if (!pool.length) pool = list;
  const limit = opts.limit;
  if (limit && pool.length > limit) return pool.slice(0, limit);
  return pool;
};
Campaign.pushBeat = function (game, who, key, extra) {
  Campaign.state(game).beats.push(Object.assign({ who, key }, extra || {}));
};
Campaign.takeBeats = function (game) { const s = Campaign.state(game); const b = s.beats; s.beats = []; return b; };

// Quest start beats (shown on departure): rival joins / before-it-goes-wrong / briefing.
Campaign.departureBeats = function (game, q) {
  const f = Campaign.faction(game);
  const s = Campaign.state(game);
  const out = [];
  if (q.n === 3 && s.rivalToggle) out.push({ who: f.rival, key: 'join3' });
  if (q.n === 4 && s.rivalToggle) out.push({ who: f.rival, key: 'before4' });
  if (q.n === 5) out.push({ who: Campaign.bossId(game) === 'holloway' && f.id === 'antler' ? 'holloway' : f.boss, key: 'hunt' });
  return out;
};

// Combat banter (one line per fight, round 2) from a present campaign ally.
Campaign.banter = function (game, st, roundN) {
  const f = Campaign.faction(game);
  if (!f || !game.quest || !game.quest.quest.campaign) return null;
  if ((roundN || st.round) !== 2 || st.__bantered) return null;
  st.__bantered = true;
  const s = Campaign.state(game);
  const q = game.quest.quest;
  const rng = game.rng;
  let who = null, key = null;
  if (q.bossAlly) {
    who = (f.id === 'antler' && s.branch === 'holloway') ? 'holloway' : f.boss; key = 'fight';
  } else if (q.rival && s.rivalToggle && s.rivalAlive) { who = f.rival; key = 'banter'; }
  if (!who) return null;
  if (st && st.units && !st.units.some(u => u.ch && u.ch.campaignId === who && !u.downed && !u.fled)) return null;
  const lines = Campaign.pickSpoken(game, who, Campaign.lines(f.id, who, key), { limit: 1 });
  if (!lines.length) return null;
  const line = rng.pick(lines);
  const all = Campaign.lines(f.id, who, key);
  return { who, key, line, voOffset: Math.max(0, all.indexOf(line)), fid: f.id };
};

// Called by Game.completeQuest for a campaign quest that succeeded.
Campaign.onCampaignQuestDone = function (game, q) {
  const s = Campaign.state(game);
  const f = Campaign.faction(game);
  if (q.factionRepeatable) { s.factionContracts++; s.repeatables = []; return; }
  if (q.n !== s.stage + 1) return;
  s.stage = q.n; s.factionContracts++;
  const rec = f.recruiter, riv = f.rival;
  if (q.n === 1) { Campaign.pushBeat(game, rec, 'debrief1'); Campaign.pushBeat(game, riv, 'after1'); }
  if (q.n === 2) { Campaign.pushBeat(game, rec, 'debrief2'); Campaign.pushBeat(game, riv, 'after2'); setTitle(game, 2); s.speechUnlocked = true; }
  if (q.n === 3) { Campaign.pushBeat(game, rec, 'debrief3'); if (s.rivalToggle) Campaign.pushBeat(game, riv, 'after3'); }
  if (q.n === 4) {
    // the scripted death already played in the quest; the hall grieves, the title lands
    s.rivalAlive = false; s.rivalToggle = false;
    Campaign.pushBeat(game, rec, 'debrief4'); setTitle(game, 3);
  }
  if (q.n === 5) Campaign.complete(game);
  ADV.Save.saveGame(game);
};

// Q4's scripted beat sequence (shown after the final encounter of quest 4).
Campaign.rivalDeathSequence = function (game) {
  const f = Campaign.faction(game);
  return [
    { who: f.antagonist, key: 'appear' },
    { who: f.rival, key: 'death', death: true },
    { who: f.antagonist, key: 'afterKill' },
  ];
};
// Q5's final-encounter opener (antagonist speaks before the boss fight).
Campaign.finalOpener = function (game) {
  const f = Campaign.faction(game);
  const s = Campaign.state(game);
  if (f.id === 'antler') {
    return s.branch === 'holloway' ? [{ who: 'crane', key: 'against' }] : [{ who: 'holloway', key: 'facing' }];
  }
  return [{ who: f.antagonist, key: 'final' }];
};
// After the antagonist falls / the branch resolves.
Campaign.afterBossBeats = function (game) {
  const f = Campaign.faction(game);
  const s = Campaign.state(game);
  if (f.id === 'antler') {
    return s.branch === 'holloway'
      ? [{ who: 'holloway', key: 'afterCrane' }, { who: 'holloway', key: 'ending' }]
      : [{ who: 'crane', key: 'afterHolloway' }, { who: 'crane', key: 'ending' }];
  }
  return [{ who: f.boss, key: 'afterFall' }, { who: f.boss, key: 'ending' }];
};

// The Antler branch (§5c): consequences resolve when quest 5 is won.
Campaign.chooseSide = function (game, side) { Campaign.state(game).branch = side; ADV.Save.saveGame(game); };

Campaign.complete = function (game) {
  const s = Campaign.state(game);
  const f = Campaign.faction(game);
  const p = ADV.Game.player(game);
  const world = game.world;
  s.completed = true; s.endCardDue = true;
  // gear set (§10): granted, not sold
  p.ownedSets = (p.ownedSets || []).concat(f.gearSet);
  p.equippedSet = f.gearSet; s.gearIssued = true;
  // all 72 unlock permanently, every future character (§13)
  game.meta.campaignSkillsUnlocked = true;
  ADV.Save.saveMeta(game);
  // Antler branch consequences (§5c)
  if (f.id === 'antler') {
    if (s.branch === 'holloway') {
      world.campaignWorld.antlerFirstHorn = 'holloway';
      s.craneDead = true;
      ADV.World.feed(world, 'The First Horn of the Antler is dead. The hero who killed her now runs the company.', [p.id]);
    } else {
      const holloway = Campaign.actor(game, 'holloway');
      const helpers = ADV.Game.partyRoster(game).filter(c => c !== p && !c.isMonster && !c.campaign).map(c => c.id);
      ADV.Divine.onHeroKilled(world, holloway, [p.id].concat(helpers), ADV.World.feeder(world));
      s.villainReveal = true;
    }
  }
  if (f.id === 'maw') ADV.World.feed(world, 'The watch has a list of names and a pattern. Nothing changes tonight; everything changes eventually.', [p.id]);
};

// Quartermaster: re-issue a lost faction set once per life (§10)
Campaign.reissue = function (game) {
  const s = Campaign.state(game);
  const f = Campaign.faction(game);
  const p = ADV.Game.player(game);
  if (!s.completed || s.reissued) return false;
  p.equippedSet = f.gearSet; s.reissued = true;
  ADV.Save.saveGame(game);
  return true;
};

// ---------------------------------------------------------------- debug skip (§11a)
Campaign.debugJump = function (game, fid, n) {
  const s = Campaign.state(game);
  Object.assign(s, Campaign.fresh(), { factionId: fid });
  Campaign.ensureActors(game);
  const p = ADV.Game.player(game);
  s.stage = n - 1;
  setTitle(game, s.stage >= 4 ? 3 : s.stage >= 2 ? 2 : 1);
  s.speechUnlocked = s.stage >= 2;
  s.rivalAlive = s.stage < 4;
  s.rivalToggle = s.stage >= 2 && s.rivalAlive;
  s.seenBoss = true;
  p.inventory.gold = Math.max(p.inventory.gold, 300);
  ADV.Save.saveGame(game);
  return s;
};

// ---------------------------------------------------------------- new life
Campaign.reset = function (game) { game.campaign = Campaign.fresh(); };

ADV.Campaign = Campaign;
ADV.CampaignRoutes.register('original', {...Campaign});
})();
