// Per-skill, per-tier combat recipes. Composes VFX atoms; never throws.
// play() returns the wait the combat scene should use. Residue may outlive it.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const V = () => ADV.VFX;
const FIRE = 0xe86a30, ICE = 0x6fc0e8, LIT = 0xf4e07a;
const POI = 0x7fa848, BLD = 0xa8352c, SHD = 0x4a3a5a;
const HOLY = 0xf4eee0, NAT = 0x5d8a4a, STL = 0xcfd8e8;
const GOLD = 0xd4a94e, ASH = 0x4a4038, PURP = 0x9a70c0;
const SLOT_Y = [170, 330, 490];
const FXD = 530;

function kill(o) { try { if (o && o.destroy) o.destroy(); } catch (e) {} }

function tp(tier) {
  if (tier === 'advanced') return { n: 6, scale: 1.6, reach: 'lane', wait: 520 };
  if (tier === 'intermediate') return { n: 2, scale: 1.25, reach: 'two', wait: 340 };
  return { n: 1, scale: 1, reach: 'one', wait: 260 };
}

function waitOf(tier, skillId) {
  if (skillId === 'basic_attack') return 180;
  return tp(tier).wait;
}

function tierChain(draw) {
  return {
    basic: (sc, ctx) => draw(sc, ctx, tp('basic')),
    intermediate: (sc, ctx) => draw(sc, ctx, tp('intermediate')),
    advanced: (sc, ctx) => draw(sc, ctx, tp('advanced')),
  };
}

function foes(scene, src, tgt) {
  const out = [];
  if (scene.unitViews) {
    for (const v of scene.unitViews.values()) {
      if (!v.u || v.u.downed || v.u.fled) continue;
      if (src && src.u && v.u.side === src.u.side) continue;
      out.push(v);
    }
  }
  if (!out.length && tgt) out.push(tgt);
  return out;
}

function laneOf(scene, tgt) {
  if (!tgt) return [];
  if (scene.unitViews && tgt.u) {
    const out = [];
    for (const v of scene.unitViews.values()) {
      if (!v.u || v.u.downed || v.u.fled) continue;
      if (v.u.side === tgt.u.side && v.u.lane === tgt.u.lane) out.push(v);
    }
    if (out.length) return out;
  }
  return SLOT_Y.map(y => ({ x: tgt.x, y, img: tgt.img, u: tgt.u }));
}

function alliesOf(scene, src) {
  const out = [];
  if (scene.unitViews && src && src.u) {
    for (const v of scene.unitViews.values()) {
      if (!v.u || v.u.downed || v.u.fled) continue;
      if (v.u.side === src.u.side) out.push(v);
    }
  }
  if (!out.length && src) out.push(src);
  return out;
}

function twoOf(scene, src, tgt) {
  const all = foes(scene, src, tgt);
  if (tgt) {
    const i = all.indexOf(tgt);
    if (i > 0) { all.splice(i, 1); all.unshift(tgt); }
    else if (i < 0) all.unshift(tgt);
  }
  return all.slice(0, 2);
}

function residue(scene, x, y, color, tier) {
  if (tier === 'basic') return;
  V().motes(scene, x, y, color, tier === 'advanced' ? 5 : 3);
  if (tier === 'advanced') V().groundCrack(scene, x, y, color, { dur: 900, n: 3 });
}

function boom(scene, ctx, mag) {
  if (ctx.tier !== 'advanced') return;
  if (V().camShake) V().camShake(scene, mag || 0.005);
}

function sx(src) { return src ? src.x : 400; }
function sy(src) { return src ? src.y : 330; }
function tx(tgt, src) { return tgt ? tgt.x : sx(src) + 200; }
function ty(tgt, src) { return tgt ? tgt.y : sy(src); }

// ---- mage -----------------------------------------------------------------
function fireBolt(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  const color = FIRE;
  const x1 = sx(src), y1 = sy(src);
  if (ctx.tier === 'advanced') {
    if (V().cine) { V().cine.letterbox(scene, true); V().cine.chargeUp(scene, src, color); V().cine.camMove(scene, 'pushIn'); }
    const cx = tgt ? tgt.x : x1 + 220 * dir;
    const flight = V().comet ? V().comet(scene, x1, y1, cx, SLOT_Y[1], {
      r: 22, trail: 2, accel: true, hum: true, boom: 3.5, arc: 30,
    }) : 320;
    SLOT_Y.forEach((y, i) => {
      scene.time.delayedCall(flight + i * 80, () => {
        if (V().explosion) V().explosion(scene, cx, y, { scale: i === 1 ? 3.5 : 2.2, color });
        else { V().plume(scene, cx, y, color, { n: 4, scale: 1.6 }); V().shockwave(scene, cx, y, color, { scale: 2.4 }); }
      });
    });
    scene.time.delayedCall(flight, () => {
      V().screenSweep(scene, color, { dir, dur: 260 });
      if (V().cine) { V().cine.camMove(scene, 'whip', { x: 16 * dir }); V().cine.impactFrame(scene, tgt && tgt.img); }
      if (V().zoomPunch) V().zoomPunch(scene);
      residue(scene, cx, SLOT_Y[1], color, 'advanced');
    });
    scene.time.delayedCall(flight + 400, () => { if (V().cine) V().cine.letterbox(scene, false); });
    return p.wait;
  }
  if (ctx.tier === 'intermediate') {
    const hits = foes(scene, src, tgt);
    if (tgt) {
      const i = hits.indexOf(tgt);
      if (i > 0) { hits.splice(i, 1); hits.unshift(tgt); }
      else if (i < 0) hits.unshift(tgt);
    }
    const dest = hits.length ? hits.slice(0, 3) : [{ x: tx(tgt, src), y: ty(tgt, src) }];
    while (dest.length < 3) dest.push(dest[0]);
    dest.forEach((v, i) => {
      const go = () => {
        if (V().comet) V().comet(scene, x1, y1 + (i - 1) * 10, v.x, v.y, { r: 10, boom: 1.4, arc: 16 + i * 6 });
        else { V().bolt(scene, x1, y1, v.x, v.y, color, { segs: 5, w: 3 }); V().plume(scene, v.x, v.y, color, { n: 3 }); }
      };
      if (i) scene.time.delayedCall(i * 60, go); else go();
    });
    residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
    return p.wait;
  }
  if (V().comet) V().comet(scene, x1, y1, tx(tgt, src), ty(tgt, src), { r: 8, boom: 1, arc: 18 });
  else {
    V().bolt(scene, x1, y1, tx(tgt, src), ty(tgt, src), color, { segs: 5, w: 3 });
    V().plume(scene, tx(tgt, src), ty(tgt, src), color, { n: 3 });
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function frostTouch(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = ICE;
  const x1 = sx(src), y1 = sy(src);
  if (ctx.tier === 'advanced') {
    if (V().cine) { V().cine.letterbox(scene, true); V().cine.chargeUp(scene, src, color); }
    if (V().blizzard) V().blizzard(scene, { x: 40, y: 110, w: 1200, h: 520 });
    else V().laneWave(scene, tgt ? tgt.x : x1 + 200, color, { scale: 2 });
    const hits = foes(scene, src, tgt);
    hits.forEach((v, i) => scene.time.delayedCall(200 + i * 40, () => {
      if (V().freezeOver) V().freezeOver(scene, v);
      V().frostSpikes(scene, v.x, v.y, color, { n: 5, scale: 1.3 });
    }));
    boom(scene, ctx, 0.004);
    scene.time.delayedCall(500, () => { if (V().cine) V().cine.letterbox(scene, false); });
    residue(scene, tx(tgt, src), ty(tgt, src), color, 'advanced');
    return p.wait;
  }
  const hits = ctx.tier === 'intermediate' ? twoOf(scene, src, tgt) : (tgt ? [tgt] : []);
  if (!hits.length && tgt) hits.push(tgt);
  hits.forEach((v, i) => {
    const go = () => {
      if (V().iceLance) V().iceLance(scene, x1, y1, v.x, v.y, { scale: p.scale });
      else { V().bolt(scene, x1, y1, v.x, v.y, color, { segs: 4, w: 3 }); V().shards(scene, v.x, v.y, color, 4, { scale: p.scale }); }
      if (ctx.tier === 'intermediate' && V().freezeOver) V().freezeOver(scene, v, { hold: false, dur: 480 });
      if (i && hits[i - 1]) V().beam(scene, hits[i - 1].x, hits[i - 1].y, v.x, v.y, color, { w: 2, dur: 220 });
    };
    if (i) scene.time.delayedCall(i * 80, go); else go();
  });
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function sparkFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = LIT;
  if (ctx.tier === 'advanced') {
    if (V().cine) { V().cine.letterbox(scene, true); V().cine.chargeUp(scene, src, color); }
    const veil = scene.add.rectangle(ADV.T.W / 2, ADV.T.H / 2, ADV.T.W, ADV.T.H, 0x2a3444, 0).setDepth(6);
    scene.tweens.add({ targets: veil, alpha: 0.35, duration: 200, yoyo: true, hold: 280, onComplete: () => kill(veil) });
    const hits = foes(scene, src, tgt);
    const list = hits.length ? hits : (tgt ? [tgt] : []);
    list.forEach((v, i) => {
      scene.time.delayedCall(200 + i * 60, () => {
        if (V().lightningStreak) V().lightningStreak(scene, v.x + (Math.random() * 40 - 20), 36, v.x, v.y, { scale: 1.1 });
        else V().bolt(scene, v.x, 36, v.x, v.y, color, { segs: 7, w: 3 });
        if (V().camShake) V().camShake(scene, 0.003);
      });
    });
    scene.time.delayedCall(200 + list.length * 60, () => {
      if (V().flashOverlay) V().flashOverlay(scene, 0xffffff, 0.3);
      if (V().cine) { V().cine.impactFrame(scene, tgt && tgt.img); V().cine.letterbox(scene, false); }
    });
    residue(scene, tx(tgt, src), ty(tgt, src), color, 'advanced');
    return p.wait;
  }
  const chain = ctx.tier === 'intermediate' ? twoOf(scene, src, tgt) : (tgt ? [tgt] : []);
  if (!chain.length && tgt) chain.push(tgt);
  let px = sx(src), py = sy(src);
  chain.forEach((v, i) => {
    const fromX = px, fromY = py;
    px = v.x; py = v.y;
    const go = () => {
      if (V().lightningStreak) V().lightningStreak(scene, fromX, fromY, v.x, v.y, { scale: i ? 0.75 : 1, branches: i ? 2 : 3 });
      else {
        V().bolt(scene, fromX, fromY, v.x, v.y, color, { segs: 6, w: 2 + p.scale });
        V().bolt(scene, fromX, fromY, v.x, v.y, 0xffffff, { segs: 5, w: 1, dur: 100 });
      }
      V().burst(scene, v.x, v.y, color, 4);
    };
    if (i) scene.time.delayedCall(i * 40, go); else go();
  });
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function emberLash(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = FIRE, scale = p.scale;
  const hits = p.reach === 'lane' ? laneOf(scene, tgt) : (tgt ? [tgt] : [{ x: tx(tgt, src), y: ty(tgt, src) }]);
  hits.forEach((v, i) => {
    const go = () => {
      const g = scene.add.graphics().setDepth(FXD);
      g.lineStyle(5 * scale, color, 1);
      const mx = (sx(src) + v.x) / 2, my = (sy(src) + v.y) / 2 - 46 * scale;
      g.beginPath(); g.moveTo(sx(src), sy(src));
      if (g.quadraticCurveTo) g.quadraticCurveTo(mx, my, v.x, v.y);
      else { g.lineTo(mx, my); g.lineTo(v.x, v.y); }
      g.strokePath();
      scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => kill(g) });
      if (V().emberTrail) {
        const tip = scene.add.circle(sx(src), sy(src), 3, 0xffe07a).setDepth(FXD);
        V().emberTrail(scene, tip, { scale, ms: 200 });
        scene.tweens.add({ targets: tip, x: v.x, y: v.y, duration: 180, onComplete: () => kill(tip) });
      }
      V().spray(scene, v.x, v.y, ctx.dir || 1, color, { n: 4, scale });
      V().plume(scene, v.x, v.y, color, { n: 2, scale: 0.8 * scale });
    };
    if (i) scene.time.delayedCall(i * 40, go); else go();
  });
  if (p.reach === 'lane') boom(scene, ctx, 0.004);
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function rimeGrasp(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = ICE;
  const hits = p.reach === 'two' || ctx.tier === 'advanced' ? twoOf(scene, src, tgt) : (tgt ? [tgt] : []);
  if (!hits.length) hits.push({ x: tx(tgt, src), y: ty(tgt, src) });
  hits.forEach((v, i) => {
    const go = () => {
      for (let k = 0; k < 3; k++) {
        scene.time.delayedCall(k * 60, () => {
          V().frostSpikes(scene, v.x, v.y - k * 10, color, { n: 4 + p.n, r: (36 + k * 8) * p.scale, scale: p.scale });
        });
      }
      scene.time.delayedCall(180, () => V().ring(scene, v.x, v.y, color, { r: 18, scale: 1.6 * p.scale, dur: 240 }));
      if (V().freezeOver && v.img) V().freezeOver(scene, v, { hold: false, dur: 400 });
    };
    if (i) scene.time.delayedCall(i * 60, go); else go();
  });
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

// ---- melee ----------------------------------------------------------------
function cleaveFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = STL;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  if (ctx.tier === 'advanced') {
    V().sweep(scene, sx(src), sy(src), color, { r: 70, from: -3.1, to: 3.1, w: 6, dur: 280 });
    V().sweep(scene, sx(src), sy(src), color, { r: 52, from: 0.2, to: 3.0, w: 4, ang: 40, dur: 240 });
    boom(scene, ctx, 0.004);
  } else if (ctx.tier === 'intermediate') {
    V().sweep(scene, tx(tgt, src), ty(tgt, src), color, { r: 50, w: 5 });
    V().sweep(scene, tx(tgt, src), ty(tgt, src), color, { r: 40, from: -0.4, to: 2.2, ang: 70, w: 4 });
  } else {
    V().sweep(scene, tx(tgt, src), ty(tgt, src), color, { r: 48, w: 5 });
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function sunderFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = GOLD;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  V().beam(scene, tx(tgt, src), ty(tgt, src) - 70 * p.scale, tx(tgt, src), ty(tgt, src) + 20, color, { w: 6 * p.scale, dur: 140 });
  V().shards(scene, tx(tgt, src), ty(tgt, src), color, 3 + p.n, { scale: p.scale });
  if (ctx.tier === 'advanced') {
    V().groundCrack(scene, tx(tgt, src), ty(tgt, src), color, { n: 5, dur: 1000 });
    boom(scene, ctx, 0.005);
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function backstabFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = BLD, dir = ctx.dir || 1;
  if (src && src.img) {
    const img = src.img, x0 = img.x;
    img.setAlpha(0.25);
    img.x = tx(tgt, src) - 36 * dir;
    scene.tweens.add({ targets: img, alpha: 1, duration: 80 });
    scene.time.delayedCall(160, () => {
      scene.tweens.add({ targets: img, x: x0, duration: 90 });
    });
  }
  V().stab(scene, tx(tgt, src), ty(tgt, src), dir, color, { w: 5 * p.scale });
  if (ctx.tier !== 'basic') V().drip(scene, tx(tgt, src), ty(tgt, src), color, { n: 3 });
  if (ctx.tier === 'advanced') {
    V().spray(scene, tx(tgt, src), ty(tgt, src), dir, color, { n: 6, scale: 1.4 });
    if (V().hitStop) V().hitStop(scene, 70);
    boom(scene, ctx, 0.006);
  }
  return p.wait;
}

function venomFang(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = POI, dir = ctx.dir || 1;
  if (src && src.img) V().lunge(scene, src.img, dir);
  V().stab(scene, tx(tgt, src), ty(tgt, src) - 6, dir, color, { w: 4 });
  V().stab(scene, tx(tgt, src), ty(tgt, src) + 8, dir, BLD, { w: 3 });
  V().motes(scene, tx(tgt, src), ty(tgt, src), color, 3 + p.n);
  V().drip(scene, tx(tgt, src), ty(tgt, src), BLD, { n: 2 + p.n });
  if (ctx.tier === 'advanced') {
    laneOf(scene, tgt).forEach(v => V().motes(scene, v.x, v.y, color, 4));
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function katanaFx(scene, ctx) {
  const tgt = ctx.tgt, src = ctx.src, color = STL;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(3, color, 1);
  g.lineBetween(tx(tgt, src) - 72, ty(tgt, src), tx(tgt, src) + 72, ty(tgt, src));
  scene.tweens.add({ targets: g, alpha: 0, duration: 110, onComplete: () => kill(g) });
  return 160;
}

function basicAtk(scene, ctx) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  if (src && src.img) V().lunge(scene, src.img, dir);
  V().stab(scene, tx(tgt, src), ty(tgt, src), dir, STL, { w: 3, dur: 120 });
  return 180;
}

function finisherFx(scene, ctx) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  if (src && src.img) V().lunge(scene, src.img, dir);
  V().sweep(scene, tx(tgt, src), ty(tgt, src), BLD, { w: 8, r: 58, dur: 260 });
  V().beam(scene, tx(tgt, src) - 80, ty(tgt, src), tx(tgt, src) + 80, ty(tgt, src), BLD, { w: 4, dur: 160 });
  if (V().hitStop) V().hitStop(scene, 80);
  if (V().camShake) V().camShake(scene, 0.007);
  return 400;
}

function counterFx(scene, ctx) {
  const src = ctx.src, color = STL;
  V().sweep(scene, sx(src), sy(src), color, { from: 0.6, to: 2.8, ang: 30, r: 44, w: 5, dur: 160 });
  V().ring(scene, sx(src), sy(src), color, { r: 20, scale: 1.5, dur: 200 });
  return 200;
}

// ---- support --------------------------------------------------------------
function smokeBomb(scene, ctx, p) {
  const src = ctx.src, color = SHD;
  V().cloud(scene, sx(src), sy(src), color, { r: 26 * p.scale, scale: 2.4 * p.scale, a: 0.8, dur: 420 });
  V().cloud(scene, sx(src) + 12, sy(src) - 8, ASH, { r: 18 * p.scale, scale: 2, a: 0.55, dur: 380 });
  if (src && src.img) {
    scene.tweens.add({ targets: src.img, alpha: 0.35, duration: 180 });
    if (ctx.tier === 'advanced') {
      const ghost = scene.add.rectangle(src.img.x, src.img.y, 40, 52, SHD, 0.45).setDepth(FXD);
      scene.tweens.add({
        targets: ghost, x: src.img.x + 48 * (ctx.dir || 1), alpha: 0, duration: 280,
        onComplete: () => kill(ghost),
      });
    }
  }
  return p.wait;
}

function aimedShot(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = STL;
  const aim = scene.add.graphics().setDepth(FXD);
  aim.lineStyle(1, color, 0.7);
  aim.lineBetween(sx(src), sy(src), tx(tgt, src), ty(tgt, src));
  scene.tweens.add({ targets: aim, alpha: 0, duration: 140, delay: 80, onComplete: () => kill(aim) });
  if (p.reach === 'lane') {
    foes(scene, src, tgt).forEach((v, i) => {
      const go = () => V().beam(scene, sx(src), sy(src) - 8 + (i % 3) * 6, v.x, v.y, color, { w: 2, dur: 120 });
      if (i) scene.time.delayedCall(i * 35, go); else go();
    });
    boom(scene, ctx, 0.004);
  } else {
    V().beam(scene, sx(src), sy(src), tx(tgt, src), ty(tgt, src), color, { w: 3 * p.scale, dur: 140 });
    if (ctx.tier === 'intermediate' && tgt) {
      V().beam(scene, tx(tgt, src), ty(tgt, src), tx(tgt, src) + 80 * (ctx.dir || 1), ty(tgt, src), color, { w: 2, dur: 120 });
    }
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function snareFx(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src, color = NAT;
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt) : (tgt ? [tgt] : []);
  hits.forEach(v => {
    const g = scene.add.graphics().setDepth(FXD);
    g.lineStyle(2, color, 1);
    for (let i = 0; i < 3; i++) {
      const a = 0.4 + i * 0.5;
      g.lineBetween(v.x + Math.cos(a) * 28, v.y + 36, v.x, v.y + 20);
      g.lineBetween(v.x - Math.cos(a) * 28, v.y + 36, v.x, v.y + 20);
    }
    scene.tweens.add({ targets: g, alpha: 0, duration: ctx.tier === 'advanced' ? 900 : 320, onComplete: () => kill(g) });
  });
  if (ctx.tier === 'advanced') V().laneWave(scene, tgt ? tgt.x : sx(src) + 200, color, { scale: 1.8 });
  return p.wait;
}

// ---- druid (Part C5) ---------------------------------------------------------
function thornRing(scene, v, scale, dur) {
  const g = scene.add.graphics().setDepth(FXD);
  const rx = (v.img ? v.img.displayWidth : 92) / 2 * scale + 4, ry = (v.img ? v.img.displayHeight : 116) / 2 * scale + 4;
  g.lineStyle(2.2, 0x24401c, 1);
  for (let i = 0; i < 40; i++) {
    const a0 = (i / 40) * Math.PI * 2, a1 = ((i + 1) / 40) * Math.PI * 2;
    g.lineBetween(v.x + Math.cos(a0) * rx, v.y + Math.sin(a0) * ry, v.x + Math.cos(a1) * rx, v.y + Math.sin(a1) * ry);
    if (i % 3 === 0) g.lineBetween(v.x + Math.cos(a0) * rx, v.y + Math.sin(a0) * ry, v.x + Math.cos(a0 + 0.5) * (rx + 9), v.y + Math.sin(a0 + 0.5) * (ry + 9));
  }
  g.setAlpha(0); scene.tweens.add({ targets: g, alpha: 1, duration: 160, yoyo: true, hold: dur || 400, onComplete: () => kill(g) });
  return g;
}
function thornSkin(scene, ctx, p) {
  const src = ctx.src, color = NAT;
  const cover = ctx.tier === 'advanced' ? alliesOf(scene, src) : ctx.tier === 'intermediate' ? laneOf(scene, src) : (src ? [src] : []);
  cover.forEach((v, i) => scene.time.delayedCall(i * 40, () => { thornRing(scene, v, p.scale, 500); V().ring(scene, v.x, v.y, color, { r: 28, scale: 1.3, dur: 280 }); }));
  return p.wait;
}
function thornLash(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  const x1 = sx(src), y1 = sy(src), x2 = tx(tgt, src), y2 = ty(tgt, src);
  let ms = 260;
  if (V().comet) ms = V().comet(scene, x1, y1, x2, y2, { r: 6 * p.scale, color: 0x3a7a3a, trail: 1, arc: 40, boom: 0 }) || 260;
  scene.time.delayedCall(ms, () => {
    V().groundCrack(scene, x2, y2, 0x24401c, { n: 5, dur: 600 });
    V().frostSpikes(scene, x2, y2 + 20, 0x3a7a3a, { n: 6, r: 34 * p.scale, scale: p.scale });
    V().spray(scene, x2, y2, dir, POI, { n: 4, scale: p.scale });
    if (tgt && tgt.img && V().cine) V().cine.impactFrame(scene, tgt.img);
  });
  return p.wait;
}
function growthField(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt;
  const lane = tgt && tgt.u ? laneOf(scene, tgt) : (src ? [src] : []);
  lane.forEach((v, i) => scene.time.delayedCall(i * 50, () => {
    // grass tufts stay as terrain marks for the fight
    const g = scene.add.graphics().setDepth(-3);
    g.lineStyle(2, 0x5d9a4a, 0.9);
    for (let k = 0; k < 9; k++) { const gx = v.x - 40 + k * 10, gy = v.y + 58; g.lineBetween(gx, gy, gx + (k % 2 ? 3 : -3), gy - 8 - (k % 3) * 3); }
    scene.__terrain = scene.__terrain || []; scene.__terrain.push(g);
    V().motes(scene, v.x, v.y, NAT, 5);
  }));
  V().lightField(scene, tx(tgt, src), ty(tgt, src) + 30, 0x5d9a4a, 120 * p.scale, 500);
  return p.wait;
}
function stormShape(scene, ctx, p) {
  const src = ctx.src;
  if (src && V().lightningStreak) { for (let i = 0; i < 3; i++) scene.time.delayedCall(i * 90, () => V().lightningStreak(scene, src.x - 40 + i * 40, src.y - 120, src.x, src.y - 50, { scale: 0.6 })); }
  V().ring(scene, sx(src), sy(src), LIT, { r: 24, scale: 2 * p.scale, dur: 300 });
  return p.wait;
}

function beastShape(scene, ctx, p) {
  const src = ctx.src, color = NAT;
  if (src && src.img) {
    V().scalePunch(scene, src.img);
    try { src.img.setTint(0x6a8a4a); } catch (e) {}
    scene.time.delayedCall(480, () => { try { src.img.clearTint(); } catch (e) {} });
  }
  V().ring(scene, sx(src), sy(src), color, { r: 24, scale: 2 * p.scale, dur: 300 });
  V().plume(scene, sx(src), sy(src) + 20, color, { n: 3, scale: p.scale });
  return p.wait;
}

function witherTouch(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = SHD;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt).slice(0, 2).concat(tgt ? [tgt] : []).filter(Boolean) : (tgt ? [tgt] : []);
  const seen = [];
  hits.forEach(v => {
    if (seen.indexOf(v) >= 0) return;
    seen.push(v);
    V().cloud(scene, v.x, v.y, color, { r: 20 * p.scale, a: 0.55, scale: 1.8, dur: 320 });
    V().motes(scene, v.x, v.y, POI, 3);
    if (V().witherCrosses) V().witherCrosses(scene, v.x, v.y);
    if (v.img) {
      try { v.img.setTint(0x555555); } catch (e) {}
      scene.time.delayedCall(360, () => { try { v.img.clearTint(); } catch (e) {} });
    }
  });
  return p.wait;
}

// ---- healer (HEALER_DRUID_PROMPT.md Part B) --------------------------------
// The crosses and the number land on the `heal` event (scene_combat), so the
// cast recipes here are the DELIVERY: the beam, the ring, the flash.
function healTargets(scene, ctx) {
  const src = ctx.src, tgt = ctx.tgt;
  if (ctx.tier === 'basic') return tgt ? [tgt] : (src ? [src] : []);
  const all = alliesOf(scene, src).filter(v => v !== tgt).sort((a, b) => (a.u ? a.u.chp / a.u.maxHp : 1) - (b.u ? b.u.chp / b.u.maxHp : 1));
  return (tgt ? [tgt] : []).concat(all).slice(0, ctx.tier === 'advanced' ? 4 : 2);
}
function mendFx(scene, ctx, p) {
  const src = ctx.src, color = HOLY;
  const hits = healTargets(scene, ctx);
  hits.forEach((v, i) => {
    const go = () => {
      if (src && v !== src) V().beam(scene, sx(src), sy(src), v.x, v.y, 0xfff0c0, { w: 3 + p.scale, dur: 220 });
      V().ring(scene, v.x, v.y, color, { r: 18, scale: 1.6 * p.scale, dur: 260 });
      V().lightField(scene, v.x, v.y, 0xfff0c0, 70 * p.scale, 320);
    };
    if (i) scene.time.delayedCall(i * 60, go); else go();
  });
  return p.wait;
}

function regenFx(scene, ctx, p) {
  if (ctx.name === 'Poison') {
    const hits = ctx.tgt && ctx.src && ctx.tgt.u && ctx.src.u && ctx.tgt.u.side !== ctx.src.u.side
      ? [ctx.tgt] : foes(scene, ctx.src, ctx.tgt);
    hits.forEach((v, i) => {
      const go = () => {
        V().motes(scene, v.x, v.y, POI, 4 + p.n);
        V().ring(scene, v.x, v.y, POI, { r: 16, scale: 1.6 * p.scale, dur: 400 });
      };
      if (i) scene.time.delayedCall(i * 60, go); else go();
    });
    return p.wait;
  }
  const src = ctx.src, color = 0x83b56b;
  const hits = healTargets(scene, ctx);
  hits.forEach((v, i) => {
    const go = () => {
      V().motes(scene, v.x, v.y, color, 4 + p.n);
      V().ring(scene, v.x, v.y, color, { r: 16, scale: 1.6 * p.scale, dur: 400 });
      if (V().healCrosses) V().healCrosses(scene, v.x, v.y, 'basic', { w: v.img ? v.img.displayWidth : 92, h: v.img ? v.img.displayHeight : 116 });
    };
    if (i) scene.time.delayedCall(i * 60, go); else go();
  });
  return p.wait;
}

function cleanseFx(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src;
  const x = tx(tgt, src), y = ty(tgt, src);
  V().ring(scene, x, y, HOLY, { r: 24, w: 4, scale: 2.6 * p.scale, dur: 280 });
  V().burst(scene, x, y, HOLY, 10 + p.n);
  V().burst(scene, x, y, 0xe07030, 6);
  V().lightField(scene, x, y, 0xfff0c0, 90 * p.scale, 280);
  if (V().witherCrosses) V().witherCrosses(scene, x, y);
  if (tgt.img && V().cine) V().cine.impactFrame(scene, tgt.img);
  V().flashOverlay(scene, HOLY, 0.12);
  return p.wait;
}

function hexShell(scene, v, color, scale, dur) {
  const g = scene.add.graphics().setDepth(FXD);
  const w = (v.img ? v.img.displayWidth : 92) * 0.55 * scale, h = (v.img ? v.img.displayHeight : 116) * 0.55 * scale;
  g.lineStyle(3, color, 0.95); g.fillStyle(color, 0.12);
  g.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i / 6) * Math.PI * 2; const px = v.x + Math.cos(a) * w, py = v.y + Math.sin(a) * h; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.closePath(); g.fillPath(); g.strokePath();
  g.lineStyle(1, 0xffffff, 0.5);
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i / 6) * Math.PI * 2; g.lineBetween(v.x, v.y, v.x + Math.cos(a) * w, v.y + Math.sin(a) * h); }
  if (dur) scene.tweens.add({ targets: g, alpha: 0, duration: dur, onComplete: () => kill(g) });
  return g;
}

function wardFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = GOLD;
  const hits = ctx.tier === 'advanced' ? (tgt && tgt.u ? laneOf(scene, tgt) : alliesOf(scene, src)) : (tgt ? [tgt] : [src]);
  hits.forEach((v, i) => scene.time.delayedCall(i * 50, () => {
    const g = hexShell(scene, v, color, 1.0 * p.scale, ctx.tier === 'advanced' ? 700 : 420);
    g.setScale(0.6); g.setPosition(v.x * 0.4, v.y * 0.4);
    scene.tweens.add({ targets: g, scale: 1, x: 0, y: 0, duration: 200, ease: 'Back.easeOut' });
    V().lightField(scene, v.x, v.y, 0xffd070, 70, 300);
  }));
  return p.wait;
}

function triageFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = HOLY;
  const hits = healTargets(scene, ctx);
  hits.forEach((v, i) => {
    const low = v.u && (v.u.chp / v.u.maxHp) < 0.25;
    const go = () => {
      V().ring(scene, v.x, v.y, low ? 0xffffff : 0x83b56b, { r: 16, scale: 1.6, dur: 200 });
      scene.time.delayedCall(90, () => V().ring(scene, v.x, v.y, color, { r: 20, scale: 1.4, dur: 200 }));
      if (low) { const f = scene.add.rectangle(v.x, v.y, (v.img ? v.img.displayWidth : 92) + 8, (v.img ? v.img.displayHeight : 116) + 8, 0xffffff, 0).setStrokeStyle(3, 0xffffff, 0.9).setDepth(FXD); scene.tweens.add({ targets: f, alpha: 0, duration: 260, onComplete: () => kill(f) }); }
    };
    if (i) scene.time.delayedCall(i * 50, go); else go();
  });
  if (ctx.tier === 'advanced') { V().flashOverlay(scene, color, 0.14); if (V().camShake) V().camShake(scene, 0.004); }
  return p.wait;
}

// a healer's revive cast: a column of light comes down on the fallen
function raiseHoly(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src;
  const x = tx(tgt, src), y = ty(tgt, src);
  const g = V().glow ? null : null;
  const col = scene.add.rectangle(x, y - 200, 40 * p.scale, 400, 0xfff0c0, 0.35).setDepth(FXD).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2, 1);
  scene.tweens.add({ targets: col, scaleX: 1, duration: 200, yoyo: true, hold: 200, onComplete: () => kill(col) });
  V().ring(scene, x, y, HOLY, { r: 24, scale: 2.4 * p.scale, dur: 400 });
  V().lightField(scene, x, y, 0xfff0c0, 110 * p.scale, 500);
  return p.wait;
}
// a druid's revive cast: green cracks, then the grove takes it from the `revive` event
function raiseGreen(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src;
  const x = tx(tgt, src), y = ty(tgt, src);
  V().groundCrack(scene, x, y, 0x2fbf71, { n: 5, dur: 700 });
  V().motes(scene, x, y, 0x2fbf71, 6 + p.n);
  V().ring(scene, x, y + 28, 0x2fbf71, { r: 20, scale: 2.2 * p.scale, dur: 380 });
  V().lightField(scene, x, y, 0x2fbf71, 100 * p.scale, 500);
  return p.wait;
}

function bloodPact(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = BLD;
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt) : (tgt ? [tgt] : []);
  hits.forEach((v, i) => {
    const go = () => {
      V().beam(scene, sx(src), sy(src), v.x, v.y, color, { w: 3, dur: 180 });
      V().drip(scene, v.x, v.y, color, { n: 3 });
      const g = scene.add.circle((sx(src) + v.x) / 2, (sy(src) + v.y) / 2, 4, color).setDepth(FXD);
      scene.tweens.add({ targets: g, x: sx(src), y: sy(src), alpha: 0.2, duration: 220, onComplete: () => kill(g) });
    };
    if (i) scene.time.delayedCall(i * 40, go); else go();
  });
  if (src) V().healSparkle(scene, sx(src), sy(src));
  return p.wait;
}

function shieldWall(scene, ctx, p) {
  const src = ctx.src, color = GOLD;
  const cover = ctx.tier === 'advanced' ? alliesOf(scene, src)
    : ctx.tier === 'intermediate' ? laneOf(scene, src)
    : (src ? [src] : []);
  cover.forEach(v => {
    const g = scene.add.graphics().setDepth(FXD);
    g.fillStyle(color, 0.18);
    g.fillRoundedRect(v.x - 40, v.y - 50, 80, 100, 6);
    g.lineStyle(3, color, 0.95);
    g.strokeRoundedRect(v.x - 40, v.y - 50, 80, 100, 6);
    scene.tweens.add({ targets: g, alpha: 0, duration: 360, onComplete: () => kill(g) });
  });
  return p.wait;
}

function tauntFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = PURP;
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt)
    : ctx.tier === 'intermediate' ? twoOf(scene, src, tgt)
    : (tgt ? [tgt] : []);
  hits.forEach(v => {
    const star = scene.add.star(v.x, v.y - 58, 4, 4, 9, color).setDepth(FXD);
    scene.tweens.add({ targets: star, y: v.y - 70, alpha: 0, duration: 420, onComplete: () => kill(star) });
    V().ring(scene, v.x, v.y, color, { r: 20, scale: 1.6, dur: 240 });
  });
  return p.wait;
}

function raiseFx(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src, color = PURP;
  V().ring(scene, tx(tgt, src), ty(tgt, src), color, { r: 24, scale: 2.2 * p.scale, dur: 360 });
  V().motes(scene, tx(tgt, src), ty(tgt, src), color, 6);
  V().plume(scene, tx(tgt, src), ty(tgt, src) + 20, SHD, { n: 3, scale: p.scale });
  return p.wait;
}

function trueRest(scene, ctx) {
  const tgt = ctx.tgt, src = ctx.src, color = HOLY;
  V().ring(scene, tx(tgt, src), ty(tgt, src), color, { r: 30, scale: 2.6, dur: 400 });
  V().flashOverlay(scene, color, 0.14);
  V().motes(scene, tx(tgt, src), ty(tgt, src), GOLD, 8);
  return 400;
}

function godAura(scene, ctx) {
  const src = ctx.src, color = GOLD;
  alliesOf(scene, src).forEach(v => {
    V().ring(scene, v.x, v.y, color, { r: 26, scale: 2, dur: 360 });
    V().motes(scene, v.x, v.y, color, 4);
  });
  return 300;
}

const RECIPES = {
  fire_bolt:     tierChain(fireBolt),
  frost_touch:   tierChain(frostTouch),
  spark:         tierChain(sparkFx),
  ember_lash:    tierChain(emberLash),
  rime_grasp:    tierChain(rimeGrasp),
  cleave:        tierChain(cleaveFx),
  sunder:        tierChain(sunderFx),
  backstab:      tierChain(backstabFx),
  venom_fang:    tierChain(venomFang),
  katana_slash:  { basic: katanaFx, intermediate: katanaFx, advanced: katanaFx },
  basic_attack:  { basic: basicAtk, intermediate: basicAtk, advanced: basicAtk },
  finisher:      { basic: finisherFx, intermediate: finisherFx, advanced: finisherFx },
  counter_attack:{ basic: counterFx, intermediate: counterFx, advanced: counterFx },
  smoke_bomb:    tierChain(smokeBomb),
  aimed_shot:    tierChain(aimedShot),
  snare:         tierChain(snareFx),
  thorn_skin:    tierChain(thornSkin),
  beast_shape:   tierChain(beastShape),
  wither_touch:  tierChain(witherTouch),
  mend:          tierChain(mendFx),
  regenerate:    tierChain(regenFx),
  cleanse:       tierChain(cleanseFx),
  guardian_ward: tierChain(wardFx),
  triage:        tierChain(triageFx),
  blood_pact:    tierChain(bloodPact),
  shield_wall:   tierChain(shieldWall),
  taunt:         tierChain(tauntFx),
  necromancy:    tierChain(raiseFx),
  conscript:     tierChain(raiseFx),
  raise:         tierChain(raiseHoly),
  last_breath:   tierChain(raiseHoly),
  grove_raise:   tierChain(raiseGreen),
  thorn_lash:    tierChain(thornLash),
  growth_field:  tierChain(growthField),
  storm_shape:   tierChain(stormShape),
  stitch_and_run: tierChain(mendFx), field_suture: tierChain(mendFx), stanch: tierChain(mendFx), surgeons_saw: tierChain(mendFx),
  company_medic: tierChain(triageFx), restorative_circle: tierChain(triageFx), sick_bay: tierChain(triageFx), breath_of_the_bell: tierChain(triageFx), rum_ration: tierChain(triageFx), clan_blood: tierChain(triageFx), field_honour: tierChain(mendFx),
  purge_ward:    tierChain(wardFx), vital_anchor: tierChain(wardFx), aegis_protocol: tierChain(wardFx),
  true_rest:     { basic: trueRest, intermediate: trueRest, advanced: trueRest },
  god_aura:      { basic: godAura, intermediate: godAura, advanced: godAura },
};

const SCHOOLS = ['fire', 'lightning', 'ice', 'blade', 'arrow', 'gun', 'thrown', 'shadow', 'poison', 'holy', 'nature', 'guard', 'command', 'necromancy', 'divine'];

function skillDef(id) {
  if (!id || !ADV.DATA) return null;
  return (ADV.DATA.SKILLS && ADV.DATA.SKILLS[id])
    || (ADV.DATA.CAMPAIGN_SKILLS && ADV.DATA.CAMPAIGN_SKILLS[id])
    || (ADV.DATA.CAMPAIGN2_SKILLS && ADV.DATA.CAMPAIGN2_SKILLS[id])
    || null;
}

function schoolOf(id) {
  const d = skillDef(id);
  if (!d || d.kind === 'perk') return null;
  if (d.element === 'fire') return 'fire';
  if (d.element === 'ice') return 'ice';
  if (d.element === 'lightning') return 'lightning';
  if (d.element === 'shadow') return 'shadow';
  if (d.element === 'prismatic') return 'ice';
  if (d.element === 'arcane') return 'lightning';
  if (d.element === 'acid') return 'poison';
  if (d.heal) return 'holy';
  if (d.guard || d.wardAhead) return 'guard';
  if (d.forbidden || id === 'conscript' || id === 'necromancy' || id === 'blood_pact' || id === 'blood_price') return 'necromancy';
  if (id === 'god_aura' || id === 'true_rest') return 'divine';
  if (/venom|poison|bleed|blood_lotus|wither/.test(id)) return 'poison';
  if (/smoke|backstab|ghost|vanish|cloak|shadow/.test(id)) return 'shadow';
  if (/shot|volley|quarrel|loosing|bow|arrow/.test(id) && !/flint|grape|cannon|chain_shot/.test(id)) return 'arrow';
  if (/flint|grape|cannon|chain_shot|volley_fire|powder/.test(id)) return 'gun';
  if (/shuriken|kunai|chain_and_weight/.test(id)) return 'thrown';
  if (/snare|thorn|beast|growth|fox|bear/.test(id)) return 'nature';
  if (/signal|kiai|standing_order|articles/.test(id)) return 'command';
  if (d.archetype === 'healer') return 'holy';
  if (d.archetype === 'druid') return 'nature';
  if (d.archetype === 'ranger') return 'arrow';
  if (d.archetype === 'rogue') return 'shadow';
  if (d.archetype === 'tank') return 'guard';
  if (d.archetype === 'mage') return 'fire';
  if (d.archetype === 'fighter') return 'blade';
  if (d.melee || d.archetype === 'fighter') return 'blade';
  return 'blade';
}

function genericSchool(scene, ctx, p) {
  const school = schoolOf(ctx.skillId) || 'blade';
  const color = ctx.color || STL;
  const x1 = sx(ctx.src), y1 = sy(ctx.src), x2 = tx(ctx.tgt, ctx.src), y2 = ty(ctx.tgt, ctx.src);
  if (school === 'fire' && V().comet) V().comet(scene, x1, y1, x2, y2, { r: 7 * p.scale, boom: p.scale });
  else if (school === 'lightning' && V().lightningStreak) V().lightningStreak(scene, x1, y1, x2, y2, { scale: p.scale });
  else if (school === 'ice' && V().iceLance) V().iceLance(scene, x1, y1, x2, y2, { scale: p.scale });
  else if (school === 'holy') { V().healSparkle(scene, x2, y2); V().aura(scene, x2, y2, HOLY); }
  else if (school === 'shadow') { V().cloud(scene, x2, y2, SHD, { r: 22, a: 0.6 }); V().stab(scene, x2, y2, ctx.dir || 1, SHD, {}); }
  else if (school === 'poison') { V().spray(scene, x2, y2, ctx.dir || 1, POI, { n: 5, scale: p.scale }); V().drip(scene, x2, y2, POI, { n: 2 }); }
  else if (school === 'guard') V().ring(scene, x1, y1, GOLD, { r: 24, scale: 1.6 * p.scale });
  else if (school === 'nature') { V().groundCrack(scene, x2, y2, NAT, { n: 3 }); V().motes(scene, x2, y2, NAT, 4); }
  else if (school === 'necromancy') { V().ring(scene, x2, y2, PURP, { r: 22, scale: 2 }); V().motes(scene, x2, y2, PURP, 5); }
  else if (school === 'divine') { V().ring(scene, x1, y1, GOLD, { r: 28, scale: 2.2 }); V().motes(scene, x1, y1, HOLY, 6); }
  else if (school === 'arrow') V().projectile(scene, x1, y1, x2, y2, STL);
  else if (school === 'gun') { V().burst(scene, x1, y1, HOLY, 6); V().projectile(scene, x1, y1, x2, y2, GOLD); if (V().camShake) V().camShake(scene, 0.003); }
  else if (school === 'thrown') V().projectile(scene, x1, y1, x2, y2, STL);
  else if (school === 'command') { V().laneWave(scene, x1, GOLD, { scale: 1.4 }); }
  else {
    if (ctx.src && ctx.src.img) V().lunge(scene, ctx.src.img, ctx.dir || 1);
    V().slashArc(scene, x2, y2, color);
    V().slashArc(scene, x2, y2 + 4, color);
  }
  return p.wait;
}

function play(scene, ctx) {
  try {
    ctx = ctx || {};
    if (ADV.SkillArt?.has(ctx.skillId)) return ADV.SkillArt.play(scene, ctx);
    if (scene) scene.__fxBusy = true;
    const rec = RECIPES[ctx.skillId];
    const tier = ctx.tier || 'basic';
    const fn = rec && (rec[tier] || rec.basic);
    ctx.tier = tier;
    ctx.color = ctx.color || (V().skillColor && V().skillColor(ctx.skillId)) || STL;
    let d;
    if (fn) d = fn(scene, ctx);
    else if (schoolOf(ctx.skillId)) d = genericSchool(scene, ctx, tp(tier));
    else d = 240;
    const wait = typeof d === 'number' ? d : waitOf(tier, ctx.skillId);
    if (scene && scene.time) scene.time.delayedCall(wait, () => { scene.__fxBusy = false; });
    else if (scene) scene.__fxBusy = false;
    return wait;
  } catch (err) {
    if (scene) scene.__fxBusy = false;
    if (!ADV.SpellFX._logged) {
      try { console.warn('SpellFX failed', ctx && ctx.skillId, err); } catch (e) {}
      ADV.SpellFX._logged = true;
    }
    return 240;
  }
}

function has(skillId, tier) {
  const rec = RECIPES[skillId];
  if (rec && (rec[tier || 'basic'] || rec.basic)) return true;
  return !!schoolOf(skillId);
}

function ids() { return Object.keys(RECIPES); }

// ---- status idle marks ----------------------------------------------------
function killMark(m) {
  if (!m) return;
  try { if (m.timer) m.timer.remove(false); } catch (e) {}
  if (m.tweens) for (const t of m.tweens) try { t.stop(); t.remove(); } catch (e) {}
  if (m.objs) for (const o of m.objs) kill(o);
  if (m.onKill) try { m.onKill(); } catch (e) {}
}

function idleBurn(scene, v) {
  const f = scene.add.rectangle(v.x, v.y + 38, 10, 14, FIRE).setDepth(520);
  const tw = scene.tweens.add({ targets: f, scaleY: 1.35, alpha: 0.5, duration: 180, yoyo: true, repeat: -1 });
  return { objs: [f], tweens: [tw] };
}
function idlePoison(scene, v) {
  const drop = () => {
    if (!v.img || !v.img.active) return;
    const c = scene.add.circle(v.x + (Math.random() * 16 - 8), v.y + 8, 3, POI, 0.85).setDepth(520);
    scene.tweens.add({ targets: c, y: c.y - 22, alpha: 0, duration: 480, onComplete: () => kill(c) });
  };
  drop();
  const timer = scene.time.addEvent({ delay: 540, loop: true, callback: drop });
  return { objs: [], timer };
}
function idleBleed(scene, v) {
  const drop = () => {
    if (!v.img || !v.img.active) return;
    const c = scene.add.circle(v.x + 6, v.y + 16, 3, BLD).setDepth(520);
    scene.tweens.add({ targets: c, y: v.y + 44, alpha: 0, duration: 360, onComplete: () => kill(c) });
  };
  drop();
  const timer = scene.time.addEvent({ delay: 500, loop: true, callback: drop });
  return { objs: [], timer };
}
function idleFrozen(scene, v) {
  if (v.img) try { v.img.setTint(0x8ec8e0); } catch (e) {}
  const overlay = (V().freezeOver) ? V().freezeOver(scene, v) : scene.add.circle(v.x, v.y, 46, ICE, 0).setStrokeStyle(2, ICE, 0.7).setDepth(520);
  return {
    objs: overlay ? [overlay] : [],
    onKill: () => {
      try { if (v.img) v.img.clearTint(); } catch (e) {}
      if (V().clearFreeze) V().clearFreeze(v);
    },
  };
}
function idleShock(scene, v) {
  const zap = () => {
    if (!v.img || !v.img.active) return;
    V().bolt(scene, v.x - 16, v.y - 10, v.x + 16, v.y + 12, LIT, { segs: 3, w: 2, dur: 90 });
  };
  const timer = scene.time.addEvent({ delay: 640, loop: true, callback: zap });
  return { objs: [], timer };
}
function idleGuard(scene, v) {
  const g = scene.add.circle(v.x, v.y, 48, GOLD, 0).setStrokeStyle(2, GOLD, 0.75).setDepth(520);
  return { objs: [g] };
}
function idleWard(scene, v) {
  const g = scene.add.circle(v.x, v.y, 50, 0x6fa0bf, 0).setStrokeStyle(2, 0x6fa0bf, 0.75).setDepth(520);
  return { objs: [g] };
}
function idleRoot(scene, v) {
  const g = scene.add.graphics().setDepth(520);
  g.lineStyle(2, NAT, 0.9);
  g.lineBetween(v.x - 22, v.y + 40, v.x, v.y + 22);
  g.lineBetween(v.x + 22, v.y + 40, v.x, v.y + 22);
  return { objs: [g] };
}
function idleTaunt(scene, v) {
  const s = scene.add.star(v.x, v.y - 56, 4, 3, 7, PURP).setDepth(520);
  const tw = scene.tweens.add({ targets: s, y: v.y - 62, duration: 400, yoyo: true, repeat: -1 });
  return { objs: [s], tweens: [tw] };
}

function idleConscript(scene, v) {
  const g = scene.add.graphics().setDepth(522);
  g.lineStyle(2, PURP, 0.9);
  g.strokeCircle(v.x + 34, v.y - 42, 7);
  g.lineBetween(v.x + 34, v.y - 48, v.x + 34, v.y - 36);
  g.lineBetween(v.x + 28, v.y - 42, v.x + 40, v.y - 42);
  return { objs: [g] };
}

// healer & druid marks: the hot pulses a cross, the ward is a gold shell, the
// druid shield is the tree of life, the risen wear wings or a grove
function idleHot(scene, v) {
  const pulse = () => {
    if (!v.img || !v.img.active || !V().healCrosses) return;
    const c = scene.add.image(v.x + (Math.random() - 0.5) * 40, v.y + 20, V().crossKey(scene)).setDisplaySize(10, 10).setTint(0xa8e08a).setDepth(520).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: c, y: c.y - 36, alpha: 0, duration: 650, onComplete: () => kill(c) });
  };
  const timer = scene.time.addEvent({ delay: 700, loop: true, callback: pulse });
  return { objs: [], timer };
}
function idleWardShell(scene, v) {
  const g = hexShell(scene, v, GOLD, 1.0, 0);
  g.setDepth(520).setAlpha(0.75);
  const tw = scene.tweens.add({ targets: g, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return { objs: [g], tweens: [tw] };
}
function idleThornShield(scene, v) {
  const s = (v.u.statuses || []).find(x => x.kind === 'thornShield');
  const m = V().lifeTree ? V().lifeTree(scene, v, (s && s.tier) || 'basic') : null;
  if (!m) return { objs: [] };
  v.__lifeTree = m;
  const onKill = m.onKill;
  m.onKill = () => { v.__lifeTree = null; if (onKill) onKill(); };
  return m;
}
function idleGrove(scene, v) {
  const s = (v.u.statuses || []).find(x => x.kind === 'grove');
  const m = V().grove ? V().grove(scene, v, (s && s.rounds) || 3) : null;
  if (!m) return { objs: [] };
  m.rounds = s ? s.rounds : 3;
  m.timer = scene.time.addEvent({ delay: 800, loop: true, callback: () => { const st = (v.u.statuses || []).find(x => x.kind === 'grove'); if (st && st.rounds < m.rounds) { m.rounds = st.rounds; m.shed(); } } });
  return m;
}
function idleWings(scene, v) {
  const m = V().wings ? V().wings(scene, v, {}) : null;
  if (!m) return { objs: [] };
  const halo = scene.add.image(v.x, v.y, V()._tex.glowKey(scene)).setTint(0xfff0c0).setAlpha(0.25).setDisplaySize(140, 140).setBlendMode(Phaser.BlendModes.ADD).setDepth((v.img.depth || 10) - 2);
  m.objs.push(halo);
  return m;
}
const STATUS = {
  burn: idleBurn, poison: idlePoison, bleed: idleBleed,
  frozen: idleFrozen, shocked: idleShock,
  guard: idleGuard, ward: idleWardShell, rooted: idleRoot, taunted: idleTaunt,
  conscript: idleConscript,
  hot: idleHot, thornShield: idleThornShield, grove: idleGrove, wings: idleWings,
};

function clearStatus(v) {
  if (ADV.SkillArt) ADV.SkillArt.clearStatus(v);
  if (!v || !v._fxMarks) return;
  for (const k of Object.keys(v._fxMarks)) killMark(v._fxMarks[k]);
  v._fxMarks = {};
}

function syncStatus(scene, v) {
  if (ADV.SkillArt) return ADV.SkillArt.syncStatus(scene, v);
  try {
    if (!v || !v.u) return;
    const kinds = [];
    for (const s of v.u.statuses || []) {
      if (STATUS[s.kind] && kinds.indexOf(s.kind) < 0) kinds.push(s.kind);
    }
    if (v.u.ch && v.u.ch.isConscript && kinds.indexOf('conscript') < 0) kinds.push('conscript');
    const keep = kinds.slice(0, 4);
    v._fxMarks = v._fxMarks || {};
    for (const k of Object.keys(v._fxMarks)) {
      if (keep.indexOf(k) < 0) { killMark(v._fxMarks[k]); delete v._fxMarks[k]; }
    }
    for (const k of keep) {
      if (v._fxMarks[k]) {
        if (k === 'frozen' && v.img) try { v.img.setTint(0x8ec8e0); } catch (e) {}
        continue;
      }
      v._fxMarks[k] = STATUS[k](scene, v);
    }
  } catch (e) {}
}

function tick(scene, v, e) {
  if (ADV.SkillArt) return ADV.SkillArt.tick(scene, v, e);
  try {
    if (!v) return 140;
    const kinds = (v.u && v.u.statuses || []).map(s => s.kind);
    // the tick is a slice of the target's health now: the splash grows with it
    const frac = e && v.u ? Math.min(1, (e.dmg || 0) / Math.max(1, v.u.maxHp || 40)) : 0.05;
    const big = 1 + frac * 3;
    if (kinds.indexOf('burn') >= 0) V().plume(scene, v.x, v.y + 16, FIRE, { n: 2, scale: 0.7 });
    else if (kinds.indexOf('poison') >= 0) { V().motes(scene, v.x, v.y, POI, Math.round(3 * big)); if (frac >= 0.15) { V().cloud(scene, v.x, v.y, POI, { r: 18 * big, a: 0.45, scale: 1.6, dur: 380 }); V().drip(scene, v.x, v.y, POI, { n: 3 }); } }
    else if (kinds.indexOf('bleed') >= 0) { V().drip(scene, v.x, v.y, BLD, { n: Math.round(2 * big) }); if (frac >= 0.15) { V().spray(scene, v.x, v.y, v.u.side === 'a' ? -1 : 1, BLD, { n: Math.round(3 * big), scale: big * 0.6 }); if (V().cine) V().cine.impactFrame(scene, v.img); } }
    else V().motes(scene, v.x, v.y, POI, 2);
    if (frac >= 0.3 && V().camShake) V().camShake(scene, 0.003);
    return frac >= 0.15 ? 200 : 140;
  } catch (err) { return 140; }
}

ADV.SpellFX = { play, has, ids, tick, syncStatus, clearStatus, RECIPES, schoolOf, SCHOOLS, tp, SLOT_Y };
})();
