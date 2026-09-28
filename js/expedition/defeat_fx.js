(function () {
'use strict';
const X = ADV.Expedition, FX = X.DefeatFX = {};
FX.location = run => run && run.questId === 'marsh' ? 'swamp' : run && run.questId === 'city' ? 'city' : null;
FX.preload = scene => {
  const loc = FX.location(scene.opts.run || X.Run.load());
  if (loc === 'city' && !scene.textures.exists('defeat_' + loc)) scene.load.spritesheet('defeat_' + loc, 'assets/expedition/effects/' + loc + '.webp', { frameWidth: 256, frameHeight: 256 });
};
FX.play = actor => {
  const scene = actor.scene, loc = FX.location(scene.run), key = 'defeat_' + loc;
  if (!loc || actor.side !== 'b' || actor.__defeatEffect || (loc === 'city' && !scene.textures.exists(key))) return;
  actor.__defeatEffect = true;
  if (loc === 'swamp') {
    const g=scene.add.graphics().setDepth(222),width=Math.min(220,Math.max(100,actor.height*.65));
    const x=actor.root.x,y=actor.root.y;let age=0;
    const stop=()=>{scene.events.off('update',tick);scene.events.off('shutdown',stop);g.destroy();};
    const tick=(_t,dt)=>{
      if(scene.paused||scene.time.paused)return;
      age+=dt*scene.time.timeScale;const u=Math.min(1,age/750);g.clear();
      // Low, expanding ochre puffs and tiny earth flecks; no falling sheet or loop.
      for(let i=0;i<11;i++){
        const q=i/10,spread=(q-.5)*width*(.3+u),rise=Math.sin(q*Math.PI)*32*u;
        const radius=(12+(i%3)*5)*(1+u*.7),alpha=Math.sin(Math.PI*u)*.28;
        g.fillStyle(i%2?0x92816a:0x655b4e,alpha);g.fillEllipse(x+spread,y-8-rise,radius*2,radius);
      }
      for(let i=0;i<12;i++){
        const v=(i/11-.5);g.fillStyle(0xb4a074,(1-u)*.65);
        g.fillCircle(x+v*width*u,y-8-75*Math.sin(Math.PI*u)*(1-Math.abs(v)),2*(1-u)+.5);
      }
      if(age>=750)stop();
    };
    scene.events.on('update',tick);scene.events.once('shutdown',stop);return;
  }
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
