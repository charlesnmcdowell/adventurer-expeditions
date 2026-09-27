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

// Cel-shaded glove, drawn at native resolution for crisp mobile rendering.
function hand(scene, x, y, opts) {
  const c = scene.add.container(x, y).setDepth(D.hand),g=scene.add.graphics();
  const shape=(x,y,w,h,r,fill)=>{g.fillStyle(fill);g.fillRoundedRect(x,y,w,h,r);g.lineStyle(2,0x191e30);g.strokeRoundedRect(x,y,w,h,r);};
  shape(-17,-5,37,38,12,0xe9e3d3);shape(-13,-47,13,49,6,0xfff8e6);
  shape(0,-17,11,24,5,0xd8d1c4);shape(10,-12,10,23,5,0xc4bdb1);shape(18,-4,9,22,4,0xa9a6a1);shape(-25,5,14,23,6,0xfff8e6);
  g.lineStyle(2,0x9c958b);g.lineBetween(-7,8,12,13);g.lineBetween(-8,17,9,22);
  shape(-15,29,34,16,3,0x252c49);g.lineStyle(3,0xd9b76c);g.lineBetween(-13,32,17,32);g.lineBetween(-13,42,17,42);
  g.fillStyle(0x9c7dd7);g.fillTriangle(-3,34,4,34,0,40);
  c.add(g);c.setAngle(-30);
  if(!opts||opts.tap!==false)scene.tweens.add({targets:c,x:x-20,y:y-24,duration:460,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  return c;
}
UI.frame=function(scene,x,y,w,h){
  const g=scene.add.graphics();g.fillStyle(0x050912,.65);g.fillRoundedRect(x+4,y+6,w,h,12);
  g.fillStyle(0x121a2c,.98);g.fillRoundedRect(x,y,w,h,12);g.lineStyle(3,0xb69556);g.strokeRoundedRect(x,y,w,h,12);
  g.lineStyle(1,0x536079);g.strokeRoundedRect(x+6,y+6,w-12,h-12,8);
  g.fillStyle(0x35425c,.35);g.fillRoundedRect(x+9,y+9,w-18,Math.min(38,h/3),6);
  for(const px of [x+12,x+w-12])for(const py of [y+12,y+h-12]){g.fillStyle(0xf4d88d);g.fillCircle(px,py,2);}return g;
};
UI.medal=function(scene,x,y,rank){
  const g=scene.add.graphics(),metal=[0xe5bd61,0xb9ccde,0xb88862][rank]||0x626c83;
  g.fillStyle(0x68508d);g.fillTriangle(x-9,y+4,x-5,y+17,x,y+9);g.fillTriangle(x+9,y+4,x+5,y+17,x,y+9);
  g.fillStyle(0x111827);g.fillCircle(x,y,12);g.fillStyle(metal);g.fillCircle(x,y,10);g.lineStyle(1,0xffecc2,.7);g.strokeCircle(x,y,8);return g;
};
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
  if (opts.hint === 'hold') {
    // A press that stays: the hand sits on the control and a ring fills over the hold time, again and again.
    const h = hand(scene, rect.x + rect.w / 2 + 30, rect.y + rect.h / 2 + 40, { tap: false }); objs.push(h);
    const arc = scene.add.graphics().setDepth(D.gate + 2); objs.push(arc);
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2, rr = Math.max(rect.w, rect.h) / 2 + 14;
    const prog = { t: 0 };
    const tw = scene.tweens.add({ targets: prog, t: 1, duration: X.infoHoldMs || 3000, repeat: -1, onUpdate: () => {
      arc.clear(); arc.lineStyle(5, 0xffe28a, 0.95); arc.beginPath(); arc.arc(cx, cy, rr, -Math.PI / 2, -Math.PI / 2 + prog.t * Math.PI * 2, false); arc.strokePath();
    } });
    objs.push({ destroy: () => tw.stop() });
  } else objs.push(hand(scene, rect.x + rect.w / 2 + 46, rect.y + rect.h / 2 + 60));
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

// Two cameras: the world on the main camera (which the cinematic zooms and
// pans), the HUD — anything at depth ≥ DEPTH.hud — on a second, fixed camera.
// Objects are sorted every frame by depth, so chips, cards, gates and hands
// created later land on the right camera without registering themselves.
UI.splitCameras = function (scene) {
  if (scene.hudCam) return scene.hudCam;
  const main = scene.cameras.main;
  const hud = scene.cameras.add(0, 0, W, H, false, 'hud');
  hud.setScroll(0, 0);
  const sort = () => {
    const list = scene.children.list;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      const isHud = o.depth >= D.hud;
      const want = isHud ? main.id : hud.id;       // the camera that must IGNORE it
      if (o.cameraFilter !== want) o.cameraFilter = want;
    }
  };
  scene.events.on('prerender', sort);
  scene.events.once('shutdown', () => { scene.events.off('prerender', sort); scene.hudCam = null; });
  sort();
  scene.hudCam = hud;
  return hud;
};

// A cinematic beat: slow the world (tweens, animations, timers) and push the
// main camera toward a point while fn runs; restore after. kind: 'cast' | 'kill'.
// The camera's resting state for a scene: zoom 1, centred. Captured once, on
// the scene, and never re-read from the live camera — a baseline sampled while
// a restore pan was still in flight used to ratchet the zoom in a little on
// every kill, which is why the camera stopped returning to 1 (Hiro, round 3).
UI.cameraBase = function (scene) {
  if (!scene.__cameraBase) {
    const cam = scene.cameras.main;
    // The resting camera of every Expedition scene: unzoomed and centred on the
    // 1280x760 view. Nothing else scrolls or zooms it, so this is a constant
    // rather than a sample — which is the point (a sampled baseline drifted).
    scene.__cameraBase = { tween: 1, anim: 1, clock: 1, zoom: 1,
      x: cam.width / 2, y: cam.height / 2, scrollX: 0, scrollY: 0 };
  }
  return scene.__cameraBase;
};

// Put the world back: time scales to 1, camera effects cancelled, zoom and
// scroll snapped to the baseline. Every exit calls this — fight over, defeat,
// restart, Start over, scene shutdown — so nothing can leave the camera pushed in.
UI.resetCamera = function (scene) {
  const base = UI.cameraBase(scene), cam = scene.cameras && scene.cameras.main;
  try { scene.tweens.timeScale = base.tween; scene.anims.globalTimeScale = base.anim; scene.time.timeScale = base.clock; } catch (e) {}
  if (cam) {
    try { cam.panEffect && cam.panEffect.reset(); cam.zoomEffect && cam.zoomEffect.reset(); } catch (e) {}
    try { cam.setZoom(base.zoom); cam.setScroll(base.scrollX, base.scrollY); } catch (e) {}
  }
  const state = scene.__cinematicState;
  if (state) { state.tokens.length = 0; }
  scene.__cine = 0;
};

UI.cinematic = async function (scene, kind, focus, fn) {
  // Full speed: no push, no slow motion, no bookkeeping — just do the thing.
  if (X.fx && X.fx.cinematics === false) return await fn();
  const c = (X.cinematic && X.cinematic[kind]) || { scale: 0.7, zoom: 1.15, ms: 150 };
  const cam = scene.cameras.main;
  const base = UI.cameraBase(scene);
  let state = scene.__cinematicState;
  if (!state) {
    state = scene.__cinematicState = { tokens: [], closed: false, base };
    state.restore = () => {
      scene.tweens.timeScale = base.tween; scene.anims.globalTimeScale = base.anim; scene.time.timeScale = base.clock;
    };
    state.shutdown = () => { state.closed = true; UI.resetCamera(scene); scene.__cinematicState = null; };
    scene.events.once('shutdown', state.shutdown);
  }
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const token = { scale: reduced ? 1 : c.scale, zoom: reduced ? base.zoom : c.zoom,
    x: focus ? Math.max(W * .32, Math.min(W * .68, focus.x)) : base.x,
    y: focus ? Math.max(H * .42, Math.min(H * .6, focus.y)) : base.y };
  state.tokens.push(token); scene.__cine = state.tokens.length;
  const apply = current => {
    const k = current ? Math.min(...state.tokens.map(t => t.scale)) : 1;
    scene.tweens.timeScale = base.tween * k; scene.anims.globalTimeScale = base.anim * k; scene.time.timeScale = base.clock * k;
    const target = current || base;
    try { cam.pan(target.x, target.y, c.ms, 'Sine.easeOut', true); cam.zoomTo(target.zoom, c.ms, 'Sine.easeOut', true); } catch (e) {}
  };
  apply(token);
  try { return await fn(); }
  finally {
    if (!state.closed) {
      state.tokens = state.tokens.filter(t => t !== token); scene.__cine = state.tokens.length;
      apply(state.tokens[state.tokens.length - 1]);
      // The state (and its baseline) stays on the scene for the scene's life.
    }
  }
};

// The settings shown while paused. A labelled row that reads its own state, so
// it is always honest about what the game is doing.
UI.pauseSettings = function (scene, ctl) {
  const D2 = UI.DEPTH, W2 = A.T.W, H2 = A.T.H;
  const root = scene.add.container(W2 / 2, H2 / 2 + 30).setDepth(D2.hand + 12).setScrollFactor(0);
  const w = 420, rowH = 56;
  const rows = [{
    label: 'Cinematic camera',
    hint: 'the push in and slow motion on finishers',
    get: () => !(X.fx && X.fx.cinematics === false),
    set: v => { X.fx = X.fx || {}; X.fx.cinematics = v; },
  }, {
    label: 'Turn speed',
    hint: 'how long you get between turns',
    options: ['slow', 'normal', 'fast'],
    value: () => (X.pacing && X.pacing.mode) || 'normal',
    pick: v => { X.pacing = X.pacing || {}; X.pacing.mode = v; },
  }];
  const drawn = [];
  rows.forEach((row, i) => {
    const y = i * rowH;
    const cycle = !!row.options;
    const on = cycle ? row.value() !== 'normal' : row.get();
    const shown = () => cycle ? row.value() : (row.get() ? 'On' : 'Off');
    const g = scene.add.graphics();
    g.fillStyle(0x14110d, 0.95); g.fillRoundedRect(-w / 2, y - rowH / 2 + 4, w, rowH - 8, 10);
    g.lineStyle(2, 0x3a3128, 1); g.strokeRoundedRect(-w / 2, y - rowH / 2 + 4, w, rowH - 8, 10);
    const t = T().text(scene, -w / 2 + 16, y - 8, row.label, { size: 15, oy: 0.5, color: '#f4eee0', display: true });
    const h = T().text(scene, -w / 2 + 16, y + 11, row.hint, { size: 11, oy: 0.5, color: '#8d8377' });
    const lit = () => cycle ? row.value() !== 'normal' : row.get();
    const pill = scene.add.graphics();
    const paint = () => { pill.clear(); pill.fillStyle(lit() ? 0x2f6b2c : 0x3a3128, 1); pill.fillRoundedRect(w / 2 - 92, y - 13, 76, 26, 13); };
    paint();
    const pt = T().text(scene, w / 2 - 54, y, shown(), { size: 13, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true });
    const z = scene.add.zone(w / 2 - 54, y, 76, 26).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      if (cycle) { const o = row.options; row.pick(o[(o.indexOf(row.value()) + 1) % o.length]); }
      else row.set(!row.get());
      paint(); pt.setText(shown());
    });
    root.add([g, t, h, pill, pt, z]);
    drawn.push({ label: row.label, rect: { x: W2 / 2 + w / 2 - 92, y: H2 / 2 + 30 + y - 13, w: 76, h: 26 } });
  });
  // Arcade (Hiro, 2026-09-27): two buttons under the settings — High scores
  // shows the board; End run asks once, then ends the run and scores it.
  const by = rows.length * rowH + 10, bw = 196, bh = 44;
  const button = (cx, label, color, fg, onTap) => {
    const g = scene.add.graphics(); g.fillStyle(color, 1); g.fillRoundedRect(cx - bw / 2, by - bh / 2, bw, bh, 10);
    const t = T().text(scene, cx, by, label, { size: 15, ox: 0.5, oy: 0.5, color: fg, display: true });
    const z = scene.add.zone(cx, by, bw, bh).setInteractive({ useHandCursor: true });
    z.on('pointerdown', onTap);
    root.add([g, t, z]);
    return { x: W2 / 2 + cx - bw / 2, y: H2 / 2 + 30 + by - bh / 2, w: bw, h: bh };
  };
  const api = { root, rows: drawn };
  api.boardRect = button(-w / 4 - 4, 'High scores', 0x3a3128, '#f4eee0', () => { if (!scene.__boardOpen) UI.boardPanel(scene); });
  api.endRect = button(w / 4 + 4, 'End run', 0x7a1f1f, '#fff0ee', () => {
    if (api.confirm) return;
    // One confirm so a mis-tap never ends a run.
    const cw = 300, ch = 84, cy = by + 70;
    const c = scene.add.container(0, cy);
    const g = scene.add.graphics(); g.fillStyle(0x1c1712, 0.98); g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 10); g.lineStyle(2, 0xd9433b, 1); g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    const t = T().text(scene, 0, -ch / 2 + 20, 'End this run and score it?', { size: 15, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true });
    const yes = scene.add.graphics(); yes.fillStyle(0xd9433b, 1); yes.fillRoundedRect(-cw / 2 + 16, 8, 120, 34, 8);
    const yt = T().text(scene, -cw / 2 + 76, 25, 'End run', { size: 15, ox: 0.5, oy: 0.5, color: '#fff0ee', display: true });
    const yz = scene.add.zone(-cw / 2 + 76, 25, 120, 34).setInteractive({ useHandCursor: true });
    const no = scene.add.graphics(); no.fillStyle(0x3a3128, 1); no.fillRoundedRect(cw / 2 - 136, 8, 120, 34, 8);
    const nt = T().text(scene, cw / 2 - 76, 25, 'Keep playing', { size: 15, ox: 0.5, oy: 0.5, color: '#c9c0b0', display: true });
    const nz = scene.add.zone(cw / 2 - 76, 25, 120, 34).setInteractive({ useHandCursor: true });
    nz.on('pointerdown', () => { c.destroy(); api.confirm = null; });
    yz.on('pointerdown', () => { c.destroy(); api.confirm = null; if (ctl.paused) ctl.togglePause(); UI.endRun(scene, 'quit'); });
    c.add([g, t, yes, yt, yz, no, nt, nz]);
    root.add(c);
    api.confirm = { root: c, yesRect: { x: W2 / 2 - cw / 2 + 16, y: H2 / 2 + 30 + cy + 8, w: 120, h: 34 } };
    scene.__endConfirmRect = api.confirm.yesRect;
  });
  scene.__settingRects = drawn;
  scene.__pauseButtons = { board: api.boardRect, end: api.endRect };
  api.destroy = () => { try { root.destroy(); } catch (e) {} scene.__settingRects = null; scene.__pauseButtons = null; scene.__endConfirmRect = null; };
  return api;
};

// ---------------------------------------------------------------- arcade: the board and the end of a run
// The top-10 board, drawn into a container at (x, y) with the given width.
// `highlight` marks one row (the run that was just entered). Returns the
// container with `.rows` (the data) and `.height`.
UI.boardList = function (scene, x, y, w, opts) {
  opts = opts || {};
  const rows = opts.rows || X.Board.load();
  const c = scene.add.container(x, y).setDepth(opts.depth != null ? opts.depth : D.hud + 6).setScrollFactor(0);
  const rowH = opts.rowH || 30, n = X.board.size;
  for (let i = 0; i < n; i++) {
    const r = rows[i], ry = i * rowH, mine = opts.highlight != null && opts.highlight === i;
    const stripe=scene.add.graphics();stripe.fillStyle(mine?0xc59b48:0x223149,mine?.30:(i%2?.52:.25));stripe.fillRoundedRect(-w/2,ry-rowH/2+1,w,rowH-2,4);c.add(stripe);
    if(i<3)c.add(UI.medal(scene,-w/2+21,ry,i));
    const color = mine ? '#ffe28a' : r ? '#f4eee0' : '#5e564b';
    c.add(T().text(scene, -w / 2 + 21, ry, String(i + 1), { size: 15, ox: 0.5, oy: 0.5, color: i<3?'#141a28':color, display: true }));
    c.add(T().text(scene, -w / 2 + 48, ry, r ? r.name : '—', { size: 15, ox: 0, oy: 0.5, color, display: true }));
    if (r) c.add(T().text(scene, w / 2 - 96, ry, 'x' + (r.loop || 1), { size: 12, ox: 1, oy: 0.5, color: mine ? '#ffe28a' : '#8d8377' }));
    c.add(T().text(scene, w / 2 - 12, ry, r ? String(r.score) : '', { size: 15, ox: 1, oy: 0.5, color, display: true }));
  }
  c.rows = rows; c.height = n * rowH;
  return c;
};

// A framed board panel with a close button, over any scene (pause menu, inn).
UI.boardPanel = function (scene, onClose) {
  const w = 460, h = 420, x = W / 2, y = H / 2;
  const root = scene.add.container(x, y).setDepth(D.hand + 14).setScrollFactor(0);
  const shade = scene.add.rectangle(0, 0, W, H, 0x000000, 0.45).setInteractive();
  const g = UI.frame(scene,-w/2,-h/2,w,h);
  const title = T().text(scene, 0, -h / 2 + 30, 'High scores', { size: 24, ox: 0.5, oy: 0.5, display: true, color: '#f4eee0' });
  const list = UI.boardList(scene, 0, -h / 2 + 76, w - 40, { depth: D.hand + 15, highlight: X.Board.load().length ? 0 : null });
  list.setDepth(0);
  const bw = 160, bh = 40, by = h / 2 - 36;
  const bg = scene.add.graphics(); bg.fillStyle(0x3a3128, 1); bg.fillRoundedRect(-bw / 2, by - bh / 2, bw, bh, 10);
  const bt = T().text(scene, 0, by, 'Close', { size: 16, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true });
  const bz = scene.add.zone(0, by, bw, bh).setInteractive({ useHandCursor: true });
  const close = () => { root.destroy(); scene.__boardOpen = false; if (onClose) onClose(); };
  bz.on('pointerdown', close); shade.on('pointerdown', close);
  root.add([shade, g, title, list, bg, bt, bz]);
  scene.__boardOpen = true;
  return { root, close, closeRect: { x: x - bw / 2, y: y + by - bh / 2, w: bw, h: bh } };
};

// End the run from any scene (Hiro, 2026-09-27: the End Run button). The run
// is marked over and saved once, so a reload lands on the end screen, then
// the End scene takes it from there.
UI.endRun = function (scene, why) {
  const run = scene.run || X.Run.load() || X.Run.fresh();
  if (scene.hero && scene.hero.unit) X.Encounter.rememberHp(run, scene.hero.unit);
  if (scene.ended != null) scene.ended = true;
  UI.resetCamera(scene);
  // A fight interrupted mid-beat must not finish its tweens and timers into a
  // scene that is gone: kill them here, callbacks and all.
  try { scene.time.paused = false; scene.tweens.killAll(); scene.time.removeAllEvents(); } catch (e) {}
  run.over = why || 'quit'; run.phase = 'end'; X.Run.save(run);
  scene.scene.start('End', { run, seed: scene.seed, why: why || 'quit' });
};

// Reload into a guaranteed-clean session. Returns false when there is no URL to
// work with, so callers can fall back to restarting the scene in place.
UI.reloadFresh = function () {
  try {
    if (typeof location !== 'function' && !location.href) return false;
    const u = new URL(location.href);
    u.searchParams.set('fresh', '1');
    for (const p of ['at', 'gold', 'score', 'seed']) u.searchParams.delete(p);   // a jump must not survive a restart
    location.replace(u.toString());
    return true;
  } catch (e) { return false; }
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
  const ctl = { root, paused: false, button: btn };
  ctl.mute = btn(W - 190, '♪', () => { if (A.Music) A.Music.toggleMute(); ctl.refresh(); });
  ctl.pause = btn(W - 130, '❚❚', () => ctl.togglePause());
  ctl.restart = btn(W - 70, '↺', () => ctl.confirmRestart());
  ctl.refresh = () => { if (A.Music) ctl.mute.label.setText(A.Music.muted ? '✕' : '♪'); };
  ctl.togglePause = () => {
    if (ctl.confirm) return;
    ctl.paused = !ctl.paused; scene.paused = ctl.paused;
    if (ctl.paused) {
      ctl.shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(D.hand + 10).setInteractive().setScrollFactor(0);
      ctl.glyph = T().text(scene, W / 2, H / 2 - 60, '❚❚', { size: 48, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true }).setDepth(D.hand + 11).setScrollFactor(0);
      scene.tweens.pauseAll(); scene.time.paused = true;
      ctl.shade.on('pointerdown', () => ctl.togglePause());
      // Settings live on the pause screen (Hiro, 2026-09-21). One row for now:
      // the cinematic camera and its slow motion, which some players will want
      // and some will find in the way. Off by default while the game is being
      // judged at full speed.
      ctl.settings = UI.pauseSettings(scene, ctl);
    } else {
      ctl.shade.destroy(); ctl.glyph.destroy(); ctl.shade = ctl.glyph = null;
      if (ctl.settings) { ctl.settings.destroy(); ctl.settings = null; }
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
    UI.resetCamera(scene);                       // never carry a pushed-in camera into a fresh run (round 3 #1)
    if (X.Dev && X.Dev.resetOverrides) X.Dev.resetOverrides();
    const fresh = X.Run.startOver(scene.run);
    if (opts.onStartOver) { opts.onStartOver(fresh); return; }
    // Reload the page rather than restarting the scene in place (Hiro,
    // 2026-09-21: "should be a fresh start, ?fresh=1 or something like that").
    // The run always reset correctly, but a scene restart cannot clear what
    // lives outside the run — a stale cached script, leftover scene or audio
    // state, a developer toggle — so the board came back while the session
    // around it did not. A reload with ?fresh=1 is the same path the URL takes,
    // and it is the only one that is genuinely a first launch. Falls back to
    // the in-place restart wherever there is no URL to reload.
    if (UI.reloadFresh()) return;
    scene.scene.start('Expedition', { run: fresh, fresh: true, seed: scene.seed != null ? scene.seed + 1 : undefined });
  };
  ctl.destroy = () => { ctl.closeConfirm(); if (ctl.paused) ctl.togglePause(); root.destroy(); };
  ctl.refresh();
  scene.corner = ctl;
  if (X.Dev && X.Dev.attach) X.Dev.attach(scene, ctl);      // nothing for a player; the ⚙ appears only when the developer turns it on
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

// The score pill (arcade): the same shape the gold purse had, a star for a coin.
UI.scorePill = function (scene, score) {
  const pill = scene.add.container(24, 20).setDepth(D.hud).setScrollFactor(0);
  const gbg = UI.frame(scene,0,0,170,40);
  const text = T().text(scene, 132, 20, String(score || 0), { size: 20, ox: 1, oy: 0.5, display: true, color: '#f4eee0' });
  pill.add([gbg, T().text(scene, 152, 20, '★', { size: 20, ox: 0.5, oy: 0.5, display: true, color: '#f2c94c' }), text]);
  pill.text = text; pill.rect = { x: 24, y: 20, w: 170, h: 40 };
  return pill;
};
UI.goldPill = UI.scorePill;

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
    for (const [k, b] of Object.entries((data && data.busts) || {})) if (k === 'bram' && !scene.textures.exists('xp_bust_' + k)) scene.load.image('xp_bust_img_' + k, UI.BUSTS + b.file);
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
