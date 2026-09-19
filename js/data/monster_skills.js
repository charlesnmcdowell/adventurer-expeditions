// Unlearnable monster and mini-boss skills. unique:true is never witnessed
// and never sold. Combat reads the same field vocabulary as skills.js.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const S = ADV.DATA.SKILLS;

function def(o) {
  o.unique = true;
  o.monster = true;
  S[o.id] = o;
}

function tiers(b, i, a, ob, oi, oa) {
  return {
    basic: Object.assign({ name: b }, ob || {}),
    intermediate: Object.assign({ name: i }, oi || {}),
    advanced: Object.assign({ name: a }, oa || {}),
  };
}

// ---- trash / escort uniques (wild) ----
def({ id: 'pack_snap', name: 'Pack Snap', kind: 'active', archetype: 'fighter',
  power: 2.4, reach: 'front', target: 'enemy', melee: true,
  desc: "A wolf's tearing bite. Leaves a stacking bleed.",
  tiers: tiers('Pack Snap', 'Pack Rake', 'Pack Maul',
    { status: { bleed: { power: 0.7, rounds: 3, stacks: true } } },
    { status: { bleed: { power: 0.9, rounds: 3, stacks: true } } },
    { status: { bleed: { power: 1.1, rounds: 4, stacks: true } }, pull: 1 }) });

def({ id: 'umbral_rake', name: 'Umbral Rake', kind: 'active', archetype: 'rogue',
  power: 2.2, reach: 'front', target: 'enemy', melee: true,
  desc: 'Shadow-claws that sour the wound. Heal-cut and poison.',
  tiers: tiers('Umbral Rake', 'Umbral Rend', 'Umbral Maw',
    { healcutRounds: 2, status: { poison: { power: 0.6, rounds: 3, stacks: true } } },
    { healcutRounds: 3, status: { poison: { power: 0.8, rounds: 3, stacks: true } } },
    { healcutRounds: 4, status: { poison: { power: 1.0, rounds: 4, stacks: true } } }) });

def({ id: 'tusk_gore', name: 'Tusk Gore', kind: 'active', archetype: 'fighter',
  power: 2.6, reach: 'front', target: 'enemy', melee: true,
  desc: "A boar's charge. Pulls the target and opens a bleed.",
  tiers: tiers('Tusk Gore', 'Tusk Drive', 'Tusk Ruin',
    { pull: 1, status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    { pull: 1, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { pull: 2, status: { bleed: { power: 1.0, rounds: 4, stacks: true } }, defStrip: 8 }) });

def({ id: 'thorn_lash', name: 'Thorn Lash', kind: 'active', archetype: 'druid',
  power: 2.0, reach: 'front', target: 'enemy', melee: true,
  desc: 'Living briar. Roots and poisons.',
  tiers: tiers('Thorn Lash', 'Thorn Bind', 'Thorn Cage',
    { rootRounds: 1, status: { poison: { power: 0.5, rounds: 3, stacks: true } } },
    { rootRounds: 2, status: { poison: { power: 0.7, rounds: 3, stacks: true } } },
    { rootRounds: 2, status: { poison: { power: 0.9, rounds: 4, stacks: true } } }) });

def({ id: 'coven_rime', name: 'Coven Rime', kind: 'active', archetype: 'mage',
  elemental: true, element: 'ice', power: 2.2, reach: 'any', target: 'enemy',
  desc: "A monster's winter. Freezes and delays.",
  tiers: tiers('Coven Rime', 'Coven Hoar', 'Coven Blizzard',
    { freeze: 1 }, { freeze: 1, delayTarget: true }, { freeze: 2, multiTarget: 2 }) });

def({ id: 'raptor_shred', name: 'Raptor Shred', kind: 'active', archetype: 'fighter',
  power: 2.5, reach: 'front', target: 'enemy', melee: true,
  desc: 'Talons that strip hide. Bleed and exposed.',
  tiers: tiers('Raptor Shred', 'Raptor Flurry', 'Raptor Frenzy',
    { status: { bleed: { power: 0.7, rounds: 3, stacks: true } }, exposedOnSecond: 1 },
    { hits: 2, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { hits: 2, status: { bleed: { power: 1.0, rounds: 4, stacks: true } }, executeBelow: 0.15 }) });

// ---- 30 mini-boss uniques ----
def({ id: 'kings_tax', name: "King's Tax", kind: 'active',
  power: 2.4, reach: 'front', target: 'enemy', melee: true,
  desc: 'The goblin king takes a cut — bleed and a stolen buff.',
  tiers: tiers("King's Tax", "King's Due", "King's Tithe",
    { stealBuff: true, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { stealBuff: true, status: { bleed: { power: 1.0, rounds: 3, stacks: true } } },
    { stealBuff: true, status: { bleed: { power: 1.2, rounds: 4, stacks: true } }, pull: 1 }) });

def({ id: 'war_bellow', name: 'War Bellow', kind: 'active',
  power: 2.8, reach: 'front', target: 'enemy', melee: true,
  desc: 'An orc king\'s roar. Shocks the target and steels the caster.',
  tiers: tiers('War Bellow', 'War Howl', 'War Thunder',
    { shock: 0.15, shockRounds: 3, selfStatus: { kind: 'atkBuff', mult: 1.15, rounds: 3 } },
    { shock: 0.2, shockRounds: 3, selfStatus: { kind: 'atkBuff', mult: 1.2, rounds: 3 } },
    { shock: 0.25, shockRounds: 3, selfStatus: { kind: 'atkBuff', mult: 1.25, rounds: 4 } }) });

def({ id: 'rending_talons', name: 'Rending Talons', kind: 'active',
  power: 3.0, reach: 'front', target: 'enemy', melee: true,
  desc: 'A giant raptor\'s kill-stroke. Pulls and stacks bleed.',
  tiers: tiers('Rending Talons', 'Rending Hook', 'Rending Ruin',
    { pull: 1, status: { bleed: { power: 0.9, rounds: 3, stacks: true } } },
    { pull: 1, status: { bleed: { power: 1.1, rounds: 3, stacks: true } } },
    { pull: 2, status: { bleed: { power: 1.3, rounds: 4, stacks: true } }, executeBelow: 0.18 }) });

def({ id: 'pack_frenzy', name: 'Pack Frenzy', kind: 'active',
  power: 2.6, reach: 'front', target: 'enemy', melee: true,
  desc: 'The worg alpha drives the hunt. Bleed and a self frenzy.',
  tiers: tiers('Pack Frenzy', 'Pack Fury', 'Pack Slaughter',
    { status: { bleed: { power: 0.8, rounds: 3, stacks: true } }, selfStatus: { kind: 'atkBuff', mult: 1.15, rounds: 2 } },
    { status: { bleed: { power: 1.0, rounds: 3, stacks: true } }, selfStatus: { kind: 'atkBuff', mult: 1.2, rounds: 3 } },
    { status: { bleed: { power: 1.2, rounds: 4, stacks: true } }, selfStatus: { kind: 'atkBuff', mult: 1.25, rounds: 3 } }) });

def({ id: 'boulder_smash', name: 'Boulder Smash', kind: 'active',
  power: 3.2, reach: 'front', target: 'enemy', melee: true,
  desc: 'A troll\'s thrown stone. Strips armor and steals the next action.',
  tiers: tiers('Boulder Smash', 'Boulder Crash', 'Boulder Ruin',
    { defStrip: 10, loseAction: true },
    { defStrip: 14, loseAction: true, delayTarget: true },
    { defStripAll: true, loseAction: true }) });

def({ id: 'tri_bite', name: 'Tri-Bite', kind: 'active',
  power: 1.8, reach: 'front', target: 'enemy', melee: true, multiTarget: 3,
  desc: 'Three heads, three poisons.',
  tiers: tiers('Tri-Bite', 'Tri-Venom', 'Tri-Plague',
    { status: { poison: { power: 0.7, rounds: 3, stacks: true } } },
    { status: { poison: { power: 0.9, rounds: 3, stacks: true } } },
    { status: { poison: { power: 1.1, rounds: 4, stacks: true } }, withering: 3 }) });

def({ id: 'antler_gore', name: 'Antler Gore', kind: 'active',
  power: 2.8, reach: 'front', target: 'enemy', melee: true, pierceBehind: true,
  desc: 'Bone antlers punch through the line and leave a bleed.',
  tiers: tiers('Antler Gore', 'Antler Drive', 'Antler Impale',
    { status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { status: { bleed: { power: 1.0, rounds: 3, stacks: true } } },
    { status: { bleed: { power: 1.2, rounds: 4, stacks: true } }, defStrip: 10 }) });

def({ id: 'mire_tusk', name: 'Mire Tusk', kind: 'active',
  power: 2.5, reach: 'front', target: 'enemy', melee: true,
  desc: 'A plague boar\'s filth. Poison and heal-cut.',
  tiers: tiers('Mire Tusk', 'Mire Hook', 'Mire Ruin',
    { healcutRounds: 2, status: { poison: { power: 0.7, rounds: 3, stacks: true } } },
    { healcutRounds: 3, status: { poison: { power: 0.9, rounds: 3, stacks: true } } },
    { healcutRounds: 4, status: { poison: { power: 1.1, rounds: 4, stacks: true } } }) });

def({ id: 'rime_breath', name: 'Rime Breath', kind: 'active',
  elemental: true, element: 'ice', power: 2.4, reach: 'any', target: 'enemy',
  desc: 'A frost wyrm\'s exhale. Freezes the row.',
  tiers: tiers('Rime Breath', 'Rime Gale', 'Rime Storm',
    { freeze: 1 }, { freeze: 1, target: 'enemyLane' }, { freeze: 2, target: 'enemyLane' }) });

def({ id: 'sky_crash', name: 'Sky Crash', kind: 'active',
  elemental: true, element: 'lightning', power: 2.6, reach: 'any', target: 'enemy',
  desc: 'A thunder roc drops the storm. Shock that lingers.',
  tiers: tiers('Sky Crash', 'Sky Bolt', 'Sky Judgment',
    { shock: 0.15, shockRounds: 3 },
    { shock: 0.2, shockRounds: 3, multiTarget: 2 },
    { shock: 0.25, shockRounds: 3, target: 'allEnemies', power: 1.8 }) });

def({ id: 'bog_curse', name: 'Bog Curse', kind: 'active',
  power: 2.0, reach: 'any', target: 'enemy',
  desc: 'A mire hag\'s rot. Wither and poison.',
  tiers: tiers('Bog Curse', 'Bog Hex', 'Bog Doom',
    { withering: 3, status: { poison: { power: 0.7, rounds: 3, stacks: true } } },
    { withering: 4, status: { poison: { power: 0.9, rounds: 3, stacks: true } } },
    { withering: 5, status: { poison: { power: 1.1, rounds: 4, stacks: true } }, healcutRounds: 3 }) });

def({ id: 'fault_line', name: 'Fault Line', kind: 'active',
  power: 2.8, reach: 'front', target: 'enemy', melee: true,
  desc: 'A stone golem splits the ground. Root and armor break.',
  tiers: tiers('Fault Line', 'Fault Crack', 'Fault Collapse',
    { rootRounds: 2, defStrip: 12 },
    { rootRounds: 2, defStrip: 16 },
    { rootRounds: 3, defStripAll: true }) });

def({ id: 'hamstring_pounce', name: 'Hamstring Pounce', kind: 'active',
  power: 2.7, reach: 'front', target: 'enemy', melee: true,
  desc: 'A night panther\'s cripple. Root and bleed.',
  tiers: tiers('Hamstring Pounce', 'Hamstring Tear', 'Hamstring Kill',
    { rootRounds: 2, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { rootRounds: 2, status: { bleed: { power: 1.0, rounds: 3, stacks: true } } },
    { rootRounds: 3, status: { bleed: { power: 1.2, rounds: 4, stacks: true } }, executeBelow: 0.16 }) });

def({ id: 'rot_wing', name: 'Rot Wing', kind: 'active',
  power: 2.3, reach: 'any', target: 'enemy',
  desc: 'A carrion drake\'s beat. Poison and heal-cut across the lane.',
  tiers: tiers('Rot Wing', 'Rot Gust', 'Rot Storm',
    { healcutRounds: 2, status: { poison: { power: 0.7, rounds: 3, stacks: true } } },
    { healcutRounds: 3, target: 'enemyLane', status: { poison: { power: 0.8, rounds: 3, stacks: true } } },
    { healcutRounds: 4, target: 'enemyLane', status: { poison: { power: 1.0, rounds: 4, stacks: true } } }) });

def({ id: 'carapace_burst', name: 'Carapace Burst', kind: 'active',
  power: 2.2, reach: 'front', target: 'enemy', melee: true,
  desc: 'An iron beetle detonates its shell. Shock and thorns on the caster.',
  tiers: tiers('Carapace Burst', 'Carapace Crack', 'Carapace Detonate',
    { shock: 0.15, shockRounds: 2, thornPct: 0.3, rounds: 2 },
    { shock: 0.2, shockRounds: 3, thornPct: 0.4, rounds: 3 },
    { shock: 0.25, shockRounds: 3, thornPct: 0.5, rounds: 3 }) });

def({ id: 'red_fury', name: 'Red Fury', kind: 'active',
  power: 2.6, reach: 'front', target: 'enemy', melee: true, lifeSteal: 0.25,
  desc: 'A blood ape drinks the swing. Lifesteal and bleed.',
  tiers: tiers('Red Fury', 'Red Rage', 'Red Feast',
    { status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { lifeSteal: 0.35, status: { bleed: { power: 1.0, rounds: 3, stacks: true } } },
    { lifeSteal: 0.45, status: { bleed: { power: 1.2, rounds: 4, stacks: true } } }) });

def({ id: 'sand_sting', name: 'Sand Sting', kind: 'active',
  power: 2.1, reach: 'front', target: 'enemy', melee: true,
  desc: 'A dune scorpion\'s tail. Poison and a late turn.',
  tiers: tiers('Sand Sting', 'Sand Lance', 'Sand Doom',
    { delayTarget: true, status: { poison: { power: 0.8, rounds: 3, stacks: true } } },
    { delayTarget: true, status: { poison: { power: 1.0, rounds: 3, stacks: true } } },
    { delayTarget: true, loseAction: true, status: { poison: { power: 1.2, rounds: 4, stacks: true } } }) });

def({ id: 'coil_crush', name: 'Coil Crush', kind: 'active',
  power: 2.6, reach: 'front', target: 'enemy', melee: true,
  desc: 'A river serpent wraps the prey. Root and a stolen action.',
  tiers: tiers('Coil Crush', 'Coil Bind', 'Coil Suffocate',
    { rootRounds: 2, loseAction: true },
    { rootRounds: 3, loseAction: true },
    { rootRounds: 3, loseAction: true, status: { poison: { power: 0.8, rounds: 3, stacks: true } } }) });

def({ id: 'magma_spit', name: 'Magma Spit', kind: 'active',
  elemental: true, element: 'fire', power: 2.4, reach: 'any', target: 'enemy',
  desc: 'An ash salamander\'s spit. A burn that will not go out.',
  tiers: tiers('Magma Spit', 'Magma Spray', 'Magma Flood',
    { status: { burn: { power: 1.2, rounds: 3 } } },
    { status: { burn: { power: 1.5, rounds: 3 } }, adjacent: 1 },
    { status: { burn: { power: 1.8, rounds: 4 } }, target: 'enemyLane' }) });

def({ id: 'treefall', name: 'Treefall', kind: 'active',
  power: 2.4, reach: 'front', target: 'enemy', melee: true, spreadLanes: true,
  desc: 'A moss giant drops the canopy. Delays everyone it hits.',
  tiers: tiers('Treefall', 'Grove Fall', 'Forest Fall',
    { delayTarget: true }, { delayTarget: true, defStrip: 8 }, { delayTarget: true, loseAction: true }) });

def({ id: 'night_screech', name: 'Night Screech', kind: 'active',
  power: 1.8, reach: 'any', target: 'enemy',
  desc: 'A hollow owl\'s cry. Seals skills and shocks.',
  tiers: tiers('Night Screech', 'Night Wail', 'Night Silence',
    { shock: 0.1, shockRounds: 2, seal: ['basic'], sealRounds: 2 },
    { shock: 0.15, shockRounds: 3, seal: ['basic', 'intermediate'], sealRounds: 2 },
    { shock: 0.2, shockRounds: 3, seal: ['basic', 'intermediate'], sealRounds: 3, silence: 2 }) });

def({ id: 'pincer_lock', name: 'Pincer Lock', kind: 'active',
  power: 2.5, reach: 'front', target: 'enemy', melee: true,
  desc: 'A brine crab\'s clamp. Root and armor crack.',
  tiers: tiers('Pincer Lock', 'Pincer Crush', 'Pincer Ruin',
    { rootRounds: 2, defStrip: 10 },
    { rootRounds: 2, defStrip: 14 },
    { rootRounds: 3, defStrip: 18, loseAction: true }) });

def({ id: 'soul_bay', name: 'Soul Bay', kind: 'active',
  power: 2.3, reach: 'any', target: 'enemy',
  desc: 'A grave hound\'s call. Heal-cut and bleed.',
  tiers: tiers('Soul Bay', 'Soul Howl', 'Soul Knell',
    { healcutRounds: 2, status: { bleed: { power: 0.7, rounds: 3, stacks: true } } },
    { healcutRounds: 3, status: { bleed: { power: 0.9, rounds: 3, stacks: true } } },
    { healcutRounds: 4, status: { bleed: { power: 1.1, rounds: 4, stacks: true } }, withering: 3 }) });

def({ id: 'glass_web', name: 'Glass Web', kind: 'active',
  elemental: true, element: 'ice', power: 2.0, reach: 'any', target: 'enemy',
  desc: 'A crystal spider\'s silk. Root and frost.',
  tiers: tiers('Glass Web', 'Glass Snare', 'Glass Tomb',
    { rootRounds: 2, freeze: 1 },
    { rootRounds: 2, freeze: 1, delayTarget: true },
    { rootRounds: 3, freeze: 2 }) });

def({ id: 'cinder_charge', name: 'Cinder Charge', kind: 'active',
  elemental: true, element: 'fire', power: 2.6, reach: 'front', target: 'enemy', melee: true,
  desc: 'An ember boar\'s rush. Burn and a pull.',
  tiers: tiers('Cinder Charge', 'Cinder Rush', 'Cinder Ruin',
    { pull: 1, status: { burn: { power: 1.1, rounds: 3 } } },
    { pull: 1, status: { burn: { power: 1.4, rounds: 3 } } },
    { pull: 2, status: { burn: { power: 1.7, rounds: 4 } } }) });

def({ id: 'antler_arc', name: 'Antler Arc', kind: 'active',
  elemental: true, element: 'lightning', power: 2.5, reach: 'any', target: 'enemy',
  desc: 'A storm elk\'s rack. Lightning and shock.',
  tiers: tiers('Antler Arc', 'Antler Bolt', 'Antler Tempest',
    { shock: 0.15, shockRounds: 3 },
    { shock: 0.2, shockRounds: 3, multiTarget: 2 },
    { shock: 0.25, shockRounds: 3, target: 'enemyLane' }) });

def({ id: 'tongue_lash', name: 'Tongue Lash', kind: 'active',
  power: 2.2, reach: 'any', target: 'enemy', melee: true,
  desc: 'A maw toad reels the prey in and poisons it.',
  tiers: tiers('Tongue Lash', 'Tongue Hook', 'Tongue Gulp',
    { pull: 1, status: { poison: { power: 0.8, rounds: 3, stacks: true } } },
    { pull: 2, status: { poison: { power: 1.0, rounds: 3, stacks: true } } },
    { pull: 2, loseAction: true, status: { poison: { power: 1.2, rounds: 4, stacks: true } } }) });

def({ id: 'frost_bite', name: 'Frost Bite', kind: 'active',
  elemental: true, element: 'ice', power: 2.6, reach: 'front', target: 'enemy', melee: true,
  desc: 'A shard wolf\'s jaws. Ice and freeze.',
  tiers: tiers('Frost Bite', 'Frost Tear', 'Frost Maw',
    { freeze: 1, status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    { freeze: 1, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { freeze: 2, status: { bleed: { power: 1.0, rounds: 4, stacks: true } } }) });

def({ id: 'sky_pluck', name: 'Sky Pluck', kind: 'active',
  power: 2.7, reach: 'any', target: 'enemy', melee: true,
  desc: 'A king vulture\'s stoop. Bleed, and a finish on the wounded.',
  tiers: tiers('Sky Pluck', 'Sky Rip', 'Sky Feast',
    { status: { bleed: { power: 0.8, rounds: 3, stacks: true } }, executeBelow: 0.15 },
    { status: { bleed: { power: 1.0, rounds: 3, stacks: true } }, executeBelow: 0.2 },
    { status: { bleed: { power: 1.2, rounds: 4, stacks: true } }, executeBelow: 0.25 }) });

def({ id: 'stone_gaze', name: 'Stone Gaze', kind: 'active',
  power: 2.0, reach: 'any', target: 'enemy',
  desc: 'A basilisk queen\'s stare. Freeze and stripped armor.',
  tiers: tiers('Stone Gaze', 'Stone Glare', 'Stone Sentence',
    { freeze: 1, defStrip: 12 },
    { freeze: 1, defStrip: 16 },
    { freeze: 2, defStripAll: true }) });
})();
