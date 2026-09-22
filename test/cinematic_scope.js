'use strict';
// Cinematics temporarily own camera/time scales. These tests exercise scope
// cleanup rather than animation art, so a deterministic camera is sufficient.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const X = { cinematic: { cast: { scale: 0.5, zoom: 1.15, ms: 240 }, kill: { scale: 0.36, zoom: 1.26, ms: 240 } } };
const ADV = { Expedition: X, T: {}, Portraits: { key() {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/expedition/ui_common.js'), 'utf8'), { ADV, console });
function scene() {
  const writes = [];
  const cam = {
    width: 1280, height: 760, zoom: 1.08, scrollX: 24, scrollY: 32,
    panEffect: { reset() { writes.push('panReset'); } }, zoomEffect: { reset() { writes.push('zoomReset'); } },
    pan(x, y) { writes.push('pan'); this.scrollX = x - this.width / 2; this.scrollY = y - this.height / 2; return this; },
    zoomTo(z) { writes.push('zoomTo'); this.zoom = z; return this; },
    setZoom(z) { writes.push('setZoom'); this.zoom = z; return this; },
    setScroll(x, y = x) { writes.push('setScroll'); this.scrollX = x; this.scrollY = y; return this; },
    centerOn(x, y) { return this.pan(x, y); },
  };
  return { cameras: { main: cam }, tweens: { timeScale: 0.8 }, anims: { globalTimeScale: 0.7 }, time: { timeScale: 0.9 }, events: new EventEmitter(), writes, sys: { isActive: () => true } };
}
const snapshot = s => ({ tween: s.tweens.timeScale, anim: s.anims.globalTimeScale, clock: s.time.timeScale, zoom: s.cameras.main.zoom, x: s.cameras.main.scrollX, y: s.cameras.main.scrollY });
// The contract changed in round 3 (Hiro): a cinematic no longer restores
// whatever it happened to find, it restores the scene's resting camera — time
// scales 1, zoom 1, centred. Sampling the live camera let a restore that was
// still in flight become the next baseline, so the zoom ratcheted in over a
// fight and never came back. `rest` is that fixed baseline.
const rest = { tween: 1, anim: 1, clock: 1, zoom: 1, x: 0, y: 0 };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const cases = [];
const test = (name, fn) => cases.push([name, fn]);
// Full speed (Hiro, 2026-09-21): with X.fx.cinematics false the body still runs
// and still returns its value, but nothing touches the camera or the clocks —
// no push, no slow motion, and no cinematic bookkeeping left on the scene.
test('full speed runs the body without touching the camera or the clocks', async () => {
  const s = scene(), before = snapshot(s);
  X.fx = { cinematics: false };
  try {
    let ran = false;
    const out = await X.UI.cinematic(s, 'kill', { x: 600, y: 390 }, async () => {
      ran = true;
      assert.deepEqual(snapshot(s), before, 'nothing may change while the body runs');
      return 'done';
    });
    assert.ok(ran, 'the body still runs');
    assert.equal(out, 'done', 'and its value is still returned');
    assert.deepEqual(snapshot(s), before, 'and nothing changed after it');
    assert.deepEqual(s.writes, [], 'the camera is never written to');
    assert.ok(!s.__cinematicState && !s.__cine, 'no cinematic state is left behind');
  } finally { X.fx = { cinematics: true }; }
});

test('normal completion returns the scene to its resting camera and time scales', async () => {
  const s = scene(), before = snapshot(s);
  const result = await X.UI.cinematic(s, 'cast', { x: 600, y: 390 }, async () => {
    assert.ok(s.time.timeScale < before.clock);
    assert.ok(s.cameras.main.zoom > before.zoom);
    return 'finished';
  });
  assert.deepEqual(snapshot(s), rest);
  assert.equal(s.__cine || 0, 0);
  assert.equal(s.events.listenerCount('shutdown'), 1, 'one shutdown guard for the scene, not one per cinematic');
});
test('nested kill restores the outer cast before restoring the baseline', async () => {
  const s = scene(), before = snapshot(s);
  await X.UI.cinematic(s, 'cast', { x: 570, y: 360 }, async () => {
    const outer = snapshot(s);
    await X.UI.cinematic(s, 'kill', { x: 780, y: 420 }, async () => {
      assert.ok(s.time.timeScale < outer.clock);
      assert.equal(s.__cine, 2);
    });
    assert.deepEqual(snapshot(s), outer);
    assert.equal(s.__cine, 1);
  });
  assert.deepEqual(snapshot(s), rest);
  assert.equal(s.__cine || 0, 0);
});
test('a rejected animation restores state and preserves its original error', async () => {
  const s = scene(), before = snapshot(s), failure = new Error('animation interrupted');
  await assert.rejects(X.UI.cinematic(s, 'kill', null, async () => { throw failure; }), e => e === failure);
  assert.deepEqual(snapshot(s), rest);
  assert.equal(s.__cine || 0, 0);
  assert.equal(s.events.listenerCount('shutdown'), 1, 'one shutdown guard for the scene, not one per cinematic');
});
test('shutdown immediately restores state and late completion cannot change the camera', async () => {
  const s = scene(), before = snapshot(s), wait = deferred();
  const p = X.UI.cinematic(s, 'kill', { x: 790, y: 430 }, () => wait.promise);
  assert.ok(s.events.listenerCount('shutdown') > 0);
  s.events.emit('shutdown');
  assert.deepEqual(snapshot(s), rest);
  assert.equal(s.__cine || 0, 0);
  const writesAfterShutdown = s.writes.length;
  wait.resolve(); await p;
  assert.equal(s.writes.length, writesAfterShutdown);
  assert.deepEqual(snapshot(s), rest);
  assert.equal(s.events.listenerCount('shutdown'), 0, 'the guard is spent once the scene is gone');
});
test('an older overlapping scope cannot reset the newer active scope', async () => {
  const s = scene(), before = snapshot(s), a = deferred(), b = deferred();
  const first = X.UI.cinematic(s, 'cast', { x: 580, y: 360 }, () => a.promise);
  const second = X.UI.cinematic(s, 'kill', { x: 760, y: 420 }, () => b.promise);
  const newer = snapshot(s);
  a.resolve(); await first;
  assert.deepEqual(snapshot(s), newer);
  assert.equal(s.__cine, 1);
  b.resolve(); await second;
  assert.deepEqual(snapshot(s), rest);
  assert.equal(s.__cine || 0, 0);
  assert.equal(s.events.listenerCount('shutdown'), 1, 'one shutdown guard for the scene, not one per cinematic');
});
(async () => {
  let failed = 0;
  for (const [name, fn] of cases) {
    try { await fn(); console.log('PASS ' + name); }
    catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.stack); }
  }
  console.log(`cinematic_scope: ${cases.length - failed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
})();
