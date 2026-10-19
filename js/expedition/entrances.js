// First-appearance introductions. Presentation only: no attacks, status rolls
// or party recruitment. Original campaign dialogue and outcomes stay intact.
(function(){
'use strict';const A=ADV,X=A.Expedition;
const E=X.Entrances={version:1};
const plan=()=>X.EntranceData?.actors||{};
E.definition=a=>plan()[a?.sheet?.actor||a?.sheet?.id];
E.variant=(s,p)=>p.actor==='story_korvath'&&s.story?.record.chapter===14&&s.enc?.def?.ascendant?'ascendant':
  p.actor==='story_korvath'&&s.story?.record.chapter===14&&s.story.record.encounter===3?'ascendant':
  ['story_gorruk','story_amara'].includes(p.actor)&&s.story?.record.chapter===13?'return':'';
E.key=(s,p)=>p.actor+(E.variant(s,p)?':'+E.variant(s,p):'');
E.seen=(s,preload=false)=>s.__entranceReview?(s.__entranceSeen||={}):
  preload&&s.opts?.fresh?{}:((s.story?.record||(preload?s.opts?.record||s.opts?.run:null)||s.run||{}).entrances||{});
E.mark=(s,p)=>{
 if(s.__entranceReview)return;
 const record=s.story?.record||s.run;if(!record)return;
 (record.entrances||={})[E.key(s,p)]=true;
 if(s.story)X.Story.save(s.story);else X.Run.save(s.run);
};
E.preload=(s,ids)=>{
 // Discard only this feature's previous encounter art. Story battles do not
 // run the Arcade memory trimmer, so own the extra atlas lifecycle here.
 for(const key of s.textures.getTextureKeys())if(key.startsWith('xp_entry_')&&!ids.includes(key.slice(9)))s.textures.remove(key);
 for(const id of ids){
  const p=plan()[id];if(!p?.art||E.seen(s,true)[E.key(s,p)])continue;
  const key='xp_entry_'+id,base='assets/expedition/entrances/'+id+'/';
  if(!s.textures.exists(key))s.load.multiatlas(key,base+id+'.json?v=entrances-20261019',base);
  if(!s.cache.json.exists(key+'_clips'))s.load.json(key+'_clips',base+id+'.json?v=entrances-20261019');
 }
};
E.voice=(s,p)=>{
 const key='intro_'+p.actor+(E.variant(s,p)?'_'+E.variant(s,p):'');
 return X.EntranceData?.voices[key]||X.EntranceData?.voices['intro_'+p.actor]||null;
};
E.reactions=(s,p)=>{
 if(!p.monsterReaction||E.voice(s,p))return [];
 return [...(s.actors?.values()||[])].filter(a=>a.side==='a'&&a.alive&&!a._destroyed&&a.unit?.chp>0)
  .map(a=>X.EntranceData?.voices['react_'+p.actor+'_'+a.unit?.ch?.expeditionStoryCompanion]).filter(Boolean);
};
// Native story voice follows the story Sound control, like its existing music.
// A suspended WebAudio context can report the OLD gain after its mute setter;
// that must not silently suppress an independently playable HTMLAudio line.
const muted=s=>typeof s.opts?.muted==='boolean'?s.opts.muted:!!(A.Music?.muted||s.game?.sound?.mute);
const blocked=s=>s.paused||s.time?.paused||s.__paintedHitStopCount>0;
// Every wait resolves on scene exit, including paused exits and review replay.
function clock(s,ms,draw,cleanup,token){
 return new Promise(resolve=>{
  let elapsed=0,done=false;
  const finish=ok=>{if(done)return;done=true;s.events.off('update',tick);s.events.off('shutdown',stop);cleanup?.();resolve(ok);};
  const stop=()=>finish(false);
  const tick=(time,dt)=>{
   if(s.ended||token?.cancelled){finish(false);return;}
   if(blocked(s))return;
   elapsed+=Math.min(60,Math.max(0,dt))*(s.time?.timeScale??1);
   draw?.(Math.min(1,elapsed/ms),elapsed);
   if(elapsed>=ms)finish(true);
  };
  s.events.on('update',tick);s.events.once('shutdown',stop);draw?.(0,0);
 });
}
E.cancel=s=>{if(s.__entranceToken)s.__entranceToken.cancelled=true;};
function text(s,value,y,size,color){
 const t=s.add.text(640,y,value,{fontFamily:'Georgia',fontSize:size,color,stroke:'#080b15',strokeThickness:5,align:'center',wordWrap:{width:1060}}).setOrigin(.5,0).setDepth(X.UI.DEPTH.hand+15);
 if(s.hudCam)s.cameras.main.ignore(t);return t;
}
E.say=async(s,row,token)=>{
 if(!row||s.ended||token?.cancelled)return false;
 s.stopBanter?.();const caption=text(s,row.name+': '+row.text,142,24,'#ffffff');
 const music=s.music,volume=music?.volume;if(music)music.volume=Math.min(volume,.065);
 let audio=null,ended=false,failed=false,started=false,paused=false;
 s.__entranceSpeech={id:row.id,muted:muted(s)};
 if(!muted(s)){
  audio=new Audio(row.file);audio.volume=.9;audio.onended=()=>{ended=true;};audio.onerror=()=>{failed=true;};
  s.__entranceAudio=audio;
  audio.play().then(()=>{started=true;}).catch(()=>{failed=true;});
 }
 const fallback=Math.max(1900,Math.min(4800,row.text.length*48));let elapsed=0;
 try{
  while(!s.ended&&!token?.cancelled){
   if(s.paused||s.time?.paused){if(audio&&!paused){audio.pause();paused=true;}}
   if(audio&&muted(s)){audio.pause();failed=true;}
   if(audio&&paused&&!blocked(s)&&!muted(s)){paused=false;audio.play().catch(()=>{failed=true;});}
   // The ticker owns sound pause even when the game-clock is suspended.
   const ok=await new Promise(resolve=>{
    const stop=()=>{s.events.off('update',tick);s.events.off('shutdown',stop);resolve(false);};
    const tick=(time,dt)=>{
     if(s.ended||token?.cancelled){stop();return;}
     if(audio){if(blocked(s)&&!paused){audio.pause();paused=true;}else if(!blocked(s)&&paused&&!muted(s)){paused=false;audio.play().catch(()=>{failed=true;});}if(muted(s)){audio.pause();failed=true;}}
     if(blocked(s))return;
     elapsed+=Math.min(dt,60)*(s.time?.timeScale??1);
     if(ended||((!audio||failed||!started&&elapsed>1200)&&elapsed>=fallback)||elapsed>10000){s.events.off('update',tick);s.events.off('shutdown',stop);resolve(true);}
    };s.events.on('update',tick);s.events.once('shutdown',stop);
   });return ok;
  }
  return false;
 }finally{if(audio){audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}delete s.__entranceAudio;delete s.__entranceSpeech;caption.destroy();if(music&&volume!==undefined)music.volume=volume;}
};
function drawing(s,a,p){
 const key='xp_entry_'+p.actor,d=s.cache.json.get(key+'_clips');
 if(p.art&&d&&s.textures.exists(key))return {key,canvas:d.canvas,standing:d.standing,clip:d.clips.entrance};
 if(p.art)throw Error('Entrance artwork did not load: '+p.actor);
 const sheet=a.sheet,clips=sheet.clips;
 if(p.actor==='story_grell')return {key:sheet.key,canvas:sheet.canvas,standing:sheet.standing,clip:clips.entrance,flip:a._baseScaleX<0};
 const id=['enrage','cast','attack','lash','bite','idle'].find(id=>clips[id]&&!clips[id].paired);
 const c=clips[id],idle=clips.idle;
 return {key:sheet.key,canvas:sheet.canvas,standing:sheet.standing,flip:a._baseScaleX<0,clip:{frames:[...idle.frames.slice(0,2),...c.frames,...idle.frames.slice(0,1)],durationMs:1800}};
}
E.animate=async(s,a,p,token)=>{
 if(s.ended||a._destroyed)return false;
 const d=drawing(s,a,p),c=d.clip,home={...a.home},original={img:a.img.visible,plate:a.plate.visible,shadow:a.shadow.alpha};
 a.cancelPlayback();a.img.setVisible(false);a.plate.setVisible(false);a.root.setPosition(home.x,home.y);a.syncPerspective();
 const sprite=s.add.image(0,0,d.key,c.frames[0]).setOrigin(d.canvas.pivot.x/d.canvas.w,d.canvas.pivot.y/d.canvas.h).setScale(a.height/d.standing).setName('entrance_'+p.actor);
 a.root.add(sprite);
 const web=p.motion==='web'?s.add.graphics().setDepth(a.root.depth-1).setName('entrance_web'):null;
 const duration=c.durationMs||1800,times=c.frameDurationsMs||c.frames.map(()=>duration/c.frames.length);
 const airborne=['web','fly'].includes(p.motion),run=p.motion==='run',burrow=p.motion==='burrow';
 const entryMs=airborne||run?0:620;
 const walk=a.sheet.clips.approach||a.sheet.clips.run||a.sheet.clips.walk||a.sheet.clips.idle;
 let frame=0;
 const oldRootAlpha=a.root.alpha;
 try{
  return await clock(s,duration+entryMs,(t,ms)=>{
   if(a._destroyed){token.cancelled=true;return;}
   const poseMs=Math.max(0,ms-entryMs);let sum=0;frame=c.frames.length-1;
   for(let i=0;i<times.length;i++){sum+=times[i];if(poseMs<sum){frame=i;break;}}
   if(entryMs&&ms<entryMs){
    const canvas=a.sheet.canvas;
    sprite.setTexture(a.sheet.key,walk.frames[Math.floor(ms/90)%walk.frames.length]).setOrigin(canvas.pivot.x/canvas.w,canvas.pivot.y/canvas.h).setScale(a._baseScaleX,a._baseScaleY);
   }else sprite.setTexture(d.key,c.frames[frame]).setOrigin(d.canvas.pivot.x/d.canvas.w,d.canvas.pivot.y/d.canvas.h).setScale((d.flip?-1:1)*a.height/d.standing,a.height/d.standing);
   const lead=airborne ? .56 : run ? .34 : entryMs/(duration+entryMs),u=Math.min(1,t/lead),ease=u*u*(3-2*u);
   const fromX=1280+a.height*(p.motion==='fly'?.25:.65);
   a.root.x=p.motion==='web'||burrow?home.x:fromX+(home.x-fromX)*ease;
   a.root.y=home.y;a.syncPerspective();
   sprite.y=airborne?-(p.motion==='fly'?Math.min(360,home.y*.55):home.y+80)*(1-ease):p.motion==='hop'?-Math.sin(u*Math.PI)*110:0;
   sprite.alpha=burrow?ease:1;
   a.shadow.alpha=original.shadow*(airborne?(.08+.92*ease):1);
   if(['shadow','portal','ritual'].includes(p.motion))a.root.alpha=oldRootAlpha*Math.min(1,.25+u*.75);
   if(web){
    const bottom=a.root.y+(sprite.y-a.height*.66)*a.root.scaleY;
    web.clear();if(u<.97)web.lineStyle(2,0xcfdde8,.8).beginPath().moveTo(home.x,0).lineTo(home.x,bottom).strokePath();
   }
   s.__entranceFrame={actor:p.actor,frame,elapsed:ms,ground:home.y,lift:sprite.y};
  },()=>{
   sprite.destroy();web?.destroy();
   if(!a._destroyed){a.root.setPosition(home.x,home.y).setAlpha(oldRootAlpha);a.img.setVisible(original.img);a.plate.setVisible(original.plate);a.shadow.alpha=original.shadow;a.syncPerspective();a.idle();}
   delete s.__entranceFrame;
  },token);
 }finally{X.UI.resetCamera(s);}
};
E.present=async(s,a,{force=false,companion=null,group=null,token=null}={})=>{
 const p=E.definition(a);if(!p)return false;
 if(!force&&E.seen(s)[E.key(s,p)])return false;
 token=token||{cancelled:false};s.__entranceToken=token;
 const title=text(s,p.name,102,30,'#f0d18a');
 try{
  const ok=(await Promise.all((group||[a]).map(actor=>E.animate(s,actor,p,token)))).every(Boolean);
  if(!ok||s.ended||token.cancelled)return false;
  const own=E.voice(s,p);
  if(own){if(!await E.say(s,own,token))return false;}
  else{
   const reactions=E.reactions(s,p);
   const row=companion?reactions.find(r=>r.who===companion):reactions[(s.story?.record.encounter||s.run?.wave||0)%Math.max(1,reactions.length)];
   if(row&&!await E.say(s,row,token))return false;
  }
  E.mark(s,p);return true;
 }finally{title.destroy();if(s.__entranceToken===token)s.__entranceToken=null;X.UI.resetCamera(s);}
};
E.begin=async(s,first)=>{
 const foes=[...s.actors.values()].filter(a=>a.side==='b'),groups=new Map(),ordinary=[];
 for(const a of foes){const p=E.definition(a);if(!p||E.seen(s)[E.key(s,p)])ordinary.push(a);else{const group=groups.get(p.actor)||[];group.push(a);groups.set(p.actor,group);}}
 // No turn resolves before every arrival/voice finishes. Player taps may queue
 // a skill, but cannot interrupt the intro or grant free attacks.
 s.__entranceActive=true;const token={cancelled:false};s.__entranceToken=token;
 try{
  if(s.enc?.def?.ambush){
   A.VFX.flashOverlay(s,0xc0392b,.35);s.cameras.main.shake(260,.006);
   const rival=X.Campaign.rival(s.enc.def.rival);s.hud?.banner('Ambush!  '+(rival?rival.name:''),1500);
  }else if(first&&s.quest?.title)s.hud?.banner(s.quest.title,1200);
  await Promise.all([s.hero.play(first?'draw':'short_draw'),...ordinary.map(a=>a.play('enter',{from:a.root.x,duration:600}))]);
  for(const group of groups.values()){
   if(s.ended||token.cancelled)return;
   await E.present(s,group[0],{group,token});
  }
 }finally{s.__entranceActive=false;if(s.__entranceToken===token)s.__entranceToken=null;X.UI.resetCamera(s);}
};
})();
