// Shared illustrated portrait animation and the isolated fitting-room studies.
(function () {
'use strict';
const A = ADV, P = A.Portraits;
const ROOT = 'assets/anime/v1/';
const ASSETS = {
  mage: 'mage.png', oath: 'armor-alpha.png', shinobi: 'ninja-alpha.png',
  samurai: 'samurai.png', pirate: 'pirate.png', sentinel: 'sentinel.png',
  werewolf: 'werewolf.png', werebear: 'werebear.png', panther: 'panther.png',
  port: 'port.png', forest: 'forest.png',
};
// Master-space anchors, authored against 1122 x 1402. No fixed legacy eye line.
const RIGS = {
  mage: { face: [422,178,278,158], eyes: [[501,238],[609,238]], mouth: [555,311], nose: [555,278], iris: '#628ba5', female: true, chest: [395,940], compliance: 1 },
  oath: { parent: 'mage', compliance: 0 },
  shinobi: { parent: 'mage', masked: true, browsCovered: true, compliance: .3 },
  samurai: { face: [429,189,253,160], eyes: [[509,239],[602,239]], mouth: [554,325], iris: '#697e67', chest: [430,970], compliance: 0 },
  pirate: { face: [421,108,272,187], eyes: [[496,169],[604,169]], mouth: [549,266], iris: '#b79648', chest: [355,965], compliance: .1 },
  werewolf: { face: [420,220,280,138], eyes: [[489,286],[632,286]], fur: '#514d57', beast: true, chest: [580,1310] },
  werebear: { face: [462,90,235,118], eyes: [[520,143],[641,142]], fur: '#4a3329', beast: true, chest: [480,1300] },
  panther: { face: [479,257,431,171], eyes: [[580,326],[823,372]], fur: '#282435', beast: true, chest: [700,1390] },
  sentinel: { face: [0,0,1,1], eyes: [], masked: true, browsCovered: true, rigid: true, chest: [440,1100], compliance: 0 },
};
for (const r of Object.values(RIGS)) if (r.parent) Object.assign(r, RIGS[r.parent], { compliance: r.compliance, masked: !!r.masked, browsCovered: !!r.browsCovered });
const TONES = {
  original: null, deep: [94,58,43], brown: [144,93,62], warm: [189,133,91],
  light: [223,173,132], fair: [233,192,160], pale: [241,212,190],
};
const META = new Map();
let serial = 0;
const rawKey = id => 'anime_source_v1_' + id;
const motion = {};
Object.defineProperties(motion,{
 breathing:{get:()=>A.Prefs?.get().artMotion!==false,set:v=>A.Prefs?.set({artMotion:!!v})},
 secondary:{get:()=>A.Prefs?.get().secondaryMotion!==false,set:v=>A.Prefs?.set({secondaryMotion:!!v})}
});
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function rig(id) { return RIGS[id]; }
function load(scene) {
  for (const [id, path] of Object.entries(ASSETS)) if (!scene.textures.exists(rawKey(id))) scene.load.image(rawKey(id), ROOT + path);
}
function resolve(ch) {
  if (!ch || ch.isChild || ch.dependent || ch.ageStage === 'child') return null;
  if (ch.animeIdentity === 'aera') return ({ mage: 'mage', oath: 'oath', shinobi_gear: 'shinobi' })[ch.equippedSet] || (!ch.equippedSet ? 'mage' : null);
  if (ch.animeIdentity === 'samurai' && (!ch.equippedSet || ch.equippedSet === 'ronin')) return 'samurai';
  if (ch.animeIdentity === 'pirate' && (!ch.equippedSet || ch.equippedSet === 'privateers_kit')) return 'pirate';
  if (ch.animeIdentity === 'sentinel') return 'sentinel';
  return null;
}
function path(ctx, pts) { ctx.beginPath(); pts.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); }
// Exact skin regions for the adult Aera pilot. Color changes never tint equipment.
function recolor(ctx, id, tone) {
  if (!tone || !['mage','oath','shinobi'].includes(id)) return;
  const mask = document.createElement('canvas'); mask.width=1122; mask.height=1402;
  const m=mask.getContext('2d'); m.fillStyle='#fff';
  const regions=id==='shinobi' ? [[420,115,285,295],[230,430,155,235],[765,430,130,245],[205,710,156,200],[790,710,132,195],[250,1100,630,302],[85,1250,180,152],[880,1250,150,152]]
    : id==='mage' ? [[420,115,285,295],[423,478,285,172],[120,1120,125,240],[888,1110,115,245],[295,1190,320,212]]
    : [[420,115,285,295],[118,1140,130,220],[885,1120,125,245],[290,1170,325,232]];
  for(const box of regions)m.fillRect(...box);
  const d=A.ArtAssets?.readPixels(ctx,0,0,1122,1402); if(!d)return;
  const a=m.getImageData(0,0,1122,1402).data;
  for(let i=0;i<d.data.length;i+=4) {
    const r=d.data[i],g=d.data[i+1],b=d.data[i+2];
    if(a[i+3]<250 || d.data[i+3]<100 || r<g*1.24 || g<=b || r<50 || (r-b)/r<.35) continue;
    const hue=60*(g-b)/(r-b);
    const amount=Math.min(1,Math.max(0,(hue-17)/3),Math.max(0,(35-hue)/3));
    if(!amount)continue;
    const light=(r*.3+g*.59+b*.11)/154;
    for(let c=0;c<3;c++){const v=Math.min(255,light<=1?tone[c]*light:tone[c]+(255-tone[c])*Math.min(.7,(light-1)*.75));d.data[i+c]=d.data[i+c]*(1-amount)+v*amount;}
  }
  ctx.putImageData(d,0,0);
}
function key(scene, ch, id, view) {
  if (!id || !rig(id) || !scene.textures.exists(rawKey(id))) return null;
  view = view === 'full' ? 'full' : 'bust';
  const tone=TONES[ch.animeTone] && ['mage','oath','shinobi'].includes(id) ? ch.animeTone : 'original';
  const k=['anime_body_v1',id,tone,view].join('_');
  if(scene.textures.exists(k))return k;
  const master=document.createElement('canvas');master.width=1122;master.height=1402;
  const ctx=master.getContext('2d',{willReadFrequently:true});
  const src=scene.textures.get(rawKey(id)).getSourceImage();
  // Shared head pixels, not another AI-generated identity for every costume.
  if(['mage','oath','shinobi'].includes(id)) {
    ctx.drawImage(src,0,0,1122,1402);
    // Remove the alternate head above the blending strip (including silhouette).
    ctx.clearRect(0,0,1122,350);
    ctx.drawImage(scene.textures.get(rawKey('mage')).getSourceImage(),0,0,1122,350,0,0,1122,350);
    const head=document.createElement('canvas');head.width=1122;head.height=435;
    const hc=head.getContext('2d');hc.drawImage(scene.textures.get(rawKey('mage')).getSourceImage(),0,0);
    hc.globalCompositeOperation='destination-in';const fade=hc.createLinearGradient(0,350,0,435);fade.addColorStop(0,'#fff');fade.addColorStop(1,'transparent');hc.fillStyle=fade;hc.fillRect(0,0,1122,435);
    ctx.drawImage(head,0,350,1122,85,0,350,1122,85);
  } else ctx.drawImage(src,0,0,1122,1402);
  recolor(ctx,id,TONES[tone]);
  if(id==='shinobi') {
    // Face coverings are above the fixed head, below all allowed eye animation.
    path(ctx,[[465,188],[643,188],[654,217],[456,217]]);ctx.fillStyle='#252632';ctx.fill();
    path(ctx,[[461,266],[486,273],[553,257],[618,273],[648,266],[631,317],[556,360],[486,317]]);ctx.fillStyle='#252630';ctx.fill();
    path(ctx,[[553,259],[618,275],[646,269],[629,316],[556,357]]);ctx.fillStyle='#1d1f29';ctx.fill();
    ctx.strokeStyle='#41434e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(555,263);ctx.lineTo(556,351);ctx.stroke();
    path(ctx,[[494,341],[554,366],[615,341],[627,407],[553,432],[490,400]]);ctx.fillStyle='#252630';ctx.fill();
    ctx.strokeStyle='#40404b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(499,373);ctx.quadraticCurveTo(560,415,617,379);ctx.stroke();
  }
  const crop=view==='full'?[0,0,1122,1402] : (rig(id).beast||id==='sentinel'?[0,0,1122,1402]:[205,8,710,904]);
  const w=view==='full'?560:440,h=view==='full'?700:560;
  const tex=scene.textures.createCanvas(k,w,h);tex.getContext().drawImage(master,...crop,0,0,w,h);tex.refresh();
  const meta={id,rig:rig(id),crop,w,h,tone,view};META.set(k,meta);
  P._meta[k]={rig:'anime',masked:!!rig(id).masked,browsCovered:!!rig(id).browsCovered,beast:rig(id).beast?id:null};
  return k;
}
function face(ctx,r,mood,blink,talk,gaze) {
  const angry=['angry','furious','disgust'].includes(mood), sad=['sad','grief','afraid'].includes(mood);
  const happy=['happy','laughing','tender','content','smug'].includes(mood);
  const wide=['surprised','afraid'].includes(mood);
  if(r.beast) {
    if(blink || angry || sad) for(const [x,y]of r.eyes){
      ctx.fillStyle=r.fur;ctx.beginPath();ctx.ellipse(x,y-(blink?0:8),blink?28:26,blink?19:9,0,0,Math.PI*2);ctx.fill();
      if(blink){ctx.strokeStyle='#171820';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-22,y);ctx.quadraticCurveTo(x,y+7,x+22,y);ctx.stroke();}
    }
    return;
  }
  for(let i=0;i<r.eyes.length;i++) {
    const [x,y]=r.eyes[i],sgn=i===0?-1:1,type=r.eyeType||0;
    const ew=(r.eyeW||(r.female?32:28))*[1,.9,1.07,1.05,1][type%5];
    const eh=(wide?(r.eyeH||18)*1.2:angry?(r.eyeH||13)*.62:(r.eyeH||(r.female?13:10)))*[1,1.32,.67,.85,1.08][type%5];
    const tilt=[0,0,1,7,-6][type%5],leftY=y+sgn*tilt,rightY=y-sgn*tilt;
    ctx.strokeStyle='#211b23';ctx.fillStyle='#f4e9dc';ctx.lineWidth=r.female?4:3;
    ctx.beginPath();ctx.moveTo(x-ew,leftY+1);ctx.quadraticCurveTo(x,y-(blink?0:eh*1.7),x+ew,rightY);
    ctx.quadraticCurveTo(x,y+(blink?3:eh),x-ew,leftY+1);ctx.fill();ctx.stroke();
    if(!blink) {
      ctx.save();ctx.clip();const ix=x+gaze*3;
      ctx.fillStyle=r.cloudy?'#c5d4cc':r.iris;ctx.beginPath();ctx.ellipse(ix,y,r.eyeW?eh*.74:10,eh+2,0,0,Math.PI*2);ctx.fill();
      if(!r.cloudy){ctx.fillStyle='#171d24';ctx.beginPath();ctx.ellipse(ix,y-2,r.eyeW?eh*.3:5,eh*.85,0,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff7dc';ctx.beginPath();ctx.arc(ix-4,y-5,3.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d6e7d6';ctx.beginPath();ctx.arc(ix+3,y+5,1.6,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.lineWidth=r.female?5:3;ctx.beginPath();ctx.moveTo(x-ew,leftY);ctx.quadraticCurveTo(x,y-(blink?0:eh*1.7),x+ew,rightY);ctx.stroke();
    if(r.female){ctx.beginPath();ctx.moveTo(x+sgn*ew,y);ctx.lineTo(x+sgn*(ew+7),y-7);ctx.stroke();}
    if(!r.browsCovered){
      const by=r.browOffset||32;
      ctx.lineWidth=r.female?4:6;ctx.beginPath();ctx.moveTo(x-ew+3,y-by+5+(angry?-sgn*5:sad?sgn*6:0));
      ctx.quadraticCurveTo(x,y-by,x+ew-3,y-by+6+(angry?sgn*5:sad?-sgn*6:0));ctx.stroke();
    }
  }
  if(!r.masked && r.mouth) {
    if(r.nose){const[x,y]=r.nose;ctx.strokeStyle='#825038';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-1,y-10);ctx.lineTo(x-4,y+3);ctx.lineTo(x+2,y+5);ctx.stroke();}
    const [x,y]=r.mouth,mt=(r.mouthType||0)%5,mw=[17,21,18,26,20][mt]*(r.mouthScale||1),full=[3,8,6,3,1][mt];ctx.strokeStyle=r.lipColor||'#603839';ctx.lineWidth=2.7;
    if(r.lipColor&&!talk&&!wide){ctx.fillStyle=r.lipColor;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(x-mw,y);ctx.quadraticCurveTo(x-mw*.35,y-full,x,y-(mt===2?1:full*.55));ctx.quadraticCurveTo(x+mw*.4,y-full,x+mw,y);ctx.quadraticCurveTo(x,y+full+3,x-mw,y);ctx.fill();ctx.globalAlpha=1;}
    if(talk || mood==='laughing'||wide){ctx.fillStyle='#542c33';ctx.beginPath();ctx.ellipse(x,y,wide?10:17,talk?4+talk*9:10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f9e5ce';ctx.fillRect(x-10,y-(talk?5:7),20,3);}
    else {ctx.strokeStyle=r.lipColor?'#583b3e':'#603839';ctx.beginPath();ctx.moveTo(x-mw,y);ctx.quadraticCurveTo(x,y+(sad?-7:happy?9:2)+(mt===2?-2:0),x+mw,y);ctx.stroke();}
    if(r.female){ctx.strokeStyle='rgba(185,97,94,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-9,y+7);ctx.quadraticCurveTo(x,y+10,x+9,y+7);ctx.stroke();}
  }
}
function attach(scene,img,ch) {
  if(img.__animeRig)return img.__animeRig;
  const layer=scene.add.container(img.x,img.y);
  if(img.parentContainer)img.parentContainer.add(layer);
  const strips=Array.from({length:24},()=>{const s=scene.add.image(0,0,img.texture.key).setOrigin(0);layer.add(s);return s;});
  const faceKey='anime_face_'+(++serial),ft=scene.textures.createCanvas(faceKey,280,210),fc=ft.getContext();
  const eye=scene.add.image(0,0,faceKey).setOrigin(0);layer.add(eye);
  const originalWebGL=img.renderWebGL,originalCanvas=img.renderCanvas;
  img.renderWebGL=function(...args){if(!META.has(this.texture.key))return originalWebGL.apply(this,args);};
  img.renderCanvas=function(...args){if(!META.has(this.texture.key))return originalCanvas.apply(this,args);};
  const state={mood:'neutral',reaction:null,talkUntil:0,gaze:0,phase:(ch.portraitSeed||1)%5000,spring:0,velocity:0,lastX:img.x,lastY:img.y,lastFace:'',stopped:false};
  function tick(t,dt) {
    if(!img.scene)return;
    const m=META.get(img.texture.key);layer.setVisible(!!m&&img.visible);
    if(!m)return;
    if(img.texture!==scene.textures.get(img.texture.key))img.setTexture(img.texture.key);
    const r=m.rig,scale=m.w/m.crop[2],ys=m.h/m.crop[3];
    layer.setPosition(img.x,img.y).setScale(img.scaleX*(img.flipX?-1:1),img.scaleY*(img.flipY?-1:1)).setRotation(img.rotation).setAlpha(img.alpha).setDepth(img.depth+.001);
    if(img.parentContainer!==layer.parentContainer){
      if(img.parentContainer)img.parentContainer.add(layer);
      else{layer.parentContainer.remove(layer);scene.add.existing(layer);}
    }
    if(img.mask)layer.setMask(img.mask);else if(layer.mask)layer.clearMask(false);
    const enabled=motion.breathing&&!reduced(),s=Math.min(.04,(dt||16)/1000);
    const impulse=(img.y-state.lastY)+(img.x-state.lastX)*.18;state.lastX=img.x;state.lastY=img.y;
    state.velocity+=(-90*state.spring-18*state.velocity)*s+Math.max(-3,Math.min(3,impulse))*1.5;
    state.spring=Math.max(-3,Math.min(3,state.spring+state.velocity*s));
    const breath=enabled&&!r.rigid?Math.sin((t+state.phase)/720)*1.5:0;
    const secondary=enabled&&motion.secondary&&r.female?(r.compliance||0)*(state.spring+Math.sin((t+state.phase)/720-.5)*.35):0;
    const a=(r.chest[0]-m.crop[1])*ys,b=(r.chest[1]-m.crop[1])*ys;
    const wave=y=>y<a||y>b?0:Math.sin(Math.PI*(y-a)/(b-a));
    const warp=y=>y+wave(y)*(breath+secondary);
    const step=m.h/strips.length,ox=img.displayOriginX,oy=img.displayOriginY;
    strips.forEach((sp,i)=>{
      const y=i*step,end=Math.min(m.h,y+step+.5),deform=wave((y+end)/2)*breath*.0008;
      if(sp.texture!==img.texture||!sp.frame?.data)sp.setTexture(img.texture.key);
      sp.setCrop(0,y,m.w,end-y).setPosition(-ox-m.w*deform/2,-oy+warp(y)-y);
      sp.setScale(1+deform,(warp(end)-warp(y))/(end-y));
      // Crop keeps source-space coordinates; compensate only the scaled crop origin.
      sp.y=-oy+warp(y)-y*sp.scaleY;
      if(img.tintFill)sp.setTintFill(img.tintTopLeft ?? 0xffffff);else sp.setTint(img.tintTopLeft ?? 0xffffff);
    });
    const blink=enabled&&((t+state.phase)%4100<105),react=state.reaction&&t<state.reaction.until?state.reaction.mood:state.mood;
    const talking=t<state.talkUntil&&(state.audio?!state.audio.paused&&!state.audio.ended:true);
    const talk=talking?1+Math.floor((Math.sin(t/93)+1)*1.49):0;
    const sig=[m.id,react,blink,talk,state.gaze].join(':');
    const box=r.face;
    eye.setVisible(r.eyes.length>0).setPosition((box[0]-m.crop[0])*scale-ox,(box[1]-m.crop[1])*ys-oy).setDisplaySize(box[2]*scale,box[3]*ys);
    if(img.tintFill)eye.setTintFill(img.tintTopLeft ?? 0xffffff);else eye.setTint(img.tintTopLeft ?? 0xffffff);
    if(sig!==state.lastFace){
      state.lastFace=sig;fc.clearRect(0,0,280,210);if(m.facePatch)fc.drawImage(m.facePatch,0,0,280,210);fc.save();fc.scale(280/box[2],210/box[3]);fc.translate(-box[0],-box[1]);face(fc,r,react,blink,talk,state.gaze);fc.restore();ft.refresh();
    }
  }
  const stop=()=>{
    if(state.stopped)return;state.stopped=true;scene.events.off('update',tick);scene.events.off('shutdown',stop);img.off('destroy',stop);
    img.renderWebGL=originalWebGL;img.renderCanvas=originalCanvas;delete img.__animeRig;
    layer.destroy(true);if(scene.textures.exists(faceKey))scene.textures.remove(faceKey);
  };
  Object.assign(state,{stop,layer,tick});img.__animeRig=state;
  img.once('destroy',stop);scene.events.once('shutdown',stop);scene.events.on('update',tick);tick(scene.time.now,16);return state;
}
const original={};
for(const name of ['key','beastKey','animate','express','react','look','skinState','lipFlap'])original[name]=P[name];
P.key=function(scene,ch){const id=resolve(ch);return id&&key(scene,ch,id)||original.key.call(P,scene,ch);};
P.beastKey=function(scene,ch,beast){return resolve(ch)&&P.BEASTS.includes(beast)&&key(scene,ch,beast)||original.beastKey.call(P,scene,ch,beast);};
for(const name of ['animate','express','react','look','skinState','lipFlap']) P[name]=function(scene,img,ch,k,...args){
  if(!img||!META.has(img.texture.key))return original[name].call(P,scene,img,ch,k,...args);
  const s=attach(scene,img,ch);
  if(name==='express'){s.mood=args[0]||'neutral';img.__expressMood=s.mood;img.__expressK=args[1]??1;}
  if(name==='react')s.reaction={mood:args[0],until:scene.time.now+((args[1]||{}).ms||700)};
  if(name==='look')s.gaze=Math.max(-1,Math.min(1,+args[0]||0));
  if(name==='lipFlap'){s.audio=args[0]||null;s.talkUntil=scene.time.now+((args[1]||{}).ms||4000);return()=>{s.talkUntil=0;};}
  return()=>{};
};
function background(scene,id) {
  const container=scene.add.container(0,0).setDepth(-20);
  const bg=scene.add.image(640,380,rawKey(id)).setDisplaySize(1300,773);container.add(bg);
  const motes=scene.add.graphics();container.add(motes);
  const tick=t=>{
    if(!motion.breathing||reduced())return;
    bg.x=640+Math.sin(t/18000)*5;motes.clear();
    for(let i=0;i<22;i++){
      const x=(i*193+t*(id==='port'?.011:.006))%1320-20,y=170+(i*71)%540+Math.sin(t/1500+i)*12;
      motes.fillStyle(id==='port'?0xf5e6ae:0xaecf9c,.12+.12*Math.sin(t/900+i));motes.fillEllipse(x,y,id==='port'?2:5,2);
    }
    if(id==='port')for(let i=0;i<14;i++){motes.lineStyle(1,0xffe9b8,.11+Math.sin(t/600+i)*.07);const x=800+(i*71)%440,y=525+(i*19)%110;motes.lineBetween(x,y,x+15+Math.sin(t/700+i)*9,y);}
  };
  scene.events.on('update',tick);container.once('destroy',()=>scene.events.off('update',tick));return container;
}
function release(textures) {
  for(const k of textures.getTextureKeys())if(k.startsWith('anime_'))textures.remove(k);
  for(const k of META.keys())delete P._meta[k];META.clear();
}
A.AnimeArt={version:1,ASSETS,RIGS,TONES,motion,load,resolve,key,attach,background,META,original,release,rawKey,paintFace:face};
})();
