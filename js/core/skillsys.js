// Skill system (§3): journal, witness rule, trainer, tiers, capacity & forgetting.
// Works on any character object — player, NPC, monster.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const SK = () => ADV.DATA.SKILLS;

const SkillSys = {};

// ---- Tiers -----------------------------------------------------------------
SkillSys.tierForLevel = function (level) {
  const t = C().TIER_THRESHOLDS;
  if (level >= t.advanced) return 'advanced';
  if (level >= t.intermediate) return 'intermediate';
  return 'basic';
};

// Effective level after gear floor (§3/§10): a matching complete set floors at 10.
SkillSys.effectiveLevel = function (ch, skillId, level) {
  const sk = SK()[skillId];
  if (!sk || sk.noTierGrowth) return level;
  const floor = SkillSys.gearFloor(ch, sk);
  return Math.max(level, floor);
};

SkillSys.setOf = function (ch) {
  if (!ch || !ch.equippedSet) return null;
  return ADV.DATA.GEAR_SETS[ch.equippedSet] || null;
};

SkillSys.setMatchesSkill = function (ch, sk) {
  const set = SkillSys.setOf(ch);
  if (!set || !sk) return false;
  if (sk.archetype && set.archetypes && set.archetypes.includes(sk.archetype)) return true;
  if (set.extraSkills && set.extraSkills.includes(sk.id)) return true;
  return false;
};

SkillSys.gearFloor = function (ch, sk) {
  if (!ch || !ch.equippedSet) return 0;
  const set = SkillSys.setOf(ch);
  if (!set) return 0;
  const floor = set.floor || C().GEAR_SET_FLOOR_LEVEL;
  if (!sk) return floor;                                   // the set's own floor
  if (SkillSys.setMatchesSkill(ch, sk)) return floor;
  return 0;
};

SkillSys.gearAdvances = function (ch, sk) {
  const set = SkillSys.setOf(ch);
  if (!set || !sk) return false;
  if (!(set.advanceTier || set.cost >= (C().GOLD.gearSet || 800))) return false;
  return SkillSys.setMatchesSkill(ch, sk);
};

// Tier data (name + params) as it manifests in this character's hands.
// Perks and actives both tier by level. An advanced faction title (§10)
// lifts the manifestation one tier above actual level. An 800g set
// advances matching skills one tier from their natural level (so a
// basic skill floored to Intermediate does not also jump to Advanced).
SkillSys.tierFor = function (ch, skillId, level) {
  let tier = SkillSys.tierForLevel(level);
  if (ch && ADV.Campaign && ADV.Campaign.titleLifts(ch, skillId)) {
    tier = tier === 'basic' ? 'intermediate' : 'advanced';
  }
  const sk = SK()[skillId];
  if (ch && SkillSys.gearAdvances(ch, sk)) {
    const entry = SkillSys.entryFor(ch, skillId);
    const natural = SkillSys.tierForLevel((entry && entry.level) || level);
    const lifted = natural === 'basic' ? 'intermediate' : 'advanced';
    const order = { basic: 0, intermediate: 1, advanced: 2 };
    if (order[lifted] > order[tier]) tier = lifted;
  }
  return tier;
};

SkillSys.manifest = function (ch, entry) {
  const sk = SK()[entry.skillId];
  const lvl = SkillSys.effectiveLevel(ch, entry.skillId, entry.level);
  const tier = SkillSys.tierFor(ch, entry.skillId, lvl);
  const flare = SkillSys.classFlare(sk, ch);
  const slice = (sk.tiers && sk.tiers[tier]) || {};
  return { skill: sk, tier, level: lvl, data: Object.assign({}, sk, slice), flare };
};

// Same role / target / reach / power — the campaign kits reprint a core
// strike under another class. Unique 0-power buffs stay out of this.
SkillSys.mechKey = function (sk) {
  if (!sk || sk.kind !== 'active' || sk.forbidden || sk.universal || sk.unique) return null;
  const heal = !!sk.heal && !sk.dualHeal;
  const dmg = !heal && (sk.power || 0) > 0;
  if (!heal && !dmg) return null;
  const tgt = sk.target || (heal ? 'ally' : 'enemy');
  const reach = sk.reach || 'any';
  const pow = Math.round((sk.power || 0) * 10) / 10;
  return (heal ? 'heal' : 'dmg') + '|' + tgt + '|' + reach + '|' + pow;
};

SkillSys.twinsOf = function (skillId) {
  const sk = SK()[skillId];
  const key = SkillSys.mechKey(sk);
  if (!key || !sk.archetype) return [];
  const out = [];
  for (const id of Object.keys(SK())) {
    if (id === skillId) continue;
    const o = SK()[id];
    if (!o || !o.archetype || o.archetype === sk.archetype) continue;
    if (SkillSys.mechKey(o) === key) out.push(o);
  }
  return out;
};

// Extra rider for a skill that has a mechanical twin in another class.
// The base power / status stay untouched — this is additive flavour for
// the class the skill is filed under.
const CLASS_FLARE = {
  mage: {
    kind: 'stormthread', shockBonus: 0.2, markStorm: 0.25,
    desc: 'Shocked foes take more from this strike, and the next lightning you throw hits harder.',
  },
  ranger: {
    kind: 'followup', bonusHits: 1, hitPowerMult: 0.5,
    desc: 'Two arrows follow the shot, each at half power.',
  },
  tank: {
    kind: 'brace', guardRounds: 2,
    desc: 'You brace — a short Guard after the blow.',
  },
  healer: {
    kind: 'mercy', healMult: 1.2,
    desc: 'The same working mends a fifth more.',
  },
  rogue: {
    kind: 'openVein',
    poison: { power: 0.4, rounds: 2 },
    bleed: { power: 0.4, rounds: 2 },
    desc: 'The cut also leaves poison and bleed.',
  },
  fighter: {
    kind: 'press', extraHit: 1, extraHitMult: 0.6, defStrip: 6,
    desc: 'A follow-through blow, and the target\'s armor slips.',
  },
  druid: {
    kind: 'wild', thornPct: 0.2, thornRounds: 2, rootRounds: 1,
    desc: 'Thorns rise on you, and the target is rooted a moment.',
  },
};

SkillSys.classFlare = function (sk, ch) {
  if (!sk || !sk.archetype || !CLASS_FLARE[sk.archetype]) return null;
  if (ch && (ch.isMonster || ch.enemyTypeId)) return null;
  const twins = SkillSys.twinsOf(sk.id);
  if (!twins.length) return null;
  return Object.assign({ twins: twins.map(t => t.id) }, CLASS_FLARE[sk.archetype]);
};
SkillSys.CLASS_FLARE = CLASS_FLARE;

// ---- Journal (§3) — uncapped, survives death --------------------------------
// journal: { [skillId]: { witnessed: bool, sawTier: 'basic'|'intermediate'|'advanced', eligible: bool } }
SkillSys.ensureJournal = function (ch) { if (!ch.journal) ch.journal = {}; return ch.journal; };

// Record a sighting. Advanced sightings reveal the root and make the BASIC learnable free.
SkillSys.witness = function (ch, skillId, tierSeen, from) {
  const sk = SK()[skillId];
  if (!sk || sk.universal || sk.unique) return null; // unique tier is never witnessable (§14)
  if (sk.kind === 'perk') return null;               // perks are gold-only, never witnessed (§13d-2)
  const j = SkillSys.ensureJournal(ch);
  const e = j[skillId] || (j[skillId] = { witnessed: false, sawTier: 'basic', eligible: false });
  const order = { basic: 0, intermediate: 1, advanced: 2 };
  e.witnessed = true;
  e.eligible = true;
  if (order[tierSeen] > order[e.sawTier || 'basic']) e.sawTier = tierSeen;
  if (from && !e.from) e.from = from;   // who showed you — shown in the journal
  return e;
};

SkillSys.isWitnessed = function (ch, skillId) {
  return !!(ch.journal && ch.journal[skillId] && ch.journal[skillId].witnessed);
};

// ---- Trainer cost (§3/§16) --------------------------------------------------
SkillSys.trainerCost = function (ch, skillId) {
  if (SkillSys.freeSkillsRemaining(ch) > 0) return 0;
  const sk = SK()[skillId];
  if (sk && sk.kind === 'perk') return C().GOLD.skillUnwitnessed; // gold only (§13d-2)
  if (SkillSys.isWitnessed(ch, skillId)) return 0;
  return C().GOLD.skillUnwitnessed;
};

// Can this character buy/learn this skill at the trainer right now?
// Campaign skills are witness-only until a campaign is completed; campaign
// perks open the moment the player joins that faction (§13, §13d-2).
SkillSys.purchasable = function (ch, skillId, meta) {
  const sk = SK()[skillId];
  if (!sk || sk.universal || sk.unique) return false;
  if (!sk.faction) return true;
  if (ADV.Campaign) return ADV.Campaign.skillPurchasable(ch, skillId, meta);
  return false;
};

SkillSys.freeSkillsRemaining = function (ch) {
  const used = ch.freeSkillsUsed || 0;
  return Math.max(0, C().FREE_STARTING_SKILLS - used);
};

// ---- Capacity, learn, forget (§3) -------------------------------------------
SkillSys.capFor = function (ch, kind) {
  if (kind === 'perk') return ch.perkCap != null ? ch.perkCap : C().PLAYER_PERK_SLOTS;
  return ch.activeCap != null ? ch.activeCap : C().PLAYER_ACTIVE_SLOTS;
};

SkillSys.slotList = function (ch, kind) { return kind === 'perk' ? ch.perks : ch.actives; };

SkillSys.knows = function (ch, skillId) {
  return ch.perks.some(p => p.skillId === skillId) || ch.actives.some(a => a.skillId === skillId);
};

// Master Swordsman: katana skills don't consume active slots.
// A worn gear set parks matching skills in an unlimited armor slot.
SkillSys.slotExempt = function (ch, sk) {
  if (!sk) return false;
  if (sk.kind === 'active' && sk.katana && SkillSys.knownVal(ch, 'katanaFreeSlots')) return true;
  return SkillSys.setMatchesSkill(ch, sk);
};

SkillSys.inArmorSlot = function (ch, skillId) {
  const sk = SK()[skillId];
  return !!(sk && !sk.noSlot && SkillSys.setMatchesSkill(ch, sk));
};

SkillSys.countsTowardCap = function (ch, skillId) {
  const sk = SK()[skillId];
  if (!sk || sk.noSlot || SkillSys.slotExempt(ch, sk)) return false;
  return true;
};

SkillSys.slottedCount = function (ch, kind) {
  return SkillSys.slotList(ch, kind).filter(e => SkillSys.countsTowardCap(ch, e.skillId)).length;
};

SkillSys.countingEntries = function (ch, kind) {
  return SkillSys.slotList(ch, kind).filter(e => SkillSys.countsTowardCap(ch, e.skillId));
};

SkillSys.overBy = function (ch, kind) {
  return Math.max(0, SkillSys.slottedCount(ch, kind) - SkillSys.capFor(ch, kind));
};

SkillSys.isOverCapacity = function (ch) {
  return !!(ch && (SkillSys.overBy(ch, 'perk') > 0 || SkillSys.overBy(ch, 'active') > 0));
};

// Drop extras until each kind fits its cap. Lowest level first; the most
// recently learned of that level goes if they tie. Levels stay in the journal.
// For NPCs after an outfit change — the player chooses in the town UI.
SkillSys.trimToCap = function (ch) {
  const dropped = [];
  if (!ch) return dropped;
  for (const kind of ['perk', 'active']) {
    while (SkillSys.overBy(ch, kind) > 0) {
      const slotted = SkillSys.countingEntries(ch, kind);
      if (!slotted.length) break;
      const orig = SkillSys.slotList(ch, kind);
      const low = Math.min.apply(null, slotted.map(e => e.level || 1));
      const candidates = slotted.filter(e => (e.level || 1) === low);
      candidates.sort((a, b) => orig.indexOf(a) - orig.indexOf(b));
      const pick = candidates[candidates.length - 1];
      if (!pick || !SkillSys.forget(ch, pick.skillId).ok) break;
      dropped.push(pick.skillId);
    }
  }
  return dropped;
};

SkillSys.atCapacity = function (ch, kind) {
  return SkillSys.slottedCount(ch, kind) >= SkillSys.capFor(ch, kind);
};

// Learn a basic skill. Returns {ok, cost, error}. Caller pays gold beforehand via canLearn.
SkillSys.learn = function (ch, skillId, opts) {
  opts = opts || {};
  const sk = SK()[skillId];
  if (!sk) return { ok: false, error: 'unknown skill' };
  if (sk.campaignReward) return { ok: false, error: 'Earn this perk in Varenholm’s Iron War.' };
  if (sk.unique && !opts.allowUnique) return { ok: false, error: 'unique tier — cannot be learned' };
  // A secret character arrives finished. He carries his own kit and nothing else — no
  // trainer, no witnessing, no free starting picks — so the ledger cannot be widened.
  if (ch && ch.fixedKit && !opts.fixedKit) return { ok: false, error: 'He fights with what he brought.' };
  if (SkillSys.knows(ch, skillId)) return { ok: false, error: 'already known' };
  const kind = sk.kind === 'perk' ? 'perk' : 'active';
  if (!sk.noSlot && !SkillSys.slotExempt(ch, sk) && SkillSys.atCapacity(ch, kind) && !opts.forgetting) {
    return { ok: false, error: 'at capacity', needForget: true };
  }
  // Levels survive drops (§3): restore prior level from the meta record if present.
  const prior = (ch.skillLevels && ch.skillLevels[skillId]) || { level: 1, uses: 0 };
  const entry = { skillId, level: prior.level, uses: prior.uses };
  if (SkillSys.isWitnessed(ch, skillId) || opts.witnessed) {
    const start = SkillSys.knownVal(ch, 'witnessStartLevel');
    if (start && entry.level < start) {
      entry.level = start;
      entry.uses = Math.max(entry.uses, (start - 1) * C().USES_PER_LEVEL);
    }
  }
  if (prior.auto) entry.auto = true;
  if (prior.autoOff) entry.autoOff = true;
  SkillSys.slotList(ch, kind).push(entry);
  const j = SkillSys.ensureJournal(ch);
  const je = j[skillId] || (j[skillId] = { witnessed: false, sawTier: 'basic', eligible: false });
  je.learned = true;
  if (!opts.free && !SkillSys.isWitnessed(ch, skillId) && SkillSys.freeSkillsRemaining(ch) > 0) {
    ch.freeSkillsUsed = (ch.freeSkillsUsed || 0) + 1;
  }
  return { ok: true, entry };
};

// Forget: returns to Eligible in the journal; level preserved in ch.skillLevels.
SkillSys.forget = function (ch, skillId) {
  if (SK()[skillId]?.campaignReward) return { ok: false, error: 'Campaign perks are permanent and use no slot.' };
  for (const kind of ['perk', 'active']) {
    const list = SkillSys.slotList(ch, kind);
    const i = list.findIndex(e => e.skillId === skillId);
    if (i >= 0) {
      const e = list[i];
      SkillSys.storeProgress(ch, e);
      list.splice(i, 1);
      if (ch.journal && ch.journal[skillId]) ch.journal[skillId].learned = false;
      return { ok: true };
    }
  }
  return { ok: false, error: 'not known' };
};

// Paid tutoring: the trainer lifts a known perk or active to a tier threshold.
SkillSys.knownEntry = function (ch, skillId) {
  if (!ch) return null;
  return (ch.actives || []).find(a => a.skillId === skillId) || (ch.perks || []).find(p => p.skillId === skillId) || null;
};
SkillSys.tutorOffers = function (ch, skillId) {
  if (ch && ch.fixedKit) return [];
  const entry = SkillSys.knownEntry(ch, skillId);
  const sk = SK()[skillId];
  if (!entry || !sk || sk.noTierGrowth) return [];
  const T = C().TIER_THRESHOLDS, G = C().GOLD;
  const out = [];
  if (entry.level < T.intermediate) out.push({ tier: 'intermediate', level: T.intermediate, cost: G.tutorIntermediate });
  if (entry.level < T.advanced) out.push({ tier: 'advanced', level: T.advanced, cost: G.tutorAdvanced });
  return out;
};
SkillSys.tutor = function (ch, skillId, tier) {
  const offer = SkillSys.tutorOffers(ch, skillId).find(o => o.tier === tier);
  if (!offer) return { ok: false, error: 'nothing to teach' };
  if (ch.inventory.gold < offer.cost) return { ok: false, error: 'not enough gold' };
  const entry = SkillSys.knownEntry(ch, skillId);
  ch.inventory.gold -= offer.cost;
  entry.level = offer.level; entry.uses = Math.max(entry.uses, (offer.level - 1) * C().USES_PER_LEVEL);
  SkillSys.storeProgress(ch, entry);
  return { ok: true, level: entry.level };
};

// ---- Use & leveling (§15) ---------------------------------------------------
SkillSys.recordUse = function (ch, skillId) {
  const entry = ch.perks.find(p => p.skillId === skillId) || ch.actives.find(a => a.skillId === skillId);
  if (!entry) return null;
  const sk = SK()[skillId];
  if (sk && sk.noTierGrowth) return null;
  let rate = 1;
  if (ADV.Campaign) rate *= ADV.Campaign.levelRate(ch, skillId);   // faction title 2x/3x
  const prodigy = SkillSys.knownVal(ch, 'levelMult');
  if (prodigy) rate *= prodigy;
  entry.uses += rate;
  const newLevel = 1 + Math.floor(entry.uses / C().USES_PER_LEVEL);
  const leveled = newLevel > entry.level;
  entry.level = Math.max(entry.level, newLevel);
  // Mirror into the persistent record so death/drops keep levels (§3).
  SkillSys.storeProgress(ch, entry);
  return leveled ? { leveled: true, level: entry.level, tier: SkillSys.tierForLevel(entry.level) } : null;
};

SkillSys.storeProgress = function (ch, entry) {
  if (!ch || !entry) return;
  ch.skillLevels = ch.skillLevels || {};
  const rec = ch.skillLevels[entry.skillId] || {};
  rec.level = entry.level;
  rec.uses = entry.uses;
  rec.auto = !!entry.auto;
  rec.autoOff = !!entry.autoOff;
  ch.skillLevels[entry.skillId] = rec;
};

// Journal view for the UI: Witnessed / Eligible / Learned / Mastered.
SkillSys.journalState = function (ch, skillId) {
  const j = (ch.journal && ch.journal[skillId]) || null;
  const entry = ch.perks.find(p => p.skillId === skillId) || ch.actives.find(a => a.skillId === skillId);
  const lvl = entry ? entry.level : ((ch.skillLevels && ch.skillLevels[skillId]) || {}).level || 0;
  if (lvl >= C().TIER_THRESHOLDS.advanced) return 'Mastered';
  if (entry) return 'Learned';
  if (j && j.eligible) return 'Eligible';
  if (j && j.witnessed) return 'Witnessed';
  return null;
};

// Highest tier this character's version of the skill has reached (for enemy authoring).
SkillSys.entryFor = function (ch, skillId) {
  return ch.perks.find(p => p.skillId === skillId) || ch.actives.find(a => a.skillId === skillId) || null;
};

// First matching data value across known perks and actives (SKILL_AUDIT §1).
SkillSys.knownVal = function (ch, key) {
  if (!ch) return null;
  const lists = (ch.perks || []).concat(ch.actives || []);
  let best = null;
  for (const e of lists) {
    const m = SkillSys.manifest(ch, e);
    if (!m || !m.data || m.data[key] == null || m.data[key] === false) continue;
    const v = m.data[key];
    if (best == null) best = v;
    else if (typeof v === 'number' && typeof best === 'number') best = v > best ? v : best;
    else if (v) best = v;
  }
  return best;
};
SkillSys.knownSum = function (ch, key) {
  if (!ch) return 0;
  let n = 0;
  for (const e of (ch.perks || []).concat(ch.actives || [])) {
    const m = SkillSys.manifest(ch, e);
    if (m && m.data && typeof m.data[key] === 'number') n += m.data[key];
  }
  return n;
};
SkillSys.knownProduct = function (ch, key) {
  if (!ch) return 1;
  let n = 1;
  for (const e of (ch.perks || []).concat(ch.actives || [])) {
    const m = SkillSys.manifest(ch, e);
    if (m && m.data && typeof m.data[key] === 'number') n *= m.data[key];
  }
  return n;
};

ADV.SkillSys = SkillSys;
})();
