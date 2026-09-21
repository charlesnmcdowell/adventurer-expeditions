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
  return ch;
};

// Hiro's live kit follows the run: locked skills are not in it at all (the auto
// policy cannot use them, the engine cannot target with them); a purchase adds
// the skill at once so it works in the very next action, mid-quest included.
Enc.syncKit = function (ch, run) {
  const owned = id => !X.purchasable.includes(id) || ((run.levels && run.levels[id]) || 0) > 0;
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
  // Repeat scaling (Campaign.scaleFor): a cleared quest comes back harder.
  if (scale && scale !== 1) { ch.stats.hp = Math.round(ch.stats.hp * scale); ch.stats.atk = Math.round(ch.stats.atk * scale); }
  if (e.perks) ch.perks = ch.perks.filter(p => e.perks.includes(p.skillId));
  if (e.name) ch.name = e.name;
  if (e.boss) ch.boss = true;
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
    foes = encDef.rival ? X.Campaign.rival(encDef.rival).members.map((m, i) => Enc.makeRival(rng, encDef.rival, m, i))
                        : encDef.enemies.map(k => Enc.makeEnemy(rng, k, scale));
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
  for (const id of Object.keys(X.skills)) levels[id] = X.purchasable.includes(id) ? 0 : 1;
  return { levels, gold: X.economy.start, wave: 0, awarded: [], tutorial: {} };
};

Enc.heroUnit = enc => enc.st.units.find(u => u.uid === enc.heroUid);
Enc.isHiro = ch => !!ch && ch.registryId === X.hero.registryId;
// The kit the HUD shows and the request path accepts: Hiro's three purchasable
// skills (locked ones shown locked), or a picked hero's actives + perks.
Enc.kit = function (hero) {
  if (Enc.isHiro(hero)) return { actives: X.purchasable.slice(), perks: [], hiro: true };
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
  const cd = (u.cooldowns && u.cooldowns[skillId]) || 0;
  if (cd > 0) return { ready: false, reason: 'cooldown', left: cd };
  const pool = A.Combat.validTargets(enc.st, u, skillId, false) || [];
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

function heroAction(enc, u) {
  const st = enc.st;
  // A queued request is revalidated at the boundary it fires on.
  if (enc.request) {
    const skillId = enc.request.skillId;
    const s = Enc.skillState(enc, skillId);
    enc.request = null;
    if (s.ready) {
      const hostile = s.pool[0] && s.pool[0].side !== u.side;
      const tgt = hostile ? (A.Combat.threatTargets(st, u, s.pool)[0] || s.pool[0]) : (s.pool.find(x => x.uid === u.uid) || s.pool[0]);
      return { action: { skillId, isAttack: false, pool: s.pool }, tgt, how: 'request' };
    }
    enc.log.push({ t: 'requestDropped', reason: s.reason, skillId });
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
    res = commit(st, u, choice);
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
Enc.award = function (enc) {
  const run = enc.run, id = enc.def.id;
  if (run.awarded.includes(id)) return { gold: 0, repeated: true };
  run.awarded.push(id);
  run.gold += enc.def.gold;
  return { gold: enc.def.gold };
};

Enc.upgradeCost = function (run, skillId) {
  if (run.hero || !X.purchasable.includes(skillId)) return null;      // a picked hero buys at the inn
  const lvl = run.levels[skillId] || 0;
  if (lvl >= X.economy.maxLevel) return null;
  return X.economy.costs[lvl + 1];
};
Enc.owned = function (run, skillId) { return !!run.hero || !X.purchasable.includes(skillId) || (run.levels[skillId] || 0) > 0; };
// Hero level tag: 1 plus every purchase made.
Enc.heroLevel = function (run) { return run.hero ? 1 + (run.hero.purchases || 0) : 1 + X.purchasable.reduce((n, id) => n + (run.levels[id] || 0), 0); };

Enc.canUpgrade = function (run, skillId) {
  const cost = Enc.upgradeCost(run, skillId);
  return cost != null && run.gold >= cost;
};

Enc.upgrade = function (run, skillId, hero) {
  const cost = Enc.upgradeCost(run, skillId);
  if (cost == null) return { ok: false, reason: 'max' };
  if (run.gold < cost) return { ok: false, reason: 'gold' };
  run.gold -= cost;
  run.levels[skillId] = (run.levels[skillId] || 0) + 1;
  if (hero) Enc.syncKit(hero, run);
  return { ok: true, level: run.levels[skillId], cost, unlocked: run.levels[skillId] === 1 };
};

// Between encounters: hostile effects cleared, health restored, gold/levels kept.
Enc.restore = function (hero) {
  hero.bonusStats = hero.bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 };
  hero.finisherGains = 0;
};
})();
