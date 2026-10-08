// Edition-owned three-plane battle scenery. Fighting ground never drifts.
(function () {
'use strict';
const A = ADV, X = A.Expedition, Stage = X.BattleStage = {};
const sets = {
  deep_wood: 'forest-carriage-vault', bandit_road: 'forest-carriage-vault',
  mountain: 'forest-carriage-vault', alley: 'city-market-vault', marsh: 'swamp-log-slide'
};
const names = ['far','ground','near'];
Stage.preload = scene => {
  const r = scene.opts?.run || X.Run.load() || X.Run.fresh();
  const q = X.Campaign.quest(r.questId) || X.quests[0];
  const e = X.Campaign.questEncounters(q, r)[r.wave || 0];
  const set = sets[e?.bg];
  if (!set) return;
  for (const layer of names) {
    const key = 'xp_battle_' + set + '_' + layer;
    if (!scene.textures.exists(key)) scene.load.image(key,
      'assets/expedition/travel/' + set + '/atmosphere-' + layer + '.webp');
  }
  if (e.bg === 'mountain' && !scene.textures.exists('xp_battle_mountain_far'))
    scene.load.image('xp_battle_mountain_far','assets/anime/v2/runtime/mountain.webp');
};
Stage.paint = (scene, bg, phase) => {
  const set = sets[bg];
  if (!set) return A.BattleArt.paint(scene,bg,phase);
  const root = scene.add.container(0,0).setDepth(-10);
  const nearRoot = scene.add.container(0,0).setDepth(160);
  const layers = names.map((name,i) => {
    const key = bg === 'mountain' && name === 'far' ? 'xp_battle_mountain_far' : 'xp_battle_'+set+'_'+name;
    const height = name === 'ground' ? 1100 : name === 'near' ? 500 : 760;
    const img = scene.add.image(-500,760-height-(bg === 'alley' && name === 'ground' ? 60 : 0),key).setOrigin(0).setDisplaySize(2280,height);
    if (phase === 'night' && bg !== 'marsh') img.setTint(0x748aba);
    if (phase === 'evening') img.setTint(0xefbb95);
    (i === 2 ? nearRoot : root).add(img);
    return img;
  });
  // Ambient particles inhabit the space behind the fighters; weather remains
  // the scene's independent WeatherFX layer. Do not slide the contact surface.
  const haze = scene.add.graphics();root.addAt(haze,1);
  let elapsed=0;
  const tick=(_t,dt)=>{
    if(scene.paused || scene.time.paused)return;
    elapsed+=dt*scene.time.timeScale;
    const focus=(scene.cameras.main.scrollX||0);
    layers[0].x=-500+focus*.06+Math.sin(elapsed/10000)*6;
    layers[2].x=-500-focus*.025+Math.sin(elapsed/3300)*3;
    haze.clear();
    for(let i=0;i<7;i++){
      haze.fillStyle(bg==='marsh'?0xa6cbd0:0xe3ebef,bg==='marsh'?.065:.04);
      haze.fillEllipse((i*270+elapsed*.014)%1680-180,160+i%3*75,280,24);
    }
  };
  scene.events.on('update',tick);
  const stop=()=>root.destroy(true);
  scene.events.once('shutdown',stop);
  root.once('destroy',()=>{scene.events.off('update',tick);scene.events.off('shutdown',stop);nearRoot.destroy(true);});
  root.layers=layers;root.foreground=nearRoot;root.background=layers[0];root.locationId=bg;
  root.ready=Promise.resolve(true);scene.battleArt=root;return root;
};
})();
