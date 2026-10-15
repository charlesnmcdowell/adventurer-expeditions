'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
 // The legacy regression launcher intentionally keeps webdriver on Arcade.
 // Exercise the normal player's default redirect in this dedicated check.
 await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 // No QA chapter override: normal index entry and an existing chapter-five save.
 await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/index.html');await page.getByRole('button',{name:'Begin story',exact:true}).waitFor({timeout:90000});
 const record=JSON.parse(fs.readFileSync('test/reports/story-chapters-5/verification.json')).result.record;
 await page.evaluate(record=>{const S=ADV.Expedition.Story;S.save(S.open(record));},record);
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 for(let i=0;i<5&&!await page.locator('#story-embark').count();i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.locator('#story-embark').click();await page.getByText('Chapter 6',{exact:true}).waitFor();
 assert.equal(await page.locator('.demo-end').count(),0);
 await page.getByRole('button',{name:'Title',exact:true}).click();
 const buttons=await page.locator('#panel button').allTextContents();
 assert(buttons.some(t=>/^14(?:\D|$)/.test(t)),'Chapter 14 jump available without through query');
 const finish=JSON.parse(fs.readFileSync('test/reports/story-chapters-14/verification.json')).result.record;
 await page.evaluate(record=>{const S=ADV.Expedition.Story;S.save(S.open(record));},finish);
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();await page.locator('#epilogue').waitFor();
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#epilogue').getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#story-thanks').waitFor();
 const links=await page.locator('#story-thanks a').evaluateAll(rows=>rows.map(a=>a.href));assert.deepEqual(links,['games','read','fund'].map(s=>'https://neverendingnarratives.com/#'+s));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);fs.mkdirSync('test/reports/story-local-release',{recursive:true});
 await page.screenshot({path:'test/reports/story-local-release/thank-you-phone.png'});
 fs.writeFileSync('test/reports/story-local-release/verification.json',JSON.stringify({defaultBoot:'story',chapter6ExistingSave:true,chapter14Accessible:true,endingReload:true,mobileWidth:390,errors},null,2));
 console.log('Default story boot, existing chapter-six save, chapter-fourteen access and ending reload passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
