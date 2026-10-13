// Edition-owned adapter: original Campaign3 handles authored choices and finale
// history; Expeditions owns checkpoints, saves, presentation and solo combat.
(function(){
'use strict';
const A=ADV,X=A.Expedition,C=A.Campaign3;
const S=X.Story={version:1,saveKey:'adventurer_expeditions_story_v1',bindings:{}};
const copy=x=>JSON.parse(JSON.stringify(x));
let memory=null;
const runSessions=new WeakMap(),arcadeSave=X.Run.save;
X.Run.save=function(run){const session=run&&runSessions.get(run);return session?{ok:S.save(session)}:arcadeSave.call(this,run);};
function storage(){try{if(typeof localStorage!=='undefined')return localStorage;}catch(_){}return null;}
S.save=function(session){
  if(!session)return false;
  const g=session.game;
  session.record.c3=copy(C.state(g));session.record.gold=A.Game.player(g)?.inventory.gold||0;
  if(A.GatePerks)session.record.perkLedger=copy(A.GatePerks.state(g));
  const raw=JSON.stringify(session.record);memory=raw;
  try{storage()?.setItem(S.saveKey,raw);return true;}catch(_){return false;}
};
// Shared source files remain untouched. A tagged story world never saves under
// adv:* or the Arcade key, including saves made inside original choice hooks.
for(const name of ['saveMeta','saveGame']){
  const prior=A.Save[name];
  A.Save[name]=function(game,...args){if(game?.__expeditionStory)return S.save(game.__expeditionStory);return prior.apply(this,[game,...args]);};
}
S.fresh=function(){return {version:1,innVersion:1,mode:'story',chapter:1,encounter:0,phase:'departure',queue:null,
  run:X.Run.fresh(),c3:C.fresh(),gold:0,completed:[],outcomes:{},checkpoint:null,tutorialFightStarted:false};};
S.load=function(){
  let raw;try{raw=storage()?.getItem(S.saveKey)||memory;}catch(_){raw=memory;}
  if(!raw)return null;
  try{const r=JSON.parse(raw);if(r.version!==1||r.mode!=='story'||!r.c3||!r.run||!Number.isInteger(r.chapter)||r.chapter<1||r.chapter>14||!Number.isInteger(r.encounter)||r.encounter<0||r.encounter>A.DATA.CAMPAIGN3_QUESTS[r.chapter-1].enc.length||!['departure','opener','combat','defeat','closing','arrival','inn','complete'].includes(r.phase))return null;return r;}catch(_){return null;}
};
S.open=function(record){
  const r=copy(record||S.fresh());r.run.field=[];r.run.roster=[];
  // Old chapter-one demo saves stopped at the next departure. Give those saves
  // the inn visit once, without resetting choices, dialogue or earned rewards.
  if(r.innVersion!==1){
    if(r.phase==='departure'&&r.encounter===0&&r.completed.includes(r.chapter-1))r.phase='inn';
    r.innVersion=1;
  }
  const world=X.Campaign.buildWorld(r.run);world.restoreIds();
  const session={record:r,game:world.game,hero:world.hero};
  session.game.meta.c3=r.c3;session.game.__expeditionStory=session;
  session.game.meta.gatePerks=copy(r.perkLedger||{earned:{},pending:[],seen:{}});
  runSessions.set(r.run,session);
  session.hero.inventory.gold=r.gold||0;
  S.syncQuest(session);A.GatePerks?.reconcile(session.game);return session;
};
S.syncQuest=function(session){
  const r=session.record,g=session.game,q=C.buildQuest(g,r.chapter);
  g.quest={quest:q,encIdx:r.encounter,campaignAllies:[],appliedChoices:[],readyToComplete:r.encounter>=q.encounters.length};
  return q;
};
S.currentSpec=function(session){const r=session.record,e=C.resolveSpec(session.game,A.DATA.CAMPAIGN3_QUESTS[r.chapter-1].enc[r.encounter]);if(r.noEscape?.[r.chapter+':'+r.encounter])e.escapes=false;return e;};
S.opponentIds=function(session){
  const e=S.currentSpec(session),ids=[];
  if(e.mini)ids.push('mini:'+e.mini);if(e.boss)ids.push('named:'+e.boss);
  for(const id of [...(e.types||[]),...(e.with||[])])ids.push((A.DATA.CAMPAIGN_CHARS[id]?'named:':'enemy:')+id);
  return [...new Set(ids)];
};
S.readiness=function(session){
  return S.opponentIds(session).flatMap(id=>{const b=S.bindings[id];
    if(!b||b.combatReady!==true||b.enemyFinisherReady!==true||!Number.isInteger(b.hiroFinishersReady)||b.hiroFinishersReady<2)return [id];
    // Missing frame evidence must fail closed, not pass via undefined < N.
    if(b.humanoid){
      const baseline=b.plannedFrames===undefined?8:b.plannedFrames;
      if(!Number.isInteger(baseline)||baseline<1||!Number.isInteger(b.minDistinctFrames)||
        b.minDistinctFrames<Math.max(16,2*baseline)||b.goreBothDirections!==true)return [id];
    }
    return [];
  });
};
S.beats=function(session){
  const r=session.record,g=session.game,q=g.quest.quest;
  if(r.phase==='inn')return [];
  if(r.queue)return r.queue;
  let beats=[];
  if(r.phase==='departure')beats=C.departureBeats(g,q);
  if(r.phase==='opener')beats=C.openerBeats(g,q,r.encounter);
  if(r.phase==='closing')beats=C.closingBeats(g,q);
  if(r.phase==='arrival')beats=C.arrivalBeats(g,r.chapter);
  r.queue=copy(S.Presentation?.data?S.Presentation.annotate(session,beats):beats);S.save(session);return r.queue;
};
S.applyBeat=function(session,beat){C.applyBeat(session.game,beat);S.save(session);};
S.options=(session,choice)=>C.options(session.game,choice);
S.choose=function(session,beat,optionId){
  const opt=S.options(session,beat.choice).find(o=>o.id===optionId);
  if(!opt)throw Error('Unavailable story choice');
  const r=session.record,g=session.game,before=g.quest.encIdx;
  const result=C.applyOption(g,beat.choice,opt);
  if(result?.error)throw Error(result.error);
  if(opt.noEscape){r.noEscape=r.noEscape||{};r.noEscape[r.chapter+':'+before]=true;}
  if(g.quest.encIdx!==before){r.outcomes[r.chapter+':'+before]='bypass';r.encounter=g.quest.encIdx;r.bypassed=true;}
  const reply=opt.reply?{...C.replyBeat(opt.reply,beat.who,g,opt,beat.choice),
      ...(beat.dream?{dream:true}:{}),...(beat.artLocation?{artLocation:beat.artLocation}:{}),...(beat.artPhase?{artPhase:beat.artPhase}:{})}:null;
  r.reply=copy(reply);r.line=0;
  S.save(session);return reply;
};
S.shiftBeat=function(session){session.record.queue?.shift();session.record.reply=null;session.record.line=0;S.save(session);};
S.nextPhase=function(session){
  const r=session.record;
  if(r.phase==='inn')throw Error('Choose Continue story to leave the inn');
  if(r.queue?.length)throw Error('Dialogue must finish before advancing');
  r.queue=null;
  if(r.phase==='departure')r.phase='opener';
  else if(r.phase==='opener'){
    if(r.bypassed){delete r.bypassed;r.phase=r.encounter>=session.game.quest.quest.encounters.length?'closing':'opener';S.syncQuest(session);}
    else r.phase='combat';
  }else if(r.phase==='closing')r.phase='arrival';
  else if(r.phase==='arrival'){
    const q=session.game.quest.quest;
    if(!r.completed.includes(r.chapter)){
      C.onQuestDone(session.game,q);r.completed.push(r.chapter);C.takeBeats(session.game);
      const pay={gold:q.payout||0,wage:0};session.hero.inventory.gold+=pay.gold;
      A.GatePerks?.questBonus(session.game,q,pay);
      r.chapterRewardDue={chapter:r.chapter,name:q.name,gold:pay.gold};
    }
    if(r.chapter===14)r.phase='complete';else{
      // Health carries to the inn. Rest uses the established Arcade score cost;
      // retry still restores full health, so a poor run cannot lock progression.
      r.chapter++;r.encounter=0;r.phase='inn';S.syncQuest(session);
    }
  }
  S.save(session);return r.phase;
};
S.leaveInn=function(session){
  const r=session.record;if(r.phase!=='inn'||r.restScenePending)return false;
  r.phase='departure';S.save(session);return true;
};
S.rest=function(session){
  const r=session.record;if(r.phase!=='inn'||r.restScenePending)return {ok:false,reason:'phase'};
  const result=X.Encounter.rest(r.run);if(!result.ok)return result;
  session.hero.combatHp=r.run.hp;r.restScenePending=true;S.save(session);return result;
};
S.finishRest=function(session){delete session.record.restScenePending;S.save(session);};
S.beginFight=function(session){
  const r=session.record;if(r.phase!=='combat')throw Error('Not at a story fight');
  const missing=S.readiness(session);if(missing.length)throw Error('Campaign combat art not ready: '+missing.join(', '));
  const tutorial=!r.tutorialFightStarted||r.checkpoint?.tutorial===true;
  if(!r.checkpoint)r.checkpoint=copy({chapter:r.chapter,encounter:r.encounter,run:r.run,c3:C.state(session.game),gold:session.hero.inventory.gold,perkLedger:A.GatePerks?.state(session.game)||null,tutorial});
  r.tutorialFightStarted=true;S.save(session);
  return {tutorial,allies:[],opponents:S.opponentIds(session),spec:S.currentSpec(session)};
};
S.defeat=function(session){
  if(!session.record.checkpoint)throw Error('Missing pre-fight checkpoint');
  session.record.phase='defeat';S.save(session);
};
S.retry=function(session){
  const r=session.record,c=r.checkpoint;if(!c)throw Error('Missing pre-fight checkpoint');
  r.chapter=c.chapter;r.encounter=c.encounter;r.run=copy(c.run);r.c3=copy(c.c3);r.gold=c.gold;r.phase='combat';r.queue=null;
  if(c.perkLedger)r.perkLedger=copy(c.perkLedger);
  // Full health on retry avoids a saved low-health checkpoint trapping the
  // player. Inventory, choices, score and completed fights still roll back.
  r.run.hp=null;r.reply=null;r.line=0;
  session.game.meta.c3=r.c3;session.hero.inventory.gold=r.gold;
  // Rebuild only this fight; never turn a loss into a new campaign.
  const rebuilt=S.open(r);Object.assign(session,rebuilt);session.game.__expeditionStory=session;runSessions.set(session.record.run,session);
  S.save(session);return session;
};
S.victory=function(session,units=[]){
  const r=session.record;if(r.phase!=='combat')throw Error('Not in a story fight');
  const key=r.chapter+':'+r.encounter;
  if(!r.outcomes[key]){A.GateFinale.record(session.game,r.encounter,'combat',units);r.outcomes[key]='combat';}
  if(r.chapter===14&&r.encounter===3)A.GateFinale.state(session.game).realmWon=true;
  r.encounter++;r.checkpoint=null;r.queue=null;
  r.phase=r.encounter>=session.game.quest.quest.encounters.length?'closing':'opener';
  S.syncQuest(session);S.save(session);
};
})();
