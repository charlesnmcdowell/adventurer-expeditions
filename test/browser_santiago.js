'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{window.__spoken=[];const Native=window.Audio;window.Audio=function(src){const a=new Native(src);a.addEventListener('playing',()=>__spoken.push(src));return a;};});
  await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?revision=santiago20261016');
  await page.getByRole('button',{name:'Begin story',exact:true}).waitFor();
  await page.evaluate(()=>{
   const S=ADV.Expedition.Story,r=S.fresh();r.chapter=2;r.completed=[1];r.phase='opener';
   r.queue=[{who:'cassian',key:'q2_cassian',artLocation:'forest'}];S.save(S.open(r));
  });
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
  await page.locator('#dialogue .speech').filter({hasText:'Wolves in that den'}).waitFor();
  const unmute=page.getByRole('button',{name:'Unmute',exact:true});if(await unmute.count())await unmute.click();
  await page.getByRole('button',{name:'Replay line',exact:true}).click();
  await page.waitForFunction(()=>__spoken.some(s=>s.includes('q2_cassian_1_santiago20261016.mp3')));
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.locator('#dialogue .speech').filter({hasText:"I'm a squire"}).waitFor();
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
  await page.locator('#dialogue .speech').filter({hasText:"I'm a squire"}).waitFor();
  const decoded=await page.evaluate(async()=>{
   const data=await fetch('assets/expedition/story/santiago-voice.json').then(r=>r.json()),results=[];
   for(const row of data.files){
    const a=new Audio('assets/expedition/story/media/'+row.file);a.preload='metadata';
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Audio timeout '+row.id)),10000);a.onloadedmetadata=()=>{clearTimeout(timer);resolve();};a.onerror=()=>{clearTimeout(timer);reject(Error('Decode '+row.id));};a.load();});
    if(!Number.isFinite(a.duration)||a.duration<=.1)throw Error('Invalid duration '+row.id);
    results.push({id:row.id,duration:a.duration});a.src='';
   }return results;
  });
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(errors.length,0,errors.join('\n'));
  fs.mkdirSync('test/reports/story/santiago',{recursive:true});
  await page.screenshot({path:'test/reports/story/santiago/mobile.png'});
  fs.writeFileSync('test/reports/story/santiago/result.json',JSON.stringify({passed:true,decoded},null,2));
  console.log('Santiago browser: real dialogue, new voice playback/replay, saved line resume, mobile and all 29 audio decodes passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
