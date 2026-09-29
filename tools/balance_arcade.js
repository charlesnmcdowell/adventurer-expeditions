'use strict';
// Adventurer: Expeditions — arcade balance probe (2026-09-28).
// Plays whole runs headlessly through the shipped engine: Hiro alone, health
// carrying between fights, Rest at the inn by a simple policy, scoring and
// loop rules exactly as the game applies them. Prints where runs end and what
// they score, for the no-tap player and for a player who taps every skill the
// moment it is ready. Nothing here changes game data.
//   node tools/balance_arcade.js [--runs 200] [--rest 0.5] [--max-loops 6]
const path = require('node:path'), fs = require('node:fs'), vm = require('node:vm');
const H = require(path.join(__dirname, '..', 'test', 'harness.js'));
const ROOT = path.join(__dirname, '..');
const A = H.load();
for (const f of ['js/expedition/data.js', 'js/expedition/shim.js', 'js/expedition/encounter.js', 'js/expedition/campaign.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
}
const X = A.Expedition, Enc = X.Encounter, Camp = X.Campaign;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
const RUNS = arg('--runs', 200), REST_AT = arg('--rest', 0.5), MAX_LOOPS = arg('--max-loops', 6);

const tapAll = e => { for (const id of ['finisher', 'counter_attack', 'god_aura']) if (Enc.skillState(e, id).ready) Enc.requestSkill(e, id); };

// One whole run. Returns where it ended and the score.
function playRun(seed, policy, restAt) {
  const run = Camp.freshRun(); run.seed = seed; Camp.sanitizeRun(run);
  let quests = 0, rests = 0, waves = 0;
  for (;;) {
    const qid = Camp.nextQuestId(run);
    const loop = Camp.loopOf(run);
    if (loop > MAX_LOOPS) return { end: 'cap', loop, quests, score: run.score, rests, waves, qid };
    // At the inn before embarking: Rest when hurt enough and affordable.
    if (restAt > 0 && !Enc.atFullHp(run) && run.hp / run.hpMax < restAt && Enc.canRest(run).ok) { Enc.rest(run); rests++; }
    run.awarded = []; run.questId = qid; run.loop = loop;
    const encs = Camp.questEncounters(qid, run), scale = Camp.scaleFor(run);
    let w = 0;
    for (const encDef of encs) {
      const enc = Enc.create({ encounter: encDef, seed: (seed * 131 + quests * 7 + w) >>> 0, run, scale });
      Enc.runToEnd(enc, policy, 800);
      const hero = Enc.heroUnit(enc);
      Enc.rememberHp(run, hero);
      waves++;
      if (!Enc.won(enc)) return { end: 'defeat', loop, quests, score: run.score, rests, waves, qid, wave: w, foes: encDef.enemies };
      Enc.award(enc);
      w++;
    }
    Enc.awardQuest(run); run.questsDone.push(qid); quests++;
  }
}

function summarize(label, results) {
  const n = results.length;
  const scores = results.map(r => r.score).sort((a, b) => a - b);
  const q = p => scores[Math.min(n - 1, Math.floor(p * n))];
  const byLoop = {}; for (const r of results) byLoop[r.loop] = (byLoop[r.loop] || 0) + 1;
  const byQuest = {}; for (const r of results) if (r.end === 'defeat') { const k = 'L' + r.loop + ' ' + r.qid + ' w' + r.wave; byQuest[k] = (byQuest[k] || 0) + 1; }
  const top = Object.entries(byQuest).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + (100 * v / n).toFixed(0) + '%').join(', ');
  console.log('\n== ' + label + ' (' + n + ' runs)');
  console.log('  ended on loop: ' + Object.entries(byLoop).map(([l, c]) => 'L' + l + ' ' + (100 * c / n).toFixed(0) + '%').join('  '));
  console.log('  quests cleared: median ' + median(results.map(r => r.quests)) + ', mean ' + mean(results.map(r => r.quests)).toFixed(1));
  console.log('  score: p10 ' + q(0.1) + '  median ' + q(0.5) + '  p90 ' + q(0.9) + '  max ' + scores[n - 1] + '  (mean rests ' + mean(results.map(r => r.rests)).toFixed(2) + ')');
  console.log('  where runs die: ' + (top || 'never (loop cap)'));
  return { median: q(0.5), p90: q(0.9), max: scores[n - 1] };
}
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const median = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

console.log('arcade balance: ' + RUNS + ' runs per policy, Rest below ' + Math.round(REST_AT * 100) + '% hp, loop cap ' + MAX_LOOPS);
console.log('scoring ' + JSON.stringify(X.scoring) + ' rest ' + JSON.stringify(X.rest) + ' scale x' + Camp.scaleFor({ questsDone: X.slice.openQuests.slice() }).toFixed(2) + ' per loop');
// A first-timer who does what the tutorial hand asks on the first quest and
// nothing after (2026-09-28 rules): Counter the first time it is ready, Finisher
// whenever it is ready, Counter whenever under half health, Aura once on the boss.
const tutorialOnly = e => {
  if (e.run.questsDone.length) return;
  const u = Enc.heroUnit(e); if (!u) return;
  if (!e.run.__counterTaught && Enc.skillState(e, 'counter_attack').ready) { Enc.requestSkill(e, 'counter_attack'); e.run.__counterTaught = true; return; }
  if (Enc.skillState(e, 'finisher').ready) { Enc.requestSkill(e, 'finisher'); return; }
  if (u.chp / u.maxHp < (X.tutorialLowHp || 0.5) && Enc.skillState(e, 'counter_attack').ready) { Enc.requestSkill(e, 'counter_attack'); return; }
  if (e.def && e.def.boss && !e.run.__auraTaught && Enc.skillState(e, 'god_aura').ready) { Enc.requestSkill(e, 'god_aura'); e.run.__auraTaught = true; }
};
// A casual player: notices a ready skill about half the time.
let casualSeed = 1; const casualRng = () => { casualSeed = (casualSeed * 1103515245 + 12345) & 0x7fffffff; return casualSeed / 0x7fffffff; };
const casual = e => { for (const id of ['finisher', 'counter_attack', 'god_aura']) if (Enc.skillState(e, id).ready && casualRng() < 0.5) Enc.requestSkill(e, id); };
const out = {};
for (const [label, policy] of [['no tap (auto)', null], ['tutorial taps only, then nothing', tutorialOnly], ['casual: taps half the time', casual], ['taps every ready skill', tapAll]]) {
  const rs = []; for (let s = 1; s <= RUNS; s++) rs.push(playRun(s, policy, REST_AT));
  out[label] = summarize(label, rs);
}
// The same good player at other Rest thresholds, to price the inn.
for (const at of [0, 0.75, 1]) { const rs = []; for (let s = 1; s <= RUNS; s++) rs.push(playRun(s, tapAll, at)); summarize('taps every ready skill, Rest ' + (at ? 'below ' + Math.round(at * 100) + '%' : 'never'), rs); }
// A top-10 board after N casual runs: what the tenth place would read.
{
  const rs = []; for (let s = 1; s <= RUNS; s++) rs.push(playRun(s, (s % 2) ? tapAll : null, REST_AT));
  const s = rs.map(r => r.score).sort((a, b) => b - a);
  console.log('\n== a mixed board after ' + RUNS + ' runs: #1 ' + s[0] + '  #10 ' + s[9] + '  #50 ' + (s[49] || '-'));
}
