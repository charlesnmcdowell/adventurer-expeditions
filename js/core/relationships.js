// Relationship graph (§6, §15): directed sparse edges, slot limits, tiers,
// propagation, jealousy, envy, jilting. The player is one node among many.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;

const Rel = {};

// world.edges: [{fromId, toId, score, cause, decays}]
// Each NPC: 1 player edge (always available) + 1 NPC slot. Inbound edges free.

Rel.get = function (world, fromId, toId) {
  return world.edges.find(e => e.fromId === fromId && e.toId === toId) || null;
};

Rel.rawScore = function (world, fromId, toId) {
  const e = Rel.get(world, fromId, toId);
  return e ? e.score : 0;
};
// Effective regard: the stored edge, lifted to Friendly where the courtship
// rules say so (shared quests, the wealth ladder, Lookism). Floors are
// computed, not stored, so the one-NPC-slot edge budget (§6) is untouched.
Rel.score = function (world, fromId, toId) {
  const base = Rel.rawScore(world, fromId, toId);
  if (base >= C().REL.FRIENDLY_MIN || base <= C().REL.HATRED_MAX) return base;
  if (ADV.Courtship && ADV.Courtship.floorApplies(world, fromId, toId)) return C().REL.FRIENDLY_MIN;
  return base;
};

Rel.tier = function (score) {
  const R = C().REL;
  if (score <= R.HATRED_MAX) return 'hatred';
  if (score >= R.FRIENDLY_MIN) return 'friendly';
  return 'neutral';
};

Rel.tierBetween = function (world, fromId, toId) {
  const a = ADV.World.byId(world, fromId);
  if (a && Rel.isPartner(a, ADV.World.byId(world, toId))) return 'romantic';
  return Rel.tier(Rel.score(world, fromId, toId));
};

Rel.partnerIds = function (ch) {
  if (!ch) return [];
  if (ch.partnerIds && ch.partnerIds.length) return ch.partnerIds.filter(Boolean);
  return ch.partnerId ? [ch.partnerId] : [];
};
Rel.isPartner = function (a, b) {
  if (!a || !b) return false;
  return Rel.partnerIds(a).includes(b.id) || Rel.partnerIds(b).includes(a.id);
};
Rel.setPartners = function (ch, ids) {
  ch.partnerIds = (ids || []).slice();
  ch.partnerId = ch.partnerIds[0] || null;
};
Rel.addPartner = function (ch, otherId) {
  const ids = Rel.partnerIds(ch);
  if (!ids.includes(otherId)) ids.push(otherId);
  Rel.setPartners(ch, ids);
};
Rel.removePartner = function (ch, otherId) {
  Rel.setPartners(ch, Rel.partnerIds(ch).filter(id => id !== otherId));
};

function childRole(sex) { return sex === 'f' ? 'daughter' : 'son'; }
function spouseRole(sex) { return sex === 'f' ? 'wife' : 'husband'; }
function childLabel(d) {
  if (d && d.name) return d.name;
  return d && d.sex === 'f' ? 'Daughter' : 'Son';
}

// Spouses and children of `ch`, living and dead. Young dependents are
// included even though they are not roster adults. Jilted exes are not
// family — only a death writes deadSpouseIds.
Rel.familyOf = function (world, ch) {
  if (!ch || !world) return [];
  const out = [];
  const seen = {};
  const add = (entry) => {
    if (!entry) return;
    const key = entry.id || ('anon:' + (entry.name || '') + ':' + entry.role);
    if (seen[key]) return;
    seen[key] = true;
    out.push(entry);
  };
  for (const id of Rel.partnerIds(ch)) {
    const p = ADV.World.byId(world, id);
    if (!p) continue;
    add({ id: p.id, name: p.name, role: spouseRole(p.sex), alive: !!p.alive, ch: p });
  }
  for (const id of (ch.deadSpouseIds || [])) {
    const p = ADV.World.byId(world, id);
    add({
      id, name: p ? p.name : 'Spouse', role: spouseRole(p && p.sex),
      alive: false, ch: p || null,
    });
  }
  if (ADV.Death && ADV.Death.graves && ch.name) {
    for (const g of ADV.Death.graves(world)) {
      const spouses = g.obituary && g.obituary.spouses;
      if (spouses && spouses.includes(ch.name)) {
        add({ id: g.id, name: g.name, role: spouseRole(g.sex), alive: false, ch: g });
      }
    }
  }
  const takeYoung = (d, alive) => {
    if (!d) return;
    add({
      id: d.id, name: childLabel(d), role: childRole(d.sex),
      alive: !!alive, young: true, age: d.age, dep: d, ch: null,
    });
  };
  for (const d of (ch.dependents || [])) takeYoung(d, true);
  for (const d of (ch.deadDependents || [])) takeYoung(d, false);
  for (const id of Rel.partnerIds(ch)) {
    const p = ADV.World.byId(world, id);
    if (!p) continue;
    for (const d of (p.dependents || [])) {
      if (d.fatherId === ch.id || d.motherId === ch.id) takeYoung(d, true);
    }
    for (const d of (p.deadDependents || [])) {
      if (d.fatherId === ch.id || d.motherId === ch.id) takeYoung(d, false);
    }
  }
  const want = {};
  for (const id of (ch.childIds || [])) want[id] = true;
  for (const c of (world.characters || [])) {
    if (!c || c.id === ch.id || c.isMonster) continue;
    if (c.motherId === ch.id || c.fatherId === ch.id || want[c.id]) {
      add({
        id: c.id, name: c.name, role: childRole(c.sex),
        alive: !!c.alive, ch: c, young: false,
      });
    }
  }
  const rank = (e) => {
    const spouse = (e.role === 'wife' || e.role === 'husband') ? 0 : 1;
    return spouse * 2 + (e.alive ? 0 : 1);
  };
  out.sort((a, b) => rank(a) - rank(b) || String(a.name || '').localeCompare(String(b.name || '')));
  return out;
};

Rel.familyIds = function (world, ch) {
  const ids = {};
  for (const f of Rel.familyOf(world, ch)) if (f.id) ids[f.id] = true;
  return ids;
};

Rel.isFamily = function (world, ch, other) {
  if (!ch || !other) return false;
  return !!Rel.familyIds(world, ch)[other.id];
};

// Stable: family of `ch` first, original relative order otherwise.
Rel.familyFirst = function (world, ch, list) {
  const ids = Rel.familyIds(world, ch);
  return (list || []).slice().sort((a, b) => {
    const fa = ids[a.id] ? 0 : 1;
    const fb = ids[b.id] ? 0 : 1;
    return fa - fb;
  });
};

// Warmth position within the current band: 'low' | 'mid' | 'high' (§6)
Rel.warmth = function (score) {
  const t = Rel.tier(score);
  let lo, hi;
  if (t === 'hatred') { lo = -100; hi = -50; }
  else if (t === 'friendly') { lo = 50; hi = 100; }
  else { lo = -49; hi = 49; }
  const pos = (score - lo) / (hi - lo);
  return pos < 0.34 ? 'low' : pos < 0.67 ? 'mid' : 'high';
};

function playerId(world) { return world.playerId; }

// Slot enforcement: player edge always materialized; one NPC slot with
// displacement by magnitude (§6). Inbound edges are unlimited and free —
// enforcement is on OUTBOUND edges only.
function enforceSlots(world, fromId) {
  const pid = playerId(world);
  if (fromId === pid) return; // the player's outbound edges are unbounded
  const mine = world.edges.filter(e => e.fromId === fromId && e.toId !== pid);
  const slots = 1;
  if (mine.length <= slots) return;
  mine.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  // partner edge is protected: romance occupies the NPC slot
  const ch = ADV.World.byId(world, fromId);
  const keep = new Set();
  const pids = Rel.partnerIds(ch);
  for (const pid of pids) {
    const pe = mine.find(e => e.toId === pid);
    if (pe) keep.add(pe);
  }
  for (const e of mine) { if (keep.size < slots) keep.add(e); }
  for (const e of mine) {
    if (!keep.has(e)) {
      const i = world.edges.indexOf(e);
      if (i >= 0) world.edges.splice(i, 1);
    }
  }
}

// set/add with cause. opts: {set: bool, cause, decays, noPropagate, feed}
Rel.move = function (world, fromId, toId, delta, cause, opts) {
  if (fromId === toId) return null;
  const from = ADV.World.byId(world, fromId);
  if (from && !from.alive) return null;
  opts = opts || {};
  let e = Rel.get(world, fromId, toId);
  const before = e ? e.score : 0;
  const beforeTier = Rel.tier(before);
  if (!e) {
    e = { fromId, toId, score: 0, cause: cause || 'quest', decays: !!opts.decays };
    world.edges.push(e);
  }
  if (opts.set) e.score = delta;
  else e.score = Math.max(C().REL.MIN, Math.min(C().REL.MAX, e.score + delta));
  if (cause) e.cause = cause;
  if (ADV.Conversation && ['theft', 'jilt', 'rescue', 'quest'].includes(cause)) {
    ADV.Conversation.remember(world, cause, toId, fromId);
  }
  if (opts.decays != null) e.decays = opts.decays;
  if (opts.floor != null) e.score = Math.max(opts.floor, e.score);
  if (opts.ceiling != null) e.score = Math.min(opts.ceiling, e.score);
  enforceSlots(world, fromId);
  const afterTier = Rel.tier(e.score);
  const crossed = beforeTier !== afterTier ? { from: beforeTier, to: afterTier } : null;
  // prune near-zero envy edges that fully decayed
  if (e.score === 0 && e.decays) {
    const i = world.edges.indexOf(e);
    if (i >= 0) world.edges.splice(i, 1);
  }
  return { edge: e, crossed };
};

// Second-order propagation, capped at one hop (§6): friends of the affected
// party shift toward the actor at half strength.
Rel.propagate = function (world, aboutId, towardId, delta, cause) {
  const half = Math.round(delta * C().REL_MOVE.propagationFactor);
  if (!half) return;
  for (const e of world.edges.slice()) {
    if (e.toId !== aboutId) continue;           // people who care about `aboutId`
    if (e.fromId === towardId || e.fromId === aboutId) continue;
    if (e.score >= C().REL.FRIENDLY_MIN) {
      Rel.move(world, e.fromId, towardId, half, cause, { noPropagate: true });
    }
  }
};

// ---- Hatred bookkeeping -----------------------------------------------------
Rel.hatersOf = function (world, id) {
  return world.edges.filter(e => e.toId === id && e.score <= C().REL.HATRED_MAX)
    .map(e => e.fromId)
    .filter(fid => {
      const c = world.characters.find(x => x.id === fid);
      return c && c.alive;
    });
};

Rel.hatredEdgeCount = function (world, id) { return Rel.hatersOf(world, id).length; };

Rel.hates = function (world, fromId, toId) {
  return Rel.score(world, fromId, toId) <= C().REL.HATRED_MAX;
};

// No two characters at Hatred serve in the same party (§5)
Rel.hatredBlocked = function (world, aId, bId) {
  return Rel.hates(world, aId, bId) || Rel.hates(world, bId, aId);
};

// ---- Romance (§6/§7) --------------------------------------------------------
Rel.canRomance = function (world, aId, bId) {
  const a = ADV.World.byId(world, aId);
  const b = ADV.World.byId(world, bId);
  if (!a || !b || !a.alive || !b.alive) return { ok: false, why: 'unavailable' };
  if (a.sex === b.sex) return { ok: false, why: 'ineligible' };
  // no blood relations: parent, child, sibling/half-sibling through a shared parent (§6)
  if (a.motherId === b.id || a.fatherId === b.id || b.motherId === a.id || b.fatherId === a.id)
    return { ok: false, why: 'blood relation' };
  if ((a.motherId && a.motherId === b.motherId) || (a.fatherId && a.fatherId === b.fatherId))
    return { ok: false, why: 'blood relation' };
  if (Rel.tierBetween(world, bId, aId) === 'hatred' || Rel.tierBetween(world, aId, bId) === 'hatred')
    return { ok: false, why: 'hatred' };
  const s = Rel.score(world, bId, aId);
  if (s < C().REL.FRIENDLY_MIN) return { ok: false, why: 'not friendly' };
  return { ok: true };
};

// Accept a proposal: symmetric state. Jilts current partners per the rules.
// Returns feed lines.
Rel.commit = function (world, aId, bId, feed) {
  const a = ADV.World.byId(world, aId);
  const b = ADV.World.byId(world, bId);
  const lines = [];
  const capOf = (ch) => ADV.Housing ? ADV.Housing.spouseCap(ch) : 1;
  const aHad = Rel.partnerIds(a).filter(id => id !== b.id).length > 0;
  const bHad = Rel.partnerIds(b).filter(id => id !== a.id).length > 0;
  for (const [x, y] of [[a, b], [b, a]]) {
    while (true) {
      const others = Rel.partnerIds(x).filter(id => id !== y.id);
      if (others.length + 1 <= capOf(x)) break;
      const ex = ADV.World.byId(world, others[0]);
      if (!ex || !ex.alive) { Rel.removePartner(x, others[0]); continue; }
      lines.push(...Rel.jilt(world, x, ex));
    }
  }
  Rel.addPartner(a, b.id);
  Rel.addPartner(b, a.id);
  if (!aHad) { a.relationshipQuests = 0; a.conceived = false; }
  if (!bHad) { b.relationshipQuests = 0; b.conceived = false; }
  Rel.move(world, aId, bId, 100, 'romance', { set: true });
  Rel.move(world, bId, aId, 100, 'romance', { set: true });
  const woman = a.sex === 'f' ? a : b;
  const man = a.sex === 'f' ? b : a;
  ADV.Vault.onCommit(world, woman, man);
  const jealous = jealousWomenFor(world, man, woman);
  for (const w of jealous) {
    Rel.move(world, w.id, woman.id, C().REL_MOVE.jealousWomanToWife, 'jealousy');
    lines.push({ text: `${w.name} now resents ${woman.name}.`, actorIds: [w.id, woman.id] });
  }
  lines.push({ text: `${a.name} and ${b.name} are together.`, actorIds: [a.id, b.id] });
  return lines;
};

function jealousWomenFor(world, man, wife) {
  // Women friendly-or-better toward him (inbound edges), count scales with his wealth+rank (§6)
  const vault = ADV.Vault.wealthOf(world, man);
  const cap = Math.min(5, 1 + Math.floor(man.rank / 2) + (vault > 400 ? 1 : 0) + (vault > 1500 ? 1 : 0));
  const wanters = world.edges
    .filter(e => e.toId === man.id && e.score >= C().REL.FRIENDLY_MIN)
    .map(e => ADV.World.byId(world, e.fromId))
    .filter(c => c && c.alive && c.sex === 'f' && c.id !== wife.id);
  return wanters.slice(0, cap);
};

// One partner leaves the other for someone else. The abandoned partner:
// NPCs always drop to -100 permanently; the player is offered the choice (§6).
Rel.jilt = function (world, leaver, abandoned) {
  const lines = [];
  Rel.removePartner(leaver, abandoned.id);
  Rel.removePartner(abandoned, leaver.id);
  ADV.Vault.onBreakup(world, leaver, abandoned);
  if (!abandoned.alive) return lines;
  leaver.jiltCount = (leaver.jiltCount || 0) + 1;
  const softJilt = leaver.perks.some(p => p.skillId === 'lookism');   // Lookism: they stay Friendly
  if (softJilt) {
    Rel.move(world, abandoned.id, leaver.id, C().REL.FRIENDLY_MIN, 'jilt', { set: true });
    lines.push({ text: `${leaver.name} left ${abandoned.isPlayer ? 'you' : abandoned.name} — and somehow ${abandoned.isPlayer ? 'you' : abandoned.name} cannot hold it against ${leaver.sex === 'f' ? 'her' : 'him'}.`, actorIds: [leaver.id, abandoned.id] });
  } else if (abandoned.isPlayer) {
    world.pendingPlayerJilt = { byId: leaver.id }; // UI offers the hate choice
    lines.push({ text: `${leaver.name} left you.`, actorIds: [leaver.id] });
  } else {
    Rel.move(world, abandoned.id, leaver.id, C().REL_MOVE.jiltedSetTo, 'jilt', { set: true, decays: false });
    lines.push({ text: `${leaver.name} left ${abandoned.name}. ${abandoned.name} will not forgive it.`, actorIds: [leaver.id, abandoned.id] });
    Rel.propagate(world, abandoned.id, leaver.id, -30, 'jilt');
  }
  // If a wife leaves her husband, the women who resented her clear to Neutral (§6)
  if (leaver.sex === 'f' && abandoned.sex === 'm') {
    for (const e of world.edges.slice()) {
      if (e.toId === leaver.id && e.cause === 'jealousy' && e.score < 0) {
        const i = world.edges.indexOf(e);
        if (i >= 0) world.edges.splice(i, 1);
      }
    }
  }
  if (abandoned.sex === 'f' && leaver.sex === 'm') {
    for (const e of world.edges.slice()) {
      if (e.toId === abandoned.id && e.cause === 'jealousy' && e.score < 0) {
        const i = world.edges.indexOf(e);
        if (i >= 0) world.edges.splice(i, 1);
      }
    }
  }
  return lines;
};

// ---- Wealth-gap envy (§6): men resent richer men by RATIO; women are never
// hated for wealth. Runs on the world clock.
Rel.tickEnvy = function (world, feedPush) {
  const men = world.characters.filter(c => c.alive && c.sex === 'm' && !c.isMonster && (!c.registryId || c.hiroNpc));
  for (const observer of men) {
    const oWealth = Math.max(10, ADV.Vault.wealthOf(world, observer));
    for (const target of men) {
      if (target === observer) continue;
      const tWealth = ADV.Vault.wealthOf(world, target);
      const ratio = tWealth / oWealth;
      const existing = Rel.get(world, observer.id, target.id);
      if (ratio > C().ENVY_RATIO_TRIGGER) {
        const r = Rel.move(world, observer.id, target.id, C().REL_MOVE.envyPerQuest, 'envy',
          { decays: true, floor: C().REL_MOVE.envyFloor });
        if (r && r.crossed && r.crossed.to === 'hatred' && feedPush) {
          feedPush(`${observer.name} has come to hate ${target.name} for his wealth.`, [observer.id, target.id]);
        }
      } else if (existing && existing.decays && existing.score < 0 && ratio < C().ENVY_RATIO_DECAY) {
        Rel.move(world, observer.id, target.id, C().REL_MOVE.envyDecayPerQuest, 'envy',
          { decays: true, ceiling: C().REL_MOVE.envyCeiling });
      }
    }
  }
};

// Social modifiers for reaching Friendly (§6): male relationship status & wealth.
Rel.socialRate = function (world, fromCh, toCh) {
  let mult = 1.0;
  if (fromCh.hiroNpc) mult /= ADV.Hiro.RULES.warmthDivisor;   // Hiro stays Neutral three times as long
  if (toCh.sex === 'm') {
    if (Rel.partnerIds(toCh).length) mult *= 1.3;                       // partnered men befriend everyone faster
    else if (fromCh.sex === 'f') mult *= 0.7;              // single men reach Friendly with women more slowly
    if (fromCh.sex === 'f' && ADV.Vault.wealthOf(world, toCh) > 500) mult *= 1.4;
  }
  // Reputation for jilting (§7): each ended relationship slows subsequent romance
  if (fromCh.sex === 'f' || fromCh.sex === 'm') {
    mult *= Math.pow(0.85, Math.min(5, toCh.jiltCount || 0));
  }
  return mult;
};

ADV.Rel = Rel;
})();
