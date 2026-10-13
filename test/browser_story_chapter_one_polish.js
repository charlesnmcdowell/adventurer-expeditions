'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-chapter-one-polish';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],report={};
 page.on('pageerror',e=>errors.push(String(e)));
 async function encounter(n){
  await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');
  await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(n=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,{chapter:1,encounter:n,phase:'combat'});
   s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);},n);
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hero);
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');ADV.Expedition.fx.cinematics=false;
   s.fight=async function(first){await this.intro(first);ADV.Expedition.UI.resetCamera(this);this.__ready=true;};
   s.scene.restart({record:s.story.record,seed:29,muted:true});});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__ready);
 }
 await encounter(1);
 await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='story_cobb');
  s.__attackSeen=new Set();const watch=()=>{if(a.img.frame.name.startsWith('attack/'))s.__attackSeen.add(a.img.frame.name);};s.events.on('update',watch);
  s.__attackDone=false;a.play('slash',{target:s.hero,onContact:()=>{s.__contact=true;s.paused=true;}}).then(()=>{s.events.off('update',watch);s.__attackDone=true;});
 });
 await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__contact);
 await page.screenshot({path:OUT+'/cobb-contact.png'});
 await page.evaluate(()=>{storyGame.scene.getScene('StoryBattle').paused=false;});
 await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__attackDone);
 report.cobb=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='story_cobb');return{frames:s.__attackSeen.size,x:a.root.x,home:a.home.x,scale:a.img.scaleX,native:a._baseScaleX};});
 assert.equal(report.cobb.frames,12);assert.equal(report.cobb.x,report.cobb.home);assert.equal(report.cobb.scale,report.cobb.native);
 await encounter(2);
 for(const id of ['fire_bolt','prismatic_bolt','marked_for_the_knife'])await effect(id);
 report.formation=await page.evaluate(async()=>{
  const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');
  const live=()=>[...s.actors.values()].filter(a=>a.side==='b'&&a.alive).sort((a,b)=>a.home.x-b.home.x);
  const state=()=>live().map(a=>{const p=a.sheet.canvas.pivot.x,k=Math.abs(a._baseScaleX),f=s.textures.getFrame(a.sheet.key,a.sheet.clips.idle.frames[0]);return{uid:a.uid,x:a.root.x,home:a.home.x,right:a.root.x+(f.x+f.width-p)*k,scale:a.img.scaleX};});
  const before=state();
  const killRear=async()=>{const target=live().at(-1);target.unit.chp=0;
   await X.Beats.ticksOnly(s,[{t:'damage',uid:target.uid,by:s.hero.uid,dmg:999,tag:'dot'},{t:'down',uid:target.uid,by:s.hero.uid}]);};
  await killRear();const afterOne=state();await killRear();const afterTwo=state();await s.reformFoes();return{before,afterOne,afterTwo,repeated:state()};
 });
 assert(report.formation.afterOne[0].x>report.formation.before[0].x);
 assert(report.formation.afterTwo[0].x>report.formation.afterOne[0].x);
 assert.deepEqual(report.formation.afterTwo,report.formation.repeated);
 for(const group of [report.formation.afterOne,report.formation.afterTwo])for(const a of group){assert(a.right<=1253);assert.equal(a.x,a.home);assert.equal(a.scale,report.formation.before.find(b=>b.uid===a.uid).scale);}
 await page.screenshot({path:OUT+'/formation-one-survivor.png'});
 await encounter(0);await effect('smoke_bomb');
 async function effect(id){
  await page.evaluate(id=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');
   const foes=[...s.actors.values()].filter(a=>a.side==='b');const a=foes.find(a=>a.unit.ch.actives.some(x=>x.skillId===id));
   if(!a)throw Error('No authored user of '+id);
   s.__effectDone=false;s.__effectFrames=new Set();const watch=()=>{const f=s.children.list.find(c=>c.name==='story_effect_'+id);if(f)s.__effectFrames.add(f.frame.name);};s.events.on('update',watch);
   X.Beats.play(s,{hero:false,events:[{t:'use',uid:a.uid,skillId:id,target:id==='smoke_bomb'?a.uid:s.hero.uid}]}).then(()=>{s.events.off('update',watch);s.__effectDone=true;});
  },id);
  await page.waitForFunction(id=>storyGame.scene.getScene('StoryBattle').children.list.some(c=>c.name==='story_effect_'+id),id);
  await page.waitForTimeout(90);
  const paused=await page.evaluate(id=>{const s=storyGame.scene.getScene('StoryBattle'),f=s.children.list.find(c=>c.name==='story_effect_'+id);s.paused=true;return{x:f.x,y:f.y,frame:f.frame.name};},id);
  await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(id=>{const f=storyGame.scene.getScene('StoryBattle').children.list.find(c=>c.name==='story_effect_'+id);return{x:f.x,y:f.y,frame:f.frame.name};},id),paused);
  await page.screenshot({path:OUT+'/'+id+'.png'});
  await page.evaluate(()=>{storyGame.scene.getScene('StoryBattle').paused=false;});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__effectDone);
  report[id]=await page.evaluate(()=>[...storyGame.scene.getScene('StoryBattle').__effectFrames]);assert.equal(report[id].length,4);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({report,errors},null,2));
 console.log('Chapter one: 12-frame Cobb attack/restore, four authored effects/pause, rear-slot compaction/no drift/no resize passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
