// Difficulty (request). Easy is the previous Normal: one extra enemy, veterans
// with intermediate kits, a smaller health buffer. It is still the road for people
// short on time — fights stay winnable — but it is no longer the original shipped
// game with doubled health and no extras. Normal is the previous Hard. Hard goes past
// that again: seasoned enemies fight at their ADVANCED manifestation, levels climb
// another three, the stat edge widens and almost nothing comes back between fights.
// One setting per player, kept in meta so it survives a death and a new life.
// The levers, in order of weight:
//   extraFoes   more enemies per encounter (copies of the encounter's own kinds;
//               never more adds than the player has companions)
//   foeLevel    enemy level offset: skills climb, tier-1 mooks bring perks
//   basicHitCap the most of a foe's maximum health one use of a BASIC-tier skill can take
//               (1/3 easy, 1/4 normal, 1/5 hard, 0 = uncapped). A basic skill is an opener, not an
//               execution: however far the wielder outclasses a mook, they cannot delete it
//               in one press. The allowance covers the whole action, riders included.
//   foeSkillFloorFrom the lowest natural enemy level the kit floor reaches. Below it a
//               creature fights with the kit it was written with: a wolf on a first contract
//               is a wolf, not a veteran wolf. Better enemies are meant to be enemies that
//               are already something, not every mook on the road.
//   foeSkillFloor every enemy skill is at least this level (10 = intermediate kits on easy
//               and normal; 25 on hard, which is the advanced threshold) — the "better enemies" lever
//   foeHp/Atk/Def a small stat edge on top
//   playerHp    the player's health buffer (easy is half again; normal and hard have none)
//   recoverPct  health back after each won encounter
//   payBonus/payMult   contract pay (easy carries a flat +250; hard pays 70%)
//   autoStopPct auto-combat safety stop (30% easy, off from normal up)
// test/difficulty_sim.js is the yardstick behind the numbers; change them there first.
(function () {
'use strict';
const A = globalThis.ADV = globalThis.ADV || {};

const ORDER = ['easy', 'normal', 'hard'];
const LEVELS = {
  easy: {
    id: 'easy', name: 'Easy', tagline: 'A fair fight.',
    blurb: 'One more enemy in every fight and better ones — the seasoned ones fighting with better kits, and their perks. Your health buffer is smaller and less of it comes back between fights. Auto combat stops below 30%. A basic-tier skill can take at most a third of an enemy in one blow.',
    extraFoes: 1, foeLevel: 2, foeSkillFloor: 10, foeSkillFloorFrom: 8, foeHp: 1.0, foeAtk: 1.0, foeDef: 1.0,
    basicHitCap: 1 / 3,
    // +200g a contract over the old 50. payMult is 1.0 here, so payBonus lands as an exact
    // flat raise on every quest the board makes: solo, party, hazard, war, god and campaign
    // alike all run through Difficulty.pay (see balance_support.js).
    playerHp: 1.5, recoverPct: 0.35, payBonus: 250, payMult: 1.0, autoStopPct: 0.3, fleeWarn: true,
  },
  // Normal takes over what Hard used to field, and Hard steps past it. Both settings were
  // measured winnable to the point of being unremarkable, so the whole ladder moves up.
  normal: {
    id: 'normal', name: 'Normal', tagline: 'No quarter.',
    blurb: 'Three more enemies in every fight, higher-level veterans with their perks, and a little more bite in every blow. No health buffer, almost no rest between fights, leaner pay, and auto combat never stops itself. A basic-tier skill can take at most a quarter of an enemy in one blow.',
    extraFoes: 3, foeLevel: 6, foeSkillFloor: 10, foeSkillFloorFrom: 4, foeHp: 1.1, foeAtk: 1.1, foeDef: 1.0,
    basicHitCap: 1 / 4,
    playerHp: 1.0, recoverPct: 0.1, payBonus: 0, payMult: 0.85, autoStopPct: 0, fleeWarn: false,
  },
  // The extra-enemy lever is clamped by the company you keep (reinforce() never adds more
  // bodies than you have companions), so past three it stops buying anything for an ordinary
  // four-hand party. Hard leans on the levers that are not clamped instead: the kit floor goes
  // to the ADVANCED threshold, so every enemy that has seen a fight brings its top
  // manifestation, levels climb another three, the stat edge widens, the basic-tier allowance
  // tightens to a fifth, and almost nothing comes back between fights.
  hard: {
    id: 'hard', name: 'Hard', tagline: 'They have done this before.',
    blurb: 'Four more enemies where your company can be flanked, every seasoned one fighting at its highest manifestation, levels far above yours, and a real stat edge on top. No health buffer, next to no rest between fights, the leanest pay, and a basic-tier skill can take at most a fifth of an enemy in one blow.',
    extraFoes: 4, foeLevel: 8, foeSkillFloor: 25, foeSkillFloorFrom: 4, foeHp: 1.15, foeAtk: 1.15, foeDef: 1.0,
    basicHitCap: 1 / 5,
    playerHp: 1.0, recoverPct: 0.08, payBonus: 0, payMult: 0.7, autoStopPct: 0, fleeWarn: false,
  },
};

const Difficulty = { ORDER, LEVELS, DEFAULT: 'easy' };
let bound = null;          // the game whose meta holds the setting
let cached = null;         // the id in force when no game is bound (title / creation)

Difficulty.valid = id => !!LEVELS[id];
Difficulty.stored = function () {
  try { const m = A.Save && A.Save.loadMeta && A.Save.loadMeta(); if (m && LEVELS[m.difficulty]) return m.difficulty; } catch (e) {}
  return Difficulty.DEFAULT;
};
Difficulty.bind = function (game) {
  bound = game || null;
  if (bound) { if (!bound.meta) bound.meta = {}; if (!LEVELS[bound.meta.difficulty]) bound.meta.difficulty = cached || Difficulty.DEFAULT; cached = bound.meta.difficulty; }
  return Difficulty.id();
};
Difficulty.id = function () {
  if (bound && bound.meta && LEVELS[bound.meta.difficulty]) return bound.meta.difficulty;
  return cached || Difficulty.DEFAULT;
};
Difficulty.def = function (id) { return LEVELS[id || Difficulty.id()] || LEVELS[Difficulty.DEFAULT]; };
Difficulty.name = function (id) { return Difficulty.def(id).name; };

// Choose a level. With a game bound it is written to meta and saved; the player's
// current health is re-fitted to the new maximum so a smaller buffer never leaves
// them "over full" and a larger one never leaves them short of the same fraction.
Difficulty.set = function (game, id) {
  if (!LEVELS[id]) return Difficulty.id();
  const g = game || bound;
  if (g) {
    if (!g.meta) g.meta = {};
    const p = A.Game && A.Game.player ? A.Game.player(g) : null;
    const beforeMax = p ? A.Character.maxHp(p) : 0;
    const frac = p && p.combatHp != null && beforeMax > 0 ? Math.max(0, Math.min(1, p.combatHp / beforeMax)) : null;
    g.meta.difficulty = id;
    bound = g; cached = id;
    if (p && frac != null) p.combatHp = Math.max(1, Math.round(A.Character.maxHp(p) * frac));
    try { Difficulty.retune(g); } catch (e) {}
    if (A.Save && A.Save.saveMeta) { try { A.Save.saveMeta(g); } catch (e) {} }
  } else {
    cached = id;
    try { const m = A.Save.loadMeta(); m.difficulty = id; A.Save.saveMeta({ meta: m }); } catch (e) {}
  }
  return id;
};

// ---- the levers ----------------------------------------------------------------
Difficulty.playerHpMult = function () { return Difficulty.def().playerHp; };
// Opponents the setting scales. Allies of any kind are excluded even when they
// began life as a monster (conscripts, the risen, quest thralls).
Difficulty.isFoe = function (ch) {
  if (!ch || ch.isPlayer) return false;
  if (ch.isConscript || ch.raisedById || ch.isQuestThrall || ch.conscriptorId) return false;
  return !!(ch.isMonster || ch.campaignEnemy || ch.enemyTypeId || ch.hostileScale);
};
Difficulty.foeMult = function (key) {
  const d = Difficulty.def();
  return key === 'hp' ? d.foeHp : key === 'atk' ? d.foeAtk : key === 'def' ? d.foeDef : 1;
};
Difficulty.foeLevel = function () { return Difficulty.def().foeLevel || 0; };
Difficulty.extraFoes = function () { return Difficulty.def().extraFoes || 0; };
Difficulty.autoStopPct = function () { return Difficulty.def().autoStopPct; };
Difficulty.recoverPct = function () { const d = Difficulty.def(); return d.recoverPct != null ? d.recoverPct : 0.5; };
Difficulty.fleeWarn = function () { return !!Difficulty.def().fleeWarn; };
Difficulty.basicHitCap = function () { return Difficulty.def().basicHitCap || 0; };
Difficulty.pay = function (base) { const d = Difficulty.def(); return Math.round((base + d.payBonus) * d.payMult); };

// A freshly spawned enemy becomes a veteran: every skill it carries climbs by the
// level offset (that is what moves a kit up a tier), and a tier-1 mook that the
// base game sends out perkless picks up its type's perks once it is a veteran.
// Called by Character.makeEnemy and Campaign.spawnEnemy; idempotent per unit.
// What a creature was before any difficulty touched it. Toughening used to be a one-way
// edit — it raised levels in place and set a flag so it never ran twice — which meant a
// change of setting mid-game did nothing to anyone already on the board, and an enemy
// spawned on Hard stayed Hard even after the player dropped to Easy. Keeping the original
// lets the current setting be re-derived from scratch, as often as it changes.
function pristineKit(ch) {
  if (!ch.__kit0) {
    ch.__kit0 = {
      enemyLevel: ch.enemyLevel,
      actives: (ch.actives || []).map(e => ({ skillId: e.skillId, level: e.level, uses: e.uses })),
      perks: (ch.perks || []).map(e => ({ skillId: e.skillId, level: e.level, uses: e.uses })),
    };
  }
  return ch.__kit0;
}

Difficulty.toughen = function (ch, type) {
  if (!ch || !Difficulty.isFoe(ch)) return ch;
  const base = pristineKit(ch);
  const def = Difficulty.def();
  const off = Difficulty.foeLevel(), floor = def.foeSkillFloor || 0, from = def.foeSkillFloorFrom || 0;
  const uses = (A.DATA.CONST && A.DATA.CONST.USES_PER_LEVEL) || 10;
  // The floor reaches only enemies that are already seasoned. Applied to everything, it made
  // a level-1 wolf swing an intermediate kit, which is what made early Normal bite so hard.
  // It raises how well a creature fights and never what it is, so enemyLevel takes the
  // offset alone.
  const useFloor = (base.enemyLevel || 1) >= from ? floor : 0;
  const lift = lvl => Math.max((lvl || 1) + off, useFloor);
  const retune = (live, orig) => {
    // keep the live entries (they carry progress) and re-derive only what the setting owns
    for (let i = 0; i < orig.length; i++) {
      const e = live[i], b = orig[i];
      if (!e || !b) continue;
      e.level = lift(b.level);
      e.uses = Math.max(b.uses || 0, e.level * uses);
    }
  };
  ch.actives = ch.actives || [];
  ch.perks = ch.perks || [];
  // drop any perks a previous setting handed out before re-deriving
  if (ch.perks.length > base.perks.length) ch.perks.length = base.perks.length;
  retune(ch.actives, base.actives);
  retune(ch.perks, base.perks);
  const t = type || (A.DATA.ENEMIES && A.DATA.ENEMIES[ch.enemyTypeId]);
  if (t && t.perks && !base.perks.length && (off || useFloor)) {
    const lvl = lift(base.enemyLevel);
    for (const id of t.perks) if (A.DATA.SKILLS[id]) ch.perks.push({ skillId: id, level: lvl, uses: lvl * uses });
  }
  if (base.enemyLevel) ch.enemyLevel = (base.enemyLevel || 1) + off;
  return ch;
};

// Re-arm everything already on the board for the setting now in force. Called whenever the
// player changes difficulty, so a change takes effect on the quest they are standing in
// rather than only on the next one they accept.
Difficulty.retune = function (game) {
  const g = game || bound;
  const q = g && g.quest;
  if (!q || !q.enemies) return 0;
  // A fight already under way keeps the bodies it started with: the combat units were built
  // from these creatures and hold their own health snapshots. The change lands on the next one.
  if (q.combat && !q.combat.over) return 0;
  let n = 0;
  for (const ch of q.enemies) if (ch && Difficulty.isFoe(ch)) { Difficulty.toughen(ch, null); n++; }
  return n;
};

// More enemies: the encounter's own non-boss kinds, spawned again at the same
// level through the same spawner, so a bandit road adds bandits and a kobold
// warren adds kobolds. A lone boss stays a lone boss.
// A lone fighter is never simply swarmed: the adds never outnumber the player's
// own companions (solo work gets the veterans and the stat edge, not the crowd).
Difficulty.reinforce = function (rng, quest, enemies, world, allies) {
  let n = Difficulty.extraFoes();
  if (allies != null) n = Math.min(n, Math.max(0, allies - 1));
  if (!n || !enemies || !enemies.length || !rng) return enemies;
  const templates = enemies.filter(e => e && !e.boss && !e.isBossFight && e.enemyTypeId && !e.campaignExit);
  if (!templates.length) return enemies;
  const solo = quest && quest.track === 'solo';
  for (let i = 0; i < n; i++) {
    const t = templates[i % templates.length];
    const level = Math.max(1, (t.enemyLevel || 1) - Difficulty.foeLevel());   // spawners add the offset again
    let e = null;
    try {
      if (A.DATA.CAMPAIGN_ENEMIES && A.DATA.CAMPAIGN_ENEMIES[t.enemyTypeId]) {
        e = A.Campaign.spawnEnemy(rng, t.enemyTypeId, level, { world });
        if (A.Campaign2 && A.Campaign2.applySkin) A.Campaign2.applySkin(rng, e, t.enemyTypeId);
      } else if (A.DATA.ENEMIES && A.DATA.ENEMIES[t.enemyTypeId]) {
        e = A.Character.makeEnemy(rng, t.enemyTypeId, { level, world });
        if (e.armored) e.armorBonus = A.DATA.CONST.ARMORED_BONUS_DEF;
        if (solo && !quest.soloPremium && A.Quests.scaleSoloMook) A.Quests.scaleSoloMook(e);
      }
    } catch (err) { e = null; }
    if (!e) continue;
    e.reinforcement = true;
    if (t.noCombatVoice) { e.noCombatVoice = true; delete e.personalityId; }
    enemies.push(e);
  }
  return enemies;
};

// Bind on every new life and every load, so the setting is in force before the
// first stat is read.
for (const [owner, name] of [[A.Save, 'loadGame'], [A.Game, 'newGame']]) {
  if (!owner || !owner[name]) continue;
  const original = owner[name];
  owner[name] = function (...args) { const g = original.apply(this, args); if (g) Difficulty.bind(g); return g; };
}

A.Difficulty = Difficulty;
})();
