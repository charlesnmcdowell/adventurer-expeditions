// Travel-only panoramas. Battle compositions keep their original camera and art.
(function(){
'use strict';
const A=ADV,W=1280,H=760,ROOT='assets/anime/travel/v1/runtime/';
const INDOOR=new Set(['crypt','ossuary','birthing_house']);
const pool=new Map();
const files={};
function purge(scene){const free=[...pool.values()].filter(v=>v.loaded&&!v.refs).sort((a,b)=>a.used-b.used);while(free.length>2){const old=free.shift();scene.textures.remove(old.key);pool.delete(old.id);}}
function acquire(scene,id){
 if(id!=='sea'&&!A.DATA.TRAVEL_LOCATIONS[id]&&!files[id])throw Error('Unknown travel panorama: '+id);
 let e=pool.get(id);
 if(e?.failed){pool.delete(id);e=null;}
 if(!e){
  e={id,key:'travel_pano_'+id,refs:0,used:performance.now()};pool.set(id,e);
  e.ready=new Promise(resolve=>{
   const img=new Image();img.decoding='async';
   img.onload=()=>{
    if(!scene.textures.exists(e.key)){
     // The Griffon band shipped with 68 pixels of the previous room above its sky.
     // Crop that atlas spill at load time, keeping the approved source file intact.
     if(id==='gate_griffon'){const c=document.createElement('canvas');c.width=img.width;c.height=img.height-68;c.getContext('2d').drawImage(img,0,68,img.width,c.height,0,0,c.width,c.height);scene.textures.addCanvas(e.key,c);}
     else scene.textures.addImage(e.key,img);
    }e.loaded=true;resolve(true);purge(scene);
   };
   img.onerror=()=>{e.failed=true;resolve(false);};img.src=files[id]||ROOT+id+'.webp';
  });
 }
 e.refs++;e.used=performance.now();let released=false;
 return{entry:e,ready:e.ready,release(){
  if(released)return;released=true;e.refs--;e.used=performance.now();
  purge(scene);
 }};
}
function motion(){return A.Prefs?.get().artMotion!==false&&!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function view(scene,id,phase,opts={}){
 // Underground scenery keeps its authored lamplight at every time of day.
 if(INDOOR.has(id))phase='day';
 const lease=acquire(scene,id),root=scene.add.container(0,0),fx=scene.add.graphics();
 let tile=null,alive=true,elapsed=0,distance=opts.resume?310:0,sky=null,maskedWeather=null;
 root.add(scene.add.rectangle(W/2,H/2,W,H,0x18283c));
 root.add(fx);root.locationId=id;root.distance=distance;
 const terrain=id==='sea'?'coast':A.DATA.TRAVEL_LOCATIONS[id].terrain;
 const inside=INDOOR.has(id),water=['coast','port'].includes(terrain)||id==='marsh'||id==='maw';
 lease.ready.then(ok=>{
  if(!alive||!ok)return;
  const frame=scene.textures.get(lease.entry.key).get(),scale=H/frame.realHeight;
  tile=scene.add.tileSprite(0,0,W,H,lease.entry.key).setOrigin(0).setTileScale(scale,scale);
  tile.tilePositionX=distance/scale;root.addAt(tile,1);root.tile=tile;root.tileScale=scale;
  root.sourceWidth=frame.realWidth;root.sourceHeight=frame.realHeight;root.artTextureKey=lease.entry.key;root.slices=[];
  if(!INDOOR.has(id)&&A.WeatherFX.skyMask){sky=A.WeatherFX.skyMask(scene,frame.source.image,scale,0,0,true);root.skyMask=sky.mask;if(root.weather?.celestial)root.weather.celestial.setMask(sky.mask);}
  if(phase==='night')tile.setTint(0x7189ba);else if(phase==='evening')tile.setTint(0xffc795);
  const key='travel_grade_'+phase;
  if(!scene.textures.exists(key)){
   const t=scene.textures.createCanvas(key,4,H),c=t.getContext(),g=c.createLinearGradient(0,0,0,H);
   g.addColorStop(0,phase==='night'?'rgba(5,13,40,.6)':phase==='evening'?'rgba(164,63,73,.25)':'rgba(10,25,40,.08)');
   g.addColorStop(.45,phase==='night'?'rgba(7,17,39,.22)':'rgba(0,0,0,0)');g.addColorStop(1,phase==='night'?'rgba(6,15,30,.40)':'rgba(6,15,23,.28)');c.fillStyle=g;c.fillRect(0,0,4,H);t.refresh();
  }
  root.addAt(scene.add.image(W/2,H/2,key).setDisplaySize(W,H),root.length-1);
  const profile=id.startsWith('gate_')?A.GateAmbience?.panoramas[id.slice(5)]:A.TravelAmbience?.profiles[id];
  A.GateAmbience?.attach(scene,root,tile,profile,{panorama:true,phase});
  root.slices=root.ambience?.strips.map(({s,kind})=>({strip:s,kind}))||[];
  root.bringToTop(fx);
 });
 root.advance=(dt,velocity=0)=>{
  if(!alive||!tile||!root.visible||document.hidden)return;
  dt=Math.min(50,dt);const moving=motion();if(moving){elapsed+=dt;distance+=velocity*dt/1000*1.6;}
  root.distance=distance;tile.tilePositionX=distance/root.tileScale;
  if(sky)sky.update(distance);
  // Weather can be installed after the panorama resolves, or replaced mid-trip.
  // Clouds and celestial light share the scrolling sky silhouette.
  if(sky&&root.weather&&!root.weather.destroyed&&root.weather!==maskedWeather){
   maskedWeather=root.weather;maskedWeather.celestial?.setMask(sky.mask);
   for(const cloud of maskedWeather.clouds||[])cloud.setMask(sky.mask);
  }
  root.ambience?.update(0,dt);
  fx.clear();const t=elapsed;
  // Footfall dust stays on the road, while its wake drifts behind the party.
  if(moving&&Math.abs(velocity)>1&&!inside&&!water&&!id.startsWith('gate_')){for(let i=0;i<9;i++){
   const age=(t+i*123)%1100;fx.fillStyle(0xdccca7,.13*(1-age/1100));fx.fillEllipse(520+i%4*65-age*.05,651-age*.013,9+age*.015,3+age*.004);
  }}
 };
 const stop=()=>root.destroy(true);scene.events.once('shutdown',stop);
 root.once('destroy',()=>{alive=false;scene.events.off('shutdown',stop);sky?.destroy();lease.release();});
 root.ready=lease.ready;return root;
}
A.TravelPanorama={acquire,view,INDOOR,get DETAILS(){return A.TravelAmbience?.profiles||{};},files,pool,motion};
})();
