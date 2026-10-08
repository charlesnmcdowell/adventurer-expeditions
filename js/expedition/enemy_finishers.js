// Local-edition paired defeats. Combat already decided the death; this module
// never applies damage, executes a living hero, or changes the score.
(function () {
'use strict';
const X = ADV.Expedition, F = X.EnemyFinishers = {};
const PREF = 'expeditions.enemyFinishers.v1';
const READY = new Set(['alpha', 'wolf', 'plant', 'serpent', 'beetle', 'moss_giant', 'hag', 'goblin', 'spider', 'orc']);
const keyFor = actor => 'xp_' + actor + '_fatal';
let selected = false;
try { selected = localStorage.getItem(PREF) === '1'; } catch (_) {}
F.allowed = () => ADV.Release?.target === 'website';
F.enabled = () => F.allowed() && selected;
F.setEnabled = value => {
  selected = F.allowed() && !!value;
  try { localStorage.setItem(PREF, selected ? '1' : '0'); } catch (_) {}
  return F.enabled();
};
F.preload = (scene, ids) => {
  // Local-only preload permits switching the setting during this fight. Portal
  // targets never request these files, even with a local preference carried in.
  if (!F.allowed()) return;
  for (const actor of new Set(ids)) {
    if (!READY.has(actor)) continue;
    const key = keyFor(actor), base = 'assets/expedition/adult/' + actor + '-fatal/';
    if (!scene.textures.exists(key)) scene.load.multiatlas(key, base + actor + '-fatal.json', base);
    // Multiatlas queues an internal JSON under its texture key. A distinct
    // metadata key avoids Phaser deduplicating our clip data on a cold load.
    if (!scene.cache.json.exists(key + '_clips')) scene.load.json(key + '_clips', base + actor + '-fatal.json');
  }
};
F.canPlay = (scene, killer, target, events) => F.enabled() && !scene.ended &&
  target === scene.hero && target.alive && !target._destroyed && target.unit.chp <= 0 &&
  killer?.side === 'b' && killer.alive && !killer._destroyed && READY.has(killer.sheet?.actor) &&
  [...(events || [])].reverse().find(e => e.t === 'damage' && e.uid === target.uid)?.by === killer.uid &&
  [...(events || [])].reverse().find(e => e.t === 'damage' && e.uid === target.uid)?.tag !== 'dot' &&
  scene.textures.exists(keyFor(killer.sheet.actor)) && !!scene.cache.json.get(keyFor(killer.sheet.actor) + '_clips');

F.play = (scene, killer, hero) => new Promise(resolve => {
  const actor = killer.sheet?.actor, KEY = keyFor(actor);
  const data = scene.cache.json.get(KEY + '_clips'), clip = data?.clips[actor + '-fatal'];
  if (!F.enabled() || !clip || scene.ended) { resolve(false); return; }
  const old = { hero: hero.root.visible, killer: killer.root.visible, x: killer.root.x };
  const origin = data.canvas.pivot, scale = hero.height / data.standing;
  let elapsed = 0, frame = 0, pair = null, done = false, settled = false;
  const approachMs = 180, endX = hero.x + hero.height * (clip.pairTargetDistanceRatio || 0.73);
  hero.cancelPlayback(); killer.cancelPlayback();
  const startX = killer.x;
  const approach = ['approach-leap', 'approach', 'run'].find(id => killer.sheet.clips[id]);
  if (approach) killer.img.play(killer.animKey(approach));
  const detach = () => scene.events.off('update', update);
  const cancel = () => {
    detach(); scene.events.off('shutdown', shutdown);
    if (pair) pair.destroy();
    scene.__enemyFinishSprite = null;
    if (!hero._destroyed) { hero.root.setVisible(old.hero); }
    if (!killer._destroyed) { killer.root.setVisible(old.killer); killer.root.x = old.x; killer.idle(); }
    if (!settled) { settled = true; resolve(false); }
  };
  const shutdown = () => { detach(); if (pair) pair.destroy(); scene.__enemyFinishSprite = null; if (!settled) { settled = true; resolve(false); } };
  const update = (_time, delta) => {
    if (scene.ended || hero._destroyed || killer._destroyed) { shutdown(); return; }
    if (!F.enabled()) { cancel(); return; }
    if (scene.paused || scene.time.paused || scene.__paintedHitStopCount > 0) return;
    elapsed += delta * scene.time.timeScale;
    if (!pair) {
      killer.root.x = startX + (endX - startX) * Math.min(1, elapsed / approachMs);
      if (elapsed < approachMs) return;
      elapsed -= approachMs;
      killer.img.anims.stop(); hero.img.anims.stop();
      hero.root.setVisible(false); killer.root.setVisible(false);
      pair = scene.add.image(hero.x, hero.y, KEY, clip.frames[0])
        .setOrigin(origin.x / data.canvas.w, origin.y / data.canvas.h)
        .setScale(scale).setDepth(Math.max(hero.root.depth, killer.root.depth) + 1);
      // HUD camera ignores newly created world art too.
      if (scene.hudCam) scene.hudCam.ignore(pair);
      scene.__enemyFinishSprite = pair;
    }
    while (!done && elapsed >= clip.frameDurationsMs[frame]) {
      elapsed -= clip.frameDurationsMs[frame];
      if (frame + 1 < clip.frames.length) { frame++; pair.setFrame(clip.frames[frame]); }
      else done = true;
    }
    if (done) {
      detach(); hero.alive = false; scene.__enemyFinishPresented = true;
      // Hold the final painted tableau through the normal defeat-card delay.
      settled = true; resolve(true);
    }
  };
  scene.events.on('update', update); scene.events.once('shutdown', shutdown);
});
})();
