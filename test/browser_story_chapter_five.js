'use strict';
// Reuse real completed playthroughs to verify the normal, non-override cap.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
 await page.getByText('Chapters 1–5 are playable.',{exact:true}).waitFor();
 for(const chapter of [4,5]){
  const record=JSON.parse(fs.readFileSync('test/reports/story-chapters-'+chapter+'/verification.json')).result.record;
  assert.equal(record.chapter,chapter+1);assert.equal(record.phase,'inn');
  await page.evaluate(record=>{const S=ADV.Expedition.Story;S.save(S.open(record));},record);
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
  // Chapter payout and gift acknowledgements precede the inn.
  for(let n=0;n<4&&!await page.locator('#story-inn').count();n++)
   await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.locator('#story-inn').waitFor();
  assert.equal(await page.evaluate(()=>storyPreview.record.chapter),chapter+1);
  await page.locator('#story-embark').click();
  if(chapter===4)await page.getByRole('heading',{name:'The Bandit Camp',exact:true}).waitFor();
  else{
   await page.getByRole('heading',{name:'Chapter 6 is coming soon',exact:true}).waitFor();
   await page.screenshot({path:'test/reports/ch5-boundary.png'});
   await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
   await page.getByRole('heading',{name:'Chapter 6 is coming soon',exact:true}).waitFor();
   assert.equal(await page.locator('iframe').count(),0);
  }
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('test/reports/ch5-boundary.json',JSON.stringify({passed:true,errors},null,2));
 console.log('Chapter-five title, chapter-four inn continuation, chapter-six gate and reload passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
