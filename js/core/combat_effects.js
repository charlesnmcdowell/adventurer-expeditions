// Bespoke campaign skill effects (§13). Each handler receives the combat
// internals and returns undefined to let Combat.act finish the action.
// Everything expressible as generic data stays in skills data; only skills
// whose behaviour needs real logic live here.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Ch = () => ADV.Character;
const Combat = ADV.Combat;
const E = {};

// Marked for the Knife: your damage ignores 50% of the target's Defence
E.mark = (I, st, u, tgt, d) => { I.addStatus(st, tgt, { kind: 'marked', srcUid: u.uid, rounds: d.rounds || 4 }); };

// Contract Mark: every ally deals +25% to the marked target
E.contractMark = (I, st, u, tgt, d) => { I.addStatus(st, tgt, { kind: 'contractMark', side: u.side, rounds: d.rounds || 3 }); };

// Ghoststep: reposition to any lane free; next attack takes no reflect
E.ghoststep = (I, st, u, tgt, d) => {
  const want = d.toLane || (u.lane === 'front' ? 'back' : 'front');
  if (I.laneUnits(st, u.side, want).length < C().LANE_CAP) { u.lane = want; u.slot = I.laneUnits(st, u.side, want).length - 1; }
  u.reflectImmuneNext = true; I.applyStealth(u, 2);
  I.ev(st, { t: 'stealth', uid: u.uid });
};

// Unseen Guard: guard one ally; attackers can't see the interceptor and bleed
E.unseenGuard = (I, st, u, tgt, d) => {
  const ally = tgt.side === u.side ? tgt : u;
  I.addStatus(st, u, { kind: 'guard', scope: 'ally', targetUid: ally.uid, rounds: d.rounds || 3 });
};

// Venom Draw: strip all Poison from an ally and put the total on one enemy
// Balance pass: the three tiers were the same skill under three names. What it can draw off
// now widens with the tier — poison, then bleed as well, then every wound on every ally.
E.venomDraw = (I, st, u, tgt, d) => {
  const kinds = d.drawKinds || ['poison'];
  const takes = x => x.statuses.some(s => kinds.includes(s.kind));
  const allies = I.livingUnits(st, u.side);
  const count = x => x.statuses.filter(s => kinds.includes(s.kind)).length;
  const donors = d.drawFromAll ? allies.filter(takes) : allies.filter(takes).sort((a, b) => count(b) - count(a)).slice(0, 1);
  const foe = tgt.side !== u.side ? tgt : I.livingUnits(st, u.side === 'a' ? 'b' : 'a')[0];
  if (!donors.length || !foe) return;
  let n = 0;
  for (const donor of donors) {
    for (const s of donor.statuses.filter(x => kinds.includes(x.kind))) {
      I.removeStatus(donor, s);
      I.addStatus(st, foe, (ADV.Combat.reseatDot || ((x) => x))(Object.assign({}, s), foe));
      n++;
    }
  }
  I.ev(st, { t: 'venomDraw', from: donors[0].uid, to: foe.uid, n });
};

// Last Breath: a downed ally rises for one round, then falls
E.lastBreath = (I, st, u, tgt, d) => {
  const downed = st.units.filter(x => x.side === u.side && x.downed && !x.fled && !x.reserved);
  if (!downed.length) return;
  // The three tiers used to be three names over one behaviour: one body, up at exactly 1 HP,
  // for exactly one round. They now buy something — more under the ally when they stand, a
  // second round to use it, and at the top the whole line comes up instead of one of them.
  const pct = d.reviveHp != null ? d.reviveHp : 0.01;
  const rounds = d.breathRounds || 1;
  const list = d.breathAll ? downed : [downed.includes(tgt) ? tgt : downed[0]];
  for (const t of list) {
    t.downed = false;
    t.chp = Math.max(1, Math.round(t.maxHp * pct));
    I.addStatus(st, t, { kind: 'lastBreath', rounds });
    I.ev(st, { t: 'revive', uid: t.uid, by: u.uid });
  }
};

// Bulwark Formation / Contract Bound: share incoming damage across a group
E.share = (I, st, u, tgt, d) => {
  const group = 'g' + u.uid + st.round;
  let members;
  if (d.shareWith === 'adjacent') {
    members = [u].concat(I.livingUnits(st, u.side).filter(x => x !== u && Math.abs(I.LANE_IDX[x.lane] - I.LANE_IDX[u.lane]) <= 1).slice(0, 2));
  } else members = [u, tgt.side === u.side && tgt !== u ? tgt : null].filter(Boolean);
  for (const m of members) I.addStatus(st, m, { kind: 'share', group, rounds: d.rounds || 3, healAtEnd: d.healAtEnd });
};

// Paid in Full: everything you prevented this battle, dealt to one enemy at once
E.paidInFull = (I, st, u, tgt, d) => {
  const foe = tgt.side !== u.side ? tgt : I.livingUnits(st, u.side === 'a' ? 'b' : 'a')[0];
  if (!foe) return;
  const amt = Math.max(1, Math.round(u.preventedStored * (d.mult || 1)));
  u.preventedStored = 0;
  I.dealDamage(st, u, foe, amt, 'attack', { melee: true });
};

// Company Medic: heal every ally below 50% for a reduced amount.
// Balance pass: this used to pay out of the medic's ATTACK stat while every other heal in
// the game restores a share of the target's own health — which made a whole-party heal worth
// about a tenth of a single-target one (an 18-attack medic healed ~35 a body against Mend's
// 300). It now draws on the same pool as every other heal, at a reduced rate per body
// because it lands on everyone hurt.
E.companyMedic = (I, st, u, tgt, d) => {
  const tier = d.tier || 'basic';
  const pct = (Combat.HEAL_PCT[tier] || 0.5) * (d.medicPct || 0.45);
  // The patient list widens with the tier. It used to be a flat "under half" at every tier
  // while the heal itself climbed to 82% of a body's maximum, so Triage Line poured most of
  // its work into the gap above a target's missing health and scored BELOW its own basic
  // tier over a long fight — the upgrade healed harder and accomplished less. A bigger heal
  // needs more patients to land on, not the same three.
  const below = d.medicBelow || 0.5;
  for (const x of I.livingUnits(st, u.side)) {
    if (x.chp / x.maxHp >= below) continue;
    I.healUnit(st, u, x, Math.max(1, Math.round(x.maxHp * pct)));
  }
};

// Dispel: strip all buffs and wards from one enemy (perks are untouchable, §13d-2)
// Balance pass: how much it can strip now grows with the tier (it used to take everything at
// every tier, so Unwrite and Struck From the Record were names with nothing behind them).
E.dispel = (I, st, u, tgt, d) => {
  const cap = d.dispelCap != null ? d.dispelCap : 99;
  let n = 0;
  for (const s of tgt.statuses.slice()) {
    if (n >= cap) break;
    if (I.POS_STATUSES.includes(s.kind)) { I.removeStatus(tgt, s); n++; }
  }
  I.ev(st, { t: 'dispelled', uid: tgt.uid, n });
};

Combat.EFFECTS = E;
})();
