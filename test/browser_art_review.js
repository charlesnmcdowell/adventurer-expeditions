// Adventurer: Expeditions — painted-sheet review (GDD v0.8 §10.3).
// Boots a fresh road ambush and screenshots Hiro through the first fight at a
// steady cadence, with the sheet on (default) or off (--sheet=0) for an A/B.
// Frames land in test/reports/art/<sheet|plates>-NN.png. Fails on page errors.
// Usage: node test/browser_art_review.js [--sheet=0] [--seconds=14] [--every=180] [--at=inn]
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] == null ? true : m[2]] : [a, true]; }));
const label = args.sheet === '0' ? 'plates' : 'sheet';
const OUT = path.join(ROOT, 'test', 'reports', 'art');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.startsWith(label + '-') && f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
(async () => {
  const pw = require('playwright');
  const srv = await serve(); const port = srv.address().port;
  const browser = await pw.chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const vw = Number(args.width || 1280);
  const page = await browser.newPage({ viewport: { width: vw, height: Math.round(vw * 760 / 1280) } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const entry = args.at ? '?at=' + args.at : '?fresh=1';
  await page.goto('http://127.0.0.1:' + port + '/index.html' + entry + '&seed=11&renderer=canvas' + (args.sheet === '0' ? '&sheet=0' : ''));
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 15000 });
  const every = Number(args.every || 180), seconds = Number(args.seconds || 14);
  let n = 0; const t0 = Date.now();
  while (Date.now() - t0 < seconds * 1000) {
    await page.waitForTimeout(every);
    // Dismiss the guide's holds so the fight keeps moving; tap glowing skills.
    await page.evaluate(() => {
      const sc = window.__game.scene.getScene('Expedition'); if (!sc || !sc.hud) return;
      if (sc.hud.gateActive && sc.hud.gateActive() && sc.hud._gateRect) { const r = sc.hud._gateRect; sc.input.emit('pointerdown', { x: r.x + r.w / 2, y: r.y + r.h / 2 }); }
    });
    n++; await page.screenshot({ path: path.join(OUT, label + '-' + String(n).padStart(2, '0') + '.png') });
  }
  const info = await page.evaluate(() => { const sc = window.__game.scene.getScene('Expedition'); const h = sc && sc.hero; return h ? { sheet: !!h.sheet, anim: h.img.anims && h.img.anims.currentAnim ? h.img.anims.currentAnim.key : null, frame: h.img.frame && h.img.frame.name, w: h.img.displayWidth, hgt: h.img.displayHeight, x: h.root.x } : null; });
  console.log(label, JSON.stringify(info), 'frames', n);
  await browser.close(); srv.close();
  if (errors.length) { console.error('PAGE ERRORS:\n' + errors.join('\n')); process.exit(1); }
  console.log('browser_art_review: ok');
})().catch(e => { console.error(e); process.exit(1); });
