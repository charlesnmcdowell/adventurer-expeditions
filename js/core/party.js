// Career structure (§5): hireling applications, wages, firing, leadership,
// payroll, succession, and the hatred block.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Rel = () => ADV.Rel;

const Party = {};
let PID = 1;
Party.resetIds = function (n) { PID = n || 1; };

// After a save load the in-memory counter is 1 again. Walk existing ids so
// a new company never reuses p1 and looks like the outfit you just left.
Party.syncIds = function (world) {
  let max = 0;
  for (const p of (world && world.parties) || []) {
    const n = parseInt(String(p.id || '').replace(/^p/i, ''), 10);
    if (n > max) max = n;
  }
  if (max >= PID) PID = max + 1;
};

Party.allocId = function (world) {
  Party.syncIds(world);
  const used = new Set(((world && world.parties) || []).map(p => p.id));
  while (used.has('p' + PID)) PID++;
  return 'p' + (PID++);
};

// Fix saves that reused p1 after a reload: unique ids, one company per person.
Party.repairWorld = function (world) {
  if (!world || !world.parties) return;
  const seen = new Set();
  for (const p of world.parties) {
    if (!p.id || seen.has(p.id)) p.id = Party.allocId(world);
    seen.add(p.id);
    const lead = ADV.World.byId(world, p.leaderId);
    if (lead) { lead.partyId = p.id; lead.leaderId = null; }
    for (const id of p.memberIds || []) {
      const ch = ADV.World.byId(world, id);
      if (!ch || ch.id === p.leaderId) continue;
      ch.partyId = p.id;
      ch.leaderId = p.leaderId;
    }
  }
  for (const ch of world.characters || []) {
    if (!ch) continue;
    const on = world.parties.filter(p => Party.serves(p, ch.id));
    if (!on.length) {
      if (ch.partyId || ch.leaderId) { ch.partyId = null; ch.leaderId = null; }
      continue;
    }
    const playerLed = on.find(p => {
      const lead = ADV.World.byId(world, p.leaderId);
      return lead && lead.isPlayer;
    });
    const keep = on.find(p => p.leaderId === ch.id)
      || (ch.partyId && on.find(p => p.id === ch.partyId))
      || playerLed
      || on[on.length - 1];
    ch.partyId = keep.id;
    ch.leaderId = keep.leaderId === ch.id ? null : keep.leaderId;
    for (const p of on) {
      if (p === keep) continue;
      const i = (p.memberIds || []).indexOf(ch.id);
      if (i >= 0) { p.memberIds.splice(i, 1); delete p.wages[ch.id]; }
    }
  }
  Party.syncIds(world);
};

// world.parties: [{id, leaderId, memberIds:[], wages:{memberId:gold}, employerParty:bool}]

Party.serves = function (p, chId) {
  return !!(p && chId && (p.leaderId === chId || (p.memberIds && p.memberIds.indexOf(chId) >= 0)));
};

Party.create = function (world, leaderId) {
  Party.syncIds(world);
  const leader = ADV.World.byId(world, leaderId);
  const held = leader && Party.of(world, leader);
  if (held && held.leaderId === leaderId) return held;
  if (held) Party.removeMember(world, held, leaderId);
  const p = { id: Party.allocId(world), leaderId, memberIds: [], wages: {} };
  world.parties.push(p);
  if (leader) { leader.partyId = p.id; leader.leaderId = null; if(leader.isPlayer)leader.hasFoundedParty=true; }
  return p;
};

Party.outfit = function(world,leader,target,setId,ownedOnly) {
  const party=Party.of(world,leader),set=ADV.DATA.GEAR_SETS[setId];
  if(!leader||!leader.isPlayer||!leader.alive||!party||party.leaderId!==leader.id)return {ok:false,error:'You must lead the party.'};
  if(!target||!target.alive||target===leader||!Party.roster(world,party).concat(Party.followers(world,party)).includes(target))return {ok:false,error:'They no longer serve in your party.'};
  const owns=(target.ownedSets||[]).includes(setId);
  if(!set||setId===target.equippedSet||(!owns&&(set.campaign||set.unique||ownedOnly)))return {ok:false,error:'That set is not available.'};
  const old=ADV.DATA.GEAR_SETS[target.equippedSet];
  if(old&&(old.campaign||old.unique))return {ok:false,error:'Their issued outfit cannot be replaced.'};
  const cost=owns?0:set.cost;
  if(!Number.isFinite(cost)||cost<0||leader.inventory.gold<cost)return {ok:false,error:'You do not have enough carried gold.'};
  leader.inventory.gold-=cost;
  target.ownedSets=(target.ownedSets||[]).filter(id=>id!==setId);
  if(target.equippedSet&&!target.ownedSets.includes(target.equippedSet))target.ownedSets.push(target.equippedSet);
  target.equippedSet=setId;
  if(ADV.SkillSys&&ADV.SkillSys.trimToCap&&!target.isPlayer)ADV.SkillSys.trimToCap(target);
  ADV.World.feed(world,leader.name+' outfitted '+target.name+' with '+set.name+'.',[leader.id,target.id]);
  return {ok:true,cost};
};

Party.of = function (world, ch) {
  if (!ch || !world) return null;
  const list = world.parties || [];
  if (ch.partyId) {
    const hits = list.filter(p => p.id === ch.partyId && Party.serves(p, ch.id));
    if (hits.length) return hits[hits.length - 1];
  }
  return list.find(p => Party.serves(p, ch.id)) || null;
};

// The object the UI is holding may be stale after a save/reload. Prefer the
// live record in world.parties so a hire cannot write to a ghost company.
Party.live = function (world, p) {
  if (!p || !world) return null;
  const list = world.parties || [];
  if (list.indexOf(p) >= 0) return p;
  return list.find(x => x.id === p.id && x.leaderId === p.leaderId)
    || list.find(x => x.id === p.id)
    || null;
};

// Anyone already seated as leader or hire — used so FOR HIRE never lists a
// body that is already on a payroll (even if their partyId was wiped).
Party.takenIds = function (world) {
  const out = new Set();
  for (const p of (world && world.parties) || []) {
    if (p.leaderId) out.add(p.leaderId);
    for (const id of p.memberIds || []) out.add(id);
  }
  return out;
};

Party.seatsOf = function (world, chId) {
  return ((world && world.parties) || []).filter(p => Party.serves(p, chId));
};

// What contracts this company prefers: the leader's leaning, or their
// standing if one side has already claimed them.
Party.alignment = function (world, p) {
  const l = p && Party.leader(world, p);
  if (!l) return 'neutral';
  const fs = l.factionStanding || {};
  const crim = fs.criminal || 0, law = fs.law || 0;
  if (crim >= 30 && crim > law + 10) return 'criminal';
  if (law >= 30 && law > crim + 10) return 'law';
  return l.factionLeaning === 'criminal' || l.factionLeaning === 'law' ? l.factionLeaning : 'neutral';
};

Party.alignmentLabel = function (align) {
  return align === 'law' ? 'lawful' : (align === 'criminal' ? 'criminal' : 'neutral');
};

Party.members = function (world, p) {
  return p.memberIds.map(id => ADV.World.byId(world, id)).filter(c => c && c.alive);
};

Party.leader = function (world, p) {
  return ADV.World.byId(world, p.leaderId);
};

Party.roster = function (world, p) {
  const l = Party.leader(world, p);
  return [l].concat(Party.members(world, p)).filter(c => c && c.alive);
};

// Roles come from learned skills first, then inclination — a fighter who
// took Mend is a healer, and a tank perk counts even with no tank active.
Party.roleSet = function (ch) {
  const out = new Set();
  for (const a of (ch && ch.archetypeInclination) || []) if (a) out.add(a);
  for (const e of ((ch && ch.perks) || []).concat((ch && ch.actives) || [])) {
    const sk = ADV.DATA.SKILLS[e.skillId];
    if (sk && sk.archetype) out.add(sk.archetype);
  }
  return out;
};
Party.isHealer = function (ch) { return Party.roleSet(ch).has('healer'); };
Party.isTank = function (ch) { return Party.roleSet(ch).has('tank'); };
Party.isSupport = function (ch) { return Party.isHealer(ch) || Party.isTank(ch); };
Party.hasHealer = function (world, p) { return Party.roster(world, p).some(Party.isHealer); };
Party.hasTank = function (world, p) { return Party.roster(world, p).some(Party.isTank); };
Party.hasSupport = function (world, p) { return Party.roster(world, p).some(Party.isSupport); };
Party.missingRoles = function (world, p) {
  const miss = [];
  if (!Party.hasHealer(world, p)) miss.push('healer');
  if (!Party.hasTank(world, p)) miss.push('tank');
  return miss;
};
// preferRoles: true (any support), 'healer'/'tank', or ['healer','tank'] in order.
Party.pickMember = function (rng, pool, preferRoles) {
  if (!pool || !pool.length) return null;
  const roles = preferRoles === true ? ['healer', 'tank']
    : preferRoles === 'healer' || preferRoles === 'tank' ? [preferRoles]
    : Array.isArray(preferRoles) ? preferRoles : [];
  const match = (role) => pool.filter(c => role === 'healer' ? Party.isHealer(c) : role === 'tank' ? Party.isTank(c) : false);
  for (const role of roles) {
    const hit = match(role);
    if (hit.length) return rng.pick(hit);
  }
  if (roles.length) {
    const any = pool.filter(Party.isSupport);
    if (any.length) return rng.pick(any);
    return null;
  }
  return rng.pick(pool);
};

// No two characters at Hatred serve together (§5) — every direction.
Party.hatredConflict = function (world, p, candidateId) {
  const ids = [p.leaderId].concat(p.memberIds);
  for (const id of ids) {
    if (id === candidateId) continue;
    if (Rel().hatredBlocked(world, id, candidateId)) return id;
  }
  return null;
};

// ---- Hiring by a leader (player or NPC) ------------------------------------
// Wages are fixed offers: accept or decline on Greed and Pride (§5).
// The most a leader can pay a new hire and still take SOME posted contract
// at a profit (request: never offer a wage the leader cannot afford).
Party.maxAffordableWage = function (world, party, board) {
  const best = Math.max(0, ...(board || []).filter(q => q.track === 'party').map(q => q.payout));
  const payroll = Party.payroll(world, party);
  return Math.max(0, best - payroll - 10);
};

// What a hireling actually gets per quest: the standard wage, plus Lookism's edge.
Party.hirelingWageFor = function (ch) {
  const looks = ch.perks.find(x => x.skillId === 'lookism');
  return C().GOLD.hirelingWage + (ch.isPlayer ? 100 : 0) + (looks ? (ADV.SkillSys.manifest(ch, looks).data.wageEdge || 10) : 0);
};

Party.clampWage = function (n) {
  return Math.max(C().GOLD.wageAcceptMin, Math.min(C().GOLD.wageAcceptMax, n | 0));
};

// Player apply ceiling: 30g at reputation −20, 200g at +20, linear between.
Party.applyAskMax = function (ch) {
  const min = C().GOLD.wageAcceptMin + (ch && ch.isPlayer ? 100 : 0);
  const max = (C().GOLD.wageApplyMax || 200) + (ch && ch.isPlayer ? 100 : 0);
  const rep = Math.max(-20, Math.min(20, (ch && ch.reputation) || 0));
  return min + Math.round((max - min) * (rep + 20) / 40);
};

Party.clampApplyWage = function (ch, n) {
  return Math.max(C().GOLD.wageAcceptMin + (ch && ch.isPlayer ? 100 : 0), Math.min(Party.applyAskMax(ch), n | 0));
};

Party.clampRaiseWage = function (n) {
  return Math.max(C().GOLD.wageAcceptMin, Math.min(C().GOLD.wageRaiseMax || 300, n | 0));
};

// After hire: one named raise per stay. Reputation decides whether they pay it.
Party.raiseChance = function (ch, cur, ask) {
  const rep = Math.max(-20, Math.min(20, ch.reputation || 0));
  let p0 = 0.22 + rep * 0.028;
  const step = C().GOLD.wageRaiseStep || 10;
  if ((ask - cur) > step) p0 -= 0.08;
  const raiseMax = (C().GOLD.wageRaiseMax || 300) + (ch.isPlayer ? 100 : 0);
  const height = (ask - C().GOLD.wageAcceptMin - (ch.isPlayer ? 100 : 0)) / Math.max(1, raiseMax - C().GOLD.wageAcceptMin - (ch.isPlayer ? 100 : 0));
  if (height > 0.5) p0 -= 0.10;
  if (ask >= raiseMax) p0 -= 0.08;
  return Math.max(0.08, Math.min(0.9, p0));
};

Party.requestRaise = function (world, rng, ch, ask) {
  const p = Party.of(world, ch);
  if (!p || p.leaderId === ch.id) return { ok: false, error: 'you do not serve' };
  const cur = p.wages[ch.id] || ch.wage || C().GOLD.hirelingWage;
  const max = (C().GOLD.wageRaiseMax || 300) + (ch.isPlayer ? 100 : 0);
  if (cur >= max) return { ok: false, error: 'already at the cap' };
  if (ch.raiseAskedAt != null && ch.raiseAskedAt >= (world.questClock | 0)) return { ok: false, error: 'already asked this stay' };
  const step = C().GOLD.wageRaiseStep || 10;
  const want = ask != null ? (ask | 0) : (cur + step);
  const next = Math.max(cur + 5, Math.min(max, want));
  if (next <= cur) return { ok: false, error: 'already at the cap' };
  ch.raiseAskedAt = world.questClock | 0;
  if (!rng.chance(Party.raiseChance(ch, cur, next))) {
    return { ok: true, accepted: false, wage: cur, ask: next, from: cur };
  }
  p.wages[ch.id] = next;
  ch.wage = next;
  return { ok: true, accepted: true, wage: next, from: cur };
};

Party.offerWage = function (world, rng, p, candidate, wage) {
  p = Party.live(world, p) || p;
  if (!p || !candidate) return { ok: false, why: 'no party' };
  if (Party.serves(p, candidate.id)) return { ok: false, why: 'already hired' };
  for (const other of Party.seatsOf(world, candidate.id)) {
    if (other === p) continue;
    if (other.leaderId === candidate.id) return { ok: false, why: 'leads another company' };
    Party.removeMember(world, other, candidate.id);
  }
  wage = Party.clampWage(wage);
  if (Party.roster(world, p).length >= C().PARTY_MAX) return { ok: false, why: 'party full' };
  const blocker = Party.hatredConflict(world, p, candidate.id);
  if (blocker) {
    const b = ADV.World.byId(world, blocker);
    return { ok: false, why: 'hatred', blocker: b };
  }
  if (candidate.hospitalizedQuestsLeft > 0) return { ok: false, why: 'hospitalized' };
  if (candidate.status === 'hero') return { ok: false, why: 'a hero cannot take work' };
  const g = candidate.personality.greed, pr = candidate.personality.pride;
  // Muster (§13 Antler): the company's name makes any wage read a quarter richer
  const leader = ADV.World.byId(world, p.leaderId);
  const muster = leader && leader.perks.find(x => x.skillId === 'muster');
  const offered = wage;
  if (muster) wage = Math.round(wage / (1 - (ADV.SkillSys.manifest(leader, muster).data.wageDiscount || 0)));
  // Lookism: hires accept 10g under their price — the offer reads 10g richer
  const looks = leader && leader.perks.find(x => x.skillId === 'lookism');
  if (looks) wage += ADV.SkillSys.manifest(leader, looks).data.wageEdge || 10;
  let accept;
  if (wage < C().GOLD.wageAcceptMin) accept = rng.chance(0.05);
  else if (wage >= C().GOLD.wageAcceptMax) accept = rng.chance(0.98);
  else {
    const t = (wage - C().GOLD.wageAcceptMin) / (C().GOLD.wageAcceptMax - C().GOLD.wageAcceptMin);
    let p0 = 0.25 + t * 0.65;
    p0 += (g - 50) / 400;        // greedy NPCs chase pay
    p0 -= (pr - 50) / 400 * (wage < 35 ? 1 : 0); // proud NPCs refuse low-balls
    const relScore = Rel().score(world, candidate.id, p.leaderId);
    p0 += relScore / 400;
    accept = rng.chance(Math.max(0.02, Math.min(0.98, p0)));
  }
  if (!accept) return { ok: false, why: 'declined' };
  wage = offered;   // the offered wage is what gets paid
  p.memberIds.push(candidate.id);
  p.wages[candidate.id] = wage;
  candidate.partyId = p.id; candidate.leaderId = p.leaderId; candidate.wage = wage;
  return { ok: true };
};

// ---- Player applying to an employer party (§5) ------------------------------
// Gated on reputation, visible skill sheet, and role demand.
Party.applicationOdds = function (world, p, applicant) {
  const roster = Party.roster(world, p);
  if (roster.length >= C().PARTY_MAX) return { odds: 0, why: 'full' };
  const blocker = Party.hatredConflict(world, p, applicant.id);
  if (blocker) return { odds: 0, why: 'hatred' };
  let odds = 0.35 + applicant.reputation * 0.02;
  // Role demand: a party missing a healer or tank weights that seat heavily
  const covered = new Set();
  for (const m of roster) for (const a of Party.roleSet(m)) covered.add(a);
  const brings = Party.roleSet(applicant);
  let fills = 0;
  for (const a of brings) if (!covered.has(a)) fills++;
  odds += fills * 0.25;
  if (!covered.has('healer') && brings.has('healer')) odds += 0.2;
  if (!covered.has('tank') && brings.has('tank')) odds += 0.2;
  const pe = applicant.perks.find(x => x.skillId === 'persuade');
  if (pe) {
    const m = ADV.SkillSys.manifest(applicant, pe);
    if (m.data.partyApplicationBonus) odds += 0.2;
  }
  return { odds: Math.max(0.02, Math.min(0.95, odds)), fills };
};

// ---- Quitting / firing / dissolution ---------------------------------------
Party.removeMember = function (world, p, chId) {
  const i = p.memberIds.indexOf(chId);
  if (i >= 0) p.memberIds.splice(i, 1);
  delete p.wages[chId];
  const ch = ADV.World.byId(world, chId);
  if (ch) { ch.partyId = null; ch.leaderId = null; ch.wage = 0; }
};

Party.disband = function (world, p) {
  for (const id of p.memberIds.slice()) Party.removeMember(world, p, id);
  const l = Party.leader(world, p);
  if (l) { l.partyId = null; l.leaderId = null; }
  const i = world.parties.indexOf(p);
  if (i >= 0) world.parties.splice(i, 1);
};

// Player-led fold: everyone walks, the founding purse comes back.
Party.foldByLeader = function (world, ch) {
  const p = Party.of(world, ch);
  if (!p || p.leaderId !== ch.id) return { ok: false, error: 'you do not lead' };
  Party.disband(world, p);
  if (ch.inventory) ch.inventory.gold = (ch.inventory.gold || 0) + C().GOLD.partyStartupCapital;
  return { ok: true };
};

// If a relationship degrades to Hatred during employment, the pairing dissolves (§5).
Party.enforceHatred = function (world, feedPush) {
  for (const p of world.parties.slice()) {
    const roster = Party.roster(world, p);
    for (const m of Party.members(world, p)) {
      if (Rel().hatredBlocked(world, m.id, p.leaderId)) {
        Party.removeMember(world, p, m.id);
        if (feedPush) feedPush(`${m.name} quit ${Party.leader(world, p) ? Party.leader(world, p).name + "'s" : 'the'} party.`, [m.id, p.leaderId]);
        continue;
      }
      for (const other of roster) {
        if (other.id !== m.id && other.id !== p.leaderId && Rel().hatredBlocked(world, m.id, other.id)) {
          Party.removeMember(world, p, m.id);
          if (feedPush) feedPush(`${m.name} and ${other.name} cannot stand each other. ${m.name} left.`, [m.id, other.id]);
          break;
        }
      }
    }
  }
};

// ---- Succession (§5): leader dies mid-quest --------------------------------
// Highest reputation survivor inherits; ties by rank, quests completed, Pride.
Party.succession = function (world, p) {
  const members = Party.members(world, p);
  if (!members.length) { Party.disband(world, p); return null; }
  members.sort((a, b) =>
    b.reputation - a.reputation ||
    b.rank - a.rank ||
    b.questsCompleted - a.questsCompleted ||
    b.personality.pride - a.personality.pride);
  const heir = members[0];
  Party.removeMember(world, p, heir.id);
  p.leaderId = heir.id;
  heir.partyId = p.id; heir.leaderId = null;
  return heir;
};

// Total wage bill for a leader's party — real hires only; conscripts and
// undead draw no wage (§3a).
Party.payroll = function (world, p) {
  let total = 0;
  for (const id of p.memberIds) total += p.wages[id] || 0;
  return total;
};

// Hired bodies only — not conscripts, thralls, or the risen.
Party.regularMembers = function (world, chOrParty) {
  const p = chOrParty && chOrParty.leaderId != null && chOrParty.memberIds
    ? chOrParty : Party.of(world, chOrParty);
  if (p) return Party.roster(world, p).filter(c => c && !c.isConscript && !c.isUndead && !c.isQuestThrall);
  return (chOrParty && chOrParty.alive) ? [chOrParty] : [];
};

// Unpaid followers attached to anyone in the company, plus quest thralls.
Party.followers = function (world, chOrParty, extra) {
  const p = chOrParty && chOrParty.leaderId != null && chOrParty.memberIds
    ? chOrParty : Party.of(world, chOrParty);
  const controllers = p ? Party.roster(world, p) : (chOrParty && chOrParty.id ? [chOrParty] : []);
  const seen = new Set();
  const out = [];
  for (const c of controllers) {
    if (!c) continue;
    for (const id of (c.conscriptIds || []).concat(c.undeadIds || [])) {
      if (seen.has(id)) continue;
      const f = ADV.World.byId(world, id);
      if (f && f.alive) { seen.add(id); out.push(f); }
    }
  }
  for (const t of extra || []) {
    if (t && t.alive !== false && !seen.has(t.id)) { seen.add(t.id); out.push(t); }
  }
  return out;
};

// Hired cap plus the three forbidden extras — 8 on the field at most.
Party.companyCap = function () {
  return (C().PARTY_MAX || 5) + (C().FORBIDDEN_EXTRA_SLOTS || 3);
};

// Empty hired seats plus FORBIDDEN_EXTRA_SLOTS, minus followers already walking.
Party.followerRoom = function (world, chOrParty, extra) {
  const regular = Math.max(1, Party.regularMembers(world, chOrParty).length);
  const walking = Party.followers(world, chOrParty, extra).length;
  return Math.max(0, Party.companyCap() - regular - walking);
};

// Full battle roster including followers (conscripts/undead), capped at 8.
Party.battleRoster = function (world, leadCh) {
  const out = [leadCh];
  const p = Party.of(world, leadCh);
  const addFollowers = (ch) => {
    for (const fid of (ch.conscriptIds || []).concat(ch.undeadIds || [])) {
      const f = ADV.World.byId(world, fid);
      if (f && f.alive && !out.includes(f)) out.push(f);
    }
  };
  if (p && p.leaderId === leadCh.id) {
    for (const m of Party.members(world, p)) if (!out.includes(m)) out.push(m);
    addFollowers(leadCh);
    for (const m of Party.members(world, p)) addFollowers(m);
  } else if (p) {
    const l = Party.leader(world, p);
    if (l && l.alive && l !== leadCh && !out.includes(l)) out.push(l);
    for (const m of Party.members(world, p)) if (m !== leadCh && !out.includes(m)) out.push(m);
    addFollowers(leadCh);
    if (l) addFollowers(l);
    for (const m of Party.members(world, p)) addFollowers(m);
  } else {
    addFollowers(leadCh);
  }
  const cap = Party.companyCap();
  return out.length > cap ? out.slice(0, cap) : out;
};

ADV.Party = Party;
})();
