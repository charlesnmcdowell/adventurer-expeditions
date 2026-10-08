'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const X={UI:{},monsterActors:['serpent','beetle','moss_giant','hag','goblin','spider','orc']};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/expedition/painted.js'),'utf8'),{ADV:{Expedition:X}});
const expected={hiro:['plant-stem-cut-paired'],alpha:['hiro-alpha-pin-paired'],serpent:['hiro-finisher-2'],beetle:['hiro-finisher-2'],goblin:['hiro-finisher-2'],spider:['hiro-finisher-1']};
for(const [id,removed] of Object.entries(expected)){
 const j=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/expedition',id,id+'.json'),'utf8'));
 const s=X.Painted.sheet({cache:{json:{get:()=>j}},textures:{exists:()=>true}},id);
 for(const name of removed){assert(j.clips[name],'archive must remain');assert(!s.clips[name],'rejected move exposed');}
 assert(Object.entries(s.clips).some(([name,c])=>c.paired&&!name.startsWith('bite-')),'no surviving finisher');
}
console.log('finisher_removals: all six excluded, source metadata preserved');
