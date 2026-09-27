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
  for (const layer of ['far','ground','near']) if (!scene.textures.exists(key + '_' + layer)) scene.load.image(key + '_' + layer, base + 'atmosphere-' + layer + '.webp');
  if (!scene.textures.exists(key + '_loops')) scene.load.spritesheet(key + '_loops', base + 'loops.webp', { frameWidth: 256, frameHeight: 192 });
};
Travel.paint = function (scene) {
  const id = scene.__travelArtId, key = 'travel_' + id, d = scene.cache.json.get(key);
  if (!d || ['actions','plate','far','ground','near'].some(layer => !scene.textures.exists(key + '_' + layer))) {
    X.Painted.failed(scene, 'Travel artwork could not load.'); return { ready: Promise.resolve(false), setDepth() {} };
  }
  const root = scene.add.container(0, 0).setDepth(-10);
  const atmosphere = scene.add.container(0,0), actionWorld = scene.add.container(0,0);
  root.add([atmosphere,actionWorld]);
  const layerWidth = 2280, runSpeed = 420;
  const layers = ['far','ground','near'].map((name,index) => {
    const container = scene.add.container(0,0), factor = [0.07,1,1.5][index];
    atmosphere.add(container);
    const height=name==='ground'?1100:name==='near'?500:760;
    for(let i=-1;i<=2;i++) container.add(scene.add.image(i*layerWidth,760-height,key+'_'+name).setOrigin(0).setDisplaySize(layerWidth,height));
    return {container,factor,name};
  });
  const runSheet = X.Painted.sheet(scene,'hiro'), runClip = runSheet.clips.walk;
  const runner = scene.add.sprite(650,612,runSheet.key,runClip.frames[0]);
  runner.setOrigin(runSheet.canvas.pivot.x/runSheet.canvas.w,runSheet.canvas.pivot.y/runSheet.canvas.h).setScale(300/runSheet.standing);
  const shadow = scene.add.ellipse(650,617,92,15,0x070c12,.25);
  // Ground behind Hiro, close vegetation in front, all at separate scroll rates.
  atmosphere.addAt(shadow,2);atmosphere.addAt(runner,3);
  const glints=scene.add.graphics();atmosphere.add(glints);
  const plate=scene.add.image(0,0,key+'_plate').setOrigin(0).setDisplaySize(d.width,760);
  const hero=scene.add.sprite(0,0,key+'_actions',d.frames[0].name);
  hero.setOrigin(d.pivot.x/d.canvas.w,d.pivot.y/d.canvas.h).setScale(d.heroScale);
  actionWorld.add([plate,hero]);
  const loops=(d.loops||[]).map(p=>{
    const s=scene.add.sprite(p.x,p.y,key+'_loops',p.row*4).setOrigin(.5,1).setScale(p.scale||1).setAlpha(p.alpha==null?1:p.alpha);
    actionWorld.add(s);return {s,p};
  });
  let elapsed=0,active=true,total=0;const starts=[];
  for(const f of d.frames){starts.push(total);total+=f.ms;}
  const runMs=id==='swamp-log-slide'?5000:id==='city-rooftop-run'?4500:4000;
  const actionStart=starts[1],actionEnd=starts[9],actionMs=actionEnd-actionStart;
  const journeyMs=runMs*2+actionMs;
  const runTimes=runClip.frameDurationsMs||runClip.frames.map(()=>runClip.frameMs||80);
  const runCycle=runTimes.reduce((sum,ms)=>sum+ms,0);
  const sample=t=>{
    t=Math.max(0,Math.min(t,journeyMs-.001));
    const before=t<runMs,after=t>=runMs+actionMs,inAction=!before&&!after;
    const runningTime=before?t:runMs+Math.max(0,t-runMs-actionMs);
    // Distance is speed * time, never a tiny fixed distance stretched in time.
    const distance=t*runSpeed/1000;
    for(const l of layers) l.container.x=-((distance*l.factor+(l.name==='far'?650:0))%layerWidth);
    let clock=runningTime%runCycle,frame=0;
    while(frame<runTimes.length-1&&clock>=runTimes[frame])clock-=runTimes[frame++];
    runner.setFrame(runClip.frames[frame]);
    const local=before?actionStart:after?actionEnd:actionStart+t-runMs;
    let i=d.frames.length-1;
    for(let n=0;n<d.frames.length;n++)if(local<starts[n]+d.frames[n].ms){i=n;break;}
    const a=d.frames[i],b=d.frames[Math.min(i+1,d.frames.length-1)];
    const u=Math.max(0,Math.min(1,(local-starts[i])/a.ms));
    const hx=a.x+(b.x-a.x)*u,hy=a.y+(b.y-a.y)*u;
    hero.setFrame(a.name).setPosition(hx,hy);
    actionWorld.x=-(a.cameraX+(b.cameraX-a.cameraX)*u);
    // The obstacle remains its authored full-frame camera shot. Translating
    // the whole rooftop painting exposes an unpainted strip above its edge.
    actionWorld.y=0;
    // Brief scenery dissolve, not slow travel. One Hiro stays visible throughout.
    const blend=before?Math.max(0,1-(runMs-t)/180):after?Math.max(0,1-(t-runMs-actionMs)/180):1;
    plate.setAlpha(blend);atmosphere.setAlpha(1);
    runner.setVisible(!inAction);shadow.setVisible(!inAction);hero.setVisible(inAction);
    runner.setPosition(inAction?650:before?650:d.frames[9].x-d.frames[9].cameraX,612);
    if(!inAction&&id!=='city-rooftop-run')runner.y=before?d.frames[1].y:d.frames[9].y;
    shadow.setPosition(runner.x,runner.y+5);
    for(const l of loops){const since=local-(l.p.startMs||0);l.s.setVisible(inAction&&since>=0&&(l.p.continuous||since<(l.p.durationMs||600)));if(since>=0)l.s.setFrame(l.p.row*4+Math.floor(since/(l.p.frameMs||100))%4);}
    glints.clear();
    if(id==='swamp-log-slide')for(let n=0;n<16;n++){
      const x=((n*173-distance*.28)%1340+1340)%1340-30,y=420+Math.sin(t/800+n)*30+(n%4)*36;
      glints.fillStyle(0xcbdc6b,.18+.14*Math.sin(t/500+n));glints.fillCircle(x,y,2);
    }
    root.currentFrame=i;root.contact=inAction&&!!a.contact;
    root.phase=before?'run-in':after?'run-out':'action';root.elapsedMs=t;
    root.hero=inAction?hero:runner;root.distance=distance;
    root.layerOffsets=layers.map(l=>({name:l.name,x:l.container.x,factor:l.factor}));
  };
  root.durationMs=journeyMs;root.runInMs=root.runOutMs=runMs;root.runSpeed=runSpeed;
  root.advance=dt=>{if(!active)return;elapsed+=dt;sample(elapsed);};
  root.ready=Promise.resolve(true);root.background=plate;root.artId=id;
  root.seek=ms=>{elapsed=Math.max(0,ms);sample(elapsed);};
  sample(0);scene.events.once('shutdown',()=>{active=false;});
  return root;
};
})();
