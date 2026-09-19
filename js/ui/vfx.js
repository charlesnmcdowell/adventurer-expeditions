// Code-generated VFX vocabulary (§1a): portrait motion is the primary feel
// channel; effect atoms cover every skill so no mechanic is visually silent.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const VFX = {};

// ---- portrait motion atoms --------------------------------------------------
VFX.lunge = function (scene, obj, dir, done) {  // dir: +1 rightward (attacker side a)
  const x0 = obj.x;
  scene.tweens.add({ targets: obj, x: x0 + 26 * dir, duration: 110, yoyo: true, ease: 'Power2', onComplete: done });
};
VFX.recoil = function (scene, obj, dir) {
  const x0 = obj.x;
  scene.tweens.add({ targets: obj, x: x0 - 14 * dir, duration: 70, yoyo: true, ease: 'Power1' });
};
VFX.shake = function (scene, obj) {
  const x0 = obj.x;
  scene.tweens.add({ targets: obj, x: x0 + 6, duration: 40, yoyo: true, repeat: 5, onComplete: () => { obj.x = x0; } });
};
VFX.tintFlash = function (scene, img, color) {
  if (!img.setTintFill) return;
  img.setTintFill(color);
  if (img.__tintTimer) img.__tintTimer.remove(false);
  img.__tintTimer = scene.time.delayedCall(110, () => {
    img.__tintTimer = null;
    try { if (img.__baseTint != null) img.setTint(img.__baseTint); else img.clearTint(); } catch (e) {}
  });
};
VFX.desaturate = function (img) { try { img.setTint(0x555555); } catch (e) {} };
VFX.scalePunch = function (scene, obj) {
  scene.tweens.add({ targets: obj, scaleX: obj.scaleX * 1.18, scaleY: obj.scaleY * 1.18, duration: 90, yoyo: true });
};
VFX.driftPulse = function (scene, obj) {
  scene.tweens.add({ targets: obj, y: obj.y - 4, duration: 500, yoyo: true, repeat: 1 });
};

// ---- screen-space -----------------------------------------------------------
VFX.camShake = function (scene, mag) { scene.cameras.main.shake(140, mag || 0.006); };
VFX.zoomPunch = function (scene) {
  const cam = scene.cameras.main;
  scene.tweens.add({ targets: cam, zoom: 1.03, duration: 90, yoyo: true, onComplete: () => cam.setZoom(1) });
};
VFX.flashOverlay = function (scene, color, alpha) {
  const r = scene.add.rectangle(ADV.T.W / 2, ADV.T.H / 2, ADV.T.W, ADV.T.H, color, alpha || 0.18).setDepth(999);
  scene.tweens.add({ targets: r, alpha: 0, duration: 260, onComplete: () => r.destroy() });
};

// ---- projectile / arc / burst atoms ----------------------------------------
VFX.projectile = function (scene, x1, y1, x2, y2, color, done) {
  const dot = scene.add.circle(x1, y1, 6, color).setDepth(500);
  const trail = [];
  scene.tweens.add({
    targets: dot, x: x2, y: y2, duration: 220, ease: 'Power1',
    onUpdate: () => {
      const t = scene.add.circle(dot.x, dot.y, 3, color, 0.5).setDepth(499);
      trail.push(t);
      scene.tweens.add({ targets: t, alpha: 0, duration: 200, onComplete: () => t.destroy() });
    },
    onComplete: () => { dot.destroy(); VFX.burst(scene, x2, y2, color); if (done) done(); },
  });
};
VFX.slashArc = function (scene, x, y, color) {
  const g = scene.add.graphics().setPosition(x,y).setDepth(500);
  // A tapered, ink-edged crescent rotates around the contact point.
  const outer=[],inner=[];
  for(let i=0;i<=18;i++){const t=i/18,a=-2.4+t*2.2,w=Math.sin(t*Math.PI)*9;outer.push({x:Math.cos(a)*(43+w),y:Math.sin(a)*(43+w)});inner.unshift({x:Math.cos(a)*(43-w),y:Math.sin(a)*(43-w)});}
  g.fillStyle(color||0xe8dfc8);g.lineStyle(1.4,0x24334c,.9);g.fillPoints(outer.concat(inner),true);g.strokePoints(outer.concat(inner),true);
  g.lineStyle(2,0xfff9df,.9);g.beginPath();g.arc(0,0,44,-2.1,-.6);g.strokePath();
  g.setAngle(-20);
  scene.tweens.add({ targets: g, angle: 50, alpha: 0, duration: 240, onComplete: () => g.destroy() });
};
VFX.burst = function (scene, x, y, color, n) {
  for (let i = 0; i < (n || 10); i++) {
    const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 26;
    const p = scene.add.rectangle(x, y, 5, 5, color).setDepth(500);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 300 + Math.random() * 150, onComplete: () => p.destroy() });
  }
};
VFX.aura = function (scene, x, y, color) {
  const ring = scene.add.circle(x, y, 30, color, 0).setStrokeStyle(3, color, 0.9).setDepth(500);
  scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 480, onComplete: () => ring.destroy() });
};
VFX.healSparkle = function (scene, x, y) {
  for (let i = 0; i < 8; i++) {
    const p = scene.add.star(x + (Math.random() - 0.5) * 50, y + 20 + Math.random() * 30, 4, 2, 5, 0x83b56b).setDepth(500);
    scene.tweens.add({ targets: p, y: p.y - 46, alpha: 0, duration: 520 + Math.random() * 200, onComplete: () => p.destroy() });
  }
};
// Evade beat (THREAT_PROMPT.md §9): slip + afterimages + the swing through vacated space.
VFX.evadeBeat = function (scene, view, attacker, opts) {
  opts = opts || {};
  if (!view || !view.img) return 220;
  const pct = !!opts.pct;
  const img = view.img;
  const x0 = view.x, y0 = view.y;
  const dir = view.u && view.u.side === 'a' ? -1 : 1;
  const dist = pct ? 56 : 90;
  const afterN = pct ? 1 : 3;
  const key = img.texture && img.texture.key;
  const w = img.displayWidth, h = img.displayHeight;
  for (let i = 0; i < afterN; i++) {
    try {
      const ghost = scene.add.image(x0, y0, key).setDisplaySize(w, h).setAlpha(pct ? 0.45 : 0.35 - i * 0.08).setDepth(9).setTint(pct ? 0x7fbf6a : 0xc8c0b0);
      scene.tweens.add({ targets: ghost, alpha: 0, x: x0 - dir * (8 + i * 10), duration: pct ? 260 : 220, onComplete: () => ghost.destroy() });
    } catch (e) {}
  }
  const streak = scene.add.rectangle(x0, y0, pct ? 28 : 48, 3, pct ? 0x7fbf6a : 0xc8c0b0, 0.55).setDepth(8);
  scene.tweens.add({ targets: streak, x: x0 + dir * dist * 0.5, alpha: 0, duration: 180, onComplete: () => streak.destroy() });
  if (pct) {
    const line = scene.add.rectangle(x0, y0 - 8, 2, h * 0.7, 0x7fbf6a, 0.85).setDepth(11);
    scene.tweens.add({ targets: line, scaleY: 0.05, alpha: 0, duration: 160, ease: 'Quad.easeIn', onComplete: () => line.destroy() });
    scene.tweens.add({ targets: img, x: x0 + dir * dist, duration: 90, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({ targets: img, x: x0, duration: 130, ease: 'Quad.easeIn' }) });
  } else {
    scene.tweens.add({ targets: img, x: x0 + dir * dist, duration: 120, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({ targets: img, x: x0, duration: 180, ease: 'Quad.easeIn' }) });
  }
  const vacateX = x0 - dir * 18;
  VFX.slashArc(scene, vacateX, y0, pct ? 0x7fbf6a : 0xe8dfc8);
  const word = pct ? 'read' : 'miss';
  const col = pct ? '#7fbf6a' : '#d8d0b8';
  const t = scene.add.text(x0 + dir * 20, y0 - 36, word, {
    fontFamily: ADV.T.font.display, fontSize: pct ? '26px' : '22px', color: col, fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(600);
  scene.tweens.add({ targets: t, x: t.x + dir * 28, y: y0 - 70, alpha: 0, duration: 240, onComplete: () => t.destroy() });
  if (attacker && attacker.img) VFX.recoil(scene, attacker.img, dir);
  return pct ? 230 : 250;
};

VFX.damageNumber = function (scene, x, y, val, color) {
  const t = scene.add.text(x, y, String(val), {
    fontFamily: ADV.T.font.display, fontSize: '22px', color: color || '#f4eee0', fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(600);
  scene.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 800, ease: 'Power1', onComplete: () => t.destroy() });
};

// Skill id -> default atom mapping (§1a: pair each primitive with a default)
VFX.ELEMENT = {
  fire: 0xe86a30, ice: 0x6fc0e8, lightning: 0xf4e07a, poison: 0x7fa848,
  bleed: 0xa8352c, shadow: 0x4a3a5a, holy: 0xf4eee0, nature: 0x5d8a4a, steel: 0xcfd8e8,
};
VFX.elementColor = function (el) { return VFX.ELEMENT[el] || 0xd8d0b8; };
VFX.skillColor = function (skillId) {
  const m = {
    fire_bolt: 0xe86a30, ember_lash: 0xe86a30,
    frost_touch: 0x6fc0e8, rime_grasp: 0x6fc0e8,
    spark: 0xf4e07a, aimed_shot: 0xcfd8e8, snare: 0x5d8a4a,
    backstab: 0xa8352c, cleave: 0xcfd8e8, sunder: 0xd4a94e, katana_slash: 0xcfd8e8,
    blood_pact: 0xa8352c, regenerate: 0x5d8a4a, mend: 0xf4eee0, triage: 0xf4eee0,
    basic_attack: 0xcfd8e8, venom_fang: 0x7fa848, wither_touch: 0x4a3a5a,
    smoke_bomb: 0x4a3a5a, thorn_skin: 0x5d8a4a, beast_shape: 0x5d8a4a,
    cleanse: 0xf4eee0, guardian_ward: 0xd4a94e, shield_wall: 0xd4a94e, taunt: 0x9a70c0,
    necromancy: 0x9a70c0, conscript: 0x6a4a8a, true_rest: 0xf4eee0, god_aura: 0xd4a94e,
    finisher: 0xa8352c, counter_attack: 0xcfd8e8,
  };
  return m[skillId] || 0xd8d0b8;
};
VFX.isProjectile = function (skillId) {
  return ['fire_bolt', 'frost_touch', 'aimed_shot', 'snare', 'blood_pact'].includes(skillId);
};
VFX.hitStop = function (scene, ms) {
  try { scene.tweens.pauseAll(); } catch (e) {}
  try {
    if (scene.sys && scene.sys.updateList) {
      const list = scene.sys.updateList.getActive ? scene.sys.updateList.getActive() : [];
      for (const o of list) {
        if (o && o.pause && o.type === 'ParticleEmitter') try { o.pause(); o.__hitStopped = true; } catch (e) {}
      }
    }
  } catch (e) {}
  const cam = scene.cameras && scene.cameras.main;
  if (cam) { try { cam._cx = cam.scrollX; cam._cy = cam.scrollY; } catch (e) {} }
  scene.time.delayedCall(ms || 60, () => {
    try { scene.tweens.resumeAll(); } catch (e) {}
    try {
      if (scene.sys && scene.sys.updateList) {
        const list = scene.sys.updateList.getActive ? scene.sys.updateList.getActive() : [];
        for (const o of list) {
          if (o && o.__hitStopped && o.resume) { try { o.resume(); } catch (e) {} o.__hitStopped = false; }
        }
      }
    } catch (e) {}
  });
};

function kill(o) { try { if (o && o.destroy) o.destroy(); } catch (e) {} }
const FXD = 530;

VFX.bolt = function (scene, x1, y1, x2, y2, color, opts) {
  opts = opts || {};
  const n = opts.segs || 5, g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(opts.w || 3, color, 1);
  g.beginPath(); g.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    g.lineTo(x1 + (x2 - x1) * t + (Math.random() * 18 - 9), y1 + (y2 - y1) * t + (Math.random() * 14 - 7));
  }
  g.lineTo(x2, y2); g.strokePath();
  scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 180, onComplete: () => kill(g) });
};
VFX.beam = function (scene, x1, y1, x2, y2, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  const w = opts.w || 6;
  g.lineStyle(w, color, 0.95);
  g.lineBetween(x1, y1, x2, y2);
  scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 160, onComplete: () => kill(g) });
};
VFX.shards = function (scene, x, y, color, n, opts) {
  opts = opts || {};
  const count = n || 5, scale = opts.scale || 1;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + 0.2, d = (22 + i * 4) * scale;
    const t = scene.add.triangle(x, y, 0, -7 * scale, 5 * scale, 6 * scale, -5 * scale, 6 * scale, color).setDepth(FXD);
    scene.tweens.add({ targets: t, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 220 + i * 20, onComplete: () => kill(t) });
  }
};
VFX.plume = function (scene, x, y, color, opts) {
  opts = opts || {};
  const n = opts.n || 4, scale = opts.scale || 1;
  for (let i = 0; i < n; i++) {
    const r = scene.add.rectangle(x + (i - n / 2) * 6, y, 8 * scale, 14 * scale, color).setDepth(FXD);
    scene.tweens.add({ targets: r, y: y - 36 * scale, alpha: 0, duration: 240 + i * 30, onComplete: () => kill(r) });
  }
};
VFX.motes = function (scene, x, y, color, n, opts) {
  opts = opts || {};
  const count = n || 5;
  for (let i = 0; i < count; i++) {
    const c = scene.add.circle(x + (Math.random() * 28 - 14), y + (Math.random() * 16 - 8), 3, color, 0.85).setDepth(FXD);
    scene.tweens.add({ targets: c, y: c.y - 24, x: c.x + (Math.random() * 16 - 8), alpha: 0, duration: 420 + i * 40, onComplete: () => kill(c) });
  }
};
VFX.cloud = function (scene, x, y, color, opts) {
  opts = opts || {};
  const c = scene.add.circle(x, y, opts.r || 28, color, opts.a == null ? 0.7 : opts.a).setDepth(FXD);
  scene.tweens.add({ targets: c, scale: opts.scale || 2.2, alpha: 0, duration: opts.dur || 380, onComplete: () => kill(c) });
};
VFX.ring = function (scene, x, y, color, opts) {
  opts = opts || {};
  const ring = scene.add.circle(x, y, opts.r || 22, color, 0).setStrokeStyle(opts.w || 3, color, 0.95).setDepth(FXD);
  scene.tweens.add({ targets: ring, scale: opts.scale || 2, alpha: 0, duration: opts.dur || 320, onComplete: () => kill(ring) });
};
VFX.shockwave = function (scene, x, y, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(3, color, 0.9);
  g.strokeEllipse(x, y + 28, 30, 12);
  scene.tweens.add({ targets: g, scaleX: opts.scale || 3, scaleY: opts.scale || 1.6, alpha: 0, duration: opts.dur || 280, onComplete: () => kill(g) });
};
VFX.groundCrack = function (scene, x, y, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(2, color, 1);
  const n = opts.n || 4;
  for (let i = 0; i < n; i++) {
    const a = -0.4 + i * 0.35;
    g.lineBetween(x, y + 36, x + Math.cos(a) * 40, y + 36 + Math.sin(a) * 18 + 10);
  }
  scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 700, onComplete: () => kill(g) });
};
VFX.sweep = function (scene, x, y, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(opts.w || 5, color, 1);
  g.beginPath(); g.arc(x, y, opts.r || 48, opts.from || -2.4, opts.to || 0.2); g.strokePath();
  g.setAngle(opts.ang || -18);
  scene.tweens.add({ targets: g, angle: (opts.ang || -18) + 70, alpha: 0, duration: opts.dur || 200, onComplete: () => kill(g) });
};
VFX.stab = function (scene, x, y, dir, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(opts.w || 4, color, 1);
  g.lineBetween(x - 28 * dir, y, x + 10 * dir, y);
  scene.tweens.add({ targets: g, x: g.x + 16 * dir, alpha: 0, duration: opts.dur || 140, onComplete: () => kill(g) });
};
VFX.spray = function (scene, x, y, dir, color, opts) {
  opts = opts || {};
  const n = opts.n || 6, scale = opts.scale || 1;
  for (let i = 0; i < n; i++) {
    const a = -0.5 + i * (1 / n), d = (28 + i * 4) * scale;
    const p = scene.add.rectangle(x, y, 4, 8, color).setDepth(FXD).setAngle(a * 50 * dir);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d * dir, y: y + Math.sin(a) * d, alpha: 0, duration: 180, onComplete: () => kill(p) });
  }
};
VFX.drip = function (scene, x, y, color, opts) {
  opts = opts || {};
  const n = opts.n || 3;
  for (let i = 0; i < n; i++) {
    const c = scene.add.circle(x + (i - 1) * 6, y + 10, 3, color).setDepth(FXD);
    scene.tweens.add({ targets: c, y: y + 34, alpha: 0, duration: 260 + i * 40, onComplete: () => kill(c) });
  }
};
VFX.frostSpikes = function (scene, x, y, color, opts) {
  opts = opts || {};
  const n = opts.n || 6, r = opts.r || 42, scale = opts.scale || 1;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const t = scene.add.triangle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7,
      0, -10 * scale, 4 * scale, 8 * scale, -4 * scale, 8 * scale, color).setDepth(FXD).setAngle(a * 57);
    scene.tweens.add({ targets: t, x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 8, alpha: 0, duration: 240, onComplete: () => kill(t) });
  }
};
VFX.laneWave = function (scene, x, color, opts) {
  opts = opts || {};
  const ys = opts.ys || [170, 330, 490];
  ys.forEach((y, i) => scene.time.delayedCall(i * 36, () => VFX.shockwave(scene, x, y, color, opts)));
};
VFX.screenSweep = function (scene, color, opts) {
  opts = opts || {};
  const W = ADV.T.W, H = ADV.T.H;
  const r = scene.add.rectangle(opts.dir < 0 ? W + 40 : -40, H / 2, 80, H, color, 0.28).setDepth(555);
  scene.tweens.add({ targets: r, x: opts.dir < 0 ? -40 : W + 40, duration: opts.dur || 280, onComplete: () => kill(r) });
};

// ---- generated textures + particle helper --------------------------------
function fxTex(scene, key, w, h, draw) {
  if (!scene || !scene.textures) return key;
  if (scene.textures.exists(key)) return key;
  try {
    const c = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
    if (!c) return key;
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    scene.textures.addCanvas(key, c);
  } catch (e) {}
  return key;
}
function emberKey(scene) {
  return fxTex(scene, 'fx_ember', 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,224,122,1)');
    g.addColorStop(0.45, 'rgba(232,106,48,0.9)');
    g.addColorStop(1, 'rgba(122,42,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
  });
}
function snowKey(scene) {
  return fxTex(scene, 'fx_snow', 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(244,238,224,1)');
    g.addColorStop(1, 'rgba(244,238,224,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
  });
}
function glowKey(scene) {
  return fxTex(scene, 'fx_glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.28)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
}
function emitOn(scene, key, cfg) {
  if (!scene || !scene.add || !scene.add.particles) return null;
  try {
    const em = scene.add.particles(0, 0, key, cfg);
    if (em && em.setDepth) em.setDepth(cfg.depth == null ? FXD : cfg.depth);
    if (em) em.__em = em;
    return em;
  } catch (e) {
    try {
      const mgr = scene.add.particles(key);
      if (mgr && mgr.setDepth) mgr.setDepth(cfg.depth == null ? FXD : cfg.depth);
      if (mgr && mgr.createEmitter) {
        mgr.__em = mgr.createEmitter(cfg);
        return mgr;
      }
    } catch (e2) {}
  }
  return null;
}
function clampPx(n, min) { return Math.max(min == null ? 3 : min, n); }
function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

VFX.lightField = function (scene, x, y, color, radius, ms) {
  if (!scene || !scene.add) return;
  const r = clampPx(radius || 80, 16);
  let glow;
  try {
    glow = scene.add.image(x, y, glowKey(scene)).setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    glow.setDisplaySize(r * 2, r * 2);
    if (glow.setTint) glow.setTint(color || 0xffe0c0);
    glow.setAlpha(0.42);
  } catch (e) {
    glow = scene.add.circle(x, y, r, color || 0xffe0c0, 0.22).setDepth(8);
  }
  scene.tweens.add({ targets: glow, alpha: 0, scale: 1.35, duration: ms || 240, onComplete: () => kill(glow) });
  return glow;
};

VFX.emberTrail = function (scene, follow, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const mgr = emitOn(scene, emberKey(scene), {
    speed: { min: 18 * scale, max: 54 * scale },
    lifespan: 300,
    scale: { start: 0.7 * scale, end: 0 },
    alpha: { start: 0.9, end: 0 },
    tint: [0xffe07a, 0xe86a30, 0x7a2a10],
    frequency: opts.freq || 28,
    quantity: opts.n || 1,
    gravityY: 40,
    depth: FXD - 2,
  });
  if (mgr && mgr.__em && follow && mgr.__em.startFollow) mgr.__em.startFollow(follow);
  if (opts.ms) scene.time.delayedCall(opts.ms, () => {
    try { if (mgr && mgr.__em) mgr.__em.stop(); } catch (e) {}
    scene.time.delayedCall(340, () => kill(mgr));
  });
  return mgr;
};

VFX.explosion = function (scene, x, y, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const color = opts.color || 0xe86a30;
  const flash = scene.add.circle(x, y, clampPx(10 * scale, 4), 0xffffff, 0.95).setDepth(FXD + 2);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 60, onComplete: () => kill(flash) });
  VFX.shockwave(scene, x, y, color, { scale: 1.6 * scale, dur: 280 });
  const n = Math.round(8 + 8 * Math.min(2, scale));
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
    const d = (22 + Math.random() * 28) * scale;
    const p = scene.add.rectangle(x, y, clampPx(4 * scale, 2), clampPx(10 * scale, 3), i % 2 ? 0xffe07a : color).setDepth(FXD);
    scene.tweens.add({
      targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, angle: 80,
      duration: 260 + Math.random() * 120, onComplete: () => kill(p),
    });
  }
  VFX.cloud(scene, x, y - 6, 0x6a6058, { r: 16 * scale, a: 0.45, scale: 2.2, dur: 360 });
  if (scale >= 2) VFX.groundCrack(scene, x, y, 0x3a2a1c, { n: 5, dur: 2000 });
  const scorch = scene.add.ellipse(x, y + 28, 36 * scale, 12 * scale, 0x2a1810, 0.35).setDepth(4);
  scene.tweens.add({ targets: scorch, alpha: 0, duration: 2000, onComplete: () => kill(scorch) });
  if (scorch.__residue == null) scorch.__residue = true;
  VFX.lightField(scene, x, y, 0xffe0c0, 70 * scale, 280);
  if (opts.shake !== false && VFX.camShake) VFX.camShake(scene, 0.003 * scale);
  return scorch;
};

VFX.comet = function (scene, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const r = clampPx((opts.r || 8) * scale, 3);
  const color = opts.color || 0xe86a30;
  const d = dist(x1, y1, x2, y2);
  const speed = opts.speed || 1100;
  const flight = Math.max(140, Math.min(420, Math.round((d / speed) * 1000)));
  const arc = opts.arc == null ? 22 * scale : opts.arc;
  const core = scene.add.circle(x1, y1, r, 0xffe07a).setDepth(FXD + 1);
  const glow = scene.add.circle(x1, y1, r * 1.7, color, 0.45).setDepth(FXD);
  const shimmer = scene.add.circle(x1, y1, r * 2.2, 0xfff2c0, 0.15).setDepth(FXD - 1);
  core.__comet = true;
  VFX.emberTrail(scene, core, { scale: (opts.trail || 1) * scale, ms: flight + 40, n: opts.trail >= 2 ? 2 : 1 });
  VFX.lightField(scene, x1, y1, 0xffe0c0, 40 * scale, 80);
  const ease = opts.accel ? 'Cubic.easeIn' : 'Sine.easeInOut';
  const dummy = { t: 0 };
  scene.tweens.add({
    targets: dummy, t: 1, duration: flight, ease,
    onUpdate: () => {
      const t = dummy.t;
      const sag = Math.sin(t * Math.PI) * arc;
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t - sag;
      core.x = glow.x = shimmer.x = x;
      core.y = glow.y = shimmer.y = y;
    },
    onComplete: () => {
      kill(core); kill(glow); kill(shimmer);
      if (opts.explode !== false) VFX.explosion(scene, x2, y2, { scale: opts.boom || scale, color });
      if (opts.done) opts.done();
    },
  });
  if (opts.hum && VFX.camShake) VFX.camShake(scene, 0.002);
  return flight;
};

function boltPath(x1, y1, x2, y2, segs, jitter) {
  const pts = [{ x: x1, y: y1 }];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    pts.push({
      x: x1 + (x2 - x1) * t + (Math.random() * 2 - 1) * jitter,
      y: y1 + (y2 - y1) * t + (Math.random() * 2 - 1) * jitter * 0.7,
    });
  }
  pts.push({ x: x2, y: y2 });
  return pts;
}
function drawBolt(g, pts, w, color, a) {
  g.lineStyle(w, color, a);
  g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.strokePath();
}

VFX.lightningStreak = function (scene, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const segs = opts.segs || (7 + Math.floor(Math.random() * 5));
  const jitter = (opts.jitter || 12) * scale;
  const g = scene.add.graphics().setDepth(FXD);
  let branches = 0;
  const paint = () => {
    g.clear();
    const main = boltPath(x1, y1, x2, y2, segs, jitter);
    drawBolt(g, main, clampPx(5 * scale, 2), 0xf4e07a, 0.35);
    drawBolt(g, main, clampPx(2 * scale, 2), 0xffffff, 1);
    const n = opts.branches == null ? (2 + Math.floor(Math.random() * 3)) : opts.branches;
    branches = n;
    for (let i = 0; i < n; i++) {
      const at = 2 + Math.floor(Math.random() * Math.max(1, main.length - 3));
      const src = main[at];
      const remain = 1 - at / main.length;
      const len = remain * (0.3 + Math.random() * 0.2);
      const ang = Math.atan2(y2 - y1, x2 - x1) + (Math.random() < 0.5 ? -0.7 : 0.7);
      const bx = src.x + Math.cos(ang) * dist(x1, y1, x2, y2) * len;
      const by = src.y + Math.sin(ang) * dist(x1, y1, x2, y2) * len;
      const side = boltPath(src.x, src.y, bx, by, 4, jitter * 0.6);
      drawBolt(g, side, clampPx(2.5 * scale, 2), 0xf4e07a, 0.3);
      drawBolt(g, side, clampPx(1.2 * scale, 2), 0xffffff, 0.9);
    }
  };
  paint();
  g.__branches = branches;
  scene.time.delayedCall(40, paint);
  scene.time.delayedCall(80, paint);
  scene.time.delayedCall(120, () => kill(g));
  if (opts.impact !== false) {
    VFX.burst(scene, x2, y2, 0xffffff, 6);
    const hit = scene.add.circle(x2, y2, clampPx(10 * scale, 4), 0xffffff, 0.35).setDepth(FXD);
    scene.tweens.add({ targets: hit, alpha: 0, scale: 1.8, duration: 140, onComplete: () => kill(hit) });
  }
  VFX.lightField(scene, x2, y2, 0xf4e07a, 50 * scale, 120);
  return g;
};

VFX.shatter = function (scene, x, y, opts) {
  opts = opts || {};
  const color = opts.color || 0x9ad8f0;
  const n = opts.n || 8;
  const scale = opts.scale || 1;
  const shards = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    const s = clampPx(5 * scale, 3);
    const t = scene.add.triangle(x, y, 0, -s, s * 0.7, s, -s * 0.7, s, color, 0.85).setDepth(FXD);
    t.__shard = true;
    shards.push(t);
    scene.tweens.add({
      targets: t,
      x: x + Math.cos(a) * (28 + Math.random() * 22) * scale,
      y: y + Math.sin(a) * 16 * scale + 36,
      angle: 80 + Math.random() * 80,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => kill(t),
    });
  }
  return shards;
};

VFX.iceLance = function (scene, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const color = opts.color || 0x9ad8f0;
  const d = dist(x1, y1, x2, y2);
  const flight = Math.max(160, Math.min(400, Math.round((d / (opts.speed || 700)) * 1000)));
  const len = clampPx(22 * scale, 10);
  const w = clampPx(6 * scale, 3);
  const g = scene.add.graphics().setDepth(FXD);
  const draw = (x, y, ang) => {
    g.clear();
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(ang);
    g.fillStyle(color, 0.72);
    g.beginPath();
    g.moveTo(len, 0); g.lineTo(len * 0.35, -w); g.lineTo(-len * 0.55, -w * 0.55);
    g.lineTo(-len * 0.7, 0); g.lineTo(-len * 0.55, w * 0.55); g.lineTo(len * 0.35, w);
    g.closePath(); g.fillPath();
    g.lineStyle(1.4, 0xffffff, 0.85);
    g.lineBetween(-len * 0.4, 0, len * 0.7, 0);
    g.restore();
  };
  const ang = Math.atan2(y2 - y1, x2 - x1);
  draw(x1, y1, ang);
  g.__lance = true;
  const dummy = { t: 0 };
  scene.tweens.add({
    targets: dummy, t: 1, duration: flight, ease: 'Quad.easeOut',
    onUpdate: () => {
      const t = dummy.t;
      draw(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, ang);
    },
    onComplete: () => {
      kill(g);
      if (opts.shatter !== false) {
        VFX.shatter(scene, x2, y2, { scale, color, n: opts.shards || 8 });
        VFX.frostSpikes(scene, x2, y2 + 18, color, { n: 5, scale, r: 28 * scale });
      }
      VFX.lightField(scene, x2, y2, 0x9ad8f0, 40 * scale, 180);
      if (opts.done) opts.done();
    },
  });
  VFX.motes(scene, x1, y1, color, 3);
  return flight;
};

VFX.freezeOver = function (scene, view, opts) {
  opts = opts || {};
  if (!view) return null;
  if (view.__freeze) return view.__freeze;
  const x = view.x, y = view.y;
  const w = (view.img && view.img.displayWidth) || 80;
  const h = (view.img && view.img.displayHeight) || 100;
  const g = scene.add.graphics().setDepth(FXD - 4);
  g.fillStyle(0x8ec8e0, 0.35);
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.lineStyle(2, 0xd8f4ff, 0.8);
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  g.lineStyle(1.4, 0xffffff, 0.7);
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const side = i % 4;
    if (side === 0) g.lineBetween(x - w / 2, y - h / 2 + 8 + i * 10, x - 4, y - 6 + i * 4);
    else if (side === 1) g.lineBetween(x + w / 2, y - h / 2 + 12 + i * 8, x + 6, y + 4);
    else if (side === 2) g.lineBetween(x - w / 2 + 10 + i * 12, y + h / 2, x - 2, y + 10);
    else g.lineBetween(x + w / 2 - 8, y + h / 2, x + 8, y - 4);
  }
  view.__freeze = g;
  if (opts.hold === false) {
    scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 500, onComplete: () => { kill(g); view.__freeze = null; } });
  }
  return g;
};

VFX.clearFreeze = function (view) {
  if (view && view.__freeze) { kill(view.__freeze); view.__freeze = null; }
};

VFX.blizzard = function (scene, bounds, opts) {
  opts = opts || {};
  bounds = bounds || { x: 0, y: 0, w: ADV.T.W, h: ADV.T.H };
  const mgr = emitOn(scene, snowKey(scene), {
    x: { min: bounds.x, max: bounds.x + bounds.w },
    y: bounds.y - 10,
    speedX: { min: 180, max: 280 },
    speedY: { min: 80, max: 160 },
    lifespan: 900,
    scale: { start: 0.7, end: 0.3 },
    alpha: { start: 0.85, end: 0.2 },
    frequency: 12,
    quantity: 3,
    depth: 6,
  });
  VFX.screenSweep(scene, 0xd8f0f8, { dir: 1, dur: 320 });
  VFX.lightField(scene, bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, 0x9ad8f0, 220, 500);
  scene.time.delayedCall(900, () => {
    try { if (mgr && mgr.__em) mgr.__em.stop(); } catch (e) {}
    scene.time.delayedCall(400, () => kill(mgr));
  });
  return 900;
};

// ---- cinematic toolkit ---------------------------------------------------
const cine = {};
cine._move = null;

cine.impactFrame = function (scene, img) {
  if (!img || !img.setTintFill) return 40;
  img.setTintFill(0xffffff);
  scene.time.delayedCall(18, () => { try { img.setTintFill(0x1a1210); } catch (e) {} });
  scene.time.delayedCall(40, () => {
    try {
      if (img.__baseTint != null) img.setTint(img.__baseTint);
      else img.clearTint();
    } catch (e) {}
  });
  return 40;
};

cine.letterbox = function (scene, on) {
  const H = ADV.T.H, W = ADV.T.W, bar = H * 0.06;
  if (!scene.__letter) {
    const top = scene.add.rectangle(W / 2, bar / 2, W, bar, 0x000000, 1).setDepth(80).setAlpha(0);
    const bot = scene.add.rectangle(W / 2, H - bar / 2, W, bar, 0x000000, 1).setDepth(80).setAlpha(0);
    scene.__letter = { top, bot };
  }
  const { top, bot } = scene.__letter;
  scene.tweens.add({ targets: [top, bot], alpha: on ? 1 : 0, duration: 200 });
};

cine.camMove = function (scene, kind, opts) {
  opts = opts || {};
  if (cine._move) return;
  const cam = scene.cameras.main;
  cine._move = kind;
  const done = () => { cine._move = null; try { cam.setZoom(1); cam.setScroll(0, 0); } catch (e) {} };
  if (kind === 'pushIn') {
    scene.tweens.add({
      targets: cam, zoom: 1.08, duration: 300, ease: 'Sine.easeOut',
      onComplete: () => scene.tweens.add({ targets: cam, zoom: 1, duration: 120, onComplete: done }),
    });
  } else if (kind === 'whip') {
    const dx = opts.x || 20, dy = opts.y || 0;
    scene.tweens.add({
      targets: cam, zoom: 1.06, scrollX: dx, scrollY: dy, duration: 120, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({
        targets: cam, zoom: 1, scrollX: 0, scrollY: 0, duration: 300, onComplete: done,
      }),
    });
  } else if (kind === 'drift') {
    scene.tweens.add({
      targets: cam, zoom: 1.03, duration: opts.ms || 2400, ease: 'Sine.easeInOut', onComplete: done,
    });
  } else done();
};

cine.slowMo = function (scene, ms) {
  if (scene.__slowMoUsed) return;
  scene.__slowMoUsed = true;
  try { scene.time.timeScale = 0.35; } catch (e) {}
  try { scene.tweens.timeScale = 0.35; } catch (e) {}
  scene.time.delayedCall((ms || 400) * 0.35, () => {
    try { scene.time.timeScale = 1; } catch (e) {}
    try { scene.tweens.timeScale = 1; } catch (e) {}
  });
};

cine.chargeUp = function (scene, src, color) {
  if (!src) return 0;
  const x = src.x, y = src.y;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const c = scene.add.circle(x + Math.cos(a) * 46, y + Math.sin(a) * 36, 3, color || 0xe86a30, 0.85).setDepth(FXD);
    scene.tweens.add({ targets: c, x, y, alpha: 0, duration: 280, onComplete: () => kill(c) });
  }
  VFX.lightField(scene, x, y, color || 0xe86a30, 50, 280);
  return 280;
};

// ============================================================================
// Healer & druid pass (HEALER_DRUID_PROMPT.md Parts B–C): crosses, wings, the
// tree of life, the grove, and the transformation beat. Everything is drawn;
// nothing loads. Marks that persist return { objs, tweens, timers, onKill } so
// spell_fx's killMark can clean them up.
// ============================================================================
function crossTex(scene) {
  return fxTex(scene, 'fx_cross', 24, 24, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(200,255,192,0.95)';
    ctx.fillRect(w / 2 - 3, 2, 6, h - 4); ctx.fillRect(2, h / 2 - 3, w - 4, 6);
    ctx.fillStyle = 'rgba(127,224,122,1)';
    ctx.fillRect(w / 2 - 2, 4, 4, h - 8); ctx.fillRect(4, h / 2 - 2, w - 8, 4);
  });
}
function leafTex(scene) {
  return fxTex(scene, 'fx_leaf', 16, 10, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(93,138,74,1)';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.quadraticCurveTo(w / 2, -2, w, h / 2); ctx.quadraticCurveTo(w / 2, h + 2, 0, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(40,70,30,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(1, h / 2); ctx.lineTo(w - 1, h / 2); ctx.stroke();
  });
}
function featherTex(scene) {
  return fxTex(scene, 'fx_feather', 12, 28, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(244,238,224,0.95)';
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.quadraticCurveTo(w, h * 0.4, w / 2, h); ctx.quadraticCurveTo(0, h * 0.4, w / 2, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(212,169,78,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2, 1); ctx.lineTo(w / 2, h - 1); ctx.stroke();
  });
}
VFX.crossKey = (scene) => crossTex(scene);
VFX.leafKey = (scene) => leafTex(scene);
const CROSS_TIER = { basic: { n: 5, sizes: [14], ms: 500 }, intermediate: { n: 9, sizes: [14, 20], ms: 650 }, advanced: { n: 14, sizes: [12, 18, 26], ms: 800 } };
VFX.CROSS_TIER = CROSS_TIER;

// B1. Green plus signs rising from a unit's frame. Returns ms until the number should land.
VFX.healCrosses = function (scene, x, y, tier, opts) {
  opts = opts || {};
  const T = CROSS_TIER[tier] || CROSS_TIER.basic;
  const key = crossTex(scene);
  const w = opts.w || 92, h = opts.h || 116;
  const tint = opts.druid ? 0xa8e08a : 0xffffff;
  for (let i = 0; i < T.n; i++) {
    const size = T.sizes[i % T.sizes.length];
    const cx = x + (Math.random() - 0.5) * w * 0.9, cy = y + h * 0.45 - Math.random() * h * 0.7;
    const c = scene.add.image(cx, cy, key).setDisplaySize(size, size).setDepth(FXD + 1).setAlpha(0).setAngle((Math.random() - 0.5) * 24).setTint(tint).setBlendMode(Phaser.BlendModes.ADD);
    c.__cross = true;
    const delay = (i / T.n) * T.ms * 0.5;
    scene.tweens.add({ targets: c, alpha: 1, duration: 120, delay });
    scene.tweens.add({ targets: c, y: cy - 40 - Math.random() * 30, angle: c.angle + (Math.random() - 0.5) * 24, duration: T.ms, delay, ease: 'Sine.easeOut', onComplete: () => kill(c) });
    scene.tweens.add({ targets: c, alpha: 0, duration: T.ms * 0.4, delay: delay + T.ms * 0.6 });
  }
  if (opts.druid) {
    const lk = leafTex(scene);
    for (let i = 0; i < 2 + T.sizes.length; i++) {
      const l = scene.add.image(x + (Math.random() - 0.5) * w, y - h * 0.3, lk).setDepth(FXD + 1).setAlpha(0.9).setAngle(Math.random() * 360);
      l.__cross = true;
      scene.tweens.add({ targets: l, y: l.y + 60, x: l.x + (Math.random() - 0.5) * 40, angle: l.angle + 180, alpha: 0, duration: T.ms + 300, ease: 'Sine.easeIn', onComplete: () => kill(l) });
    }
  }
  if (tier === 'advanced') VFX.lightField(scene, x, y, opts.druid ? 0x7fd070 : 0x7fe07a, 90, T.ms);
  return T.ms;
};

// B3. Angelic wings unfold behind a unit's frame and beat once; returns a mark.
VFX.wings = function (scene, view, opts) {
  opts = opts || {};
  if (!view || !view.img) return null;
  const x = view.x, y = view.y, w = view.img.displayWidth, h = view.img.displayHeight;
  const depth = (view.img.depth || 10) - 1;
  const c = scene.add.container(x, y).setDepth(depth);
  const fk = featherTex(scene);
  const glow = scene.add.image(0, -h * 0.15, glowKey(scene)).setTint(0xfff0c0).setAlpha(0.35).setDisplaySize(w * 2.6, h * 1.4).setBlendMode(Phaser.BlendModes.ADD);
  c.add(glow);
  const sides = [];
  for (const s of [-1, 1]) {
    const wing = scene.add.container(s * w * 0.42, -h * 0.28);
    for (let row = 0; row < 3; row++) {
      const n = 6 - row;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const fx = s * (10 + t * (w * 0.9 - row * 12)), fy = -8 + row * 14 + Math.sin(t * Math.PI) * -26 + t * 18;
        const f = scene.add.image(fx, fy, fk).setDisplaySize(10 - row, 26 + (1 - t) * 10).setAngle(s * (-50 + t * 95 + row * 6)).setAlpha(0.95 - row * 0.15);
        wing.add(f);
      }
    }
    wing.setScale(0.1, 0.6).setAlpha(0);
    scene.tweens.add({ targets: wing, scaleX: 1, scaleY: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });
    c.add(wing); sides.push(wing);
  }
  const tweens = [];
  const beat = () => { for (const wg of sides) { tweens.push(scene.tweens.add({ targets: wg, scaleX: 0.86, angle: wg.angle, duration: 220, yoyo: true, ease: 'Sine.easeInOut', delay: 450 })); } };
  beat();
  const timer = scene.time.addEvent({ delay: 2400, loop: true, callback: () => { for (const wg of sides) scene.tweens.add({ targets: wg, scaleX: 0.86, duration: 220, yoyo: true, ease: 'Sine.easeInOut' }); } });
  const halo = VFX.glowStatic ? null : null;
  return { objs: [c], tweens, timer, onKill: () => {
    // dissolve into white motes
    try { for (let i = 0; i < 10; i++) { const m = scene.add.circle(x + (Math.random() - 0.5) * w * 1.6, y + (Math.random() - 0.5) * h, 2.5, 0xf4eee0, 0.9).setDepth(FXD); scene.tweens.add({ targets: m, y: m.y - 40, alpha: 0, duration: 500 + Math.random() * 300, onComplete: () => kill(m) }); } } catch (e) {}
  } };
};

// C2. The tree of life behind a portrait: trunk, canopy by tier, running water, thorn ring.
VFX.lifeTree = function (scene, view, tier, opts) {
  opts = opts || {};
  if (!view || !view.img) return null;
  const x = view.x, y = view.y, w = view.img.displayWidth, h = view.img.displayHeight;
  const depth = (view.img.depth || 10) - 1;
  const boughs = tier === 'advanced' ? 6 : tier === 'intermediate' ? 4 : 2;
  const c = scene.add.container(x, y).setDepth(depth);
  // water: a masked column of streaks scrolling down
  const water = scene.add.container(0, 0);
  const wg = scene.add.graphics();
  for (let i = 0; i < 26; i++) { const sx = (Math.random() - 0.5) * w * 0.9; wg.lineStyle(1 + Math.random() * 1.5, 0x6fc0e8, 0.35 + Math.random() * 0.4); wg.lineBetween(sx, -h + Math.random() * h * 2, sx, -h + Math.random() * h * 2 + 18 + Math.random() * 20); }
  water.add(wg);
  const wg2 = scene.add.graphics(); wg2.fillStyle(0x6fc0e8, 0.12); wg2.fillRect(-w * 0.5, -h * 0.6, w, h * 1.2); water.add(wg2);
  const maskShape = scene.add.rectangle(x, y - h * 0.05, w * 0.92, h * 1.05, 0xffffff).setVisible(false);
  water.setMask(maskShape.createGeometryMask());
  water.setBlendMode(Phaser.BlendModes.ADD);
  c.add(water);
  const scroll = scene.tweens.add({ targets: wg, y: h, duration: 1400, repeat: -1, ease: 'Linear' });
  // trunk + boughs
  const tree = scene.add.graphics();
  const brown = 0x4a3020, leaf = 0x3a7a3a, leaf2 = 0x5d9a4a;
  tree.fillStyle(brown, 1);
  tree.fillRect(-7, -h * 0.1, 14, h * 0.62);
  tree.fillStyle(0x3a2418, 1); tree.fillRect(-3, -h * 0.1, 3, h * 0.6);
  tree.fillStyle(brown, 1);
  const rootY = h * 0.52;
  for (let i = -2; i <= 2; i++) tree.fillTriangle(i * 6, rootY, i * 22 - 6, rootY + 14, i * 22 + 8, rootY + 14);
  for (let i = 0; i < boughs; i++) {
    const s = i % 2 ? 1 : -1, t = i / boughs;
    const bx = s * (18 + t * w * 0.42), by = -h * 0.1 - t * h * 0.32;
    tree.lineStyle(5 - t * 2, brown, 1); tree.lineBetween(0, -h * 0.05 - t * h * 0.2, bx, by);
    tree.fillStyle(t % 2 ? leaf : leaf2, 1); tree.fillCircle(bx, by - 8, 18 - t * 4);
    tree.fillStyle(leaf2, 0.9); tree.fillCircle(bx + s * 8, by - 14, 12 - t * 3);
  }
  // canopy over the top edge
  const cw = w * (0.5 + boughs * 0.09), ch2 = 22 + boughs * 4;
  tree.fillStyle(leaf, 1); tree.fillEllipse(0, -h * 0.5, cw, ch2);
  tree.fillStyle(leaf2, 0.9); tree.fillEllipse(-cw * 0.2, -h * 0.5 - 6, cw * 0.5, ch2 * 0.7); tree.fillEllipse(cw * 0.22, -h * 0.5 - 4, cw * 0.45, ch2 * 0.6);
  tree.setScale(1, 0.01); tree.setAlpha(0.95);
  c.add(tree);
  scene.tweens.add({ targets: tree, scaleY: 1, duration: 400, ease: 'Back.easeOut' });
  // thorn ring, drawn last
  const thorns = scene.add.graphics().setAlpha(0);
  const thick = tier === 'advanced' ? 3.5 : tier === 'intermediate' ? 2.5 : 1.8;
  thorns.lineStyle(thick, 0x24401c, 1);
  const rx = w / 2 + 6, ry = h / 2 + 6;
  const pts = 44;
  for (let i = 0; i < pts; i++) {
    const a0 = (i / pts) * Math.PI * 2, a1 = ((i + 1) / pts) * Math.PI * 2;
    const jx = (Math.random() - 0.5) * 4, jy = (Math.random() - 0.5) * 4;
    thorns.lineBetween(Math.cos(a0) * rx + jx, Math.sin(a0) * ry + jy, Math.cos(a1) * rx, Math.sin(a1) * ry);
    if (i % 3 === 0) { const mx = Math.cos(a0) * rx, my = Math.sin(a0) * ry; thorns.lineBetween(mx, my, mx + Math.cos(a0 + 0.6) * 9, my + Math.sin(a0 + 0.6) * 9); }
  }
  c.add(thorns);
  scene.tweens.add({ targets: thorns, alpha: 1, duration: 300, delay: 300 });
  // leaves drifting off the canopy
  const lk = leafTex(scene);
  const leaves = scene.add.particles(0, 0, lk, {
    x: { min: x - cw / 2, max: x + cw / 2 }, y: y - h * 0.5, speedY: { min: 20, max: 45 }, speedX: { min: -15, max: 15 },
    lifespan: 1800, scale: { min: 0.5, max: 0.9 }, rotate: { min: 0, max: 360 }, alpha: { start: 0.9, end: 0 }, frequency: 340, quantity: 1,
  }).setDepth(depth + 2);
  const mark = { objs: [c, maskShape, leaves], tweens: [scroll], view, tier,
    flash: (dir) => {   // reflected hit: the thorns go red and shards fly at the attacker
      scene.tweens.add({ targets: thorns, alpha: 0.4, duration: 60, yoyo: true, repeat: 2 });
      thorns.setTint && thorns.setTint(0xff4040);
      const shards = 5;
      for (let i = 0; i < shards; i++) { const sh = scene.add.triangle(x, y, 0, -7, 3, 5, -3, 5, 0x3a6a2a).setDepth(FXD + 1); scene.tweens.add({ targets: sh, x: x + (dir || 1) * (120 + Math.random() * 80), y: y + (Math.random() - 0.5) * 60, angle: 200, alpha: 0, duration: 320, onComplete: () => kill(sh) }); }
    },
    onKill: () => { try { const g = scene.add.graphics().setDepth(FXD); g.lineStyle(2, 0x5d8a4a, 0.9); for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2; g.lineBetween(x + Math.cos(a) * 30, y + Math.sin(a) * 30, x + Math.cos(a) * 60, y + Math.sin(a) * 60); } scene.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => kill(g) }); } catch (e) {} },
  };
  return mark;
};

// C3. The emerald grove: saplings around the risen, a canopy, fireflies.
VFX.grove = function (scene, view, rounds, opts) {
  opts = opts || {};
  if (!view || !view.img) return null;
  const x = view.x, y = view.y, w = view.img.displayWidth, h = view.img.displayHeight;
  const depth = (view.img.depth || 10) - 1;
  const c = scene.add.container(x, y).setDepth(depth);
  VFX.groundCrack(scene, x, y, 0x2fbf71, { n: 5, dur: 900 });
  const saplings = [];
  const n = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), sx = -w * 0.6 + t * w * 1.2, sy = h * 0.52 - Math.abs(t - 0.5) * 10;
    const sp = scene.add.container(sx, sy);
    const g = scene.add.graphics();
    const hh = 28 + Math.random() * 22;
    g.fillStyle(0x4a3020, 1); g.fillRect(-2, -hh, 4, hh);
    g.fillStyle(0x2fbf71, 1); g.fillCircle(0, -hh, 9 + Math.random() * 4); g.fillCircle(-6, -hh + 6, 7); g.fillCircle(6, -hh + 5, 7);
    sp.add(g); sp.setScale(0.01); c.add(sp); saplings.push(sp);
    scene.tweens.add({ targets: sp, scaleX: 1, scaleY: 1, duration: 360, delay: i * 50, ease: 'Back.easeOut' });
  }
  const canopy = scene.add.image(0, -h * 0.55, glowKey(scene)).setTint(0x2fbf71).setAlpha(0).setDisplaySize(w * 2.2, h * 0.9).setBlendMode(Phaser.BlendModes.ADD);
  c.add(canopy);
  scene.tweens.add({ targets: canopy, alpha: 0.5, duration: 500, delay: 300 });
  const cg = scene.add.graphics().setAlpha(0);
  cg.fillStyle(0x2a8a50, 0.95); cg.fillEllipse(0, -h * 0.55, w * 1.5, 30); cg.fillStyle(0x3fbf71, 0.9); cg.fillEllipse(-w * 0.3, -h * 0.58, w * 0.7, 24); cg.fillEllipse(w * 0.3, -h * 0.57, w * 0.7, 22);
  c.add(cg);
  scene.tweens.add({ targets: cg, alpha: 1, duration: 400, delay: 350 });
  const fireflies = scene.add.particles(0, 0, glowKey(scene), {
    x: { min: x - w * 0.7, max: x + w * 0.7 }, y: { min: y - h * 0.5, max: y + h * 0.4 },
    speedX: { min: -12, max: 12 }, speedY: { min: -12, max: 12 }, lifespan: { min: 1500, max: 3000 },
    scale: { min: 0.03, max: 0.06 }, alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(Math.PI * t) * 0.9 }, tint: 0xbfff8a, frequency: 260, quantity: 1, blendMode: 'ADD',
  }).setDepth(depth + 2);
  const light = scene.add.image(x, y + h * 0.4, glowKey(scene)).setTint(0x2fbf71).setAlpha(0.3).setDisplaySize(w * 2, h * 0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2);
  const mark = { objs: [c, fireflies, light], tweens: [], view, saplings,
    shed: () => { const sp = saplings.pop(); if (!sp) return; scene.tweens.add({ targets: sp, scaleY: 0.01, alpha: 0, duration: 400, onComplete: () => kill(sp) }); },
    onKill: () => { try { const lk = leafTex(scene); for (let i = 0; i < 12; i++) { const l = scene.add.image(x + (Math.random() - 0.5) * w * 1.4, y + (Math.random() - 0.5) * h, lk).setDepth(FXD).setAngle(Math.random() * 360); scene.tweens.add({ targets: l, y: l.y + 50, alpha: 0, angle: l.angle + 120, duration: 600 + Math.random() * 400, onComplete: () => kill(l) }); } } catch (e) {} },
  };
  return mark;
};

// C1. Transformation beat: shake, stretch and snap twice, swap the texture at the second snap.
VFX.transform = function (scene, view, beastKey, opts) {
  if (ADV.SkillArt) return ADV.SkillArt.transform(scene, view, beastKey, opts);
  opts = opts || {};
  if (!view || !view.img) return 0;
  const img = view.img, x = view.x, y = view.y;
  const w0 = img.displayWidth, h0 = img.displayHeight;
  const lk = leafTex(scene);
  VFX.shake(scene, img);
  const snap = (delay, swap) => {
    scene.time.delayedCall(delay, () => {
      scene.tweens.add({ targets: img, displayHeight: h0 * 1.15, displayWidth: w0 * 0.92, duration: 90, yoyo: true, ease: 'Quad.easeOut',
        onYoyo: () => {
          if (swap) {
            try { img.setTexture(beastKey); img.setDisplaySize(w0, h0); } catch (e) {}
            if (VFX.cine && VFX.cine.impactFrame) VFX.cine.impactFrame(scene, img);
            VFX.ring(scene, x, y + h0 / 2, 0x5d8a4a, { r: 24, w: 3, scale: 2.4, dur: 360 });
            VFX.lightField(scene, x, y, 0x5d8a4a, 90, 300);
          }
        } });
      for (let i = 0; i < 8; i++) { const l = scene.add.image(x + (Math.random() - 0.5) * w0, y + (Math.random() - 0.5) * h0, lk).setDepth(FXD + 1).setAngle(Math.random() * 360); scene.tweens.add({ targets: l, x: l.x + (Math.random() - 0.5) * 90, y: l.y - 30 - Math.random() * 40, alpha: 0, duration: 400, onComplete: () => kill(l) }); }
      for (let i = 0; i < 6; i++) { const f = scene.add.rectangle(x + (Math.random() - 0.5) * w0, y + (Math.random() - 0.5) * h0, 3, 7, 0x2a1c12, 0.9).setDepth(FXD + 1).setAngle(Math.random() * 360); scene.tweens.add({ targets: f, x: f.x + (Math.random() - 0.5) * 70, y: f.y + 20, alpha: 0, duration: 380, onComplete: () => kill(f) }); }
    });
  };
  snap(120, false); snap(340, true);
  return 520;
};
// reverse beat: the human face comes back
VFX.revertForm = function (scene, view, humanKey) {
  if (ADV.SkillArt) return ADV.SkillArt.transform(scene, view, humanKey, {revert:true});
  if (!view || !view.img) return 0;
  const img = view.img, w0 = img.displayWidth, h0 = img.displayHeight;
  scene.tweens.add({ targets: img, displayHeight: h0 * 1.1, duration: 120, yoyo: true, onYoyo: () => { try { img.setTexture(humanKey); img.setDisplaySize(w0, h0); } catch (e) {} } });
  VFX.motes(scene, view.x, view.y, 0x5d8a4a, 6);
  return 300;
};
// a downward grey cross: healing refused (wither)
VFX.witherCrosses = function (scene, x, y) {
  const key = crossTex(scene);
  for (let i = 0; i < 4; i++) {
    const c = scene.add.image(x + (Math.random() - 0.5) * 60, y - 30 - Math.random() * 30, key).setDisplaySize(14, 14).setTint(0x6a6a6a).setDepth(FXD + 1).setAngle(45);
    scene.tweens.add({ targets: c, y: c.y + 60, alpha: 0, duration: 600 + i * 60, ease: 'Quad.easeIn', onComplete: () => kill(c) });
  }
  return 400;
};

VFX.cine = cine;
VFX.STATS = { lastMs: 0, avgMs: 0, n: 0 };
VFX._tex = { emberKey, snowKey, glowKey, fxTex };

ADV.VFX = VFX;
})();
