// Adventurer: Expeditions — the arcade rules, in a real browser (Hiro, 2026-09-27).
//   health carries from fight to fight and quest to quest; a fall ends the run
//   on the End scene; the top-10 board takes a name-shaped name only; Play
//   again is a fresh run; Rest at the inn heals for points, dearer each time,
//   never at full health; End run in the pause menu asks once, then ends the
//   run; High scores opens from the pause menu and the inn.
// Usage: node test/browser_arcade.js [--ship]
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const args = new Set(process.argv.slice(2));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const SHIP = args.has('--ship') ? new Set(require('../tools/size_check.js').shipList().files) : null;
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const rel = u === '/' ? 'index.html' : u.replace(/^\//, '');
  const f = path.join(ROOT, rel);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory() || (SHIP && !SHIP.has(rel))) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(r);
});
let passed = 0, failed = 0;
const check = (ok, what, extra) => { if (ok) passed++; else failed++; console.log((ok ? 'PASS ' : 'FAIL ') + what + (extra != null ? '  ' + JSON.stringify(extra) : '')); };
const OUT = path.join(__dirname, 'reports', 'arcade'); fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const pw = require('playwright');
  await new Promise(res => srv.listen(0, '127.0.0.1', res));
  const port = srv.address().port, base = 'http://127.0.0.1:' + port + '/index.html';
  const browser = await pw.chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const active = () => page.evaluate(() => { const s = window.__game.scene.getScenes(true)[0]; return s && s.scene.key; });
  const tap = async r => page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  const waitScene = (key, ms) => page.waitForFunction(k => window.__game && window.__game.scene.isActive(k), key, { timeout: ms || 60000 });

  // ---- 1. health carries; a fall ends the run
  await page.goto(base + '?fresh=1&seed=11&renderer=canvas');
  await waitScene('Expedition', 30000);
  await page.waitForFunction(() => window.__game.scene.getScene('Expedition').enc, null, { timeout: 30000 });
  await page.waitForTimeout(2000);
  // Skip the lessons: the fight plays on its own. Wound Hiro, let the wave end, and see the wound carried.
  await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); Object.assign(s.run.tutorial, { used: { finisher: true, counter_attack: true, god_aura: true }, finisherDone: true }); s.hero.unit.chp = Math.round(s.hero.unit.maxHp * 0.6); });
  await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return s.enc && s.enc.st.over && s.arrowArmed; }, null, { timeout: 90000 });
  await page.waitForTimeout(300);
  const afterWave = await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); return { hp: s.run.hp, max: s.run.hpMax, unit: s.hero.unit.chp, umax: s.hero.unit.maxHp, arrow: !!s.arrowArmed }; });
  check(afterWave.hp != null && afterWave.hp < afterWave.max && afterWave.hp === afterWave.unit, 'health is remembered on the run, below full, after a wave', afterWave);
  // Through travel to the next fight: the unit opens on the carried health.
  await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); s.tapArrow(); });
  await waitScene('Travel', 30000);
  await waitScene('Expedition', 60000);
  await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return window.__game.scene.isActive('Expedition') && s.enc && !s.enc.st.over && s.run.wave === 1 && s.hero && s.hero.unit && s.hero.unit.maxHp > 1 && s.enc.st.units.includes(s.hero.unit); }, null, { timeout: 60000 });
  const wave2 = await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); return { chp: s.hero.unit.chp, max: s.hero.unit.maxHp, run: s.run.hp, first: s.run.questsDone.length === 0 }; });
  check(wave2.first && wave2.chp === wave2.max && wave2.run < wave2.max, 'on the first quest the next fight opens at full health (X.tutorialHeals); the wound stays on the run', wave2);
  // From the second quest on, health carries: make this the second quest and wound Hiro again.
  await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); s.run.questsDone = ['rain']; s.hero.unit.chp = Math.round(s.hero.unit.maxHp * 0.85); });
  await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return s.enc && s.enc.st.over && s.arrowArmed; }, null, { timeout: 90000 });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); s.tapArrow(); });
  await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return window.__game.scene.isActive('Expedition') && s.enc && !s.enc.st.over && s.run.wave === 2 && s.hero && s.hero.unit && s.hero.unit.maxHp > 1 && s.enc.st.units.includes(s.hero.unit); }, null, { timeout: 120000 });
  const wave3 = await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); return { chp: s.hero.unit.chp, max: s.hero.unit.maxHp, run: s.run.hp }; });
  check(wave3.chp === wave3.run && wave3.chp < wave3.max, 'from the second quest the next fight opens on the carried health, not full', wave3);
  // A fall ends the run: wound Hiro to a scratch.
  await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); s.run.score = 2345; s.hero.unit.chp = 3; });
  await waitScene('End', 90000);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, '01-end-name.png') });
  const endState = await page.evaluate(() => { const s = window.__game.scene.getScene('End'); return { place: s.place, score: s.run.score, over: s.run.over, phase: s.run.phase, saved: (ADV.Expedition.Run.load() || {}).phase }; });
  check(endState.over === 'defeat' && endState.phase === 'end' && endState.saved === 'end' && endState.place === 0, 'a fall lands on the End scene, saved as over, and the score makes the empty board', endState);
  // ---- 2. name rules
  const input = await page.$('#xp-name');
  check(!!input, 'a real text field is on screen for the name');
  const tryName = async n => { await page.fill('#xp-name', n); await page.keyboard.press('Enter'); await page.waitForTimeout(150); return page.evaluate(() => ({ hint: window.__game.scene.getScene('End').hint.text, scored: !!window.__game.scene.getScene('End').run.scored })); };
  for (const bad of ['', '12345', '2838', '@#$skfsal', 'adfskdlsfosl', 'uislllslsl@#@11221', 'bob smith', 'a'.repeat(26)]) {
    const r = await tryName(bad);
    check(!r.scored && r.hint.length > 0, 'refused name ' + JSON.stringify(bad) + ' — ' + r.hint);
  }
  const good = await tryName('tyler#2');
  check(good.scored, 'accepted tyler#2');
  const board = await page.evaluate(() => ADV.Expedition.Board.load());
  check(board.length === 1 && board[0].name === 'tyler#2' && board[0].score === 2345 && board[0].loop === 1, 'the board holds the run', board);
  check((await page.$('#xp-name')) === null, 'the text field is gone after the name is taken');
  await page.screenshot({ path: path.join(OUT, '02-end-board.png') });
  // ---- 3. Play again is a fresh run
  const playRect = await page.evaluate(() => window.__game.scene.getScene('End').playRect);
  await tap(playRect);
  await page.waitForTimeout(500);
  await waitScene('Expedition', 60000);
  await page.waitForFunction(() => window.__game.scene.getScene('Expedition').enc, null, { timeout: 30000 });
  const fresh = await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); return { score: s.run.score, questId: s.run.questId, wave: s.run.wave, hp: s.run.hp, done: s.run.questsDone.length, board: ADV.Expedition.Board.load().length }; });
  check(fresh.score === 0 && fresh.questId === 'rain' && fresh.wave === 0 && fresh.hp == null && fresh.done === 0 && fresh.board === 1, 'Play again starts a fresh run at the road; the board survives', fresh);

  // ---- 4. board ordering and ties
  const order = await page.evaluate(() => {
    const B = ADV.Expedition.Board; B.clear();
    B.insert({ name: 'ann', score: 100 }); B.insert({ name: 'bob', score: 300 }); B.insert({ name: 'cat', score: 300 }); B.insert({ name: 'dan', score: 200 });
    for (let i = 0; i < 12; i++) B.insert({ name: 'filler' + i, score: 50 - i });
    const rows = B.load();
    return { names: rows.map(r => r.name), n: rows.length, low: B.placeOf(1), mid: B.placeOf(250) };
  });
  check(order.names.slice(0, 4).join(',') === 'bob,cat,dan,ann' && order.n === 10 && order.low === -1 && order.mid === 2, 'the board sorts high to low, a tie sits below the older run, ten rows only', order);
  await page.evaluate(() => ADV.Expedition.Board.clear());

  // ---- 5. Rest at the inn
  await page.goto(base + '?at=inn&score=1500&seed=5&renderer=canvas');
  await waitScene('Inn', 30000);
  await page.waitForFunction(() => window.__game.scene.getScene('Inn').restBtn, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  let rest = await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); return { r: s.rest(), score: s.run.score, label: s.restBtn.label.text }; });
  check(rest.r.ok === false && rest.r.reason === 'full' && rest.score === 1500 && /full health/.test(rest.label), 'Rest is refused at full health', rest);
  rest = await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); s.run.hp = 100; s.run.hpMax = 334; s.refreshRest(); const before = s.restBtn.label.text; const r = s.rest(); s.run.hp = 100; s.refreshRest(); return { before, r, score: s.run.score, rests: s.run.rests, label: s.restBtn.label.text }; });
  check(/1000/.test(rest.before) && rest.r.ok && rest.r.cost === 1000 && rest.score === 500 && rest.rests === 1 && /2000/.test(rest.label), 'Rest heals to full for 1,000 and the next one costs 2,000', rest);
  rest = await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); return { r: s.rest(), score: s.run.score, hp: s.run.hp }; });
  check(rest.r.ok === false && rest.r.reason === 'score' && rest.score === 500 && rest.hp === 100, 'Rest is refused when the score cannot pay', rest);
  rest = await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); s.run.score = 7000; s.refreshRest(); const a = s.rest(); s.run.hp = 10; s.refreshRest(); const b = s.rest(); return { a, b, score: s.run.score, rests: s.run.rests }; });
  check(rest.a.ok && rest.a.cost === 2000 && rest.b.ok && rest.b.cost === 4000 && rest.score === 1000 && rest.rests === 3, 'second and third rests cost 2,000 and 4,000', rest);
  await page.screenshot({ path: path.join(OUT, '03-inn-rest.png') });
  const innButtons = await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); return { rest: !!s.restBtn, board: !!s.boardBtn, embark: !!s.embarkBtn, replay: !!s.replayBtn, locked: s.lockedButtons.length }; });
  check(innButtons.rest && innButtons.board && innButtons.embark && !innButtons.replay && innButtons.locked === 0, 'the inn offers Rest, High scores and Embark only', innButtons);
  // High scores from the inn
  await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); s.__panel = ADV.Expedition.UI.boardPanel(s); });
  await page.waitForTimeout(300);
  check(await page.evaluate(() => window.__game.scene.getScene('Inn').__boardOpen === true), 'the board panel opens at the inn');
  await page.screenshot({ path: path.join(OUT, '04-inn-board.png') });
  await page.evaluate(() => window.__game.scene.getScene('Inn').__panel.close());

  // ---- 6. End run from the pause menu, at the inn and in a fight
  await page.evaluate(() => { const s = window.__game.scene.getScene('Inn'); s.corner.togglePause(); });
  await page.waitForTimeout(300);
  const pb = await page.evaluate(() => window.__game.scene.getScene('Inn').__pauseButtons);
  check(!!(pb && pb.end && pb.board), 'the pause menu has End run and High scores', pb);
  await tap(pb.end); await page.waitForTimeout(300);
  const conf = await page.evaluate(() => window.__game.scene.getScene('Inn').__endConfirmRect);
  check(!!conf, 'End run asks once');
  await tap(conf);
  await waitScene('End', 30000);
  await page.waitForTimeout(800);
  const quit = await page.evaluate(() => { const s = window.__game.scene.getScene('End'); return { why: s.run.over, score: s.run.score, place: s.place }; });
  check(quit.why === 'quit' && quit.place === 0, 'End run from the inn lands on the End scene with the score', quit);
  await page.screenshot({ path: path.join(OUT, '05-end-quit.png') });
  // And from a fight.
  await page.goto(base + '?fresh=1&seed=12&renderer=canvas');
  await waitScene('Expedition', 30000);
  await page.waitForFunction(() => window.__game.scene.getScene('Expedition').enc, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const s = window.__game.scene.getScene('Expedition'); s.run.score = 777; s.corner.togglePause(); });
  await page.waitForTimeout(300);
  const pb2 = await page.evaluate(() => window.__game.scene.getScene('Expedition').__pauseButtons);
  // The community links sit on the pause screen only (CrazyGames: menu only), open in a new tab, and never navigate the game.
  const linkTap = await page.evaluate(async () => {
    const X = ADV.Expedition, opened = []; const orig = X.UI.openLink; X.UI.openLink = u => opened.push(u);
    const s = window.__game.scene.getScene('Expedition'), r = s.__pauseButtons.links[0];
    const walk = l => { for (const o of l) { if (o.type === 'Zone') { const wx = o.x + (o.parentContainer ? o.parentContainer.x : 0), wy = o.y + (o.parentContainer ? o.parentContainer.y : 0); if (Math.abs(wx - (r.x + r.w / 2)) < 2 && Math.abs(wy - (r.y + r.h / 2)) < 2) o.emit('pointerdown'); } if (o.list) walk(o.list); } };
    walk(s.children.list);
    X.UI.openLink = orig;
    return { links: s.__pauseButtons.links.map(l => l.id), opened, url: location.href.split('?')[0], stillPaused: s.paused };
  });
  check(linkTap.links.length === 2 && linkTap.opened.length >= 1 && /facebook\.com/.test(linkTap.opened[0]) && linkTap.stillPaused, 'the pause screen offers two community links that open through UI.openLink and leave the game where it is', linkTap);
  await tap(pb2.end); await page.waitForTimeout(300);
  const conf2 = await page.evaluate(() => window.__game.scene.getScene('Expedition').__endConfirmRect);
  await tap(conf2);
  await waitScene('End', 30000);
  await page.waitForTimeout(600);
  const quit2 = await page.evaluate(() => { const s = window.__game.scene.getScene('End'); return { why: s.run.over, score: s.run.score, expeditionActive: window.__game.scene.isActive('Expedition') }; });
  check(quit2.why === 'quit' && quit2.score === 777 && !quit2.expeditionActive, 'End run mid-fight leaves the fight and lands on the End scene', quit2);
  // A reload lands back on the End scene, not in a fight.
  await page.goto(base + '?seed=12&renderer=canvas');
  await page.waitForTimeout(2500);
  check((await active()) === 'End', 'a reload of an ended run reopens the End scene');

  // ---- 7. Loop 2+: a three-boss wave fits the stage and plays
  await page.goto(base + '?fresh=1&seed=12&renderer=canvas');
  await waitScene('Expedition', 30000);
  await page.waitForFunction(() => window.__game.scene.getScene('Expedition').enc, null, { timeout: 30000 });
  const triple = await page.evaluate(() => {
    const X = ADV.Expedition, Camp = X.Campaign, s = window.__game.scene.getScenes(true)[0];
    // A run on its fourth playthrough, with a seed that rolls three bosses on the forest road.
    let run = null;
    for (let seed = 1; seed < 400 && !run; seed++) {
      const r = X.Run.reset(); r.seed = seed; for (let l = 1; l < 4; l++) for (const id of X.slice.openQuests) r.questsDone.push(id);
      Camp.sanitizeRun(r);
      const e = Camp.questEncounters('rain', r)[2];
      if (e.enemies.length === 3) { run = r; run.questId = 'rain'; run.wave = 2; run.checkpoint = 2; run.phase = 'quest'; run.score = 9000; }
    }
    Object.assign(run.tutorial, { used: { finisher: true, counter_attack: true, god_aura: true }, finisherDone: true, arrowDone: true });
    X.Run.save(run); X.Dev.go(s, 'Expedition', { run });
    return { seed: run.seed, loop: run.loop, enemies: Camp.questEncounters('rain', run)[2].enemies, scale: Camp.scaleFor(run) };
  });
  check(triple.loop === 4 && triple.enemies.length === 3 && triple.scale.toFixed(3) === '2.197', 'a fourth-playthrough forest boss wave rolled three bosses', triple);
  await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return s.enc && s.run.wave === 2 && [...s.actors.values()].filter(a => a.side === 'b').length === 3; }, null, { timeout: 60000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(OUT, '06-three-bosses.png') });
  const layout = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Expedition');
    const foes = [...s.actors.values()].filter(a => a.side === 'b').map(a => ({ name: a.name, x: a.home.x, w: Math.round(a.img.displayWidth), boss: !!a.unit.ch.boss, hp: a.unit.maxHp }));
    return { foes, heroX: s.hero.home.x };
  });
  const xs = layout.foes.map(f => f.x).sort((a, b) => a - b);
  check(layout.foes.every(f => f.boss) && xs[0] > layout.heroX + 250 && xs[2] <= 1215 && xs[1] - xs[0] > 100 && xs[2] - xs[1] > 100, 'three bosses stand on the stage, spaced, clear of Hiro', layout);
  // Finish one of them: the boss line (25%) and the paired finisher still hold at loop 4.
  const fin = await page.evaluate(async () => {
    const X = ADV.Expedition, Enc = X.Encounter, s = window.__game.scene.getScene('Expedition'), enc = s.enc;
    const foes = enc.st.units.filter(u => u.side === 'b' && !u.downed);
    for (const u of foes) u.chp = u.maxHp;
    const mark = foes[1]; mark.chp = Math.max(1, Math.round(mark.maxHp * 0.2));
    const seen = new Set(); const iv = setInterval(() => { for (const a of s.actors.values()) { const k = a.img && a.img.anims && a.img.anims.currentAnim && a.img.anims.currentAnim.key; if (k) seen.add(k); } }, 25);
    Enc.requestSkill(enc, 'finisher');
    const t = Date.now(); while (Date.now() - t < 20000 && !(mark.downed || mark.chp <= 0)) await new Promise(r => setTimeout(r, 60));
    await new Promise(r => setTimeout(r, 2500)); clearInterval(iv);
    return { target: mark.ch.expeditionKey, killed: !!(mark.downed || mark.chp <= 0), paired: [...seen].filter(k => /paired|:hiro-finisher-[12]$/.test(k)), left: enc.st.units.filter(u => u.side === 'b' && !u.downed).length };
  });
  check(fin.killed && fin.paired.length > 0 && fin.left === 2, 'the Finisher takes one boss of three with its paired move', fin);

  check(errs.length === 0, 'no page errors', errs.slice(0, 3));
  await browser.close(); srv.close();
  console.log('browser_arcade: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
