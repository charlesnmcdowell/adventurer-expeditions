'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];
 p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 for(const which of ['archers','grell','rennick']){
  await p.goto('http://127.0.0.1:8742/docs/COMBAT_POLISH_REVIEW_20261019.html?case='+which);
  await p.waitForFunction(()=>window.reviewScene);
  const save=await p.evaluate(()=>JSON.stringify(localStorage));
  for(const button of await p.locator('#actions button').all()){
   await button.click();await p.waitForFunction(()=>!window.reviewBusy);
   assert.match(await p.locator('#status').textContent(),/^Ready/);
  }
  assert.equal(await p.evaluate(()=>JSON.stringify(localStorage)),save,'review never changes saved progress');
  await p.screenshot({path:'test/reports/chapter10-polish/review-'+which+'.png'});
 }
 // Cancel resurrection while emerging. The owned mask/effect must not survive.
 const cancel=await p.evaluate(async()=>{
  const s=reviewScene,X=ADV.Expedition,a=[...s.actors.values()].find(a=>a.side==='b');
  const promise=X.StoryEffects.resurrect(s,a);
  await new Promise(resolve=>{const f=()=>{if(a.__rising&&s.children.list.some(x=>x.__riserUid===a.uid)){s.events.off('update',f);resolve();}};s.events.on('update',f);});
  s.ended=true;s.events.emit('update',0,16);await promise;
  return {mask:!!a.img.mask,y:a.img.y,alpha:a.img.alpha,effects:s.children.list.filter(x=>x.__riserUid===a.uid).length};
 });assert.deepEqual(cancel,{mask:false,y:0,alpha:1,effects:0});
 await p.setViewportSize({width:390,height:844});await p.goto('http://127.0.0.1:8742/docs/COMBAT_POLISH_REVIEW_20261019.html');await p.waitForFunction(()=>window.reviewScene);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:'test/reports/chapter10-polish/review-phone.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('test/reports/chapter10-polish/review-verification.json',JSON.stringify({cases:3,savePreserved:true,cancel,errors},null,2));
 console.log('PASS review: all replay controls, unchanged save, resurrection cancellation, desktop/phone and no load errors');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
