'use strict';
// Authored dialogue, actual fights, checkpoint retry, chapter rewards and
// moving original scenery. No synthetic victories or fixture actor bindings.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const chapters=Number(process.env.STORY_CHAPTERS)||2;
const campaign=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json'));
const firstChapter=Number(process.env.STORY_FROM)||1,branch=process.env.STORY_BRANCH||'';
const OUT='test/reports/story-chapters-'+chapters+(branch?'-'+branch:'');fs.mkdirSync(OUT,{recursive:true});
const choices={q1_wake:'go',q1_wake_seen:'nobody',q1_nib:'draw',q1_cobb:'nothing',q1_wren:'kind',q2_pair_where:'truth',q2_pair:'yes',q2_cassian:'join',q2_morwin:'kill',q2_selene_how:'armour',q2_selene:'trust',q3_ithrel:'yes',q3_lessa:'fight',q3_bramm:'rescue',q3_ysolde:'nothing',q3_tollan:'yes'};
Object.assign(choices,{q6_faelen:'cut',q6_nettle:'fight',q6_selene_fire:'warm',q7_dorran:'with',q7_durnik:'free',q7_malvane:'fight',q7_flood:'wait',q7_vess_papers:'give',q7_dream:'reject',q8_span_count:'nineteen',q8_halloran:'yes',q8_door:'force',q8_duke_seen:'nobody',q8_halvard:'city',q9_lobby:'fight',q9_floor_offer:'library',q9_lysandra:'arrest',q10_sarn:'take',q10_gate_where:'road',q10_summit:'kill',q10_letter_end:'proud',q10_letter:'grief',q10_double:'strike',q10_dream:'reject',q11_allegiance:'gauntlet',q11_amara_loved:'tesfaye',q11_amara:'promise',q12_dukes:'korvath',q12_face:'evidence',q13_maze:'cut',q13_amara_gate:'fight',q14_spoke:'letter',q14_last:'aldric',q14_resolution:'kill',q14_final_first:'anger',q14_final_history:'regret',q14_final_questions:'enough',q14_final_childhood:'back',q14_final_plans:'back',q14_final_last:'tesfaye',q14_final_resolution:'restore'});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],locations=new Set(),fights=new Set();let retries=0;
 page.on('pageerror',e=>{errors.push(e.stack||String(e));console.error('Story page error:',e.stack||String(e));});
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico')){errors.push(r.status()+' '+r.url());console.error('Story HTTP:',r.status(),r.url());}});
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
  await page.evaluate(({record,branch})=>{const S=ADV.Expedition.Story,s=S.open(record);
   // Select an already recruited companion at the chapter-boundary inn. Do not
   // invent recruitment flags or replace the verified previous playthrough.
   if(branch.startsWith('camp-quiet-')){
    const C=ADV.Campaign3;if(!C.isRecruited(s.game,'ithrel'))throw Error('Itsuki must already be recruited');
    if(!C.replaceCompany(s.game,'fennick','ithrel'))throw Error('Could not seat Itsuki');
   }
   S.save(s);},{record:saved,branch});
  await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 }else await page.getByRole('button',{name:'Begin story',exact:true}).click();
 if(branch==='bahadir')choices.q3_bramm='coin';
 choices.q4_grukhar=branch==='grukhar-spared'?'walk':'kill';
 choices.q4_dream='reject';
 Object.assign(choices,{q5_torvald_test:'word',q5_torvald:'help',q5_verlan:'beat',
  q5_ilvara:'defend',q5_camp:'storm',q5_ithrel_shot:'hold',q5_rescue:'free_first'});
 if(branch.startsWith('camp-quiet'))Object.assign(choices,{q5_verlan:'pay',q5_ilvara:'walk',
  q5_camp:'quiet',q5_ithrel_shot:branch.endsWith('-hold')?'hold':'shoot',q5_rescue:'letters_first'});
 const checkpointed=new Set();
 for(const start=Date.now();Date.now()-start<5400000;){
  if(errors.length)throw Error(errors.join('\n'));
  if(await page.locator('.bathhouse-dialog').count()){await page.getByRole('button',{name:'Return to inn',exact:true}).click();continue;}
  const el=await page.locator('iframe[title="Campaign battle"]').count()?await page.locator('iframe[title="Campaign battle"]').elementHandle():null;
  if(el){
   const frame=await el.contentFrame();
   const state=await frame.evaluate(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');if(!s?.hero)return null;
    const h=s.hud,E=ADV.Expedition.Encounter;
    // Victory advances the saved encounter before its arrow is clicked.
    // Identify the fight on screen, not that already-advanced checkpoint.
    return {id:s.enc.def.id.replace(/^story-(\d+)-(\d+)$/,'$1:$2'),phase:s.story.record.phase,arrow:s.arrowArmed,
     rect:s.arrowArmed?h.arrow.rect:h._gateRect,ready:['finisher','counter_attack','god_aura'].filter(id=>E.skillState(s.enc,id).ready).map(id=>h.icons[id].rect),
     trace:s.story.record.phase==='defeat'?{seed:s.seed,units:s.enc.st.units.map(u=>({name:u.ch.name,hp:u.chp,max:u.maxHp})),casts:s.enc.log.filter(e=>e.t==='cast'),events:s.enc.st.events.slice(-35)}:null};});
   if(state){
    if(!fights.has(state.id)){fights.add(state.id);console.log('story fight',state.id);}
    const rect=state.phase==='defeat'?{x:475,y:310,w:330,h:62}:state.rect||state.ready[0];
    if(rect){const canvas=await frame.locator('canvas').boundingBox();await page.mouse.click(canvas.x+(rect.x+rect.w/2)*canvas.width/1280,canvas.y+(rect.y+rect.h/2)*canvas.height/760);
     if(state.phase==='defeat'){if(++retries>60)throw Error('Too many defeats');fs.writeFileSync(OUT+'/defeat-'+state.id.replace(':','-')+'-'+retries+'.json',JSON.stringify(state.trace,null,2));console.log('retry',state.id);}}
   }
   await page.waitForTimeout(300);continue;
  }
  const state=await page.evaluate(()=>{const S=ADV.Expedition.Story,s=window.storyPreview;if(!s)return null;const r=s.record,b=r.reply||S.beats(s)[0];
   return{chapter:r.chapter,phase:r.phase,choice:b?.choice,options:b?.choice?S.options(s,b.choice):[],location:document.querySelector('.backdrop').dataset.location};});
  if(!state){await page.waitForTimeout(100);continue;}
  if(state.location)locations.add(state.location);
  if(state.phase==='inn'&&!checkpointed.has(state.chapter)){
    checkpointed.add(state.chapter);const result=await page.evaluate(()=>({record:storyPreview.record,backdrop:storyBackdrop.state()}));
    fs.writeFileSync(OUT+'/checkpoint-'+state.chapter+'.json',JSON.stringify({firstChapter,fights:[...fights],retries,errors,result},null,2));
    console.log('chapter complete',state.chapter-1);
  }
  // Chapter 14 still presents its saved reward before the ending. Complete is
  // the persisted story phase, not proof that the reward's Continue was clicked.
  if(chapters===14&&state.phase==='complete'&&await page.locator('#epilogue').count()){await page.screenshot({path:OUT+'/ending.png'});break;}
  if(state.chapter===chapters+1){await page.screenshot({path:OUT+'/next-chapter.png'});break;}
  const labels=await page.locator('#panel button').allTextContents();
  if(state.phase==='inn'&&await page.locator('#story-rest:enabled').count()){await page.locator('#story-rest').click();continue;}
  let label=labels.includes('Continue')?'Continue':labels.includes('Begin fight')?'Begin fight':state.options.find(o=>o.id===choices[state.choice])?.text;
  if(!label&&labels.includes('Continue story'))label='Continue story';
  // A full company asks who stays at the inn; keep the riders, as before seat offers existed.
  if(!label)label=labels.find(l=>/^Leave .+ at the inn$/.test(l));
  if(!label)throw Error('Unhandled story panel '+JSON.stringify({state,labels}));
  if(['death','letter'].some(x=>(state.location||'').includes(x)))await page.screenshot({path:OUT+'/'+state.location+'.png'});
  await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(130);
 }
 const result=await page.evaluate(()=>({record:storyPreview.record,backdrop:storyBackdrop.state()}));
 assert.equal(result.record.chapter,Math.min(14,chapters+1));if(chapters===14)assert.equal(result.record.phase,'complete');assert.deepEqual(result.record.completed,Array.from({length:chapters},(_,i)=>i+1));
 for(let c=firstChapter;c<=chapters;c++){
  const chapter=campaign.chapters.find(ch=>ch.n===c);assert(chapter,'Unknown chapter '+c);
  for(let e=0;e<chapter.enc.length;e++){
   const bypass=c>=6?result.record.outcomes[c+':'+e]==='bypass':c===4&&e===3&&branch==='grukhar-spared'||c===5&&e<3&&branch.startsWith('camp-quiet');
   assert.equal(result.record.outcomes[c+':'+e],bypass?'bypass':'combat',c+':'+e);
   assert.equal(fights.has(c+':'+e),!bypass,'Actual fight coverage '+c+':'+e);
  }
 }
 if(firstChapter<=5&&chapters>=5){
  const c=result.record.c3;assert(c.flags.caelFreed);assert(c.flags.lettersRecovered);
  if(branch==='camp-quiet-shoot'){assert(c.flags.gorrukDead);assert.equal(c.choices.q5_ithrel_shot,'shoot');}
  if(branch==='camp-quiet-hold'){assert(c.flags.ithrelHeld);assert(!c.flags.gorrukDead);assert(c.gone.includes('ithrel'));}
 }
 assert(result.record.gold>0);assert(result.backdrop);
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 assert.equal(await page.evaluate(()=>storyPreview.record.chapter),Math.min(14,chapters+1));
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({firstChapter,lastChapter:chapters,branch,fights:[...fights],locations:[...locations],retries,result,errors},null,2));
 console.log('Story chapters '+firstChapter+'–'+chapters+' '+branch+': real fights, original scenes/choices, gold, checkpoint retry and reload passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
