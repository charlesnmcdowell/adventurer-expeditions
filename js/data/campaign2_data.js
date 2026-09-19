// Ninja vs Pirates content data (add-on §1, §2, §4, §5, §7). Extends the
// shared campaign tables so ADV.Campaign's generic spawner/actor helpers work
// on these factions unchanged. Dialogue lives in campaign2_dialogue.js.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

// ---------------------------------------------------------------- factions (§1)
// campaign2: joinable alongside other campaign2 factions if alignment permits.
Object.assign(ADV.DATA.FACTIONS, {
  bell: {
    id: 'bell', name: 'The Hollow Bell', short: 'the Bell', alignment: 'neutral', campaign2: true,
    hall: "Obaa-San's paper shop", archetypes: ['rogue', 'ranger'],
    recruiter: 'obaasan', rival: 'suzume', boss: 'kaede', antagonist: 'jiro',
    titles: ['Of the Bell', 'Bell-Sworn', "The Bell's Own Hand"],
    gearSet: 'shinobi_gear', gate: { contracts: 0, alignment: null },
    opposed: 'green',
    blurb: 'A clan that survived by never being anywhere. They take contracts from anyone and remember every one.',
  },
  green: {
    id: 'green', name: 'The Green-Eyed', short: 'the Green-Eyed', alignment: 'law', campaign2: true,
    hall: "The Green-Eyed practice hall", archetypes: ['fighter', 'tank'],
    recruiter: 'takeda', rival: 'ayame', boss: 'isamu', antagonist: 'kira',
    titles: ['Green Cord', 'Sworn Blade', 'Blade of the Clan'],
    gearSet: 'green_eyed_armour', gate: { contracts: 3, alignment: 'law' },
    opposed: 'bell',
    blurb: "A clan that serves the city's law and considers that service its identity. Rigid, honourable, and responsible for more grief than it admits.",
  },
  tally: {
    id: 'tally', name: 'The Red Tally', short: 'the Tally', alignment: 'criminal', campaign2: true,
    hall: 'The Red Tally counting house', archetypes: ['ranger', 'rogue'],
    recruiter: 'hallow', rival: 'beau', boss: 'saintcloud', antagonist: 'vanekessler',
    titles: ['On the Tally', 'Full Share', "Captain's Portion"],
    gearSet: 'privateers_kit', gate: { contracts: 3, alignment: 'criminal' },
    opposed: 'navy',
    blurb: 'A fleet held together by a ledger. Every share is recorded and every crime is a line item.',
  },
  navy: {
    id: 'navy', name: 'The Admiralty', short: 'the Admiralty', alignment: 'law', campaign2: true,
    hall: 'The Admiralty receiving room', archetypes: ['fighter', 'mage'],
    recruiter: 'crell', rival: 'fane', boss: 'vanekessler', antagonist: 'ash',
    titles: ['Rated Hand', 'Warranted Officer', "King's Own"],
    gearSet: 'kings_uniform', gate: { contracts: 3, alignment: 'law' },
    opposed: 'tally',
    blurb: 'A navy that considers the sea a jurisdiction. Uniformed, funded, and slower than what it hunts.',
  },
});
ADV.DATA.CAMPAIGN2_FACTION_IDS = ['bell', 'green', 'tally', 'navy'];

// Gear sets (§5): floor 15, advance three archetypes, issued not sold.
Object.assign(ADV.DATA.GEAR_SETS, {
  shinobi_gear:      { name: 'Shinobi Gear',       archetypes: ['rogue', 'druid', 'mage'],     cost: 0, floor: 15, advanceTier: true, campaign: 'bell' },
  green_eyed_armour: { name: 'Green-Eyed Armour',  archetypes: ['fighter', 'tank', 'ranger'],  cost: 0, floor: 15, advanceTier: true, campaign: 'green' },
  privateers_kit:    { name: "Privateer's Kit",    archetypes: ['rogue', 'fighter', 'druid'],  cost: 0, floor: 15, advanceTier: true, campaign: 'tally' },
  kings_uniform:     { name: "King's Uniform",     archetypes: ['ranger', 'tank', 'healer'],   cost: 0, floor: 15, advanceTier: true, campaign: 'navy' },
});

// ---------------------------------------------------------------- characters (§2)
const CH = ADV.DATA.CAMPAIGN_CHARS;
function chr(o) { o.campaign2 = true; CH[o.id] = o; }

// 2a — The Hollow Bell
chr({ id: 'obaasan', name: 'Obaa-San', faction: 'bell', role: 'recruiter', sex: 'f', fights: false,
  perks: ['sixty_years'], actives: ['crow_sight', 'silent_trade'], level: 30,
  portrait: { skin: 'tan', hair: 'bun', wardrobe: 'robe', color: '#4a4438' } });
chr({ id: 'suzume', name: 'Suzume', faction: 'bell', role: 'rival', sex: 'f', campaignExit: true, level: 20,
  perks: ['hollow_discipline'], actives: ['shuriken_fan', 'smoke_step', 'kunai_line', 'bell_silence', 'fox_form'],
  portrait: { skin: 'tan', hair: 'ponytail', wardrobe: 'ninja', color: '#2a2d36' },
  exitLines: ['Fine. You finish it. I have made my point.', 'Aim high on the next one — they all watch the hands.', "I'm not down. I'm repositioning. There's a difference."] });
chr({ id: 'kaede', name: 'Kaede', epithet: 'the Bell-Keeper', faction: 'bell', role: 'boss', sex: 'f', campaignExit: true, level: 28,
  perks: ['fifty_names'], actives: ['bell_silence', 'blood_lotus', 'smoke_step', 'shuriken_fan', 'iron_fan_guard', 'paper_charm'],
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'robe', color: '#3a3644' } });
chr({ id: 'jiro', name: 'Jiro', epithet: 'the Unquiet', faction: 'bell', role: 'antagonist', sex: 'm', level: 28,
  perks: ['fifty_names', 'hollow_discipline'], actives: ['chain_and_weight', 'bell_silence', 'kunai_line', 'shuriken_fan', 'blood_lotus'],
  undead: true, trueRestImmune: true, statMult: 1.35,
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'ninja', color: '#26262a' } });

// 2b — The Green-Eyed
chr({ id: 'takeda', name: 'Master Takeda', faction: 'green', role: 'recruiter', sex: 'm', fights: false,
  perks: ['unbroken_form'], actives: ['rising_cut', 'reading_the_field'], level: 30,
  portrait: { skin: 'tan', hair: 'bun', wardrobe: 'armor', color: '#3f4a38' } });
chr({ id: 'ayame', name: 'Ayame', faction: 'green', role: 'rival', sex: 'f', campaignExit: true, level: 22,
  perks: ['green_discipline'], actives: ['iai_draw', 'rising_cut', 'crossing_guard', 'bear_stance', 'measured_shot'],
  portrait: { skin: 'fair', hair: 'ponytail', wardrobe: 'armor', color: '#4a5a3a' },
  exitLines: ['My footing went. Finish the form.', 'The one in front guards high and steps wide. Use it.', 'I am not finished. I am kneeling. They are different.'] });
chr({ id: 'isamu', name: 'Lord Isamu', faction: 'green', role: 'boss', sex: 'm', campaignExit: true, level: 28,
  perks: ['the_clan_watches'], actives: ['iai_draw', 'stone_stance', 'kiai', 'crossing_guard', 'rising_cut', 'field_honour'],
  portrait: { skin: 'fair', hair: 'bun', wardrobe: 'armor', color: '#2f3a2a' } });
chr({ id: 'kira', name: 'Tomoe', epithet: 'the Widow', faction: 'green', role: 'antagonist', sex: 'f', level: 29,
  perks: ['unbroken_form', 'green_discipline'], actives: ['iai_draw', 'rising_cut', 'measured_shot', 'bear_stance', 'stone_stance'],
  portrait: { skin: 'pale', hair: 'long', wardrobe: 'ninja', color: '#2a2630' } });

// 2c — The Red Tally
chr({ id: 'hallow', name: 'Quartermaster Cask', faction: 'tally', role: 'recruiter', sex: 'm', fights: false,
  perks: ['shares_and_plunder'], actives: ['reading_the_tally', 'black_flag'], level: 26,
  portrait: { skin: 'brown', hair: 'dreads', wardrobe: 'suit', color: '#5a3a2a' } });
chr({ id: 'beau', name: 'Beau Castell', faction: 'tally', role: 'rival', sex: 'm', campaignExit: true, level: 21,
  perks: ['powder_discipline'], actives: ['flintlock_shot', 'grapeshot', 'cutlass_work', 'boarding_hook', 'sea_dog_form'],
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'suit', color: '#6a2a2a' },
  exitLines: ["I'm out of powder, not out of opinions. Go on.", 'Left one first. He flinches and the rest follow him.', 'That was a lucky swing and I want it on the record.'] });
chr({ id: 'saintcloud', name: 'Captain Meriel Saint-Cloud', faction: 'tally', role: 'boss', sex: 'f', campaignExit: true, level: 28,
  perks: ['shares_and_plunder'], actives: ['flintlock_shot', 'chain_shot', 'cutlass_work', 'fire_ship', 'boarding_plate', 'rum_ration'],
  portrait: { skin: 'brown', hair: 'braids', wardrobe: 'suit', color: '#7a2a3a' } });
// Kessler: the Tally's antagonist AND the Admiralty's boss (§2e).
chr({ id: 'vanekessler', name: 'Admiral August Kessler', faction: 'navy', role: 'boss', sex: 'm', campaignExit: true, level: 30,
  altFaction: 'tally', altRole: 'antagonist',
  perks: ['naval_discipline', 'broadside_doctrine'], actives: ['riposte_line', 'saber_thrust', 'volley_fire', 'ranging_cannon', 'close_order', 'chain_and_bar'],
  portrait: { skin: 'pale', hair: 'short', wardrobe: 'armor', color: '#2a3a5a' } });

// 2d — The Admiralty
chr({ id: 'crell', name: 'Boatswain Crell', faction: 'navy', role: 'recruiter', sex: 'm', fights: false,
  perks: ['naval_discipline'], actives: ['close_order', 'sick_bay'], level: 24,
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hiking', color: '#3a4a5a' } });
chr({ id: 'fane', name: 'Lieutenant Isolde Merrow', faction: 'navy', role: 'rival', sex: 'f', campaignExit: true, level: 21,
  perks: ['naval_discipline'], actives: ['saber_thrust', 'close_order', 'volley_fire', 'signal_flags', 'marine_form'],
  portrait: { skin: 'fair', hair: 'bun', wardrobe: 'armor', color: '#3a4a7a' },
  exitLines: ['I am off my feet, not out of the fight. Continue.', 'Their gunner reloads on the second round. Take him then.', 'Note the time. I will want it in the report.'] });
chr({ id: 'ash', name: 'Dorian Ash', epithet: 'the Tide-Taker', faction: 'navy', role: 'antagonist', sex: 'm', level: 29,
  perks: ['powder_discipline', 'sea_legs'], actives: ['flintlock_shot', 'boarding_hook', 'cutlass_work', 'grapeshot', 'fire_ship'],
  portrait: { skin: 'tan', hair: 'long', wardrobe: 'suit', color: '#3a2a4a' } });

// God line (§7) — not faction characters; they speak once and fight once.
chr({ id: 'pale_mother', name: 'The Pale Mother', faction: 'god', role: 'god', sex: 'f', level: 34, godLine: true, domain: 'death',
  perks: ['devoted', 'bulwark', 'see_invisibility'],
  actives: ['necromancy', 'whisper_of_ending', 'blood_pact', 'mend', 'blood_lotus', 'vital_anchor'],
  raisesTheDead: true, statMult: 1.6,
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'dress', color: '#d8d4cc' } });
chr({ id: 'drowned_king', name: 'The Drowned King', faction: 'god', role: 'god', sex: 'm', level: 34, godLine: true, domain: 'chaos',
  perks: ['bulwark', 'momentum', 'sea_legs'],
  actives: ['riposte_line', 'stone_stance', 'paid_in_full', 'chain_and_bar', 'boarding_hook', 'grapeshot'],
  statMult: 1.6,
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'armor', color: '#1f3a44' } });
chr({ id: 'first_bloom', name: 'The First Bloom', faction: 'god', role: 'god', sex: 'f', level: 34, godLine: true, domain: 'life',
  perks: ['devoted', 'wild_form', 'see_invisibility'],
  actives: ['mend', 'regenerate', 'thorn_skin', 'beast_shape', 'blood_pact', 'guardian_ward'],
  statMult: 1.6,
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'dress', color: '#5d8a4a' } });

// ---------------------------------------------------------------- enemies (§4)
// Three skins each: a name + palette variant chosen at spawn.
const EN = ADV.DATA.CAMPAIGN_ENEMIES;
function en(o) { o.campaign2 = true; EN[o.id] = o; }

// 4a — against the Hollow Bell
en({ id: 'bell_initiate', name: 'Bell-Initiate', faction: 'bell', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Grey Wrap', tint: '#4a4a52' }, { name: 'Bound Sleeve', tint: '#3a3a44' }, { name: 'Ash-Marked', tint: '#5a5248' }],
  pool: ['shuriken_fan', 'smoke_step', 'kunai_line', 'field_suture', 'silent_trade'] });
en({ id: 'clan_watcher', name: 'Clan Watcher', faction: 'bell', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Rooftop', tint: '#2a3040' }, { name: 'Well-Shadow', tint: '#232a2a' }, { name: 'Lantern-Out', tint: '#3a3228' }],
  pool: ['crow_sight', 'bell_silence', 'paper_charm', 'blood_lotus', 'fox_form'] });
en({ id: 'chain_hand', name: 'Chain-Hand', faction: 'bell', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: 'Weighted', tint: '#4a4438' }, { name: 'Twin-Chain', tint: '#3f3f46' }, { name: 'Hook-and-Line', tint: '#524634' }],
  pool: ['chain_and_weight', 'iron_fan_guard', 'kunai_line', 'smoke_step', 'hollow_discipline'] });
en({ id: 'poison_sister', name: 'Poison Sister', faction: 'bell', species: 'human', portrait: 'hedge_mage', equips: 3,
  skins: [{ name: 'White Sleeve', tint: '#6a6a72' }, { name: 'Nine-Petal', tint: '#4a2a52' }, { name: 'Lotus-Marked', tint: '#5a2a3a' }],
  pool: ['blood_lotus', 'paper_charm', 'breath_of_the_bell', 'field_suture', 'fox_form'] });
en({ id: 'the_refused', name: 'The Refused', faction: 'bell', species: 'human', portrait: 'grave_acolyte', equips: 0,
  skins: [{ name: 'Split-Mask', tint: '#2a2a30' }, { name: 'Rope-Bound', tint: '#3a3228' }, { name: 'Bell-Silent', tint: '#26303a' }],
  pool: [], undead: true, statMult: 1.5, statusImmunities: ['poison', 'bleed', 'burn'] });

// 4b — against the Green-Eyed
en({ id: 'green_recruit', name: 'Green Recruit', faction: 'green', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Undyed', tint: '#6a6a5a' }, { name: 'Half-Plate', tint: '#5a6a4a' }, { name: 'First-Season', tint: '#4a5a42' }],
  pool: ['rising_cut', 'crossing_guard', 'kiai', 'field_honour', 'unbroken_form'] });
en({ id: 'clan_archer', name: 'Clan Archer', faction: 'green', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Long Sleeve', tint: '#3a4a32' }, { name: 'Standing', tint: '#42523a' }, { name: 'Horse-Bow', tint: '#52462a' }],
  pool: ['longbow_volley', 'measured_shot', 'reading_the_field', 'ash_ward', 'kiai'] });
en({ id: 'stone_bannerman', name: 'Stone Bannerman', faction: 'green', species: 'construct', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: 'Full Plate', tint: '#7a7a6a' }, { name: 'Standard-Bearer', tint: '#5a6a3a' }, { name: 'Broken Banner', tint: '#4a4238' }],
  pool: ['stone_stance', 'bear_stance', 'the_clan_watches', 'crossing_guard', 'unbroken_form'] });
en({ id: 'sworn_blade', name: 'Sworn Blade', faction: 'green', species: 'human', portrait: 'bandit', equips: 3,
  skins: [{ name: 'Green Cord', tint: '#3a5a3a' }, { name: 'Two Swords', tint: '#2f4a2f' }, { name: 'Scarred', tint: '#4a3a2a' }],
  pool: ['iai_draw', 'rising_cut', 'bear_stance', 'standing_order', 'green_discipline'] });
en({ id: 'clan_physician', name: 'Clan Physician', faction: 'green', species: 'human', portrait: 'hedge_mage', equips: 3,
  skins: [{ name: 'Grey Robe', tint: '#5a5a52' }, { name: 'Field Kit', tint: '#4a5248' }, { name: 'Old Hands', tint: '#62584a' }],
  pool: ['field_honour', 'clan_blood', 'ash_ward', 'crossing_guard', 'reading_the_field'] });

// 4c — against the Red Tally
en({ id: 'tally_hand', name: 'Tally Hand', faction: 'tally', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Sun-Bleached', tint: '#8a7a5a' }, { name: 'Tar-Stained', tint: '#3a3228' }, { name: 'New Coat', tint: '#6a2a2a' }],
  pool: ['cutlass_work', 'boarding_hook', 'sea_legs', 'grapeshot', 'rum_ration'] });
en({ id: 'powder_monkey', name: 'Powder Monkey', faction: 'tally', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Soot-Faced', tint: '#2a2a2a' }, { name: 'Bandaged', tint: '#7a7268' }, { name: 'Barefoot', tint: '#5a4a3a' }],
  pool: ['powder_keg', 'fire_ship', 'grapeshot', 'flintlock_shot', 'powder_discipline'] });
en({ id: 'gun_captain', name: 'Gun Captain', faction: 'tally', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: 'Brass-Buttoned', tint: '#8a6a2a' }, { name: 'Eye-Patch', tint: '#4a3a2a' }, { name: 'Long Coat', tint: '#5a2a3a' }],
  pool: ['flintlock_shot', 'chain_shot', 'boarding_plate', 'powder_discipline', 'fire_ship'] });
en({ id: 'ships_surgeon', name: "Ship's Surgeon", faction: 'tally', species: 'human', portrait: 'hedge_mage', equips: 3,
  skins: [{ name: 'Apron', tint: '#7a6a5a' }, { name: 'Bone Saw', tint: '#5a4a4a' }, { name: 'Rum-Steady', tint: '#6a4a2a' }],
  pool: ['surgeons_saw', 'rum_ration', 'reading_the_tally', 'grapeshot', 'sea_legs'] });
en({ id: 'sea_dog', name: 'Sea-Dog', faction: 'tally', species: 'human', portrait: 'bandit', equips: 3,
  skins: [{ name: 'Salt-Crusted', tint: '#6a7a7a' }, { name: 'Tattooed', tint: '#3a4a5a' }, { name: 'Grey Beard', tint: '#7a7a72' }],
  pool: ['sea_dog_form', 'cutlass_work', 'boarding_plate', 'black_flag', 'shares_and_plunder'] });

// 4d — against the Admiralty
en({ id: 'pressed_hand', name: 'Pressed Hand', faction: 'navy', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Slop Chest', tint: '#5a5a6a' }, { name: 'Barefoot', tint: '#4a4a52' }, { name: 'Shorn', tint: '#6a6a72' }],
  pool: ['saber_thrust', 'close_order', 'sick_bay', 'marine_form', 'naval_discipline'] });
en({ id: 'marine_of_the_line', name: 'Marine of the Line', faction: 'navy', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Red Coat', tint: '#8a2a2a' }, { name: 'White Belt', tint: '#9a9a92' }, { name: 'Bayonet', tint: '#6a2a2a' }],
  pool: ['volley_fire', 'close_order', 'marine_form', 'chain_and_bar', 'broadside_doctrine'] });
en({ id: 'gunnery_officer', name: 'Gunnery Officer', faction: 'navy', species: 'human', portrait: 'hedge_mage', equips: 3,
  skins: [{ name: 'Blue Coat', tint: '#2a3a7a' }, { name: 'Glass', tint: '#3a4a6a' }, { name: 'Powder-Burned', tint: '#3a3230' }],
  pool: ['ranging_cannon', 'chain_and_bar', 'flare', 'volley_fire', 'broadside_doctrine'] });
en({ id: 'signal_officer', name: 'Signal Officer', faction: 'navy', species: 'human', portrait: 'hedge_mage', equips: 3,
  skins: [{ name: 'Flag Locker', tint: '#2a5a6a' }, { name: 'Speaking Trumpet', tint: '#5a5a2a' }, { name: 'Young', tint: '#3a4a7a' }],
  pool: ['signal_flags', 'chart_the_water', 'flare', 'sick_bay', 'articles_of_war'] });
en({ id: 'ships_master', name: "Ship's Master", faction: 'navy', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: 'Grey Coat', tint: '#5a5a5a' }, { name: 'Charts', tint: '#6a6252' }, { name: 'Weathered', tint: '#4a5252' }],
  pool: ['riposte_line', 'saber_thrust', 'chart_the_water', 'sick_bay', 'colours_and_papers'] });

// God-line enemies: the drowned dead of both sea factions, standing together.
en({ id: 'drowned_hand', name: 'Drowned Hand', faction: 'god', species: 'human', portrait: 'grave_acolyte', equips: 2,
  skins: [{ name: 'Still in Colours', tint: '#2a4a4a' }, { name: 'Weed-Wrapped', tint: '#2a3a2a' }, { name: 'Salt-White', tint: '#6a7272' }],
  pool: ['cutlass_work', 'saber_thrust', 'boarding_hook', 'close_order', 'grapeshot'],
  undead: true, statMult: 1.5, statusImmunities: ['poison', 'bleed', 'burn'] });
en({ id: 'house_guard_terrified', name: 'House Guard', faction: 'god', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Barred Door', tint: '#5a5248' }, { name: 'Will Not Explain', tint: '#4a4238' }, { name: 'Praying', tint: '#5a4a52' }],
  pool: ['close_order', 'crossing_guard', 'field_honour', 'stone_stance', 'saber_thrust'] });
ADV.DATA.CAMPAIGN_ENEMIES = EN;

// ---------------------------------------------------------------- mini-bosses (§4)
const MB = ADV.DATA.CAMPAIGN_MINIBOSSES;
function mb(o) { o.campaign2 = true; MB[o.id] = o; }
// Hollow Bell
mb({ id: 'paper_keeper', name: 'The Paper-Keeper', faction: 'bell', base: 'bell_initiate', signature: 'silent_trade', equips: 4 });
mb({ id: 'watcher_ren', name: 'Watcher Ren', faction: 'bell', base: 'clan_watcher', signature: 'crow_sight', equips: 4, undead: true });
mb({ id: 'the_left_hand', name: 'The Left Hand', faction: 'bell', base: 'chain_hand', signature: 'iron_fan_guard', equips: 5 });
mb({ id: 'two_refused', name: "Jiro's Refused", faction: 'bell', base: 'the_refused', signature: null, equips: 0, count: 2 });
// Green-Eyed
mb({ id: 'instructor_sagara', name: 'Instructor Sagara', faction: 'green', base: 'green_recruit', signature: 'rising_cut', equips: 4 });
mb({ id: 'the_petitioner', name: 'The Petitioner', faction: 'green', base: 'stone_bannerman', signature: 'stone_stance', equips: 4 });
mb({ id: 'blade_captain_doi', name: 'Blade-Captain Doi', faction: 'green', base: 'sworn_blade', signature: 'iai_draw', equips: 5 });
mb({ id: 'kiras_hired', name: "Tomoe's Hired", faction: 'green', base: 'clan_archer', signature: 'measured_shot', equips: 4, count: 2 });
// Red Tally
mb({ id: 'bosun_teague', name: 'Bosun Teague', faction: 'tally', base: 'sea_dog', signature: 'sea_dog_form', equips: 4 });
mb({ id: 'the_factor', name: 'The Factor', faction: 'tally', base: 'gun_captain', signature: 'chain_shot', equips: 4 });
mb({ id: 'captain_ordell', name: 'Captain Ordell', faction: 'tally', base: 'gun_captain', signature: 'flintlock_shot', equips: 5 });
mb({ id: 'marines_of_the_line', name: 'Marines of the Line', faction: 'tally', base: 'marine_of_the_line', signature: 'volley_fire', equips: 4, count: 2 });
// Admiralty
mb({ id: 'masters_mate_holt', name: "Master's Mate Holt", faction: 'navy', base: 'pressed_hand', signature: 'close_order', equips: 4 });
mb({ id: 'smuggler_captain', name: 'The Smuggler-Captain', faction: 'navy', base: 'tally_hand', signature: 'boarding_hook', equips: 4 });
mb({ id: 'commander_nairn', name: 'Commander Nairn', faction: 'navy', base: 'gunnery_officer', signature: 'ranging_cannon', equips: 5 });
mb({ id: 'ashs_boarders', name: "Ash's Boarders", faction: 'navy', base: 'tally_hand', signature: 'boarding_hook', equips: 4, count: 2 });
ADV.DATA.CAMPAIGN_MINIBOSSES = MB;

// ---------------------------------------------------------------- quests (§5)
// 2/2/3/3/3+boss. Rival joins Q3, dies Q4. Boss fights beside you at Q5.
Object.assign(ADV.DATA.CAMPAIGN_QUESTS, {
  bell: [
    { n: 1, name: 'Paper and Ash', tier: 1, brief: 'A man in the merchant quarter is writing our names down. Go and stop him writing.',
      enc: [{ types: ['bell_initiate', 'bell_initiate'] }, { mini: 'paper_keeper', with: ['bell_initiate'] }] },
    { n: 2, name: 'The One Who Watches', tier: 1, brief: 'Someone has followed you for two jobs. I want to know who pays him.',
      enc: [{ types: ['clan_watcher', 'clan_watcher'] }, { mini: 'watcher_ren', with: ['clan_watcher'] }] },
    { n: 3, name: 'The Left Hand', tier: 2, rival: true, brief: 'Kaede wants you measured. {they} is going with you and will make it unpleasant.',
      enc: [{ types: ['clan_watcher', 'chain_hand', 'bell_initiate'] }, { types: ['chain_hand', 'bell_initiate', 'clan_watcher'] }, { mini: 'the_left_hand', with: ['chain_hand', 'bell_initiate'] }] },
    { n: 4, name: 'Twenty Years', tier: 2, rival: true, rivalDies: true, brief: 'Ordinary job. Take the girl and come home.',
      enc: [{ types: ['bell_initiate', 'clan_watcher', 'chain_hand'] }, { types: ['poison_sister', 'clan_watcher', 'bell_initiate'] }, { mini: 'two_refused', with: ['the_refused'] }] },
    { n: 5, name: 'The Bell Does Not Ring', tier: 3, bossAlly: true, brief: 'I ordered him killed twenty years ago. Come and help me finish an old piece of work.',
      enc: [{ types: ['the_refused', 'the_refused', 'clan_watcher'] }, { types: ['the_refused', 'poison_sister', 'chain_hand'] }, { types: ['the_refused', 'the_refused', 'poison_sister', 'clan_watcher'] }, { boss: 'jiro', with: ['the_refused', 'the_refused', 'poison_sister'] }] },
  ],
  green: [
    { n: 1, name: 'First Form', tier: 1, brief: 'Bandits on the north road. The clan wants them gone and I want to watch how you do it.',
      enc: [{ types: ['green_recruit', 'green_recruit'] }, { mini: 'instructor_sagara', with: ['green_recruit'] }] },
    { n: 2, name: 'A Lawful Order', tier: 1, brief: 'A man refuses a lawful summons. Bring him in — alive, and that is not optional.',
      enc: [{ types: ['green_recruit', 'clan_archer'] }, { mini: 'the_petitioner', with: ['stone_bannerman'] }] },
    { n: 3, name: 'Measured', tier: 2, rival: true, brief: '{they} has requested you. Do not embarrass either of us.',
      enc: [{ types: ['green_recruit', 'clan_archer', 'stone_bannerman'] }, { types: ['sworn_blade', 'clan_archer', 'green_recruit'] }, { mini: 'blade_captain_doi', with: ['sworn_blade', 'clan_physician'] }] },
    { n: 4, name: 'The Widow', tier: 2, rival: true, rivalDies: true, brief: "Escort duty. Lord Isamu's cousin. Boring work, good pay.",
      enc: [{ types: ['clan_archer', 'clan_archer', 'green_recruit'] }, { types: ['sworn_blade', 'stone_bannerman', 'clan_archer'] }, { mini: 'kiras_hired' }] },
    { n: 5, name: "The Widow's Forms", tier: 3, bossAlly: true, brief: 'This woman learned our forms alone, in a shed, off a book and a dead man\'s memory. Today she reaches me.',
      enc: [{ types: ['clan_archer', 'sworn_blade', 'green_recruit'] }, { types: ['sworn_blade', 'clan_physician', 'clan_archer'] }, { types: ['stone_bannerman', 'sworn_blade', 'clan_archer', 'green_recruit'] }, { boss: 'kira', with: ['clan_archer', 'clan_archer', 'sworn_blade'] }] },
  ],
  tally: [
    { n: 1, name: 'Full Share', tier: 1, brief: "Somebody's been skimming the tally. Find him and make an example.",
      enc: [{ types: ['tally_hand', 'tally_hand'] }, { mini: 'bosun_teague', with: ['tally_hand'] }] },
    { n: 2, name: 'The Factor', tier: 1, brief: 'A merchant hired guns instead of paying us. Go and collect.',
      enc: [{ types: ['powder_monkey', 'tally_hand'] }, { mini: 'the_factor', with: ['powder_monkey', 'tally_hand'] }] },
    { n: 3, name: 'Two Fleets', tier: 2, rival: true, brief: "Another fleet wants the same prize. {they} is going. Try to keep up with him — he'll say that anyway.",
      enc: [{ types: ['tally_hand', 'gun_captain', 'powder_monkey'] }, { types: ['sea_dog', 'tally_hand', 'gun_captain'] }, { mini: 'captain_ordell', with: ['gun_captain', 'ships_surgeon'] }] },
    { n: 4, name: 'The Prize', tier: 2, rival: true, rivalDies: true, brief: 'Fat merchantman, light escort, no complications.',
      enc: [{ types: ['tally_hand', 'tally_hand', 'powder_monkey'] }, { types: ['gun_captain', 'sea_dog', 'tally_hand'] }, { mini: 'marines_of_the_line', with: ['marine_of_the_line'] }] },
    { n: 5, name: 'Colours Down', tier: 3, bossAlly: true, brief: 'He has hanged my captains and written to me about each one. Today we settle it.',
      enc: [{ types: ['marine_of_the_line', 'pressed_hand', 'pressed_hand'] }, { types: ['marine_of_the_line', 'gunnery_officer', 'pressed_hand'] }, { types: ['marine_of_the_line', 'marine_of_the_line', 'ships_master', 'pressed_hand'] }, { boss: 'vanekessler', with: ['marine_of_the_line', 'marine_of_the_line', 'gunnery_officer'] }] },
  ],
  navy: [
    { n: 1, name: 'Rated Hand', tier: 1, brief: "Smugglers in the shallows. Go and make them stop. I've drowned twice and I'd rather not again.",
      enc: [{ types: ['pressed_hand', 'tally_hand'] }, { mini: 'masters_mate_holt', with: ['pressed_hand'] }] },
    { n: 2, name: 'A Lawful Prize', tier: 1, brief: "There's a captain running cargo without papers. Take the ship, take the papers.",
      enc: [{ types: ['tally_hand', 'powder_monkey'] }, { mini: 'smuggler_captain', with: ['tally_hand', 'sea_dog'] }] },
    { n: 3, name: 'Two Commands', tier: 2, rival: true, brief: "{they} has been given this one and she asked for you, which surprised everyone.",
      enc: [{ types: ['pressed_hand', 'marine_of_the_line', 'signal_officer'] }, { types: ['marine_of_the_line', 'gunnery_officer', 'pressed_hand'] }, { mini: 'commander_nairn', with: ['gunnery_officer', 'ships_master'] }] },
    { n: 4, name: 'Nine Engagements', tier: 2, rival: true, rivalDies: true, brief: "Patrol. Routine. Nobody's seen Ash in the shallows for a month.",
      enc: [{ types: ['tally_hand', 'tally_hand', 'powder_monkey'] }, { types: ['sea_dog', 'gun_captain', 'tally_hand'] }, { mini: 'ashs_boarders', with: ['sea_dog'] }] },
    { n: 5, name: 'The Tenth', tier: 3, bossAlly: true, brief: 'He has beaten us every time we have met. I have read every report. Come with me.',
      enc: [{ types: ['tally_hand', 'sea_dog', 'powder_monkey'] }, { types: ['gun_captain', 'ships_surgeon', 'tally_hand'] }, { types: ['sea_dog', 'gun_captain', 'tally_hand', 'powder_monkey'] }, { boss: 'ash', with: ['sea_dog', 'sea_dog', 'gun_captain'] }] },
  ],
});

// ---------------------------------------------------------------- the god line (§7)
// Two bosses, two routes each, party-only, 1000g halving on repeat.
ADV.DATA.GOD_LINE = {
  gateQuests: 0, basePay: 1000, minPay: 125,
  routes: [
    { id: 'ossuary', boss: 'pale_mother', domain: 'death', escortBoss: 'grave_bishop',
      name: 'The Ossuary',
      brief: 'Death has a name in this city, and she is counting. The bonehouse is open. Every fight on the way down has a warden. At the bottom she waits with one of her bishops.',
      enc: [
        { types: ['grave_touched', 'risen'], boardBoss: 'grave_bishop' },
        { types: ['the_refused', 'risen', 'grave_touched'], boardBoss: 'grave_bishop' },
        { types: ['risen', 'grave_touched'], boardBoss: 'grave_bishop', boss: 'pale_mother' },
      ] },
    { id: 'salt_court', boss: 'drowned_king', domain: 'chaos', escortBoss: 'bandit_king',
      name: 'The Salt Court',
      brief: 'The sea took a kingdom and left the king. Order drowned; what walks the wrecks answers to no banner. A crowned outlaw holds each hall. The last room is his.',
      enc: [
        { types: ['drowned_hand', 'drowned_hand'], boardBoss: 'bandit_king' },
        { types: ['drowned_hand', 'the_refused'], boardBoss: 'bandit_king' },
        { types: ['drowned_hand', 'drowned_hand'], boardBoss: 'bandit_king', boss: 'drowned_king' },
      ] },
    { id: 'green_altar', boss: 'first_bloom', domain: 'life', escortBoss: 'alpha',
      name: 'The Green Altar',
      brief: 'Life will not take no. The woods have started growing through the walls, and something old is blessing it. An alpha leads every pack. She stands at the altar with one of them.',
      enc: [
        { types: ['dire_wolf', 'dire_wolf'], boardBoss: 'alpha' },
        { types: ['dire_wolf', 'shadow_beast', 'frost_hag'], boardBoss: 'alpha' },
        { types: ['dire_wolf', 'shadow_beast'], boardBoss: 'alpha', boss: 'first_bloom' },
      ] },
  ],
};

// ---------------------------------------------------------------- faction war (§6)
// Ordinary board contracts against a faction. Available to everyone.
ADV.DATA.FACTION_WAR = {
  bell:  { id: 'bell',  quest: 'Clan Suppression',      shift: 'law',      speaker: 'jiro',
           bosses: ['paper_keeper', 'the_left_hand'],
           types: ['bell_initiate', 'clan_watcher', 'chain_hand', 'poison_sister', 'the_refused'],
           brief: 'The city wants the Hollow Bell reminded it is a city. Two of their named hands are on the street. Find them.' },
  green: { id: 'green', quest: 'Bandit-Blade Contract', shift: 'criminal', speaker: 'kira',
           bosses: ['instructor_sagara', 'blade_captain_doi'],
           types: ['green_recruit', 'clan_archer', 'sworn_blade', 'stone_bannerman', 'clan_physician'],
           brief: 'The Green-Eyed are enforcing a law somebody paid for. Two of their blades are the problem. Cut them down.' },
  tally: { id: 'tally', quest: 'Anti-Piracy Patrol',    shift: 'law',      speaker: 'vanekessler',
           bosses: ['bosun_teague', 'captain_ordell'],
           types: ['tally_hand', 'gun_captain', 'sea_dog', 'powder_monkey', 'ships_surgeon'],
           brief: 'The Red Tally has been lifting cargo from the shallows. A bosun and a captain are running the take. Leave a message.' },
  navy:  { id: 'navy',  quest: 'Blockade Running',      shift: 'criminal', speaker: 'ash',
           bosses: ['masters_mate_holt', 'commander_nairn'],
           types: ['pressed_hand', 'marine_of_the_line', 'gunnery_officer', 'ships_master', 'signal_officer'],
           brief: 'The Admiralty closed a channel people need open. A mate and a commander hold the line. Run it.' },
};
})();
