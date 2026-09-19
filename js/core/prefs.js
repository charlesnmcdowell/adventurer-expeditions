// Player display and combat prefs. Lives in this browser, not the save,
// so a new life keeps the type size and the enemy-turn pause.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const KEY = 'adv:prefs';
const DEFAULTS = { textScale: 1, pauseEnemy: false, artMotion: true, secondaryMotion: true, titleMotion: true, censorProfanity: false };

let cache = null;
function read() {
  if (cache) return cache;
  try { cache = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}') || {}); }
  catch (e) { cache = Object.assign({}, DEFAULTS); }
  if (!(cache.textScale > 0)) cache.textScale = 1;
  cache.pauseEnemy = !!cache.pauseEnemy;
  cache.censorProfanity = cache.censorProfanity === true;
  return cache;
}
function write(next) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
}

// Another open game tab may record the once-per-browser support invitation.
// Refresh on its next read so an already-open tab does not show the ask again.
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) { cache = null; ADV.Censorship?.refresh(); }
  });
}

const Prefs = {};
Prefs.get = function () { return Object.assign({}, read(), ADV.Release?.target === 'crazygames' ? { censorProfanity: true } : {}); };
Prefs.set = function (patch) {
  const before = Prefs.get().censorProfanity;
  write(Object.assign({}, read(), patch || {}, ADV.Release?.target === 'crazygames' ? { censorProfanity: true } : {}));
  if (before !== Prefs.get().censorProfanity) ADV.Censorship?.refresh();
};
Prefs.textScale = function () { return read().textScale || 1; };
Prefs.pauseEnemy = function () { return !!read().pauseEnemy; };
Prefs.setPauseEnemy = function (on) { Prefs.set({ pauseEnemy: !!on }); };
Prefs.setTextScale = function (n) {
  const v = n >= 1.3 ? 1.35 : n >= 1.1 ? 1.2 : 1;
  Prefs.set({ textScale: v });
};

ADV.Prefs = Prefs;

// Fullscreen: one control used by the title, Settings, and the town corner.
// Browser chrome hides via the Fullscreen API; the canvas then refits so the
// game fills whatever display the player is on (phone, tablet, or monitor).
const Display = {};
const watchers = new Set();

function doc() { return typeof document !== 'undefined' ? document : null; }
function win() { return typeof window !== 'undefined' ? window : null; }

Display.label = function () { return Display.active() ? 'Exit fullscreen' : 'Fullscreen'; };
Display.active = function () {
  const d = doc();
  if (!d) return false;
  if (d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement) return true;
  const g = win() && win().__game;
  return !!(g && g.scale && g.scale.isFullscreen);
};
Display.supported = function () {
  if (ADV.Release?.target === 'crazygames') return false;
  const d = doc();
  if (!d) return false;
  const nav = win()?.navigator;
  if (nav && (/iPhone|iPod|FBAN|FBAV|Messenger|Instagram/i.test(nav.userAgent))) return false;
  const el = d.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
};

function notify() {
  const w = win();
  if (w && w.__refit) w.__refit();
  const s = Display.label();
  for (const fn of watchers) { try { fn(s); } catch (e) { watchers.delete(fn); } }
}

Display.watch = function (fn, owner) {
  if(typeof fn!=='function')return ()=>{};
  watchers.add(fn);
  const dispose=()=>{watchers.delete(fn);owner?.off?.('destroy',dispose);};
  owner?.once?.('destroy',dispose);
  return dispose;
};
Display.subscriptionCount = function () { return watchers.size; };

Display.enter = function () {
  const d = doc();
  const w = win();
  if (!d || !Display.supported()) return Promise.resolve();
  const root = d.getElementById('game') || d.documentElement;
  const g = w && w.__game;
  if (g && g.scale) {
    try { g.scale.fullscreenTarget = root; } catch (e) {}
  }
  const req = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  let p = null;
  if (req) {
    try { p = req.call(root); } catch (e) { p = null; }
  } else if (g && g.scale && g.scale.startFullscreen) {
    try { g.scale.startFullscreen(); } catch (e) {}
  }
  if (p && typeof p.then === 'function') return p.then(notify).catch(notify);
  notify();
  return Promise.resolve();
};

Display.exit = function () {
  const d = doc();
  const w = win();
  if (!d) return Promise.resolve();
  const exit = d.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen;
  const g = w && w.__game;
  let p = null;
  if (exit && (d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement)) {
    try { p = exit.call(d); } catch (e) { p = null; }
  } else if (g && g.scale && g.scale.stopFullscreen) {
    try { g.scale.stopFullscreen(); } catch (e) {}
  }
  if (p && typeof p.then === 'function') return p.then(notify).catch(notify);
  notify();
  return Promise.resolve();
};

Display.toggle = function () { return Display.active() ? Display.exit() : Display.enter(); };

Display.button = function (scene, x, y) {
  if (ADV.Release?.target === 'crazygames') return null;
  const t = ADV.T.text(scene, x, y, Display.label(), { size: 13, ox: 1, color: ADV.T.css.gold, bold: true })
    .setInteractive({ useHandCursor: true });
  t.on('pointerdown', () => { Display.toggle(); });
  Display.watch((s) => { if (t.active) t.setText(s); }, t);
  return t;
};

const d = doc();
if (d) {
  d.addEventListener('fullscreenchange', notify);
  d.addEventListener('webkitfullscreenchange', notify);
  d.addEventListener('MSFullscreenChange', notify);
}

ADV.Display = Display;
})();
