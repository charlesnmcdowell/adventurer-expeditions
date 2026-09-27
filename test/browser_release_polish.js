'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'reports/release-polish');
const allowed=new Set(require('../tools/size_check').shipList().files);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.css':'text/css','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'')||'index.html';if(!allowed.has(rel)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(rel)]||'application/octet-stream');fs.createReadStream(path.join(ROOT,rel)).pipe(res);});
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await require('playwright').chromium.launch({headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],timings=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?fresh=1&renderer=canvas');
 await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 await page.evaluate(()=>{__game.scene.getScene('Expedition').fight=async function(first){await this.intro(first);this.__polishReady=true;};});
 for(const [q,w,stage] of [['rain',2,'mountain'],['city',0,'city'],['city',2,'city']]) {
  await page.evaluate(([q,w])=>{const X=ADV.Expedition,r=X.Run.fresh();r.questId=q;r.wave=w;r.phase='quest';const s=__game.scene.getScene('Expedition');s.__polishReady=false;X.Dev.go(__game.scene.getScenes(true)[0],'Expedition',{run:r,seed:17});},[q,w]);
  await page.waitForFunction(()=>__game.scene.getScene('Expedition').__polishReady,null,{timeout:30000});
  assert.equal(await page.evaluate(()=>__game.scene.getScene('Expedition').env.background.texture.key),'xp_stage_'+stage);
  await page.screenshot({path:path.join(OUT,q+'-'+w+'-ground.png')});
  if(q==='rain') for(const level of [1,2,3]) {
   await page.evaluate(level=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),a=[...s.actors.values()].find(a=>a.side==='b');a.alive=true;a.root.setVisible(true);a.img.setAlpha(1);a.idle();s.hero.root.x=s.hero.home.x;s.__done=false;s.__contact=false;const start=performance.now();s.hero.play('finisher',{target:a,lethal:true,level,onContact:()=>s.__contact=true}).then(()=>{s.__elapsed=performance.now()-start;s.__done=true;});},level);
   await page.waitForFunction(()=>__game.scene.getScene('Expedition').__contact);
   await page.screenshot({path:path.join(OUT,'alpha-finisher-'+level+'.png')});
   await page.waitForFunction(()=>__game.scene.getScene('Expedition').__done);
   const ms=await page.evaluate(()=>__game.scene.getScene('Expedition').__elapsed);assert(ms>=1350&&ms<4000,'unexpected duration '+ms);timings.push({level,ms});
  }
 }
 for(const width of [1280,390]) {
  await page.setViewportSize({width,height:Math.round(width*760/1280)});
  for(const clears of [1,2]) {
   await page.evaluate(clears=>{const X=ADV.Expedition,r=X.Run.fresh();r.phase='inn';r.cycles={rain:clears};X.Dev.go(__game.scene.getScenes(true)[0],'Inn',{run:r});},clears);
   await page.waitForFunction(clears=>{const s=__game.scene.getScene('Inn');return __game.scene.isActive('Inn')&&s.__presentationReady&&s.run.cycles.rain===clears;},clears);
   const state=await page.evaluate(()=>{const s=__game.scene.getScene('Inn');return{variant:s.env.variant,roster:s.run.roster,field:s.run.field,locks:s.lockedButtons.length};});
   assert.equal(state.variant,clears===1?'inn-hiro-bram':'inn-hiro-solo');assert.deepEqual(state.roster,[]);assert.deepEqual(state.field,[]);assert.equal(state.locks,1);
   await page.screenshot({path:path.join(OUT,'inn-'+clears+'-'+width+'.png')});
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({timings,errors},null,2));console.log('release polish: both floors, all Alpha finishers and solo/guest inn at desktop/mobile passed');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
