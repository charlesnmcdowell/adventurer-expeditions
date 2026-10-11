// Knockback on defeat (2026-10-10, physics proposal step 2). An ordinary enemy
// death throws the body away from Hiro while its own painted fall plays: gravity,
// a bounce off the combat floor, ground friction and a backward tilt that rights
// itself on landing. Presentation only — the simulation already decided the
// death, so physics can never change a fight. No new art: the painted down clip
// is the body. Paired finishers keep their choreographed endings.
(function () {
'use strict';
const X = ADV.Expedition;
const K = X.Knockback = {
  enabled: true,
  gravity: 2600,        // px/s²
  restitution: 0.28,    // share of vertical speed kept on a bounce
  friction: 0.55,       // share of horizontal speed kept on each floor contact
  slide: 900,           // px/s² ground drag while sliding
  maxMs: 1600,          // a body always comes to rest within this
  stageW: 1280,         // the body's far edge never passes the stage edge
};

// Launch velocity for one body. Bosses are heavier; `seed` varies it per enemy.
K.launch = function (opts) {
  const mass = opts.boss ? 1.8 : 1, r = ((opts.seed || 1) * 9301 + 49297) % 233280 / 233280;
  return { x: 0, y: 0, vx: (380 + 240 * r) / mass * (opts.dir || 1), vy: -(520 + 180 * r) / Math.pow(mass, 0.25), a: 0,
    w: (0.9 + 0.5 * r) * (opts.dir || 1), bounces: 0, grounded: false, rest: false, t: 0 };
};

// One integration step. `b.x`/`b.y` are the feet offset from where the enemy
// stood (y < 0 is above the floor); `b.a` is the tilt in radians. Pure.
K.step = function (b, dt, limitX) {
  if (b.rest) return b;
  b.t += dt * 1000;
  if (!b.grounded) {
    b.vy += K.gravity * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
    if (b.y >= 0) {                                     // floor contact
      b.y = 0; b.bounces++;
      b.vy = -b.vy * K.restitution; b.vx *= K.friction; b.w *= 0.4;
      if (Math.abs(b.vy) < 140 || b.bounces >= 3) { b.vy = 0; b.grounded = true; }
    }
  } else {
    const s = Math.sign(b.vx), v = Math.max(0, Math.abs(b.vx) - K.slide * dt);
    b.vx = s * v; b.x += b.vx * dt;
    b.a += (0 - b.a) * Math.min(1, dt * 7);             // the body settles flat
  }
  if (limitX != null && b.x > limitX) { b.x = limitX; b.vx = 0; }
  if ((b.grounded && Math.abs(b.vx) < 8 && Math.abs(b.a) < 0.01) || b.t >= K.maxMs) { b.rest = true; b.a = 0; b.y = 0; }
  return b;
};

// Run the motion on an actor's sprite; resolves when the body is at rest.
// Freezes with the menu pause, the scene clock and painted hit-stop.
K.play = function (actor) {
  const scene = actor.scene, img = actor.img;
  if (!K.enabled || !scene || !img || actor._destroyed) return Promise.resolve();
  const x0 = img.x, y0 = img.y, a0 = img.rotation || 0;
  const dir = actor.root.x >= (scene.hero ? scene.hero.root.x : 0) ? 1 : -1;
  const b = K.launch({ boss: actor.kind === 'boss', seed: String(actor.uid || '').split('').reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0, dir });
  const scale = actor.root.scaleX || 1, half = Math.abs(img.displayWidth || 0) * scale * 0.5;
  const limit = Math.max(0, (K.stageW - 12 - half - actor.root.x) / scale);
  // The body leaves its health bar and status badges behind: hide them now.
  if (actor.plate) actor.plate.setVisible(false);
  if (actor.badges) for (const badge of actor.badges.values()) badge.setVisible(false);
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      scene.events.off('update', tick); scene.events.off('shutdown', finish);
      resolve();
    };
    const tick = (_t, dtMs) => {
      if (actor._destroyed || !img.active) return finish();
      const clock = scene.time;
      if (scene.paused || (clock && clock.paused) || scene.__paintedHitStopCount > 0) return;
      K.step(b, Math.min(0.05, dtMs * (clock ? clock.timeScale : 1) / 1000), dir > 0 ? limit : null);
      img.x = x0 + b.x / scale; img.y = y0 + b.y / scale; img.rotation = a0 + b.a;
      if (actor.shadow) actor.shadow.x = img.x;
      if (X.Props && b.y > -50) X.Props.sweep(scene, actor.root.x + img.x * scale, half, b.vx);   // shove props it lands among
      if (b.rest) finish();
    };
    scene.events.on('update', tick);
    scene.events.once('shutdown', finish);
  });
};
})();
