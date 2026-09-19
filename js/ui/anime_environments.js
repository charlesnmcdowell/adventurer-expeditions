// Illustrated locations shared by housing, travel, combat and story staging.
(function(){
'use strict';
const A=ADV,M=A.AnimeManifest,W=1280,H=760,ROOT=A.AnimeWorld.ROOT;
const ALIASES={bandit_road:'road',deep_wood:'forest',shallows:'coast'};
const INDOOR=new Set(['crypt','prison','tavern','maw','ossuary','birthing_house','maw_boss','inn']);
// Normalized authored locations of water, lamps, smoke, foliage and cloth details.
const DETAILS={
 port:{water:[.55,.57,.43,.21],leaves:false},forest:{leaves:true,mist:.58},
 road:{leaves:true,water:[.7,.53,.2,.12]},marsh:{water:[.03,.58,.94,.3],mist:.58},
 ruins:{leaves:true},crypt:{lights:[[.77,.25],[.29,.66]],mist:.79},
 city:{water:[.5,.57,.07,.04],cloth:[.1,.26,.13,.12]},alley:{lights:[[.37,.49]],mist:.85},
 prison:{lights:[[.45,.24],[.92,.56]]},tavern:{lights:[[.86,.58],[.04,.91]],smoke:[.87,.59]},
 coast:{water:[.55,.46,.43,.28]},mountain:{mist:.62},maw:{water:[.02,.59,.28,.27],lights:[[.15,.2],[.77,.42]]},
 antler:{cloth:[.6,.3,.08,.26],lights:[[.55,.51]]},academy:{lights:[[.17,.31]],mist:.65},
 bell:{leaves:true,mist:.52},green:{leaves:true,cloth:[.9,.13,.07,.25]},tally:{water:[.34,.66,.27,.18],cloth:[.03,.03,.2,.27]},
 navy:{cloth:[.27,.12,.04,.24]},ossuary:{lights:[[.27,.51],[.77,.52],[.45,.42]]},
 salt_court:{water:[.73,.38,.25,.17]},green_altar:{leaves:true,mist:.65,lights:[[.29,.23],[.48,.43]]},
 birthing_house:{lights:[[.17,.3],[.34,.38]],mist:.7},low_tide:{water:[.01,.66,.58,.2]},
 pyre:{lights:[[.81,.2],[.11,.61]],smoke:[.8,.24]},maw_boss:{lights:[[.42,.54],[.71,.6]],mist:.84},
 green_boss:{leaves:true,mist:.63},cemetery:{leaves:true,mist:.63},
 camp:{lights:[[.6,.73]],smoke:[.6,.7],leaves:true},inn:{lights:[[.86,.61],[.05,.45]]},
 cottage:{lights:[[.62,.35]],leaves:true,smoke:[.51,.03]},brick:{lights:[[.57,.48],[.73,.43]],leaves:true,smoke:[.64,.05]},
 mansion:{water:[.7,.54,.12,.08],lights:[[.5,.48]],leaves:true},castle:{water:[.02,.84,.36,.12],lights:[[.6,.47]]},
};
const pool=new Map();
function resolve(id){const result=ALIASES[id]||id;if(!M.environments[result])throw Error('Unmapped anime location: '+id);return result;}
function purge(textures){
 const free=[...pool.values()].filter(e=>e.refs===0&&e.loaded).sort((a,b)=>a.used-b.used);
 while(free.length>3){const e=free.shift();if(textures.exists(e.key))textures.remove(e.key);pool.delete(e.id);e.image=null;}
}
function acquire(scene,raw){
 const id=resolve(raw);let e=pool.get(id);
 if(e?.failed){pool.delete(id);e=null;}
 if(!e){
  e={id,key:'aw2_env_'+id,refs:0,used:performance.now(),loaded:false,image:null};pool.set(id,e);
  e.ready=new Promise(resolveReady=>{
   const img=new Image();e.image=img;img.decoding='async';
   img.onload=()=>{if(!scene.textures.exists(e.key))scene.textures.addImage(e.key,img);e.loaded=true;resolveReady(true);purge(scene.textures);};
   img.onerror=()=>{e.failed=true;resolveReady(false);};img.src=ROOT+M.environments[id].file;
  });
 }
 e.refs++;e.used=performance.now();let released=false;
 return{entry:e,ready:e.ready,release(){if(released)return;released=true;e.refs--;e.used=performance.now();purge(scene.textures);}};
}
function view(scene,raw,phase,opts){
 opts=opts||{};const id=resolve(raw),lease=acquire(scene,id),detail=DETAILS[id]||{};
 if(INDOOR.has(id))phase='day';
 const root=scene.add.container(0,0).setDepth(opts.depth??-10),art=scene.add.container(0,0);root.add(art);
 const shade=scene.add.rectangle(W/2,H/2,W,H,0x080c12);art.add(shade);
 const status=A.T.text(scene,W/2,H/2,'Preparing the scenery…',{size:16,ox:.5,color:'#e9dbc0'});root.add(status);
 const effects=scene.add.graphics();root.add(effects);let bg=null,water=[],cloth=[],alive=true;
 function fitImage(img){const sw=img.frame.realWidth,sh=img.frame.realHeight,s=Math.max((W+24)/sw,(H+18)/sh);img.setScale(s).setPosition(W/2,H/2);}
 lease.ready.then(ok=>{
  if(!alive)return;
  if(!ok){status.setText('Scenery unavailable');return;}
  status.destroy();bg=scene.add.image(W/2,H/2,lease.entry.key);fitImage(bg);art.addAt(bg,0);shade.setVisible(false);root.background=bg;
  // Independent cropped strips use the exact source composition and a screen-space mask.
  if(detail.water){
   const [nx,ny,nw,nh]=detail.water,box=[nx*W,ny*H,nw*W,nh*H],maskShape=scene.make.graphics({add:false});maskShape.fillStyle(0xffffff);maskShape.fillRect(...box);const mask=maskShape.createGeometryMask();
   for(let i=0;i<12;i++){const strip=scene.add.image(bg.x,bg.y,lease.entry.key).setScale(bg.scaleX);const sy=(box[1]+i*box[3]/12-bg.y)/bg.scaleY+bg.frame.realHeight/2,sh=box[3]/12/bg.scaleY;
    const sx=(box[0]-bg.x)/bg.scaleX+bg.frame.realWidth/2,sw=box[2]/bg.scaleX;
    strip.setCrop(sx,sy,sw,sh+1).setMask(mask);art.add(strip);water.push(strip);
   }
   root.once('destroy',()=>{mask.destroy();maskShape.destroy();});
  }
  if(detail.cloth){const [x,y,w,h]=detail.cloth;for(let i=0;i<6;i++){const strip=scene.add.image(bg.x,bg.y,lease.entry.key).setScale(bg.scaleX);const sx=(x*W-bg.x)/bg.scaleX+bg.frame.realWidth/2,sy=(y*H+i*h*H/6-bg.y)/bg.scaleY+bg.frame.realHeight/2;strip.setCrop(sx,sy,w*W/bg.scaleX,h*H/6/bg.scaleY+1);art.add(strip);cloth.push(strip);}}
  // The graded image and light pool are separate from emissive lamps and weather.
  if(phase==='night')art.setAlpha(.93);
  if(phase!=='day'){
   const tint=phase==='night'?0x748aba:0xffd2a3;for(const o of art.list)if(o.setTint)o.setTint(tint);
   const gradKey='aw2_grade_'+phase;
   if(!scene.textures.exists(gradKey)){const t=scene.textures.createCanvas(gradKey,4,760),c=t.getContext(),g=c.createLinearGradient(0,0,0,760);g.addColorStop(0,phase==='night'?'rgba(8,18,47,.48)':'rgba(171,87,65,.17)');g.addColorStop(.62,'rgba(24,28,44,.08)');g.addColorStop(1,'rgba(8,15,28,.28)');c.fillStyle=g;c.fillRect(0,0,4,760);t.refresh();}
   const grade=scene.add.image(W/2,H/2,gradKey).setDisplaySize(W,H);root.addAt(grade,root.length-1);
  }
  if(id.startsWith('gate_'))A.GateAmbience?.attach(scene,root,bg,A.GateAmbience.environments[id.slice(5)]);
 });
 const moving=()=>A.AnimeArt.motion.breathing&&!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 const tick=(time)=>{
  if(!alive||!bg)return;const t=moving()?time:0;
  // Static framing for battles and homes; journeys use TravelPanorama.
  const drift=0;art.x=drift;
  water.forEach((s,i)=>{s.x=W/2+Math.sin(t/850+i*.9)*(1+i*.12);});
  cloth.forEach((s,i)=>{s.x=W/2+Math.sin(t/620+i*.4)*(i+1)*.24;});
  effects.clear();
  if(detail.mist){for(let i=0;i<7;i++){effects.fillStyle(phase==='night'?0x9cb6cf:0xe0ecec,.018);effects.fillEllipse(((i*223+t*.003)%(W+400))-200,detail.mist*H+Math.sin(t/5000+i)*18,390,24);}}
  if(detail.leaves){for(let i=0;i<16;i++){const x=(i*113+t*.012)%(W+20)-10,y=(i*61+t*.015)%(H+20)-10;effects.fillStyle(['green','green_boss','bell'].includes(id)?0xe8b9c8:0xb4c488,.23);effects.fillEllipse(x,y,4+Math.sin(t/230+i)*2,2);}}
  for(const [nx,ny]of detail.lights||[]){const x=nx*W+drift,y=ny*H,k=.85+Math.sin(t/170+nx*70)*.07;for(let j=4;j>0;j--){effects.fillStyle(id==='crypt'?0x90c9ec:id==='academy'?0xb6afff:0xffc777,(phase==='day'?.012:.033)*k);effects.fillCircle(x,y,j*12);}effects.fillStyle(0xffe6ab,.38*k);effects.fillEllipse(x,y,3,6);}
  if(detail.smoke){for(let i=0;i<9;i++){const age=(t/40+i*13)%120;effects.fillStyle(0xa0a5a5,.035*(1-age/120));effects.fillEllipse(detail.smoke[0]*W+Math.sin(age/15)*5+age*.14,detail.smoke[1]*H-age,12+age*.3,18);}}
 };
 scene.events.on('update',tick);const stop=()=>root.destroy(true);scene.events.once('shutdown',stop);
 root.once('destroy',()=>{alive=false;scene.events.off('update',tick);scene.events.off('shutdown',stop);lease.release();});
 root.ready=lease.ready;root.locationId=id;root.planes={far:art,mid:root,near:effects};return root;
}
const oldBattle=A.BattleArt.paint,oldHome=A.HousingArt.paint;
A.BattleArt.paint=function(scene,id,phase){
 if(scene.game.__artPreview)return oldBattle(scene,id,phase);
 scene.battleArt?.destroy(true);scene.weatherFx?.destroy();
 const root=view(scene,id||'road',phase||'day',{depth:-10});scene.battleArt=root;scene.battlePlanes=root.planes;
 const weather=A.Weather.at(scene.game_?.world||{seed:1,questClock:0},{phase,groundId:id,override:scene.game_?.quest?.travel?.weather});
 if(id?.startsWith('gate_'))root.ready.then(ok=>{
  if(!ok||!root.active||scene.battleArt!==root)return;
  A.GateAmbience.weather(scene,root,A.GateAmbience.environments[id.slice(5)],INDOOR.has(id),weather,phase,{depth:-1,combat:true});
 });
 else if(A.WeatherFX&&!INDOOR.has(resolve(id||'road')))A.WeatherFX.attach(scene,weather,phase,{x:0,y:0,w:W,h:H},{depth:-5,combat:true});return root;
};
A.HousingArt.paint=function(scene,id){
 if(scene.game.__artPreview)return oldHome(scene,id);
 for(const name of ['homeArt','homeLife','homePost','weatherFx','homeMaskShape']){scene[name]?.destroy();scene[name]=null;}
 const phase=A.Housing.timeOfDay(scene.game_?.world?.questClock||0),root=view(scene,id||'camp',phase,{depth:-10});scene.homeArt=root;scene.homePlanes=root.planes;
 if(A.WeatherFX){
  const opts={depth:-5,town:true,celestial:true};
  if(id==='inn'){
   // Glass panes in the approved illustrated bedroom, transformed with its cover fit.
   const s=Math.max((W+24)/1024,(H+18)/760),ox=W/2-512*s,oy=H/2-380*s;
   const shape=scene.make.graphics({add:false});shape.fillStyle(0xffffff);
   // Follow the actual glass pixels, leaving the wooden mullions and indoor plants in front.
   root.ready.then(ok=>{
    if(!ok||!root.active||!root.background)return;
    const source=root.background.frame.source.image,c=document.createElement('canvas');c.width=source.width;c.height=source.height;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);const data=A.ArtAssets.readPixels(ctx,0,0,c.width,c.height)?.data;if(!data)return;
    for(let y=73;y<320;y++)for(const [left,right]of [[43,102],[123,186]]){
     let start=-1;
     for(let x=left;x<=right;x++){
      const at=(y*c.width+x)*4,r=data[at],g=data[at+1],b=data[at+2],glass=x<right&&b>r*.95&&b>g*.94&&b>100&&!(x>163&&y>239)&&!(x>143&&y>277);
      if(glass&&start<0)start=x;
      if(!glass&&start>=0){shape.fillRect(ox+start*s,oy+y*s,(x-start)*s,s+.15);start=-1;}
     }
    }
   });
   const mask=shape.createGeometryMask();scene.homeMaskShape=shape;opts.mask=mask;opts.tintScale=.9;opts.sunX=80;opts.sunY=55;
   root.once('destroy',()=>{mask.destroy();shape.destroy();if(scene.homeMaskShape===shape)scene.homeMaskShape=null;});
  }
  if(id==='inn'||!INDOOR.has(id)){
   const wx=A.WeatherFX.attach(scene,A.Weather.at(scene.game_?.world||{seed:1,questClock:0},{phase}),phase,{x:0,y:0,w:W,h:H},opts);
   if(id!=='inn')root.ready.then(ok=>{
    if(!ok||!root.active||wx.destroyed||!root.background)return;
    const bg=root.background,sky=A.WeatherFX.skyMask(scene,bg.frame.source.image,bg.scaleX,bg.x-bg.displayWidth/2,bg.y-bg.displayHeight/2);
    if(wx.celestial){wx.celestial.setMask(sky.mask);if(sky.anchor)wx.celestial.setPosition(sky.anchor.x-1080,sky.anchor.y-(phase==='evening'?160:82));}
    if(wx.rays&&sky.anchor)wx.rays.setPosition(sky.anchor.x,sky.anchor.y);
    root.once('destroy',()=>sky.destroy());
   });
  }
 }
 return root;
};
A.AnimeEnvironments={view,resolve,DETAILS,ALIASES,INDOOR,pool,acquire};
})();
