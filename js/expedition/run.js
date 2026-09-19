// Adventurer: Expeditions — run state persistence under its own key.
// One JSON string, written whole (the website's atomic single-string pattern),
// never touching adv:* keys. Missing/denied storage degrades to memory.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const Run = X.Run = {};
let memory = null;

function storage() {
  try { if (typeof localStorage !== 'undefined') { localStorage.getItem(X.saveKey); return localStorage; } } catch (e) {}
  return memory || (memory = { _m: {}, getItem(k) { return this._m[k] == null ? null : this._m[k]; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } });
}

Run.fresh = function () { const r = (X.Campaign ? X.Campaign.freshRun() : X.Encounter.freshRun()); r.version = X.VERSION; r.checkpoint = 0; return r; };

Run.load = function () {
  try {
    const raw = storage().getItem(X.saveKey);
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (!r || r.version !== X.VERSION || !r.levels || !r.phase) return null;
    for (const id of Object.keys(X.skills)) if (!r.levels[id]) r.levels[id] = 1;
    r.awarded = r.awarded || []; r.tutorial = r.tutorial || {}; r.voice = r.voice || {};
    return r;
  } catch (e) { return null; }
};

Run.save = function (run) {
  try { storage().setItem(X.saveKey, JSON.stringify(run)); return { ok: true }; }
  catch (e) { return { ok: false, error: e && e.message }; }
};

Run.reset = function () { try { storage().removeItem(X.saveKey); } catch (e) {} return Run.fresh(); };

// A deliberate restart: a new run, but the guidance the player has already seen
// stays retired. Clearing the browser's storage is the only thing that brings it back.
Run.startOver = function (prev) {
  const r = Run.reset();
  if (prev && prev.tutorial) r.tutorial = Object.assign({}, prev.tutorial);
  Run.save(r);
  return r;
};
})();
