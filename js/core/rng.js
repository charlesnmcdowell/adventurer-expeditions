// Deterministic seeded RNG (mulberry32) + helpers. Everything in the sim rolls
// through a named stream so world generation is reproducible per save seed.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

class RNG {
  constructor(seed) { this.seed = seed >>> 0; this.state = this.seed; }
  next() {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  snapshot() { return { algorithm: 'mulberry32', seed: this.seed, state: this.state }; }
  static restore(saved, fallbackSeed) {
    const rng = new RNG(fallbackSeed);
    if (saved && saved.algorithm === 'mulberry32' && Number.isInteger(saved.seed) && Number.isInteger(saved.state)) {
      rng.seed = saved.seed >>> 0; rng.state = saved.state >>> 0;
    }
    return rng;
  }
  float() { return this.next(); }
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); } // inclusive
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  fork(label) { return new RNG(hashStr(label + ':' + Math.floor(this.next() * 1e9))); }
}

ADV.RNG = RNG;
ADV.rngFromString = s => new RNG(hashStr(s));
ADV.hashStr = hashStr;
})();
