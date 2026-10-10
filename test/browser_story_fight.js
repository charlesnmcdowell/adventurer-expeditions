'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-fight';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
  await page.waitForFunction(()=>ADV.Expedition.Story.Presentation.data);
  await page.evaluate(()=>{const X=ADV.Expedition,S=X.Story,s=S.open();s.record.phase='combat';s.record.run.tutorial.skipGuide=true;S.save(s);localStorage.setItem(X.saveKey,'arcade-preserve');localStorage.setItem('adv:sentinel','original-preserve');});
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hero);
  // Same director and actors, held at the intro boundary for reproducible poses.
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.fight=async function(first){await this.intro(first);this.__testReady=true;};s.scene.restart({record:s.story.record,seed:29,muted:true});ADV.Expedition.fx.cinematics=false;});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__testReady);
  const clips=[];
  for(const variant of [0,1]){
    if(variant)await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.__testReady=false;s.scene.restart({record:s.story.record,seed:29,muted:true});});
    await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__testReady);
    clips.push(await page.evaluate(async variant=>{const s=storyGame.scene.getScene('StoryBattle'),h=s.hero,t=[...s.actors.values()].find(a=>a.side==='b');
      const id=h.sheetClipFor('finisher',{target:t,lethal:true,finisherVariant:variant});
      if(id!=='hiro-finisher-'+(variant+1))throw Error('Wrong pair '+id);
      const seen=new Set(),watch=()=>{if(h.img.texture.key==='xp_story_nib_sheet')seen.add(h.img.frame.name);};s.events.on('update',watch);
      await h.play('finisher',{target:t,lethal:true,finisherVariant:variant});s.events.off('update',watch);
      if(seen.size!==16)throw Error('Missing paired poses '+seen.size);
      if(h.img.texture.key!=='xp_hiro_sheet')throw Error('Hero atlas not restored');
      return{id,frames:seen.size};},variant));
    await page.screenshot({path:OUT+'/hiro-'+variant+'.png'});
  }
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.__testReady=false;s.scene.restart({record:s.story.record,seed:29,muted:true});});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__testReady);
  const fatal=await page.evaluate(async()=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero,t=[...s.actors.values()].find(a=>a.side==='b'),seen=new Set();
    s.events.on('update',()=>{if(s.__enemyFinishSprite)seen.add(s.__enemyFinishSprite.frame.name);});h.unit.chp=0;
    await X.Beats.ticksOnly(s,[{t:'damage',uid:h.uid,by:t.uid,dmg:344,tag:'dot'},{t:'down',uid:h.uid}]);
    await s.defeat();return {shown:s.__enemyFinishPresented,frames:seen.size,phase:s.story.record.phase,zoom:s.cameras.main.zoom};});
  assert.deepEqual(fatal,{shown:true,frames:16,phase:'defeat',zoom:1});
  await page.screenshot({path:OUT+'/defeat-retry.png'});
  await page.mouse.click(640,340);await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').story.record.phase==='combat'&&storyGame.scene.getScene('StoryBattle').hero.unit.chp>0);
  assert.equal(await page.evaluate(()=>localStorage.getItem(ADV.Expedition.saveKey)),'arcade-preserve');assert.equal(await page.evaluate(()=>localStorage.getItem('adv:sentinel')),'original-preserve');
  assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({clips,fatal,errors},null,2));console.log('Story battle: both 16-frame Hiro pairs, lethal DOT finisher, camera restore, retry and save isolation passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
