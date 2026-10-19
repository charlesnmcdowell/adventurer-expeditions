'use strict';
// The default party is the two newest recruits, labelled Recommended, reset at
// each chapter and whenever someone joins; a player's pick holds until then
// (Hiro, 2026-10-19).
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-recommended-party';fs.mkdirSync(OUT,{recursive:true});
const ORIGIN=process.env.TEST_ORIGIN||'http://127.0.0.1:8742';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(ORIGIN+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.waitForFunction(()=>ADV.Expedition.Story.Presentation?.data);
  const logic=await page.evaluate(()=>{const S=ADV.Expedition.Story,C=ADV.Campaign3,P=S.Companions,s=S.open(S.fresh());
    Object.assign(s.record,{chapter:3,phase:'departure',titleCards:[1,2,3],completed:[1,2]});S.syncQuest(s);
    for(const id of ['wren_ward','dorran','cassian','ithrel'])C.recruit(s.game,id);
    const out={};out.start=P.selected(s);out.startRec=P.isRecommended(s);
    P.select(s,['wren_ward','dorran']);out.picked=P.selected(s);out.pickedRec=P.isRecommended(s);
    s.record.chapter=4;S.syncQuest(s);out.nextChapter=P.selected(s);
    P.select(s,['wren_ward','cassian']);C.recruit(s.game,'bramm');out.afterJoin=P.selected(s);
    S.save(s);return out;});
  console.log(JSON.stringify(logic));
  assert.deepEqual(logic.start,['ithrel','cassian'],'newest two by default');assert(logic.startRec);
  assert.deepEqual(logic.picked,['wren_ward','dorran'],'player pick holds in the chapter');assert(!logic.pickedRec);
  assert.deepEqual(logic.nextChapter,['ithrel','cassian'],'new chapter resets to recommended');
  assert.deepEqual(logic.afterJoin,['bramm','ithrel'],'a new joiner resets to recommended');
  // The party check shows the Recommended tag, Change still works, and Set out keeps it.
  await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());s.record.phase='departure';s.record.titleCards=[1,2,3,4];s.record.companionUnlocksPending=[];delete s.record.companionPickedChapter;S.save(s);});
  await page.goto(ORIGIN+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.getByRole('button',{name:'Continue story',exact:true}).click();
  await page.locator('#companion-confirm').waitFor();
  assert.equal(await page.locator('#companion-confirm h1 .recommended-tag').textContent(),'Recommended');
  await page.screenshot({path:OUT+'/confirm.png'});
  await page.getByRole('button',{name:'Change',exact:true}).click();await page.locator('#companion-picker').waitFor();
  assert.equal(await page.locator('#companion-picker .recommended-tag').count(),2,'recommended cards marked');
  await page.screenshot({path:OUT+'/picker.png'});
  await page.locator('#companion-picker [data-companion="bramm"]').click();await page.locator('#companion-picker [data-companion="wren_ward"]').click();
  await page.getByRole('button',{name:'Ready',exact:true}).click();await page.locator('#companion-confirm').waitFor();
  assert.equal(await page.locator('#companion-confirm h1 .recommended-tag').count(),0,'own pick is not labelled recommended');
  await page.getByRole('button',{name:'Change',exact:true}).click();await page.getByRole('button',{name:'Recommended party',exact:true}).click();
  await page.locator('#companion-confirm h1 .recommended-tag').waitFor();
  await page.getByRole('button',{name:'Set out',exact:true}).click();
  const saved=await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());return S.Companions.selected(s);});
  assert.deepEqual(saved,['bramm','ithrel']);
  assert.deepEqual(errors,[]);console.log('recommended party: newest two by default, resets per chapter and joiner, label, change and keep passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
