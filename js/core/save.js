// Save facade: coherent snapshots in SaveStore's two-slot commit journal.
// Meta survives permadeath; failed writes report a recoverable UI error.
(function () {
'use strict';

const Save = {};
Save.VERSION = 2;

// Services are injectable per game, so previews never replace production APIs.
let store = null, journal = null;
const sessions = new WeakMap(), watchers = new Set();
Save.lastResult = { ok: true };
Save.lastGame = null;
function backend() {
  if (store) return store;
  if (typeof window !== 'undefined') {
    try { return window.localStorage; } catch (_) {
      return { getItem(){throw new Error('Storage unavailable');}, setItem(){throw new Error('Storage unavailable');}, removeItem(){throw new Error('Storage unavailable');} };
    }
  }
  store = { _m:{},getItem(k){return this._m[k]||null;},setItem(k,v){this._m[k]=String(v);},removeItem(k){delete this._m[k];} };
  return store;
}
function service() { return journal || (journal=ADV.SaveStore.create(backend(),Save.VERSION)); }
Save.setBackend = function(b) {store=b;journal=null;Save.lastGame=null;};
Save.bind = function(game,storage) {sessions.set(game,ADV.SaveStore.create(storage,Save.VERSION));};
Save.memoryBackend = function() {return {_m:{},getItem(k){return this._m[k]||null;},setItem(k,v){this._m[k]=String(v);},removeItem(k){delete this._m[k];}};};
Save.watch = function(fn) {watchers.add(fn);return ()=>watchers.delete(fn);};
function report(result,game) {
  if(game && sessions.has(game))return result;
  Save.lastResult=result;if(game)Save.lastGame=game;
  for(const fn of watchers)try{fn(result);}catch(_){}
  return result;
}
Save.ensureCompatible = function() {return service().compatible();};

// Write once per quest resolution and on town transactions (§19).
Save.capture = function (game) {
  const w = game.world;
  const world = {
    artVersion: Save.VERSION,
    seed: w.seed, questClock: w.questClock, populationVersion: w.populationVersion || 0,
    eventFeed: w.eventFeed, activeHeroes: w.activeHeroes,
    pendingRescues: w.pendingRescues, pendingPopulation: w.pendingPopulation,
    orphans: w.orphans, divineOffers: w.divineOffers,
    pendingHeroInvites: w.pendingHeroInvites, pendingPlayerJilt: w.pendingPlayerJilt,
    pendingLeaderDeath: w.pendingLeaderDeath || null,
    playerId: w.playerId, metIds: w.metIds,
    parties: w.parties, campaignWorld: w.campaignWorld || null, mawContracts: w.mawContracts || [], pendingRaises: w.pendingRaises || [], hiroId: w.hiroId || null,
    sharedQuests: w.sharedQuests || {}, pendingProposals: w.pendingProposals || [], cooldowns: w.cooldowns || {},
    lastPlayerHelpAt: w.lastPlayerHelpAt, lastPlayerProposalAt: w.lastPlayerProposalAt, lastRivalAt: w.lastRivalAt,
    lastRivalOuting: w.lastRivalOuting != null ? w.lastRivalOuting : null,
    travelSpoke: w.travelSpoke || [],
    friendlyAskWait: w.friendlyAskWait || 0,
    board: game.board, life: game.life, campaign: game.campaign || null, campaign2: game.campaign2 || null, tutorial: game.tutorial || null,
    campaignProgress: w.campaignProgress || [],
    rng: game.rng?.snapshot ? game.rng.snapshot() : null,
  };
  return { world, characters:w.characters, edges:w.edges||[], vaults:w.vaults||[], meta:Object.assign({},game.meta,{artVersion:Save.VERSION}) };
};
Save.saveGame = function(game) {
  try {return report((sessions.get(game)||service()).write(Save.capture(game)),game);}
  catch(e){return report({ok:false,error:'invalid-save',detail:e.message},game);}
};
// A complete committed snapshot already contains its own previous revision.
Save.writeBackup = function() {return !!service().read();};
Save.restoreBackup = function() {return report(service().restore()).ok;};
Save.saveMeta = function(game) {
  if(game.world)return Save.saveGame(game);
  const target=sessions.get(game)||service();
  const payload=target.read()||{world:null};
  payload.meta=Object.assign({},game.meta,{artVersion:Save.VERSION});
  return report(target.write(payload),game);
};
Save.loadMeta = function() {
  Save.ensureCompatible();
  return service().read()?.meta || {journal:{},skillLevels:{},promptsSeen:{},codexUnlocked:[],hiroUnlocked:false,lives:0};
};
Save.exportGame = function(game) {const p=game?Save.capture(game):service().read();return p?JSON.stringify(p,null,2):service().rawExport();};
Save.exportRaw = function() {return service().rawExport();};
Save.importGame = function(text) {
  try {const p=JSON.parse(text);if(!service().valid(p))return {ok:false,error:'invalid-save'};return report(service().write(p));}
  catch(_){return {ok:false,error:'invalid-save'};}
};

Save.loadGame = function () {
  Save.ensureCompatible();
  const payload=service().read();
  if(!payload || !payload.world){if(!payload&&service().diagnostics().hasJournal)report({ok:false,error:'corrupt-save'});return null;}
  const ws=payload.world,characters=payload.characters,edges=payload.edges,vaults=payload.vaults;
  const world = {
    seed: ws.seed, questClock: ws.questClock, populationVersion: ws.populationVersion || 0,
    characters, edges, vaults,
    parties: ws.parties || [],
    eventFeed: ws.eventFeed || [], activeHeroes: ws.activeHeroes || [],
    pendingRescues: ws.pendingRescues || [], pendingPopulation: ws.pendingPopulation || [],
    orphans: ws.orphans || [], divineOffers: ws.divineOffers || [],
    pendingHeroInvites: ws.pendingHeroInvites || [], pendingPlayerJilt: ws.pendingPlayerJilt || null,
    pendingLeaderDeath: ws.pendingLeaderDeath || null,
    playerId: ws.playerId, metIds: ws.metIds || [],
    campaignWorld: ws.campaignWorld || null, campaignProgress: ws.campaignProgress || [], mawContracts: ws.mawContracts || [], pendingRaises: ws.pendingRaises || [], hiroId: ws.hiroId || null,
    sharedQuests: ws.sharedQuests || {}, pendingProposals: ws.pendingProposals || [], cooldowns: ws.cooldowns || {},
    lastPlayerHelpAt: ws.lastPlayerHelpAt != null ? ws.lastPlayerHelpAt : -99,
    lastPlayerProposalAt: ws.lastPlayerProposalAt != null ? ws.lastPlayerProposalAt : -99,
    lastRivalAt: ws.lastRivalAt != null ? ws.lastRivalAt : -99,
    lastRivalOuting: ws.lastRivalOuting != null ? ws.lastRivalOuting : null,
    travelSpoke: ws.travelSpoke || [],
    friendlyAskWait: ws.friendlyAskWait || 0,
  };
  const loaded = { world, board: ws.board || null, life: ws.life || 1, meta: payload.meta, rng: ws.rng || null, campaign: ws.campaign || null, campaign2: ws.campaign2 || null, tutorial: ws.tutorial || null };
  if (ADV.Character.syncIds) ADV.Character.syncIds(world,true);
  if (ADV.Vault.syncIds) ADV.Vault.syncIds(world);
  if (ADV.Survival) {
    for (const c of characters) {
      if (c && c.isPlayer) ADV.Survival.state(c);
    }
  }
  if (ADV.Party && ADV.Party.repairWorld) ADV.Party.repairWorld(world);
  else if (ADV.Party && ADV.Party.syncIds) ADV.Party.syncIds(world);
  if (ADV.World && ADV.World.pruneStrangerContacts) ADV.World.pruneStrangerContacts(world);
  Save.identityWarnings=ADV.World.duplicateIds?ADV.World.duplicateIds(world):[];
  return loaded;
};

Save.hasSave = function () { Save.ensureCompatible(); return !!service().read()?.world; };

Save.peekPlayer = function () {
  try {
    const data = Save.loadGame();
    if (!data || !data.world) return null;
    return ADV.World && ADV.World.byId
      ? ADV.World.byId(data.world, data.world.playerId)
      : (data.world.characters || []).find(c => c && c.id === data.world.playerId) || null;
  } catch (e) {
    return null;
  }
};

// Continue is only real if the full save loads and the player is still alive.
// A leftover world key must not offer a dead Continue. Voice is assigned at
// creation or once on town arrival; it is not a Continue gate.
Save.hasValidContinue = function () {
  const player = Save.peekPlayer();
  return !!(player && player.alive);
};

Save.hasVoicedContinue = function () {
  const player = Save.peekPlayer();
  return !!(player && player.alive && player.personalityId);
};

Save.reset = function () { return report(service().reset()); };

ADV.Save = Save;
})();
