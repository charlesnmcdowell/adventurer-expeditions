// Adventurer: Expeditions — every rule this edition changes lives here.
// Nothing under js/data or js/core is edited for the CrazyGames demo; the
// shim (expedition/shim.js) reads this table when a Hiro built by
// Expedition.hero() is in combat. Numbers are starting tunes (GDD v0.5 §6.6).
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const X = ADV.Expedition = ADV.Expedition || {};

X.VERSION = 'loop_v1';
X.saveKey = 'adventurer_expeditions_loop_v1';

// Hiro: same identity, a mortal body. Demigod (status immunity, extra turns,
// uncapped overheal) and Rich (gold multiplier) are left out of the demo kit.
X.hero = {
  registryId: 'hiro',
  statMult: { hp: 2.2, atk: 1.4, def: 1.3, spd: 1.2 },
  perks: ['lone_wolf'],
  // Order the automatic policy rotates through when the player does nothing.
  autoOrder: ['katana_slash', 'god_aura', 'counter_attack', 'finisher'],
};

// Per-skill, per-level manifests. `base` overrides shipped base fields for every
// level; numbered entries override per level. Level 1 is what the demo starts at.
X.skills = {
  katana_slash: {
    base: { autoKillPct: 0, noReflect: true, reach: 'any' },
    1: { power: 1.6, target: 'enemy',      status: { bleed: { power: 0.4, rounds: 3, stacks: true } } },
    2: { power: 1.9, target: 'enemy',      status: { bleed: { power: 0.5, rounds: 3, stacks: true } } },
    3: { power: 2.1, target: 'allEnemies', status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
  },
  god_aura: {
    base: { target: 'party', power: 0 },
    1: { auraAtk: 1.2, auraDef: 1.2, auraEvade: 0.10, rounds: 2, cooldown: 5 },
    2: { auraAtk: 1.3, auraDef: 1.3, auraEvade: 0.15, rounds: 3, cooldown: 5 },
    3: { auraAtk: 1.4, auraDef: 1.4, auraEvade: 0.20, rounds: 3, cooldown: 4 },
  },
  counter_attack: {
    base: { target: 'self', power: 0, counterRiposte: 'expedition_riposte' },
    1: { counterNext: 1, counterRounds: 2, cooldown: 2 },
    2: { counterNext: 2, counterRounds: 2, cooldown: 2 },
    3: { counterNext: 3, counterRounds: 2, cooldown: 1 },
  },
  finisher: {
    // Executes ordinary enemies under the threshold; a boss cannot be executed, so
    // `power` is what it does to the Alpha (a heavy, bounded hit). Both need the target under the threshold.
    base: { target: 'enemy', permStatGain: 0, questGain: false },
    1: { requireBelowPct: 0.40, executeBelow: 0.40, healOnKillPct: 0.25, cooldown: 3, power: 2.4 },
    2: { requireBelowPct: 0.50, executeBelow: 0.50, healOnKillPct: 0.35, cooldown: 3, power: 2.8 },
    3: { requireBelowPct: 0.60, executeBelow: 0.60, healOnKillPct: 0.50, cooldown: 2, power: 3.2 },
  },
};

// The riposte Counter Attack answers with: a single katana cut whose power
// scales with Counter's own level, so upgrading Katana Slash does not silently
// upgrade every riposte (GDD §4.2).
X.riposte = {
  id: 'expedition_riposte', name: 'Riposte', kind: 'active', unique: true, katana: true, noTierGrowth: true,
  power: 1.4, reach: 'any', target: 'enemy', melee: true, noReflect: true,
  desc: 'The answer to a turned-aside attack.',
  tiers: { basic: { name: 'Riposte' }, intermediate: { name: 'Riposte', power: 1.7 }, advanced: { name: 'Riposte', power: 2.0 } },
};

X.enemies = {
  // kind drives the placeholder choreography (leap / charge / lash / pounce) and the art frame.
  dire_wolf:    { base: 'dire_wolf', level: 1, kind: 'wolf', frame: 0, height: 250 },
  cave_boar:    { base: 'cave_boar', level: 2, kind: 'boar', frame: 1, height: 250, actives: ['tusk_gore'] },          // charge: Bleed + pull
  thorn_lurker: { base: 'thorn_lurker', level: 2, kind: 'plant', frame: 2, height: 260, actives: ['thorn_lash'],       // lash: Poison + root
                  perks: [] },                                                                                       // no regenerate/thorn skin: brisk, no healer stall
  alpha:        { base: 'alpha', level: 4, kind: 'boss', frame: 0, height: 330, tint: 0xb9b3c4, actives: ['pack_snap', 'cleave'], perks: ['momentum'],
                  statMult: { atk: 0.8, hp: 1.25 }, phase2At: 0.5 },
};

X.encounters = [
  // 150 in all: three guided unlocks (3 × 20) leave 90 — the first recruit (60) and change.
  { id: 'road_ambush', bg: 'deep_wood',   enemies: ['dire_wolf', 'dire_wolf'],                 gold: 40 },
  { id: 'thicket',     bg: 'bandit_road', enemies: ['dire_wolf', 'cave_boar', 'thorn_lurker'], gold: 50 },
  { id: 'clearing',    bg: 'mountain',    enemies: ['alpha'], boss: true,                       gold: 60 },
];

// Katana Slash is what Hiro does by default: always owned, never shown, never
// bought. The other three start locked (level 0) and are unlocked, then raised,
// with gold. costs[n] is the price of reaching level n.
X.purchasable = ['finisher', 'god_aura', 'counter_attack'];
X.economy = { start: 0, costs: { 1: 20, 2: 30, 3: 40 }, maxLevel: 3 };

// Once Finisher first becomes usable the automatic policy leaves it alone for
// this many of Hiro's turns so a beginner can tap it themselves.
X.finisherHoldOffTurns = 1;

// Painted sheets (GDD v0.8 §10.3). art.hiroSheet turns Astra's Hiro atlas on;
// ?sheet=0 keeps the plate placeholder for an A/B screenshot.
X.art = { hiroSheet: true, hiroAtlas: 'assets/expedition/hiro/hiro' };

// Director vocabulary → painted clip id. Levelled clips pick the level given
// (l1 when the sheet lacks that level); anything unmapped keeps its own name.
X.clipFor = function (clip, opts) {
  const lvl = Math.max(1, Math.min(3, (opts && opts.level) || 1));
  const M = { enter: 'walk', walk: 'walk', short_draw: 'short-draw', hit_short: 'hit-short', stagger: 'hit-short', victory: 'victory-sheath',
    slash: 'slash-l' + lvl, slash_wide: 'slash-l3', aura: 'aura-l' + lvl, stance: 'counter-l' + Math.max(2, lvl), finisher: 'finisher-l' + lvl + '-paired' };
  return M[clip] || clip;
};

// Per-clip impact parameters (GDD §10.1): hit-stop, flash, shake, drift. Seeded
// from Astra's impactDraft in heroes/hiro/manifest.json; none greenlit yet, so
// these are provisional and tuned here, never in the manifest.
X.impact = {
  'slash-l1':  { hitStopMs: 60,  flash: { alpha: 0.10, color: '#ffffff' }, shakeAmplitude: 0.0015, drift: { distancePx: 12, ease: 'Quad.Out' }, greenlit: false },
  'slash-l2':  { hitStopMs: 70,  flash: { alpha: 0.13, color: '#ffffff' }, shakeAmplitude: 0.0020, drift: { distancePx: 18, ease: 'Quad.Out' }, greenlit: false },
  'slash-l3':  { hitStopMs: 85,  flash: { alpha: 0.16, color: '#ffffff' }, shakeAmplitude: 0.0025, drift: { distancePx: 24, ease: 'Quad.Out' }, greenlit: false },
  'intercept': { hitStopMs: 45,  flash: { alpha: 0.08, color: '#ffffff' }, shakeAmplitude: 0.0010, drift: { distancePx: 4,  ease: 'Quad.Out' }, greenlit: false },
  'riposte':   { hitStopMs: 65,  flash: { alpha: 0.12, color: '#ffffff' }, shakeAmplitude: 0.0018, drift: { distancePx: 14, ease: 'Quad.Out' }, greenlit: false },
  'hit-short': { hitStopMs: 55,  flash: { alpha: 0.06, color: '#ffffff' }, shakeAmplitude: 0.0012, drift: { distancePx: -8, ease: 'Quad.Out' }, greenlit: false },
  'counter-l2': { hitStopMs: 65, flash: { alpha: 0.12, color: '#ffffff' }, shakeAmplitude: 0.0018, drift: { distancePx: 14, ease: 'Quad.Out' }, greenlit: false },
  'counter-l3': { hitStopMs: 80, flash: { alpha: 0.14, color: '#ffffff' }, shakeAmplitude: 0.0024, drift: { distancePx: 20, ease: 'Quad.Out' }, greenlit: false },
  'finisher-l1-paired': { hitStopMs: 140, flash: { alpha: 0.16, color: '#ffffff' }, shakeAmplitude: 0.003, drift: { distancePx: 0, ease: 'Quad.Out' }, greenlit: false },
  'finisher-l2-paired': { hitStopMs: 140, flash: { alpha: 0.16, color: '#ffffff' }, shakeAmplitude: 0.003, drift: { distancePx: 0, ease: 'Quad.Out' }, greenlit: false },
  'finisher-l3-paired': { hitStopMs: 140, flash: { alpha: 0.16, color: '#ffffff' }, shakeAmplitude: 0.003, drift: { distancePx: 0, ease: 'Quad.Out' }, greenlit: false },
  'bite-leg-paired': { hitStopMs: 60, flash: { alpha: 0.05, color: '#ffffff' }, shakeAmplitude: 0.001, drift: { distancePx: 0, ease: 'Quad.Out' }, greenlit: false },
  'bite-arm-paired': { hitStopMs: 60, flash: { alpha: 0.05, color: '#ffffff' }, shakeAmplitude: 0.001, drift: { distancePx: 0, ease: 'Quad.Out' }, greenlit: false },
};

// Presentation budgets in ms (GDD §6.3). Tuned against measured rounds.
X.timing = {
  action: 650, reaction: 1100, emphasis: 1600,
  draw: 1000, victory: 1300, walk: 2200, hitStop: 70,
};
})();
