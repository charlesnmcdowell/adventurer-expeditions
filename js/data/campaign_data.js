// Campaign content data (campaign doc §6, §6a, §10, §14, §15): factions,
// titles, gear sets, the 12 campaign characters, 15 enemies + mini-bosses,
// and the 15 quests. Dialogue lives in campaign_dialogue.js.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

// ---------------------------------------------------------------- factions
ADV.DATA.FACTIONS = {
  maw: {
    id: 'maw', name: 'The Gaping Maw', short: 'the Maw', alignment: 'criminal',
    hall: 'Behind the laundry', archetypes: ['rogue', 'ranger'],
    recruiter: 'wren', rival: 'kite', boss: 'vane', antagonist: 'arden',
    titles: ['Of the Maw', 'Red Hand of the Maw', "The Maw's Own"],
    gearSet: 'assassins_gear',
    blurb: 'Not a guild so much as an appetite. They do not recruit; they notice you.',
  },
  antler: {
    id: 'antler', name: 'The Antler', short: 'the Antler', alignment: 'neutral',
    hall: 'The Antler company hall', archetypes: ['fighter', 'tank'],
    recruiter: 'holt', rival: 'roscarrow', boss: 'crane', antagonist: 'holloway',
    titles: ['Contracted', 'Sworn of the Antler', 'Antler Vanguard'],
    gearSet: 'mercenarys_gear',
    blurb: 'A contract company that takes any side and honours the paper exactly.',
  },
  varenholm: {
    id: 'varenholm', name: 'Varenholm Academy', short: 'Varenholm', alignment: 'law',
    hall: 'Varenholm Academy, lower hall', archetypes: ['mage', 'healer'],
    recruiter: 'lirien', rival: 'vaunt', boss: 'venn', antagonist: 'quiet',
    titles: ['Irregular of Varenholm', 'Adept Irregular', "Magister's Hand"],
    gearSet: 'battle_mages_gear',
    blurb: 'The lawful arm with credentials. They are called when the streets have already failed.',
  },
};

// Faction gear sets (§10): floor at 15, advance three archetypes, never sold.
Object.assign(ADV.DATA.GEAR_SETS, {
  assassins_gear:    { name: "Assassin's Gear",    archetypes: ['rogue', 'ranger', 'fighter'], extraSkills: ['sneak'], cost: 0, floor: 15, advanceTier: true, campaign: 'maw' },
  mercenarys_gear:   { name: "Mercenary's Gear",   archetypes: ['tank', 'ranger', 'fighter'], cost: 0, floor: 15, advanceTier: true, campaign: 'antler' },
  battle_mages_gear: { name: "Battle Mage's Gear", archetypes: ['druid', 'mage', 'healer'], cost: 0, floor: 15, advanceTier: true, campaign: 'varenholm' },
});

// ---------------------------------------------------------------- characters (§6, §6a)
// Fixtures outside every base-game system. 'campaignExit' = cannot die in
// combat (rival non-death, §5a; boss allies likewise). Recruiters never fight.
const CH = {};
function chr(o) { CH[o.id] = o; }
// The Gaping Maw
chr({ id: 'wren', name: 'Wren Pell', faction: 'maw', role: 'recruiter', sex: 'm', fights: false,
  portrait: { skin: 'tan', hair: 'fringe', wardrobe: 'hiking', color: '#5a4a3a' } });
chr({ id: 'kite', name: 'Kite', faction: 'maw', role: 'rival', sex: 'f', campaignExit: true,
  perks: ['opportunist', 'carrion_sense'], actives: ['backstab', 'vanishing_strike', 'ghoststep', 'marked_for_the_knife', 'smoke_bomb'],
  level: 18, portrait: { skin: 'brown', hair: 'sidecut', wardrobe: 'ninja', color: '#2a2d36' },
  exitLines: ["That's me finished. Try not to need me.", "You've got the rest. Aim for the one at the back — the front ones are paid to soak it.", "I always get back up. Ask anyone how many times they've buried me."] });
chr({ id: 'vane', name: 'Ossian Vane', faction: 'maw', role: 'boss', sex: 'm', campaignExit: true,
  perks: ['case_the_room'], actives: ['cloak_of_shadows', 'shadow_lance', 'whisper_of_ending', 'throat_work', 'marked_for_the_knife', 'blood_price'],
  level: 26, portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'suit', color: '#2f2a3a' } });
chr({ id: 'arden', name: 'Vesna Arden', epithet: 'the Lamplighter', faction: 'maw', role: 'antagonist', sex: 'f',
  perks: ['marksman', 'carrion_sense'], actives: ['killing_angle', 'poisoned_quarrel', 'silent_loosing', 'ranging_ward', 'snare'],
  level: 27, backLaneOnly: true, portrait: { skin: 'pale', hair: 'ponytail', wardrobe: 'hiking', color: '#3a3f2f' } });
// The Antler
chr({ id: 'holt', name: 'Bregga Holt', faction: 'antler', role: 'recruiter', sex: 'f', fights: false,
  portrait: { skin: 'fair', hair: 'sidecut', wardrobe: 'armor', color: '#4e4a44' } });
chr({ id: 'roscarrow', name: 'Dain Roscarrow', faction: 'antler', role: 'rival', sex: 'm', campaignExit: true,
  perks: ['momentum'], actives: ['hold_the_road', 'line_advance', 'shield_breaker', 'veterans_cut', 'cleave', 'sunder'],
  level: 19, portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'armor', color: '#5a5f6e' } });
chr({ id: 'crane', name: 'Aldis Crane', epithet: 'First Horn', faction: 'antler', role: 'boss', sex: 'f', campaignExit: true,
  perks: ['bulwark', 'momentum'], actives: ['bulwark_formation', 'hold_the_road', 'paid_in_full', 'line_advance', 'shield_breaker'],
  level: 26, portrait: { skin: 'fair', hair: 'bun', wardrobe: 'armor', color: '#6e6a5a' } });
chr({ id: 'holloway', name: 'Hargrave', faction: 'antler', role: 'antagonist', sex: 'm', hero: true,
  perks: ['momentum', 'bulwark'], actives: ['cleave', 'sunder', 'veterans_cut', 'shield_breaker'],
  level: 26, portrait: { skin: 'pale', hair: 'fringe', wardrobe: 'armor', color: '#3a3a44' } });
// Varenholm Academy
chr({ id: 'lirien', name: 'Adept Lirien', faction: 'varenholm', role: 'recruiter', sex: 'f', fights: false,
  portrait: { skin: 'brown', hair: 'bun', wardrobe: 'robe', color: '#3f3a50' } });
chr({ id: 'vaunt', name: 'Cassiel Vaunt', faction: 'varenholm', role: 'rival', sex: 'f', campaignExit: true,
  perks: ['arcane_focus'], actives: ['spellblade_form', 'chain_lightning', 'prismatic_bolt', 'countersign', 'aegis_protocol', 'warding_stance'],
  level: 18, portrait: { skin: 'pale', hair: 'long', wardrobe: 'robe', color: '#4a3550' } });
chr({ id: 'venn', name: 'Ilaria Venn', epithet: 'Magister', faction: 'varenholm', role: 'boss', sex: 'f', campaignExit: true,
  perks: ['arcane_focus', 'see_invisibility'], actives: ['chain_lightning', 'arcane_cascade', 'dispel', 'restorative_circle', 'aegis_protocol'],
  level: 27, portrait: { skin: 'dark', hair: 'afro', wardrobe: 'robe', color: '#2f2a3a' } });
chr({ id: 'quiet', name: 'The Quiet', faction: 'varenholm', role: 'antagonist', sex: 'm',
  perks: ['arcane_focus', 'see_invisibility'], actives: ['necromancy', 'silenced_step', 'whisper_of_ending', 'shadow_lance', 'chain_lightning'],
  level: 27, raisesMidFight: true, portrait: { skin: 'ashen', hair: 'bald', wardrobe: 'robe', color: '#26262a' } });
ADV.DATA.CAMPAIGN_CHARS = CH;

// ---------------------------------------------------------------- enemies (§14)
// Each carries a 5-skill pool and equips `equips` rolled at spawn.
const EN = {};
function en(o) { EN[o.id] = o; }
// 14a — against the Maw
en({ id: 'house_guard', name: 'House Guard', faction: 'maw', species: 'human', portrait: 'plated_sentinel', equips: 2,
  pool: ['cloak_of_shadows', 'unseen_guard', 'blood_price', 'throat_work', 'butchers_tempo'] });
en({ id: 'bonded_courier', name: 'Bonded Courier', faction: 'maw', species: 'human', portrait: 'bandit', equips: 2,
  pool: ['ghoststep', 'silent_loosing', 'vanishing_strike', 'stitch_and_run', 'quiet_word'] });
en({ id: 'watch_investigator', name: 'Watch Investigator', faction: 'maw', species: 'human', portrait: 'bandit', equips: 3,
  pool: ['case_the_room', 'marked_for_the_knife', 'killing_angle', 'corpse_work', 'executioners_rhythm'] });
en({ id: 'lamplit_witness', name: 'Lamplit Witness', faction: 'maw', species: 'human', portrait: 'hedge_mage', equips: 3,
  pool: ['poisoned_quarrel', 'serpent_form', 'spiders_patience', 'carrion_sense', 'venom_draw'] });
en({ id: 'candle_bearer', name: 'Candle-Bearer', faction: 'maw', species: 'human', portrait: 'grave_acolyte', equips: 3,
  pool: ['poison_spray', 'whisper_of_ending', 'shadow_lance', 'last_breath', 'stitch_and_run'] });
// 14b — against the Antler
en({ id: 'rival_company_spear', name: 'Rival Company Spear', faction: 'antler', species: 'human', portrait: 'plated_sentinel', equips: 2,
  pool: ['line_advance', 'shield_breaker', 'hold_the_road', 'veterans_cut', 'bulwark_formation'] });
en({ id: 'contract_breaker', name: 'Contract Breaker', faction: 'antler', species: 'human', portrait: 'bandit', equips: 2,
  pool: ['flanking_pay', 'scouts_cut', 'contract_mark', 'fallback_point', 'paid_in_full'] });
en({ id: 'road_warden', name: 'Road Warden', faction: 'antler', species: 'human', portrait: 'bandit', equips: 3,
  pool: ['suppressing_volley', 'ranged_discipline', 'paid_shot', 'terms_of_engagement', 'muster'] });
en({ id: 'free_company_burner', name: 'Free Company Burner', faction: 'antler', species: 'human', portrait: 'hedge_mage', equips: 3,
  pool: ['fire_barrier', 'siege_flame', 'ashfall', 'warhound_form', 'beast_handler'] });
en({ id: 'sanctioned_adept', name: 'Sanctioned Adept', faction: 'antler', species: 'human', portrait: 'grave_acolyte', equips: 3,
  pool: ['stanch', 'company_medic', 'contract_bound', 'quartermasters_root', 'hold_the_road'] });
// 14c — against Varenholm
en({ id: 'hedge_practitioner', name: 'Hedge Practitioner', faction: 'varenholm', species: 'human', portrait: 'hedge_mage', equips: 2,
  pool: ['aimed_cantrip', 'focal_shot', 'prismatic_bolt', 'elemental_bond', 'growth_field'] });
en({ id: 'unlicensed_warder', name: 'Unlicensed Warder', faction: 'varenholm', species: 'human', portrait: 'plated_sentinel', equips: 2,
  pool: ['warding_stance', 'absorption_field', 'aegis_protocol', 'ranging_ward', 'dispel'] });
en({ id: 'struck_scholar', name: 'Struck Scholar', faction: 'varenholm', species: 'human', portrait: 'hedge_mage', equips: 3,
  pool: ['arcane_cascade', 'chain_lightning', 'countersign', 'see_invisibility', 'prodigy'] });
en({ id: 'grave_touched', name: 'Grave-Touched', faction: 'varenholm', species: 'human', portrait: 'grave_acolyte', equips: 3,
  pool: ['silenced_step', 'ward_thief', 'storm_shape', 'spellblade_form', 'runic_strike'] });
en({ id: 'academy_proctor', name: 'Academy Proctor', faction: 'varenholm', species: 'human', portrait: 'hedge_mage', equips: 3,
  pool: ['restorative_circle', 'purge_ward', 'vital_anchor', 'disciplined_advance', 'see_invisibility'] });
en({ id: 'risen', name: 'The Risen', faction: 'varenholm', species: 'human', portrait: 'grave_acolyte', equips: 0,
  pool: [], undead: true, statMult: 1.5, statusImmunities: ['poison', 'bleed', 'burn'] });
ADV.DATA.CAMPAIGN_ENEMIES = EN;
const CAMP_LOOKS = {
  plated_sentinel: [{ name: 'Iron Kit', tint: '#4a4a52' }, { name: 'Brass Kit', tint: '#6a5a38' }],
  bandit: [{ name: 'Ash Wrap', tint: '#4a3f30' }, { name: 'Night Wrap', tint: '#2a2620' }],
  hedge_mage: [{ name: 'Violet Cowl', tint: '#3f3a50' }, { name: 'Ink Cowl', tint: '#2a2a38' }],
  grave_acolyte: [{ name: 'Moss Cowl', tint: '#333833' }, { name: 'Ash Cowl', tint: '#3a3a32' }],
};
for (const t of Object.values(EN)) {
  if (t.skins && t.skins.length >= 2) continue;
  t.skins = CAMP_LOOKS[t.portrait] || CAMP_LOOKS.bandit;
}

// Mini-bosses: equip 4-5, always including their signature.
const MB = {};
function mb(o) { MB[o.id] = o; }
mb({ id: 'the_steward', name: 'The Steward', faction: 'maw', base: 'house_guard', signature: 'cloak_of_shadows', equips: 4 });
mb({ id: 'bell_captain_orrin', name: 'Bell-Captain Orrin', faction: 'maw', base: 'watch_investigator', signature: 'case_the_room', equips: 4 });
mb({ id: 'the_understudy', name: 'The Understudy', faction: 'maw', base: 'bonded_courier', signature: 'vanishing_strike', equips: 5 });
mb({ id: 'ardens_witness', name: "Arden's Witness", faction: 'maw', base: 'lamplit_witness', signature: 'killing_angle', equips: 4, pair: true });
mb({ id: 'toll_captain_vesk', name: 'Toll-Captain Vesk', faction: 'antler', base: 'rival_company_spear', signature: 'bulwark_formation', equips: 4 });
mb({ id: 'the_debtor', name: 'The Debtor', faction: 'antler', base: 'contract_breaker', signature: 'paid_in_full', equips: 4 });
mb({ id: 'sergeant_ilm', name: 'Sergeant Ilm', faction: 'antler', base: 'rival_company_spear', signature: 'line_advance', equips: 5 });
mb({ id: 'roscarrows_conscript', name: "Roscarrow's Conscript", faction: 'antler', base: 'free_company_burner', signature: 'beast_handler', equips: 4, count: 4, conscript: true });
mb({ id: 'proctors_failure', name: "Proctor's Failure", faction: 'varenholm', base: 'struck_scholar', signature: 'arcane_cascade', equips: 4 });
mb({ id: 'the_bookkeeper', name: 'The Bookkeeper', faction: 'varenholm', base: 'grave_touched', signature: 'ward_thief', equips: 4 });
mb({ id: 'something_raised', name: 'Something Raised', faction: 'varenholm', base: 'grave_touched', signature: 'storm_shape', equips: 4, undead: true });
mb({ id: 'the_choir', name: 'The Choir', faction: 'varenholm', base: 'risen', signature: null, equips: 0, count: 6 });
ADV.DATA.CAMPAIGN_MINIBOSSES = MB;

// ---------------------------------------------------------------- quests (§15)
// enc: list of encounter specs; 'mini' = the quest's mini-boss; 'boss' = antagonist
// tiers climb 1→3; rival joins from Q3; Q4 ends in the scripted death; Q5 boss ally.
ADV.DATA.CAMPAIGN_QUESTS = {
  maw: [
    { n: 1, name: 'A Quiet Room', tier: 1, brief: 'Man owes the wrong people and has hired the wrong guards — go in, do it, come out.',
      enc: [{ types: ['house_guard', 'house_guard'] }, { mini: 'the_steward', with: ['house_guard'] }] },
    { n: 2, name: 'The Ledger Run', tier: 1, brief: "Someone's been handing our names to the watch and I want to know which of us.",
      enc: [{ types: ['bonded_courier', 'bonded_courier'] }, { mini: 'bell_captain_orrin', with: ['watch_investigator', 'watch_investigator'] }] },
    { n: 3, name: 'The Understudy', tier: 2, rival: true, brief: "One of ours is selling. Kite's going with you — don't let {them} do all of it.",
      enc: [{ types: ['bonded_courier', 'watch_investigator', 'house_guard'] }, { types: ['lamplit_witness', 'bonded_courier', 'house_guard'] }, { mini: 'the_understudy', with: ['bonded_courier', 'house_guard'] }] },
    { n: 4, name: 'The Contract', tier: 2, rival: true, rivalDies: true, brief: 'Ordinary job, ordinary target, in and out.',
      enc: [{ types: ['house_guard', 'house_guard', 'lamplit_witness'] }, { types: ['watch_investigator', 'lamplit_witness', 'house_guard'] }, { mini: 'ardens_witness', with: ['lamplit_witness'] }] },
    { n: 5, name: 'Bookkeeping', tier: 3, bossAlly: true, brief: "A year of tokens and names in the hands of the watch. Let's go and close the ledger.",
      enc: [{ types: ['candle_bearer', 'lamplit_witness', 'lamplit_witness'] }, { types: ['candle_bearer', 'candle_bearer', 'watch_investigator'] }, { types: ['lamplit_witness', 'lamplit_witness', 'candle_bearer', 'house_guard'] }, { boss: 'arden', with: ['lamplit_witness', 'lamplit_witness', 'candle_bearer'] }] },
  ],
  antler: [
    { n: 1, name: 'The Toll', tier: 1, brief: "Somebody's charging for a road they don't own — go and un-charge them.",
      enc: [{ types: ['rival_company_spear', 'rival_company_spear'] }, { mini: 'toll_captain_vesk', with: ['rival_company_spear'] }] },
    { n: 2, name: 'Settlement', tier: 1, brief: "Client won't pay, client has guards, and the contract says we collect.",
      enc: [{ types: ['contract_breaker', 'road_warden'] }, { mini: 'the_debtor', with: ['contract_breaker', 'road_warden'] }] },
    { n: 3, name: 'Two Companies', tier: 2, rival: true, brief: "Another outfit took the opposite side of the same job — Roscarrow's going, so listen to him.",
      enc: [{ types: ['rival_company_spear', 'road_warden', 'contract_breaker'] }, { types: ['rival_company_spear', 'free_company_burner', 'road_warden'] }, { mini: 'sergeant_ilm', with: ['rival_company_spear', 'sanctioned_adept'] }] },
    { n: 4, name: 'Margins', tier: 2, rival: true, rivalDies: true, brief: 'Standard escort, standard road, standard pay.',
      enc: [{ types: ['road_warden', 'road_warden', 'contract_breaker'] }, { types: ['free_company_burner', 'rival_company_spear', 'road_warden'] }, { mini: 'roscarrows_conscript' }] },
    { n: 5, name: 'No Paper On It', tier: 3, bossAlly: true, branch: true, brief: "Choose, {target}. I'm not going to make the case any better than that.",
      enc: [{ types: ['sanctioned_adept', 'rival_company_spear', 'road_warden'] }, { types: ['free_company_burner', 'free_company_burner', 'contract_breaker'] }, { types: ['rival_company_spear', 'rival_company_spear', 'sanctioned_adept', 'road_warden'] }, { boss: 'branch', with: ['rival_company_spear', 'rival_company_spear', 'sanctioned_adept'] }] },
  ],
  varenholm: [
    { n: 1, name: 'Practical Assessment', tier: 1, brief: 'A student attempted a working alone and it is still going — go and stop it.',
      enc: [{ types: ['hedge_practitioner', 'hedge_practitioner'] }, { mini: 'proctors_failure', with: ['academy_proctor'] }] },
    { n: 2, name: 'Unlicensed', tier: 1, brief: 'Academy notes are turning up on the criminal market and the magisters are unhappy.',
      enc: [{ types: ['unlicensed_warder', 'hedge_practitioner'] }, { mini: 'the_bookkeeper', with: ['unlicensed_warder', 'academy_proctor'] }] },
    { n: 3, name: 'The Word Nobody Says', tier: 2, rival: true, brief: 'Something is walking in the old quarter — Vaunt has requisitioned you, which I am told is an honour.',
      enc: [{ types: ['risen', 'risen', 'hedge_practitioner'] }, { types: ['grave_touched', 'risen', 'unlicensed_warder'] }, { mini: 'something_raised', with: ['risen', 'risen'] }] },
    { n: 4, name: 'The Choir', tier: 2, rival: true, rivalDies: true, brief: 'Six of them, no caster in sight — find the caster.',
      enc: [{ types: ['risen', 'risen', 'grave_touched'] }, { types: ['risen', 'risen', 'struck_scholar'] }, { mini: 'the_choir' }] },
    { n: 5, name: 'Struck From the Rolls', tier: 3, bossAlly: true, brief: 'I signed the expulsion myself and I have thought about it most days since.',
      enc: [{ types: ['grave_touched', 'risen', 'risen'] }, { types: ['struck_scholar', 'grave_touched', 'risen'] }, { types: ['grave_touched', 'grave_touched', 'risen', 'risen'] }, { boss: 'quiet', with: ['risen', 'risen', 'grave_touched'] }] },
  ],
};
})();

// DOT_PROMPT.md §11: every boss / mini-boss fight fields at least one tank and
// one healer of the faction. The healer's `heal` is forced into its loadout.
ADV.DATA.CAMPAIGN_BOSS_GUARD = {
  maw:       { tank: 'house_guard',         tankSkill: 'unseen_guard',   healer: 'candle_bearer',    heal: 'stitch_and_run' },
  antler:    { tank: 'rival_company_spear', tankSkill: 'hold_the_road',  healer: 'sanctioned_adept', heal: 'stanch' },
  varenholm: { tank: 'unlicensed_warder',   tankSkill: 'warding_stance', healer: 'academy_proctor',  heal: 'restorative_circle' },
  bell:      { tank: 'chain_hand',          tankSkill: 'iron_fan_guard', healer: 'poison_sister',    heal: 'field_suture' },
  green:     { tank: 'stone_bannerman',     tankSkill: 'stone_stance',   healer: 'clan_physician',   heal: 'field_honour' },
  tally:     { tank: 'gun_captain',         tankSkill: 'boarding_plate', healer: 'ships_surgeon',    heal: 'surgeons_saw' },
  navy:      { tank: 'marine_of_the_line',  tankSkill: 'close_order',    healer: 'signal_officer',   heal: 'sick_bay' },
};
