'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_presentation','enemy_finishers','painted','story_art','story_effects']){if(n==='painted')A.Expedition.UI={};vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));}
const X=A.Expedition,S=X.Story,F=X.StoryEffects,units=JSON.parse(fs.readFileSync('docs/art/chapter-6-14-roster.json'));
let pairs=0;for(const u of units){
 const b=S.bindings[u.identity];assert(b?.combatReady,u.identity);assert.equal(b.hiroFinishersReady,2);assert(b.enemyFinisherReady);
 for(const [aid,base]of [[b.actor,'assets/expedition/'+b.actor],[b.actor+'-fatal','assets/expedition/adult/'+b.actor+'-fatal']]){
  const d=JSON.parse(fs.readFileSync(base+'/'+aid+'.json'));
  for(const t of d.textures)assert(fs.existsSync(base+'/'+t.image));
  for(const [id,c]of Object.entries(d.clips)){
   for(const f of c.frames)assert(d.frames[f],aid+'/'+f);
   if(c.releaseAnchor){assert(c.release>=0&&c.release<c.frames.length);assert(c.releaseAnchor.x>=0&&c.releaseAnchor.x<=d.canvas.w);assert(c.releaseAnchor.y>=0&&c.releaseAnchor.y<=d.canvas.h);}
   if(c.paired){pairs++;assert.equal(c.frames.length,16);assert.equal(new Set(c.sources).size,16);assert.equal(c.sourceRegistration.referenceHeights.length,16);assert(c.embeddedBlood);assert(c.preserveTiming);}
  }
 }
}
assert.equal(pairs,111);
for(const actor of ['story_thornwise','story_nettle','story_amara','story_korvath']){
 const d=JSON.parse(fs.readFileSync('assets/expedition/'+actor+'/'+actor+'.json'));
 for(const c of Object.values(d.clips).filter(c=>c.paired))assert(c.nonlethal&&c.finalState==='opponent-survives',actor+' must survive authored story branch');
}
S.Presentation.configure(JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json')));
const skills=new Set();for(const q of A.DATA.CAMPAIGN3_QUESTS)for(let i=0;i<q.enc.length;i++)for(const flag of [null,...Object.keys(q.enc[i].variants||{})]){
 const s=S.open();Object.assign(s.record,{chapter:q.n,encounter:i,phase:'combat'});S.syncQuest(s);if(flag)A.Campaign3.setFlag(s.game,flag);
 assert.deepEqual(S.readiness(s),[],'all combat identities must resolve');
 for(const ch of S.Combat.spawn(s))for(const entry of ch.actives){
  const sk=A.DATA.SKILLS[entry.skillId];if(!sk)continue;
  const ranged=sk.elemental||(sk.reach==='any'&&!sk.melee&&!sk.katana&&sk.target&&sk.target!=='self');
  if(ranged){assert(F.supports(entry.skillId),'painted effect for '+ch.name+'/'+entry.skillId);skills.add(entry.skillId);}
 }
}
for(const c of Object.values(F.catalog)){
 const m=JSON.parse(fs.readFileSync('assets/expedition/story/effects/'+c.group+'.json'));
 assert(fs.existsSync('assets/expedition/story/effects/'+m.image));assert(c.start>=0&&c.start+3<16);
}
console.log('37 new actors, 111 sixteen-drawing pairs, story-survival branches, all 59 identities and '+skills.size+' ranged/summon/ward skills have painted art.');
