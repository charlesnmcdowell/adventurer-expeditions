'use strict';
// Real story encounters, not a mock stage: check the combat-only plates and
// fixed contact plane, then save desktop/phone evidence for visual floor QA.
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-grounding';fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:760}});
  const page=await context.newPage(),errors=[],report=[];
  page.on('pageerror',e=>errors.push(String(e)));
  for(const id of ['dunmere','ford']){
   await page.setViewportSize({width:1280,height:760});
   await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');
   await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
   await page.evaluate(id=>{
    const S=ADV.Expedition.Story,s=S.open(),encounter=S.Presentation.data.routes[3].indexOf(id);
    if(encounter<0)throw Error('Missing chapter-three location '+id);
    Object.assign(s.record,{chapter:3,encounter,phase:'combat'});
    s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);
   },id);
   await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
   await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hero);
   await page.evaluate(()=>{
    const s=storyGame.scene.getScene('StoryBattle');
    ADV.Expedition.fx.cinematics=false;
    s.fight=async function(first){await this.intro(first);ADV.Expedition.UI.resetCamera(this);this.__groundReady=true;};
    s.scene.restart({record:s.story.record,seed:29,muted:true});
   });
   await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__groundReady);
   const sample=()=>page.evaluate(()=>{
    const S=ADV.Expedition.Story,s=storyGame.scene.getScene('StoryBattle'),root=s.battleArt;
    return {location:s.location,file:S.Stage.files[s.location],
     original:S.Presentation.data.art.environments[s.location].file,
     width:root.background.width,height:root.background.height,
     backgroundX:root.background.x,groundX:root.layers[1].x,
     layers:root.layerOrder,water:S.Stage.profiles[s.location].water||[],
     heroHeight:s.hero.height,feet:[...s.actors.values()].map(a=>({name:a.name,x:a.root.x,y:a.root.y})),
     zoom:s.cameras.main.zoom};
   });
   const before=await sample();
   assert.equal(before.location,id);
   assert(before.file.endsWith(id+'-combat-20261011.webp'));
   assert(before.original.endsWith('environment_'+id+'.webp'),'dialogue painting retained');
   assert.equal(before.width,1280);assert.equal(before.height,760);
   assert.equal(before.heroHeight,330);assert.equal(before.zoom,1);
   assert.deepEqual(before.layers,['distance','weather-scenery','hero-ground']);
   for(const foot of before.feet)assert(foot.y>=580&&foot.y<=665,foot.name+' contact line');
   for(const rect of before.water)assert((rect[1]+rect[3])*760<500,'water must stay behind the bank');
   await page.waitForTimeout(1100);
   const after=await sample();assert.notEqual(before.backgroundX,after.backgroundX);
   assert.equal(before.groundX,after.groundX,'contact plane must not drift');
   await page.screenshot({path:OUT+'/'+id+'-desktop.png'});
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
   await page.screenshot({path:OUT+'/'+id+'-phone.png'});
   report.push(before);
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(OUT+'/verification.json',JSON.stringify({report,errors},null,2));
  console.log('Dunmere/ford: combat plates, native fighter size, grounded feet, moving distance, fixed floor, desktop/phone and no page errors passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
