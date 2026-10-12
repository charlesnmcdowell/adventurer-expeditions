'use strict';
// Authored dialogue, actual fights, checkpoint retry, chapter rewards and
// moving original scenery. No synthetic victories or fixture actor bindings.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const chapters=Number(process.env.STORY_CHAPTERS)||2;
const campaign=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json'));
const firstChapter=Number(process.env.STORY_FROM)||1,branch=process.env.STORY_BRANCH||'';
const OUT='test/reports/story-chapters-'+chapters+(branch?'-'+branch:'');fs.mkdirSync(OUT,{recursive:true});
const choices={q1_wake:'go',q1_wake_seen:'nobody',q1_nib:'draw',q1_cobb:'nothing',q1_wren:'kind',q2_pair_where:'truth',q2_pair:'yes',q2_cassian:'join',q2_morwin:'kill',q2_selene_how:'armour',q2_selene:'trust',q3_ithrel:'yes',q3_lessa:'fight',q3_bramm:'rescue',q3_ysolde:'nothing',q3_tollan:'yes'};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],locations=new Set(),fights=new Set();let retries=0;
 page.on('pageerror',e=>{errors.push(String(e));console.error('Story page error:',String(e));});
 page.on('console',m=>{if(m.type()==='error')console.error('Story console:',m.text());});
 page.on('requestfailed',r=>console.error('Story request:',r.url(),r.failure()?.errorText));
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');
 if(firstChapter>1){
  await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  // A chapter-only extension resumes the verified previous playthrough, with
  // its actual skills, rewards and irreversible choices. Do not fabricate
  // completion flags on a brand-new hero and call that campaign coverage.
  const previous=process.env.STORY_CHECKPOINT||'test/reports/story-chapters-'+(firstChapter-1)+'/verification.json';
  const saved=JSON.parse(fs.readFileSync(previous)).result.record;
  assert.equal(saved.chapter,firstChapter,'Prior playthrough checkpoint');
  assert.deepEqual(saved.completed,Array.from({length:firstChapter-1},(_,i)=>i+1));
  await page.evaluate(record=>{const S=ADV.Expedition.Story,s=S.open(record);S.save(s);},saved);
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 }else await page.getByRole('button',{name:'Begin story',exact:true}).click();
 if(branch==='bahadir')choices.q3_bramm='coin';
 choices.q4_grukhar=branch==='grukhar-spared'?'walk':'kill';
 choices.q4_dream='reject';
 for(const start=Date.now();Date.now()-start<1200000;){
  if(errors.length)throw Error(errors.join('\n'));
  const el=await page.locator('iframe').count()?await page.locator('iframe').elementHandle():null;
  if(el){
   const frame=await el.contentFrame();
   const state=await frame.evaluate(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');if(!s?.hero)return null;
    const h=s.hud,E=ADV.Expedition.Encounter;
    // Victory advances the saved encounter before its arrow is clicked.
    // Identify the fight on screen, not that already-advanced checkpoint.
    return {id:s.enc.def.id.replace(/^story-(\d+)-(\d+)$/,'$1:$2'),phase:s.story.record.phase,arrow:s.arrowArmed,
     rect:s.arrowArmed?h.arrow.rect:h._gateRect,ready:['finisher','counter_attack','god_aura'].filter(id=>E.skillState(s.enc,id).ready).map(id=>h.icons[id].rect)};});
   if(state){
    if(!fights.has(state.id)){fights.add(state.id);console.log('story fight',state.id);}
    const rect=state.phase==='defeat'?{x:475,y:310,w:330,h:62}:state.rect||state.ready[0];
    if(rect){const canvas=await frame.locator('canvas').boundingBox();await page.mouse.click(canvas.x+(rect.x+rect.w/2)*canvas.width/1280,canvas.y+(rect.y+rect.h/2)*canvas.height/760);
     if(state.phase==='defeat'){if(++retries>8)throw Error('Too many defeats');console.log('retry',state.id);}}
   }
   await page.waitForTimeout(300);continue;
  }
  const state=await page.evaluate(()=>{const S=ADV.Expedition.Story,s=window.storyPreview;if(!s)return null;const r=s.record,b=r.reply||S.beats(s)[0];
   return{chapter:r.chapter,phase:r.phase,choice:b?.choice,options:b?.choice?S.options(s,b.choice):[],location:document.querySelector('.backdrop').dataset.location};});
  if(!state){await page.waitForTimeout(100);continue;}
  if(state.location)locations.add(state.location);
  if(state.chapter===chapters+1){await page.screenshot({path:OUT+'/next-chapter.png'});break;}
  const labels=await page.locator('#panel button').allTextContents();
  let label=labels.includes('Continue')?'Continue':labels.includes('Begin fight')?'Begin fight':state.options.find(o=>o.id===choices[state.choice])?.text;
  // A full company asks who stays at the inn; keep the riders, as before seat offers existed.
  if(!label)label=labels.find(l=>/^Leave .+ at the inn$/.test(l));
  if(!label)throw Error('Unhandled story panel '+JSON.stringify({state,labels}));
  if(['death','letter'].some(x=>(state.location||'').includes(x)))await page.screenshot({path:OUT+'/'+state.location+'.png'});
  await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(130);
 }
 const result=await page.evaluate(()=>({record:storyPreview.record,backdrop:storyBackdrop.state()}));
 assert.equal(result.record.chapter,chapters+1);assert.deepEqual(result.record.completed,Array.from({length:chapters},(_,i)=>i+1));
 for(let c=firstChapter;c<=chapters;c++){
  const chapter=campaign.chapters.find(ch=>ch.n===c);assert(chapter,'Unknown chapter '+c);
  for(let e=0;e<chapter.enc.length;e++){
   const bypass=c===4&&e===3&&branch==='grukhar-spared';
   assert.equal(result.record.outcomes[c+':'+e],bypass?'bypass':'combat',c+':'+e);
   assert.equal(fights.has(c+':'+e),!bypass,'Actual fight coverage '+c+':'+e);
  }
 }
 assert(result.record.gold>0);assert(result.backdrop);
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 assert.equal(await page.evaluate(()=>storyPreview.record.chapter),chapters+1);
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({firstChapter,lastChapter:chapters,branch,fights:[...fights],locations:[...locations],retries,result,errors},null,2));
 console.log('Story chapters '+firstChapter+'–'+chapters+' '+branch+': real fights, original scenes/choices, gold, checkpoint retry and reload passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
