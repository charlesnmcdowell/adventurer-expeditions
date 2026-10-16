'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const out='test/reports/story/companions';fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],sounds=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(r.url().includes('companion-unlocked.mp3'))sounds.push(r.url());});
 await page.route('**/js/expedition/story_companions.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('enabled:false','enabled:true')});});
 const home='http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html';await page.goto(home);
 await page.getByRole('button',{name:'Begin story',exact:true}).waitFor();
 await page.evaluate(()=>{const S=ADV.Expedition.Story,C=ADV.Campaign3,s=S.open();s.record.chapter=2;s.record.phase='inn';S.syncQuest(s);
  for(const id of ['wren_ward','vess','fennick'])C.recruit(s.game,id);S.Companions.queueUnlocks(s,[]);S.save(s);});
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 await page.locator('#companion-unlocked').waitFor();await page.screenshot({path:out+'/unlock-hiwot.png'});
 await page.locator('#companion-unlocked button').click();await page.locator('#companion-unlocked h1').filter({hasText:'Desmond'}).waitFor();
 // Claim is saved before playback, so reloading cannot repeat Desmond's moment.
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 await page.locator('#companion-unlocked h1').filter({hasText:'Winston'}).waitFor();await page.locator('#companion-unlocked button').click();
 await page.locator('#story-party').click();await page.locator('#companion-picker').waitFor();
 assert.equal(await page.locator('.companion-list button[aria-pressed=true]').count(),2);
 await page.locator('[data-companion=wren_ward]').click();await page.screenshot({path:out+'/picker-desktop.png'});
 await page.getByRole('button',{name:'Ready',exact:true}).click();
 const saved=await page.evaluate(()=>ADV.Expedition.Story.load().fightingCompanions);assert(saved.includes('wren_ward')&&saved.length===2);
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();await page.locator('#story-inn').waitFor();
 assert.equal(await page.locator('#companion-unlocked').count(),0);
 await page.setViewportSize({width:390,height:844});await page.locator('#story-party').click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:out+'/picker-mobile.png'});
 await page.getByRole('button',{name:'Fight alone',exact:true}).click();assert.deepEqual(await page.evaluate(()=>ADV.Expedition.Story.load().fightingCompanions),[]);
 // Mute prevents the unlock sound request, including a newly recruited character.
 const before=sounds.length;await page.evaluate(()=>{localStorage.setItem('adventurer_expeditions_story_muted','1');const S=ADV.Expedition.Story,s=S.open(S.load()),before=ADV.Campaign3.roster(s.game);ADV.Campaign3.recruit(s.game,'cassian');S.Companions.queueUnlocks(s,before);S.save(s);});
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();await page.locator('#companion-unlocked').waitFor();
 await page.waitForTimeout(2600);assert.equal(sounds.length,before);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/picker.json',JSON.stringify({passed:true,savedPair:saved,mutedJingle:true,errors},null,2));
 console.log('Companion UI: unlock once/reload, newest pair, swap, explicit solo, mute and mobile passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
