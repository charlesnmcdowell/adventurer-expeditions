// Read-only runtime inspection/capture in an isolated browser profile.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),phase=process.argv.includes('--before')?'before':'after';
const OUT=path.join(__dirname,'reports/sprite-cleanup',phase);fs.mkdirSync(OUT,{recursive:true});
const allowed=new Set(require('../tools/size_check').shipList().files);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.css':'text/css','.mp3':'audio/mpeg'};
const server=http.createServer((q,r)=>{const rel=q.url.split('?')[0].replace(/^\//,'')||'index.html';if(!allowed.has(rel)){r.writeHead(404);return r.end();}r.setHeader('Content-Type',mime[path.extname(rel)]||'application/octet-stream');fs.createReadStream(path.join(ROOT,rel)).pipe(r);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?fresh=1&renderer=canvas');
 await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 await page.evaluate(()=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition');s.fight=async function(first){await this.intro(first);this.__pilotReady=true;};X.fx.cinematics=false;__game.sound.mute=true;});
 for(const [actor,q,w] of [['plant','rain',1],['orc','city',2],['alpha','rain',2]]){
  await page.evaluate(([q,w])=>{const X=ADV.Expedition,r=X.Run.fresh();r.questId=q;r.wave=w;r.phase='quest';__game.scene.getScene('Expedition').__pilotReady=false;X.Dev.go(__game.scene.getScenes(true)[0],'Expedition',{run:r,seed:9});},[q,w]);
  await page.waitForFunction(()=>__game.scene.getScene('Expedition').__pilotReady);
  await page.screenshot({path:path.join(OUT,actor+'-idle.png')});
  await page.evaluate(()=>{const stream=__game.canvas.captureStream(30),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:6000000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};window.__record={stream,chunks,rec};rec.start(200);});
  await page.waitForTimeout(600);
  const state=await page.evaluate(async actor=>{
   const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),target=[...s.actors.values()].find(a=>a.side==='b'&&X.paintedActorOf(a)===actor);
   const scale=s.hero.img.scaleY,texture=s.hero.img.texture.key;
   const measurements=[];
   const frame=(anim,f)=>{if(actor==='plant')return;measurements.push({frame:f.textureFrame,scale:s.hero.img.scaleY});};s.hero.img.on('animationupdate',frame);
   if(actor==='plant'){for(let i=0;i<4;i++)await target.play('lash');}
   else {
    const saved=X.clipFor;
    if(actor==='alpha')X.clipFor=()=>['hiro-alpha-cleave-paired'];
    try{await s.hero.play('finisher',{target,lethal:true,finisherVariant:1});}
    finally{X.clipFor=saved;}
   }
   s.hero.img.off('animationupdate',frame);
   return{actor,scaleBefore:scale,scaleAfter:s.hero.img.scaleY,textureBefore:texture,textureAfter:s.hero.img.texture.key,measurements};
  },actor);
  await page.waitForTimeout(1000);
  if(phase==='after') {
   for(const frame of state.measurements.filter(f=>String(f.frame).startsWith('walk/')))
    assert.equal(frame.scale,state.scaleBefore,'Locomotion must keep Hiro native scale');
   if(actor==='alpha') {
    const paired=state.measurements.filter(f=>String(f.frame).startsWith('hiro-alpha-cleave-paired/'));
    assert.ok(paired.length,'Measured Alpha pair');
    assert.ok(paired.every(f=>Math.abs(f.scale-(330/360*320/245))<1e-8),'Alpha body reference applied');
   }
  }
  assert.equal(state.scaleAfter,state.scaleBefore);assert.equal(state.textureAfter,state.textureBefore);
  await page.screenshot({path:path.join(OUT,actor+'-after.png')});results.push(state);
  const encoded=await page.evaluate(()=>new Promise(resolve=>{const c=__record;c.rec.onstop=()=>{c.stream.getTracks().forEach(t=>t.stop());const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(c.chunks,{type:'video/webm'}));};c.rec.stop();}));
  fs.writeFileSync(path.join(OUT,actor+'.webm'),Buffer.from(encoded,'base64'));console.log(phase,actor,'passed');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({results,errors},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
