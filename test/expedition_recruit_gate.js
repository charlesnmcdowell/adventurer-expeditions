'use strict';
// Recruitment is a content gate, not just an inn button state. Cover direct
// calls, stale saves, missing atlas frames, and the simulation party boundary.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const H = require('./harness.js'), A = H.load(), root = path.join(__dirname, '..');
for (const f of ['data', 'shim', 'encounter', 'campaign', 'run']) vm.runInThisContext(fs.readFileSync(path.join(root, 'js/expedition/' + f + '.js'), 'utf8'), { filename: f });
const X = A.Expedition, Camp = X.Campaign;
globalThis.localStorage = H.memBackend();
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok ' + name); }
const complete = { clips: Object.fromEntries(Camp.recruitArt.bram.clips.map(id => [id, { frames: [id + '/0', id + '/1'] }])) };
const ready = () => Camp.registerRecruitArt('bram', complete, () => true);

test('only five approved identities and permanent Hiro', () => {
  assert.deepEqual(X.recruits.map(d => d.key), ['bram', 'nyx', 'sable', 'aera', 'ren']);
  assert.equal(X.hero.registryId, 'hiro');
  const run = X.Run.fresh(); run.gold = 999;
  assert.equal(Camp.canBuy(run, 'stranger'), false);
  assert.equal(Camp.buy(run, 'stranger').reason, 'unknown');
  for (const key of ['bram', 'nyx', 'sable', 'aera', 'ren']) assert.equal(Camp.canBuy(run, key), false);
});
test('full clip coverage and actual loaded frames are required', () => {
  const incomplete = JSON.parse(JSON.stringify(complete)); delete incomplete.clips.roll;
  assert.equal(Camp.registerRecruitArt('bram', incomplete, () => true), false);
  assert.equal(Camp.registerRecruitArt('bram', complete, f => f !== 'victory/1'), false);
  const stills = JSON.parse(JSON.stringify(complete)); stills.clips.walk.frames = ['walk/0', 'walk/0'];
  assert.equal(Camp.registerRecruitArt('bram', stills, () => true), false);
  assert.equal(Camp.registerRecruitArt('nyx', complete, () => true), false, 'unreviewed art cannot be enabled by a matching filename');
  assert.equal(ready(), true);
});
test('tutorial recruitment lock applies to direct calls without spending gold', () => {
  const run = X.Run.fresh(); run.gold = 150;
  ready(); assert.equal(X.slice.firstLevelOnly, true);
  assert.equal(Camp.canBuy(run, 'bram'), false);
  assert.equal(Camp.buy(run, 'bram').reason, 'slice locked');
  // While the slice is locked that is the refusal for everyone; an unpainted
  // recruit's own 'art unavailable' is asserted below, with the lock lifted.
  assert.equal(Camp.buy(run, 'nyx').reason, 'slice locked');
  assert.equal(run.gold, 150); assert.deepEqual(run.roster, []); assert.deepEqual(run.field, []);
});
test('Bram purchase and fielding enforce readiness when recruitment is explicitly enabled', () => {
  const run = X.Run.fresh(); run.gold = 150;
  const locked = X.slice.firstLevelOnly; X.slice.firstLevelOnly = false;
  // Bram's atlas is out of the package while the inn is locked (2026-09-21), and
  // a recruit whose art the build lacks is refused even with the lock lifted —
  // asserted first, then put back so the readiness mechanics stay covered.
  assert.equal(Camp.buy(X.Run.fresh(), 'bram').reason, 'art unavailable', 'unshipped art is refused whatever the lock says');
  const savedShipped = X.shipped;
  X.shipped = Object.assign({}, X.shipped, { actors: (X.shipped.actors || []).concat('bram') });
  try {
    assert.equal(Camp.buy(run, 'nyx').reason, 'art unavailable'); assert.equal(run.gold, 150);
    assert.equal(Camp.buy(run, 'bram').ok, true); assert.equal(run.gold, 90);
    assert.deepEqual(run.roster, ['bram']); assert.deepEqual(run.field, ['bram']);
    assert.equal(Camp.buy(run, 'bram').reason, 'owned');
    assert.equal(Camp.toggleField(run, 'bram').fielded, false);
    Camp.registerRecruitArt('bram', null, () => true);
    assert.equal(Camp.toggleField(run, 'bram').reason, 'art unavailable');
    ready(); assert.equal(Camp.toggleField(run, 'bram').fielded, true);
  } finally { X.slice.firstLevelOnly = locked; X.shipped = savedShipped; }
});
test('legacy roster cannot smuggle unapproved or unpainted actors into combat', () => {
  const run = X.Run.fresh();
  run.hero = 'nyx'; run.roster = ['stranger', 'nyx', 'bram', 'bram']; run.field = ['stranger', 'nyx', 'bram', 'bram'];
  run.rel.stranger = { hiro: 50 }; run.rel.hiro = { stranger: 20, bram: 10 };
  assert.equal(X.Run.save(run).ok, true); const saved = X.Run.load();
  assert.ok(saved, 'a valid save reloads rather than being silently discarded');
  assert.deepEqual(saved.roster, ['nyx', 'bram'], 'retain legitimate paid ownership');
  assert.deepEqual(saved.field, ['bram']); assert.equal(saved.hero, undefined);
  assert.equal(saved.rel.stranger, undefined); assert.equal(saved.rel.hiro.stranger, undefined);
  // What follows is about sanitation and art loading, not about what the package
  // ships, so field Bram under an X.shipped that carries him.
  const savedShipped = X.shipped;
  X.shipped = Object.assign({}, X.shipped, { actors: (X.shipped.actors || []).concat('bram') });
  try {
    const world = Camp.buildWorld(saved);
    try { assert.equal(world.hero.name, 'Hiro'); assert.deepEqual(world.companions.map(c => c.companionKey), ['bram']); } finally { world.restoreIds(); }
    Camp.registerRecruitArt('bram', null, () => true);
    const missing = Camp.buildWorld(saved);
    try { assert.equal(missing.companions.length, 0, 'failed art load cannot field a placeholder'); } finally { missing.restoreIds(); }
    // And with the art out of the build entirely, he cannot be fielded at all.
    X.shipped = Object.assign({}, X.shipped, { actors: (X.shipped.actors || []).filter(id => id !== 'bram') });
    const unshipped = Camp.buildWorld(saved);
    try { assert.equal(unshipped.companions.length, 0, 'art outside the package cannot be fielded'); } finally { unshipped.restoreIds(); }
  } finally { X.shipped = savedShipped; }
  ready();
});
test('save reload preserves locked skills and all existing quest identities', () => {
  const run = X.Run.fresh(); X.Run.save(run); const saved = X.Run.load();
  assert.equal(saved.levels.katana_slash, 1);
  for (const key of X.purchasable) assert.equal(saved.levels[key], 0);
  assert.deepEqual(X.quests.map(q => q.id), ['road', 'rain', 'city', 'marsh', 'ruins']);
  assert.equal(X.enemies.cutthroat.human.sex, 'm'); assert.equal(X.enemies.hedge_mage.human.set, 'adept');
  assert.deepEqual(Camp.questEncounters('road').flatMap(enc => enc.enemies).map(id => X.enemies[id].kind), ['wolf', 'wolf', 'wolf', 'plant', 'plant', 'boss'], 'tutorial uses the dedicated Alpha boss on the final board');
  assert.equal(X.enemies.road_wolf_leader.artActor, 'alpha');
  assert.equal(X.enemies.road_wolf_leader.artIdentity, 'tutorial-alpha');
});
test('legacy saves cannot reopen later quests or replace Hiro, but keep earned progress', () => {
  const run = X.Run.fresh();
  // All four levels are open since 2026-09-21, so a smuggling attempt has to
  // name a quest that does not exist at all — which is the case that matters
  // anyway: a save from an older or tampered build.
  Object.assign(run, { hero: { key: 'nyx' }, phase: 'travel', questId: 'gate_of_nowhere', wave: 2, travelLeg: 'outbound', gold: 137, questsDone: ['rain', 'city'], roster: ['bram', 'nyx', 'stranger'], field: ['bram', 'nyx'] });
  run.levels.god_aura = 2;
  localStorage.setItem(X.saveKey, JSON.stringify(run)); // exercise load of an old unsanitized save
  Camp.registerRecruitArt('bram', null, () => true);
  const saved = X.Run.load(); assert.ok(saved);
  assert.equal(saved.questId, Camp.startQuestId()); assert.equal(saved.phase, 'quest'); assert.equal(saved.wave, 0);
  assert.equal(saved.hero, undefined); assert.equal(saved.travelLeg, undefined);
  assert.equal(saved.gold, 137); assert.equal(saved.levels.god_aura, 2);
  assert.deepEqual(saved.questsDone, ['rain', 'city']); assert.deepEqual(saved.roster, ['bram', 'nyx']);
  assert.deepEqual(saved.field, ['bram'], 'legitimate Bram selection survives loading before textures');
  const waiting = Camp.buildWorld(saved);
  try { assert.equal(waiting.companions.length, 0); } finally { waiting.restoreIds(); }
  ready();
  // Fielding him needs his art in the package as well as loaded, so carry him
  // in X.shipped for this last step; today's build deliberately leaves him out.
  const savedShipped = X.shipped;
  X.shipped = Object.assign({}, X.shipped, { actors: (X.shipped.actors || []).concat('bram') });
  try {
    const loaded = Camp.buildWorld(saved);
    try { assert.deepEqual(loaded.companions.map(c => c.companionKey), ['bram']); } finally { loaded.restoreIds(); }
  } finally { X.shipped = savedShipped; }
});
test('malformed identity collections are normalized without dropping a valid save', () => {
  const run = X.Run.fresh();
  Object.assign(run, { roster: null, field: 'bram', rel: { stranger: { hiro: 1 }, hiro: { bram: 900, nyx: 'bad' } }, visits: [], cycles: null, voice: null, questsDone: null, awarded: null, questId: 'unknown', phase: 'unknown', wave: -5 });
  assert.equal(X.Run.save(run).ok, true);
  const saved = X.Run.load(); assert.ok(saved); assert.deepEqual(saved.roster, []); assert.deepEqual(saved.field, []);
  assert.deepEqual(saved.rel, { hiro: { bram: 100 } }); assert.equal(saved.questId, Camp.startQuestId()); assert.equal(saved.phase, 'quest');
});
const atlasPath = path.join(root, 'assets/expedition/bram/bram.json');
if (fs.existsSync(atlasPath)) test('intaken Bram atlas satisfies the actual shipping gate', () => {
  const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
  const frames = new Set((atlas.textures || []).flatMap(t => t.frames.map(f => f.filename)));
  assert.ok(atlas.textures && atlas.textures.length, 'Phaser multiatlas pages exist');
  for (const page of atlas.textures) assert.ok(fs.existsSync(path.join(path.dirname(atlasPath), page.image)), page.image);
  assert.equal(Camp.registerRecruitArt('bram', atlas, f => frames.has(f)), true);
});
console.log('expedition_recruit_gate: ' + passed + ' checks passed');
