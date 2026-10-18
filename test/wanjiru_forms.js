'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const P=A.Expedition.Story.Companions,doc=JSON.parse(fs.readFileSync('assets/expedition/companion_nettle/companion_nettle.json'));
const a={unit:{ch:{expeditionStoryCompanion:'nettle'}},sheet:doc};
assert.equal(P.formAttack(a,'thorn_skin'),null);assert.equal(a._natureStrikes,undefined);
assert.equal(P.formAttack(a,'basic_attack'),null);assert.equal(P.formAttack(a,'wither_touch'),'bear');
assert.equal(P.formAttack(a,'thorn_skin'),null);assert.equal(P.formAttack(a,'basic_attack'),null);assert.equal(P.formAttack(a,'basic_attack'),'eagle');
assert.equal(P.formAttack(a,'basic_attack'),null);
assert.equal(P.formAttack({...a,unit:{ch:{expeditionStoryCompanion:'cassian'}}},'basic_attack'),null);
assert.equal(P.formAttack({...a,sheet:{clips:{}}},'basic_attack'),null);
assert.deepEqual(Array.from(P.kits.nettle.skills),['thorn_skin','wither_touch']);assert(!P.casters.nettle);
for(const form of ['bear','eagle']){
 const c=doc.clips['form-'+form];assert.equal(c.frames.length,16);assert.equal(c.formMotion.length,16);assert.deepEqual(c.contact,[7]);assert(!c.paired);assert(!c.loop);
 assert.equal(c.durationMs,c.frameDurationsMs.reduce((a,b)=>a+b));assert.deepEqual(c.formMotion[0],{forward:0,lift:0});assert.deepEqual(c.formMotion[15],{forward:0,lift:0});
 assert.equal(c.formMotion[7].forward,1);assert(c.durationMs>=1500);
 for(const name of c.frames){const f=doc.frames[name],s=f.spriteSourceSize;assert(f&&doc.textures[f.page].frames.some(x=>x.filename===name));assert(s.x>=0&&s.y>=0&&s.x+s.w<=doc.canvas.w&&s.y+s.h<=doc.canvas.h);}
}
assert(doc.clips['form-bear'].formMotion.every(v=>v.lift===0));assert(doc.clips['form-eagle'].formMotion.some(v=>v.lift>.5));
console.log('PASS: Wanjiru occasional forms, support exclusion, 32 drawings, one contact and complete recovery; weapon/stat kit preserved');
