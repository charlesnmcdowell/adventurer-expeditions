'use strict';
// Exercise the real backdrop and Chapter 2 fight, including viewport resize.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='test/reports/story-framing';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {server,base}=await require('./entrance_server')();
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1910,height:840}}),errors=[],missing=[],report=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))missing.push(r.url());});
  await p.goto(base+'/docs/STORY_CAMPAIGN_PREVIEW.html');
  await p.waitForFunction(()=>window.storyBackdrop?.state(),null,{timeout:60000});
  // Hide the title controls only in this isolated browser to inspect the art.
  await p.addStyleTag({content:'#panel{visibility:hidden}'});
  const specs=await p.evaluate(()=>{
   const d=ADV.Expedition.Story.Presentation.data;
   return ['stills','environments'].flatMap(kind=>Object.keys(d.art[kind]).map(id=>({kind,id,phase:'day'})));
  });
  async function show(spec){
   await p.evaluate(spec=>storyBackdrop.show(spec),spec);
   await p.waitForFunction(spec=>{const s=storyBackdrop.state();return s?.kind===spec.kind&&s.id===spec.id;},spec);
   await p.waitForTimeout(70);
  }
  async function measure(){return p.evaluate(()=>{
   const s=storyBackdrop.game.scene.getScene('StoryBackdrop'),bg=s.art.background,b=bg.getBounds(),r=storyBackdrop.game.canvas.getBoundingClientRect(),cam=s.cameras.main;
   return {kind:s.spec.kind,id:s.spec.id,logical:{left:b.left,right:b.right,top:b.top,bottom:b.bottom},
    canvas:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},viewport:{w:innerWidth,h:innerHeight},
    frame:{x:cam.scrollX,y:cam.scrollY,w:cam.width,h:cam.height},
    uniform:Math.abs(bg.scaleX-bg.scaleY)<1e-8,mode:s.scale.scaleMode,original:!s.art.combatPlate,
    profile:s.art.motionProfile,expected:ADV.GateAmbience.environments[s.spec.id]};
  });}
  function check(r){
   assert(r.uniform,'no stretch '+r.id);
   assert(r.logical.left>=-.1&&r.logical.right<=1280.1&&r.logical.top>=-.1&&r.logical.bottom<=760.1,'whole painting '+r.id);
   assert(r.canvas.left>=-1&&r.canvas.top>=-1&&r.canvas.right<=r.viewport.w+1&&r.canvas.bottom<=r.viewport.h+1,'whole canvas '+r.id);
   assert(Math.abs(r.frame.x-r.logical.left)<1&&Math.abs(r.frame.y-r.logical.top)<1&&Math.abs(r.frame.w-(r.logical.right-r.logical.left))<1&&Math.abs(r.frame.h-(r.logical.bottom-r.logical.top))<1,'canvas matches painting aspect '+r.id);
   assert(r.original,'dialogue never uses combat adaptation '+r.id);
   if(r.kind==='environments')assert.deepEqual(r.profile,r.id==='morrak_realm'?{...r.expected,flameTone:'blue'}:r.expected,'original animated landmarks '+r.id);
  }
  for(const spec of specs){await show(spec);const r=await measure();check(r);report.push(r);}
  for(const viewport of [{width:1910,height:840},{width:1280,height:760},{width:390,height:844},{width:844,height:390}]){
   await p.setViewportSize(viewport);
   for(const [kind,id]of [['stills','bounty'],['stills','hiwot_sacrifice'],['environments','open_hand']]){
    await show({kind,id,phase:'night'});await p.waitForTimeout(180);const r=await measure();check(r);report.push(r);
    await p.screenshot({path:out+'/'+id+'-'+viewport.width+'.png'});
   }
  }
  console.log('PASS full composition: '+specs.length+' original scenes and 4 aspect ratios');
  await p.setViewportSize({width:1280,height:760});
  // A differently shaped still must not leave a cropped camera in the inn or
  // the next journey. Then the next still must restore its own framing again.
  for(const kind of ['inn','travel']){
   await show({kind:'stills',id:'hiwot_sacrifice'});
   await p.evaluate(kind=>storyBackdrop.show({kind,id:kind,run:ADV.Expedition.Run.fresh(),phase:'night',leg:'outbound'}),kind);
   await p.waitForFunction(kind=>storyBackdrop.state()?.kind===kind,kind);
   const frame=await p.evaluate(()=>{const c=storyBackdrop.game.scene.getScene('StoryBackdrop').cameras.main;return[c.scrollX,c.scrollY,c.width,c.height];});
   assert.deepEqual(frame,[0,0,1280,760],kind+' restores authored camera');
   await p.screenshot({path:out+'/transition-'+kind+'.png'});
   await show({kind:'stills',id:'bounty'});check(await measure());
  }
  await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{
   const response=await route.fetch();const body=(await response.text()).replace('const record=S.load();',
    `const pilot=S.open(S.fresh());Object.assign(pilot.record,{chapter:2,encounter:2,phase:'combat'});pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);for(const id of ['cassian','fennick']){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}S.Companions.select(pilot,['cassian','fennick']);const record=pilot.record;X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.qaReady=true;};`);
   await route.fulfill({response,body});
  });
  await p.goto(base+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');
  await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.qaReady,null,{timeout:90000});
  const ground=await p.evaluate(()=>{
   const s=storyGame.scene.getScene('StoryBattle');return {location:s.location,file:ADV.Expedition.Story.Stage.files[s.location],
    layers:s.battleArt.layerOrder,plate:s.battleArt.combatPlate,zoom:s.cameras.main.zoom,
    actors:[...s.actors.values()].map(a=>({name:a.name,x:a.root.x,y:a.root.y,home:a.home,scale:a.root.scaleX}))};
  });
  assert.equal(ground.location,'open_hand');assert(ground.file.endsWith('open-hand-combat-20261020.webp'));assert(ground.plate);assert.equal(ground.zoom,1);
  assert.deepEqual(ground.layers,['distance','weather-scenery','hero-ground']);
  for(const a of ground.actors)assert(a.y>=450&&a.y<=710,'clear floor '+a.name);
  await p.screenshot({path:out+'/open-hand-fight-desktop.png'});
  await p.evaluate(()=>{
   const s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion==='fennick'),foe=[...s.actors.values()].find(a=>a.side==='b');
   window.qaMotion=[];s.events.on('update',()=>qaMotion.push({x:a.root.x,y:a.root.y}));
   window.qaDone=false;a.play('walk',{x:foe.root.x-120,y:foe.root.y,duration:550}).then(()=>a.play('slash',{target:foe})).then(()=>a.play('walk',{x:a.home.x,y:a.home.y,duration:550})).then(()=>qaDone=true);
  });
  await p.waitForTimeout(650);await p.screenshot({path:out+'/open-hand-melee.png'});
  await p.waitForFunction(()=>qaDone);
  assert(await p.evaluate(()=>qaMotion.every(v=>v.y>=450&&v.y<=710)),'melee traversal grounded');
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(250);await p.screenshot({path:out+'/open-hand-fight-phone.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({report,ground,errors,missing},null,2));
  console.log('PASS inn/travel camera transitions; Chapter 2 courtyard, companions, melee traversal, 3 layers, desktop/phone; no missing files or page errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
