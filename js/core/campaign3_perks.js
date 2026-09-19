// Cross-life reward ledger. Campaign replay resets the story, not earned milestones.
(function () {
'use strict';
const R = {};
const catalog = () => ADV.DATA.CAMPAIGN3_PERKS;
R.state = game => game.meta.gatePerks || (game.meta.gatePerks = {earned:{}, pending:[], seen:{}});
R.has = (ch, key) => !!(ch && ch.isPlayer && (ch.perks || []).some(e => e.skillId === 'gate_'+key));
R.visible = game => Object.keys(R.state(game).earned).length > 0;
R.reconcile = function (game) {
  const p = ADV.Game.player(game);
  if (!p) return false;
  const s = ADV.Campaign3.state(game), r = R.state(game), c = s.choices, f = s.flags;
  let changed = false;
  function grant(key, rank) {
    const sk = catalog().find(x => x.key === key), id = sk.id;
    rank = rank || 1;
    let replaced = false;
    // Swapping a replayed branch replaces only that milestone's alternative.
    for (const other of catalog().filter(x => x.group === sk.group && x.id !== id)) {
      if (r.earned[other.id]) { delete r.earned[other.id]; changed = true; replaced = true; }
      r.pending = r.pending.filter(n => n.id !== other.id);
    }
    const previous = r.earned[id] || 0;
    if (rank > previous) {
      r.earned[id] = rank;
      if (r.seen[id] !== rank || replaced) {
        r.pending = r.pending.filter(n => n.id !== id);
        r.pending.push({id, rank, improved:previous > 0, replaced});
      }
      changed = true;
    }
  }
  for (const [n, choice, flag, light, dark] of [[4,'q4_dream','dream1','cure','drain'],[7,'q7_dream','dream2','unbowed','focus'],[10,'q10_dream','dream3','mastery','resolve']]) {
    const v = c[choice] || f[flag];
    if (s.stage >= n && (v === 'reject' || v === 'embrace')) grant(v === 'reject' ? light : dark);
  }
  if (s.stage >= 6) grant('hardiness');
  if (s.stage >= 7 && f.waitedForDorran && !f.floodedEarly && !s.dead.includes('dorran')) grant('door');
  if (s.stage >= 8) grant('unmasker', s.stage >= 10 && ['question','strike_alone'].includes(c.q10_double) ? 2 : 1);
  if (s.stage >= 11) {
    const city = {gauntlet:'duke',consortium:'contacts',thieves:'routes'}[c.q11_allegiance || s.allegiance];
    if (city && (city !== 'contacts' || f.lysandraBargain)) grant(city);
  }
  if (s.stage >= 14 && s.ending) grant('veteran');
  const before = p.perks.length;
  p.perks = p.perks.filter(e => !ADV.DATA.SKILLS[e.skillId]?.campaignReward || r.earned[e.skillId]);
  if (before !== p.perks.length) changed = true;
  for (const [id, rank] of Object.entries(r.earned)) {
    let entry = p.perks.find(e => e.skillId === id);
    if (!entry) { entry = {skillId:id,level:1,uses:0}; p.perks.push(entry); changed = true; }
    if (entry.campaignRank !== rank) { entry.campaignRank = rank; changed = true; }
  }
  if (changed && ADV.Save) ADV.Save.saveGame(game);
  return changed;
};
R.description = function (game, id) {
  const sk = ADV.DATA.SKILLS[id];
  if (id === 'gate_unmasker' && R.state(game).earned[id] >= 2) return 'You can target vanished enemies. Your attacks reduce enemy evasion by 25 percentage points and bypass one guaranteed dodge per round. Improved by recognizing the impostor in quest 10.';
  return sk.desc;
};
R.acknowledge = function (game, notices) {
  const r = R.state(game);
  for (const n of notices) r.seen[n.id] = n.rank;
  r.pending = r.pending.filter(n => !notices.some(x => x.id === n.id && x.rank === n.rank));
  ADV.Save.saveGame(game);
};
R.questBonus = function (game, q, out) {
  const p = ADV.Game.player(game);
  if (!R.has(p, 'contacts') || q.gateBonusSettled) return;
  q.gateBonusSettled = true;
  const field = out.wage > 0 ? 'wage' : 'gold';
  const bonus = Math.min(75, Math.floor(Math.max(0, out[field] || 0) * 0.1));
  if (!bonus) return;
  out[field] += bonus; out.campaignBonus = bonus; p.inventory.gold += bonus;
};
ADV.GatePerks = R;
})();
