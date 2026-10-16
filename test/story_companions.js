'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition,S=X.Story,C=A.Campaign3,P=S.Companions,s=S.open();
assert.equal(Object.keys(P.kits).length,15);
C.recruit(s.game,'wren_ward');assert.deepEqual(P.selected(s),[],'chapter one solo');
s.record.chapter=2;S.syncQuest(s);C.recruit(s.game,'vess');C.recruit(s.game,'fennick');
assert.deepEqual(P.selected(s),['fennick','vess'],'newest default');
P.select(s,[]);assert.deepEqual(P.selected(S.open(s.record)),[],'explicit solo survives save');
P.select(s,['wren_ward']);assert.deepEqual(P.selected(S.open(s.record)),['wren_ward'],'one ally stays one');
P.select(s,['wren_ward'],{explicit:false});assert.deepEqual(P.selected(s),['wren_ward','fennick'],'automatic first companion gains a new recruit');
P.select(s,['wren_ward']);
assert.throws(()=>P.select(s,['vess','fennick','wren_ward']),/two/);
assert.throws(()=>P.select(s,['vess','vess']),/two/);
C.state(s.game).gone.push('wren_ward');assert(!P.selected(s).includes('wren_ward'),'departed cannot fight');
C.state(s.game).dead.push('vess');assert(!P.eligible(s).includes('vess'),'dead cannot fight');
assert.deepEqual(P.queueUnlocks(s,[]),['fennick']);assert.deepEqual(P.queueUnlocks(s,[]),[],'no duplicate pending');
assert.equal(P.claimUnlock(s),'fennick');assert.deepEqual(P.queueUnlocks(S.open(s.record),[]),[],'unlock not replayed after reload');
assert.equal(P.claimUnlock(s),null);
const welcome=S.open();C.recruit(welcome.game,'wren_ward');P.queueUnlocks(welcome,[]);
assert.equal(P.pendingUnlock(welcome),null,'chapter-one recruitment waits');
welcome.record.chapter=2;welcome.record.phase='inn';assert.equal(P.pendingUnlock(welcome),null,'wait through inn');
welcome.record.phase='departure';assert.equal(P.pendingUnlock(welcome),null,'wait through title');
welcome.record.titleCards=[2];welcome.record.travelPending={};assert.equal(P.pendingUnlock(welcome),null,'wait through travel');
delete welcome.record.travelPending;assert.equal(P.pendingUnlock(welcome),'wren_ward');assert.equal(P.pendingUnlock(S.open(welcome.record)),'wren_ward','peek survives reload until Accept');
P.claimUnlock(welcome,'wren_ward');assert.equal(P.pendingUnlock(S.open(welcome.record)),null,'Accept survives reload');
for(const id of Object.keys(P.kits)){
 const sample=S.open();sample.record.chapter=14;S.syncQuest(sample);C.recruit(sample.game,id);
 const source=JSON.stringify(C.actor(sample.game,id)),ch=P.make(sample,id);
 assert.deepEqual(ch.actives.map(a=>a.skillId),P.kits[id].skills);
 assert.equal(ch.campaignExit,false);assert.equal(ch.isPlayer,false);
 ch.stats.hp=1;ch.combatHp=0;ch.alive=false;
 assert.equal(JSON.stringify(C.actor(sample.game,id)),source,'no source/cache mutation');
 const restored=P.make(sample,id);assert(restored.alive&&restored.stats.hp>1&&!('combatHp' in restored));
}
assert.throws(()=>P.register('wren_ward',{clips:{}}),/Incomplete/);
assert(P.readiness(s).every(id=>id.startsWith('companion:')));
assert.equal(P.enabled,false,'production remains gated until art and full party QA');
// Browser cannot receive these deliberately named simulation-only bindings.
for(const row of JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json')).combatRoster)
 S.bindings[row.kind+':'+row.id]={actor:'SIMULATION_ONLY',combatReady:true,hiroFinishersReady:2,enemyFinisherReady:true};
for(const id of Object.keys(P.kits))P.bindings[id]={ready:true,actor:'SIMULATION_ONLY'};
P.enabled=true;
const party=S.open();party.record.chapter=2;party.record.encounter=1;party.record.phase='combat';S.syncQuest(party);
for(const id of ['wren_ward','fennick'])C.recruit(party.game,id);P.select(party,['wren_ward','fennick']);
const e=S.Combat.create(party,29),hero=X.Encounter.heroUnit(e),ally=e.st.units.find(u=>u.ch.expeditionStoryCompanion);
assert.equal(e.allies.length,2);assert.equal(e.st.units.filter(u=>u.side==='a').length,3);
const before=JSON.stringify(C.state(party.game));ally.chp=0;ally.downed=true;
assert(!X.Encounter.lost(e),'ally knockout is not defeat');
hero.chp=0;hero.downed=true;X.Encounter.peek(e);
assert(X.Encounter.lost(e),'Hiro defeat ends battle with surviving ally');
assert.equal(JSON.stringify(C.state(party.game)),before,'knockout does not kill story companion');
// Source party scaling must not silently restore its larger HP floors or
// amplify the per-opponent attack/defence tuning used by this edition.
const finale=S.open();Object.assign(finale.record,{chapter:14,encounter:2,phase:'combat'});S.syncQuest(finale);
for(const id of ['fennick','faelen'])C.recruit(finale.game,id);P.select(finale,['fennick','faelen']);
const spawnRng=finale.game.rng.snapshot();const resetSpawn=()=>{finale.game.rng=A.RNG.restore(spawnRng,spawnRng.seed);};
const partyFoes=S.Combat.spawn(finale);P.enabled=false;resetSpawn();const soloFoes=S.Combat.spawn(finale);P.enabled=true;
assert.deepEqual(partyFoes.map(c=>[c.storyOpponent,c.stats,c.hpFloor,c.c3FoeDmg]),soloFoes.map(c=>[c.storyOpponent,c.stats,c.hpFloor,c.c3FoeDmg]),'same measured source baseline');
resetSpawn();const enlarged=S.Combat.create(finale,29).st.units.filter(u=>u.side==='b');
P.select(finale,[]);resetSpawn();const alone=S.Combat.create(finale,29).st.units.filter(u=>u.side==='b');
enlarged.forEach((u,i)=>assert(Math.abs(u.maxHp/alone[i].maxHp-1.5)<.03,'two companions add 50% endurance, not source full-party scaling'));
S.Combat.lose(party,e);S.retry(party);const retry=S.Combat.create(party,29);
for(const u of retry.st.units.filter(u=>u.ch.expeditionStoryCompanion))assert(u.chp===u.maxHp&&!u.downed,'fresh fight full ally health');
// A companion's lethal hit must use the original campaign withdrawal path.
// With withdrawal explicitly disabled (the source noEscape outcome), it downs normally.
for(const exits of [true,false]){
 const battle=S.Combat.create(party,31),attacker=battle.st.units.find(u=>u.ch.expeditionStoryCompanion),target=battle.st.units.find(u=>u.side==='b');
 target.ch.campaignExit=exits;target.chp=1;target.statuses=[];target.ch.perks=[];
 attacker.atk=100000;attacker.lane=target.lane;attacker.statuses=[];
 for(let tries=0;tries<30&&target.chp>0;tries++)A.Combat.act(battle.st,attacker,{kind:'attack',targetUid:target.uid});
 assert.equal(target.chp,0,'fixture landed a lethal companion strike');
 if(exits){assert(target.fled&&target.exited&&!target.downed,'protected enemy withdraws');assert(battle.st.events.some(e=>e.t==='campaignExit'&&e.uid===target.uid));}
 else assert(target.downed&&!target.exited,'noEscape enemy uses normal defeat');
}
console.log('Companion contract: 15 source kits, chapter gate, seats, deaths, persistence, unlock-once, two allies, Hiro-only defeat and knockout recovery passed');
