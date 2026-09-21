// Courtship rules (request 7/13): who warms to whom, and when someone asks.
//   - men warm to a woman after 1 shared quest and ask after 2 (if both single)
//   - women warm to a man after 2 shared quests — unless he is one of the five
//     wealthiest men in town, in which case every single woman who is not
//     already his enemy is Friendly at once
//   - anyone Friendly toward the player (opposite sex) can be asked in person,
//     even if they already have an NPC spouse
//   - at least one of those Friendlys asks the player within 3 quests; never
//     back-to-back (PLAYER_CONTACT_GAP). A shared quest can hurry the ask.
//   - a decline drops the asker to Neutral for 3 quests, then the rules apply
//     again (a rich man stays a rich man)
//   - Lookism: the opposite sex starts Friendly toward the holder
// Shared-quest counts live on world.sharedQuests; declines on world.cooldowns;
// asks aimed at the player queue on world.pendingProposals for the town.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Rel = () => ADV.Rel;
const Court = {};

Court.key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
Court.shared = function (world, a, b) { return (world.sharedQuests || {})[Court.key(a, b)] || 0; };
Court.recordShared = function (world, ids) {
  world.sharedQuests = world.sharedQuests || {};
  const list = [...new Set(ids)];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const k = Court.key(list[i], list[j]);
    world.sharedQuests[k] = (world.sharedQuests[k] || 0) + 1;
  }
};

Court.cooldown = function (world, fromId, toId, quests) {
  world.cooldowns = world.cooldowns || {};
  world.cooldowns[fromId + '>' + toId] = world.questClock + (quests || C().COURT.declineCooldown);
};
Court.onCooldown = function (world, fromId, toId) {
  const until = (world.cooldowns || {})[fromId + '>' + toId];
  return until != null && world.questClock < until;
};

function eligible(c) {
  return c.alive && !c.isMonster && (!c.registryId || c.hiroNpc) && !c.campaign && c.status === 'normal' && !c.isUndead && !c.isConscript;
}
function hasLookism(c) { return !!(ADV.SkillSys && ADV.SkillSys.knownVal(c, 'oppositeSexFriendly')); }

// The five wealthiest men in town (vault + carried), the player included.
// Cached per clock tick — Rel.score asks constantly.
Court.richestMen = function (world) {
  const cache = world.__richCache;
  const stamp = world.questClock + ':' + world.characters.length;
  if (cache && cache.stamp === stamp && world.__richDirty !== true) return cache.men;
  const men = world.characters.filter(c => eligible(c) && c.sex === 'm');
  men.sort((a, b) => ADV.Vault.wealthOf(world, b) - ADV.Vault.wealthOf(world, a));
  const top = men.slice(0, C().COURT.wealthTop);
  world.__richCache = { stamp, men: top }; world.__richDirty = false;
  return top;
};
Court.invalidate = function (world) { world.__richDirty = true; };

function bloodRelated(a, b) {
  if (a.motherId === b.id || a.fatherId === b.id || b.motherId === a.id || b.fatherId === a.id) return true;
  return !!((a.motherId && a.motherId === b.motherId) || (a.fatherId && a.fatherId === b.fatherId));
}
// Does the Friendly floor apply from -> to? (raw scores only — Rel.score calls this)
Court.floorApplies = function (world, fromId, toId) {
  const from = ADV.World.byId(world, fromId), to = ADV.World.byId(world, toId);
  if (!from || !to || from === to || from.sex === to.sex || !eligible(from) || !eligible(to)) return false;
  return Court.wants(world, from, to);
};
Court.wealthRank = function (world, man) {
  const men = world.characters.filter(c => eligible(c) && c.sex === 'm');
  men.sort((a, b) => ADV.Vault.wealthOf(world, b) - ADV.Vault.wealthOf(world, a));
  return men.indexOf(man) + 1;
};

// Does `from` want `to`, by the rules? (both alive, opposite sex, no hatred)
Court.wants = function (world, from, to) {
  if (from.sex === to.sex) return false;
  const H = C().REL.HATRED_MAX;
  if (Rel().rawScore(world, from.id, to.id) <= H || Rel().rawScore(world, to.id, from.id) <= H) return false;
  if (bloodRelated(from, to)) return false;
  if (Court.onCooldown(world, from.id, to.id)) return false;
  const shared = Court.shared(world, from.id, to.id);
  if (from.hiroNpc) return shared >= ADV.Hiro.RULES.friendlyAfter;   // Hiro warms slowly, and looks do not move him
  if (hasLookism(to)) return true;
  if (from.sex === 'm') return shared >= C().COURT.maleFriendlyAfter;
  if (Court.richestMen(world).includes(to)) return true;
  return shared >= C().COURT.femaleFriendlyAfter;
};

// Would `from` ask `to` now?
Court.wouldAsk = function (world, from, to) {
  if (!from || !to || from === to || from.sex === to.sex) return false;
  if (ADV.Rel.isPartner(from, to)) return false;
  if (from.hiroNpc) return false;                                  // Hiro never asks
  if (Court.onCooldown(world, from.id, to.id)) return false;
  if (to.isPlayer) {
    if (ADV.Housing && !ADV.Housing.canTakeSpouse(to)) return false;
    return Rel().score(world, from.id, to.id) >= C().REL.FRIENDLY_MIN;
  }
  if (!Court.wants(world, from, to)) return false;
  if (ADV.Housing && (!ADV.Housing.canTakeSpouse(from) || !ADV.Housing.canTakeSpouse(to))) return false;
  if (from.sex === 'm') return Court.shared(world, from.id, to.id) >= C().COURT.maleProposeAfter;
  return Court.richestMen(world).includes(to);   // women ask only the wealthy
};

function queueProposal(world, fromId) {
  world.pendingProposals = world.pendingProposals || [];
  if (world.pendingProposals.length) return;
  if (world.pendingProposals.some(p => p.fromId === fromId)) return;
  if (ADV.World && ADV.World.playerContactReady && !ADV.World.playerContactReady(world, 'lastPlayerProposalAt')) return;
  world.pendingProposals.push({ fromId, at: world.questClock });
  if (ADV.World && ADV.World.markPlayerContact) ADV.World.markPlayerContact(world, 'lastPlayerProposalAt');
}

function freeSlot(ch) {
  return !ADV.Housing || ADV.Housing.canTakeSpouse(ch);
}

function announcePair(feed, lines) {
  if (!feed) return;
  for (const l of lines) feed(l.text.replace(' are together.', ' married.'), l.actorIds);
}

function npcTownEligible(world, from, to) {
  if (!from || !to || from === to || from.isPlayer || to.isPlayer) return false;
  if (from.sex === to.sex || !eligible(from) || !eligible(to)) return false;
  if (from.hiroNpc || to.hiroNpc) return false;
  if (bloodRelated(from, to)) return false;
  const H = C().REL.HATRED_MAX;
  if (Rel().rawScore(world, from.id, to.id) <= H || Rel().rawScore(world, to.id, from.id) <= H) return false;
  if (Court.onCooldown(world, from.id, to.id) || Court.onCooldown(world, to.id, from.id)) return false;
  if (Rel().isPartner(from, to)) return false;
  return freeSlot(from) && freeSlot(to);
}

// Men hit Friendly after one shared quest and ask after two. Do not marry
// them (or anyone else warming toward the player) off to an NPC in that gap —
// leftover town pairing was eating suitors, so a female player saw rescues
// (Friendly floor) but almost never a proposal.
function holdingForPlayer(world, from, player) {
  if (!from || !player || from.isPlayer || from.sex === player.sex) return false;
  if (from.hiroNpc) return false;
  if (!freeSlot(player)) return false;
  if (Rel().isPartner(from, player)) return false;
  // Wealth/Lookism can make every stranger Friendly. That attraction must not
  // reserve the entire town for the player and stop NPC marriages and births.
  // Keep actual companions, earned friendships and pending asks available.
  const shared = Court.shared(world, from.id, player.id);
  const pending = (world.pendingProposals || []).some(p => p.fromId === from.id);
  if (!pending && shared < 1 && Rel().rawScore(world, from.id, player.id) < C().REL.FRIENDLY_MIN) return false;
  if (Rel().score(world, from.id, player.id) >= C().REL.FRIENDLY_MIN) return true;
  if (!Court.wants(world, from, player)) return false;
  return shared >= 1;
}

function ensurePlayerAsk(world, rng, player) {
  if (!player || !freeSlot(player)) { world.friendlyAskWait = 0; return; }
  const people = world.characters.filter(eligible);
  // A married NPC can be approached by the player, but an automatic proposal
  // must come from a free suitor (the pending-ask queue enforces that too).
  const cands = people.filter(c => !c.isPlayer && freeSlot(c) && Court.wouldAsk(world, c, player));
  if (!cands.length) { world.friendlyAskWait = 0; return; }
  world.friendlyAskWait = (world.friendlyAskWait || 0) + 1;
  if ((world.pendingProposals || []).length) return;
  if (ADV.World && ADV.World.playerContactReady && !ADV.World.playerContactReady(world, 'lastPlayerProposalAt')) return;
  const rode = cands.filter(c => Court.shared(world, c.id, player.id) >= 1);
  const must = world.friendlyAskWait >= (C().COURT.playerAskBy || 3);
  const pool = rode.length ? rode : (must ? cands : []);
  if (!pool.length) return;
  pool.sort((a, b) => {
    const ds = Rel().score(world, b.id, player.id) - Rel().score(world, a.id, player.id);
    if (ds) return ds;
    return Court.shared(world, b.id, player.id) - Court.shared(world, a.id, player.id);
  });
  queueProposal(world, pool[0].id);
}

function pairNpcs(world, from, to, feed) {
  const lines = Rel().commit(world, from.id, to.id);
  announcePair(feed, lines);
}

// Runs on the world clock.
Court.tick = function (world, rng, feed, lowPop) {
  Court.invalidate(world);
  const people = world.characters.filter(eligible);
  const player = ADV.World.byId(world, world.playerId);
  for (const from of people) {
    if (from.isPlayer) continue;                         // the player asks in person
    // Prefer the player over any NPC. Do not marry a Friendly suitor off
    // before they have had a chance to ask — incoming asks are paced below.
    if (player && Court.wouldAsk(world, from, player)) continue;
    if (holdingForPlayer(world, from, player)) continue;
    for (const to of people) {
      if (from === to || from.sex === to.sex || to.isPlayer) continue;
      if (holdingForPlayer(world, to, player)) continue;
      if ((world.pendingProposals || []).some(p => p.fromId === to.id)) continue;
      if (!Court.wants(world, from, to)) continue;       // (warmth itself is a live floor in Rel.score)
      if (!Court.wouldAsk(world, from, to)) continue;
      // NPC asks NPC: accepted when the other side is Friendly (a rich man is always asked; he accepts)
      let accept = to.sex === 'm' ? true : Rel().score(world, to.id, from.id) >= C().REL.FRIENDLY_MIN;
      if (to.hiroNpc && !ADV.Hiro.acceptsProposal(from)) accept = false;   // reputation 15 or nothing
      if (!accept) { Court.decline(world, to, from); continue; }
      pairNpcs(world, from, to, feed);
    }
  }
  // Town life: leftover singles pair with each other even without shared quests.
  // Clock 0 stays reserved for the player-facing courtship tests.
  if (world.questClock >= (C().COURT.npcTownAfter || 1)) {
    const pending = new Set((world.pendingProposals || []).map(p => p.fromId));
    const singles = people.filter(c => !c.isPlayer && freeSlot(c)
      && !pending.has(c.id) && !holdingForPlayer(world, c, player));
    const taken = new Set();
    for (const from of rng.shuffle(singles.slice())) {
      if (taken.has(from.id) || !freeSlot(from)) continue;
      if (!rng.chance(C().COURT.npcAskChance || 0.45)) continue;
      const pool = singles.filter(to => !taken.has(to.id) && npcTownEligible(world, from, to));
      if (!pool.length) continue;
      const to = rng.pick(pool);
      pairNpcs(world, from, to, feed);
      taken.add(from.id); taken.add(to.id);
    }
  }
  ensurePlayerAsk(world, rng, player);
  // lapsed asks (the player never answered) fall away quietly
  world.pendingProposals = (world.pendingProposals || []).filter(p => {
    const c = ADV.World.byId(world, p.fromId);
    const pl = ADV.World.byId(world, world.playerId);
    const askerFree = c && c.alive && freeSlot(c);
    const playerFree = !pl || freeSlot(pl);
    return askerFree && playerFree && world.questClock - p.at < 3;
  });
};

// `decliner` turned `asker` down: the asker's regard drops to Neutral and stays
// there for the cooldown, after which the rules may lift it again.
Court.decline = function (world, decliner, asker) {
  Rel().move(world, asker.id, decliner.id, 0, 'romance', { set: true });
  Court.cooldown(world, asker.id, decliner.id);
  world.pendingProposals = (world.pendingProposals || []).filter(p => p.fromId !== asker.id);
};

ADV.Courtship = Court;
})();
