// Core constants — GDD Part II (§15, §15a, §16) plus tuning knobs flagged as
// placeholders in "Read This First". Load-bearing values are marked LB.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

// Store food (request): cheap, eaten before a quest, gone after it.
ADV.DATA.FOODS = [
  { id: 'bread',     name: 'Bread and Butter',   cost: 5,  bonus: { hp: 10 },                 blurb: 'a little more to lose' },
  { id: 'carrots',   name: 'Bunch of Carrots',   cost: 5,  bonus: { spd: 1 },                 blurb: 'quick on your feet' },
  { id: 'greens',    name: 'Bitter Greens',      cost: 6,  bonus: { def: 2 },                 blurb: 'tougher skin' },
  { id: 'stew',      name: 'Root Stew',          cost: 8,  bonus: { hp: 15, def: 1 },         blurb: 'warm and heavy' },
  { id: 'meat',      name: 'Salted Red Meat',    cost: 10, bonus: { atk: 2 },                 blurb: 'hits land harder' },
  { id: 'honeycake', name: 'Honey Cake',         cost: 12, bonus: { atk: 1, spd: 1 },         blurb: 'sweet and sharp' },
  { id: 'feast',     name: "Traveller's Feast",  cost: 15, bonus: { hp: 20, atk: 1, def: 1, spd: 1 }, blurb: 'everything, a little' },
];

ADV.DATA.CONST = {
  // ---- Slots (slice tuning, §11) -------------------------------------- LB
  PLAYER_PERK_SLOTS: 3,
  PLAYER_ACTIVE_SLOTS: 4,

  // ---- Species stat ranges (§15) -------------------------------------- LB
  SPECIES: {
    human:     { hp: [90, 110], atk: [8, 12],  def: [8, 12],  spd: [8, 12] },
    beast:     { hp: [70, 90],  atk: [12, 16], def: [4, 7],   spd: [14, 18] },
    construct: { hp: [130, 160],atk: [9, 12],  def: [16, 20], spd: [4, 6] },
  },
  UNDEAD_STAT_MULT: 1.5,
  NON_ORGANIC_IMMUNITIES: ['poison', 'bleed', 'burn'],
  NON_ORGANIC_WEAK: 1.35,
  // Ice and lightning bite steel and stone harder than a plain swing.
  ICE_LIGHTNING_INORGANIC: 1.75,

  // ---- Skill levels & tiers (§15) ------------------------------------- LB
  USES_PER_LEVEL: 10,
  TIER_THRESHOLDS: { basic: 1, intermediate: 10, advanced: 25 },
  TIER_MULT: { basic: 1.0, intermediate: 1.4, advanced: 1.8 },
  GEAR_SET_FLOOR_LEVEL: 10,
  LEVEL_DAMAGE_SCALAR: 0.015,

  // ---- Relationship scores (§15) -------------------------------------- LB
  REL: {
    MIN: -100, MAX: 100,
    HATRED_MAX: -50,       // Hatred: -100..-50
    FRIENDLY_MIN: 50,      // Friendly: +50..
  },
  // Placeholder movement values — expect to tune first.
  REL_MOVE: {
    sharedQuestWin: 8,
    sharedQuestFail: 3,
    rescueSuccess: 30,
    rescueRefused: -25,
    wageGenerous: 3,        // wage 60g+
    wageStingy: -3,         // wage below the 30g floor
    withdrawalApproved: 2,
    withdrawalRefused: -10,
    theftDiscovered: -20,
    jiltedSetTo: -100,      // the abandoned partner: set, not add
    jealousWomanToWife: -60,
    envyPerQuest: -5,       // while wealth ratio > 4x
    envyFloor: -60,
    envyDecayPerQuest: 5,   // while ratio < 2x
    envyCeiling: 0,
    propagationFactor: 0.5, // second-order, one hop
    heroInvitesRefused3: -25,
  },
  // Campaign recruiters wait for a record (request): 4 contracts done, moderate rep
  CAMPAIGN_GATE: { minQuests: 4, minRep: 4 },
  // Courtship (request 7/13): shared-quest gates and the wealth ladder
  COURT: { maleFriendlyAfter: 1, maleProposeAfter: 2, femaleFriendlyAfter: 2, wealthTop: 5, declineCooldown: 3, playerAskBy: 3 },
  ENVY_RATIO_TRIGGER: 4,
  ENVY_RATIO_DECAY: 2,

  // ---- Combat (§15a) --------------------------------------------------- LB
  BASIC_ATTACK_POWER: 2.0,
  LANES: ['front', 'mid', 'back'],
  LANE_CAP: 3,
  FIELD_CAP: 9,
  MIN_DAMAGE: 1,
  OVERHEAL_CAP_PCT: 0.5,          // temp HP caps at 50% max (Hiro: uncapped)
  POST_VICTORY_RECOVERY_PCT: 0.5, // restore 50% max HP after winning an encounter
  ARMORED_BONUS_DEF: 12,
  HEAL_MULT: 1.1,                 // healing skills +10% (request)
  BOSS_HIT_PCT: 0.12,             // every boss hit adds this share of the target's max HP (balance pass: was 0.2)
  GOD_HIT_PCT: 0.3,               // and a god's (was 0.5)
  DOT_ENEMY_MULT: 1.0,            // poison/bleed ticks dealt BY enemies TO the party (DOT_PROMPT.md §3); 1 = symmetric
  FLEE_BASE: 0.40, FLEE_PER_SPD: 0.05, FLEE_MIN: 0.10, FLEE_MAX: 0.90,
  AMBUSH_EXTRA_TURNS: 2,          // sneaking character's consecutive turns at top of round 1

  // ---- Quest tracks (§15a/§16) ----------------------------------------- LB ratios
  QUEST_TIERS: {
    1:    { soloPay: 40,  partyPay: 100, enemyLevels: [1, 9] },
    2:    { soloPay: 100, partyPay: 250, enemyLevels: [10, 17] },
    3:    { soloPay: 200, partyPay: 500, enemyLevels: [18, 24] },
    boss: { partyPay: 800, enemyLevels: [25, 32] },
    // the debuff contracts (request 14): two at 300g, two at 600g
    hazard2: { partyPay: 300, enemyLevels: [12, 18], tier: 2 },
    hazard3: { partyPay: 600, enemyLevels: [19, 24], tier: 3 },
    // named solo bounties: reputation opens the purse
    solo300: { soloPay: 300, enemyLevels: [12, 18], tier: 2, minRep: 10 },
    solo600: { soloPay: 600, enemyLevels: [18, 24], tier: 3, minRep: 15 },
  },
  // Regular solo contracts field thinner foes so a single adventurer can finish.
  SOLO_STAT_MULT: 0.5,
  // Faction-hall jobs must clear a real payroll. Tier-1 party pay is 100g and
  // locked leaders out of the Maw's first contract.
  CAMPAIGN_MIN_PAY: 500,
  SOLO_ENCOUNTERS: [2, 3],  SOLO_ENEMIES: [1, 2],
  PARTY_ENCOUNTERS: [3, 4], PARTY_ENEMIES: [3, 5],

  // ---- Economy (§16) ----------------------------------------------------
  GOLD: {
    skillUnwitnessed: 150,
    tuitionPerChildPerQuest: 20,
    hirelingWage: 30,          // starting wage; negotiated before hire
    typicalWage: 30,           // leader offer default
    wageAcceptMin: 30, wageAcceptMax: 100, // leaders still offer NPCs 30–100
    wageApplyMax: 200,         // player apply ceiling; reputation opens the range
    wageRaiseMax: 300,         // after hire, raises can climb to this
    wageRaiseStep: 10,         // default raise jump if you do not name one
    gearSet: 800,
    tutorIntermediate: 300,    // trainer lifts an active to Intermediate
    tutorAdvanced: 600,        // ... or to Advanced
    insurancePremium: 50,
    insurancePayout: 500,
    partyStartupCapital: 100,  // shown on the locked Create Party door
    startingGold: 0,
  },
  FREE_STARTING_SKILLS: 3,

  // ---- Career (§5) -------------------------------------------------------
  PARTY_MAX: 5,               // leader + 4 hired. Thralls/conscripts fill empty
  FORBIDDEN_EXTRA_SLOTS: 3,   // seats first, then these 3 extra (party can be 8)

  // ---- Children & population (§6/§7) ------------------------------------ LB
  CHILD_SELF_SUFFICIENT: 2,          // request: children grow into NPCs in 3 quests
  CHILD_ADULT: 3,
  CONCEPTION_CHANCE: 0.5,
  CONCEPTION_GUARANTEE_AT: 2,        // guaranteed within 2 quests of a romance
  MAX_CHILDREN_PER_RELATIONSHIP: 3,
  POP_START: { men: 32, women: 48 },  // 80 ordinary NPCs, 60% women; player/story cast are extra
  POP_LOW: 64, POP_HIGH: 120, POP_FLOOR: 64,
  POPULATION_VERSION: 1,             // one-time expansion of existing worlds
  FEMALE_RATIO_TARGET: 0.60,

  // ---- Forbidden skills & Divine Intervention (§3a) ---------------------- LB
  CONSCRIPT_DURATION: [3, 3, 3],     // quests, by tier (every timer caps at 3 — request 13)
  CONSCRIPT_CAP: [2, 3, 4],
  NECRO_DURATION: [0, 0, 0],         // risen last the rest of this quest only
  NECRO_CAP: [1, 2, 3],
  NECRO_STRENGTH: [1.5, 2.0, 2.6],
  CONSCRIPT_POP_ADD: 3,              // lives added, 3 quests later, mature hostile
  CONSCRIPT_POP_DELAY: 3,
  NECRO_MARK_THRESHOLD: 5,           // fifth raise marks the target
  HATRED_EDGE_THRESHOLD: 10,         // 10+ hatred edges marks the target
  DIVINE_DELAY_QUESTS: 3,            // first hero arrives 3 quests after mark (request 13)
  HERO_KILL_REPRIEVE: 3,             // killing a hero buys 3 quests
  HERO_POWER_BASE: 2.0,              // hero perk stat multiplier (first champion)
  HERO_ESCALATION: 2,                // each replacement doubles
  DIVINE_REOFFER_AFTER: 3,           // refused divine quest re-offered after 3 quests
  HERO_INVITE_WINDOW: 3,             // accept >=1 of any 3 invitations
  KO_HOSPITAL_QUESTS: 3,

  // ---- Vault (§7) --------------------------------------------------------
  WITHDRAW_ODDS: { streak3: 0.9, some: 0.5, none: 0.1 },
  SHARED_STREAK_TARGET: 3,

  // ---- Misc systems ------------------------------------------------------
  PLAYER_CONTACT_GAP: 2,          // quests that must pass between player-facing asks / rescues
  RIVAL_GRACE_QUESTS: 5,          // no rival intercepts until this many contracts are done
  RIVAL_COOLDOWN_QUESTS: 2,       // raid-free contracts after an intercept
  RIVAL_CHANCE: 0.22,             // eligible party jobs that actually draw a rival
  HIRO_RIVAL_CHANCE: 0.05,        // among intercepts, Hiro's share (else another lead, or skip)
  RESCUE_EXPIRES_IN: 2,           // world ticks before a rescue offer lapses
  ASSASSINATION_PER_RETURN: 1,    // queue rule: at most one attempt per quest return
  THEFT_REL_PENALTY: -20,
  FIRED_MIDQUEST_REP: -3, FIRED_AFTER_REP: -1,
  REP_QUEST_WIN: 2, REP_QUEST_FAIL: -2, REP_FLEE: -2,
  FACTION_SHIFT_PER_QUEST: 10,
  BAD_ACTOR_RATE: 0.01,           // 1 in 100 relationships produces a schemer

  // ---- Personality vector biases by dialogue personality (§17a) ----------
  VECTOR_BIAS: {
    // name -> partial bias {stat: [min,max]} applied over a 0-100 roll
    caution:   ['Timid', 'Nervous', 'Meek', 'Skittish', 'Watchful', 'Patient'],
    aggression:['Brash', 'Wrathful', 'Bold', 'Furious', 'Brazen', 'Sharp'],
    greed:     ['Avaricious', 'Sly', 'Grasping', 'Cunning', 'Silver-Tongued', 'Rakish'],
    loyalty:   ['Devout', 'Earnest', 'Pious', 'Sincere', 'Dutiful', 'Salted'],
    pride:     ['Haughty', 'Theatrical', 'Imperious', 'Dramatic', 'Boastful', 'Elegant', 'Commanding'],
    balanced:  ['Stoic', 'Cool', 'Steely', 'Aloof', 'Composed', 'Disciplined', 'Formal',
                'Severe', 'Grave', 'Exacting', 'Elder', 'Unquiet', 'Bereaved'],
  },

  ARCHETYPES: ['mage', 'tank', 'rogue', 'ranger', 'fighter', 'druid', 'healer'],

  // ---- Player creation portraits (§1a) -----------------------------------
  CREATION_SLOTS: [
    { slot: 1, archetype: 'tank',    read: 'Martial / tank' },
    { slot: 2, archetype: 'rogue',   read: 'Rogue / stealth' },
    { slot: 3, archetype: 'mage',    read: 'Social / caster' },
    { slot: 4, archetype: 'ranger',  read: 'Ranger / outdoors' },
    { slot: 5, archetype: 'druid',   read: 'Wildcard / druid' },
  ],
};
})();

// Healer & druid pass: what a reviver says over the one they brought back.
// Healers are warm; the green does not care. Original lines, no quoting.
ADV.DATA.REVIVE_LINES = {
  healer: [
    'Back with us. Breathe.',
    'I have you. I have you.',
    'Not today. Not while I am standing.',
    'There you are. Stay with me now.',
    'Easy. The worst of it is behind you.',
    'Open your eyes. Good. Now the other one.',
    'You are heavier than you look. Up.',
    'I was not finished with you.',
    'Lean on me until your legs remember.',
    'Welcome back. Try to keep it this time.',
    'Someone still needs you. Get up.',
    'Breathe in. That is the whole job for now.',
  ],
  druid: [
    'The ground gives back what it took.',
    'Up. The roots have you.',
    'Nothing stays down long here.',
    'The green does not ask. It grows.',
    'Sap in the veins. Stand.',
    'The soil was not ready for you.',
    'Grow. The rest is your business.',
    'Roots hold. Roots always hold.',
    'It is only weather. It passes.',
    'You fell where the seed was. Convenient.',
    'The grove keeps its own.',
    'Breathe like a tree does. Slowly.',
  ],
};
