'use strict';
// Execute original choice hooks and real solo encounters, including peaceful
// bypasses. This is state/balance coverage, separate from browser playthroughs.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_presentation','enemy_finishers','painted','story_art']){if(n==='painted')A.Expedition.UI={};vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));}
const X=A.Expedition,S=X.Story,C=A.Campaign3,E=X.Encounter;let clock=0;X.now=()=>clock;
S.Presentation.configure(JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json')));
const start=JSON.parse(fs.readFileSync('test/reports/story-chapters-5/verification.json')).result.record;
const common={q6_faelen:'cut',q7_dorran:'with',q7_durnik:'free',q7_dream:'reject',q7_vess_papers:'give',q8_halloran:'yes',q9_floor_offer:'library',q9_lysandra:'arrest',q10_sarn:'take',q10_double:'strike',q10_dream:'reject',q11_allegiance:'gauntlet',q12_face:'evidence',q14_final_questions:'enough',q14_final_last:'tesfaye'};
const paths={mercy:{q6_nettle:'talk',q7_flood:'wait',q8_door:'fennick',q9_lobby:'talk',q10_summit:'talk',q11_amara:'promise',q13_maze:'follow',q13_amara_gate:'join',q14_final_resolution:'restore'},ruthless:{q6_nettle:'fight',q7_flood:'now',q8_door:'force',q9_lobby:'fight',q9_lysandra:'kill',q10_summit:'kill',q11_amara:'lie',q13_maze:'cut',q13_amara_gate:'fight',q14_final_resolution:'ascend'}};
const report=[];
for(const [name,route]of Object.entries(paths)){
 let s=S.open(start),fights=0,retries=0,visits=0;const choices={...common,...route},selected={},beats=new Set();
 for(let guard=0;guard<10000&&s.record.phase!=='complete';guard++){
  const r=s.record,perks=A.GatePerks.state(s.game);if(perks.pending.length)A.GatePerks.acknowledge(s.game,perks.pending.slice());delete r.chapterRewardDue;delete r.seatOffer;
  if(r.phase==='inn'){visits++;if(S.rest(s).ok)S.finishRest(s);assert(S.leaveInn(s));continue;}
  if(r.phase==='combat'){
   let won=false;
   for(let seed=1;seed<=30&&!won;seed++){
    const e=S.Combat.create(s,seed),tap=()=>{for(const id of ['finisher','counter_attack','god_aura'])if(!e.st.over&&E.skillState(e,id).ready){E.requestSkill(e,id);E.castNow(e);}};
    while(!e.st.over&&e.steps<1200){clock+=3500;tap();if(!e.st.over)E.step(e);tap();}
    assert(e.st.over,'stalled '+name+' '+r.chapter+':'+r.encounter);
    if(E.won(e)){S.Combat.win(s,e);won=true;fights++;}else{S.Combat.lose(s,e);const complete=s.record.completed.slice();s=S.open(S.load());S.retry(s);assert.deepEqual(s.record.completed,complete);retries++;}
   }
   assert(won,'Unwinnable '+name+' '+r.chapter+':'+r.encounter);continue;
  }
  const b=r.reply||S.beats(s)[0];if(!b){S.nextPhase(s);continue;}beats.add(b.key);S.applyBeat(s,b);
  const opts=b.choice?S.options(s,b.choice):[];
  const wanted=choices[b.choice];
  // Asking Nettle about the poisoned wood legitimately unlocks the peaceful
  // response when Selene is not riding. Never silently turn a mercy test into
  // a fight because its prerequisite was skipped.
  const pick=opts.find(o=>o.id===wanted)||(b.choice==='q6_nettle'&&wanted==='talk'?opts.find(o=>o.id==='ask'):null)||opts.find(o=>!o.ask&&!o.bypass)||opts.find(o=>!o.ask)||opts[0];
  if(pick){selected[b.choice]=pick.id;if(!S.choose(s,b,pick.id))S.shiftBeat(s);}else S.shiftBeat(s);
 }
 assert.equal(s.record.phase,'complete',name);assert.deepEqual(s.record.completed,Array.from({length:14},(_,i)=>i+1));
 for(const [id,wanted] of Object.entries(route))assert.equal(selected[id],wanted,name+' choice '+id);
 const f=A.GateFinale.state(s.game);assert(f.soulTaken&&f.realmWon);assert.equal(C.state(s.game).ending,name==='mercy'?'restored':'ascended');
 assert.equal(C.state(s.game).dead.includes('wren_ward'),name!=='mercy');
 const reopened=S.open(S.load());assert.equal(reopened.record.phase,'complete');assert.equal(C.state(reopened.game).ending,C.state(s.game).ending);
 report.push({name,fights,retries,innVisits:visits,choices:selected,ending:C.state(s.game).ending,outcomes:s.record.outcomes,finale:f,beats:[...beats]});console.log(name+': chapters 6–14, '+fights+' real simulated wins, '+retries+' retries, ending '+C.state(s.game).ending);
}
fs.mkdirSync('test/reports/story-late-branches',{recursive:true});fs.writeFileSync('test/reports/story-late-branches/verification.json',JSON.stringify(report,null,2));
