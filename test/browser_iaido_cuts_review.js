'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await b.newPage({viewport:{width:1200,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:8742/docs/art/iaido-cuts-20261016/');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('seconds'));
 fs.mkdirSync('test/reports/iaido-cuts-20261016',{recursive:true});
 for(const id of ['do','neck','kote','men']){
  await page.selectOption('#clip',id);await page.click('#contact');assert.match(await page.locator('#status').innerText(),/PROPOSED CUT CONTACT/);
  await page.selectOption('#view','full');await page.selectOption('#bg','checker');await page.locator('#stage').screenshot({path:'test/reports/iaido-cuts-20261016/'+id+'-cut.png'});
  await page.click('#noto');assert.match(await page.locator('#status').innerText(),/NOTO/);await page.click('#next');await page.click('#next');await page.selectOption('#view','hands');await page.locator('#stage').screenshot({path:'test/reports/iaido-cuts-20261016/'+id+'-noto.png'});
  const before=Number(await page.locator('#frame').inputValue());await page.click('#back');assert.equal(Number(await page.locator('#frame').inputValue()),before-1);
 }
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('Four draw-cut reviews: images, contact/noto markers, frame stepping, close-up and mobile layout passed.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
