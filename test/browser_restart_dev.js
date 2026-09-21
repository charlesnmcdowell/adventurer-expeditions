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
    return { ctx, page };
  };
  const state = page => page.evaluate(() => {
    const g = window.__game, key = g.scene.getScenes(true).map(s => s.sys.settings.key)[0], s = g.scene.getScene(key);
    const X = ADV.Expedition;
    return { scene: key, run: s.run ? { gold: s.run.gold, levels: Object.assign({}, s.run.levels), questsDone: (s.run.questsDone || []).slice(), tutorial: Object.assign({}, s.run.tutorial) } : null,
      stored: X.Run.load() ? Object.assign({}, X.Run.load().tutorial) : null,
      devButton: !!s.__devButton, devPanel: !!s.__devPanel, devEnabled: X.Dev.enabled(), devBuild: X.Dev.DEV_BUILD };
  });

  // ---- 1. Start over is a true restart -------------------------------------
  let { ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas');
  // Retire some guidance the way play would, then save it.
  await page.evaluate(() => {
    const X = ADV.Expedition, s = window.__game.scene.getScene('Expedition');
    Object.assign(s.run.tutorial, { arrowDone: true, finisherDone: true, purchases: 3, inspectDone: true, used: { finisher: true }, skipGuide: true });
    s.run.gold = 250; s.run.levels.finisher = 2; s.run.questsDone = ['road'];
    X.Run.save(s.run);
  });
  const before = await state(page);
  if (Object.keys(before.run.tutorial).length) ok('guidance was retired before the restart', before.run.tutorial);
  else bad('guidance was retired before the restart', before.run.tutorial);

  await page.evaluate(() => window.__game.scene.getScene('Expedition').corner.startOver());
  await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return s && s.run && s.run.gold === 0; }, null, { timeout: 15000 });
  const after = await state(page);
  const blankRun = after.run && after.run.gold === 0 && !after.run.questsDone.length && after.run.levels.finisher === 0;
  const blankTut = after.run && Object.keys(after.run.tutorial).length === 0;
  const blankStored = after.stored && Object.keys(after.stored).length === 0;
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

  // ---- 2. The tools are here now, and gone in the shipping build ----------
  ({ ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas'));
  let s2 = await state(page);
  if (s2.devButton && s2.devEnabled && s2.devBuild) ok('the developer tools are there on a plain load');
  else bad('the developer tools are there on a plain load', s2);
  // Shift+D takes them away for a player's-eye look, and brings them back.
  await page.keyboard.down('Shift'); await page.keyboard.press('KeyD'); await page.keyboard.up('Shift');
  await page.waitForTimeout(400);
  s2 = await state(page);
  if (!s2.devButton && !s2.devPanel && !s2.devEnabled) ok('Shift+D hides them'); else bad('Shift+D hides them', s2);
  await page.keyboard.down('Shift'); await page.keyboard.press('KeyD'); await page.keyboard.up('Shift');
  await page.waitForTimeout(400);
  s2 = await state(page);
  if (s2.devButton && s2.devEnabled) ok('Shift+D brings them back'); else bad('Shift+D brings them back', s2);
  await ctx.close();

  // ?dev=0 for one session, without touching the flag.
  ({ ctx, page } = await open('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=11&renderer=canvas&dev=0'));
  s2 = await state(page);
  if (!s2.devButton && !s2.devEnabled) ok('?dev=0 hides them for one session'); else bad('?dev=0 hides them for one session', s2);
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
  const rects = await page.evaluate(() => window.__game.scene.getScene('Expedition').__devRects.map(r => ({ label: r.label, rect: r.rect })));
  ok('the cog opens the panel', rects.map(r => r.label));
  await page.screenshot({ path: path.join(OUT, '03-panel.png') });

  const toPage = (x, y) => page.evaluate(([gx, gy]) => {
    const sc = window.__game.scale, b = sc.canvasBounds, d = sc.displayScale;
    return [b.x + gx / d.x, b.y + gy / d.y];
  }, [x, y]);
  const click = async label => {
    const r = rects.find(x => x.label === label).rect;
    const [px, py] = await toPage(r.x + r.w / 2, r.y + r.h / 2);
    await page.mouse.click(px, py); await page.waitForTimeout(900);
  };

  await click('Jump to the inn');
  await page.waitForFunction(() => window.__game.scene.isActive('Inn'), null, { timeout: 25000 });
  const inn = await state(page);
  if (inn.scene === 'Inn' && inn.run.gold === 150 && inn.run.questsDone.includes('road')) ok('“Jump to the inn” lands at the inn with the road behind it', { gold: inn.run.gold });
  else bad('“Jump to the inn” lands at the inn with the road behind it', inn);
  await page.screenshot({ path: path.join(OUT, '04-jump-to-inn.png') });

  // The panel is still reachable in the new scene, and Fresh tutorial resets.
  await page.evaluate(() => ADV.Expedition.Dev.open(window.__game.scene.getScene('Inn')));
  const innRects = await page.evaluate(() => window.__game.scene.getScene('Inn').__devRects.map(r => ({ label: r.label, rect: r.rect })));
  const fresh = innRects.find(r => r.label === 'Fresh tutorial').rect;
  const [fx, fy] = await toPage(fresh.x + fresh.w / 2, fresh.y + fresh.h / 2);
  await page.mouse.click(fx, fy);
  await page.waitForFunction(() => window.__game.scene.isActive('Expedition') && window.__game.scene.getScene('Expedition').run.gold === 0, null, { timeout: 25000 });
  const back = await state(page);
  if (back.scene === 'Expedition' && Object.keys(back.run.tutorial).length === 0) ok('“Fresh tutorial” starts the road with the guidance back');
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
