'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const d=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json')),OUT='test/reports/story-stages';fs.mkdirSync(OUT,{recursive:true});
const jobs=new Map();for(const [c,route]of Object.entries(d.routes))route.forEach((id,e)=>{if(!jobs.has(id))jobs.set(id,{chapter:+c,encounter:e});});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];try{
 for(const [id,at]of jobs){if(process.argv[2]&&id!==process.argv[2])continue;const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[];
  console.log('Checking',id);page.on('pageerror',e=>{errors.push(String(e));console.error(String(e));});page.on('console',m=>{if(m.type()==='error')console.error(m.text());});page.on('requestfailed',r=>console.error(r.url(),r.failure()));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/docs/STORY_CAMPAIGN_PREVIEW.html');await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(at=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,at,{phase:'combat'});s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);},at);
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('<script>(async()=>',`<script>ADV.Expedition.StoryBattle.prototype.fight=async function(){for(const a of this.actors.values()){a.root.setPosition(a.home.x,a.home.y);a.idle();}this.__testReady=true;};</script><script>(async()=>`);await route.fulfill({response:r,body});});
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__testReady,null,{timeout:120000});
  const read=()=>page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return{id:s.location,layers:s.battleArt.layerOrder,actualLayers:s.battleArt.layers.length,clock:s.battleArt.ambience.elapsed,ground:s.battleArt.layers.at(-1).y,combatPlate:s.battleArt.combatPlate,feet:[...s.actors.values()].map(a=>({name:a.name,x:a.home.x,y:a.home.y,height:a.height}))};});
  const a=await read();await page.waitForTimeout(600);const b=await read();assert.equal(b.id,id);assert.equal(b.actualLayers,3);assert(b.clock>a.clock,'ambient motion '+id);assert.equal(a.ground,b.ground);
  await page.screenshot({path:OUT+'/'+id+'.png'});
  await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').togglePause());const p=await read();await page.waitForTimeout(200);assert.equal((await read()).clock,p.clock,'pause '+id);
  await page.evaluate(()=>storyGame.scene.getScene('StoryBattle').togglePause());
  assert.deepEqual(errors,[]);report.push({...b,errors});console.log(id+': three layers, moving ambience, fixed ground and pause checked');await context.close();
 }
 fs.writeFileSync(OUT+(process.argv[2]?'/verification-'+process.argv[2]+'.json':'/verification.json'),JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
