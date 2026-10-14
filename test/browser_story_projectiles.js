'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const roster=JSON.parse(fs.readFileSync('docs/art/chapter-6-14-roster.json'));
const cases=[['malvane','frost_touch'],['grell','aimed_shot'],['kessa','chain_lightning'],['idris','blood_lotus'],['jarem','siege_flame'],['altar-keepers','poison_spray'],['wyvern-matriarch','rime_breath'],['silksa','glass_web']];
const OUT='test/reports/story-projectiles';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const start=await browser.newPage();await start.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');await start.waitForFunction(()=>ADV.Expedition.Story.Presentation.data);const base=await start.evaluate(()=>ADV.Expedition.Story.open().record);await start.close();const results=[];
 for(const [slug,skill]of cases){
  const u=roster.find(u=>u.slug===slug),record=JSON.parse(JSON.stringify(base));Object.assign(record,{...u.appearances[0],phase:'combat'});record.run.tutorial.skipGuide=true;
  const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(60000);
  await page.addInitScript(record=>localStorage.setItem('adventurer_expeditions_story_v1',JSON.stringify(record)),record);
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('<script>(async()=>',`<script>ADV.Expedition.StoryBattle.prototype.fight=async function(){for(const a of this.actors.values()){a.root.setPosition(a.home.x,a.home.y);a.idle();}this.__testReady=true;};</script><script>(async()=>`);await route.fulfill({response:r,body});});
  await page.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?muted=1');await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__testReady);
  await page.evaluate(([identity,skill])=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),t=[...s.actors.values()].find(a=>a.unit.ch.storyOpponent===identity);window.castDone=false;window.castReady=null;
   t.play('cast',{holdRelease:true,onRelease:(from,clip)=>{s.paused=true;const p=X.StoryEffects.play(s,skill,from,s.hero.chest(),{height:t.height,clip});window.castReady={from,release:clip.release,anchor:clip.releaseAnchor,texture:s.children.list.find(a=>a.name==='story_effect_'+skill)?.texture.key};return p;}}).then(()=>window.castDone=true);
  },[u.identity,skill]);
  await page.waitForFunction(()=>window.castReady);const info=await page.evaluate(()=>window.castReady);assert(info.anchor);assert(info.texture?.startsWith('story_effects_'));assert(info.from.x>0&&info.from.x<1280&&info.from.y>0&&info.from.y<760);
  await page.screenshot({path:OUT+'/'+slug+'-release.png'});await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);await page.waitForFunction(()=>window.castDone);assert.deepEqual(errors,[]);results.push({slug,skill,...info});await context.close();console.log(slug+': painted '+skill+' launches at authored release');
 }
 fs.writeFileSync(OUT+'/verification.json',JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
