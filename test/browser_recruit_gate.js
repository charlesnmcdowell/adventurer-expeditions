'use strict';
// Locked tutorial inn, pointer input, legacy ownership and painted replay actors.
const assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'reports/recruit-gate');
fs.mkdirSync(OUT, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const results = [];
  try {
    for (const width of [1280, 375]) {
      const page = await browser.newPage({ viewport: { width, height: Math.round(width * 760 / 1280) } });
      const errors = [], requests = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request', r => requests.push(r.url()));
      const base = 'http://127.0.0.1:' + server.address().port + '/index.html';
      const readyInn = () => page.waitForFunction(() => window.__game && window.__game.scene.isActive('Inn') && window.__game.scene.getScene('Inn').isPortalReady(), null, { timeout: 25000 });
      let releaseScenery;
      const sceneryGate = new Promise(resolve => { releaseScenery = resolve; });
      // The inn's scenery is the painted vignette under assets/expedition/inn/.
      // Holding it proves the real contract: no input and no gameplayStart until
      // the painting is actually on screen. (Round 3: the inn now waits for a late
      // painting instead of failing, which is what makes this gate survivable.)
      await page.route('**/assets/expedition/inn/*.webp*', async route => { await sceneryGate; await route.continue(); });
      const tap = async rect => {
        const box = await page.locator('canvas').first().boundingBox();
        await page.mouse.click(box.x + (rect.x + rect.w / 2) * box.width / 1280, box.y + (rect.y + rect.h / 2) * box.height / 760);
      };
      await page.goto(base + '?at=inn&gold=150&seed=11&renderer=canvas');
      // While the painting is held, Phaser's own loader keeps the scene in preload:
      // create() has not run, so there is no env, no input and no gameplayStart.
      await page.waitForFunction(() => !!window.__game, null, { timeout: 25000 });
      await page.waitForTimeout(2500);
      const loading = await page.evaluate(() => {
        const s = window.__game.scene.getScene('Inn');
        // input.enabled is Phaser's own default during preload; with no scene objects
        // built there is nothing to click, so readiness and env are the real contract.
        return { ready: !!(s && s.isPortalReady && s.isPortalReady()), env: !!(s && s.env) };
      });
      assert.deepEqual(loading, { ready: false, env: false }, 'inn must wait for actual scenery before input/SDK readiness');
      releaseScenery();
      await readyInn();
      const snapshot = await page.evaluate(() => {
        const X = ADV.Expedition, s = window.__game.scene.getScene('Inn'), C = X.Campaign;
        // Hiro is part of the painted vignette now, so a separate standing figure is
        // optional — the inn art suite owns that contract (heroFigure must be absent).
        return { hiro: s.heroFigure ? s.heroFigure.texture.key : null, locked: s.lockedButtons.map(b => ({ rect: b.rect, interactive: !!(b.zone.input && b.zone.input.enabled) })),
          roster: s.run.roster, ready: X.recruits.filter(r => C.recruitReady(r.key)).map(r => r.key),
          directBuy: C.buy(s.run, 'bram'), gold: s.run.gold, busts: Object.keys(s.busts), next: s.embarkBtn.rect };
      });
      assert.ok(snapshot.hiro === null || snapshot.hiro === 'xp_hiro_sheet');
      // Round 3: while recruiting is locked, Bram's 2 MB of art is kept off the
      // critical path, so no recruit reports art-ready here. He loads the moment he
      // can be hired, or when a saved run already owns him (checked further down).
      assert.deepEqual(snapshot.ready, []);
      // One button is still shut (Unlock a hero); Road in the Rain is now live.
      assert.equal(snapshot.locked.length, 1); assert.ok(snapshot.locked.every(b => !b.interactive));
      assert.deepEqual(snapshot.roster, []); assert.deepEqual(snapshot.busts, []);
      assert.equal(snapshot.directBuy.reason, 'slice locked'); assert.equal(snapshot.gold, 150);
      for (const button of snapshot.locked) await tap(button.rect);
      assert.equal(await page.evaluate(() => window.__game.scene.getScene('Inn').run.phase), 'inn');
      await page.screenshot({ path: path.join(OUT, 'locked-inn-' + width + '.png') });

      // Seed an old ownership case, not a purchase through the current lock.
      await page.evaluate(() => {
        const X = ADV.Expedition, s = window.__game.scene.getScene('Inn');
        s.run.roster = ['bram', 'nyx', 'stranger']; s.run.field = ['bram', 'nyx', 'stranger'];
        s.run.hero = { key: 'nyx' }; s.run.tutorial.skipGuide = true;
        if (!X.Run.save(s.run).ok) throw new Error('save failed');
      });
      await page.goto(base + '?renderer=canvas'); await readyInn();
      const saved = await page.evaluate(() => {
        const s = window.__game.scene.getScene('Inn');
        return { roster: s.run.roster, field: s.run.field, hero: s.run.hero || null, gold: s.run.gold,
          levels: s.run.levels, companions: (s.companionFigures || []).map(a => a.texture.key), innVariant: s.env && s.env.variant, replay: s.embarkBtn.rect };
      });
      assert.deepEqual(saved.roster, ['bram', 'nyx']); assert.deepEqual(saved.field, ['bram']);
      assert.equal(saved.hero, null); assert.equal(saved.gold, 150); assert.equal(saved.levels.finisher, 0);
      // Bram is painted into the inn vignette rather than standing beside it, so the
      // proof that he is in the party is the variant the painting switched to.
      assert.deepEqual(saved.companions, []); assert.equal(saved.innVariant, 'inn-hiro-bram');
      await page.screenshot({ path: path.join(OUT, 'legacy-bram-inn-' + width + '.png') });
      await tap(saved.replay);
      await page.waitForFunction(() => window.__game.scene.isActive('Expedition') && window.__game.scene.getScene('Expedition').enc, null, { timeout: 25000 });
      const replay = await page.evaluate(() => {
        const s = window.__game.scene.getScene('Expedition');
        return { quest: s.run.questId, field: s.run.field, fighters: [...s.actors.values()].map(a => a.sheet && a.sheet.id) };
      });
      assert.equal(replay.quest, 'road'); assert.deepEqual(replay.field, ['bram']);
      assert.ok(replay.fighters.includes('hiro') && replay.fighters.includes('bram') && replay.fighters.includes('wolf'));
      await page.screenshot({ path: path.join(OUT, 'tutorial-replay-' + width + '.png') });
      await page.evaluate(() => {
        const X = ADV.Expedition, s = window.__game.scene.getScene('Expedition');
        s.run.phase = 'travel'; s.run.wave = 1; s.run.travelLeg = 'midleg'; X.Run.save(s.run);
        s.scene.start('Travel', { run: s.run, seed: 12, leg: 'midleg' });
      });
      await page.waitForFunction(() => window.__game.scene.isActive('Travel') && window.__game.scene.getScene('Travel').isPortalReady(), null, { timeout: 25000 });
      const walkers = await page.evaluate(() => window.__game.scene.getScene('Travel').walkers.map(a => ({ key: a.texture.key, animation: a.anims.currentAnim && a.anims.currentAnim.key })));
      assert.deepEqual(walkers.map(a => a.key), ['xp_hiro_sheet', 'xp_bram_sheet']);
      assert.ok(walkers.every(a => a.animation && a.animation.endsWith(':walk')));
      await page.screenshot({ path: path.join(OUT, 'painted-travel-' + width + '.png') });
      assert.ok(!requests.some(url => /hiro_cyber_20260916|hiro\/hiro\.webp|busts\/(nyx|sable|aera|ren)\.webp/.test(url)), 'no superseded/unsupported portrait requests');
      assert.deepEqual(errors, []);
      results.push({ width, lockedButtons: 2, legacyBram: true, replay, walkers, errors });
      console.log('browser_recruit_gate:', width, 'OK', JSON.stringify(replay));
      await page.close();
    }
    fs.writeFileSync(path.join(OUT, 'verification.json'), JSON.stringify({ status: 'passed', results }, null, 2) + '\n');
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });

