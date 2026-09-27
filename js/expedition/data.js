// Adventurer: Expeditions — every rule this edition changes lives here.
// Nothing under js/data or js/core is edited for the CrazyGames demo; the
// shim (expedition/shim.js) reads this table when a Hiro built by
// Expedition.hero() is in combat. Numbers are starting tunes (GDD v0.5 §6.6).
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const X = ADV.Expedition = ADV.Expedition || {};

X.VERSION = 'arcade_v1';
X.saveKey = 'adventurer_expeditions_arcade_v1';

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
  // Arcade (Hiro, 2026-09-27): every skill is owned from the first second and
  // has one set of numbers, taken from what used to be the middle level. Level
  // 1 is the only level; nothing is bought or raised.
  katana_slash: {
    base: { autoKillPct: 0, noReflect: true, reach: 'any' },
    1: { power: 1.3, target: 'enemy',      status: { bleed: { power: 0.3, rounds: 3, stacks: true } } },
  },
  // `cooldown: 0` on purpose. Skills fire between turns (Hiro, 2026-09-22), and
  // a recovery counted in turns cannot be read by a player casting off-turn.
  // The engine records a cooldown only when the manifest carries a truthy one,
  // so zero here hands recovery to X.skillCooldownMs, on a clock.
  //
  // God Aura raises attack, not defense (Hiro, 2026-09-24: "counter attack
  // already handles defense enough"). auraDef stays 1 because the damage code
  // divides by it; a missing value would be NaN, not "no change".
  god_aura: {
    base: { target: 'party', power: 0 },
    1: { auraAtk: 1.35, auraDef: 1, auraEvade: 0, rounds: 3, cooldown: 0 },
  },
  counter_attack: {
    base: { target: 'self', power: 0, counterRiposte: 'expedition_riposte' },
    1: { counterNext: 2, counterRounds: 2, cooldown: 0 },
  },
  finisher: {
    // One rule the player can hold in their head (Hiro, round 3): a normal enemy
    // is finished at half health or less, a boss at a quarter. The shared engine
    // refuses to execute a boss at all, so the boss case is resolved in Enc.step
    // (X.finisherThresholds), never by editing js/core.
    //
    // No cooldown (Hiro, 2026-09-21): "it's already limited by having specific
    // conditions it can be used under anyway." The health window *is* the cost.
    // The engine reads a falsy cooldown as none at all (combat.js).
    base: { target: 'enemy', permStatGain: 0, questGain: false },
    // Core targeting is a strict `<`, so 0.51 is how "at or under half" is
    // actually offered. A wolf sitting on exactly 50% used to grey Finisher out
    // and the tutorial never paused.
    1: { requireBelowPct: 0.51, executeBelow: 0.51, healOnKillPct: 0.35, cooldown: 0, power: 2.8 },
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
  dire_wolf:    { base: 'dire_wolf', level: 1, kind: 'wolf', frame: 0, height: 185 },
  // The road's third fight uses a distinct painted Alpha boss. Keep its road
  // variant stats, but let the boss kind drive heavy choreography and its own
  // atlas instead of reusing the ordinary wolf.
  road_wolf_leader: { base: 'dire_wolf', level: 4, kind: 'boss', artActor: 'alpha', height: 330, name: 'Alpha', boss: true,
    artIdentity: 'tutorial-alpha', statMult: { hp: 1.9, atk: 0.8 }, phase2At: 0.5 },
  cave_boar:    { base: 'cave_boar', level: 2, kind: 'boar', frame: 1, height: 250, actives: ['tusk_gore'] },          // charge: Bleed + pull
  thorn_lurker: { base: 'thorn_lurker', level: 2, kind: 'plant', frame: 2, height: 245, actives: ['thorn_lash'],       // lash: Poison + root
                  perks: [] },                                                                                       // no regenerate/thorn skin: brisk, no healer stall
  alpha:        { base: 'alpha', level: 4, kind: 'boss', frame: 0, height: 330, tint: 0xb9b3c4, actives: ['pack_snap', 'cleave'], perks: ['momentum'],
                  statMult: { atk: 0.8, hp: 1.9 }, phase2At: 0.5 },
};

X.encounters = [
  // 150 in all: three guided unlocks (3 × 20) leave 90 — the first recruit (60) and change.
  { id: 'road_ambush', bg: 'deep_wood',   enemies: ['dire_wolf', 'dire_wolf'] },
  { id: 'thicket',     bg: 'bandit_road', enemies: ['dire_wolf', 'thorn_lurker', 'thorn_lurker'] },
  { id: 'clearing',    bg: 'mountain',    enemies: ['road_wolf_leader'], boss: true },
];

// Arcade scoring (Hiro, 2026-09-27): score replaces gold. Nothing is bought;
// every skill is owned from the start (X.purchasable is empty so every path
// that asks "is it owned" says yes). Points come from one fixed table so two
// players who clear the same fights earn the same score. `loopBonus` is the
// multiplier step per completed playthrough: loop 2 pays 1.25x, loop 3 1.5x.
X.purchasable = [];
// The three tappable skills, in HUD order. Katana Slash is automatic and never shown as a button.
X.tappable = ['finisher', 'god_aura', 'counter_attack'];
// The first quest teaches one per fight, in this order (Hiro, 2026-09-27).
X.tutorialLessons = ['finisher', 'counter_attack', 'god_aura'];
X.scoring = {
  regular: 100,          // any regular monster defeated, however it dies
  boss: 500,             // per boss, so a triple-boss wave pays three times
  finisherKill: 50,      // on top of the kill: the move the game is about
  cleanWave: 50,         // wave cleared with Hiro above cleanWaveHp
  cleanWaveHp: 0.75,
  questClear: 300,       // paid when the quest's boss falls
  loopBonus: 0.25,
};
X.loopBonus = loop => 1 + X.scoring.loopBonus * Math.max(0, (loop || 1) - 1);
// Rest at the inn (Hiro, 2026-09-27): a full heal for points, the price
// doubling with every use in the run, never at full health.
X.rest = { cost: 1000, growth: 2 };
// The high-score board (Hiro, 2026-09-27): ten rows, on this device, under its
// own key. A name is required and must read like a name — no spaces, starts
// with a letter, at least three letters and a vowel, no more than three
// consonants in a row, no letter three times in a row; letters, digits and a
// few symbols. tyler#2, tyler12 and tylertheman! pass; 12345, @#$skfsal,
// adfskdlsfosl and uislllslsl@#@11221 do not. A spelling check, not a
// dictionary: loosen `maxConsonants` if play shows real names refused.
X.board = { size: 10, key: 'adventurer_expeditions_highscores_v1' };
X.nameRules = { max: 25, symbols: '#!_-.@$', minLetters: 3, maxConsonants: 3, maxRepeat: 3 };
X.validName = function (raw) {
  const R = X.nameRules, name = String(raw == null ? '' : raw);
  if (!name.length) return { ok: false, reason: 'empty', text: 'Type a name' };
  if (name.length > R.max) return { ok: false, reason: 'long', text: 'At most ' + R.max + ' characters' };
  if (/\s/.test(name)) return { ok: false, reason: 'space', text: 'No spaces' };
  const allowed = new RegExp('^[A-Za-z0-9' + R.symbols.replace(/[-\]\\^]/g, '\\$&') + ']+$');
  if (!allowed.test(name)) return { ok: false, reason: 'chars', text: 'Letters, digits and ' + R.symbols.split('').join(' ') + ' only' };
  if (!/^[A-Za-z]/.test(name)) return { ok: false, reason: 'start', text: 'Start with a letter' };
  const letters = name.replace(/[^A-Za-z]/g, '');
  if (letters.length < R.minLetters) return { ok: false, reason: 'letters', text: 'At least ' + R.minLetters + ' letters' };
  if (!/[AEIOUYaeiouy]/.test(letters)) return { ok: false, reason: 'vowel', text: 'Needs a vowel' };
  if (new RegExp('[^AEIOUYaeiouy]{' + (R.maxConsonants + 1) + ',}').test(letters)) return { ok: false, reason: 'consonants', text: 'That does not read like a name' };
  if (new RegExp('([A-Za-z])\\1{' + (R.maxRepeat - 1) + ',}', 'i').test(name)) return { ok: false, reason: 'repeat', text: 'That does not read like a name' };
  return { ok: true, name };
};
X.restCost = run => Math.round(X.rest.cost * Math.pow(X.rest.growth, (run && run.rests) || 0));

// Once Finisher first becomes usable the automatic policy leaves it alone for
// this many of Hiro's turns so a beginner can tap it themselves.
X.finisherHoldOffTurns = 1;

// Finisher windows (GDD §7). `normal` is also what the skill's own override
// carries; `boss` is applied by the Expedition layer because the shared engine
// exempts bosses from execution outright.
X.finisherThresholds = { normal: 0.50, boss: 0.25 };

// The first five minutes, locked (Hiro, 2026-09-20): recruiting stays shut.
// `openQuests` is the whitelist Embark walks after the tutorial — rain, then
// city — so the inn hands out the next finished location instead of replaying
// the road. Flip `firstLevelOnly` to false when hiring reopens.
// The night pair stays shut on budget, not on art: marsh/ruins share `night1`
// and four plates the 20 MB package has not got.
// The run starts at Road in the Rain and goes marsh, city, ruins (Hiro,
// 2026-09-21: "we are never gonna use the clear the road ... we already start
// off at the road in the rain"). `openQuests` is the order, and `startQuest` is
// where a brand-new run begins. "Clear the road" is kept in the data as the
// dev panel's preview and as the history of the tutorial, but nothing routes
// to it any more.
X.slice = { firstLevelOnly: true, startQuest: 'rain', openQuests: ['rain', 'marsh', 'city'] };

// What the package carries. A missing atlas does not degrade — Phaser parks the
// scene in preload until a queued file arrives, so an absent one is a black
// screen, not a fallback. Nothing may be requested unless it is listed here, and
// test/ship_budget_contract.js asserts this matches tools/ship_manifest.json.
// Bram is deliberately absent: he cannot be hired while the slice is locked, so
// his 2.42 MB bought nothing. Re-add him here and in the manifest together.
// Every creature an open quest can field must be listed here AND in
// tools/ship_manifest.json. Leaving the boar out while Road in the Rain still
// fought boars is what froze the game on 2026-09-21 — the enemies arrived with a
// health bar and no body, and the fight could not resolve. The quests now field
// wolf, plant and the Alpha only, so the boar is out of both lists; putting it
// back means adding it here, in the manifest, and to a quest, together.
X.monsterActors = ['serpent', 'beetle', 'moss_giant', 'hag', 'goblin', 'spider', 'orc'];
X.shipped = { actors: ['hiro', 'wolf', 'plant', 'alpha', ...X.monsterActors] };

// Skills are the player's to fire (Hiro, 2026-09-20): Hiro auto-uses only
// Katana Slash; God Aura, Counter Attack and Finisher wait for a tap. The
// headless sim stands in for the player with Enc.tapPolicy.
X.manualSkills = true;

// Cinematic beats: a tapped skill and every killing blow slow the world and
// push the main camera in; the HUD sits on its own camera and stays put.
// Slower, not laggy (Hiro, round 3): cast 0.50 → 0.70, kill 0.36 → 0.55, and the
// push-in snaps (240/220 ms → 150/140) instead of drifting.
// Full speed, for looking at the game with no showmanship in the way (Hiro,
// 2026-09-21: "temporarily disable the cinematic cam and the slow down on
// finishing moves and skill use"). With `cinematics` false the camera never
// pushes in and nothing ever slows: UI.cinematic runs its body straight through
// and the impact hit-stop is skipped. Nothing else changes — the same hits land
// in the same order, just at one speed. The dev panel toggles it; it is on for
// players, and no player can reach the switch.
// Off for now (Hiro, 2026-09-21: "for now I would like this setting to be off so
// I can see the game at full speed with no slow downs"). It is a player-facing
// setting on the pause screen as well as a dev-panel toggle, so turning the
// showmanship back on for release is a one-word change here.
// Which painted set an actor is drawn from — 'wolf', 'plant', 'alpha', 'hiro'.
// This is the honest identity for animation: the paired finishing moves draw the
// creature, so what matters is which painting it comes out of, not which entity
// in the data named it (Hiro, 2026-09-22: "why is finisher and animations hard
// tied to a specific entity, instead of a class type ... that way it doesn't
// matter how many of them you have"). A new wolf variant now needs no wiring.
X.paintedActorOf = function (target) {
  const key = target && target.img && target.img.texture && target.img.texture.key;
  const m = /^xp_([a-z0-9_]+)_sheet$/.exec(key || '');
  return m ? m[1] : null;
};
// The painted set an enemy definition resolves to, for the same comparison.
X.paintedActorOfKey = function (key) {
  const d = (X.enemies && X.enemies[key]) || null;
  if (!d) return key || null;
  return d.artActor || (d.kind === 'boss' ? 'alpha' : d.kind) || null;
};

// A beat of air between turns, so a tap has somewhere to land (Hiro,
// 2026-09-22: "turns are going by too quickly ... lets go with 2s"). A player
// setting on the pause screen; `normal` is the two seconds he asked for.
X.pacing = { mode: 'normal', ms: { slow: 2000, normal: 1000, fast: 500 } };

// Recovery on a clock, in milliseconds, by level (Hiro, 2026-09-22: "yes move
// them to seconds"). These mirror the turn counts they replace — God Aura was
// 5/5/4 turns, Counter Attack 2/2/1 — read as roughly ten and five seconds.
// Finisher is absent on purpose: its only gate is the health window.
X.skillCooldownMs = {
  god_aura:       { 1: 10000 },
  counter_attack: { 1: 5000 },
};
X.cooldownMsFor = function (skillId, level) {
  const t = X.skillCooldownMs[skillId];
  return t ? (t[1] || 0) : 0;
};
// One clock, so the simulation can hold time still while it checks the rules.
X.now = () => Date.now();
X.turnPauseMs = () => (X.pacing.ms[X.pacing.mode] != null ? X.pacing.ms[X.pacing.mode] : 2000);

X.fx = { cinematics: false };

X.cinematic = { cast: { scale: 0.70, zoom: 1.16, ms: 150 }, kill: { scale: 0.55, zoom: 1.26, ms: 140 } };

// HUD icon radius (was 18): easier to tap on a phone.
X.hudIconR = 26;

// Skill text for the info box (hold an icon for X.infoHoldMs), written for a
// fourth-grade reader: what it does, in one or two short sentences.
X.infoHoldMs = 3000;
X.infoLingerMs = 3000;
X.skillText = {
  katana_slash:   { name: 'Katana Slash',  text: 'Hiro swings his sword at one enemy. He does this on his own.' },
  god_aura:       { name: 'God Aura',      text: 'A glowing aura. Hiro hits harder for a while.' },
  counter_attack: { name: 'Counter Attack', text: 'Hiro gets ready. When an enemy attacks him, he blocks it and strikes back.' },
  finisher:       { name: 'Finisher',      text: 'A big final strike. If a normal enemy is at half health or less, it is knocked out. Bosses have to be at a quarter. Hiro heals a little.' },
};

// Painted sheets (GDD v0.8 §10.3). art.hiroSheet turns Astra's Hiro atlas on;
// ?sheet=0 keeps the plate placeholder for an A/B screenshot.
X.art = { hiroSheet: true, hiroAtlas: 'assets/expedition/hiro/hiro' };

// Director vocabulary → painted clip id. Levelled clips pick the level given
// (l1 when the sheet lacks that level); anything unmapped keeps its own name.
X.clipFor = function (clip, opts) {
  const lvl = Math.max(1, Math.min(3, (opts && opts.level) || 1));
  if (clip === 'finisher') {
    // Each approved paired timeline contains a specific creature. Actor.canPair
    // additionally checks identity, tint and the resolved lethal outcome.
    const targetIdentity = opts && opts.target && opts.target.unit && opts.target.unit.ch && opts.target.unit.ch.expeditionArtIdentity;
    // By painted set: anything drawn from the Alpha sheet gets the Alpha pairs,
    // anything from the wolf sheet the wolf pairs, and so on — however many
    // variants of each a quest fields.
    const finishers = {
      alpha: ['hiro-alpha-cleave-paired', 'hiro-alpha-pin-paired', 'hiro-alpha-parry-paired'],
      wolf: ['wolf-cleave-paired', 'wolf-pin-paired', 'wolf-rising-cut-paired'],
      plant: ['plant-stem-cut-paired', 'plant-vine-pin-paired', 'plant-crosscut-paired'],
    };
    const tgt = opts && opts.target;
    const family = finishers[X.paintedActorOf(tgt) || (tgt && tgt.kind)];
    return family ? family[lvl - 1] : 'slash-l' + lvl;
  }
  const M = { enter: 'walk', walk: 'walk', short_draw: 'short-draw', hit_short: 'hit-short', stagger: 'hit-short', victory: 'victory-sheath',
    slash: 'slash-l' + lvl, slash_wide: 'slash-l3', aura: 'aura-l' + lvl, stance: 'counter-l' + Math.max(2, lvl) };
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
