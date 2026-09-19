// Death, estates, avengers, reincarnation & nepotism (§7).
(function () {
'use strict';
const C = () => ADV.DATA.CONST;

const Death = {};

// Finalize any character's permanent death. killerId may be null.
// cause: 'killed'|'quest'|'decayed'|'assassinated'
Death.skillNames = function (ch) {
  const names = [];
  for (const e of (ch.perks || []).concat(ch.actives || [])) {
    const sk = ADV.DATA.SKILLS[e.skillId];
    if (!sk || sk.noSlot || sk.universal) continue;
    names.push(sk.name);
  }
  return names;
};

Death.childLabel = function (d) {
  if (d && d.name) return d.name;
  return d && d.sex === 'f' ? 'a daughter' : 'a son';
};

// Snapshot for the graveyard before family links are cleared.
Death.composeObituary = function (world, ch, killerId, cause) {
  const killer = killerId ? ADV.World.byId(world, killerId) : null;
  const pids = ADV.Rel && ADV.Rel.partnerIds ? ADV.Rel.partnerIds(ch) : (ch.partnerId ? [ch.partnerId] : []);
  const spouses = [];
  for (const pid of pids) {
    const partner = ADV.World.byId(world, pid);
    if (partner && partner.alive) spouses.push(partner.name);
  }
  const children = [];
  const seen = {};
  const addKid = (name) => { if (name && !seen[name]) { seen[name] = true; children.push(name); } };
  for (const id of (ch.childIds || [])) {
    const kid = ADV.World.byId(world, id);
    if (kid && kid.alive) addKid(kid.name);
  }
  const youngSurvive = (d) => ch.sex !== 'f' || (d && d.age >= C().CHILD_SELF_SUFFICIENT);
  for (const d of (ch.dependents || [])) if (youngSurvive(d)) addKid(Death.childLabel(d));
  if (ch.sex === 'm') {
    for (const pid of pids) {
      const partner = ADV.World.byId(world, pid);
      if (!partner) continue;
      for (const d of (partner.dependents || [])) {
        if (d.fatherId === ch.id && d.age >= 0) addKid(Death.childLabel(d));
      }
    }
  }
  const party = ADV.Party.of(world, ch);
  const lead = party ? ADV.Party.leader(world, party) : null;
  let station = 'a free adventurer';
  if (party && lead) {
    station = lead.id === ch.id ? 'a party lead' : ('of ' + lead.name + "'s company");
  }
  let death;
  if (cause === 'killed') death = killer ? 'They fell to ' + killer.name + '.' : 'They were slain in the field.';
  else if (cause === 'quest') death = 'They did not return from a contract.';
  else if (cause === 'decayed') death = 'What was raised of them came undone.';
  else if (cause === 'assassinated') death = killer ? 'They were murdered by ' + killer.name + '.' : 'They were murdered.';
  else death = 'They died.';
  const life = ch.name + ' was rank ' + (ch.rank || 1) + ', ' + station + '. ' + death;
  let family = 'They left no household.';
  if (spouses.length && children.length) {
    family = 'Survived by ' + spouses.join(', ') + ', and ' + children.join(', ') + '.';
  } else if (spouses.length) {
    family = 'Survived by ' + spouses.join(', ') + '.';
  } else if (children.length) {
    family = 'Survived by ' + children.join(', ') + '.';
  }
  return {
    name: ch.name,
    title: ch.title || ch.epithet || null,
    rank: ch.rank || 1,
    skills: Death.skillNames(ch),
    text: life + ' ' + family,
    spouses, children, cause,
    deadAtQuest: world.questClock,
  };
};

Death.graves = function (world) {
  return world.characters.filter(c => !c.alive && !c.isMonster && !c.isPlayer)
    .sort((a, b) => (b.deadAtQuest || 0) - (a.deadAtQuest || 0));
};

Death.rememberDeadChild = function (world, child, parent) {
  if (!parent || !child) return;
  parent.deadDependents = parent.deadDependents || [];
  if (parent.deadDependents.some(d => d.id === child.id)) return;
  parent.deadDependents.push({
    id: child.id,
    name: child.name || Death.childLabel(child),
    sex: child.sex,
    age: child.age,
    motherId: child.motherId || null,
    fatherId: child.fatherId || null,
  });
};

// Finisher's +1-all is tracked on finisherGains so death can unwind it
// without touching title or Hero bonuses that share bonusStats.
Death.stripFinisherGains = function (ch) {
  if (!ch) return;
  const n = ch.finisherGains || 0;
  if (n && ch.bonusStats) {
    for (const k of ['hp', 'atk', 'def', 'spd']) {
      ch.bonusStats[k] = Math.max(0, (ch.bonusStats[k] || 0) - n);
    }
  }
  ch.finisherGains = 0;
};

Death.finalize = function (world, ch, killerId, cause) {
  if (!ch.alive) return;
  if (ch.hiroNpc && !ch.isPlayer && ADV.Hiro) {
    ADV.Hiro.resurrect(world, ch, killerId, cause);
    return { resurrected: true };
  }
  Death.stripFinisherGains(ch);
  ch.alive = false;
  ch.deadAtQuest = world.questClock;
  ch.obituary = Death.composeObituary(world, ch, killerId, cause);
  const killer = killerId ? ADV.World.byId(world, killerId) : null;

  // Carried items & gold go to the killer (§7/§10)
  if (killer && killer.alive) {
    killer.inventory.gold += ch.inventory.gold;
    killer.inventory.items = (killer.inventory.items || []).concat(ch.inventory.items || [], ch.equipped || []);
    killer.ownedSets = Array.from(new Set((killer.ownedSets || []).concat(ch.ownedSets || [], ch.equippedSet || [])));
  }
  ch.inventory.gold = 0; ch.inventory.items = []; ch.equipped = []; ch.equippedSet = null;
  // Nobody holds a relationship slot for the dead: outbound feelings toward
  // them are released so the living slot frees up (the player's own edges are
  // unbounded, but an heir's predecessor becomes an ordinary NPC).
  if (ADV.Rel && ADV.Rel.tierBetween) {
    ch.mournerIds = world.characters
      .filter(c => c.alive && c.id !== ch.id)
      .map(c => ({ id: c.id, tier: ADV.Rel.tierBetween(world, c.id, ch.id) }))
      .filter(x => x.tier === 'romantic' || x.tier === 'friendly')
      .slice(0, 6);
  }
  world.edges = world.edges.filter(e => e.toId !== ch.id);

  const widowIds = ADV.Rel ? ADV.Rel.partnerIds(ch).slice() : (ch.partnerId ? [ch.partnerId] : []);

  // Vault claims (§7): killer-ex outranks heirs; else eldest child; else lost.
  const claim = ADV.Vault.onDeath(world, ch, killerId);

  // Record ex status for future claims
  if (killer && widowIds.includes(killer.id)) {
    killer.exIds = killer.exIds || [];
  }

  // Party cleanup: succession if a leader died (§5)
  const p = ADV.Party.of(world, ch);
  if (p) {
    if (p.leaderId === ch.id) {
      const heir = ADV.Party.succession(world, p);
      if (heir) Death.feed(world, `${heir.name} inherited ${ch.name}'s party.`, [heir.id, ch.id]);
    } else {
      ADV.Party.removeMember(world, p, ch.id);
    }
  }

  // Followers released
  for (const fid of (ch.conscriptIds || [])) {
    const f = ADV.World.byId(world, fid);
    if (f && f.alive) { f.isConscript = false; f.conscriptorId = null; }
  }
  for (const fid of (ch.undeadIds || [])) {
    const f = ADV.World.byId(world, fid);
    if (f && f.alive) Death.finalize(world, f, null, 'decayed');
  }

  // Partner(s) widowed — unlink both sides without a jilt. Jilting a corpse
  // used to write edges from the dead (partnerIds outlived partnerId).
  for (const pid of widowIds) {
    if (ADV.Rel) ADV.Rel.removePartner(ch, pid);
    else ch.partnerId = null;
    const partner = ADV.World.byId(world, pid);
    if (!partner) continue;
    if (ADV.Rel) ADV.Rel.removePartner(partner, ch.id);
    else if (partner.partnerId === ch.id) partner.partnerId = null;
    partner.exIds = partner.exIds || [];
    if (!partner.exIds.includes(ch.id)) partner.exIds.push(ch.id);
    partner.deadSpouseIds = partner.deadSpouseIds || [];
    if (!partner.deadSpouseIds.includes(ch.id)) partner.deadSpouseIds.push(ch.id);
  }

  // Children (§7): dependents die if under 5; self-sufficient survive.
  // Avengers exist in exactly one case: father kills mother.
  const deps = (ch.dependents || []);
  if (ch.sex === 'f') {
    for (const child of deps.slice()) {
      if (child.age < C().CHILD_SELF_SUFFICIENT) {
        Death.feed(world, `${ch.name}'s child did not survive her.`, [ch.id]);
        Death.rememberDeadChild(world, child, ch);
        const father = child.fatherId ? ADV.World.byId(world, child.fatherId) : null;
        if (father) Death.rememberDeadChild(world, child, father);
        deps.splice(deps.indexOf(child), 1);
      } else if (killer && child.fatherId === killerId) {
        child.avengerOf = ch.id;
        child.avengerTarget = killerId;
        child.inheritSkills = Object.assign({}, ch.skillLevels);
        child.titleOf = ch.name;
        child.titleRank = ch.rank;
        Death.feed(world, `${ch.name}'s child saw what ${killer.name} did, and will not forget.`, [ch.id, killerId]);
        world.orphans.push(child);
      } else {
        world.orphans.push(child); // grows up ordinary
      }
    }
    ch.dependents = [];
  }

  // Campaign §0f: death does NOT propagate through the relationship graph.
  // Killing creates no Hatred in anyone — only the sources in §0f's table do.
  if (killer) {
    // Spousal murder: severe reputation & faction damage (§7)
    if ((ch.exIds || []).includes(killer.id) || widowIds.includes(killer.id)) {
      killer.reputation -= 5;
      killer.factionStanding.law -= 30;
    }
    // Alignment lever (§6): killing law-aligned pushes criminal, and vice versa
    if (ch.factionStanding && ch.factionStanding.law > 30) killer.factionStanding.law -= 15;
    if (ch.factionStanding && ch.factionStanding.criminal > 30) killer.factionStanding.criminal -= 15;
    // A hero killing an unsanctioned target falls (§3a)
    if (killer.status === 'hero' && killer.heroTargetId !== ch.id) {
      ADV.Divine.vendettaKill(world, killer, ADV.World.feeder(world));
    }
  }

  // Divine bookkeeping
  if (ch.divineMarked) ADV.Divine.onTargetDead(world, ch, ADV.World.feeder(world));
  const heroRec = world.activeHeroes.find(h => h.heroId === ch.id);
  const wasHero = ch.grantsHeld && (ch.status === 'hero' || ch.status === 'normal') && ch.heroPowerMult > 0 && !ch.villainLevel;
  if (heroRec) {
    const target = ADV.World.byId(world, heroRec.targetId);
    if (target) ADV.Divine.onHeroDefeated(world, ch, target, ADV.World.feeder(world));
  }
  // Campaign §0b #6: everyone who killed or assisted becomes a Villain
  if (wasHero && killer) {
    const ids = [killer.id].concat(ch.__killedByParty || []);
    ADV.Divine.onHeroKilled(world, ch, [...new Set(ids)], ADV.World.feeder(world));
  }

  // Edges from the dead are dropped; edges toward them kept for memory? Drop both.
  world.edges = world.edges.filter(e => e.fromId !== ch.id);

  return claim;
};

// Delegates to the canonical feed (single cap/format authority).
Death.feed = function (world, text, actorIds) {
  ADV.World.feed(world, text, actorIds);
};

// ---- Player death routing (§7) ----------------------------------------------
// Returns {mode:'nepotism', heir} or {mode:'reincarnation'}.
Death.routePlayerDeath = function (world, player, killerId) {
  // Nepotism: eldest surviving child inherits — adult child, or self-sufficient dependent.
  // Player continues as that child with skills, levels, journal, vault, title bonus.
  const heir = ADV.Vault.eldestHeir(world, player);
  if (heir && (player.titleEligible !== false)) {
    return { mode: 'nepotism', heir };
  }
  return { mode: 'reincarnation' };
};

// Build the next-life player character.
Death.makeSuccessor = function (world, rng, player, route) {
  const meta = {
    journal: player.journal,
    skillLevels: Object.assign({}, player.skillLevels),
  };
  // learned entries also persist (§3: the capped set IS the character across lives)
  for (const e of player.perks.concat(player.actives)) {
    meta.skillLevels[e.skillId] = { level: e.level, uses: e.uses };
  }
  if (route.mode === 'nepotism') {
    const h = route.heir;
    let ch;
    if (h.adult) {
      ch = h.ch;
      ch.isPlayer = true;
    } else {
      ch = ADV.Character.matureChild(rng, world, Object.assign({}, h.child, {
        inheritSkills: null, // player heir gets the PLAYER's persistence, below
      }), player.name);
      ch.isPlayer = true;
      ADV.World.addCharacter(world, ch);
      // pending estate from the vault claim
      if (h.child.pendingEstate) {
        const v = ADV.Vault.ensureOwn(world, ch);
        v.gold += h.child.pendingEstate.gold;
        v.items.push(...h.child.pendingEstate.items);
      }
    }
    // The legacy title is the FATHER's, and its buff tracks the father's
    // strength — growing until his death, frozen after. If the player was the
    // father, it froze the moment they died; if the player was the mother,
    // the NPC father's legacy keeps growing on the world clock.
    const father = ADV.World.byId(world, ch.fatherId) || (player.sex === 'm' ? player : null);
    if (father) {
      ch.title = (ch.sex === 'f' ? 'Daughter of ' : 'Son of ') + father.name;
      ADV.Character.applyLegacy(ch, father);
    }
    // Skills, levels, journal survive (§7) — and the learned SET transfers
    ch.journal = Object.assign({}, meta.journal, ch.journal);
    ch.skillLevels = Object.assign({}, meta.skillLevels, ch.skillLevels);
    ch.perkCap = C().PLAYER_PERK_SLOTS; ch.activeCap = C().PLAYER_ACTIVE_SLOTS;
    const fullMeta = Object.assign({}, meta, { skillLevels: ch.skillLevels });
    if (ADV.Save && ADV.Save.loadMeta) {
      const saved = ADV.Save.loadMeta();
      if (saved.lastLifeSkills) fullMeta.lastLifeSkills = saved.lastLifeSkills;
    }
    Death.equipCarriedSkills(ch, fullMeta);
    // Demigod bloodline (§14a)
    if (player.bloodline && player.bloodline.demigod && player.registryId) {
      if (!ch.perks.some(p => p.skillId === 'demigod')) ch.perks.push({ skillId: 'demigod', level: 1, uses: 0 });
      ch.bloodline = { demigod: true };
    }
    // Relationships transfer transformed: parent's friends/enemies recognize the heir (§7)
    for (const e of world.edges.slice()) {
      if (e.toId === player.id) {
        const inherited = Math.round(e.score * 0.6);
        if (Math.abs(inherited) >= 10) {
          ADV.Rel.move(world, e.fromId, ch.id, inherited, e.cause, { decays: e.decays });
        }
      }
    }
    world.playerId = ch.id;
    return ch;
  }
  // Reincarnation: whole roster wiped, new generation, faction standing reset (§7).
  return null; // caller regenerates the world, then applies meta via Death.applyMeta
};

Death.applyMeta = function (player, meta) {
  player.journal = meta.journal || {};
  player.skillLevels = meta.skillLevels || {};
};

Death.extractMeta = function (player) {
  const meta = {
    journal: player.journal,
    skillLevels: Object.assign({}, player.skillLevels),
    // The learned set itself carries into EVERY next life (reincarnation and
    // nepotism alike) — not just its levels. Unique-tier grants never carry.
    lastLifeSkills: { perks: [], actives: [] },
  };
  for (const e of player.perks.concat(player.actives)) {
    const sk = ADV.DATA.SKILLS[e.skillId];
    if (sk && (sk.unique || sk.universal || sk.noSlot)) continue;
    meta.skillLevels[e.skillId] = { level: e.level, uses: e.uses };
    (sk.kind === 'perk' ? meta.lastLifeSkills.perks : meta.lastLifeSkills.actives).push(e.skillId);
  }
  return meta;
};

// Equip a carried skill set onto a fresh-life character at the recorded
// levels. Replaces any equipped non-bloodline skills; whatever the character
// knew before is preserved in skillLevels/journal (nothing is forgotten).
Death.equipCarriedSkills = function (ch, meta) {
  const carried = meta.lastLifeSkills;
  if (!carried || (carried.perks.length + carried.actives.length) === 0) return false;
  for (const e of ch.perks.concat(ch.actives)) {
    const sk = ADV.DATA.SKILLS[e.skillId];
    if (sk && (sk.unique || sk.noSlot)) continue;
    ch.skillLevels[e.skillId] = { level: e.level, uses: e.uses };
    if (ch.journal[e.skillId]) ch.journal[e.skillId].learned = false;
  }
  ch.perks = ch.perks.filter(e => { const sk = ADV.DATA.SKILLS[e.skillId]; return sk && (sk.unique || sk.noSlot); });
  ch.actives = ch.actives.filter(e => { const sk = ADV.DATA.SKILLS[e.skillId]; return sk && (sk.unique || sk.noSlot); });
  for (const [kind, list] of [['perks', carried.perks], ['actives', carried.actives]]) {
    for (const id of list) {
      const rec = meta.skillLevels[id] || { level: 1, uses: 0 };
      ch[kind].push({ skillId: id, level: rec.level, uses: rec.uses });
      ch.journal[id] = Object.assign({ witnessed: false, sawTier: 'basic', eligible: true }, ch.journal[id], { learned: true });
    }
  }
  ch.freeSkillsUsed = ADV.DATA.CONST.FREE_STARTING_SKILLS; // no new free picks in later lives
  return true;
};

ADV.Death = Death;
})();
