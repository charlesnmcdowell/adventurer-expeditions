'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-travel-frames';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],results=[];
 page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 for(const [chapter,leg,id] of [[6,'outbound','swamp-log-slide'],[9,'outbound','city-market-vault'],[9,'return','city-rooftop-run']]){
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/docs/STORY_CAMPAIGN_PREVIEW.html');
  await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(({chapter,leg})=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,{chapter,encounter:0,phase:leg==='outbound'?'inn':'closing',completed:Array.from({length:chapter-1},(_,i)=>i+1)});S.syncQuest(s);if(leg==='outbound')S.leaveInn(s);else{s.record.queue=[];S.nextPhase(s);}S.save(s);},{chapter,leg});
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
  await page.waitForFunction(id=>storyBackdrop.game.scene.getScene('StoryBackdrop')?.art?.artId===id,id);
  for(let frame=2;frame<=8;frame++){
   const result=await page.evaluate(frame=>{
    const s=storyBackdrop.game.scene.getScene('StoryBackdrop'),p=s.art;
    const d=s.cache.json.get('travel_'+p.artId),start=d.actionStartFrame??1;
    const ms=p.runInMs+d.frames.slice(start,frame).reduce((n,f)=>n+f.ms,0)+d.frames[frame].ms*.4;
    // Draw one selected real frame without advancing the story completion clock.
    storyBackdrop.pause(false);p.seek(ms);s.travelElapsed=ms;
    return {id:p.artId,frame:p.currentFrame,ms,layers:p.layerOrder,canvas:d.canvas};
   },frame);
   assert.equal(result.frame,frame);await page.waitForTimeout(20);
   await page.evaluate(()=>storyBackdrop.pause(true));
   await page.screenshot({path:OUT+'/'+id+'-'+frame+'.png'});results.push(result);
  }
  await page.evaluate(()=>storyBackdrop.pause(false));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({results,errors},null,2));
 console.log('21 repaired travel action frames rendered across swamp, market and rooftop; no asset errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
