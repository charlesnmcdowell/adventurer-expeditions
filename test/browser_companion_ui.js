'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const out='test/reports/story/companions';fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],sounds=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(r.url().includes('companion-unlocked.mp3'))sounds.push(r.url());});
 const home='http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html';await page.goto(home);
 await page.getByRole('button',{name:'Begin story',exact:true}).waitFor();
 await page.evaluate(()=>{const S=ADV.Expedition.Story,C=ADV.Campaign3,s=S.open();s.record.chapter=2;s.record.phase='inn';S.syncQuest(s);
  C.recruit(s.game,'wren_ward');S.Companions.queueUnlocks(s,[]);S.save(s);});
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_story_v1'))});throw e;}
 await page.locator('#story-inn').waitFor();assert.equal(await page.locator('#companion-unlocked').count(),0,'Hiwot waits through inn');
 await page.locator('#story-embark').click();
 await page.locator('.chapter-card').waitFor({timeout:45000});assert.equal(await page.locator('#companion-unlocked').count(),0,'title before join');
 await page.locator('.chapter-card button').click();await page.locator('#companion-unlocked').waitFor();
 await page.waitForTimeout(2800);assert.equal(await page.locator('#companion-unlocked').count(),1,'no auto-dismiss');
 await page.screenshot({path:out+'/unlock-hiwot.png'});
 assert.deepEqual(await page.evaluate(()=>ADV.Expedition.Story.load().companionUnlocksSeen||[]),[]);
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_story_v1'))});throw e;}await page.locator('#companion-unlocked').waitFor();
 await page.getByRole('button',{name:'Accept',exact:true}).press('Enter');await page.locator('#companion-confirm').waitFor();
 assert.equal(await page.locator('.party-member').count(),2);await page.screenshot({path:out+'/confirm-hiwot.png'});
 await page.getByRole('button',{name:'Set out',exact:true}).click();await page.locator('#dialogue').waitFor();
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_story_v1'))});throw e;}await page.locator('#dialogue').waitFor();
 assert.equal(await page.locator('#companion-unlocked,#companion-confirm').count(),0);
 // A later actual recruitment queues a welcome without changing accepted Hiwot.
 await page.evaluate(()=>{const S=ADV.Expedition.Story,C=ADV.Campaign3,s=S.open(S.load()),before=C.roster(s.game);C.recruit(s.game,'vess');C.recruit(s.game,'fennick');S.Companions.queueUnlocks(s,before);S.save(s);});
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_story_v1'))});throw e;}
 for(const name of ['Desmond','Winston']){await page.locator('#companion-unlocked h1').filter({hasText:name}).waitFor();await page.getByRole('button',{name:'Accept',exact:true}).click();}
 await page.locator('#companion-confirm').waitFor();await page.getByRole('button',{name:'Change',exact:true}).click();
 await page.locator('[data-companion=vess]').click();await page.getByRole('button',{name:'Ready',exact:true}).click();await page.locator('#companion-confirm').waitFor();
 const saved=await page.evaluate(()=>ADV.Expedition.Story.load().fightingCompanions);assert(saved.includes('vess')&&saved.length===2);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/confirm-mobile.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'Change',exact:true}).click();await page.getByRole('button',{name:'Fight alone',exact:true}).click();
 await page.locator('#companion-confirm').waitFor();assert.deepEqual(await page.evaluate(()=>ADV.Expedition.Story.load().fightingCompanions),[]);
 await page.getByRole('button',{name:'Set out',exact:true}).click();
 // Chapter 3 asks again and preserves an explicit solo selection.
 await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());s.record.chapter=3;s.record.phase='departure';s.record.titleCards.push(3);S.syncQuest(s);S.save(s);});
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_story_v1'))});throw e;}await page.locator('#companion-confirm').waitFor();
 assert.equal(await page.locator('.party-member').count(),1);
 const before=sounds.length;await page.evaluate(()=>{localStorage.setItem('adventurer_expeditions_story_muted','1');const S=ADV.Expedition.Story,s=S.open(S.load()),before=ADV.Campaign3.roster(s.game);ADV.Campaign3.recruit(s.game,'cassian');S.Companions.queueUnlocks(s,before);S.save(s);});
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_story_v1'))});throw e;}await page.locator('#companion-unlocked').waitFor();
 await page.waitForTimeout(2800);assert.equal(sounds.length,before);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/picker.json',JSON.stringify({passed:true,savedPair:saved,mutedJingle:true,acceptPersistence:true,chapterOrder:true,errors},null,2));
 console.log('Companion UI passed: inn/travel/title/join/confirmation order, Accept/reload, no auto-close, chapter 3, swap, solo, mute and mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
