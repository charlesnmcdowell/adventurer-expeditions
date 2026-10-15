'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-travel';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];page.setDefaultTimeout(90000);
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 for(let chapter=2;chapter<=14;chapter++)for(const leg of ['outbound',...(chapter<14?['return']:[])]){
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/docs/STORY_CAMPAIGN_PREVIEW.html');await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(({chapter,leg})=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,{chapter,encounter:0,phase:leg==='outbound'?'inn':'closing',completed:Array.from({length:chapter-1},(_,i)=>i+1)});S.syncQuest(s);
   if(leg==='outbound')S.leaveInn(s);else{ s.record.queue=[];S.nextPhase(s); }S.save(s);
  },{chapter,leg});
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
  await page.waitForFunction(()=>storyBackdrop.game.scene.getScene('StoryBackdrop')?.art?.artId);
  const read=()=>page.evaluate(()=>{const s=storyBackdrop.game.scene.getScene('StoryBackdrop');return{state:storyBackdrop.state(),elapsed:s.travelElapsed,ms:s.art.durationMs,layers:s.art.layerOrder,phase:storyPreview.record.phase,pending:storyPreview.record.travelPending};});
  const a=await read();await page.waitForTimeout(350);const b=await read();assert(b.elapsed>a.elapsed);assert.deepEqual(b.layers,['distance','weather-scenery','hero-ground']);assert.equal(b.pending.chapter,chapter);assert(b.ms>=6000);
  if(chapter===2&&leg==='outbound'){
   await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();await page.waitForFunction(()=>storyBackdrop.game.scene.getScene('StoryBackdrop')?.art?.artId);
   assert.equal((await read()).pending.leg,leg,'reload resumes outbound');
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
   const rect=await page.locator('#animated-background canvas').boundingBox();assert(rect.x>=-1&&rect.x+rect.width<=391,'phone whole canvas visible');await page.screenshot({path:OUT+'/phone.png'});await page.setViewportSize({width:1280,height:760});
  }
  if(leg==='outbound')await page.screenshot({path:OUT+'/chapter-'+chapter+'.png'});
  if(chapter!==2||leg!=='outbound')await page.evaluate(()=>{const s=storyBackdrop.game.scene.getScene('StoryBackdrop');s.travelElapsed=s.art.durationMs-30;});
  await page.waitForFunction(()=>!storyPreview.record.travelPending);
  const end=await page.evaluate(()=>({chapter:storyPreview.record.chapter,phase:storyPreview.record.phase,completed:storyPreview.record.completed}));
  if(leg==='outbound'){assert.equal(end.chapter,chapter);assert.equal(end.phase,'departure');}else{assert([chapter,chapter+1].includes(end.chapter));assert(['arrival','inn'].includes(end.phase));if(end.phase==='inn')assert(end.completed.includes(chapter),'empty arrival still records chapter');}
  results.push({chapter,leg,art:b.state.run.questId,ms:b.ms,layers:b.layers,end});console.log('chapter '+chapter+' '+leg+' passed');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({results,errors},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

