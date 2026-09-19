// Extend the existing battlefield kit so arriving at a travel destination does
// not silently turn a harbor or academy into the generic bandit road.
(function(){
'use strict';
const B=ADV.BattleArt;
const bases={road:'bandit_road',forest:'deep_wood',ruins:'crypt',city:'alley',prison:'crypt',coast:'shallows',port:'shallows',mountain:'green',antler:'bandit_road',academy:'crypt',bell:'alley',tally:'shallows',navy:'shallows',green_altar:'birthing_house',pyre:'bandit_road'};
for(const [id,base]of Object.entries(bases)){
 if(B.has(id))continue;
 const r=JSON.parse(JSON.stringify(B.GROUNDS[base]));
 if(['tally','navy','bell','antler','academy'].includes(id)){
  r.P.accent={tally:0x953f42,navy:0x4e719b,bell:0xc3bca0,antler:0xb4915c,academy:0x9c8abc}[id];
  r.layers.push({el:'banner',x:230,y:260,w:45,h:150,c:'accent'},{el:'banner',x:1010,y:260,w:45,h:150,c:'accent'});
 }
 if(id==='prison')for(let x=420;x<=840;x+=42)r.layers.push({el:'pillar',x,y:160,w:9,h:320,c:'near'});
 if(id==='ruins')r.layers.push({el:'rubble',x:260,y:580,w:720,n:18,c:'mid'});
 if(id==='mountain'){r.layers=r.layers.filter(l=>!['wall','banner','bamboo'].includes(l.el));r.layers.push({el:'ridge',x:100,y:150,w:1000,h:290,c:'far',seed:27});}
 if(id==='pyre'){r.P.leaf=0x524032;r.P.far=0x524b49;for(let x=250;x<=1050;x+=200)r.layers.push({el:'brazier',x,y:550,h:60});}
 if(id==='academy')r.layers.push({el:'pillar',x:400,y:200,w:50,h:290,c:'mid'},{el:'pillar',x:830,y:200,w:50,h:290,c:'mid'});
 B.GROUNDS[id]=r;
}
const original=B.groundFor;
B.groundFor=function(game,mode){
 const q=(game.quest&&game.quest.quest)||(mode==='ambush'&&game.travelResolution&&game.travelResolution.q.quest);
 if(q){ADV.Travel.declare(q);if(B.has(q.travelLocation))return q.travelLocation;}
 return original(game,mode);
};
})();
