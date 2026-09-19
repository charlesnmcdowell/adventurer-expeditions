// World state & the world clock (§6): NPC progression, courtship, population,
// NPC-vs-NPC violence, and the event feed. NPC quests resolve abstractly —
// never simulated as combat.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Rel = () => ADV.Rel;
const Ch = () => ADV.Character;

const World = {};
const indexes = new WeakMap();
World.reindex = function(world) {
  const byId=new Map(),duplicates=[];
  world.characters.forEach((character,index)=>{
    if(byId.has(character.id))duplicates.push(character.id);
    else byId.set(character.id,{character,index});
  });
  const value={array:world.characters,length:world.characters.length,byId,duplicates};indexes.set(world,value);return value;
};
World.addCharacter = function(world,character) {
  const existing=World.byId(world,character.id);
  if(existing===character)return character;
  if(existing)throw new Error('Duplicate character identity: '+character.id);
  world.characters.push(character);indexes.delete(world);return character;
};
World.duplicateIds = function(world) {return World.reindex(world).duplicates.slice();};

World.create = function (seed) {
  const rng = new ADV.RNG(seed);
  const world = {
    seed, questClock: 0, populationVersion: C().POPULATION_VERSION,
    characters: [], edges: [], vaults: [], parties: [],
    eventFeed: [], activeHeroes: [], pendingRescues: [],
    pendingPopulation: [], orphans: [], divineOffers: [],
    pendingHeroInvites: [], pendingPlayerJilt: null,
    playerId: null, metIds: [],
    lastPlayerHelpAt: -99, lastPlayerProposalAt: -99, lastRivalAt: -99,
    lastRivalOuting: null, travelSpoke: [],
    genRng: rng.seed,
  };
  // Starting population: a diverse roster — healers and tanks on
  // both sides, and two who already practise the forbidden arts
  const menPlan = [{ inclination: 'tank' }, { inclination: 'healer' }, { inclination: 'fighter' }, { inclination: 'mage', forbidden: 'necromancy' },
    { inclination: 'rogue' }, { inclination: 'ranger' }, { inclination: 'druid' }, { inclination: 'tank' }];
  const womenPlan = [{ inclination: 'healer' }, { inclination: 'tank' }, { inclination: 'mage' }, { inclination: 'rogue', forbidden: 'conscript' },
    { inclination: 'ranger' }, { inclination: 'druid' }, { inclination: 'fighter' }, { inclination: 'healer' }];
  for (let i = 0; i < C().POP_START.men; i++) World.addCharacter(world, Ch().seedNPC(rng, world, Object.assign({ sex: 'm' }, menPlan[i] || {})));
  for (let i = 0; i < C().POP_START.women; i++) World.addCharacter(world, Ch().seedNPC(rng, world, Object.assign({ sex: 'f' }, womenPlan[i] || {})));
  // Two employer parties covering different archetypes (§11)
  seedEmployerParties(world, rng);
  return world;
};

function seedEmployerParties(world, rng) {
  const npcs = world.characters.filter(c => !c.isPlayer && c.alive);
  const sorted = rng.shuffle(npcs);
  const leaders = sorted.slice(0, 2);
  for (const leader of leaders) {
    const p = ADV.Party.create(world, leader.id);
    p.employerParty = true;
    leader.inventory.gold += 120; // leaders start with working capital
    const need = ADV.Party.missingRoles(world, p).length;
    const want = Math.max(need, rng.int(1, 2));
    for (let i = 0; i < want; i++) {
      const open = sorted.filter(c => !c.partyId && c !== leader);
      const m = ADV.Party.pickMember(rng, open, ADV.Party.missingRoles(world, p));
      if (!m) break;
      p.memberIds.push(m.id);
      p.wages[m.id] = rng.int(C().GOLD.wageAcceptMin, 45);
      m.partyId = p.id; m.leaderId = leader.id; m.wage = p.wages[m.id];
    }
  }
}

// Canonical character lookup — the one place the roster is scanned by id.
World.byId = function (world, id) {
  if(id==null)return null;
  let idx=indexes.get(world);
  if(!idx||idx.array!==world.characters||idx.length!==world.characters.length)idx=World.reindex(world);
  let entry=idx.byId.get(id);
  // Public fixtures and legacy integrations may replace/reorder an array in
  // place. Verify the cached position; missing IDs take the canonical path.
  if(!entry||entry.character.id!==id||world.characters[entry.index]!==entry.character){idx=World.reindex(world);entry=idx.byId.get(id);}
  return entry?.character||null;
};
// Bound event-feed writer, so systems stop hand-rolling (t, ids) => ... lambdas.
World.feeder = function (world) {
  return (text, actorIds) => World.feed(world, text, actorIds);
};

// `known` is whether the player has met anyone involved. Unknown-actor entries
// still go in the feed — the world's social life is the point of the feed, and
// hiding it made the relationship system look broken — but the panel renders
// them as hearsay so the player can tell a friend's wedding from a stranger's.
World.feed = function (world, text, actorIds) {
  const ids = actorIds || [];
  const known = !ids.length || ids.some(id => world.metIds.includes(id));
  world.eventFeed.push({ questClock: world.questClock, text, actorIds: ids, known });
  if (world.eventFeed.length > 400) world.eventFeed.splice(0, world.eventFeed.length - 400);
};

World.met = function (world, id) {
  if (!world.metIds.includes(id)) world.metIds.push(id);
};

World.adults = function (world) {
  return world.characters.filter(c => c.alive && !c.isMonster);
};

// Ordinary residents are the renewable social/recruitment pool. Story actors,
// registry guests and raised thralls must not satisfy the population floor.
World.population = function (world) {
  return world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster && !c.isUndead && !c.registryId && !c.campaign);
};
World.newcomerSex = function (people) {
  return people.filter(c => c.sex === 'f').length < (people.length + 1) * C().FEMALE_RATIO_TARGET ? 'f' : 'm';
};
World.upgradePopulation = function (world, rng) {
  if ((world.populationVersion || 0) >= C().POPULATION_VERSION) return false;
  const people = World.population(world);
  const missing = Math.max(0, C().POP_START.men + C().POP_START.women - people.length);
  for (let i = 0; i < missing; i++) {
    const npc = Ch().seedNPC(rng, world, { sex: World.newcomerSex(people) });
    World.addCharacter(world, npc); people.push(npc);
  }
  world.populationVersion = C().POPULATION_VERSION;
  if (missing) World.feed(world, `${missing} new adventurers have arrived in town. Find them in the roster.`, []);
  return true;
};

// Player-facing mail only from people who have ridden a contract with them.
World.rodeWithPlayer = function (world, npc) {
  if (!world || !npc || npc.isPlayer || !world.playerId) return false;
  return !!(ADV.Courtship && ADV.Courtship.shared(world, npc.id, world.playerId) >= 1);
};
World.playerContactReady = function (world, key) {
  const last = world && world[key];
  if (last == null || last < 0) return true;
  return (world.questClock - last) >= (C().PLAYER_CONTACT_GAP || 2);
};
World.markPlayerContact = function (world, key) {
  if (world) world[key] = world.questClock;
};
World.pruneStrangerContacts = function (world) {
  if (!world) return;
  const keep = (id) => World.rodeWithPlayer(world, World.byId(world, id));
  const keepAsk = (id) => {
    if (keep(id)) return true;
    const npc = World.byId(world, id);
    const pl = World.byId(world, world.playerId);
    if (!npc || !pl) return false;
    return Rel().score(world, npc.id, pl.id) >= C().REL.FRIENDLY_MIN;
  };
  world.pendingRescues = (world.pendingRescues || []).filter(r => keep(r.targetId));
  world.pendingProposals = (world.pendingProposals || []).filter(p => keepAsk(p.fromId));
  world.pendingHeroInvites = (world.pendingHeroInvites || []).filter(i => keep(i.heroId));
};

// ==================== THE TICK ====================
// Advances when the player quests or stays home (§6). One call = one unit.
World.tick = function (world, rng, opts) {
  opts = opts || {};
  world.questClock++;
  World.pruneStrangerContacts(world);
  const feed = World.feeder(world);
  const pop = World.population(world).length;
  const lowPop = pop < C().POP_LOW;

  // --- NPC abstract quests: roll vs skill levels, gear, party (§6) ---
  for (const npc of World.adults(world)) {
    if (npc.isPlayer || (npc.registryId && !npc.hiroNpc)) continue;
    if (npc.hospitalizedQuestsLeft > 0 || npc.isConscript || npc.isUndead) continue;
    if (npc.status === 'hero') continue; // heroes idle unless hunting (below)
    // mothers with dependents sometimes stay home
    const youngKids = (npc.dependents || []).filter(d => d.age < C().CHILD_SELF_SUFFICIENT).length;
    if (npc.sex === 'f' && youngKids > 0) {
      const tuition = youngKids * C().GOLD.tuitionPerChildPerQuest;
      if (npc.inventory.gold < tuition || rng.chance(0.35)) {
        continue; // stays home; world moves on without her (§7)
      }
      npc.inventory.gold -= tuition;
    }
    const skill = ADV.Quests.avgSkillLevel(npc);
    const gearBonus = npc.equippedSet ? 8 : 0;
    const party = ADV.Party.of(world, npc);
    const partyBonus = party ? Math.min(8, ADV.Party.roster(world, party).length * 2) : 0;
    const roll = rng.float() * 100;
    const power = 25 + skill * 2 + gearBonus + partyBonus + npc.personality.caution / 10;
    let deathChance = npc.personality.aggression / 800 + 0.012;
    if (party && ADV.Party.hasHealer(world, party) && ADV.Party.hasTank(world, party)) {
      deathChance *= party.leaderId === npc.id ? 0.4 : 0.65;
    } else if (party && ADV.Party.hasSupport(world, party)) {
      deathChance *= party.leaderId === npc.id ? 0.6 : 0.8;
    }
    if (lowPop) deathChance *= 0.3; // suppress lethality below the population floor (§6)
    if (roll < power) {
      npc.questsCompleted++; npc.reputation = Math.min(20, npc.reputation + 1);
      npc.rank = 1 + Math.floor(npc.questsCompleted / 8);
      let pay = party && party.leaderId === npc.id ? rng.int(60, 140) :
                party ? (npc.wage || 30) : rng.int(30, 45);
      npc.inventory.gold += pay;
      // skill use levels their kit
      for (const e of npc.actives) {
        e.uses += rng.int(1, 3);
        const lvl = 1 + Math.floor(e.uses / C().USES_PER_LEVEL);
        if (lvl > e.level) {
          e.level = lvl;
          npc.skillLevels[e.skillId] = { level: e.level, uses: e.uses };
          if (lvl === C().TIER_THRESHOLDS.advanced && world.metIds.includes(npc.id)) {
            const sk = ADV.DATA.SKILLS[e.skillId];
            feed(`${npc.name} has mastered ${sk.tiers.advanced.name}.`, [npc.id]);
          }
        }
      }
      // shared-quest relationship movement inside parties (§15)
      if (party) {
        const roster = ADV.Party.roster(world, party);
        if (party.leaderId === npc.id) ADV.Courtship.recordShared(world, roster.filter(c => !c.isPlayer).map(c => c.id));
        for (const a of roster) for (const b of roster) {
          if (a !== b && !a.isPlayer) {
            Rel().move(world, a.id, b.id, Math.round(C().REL_MOVE.sharedQuestWin *
              Rel().socialRate(world, a, b)), 'quest');
          }
        }
      }
    } else if (rng.chance(deathChance)) {
      ADV.Death.finalize(world, npc, null, 'quest');
      feed(`${npc.name} failed a contract and did not return.`, [npc.id]);
      continue;
    } else {
      npc.questsFailed++; npc.reputation = Math.max(-20, npc.reputation - 1);
      if (rng.chance(0.25) && world.metIds.includes(npc.id)) {
        // danger state -> rescue offer if friendly with the player (§6)
        maybeOfferRescue(world, rng, npc, null, 'failed');
      }
    }
    // purchases on the world clock: gear sets, then witnessed skills (§6)
    npcShopping(world, rng, npc, feed);
  }

  // --- parties hire, lose people over pay, and new ones form (request 15) ---
  partyDynamics(world, rng, feed);

  // --- NPC courtship & romance (§6) ---
  npcCourtship(world, rng, feed, lowPop);

  // --- Pregnancy & children (§7) ---
  tickChildren(world, rng, feed);

  // --- Envy / hatred maintenance ---
  Rel().tickEnvy(world, feed);
  ADV.Party.enforceHatred(world, feed);

  // --- NPC-vs-NPC assassinations (§6) ---
  npcAssassinations(world, rng, feed, lowPop);

  // --- bought knives: the Maw collects on its contracts (request) ---
  for (const k of (world.mawContracts || []).slice()) {
    world.mawContracts.splice(world.mawContracts.indexOf(k), 1);
    const target = World.byId(world, k.targetId);
    if (!target || !target.alive) continue;
    const tPow = ADV.Quests.avgSkillLevel(target) + (target.equippedSet ? 8 : 0) + (ADV.Party.of(world, target) ? 6 : 0) + Math.max(0, target.reputation);
    const aPow = 18 + Math.max(1, target.reputation) * 2;
    if (rng.chance(aPow / (aPow + tPow))) {
      ADV.Death.finalize(world, target, null, 'assassinated');
      feed(`${target.name} was found in an alley. Nobody saw anything.`, [target.id]);
    } else {
      Rel().move(world, target.id, k.byId, -100, 'murder', { set: true, decays: false });
      feed(`${target.name} survived a Maw knife — and learned who paid for it.`, [target.id, k.byId]);
    }
  }

  // --- Theft (§10): greedy hires & hated NPCs rob the player ---
  maybeTheft(world, rng, feed, opts);

  // --- Forbidden-skill bookkeeping & Divine Intervention (§3a) ---
  ADV.Divine.tickFollowers(world, feed);
  ADV.Divine.checkTriggers(world, feed);
  ADV.Divine.assignHeroes(world, rng, feed);
  npcHeroHunts(world, rng, feed);

  // --- Conscription population debt (§3a) ---
  for (const p of world.pendingPopulation.slice()) {
    if (world.questClock >= p.dueAtQuest) {
      world.pendingPopulation.splice(world.pendingPopulation.indexOf(p), 1);
      for (let i = 0; i < p.count; i++) {
        world.orphans.push({ id: 'consc' + rng.int(1, 1e9), age: C().CHILD_ADULT - C().CONSCRIPT_POP_DELAY,
          sex: rng.chance(0.5) ? 'f' : 'm', motherId: null, fatherId: null,
          hostileToId: p.hostileToId, demigod: false });
      }
      feed('Three new faces arrived in town. They are asking about someone.', [p.hostileToId]);
    }
  }

  // --- Orphans & children mature into adults at 10 (§6) ---
  for (const o of world.orphans.slice()) {
    if(o.lastAgedAt!==world.questClock)o.age++;
    o.lastAgedAt=world.questClock;
    if (o.age >= C().CHILD_ADULT) {
      world.orphans.splice(world.orphans.indexOf(o), 1);
      const npc = Ch().matureChild(rng, world, o);
      World.addCharacter(world, npc);
      if (o.hostileToId) {
        Rel().move(world, npc.id, o.hostileToId, -100, 'murder', { set: true, decays: false });
        const target = ADV.World.byId(world, o.hostileToId);
        feed(`${npc.name} came of age with a grudge${target ? ' against ' + (target.isPlayer ? 'you' : target.name) : ''}.`, [npc.id, o.hostileToId]);
      } else if (o.avengerTarget) {
        Rel().move(world, npc.id, o.avengerTarget, -100, 'murder', { set: true, decays: false });
        npc.avengerClaimId = o.avengerTarget;
        const t = ADV.World.byId(world, o.avengerTarget);
        feed(`${npc.name}, ${npc.title || 'grown now'}, is hunting ${t ? (t.isPlayer ? 'you' : t.name) : 'a killer'}.`, [npc.id, o.avengerTarget]);
      } else {
        feed(`${npc.name} has come of age and joined the roster.`, [npc.id]);
      }
      if (o.pendingEstate) {
        const v = ADV.Vault.ensureOwn(world, npc);
        v.gold += o.pendingEstate.gold; v.items.push(...(o.pendingEstate.items || []));
      }
    }
  }

  // --- Father-legacy titles grow while the father lives (frozen at his death) ---
  for (const ch of world.characters) {
    if (!ch.alive || !ch.title || !ch.fatherId || !/^(Son|Daughter) of /.test(ch.title)) continue;
    const f = World.byId(world, ch.fatherId);
    if (f && f.alive) Ch().applyLegacy(ch, f);
  }

  // --- Emergency population floor (§6) ---
  const residents = World.population(world);
  if (residents.length < C().POP_FLOOR) {
    const n = Ch().seedNPC(rng, world, { sex: World.newcomerSex(residents) });
    World.addCharacter(world, n);
    feed(`A stranger, ${n.name}, arrived in town from beyond the valley.`, [n.id]);
  }

  // --- Hiro arrives after the player's second contract (request) ---
  if (ADV.Hiro && opts.playerQuested) ADV.Hiro.maybeArrive(world, rng, feed);

  // --- expire rescue offers ---
  world.pendingRescues = world.pendingRescues.filter(r => {
    if (world.questClock > r.expiresAtQuest) {
      resolveRescueAbstract(world, rng, r, feed);
      return false;
    }
    return true;
  });
  world.pendingHeroInvites = (world.pendingHeroInvites || []).filter(r => {
    if (world.questClock > r.expiresAtQuest) {
      const hero = ADV.World.byId(world, r.heroId);
      if (hero) {
        hero.divineInvitesWindow.push(false);
        checkHeroInviteWindow(world, hero, feed);
      }
      return false;
    }
    return true;
  });

  return world;
};

// Failed-quest danger state (§6): a friendly NPC botches badly and sends a
// help request instead of dying outright.
function maybeOfferRescue(world, rng, npc, attackerId, kind) {
  world.pendingRescues = world.pendingRescues || [];
  if (world.pendingRescues.length) return;
  if ((world.pendingHeroInvites || []).length) return;
  if (!World.playerContactReady(world, 'lastPlayerHelpAt')) return;
  if (!World.rodeWithPlayer(world, npc)) return;
  if (Rel().score(world, npc.id, world.playerId) < C().REL.FRIENDLY_MIN) return;
  world.pendingRescues.push({
    targetId: npc.id, attackerId: attackerId || null,
    expiresAtQuest: world.questClock + C().RESCUE_EXPIRES_IN,
    kind: kind || 'danger',
  });
  World.markPlayerContact(world, 'lastPlayerHelpAt');
  World.feed(world, `${npc.name} is in trouble and asking for your help.`, [npc.id]);
}

// ---------------------------------------------------------------- shopping
function npcShopping(world, rng, npc, feed) {
  // Gear set first — the single largest sink (§10)
  if (!npc.equippedSet && rng.chance(0.6)) {
    const inc = npc.archetypeInclination[0];
    const keys = Object.keys(ADV.DATA.GEAR_SETS).filter(k => {
      const s = ADV.DATA.GEAR_SETS[k];
      return s && !s.campaign && (s.archetypes || []).includes(inc);
    });
    const singles = keys.filter(k => ADV.DATA.GEAR_SETS[k].archetypes.length === 1);
    const setId = singles[0] || keys[0] || 'warrior';
    const set = ADV.DATA.GEAR_SETS[setId];
    const cost = (set && set.cost) || C().GOLD.gearSet;
    if (npc.inventory.gold >= cost) {
      npc.inventory.gold -= cost;
      npc.equippedSet = setId;
      if (world.metIds.includes(npc.id)) feed(`${npc.name} bought a ${set.name}.`, [npc.id]);
      return;
    }
  }
  // Witnessed skills are free; otherwise buy along inclination (§3/§6)
  if (rng.chance(0.4)) {
    const wants = [];
    for (const [skillId, je] of Object.entries(npc.journal || {})) {
      if (je.witnessed && !ADV.SkillSys.knows(npc, skillId)) wants.push({ skillId, cost: 0 });
    }
    for (const inc of npc.archetypeInclination) {
      const arch = ADV.DATA.ARCHETYPE_SKILLS[inc];
      for (const id of [arch.perk].concat(arch.actives)) {
        if (!ADV.SkillSys.knows(npc, id) && npc.inventory.gold >= C().GOLD.skillUnwitnessed) {
          wants.push({ skillId: id, cost: C().GOLD.skillUnwitnessed });
        }
      }
    }
    if (wants.length) {
      const pick = rng.pick(wants);
      const sk = ADV.DATA.SKILLS[pick.skillId];
      const kind = sk.kind === 'perk' ? 'perk' : 'active';
      if (ADV.SkillSys.atCapacity(npc, kind)) {
        // NPCs swap their lowest-level skill when something witnessed is better
        const list = kind === 'perk' ? npc.perks : npc.actives;
        const weakest = list.slice().sort((a, b) => a.level - b.level)[0];
        if (weakest && weakest.level <= 3 && pick.cost === 0) ADV.SkillSys.forget(npc, weakest.skillId);
        else return;
      }
      const r = ADV.SkillSys.learn(npc, pick.skillId, { free: pick.cost === 0 });
      if (r.ok && pick.cost) npc.inventory.gold -= pick.cost;
    }
  }
}

// ---------------------------------------------------------------- parties
// Employer parties grow, bleed members who want more pay, and new outfits
// spring up from free agents with capital (request 15).
const EMPLOYER_PARTY_TARGET = 4;

function livingNpcParties(world, pid) {
  return world.parties.filter(p => {
    if (p.leaderId === pid) return false;
    const leader = ADV.Party.leader(world, p);
    return !!(leader && leader.alive);
  });
}

function sweepDeadParties(world, feed) {
  for (const p of world.parties.slice()) {
    const leader = ADV.Party.leader(world, p);
    if (leader && leader.alive) continue;
    ADV.Party.disband(world, p);
    if (feed) feed('A leaderless company folded.', p.memberIds || []);
  }
}

function foundEmployerParty(world, rng, feed, freeFn) {
  let pool = freeFn();
  if (!pool.length) {
    const pid = world.playerId;
    const donors = world.parties
      .map(p => ({ p, leader: ADV.Party.leader(world, p), hires: ADV.Party.members(world, p) }))
      .filter(x => x.leader && x.leader.alive && x.leader.id !== pid && !x.leader.hiroNpc && x.hires.length)
      .sort((a, b) => b.hires.length - a.hires.length);
    if (donors.length) {
      const m = donors[0].hires[0];
      ADV.Party.removeMember(world, donors[0].p, m.id);
      pool = [m];
    }
  }
  if (!pool.length) return null;
  const prefer = pool.filter(c => (c.personality.caution || 50) < 75);
  const leader = rng.pick(prefer.length ? prefer : pool);
  if (leader.inventory.gold < C().GOLD.partyStartupCapital + 60) leader.inventory.gold += 120;
  const p = ADV.Party.create(world, leader.id);
  p.employerParty = true;
  let hirePool = freeFn().filter(c => c !== leader && !ADV.Party.hatredConflict(world, p, c.id));
  let seats = 0;
  while (hirePool.length && seats < 2 && ADV.Party.missingRoles(world, p).length) {
    const first = ADV.Party.pickMember(rng, hirePool, ADV.Party.missingRoles(world, p));
    if (!first) break;
    const w = rng.int(C().GOLD.wageAcceptMin, 40);
    p.memberIds.push(first.id); p.wages[first.id] = w;
    first.partyId = p.id; first.leaderId = leader.id; first.wage = w;
    seats++;
    hirePool = hirePool.filter(c => c !== first);
  }
  feed(`${leader.name} has started a party of ${leader.sex === 'f' ? 'her' : 'his'} own.`, [leader.id]);
  return p;
}

function partyDynamics(world, rng, feed) {
  const pid = world.playerId;
  const free = () => World.adults(world).filter(c => !c.isPlayer && !c.registryId && !c.partyId && c.status === 'normal' && !c.isUndead && !c.isConscript && c.hospitalizedQuestsLeft <= 0);
  sweepDeadParties(world, feed);
  // Replacements first — Hiro used to hire the free agents before anyone could found.
  while (livingNpcParties(world, pid).length < EMPLOYER_PARTY_TARGET) {
    if (!foundEmployerParty(world, rng, feed, free)) break;
  }
  for (const p of world.parties.slice()) {
    const leader = ADV.Party.leader(world, p);
    if (!leader || !leader.alive) continue;
    const npcLed = leader.id !== pid;
    // members ask for more; a leader who cannot or will not pay loses them
    for (const m of ADV.Party.members(world, p)) {
      if (m.isPlayer || m.hospitalizedQuestsLeft > 0) continue;
      const wage = p.wages[m.id] || 0;
      const itch = (m.personality.greed - 40) / 100 + (wage < C().GOLD.wageAcceptMin ? 0.15 : 0) + (m.questsCompleted > 6 ? 0.05 : 0);
      if (!rng.chance(Math.max(0.02, itch * 0.35))) continue;
      const ask = Math.min(C().GOLD.wageAcceptMax, wage + (C().GOLD.wageRaiseStep || 10));
      if (ask <= wage) continue;
      if (npcLed) {
        const pays = leader.inventory.gold >= ask * 2 && rng.chance(0.6 - leader.personality.greed / 250);
        if (pays) { p.wages[m.id] = ask; m.wage = ask; }
        else {
          ADV.Party.removeMember(world, p, m.id);
          if (world.metIds.includes(m.id) || world.metIds.includes(leader.id)) feed(`${m.name} quit ${leader.name}'s party over pay.`, [m.id, leader.id]);
        }
      } else {
        // the player's hire: the demand lands on the town notices
        world.pendingRaises = world.pendingRaises || [];
        if (!world.pendingRaises.some(r => r.memberId === m.id)) world.pendingRaises.push({ memberId: m.id, ask, at: world.questClock });
      }
    }
    // NPC-led parties grow when the leader has the purse for it (Hiro keeps one seat open)
    const missing = ADV.Party.missingRoles(world, p);
    const open = free();
    const hireOdds = missing.length ? 0.9 : 0.3;
    // Grow past a healer+tank only while town still has spare free agents
    // (Hiro and the player need someone left to hire).
    const canGrow = missing.length || open.length > 4;
    if (npcLed && canGrow && ADV.Party.roster(world, p).length < (ADV.Hiro ? ADV.Hiro.growthCap(p) : C().PARTY_MAX) && rng.chance(hireOdds)) {
      const cand = open.filter(c => !ADV.Party.hatredConflict(world, p, c.id));
      if (cand.length) {
        const c = ADV.Party.pickMember(rng, cand, missing);
        if (!c) continue;
        const wage = rng.int(C().GOLD.wageAcceptMin, 45);
        if (leader.inventory.gold >= wage * 2) {
          p.memberIds.push(c.id); p.wages[c.id] = wage; c.partyId = p.id; c.leaderId = leader.id; c.wage = wage;
          if (world.metIds.includes(c.id) || world.metIds.includes(leader.id)) feed(`${leader.name} hired ${c.name}.`, [leader.id, c.id]);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- courtship
function npcCourtship(world, rng, feed, lowPop) {
  // The rules (js/core/courtship.js) decide who warms and who asks. Population
  // pressure alone breaks a standing pair: under the floor, a partnered NPC may
  // leave for someone who wants them (§6 central tension), rarely.
  ADV.Courtship.tick(world, rng, feed, lowPop);
  if (!lowPop) return;
  const adults = World.adults(world).filter(c => !c.isPlayer && !c.registryId && c.status === 'normal' && !c.isUndead && !c.isConscript);
  const pid = world.playerId;
  for (const a of adults) {
    if (!a.partnerId || a.partnerId === pid || !rng.chance(0.05)) continue;
    const kids = (a.childIds || []).length;
    if (kids < 1) continue;
    const b = adults.find(x => x.sex !== a.sex && !x.partnerId && x.partnerId !== pid && ADV.Courtship.wants(world, x, a) && Rel().canRomance(world, a.id, x.id).why !== 'blood relation');
    if (!b) continue;
    const lines = Rel().commit(world, a.id, b.id);
    for (const l of lines) feed(l.text.replace(' are together.', ' married.'), l.actorIds);
  }
}

// ---------------------------------------------------------------- children
function tickChildren(world, rng, feed) {
  // Leave room to grow beyond the starting town, without exponential ambient
  // generations overwhelming the roster. Existing children always mature and
  // the player's family keeps its own conception rules, even in a full town.
  let projected = World.population(world).length + (world.orphans || []).length
    + World.adults(world).reduce((n, c) => n + (c.dependents || []).length, 0);
  for (const w of World.adults(world).filter(c => c.sex === 'f')) {
    // age dependents; player's are aged by the game layer identically through here
    for (const d of (w.dependents || [])) {
      d.age++;
      d.lastAgedAt=world.questClock;
      if (d.age === C().CHILD_SELF_SUFFICIENT && w.isPlayer) world.childSelfSufficientFlag = true;
    }
    // graduation to the orphan pool happens at self-sufficiency+; they mature from world.orphans
    const grads = (w.dependents || []).filter(d => d.age >= C().CHILD_ADULT);
    for (const g of grads) {
      w.dependents.splice(w.dependents.indexOf(g), 1);
      world.orphans.push(g);
    }
    if (!w.partnerId || w.isPlayer) continue; // player conception handled in game layer for consent/visibility
    const partner = ADV.World.byId(world, w.partnerId);
    if (!partner || !partner.alive) continue;
    w.relationshipQuests = (w.relationshipQuests || 0) + 1;
    const kids = new Set((w.childIds || []).concat((w.dependents || []).map(d=>d.id))).size;
    if (kids >= C().MAX_CHILDREN_PER_RELATIONSHIP) continue;
    if (!partner.isPlayer && projected >= C().POP_HIGH) continue;
    const guaranteed = !w.conceived && w.relationshipQuests >= C().CONCEPTION_GUARANTEE_AT;
    if (guaranteed || rng.chance(C().CONCEPTION_CHANCE)) {
      w.conceived = true;
      const child = Ch().makeDependent(rng, world, w, partner.id);
      w.dependents = w.dependents || [];
      w.dependents.push(child);
      w.childIds.push(child.id); partner.childIds.push(child.id);
      projected++;
      feed(`${w.name} and ${partner.name} had a child.`, [w.id, partner.id]);
    }
  }
}

// ------------------------------------------------------------ assassination
function npcAssassinations(world, rng, feed, lowPop) {
  if (lowPop && rng.chance(0.7)) return; // dampen lethality below the floor (§6)
  const adults = World.adults(world).filter(c => !c.isPlayer);
  for (const attacker of adults) {
    if (attacker.hospitalizedQuestsLeft > 0 || attacker.isConscript || attacker.isUndead) continue;
    const hatedEdges = world.edges.filter(e => e.fromId === attacker.id && e.score <= C().REL.HATRED_MAX);
    for (const e of hatedEdges) {
      const target = ADV.World.byId(world, e.toId);
      if (!target || !target.alive || target.isPlayer) continue; // attempts on the player queue at quest end
      if (!rng.chance(0.06 + attacker.personality.aggression / 500)) continue;
      // Friends who have ridden with the player send a help request instead of resolving (§6)
      if (World.rodeWithPlayer(world, target) &&
          Rel().score(world, target.id, world.playerId) >= C().REL.FRIENDLY_MIN) {
        if (!(world.pendingRescues || []).length && !(world.pendingHeroInvites || []).length &&
            World.playerContactReady(world, 'lastPlayerHelpAt')) {
          world.pendingRescues.push({ targetId: target.id, attackerId: attacker.id,
            expiresAtQuest: world.questClock + C().RESCUE_EXPIRES_IN, kind: 'assassination' });
          World.markPlayerContact(world, 'lastPlayerHelpAt');
          feed(`${target.name} is in danger — ${attacker.name} is coming for ${target.sex === 'f' ? 'her' : 'him'}.`, [target.id, attacker.id]);
        }
        continue;
      }
      resolveRescueAbstract(world, rng, { targetId: target.id, attackerId: attacker.id }, feed);
      break;
    }
  }
}

// Abstract NPC-vs-NPC assassination resolution (also used for expired rescues).
function resolveRescueAbstract(world, rng, r, feed) {
  const target = ADV.World.byId(world, r.targetId);
  const attacker = ADV.World.byId(world, r.attackerId);
  if (!target || !target.alive) return;
  if (!attacker || !attacker.alive) return;
  const aPow = ADV.Quests.avgSkillLevel(attacker) + (attacker.equippedSet ? 8 : 0) + attacker.personality.aggression / 20;
  const tPow = ADV.Quests.avgSkillLevel(target) + (target.equippedSet ? 8 : 0) +
    (ADV.Party.of(world, target) ? 6 : 0);
  const attackerWins = rng.chance(aPow / (aPow + tPow));
  if (attackerWins) {
    ADV.Death.finalize(world, target, attacker.id, 'assassinated');
    feed(`${attacker.name} killed ${target.name}.`, [attacker.id, target.id]);
  } else {
    ADV.Death.finalize(world, attacker, target.id, 'assassinated');
    feed(`${target.name} survived ${attacker.name}'s ambush — and ended ${attacker.sex === 'f' ? 'her' : 'him'}.`, [target.id, attacker.id]);
  }
}
World.resolveRescueAbstract = resolveRescueAbstract;

// ---------------------------------------------------------------- theft
function maybeTheft(world, rng, feed, opts) {
  const player = ADV.World.byId(world, world.playerId);
  if (!player || !player.alive) return;
  if (!opts.playerQuested) return; // theft resolves during quests (§10)
  const carried = player.inventory.gold;
  if (carried < 20) return;
  // hires with high greed & low relationship rob the player
  const p = ADV.Party.of(world, player);
  if (p && p.leaderId === player.id) {
    for (const m of ADV.Party.members(world, p)) {
      const rel = Rel().score(world, m.id, player.id);
      if (m.personality.greed > 75 && rel < 20 && rng.chance(0.08)) {
        const take = Math.min(carried, rng.int(10, 40));
        player.inventory.gold -= take;
        m.inventory.gold += take;
        Rel().move(world, m.id, player.id, C().THEFT_REL_PENALTY, 'theft');
        feed(`${m.name} robbed you of ${take} gold on the road.`, [m.id]);
        world.theftFlag = true;
        return;
      }
    }
  }
  // hated NPCs steal as a lesser alternative to assassination
  const haters = Rel().hatersOf(world, player.id);
  for (const hid of haters) {
    const h = ADV.World.byId(world, hid);
    if (h && !h.isMonster && rng.chance(0.05)) {
      const take = Math.min(carried, rng.int(15, 50));
      player.inventory.gold -= take;
      h.inventory.gold += take;
      feed(`${h.name} picked your pocket while you slept.`, [h.id]);
      world.theftFlag = true;
      return;
    }
  }
}

// ---------------------------------------------------------------- hero hunts
function npcHeroHunts(world, rng, feed) {
  for (const h of world.activeHeroes.slice()) {
    const hero = ADV.World.byId(world, h.heroId);
    const target = ADV.World.byId(world, h.targetId);
    if (!hero || !hero.alive || !target || !target.alive) continue;
    if (hero.isPlayer) continue;                 // the player hunts on their own schedule
    if (target.isPlayer) continue;               // arrives as an ambush at quest end (§3a)
    if (!rng.chance(0.35)) continue;
    // hero vs target's whole side: hero stats are multiplied; True Rest deletes undead
    const tRoster = ADV.Party.battleRoster(world, target).filter(c => !c.isUndead); // undead evaporate (§3a)
    const hPow = (ADV.Quests.avgSkillLevel(hero) + 15) * h.powerMultiplier;
    const tPow = tRoster.reduce((s, c) => s + ADV.Quests.avgSkillLevel(c) + (c.equippedSet ? 8 : 0), 0);
    if (rng.chance(hPow / (hPow + tPow))) {
      // Loyalty check: a high-Loyalty hero assigned to their spouse spares them (§3a)
      const above = target.partnerId === hero.id || Rel().score(world, hero.id, target.id) > 0;
      if (above && hero.personality.loyalty > 65) {
        ADV.Divine.spare(world, hero, target, feed);
        continue;
      }
      ADV.Death.finalize(world, target, hero.id, 'killed');
      feed(`The hero ${hero.name} has ended ${target.name}.`, [hero.id, target.id]);
    } else if (rng.chance(0.5)) {
      ADV.Death.finalize(world, hero, target.id, 'killed');
      ADV.Divine.onHeroDefeated(world, hero, target, feed);
    }
  }
}

function checkHeroInviteWindow(world, hero, feed) {
  const w = hero.divineInvitesWindow;
  if (w.length >= C().HERO_INVITE_WINDOW) {
    const recent = w.slice(-C().HERO_INVITE_WINDOW);
    if (recent.every(x => x === false)) {
      Rel().move(world, hero.id, world.playerId, C().REL_MOVE.heroInvitesRefused3, 'quest');
      const v = ADV.Vault.of(world, hero);
      if (v) v.sharedQuestStreak = 0;
      feed(`${hero.name} has stopped asking.`, [hero.id]);
      hero.divineInvitesWindow = [];
    }
  }
}
World.checkHeroInviteWindow = checkHeroInviteWindow;
World.tryOfferRescue = maybeOfferRescue;

ADV.World = World;
})();
