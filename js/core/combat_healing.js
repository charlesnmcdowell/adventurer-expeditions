// Healing subsystem. Dependencies are supplied by the combat facade.
(function(){
'use strict';
ADV.CombatModules=ADV.CombatModules||{};
ADV.CombatModules.healing=function({removeStatus, NEG_STATUSES, ev, Combat, perkVal, C, SK, livingUnits, dealDamage, Ch, addStatus}){
function healCleanse(st, tgt, scope, byUid) {
  if (!tgt || !scope) return 0;
  let cured = 0;
  const kill = (s) => {
    if (s.kind === 'withering' && !tgt.statuses.some(x => x.kind === 'witherImmune')) {
      tgt.statuses.push({ kind: 'witherImmune', rounds: 3 });
    }
    if (s.kind === 'healcut' && !tgt.statuses.some(x => x.kind === 'healcutImmune')) {
      tgt.statuses.push({ kind: 'healcutImmune', rounds: 3 });
    }
    removeStatus(tgt, s);
    cured++;
  };
  if (scope === 'stack') {
    for (const kind of ['poison', 'bleed']) { const s = tgt.statuses.find(x => x.kind === kind); if (s) kill(s); }
  } else {
    const kinds = scope === 'all' ? NEG_STATUSES : scope === 'dots+' ? ['poison', 'bleed', 'burn', 'healcut', 'withering'] : ['poison', 'bleed', 'withering'];
    for (const x of tgt.statuses.slice()) if (kinds.includes(x.kind)) kill(x);
  }
  if (cured) {
    ev(st, { t: 'cleansed', uid: tgt.uid, cured, byHeal: true, by: byUid || null });
    if (byUid) {
      const healer = st.units.find(x => x.uid === byUid);
      if (healer) Combat.addThreat(st, healer, 8 * cured, 'healing');
    }
  }
  return cured;
}
Combat.healCleanse = healCleanse;
// what a healer's restoring heal strips, by tier
function healerCleanseScope(tier) { return tier === 'advanced' ? 'all' : tier === 'intermediate' ? 'dots+' : 'dots'; }

// A Gate opponent's supplies are shared by direct heals, drains, regeneration,
// and overheal shields. The counter lives on the combat unit, never the saved actor.
function recoveryLeft(u) {
  if (u.side !== 'b' || u.ch.c3RecoveryMax == null) return Infinity;
  return Math.max(0, Math.round(u.maxHp * u.ch.c3RecoveryMax) - (u.recoverySpent || 0));
}
Combat.recoveryLeft = recoveryLeft;
function healUnit(st, src, tgt, amount, opts) {
  opts = opts || {};
  const recovery = recoveryLeft(tgt);
  if (recovery <= 0) {
    if (!tgt.recoveryExhausted) { tgt.recoveryExhausted = true; ev(st, { t: 'recoveryExhausted', uid: tgt.uid }); }
    return 0;
  }
  // self-heals (leech, lifesteal, kill heals, drains): ≥10% of max HP clears one stack of each DoT, ≥25% clears them all
  if (!opts.noCleanse && (src == null || src === tgt) && amount > 0 && tgt.maxHp) {
    const frac = amount / tgt.maxHp;
    if (frac >= 0.25) healCleanse(st, tgt, 'dots', tgt.uid);
    else if (frac >= 0.10) healCleanse(st, tgt, 'stack', tgt.uid);
  }
  if (tgt.statuses.some(x => x.kind === 'withering')) { ev(st, { t: 'withered', uid: tgt.uid }); return 0; }
  const hc = tgt.statuses.find(x => x.kind === 'healcut');
  if (hc) amount = Math.round(amount * (1 - (hc.pct || 0.5)));
  const dm = perkVal(tgt.ch, 'demigod', null);
  if (dm) amount *= dm.healReceivedMult;
  const dev = src ? perkVal(src.ch, 'devoted', null) : null;
  if (dev) amount = Math.round(amount * dev.healMult);
  amount = Math.min(Math.round(amount), recovery);
  const missing = tgt.maxHp - tgt.chp;
  const applied = Math.min(missing, amount);
  tgt.chp += applied;
  tgt.healingReceived = (tgt.healingReceived || 0) + applied;
  let over = amount - applied;
  const tempBefore = tgt.tempHp;
  if (over > 0) {
    // Overheal -> temp HP, cap 50% of max (universal, §15a); Demigod uncapped; Devoted+ doubles
    if (dev && dev.tempHpDouble) over *= 2;
    let cap = Math.round(tgt.maxHp * ((dev && dev.tempHpCap) || C().OVERHEAL_CAP_PCT));
    if (dm && SK().demigod.overhealUncapped) cap = Infinity;
    tgt.tempHp = Math.min(cap, tgt.tempHp + Math.min(over, recovery - applied));
  }
  const tempGain = Math.max(0, tgt.tempHp - tempBefore);
  if (Number.isFinite(recovery)) tgt.recoverySpent = (tgt.recoverySpent || 0) + applied + tempGain;
  if (src) {
    const appliedPts = tgt.maxHp ? Math.round(applied / tgt.maxHp * 60) : 0;
    const overPts = tgt.maxHp && tempGain ? Math.round(tempGain / tgt.maxHp * 30) : 0;
    let n = appliedPts + overPts;
    if (src === tgt) n = Math.round(n * 0.5);
    if (n) {
      src.healingDone = (src.healingDone || 0) + applied;
      Combat.addThreat(st, src, n, 'healing');
    }
  }
  ev(st, { t: 'heal', uid: tgt.uid, by: src ? src.uid : null, amount, temp: tgt.tempHp, tick: !!opts.tick });
  // Devoted advanced: healing also damages the nearest enemy
  if (dev && dev.healSplashPct && src) {
    const foes = livingUnits(st, src.side === 'a' ? 'b' : 'a');
    if (foes.length) {
      const near = foes.sort((x, y) => ({ front: 0, mid: 1, back: 2 }[x.lane]) - ({ front: 0, mid: 1, back: 2 }[y.lane]))[0];
      dealDamage(st, src, near, Math.max(1, Math.round(amount * dev.healSplashPct) - Ch().effStat(near.ch, 'def')), 'spell');
    }
  }
  return amount;
}

// Healer & druid pass (HEALER_DRUID_PROMPT.md Part A): every restoring heal is
// a fraction of the TARGET's max HP. Nothing else computes a heal amount.
const HEAL_PCT = { basic: 0.5, intermediate: 1.0, advanced: 1.5 };
const HEAL_TARGETS = { basic: 1, intermediate: 2, advanced: 4 };
const REGEN_TICKS = 5, REGEN_COOLDOWN = 3, DRUID_TICKS = 3, DRUID_REFLECT = 0.5;
Combat.HEAL_PCT = HEAL_PCT; Combat.HEAL_TARGETS = HEAL_TARGETS;
Combat.REGEN_TICKS = REGEN_TICKS; Combat.REGEN_COOLDOWN = REGEN_COOLDOWN; Combat.DRUID_TICKS = DRUID_TICKS;
function healPct(st, src, tgt, skillId, tier, d) {
  d = d || (skillId && SK()[skillId]) || {};
  const pct = (HEAL_PCT[tier] || HEAL_PCT.basic) * (d.healMult || 1);
  return Math.max(1, Math.round((tgt.maxHp || 1) * pct));
}
Combat.healPct = healPct;
function skillArchetype(skillId) { const d = skillId && SK()[skillId]; return d ? d.archetype : null; }
Combat.skillArchetype = skillArchetype;
// intermediate heals reach two allies, advanced four: the chosen one, then the lowest
function pickHealTargets(st, u, tgt, tier) {
  const n = HEAL_TARGETS[tier] || 1;
  // the seed target is whatever the caller named: only take it if it is one of ours
  const out = (tgt && tgt.side === u.side) ? [tgt] : [];
  if (n > 1) {
    const rest = livingUnits(st, u.side).filter(x => x !== tgt && !x.downed)
      .sort((a, b) => (a.chp / a.maxHp) - (b.chp / b.maxHp));
    for (const x of rest) { if (out.length >= n) break; if (x.chp < x.maxHp) out.push(x); }
  }
  return out;
}
Combat.pickHealTargets = pickHealTargets;
function applyDruidHeal(st, u, t, tier, amt) {
  healCleanse(st, t, 'dots', u.uid);
  const old = t.statuses.find(x => x.kind === 'hot' && x.druid);
  if (old) removeStatus(t, old);
  addStatus(st, t, { kind: 'hot', druid: true, ticks: DRUID_TICKS, perTick: Math.max(1, Math.round(amt / DRUID_TICKS)), srcUid: u.uid, tier });
  const oldS = t.statuses.find(x => x.kind === 'thornShield');
  if (oldS) removeStatus(t, oldS);
  const pool = Math.round(t.maxHp * (HEAL_PCT[tier] || 0.5));
  addStatus(st, t, { kind: 'thornShield', pool, max: pool, reflectPct: DRUID_REFLECT, rounds: DRUID_TICKS, tier, srcUid: u.uid });
  ev(st, { t: 'thornShield', uid: t.uid, by: u.uid, tier });
}
Combat.applyDruidHeal = applyDruidHeal;
function cooldownLeft(u, skillId) { return (u && u.cooldowns && u.cooldowns[skillId]) || 0; }
Combat.cooldownLeft = cooldownLeft;
function tickCooldowns(st) {
  for (const u of st.units) {
    if (!u.cooldowns) continue;
    for (const k of Object.keys(u.cooldowns)) { if (u.cooldowns[k] > 0) u.cooldowns[k]--; if (u.cooldowns[k] <= 0) delete u.cooldowns[k]; }
  }
}


return {healCleanse, healerCleanseScope, recoveryLeft, healUnit, HEAL_PCT, HEAL_TARGETS, REGEN_TICKS, REGEN_COOLDOWN, DRUID_TICKS, DRUID_REFLECT, healPct, skillArchetype, pickHealTargets, applyDruidHeal, cooldownLeft, tickCooldowns};
};
})();
