// Focused actor contracts: no browser timing or renderer needed. Real Phaser
// event signatures and its per-frame duration override semantics are preserved.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const X = { clipFor: c => ({ slash: 'slash-l1', victory: 'victory-sheath', hit_short: 'hit-short', finisher: 'finisher-l1-paired' }[c] || c), impact: {} };
const ADV = { Expedition: X, T: {}, VFX: new Proxy({}, { get: () => () => {} }), DATA: { SKILLS: {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/expedition/actors.js'), 'utf8'), { ADV, console });
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/expedition/beats.js'), 'utf8'), { ADV, console });
X.timing = { hitStop: 60 };
class Image extends EventEmitter {
  constructor() { super(); this.scaleX = this.scaleY = 1; this.x = this.y = this.angle = 0; this.alpha = 1; this.visible = true; this.anims = { stop: () => { this.stopped = true; }, pause() { this.isPaused = true; }, resume() { this.isPaused = false; } }; }
  setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; }
  setPosition(x, y) { this.x = x; this.y = y; return this; }
  setAngle(n) { this.angle = n; return this; }
  setAlpha(n) { this.alpha = n; return this; }
  setVisible(n) { this.visible = n; return this; }
  setFrame(n) { this.frame = { name: n }; return this; }
  play(key) { this.key = key; this.stopped = false; this.emit('animationstart', { key }, { index: 1 }); return this; }
}
const clip = (id, extra = {}) => Object.assign({ frames: [id + '/0', id + '/1', id + '/2'], durationMs: 300, contact: [1], release: 1 }, extra);
function actor(extra = {}) {
  const clips = Object.assign({ idle: clip('idle', { loop: true, contact: [] }), slash: clip('slash'), 'slash-l1': clip('slash-l1'), 'hit-short': clip('hit-short'), 'victory-sheath': clip('victory-sheath', { contact: [] }) }, extra);
  const anims = new Map(), scene = {
    anims: { exists: k => anims.has(k), create: cfg => anims.set(cfg.key, cfg) },
    tweens: { killTweensOf() {}, add(cfg) { const t = cfg.targets; for (const k of ['x', 'y', 'angle', 'scaleX', 'scaleY', 'alpha']) if (cfg[k] != null) t[k] = cfg[k]; queueMicrotask(() => cfg.onComplete && cfg.onComplete()); return { stop() {} }; } },
  };
  const a = Object.create(X.Actor.prototype);
  Object.assign(a, { scene, sheet: { key: 'hero', clips, standing: 300 }, img: new Image(), height: 300, alive: true, home: { x: 100, y: 300 }, groundY: 300, facing: 1, side: 'a', kind: 'hero', badges: new Map(), _baseScaleX: 1, _baseScaleY: 1,
    root: { x: 100, y: 300, visible: true, setVisible(v) { this.visible = v; }, destroy() { this.destroyed = true; } },
    plate: { setVisible() {} }, shadow: { alpha: 1 }, _animationConfigs: anims });
  return a;
}
const emit = (a, event, id, i = 0) => a.img.emit(event, { key: 'hero:' + id }, { index: i + 1 });
const tick = () => new Promise(r => setImmediate(r));
const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('direct actor clips take precedence over Hiro aliases', () => {
  const a = actor(); assert.equal(a.sheetClipFor('slash', {}), 'slash');
  a.sheet.clips.hit_short = clip('hit_short'); assert.equal(a.sheetClipFor('hit_short', {}), 'hit_short');
});
test('per-frame durations retain variable holds and exact configured total', () => {
  const a = actor({ variable: clip('variable', { frameMs: [90, 40, 170], durationMs: 300 }) });
  const k = a.animKey('variable'), cfg = a._animationConfigs.get(k);
  assert.deepEqual(Array.from(cfg.frames, f => f.duration), [90, 40, 170]);
  assert.equal(cfg.duration, 300);
});
test('release hook does not cut recovery or settle the play promise early', async () => {
  const a = actor(); let release = 0, settled = false;
  const p = a.play('slash', { onRelease: () => release++ }).then(() => { settled = true; });
  emit(a, 'animationupdate', 'slash', 1); await tick();
  assert.equal(release, 1); assert.equal(settled, false);
  emit(a, 'animationcomplete', 'slash', 2); await p; assert.equal(settled, true);
});
test('interrupting a clip detaches old callbacks and ignores unrelated events', async () => {
  const a = actor(); let oldHits = 0, newHits = 0;
  const p1 = a.play('slash', { onContact: () => oldHits++ });
  const p2 = a.play('hit_short', { onContact: () => newHits++ });
  emit(a, 'animationupdate', 'slash', 1); emit(a, 'animationcomplete', 'slash', 2);
  assert.equal(oldHits, 0); assert.equal(newHits, 0); assert.equal(a.img.key, 'hero:hit-short');
  emit(a, 'animationupdate', 'hit-short', 1); emit(a, 'animationcomplete', 'hit-short', 2);
  await Promise.all([p1, p2]); assert.equal(newHits, 1);
  assert.equal(a.img.listenerCount('animationupdate'), 0); assert.equal(a.img.listenerCount('animationcomplete'), 0);
});
test('painted playback resets accumulated placeholder image transforms', async () => {
  const a = actor(); Object.assign(a.img, { scaleX: 1.7, scaleY: .6, angle: 80, x: 17, y: -38 });
  const p = a.play('slash');
  assert.equal(a.img.scaleX, 1); assert.equal(a.img.scaleY, 1); assert.equal(a.img.angle, 0); assert.equal(a.img.x, 0); assert.equal(a.img.y, 0);
  emit(a, 'animationcomplete', 'slash', 2); await p;
});
test('victory keeps the final sheathed frame instead of drawing the sword again', async () => {
  const a = actor(); const p = a.play('victory'); emit(a, 'animationcomplete', 'victory-sheath', 2); await p;
  assert.equal(a.img.key, 'hero:victory-sheath'); assert.equal(a.img.frame.name, 'victory-sheath/2');
});
test('destroy settles active playback and removes listeners', async () => {
  const a = actor(); let settled = false; a.play('slash').then(() => { settled = true; }); a.destroy(); await tick();
  assert.equal(settled, true); assert.equal(a.img.listenerCount('animationupdate'), 0); assert.equal(a.img.listenerCount('animationcomplete'), 0);
});
test('paired finishers require a matching identity and lethal outcome, including early wave kills', async () => {
  const a = actor({ 'finisher-l1-paired': clip('finisher-l1-paired', { paired: true, opponentKinds: ['wolf'], opponentKeys: ['dire_wolf'] }) });
  const target = actor(); target.kind = 'wolf'; target.unit = { ch: { expeditionKey: 'dire_wolf' } };
  target.root.x = a.root.x + a.height * 0.65;
  assert.notEqual(a.sheetClipFor('finisher', { target, lethal: false, lastEnemy: true }), 'finisher-l1-paired');
  assert.equal(a.sheetClipFor('finisher', { target, lethal: true, lastEnemy: false }), 'finisher-l1-paired');
  const opts = { target, lethal: true, lastEnemy: false };
  assert.equal(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
  const p = a.play('finisher', opts); assert.equal(target.root.visible, false);
  emit(a, 'animationcomplete', 'finisher-l1-paired', 2); await p;
  assert.equal(target.root.visible, false); assert.equal(target.alive, false);
  target.alive = true; target.unit.ch.expeditionKey = 'blight_wolf'; assert.notEqual(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
});
test('Bram paired clips and Alpha hit vocabulary resolve to their own art', () => {
  const a = actor(); a.sheet.clips = { idle: clip('idle'), bite_arm: clip('bite_arm', { paired: true, opponentKinds: ['wolf'] }), finisher_quadruped: clip('finisher_quadruped', { paired: true, opponentKinds: ['wolf'] }) };
  const target = actor(); target.kind = 'wolf'; target.unit = { ch: { expeditionKey: 'dire_wolf' } };
  assert.equal(a.sheetClipFor('bite_grip', { target, arm: true }), 'bite_arm');
  assert.equal(a.sheetClipFor('finisher', { target, lethal: true, lastEnemy: true }), 'finisher_quadruped');
  a.sheet.clips = { hit_heavy: clip('hit_heavy') }; assert.equal(a.sheetClipFor('hit_short'), 'hit_heavy');
});
test('paired wolf identity permits an explicit gray-wolf variant but rejects tint and other art', () => {
  const a = actor({ 'finisher-l1-paired': clip('finisher-l1-paired', { paired: true, opponentKinds: ['wolf'], opponentKeys: ['dire_wolf'] }) });
  const target = actor(); target.kind = 'wolf';
  target.unit = { ch: { expeditionKey: 'road_wolf_leader', expeditionArtIdentity: 'dire_wolf' } };
  const opts = { target, lethal: true };
  assert.equal(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
  target.img.__baseTint = 0x77aa55;
  assert.notEqual(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
  delete target.img.__baseTint; target.unit.ch.expeditionArtIdentity = 'blight_wolf';
  assert.notEqual(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
  delete target.unit.ch.expeditionArtIdentity;
  assert.notEqual(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
  target.unit.ch.expeditionKey = 'dire_wolf';
  assert.equal(a.sheetClipFor('finisher', opts), 'finisher-l1-paired');
});

test('approved v2 finishers use the right creature and tier, with a live-target fallback', () => {
  const live = { ADV: { Expedition: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/expedition/data.js'), 'utf8'), live);
  const previous = X.clipFor;
  X.clipFor = live.ADV.Expedition.clipFor;
  try {
    const sets = { wolf: ['wolf-cleave-paired', 'wolf-pin-paired', 'wolf-rising-cut-paired'],
      plant: ['plant-stem-cut-paired', 'plant-vine-pin-paired', 'plant-crosscut-paired'] };
    const clips = {};
    for (const [kind, ids] of Object.entries(sets)) for (const id of ids)
      clips[id] = clip(id, { paired: true, opponentKinds: [kind], opponentKeys: [kind === 'wolf' ? 'dire_wolf' : 'thorn_lurker'] });
    const a = actor(clips);
    for (const [kind, ids] of Object.entries(sets)) {
      const target = actor(); target.kind = kind;
      target.unit = { ch: { expeditionKey: kind === 'wolf' ? 'dire_wolf' : 'thorn_lurker' } };
      for (let level = 1; level <= 3; level++) {
        assert.equal(a.sheetClipFor('finisher', { target, level, lethal: true }), ids[level - 1]);
        const fallback = a.sheetClipFor('finisher', { target, level, lethal: false });
        assert.equal(a.sheet.clips[fallback].paired, undefined, 'live target must never dissolve');
      }
      target.img.__baseTint = 0x00ff00;
      assert(!a.sheet.clips[a.sheetClipFor('finisher', { target, lethal: true })].paired);
    }
  } finally { X.clipFor = previous; }
});
test('pause and impact holds freeze painted idle and resume only after both clear', () => {
  const a = actor(); a.scene.time = { now: 100, paused: false };
  a.scene.paused = true; a.syncPause(); assert.equal(a.img.anims.isPaused, true);
  a.scene.__paintedHitStopUntil = 160; a.scene.paused = false; a.syncPause(); assert.equal(a.img.anims.isPaused, true);
  a.scene.time.now = 161; a.syncPause(); assert.equal(a.img.anims.isPaused, false);
});
test('paired target is restored if playback is interrupted', async () => {
  const a = actor({ 'bite-leg-paired': clip('bite-leg-paired', { paired: true, opponentKinds: ['wolf'] }) });
  const target = actor(); target.kind = 'wolf'; target.unit = { ch: { expeditionKey: 'dire_wolf' } };
  const p = a.play('bite_grip', { target }); assert.equal(target.root.visible, false);
  a.destroy(); await p; assert.equal(target.root.visible, true);
});

test('paired finisher closes the distance before hiding the separate foe', async () => {
  const a = actor({ walk: clip('walk', { loop: true }), 'finisher-l1-paired': clip('finisher-l1-paired', { paired: true, opponentKinds: ['wolf'], pairTargetDistance: 180 }) });
  const target = actor(); target.kind = 'wolf'; target.root.x = 800;
  const p = a.play('finisher', { target, lethal: true, lastEnemy: true });
  assert.equal(target.root.visible, true); assert.equal(a.img.key, 'hero:walk');
  assert.equal(a.root.x, 620); await tick(); assert.equal(target.root.visible, false);
  emit(a, 'animationcomplete', 'finisher-l1-paired', 2); await p;
  assert.equal(target.alive, false); assert.equal(target.root.visible, false); assert.equal(a.root.x, 100);
});

test('interruption during paired approach leaves the foe alive and visible', async () => {
  const a = actor({ walk: clip('walk', { loop: true }), 'finisher-l1-paired': clip('finisher-l1-paired', { paired: true, opponentKinds: ['wolf'] }) });
  const target = actor(); target.kind = 'wolf'; target.root.x = 800;
  const p = a.play('finisher', { target, lethal: true, lastEnemy: true });
  a.cancelPlayback(); await p; await tick();
  assert.equal(target.alive, true); assert.equal(target.root.visible, true); assert.equal(a.root.x, 100);
  assert.equal(a.img.listenerCount('animationcomplete'), 0);
});

function recoilFixture(side = 'b', hidden = false) {
  let release; const played = [], heroPlayed = [];
  const foe = { uid: 'foe', kind: 'wolf', side, alive: true, root: { visible: !hidden }, sheet: { clips: { hit_short: {} } },
    unit: { maxHp: 100, chp: 0 }, sheetClipFor: () => 'hit_short', chest: () => ({ x: 600, y: 300 }), refresh() {},
    play(id) { played.push(id); if (id === 'hit_short') return new Promise(r => { release = r; }); if (id === 'down_fade') this.alive = false; return Promise.resolve(); } };
  const hero = { uid: 'hero', side: 'a', alive: true, x: 300, y: 600, height: 300, facing: 1, refresh() {}, play(id, opts) { heroPlayed.push({ id, opts }); if (opts?.onContact) opts.onContact(); return Promise.resolve(); } };
  const scene = { actors: new Map([['hero', hero], ['foe', foe]]), hero, enc: { run: { levels: {} } }, time: { now: 0, delayedCall(ms, fn) { queueMicrotask(fn); } } };
  return { scene, foe, played, heroPlayed, release: () => release && release() };
}

test('ordinary enemy recoil finishes before the director starts the down clip', async () => {
  const f = recoilFixture(); let done = false;
  const p = X.Beats.play(f.scene, { hero: true, events: [{ t: 'use', uid: 'hero', skillId: 'katana_slash' }, { t: 'damage', uid: 'foe', by: 'hero', dmg: 20 }, { t: 'down', uid: 'foe' }] }).then(() => { done = true; });
  await tick(); assert.deepEqual(f.played, ['hit_short']); assert.equal(done, false);
  f.release(); await p; assert.deepEqual(f.played, ['hit_short', 'down_fade']);
});

test('generic impact adds no duplicate recoil to heroes or hidden paired foes', async () => {
  for (const [side, hidden] of [['a', false], ['b', true]]) {
    const f = recoilFixture(side, hidden);
    await X.Beats.play(f.scene, { hero: true, events: [{ t: 'use', uid: 'hero', skillId: 'katana_slash' }, { t: 'damage', uid: 'foe', by: 'hero', dmg: 20 }] });
    assert.deepEqual(f.played, []);
  }
});

test('damage-over-time ticks do not trigger physical recoil', async () => {
  const f = recoilFixture(); f.foe.pulseBadge = () => {};
  await X.Beats.play(f.scene, { events: [{ t: 'damage', uid: 'foe', by: 'hero', dmg: 1, tag: 'dot', visual: { dotKind: 'poison' } }] });
  assert.deepEqual(f.played, []);
});

test('painted hit-stop follows the scaled timer instead of expiring on raw clock time', () => {
  const a = actor(); a.scene.time = { now: 100, paused: false };
  a.scene.__paintedHitStopCount = 1; a.syncPause(); assert.equal(a.img.anims.isPaused, true);
  a.scene.time.now = 10000; a.syncPause(); assert.equal(a.img.anims.isPaused, true);
  a.scene.__paintedHitStopCount = 0; a.syncPause(); assert.equal(a.img.anims.isPaused, false);
});

test('manual skill cinematics stay active until enemy recoil has recovered', async () => {
  const f = recoilFixture(), prev = X.UI, calls = [];
  X.UI = { cinematic: async (scene, kind, focus, fn) => { calls.push(kind); scene.__cine = 1; try { await fn(); } finally { scene.__cine = 0; } } };
  try {
    const p = X.Beats.play(f.scene, { hero: true, choice: { how: 'request' }, events: [{ t: 'use', uid: 'hero', skillId: 'katana_slash', target: 'foe' }, { t: 'damage', uid: 'foe', by: 'hero', dmg: 10 }] });
    await tick(); assert.deepEqual(calls, ['cast']); assert.equal(f.scene.__cine, 1);
    f.release(); await p; assert.equal(f.scene.__cine, 0);
  } finally { X.UI = prev; }
});

test('every cleave victim gets one finisher, without a duplicate death for paired victims', async () => {
  const f = recoilFixture(), prev = X.UI, calls = [];
  f.foe.sheet = null;
  const second = { ...f.foe, uid: 'second', root: { visible: true }, play: async id => { throw Error('paired victim should not play ' + id); } };
  f.foe.play = second.play;
  f.scene.actors.set('second', second);
  f.scene.hero.play = async (id, opts) => { f.heroPlayed.push({ id, opts }); if (opts.onContact) opts.onContact(); if (id === 'finisher' && opts.lethal) opts.target.alive = false; };
  X.UI = { cinematic: async (scene, kind, focus, fn) => { calls.push(kind); scene.__cine = 1; try { await fn(); } finally { scene.__cine = 0; } } };
  try {
    await X.Beats.play(f.scene, { hero: true, events: [{ t: 'use', uid: 'hero', skillId: 'katana_slash', target: 'foe' }, { t: 'damage', uid: 'foe', by: 'hero', dmg: 10 }, { t: 'damage', uid: 'second', by: 'hero', dmg: 10 }, { t: 'down', uid: 'foe', by: 'hero' }, { t: 'down', uid: 'second', by: 'hero' }] });
    assert.deepEqual(f.heroPlayed.map(p => [p.id, p.opts.target.uid, p.opts.lethal]), [['finisher', 'foe', true], ['finisher', 'second', true]]);
    assert.deepEqual(calls, ['kill']); assert.equal(f.scene.__cine, 0);
  } finally { X.UI = prev; }
});

test('a nonlethal tapped finisher preserves tier and cannot embed a dead victim', async () => {
  const f = recoilFixture(); f.foe.sheet = null; f.scene.enc.run.levels.finisher = 2;
  await X.Beats.play(f.scene, { hero: true, choice: { how: 'request' }, events: [{ t: 'use', uid: 'hero', skillId: 'finisher', target: 'foe' }, { t: 'damage', uid: 'foe', by: 'hero', dmg: 1 }] });
  assert.equal(f.heroPlayed[0].id, 'finisher'); assert.equal(f.heroPlayed[0].opts.level, 2); assert.equal(f.heroPlayed[0].opts.lethal, false);
  assert.equal(f.foe.alive, true); assert.deepEqual(f.played, []);
});

test('a DOT kill also gets a cinematic finish without a physical DOT recoil', async () => {
  const f = recoilFixture(), prev = X.UI, calls = [];
  f.foe.pulseBadge = () => {};
  X.UI = { cinematic: async (scene, kind, focus, fn) => { calls.push(kind); await fn(); } };
  try {
    await X.Beats.ticksOnly(f.scene, [{ t: 'damage', uid: 'foe', by: 'hero', dmg: 1, tag: 'dot' }, { t: 'down', uid: 'foe', by: 'hero' }]);
    assert.deepEqual(calls, ['kill']); assert.equal(f.heroPlayed[0].id, 'finisher'); assert.equal(f.heroPlayed[0].opts.lethal, true);
    assert.deepEqual(f.played, ['down_fade']);
  } finally { X.UI = prev; }
});

test('paired wolf grip receives its target and does not play a second separate bite', async () => {
  const f = recoilFixture();
  f.foe.side = 'b'; f.foe.play = async id => { f.played.push(id); };
  f.scene.hero.unit = { maxHp: 100 }; f.scene.hero.chest = () => ({ x: 300, y: 350 });
  f.scene.hero.sheet = { clips: { pair: { paired: true } } }; f.scene.hero.sheetClipFor = () => 'pair';
  await X.Beats.play(f.scene, { hero: false, events: [{ t: 'use', uid: 'foe', skillId: 'bite', target: 'hero' }, { t: 'damage', uid: 'hero', by: 'foe', dmg: 10 }] });
  assert.deepEqual(f.played, ['leap', 'land_beside']); assert.equal(f.heroPlayed[0].id, 'bite_grip'); assert.equal(f.heroPlayed[0].opts.target, f.foe);
});

(async () => {
  let failed = 0;
  for (const [name, fn] of cases) { try { await fn(); console.log('PASS', name); } catch (e) { failed++; console.error('FAIL', name, e.message); } }
  if (failed) process.exitCode = 1;
  console.log('actor_animation_lifecycle:', cases.length - failed, 'passed,', failed, 'failed');
})();
