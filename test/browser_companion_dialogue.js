'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const rows=JSON.parse(fs.readFileSync('assets/expedition/story/companion-voice.json')).files;
const base='http://127.0.0.1:8742/',out='test/reports/story/companion-dialogue-production';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{
   const NativeAudio=window.Audio;window.reviewAudio=[];
   window.Audio=function(src){const a=new NativeAudio(src);window.reviewAudio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
  });
  await page.goto(base+'docs/COMPANION_DIALOGUE_REVIEW_20261016/production.html');
  const decoded=await page.evaluate(async()=>{
   const result=[];for(const a of document.querySelectorAll('audio')){
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(a.src)),10000);a.onloadedmetadata=()=>{clearTimeout(timer);resolve();};a.onerror=()=>{clearTimeout(timer);reject(Error(a.src));};a.preload='metadata';a.load();});
    if(!(a.duration>0))throw Error('Empty audio');result.push({src:a.getAttribute('src'),duration:a.duration});
   }return result;
  });assert.equal(decoded.length,156);
  await page.screenshot({path:out+'/review-desktop.png'});
  const samples=[['vess','q2_pair_yes',1,0],['faelen','q6_web',2,0],['wren_ward','q9_lobby_talk',1,0],['selene','q10_double_strike',1,3],['wren_ward','q14_final_restored',1,3]];
  for(const viewport of [{width:1280,height:760},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   for(const [who,key,index,encounter] of samples){
    const sample=rows.find(r=>r.who===who&&r.key===key&&r.index===index),chapter=Number(key.match(/^q(\d+)/)[1]);
    await page.goto(base+'docs/STORY_CAMPAIGN_PREVIEW.html');
    await page.getByRole('button',{name:String(chapter),exact:true}).click();
    // Use the real dev jump to establish authored history, then a focused saved
    // dialogue checkpoint to inspect this exact rewritten segment and its audio.
    await page.evaluate(({sample,chapter,encounter})=>{
     const S=ADV.Expedition.Story,C=ADV.Campaign3,s=window.storyPreview,r=s.record;
     r.chapter=chapter;r.encounter=encounter;r.phase='opener';r.titleCards=Array.from({length:14},(_,i)=>i+1);
     r.reply=null;r.line=sample.index-1;r.companionUnlocksPending=[];delete r.seatOffer;delete r.chapterRewardDue;delete r.travelPending;delete r.hiroChoice;
     ADV.GatePerks.state(s.game).pending=[];
     r.queue=S.Presentation.annotate(s,[{who:sample.who,key:sample.key,fid:'gate',c3:true,lines:C.lines('gate',sample.who,sample.key)}]);
     S.save(s);localStorage.setItem('adventurer_expeditions_story_muted','0');
    },{sample,chapter,encounter});
    await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
    await page.waitForFunction(file=>window.reviewAudio.some(a=>a.src.endsWith(file)&&a.currentTime>0&&!a.paused),sample.file,{timeout:20000});
    const caption=sample.text.replace(/\[[^\]]*\]/g,'').replace(/\{target\}/g,'Hiro').trim();
    assert((await page.locator('#panel').innerText()).includes(caption),'caption '+sample.id);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#dialogue')).opacity)>.99);
    await page.screenshot({path:out+'/chapter-'+chapter+'-'+viewport.width+'.png'});
    checks.push({chapter,viewport,file:sample.file,caption,playback:true});
   }
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({decoded,checks,errors},null,2));
  console.log('156 audio decodes; chapters 2/6/9/10/14 live captions and playing audio, desktop and phone passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
