'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const out='test/reports/story/formation';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 for(const [pair,width,height] of [[['wren_ward','vess'],1280,760],[['dorran','bramm'],1280,760],[['fennick','durnik'],390,844]]){
  const p=await b.newPage({viewport:{width,height}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const response=await route.fetch();let body=await response.text();
   body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());pilot.record.chapter=7;pilot.record.encounter=0;pilot.record.phase='combat';pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
    for(const id of ${JSON.stringify(pair)}){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}
    S.Companions.select(pilot,${JSON.stringify(pair)});const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__ready=true;};`);
   await route.fulfill({response,body});});
  await p.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?formation=1');
  try{await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:60000});}catch(e){console.error({pair,errors,body:await p.locator('body').innerText(),state:await p.evaluate(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');return {ready:s?.__presentationReady,ended:s?.ended,loading:s?.load?.isLoading()};})});throw e;}
  const geometry=await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.paused=true;return [...s.actors.values()].map(a=>({id:a.unit.ch.expeditionStoryCompanion||a.kind,side:a.side,x:a.x,y:a.y,height:a.height,perspective:a.root.scaleX,scale:a.img.scaleX,...s.idleExtents(a)}));});
  const allies=geometry.filter(a=>a.side==='a').sort((a,b)=>a.x-b.x),foes=geometry.filter(a=>a.side==='b');
  assert.equal(allies.length,3);
  assert(allies[1].x-allies[0].x>=140);assert(allies[2].x-allies[1].x>=140);
  for(const a of geometry){assert(a.x+a.left>=20,JSON.stringify(a));assert(a.x+a.right<=1253,JSON.stringify(a));assert(a.y-a.height*a.perspective>=100,JSON.stringify(a));}
  assert(Math.min(...foes.map(a=>a.x+a.left))-Math.max(...allies.map(a=>a.x+a.right))>=100,'centre should remain clear');
  await p.screenshot({path:out+'/'+pair.join('-')+'-'+width+'.png'});
  await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);
  // Real actor playback must meet a rear-row foe and return to its own slot.
  const action=await p.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),a=s.hero,target=[...s.actors.values()].filter(a=>a.side==='b').at(-1);
   const start={x:a.x,y:a.y,scale:a.img.scaleX,perspective:a.root.scaleX};let contact;
   await a.play('slash',{target,onContact:()=>contact={x:a.x,y:a.y,targetY:target.y,perspective:a.root.scaleX,targetPerspective:target.root.scaleX}});
   return {start,contact,end:{x:a.x,y:a.y,scale:a.img.scaleX,perspective:a.root.scaleX}};});
  assert(action.contact.x>action.start.x+100);assert(Math.abs(action.contact.y-action.contact.targetY)<1);assert.deepEqual(action.end,action.start);assert(Math.abs(action.contact.perspective-action.contact.targetPerspective)<.01);
  assert.deepEqual(errors,[]);results.push({pair,width,height,geometry,action});await p.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));console.log('PASS: spaced full-size party/enemies, clear centre, desktop/mobile, rear-row melee and return');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
