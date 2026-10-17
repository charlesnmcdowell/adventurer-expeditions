'use strict';
// Isolated marketing staging using the game's own battle director, actors and effects.
// No runtime files or real player saves are modified. Companions/foes are staged for the edit.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=__dirname;
for(const d of ['raw','review'])fs.mkdirSync(path.join(OUT,d),{recursive:true});
const frozen=new Map();
function freeze(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())freeze(p);else if(/\.(js|html|json)$/.test(p))frozen.set(p,fs.readFileSync(p));}}
freeze(path.join(ROOT,'js'));freeze(path.join(ROOT,'lib'));
frozen.set(path.join(ROOT,'docs/STORY_FIGHT_PREVIEW.html'),fs.readFileSync(path.join(ROOT,'docs/STORY_FIGHT_PREVIEW.html')));
const sourceHashes=Object.fromEntries([...frozen].map(([p,b])=>[path.relative(ROOT,p),crypto.createHash('sha256').update(b).digest('hex')]));
const server=http.createServer((req,res)=>{
 const file=path.resolve(ROOT,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const type={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});if(frozen.has(file))res.end(frozen.get(file));else fs.createReadStream(file).pipe(res);
});
const SHOTS=[
 {name:'01-santiago-beau',pair:['cassian','dorran'],chapter:3,encounter:2},
 {name:'02-winston-hiwot',pair:['fennick','wren_ward'],chapter:2,encounter:0},
 {name:'03-layla-wanjiru',pair:['ilvara','nettle'],chapter:8,encounter:0},
];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const report={shots:[],sourceHashes,errors:[]};
 try{for(const shot of SHOTS){
  const page=await browser.newPage({viewport:{width:1280,height:760}});
  page.on('pageerror',e=>report.errors.push(shot.name+': '+e.message));
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{
   const response=await route.fetch();let body=await response.text();
   body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());pilot.record.chapter=${shot.chapter};pilot.record.encounter=${shot.encounter};pilot.record.phase='combat';pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
    for(const id of ${JSON.stringify(shot.pair)}){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}
    S.Companions.select(pilot,${JSON.stringify(shot.pair)});const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__captureReady=true;};`);
   await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/docs/STORY_FIGHT_PREVIEW.html?reel=1');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__captureReady,null,{timeout:90000});
  const roster=await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.music?.pause();storyGame.sound.mute=true;ADV.Expedition.UI.resetCamera(s);return {location:s.location,actors:[...s.actors.values()].map(a=>({uid:a.uid,name:a.unit.ch.name,kind:a.kind,side:a.side,companion:a.unit.ch.expeditionStoryCompanion}))};});
  console.log('READY',shot.name,JSON.stringify(roster));
  await page.screenshot({path:path.join(OUT,'review',shot.name+'-start.png')});
  await page.evaluate(()=>{
   const stream=storyGame.canvas.captureStream(30),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:14000000});
   window.cap={stream,chunks,recorder};recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start(100);window.markers=[];window.captureStart=performance.now();
  });
  await page.evaluate(async(pair)=>{
   const A=ADV,X=A.Expedition,s=storyGame.scene.getScene('StoryBattle');
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const mark=(type,data={})=>markers.push({type,time:(performance.now()-captureStart)/1000,...data});
   const allies=pair.map(id=>[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion===id));
   const foes=[...s.actors.values()].filter(a=>a.side==='b'),boss=foes.find(a=>a.unit.ch.boss)||foes.at(-1);
   if(allies.some(a=>!a))throw Error('Companion absent from battle');
   const attack=async(actor,target,skill,kill=false)=>{
    const dmg=kill?target.unit.chp:Math.max(1,Math.floor(target.unit.maxHp*.14));
    target.unit.chp=kill?0:Math.max(1,target.unit.chp-dmg);
    const events=[{t:'use',uid:actor.uid,target:target.uid,skillId:skill},{t:'damage',uid:target.uid,by:actor.uid,dmg,tag:'attack'}];
    if(kill)events.push({t:'down',uid:target.uid,by:actor.uid});
    mark('attack',{actor:actor.unit.ch.name,target:target.unit.ch.name,skill,kill});
    await X.Beats.play(s,{hero:actor===s.hero,events,choice:{action:{skillId:skill},how:'auto'}});
   };
   await wait(250);
   // Both selected companions get a readable action before Hiro's ending strike.
   const support=foes.filter(a=>a!==boss);
   await attack(allies[0],support[0]||boss,'basic_attack',!!support[0]);
   await wait(100);
   const id2=allies[1].unit.ch.expeditionStoryCompanion;
   const skill=id2==='dorran'?'cleave':id2==='wren_ward'?'backstab':'wither_touch';
   await attack(allies[1],support[1]||boss,skill,!!support[1]);
   await attack(boss,s.hero,'basic_attack',false);
   await attack(s.hero,boss,'basic_attack',false);
   for(const extra of support.filter(a=>a.alive))await attack(s.hero,extra,'basic_attack',true);
   await wait(150);
   boss.unit.chp=Math.max(1,Math.floor(boss.unit.maxHp*.18));boss.refresh();
   mark('finisher-start',{target:boss.unit.ch.name,kind:boss.kind});
   // Same tapped-finisher event shape as the live simulator, including its paired animation.
   boss.unit.chp=0;
   await X.Beats.play(s,{hero:true,choice:{how:'request',action:{skillId:'finisher'}},events:[
    {t:'use',uid:s.hero.uid,target:boss.uid,skillId:'finisher'},
    {t:'execute',uid:boss.uid,by:s.hero.uid},
    {t:'damage',uid:boss.uid,by:s.hero.uid,dmg:boss.unit.maxHp,tag:'attack'},
    {t:'down',uid:boss.uid,by:s.hero.uid}
   ]});
   X.UI.resetCamera(s);mark('finisher-end',{remaining:foes.filter(a=>a.alive).length});
   await s.hero.play('victory');mark('victory-end');await wait(300);
  },shot.pair);
  await page.screenshot({path:path.join(OUT,'review',shot.name+'-end.png')});
  const result=await page.evaluate(()=>new Promise(resolve=>{
   cap.recorder.onstop=()=>{cap.stream.getTracks().forEach(t=>t.stop());const r=new FileReader();r.onload=()=>resolve({b64:r.result.split(',')[1],markers,duration:(performance.now()-captureStart)/1000});r.readAsDataURL(new Blob(cap.chunks,{type:'video/webm'}));};cap.recorder.stop();
  }));
  fs.writeFileSync(path.join(OUT,'raw',shot.name+'.webm'),Buffer.from(result.b64,'base64'));delete result.b64;
  report.shots.push({...shot,...roster,...result});fs.writeFileSync(path.join(OUT,'capture.json'),JSON.stringify(report,null,2));
  console.log('CAPTURED',shot.name,result.duration,JSON.stringify(result.markers));await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
