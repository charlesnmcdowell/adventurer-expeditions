'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_presentation'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition,S=X.Story,C=A.Campaign3,d=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json'));
S.Presentation.configure(d);
const known=new Set(d.combatRoster.map(c=>c.kind+':'+c.id));let encounters=0,variants=0;
for(const q of A.DATA.CAMPAIGN3_QUESTS)for(let i=0;i<q.enc.length;i++){
  for(const flag of [null,...Object.keys(q.enc[i].variants||{})]){
    const s=S.open();s.record.chapter=q.n;s.record.encounter=i;S.syncQuest(s);
    if(flag){C.setFlag(s.game,flag);variants++;}else encounters++;
    C.recruit(s.game,'wren_ward');assert.deepEqual(C.alliesFor(s.game,s.game.quest.quest),[]);
    const units=S.Combat.spawn(s);assert(units.length,'authored encounter must not silently become empty');
    for(const u of units){assert(known.has(u.storyOpponent),u.storyOpponent);assert(u.noCombatVoice);assert(u.stats.hp>0);}
    assert.equal(s.game.world.characters.length,1);
  }
}
assert.equal(encounters,55);
const s=S.open();s.record.phase='combat';
assert.throws(()=>S.Combat.create(s,1),/art not ready/);
// Fixtures exercise simulation only; no test binding is shipped as usable art.
S.bindings['mini:nib']={actor:'test_only',combatReady:true,enemyFinisherReady:true,hiroFinishersReady:2,humanoid:true,minDistinctFrames:16,goreBothDirections:true};
const enc=S.Combat.create(s,29);assert.equal(enc.st.units.filter(u=>u.side==='a').length,1);
assert(enc.st.units.find(u=>u.side==='b').ch.actives.some(a=>a.skillId==='backstab'));
assert.equal(enc.storyTutorial,true);assert.throws(()=>S.Combat.win(s,enc),/unfinished/);assert.throws(()=>S.Combat.lose(s,enc),/unfinished/);
const originalHp=X.Encounter.heroUnit(enc).chp;
for(const u of enc.st.units.filter(u=>u.side==='a')){u.chp=0;u.downed=true;}enc.st.over=true;
S.Combat.lose(s,enc);S.retry(s);const retry=S.Combat.create(s,29);assert.equal(X.Encounter.heroUnit(retry).chp,originalHp);
const p=S.Presentation;
assert.equal(p.scene(s,{key:'q1_death'}).id,'death');assert.equal(p.scene(s,{key:'q14_final_taken'}).id,'hiwot_sacrifice');
assert.equal(p.scene(s,{key:'q14_final_soul'}).id,'hiwot_bound');assert.equal(p.scene(s,{key:'q10_letter',artPrison:true}).id,'catacombs');
assert.equal(p.voice({who:'aldric',key:'q1_wake'},0),'audio/vo/campaign/aldric/q1_wake_1.mp3');
for(let n=1;n<=14;n++){s.record.chapter=n;s.record.encounter=0;s.record.phase='departure';S.syncQuest(s);
  const beats=p.annotate(s,C.departureBeats(s.game,s.game.quest.quest));let context=null;
  for(const beat of beats){context=p.scene(s,beat,context);if(context)assert(d.art[context.kind][context.id]);}
  assert(d.assets.some(a=>a.file==='audio/music/'+p.music(s)+'.mp3'));
}
console.log('story_combat: '+encounters+' encounters + '+variants+' branches, authored kits, solo roster, readiness, defeat/retry and scene/voice/music routes passed');
