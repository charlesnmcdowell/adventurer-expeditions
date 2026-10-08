'use strict';
// Real paired lifecycle: every variant, native transform on release and cancel.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'test/reports/combat-roster');
fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.css':'text/css','.mp3':'audio/mpeg'};
const srv=http.createServer((q,r)=>{const rel=q.url.split('?')[0].replace(/^\//,'')||'index.html',p=path.join(ROOT,rel);if(!p.startsWith(ROOT)||!fs.existsSync(p)){r.writeHead(404);return r.end();}r.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(r);});
const CASES=[['rain',0,'wolf'],['rain',1,'plant'],['rain',2,'alpha'],['marsh',0,'serpent'],['marsh',0,'beetle'],['marsh',1,'moss_giant'],['marsh',2,'hag'],['city',0,'goblin'],['city',0,'spider'],['city',2,'orc']];
(async()=>{
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const browser=await require('playwright').chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+srv.address().port+'/index.html?fresh=1&renderer=canvas');
  await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
  await page.evaluate(()=>{const s=__game.scene.getScene('Expedition');s.fight=async function(first){await this.intro(first);this.__rosterReady=true;};ADV.Expedition.fx.cinematics=false;__game.sound.mute=true;});
  for(const [quest,wave,actor] of CASES){
   await page.evaluate(([quest,wave])=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),r=X.Run.fresh();r.questId=quest;r.wave=wave;r.phase='quest';r.tutorial.skipGuide=true;s.__rosterReady=false;X.Dev.go(s,'Expedition',{run:r,seed:9});},[quest,wave]);
   await page.waitForFunction(()=>__game.scene.getScene('Expedition').__rosterReady);
   await page.evaluate(()=>{const stream=__game.canvas.captureStream(60),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5000000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};window.__rosterRecording={stream,chunks,rec};rec.start(100);});
   const result=await page.evaluate(async actor=>{
    const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),hero=s.hero,foe=[...s.actors.values()].find(a=>a.sheet?.actor===actor);
    if(!foe)throw Error('Missing '+actor);
    const sheet=['wolf','plant'].includes(actor)?hero.sheet:foe.sheet;
    const clips=Object.entries(sheet.clips).filter(([id,c])=>c.paired&&c.opponentKeys?.some(k=>X.paintedActorOfKey(k)===actor)&&/^(hiro-|wolf-|plant-)/.test(id));
    const results=[];
    const assertNative=()=>{if(hero.img.texture.key!==hero.sheet.key||Math.abs(hero.img.scaleY-hero._baseScaleY)>.001||!hero.root.visible||!hero.img.visible)throw Error(actor+': native state not restored');};
    const attackId=actor==='plant'?'lash':actor==='wolf'?'bite':'attack';
    const attack=foe.sheet.clips[attackId],attackFrames=new Set();let attackContacts=0;
    const watchAttack=()=>{if(foe.img.anims.currentAnim?.key.endsWith(':'+attackId))attackFrames.add(foe.img.frame.name);};
    foe.img.on('animationstart',watchAttack);foe.img.on('animationupdate',watchAttack);
    try{await foe.play(attackId,{onContact:()=>attackContacts++});}
    finally{foe.img.off('animationstart',watchAttack);foe.img.off('animationupdate',watchAttack);}
    if(attackFrames.size!==attack.frames.length||attackContacts!==1)throw Error(actor+': incomplete attack or wrong contact count');
    for(const [id,c] of clips){
     foe.alive=true;foe.unit.downed=false;foe.root.setVisible(true);foe.img.setVisible(true);foe.idle();
     const save=X.clipFor;X.clipFor=()=>[id];let invisible=false,contacts=0;const seen=new Set();
     const watch=()=>{if(hero.img.anims.currentAnim?.key.endsWith(':'+id)){seen.add(hero.img.frame.name);if(!hero.root.visible||!hero.img.visible||hero.img.alpha<.99)invisible=true;}};
     hero.img.on('animationupdate',watch);hero.img.on('animationstart',watch);
     try{await hero.play('finisher',{target:foe,lethal:true,finisherVariant:id==='hiro-finisher-2'?1:0,onContact:()=>contacts++});}
     finally{X.clipFor=save;hero.img.off('animationupdate',watch);hero.img.off('animationstart',watch);}
     assertNative();if(invisible||seen.size!==c.frames.length)throw Error(actor+'/'+id+': visibility/frames '+seen.size+'/'+c.frames.length);
     if(contacts!==1)throw Error(actor+'/'+id+': expected exactly one logical contact, got '+contacts);
     results.push({id,frames:seen.size,contacts,visible:true,nativeRestored:true});
    }
    // Cancellation before impact must not leave a borrowed atlas/scale active.
    foe.alive=true;foe.unit.downed=false;foe.root.setVisible(true);foe.img.setVisible(true);foe.idle();
    const pending=hero.play('finisher',{target:foe,lethal:true});
    await new Promise(r=>setTimeout(r,400));hero.cancelPlayback();await pending;hero.idle();assertNative();
    if(!foe.alive||!foe.root.visible||!foe.img.visible)throw Error(actor+': cancelled finisher left enemy hidden/dead');
    return {actor,attack:{id:attackId,frames:attackFrames.size,contacts:attackContacts},clips:results,cancellationRestored:true};
   },actor);
   report.push(result);console.log(actor+': '+result.clips.length+' variants passed');
   const video=await page.evaluate(()=>new Promise(resolve=>{const c=__rosterRecording;c.rec.onstop=()=>{c.stream.getTracks().forEach(t=>t.stop());const f=new FileReader();f.onload=()=>resolve(f.result.split(',')[1]);f.readAsDataURL(new Blob(c.chunks,{type:'video/webm'}));};c.rec.stop();}));
   fs.writeFileSync(path.join(OUT,actor+'.webm'),Buffer.from(video,'base64'));
   await page.screenshot({path:path.join(OUT,actor+'-restored.png')});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));
  console.log('browser_combat_roster: all visible frames, release and cancellation pass');
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
