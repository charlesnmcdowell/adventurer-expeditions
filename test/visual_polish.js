'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{EventEmitter}=require('events');
const context={ADV:{Release:{target:'website'},Expedition:{}}};
vm.runInNewContext(fs.readFileSync('js/expedition/gore_fx.js','utf8'),context);
const G=context.ADV.Expedition.HumanoidGore,events=new EventEmitter();
let loads=0,destroyed=0,position;
const image={setOrigin(){return this;},setDisplaySize(){return this;},setDepth(){return this;},setFrame(){return this;},setAlpha(){return this;},destroy(){destroyed++;}};
const scene={events,time:{paused:false,timeScale:1},textures:{exists:()=>true},load:{spritesheet(){loads++;}},add:{image(x,y){position=[x,y];return image;}}};
const hero={x:500,y:612,height:300,facing:1,root:{depth:120}},target={x:1200,y:612,height:300,sheet:{actor:'elven_ranger'}};
const sheet={standing:300,clips:{'hiro-finisher-1':{}}};
const stop=G.play(scene,hero,target,sheet,'hiro-finisher-1');
assert.deepEqual(position,[565,407],'blood must use the painted contact, not the separate enemy position');
assert.equal(events.listenerCount('update'),1);scene.paused=true;events.emit('update',0,2000);assert.equal(destroyed,0,'pause freezes blood');
stop();stop();assert.equal(destroyed,1);assert.equal(events.listenerCount('update'),0);assert.equal(events.listenerCount('shutdown'),0);
position=null;sheet.clips['hiro-finisher-1'].embeddedBlood=true;
G.play(scene,hero,target,sheet,'hiro-finisher-1');assert.equal(position,null,'painted blood must not receive a second unrelated overlay');
delete sheet.clips['hiro-finisher-1'].embeddedBlood;
context.ADV.Release.target='crazygames';position=null;
G.preload(scene,['elven_ranger']);G.play(scene,hero,target,sheet,'hiro-finisher-1');assert.equal(loads,0);assert.equal(position,null);
for(const id of ['forest-carriage-vault','swamp-log-slide','city-market-vault','city-rooftop-run','coast-mast-vault','citadel-bridge-leap']){
 const d=JSON.parse(fs.readFileSync('assets/expedition/travel/'+id+'/scene.json'));assert(d.layeredPlate,id+' opaque action would hide distance layers');
 assert(d.frames.every(f=>f.ms>0&&Number.isFinite(f.cameraX)));
 if(id==='coast-mast-vault')assert.equal(d.travelKind,'hang-glide');
 if(id==='citadel-bridge-leap'){assert.equal(d.travelKind,'portal-jutsu');assert.equal(d.teleportAfterFrame,5);}
}
for(const id of ['crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress']){
 const d=JSON.parse(fs.readFileSync('assets/expedition/'+id+'/'+id+'.json'));
 for(const c of Object.values(d.clips).filter(c=>c.paired)){
  assert(c.preserveTiming,id+' authored holds must survive loading');assert(c.contact.includes(c.primaryImpactFrame));
  assert(c.durationMs>=1200&&c.durationMs<(c.frames.length===16?2600:1800),id+' finisher readability');
 }
}
for(const id of ['elven_wizard','elven_ranger','dark_swordswoman','enchantress']){
 const d=JSON.parse(fs.readFileSync('assets/expedition/'+id+'/'+id+'.json'));
 for(const name of ['hiro-finisher-1','hiro-finisher-2']){
  const c=d.clips[name];assert.equal(c.frames.length,16,id+' replacement needs sixteen authored poses');
  assert(c.durationMs>=2300&&c.durationMs<=2500,id+' extra frames need readable time');
  assert.equal(new Set(c.sourceRegistration.referenceHeights).size,1,id+' must not resize the body in each pose');
  assert.equal(c.embeddedBlood,true);assert.equal(c.sourceRevision,'v7-complete-replacement');
 }
}
console.log('visual_polish: registered blood contact, pause/cleanup, profile gate, six layered travels, sixteen authored finishers pass');
