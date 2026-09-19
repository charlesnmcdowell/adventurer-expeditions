// Adventurer: Expeditions — bake the recruits' painted busts (GDD v0.8 §12a).
// The website composes each bust at runtime from 4.4 MB of part sheets. This
// opens the inn in headless Chromium (every recruit's bust is composed there),
// waits for the part sheets to land, then writes each finished 440×560 bust as
// assets/expedition/busts/<recruit>.webp plus busts.json (the portrait meta the
// face animation needs). The game loads those instead (X.UI.installBusts) and
// the part sheets stay out of the build. Re-run after changing X.recruits.
// Usage: node tools/bake_busts.js [--quality=0.86]
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'expedition', 'busts');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] == null ? true : m[2]] : [a, true]; }));
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  // busts=0: compose from the part sheets even if a previous bake is on disk.
  await page.goto('http://127.0.0.1:' + port + '/index.html?at=inn&gold=0&seed=1&renderer=canvas&busts=0');
  await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Inn') && window.__game.scene.getScene('Inn').busts, null, { timeout: 20000 });
  // Human foes (bandits, the watch) compose from the same sheets: ask for each one here too.
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Inn'), X = ADV.Expedition;
    sc.__foeBusts = {};
    for (const key of Object.keys(X.enemies)) if (X.enemies[key].human) { const ch = X.Encounter.makeEnemy(new ADV.RNG(1), key, 1); sc.__foeBusts[key] = { key: ADV.Portraits.key(sc, ch) }; }
  });
  // Wait until no texture is still the "Loading art…" placeholder.
  await page.waitForFunction(() => {
    const sc = window.__game.scene.getScene('Inn');
    const keys = Object.values(sc.busts).map(b => b.img.texture.key).concat(Object.values(sc.__foeBusts).map(f => f.key));
    return keys.every(k => { const m = ADV.AnimeArt.META.get(k); return m && !m.pending; });
  }, null, { timeout: 90000 });
  const q = Number(args.quality || 0.86);
  const baked = await page.evaluate((q) => {
    const sc = window.__game.scene.getScene('Inn'), out = {};
    const plain = v => JSON.parse(JSON.stringify(v, (k, x) => (x && typeof x === 'object' && (x instanceof HTMLCanvasElement || x instanceof HTMLImageElement)) ? undefined : x));
    const all = Object.values(sc.busts).map(b => [b.key, b.img.texture.key]).concat(Object.entries(sc.__foeBusts).map(([k, f]) => ['foe_' + k, f.key]));
    for (const [bkey, key] of all) {
      const b = { key: bkey }, tex = sc.textures.get(key), src = tex.getSourceImage();
      const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0);
      const meta = ADV.AnimeArt.META.get(key), pmeta = ADV.Portraits._meta && ADV.Portraits._meta[key];
      out[b.key] = { data: c.toDataURL('image/webp', q), w: src.width, h: src.height, sourceKey: key, meta: plain(Object.assign({}, meta, { facePatch: undefined, master: undefined })), pmeta: plain(pmeta || null) };
    }
    return out;
  }, q);
  fs.mkdirSync(OUT, { recursive: true });
  const index = {};
  for (const [k, v] of Object.entries(baked)) {
    const file = k + '.webp';
    fs.writeFileSync(path.join(OUT, file), Buffer.from(v.data.split(',')[1], 'base64'));
    index[k] = { file, w: v.w, h: v.h, sourceKey: v.sourceKey, meta: v.meta, pmeta: v.pmeta };
    console.log('baked', file, (fs.statSync(path.join(OUT, file)).size / 1024).toFixed(0) + ' KB');
  }
  fs.writeFileSync(path.join(OUT, 'busts.json'), JSON.stringify({ version: 1, baked: new Date().toISOString().slice(0, 10), busts: index }));
  await browser.close(); srv.close();
  if (errors.length) { console.error('PAGE ERRORS:\n' + errors.join('\n')); process.exit(1); }
  console.log('bake_busts: ok (' + Object.keys(index).length + ' busts)');
})().catch(e => { console.error(e); process.exit(1); });
