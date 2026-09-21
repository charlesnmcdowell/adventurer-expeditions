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
// While this is a development build the tools are ALWAYS there (Hiro,
// 2026-09-21: "it needs to always be available ... they should show up for now
// to make it easier for me to debug the game"). There used to be a stored
// "hidden" flag that Shift+D set, and pressing it once made the cog vanish for
// good — across reloads, with no way back from inside the game. That flag is
// gone; DEV_BUILD is the only switch, and flipping it to false for the
// CrazyGames package removes every trace of the tools.
Dev.enabled = function () { return !!Dev.DEV_BUILD; };
Dev.setEnabled = function () {};                       // kept so old callers are harmless
// Clear the stale flag from any browser that still carries one, so the cog
// comes back on the next load without anyone opening developer tools.
try { const s0 = store(); if (s0 && s0.getItem(KEY) !== null) s0.removeItem(KEY); } catch (e) {}

// Kept for the tests and the old boot path: which machine we are on. It no
// longer gates anything — DEV_BUILD does.
Dev.local = function () {
  try {
    const h = location.hostname;
    return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '' || /^192\.168\./.test(h) || /^10\./.test(h);
  } catch (e) { return false; }
};

// What the game looks like untouched. Captured at load, before any toggle can
// run, so "Start over" can put everything back — not just the save.
const DEFAULTS = {
  firstLevelOnly: !!(X.slice && X.slice.firstLevelOnly),
  openQuests: ((X.slice && X.slice.openQuests) || []).slice(),
  hiroSheet: !!(X.art && X.art.hiroSheet),
  cinematics: !(X.fx && X.fx.cinematics === false),
};

// Put every developer override back (Hiro, 2026-09-21: Start over "is not doing
// a fresh restart"). The run itself always reset correctly; what carried over
// was the panel's own state — a lifted slice lock from previewing a location,
// a weather override, full speed, the art switch. None of that lives in the
// save, so wiping the save never touched it, and the next run did not look like
// a first launch. Start over now calls this.
Dev.resetOverrides = function () {
  if (X.slice) { X.slice.firstLevelOnly = DEFAULTS.firstLevelOnly; X.slice.openQuests = DEFAULTS.openQuests.slice(); }
  if (X.art) X.art.hiroSheet = DEFAULTS.hiroSheet;
  X.fx = X.fx || {}; X.fx.cinematics = DEFAULTS.cinematics;
  X.devWeather = null; X.devPhase = null;
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
  { label: 'Full speed', hint: 'no camera push, no slow motion', keep: true,
    toggle: () => !!(X.fx && X.fx.cinematics === false), run: () => {
      X.fx = X.fx || {};
      X.fx.cinematics = X.fx.cinematics === false;     // off -> on, on -> off
    } },
  { label: 'Preview a location', hint: 'any quest, local build only', nav: true, run: scene => Dev.openPreview(scene) },
  // Cycle the sky and the hour on whatever is on screen. Both are overrides the
  // quest itself does not carry, so they survive a scene restart and are cleared
  // by picking "as written".
  { label: () => 'Weather: ' + (X.devWeather || 'as written'), hint: 'clear, overcast, rain, storm', keep: true, run: scene => {
      const order = [null].concat(Object.keys(X.weatherKinds || {}));
      X.devWeather = order[(order.indexOf(X.devWeather || null) + 1) % order.length];
      Dev.restage(scene);
    } },
  { label: () => 'Time: ' + (X.devPhase || 'as written'), hint: 'day, evening, night', keep: true, run: scene => {
      const order = [null, 'day', 'evening', 'night'];
      X.devPhase = order[(order.indexOf(X.devPhase || null) + 1) % order.length];
      Dev.restage(scene);
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

// Re-enter the scene that is on screen so a changed sky is actually painted.
// The run is saved first, so the restart picks up exactly where it was.
Dev.restage = function (scene) {
  try {
    const key = scene.scene.key;
    if (scene.run) X.Run.save(scene.run);
    Dev.go(scene, key, { run: scene.run || (scene.opts && scene.opts.run), leg: scene.leg });
  } catch (e) { console.warn('dev restage:', e); }
};

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

// Every quest, as somewhere to stand and look. Lifts the slice lock so
// sanitation keeps the choice, retires the guidance, and drops the player into
// the travel panorama so the location is the first thing on screen. The marsh
// and the ruins are not in the packaged build (GDD 5), so this works on a local
// server — which is where the panel lives anyway — and not in a --ship run.
const previewItems = () => (X.quests || []).map(q => ({
  label: q.title,
  hint: q.id === 'road' ? 'the tutorial road' : q.plates[0] + ', ' + q.weather + ', ' + q.phase,
  run: scene => {
    if (X.slice) X.slice.firstLevelOnly = false;
    const run = X.Run.reset();
    run.phase = 'travel'; run.questId = q.id; run.wave = 0; run.checkpoint = 0; run.travelLeg = 'outbound';
    run.questsDone = q.tutorial ? [] : ['road'];
    run.gold = 150;
    Object.assign(run.levels, { finisher: 1, god_aura: 1, counter_attack: 1 });
    Object.assign(run.tutorial, { arrowDone: true, finisherDone: true, purchases: 3, inspectDone: true, skipGuide: true,
      used: { finisher: true, god_aura: true, counter_attack: true } });
    X.Run.save(run);
    Dev.go(scene, 'Travel', { run, leg: 'outbound' });
  },
}));

Dev.open = scene => Dev.panel(scene, 'Developer', ITEMS);
Dev.openPreview = scene => Dev.panel(scene, 'Preview a location', previewItems().concat(
  { label: '\u2039  Back', hint: '', nav: true, run: s2 => Dev.open(s2) }));

Dev.panel = function (scene, title, items) {
  Dev.close(scene);
  const W = A.T.W, H = A.T.H, D = UI.DEPTH;
  const w = 300, rowH = 44, pad = 14;
  const h = pad * 2 + 26 + items.length * rowH;
  const x = W / 2, y = H / 2;
  const root = scene.add.container(x, y).setDepth(D.hand + 40).setScrollFactor(0);
  const shade = scene.add.rectangle(0, 0, W, H, 0x000000, 0.45).setInteractive();
  shade.on('pointerdown', () => Dev.close(scene));
  const g = scene.add.graphics();
  g.fillStyle(0x14110d, 0.97); g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
  g.lineStyle(2, 0x62c95a, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
  const heading = T().text(scene, 0, -h / 2 + 18, title, { size: 16, ox: 0.5, oy: 0.5, color: '#9fd86a', display: true });
  root.add([shade, g, heading]);
  const rects = [];
  items.forEach((item, i) => {
    const ry = -h / 2 + pad + 26 + i * rowH + rowH / 2;
    const on = item.toggle ? item.toggle() : false;
    const text = typeof item.label === 'function' ? item.label() : item.label;
    const bg = scene.add.graphics();
    bg.fillStyle(on ? 0x24402a : 0x1f1a15, 1); bg.fillRoundedRect(-w / 2 + pad, ry - rowH / 2 + 4, w - pad * 2, rowH - 8, 8);
    bg.lineStyle(1, on ? 0x62c95a : 0x3a3128, 1); bg.strokeRoundedRect(-w / 2 + pad, ry - rowH / 2 + 4, w - pad * 2, rowH - 8, 8);
    const label = T().text(scene, -w / 2 + pad + 12, ry - (item.hint ? 7 : 0), text + (on ? '  ✓' : ''), { size: 14, oy: 0.5, color: '#f4eee0', display: true });
    const hint = item.hint ? T().text(scene, -w / 2 + pad + 12, ry + 9, item.hint, { size: 11, oy: 0.5, color: '#8d8377' }) : null;
    const zone = scene.add.zone(0, ry, w - pad * 2, rowH - 8).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      try { item.run(scene); } catch (e) { console.warn('dev:', e); }
      if (item.nav) return;                            // it opened a panel of its own
      if (item.keep) Dev.panel(scene, title, items); else Dev.close(scene);
    });
    root.add(bg); root.add(label); if (hint) root.add(hint); root.add(zone);
    rects.push({ label: text, rect: { x: x - w / 2 + pad, y: y + ry - rowH / 2 + 4, w: w - pad * 2, h: rowH - 8 } });
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
  arm();
  // Shift+D opens and closes the PANEL. It used to hide the tools themselves,
  // which is how the cog disappeared and stayed gone.
  const onKey = e => {
    if (!(e.shiftKey && (e.key === 'D' || e.key === 'd'))) return;
    arm();
    if (scene.__devPanel) Dev.close(scene); else Dev.open(scene);
  };
  window.addEventListener('keydown', onKey);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', onKey));
};
})();
