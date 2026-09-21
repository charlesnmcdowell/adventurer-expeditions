'use strict';
// Real Phaser/Actor intake check in an isolated browser profile. No production
// hooks, source-art files, save files or runtime modules are modified.
// Usage: node test/browser_art_intake_v2.js [--ship]
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { createHash } = require('node:crypto');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'reports/art-intake-v2');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.css': 'text/css' };
const ship = process.argv.includes('--ship') ? new Set(require('../tools/size_check.js').shipList().files) : null;
const families = { wolf: ['wolf-cleave-paired', 'wolf-pin-paired', 'wolf-rising-cut-paired'], plant: ['plant-stem-cut-paired', 'plant-vine-pin-paired', 'plant-crosscut-paired'], alpha: ['hiro-alpha-cleave-paired', 'hiro-alpha-pin-paired', 'hiro-alpha-parry-paired'] };
const expectedFrames = { wolf: [12, 6, 6], plant: [8, 6, 6], alpha: [8, 6, 6] };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const atlasFiles = () => {
    const base = path.join(ROOT, 'assets/expedition/hiro'), atlas = JSON.parse(fs.readFileSync(path.join(base, 'hiro.json'), 'utf8'));
    return ['hiro.json', ...atlas.textures.map(t => t.image)].map(file => { const bytes = fs.readFileSync(path.join(base, file)); return { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; });
  };
  const runtimeFiles = atlasFiles();
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html', file = path.resolve(ROOT, rel);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory() || (ship && !ship.has(rel))) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await require('playwright').chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const errors = [], reports = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.status() + ' ' + r.url()); });
    await page.goto('http://127.0.0.1:' + server.address().port + '/index.html?at=inn&renderer=canvas');
    await page.waitForFunction(() => window.__game?.scene.getScene('Inn')?.isPortalReady(), null, { timeout: 60000 });
    await page.evaluate(() => {
      const X = ADV.Expedition, game = window.__game;
      for (const s of game.scene.getScenes(true)) game.scene.stop(s.sys.settings.key);
      class IntakeScene extends Phaser.Scene {
        constructor() { super('IntakeV2'); }
        preload() { this.__needsAlpha = true; X.Painted.preload(this); }
        create() {
          this.paused = false; this.game_ = { world: { seed: 11, questClock: 0 }, quest: { travel: { weather: 'clear' } } };
          this.actors = new Map(); this.env = ADV.BattleArt.paint(this, 'forest', 'day');
          Promise.resolve(this.env.ready).then(ok => {
            if (ok === false) throw new Error('QA scenery failed');
            window.__intakeQa = this;
          });
        }
        resumeQa() {
          this.paused = false; this.time.paused = false; this.tweens.resumeAll();
          for (const a of this.actors.values()) a.syncPause(); this.waiting = null;
        }
        holdQa(name) {
          this.waiting = name; this.paused = true; this.time.paused = true; this.tweens.pauseAll();
          for (const a of this.actors.values()) a.syncPause();
        }
        clearActors() {
          this.resumeQa(); for (const a of this.actors.values()) a.root.destroy(); this.actors.clear();
          this.result = null; this.failure = null;
        }
        setup(kind) {
          this.clearActors();
          const unit = { chp: 100, maxHp: 100, statuses: [], ch: { name: 'Hiro' } };
          this.hero = new X.Actor(this, { uid: 'hero', unit, side: 'a', x: 400, y: 612, height: 330, kind: 'hero', sheet: X.Painted.sheet(this, 'hiro') });
          this.actors.set('hero', this.hero);
          if (kind) {
            const id = kind === 'wolf' ? 'dire_wolf' : kind === 'plant' ? 'thorn_lurker' : 'road_wolf_leader';
            const sheetId = kind === 'alpha' ? 'alpha' : kind;
            const ch = { expeditionKey: id };
            if (kind === 'alpha') ch.expeditionArtIdentity = 'tutorial-alpha';
            this.foe = new X.Actor(this, { uid: 'foe', unit: { chp: 0, maxHp: 100, statuses: [], ch }, side: 'b', x: 850, y: 612, height: kind === 'wolf' ? 185 : kind === 'plant' ? 215 : 330, kind: kind === 'alpha' ? 'boss' : kind, sheet: X.Painted.sheet(this, sheetId) });
            this.actors.set('foe', this.foe);
          }
          return this.hero;
        }
        async finisher(kind, level) {
          const h = this.setup(kind), target = this.foe;
          const opts = { target, level, lethal: true }, id = h.sheetClipFor('finisher', opts), pairSheet = opts.sheet || h.sheet, clip = pairSheet.clips[id];
          if (!clip.paired) throw new Error('Selected an unpaired fallback for ' + kind + level);
          const result = { id, kind, level, frames: clip.frames.length, contacts: 0, releases: 0, contactFrames: [], seen: [], scales: [], metadataContacts: clip.contact || clip.contactFramesZeroBased,
            releaseFrame: clip.release != null ? clip.release : clip.releaseFrameZeroBased, expectedDuration: clip.durationMs || clip.durationMsDraft, baseline: [h._baseScaleX, h._baseScaleY], pairBaseline: [h.height / (pairSheet.standing || h.img.height), h.height / (pairSheet.standing || h.img.height)], hiddenOnContact: false, hiddenOnRelease: false, done: false };
          this.result = result;
          const note = (anim, f) => {
            if (anim.key !== h.animKey(id, pairSheet)) return;
            if (!result.seen.includes(f.index - 1)) result.seen.push(f.index - 1);
            result.scales.push([h.img.scaleX, h.img.scaleY]);
            if (id === 'wolf-cleave-paired' && (f.index - 1 === 5 || f.index - 1 === 6)) this.holdQa('seam-' + (f.index - 1));
          };
          h.img.on('animationstart', note); h.img.on('animationupdate', note);
          const started = this.time.now;
          await h.play('finisher', { ...opts, onContact: () => {
            result.contacts++; result.contactFrames.push(h.img.anims.currentFrame.index - 1); result.hiddenOnContact = !target.root.visible;
            this.holdQa('contact');
          }, onRelease: () => { result.releases++; result.hiddenOnRelease = !target.root.visible; this.holdQa('recovery'); } });
          h.img.off('animationstart', note); h.img.off('animationupdate', note);
          result.elapsedSceneMs = this.time.now - started;
          result.alive = target.alive; result.visible = target.root.visible; result.idle = h.img.anims.currentAnim.key;
          result.scaleAfter = [h.img.scaleX, h.img.scaleY]; result.playbackCleared = h._playback === null; result.finalX = h.x;
          const victimFrame = target.img.frame.name;
          await X.Beats.ticksOnly(this, [{ t: 'down', uid: 'foe', by: 'hero' }]);
          result.downDidNotRevive = !target.alive && !target.root.visible && target.img.frame.name === victimFrame;
          // Wrong species, nonlethal outcomes and recolored creatures may not
          // select a clip containing a different or dying animal.
          target.alive = true;
          result.nonlethalPaired = !!pairSheet.clips[h.sheetClipFor('finisher', { ...opts, lethal: false })].paired;
          const other = kind === 'wolf' ? 'plant' : kind === 'plant' ? 'wolf' : 'plant'; target.kind = other;
          result.wrongSpeciesAccepted = h.canPair(clip, 'finisher', opts);
          target.kind = kind === 'alpha' ? 'boss' : kind; target.img.__baseTint = 0x55aa55;
          result.tintedAccepted = h.canPair(clip, 'finisher', opts);
          delete target.img.__baseTint; target.alive = false;
          result.done = true;
        }
        async locomotion() {
          const h = this.setup(), c = h.sheet.clips.walk, seen = new Set(), scales = [], result = { frames: c.frames.length, baseline: [h._baseScaleX, h._baseScaleY], done: false };
          this.result = result;
          const note = (a, f) => { if (a.key === h.animKey('walk')) { seen.add(f.index - 1); scales.push([h.img.scaleX, h.img.scaleY]); } };
          h.img.on('animationstart', note); h.img.on('animationupdate', note);
          this.holdQa('idle-before-run');
          await new Promise(r => { const on = () => { if (!this.paused) { this.events.off('update', on); r(); } }; this.events.on('update', on); });
          const first = () => { h.img.off('animationstart', first); this.holdQa('run-first-frame'); };
          h.img.on('animationstart', first);
          await h.play('walk', { x: 650, duration: (c.durationMs || c.durationMsDraft || 1000) * 2 + 150 });
          h.img.off('animationstart', note); h.img.off('animationupdate', note);
          result.seen = [...seen]; result.scales = scales; result.idleAfterRun = h.img.anims.currentAnim.key;
          await h.play('victory');
          const rest = h.sheet.clips['idle-sheathed']; result.restFrames = rest.frames.length; result.sheathed = h._sheathed;
          result.idleAfterVictory = h.img.anims.currentAnim.key;
          const restSeen = new Set(); const onRest = (a, f) => { if (a.key === h.animKey('idle-sheathed')) restSeen.add(f.index - 1); };
          h.img.on('animationupdate', onRest);
          await new Promise(r => this.time.delayedCall((rest.durationMs || rest.durationMsDraft || 1000) * 2 + 100, r));
          h.img.off('animationupdate', onRest);
          result.restSeen = [...restSeen]; result.scaleAfter = [h.img.scaleX, h.img.scaleY]; result.done = true;
        }
      }
      game.scene.add('IntakeV2', IntakeScene, true);
    });
    await page.waitForFunction(() => !!window.__intakeQa, null, { timeout: 30000 });
    const metadata = await page.evaluate(() => { const h = ADV.Expedition.Painted.sheet(__intakeQa, 'hiro'); return { clips: Object.keys(h.clips), walk: h.clips.walk.frames.length, rest: h.clips['idle-sheathed']?.frames.length, canvas: h.canvas, standing: h.standing }; });
    assert.equal(metadata.walk, 16, 'v4 run must be intaken before this test'); assert.equal(metadata.rest, 4);
    async function drain(label, maxMs) {
      const deadline = Date.now() + maxMs, captured = new Set();
      while (Date.now() < deadline) {
        const state = await page.evaluate(() => ({ waiting: __intakeQa.waiting, done: __intakeQa.result?.done, failure: __intakeQa.failure }));
        if (state.failure) throw new Error(state.failure);
        if (state.done) return page.evaluate(() => __intakeQa.result);
        if (state.waiting) {
          if (!captured.has(state.waiting)) { await page.screenshot({ path: path.join(OUT, label + '-' + state.waiting + '.png') }); captured.add(state.waiting); }
          await page.evaluate(() => __intakeQa.resumeQa());
        }
        await page.waitForTimeout(30);
      }
      throw new Error('Animation completion timed out: ' + label + ' ' + JSON.stringify(await page.evaluate(() => __intakeQa.result)));
    }
    for (const [kind, ids] of Object.entries(families)) for (let level = 1; level <= 3; level++) {
      await page.evaluate(({ kind, level }) => { __intakeQa.finisher(kind, level).catch(e => { __intakeQa.failure = String(e.stack || e); }); }, { kind, level });
      const result = await drain(kind + '-l' + level, 20000);
      assert.equal(result.id, ids[level - 1]); assert.equal(result.frames, expectedFrames[kind][level - 1]); assert.equal(result.contacts, 1); assert.equal(result.releases, 1);
      assert.deepEqual(result.contactFrames, [result.metadataContacts[0]]); assert.equal(result.seen.length, result.frames);
      assert.equal(result.hiddenOnContact, true); assert.equal(result.hiddenOnRelease, true); assert.equal(result.alive, false); assert.equal(result.visible, false); assert.equal(result.downDidNotRevive, true);
      assert.match(result.idle, /:idle$/); assert.equal(result.playbackCleared, true); assert.equal(result.finalX, 400);
      assert.equal(result.nonlethalPaired, false); assert.equal(result.wrongSpeciesAccepted, false); assert.equal(result.tintedAccepted, false);
      for (const scale of result.scales) assert.deepEqual(scale, kind === 'alpha' ? result.pairBaseline : result.baseline);
      assert.deepEqual(result.scaleAfter, result.baseline);
      reports.push(result); console.log('ok ' + result.id + ': one contact, complete recovery, hidden victim');
    }
    await page.evaluate(() => { __intakeQa.locomotion().catch(e => { __intakeQa.failure = String(e.stack || e); }); });
    const locomotion = await drain('hiro', 20000);
    assert.equal(locomotion.frames, 16); assert.equal(locomotion.seen.length, 16); assert.match(locomotion.idleAfterRun, /:idle$/);
    assert.equal(locomotion.restFrames, 4); assert.equal(locomotion.restSeen.length, 4); assert.equal(locomotion.sheathed, true); assert.match(locomotion.idleAfterVictory, /:idle-sheathed$/);
    for (const scale of [...locomotion.scales, locomotion.scaleAfter]) assert.deepEqual(scale, locomotion.baseline);
    await page.screenshot({ path: path.join(OUT, 'hiro-sheathed-idle.png') });
    assert.deepEqual(errors, []);
    assert.deepEqual(atlasFiles(), runtimeFiles, 'runtime atlas changed during test; rerun against the finished build');
    fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ ship: !!ship, runtimeFiles, metadata, reports, locomotion, errors }, null, 2) + '\n');
    console.log('browser_art_intake_v2: 9 finishers, 16 run frames and4 sheathed idle frames passed');
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
