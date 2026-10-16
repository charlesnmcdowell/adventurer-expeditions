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
// A reload in an answer must not jump back to the question or lose its line.
s.record.line=1;S.save(s);const resumedReply=S.open(S.load());
assert.deepEqual(resumedReply.record.reply,reply);assert.equal(resumedReply.record.line,1);
S.shiftBeat(resumedReply);assert.equal(resumedReply.record.reply,null);assert.equal(resumedReply.record.line,0);
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
assert.equal(S.beginFight(loaded).tutorial,true,'first-fight tutorial remains available on retry');
assert(!Number.isFinite(loaded.record.run.hp),'retry restores full health, not a trapped low-HP checkpoint');
// Earned perks and acknowledged notices survive reload, not just source flags.
const reward=S.open();C.state(reward.game).stage=4;C.state(reward.game).choices.q4_dream='reject';
A.GatePerks.reconcile(reward.game);assert(A.GatePerks.has(reward.hero,'cure'));
assert(A.GatePerks.state(reward.game).pending.some(n=>n.id==='gate_cure'));
A.GatePerks.acknowledge(reward.game,A.GatePerks.state(reward.game).pending.slice());
const rewardReload=S.open(S.load());assert(A.GatePerks.has(rewardReload.hero,'cure'));
assert.equal(A.GatePerks.state(rewardReload.game).pending.length,0,'no repeated gift popup after reload');
const completion=S.open();completion.record.chapter=1;completion.record.phase='arrival';completion.record.queue=[];
completion.record.run.hp=9;completion.hero.combatHp=9;
const pay=S.syncQuest(completion).payout;S.nextPhase(completion);
assert.equal(completion.hero.inventory.gold,pay,'authored payout funds later paid dialogue options');
assert.equal(completion.record.chapterRewardDue.gold,pay);assert.equal(completion.record.chapter,2);
assert.equal(completion.record.phase,'inn','chapter ends at the inn');
assert.equal(completion.record.run.hp,9,'returning to the inn does not silently heal');
assert.equal(completion.hero.combatHp,9);
assert.equal(S.open(S.load()).hero.inventory.gold,pay,'reload cannot award chapter twice');
completion.record.run.hpMax=344;completion.record.run.score=999;
assert.equal(S.rest(completion).reason,'score');assert.equal(completion.record.run.hp,9);
completion.record.run.score=3500;
assert.equal(S.rest(completion).cost,1000);assert.equal(completion.record.run.hp,344);
assert.equal(completion.record.run.score,2500);assert.equal(completion.record.run.rests,1);
assert.equal(S.rest(completion).reason,'phase','repeated clicks cannot charge twice');
assert.equal(S.leaveInn(completion),false,'rest scene closes before departing');
const rested=S.open(S.load());assert(rested.record.restScenePending);assert.equal(rested.record.run.score,2500);
S.finishRest(rested);assert.equal(S.rest(rested).reason,'full');
rested.record.run.hp=100;assert.equal(S.rest(rested).cost,2000);assert.equal(rested.record.run.score,500);
S.finishRest(rested);assert(S.leaveInn(rested));assert.equal(S.open(S.load()).record.phase,'departure');
assert.equal(S.rest(rested).reason,'phase','cannot rest during dialogue or combat');
const legacy=JSON.parse(JSON.stringify(rested.record));delete legacy.innVersion;
assert.equal(S.open(legacy).record.phase,'inn','old demo-end save gets one inn visit');
legacy.phase='combat';assert.equal(S.open(legacy).record.phase,'combat','migration never interrupts a fight');
assert.equal(localStorage.getItem('adv:sentinel'),'keep');assert.equal(localStorage.getItem('adventurer_expeditions_arcade_v1'),'arcade sentinel');
assert.deepEqual(Object.keys(localStorage._m).sort(),['adv:sentinel','adventurer_expeditions_arcade_v1',S.saveKey].sort(),'only story namespace written');
// Borrow the actual finale hooks: ritual is not omitted from data-only imports.
const f=S.open();f.record.chapter=14;f.record.encounter=3;f.record.phase='opener';S.syncQuest(f);C.recruit(f.game,'wren_ward');
const finale=S.beats(f);assert(finale.some(b=>b.finaleEvent==='takeSoul'));for(const b of finale)S.applyBeat(f,b);
assert(A.GateFinale.state(f.game).soulTaken);assert(C.state(f.game).dead.includes('wren_ward'));
f.record.queue=[];S.nextPhase(f);for(const id of S.opponentIds(f))S.bindings[id]={combatReady:true,enemyFinisherReady:true,hiroFinishersReady:2};
S.beginFight(f);S.defeat(f);S.retry(f);assert(A.GateFinale.state(f.game).soulTaken,'retry does not revive sister or replay ritual');
S.victory(f);assert(A.GateFinale.state(f.game).realmWon);assert.equal(C.resolveEnding(f.game,'restore'),'restored');assert(!C.state(f.game).dead.includes('wren_ward'));
// Painted inn journeys survive reload without changing dialogue, health or rewards.
for(let chapter=2;chapter<=14;chapter++){
 const trip=S.open();Object.assign(trip.record,{chapter,phase:'inn',completed:[chapter-1]});S.syncQuest(trip);
 trip.record.run.hpMax=344;trip.record.run.hp=81;const score=trip.record.run.score;
 assert(S.leaveInn(trip));assert.equal(S.travelSpec(trip).leg,'outbound');
 const resumed=S.open(S.load());assert.equal(S.travelSpec(resumed).chapter,chapter);
 assert(S.finishTravel(resumed));assert(!S.finishTravel(resumed),'completion is idempotent');
 assert.equal(resumed.record.phase,'departure');assert.equal(resumed.record.run.hp,81);assert.equal(resumed.record.run.score,score);
 resumed.record.phase='closing';resumed.record.queue=[];S.nextPhase(resumed);
 assert.equal(!!resumed.record.travelPending,chapter<14,'finale stays with its epilogue and thank-you card');
 if(chapter<14){assert.equal(S.travelSpec(resumed).leg,'return');S.finishTravel(resumed);assert.equal(resumed.record.phase,'arrival');}
}
console.log('story_campaign: original text, choices, media inventory, solo world, isolated saves, retry and finale continuity passed');
// Keep the source-import assertions above, then check the edition's live overrides
// in an isolated harness so archived source text is never confused with runtime.
require('node:child_process').execFileSync(process.execPath,['test/story_companion_dialogue.js'],{cwd:ROOT,stdio:'inherit'});
