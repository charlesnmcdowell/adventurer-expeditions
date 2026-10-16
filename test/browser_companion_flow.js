'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.STORY_TEST_BASE||'http://127.0.0.1:8742',out='test/reports/story/companions';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.route('**/js/expedition/story_companions.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('enabled:false','enabled:true')});});
 await page.goto(base+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.getByRole('button',{name:'Begin story',exact:true}).waitFor();
 await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open();s.record.chapter=2;s.record.phase='departure';s.record.titleCards=[2];s.record.run.tutorial.skipGuide=true;S.syncQuest(s);
  for(const id of ['wren_ward','vess','fennick'])ADV.Campaign3.recruit(s.game,id);S.Companions.queueUnlocks(s,[]);S.save(s);});
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();
 for(const name of ['Hiwot','Desmond','Winston']){await page.locator('#companion-unlocked h1').filter({hasText:name}).waitFor();await page.locator('#companion-unlocked button').click();}
 await page.locator('#companion-confirm').waitFor();await page.getByRole('button',{name:'Change',exact:true}).click();await page.getByRole('button',{name:'Fight alone',exact:true}).click();
 await page.getByRole('button',{name:'Change',exact:true}).click();for(const id of ['wren_ward','vess'])await page.locator('[data-companion='+id+']').click();
 await page.getByRole('button',{name:'Ready',exact:true}).click();await page.getByRole('button',{name:'Set out',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>ADV.Expedition.Story.load().fightingCompanions),['wren_ward','vess']);
 // Start at a real chapter-two encounter. Do not replace the fight loop,
 // increase anyone's HP, or alter combat numbers to obtain a victory.
 await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());s.record.phase='combat';s.record.encounter=0;S.save(s);});
 await page.reload();await page.getByRole('button',{name:'Continue story',exact:true}).click();await page.getByRole('button',{name:'Begin fight',exact:true}).click();
 const frame=await page.locator('iframe[title="Campaign battle"]').elementHandle().then(h=>h.contentFrame());
 await frame.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__presentationReady,null,{timeout:90000});
 assert.equal(await frame.evaluate(()=>storyGame.scene.getScene('StoryBattle').enc.allies.length),2);
 await frame.evaluate(()=>{ADV.Expedition.pacing.mode='fast';window.flowSkills=new Set();const s=storyGame.scene.getScene('StoryBattle');s.events.on('update',()=>{for(const e of s.enc.st.events)if(e.t==='use'&&s.enc.st.units.find(u=>u.uid===e.uid)?.ch.expeditionStoryCompanion)flowSkills.add(e.skillId);});});
 await frame.page().screenshot({path:out+'/full-flow-party.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:out+'/full-flow-party-phone.png'});await page.setViewportSize({width:1280,height:760});
 const end=Date.now()+300000;let result;
 while(Date.now()<end){
  result=await frame.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');if(s.arrowArmed||s.story.record.phase==='defeat')return {over:true,phase:s.story.record.phase,won:s.arrowArmed,skills:[...flowSkills],round:s.enc.st.round};
   const states=ADV.Expedition.Encounter.skillStates(s.enc);for(const id of ['finisher','counter_attack','god_aura'])if(states[id]?.ready){s.tapSkill(id);break;}return {over:false};});
  if(result.over)break;await page.waitForTimeout(700);
 }
 assert(result?.over,'autonomous party fight must finish');assert(result.skills.some(id=>['ember_lash','wither_touch','backstab','smoke_bomb'].includes(id)),'source signature used naturally');
 await page.screenshot({path:out+'/full-flow-result.png'});
 // Controlled lethal hit exercises knockout presentation and the next-fight reset.
 await frame.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.unit?.ch?.expeditionStoryCompanion==='vess');a.unit.chp=0;a.unit.downed=true;
  await ADV.Expedition.Beats.ticksOnly(s,[{t:'down',uid:a.uid}]);if(a.root.visible)throw Error('Knockout stayed visible');
  const S=ADV.Expedition.Story;s.story.record.phase='combat';s.story.record.encounter=1;S.syncQuest(s.story);S.save(s.story);s.fight=async function(){this.__freshCompanions=this.enc.st.units.filter(u=>u.ch.expeditionStoryCompanion).map(u=>({id:u.ch.expeditionStoryCompanion,full:u.chp===u.maxHp&&!u.downed}));await this.intro(true);};s.scene.restart({record:s.story.record,muted:true,seed:29});});
 await frame.waitForFunction(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');return s?.__freshCompanions&&s.story.record.encounter===1&&s.enc.allies.length===2;},null,{timeout:90000});
 const recovered=await frame.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return s.__freshCompanions?.find(u=>u.id==='vess')?.full;});assert(recovered);console.log('autonomous result and recovery',JSON.stringify(result));
 await page.goto(base+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
 await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.load());s.record.chapter=3;s.record.phase='inn';S.syncQuest(s);ADV.Campaign3.recruit(s.game,'ithrel');S.save(s);});
 await page.reload();try{await page.getByRole('button',{name:'Continue story',exact:true}).click();}catch(e){console.error({errors,body:await page.locator('body').innerText(),save:await page.evaluate(()=>ADV.Expedition.Story.load())});throw e;}await page.locator('#story-party').click();await page.locator('[data-companion=ithrel]').click();await page.getByRole('button',{name:'Ready',exact:true}).click();
 const swapped=await page.evaluate(()=>ADV.Expedition.Story.load().fightingCompanions);assert(swapped.includes('ithrel'));assert.equal(swapped.length,2);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/full-flow.json',JSON.stringify({result,recovered,swapped,errors},null,2));console.log('Full party flow passed:',JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
