// Character factory (§2, §17a): one data structure for player, NPC, and monster.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const SK = () => ADV.DATA.SKILLS;

let NEXT_ID = 1;
const Character = {};
Character.resetIds = function (n) { NEXT_ID = n || 1; };
Character.peekNextId = function () { return NEXT_ID; };
// Hydration must reserve existing identities before any factory runs. Also scan
// dependents and cached story records; their references can outlive a resident.
Character.syncIds = function (world, deep = false) {
  const seen = new Set();
  function visit(value) {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    const match = typeof value.id === 'string' && /^c(\d+)$/.exec(value.id);
    if (match) NEXT_ID = Math.max(NEXT_ID, Number(match[1]) + 1);
    if(deep)for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child);
  }
  if(deep)visit(world);else for(const ch of world?.characters||[])visit(ch);
};

// Steel, ice, and lightning bite constructs and the risen; poison, bleed, and
// burn do nothing. Necromancy cannot raise them.
Character.enemyDef = function (ch) {
  if (!ch) return null;
  const id = ch.enemyTypeId;
  if (!id || !ADV.DATA) return null;
  return ADV.DATA.ENEMIES[id] || ADV.DATA.BOSSES[id] ||
    (ADV.DATA.CAMPAIGN_ENEMIES && ADV.DATA.CAMPAIGN_ENEMIES[id]) || null;
};
Character.isOrganic = function (ch) {
  if (!ch) return true;
  if (ch.organic === false) return false;
  if (ch.isUndead) return false;
  if (ch.species === 'construct') return false;
  const def = Character.enemyDef(ch);
  if (def && (def.species === 'construct' || def.organic === false)) return false;
  return true;
};
Character.applyNonOrganic = function (ch) {
  if (!ch || Character.isOrganic(ch)) return ch;
  ch.organic = false;
  const imm = C().NON_ORGANIC_IMMUNITIES || ['poison', 'bleed', 'burn'];
  ch.statusImmunities = Array.from(new Set((ch.statusImmunities || []).concat(imm)));
  return ch;
};

Character.rollStats = function (rng, species) {
  const r = C().SPECIES[species] || C().SPECIES.human;
  return {
    hp: rng.int(r.hp[0], r.hp[1]),
    atk: rng.int(r.atk[0], r.atk[1]),
    def: rng.int(r.def[0], r.def[1]),
    spd: rng.int(r.spd[0], r.spd[1]),
  };
};

Character.base = function (o) {
  const ch = Object.assign({
    id: 'c' + (NEXT_ID++),
    name: 'Unnamed', sex: 'm', species: 'human',
    portraitSeed: 0, portraitKind: 'npc',
    status: 'normal',                       // normal|hero|villain|undead|conscript
    stats: { hp: 100, atk: 10, def: 10, spd: 10 },
    bonusStats: { hp: 0, atk: 0, def: 0, spd: 0 },  // nepotism title + Hero + Finisher only
    perks: [], actives: [],                 // [{skillId, level, uses, auto?, autoOff?}]
    autoAttack: false, autoRepeat: null, autoOrder: [], autoIdx: 0, autoAdopted: false,
    perkCap: C().PLAYER_PERK_SLOTS, activeCap: C().PLAYER_ACTIVE_SLOTS,
    journal: {}, skillLevels: {}, freeSkillsUsed: 0,
    equipped: [], equippedSet: null,
    inventory: { gold: 0, items: [], weightCap: 40 },
    vaultId: null,
    rank: 1, reputation: 0, questsCompleted: 0, questsFailed: 0,
    factionStanding: { criminal: 0, law: 0, neutral: 0 },
    personality: { aggression: 50, greed: 50, caution: 50, loyalty: 50, pride: 50 },
    archetypeInclination: [], factionLeaning: 'neutral',
    personalityId: null, lastVariantUsed: {}, dialogueRotation: {},
    partnerId: null, partnerIds: [], childIds: [], motherId: null, fatherId: null,
    homeId: 'camp',
    titleBonus: 0, title: null,
    isUndead: false, undeadQuestsLeft: 0, raisedById: null,
    isConscript: false, conscriptQuestsLeft: 0, conscriptorId: null,
    conscriptIds: [], undeadIds: [],        // followers this character controls
    hospitalizedQuestsLeft: 0,
    necromancyRaises: 0, divineMarked: false, divineMarkQuest: null,
    heroTargetId: null, heroPowerMult: 0, divineInvitesWindow: [],
    grantsHeld: false,                       // True Rest + Hero currently granted
    bloodline: { demigod: false },
    alive: true, deadAtQuest: null,
    partyId: null, leaderId: null, wage: 0,
    isPlayer: false, registryId: null, playerHealthV1: !!(o && o.isPlayer),
    jiltCount: 0, badActor: false,
    // children under 10 quests tracked as simple records on the mother:
    dependents: [],                          // [{id, age, fatherId, sex, demigod}]
    pregnantBy: null, relationshipQuests: 0,
  }, o);
  Character.applyNonOrganic(ch);
  return ch;
};

Character.effStat = function (ch, key) {
  let v = ch.stats[key] + (ch.bonusStats[key] || 0);
  if (key === 'hp' && ch.questHp) v += ch.questHp;                 // survival growth, for this quest only
  if (ch.meal && ch.meal.bonus && ch.meal.bonus[key]) v += ch.meal.bonus[key];   // a meal lasts one quest
  if (ch.status === 'hero' && ch.heroPowerMult > 0 && ch.grantsHeld) v = Math.round(v * ch.heroPowerMult);
  if (ch.status === 'villain' && ch.heroPowerMult > 0) v = Math.round(v * ch.heroPowerMult);
  if (ch.isUndead) v = Math.round(v * (ch.risenPower || C().UNDEAD_STAT_MULT));
  const m = ADV.Survival ? ADV.Survival.statMult(ch) : 1;
  if (m !== 1) v = Math.max(0, Math.round(v * m));
  const Df = ADV.Difficulty;
  // the player's health buffer and the enemy's edge are the difficulty setting (§difficulty.js)
  if (ch.isPlayer) return key === 'hp' ? Math.round(v * (Df ? Df.playerHpMult() : 2)) : v;
  if (Df && (key === 'hp' || key === 'atk' || key === 'def') && Df.isFoe(ch)) {
    const m = Df.foeMult(key);
    if (m !== 1) v = Math.max(0, Math.round(v * m));
  }
  return v;
};

Character.maxHp = function (ch) {
  let v = Character.effStat(ch, 'hp');
  if (ch && !ch.isPlayer && (ch.status === 'hero' || ch.status === 'villain')) {
    v = Math.max(v, ch.npcHpFloor || 0);
  }
  return v;
};

// NPC heroes and villains never sit below the living player's HP. The player
// does not receive this floor, even if they hold the same title.
Character.syncNpcHeroFloor = function (list) {
  const chars = (list && list.characters) ? list.characters : (list || []);
  const player = chars.find(c => c && c.isPlayer && c.alive !== false);
  if (!player) return;
  // The player safety buffer must not also double enemy hero health.
  const floor = Character.effStat(player, 'hp') / (ADV.Difficulty ? ADV.Difficulty.playerHpMult() : 2);
  for (const c of chars) {
    if (c && !c.isPlayer && (c.status === 'hero' || c.status === 'villain')) c.npcHpFloor = floor;
  }
};

// ---- Voice routing for special speakers (add-on §0a) ------------------------
// A demigod keeps their rolled personality's LINES and only changes VOICE, so
// this returns a directory tag rather than a personality: clips live at
// audio/vo/<tag>/<personalityId>/<band>_<idx>.mp3 and fall back to the ordinary
// clip when that set has not been generated.
Character.VOICE_TAGS = {
  godf:      't9puW54s29EO0gQK6OMR',   // female demigod / The Pale Mother
  godm:      'HMvHZWb0ZWSo5Kc5l22D',   // male demigod / The Drowned King
  matriarch: '0KlQKzxy6Oee2hYOyHII',   // high-rank mothers holding an estate
};
Character.voiceTagFor = function (world, ch) {
  if (!ch || ch.isPlayer) return null;
  if (ch.isGod || ch.role === 'god' || ch.godLine) return ch.sex === 'f' ? 'godf' : 'godm';
  if (!ch.personalityId) return null;
  // Ordinary personalities keep their assigned actor at every status.
  return null;
};

// ---- Personality seeding (§17a) ---------------------------------------------
// Prefer a voice the living roster is not already using, so the town does not
// fill with the same Stoic / Steely clips. Once every id of that sex is taken,
// wrap and reuse.
function pickPersonality(rng, sex, world) {
  const pool = Object.values(ADV.DATA.DIALOGUE || {}).filter(p => p.sex === sex && !p.hidden);
  if (!pool.length) return null;
  const used = new Set();
  if (world && world.characters) {
    for (const c of world.characters) {
      if (c && c.alive && c.personalityId) used.add(c.personalityId);
    }
  }
  const fresh = pool.filter(p => !used.has(p.id));
  return rng.pick(fresh.length ? fresh : pool);
}
Character.pickPersonality = pickPersonality;

function rollVector(rng, personalityName) {
  const v = {};
  for (const k of ['aggression', 'greed', 'caution', 'loyalty', 'pride']) v[k] = rng.int(15, 85);
  const B = C().VECTOR_BIAS;
  const boost = (k) => { v[k] = rng.int(65, 95); };
  const drop = (k) => { v[k] = rng.int(5, 35); };
  if (B.caution.includes(personalityName)) { boost('caution'); drop('aggression'); }
  else if (B.aggression.includes(personalityName)) { boost('aggression'); drop('caution'); }
  else if (B.greed.includes(personalityName)) boost('greed');
  else if (B.loyalty.includes(personalityName)) boost('loyalty');
  else if (B.pride.includes(personalityName)) boost('pride');
  else if (B.balanced.includes(personalityName)) {
    for (const k of Object.keys(v)) v[k] = rng.int(40, 60);
  }
  return v;
}

// ---- NPC seeding (§17a) -----------------------------------------------------
Character.seedNPC = function (rng, world, opts) {
  Character.syncIds(world);
  opts = opts || {};
  const sex = opts.sex || rng.pick(['m', 'f']);
  const used = new Set();
  if (world) {
    for (const c of world.characters) {
      if (!c.alive || !c.name) continue;
      used.add(c.name);
      used.add(c.name.split(/\s+/)[0]);
    }
  }
  if (ADV.DATA.CAMPAIGN_CHARS) {
    const skip = /^(the|master|lord|captain|admiral|quartermaster|boatswain|lieutenant|adept)$/i;
    for (const def of Object.values(ADV.DATA.CAMPAIGN_CHARS)) {
      for (const part of String(def.name || '').split(/\s+/)) {
        const w = part.replace(/[^A-Za-z'-]/g, '');
        if (w && !skip.test(w)) used.add(w);
      }
    }
  }
  const pool = ADV.DATA.NAMES[sex].filter(n => !used.has(n));
  const name = opts.name || (pool.length ? rng.pick(pool) : rng.pick(ADV.DATA.NAMES[sex]) + ' ' + rng.int(2, 99));
  const pers = pickPersonality(rng, sex, world);
  const archetypes = C().ARCHETYPES;
  const inclination = [opts.inclination || rng.pick(archetypes)];
  if (rng.chance(0.35)) {
    const second = rng.pick(archetypes.filter(a => a !== inclination[0]));
    inclination.push(second);
  }
  const ch = Character.base({
    name, sex,
    stats: Character.rollStats(rng, 'human'),
    portraitSeed: rng.int(1, 1e9), portraitKind: 'npc',
    personality: rollVector(rng, pers.name),
    personalityId: pers.id,
    archetypeInclination: inclination,
    factionLeaning: rng.pick(['criminal', 'law', 'neutral', 'neutral']),
    motherId: opts.motherId || null, fatherId: opts.fatherId || null,
    bloodline: { demigod: !!opts.demigod },
  });
  // 3 free starting skills drawn from inclination (§17a)
  const arch = ADV.DATA.ARCHETYPE_SKILLS[inclination[0]];
  const picks = [arch.perk].concat(arch.actives.slice(0, 2));
  for (const id of picks.slice(0, 3)) ADV.SkillSys.learn(ch, id, { free: true });
  ch.freeSkillsUsed = C().FREE_STARTING_SKILLS;
  // Demigod bloodline trait sits outside slot limits (§14a)
  if (opts.demigod) ch.perks.push({ skillId: 'demigod', level: 1, uses: 0 });
  // Forbidden-art users seeded into the starting roster (request 15)
  if (opts.forbidden) {
    if (ADV.SkillSys.atCapacity(ch, 'active')) ADV.SkillSys.forget(ch, ch.actives[ch.actives.length - 1].skillId);
    ADV.SkillSys.learn(ch, opts.forbidden, { free: true });
    ch.usedForbidden = true;
  }
  return ch;
};

// Food (request): one meal at a time; the bonus rides along for the next quest.
Character.eat = function (ch, foodId) {
  const f = ADV.DATA.FOODS.find(x => x.id === foodId);
  if (!f) return { ok: false, error: 'no such food' };
  if (ch.inventory.gold < f.cost) return { ok: false, error: 'not enough gold' };
  ch.inventory.gold -= f.cost;
  ch.meal = { id: f.id, name: f.name, bonus: Object.assign({}, f.bonus) };
  const cured = ADV.Survival ? ADV.Survival.eatCures(ch) : false;
  return { ok: true, meal: ch.meal, cured: !!cured };
};
Character.digest = function (ch) { if (ch.meal) ch.meal = null; };
Character.tryAutoBuyMeal = function (ch) {
  const s = ADV.Survival ? ADV.Survival.state(ch) : (ch && ch.survival);
  const id = s && s.favoriteFoodId;
  if (!id) return { ok: false, error: 'no favorite' };
  return Character.eat(ch, id);
};

// ---- Enemy instances (§17) --------------------------------------------------
Character.makeEnemy = function (rng, typeId, opts) {
  opts = opts || {};
  const t = ADV.DATA.ENEMIES[typeId] || ADV.DATA.BOSSES[typeId];
  if (!t) throw new Error('unknown enemy type ' + typeId);
  const lvl = opts.level || rng.int(t.levels[0], t.levels[1]);
  // Nameless mooks roll the low half of their species range — same data
  // structure, same rules; they are simply not veteran adventurers. Bosses
  // and named NPCs use the full range.
  const r = C().SPECIES[t.species] || C().SPECIES.human;
  const half = (k) => rng.int(r[k][0], Math.round((r[k][0] + r[k][1]) / 2));
  const mookStats = t.boss ? Character.rollStats(rng, t.species)
    : { hp: Math.round(half('hp') * 0.75 * (t.hpMult || 1)),
        atk: Math.round(half('atk') * (t.atkMult || 1)),
        def: half('def'), spd: half('spd') };
  const ch = Character.base({
    name: t.name, sex: 'm', species: t.species,
    stats: mookStats,
    portraitSeed: ADV.hashStr(t.portrait), portraitKind: 'enemy',
    portraitId: t.portrait,
    enemyTypeId: typeId, isMonster: true, boss: !!t.boss,
    factionAlignment: t.camp === 'law' ? 'law' : t.camp === 'criminal' ? 'criminal' : 'neutral',
    organic: t.species !== 'construct' && t.organic !== false,
    armored: !!t.armored, usesOffensiveModes: !!t.usesOffensiveModes,
    perkCap: 8, activeCap: 8,
    personality: { aggression: 70, greed: 50, caution: 30, loyalty: 20, pride: 50 },
  });
  if (t.boss) { // palette shift + scale handled by UI; stats get a bump via species roll high end
    ch.stats.hp = Math.round(ch.stats.hp * 1.6);
    const pers = pickPersonality(rng, ch.sex || 'm', opts.world);
    if (pers) ch.personalityId = pers.id;
  }
  if (t.hitStatus) ch.hitStatus = t.hitStatus;
  if (t.hitStatuses) ch.hitStatuses = t.hitStatuses;
  // Tier-1 mooks (level < 10) don't carry a perk — the first two minutes
  // stay survivable (§11a); bosses always do. Perk level follows enemy level.
  for (const p of t.perks) {
    if (!t.boss && lvl < 10) break;
    ch.perks.push({ skillId: p, level: lvl, uses: lvl * C().USES_PER_LEVEL });
  }
  for (const a of t.actives) {
    ch.actives.push({ skillId: a, level: lvl, uses: lvl * C().USES_PER_LEVEL });
  }
  ch.enemyLevel = lvl;
  Character.applyEnemyLook(rng, ch, t);
  if (ADV.Difficulty) ADV.Difficulty.toughen(ch, t);   // veterans on the harder roads
  return ch;
};

// Two palette variants per type so the same kit never always wears one coat.
Character.applyEnemyLook = function (rng, ch, t) {
  const skins = (t && t.skins) || [];
  if (!skins.length) return ch;
  const skin = rng.pick(skins);
  ch.skin = skin.name;
  ch.skinTint = skin.tint;
  return ch;
};

// ---- Player creation (§20) --------------------------------------------------
Character.makePlayer = function (rng, opts) {
  const ch = Character.base({
    name: opts.name || 'Adventurer',
    sex: opts.sex,
    stats: Character.rollStats(rng, 'human'),
    portraitSeed: opts.portraitSeed, portraitKind: 'player',
    appearance: opts.appearance ? Object.assign({},opts.appearance) : null,
    portraitSlot: opts.portraitSlot,
    isPlayer: true,
    personalityId: opts.personalityId && ADV.DATA.DIALOGUE[opts.personalityId] &&
      !ADV.DATA.DIALOGUE[opts.personalityId].hidden && ADV.DATA.DIALOGUE[opts.personalityId].sex === opts.sex
      ? opts.personalityId : null,
  });
  for (const id of (opts.startingSkills || []).slice(0, 3)) {
    ADV.SkillSys.learn(ch, id, { free: true });
  }
  ch.freeSkillsUsed = C().FREE_STARTING_SKILLS;
  return ch;
};

// ---- Registry characters (§14) ----------------------------------------------
Character.makeRegistry = function (rng, regId, playerName, asNpc) {
  const def = ADV.DATA.REGISTRY[regId];
  if (!def) return null;
  const given = playerName && String(playerName).trim();
  const ch = Character.base({
    name: given || def.name, sex: def.sex,
    stats: Character.rollStats(rng, 'human'),
    portraitSeed: ADV.hashStr(def.portrait), portraitKind: 'player',
    portraitId: def.portrait,
    isPlayer: !asNpc, registryId: regId,
    personality: { aggression: 45, greed: 30, caution: 55, loyalty: 70, pride: 60 },
    archetypeInclination: ['fighter'],
    personalityId: def.personalityId,
    bloodline: { demigod: def.flags && def.flags.bloodline === 'demigod' },
  });
  // Unique-tier skills do not grow, so there is no journey to start him at the bottom of:
  // he arrives at the top of the table, which is also what the sheet should show.
  const maxLevel = C().TIER_THRESHOLDS.advanced;
  const maxUses = (maxLevel - 1) * C().USES_PER_LEVEL;
  for (const p of def.perks) ch.perks.push({ skillId: p, level: maxLevel, uses: maxUses });
  for (const a of def.actives) ch.actives.push({ skillId: a, level: maxLevel, uses: maxUses });
  // A registry character never levels, never grows and never re-gears, so the body he
  // arrives with is the body he dies with. statMult is how that body is set: it is applied
  // once, at creation, to the base stats every other character spends a career raising.
  if (def.statMult) {
    for (const k of ['hp', 'atk', 'def', 'spd']) {
      const m = def.statMult[k] != null ? def.statMult[k] : (def.statMult.all || 1);
      if (m !== 1) ch.stats[k] = Math.round((ch.stats[k] || 0) * m);
    }
  }
  ch.equipped = (def.startingGear || []).slice();
  ch.equippedSet = def.equippedSet || null;
  // He cannot learn, buy, forget or re-equip: the kit and the gear are the character.
  if (def.flags && def.flags.uniqueTier) ch.fixedKit = true;
  ch.freeSkillsUsed = C().FREE_STARTING_SKILLS;
  return ch;
};

// ---- Children (§7) ----------------------------------------------------------
// Children are simple: no relationships, no opinions, until adulthood at 10.
Character.makeDependent = function (rng, world, mother, fatherId) {
  const father = ADV.World.byId(world, fatherId);
  // Gender skew: weight births female until ~60% target met (§6)
  const adults = world.characters.filter(c => c.alive && !c.isMonster);
  const fem = adults.filter(c => c.sex === 'f').length;
  const ratio = adults.length ? fem / adults.length : 0.5;
  const sex = ratio < C().FEMALE_RATIO_TARGET ? (rng.chance(0.75) ? 'f' : 'm')
                                              : (rng.chance(0.5) ? 'f' : 'm');
  const demigod = !!((father && father.bloodline && father.bloodline.demigod && father.registryId) ||
                     (mother && mother.bloodline && mother.bloodline.demigod && mother.registryId));
  return {
    id: 'child' + rng.int(1, 1e9), age: 0, sex,
    motherId: mother ? mother.id : null, fatherId: fatherId || null,
    demigod,
    avengerOf: null, // set if father kills mother while self-sufficient (§7)
  };
};

// The legacy title (request: father-based): "Son/Daughter of <father>", with a
// stat buff derived from the father's CURRENT strength. Recomputed every
// world tick while the father lives; frozen at whatever it reached when he
// dies (the tick simply stops updating it).
Character.legacyBonus = function (father) {
  return Math.max(1, (father.rank || 1) + Math.floor(ADV.Quests.avgSkillLevel(father) / 10));
};
Character.applyLegacy = function (ch, father) {
  const b = Character.legacyBonus(father);
  ch.titleBonus = b;
  ch.bonusStats = { hp: b * 5, atk: b, def: b, spd: b };
};

// Maturation at 10 quests (§6): dependent -> full adult NPC.
Character.matureChild = function (rng, world, child, motherName) {
  const npc = Character.seedNPC(rng, world, {
    sex: child.sex, motherId: child.motherId, fatherId: child.fatherId,
    demigod: child.demigod,
  });
  // A mother's chosen name survives to adulthood (player-mothers name at birth;
  // NPC mothers' picks are the seeded roll above).
  if (child.name) {
    const taken = world.characters.some(c => c.alive && c !== npc && c.name === child.name);
    npc.name = taken ? child.name + ' II' : child.name;
  }
  // Father's legacy: title + growing stat buff (father may already be dead —
  // then the buff freezes at his final strength).
  const father = child.fatherId ? ADV.World.byId(world, child.fatherId) : null;
  if (father) {
    npc.title = (npc.sex === 'f' ? 'Daughter of ' : 'Son of ') + father.name;
    Character.applyLegacy(npc, father);
  }
  if (child.inheritSkills) {
    // Avenging child (§7): carries the murdered mother's skills at her levels.
    npc.skillLevels = Object.assign({}, child.inheritSkills);
    npc.perks = []; npc.actives = [];
    for (const [skillId, rec] of Object.entries(child.inheritSkills)) {
      if (ADV.DATA.SKILLS[skillId]?.campaignReward) continue;
      const sk = SK()[skillId];
      if (!sk || sk.unique) continue;
      const kind = sk.kind === 'perk' ? 'perk' : 'active';
      const list = kind === 'perk' ? npc.perks : npc.actives;
      const cap = kind === 'perk' ? npc.perkCap : npc.activeCap;
      if (list.length < cap) list.push({ skillId, level: rec.level, uses: rec.uses });
    }
  }
  if (child.demigod && !npc.perks.some(p => p.skillId === 'demigod')) {
    npc.perks.push({ skillId: 'demigod', level: 1, uses: 0 });
  }
  npc.matured = true;
  return npc;
};

ADV.Character = Character;
})();
