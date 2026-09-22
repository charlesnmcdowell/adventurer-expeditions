// Adventurer: Expeditions — headless simulation gate.
// Runs the demo's first encounter through the shipped combat engine with the
// Expedition overrides and checks: determinism, completion without tapping,
// Finisher request integrity, purchase integrity, and that the shim never
// touches a non-Expedition character.
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const H = require('./harness.js');

const ROOT = path.join(__dirname, '..');
const A = H.load();
const vm = require('node:vm'), fs = require('node:fs');
for (const f of ['js/expedition/data.js', 'js/expedition/shim.js', 'js/expedition/encounter.js', 'js/expedition/campaign.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
}
const X = A.Expedition, Enc = X.Encounter;
// Simulation uses the same reviewed roster as the browser. Validate the real
// atlas rather than enabling unfinished recruits to satisfy old party tests.
const bramAtlas = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/bram/bram.json'), 'utf8'));
const bramFrames = new Set(bramAtlas.textures.flatMap(page => page.frames.map(frame => frame.filename)));
assert.equal(X.Campaign.registerRecruitArt('bram', bramAtlas, frame => bramFrames.has(frame)), true);
const verbose = process.argv.includes('--verbose');
let passed = 0;
function test(name, fn) { fn(); passed++; if (verbose) console.log('ok  ' + name); }

function eventLog(enc) { return enc.st.events.map(e => JSON.stringify(e)).join('\n'); }
function summary(enc) {
  const h = Enc.heroUnit(enc);
  return { won: Enc.won(enc), rounds: enc.st.round, steps: enc.steps, heroHp: h.chp, heroMax: h.maxHp,
    skills: enc.st.events.filter(e => e.t === 'use' && e.uid === enc.heroUid).map(e => e.skillId) };
}

// ---------------------------------------------------------------- shim scope
test('shim leaves a website Hiro untouched', () => {
  const rng = new A.RNG(5);
  const ch = A.Character.makeRegistry(rng, 'hiro', 'Hiro', false);
  const entry = ch.actives.find(a => a.skillId === 'katana_slash');
  const m = A.SkillSys.manifest(ch, entry);
  assert.equal(m.data.power, 2.6);
  assert.equal(m.data.autoKillPct, 0.25);
  assert.equal(m.data.target, 'allEnemies');
});

test('shim resolves an Expedition Hiro by level', () => {
  const run = Enc.freshRun();
  assert.deepEqual(run.levels, { katana_slash: 1, god_aura: 0, counter_attack: 0, finisher: 0 }, 'only Katana Slash is owned at start');
  run.levels.finisher = 1; run.levels.counter_attack = 1;
  const hero = Enc.makeHero(new A.RNG(5), run);
  assert.ok(!hero.actives.some(a => a.skillId === 'god_aura'), 'locked skills are not in the kit');
  const entry = hero.actives.find(a => a.skillId === 'katana_slash');
  let m = A.SkillSys.manifest(hero, entry);
  assert.equal(m.data.power, 1.3); assert.equal(m.data.autoKillPct, 0); assert.equal(m.data.target, 'enemy');
  run.levels.katana_slash = 3;
  m = A.SkillSys.manifest(hero, entry);
  assert.equal(m.data.target, 'allEnemies'); assert.equal(m.level, 3);
  const fin = A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === 'finisher'));
  assert.equal(fin.data.permStatGain, 0); assert.equal(fin.data.healOnKillPct, 0.25);
  // Finisher has no cooldown at any level (Hiro, 2026-09-21): the health window is
  // the only thing that gates it. A falsy value is what the engine reads as none.
  for (const lvl of [1, 2, 3]) {
    run.levels.finisher = lvl;
    const f = A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === 'finisher'));
    assert.ok(!f.data.cooldown, 'Finisher L' + lvl + ' must have no cooldown, saw ' + f.data.cooldown);
  }
  run.levels.finisher = 1;
  const rip = A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === X.riposte.id));
  assert.equal(rip.data.power, 1.4);
  run.levels.counter_attack = 3;
  assert.equal(A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === X.riposte.id)).data.power, 2.0);
  assert.ok(!hero.perks.some(p => p.skillId === 'demigod'), 'demigod removed');
});

// ---------------------------------------------------------------- determinism
test('seeded encounter is deterministic', () => {
  const a = Enc.create({ encounter: 'road_ambush', seed: 42 }); Enc.runToEnd(a);
  const b = Enc.create({ encounter: 'road_ambush', seed: 42 }); Enc.runToEnd(b);
  assert.equal(eventLog(a), eventLog(b));
  assert.ok(a.st.over);
});

// ---------------------------------------------------------------- no-tap completion
test('road ambush is winnable without tapping', () => {
  let wins = 0, rounds = 0, minHp = 1, dmgTaken = 0, bleeds = 0, N = 200;
  for (let s = 1; s <= N; s++) {
    const enc = Enc.create({ encounter: 'road_ambush', seed: s });
    Enc.runToEnd(enc);
    assert.ok(enc.st.over, 'seed ' + s + ' ended');
    if (Enc.won(enc)) wins++;
    rounds += enc.st.round;
    const h = Enc.heroUnit(enc);
    minHp = Math.min(minHp, h.chp / h.maxHp);
    dmgTaken += enc.st.events.filter(e => e.t === 'damage' && e.uid === enc.heroUid).length;
    bleeds += enc.st.events.filter(e => e.t === 'status' && e.uid === enc.heroUid && /bleed/.test(JSON.stringify(e))).length;
  }
  const stats = { winRate: wins / N, avgRounds: rounds / N, minHpPct: +minHp.toFixed(2), avgHitsOnHero: dmgTaken / N, avgBleedsOnHero: bleeds / N };
  console.log('road_ambush no-tap:', JSON.stringify(stats));
  assert.ok(wins / N >= 0.85, 'win rate ' + wins / N);
  assert.ok(rounds / N <= 9, 'avg rounds ' + rounds / N);
  assert.ok(dmgTaken / N >= 1, 'wolves must land visible hits');
});

// ---------------------------------------------------------------- Finisher requests
test('finisher request fires once at the next hero boundary', () => {
  let fired = 0, seen = 0;
  for (let s = 1; s <= 60; s++) {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter: 'road_ambush', seed: s, run });
    const before = () => {
      if (Enc.finisherState(enc).ready) { seen++; const r1 = Enc.requestFinisher(enc); const r2 = Enc.requestFinisher(enc); assert.ok(r1.ok && r2.duplicate); }
    };
    const steps = Enc.runToEnd(enc, before);
    for (const st of steps) if (st.hero && st.choice && st.choice.how === 'request') fired++;
    // Never two finisher uses in a row from one request.
    const uses = enc.st.events.filter(e => e.t === 'use' && e.uid === enc.heroUid && e.skillId === 'finisher');
    assert.ok(uses.length <= steps.filter(x => x.hero).length);
    assert.equal(enc.request, null, 'no stranded request at end');
  }
  console.log('finisher windows seen:', seen, 'fired by request:', fired);
  assert.ok(seen > 0 && fired > 0);
});

test('a first Finisher window opens on the road without a tap', () => {
  let windows = 0, N = 80;
  for (let s = 1; s <= N; s++) {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter: 'road_ambush', seed: s, run });
    let seen = false;
    Enc.runToEnd(enc, e => { if (Enc.finisherState(e).ready) seen = true; }, 400);
    if (seen) windows++;
  }
  console.log('road_ambush finisher windows:', windows + '/' + N);
  assert.ok(windows / N >= 0.7, 'finisher window rate ' + (windows / N));
});

test('request on an invalid state is refused with a reason', () => {
  let enc = Enc.create({ encounter: 'road_ambush', seed: 3 });
  assert.equal(Enc.requestFinisher(enc).reason, 'locked');
  const run = Enc.freshRun(); run.levels.finisher = 1;
  enc = Enc.create({ encounter: 'road_ambush', seed: 3, run });
  const r = Enc.requestFinisher(enc);
  assert.equal(r.ok, false); assert.equal(r.reason, 'no_target');
});

test('a request whose target dies first is dropped, not stranded', () => {
  let dropped = 0;
  for (let s = 1; s <= 120; s++) {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter: 'road_ambush', seed: s, run });
    Enc.runToEnd(enc, e => { if (Enc.finisherState(e).ready) Enc.requestFinisher(e); });
    dropped += enc.log.filter(l => l.t === 'requestDropped').length;
    assert.equal(enc.request, null);
  }
  console.log('requests dropped because the target died first:', dropped);
});

// ------------------------------------------------- what the package carries
// A quest may only be open if the build carries everything it needs. A missing
// plate or track does not degrade: Phaser parks the scene in preload until the
// file arrives, so an open quest with a missing asset is a black screen.
// The freeze of 2026-09-21: Road in the Rain opens on two cave boars, and the
// boar atlas had been left out of X.shipped, so the runtime refused to load it.
// The boars were in the fight with a health bar and no body, and nothing could
// resolve. Art for a scenery file is checked below; this is the one that matters
// more, because an enemy with no art stops the game rather than looking wrong.
test('every creature an open quest can field has its art in the build', () => {
  const Camp = X.Campaign;
  const shipped = new Set((X.shipped && X.shipped.actors) || []);
  const open = ['road'].concat(X.slice.openQuests || []);
  const missing = [];
  for (const id of open) {
    const q = Camp.quest(id);
    if (!q) continue;
    for (const encDef of Camp.questEncounters(id)) {
      for (const key of (encDef.enemies || [])) {
        const def = X.enemies[key];
        assert.ok(def, id + ' fields an enemy that is not defined: ' + key);
        // Humans are composed from the shared part sheets, not an actor atlas.
        if (def.human || def.kind === 'human') continue;
        const actor = def.artActor || def.kind;               // 'wolf', 'boar', 'plant', 'boss'/alpha
        const name = actor === 'boss' ? 'alpha' : actor;
        if (!shipped.has(name)) missing.push(id + ':' + key + ' needs ' + name);
      }
    }
  }
  assert.deepEqual(missing, [], 'an open quest fields a creature whose art is not shipped — ' +
    'that is an enemy with a health bar and no body, and a fight that cannot end: ' + missing.join(', '));
});

test('every open quest has its music, plates and panorama in the build', () => {
  const { shipList } = require('../tools/size_check.js');
  const set = new Set(shipList().files);
  const ALIAS = { bandit_road: 'road', deep_wood: 'forest', shallows: 'coast' };
  const open = new Set(['road'].concat(X.slice.openQuests || []));
  let checked = 0;
  for (const q of X.quests) {
    if (!open.has(q.id)) continue;
    checked++;
    assert.ok(set.has('audio/music/' + q.music + '.mp3'), q.id + ' is open but its music is not shipped: ' + q.music);
    for (const p of new Set(q.plates))
      assert.ok(set.has('assets/anime/v2/runtime/' + (ALIAS[p] || p) + '.webp'), q.id + ' is open but a battle plate is missing: ' + p);
    assert.ok(set.has('assets/anime/travel/v1/runtime/' + q.travel + '.webp'), q.id + ' is open but its travel panorama is missing: ' + q.travel);
  }
  assert.ok(checked >= 2, 'the tutorial and at least one loop quest are open');
  // X.shipped is the list the runtime may queue: it must name exactly the actor
  // atlases in the package, in both directions.
  const shipped = (X.shipped && X.shipped.actors) || [];
  for (const id of shipped) assert.ok(set.has('assets/expedition/' + id + '/' + id + '.json'), 'X.shipped names an actor the build lacks: ' + id);
  const NOT_ACTORS = new Set(['busts', 'inn', 'icons']);          // bundles, not fighters
  for (const f of set) {
    const m = /^assets\/expedition\/([a-z0-9_]+)\/\1\.json$/.exec(f);
    if (m && !NOT_ACTORS.has(m[1])) assert.ok(shipped.includes(m[1]), 'the build carries an atlas X.shipped omits: ' + m[1]);
  }
});

// A tap is an instruction, not a suggestion (Hiro, 2026-09-21).
test('a queued skill waits for its window instead of being silently dropped', () => {
  const run = Enc.freshRun(); run.levels.finisher = 1;
  const enc = Enc.create({ encounter: 'road_ambush', seed: 3, run });
  // Queue the Finisher while a target is under the line, then put every enemy
  // back to full so the window is shut when Hiro actually acts.
  let queued = false;
  for (let i = 0; i < 200 && !queued; i++) {
    const foes = enc.st.units.filter(x => x.side === 'b' && !x.downed);
    if (foes.length) foes[0].chp = Math.max(1, Math.round(foes[0].maxHp * 0.3));
    if (Enc.skillState(enc, 'finisher').ready) { assert.equal(Enc.requestSkill(enc, 'finisher').ok, true); queued = true; break; }
    Enc.step(enc);
    if (enc.st.over) break;
  }
  assert.ok(queued, 'the finisher should become requestable');
  for (const x of enc.st.units) if (x.side === 'b' && !x.downed) x.chp = x.maxHp;   // window shut
  const before = enc.log.length;
  let waited = false;
  for (let i = 0; i < 6 && !enc.st.over; i++) {
    Enc.step(enc);
    if (enc.log.slice(before).some(e => e.t === 'requestWaiting')) { waited = true; break; }
  }
  assert.ok(waited, 'the request should wait for its window rather than vanish');
  // And it must not wait forever: the grace is bounded and the drop is logged.
  for (let i = 0; i < 40 && enc.request && !enc.st.over; i++) {
    for (const x of enc.st.units) if (x.side === 'b' && !x.downed) x.chp = x.maxHp;
    Enc.step(enc);
  }
  assert.ok(!enc.request, 'the request must not wait forever');
});

// Finishing moves are matched by painted set, not by entity id (Hiro,
// 2026-09-22). Before that, `dire_wolf` paired and `dire_wolf_2` did not, so the
// finisher animated on the tutorial road and nowhere else. This asserts the rule
// the way it is felt: every creature you can meet in an open quest resolves to a
// painted set that has finishing moves painted for it.
test('every creature in an open quest has a finishing move', () => {
  const Camp = X.Campaign;
  const FAMILIES = { wolf: 1, plant: 1, alpha: 1 };         // the sets with paired finishers
  const missing = [];
  for (const qid of ['road'].concat(X.slice.openQuests || [])) {
    if (!Camp.quest(qid)) continue;
    for (const encDef of Camp.questEncounters(qid)) {
      for (const key of (encDef.enemies || [])) {
        const def = X.enemies[key] || {};
        if (def.human || def.kind === 'human') continue;
        const set = X.paintedActorOfKey(key);
        if (!FAMILIES[set]) missing.push(qid + ':' + key + ' -> ' + set);
      }
    }
  }
  assert.deepEqual(missing, [], 'these would kill without a finishing move: ' + missing.join(', '));
  // And the variants resolve to the same painted set as the creature the clips
  // were painted against — which is what makes the pair eligible at all.
  assert.equal(X.paintedActorOfKey('dire_wolf_2'), X.paintedActorOfKey('dire_wolf'));
  assert.equal(X.paintedActorOfKey('thorn_2'), X.paintedActorOfKey('thorn_lurker'));
  assert.equal(X.paintedActorOfKey('alpha_2'), X.paintedActorOfKey('road_wolf_leader'));
});

// ------------------------------------------------- casting between turns
// Hiro, 2026-09-22: a skill should fire when you tap it, whoever's turn it is,
// and not cost a turn — "it'll add more player agency since the skill usage
// doesn't count as a turn". Verified against the shared engine first: an
// out-of-turn act leaves the current turn and the round exactly where they were.
test('a cast fires between turns and costs nobody a turn', () => {
  const run = Enc.freshRun(); run.levels.god_aura = 1;
  const enc = Enc.create({ encounter: 'road_ambush', seed: 4, run });
  const st = enc.st;
  const cur = () => { const t = A.Combat.currentTurn(st); return t ? t.unit.uid : null; };
  while (cur() === enc.heroUid && !st.over) Enc.step(enc);      // stop on an enemy's turn
  const turnBefore = cur(), roundBefore = st.round, stepsBefore = enc.steps;
  assert.notEqual(turnBefore, enc.heroUid, 'the cast is made on an enemy turn');
  assert.equal(Enc.requestSkill(enc, 'god_aura').ok, true);
  const cast = Enc.castNow(enc);
  assert.ok(cast && cast.cast, 'the cast resolved immediately');
  assert.ok(cast.events.length, 'and produced beats to play');
  assert.equal(cur(), turnBefore, 'the turn order did not move');
  assert.equal(st.round, roundBefore, 'nor the round');
  assert.equal(enc.steps, stepsBefore, 'and it consumed no step');
  assert.equal(enc.request, null, 'the request was spent');
  // The fight still finishes cleanly afterwards.
  let n = 0; while (!st.over && n < 200) { Enc.step(enc); n++; }
  assert.ok(st.over, 'the fight still resolves after an out-of-turn cast');
});

test('recovery is measured in seconds, not turns', () => {
  const realNow = X.now;
  let clock = 1000000;
  X.now = () => clock;
  try {
    const run = Enc.freshRun(); run.levels.god_aura = 1;
    const enc = Enc.create({ encounter: 'road_ambush', seed: 6, run });
    // Nothing in the shipped skill data may carry an engine cooldown any more:
    // a recovery counted in turns cannot be read while casting off-turn.
    for (const id of ['god_aura', 'counter_attack', 'finisher'])
      for (const lvl of [1, 2, 3])
        assert.ok(!(X.skills[id] && X.skills[id][lvl] && X.skills[id][lvl].cooldown),
          id + ' L' + lvl + ' must not carry a turn-based cooldown');
    assert.equal(Enc.requestSkill(enc, 'god_aura').ok, true);
    assert.ok(Enc.castNow(enc), 'the cast fired');
    const span = X.cooldownMsFor('god_aura', 1);
    assert.equal(span, 10000, 'God Aura recovers in ten seconds');
    assert.equal(Enc.skillState(enc, 'god_aura').reason, 'cooldown');
    assert.ok(Enc.cooldownLeftMs(enc, 'god_aura') > 0);
    // Turns passing does NOT shorten it; only the clock does.
    for (let i = 0; i < 6 && !enc.st.over; i++) Enc.step(enc);
    assert.equal(Enc.skillState(enc, 'god_aura').reason, 'cooldown', 'turns do not tick a clock');
    clock += span + 1;
    const after = Enc.skillState(enc, 'god_aura');
    assert.ok(after.ready || after.reason !== 'cooldown', 'the clock does: ' + JSON.stringify(after));
  } finally { X.now = realNow; }
});

// The Finisher's boss line (Hiro, 2026-09-22: "finisher is not working on dire
// wolf, it's not doing the finishing move animations or killing him"). The boss
// wolves glowed at 51 % but only execute at 25 %, so the Finisher dealt ~22
// damage and killed nothing; in a mixed wave it aimed at the boss over a wolf it
// could have finished three times in five. Each case below was measured before
// the fix and failed.
test('the Finisher only glows on a boss when it can actually finish it', () => {
  const at = (key, pct, seed) => {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter: { id: 'fin_' + key, enemies: [key], gold: 0 }, seed: seed || 3, run });
    const foe = enc.st.units.find(u => u.side === 'b');
    foe.chp = Math.max(1, Math.round(foe.maxHp * pct));
    return { enc, foe };
  };
  const line = X.finisherThresholds.boss;
  assert.equal(line, 0.25, 'bosses stay at 25 %, by Hiro\'s call');
  for (const key of ['road_wolf_leader', 'alpha_2']) {
    for (const pct of [0.45, 0.30]) {
      const { enc } = at(key, pct);
      const s = Enc.skillState(enc, 'finisher');
      assert.equal(s.ready, false, key + ' at ' + pct * 100 + '% must not light the Finisher');
      assert.equal(s.reason, 'no_target');
    }
    const { enc, foe } = at(key, 0.20);
    assert.equal(Enc.skillState(enc, 'finisher').ready, true, key + ' at 20% can be finished');
    Enc.requestSkill(enc, 'finisher');
    assert.ok(Enc.castNow(enc), 'the cast resolves');
    assert.ok(foe.downed || foe.chp <= 0, key + ' at 20% dies to the Finisher');
  }
  // Ordinary creatures are unchanged: still finishable at the ordinary line.
  for (const key of ['dire_wolf', 'dire_wolf_2', 'thorn_lurker', 'thorn_2']) {
    const { enc, foe } = at(key, 0.45);
    assert.equal(Enc.skillState(enc, 'finisher').ready, true, key + ' at 45% still lights');
    Enc.requestSkill(enc, 'finisher'); Enc.castNow(enc);
    assert.ok(foe.downed || foe.chp <= 0, key + ' at 45% still dies');
  }
});

test('in a boss wave the Finisher takes the wolf, never the boss above its line', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter: { id: 'mix', enemies: ['alpha_2', 'dire_wolf_2'], gold: 0, boss: true }, seed, run });
    const foes = enc.st.units.filter(u => u.side === 'b');
    for (const f of foes) f.chp = Math.round(f.maxHp * 0.40);
    const s = Enc.skillState(enc, 'finisher');
    assert.deepEqual(s.pool.map(u => u.ch.expeditionKey), ['dire_wolf_2'], 'seed ' + seed + ': only the wolf is on offer');
    Enc.requestSkill(enc, 'finisher');
    const cast = Enc.castNow(enc);
    assert.equal(cast.choice.tgt.ch.expeditionKey, 'dire_wolf_2', 'seed ' + seed + ': aimed at the wolf');
    const dead = foes.filter(f => f.downed || f.chp <= 0).map(f => f.ch.expeditionKey);
    assert.deepEqual(dead, ['dire_wolf_2'], 'seed ' + seed + ': the wolf died and the boss did not');
  }
});

// ---------------------------------------------------------------- economy
test('rewards pay once; upgrades deduct exactly once and change the next manifest', () => {
  const run = Enc.freshRun();
  const enc = Enc.create({ encounter: 'road_ambush', seed: 7, run });
  Enc.runToEnd(enc);
  // The player starts with X.economy.start in hand (20 since 2026-09-21) so the
  // tutorial's first beat can be a purchase, before any fighting.
  assert.equal(X.economy.start, 20, 'the road opens with enough for the first skill');
  assert.equal(Enc.award(enc).gold, 40); assert.equal(run.gold, X.economy.start + 40);
  assert.equal(Enc.award(enc).gold, 0, 'second award pays nothing');
  assert.equal(Enc.upgradeCost(run, 'katana_slash'), null, 'Katana Slash is not purchasable');
  assert.ok(Enc.canUpgrade(run, 'finisher'));
  assert.deepEqual(Enc.upgrade(run, 'finisher'), { ok: true, level: 1, cost: 20, unlocked: true });
  // Stated against the starting purse rather than a fixed number, so the rule
  // under test is "an unlock costs 20", not "the player began with nothing".
  assert.equal(run.gold, X.economy.start + 40 - X.economy.costs[1]);
  assert.equal(Enc.upgrade(run, 'god_aura').ok, true, 'the next first-tier unlock is affordable');
  assert.equal(run.gold, X.economy.start + 40 - 2 * X.economy.costs[1]);
  run.gold = 0;                                                 // an empty purse, however it got there
  assert.equal(Enc.upgrade(run, 'counter_attack').ok, false, 'no gold, no unlock');
  // The road pays 150, and the player starts with 20. Three guided unlocks
  // (3 × 20) must still leave the first recruit's price.
  assert.ok(X.economy.start + X.encounters.reduce((n, e) => n + e.gold, 0) - 3 * X.economy.costs[1] >= X.party.recruitCosts[0], 'the tutorial must fund the first recruit');
  assert.equal(Enc.heroLevel(run), 3);
  // The next encounter's Hiro owns Finisher and resolves it at level 1.
  const enc2 = Enc.create({ encounter: 'road_ambush', seed: 8, run });
  const m = A.SkillSys.manifest(enc2.hero, enc2.hero.actives.find(a => a.skillId === 'finisher'));
  assert.equal(m.level, 1); assert.ok(m.data.executeBelow > X.finisherThresholds.normal && m.data.executeBelow <= 0.51);
});

// ------------------------------------------------- Finisher windows (GDD §7)
test('the Finisher takes a normal enemy at half health and a boss at a quarter', () => {
  assert.deepEqual(X.finisherThresholds, { normal: 0.50, boss: 0.25 });
  for (const lvl of [1, 2, 3]) {
    const run = Enc.freshRun(); run.levels.finisher = lvl;
    const hero = Enc.makeHero(new A.RNG(3), run);
    const m = A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === 'finisher'));
    assert.ok(m.data.executeBelow > 0.50 && m.data.executeBelow <= 0.51, 'level ' + lvl + ' window includes exactly half');
    assert.equal(m.data.requireBelowPct, m.data.executeBelow, 'level ' + lvl + ' targeting matches the window');
  }
  // A normal enemy: offered under the line, not offered above it.
  const at = (pct, encounter) => {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter, seed: 5, run });
    for (const f of enc.st.units.filter(u => u.side === 'b')) f.chp = Math.max(1, Math.round(f.maxHp * pct));
    return enc;
  };
  assert.ok(Enc.skillState(at(0.45, 'road_ambush'), 'finisher').ready, 'a wolf at 45% can be finished');
  const half = at(0.50, 'road_ambush');
  for (const f of half.st.units.filter(u => u.side === 'b')) f.chp = Math.max(1, Math.floor(f.maxHp / 2));
  assert.ok(Enc.skillState(half, 'finisher').ready, 'a wolf sitting on exactly half can be finished');
  assert.equal(Enc.skillState(at(0.60, 'road_ambush'), 'finisher').reason, 'no_target', 'a wolf at 60% cannot');

  // A boss: a heavy hit above the boss line, an execution at or under it, and
  // its boss flag is intact afterwards either way.
  const spend = (pct) => {
    const enc = at(pct, 'clearing');
    const boss = enc.st.units.find(u => u.side === 'b' && u.ch.boss);
    assert.ok(boss, 'the clearing has a boss');
    for (let i = 0; i < 40 && !enc.st.over; i++) {
      const t = A.Combat.currentTurn(enc.st); if (!t) break;
      if (t.unit.uid === enc.heroUid) {
        Enc.requestSkill(enc, 'finisher');
        const step = Enc.step(enc);
        return { executed: step.events.some(e => e.t === 'execute'), flag: boss.ch.boss === true, hp: boss.chp, how: step.choice && step.choice.how };
      }
      Enc.step(enc);
    }
    return { executed: false, flag: boss.ch.boss === true, hp: boss.chp, how: 'none' };
  };
  const low = spend(0.20), high = spend(0.40);
  assert.equal(low.how, 'request'); assert.ok(low.executed, 'a boss at 20% is finished');
  assert.ok(low.flag, 'the boss flag is restored after an execution');
  assert.ok(!high.executed, 'a boss at 40% is not finished');
  assert.ok(high.hp > 0 && high.hp < Math.round(0.40 * 100), 'but it still takes the hit');
  assert.ok(high.flag, 'the boss flag is restored after a non-execution');
});

test('every reachable build clears the road', () => {
  // Slash-only (fight 1), each single unlock, and the two-purchase combinations reachable before the boss.
  const builds = [{}, { finisher: 1 }, { god_aura: 1 }, { counter_attack: 1 }, { finisher: 2 }, { god_aura: 2 }, { counter_attack: 2 },
    { finisher: 1, god_aura: 1 }, { finisher: 1, counter_attack: 1 }, { god_aura: 1, counter_attack: 1 }, { finisher: 3 }];
  for (const b of builds) {
    let wins = 0, rounds = 0, N = 100;
    for (let s = 1; s <= N; s++) {
      const run = Enc.freshRun(); Object.assign(run.levels, b);
      const enc = Enc.create({ encounter: 'road_ambush', seed: 1000 + s, run });
      Enc.runToEnd(enc); if (Enc.won(enc)) wins++; rounds += enc.st.round;
    }
    console.log('build', JSON.stringify(b), 'win', wins / N, 'avgRounds', rounds / N);
    assert.ok(wins / N >= 0.85, JSON.stringify(b));
  }
});

// ---------------------------------------------------------------- the whole quest
test('the full quest is winnable on the common purchase paths', () => {
  function quest(seed, plan, tap) {
    const run = Enc.freshRun(); const out = [];
    for (let w = 0; w < X.encounters.length; w++) {
      const enc = Enc.create({ encounter: X.encounters[w], seed: seed * 10 + w, run });
      Enc.runToEnd(enc, tap ? e => { for (const id of X.purchasable) if (Enc.skillState(e, id).ready) Enc.requestSkill(e, id); } : null, 600);
      assert.ok(enc.st.over, 'wave ' + w + ' seed ' + seed + ' ended');
      out.push({ won: Enc.won(enc), rounds: enc.st.round, poison: enc.st.events.some(e => e.t === 'status' && e.uid === enc.heroUid && e.kind === 'poison') });
      if (!Enc.won(enc)) break;
      Enc.award(enc);
      for (const id of (plan[w] || [])) assert.ok(Enc.upgrade(run, id).ok, 'could afford ' + id + ' after wave ' + w);
    }
    return out;
  }
  const plans = { finAura: [['finisher'], ['god_aura']], finCounter: [['finisher'], ['counter_attack']], finFin: [['finisher'], ['finisher']], none: [[], []] };
  const floor = { finAura: [0.95, 0.9, 0.9], finCounter: [0.95, 0.9, 0.9], finFin: [0.95, 0.9, 0.8], none: [0.95, 0.8, 0.7] };
  for (const tap of [false, true]) for (const [name, plan] of Object.entries(plans)) {
    const N = 100, agg = X.encounters.map(() => ({ n: 0, won: 0, rounds: 0, poison: 0 }));
    for (let s = 1; s <= N; s++) for (const [w, o] of quest(s, plan, tap).entries()) { const a = agg[w]; a.n++; a.won += o.won ? 1 : 0; a.rounds += o.rounds; a.poison += o.poison ? 1 : 0; }
    const line = agg.map((a, w) => a.n ? 'w' + w + ' win ' + (a.won / a.n).toFixed(2) + ' r' + (a.rounds / a.n).toFixed(1) : 'w' + w + ' -').join(' | ');
    console.log((tap ? 'tap  ' : 'auto ') + name.padEnd(10) + line);
    // Skills are the player's to fire (X.manualSkills): an untapped run holds only the no-purchase floor whatever was bought.
    const fl = tap || !X.manualSkills ? floor[name] : floor.none;
    agg.forEach((a, w) => { if (a.n) assert.ok(a.won / a.n >= fl[w], name + ' wave ' + w + ' win ' + (a.won / a.n)); });
    assert.ok(agg[1].n === 0 || agg[1].poison / agg[1].n >= 0.9, 'the thicket shows Poison');
  }
});

// ---------------------------------------------------------------- mid-quest purchases
test('a skill bought between fights works in the very next fight', () => {
  const run = Enc.freshRun(); const w = X.Campaign.buildWorld(run);
  try {
    let enc = Enc.create({ encounter: 'road_ambush', seed: 3, run, hero: w.hero }); Enc.runToEnd(enc); Enc.award(enc);
    assert.ok(Enc.upgrade(run, 'finisher', w.hero).ok);
    assert.ok(w.hero.actives.some(a => a.skillId === 'finisher'), 'live kit gained the skill');
    let fired = 0, glow = 0, errors = 0;
    for (let s = 1; s <= 30; s++) {
      enc = Enc.create({ encounter: 'thicket', seed: 100 + s, run, hero: w.hero });
      const steps = Enc.runToEnd(enc, e => { if (Enc.skillState(e, 'finisher').ready) { glow++; Enc.requestSkill(e, 'finisher'); } });
      for (const st of steps) if (st.hero && st.choice) { if (st.choice.how === 'request') fired++; if (st.choice.error) errors++; }
    }
    console.log('post-purchase finisher: glow boundaries', glow, 'fired by tap', fired, 'engine errors', errors);
    assert.ok(fired > 0 && errors === 0);
    // And every purchasable skill produces its signature events when owned.
    const sig = { finisher: 'execute', god_aura: e => e.t === 'status' && e.kind === 'aura', counter_attack: 'counter' };
    for (const id of X.purchasable) {
      const r2 = Enc.freshRun(); r2.levels[id] = 1; let seen = 0;
      for (let s = 1; s <= 20; s++) { const e2 = Enc.create({ encounter: 'thicket', seed: 200 + s, run: r2 }); Enc.runToEnd(e2, e => { if (Enc.skillState(e, id).ready) Enc.requestSkill(e, id); }); seen += e2.st.events.filter(typeof sig[id] === 'string' ? ev => ev.t === sig[id] : sig[id]).length; }
      assert.ok(seen > 0, id + ' shows its effect');
    }
  } finally { w.restoreIds(); }
});

// ---------------------------------------------------------------- party campaign
test('travel banter advances its round-robin across rebuilt worlds', () => {
  const Camp = X.Campaign;
  // Bram's art is out of the package today, so field him under an X.shipped that
  // carries him: this covers the banter rotation for when the inn reopens.
  const savedShipped = X.shipped;
  X.shipped = Object.assign({}, X.shipped, { actors: (X.shipped.actors || []).concat('bram') });
  try {
  const run = Camp.freshRun(); run.roster = ['bram']; run.field = ['bram']; run.visits = {};
  const seen = [];
  for (let i = 0; i < 4; i++) {
    const w = Camp.buildWorld(run);                                         // a fresh Character every scene, as the scenes do
    const lines = Camp.banter(null, w.world, w.companions, 'return', 'forest', { visits: i, questId: 'x' });
    assert.equal(lines.length, 1); assert.equal(lines[0].speaker.companionKey, 'bram');
    assert.ok(A.util.speakEx(w.world, lines[0].speaker, lines[0].band, { self: lines[0].speaker.name }));
    // Ordinary M05 travel observations have one recording each. His existing
    // two-line response band exercises persisted rotation without inventing a
    // second supported companion or pretending the observation has variants.
    const r = A.util.speakEx(w.world, lines[0].speaker, 'travel_response', { target: 'Hiro', self: lines[0].speaker.name });
    seen.push(r.band + ':' + r.idx);
    w.restoreIds();
    run.voice = JSON.parse(JSON.stringify(run.voice));                     // survive a save/load round trip
  }
  assert.ok(new Set(seen).size >= 2, 'Bram must not say the same line every leg: ' + seen.join(' '));
  } finally { X.shipped = savedShipped; }
});

test('the retained loop uses only painted Bram; tutorial lock and earned upgrades are respected', () => {
  const Camp = X.Campaign;
  // All four levels are open, in the order Hiro set (2026-09-21): a run starts
  // at Road in the Rain and goes marsh, city, ruins. "Clear the road" is retired
  // from the rotation and survives only as the dev panel's preview.
  assert.deepEqual(X.slice.openQuests, ['rain', 'marsh', 'city', 'ruins'], 'the four levels, in order');
  assert.equal(X.slice.startQuest, 'rain', 'a new run starts in the rain');
  const r1 = Camp.freshRun();
  assert.equal(r1.questId, 'rain', 'a fresh run begins at the starting quest');
  assert.equal(Camp.nextQuestId(r1), 'rain');
  r1.questsDone.push('rain'); assert.equal(Camp.nextQuestId(r1), 'marsh', 'rain hands off to the marsh');
  r1.questsDone.push('marsh'); assert.equal(Camp.nextQuestId(r1), 'city', 'then the city');
  r1.questsDone.push('city'); assert.equal(Camp.nextQuestId(r1), 'ruins', 'then the ruins');
  r1.questsDone.push('ruins'); assert.ok(X.slice.openQuests.includes(Camp.nextQuestId(r1)), 'and then it cycles');
  for (const id of ['rain', 'marsh', 'city', 'ruins']) assert.ok(Camp.questOpen(id), id + ' is open');
  assert.ok(Camp.questOpen('road'), 'the retired tutorial stays previewable');
  // A save naming a quest that is not open is pulled back to the starting one.
  const keep = Camp.sanitizeRun(Object.assign(Camp.freshRun(), { questId: 'ruins', phase: 'quest', wave: 0 }));
  assert.equal(keep.questId, 'ruins', 'an open quest survives sanitation');
  const bogus = Camp.sanitizeRun(Object.assign(Camp.freshRun(), { questId: 'nowhere', phase: 'quest', wave: 0 }));
  assert.equal(bogus.questId, Camp.startQuestId(), 'an unknown quest falls back to the start');
  // Bram's combat art is out of the package while the inn is locked, so he is
  // refused for the same reason the unpainted recruits are.
  assert.ok(!Camp.artShipped('bram'), "Bram's atlas is not in the build today");
  const savedSlice = X.slice; X.slice = Object.assign({}, X.slice, { firstLevelOnly: false });
  // With the lock lifted, Bram is still refused while his art is out of the
  // build — the guard that stops the dev panel sending the loader after a file
  // the package does not have.
  assert.equal(Camp.buy(Object.assign(Camp.freshRun(), { gold: 1000 }), 'bram').reason, 'art unavailable');
  const savedShipped = X.shipped;
  X.shipped = Object.assign({}, X.shipped, { actors: (X.shipped.actors || []).concat('bram') });
  try {
  // Explicitly test the preserved future loop without changing the ship lock.
  const run0 = Camp.freshRun(); run0.gold = 1000;
  assert.equal(Camp.recruitCost(run0), 60);
  assert.equal(Camp.buy(run0, 'bram').ok, true); assert.equal(Camp.recruitCost(run0), 90);
  assert.equal(Camp.buy(run0, 'nyx').reason, 'art unavailable'); assert.equal(Camp.buy(run0, 'sable').reason, 'art unavailable');
  assert.deepEqual(run0.field, ['bram']);
  assert.equal(Camp.toggleField(run0, 'sable').reason, 'art unavailable');
  assert.equal(Camp.toggleField(run0, 'bram').fielded, false); assert.equal(Camp.toggleField(run0, 'bram').fielded, true);
  assert.deepEqual(run0.field, ['bram']);
  assert.equal(Camp.buy(run0, 'bram').ok, false, 'no double purchase');
  // Quest order with the slice lifted: tutorial once, then the four in a cycle.
  // A run of its own — r1 above belongs to the locked-slice assertions.
  const r2 = Camp.freshRun(); r2.questsDone.push('road');
  assert.equal(Camp.nextQuestId(r2), 'rain');
  r2.questsDone.push('rain', 'city', 'marsh', 'ruins'); assert.equal(Camp.nextQuestId(r2), 'rain');
  // Fights.
  function quest(seed, qid, field, cycles, skillLevel = 1) {
    const run = Camp.freshRun(); run.roster = field.slice(); run.field = field.slice(); run.cycles = cycles || {};
    Object.assign(run.levels, { finisher: skillLevel, god_aura: skillLevel, counter_attack: skillLevel });
    const w = Camp.buildWorld(run); const out = [];
    try {
      for (const encDef of Camp.questEncounters(qid)) {
        const enc = Enc.create({ encounter: encDef, seed: seed * 10 + out.length, run, hero: w.hero, allies: w.companions, scale: Camp.scaleFor(run, qid) });
        Enc.runToEnd(enc, e => { for (const id of X.purchasable) if (Enc.skillState(e, id).ready) Enc.requestSkill(e, id); }, 800);
        assert.ok(enc.st.over, qid + ' seed ' + seed + ' ended');
        out.push({ won: Enc.won(enc), rounds: enc.st.round });
        if (!Enc.won(enc)) break;
        for (const u of enc.st.units) if (u.side === 'a') { u.ch.combatHp = undefined; }
      }
    } finally { w.restoreIds(); }
    return out;
  }
  const N = 30;
  const crew = ['bram'];
  for (const q of X.quests.filter(q => !q.tutorial)) {
    let wins = 0, rounds = 0, n = 0;
    for (let s = 1; s <= N; s++) { const r = quest(s, q.id, crew); if (r.length === 3 && r.every(o => o.won)) wins++; for (const o of r) { rounds += o.rounds; n++; } }
    console.log('loop ' + q.id.padEnd(6) + ' first clear win ' + (wins / N).toFixed(2) + ' avgRounds ' + (rounds / n).toFixed(1));
    assert.ok(wins / N >= 0.8, q.id + ' first clear win ' + wins / N);
    let wins3 = 0;
    for (let s = 1; s <= N; s++) { const r = quest(s, q.id, crew, { [q.id]: 3 }, 3); if (r.length === 3 && r.every(o => o.won)) wins3++; }
    console.log('loop ' + q.id.padEnd(6) + ' fourth clear (earned L3 skills) win ' + (wins3 / N).toFixed(2));
    assert.ok(wins3 / N >= 0.4, q.id + ' fourth clear must stay beatable: ' + wins3 / N);
    assert.equal(Camp.scaleFor({ cycles: { [q.id]: 3 } }, q.id), 1.9, 'enemy scaling is retained despite earned upgrades');
  }
  // Every quest's plates and panorama are in the build's sync list — night and storm are data.
  const sync = require('node:fs').readFileSync(path.join(ROOT, 'tools/sync_shared.js'), 'utf8');
  for (const q of X.quests) {
    for (const p of q.plates) { const id = ({ deep_wood: 'forest', bandit_road: 'road' })[p] || p; assert.ok(sync.includes('v2/runtime/' + id + '.webp'), q.id + ' battle plate ' + id + ' not synced'); }
    assert.ok(sync.includes('travel/v1/runtime/' + q.travel + '.webp'), q.id + ' travel plate ' + q.travel + ' not synced');
    assert.ok(sync.includes(q.music + '.mp3'), q.id + ' music ' + q.music + ' not synced');
  }
  assert.ok(sync.includes(X.innMusic + '.mp3'), 'inn music not synced');
  } finally { X.slice = savedSlice; X.shipped = savedShipped; }
});

if (verbose) {
  const enc = Enc.create({ encounter: 'road_ambush', seed: 11 });
  Enc.runToEnd(enc);
  console.log(JSON.stringify(summary(enc)));
  for (const e of enc.st.events) console.log(' ', JSON.stringify(e));
}
console.log('expedition_sim: ' + passed + ' checks passed');
