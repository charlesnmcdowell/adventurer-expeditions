// Thirty wild mini-bosses. Each carries one unique unlearnable skill.
// Neutral contracts paying 300g or more finish on one of these.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
ADV.DATA.BOSSES = ADV.DATA.BOSSES || {};

function mb(o) {
  o.boss = true;
  o.miniboss = true;
  o.camp = o.camp || 'wild';
  o.levels = o.levels || [12, 32];
  ADV.DATA.BOSSES[o.id] = o;
  return o;
}

mb({ id: 'goblin_king', name: 'Goblin King', plural: 'Goblin Kings', species: 'beast', portrait: 'goblin',
  perks: ['opportunist'], actives: ['kings_tax', 'backstab', 'smoke_bomb'],
  hitStatus: { kind: 'bleed', power: 0.5, rounds: 3, stacks: true } });
mb({ id: 'orc_king', name: 'Orc King', plural: 'Orc Kings', species: 'beast', portrait: 'orc',
  perks: ['momentum'], actives: ['war_bellow', 'cleave', 'sunder'],
  hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'giant_raptor', name: 'Giant Raptor', plural: 'Giant Raptors', species: 'beast', portrait: 'raptor',
  perks: ['momentum'], actives: ['rending_talons', 'raptor_shred'],
  hitStatus: { kind: 'bleed', power: 0.7, rounds: 3, stacks: true }, atkMult: 1.1 });
mb({ id: 'alpha_worg', name: 'Alpha Worg', plural: 'Alpha Worgs', species: 'beast', portrait: 'dire_wolf',
  perks: ['momentum'], actives: ['pack_frenzy', 'pack_snap', 'cleave'],
  hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'cave_troll', name: 'Cave Troll', plural: 'Cave Trolls', species: 'beast', portrait: 'troll',
  perks: ['bulwark'], actives: ['boulder_smash', 'cleave', 'taunt'],
  hitStatus: { kind: 'bleed', power: 0.5, rounds: 3, stacks: true }, hpMult: 1.2 });
mb({ id: 'swamp_hydra', name: 'Swamp Hydra', plural: 'Swamp Hydras', species: 'beast', portrait: 'hydra',
  perks: ['septic_sanguine'], actives: ['tri_bite', 'venom_fang'],
  hitStatus: { kind: 'poison', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'bone_stag', name: 'Bone Stag', plural: 'Bone Stags', species: 'beast', portrait: 'stag',
  perks: ['momentum'], actives: ['antler_gore', 'sunder'],
  hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'plague_boar', name: 'Plague Boar', plural: 'Plague Boars', species: 'beast', portrait: 'boar',
  perks: ['septic_sanguine'], actives: ['mire_tusk', 'tusk_gore'],
  hitStatus: { kind: 'poison', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'frost_wyrm', name: 'Frost Wyrm', plural: 'Frost Wyrms', species: 'beast', portrait: 'wyrm',
  perks: ['ice_queen'], actives: ['rime_breath', 'coven_rime'],
  hitStatus: { kind: 'bleed', power: 0.4, rounds: 2, stacks: true } });
mb({ id: 'thunder_roc', name: 'Thunder Roc', plural: 'Thunder Rocs', species: 'beast', portrait: 'roc',
  perks: ['lightning_king'], actives: ['sky_crash', 'spark'],
  hitStatus: { kind: 'poison', power: 0.4, rounds: 2, stacks: true } });
mb({ id: 'mire_hag', name: 'Mire Hag', plural: 'Mire Hags', species: 'beast', portrait: 'hag',
  perks: ['septic_sanguine'], actives: ['bog_curse', 'wither_touch'],
  hitStatus: { kind: 'poison', power: 0.7, rounds: 3, stacks: true } });
mb({ id: 'stone_golem', name: 'Stone Golem', plural: 'Stone Golems', species: 'construct', portrait: 'golem',
  perks: ['bulwark'], actives: ['fault_line', 'sunder', 'taunt'],
  armored: true, organic: false });
mb({ id: 'night_panther', name: 'Night Panther', plural: 'Night Panthers', species: 'beast', portrait: 'panther',
  perks: ['opportunist'], actives: ['hamstring_pounce', 'backstab'],
  hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'carrion_drake', name: 'Carrion Drake', plural: 'Carrion Drakes', species: 'beast', portrait: 'drake',
  perks: ['septic_sanguine'], actives: ['rot_wing', 'umbral_rake'],
  hitStatus: { kind: 'poison', power: 0.7, rounds: 3, stacks: true } });
mb({ id: 'iron_beetle', name: 'Iron Beetle', plural: 'Iron Beetles', species: 'construct', portrait: 'beetle',
  perks: ['bulwark'], actives: ['carapace_burst', 'sunder'],
  armored: true, organic: false });
mb({ id: 'blood_ape', name: 'Blood Ape', plural: 'Blood Apes', species: 'beast', portrait: 'ape',
  perks: ['arena_champion'], actives: ['red_fury', 'cleave'],
  hitStatus: { kind: 'bleed', power: 0.7, rounds: 3, stacks: true } });
mb({ id: 'dune_scorpion', name: 'Dune Scorpion', plural: 'Dune Scorpions', species: 'beast', portrait: 'scorpion',
  perks: ['septic_sanguine'], actives: ['sand_sting', 'venom_fang'],
  hitStatus: { kind: 'poison', power: 0.8, rounds: 3, stacks: true } });
mb({ id: 'river_serpent', name: 'River Serpent', plural: 'River Serpents', species: 'beast', portrait: 'serpent',
  perks: ['septic_sanguine'], actives: ['coil_crush', 'venom_fang'],
  hitStatus: { kind: 'poison', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'ash_salamander', name: 'Ash Salamander', plural: 'Ash Salamanders', species: 'beast', portrait: 'salamander',
  perks: ['pyromaniac'], actives: ['magma_spit', 'ember_lash'],
  hitStatus: { kind: 'bleed', power: 0.4, rounds: 2, stacks: true } });
mb({ id: 'moss_giant', name: 'Moss Giant', plural: 'Moss Giants', species: 'beast', portrait: 'moss_giant',
  perks: ['bulwark', 'momentum'], actives: ['treefall', 'cleave'],
  hitStatus: { kind: 'poison', power: 0.5, rounds: 3, stacks: true }, hpMult: 1.15 });
mb({ id: 'hollow_owl', name: 'Hollow Owl', plural: 'Hollow Owls', species: 'beast', portrait: 'owl',
  perks: ['arcane_focus'], actives: ['night_screech', 'spark'],
  hitStatus: { kind: 'poison', power: 0.4, rounds: 2, stacks: true } });
mb({ id: 'brine_crab', name: 'Brine Crab', plural: 'Brine Crabs', species: 'beast', portrait: 'crab',
  perks: ['bulwark'], actives: ['pincer_lock', 'sunder'],
  armored: true, hitStatus: { kind: 'bleed', power: 0.5, rounds: 3, stacks: true } });
mb({ id: 'grave_hound', name: 'Grave Hound', plural: 'Grave Hounds', species: 'beast', portrait: 'hound',
  perks: ['devoted'], actives: ['soul_bay', 'pack_snap'],
  hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'crystal_spider', name: 'Crystal Spider', plural: 'Crystal Spiders', species: 'beast', portrait: 'spider',
  perks: ['ice_queen'], actives: ['glass_web', 'coven_rime'],
  hitStatus: { kind: 'poison', power: 0.5, rounds: 3, stacks: true } });
mb({ id: 'ember_boar', name: 'Ember Boar', plural: 'Ember Boars', species: 'beast', portrait: 'boar',
  perks: ['pyromaniac', 'momentum'], actives: ['cinder_charge', 'tusk_gore'],
  hitStatus: { kind: 'bleed', power: 0.5, rounds: 3, stacks: true } });
mb({ id: 'storm_elk', name: 'Storm Elk', plural: 'Storm Elks', species: 'beast', portrait: 'stag',
  perks: ['lightning_king'], actives: ['antler_arc', 'antler_gore'],
  hitStatus: { kind: 'bleed', power: 0.5, rounds: 3, stacks: true } });
mb({ id: 'maw_toad', name: 'Maw Toad', plural: 'Maw Toads', species: 'beast', portrait: 'toad',
  perks: ['septic_sanguine'], actives: ['tongue_lash', 'venom_fang'],
  hitStatus: { kind: 'poison', power: 0.7, rounds: 3, stacks: true } });
mb({ id: 'shard_wolf', name: 'Shard Wolf', plural: 'Shard Wolves', species: 'beast', portrait: 'dire_wolf',
  perks: ['ice_queen', 'momentum'], actives: ['frost_bite', 'pack_snap'],
  hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true } });
mb({ id: 'king_vulture', name: 'King Vulture', plural: 'King Vultures', species: 'beast', portrait: 'vulture',
  perks: ['opportunist'], actives: ['sky_pluck', 'umbral_rake'],
  hitStatus: { kind: 'bleed', power: 0.7, rounds: 3, stacks: true } });
mb({ id: 'basilisk_queen', name: 'Basilisk Queen', plural: 'Basilisk Queens', species: 'beast', portrait: 'basilisk',
  perks: ['ice_queen'], actives: ['stone_gaze', 'coven_rime'],
  hitStatus: { kind: 'poison', power: 0.6, rounds: 3, stacks: true } });

ADV.DATA.MINIBOSSES = {};
for (const [id, e] of Object.entries(ADV.DATA.BOSSES)) {
  if (e.miniboss) ADV.DATA.MINIBOSSES[id] = e;
}

function idsOf(book, camp) {
  return Object.keys(book).filter(id => book[id].camp === camp);
}
ADV.DATA.FACTION_BOSSES = {
  law:      idsOf(ADV.DATA.BOSSES, 'criminal'),
  criminal: idsOf(ADV.DATA.BOSSES, 'law'),
  neutral:  idsOf(ADV.DATA.BOSSES, 'wild'),
};

// Phonetic monster speech — no human sentences. Audio lives at
// audio/vo/campaign/{id}/roar_{n}.mp3
ADV.DATA.MONSTER_VO = {
  goblin_king: { voice: 'lSk9QZgq8Wf8UiI59dkY', roar: [
    { t: 'Gak-hak! Gak! Shiv-shiv, shiny-man!' },
    { t: 'Hak! Kruk-kruk! Mine, mine, MINE!' },
  ]},
  orc_king: { voice: 'kGnGmC6phJfxVxpsVJBK', roar: [
    { t: 'GRAH! Smash! Break you! WAAAGH!' },
    { t: 'URR! Weak meat! Crush! Crush!' },
  ]},
  giant_raptor: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'KREEE-AAAH! Rrrakh! Ss-ss-SNAP!' },
    { t: 'Rrrhhh! Skreee! Grrrah!' },
  ]},
  alpha_worg: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'AWOOOOO! Grrrr-RAH! Huff-huff!' },
    { t: 'Grrrr! Aroo-aroo! SNARL!' },
  ]},
  cave_troll: { voice: 'Del3Q8TuqOnlq9kt9k1K', roar: [
    { t: 'Urrngh... smash... UNGH!' },
    { t: 'Hrrrn. Rock. Break. HRAH!' },
  ]},
  swamp_hydra: { voice: 'teIrdZ10Mls3JVTLoO5K', roar: [
    { t: 'Sss-RAAH! Hisss! Gulk-gulk!' },
    { t: 'Ssssss! Three mouths! Sss-SNAP!' },
  ]},
  bone_stag: { voice: 'JnvYtXOYfQKiGqHpeAqA', roar: [
    { t: 'Hrrronk! Clack-clack! GROAR!' },
    { t: 'Brrraaah! Antler-crack! Hrrn!' },
  ]},
  plague_boar: { voice: 'wq7gzRwr4hAggpoYZh2Q', roar: [
    { t: 'HROOINK! Snrk-snrk! GRAH!' },
    { t: 'Weee-HRAA! Squelch! Grrnk!' },
  ]},
  frost_wyrm: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'Sss-krrr... Fffroooost... HRAAH!' },
    { t: 'Krrraaaooo! Ice-hiss! GRRAH!' },
  ]},
  thunder_roc: { voice: 'GafoPURpq5ta99iwARDD', roar: [
    { t: 'KREEE-CRACK! Skreee! BOOM-hiss!' },
    { t: 'AAAK! Thunder-screech! KRAA!' },
  ]},
  mire_hag: { voice: '2YPQufBsJCBEyLEsf7uM', roar: [
    { t: 'Hee-hee-guk! Bog-meat! Sss!' },
    { t: 'Krrr-hee! Sink, sink! Gak!' },
  ]},
  stone_golem: { voice: 'oM47A6KO9YL2BjifElrE', roar: [
    { t: 'Grrrnnn... stone... CRACK...' },
    { t: 'Hrrrm. Grind. BREAK.' },
  ]},
  night_panther: { voice: 'D0eTTmB4hP44DmV2tHyw', roar: [
    { t: 'Mrrrowl... Grrrr... HSSST!' },
    { t: 'Rrragh! Prrrr-SNAP! Grr!' },
  ]},
  carrion_drake: { voice: 'OnR1Pr3JZXsij6Rz1POT', roar: [
    { t: 'Kraaaah! Rot-screech! Gulk!' },
    { t: 'Sss-kraa! Wing-hiss! GRAH!' },
  ]},
  iron_beetle: { voice: 'XTLPrXXVrKner0uxnIO3', roar: [
    { t: 'Tik-tik-tik... KRACK! Chitter!' },
    { t: 'Vrrrk! Click-click! CLANG!' },
  ]},
  blood_ape: { voice: 'kGnGmC6phJfxVxpsVJBK', roar: [
    { t: 'HOO-HOO-HRAAH! Beat-chest! GRAH!' },
    { t: 'WRAA! Blood! HOO-HOO!' },
  ]},
  dune_scorpion: { voice: 'lSk9QZgq8Wf8UiI59dkY', roar: [
    { t: 'Kssst! Click-clack! STING!' },
    { t: 'Ssskrr! Tail-whip! Kss!' },
  ]},
  river_serpent: { voice: 'teIrdZ10Mls3JVTLoO5K', roar: [
    { t: 'Sssssss... coil... SNAP!' },
    { t: 'Hisss-RAH! Water-crush! Sss!' },
  ]},
  ash_salamander: { voice: 'SSbI5MLzwCynqXtCQxwu', roar: [
    { t: 'Hssss-FWOOM! Grrnk! Fire!' },
    { t: 'Rrrak! Spit-hiss! HRAH!' },
  ]},
  moss_giant: { voice: 'Del3Q8TuqOnlq9kt9k1K', roar: [
    { t: 'Hrrroooom... tree... FALL...' },
    { t: 'Ungh. Moss. CRUSH. Hrrn.' },
  ]},
  hollow_owl: { voice: 'nNZgymboqbJoSDao9hfC', roar: [
    { t: 'Hoo-HOO! Shreee! Hoo-hoo-GRAK!' },
    { t: 'Who-who-KREE! Hollow! Hss!' },
  ]},
  brine_crab: { voice: 'wq7gzRwr4hAggpoYZh2Q', roar: [
    { t: 'Click-CLACK! Snap! Hrrnk!' },
    { t: 'Krrk! Pincer! CLACK-CLACK!' },
  ]},
  grave_hound: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'Awoo-ooo... Grrrr... BAY!' },
    { t: 'Rrrrah! Grave-howl! SNARL!' },
  ]},
  crystal_spider: { voice: 't9puW54s29EO0gQK6OMR', roar: [
    { t: 'Tik-tik-tink... Skree! Glass!' },
    { t: 'Chitter-chitter! TINK! Hss!' },
  ]},
  ember_boar: { voice: 'SSbI5MLzwCynqXtCQxwu', roar: [
    { t: 'HROOINK-FSS! Cinder! GRAH!' },
    { t: 'Snrk! Burn-tusk! HRAA!' },
  ]},
  storm_elk: { voice: 'GafoPURpq5ta99iwARDD', roar: [
    { t: 'Brrraaah-CRACK! Bugle! BOOM!' },
    { t: 'Hrrronk! Spark-antler! KRAA!' },
  ]},
  maw_toad: { voice: 'teIrdZ10Mls3JVTLoO5K', roar: [
    { t: 'BLOOARP! Gulk-gulk! SNAP!' },
    { t: 'Rrribbit-GRAH! Tongue! Gulk!' },
  ]},
  shard_wolf: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'AWOOO-kss! Ice-howl! GRRAH!' },
    { t: 'Grrrr! Shard-snap! Aroo!' },
  ]},
  king_vulture: { voice: 'OnR1Pr3JZXsij6Rz1POT', roar: [
    { t: 'Kraaaah! Pick-pick! SCREE!' },
    { t: 'AAAK! Sky-pluck! Kraa-kraa!' },
  ]},
  basilisk_queen: { voice: 'D0eTTmB4hP44DmV2tHyw', roar: [
    { t: 'Sssssss... stare... STONE...' },
    { t: 'Hisss-RAH! Gaze! Sss-freeze!' },
  ]},
  dire_wolf: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'Grrrr... Awooo!' },
    { t: 'Rrragh! Huff-huff! SNAP!' },
  ]},
  shadow_beast: { voice: 'D0eTTmB4hP44DmV2tHyw', roar: [
    { t: 'Mrrrr... Hssst... Grrrah!' },
    { t: 'Urrngh! Shadow-growl!' },
  ]},
  cave_boar: { voice: 'wq7gzRwr4hAggpoYZh2Q', roar: [
    { t: 'Hrooink! Snrk!' },
    { t: 'Weee-HRAA! Gore!' },
  ]},
  thorn_lurker: { voice: 'teIrdZ10Mls3JVTLoO5K', roar: [
    { t: 'Sss-krrrk... thorn...' },
    { t: 'Hisss! Lash!' },
  ]},
  cliff_raptor: { voice: 'HMvHZWb0ZWSo5Kc5l22D', roar: [
    { t: 'Kreee! Skree!' },
    { t: 'Rrrakh! SNAP!' },
  ]},
  frost_hag: { voice: '2YPQufBsJCBEyLEsf7uM', roar: [
    { t: 'Krrr-hee! Cold-meat!' },
    { t: 'Sss-ice! Hee-guk!' },
  ]},
};

const MORE_LOOKS = {
  goblin: [{ name: 'Soot', tint: '#3a4a28' }, { name: 'Bog', tint: '#2a3a1c' }],
  orc: [{ name: 'War Paint', tint: '#3a4a2a' }, { name: 'Ash Hide', tint: '#4a3a28' }],
  troll: [{ name: 'Cave Moss', tint: '#4a5a3a' }, { name: 'Stone Hide', tint: '#5a5248' }],
  hydra: [{ name: 'Mire', tint: '#2a4a38' }, { name: 'Bile', tint: '#3a5a28' }],
  stag: [{ name: 'Bone', tint: '#c8b89a' }, { name: 'Storm', tint: '#3a4a5a' }],
  wyrm: [{ name: 'Rime', tint: '#6a8aaa' }, { name: 'Glacier', tint: '#3a5a6a' }],
  roc: [{ name: 'Thunder', tint: '#4a4a3a' }, { name: 'Stormwing', tint: '#3a3a52' }],
  hag: [{ name: 'Hoarfrost', tint: '#4a6a7a' }, { name: 'Bog Veil', tint: '#2a4a3a' }],
  golem: [{ name: 'Granite', tint: '#6a6860' }, { name: 'Basalt', tint: '#3a3a38' }],
  panther: [{ name: 'Night', tint: '#1a1a1c' }, { name: 'Dusk', tint: '#2a2228' }],
  drake: [{ name: 'Carrion', tint: '#4a3a2a' }, { name: 'Rotwing', tint: '#3a4a28' }],
  beetle: [{ name: 'Iron', tint: '#5a5a58' }, { name: 'Bronze', tint: '#8a6a3a' }],
  ape: [{ name: 'Blood', tint: '#6a2a22' }, { name: 'Rust', tint: '#5a3a28' }],
  scorpion: [{ name: 'Dune', tint: '#8a6a3a' }, { name: 'Ash Sand', tint: '#6a5430' }],
  serpent: [{ name: 'River', tint: '#2a4a48' }, { name: 'Reed', tint: '#3a5a3a' }],
  salamander: [{ name: 'Ash', tint: '#7a3a1a' }, { name: 'Cinder', tint: '#5a2a18' }],
  moss_giant: [{ name: 'Canopy', tint: '#3a5a2a' }, { name: 'Deep Moss', tint: '#24381c' }],
  owl: [{ name: 'Hollow', tint: '#4a3a2a' }, { name: 'Moon', tint: '#5a5040' }],
  crab: [{ name: 'Brine', tint: '#8a4a3a' }, { name: 'Tide', tint: '#6a3a32' }],
  hound: [{ name: 'Grave', tint: '#3a3a32' }, { name: 'Ash Bone', tint: '#5a5a4a' }],
  spider: [{ name: 'Crystal', tint: '#7a9aaa' }, { name: 'Glass', tint: '#4a6a7a' }],
  boar: [{ name: 'Cave Hide', tint: '#5a4634' }, { name: 'Ember Hide', tint: '#6a3a22' }],
  toad: [{ name: 'Maw', tint: '#3a5a2a' }, { name: 'Mire', tint: '#2a3a28' }],
  vulture: [{ name: 'King', tint: '#5a3a28' }, { name: 'Carrion', tint: '#3a2a22' }],
  basilisk: [{ name: 'Stone Scale', tint: '#5a6a4a' }, { name: 'Jade', tint: '#3a5a3a' }],
  raptor: [{ name: 'Cliff Feather', tint: '#6a4a32' }, { name: 'Dusk Feather', tint: '#3a2a28' }],
  dire_wolf: [{ name: 'Ash Coat', tint: '#5a5a5f' }, { name: 'Night Coat', tint: '#2a2428' }],
};
for (const t of Object.values(ADV.DATA.BOSSES)) {
  if (t.skins && t.skins.length >= 2) continue;
  t.skins = MORE_LOOKS[t.portrait] || MORE_LOOKS.dire_wolf;
}
})();
