'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions','story_effects'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition,S=X.Story,P=S.Companions,F=X.StoryEffects;
const s=S.open();s.record.chapter=7;S.syncQuest(s);A.Campaign3.recruit(s.game,'fennick');
const winston=P.make(s,'fennick'),original=A.SkillSys.manifest({...winston,expeditionStoryCompanion:null},{skillId:'whisper_of_ending',level:1}).data;
for(const id of ['basic_attack','venom_fang','whisper_of_ending']){
 const d=A.SkillSys.manifest(winston,{skillId:id,level:1}).data;assert(!d.elemental);assert(d.reach!=='any'||d.melee);
 if(id==='whisper_of_ending'){
  for(const key of ['power','hits','shadowDot','withering','healcutRounds'])assert.deepEqual(d[key],original[key],key);
  assert.equal(d.name,'Ending Cut');assert(d.cooldown>=3);assert.equal(d.melee,true);
 }
}
assert(original.elemental,'original skill stays magic for other characters');
for(const [actor,id,effect]of [
 ['story_bandit_archer','basic_attack','aimed_shot'],['story_grell','basic_attack','aimed_shot'],
 ['story_grell','killing_angle','aimed_shot'],['elven_ranger','xp_enchanted_arrow','aimed_shot'],
 ['story_merle','basic_attack','fire_bolt'],['story_malvane','basic_attack','frost_touch'],
 ['enchantress','xp_waning_curse','xp_waning_curse'],['elven_wizard','xp_arcane_volley','xp_arcane_volley']]){
 const r=F.enemyAction({sheet:{actor}},id,A.DATA.SKILLS[id]);assert(r.ranged);assert.equal(r.effect,effect);assert(F.supports(effect));
}
for(const actor of ['story_bahadir','story_tunnel_kobold'])for(const id of ['aimed_shot','snare']){
 const r=F.enemyAction({sheet:{actor}},id,A.DATA.SKILLS[id]);assert(r.weaponStatus);assert(!r.ranged);
}
for(const id of ['shield_wall','defiant_stand','close_order','counter_attack','countersign'])assert.equal(F.stanceFor(id),'intercept');
assert.equal(F.stanceFor('xp_evasive_step'),'roll');assert.equal(F.stanceFor('warding_stance'),null);
for(const [id,effect]of [['shadow_rise','smoke_bomb'],['ghoststep','smoke_bomb'],['warding_stance','ranging_ward'],['beast_shape','thorn_skin']]){
 const r=F.enemyAction({kind:'human'},id,A.DATA.SKILLS[id]);assert.equal(r.effect,effect);assert(F.supports(effect));
}
for(const actor of ['story_femi','elven_wizard','elven_ranger','enchantress','hag','spider']){
 const d=JSON.parse(fs.readFileSync(`assets/expedition/${actor}/${actor}.json`)),c=d.clips.cast;
 assert.equal(c.release,4);assert.deepEqual(c.frames,d.clips.attack.frames);assert.deepEqual(c.frameDurationsMs,d.clips.attack.frameDurationsMs);
 const f=d.frames[c.frames[4]],p=c.releaseAnchor,ss=f.spriteSourceSize;
 assert(p.x>=ss.x&&p.x<=ss.x+ss.w&&p.y>=ss.y&&p.y<=ss.y+ss.h,actor+' release is on the painted firing pose');
}
const ship=JSON.parse(fs.readFileSync('tools/ship_manifest.json')).files;
for(const group of ['chapter-one','nature','frost','weapons','occult','fire','storm','reflected']){
 const path='assets/expedition/story/effects/',d=JSON.parse(fs.readFileSync(path+group+'.json'));
 assert(ship.includes(path+group+'.json'));assert(ship.includes(path+d.image));
}
console.log('PASS Winston knife/status contracts; bows, crossbow and caster identities; six release anchors; Arcade effect shipping');
