// Production portrait assembly. Appearance is deterministic; equipment is a separate layer.
(function () {
'use strict';
const A=ADV,P=A.Portraits,Art=A.AnimeArt,M=A.AnimeManifest;
const ROOT='assets/anime/v2/runtime/',PREFIX='aw2_';
const SETS=['warrior','ranger','mage','healer','plate','duelist','leathers','adept','wildhide','hunter','street','oath','chantry','greenward','shadowweave','ronin','assassins_gear','mercenarys_gear','battle_mages_gear','shinobi_gear','green_eyed_armour','privateers_kit','kings_uniform','plain'];
SETS.push('wardens_gear');
const SET_ALIAS={};
const FACTION={maw:'assassins_gear',antler:'mercenarys_gear',varenholm:'battle_mages_gear',bell:'shinobi_gear',green:'green_eyed_armour',tally:'privateers_kit',navy:'kings_uniform',gate:'hunter'};
const DEFAULT={tank:'warrior',fighter:'duelist',rogue:'leathers',ranger:'hunter',mage:'adept',druid:'wildhide',healer:'healer'};
const PLATE=new Set(['warrior','plate','oath','green_eyed_armour','ronin']);
PLATE.add('wardens_gear');
const EYES=['#64887f','#8b663b','#547aa0','#7b6953','#53575c','#8a719d'];
const LIPS=['#986d63','#aa7476','#825452','#795651','#b84e64','#813f68','#99412e','#574553'];
const cache=new Map(),partCache=new Map(),sources=new Map();
const pendingPortraits=new Map(),pins=new Map();let collecting=null;
function trimSources(){
 for(const id of sources.keys())if(sources.size>12&&!pins.get(id))sources.delete(id);
}
function acquire(sheet){
 pins.set(sheet,(pins.get(sheet)||0)+1);
 const d=M.parts[sheet];
 const ready=sources.has(sheet)?Promise.resolve(sources.get(sheet)):d?A.ArtAssets.load(ROOT+d.file).then(img=>{sources.delete(sheet);sources.set(sheet,img);return img;}):Promise.reject(new Error('Unknown portrait atlas: '+sheet));
 return{ready,release(){pins.set(sheet,Math.max(0,(pins.get(sheet)||1)-1));trimSources();}};
}
function placeholder(scene,k,w=440,h=560){
 if(!scene.textures.exists(k)){
  const t=scene.textures.createCanvas(k,w,h),c=t.getContext();
  c.fillStyle='rgba(35,48,60,.3)';c.fillRect(0,0,w,h);c.fillStyle='#cbbb97';c.font='18px Georgia';c.textAlign='center';c.fillText('Loading art…',w/2,h/2);t.refresh();
  if(w===440&&h===560)Art.META.set(k,{id:k+':loading',pending:true,rig:{beast:true,rigid:true,eyes:[],face:[0,0,1,1],chest:[0,1],compliance:0},w,h,crop:[0,0,1122,1402]});
 }
 return k;
}
function queuePortrait(scene,ch,form,k,needed){
 collecting=null;
 const existing=pendingPortraits.get(k);
 if(existing){existing.needed=needed;return k;}
 placeholder(scene,k);
 const state={needed,leases:[]};pendingPortraits.set(k,state);
 state.ready=(async()=>{
  try{
   while(state.needed.size){
    const batch=[...state.needed].map(acquire);state.leases.push(...batch);state.needed=new Set();
    await Promise.all(batch.map(l=>l.ready));
    if(!scene.textures?.exists(k))break;
    makeKey(scene,ch,form,true);
   }
   A.ArtAssets.recovered(k);
  }catch(e){state.error=e.message;A.AnimeWorld.lastLoadError=e.message;A.ArtAssets.failed(k,()=>{if(scene.textures?.exists(k))makeKey(scene,ch,form,true);});}
  finally{pendingPortraits.delete(k);state.leases.forEach(l=>l.release());}
 })();
 return k;
}
function raster(scene,k,sheet,frame,w,h,retry=false){
 if(scene.textures.exists(k)&&!retry)return k;
 placeholder(scene,k,w,h);const lease=acquire(sheet);
 lease.ready.then(()=>{
  if(!scene.textures?.exists(k))return;
  const c=cell(scene,sheet,frame),t=scene.textures.get(k);if(c){t.getContext().clearRect(0,0,w,h);t.getContext().drawImage(c,0,0,w,h);t.refresh();}
  A.ArtAssets.recovered(k);
 }).catch(e=>{A.AnimeWorld.lastLoadError=e.message;A.ArtAssets.failed(k,()=>raster(scene,k,sheet,frame,w,h,true));}).finally(()=>lease.release());
 return k;
}
function formKey(scene,ch,form,retry=false){
 const k=PREFIX+'form_'+form;
 if(scene.textures.exists(k)&&!retry)return k;
 placeholder(scene,k);
 A.ArtAssets.load('assets/anime/v1/'+Art.ASSETS[form]).then(img=>{
  if(!scene.textures?.exists(k))return;
  if(!scene.textures.exists(Art.rawKey(form)))scene.textures.addImage(Art.rawKey(form),img);
  const real=Art.key(scene,ch,form),t=scene.textures.get(k);
  if(real){t.getContext().clearRect(0,0,440,560);t.getContext().drawImage(scene.textures.get(real).getSourceImage(),0,0,440,560);t.refresh();Art.META.set(k,{...Art.META.get(real),id:k});P._meta[k]={rig:'beast',monster:!!ch.isMonster};}
  A.ArtAssets.recovered(k);
 }).catch(e=>{A.AnimeWorld.lastLoadError=e.message;A.ArtAssets.failed(k,()=>formKey(scene,ch,form,true));});
 return k;
}
const HEADS=A.AnimeIdentities.heads,NAMED=A.AnimeIdentities.named;
function namedFor(ch){const base=NAMED[ch.campaignId||ch.portraitId];return A.GateArt?.named(ch,base)||base;}
function hash(s){return A.hashStr(String(s))>>>0;}
function identity(ch){
 const seed=ch.portraitSeed==null?hash(ch.portraitId||ch.id||'wanderer'):ch.portraitSeed>>>0;
 const named=namedFor(ch),sex=ch.sex==='f'?'f':'m';
 const n=hash(ch.enemyTypeId?seed+':'+ch.enemyTypeId+':'+(ch.skin||'')+':'+(ch.id||''):seed);
 const look=ch.appearance||{};
 const result={seed,sex,head:Number.isInteger(look.head)?Math.abs(look.head)%HEADS[sex].length:n%HEADS[sex].length,iris:EYES.includes(look.iris)?look.iris:EYES[Math.floor(n/11)%EYES.length],eyeType:Number.isInteger(look.eyeType)?Math.abs(look.eyeType)%5:Math.floor(n/13)%5,mouthType:Number.isInteger(look.mouthType)?Math.abs(look.mouthType)%5:Math.floor(n/29)%5,lipColor:LIPS.includes(look.lipColor)?look.lipColor:LIPS[Math.floor(n/31)%4],build:Math.floor(n/41)%3,mark:Math.floor(n/331)%6===0?1:0};
 if(named)Object.assign(result,{named:named.key,head:named.key,iris:named.iris,eyeType:named.eyeType,mouthType:named.mouthType,lipColor:named.lipColor,build:named.build,mark:0});
 return result;
}
function outfit(ch){
 if(SETS.includes(ch.equippedSet))return ch.equippedSet;
 if(SET_ALIAS[ch.equippedSet])return SET_ALIAS[ch.equippedSet];
 const named=namedFor(ch);if(named)return named.set;
 const cd=A.DATA.CAMPAIGN_CHARS?.[ch.campaignId||ch.portraitId],ed=A.DATA.CAMPAIGN_ENEMIES?.[ch.enemyTypeId];
 if(FACTION[cd?.faction||ed?.faction])return FACTION[cd?.faction||ed?.faction];
 if(ch.isMonster)return ({bandit:'street',hedge_mage:'shadowweave',grave_acolyte:'chantry'})[ch.portraitId]||'warrior';
 if(ch.portraitKind==='player'&&!ch.equippedSet){const slot=ch.portraitSlot||1;if(slot>=16)return'kings_uniform';if(slot>=14)return'privateers_kit';if(slot>=12)return'ronin';if(slot>=10)return'shinobi_gear';return ['warrior','leathers','mage','hunter','wildhide','healer','ranger','street','adept'][slot-1]||'plain';}
 const role=ch.archetype||(ch.archetypeInclination||[])[0];
 return DEFAULT[role]||['duelist','ranger','adept','healer','hunter','leathers','street','plain'][hash(ch.portraitSeed||ch.id||1)%8];
}
function load(scene){
 for(const[id,d]of Object.entries(M.parts))if(!sources.has(id)&&!scene.textures.exists(PREFIX+id))scene.load.image(PREFIX+id,ROOT+d.file);
 scene.load.once('complete',()=>{for(const id of Object.keys(M.parts))if(scene.textures.exists(PREFIX+id)){sources.set(id,scene.textures.get(PREFIX+id).getSourceImage());scene.textures.remove(PREFIX+id);}});
 for(const id of ['werewolf','werebear','panther','sentinel'])if(!scene.textures.exists(Art.rawKey(id)))scene.load.image(Art.rawKey(id),'assets/anime/v1/'+Art.ASSETS[id]);
}
function cell(scene,sheet,frame){
 const key=sheet+':'+frame;if(partCache.has(key)){const c=partCache.get(key);partCache.delete(key);partCache.set(key,c);return c;}
 const d=M.parts[sheet],src=sources.get(sheet)||(scene.textures.exists(PREFIX+sheet)&&scene.textures.get(PREFIX+sheet).getSourceImage());if(!d||!src){collecting?.add(sheet);return null;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=d.cell;
 canvas.getContext('2d').drawImage(src,frame%2*d.cell,Math.floor(frame/2)*d.cell,d.cell,d.cell,0,0,d.cell,d.cell);
 partCache.set(key,canvas);while(partCache.size>20)partCache.delete(partCache.keys().next().value);return canvas;
}
function shape(ctx,points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.stroke();}}
function fit(ctx,img,x,y,w,h){const s=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*s)/2,y+(h-img.height*s)/2,img.width*s,img.height*s);}
function headwear(ctx,scene,set,r,named){
 if(named)return; // Story accessories belong to the reserved head, until gear is explicitly equipped.
 let frame=null,box=null,sheet='headgear';
 if(set==='warrior'){frame=0;box=[230,-34,660,660];r.browsCovered=true;}
 if(set==='plate'){frame=1;box=[265,25,590,590];r.masked=true;r.browsCovered=true;r.eyes=[];}
 if(set==='green_eyed_armour'){frame=2;box=[210,-40,710,710];r.browsCovered=true;}
 if(set==='privateers_kit'){frame=3;box=[211,0,700,450];r.browsCovered=true;}
 if(set==='kings_uniform'){sheet='headgear_2';frame=0;box=[231,0,660,470];r.browsCovered=true;}
 if(set==='assassins_gear'){sheet='headgear_2';frame=1;box=[226,-24,670,670];r.browsCovered=true;}
 if(frame!==null){const h=cell(scene,sheet,frame);if(h)ctx.drawImage(h,...box);}
 if(['shinobi_gear','assassins_gear','leathers','street','shadowweave'].includes(set)){
  const y=(r.eyes[0]?.[1]||325)+28;
  shape(ctx,[[415,y],[561,y+15],[707,y],[693,492],[564,549],[429,493]],'#242635','#0e131e');
  shape(ctx,[[420,y+9],[565,y+29],[703,y+9],[694,y+45],[567,y+54],[425,y+38]],'#343746');
  ctx.strokeStyle='#777c8c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(437,y+70);ctx.quadraticCurveTo(560,y+88,687,y+70);ctx.stroke();
  if(set==='shinobi_gear'){
   shape(ctx,[[409,234],[710,234],[708,274],[415,274]],'#202632','#101521');
   shape(ctx,[[512,235],[610,235],[610,270],[512,270]],'#7b8291','#151b27');r.browsCovered=true;
  }
  r.masked=true;
 }
}
function skinBody(body,target,set,sex){
 // Authored center-neck/chest areas. The selector excludes neutral steel and dark cloth.
 const c=document.createElement('canvas');c.width=c.height=body.width;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(body,0,0);
 const d=A.ArtAssets.readPixels(x,0,0,c.width,c.height);if(!d)return body;const p=d.data;
 let regions=[[190,0,125,48],[18,195,112,280],[370,195,112,280]];
 if(!['plate','oath','green_eyed_armour','ronin','warrior'].includes(set))regions.push([188,38,125,set==='mage'?165:125]);
 // Cream fabric shares the old hue selector's skin range. These authored
 // openings keep the blouse, embroidered cuffs and gold trim out of the tint.
 let skinMask=null,reference=184;
 if(sex==='f'&&(set==='plain'||set==='mage')){
  const mask=document.createElement('canvas');mask.width=mask.height=c.width;const m=mask.getContext('2d');
  const poly=points=>{m.beginPath();points.forEach(([a,b],i)=>i?m.lineTo(a,b):m.moveTo(a,b));m.closePath();m.fill();};
  if(set==='plain'){
   poly([[203,0],[253,0],[255,20],[262,32],[259,49],[251,66],[232,106],[218,77],[206,61],[196,45],[196,29],[201,16]]);
   regions=[[190,0,80,110]];reference=207;
  }else{
   poly([[227,0],[276,0],[276,12],[264,17],[252,31],[247,21],[234,15],[227,13]]);
   poly([[248,65],[248,79],[260,84],[257,72],[290,99],[263,115],[260,122],[231,103],[218,99]]);
   poly([[76,302],[84,302],[91,312],[88,331],[94,351],[94,390],[88,419],[79,420],[61,405],[54,377],[61,349],[66,334],[73,314]]);
   poly([[431,302],[439,303],[443,320],[447,340],[450,359],[455,379],[449,398],[441,410],[435,422],[424,411],[425,399],[421,388],[419,350],[425,338],[424,331],[419,315],[420,308]]);
   regions=[[215,0,80,125],[50,300,47,126],[417,300,42,126]];
  }
  skinMask=m.getImageData(0,0,c.width,c.height).data;
 }
 for(const[rx,ry,rw,rh]of regions)for(let yy=ry;yy<ry+rh;yy++)for(let xx=rx;xx<rx+rw;xx++){
  const i=(yy*c.width+xx)*4,r=p[i],g=p[i+1],b=p[i+2];
  if(skinMask&&!skinMask[i+3])continue;
  if(p[i+3]<240||r<160||r<g*1.12||g<b*1.06||r-b<38)continue;
  const hue=60*(g-b)/(r-b);if(hue<16||hue>37)continue;
  const l=(r*.3+g*.59+b*.11)/reference;
  for(let j=0;j<3;j++)p[i+j]=Math.min(255,l<=1?target[j]*l:target[j]+(255-target[j])*Math.min(.55,(l-1)*.65));
 }
 x.putImageData(d,0,0);return c;
}
function clothColor(canvas,color){
 if(!color)return;
 const target=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),ctx=canvas.getContext('2d',{willReadFrequently:true}),d=A.ArtAssets.readPixels(ctx,0,0,canvas.width,canvas.height);if(!d)return;
 for(let i=0;i<d.data.length;i+=4){const p=d.data,r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]<200||b<g*1.05||b<r*1.12||b-r<12)continue;const l=(r*.3+g*.59+b*.11)/95;for(let j=0;j<3;j++)p[i+j]=Math.min(255,target[j]*l);}
 ctx.putImageData(d,0,0);
}
function composeHuman(scene,ch,id,set){
 const named=NAMED[id.named],authored=named?named.head:HEADS[id.sex][id.head],h=Object.assign({},authored),head=cell(scene,h.sheet,h.frame);
 const registration=M.parts[h.sheet].registration?.[h.frame];
 if(registration){const p=registration;h.nx=h.nx*p.scale+p.x;h.ny=h.ny*p.scale+p.y;h.chin=h.chin*p.scale+p.y;for(const k of ['eyeUp','mouthDown','spread'])h[k]*=p.scale;}
 const index=SETS.indexOf(set),special=named&&(!ch.equippedSet||named.bodySets?.includes(set))&&named.bodySheet;
 const warden=set==='wardens_gear'&&A.GateArt?.warden(ch);
 const body=cell(scene,special||warden?.sheet|| (set==='wardens_gear'?'wardrobe_gate':'wardrobe_'+id.sex+(Math.floor(index/4)+1)),special?named.bodyFrame:warden?warden.frame:set==='wardens_gear'?(id.sex==='f'?0:1):index%4);
 if(!head||!body)return null;
 const master=document.createElement('canvas');master.width=1122;master.height=1402;const ctx=master.getContext('2d');
 const sampled=A.ArtAssets.readPixels(head.getContext('2d'),Math.round((h.nx+34*(registration?.scale||1))*500/627),Math.round((h.ny+15*(registration?.scale||1))*500/627),1,1);
 const hp=sampled?sampled.data:[210,170,140,255];
 let flesh=special&&named.authoredSkin?body:skinBody(body,hp,set,id.sex);
 const bodyW=named?.bodyWidth||[1020,1060,980][id.build];
 // Register the neck opening, not the bounding box of an asymmetric coat.
 const neckX=!special&&!warden?(set==='hunter'?232:set==='plain'&&id.sex==='f'?230:250):250;
 const bodyX=561-neckX*bodyW/500;
 // Overlap the modular collar with the neck rather than leaving the two cut edges adjacent.
 let bodyY=set==='plate'?528:474;
 let neckFront=520;
 if(!named?.authoredSkin&&!warden&&set!=='plate'){
  // Headless outfit sheets include the BACK rim of an empty collar. The neck must pass in
  // front of that rim, while the lower/front collar still covers the neck. Find the rim in
  // the actual outfit, so an open hunting coat and a high robe collar need no shared offset.
  const top=A.ArtAssets.readPixels(body.getContext('2d'),neckX-5,0,10,100)?.data;
  for(let yy=0;top&&yy<100;yy++){
   let solid=0;for(let xx=0;xx<10;xx++)if(top[(yy*10+xx)*4+3]>180)solid++;
   if(solid>5){
    // Each atlas has different empty space above its collar. Leaving that
    // padding in the placement creates a long neck or a floating masked head.
    bodyY-=yy*bodyW/500;
    neckFront=Math.max(520,Math.min(650,bodyY+(yy+22)*bodyW/500));break;
   }
  }
 }
 if(named?.authoredSkin||warden){
  // The generated modular collar opening is hollow. Expose the neck beneath it.
  const c=document.createElement('canvas');c.width=c.height=body.width;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(flesh,0,0);
  const top=A.ArtAssets.readPixels(x,245,0,10,110)?.data;let collar=0;for(let yy=0;top&&yy<110;yy++){if(Array.from({length:10},(_,xx)=>top[(yy*10+xx)*4+3]).filter(a=>a>180).length>5){collar=yy;break;}}
  bodyY=500-collar*bodyW/500;
  const d=A.ArtAssets.readPixels(x,210,0,80,90);if(d){for(let i=0;i<d.data.length;i+=4){const p=d.data;if(p[i]+p[i+1]+p[i+2]<145&&Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2])<50)p[i+3]=0;}x.putImageData(d,210,0);}flesh=c;
  ctx.fillStyle=`rgb(${hp[0]},${hp[1]},${hp[2]})`;ctx.beginPath();ctx.moveTo(500,465);ctx.lineTo(622,465);ctx.lineTo(655,700);ctx.lineTo(468,700);ctx.closePath();ctx.fill();
 }
 if(named&&!ch.equippedSet)clothColor(flesh,named.clothColor);
 const S=Math.min(1.13,Math.max(.83,127/(authored.chin-authored.ny)))/(registration?.scale||1),hw=627*S,hx=561-h.nx*S,hy=378-h.ny*S;
 const covered=!named||!!ch.equippedSet;
 // Head goes behind the collar; its upper portion returns above the shoulders.
 function drawHead(topOnly){
  if(covered&&set==='plate')return;
  ctx.save();
  if(named?.authoredSkin){ctx.beginPath();ctx.rect(0,0,1122,525);ctx.clip();}
  if(h.clipRight){ctx.beginPath();ctx.rect(hx,hy,h.clipRight*S,hw);ctx.clip();}
  if(h.clipPolygon){ctx.beginPath();h.clipPolygon.forEach(([x,y],i)=>i?ctx.lineTo(hx+x*S,hy+y*S):ctx.moveTo(hx+x*S,hy+y*S));ctx.closePath();ctx.clip();}
  if(covered&&['warrior','green_eyed_armour','assassins_gear','privateers_kit','kings_uniform'].includes(set)){ctx.beginPath();ctx.ellipse(561,395,147,194,0,0,Math.PI*2);ctx.clip();}
  if(topOnly){
   const join=!named&&set!=='plate'?558:520;
   ctx.beginPath();ctx.rect(0,0,1122,join);
   if(neckFront>join){const half=id.sex==='f'?62:70;ctx.moveTo(561-half,join-5);ctx.lineTo(561+half,join-5);ctx.lineTo(606,neckFront);ctx.lineTo(516,neckFront);ctx.closePath();}
   if(named?.beardFront)ctx.rect(385,510,350,180);ctx.clip();
   if(!named&&set!=='plate'){
    const layer=document.createElement('canvas');layer.width=1122;layer.height=1402;const lc=layer.getContext('2d');
    lc.drawImage(head,hx,hy,hw,hw);lc.globalCompositeOperation='destination-out';
    const fade=lc.createLinearGradient(0,500,0,558);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'#000');
    lc.fillStyle=fade;lc.fillRect(0,500,1122,902);ctx.drawImage(layer,0,0);
   }else ctx.drawImage(head,hx,hy,hw,hw);
  }
  else ctx.drawImage(head,hx,hy,hw,hw);
  ctx.restore();
 }
 // A cropped head atlas does not necessarily contain enough neck to reach a
 // low/open collar. Keep continuous skin behind both pieces; an opaque torso
 // or mask naturally covers it. Feathering alone cannot fill transparent gaps.
 function drawNeck(front){
  if(named?.authoredSkin||warden||set==='plate')return;
  ctx.save();
  if(front){
   const half=id.sex==='f'?62:70;ctx.beginPath();ctx.moveTo(561-half,515);
   ctx.lineTo(561+half,515);ctx.lineTo(606,neckFront);ctx.lineTo(516,neckFront);ctx.closePath();ctx.clip();
  }
  const bottom=Math.max(610,neckFront+32),half=id.sex==='f'?55:63;
  const neck=ctx.createLinearGradient(0,488,0,bottom);
  const tone=k=>`rgb(${Math.round(hp[0]*k)},${Math.round(hp[1]*k)},${Math.round(hp[2]*k)})`;
  neck.addColorStop(0,tone(.76));neck.addColorStop(.32,tone(.9));neck.addColorStop(1,tone(1));
  ctx.fillStyle=neck;ctx.beginPath();ctx.moveTo(561-half,486);ctx.lineTo(561+half,486);
  ctx.quadraticCurveTo(561+half-8,555,627,bottom);ctx.lineTo(495,bottom);
  ctx.quadraticCurveTo(561-half+8,555,561-half,486);ctx.closePath();ctx.fill();
  ctx.restore();
 }
 drawNeck(false);
 drawHead(false);
 // The body cell is cropped flat across the neck, so its first rows landed on the head's neck as a
 // hard horizontal line (a 'detached head' once the canvas was scaled to full screen). Feather the
 // body's top edge in over the neck column so the head's own neck shows through the join.
 if(covered&&set==='plate')ctx.drawImage(flesh,bodyX,bodyY,bodyW,bodyW);   // no head under a full helm: nothing to blend into
 else{const t=document.createElement('canvas');t.width=1122;t.height=1402;const tc=t.getContext('2d');
  tc.drawImage(flesh,bodyX,bodyY,bodyW,bodyW);
  tc.globalCompositeOperation='destination-out';
  const fade=tc.createLinearGradient(0,bodyY,0,bodyY+38);fade.addColorStop(0,'#fff');fade.addColorStop(1,'rgba(255,255,255,0)');
  tc.fillStyle=fade;tc.fillRect(440,bodyY,242,38);
  ctx.drawImage(t,0,0);}
 // Carry that neck over the back rim too; the head raster alone may end here.
 drawNeck(true);
 drawHead(true);
 if(named?.companion==='findik_tiger'){
  const f=A.GateManifest?.frames['extras:findik'],tiger=f?cell(scene,f.sheet,f.frame):null;
  if(tiger)ctx.drawImage(tiger,500,570,1050,1050);
 }
 const point=(x,y)=>[hx+x*S,hy+y*S];
 const eyes=[point(h.nx-h.spread,h.ny-h.eyeUp),point(h.nx+h.spread,h.ny-h.eyeUp)],mouth=point(h.nx,h.ny+h.mouthDown);
 const featureScale=S*(registration?.scale||1);
 const r={face:[390,210,350,330],eyes:h.noEyes?[]:eyes,mouth,nose:null,iris:id.iris,female:id.sex==='f',eyeW:(named?.eyeWidth||(id.sex==='f'?40:36))*featureScale,eyeH:(named?.eyeHeight||(id.sex==='f'?22:17))*featureScale,browOffset:40*featureScale,chest:[580,1320],compliance:PLATE.has(set)?0:set==='shinobi_gear'?.25:.65,browsCovered:!!h.browsCovered,masked:!!h.masked,cloudy:!!named?.cloudy,mouthScale:named?.mouthScale||1};
 // Tiny permanent marks belong to the identity, not to its current equipment.
 if(id.mark===1){ctx.strokeStyle='#9c665a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(eyes[1][0]+18,eyes[1][1]+8);ctx.lineTo(eyes[1][0]+11,eyes[1][1]+61);ctx.stroke();}
 if(id.mark===2){ctx.fillStyle='#885d4b';for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(495+i*16,384+(i%3)*5,1.9,0,Math.PI*2);ctx.fill();}}
 if(id.mark===3){ctx.fillStyle='#c4a05b';ctx.beginPath();ctx.arc(420,405,8,0,Math.PI*2);ctx.fill();}
 headwear(ctx,scene,set,r,named&&!ch.equippedSet);
 if(named?.ragged){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.strokeStyle='#4c5457';ctx.lineWidth=6;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(310+i*85,840+i*20);ctx.lineTo(330+i*87,925+i*15);ctx.stroke();}ctx.restore();}
 if(ch.isUndead){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(87,143,158,.18)';ctx.fillRect(0,0,1122,1402);ctx.restore();r.iris='#9ec4b2';}
 return{master,rig:r};
}
function usedTextures(scene){
 const used=new Set();const walk=o=>{if(o.texture)used.add(o.texture.key);if(Array.isArray(o.list))o.list.forEach(walk);};
 for(const s of scene.game.scene.scenes)s.children?.list.forEach(walk);
 return used;
}
function trim(scene){
 if(cache.size<=80)return;const used=usedTextures(scene);
 for(const k of cache.keys())if(cache.size>64&&!used.has(k)){cache.delete(k);Art.META.delete(k);delete P._meta[k];if(scene.textures.exists(k))scene.textures.remove(k);}
}
function makeKey(scene,ch,form,rebuild=false){
 if(ch?.animeIdentity&&(scene.game_?.__artPreview||scene.sys.settings.key==='AnimePreview'||scene.sys.settings.key==='AnimeCombat'))return null;
 if(!ch)return null;
 // Dependents are not adventuring adults and must not use an adult torso rig.
 const child=ch.isChild||ch.dependent||ch.ageStage==='child'||(!ch.stats&&String(ch.id||'').startsWith('child'));
 const id=identity(ch),set=outfit(ch),family=ch.isMonster?ch.portraitId:null;
 const enemyDef=A.DATA.CAMPAIGN_ENEMIES?.[ch.enemyTypeId]||A.DATA.ENEMIES?.[ch.enemyTypeId];
 // Some campaign orcs use human combat statistics; their portrait family still wins.
 const human=child||!!id.named||['bandit','hedge_mage','grave_acolyte'].includes(family)||(!family||family==='plated_sentinel')&&(ch.species==='human'||enemyDef?.species==='human');
 let creature=form||(!human?family:null);
 if(creature==='marine'||creature==='sea_dog'||creature==='spellblade'||creature==='unbroken'||creature==='wild')creature=null;
 if(creature==='plated_sentinel')creature='sentinel';
 const gateEnemy=!form&&!id.named&&A.GateArt?.enemy(ch);
 if(gateEnemy)creature='gate_'+(ch.campaignMiniId||ch.enemyTypeId);
 if(['werewolf','werebear','panther','sentinel'].includes(creature))return formKey(scene,ch,creature);
 const entry=gateEnemy||M.creatures[creature];
 if(creature&&!entry)throw new Error('Missing illustrated creature: '+creature);
 const childFrame=(id.sex==='f'?0:2)+id.seed%2;
 const signature=child?['child',childFrame]:entry?[creature,ch.enemyTypeId||'',ch.skin||'',ch.skinTint||'',ch.boss?1:0,ch.isUndead?1:0]:[id.sex,id.head,id.iris,id.eyeType,id.mouthType,id.lipColor,id.build,id.mark,set,ch.equippedSet?'equipped':'default',ch.skinTint||'',ch.isUndead?1:0,form||'',NAMED[id.named]?.companion||''];
 const k=PREFIX+'portrait_'+signature.join('_');
 if(scene.textures.exists(k)&&!rebuild){if(!pendingPortraits.has(k)){cache.delete(k);cache.set(k,true);}return k;}
 collecting=new Set();
 let result;
 if(entry||child){
  const sprite=child?cell(scene,'children',childFrame):cell(scene,entry.sheet,entry.frame);if(!sprite)return queuePortrait(scene,ch,form,k,collecting);
  const master=document.createElement('canvas');master.width=1122;master.height=1402;const ctx=master.getContext('2d');
  fit(ctx,sprite,0,80,1122,1290);
  // Authored alternate skins retain the underlying species, with visible scars/rune markings.
  if(ch.enemyTypeId){const v=hash(ch.enemyTypeId);ctx.save();ctx.globalCompositeOperation='source-atop';
   ctx.fillStyle=ch.skinTint||['#3d6f82','#8f5028','#5d7441','#695189'][v%4];ctx.globalAlpha=.18;ctx.fillRect(0,0,1122,1402);ctx.globalAlpha=1;
   if(ch.boss){ctx.strokeStyle=['#d4b767','#bd665b','#87beb5'][v%3];ctx.lineWidth=7;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(310+i*25,610);ctx.lineTo(290+i*25,732);ctx.stroke();}}
   if(ch.isUndead){ctx.fillStyle='rgba(70,126,135,.22)';ctx.fillRect(0,0,1122,1402);}ctx.restore();
  }
  result={master,rig:{face:[0,0,1,1],eyes:[],beast:true,chest:[450,1300],compliance:0,rigid:['golem','beetle','crab','scorpion'].includes(creature)}};
 }else result=composeHuman(scene,ch,id,set);
 const needed=collecting;collecting=null;
 if(needed.size)return queuePortrait(scene,ch,form,k,needed);
 if(!result)return null;
 trim(scene);
 let facePatch=null;
 if(!creature&&!child){const r=result.rig;Object.assign(r,{eyeType:id.eyeType,mouthType:id.mouthType,lipColor:id.lipColor});facePatch=document.createElement('canvas');facePatch.width=r.face[2];facePatch.height=r.face[3];facePatch.getContext('2d').drawImage(result.master,...r.face,0,0,r.face[2],r.face[3]);Art.paintFace(result.master.getContext('2d'),r,'neutral',false,0,0);}
 const tex=scene.textures.exists(k)?scene.textures.get(k):scene.textures.createCanvas(k,440,560);tex.getContext().clearRect(0,0,440,560);tex.getContext().drawImage(result.master,0,0,440,560);tex.refresh();
 const meta={id:k,rig:result.rig,facePatch,crop:[0,0,1122,1402],w:440,h:560,view:'bust',identity:id,set,creature:creature||null};
 Art.META.set(k,meta);P._meta[k]={rig:creature?'beast':'human',masked:!!result.rig.masked,browsCovered:!!result.rig.browsCovered,monster:!!ch.isMonster,sex:id.sex};cache.set(k,true);return k;
}
const oldKey=P.key,oldBeast=P.beastKey;
P.key=(scene,ch)=>makeKey(scene,ch)||oldKey(scene,ch);
P.beastKey=(scene,ch,beast)=>makeKey(scene,ch,beast)||oldBeast(scene,ch,beast);
const release=Art.release;
Art.release=function(textures){
 // Preview shutdown must not remove production parts/composites used by other scenes.
 for(const k of textures.getTextureKeys())if(k.startsWith('anime_')&&!['werewolf','werebear','panther','sentinel'].some(id=>k===Art.rawKey(id)||k==='anime_body_v1_'+id+'_original_bust'))textures.remove(k);
 for(const k of Art.META.keys())if(k.startsWith('anime_')&&!textures.exists(k)){Art.META.delete(k);delete P._meta[k];}
};
function prop(scene,name){const frames={grave:0,coffin:1,lantern:2,pip:3},frame=frames[name],k=PREFIX+'prop_'+name;return frame===undefined?null:raster(scene,k,'props_story',frame,500,500);}
A.AnimeWorld={version:2,load,key:makeKey,identity,outfit,SETS,FACTION,cache,trim,cell,prop,ROOT,PREFIX,manifest:M,previewRelease:release,EYES,LIPS,
 headNames:A.AnimeIdentities.headNames,sources,partCache,raster,pendingPortraits,
 colorNames:{'#64887f':'Jade','#8b663b':'Amber','#547aa0':'Blue','#7b6953':'Hazel','#53575c':'Slate','#8a719d':'Violet','#986d63':'Warm nude','#aa7476':'Rose','#825452':'Brown rose','#795651':'Mocha','#b84e64':'Berry','#813f68':'Plum','#99412e':'Terracotta','#574553':'Mauve'}};
})();
