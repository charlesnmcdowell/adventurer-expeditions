'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const OUT='test/reports/readability';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],casts=[];
 page.on('pageerror',e=>errors.push(String(e)));
 async function encounter(chapter,encounter){
  await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');
  await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(({chapter,encounter})=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,{chapter,encounter,phase:'combat'});s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);},{chapter,encounter});
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hero);
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');ADV.Expedition.fx.cinematics=false;
   s.fight=async function(first){await this.intro(first);ADV.Expedition.UI.resetCamera(this);this.__ready=true;};s.scene.restart({record:s.story.record,seed:29,muted:true});});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__ready);
 }
 for(const [chapter,encounterIndex,actor,skill]of [[1,2,'story_consortium_mage','fire_bolt'],[1,2,'story_consortium_mage','prismatic_bolt'],
  [2,2,'story_merle','spark'],[2,2,'story_merle','ember_lash'],[2,2,'story_merle','ashfall'],
  [4,1,'story_kobold_shaman','cinder_charge'],[4,2,'story_kobold_chief','fire_bolt'],[4,3,'story_grukhar','bog_curse'],[4,3,'story_grukhar','blood_pact'],
  [5,3,'story_gorruk','fire_bolt']]){
  await encounter(chapter,encounterIndex);
  await page.evaluate(({actor,skill})=>{
   const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.sheet?.actor===actor);
   const start=s.enc.st.events.length;ADV.Combat.act(s.enc.st,a.unit,{kind:'skill',skillId:skill,targetUid:s.hero.uid});
   const events=s.enc.st.events.slice(start);if(!events.some(e=>e.t==='use'))throw Error('Cast rejected '+skill);
   s.__caster=a;s.__skill=skill;s.__castDone=false;s.__castError=null;s.__release=null;s.__impact=false;s.__flightPoses=new Set();
   const original=ADV.VFX.damageNumber;ADV.VFX.damageNumber=(scene,x,y,v,...args)=>{if(scene===s&&typeof v==='number')s.__impact=true;return original(scene,x,y,v,...args);};
   const watch=()=>{const bolt=s.children.list.find(c=>c.name==='story_effect_'+skill);if(bolt)s.__flightPoses.add(a.img.frame.name);if(bolt&&!s.__release){s.__release={frame:a.img.frame.name,x:bolt.x,y:bolt.y,size:bolt.displayWidth,anchor:a.releasePoint(a.sheet.clips.cast),impact:s.__impact};s.paused=true;}};
   s.events.on('update',watch);X.Beats.play(s,{actor:a.uid,hero:false,events}).then(()=>{s.events.off('update',watch);ADV.VFX.damageNumber=original;s.__castDone=true;},e=>s.__castError=String(e));
  },{actor,skill});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__release||storyGame.scene.getScene('StoryBattle').__castError);
  const release=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');if(s.__castError)throw Error(s.__castError);return s.__release;});
  assert.equal(release.impact,false,'hit waits for flight');assert(Math.abs(release.x-release.anchor.x)<3);assert(Math.abs(release.y-release.anchor.y)<3);
  await page.screenshot({path:OUT+'/'+actor+'-'+skill+'-release.png'});
  await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').__caster.img.frame.name),release.frame,'pose holds while paused');
  await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__castDone||storyGame.scene.getScene('StoryBattle').__castError);
  const final=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return{error:s.__castError,impact:s.__impact,held:!!s.__caster._playback?.releaseHeld,frame:s.__caster.img.frame.name,flightPoses:[...s.__flightPoses]};});
  assert.equal(final.error,null);assert(final.impact);assert.equal(final.held,false);assert(final.frame.startsWith('idle/'));
  assert.deepEqual(final.flightPoses,[release.frame],'casting follow-through stays held throughout the moving bolt');
  casts.push({actor,skill,release,final});
 }
 await encounter(5,1);
 const closed=await page.evaluate(async()=>{
  const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.side==='b');
  a.unit.ch.actives=[{skillId:'close_order',level:1}];const start=s.enc.st.events.length;
  const r=ADV.Combat.act(s.enc.st,a.unit,{kind:'skill',skillId:'close_order',targetUid:a.uid});
  if(r.ok===false)throw Error('Close Order rejected');await X.Beats.play(s,{hero:false,events:s.enc.st.events.slice(start)});
  a.refresh();return{badge:a.badges.has('closed'),status:a.unit.statuses.some(s=>s.kind==='closed'&&s.rounds>0)};
 });assert(closed.badge&&closed.status,'patrol Close Order animates without badge crash');
 await encounter(4,2);
 const healer=await page.evaluate(async()=>{
  const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='story_veylan_acolyte');
  const patient=[...s.actors.values()].find(b=>b.side==='b'&&b!==a);patient.unit.chp=Math.round(patient.unit.maxHp*.5);
  const from=s.enc.st.events.length;ADV.Combat.act(s.enc.st,a.unit,{kind:'skill',skillId:'mend',targetUid:patient.uid});
  const events=s.enc.st.events.slice(from);let release=null;const play=a.play.bind(a);
  a.play=(id,opts)=>play(id,{...opts,onRelease:(point,c)=>{release={point,frame:a.img.frame.name};return opts?.onRelease?.(point,c);}});
  await X.Beats.play(s,{hero:false,events});return{release,healed:events.some(e=>e.t==='heal'),heroHit:events.some(e=>e.t==='damage'&&e.uid===s.hero.uid)};
 });assert(healer.release&&healer.healed);assert.equal(healer.heroHit,false);
 await page.screenshot({path:OUT+'/acolyte-heal.png'});
 await encounter(1,1);
 const statuses=await page.evaluate(async()=>{
  const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.side==='b');
  const begin=s.enc.st.events.length;ADV.Combat.act(s.enc.st,a.unit,{kind:'skill',skillId:'marked_for_the_knife',targetUid:s.hero.uid});
  const events=s.enc.st.events.slice(begin);await X.Beats.play(s,{hero:false,events});
  const present=s.hero.badges.has('marked');s.hero.unit.statuses=s.hero.unit.statuses.filter(s=>s.kind!=='marked');s.hero.refresh();const expired=!s.hero.badges.has('marked');
  return{present,expired,damage:events.filter(e=>e.t==='damage').map(e=>e.dmg)};
 });assert(statuses.present&&statuses.expired&&statuses.damage.some(n=>n>0));
 for(const [kind,label]of [['evade','Miss'],['counter','Blocked'],['ward','Shielded'],['damage','0']]){
  await page.evaluate(kind=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.side==='b');
   s.__outcomeDone=false;s.__label=null;s.__reaction=null;
   const original=ADV.VFX.damageNumber;ADV.VFX.damageNumber=(scene,x,y,v,...args)=>{if(['Miss','Blocked','Shielded','0'].includes(String(v))){s.__label=String(v);s.paused=true;}return original(scene,x,y,v,...args);};
   const react=a.reactOutcome.bind(a);a.reactOutcome=k=>{s.__reaction=k;return react(k);};
   X.Beats.play(s,{hero:true,events:[{t:'use',uid:s.hero.uid,skillId:'katana_slash',target:a.uid},{t:kind,uid:a.uid,by:s.hero.uid,dmg:0,blocked:10}]}).then(()=>{ADV.VFX.damageNumber=original;s.__outcomeDone=true;});
  },kind);
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__label);
  assert.equal(await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').__label),label);
  await page.screenshot({path:OUT+'/outcome-'+kind+'.png'});
  await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__outcomeDone);
  assert(await page.evaluate(()=>!!storyGame.scene.getScene('StoryBattle').__reaction));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/browser.json',JSON.stringify({casts,healer,statuses,errors},null,2));
 console.log('Actual story casts: hand anchors, release frames, pause, flight-before-impact, recovery; defensive reactions and Marked expiry passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
