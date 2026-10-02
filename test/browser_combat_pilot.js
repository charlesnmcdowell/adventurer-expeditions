'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'test/reports/combat-pilot');fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.css':'text/css','.mp3':'audio/mpeg'};
const srv=http.createServer((q,r)=>{const rel=q.url.split('?')[0].replace(/^\//,'')||'index.html',p=path.join(ROOT,rel);if(!p.startsWith(ROOT)||!fs.existsSync(p)){r.writeHead(404);return r.end();}r.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(r);});
(async()=>{
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const browser=await require('playwright').chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
 await page.goto('http://127.0.0.1:'+srv.address().port+'/index.html?fresh=1&renderer=canvas');
 await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 await page.evaluate(()=>{const s=__game.scene.getScene('Expedition');s.fight=async function(first){await this.intro(first);this.__pilotReady=true;};ADV.Expedition.fx.cinematics=false;__game.sound.mute=true;});
 const reset=async()=>{
  await page.evaluate(()=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),r=X.Run.fresh();r.questId='rain';r.wave=2;r.phase='quest';r.tutorial.skipGuide=true;s.__pilotReady=false;X.Dev.go(s,'Expedition',{run:r,seed:9});});
  await page.waitForFunction(()=>__game.scene.getScene('Expedition').__pilotReady);
 };
 const record=async(name,fn)=>{
  await page.evaluate(()=>{const stream=__game.canvas.captureStream(60),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:6000000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};window.__rec={stream,chunks,rec};rec.start(100)});
  await fn();await page.waitForTimeout(300);
  const b64=await page.evaluate(()=>new Promise(r=>{const c=__rec;c.rec.onstop=()=>{c.stream.getTracks().forEach(t=>t.stop());const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(new Blob(c.chunks,{type:'video/webm'}));};c.rec.stop()}));
  fs.writeFileSync(path.join(OUT,name+'.webm'),Buffer.from(b64,'base64'));
 };
 await reset();await page.screenshot({path:path.join(OUT,'idle.png')});
 await record('smoother-combat',()=>page.evaluate(async()=>{
  const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='alpha');
  for(let i=0;i<3;i++){await s.hero.play('slash',{target:a});await s.hero.play('hit_short');await a.play('bite');}
  const save=X.clipFor;X.clipFor=()=>['hiro-alpha-cleave-paired'];
  try{await s.hero.play('finisher',{target:a,lethal:true});}finally{X.clipFor=save;}
 }));
 await reset();
 await page.evaluate(()=>{const s=__game.scene.getScene('Expedition');s.corner.togglePause()});
 const setting=await page.evaluate(()=>__game.scene.getScene('Expedition').__settingRects.find(r=>r.label==='Enemy finishers').rect);
 await page.mouse.click(setting.x+setting.w/2,setting.y+setting.h/2);
 assert.equal(await page.evaluate(()=>ADV.Expedition.EnemyFinishers.enabled()),true);
 await page.screenshot({path:path.join(OUT,'settings.png')});
 await page.evaluate(()=>__game.scene.getScene('Expedition').corner.togglePause());
 await record('alpha-defeat',async()=>{
  await page.evaluate(()=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='alpha');s.hero.unit.chp=0;window.__fatalDone=false;X.Beats.ticksOnly(s,[{t:'damage',uid:s.hero.uid,by:a.uid,dmg:99,tag:'hit'},{t:'down',uid:s.hero.uid,by:a.uid}]).then(()=>window.__fatalDone=true);});
  await page.waitForFunction(()=>__game.scene.getScene('Expedition').__enemyFinishSprite);
  await page.evaluate(()=>__game.scene.getScene('Expedition').paused=true);
  const before=await page.evaluate(()=>__game.scene.getScene('Expedition').__enemyFinishSprite.frame.name);
  await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>__game.scene.getScene('Expedition').__enemyFinishSprite.frame.name),before);
  await page.evaluate(()=>__game.scene.getScene('Expedition').paused=false);
  await page.waitForTimeout(950);await page.screenshot({path:path.join(OUT,'fatal-contact.png')});
  await page.waitForFunction(()=>__fatalDone);assert.equal(await page.evaluate(()=>__game.scene.getScene('Expedition').__enemyFinishPresented),true);
  await page.screenshot({path:path.join(OUT,'fatal-end.png')});
 });
 await reset();
 await page.evaluate(()=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='alpha');s.hero.unit.chp=0;window.__cancelDone=false;X.EnemyFinishers.play(s,a,s.hero).then(v=>{window.__cancelResult=v;window.__cancelDone=true;});});
 await page.waitForFunction(()=>__game.scene.getScene('Expedition').__enemyFinishSprite);
 await reset();await page.waitForFunction(()=>__cancelDone);assert.equal(await page.evaluate(()=>__cancelResult),false);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('Expedition').cameras.main.zoom),1);
 await page.evaluate(async()=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='alpha');X.EnemyFinishers.setEnabled(false);s.hero.unit.chp=0;await X.Beats.ticksOnly(s,[{t:'damage',uid:s.hero.uid,by:a.uid,tag:'hit'},{t:'down',uid:s.hero.uid,by:a.uid}]);});
 assert.equal(await page.evaluate(()=>!!__game.scene.getScene('Expedition').__enemyFinishPresented),false);
 await reset();
 await page.evaluate(()=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),a=[...s.actors.values()].find(a=>a.sheet?.actor==='alpha');X.EnemyFinishers.setEnabled(true);s.hero.unit.chp=0;window.__offDone=false;X.EnemyFinishers.play(s,a,s.hero).then(v=>{window.__offResult=v;window.__offDone=true;});});
 await page.waitForFunction(()=>__game.scene.getScene('Expedition').__enemyFinishSprite);
 await page.evaluate(()=>ADV.Expedition.EnemyFinishers.setEnabled(false));
 await page.waitForFunction(()=>__offDone);assert.equal(await page.evaluate(()=>__offResult),false);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('Expedition').hero.root.visible),true);
 // A forged/carry-over local preference cannot unlock portal art or its menu.
 const portal=await browser.newContext(),requests=[];
 await portal.addInitScript(()=>localStorage.setItem('expeditions.enemyFinishers.v1','1'));
 await portal.route('**/js/core/release_config.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("target: 'website'","target: 'crazygames'")});});
 const pp=await portal.newPage();pp.on('request',r=>requests.push(r.url()));
 await pp.goto('http://127.0.0.1:'+srv.address().port+'/index.html?fresh=1&renderer=canvas');
 await pp.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 assert.equal(await pp.evaluate(()=>ADV.Expedition.EnemyFinishers.setEnabled(true)),false);
 await pp.evaluate(()=>__game.scene.getScene('Expedition').corner.togglePause());
 assert.equal(await pp.evaluate(()=>__game.scene.getScene('Expedition').__settingRects.some(r=>r.label==='Enemy finishers')),false);
 assert.equal(requests.some(u=>u.includes('/adult/')),false);await portal.close();
 assert.deepEqual(errors,[]);console.log('browser_combat_pilot: clips, menu toggle, fatal routing, pause, shutdown, off fallback pass');
 } finally {await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
