// Pure simulation audit. Fixture art declarations never enter the browser.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const A=require('./harness').load();
for(const name of ['data','shim','encounter','campaign','run','story','story_combat'])vm.runInThisContext(fs.readFileSync('js/expedition/'+name+'.js','utf8'));
const X=A.Expedition,S=X.Story,E=X.Encounter,report=[];let clock=0;X.now=()=>clock;
if(process.env.STORY_DAMAGE)S.Combat.tuning.foeDamage=S.Combat.tuning.laterFoeDamage=Number(process.env.STORY_DAMAGE);
const data=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json'));
for(const e of data.combatRoster)S.bindings[e.kind+':'+e.id]={actor:'SIMULATION_ONLY',combatReady:true,hiroFinishersReady:2,enemyFinisherReady:true};
const requestedPair=(process.env.STORY_COMPANIONS||'').split(',').filter(Boolean);
const defaultParty=process.argv.includes('--default-party'),solo=process.argv.includes('--solo');
const partyCount=defaultParty?2:requestedPair.length||Number(process.env.STORY_PARTY)||0;
if(partyCount){vm.runInThisContext(fs.readFileSync('js/expedition/story_companions.js','utf8'));S.Companions.enabled=true;
 for(const id of Object.keys(S.Companions.kits))S.Companions.bindings[id]={ready:true,actor:'SIMULATION_ONLY'};}
// Follow the same first ordinary choices as the dev chapter jump. Snapshot the
// actual company and default selection at every fight, rather than granting a
// companion before their recruitment or retaining one after a story death.
const journey=new Map(),chapterCompany=new Map();
if(defaultParty){
 const s=S.open(),r=s.record,C=A.Campaign3;
 for(let guard=0;guard<20000&&r.phase!=='complete';guard++){
  const perks=A.GatePerks?.state(s.game);if(perks?.pending.length)A.GatePerks.acknowledge(s.game,perks.pending.slice());
  delete r.chapterRewardDue;delete r.seatOffer;
  if(r.chapter>=2){S.Companions.select(s,S.Companions.selected(s),{explicit:false});}
  chapterCompany.set(r.chapter,JSON.parse(JSON.stringify({c3:C.state(s.game),pair:S.Companions.selected(s)})));
  if(r.travelPending){S.finishTravel(s);continue;}
  if(r.phase==='inn'){S.leaveInn(s);continue;}
  if(r.phase==='combat'){journey.set(r.chapter+':'+r.encounter,chapterCompany.get(r.chapter));S.victory(s,[]);continue;}
  const beat=r.reply||S.beats(s)[0];if(!beat){S.nextPhase(s);continue;}
  S.applyBeat(s,beat);const opts=beat.choice?S.options(s,beat.choice):[];
  const pick=opts.find(o=>!o.ask&&!o.bypass)||opts.find(o=>!o.ask)||opts[0];
  if(pick){if(!S.choose(s,beat,pick.id))S.shiftBeat(s);}else S.shiftBeat(s);
 }
 assert.equal(r.phase,'complete','default story path must reach the finale');
}
const trials=Number(process.env.STORY_TRIALS)||20;
for(const q of A.DATA.CAMPAIGN3_QUESTS.filter(q=>!process.env.STORY_CHAPTERS||q.n<=Number(process.env.STORY_CHAPTERS)))for(let i=0;i<q.enc.length;i++){
  let wins=0,steps=0,rounds=0,stalls=0;const skills=new Set();let stats;
  for(let seed=1;seed<=trials;seed++){
    const s=S.open();s.record.chapter=q.n;s.record.encounter=i;s.record.phase='combat';s.record.run.tutorial.skipGuide=true;
    // Test an earned campaign path, not an endgame chapter with no milestones.
    const state=A.Campaign3.state(s.game);state.stage=q.n-1;
    state.choices.q4_dream='reject';state.choices.q7_dream='reject';state.choices.q10_dream='reject';
    A.GatePerks.reconcile(s.game);S.syncQuest(s);
    // Hiwot joins after chapter one; Winston can join on chapter two's road.
    // These named fixtures measure a reproducible damage party, not every branch/kit.
    if(defaultParty&&q.n>=2){const snapshot=journey.get(q.n+':'+i)||chapterCompany.get(q.n);s.game.meta.c3=JSON.parse(JSON.stringify(snapshot.c3));S.syncQuest(s);S.Companions.select(s,snapshot.pair.filter(id=>S.Companions.eligible(s).includes(id)));}
    else if(partyCount&&q.n>=2){const ids=requestedPair.length?requestedPair.filter(id=>{assert(S.Companions.kits[id],'Unknown companion '+id);return S.Companions.kits[id].join<=q.n;}):['wren_ward'];if(!requestedPair.length&&(q.n>2||i>0))ids.push('fennick');
      for(const id of ids.slice(0,partyCount))A.Campaign3.recruit(s.game,id);
      S.Companions.select(s,ids.slice(0,partyCount));}
    if(defaultParty)S.Companions.enabled=!solo;const e=S.Combat.create(s,seed);if(defaultParty)S.Companions.enabled=true;stats=e.st.units.map(u=>({name:u.ch.name,hp:u.maxHp,atk:u.atk,def:u.def}));
    // Browser buttons fire between turns (drainCasts), without replacing
    // Katana Slash. The old turn-only policy falsely reported unwinnable
    // fights, so it must not be used to tune the campaign.
    const tap=()=>{for(const id of ['finisher','counter_attack','god_aura']){
      if(e.st.over)break;
      if(E.skillState(e,id).ready){E.requestSkill(e,id);E.castNow(e);}
    }};
    while(!e.st.over&&e.steps<1200){clock+=3500;tap();if(!e.st.over)E.step(e);tap();}
    if(!e.st.over)stalls++;if(E.won(e))wins++;steps=Math.max(steps,e.steps);rounds+=e.st.round;
    assert(Number.isFinite(E.heroUnit(e).chp),'non-finite hero health');
    for(const ev of e.st.events)if(ev.t==='use'&&ev.uid!==e.heroUid)skills.add(ev.skillId);
  }
  report.push({chapter:q.n,encounter:i,wins,trials,stalls,maxSteps:steps,avgRounds:Math.round(rounds/trials*10)/10,stats,enemySkills:[...skills]});
}
fs.mkdirSync('test/reports/story',{recursive:true});fs.writeFileSync('test/reports/story/balance'+(defaultParty?(solo?'-default-solo':'-default-party'):requestedPair.length?'-'+requestedPair.join('-'):partyCount?'-party'+partyCount:'')+(process.env.STORY_DAMAGE?'-'+process.env.STORY_DAMAGE:'')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(({stats,enemySkills,...r})=>r)));
console.log('Unwinnable:',report.filter(r=>r.wins===0).length,'Stalls:',report.reduce((n,r)=>n+r.stalls,0));
if(process.argv.includes('--gate'))assert(report.every(r=>r.wins>0&&!r.stalls),'story balance gate failed');
