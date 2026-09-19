// Adventurer: Expeditions — shared UI pieces: the non-verbal guidance gate
// (ring + pointing hand + input blockers around one rect), big buttons, and
// the placeholder Hiro textures cut from the authored plates.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const W = 1280, H = 760;
const UI = X.UI = {};
const D = UI.DEPTH = { hud: 800, gate: 900, hand: 950 };

// Draw the pointing hand (pending painted art). opts.tap === false leaves it
// still so the caller can drive its motion.
function hand(scene, x, y, opts) {
  const c = scene.add.container(x, y).setDepth(D.hand);
  const g = scene.add.graphics(); g.fillStyle(0xffffff, 1); g.lineStyle(3, 0x1a1512, 1);
  g.fillRoundedRect(-14, -6, 36, 40, 12); g.strokeRoundedRect(-14, -6, 36, 40, 12);          // palm
  g.fillRoundedRect(-6, -44, 14, 48, 7); g.strokeRoundedRect(-6, -44, 14, 48, 7);            // index finger
  g.fillRoundedRect(10, -18, 12, 20, 6); g.strokeRoundedRect(10, -18, 12, 20, 6);            // knuckles
  c.add(g); c.setAngle(-30);
  if (!opts || opts.tap !== false) scene.tweens.add({ targets: c, x: x - 26, y: y - 30, duration: 460, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  return c;
}
UI.hand = hand;

// An invitation over several controls at once, for a choice that belongs to the
// player: every rect rings alike and the hand sweeps the row rather than
// singling one out. No blockers. Guidance shows how, never which (GDD §8).
UI.invite = function (scene, rects, opts) {
  opts = opts || {};
  const objs = [];
  for (const r of rects) {
    const ring = scene.add.graphics().setDepth(D.gate + 1);
    ring.lineStyle(4, 0xffe28a, 1); ring.strokeRoundedRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 14); objs.push(ring);
    scene.tweens.add({ targets: ring, alpha: 0.32, duration: 620, yoyo: true, repeat: -1 });
  }
  const first = rects[0], last = rects[rects.length - 1];
  const y = first.y + first.h + 40;
  const h = hand(scene, first.x + first.w / 2, y, { tap: false }); objs.push(h);
  if (rects.length > 1) scene.tweens.add({ targets: h, x: last.x + last.w / 2, duration: 700 * rects.length, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  scene.tweens.add({ targets: h, y: y - 18, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  let resolve = null;
  const clear = () => { for (const o of objs) { try { o.destroy(); } catch (e) {} } objs.length = 0; scene.__gateRect = null; };
  const release = payload => { if (!resolve) return false; const r = resolve; resolve = null; clear(); r(payload || { tapped: true }); return true; };
  if (opts.skippable !== false) {
    const skip = scene.add.container(last.x + last.w + 22, last.y - 22).setDepth(D.hand);
    skip.add([scene.add.circle(0, 0, 13, 0x14110d, 0.9).setStrokeStyle(2, 0x8d8377), T().text(scene, 0, 0, '✕', { size: 12, ox: 0.5, oy: 0.5, color: '#c9c0b0' })]);
    const sz = scene.add.zone(0, 0, 34, 34).setInteractive({ useHandCursor: true }); skip.add(sz); objs.push(skip);
    sz.on('pointerdown', () => release({ skipped: true }));
  }
  scene.__gateRect = rects[0];                     // the campaign test taps the first; the screen recommends nothing
  const promise = new Promise(r => { resolve = r; });
  return { promise, release, clear, get active() { return !!resolve; } };
};

// Hold the game on one rect. Four blockers cover everything but the hole (input
// is top-only, so the hole must stay uncovered for the real control beneath),
// a ring pulses around it, the hand taps toward it. Returns { promise, release, clear }:
// the control's own handler calls release() when tapped; the ✕ resolves { skipped: true }.
UI.gate = function (scene, rect, opts) {
  opts = opts || {};
  const objs = [];
  const dim = opts.dim == null ? 0.22 : opts.dim;
  const hx = rect.x - 8, hy = rect.y - 8, hw = rect.w + 16, hh = rect.h + 16;
  for (const [bx, by, bw, bh] of [[0, 0, W, hy], [0, hy + hh, W, H - hy - hh], [0, hy, hx, hh], [hx + hw, hy, W - hx - hw, hh]]) {
    if (bw <= 0 || bh <= 0 || opts.block === false) continue;          // block:false = point, do not hold
    objs.push(scene.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0x000000, dim).setDepth(D.gate).setInteractive());
  }
  const ring = scene.add.graphics().setDepth(D.gate + 1);
  ring.lineStyle(4, 0xffe28a, 1); ring.strokeRoundedRect(hx, hy, hw, hh, 12); objs.push(ring);
  scene.tweens.add({ targets: ring, alpha: 0.35, duration: 480, yoyo: true, repeat: -1 });
  objs.push(hand(scene, rect.x + rect.w / 2 + 46, rect.y + rect.h / 2 + 60));
  let resolve = null;
  const clear = () => { for (const o of objs) { try { o.destroy(); } catch (e) {} } objs.length = 0; scene.__gateRect = null; };
  const release = payload => { if (!resolve) return false; const r = resolve; resolve = null; clear(); r(payload || { tapped: true }); return true; };
  if (opts.skippable !== false) {
    const skip = scene.add.container(rect.x + rect.w + 22, rect.y - 22).setDepth(D.hand);
    const sb = scene.add.circle(0, 0, 13, 0x14110d, 0.9).setStrokeStyle(2, 0x8d8377);
    const st = T().text(scene, 0, 0, '✕', { size: 12, ox: 0.5, oy: 0.5, color: '#c9c0b0' });
    const sz = scene.add.zone(0, 0, 34, 34).setInteractive({ useHandCursor: true });
    skip.add([sb, st, sz]); objs.push(skip);
    sz.on('pointerdown', () => release({ skipped: true }));
  }
  scene.__gateRect = rect;
  const promise = new Promise(r => { resolve = r; });
  return { promise, release, clear, get active() { return !!resolve; } };
};

// The corner control: mute, pause and Start over, mounted by every scene so
// none of them is a dead end. Pause shades the scene and freezes its clock and
// tweens; Start over confirms, then wipes the run and boots a fresh tutorial
// (the hand stays retired — a player restarting on purpose has seen it).
UI.corner = function (scene, opts) {
  opts = opts || {};
  const root = scene.add.container(0, 0).setDepth(D.hand + 20).setScrollFactor(0);
  const btn = (x, glyph, onTap) => {
    const c = scene.add.container(x, 20);
    const g = scene.add.graphics(); g.fillStyle(0x14110d, 0.85); g.fillRoundedRect(0, 0, 48, 40, 9); g.lineStyle(2, 0x3a3128, 1); g.strokeRoundedRect(0, 0, 48, 40, 9);
    const t = T().text(scene, 24, 20, glyph, { size: 16, ox: 0.5, oy: 0.5, color: '#f4eee0' });
    const z = scene.add.zone(24, 20, 48, 40).setInteractive({ useHandCursor: true });
    z.on('pointerdown', onTap);
    c.add([g, t, z]); c.label = t; c.rect = { x, y: 20, w: 48, h: 40 };
    root.add(c); return c;
  };
  const ctl = { root, paused: false };
  ctl.mute = btn(W - 190, '♪', () => { if (A.Music) A.Music.toggleMute(); ctl.refresh(); });
  ctl.pause = btn(W - 130, '❚❚', () => ctl.togglePause());
  ctl.restart = btn(W - 70, '↺', () => ctl.confirmRestart());
  ctl.refresh = () => { if (A.Music) ctl.mute.label.setText(A.Music.muted ? '✕' : '♪'); };
  ctl.togglePause = () => {
    if (ctl.confirm) return;
    ctl.paused = !ctl.paused; scene.paused = ctl.paused;
    if (ctl.paused) {
      ctl.shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(D.hand + 10).setInteractive().setScrollFactor(0);
      ctl.glyph = T().text(scene, W / 2, H / 2, '❚❚', { size: 48, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true }).setDepth(D.hand + 11).setScrollFactor(0);
      scene.tweens.pauseAll(); scene.time.paused = true;
      ctl.shade.on('pointerdown', () => ctl.togglePause());
    } else {
      ctl.shade.destroy(); ctl.glyph.destroy(); ctl.shade = ctl.glyph = null;
      scene.time.paused = false; scene.tweens.resumeAll();
    }
  };
  // Start over asks once. The chip sits under the button; anything else closes it.
  ctl.confirmRestart = () => {
    if (ctl.confirm) { ctl.closeConfirm(); return; }
    if (ctl.paused) ctl.togglePause();
    const w = 200, h = 72, x = W - 24 - w / 2, y = 70 + h / 2;
    const c = scene.add.container(x, y).setDepth(D.hand + 21).setScrollFactor(0);
    const shade = scene.add.rectangle(W / 2 - x, H / 2 - y, W, H, 0x000000, 0.25).setInteractive();
    shade.on('pointerdown', () => ctl.closeConfirm());
    const g = scene.add.graphics(); g.fillStyle(0x1c1712, 0.97); g.fillRoundedRect(-w / 2, -h / 2, w, h, 10); g.lineStyle(2, 0xd9433b, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    const t = T().text(scene, 0, -h / 2 + 16, 'Start over?', { size: 15, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true });
    const yes = scene.add.graphics(); yes.fillStyle(0xd9433b, 1); yes.fillRoundedRect(-w / 2 + 12, 4, 80, 30, 8);
    const yt = T().text(scene, -w / 2 + 52, 19, '✓', { size: 18, ox: 0.5, oy: 0.5, color: '#fff0ee', display: true });
    const yz = scene.add.zone(-w / 2 + 52, 19, 80, 30).setInteractive({ useHandCursor: true });
    const no = scene.add.graphics(); no.fillStyle(0x3a3128, 1); no.fillRoundedRect(w / 2 - 92, 4, 80, 30, 8);
    const nt = T().text(scene, w / 2 - 52, 19, '✕', { size: 18, ox: 0.5, oy: 0.5, color: '#c9c0b0', display: true });
    const nz = scene.add.zone(w / 2 - 52, 19, 80, 30).setInteractive({ useHandCursor: true });
    nz.on('pointerdown', () => ctl.closeConfirm());
    yz.on('pointerdown', () => { ctl.closeConfirm(); ctl.startOver(); });
    c.add([shade, g, t, yes, yt, yz, no, nt, nz]);
    ctl.confirm = { root: c, yesRect: { x: x - w / 2 + 12, y: y + 4, w: 80, h: 30 }, noRect: { x: x + w / 2 - 92, y: y + 4, w: 80, h: 30 } };
    scene.__confirmRect = ctl.confirm.yesRect;
  };
  ctl.closeConfirm = () => { if (ctl.confirm) { ctl.confirm.root.destroy(); ctl.confirm = null; scene.__confirmRect = null; } };
  ctl.startOver = () => {
    const fresh = X.Run.startOver(scene.run);
    if (opts.onStartOver) { opts.onStartOver(fresh); return; }
    scene.scene.start('Expedition', { run: fresh, fresh: true, seed: scene.seed != null ? scene.seed + 1 : undefined });
  };
  ctl.destroy = () => { ctl.closeConfirm(); if (ctl.paused) ctl.togglePause(); root.destroy(); };
  ctl.refresh();
  scene.corner = ctl;
  return ctl;
};

UI.bigButton = function (scene, x, y, w, h, glyph, label, onTap, color) {
  const c = scene.add.container(x, y).setDepth(D.hud);
  const g = scene.add.graphics(); g.fillStyle(0x14110d, 0.94); g.fillRoundedRect(-w / 2, -h / 2, w, h, 16); g.lineStyle(3, color || 0x5a4a34, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  const gl = T().text(scene, 0, -14, glyph, { size: 40, ox: 0.5, oy: 0.5, color: '#f4eee0' });
  const t = T().text(scene, 0, 34, label, { size: 15, ox: 0.5, oy: 0.5, color: '#e8dfc8', display: true });
  const z = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  z.on('pointerdown', onTap);
  c.add([g, gl, t, z]);
  c.rect = { x: x - w / 2, y: y - h / 2, w, h }; c.label = t; c.zone = z;
  return c;
};

UI.goldPill = function (scene, gold) {
  const pill = scene.add.container(24, 20).setDepth(D.hud).setScrollFactor(0);
  const gbg = scene.add.graphics(); gbg.fillStyle(0x14110d, 0.85); gbg.fillRoundedRect(0, 0, 150, 40, 10); gbg.lineStyle(2, 0x3a3128, 1); gbg.strokeRoundedRect(0, 0, 150, 40, 10);
  const text = T().text(scene, 100, 20, String(gold), { size: 20, ox: 1, oy: 0.5, display: true, color: '#f4eee0' });
  pill.add([gbg, scene.add.circle(122, 20, 12, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f), text]);
  pill.text = text; pill.rect = { x: 24, y: 20, w: 150, h: 40 };
  return pill;
};

// Placeholder Hiro: the authored head plate over the outfit plate, plus a face crop.
UI.ensureHiroTextures = function (scene) {
  if (scene.textures.exists('xp_hiro_face')) return;
  const src = scene.textures.get('xp_hiro_plates').getSourceImage();
  const c = document.createElement('canvas'); c.width = 520; c.height = 780;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 500, 0, 500, 500, 10, 250, 500, 500);
  ctx.drawImage(src, 0, 0, 500, 500, 100, 0, 320, 320);
  const g = ctx.createLinearGradient(0, 640, 0, 750); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = g; ctx.fillRect(0, 640, 520, 140);
  scene.textures.addCanvas('xp_hiro', c);
  const f = document.createElement('canvas'); f.width = 256; f.height = 256;
  f.getContext('2d').drawImage(src, 60, 20, 380, 380, 0, 0, 256, 256);
  scene.textures.addCanvas('xp_hiro_face', f);
};

// Baked recruit busts (tools/bake_busts.js → assets/expedition/busts/). Every
// scene preloads them; installBusts turns each into the same canvas texture the
// runtime composer would have made (with its portrait meta, so the dialogue
// face animation still works) and Portraits.key hands it out for that recruit.
// ?busts=0 composes from the part sheets instead (the bake tool uses it).
UI.BUSTS = 'assets/expedition/busts/';
UI.bustsOff = () => /[?&]busts=0/.test(location.search);
UI.preloadBusts = function (scene) {
  if (UI.bustsOff()) return;
  scene.load.json('xp_busts', UI.BUSTS + 'busts.json');
  scene.load.on('filecomplete-json-xp_busts', (key, type, data) => {
    for (const [k, b] of Object.entries((data && data.busts) || {})) if (!scene.textures.exists('xp_bust_' + k)) scene.load.image('xp_bust_img_' + k, UI.BUSTS + b.file);
  });
};
UI.installBusts = function (scene) {
  if (UI.bustsOff() || !scene.cache.json.exists('xp_busts')) return;
  const data = scene.cache.json.get('xp_busts');
  for (const [k, b] of Object.entries(data.busts || {})) {
    const key = 'xp_bust_' + k, imgKey = 'xp_bust_img_' + k;
    if (scene.textures.exists(key) || !scene.textures.exists(imgKey)) continue;
    const src = scene.textures.get(imgKey).getSourceImage();
    const tex = scene.textures.createCanvas(key, b.w || src.width, b.h || src.height);
    tex.getContext().drawImage(src, 0, 0); tex.refresh();
    if (A.AnimeArt && A.AnimeArt.META && b.meta) {
      const meta = Object.assign({}, b.meta, { id: key });
      // The face patch the composer keeps for expressions: cut from the bake at the rig's face rect.
      const r = meta.rig && meta.rig.face;
      if (r && r.length === 4) { const fp = document.createElement('canvas'); fp.width = r[2]; fp.height = r[3]; fp.getContext('2d').drawImage(src, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); meta.facePatch = fp; }
      A.AnimeArt.META.set(key, meta);
    }
    if (A.Portraits._meta && b.pmeta) A.Portraits._meta[key] = b.pmeta;
  }
};
(function () {
  const orig = A.Portraits.key;
  A.Portraits.key = function (scene, ch) {
    // Recruits are recognised by key, or by name for a combat-side copy that lost it.
    const rk = ch && (ch.companionKey || (X.recruits && !ch.isMonster && (X.recruits.find(d => d.name === ch.name && d.personalityId === ch.personalityId) || {}).key));
    const fk = !rk && ch && ch.expeditionHuman && ch.expeditionKey ? 'foe_' + ch.expeditionKey : null;
    const k = rk ? 'xp_bust_' + rk : fk ? 'xp_bust_' + fk : null;
    if (k && scene && scene.textures && scene.textures.exists(k)) return k;
    return orig.call(A.Portraits, scene, ch);
  };
})();

// A face crop from any composed portrait texture (for the HUD portrait of a picked hero).
UI.faceFrom = function (scene, textureKey, outKey) {
  if (scene.textures.exists(outKey)) return outKey;
  const src = scene.textures.get(textureKey).getSourceImage();
  const w = src.width, h = src.height;
  const f = document.createElement('canvas'); f.width = 256; f.height = 256;
  f.getContext('2d').drawImage(src, w * 0.15, 0, w * 0.7, h * 0.55, 0, 0, 256, 256);
  scene.textures.addCanvas(outKey, f);
  return outKey;
};
})();
