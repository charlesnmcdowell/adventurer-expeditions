// Adventurer: Expeditions — the three premade heroes the player picks from at
// the inn after the road contract, and the two shops: the trainer (learn a
// third active, up to two more perks, tutor a known skill to the next tier)
// and the blacksmith (one gear set per hero). Everything is the shipped
// SkillSys / GEAR_SETS behaviour at demo prices; the picked hero is an
// ordinary Character.makePlayer, so combat, portraits and tiers need no shim.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const Heroes = X.Heroes = {};
const C = () => A.DATA.CONST;

// Each hero keeps to one class or a pair (the demo's "stick to a theme" rule).
// `head` picks a frame on the synced style sheet; `startSet` is only a look
// (the travelling clothes drawn until a set is bought — it is never equipped,
// so it floors nothing); the blacksmith's `set` is the real, visible upgrade
// (a gear set floors matching skills to Intermediate and changes the portrait).
X.heroes = [
  { key: 'bram',  name: 'Bram',  sex: 'm', head: 5, seed: 9101, classes: ['tank', 'fighter'], title: 'Shieldbearer',
    blurb: 'Takes the hits. Gives them back.',
    actives: ['shield_wall', 'cleave'], perks: ['bulwark'],
    trainer: { actives: ['taunt', 'sunder', 'stand_fast'], perks: ['momentum', 'arena_champion'] },
    startSet: 'duelist', set: 'plate', stats: { hp: 1.6, atk: 1.1, def: 1.4, spd: 0.9 } },
  { key: 'nyx',   name: 'Nyx',   sex: 'f', head: 6, seed: 9202, classes: ['rogue', 'ranger'], title: 'Poacher',
    blurb: 'Poison up close, arrows from far.',
    actives: ['venom_fang', 'aimed_shot'], perks: ['opportunist'],
    trainer: { actives: ['snare', 'smoke_bomb'], perks: ['marksman', 'sniper', 'septic_sanguine'] },
    startSet: 'wildhide', set: 'hunter', stats: { hp: 1.25, atk: 1.4, def: 1.0, spd: 1.4 } },
  { key: 'sable', name: 'Sable', sex: 'm', head: 8, seed: 9303, classes: ['mage'], title: 'Hedge Mage',
    blurb: 'Fire and lightning. Keep him back.',
    actives: ['fire_bolt', 'spark'], perks: ['arcane_focus'],
    trainer: { actives: ['frost_touch', 'ember_lash'], perks: ['pyromaniac', 'lightning_king'] },
    startSet: 'leathers', set: 'adept', stats: { hp: 1.0, atk: 1.5, def: 0.8, spd: 1.2 } },
];
Heroes.def = key => X.heroes.find(h => h.key === key) || null;

// Demo prices (the website's 150 / 300 / 600 / 400 would take hours of quests).
X.shop = { learn: 30, tutor: { intermediate: 40, advanced: 60 }, set: 90, activeSlots: 3, perkSlots: 3 };

// ---------------------------------------------------------------- run state
// run.hero is the whole persistent hero: a snapshot of the slots + the set.
Heroes.fresh = function (key) {
  const d = Heroes.def(key);
  return { key, actives: d.actives.map(skillId => ({ skillId, level: 1, uses: 0 })), perks: d.perks.map(skillId => ({ skillId, level: 1, uses: 0 })),
           equippedSet: null, purchases: 0 };
};
Heroes.snapshot = function (ch) {
  const ent = e => ({ skillId: e.skillId, level: e.level, uses: e.uses || 0 });
  return Object.assign(ch.expeditionHeroState || {}, { key: ch.expeditionHero, actives: ch.actives.filter(a => !a.hidden).map(ent), perks: ch.perks.map(ent), equippedSet: ch.equippedSet });
};

// Build the live Character from the run. Deterministic (fixed seed per hero).
Heroes.make = function (run) {
  const hs = run.hero, d = Heroes.def(hs.key);
  const ch = A.Character.makePlayer(new A.RNG(d.seed), { name: d.name, sex: d.sex, portraitSeed: d.seed, portraitSlot: 1, appearance: { head: d.head }, startingSkills: [] });
  ch.freeSkillsUsed = C().FREE_STARTING_SKILLS;
  ch.activeCap = X.shop.activeSlots; ch.perkCap = X.shop.perkSlots;
  ch.archetypeInclination = [d.classes[0]];
  for (const k of Object.keys(d.stats)) ch.stats[k] = Math.round(ch.stats[k] * d.stats[k]);
  ch.actives = hs.actives.map(e => ({ skillId: e.skillId, level: e.level, uses: e.uses || 0 }));
  ch.perks = hs.perks.map(e => ({ skillId: e.skillId, level: e.level, uses: e.uses || 0 }));
  for (const e of ch.actives.concat(ch.perks)) A.SkillSys.storeProgress(ch, e);
  ch.equippedSet = hs.equippedSet || null;
  ch.inventory = { gold: run.score || 0, items: [] };
  ch.expeditionHero = d.key; ch.expeditionHeroState = hs;
  ch.autoOrder = ch.actives.map(a => ({ skillId: a.skillId, off: false })).concat([{ skillId: 'basic_attack', off: false }]);
  ch.autoAdopted = true; ch.autoRepeat = null; ch.autoAttack = false;
  return ch;
};
Heroes.isPicked = ch => !!(ch && ch.expeditionHero);
// The portrait texture: the bought set, else the hero's travelling clothes.
Heroes.portraitKey = function (scene, ch) {
  const d = Heroes.def(ch.expeditionHero);
  return A.Portraits.key(scene, ch.equippedSet || !d ? ch : Object.assign({}, ch, { equippedSet: d.startSet }));
};

// What the HUD shows: up to three actives (right of the portrait), up to three perks (left).
Heroes.kit = function (ch) {
  return {
    actives: ch.actives.filter(a => !a.hidden && a.skillId !== 'basic_attack').slice(0, X.shop.activeSlots).map(a => a.skillId),
    perks: ch.perks.slice(0, X.shop.perkSlots).map(p => p.skillId),
  };
};
// Tier of a known skill as it manifests (gear can lift it): 1 basic, 2 intermediate, 3 advanced.
Heroes.tierIndex = function (ch, skillId) {
  const e = A.SkillSys.knownEntry(ch, skillId); if (!e) return 0;
  const t = A.SkillSys.tierFor(ch, skillId, A.SkillSys.effectiveLevel(ch, skillId, e.level));
  return { basic: 1, intermediate: 2, advanced: 3 }[t] || 1;
};
Heroes.tierName = function (ch, skillId) {
  const e = A.SkillSys.knownEntry(ch, skillId); if (!e) return '';
  const m = A.SkillSys.manifest(ch, e);
  return (m && m.data && m.data.name) || (A.DATA.SKILLS[skillId] || {}).name || skillId;
};

// ---------------------------------------------------------------- shops
// Offers, in the order the stalls list them. `can` = affordable and legal now.
Heroes.offers = function (run) {
  if (!run.hero) return { trainer: [], smith: [] };
  const d = Heroes.def(run.hero.key), ch = Heroes.make(run), Sys = A.SkillSys, T = C().TIER_THRESHOLDS;
  const trainer = [], smith = [];
  const known = id => !!Sys.knownEntry(ch, id);
  const slotsLeft = kind => Sys.capFor(ch, kind) - Sys.slottedCount(ch, kind);
  for (const id of d.trainer.actives) if (!known(id)) trainer.push({ kind: 'learn', slot: 'active', skillId: id, cost: X.shop.learn, can: run.score >= X.shop.learn && slotsLeft('active') > 0, why: slotsLeft('active') > 0 ? null : 'full' });
  for (const id of d.trainer.perks) if (!known(id)) trainer.push({ kind: 'learn', slot: 'perk', skillId: id, cost: X.shop.learn, can: run.score >= X.shop.learn && slotsLeft('perk') > 0, why: slotsLeft('perk') > 0 ? null : 'full' });
  for (const [slot, list] of [['active', ch.actives], ['perk', ch.perks]]) for (const e of list) {
    if (e.hidden) continue;
    const next = e.level < T.intermediate ? 'intermediate' : e.level < T.advanced ? 'advanced' : null;
    if (!next) continue;
    const cost = X.shop.tutor[next];
    trainer.push({ kind: 'tutor', slot, skillId: e.skillId, tier: next, level: T[next], cost, can: run.score >= cost });
  }
  if (ch.equippedSet !== d.set) smith.push({ kind: 'set', setId: d.set, name: A.DATA.GEAR_SETS[d.set].name, cost: X.shop.set, can: run.score >= X.shop.set, classes: A.DATA.GEAR_SETS[d.set].archetypes });
  return { trainer, smith };
};

// Buy one offer: gold leaves the purse, the hero snapshot changes, the run is
// the caller's to save. Learning goes through SkillSys.learn (capacity rules);
// tutoring sets the tier level exactly as SkillSys.tutor does.
Heroes.buy = function (run, offer) {
  if (!run.hero || !offer) return { ok: false, reason: 'none' };
  if (run.score < offer.cost) return { ok: false, reason: 'score' };
  const ch = Heroes.make(run), Sys = A.SkillSys;
  if (offer.kind === 'learn') {
    const r = Sys.learn(ch, offer.skillId, { free: true });
    if (!r.ok) return { ok: false, reason: r.error };
  } else if (offer.kind === 'tutor') {
    const e = Sys.knownEntry(ch, offer.skillId);
    if (!e || e.level >= offer.level) return { ok: false, reason: 'nothing to teach' };
    e.level = offer.level; e.uses = Math.max(e.uses || 0, (offer.level - 1) * C().USES_PER_LEVEL);
    Sys.storeProgress(ch, e);
  } else if (offer.kind === 'set') {
    if (!A.DATA.GEAR_SETS[offer.setId]) return { ok: false, reason: 'unknown set' };
    ch.equippedSet = offer.setId;
  } else return { ok: false, reason: 'unknown' };
  run.score -= offer.cost;
  run.hero = Heroes.snapshot(ch);
  run.hero.purchases = (run.hero.purchases || 0) + 1;
  return { ok: true, offer };
};
})();
