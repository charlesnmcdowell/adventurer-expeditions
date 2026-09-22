'use strict';
// Focused real-Phaser rendering/lifecycle check for the seated inn vignette.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'reports/inn-art');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.css': 'text/css' };
const ship = process.argv.includes('--ship') ? new Set(require('../tools/size_check.js').shipList().files) : null;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html', file = path.resolve(ROOT, rel);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory() || (ship && !ship.has(rel))) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await require('playwright').chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const reports = [];
  try {
    for (const width of [1280, 375]) {
      const page = await browser.newPage({ viewport: { width, height: Math.round(width * 760 / 1280) } }), errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('response', r => { if (r.status() >= 400 && r.url().includes('/assets/expedition/inn/')) errors.push(r.status() + ' ' + r.url()); });
      await page.goto('http://127.0.0.1:' + server.address().port + '/index.html?at=inn&renderer=canvas');
      const ready = variant => page.waitForFunction(v => { const s = window.__game?.scene.getScene('Inn'); return s?.isPortalReady() && s.env?.variant === v; }, variant, { timeout: 60000 });
      await ready('inn-hiro-solo');
      const initial = await page.evaluate(() => { const s = __game.scene.getScene('Inn'); return { effects: s.env.effects.length, depth: s.env.root.depth, heroFigure: !!s.heroFigure, companions: (s.companionFigures || []).length, locked: s.lockedButtons.length, embark: s.embarkBtn.label.text, replay: s.replayBtn.label.text }; });
      assert.equal(initial.effects, 3); assert.equal(initial.depth, -100); assert.equal(initial.heroFigure, false); assert.equal(initial.companions, 0); assert.equal(initial.locked, 1, 'only Unlock a hero stays shut while Road in the Rain is open'); assert.match(initial.embark, /rain/i); assert.match(initial.replay, /Replay/);
      await page.screenshot({ path: path.join(OUT, 'solo-' + width + '.png') });
      const paused = await page.evaluate(() => { const s = __game.scene.getScene('Inn'); s.corner.togglePause(); return s.env.effects.map(f => f.elapsed); });
      await page.waitForTimeout(500);
      assert.deepEqual(await page.evaluate(() => __game.scene.getScene('Inn').env.effects.map(f => f.elapsed)), paused);
      await page.evaluate(() => __game.scene.getScene('Inn').corner.togglePause()); await page.waitForTimeout(400);
      assert.notDeepEqual(await page.evaluate(() => __game.scene.getScene('Inn').env.effects.map(f => f.elapsed)), paused);
      await page.evaluate(() => { const s = __game.scene.getScene('Inn'), run = structuredClone(s.run); window.__innQaOld = s.env; run.roster = ['bram']; run.field = ['bram']; s.scene.restart({ run, seed: 11 }); });
      await ready('inn-hiro-bram');
      const joined = await page.evaluate(() => { const s = __game.scene.getScene('Inn'); return { effects: s.env.effects.length, priorDestroyed: __innQaOld.destroyed, priorEffects: __innQaOld.effects.length, companions: s.world.companions.map(c => c.companionKey), loaded: ADV.Expedition.Campaign.recruitReady('bram') }; });
      assert.equal(joined.effects, 4); assert.equal(joined.priorDestroyed, true); assert.equal(joined.priorEffects, 0); assert.equal(joined.loaded, true); assert.deepEqual(joined.companions, ['bram']);
      await page.screenshot({ path: path.join(OUT, 'bram-' + width + '.png') });
      await page.evaluate(() => { const s = __game.scene.getScene('Inn'); s.corner.togglePause(); window.__innQaOld = s.env; s.scene.restart({ run: structuredClone(s.run), seed: 12 }); });
      await page.waitForFunction(() => { const s = __game.scene.getScene('Inn'); return s.env !== __innQaOld && s.isPortalReady(); });
      assert.deepEqual(await page.evaluate(() => { const s = __game.scene.getScene('Inn'); return { oldDestroyed: __innQaOld.destroyed, menuPaused: s.corner.paused, clockPaused: s.time.paused, shade: !!s.corner.shade }; }),
        { oldDestroyed: true, menuPaused: false, clockPaused: false, shade: false });
      await page.evaluate(() => { const s = __game.scene.getScene('Inn'); s.run.field = []; s.env.setParty(s.run); }); await ready('inn-hiro-solo');
      assert.deepEqual(errors, []); reports.push({ width, initial, joined, errors }); await page.close();
    }
    fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ ship: !!ship, reports }, null, 2) + '\n');
    console.log('browser_inn_art: solo/Bram/pause/reentry/locks passed at1280 and375');
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
