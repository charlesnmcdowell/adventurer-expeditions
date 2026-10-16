'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8742/docs/COMPANION_DIALOGUE_REVIEW_20261016/');
  const decoded=await p.evaluate(async()=>{
   const result=[];
   for(const a of document.querySelectorAll('audio')){
    a.preload='metadata';
    await new Promise((ok,no)=>{
     const timer=setTimeout(()=>no(Error(a.src)),10000);
     a.onloadedmetadata=()=>{clearTimeout(timer);ok();};
     a.onerror=()=>{clearTimeout(timer);no(Error(a.src));};a.load();
    });
    if(!(a.duration>0))throw Error('Empty recording');
    result.push({src:a.getAttribute('src'),duration:a.duration});
   }
   await document.querySelector('audio').play();return result;
  });
  // Decoder/output warmup is variable; do not mistake a fixed 600 ms wait for a failure.
  await p.waitForFunction(()=>document.querySelector('audio').currentTime>0,{},{timeout:10000});
  assert.equal(decoded.length,45);
  const out='test/reports/story/companion-dialogue';fs.mkdirSync(out,{recursive:true});
  await p.screenshot({path:out+'/desktop.png'});
  await p.setViewportSize({width:390,height:844});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:out+'/phone.png'});assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,decoded,errors},null,2));
  console.log('45 browser audio decodes, advancing playback, desktop and phone review layout passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
