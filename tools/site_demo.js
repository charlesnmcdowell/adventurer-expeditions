'use strict';
// Chapter-one story demo for neverendingnarratives.com/expeditions/ (Hiro,
// 2026-10-12: "adventurer expeditions added as a second game on the site with
// only the chapter 1 demo available").
//
//   node tools/site_demo.js record   play chapter one for real (both Nib branches,
//                                    a defeat and retry, the demo end card) and save
//                                    every file the browser asked for to
//                                    tools/site_demo_files.json
//   node tools/site_demo.js build    copy that list, plus every chapter-one voice
//                                    line, track and painting from the campaign
//                                    data, into dist/site-demo with the dev tools off
//   node tools/site_demo.js verify   play the packaged copy end to end from its own
//                                    server; any missing file or page error fails
//
// The package is the story only: index.html is the story title page, the demo
// stops after chapter one (DEMO_THROUGH in docs/story_preview.js), and nothing
// from chapters two to fourteen, Arcade, tests or source art is copied.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..'), LIST = path.join(__dirname, 'site_demo_files.json');
const OUT = path.join(ROOT, 'dist', 'site-demo');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };

function serve(root, seen) {
  return http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (seen) seen.missing.add(rel);
      res.writeHead(404); return res.end();
    }
    if (seen) seen.files.add(rel.split(path.sep).join('/'));
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

// One real chapter-one playthrough: dialogue by the given choices, every fight
// fought through the HUD, until the demo's coming-soon card.
async function play(page, base, choices, opts = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + (opts.entry || '/'));
  await page.getByRole('button', { name: 'Begin story', exact: true }).click();
  let defeated = !opts.forceDefeat;
  for (const start = Date.now(); Date.now() - start < 900000;) {
    if (errors.length) throw Error(errors.join('\n'));
    if (await page.locator('.demo-end').count()) return { errors, defeated };
    const el = await page.locator('iframe').count() ? await page.locator('iframe').elementHandle() : null;
    if (el) {
      const frame = await el.contentFrame();
      const state = await frame.evaluate(force => {
        const s = window.storyGame?.scene.getScene('StoryBattle'); if (!s?.hero) return null;
        // Recording only: drop Hiro to 1 HP once so the defeat card, the enemy
        // finisher on Hiro and Retry load their files too.
        if (force && s.hero.unit && s.story.record.phase === 'combat' && s.hero.unit.chp > 1) s.hero.unit.chp = 1;
        const h = s.hud, E = ADV.Expedition.Encounter;
        return { phase: s.story.record.phase, arrow: s.arrowArmed, rect: s.arrowArmed ? h.arrow.rect : h._gateRect,
          ready: ['finisher', 'counter_attack', 'god_aura'].filter(id => E.skillState(s.enc, id).ready).map(id => h.icons[id].rect) };
      }, !defeated).catch(() => null);
      if (state) {
        if (state.phase === 'defeat') defeated = true;
        const rect = state.phase === 'defeat' ? { x: 475, y: 310, w: 330, h: 62 } : state.rect || state.ready[0];
        if (rect) {
          const c = await frame.locator('canvas').boundingBox();
          if (c) await page.mouse.click(c.x + (rect.x + rect.w / 2) * c.width / 1280, c.y + (rect.y + rect.h / 2) * c.height / 760);
        }
      }
      await page.waitForTimeout(250); continue;
    }
    const st = await page.evaluate(() => {
      const S = ADV.Expedition.Story, s = window.storyPreview; if (!s) return null;
      const r = s.record, b = r.reply || S.beats(s)[0];
      return { choice: b?.choice, options: b?.choice ? S.options(s, b.choice) : [] };
    }).catch(() => null);
    if (!st) { await page.waitForTimeout(150); continue; }
    const labels = (await page.locator('#panel button').allTextContents());
    let label = ['Continue', 'Begin fight', 'Retry fight'].find(l => labels.includes(l)) || (st.options.find(o => o.id === choices[st.choice]) || st.options[0])?.text;   // an option this branch can't see falls back to the first
    if (!label) label = labels.find(l => /^Leave .+ at the inn$/.test(l));
    if (!label) { await page.waitForTimeout(200); continue; }
    await page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(120);
  }
  throw Error('Chapter one did not reach the demo end card in time');
}

const FIGHT_NIB = { q1_wake: 'go', q1_wake_seen: 'nobody', q1_nib: 'draw', q1_cobb: 'nothing', q1_wren: 'kind' };
const SPARE_NIB = { q1_wake: 'go', q1_wake_seen: 'nobody', q1_nib: 'run', q1_cobb: 'bounty', q1_wren: 'cold' };

async function withServer(root, seen, fn) {
  const server = serve(root, seen);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try { return await fn('http://127.0.0.1:' + server.address().port, browser); }
  finally { await browser.close(); server.close(); }
}

async function record() {
  const seen = { files: new Set(), missing: new Set() };
  await withServer(ROOT, seen, async (base, browser) => {
    for (const [name, choices, forceDefeat] of [['fight Nib, one defeat', FIGHT_NIB, true], ['spare Nib', SPARE_NIB, false]]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
      const r = await play(page, base, choices, { entry: '/docs/STORY_CAMPAIGN_PREVIEW.html', forceDefeat });
      console.log('recorded: ' + name + (forceDefeat ? (r.defeated ? ' (defeat + retry seen)' : ' (no defeat happened)') : ''));
      await page.close();
    }
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await phone.goto(base + '/docs/STORY_CAMPAIGN_PREVIEW.html'); await phone.getByRole('button', { name: 'Begin story', exact: true }).waitFor();
    await phone.close();
  });
  const files = [...seen.files].filter(f => !/^(test|tools|docs\/(?!STORY_|story_preview))/.test(f)).sort();
  fs.writeFileSync(LIST, JSON.stringify({ recordedAt: new Date().toISOString(), note: 'Files chapter one requested in real play. Rebuild with node tools/site_demo.js record.', files }, null, 1) + '\n');
  console.log(files.length + ' files recorded -> ' + path.relative(ROOT, LIST) + (seen.missing.size ? '\nmissing during play (ignored): ' + [...seen.missing].join(', ') : ''));
}

// Chapter-one media the playthrough may not touch: every voice line of every
// branch, the chapter's tracks and its paintings.
function chapterOneMedia() {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/campaign.json')));
  const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/preview-media.json')));
  const m = d.music, tracks = new Set([m.quest[1], m.combat.road, m.dream, 'vg_lanternhold'].filter(Boolean));
  const p = d.presentation || {}, places = new Set(['lanternhold', ...(d.routes[1] || []), p.departures?.[1], p.arrivals?.[1]].filter(Boolean));
  for (const [key, id] of Object.entries(p.changes || {})) if (/^q1_/.test(key)) places.add(id);
  const files = new Set();
  for (const f of media) {
    if (/^audio\/vo\/campaign\/[^/]+\/q1_/.test(f)) files.add(f);
    const track = (/^audio\/music\/(.+)\.mp3$/.exec(f) || [])[1];
    if (track && tracks.has(track)) files.add(f);
  }
  for (const id of places) { const e = d.art.environments[id]; if (e) files.add(e.file); }
  for (const id of ['death']) { const s = d.art.stills[id]; if (s) files.add(s.file); }
  return [...files].filter(f => media.includes(f)).map(f => 'assets/expedition/story/media/' + f);
}

function build() {
  if (!fs.existsSync(LIST)) throw Error('Run node tools/site_demo.js record first');
  const recorded = JSON.parse(fs.readFileSync(LIST)).files;
  const want = new Set([...recorded, ...chapterOneMedia(), 'docs/STORY_CAMPAIGN_PREVIEW.html', 'docs/STORY_FIGHT_PREVIEW.html', 'docs/story_preview.js']);
  const missing = [...want].filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) throw Error('Listed files are missing:\n' + missing.join('\n'));
  // Freeze every source first and refuse a tree that changes underneath us.
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const frozen = new Map([...want].sort().map(f => [f, fs.readFileSync(path.join(ROOT, f))]));
  const hashes = new Map([...frozen].map(([f, b]) => [f, sha(b)]));
  const edit = (f, from, to) => {
    const s = frozen.get(f).toString(); if (s.split(from).length !== 2) throw Error('Unexpected build policy in ' + f + ': ' + from);
    frozen.set(f, Buffer.from(s.replace(from, to)));
  };
  edit('js/expedition/dev.js', 'Dev.DEV_BUILD = true;', 'Dev.DEV_BUILD = false;');
  // Voice and media list: only what ships, so the story never asks for the rest.
  const mediaKey = 'assets/expedition/story/preview-media.json';
  const shipped = JSON.parse(frozen.get(mediaKey)).filter(f => frozen.has('assets/expedition/story/media/' + f));
  frozen.set(mediaKey, Buffer.from(JSON.stringify(shipped, null, 2)));
  // The site address /expeditions/ opens the story title directly.
  const page = frozen.get('docs/STORY_CAMPAIGN_PREVIEW.html').toString();
  if (!page.includes('<base href="../">')) throw Error('Story page lost its base tag');
  frozen.set('index.html', Buffer.from(page.replace('<base href="../">', '')));
  for (const [f, h] of hashes) if (sha(fs.readFileSync(path.join(ROOT, f))) !== h) throw Error('Source changed during build: ' + f);
  fs.rmSync(OUT, { recursive: true, force: true });
  let bytes = 0;
  for (const [f, body] of frozen) {
    const out = path.join(OUT, f); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, body);
    if (sha(fs.readFileSync(out)) !== sha(body)) throw Error('Write verification failed: ' + f);
    bytes += body.length;
  }
  const big = [...frozen].filter(([, b]) => b.length > 95e6).map(([f]) => f);
  if (big.length) throw Error('Files too large for GitHub (100 MB): ' + big.join(', '));
  fs.writeFileSync(OUT + '-manifest.json', JSON.stringify({ builtAt: new Date().toISOString(), files: frozen.size, bytes,
    list: [...frozen].map(([f, b]) => ({ path: f, bytes: b.length, sha256: sha(b) })) }, null, 1));
  console.log('Built ' + frozen.size + ' files, ' + (bytes / 1e6).toFixed(1) + ' MB -> ' + path.relative(ROOT, OUT) +
    ' (voice lines: ' + shipped.filter(f => f.startsWith('audio/vo/')).length + ')');
}

async function verify() {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) throw Error('Build first');
  const seen = { files: new Set(), missing: new Set() };
  await withServer(path.resolve(OUT), seen, async (base, browser) => {
    for (const [name, choices] of [['fight Nib', FIGHT_NIB], ['spare Nib', SPARE_NIB]]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
      const r = await play(page, base, choices);
      if (r.errors.length) throw Error(r.errors.join('\n'));
      const card = await page.locator('.demo-end h1').textContent();
      if (!/coming soon/i.test(card)) throw Error('Unexpected end card: ' + card);
      if (await page.getByRole('button', { name: /arcade/i }).count()) throw Error('Arcade button in the demo');
      if (await page.locator('.dev-cog, #dev').count()) throw Error('Dev tools visible');
      console.log('verified: ' + name + ' -> "' + card.trim() + '"');
      await page.close();
    }
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await phone.goto(base + '/'); await phone.getByRole('button', { name: 'Begin story', exact: true }).waitFor();
    fs.mkdirSync(path.join(ROOT, 'test/reports/site-demo'), { recursive: true });
    await phone.screenshot({ path: path.join(ROOT, 'test/reports/site-demo/phone-title.png') });
    await phone.close();
  });
  const missing = [...seen.missing].filter(f => f !== 'favicon.ico');
  if (missing.length) throw Error('The package is missing files the game asked for:\n' + missing.join('\n'));
  console.log('Site demo verified: ' + seen.files.size + ' files served, nothing missing.');
}

const cmd = process.argv[2];
({ record, build, verify }[cmd] || (() => { console.log('Usage: node tools/site_demo.js record|build|verify'); process.exitCode = 1; }))();
if (cmd === 'record' || cmd === 'verify') Promise.resolve().catch(() => {});
process.on('unhandledRejection', e => { console.error(e); process.exit(1); });
