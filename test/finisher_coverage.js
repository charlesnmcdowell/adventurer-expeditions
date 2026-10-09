'use strict';
// New shipped actors must have BOTH directions of authored paired animation.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),A=require('./harness').load();
vm.runInThisContext(fs.readFileSync(path.join(root,'js/expedition/data.js'),'utf8'));
const X=A.Expedition;X.UI=X.UI||{};
vm.runInThisContext(fs.readFileSync(path.join(root,'js/expedition/painted.js'),'utf8'));
function read(actor,adult=false){const base=path.join(root,'assets/expedition',adult?'adult/'+actor+'-fatal':actor),name=adult?actor+'-fatal':actor;
 const d=JSON.parse(fs.readFileSync(path.join(base,name+'.json'),'utf8'));
 for(const t of d.textures)assert(fs.existsSync(path.join(base,t.image)),name+' missing page '+t.image);
 return d;}
function valid(d,c,label){assert(c.paired,label+' must embed both actors');assert(c.frames.length>1,label+' needs animation');
 assert.equal(c.frameDurationsMs.length,c.frames.length,label+' timings');
 for(const frame of c.frames)assert(d.frames[frame],label+' missing '+frame);
 assert(c.contact.length,label+' contact marker');}
const hero=read('hiro');
const probe={Release:{target:'website'},Expedition:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/expedition/enemy_finishers.js'),'utf8'),{ADV:probe});
for(const actor of X.shipped.actors.filter(a=>!['hiro','bram'].includes(a))){
 const d=['wolf','plant'].includes(actor)?hero:read(actor),owner=['wolf','plant'].includes(actor)?'hiro':actor;
 const choices=Object.entries(d.clips).filter(([name,c])=>c.paired&&!name.startsWith('bite-')&&!(X.Painted.retiredFinishers[owner]||[]).includes(name)&&
  (['wolf','plant'].includes(actor)?(c.opponentKinds||[]).includes(actor):name.startsWith('hiro-')));
 assert(choices.length,actor+' has no active Hiro finisher');for(const [name,c] of choices)valid(d,c,actor+'/'+name);
 const fatal=read(actor,true);assert(fatal.clips[actor+'-fatal'],actor+' lacks an enemy finisher');valid(fatal,fatal.clips[actor+'-fatal'],actor+'-fatal');
 const queued=[];probe.Expedition.EnemyFinishers.preload({textures:{exists:()=>false},cache:{json:{exists:()=>false}},load:{multiatlas:(...v)=>queued.push(v),json:(...v)=>queued.push(v)}},[actor]);
 assert.equal(queued.length,2,actor+' is missing from enemy-finisher loader registration');
 console.log(actor+': '+choices.length+' Hiro finisher(s), enemy defeat present');
}
console.log('finisher_coverage: both directions covered for every shipped enemy');
