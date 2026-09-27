// Edition-owned level combat floors. Shared website paintings stay unchanged.
(function () {
'use strict';
const A = ADV, X = A.Expedition, Stage = X.BattleStage = {};
const plates = { mountain: 'mountain', alley: 'city' };
Stage.preload = scene => {
  const r = scene.opts?.run || X.Run.load() || X.Run.fresh();
  const q = X.Campaign.quest(r.questId) || X.quests[0];
  const e = X.Campaign.questEncounters(q, r)[r.wave || 0];
  const id = plates[e?.bg];
  if (id && !scene.textures.exists('xp_stage_' + id))
    scene.load.image('xp_stage_' + id, 'assets/expedition/stages/' + id + '.webp');
};
Stage.paint = (scene, bg, phase) => {
  const id = plates[bg];
  if (!id) return A.BattleArt.paint(scene, bg, phase);
  const root = scene.add.container(0,0).setDepth(-10);
  const key = 'xp_stage_' + id;
  if (!scene.textures.exists(key)) { root.ready = Promise.resolve(false); return root; }
  const image = scene.add.image(0,0,key).setOrigin(0).setDisplaySize(1280,760);
  root.add(image);root.background=image;root.locationId=bg;
  if (phase === 'night') image.setTint(0x748aba);
  const fx = scene.add.graphics();root.add(fx);
  let elapsed = 0;
  const tick = (_t,dt) => {
    if (scene.paused || scene.time.paused) return;
    elapsed += dt * scene.time.timeScale;fx.clear();
    // A thin distant haze leaves the solid fighting surface unobscured.
    if (id === 'mountain') for(let i=0;i<5;i++) {
      fx.fillStyle(0xd8e2ee,.025);
      fx.fillEllipse((i*310+elapsed*.008) % 1580-150,425+Math.sin(elapsed/2400+i)*8,360,22);
    }
  };
  const stop = () => root.destroy(true);
  scene.events.on('update',tick);scene.events.once('shutdown',stop);
  root.once('destroy',()=>{scene.events.off('update',tick);scene.events.off('shutdown',stop);});
  root.ready=Promise.resolve(true);scene.battleArt=root;return root;
};
})();
