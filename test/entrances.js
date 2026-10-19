'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions','entrance_data','entrances'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition,E=X.Entrances,D=X.EntranceData,cast=JSON.parse(fs.readFileSync('../adventurer/tools/voice_casting.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('docs/ENTRANCE_REVIEW_20261019/inventory.json','utf8'));
for(const row of inventory.story.filter(r=>r.unique))assert(D.actors[row.actor],'unique enemy entrance '+row.actor);
for(const p of Object.values(D.actors)){
 if(!p.art)continue;
 const d=JSON.parse(fs.readFileSync('assets/expedition/entrances/'+p.actor+'/'+p.actor+'.json'));
 assert.equal(d.clips.entrance.frames.length,p.frames);assert.equal(d.authoredFacing,-1);
 assert(d.standing>0);assert.equal(d.clips.entrance.durationMs,d.clips.entrance.frameDurationsMs.reduce((a,b)=>a+b,0));
 for(const page of d.textures){assert(fs.existsSync('assets/expedition/entrances/'+p.actor+'/'+page.image));for(const f of page.frames){assert(f.frame.x>=4&&f.frame.y>=4);assert(f.frame.x+f.frame.w<=page.size.w-4&&f.frame.y+f.frame.h<=page.size.h-4);}}
}
const rows=Object.values(D.voices);assert.equal(rows.length,173);
for(const row of rows){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(row.file)).digest('hex'),row.sha256);assert.equal(row.voiceId,cast[row.who],'documented voice '+row.who);}
for(const p of Object.values(D.actors)){
 const own=D.voices['intro_'+p.actor];if(!p.voiceId)assert(!own,p.actor+' stays silent');else assert.equal(own.voiceId,p.voiceId);
 if(p.monsterReaction){const r=rows.filter(r=>r.kind==='reaction'&&r.actor===p.actor);assert.equal(r.length,15);assert.deepEqual(new Set(r.map(r=>r.who)),new Set(Object.keys(X.Story.Companions.kits)));}
}
const scene={story:{record:{chapter:14,encounter:3,entrances:{}}},enc:{def:{ascendant:true}},actors:new Map()};
assert.equal(E.variant(scene,D.actors.story_korvath),'ascendant');assert.equal(E.variant(scene,D.actors.story_nib),'');
scene.story.record.chapter=13;assert.equal(E.variant(scene,D.actors.story_gorruk),'return');
const ally={side:'a',alive:true,unit:{chp:30,ch:{expeditionStoryCompanion:'cassian'}}};scene.actors.set('a',ally);
assert.equal(E.reactions(scene,D.actors.alpha).length,1);assert.equal(E.reactions(scene,D.actors.story_grukhar).length,0);
ally.unit.chp=0;assert.equal(E.reactions(scene,D.actors.alpha).length,0);ally.unit.chp=30;ally.alive=false;assert.equal(E.reactions(scene,D.actors.alpha).length,0);
let saves=0;X.Story.save=()=>saves++;E.mark(scene,D.actors.story_gorruk);assert.equal(saves,1);assert(E.seen(scene)['story_gorruk:return']);scene.__entranceReview=true;E.mark(scene,D.actors.alpha);assert.equal(saves,1);
assert.deepEqual(E.seen({opts:{run:{entrances:{wolf:true}}},run:{entrances:{alpha:true}}},true),{wolf:true},'preload uses incoming run');
assert.deepEqual(E.seen({opts:{fresh:true},run:{entrances:{wolf:true}}},true),{},'Start over loads fresh entrance art');
console.log('PASS: 57 entrance contracts, 173 verified recordings, 15 companions per monster, silence/eligibility/persistence/rematches');
