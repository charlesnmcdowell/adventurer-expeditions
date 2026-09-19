// Varenholm's Iron War — AI-generated story campaign pack, edited for Adventurer.
// Extends the shared campaign tables so ADV.Campaign's generic spawner / actor
// helpers work on this cast unchanged. Dialogue and choices live in
// campaign3_dialogue.js; the engine in js/core/campaign3.js.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const D = ADV.DATA;

// ---------------------------------------------------------------- the faction (§0)
// One "faction" so every generic table has a home. The story is linear; the
// recruiter/rival/boss/antagonist slots satisfy the shared coverage tests.
Object.assign(D.FACTIONS, {
  gate: {
    id: 'gate', name: 'Varenholm’s Iron War', short: 'the Gate', alignment: 'neutral', campaign3: true,
    hall: 'The Open Hand Inn', archetypes: ['fighter', 'rogue'],
    recruiter: 'aldric', rival: 'wren_ward', boss: 'korvath', antagonist: 'korvath',
    titles: ["Tesfaye's Ward", 'The Hunted', 'Child of the Gate'],
    gearSet: 'wardens_gear', gate: { contracts: 0, alignment: null },
    blurb: 'A murdered father, a stolen iron trade, and a company caught between the people who profit from war and the man who means to start one.',
  },
});
D.CAMPAIGN3_FACTION_ID = 'gate';

// All fourteen quests: enemies must survive an opening party volley.
// Applied only to spawned opponents, after their authored stats and boss HP floors.
D.CAMPAIGN3_COMBAT = { hp: 5, atk: 2, def: 2 };
// Companions are scaled the same way their enemies are. Without this the multiplier above
// applied to one side only: a companion stayed on species base health (110-116 for the whole
// campaign) while everything they fought had five times its own, and the player climbed past
// 3,000 through the hero title and survival growth. They died in two blows and the campaign
// was solo in all but name. Set just under the enemy multiplier: a companion is nearly,
// but not quite, on the scale of what the party fights, and the player stays the hero.
D.CAMPAIGN3_ALLY = { hp: 4, atk: 1.75, def: 1.75 };
// Quest 1 is walked alone by design, so the party allowance above has nobody to apply to.
// These trim the enemy multiplier for any encounter the ward meets with no company at all.
D.CAMPAIGN3_SOLO = { hp: 0.4, atk: 0.7, def: 0.7 };
// Easy/Normal only, first two quests: a moderate cut to every blow those foes deal
// (strikes, riders, and the boss percent-of-health add). Hard keeps the full kit.
D.CAMPAIGN3_EARLY_FOE_DMG = 0.7;
// Recovery can restore one extra health bar per enemy, shared by all healing sources.
// This prevents the fivefold HP increase turning a defensive party fight into a loop.
D.CAMPAIGN3_RECOVERY_MAX = 1;
// The mine chief is a healer, not an endurance wall. Relative to the campaign boost.
D.CAMPAIGN3_MINE_CHIEF = { hp: 0.5, def: 0.75, healPct: 0.12, healUses: 2, healCooldown: 3 };

// Issued at the ending, never sold.
Object.assign(D.GEAR_SETS, {
  wardens_gear: { name: "Warden's Gear", archetypes: ['fighter', 'rogue', 'healer'], cost: 0, floor: 15, advanceTier: true, campaign: 'gate' },
});

// ---------------------------------------------------------------- characters (§3)
const CH = D.CAMPAIGN_CHARS;
function chr(o) { o.campaign3 = true; o.faction = o.faction || 'gate'; CH[o.id] = o; }

// 3a — companions. `companion:true`; `romance:true` where courting is possible;
// `favours` names the ending they hope for (§5). Levels scale per quest (§3a).
chr({ id: 'wren_ward', name: 'Hiwot', region: 'lanternhold', role: 'companion', companion: true, sex: 'f', campaignExit: true,
  desc: 'Your foster-sister from Lanternhold, raised beside you in the keepers\' library. Quick hands, quicker mouth, hides fear behind jokes.',
  perks: ['opportunist'], actives: ['backstab', 'smoke_bomb', 'shadow_rise', 'aimed_shot'],
  portrait: { skin: 'brown', hair: 'sidecut', wardrobe: 'hiking', color: '#b04a8a' } });
chr({ id: 'dorran', name: 'Beau', region: 'thornbury', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A Warden fighter from the Shore Road with a stammer he hates and a shield he never puts down. Delphine\'s husband.',
  perks: ['bulwark'], actives: ['cleave', 'shield_wall', 'sunder', 'taunt'],
  portrait: { skin: 'brown', hair: 'fringe', wardrobe: 'armor', color: '#4e5a3a' } });
chr({ id: 'selene', name: 'Delphine', region: 'thornbury', role: 'companion', companion: true, sex: 'f', campaignExit: true, favours: 'hero',
  desc: 'Beau\'s wife and an old friend of your late stepfather, Tesfaye. She regards you as family. A Warden druid of the Shore Road: blunt, protective, allergic to self-pity. Speaks for the balance of things.',
  perks: ['wild_form'], actives: ['thorn_skin', 'mend', 'beast_shape', 'grove_raise'],
  portrait: { skin: 'brown', hair: 'braids', wardrobe: 'hide', color: '#3a5a3a' } });
chr({ id: 'vess', name: 'Desmond', region: 'hand', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'An Umbral Hand necromancer who giggles at wounds. Unstable, brilliant, always listening for the Hand.',
  perks: ['arcane_focus'], actives: ['fire_bolt', 'spark', 'ember_lash', 'wither_touch'],
  portrait: { skin: 'dark', hair: 'long', wardrobe: 'robe', color: '#3a2a4a' } });
chr({ id: 'fennick', name: 'Winston', region: 'hand', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'Desmond\'s halfling minder. Sour, practical, would sell you for a good boot. Umbral Hand.',
  perks: ['septic_sanguine'], actives: ['backstab', 'venom_fang', 'smoke_bomb', 'whisper_of_ending'],
  portrait: { skin: 'brown', hair: 'buzz', wardrobe: 'hiking', color: '#5a4a2a' } });
chr({ id: 'cassian', name: 'Santiago', region: 'flame', role: 'companion', companion: true, sex: 'm', campaignExit: true, romance: true, favours: 'hero',
  desc: 'A squire of the Order of the Dawning Flame, from its chapter house in the sun-lands, on his first errand. Earnest, rigid, secretly terrified of failing.',
  perks: ['bulwark'], actives: ['shield_wall', 'taunt', 'cleanse', 'stand_fast'],
  portrait: { skin: 'tan', hair: 'fringe', wardrobe: 'armor', color: '#d8d2c2' } });
chr({ id: 'ithrel', name: 'Itsuki', region: 'elves', role: 'companion', companion: true, sex: 'm', campaignExit: true, romance: true, favours: 'kill',
  desc: 'An elf ranger of the eastern woods who has hunted the bandit lord Gorruk for a year. Grief made him quiet; the quiet made him precise.',
  perks: ['marksman'], actives: ['aimed_shot', 'snare', 'beast_shape', 'cleave'],
  portrait: { skin: 'tan', hair: 'long', wardrobe: 'hide', color: '#2f3a2f' } });
chr({ id: 'bramm', name: 'Bahadır', region: 'kalden', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A huge, loud ranger of Kalden who travels with a tiger named Fındık. Fiercely loyal to Yasemin and his company.',
  perks: ['momentum'], actives: ['aimed_shot', 'cleave', 'defiant_stand', 'snare'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hide', color: '#6a3a5a' } });
chr({ id: 'ysolde', name: 'Yasemin', region: 'kalden', role: 'companion', companion: true, sex: 'f', campaignExit: true,
  desc: 'A Kalden witch under Bahadır\'s guard. Formal, watchful, sees the bloodline in you before you do.',
  perks: ['arcane_focus'], actives: ['frost_touch', 'rime_grasp', 'spark', 'fire_bolt'],
  portrait: { skin: 'tan', hair: 'twists', wardrobe: 'robe', color: '#4a3a6a' } });
chr({ id: 'aurelius', name: 'Devendra', region: 'vashk', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A Crimson Wizard of Vashk who narrates his own superiority under his breath. Wants Yasemin dead; wants you useful.',
  perks: ['pyromaniac'], actives: ['fire_bolt', 'ember_lash', 'spark', 'frost_touch'],
  portrait: { skin: 'brown', hair: 'bald', wardrobe: 'robe', color: '#7a2a2a' } });
chr({ id: 'ilvara', name: 'Layla', region: 'deep', role: 'companion', companion: true, sex: 'f', campaignExit: true, romance: true, favours: 'usurper',
  desc: 'A dark-elf priestess of the deep cities, fleeing her own people and a bounty. Contemptuous, curious, thinks mercy is a luxury the strong buy.',
  perks: ['devoted'], actives: ['mend', 'wither_touch', 'blood_pact', 'cleanse'],
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'dress', color: '#2a2438' } });
chr({ id: 'faelen', name: 'Kaito', region: 'elves', role: 'companion', companion: true, sex: 'm', campaignExit: true, romance: true, favours: 'thieves',
  desc: 'An elf bounty-hunter of the eastern woods who flirts with anything and finishes every job. Cheerful, mercenary, surprisingly loyal.',
  perks: ['opportunist'], actives: ['aimed_shot', 'backstab', 'snare', 'smoke_bomb'],
  portrait: { skin: 'tan', hair: 'ponytail', wardrobe: 'hide', color: '#5a6a3a' } });
chr({ id: 'nettle', name: 'Wanjiru', region: 'umbra', role: 'companion', companion: true, sex: 'f', campaignExit: true,
  desc: 'An Umbra druid of the Mirkhollow who believes the forest is owed blood. Fierce, literal, no patience for cities.',
  perks: ['wild_form'], actives: ['beast_shape', 'thorn_skin', 'grove_raise', 'wither_touch'],
  portrait: { skin: 'dark', hair: 'locs', wardrobe: 'hide', color: '#2a4a2a' } });
chr({ id: 'durnik', name: 'Dai Morgan', region: 'dunmere', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A dwarf priest whose clan dug the Mirkhollow mine before the Consortium stole it. Slow to anger, impossible to move.',
  perks: ['bulwark'], actives: ['shield_wall', 'mend', 'taunt', 'regenerate'],
  portrait: { skin: 'fair', hair: 'bald', wardrobe: 'armor', color: '#6a5a3a' } });
// romance is retained for accepted legacy saves; no new route until a later story resolves Kolade.
chr({ id: 'amara', name: 'Amara', region: 'gate', role: 'companion', companion: true, sex: 'f', campaignExit: true, romance: true, romanceDeferred: true, favours: 'mercy',
  desc: 'Kolade\'s lover and sword-hand. A monk of the Gate\'s fire temples who wants him stopped, not slaughtered. Grave, exact, tired.',
  perks: ['momentum'], actives: ['dual_swords', 'counter_attack', 'defiant_stand', 'cleave'],
  portrait: { skin: 'dark', hair: 'bun', wardrobe: 'armor', color: '#7a3a2a' } });

// 3b — principals who never fight beside you (display-only actors)
chr({ id: 'aldric', name: 'Tesfaye', region: 'lanternhold', role: 'recruiter', sex: 'm', fights: false, level: 30,
  desc: 'Your foster-father, a retired Warden mage who keeps the library at Lanternhold. Gentle voice, iron patience, a man who has planned for this night for twenty years.',
  perks: ['arcane_focus'], actives: ['fire_bolt', 'guardian_ward'],
  portrait: { skin: 'brown', hair: 'long', wardrobe: 'robe', color: '#5a5a6a' } });
chr({ id: 'torvald', name: 'Yohannes', region: 'lanternhold', role: 'sage', sex: 'm', fights: false, level: 40,
  desc: 'The sage in the grey cloak, a hill-man of the old highland school. Old beyond reason, amused by everything, tells you exactly as much as he decides you can carry.',
  perks: ['arcane_focus'], actives: ['spark', 'frost_touch'],
  portrait: { skin: 'brown', hair: 'long', wardrobe: 'robe', color: '#4a4a5a' } });
chr({ id: 'tollan', name: 'Gethin Pryce', region: 'dunmere', role: 'mayor', sex: 'm', fights: false, level: 8,
  desc: 'Mayor of Dunmere. Sweating, harried, honest enough. Would pay anyone to make the mine problem someone else\'s.',
  perks: [], actives: ['basic_attack'],
  portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'suit', color: '#5a4a3a' } });
chr({ id: 'halloran', name: 'Emeka Obi', region: 'gate', role: 'officer', sex: 'm', fights: false, level: 22,
  desc: 'A Burning Gauntlet officer with a burn-scarred jaw. Plain-spoken, fair, dead by the eleventh chapter.',
  perks: ['bulwark'], actives: ['shield_wall', 'cleave'],
  portrait: { skin: 'dark', hair: 'buzz', wardrobe: 'armor', color: '#8a3a2a' } });
chr({ id: 'halvard', name: 'Duke Adebayo', region: 'gate', role: 'duke', sex: 'm', fights: false, level: 28,
  desc: 'Grand Duke and commander of the Burning Gauntlet. Tired, precise, poisoned by the end.',
  perks: ['bulwark'], actives: ['cleave', 'shield_wall'],
  portrait: { skin: 'dark', hair: 'fringe', wardrobe: 'suit', color: '#8a2a2a' } });
chr({ id: 'orlan', name: 'Duke Olumide', region: 'gate', role: 'duke', sex: 'm', fights: false, level: 26,
  desc: 'A Grand Duke who was a soldier first and still stands like one. Loud, decent, easily bored.',
  perks: ['momentum'], actives: ['cleave'],
  portrait: { skin: 'dark', hair: 'buzz', wardrobe: 'suit', color: '#3a3a6a' } });
chr({ id: 'mira', name: 'Duke Folasade', region: 'gate', role: 'duke', sex: 'f', fights: false, level: 26,
  desc: 'A Grand Duke and a mage. Watches everyone, trusts nobody, and is usually right.',
  perks: ['arcane_focus'], actives: ['spark'],
  portrait: { skin: 'dark', hair: 'bun', wardrobe: 'dress', color: '#6a3a6a' } });
chr({ id: 'ambrose', name: 'Dawit', region: 'lanternhold', role: 'keeper', sex: 'm', fights: false, level: 20,
  desc: 'A keeper of Lanternhold and Tesfaye\'s friend. Kind eyes, careful hands, keeps the letter you were never supposed to read.',
  perks: [], actives: ['mend'],
  portrait: { skin: 'brown', hair: 'bald', wardrobe: 'robe', color: '#5a5a5a' } });
chr({ id: 'hadrian', name: 'Abba Gebre', region: 'lanternhold', role: 'keeper', sex: 'm', fights: false, level: 20,
  desc: 'First Keeper of Lanternhold. Proud of the library and suspicious of everyone who leaves it, you most of all.',
  perks: [], actives: ['spark'],
  portrait: { skin: 'brown', hair: 'fringe', wardrobe: 'robe', color: '#4a4a4a' } });
chr({ id: 'cael', name: 'Cal Boone', region: 'thornbury', role: 'spy', sex: 'm', fights: false, level: 14,
  desc: 'A Warden spy from the Shore Road who was caught. Half-starved, still joking, remembers every name he heard in the tent.',
  perks: [], actives: ['aimed_shot'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hiking', color: '#4a4a3a' } });
chr({ id: 'fen', name: 'Tunde Softfoot', region: 'gate', role: 'thief', sex: 'm', fights: false, level: 24,
  desc: 'The thieves\' guild\'s voice in the Undervault. Soft-spoken, keeps ledgers of favours, never forgets a debt.',
  perks: ['opportunist'], actives: ['backstab', 'smoke_bomb'],
  portrait: { skin: 'dark', hair: 'cornrows', wardrobe: 'suit', color: '#2a2a2a' } });
chr({ id: 'lysandra', name: 'Folake', region: 'gate', role: 'mistress', sex: 'f', fights: false, level: 24,
  desc: 'Kolade\'s mistress and the Consortium\'s cleverest survivor. Silk voice, ledger heart, offers a deal in every sentence.',
  perks: ['charm'], actives: ['spark'],
  portrait: { skin: 'dark', hair: 'long', wardrobe: 'dress', color: '#7a2a4a' } });
chr({ id: 'ostwin', name: 'Baba Olusegun', region: 'gate', role: 'tutor', sex: 'm', fights: false, level: 30,
  desc: 'Kolade\'s tutor in the old prophecies. Dry, doting, the only one who calls Kolade \'my boy\'.',
  perks: ['arcane_focus'], actives: ['frost_touch', 'spark'],
  portrait: { skin: 'dark', hair: 'bald', wardrobe: 'robe', color: '#3a3a4a' } });
chr({ id: 'sarn', name: 'Sanni', region: 'gate', role: 'stranger', sex: 'm', fights: false, level: 30,
  desc: 'Sanni, a courteous merchant who claims to know Tesfaye and steers the ward against Adigun. Kolade\'s civilian identity, used to engineer the murder and arrest.',
  perks: [], actives: ['cleave'],
  portrait: { skin: 'dark', hair: 'bald', wardrobe: 'suit', color: '#403046' } });

chr({ id: 'nib', name: 'Nib', region: 'thornbury', role: 'knife', sex: 'm', fights: false, level: 5,
  desc: 'The first hired knife, a Shore Road man in a road-cloak with a purse to earn. Easy-going about murder; not paid enough to be brave.',
  perks: ['opportunist'], actives: ['backstab'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hiking', color: '#3a3028' } });

// 3c — bosses and named enemies (they fight against you)
chr({ id: 'korvath', name: 'Kolade Adeyinka', region: 'gate', epithet: 'the Armoured', role: 'antagonist', sex: 'm', level: 30,
  desc: 'Your half-brother, raised in the Gate by a Consortium merchant. A giant in spiked black plate who believes bloodshed is a ladder. Calm, courteous, absolutely certain.',
  perks: ['momentum', 'bulwark'], actives: ['cleave', 'reaving_arc', 'sunder', 'shield_wall', 'warding_stance', 'finisher', 'taunt'],
  statMult: 1.35, hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
  portrait: { skin: 'dark', hair: 'bald', wardrobe: 'armor', color: '#1a1a1e' } });
chr({ id: 'morwin', name: 'Merle', region: 'thornbury', role: 'boss', sex: 'm', level: 8,
  desc: 'A hired mage-assassin from the Thornbury country with a bounty notice in his coat. Talks too much before he casts.',
  perks: ['arcane_focus'], actives: ['fire_bolt', 'spark', 'ember_lash', 'ashfall'],
  portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'robe', color: '#4a2a2a' } });
chr({ id: 'lessa', name: 'Lurleen', region: 'thornbury', role: 'boss', sex: 'f', level: 9,
  desc: 'A knife for hire from the Shore Road who takes her work personally. Smiles when she is losing.',
  perks: ['opportunist'], actives: ['backstab', 'venom_fang', 'marked_for_the_knife', 'blood_price'],
  portrait: { skin: 'brown', hair: 'ponytail', wardrobe: 'hiking', color: '#3a2a3a' } });
chr({ id: 'verlan', name: 'Femi', region: 'gate', role: 'boss', sex: 'm', level: 10,
  desc: 'The Consortium\'s courier in Thornbury, a city man posing as a wine merchant. Sweats when questioned, folds when paid.',
  perks: ['arcane_focus'], actives: ['frost_touch', 'spark', 'ward_thief'],
  portrait: { skin: 'dark', hair: 'fringe', wardrobe: 'suit', color: '#5a3a5a' } });
chr({ id: 'grukhar', name: 'Grukhar', region: 'none', role: 'boss', sex: 'm', level: 12,
  desc: 'A half-orc priest of Veylan poisoning the Dunmere ore for pay he has not been paid. Bitter, frightened, dangerous.',
  perks: ['devoted'], actives: ['wither_touch', 'blood_pact', 'bog_curse', 'mend', 'raise'],
  portrait: { skin: 'ashen', hair: 'bald', wardrobe: 'robe', color: '#3a3a2a' } });
chr({ id: 'gorruk', name: 'Gorruk', region: 'none', epithet: 'the Bandit Lord', role: 'boss', sex: 'm', level: 16,
  desc: 'An ogre-mage who runs the bandit companies for the Consortium. Cruel for sport, cowardly when it counts.',
  perks: ['momentum', 'arcane_focus'], actives: ['cleave', 'sunder', 'war_bellow', 'fire_bolt', 'taunt'],
  statMult: 1.3,
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'armor', color: '#4a3a2a' } });
chr({ id: 'thornwise', name: 'Mzee Kamau', region: 'umbra', epithet: 'Archdruid', role: 'boss', sex: 'm', level: 15,
  desc: 'The Umbra archdruid of the Mirkhollow. Believes every axe-holder deserves a root through the chest.',
  perks: ['wild_form'], actives: ['thorn_lash', 'treefall', 'grove_raise', 'beast_shape', 'thorn_skin'],
  portrait: { skin: 'dark', hair: 'long', wardrobe: 'hide', color: '#2a4a2a' } });
chr({ id: 'malvane', name: 'Olamide', region: 'gate', role: 'boss', sex: 'm', level: 17,
  desc: 'The Consortium mage running the Mirkhollow mine. Fussy, meticulous, keeps the slaves\' names in a ledger.',
  perks: ['ice_queen', 'arcane_focus'], actives: ['frost_touch', 'rime_grasp', 'coven_rime', 'ranging_ward'],
  portrait: { skin: 'dark', hair: 'fringe', wardrobe: 'robe', color: '#2a3a5a' } });
chr({ id: 'grell', name: 'Gbenga', region: 'gate', role: 'boss', sex: 'm', level: 20,
  desc: 'Kolade\'s best knife, sent into the catacombs to finish it. Professional, bored, unbothered by tombs.',
  perks: ['opportunist', 'sniper'], actives: ['killing_angle', 'aimed_shot', 'silenced_step', 'backstab', 'smoke_bomb'],
  portrait: { skin: 'dark', hair: 'buzz', wardrobe: 'hiking', color: '#2a2a2a' } });
chr({ id: 'idris', name: 'Idris', region: 'gate', role: 'boss', sex: 'm', level: 21,
  desc: 'The \'healer\' at Duke Adebayo\'s bedside. A doppelganger wearing a physician.',
  perks: ['devoted'], actives: ['blood_lotus', 'wither_touch', 'mend', 'ward_thief', 'backstab'],
  portrait: { skin: 'dark', hair: 'fringe', wardrobe: 'robe', color: '#4a4a5a' } });
chr({ id: 'ravel', name: 'Rasheed', region: 'gate', role: 'boss', sex: 'm', level: 22,
  desc: 'Half of Kolade\'s pet assassins. Loud, vain, deadly with two blades.',
  perks: ['momentum'], actives: ['dual_swords', 'cutlass_work', 'butchers_tempo', 'backstab', 'smoke_bomb'],
  portrait: { skin: 'dark', hair: 'long', wardrobe: 'suit', color: '#5a2a3a' } });
chr({ id: 'kessa', name: 'Kemi', region: 'gate', role: 'boss', sex: 'f', level: 22,
  desc: "The other half. Quiet, a mage, the one who actually plans.",
  perks: ['lightning_king'], actives: ['chain_lightning', 'arcane_cascade', 'storm_shape', 'spark'],
  portrait: { skin: 'dark', hair: 'bun', wardrobe: 'dress', color: '#3a2a5a' } });
chr({ id: 'jarem', name: 'Jelani', region: 'gate', role: 'boss', sex: 'm', level: 24,
  desc: 'Kolade\'s court mage. Serves because Kolade is winning; would serve anyone who was.',
  perks: ['arcane_focus', 'pyromaniac'], actives: ['siege_flame', 'fire_ship', 'prismatic_bolt', 'ember_lash'],
  portrait: { skin: 'dark', hair: 'bald', wardrobe: 'robe', color: '#5a3a2a' } });
chr({ id: 'lucan', name: 'Segun Marr', region: 'gate', role: 'boss', sex: 'm', level: 25,
  desc: 'The Burning Gauntlet officer who sold the company to Kolade. Commands it now. Sneers to hide the shame.',
  perks: ['bulwark', 'momentum'], actives: ['cleave', 'shield_wall', 'paid_in_full', 'close_order', 'taunt'],
  portrait: { skin: 'dark', hair: 'fringe', wardrobe: 'armor', color: '#7a3a2a' } });
chr({ id: 'maddox', name: 'Adigun Adeyinka', region: 'gate', role: 'boss', sex: 'm', level: 18,
  desc: 'Head of the Iron Consortium\'s Gate office and Kolade\'s foster-father. A merchant who thinks he is still in charge.',
  perks: ['rich', 'momentum'], actives: ['contract_mark', 'chain_and_weight', 'mace_swing', 'cleave'],
  portrait: { skin: 'dark', hair: 'fringe', wardrobe: 'suit', color: '#2a2a3a' } });
chr({ id: 'vask', name: 'Bankole', region: 'gate', role: 'boss', sex: 'm', level: 18,
  desc: 'A Consortium leader; Adigun\'s partner. Louder than he is clever.',
  perks: ['momentum'], actives: ['line_advance', 'shield_breaker', 'cleave', 'sunder'],
  portrait: { skin: 'brown', hair: 'buzz', wardrobe: 'suit', color: '#3a2a2a' } });
chr({ id: 'rennick', name: 'Rotimi', region: 'gate', role: 'boss', sex: 'm', level: 18,
  desc: "A Consortium leader; the accountant. Would like to survive this meeting.",
  perks: ['arcane_focus'], actives: ['spark', 'frost_touch', 'dispel'],
  portrait: { skin: 'dark', hair: 'bald', wardrobe: 'suit', color: '#2a3a3a' } });

// ---------------------------------------------------------------- regions (voice & naming)
// Every named person carries a `region`. Accents are written through word
// choice, rhythm and idiom — never phonetic spelling — so lines read cleanly
// and TTS keeps them intelligible. The voice script prints these for casting.
D.CAMPAIGN3_REGIONS = {
  lanternhold: { name: 'Lanternhold and the hill keeps', flavour: 'Ethiopian highlands', names: 'Amharic (Tesfaye, Hiwot, Dawit, Abba Gebre, Yohannes)',
    voice: 'Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder.' },
  thornbury: { name: 'Thornbury, the Shore Road and the Wardens\' country', flavour: 'Georgia, USA', names: 'Southern American (Beau, Delphine, Cal Boone, Lurleen, Merle)',
    voice: 'Warm drawl. "I reckon", "I\'ll tell you what", "y\'all", "fixing to", "bless him". Plain-spoken courtesy; ma\'am and sir to strangers. Long vowels, short tempers.' },
  dunmere: { name: 'Dunmere and the dwarf clans', flavour: 'Welsh valleys', names: 'Welsh (Gethin Pryce, Dai Morgan)',
    voice: 'Sing-song cadence, sentences that end where they started ("I\'ll go down, I will"). "Bach", "now then", "there\'s lovely", "duw". Understatement about danger.' },
  umbra: { name: 'The Mirkhollow and the Umbra circle', flavour: 'Kenyan', names: 'Kikuyu and Swahili (Wanjiru, Mzee Kamau)',
    voice: 'Direct and rhythmic. "Sawa", "pole pole", "eh?" at the end of a challenge, "Mzee" for elders. Swahili proverbs in translation ("haste has no blessing").' },
  gate: { name: 'Varenholm\'s Gate — dukes, Gauntlet, Consortium, temples, thieves', flavour: 'Nigerian (Yoruba and Igbo)', names: 'Yoruba / Igbo (Adebayo, Olumide, Folasade, Emeka, Kolade, Folake, Tunde)',
    voice: 'Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".' },
  elves: { name: 'The elves of the eastern woods', flavour: 'Japanese', names: 'Japanese (Itsuki, Kaito)',
    voice: 'Understated and exact. Apology before request, gratitude after. Few words; the pause carries the feeling. "-san" for strangers of standing; never contractions when serious.' },
  deep: { name: 'The deep cities of the dark elves', flavour: 'Arabic', names: 'Arabic (Layla)',
    voice: 'Elevated, poetic, unhurried contempt. "By the deep", "ya" before a name, "God willing" said without belief. Images from stone, night and water.' },
  kalden: { name: 'Kalden, the witch-country beyond the steppe', flavour: 'Turkish', names: 'Turkish (Bahadır, Yasemin, the tiger Fındık)',
    voice: 'Warm and emphatic. "Abla" / "abi" for elder sister and brother, "canım" for the beloved, "vallahi" as an oath, "inşallah" for hope. Hospitality as a rule of war.' },
  vashk: { name: 'Vashk and its Crimson Wizards', flavour: 'Indian', names: 'Sanskrit-derived (Devendra)',
    voice: 'Ornate, formal, self-satisfied. "Kindly", "most assuredly", "it is quite evident". Compliments that are insults; never raises his voice.' },
  hand: { name: 'The Umbral Hand', flavour: 'Jamaican', names: 'Caribbean (Desmond, Winston)',
    voice: 'Light patois rhythm through word order and idiom, not spelling: "man", "you see it?", "no worry yourself", "one-one coco full basket". Dry warmth from Winston; sing-song from Desmond.' },
  flame: { name: 'The Order of the Dawning Flame (chapter house in the sun-lands)', flavour: 'Mexican', names: 'Spanish (Santiago)',
    voice: 'Courtly and earnest. "Señor", "señora", "with respect", "God keep you". Formal address to everyone, including enemies; oaths sworn on the Flame.' },
  none: { name: 'Monsters', flavour: 'invented', names: 'orcish / ogrish (Grukhar, Gorruk)', voice: 'Guttural, no real-world accent.' },
};

// ---------------------------------------------------------------- enemies (§4)
const EN = D.CAMPAIGN_ENEMIES;
function en(o) { o.campaign3 = true; o.faction = 'gate'; EN[o.id] = o; }
// humans
en({ id: 'hired_knife', name: 'Hired Knife', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Road Cloak', tint: '#3a3028' }, { name: 'Ash Cloak', tint: '#2a2a2a' }, { name: 'Wet Cloak', tint: '#2a3038' }],
  pool: ['backstab', 'smoke_bomb', 'venom_fang', 'marked_for_the_knife', 'silenced_step'] });
en({ id: 'gate_bandit', name: 'Road Bandit', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Frostbite', tint: '#3a4a5a' }, { name: 'Ashtalon', tint: '#4a3a2a' }, { name: 'Freeblade', tint: '#3a3a3a' }],
  pool: ['cleave', 'sunder', 'veterans_cut', 'butchers_tempo', 'snare'] });
en({ id: 'bandit_archer', name: 'Bandit Archer', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Treeline', tint: '#2a3a2a' }, { name: 'Ridge', tint: '#3a3a2a' }, { name: 'Ford', tint: '#2a3a3a' }],
  pool: ['aimed_shot', 'ranged_discipline', 'suppressing_volley', 'kunai_line', 'venom_fang'] });
en({ id: 'hob_sergeant', name: 'Hobgoblin Sergeant', species: 'human', portrait: 'orc', equips: 3,
  skins: [{ name: 'Frostbite Company', tint: '#3a4a5a' }, { name: 'Ashtalon Company', tint: '#4a3a2a' }, { name: 'Deserter', tint: '#3a3a3a' }],
  pool: ['dual_swords', 'shield_wall', 'line_advance', 'stone_stance', 'taunt'] });
en({ id: 'consortium_guard', name: 'Consortium Guard', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Iron Livery', tint: '#4a4a52' }, { name: 'Black Livery', tint: '#2a2a2e' }, { name: 'Mine Detail', tint: '#4a3a2a' }],
  pool: ['shield_wall', 'taunt', 'hold_the_road', 'shield_breaker', 'bulwark_formation'] });
en({ id: 'consortium_mage', name: 'Consortium Mage', species: 'human', portrait: 'hedge_mage', equips: 2,
  skins: [{ name: 'Ledger Cowl', tint: '#2a3a5a' }, { name: 'Seal Cowl', tint: '#3a2a4a' }, { name: 'Ash Cowl', tint: '#3a3a3a' }],
  pool: ['fire_bolt', 'frost_touch', 'ranging_ward', 'prismatic_bolt', 'chain_lightning'] });
en({ id: 'slave_driver', name: 'Slave Driver', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Whip Hand', tint: '#4a3a2a' }, { name: 'Chain Hand', tint: '#3a3a3a' }, { name: 'Lamp Hand', tint: '#5a4a2a' }],
  pool: ['chain_and_weight', 'contract_mark', 'flanking_pay', 'mace_swing', 'cleave'] });
en({ id: 'veylan_acolyte', name: 'Acolyte of Veylan', species: 'human', portrait: 'grave_acolyte', equips: 2,
  skins: [{ name: 'Black Sun', tint: '#2a2a2a' }, { name: 'Bone Cowl', tint: '#3a3a32' }, { name: 'Rust Cowl', tint: '#4a2a2a' }],
  pool: ['mend', 'restorative_circle', 'vital_anchor', 'blood_lotus', 'wither_touch'] });
en({ id: 'umbra_druid', name: 'Umbra Druid', species: 'human', portrait: 'hedge_mage', equips: 2,
  skins: [{ name: 'Moss Robe', tint: '#2a4a2a' }, { name: 'Bark Robe', tint: '#3a3a2a' }, { name: 'Fern Robe', tint: '#2a3a2a' }],
  pool: ['thorn_lash', 'fox_form', 'growth_field', 'crow_sight', 'snare'] });
en({ id: 'gauntlet_soldier', name: 'Burning Gauntlet Soldier', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Flame Tabard', tint: '#8a3a2a' }, { name: 'Ash Tabard', tint: '#5a3a2a' }, { name: 'Night Watch', tint: '#3a2a2a' }],
  pool: ['shield_wall', 'fire_barrier', 'close_order', 'crossing_guard', 'taunt'] });
en({ id: 'gauntlet_traitor', name: 'Gauntlet Turncoat', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: "Marr's Own", tint: '#5a2a2a' }, { name: 'Bought Blade', tint: '#3a2a2a' }, { name: 'Late Loyalty', tint: '#4a3a3a' }],
  pool: ['cleave', 'paid_in_full', 'disciplined_advance', 'ashfall', 'sunder'] });
en({ id: 'morrak_cultist', name: 'Cultist of Morrak', species: 'human', portrait: 'grave_acolyte', equips: 3,
  skins: [{ name: 'Blood Cowl', tint: '#4a1a1a' }, { name: 'Skull Cowl', tint: '#2a2a2a' }, { name: 'Ash Cowl', tint: '#3a3a3a' }],
  pool: ['blood_pact', 'raise', 'poison_spray', 'bog_curse', 'soul_bay'] });
en({ id: 'palace_doppelganger', name: 'Palace Guard', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: 'Ducal Livery', tint: '#3a3a6a' }, { name: 'Hall Livery', tint: '#5a5a3a' }, { name: 'Gate Livery', tint: '#4a4a4a' }],
  pool: ['backstab', 'shadow_rise', 'smoke_step', 'cloak_of_shadows', 'countersign'] });
en({ id: 'tomb_ghoul', name: 'Tomb Ghoul', species: 'human', portrait: 'grave_acolyte', equips: 2, undead: true,
  skins: [{ name: 'Dust', tint: '#3a3a32' }, { name: 'Wrapped', tint: '#4a4a3a' }, { name: 'Split', tint: '#2a2a2a' }],
  pool: ['soul_bay', 'mire_tusk', 'wither_touch', 'venom_fang', 'snare'], statusImmunities: ['poison', 'bleed'] });
// creatures (illustrated creature ids)
en({ id: 'road_wolf', name: 'Road Wolf', species: 'beast', portrait: 'dire_wolf', equips: 2,
  skins: [{ name: 'Grey', tint: '#5a5a5a' }, { name: 'Black', tint: '#2a2a2a' }, { name: 'Scarred', tint: '#4a3a3a' }],
  pool: ['pack_snap', 'pack_frenzy', 'hamstring_pounce', 'cleave', 'defiant_stand'] });
en({ id: 'tunnel_kobold', name: 'Tunnel Kobold', species: 'beast', portrait: 'goblin', equips: 2,
  skins: [{ name: 'Pick Team', tint: '#4a3a2a' }, { name: 'Lamp Team', tint: '#5a4a2a' }, { name: 'Poison Team', tint: '#3a4a2a' }],
  pool: ['aimed_shot', 'sand_sting', 'smoke_bomb', 'snare', 'venom_fang'] });
en({ id: 'kobold_shaman', name: 'Kobold Shaman', species: 'beast', portrait: 'goblin', equips: 3,
  skins: [{ name: 'Bone Mask', tint: '#5a5a3a' }, { name: 'Ash Mask', tint: '#3a3a3a' }, { name: 'Ore Mask', tint: '#4a3a5a' }],
  pool: ['cinder_charge', 'magma_spit', 'fire_bolt', 'spark', 'mend'] });
en({ id: 'gnoll_raider', name: 'Gnoll Raider', species: 'beast', portrait: 'hound', equips: 2,
  skins: [{ name: 'Yellow', tint: '#6a5a2a' }, { name: 'Brindle', tint: '#4a3a2a' }, { name: 'Grey', tint: '#4a4a4a' }],
  pool: ['war_bellow', 'rending_talons', 'cleave', 'taunt', 'defiant_stand'] });
en({ id: 'web_spider', name: 'Giant Spider', species: 'beast', portrait: 'spider', equips: 2,
  skins: [{ name: 'Web-Black', tint: '#2a2a2a' }, { name: 'Bark', tint: '#4a3a2a' }, { name: 'Bone', tint: '#5a5a4a' }],
  pool: ['glass_web', 'tongue_lash', 'venom_fang', 'snare', 'backstab'] });
en({ id: 'wyvern', name: 'Wyvern', species: 'beast', portrait: 'drake', equips: 3, statMult: 1.15,
  skins: [{ name: 'Green', tint: '#2a4a2a' }, { name: 'Brown', tint: '#4a3a2a' }, { name: 'Grey', tint: '#4a4a4a' }],
  pool: ['raptor_shred', 'rot_wing', 'rime_breath', 'venom_fang', 'counter_attack'] });
en({ id: 'sewer_crawler', name: 'Sewer Crawler', species: 'beast', portrait: 'beetle', equips: 2,
  skins: [{ name: 'Wet', tint: '#2a3a3a' }, { name: 'Pale', tint: '#5a5a4a' }, { name: 'Oil', tint: '#1a1a1a' }],
  pool: ['pincer_lock', 'carapace_burst', 'venom_fang', 'backstab', 'snare'] });
en({ id: 'sewer_ogre', name: 'Sewer Ogre', species: 'beast', portrait: 'troll', equips: 3, statMult: 1.2,
  skins: [{ name: 'Green', tint: '#3a4a2a' }, { name: 'Grey', tint: '#4a4a4a' }, { name: 'Scab', tint: '#4a2a2a' }],
  pool: ['boulder_smash', 'fault_line', 'cleave', 'mace_swing', 'taunt'] });
en({ id: 'phase_spider', name: 'Phase Spider', species: 'beast', portrait: 'spider', equips: 3, statMult: 1.1,
  skins: [{ name: 'Blue', tint: '#2a3a6a' }, { name: 'Violet', tint: '#4a2a6a' }, { name: 'Pale', tint: '#5a5a6a' }],
  pool: ['glass_web', 'coil_crush', 'shadow_rise', 'venom_fang', 'smoke_bomb'] });
en({ id: 'shadow_double', name: 'Shape-Thief', species: 'human', portrait: 'shadow', equips: 3,
  skins: [{ name: 'Wearing a Face', tint: '#2a2a3a' }, { name: 'Between Faces', tint: '#1a1a2a' }, { name: 'Half-Turned', tint: '#3a2a3a' }],
  pool: ['backstab', 'shadow_rise', 'ghoststep', 'ward_thief', 'bell_silence'] });

// ---------------------------------------------------------------- mini-bosses (§4)
const MB = D.CAMPAIGN_MINIBOSSES;
function mb(o) { o.campaign3 = true; o.faction = 'gate'; MB[o.id] = o; }
mb({ id: 'nib', name: 'Nib', base: 'hired_knife', signature: 'backstab', equips: 3 });
mb({ id: 'cobb', name: 'Cobb', base: 'hired_knife', signature: 'venom_fang', equips: 3 });
mb({ id: 'kobold_chief', name: 'Kobold Chief', base: 'kobold_shaman', signature: 'fire_bolt', equips: 4 });
mb({ id: 'gnoll_warleader', name: 'Snarl, Gnoll Warleader', base: 'gnoll_raider', signature: 'cleave', equips: 4 });
mb({ id: 'verlan', name: 'Femi', base: 'consortium_mage', signature: 'frost_touch', equips: 4 });
mb({ id: 'skarn', name: 'Skarn Maul', base: 'hob_sergeant', signature: 'dual_swords', equips: 4 });
mb({ id: 'hroth', name: 'Hroth Ironbark', base: 'hob_sergeant', signature: 'shield_wall', equips: 4 });
mb({ id: 'silksa', name: 'Silksa, Spider Queen', base: 'web_spider', signature: 'venom_fang', equips: 4 });
mb({ id: 'kestrel', name: 'Kestrel', base: 'consortium_guard', signature: 'sunder', equips: 4 });
mb({ id: 'wyvern_matriarch', name: 'Wyvern Matriarch', base: 'wyvern', signature: 'venom_fang', equips: 4 });
mb({ id: 'sewer_ogre_mage', name: 'The Ogre Under the Docks', base: 'sewer_ogre', signature: 'cleave', equips: 4 });
mb({ id: 'lantern_master', name: 'The Master of Lanterns', base: 'shadow_double', signature: 'shadow_rise', equips: 5 });
mb({ id: 'tower_captain', name: 'Captain of the Tower', base: 'consortium_guard', signature: 'shield_wall', equips: 5 });
mb({ id: 'family_double', name: 'A Face You Know', base: 'shadow_double', signature: 'backstab', equips: 4, count: 2 });
mb({ id: 'hall_doubles', name: 'Ducal Guard', base: 'palace_doppelganger', signature: 'shadow_rise', equips: 4, count: 2 });
mb({ id: 'bought_sergeants', name: "Marr's Sergeants", base: 'gauntlet_traitor', signature: 'cleave', equips: 4, count: 2 });
mb({ id: 'altar_keepers', name: 'Keepers of the Altar', base: 'morrak_cultist', signature: 'raise', equips: 4, count: 2 });
mb({ id: 'your_own_faces', name: 'Your Own Faces', base: 'shadow_double', signature: 'backstab', equips: 5, count: 3 });
mb({ id: 'umbral_pair', name: 'The Umbral Hand', base: 'hired_knife', signature: 'venom_fang', equips: 4, count: 2 });

// ---------------------------------------------------------------- quests (§4)
// tier drives enemy levels / pay; `enc` are spawn specs read by C3.spawnEncounter.
// Spec fields beyond campaign2's: `variants` (flag -> spec, resolved at spawn),
// `escapes` (the named boss walks off at 0 HP instead of dying), `label`.
// Beats and choices are wired in campaign3_dialogue.js (CAMPAIGN3_SCRIPT).
D.CAMPAIGN3_QUESTS = [
  { n: 1, name: 'The Road from Lanternhold', tier: 1, chapter: 'Prologue', travel: 'road',
    brief: 'Tesfaye says the two of you leave before dawn. He does not say why. Two men in the keep have already tried to make sure you never find out.',
    enc: [
      { mini: 'nib', label: 'The storehouse' },
      { mini: 'cobb', with: ['hired_knife'], label: 'The priests\' quarters' },
      { types: ['hired_knife', 'hired_knife', 'consortium_mage'], label: 'The Griffon Road, after dark' },
    ] },
  { n: 2, name: 'The Open Hand', tier: 1, chapter: 'Chapter 1', travel: 'road',
    brief: "Tesfaye's letter names an inn and two friends. The road there has wolves, a squire hunting them, and a mage on the steps who knows your face.",
    enc: [
      { types: ['road_wolf', 'road_wolf'], label: 'The Shore Road' },
      { types: ['road_wolf', 'road_wolf', 'road_wolf'], label: 'The wolf den' },
      { boss: 'morwin', with: ['hired_knife'], label: 'The steps of the Open Hand' },
    ] },
  { n: 3, name: 'South to Dunmere', tier: 1, chapter: 'Chapter 2', travel: 'road',
    brief: 'The tainted iron comes from the Dunmere mines. Between here and there: Thornbury, an elf with a grudge, a knife in an inn, and a gnoll fortress with a witch in it.',
    enc: [
      { boss: 'lessa', with: ['hired_knife'], label: 'The Dunmere inn' },
      { types: ['gnoll_raider', 'gnoll_raider', 'bandit_archer'], label: 'The river crossing' },
      { variants: { aurelius: { boss: 'bramm', with: ['gnoll_raider', 'gnoll_raider'], escapes: true, label: 'Bahadır blocks the road' } },
        mini: 'gnoll_warleader', with: ['gnoll_raider', 'gnoll_raider'], label: 'The gnoll fortress' },
    ] },
  { n: 4, name: 'The Dunmere Mines', tier: 2, chapter: 'Chapter 2', travel: 'crypt',
    brief: 'The miners will not go down. Whatever is fouling the ore is four levels below, and it has a priest.',
    enc: [
      { types: ['tunnel_kobold', 'tunnel_kobold', 'tunnel_kobold'], label: 'The first level' },
      { types: ['tunnel_kobold', 'kobold_shaman', 'tunnel_kobold'], label: 'The flooded level' },
      { mini: 'kobold_chief', with: ['tunnel_kobold', 'veylan_acolyte'], label: 'The third level' },
      { boss: 'grukhar', with: ['veylan_acolyte', 'tunnel_kobold', 'tunnel_kobold'], label: "Grukhar's chamber" },
    ] },
  { n: 5, name: 'The Bandit Camp', tier: 2, chapter: 'Chapter 3', travel: 'forest',
    brief: "Grukhar's letters name a courier in Thornbury and a lord of bandits in the Gnashing Wood. Yohannes says go north. He does not say it will be pleasant.",
    enc: [
      { mini: 'verlan', with: ['hired_knife'], label: "Hollister's Inn" },
      { types: ['gauntlet_soldier', 'gauntlet_soldier', 'gauntlet_soldier'], label: 'Holloway Vale' },
      { mini: 'skarn', with: ['hob_sergeant', 'gate_bandit', 'bandit_archer'], label: 'The palisade' },
      { boss: 'gorruk', with: ['hob_sergeant', 'bandit_archer', 'gate_bandit'], escapes: true, label: "Gorruk's tent" },
    ] },
  { n: 6, name: 'Mirkhollow', tier: 2, chapter: 'Chapter 4', travel: 'forest',
    brief: 'The letters point into the Mirkhollow: spiders, druids who consider you trespass, wyverns, and a mine that is not on any map.',
    enc: [
      { mini: 'silksa', with: ['web_spider', 'web_spider'], label: 'The nest' },
      // Wanjiru calls the Mzee and then used to vanish from her own fight. She stands in it now.
      // `escapes` because these are not bandits: at 0 HP the Umbra withdraw into the wood rather
      // than die on the path, the win still scores, and a player who picked the fight is not made
      // to leave an archdruid and a would-be companion dead over right of way.
      { boss: 'thornwise', with: ['umbra_druid', 'umbra_druid', 'nettle'], escapes: true, label: 'The druid grove' },
      { mini: 'wyvern_matriarch', with: ['wyvern'], label: 'The wyvern cliffs' },
      { mini: 'kestrel', with: ['consortium_guard', 'consortium_mage'], label: 'The mine gate' },
    ] },
  { n: 7, name: 'The Iron Mine', tier: 2, chapter: 'Chapter 4', travel: 'crypt',
    brief: "The Consortium's secret mine, worked by slaves under a mage named Olamide. There is a valve at the bottom that can drown all of it.",
    enc: [
      { types: ['consortium_guard', 'slave_driver', 'consortium_guard'], label: 'The upper works' },
      { types: ['slave_driver', 'slave_driver', 'consortium_mage'], label: 'The cages' },
      { types: ['consortium_guard', 'consortium_mage', 'veylan_acolyte'], label: 'The third level' },
      { boss: 'malvane', with: ['consortium_guard', 'consortium_guard', 'consortium_mage'], label: "Olamide's study" },
      { types: ['consortium_guard', 'consortium_guard', 'consortium_mage', 'slave_driver'], label: 'The valve room' },
    ] },
  { n: 8, name: "Varenholm's Gate", tier: 3, chapter: 'Chapter 5', travel: 'city',
    brief: "Serpent's Span, the checkpoint, and the city at last. A Burning Gauntlet officer wants something in the sewers dead and a trading house looked at.",
    enc: [
      { mini: 'sewer_ogre_mage', with: ['sewer_crawler', 'sewer_crawler'], label: 'The sewers' },
      { types: ['consortium_guard', 'hired_knife'], label: 'The Nine Lanterns door' },
      { types: ['shadow_double', 'shadow_double', 'hired_knife'], label: 'The counting room' },
      { mini: 'lantern_master', with: ['shadow_double', 'shadow_double'], label: 'The upper office' },
    ] },
  { n: 9, name: 'The Consortium Tower', tier: 3, chapter: 'Chapter 5', travel: 'city',
    brief: "The mine's orders lead to the Iron Consortium's headquarters. Adebayo wants their records. Inside, a well-dressed merchant offers help and asks you to stop his father.",
    enc: [
      { types: ['consortium_guard', 'consortium_guard'], label: 'The lobby' },
      { variants: { umbralBetrayed: { mini: 'umbral_pair', with: ['consortium_guard'], label: 'The counting floor — old friends' } },
        types: ['consortium_guard', 'consortium_mage', 'consortium_guard'], label: 'The counting floor' },
      { types: ['consortium_mage', 'consortium_guard', 'hired_knife'], label: "Folake's floor" },
      { mini: 'tower_captain', with: ['consortium_mage', 'consortium_mage', 'consortium_guard'], label: 'The top floor' },
    ] },
  { n: 10, name: 'Return to Lanternhold', tier: 3, chapter: 'Chapter 6', travel: 'crypt',
    brief: 'The keepers are hearing the dispute over poisoned iron. Take the Consortium\'s orders to Lanternhold, confront Adigun and his partners, and find out where Kolade has gone.',
    enc: [
      { types: ['consortium_guard', 'consortium_guard', 'hired_knife'], label: 'The reading rooms' },
      { boss: 'maddox', with: ['vask', 'rennick', 'consortium_guard'], label: 'The summit', named: ['vask', 'rennick'] },
      { boss: 'grell', with: ['hired_knife', 'hired_knife'], label: 'The catacombs' },
      { mini: 'family_double', with: ['shadow_double'], label: 'The crypt of faces' },
      { types: ['phase_spider', 'tomb_ghoul', 'tomb_ghoul'], label: 'The way out' },
    ] },
  { n: 11, name: 'The Hunted City', tier: 3, chapter: 'Chapter 7', travel: 'alley',
    brief: 'Wanted posters carry your face. Emeka Obi is dead, Segun Marr commands the Gauntlet, and Duke Adebayo is dying under the care of a physician who is not a physician.',
    enc: [
      { types: ['gauntlet_soldier', 'gauntlet_soldier', 'gauntlet_traitor'], label: 'The patrol' },
      { boss: 'idris', with: ['shadow_double', 'gauntlet_traitor'], label: "Adebayo's sick-room" },
      { boss: 'amara', with: [], escapes: true, label: 'The docks' },
      { boss: 'ravel', with: ['kessa', 'hired_knife'], label: 'The Undervault', named: ['kessa'] },
    ] },
  { n: 12, name: 'The Coronation', tier: 3, chapter: 'Chapter 7', travel: 'city',
    brief: "Kolade will be sworn in as Grand Duke tonight and declare war on Calder by morning. You have an invitation, the evidence, and a company in borrowed clothes.",
    enc: [
      { mini: 'hall_doubles', with: ['palace_doppelganger'], label: 'The great hall' },
      { types: ['palace_doppelganger', 'palace_doppelganger', 'shadow_double'], label: 'The dais' },
      { types: ['consortium_mage', 'consortium_mage', 'hired_knife'], label: "Olusegun's rear-guard" },
    ] },
  { n: 13, name: 'The Undercity', tier: 3, chapter: 'Chapter 7', travel: 'ruins',
    brief: "Under the thieves' maze is an older city, and under that is a temple. Kolade's people are between you and it. So is the one who loves him.",
    enc: [
      { types: ['hired_knife', 'hired_knife', 'bandit_archer'], label: "The thieves' maze" },
      { boss: 'amara', with: [], escapes: true, label: 'The gate of the Undercity' },
      { boss: 'jarem', with: ['morrak_cultist', 'morrak_cultist'], label: 'The buried street' },
      { variants: { gorrukDead: { types: ['consortium_guard', 'consortium_mage', 'hired_knife'], label: 'Consortium remnants' } },
        boss: 'gorruk', with: ['hob_sergeant', 'hob_sergeant'], label: 'Gorruk, again' },
      { boss: 'lucan', with: ['gauntlet_traitor', 'gauntlet_traitor'], label: 'The temple steps' },
    ] },
  { n: 14, name: 'The Temple of Morrak', tier: 'boss', chapter: 'Chapter 7', travel: 'crypt',
    brief: 'The last room. Your brother is waiting at the altar of a dead god, and he is glad you came.',
    enc: [
      { mini: 'altar_keepers', with: ['morrak_cultist'], label: 'The outer sanctum' },
      { mini: 'your_own_faces', label: 'The hall of mirrors' },
      { boss: 'korvath', with: ['morrak_cultist', 'morrak_cultist', 'consortium_mage'], label: 'The altar' },
    ] },
];

// Map quest travel keys to TRAVEL_LOCATIONS ids that exist (travel.js falls back to road).
D.CAMPAIGN3_TRAVEL = { road: 'road', crypt: 'crypt', forest: 'forest', city: 'city', alley: 'alley', ruins: 'ruins' };

// The score (audio/music/vg_<cue>.mp3, generated by tools/gen_c3_music.py). One
// underscore per quest carries every screen and line of dialogue; the battle
// cue is heard only inside a fight (Quests 1–7 the road cue, 8–14 the city
// cue, with named quest overrides below); `boss` is Kolade at the altar;
// `dream` and `ending` are scene cues; `camp` is the hub while the campaign
// is under way. The Bandit Camp addition is recorded by tools/gate_music/compose.py.
D.CAMPAIGN3_MUSIC = {
  quest: { 1: 'vg_lanternhold', 2: 'vg_shore_road', 3: 'vg_thornbury', 4: 'vg_mines', 5: 'vg_gnashing_wood',
           6: 'vg_mirkhollow', 7: 'vg_iron_mine', 8: 'vg_gate_city', 9: 'vg_consortium', 10: 'vg_catacombs',
           11: 'vg_hunted', 12: 'vg_coronation', 13: 'vg_undercity', 14: 'vg_temple' },
  combat: { road: 'vg_battle', city: 'vg_battle_city' },
  combatByQuest: { 5: 'vg_battle_bandit_camp' },
  cityFrom: 8,
  boss: 'vg_boss', dream: 'vg_dream', ending: 'vg_ending', camp: 'vg_camp',
};

// The mirror table the shared coverage test walks (every id must be ours).
const enemyOnly = ids => (ids || []).filter(id => !D.CAMPAIGN_CHARS[id]);   // named actors ride in `with` too
D.CAMPAIGN_QUESTS.gate = D.CAMPAIGN3_QUESTS.map(q => ({ n: q.n, name: q.name, tier: q.tier === 'boss' ? 3 : q.tier, brief: q.brief,
  enc: q.enc.map(e => Object.assign({}, e, { with: enemyOnly((e.with || []).concat(...Object.values(e.variants || {}).map(v => (v.with || []).concat(v.types || [])))) })) }));

// Ending headlines (§5). Bodies are assembled in campaign3_dialogue.js (CAMPAIGN3_EPILOGUE).
D.CAMPAIGN3_ENDINGS = {
  "hero": {
    "title": "The Gate Stands",
    "line": "You stopped Kolade and prevented the war."
  },
  "monster": {
    "title": "A Dangerous Inheritance",
    "line": "Kolade is dead. Morrak's power remains within you."
  },
  "usurper": {
    "title": "The Throne Claimed",
    "line": "You defeated Kolade and took the throne for yourself."
  },
  "mercy": {
    "title": "Kolade in Chains",
    "line": "You brought him back alive to answer for his crimes."
  },
  "ascetic": {
    "title": "An Unfinished Reckoning",
    "line": "You refused the throne and left Kolade alive."
  }
};
})();
