// Cold-cache startup measurement against the exact ship allowlist.
// node test/browser_startup_budget.js [--portal-test] [--scenery-delay=1800]
// --portal-test changes only the served release policy and stubs the external
// SDK to inspect hook timing. It is NOT a CrazyGames portal/network certification.
'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium, devices } = require('playwright');
const Size = require('../tools/size_check');
const ROOT = path.resolve(__dirname, '..');
const reportName = process.env.STARTUP_REPORT_NAME || 'startup';
if (!/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(reportName)) throw new Error('Unsafe STARTUP_REPORT_NAME');
const OUT = path.join(__dirname, 'reports', reportName);
const PORTAL_TEST = process.argv.includes('--portal-test');
const SCENERY_DELAY = Math.max(0, Math.min(5000, Number(process.argv.find(a => a.startsWith('--scenery-delay='))?.split('=')[1] || 0)));
const SUFFIX = (PORTAL_TEST ? '-portal-stub' : '') + (SCENERY_DELAY ? '-delay' + SCENERY_DELAY : '');
const ship = Size.report(), allowed = new Set(Size.shipList().files);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const missing = [];
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html';
  if (!allowed.has(rel)) { missing.push(rel); res.writeHead(404); res.end(); return; }
  let body = fs.readFileSync(path.join(ROOT, rel));
  if (PORTAL_TEST && rel === 'js/core/release_config.js') body = Buffer.from(body.toString().replace("target: 'website'", "target: 'crazygames'"));
  const send = () => {
    res.writeHead(200, { 'Content-Type': mime[path.extname(rel)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': body.length });
    res.end(body);
  };
  if (SCENERY_DELAY && rel === 'assets/anime/v2/runtime/forest.webp') setTimeout(send, SCENERY_DELAY); else send();
});

async function measure(browser, profile, url) {
  const context = await browser.newContext(profile.options);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const records = new Map(), errors = [];
  let clockOffset = null;
  cdp.on('Network.requestWillBeSent', e => {
    if (clockOffset == null) clockOffset = e.wallTime * 1000 - e.timestamp * 1000;
    records.set(e.requestId, { url: e.request.url, start: e.timestamp, chunks: [] });
  });
  cdp.on('Network.responseReceived', e => {
    const r = records.get(e.requestId); if (!r) return;
    Object.assign(r, { status: e.response.status, headersAt: e.timestamp, headerBytes: e.response.encodedDataLength || 0, cached: !!(e.response.fromDiskCache || e.response.fromServiceWorker) });
  });
  cdp.on('Network.dataReceived', e => { const r = records.get(e.requestId); if (r) r.chunks.push({ at: e.timestamp, bytes: e.encodedDataLength }); });
  cdp.on('Network.loadingFinished', e => { const r = records.get(e.requestId); if (r) Object.assign(r, { end: e.timestamp, bytes: e.encodedDataLength }); });
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  page.on('requestfailed', req => errors.push(req.url() + ': ' + req.failure()?.errorText));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  await page.addInitScript(() => {
    window.__startupMarks = []; window.__sdkCalls = []; window.__prematureCombat = []; window.__sceneryWaitSamples = 0;
    window.__startupState = () => {
      const game = window.__game, sc = game && game.scene.getScenes(true).find(s => s.sys.settings.key === 'Expedition');
      const actors = sc?.actors ? [...sc.actors.values()] : [];
      const state = {
        running: !!(sc && sc.sys.settings.status === Phaser.Scenes.RUNNING),
        hero: !!(sc?.hero?.sheet && sc.hero.img?.texture?.key !== '__MISSING'),
        foes: actors.filter(a => a.side === 'b' && a.img?.texture?.key !== '__MISSING').length,
        scenery: !!sc?.env?.background,
        controls: !!(sc?.hud?.portrait && Object.keys(sc.hud.icons || {}).length && sc.input.enabled),
        steps: sc?.enc?.steps || 0,
      };
      state.ready = state.running && state.hero && state.foes > 0 && state.scenery && state.controls;
      return state;
    };
    function poll() {
      const state = window.__startupState();
      if (state.running && state.hero && !state.scenery) {
        window.__sceneryWaitSamples++;
        if (state.steps > 0) window.__prematureCombat.push({ at: performance.now(), steps: state.steps });
      }
      const mark = name => { if (!window.__startupMarks.some(m => m.name === name)) window.__startupMarks.push({ name, at: performance.now(), epoch: performance.timeOrigin + performance.now(), state }); };
      if (state.ready) mark('visibleGameplay');
      if (state.ready && state.steps > 0) mark('firstCombatStep');
      if (!window.__startupMarks.some(m => m.name === 'firstCombatStep')) requestAnimationFrame(poll);
    }
    requestAnimationFrame(poll);
  });
  if (PORTAL_TEST) await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js', route => route.fulfill({ contentType: 'text/javascript', body: `window.CrazyGames={SDK:{init:async()=>{},game:Object.fromEntries(['loadingStart','loadingStop','gameplayStart','gameplayStop'].map(name=>[name,()=>window.__sdkCalls.push({name,at:performance.now(),epoch:performance.timeOrigin+performance.now(),state:window.__startupState()})]))}};` }));
  await page.goto(url + '/index.html?fresh=1&seed=11&renderer=canvas', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(() => window.__startupMarks.some(m => m.name === 'firstCombatStep'), null, { timeout: 45000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({ state: window.__startupState?.(), marks: window.__startupMarks, sdk: window.__sdkCalls, active: window.__game?.scene.getScenes(true).map(s => ({ key: s.sys.settings.key, sceneState: s.sys.settings.status, env: !!s.env, enc: !!s.enc, hero: !!s.hero, hud: !!s.hud, atlasReady: ADV.Expedition.Painted ? Object.fromEntries((ADV.Expedition.Painted.actors || ADV.Expedition.Painted.ids).map(id => [id, !!ADV.Expedition.Painted.sheet(s, id)])) : null })) }));
    console.error(JSON.stringify({ profile: profile.name, diagnostic, errors, missing }, null, 2));
    fs.writeFileSync(path.join(OUT, profile.name + SUFFIX + '-failure.json'), JSON.stringify({ at: new Date().toISOString(), diagnostic, errors, missing }, null, 2));
    await page.screenshot({ path: path.join(OUT, profile.name + '-failed.png') });
    throw error;
  }
  // One genuine pointer action unlocks the ordinary music/SFX path. Measure it
  // separately, so browser autoplay policy cannot hide its download cost.
  const canvas = await page.locator('canvas').first().boundingBox();
  await page.mouse.click(canvas.x + canvas.width * 0.45, canvas.y + canvas.height * 0.5);
  await page.waitForTimeout(2000);
  const data = await page.evaluate(() => ({ marks: window.__startupMarks, sdk: window.__sdkCalls, prematureCombat: window.__prematureCombat, sceneryWaitSamples: window.__sceneryWaitSamples, observedAt: performance.timeOrigin + performance.now(), portal: { active: ADV.Portal.active, ready: ADV.Portal.ready, error: ADV.Portal.error }, timeOrigin: performance.timeOrigin }));
  const bytesAt = epoch => {
    let encoded = 0, completed = 0, inFlight = 0;
    for (const r of records.values()) {
      if (!r.url.startsWith(url)) continue; // SDK stub/network explicitly excluded.
      const before = t => t != null && t * 1000 + clockOffset <= epoch;
      if (before(r.end)) { encoded += r.bytes || 0; completed++; }
      else if (before(r.start)) { encoded += before(r.headersAt) ? r.headerBytes : 0; encoded += r.chunks.filter(c => before(c.at)).reduce((n, c) => n + c.bytes, 0); inFlight++; }
    }
    return { encodedResponseBytes: encoded, completedRequests: completed, inFlightRequests: inFlight };
  };
  const milestones = [...data.marks, ...data.sdk.filter(e => e.name === 'gameplayStart' || e.name === 'loadingStop')].map(m => ({ ...m, ...bytesAt(m.epoch) }));
  const screenshot = path.join(OUT, profile.name + SUFFIX + '.png');
  await page.screenshot({ path: screenshot });
  const result = { profile: profile.name, viewport: profile.options.viewport, mobileEmulated: !!profile.options.isMobile, portal: data.portal, milestones, sceneryWaitSamples: data.sceneryWaitSamples, prematureCombat: data.prematureCombat, afterAudioUnlock: bytesAt(data.observedAt), requested: [...records.values()].filter(r => r.url.startsWith(url)).map(r => ({ path: r.url.substring(url.length), bytes: r.bytes || 0, status: r.status, cached: r.cached })).sort((a, b) => b.bytes - a.bytes), errors };
  await context.close();
  return result;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const results = [];
  try {
    for (const profile of [
      { name: 'desktop', options: { viewport: { width: 1280, height: 760 } } },
      { name: 'mobile-portrait', options: { ...devices['iPhone 13'], defaultBrowserType: undefined, viewport: { width: 390, height: 844 } } },
      { name: 'mobile-landscape', options: { ...devices['iPhone 13 landscape'], defaultBrowserType: undefined, viewport: { width: 844, height: 390 } } },
    ]) results.push(await measure(browser, profile, url));
  } finally { await browser.close(); server.close(); }
  const findings = [];
  if (ship.over || ship.missing.length) findings.push('Ship set fails size/completeness gate.');
  if (missing.length) findings.push('Requests outside ship allowlist: ' + [...new Set(missing)].join(', '));
  for (const r of results) {
    if (r.errors.length) findings.push(r.profile + ': browser errors');
    if (r.afterAudioUnlock.encodedResponseBytes >= 20000000) findings.push(r.profile + ': initial download reaches/exceeds 20 MB mobile budget');
    const start = r.milestones.find(m => m.name === 'gameplayStart');
    if (PORTAL_TEST && (!start || !start.state.ready)) findings.push(r.profile + ': SDK gameplayStart is missing or precedes visible gameplay readiness');
    const stop = r.milestones.find(m => m.name === 'loadingStop');
    if (PORTAL_TEST && (!stop || !stop.state.ready)) findings.push(r.profile + ': SDK loadingStop is missing or precedes visible gameplay readiness');
    if (r.prematureCombat.length) findings.push(r.profile + ': combat advanced before scenery was ready');
    if (SCENERY_DELAY && r.sceneryWaitSamples === 0) findings.push(r.profile + ': delayed scenery test did not observe a waiting state');
  }
  const output = { generatedAt: new Date().toISOString(), mode: PORTAL_TEST ? 'local transformed release policy + SDK stub timing test' : 'unmodified local ship-allowlist build', sceneryDelayMs: SCENERY_DELAY, limitations: ['Headless Chromium, Canvas renderer; mobile device settings are emulated, not a physical iPhone/Safari measurement.', 'Local HTTP server sends uncompressed bodies. CDP encoded response bytes include HTTP response overhead, not TLS/IP overhead. Browser cache disabled; each profile uses a new context.', 'SDK stub bytes excluded. An uploaded CrazyGames preview is still needed for actual SDK/platform hosting measurements.'], ship: { totalBytes: ship.total, limitBytes: ship.budget, files: ship.files.length }, results, findings };
  const report = path.join(OUT, 'cold-start' + SUFFIX + '.json');
  fs.writeFileSync(report, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ report, ship: output.ship, profiles: results.map(r => ({ name: r.profile, milestones: r.milestones.map(m => ({ name: m.name, ms: Math.round(m.at), bytes: m.encodedResponseBytes, ready: m.state.ready })), afterAudioUnlockBytes: r.afterAudioUnlock.encodedResponseBytes })), findings }, null, 2));
  if (findings.length) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
