'use strict';
// Chapter-one story demo for neverendingnarratives.com/expeditions/ (Hiro,
// 2026-10-12: "adventurer expeditions added as a second game on the site with
// only the chapter 1 demo available").
//
//   node tools/site_demo.js build    copy the game into dist/site-demo
//   node tools/site_demo.js verify   serve that copy, open the title and each
//                                    chapter-one fight; any missing file or page
//                                    error fails
//
// A straight copy of what the game runs on (index pages, js, lib, audio, assets)
// with two cuts to keep the site under GitHub Pages' 1 GB: story voices, music and
// paintings are chapter one's only, and story enemy art is chapter one's four
// opponents only. The dev tools are switched off. The demo itself stops after
// chapter one (DEMO_THROUGH in docs/story_preview.js; ?through only works on a
// local server), so nothing past it is playable from the site.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'dist', 'site-demo');
const TOP = ['js', 'lib', 'audio', 'assets'];
const PAGES = ['docs/STORY_CAMPAIGN_PREVIEW.html', 'docs/STORY_FIGHT_PREVIEW.html', 'docs/story_preview.js'];
// The four chapter-one opponents' art (story_art.js bindings for Nib, Cobb, the
// Hired Knife and the Consortium Mage).
const CH1_ENEMIES = new Set(['story_nib', 'story_cobb', 'story_hired_knife', 'story_consortium_mage']);

function chapterOneMedia() {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/campaign.json')));
  const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/preview-media.json')));
  const m = d.music, tracks = new Set([m.quest[1], m.quest[2], m.combat.road, m.dream, 'vg_lanternhold'].filter(Boolean));   // chapter two's track plays behind the coming-soon card
  const p = d.presentation || {}, places = new Set(['lanternhold', ...(d.routes[1] || []), p.departures?.[1], p.arrivals?.[1]].filter(Boolean));
  for (const [key, id] of Object.entries(p.changes || {})) if (/^q1_/.test(key)) places.add(id);
  const keep = new Set();
  for (const f of media) {
    if (/^audio\/vo\/campaign\/[^/]+\/q1_/.test(f)) keep.add(f);
    const track = (/^audio\/music\/(.+)\.mp3$/.exec(f) || [])[1];
    if (track && tracks.has(track)) keep.add(f);
  }
  for (const id of places) { const e = d.art.environments[id]; if (e) keep.add(e.file); }
  // Panoramas behind the title and departure scenes travel with their place.
  for (const f of media) if (/panorama_/.test(f) && [...places].some(id => f.includes('panorama_' + id + '.'))) keep.add(f);
  const death = d.art.stills.death; if (death) keep.add(death.file);
  return { keep, media };
}

function skip(rel, media) {
  if (rel.startsWith('assets/expedition/story/media/')) return !media.keep.has(rel.slice('assets/expedition/story/media/'.length));
  const enemy = (/^assets\/expedition\/(?:adult\/)?(story_[a-z_]+?)(?:-fatal)?\//.exec(rel) || [])[1];
  if (enemy) return !CH1_ENEMIES.has(enemy);
  return false;
}

function walk(dir, out) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
}

function build() {
  const media = chapterOneMedia();
  const files = [...TOP.flatMap(t => walk(t, [])), ...PAGES].filter(f => !skip(f, media));
  fs.rmSync(OUT, { recursive: true, force: true });
  let bytes = 0;
  const write = (rel, body) => { const out = path.join(OUT, rel); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, body); bytes += body.length; };
  for (const rel of files) {
    let body = fs.readFileSync(path.join(ROOT, rel));
    if (rel === 'js/expedition/dev.js') {
      const s = body.toString(); if (!s.includes('Dev.DEV_BUILD = true;')) throw Error('dev.js switch moved');
      body = Buffer.from(s.replace('Dev.DEV_BUILD = true;', 'Dev.DEV_BUILD = false;'));
    }
    if (rel === 'assets/expedition/story/preview-media.json')
      body = Buffer.from(JSON.stringify(media.media.filter(f => media.keep.has(f)), null, 2));   // only what ships
    if (body.length > 95e6) throw Error('Too large for GitHub (100 MB per file): ' + rel);
    write(rel, body);
  }
  // /expeditions/ opens the story title directly.
  const page = fs.readFileSync(path.join(ROOT, 'docs/STORY_CAMPAIGN_PREVIEW.html'), 'utf8');
  if (!page.includes('<base href="../">')) throw Error('Story page lost its base tag');
  write('index.html', Buffer.from(page.replace('<base href="../">', '')));
  console.log('Built ' + (files.length + 1) + ' files, ' + (bytes / 1e6).toFixed(0) + ' MB -> ' + path.relative(ROOT, OUT) +
    ' (chapter-one voice lines: ' + [...media.keep].filter(f => f.startsWith('audio/vo/')).length + ')');
}

async function verify() {
  const root = path.resolve(OUT);
  if (!fs.existsSync(path.join(root, 'index.html'))) throw Error('Build first');
  const missing = new Set();
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html', file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { if (rel !== 'favicon.ico') missing.add(rel); res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' }[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, { chromium } = require('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true }), errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(base + '/'); await page.getByRole('button', { name: 'Begin story', exact: true }).waitFor();
    if (await page.getByRole('button', { name: /arcade/i }).count()) throw Error('Arcade button in the demo');
    await page.getByRole('button', { name: 'Begin story', exact: true }).click();
    await page.getByText('Chapter 1', { exact: true }).waitFor();
    console.log('title and chapter card: ok');
    // Each chapter-one fight, opened from a save at that fight.
    for (const encounter of [0, 1, 2]) {
      await page.evaluate(e => { const S = ADV.Expedition.Story, s = S.open(S.fresh()), r = s.record;
        r.encounter = e; r.phase = 'combat'; r.titleCards = [1]; S.syncQuest(s); S.save(s); }, encounter);
      await page.goto(base + '/docs/STORY_FIGHT_PREVIEW.html?muted=1');
      await page.waitForFunction(() => window.storyGame?.scene.getScene('StoryBattle')?.hero, null, { timeout: 120000 });
      await page.waitForTimeout(4000);
      console.log('chapter-one fight ' + (encounter + 1) + ': loaded');
    }
    // The demo end: chapter one finished, chapter two departure.
    await page.evaluate(() => { const S = ADV.Expedition.Story, s = S.open(S.fresh()), r = s.record;
      r.chapter = 2; r.phase = 'departure'; r.completed = [1]; r.titleCards = [1]; S.syncQuest(s); S.save(s); });
    await page.goto(base + '/'); await page.getByRole('button', { name: 'Continue story', exact: true }).click();
    const card = await page.locator('.demo-end h1').textContent({ timeout: 15000 });
    if (!/coming soon/i.test(card)) throw Error('Unexpected end card: ' + card);
    console.log('demo end card: "' + card.trim() + '"');
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await phone.goto(base + '/'); await phone.getByRole('button', { name: /story/i }).first().waitFor();
    fs.mkdirSync(path.join(ROOT, 'test/reports/site-demo'), { recursive: true });
    await phone.screenshot({ path: path.join(ROOT, 'test/reports/site-demo/phone-title.png') });
  } finally { await browser.close(); server.close(); }
  if (errors.length) throw Error('Page errors:\n' + errors.join('\n'));
  if (missing.size) throw Error('Missing from the package:\n' + [...missing].join('\n'));
  console.log('Site demo verified: nothing missing, no page errors.');
}

const cmd = process.argv[2];
const run = { build, verify }[cmd];
if (!run) { console.log('Usage: node tools/site_demo.js build|verify'); process.exitCode = 1; }
else Promise.resolve(run()).catch(e => { console.error(e.message || e); process.exitCode = 1; });
