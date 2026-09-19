// Shared vault, estate, insurance, death claims (§7, §10).
// One household vault for the whole current marriage: every living spouse
// shares it. A second wife does not open a new box and lock the first.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;

const Vault = {};
let NEXT = 1;
Vault.resetIds = function (n) { NEXT = n || 1; };
Vault.syncIds = function (world) {
  for (const v of (world && world.vaults) || []) {
    const match = /^v(\d+)$/.exec(v.id || '');
    if (match) NEXT = Math.max(NEXT, Number(match[1]) + 1);
  }
};

Vault.create = function (world, holderId) {
  Vault.syncIds(world);
  const v = { id: 'v' + (NEXT++), holderId, gold: 0, items: [],
    sharedWithId: null, sharedWithIds: [], insuranceActive: false,
    pendingWithdrawals: [], sharedQuestStreak: 0, questsSinceShared: 0,
    lastWithdrawAt: {} };
  world.vaults.push(v);
  return v;
};

function partnerIdsOf(ch) {
  if (!ch) return [];
  if (ADV.Rel && ADV.Rel.partnerIds) return ADV.Rel.partnerIds(ch);
  return ch.partnerId ? [ch.partnerId] : [];
}

function stillPartners(world, a, b) {
  if (!a || !b || !a.alive || !b.alive) return false;
  if (ADV.Rel && ADV.Rel.partnerIds) return ADV.Rel.partnerIds(a).includes(b.id);
  return a.partnerId === b.id || b.partnerId === a.id;
}

function writeShares(v, ids) {
  const shares = [];
  for (const id of ids || []) {
    if (id && id !== v.holderId && shares.indexOf(id) < 0) shares.push(id);
  }
  v.sharedWithIds = shares;
  v.sharedWithId = shares[0] || null;
}

// Holder plus every id stored on the vault (old saves only have sharedWithId).
Vault.memberIds = function (v) {
  if (!v) return [];
  const ids = [];
  const add = (id) => { if (id && ids.indexOf(id) < 0) ids.push(id); };
  add(v.holderId);
  add(v.sharedWithId);
  for (const id of v.sharedWithIds || []) add(id);
  return ids;
};

Vault.isMember = function (v, ch) {
  return !!(v && ch && Vault.memberIds(v).includes(ch.id));
};

// Everyone tied to `ch` by a current marriage, walking every spouse.
// A dead seed is included so death claims can still see the household.
Vault.householdPeople = function (world, ch) {
  if (!ch || !world) return [];
  const out = [];
  const seen = {};
  const walk = (c, allowDead) => {
    if (!c || seen[c.id]) return;
    if (!c.alive && !allowDead) return;
    seen[c.id] = true;
    out.push(c);
    for (const id of partnerIdsOf(c)) walk(ADV.World.byId(world, id), false);
  };
  walk(ch, !ch.alive);
  return out;
};

function vaultsTouching(world, people) {
  const vs = [];
  const seen = {};
  const take = (v) => {
    if (!v || seen[v.id]) return;
    seen[v.id] = true;
    vs.push(v);
  };
  const ids = {};
  for (const ch of people) {
    if (ch) ids[ch.id] = true;
    if (ch && ch.vaultId) take((world.vaults || []).find(x => x.id === ch.vaultId));
  }
  for (const v of world.vaults || []) {
    if (Vault.memberIds(v).some(id => ids[id])) take(v);
  }
  return vs;
}

Vault.mergeInto = function (world, dest, src) {
  if (!dest || !src || dest === src || dest.id === src.id) return dest;
  dest.gold = (dest.gold || 0) + (src.gold || 0);
  dest.items = (dest.items || []).concat(src.items || []);
  if (src.insuranceActive) dest.insuranceActive = true;
  dest.sharedQuestStreak = Math.max(dest.sharedQuestStreak || 0, src.sharedQuestStreak || 0);
  dest.questsSinceShared = Math.min(dest.questsSinceShared || 0, src.questsSinceShared || 0);
  dest.lastWithdrawAt = Object.assign({}, src.lastWithdrawAt || {}, dest.lastWithdrawAt || {});
  if (src.pendingWithdrawals && src.pendingWithdrawals.length) {
    dest.pendingWithdrawals = (dest.pendingWithdrawals || []).concat(src.pendingWithdrawals);
  }
  src.gold = 0; src.items = [];
  for (const ch of world.characters || []) {
    if (ch.vaultId === src.id) ch.vaultId = dest.id;
  }
  const i = (world.vaults || []).indexOf(src);
  if (i >= 0) world.vaults.splice(i, 1);
  return dest;
};

function preferVault(world, vs) {
  return vs.slice().sort((a, b) => {
    if ((b.gold || 0) !== (a.gold || 0)) return (b.gold || 0) - (a.gold || 0);
    const aw = ADV.World.byId(world, a.holderId);
    const bw = ADV.World.byId(world, b.holderId);
    return ((bw && bw.sex === 'f') ? 1 : 0) - ((aw && aw.sex === 'f') ? 1 : 0);
  })[0];
}

Vault.bindHousehold = function (world, v, people) {
  if (!v || !people || !people.length) return v;
  const living = people.filter(c => c && c.alive);
  if (!living.length) return v;
  let holder = ADV.World.byId(world, v.holderId);
  if (!holder || !holder.alive || !living.some(c => c.id === holder.id) || holder.sex !== 'f') {
    holder = living.find(c => c.sex === 'f') || living[0];
    v.holderId = holder.id;
  }
  writeShares(v, living.map(c => c.id));
  for (const ch of living) ch.vaultId = v.id;
  return v;
};

// Collapse every vault in this marriage into one and point every spouse at it.
Vault.unifyHousehold = function (world, ch) {
  if (!ch || !world) return null;
  const people = Vault.householdPeople(world, ch);
  if (!people.length) return null;
  const living = people.filter(c => c.alive);
  const vs = vaultsTouching(world, people);
  let dest = preferVault(world, vs);
  if (!dest) {
    if (!living.length) return null;
    const woman = living.find(c => c.sex === 'f') || living[0];
    dest = Vault.create(world, woman.id);
  }
  for (const src of vaultsTouching(world, people)) {
    if (src.id !== dest.id) Vault.mergeInto(world, dest, src);
  }
  return Vault.bindHousehold(world, dest, people);
};

// Living spouses who still share this vault (not the viewer).
Vault.sharePartners = function (world, v, viewer) {
  if (!v) return [];
  v = Vault.reconcile(world, v) || v;
  return Vault.memberIds(v).map(id => ADV.World.byId(world, id))
    .filter(c => c && c.alive && (!viewer || c.id !== viewer.id)
      && (!viewer || stillPartners(world, viewer, c) || stillPartners(world, ADV.World.byId(world, v.holderId), c)));
};

// Living spouse who still shares this vault, or null if they died or were jilted.
Vault.livingShare = function (world, v) {
  if (!v) return null;
  const holder = ADV.World.byId(world, v.holderId);
  return Vault.memberIds(v).map(id => ADV.World.byId(world, id))
    .find(c => c && holder && c.id !== holder.id && stillPartners(world, holder, c)) || null;
};

Vault.sharePartner = function (world, v, viewer) {
  if (!v || !viewer) return null;
  const others = Vault.sharePartners(world, v, viewer);
  return others[0] || null;
};

// Drop a dead or jilted key-holder. Remaining living spouses still share.
Vault.reconcile = function (world, v) {
  if (!v || !world) return v;
  const holder = ADV.World.byId(world, v.holderId);
  const seed = (holder && holder.alive) ? holder
    : Vault.memberIds(v).map(id => ADV.World.byId(world, id)).find(c => c && c.alive);
  if (seed && Vault.householdPeople(world, seed).filter(c => c.alive).length > 1) {
    return Vault.unifyHousehold(world, seed) || v;
  }
  const other = v.sharedWithId ? ADV.World.byId(world, v.sharedWithId) : null;
  if (holder && !holder.alive) {
    if (other && other.vaultId === v.id && other.id !== v.holderId) other.vaultId = null;
    writeShares(v, []);
    return v;
  }
  const keep = [];
  for (const id of Vault.memberIds(v)) {
    if (id === v.holderId) continue;
    const otherCh = ADV.World.byId(world, id);
    if (stillPartners(world, holder, otherCh)) keep.push(id);
    else if (otherCh && otherCh.vaultId === v.id && v.holderId !== otherCh.id) otherCh.vaultId = null;
  }
  if (!keep.length && holder && holder.alive) {
    const next = partnerIdsOf(holder).map(id => ADV.World.byId(world, id))
      .find(c => c && c.alive);
    if (next) {
      keep.push(next.id);
      next.vaultId = v.id;
    }
  }
  writeShares(v, keep);
  if (!v.sharedWithId) { v.sharedQuestStreak = 0; v.questsSinceShared = 0; }
  return v;
};

Vault.of = function (world, ch) {
  if (!ch) return null;
  if (ch.alive && Vault.householdPeople(world, ch).filter(c => c.alive).length > 1) {
    return Vault.unifyHousehold(world, ch);
  }
  if (!ch.vaultId) return null;
  const v = (world.vaults || []).find(x => x.id === ch.vaultId) || null;
  if (!v) { ch.vaultId = null; return null; }
  if (!ch.alive) return v;
  Vault.reconcile(world, v);
  if (ch.vaultId !== v.id) {
    const now = (world.vaults || []).find(x => x.id === ch.vaultId);
    return now || null;
  }
  if (v.holderId !== ch.id && !Vault.isMember(v, ch)) {
    ch.vaultId = null;
    return null;
  }
  return v;
};

Vault.ensureOwn = function (world, ch) {
  // A woman holds her own vault; an unpartnered man banks into his own too —
  // custody transfers on commitment (§7). Married people join the household
  // vault instead of opening a second box.
  let v = Vault.of(world, ch);
  if (v) return v;
  if (ch && ch.alive && Vault.householdPeople(world, ch).filter(c => c.alive).length > 1) {
    return Vault.unifyHousehold(world, ch);
  }
  v = Vault.create(world, ch.id);
  ch.vaultId = v.id;
  return v;
};

Vault.wealthOf = function (world, ch) {
  let g = ch.inventory.gold || 0;
  const v = Vault.of(world, ch);
  if (v && Vault.isMember(v, ch)) g += v.gold;
  return g;
};

// On commitment: the household keeps one vault. A new spouse joins it;
// a bachelor's personal box is poured in. The woman holds the name (§7).
Vault.onCommit = function (world, woman, man) {
  const people = [];
  const seen = {};
  for (const seed of [woman, man]) {
    for (const c of Vault.householdPeople(world, seed)) {
      if (c && !seen[c.id]) { seen[c.id] = true; people.push(c); }
    }
  }
  let dest = preferVault(world, vaultsTouching(world, people));
  if (!dest) dest = Vault.create(world, woman.id);
  if (dest.holderId === man.id || !ADV.World.byId(world, dest.holderId) || ADV.World.byId(world, dest.holderId).sex !== 'f') {
    dest.holderId = woman.id;
  }
  for (const src of vaultsTouching(world, people)) {
    if (src.id !== dest.id) Vault.mergeInto(world, dest, src);
  }
  dest.gold += man.inventory.gold || 0;
  man.inventory.gold = 0;
  dest.sharedQuestStreak = 0;
  dest.questsSinceShared = 0;
  Vault.bindHousehold(world, dest, people);
  return dest;
};

Vault.spouses = function (world, ch) {
  if (!ch) return [];
  return partnerIdsOf(ch).map(id => ADV.World.byId(world, id)).filter(c => c && c.alive);
};

// On breakup: he loses access permanently; she keeps everything (§7) — unless
// a remaining household is still married, in which case that house keeps the box.
Vault.onBreakup = function (world, a, b) {
  const woman = a.sex === 'f' ? a : b;
  const man = a.sex === 'f' ? b : a;
  const hers = Vault.householdPeople(world, woman).filter(c => c && c.alive);
  const his = Vault.householdPeople(world, man).filter(c => c && c.alive);
  const used = (world.vaults || []).filter(v =>
    (woman && woman.vaultId === v.id) || (man && man.vaultId === v.id)
    || Vault.isMember(v, woman) || Vault.isMember(v, man));

  if (hers.length > 1) {
    const dest = Vault.unifyHousehold(world, woman);
    if (his.length <= 1 && dest && man.vaultId === dest.id) man.vaultId = null;
    return;
  }
  if (his.length > 1) {
    const dest = Vault.unifyHousehold(world, man);
    if (dest && woman.vaultId === dest.id) woman.vaultId = null;
    return;
  }
  const v = used[0] || Vault.of(world, woman);
  if (!v) {
    if (man && man.vaultId) man.vaultId = null;
    return;
  }
  writeShares(v, []);
  v.pendingWithdrawals = [];
  v.lastWithdrawAt = {};
  v.insuranceActive = false;
  v.sharedQuestStreak = 0;
  v.questsSinceShared = 0;
  if (woman && woman.sex === 'f') v.holderId = woman.id;
  if (woman) woman.vaultId = v.id;
  if (man && man.vaultId === v.id) man.vaultId = null;
};

// Deposits are always free (§7).
Vault.deposit = function (world, ch, gold, items) {
  let v = Vault.of(world, ch);
  if (!v) v = Vault.ensureOwn(world, ch);
  v.gold += gold || 0;
  if (items) v.items.push(...items);
  return v;
};

// ---- Withdrawal caps (campaign §0e) ---------------------------------------
// Replaces the coin-flip: a partner says HOW MUCH, not yes/no. The cap is set
// by partner happiness (shared questing) and the partner's sex; Charm adds 10%.
Vault.partnerState = function (v) {
  if (v.sharedQuestStreak >= C().SHARED_STREAK_TARGET) return 'happy';
  if (v.questsSinceShared >= 3 || (v.sharedQuestStreak === 0 && v.questsSinceShared === 0)) return 'neutral';
  return 'content';
};
const CAPS = { f: { happy: 0.8, content: 0.5, neutral: 0.25 }, m: { happy: 0.9, content: 0.6, neutral: 0.35 } };
Vault.withdrawalCap = function (world, v, requester) {
  v = Vault.reconcile(world, v) || v;
  const partner = Vault.sharePartner(world, v, requester);
  if (!partner) return { pct: 1, state: 'own', partner: null };
  const state = Vault.partnerState(v);
  let pct = CAPS[partner.sex === 'm' ? 'm' : 'f'][state];
  const charm = requester.perks.some(e => e.skillId === 'charm');
  if (charm) pct = Math.min(1, pct + 0.10);
  pct = Math.round(pct * 100) / 100;
  return { pct, state, partner, charm };
};
// Legacy shim (older callers): the cap expressed as a probability of a full grant.
Vault.approvalChance = function (world, v, requester, amount) {
  return Vault.withdrawalCap(world, v, requester).pct;
};

// One draw per stay in a shared vault. The next quest (clock tick) unlocks another.
Vault.withdrawnThisStay = function (world, v, requester) {
  if (!v || !requester) return false;
  const stamp = (v.lastWithdrawAt || {})[requester.id];
  return stamp != null && stamp >= (world.questClock | 0);
};

// Request by an NPC or the player. Gold only — items can never be withdrawn
// by a spouse (§7). Shared vaults resolve up to the cap, once per stay.
Vault.requestWithdrawal = function (world, rng, requester, amount) {
  const v = Vault.of(world, requester);
  if (!v) return { ok: false, error: 'no vault' };
  amount = Math.min(amount, v.gold);
  if (amount <= 0) return { ok: false, error: 'empty' };
  const cap = Vault.withdrawalCap(world, v, requester);
  if (cap.partner && Vault.withdrawnThisStay(world, v, requester)) {
    return { ok: true, approved: false, waited: true, amount: 0, cap: cap.pct, state: cap.state };
  }
  let allowed = Math.min(amount, Math.floor(v.gold * cap.pct));
  if (allowed <= 0 && cap.pct > 0 && v.gold > 0) allowed = 1;
  if (allowed <= 0) return { ok: true, approved: false, amount: 0, cap: cap.pct, state: cap.state };
  v.gold -= allowed; requester.inventory.gold += allowed;
  if (cap.partner) {
    v.lastWithdrawAt = v.lastWithdrawAt || {};
    v.lastWithdrawAt[requester.id] = world.questClock | 0;
  }
  return { ok: true, approved: true, amount: allowed, trimmed: allowed < amount, cap: cap.pct, state: cap.state };
};

// Queued requests no longer occur (caps resolve instantly); kept for save compatibility.
Vault.resolvePending = function (world, v, idx, approve) {
  const req = v.pendingWithdrawals[idx];
  if (!req) return null;
  v.pendingWithdrawals.splice(idx, 1);
  const requester = ADV.World.byId(world, req.requesterId);
  if (!requester || !requester.alive) return null;
  const player = ADV.World.byId(world, world.playerId);
  if (approve) {
    const amt = Math.min(req.amount, v.gold);
    v.gold -= amt; requester.inventory.gold += amt;
    ADV.Rel.move(world, requester.id, player.id, C().REL_MOVE.withdrawalApproved, 'quest');
  } else {
    ADV.Rel.move(world, requester.id, player.id, C().REL_MOVE.withdrawalRefused, 'quest');
  }
  return { requester, approved: approve, amount: req.amount };
};

// Shared quest bookkeeping, called on quest resolution.
Vault.onQuestResolved = function (world, ch, questedWithPartner) {
  const v = Vault.of(world, ch);
  if (!v || !Vault.sharePartners(world, v, ch).length) return;
  if (questedWithPartner) { v.sharedQuestStreak++; v.questsSinceShared = 0; }
  else { v.sharedQuestStreak = 0; v.questsSinceShared++; }
};

// ---- Insurance (§7/§16) -----------------------------------------------------
// Premium comes from the purse first, then the household vault. After a
// remarriage the man's gold is already in her vault, so purse-only failed.
Vault.payPremium = function (world, ch) {
  const v = Vault.ensureOwn(world, ch);
  const cost = C().GOLD.insurancePremium;
  if (!v || v.insuranceActive) return false;
  let need = cost;
  const fromPurse = Math.min(ch.inventory.gold || 0, need);
  need -= fromPurse;
  const fromVault = Math.min(v.gold || 0, need);
  need -= fromVault;
  if (need > 0) return false;
  ch.inventory.gold = (ch.inventory.gold || 0) - fromPurse;
  v.gold -= fromVault;
  v.insuranceActive = true;
  return true;
};

// ---- Death claims (§7) ------------------------------------------------------
// Returns {vaultTo: 'killerEx'|'eldestChild'|'lost', payoutTo}
Vault.onDeath = function (world, deceased, killerId) {
  const living = Vault.spouses(world, deceased);
  const v = (world.vaults || []).find(x => x.id === deceased.vaultId)
    || (living[0] && (world.vaults || []).find(x => x.id === living[0].vaultId))
    || (world.vaults || []).find(x => Vault.isMember(x, deceased))
    || null;
  const killer = killerId ? ADV.World.byId(world, killerId) : null;
  const out = { vaultTo: 'lost', gold: v ? v.gold : 0 };
  // insurance covers the household: whichever of the pair dies, the
  // survivor is paid — the policy may sit on either partner's vault
  const seen = {};
  const policies = [];
  const take = (x) => { if (x && x.insuranceActive && !seen[x.id]) { seen[x.id] = true; policies.push(x); } };
  take(v);
  for (const s of living) take((world.vaults || []).find(x => x.id === s.vaultId));
  if (policies.length) {
    const survivor = living[0];
    if (survivor) {
      survivor.inventory.gold += C().GOLD.insurancePayout;
      out.payoutTo = survivor.id;
    }
    for (const pol of policies) pol.insuranceActive = false;
  }
  if (!v) return out;
  const wasEx = killer && killer.sex === 'm' && (deceased.exIds || []).includes(killer.id);
  const isSpouse = killer && (ADV.Rel ? ADV.Rel.isPartner(deceased, killer) : deceased.partnerId === killer.id);
  if (v.holderId === deceased.id && killer && (wasEx || isSpouse)) {
    killer.inventory.gold += v.gold;
    killer.inventory.items = (killer.inventory.items || []).concat(v.items);
    v.gold = 0; v.items = [];
    out.vaultTo = 'killerEx'; out.claimantId = killer.id;
    return out;
  }
  if (living.find(c => c.sex === 'f') || (living.length && v.holderId !== deceased.id)) {
    if (living.length) Vault.unifyHousehold(world, living[0]);
    if (deceased.vaultId && v.holderId !== deceased.id) deceased.vaultId = null;
    out.vaultTo = 'household';
    return out;
  }
  if (v.holderId !== deceased.id) {
    if (deceased.vaultId === v.id) deceased.vaultId = null;
    return out;
  }
  // Otherwise: eldest surviving child (adult heir preferred, else recorded for maturation)
  const heir = Vault.eldestHeir(world, deceased);
  if (heir) {
    if (heir.adult) {
      const hv = Vault.ensureOwn(world, heir.ch);
      hv.gold += v.gold; hv.items.push(...v.items);
    } else {
      const pending=heir.child.pendingEstate||{gold:0,items:[]};
      heir.child.pendingEstate = { gold: pending.gold+v.gold, items: pending.items.concat(v.items) };
    }
    v.gold = 0; v.items = [];
    out.vaultTo = 'eldestChild'; out.claimantId = heir.adult ? heir.ch.id : heir.child.id;
    return out;
  }
  return out; // no children survive: the estate is lost (§7)
};

Vault.eldestHeir = function (world, deceased) {
  // Adult children first (by maturation order), then oldest self-sufficient dependent.
  const adults = world.characters.filter(c => c.alive && !c.isMonster &&
    (c.motherId === deceased.id || c.fatherId === deceased.id));
  if (adults.length) return { adult: true, ch: adults[0] };
  const young=(world.orphans||[]).concat(...world.characters.map(c=>c.dependents||[]));
  const deps = young.filter(d => (d.motherId===deceased.id||d.fatherId===deceased.id) && d.age >= C().CHILD_SELF_SUFFICIENT);
  if (deps.length) return { adult: false, child: deps.sort((a, b) => b.age - a.age)[0] };
  return null;
};

ADV.Vault = Vault;
})();
