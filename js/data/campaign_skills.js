// Campaign skills — 72 entries (campaign doc §13a-c). 24 per faction:
// 8 playstyles × 3. Witness-only during a campaign, purchasable everywhere
// after any campaign completes. Perks are advanced-only (§13d-2).
// Engine params are the same vocabulary as js/data/skills.js plus the
// campaign primitives in combat.js / combat_effects.js.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const S = ADV.DATA.SKILLS;

function def(o) {
  o.campaign = true;
  S[o.id] = o;
}
// three-tier helper for actives: b/i/a names + optional per-tier overrides
function tiers(b, i, a, ob, oi, oa) {
  return { basic: Object.assign({ name: b }, ob || {}), intermediate: Object.assign({ name: i }, oi || {}), advanced: Object.assign({ name: a }, oa || {}) };
}

// =====================================================================
// 13a. THE GAPING MAW — shadow, poison, precision, silence
// =====================================================================
const MAW = 'maw';
// Rogue
def({ id: 'vanishing_strike', name: 'Vanishing Strike', kind: 'active', archetype: 'rogue', faction: MAW,
  power: 4.2, reach: 'any', target: 'enemy', melee: true, openerOrStealth: true, stealthOnKill: true,
  desc: 'Attack from stealth (or as the opener); if it kills, you re-enter stealth immediately.',
  tiers: tiers('Vanishing Strike', 'Fading Strike', 'Ghostwork', {}, { power: 4.6 }, { power: 5.0, executeBelow: 0.2 }) });
def({ id: 'marked_for_the_knife', name: 'Marked for the Knife', kind: 'active', archetype: 'rogue', faction: MAW,
  power: 0, reach: 'any', target: 'enemy', effect: 'mark',
  desc: 'Mark one enemy; all your damage against it ignores 50% of its Defence.',
  tiers: tiers('Marked for the Knife', 'Named for the Knife', 'Death Sentence', { rounds: 3 }, { rounds: 4 }, { rounds: 6 }) });
def({ id: 'ghoststep', name: 'Ghoststep', kind: 'active', noTierGrowth: true, archetype: 'rogue', faction: MAW,
  power: 0, reach: 'any', target: 'self', effect: 'ghoststep',
  desc: 'Step into stealth and any lane for free; your next attack takes no reflect damage from any source.',
  tiers: tiers('Ghoststep', 'Shadow Step', 'Nowhere Step') });
// Ranger
def({ id: 'poisoned_quarrel', name: 'Poisoned Quarrel', kind: 'active', archetype: 'ranger', faction: MAW,
  power: 2.4, reach: 'any', target: 'enemy',
  desc: 'Ranged hit applying stacking Poison — a share of the target\'s health over six ticks, separate from Bleed.',
  tiers: tiers('Poisoned Quarrel', 'Venomed Quarrel', 'Weeping Shot',
    { status: { poison: { power: 0.7, stacks: true } } }, { status: { poison: { power: 0.9, stacks: true } } }, { status: { poison: { power: 1.1, stacks: true } }, multiTarget: 2 }) });
def({ id: 'silent_loosing', name: 'Silent Loosing', kind: 'active', archetype: 'ranger', faction: MAW,
  power: 2.6, reach: 'any', target: 'enemy', silent: true,
  desc: 'A ranged attack that does not reveal your lane or break stealth.',
  tiers: tiers('Silent Loosing', 'Quiet Loosing', 'Unheard', {}, { power: 3.0 }, { power: 3.4 }) });
def({ id: 'killing_angle', name: 'Killing Angle', kind: 'active', archetype: 'ranger', faction: MAW,
  power: 2.2, reach: 'any', target: 'enemy',
  desc: 'Damage scales with how many allies stand between you and the target.',
  tiers: tiers('Killing Angle', 'Clean Angle', 'Perfect Line', { alliesBetweenScale: 0.3 }, { alliesBetweenScale: 0.45 }, { alliesBetweenScale: 0.6 }) });
// Fighter
def({ id: 'throat_work', name: 'Throat Work', kind: 'active', archetype: 'fighter', faction: MAW,
  power: 2.0, reach: 'front', target: 'enemy', healcutRounds: 3,
  desc: 'A fast strike; applies Bleed and halves the healing the target receives.',
  tiers: tiers('Throat Work', 'Neck Work', 'Red Work',
    { status: { bleed: { power: 0.6, rounds: 3, stacks: true } } }, { status: { bleed: { power: 0.8, rounds: 3, stacks: true } } }, { power: 2.4, status: { bleed: { power: 1.0, rounds: 3, stacks: true } } }) });
def({ id: 'executioners_rhythm', name: "Executioner's Rhythm", kind: 'active', archetype: 'fighter', faction: MAW,
  power: 2.2, reach: 'front', target: 'enemy',
  desc: 'Each kill this battle raises the damage of every later swing, with no cap.',
  tiers: tiers("Executioner's Rhythm", 'Headsman\'s Rhythm', 'Tally', { killStreakScale: 0.25 }, { killStreakScale: 0.35 }, { killStreakScale: 0.5 }) });
def({ id: 'butchers_tempo', name: "Butcher's Tempo", kind: 'active', archetype: 'fighter', faction: MAW,
  power: 1.3, reach: 'front', target: 'enemy', hits: 2,
  desc: 'Attack twice at reduced power; both hits can apply Bleed.',
  tiers: tiers("Butcher's Tempo", 'Cutter\'s Tempo', 'Sixteen Cuts',
    { status: { bleed: { power: 0.5, rounds: 3, stacks: true } } }, { status: { bleed: { power: 0.6, rounds: 3, stacks: true } } }, { hits: 3, status: { bleed: { power: 0.7, rounds: 3, stacks: true } } }) });
// Tank
def({ id: 'cloak_of_shadows', name: 'Cloak of Shadows', kind: 'active', archetype: 'tank', faction: MAW,
  power: 0, reach: 'any', target: 'self',
  desc: "Reduces damage taken and reflects using Backstab's calculation rather than a flat percentage.",
  tiers: tiers('Cloak of Shadows', 'Mantle of Shadows', 'Shroud',
    { selfStatus: { kind: 'cloak', reduce: 0.25, rounds: 3 } }, { selfStatus: { kind: 'cloak', reduce: 0.35, rounds: 3 } }, { selfStatus: { kind: 'cloak', reduce: 0.45, rounds: 4 } }) });
def({ id: 'blood_price', name: 'Blood Price', kind: 'active', archetype: 'tank', faction: MAW,
  power: 0, reach: 'any', target: 'self',
  desc: 'One-shot reflect: the next attack against you returns 200% of its damage. Stacks additively with every other reflect.',
  tiers: tiers('Blood Price', 'Blood Debt', 'Debt Collected',
    { selfStatus: { kind: 'bloodPrice', pct: 2.0 } }, { selfStatus: { kind: 'bloodPrice', pct: 2.5 } }, { selfStatus: { kind: 'bloodPrice', pct: 3.0 } }) });
def({ id: 'unseen_guard', name: 'Unseen Guard', kind: 'active', archetype: 'tank', faction: MAW,
  power: 0, reach: 'any', target: 'ally', wardAhead: true, effect: 'unseenGuard',
  desc: 'Guard an ally; attackers cannot see who intercepted, and they bleed for trying.',
  tiers: tiers('Unseen Guard', 'Unseen Watch', "Nobody's There", { rounds: 3 }, { rounds: 4 }, { rounds: 5 }) });
// Mage
def({ id: 'poison_spray', name: 'Poison Spray', kind: 'active', archetype: 'mage', faction: MAW,
  power: 1.8, reach: 'any', target: 'enemyLane', elemental: true, element: 'acid',
  desc: 'Acid across a whole lane, applying stacking Poison.',
  tiers: tiers('Poison Spray', 'Acid Spray', 'Corrosion',
    { status: { poison: { power: 0.6, stacks: true } } }, { status: { poison: { power: 0.8, stacks: true } } }, { power: 2.2, status: { poison: { power: 1.0, stacks: true } } }) });
def({ id: 'whisper_of_ending', name: 'Whisper of Ending', kind: 'active', archetype: 'mage', faction: MAW,
  power: 1.6, reach: 'any', target: 'enemy', elemental: true, element: 'shadow',
  desc: 'Shadow damage over time, and Withering: all healing on the target is nullified for its duration.',
  tiers: tiers('Whisper of Ending', 'Word of Ending', 'Last Word',
    { withering: 2, status: { shadowDot: { power: 0.9, rounds: 3 } } }, { withering: 3, status: { shadowDot: { power: 1.1, rounds: 3 } } }, { withering: 4, status: { shadowDot: { power: 1.3, rounds: 4 } } }) });
def({ id: 'shadow_lance', name: 'Shadow Lance', kind: 'active', archetype: 'mage', faction: MAW,
  power: 2.4, reach: 'back', target: 'enemy', elemental: true, element: 'shadow',
  desc: 'Pierces to the enemy back lane; the further it travels, the harder it lands.',
  tiers: tiers('Shadow Lance', 'Dark Lance', 'Long Dark', { distanceScale: 0.2 }, { distanceScale: 0.3 }, { distanceScale: 0.4, pierceBehind: true }) });
// Druid
def({ id: 'serpent_form', name: 'Serpent Form', kind: 'active', archetype: 'druid', faction: MAW,
  power: 0, reach: 'any', target: 'self',
  desc: 'Self-buff: your attacks apply Poison and you evade more.',
  tiers: tiers('Serpent Form', 'Adder Form', 'Viper',
    { selfStatus: { kind: 'serpent', rounds: 3 } }, { selfStatus: { kind: 'serpent', rounds: 4 } }, { selfStatus: { kind: 'serpent', rounds: 5 } }) });
def({ id: 'carrion_sense', name: 'Carrion Sense', kind: 'perk', noTierGrowth: true, archetype: 'druid', faction: MAW,
  desc: "Reveals every enemy's current HP and lowest defence for the whole battle.",
  revealHp: true,
  tiers: { advanced: { name: "Scavenger's Eye", revealHp: true } } });
def({ id: 'spiders_patience', name: "Spider's Patience", kind: 'active', archetype: 'druid', faction: MAW,
  power: 2.4, reach: 'front', target: 'enemy',
  desc: 'Each round spent not attacking makes your next attack hit harder, with no cap.',
  tiers: tiers("Spider's Patience", 'Weaver\'s Patience', 'Web', { idleScale: 0.4 }, { idleScale: 0.6 }, { idleScale: 0.8 }) });
// Healer
def({ id: 'stitch_and_run', name: 'Stitch and Run', kind: 'active', archetype: 'healer', faction: MAW,
  power: 1.8, reach: 'any', target: 'ally', heal: true, grantEvade: 1,
  desc: 'Heal an ally and grant them one immediate free reposition (they slip the next attack).',
  tiers: tiers('Stitch and Run', 'Stitch and Slip', 'Cut and Carry', {}, { power: 2.2 }, { power: 2.6, grantEvade: 2 }) });
def({ id: 'venom_draw', name: 'Venom Draw', kind: 'active', archetype: 'healer', faction: MAW,
  power: 0, reach: 'any', target: 'enemy', effect: 'venomDraw',
  desc: 'Pull the poison out of an ally and put it in an enemy. Venom Pull takes bleeding too; Transfer empties every wound off the whole company at once.',
  tiers: tiers('Venom Draw', 'Venom Pull', 'Transfer',
    { drawKinds: ['poison'] }, { drawKinds: ['poison', 'bleed'] }, { drawKinds: ['poison', 'bleed', 'burn'], drawFromAll: true }) });
def({ id: 'last_breath', name: 'Last Breath', kind: 'active', archetype: 'healer', faction: MAW,
  power: 0, reach: 'any', target: 'ally', heal: true, revive: true, effect: 'lastBreath',
  desc: 'A downed ally acts once more before falling.',
  // The three tiers were renames over identical behaviour: one downed ally, up at 1 HP, for
  // one round. They now buy something — the ally comes back with more under them, and the
  // top tier lifts the whole line instead of one body.
  tiers: tiers('Last Breath', 'Borrowed Breath', 'One More',
    { reviveHp: 0.01, breathRounds: 1 },
    { reviveHp: 0.15, breathRounds: 2 },
    { reviveHp: 0.25, breathRounds: 2, breathAll: true }) });
// Utility
def({ id: 'case_the_room', name: 'Case the Room', kind: 'perk', noTierGrowth: true, archetype: null, faction: MAW,
  desc: 'See enemy skill loadouts before the encounter begins.', revealLoadouts: true,
  tiers: { advanced: { name: 'Full Ledger', revealLoadouts: true } } });
def({ id: 'corpse_work', name: 'Corpse Work', kind: 'perk', noTierGrowth: true, archetype: null, faction: MAW,
  desc: 'Killing an enemy yields additional gold and their carried items.', killGold: 6,
  tiers: { advanced: { name: 'Undertaker', killGold: 6 } } });
def({ id: 'quiet_word', name: 'Quiet Word', kind: 'perk', noTierGrowth: true, archetype: null, faction: MAW, social: 'threaten',
  desc: 'Encounter-resolution verb: Threaten — resolves against isolated targets.',
  tiers: { advanced: { name: 'Understanding', vs: 'isolated' } } });

// =====================================================================
// 13b. THE ANTLER — formation, discipline, fire and steel
// =====================================================================
const ANT = 'antler';
// Rogue
def({ id: 'flanking_pay', name: 'Flanking Pay', kind: 'active', archetype: 'rogue', faction: ANT,
  power: 2.4, reach: 'front', target: 'enemy',
  desc: 'Bonus damage when an ally has already engaged the same target this round.',
  tiers: tiers('Flanking Pay', 'Double Pay', 'Pincer', { flankScale: 0.4 }, { flankScale: 0.6 }, { flankScale: 0.8 }) });
def({ id: 'contract_mark', name: 'Contract Mark', kind: 'active', archetype: 'rogue', faction: ANT,
  power: 0, reach: 'any', target: 'enemy', effect: 'contractMark',
  desc: 'Mark a target; every ally deals bonus damage to it.',
  tiers: tiers('Contract Mark', 'Signed Mark', 'Named on the Paper', { rounds: 3 }, { rounds: 4 }, { rounds: 6 }) });
def({ id: 'scouts_cut', name: "Scout's Cut", kind: 'active', archetype: 'rogue', faction: ANT,
  power: 2.2, reach: 'front', target: 'enemy', reveal: true,
  desc: "Strike and report: reveals the next encounter's composition.",
  tiers: tiers("Scout's Cut", 'Outrider\'s Cut', 'Forward Element', {}, { power: 2.6 }, { power: 3.0 }) });
// Ranger
def({ id: 'suppressing_volley', name: 'Suppressing Volley', kind: 'active', archetype: 'ranger', faction: ANT,
  power: 1.2, reach: 'any', target: 'enemyLane',
  desc: 'Lane-wide low damage; affected enemies deal reduced damage next round.',
  tiers: tiers('Suppressing Volley', 'Pinning Volley', 'Sustained Fire',
    { status: { suppressed: { mult: 0.7, rounds: 1 } } }, { status: { suppressed: { mult: 0.6, rounds: 1 } } }, { power: 1.5, status: { suppressed: { mult: 0.5, rounds: 2 } } }) });
def({ id: 'ranged_discipline', name: 'Ranged Discipline', kind: 'active', archetype: 'ranger', faction: ANT,
  power: 2.4, reach: 'any', target: 'enemy',
  desc: 'Each consecutive round attacking the same lane raises your damage.',
  tiers: tiers('Ranged Discipline', 'Rifle Discipline', 'Fire Control', { laneStreakScale: 0.2 }, { laneStreakScale: 0.3 }, { laneStreakScale: 0.4 }) });
def({ id: 'paid_shot', name: 'Paid Shot', kind: 'active', archetype: 'ranger', faction: ANT,
  power: 2.2, reach: 'any', target: 'enemy',
  desc: "Damage scales with the contract's payout tier.",
  tiers: tiers('Paid Shot', 'Bonus Shot', 'Full Fee', { tierScale: 0.3 }, { tierScale: 0.45 }, { tierScale: 0.6 }) });
// Fighter
def({ id: 'shield_breaker', name: 'Shield Breaker', kind: 'active', archetype: 'fighter', faction: ANT,
  power: 2.4, reach: 'front', target: 'enemy', stripGuards: true, defStrip: 12,
  desc: 'A heavy strike that removes guard effects and armour bonuses.',
  tiers: tiers('Shield Breaker', 'Wall Breaker', 'Opened Up', {}, { power: 2.7 }, { power: 3.0 }) });
def({ id: 'line_advance', name: 'Line Advance', kind: 'active', archetype: 'fighter', faction: ANT,
  power: 2.2, reach: 'front', target: 'enemy',
  desc: 'Attack and press your whole lane forward: allies in your lane hit harder next round.',
  tiers: tiers('Line Advance', 'Line Push', 'Press',
    { laneBuff: { kind: 'advance', mult: 1.15, rounds: 1 } }, { laneBuff: { kind: 'advance', mult: 1.25, rounds: 1 } }, { laneBuff: { kind: 'advance', mult: 1.35, rounds: 2 } }) });
def({ id: 'veterans_cut', name: "Veteran's Cut", kind: 'active', archetype: 'fighter', faction: ANT,
  power: 2.2, reach: 'front', target: 'enemy',
  desc: 'Damage increases for every prior encounter survived this quest.',
  tiers: tiers("Veteran's Cut", 'Old Hand\'s Cut', 'Third Day', { encounterScale: 0.25 }, { encounterScale: 0.35 }, { encounterScale: 0.5 }) });
// Tank
def({ id: 'hold_the_road', name: 'Hold the Road', kind: 'active', archetype: 'tank', faction: ANT,
  power: 0, reach: 'any', target: 'self',
  desc: 'Your lane cannot be pushed, flanked or bypassed for two rounds.',
  tiers: tiers('Hold the Road', 'Hold the Line', 'Nobody Passes',
    { laneStatus: { kind: 'holdRoad', rounds: 2 } }, { laneStatus: { kind: 'holdRoad', rounds: 3 } }, { laneStatus: { kind: 'holdRoad', rounds: 4 } }) });
def({ id: 'bulwark_formation', name: 'Bulwark Formation', kind: 'active', archetype: 'tank', faction: ANT,
  power: 0, reach: 'any', target: 'self', effect: 'share', shareWith: 'adjacent',
  desc: 'You and both adjacent allies share incoming damage equally.',
  tiers: tiers('Bulwark Formation', 'Shield Formation', 'The Wall', { rounds: 3 }, { rounds: 4 }, { rounds: 5 }) });
def({ id: 'paid_in_full', name: 'Paid in Full', kind: 'active', archetype: 'tank', faction: ANT,
  power: 0, reach: 'any', target: 'enemy', effect: 'paidInFull', melee: true,
  desc: 'Every point of damage you prevented this battle, dealt to one enemy at once.',
  tiers: tiers('Paid in Full', 'Settled', 'Settling Up', { mult: 1.0 }, { mult: 1.25 }, { mult: 1.5 }) });
// Mage
def({ id: 'fire_barrier', name: 'Fire Barrier', kind: 'active', archetype: 'mage', faction: ANT,
  power: 0, reach: 'any', target: 'party',
  desc: 'Grants the party fire resistance and sets Burning on anyone who attacks them.',
  tiers: tiers('Fire Barrier', 'Ember Barrier', 'Wall of Coals',
    { partyStatus: { kind: 'fireBarrier', resist: 0.3, rounds: 3 } }, { partyStatus: { kind: 'fireBarrier', resist: 0.45, rounds: 3 } }, { partyStatus: { kind: 'fireBarrier', resist: 0.6, rounds: 4 } }) });
def({ id: 'siege_flame', name: 'Siege Flame', kind: 'active', archetype: 'mage', faction: ANT,
  power: 2.6, reach: 'any', target: 'enemyLane', elemental: true, element: 'fire',
  desc: 'Heavy single-lane fire damage that ignores cover entirely.',
  tiers: tiers('Siege Flame', 'Breaching Flame', 'Breach',
    { status: { burn: { power: 0.8, rounds: 3 } } }, { power: 3.0, status: { burn: { power: 1.0, rounds: 3 } } }, { power: 3.4, status: { burn: { power: 1.2, rounds: 3 } } }) });
def({ id: 'ashfall', name: 'Ashfall', kind: 'active', archetype: 'mage', faction: ANT,
  power: 0, reach: 'any', target: 'enemy', elemental: true, element: 'fire',
  desc: 'A lane hazard that burns whoever stands in it, every round.',
  tiers: tiers('Ashfall', 'Cinderfall', 'Scorched Ground',
    { hazard: { kind: 'ashfall', power: 0.9, rounds: 3, on: 'enemyLane' } }, { hazard: { kind: 'ashfall', power: 1.1, rounds: 3, on: 'enemyLane' } }, { hazard: { kind: 'ashfall', power: 1.3, rounds: 4, on: 'enemyLane' } }) });
// Druid
def({ id: 'warhound_form', name: 'Warhound Form', kind: 'active', archetype: 'druid', faction: ANT,
  power: 0, reach: 'any', target: 'self',
  desc: 'Self-buff: more damage, and you intercept attacks aimed at your lane-mates.',
  tiers: tiers('Warhound Form', 'Mastiff Form', 'Kennel-Bred',
    { selfStatus: { kind: 'warhound', mult: 1.25, rounds: 3 } }, { selfStatus: { kind: 'warhound', mult: 1.35, rounds: 3 } }, { selfStatus: { kind: 'warhound', mult: 1.5, rounds: 4 } }) });
def({ id: 'beast_handler', name: 'Beast Handler', kind: 'perk', noTierGrowth: true, archetype: 'druid', faction: ANT,
  desc: 'Conscripted and summoned allies gain your Defence bonus.', followerDef: 4,
  tiers: { advanced: { name: 'Master of Hounds', followerDef: 4 } } });
def({ id: 'quartermasters_root', name: "Quartermaster's Root", kind: 'active', archetype: 'druid', faction: ANT,
  power: 0, reach: 'any', target: 'self', passive: true, betweenHealPct: 0.1,
  desc: 'Between encounters the party heals a little more, at no action cost.',
  tiers: tiers("Quartermaster's Root", 'Field Ration', 'Provisioned', { betweenHealPct: 0.1 }, { betweenHealPct: 0.15 }, { betweenHealPct: 0.2 }) });
// Healer
def({ id: 'stanch', name: 'Stanch', kind: 'active', archetype: 'healer', faction: ANT,
  power: 2.0, reach: 'any', target: 'ally', heal: true, cures: ['bleed', 'burn'],
  desc: 'An immediate heal that also removes Bleed and Burning.',
  tiers: tiers('Stanch', 'Bind Wound', 'Field Dressing', {}, { power: 2.4 }, { power: 2.8, cures: ['bleed', 'burn', 'poison'] }) });
def({ id: 'company_medic', name: 'Company Medic', kind: 'active', archetype: 'healer', faction: ANT,
  power: 1.2, reach: 'any', target: 'party', heal: true, effect: 'companyMedic',
  desc: 'Heal every ally below 50% at once, each for about half what a single-target heal would give them.',
  tiers: tiers('Company Medic', 'Line Medic', 'Triage Line',
    { tier: 'basic', medicPct: 0.45, medicBelow: 0.5 },
    { tier: 'intermediate', power: 1.4, medicPct: 0.5, medicBelow: 0.65 },
    { tier: 'advanced', power: 1.6, medicPct: 0.55, medicBelow: 0.8 }) });
def({ id: 'contract_bound', name: 'Contract Bound', kind: 'active', archetype: 'healer', faction: ANT,
  power: 0, reach: 'any', target: 'ally', effect: 'share', shareWith: 'pair',
  desc: 'Bind yourself to an ally: damage they take is split with you.',
  tiers: tiers('Contract Bound', 'Oath Bound', 'Sworn Together', { rounds: 3 }, { rounds: 4 }, { rounds: 5 }) });
// Utility
def({ id: 'terms_of_engagement', name: 'Terms of Engagement', kind: 'perk', noTierGrowth: true, archetype: null, faction: ANT,
  desc: 'See the exact payout and every encounter\'s composition before accepting any contract.', revealContracts: true,
  tiers: { advanced: { name: 'Read the Paper', revealContracts: true } } });
def({ id: 'fallback_point', name: 'Fallback Point', kind: 'perk', noTierGrowth: true, archetype: null, faction: ANT,
  desc: 'Fleeing succeeds automatically once per quest.', autoFlee: true,
  tiers: { advanced: { name: 'Withdrawal', autoFlee: true } } });
def({ id: 'muster', name: 'Muster', kind: 'perk', noTierGrowth: true, archetype: null, faction: ANT,
  desc: 'Hired party members cost 25% less.', wageDiscount: 0.25,
  tiers: { advanced: { name: 'Standing Company', wageDiscount: 0.25 } } });

// =====================================================================
// 13c. VARENHOLM ACADEMY — formal working, wards, articulation
// =====================================================================
const VAR = 'varenholm';
// Rogue
def({ id: 'silenced_step', name: 'Silenced Step', kind: 'active', archetype: 'rogue', faction: VAR,
  power: 2.4, reach: 'front', target: 'enemy', silence: 1,
  desc: 'Move and strike; the target cannot cast next round.',
  tiers: tiers('Silenced Step', 'Muffled Step', 'Gag', {}, { power: 2.8 }, { power: 3.2, silence: 2 }) });
def({ id: 'ward_thief', name: 'Ward Thief', kind: 'active', archetype: 'rogue', faction: VAR,
  power: 2.2, reach: 'front', target: 'enemy', stealBuff: true,
  desc: 'A strike that strips one buff or ward from the target and grants it to you.',
  tiers: tiers('Ward Thief', 'Ward Taker', 'Requisition', {}, { power: 2.6 }, { power: 3.0 }) });
def({ id: 'countersign', name: 'Countersign', kind: 'active', archetype: 'rogue', faction: VAR,
  power: 0, reach: 'any', target: 'self', interrupt: true,
  desc: 'Interrupt: negates the next enemy skill used against your lane.',
  tiers: tiers('Countersign', 'Counterword', 'Refusal',
    { laneStatus: { kind: 'countersign', rounds: 2 } }, { laneStatus: { kind: 'countersign', rounds: 3 } }, { laneStatus: { kind: 'countersign', rounds: 4 } }) });
// Ranger
def({ id: 'aimed_cantrip', name: 'Aimed Cantrip', kind: 'active', archetype: 'ranger', faction: VAR,
  power: 2.4, reach: 'any', target: 'enemy', elemental: true, randomElemental: true,
  desc: 'A ranged working that applies a random elemental status.',
  tiers: tiers('Aimed Cantrip', 'Aimed Working', 'Focused Working', {}, { power: 2.8 }, { power: 3.2 }) });
def({ id: 'focal_shot', name: 'Focal Shot', kind: 'active', archetype: 'ranger', faction: VAR,
  power: 2.2, reach: 'any', target: 'enemy',
  desc: 'Damage scales with how many active buffs the target carries.',
  tiers: tiers('Focal Shot', 'Focus Shot', 'Overload', { buffCountScale: 0.3 }, { buffCountScale: 0.45 }, { buffCountScale: 0.6 }) });
def({ id: 'ranging_ward', name: 'Ranging Ward', kind: 'active', archetype: 'ranger', faction: VAR,
  power: 0, reach: 'any', target: 'enemy',
  desc: 'Place a ward on a lane; enemies standing in it take damage each round.',
  tiers: tiers('Ranging Ward', 'Marking Ward', 'Perimeter',
    { hazard: { kind: 'ward', power: 0.7, rounds: 3, on: 'enemyLane' } }, { hazard: { kind: 'ward', power: 0.9, rounds: 3, on: 'enemyLane' } }, { hazard: { kind: 'ward', power: 1.1, rounds: 4, on: 'enemyLane' } }) });
// Fighter
def({ id: 'spellblade_form', name: 'Spellblade Form', kind: 'active', archetype: 'fighter', faction: VAR,
  power: 0, reach: 'any', target: 'self',
  desc: 'Self-buff: melee attacks carry elemental force and scale with skill level, not the weapon.',
  tiers: tiers('Spellblade Form', 'Runeblade Form', 'Written Edge',
    { selfStatus: { kind: 'spellblade', rounds: 3 } }, { selfStatus: { kind: 'spellblade', rounds: 4 } }, { selfStatus: { kind: 'spellblade', rounds: 5 } }) });
def({ id: 'runic_strike', name: 'Runic Strike', kind: 'active', archetype: 'fighter', faction: VAR,
  power: 2.6, reach: 'front', target: 'enemy', runic: true,
  desc: 'A heavy hit that marks the target: your next spell against it cannot miss.',
  tiers: tiers('Runic Strike', 'Inscribed Strike', 'Inscribed', {}, { power: 3.0 }, { power: 3.4 }) });
def({ id: 'disciplined_advance', name: 'Disciplined Advance', kind: 'active', archetype: 'fighter', faction: VAR,
  power: 2.2, reach: 'front', target: 'enemy', selfWardPct: 0.5,
  desc: 'Attack and gain a ward equal to a portion of the damage dealt.',
  tiers: tiers('Disciplined Advance', 'Measured Advance', 'Formal Progress', {}, { power: 2.6 }, { power: 3.0, selfWardPct: 0.75 }) });
// Tank
def({ id: 'warding_stance', name: 'Warding Stance', kind: 'active', archetype: 'tank', faction: VAR,
  power: 0, reach: 'any', target: 'self',
  desc: 'Absorb hits into a ward that discharges as area damage when it breaks.',
  tiers: tiers('Warding Stance', 'Braced Ward', 'Rebound Ward',
    { selfStatus: { kind: 'ward', hits: 2, discharge: 12 } }, { selfStatus: { kind: 'ward', hits: 2, discharge: 18 } }, { selfStatus: { kind: 'ward', hits: 3, discharge: 26 } }) });
def({ id: 'absorption_field', name: 'Absorption Field', kind: 'active', archetype: 'tank', faction: VAR,
  power: 0, reach: 'any', target: 'party',
  desc: 'The party takes reduced elemental damage; you are healed by the amount reduced.',
  tiers: tiers('Absorption Field', 'Absorption Circle', 'Sink',
    { partyStatus: { kind: 'absorb', pct: 0.3, rounds: 3 } }, { partyStatus: { kind: 'absorb', pct: 0.4, rounds: 3 } }, { partyStatus: { kind: 'absorb', pct: 0.5, rounds: 4 } }) });
def({ id: 'aegis_protocol', name: 'Aegis Protocol', kind: 'active', archetype: 'tank', faction: VAR,
  power: 0, reach: 'any', target: 'ally', heal: true, wardAhead: true, shieldRounds: 1, wardAll: true,
  desc: 'Grant one ally complete immunity for one round. From Aegis Writ on, the ward answers back: what it stops is dealt to the attacker.',
  // Balance pass: the middle tier was a rename with nothing behind it (basic and intermediate
  // were both one round of immunity). It now earns its name with a reflecting ward.
  tiers: tiers('Aegis Protocol', 'Aegis Writ', 'Sanctioned Protection',
    {}, { wardReflect: true }, { shieldRounds: 2, wardReflect: true }) });
// Mage
def({ id: 'chain_lightning', name: 'Chain Lightning', kind: 'active', archetype: 'mage', faction: VAR,
  power: 2.4, reach: 'any', target: 'enemy', elemental: true, element: 'lightning', chainDecay: 0.7,
  desc: 'Jumps between every enemy, losing power each jump, unlimited jumps.',
  tiers: tiers('Chain Lightning', 'Forked Lightning', 'Cascade', {}, { chainDecay: 0.8 }, { chainDecay: 0.9, shock: 0.1, shockRounds: 2 }) });
def({ id: 'prismatic_bolt', name: 'Prismatic Bolt', kind: 'active', archetype: 'mage', faction: VAR,
  power: 2.6, reach: 'any', target: 'enemy', elemental: true, element: 'prismatic',
  desc: 'The damage type shifts to whatever the target resists least — no resistance applies.',
  tiers: tiers('Prismatic Bolt', 'Prismatic Lance', 'Solution', {}, { power: 3.0 }, { power: 3.4 }) });
def({ id: 'arcane_cascade', name: 'Arcane Cascade', kind: 'active', archetype: 'mage', faction: VAR,
  power: 2.0, reach: 'any', target: 'enemy', elemental: true, element: 'arcane',
  desc: "Each spell cast this battle increases the next one's damage.",
  tiers: tiers('Arcane Cascade', 'Compounding Cascade', 'Compounding Working', { castScale: 0.15 }, { castScale: 0.2 }, { castScale: 0.3 }) });
// Druid
def({ id: 'elemental_bond', name: 'Elemental Bond', kind: 'active', archetype: 'druid', faction: VAR,
  power: 0, reach: 'any', target: 'self',
  desc: 'Self-buff: your damage takes the shape of the last element that struck you, and hits harder for it.',
  tiers: tiers('Elemental Bond', 'Elemental Tie', 'Attunement',
    { selfStatus: { kind: 'bond', mult: 1.2, rounds: 3 } }, { selfStatus: { kind: 'bond', mult: 1.3, rounds: 3 } }, { selfStatus: { kind: 'bond', mult: 1.4, rounds: 4 } }) });
def({ id: 'storm_shape', name: 'Storm Shape', kind: 'active', archetype: 'druid', faction: VAR,
  power: 0, reach: 'any', target: 'self',
  desc: 'Self-buff: attacks hit an additional lane and apply Shock.',
  tiers: tiers('Storm Shape', 'Gale Shape', 'Tempest Form',
    { selfStatus: { kind: 'storm', rounds: 3 } }, { selfStatus: { kind: 'storm', rounds: 4 } }, { selfStatus: { kind: 'storm', rounds: 5 } }) });
def({ id: 'growth_field', name: 'Growth Field', kind: 'active', archetype: 'druid', faction: VAR,
  power: 0, reach: 'any', target: 'ally', heal: true,
  desc: 'Terrain: allies in the lane regenerate each round.',
  tiers: tiers('Growth Field', 'Verdant Field', 'Verdant Ground',
    { hazard: { kind: 'growth', power: 0.5, rounds: 3, heal: true, on: 'allyLane' } }, { hazard: { kind: 'growth', power: 0.7, rounds: 3, heal: true, on: 'allyLane' } }, { hazard: { kind: 'growth', power: 0.9, rounds: 4, heal: true, on: 'allyLane' } }) });
// Healer
def({ id: 'restorative_circle', name: 'Restorative Circle', kind: 'active', archetype: 'healer', faction: VAR,
  power: 1.6, reach: 'any', target: 'allyLane', heal: true, cureCount: 1,
  desc: 'Heal every ally in one lane and cleanse one status from each.',
  tiers: tiers('Restorative Circle', 'Restoring Circle', 'Full Circle', {}, { power: 2.0 }, { power: 2.4, cureCount: 99 }) });
def({ id: 'purge_ward', name: 'Purge Ward', kind: 'active', archetype: 'healer', faction: VAR,
  power: 0, reach: 'any', target: 'ally', heal: true, wardAhead: true,
  desc: 'An ally becomes immune to negative status for two rounds.',
  tiers: tiers('Purge Ward', 'Clean Ward', 'Clean Working', { purifyRounds: 2 }, { purifyRounds: 3 }, { purifyRounds: 4 }) });
def({ id: 'vital_anchor', name: 'Vital Anchor', kind: 'active', archetype: 'healer', faction: VAR,
  power: 0, reach: 'any', target: 'ally',
  desc: 'Anchor an ally: they cannot drop below 1 HP for two rounds.',
  tiers: tiers('Vital Anchor', 'Held Anchor', 'Held',
    { allyStatus: { kind: 'anchor', rounds: 2 } }, { allyStatus: { kind: 'anchor', rounds: 3 } }, { allyStatus: { kind: 'anchor', rounds: 4 } }) });
// Utility
def({ id: 'see_invisibility', name: 'See Invisibility', kind: 'perk', noTierGrowth: true, archetype: null, faction: VAR,
  desc: 'Reveals stealthed and hidden enemies and negates their stealth bonuses; also shows enemy equipped skills and perks.',
  seeInvis: true, revealLoadouts: true, revealPerks: true,
  tiers: { advanced: { name: 'Full Sight', seeInvis: true, revealLoadouts: true, revealPerks: true } } });
def({ id: 'dispel', name: 'Dispel', kind: 'active', archetype: null, faction: VAR,
  power: 0, reach: 'any', target: 'enemy', effect: 'dispel',
  desc: 'Strip an enemy of what is holding them up: two of their buffs and wards at first, four once practised, then everything.',
  tiers: tiers('Dispel', 'Unwrite', 'Struck From the Record',
    { dispelCap: 2 }, { dispelCap: 4 }, { dispelCap: 99 }) });
def({ id: 'prodigy', name: 'Prodigy', kind: 'perk', noTierGrowth: true, archetype: null, faction: VAR,
  desc: 'Every skill you own levels 5× faster.', levelMult: 5,
  tiers: { advanced: { name: 'Once In A Generation', levelMult: 5 } } });

ADV.DATA.CAMPAIGN_SKILL_IDS = Object.keys(S).filter(id => S[id].campaign);
// keep the trainer pool in sync
ADV.DATA.TRAINER_POOL = Object.keys(S).filter(id => !S[id].universal && !S[id].unique);
})();
