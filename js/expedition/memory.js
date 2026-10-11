// Image memory between locations (2026-10-10). Phaser keeps every texture it
// ever loaded until something removes it, and nothing did: after one lap of the
// five locations the game held ~147 textures, ~1.1 GB of decoded images. Each
// arcade scene now calls Memory.trim() at the start of preload: it keeps Hiro,
// the HUD and everything the current quest can use (its monsters on every wave,
// their defeat art, its battle stages and travel scenes), and frees the rest.
// A freed image reloads from the browser cache if the player comes back.
// Only arcade texture families are touched; anything else is left alone.
(function () {
'use strict';
const A = ADV, X = A.Expedition, M = X.Memory = {};

M.keepFor = function (scene) {
  const sceneKey = scene && scene.sys && scene.sys.settings && scene.sys.settings.key;
  let run = scene && scene.opts && scene.opts.run;
  if (!run) { try { run = X.Run.load(); } catch (e) { run = null; } }
  const keep = { actors: new Set(['hiro']), stages: new Set(), travel: new Set(), inn: sceneKey === 'Inn', city: false };
  try { for (const id of (X.Painted && X.Painted.needed ? X.Painted.needed(scene) : [])) keep.actors.add(id); } catch (e) {}
  if (!run || sceneKey === 'Inn' || sceneKey === 'End') return keep;
  const q = X.Campaign.quest(run.questId);
  if (!q) return keep;
  for (const e of X.Campaign.questEncounters(q, run)) {
    for (const k of (e.enemies || [])) keep.actors.add(X.paintedActorOfKey(k));
    if (e.bg) keep.stages.add(e.bg);
  }
  keep.city = q.id === 'city';
  if (X.TravelArt && X.TravelArt.select) {
    for (const leg of ['outbound', 'midleg', 'return']) keep.travel.add(X.TravelArt.select(run, leg));
    keep.travel.add(X.TravelArt.select(Object.assign({}, run, { wave: 2 }), 'midleg'));   // the city swaps scenes after wave two
  }
  return keep;
};

// Which texture keys this scene may free. Pure, so it can be tested headless.
M.releasable = function (keys, keep, innKeys) {
  const sets = (X.BattleStage && X.BattleStage.sets) || {};
  const keepSets = new Set([...keep.stages].map(bg => sets[bg]).filter(Boolean));
  const actors = new Set(['bram', 'wolf', 'plant', 'alpha', 'boar', ...(X.monsterActors || [])]);
  const out = [];
  for (const key of keys) {
    let m;
    if ((m = /^xp_(.+)_sheet$/.exec(key)) && actors.has(m[1]) && !keep.actors.has(m[1])) out.push(key);
    else if ((m = /^xp_(.+)_fatal$/.exec(key)) && !keep.actors.has(m[1])) out.push(key);
    else if (key === 'xp_battle_mountain_far') { if (!keep.stages.has('mountain')) out.push(key); }
    else if ((m = /^xp_battle_(.+)_(far|ground|near)$/.exec(key)) && !keepSets.has(m[1])) out.push(key);
    else if ((m = /^travel_(.+)_(plate|actions|far|ground|near|loops)$/.exec(key)) && !keep.travel.has(m[1])) out.push(key);
    else if ((m = /^xp_props_(.+)$/.exec(key)) && !keepSets.has(m[1])) out.push(key);
    else if (key === 'defeat_city' && !keep.city) out.push(key);
    else if (!keep.inn && innKeys.has(key)) out.push(key);
  }
  return out;
};

M.trim = function (scene) {
  if (!scene || !scene.textures || !scene.textures.getTextureKeys) return [];
  let keep;
  try { keep = M.keepFor(scene); } catch (e) { return []; }   // never block a scene over housekeeping
  const inn = scene.cache.json.get('xp_inn_manifest');
  const innKeys = new Set(inn ? [...Object.keys(inn.backgrounds || {}), ...Object.keys(inn.effects || {})].map(id => 'xp_' + id) : []);
  const gone = M.releasable(scene.textures.getTextureKeys(), keep, innKeys);
  if (!gone.length) return gone;
  // Cached animations hold the old frames; drop them so they are rebuilt on reload.
  const doomed = new Set(gone), anims = [];
  scene.anims.anims.each((key, anim) => { if (anim.frames.some(f => doomed.has(f.textureKey))) anims.push(key); });
  for (const key of anims) scene.anims.remove(key);
  for (const key of gone) scene.textures.remove(key);
  M.last = { scene: scene.sys.settings.key, released: gone.length, anims: anims.length };
  return gone;
};
})();
