'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions','story_effects'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const S=A.Expedition.Story,P=S.Companions,F=A.Expedition.StoryEffects;
for(const row of JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json')).combatRoster)S.bindings[row.kind+':'+row.id]={actor:'SIMULATION_ONLY',combatReady:true,hiroFinishersReady:2,enemyFinisherReady:true};
for(const id of Object.keys(P.kits))P.bindings[id]={ready:true};
for(const id of Object.keys(P.casters)){
 const s=S.open();Object.assign(s.record,{chapter:7,encounter:0,phase:'combat'});S.syncQuest(s);A.Campaign3.recruit(s.game,id);P.select(s,[id]);
 const e=S.Combat.create(s,19),u=e.st.units.find(u=>u.ch.expeditionStoryCompanion===id),foe=e.st.units.find(u=>u.side==='b');
 const plain=A.SkillSys.manifest({...u.ch,expeditionStoryCompanion:null},{skillId:'basic_attack',level:1});
 const magic=A.SkillSys.manifest(u.ch,{skillId:'basic_attack',level:1});
 assert(magic.data.elemental&&magic.data.reach==='any'&&!magic.data.melee);
 assert.equal(magic.data.power,plain.data.power,'retain ordinary power');assert(!plain.data.elemental,'original actor unaffected');
 assert(F.supports(P.casters[id].effect,{companion:true}));
 const sheet=JSON.parse(fs.readFileSync('assets/expedition/companion_'+id+'/companion_'+id+'.json'));
 assert(sheet.clips[P.casters[id].clip]?.releaseAnchor,id+' basic spell uses authored casting hand');
 for(const skillId of P.kits[id].skills){
  const m=A.SkillSys.manifest(u.ch,{skillId,level:1}).data;
  if(['enemy','allEnemies'].includes(m.target))assert(m.elemental&&!m.melee&&m.reach==='any',id+'/'+skillId+' cannot fall back to melee');
 }
 u.lane='back';u.cooldowns={};for(const skill of u.ch.actives)u.cooldowns[skill.skillId]=100;
 const from=e.st.events.length;A.Combat.act(e.st,u,{kind:'attack',targetUid:foe.uid});
 assert(e.st.events.slice(from).some(ev=>ev.t==='use'&&ev.skillId==='basic_attack'),'free spell available with signatures cooling down');
}
for(const id of ['fennick','cassian','nettle','durnik']){
 assert(!P.casters[id],'hybrids retain weapons');
 const s=S.open();s.record.chapter=7;S.syncQuest(s);A.Campaign3.recruit(s.game,id);
 const basic=A.SkillSys.manifest(P.make(s,id),{skillId:'basic_attack',level:1}).data;
 assert(!basic.elemental,id+' basic hit must stay physical');
}
for(const id of ['marked_for_the_knife','contract_mark','taunt'])assert(F.meleeStatus.has(id));
assert(!F.meleeStatus.has('ranging_ward'),'a mage ward stays magic');
// All authored chapter branches, including enemies absent from the default path.
for(const q of A.DATA.CAMPAIGN3_QUESTS)for(let i=0;i<q.enc.length;i++)for(const flag of [null,...Object.keys(q.enc[i].variants||{})]){
 const s=S.open();Object.assign(s.record,{chapter:q.n,encounter:i,phase:'combat'});
 if(flag)A.Campaign3.setFlag(s.game,flag);S.syncQuest(s);
 for(const ch of S.Combat.spawn(s))for(const entry of ch.actives){
  const d=A.SkillSys.manifest(ch,entry).data;
  if(d.elemental)assert(F.supports(entry.skillId),ch.name+'/'+entry.skillId+' needs painted magic');
 }
}
console.log('PASS: five casters, free spell basics and magical signatures; four weapon exceptions; preserved power/source data and casting anchors');
