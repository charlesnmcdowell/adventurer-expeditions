'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
const out='test/reports/story/hiro-parry';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 try{
  await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('<script>(async()=>',"<script>ADV.Expedition.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__ready=true;};</script><script>(async()=>")});});
  await p.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
  await p.getByRole('button',{name:'Begin story',exact:true}).waitFor();
  await p.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open(S.fresh());Object.assign(s.record,{chapter:1,encounter:2,phase:'combat'});s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);});
  await p.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?muted=1');
  await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:90000});
  const before=await p.evaluate(()=>{
   const A=ADV,X=A.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero.unit;
   const foe=[...s.actors.values()].find(a=>a.side==='b'&&!/mage|archer/.test(a.unit.ch.storyOpponent||''));
   if(!foe)throw Error('No melee enemy');
   let r=A.Combat.act(s.enc.st,h,{kind:'skill',skillId:'counter_attack',targetUid:h.uid});if(!r.ok)throw Error(JSON.stringify(r));
   const start=s.enc.st.events.length;
   r=A.Combat.act(s.enc.st,foe.unit,{kind:'attack',targetUid:h.uid});if(!r.ok)throw Error(JSON.stringify(r));
   const events=s.enc.st.events.slice(start);if(!events.some(e=>e.t==='counter'))throw Error('No counter '+JSON.stringify(events));
   s.__frames=[];s.__done=false;s.__contact=false;
   s.events.on('update',()=>{const f=s.hero.img.frame.name;if(s.__frames.at(-1)!==f)s.__frames.push(f);if(!s.__contact&&f==='parry-rise/2'){s.__contact=true;s.paused=true;}});
   const initial={scale:s.hero.img.scaleX,x:s.hero.x,y:s.hero.y,clip:s.hero.sheetClipFor('intercept',{}),deflect:s.hero.sheetClipFor('deflect',{}),iaido:s.hero.sheetClipFor('iaido',{})};
   X.Beats.play(s,{actor:foe.uid,hero:false,events}).then(()=>s.__done=true);
   return initial;
  });
  assert.equal(before.clip,'parry-rise');assert.equal(before.deflect,'deflect');assert.equal(before.iaido,'iaido-draw');
  await p.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__contact);
  await p.screenshot({path:out+'/contact.png'});
  await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);
  await p.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__done,null,{timeout:30000});
  const after=await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return {frames:s.__frames,scale:s.hero.img.scaleX,x:s.hero.x,y:s.hero.y,alpha:s.hero.img.alpha,visible:s.hero.img.visible};});
  assert.equal(after.scale,before.scale);assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert(after.alpha>0&&after.visible);
  assert(after.frames.some(f=>String(f).startsWith('riposte/')),'Counter must still answer with its riposte');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({before,after,errors},null,2));
  console.log('PASS: real melee Counter uses reused parry, contacts, ripostes and restores scale; Iaido/deflect unchanged');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
