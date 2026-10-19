'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),{EventEmitter}=require('events');
global.ADV={Expedition:{}};vm.runInThisContext(fs.readFileSync('js/expedition/story_effects.js','utf8'));const F=ADV.Expedition.StoryEffects;
function fixture(){const sprites=[],events=new EventEmitter();return {sprites,events,time:{paused:false,timeScale:1,now:0},textures:{exists:()=>true},add:{image(x,y,key,frame){const s={x,y,key,frame,dead:false,setDepth(){return this;},setDisplaySize(w,h){this.w=w;this.h=h;return this;},setName(){return this;},setRotation(r){this.r=r;return this;},setFrame(f){this.frame=f;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setAlpha(a){this.alpha=a;return this;},destroy(){this.dead=true;}};sprites.push(s);return s;}}};}
(async()=>{
 for(const id of Object.keys(F.catalog)){
  const s=fixture(),p=F.play(s,id,{x:500,y:250},{x:200,y:280},{height:300});const sprite=s.sprites[0];
  s.paused=true;s.events.emit('update',0,50);assert.equal(sprite.frame,F.catalog[id].start);s.paused=false;
  s.__paintedHitStopCount=1;s.events.emit('update',0,50);assert.equal(sprite.frame,F.catalog[id].start);s.__paintedHitStopCount=0;
  for(let i=0;i<20;i++)s.events.emit('update',i*50,50);await p;assert(sprite.dead);assert.equal(s.events.listenerCount('update'),0);
  const cancel=F.play(s,id,{x:200,y:280},{x:500,y:250},{reflected:true});const bounced=s.sprites.at(-1);s.events.emit('update',0,50);assert(bounced.x>200&&bounced.x<500);s.events.emit('shutdown');await cancel;assert(bounced.dead);assert.equal(s.events.listenerCount('update'),0);
 }
 const loads=[];F.preload({textures:{exists:key=>key==='story_chapter_one_effects'},load:{json:(k,url)=>loads.push(url),once(){}}});assert.equal(loads.length,8,'cached opening atlas must not suppress later atlases or reflected shots');
 for(const id of ['fire_bolt','prismatic_bolt','aimed_shot','marked_for_the_knife']){
  const s=fixture(),p=F.play(s,id,{x:200,y:200},{x:500,y:200},{reflected:true});
  assert.equal(s.sprites[0].key,'story_effects_reflected');assert.equal(s.sprites[0].r,0,'right-facing painted shot follows its actual return direction');
  s.events.emit('shutdown');await p;
 }
 for(const id of ['whisper_of_ending','shield_wall','cleanse','thorn_skin']){
  if(id!=='thorn_skin')assert(!F.supports(id),'companion additions must not change enemy mappings');assert(F.supports(id,{companion:true}));
  const s=fixture(),p=F.play(s,id,{x:200,y:200},{x:500,y:230},{companion:true,height:220});
  const sprite=s.sprites[0];assert.equal(sprite.key,'story_effects_companion-support');
  const stationary=['shield_wall','thorn_skin'].includes(id);assert.equal(sprite.x,stationary?500:200);
  s.paused=true;s.events.emit('update',0,50);assert.equal(sprite.x,stationary?500:200);s.paused=false;
  for(let i=0;i<20;i++)s.events.emit('update',i*50,50);await p;assert(sprite.dead);assert.equal(s.events.listenerCount('update'),0);
 }
 ADV.Expedition.Story={Companions:{enabled:true}};const partyLoads=[];
 for(const id of ['mend','regenerate','defiant_stand','counter_attack']){
  assert(F.supports(id,{companion:true}));
  const s=fixture(),p=F.play(s,id,{x:200,y:200},{x:500,y:230},{companion:true});
  assert.equal(s.sprites[0].key,'story_effects_companion-recovery');assert.equal(s.sprites[0].x,500);
  s.events.emit('shutdown');await p;assert(s.sprites[0].dead);
 }
 F.preload({textures:{exists:()=>false},load:{json:(key,url)=>partyLoads.push(url),once(){}}});
 assert(partyLoads.includes('assets/expedition/story/effects/companion-support.json'));
 assert(partyLoads.includes('assets/expedition/story/effects/companion-recovery.json'));
 // Enhanced casts own every aura, trail and contact burst through interruptions.
 for(const id of ['fire_bolt','frost_touch','thorn_lash','whisper_of_ending','spark','mend']){
  const s=fixture(),actor={x:200,y:500,height:300,perspectiveAt:()=>1,releasePoint:()=>({x:260,y:300})};
  const clip={frames:Array(16),release:7,durationMs:1280};
  const stop=F.charge(s,id,actor,clip,{companion:true});assert.equal(s.sprites.length,6);
  s.events.emit('update',0,50);const a=s.sprites.map(s=>[s.x,s.y,s.w,s.alpha]);
  s.paused=true;s.events.emit('update',0,50);assert.deepEqual(s.sprites.map(s=>[s.x,s.y,s.w,s.alpha]),a);s.paused=false;
  s.__paintedHitStopCount=1;s.events.emit('update',0,50);assert.deepEqual(s.sprites.map(s=>[s.x,s.y,s.w,s.alpha]),a);s.__paintedHitStopCount=0;
  stop();stop();assert(s.sprites.every(s=>s.dead));assert.equal(s.events.listenerCount('update'),0);
  F.charge(s,id,actor,clip,{companion:true});s.events.emit('shutdown');assert(s.sprites.every(s=>s.dead));assert.equal(s.events.listenerCount('update'),0);
  const p=F.play(s,id,{x:260,y:300},{x:650,y:300},{height:300,cinematic:true,companion:true});
  for(let i=0;i<22;i++)s.events.emit('update',i*50,50);await p;
  assert(s.sprites.every(s=>s.dead),'all flight/impact sprites cleared: '+id);assert.equal(s.events.listenerCount('update'),0);
  const p2=F.play(s,id,{x:260,y:300},{x:650,y:300},{height:300,cinematic:true,companion:true});
  s.ended=true;s.events.emit('update',0,50);await p2;
  assert(s.sprites.every(s=>s.dead));assert.equal(s.events.listenerCount('shutdown'),0);
 }
 for(const cancel of [false,true]){
  const s=fixture(),p=F.skyVolley(s,{x:200,y:300},{x:800,y:350},300);
  assert.equal(s.sprites.length,101,'one launch arrow and one hundred falling arrows');
  s.events.emit('update',0,400);const positions=s.sprites.map(s=>[s.x,s.y,s.alpha]);
  s.paused=true;s.events.emit('update',0,50);assert.deepEqual(s.sprites.map(s=>[s.x,s.y,s.alpha]),positions);s.paused=false;
  s.__paintedHitStopCount=1;s.events.emit('update',0,50);assert.deepEqual(s.sprites.map(s=>[s.x,s.y,s.alpha]),positions);s.__paintedHitStopCount=0;
  if(cancel)s.events.emit('shutdown');else for(let i=0;i<40;i++)s.events.emit('update',0,50);
  await p;assert(s.sprites.every(s=>s.dead));assert.equal(s.events.listenerCount('update'),0);assert.equal(s.events.listenerCount('shutdown'),0);
 }
 console.log('Painted effects: all mappings and sky volley pause, hit-stop, reflected flight, completion and shutdown cleanup pass.');
})().catch(e=>{console.error(e);process.exitCode=1;});
