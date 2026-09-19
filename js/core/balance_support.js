// One-time save upgrades and flat reward adjustments; encounter composition is unchanged.
(function(){
'use strict';
const A=ADV,B={bonus:100};
B.quest=function(q){
 if(q && ['solo','party','campaign'].includes(q.track) && !q.incomeBoostV1){q.incomeBoostV1=true;q.payout=A.Difficulty?A.Difficulty.pay(q.payout||0):(q.payout||0)+100;}
 return q;
};
for(const name of ['make','makeSoloPremium','makeHazard','makeWarQuest','makeGodQuest','makeTutorialParty']){
 const original=A.Quests[name];if(original)A.Quests[name]=function(...args){return B.quest(original.apply(this,args));};
}
const prepare=A.Travel.prepareBoard;
A.Travel.prepareBoard=function(...args){return prepare.apply(this,args).map(B.quest);};
const board=A.Quests.generateBoard;
A.Quests.generateBoard=function(...args){return board.apply(this,args).map(B.quest);};
for(const owner of [A.Campaign,A.Campaign2]){
 if(owner&&owner.buildQuest){const original=owner.buildQuest;owner.buildQuest=function(...args){return B.quest(original.apply(this,args));};}
}
const repeatables=A.Campaign.repeatables;
A.Campaign.repeatables=function(...args){return repeatables.apply(this,args).map(B.quest);};
B.migrate=function(game){
 if(!game||!game.world)return game;
 const p=A.Game.player(game);if(!p)return game;
 if(!p.playerHealthV1){if(p.combatHp!=null)p.combatHp*=2;p.playerHealthV1=true;}
 if(!p.hireIncomeV1){
  const party=A.Party.of(game.world,p);
  if(party&&party.leaderId!==p.id){const wage=party.wages[p.id]||p.wage||A.DATA.CONST.GOLD.hirelingWage;party.wages[p.id]=p.wage=wage+100;}
  p.hireIncomeV1=true;
 }
 (game.board||[]).forEach(B.quest);
 if(game.quest)B.quest(game.quest.quest);
 return game;
};
for(const [owner,name]of [[A.Save,'loadGame'],[A.Game,'newGame']]){
 const original=owner[name];owner[name]=function(...args){return B.migrate(original.apply(this,args));};
}
A.BalanceSupport=B;
})();
