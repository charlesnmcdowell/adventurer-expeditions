'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const out='test/reports/story/companions';fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{
   const response=await route.fetch();let body=await response.text();
   body=body.replace('const record=S.load();',`const pilot=S.open();pilot.record.chapter=2;pilot.record.encounter=0;pilot.record.phase='combat';pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
    ADV.Campaign3.recruit(pilot.game,'wren_ward');ADV.Campaign3.recruit(pilot.game,'vess');S.Companions.enabled=true;
    S.Companions.register('wren_ward',await fetch('assets/expedition/companion_wren_ward/companion_wren_ward.json').then(r=>r.json()));
    S.Companions.register('vess',await fetch('assets/expedition/companion_vess/companion_vess.json').then(r=>r.json()));
    S.Companions.select(pilot,['wren_ward','vess']);const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__pilotReady=true;};`);
   await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?companion-pilot=1');
  try{await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__pilotReady,null,{timeout:60000});}catch(e){console.error({errors,body:await page.locator('body').innerText(),state:await page.evaluate(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');return {ready:s?.__presentationReady,ended:s?.ended,paused:s?.paused,loading:s?.load?.isLoading()};})});throw e;}
  const state=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');window.pilotAlly=[...s.actors.values()].find(a=>a.unit?.ch?.expeditionStoryCompanion);return{allies:s.enc.allies.length,ground:pilotAlly.y,clips:Object.keys(pilotAlly.sheet.clips)};});
  assert.equal(state.allies,2);assert(Number.isFinite(state.ground));
  await page.screenshot({path:out+'/hiwot-idle.png'});
  for(const id of ['wren_ward','vess'])for(const clip of ['idle','walk','attack','signature-1','signature-2','hit','knockout','victory']){
   await page.evaluate(async({id,clip})=>{const s=storyGame.scene.getScene('StoryBattle');window.pilotAlly=[...s.actors.values()].find(a=>a.unit?.ch?.expeditionStoryCompanion===id);
    if(clip==='idle'||clip==='walk'){pilotAlly.img.setFrame(clip+'/7');return;}
    window.pilotDone=pilotAlly.play(clip);}, {id,clip});
   if(!['idle','walk'].includes(clip))await page.evaluate(()=>window.pilotDone);
   // Inspect the authored contact drawing after exercising the real playback.
   await page.evaluate(clip=>{pilotAlly.img.anims.stop();pilotAlly.img.setFrame(clip+'/7');},clip);
   await page.screenshot({path:out+'/'+id+'-'+clip+'.png'});
   await page.evaluate(()=>pilotAlly.idle());
  }
  // Real simulator events drive each signature through the production director.
  for(const [companion,skill] of [['wren_ward','backstab'],['wren_ward','smoke_bomb'],['vess','ember_lash'],['vess','wither_touch']]){
   const result=await page.evaluate(async({companion,skill})=>{
    const s=storyGame.scene.getScene('StoryBattle'),A=ADV,E=A.Expedition.Encounter;pilotAlly=[...s.actors.values()].find(a=>a.unit?.ch?.expeditionStoryCompanion===companion);const u=pilotAlly.unit;
    for(const foe of s.enc.st.units.filter(u=>u.side==='b'))foe.chp=foe.maxHp=50000;
    const targets=A.Combat.validTargets(s.enc.st,u,skill,false);if(!targets.length)throw Error('No pilot target: '+skill);
    const from=s.enc.st.events.length,res=A.Combat.act(s.enc.st,u,{kind:'skill',skillId:skill,targetUid:targets[0].uid});
    const events=s.enc.st.events.slice(from);await A.Expedition.Beats.play(s,{actor:u.uid,hero:false,events});
    return {skill,ok:res?.ok,used:events.some(e=>e.t==='use'&&e.skillId===skill),alive:pilotAlly.alive};
   },{companion,skill});assert(result.used,JSON.stringify(result));
  }
  await page.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle');pilotAlly.unit.chp=0;pilotAlly.unit.downed=true;await ADV.Expedition.Beats.play(s,{events:[{t:'down',uid:pilotAlly.uid,by:s.hero.uid}]});});
  assert.equal(await page.evaluate(()=>pilotAlly.root.visible),false,'knockout leaves field');
  assert.equal(await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').story.record.c3.dead.includes('vess')),false);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/pilot.json',JSON.stringify({state,errors,passed:true},null,2));
  console.log('Two-companion pilot: actual scene, 16 clips, four resolved signatures and nonlethal knockout passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
