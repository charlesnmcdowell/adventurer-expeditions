'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('test/reports/story-nib');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1150,height:950}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8742/docs/art/story-nib/index.html');await page.waitForFunction(()=>window.animationReview?.clips.length===8);
 const counts=await page.evaluate(()=>window.animationReview.clips.map(({id,c})=>({id,frames:c.frames.length,contact:c.contact})));
 for(const [id,frame] of [['idle',0],['attack',6],['down',7],['hiro-finisher-1',5],['hiro-finisher-1',12],['hiro-finisher-2',7],['story_nib-fatal',6],['story_nib-fatal',15]]){
   await page.evaluate(([id,i])=>window.animationReview.set(id,i),[id,frame]);await page.waitForTimeout(60);
   await page.locator('canvas').screenshot({path:path.join(out,id+'-'+frame+'.png')});
 }
 assert.deepEqual(errors,[]);assert(counts.filter(c=>/finisher|fatal/.test(c.id)).every(c=>c.frames===16));
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({counts,errors},null,2));console.log('Nib browser review: eight clips loaded, three 16-frame pairs, contact/recovery captures saved');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
