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
    if (!r || r.version !== X.VERSION || !r.levels || typeof r.levels !== 'object' || Array.isArray(r.levels) || !r.phase) return null;
    // Arcade: every skill is owned at its one level, whatever the save says.
    for (const id of Object.keys(X.skills)) r.levels[id] = 1;
    r.awarded = r.awarded || []; r.tutorial = r.tutorial || {}; r.voice = r.voice || {};
    if (X.Campaign) X.Campaign.sanitizeRun(r);
    return r;
  } catch (e) { return null; }
};

Run.save = function (run) {
  try {
    if (X.Campaign) X.Campaign.sanitizeRun(run);
    storage().setItem(X.saveKey, JSON.stringify(run)); return { ok: true };
  }
  catch (e) { return { ok: false, error: e && e.message }; }
};

Run.reset = function () { try { storage().removeItem(X.saveKey); } catch (e) {} return Run.fresh(); };

// Start over is a true restart (Hiro, 2026-09-21): a new run *and* a new first
// five minutes. Nothing is carried across — the old run's tutorial flags used to
// be copied in, which is why the hand never came back after a restart.
Run.startOver = function () {
  const r = Run.reset();
  Run.save(r);
  return r;
};
})();
