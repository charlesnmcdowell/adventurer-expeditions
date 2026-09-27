'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),ids=['alpha','serpent','beetle','moss_giant','hag','goblin','spider','orc'];
const X={UI:{},monsterActors:ids.slice(1)};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/expedition/painted.js'),'utf8'),{ADV:{Expedition:X}});
let checked=0;
for(const id of ids){
 const j=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/expedition',id,id+'.json'),'utf8')),before=JSON.stringify(j);
 const s=X.Painted.sheet({cache:{json:{get:()=>j}},textures:{exists:()=>true}},id);
 for(const [name,c]of Object.entries(j.clips)){
  if(!c.paired||!name.startsWith('hiro-')){assert.equal(s.clips[name],c);continue;}
  const next=s.clips[name];assert.equal(next.frames,c.frames);assert.equal(next.contact,c.contact);assert.equal(next.release,c.release);
  assert.equal(next.durationMs,next.frameDurationsMs.reduce((a,b)=>a+b,0));assert(next.durationMs>=1400&&next.durationMs<=1700);assert(next.durationMs>c.durationMs);
  assert(next.frameDurationsMs[0]>=240);assert(next.frameDurationsMs.at(-1)>=300);checked++;
 }
 assert.equal(JSON.stringify(j),before,'pacing must not mutate cached/source metadata');
}
assert.equal(checked,17);console.log('finisher_pacing: 17 finishers retain frames/contact markers and gain readable holds');
