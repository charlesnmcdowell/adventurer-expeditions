'use strict';
// Authored inn motion must stop with the menu and release its mask/update hooks.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { EventEmitter } = require('node:events');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/expedition/inn/inn.json'), 'utf8'));
let recruitReady = true;
const X = { Campaign: { owns: (r, k) => r.roster.includes(k), fielded: (r, k) => r.field.includes(k), recruitReady: () => recruitReady } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/expedition/inn_art.js'), 'utf8'), { ADV: { Expedition: X } });
const solo = { roster: [], field: [] }, party = { roster: ['bram'], field: ['bram'] };
class Display extends EventEmitter {
  constructor() { super(); this.children = []; this.destroyed = false; }
  add(child) { this.children.push(child); return this; }
  setDepth(n) { this.depth = n; return this; }
  setOrigin() { return this; }
  setDisplaySize() { return this; }
  setAlpha() { return this; }
  setTexture(k) { this.texture = k; return this; }
  setFrame(n) { this.frame = n; return this; }
  setMask(m) { this.mask = m; return this; }
  clearMask() { this.mask = null; return this; }
  fillStyle() { return this; }
  fillRect() { return this; }
  createGeometryMask() { return new Display(); }
  destroy() { if (this.destroyed) return; this.destroyed = true; this.emit('destroy'); for (const c of this.children) c.destroy(); }
}
function scene(cached = true) {
  const json = new Map(cached ? [['xp_inn_manifest', manifest]] : []), textures = new Set();
  for (const id of [...Object.keys(manifest.backgrounds), ...Object.keys(manifest.effects)]) textures.add('xp_' + id);
  const load = new EventEmitter(); load.queued = [];
  for (const type of ['json', 'image', 'spritesheet']) load[type] = (...args) => load.queued.push([type, ...args]);
  return { events: new EventEmitter(), time: { paused: false, timeScale: 1 }, paused: false, load,
    cache: { json: { exists: k => json.has(k), get: k => json.get(k) } }, textures: { exists: k => textures.has(k) }, json, loaded: textures,
    add: { container: () => new Display(), image: (_x, _y, k, frame) => new Display().setTexture(k).setFrame(frame) }, make: { graphics: () => new Display() } };
}
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('ok ' + name); }
(async () => {
  await test('manifest cold-load queues its five paintings and three effects', () => {
    const s = scene(false); s.loaded.clear(); X.InnArt.preload(s);
    assert.equal(s.load.queued.length, 1); assert.equal(s.load.queued[0][0], 'json');
    s.json.set('xp_inn_manifest', manifest); s.load.emit('filecomplete-json-xp_inn_manifest');
    assert.equal(s.load.queued.filter(f => f[0] === 'image').length, 5);
    assert.equal(s.load.queued.filter(f => f[0] === 'spritesheet').length, 3);
    s.events.emit('shutdown'); assert.equal(s.load.listenerCount('filecomplete-json-xp_inn_manifest'), 0);
    const warm = scene(); X.InnArt.preload(warm); assert.equal(warm.load.queued.length, 0);
  });
  await test('Bram appears only when owned, fielded and fully art-ready', () => {
    assert.equal(X.InnArt.variant(solo), 'inn-hiro-solo');
    assert.equal(X.InnArt.variant(party), 'inn-hiro-bram');
    assert.equal(X.InnArt.variant({ roster: [], field: ['bram'] }), 'inn-hiro-solo');
    assert.equal(X.InnArt.variant({ roster: ['bram'], field: [] }), 'inn-hiro-solo');
    recruitReady = false; assert.equal(X.InnArt.variant(party), 'inn-hiro-solo'); recruitReady = true;
  });
  await test('painted motion respects menu pause and scene clock', async () => {
    const s = scene(), v = X.InnArt.paint(s, solo); assert.equal(await v.readyPromise, true);
    assert.equal(v.root.depth, -100); assert.equal(v.effects.length, 3);
    const candle = v.effects[0]; s.events.emit('update', 0, 230); assert.equal(candle.frame, 1);
    const elapsed = candle.elapsed; s.paused = true; s.events.emit('update', 0, 1000); assert.equal(candle.elapsed, elapsed);
    s.paused = false; s.time.paused = true; s.events.emit('update', 0, 1000); assert.equal(candle.elapsed, elapsed);
    s.time.paused = false; s.time.timeScale = 0.5; s.events.emit('update', 0, 100); assert.equal(candle.elapsed, elapsed + 50);
    v.destroy(); assert.equal(s.events.listenerCount('update'), 0);
  });
  await test('Bram guest alternates after clears without recruiting or changing saves', () => {
    const r = { roster: [], field: [], cycles: { rain: 1 } }, before = JSON.stringify(r);
    assert.equal(X.InnArt.variant(r), 'inn-hiro-bram');
    assert.equal(X.InnArt.variant(JSON.parse(before)), 'inn-hiro-bram');
    assert.equal(JSON.stringify(r), before);
    r.cycles.marsh = 1; assert.equal(X.InnArt.variant(r), 'inn-hiro-mage');
    r.cycles.city = 1; assert.equal(X.InnArt.variant(r), 'inn-hiro-warrior');
    r.cycles.city = 2; assert.equal(X.InnArt.variant(r), 'inn-hiro-ranger');
    r.cycles.city = 3; assert.equal(X.InnArt.variant(r), 'inn-hiro-solo');
  });
  await test('party changes replace effects and masks without accumulating listeners', () => {
    const s = scene(), v = X.InnArt.paint(s, solo), previous = v.effects.slice(), mask = previous[2].mask;
    assert.equal(v.setParty(party), true); assert.equal(v.variant, 'inn-hiro-bram'); assert.equal(v.effects.length, 4);
    assert.ok(previous.every(f => f.image.destroyed)); assert.equal(mask.destroyed, true);
    assert.equal(s.events.listenerCount('update'), 1); const same = v.effects[0]; v.setParty(party); assert.equal(v.effects[0], same);
    s.events.emit('shutdown'); assert.equal(v.destroyed, true); assert.equal(s.events.listenerCount('update'), 0); assert.equal(v.root.destroyed, true);
    v.destroy(); assert.equal(v.setParty(solo), false);
    const again = X.InnArt.paint(s, solo); assert.equal(s.events.listenerCount('update'), 1); again.root.destroy(); assert.equal(s.events.listenerCount('update'), 0);
  });
  await test('missing selected artwork leaves presentation unready', async () => {
    const s = scene(); s.loaded.delete('xp_inn-stew-steam'); const v = X.InnArt.paint(s, solo);
    assert.equal(await v.ready, false); assert.equal(v.background, null); v.destroy();
  });
  console.log('inn_art_lifecycle: ' + passed + ' checks passed');
})().catch(e => { console.error(e); process.exitCode = 1; });
