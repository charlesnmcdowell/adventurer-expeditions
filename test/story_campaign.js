'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const H=require('./harness'),A=H.load(),ROOT=path.resolve(__dirname,'..');
global.localStorage=H.memBackend();localStorage.setItem('adv:sentinel','keep');localStorage.setItem('adventurer_expeditions_arcade_v1','arcade sentinel');
for(const f of ['data','shim','encounter','campaign','run','story'])vm.runInThisContext(fs.readFileSync(path.join(ROOT,'js/expedition/'+f+'.js'),'utf8'),{filename:f});
const X=A.Expedition,S=X.Story,C=A.Campaign3;
const imported=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/expedition/story/campaign.json')));
assert.equal(imported.chapters.length,14);assert.equal(imported.chapters.reduce((n,q)=>n+q.enc.length,0),55);
assert.deepEqual(imported.scripts,A.DATA.CAMPAIGN3_SCRIPT,'no missing authored script changes');
assert.deepEqual(imported.dialogue,A.DATA.CAMPAIGN3_DIALOGUE.gate,'dialogue preserved byte for byte after evaluation');
assert(imported.assets.every(a=>a.exists),'all source media found');
const s=S.open();assert.equal(s.game.world.characters.length,1);assert.equal(s.hero.name,'Hiro');
assert.equal(S.beats(s)[0].key,'q1_wake');
const beat=S.beats(s)[0],reply=S.choose(s,beat,'why');assert.equal(reply.choice,'q1_wake');assert(!S.options(s,'q1_wake').some(o=>o.id==='why'));
C.recruit(s.game,'wren_ward');assert.equal(s.game.world.characters.length,1,'story companion cannot become combat ally');assert(C.inCompany(s.game,'wren_ward'));
// First encounter can be spared; tutorial must wait for first actual fight.
s.record.phase='opener';s.record.queue=[];
S.choose(s,{choice:'q1_nib',who:'nib'},'run');assert.equal(s.record.encounter,1);assert.equal(s.record.tutorialFightStarted,false);
assert.equal(S.nextPhase(s),'opener');
s.record.queue=[];S.nextPhase(s);assert.equal(s.record.phase,'combat');
assert.throws(()=>S.beginFight(s),/art not ready/,'never pass portraits off as complete animated opponents');
for(const id of S.opponentIds(s))S.bindings[id]={combatReady:true,enemyFinisherReady:true,hiroFinishersReady:2,humanoid:true,minDistinctFrames:16,goreBothDirections:true};
// A readiness declaration cannot quietly waive the user's doubled-frame rule.
const checkedId=S.opponentIds(s)[0],readyBinding={...S.bindings[checkedId]};
for(const patch of [{hiroFinishersReady:undefined},{hiroFinishersReady:1},{minDistinctFrames:undefined},{minDistinctFrames:NaN},{minDistinctFrames:15},
  {goreBothDirections:false},{goreBothDirections:'yes'},{plannedFrames:12,minDistinctFrames:23},
  {plannedFrames:0},{plannedFrames:'12'}]){
  S.bindings[checkedId]={...readyBinding,...patch};
  assert(S.readiness(s).includes(checkedId),'unverified humanoid finisher must remain gated: '+JSON.stringify(patch));
}
S.bindings[checkedId]={...readyBinding,plannedFrames:12,minDistinctFrames:24};
assert(!S.readiness(s).includes(checkedId),'12 planned drawings require 24 distinct drawings');
S.bindings[checkedId]=readyBinding;
assert.equal(S.beginFight(s).tutorial,true);assert.deepEqual(S.beginFight(s).allies,[]);
s.record.completed=[1];s.record.run.score=900;s.hero.inventory.gold=10;
S.defeat(s);const loaded=S.open(S.load());S.retry(loaded);
assert.equal(loaded.record.encounter,1);assert.deepEqual(loaded.record.completed,[1]);assert.equal(loaded.record.phase,'combat');assert.equal(loaded.record.run.score,0);
assert.equal(loaded.game.world.characters.length,1);
assert.equal(localStorage.getItem('adv:sentinel'),'keep');assert.equal(localStorage.getItem('adventurer_expeditions_arcade_v1'),'arcade sentinel');
assert.deepEqual(Object.keys(localStorage._m).sort(),['adv:sentinel','adventurer_expeditions_arcade_v1',S.saveKey].sort(),'only story namespace written');
// Borrow the actual finale hooks: ritual is not omitted from data-only imports.
const f=S.open();f.record.chapter=14;f.record.encounter=3;f.record.phase='opener';S.syncQuest(f);C.recruit(f.game,'wren_ward');
const finale=S.beats(f);assert(finale.some(b=>b.finaleEvent==='takeSoul'));for(const b of finale)S.applyBeat(f,b);
assert(A.GateFinale.state(f.game).soulTaken);assert(C.state(f.game).dead.includes('wren_ward'));
f.record.queue=[];S.nextPhase(f);for(const id of S.opponentIds(f))S.bindings[id]={combatReady:true,enemyFinisherReady:true,hiroFinishersReady:2};
S.beginFight(f);S.defeat(f);S.retry(f);assert(A.GateFinale.state(f.game).soulTaken,'retry does not revive sister or replay ritual');
S.victory(f);assert(A.GateFinale.state(f.game).realmWon);assert.equal(C.resolveEnding(f.game,'restore'),'restored');assert(!C.state(f.game).dead.includes('wren_ward'));
console.log('story_campaign: original text, choices, media inventory, solo world, isolated saves, retry and finale continuity passed');
