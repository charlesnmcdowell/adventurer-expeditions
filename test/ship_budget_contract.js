// Exercise the CLI at the real decimal boundary in an isolated temporary build,
// then ensure every atlas page referenced by shipped JSON is in the allowlist.
'use strict';
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'expeditions-budget-'));
try {
  fs.mkdirSync(path.join(fixture, 'tools'));
  fs.copyFileSync(path.join(ROOT, 'tools/size_check.js'), path.join(fixture, 'tools/size_check.js'));
  fs.writeFileSync(path.join(fixture, 'index.html'), '');
  const manifest = { budgetBytes: 20000000, files: ['payload.bin'], dirs: [] };
  fs.writeFileSync(path.join(fixture, 'tools/ship_manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(fixture, 'payload.bin'), '');
  for (const [bytes, exit] of [[19999999, 0], [20000000, 1], [20000001, 1]]) {
    fs.truncateSync(path.join(fixture, 'payload.bin'), bytes);
    const result = spawnSync(process.execPath, ['tools/size_check.js', '--json'], { cwd: fixture, encoding: 'utf8' });
    assert.equal(result.status, exit, 'CLI budget result for ' + bytes + ' bytes');
    const report = JSON.parse(result.stdout.trim());
    assert.equal(report.total, bytes); assert.equal(report.budget, 20000000);
  }
  manifest.files.push('missing.webp');
  fs.writeFileSync(path.join(fixture, 'tools/ship_manifest.json'), JSON.stringify(manifest));
  const absent = spawnSync(process.execPath, ['tools/size_check.js', '--json'], { cwd: fixture, encoding: 'utf8' });
  assert.equal(absent.status, 1); assert.ok(JSON.parse(absent.stdout).missing.includes('missing.webp'));
  manifest.files = ['payload.bin']; manifest.dirs = ['missing-audio'];
  fs.truncateSync(path.join(fixture, 'payload.bin'), 1);
  fs.writeFileSync(path.join(fixture, 'tools/ship_manifest.json'), JSON.stringify(manifest));
  const absentDir = spawnSync(process.execPath, ['tools/size_check.js', '--json'], { cwd: fixture, encoding: 'utf8' });
  assert.equal(absentDir.status, 1); assert.ok(JSON.parse(absentDir.stdout).missing.includes('missing-audio/'));
} finally {
  const resolved = path.resolve(fixture), parent = path.resolve(os.tmpdir());
  if (path.dirname(resolved) !== parent || !path.basename(resolved).startsWith('expeditions-budget-')) throw new Error('Unsafe fixture cleanup path');
  fs.rmSync(resolved, { recursive: true, force: true });
}
const { shipList, report } = require('../tools/size_check');
const set = new Set(shipList().files);
const actors = ['hiro', 'bram', 'wolf', 'plant', 'alpha'];
// Exercise the actual cold-boot preloader. Checking a second hardcoded manifest
// list alone would miss a runtime that still requests removed boar/Alpha pages.
const context = vm.createContext({ ADV: { Expedition: { UI: {} }, DATA: {} } });
const paintedPath = 'js/expedition/painted.js';
assert.ok(set.has(paintedPath), 'The shared painted loader must ship');
vm.runInContext(fs.readFileSync(path.join(ROOT, paintedPath), 'utf8'), context);
const painted = context.ADV.Expedition.Painted, loads = [];
assert.deepEqual(Array.from(painted.actors), actors, 'Boot actor selection matches tutorial scope');
painted.preload({ sys: { settings: { key: 'Expedition' } }, __needsAlpha: true, textures: { exists: () => false }, cache: { json: { exists: () => false } }, load: {
  multiatlas: (key, file, base) => loads.push({ kind: 'atlas', key, file, base }),
  json: (key, file) => loads.push({ kind: 'metadata', key, file }),
} });
assert.equal(loads.filter(load => load.kind === 'atlas').length, actors.length);
for (const load of loads) assert.ok(set.has(load.file), 'Cold boot requests an excluded file: ' + load.file);
for (const id of actors) {
  const base = 'assets/expedition/' + id + '/';
  assert.ok(set.has(base + id + '.json'), id + ' metadata must ship');
  assert.ok(loads.some(load => load.kind === 'atlas' && load.file === base + id + '.json' && load.base === base), id + ' must use its shipped multiatlas');
  const atlas = JSON.parse(fs.readFileSync(path.join(ROOT, base + id + '.json')));
  for (const texture of atlas.textures) assert.ok(set.has(base + texture.image), 'Missing atlas page: ' + base + texture.image);
}
// New inn and icon dependencies must be complete in a files-only upload too.
const innBase = 'assets/expedition/inn/';
assert(set.has('js/expedition/inn_art.js') && set.has(innBase + 'inn.json'));
const inn = JSON.parse(fs.readFileSync(path.join(ROOT, innBase, 'inn.json'), 'utf8'));
for (const entry of [...Object.values(inn.backgrounds), ...Object.values(inn.effects)])
  assert(set.has(innBase + entry.file), 'Missing painted inn dependency: ' + entry.file);
const iconBase = 'assets/expedition/icons/';
assert(set.has(iconBase + 'hiro-skills.json'));
const icons = JSON.parse(fs.readFileSync(path.join(ROOT, iconBase, 'hiro-skills.json'), 'utf8'));
assert(set.has(iconBase + icons.meta.image), 'Missing Hiro skill icon texture');
assert.deepEqual(Object.keys(icons.frames).sort(), ['counter_attack', 'finisher', 'god_aura', 'katana_slash']);
assert.ok(!set.has('assets/expedition/hiro/hiro.webp'), 'Superseded atlas must not ship');
assert.ok(!set.has('assets/anime/v2/runtime/hiro_cyber_20260916.webp'), 'Superseded Hiro plate must not ship');
assert.ok(![...set].some(f => /(?:^|\/)astra-v\d+(?:\/|$)/.test(f)), 'Source masters/review art must not ship');
assert.ok(![...set].some(f => /^assets\/expedition\/boar\//.test(f)), 'Off-scope creature atlases must stay excluded');
assert.ok(![...set].some(f => /^assets\/expedition\/busts\/(foe_|nyx\.|sable\.|aera\.|ren\.)/.test(f)), 'Off-scope human/recruit portraits must stay excluded');
for (const f of [
  'assets/anime/v2/runtime/alley.webp', 'assets/anime/v2/runtime/marsh.webp', 'assets/anime/v2/runtime/ruins.webp',
  'assets/anime/travel/v1/runtime/city.webp', 'assets/anime/travel/v1/runtime/marsh.webp', 'assets/anime/travel/v1/runtime/ruins.webp',
  'audio/music/night1.mp3',
]) assert.ok(!set.has(f), 'Later-quest-only asset must stay excluded: ' + f);

// Compact cache data must exactly describe shipped recordings, including their
// current contents, rather than bringing back the website-wide hash tables.
const mediaPath = 'js/expedition/media_hashes.js';
assert.ok(set.has(mediaPath), 'Compact audio hashes must ship');
const mediaCode = fs.readFileSync(path.join(ROOT, mediaPath), 'utf8');
assert.ok(Buffer.byteLength(mediaCode) < 8192, 'Tutorial cache hash table must remain compact');
vm.runInContext(mediaCode, context);
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 12);
const voices = [...set].filter(f => /^audio\/vo\/.*\.mp3$/.test(f)).sort();
const effects = [...set].filter(f => /^audio\/sfx\/.*\.mp3$/.test(f)).sort();
assert.ok(voices.length && voices.every(f => f.startsWith('audio/vo/M05/')), 'Only the supported Bram voice ships');
assert.deepEqual(Object.keys(context.ADV.DATA.VOICE_HASHES).sort(), voices, 'Voice hashes match the ship allowlist exactly');
assert.deepEqual(Object.keys(context.ADV.DATA.SFX_HASHES).sort(), effects.map(f => path.basename(f, '.mp3')).sort(), 'Effect hashes match the ship allowlist exactly');
for (const f of voices) assert.equal(context.ADV.DATA.VOICE_HASHES[f], hash(f), 'Stale voice hash: ' + f);
for (const f of effects) assert.equal(context.ADV.DATA.SFX_HASHES[path.basename(f, '.mp3')], hash(f), 'Stale effect hash: ' + f);
assert.equal(report().missing.length, 0, 'Ship allowlist must be complete');
console.log('ship_budget_contract: strict decimal boundary, missing-file handling, tutorial boot/atlas closure, excluded content and compact media hashes passed');
