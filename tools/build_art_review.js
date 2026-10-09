'use strict';
// Read shipping art only. This page never boots a run or writes a game save.
const fs=require('fs'),path=require('path'),vm=require('vm'),root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const actors=['wolf','plant','alpha','serpent','beetle','moss_giant','hag','goblin','spider','orc','crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress'];
const context={ADV:{Expedition:{UI:{},monsterActors:actors.slice(3)}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/expedition/painted.js'),'utf8'),context);
const entries=[],place=id=>actors.indexOf(id)<3?'forest':actors.indexOf(id)<7?'swamp':actors.indexOf(id)<10?'city':actors.indexOf(id)<14?'coast':'citadel';
function clipEntry(id,label,kind,location,owner,base,doc,name,c){
 entries.push({id,label,kind,location,owner,base,meta:base+owner+'.json',canvas:doc.canvas,standing:doc.standing,clipId:name,clip:c});
}
for(const enemy of [false,true])for(const actor of actors){
 const owner=enemy?actor+'-fatal':['wolf','plant'].includes(actor)?'hiro':actor;
 const base='assets/expedition/'+(enemy?'adult/':'')+owner+'/',doc=read(base+owner+'.json');
 const clips=enemy?doc.clips:context.ADV.Expedition.Painted.sheet({cache:{json:{get:()=>doc}},textures:{exists:()=>true}},owner).clips;
 let n=0;
 for(const [name,c] of Object.entries(doc.clips)){
  if(!c.paired||!enemy&&!(owner==='hiro'?name.startsWith(actor+'-'):name.startsWith('hiro-')))continue;
  n++;if(!clips[name])continue;
  clipEntry((enemy?'M-':'H-')+actor.toUpperCase().replaceAll('_','-')+(enemy?'':'-'+n),(enemy?actor.replaceAll('_',' ')+' → Hiro':'Hiro → '+actor.replaceAll('_',' ')+' · '+n),enemy?'enemy':'hero',place(actor),owner,base,doc,name,clips[name]);
 }
}
const travel=[['FOREST','forest','rain',1,'forest-carriage-vault','Carriage vault'],['SWAMP','swamp','marsh',1,'swamp-log-slide','Log slide'],['MARKET','city','city',0,'city-market-vault','Market vault'],['ROOFTOP','city','city',2,'city-rooftop-run','Rooftop run'],['COAST','coast','coast',1,'coast-mast-vault','Hang-glider'],['CITADEL','citadel','citadel',1,'citadel-bridge-leap','Portal jutsu']];
for(const [short,location,quest,wave,artId,label] of travel){
 const base='assets/expedition/travel/'+artId+'/',doc=read(base+'actions.json');
 entries.push({id:'T-'+short+'-JOURNEY',label:label+' · full journey',kind:'travel',location,quest,wave,artId});
 clipEntry('T-'+short+'-ACTION',label+' · action poses', 'action',location,'actions',base,doc,'travel',doc.clips.travel);
}
for(const [id,location,quest,bg,label] of [
 ['FOREST','forest','rain','deep_wood','Forest'],['ROAD','forest','rain','bandit_road','Rain road'],['MOUNTAIN','forest','rain','mountain','Mountain'],['SWAMP','swamp','marsh','marsh','Swamp'],['CITY','city','city','alley','City market'],['COAST','coast','coast','coast','Coast'],['CITADEL','citadel','citadel','citadel','Arcane Citadel']])entries.push({id:'B-'+id,label:label+' · battle scenery',kind:'background',location,quest,bg});
const h=read('assets/expedition/hiro/hiro.json');clipEntry('R-HIRO','Hiro · standard run cycle','run','all','hiro','assets/expedition/hiro/',h,'walk',h.clips.walk);
if(entries.length!==71)throw Error('Review inventory changed: '+entries.length);
const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="[^"]+"><\/script>/g)].map(m=>m[0]).join('\n');
const html=fs.readFileSync(path.join(__dirname,'art_review.template.html'),'utf8').replace('<!-- GAME_MODULES -->',scripts).replace('/* REVIEW_DATA */',JSON.stringify(entries));
fs.writeFileSync(path.join(root,'docs/ART_REVIEW.html'),html);
console.log('ART_REVIEW: 71 items — 51 finishers, 6 journeys, 6 action sheets, 7 settings, Hiro run.');
