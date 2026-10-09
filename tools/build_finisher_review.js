'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const ids=['wolf','plant','alpha','serpent','beetle','moss_giant','hag','goblin','spider','orc','crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress'];
const ADV={Expedition:{UI:{},monsterActors:ids.slice(3)}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/expedition/painted.js'),'utf8'),{ADV});
const entries=[];
function collect(actor,owner,enemy){
 const base='assets/expedition/'+(enemy?'adult/':'')+owner+'/';
 const doc=JSON.parse(fs.readFileSync(path.join(root,base,owner+'.json'),'utf8'));
 const clips=enemy?doc.clips:ADV.Expedition.Painted.sheet({cache:{json:{get:()=>doc}},textures:{exists:()=>true}},owner).clips;
 let n=0;
 for(const [id,original] of Object.entries(doc.clips)){
  const c=clips[id];
  if(!original.paired)continue;
  if(!enemy && ['wolf','plant'].includes(actor) && !id.startsWith(actor+'-'))continue;
  if(!enemy && !['wolf','plant'].includes(actor) && !id.startsWith('hiro-'))continue;
  n++;
  if(!c)continue; // Never renumber the surviving review IDs.
  entries.push({id:(enemy?'M-':'H-')+actor.toUpperCase().replaceAll('_','-')+(enemy?'':'-'+n),
   actor,enemy,clipId:id,clip:c,canvas:doc.canvas,standing:doc.standing,
   textures:doc.textures.map(t=>'../'+base+t.image),
   frames:Object.fromEntries(c.frames.map(k=>[k,doc.frames[k]]))});
 }
}
for(const id of ids)collect(id,['wolf','plant'].includes(id)?'hiro':id,false);
for(const id of ids)collect(id,id+'-fatal',true);
if(entries.length!==51)throw Error('Expected 33 Hiro and 18 enemy finishers, got '+entries.length);
const html=fs.readFileSync(path.join(__dirname,'finisher_review.template.html'),'utf8').replace('/* REVIEW_DATA */',JSON.stringify(entries));
fs.writeFileSync(path.join(root,'docs/FINISHER_REVIEW.html'),html);
console.log('FINISHER_REVIEW.html: '+entries.length+' active finishing moves; opens locally without a server');
