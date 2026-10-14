'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
let roster=JSON.parse(fs.readFileSync('docs/art/chapter-6-14-roster.json'));
if(process.argv[2])roster=roster.filter(r=>process.argv.slice(2).includes(r.slug));
const OUT='test/reports/story-late-art';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});let base;const reportFile=OUT+'/verification.json';const results=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile)):[];
try{
 const setup=await browser.newPage();await setup.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
 await setup.waitForFunction(()=>ADV.Expedition.Story.Presentation.data);base=await setup.evaluate(()=>ADV.Expedition.Story.open().record);await setup.close();
 for(const u of roster){
  const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  const record=JSON.parse(JSON.stringify(base));Object.assign(record,{...u.appearances[0],phase:'combat'});record.run.tutorial.skipGuide=true;
  if(u.slug==='umbral-pair')record.c3.flags.umbralBetrayed=true;
  await page.addInitScript(record=>localStorage.setItem('adventurer_expeditions_story_v1',JSON.stringify(record)),record);
  // Isolated director boundary: real preload, spawn, actors, paired routing and
  // cleanup run normally; random AI cannot kill the subject during inspection.
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('<script>(async()=>',`<script>ADV.Expedition.StoryBattle.prototype.fight=async function(){for(const a of this.actors.values()){a.root.setPosition(a.home.x,a.home.y);a.idle();}this.__testReady=true;};</script><script>(async()=>`);await route.fulfill({response:r,body});});
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?muted=1');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__testReady);
  await page.screenshot({path:OUT+'/'+u.slug+'-lineup.png'});
  const result=await page.evaluate(async identity=>{
   const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero,t=[...s.actors.values()].find(a=>a.unit.ch.storyOpponent===identity);
   if(!t)throw Error('Opponent did not spawn: '+identity);X.fx.cinematics=false;const output={identity,actor:t.sheet.actor,pairs:[]};
   for(const variant of [0,1]){
    t.alive=true;t.root.setVisible(true);t.idle();const seen=new Set();
    const watch=(anim,frame)=>{if(anim.key.includes(t.sheet.actor)&&anim.key.includes('hiro-finisher'))seen.add(frame.textureFrame);};h.img.on('animationupdate',watch);h.img.on('animationstart',watch);
    await h.play('finisher',{target:t,lethal:true,finisherVariant:variant});h.img.off('animationupdate',watch);h.img.off('animationstart',watch);
    output.pairs.push({variant,frames:seen.size,restored:h.img.texture.key==='xp_hiro_sheet'});
   }
   t.alive=true;t.root.setVisible(true);t.idle();h.alive=true;h.unit.chp=0;s.__enemyFinishPresented=false;
   const seen=new Set();const tick=()=>{if(s.__enemyFinishSprite)seen.add(s.__enemyFinishSprite.frame.name);};s.events.on('update',tick);
   await X.Beats.ticksOnly(s,[{t:'damage',uid:h.uid,by:t.uid,dmg:999,tag:'dot'},{t:'down',uid:h.uid}]);
   await X.EnemyFinishers.ensureDefeat(s);s.events.off('update',tick);
   output.fatal={presented:s.__enemyFinishPresented,frames:seen.size};return output;
  },u.identity);
  assert(result.pairs.every(p=>p.frames===16&&p.restored),JSON.stringify(result));assert(result.fatal.presented&&result.fatal.frames===16,JSON.stringify(result));assert.deepEqual(errors,[]);
  const prior=results.findIndex(r=>r.identity===result.identity);if(prior>=0)results[prior]=result;else results.push(result);fs.writeFileSync(reportFile,JSON.stringify(results,null,2));console.log(u.slug+': both Hiro pairs + lethal-DOT enemy finisher, 16 frames each, restored');await context.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
