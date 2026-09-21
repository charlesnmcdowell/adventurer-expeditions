// Adventurer: Expeditions — the developer's panel.
//
// Everything that used to live in a URL parameter is a button here, because the
// person building this game plays it the way a player does (Hiro, 2026-09-21).
//
// While the game is in development the tools are simply there: the cog sits in
// the corner of every scene, on the desktop and on a phone, with no key to
// remember. One flag turns the whole thing off for the build that goes to
// CrazyGames — see DEV_BUILD below, and `npm run release:check`, which refuses
// to bless a package while it is still on.
(function () {
'use strict';
const A = ADV, X = A.Expedition, UI = X.UI;
const T = () => A.T;
const Dev = X.Dev = {};
const KEY = 'adventurer_expeditions_dev';
const store = () => { try { return window.localStorage; } catch (e) { return null; } };

// ---------------------------------------------------------------- the flag
// THE ONE SWITCH. true while we are building the game: the cog is in every
// scene. Set it to false for the CrazyGames package and the tools disappear
// completely — no cog, no panel, no keyboard shortcut, and nothing a stored
// setting or a URL can do to bring them back.
Dev.DEV_BUILD = true;

// Off for one session without touching the flag: ?dev=0 (and ?dev=1 back on).
// Handy for looking at the game exactly as a player will before shipping.
const asked = (function () {
  try { const v = new URLSearchParams(location.search).get('dev'); return v == null ? null : v !== '0'; } catch (e) { return null; }
})();
Dev.enabled = function () {
  if (!Dev.DEV_BUILD) return false;
  if (asked != null) return asked;
  const s = store();
  try { const v = s && s.getItem(KEY); if (v === '0') return false; } catch (e) {}
  return true;
};
Dev.setEnabled = function (on) { const s = store(); try { s && (on ? s.removeItem(KEY) : s.setItem(KEY, '0')); } catch (e) {} };

// Kept for the tests and the old boot path: which machine we are on. It no
// longer gates anything — DEV_BUILD does.
Dev.local = function () {
  try {
    const h = location.hostname;
    return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '' || /^192\.168\./.test(h) || /^10\./.test(h);
  } catch (e) { return false; }
};

// ---------------------------------------------------------------- runs
// The inn shortcut, as a run: the road behind you, gold in hand, the tutorial's
// combat guidance retired but the inn's own guidance still to come.
Dev.innRun = function (gold) {
  const run = X.Run.reset();
  run.questsDone = ['road']; run.phase = 'inn';
  run.gold = gold == null ? 150 : gold;
  Object.assign(run.tutorial, { arrowDone: true, finisherDone: true, purchases: 3, used: { finisher: true, god_aura: true, counter_attack: true }, inspectDone: true, recruitDone: false, embarkDone: false });
  X.Run.save(run);
  return run;
};

// ---------------------------------------------------------------- the panel
const ITEMS = [
  { label: 'Fresh tutorial', hint: 'wipe everything, start the road', run: scene => {
      const run = X.Run.reset(); X.Run.save(run);
      Dev.go(scene, 'Expedition', { run, fresh: true });
    } },
  { label: 'Jump to the inn', hint: 'road cleared, 150 gold', run: scene => {
      Dev.go(scene, 'Inn', { run: Dev.innRun(150) });
    } },
  { label: 'Boss fight', hint: 'the road, last wave', run: scene => {
      const run = X.Run.reset();
      run.phase = 'quest'; run.questId = 'road'; run.wave = Math.max(0, X.Campaign.questEncounters('road').length - 1); run.checkpoint = run.wave;
      Object.assign(run.levels, { finisher: 1, god_aura: 1, counter_attack: 1 });
      Object.assign(run.tutorial, { arrowDone: true, finisherDone: true, purchases: 3, inspectDone: true, skipGuide: true });
      X.Run.save(run);
      Dev.go(scene, 'Expedition', { run });
    } },
  { label: '+100 gold', hint: '', keep: true, run: scene => {
      if (!scene.run) return;
      scene.run.gold += 100; X.Run.save(scene.run);
      if (scene.hud) { scene.hud.setGold(scene.run.gold, true); scene.hud.refresh(); }
      if (scene.pill) scene.pill.text.setText(String(scene.run.gold));
      if (scene.refreshBusts) scene.refreshBusts();
    } },
  { label: 'Unlock every skill', hint: 'level 3', keep: true, run: scene => {
      if (!scene.run) return;
      for (const id of X.purchasable) scene.run.levels[id] = 3;
      X.Run.save(scene.run);
      if (scene.hud) scene.hud.refresh();
    } },
  { label: 'Open every quest', hint: 'lifts the slice lock', keep: true, toggle: () => !(X.slice && X.slice.firstLevelOnly), run: () => {
      X.slice.firstLevelOnly = !X.slice.firstLevelOnly;
    } },
  { label: 'Painted art off', hint: 'compare against the plates', keep: true, toggle: () => !(X.art && X.art.hiroSheet), run: scene => {
      X.art.hiroSheet = !X.art.hiroSheet;
      Dev.go(scene, scene.scene.key, { run: scene.run });
    } },
  { label: 'Clear the save', hint: 'back to a blank slate', run: scene => {
      X.Run.reset();
      Dev.go(scene, 'Expedition', { fresh: true });
    } },
];

// Leave the current scene cleanly: the camera comes home first, exactly as it
// does for Start over, so a jump can never strand a pushed-in camera.
Dev.go = function (scene, key, data) {
  if (UI && UI.resetCamera) UI.resetCamera(scene);
  const seed = scene.seed != null ? scene.seed + 1 : undefined;
  scene.scene.start(key, Object.assign({ seed }, data || {}));
};

Dev.close = function (scene) {
  if (scene.__devPanel) { scene.__devPanel.destroy(); scene.__devPanel = null; }
  scene.__devRects = null;
};

Dev.open = function (scene) {
  Dev.close(scene);
  const W = A.T.W, H = A.T.H, D = UI.DEPTH;
  const w = 300, rowH = 44, pad = 14;
  const h = pad * 2 + 26 + ITEMS.length * rowH;
  const x = W / 2, y = H / 2;
  const root = scene.add.container(x, y).setDepth(D.hand + 40).setScrollFactor(0);
  const shade = scene.add.rectangle(0, 0, W, H, 0x000000, 0.45).setInteractive();
  shade.on('pointerdown', () => Dev.close(scene));
  const g = scene.add.graphics();
  g.fillStyle(0x14110d, 0.97); g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
  g.lineStyle(2, 0x62c95a, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
  const title = T().text(scene, 0, -h / 2 + 18, 'Developer', { size: 16, ox: 0.5, oy: 0.5, color: '#9fd86a', display: true });
  root.add([shade, g, title]);
  const rects = [];
  ITEMS.forEach((item, i) => {
    const ry = -h / 2 + pad + 26 + i * rowH + rowH / 2;
    const on = item.toggle ? item.toggle() : false;
    const bg = scene.add.graphics();
    bg.fillStyle(on ? 0x24402a : 0x1f1a15, 1); bg.fillRoundedRect(-w / 2 + pad, ry - rowH / 2 + 4, w - pad * 2, rowH - 8, 8);
    bg.lineStyle(1, on ? 0x62c95a : 0x3a3128, 1); bg.strokeRoundedRect(-w / 2 + pad, ry - rowH / 2 + 4, w - pad * 2, rowH - 8, 8);
    const label = T().text(scene, -w / 2 + pad + 12, ry - (item.hint ? 7 : 0), item.label + (on ? '  ✓' : ''), { size: 14, oy: 0.5, color: '#f4eee0', display: true });
    const hint = item.hint ? T().text(scene, -w / 2 + pad + 12, ry + 9, item.hint, { size: 11, oy: 0.5, color: '#8d8377' }) : null;
    const zone = scene.add.zone(0, ry, w - pad * 2, rowH - 8).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      try { item.run(scene); } catch (e) { console.warn('dev:', e); }
      if (item.keep) Dev.open(scene); else Dev.close(scene);
    });
    root.add(bg); root.add(label); if (hint) root.add(hint); root.add(zone);
    rects.push({ label: item.label, rect: { x: x - w / 2 + pad, y: y + ry - rowH / 2 + 4, w: w - pad * 2, h: rowH - 8 } });
  });
  const close = T().text(scene, w / 2 - 18, -h / 2 + 18, '✕', { size: 16, ox: 0.5, oy: 0.5, color: '#c9c0b0' });
  const cz = scene.add.zone(w / 2 - 18, -h / 2 + 18, 34, 34).setInteractive({ useHandCursor: true });
  cz.on('pointerdown', () => Dev.close(scene));
  root.add([close, cz]);
  scene.__devPanel = root;
  scene.__devRects = rects;
  scene.events.once('shutdown', () => { scene.__devPanel = null; scene.__devRects = null; });
  return rects;
};

// ---------------------------------------------------------------- mounting
// Called by every scene's corner control. In a shipping build this returns
// before it does anything at all.
Dev.attach = function (scene, corner) {
  if (!Dev.DEV_BUILD) return;
  const arm = () => {
    if (!Dev.enabled() || scene.__devButton || !corner || !corner.button) return;
    scene.__devButton = corner.button(A.T.W - 250, '\u2699', () => { if (scene.__devPanel) Dev.close(scene); else Dev.open(scene); });
  };
  const disarm = () => {
    Dev.close(scene);
    if (scene.__devButton) { try { scene.__devButton.destroy(); } catch (e) {} scene.__devButton = null; }
  };
  arm();
  // Shift+D hides the tools and brings them back, so the game can be looked at
  // through a player's eyes without a reload.
  const onKey = e => {
    if (!(e.shiftKey && (e.key === 'D' || e.key === 'd'))) return;
    Dev.setEnabled(!Dev.enabled());
    if (Dev.enabled()) arm(); else disarm();
  };
  window.addEventListener('keydown', onKey);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', onKey));
};
})();
