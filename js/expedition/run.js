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

// ---------------------------------------------------------------- high scores
// Ten rows on this device, newest-below on a tie. Same storage rules as the
// run: one JSON string under its own key, memory when storage is refused.
const Board = X.Board = {};
Board.load = function () {
  try {
    const raw = storage().getItem(X.board.key);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows.filter(r => r && typeof r.name === 'string' && Number.isFinite(r.score)).slice(0, X.board.size) : [];
  } catch (e) { return []; }
};
Board.save = function (rows) { try { storage().setItem(X.board.key, JSON.stringify(rows.slice(0, X.board.size))); return true; } catch (e) { return false; } };
Board.clear = function () { try { storage().removeItem(X.board.key); } catch (e) {} };
// Where a score would land, or -1 when it misses the board.
Board.placeOf = function (score, rows) {
  rows = rows || Board.load();
  let i = 0;
  while (i < rows.length && rows[i].score >= score) i++;                    // a tie sits below the older run
  return i < X.board.size ? i : -1;
};
Board.qualifies = score => Board.placeOf(score) >= 0;
Board.insert = function (entry) {
  const rows = Board.load();
  const i = Board.placeOf(entry.score, rows);
  if (i < 0) return { ok: false, rows };
  rows.splice(i, 0, { name: entry.name, score: Math.max(0, Math.floor(entry.score)), loop: entry.loop || 1, date: entry.date || new Date().toISOString().slice(0, 10) });
  const kept = rows.slice(0, X.board.size);
  Board.save(kept);
  return { ok: true, place: i, rows: kept };
};

// Start over is a true restart (Hiro, 2026-09-21): a new run *and* a new first
// five minutes. Nothing is carried across — the old run's tutorial flags used to
// be copied in, which is why the hand never came back after a restart.
Run.startOver = function () {
  const r = Run.reset();
  Run.save(r);
  return r;
};
})();
