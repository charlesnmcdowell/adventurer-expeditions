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
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'dist', 'site-demo');
const RECEIPT = path.join(ROOT, 'dist', 'site-demo-verified.json');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function frozenFiles(dir=OUT, prefix='', skipDot=false) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    if(skipDot&&e.name.startsWith('.'))return [];
    const rel=prefix+e.name,full=path.join(dir,e.name);
    if(e.isSymbolicLink())throw Error('Refusing linked package entry: '+rel);
    return e.isDirectory()?frozenFiles(full,rel+'/',skipDot):[{file:rel,bytes:fs.statSync(full).size,sha256:sha(full)}];
  }).sort((a,b)=>a.file.localeCompare(b.file));
}
const TOP = ['js', 'lib', 'audio', 'assets'];
const PAGES = ['docs/STORY_CAMPAIGN_PREVIEW.html', 'docs/STORY_FIGHT_PREVIEW.html', 'docs/story_preview.js', 'docs/story_companions.css'];
// The package carries chapters 1..SITE_THROUGH. Anyone can play 1..PUBLIC_THROUGH;
// the password opens the rest (Hiro, 2026-10-14: chapter one free, "allow players
// to play chapter 2-5 if they know password"). Raise either to open more; media
// and enemy art follow SITE_THROUGH automatically.
const SITE_THROUGH = Number(process.env.EXPEDITIONS_SITE_THROUGH || 6), PUBLIC_THROUGH = 1;
if(!Number.isInteger(SITE_THROUGH)||SITE_THROUGH<1||SITE_THROUGH>14)throw Error('EXPEDITIONS_SITE_THROUGH must be 1..14');
// Size projection only; never bypass the production art-approval switch in a build.
const PROJECT_COMPANIONS=process.argv[2]==='size'&&process.argv.includes('--include-companions');
// Arcade-only art the story never loads (its one Arcade creature is the wolf;
// the travel art stays, because the story's road trips between chapters use it).
// Left out to keep the website under GitHub Pages' 1 GB.
const ARCADE_ONLY = new Set(['alpha', 'beetle', 'boar', 'crab', 'dark_swordswoman', 'elven_ranger', 'elven_wizard', 'enchantress', 'goblin',
  'hag', 'hydra', 'moss_giant', 'orc', 'plant', 'serpent', 'spider', 'toad', 'vulture']);
const CHAPTERS = Array.from({ length: SITE_THROUGH }, (_, i) => i + 1);

// Enemy art for every opponent fought in those chapters (story_art.js bindings).
function shippedEnemies() {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/campaign.json')));
  const art = fs.readFileSync(path.join(ROOT, 'js/expedition/story_art.js'), 'utf8');
  const actors = new Map([...art.matchAll(/S\.bindings\['([a-z_]+:[a-z_]+)'\]=\{actor:'([a-z_]+)'/g)].map(m => [m[1], m[2]]));
  const out = new Set();
  for (const e of d.combatRoster) if (e.appearances.some(a => a.chapter <= SITE_THROUGH)) {
    const actor = actors.get(e.kind + ':' + e.id); if (actor) out.add(actor);
  }
  return out;
}

// Ship only enabled, chapter-eligible companion sets. Draft pilots stay local.
function shippedCompanions() {
  const source=fs.readFileSync(path.join(ROOT,'js/expedition/story_companions.js'),'utf8');
  if(!PROJECT_COMPANIONS&&/enabled\s*:\s*false/.test(source))return new Set();
  return new Set([...source.matchAll(/^ ([a-z_]+):\{join:(\d+),/gm)]
    .filter(m=>Number(m[2])<=SITE_THROUGH).map(m=>'companion_'+m[1]));
}

function chapterOneMedia() {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/campaign.json')));
  const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/expedition/story/preview-media.json')));
  // The next chapter's track plays behind the coming-soon card.
  const m = d.music, tracks = new Set([...CHAPTERS.map(n => m.quest[n]), m.quest[PUBLIC_THROUGH + 1], m.quest[SITE_THROUGH + 1],
    ...CHAPTERS.map(n => m.combatByQuest?.[n] || m.combat[n >= m.cityFrom ? 'city' : 'road']), m.dream, 'vg_lanternhold'].filter(Boolean));
  const p = d.presentation || {}, places = new Set(['lanternhold']);
  for (const n of CHAPTERS) for (const id of [...(d.routes[n] || []), p.departures?.[n], p.arrivals?.[n]]) if (id) places.add(id);
  const keyed = new RegExp('^q(' + CHAPTERS.join('|') + ')_'), voiced = new RegExp('^audio/vo/campaign/[^/]+/q(' + CHAPTERS.join('|') + ')_');
  for (const [key, id] of Object.entries(p.changes || {})) if (keyed.test(key)) places.add(id);
  const keep = new Set();
  for (const f of media) {
    if (voiced.test(f)) keep.add(f);
    const bark=/^audio\/vo\/campaign\/([a-z_]+)\/banter_/.exec(f);
    if(bark&&shippedCompanions().has('companion_'+bark[1]))keep.add(f);
    const track = (/^audio\/music\/(.+)\.mp3$/.exec(f) || [])[1];
    if (track && tracks.has(track)) keep.add(f);
  }
  for (const id of places) { const e = d.art.environments[id]; if (e) keep.add(e.file); }
  // Panoramas behind the title and departure scenes travel with their place.
  for (const f of media) if (/panorama_/.test(f) && [...places].some(id => f.includes('panorama_' + id + '.'))) keep.add(f);
  // Story stills by the chapter they appear in (story_presentation.js P.scene).
  const STILLS = { 1: ['death'], 2: ['bounty'], 4: ['dream_1'], 7: ['dream_2', 'valve_scene'], 10: ['letter', 'dream_3'], 12: ['reveal', 'frost'],
    14: ['altar', 'altar_amara', 'hiwot_sacrifice', 'hiwot_bound', 'ending_hero', 'ending_vengeance', 'ending_usurper', 'ending_mercy', 'ending_empty'] };
  for (const n of CHAPTERS) for (const id of STILLS[n] || []) { const st = d.art.stills[id]; if (st) keep.add(st.file); }
  return { keep, media, enemies: shippedEnemies(), companions: shippedCompanions() };
}

function skip(rel, media) {
  if(rel.startsWith('assets/expedition/story/effects/companion-'))return !media.companions.size;
  const companion=(/^assets\/expedition\/(companion_[a-z_]+)\//.exec(rel)||[])[1];
  if(companion)return !media.companions.has(companion);
  if (rel.startsWith('assets/expedition/story/media/')) return !media.keep.has(rel.slice('assets/expedition/story/media/'.length));
  const enemy = (/^assets\/expedition\/(?:adult\/)?(story_[a-z_]+?)(?:-fatal)?\//.exec(rel) || [])[1];
  if (enemy) return !media.enemies.has(enemy);
  const folder = (/^assets\/expedition\/(?:adult\/)?([a-z_]+?)(?:-fatal)?\//.exec(rel) || [])[1];
  return !!folder && ARCADE_ONLY.has(folder);
}

function walk(dir, out) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
}

function size() {
  const media=chapterOneMedia(),files=[...TOP.flatMap(t=>walk(t,[])),...PAGES].filter(f=>!skip(f,media));
  const bytes=files.reduce((sum,f)=>sum+fs.statSync(path.join(ROOT,f)).size,0)+fs.statSync(path.join(ROOT,'docs/STORY_CAMPAIGN_PREVIEW.html')).size;
  const result={chapters:SITE_THROUGH,companions:media.companions.size,projectedCompanions:PROJECT_COMPANIONS,bytes,MB:Math.round(bytes/1e4)/100,GBHeadroom:Math.round((1e9-bytes)/1e4)/100,files:files.length+1};
  console.log(JSON.stringify(result,null,2));return result;
}

function build() {
  const media = chapterOneMedia();
  const files = [...TOP.flatMap(t => walk(t, [])), ...PAGES].filter(f => !skip(f, media));
  if(path.resolve(OUT)!==path.resolve(ROOT,'dist','site-demo'))throw Error('Unsafe build target');
  fs.rmSync(RECEIPT,{force:true});
  fs.rmSync(OUT, { recursive: true, force: true });
  let bytes = 0;
  const write = (rel, body) => { const out = path.join(OUT, rel); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, body); bytes += body.length; };
  for (const rel of files) {
    let body = fs.readFileSync(path.join(ROOT, rel));
    // The public demo only ships chapter-one media. Never inherit the broader
    // local development cap or allow QA query parameters to request absent art.
    if(rel==='docs/story_preview.js'){
      const s=body.toString();if(!/const DEMO_THROUGH=\d+/.test(s))throw Error('Story chapter cap moved');
      // Public cap, password cap, and no ?through on the website.
      const cap='const PLAYABLE_THROUGH=localHost&&askedThrough>=1&&askedThrough<=14?askedThrough:unlocked()?Math.max(DEMO_THROUGH,UNLOCK_THROUGH):DEMO_THROUGH;';
      if(!s.includes(cap)||!s.includes('const UNLOCK_THROUGH=DEMO_THROUGH,'))throw Error('Story unlock code moved');
      body=Buffer.from(s.replace(/const DEMO_THROUGH=\d+/,'const DEMO_THROUGH='+PUBLIC_THROUGH).replace('const UNLOCK_THROUGH=DEMO_THROUGH,','const UNLOCK_THROUGH='+SITE_THROUGH+',')
        .replace(cap,'const PLAYABLE_THROUGH=unlocked()?Math.max(DEMO_THROUGH,UNLOCK_THROUGH):DEMO_THROUGH;'));
    }
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
  fs.rmSync(RECEIPT,{force:true});
  const frozen=frozenFiles();
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
    // Public lock: after chapter PUBLIC_THROUGH a stranger reaches the coming-soon
    // card; a wrong password is refused and the right one opens the rest.
    if (SITE_THROUGH > PUBLIC_THROUGH) {
      const done = CHAPTERS.filter(n => n <= PUBLIC_THROUGH);
      await page.evaluate(([next, done]) => { const S = ADV.Expedition.Story, s = S.open(S.fresh()), r = s.record;
        r.chapter = next; r.phase = 'inn'; r.completed = done; r.titleCards = done; S.syncQuest(s); S.save(s); }, [PUBLIC_THROUGH + 1, done]);
      await page.goto(base + '/'); await page.getByRole('button', { name: 'Continue story', exact: true }).click();
      await page.locator('#story-embark').click();
      const locked = await page.locator('.demo-end h1').textContent({ timeout: 15000 });
      if (!locked.includes('Chapter ' + (PUBLIC_THROUGH + 1))) throw Error('Public lock missing: ' + locked);
      const box = page.locator('.demo-end input[type=password]');
      await box.fill('not it'); await box.press('Enter');
      await page.getByText("That's not it.").waitFor();
      await box.fill('Hiro'); await box.press('Enter');
      await page.waitForURL(/.*/); await page.getByRole('button', { name: 'Continue story', exact: true }).waitFor({ timeout: 15000 });
      const notice = await page.locator('#panel .notice').first().textContent();
      if (!notice.includes('1–' + SITE_THROUGH)) throw Error('Password did not open the chapters: ' + notice);
      console.log('public lock at chapter ' + (PUBLIC_THROUGH + 1) + ', wrong password refused, password opens 1–' + SITE_THROUGH);
      // The locked card already left the inn, so Continue plays the road trip.
      await page.getByRole('button', { name: 'Continue story', exact: true }).click();
      await page.locator('.travel-caption').waitFor({ timeout: 15000 });
      await page.waitForFunction(() => window.storyBackdrop?.state()?.kind === 'travel', null, { timeout: 30000 });
      await page.waitForFunction(() => !window.storyPreview?.record.travelPending, null, { timeout: 60000 });
      await page.getByText('Chapter ' + (PUBLIC_THROUGH + 1), { exact: true }).waitFor({ timeout: 15000 });
      console.log('road trip into chapter ' + (PUBLIC_THROUGH + 1) + ' played, chapter card shown');
    }
    if(shippedCompanions().size&&SITE_THROUGH>=2){
      await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.fresh());Object.assign(s.record,{chapter:2,phase:'departure',titleCards:[1,2]});S.syncQuest(s);ADV.Campaign3.recruit(s.game,'wren_ward');S.Companions.queueUnlocks(s,[]);S.save(s);});
      await page.goto(base+'/');await page.getByRole('button',{name:'Continue story',exact:true}).click();
      await page.locator('#companion-unlocked').waitFor();await page.getByRole('button',{name:'Accept',exact:true}).click();
      await page.locator('#companion-confirm').waitFor();await page.getByRole('button',{name:'Set out',exact:true}).click();
      await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());s.record.phase='combat';s.record.encounter=0;S.save(s);});
      await page.goto(base+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');
      await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__presentationReady,null,{timeout:120000});
      const allies=await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').enc.allies.length);
      if(allies!==1)throw Error('Packaged Hiwot party fight did not load');
      console.log('companion welcome, Accept, party confirmation and Hiwot battle: ok');
    }else console.log('Companion package QA deferred: production roster is awaiting art approval.');
    // Every fight in the playable chapters, opened from a save at that fight.
    for (const chapter of CHAPTERS) {
      const fights = await page.evaluate(n => ADV.DATA.CAMPAIGN3_QUESTS[n - 1].enc.length, chapter);
      for (let encounter = 0; encounter < fights; encounter++) {
        await page.evaluate(([c, e, cards]) => { const S = ADV.Expedition.Story, s = S.open(S.fresh()), r = s.record;
          r.chapter = c; r.encounter = e; r.phase = 'combat'; r.titleCards = cards; r.completed = cards.filter(n => n < c); S.syncQuest(s); S.save(s); }, [chapter, encounter, CHAPTERS]);
        await page.goto(base + '/docs/STORY_FIGHT_PREVIEW.html?muted=1');
        await page.waitForFunction(() => window.storyGame?.scene.getScene('StoryBattle')?.hero, null, { timeout: 120000 });
        await page.waitForTimeout(4000);
        console.log('chapter ' + chapter + ' fight ' + (encounter + 1) + ': loaded');
      }
    }
    // The last playable chapter returns to the inn. A paid rest must load its
    // actual scene from the frozen package before Continue reaches the boundary.
    await page.evaluate(([next, done]) => { const S = ADV.Expedition.Story, s = S.open(S.fresh()), r = s.record;
      r.chapter = next; r.phase = 'inn'; r.completed = done; r.titleCards = done; r.run.hp=80;r.run.hpMax=344;r.run.score=2000;S.syncQuest(s); S.save(s); }, [SITE_THROUGH + 1, CHAPTERS]);
    await page.goto(base + '/'); await page.getByRole('button', { name: 'Continue story', exact: true }).click();
    await page.locator('#story-rest').click();
    const bath=await page.locator('iframe[title="Moonlit bathhouse"]').elementHandle().then(e=>e.contentFrame());
    await bath.waitForFunction(()=>window.bathhouse?.ready);
    await page.getByRole('button',{name:'Return to inn',exact:true}).click();
    await page.locator('#story-embark').click();
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
  if(JSON.stringify(frozen)!==JSON.stringify(frozenFiles()))throw Error('Package changed during verification');
  fs.writeFileSync(RECEIPT,JSON.stringify({verifiedAt:new Date().toISOString(),files:frozen},null,2));
  console.log('Site demo verified: nothing missing, no page errors.');
}

// Publish only the exact tested bytes into the Expeditions Pages repo
// (charlesnmcdowell/audiobook2-audio), at the repo root. Git remains the
// deployment transport; this command neither commits nor pushes anything.
function stage() {
  const site=path.resolve(process.argv[3]||'');
  if(!process.argv[3]||!fs.existsSync(path.join(site,'.git')))throw Error('Pass the Expeditions Pages checkout');
  const remote=require('node:child_process').execSync('git remote get-url origin',{cwd:site,encoding:'utf8'}).trim();
  if(!/audiobook2-audio(?:\.git)?$/.test(remote))throw Error('Wrong Pages repo');
  const receipt=JSON.parse(fs.readFileSync(RECEIPT,'utf8'));
  if(JSON.stringify(receipt.files)!==JSON.stringify(frozenFiles()))throw Error('Package is not the verified copy; run verify');
  const dest=site;
  if(dest===ROOT)throw Error('Unsafe stage target');
  if(fs.lstatSync(dest).isSymbolicLink())throw Error('Refusing linked destination');
  const allowed=new Set(receipt.files.map(f=>f.file));
  allowed.add('README.md');
  // No blanket deletion. Unexpected pre-existing files require manual review.
  for(const f of frozenFiles(dest,'',true))if(!allowed.has(f.file))throw Error('Unexpected destination file: '+f.file);
  for(const f of receipt.files){const to=path.join(dest,f.file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(OUT,f.file),to);if(sha(to)!==f.sha256)throw Error('Staged hash mismatch: '+f.file);}
  console.log('Staged '+receipt.files.length+' verified files -> '+dest);
}

const cmd = process.argv[2];
const run = { build, verify, stage, size }[cmd];
if (!run) { console.log('Usage: node tools/site_demo.js build|verify|size [--include-companions]|stage <audiobook2-audio-checkout>'); process.exitCode = 1; }
else Promise.resolve(run()).catch(e => { console.error(e.message || e); process.exitCode = 1; });
