// Adventurer: Expeditions — one encounter of the demo as a pure, steppable
// simulation. No Phaser, no DOM: the browser scene and the headless tests drive
// the same object. Every outcome comes from ADV.Combat; this file only decides
// which legal action Hiro takes next (automatic policy, or the queued Finisher
// request) and hands the resulting st.events slice back to whoever asked.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const Enc = X.Encounter = {};

// ---------------------------------------------------------------- characters
Enc.makeHero = function (rng, run) {
  const ch = A.Character.makeRegistry(rng, X.hero.registryId, 'Hiro', false);
  // A mortal body: undo the registry statMult, apply the demo one.
  const def = A.DATA.REGISTRY[X.hero.registryId];
  for (const k of ['hp', 'atk', 'def', 'spd']) {
    const was = def.statMult && def.statMult[k] != null ? def.statMult[k] : 1;
    const base = Math.round(ch.stats[k] / was);
    ch.stats[k] = Math.round(base * (X.hero.statMult[k] || 1));
  }
  ch.perks = ch.perks.filter(p => X.hero.perks.includes(p.skillId));
  // The riposte is a hidden active so Combat.riposte can manifest it.
  if (!ch.actives.some(a => a.skillId === X.riposte.id)) ch.actives.push({ skillId: X.riposte.id, level: 1, uses: 0, hidden: true });
  ch.expedition = run;               // the shim reads run.levels
  Enc.syncKit(ch, run);
  ch.inventory = ch.inventory || { gold: 0, items: [] };
  // Arcade (Hiro, 2026-09-27): health carries through the whole run. The
  // engine opens a unit at ch.combatHp when it is set, so a run that has
  // remembered Hiro's health hands it to the next fight here.
  const firstQuest = !!(run && X.tutorialHeals && !(run.questsDone && run.questsDone.length));
  if (run && Number.isFinite(run.hp) && !firstQuest) ch.combatHp = Math.max(1, Math.floor(run.hp));
  return ch;
};

// Remember Hiro's health on the run, from a live unit or a character. Called
// after every fight and before every scene change, so a reload lands on the
// same health. `hpMax` is what the inn needs to draw the bar and refuse Rest.
Enc.rememberHp = function (run, unit) {
  if (!run || !unit) return run;
  const chp = unit.chp != null ? unit.chp : unit.combatHp;
  const max = unit.maxHp != null ? unit.maxHp : run.hpMax;
  if (Number.isFinite(chp)) run.hp = Math.max(0, Math.floor(chp));
  if (Number.isFinite(max)) run.hpMax = Math.max(1, Math.floor(max));
  return run;
};
Enc.atFullHp = run => !run || run.hp == null || run.hpMax == null || run.hp >= run.hpMax;
// Rest at the inn (X.rest): a full heal for points, dearer every time.
Enc.canRest = function (run) {
  if (!run || Enc.atFullHp(run)) return { ok: false, reason: 'full' };
  const cost = X.restCost(run);
  if ((run.score || 0) < cost) return { ok: false, reason: 'score', cost };
  return { ok: true, cost };
};
Enc.rest = function (run) {
  const c = Enc.canRest(run);
  if (!c.ok) return c;
  run.score -= c.cost; run.rests = (run.rests || 0) + 1; run.hp = run.hpMax;
  return { ok: true, cost: c.cost, score: run.score, rests: run.rests };
};

// Hiro's live kit follows the run: locked skills are not in it at all (the auto
// policy cannot use them, the engine cannot target with them); a purchase adds
// the skill at once so it works in the very next action, mid-quest included.
Enc.syncKit = function (ch, run) {
  const owned = id => Enc.owned(run, id);
  const maxLevel = A.DATA.CONST.TIER_THRESHOLDS.advanced;
  for (const id of Object.keys(X.skills)) {
    const has = ch.actives.some(a => a.skillId === id);
    if (owned(id) && !has) ch.actives.push({ skillId: id, level: maxLevel, uses: 0 });
    if (!owned(id) && has) ch.actives = ch.actives.filter(a => a.skillId !== id);
  }
  ch.autoOrder = X.hero.autoOrder.filter(owned).map(skillId => ({ skillId, off: false }));
  ch.autoAdopted = true;
  ch.autoRepeat = null; ch.autoAttack = false;
  return ch;
};

Enc.makeEnemy = function (rng, key, scale) {
  const e = X.enemies[key];
  if (!e) throw new Error('Expedition: unknown enemy ' + key);
  const ch = A.Character.makeEnemy(rng, e.base, { level: e.level });
  ch.expeditionKey = key;
  if (e.artIdentity) ch.expeditionArtIdentity = e.artIdentity;
  if (e.actives) ch.actives = ch.actives.filter(a => e.actives.includes(a.skillId));
  if (e.statMult) for (const k of ['hp', 'atk', 'def', 'spd']) if (e.statMult[k] != null) ch.stats[k] = Math.round(ch.stats[k] * e.statMult[k]);
  // The arcade's base tuning (X.monsterMult), then the loop scale on top of it.
  const mult = X.monsterMult && X.monsterMult[e.boss ? 'boss' : 'regular'];
  if (mult) for (const k of ['hp', 'atk']) if (mult[k] != null && mult[k] !== 1) ch.stats[k] = Math.round(ch.stats[k] * mult[k]);
  // Repeat scaling (Campaign.scaleFor): a cleared quest comes back harder.
  if (scale && scale !== 1) { ch.stats.hp = Math.round(ch.stats.hp * scale); ch.stats.atk = Math.round(ch.stats.atk * scale); }
  if (e.perks) ch.perks = ch.perks.filter(p => e.perks.includes(p.skillId));
  if (e.name) ch.name = e.name;
  if (e.boss != null) { ch.boss = !!e.boss; ch.miniboss = !!e.boss; }
  if (e.hitStatus) ch.hitStatus = e.hitStatus;
  if (e.tint) ch.expeditionTint = e.tint;
  if (e.human) Enc.humanize(ch, e.human, key);
  return ch;
};

// A human foe or rival composes from the synced part sheets: fixed sex, head
// and outfit (the outfit is the website's gear set, so it floors matching skills).
Enc.humanize = function (ch, look, seedTag) {
  ch.sex = look.sex; ch.appearance = Object.assign({}, ch.appearance || {}, { head: look.head });
  ch.equippedSet = look.set; ch.portraitSeed = A.hashStr('xp:' + seedTag + ':' + look.head) >>> 0;
  ch.expeditionHuman = true;
  return ch;
};

// A rival party member as a foe: a player-shaped character on the enemy side.
Enc.makeRival = function (rng, rivalKey, m, i) {
  const ch = A.Character.makePlayer(rng, { name: m.name, sex: m.sex, portraitSeed: A.hashStr('rival:' + rivalKey + ':' + m.name) >>> 0, portraitSlot: 1, appearance: { head: m.head }, startingSkills: [] });
  ch.isPlayer = false; ch.freeSkillsUsed = 3; ch.archetypeInclination = [m.arch];
  const st = Object.assign({ hp: 1.25, atk: 1.0, def: 1.0, spd: 1.1 }, m.stats || {});
  for (const k of ['hp', 'atk', 'def', 'spd']) ch.stats[k] = Math.round(ch.stats[k] * st[k]);
  const lvl = A.DATA.CONST.TIER_THRESHOLDS.intermediate;
  ch.actives = m.skills.map(skillId => ({ skillId, level: lvl, uses: 0 }));
  ch.perks = (m.perks || []).map(skillId => ({ skillId, level: lvl, uses: 0 }));
  ch.autoOrder = m.skills.map(skillId => ({ skillId, off: false })).concat([{ skillId: 'basic_attack', off: false }]); ch.autoAdopted = true;
  Enc.humanize(ch, { sex: m.sex, head: m.head, set: m.set }, 'rival:' + rivalKey + ':' + i);
  ch.expeditionKey = 'rival:' + rivalKey; ch.rivalKey = rivalKey; ch.rivalIndex = i;
  ch.level = 7 + i;
  if (m.leader) ch.boss = false;
  return ch;
};

// ---------------------------------------------------------------- encounter
// run: { levels:{skill:level}, gold, wave } — shared with the HUD/save.
Enc.create = function (opts) {
  const encDef = typeof opts.encounter === 'string' ? ((X.encounterDefs && X.encounterDefs[opts.encounter]) || X.encounters.find(e => e.id === opts.encounter)) : opts.encounter;
  if (!encDef) throw new Error('Expedition: unknown encounter');
  const seed = (opts.seed == null ? 1 : opts.seed) >>> 0;
  const rng = new A.RNG(seed);
  const run = opts.run || Enc.freshRun();
  const nextId = A.Character.peekNextId ? A.Character.peekNextId() : null;
  let hero, foes;
  const allies = opts.allies || [];
  try {
    hero = opts.hero || Enc.makeHero(rng, run);
    if (Enc.isHiro(hero)) hero.expedition = run;      // the shim wraps Hiro alone
    const scale = opts.scale || 1;
    // A pack of bosses (the loop rules) shares its strength: X.bossShare.
    const bossCount = encDef.rival ? 0 : encDef.enemies.filter(k => X.enemies[k] && X.enemies[k].boss).length;
    const share = (X.bossShare && X.bossShare[bossCount]) || 1;
    foes = encDef.rival ? X.Campaign.rival(encDef.rival).members.map((m, i) => Enc.makeRival(rng, encDef.rival, m, i))
                        : encDef.enemies.map(k => Enc.makeEnemy(rng, k, X.enemies[k] && X.enemies[k].boss ? scale * share : scale));
  } finally { if (nextId != null && A.Character.resetIds) A.Character.resetIds(nextId); }
  for (const c of allies) { c.alive = true; }
  if (Enc.isHiro(hero)) Enc.syncKit(hero, run);
  const st = A.Combat.create([hero].concat(allies), foes, { rng: new A.RNG((seed * 2654435761 + 7) >>> 0), context: 'quest', questTier: 1 });
  const enc = {
    id: encDef.id, def: encDef, seed, run, st, hero, allies,
    heroUid: st.units.find(u => u.side === 'a' && u.ch === hero).uid,
    cursor: st.events.length,
    request: null,             // { skillId:'finisher', at:turnIdx }
    holdOff: 0,                // hero turns the auto policy must leave Finisher alone
    heroTurns: 0, steps: 0,
    log: [],
  };
  return enc;
};

Enc.freshRun = function () {
  const levels = {};
  for (const id of Object.keys(X.skills)) levels[id] = 1;          // arcade: everything owned, one level
  return { levels, score: 0, loop: 1, rests: 0, wave: 0, awarded: [], tutorial: {} };
};

Enc.heroUnit = enc => enc.st.units.find(u => u.uid === enc.heroUid);
Enc.isHiro = ch => !!ch && ch.registryId === X.hero.registryId;
// The kit the HUD shows and the request path accepts: Hiro's three tappable
// skills, or a picked hero's actives + perks.
Enc.kit = function (hero) {
  if (Enc.isHiro(hero)) return { actives: X.tappable.slice(), perks: [], hiro: true };
  // Any other tappable character (none in this slice; recruits auto-fight).
  return { actives: hero.actives.filter(a => !a.hidden && a.skillId !== 'basic_attack').slice(0, 3).map(a => a.skillId), perks: hero.perks.slice(0, 3).map(p => p.skillId), hiro: false };
};
Enc.foes = enc => A.Combat.living(enc.st, 'b');
Enc.over = enc => !!enc.st.over;
Enc.won = enc => !!enc.st.over && Enc.foes(enc).length === 0 && A.Combat.living(enc.st, 'a').length > 0;
Enc.lost = enc => !!enc.st.over && !Enc.won(enc);

// ---------------------------------------------------------------- skill requests
// Any of the four signature skills can be requested from its mini icon. A
// request is honoured at Hiro's next action boundary if the skill is still
// usable then; it never adds a turn, never bypasses cooldown or targeting.
Enc.skillState = function (enc, skillId) {
  const u = Enc.heroUnit(enc);
  if (Enc.isHiro(enc.hero) && X.purchasable.includes(skillId) && !(enc.run.levels[skillId] > 0)) return { ready: false, reason: 'locked' };
  if (!enc.hero.actives.some(a => a.skillId === skillId)) return { ready: false, reason: 'locked' };
  if (!u || u.downed || enc.st.over) return { ready: false, reason: 'over' };
  // Recovery is wall-clock now that skills fire between turns (Hiro,
  // 2026-09-22). The engine's own counter is left at zero in X.skills, so this
  // is the only gate; `left` is seconds for a player and `leftMs` drives the
  // HUD's wedge so it drains smoothly instead of stepping once per turn.
  const leftMs = Enc.cooldownLeftMs(enc, skillId);
  if (leftMs > 0) return { ready: false, reason: 'cooldown', leftMs, left: Math.ceil(leftMs / 1000) };
  let pool = A.Combat.validTargets(enc.st, u, skillId, false) || [];
  // Each target is judged against its OWN finishing line (Hiro, 2026-09-22:
  // "keep bosses at 25% and make the changes to fix this bug"). The engine's
  // pool uses the ordinary line for everyone, but a boss can only be executed
  // at or under X.finisherThresholds.boss — Enc.bossExecutable unmasks it no
  // earlier. So a boss between 25 % and 50 % used to sit in the pool: the button
  // glowed, the Finisher fired, dealt ~22 damage, killed nothing and played no
  // finishing move; and in a mixed wave threat targeting often chose the boss
  // over a wolf it could have finished. Dropping such a boss here fixes the
  // button, the targeting and the animation at once.
  if (skillId === 'finisher') {
    const bossLine = (X.finisherThresholds && X.finisherThresholds.boss) || 0.25;
    pool = pool.filter(t => !(t.ch && t.ch.boss) || (t.chp / t.maxHp) <= bossLine + 1e-9);
  }
  if (!pool.length) return { ready: false, reason: 'no_target' };
  return { ready: true, pool };
};
Enc.skillStates = function (enc) {
  const out = {};
  for (const id of Enc.kit(enc.hero).actives) out[id] = Enc.skillState(enc, id);
  return out;
};
Enc.finisherState = enc => Enc.skillState(enc, 'finisher');

Enc.requestSkill = function (enc, skillId) {
  if (!A.DATA.SKILLS[skillId]) return { ok: false, reason: 'unknown' };
  const s = Enc.skillState(enc, skillId);
  if (!s.ready) return { ok: false, reason: s.reason, left: s.left };
  if (enc.request) {
    if (enc.request.skillId === skillId) return { ok: true, queued: true, duplicate: true };
    enc.request = { skillId, at: enc.st.turnIdx };          // the newest tap wins; still one request
    return { ok: true, queued: true, replaced: true };
  }
  enc.request = { skillId, at: enc.st.turnIdx };
  return { ok: true, queued: true };
};
Enc.requestFinisher = enc => Enc.requestSkill(enc, 'finisher');

Enc.clearRequest = function (enc) { enc.request = null; };

// ------------------------------------------------- recovery, on a clock
// Kept on the encounter rather than the unit, because the shared engine owns
// `unit.cooldowns` and counts it in rounds. Nothing here touches js/core.
Enc.cooldownLeftMs = function (enc, skillId) {
  const until = enc.cool && enc.cool[skillId];
  if (!until) return 0;
  return Math.max(0, until - X.now());
};
Enc.cooldownTotalMs = function (enc, skillId) {
  return X.cooldownMsFor(skillId, (enc.run && enc.run.levels && enc.run.levels[skillId]) || 1);
};
// Called for every skill the hero actually resolves, whichever path fired it.
Enc.noteCast = function (enc, skillId) {
  const ms = Enc.cooldownTotalMs(enc, skillId);
  if (!ms) return;
  enc.cool = enc.cool || {};
  enc.cool[skillId] = X.now() + ms;
};

// ------------------------------------------------- casting between turns
// A tap fires as soon as the scene can show it, whoever's turn it is, and costs
// nobody a turn: this commits the action and deliberately does NOT call
// A.Combat.advance (Hiro, 2026-09-22 — "it happens regardless of turn count
// because that feels better to the player ... it'll also add more player agency
// since the skill usage doesn't count as a turn"). Verified against the shared
// engine before building: an out-of-turn act leaves the current turn and the
// round exactly where they were.
Enc.castNow = function (enc) {
  const st = enc.st;
  if (st.over || !enc.request) return null;
  const u = Enc.heroUnit(enc);
  if (!u || u.downed) { enc.request = null; return null; }
  const skillId = enc.request.skillId;
  const s = Enc.skillState(enc, skillId);
  if (!s.ready) {
    // Wait for the window rather than discarding the tap; the same grace the
    // turn path uses, so a cast held behind an animation is not lost.
    const transient = s.reason === 'no_target' || s.reason === 'cooldown';
    enc.request.waited = (enc.request.waited || 0) + 1;
    if (transient && enc.request.waited <= REQUEST_GRACE * 2) enc.log.push({ t: 'requestWaiting', reason: s.reason, skillId, waited: enc.request.waited });
    else { enc.log.push({ t: 'requestDropped', reason: s.reason, skillId }); enc.request = null; }
    return null;
  }
  enc.request = null;
  const from = st.events.length;
  const hostile = s.pool[0] && s.pool[0].side !== u.side;
  const tgt = hostile ? (A.Combat.threatTargets(st, u, s.pool)[0] || s.pool[0]) : (s.pool.find(x => x.uid === u.uid) || s.pool[0]);
  const choice = { action: { skillId, isAttack: false, pool: s.pool }, tgt, how: 'cast' };
  const unmask = Enc.bossExecutable(enc, choice);
  if (unmask) { unmask.ch.boss = false; enc.log.push({ t: 'bossExecutable', uid: unmask.uid }); }
  let res = null;
  try { res = commit(st, u, choice); } finally { if (unmask) unmask.ch.boss = true; }
  if (!res || res.ok === false) {
    enc.log.push({ t: 'castFailed', skillId, reason: res && res.error });
    return null;
  }
  Enc.noteCast(enc, skillId);
  enc.casts = (enc.casts || 0) + 1;
  const events = st.events.slice(from);
  enc.cursor = st.events.length;
  return { over: !!st.over, actor: u.uid, hero: true, cast: true, choice, events };
};

// ---------------------------------------------------------------- stepping
// Manual mode (X.manualSkills): the automatic policy may only use Katana Slash;
// every purchased skill fires from a tap (Enc.requestSkill) and nothing else.
Enc.autoAllowed = skillId => !X.manualSkills || skillId === 'katana_slash';
function pickAuto(st, u, excludeFinisher) {
  const saved = u.ch.autoOrder;
  u.ch.autoOrder = saved.filter(x => Enc.autoAllowed(x.skillId) && !(excludeFinisher && x.skillId === 'finisher'));
  let ready = null;
  try { ready = A.Combat.autoReadyAction(st, u); } finally { u.ch.autoOrder = saved; }
  if (ready) return { action: ready.action, tgt: ready.tgt, how: 'auto' };
  // Nothing in the rotation is usable: the universal attack, or a hold.
  const pool = A.Combat.validTargets(st, u, 'basic_attack', false) || [];
  if (pool.length) {
    const tgt = A.Combat.threatTargets(st, u, pool)[0] || pool[0];
    return { action: { skillId: 'basic_attack', isAttack: true, pool }, tgt, how: 'basic' };
  }
  return { action: { kind: 'hold' }, tgt: null, how: 'hold' };
}

// How many of Hiro's turns a queued tap waits for its window to come back.
// Hiro, 2026-09-21: "I hit finisher and sometimes he does not do the finisher
// when the button is glowing ... I think it's stuck playing out previous
// actions like katana slash." He was right about the symptom and close on the
// cause. The tap was queued and then revalidated at the moment Hiro acted; if
// the window had closed in between — the wounded enemy died to a bleed tick, or
// an ally finished it, which is easy to miss during a long painted animation —
// the request was thrown away without a word and the automatic Katana Slash ran
// instead. A tap is an instruction, so it now waits for its moment instead of
// being discarded, and says so if it never comes.
const REQUEST_GRACE = 2;

function heroAction(enc, u) {
  const st = enc.st;
  // A queued request is revalidated at the boundary it fires on.
  if (enc.request) {
    const skillId = enc.request.skillId;
    const s = Enc.skillState(enc, skillId);
    if (s.ready) {
      enc.request = null;
      const hostile = s.pool[0] && s.pool[0].side !== u.side;
      const tgt = hostile ? (A.Combat.threatTargets(st, u, s.pool)[0] || s.pool[0]) : (s.pool.find(x => x.uid === u.uid) || s.pool[0]);
      return { action: { skillId, isAttack: false, pool: s.pool }, tgt, how: 'request' };
    }
    // Not ready *yet*. 'no_target' and 'cooldown' pass — a target can drop back
    // under the line, a cooldown ends. 'locked' and 'over' never will.
    const transient = s.reason === 'no_target' || s.reason === 'cooldown';
    enc.request.waited = (enc.request.waited || 0) + 1;
    if (transient && enc.request.waited <= REQUEST_GRACE) {
      enc.log.push({ t: 'requestWaiting', reason: s.reason, skillId, waited: enc.request.waited });
    } else {
      enc.log.push({ t: 'requestDropped', reason: s.reason, skillId });
      enc.request = null;
    }
  }
  const fs = Enc.finisherState(enc);
  if (fs.ready && enc.holdOff > 0) { enc.holdOff--; return pickAuto(st, u, true); }
  return pickAuto(st, u, false);
}

function commit(st, u, choice) {
  if (choice.action.kind === 'hold') return A.Combat.act(st, u, { kind: 'hold' });
  const a = choice.action;
  const action = a.isAttack ? { kind: 'attack', targetUid: choice.tgt.uid }
                            : { kind: 'skill', skillId: a.skillId, targetUid: choice.tgt ? choice.tgt.uid : u.uid, offensiveMode: !!a.off };
  return A.Combat.act(st, u, action);
}

// Who acts next, without acting. Round-boundary ticks (Bleed/Poison) happen
// here, so the events it returns must be presented before the next step.
Enc.peek = function (enc) {
  const st = enc.st;
  const from = st.events.length;
  if (st.over) return { over: true, events: [] };
  const t = A.Combat.currentTurn(st);
  const events = st.events.slice(from);
  if (!t) return { over: true, events };
  const hero = t.unit.uid === enc.heroUid;
  return { over: false, hero, actor: t.unit.uid, events, finisher: hero ? Enc.finisherState(enc) : null, skills: hero ? Enc.skillStates(enc) : null };
};

// One action (hero or enemy). Returns the events it produced, in order.
Enc.step = function (enc) {
  const st = enc.st;
  if (st.over) return { over: true, events: [] };
  const from = st.events.length;
  const t = A.Combat.currentTurn(st);
  if (!t) { st.over = st.over || true; return { over: true, events: st.events.slice(from) }; }
  const u = t.unit;
  let choice = null, res = null;
  if (t.isPlayer || u.uid === enc.heroUid) {
    enc.heroTurns++;
    // The hold-off window opens the first time Finisher becomes usable.
    if (enc.holdOffArmed !== true && Enc.finisherState(enc).ready) { enc.holdOff = X.finisherHoldOffTurns; enc.holdOffArmed = true; }
    choice = heroAction(enc, u);
    const unmask = Enc.bossExecutable(enc, choice);              // a boss under the boss line is executable for this resolution only
    if (unmask) { unmask.ch.boss = false; enc.log.push({ t: 'bossExecutable', uid: unmask.uid }); }
    try { res = commit(st, u, choice); } finally { if (unmask) unmask.ch.boss = true; }
    if (res && res.ok !== false && choice.action && choice.action.skillId) Enc.noteCast(enc, choice.action.skillId);
    if (res && res.ok === false) { A.Combat.act(st, u, { kind: 'hold' }); choice = { action: { kind: 'hold' }, how: 'hold', error: res.error }; }
  } else {
    A.Combat.aiTakeTurn(st, u);
  }
  A.Combat.advance(st);
  enc.steps++;
  const events = st.events.slice(from);
  enc.cursor = st.events.length;
  if (st.over && enc.request) { enc.log.push({ t: 'requestDropped', reason: 'over' }); enc.request = null; }
  return { over: !!st.over, actor: u.uid, hero: u.uid === enc.heroUid, choice, events };
};

// Boss execution (GDD §7, Hiro round 3). The shared engine executes an enemy
// under the skill's threshold but exempts bosses outright (`!t.ch.boss`), and
// js/core is never edited here. So when — and only when — a boss is already at
// or under X.finisherThresholds.boss and the Finisher is what is being spent on
// it, the layer lifts that exemption for the length of the resolution and lets
// the engine run its own execute path: the same event, the same death
// bookkeeping, the same heal. Anything above the line is left as a heavy hit.
Enc.bossExecutable = function (enc, choice) {
  if (!choice || !choice.action || choice.action.skillId !== 'finisher' || !choice.tgt) return null;
  const t = choice.tgt, pct = (X.finisherThresholds && X.finisherThresholds.boss) || 0.25;
  if (!t.ch || !t.ch.boss || t.downed || !t.maxHp) return null;
  if ((t.chp + (t.tempHp || 0)) / t.maxHp > pct) return null;
  return t;
};

// The headless stand-in for a player in manual mode: at each hero boundary tap
// the strongest owned skill that is ready. Finisher first, then Counter Attack
// when a foe is about to act, then God Aura.
Enc.tapPolicy = function (enc) {
  if (enc.request || enc.st.over) return;
  const t = A.Combat.currentTurn(enc.st);
  if (!t || t.unit.uid !== enc.heroUid) return;
  for (const id of ['finisher', 'counter_attack', 'god_aura']) {
    const s = Enc.skillState(enc, id);
    if (s && s.ready) { Enc.requestSkill(enc, id); return; }
  }
};

// Drive to the end. policy(enc) may call requestSkill each hero boundary; with
// no policy given and manual skills on, the tap policy stands in for the player.
Enc.runToEnd = function (enc, policy, maxSteps) {
  if (policy === undefined && X.manualSkills) policy = Enc.tapPolicy;
  maxSteps = maxSteps || 400;
  const out = [];
  while (!enc.st.over && enc.steps < maxSteps) {
    if (policy) policy(enc);
    out.push(Enc.step(enc));
  }
  return out;
};

// ---------------------------------------------------------------- rewards
// Arcade scoring (Hiro, 2026-09-27; X.scoring). Every fallen foe pays by what it
// was, a Finisher kill pays a little more, a clean wave a little more again, and
// the whole wave is multiplied by the playthrough bonus. Deterministic: the same
// fights always earn the same score. `awarded` keeps a restarted fight from
// paying twice; embarking clears it so a quest pays again on the next loop.
Enc.wavePoints = function (enc) {
  const S = X.scoring, st = enc.st, hero = Enc.heroUnit(enc);
  const foes = st.units.filter(u => u.side === 'b');
  const fallen = foes.filter(u => u.downed || u.chp <= 0);
  const bosses = fallen.filter(u => u.ch && u.ch.boss).length;
  const regular = fallen.length - bosses;
  const finisherKills = st.events.filter(e => e.t === 'execute' && e.by === enc.heroUid && e.skillId === 'finisher').length;
  const clean = !!hero && !hero.downed && hero.maxHp > 0 && hero.chp / hero.maxHp >= S.cleanWaveHp;
  const base = regular * S.regular + bosses * S.boss + finisherKills * S.finisherKill + (clean ? S.cleanWave : 0);
  const mult = X.loopBonus(enc.run.loop);
  return { regular, bosses, finisherKills, clean, base, mult, points: Math.round(base * mult) };
};
Enc.award = function (enc) {
  const run = enc.run, id = enc.def.id;
  if (run.awarded.includes(id)) return { points: 0, repeated: true };
  run.awarded.push(id);
  const w = Enc.wavePoints(enc);
  run.score = (run.score || 0) + w.points;
  return Object.assign({}, w, { score: run.score });
};
// The quest's boss fell: one more payment, multiplied the same way.
Enc.awardQuest = function (run) {
  const points = Math.round(X.scoring.questClear * X.loopBonus(run.loop));
  run.score = (run.score || 0) + points;
  return { points, score: run.score };
};

// Nothing is bought any more (arcade): every skill in X.skills is owned, and
// the purchase API answers "no" so any old caller stays harmless.
Enc.upgradeCost = function () { return null; };
Enc.owned = function (run, skillId) { return !!X.skills[skillId] && !X.purchasable.includes(skillId); };
// Hero level tag: the playthrough the run is on.
Enc.heroLevel = function (run) { return Math.max(1, (run && run.loop) || 1); };
Enc.canUpgrade = function () { return false; };
Enc.upgrade = function () { return { ok: false, reason: 'arcade' }; };

// Between encounters: hostile effects cleared, health restored, gold/levels kept.
Enc.restore = function (hero) {
  hero.bonusStats = hero.bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 };
  hero.finisherGains = 0;
};
})();
