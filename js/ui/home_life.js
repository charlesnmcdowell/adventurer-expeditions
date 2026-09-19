// The home screen, alive (HEALER_DRUID_PROMPT.md Part D).
//
// home_art.js paints the place; this file puts people and animals in it. Every
// actor is a code-drawn figure at crowd scale — head, torso, two legs that
// alternate, a carried thing — that enters from off-screen or a doorway and
// loops forever on randomised timings. HousingArt.paint calls
// HomeLife.attach(scene, id, phase, clock, life) after the backdrop is down.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;
const HomeLife = {};

function rnd(a, b) { return a + Math.random() * (b - a); }
function kill(o) { try { if (o && o.destroy) o.destroy(); } catch (e) {} }
function alive(scene) { return scene && scene.sys && scene.sys.isActive && scene.sys.isActive(); }

// ---- a walking figure ----------------------------------------------------
// opts: h (height), skin, cloth, hair, hat: 'cap'|'bonnet'|'circlet'|'helm'|null,
//       carry: 'tray'|'decanter'|'cake'|'spear'|null, dress: bool, cloak: colour
function figure(scene, x, y, o) {
  o = o || {};
  const h = o.h || 34, w = h * 0.36;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const skin = o.skin || 0xc8a080, cloth = o.cloth || 0x4a3a30, hair = o.hair || 0x2a1c12;
  // legs (two, drawn as separate graphics so they can swing)
  const legL = scene.add.graphics(), legR = scene.add.graphics();
  for (const [lg, s] of [[legL, -1], [legR, 1]]) { lg.fillStyle(o.dress ? cloth : 0x2a2420, 1); lg.fillRect(s * 2 - (s > 0 ? 0 : 4), -h * 0.32, 4, h * 0.32); }
  // torso / dress
  g.fillStyle(cloth, 1);
  if (o.dress) g.fillTriangle(-w * 0.55, 0, w * 0.55, 0, 0, -h * 0.72); else g.fillRect(-w / 2, -h * 0.72, w, h * 0.42);
  if (o.apron) { g.fillStyle(0xe8dfc8, 1); g.fillRect(-w * 0.3, -h * 0.5, w * 0.6, h * 0.42); }
  if (o.cloak) { g.fillStyle(o.cloak, 1); g.fillTriangle(-w * 0.7, -h * 0.1, w * 0.7, -h * 0.1, 0, -h * 0.74); }
  // head
  g.fillStyle(skin, 1); g.fillCircle(0, -h * 0.82, h * 0.11);
  g.fillStyle(hair, 1); g.fillEllipse(0, -h * 0.88, h * 0.2, h * 0.1);
  if (o.hat === 'cap') { g.fillStyle(0x2a2420, 1); g.fillRect(-h * 0.12, -h * 0.94, h * 0.24, h * 0.05); }
  else if (o.hat === 'bonnet') { g.fillStyle(0xe8dfc8, 1); g.fillEllipse(0, -h * 0.9, h * 0.24, h * 0.12); }
  else if (o.hat === 'circlet') { g.fillStyle(0xd4a94e, 1); g.fillRect(-h * 0.1, -h * 0.9, h * 0.2, 2); }
  else if (o.hat === 'helm') { g.fillStyle(0x8a8a92, 1); g.fillEllipse(0, -h * 0.86, h * 0.24, h * 0.18); g.fillStyle(0x6a6a72, 1); g.fillRect(-h * 0.12, -h * 0.84, h * 0.24, 3); }
  // arms + carried thing
  g.fillStyle(skin, 1);
  if (o.carry === 'tray' || o.carry === 'decanter' || o.carry === 'cake') {
    g.fillRect(-w * 0.5, -h * 0.55, w, 3);
    g.fillStyle(0xc8c8c8, 1); g.fillRect(-w * 0.7, -h * 0.58, w * 1.4, 3);
    if (o.carry === 'tray') { g.fillStyle(0xc8c8c8, 1); g.fillEllipse(0, -h * 0.64, w * 0.8, h * 0.12); }
    if (o.carry === 'decanter') { g.fillStyle(0x6a2030, 1); g.fillRect(-2, -h * 0.72, 4, h * 0.14); g.fillStyle(0xe8f0ff, 0.8); g.fillRect(-w * 0.45, -h * 0.66, 3, h * 0.08); g.fillRect(w * 0.35, -h * 0.66, 3, h * 0.08); }
    if (o.carry === 'cake') { g.fillStyle(0xf4eee0, 1); g.fillRect(-w * 0.35, -h * 0.68, w * 0.7, h * 0.1); g.fillStyle(0xe8a0b0, 1); g.fillRect(-w * 0.25, -h * 0.76, w * 0.5, h * 0.08); }
  } else if (o.carry === 'spear') {
    g.fillRect(w * 0.45, -h * 0.6, 3, h * 0.2);
    g.fillStyle(0x4a3020, 1); g.fillRect(w * 0.55, -h * 1.15, 2, h * 1.15);
    g.fillStyle(0xc8c8d0, 1); g.fillTriangle(w * 0.52, -h * 1.15, w * 0.6, -h * 1.15, w * 0.56, -h * 1.28);
    if (o.shield) { g.fillStyle(o.shield, 1); g.fillEllipse(-w * 0.55, -h * 0.45, w * 0.5, h * 0.3); g.lineStyle(1, 0xd4a94e, 1); g.strokeEllipse(-w * 0.55, -h * 0.45, w * 0.5, h * 0.3); }
  } else if (o.carry === 'tankard') {
    g.fillRect(w * 0.4, -h * 0.55, 3, h * 0.14); g.fillStyle(0x8a6a48, 1); g.fillRect(w * 0.42, -h * 0.66, 6, 8);
  } else { g.fillRect(-w * 0.55, -h * 0.6, 3, h * 0.24); g.fillRect(w * 0.45, -h * 0.6, 3, h * 0.24); }
  c.add([legL, legR, g]);
  c.__legs = [legL, legR]; c.__g = g; c.__h = h;
  c.setDepth(-9);
  return c;
}
// walk a figure to x over ms; legs swing while it moves
function walk(scene, fig, toX, ms, done) {
  const [a, b] = fig.__legs;
  fig.__stride = scene.tweens.add({ targets: a, angle: 22, duration: 180, yoyo: true, repeat: -1 });
  fig.__stride2 = scene.tweens.add({ targets: b, angle: -22, duration: 180, yoyo: true, repeat: -1 });
  fig.setScale(toX < fig.x ? -1 : 1, 1);
  scene.tweens.add({ targets: fig, x: toX, duration: ms, ease: 'Linear', onComplete: () => { stopWalk(fig); if (done) done(); } });
}
function stopWalk(fig) { try { fig.__stride.stop(); fig.__stride2.stop(); fig.__legs[0].angle = 0; fig.__legs[1].angle = 0; } catch (e) {} }

// ---- a horse-drawn carriage ------------------------------------------------
function carriage(scene, y, dir, o) {
  o = o || {};
  const c = scene.add.container(dir > 0 ? -160 : T().W + 160, y).setDepth(-9);
  const body = scene.add.graphics();
  const col = o.color || 0x3a2418;
  body.fillStyle(col, 1); body.fillRoundedRect(-40, -46, 80, 40, 6);
  body.fillStyle(0x1a1410, 1); body.fillRect(-30, -40, 22, 16); body.fillRect(8, -40, 22, 16);
  body.fillStyle(o.trim || 0xd4a94e, 1); body.fillRect(-40, -12, 80, 3);
  body.fillStyle(0x2a2420, 1); body.fillRect(-44, -6, 88, 4);   // axle beam
  // driver
  body.fillStyle(0x4a3a30, 1); body.fillRect(-52, -50, 10, 14); body.fillStyle(0xc8a080, 1); body.fillCircle(-47, -54, 4);
  const wheels = [];
  for (const wx of [-26, 26]) {
    const wg = scene.add.graphics();
    wg.lineStyle(3, 0x2a2420, 1); wg.strokeCircle(0, 0, 12);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; wg.lineBetween(Math.cos(a) * 11, Math.sin(a) * 11, -Math.cos(a) * 11, -Math.sin(a) * 11); }
    wg.setPosition(wx, 0); wheels.push(wg);
  }
  // horse ahead of the body
  const horse = scene.add.container(dir > 0 ? 80 : -80, 0);
  const hg = scene.add.graphics();
  hg.fillStyle(o.horse || 0x5a4030, 1);
  hg.fillRoundedRect(-24, -30, 48, 20, 6);
  hg.fillRect(dir > 0 ? 18 : -30, -44, 12, 22); hg.fillEllipse(dir > 0 ? 30 : -30, -46, 16, 10);
  hg.fillStyle(0x2a1c12, 1); hg.fillRect(dir > 0 ? -28 : 22, -30, 6, 14);   // tail
  const legs = [];
  for (const lx of [-16, -6, 8, 18]) { const lg = scene.add.graphics(); lg.fillStyle(o.horse || 0x5a4030, 1); lg.fillRect(-2, 0, 4, 18); lg.setPosition(lx, -12); legs.push(lg); }
  horse.add([hg].concat(legs));
  hg.lineStyle(2, 0x2a2420, 1); hg.lineBetween(dir > 0 ? -24 : 24, -22, dir > 0 ? -60 : 60, -22);   // traces
  c.add([body].concat(wheels, [horse]));
  c.__wheels = wheels; c.__legs = legs; c.__horse = horse;
  return c;
}
function roll(scene, car, toX, ms, done) {
  const spin = car.__wheels.map(w => scene.tweens.add({ targets: w, angle: 360, duration: 500, repeat: -1 }));
  const trot = car.__legs.map((l, i) => scene.tweens.add({ targets: l, angle: i % 2 ? 18 : -18, duration: 160, yoyo: true, repeat: -1 }));
  scene.tweens.add({ targets: car, x: toX, duration: ms, ease: 'Sine.easeInOut', onComplete: () => { spin.forEach(t => t.stop()); trot.forEach(t => { t.stop(); }); car.__legs.forEach(l => { l.angle = 0; }); if (done) done(); } });
}

// ---- animals ----------------------------------------------------------------
function deer(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(-9);
  const g = scene.add.graphics();
  g.fillStyle(0x8a6a48, 1); g.fillRoundedRect(-18, -26, 36, 16, 6);
  for (const lx of [-13, -5, 5, 13]) g.fillRect(lx - 1, -10, 3, 12);
  const head = scene.add.graphics();
  head.fillStyle(0x8a6a48, 1); head.fillRect(0, 0, 6, -16); head.fillEllipse(6, -18, 12, 7);
  head.lineStyle(1.5, 0x5a4030, 1); head.lineBetween(4, -22, 0, -32); head.lineBetween(4, -22, 8, -32); head.lineBetween(0, -32, -3, -36); head.lineBetween(8, -32, 11, -36);
  head.setPosition(16, -26);
  c.add([g, head]); c.__head = head;
  return c;
}
function rabbit(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(-9);
  const g = scene.add.graphics();
  g.fillStyle(0xa89a7c, 1); g.fillEllipse(0, -6, 14, 10); g.fillCircle(6, -11, 4); g.fillRect(4, -20, 2, 8); g.fillRect(8, -20, 2, 8);
  g.fillStyle(0xf4eee0, 1); g.fillCircle(-7, -6, 2);
  c.add(g); return c;
}
function fox(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(-9);
  const g = scene.add.graphics();
  g.fillStyle(0xc06030, 1); g.fillRoundedRect(-16, -14, 32, 10, 4); g.fillTriangle(16, -14, 26, -18, 20, -6);
  g.fillTriangle(18, -18, 22, -24, 24, -17); g.fillStyle(0xf4eee0, 1); g.fillTriangle(-16, -8, -30, -14, -26, -4);
  g.fillStyle(0xc06030, 1); for (const lx of [-12, -4, 4, 12]) g.fillRect(lx - 1, -4, 3, 8);
  c.add(g); return c;
}
function owl(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(-9);
  const body = scene.add.graphics(); body.fillStyle(0x5a4a3a, 1); body.fillEllipse(0, 0, 14, 20);
  const head = scene.add.graphics(); head.fillStyle(0x6a5a48, 1); head.fillCircle(0, -14, 8);
  head.fillStyle(0xf4e07a, 1); head.fillCircle(-3, -15, 2.2); head.fillCircle(3, -15, 2.2);
  head.fillStyle(0x101010, 1); head.fillCircle(-3, -15, 1); head.fillCircle(3, -15, 1);
  c.add([body, head]); c.__head = head; return c;
}
function cat(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(-9);
  const g = scene.add.graphics();
  g.fillStyle(0x2a2420, 1); g.fillEllipse(0, -6, 26, 10); g.fillCircle(12, -10, 5); g.fillTriangle(9, -14, 10, -19, 13, -14); g.fillTriangle(13, -14, 15, -19, 16, -14);
  const tail = scene.add.graphics(); tail.lineStyle(3, 0x2a2420, 1); new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(0, 0), new Phaser.Math.Vector2(-8, -10), new Phaser.Math.Vector2(-4, -18)).draw(tail, 10); tail.setPosition(-12, -6);
  c.add([g, tail]); c.__tail = tail; return c;
}
function dog(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(-9);
  const body = scene.add.graphics(); body.fillStyle(0x6a5a48, 1); body.fillEllipse(0, 0, 40, 14);
  const head = scene.add.graphics(); head.fillStyle(0x6a5a48, 1); head.fillEllipse(0, 0, 16, 10); head.fillStyle(0x4a3a30, 1); head.fillEllipse(-2, -5, 6, 4); head.setPosition(-22, 2);
  c.add([body, head]); c.__body = body; return c;
}
function bird(scene, x, y, dir) {
  const b = scene.add.graphics().setDepth(-9.5);
  b.lineStyle(1.5, 0x1a1a20, 0.8); b.lineBetween(-5, 0, -2, -3); b.lineBetween(-2, -3, 0, 0); b.lineBetween(0, 0, 2, -3); b.lineBetween(2, -3, 5, 0);
  b.setPosition(x, y);
  return b;
}

// ---- per-home life ----------------------------------------------------------
HomeLife.attach = function (scene, id, phase, clock, life) {
  const W = T().W, H = T().H;
  const actors = [];
  const keep = (o) => { actors.push(o); life.add(o); return o; };
  const timers = [];
  const later = (ms, fn) => { const t = scene.time.delayedCall(ms, () => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); if (alive(scene) && !handle.dead) fn(); }); timers.push(t); return t; };
  const every = (ms, fn) => { const t = scene.time.addEvent({ delay: ms, loop: true, callback: () => { if (alive(scene) && !handle.dead) fn(); } }); timers.push(t); return t; };
  const handle = { id, actors, timers, dead: false, destroy() { handle.dead = true; timers.forEach(t => { try { t.remove(false); } catch (e) {} }); actors.forEach(kill); actors.length = 0; } };
  const night = phase === 'night', dusk = phase === 'evening';
  const NOBLE_CLOTH = [0x6a2040, 0x203a6a, 0x2a5a3a, 0x5a2a6a, 0x7a5a20, 0x3a3a48];
  const SKINS = [0xf0d0b0, 0xd8a878, 0xb07850, 0x8a5a3a, 0x5a3a28];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  if (id === 'inn') {
    // the common room: innkeeper wiping, a serving girl on rounds, patrons drinking, a dog by the hearth
    const keeper = keep(figure(scene, 640, 392, { h: 40, cloth: 0x4a3a30, apron: true, skin: pick(SKINS), hair: 0x4a3020, carry: 'tankard' }));
    every(1400, () => scene.tweens.add({ targets: keeper.__g, angle: 6, duration: 300, yoyo: true, repeat: 1 }));
    const seats = [[250, 596], [400, 592], [560, 598], [860, 594], [1010, 598]];
    seats.forEach(([sx, sy], i) => {
      if (Math.random() < 0.25 && i > 2) return;
      const p = keep(figure(scene, sx, sy, { h: 38, cloth: pick([0x4a3a30, 0x3a4a5a, 0x5a3a2a, 0x2a3a2a]), skin: pick(SKINS), hair: pick([0x2a1c12, 0x6a4a30, 0xd8c8a0, 0x1a1a1a]), carry: 'tankard', hat: Math.random() < 0.3 ? 'cap' : null }));
      every(2600 + i * 700, () => { scene.tweens.add({ targets: p, y: sy - 4, duration: 260, yoyo: true }); scene.tweens.add({ targets: p.__g, angle: -8, duration: 380, yoyo: true }); });
    });
    const girl = keep(figure(scene, 1180, 600, { h: 38, cloth: 0x6a2a30, dress: true, apron: true, skin: pick(SKINS), hair: 0x6a4a30, carry: 'tray', hat: 'bonnet' }));
    const rounds = () => { walk(scene, girl, 300, 6000, () => later(1500, () => walk(scene, girl, 1180, 6000, () => later(rnd(4000, 8000), rounds)))); };
    later(2000, rounds);
    const d = keep(dog(scene, 1075, 610));
    const breathe = scene.tweens.add({ targets: d.__body, scaleY: 1.12, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    handle.tweens = [breathe];
    // hearth fire: embers + a warm pool
    if (ADV.VFX && ADV.VFX._tex) {
      const em = keep(scene.add.particles(1100, 470, ADV.VFX._tex.emberKey(scene), { speed: { min: 10, max: 30 }, angle: { min: 250, max: 290 }, lifespan: { min: 500, max: 1200 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffe07a, 0xe8a050], frequency: 90, quantity: 1, blendMode: 'ADD', gravityY: -20 }));
      em.setDepth(-8.5);
      const pool = keep(scene.add.image(1100, 500, ADV.VFX._tex.glowKey(scene)).setTint(0xffb060).setAlpha(0.45).setDisplaySize(360, 260).setBlendMode(Phaser.BlendModes.ADD).setDepth(-8.6));
      scene.tweens.add({ targets: pool, alpha: 0.32, duration: 240 + Math.random() * 200, yoyo: true, repeat: -1 });
    }
  }

  if (id === 'camp' || id === 'cottage') {
    // forest animals: a deer that walks in, grazes and leaves; rabbits; a fox at dusk; an owl at night; birds by day
    const groundY = id === 'cottage' ? 560 : 590;
    const visit = () => {
      const fromLeft = Math.random() < 0.5;
      const dr = keep(deer(scene, fromLeft ? -40 : W + 40, groundY - rnd(0, 20)));
      dr.setScale(fromLeft ? 1 : -1, 1);
      const stopX = fromLeft ? rnd(120, 300) : rnd(W - 300, W - 120);
      scene.tweens.add({ targets: dr, x: stopX, duration: 6000, ease: 'Sine.easeOut', onComplete: () => {
        // graze: head down, up, down
        scene.tweens.add({ targets: dr.__head, y: dr.__head.y + 14, angle: 40, duration: 900, yoyo: true, repeat: 2, hold: 1200, onComplete: () => {
          scene.tweens.add({ targets: dr, x: fromLeft ? -60 : W + 60, duration: 5000, ease: 'Sine.easeIn', onComplete: () => { kill(dr); later(rnd(18000, 30000), visit); } });
        } });
      } });
    };
    later(rnd(2000, 6000), visit);
    for (let i = 0; i < 2; i++) {
      const r = keep(rabbit(scene, rnd(200, 1000), groundY + 10));
      const hop = () => { const tx = Math.max(60, Math.min(W - 60, r.x + rnd(-120, 120))); r.setScale(tx < r.x ? -1 : 1, 1); scene.tweens.add({ targets: r, x: tx, duration: 700, onUpdate: (tw) => { r.y = groundY + 10 - Math.abs(Math.sin(tw.progress * Math.PI * 3)) * 10; }, onComplete: () => later(rnd(1500, 5000), hop) }); };
      later(rnd(500, 3000), hop);
    }
    if (dusk) { const f = keep(fox(scene, W + 40, groundY + 4)); const slink = () => { scene.tweens.add({ targets: f, x: -60, duration: 14000, ease: 'Linear', onComplete: () => { f.x = W + 40; later(rnd(12000, 20000), slink); } }); }; later(3000, slink); }
    if (night) {
      const o = keep(owl(scene, id === 'cottage' ? 1140 : 1020, id === 'cottage' ? 340 : 360)); every(2600, () => scene.tweens.add({ targets: o.__head, angle: rnd(-40, 40), duration: 260 }));
      // fireflies over the garden, and a bat now and then
      if (ADV.VFX && ADV.VFX._tex) keep(scene.add.particles(0, 0, ADV.VFX._tex.glowKey(scene), { x: { min: 100, max: W - 100 }, y: { min: groundY - 120, max: groundY + 10 }, speedX: { min: -14, max: 14 }, speedY: { min: -10, max: 10 }, lifespan: { min: 1500, max: 3200 }, scale: { min: 0.03, max: 0.06 }, alpha: { onEmit: () => 0, onUpdate: (pt, k, t) => Math.sin(Math.PI * t) * 0.9 }, tint: 0xbfff8a, frequency: 400, quantity: 1, blendMode: 'ADD' }).setDepth(-9));
      const bat = () => { const b = keep(bird(scene, -20, rnd(80, 220), 1)); b.setScale(1.3); scene.tweens.add({ targets: b, x: W + 40, y: b.y + rnd(-60, 60), duration: 7000, onComplete: () => kill(b) }); scene.tweens.add({ targets: b, scaleY: 0.4, duration: 120, yoyo: true, repeat: -1 }); later(rnd(9000, 18000), bat); };
      later(rnd(2000, 6000), bat);
    }
    if (!night) {
      const flock = () => { const y = rnd(60, 160), dir = Math.random() < 0.5 ? 1 : -1; for (let i = 0; i < 4; i++) { const b = keep(bird(scene, dir > 0 ? -20 - i * 16 : W + 20 + i * 16, y + (i % 2) * 8, dir)); scene.tweens.add({ targets: b, x: dir > 0 ? W + 40 : -40, duration: 13000 + i * 300, onComplete: () => kill(b) }); scene.tweens.add({ targets: b, scaleY: 0.3, duration: 220, yoyo: true, repeat: -1 }); } later(rnd(15000, 25000), flock); };
      later(rnd(1000, 5000), flock);
    }
  }

  if (id === 'brick') {
    // a lusher garden: corn that sways in the wind, flowers that turn to the sun by day and glow by moonlight
    const wind = ADV.Weather && scene.game_ && scene.game_.world ? Math.abs(ADV.Weather.at(scene.game_.world).wind || 0.3) : 0.3;
    for (let i = 0; i < 11; i++) {
      const x = 130 + i * 20, y = 520;
      const stalk = scene.add.graphics();
      stalk.fillStyle(0x4a7a2a, 1); stalk.fillRect(-2, -70 - (i % 3) * 8, 4, 70 + (i % 3) * 8);
      stalk.fillStyle(0x5d9a4a, 1); stalk.fillTriangle(0, -30, -14, -48, 0, -40); stalk.fillTriangle(0, -50, 14, -66, 0, -58);
      stalk.fillStyle(0xd8c04a, 1); stalk.fillEllipse(5, -44, 6, 14);
      stalk.setPosition(x, y); keep(stalk);
      scene.tweens.add({ targets: stalk, angle: 3 + wind * 5, duration: 1400 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 });
      scene.tweens.add({ targets: stalk, angle: -(3 + wind * 5), duration: 1400 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 + 1400 + i * 90 });
    }
    const petals = [0xe86a80, 0xf4e07a, 0xe8a050, 0xc080e0, 0xf4eee0];
    for (let i = 0; i < 12; i++) {
      const x = 960 + (i % 6) * 32, y = 528 + Math.floor(i / 6) * 18;
      const stem = scene.add.graphics(); stem.fillStyle(0x3a7a3a, 1); stem.fillRect(-1, -22, 2, 22); stem.setPosition(x, y); keep(stem);
      const head = scene.add.container(x, y - 22); keep(head);
      const hg = scene.add.graphics(); const col = petals[i % petals.length];
      hg.fillStyle(col, 1); for (let p = 0; p < 6; p++) { const a = (p / 6) * Math.PI * 2; hg.fillEllipse(Math.cos(a) * 5, Math.sin(a) * 5, 6, 4); }
      hg.fillStyle(0xf4e07a, 1); hg.fillCircle(0, 0, 3);
      head.add(hg);
      if (night) { const glow = scene.add.image(0, 0, ADV.VFX && ADV.VFX._tex ? ADV.VFX._tex.glowKey(scene) : null).setTint(col).setAlpha(0.35).setDisplaySize(28, 28).setBlendMode(Phaser.BlendModes.ADD); head.add(glow); scene.tweens.add({ targets: glow, alpha: 0.6, duration: 1800 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); head.setAngle(-20); }
      else { head.setAngle(dusk ? 25 : -25); scene.tweens.add({ targets: head, angle: dusk ? 35 : -10, duration: 9000 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    }
    const ct = keep(cat(scene, 330, 486)); every(3200, () => scene.tweens.add({ targets: ct.__tail, angle: rnd(-25, 25), duration: 500, yoyo: true }));
  }

  if (id === 'mansion' || id === 'castle') {
    const castle = id === 'castle';
    const laneY = castle ? 592 : 560, doorX = castle ? 620 : 620, stopX = castle ? 780 : 760;
    // carriages: arrive, stop at the steps, a passenger walks up to the door, roll off the other side
    const arrive = () => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const car = keep(carriage(scene, laneY, dir, { color: pick([0x3a2418, 0x1a1a2a, 0x4a1a1a, 0x1a2a1a]), trim: pick([0xd4a94e, 0xc8c8d0]), horse: pick([0x5a4030, 0x2a2420, 0xb0a090]) }));
      const sx = dir > 0 ? stopX - 240 : stopX;
      roll(scene, car, sx, 5200, () => {
        const noble = Math.random() < 0.5;
        const p = keep(figure(scene, car.x + (dir > 0 ? 44 : -44), laneY, castle ? { h: 36, cloth: pick(NOBLE_CLOTH), dress: noble, cloak: pick(NOBLE_CLOTH), hat: noble ? 'circlet' : 'cap', skin: pick(SKINS), hair: pick([0x2a1c12, 0x6a4a30, 0xd8c8a0, 0x1a1a1a, 0xc8c8c8]) }
          : { h: 36, cloth: pick(NOBLE_CLOTH), dress: noble, hat: noble ? 'bonnet' : 'cap', skin: pick(SKINS), hair: pick([0x2a1c12, 0x6a4a30, 0xd8c8a0]) }));
        p.setAlpha(0); scene.tweens.add({ targets: p, alpha: 1, duration: 300 });
        later(600, () => {
          const steward = castle ? keep(figure(scene, doorX + 30, laneY - 40, { h: 34, cloth: 0x2a2a34, hat: 'cap', skin: pick(SKINS) })) : null;
          walk(scene, p, doorX, 2600, () => {
            scene.tweens.add({ targets: p, y: laneY - 40, alpha: 0, duration: 900, delay: 300, onComplete: () => kill(p) });
            if (steward) scene.tweens.add({ targets: steward, alpha: 0, duration: 700, delay: 900, onComplete: () => kill(steward) });
          });
          later(1200, () => roll(scene, car, dir > 0 ? W + 200 : -200, 6000, () => { kill(car); later(castle ? rnd(1500, 4000) : rnd(18000, 30000), arrive); }));
        });
      });
    };
    later(castle ? 1200 : rnd(3000, 8000), arrive);
    if (!castle) {
      // maids and butlers crossing the porch with trays of food and wine
      const serve = () => {
        const maid = Math.random() < 0.5;
        const fromLeft = Math.random() < 0.5;
        const f = keep(figure(scene, fromLeft ? 300 : 940, 498, maid ? { h: 34, cloth: 0x1a1a1a, dress: true, apron: true, hat: 'bonnet', carry: pick(['tray', 'decanter', 'cake']), skin: pick(SKINS), hair: pick([0x2a1c12, 0x6a4a30, 0xd8c8a0]) } : { h: 36, cloth: 0x1a1a22, hat: null, carry: pick(['tray', 'decanter']), skin: pick(SKINS), hair: pick([0x2a1c12, 0xc8c8c8]) }));
        walk(scene, f, fromLeft ? 620 : 620, 4200, () => { scene.tweens.add({ targets: f, alpha: 0, y: f.y - 20, duration: 600, onComplete: () => kill(f) }); later(rnd(5000, 11000), serve); });
      };
      later(2500, serve);
      if (night || dusk) every(4000, () => { const s = keep(scene.add.rectangle(pick([402, 482, 722, 802]), 315, 12, 30, 0x1a1410, 0.8)); scene.tweens.add({ targets: s, x: s.x + rnd(-20, 20), duration: 2500, onComplete: () => kill(s) }); });
    } else {
      // guards flanking the gate; farmland with rows, a windmill, labourers; banners in the wind
      for (const gx of [540, 700]) {
        const gd = keep(figure(scene, gx, 560, { h: 40, cloth: 0x8a8a92, hat: 'helm', carry: 'spear', shield: 0x6a4a8a, skin: pick(SKINS) }));
        every(3000 + (gx % 7) * 400, () => { scene.tweens.add({ targets: gd, x: gd.x + rnd(-3, 3), duration: 400, yoyo: true }); if (Math.random() < 0.4) scene.tweens.add({ targets: gd.__g, angle: rnd(-6, 6), duration: 400, yoyo: true }); });
      }
      const farm = scene.add.graphics().setDepth(-9.8); keep(farm);
      farm.fillStyle(night ? 0x2a3020 : 0x7a8a40, 1); farm.fillRect(0, 470, 240, 70); farm.fillRect(1040, 470, 240, 70);
      farm.lineStyle(1, night ? 0x1a2018 : 0x5a6a30, 1);
      for (let i = 0; i < 9; i++) { farm.lineBetween(0, 476 + i * 7, 240, 470 + i * 8); farm.lineBetween(1040, 470 + i * 8, W, 476 + i * 7); }
      const mill = scene.add.graphics().setDepth(-9.9); mill.fillStyle(0x6a5a48, 1); mill.fillTriangle(110, 470, 130, 400, 150, 470); mill.setPosition(0, 0); keep(mill);
      const sails = scene.add.graphics(); sails.lineStyle(3, 0xe8dfc8, 1); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; sails.lineBetween(0, 0, Math.cos(a) * 28, Math.sin(a) * 28); } sails.setPosition(130, 404); sails.setDepth(-9.85); keep(sails);
      scene.tweens.add({ targets: sails, angle: 360, duration: 9000, repeat: -1 });
      for (let i = 0; i < 3; i++) { const lb = keep(figure(scene, 40 + i * 70, 520 + (i % 2) * 8, { h: 22, cloth: 0x6a5a40, hat: 'cap', skin: pick(SKINS) })); scene.tweens.add({ targets: lb.__g, angle: 30, duration: 1200 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
      for (const [bx, by, col] of [[274, 60, 0x6a4a8a], [926, 50, 0xa8352c]]) { const bn = scene.add.graphics().setDepth(-9.9); bn.fillStyle(col, 1); bn.fillTriangle(0, 0, 0, 34, 22, 17); bn.setPosition(bx, by); keep(bn); scene.tweens.add({ targets: bn, scaleX: 0.7, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    }
  }
  scene.homeLifeActors = handle;
  return handle;
};

ADV.HomeLife = HomeLife;
})();
