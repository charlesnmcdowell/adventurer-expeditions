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
  assert.equal(m.data.power, 1.6); assert.equal(m.data.autoKillPct, 0); assert.equal(m.data.target, 'enemy');
  run.levels.katana_slash = 3;
  m = A.SkillSys.manifest(hero, entry);
  assert.equal(m.data.target, 'allEnemies'); assert.equal(m.level, 3);
  const fin = A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === 'finisher'));
  assert.equal(fin.data.permStatGain, 0); assert.equal(fin.data.healOnKillPct, 0.25); assert.equal(fin.data.cooldown, 3);
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

// ---------------------------------------------------------------- economy
test('rewards pay once; upgrades deduct exactly once and change the next manifest', () => {
  const run = Enc.freshRun();
  const enc = Enc.create({ encounter: 'road_ambush', seed: 7, run });
  Enc.runToEnd(enc);
  assert.equal(Enc.award(enc).gold, 40); assert.equal(run.gold, 40);
  assert.equal(Enc.award(enc).gold, 0, 'second award pays nothing');
  assert.equal(Enc.upgradeCost(run, 'katana_slash'), null, 'Katana Slash is not purchasable');
  assert.ok(Enc.canUpgrade(run, 'finisher'));
  assert.deepEqual(Enc.upgrade(run, 'finisher'), { ok: true, level: 1, cost: 20, unlocked: true });
  assert.equal(run.gold, 20);
  assert.equal(Enc.upgrade(run, 'god_aura').ok, true, '20 gold buys a second first-tier unlock');
  assert.equal(run.gold, 0);
  assert.equal(Enc.upgrade(run, 'counter_attack').ok, false, 'no gold, no unlock');
  // The road pays 150 in all; three guided unlocks (3 × 20) must still leave the first recruit's price.
  assert.ok(X.encounters.reduce((n, e) => n + e.gold, 0) - 3 * X.economy.costs[1] >= X.party.recruitCosts[0], 'the tutorial must fund the first recruit');
  assert.equal(Enc.heroLevel(run), 3);
  // The next encounter's Hiro owns Finisher and resolves it at level 1.
  const enc2 = Enc.create({ encounter: 'road_ambush', seed: 8, run });
  const m = A.SkillSys.manifest(enc2.hero, enc2.hero.actives.find(a => a.skillId === 'finisher'));
  assert.equal(m.level, 1); assert.equal(m.data.executeBelow, X.finisherThresholds.normal);   // flat 50% at every level (GDD §7)
});

// ------------------------------------------------- Finisher windows (GDD §7)
test('the Finisher takes a normal enemy at half health and a boss at a quarter', () => {
  assert.deepEqual(X.finisherThresholds, { normal: 0.50, boss: 0.25 });
  for (const lvl of [1, 2, 3]) {
    const run = Enc.freshRun(); run.levels.finisher = lvl;
    const hero = Enc.makeHero(new A.RNG(3), run);
    const m = A.SkillSys.manifest(hero, hero.actives.find(a => a.skillId === 'finisher'));
    assert.equal(m.data.executeBelow, 0.50, 'level ' + lvl + ' window is flat');
    assert.equal(m.data.requireBelowPct, 0.50, 'level ' + lvl + ' targeting matches the window');
  }
  // A normal enemy: offered under the line, not offered above it.
  const at = (pct, encounter) => {
    const run = Enc.freshRun(); run.levels.finisher = 1;
    const enc = Enc.create({ encounter, seed: 5, run });
    for (const f of enc.st.units.filter(u => u.side === 'b')) f.chp = Math.max(1, Math.round(f.maxHp * pct));
    return enc;
  };
  assert.ok(Enc.skillState(at(0.45, 'road_ambush'), 'finisher').ready, 'a wolf at 45% can be finished');
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
});

test('the retained loop uses only painted Bram; tutorial lock and earned upgrades are respected', () => {
  const Camp = X.Campaign;
  const r1 = Camp.freshRun(); assert.equal(Camp.nextQuestId(r1), 'road');
  // The slice opens one quest at a time (X.slice.openQuests). Round 3 opened Road
  // in the Rain and nothing else: after the tutorial the only place to go is rain,
  // and it repeats rather than rolling on into the city.
  assert.deepEqual(X.slice.openQuests, ['rain'], 'exactly one loop quest is open');
  r1.questsDone.push('road'); assert.equal(Camp.nextQuestId(r1), 'rain', 'the tutorial hands off to the one open quest');
  r1.questsDone.push('rain'); assert.equal(Camp.nextQuestId(r1), 'rain', 'and nothing beyond it opens by itself');
  assert.ok(Camp.questOpen('road') && Camp.questOpen('rain'));
  for (const shut of ['city', 'marsh', 'ruins']) assert.ok(!Camp.questOpen(shut), shut + ' stays locked');
  const savedSlice = X.slice; X.slice = Object.assign({}, X.slice, { firstLevelOnly: false });
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
  } finally { X.slice = savedSlice; }
});

if (verbose) {
  const enc = Enc.create({ encounter: 'road_ambush', seed: 11 });
  Enc.runToEnd(enc);
  console.log(JSON.stringify(summary(enc)));
  for (const e of enc.st.events) console.log(' ', JSON.stringify(e));
}
console.log('expedition_sim: ' + passed + ' checks passed');
