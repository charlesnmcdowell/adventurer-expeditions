'use strict';
// Authored dialogue, actual fights, checkpoint retry, chapter rewards and
// moving original scenery. No synthetic victories or fixture actor bindings.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const chapters=Number(process.env.STORY_CHAPTERS)||2;
const OUT='test/reports/story-chapters-'+chapters;fs.mkdirSync(OUT,{recursive:true});
const choices={q1_wake:'go',q1_wake_seen:'nobody',q1_nib:'draw',q1_cobb:'nothing',q1_wren:'kind',q2_pair_where:'truth',q2_pair:'yes',q2_cassian:'join',q2_morwin:'kill',q2_selene_how:'armour',q2_selene:'trust',q3_ithrel:'yes',q3_lessa:'fight',q3_bramm:'rescue',q3_ysolde:'nothing',q3_tollan:'yes'};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],locations=new Set(),fights=new Set();let retries=0;
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
 await page.getByRole('button',{name:'Begin campaign preview',exact:true}).click();
 for(const start=Date.now();Date.now()-start<1200000;){
  if(errors.length)throw Error(errors.join('\n'));
  const el=await page.locator('iframe').count()?await page.locator('iframe').elementHandle():null;
  if(el){
   const frame=await el.contentFrame();
   const state=await frame.evaluate(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');if(!s?.hero)return null;
    const h=s.hud,E=ADV.Expedition.Encounter;
    return {id:s.story.record.chapter+':'+s.story.record.encounter,phase:s.story.record.phase,arrow:s.arrowArmed,
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
  if(!label)throw Error('Unhandled story panel '+JSON.stringify({state,labels}));
  if(['death','letter'].some(x=>(state.location||'').includes(x)))await page.screenshot({path:OUT+'/'+state.location+'.png'});
  await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(130);
 }
 const result=await page.evaluate(()=>({record:storyPreview.record,backdrop:storyBackdrop.state()}));
 assert.equal(result.record.chapter,chapters+1);assert.deepEqual(result.record.completed,Array.from({length:chapters},(_,i)=>i+1));
 for(let c=1;c<=chapters;c++)for(let e=0;e<3;e++)assert.equal(result.record.outcomes[c+':'+e],'combat',c+':'+e);
 assert(result.record.gold>0);assert(result.backdrop);
 await page.reload();await page.getByRole('button',{name:'Continue campaign preview',exact:true}).click();
 assert.equal(await page.evaluate(()=>storyPreview.record.chapter),chapters+1);
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({fights:[...fights],locations:[...locations],retries,result,errors},null,2));
 console.log('First '+chapters+' story chapters: real fights, original scenes/choices, gold, checkpoint retry and reload passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
