'use strict';
// The source's peaceful Nib branch must transfer the first-fight guide to Cobb.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const OUT='test/reports/story-spared';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
 await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
 const spared=await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open();s.record.phase='opener';s.record.queue=[];
  S.choose(s,{choice:'q1_nib',who:'nib'},'run');s.record.queue=[];S.nextPhase(s);s.record.queue=[];S.nextPhase(s);S.save(s);
  return{encounter:s.record.encounter,tutorial:s.record.tutorialFightStarted,outcomes:s.record.outcomes};});
 assert.equal(spared.encounter,1);assert.equal(spared.tutorial,false);
 await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
 await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hud?._gateFor);
 const first=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return{tutorial:s.enc.storyTutorial,encounter:s.story.record.encounter,gate:s.hud._gateFor,worldBodies:s.matter?.world?.localWorld?.bodies?.length||0};});
 assert(first.tutorial);assert.equal(first.encounter,1);assert.equal(first.worldBodies,0);
 await page.screenshot({path:OUT+'/cobb-first-guide.png'});
 // Force a genuine defeat presentation at this checkpoint, then reload before retry.
 const defeatZoom=await page.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),X=ADV.Expedition;
  s.fight=async()=>{};s.hero.unit.chp=0;s.enc.st.over=true;
  const foe=[...s.actors.values()].find(a=>a.side==='b');
  await X.Beats.ticksOnly(s,[{t:'damage',uid:s.hero.uid,by:foe.uid,dmg:999,tag:'dot'},{t:'down',uid:s.hero.uid}]);await s.defeat();return s.cameras.main.zoom;});
 assert.equal(defeatZoom,1);
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
 await page.getByRole('button',{name:'Continue campaign preview',exact:true}).click();
 await page.getByRole('button',{name:'Retry fight',exact:true}).click();
 const frame=await page.locator('iframe').elementHandle().then(e=>e.contentFrame());
 await frame.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hud?._gateFor);
 const retry=await frame.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle').story;return{encounter:s.record.encounter,outcomes:s.record.outcomes};});
 assert.equal(retry.encounter,1);assert.deepEqual(retry.outcomes,spared.outcomes);
 const restored=await frame.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return{tutorial:s.enc.storyTutorial,hp:s.hero.unit.chp,max:s.hero.unit.maxHp,zoom:s.cameras.main.zoom};});
 assert(restored.tutorial);assert.equal(restored.hp,restored.max);assert.deepEqual(errors,[]);
 fs.writeFileSync(OUT+'/verification.json',JSON.stringify({spared,first,defeatZoom,retry,restored,errors},null,2));
 console.log('Spared Nib: guide transfers to Cobb; defeat, reload and retry preserve source outcome and restore health');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
