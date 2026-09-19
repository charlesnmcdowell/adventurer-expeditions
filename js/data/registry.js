// Custom / patron character registry (§14, §14a). password -> definition.
// Adding a patron character is a data edit, not a code change.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.REGISTRY = {
  // Honor-system password, deliberately plain text (§14a).
  'hiro': {
    id: 'hiro',
    name: 'Hiro',
    sex: 'm',
    portrait: 'hiro',   // authored player portrait: purple dreads, hazel eyes, dark skin, lamellar, katana
    personalityId: 'HIRO', // his own lines (js/data/dialogue_hiro.js)
    // He has no career to grow through: no levels, no gear, no witnessed skills, and his
    // Finisher swelling is shed at the gate. Whatever he is worth, he is worth on arrival,
    // so his body is set where a titled veteran's ends up rather than where a novice starts.
    statMult: { hp: 7, atk: 2.5, def: 2.5, spd: 1.5 },
    startingGear: ['abyssal_katana', 'ronin_gear'],
    equippedSet: 'ronin',
    perks: ['demigod', 'master_swordsman', 'lone_wolf', 'rich'],
    actives: ['katana_slash', 'god_aura', 'counter_attack', 'finisher'],
    katanaSkills: ['katana_slash', 'counter_attack', 'finisher'], // Master Swordsman scope
    flags: {
      uniqueTier: true,        // never witnessable, never learnable
      excludeFromSim: false,   // when not being played he runs a party in town (request)
      excludeFromTelemetry: true,
      bloodline: 'demigod',    // every direct child inherits Demigod, and nothing else
    },
  },
};

ADV.DATA.REGISTRY_ITEMS = {
  abyssal_katana: { id: 'abyssal_katana', name: 'Abyssal Katana', slot: 'weapon', unique: true, weight: 3 },
  ronin_gear:     { id: 'ronin_gear', name: 'Ronin Gear', slot: 'armor', unique: true, weight: 5 },
};
})();
