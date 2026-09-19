// Family training and recoverable equipment survive ordinary NPC succession.
(function(){
'use strict';
const A=ADV,F={};
F.skills=function(ch){
 const out={};if(!ch)return out;
 for(const e of (ch.perks||[]).concat(ch.actives||[])){
  const d=A.DATA.SKILLS[e.skillId];if(!d||d.unique)continue;
  out[e.skillId]={level:e.level||1,uses:e.uses||0};
 }
 return out;
};
F.mergeSkills=function(...books){const out={};for(const b of books)for(const [id,r]of Object.entries(b||{}))if(!out[id]||r.level>out[id].level||(r.level===out[id].level&&r.uses>out[id].uses))out[id]={level:r.level||1,uses:r.uses||0};return out;};
F.gear=function(ch,sets){
 const all=Array.from(new Set((ch.ownedSets||[]).concat(ch.equippedSet||[],sets||[]))).filter(id=>A.DATA.GEAR_SETS[id]);
 const score=id=>{const d=A.DATA.GEAR_SETS[id],matches=(ch.perks||[]).concat(ch.actives||[]).filter(e=>(d.archetypes||[]).includes((A.DATA.SKILLS[e.skillId]||{}).archetype)).length;return matches*100000+(d.floor||0)*1000+(d.cost||0);};
 all.sort((a,b)=>score(b)-score(a));
 // Issued/unique outfits stay on their owner; ordinary sets may be upgraded.
 const current=A.DATA.GEAR_SETS[ch.equippedSet];
 if(all.length&&!(current&&(current.campaign||current.unique)))ch.equippedSet=all[0];
 ch.ownedSets=all.filter(id=>id!==ch.equippedSet);
 if(A.SkillSys&&A.SkillSys.trimToCap&&!ch.isPlayer)A.SkillSys.trimToCap(ch);
};
const born=A.Character.makeDependent;
A.Character.makeDependent=function(rng,world,mother,fatherId){const child=born.apply(this,arguments);child.familySkills=F.mergeSkills(F.skills(mother),F.skills(A.World.byId(world,fatherId)));return child;};
const mature=A.Character.matureChild;
A.Character.matureChild=function(rng,world,child,motherName){
 const inherited=child.inheritSkills||F.mergeSkills(child.familySkills,F.skills(A.World.byId(world,child.motherId)),F.skills(A.World.byId(world,child.fatherId)));
 const ordered=Object.fromEntries(Object.entries(inherited).sort((a,b)=>b[1].level-a[1].level));
 const c=mature.call(this,rng,world,Object.assign({},child,Object.keys(ordered).length?{inheritSkills:ordered}:{}),motherName);
 for(const id of Object.keys(ordered))c.journal[id]={witnessed:true,learned:c.perks.concat(c.actives).some(e=>e.skillId===id)};
 c.birthId=child.id;F.gear(c,child.pendingGear);return c;
};
const die=A.Death.finalize;
A.Death.finalize=function(world,ch,killerId,cause){
 if(!ch.alive||(ch.hiroNpc&&!ch.isPlayer))return die.apply(this,arguments);
 const killer=A.World.byId(world,killerId),heir=A.Vault.eldestHeir(world,ch);
 const gear=(!killer||!killer.alive)?(ch.ownedSets||[]).concat(ch.equippedSet||[]):[];
 const equipment=(!killer||!killer.alive)?(ch.equipped||[]).slice():[];
 const result=die.apply(this,arguments);
 if(heir&&gear.length){if(heir.adult)F.gear(heir.ch,gear);else heir.child.pendingGear=Array.from(new Set((heir.child.pendingGear||[]).concat(gear)));}
 if(heir&&equipment.length){if(heir.adult)heir.ch.inventory.items.push(...equipment);else {const estate=heir.child.pendingEstate||(heir.child.pendingEstate={gold:0,items:[]});estate.items.push(...equipment);}}
 ch.ownedSets=[];return result;
};
A.FamilySupport=F;
})();
