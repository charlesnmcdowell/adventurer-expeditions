// Source-roster inventory, edition-only strike contracts and tutorial miss rates.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition,S=X.Story,B=S.Combat,E=X.Encounter,inventory={},examples={};
const data=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json'));
for(const e of data.combatRoster)S.bindings[e.kind+':'+e.id]={actor:'SIMULATION_ONLY',combatReady:true,hiroFinishersReady:2,enemyFinisherReady:true};
function session(chapter,encounter){const s=S.open();Object.assign(s.record,{chapter,encounter,phase:'combat'});s.record.run.tutorial.skipGuide=true;S.syncQuest(s);return s;}
for(const q of A.DATA.CAMPAIGN3_QUESTS)for(let i=0;i<q.enc.length;i++)for(const flag of [null,...Object.keys(q.enc[i].variants||{})]){
const s=session(q.n,i);if(flag)A.Campaign3.setFlag(s.game,flag);S.syncQuest(s);
for(const ch of B.spawn(s))for(const entry of ch.actives){
  const d=A.SkillSys.manifest(ch,entry).data;
  if(d.power>0||!d.target?.startsWith('enemy')&&d.target!=='allEnemies')continue;
  const row=inventory[entry.skillId]??={name:A.DATA.SKILLS[entry.skillId].name,chapters:new Set(),enemies:new Set(),addedStrike:B.statusStrikes.has(entry.skillId)};
  row.chapters.add(q.n);row.enemies.add(ch.name);
  if(row.addedStrike)examples[entry.skillId]??={chapter:q.n,encounter:i,identity:ch.storyOpponent};
}
}
for(const id of B.statusStrikes){
  const ex=examples[id];assert(ex,'roster user for '+id);
  const enc=B.create(session(ex.chapter,ex.encounter),12),st=enc.st,u=st.units.find(u=>u.ch.storyOpponent===ex.identity),target=E.heroUnit(enc);
  target.statuses=[];target.counter=0;target.evade=0;target.marksBy=[];
  const before=st.events.length;
  const r=A.Combat.act(st,u,{kind:'skill',skillId:id,targetUid:target.uid});assert.notEqual(r.ok,false,id);
  const events=st.events.slice(before);
  assert(events.some(e=>e.t==='damage'&&e.by===u.uid&&e.uid===target.uid&&e.dmg>0),id+' must strike');
  assert(events.some(e=>['status','taunted','hazard','dispelled'].includes(e.t)),id+' must keep its effect');
  assert.equal(A.DATA.SKILLS[id].power,0,'source table unchanged');
  // The same source character outside story must retain the old status-only cast.
  const plain=B.create(session(ex.chapter,ex.encounter),12),pu=plain.st.units.find(u=>u.ch.storyOpponent===ex.identity),pt=E.heroUnit(plain);
  delete pu.ch.expeditionStoryFoe;const begin=plain.st.events.length;
  A.Combat.act(plain.st,pu,{kind:'skill',skillId:id,targetUid:pt.uid});
  assert(!plain.st.events.slice(begin).some(e=>e.t==='damage'&&e.by===pu.uid),id+' scoped to story foes');
}
const tutorials=[];let clock=0;X.now=()=>clock;
{
 const enc=B.create(session(1,1),12),u=enc.st.units.find(u=>u.side==='b'),hero=E.heroUnit(enc);
 hero.tempHp=1000;hero.counter=0;hero.evade=0;const from=enc.st.events.length;
 A.Combat.act(enc.st,u,{kind:'skill',skillId:'marked_for_the_knife',targetUid:hero.uid});
 assert(enc.st.events.slice(from).some(e=>e.t==='shieldAbsorb'&&e.temporary&&e.absorbed>0),'temporary-health absorption has a visible shield event');
 const interrupted=B.create(session(1,1),12),foe=interrupted.st.units.find(u=>u.side==='b'),target=E.heroUnit(interrupted);
 target.statuses.push({kind:'countersign',rounds:2});const begin=interrupted.st.events.length;
 A.Combat.act(interrupted.st,foe,{kind:'skill',skillId:'marked_for_the_knife',targetUid:target.uid});
 const events=interrupted.st.events.slice(begin);assert(events.some(e=>e.t==='interrupted'));
 assert(!events.some(e=>e.t==='damage'&&e.by===foe.uid),'interrupted status casts do not gain a strike');
}
for(const encounter of [0,1]){
  let swings=0,evades=0,blocks=0;
  for(let seed=1;seed<=100;seed++){
    const enc=B.create(session(1,encounter),seed);
    while(!enc.st.over&&enc.steps<300){
      clock+=3500;
      for(const id of ['finisher','counter_attack','god_aura'])if(!enc.st.over&&E.skillState(enc,id).ready){E.requestSkill(enc,id);E.castNow(enc);}
      if(enc.st.over)break;
      const step=E.step(enc),use=step.events.find(e=>e.t==='use'&&e.uid===enc.heroUid);
      if(use&&['katana_slash','basic_attack'].includes(use.skillId)){
        swings++;if(step.events.some(e=>e.t==='evade'&&e.by===enc.heroUid))evades++;
        if(step.events.some(e=>e.t==='counter'&&e.by===enc.heroUid))blocks++;
      }
    }
  }
  tutorials.push({encounter,trials:100,swings,evades,blocks,missPercent:Math.round(1000*evades/Math.max(1,swings))/10});
}
const report={inventory:Object.fromEntries(Object.entries(inventory).map(([id,r])=>[id,{...r,chapters:[...r.chapters],enemies:[...r.enemies]}])),tutorials};
fs.mkdirSync('test/reports/readability',{recursive:true});fs.writeFileSync('test/reports/readability/simulation.json',JSON.stringify(report,null,2));
console.log('Six hostile status strikes preserve effects and source rules; tutorial measurements:',tutorials);
