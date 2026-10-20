'use strict';
// A full company makes room on its own (Hiro, 2026-10-20): the longest-riding
// companion heads back to the inn and the newcomer rides, with no menu.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-full-company';fs.mkdirSync(OUT,{recursive:true});
const ORIGIN=process.env.TEST_ORIGIN||'http://127.0.0.1:8742';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(ORIGIN+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.waitForFunction(()=>ADV.Expedition.Story.Presentation?.data);
  // 1. A choice that recruits into a full company (chapter 2: Selene joins five riders).
  const setup=await page.evaluate(()=>{const S=ADV.Expedition.Story,C=ADV.Campaign3,s=S.open(S.fresh());
    Object.assign(s.record,{chapter:2,phase:'departure',titleCards:[1,2],completed:[1]});S.syncQuest(s);
    for(const id of ['wren_ward','vess','fennick','cassian','dorran'])C.recruit(s.game,id);
    s.record.companionUnlocksSeen=['wren_ward','vess','fennick','cassian','dorran'];
    const full=C.companyFull(s.game);C.recruit(s.game,'selene');
    s.record.seatOffer=['selene'];s.record.companionPickedChapter=2;S.save(s);return{full,company:C.companyIds(s.game),inCompany:C.inCompany(s.game,'selene')};});
  assert(setup.full&&!setup.inCompany,'Selene starts waiting: '+JSON.stringify(setup));
  await page.goto(ORIGIN+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.getByRole('button',{name:'Continue story',exact:true}).click();
  const toast=await page.locator('.story-toast').first().textContent({timeout:15000});
  assert.equal(await page.getByText('The company is full').count(),0,'no menu');
  await page.screenshot({path:OUT+'/toast.png'});
  const after=await page.evaluate(()=>{const S=ADV.Expedition.Story,C=ADV.Campaign3,s=S.open(S.load());return{company:C.companyIds(s.game),hiwotRecruited:C.isRecruited(s.game,'wren_ward'),offer:s.record.seatOffer||null};});
  console.log(toast,JSON.stringify(after));
  assert.match(toast,/Hiwot heads back to the inn to make room for/);
  assert.deepEqual(after.company,['vess','fennick','cassian','dorran','selene'],'oldest out, newcomer in');
  assert(after.hiwotRecruited,'Hiwot stays recruited at the inn');assert.equal(after.offer,null);
  // 2. The recommended party then includes the newcomer.
  const party=await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());return S.Companions.selected(s);});
  assert(party.includes('selene'),'newcomer in the recommended party '+party);
  assert.deepEqual(errors,[]);console.log('full company: oldest rider goes to the inn, newcomer rides and is recommended, no menu passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
