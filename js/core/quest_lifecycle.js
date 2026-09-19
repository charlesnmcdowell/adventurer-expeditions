// The departure transaction is planned before any gold or quest state moves.
(function(){
'use strict';
const Q={};
Q.planDeparture=function(game,quest,opts={}){
 const A=ADV,p=A.Game.player(game);
 if(A.SkillSys.isOverCapacity(p))return {ok:false,error:'Set down extra skills first — your armor no longer covers them.'};
 const travel=A.Travel?A.Travel.quote(game,quest,opts.provisions!==false):null;
 const tuitionDue=A.Game.youngDependents(p)*A.DATA.CONST.GOLD.tuitionPerChildPerQuest*(travel?travel.days:1);
 const deposit=Math.min(Math.max(0,opts.vaultGold||0),p.inventory.gold);
 if(p.inventory.gold-deposit<tuitionDue+(travel?.payer===p?travel.total:0))return {ok:false,error:'Keep enough carried gold for childcare and travel, or choose a nearby contract.'};
 if(travel && travel.payer!==p && (!travel.payer||travel.payer.inventory.gold<travel.total))return {ok:false,error:'The company leader cannot afford this passage. Choose nearby work.'};
 if(quest.track==='party'&&A.Game.partyRoster(game).length<2)return {ok:false,error:'party contracts need a party'};
 if(quest.track==='solo'&&A.Party.of(game.world,p))return {ok:false,error:'a party does not take solo work'};
 const reputation=A.Quests.repGate(quest,p);if(!reputation.ok)return reputation;
 if(!A.Game.contractCoversPayroll(game,quest))return {ok:false,error:'that contract would not cover payroll'};
 return {ok:true,p,travel,tuitionDue,deposit};
};
Q.phase=function(game){
 const q=game.quest;if(!q)return 'town';if(q.over||q.readyToComplete)return 'resolution';
 if(q.combat)return 'combat';if(q.openerBeats?.length&&q.openerShownIdx!==q.encIdx)return 'dialogue';return 'travel';
};
ADV.QuestLifecycle=Q;
})();
