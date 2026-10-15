'use strict';
// Combat ground adaptations must not move the original dialogue scene's lamps,
// water and cloth to the coordinates used by a different painting.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');
 await page.waitForFunction(()=>window.storyBackdrop?.state(),null,{timeout:90000});
 const ids=await page.evaluate(()=>Object.keys(ADV.Expedition.Story.Stage.profiles));
 for(const id of ids){
  await page.evaluate(id=>storyBackdrop.show({kind:'environments',id,phase:'day'}),id);
  await page.waitForFunction(id=>storyBackdrop.state()?.id===id,id);
  const state=await page.evaluate(()=>{const s=storyBackdrop.game.scene.getScene('StoryBackdrop'),a=s.art;return{id:s.spec.id,combat:a.combatPlate,profile:a.motionProfile,expected:ADV.GateAmbience.environments[s.spec.id],texture:a.background.texture.key,layers:a.layers.length};});
  assert.equal(state.combat,false);assert.deepEqual(state.profile,state.expected,'Original landmarks '+id);
  assert.equal(state.texture,'story_scene_environments_'+id);assert.equal(state.layers,3);report.push({id,originalPainting:true,originalLandmarks:true});
 }
 assert.deepEqual(errors,[]);fs.mkdirSync('test/reports/story-dialogue-stages',{recursive:true});fs.writeFileSync('test/reports/story-dialogue-stages/verification.json',JSON.stringify({report,errors},null,2));
 console.log(report.length+' dialogue environments retain their original painting and matching animated landmarks');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
