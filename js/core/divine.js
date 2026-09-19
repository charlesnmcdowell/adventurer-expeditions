// Forbidden skills & Divine Intervention (§3a): conscription, necromancy,
// post-victory outcomes, heroes, villains, divine quests.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Rel = () => ADV.Rel;

const Divine = {};

function tierIdx(tier) { return { basic: 0, intermediate: 1, advanced: 2 }[tier] || 0; }

Divine.guildNpc = function (world, ch) {
  return !!(ch && !ch.isMonster && !ch.isPlayer && world && ADV.World.byId(world, ch.id));
};

// ---- Post-victory outcomes vs a named NPC (§3a) -----------------------------
// choice: 'kill' | 'knockout' | 'conscript' | 'necromancy'
// The player is immune: a defeated player always dies (handled by caller).
Divine.resolveDefeated = function (world, rng, victor, defeated, choice, feedPush) {
  const out = { choice };
  if (choice === 'knockout') {
    defeated.hospitalizedQuestsLeft = C().KO_HOSPITAL_QUESTS;
    defeated.combatHp = 1;
    if (feedPush) feedPush(`${victor.name} spared ${defeated.name}. ${defeated.name} is hospitalized.`, [victor.id, defeated.id]);
    return out;
  }
  if (choice === 'conscript') {
    const entry = ADV.SkillSys.entryFor(victor, 'conscript');
    if (!entry) return { error: 'no conscript skill' };
    if (defeated.__purifiedAtEnd) return { error: 'their soul is warded — conscription fails' };
    const m = ADV.SkillSys.manifest(victor, entry);
    const cap = C().CONSCRIPT_CAP[tierIdx(m.tier)];
    const dur = m.data.duration || C().CONSCRIPT_DURATION[tierIdx(m.tier)];
    victor.conscriptIds = victor.conscriptIds || [];
    // Cap enforces itself: oldest escapes at Hatred (§3a)
    if (victor.conscriptIds.length >= cap) {
      const oldId = victor.conscriptIds.shift();
      const old = ADV.World.byId(world, oldId);
      if (old) {
        Divine.releaseConscript(world, old, victor, feedPush, true);
      }
    }
    defeated.isConscript = true;
    defeated.conscriptQuestsLeft = dur;
    const fDef = ADV.SkillSys.knownVal(victor, 'followerDef');
    if (fDef) defeated.bonusStats.def = (defeated.bonusStats.def || 0) + fDef;
    defeated.conscriptorId = victor.id;
    defeated.combatHp = ADV.Character.maxHp(defeated);
    defeated.partyId = null; defeated.leaderId = null;
    defeated.wasDowned = false;
    defeated.hasFled = false;
    victor.conscriptIds.push(defeated.id);
    victor.usedForbidden = true;
    // population debt: +3 lives, 3 quests later, hostile to the conscriptor (§3a)
    world.pendingPopulation.push({ dueAtQuest: world.questClock + C().CONSCRIPT_POP_DELAY,
      count: C().CONSCRIPT_POP_ADD, hostileToId: victor.id });
    ADV.SkillSys.recordUse(victor, 'conscript');
    if (feedPush) feedPush(`${victor.name} conscripted ${defeated.name}.`, [victor.id, defeated.id]);
    return out;
  }
  if (choice === 'necromancy') {
    const entry = ADV.SkillSys.entryFor(victor, 'necromancy');
    if (!entry) return { error: 'no necromancy skill' };
    if (ADV.Character && !ADV.Character.isOrganic(defeated)) return { error: 'nothing left to raise' };
    const m = ADV.SkillSys.manifest(victor, entry);
    const cap = C().NECRO_CAP[tierIdx(m.tier)];
    victor.undeadIds = victor.undeadIds || [];
    // Cap: raising past it collapses the oldest into permanent death (§3a)
    if (victor.undeadIds.length >= cap) {
      const oldId = victor.undeadIds.shift();
      const old = ADV.World.byId(world, oldId);
      if (old && old.alive) {
        ADV.Death.finalize(world, old, null, 'decayed');
        if (feedPush) feedPush(`${old.name} crumbled to dust.`, [old.id]);
      }
    }
    defeated.isUndead = true;
    if (ADV.Character.applyNonOrganic) ADV.Character.applyNonOrganic(defeated);
    defeated.undeadQuestsLeft = 0;
    defeated.isQuestThrall = true;
    defeated.risenPower = (m.data && m.data.risenPower) || C().NECRO_STRENGTH[tierIdx(m.tier)] || C().UNDEAD_STAT_MULT;
    defeated.raisedById = victor.id;
    defeated.combatHp = ADV.Character.maxHp(defeated);
    defeated.partyId = null; defeated.leaderId = null;
    victor.undeadIds.push(defeated.id);
    victor.usedForbidden = true;
    victor.necromancyRaises = (victor.necromancyRaises || 0) + 1;
    ADV.SkillSys.recordUse(victor, 'necromancy');
    if (feedPush) feedPush(`${victor.name} raised ${defeated.name}. ${defeated.name === 'She' ? 'She' : defeated.sex === 'f' ? 'She' : 'He'} is gone.`, [victor.id, defeated.id]);
    // Threshold: the fifth raise marks the target (§3a)
    if (victor.necromancyRaises >= C().NECRO_MARK_THRESHOLD && !victor.divineMarked) {
      Divine.mark(world, victor, 'forbidden arts', feedPush);
    }
    return out;
  }
  // kill
  return Divine.killCharacter(world, rng, victor, defeated, feedPush);
};

Divine.killCharacter = function (world, rng, killer, victim, feedPush) {
  ADV.Death.finalize(world, victim, killer ? killer.id : null, 'killed');
  if (feedPush) feedPush(`${victim.name} is dead${killer ? ' — killed by ' + killer.name : ''}.`, killer ? [victim.id, killer.id] : [victim.id]);
  return { choice: 'kill' };
};

// Conscript term ends or cap overflow: leaves at permanent Hatred (§3a).
Divine.releaseConscript = function (world, conscript, master, feedPush, escaped) {
  conscript.isConscript = false;
  conscript.conscriptQuestsLeft = 0;
  conscript.conscriptorId = null;
  if (!conscript.isPlayer) {
    Rel().move(world, conscript.id, master.id, -100, 'murder', { set: true, decays: false });
  }
  if (feedPush) feedPush(escaped
    ? `${conscript.name} escaped ${master.name}'s service. ${conscript.sex === 'f' ? 'She' : 'He'} will not forgive it.`
    : `${conscript.name} is free of ${master.name}, and hates ${master.name === 'you' ? 'you' : 'them'} for it.`,
    [conscript.id, master.id]);
};

// ---- Divine Intervention (§3a) ----------------------------------------------
Divine.mark = function (world, target, reason, feedPush) {
  if (target.divineMarked) return;
  target.divineMarked = true;
  target.divineMarkQuest = world.questClock;
  target.divineReason = reason;
  if (feedPush) feedPush(`The world has taken notice of ${target.isPlayer ? 'you' : target.name}.`, [target.id]);
};

// Check the hatred trigger for everyone. Called each world tick.
Divine.checkTriggers = function (world, feedPush) {
  for (const ch of world.characters) {
    if (!ch.alive || ch.divineMarked || ch.isMonster) continue;
    if (Rel().hatredEdgeCount(world, ch.id) >= C().HATRED_EDGE_THRESHOLD) {
      Divine.mark(world, ch, 'universally hated', feedPush);
    }
  }
};

// Hero eligibility (campaign §0b #4): living, not criminal-aligned, fewer
// than 10 Hatred edges, never touched a forbidden skill, not a Villain.
Divine.heroEligible = function (world, c, targetId) {
  if (!c.alive || c.isMonster || c.id === targetId) return false;
  if (c.status !== 'normal' || c.isConscript || c.isUndead || c.registryId || c.campaign) return false;
  if (c.factionStanding && c.factionStanding.criminal >= 30) return false;
  if (Rel().hatredEdgeCount(world, c.id) >= C().HATRED_EDGE_THRESHOLD) return false;
  if (c.usedForbidden) return false;
  return true;
};

// Summon heroes for marked targets whose delay has elapsed. A target owed
// several heroes (after hero deaths) gets them one per tick until the debt
// is paid; if nobody qualifies, no hero is named (§0b #4).
Divine.assignHeroes = function (world, rng, feedPush) {
  for (const target of world.characters) {
    if (!target.alive || !target.divineMarked) continue;
    const delay = target.status === 'villain' ? C().HERO_KILL_REPRIEVE : C().DIVINE_DELAY_QUESTS;
    if (world.questClock - target.divineMarkQuest < delay) continue;
    if (target.heroReprieveUntil && world.questClock < target.heroReprieveUntil) continue;
    const hunters = world.activeHeroes.filter(h => h.targetId === target.id).length;
    const owed = Math.max(1, target.heroesOwed || 1);
    if (hunters >= owed) continue;
    // Idle heroes answer immediately (§3a); otherwise name a new one.
    const idleHero = world.characters.find(c => c.alive && c.status === 'hero' && !c.heroTargetId && c.id !== target.id && !c.campaign);
    const powerMult = target.nextHeroPower || C().HERO_POWER_BASE;
    if (idleHero) {
      Divine.acceptDivineQuest(world, idleHero, target, powerMult, feedPush);
      continue;
    }
    const pool = world.characters.filter(c => Divine.heroEligible(world, c, target.id) &&
      !(world.divineOffers || []).some(o => o.candidateId === c.id));
    if (!pool.length) { if (feedPush && !target.__noHeroNoted) { target.__noHeroNoted = true; feedPush('The world looks for a champion and finds none clean enough.', [target.id]); } continue; }
    const candidate = rng.pick(pool);
    world.divineOffers = world.divineOffers || [];
    if (candidate.isPlayer) {
      const already = world.divineOffers.some(o => o.candidateId === candidate.id && o.targetId === target.id);
      if (!already && (!target.lastPlayerOfferQuest || world.questClock - target.lastPlayerOfferQuest >= C().DIVINE_REOFFER_AFTER)) {
        world.divineOffers.push({ candidateId: candidate.id, targetId: target.id, powerMult, offeredAt: world.questClock });
        target.lastPlayerOfferQuest = world.questClock;
        if (feedPush) feedPush(`The world offers you a divine quest: end ${target.name}.`, [target.id]);
      }
    } else {
      // NPCs do not refuse divine quests (§3a)
      Divine.acceptDivineQuest(world, candidate, target, powerMult, feedPush);
    }
  }
};

Divine.acceptDivineQuest = function (world, hero, target, powerMult, feedPush) {
  hero.status = 'hero';
  hero.grantsHeld = true;
  hero.heroTargetId = target.id;
  hero.heroPowerMult = powerMult;
  hero.divineInvitesWindow = [];
  // grants occupy no slots (§3a)
  if (!hero.actives.some(a => a.skillId === 'true_rest')) hero.actives.push({ skillId: 'true_rest', level: 1, uses: 0 });
  if (!hero.perks.some(p => p.skillId === 'hero')) hero.perks.push({ skillId: 'hero', level: 1, uses: 0 });
  // heroes leave the economy: quit any party
  const p = ADV.Party.of(world, hero);
  if (p) {
    if (p.leaderId === hero.id) ADV.Party.disband(world, p);
    else ADV.Party.removeMember(world, p, hero.id);
  }
  world.activeHeroes.push({ heroId: hero.id, targetId: target.id, powerMultiplier: powerMult });
  // remove the pending offer if any
  world.divineOffers = (world.divineOffers || []).filter(o => o.targetId !== target.id);
  if (ADV.Character.syncNpcHeroFloor) ADV.Character.syncNpcHeroFloor(world);
  if (feedPush) feedPush(`${hero.isPlayer ? 'You have' : hero.name + ' has'} been made a hero. The target: ${target.name}.`, [hero.id, target.id]);
  // Help requests: a hero above Neutral with someone sends one per divine quest (§3a/§6)
  Divine.sendHeroHelpRequests(world, hero, target, feedPush);
};

Divine.sendHeroHelpRequests = function (world, hero, target, feedPush) {
  const pid = world.playerId;
  if (hero.isPlayer) return;
  if (target.id === pid) return; // if the recipient is the target, no request (§3a)
  if (ADV.World && ADV.World.rodeWithPlayer && !ADV.World.rodeWithPlayer(world, hero)) return;
  if ((world.pendingRescues || []).length || (world.pendingHeroInvites || []).length) return;
  if (ADV.World && ADV.World.playerContactReady && !ADV.World.playerContactReady(world, 'lastPlayerHelpAt')) return;
  const score = Rel().score(world, hero.id, pid);
  if (score > 0 || hero.partnerId === pid) {
    world.pendingHeroInvites = world.pendingHeroInvites || [];
    world.pendingHeroInvites.push({ heroId: hero.id, targetId: target.id, expiresAtQuest: world.questClock + C().RESCUE_EXPIRES_IN });
    if (ADV.World && ADV.World.markPlayerContact) ADV.World.markPlayerContact(world, 'lastPlayerHelpAt');
    if (feedPush) feedPush(`${hero.name} asks for your help against ${target.name}.`, [hero.id, target.id]);
  }
};

// Hero defeated (campaign §0b #2/#3): TWO heroes are named per hero death,
// each at twice the previous bonus, after the standard 3-quest reprieve.
Divine.onHeroDefeated = function (world, hero, target, feedPush) {
  world.activeHeroes = world.activeHeroes.filter(h => h.heroId !== hero.id);
  target.nextHeroPower = Math.max(target.nextHeroPower || C().HERO_POWER_BASE, hero.heroPowerMult || C().HERO_POWER_BASE) * C().HERO_ESCALATION;
  target.heroesOwed = (target.heroesOwed || 1) * 2;
  target.heroReprieveUntil = world.questClock + C().HERO_KILL_REPRIEVE;
  if (feedPush) feedPush(`The hero ${hero.name} has fallen. Two will come, each twice as strong.`, [hero.id, target.id]);
};

// Anyone who kills a hero, or assists, becomes a Villain and takes the dead
// hero's grants permanently (§0b #6-#8). Villain level = heroes killed.
Divine.onHeroKilled = function (world, hero, killerIds, feedPush) {
  for (const id of killerIds) {
    const k = ADV.World.byId(world, id);
    if (!k || !k.alive || k.isMonster || k.campaign) continue;
    k.status = 'villain';
    if (ADV.Character.syncNpcHeroFloor) ADV.Character.syncNpcHeroFloor(world);
    k.villainLevel = (k.villainLevel || 0) + 1;
    k.heroPowerMult = Math.max(k.heroPowerMult || 0, hero.heroPowerMult || C().HERO_POWER_BASE);
    k.grantsHeld = true;
    if (!k.actives.some(a => a.skillId === 'true_rest')) k.actives.push({ skillId: 'true_rest', level: 1, uses: 0 });
    if (!k.perks.some(p => p.skillId === 'hero')) k.perks.push({ skillId: 'hero', level: 1, uses: 0 });
    k.divineMarked = true; k.divineMarkQuest = world.questClock; k.divineReason = 'hero-killer';
    k.heroesOwed = Math.max(k.heroesOwed || 0, 2);
    k.nextHeroPower = (hero.heroPowerMult || C().HERO_POWER_BASE) * C().HERO_ESCALATION;
    k.heroReprieveUntil = world.questClock + C().HERO_KILL_REPRIEVE;
    if (feedPush) feedPush(`${k.isPlayer ? 'You are' : k.name + ' is'} a Villain now — level ${k.villainLevel}. The world will answer.`, [k.id]);
  }
};

// Target dies: grants are PERMANENT (§0b #1) — the hero goes idle, still
// empowered, still barred from ordinary work, waiting for the next name.
Divine.onTargetDead = function (world, target, feedPush) {
  for (const h of world.activeHeroes.filter(x => x.targetId === target.id)) {
    const hero = ADV.World.byId(world, h.heroId);
    if (hero && hero.alive && hero.status === 'hero') {
      hero.heroTargetId = null;
      if (feedPush) feedPush(`${hero.isPlayer ? 'Your' : hero.name + "'s"} divine quest is complete. The strength stays.`, [hero.id]);
    }
  }
  world.activeHeroes = world.activeHeroes.filter(x => x.targetId !== target.id);
};

Divine.revokeGrants = function (world, hero) {
  hero.status = 'normal';
  hero.grantsHeld = false;
  hero.heroTargetId = null;
  hero.heroPowerMult = 0;
  hero.actives = hero.actives.filter(a => a.skillId !== 'true_rest');
  hero.perks = hero.perks.filter(p => p.skillId !== 'hero');
};

// Sparing someone above Neutral (ever): Villain — keeps the grants forever,
// becomes a permanent target (§3a).
Divine.spare = function (world, hero, target, feedPush) {
  hero.status = 'villain';
  if (ADV.Character.syncNpcHeroFloor) ADV.Character.syncNpcHeroFloor(world);
  hero.heroTargetId = null;
  // keeps True Rest + Hero permanently; heroPowerMult stays
  world.activeHeroes = world.activeHeroes.filter(h => h.heroId !== hero.id);
  Divine.mark(world, hero, 'villainy', feedPush);
  hero.divineMarkQuest = world.questClock; // their own countdown begins
  // the spared target remains hunted — a new hero is assigned immediately (§3a)
  if (feedPush) feedPush(`${hero.isPlayer ? 'You' : hero.name} spared ${target.name}. The world does not forgive it.`, [hero.id, target.id]);
};

// A hero killing someone the world never named: Villain by vendetta (§3a).
Divine.vendettaKill = function (world, hero, feedPush) {
  if (hero.status !== 'hero') return;
  hero.status = 'villain';
  if (ADV.Character.syncNpcHeroFloor) ADV.Character.syncNpcHeroFloor(world);
  hero.heroTargetId = null;
  world.activeHeroes = world.activeHeroes.filter(h => h.heroId !== hero.id);
  Divine.mark(world, hero, 'villainy', feedPush);
  if (feedPush) feedPush(`${hero.isPlayer ? 'You' : hero.name} spent divine power on a private score.`, [hero.id]);
};

// Follower upkeep on the world clock: terms tick down at quest resolution.
Divine.tickFollowers = function (world, feedPush) {
  for (const ch of world.characters) {
    if (!ch.alive) continue;
    if (ch.isConscript && ch.conscriptQuestsLeft > 0) {
      ch.conscriptQuestsLeft--;
      if (ch.conscriptQuestsLeft <= 0) {
        const master = ADV.World.byId(world, ch.conscriptorId);
        if (master) {
          master.conscriptIds = (master.conscriptIds || []).filter(id => id !== ch.id);
          Divine.releaseConscript(world, ch, master, feedPush, false);
        }
      }
    }
    if (ch.isUndead && ch.undeadQuestsLeft > 0) {
      ch.undeadQuestsLeft--;
      if (ch.undeadQuestsLeft <= 0) {
        const master = ADV.World.byId(world, ch.raisedById);
        if (master) master.undeadIds = (master.undeadIds || []).filter(id => id !== ch.id);
        ADV.Death.finalize(world, ch, null, 'decayed');
        if (feedPush) feedPush(`${ch.name} decayed to dust.`, [ch.id]);
      }
    }
    if (ch.hospitalizedQuestsLeft > 0) ch.hospitalizedQuestsLeft--;
  }
};

ADV.Divine = Divine;
})();
