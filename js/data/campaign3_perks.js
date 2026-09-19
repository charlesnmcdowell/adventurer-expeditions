// Story-earned, fixed-strength player perks. Deliberately outside TRAINER_POOL.
(function () {
'use strict';
const rows = [
  ['cure', 'Cure — Tesfaye’s Gift', 4, 'dream1', 'Reject the throne in the first dream.', 'At the start of your turn, heal the most injured companion for 6% of their maximum HP, or yourself if no companion needs healing. Once per round, up to three heals per battle.'],
  ['drain', 'Drain — the Awakened Gift', 4, 'dream1', 'Embrace the throne in the first dream. Alternative to Cure.', 'Your first damaging action each round heals you for 15% of enemy HP damage dealt, capped at 5% of your maximum HP. Up to three heals per battle; no damage-over-time or summon healing.'],
  ['hardiness', 'Mirkhollow Hardiness', 6, 'hardiness', 'Complete Mirkhollow.', 'Take 20% less Poison damage. Does not remove Poison or prevent hunger or shelter sickness.'],
  ['unbowed', 'Unbowed', 7, 'dream2', 'Reject the throne in the second dream.', 'Take 20% less fire, ice, and lightning damage, including Burning. Does not prevent their status effects. Prismatic attacks still bypass resistance.'],
  ['focus', 'Predatory Focus', 7, 'dream2', 'Embrace the throne in the second dream. Alternative to Unbowed.', 'Your first damaging action each round ignores 20% of the target’s remaining defence. Attacks already ignoring all defence gain no additional benefit.'],
  ['door', 'Hold the Door', 7, 'door', 'Wait for Beau and the nineteen prisoners; finish their rescue with Beau alive.', 'You and deployed party members begin battle with temporary HP equal to 5% of their maximum HP. Expires after round 2. Temporary summons and reserves receive no shield.'],
  ['unmasker', 'Unmasker', 8, 'unmasker', 'Defeat the Nine Lanterns shape-thieves.', 'You can target vanished enemies. Your attacks reduce enemy evasion by 15 percentage points and bypass one guaranteed dodge per round. Quest 10 can improve the evasion reduction to 25 points.'],
  ['mastery', 'Self-Mastery', 10, 'dream3', 'Reject the throne in the third dream.', 'Once per battle, surviving damage below 30% HP grants a shield worth 15% of your maximum HP for two rounds. Also triggers on your first turn if already below 30%. Does not prevent a lethal hit.'],
  ['resolve', 'Murderous Resolve', 10, 'dream3', 'Embrace the throne in the third dream. Alternative to Self-Mastery.', 'Your direct damage increases by 12% against enemies below 35% HP, including bosses. No automatic executions or extra actions.'],
  ['duke', 'Duke’s Favor', 11, 'city', 'Complete the Burning Gauntlet arrangement and save Adebayo.', 'The first enemy action to damage you each battle deals 20% less direct damage to you, including every hit of that action. Damage-over-time does not consume the protection.'],
  ['contacts', 'Consortium Contacts', 11, 'city', 'Complete Folake’s Consortium arrangement, following her earlier bargain.', 'Earn 10% more personal net quest pay, capped at 75 extra gold per successful quest. Includes solo rewards, leader income, and hireling wages. Excludes loot and reimbursements; companions keep their agreed wages.'],
  ['routes', 'Undervault Routes', 11, 'city', 'Complete Tunde Softfoot’s thieves’ arrangement.', 'Add 15 percentage points to your Flee chance, within the normal limits. Does not bypass situations where fleeing is forbidden.'],
  ['veteran', 'Gate Veteran', 14, 'veteran', 'Defeat Kolade and resolve the campaign ending.', 'You and deployed party members gain 5% maximum combat HP for the battle, preserving your existing health percentage. No permanent stat change or free healing; excludes temporary summons and reserves.'],
];
const names = {4:'The Dunmere Mines',6:'Mirkhollow',7:'The Iron Mine',8:'Varenholm’s Gate',10:'Return to Lanternhold',11:'The Hunted City',14:'The Temple of Morrak'};
ADV.DATA.CAMPAIGN3_PERKS = rows.map(([key,name,quest,group,requirement,desc]) => {
  const sk = {id:'gate_'+key, key, name, quest, questName:names[quest], group, requirement, desc,
    kind:'perk', campaignReward:true, unique:true, noSlot:true, noTierGrowth:true, passive:true,
    tiers:{basic:{name},intermediate:{name},advanced:{name}}};
  ADV.DATA.SKILLS[sk.id] = sk;
  return sk;
});
})();
