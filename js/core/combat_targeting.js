// Targeting subsystem. Dependencies are supplied by the combat facade.
(function(){
'use strict';
ADV.CombatModules=ADV.CombatModules||{};
ADV.CombatModules.targeting=function({laneUnits, Combat, manifestFor, livingUnits, downedAllies, canHealOther, canWard, Sys, foeSideOf}){
function canMelee(st, attacker, target) {
  // Cover: a lane cannot be melee-targeted while a lane in front of it is occupied (§4)
  const enemySide = target.side;
  const laneOrder = ['front', 'mid', 'back'];
  const ti = laneOrder.indexOf(target.lane);
  for (let i = 0; i < ti; i++) {
    if (laneUnits(st, enemySide, laneOrder[i]).length > 0) return false;
  }
  return true;
}

Combat.validTargets = function (st, u, skillId, offensiveMode) {
  const m = manifestFor(u, skillId);
  if (!m) return [];
  const d = m.data;
  const foeSide = u.side === 'a' ? 'b' : 'a';
  const foes = livingUnits(st, foeSide).filter(x => ADV.GatePerkCombat ? ADV.GatePerkCombat.canTarget(u, x) : !x.untargetable);
  const allies = livingUnits(st, u.side);
  let target = d.target;
  if (offensiveMode && d.offensive) target = d.offensive.target || 'enemy';
  const isHeal = d.heal && !offensiveMode;
  if (d.selfRevive) return [];
  if (target === 'self') return [u];
  if (target === 'party') return isHeal || d.auraAtk ? allies : foes;
  if (isHeal || target === 'ally' || target === 'allyLane') {
    if (d.revive) {
      const downed = downedAllies(st, u.side);
      if (downed.length) return downed;
      if (!d.power) return [];
    }
    let pool2 = allies;
    if (d.healBehind) pool2 = allies.filter(x => canHealOther(u, x));
    else if (d.wardAhead) pool2 = allies.filter(x => canWard(u, x));
    return pool2;
  }
  let pool = foes;
  if (d.openerOnly && u.actedThisEncounter) return [];
  if (d.openerOrStealth) {
    // Backstab rework (campaign §0d): any lane, but ONLY as the opening action
    // of an encounter or from stealth. Otherwise greyed out.
    pool = (u.stealth || !u.actedThisEncounter) ? foes : [];
  } else if (d.reach === 'back') {
    // Rearmost occupied non-front lane (a solo front-liner is never reachable)
    const backs = foes.filter(x => x.lane === 'back');
    const mids = foes.filter(x => x.lane === 'mid');
    pool = backs.length ? backs : mids;
  } else if (d.reach === 'front') {
    if (d.laneShift || Sys().knownVal(u.ch, 'laneShift')) pool = foes;
    else pool = foes.filter(x => canMelee(st, u, x));
  }
  // Hold the Road: a held lane cannot be flanked/bypassed — back-reach skills
  // can't single it out (front-reach and any-lane skills still can)
  if (d.reach === 'back') pool = pool.filter(x => !x.statuses.some(s => s.kind === 'holdRoad'));
  if (d.instantKillIfMaxHp) pool = pool.filter(x => (x.maxHp || 0) > d.instantKillIfMaxHp);
  // requireBelowPct: an execution, not an opener. The healthy are not offered as targets at
  // all, so the skill greys out rather than being spent on someone it cannot kill.
  if (d.requireBelowPct) pool = pool.filter(x => x.maxHp && (x.chp + (x.tempHp || 0)) / x.maxHp < d.requireBelowPct);
  // Taunt marks force targeting (§3a)
  if (u.marksBy.length) {
    const forced = pool.filter(x => u.marksBy.includes(x.uid));
    if (forced.length && !isHeal && target !== 'self') return forced;
  }
  return pool;
};

// Manual aim: the player picks any living visible foe unless taunt locked
// them. Reach still binds AUTO and the AI via validTargets.
Combat.playerTargets = function (st, u, skillId, offensiveMode) {
  const legal = Combat.validTargets(st, u, skillId, offensiveMode);
  const m = manifestFor(u, skillId);
  if (!m) return legal;
  const d = m.data;
  let target = d.target;
  if (offensiveMode && d.offensive) target = d.offensive.target || 'enemy';
  const isHeal = d.heal && !offensiveMode;
  if (d.selfRevive || d.freeBuff || target === 'self' || target === 'party' || isHeal || target === 'ally' || target === 'allyLane') return legal;
  if (u.marksBy.length) {
    const forced = legal.filter(x => u.marksBy.includes(x.uid));
    if (forced.length) return forced;
  }
  let foes = livingUnits(st, foeSideOf(u)).filter(x => ADV.GatePerkCombat ? ADV.GatePerkCombat.canTarget(u, x) : !x.untargetable);
  if (d.openerOnly && u.actedThisEncounter) return [];
  if (d.openerOrStealth && !(u.stealth || !u.actedThisEncounter)) return [];
  if (d.instantKillIfMaxHp) foes = foes.filter(x => (x.maxHp || 0) > d.instantKillIfMaxHp);
  return foes.length ? foes : legal;
};

// Skip the picker only for self/party/all-foe skills, or a taunt lock.

return {canMelee};
};
})();
