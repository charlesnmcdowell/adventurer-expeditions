'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const A=require('./harness').load(),root=path.resolve(__dirname,'..');
for(const f of ['data','shim','encounter','campaign'])vm.runInThisContext(fs.readFileSync(path.join(root,'js/expedition/'+f+'.js'),'utf8'));
const X=A.Expedition,E=X.Encounter,report=[];
let clock=0;X.now=()=>clock;
const policy=e=>{clock+=1500;E.tapPolicy(e);}; // conservative presentation time per combat action
assert.deepEqual(X.slice.openQuests,['rain','marsh','city','coast','citadel']);
for(const qid of ['coast','citadel'])for(const def of X.Campaign.questEncounters(qid)){
 let won=0,maxSteps=0;const used=new Set();
 for(let seed=1;seed<=80;seed++){
  const run=E.freshRun();run.questsDone=['rain','marsh','city'];run.tutorial.skipGuide=true;
  const enc=E.create({encounter:def,run,seed});
  E.runToEnd(enc,policy,600);
  assert(enc.st.over,def.id+' stalled');assert(Number.isFinite(E.heroUnit(enc).chp),def.id+' invalid health');
  maxSteps=Math.max(maxSteps,enc.steps);if(E.won(enc))won++;
  for(const e of enc.st.events)if(e.t==='use'&&e.uid!==enc.heroUid)used.add(e.skillId);
 }
 assert(won>0,def.id+' unwinnable in 80 seeded trials');
 report.push({encounter:def.id,wins:won,trials:80,maxSteps,enemySkills:[...used]});
}
for(const id of ['elven_wizard','elven_ranger','dark_swordswoman','enchantress']){
 const ch=E.makeEnemy(new A.RNG(1),id,1);assert.deepEqual(ch.actives.map(s=>s.skillId),X.enemies[id].skillKit);
}
for(const qid of ['coast','citadel']) {
 const winningSeeds=[];
 for(let seed=1;seed<=80;seed++) {
  const r=E.freshRun();r.questsDone=['rain','marsh','city'];let won=true;
  for(const def of X.Campaign.questEncounters(qid)) {
   const e=E.create({encounter:def,run:r,seed});E.runToEnd(e,policy,600);
   assert(e.st.over,qid+' journey stalled');E.rememberHp(r,E.heroUnit(e));
   if(!E.won(e)){won=false;break;}
  }
  if(won)winningSeeds.push(seed);
 }
 assert(winningSeeds.length>=20,qid+' complete journey below 25% floor: '+winningSeeds.length+'/80');
 report.push({quest:qid,carryHealth:true,wins:winningSeeds.length,trials:80,winningSeeds});
}
fs.mkdirSync(path.join(__dirname,'reports/expansion'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'reports/expansion/sim.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
