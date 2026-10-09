'use strict';
const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 const p=await b.newPage({viewport:{width:1500,height:1050}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.addInitScript(()=>{localStorage.setItem('adventurer_expeditions_arcade_v1','REVIEW_SAVE_SENTINEL');localStorage.setItem('adventurer_expeditions_prefs_v1','{"sentinel":true}');});
 try{
  await p.goto('http://127.0.0.1:8742/docs/ART_REVIEW.html');
  await p.waitForFunction(()=>window.__artReview?.ready,null,{timeout:30000});
  assert.equal(await p.evaluate(()=>__artReview.entries.length),71);
  assert.equal(await p.evaluate(()=>__artReview.selected.id),'T-CITADEL-ACTION');
  await p.click('#play');await p.fill('#scrub','0');await p.dispatchEvent('#scrub','input');await p.click('#nextFrame');
  assert.equal(await p.evaluate(()=>__artReview.frame),1);
  await p.check('#rework');await p.fill('#note','Portal run repeats the same leg.');await p.click('#cite');
  assert.match(await p.evaluate(()=>__artReview.report()),/REWORK T-CITADEL-ACTION/);
  assert.match(await p.evaluate(()=>__artReview.report()),/Frame 2 \(index 1\)/);
  fs.mkdirSync('test/reports/visual-review',{recursive:true});await p.screenshot({path:'test/reports/visual-review/desktop.png',fullPage:true});
  const all=await p.evaluate(()=>__artReview.entries.map(e=>({id:e.id,kind:e.kind})));
  const result=[];
  for(const e of all){
   await p.evaluate(id=>__artReview.select(id),e.id);
   await p.waitForFunction(id=>__artReview.ready&&window.__reviewReady===id,e.id,{timeout:30000});
   const info=await p.evaluate(()=>{const r=__artReview,s=r.game.scene.getScene('Review');return {id:r.selected.id,texture:s.sprite?.texture.key,meta:r.selected.meta,frames:r.selected.clip?.frames.length,duration:s.pano?.durationMs,background:s.battleArt?.locationId};});
   if(e.kind==='travel'){assert(info.duration>8000);await p.fill('#scrub','5200');await p.dispatchEvent('#scrub','input');}
   if(info.frames){assert(info.frames>0);assert(info.texture&&!info.texture.includes('MISSING'));assert.equal(info.texture,'review_atlas_'+info.meta.replace(/[^a-zA-Z0-9]/g,'_'),'wrong atlas reused: '+info.id);await p.fill('#scrub',String(info.frames-1));await p.dispatchEvent('#scrub','input');assert.equal(await p.evaluate(()=>__artReview.frame),info.frames-1);}
   result.push(info);
  }
  await p.selectOption('#location','citadel');await p.selectOption('#kind','enemy');assert.equal(await p.locator('#items button').count(),4);
  await p.evaluate(()=>__artReview.select('T-CITADEL-JOURNEY'));await p.waitForFunction(()=>__artReview.ready&&__reviewReady==='T-CITADEL-JOURNEY');await p.selectOption('#weather','storm');
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'test/reports/visual-review/mobile.png',fullPage:true});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  assert.equal(await p.evaluate(()=>localStorage.getItem('adventurer_expeditions_arcade_v1')),'REVIEW_SAVE_SENTINEL');
  assert.equal(await p.evaluate(()=>localStorage.getItem('adventurer_expeditions_prefs_v1')),'{"sentinel":true}');
  assert.deepEqual(errors,[]);
  fs.writeFileSync('test/reports/visual-review/results.json',JSON.stringify({result,errors},null,2));
  console.log('71 review items loaded; last-frame access, travel, weather, filters, notes and isolated saves pass.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
