'use strict';
// Local artifact QA only. Does not load or modify the game.
const fs = require('fs'), path=require('path'),{pathToFileURL}=require('url');
const { chromium }=require('C:/Users/charl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'delivery-validation.json'),'utf8'));
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 await page.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:60000});
 const broken=await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src));
 if(broken.length)errors.push('Broken images: '+broken.join(','));
 const checks=[];
 for(const group of ['All','Hiro','Bram','Beasts','Human','Effects','Icons','Backgrounds']){
   await page.locator('[data-filter="'+group+'"]').click();
   const count=await page.locator('.card:visible').count();
   const want=group==='All'?expected.selected.length:expected.selected.filter(i=>i.group===group).length;
   checks.push({group,count,want});
   if(count!==want)errors.push('Filter count '+group);
 }
 await page.locator('[data-filter="Hiro"]').click();
 await page.screenshot({path:path.join(__dirname,'gallery-desktop.png')});
 await page.locator('[data-filter="All"]').click();
 await page.locator('#search').fill('victory');
 const victory=await page.locator('.card:visible').count();
 checks.push({search:'victory',count:victory,want:2});
 if(victory!==2)errors.push('Victory search');
 await page.locator('#search').fill('');
 await page.setViewportSize({width:375,height:812});
 await page.locator('[data-filter="Hiro"]').click();
 await page.screenshot({path:path.join(__dirname,'gallery-mobile.png')});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 checks.push({mobileWidth:375,horizontalOverflow:overflow});
 if(overflow)errors.push('Mobile horizontal overflow');
 await browser.close();
 const result={scope:'Static art gallery only; no game playback test',status:errors.length?'FAIL':'PASS',brokenImages:broken,checks,errors};
 fs.writeFileSync(path.join(__dirname,'gallery-validation.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 process.exitCode=errors.length?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});

