(function () {
'use strict';
const X = ADV.Expedition, FX = X.DefeatFX = {};
FX.location = run => run && run.questId === 'marsh' ? 'swamp' : run && run.questId === 'city' ? 'city' : null;
FX.preload = scene => {
  const loc = FX.location(scene.opts.run || X.Run.load());
  if (loc && !scene.textures.exists('defeat_' + loc)) scene.load.spritesheet('defeat_' + loc, 'assets/expedition/effects/' + loc + '.webp', { frameWidth: 256, frameHeight: 256 });
};
FX.play = actor => {
  const scene = actor.scene, loc = FX.location(scene.run), key = 'defeat_' + loc;
  if (!loc || actor.side !== 'b' || actor.__defeatEffect || !scene.textures.exists(key)) return;
  actor.__defeatEffect = true;
  const effects = [0, 1, 2].map(row => {
    const s = scene.add.sprite(actor.x, actor.y - (row === 2 ? actor.height * .25 : 0), key, row * 4).setOrigin(.5, 1).setDepth(220 + row);
    s.setDisplaySize(Math.max(180, actor.height), row === 1 && loc === 'swamp' ? 100 : actor.height);
    return s;
  });
  let elapsed = 0;
  const update = (t, dt) => {
    if (scene.paused) return;
    elapsed += dt;
    effects.forEach((s, row) => { s.setFrame(row * 4 + Math.min(3, Math.floor(elapsed / 120) % 4)); s.setAlpha(Math.max(0, 1 - Math.max(0, elapsed - 500) / 350)); });
    if (elapsed >= 850) dispose();
  };
  const dispose = () => { scene.events.off('update', update); effects.forEach(s => s.destroy()); };
  scene.events.on('update', update); scene.events.once('shutdown', dispose);
};
})();
