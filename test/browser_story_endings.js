'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-endings';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],audio=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(r.url().endsWith('.mp3'))audio.push(r.url());});
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.getByRole('button',{name:'Begin story',exact:true}).waitFor();
 const ids=await page.evaluate(()=>Object.keys(ADV.Expedition.Story.Presentation.data.endings));
 for(const id of ids){
  await page.evaluate(id=>{const S=ADV.Expedition.Story,s=S.open();s.record.chapter=14;s.record.phase='complete';s.game.meta.c3.ending=id;S.save(s);},id);
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();await page.locator('#epilogue').waitFor();
  assert(await page.locator('.ending-scroll p').count()>0);
  await page.getByRole('button',{name:'Read aloud',exact:true}).click();await page.waitForTimeout(200);
  assert.equal(await page.getByRole('button',{name:'Stop narration',exact:true}).count(),1);
  if(['restored','ascended'].includes(id))await page.screenshot({path:OUT+'/'+id+'.png'});
  await page.getByRole('button',{name:'Back to title',exact:true}).click();assert.equal(await page.locator('#epilogue').count(),0);
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Continue story',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:OUT+'/mobile.png'});
 assert(audio.some(a=>a.includes('/aldric/endcard_')),'Original Tesfaye narration was requested');
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({ids,audio,errors},null,2));console.log('Story ending cards: all seven original branches, Tesfaye narration, close cleanup and mobile layout passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
