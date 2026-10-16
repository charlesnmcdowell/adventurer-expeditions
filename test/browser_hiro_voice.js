'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const out='test/reports/story/hiro-voice';fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],voices=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(r.url().includes('/campaign/hiro/'))voices.push(r.url());});
  await page.addInitScript(()=>{
   window.__voiceEvents=[];
   const Native=window.Audio;
   window.Audio=function(src){const a=new Native(src);for(const type of ['play','ended','pause'])a.addEventListener(type,()=>window.__voiceEvents.push({src,type,time:Date.now()}));return a;};
  });
  const button=name=>page.getByRole('button',{name,exact:true});
  await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?revision=hiro-choice-voice');
  await button('Begin story').click();await button('Continue').click();await button('Continue').click();
  await button('Why tonight? What has happened?').click();
  await page.locator('#hiro-choice').waitFor();
  await page.screenshot({path:out+'/choice-playing.png'});
  await page.waitForFunction(()=>window.__voiceEvents.some(e=>e.type==='ended'&&e.src.includes('hiro/q1_wake_why')));
  await button('I will get my things.').waitFor();
  assert.equal(await page.evaluate(()=>storyPreview.record.hiroChoice),undefined);
  await button('I will get my things.').click();await page.locator('#hiro-choice').waitFor();
  await page.reload();await button('Continue story').click();await page.locator('#hiro-choice').waitFor();
  await page.locator('#hiro-choice').getByRole('button',{name:'Continue',exact:true}).click();
  await page.waitForTimeout(200);assert.equal(await page.locator('#hiro-choice').count(),0);
  const stage=await page.evaluate(()=>JSON.stringify(storyPreview.record.c3));
  await page.waitForTimeout(4000);assert.equal(await page.evaluate(()=>JSON.stringify(storyPreview.record.c3)),stage,'cancelled speech did not advance story twice');
  await button('Mute').click();await button('Continue').click();
  await button('No one. The same faces as every day.').click();
  assert.equal(await page.locator('#hiro-choice').count(),0,'muted choice continues without audio wait');
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile horizontal overflow');
  assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,voices,events:await page.evaluate(()=>__voiceEvents)},null,2));
  console.log('Hiro voice: playback, reload, skip, no duplicate choice, mute and mobile passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
