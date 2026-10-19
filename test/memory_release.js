'use strict';
// The memory trim frees other locations' images and never the current quest's,
// Hiro's or unknown keys. (The physics checks went with the engine, 2026-10-19.)
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const H = require('./harness.js'), A = H.load(), ROOT = path.join(__dirname, '..');
for (const f of ['data', 'shim', 'encounter', 'campaign', 'run', 'battle_stage', 'travel_art', 'memory'])
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/expedition/' + f + '.js'), 'utf8'), { filename: f + '.js' });
const X = A.Expedition, M = X.Memory;
globalThis.localStorage = H.memBackend();
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok ' + name); };

const keepFor = (questId, sceneKey) => {
  const run = X.Run.fresh(); run.questId = questId; run.wave = 0; run.questsDone = ['road']; X.Campaign.sanitizeRun(run);
  X.Painted = { needed: () => ['hiro'] };
  return M.keepFor({ sys: { settings: { key: sceneKey } }, opts: { run } });
};
const KEYS = ['__DEFAULT', 'xp_hiro_sheet', 'xp_hiro_face', 'xp_hiro_skill_icons', 'xp_wolf_sheet', 'xp_plant_sheet', 'xp_alpha_sheet', 'xp_crab_sheet', 'xp_hydra_sheet',
  'xp_wolf_fatal', 'xp_crab_fatal', 'travel_forest-carriage-vault_far', 'travel_coast-mast-vault_far', 'travel_coast-mast-vault_ground', 'xp_battle_mountain_far',
  'travel_forest-carriage-vault_plate', 'travel_coast-mast-vault_plate', 'travel_coast-mast-vault_actions', 'defeat_city', 'xp_inn-hiro-solo', 'xp_bust_bram', 'story_bg'];
const INN = new Set(['xp_inn-hiro-solo']);

test('in a Coast fight, the forest is freed and the Coast is kept', () => {
  const gone = new Set(M.releasable(KEYS, keepFor('coast', 'Expedition'), INN));
  for (const k of ['xp_wolf_sheet', 'xp_plant_sheet', 'xp_alpha_sheet', 'xp_wolf_fatal', 'travel_forest-carriage-vault_far', 'xp_battle_mountain_far', 'travel_forest-carriage-vault_plate', 'defeat_city', 'xp_inn-hiro-solo'])
    assert.ok(gone.has(k), k + ' freed');
  for (const k of ['__DEFAULT', 'xp_hiro_sheet', 'xp_hiro_face', 'xp_hiro_skill_icons', 'xp_crab_sheet', 'xp_hydra_sheet', 'xp_crab_fatal', 'travel_coast-mast-vault_far', 'travel_coast-mast-vault_ground', 'travel_coast-mast-vault_plate', 'travel_coast-mast-vault_actions', 'xp_bust_bram', 'story_bg'])
    assert.ok(!gone.has(k), k + ' kept');
});
test('in the forest, its own monsters, stages and travel stay loaded', () => {
  const gone = new Set(M.releasable(KEYS, keepFor('rain', 'Travel'), INN));
  for (const k of ['xp_wolf_sheet', 'xp_plant_sheet', 'xp_alpha_sheet', 'xp_wolf_fatal', 'travel_forest-carriage-vault_far', 'xp_battle_mountain_far', 'travel_forest-carriage-vault_plate'])
    assert.ok(!gone.has(k), k + ' kept');
  assert.ok(gone.has('xp_crab_sheet') && gone.has('travel_coast-mast-vault_far'));
});
test('at the inn, every location is freed but the inn paintings stay', () => {
  const gone = new Set(M.releasable(KEYS, keepFor('coast', 'Inn'), INN));
  assert.ok(gone.has('xp_crab_sheet') && gone.has('travel_coast-mast-vault_plate') && gone.has('travel_coast-mast-vault_far'));
  assert.ok(!gone.has('xp_inn-hiro-solo') && !gone.has('xp_hiro_sheet'));
});
test('a later playthrough keeps every shuffled monster the quest can field', () => {
  const run = X.Run.fresh(); run.questId = 'marsh'; run.seed = 11; run.questsDone = ['road', 'rain', 'marsh', 'city', 'coast', 'citadel']; X.Campaign.sanitizeRun(run);
  const keep = M.keepFor({ sys: { settings: { key: 'Expedition' } }, opts: { run } });
  for (const e of X.Campaign.questEncounters(X.Campaign.quest('marsh'), run)) for (const k of e.enemies) assert.ok(keep.actors.has(X.paintedActorOfKey(k)), k + ' kept');
});
console.log('memory_release: ' + passed + ' checks passed');
