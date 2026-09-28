'use strict';
// Marketing-only staging. Uses shipped scene setup, actors, paired moves and FX.
// Does not write game saves outside this fresh disposable browser context.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=__dirname;
fs.mkdirSync(path.join(OUT,'raw'),{recursive:true});
fs.mkdirSync(path.join(OUT,'review'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.css':'text/css','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'')||'index.html';
 const file=path.resolve(ROOT,rel);
 if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],clips=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 try {
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?fresh=1&renderer=canvas');
 await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 await page.evaluate(()=>{
  const X=ADV.Expedition,s=__game.scene.getScene('Expedition');
  ADV.Music.muted=true; __game.sound.mute=true; X.fx.cinematics=true;
  s.fight=async function(){this.__captureReady=true;};
  X.TravelScene.prototype.play=function(){};
  window.captureHelpers={
   wait:ms=>new Promise(r=>setTimeout(r,ms)),
   scene:()=>__game.scene.getScene('Expedition'),
   foe:id=>[...__game.scene.getScene('Expedition').actors.values()].find(a=>a.side==='b'&&X.paintedActorOf(a)===id&&a.alive),
   async finish(id,variant=0,cinematic=true){
    const s=this.scene(),target=this.foe(id),hero=s.hero;
    if(!target)throw Error('No target '+id);
    target.unit.chp=Math.min(target.unit.chp,Math.floor(target.unit.maxHp*.2));target.refresh();
    const act=async()=>{
     await hero.play('finisher',{target,lethal:true,level:1,finisherVariant:variant,onContact:()=>{
      ADV.VFX.flashOverlay(s,0xffffff,.18);ADV.VFX.burst(s,target.chest().x,target.chest().y,0xd9c2ff,12);
      target.unit.chp=0;
     }});
     if(target.alive)await target.play('down_fade');else X.DefeatFX.play(target);
    };
    if(cinematic)await X.UI.cinematic(s,'kill',{x:(hero.x+target.x)/2,y:hero.y-hero.height*.45},act);else await act();
   }
  };
 });
 async function battle(q,w,draw=true){
  await page.evaluate(([q,w])=>{
   const X=ADV.Expedition,r=X.Run.fresh(),s=__game.scene.getScene('Expedition');
   r.questId=q;r.wave=w;r.phase='quest';r.tutorial.arrowDone=true;r.tutorial.finisherDone=true;
   s.__captureReady=false;X.Dev.go(__game.scene.getScenes(true)[0],'Expedition',{run:r,seed:41});
  },[q,w]);
  await page.waitForFunction(()=>__game.scene.getScene('Expedition').__captureReady);
  if(draw)await page.evaluate(()=>captureHelpers.scene().intro(false));
  await page.waitForTimeout(200);
 }
 async function record(name,seconds,action){
  console.log('CAPTURE',name);
  await page.evaluate(()=>{
   const stream=__game.canvas.captureStream(30),chunks=[];
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:10000000});
   window.__capture={recorder,stream,chunks};recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start(250);
  });
  const start=Date.now();
  await page.evaluate(action);
  await page.waitForTimeout(Math.max(0,seconds*1000-(Date.now()-start)));
  await page.screenshot({path:path.join(OUT,'review',name+'.png')});
  const b64=await page.evaluate(()=>new Promise(resolve=>{
   const c=__capture;c.recorder.onstop=()=>{c.stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(c.chunks,{type:'video/webm'}));};c.recorder.stop();
  }));
  fs.writeFileSync(path.join(OUT,'raw',name+'.webm'),Buffer.from(b64,'base64'));
  clips.push({name,seconds,capturedSeconds:(Date.now()-start)/1000});
  fs.writeFileSync(path.join(OUT,'capture.json'),JSON.stringify({clips,errors},null,2));
 }
 await battle('road',0,false);
 await record('01-hiro-intro',5,async()=>{await captureHelpers.scene().intro(true);});
 await record('02-wolf-exchange',6,async()=>{
  const h=captureHelpers,s=h.scene(),a=h.foe('wolf');
  await Promise.all([a.play('leap',{target:s.hero}),s.hero.play('intercept')]);
  await s.hero.play('riposte',{target:a,onContact:()=>a.play('hit_short')});
  await a.play('land_beside');
  await s.hero.play('slash',{target:a,onContact:()=>a.play('hit_short')});
 });
 await record('03-wolf-finisher',4,async()=>{await captureHelpers.finish('wolf');});
 async function travel(name,q,w,seconds){
  await page.evaluate(([q,w])=>{const X=ADV.Expedition,r=X.Run.fresh();r.questId=q;r.wave=w;r.phase='travel';r.travelLeg='midleg';X.Dev.go(__game.scene.getScenes(true)[0],'Travel',{run:r,leg:'midleg'});},[q,w]);
  await page.waitForFunction(()=>__game.scene.isActive('Travel')&&__game.scene.getScene('Travel').__presentationReady);
  await page.evaluate(()=>__game.scene.getScene('Travel').pano.seek(2000));
  await record(name,seconds,async()=>{});
 }
 await travel('04-forest-vault','rain',1,5);
 await battle('marsh',0);
 await record('05-swamp-serpent',6,async()=>{
  const h=captureHelpers,s=h.scene(),a=h.foe('serpent');
  await a.play('slash',{target:s.hero,onContact:()=>s.hero.play('hit_short')});
  await s.hero.play('aura',{level:1});
  await h.finish('serpent',0,false);
 });
 await battle('marsh',1);
 await record('06-moss-giant',4,async()=>{await captureHelpers.finish('moss_giant',1,false);});
 await travel('07-city-vault','city',2,4);
 await battle('city',0);
 await record('08-goblin-finisher',4,async()=>{await captureHelpers.finish('goblin',0,false);});
 await record('09-spider-finisher',4,async()=>{await captureHelpers.finish('spider',1,false);});
 for(let i=0;i<5;i++){
  await page.evaluate(i=>{const X=ADV.Expedition,r=X.Run.fresh();r.phase='inn';r.cycles={rain:i};r.tutorial.embarkDone=true;X.Dev.go(__game.scene.getScenes(true)[0],'Inn',{run:r});},i);
  await page.waitForFunction(()=>__game.scene.isActive('Inn')&&__game.scene.getScene('Inn').__presentationReady);
  await record('10-inn-'+i,1.6,async()=>{});
 }
 await battle('rain',2);
 await record('11-alpha-boss',5,async()=>{await captureHelpers.foe('alpha').play('enrage');await captureHelpers.finish('alpha',0,false);});
 await battle('city',2);
 await record('12-orc-boss',6,async()=>{
  const h=captureHelpers,s=h.scene(),a=h.foe('orc');
  await a.play('enrage');await h.finish('orc',1,true);
 });
 await record('13-victory',5,async()=>{const s=captureHelpers.scene();ADV.Expedition.UI.resetCamera(s);await s.hero.play('victory');});
 if(errors.length)throw Error(JSON.stringify(errors));
 console.log('DONE',clips.length,'clips');
 } finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
