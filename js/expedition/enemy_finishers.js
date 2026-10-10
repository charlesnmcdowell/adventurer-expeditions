// Optional local-edition defeat presentation, after Hiro reaches zero HP.
// Hold the game-over transition until the paired animation completes.
(function () {
'use strict';
const X = ADV.Expedition, F = X.EnemyFinishers = {};
const PREF = 'expeditions.enemyFinishers.v1';
const READY = new Set(['alpha', 'wolf', 'plant', 'serpent', 'beetle', 'moss_giant', 'hag', 'goblin', 'spider', 'orc', 'crab', 'toad', 'vulture', 'hydra', 'elven_wizard', 'elven_ranger', 'dark_swordswoman', 'enchantress']);
const keyFor = actor => 'xp_' + actor + '_fatal';
// Edition-owned campaign intake can register an additional completed actor set.
F.registerActor = actor => {if(!/^[a-z0-9_]+$/.test(actor))throw Error('Invalid finisher actor');READY.add(actor);};
// Website players get the feature without having to discover the pause toggle.
// Preserve an explicit opt-out; portal policy remains independently enforced.
let selected = true;
try { selected = localStorage.getItem(PREF) !== '0'; } catch (_) {}
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
    const url = base + actor + '-fatal.json?v=20261009-polish';
    if (!scene.textures.exists(key)) scene.load.multiatlas(key, url, base);
    // Multiatlas queues an internal JSON under its texture key. A distinct
    // metadata key avoids Phaser deduplicating our clip data on a cold load.
    if (!scene.cache.json.exists(key + '_clips')) scene.load.json(key + '_clips', url);
  }
};
F.canPlay = (scene, killer, target, events) => F.enabled() && !scene.ended &&
  target === scene.hero && (target.alive || target.unit.chp <= 0) && !target._destroyed &&
  target.unit.chp <= 0 &&
  killer?.side === 'b' && killer.alive && !killer._destroyed && READY.has(killer.sheet?.actor) &&
  scene.textures.exists(keyFor(killer.sheet.actor)) && !!scene.cache.json.get(keyFor(killer.sheet.actor) + '_clips');

// A fatal tick may have no living source (poison outlives its caster). Let a
// surviving enemy deliver the ending instead of silently skipping the clip.
F.defeatKiller = (scene, preferred, target, events) => {
  if (target !== scene.hero || target.unit.chp > 0) return null;
  if (F.canPlay(scene, preferred, target, events)) return preferred;
  return [...scene.actors.values()].find(a => F.canPlay(scene, a, target, events)) || null;
};

// Final director safeguard, including a missing down event or already-played
// ordinary down. Never replay a completed execution or execute a living hero.
F.ensureDefeat = async scene => {
  if (scene.__enemyFinishPresented) return true;
  if (!scene.hero || scene.hero.unit.chp > 0 || scene.ended || !F.enabled()) return false;
  const events = scene.enc?.log || [];
  const hit = [...events].reverse().find(e => e.uid === scene.hero.uid && ['damage', 'execute'].includes(e.t));
  const killer = F.defeatKiller(scene, scene.actors.get(hit?.by), scene.hero, events);
  return killer ? F.play(scene, killer, scene.hero) : false;
};

F.tryLowHealth = async (scene, events) => {
  // Compatibility for the director's old hook. Finishers present a defeat;
  // they must not discard the last 30% of a living hero's health.
  return false;
};

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
      hero.unit.chp = 0; hero.unit.downed = true;
      if (scene.enc) { scene.enc.st.over = true; scene.enc.request = null; }
      detach(); hero.alive = false; scene.__enemyFinishPresented = true;
      // Hold the final painted tableau through the normal defeat-card delay.
      settled = true; resolve(true);
    }
  };
  scene.events.on('update', update); scene.events.once('shutdown', shutdown);
});
})();
