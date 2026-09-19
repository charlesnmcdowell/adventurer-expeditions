// Top-level game orchestration: the API the UI drives. Owns the quest loop,
// the departure decision, ambushes, town actions, tutorial firing, and death.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Rel = () => ADV.Rel;

const Game = {};

// ---------------------------------------------------------------- lifecycle
Game.newGame = function (opts) {
  const seed = opts.seed || Math.floor(Math.random() * 1e9);
  const rng = new ADV.RNG(seed ^ 0x9e3779b9);
  const world = ADV.World.create(seed);
  const meta = ADV.Save.loadMeta();
  meta.lives = (meta.lives || 0) + 1;

  let player;
  if (opts.password && ADV.DATA.REGISTRY[opts.password.toLowerCase()]) {
    player = ADV.Character.makeRegistry(rng, opts.password.toLowerCase(), opts.name);
    meta.hiroUnlocked = true;
  } else {
    player = ADV.Character.makePlayer(rng, opts);
  }
  // The journal is the real save file (§3): carried across all lives.
  player.journal = Object.assign({}, meta.journal);
  player.skillLevels = Object.assign({}, meta.skillLevels);
  // Later lives: the previous life's learned set comes back equipped, and
  // there are no fresh free picks — new skills are witnessed or bought.
  if (!player.registryId && meta.lastLifeSkills &&
      (meta.lastLifeSkills.perks.length + meta.lastLifeSkills.actives.length) > 0) {
    ADV.Death.equipCarriedSkills(player, meta);
  }
  // restore levels onto equipped skills
  for (const e of player.perks.concat(player.actives)) {
    const rec = player.skillLevels[e.skillId];
    if (rec) {
      e.level = rec.level; e.uses = rec.uses;
      if (rec.auto) e.auto = true;
      if (rec.autoOff) e.autoOff = true;
    }
  }
  ADV.World.addCharacter(world, player);
  world.playerId = player.id;

  const game = {
    world, rng, meta, player,
    board: null, life: meta.lives,
    quest: null,           // active quest run state
    lastOutcome: null,
    campaign: ADV.Campaign ? ADV.Campaign.fresh() : null,
    campaign2: ADV.Campaign2 ? ADV.Campaign2.fresh() : null,
    // the guided first hour runs once per fresh game; later lives and Hiro skip it
    tutorial: (meta.lives <= 1 && !player.registryId) ? { step: 'tour', tourIdx: 0, declined: false } : { step: 'done' },
  };
  if (ADV.DATA.VERSION) meta.patchId = ADV.DATA.VERSION.id;
  game.board = ADV.Quests.generateBoard(world, rng, game);
  if (ADV.GatePerks) ADV.GatePerks.reconcile(game);
  ADV.Save.saveGame(game);
  return game;
};

Game.load = function () {
  const data = ADV.Save.loadGame();
  if (!data) return null;
  const world = data.world;
  const player = ADV.World.byId(world, world.playerId);
  if (!player || !player.alive) return null;
  const rng = ADV.RNG.restore(data.rng, (world.seed ^ world.questClock * 2654435761) >>> 0);
  const game = { world, rng, meta: data.meta, player, board: data.board, life: data.life, quest: null, lastOutcome: null,
    campaign: data.campaign || (ADV.Campaign ? ADV.Campaign.fresh() : null),
    campaign2: data.campaign2 || (ADV.Campaign2 ? ADV.Campaign2.fresh() : null), tutorial: data.tutorial || { step: 'done' } };
  if (!game.board) game.board = ADV.Quests.generateBoard(world, rng, game);
  else if (ADV.Quests.tutorialNeedsNeutral && ADV.Quests.tutorialNeedsNeutral(game)) {
    ADV.Quests.forceTutorialNeutrals(game.board, rng);
  }
  if (ADV.Party && ADV.Party.repairWorld) ADV.Party.repairWorld(world);
  if (ADV.World.upgradePopulation(world, rng)) ADV.Save.saveGame(game);
  if (ADV.GatePerks) ADV.GatePerks.reconcile(game);
  // One-shot: compensate a live save hit by the party-id / wage bugs. Tests
  // run in Node and never take this branch.
  if (typeof window !== 'undefined' && player.inventory && !game.meta.grantGold1000) {
    player.inventory.gold = (player.inventory.gold || 0) + 1000;
    game.meta.grantGold1000 = true;
    ADV.Save.saveGame(game);
  }
  if (typeof window !== 'undefined') {
    Game.grantCourtesyGold(game);
    Game.grantCourtesyGold2(game);
    Game.clearCourtesyNotices(game);
    Game.applyPatch(game);
  }
  return game;
};

// One purse of gold for everyone already on the road — sorry for the bumps.
Game.COURTESY_GOLD = 10000;
Game.grantCourtesyGold = function (game) {
  if (!game || !game.meta || game.meta.grantGold10000) return false;
  const p = Game.player(game);
  if (!p || !p.inventory) return false;
  p.inventory.gold = (p.inventory.gold || 0) + Game.COURTESY_GOLD;
  game.meta.grantGold10000 = true;
  if (ADV.Save && ADV.Save.saveGame) ADV.Save.saveGame(game);
  return true;
};

function justBootedForUpdate() {
  try { return typeof location !== 'undefined' && /[?&]boot=/.test(location.search || ''); }
  catch (e) { return false; }
}

// A second purse after the next disruption. One-time. The home-reload card
// is skipped if this page already came from an update restart.
Game.grantCourtesyGold2 = function (game) {
  if (!game || !game.meta || game.meta.grantGold10000b) return false;
  const p = Game.player(game);
  if (!p || !p.inventory) return false;
  p.inventory.gold = (p.inventory.gold || 0) + Game.COURTESY_GOLD;
  game.meta.grantGold10000b = true;
  if (ADV.Save && ADV.Save.saveGame) ADV.Save.saveGame(game);
  return true;
};

Game.HOME_RELOAD_WAVE = 'live9';
Game.clearCourtesyNotices = function (game) {
  if (!game || !game.meta) return false;
  const m = game.meta;
  const dirty = m.courtesyGoldNotice || m.courtesyGoldNotice2 || m.homeReloadNotice;
  m.courtesyGoldNotice = false;
  m.courtesyGoldNotice2 = false;
  m.homeReloadNotice = false;
  m.homeReloadDone = true;
  m['homeReloadDone_' + Game.HOME_RELOAD_WAVE] = true;
  if (dirty && ADV.Save && ADV.Save.saveGame) ADV.Save.saveGame(game);
  return !!dirty;
};

Game.currentPatch = function () {
  return (ADV.DATA && ADV.DATA.VERSION) || null;
};
Game.versionLabel = function () {
  const v = Game.currentPatch();
  if (!v) return '';
  return v.label || v.id || '';
};

// One thank-you purse and one notes card per published version.
Game.applyPatch = function (game) {
  const v = Game.currentPatch();
  if (!game || !game.meta || !v || !v.id) return false;
  if (game.meta.patchId === v.id) return false;
  const hadLife = game.meta.patchId != null || game.meta.grantGold10000 || game.meta.grantGold10000b
    || (game.life != null && game.life > 0);
  const p = Game.player(game);
  const gold = hadLife ? (v.gold || 0) : 0;
  if (p && p.inventory && gold > 0) p.inventory.gold = (p.inventory.gold || 0) + gold;
  game.meta.patchId = v.id;
  game.meta.patchGold = gold;
  game.meta.patchNotice = true;
  if (ADV.Save && ADV.Save.saveGame) ADV.Save.saveGame(game);
  return true;
};

Game.reloadForUpdate = function (game) {
  if (game && game.meta) {
    game.meta.homeReloadNotice = false;
    game.meta.homeReloadDone = true;
    game.meta['homeReloadDone_' + Game.HOME_RELOAD_WAVE] = true;
  }
  try { if (game && ADV.Save && ADV.Save.saveGame) ADV.Save.saveGame(game); } catch (e) {}
  if (typeof location === 'undefined') return true;
  const u = new URL(location.href);
  u.searchParams.set('boot', String(Date.now()));
  u.searchParams.set('cb', Game.HOME_RELOAD_WAVE);
  location.replace(u.pathname + u.search + u.hash);
  return true;
};

Game.player = function (game) {
  return ADV.World.byId(game.world, game.world.playerId);
};

// ---------------------------------------------------------------- tutorial
// Fire-once contextual prompts (§12). Returns the line or null.
Game.prompt = function (game, id) {
  if (!ADV.DATA.PROMPTS[id]) return null;
  game.meta.promptsSeen = game.meta.promptsSeen || {};
  if (game.meta.promptsSeen[id]) return null;
  game.meta.promptsSeen[id] = true;
  if (!game.meta.codexUnlocked.includes(id)) game.meta.codexUnlocked.push(id);
  ADV.Save.saveMeta(game);
  return ADV.DATA.PROMPTS[id];
};

// ---------------------------------------------------------------- career
Game.careerStage = function (game) {
  const p = Game.player(game);
  const party = ADV.Party.of(game.world, p);
  if (!party) {
    const followers = (p.conscriptIds || []).length + (p.undeadIds || []).length;
    return followers > 0 ? 'leader' : 'solo';
  }
  return party.leaderId === p.id ? 'leader' : 'hireling';
};

// Dependents young enough to need tuition or a parent at home (§7).
Game.youngDependents = function (ch) {
  return (ch.dependents || []).filter(d => d.age < C().CHILD_SELF_SUFFICIENT).length;
};

// A Gate expedition is led by the player, independently of their world party.
// Keep the world party intact so its members and wages are there on return.
Game.questParty = function (game, quest) {
  const activeQuest = quest || (game.quest && game.quest.quest);
  return activeQuest && activeQuest.campaign3 ? null : ADV.Party.of(game.world, Game.player(game));
};

Game.partyRoster = function (game, quest) {
  const player = Game.player(game);
  const activeQuest = quest || (game.quest && game.quest.quest);
  const roster = activeQuest && activeQuest.campaign3 ? [player] : ADV.Party.battleRoster(game.world, player);
  // campaign allies (rival / boss) ride along on campaign quests only (§5a)
  if (ADV.Campaign && activeQuest && activeQuest.campaign) {
    const allies = ADV.Campaign.alliesFor(game, activeQuest);
    for (const a of allies) if (!roster.includes(a)) roster.push(a);
  }
  // quest-scoped necromancy thralls walk until the contract ends (even if
  // they dropped last fight — they stand up again for the next field)
  const cap = ADV.Party.companyCap ? ADV.Party.companyCap() : 8;
  if (game.quest && game.quest.quest === activeQuest && game.quest.thralls) {
    for (const t of game.quest.thralls) {
      if (roster.length >= cap) break;
      if (t && t.alive !== false && !t.hasFled && !roster.includes(t)) roster.push(t);
    }
  }
  return roster.length > cap ? roster.slice(0, cap) : roster;
};

Game.restoreQuestThralls = function (game) {
  for (const t of (game.quest && game.quest.thralls) || []) {
    if (t && t.alive && !t.hasFled) {
      t.combatHp = ADV.Character.maxHp(t);
      t.wasDowned = false;
    }
  }
};

// ---------------------------------------------------------------- the Maw's desk
Game.assassinFee = function (target) { return 100 * Math.max(1, target.reputation || 0); };
Game.hireAssassins = function (game, targetId) {
  const p = Game.player(game);
  const t = ADV.World.byId(game.world, targetId);
  if (!t || !t.alive) return { ok: false, error: 'no such target' };
  const fee = Game.assassinFee(t);
  if (p.inventory.gold < fee) return { ok: false, error: 'not enough gold' };
  p.inventory.gold -= fee;
  game.world.mawContracts = game.world.mawContracts || [];
  game.world.mawContracts.push({ targetId, byId: p.id, fee, placedAt: game.world.questClock });
  ADV.Save.saveGame(game);
  return { ok: true, fee };
};

// ---------------------------------------------------------------- the leader's pick
// A hireling never chooses the contract (request 1): the NPC leader does,
// from the party board, by temperament — and never one that cannot cover
// payroll. Parties never take solo work.
Game.leaderPick = function (game) {
  const p = Game.player(game);
  const party = ADV.Party.of(game.world, p);
  if (!party || party.leaderId === p.id) return null;
  const leader = ADV.Party.leader(game.world, party);
  const payroll = ADV.Party.payroll(game.world, party);
  let pool = game.board.filter(q => q.track === 'party' && q.payout > payroll);
  if (!pool.length) pool = game.board.filter(q => q.track === 'party');
  if (!pool.length) return null;
  // the guided first party quest is a canned easy road job, not a 3–5 pack
  if (game.tutorial && game.tutorial.step === 'partyQuest') return ADV.Quests.makeTutorialParty();
  const lean = ADV.Party.alignment(game.world, party);
  if (lean === 'law' || lean === 'criminal') {
    const opposite = lean === 'law' ? 'criminal' : 'law';
    const keep = pool.filter(q => q.factionAlignment !== opposite);
    if (keep.length) pool = keep;
    const preferred = pool.filter(q => q.factionAlignment === lean);
    if (preferred.length) pool = preferred;
  }
  pool.sort((a, b) => a.tier === b.tier ? a.payout - b.payout : (a.isBoss ? 9 : a.tier) - (b.isBoss ? 9 : b.tier));
  const per = leader ? leader.personality : { caution: 50, greed: 50, aggression: 50 };
  const bold = (per.aggression + per.greed) / 2 - per.caution;   // -100..100
  const idx = Math.max(0, Math.min(pool.length - 1, Math.round((pool.length - 1) * (0.5 + bold / 200))));
  return pool[idx];
};
// Can this leader afford to take the contract at all? (request 8)
Game.contractCoversPayroll = function (game, quest) {
  const p = Game.player(game);
  const party = Game.questParty(game, quest);
  if (!party || party.leaderId !== p.id) return true;
  return quest.payout > ADV.Party.payroll(game.world, party);
};

Game.wipeParty = function (world, party, killerId) {
  if (!party) return;
  const roster = ADV.Party.roster(world, party).slice();
  const leader = ADV.Party.leader(world, party);
  for (const c of roster) {
    if (c === leader) continue;
    if (c.isConscript || c.isUndead || c.isQuestThrall) continue;
    if (c.alive && !c.isPlayer) ADV.Death.finalize(world, c, killerId, 'killed');
  }
  if (leader && leader.alive && !leader.isPlayer && !leader.isConscript && !leader.isUndead && !leader.isQuestThrall) {
    ADV.Death.finalize(world, leader, killerId, 'killed');
  }
  if (world.parties.includes(party)) ADV.Party.disband(world, party);
};

// ---------------------------------------------------------------- departure
// The pre-quest decision point (§7/§8): carry vs vault, tuition vs stay home.
Game.departureInfo = function (game, quest) {
  const p = Game.player(game);
  const kids = Game.youngDependents(p);
  const travel = ADV.Travel ? ADV.Travel.quote(game, quest) : null;
  return {
    quest,
    carriedGold: p.inventory.gold,
    vault: ADV.Vault.of(game.world, p),
    dependents: kids,
    tuition: kids * C().GOLD.tuitionPerChildPerQuest * (travel ? travel.days : 1),
    travel,
    roster: Game.partyRoster(game, quest),
    payroll: (() => {
      const party = Game.questParty(game, quest);
      return party && party.leaderId === p.id ? ADV.Party.payroll(game.world, party) : 0;
    })(),
  };
};

// Stay home: no quest, world advances anyway (§7). Home is safe — no ambush.
Game.stayHome = function (game) {
  const p = Game.player(game);
  if (ADV.Survival) {
    const surv = ADV.Survival.onQuestResolved(game);
    if (surv && surv.autoBought) game.lastAutoBuy = { ok: true, name: surv.autoBought.name, cost: surv.autoBought.cost };
    else if (surv && surv.autoBuyFailed) game.lastAutoBuy = { ok: false, error: surv.autoBuyFailed };
  } else ADV.Character.digest(p);
  agePlayerChildren(game);
  tickPlayerPregnancy(game);
  ADV.World.tick(game.world, game.rng, { playerQuested: false });
  ADV.Vault.onQuestResolved(game.world, p, false);
  game.board = ADV.Quests.generateBoard(game.world, game.rng, game);
  ADV.Save.saveGame(game);
  return { ok: true };
};

// ---- rival companies (grace, outing cooldown, rare Hiro intercepts) ----------
Game.rivalAlignment = function (quest) {
  if (quest && quest.factionAlignment === 'criminal') return 'law';
  if (quest && quest.factionAlignment === 'law') return 'criminal';
  return 'law';
};
Game.shouldMeetRival = function (game, quest) {
  if (!quest || quest.campaign) return false;
  if (quest.track !== 'party') return false;
  if (game.tutorial && game.tutorial.step && game.tutorial.step !== 'done') return false;
  const p = Game.player(game);
  const outings = (p.questsCompleted || 0) + (p.questsFailed || 0);
  const grace = C().RIVAL_GRACE_QUESTS != null ? C().RIVAL_GRACE_QUESTS : 5;
  if (outings < grace) return false;
  const last = game.world && game.world.lastRivalOuting;
  if (last != null && last !== -99) {
    const cool = C().RIVAL_COOLDOWN_QUESTS != null ? C().RIVAL_COOLDOWN_QUESTS : 2;
    if ((outings - last) < cool + 1) return false;
  }
  const chance = C().RIVAL_CHANCE != null ? C().RIVAL_CHANCE : 0.22;
  return game.rng.chance(chance);
};
Game.pickRivalParty = function (game, quest) {
  const world = game.world;
  const p = Game.player(game);
  const mine = ADV.Party.of(world, p);
  const want = Game.rivalAlignment(quest);
  const others = (world.parties || []).filter(x => x !== mine && ADV.Party.leader(world, x) && ADV.Party.leader(world, x).alive);
  const aligned = others.filter(x => ADV.Party.alignment && ADV.Party.alignment(world, x) === want);
  const pool = aligned.length ? aligned : others;
  if (!pool.length) return null;
  const isHiroParty = (party) => {
    const lead = ADV.Party.leader(world, party);
    return !!(ADV.Hiro && ADV.Hiro.isHiro(lead));
  };
  const hiroPool = pool.filter(isHiroParty);
  const rest = pool.filter(x => !isHiroParty(x));
  const hiroChance = C().HIRO_RIVAL_CHANCE != null ? C().HIRO_RIVAL_CHANCE : 0.05;
  if (rest.length) {
    if (hiroPool.length && game.rng.chance(hiroChance)) return game.rng.pick(hiroPool);
    return game.rng.pick(rest);
  }
  if (hiroPool.length && game.rng.chance(hiroChance)) return game.rng.pick(hiroPool);
  return null;
};
Game.attachRival = function (game, quest) {
  if (!Game.shouldMeetRival(game, quest)) return null;
  const party = Game.pickRivalParty(game, quest);
  if (!party) return null;
  const leader = ADV.Party.leader(game.world, party);
  if (!leader) return null;
  const p = Game.player(game);
  game.world.lastRivalOuting = (p.questsCompleted || 0) + (p.questsFailed || 0);
  ADV.World.markPlayerContact(game.world, 'lastRivalAt');
  return { partyId: party.id, alignment: Game.rivalAlignment(quest), leaderId: leader.id, resolved: false };
};
Game.rivalAIChoice = function (leader) {
  const per = (leader && leader.personality) || {};
  const a = per.aggression || 50, c = per.caution || 50, g = per.greed || 50;
  if (a >= c && a >= 55) return 'fight';
  if (c >= g && c >= 55) return 'flee';
  if (g >= 55) return 'surrender';
  return a > c ? 'fight' : 'flee';
};
// Hireling view of a rival intercept: the NPC lead picks steel or walks.
Game.leadRivalChoice = function (leader) {
  return Game.rivalAIChoice(leader) === 'fight' ? 'fight' : 'abandon';
};
Game.resolveHirelingRival = function (game) {
  const q = game && game.quest;
  if (!q || q.over || q.playerDead) return { choice: 'none' };
  const world = game.world;
  const party = ADV.Party.of(world, Game.player(game));
  const leader = party ? ADV.Party.leader(world, party) : null;
  const choice = Game.leadRivalChoice(leader);
  const name = (leader && leader.name) || 'The lead';
  if (choice === 'abandon') {
    q.failed = true; q.fled = true; q.over = true;
    ADV.World.feed(world, name + ' turned the company from the other party and left the contract.', leader ? [leader.id] : []);
    return { choice: 'abandon', leader };
  }
  ADV.World.feed(world, name + ' chose steel.', leader ? [leader.id] : []);
  return { choice: 'fight', leader };
};
Game.applyRivalDecision = function (game, playerChoice) {
  const q = game.quest;
  const rival = q && q.rival;
  if (!rival) return { outcome: 'none' };
  const world = game.world;
  const rParty = world.parties.find(p => p.id === rival.partyId);
  const rLeader = rParty ? ADV.Party.leader(world, rParty) : ADV.World.byId(world, rival.leaderId);
  const rivalChoice = Game.rivalAIChoice(rLeader || { personality: { caution: 60 } });
  rival.playerChoice = playerChoice;
  rival.rivalChoice = rivalChoice;
  rival.resolved = true;
  q.rivalResolved = true;
  if (playerChoice === 'flee') {
    q.failed = true; q.fled = true; q.over = true;
    ADV.World.feed(world, 'The company turned from the other party and left the contract.', []);
    return { outcome: 'playerFlee' };
  }
  if (playerChoice === 'surrender') {
    q.failed = true; q.surrendered = true; q.over = true;
    ADV.World.feed(world, 'The contract was yielded to the other company.', []);
    return { outcome: 'playerSurrender' };
  }
  q.rivalPending = true;
  q.rivalFight = false;
  ADV.World.feed(world, (rLeader ? rLeader.name : 'The other company') + "'s party will be waiting when the contract is done.", rLeader ? [rLeader.id] : []);
  return { outcome: 'fight' };
};
Game.maybeStartRivalFinale = function (game) {
  const q = game.quest;
  if (!q || q.over || q.failed || q.playerDead) return false;
  if (!q.rivalPending || q.rivalCombatDone) return false;
  if (!(q.readyToComplete || q.encIdx >= q.quest.encounters.length)) return false;
  q.readyToComplete = false;
  q.rivalFight = true;
  q.enemies = null;
  q.verbs = null;
  return true;
};

// Begin a quest run. depositGold: how much carried gold to vault first.
Game.startQuest = function (game, quest, opts) {
  opts = opts || {};
  const plan=ADV.QuestLifecycle.planDeparture(game,quest,opts);
  if(!plan.ok)return plan;
  const {p,travel,tuitionDue}=plan;
  if (opts.vaultGold && opts.vaultGold > 0) {
    const amt = Math.min(opts.vaultGold, p.inventory.gold);
    p.inventory.gold -= amt;
    ADV.Vault.deposit(game.world, p, amt);
  }
  const kids = Game.youngDependents(p);
  if (kids > 0) {
    const tuition = tuitionDue;
    if (p.inventory.gold < tuition) return { ok: false, error: 'cannot afford tuition' };
    p.inventory.gold -= tuition;
  }
  game.quest = {
    quest, encIdx: 0, over: false, failed: false,
    witnessedNew: [], lootGold: 0,
    partnerAlong: false,
    defeatedNamed: [],  // named NPCs beaten this run awaiting post-victory choice
    thralls: [],
  };
  const roster = Game.partyRoster(game);
  for (const ch of roster) { ch.questHp = 0; ch.survivalBattles = 0; ch.combatHp = ADV.Character.maxHp(ch); ch.wasDowned = false; ch.hasFled = false; }
  if (travel) {
    travel.payer.inventory.gold -= travel.total;
    game.meta.travelJourneyCount=(game.meta.travelJourneyCount||0)+1;
    game.quest.travel = { days:travel.days, cost:travel.total, payerId:travel.payer.id, provisions:travel.provisions,
      journey:game.meta.travelJourneyCount,
      phase:ADV.Housing.timeOfDay(game.world.questClock), weather:ADV.Weather ? ADV.Weather.at(game.world,{groundId:quest.travelLocation}) : null };
    if (quest.distance === 'far' && !travel.provisions) for (const ch of roster) ch.combatHp = Math.floor(ch.combatHp * .85);
  }
  game.quest.partnerAlong = roster.some(c => ADV.Rel.isPartner(p, c));
  if (quest.campaign) game.quest.departureBeats = ADV.Campaign.departureBeats(game, quest);
  const rival = Game.attachRival(game, quest);
  if (rival) {
    game.quest.rival = rival;
    game.quest.rivalPending = true;
    game.quest.rivalResolved = true;
  }
  return { ok: true, quest: game.quest };
};

// Current encounter: spawn enemies + verb options.
Game.currentEncounter = function (game) {
  const q = game.quest;
  if (!q || q.over || q.playerDead) return null;
  if (q.rivalFight && !q.rivalCombatDone) {
    if (!q.enemies) {
      const world = game.world;
      const rParty = q.rival && (world.parties || []).find(p => p.id === q.rival.partyId);
      const roster = rParty ? ADV.Party.roster(world, rParty) : [];
      q.enemies = roster.filter(c => c && c.alive && !c.isPlayer);
      q.verbs = [{ verb: 'fight', ok: true }];
    }
    return {
      encIdx: q.quest.encounters.length, total: q.quest.encounters.length + 1,
      enemies: q.enemies, verbs: q.verbs, boss: false, revealed: false, openerBeats: [], rival: true,
    };
  }
  if (q.readyToComplete || q.encIdx >= q.quest.encounters.length) return null;
  const fresh=!q.enemies;
  if (!q.enemies) {
    q.enemies = q.quest.campaign ? ADV.Campaign.spawnEncounter(game, q.quest, q.encIdx)
      : ADV.Quests.spawnEncounter(game.rng, q.quest, q.encIdx, game.world, game);
    if (ADV.Difficulty) ADV.Difficulty.reinforce(game.rng, q.quest, q.enemies, game.world, Game.partyRoster(game).length);   // more of them on the harder roads
    // campaign allies who exited the last fight walk back in at full health (§5a)
    for (const ch of Game.partyRoster(game)) if (ch.campaign && ch.hasFled) { ch.hasFled = false; ch.combatHp = ADV.Character.maxHp(ch); }
    if (q.quest.campaign) {
      const onBoss = !!q.quest.encounters[q.encIdx].boss;
      if (q.quest.godLine) {
        const spec = (q.quest.cEnc && q.quest.cEnc[q.encIdx]) || {};
        const lines = spec.boss ? (ADV.DATA.GOD_LINE_DIALOGUE || {})[q.quest.godBoss] : null;
        q.openerBeats = lines ? [{ who: q.quest.godBoss, key: 'open', lines }] : [];
      } else if (q.quest.war) {
        const pack = (ADV.DATA.FACTION_WAR_DIALOGUE || {})[q.quest.warAgainst];
        const lines = pack ? (onBoss ? pack.boss : (q.encIdx === 0 ? pack.open : null)) : null;
        q.openerBeats = (lines && pack) ? [{ who: pack.who, key: onBoss ? 'warboss' : 'waropen', lines }] : [];
      } else if (q.quest.campaign2) {
        q.openerBeats = (onBoss && q.quest.n === 5) ? ADV.Campaign.finalOpener(game, q.quest.factionId) : [];
      } else {
        q.openerBeats = (onBoss && q.quest.n === 5) ? ADV.Campaign.finalOpener(game) : [];
      }
    }
    q.verbs = ADV.Quests.availableVerbs(game.world, Game.player(game), Game.partyRoster(game).slice(1), q.quest, q.enemies);
  }
  const revealed = !!(q.revealNext || Game.player(game).perks.some(x => x.skillId === 'case_the_room'));
  q.revealNext = false;
  return ADV.CampaignRoutes.hook(game,'encounterReady',{ encIdx: q.encIdx, total: q.quest.encounters.length, enemies: q.enemies, verbs: q.verbs, boss: q.quest.encounters[q.encIdx].boss, revealed, openerBeats: q.openerBeats || [] },{fresh});
};

// Try a non-fight verb. Returns {success, mode:'bypass'|'ambush', stolen}.
Game.tryVerb = function (game, verbInfo) {
  const q = game.quest;
  const encIdx=q.encIdx;
  const res = ADV.Quests.attemptBypass(game.world, game.rng, Game.player(game), Game.partyRoster(game).slice(1), verbInfo, q.enemies);
  if (res.success && res.mode === 'bypass') {
    q.encIdx++; q.enemies = null; q.verbs = null;
    if (q.encIdx >= q.quest.encounters.length) q.readyToComplete = true;
  }
  // ambush: caller starts combat with ambushBy = player id
  return ADV.CampaignRoutes.hook(game,'verbFinished',res,{encIdx});
};

Game.necroCaster = function (game) {
  const roster = Game.partyRoster(game);
  return roster.find(c => c.isPlayer && ADV.SkillSys.entryFor(c, 'necromancy')) ||
    roster.find(c => ADV.SkillSys.entryFor(c, 'necromancy')) || null;
};

Game.necroPower = function (caster) {
  const e = caster && ADV.SkillSys.entryFor(caster, 'necromancy');
  if (!e) return (ADV.DATA.CONST.UNDEAD_STAT_MULT || 1.5);
  const m = ADV.SkillSys.manifest(caster, e);
  if (m && m.data && m.data.risenPower) return m.data.risenPower;
  const idx = { basic: 0, intermediate: 1, advanced: 2 }[m && m.tier] || 0;
  return (ADV.DATA.CONST.NECRO_STRENGTH || [1.5, 2.0, 2.6])[idx] || 1.5;
};

Game.conscriptEligible = function (ch) {
  if (!ch || ch.isPlayer || ch.isQuestThrall || ch.isUndead || ch.isConscript) return false;
  if (ch.campaign) return false;
  return ch.species === 'human' || !ch.isMonster;
};

Game.adoptBattlefieldNpc = function (game, ch) {
  if (!game || !ch || !game.world) return ch;
  if (ADV.World.byId(game.world, ch.id)) return ch;
  if (!ch.personalityId) {
    const pers = ADV.Character.pickPersonality(game.rng, ch.sex || 'm', game.world);
    if (pers) ch.personalityId = pers.id;
  }
  if (ch.isMonster && ch.species === 'human') {
    const used = new Set((game.world.characters || []).map(c => c && c.name).filter(Boolean));
    const names = (ADV.DATA.NAMES && ADV.DATA.NAMES[ch.sex || 'm']) || [];
    const free = names.filter(n => !used.has(n));
    if (free.length) ch.name = game.rng.pick(free);
    ch.isMonster = false;
  }
  ADV.World.addCharacter(game.world, ch);
  return ch;
};

Game.makeQuestThrall = function (src, caster) {
  const power = Game.necroPower(caster);
  const ch = ADV.Character.base({
    name: (src.name || 'Thrall') + ' (risen)',
    sex: src.sex || 'm',
    species: src.species || 'human',
    stats: Object.assign({}, src.stats),
    portraitSeed: src.portraitSeed, portraitKind: src.portraitKind, portraitId: src.portraitId,
    appearance: src.appearance ? Object.assign({},src.appearance) : null,
    equippedSet: src.equippedSet || null,
    enemyTypeId: src.enemyTypeId, isMonster: true, isUndead: true, isQuestThrall: true,
    raisedById: caster.id, organic: false, risenPower: power,
    actives: (src.actives || []).map(a => Object.assign({}, a)),
    perks: (src.perks || []).map(p => Object.assign({}, p)),
    personality: { aggression: 80, greed: 10, caution: 10, loyalty: 90, pride: 10 },
  });
  ch.combatHp = ADV.Character.maxHp(ch);
  return ch;
};

Game.autoRaiseFallen = function (game, fallen) {
  const q = game.quest;
  const caster = Game.necroCaster(game);
  if (!q || !caster || !fallen || !fallen.length) return [];
  q.thralls = q.thralls || [];
  const raised = [];
  const feed = ADV.World.feeder(game.world);
  for (const src of fallen) {
    if (!src || src.isPlayer || src.isQuestThrall) continue;
    if (!ADV.Character.isOrganic(src)) continue;
    if (Game.conscriptEligible(src)) {
      const player = Game.player(game);
      if (player && ADV.SkillSys.entryFor(player, 'conscript')) continue;
    }
    // Stored followers waiting at home must not consume Gate summon slots.
    const room = q.quest?.campaign3 ? ADV.Party.companyCap() - Game.partyRoster(game).length
      : ADV.Party.followerRoom(game.world, caster, q.thralls);
    if (room <= 0) break;
    if (src.isMonster || src.isQuestThrall) {
      const thrall = Game.makeQuestThrall(src, caster);
      q.thralls.push(thrall);
      raised.push(thrall);
    } else {
      const theirParty = ADV.Party.of(game.world, src);
      if (theirParty) {
        if (theirParty.leaderId === src.id) ADV.Party.succession(game.world, theirParty);
        else ADV.Party.removeMember(game.world, theirParty, src.id);
      }
      src.isUndead = true;
      src.isQuestThrall = true;
      src.risenPower = Game.necroPower(caster);
      src.raisedById = caster.id;
      src.combatHp = ADV.Character.maxHp(src);
      src.hasFled = false;
      src.wasDowned = false;
      src.partyId = null;
      src.leaderId = null;
      ADV.Character.applyNonOrganic(src);
      q.thralls.push(src);
      caster.undeadIds = caster.undeadIds || [];
      if (!caster.undeadIds.includes(src.id)) caster.undeadIds.push(src.id);
      raised.push(src);
    }
    caster.usedForbidden = true;
    caster.necromancyRaises = (caster.necromancyRaises || 0) + 1;
    ADV.SkillSys.recordUse(caster, 'necromancy');
    if (caster.necromancyRaises >= C().NECRO_MARK_THRESHOLD && !caster.divineMarked) {
      ADV.Divine.mark(game.world, caster, 'forbidden arts', feed);
    }
    feed(caster.name + ' raised ' + src.name + '.', [caster.id, src.id].filter(Boolean));
  }
  return raised;
};

Game.releaseQuestThralls = function (game) {
  const q = game.quest;
  if (!q || !q.thralls) return;
  const world = game.world;
  const feed = ADV.World.feeder(world);
  for (const t of q.thralls.slice()) {
    const master = ADV.World.byId(world, t.raisedById);
    if (master) master.undeadIds = (master.undeadIds || []).filter(id => id !== t.id);
    if (t.isMonster || !ADV.World.byId(world, t.id)) {
      t.alive = false; t.combatHp = 0;
    } else if (t.alive) {
      ADV.Death.finalize(world, t, null, 'decayed');
      feed((t.name || 'A thrall') + ' fell still when the contract ended.', [t.id]);
    }
  }
  q.thralls = [];
};

// Build the combat state for the current encounter.
Game.startCombat = function (game, ambush) {
  const q = game.quest;
  Game.restoreQuestThralls(game);
  const roster = Game.partyRoster(game).filter(c => (c.combatHp == null || c.combatHp > 0) && !c.hasFled);
  const party = Game.questParty(game);
  const lead = party ? ADV.Party.leader(game.world, party) : Game.player(game);
  const st = ADV.Combat.create(roster, q.enemies, {
    rng: game.rng.fork('combat' + game.world.questClock + ':' + (q.rivalFight ? 'rival' : q.encIdx)),
    ambushBy: ambush ? Game.player(game).id : null,
    context: 'quest',
    leaderId: lead && lead.id,
    world: game.world,
    questThralls: q.thralls || [],
  });
  if (q.quest.campaign && q.quest.spawnQueue && q.enemies.some(e => e.campaignId === 'quiet')) { st.spawnQueue = q.quest.spawnQueue; q.quest.spawnQueue = null; }
  q.combat = st;
  return st;
};

// Band a mourner would use over the dead lead — snapshotted before finalize
// strips the edges.
Game.funeralBand = function (world, from, to) {
  if (!from || !to) return 'general';
  const tier = ADV.Rel.tierBetween(world, from.id, to.id);
  return tier === 'romantic' ? 'romantic' : tier === 'hatred' ? 'hatred' :
    tier === 'friendly' ? 'friendly' : 'general';
};

// Lead fell or ran: the contract is void. Death also breaks the company.
// Survivors (and their standing with the lead) are recorded for the funeral.
Game.resolveLeaderFall = function (game, st) {
  const q = game.quest;
  const world = game.world;
  const p = Game.player(game);
  const party = Game.questParty(game);
  const leader = party ? ADV.Party.leader(world, party) : q.quest?.campaign3 ? p : null;
  q.failed = true;
  q.over = true;
  if (st && st.leaderFled) {
    q.fled = true;
    q.leaderFled = true;
    if (leader) ADV.World.feed(world, (leader.name || 'The lead') + ' fled the field. The contract is void.', [leader.id]);
    return;
  }
  q.leaderDied = true;
  if (!leader || leader.isPlayer) {
    if (leader && leader.isPlayer) q.playerDead = true;
    return;
  }
  const mourners = ADV.Party.roster(world, party)
    .filter(c => c && c !== leader && !c.isMonster && !c.isQuestThrall);
  world.pendingLeaderDeath = {
    leaderName: leader.name,
    leaderId: leader.id,
    memberIds: mourners.map(c => c.id),
    words: mourners.map(c => ({
      id: c.id,
      band: Game.funeralBand(world, c, leader),
      score: ADV.Rel.score(world, c.id, leader.id),
    })),
  };
  if (p.combatHp != null && p.combatHp <= 0) p.combatHp = 1;
  p.hasFled = false;
  if (party) ADV.Party.disband(world, party);
  if (leader.alive) ADV.Death.finalize(world, leader, null, 'killed');
  ADV.World.feed(world, leader.name + ' died on the road. The company is broken.', [leader.id]);
};

// Charm's bribe (request 6): price and odds for buying off a hostile named
// enemy mid-battle. null = this target cannot be bought.
Game.bribeOffer = function (game, targetCh) {
  const world = game.world;
  const p = Game.player(game);
  const entry = p.perks.find(e => e.skillId === 'charm');
  if (!entry) return null;
  if (targetCh.isMonster || !targetCh.alive) return null;
  if (targetCh.status === 'hero' || targetCh.isConscript || targetCh.isUndead) return null;
  const hates = Rel().hates(world, targetCh.id, p.id);
  if (!hates) return null;
  const m = ADV.SkillSys.manifest(p, entry);
  const fee = 30 + 20 * (targetCh.rank || 1);
  return { fee, chance: m.data.bribeChance || 0.4, tier: m.tier };
};

// Cleanse aftermath (request 7): freed conscripts and restored undead are
// resolved against the world once the fight is over.
function processMercies(game, st) {
  const world = game.world;
  for (const u of st.units) {
    const ch = u.ch;
    if (ch.__freedByCleanse) {
      delete ch.__freedByCleanse;
      const master = ADV.World.byId(world, ch.conscriptorId);
      if (master) master.conscriptIds = (master.conscriptIds || []).filter(id => id !== ch.id);
      ADV.Divine.releaseConscript(world, ch, master || { id: null, name: 'their captor' }, ADV.World.feeder(world), false);
      ADV.World.feed(world, `${ch.name} was cleansed free of conscription.`, [ch.id]);
    }
    if (ch.__unraised) {
      delete ch.__unraised;
      const raiser = ADV.World.byId(world, ch.raisedById);
      if (raiser) raiser.undeadIds = (raiser.undeadIds || []).filter(id => id !== ch.id);
      ch.isUndead = false;
      ch.undeadQuestsLeft = 0;
      ch.raisedById = null;
      ch.combatHp = null; // stats re-derive without the undead multiplier
      ADV.World.feed(world, `${ch.name} was brought back from undeath — the true death undone.`, [ch.id]);
    }
  }
}

// Called when a combat ends. Handles witnesses, recovery, loot, progression.
Game.finishCombat = function (game) {
  const q = game.quest;
  const st = q.combat;
  const resolvedEncIdx = q.encIdx;
  const p = Game.player(game);
  ADV.Combat.exportHp(st);
  processMercies(game, st);
  const won = st.winner === 'a';
  if (q.rivalFight) {
    q.combat = null;
    q.enemies = null;
    q.verbs = null;
    q.rivalFight = false;
    q.rivalPending = false;
    q.rivalCombatDone = true;
    if (won) {
      const newly = ADV.Combat.registerWitnesses(st);
      q.witnessedNew.push(...newly);
      const rParty = (game.world.parties || []).find(x => q.rival && x.id === q.rival.partyId);
      Game.wipeParty(game.world, rParty, p.id);
      if (p.combatHp <= 0 || p.wasDowned) p.combatHp = Math.max(1, p.combatHp);
      q.readyToComplete = true;
      return { won: true, playerDead: q.playerDead };
    }
    if (st.leaderFled || st.leaderFell) Game.resolveLeaderFall(game, st);
    else if (p.hasFled) { q.failed = true; q.fled = true; q.over = true; }
    else if (st.units.find(u => u.ch === p && u.downed)) { q.playerDead = true; q.over = true; }
    else { q.failed = true; q.over = true; }
    return { won: false, playerDead: q.playerDead };
  }
  if (won) {
    // survivors witness (downed-but-alive counts — their side won, so they live, §3)
    const newly = ADV.Combat.registerWitnesses(st);
    q.witnessedNew.push(...newly);
    // loot: monsters drop pocket gold; defeated NAMED characters await the choice screen
    const corpseGold = ADV.SkillSys.knownVal(p, 'killGold');
    const fallen = [];
    for (const u of st.units.filter(x => x.side === 'b' && x.downed)) {
      if (corpseGold) q.lootGold += corpseGold;
      if (u.ch.campaign) { u.ch.__fell = true; u.ch.combatHp = null; }                            // campaign fixtures resolve in story, not the choice screen
      else if (u.ch.isMonster) {
        q.lootGold += game.rng.int(4, 12) + (u.ch.enemyLevel || 1);
        if (u.ch.boss) q.lootGold += 60;
        fallen.push(u.ch);
        if (Game.conscriptEligible(u.ch) && ADV.SkillSys.entryFor(p, 'conscript')) {
          u.ch.alive = true;
          q.defeatedNamed.push(u.ch);
        }
      } else {
        fallen.push(u.ch);
        q.defeatedNamed.push(u.ch);
        u.ch.combatHp = 0; // held at 0 until the victor decides
      }
    }
    const risen = Game.autoRaiseFallen(game, fallen);
    q.defeatedNamed = (q.defeatedNamed || []).filter(c => !risen.includes(c));
    const roster = Game.partyRoster(game);
    ADV.Combat.applyPostVictoryRecovery(roster);
    // Quartermaster's Root: the best root in the party heals everyone a little more between fights
    let rootPct = 0;
    for (const c of roster) { const pct = ADV.SkillSys.knownVal(c, 'betweenHealPct'); if (pct) rootPct = Math.max(rootPct, pct); }
    if (rootPct) for (const c of roster) if (c.combatHp != null && c.combatHp > 0) c.combatHp = Math.min(ADV.Character.maxHp(c), c.combatHp + Math.round(ADV.Character.maxHp(c) * rootPct));
    if (st.revealNext) q.revealNext = true;                                   // Scout's Cut
    q.encIdx++; q.enemies = null; q.verbs = null; q.combat = null;
    if (q.encIdx >= q.quest.encounters.length) {
      q.readyToComplete = true;
      if (q.quest.godLine || q.quest.war) { /* no faction beats: nobody's rival, nobody's boss */ }
      else if (q.quest.campaign2) {
        // The second campaign keeps its rival flag per faction, not per game.
        const fid = q.quest.factionId;
        const m = ADV.Campaign2.member(game, fid);
        if (q.quest.rivalDies && m && m.rivalToggle) q.closingBeats = ADV.Campaign.rivalDeathSequence(game, fid);
        else if (q.quest.rivalDies) q.closingBeats = ADV.Campaign.rivalDeathSequence(game, fid).filter(b => b.death).map(b => Object.assign({}, b, { offscreen: true }));
        else if (q.quest.isBoss) q.closingBeats = ADV.Campaign.afterBossBeats(game, fid);
      }
      else if (q.quest.campaign && q.quest.rivalDies && game.campaign && game.campaign.rivalToggle) q.closingBeats = ADV.Campaign.rivalDeathSequence(game);
      else if (q.quest.campaign && q.quest.rivalDies) q.closingBeats = ADV.Campaign.rivalDeathSequence(game).filter(b => b.death).map(b => Object.assign({}, b, { offscreen: true }));
      else if (q.quest.campaign && q.quest.isBoss) q.closingBeats = ADV.Campaign.afterBossBeats(game);
    }
    // party wipe check on our side (possible pyrrhic states)
    if (p.combatHp <= 0 || p.wasDowned) {
      // player was downed but side won: alive at 1 hp
      p.combatHp = Math.max(1, p.combatHp);
    }
  } else {
    // player side lost, fled, or the party lead fell
    if (st.leaderFled || st.leaderFell) Game.resolveLeaderFall(game, st);
    else if (p.hasFled) { q.failed = true; q.fled = true; q.over = true; }
    else if (st.units.find(u => u.ch === p && u.downed)) {
      q.playerDead = true; q.over = true;
    } else { q.failed = true; q.over = true; }
  }
  return ADV.CampaignRoutes.hook(game,'combatFinished',{won,playerDead:q.playerDead},{encIdx:resolvedEncIdx,units:st.units});
};

// Post-victory choice for one defeated named NPC (§3a).
Game.resolveDefeatedNamed = function (game, defeated, choice) {
  const feed = ADV.World.feeder(game.world);
  if (choice === 'conscript' || choice === 'necromancy') Game.adoptBattlefieldNpc(game, defeated);
  const out = ADV.Divine.resolveDefeated(game.world, game.rng, Game.player(game), defeated, choice, feed);
  if (choice === 'necromancy' && defeated && defeated.isUndead && game.quest) {
    game.quest.thralls = game.quest.thralls || [];
    if (game.quest.thralls.indexOf(defeated) < 0) game.quest.thralls.push(defeated);
  }
  return out;
};

// Conscript / raise the whole beaten field in one go. Anyone the art
// cannot take is knocked out so they do not linger at 0 HP.
Game.resolveDefeatedNamedAll = function (game, defeatedList, choice) {
  const batch = (defeatedList || []).filter(d => d && d.alive);
  for (const d of batch) {
    const r = Game.resolveDefeatedNamed(game, d, choice);
    if (r && r.error && (choice === 'conscript' || choice === 'necromancy')) {
      Game.resolveDefeatedNamed(game, d, 'knockout');
    }
  }
  if (choice === 'conscript') return batch.filter(d => d.isConscript);
  if (choice === 'necromancy') return batch.filter(d => d.isUndead);
  return batch;
};

// Only a resolved quest loss earns this advice. Being downed or fleeing while
// the company still wins is not a failure. Meta also carries it past permadeath.
Game.queueQuestFailureAdvice = function (game, q) {
  if (!q || !(q.failed || q.playerDead) || q.failureAdviceQueued) return false;
  q.failureAdviceQueued = true;
  game.meta.questFailureAdvice = { questName: q.quest.name };
  return true;
};

// Complete the quest: payouts, reputation, world tick, ambush queue (§6).
// Decomposed into the success (payout) and failure paths; this function owns
// only the sequencing that runs on EVERY resolution.
// Finisher's +10-all is contract-length, not permanent: walking back through the gate
// sheds it. Death unwinds the same counter in death.js, so the two never double-strip.
function shedFinisherGains(game) {
  for (const ch of (ADV.Game.partyRoster ? ADV.Game.partyRoster(game) : [game.player]).concat([game.player])) {
    if (ch && ch.finisherGains) ADV.Death.stripFinisherGains(ch);
  }
}

Game.completeQuest = function (game) {
  const q = game.quest;
  if(!q)return game.lastOutcome; // a repeated completion callback cannot pay twice
  const p = Game.player(game);
  const world = game.world;
  const out = { gold: 0, wage: 0, leaderTake: null, events: [] };

  Game.queueQuestFailureAdvice(game, q);
  Game.releaseQuestThralls(game);
  shedFinisherGains(game);
  // home again: the quest's survival growth is spent
  for (const ch of Game.partyRoster(game)) if (ch.questHp) { ch.questHp = 0; if (ch.combatHp != null) ch.combatHp = Math.min(ch.combatHp, ADV.Character.maxHp(ch)); }

  if (!q.failed && !q.playerDead) applyQuestSuccess(game, q, out);
  else if (q.failed) applyQuestFailure(game, q, out);

  // shared-quest streak for the vault (§7)
  ADV.Vault.onQuestResolved(world, p, q.partnerAlong && !q.failed);
  if (q.partnerAlong && !q.failed) {
    const partner = ADV.World.byId(world, p.partnerId);
    if (partner) Rel().move(world, partner.id, p.id, C().REL_MOVE.sharedQuestWin, 'quest');
  }

  // the meal was for this quest (request: food lasts one quest)
  if (ADV.Survival) {
    const surv = ADV.Survival.onQuestResolved(game);
    if (surv && surv.autoBought) game.lastAutoBuy = { ok: true, name: surv.autoBought.name, cost: surv.autoBought.cost };
    else if (surv && surv.autoBuyFailed) game.lastAutoBuy = { ok: false, error: surv.autoBuyFailed };
  } else ADV.Character.digest(p);

  // the god line pays on a halving scale and counts its own clears (§7)
  if (!q.failed && !q.playerDead && q.quest.godLine && ADV.Campaign2) {
    const s2 = ADV.Campaign2.state(game);
    out.gold = (out.gold || 0);
    s2.godRuns = (s2.godRuns || 0) + 1;
  }

  // campaign bookkeeping (§3 recruitment gates, §4 progression)
  if (ADV.Campaign) {
    const factionLine = q.quest.campaign && !q.quest.factionRepeatable && !q.quest.war && !q.quest.godLine;
    if (factionLine) { if (!q.failed && !q.playerDead) ADV.Campaign.onCampaignQuestDone(game, q.quest); }
    else ADV.Campaign.onContractComplete(game, q.quest, q.failed || q.playerDead);
  }

  // pregnancy & children for the player household (§7)
  agePlayerChildren(game);
  tickPlayerPregnancy(game);

  // meet everyone fought
  for (const ch of q.defeatedNamed) ADV.World.met(world, ch.id);

  // world advances (§6)
  if (ADV.Courtship) ADV.Courtship.invalidate(world);
  ADV.World.tick(world, game.rng, { playerQuested: true });

  // Payouts default to the vault (§10): auto-deposit above carry comfort
  // (kept manual for the player; NPC payouts bank automatically)
  if (q.travel && q.travel.days > 1) {
    agePlayerChildren(game);
    tickPlayerPregnancy(game);
    ADV.World.tick(world, game.rng, { playerQuested:true });
  }
  if (q.travel) {
    out.travelCost=q.travel.cost;
    out.travelReimbursement=0;
    if (!q.failed && !q.playerDead) {
      const payer=ADV.World.byId(world,q.travel.payerId);
      if (payer && payer.alive) { payer.inventory.gold+=q.travel.cost;out.travelReimbursement=q.travel.cost; }
    }
  }

  // Ambush queue (§6): at most one attempt per quest return, highest hatred first.
  out.ambush = Game.pendingAmbush(game);

  game.quest = null;
  game.lastOutcome = out;
  game.board = ADV.Quests.generateBoard(world, game.rng, game);
  ADV.Save.saveGame(game);
  return out;
};

// Success path (§5/§16): reputation, faction shift, and the payout shaped by
// career stage — hireling wage, leader gross-minus-payroll, or solo payout.
function applyQuestSuccess(game, q, out) {
  const p = Game.player(game);
  const world = game.world;
  const stage = Game.careerStage(game);
  const party = Game.questParty(game, q.quest);
  p.questsCompleted++;
  p.reputation = Math.min(20, p.reputation + C().REP_QUEST_WIN);
  p.rank = 1 + Math.floor(p.questsCompleted / 8);
  ADV.Quests.applyFactionShift(world, p, q.quest);
  let goldMult = ADV.SkillSys.knownProduct(p, 'goldMult') || 1;
  const lawPay = ADV.SkillSys.knownVal(p, 'lawfulPayMult');
  if (lawPay && (q.quest.factionAlignment === 'law' || q.quest.alignment === 'law')) goldMult *= lawPay;
  if (stage === 'hireling' && party) {
    // flat wage; leader pockets the rest — show both (§5)
    const w = p.wage || C().GOLD.hirelingWage;
    out.wage = w * goldMult;
    out.leaderTake = q.quest.payout - w;
    p.inventory.gold += out.wage;
    const leader = ADV.Party.leader(world, party);
    if (leader) leader.inventory.gold += Math.max(0, out.leaderTake);
    Rel().move(world, p.id, party.leaderId, C().REL_MOVE.sharedQuestWin, 'quest');
    applyWageOpinion(world, p.id, party.leaderId, w);
  } else if (stage === 'leader' && party) {
    const pay = ADV.Quests.payout(world, q.quest, p, ADV.Party.members(world, party));
    out.gold = pay.net;
    out.payroll = pay.payroll;
    p.inventory.gold += pay.gross;
    for (const m of ADV.Party.members(world, party)) {
      const w = party.wages[m.id] || 0;
      p.inventory.gold -= w; m.inventory.gold += w;
      Rel().move(world, m.id, p.id, C().REL_MOVE.sharedQuestWin, 'quest');
      applyWageOpinion(world, m.id, p.id, w);
    }
    // payroll can exceed a small contract's gross — the leader eats the loss,
    // but carried gold never goes negative (mirrors the failure path)
    if (p.inventory.gold < 0) p.inventory.gold = 0;
  } else {
    out.gold = q.quest.payout * goldMult;
    p.inventory.gold += out.gold;
  }
  if (ADV.GatePerks) ADV.GatePerks.questBonus(game, q, out);
  // Loot: a hireling gets an equal share of what the field dropped; the
  // leader pockets the rest (request 8 — no more full loot on top of a wage)
  if (stage === 'hireling' && party) {
    const heads = Math.max(1, Game.partyRoster(game).length);
    const share = Math.floor(q.lootGold / heads);
    p.inventory.gold += share;
    const leader = ADV.Party.leader(world, party);
    if (leader) leader.inventory.gold += q.lootGold - share;
    out.loot = share;
  } else {
    p.inventory.gold += q.lootGold;
    out.loot = q.lootGold;
  }
  // shared-quest ledger (courtship rules) for everyone who rode together
  ADV.Courtship.recordShared(world, Game.partyRoster(game).filter(c => !c.isMonster && !c.campaign).map(c => c.id));
  // relationship movement with everyone who fought beside the player
  for (const c of Game.partyRoster(game)) {
    if (c !== p && !c.isMonster) {
      Rel().move(world, c.id, p.id, Math.round(C().REL_MOVE.sharedQuestWin * Rel().socialRate(world, c, p)), 'quest');
      ADV.World.met(world, c.id);
    }
  }
}

// Failure path (§5): rep hit, payroll still owed, hirelings risk firing.
function applyQuestFailure(game, q, out) {
  const p = Game.player(game);
  const world = game.world;
  const stage = Game.careerStage(game);
  const party = Game.questParty(game, q.quest);
  p.questsFailed++;
  p.reputation = Math.max(-20, p.reputation - (q.fled ? C().REP_FLEE : -C().REP_QUEST_FAIL));
  if (stage === 'leader' && party) {
    for (const m of ADV.Party.members(world, party)) {
      const w = party.wages[m.id] || 0;
      p.inventory.gold -= w; m.inventory.gold += w;
      Rel().move(world, m.id, p.id, C().REL_MOVE.sharedQuestFail, 'quest');
    }
    if (p.inventory.gold < 0) p.inventory.gold = 0;
  }
  if (stage === 'hireling' && party && game.rng.chance(0.35)) {
    ADV.Party.removeMember(world, party, p.id);
    p.reputation = Math.max(-20, p.reputation + C().FIRED_AFTER_REP);
    out.fired = true;
  }
}

// A wage's social read (§15): generous buys goodwill, stingy costs it.
function applyWageOpinion(world, workerId, payerId, wage) {
  if (wage >= 60) Rel().move(world, workerId, payerId, C().REL_MOVE.wageGenerous, 'quest');
  else if (wage < C().GOLD.wageAcceptMin) Rel().move(world, workerId, payerId, C().REL_MOVE.wageStingy, 'quest');
}

function agePlayerChildren(game) {
  const p = Game.player(game);
  const world = game.world;
  for (const d of (p.dependents || []).slice()) {
    d.age++;
    if (d.age === C().CHILD_SELF_SUFFICIENT) game.childJustSelfSufficient = true;
    if (d.age >= C().CHILD_ADULT) {
      p.dependents.splice(p.dependents.indexOf(d), 1);
      const npc = ADV.Character.matureChild(game.rng, world, d);
      ADV.World.addCharacter(world, npc);
      ADV.World.met(world, npc.id);
      ADV.World.feed(world, `Your child ${npc.name} has come of age.`, [npc.id]);
    }
  }
  // father's records: player male children live with their mothers (world sim handles them)
}

function tickPlayerPregnancy(game) {
  const p = Game.player(game);
  const world = game.world;
  if (!p.partnerId) return;
  const partner = ADV.World.byId(world, p.partnerId);
  if (!partner || !partner.alive) return;
  p.relationshipQuests = (p.relationshipQuests || 0) + 1;
  const mother = p.sex === 'f' ? p : partner;
  const father = p.sex === 'f' ? partner : p;
  const kids = (mother.dependents || []).length + mother.childIds.length;
  if (kids >= C().MAX_CHILDREN_PER_RELATIONSHIP) return;
  const guaranteed = !mother.conceived && p.relationshipQuests >= C().CONCEPTION_GUARANTEE_AT;
  if (guaranteed || game.rng.chance(C().CONCEPTION_CHANCE)) {
    mother.conceived = true;
    const child = ADV.Character.makeDependent(game.rng, world, mother, father.id);
    mother.dependents = mother.dependents || [];
    mother.dependents.push(child);
    mother.childIds.push(child.id); father.childIds.push(child.id);
    game.newChildFlag = true;
    // Only mothers name children: a female player names hers at birth; a
    // male player's child is named by the NPC mother (rolled at maturity).
    if (mother.isPlayer) game.pendingChildNaming = child;
    ADV.World.feed(world, p.sex === 'f' ? 'You are with child.' : `${mother.name} is with child.`, [mother.id, father.id]);
  }
}

// Highest-hatred living enemy attempts an ambush at quest end (§6).
Game.pendingAmbush = function (game) {
  const world = game.world;
  const p = Game.player(game);
  // heroes hunting the player arrive as ambushes too (§3a)
  const hunt = world.activeHeroes.find(h => h.targetId === p.id);
  if (hunt) {
    const found = ADV.World.byId(world, hunt.heroId);
    const hero = found && found.alive ? found : null;
    if (hero && !hero.isPlayer && game.rng.chance(0.6)) {
      return { kind: 'hero', attacker: hero, powerMult: hunt.powerMultiplier };
    }
  }
  const haters = Rel().hatersOf(world, p.id)
    .map(id => ADV.World.byId(world, id))
    .filter(c => c && c.alive && !c.isMonster && !c.isConscript && !c.isUndead &&
                 c.hospitalizedQuestsLeft <= 0 && c.status !== 'hero');
  if (!haters.length) return null;
  haters.sort((a, b) => Rel().score(world, a.id, p.id) - Rel().score(world, b.id, p.id)); // most negative first
  const attacker = haters[0];
  // patience: not every return draws the attempt
  const drive = 0.25 + attacker.personality.aggression / 300 + (ADV.Vault.wealthOf(world, attacker) > 300 ? 0.1 : 0);
  if (!game.rng.chance(drive)) return null;
  return { kind: 'assassination', attacker };
};

// Build the ambush combat: attacker brings their party (§6).
Game.startAmbush = function (game, ambush) {
  const world = game.world;
  const defenders = Game.partyRoster(game).filter(c => (c.combatHp == null || c.combatHp > 0) && !c.hasFled);
  let attackers;
  if (ambush.kind === 'hero') {
    attackers = ADV.Party.battleRoster(world, ambush.attacker);
  } else {
    attackers = ADV.Party.battleRoster(world, ambush.attacker);
  }
  for (const ch of attackers) { ch.combatHp = ADV.Character.maxHp(ch); }
  const st = ADV.Combat.create(defenders, attackers, {
    rng: game.rng.fork('ambush' + world.questClock),
    context: ambush.kind,
  });
  game.ambushCombat = { st, ambush };
  return st;
};

Game.finishAmbush = function (game) {
  const world = game.world;
  const p = Game.player(game);
  const { st, ambush } = game.ambushCombat;
  ADV.Combat.exportHp(st);
  processMercies(game, st);
  const won = st.winner === 'a';
  const out = { won, attacker: ambush.attacker };
  if (won) {
    ADV.Combat.registerWitnesses(st);
    for (const u of st.units.filter(x => x.side === 'b' && x.downed)) {
      if (u.ch.isMonster) continue;
      if (u.ch === ambush.attacker) {
        out.defeatedNamed = out.defeatedNamed || [];
        out.defeatedNamed.push(u.ch);
      } else {
        out.defeatedNamed = out.defeatedNamed || [];
        out.defeatedNamed.push(u.ch);
      }
    }
    if (ambush.kind === 'hero') {
      // the loser dies — and everyone who helped kill a hero is a Villain (§0b #6)
      ambush.attacker.__killedByParty = Game.partyRoster(game).filter(c => c !== p && !c.isMonster).map(c => c.id);
      ADV.Death.finalize(world, ambush.attacker, p.id, 'killed');
      ADV.World.feed(world, `You struck down the hero ${ambush.attacker.name}. Something stronger is coming.`, [ambush.attacker.id]);
      out.defeatedNamed = (out.defeatedNamed || []).filter(c => c !== ambush.attacker);
    }
  } else {
    const pu = st.units.find(u => u.ch === p);
    if (pu && pu.downed) out.playerDead = true;
  }
  game.ambushCombat = null;
  ADV.Save.saveGame(game);
  return out;
};

// Player-initiated assassination (§6): consumes world time like a quest.
Game.beginAssassination = function (game, targetId) {
  const world = game.world;
  const p = Game.player(game);
  const target = ADV.World.byId(world, targetId);
  if (!target || !target.alive) return { ok: false, error: 'gone' };
  if (!Rel().hates(world, p.id, targetId)) return { ok: false, error: 'you do not hate them' };
  const defenders = ADV.Party.battleRoster(world, target);
  for (const ch of defenders) ch.combatHp = ADV.Character.maxHp(ch);
  const attackers = Game.partyRoster(game);
  for (const ch of attackers) ch.combatHp = ADV.Character.maxHp(ch);
  const st = ADV.Combat.create(attackers, defenders, {
    rng: game.rng.fork('assassinate' + world.questClock), context: 'assassination',
  });
  game.assassination = { st, target };
  return { ok: true, st };
};

Game.finishAssassination = function (game) {
  const world = game.world;
  const p = Game.player(game);
  const { st, target } = game.assassination;
  ADV.Combat.exportHp(st);
  processMercies(game, st);
  const won = st.winner === 'a';
  const out = { won, target };
  if (won) {
    ADV.Combat.registerWitnesses(st);
    out.defeatedNamed = st.units.filter(x => x.side === 'b' && x.downed && !x.ch.isMonster).map(x => x.ch);
  } else {
    const pu = st.units.find(u => u.ch === p);
    if (pu && pu.downed) out.playerDead = true; // a failed attempt kills the attempter (§6)
  }
  // consumes world time exactly as a quest (§6)
  agePlayerChildren(game);
  tickPlayerPregnancy(game);
  ADV.World.tick(world, game.rng, { playerQuested: true });
  game.assassination = null;
  game.board = ADV.Quests.generateBoard(world, game.rng, game);
  ADV.Save.saveGame(game);
  return out;
};

// ---------------------------------------------------------------- rescues
Game.acceptRescue = function (game, rescue) {
  const world = game.world;
  const target = ADV.World.byId(world, rescue.targetId);
  const attacker = ADV.World.byId(world, rescue.attackerId);
  world.pendingRescues = world.pendingRescues.filter(r => r !== rescue);
  if (!target || !target.alive) return { ok: false, error: 'too late' };
  // playable battle (request 9): either the assassin's side, or — for a botched
  // contract — whatever has them cornered out there, rolled to their rank
  const defenders = Game.partyRoster(game).concat(ADV.Party.battleRoster(world, target).filter(c => !defenders_has(c)));
  function defenders_has(c) { return Game.partyRoster(game).includes(c); }
  let attackers;
  if (rescue.kind === 'assassination' && attacker && attacker.alive) attackers = ADV.Party.battleRoster(world, attacker);
  else {
    const rng = game.rng.fork('rescuefoes' + world.questClock);
    const tier = Math.min(3, Math.max(1, target.rank || 1));
    const lv = C().QUEST_TIERS[tier].enemyLevels;
    const types = Object.keys(ADV.DATA.ENEMIES);
    attackers = [];
    const n = rng.int(2, 3);
    for (let i = 0; i < n; i++) attackers.push(ADV.Character.makeEnemy(rng, rng.pick(types), { level: rng.int(lv[0], lv[1]), world }));
  }
  for (const ch of defenders.concat(attackers)) ch.combatHp = ADV.Character.maxHp(ch);
  const st = ADV.Combat.create(defenders, attackers, {
    rng: game.rng.fork('rescue' + world.questClock), context: 'rescue',
  });
  game.rescueCombat = { st, target, attacker: rescue.kind === 'assassination' ? attacker : null };
  return { ok: true, st };
};

Game.finishRescue = function (game) {
  const world = game.world;
  const p = Game.player(game);
  const { st, target, attacker } = game.rescueCombat;
  ADV.Combat.exportHp(st);
  processMercies(game, st);
  const won = st.winner === 'a';
  const out = { won, target, attacker };
  if (won) {
    ADV.Combat.registerWitnesses(st);
    Rel().move(world, target.id, p.id, C().REL_MOVE.rescueSuccess, 'rescue');
    Rel().propagate(world, target.id, p.id, C().REL_MOVE.rescueSuccess, 'rescue');
    if (attacker && attacker.alive && st.units.some(u => u.ch === attacker && u.downed)) {
      out.defeatedNamed = [attacker];
    }
    // the attacker now hates the player — you took a side (§6)
    if (attacker && attacker.alive) Rel().move(world, attacker.id, p.id, -100, 'murder', { set: true, decays: false });
    ADV.World.feed(world, attacker ? `You stood with ${target.name} against ${attacker.name}.` : `You cut ${target.name} out of a bad spot and brought ${target.sex === 'f' ? 'her' : 'him'} home.`, [target.id].concat(attacker ? [attacker.id] : []));
  } else {
    const pu = st.units.find(u => u.ch === p);
    if (pu && pu.downed) out.playerDead = true;
    else {
      ADV.Death.finalize(world, target, attacker ? attacker.id : null, 'assassinated');
      ADV.World.feed(world, attacker ? `${attacker.name} killed ${target.name}. You could not stop it.` : `${target.name} did not make it home. You could not stop it.`, [target.id].concat(attacker ? [attacker.id] : []));
    }
  }
  // accepting consumed world time (§6)
  ADV.World.tick(world, game.rng, { playerQuested: true });
  game.rescueCombat = null;
  game.board = ADV.Quests.generateBoard(world, game.rng, game);
  ADV.Save.saveGame(game);
  return out;
};

// Refusing is silent and permanent (§6) — but scored (§15).
Game.refuseRescue = function (game, rescue) {
  const world = game.world;
  world.pendingRescues = world.pendingRescues.filter(r => r !== rescue);
  Rel().move(world, rescue.targetId, world.playerId, C().REL_MOVE.rescueRefused, 'rescue');
  ADV.World.resolveRescueAbstract(world, game.rng, rescue, ADV.World.feeder(world));
  ADV.Save.saveGame(game);
};

// ---------------------------------------------------------------- death
// Returns {mode, heir?} — UI shows the death screen then calls continueAs*.
Game.onPlayerDeath = function (game, killerId) {
  // Fatal quest losses bypass completeQuest; road ambushes and other deaths do not qualify.
  if (game.quest && game.quest.playerDead) Game.queueQuestFailureAdvice(game, game.quest);
  game.travelResolution = null;
  const world = game.world;
  const p = Game.player(game);
  const extracted = ADV.Death.extractMeta(p);
  game.meta.journal = Object.assign({}, game.meta.journal, p.journal);
  game.meta.skillLevels = extracted.skillLevels;
  game.meta.lastLifeSkills = extracted.lastLifeSkills;
  const route = ADV.Death.routePlayerDeath(world, p, killerId);
  ADV.Death.finalize(world, p, killerId, 'killed');
  ADV.World.feed(world, 'You died.', [p.id]);
  game.pendingDeath = { route, killerId };
  ADV.Save.saveMeta(game);
  return route;
};

Game.continueAfterDeath = function (game, opts) {
  const route = game.pendingDeath.route;
  if (route.mode === 'nepotism') {
    const heir = ADV.Death.makeSuccessor(game.world, game.rng, Game.deadPlayerRecord(game), route);
    game.player = heir;
    ADV.Death.applyMeta(heir, game.meta);
    heir.perkCap = C().PLAYER_PERK_SLOTS; heir.activeCap = C().PLAYER_ACTIVE_SLOTS;
    game.pendingDeath = null;
    if (ADV.Campaign) ADV.Campaign.reset(game);   // the heir is uncontacted (§3)
    if (ADV.GatePerks) ADV.GatePerks.reconcile(game);
    game.board = ADV.Quests.generateBoard(game.world, game.rng, game);
    ADV.Save.saveGame(game);
    return { mode: 'nepotism', player: heir };
  }
  // Reincarnation: fresh world, journal & levels persist through adv:meta (§7/§19)
  const newOpts = Object.assign({ seed: (game.world.seed + 1) >>> 0 }, opts || {});
  const g2 = Game.newGame(newOpts);
  Object.assign(game, g2);
  return { mode: 'reincarnation', player: Game.player(game) };
};

Game.deadPlayerRecord = function (game) {
  return game.world.characters.find(c => c.isPlayer && !c.alive) || game.player;
};

ADV.Game = Game;
})();
