// Authored inn vignette: seated characters are part of the painting. Only the
// supplied candle, stew and hearth frames animate; no duplicate standing actors.
(function () {
'use strict';
const X = ADV.Expedition, Art = X.InnArt = {};
const BASE = 'assets/expedition/inn/', MANIFEST = 'xp_inn_manifest';
const key = id => 'xp_' + id;

Art.preload = function (scene) {
  const queue = () => {
    const data = scene.cache.json.get(MANIFEST);
    if (!data) return;
    for (const [id, entry] of Object.entries(data.backgrounds || {})) {
      if (!scene.textures.exists(key(id))) scene.load.image(key(id), BASE + entry.file);
    }
    for (const [id, entry] of Object.entries(data.effects || {})) {
      if (!scene.textures.exists(key(id))) scene.load.spritesheet(key(id), BASE + entry.file,
        { frameWidth: entry.frameWidth, frameHeight: entry.frameHeight });
    }
  };
  if (scene.cache.json.exists(MANIFEST)) { queue(); return; }
  // Phaser accepts files queued from filecomplete while the loader is running.
  const event = 'filecomplete-json-' + MANIFEST;
  scene.load.once(event, queue);
  scene.events.once('shutdown', () => scene.load.off(event, queue));
  scene.load.json(MANIFEST, BASE + 'inn.json?v=20260928-wardrobe2');
};

Art.variant = run => {
  // Bram is also an occasional seated guest, not a newly recruited combatant.
  // Derive it from completed quests: reloads keep the same painting and no
  // extra persistent counter can accidentally change the party or save format.
  const clears = Object.values(run.cycles || {}).reduce((n, v) => n + (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0), 0);
  const variant = ['inn-hiro-solo','inn-hiro-bram','inn-hiro-mage','inn-hiro-warrior','inn-hiro-ranger'][clears % 5];
  const companion = X.Campaign.owns(run, 'bram') && X.Campaign.fielded(run, 'bram') && X.Campaign.recruitReady('bram');
  return companion ? 'inn-hiro-bram' : variant;
};

Art.paint = function (scene, run) {
  const data = scene.cache.json.get(MANIFEST);
  const root = scene.add.container(0, 0).setDepth(-100);
  const view = { root, background: null, variant: null, effects: [], destroyed: false };
  const clearEffects = () => {
    for (const fx of view.effects) {
      fx.image.clearMask(false); fx.image.destroy();
      if (fx.mask) fx.mask.destroy();
      if (fx.maskShape) fx.maskShape.destroy();
    }
    view.effects.length = 0;
  };
  view.setParty = nextRun => {
    if (view.destroyed || !data) return false;
    const id = Art.variant(nextRun), entry = data.backgrounds[id];
    if (!entry || !scene.textures.exists(key(id)) || entry.placements.some(p => !data.effects[p.effect] || !scene.textures.exists(key(p.effect)))) return false;
    if (view.variant === id) return true;
    clearEffects();
    if (view.background) view.background.setTexture(key(id));
    else { view.background = scene.add.image(0, 0, key(id)).setOrigin(0); root.add(view.background); }
    view.background.setDisplaySize(data.canvas.width, data.canvas.height);
    for (const placement of entry.placements) {
      const def = data.effects[placement.effect];
      const image = scene.add.image(placement.x, placement.y, key(placement.effect), def.order[0])
        .setOrigin(def.originX, def.originY).setDisplaySize(def.displayWidth, def.displayHeight).setAlpha(def.opacity);
      root.add(image);
      const fx = { image, definition: def, elapsed: placement.phaseOffsetMs || 0, frame: -1 };
      if (placement.clipRect) {
        const r = placement.clipRect;
        fx.maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
        fx.maskShape.fillStyle(0xffffff).fillRect(r.x, r.y, r.w, r.h);
        fx.mask = fx.maskShape.createGeometryMask(); image.setMask(fx.mask);
      }
      view.effects.push(fx);
    }
    view.variant = id;
    advance(0, 0);
    return true;
  };
  function advance(_time, dt) {
    if (view.destroyed || scene.paused || scene.time.paused) return;
    for (const fx of view.effects) {
      const d = fx.definition, order = d.order, times = order.map(i => d.durationsMs[i]);
      const total = times.reduce((sum, n) => sum + n, 0);
      fx.elapsed = (fx.elapsed + dt * scene.time.timeScale) % total;
      let remain = fx.elapsed, index = 0;
      while (index < times.length - 1 && remain >= times[index]) remain -= times[index++];
      const frame = order[index];
      if (frame !== fx.frame) { fx.image.setFrame(frame); fx.frame = frame; }
    }
  }
  function cleanup() {
    if (view.destroyed) return;
    view.destroyed = true;
    scene.events.off('update', advance); scene.events.off('shutdown', view.destroy);
    clearEffects();
  }
  view.destroy = () => { if (view.destroyed) return; cleanup(); root.destroy(); };
  root.once('destroy', cleanup);
  scene.events.on('update', advance); scene.events.once('shutdown', view.destroy);
  // Scenery that has not arrived yet is not scenery that failed. On a slow
  // connection the painting can still be in flight when the scene paints, so
  // wait for the loader to finish and try once more; only then is it a failure.
  // (Found in round 3 by throttling the network — the inn used to hard-fail.)
  const valid = view.setParty(run);
  view.readyPromise = view.ready = valid ? Promise.resolve(true) : new Promise(resolve => {
    if (!scene.load || !scene.load.isLoading || !scene.load.isLoading()) { resolve(view.setParty(run)); return; }
    const done = () => { if (view.destroyed) { resolve(false); return; } resolve(view.setParty(run)); };
    scene.load.once('complete', done);
    scene.events.once('shutdown', () => { scene.load.off('complete', done); resolve(false); });
  });
  return view;
};
})();
