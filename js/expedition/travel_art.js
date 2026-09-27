// Painted travel beats: one authored timeline controls body pose, world contact,
// camera translation and environmental reactions. No whole-body squash/tween.
(function () {
'use strict';
const X = ADV.Expedition, Travel = X.TravelArt = {};
Travel.select = function (run, leg) {
  const id = run && run.questId;
  if (id === 'marsh') return 'swamp-log-slide';
  if (id === 'city') return leg === 'return' || (run.wave || 0) >= 2 ? 'city-rooftop-run' : 'city-market-vault';
  return 'forest-carriage-vault';
};
Travel.preload = function (scene) {
  const run = scene.opts.run || X.Run.load() || X.Run.fresh();
  const id = Travel.select(run, scene.opts.leg || run.travelLeg);
  scene.__travelArtId = id;
  const base = 'assets/expedition/travel/' + id + '/', key = 'travel_' + id;
  if (!scene.cache.json.exists(key)) scene.load.json(key, base + 'scene.json');
  if (!scene.textures.exists(key + '_plate')) scene.load.image(key + '_plate', base + 'plate.webp');
  if (!scene.textures.exists(key + '_actions')) scene.load.multiatlas(key + '_actions', base + 'actions.json', base);
  if (!scene.textures.exists(key + '_loops')) scene.load.spritesheet(key + '_loops', base + 'loops.webp', { frameWidth: 256, frameHeight: 192 });
};
Travel.paint = function (scene) {
  const id = scene.__travelArtId, key = 'travel_' + id, d = scene.cache.json.get(key);
  if (!d || !scene.textures.exists(key + '_actions') || !scene.textures.exists(key + '_plate')) {
    X.Painted.failed(scene, 'Travel artwork could not load.'); return { ready: Promise.resolve(false), setDepth() {} };
  }
  const root = scene.add.container(0, 0).setDepth(-10);
  const plate = scene.add.image(0, 0, key + '_plate').setOrigin(0).setDisplaySize(d.width, 760);
  const hero = scene.add.sprite(0, 0, key + '_actions', d.frames[0].name);
  hero.setOrigin(d.pivot.x / d.canvas.w, d.pivot.y / d.canvas.h).setScale(d.heroScale);
  root.add([plate, hero]);
  // Keep the authored obstacle poses at their original speed. Extend the
  // journey with the approved sixteen-frame run on either side instead.
  const runSheet = X.Painted.sheet(scene, 'hiro'), runClip = runSheet.clips.walk;
  const runner = scene.add.sprite(0, 0, runSheet.key, runClip.frames[0]);
  runner.setOrigin(runSheet.canvas.pivot.x / runSheet.canvas.w, runSheet.canvas.pivot.y / runSheet.canvas.h)
    .setScale(300 / runSheet.standing);
  root.add(runner);
  const loops = (d.loops || []).map(p => {
    const s = scene.add.sprite(p.x, p.y, key + '_loops', p.row * 4).setOrigin(.5, 1).setScale(p.scale || 1).setAlpha(p.alpha == null ? 1 : p.alpha);
    root.add(s); return { s, p };
  });
  let elapsed = 0, active = true;
  const starts = []; let total = 0;
  for (const f of d.frames) { starts.push(total); total += f.ms; }
  const runMs = 3000, actionStart = starts[1], actionEnd = starts[9];
  const actionMs = actionEnd - actionStart, journeyMs = runMs * 2 + actionMs;
  const runTimes = runClip.frameDurationsMs || runClip.frames.map(() => runClip.frameMs || 80);
  const runCycle = runTimes.reduce((sum, ms) => sum + ms, 0);
  const running = (t, a, b) => {
    const u = Math.max(0, Math.min(1, t / runMs));
    let clock = t % runCycle, frame = 0;
    while (frame < runTimes.length - 1 && clock >= runTimes[frame]) clock -= runTimes[frame++];
    runner.setFrame(runClip.frames[frame]).setPosition(a.x + (b.x-a.x)*u, a.y + (b.y-a.y)*u);
    root.x = -(a.cameraX + (b.cameraX-a.cameraX)*u);
    runner.setVisible(true); hero.setVisible(false); root.hero = runner;
  };
  const sample = t => {
    t = Math.max(0, Math.min(t, journeyMs - .001));
    const before = t < runMs, after = t >= runMs + actionMs;
    const journeyTime = t;
    if (before) running(t, d.frames[0], d.frames[1]);
    else if (after) running(t-runMs-actionMs, d.frames[9], d.frames[d.frames.length-1]);
    else { runner.setVisible(false); hero.setVisible(true); root.hero = hero; }
    t = before ? actionStart * t / runMs : after ? actionEnd + (total-actionEnd)*(t-runMs-actionMs)/runMs : actionStart + t-runMs;
    let i = d.frames.length - 1;
    for (let n = 0; n < d.frames.length; n++) if (t < starts[n] + d.frames[n].ms) { i = n; break; }
    const a = d.frames[i], b = d.frames[Math.min(i + 1, d.frames.length - 1)];
    const u = Math.max(0, Math.min(1, (t - starts[i]) / a.ms));
    if (!before && !after) {
      hero.setFrame(a.name).setPosition(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
      root.x = -(a.cameraX + (b.cameraX - a.cameraX) * u);
    }
    for (const l of loops) {
      const since = t - (l.p.startMs || 0);
      l.s.setVisible(since >= 0 && (l.p.continuous || since < (l.p.durationMs || 600)));
      if (since >= 0) l.s.setFrame(l.p.row * 4 + Math.floor(since / (l.p.frameMs || 100)) % 4);
    }
    root.currentFrame = i; root.contact = !before && !after && !!a.contact;
    root.phase = before ? 'run-in' : after ? 'run-out' : 'action';
    root.elapsedMs = journeyTime;
  };
  root.durationMs = journeyMs;
  root.runInMs = root.runOutMs = runMs;
  root.advance = dt => { if (!active) return; elapsed += dt; sample(elapsed); };
  root.ready = Promise.resolve(true); root.background = plate; root.hero = hero; root.artId = id;
  root.seek = ms => { elapsed = Math.max(0, ms); sample(elapsed); };
  sample(0);
  scene.events.once('shutdown', () => { active = false; });
  return root;
};
})();
