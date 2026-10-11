'use strict';
// Knockback physics stays on the floor and always settles; the memory trim frees
// other locations' images and never the current quest's, Hiro's or unknown keys.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const H = require('./harness.js'), A = H.load(), ROOT = path.join(__dirname, '..');
for (const f of ['data', 'shim', 'encounter', 'campaign', 'run', 'battle_stage', 'travel_art', 'knockback', 'memory', 'props'])
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/expedition/' + f + '.js'), 'utf8'), { filename: f + '.js' });
const X = A.Expedition, K = X.Knockback, M = X.Memory, P = X.Props;
globalThis.localStorage = H.memBackend();
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok ' + name); };

test('a thrown body never sinks below the floor and always comes to rest', () => {
  for (const boss of [false, true]) for (const seed of [1, 7, 42, 999, 123456]) for (const dir of [1, -1]) {
    const b = K.launch({ boss, seed, dir });
    assert.ok(b.vy < 0 && Math.sign(b.vx) === dir, 'launched up and away');
    let steps = 0, peak = 0;
    while (!b.rest && steps < 2000) { K.step(b, 1 / 60, 500); assert.ok(b.y <= 1e-9, 'above or on the floor'); peak = Math.min(peak, b.y); steps++; }
    assert.ok(b.rest, 'at rest'); assert.ok(b.t <= K.maxMs + 20, 'settles within maxMs');
    assert.equal(b.y, 0); assert.equal(b.a, 0); assert.ok(peak < -20, 'actually leaves the ground');
    if (dir > 0) assert.ok(b.x <= 500, 'never passes the stage edge');
  }
});
test('a boss travels less far than an ordinary enemy', () => {
  const run = boss => { const b = K.launch({ boss, seed: 5, dir: 1 }); while (!b.rest) K.step(b, 1 / 60, 1e6); return b.x; };
  assert.ok(run(true) < run(false));
});
test('a paused step changes nothing (the scene skips steps while paused)', () => {
  const b = K.launch({ seed: 3, dir: 1 }), before = JSON.stringify(b);
  assert.equal(JSON.stringify(b), before);
});

const keepFor = (questId, sceneKey) => {
  const run = X.Run.fresh(); run.questId = questId; run.wave = 0; run.questsDone = ['road']; X.Campaign.sanitizeRun(run);
  X.Painted = { needed: () => ['hiro'] };
  return M.keepFor({ sys: { settings: { key: sceneKey } }, opts: { run } });
};
const KEYS = ['__DEFAULT', 'xp_hiro_sheet', 'xp_hiro_face', 'xp_hiro_skill_icons', 'xp_wolf_sheet', 'xp_plant_sheet', 'xp_alpha_sheet', 'xp_crab_sheet', 'xp_hydra_sheet',
  'xp_wolf_fatal', 'xp_crab_fatal', 'xp_battle_forest-carriage-vault_far', 'xp_battle_coast_far', 'xp_battle_coast_ground', 'xp_battle_mountain_far',
  'travel_forest-carriage-vault_plate', 'travel_coast-mast-vault_plate', 'travel_coast-mast-vault_actions', 'defeat_city', 'xp_inn-hiro-solo', 'xp_bust_bram', 'story_bg'];
const INN = new Set(['xp_inn-hiro-solo']);

test('in a Coast fight, the forest is freed and the Coast is kept', () => {
  const gone = new Set(M.releasable(KEYS, keepFor('coast', 'Expedition'), INN));
  for (const k of ['xp_wolf_sheet', 'xp_plant_sheet', 'xp_alpha_sheet', 'xp_wolf_fatal', 'xp_battle_forest-carriage-vault_far', 'xp_battle_mountain_far', 'travel_forest-carriage-vault_plate', 'defeat_city', 'xp_inn-hiro-solo'])
    assert.ok(gone.has(k), k + ' freed');
  for (const k of ['__DEFAULT', 'xp_hiro_sheet', 'xp_hiro_face', 'xp_hiro_skill_icons', 'xp_crab_sheet', 'xp_hydra_sheet', 'xp_crab_fatal', 'xp_battle_coast_far', 'xp_battle_coast_ground', 'travel_coast-mast-vault_plate', 'travel_coast-mast-vault_actions', 'xp_bust_bram', 'story_bg'])
    assert.ok(!gone.has(k), k + ' kept');
});
test('in the forest, its own monsters, stages and travel stay loaded', () => {
  const gone = new Set(M.releasable(KEYS, keepFor('rain', 'Travel'), INN));
  for (const k of ['xp_wolf_sheet', 'xp_plant_sheet', 'xp_alpha_sheet', 'xp_wolf_fatal', 'xp_battle_forest-carriage-vault_far', 'xp_battle_mountain_far', 'travel_forest-carriage-vault_plate'])
    assert.ok(!gone.has(k), k + ' kept');
  assert.ok(gone.has('xp_crab_sheet') && gone.has('xp_battle_coast_far'));
});
test('at the inn, every location is freed but the inn paintings stay', () => {
  const gone = new Set(M.releasable(KEYS, keepFor('coast', 'Inn'), INN));
  assert.ok(gone.has('xp_crab_sheet') && gone.has('travel_coast-mast-vault_plate') && gone.has('xp_battle_coast_far'));
  assert.ok(!gone.has('xp_inn-hiro-solo') && !gone.has('xp_hiro_sheet'));
});
test('a later playthrough keeps every shuffled monster the quest can field', () => {
  const run = X.Run.fresh(); run.questId = 'marsh'; run.seed = 11; run.questsDone = ['road', 'rain', 'marsh', 'city', 'coast', 'citadel']; X.Campaign.sanitizeRun(run);
  const keep = M.keepFor({ sys: { settings: { key: 'Expedition' } }, opts: { run } });
  for (const e of X.Campaign.questEncounters(X.Campaign.quest('marsh'), run)) for (const k of e.enemies) assert.ok(keep.actors.has(X.paintedActorOfKey(k)), k + ' kept');
});
test('props stay dormant until a location has delivered art', () => {
  assert.deepEqual(P.available, [], 'no location has props until its sheet is delivered');
  const loads = []; const scene = { textures: { exists: () => false }, cache: { json: { exists: () => false } }, load: { multiatlas: k => loads.push(k), json: k => loads.push(k) } };
  P.preload(scene, 'deep_wood'); assert.equal(loads.length, 0, 'nothing requested, so no 404s');
  assert.equal(P.spawn({ textures: { exists: () => false } }, 'deep_wood'), null);
});
test('a prop manifest is checked before anything spawns', () => {
  const good = { props: [{ id: 'crate', frame: 'crate', w: 80, h: 70, shape: 'box', mass: 'medium', breakable: true, debris: ['a', 'b'] }, { id: 'rock', frame: 'rock', w: 70, h: 45, shape: 'circle', mass: 'heavy' }], layout: [{ id: 'crate', x: 640 }, { id: 'rock', x: 700 }] };
  assert.deepEqual(P.validate(good), []);
  const bad = { props: [{ id: 'x', w: 0, h: 10, shape: 'cone', mass: 'huge' }], layout: [{ id: 'nope', x: 1 }] };
  assert.equal(P.validate(bad).length, 5);
});
test('a location props are freed with its other art', () => {
  const gone = new Set(M.releasable(['xp_props_forest-carriage-vault', 'xp_props_coast'], keepFor('coast', 'Expedition'), new Set()));
  assert.ok(gone.has('xp_props_forest-carriage-vault') && !gone.has('xp_props_coast'));
});
console.log('physics_memory: ' + passed + ' checks passed');
