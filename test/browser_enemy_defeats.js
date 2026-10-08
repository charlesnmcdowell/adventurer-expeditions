'use strict';
// Real lethal-hit routing for each local-only defeat atlas, with frame evidence.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'test/reports/enemy-defeats');
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
  await page.evaluate(()=>{const s=__game.scene.getScene('Expedition');s.fight=async function(first){await this.intro(first);this.__fatalReady=true;};ADV.Expedition.fx.cinematics=false;__game.sound.mute=true;});
  for(const [quest,wave,actor] of CASES){
   await page.evaluate(([quest,wave])=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),r=X.Run.fresh();r.questId=quest;r.wave=wave;r.phase='quest';r.tutorial.skipGuide=true;s.__fatalReady=false;X.Dev.go(s,'Expedition',{run:r,seed:9});},[quest,wave]);
   await page.waitForFunction(()=>__game.scene.getScene('Expedition').__fatalReady);
   await page.evaluate(()=>{const stream=__game.canvas.captureStream(60),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5000000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};window.__recording={stream,chunks,rec};rec.start(100);});
   const result=await page.evaluate(async actor=>{
    const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),h=s.hero,a=[...s.actors.values()].find(a=>a.sheet?.actor===actor);
    if(!a)throw Error('Missing '+actor);
    X.EnemyFinishers.setEnabled(true);
    const data=s.cache.json.get('xp_'+actor+'_fatal_clips'),clip=data?.clips[actor+'-fatal'];
    if(!clip)throw Error('Missing fatal atlas '+actor);
    const seen=new Set();let badVisibility=false;
    const watch=()=>{const p=s.__enemyFinishSprite;if(!p)return;seen.add(p.frame.name);if(h.root.visible||a.root.visible||!p.visible||p.alpha<.99)badVisibility=true;};
    s.events.on('update',watch);h.unit.chp=0;
    try{await X.Beats.ticksOnly(s,[{t:'damage',uid:h.uid,by:a.uid,dmg:99,tag:'hit'},{t:'down',uid:h.uid,by:a.uid}]);watch();}
    finally{s.events.off('update',watch);}
    if(!s.__enemyFinishPresented||h.alive||badVisibility)throw Error(actor+': defeat/visibility failed');
    if(seen.size!==clip.frames.length)throw Error(actor+': missed frames '+seen.size+'/'+clip.frames.length);
    if(s.__enemyFinishSprite.frame.name!==clip.frames.at(-1))throw Error(actor+': final pose not held');
    return {actor,frames:seen.size,visible:true,lethalRouting:true,finalPoseHeld:true,zoom:s.cameras.main.zoom};
   },actor);
   report.push(result);console.log(actor+': '+result.frames+' frames, lethal routing passed');
   await page.screenshot({path:path.join(OUT,actor+'-end.png')});
   const b64=await page.evaluate(()=>new Promise(resolve=>{const c=__recording;c.rec.onstop=()=>{c.stream.getTracks().forEach(t=>t.stop());const f=new FileReader();f.onload=()=>resolve(f.result.split(',')[1]);f.readAsDataURL(new Blob(c.chunks,{type:'video/webm'}));};c.rec.stop();}));
   fs.writeFileSync(path.join(OUT,actor+'.webm'),Buffer.from(b64,'base64'));
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));
  console.log('browser_enemy_defeats: all ten local defeat clips pass');
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
