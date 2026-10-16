'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{
   const response=await route.fetch();const body=(await response.text()).replace('const record=S.load();',`const pilot=S.open();pilot.record.chapter=2;pilot.record.encounter=0;pilot.record.phase='combat';pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
    ADV.Campaign3.recruit(pilot.game,'vess');S.Companions.enabled=true;S.Companions.select(pilot,['vess']);
    // Select an approved added bark while still using the production selector.
    ADV.Campaign3.state(pilot.game).banterHeard=['vess:0','vess:1','vess:2','vess:4','vess:5'];
    const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__banterReady=true;};`);
   await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__banterReady,null,{timeout:60000});
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.opts.muted=false;s.enc.st.round=2;s.storyBanter();});
  await page.waitForFunction(()=>{const s=storyGame.scene.getScene('StoryBattle');return s.banterVoice?.currentTime>0&&!s.banterVoice.paused;});
  const state=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle'),file=s.banterVoice.src,text=s.banterCaption.text;
   s.togglePause();if(!s.banterVoice.paused)throw Error('Bark did not pause');s.togglePause();
   const audio=s.banterVoice;s.storyBanter();if(s.banterVoice!==audio)throw Error('Bark repeated');return{file,text};
  });assert(state.file.endsWith('/vess/banter_4_companion20261016.mp3'));assert(state.text.includes('Your turn to worry, man.'));
  const out='test/reports/story/companion-dialogue-production';await page.screenshot({path:out+'/combat-bark.png'});
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');window.oldBark=s.banterVoice;s.returnToStory=()=>{};s.scene.stop();});
  // Phaser queues scene.stop until the next game step.
  await page.waitForFunction(()=>!storyGame.scene.isActive('StoryBattle')&&oldBark.paused,null,{timeout:5000});
  assert(await page.evaluate(()=>oldBark.paused),'scene shutdown stops voice');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/combat-bark.json',JSON.stringify({state,errors,paused:true,onePerFight:true,shutdown:true},null,2));
  console.log('Real StoryBattle: added bark audible, contextual selector, caption, pause/resume, once per fight and shutdown passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
