'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const OUT='test/reports/website-marketing';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const context=await b.newContext({permissions:['clipboard-read','clipboard-write']}),p=await context.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e)));
await p.goto('http://127.0.0.1:8887/',{waitUntil:'networkidle'});
for(const size of [{width:1440,height:1000},{width:390,height:844},{width:375,height:667}]){
 await p.setViewportSize(size);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 await p.screenshot({path:OUT+'/home-'+size.width+'.png'});
 await p.locator('#games').scrollIntoViewIfNeeded();await p.screenshot({path:OUT+'/games-'+size.width+'.png'});
 assert.equal(await p.locator('#games article').count(),2);
 assert.equal(await p.locator('#game-adventurer a').first().getAttribute('href'),'/adventurer/');
 assert.equal(await p.locator('#game-expeditions a').first().getAttribute('href'),'/expeditions/');
 assert(await p.locator('#games img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth===1280)));
 await p.locator('#fund').scrollIntoViewIfNeeded();await p.locator('#copy-cashtag').click();
 assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),'$Hiroprotagonist36');
 await p.screenshot({path:OUT+'/donate-'+size.width+'.png'});
}
assert.equal(await p.locator('a[href="https://cash.app/$Hiroprotagonist36"]').count(),1);
assert.equal(await p.locator('#fund-bar').getAttribute('data-raised'),'425','recorded donations preserved');
assert(!(await p.locator('body').innerText()).includes('three games'));
assert.equal(await p.locator('a[href*="facebook.com/search"]').count(),0);
assert(await p.locator('a[href="https://www.facebook.com/neverendingnarratives"]').count()>0);
await p.locator('#mobile-menu-button').click();assert(await p.locator('#mobile-menu').isVisible());
await p.locator('#mobile-menu a[href="#fund"]').click();assert(!(await p.locator('#mobile-menu').isVisible()));
assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/qa.json',JSON.stringify({passed:true,viewports:[1440,390,375],errors},null,2));
console.log('Website marketing: two game routes, covers, mobile navigation, donation link, copied recipient and preserved total passed');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
