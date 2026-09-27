// Runtime intake boundary. Masters and review galleries never enter the upload.
(function () {
'use strict';
const A = ADV, X = A.Expedition, UI = X.UI;
const P = X.Painted = {};
P.actors = ['hiro', 'bram', 'wolf', 'plant', 'alpha', ...(X.monsterActors || [])];

// What a scene actually needs before it can run. Bram is ~2 MB and cannot be in
// the party while recruiting is locked (X.slice.firstLevelOnly), so loading him
// on the tutorial road costs every player two megabytes for a companion they
// will never see: measured, that is a fifth of everything downloaded before the
// first fight. He loads once he can be hired, or once he is already in the run.
P.needed = function (scene) {
  // preload() runs before create(), and on a scene restart `scene.run` is still
  // the *previous* visit's run — so the run being started (scene.opts.run) wins.
  let run = scene && scene.opts && scene.opts.run;
  if (!run) run = scene && scene.run;
  if (!run) { try { run = X.Run.load(); } catch (e) { run = null; } }
  const owned = run && run.roster ? run.roster.slice() : [];
  const hireable = !(X.Campaign && X.Campaign.recruitingLocked && X.Campaign.recruitingLocked());
  const sceneKey = scene && scene.sys && scene.sys.settings && scene.sys.settings.key;
  const shipped = (X.shipped && X.shipped.actors) || null;
  const quest = X.Campaign && X.Campaign.quest((run && run.questId) || X.Campaign.startQuestId());
  const neededFoes = new Set(quest ? X.Campaign.questEncounters(quest, run).flatMap(e => e.enemies || []).map(k => X.paintedActorOfKey(k)) : ['wolf', 'plant', 'alpha']);
  return P.actors.filter(id => {
    // Never queue art the package does not carry, whatever the run says: a
    // missing atlas hangs the scene in preload (Hiro, 2026-09-21).
    if (shipped && !shipped.includes(id)) return false;
    if (id === 'bram') return hireable || owned.includes('bram');
    if (id === 'hiro') return true;
    return (sceneKey === 'Expedition' || (scene && scene.__needsAlpha)) && neededFoes.has(id);
  });
};
P.preload = function (scene, ids) {
  if (X.Hud && X.Hud.preloadArt) X.Hud.preloadArt(scene);
  for (const id of (ids || P.needed(scene))) {
    const key = 'xp_' + id + '_sheet', base = 'assets/expedition/' + id + '/';
    if (!scene.textures.exists(key)) scene.load.multiatlas(key, base + id + '.json', base);
    if (!scene.cache.json.exists('xp_' + id + '_clips')) scene.load.json('xp_' + id + '_clips', base + id + '.json');
  }
};
P.sheet = function (scene, id) {
  const key = 'xp_' + id + '_sheet', j = scene.cache.json.get('xp_' + id + '_clips');
  if (!j || !scene.textures.exists(key)) return null;
  // Release polish: hold anticipation, contact and recovery without slowing
  // the rest of combat. Original frames/markers and source art stay intact.
  let clips = j.clips;
  if (id === 'alpha' || (X.monsterActors || []).includes(id)) {
    clips = Object.fromEntries(Object.entries(j.clips).map(([name, c]) => {
      if (!c.paired || !name.startsWith('hiro-')) return [name, c];
      const times = c.frames.length === 8 ? [240,130,150,210,160,190,210,330]
        : id === 'alpha' ? [260,180,140,220,240,360] : [260,140,220,210,250,340];
      if (times.length !== c.frames.length) return [name, c];
      return [name, Object.assign({}, c, { frameDurationsMs: times, durationMs: times.reduce((a,b) => a+b,0) })];
    }));
  }
  return { key, clips, canvas: j.canvas, standing: j.standing, actor: id, id, authoredFacing: j.authoredFacing || 1 };
};
P.install = function (scene) {
  const j = scene.cache.json.get('xp_bram_clips');   // absent while Bram is not loaded: no recruit art registered, which is correct
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
