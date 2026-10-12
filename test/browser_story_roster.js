'use strict';
// Real Phaser actors in their authored multi-opponent story encounters.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-roster';fs.mkdirSync(OUT,{recursive:true});
const cases=[{chapter:1,encounter:1,actor:'story_cobb'},
  {chapter:1,encounter:1,actor:'story_hired_knife'},
  {chapter:1,encounter:2,actor:'story_consortium_mage'},
  {chapter:2,encounter:0,actor:'wolf'},
  {chapter:2,encounter:2,actor:'story_merle'},
  {chapter:3,encounter:0,actor:'story_lurleen'},
  {chapter:3,encounter:1,actor:'story_gnoll_raider'},
  {chapter:3,encounter:1,actor:'story_bandit_archer'},
  {chapter:3,encounter:2,actor:'story_snarl'},
  {chapter:3,encounter:2,actor:'story_bahadir',branch:'aurelius'},
  {chapter:4,encounter:0,actor:'story_tunnel_kobold'},
  {chapter:4,encounter:1,actor:'story_kobold_shaman'},
  {chapter:4,encounter:2,actor:'story_kobold_chief'},
  {chapter:4,encounter:2,actor:'story_veylan_acolyte'},
  {chapter:4,encounter:3,actor:'story_grukhar'},
  {chapter:5,encounter:0,actor:'story_femi'},
  {chapter:5,encounter:1,actor:'story_gauntlet_soldier'}].filter(c=>!process.env.STORY_ACTORS||process.env.STORY_ACTORS.split(',').includes(c.actor));
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],report=[];
 page.on('pageerror',e=>{errors.push(String(e));console.error('Story page error:',String(e));});
 for(const spec of cases){
  await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');
  await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(spec=>{const X=ADV.Expedition,S=X.Story,s=S.open();Object.assign(s.record,{chapter:spec.chapter,encounter:spec.encounter,phase:'combat'});s.record.run.tutorial.skipGuide=true;if(spec.branch)ADV.Campaign3.setFlag(s.game,spec.branch);S.syncQuest(s);S.save(s);},spec);
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hero);
  await page.evaluate(()=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');s.fight=async function(first){await this.intro(first);this.__testReady=true;};s.scene.restart({record:s.story.record,seed:29,muted:true});X.fx.cinematics=false;});
  const restart=async()=>{await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.__testReady=false;s.scene.restart({record:s.story.record,seed:29,muted:true});});await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__testReady);};
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__testReady);
  const bounds=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return [...s.actors.values()].filter(a=>a.side==='b').map(a=>{
    const p=a.sheet.canvas.pivot.x,k=Math.abs(a._baseScaleX),f=s.textures.getFrame(a.sheet.key,a.sheet.clips.idle.frames[0]);
    return {name:a.name,left:a.root.x+(f.x-p)*k,right:a.root.x+(f.x+f.width-p)*k,height:a.height};
  });});
  for(const b of bounds){assert(b.left>=540,b.name+' left edge '+b.left);assert(b.right<=1265,b.name+' right edge '+b.right);}
  await page.screenshot({path:OUT+'/'+spec.actor+'-lineup.png'});
  const clips=[];
  for(const variant of [0,1]){
   if(variant)await restart();
   clips.push(await page.evaluate(async({actor,variant})=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero,t=[...s.actors.values()].find(a=>a.side==='b'&&a.sheet.actor===actor);
    if(!t)throw Error('Missing actor '+actor);
    const other=[...s.actors.values()].filter(a=>a.side==='b'&&a!==t);
    const opts={target:t,lethal:true,finisherVariant:variant},id=h.sheetClipFor('finisher',opts);
    const sheet=opts.sheet||h.sheet,c=sheet.clips[id];if(!c?.paired)throw Error('Unpaired '+id);
    if(t.unit.ch.campaignExit&&c.nonlethal!==true)throw Error('Lethal art used for story survivor');
    const seen=new Set(),watch=()=>{if(c.frames.includes(h.img.frame.name))seen.add(h.img.frame.name);};
    const order=X.finisherOrder;if(actor==='wolf')X.finisherOrder=()=>[id];
    s.events.on('update',watch);
    try{await h.play('finisher',{target:t,lethal:true,finisherVariant:variant});}
    finally{s.events.off('update',watch);X.finisherOrder=order;}
    if(seen.size!==c.frames.length)throw Error('Missing poses '+id+' '+seen.size+'/'+c.frames.length);
    if(other.some(a=>!a.root.visible))throw Error('Unrelated opponent hidden');
    if(h.img.texture.key!=='xp_hiro_sheet')throw Error('Hero atlas not restored');
    return{id,frames:seen.size};},{actor:spec.actor,variant}));
  }
  await restart();
  const fatal=await page.evaluate(async actor=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero,t=[...s.actors.values()].find(a=>a.side==='b'&&a.sheet.actor===actor),seen=new Set();
   s.events.on('update',()=>{if(s.__enemyFinishSprite)seen.add(s.__enemyFinishSprite.frame.name);});h.unit.chp=0;
   await X.Beats.ticksOnly(s,[{t:'damage',uid:h.uid,by:t.uid,dmg:999,tag:'dot'},{t:'down',uid:h.uid}]);await s.defeat();
   const expected=s.cache.json.get('xp_'+actor+'_fatal_clips').clips[actor+'-fatal'].frames.length;
   return{shown:s.__enemyFinishPresented,frames:seen.size,expected,phase:s.story.record.phase,zoom:s.cameras.main.zoom};},spec.actor);
  assert(fatal.shown);assert.equal(fatal.frames,fatal.expected);assert.equal(fatal.phase,'defeat');assert.equal(fatal.zoom,1);
  await page.screenshot({path:OUT+'/'+spec.actor+'-defeat.png'});report.push({spec,clips,fatal});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({report,errors},null,2));console.log('Story roster: multi-enemy pairs, complete defeat playback and camera reset passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
