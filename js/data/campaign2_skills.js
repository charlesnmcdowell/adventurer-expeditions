// Ninja vs Pirates — 64 campaign skills (add-on §3). 16 per faction:
// 6 archetypes × 2 actives, plus 4 perks. Witness-only during a campaign;
// completing ANY ONE of the four unlocks all 64 at the trainer (§1d).
// Perks are advanced-only and gold-only (base campaign §13d-2).
// No new statuses (§3e): Bleed, Poison, Burning, Shock, Withering, Exposed.
// The weapon is the theme — shuriken vs flintlock, katana vs saber.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const S = ADV.DATA.SKILLS;

function def(o) {
  o.campaign = true; o.campaign2 = true;
  S[o.id] = o;
}
function tiers(b, i, a, ob, oi, oa) {
  return { basic: Object.assign({ name: b }, ob || {}), intermediate: Object.assign({ name: i }, oi || {}), advanced: Object.assign({ name: a }, oa || {}) };
}

// =====================================================================
// 3a. THE HOLLOW BELL — shuriken, smoke, poison, silence
// =====================================================================
const BELL = 'bell';
// Ranger — thrown steel
def({ id: 'shuriken_fan', name: 'Shuriken Fan', kind: 'active', archetype: 'ranger', faction: BELL,
  power: 1.2, reach: 'any', target: 'enemyLane', hits: 3,
  desc: 'Three stars across a lane. Every one that lands opens a cut.',
  tiers: tiers('Shuriken Fan', 'Falling Stars', 'Storm of Iron',
    { status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    { power: 1.4, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } },
    { power: 1.6, hits: 4, status: { bleed: { power: 1.0, rounds: 4, stacks: true } } }) });
def({ id: 'kunai_line', name: 'Kunai Line', kind: 'active', archetype: 'ranger', faction: BELL,
  power: 2.4, reach: 'any', target: 'enemy', pull: 1,
  desc: 'A weighted blade on a cord: it hits, and it drags them a lane closer.',
  tiers: tiers('Kunai Line', 'Barbed Line', 'Hooked', {}, { power: 2.8 }, { power: 3.2, pull: 2 }) });
// Rogue — smoke and silence
def({ id: 'smoke_step', name: 'Smoke Step', kind: 'active', archetype: 'rogue', faction: BELL,
  power: 0, reach: 'any', target: 'self', stealthOnUse: true, stealthRounds: 2, laneShift: true, reflectImmuneNext: true,
  desc: 'Vanish, move, and come back out of a direction nothing can answer — your next strike takes no reflect.',
  // Ash Step used to restate the base's own stealthRounds: 2, which made the middle tier an
  // exact copy of the tier below it. Stealth itself is capped at Combat.HIDE_CAP rounds, so
  // the step up is who goes with you rather than how long you are gone.
  tiers: tiers('Smoke Step', 'Ash Step', 'Nowhere', {}, { allyStealth: true }, { allyStealth: true, evadeNext: 1 }) });
def({ id: 'bell_silence', name: 'Bell-Silence', kind: 'active', archetype: 'rogue', faction: BELL,
  power: 1.2, reach: 'any', target: 'enemy', silent: true,
  desc: 'A struck nerve: the target cannot counter, riposte, guard or interrupt while it holds.',
  tiers: tiers('Bell-Silence', 'Deaf Bell', 'No Sound At All',
    { reactionLock: 2 }, { reactionLock: 3 }, { reactionLock: 3, target: 'enemyLane' }) });
// Tank — chain and fan
def({ id: 'iron_fan_guard', name: 'Iron Fan Guard', kind: 'active', archetype: 'tank', faction: BELL,
  power: 0, reach: 'any', target: 'self',
  desc: "Guard behind an iron fan; what you turn aside comes back as thrown steel (Shuriken Fan's calculation).",
  tiers: tiers('Iron Fan Guard', 'Folded Steel', 'Turning Blade',
    { guardScope: 'self', thornPct: 0.5, rounds: 2 }, { guardScope: 'self', thornPct: 0.7, rounds: 2 }, { guardScope: 'lane', thornPct: 1.0, rounds: 3 }) });
def({ id: 'chain_and_weight', name: 'Chain-and-Weight', kind: 'active', archetype: 'tank', faction: BELL,
  power: 2.6, reach: 'front', target: 'enemy', melee: true,
  desc: 'Wrap the legs. They fight where they stand and they do not leave.',
  tiers: tiers('Chain-and-Weight', 'Bound Ankle', 'Anchored',
    { rootRounds: 2 }, { rootRounds: 3 }, { rootRounds: 3, delayTarget: true }) });
// Mage — poison work
def({ id: 'blood_lotus', name: 'Blood Lotus', kind: 'active', archetype: 'mage', faction: BELL,
  power: 1.4, reach: 'any', target: 'enemy',
  desc: 'A poison that stops the wound closing while it runs.',
  tiers: tiers('Blood Lotus', 'Seven Petals', 'Nine Petals',
    { status: { poison: { power: 0.8, rounds: 3, stacks: true } }, withering: 3 },
    { status: { poison: { power: 1.0, rounds: 4, stacks: true } }, withering: 4 },
    { status: { poison: { power: 1.2, rounds: 4, stacks: true } }, withering: 5, adjacent: 1 }) });
def({ id: 'paper_charm', name: 'Paper Charm', kind: 'active', archetype: 'mage', faction: BELL,
  power: 0, reach: 'any', target: 'ally', heal: true,
  desc: 'A charm pinned to an ally: whoever strikes them is poisoned for it.',
  tiers: tiers('Paper Charm', 'Written Charm', 'Sealed',
    { shieldHits: 1, wardReflect: true, wardPoison: { power: 0.6, rounds: 3 } },
    { shieldHits: 2, wardReflect: true, wardPoison: { power: 0.8, rounds: 3 } },
    { shieldRounds: 2, wardReflect: true, wardPoison: { power: 1.0, rounds: 4 } }) });
// Druid — animal forms and sight
def({ id: 'fox_form', name: 'Fox Form', kind: 'active', archetype: 'druid', faction: BELL,
  power: 0, reach: 'any', target: 'self',
  desc: 'Move like something that has never been caught: harder to hit, and everything you touch is poisoned.',
  tiers: tiers('Fox Form', 'Three-Tails', 'Nine-Tails',
    { selfStatus: { kind: 'atkBuff', mult: 1.15, rounds: 4 }, evadeNext: 1, onHitPoison: { power: 0.6, rounds: 3 } },
    { selfStatus: { kind: 'atkBuff', mult: 1.25, rounds: 4 }, evadeNext: 2, onHitPoison: { power: 0.8, rounds: 3 } },
    { selfStatus: { kind: 'atkBuff', mult: 1.35, rounds: 5 }, evadeNext: 3, onHitPoison: { power: 1.0, rounds: 4 } }) });
def({ id: 'crow_sight', name: 'Crow Sight', kind: 'active', archetype: 'druid', faction: BELL,
  power: 0, reach: 'any', target: 'self', seeInvis: true, revealLoadouts: true,
  desc: 'Borrowed eyes: every hidden enemy and every skill they carry, for the whole battle.',
  tiers: tiers('Crow Sight', 'Carrion Eye', 'Carrion Watch', {}, { revealHp: true }, { revealHp: true, revealPerks: true }) });
// Healer — field work
def({ id: 'field_suture', name: 'Field Suture', kind: 'active', archetype: 'healer', faction: BELL,
  power: 2.2, reach: 'any', target: 'ally', heal: true, allyStealth: 2,
  desc: 'Close the wound and put them somewhere nobody is looking.',
  tiers: tiers('Field Suture', 'Silent Suture', 'Vanished and Whole', {}, { power: 2.6, allyStealth: 2 }, { power: 3.0, allyStealth: 2, cures: ['bleed', 'poison'] }) });
def({ id: 'breath_of_the_bell', name: 'Breath of the Bell', kind: 'active', archetype: 'healer', faction: BELL,
  power: 1.8, reach: 'any', target: 'party', heal: true, unactedOnly: true,
  desc: 'A held breath before the work: heals every ally who has not moved yet this round.',
  tiers: tiers('Breath of the Bell', 'Second Bell', 'Tolling', {}, { power: 2.2 }, { power: 2.6, cures: ['shock'] }) });
// Perks
def({ id: 'hollow_discipline', name: 'Hollow Discipline', kind: 'perk', noTierGrowth: true, archetype: null, faction: BELL,
  desc: 'Being hit does not break your stealth. Only attacking does.', stealthKeepsOnHit: true,
  tiers: { advanced: { name: 'The Bell Is Empty', stealthKeepsOnHit: true } } });
def({ id: 'fifty_names', name: 'Fifty Names', kind: 'perk', noTierGrowth: true, archetype: null, faction: BELL,
  desc: 'The clan writes down every kill. Your damage rises with the tally, for life, without a cap.', lifeKillScale: 0.01,
  tiers: { advanced: { name: 'The Long Tally', lifeKillScale: 0.01 } } });
def({ id: 'silent_trade', name: 'Silent Trade', kind: 'perk', noTierGrowth: true, archetype: null, faction: BELL, social: 'bribe',
  desc: 'Encounter verb: Bribe — works on anyone carrying less gold than you.',
  tiers: { advanced: { name: 'Everyone Has A Price', vs: 'poorer' } } });
def({ id: 'sixty_years', name: 'Sixty Years', kind: 'perk', noTierGrowth: true, archetype: null, faction: BELL,
  desc: 'Obaa-San taught you how to watch. Skills you learn from witnessing start at level 5.', witnessStartLevel: 5,
  tiers: { advanced: { name: "Obaa-San's Lesson", witnessStartLevel: 5 } } });

// =====================================================================
// 3b. THE GREEN-EYED — katana, stance, discipline, iaijutsu
// =====================================================================
const GREEN = 'green';
// Fighter — the draw
def({ id: 'iai_draw', name: 'Iai Draw', kind: 'active', archetype: 'fighter', faction: GREEN,
  power: 5.5, reach: 'front', target: 'enemy', melee: true, openerOnly: true, ignoreGuards: true,
  desc: 'One motion, sheath to sheath. Opening action only — and no guard, ward or formation is in the way.',
  tiers: tiers('Iai Draw', 'Drawn Silence', 'One Motion', {}, { power: 6.2 }, { power: 7.0, defStripAll: true }) });
def({ id: 'rising_cut', name: 'Rising Cut', kind: 'active', archetype: 'fighter', faction: GREEN,
  power: 2.4, reach: 'front', target: 'enemy', melee: true, unactedDouble: true,
  desc: 'Up through the guard. Half again as hard against anyone who has not moved this round.',
  tiers: tiers('Rising Cut', 'Rising Silence', 'Before the Breath', {}, { power: 2.8 }, { power: 3.2, adjacent: 1 }) });
// Ranger — the bow
def({ id: 'longbow_volley', name: 'Longbow Volley', kind: 'active', archetype: 'ranger', faction: GREEN,
  power: 1.9, reach: 'any', target: 'enemyLane',
  desc: 'Arrows over the line: everyone in a lane, all at once.',
  tiers: tiers('Longbow Volley', 'Massed Volley', 'Rain of Arrows', {}, { power: 2.2 }, { power: 2.6, status: { bleed: { power: 0.6, rounds: 3 } } }) });
def({ id: 'measured_shot', name: 'Measured Shot', kind: 'active', archetype: 'ranger', faction: GREEN,
  power: 3.0, reach: 'any', target: 'enemy', noReflect: true, cannotMiss: true,
  desc: 'Taken slowly. It cannot miss and it cannot be turned back on you.',
  tiers: tiers('Measured Shot', 'Certain Shot', 'Certain', {}, { power: 3.4 }, { power: 3.8, ignoreCover: true }) });
// Tank — stance
def({ id: 'crossing_guard', name: 'Crossing Guard', kind: 'active', archetype: 'tank', faction: GREEN,
  power: 0, reach: 'any', target: 'ally',
  desc: 'Step across for an ally beside you. Whatever comes, you each take half of it.',
  tiers: tiers('Crossing Guard', 'Two Blades', 'Two Blades One Line',
    { effect: 'share', shareWith: 'pair', rounds: 3 }, { effect: 'share', shareWith: 'pair', rounds: 4 }, { effect: 'share', shareWith: 'adjacent', rounds: 4 }) });
def({ id: 'stone_stance', name: 'Stone Stance', kind: 'active', archetype: 'tank', faction: GREEN,
  power: 0, reach: 'any', target: 'self',
  desc: 'Set and do not move. Nothing shifts you, and everything you are given is returned in full.',
  tiers: tiers('Stone Stance', 'Standing Stone', 'Mountain',
    { selfStatus: { kind: 'thorns', mult: 1.0, rounds: 2 }, thornPct: 1.0, rounds: 2, selfRoot: true, immovable: true },
    { selfStatus: { kind: 'thorns', mult: 1.0, rounds: 3 }, thornPct: 1.0, rounds: 3, selfRoot: true, immovable: true },
    { selfStatus: { kind: 'thorns', mult: 1.0, rounds: 3 }, thornPct: 1.2, rounds: 3, selfRoot: true, immovable: true, dmgTakenMult: 0.8 }) });
// Mage — voice and ward
def({ id: 'kiai', name: 'Kiai', kind: 'active', archetype: 'mage', faction: GREEN,
  power: 1.0, reach: 'any', target: 'enemyLane',
  desc: 'A shout with the whole clan behind it: the lane is Shocked and acts last.',
  tiers: tiers('Kiai', 'Clan Shout', 'Voice of the Clan',
    { shock: 0.15, shockRounds: 2 }, { shock: 0.2, shockRounds: 3 }, { shock: 0.25, shockRounds: 3, loseAction: true }) });
def({ id: 'ash_ward', name: 'Ash Ward', kind: 'active', archetype: 'mage', faction: GREEN,
  power: 0, reach: 'any', target: 'party', heal: true,
  desc: 'A screen of ash over the company: fire and every element bite less.',
  tiers: tiers('Ash Ward', 'Ash Screen', 'Cinder Screen',
    { partyStatus: { elemGuard: { mult: 0.75, rounds: 3 } } }, { partyStatus: { elemGuard: { mult: 0.65, rounds: 3 } } }, { partyStatus: { elemGuard: { mult: 0.5, rounds: 4 } } }) });
// Druid — form and reading
def({ id: 'bear_stance', name: 'Bear Stance', kind: 'active', archetype: 'druid', faction: GREEN,
  power: 0, reach: 'any', target: 'self',
  desc: 'Weight forward. You hit harder and nothing moves you at all.',
  tiers: tiers('Bear Stance', 'Standing Bear', 'Iron Bear',
    { selfStatus: { kind: 'atkBuff', mult: 1.25, rounds: 4 }, immovable: true }, { selfStatus: { kind: 'atkBuff', mult: 1.35, rounds: 4 }, immovable: true }, { selfStatus: { kind: 'atkBuff', mult: 1.5, rounds: 5 }, immovable: true, dmgTakenMult: 0.85 }) });
def({ id: 'reading_the_field', name: 'Reading the Field', kind: 'active', archetype: 'druid', faction: GREEN,
  power: 0, reach: 'any', target: 'self', revealIntents: 2,
  desc: 'Watch the shoulders, not the blade: every enemy\'s next action, for two rounds.',
  tiers: tiers('Reading the Field', 'Reading the Line', 'Nothing Hidden', {}, { revealIntents: 3 }, { revealIntents: 3, seeInvis: true, revealLoadouts: true }) });
// Healer — honour and blood
def({ id: 'field_honour', name: 'Field Honour', kind: 'active', archetype: 'healer', faction: GREEN,
  power: 2.4, reach: 'any', target: 'ally', heal: true,
  desc: 'Bind the wound and stand over it: they cannot fall this round.',
  tiers: tiers('Field Honour', 'Held Honour', 'Sworn Guard',
    { allyStatus: { kind: 'anchor', rounds: 1 } }, { power: 2.8, allyStatus: { kind: 'anchor', rounds: 2 } }, { power: 3.2, allyStatus: { kind: 'anchor', rounds: 2 }, target: 'allyLane' }) });
def({ id: 'clan_blood', name: 'Clan Blood', kind: 'active', archetype: 'healer', faction: GREEN,
  power: 0, reach: 'any', target: 'party', heal: true, healFromTaken: 0.5,
  desc: 'What the clan spends, the clan gets back: heals everyone for a share of the damage you have taken this battle.',
  tiers: tiers('Clan Blood', 'Clan Debt', 'Debt of Service', {}, { healFromTaken: 0.7 }, { healFromTaken: 1.0 }) });
// Perks
def({ id: 'unbroken_form', name: 'Unbroken Form', kind: 'perk', noTierGrowth: true, archetype: null, faction: GREEN,
  desc: 'Melee damage rises for every consecutive round you have held your lane.', laneStreakScale: 0.12,
  tiers: { advanced: { name: 'Rooted', laneStreakScale: 0.12 } } });
def({ id: 'the_clan_watches', name: 'The Clan Watches', kind: 'perk', noTierGrowth: true, archetype: null, faction: GREEN,
  desc: 'While you live, allies in your lane take less damage.', laneAllyGuard: 0.75,
  tiers: { advanced: { name: 'Their Shield', laneAllyGuard: 0.75 } } });
def({ id: 'standing_order', name: 'Standing Order', kind: 'perk', noTierGrowth: true, archetype: null, faction: GREEN, social: 'command',
  desc: 'Encounter verb: Command — works on anyone lawfully aligned.',
  tiers: { advanced: { name: 'By Authority', vs: 'lawful' } } });
def({ id: 'green_discipline', name: 'Green Discipline', kind: 'perk', noTierGrowth: true, archetype: null, faction: GREEN,
  desc: 'You act first in round one. Speed does not enter into it.', firstInRoundOne: true,
  tiers: { advanced: { name: 'First Blade', firstInRoundOne: true } } });

// =====================================================================
// 3c. THE RED TALLY — guns, powder, boarding, plunder
// =====================================================================
const TALLY = 'tally';
// Ranger — the guns
def({ id: 'flintlock_shot', name: 'Flintlock Shot', kind: 'active', archetype: 'ranger', faction: TALLY,
  power: 4.6, reach: 'any', target: 'enemy', reload: true,
  desc: 'One heavy ball. Then you are holding an empty gun — it cannot be fired twice running.',
  tiers: tiers('Flintlock Shot', 'Double-Shotted', 'Both Barrels', {}, { power: 5.2 }, { power: 5.8, hits: 2 }) });
def({ id: 'grapeshot', name: 'Grapeshot', kind: 'active', archetype: 'ranger', faction: TALLY,
  power: 1.6, reach: 'any', target: 'enemyLane',
  desc: 'A fistful of scrap down the lane. Everyone gets some of it.',
  tiers: tiers('Grapeshot', 'Langrage', 'Full Broadside',
    { status: { bleed: { power: 0.6, rounds: 3, stacks: true } } }, { power: 1.9, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } }, { power: 2.2, spreadLanes: true, status: { bleed: { power: 0.8, rounds: 3, stacks: true } } }) });
// Rogue — boarding
def({ id: 'boarding_hook', name: 'Boarding Hook', kind: 'active', archetype: 'rogue', faction: TALLY,
  power: 1.8, reach: 'any', target: 'enemy', pull: 3,
  desc: 'Iron in the rail and haul: anyone, from anywhere, into your front lane.',
  tiers: tiers('Boarding Hook', 'Grappled', 'Over the Rail', {}, { power: 2.2 }, { power: 2.6, rootRounds: 2 }) });
def({ id: 'cutlass_work', name: 'Cutlass Work', kind: 'active', archetype: 'rogue', faction: TALLY,
  power: 1.9, reach: 'front', target: 'enemy', melee: true, hits: 2,
  desc: 'Two strokes close in; the second one opens them right up.',
  tiers: tiers('Cutlass Work', 'Close Work', "Butcher's Bill",
    { exposedOnSecond: 2 }, { power: 2.2, exposedOnSecond: 2 }, { power: 2.5, hits: 3, exposedOnSecond: 2 }) });
// Mage — powder
def({ id: 'powder_keg', name: 'Powder Keg', kind: 'active', archetype: 'mage', faction: TALLY,
  power: 0, reach: 'any', target: 'enemy',
  desc: 'Roll it in and walk away. It goes off a round later and it goes off hard.',
  tiers: tiers('Powder Keg', 'Charged Keg', 'Magazine',
    { hazard: { kind: 'burn', power: 1.4, rounds: 2, delay: 1 } }, { hazard: { kind: 'burn', power: 1.8, rounds: 2, delay: 1 } }, { hazard: { kind: 'burn', power: 2.2, rounds: 3, delay: 1 } }) });
def({ id: 'fire_ship', name: 'Fire Ship', kind: 'active', archetype: 'mage', faction: TALLY,
  power: 1.2, reach: 'any', target: 'enemyLane', elemental: true, element: 'fire',
  desc: 'Set the lane alight. It burns, and their guard burns with it.',
  tiers: tiers('Fire Ship', 'Fireship Run', 'Burn Her to the Waterline',
    { status: { burn: { power: 1.0, rounds: 3 } }, defStrip: 6 }, { status: { burn: { power: 1.3, rounds: 3 } }, defStrip: 9 }, { status: { burn: { power: 1.6, rounds: 4 } }, defStripAll: true }) });
// Tank — the rail
def({ id: 'boarding_plate', name: 'Boarding Plate', kind: 'active', archetype: 'tank', faction: TALLY,
  power: 0, reach: 'any', target: 'self',
  desc: 'Brace at the rail. The next one who swings at you comes over it.',
  tiers: tiers('Boarding Plate', 'Rail Guard', 'Come Aboard',
    { guardScope: 'self', rounds: 2, pullAttacker: 1 }, { guardScope: 'self', rounds: 3, pullAttacker: 1 }, { guardScope: 'lane', rounds: 3, pullAttacker: 1, thornPct: 0.5 }) });
def({ id: 'chain_shot', name: 'Chain Shot', kind: 'active', archetype: 'tank', faction: TALLY,
  power: 2.2, reach: 'any', target: 'enemy',
  desc: 'Two balls on a chain, aimed at the rigging. Whatever it hits does not act next round.',
  tiers: tiers('Chain Shot', 'Bar Shot', 'Rigging Down', { loseAction: true }, { power: 2.6, loseAction: true }, { power: 3.0, loseAction: true, target: 'enemyLane' }) });
// Druid — sea dog
def({ id: 'sea_dog_form', name: 'Sea-Dog Form', kind: 'active', archetype: 'druid', faction: TALLY,
  power: 0, reach: 'any', target: 'self',
  desc: 'Forty years of decks under you: you hit harder and the sea itself could not move you.',
  tiers: tiers('Sea-Dog Form', 'Old Hand', 'Old Salt',
    { selfStatus: { kind: 'atkBuff', mult: 1.25, rounds: 4 }, immovable: true }, { selfStatus: { kind: 'atkBuff', mult: 1.35, rounds: 4 }, immovable: true }, { selfStatus: { kind: 'atkBuff', mult: 1.5, rounds: 5 }, immovable: true, lifeSteal: 0.2 }) });
def({ id: 'reading_the_tally', name: 'Reading the Tally', kind: 'active', archetype: 'druid', faction: TALLY,
  power: 0, reach: 'any', target: 'self', revealHp: true, revealGold: true,
  desc: 'Price the room: what every one of them is carrying, coin and gear both.',
  tiers: tiers('Reading the Tally', "Purser's Count", "Purser's Eye", {}, { revealLoadouts: true }, { revealLoadouts: true, revealPerks: true }) });
// Healer — rough mercy
def({ id: 'rum_ration', name: 'Rum Ration', kind: 'active', archetype: 'healer', faction: TALLY,
  power: 1.4, reach: 'any', target: 'party', heal: true,
  desc: 'A measure each. Not much, but it clears a man\'s head.',
  tiers: tiers('Rum Ration', 'Double Ration', 'Grog', { cures: ['shock'] }, { power: 1.7, cures: ['shock'] }, { power: 2.0, cures: ['shock', 'burn'] }) });
def({ id: 'surgeons_saw', name: "Surgeon's Saw", kind: 'active', archetype: 'healer', faction: TALLY,
  power: 3.6, reach: 'any', target: 'ally', heal: true,
  desc: 'It works. He is not gentle about it and they will bleed for a while.',
  tiers: tiers("Surgeon's Saw", 'Quick Saw', 'Rough Mercy',
    { selfBleedOnTarget: { power: 0.6, rounds: 2 } }, { power: 4.2, selfBleedOnTarget: { power: 0.6, rounds: 2 } }, { power: 4.8, selfBleedOnTarget: { power: 0.6, rounds: 2 }, revive: true, oncePerBattle: true }) });
// Perks
def({ id: 'shares_and_plunder', name: 'Shares and Plunder', kind: 'perk', noTierGrowth: true, archetype: null, faction: TALLY,
  desc: 'Every share is recorded and yours is larger: all gold up 25%.', goldMult: 1.25,
  tiers: { advanced: { name: "Captain's Portion", goldMult: 1.25 } } });
def({ id: 'powder_discipline', name: 'Powder Discipline', kind: 'perk', noTierGrowth: true, archetype: null, faction: TALLY,
  desc: 'You load while others are still looking for the ramrod: reload skills fire every round.', noReload: true,
  tiers: { advanced: { name: 'Never Empty', noReload: true } } });
def({ id: 'sea_legs', name: 'Sea Legs', kind: 'perk', noTierGrowth: true, archetype: null, faction: TALLY,
  desc: 'Nothing pulls, pushes or drags you out of your lane. Ever.', immovable: true,
  tiers: { advanced: { name: 'Deck-Born', immovable: true } } });
def({ id: 'black_flag', name: 'Black Flag', kind: 'perk', noTierGrowth: true, archetype: null, faction: TALLY, social: 'intimidate_sea',
  desc: 'Encounter verb: Intimidate at Sea — works on anyone carrying cargo or coin.',
  tiers: { advanced: { name: 'Colours Up', vs: 'carrying' } } });

// =====================================================================
// 3d. THE ADMIRALTY — saber, cannon, formation, signal
// =====================================================================
const NAVY = 'navy';
// Fighter — the saber
def({ id: 'saber_thrust', name: 'Saber Thrust', kind: 'active', archetype: 'fighter', faction: NAVY,
  power: 3.0, reach: 'front', target: 'enemy', melee: true, defIgnorePct: 0.4,
  desc: 'Straight, economical, and through the gap in the guard.',
  tiers: tiers('Saber Thrust', 'Inside the Guard', 'Through the Guard', {}, { power: 3.4, defIgnorePct: 0.5 }, { power: 3.8, defIgnorePct: 0.6 }) });
def({ id: 'riposte_line', name: 'Riposte Line', kind: 'active', archetype: 'fighter', faction: NAVY,
  power: 0, reach: 'any', target: 'self',
  desc: 'On guard: every blade that comes at you this round is answered with its own force.',
  tiers: tiers('Riposte Line', 'Parry Line', 'Parry and Answer',
    { counterNext: 2, thornPct: 1.0, rounds: 1 }, { counterNext: 3, thornPct: 1.0, rounds: 1 }, { counterNext: 4, thornPct: 1.0, rounds: 2 }) });
// Mage — the guns
def({ id: 'volley_fire', name: 'Volley Fire', kind: 'active', archetype: 'mage', faction: NAVY,
  power: 0, reach: 'any', target: 'party',
  desc: 'On my order: the whole company\'s next attack takes an extra target.',
  tiers: tiers('Volley Fire', 'Make Ready', 'Present Arms',
    { partyStatus: { volley: { extra: 1, rounds: 2 } } }, { partyStatus: { volley: { extra: 1, rounds: 3 } } }, { partyStatus: { volley: { extra: 2, rounds: 3 } } }) });
def({ id: 'ranging_cannon', name: 'Ranging Cannon', kind: 'active', archetype: 'mage', faction: NAVY,
  power: 2.0, reach: 'any', target: 'enemyLane',
  desc: 'Fire, correct, fire again. Every round you hold the same lane it hits harder.',
  tiers: tiers('Ranging Cannon', 'Finding the Range', 'Found the Range',
    { laneFocusScale: 0.3 }, { power: 2.3, laneFocusScale: 0.4 }, { power: 2.6, laneFocusScale: 0.5 }) });
// Tank — formation
def({ id: 'close_order', name: 'Close Order', kind: 'active', archetype: 'tank', faction: NAVY,
  power: 0, reach: 'any', target: 'self',
  desc: 'Shoulder to shoulder. Your lane cannot be flanked, dragged from, or walked past.',
  tiers: tiers('Close Order', 'Closed Ranks', 'Hold Fast',
    { laneStatus: { closed: { rounds: 3 } }, immovable: true }, { laneStatus: { closed: { rounds: 4 } }, immovable: true }, { laneStatus: { closed: { rounds: 4 } }, immovable: true, laneAllyGuard: 0.8 }) });
def({ id: 'chain_and_bar', name: 'Chain and Bar', kind: 'active', archetype: 'tank', faction: NAVY,
  power: 1.8, reach: 'any', target: 'enemyLane',
  desc: 'Bar shot through the whole line: Shocked, and nothing left to answer with.',
  tiers: tiers('Chain and Bar', 'Bar Across', 'Dismasted',
    { shock: 0.15, shockRounds: 2, reactionLock: 2 }, { shock: 0.2, shockRounds: 3, reactionLock: 2 }, { shock: 0.25, shockRounds: 3, reactionLock: 3 }) });
// Ranger — signal and flare
def({ id: 'signal_flags', name: 'Signal Flags', kind: 'active', archetype: 'ranger', faction: NAVY,
  power: 0, reach: 'any', target: 'ally', heal: true,
  desc: 'Two flags and a name: one ally moves the instant you are done.',
  tiers: tiers('Signal Flags', 'Repeat the Signal', 'Fleet Order', { grantTurn: 1 }, { grantTurn: 1, power: 1.0 }, { grantTurn: 2, power: 1.0 }) });
def({ id: 'flare', name: 'Flare', kind: 'active', archetype: 'ranger', faction: NAVY,
  power: 1.0, reach: 'any', target: 'allEnemies', elemental: true, element: 'fire', seeInvis: true,
  desc: 'Light the whole deck: nothing stays hidden, and what it finds is burning.',
  tiers: tiers('Flare', 'Night Flare', 'Star Shell',
    { status: { burn: { power: 0.8, rounds: 2 } } }, { status: { burn: { power: 1.0, rounds: 3 } } }, { status: { burn: { power: 1.3, rounds: 3 } }, revealLoadouts: true }) });
// Druid — marine and chart
def({ id: 'marine_form', name: 'Marine Form', kind: 'active', archetype: 'druid', faction: NAVY,
  power: 0, reach: 'any', target: 'self',
  desc: 'Boarding order: harder to put down, and everything you land leaves them open.',
  tiers: tiers('Marine Form', 'Boarding Order', 'Boarding Party',
    { selfStatus: { kind: 'aura', atk: 1.0, def: 1.25, rounds: 4 }, dmgTakenMult: 0.8, onHitExposed: 1 }, { selfStatus: { kind: 'aura', atk: 1.05, def: 1.35, rounds: 4 }, dmgTakenMult: 0.75, onHitExposed: 1 }, { selfStatus: { kind: 'aura', atk: 1.1, def: 1.5, rounds: 5 }, dmgTakenMult: 0.7, onHitExposed: 2 }) });
def({ id: 'chart_the_water', name: 'Chart the Water', kind: 'active', archetype: 'druid', faction: NAVY,
  power: 0, reach: 'any', target: 'self', reveal: true,
  desc: 'Soundings and a good chart: the next encounter, entire, before you walk into it.',
  tiers: tiers('Chart the Water', 'Sounded Ahead', 'Sounded', {}, { revealHp: true }, { revealHp: true, revealLoadouts: true }) });
// Healer — sick bay and articles
def({ id: 'sick_bay', name: 'Sick Bay', kind: 'active', archetype: 'healer', faction: NAVY,
  power: 2.0, reach: 'any', target: 'allyLane', heal: true, cures: ['bleed', 'burn'],
  desc: 'Below decks: a lane patched up, and the bleeding and burning stopped.',
  tiers: tiers('Sick Bay', 'Orlop Deck', 'Below Decks', {}, { power: 2.4 }, { power: 2.8, target: 'party' }) });
def({ id: 'articles_of_war', name: 'Articles of War', kind: 'active', archetype: 'healer', faction: NAVY,
  power: 0, reach: 'any', target: 'ally', heal: true, effect: 'share',
  desc: 'Signed under Articles: what they take, you take with them — and you both come out of it mended.',
  tiers: tiers('Articles of War', 'Under Articles', 'Sworn Under Articles',
    { shareWith: 'pair', rounds: 3, healAtEnd: 0.2 }, { shareWith: 'pair', rounds: 4, healAtEnd: 0.3 }, { shareWith: 'adjacent', rounds: 4, healAtEnd: 0.4 }) });
// Perks
def({ id: 'naval_discipline', name: 'Naval Discipline', kind: 'perk', noTierGrowth: true, archetype: null, faction: NAVY,
  desc: 'Nothing makes your lane act last — not Shock, not a shout, not anything.', laneNoDelay: true,
  tiers: { advanced: { name: 'Unshakeable', laneNoDelay: true } } });
def({ id: 'kings_commission', name: "King's Commission", kind: 'perk', noTierGrowth: true, archetype: null, faction: NAVY,
  desc: 'You are paid out of the King\'s purse: lawful contracts pay 25% more.', lawfulPayMult: 1.25,
  tiers: { advanced: { name: 'Letters of Marque', lawfulPayMult: 1.25 } } });
def({ id: 'broadside_doctrine', name: 'Broadside Doctrine', kind: 'perk', noTierGrowth: true, archetype: null, faction: NAVY,
  desc: 'Ranged skills take one additional target in the same lane.', rangedExtraTarget: 1,
  tiers: { advanced: { name: 'Full Battery', rangedExtraTarget: 1 } } });
def({ id: 'colours_and_papers', name: 'Colours and Papers', kind: 'perk', noTierGrowth: true, archetype: null, faction: NAVY, social: 'requisition',
  desc: 'Encounter verb: Requisition — works on anyone lawfully aligned or carrying cargo.',
  tiers: { advanced: { name: "By the King's Word", vs: 'lawfulOrCarrying' } } });

// ---------------------------------------------------------------- registry
ADV.DATA.CAMPAIGN2_SKILL_IDS = Object.keys(S).filter(id => S[id].campaign2);
ADV.DATA.CAMPAIGN_SKILL_IDS = Object.keys(S).filter(id => S[id].campaign);
ADV.DATA.TRAINER_POOL = Object.keys(S).filter(id => !S[id].universal && !S[id].unique);
})();
