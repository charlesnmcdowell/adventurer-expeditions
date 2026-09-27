// Adventurer: Expeditions — every creature in every open level must die to the
// Finisher AND play its paired finishing move (Hiro, 2026-09-22: "finisher is not
// working on dire wolf, it's not doing the finishing move animations or killing
// him"). Two separate bugs hid behind that report:
//   1. the button glowed on a boss between 25 % and 50 %, where a boss cannot be
//      executed, so the Finisher dealt damage and killed nothing;
//   2. Hiro only borrowed the Alpha's sheet — where the Alpha's paired frames
//      live — for the exact identity 'tutorial-alpha', so the Alpha on the marsh,
//      city and ruins died with a plain `down` and no finishing move.
// The sim covers the first; this covers what only a browser can see: which
// animation actually played.
//
// Usage: node test/browser_finishers.js [--ship]
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

// [quest, wave, which enemy to finish, the painted set it must pair from]
const CASES = [
  ['rain', 0, 'wolf', 'wolf'], ['rain', 1, 'plant', 'plant'], ['rain', 2, 'boss', 'alpha'],
  ['marsh', 0, 'serpent', 'serpent'], ['marsh', 0, 'beetle', 'beetle'],
  ['marsh', 1, 'moss_giant', 'moss_giant'], ['marsh', 2, 'boss', 'hag'],
  ['city', 0, 'goblin', 'goblin'], ['city', 0, 'spider', 'spider'], ['city', 2, 'boss', 'orc'],
];

(async () => {
  const pw = require('playwright');
  await new Promise(res => srv.listen(0, '127.0.0.1', res));
  const port = srv.address().port;
  const browser = await pw.chromium.launch({ headless: true, args: ['--disable-gpu'] });
  let failed = 0;
  for (const [qid, wave, pick, set] of CASES) {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e && e.message || e)));
    await page.goto('http://127.0.0.1:' + port + '/index.html?fresh=1&seed=5&renderer=canvas');
    await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 30000 });
    await page.evaluate(([q, w]) => {
      const X = ADV.Expedition, s = window.__game.scene.getScene('Expedition');
      const order = X.slice.openQuests;
      const run = X.Run.reset(); run.phase = 'quest'; run.questId = q; run.wave = w; run.checkpoint = w; run.gold = 200;
      run.questsDone = order.slice(0, order.indexOf(q));
      Object.assign(run.levels, { finisher: 1, god_aura: 1, counter_attack: 1 });
      Object.assign(run.tutorial, { arrowDone: 1, finisherDone: 1, purchases: 3, inspectDone: 1, skipGuide: 1, used: { finisher: 1, god_aura: 1, counter_attack: 1 } });
      X.Run.save(run); X.Dev.go(s, 'Expedition', { run });
    }, [qid, wave]);
    await page.waitForTimeout(6000);
    const r = await page.evaluate(async (pick) => {
      const X = ADV.Expedition, Enc = X.Encounter, s = window.__game.scene.getScene('Expedition'), enc = s.enc;
      const foes = enc.st.units.filter(u => u.side === 'b' && !u.downed);
      const mark = pick === 'boss' ? foes.find(u => u.ch.boss)
        : foes.find(u => !u.ch.boss && X.paintedActorOfKey(u.ch.expeditionKey) === pick);
      if (!mark) return { missing: true, keys: foes.map(u => u.ch.expeditionKey) };
      for (const u of foes) u.chp = u.maxHp;                       // only the marked one is finishable
      mark.chp = Math.max(1, Math.round(mark.maxHp * (mark.ch.boss ? 0.20 : 0.30)));
      const seen = new Set(), played = [];
      const iv = setInterval(() => {
        for (const a of s.actors.values()) {
          const k = a.img && a.img.anims && a.img.anims.currentAnim && a.img.anims.currentAnim.key;
          if (k && !seen.has(k)) { seen.add(k); played.push(k); }
        }
      }, 25);
      Enc.requestSkill(enc, 'finisher');
      const t = Date.now();
      while (Date.now() - t < 15000 && !(mark.downed || mark.chp <= 0)) await new Promise(res => setTimeout(res, 60));
      await new Promise(res => setTimeout(res, 2000));
      clearInterval(iv);
      return { target: mark.ch.expeditionKey, killed: !!(mark.downed || mark.chp <= 0),
        paired: played.filter(k => /paired|:hiro-finisher-[12]$/.test(k)), plainDown: played.some(k => /:down$/.test(k)) };
    }, pick);
    const pairedFromSet = r.paired && r.paired.some(k => ['wolf','plant'].includes(set) || k.includes('xp_' + set + '_sheet'));
    const ok = !r.missing && r.killed && r.paired.length > 0 && pairedFromSet && !errs.length;
    if (!ok) failed++;
    console.log((ok ? 'PASS ' : 'FAIL ') + (qid + ' w' + (wave + 1) + ' ' + pick).padEnd(18) +
      (r.missing ? 'no ' + pick + ' in ' + r.keys.join(',') :
        (r.target.padEnd(17) + ' killed=' + r.killed + '  paired=' + (r.paired.map(k => k.split(':').pop()).join(',') || 'NONE'))) +
      (errs.length ? '  ' + errs[0] : ''));
    await page.context().close();
  }
  await browser.close(); srv.close();
  console.log('browser_finishers: ' + (CASES.length - failed) + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
