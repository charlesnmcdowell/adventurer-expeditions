'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='test/reports/entrances';fs.mkdirSync(out,{recursive:true});
(async()=>{const {server,base}=await require('./entrance_server')();const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[],missing=[],results=[];p.setDefaultTimeout(60000);
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))missing.push(r.url());});
 const plan=JSON.parse(fs.readFileSync('docs/ENTRANCE_REVIEW_20261019/plan.json','utf8'));
 const start=process.argv[2];if(start)plan.splice(0,plan.findIndex(r=>r.actor===start));
 for(const row of plan){
  await p.goto(base+'/docs/ENTRANCE_REVIEW_20261019/?actor='+row.actor);await p.waitForFunction(()=>window.reviewReady);
  const before=await p.evaluate(()=>{const a=reviewScene.foe;return {home:{...a.home},scale:[a.img.scaleX,a.img.scaleY],saves:JSON.stringify(localStorage)};});
  await p.evaluate(()=>{window.qaFrames=new Set();reviewScene.events.on('update',()=>{if(reviewScene.__entranceFrame)qaFrames.add(reviewScene.__entranceFrame.frame)});window.task=reviewAction();});
  await p.waitForFunction(()=>reviewScene.__entranceFrame?.frame>=4||!window.reviewBusy);
  await p.evaluate(()=>reviewScene.paused=true);await p.screenshot({path:out+'/'+row.actor+'.png'});
  const frozen=await p.evaluate(()=>JSON.stringify(reviewScene.__entranceFrame));await p.waitForTimeout(90);assert.equal(await p.evaluate(()=>JSON.stringify(reviewScene.__entranceFrame)),frozen,'pause '+row.actor);
  await p.evaluate(()=>reviewScene.paused=false);await p.waitForFunction(()=>!window.reviewBusy);
  const r=await p.evaluate(()=>{const s=reviewScene,a=s.foe;return{frames:[...qaFrames],home:{x:a.root.x,y:a.root.y},scale:[a.img.scaleX,a.img.scaleY],visible:a.img.visible,plate:a.plate.visible,zoom:s.cameras.main.zoom,scroll:[s.cameras.main.scrollX,s.cameras.main.scrollY],left:s.children.list.filter(x=>x.name==='entrance_web'||x.name?.startsWith('entrance_')).map(x=>x.name),saves:JSON.stringify(localStorage),status:document.getElementById('status').textContent};});
  assert.equal(r.home.x,before.home.x,row.actor);assert(Math.abs(r.home.y-before.home.y)<1,row.actor+' ground clamp subpixel convergence');assert.deepEqual(r.scale,before.scale,row.actor);assert.equal(r.visible,true);assert.equal(r.plate,true);assert.equal(r.zoom,1);assert.deepEqual(r.scroll,[0,0]);assert.equal(r.saves,before.saves);assert.deepEqual(r.left,[]);assert.match(r.status,/Ready/);if(row.newArt)assert.equal(r.frames.length,row.frames,row.actor+' every drawing');
  results.push({actor:row.actor,...r,saves:undefined});console.log('PASS',row.actor);
 }
 // Stop during a descending entrance, then replay; owned overlays and sound must release.
 await p.goto(base+'/docs/ENTRANCE_REVIEW_20261019/?actor=story_silksa');await p.waitForFunction(()=>window.reviewReady);await p.evaluate(()=>{window.task=reviewAction()});await p.waitForFunction(()=>reviewScene.__entranceFrame?.lift<0);await p.evaluate(()=>ADV.Expedition.Entrances.cancel(reviewScene));await p.waitForFunction(()=>!window.reviewBusy);assert.equal(await p.evaluate(()=>reviewScene.children.list.filter(x=>x.name==='entrance_web').length),0);
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+'/phone.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(out+(start?'/results-from-'+start+'.json':'/results.json'),JSON.stringify({results,errors,missing},null,2));console.log('PASS:',results.length,'entrances, pause, cancellation, restoration, phone, no missing files or save writes');
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
