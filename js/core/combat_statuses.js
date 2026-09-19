// Statuses subsystem. Dependencies are supplied by the combat facade.
(function(){
'use strict';
ADV.CombatModules=ADV.CombatModules||{};
ADV.CombatModules.statuses=function({Combat, C, perkVal, NEG_STATUSES, ev, spreadSeptic, laneUnits, healUnit, applyRawDamage, onUnitDown, tickHide, DOT_STATUSES, feedSepticLeech, healCleanse, checkEnd}){
// Poison & bleed: a tick is a percentage of the TARGET's max HP by the
// applying skill's tier, spread evenly over DOT_TICKS (8) so the full
// amount never lands in one turn.
// Balance pass: a single application takes 35% / 60% / 85% of the target's max HP
// over eight ticks (was 50 / 100 / 125 — one Throat Cut took a whole health bar).
const DOT_PCT = { basic: 0.35, intermediate: 0.6, advanced: 0.85 };
const BURN_TICK = 1.5;                 // flat DoTs (burn, shadow): srcAtk × power × this per tick (was 0.5)
const DOT_TICKS = 8;
Combat.DOT_PCT = DOT_PCT;
Combat.DOT_TICKS = DOT_TICKS;
function isPctDot(kind) { return kind === 'poison' || kind === 'bleed'; }
function dotWindow(rounds) {
  return DOT_TICKS;
}
Combat.dotWindow = dotWindow;
function normaliseDot(status) {
  if (!isPctDot(status.kind)) return status;
  status.tier = DOT_PCT[status.tier] != null ? status.tier : 'basic';
  status.pct = DOT_PCT[status.tier] * (status.pctMult || 1);      // pctMult: a lighter rider (class flare)
  // pctTotal: the skill names the whole share itself, ignoring its tier. Rend bleeds a flat
  // 15% a turn for three turns whoever casts it, which a tier table cannot express.
  if (status.pctTotal != null) status.pct = status.pctTotal;
  if (status.ticks == null) status.ticks = dotWindow(status.rounds);
  if (status.ticksTotal == null) status.ticksTotal = status.ticks;
  if (status.dealt == null) status.dealt = 0;
  delete status.rounds; delete status.fresh;
  return status;
}
// A transferred DoT keeps its remaining ticks; the leftover fraction is of the NEW target's max HP.
function reseatDot(status, tgt) {
  if (!isPctDot(status.kind) || !tgt) return status;
  normaliseDot(status);
  const total = Math.round((tgt.maxHp || 1) * status.pct);
  const elapsed = Math.max(0, (status.ticksTotal || status.ticks) - status.ticks);
  status.dealt = Math.round(total * elapsed / Math.max(1, status.ticksTotal));
  return status;
}
Combat.reseatDot = reseatDot;
function dotTick(st, status, tgt) {
  if (!isPctDot(status.kind)) return 0;
  normaliseDot(status);
  const total = Math.round((tgt.maxHp || 1) * status.pct);
  // even ticks; the remainder rides on the last one so the total is exact
  let dmg = status.ticks <= 1 ? Math.max(0, total - status.dealt) : Math.round(total / status.ticksTotal);
  const src = status.srcUid ? st.units.find(x => x.uid === status.srcUid) : null;
  if (src && src.side === 'b' && tgt.side === 'a') dmg = Math.round(dmg * (C().DOT_ENEMY_MULT == null ? 1 : C().DOT_ENEMY_MULT));
  return Math.max(1, dmg);
}
Combat.dotTick = dotTick;
Combat.normaliseDot = normaliseDot;

// --------------------------------------------------------------- statuses
function addStatus(st, tgt, status) {
  normaliseDot(status);
  if (status.kind === 'anchor' && (tgt.anchorSpent || tgt.statuses.some(x => x.kind === 'anchor'))) return;
  if (status.rounds != null) status.fresh = true; // survives the round it was cast
  const dm = perkVal(tgt.ch, 'demigod', null);
  const negative = NEG_STATUSES.includes(status.kind);
  if (dm && dm.statusImmune && negative) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: status.kind });
    return;
  }
  // Purify/Absolution: blanket immunity to everything negative (request 7)
  if (negative && tgt.statuses.some(x => x.kind === 'purified')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: status.kind });
    return;
  }
  // thawed targets cannot be re-frozen for 2 rounds (request 4)
  if (status.kind === 'frozen' && tgt.statuses.some(x => x.kind === 'freezeImmune' || x.kind === 'frozen')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: 'frozen' });
    return;
  }
  // Wither / heal-cut: one lock, then a gap — a row of smiters cannot shut
  // healing off for the rest of the fight.
  if (status.kind === 'withering' && tgt.statuses.some(x => x.kind === 'withering' || x.kind === 'witherImmune')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: 'withering' });
    return;
  }
  if (status.kind === 'healcut' && tgt.statuses.some(x => x.kind === 'healcut' || x.kind === 'healcutImmune')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: 'healcut' });
    return;
  }
  if (tgt.ch.statusImmunities && tgt.ch.statusImmunities.includes(status.kind)) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: status.kind });
    return;
  }
  const existing = tgt.statuses.find(s => s.kind === status.kind);
  if (existing) Object.assign(existing, status);
  else tgt.statuses.push(status);
  ev(st, { t: 'status', uid: tgt.uid, kind: status.kind });
  spreadSeptic(st, tgt, status);
}

function endRoundTicks(st) {
  // lane hazards: Ashfall / Ranging Ward damage, Growth Field heals
  for (const h of st.hazards.slice()) {
    if (h.delay > 0) { h.delay--; continue; }              // Powder Keg: one round to burn down
    for (const u of laneUnits(st, h.side, h.lane)) {
      if (h.heal) healUnit(st, null, u, Math.max(1, Math.round(h.srcAtk * h.power)));
      else {
        const srcH = h.srcUid ? st.units.find(x => x.uid === h.srcUid) : null;
        applyRawDamage(st, srcH || null, u, Math.max(1, Math.round(h.srcAtk * h.power * 0.5)), 'dot', {visual:{skillId:h.skillId,tier:h.tier,hazard:h.kind}});
      }
    }
    if (h.fresh) h.fresh = false; else { h.rounds--; if (h.rounds <= 0) st.hazards.splice(st.hazards.indexOf(h), 1); }
  }
  for (const u of st.units) {
    if (u.downed || u.fled || u.reserved) continue;
    if ((u.chp || 0) <= 0 && (u.tempHp || 0) <= 0) {
      u.chp = 0; u.downed = true;
      ev(st, { t: 'down', uid: u.uid, by: null });
      onUnitDown(st, u);
      continue;
    }
    // Last Breath: the borrowed round ends
    const lb = u.statuses.find(x => x.kind === 'lastBreath');
    if (lb && !lb.fresh) { removeStatus(u, lb); u.chp = 0; u.downed = true; ev(st, { t: 'down', uid: u.uid, by: null }); onUnitDown(st, u); continue; }
    tickHide(u);
    u.reloadLock = {};                       // a round is long enough to reload
    if (u.grantedTurns) u.grantedTurns = 0;
    if (!u.attackedThisRound) u.idleRounds++; else u.idleRounds = 0;
    u.attackedThisRound = false;
    if (u.statuses.some(x => x.kind === 'serpent')) u.evade = Math.max(u.evade, 1);
    for (const s of u.statuses.slice()) {
      if (DOT_STATUSES.includes(s.kind)) {
        let dot = isPctDot(s.kind) ? dotTick(st, s, u) : Math.max(1, Math.round((s.srcAtk || 8) * s.power * BURN_TICK * (1 + (s.srcLevel || 1) * 0.02)));
        const srcU = s.srcUid ? st.units.find(x => x.uid === s.srcUid) : null;
        const srcSeptic = srcU && (s.kind === 'bleed' || s.kind === 'poison') ? perkVal(srcU.ch, 'septic_sanguine', null) : null;
        if (srcSeptic) dot = Math.round(dot * srcSeptic.dotMult);
        const dealt = applyRawDamage(st, srcU, u, dot, 'dot', {visual:{dotKind:s.kind,tier:s.tier}});
        if ((s.kind === 'bleed' || s.kind === 'poison') && dealt > 0) feedSepticLeech(st, dealt, srcU, u);
        if (srcU && s.kind === 'burn' && dealt > 0 && !srcU.downed) {
          const py = perkVal(srcU.ch, 'pyromaniac', null);                     // burns feed the Pyromaniac too
          if (py && py.fireLeech) healUnit(st, null, srcU, Math.max(1, Math.round(dealt * py.fireLeech)));
        }
        if (isPctDot(s.kind)) {
          s.dealt += dot; s.ticks--;
          if (s.ticks <= 0) removeStatus(u, s);
          if (u.downed) break;
          continue;
        }
      }
      if (s.kind === 'hot') {
        if (s.ticks != null) {
          const srcU = s.srcUid ? st.units.find(x => x.uid === s.srcUid) : null;
          healUnit(st, srcU && !srcU.downed ? srcU : null, u, s.perTick || 1, { tick: true, noCleanse: true });
          healCleanse(st, u, 'dots', s.srcUid || null);   // every heal tick strips poison and bleed
          s.ticks--; if (s.ticks <= 0) removeStatus(u, s);
          continue;
        }
        healUnit(st, null, u, Math.max(1, Math.round((s.srcAtk || 8) * s.power)));
      }
      if (s.rounds != null) {
        if (s.fresh) { s.fresh = false; }        // first end-of-round: still active next round
        else {
          s.rounds--;
          if (s.rounds <= 0) {
            if (s.kind === 'share' && s.healAtEnd) healUnit(st, null, u, Math.max(1, Math.round(u.maxHp * s.healAtEnd)));
            if (s.kind === 'withering') u.statuses.push({ kind: 'witherImmune', rounds: 3 });
            if (s.kind === 'healcut') u.statuses.push({ kind: 'healcutImmune', rounds: 3 });
            removeStatus(u, s);
          }
        }
      }
    }
  }
  for (const u of st.units) {
    if (u.reserved) continue;
    const base = u.threatBase || 0;
    const cur = u.threat || 0;
    if (cur === base) continue;
    const next = cur + (base - cur) * 0.15;
    u.threat = cur > base ? Math.max(base, Math.round(next)) : Math.min(base, Math.round(next));
  }
  if (ADV.GatePerkCombat) ADV.GatePerkCombat.endRound(st);
  checkEnd(st);
}

function removeStatus(u, s) {
  const i = u.statuses.indexOf(s);
  if (i >= 0) u.statuses.splice(i, 1);
  if (s.kind === 'form' && !u.statuses.some(x => x.kind === 'form')) u.form = null;
  if (s.kind === 'beastShape' && !u.statuses.some(x => x.kind === 'beastShape')) { const f = u.statuses.find(x => x.kind === 'form'); if (f) removeStatus(u, f); }
  if (s.kind === 'taunted' && s.srcUid) {
    const j = u.marksBy.indexOf(s.srcUid);
    if (j >= 0 && !u.statuses.some(x => x.kind === 'taunted' && x.srcUid === s.srcUid)) u.marksBy.splice(j, 1);
  }
}


return {DOT_PCT, BURN_TICK, DOT_TICKS, isPctDot, dotWindow, normaliseDot, reseatDot, dotTick, addStatus, endRoundTicks, removeStatus};
};
})();
