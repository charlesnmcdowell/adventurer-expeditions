'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage(),errors=[];try{
p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await p.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');await p.getByRole('button',{name:'Begin story',exact:true}).waitFor();
const ids=await p.evaluate(()=>Object.keys(ADV.Expedition.Story.Companions.kits)),out='test/reports/story/companions/joins';fs.mkdirSync(out,{recursive:true});
for(const [name,viewport]of [['desktop',{width:1280,height:760}],['phone',{width:390,height:844}]]){
await p.setViewportSize(viewport);
for(const id of ids){
await p.evaluate(id=>{const S=ADV.Expedition.Story,s=S.open(S.fresh()),chapter=Math.max(2,S.Companions.kits[id].join);s.record.chapter=chapter;s.record.phase='departure';s.record.titleCards=[chapter];S.syncQuest(s);ADV.Campaign3.recruit(s.game,id);S.Companions.queueUnlocks(s,[]);S.save(s);localStorage.setItem('adventurer_expeditions_story_muted','1');},id);
await p.reload();try{await p.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({id,name,errors,body:await p.locator('body').innerText()});throw e;}await p.locator('#companion-unlocked').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(750);
const bounds=await p.getByRole('button',{name:'Accept',exact:true}).boundingBox();assert(bounds&&bounds.height>=44&&bounds.y+bounds.height<=viewport.height);
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:out+'/'+id+'-'+name+'.png'});
}}
await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.getByRole('button',{name:'Continue story',exact:true}).click();await p.locator('#companion-unlocked').waitFor();assert.equal(await p.locator('#companion-unlocked>img').evaluate(e=>getComputedStyle(e).animationName),'welcome-name');
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,displays:30,ids,errors},null,2));console.log('All 15 joins at desktop and phone; Accept visible, no overflow, reduced-motion fade verified');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
