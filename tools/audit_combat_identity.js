'use strict';
// Enumerate every campaign branch, including optional named opponents.
const fs=require('fs'),vm=require('vm');
const A=require('../test/harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions','story_effects'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition,S=X.Story;X.Painted={actors:[]};X.EnemyFinishers={registerActor(){}};
vm.runInThisContext(fs.readFileSync('js/expedition/story_art.js','utf8'));
const roster=new Map();
for(const q of A.DATA.CAMPAIGN3_QUESTS)for(let i=0;i<q.enc.length;i++)for(const flag of [null,...Object.keys(q.enc[i].variants||{})]){
 const s=S.open();Object.assign(s.record,{chapter:q.n,encounter:i,phase:'combat'});
 if(flag)A.Campaign3.setFlag(s.game,flag);S.syncQuest(s);
 for(const ch of S.Combat.spawn(s)){
  const id=ch.storyOpponent,b=S.bindings[id];if(!b)throw Error(id);
  let r=roster.get(id);if(!r){r={id,name:ch.name,actor:b.actor,humanoid:!!b.humanoid,appearances:[],skills:{}};roster.set(id,r);}
  r.appearances.push({chapter:q.n,encounter:i,flag});
  for(const e of [{skillId:'basic_attack',level:1},...ch.actives])r.skills[e.skillId]=A.SkillSys.manifest(ch,e).data;
 }
}
for(const actor of X.shipped.actors.filter(id=>id!=='hiro')){
 const match=Object.entries(X.enemies).find(([id,e])=>(e.artActor||e.kind)===actor&&e.base);
 if(!match)throw Error('No Arcade identity '+actor);
 const [key,e]=match,ch=X.Encounter.makeEnemy(new A.RNG(1),key,1),r={id:'arcade:'+key,arcade:key,name:ch.name,actor,height:e.height,appearances:[],skills:{}};
 for(const entry of [{skillId:'basic_attack',level:1},...ch.actives])r.skills[entry.skillId]=A.SkillSys.manifest(ch,entry).data;
 roster.set(r.id,r);
}
fs.mkdirSync('test/reports/combat-identity',{recursive:true});
fs.writeFileSync('test/reports/combat-identity/inventory.json',JSON.stringify([...roster.values()],null,2));
for(const r of roster.values())console.log(r.id+' | '+r.name+' | '+r.actor+' | '+Object.keys(r.skills).join(', '));
console.log('TOTAL',roster.size);
