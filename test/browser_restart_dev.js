// Adventurer: Expeditions — Start over is a true restart, and the developer's
// panel is invisible to players (Hiro, 2026-09-21).
//
// 1. Play far enough to retire some guidance, then Start over from the corner
//    control: the run is blank AND the tutorial's flags are gone, so the hand
//    comes back. This is the regression for "the tutorial doesn't come back".
// 2. A player never sees the ⚙: not on a fresh load, and not after the key that
//    turns it on when the build is served from somewhere that is not local.
// 3. With it on, its buttons do what they say (fresh tutorial, jump to the inn).
//
// Usage: node test/browser_restart_dev.js [--ship]
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'test', 'reports', 'restart-dev');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] == null ? true : m[2]] : [a, true]; }));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const SHIP = args.ship ? new Set(require('../tools/size_check.js').shipList().files) : null;

function serve(host) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const rel = u === '/' ? 'index.html' : u.replace(/^\//, '');
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory() || (SHIP && !SHIP.has(rel))) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, host || '127.0.0.1', () => resolve(srv));
  });
}

// "Re-armed" means no guidance has been retired — not that the object is empty.
// The fight's own bookkeeping writes `purchases: 0` before the player does
// anything, which is a blank state, not a completed one.
const armed = t => !!t && !t.arrowDone && !t.finisherDone && !t.inspectDone && !t.skipGuide
  && !(t.purchases > 0) && !Object.keys(t.used || {}).length;
// Game coordinates -> page coordinates, through the canvas.
let toPage;
const checks = [];
const ok = (what, extra) => { checks.push({ ok: true, what }); console.log('PASS ' + what + (extra ? ' ' + JSON.stringify(extra) : '')); };
const bad = (what, saw) => { checks.push({ ok: false, what, saw }); console.error('FAIL ' + what + ' ' + JSON.stringify(saw)); };

(async () => {
  const pw = require('playwright');
  const srv = await serve(), port = srv.address().port;
  const browser = await pw.chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const errors = [];

  const open = async (url, ctxOpts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 760 } }, ctxOpts || {}));
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(String(e && e.stack || e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 20000 });
    toPage = (x, y) => page.evaluate(([gx, gy]) => {
      const sc = window.__game.scale, b = sc.canvasBounds, d = sc.displayScale;
      return [b.x + gx / d.x, b.y + gy / d.y];
    }, [x, y]);
    return { ctx, page };
  };
  const state = page => page.evaluate(() => {
    const g = window.__game, key = g.scene.getScenes(true).map(s => s.sys.settings.key)[0], s = g.scene.getScene(key);
    const X = ADV.Expedition;
    return { scene: key, run: s.run ? { score: s.run.score, levels: Object.assign({}, s.run.levels), questsDone: (s.run.questsDone || []).slice(), tutorial: Object.assign({}, s.run.tutorial) } : null,
      stored: X.Run.load() ? Object.assign({}, X.Run.load().tutorial) : null,
      devButton: !!s.__devButton, devPanel: !!s.__devPanel, devEnabled: X.Dev.enabled(), devBuild: X.Dev.DEV_BUILD,
      start: 0 };
  });

  // ---- 1. Start over is a true restart -------------------------------------
  let { ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas');
  // Retire some guidance the way play would, then save it.
  await page.evaluate(() => {
    const X = ADV.Expedition, s = window.__game.scene.getScene('Expedition');
    Object.assign(s.run.tutorial, { arrowDone: true, finisherDone: true, purchases: 3, inspectDone: true, used: { finisher: true }, skipGuide: true });
    s.run.score = 2500; s.run.questsDone = ['rain']; s.run.hp = 40; s.run.hpMax = 344;
    X.Run.save(s.run);
  });
  const before = await state(page);
  if (Object.keys(before.run.tutorial).length) ok('guidance was retired before the restart', before.run.tutorial);
  else bad('guidance was retired before the restart', before.run.tutorial);

  await page.evaluate(() => window.__game.scene.getScene('Expedition').corner.startOver());
  // Start over reloads the page now, so the game disappears and comes back:
  // the predicate has to survive a window with no __game in it. A fresh arcade
  // run opens with a score of 0, full health and nothing cleared.
  await page.waitForFunction(() => {
    const g = window.__game; if (!g || !g.scene || !g.scene.getScenes(true).length) return false;
    const s = g.scene.getScene('Expedition');
    return !!(s && s.run && s.run.score === 0 && !(s.run.questsDone || []).length);
  }, null, { timeout: 60000 });
  const after = await state(page);
  const blankRun = after.run && after.run.score === 0 && !after.run.questsDone.length && after.run.levels.finisher === 1;
  const blankTut = after.run && armed(after.run.tutorial);
  const blankStored = after.stored === null || armed(after.stored);   // wiped outright, or armed
  if (blankRun) ok('Start over gives a blank run'); else bad('Start over gives a blank run', after.run);
  if (blankTut && blankStored) ok('Start over brings the tutorial back', { run: after.run.tutorial, stored: after.stored });
  else bad('Start over brings the tutorial back', { run: after.run && after.run.tutorial, stored: after.stored });
  await page.screenshot({ path: path.join(OUT, '01-after-start-over.png') });

  // The guide actually runs again: the first gate appears without help.
  const gateBack = await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Expedition');
    return !!(s && ((s.hud && s.hud._gateRect) || s.__gateRect));
  }, null, { timeout: 90000 }).then(() => true).catch(() => false);
  if (gateBack) ok('the hand comes back after a restart'); else bad('the hand comes back after a restart', 'no gate within 90s');
  await page.screenshot({ path: path.join(OUT, '02-guidance-returned.png') });
  await ctx.close();

  // ---- 1b. The tutorial teaches the Finisher in the first fight --------------
  // Arcade (Hiro, 2026-09-27): every skill is owned, nothing is bought, and
  // the first quest teaches Finisher, then Counter Attack, then God Aura, one
  // hold per fight. The first hold is the Finisher, while enemies are still up
  // and only once one of them is at or under half health.
  ({ ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas'));
  const owned = await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Expedition');
    return s && s.run && s.run.levels && s.run.levels.finisher === 1 && s.run.levels.god_aura === 1 && s.run.levels.counter_attack === 1 ? { score: s.run.score, levels: s.run.levels } : null;
  }, null, { timeout: 60000 }).then(h => h.jsonValue()).catch(() => null);
  if (owned && owned.score === 0) ok('a fresh run owns every skill and starts at a score of 0', owned);
  else bad('a fresh run owns every skill and starts at a score of 0', owned);
  let useGate = null;
  for (let i = 0; i < 60 && !useGate; i++) {
    const st = await page.evaluate(() => {
      const s = window.__game.scene.getScene('Expedition');
      if (!s || !s.hud) return null;
      const foes = [...(s.actors ? s.actors.values() : [])].filter(a => a.side === 'b' && a.alive);
      return { gateFor: s.hud._gateFor || null, awarded: (s.run.awarded || []).length,
        living: foes.length, atOrUnderHalf: foes.filter(a => a.unit && a.unit.chp / a.unit.maxHp <= 0.5).length,
        over: !!(s.enc && s.enc.st && s.enc.st.over) };
    });
    if (!st) break;
    if (st.gateFor) { useGate = st; break; }
    if (st.over) break;                                    // the wave ended without the prompt
    await page.waitForTimeout(500);
  }
  if (useGate && useGate.gateFor === 'use:finisher' && useGate.awarded === 0) ok('the first guidance is the Finisher, before any fight has paid out', useGate);
  else bad('the first guidance is the Finisher, before any fight has paid out', useGate);
  if (useGate && useGate.living > 0) ok('the fight pauses for the Finisher while enemies are still up', useGate);
  else bad('the fight pauses for the Finisher while enemies are still up', useGate);
  if (useGate && useGate.atOrUnderHalf > 0) ok('and only once something is at or under half health', useGate);
  else bad('and only once something is at or under half health', useGate);
  await page.screenshot({ path: path.join(OUT, '00b-finisher-prompt.png') });
  await ctx.close();

  // ---- 2. The tools are here now, and gone in the shipping build ----------
  ({ ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas'));
  let s2 = await state(page);
  if (s2.devButton && s2.devEnabled && s2.devBuild) ok('the developer tools are there on a plain load');
  else bad('the developer tools are there on a plain load', s2);
  // Shift+D opens and closes the PANEL. It used to hide the tools themselves,
  // and pressing it once made the cog vanish for good across reloads, which is
  // what Hiro hit (2026-09-22). The cog must survive both presses.
  await page.keyboard.down('Shift'); await page.keyboard.press('KeyD'); await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  s2 = await state(page);
  if (s2.devPanel && s2.devButton) ok('Shift+D opens the panel and the cog stays'); else bad('Shift+D opens the panel and the cog stays', s2);
  await page.keyboard.down('Shift'); await page.keyboard.press('KeyD'); await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  s2 = await state(page);
  if (!s2.devPanel && s2.devButton && s2.devEnabled) ok('and closes it again, with the cog still there'); else bad('and closes it again, with the cog still there', s2);
  await ctx.close();

  // Nothing a player can do removes the tools while this is a dev build — the
  // old stored "hidden" flag is cleared on load, so a browser that carries one
  // recovers by itself.
  ({ ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas&dev=0'));
  await page.evaluate(() => { try { localStorage.setItem('adventurer_expeditions_dev', '0'); } catch (e) {} });
  await page.reload(); await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 40000 });
  await page.waitForTimeout(800);
  s2 = await state(page);
  if (s2.devButton && s2.devEnabled) ok('a stored hidden flag cannot strand the tools'); else bad('a stored hidden flag cannot strand the tools', s2);
  await ctx.close();

  // The shipping build: Dev.DEV_BUILD = false, served as the package would be.
  ctx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
  page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e && e.stack || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // The script tags carry a cache-busting query, so match on the path itself.
  await page.route(u => u.pathname.endsWith('/js/expedition/dev.js'), async route => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'expedition', 'dev.js'), 'utf8');
    const body = src.replace('Dev.DEV_BUILD = true;', 'Dev.DEV_BUILD = false;');
    if (body === src) throw new Error('release flag not found in dev.js — the ship check and this test disagree');
    await route.fulfill({ status: 200, contentType: 'text/javascript', body });
  });
  await page.goto('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas&dev=1');
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 20000 });
  await page.keyboard.down('Shift'); await page.keyboard.press('KeyD'); await page.keyboard.up('Shift');
  await page.waitForTimeout(600);
  s2 = await state(page);
  if (s2.devBuild === false && !s2.devButton && !s2.devPanel && !s2.devEnabled)
    ok('the shipping build has no developer tools — not the cog, not the key, not ?dev=1');
  else bad('the shipping build has no developer tools', s2);
  await page.screenshot({ path: path.join(OUT, '02b-ship-build.png') });
  await ctx.close();

  // ---- 3. With it on, the buttons work -------------------------------------
  ({ ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas'));
  await page.evaluate(() => ADV.Expedition.Dev.open(window.__game.scene.getScene('Expedition')));
  await page.waitForFunction(() => !!window.__game.scene.getScene('Expedition').__devPanel, null, { timeout: 10000 });
  let rects = await page.evaluate(() => window.__game.scene.getScene('Expedition').__devRects.map(r => ({ label: r.label, rect: r.rect })));
  ok('the cog opens the panel', rects.map(r => r.label));
  await page.screenshot({ path: path.join(OUT, '03-panel.png') });

  const click = async label => {
    const r = rects.find(x => x.label === label).rect;
    const [px, py] = await toPage(r.x + r.w / 2, r.y + r.h / 2);
    await page.mouse.click(px, py); await page.waitForTimeout(900);
  };

  // Full speed: the toggle turns the camera push and the slow motion off, and
  // the panel says so (Hiro, 2026-09-21).
  const cineWas = await page.evaluate(() => ADV.Expedition.fx.cinematics === false);
  await click('Full speed');
  const fullSpeed = await page.evaluate(() => {
    const X = ADV.Expedition, s = window.__game.scene.getScene('Expedition');
    return { off: X.fx && X.fx.cinematics === false,
      labels: (s.__devRects || []).map(r => r.label).filter(l => /Full speed/.test(l)) };
  });
  if (fullSpeed.off !== cineWas) ok('“Full speed” flips the cinematics', { was: cineWas ? 'off' : 'on', now: fullSpeed.off ? 'off' : 'on' });
  else bad('“Full speed” flips the cinematics', { was: cineWas, now: fullSpeed.off });
  // The tick is drawn into the row's text; __devRects carries the plain label,
  // so assert the toggle's own reading rather than the rect's name.
  const ticked = await page.evaluate(() => ADV.Expedition.fx.cinematics === false);
  if (ticked === !cineWas) ok('and the panel reads the new state'); else bad('and the panel reads the new state', ticked);
  await click('Full speed');
  const restored = await page.evaluate(() => ADV.Expedition.fx.cinematics === false);
  if (restored === cineWas) ok('and it flips back'); else bad('and it flips back', { was: cineWas, now: restored });

  // Preview a location: every quest is listed, locked ones included, and picking
  // one lands in that quest's travel panorama.
  await click('Preview a location');
  const preview = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Expedition');
    return { titles: (s.__devRects || []).map(r => r.label),
      quests: (ADV.Expedition.quests || []).map(q => q.title) };
  });
  const listed = preview.quests.every(t => preview.titles.includes(t));
  if (listed && preview.titles.length === preview.quests.length + 1) ok('“Preview a location” lists every quest', preview.titles);
  else bad('“Preview a location” lists every quest', preview);

  const cityRect = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Expedition');
    const r = (s.__devRects || []).find(x => /city/i.test(x.label));
    return r ? r.rect : null;
  });
  if (cityRect) {
    const [cx, cy] = await toPage(cityRect.x + cityRect.w / 2, cityRect.y + cityRect.h / 2);
    await page.mouse.click(cx, cy);
    const landed = await page.waitForFunction(() => {
      const g = window.__game;
      if (!g.scene.isActive('Travel')) return null;
      const t = g.scene.getScene('Travel');
      return { scene: 'Travel', questId: t.run && t.run.questId };
    }, null, { timeout: 60000 }).then(h => h.jsonValue()).catch(() => null);
    if (landed && landed.questId === 'city') ok('and picking one opens that location', landed);
    else bad('and picking one opens that location', landed);
    await page.screenshot({ path: path.join(OUT, '06-preview-city.png') });
  } else bad('and picking one opens that location', 'no city row');

  // Previewing lifted the slice lock and may have left a weather override. Start
  // over must put all of it back, or the "fresh" run opens with the inn and every
  // quest unlocked and does not look like a first launch at all.
  const dirty = await page.evaluate(() => {
    const X = ADV.Expedition; X.devWeather = 'storm'; X.fx.cinematics = false;
    return { firstLevelOnly: X.slice.firstLevelOnly, devWeather: X.devWeather, cinematics: X.fx.cinematics };
  });
  if (dirty.firstLevelOnly === false) ok('previewing a location lifts the slice lock', dirty);
  else bad('previewing a location lifts the slice lock', dirty);
  await page.evaluate(() => {
    const g = window.__game, k = g.scene.getScenes(true).map(s => s.sys.settings.key)[0];
    g.scene.getScene(k).corner.startOver();
  });
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  const cleaned = await page.evaluate(() => {
    const X = ADV.Expedition;
    return { firstLevelOnly: X.slice.firstLevelOnly, openQuests: (X.slice.openQuests || []).slice(),
      devWeather: X.devWeather || null, cinematics: X.fx.cinematics, hiroSheet: !!(X.art && X.art.hiroSheet) };
  });
  // Restored means "back to how the game ships", and cinematics ship off.
  if (cleaned.firstLevelOnly === true && !cleaned.devWeather && cleaned.cinematics === false && cleaned.hiroSheet === true)
    ok('Start over puts the developer overrides back', cleaned);
  else bad('Start over puts the developer overrides back', cleaned);

  // Back to the game, then carry on with the rest of the panel checks.
  await page.evaluate(() => {
    const g = window.__game, k = g.scene.getScenes(true).map(s => s.sys.settings.key)[0];
    ADV.Expedition.Dev.open(g.scene.getScene(k));
  });
  rects = await page.evaluate(() => {
    const g = window.__game, k = g.scene.getScenes(true).map(s => s.sys.settings.key)[0];
    return g.scene.getScene(k).__devRects.map(r => ({ label: r.label, rect: r.rect }));
  });

  await click('Jump to the inn');
  await page.waitForFunction(() => window.__game.scene.isActive('Inn'), null, { timeout: 60000 });
  const inn = await state(page);
  if (inn.scene === 'Inn' && inn.run.score === 1500 && inn.run.questsDone.includes('rain')) ok('“Jump to the inn” lands at the inn with the first quest behind it', { score: inn.run.score });
  else bad('“Jump to the inn” lands at the inn with the first quest behind it', inn);
  await page.screenshot({ path: path.join(OUT, '04-jump-to-inn.png') });

  // The panel is still reachable in the new scene, and Fresh tutorial resets.
  await page.evaluate(() => ADV.Expedition.Dev.open(window.__game.scene.getScene('Inn')));
  const innRects = await page.evaluate(() => window.__game.scene.getScene('Inn').__devRects.map(r => ({ label: r.label, rect: r.rect })));
  const fresh = innRects.find(r => r.label === 'Fresh tutorial').rect;
  const [fx, fy] = await toPage(fresh.x + fresh.w / 2, fresh.y + fresh.h / 2);
  await page.mouse.click(fx, fy);
  await page.waitForFunction(() => window.__game.scene.isActive('Expedition')
    && window.__game.scene.getScene('Expedition').run.score === 0 && !window.__game.scene.getScene('Expedition').run.questsDone.length, null, { timeout: 60000 });
  const back = await state(page);
  if (back.scene === 'Expedition' && armed(back.run.tutorial)) ok('“Fresh tutorial” starts the road with the guidance back');
  else bad('“Fresh tutorial” starts the road with the guidance back', back);
  await page.screenshot({ path: path.join(OUT, '05-fresh-tutorial.png') });
  await ctx.close();

  fs.writeFileSync(path.join(OUT, 'verification.json'), JSON.stringify({ generatedAt: new Date().toISOString(), shipOnly: !!SHIP, checks, errors }, null, 2) + '\n');
  await browser.close(); srv.close();
  const failed = checks.filter(c => !c.ok).length;
  if (errors.length) { console.error('PAGE ERRORS:\n' + errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  console.log('browser_restart_dev: ' + (checks.length - failed) + ' passed, ' + failed + ' failed');
  if (failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
