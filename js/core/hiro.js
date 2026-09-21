// Hiro as an NPC (request): when the secret character is not being played he
// arrives in town after the player's second contract with 1000g, starts a
// party and hires as much of the roster as he can — leaving exactly one seat
// open. If he dies he gets back up, founds a new company, and hires again.
// He warms slowly (a third of the usual rate), a woman needs two shared
// quests before he is Friendly, he never asks anyone, and he accepts a
// proposal only from a woman with reputation 15 or better.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Hiro = {};

Hiro.RULES = { arriveAfterQuests: 2, gold: 1000, wage: 40, friendlyAfter: 2, minRep: 15, warmthDivisor: 3 };

Hiro.npc = function (world) { return world.hiroId ? ADV.World.byId(world, world.hiroId) : null; };
Hiro.isHiro = function (ch) { return !!(ch && ch.hiroNpc && !ch.isPlayer); };

Hiro.rngFor = function (world) {
  return new ADV.RNG(((world.seed || 1) ^ ((world.questClock || 0) + 17) * 2654435761) >>> 0);
};

Hiro.foundParty = function (world, rng, h) {
  const party = ADV.Party.create(world, h.id);
  party.employerParty = true;
  party.reserveForPlayer = true;
  Hiro.fillParty(world, rng, party);
  return party;
};

// Called on the world clock after the player quests.
// There is only ever one Hiro. While he is the player he never walks into town, and a Hiro
// the player already buried is not replaced by a stranger with his name: that same character
// comes back as the NPC once the player has moved on to a reincarnation or an heir.
Hiro.former = function (world, playerId) {
 return (world.characters || []).find(c => c && c.registryId === 'hiro' && c.id !== playerId) || null;
};
Hiro.maybeArrive = function (world, rng, feed) {
  const p = ADV.World.byId(world, world.playerId);
  if (!p || p.registryId === 'hiro') return null;               // he is being played
  const existing = Hiro.npc(world);
  if (existing) {
    if (!existing.alive) { Hiro.resurrect(world, existing, null, 'quest'); return existing; }
    return null;
  }
  // The player's own former life, now that someone else holds the pen. He returns as himself
  // rather than as a second copy, and he does not wait out the newcomer's two contracts.
  const past = Hiro.former(world, world.playerId);
  if (past) {
    past.hiroNpc = true; past.isPlayer = false;
    world.hiroId = past.id;
    if (!past.alive) Hiro.resurrect(world, past, null, 'quest');
    else Hiro.foundParty(world, rng, past);
    ADV.World.met(world, past.id);
    feed(`${past.name} is back on his feet and hiring again. Whatever put him in the ground did not keep him.`, [past.id]);
    return past;
  }
  if (p.questsCompleted < Hiro.RULES.arriveAfterQuests) return null;
  const h = ADV.Character.makeRegistry(rng, 'hiro', null, true);
  h.hiroNpc = true; h.inventory.gold = Hiro.RULES.gold; h.reputation = 10; h.rank = 3;
  for (const e of h.perks.concat(h.actives)) { e.level = 25; e.uses = 250; }
  h.personality = { aggression: 45, greed: 30, caution: 55, loyalty: 70, pride: 60 };
  ADV.World.addCharacter(world, h);
  world.hiroId = h.id;
  ADV.World.met(world, h.id);
  Hiro.foundParty(world, rng, h);
  feed(`A man with purple dreadlocks and a katana walked into town, put ${Hiro.RULES.gold}g on the table, and started hiring. He is keeping one seat open.`, [h.id]);
  return h;
};

// He does not stay dead. The old company breaks; he walks back and hires again.
Hiro.resurrect = function (world, ch, killerId, cause) {
  if (!ch || !ch.hiroNpc || ch.isPlayer) return null;
  if (ADV.Death && ADV.Death.stripFinisherGains) ADV.Death.stripFinisherGains(ch);
  if (!ch.equippedSet && ADV.DATA.REGISTRY.hiro && ADV.DATA.REGISTRY.hiro.equippedSet) {
    ch.equippedSet = ADV.DATA.REGISTRY.hiro.equippedSet;
  }
  ch.alive = true;
  ch.deadAtQuest = null;
  ch.obituary = null;
  ch.combatHp = null;
  ch.hospitalizedQuestsLeft = 0;
  if (ch.isUndead) ch.isUndead = false;
  if (ch.isConscript) { ch.isConscript = false; ch.conscriptorId = null; }
  if (ch.status && ch.status !== 'hero') ch.status = 'normal';
  const old = ADV.Party.of(world, ch);
  if (old) {
    if (old.leaderId === ch.id) ADV.Party.disband(world, old);
    else ADV.Party.removeMember(world, old, ch.id);
  }
  ch.partyId = null;
  ch.leaderId = null;
  ch.inventory = ch.inventory || { gold: 0, items: [], weightCap: 40 };
  ch.inventory.gold = Math.max(ch.inventory.gold || 0, Hiro.RULES.gold);
  ADV.World.met(world, ch.id);
  Hiro.foundParty(world, Hiro.rngFor(world), ch);
  ADV.World.feed(world, `${ch.name} should have stayed down. He walked back into town, put ${Hiro.RULES.gold}g on the table, and started a new company. He is keeping one seat open.`, [ch.id]);
  return ch;
};

// Hire free agents until only one seat is left (leader + PARTY_MAX - 2 hires).
Hiro.fillParty = function (world, rng, party) {
  const want = C().PARTY_MAX - 1;
  const free = () => ADV.World.adults(world).filter(c => !c.isPlayer && !c.registryId && !c.partyId && c.status === 'normal' && !c.isUndead && !c.isConscript && c.hospitalizedQuestsLeft <= 0);
  let guard = 0;
  while (ADV.Party.roster(world, party).length < want && guard++ < 40) {
    const missing = ADV.Party.missingRoles(world, party);
    const cands = free().filter(c => c.status !== 'hero' && !ADV.Party.hatredConflict(world, party, c.id)).sort((a, b) => {
      if (missing.length) {
        const score = (c) => missing.reduce((n, r) => n + (r === 'healer' && ADV.Party.isHealer(c) ? 2 : r === 'tank' && ADV.Party.isTank(c) ? 1 : 0), 0);
        const d = score(b) - score(a);
        if (d) return d;
      }
      return b.reputation - a.reputation;
    });
    if (!cands.length) break;
    const c = (missing.length && ADV.Party.pickMember(rng, cands, missing)) || cands[guard % cands.length];
    const r = ADV.Party.offerWage(world, rng, party, c, Hiro.RULES.wage);
    if (!r.ok && r.why !== 'declined') continue;
  }
};

// The open seat stays open: growth on the clock stops one short.
Hiro.growthCap = function (party) { return party.reserveForPlayer ? C().PARTY_MAX - 1 : C().PARTY_MAX; };

// Would Hiro accept this proposer? (women with reputation 15+ only)
Hiro.acceptsProposal = function (from) { return from.sex === 'f' && (from.reputation || 0) >= Hiro.RULES.minRep; };

ADV.Hiro = Hiro;
})();
