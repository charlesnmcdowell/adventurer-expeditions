// Runtime intake boundary. Masters and review galleries never enter the upload.
(function () {
'use strict';
const A = ADV, X = A.Expedition, UI = X.UI;
const P = X.Painted = {};
P.actors = ['hiro', 'bram', 'wolf', 'plant'];
P.preload = function (scene) {
  if (X.Hud && X.Hud.preloadArt) X.Hud.preloadArt(scene);
  for (const id of P.actors) {
    const key = 'xp_' + id + '_sheet', base = 'assets/expedition/' + id + '/';
    if (!scene.textures.exists(key)) scene.load.multiatlas(key, base + id + '.json', base);
    if (!scene.cache.json.exists('xp_' + id + '_clips')) scene.load.json('xp_' + id + '_clips', base + id + '.json');
  }
};
P.sheet = function (scene, id) {
  const key = 'xp_' + id + '_sheet', j = scene.cache.json.get('xp_' + id + '_clips');
  if (!j || !scene.textures.exists(key)) return null;
  return { key, clips: j.clips, canvas: j.canvas, standing: j.standing, actor: id, id };
};
P.install = function (scene) {
  const j = scene.cache.json.get('xp_bram_clips');
  if (j && X.Campaign.registerRecruitArt) X.Campaign.registerRecruitArt('bram', j, f => scene.textures.exists('xp_bram_sheet') && scene.textures.get('xp_bram_sheet').has(f));
};
P.failed = function (scene, message) {
  scene.__presentationReady = false;
  scene.input.enabled = false;
  if (scene.__artFailure) return;
  const box = document.createElement('aside'); box.className = 'art-warning'; box.setAttribute('role', 'alert');
  box.append(document.createTextNode(message + ' '));
  const retry = document.createElement('button'); retry.textContent = 'Retry artwork';
  retry.onclick = () => { box.remove(); scene.__artFailure = null; scene.scene.restart(scene.opts || {}); };
  box.append(retry); document.body.append(box); scene.__artFailure = box;
  scene.events.once('shutdown', () => { box.remove(); scene.__artFailure = null; });
};
P.require = function (scene, ids) {
  for (const id of ids) {
    const s = P.sheet(scene, id);
    if (!s || !s.clips.idle || !s.clips.idle.frames.every(f => scene.textures.get(s.key).has(f))) {
      P.failed(scene, 'Character artwork could not load.'); return false;
    }
  }
  return true;
};
P.present = function (scene, environment, onReady) {
  const token = {}; scene.__presentationToken = token; scene.__presentationReady = false; scene.input.enabled = false;
  let active = true, afterRender;
  scene.events.once('shutdown', () => { active = false; if (afterRender) scene.game.events.off('postrender', afterRender); });
  Promise.resolve(environment && environment.ready).then(ok => {
    if (!active || scene.__presentationToken !== token) return;
    if (ok === false) { P.failed(scene, 'Scenery could not load.'); return; }
    afterRender = () => {
      if (!active || scene.__presentationToken !== token || scene.__artFailure) return;
      scene.__presentationReady = true; scene.input.enabled = true;
      if (onReady) onReady();
      if (A.Portal && A.Portal.active) A.Portal.sync([scene]);
    };
    scene.game.events.once('postrender', afterRender);
  }).catch(() => { if (active) P.failed(scene, 'Scenery could not load.'); });
};
UI.preloadHiroSheet = P.preload;
UI.paintedFigure = function (scene, id, x, bottom, height, depth, requested) {
  const s = P.sheet(scene, id); if (!s) return null;
  const name = s.clips[requested] ? requested : 'idle', c = s.clips[name]; if (!c) return null;
  const key = s.key + ':figure:' + name;
  if (!scene.anims.exists(key)) {
    const times = c.durationsMs || c.frameDurationsMs || Array(c.frames.length).fill(c.frameMs || (c.durationMs || 100 * c.frames.length) / c.frames.length);
    // Match Actor.animKey: Phaser's explicit frame duration is the full hold.
    scene.anims.create({ key, duration: times.reduce((sum, n) => sum + n, 0),
      frames: c.frames.map((frame, i) => ({ key: s.key, frame, duration: times[i] })), repeat: -1 });
  }
  const sp = scene.add.sprite(x, bottom, s.key, c.frames[0]).setDepth(depth);
  const canvas = s.canvas || {}, pivot = canvas.pivot || { x: (canvas.w || sp.width) / 2, y: canvas.h || sp.height };
  sp.setOrigin(pivot.x / (canvas.w || sp.width), pivot.y / (canvas.h || sp.height));
  sp.setScale(height / (s.standing || sp.height)); sp.play(key);
  const pause = () => { if (sp.anims) sp.anims.timeScale = scene.paused ? 0 : 1; };
  scene.events.on('update', pause); sp.once('destroy', () => scene.events.off('update', pause));
  return sp;
};
UI.hiroFigure = (scene, x, bottom, height, depth, clip) => UI.paintedFigure(scene, 'hiro', x, bottom, height, depth, clip || 'idle');
UI.ensureHiroTextures = function (scene) {
  if (scene.textures.exists('xp_hiro_face')) return;
  const s = P.sheet(scene, 'hiro'); if (!s) return;
  const f = scene.textures.getFrame(s.key, s.clips.idle.frames[0]);
  const image = document.createElement('canvas'); image.width = 256; image.height = 256;
  // The idle's upper central silhouette includes his purple locs, face and collar.
  const w = f.cutWidth, h = f.cutHeight;
  image.getContext('2d').drawImage(f.source.image, f.cutX + w * .26, f.cutY, w * .49, h * .36, 0, 0, 256, 256);
  scene.textures.addCanvas('xp_hiro_face', image);
};
})();
