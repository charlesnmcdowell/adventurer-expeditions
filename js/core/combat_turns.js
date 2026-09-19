// Turns subsystem. Dependencies are supplied by the combat facade.
(function(){
'use strict';
ADV.CombatModules=ADV.CombatModules||{};
ADV.CombatModules.turns=function({Ch, livingUnits, Sys, perkVal, Combat, ev}){
function buildTurnQueue(st) {
  const q = [];
  for (const u of st.units) {
    if (u.downed || u.fled || u.reserved) continue;
    let spd = Ch().effStat(u.ch, 'spd') - (u.delayed || 0);
    // Naval Discipline: nothing puts this lane at the back of the round
    const noDelay = livingUnits(st, u.side).some(x => x.lane === u.lane && Sys().knownVal(x.ch, 'laneNoDelay'));
    if (u.statuses.some(x => x.kind === 'shock') && !noDelay) spd -= 100;   // Shock: acts last
    if (Sys().knownVal(u.ch, 'firstInRoundOne') && st.round === 1) spd += 1000;
    const laneRank = { front: 0, mid: 1, back: 2 }[u.lane] || 0;
    const n = u.turnsPerRound;
    const consecutive = !!u.consecutiveTurns;
    for (let k = 0; k < n; k++) {
      // Lone Wolf distributed: spread extra turns through the round via phantom
      // speeds; Lightning King's extra turn comes straight after the first
      q.push({ uid: u.uid, spd: spd - k * (consecutive ? 0.01 : 6), laneRank, ord: u.uid, extra: k > 0 });
    }
  }
  q.sort((x, y) => y.spd - x.spd || x.laneRank - y.laneRank || (x.ord < y.ord ? -1 : 1));
  // Lightning King: the extra turn follows the first immediately, whatever ties say
  for (let i = q.length - 1; i >= 0; i--) {
    const e = q[i];
    if (!e.extra) continue;
    const u = st.units.find(x => x.uid === e.uid);
    if (!u || !u.consecutiveTurns) continue;
    q.splice(i, 1);
    const first = q.findIndex(x => x.uid === e.uid);
    q.splice(first + 1, 0, e);
  }
  // One Lightning King extra turn per side. Five kings is still one storm.
  const lkExtra = { a: false, b: false };
  for (let i = q.length - 1; i >= 0; i--) {
    const e = q[i];
    if (!e.extra) continue;
    const u = st.units.find(x => x.uid === e.uid);
    if (!u || !perkVal(u.ch, 'lightning_king', null)) continue;
    if (lkExtra[u.side]) q.splice(i, 1);
    else lkExtra[u.side] = true;
  }
  // Ambush: sneaking character gets 2 consecutive turns at the very top of round 1 (§15a)
  if (st.round === 1 && st.ambushUid) {
    const rest = q.filter(e => e.uid !== st.ambushUid);
    const own = q.filter(e => e.uid === st.ambushUid);
    q.length = 0;
    q.push({ uid: st.ambushUid, spd: 999, laneRank: 0, ord: '!' });
    q.push({ uid: st.ambushUid, spd: 998, laneRank: 0, ord: '!' });
    q.push(...rest, ...own.slice(0)); // ambusher keeps normal turns too? No — replace:
    // GDD: "two consecutive turns at the top of round one", normal order otherwise excluded
    st.turnQueue = q.filter(e => {
      if (e.uid !== st.ambushUid) return true;
      if (e.spd >= 998) return true;
      return false;
    });
    return;
  }
  st.turnQueue = q;
}

// Signal Flags / Fleet Order: splice an ally in right after the current turn.
Combat.grantTurn = function (st, u, ally, n) {
  const at = st.turnIdx + 1;
  for (let i = 0; i < (n || 1); i++) {
    st.turnQueue.splice(at + i, 0, { uid: ally.uid, spd: 0, laneRank: 0, ord: '>' + i, granted: true });
  }
  ally.grantedTurns = (ally.grantedTurns || 0) + (n || 1);
  ev(st, { t: 'grantTurn', uid: ally.uid, by: u.uid });
};


return {buildTurnQueue};
};
})();
