'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const X={Story:{}},ADV={Expedition:X},scope={ADV,Phaser:{Scene:class{}},console};
for(const file of ['scene','story_stage','story_scene','actors'])vm.runInNewContext(fs.readFileSync('js/expedition/'+file+'.js','utf8'),scope);
const scene=Object.create(X.StoryBattle.prototype),routes=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json','utf8')).routes;
const locations=[...new Set(Object.values(routes).flat())];
for(const location of locations){
 scene.location=location;assert(X.Story.Stage.groundProfiles[location],location+' missing ground');
 for(let x=0;x<=1280;x+=20)for(const y of [0,430,512,612,900]){
  const p=scene.groundPoint(x,y,{height:330});assert(p.y>=p.minY&&p.y<=710,location+' floor');
  assert(p.minY>=450&&p.minY<=710,location+' invalid ground profile');
 }
}
scene.location='gnoll_fort';
assert(scene.groundPoint(1140,432,{height:330}).y>660,'fort rear row cannot stand on a tower');
const actor=Object.create(X.Actor.prototype);Object.assign(actor,{scene,height:330,root:{x:1140,y:432,setScale(s){this.scaleX=s;}}});
actor.syncPerspective();assert(actor.root.y>660);assert.equal(actor.root.scaleX,scene.perspectiveAt(actor.root.y));
assert(scene.perspectiveAt(430)<scene.perspectiveAt(512));assert.equal(scene.perspectiveAt(612),1);
console.log('PASS: '+locations.length+' story ground profiles, hard floor clamp, continuous depth scale');
