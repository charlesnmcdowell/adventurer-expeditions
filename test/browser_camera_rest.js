// Adventurer: Expeditions — the camera always comes home (GDD §7, round 3).
//
// Plays the tutorial road in a real browser, tapping skills as they light up so
// that kills happen both with and without the Finisher, and asserts after every
// fight — and at the completion card itself — that the main camera is back at
// zoom 1, centred, with time scales at 1. This is the regression for the bug
// where the kill cinematic pushed in and never zoomed back out.
//
// Usage: node test/browser_camera_rest.js [--seed=N] [--width=390] [--ship]
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'test', 'reports', 'camera-rest');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] == null ? true : m[2]] : [a, true]; }));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const SHIP = args.ship ? new Set(require('../tools/size_check.js').shipList().files) : null;
const EPS = 0.001;

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const rel = u === '/' ? 'index.html' : u.replace(/^\//, '');
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory() || (SHIP && !SHIP.has(rel))) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const pw = require(process.env.PW_MODULE || 'playwright');
  const srv = await serve(), port = srv.address().port;
  const browser = await pw.chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const vw = Number(args.width || 1280);
  const page = await browser.newPage({ viewport: { width: vw, height: Math.round(vw * 760 / 1280) } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=' + (args.seed || 11) + '&renderer=canvas');
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 20000 });

  const look = () => page.evaluate(() => {
    const g = window.__game, key = g.scene.getScenes(true).map(s => s.sys.settings.key)[0];
    const s = key && g.scene.getScene(key); if (!s) return null;
    const cam = s.cameras && s.cameras.main, hud = s.hud;
    return { scene: key, cine: s.__cine || 0,
      zoom: cam ? cam.zoom : null, scrollX: cam ? cam.scrollX : null, scrollY: cam ? cam.scrollY : null,
      tween: s.tweens ? s.tweens.timeScale : null, anim: s.anims ? s.anims.globalTimeScale : null, clock: s.time ? s.time.timeScale : null,
      over: !!(s.enc && s.enc.st && s.enc.st.over), wave: s.run && s.run.wave,
      card: !!(hud && hud.completionCard), replay: hud && hud.completionCard ? hud.completionCard.replayRect : null,
      gate: (hud && hud._gateRect) || s.__gateRect || null, gateFor: hud && hud._gateFor,
      chip: hud && hud.chip ? hud.chip.confirmRect : null, arrow: !!s.arrowArmed, arrowRect: hud && hud.arrow ? hud.arrow.rect : null,
      glowing: hud && hud.icons ? Object.keys(hud.icons).filter(id => hud.icons[id].readyTween).map(id => ({ id, rect: hud.icons[id].rect })) : [],
      request: s.enc && s.enc.request ? s.enc.request.skillId : null, btn: (s.btn && s.btn.rect) || null };
  });
  // Game coordinates are not page coordinates once Phaser scales to FIT, which is
  // exactly the case at phone width. Map through the canvas before clicking.
  const toPage = (x, y) => page.evaluate(([gx, gy]) => {
    const sc = window.__game.scale, b = sc.canvasBounds, d = sc.displayScale;
    return [b.x + gx / d.x, b.y + gy / d.y];
  }, [x, y]);
  const tap = async r => { const [px, py] = await toPage(r.x + r.w / 2, r.y + r.h / 2); await page.mouse.click(px, py); await page.waitForTimeout(220); };
  const atRest = v => v && Math.abs(v.zoom - 1) < EPS && Math.abs(v.scrollX) < 1 && Math.abs(v.scrollY) < 1
    && Math.abs(v.tween - 1) < EPS && Math.abs(v.anim - 1) < EPS && Math.abs(v.clock - 1) < EPS && !v.cine;

  const checks = [];
  const fail = (what, v) => { checks.push({ ok: false, what, saw: v }); console.error('FAIL ' + what + ' ' + JSON.stringify(v)); };
  const pass = (what, v) => { checks.push({ ok: true, what, saw: { zoom: v.zoom, cine: v.cine } }); console.log('PASS ' + what); };
  let shots = 0;
  const shot = async label => { shots++; await page.screenshot({ path: path.join(OUT, String(shots).padStart(2, '0') + '-' + label + '.png') }); };

  const t0 = Date.now();
  let ticks = 0, seenFinisherKill = false, seenPlainKill = false, restChecks = 0, cardSeen = false, lastOverKey = null;
  while (Date.now() - t0 < 480000) {
    await page.waitForTimeout(250);
    const v = await look(); if (!v) continue;
    if (++ticks % 20 === 0) console.log('… ' + v.scene + ' wave ' + v.wave + (v.over ? ' over' : '') + (v.gateFor ? ' gate:' + v.gateFor : '') + (v.card ? ' card' : '') + ' zoom ' + (v.zoom || 0).toFixed(2));

    if (v.scene === 'Expedition') {
      const overKey = v.over ? 'wave' + v.wave : null;
      if (overKey && overKey !== lastOverKey) {
        lastOverKey = overKey;
        // A finishing move can still be playing when the fight ends: wait for the
        // cinematic to close rather than guessing a delay (under load it outlives one).
        let settled = null;
        for (let i = 0; i < 40; i++) { settled = await look(); if (settled && !settled.cine) { await page.waitForTimeout(500); settled = await look(); break; } await page.waitForTimeout(250); }
        restChecks++;
        if (atRest(settled)) pass('camera at rest when the fight ends (wave ' + settled.wave + ')', settled);
        else fail('camera at rest when the fight ends', settled);
      }
      if (v.card) {
        if (!cardSeen) {
          cardSeen = true;
          const card = await look();
          await shot('completion-card');
          if (atRest(card)) pass('camera at rest at the completion card', card);
          else fail('camera at rest at the completion card', card);
        }
        if (v.replay) { await tap(v.replay); continue; }
      }
      if (v.gate) {
        // The tutorial's hold-to-read step wants a press held until the box opens.
        if (/^inspect:/.test(v.gateFor || '')) {
          const [hx, hy] = await toPage(v.gate.x + v.gate.w / 2, v.gate.y + v.gate.h / 2);
          await page.mouse.move(hx, hy); await page.mouse.down();
          try { await page.waitForFunction(() => { const s = window.__game.scene.getScene('Expedition'); return !!(s && s.hud && s.hud.info); }, null, { timeout: 15000 }); }
          catch (e) { console.log('info box never opened on hold'); }
          await page.waitForTimeout(250); await page.mouse.up(); await page.waitForTimeout(400);
          continue;
        }
        await tap(v.gate); continue;
      }
      if (v.chip) { await tap(v.chip); continue; }
      if (v.arrow && v.arrowRect) { await tap(v.arrowRect); continue; }
      const fin = v.glowing.find(g => g.id === 'finisher');
      if (fin && !v.request) { seenFinisherKill = true; await tap(fin.rect); continue; }
      if (v.glowing.length && !v.request) { seenPlainKill = true; await tap(v.glowing[0].rect); continue; }
      continue;
    }
    if (v.scene === 'Inn') { await shot('inn'); break; }
  }

  const final = await look();
  if (final && final.scene === 'Inn') pass('reached the inn', final); else fail('reached the inn', final);
  fs.writeFileSync(path.join(OUT, 'verification.json'), JSON.stringify({ generatedAt: new Date().toISOString(), width: vw, shipOnly: !!SHIP, restChecks, cardSeen, seenFinisherKill, seenPlainKill, checks, errors }, null, 2) + '\n');
  await browser.close(); srv.close();

  const failed = checks.filter(c => !c.ok).length;
  if (errors.length) { console.error('PAGE ERRORS:\n' + errors.join('\n')); process.exitCode = 1; }
  if (!cardSeen) { console.error('never reached a completion card'); process.exitCode = 1; }
  if (restChecks < 2) { console.error('too few fight-end camera checks: ' + restChecks); process.exitCode = 1; }
  console.log('browser_camera_rest: ' + (checks.length - failed) + ' passed, ' + failed + ' failed (finisher kill seen: ' + seenFinisherKill + ')');
  if (failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
