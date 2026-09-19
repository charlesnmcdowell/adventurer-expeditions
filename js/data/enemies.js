// Enemy roster (§17) — types + bosses. All loadouts draw from the
// shared 31-skill pool plus unique monster skills. Bosses reuse the
// type portrait, palette-shifted + scaled.
// camp is who they ARE: law / criminal / wild. A quest of one alignment
// never fields foes of the same camp (criminal jobs do not fight bandits;
// law jobs do not fight sentinels; neutral jobs field only beasts and monsters).
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.ENEMIES = {
  bandit: {
    id: 'bandit', name: 'Bandit', plural: 'Bandits', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['opportunist'], actives: ['backstab', 'smoke_bomb'],
    levels: [1, 16],
  },
  hedge_mage: {
    id: 'hedge_mage', name: 'Hedge Mage', plural: 'Hedge Mages', species: 'human', portrait: 'hedge_mage', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'wither_touch'],
    levels: [1, 16], hpMult: 0.6,
  },
  cutthroat: {
    id: 'cutthroat', name: 'Cutthroat', plural: 'Cutthroats', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['backstab', 'venom_fang', 'smoke_bomb'],
    levels: [6, 20],
  },
  plague_knave: {
    id: 'plague_knave', name: 'Plague Knave', plural: 'Plague Knaves', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'wither_touch', 'smoke_bomb'],
    levels: [8, 22], hpMult: 0.8,
  },
  bleed_sister: {
    id: 'bleed_sister', name: 'Bleed Sister', plural: 'Bleed Sisters', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['opportunist'], actives: ['sunder', 'backstab', 'venom_fang'],
    levels: [8, 20],
  },
  dire_wolf: {
    id: 'dire_wolf', name: 'Dire Wolf', plural: 'Dire Wolves', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['momentum'], actives: ['pack_snap'],
    levels: [1, 16], atkMult: 0.8,
  },
  cave_boar: {
    id: 'cave_boar', name: 'Cave Boar', plural: 'Cave Boars', species: 'beast', portrait: 'boar', camp: 'wild',
    perks: ['momentum'], actives: ['tusk_gore'],
    levels: [4, 18],
  },
  thorn_lurker: {
    id: 'thorn_lurker', name: 'Thorn Lurker', plural: 'Thorn Lurkers', species: 'beast', portrait: 'plant', camp: 'wild',
    perks: ['wild_form'], actives: ['thorn_lash', 'thorn_skin', 'regenerate'], healer: true,
    levels: [6, 20],
  },
  cliff_raptor: {
    id: 'cliff_raptor', name: 'Cliff Raptor', plural: 'Cliff Raptors', species: 'beast', portrait: 'raptor', camp: 'wild',
    perks: ['opportunist'], actives: ['raptor_shred', 'pack_snap'],
    levels: [8, 22], atkMult: 0.9,
  },
  town_watch: {
    id: 'town_watch', name: 'Town Watch', plural: 'Town Watch', species: 'human', portrait: 'plated_sentinel', camp: 'law',
    perks: ['arcane_focus'], actives: ['fire_bolt', 'spark'],
    levels: [1, 12],
  },
  plated_sentinel: {
    id: 'plated_sentinel', name: 'Plated Sentinel', plural: 'Plated Sentinels', species: 'construct', portrait: 'plated_sentinel', camp: 'law',
    perks: ['arcane_focus'], actives: ['frost_touch', 'spark'],
    levels: [10, 24], armored: true,
  },
  storm_bailiff: {
    id: 'storm_bailiff', name: 'Storm Bailiff', plural: 'Storm Bailiffs', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['lightning_king'], actives: ['spark', 'triage'], healer: true,
    levels: [8, 22], hpMult: 0.7,
  },
  pyre_justicar: {
    id: 'pyre_justicar', name: 'Pyre Justicar', plural: 'Pyre Justicars', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['pyromaniac'], actives: ['fire_bolt', 'ember_lash'],
    levels: [8, 22], hpMult: 0.65,
  },
  rime_justicar: {
    id: 'rime_justicar', name: 'Rime Justicar', plural: 'Rime Justicars', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['ice_queen'], actives: ['frost_touch', 'rime_grasp'],
    levels: [10, 24], hpMult: 0.7,
  },
  grave_acolyte: {
    id: 'grave_acolyte', name: 'Grave Acolyte', plural: 'Grave Acolytes', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['devoted'], actives: ['regenerate', 'necromancy', 'wither_touch'],
    healer: true, levels: [10, 20], usesOffensiveModes: true, hpMult: 0.8,
  },
  marsh_stalker: {
    id: 'marsh_stalker', name: 'Marsh Stalker', plural: 'Marsh Stalkers', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'smoke_bomb'],
    levels: [10, 24], hpMult: 0.85,
  },
  ember_cultist: {
    id: 'ember_cultist', name: 'Ember Cultist', plural: 'Ember Cultists', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['pyromaniac'], actives: ['ember_lash', 'fire_bolt'],
    levels: [10, 24], hpMult: 0.6,
  },
  frost_hag: {
    id: 'frost_hag', name: 'Frost Hag', plural: 'Frost Hags', species: 'beast', portrait: 'hag', camp: 'wild',
    perks: ['ice_queen'], actives: ['coven_rime', 'rime_grasp'],
    levels: [10, 24], hpMult: 0.7,
  },
  gravewarden: {
    id: 'gravewarden', name: 'Gravewarden', plural: 'Gravewardens', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['devoted'], actives: ['wither_touch', 'regenerate', 'venom_fang'],
    healer: true, levels: [10, 24], usesOffensiveModes: true, hpMult: 0.9,
  },
  shadow_beast: {
    id: 'shadow_beast', name: 'Shadow Beast', plural: 'Shadow Beasts', species: 'beast', portrait: 'shadow', camp: 'wild',
    perks: ['momentum'], actives: ['umbral_rake', 'thorn_skin'],
    levels: [14, 24], atkMult: 0.9,
  },
  // ---- healers in every camp (DOT_PROMPT.md §10) ----
  field_chaplain: {
    id: 'field_chaplain', name: 'Field Chaplain', plural: 'Field Chaplains', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['devoted'], actives: ['mend', 'guardian_ward', 'spark'], healer: true,
    levels: [10, 24], hpMult: 0.8, usesOffensiveModes: false,
  },
  cutpurse_leech: {
    id: 'cutpurse_leech', name: 'Cutpurse Leech', plural: 'Cutpurse Leeches', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['opportunist'], actives: ['blood_pact', 'stitch_and_run', 'backstab'], healer: true,
    levels: [10, 22], hpMult: 0.85,
  },
  moss_matron: {
    id: 'moss_matron', name: 'Moss Matron', plural: 'Moss Matrons', species: 'beast', portrait: 'plant', camp: 'wild',
    perks: ['wild_form'], actives: ['growth_field', 'regenerate', 'thorn_lash'], healer: true,
    levels: [10, 26], hpMult: 1.2,
  },
};

ADV.DATA.BOSSES = {
  bandit_king: {
    id: 'bandit_king', name: 'Bandit King', species: 'human', portrait: 'bandit', boss: true, camp: 'criminal',
    perks: ['opportunist', 'septic_sanguine'], actives: ['backstab', 'venom_fang', 'smoke_bomb', 'sunder'],
    levels: [25, 32],
    hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
  },
  archmagister: {
    id: 'archmagister', name: 'Archmagister', species: 'human', portrait: 'hedge_mage', boss: true, camp: 'law',
    perks: ['arcane_focus', 'ice_queen'], actives: ['fire_bolt', 'frost_touch', 'spark', 'rime_grasp'],
    levels: [25, 32],
    hitStatus: { kind: 'burn', power: 0.8, rounds: 2 },
  },
  alpha: {
    id: 'alpha', name: 'Alpha', species: 'beast', portrait: 'dire_wolf', boss: true, camp: 'wild',
    perks: ['momentum', 'wild_form'], actives: ['pack_snap', 'cleave', 'beast_shape', 'thorn_skin'],
    levels: [25, 32],
    hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
  },
  sentinel_prime: {
    id: 'sentinel_prime', name: 'Sentinel Prime', species: 'construct', portrait: 'plated_sentinel', boss: true, camp: 'law',
    perks: ['arcane_focus', 'ice_queen'], actives: ['frost_touch', 'spark', 'fire_bolt', 'shield_wall'],
    levels: [25, 32], armored: true,
  },
  grave_bishop: {
    id: 'grave_bishop', name: 'Grave Bishop', species: 'human', portrait: 'grave_acolyte', boss: true, camp: 'criminal',
    perks: ['devoted', 'septic_sanguine'], actives: ['regenerate', 'wither_touch', 'venom_fang', 'conscript'],
    levels: [25, 32], usesOffensiveModes: true,
    hitStatus: { kind: 'poison', power: 0.7, rounds: 3, stacks: true },
  },
};

function idsOf(book, camp) {
  return Object.keys(book).filter(id => book[id].camp === camp);
}

ADV.DATA.TIER_ENEMY_TABLE = {
  1: ['bandit', 'hedge_mage', 'dire_wolf', 'town_watch', 'cave_boar', 'cutthroat'],
  2: ['bandit', 'hedge_mage', 'dire_wolf', 'plated_sentinel', 'town_watch', 'frost_hag',
      'cutthroat', 'plague_knave', 'storm_bailiff', 'pyre_justicar', 'thorn_lurker', 'cliff_raptor',
      'field_chaplain', 'cutpurse_leech', 'moss_matron'],
  3: ['dire_wolf', 'plated_sentinel', 'grave_acolyte', 'shadow_beast', 'frost_hag',
      'bleed_sister', 'rime_justicar', 'cave_boar', 'cliff_raptor',
      'field_chaplain', 'cutpurse_leech', 'moss_matron', 'gravewarden'],
  boss: ['bandit_king', 'archmagister', 'alpha', 'sentinel_prime', 'grave_bishop'],
  debuff: ['marsh_stalker', 'plague_knave', 'frost_hag', 'gravewarden', 'ember_cultist'],
};

ADV.DATA.FACTION_ENEMIES = {
  law:      idsOf(ADV.DATA.ENEMIES, 'criminal'),
  criminal: idsOf(ADV.DATA.ENEMIES, 'law'),
  neutral:  idsOf(ADV.DATA.ENEMIES, 'wild'),
};
ADV.DATA.FACTION_BOSSES = {
  law:      idsOf(ADV.DATA.BOSSES, 'criminal'),
  criminal: idsOf(ADV.DATA.BOSSES, 'law'),
  neutral:  idsOf(ADV.DATA.BOSSES, 'wild'),
};

const LOOKS = {
  bandit: [{ name: 'Ash Hood', tint: '#4a3f30' }, { name: 'Blood Hood', tint: '#6a2a22' }],
  hedge_mage: [{ name: 'Violet Cowl', tint: '#3f3a50' }, { name: 'Ember Cowl', tint: '#6a3a28' }],
  grave_acolyte: [{ name: 'Moss Cowl', tint: '#333833' }, { name: 'Bile Cowl', tint: '#3a4a28' }],
  plated_sentinel: [{ name: 'Iron Plate', tint: '#6e7480' }, { name: 'Brass Plate', tint: '#8a7a48' }],
  dire_wolf: [{ name: 'Ash Coat', tint: '#5a5a5f' }, { name: 'Night Coat', tint: '#2a2428' }],
  plant: [{ name: 'Briar', tint: '#3a5a28' }, { name: 'Nightshade', tint: '#24381c' }],
  boar: [{ name: 'Cave Hide', tint: '#5a4634' }, { name: 'Mud Hide', tint: '#3a2e22' }],
  raptor: [{ name: 'Cliff Feather', tint: '#6a4a32' }, { name: 'Dusk Feather', tint: '#3a2a28' }],
  hag: [{ name: 'Hoarfrost', tint: '#4a6a7a' }, { name: 'Winter Veil', tint: '#2a3a4a' }],
  shadow: [{ name: 'Umbral', tint: '#1a1a22' }, { name: 'Void', tint: '#2a1a2a' }],
};
function paintLooks(book) {
  for (const t of Object.values(book)) {
    if (t.skins && t.skins.length >= 2) continue;
    t.skins = LOOKS[t.portrait] || LOOKS.bandit;
  }
}
paintLooks(ADV.DATA.ENEMIES);
paintLooks(ADV.DATA.BOSSES);
})();
