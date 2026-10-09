'use strict';
// Actual UI taps, carry-health encounters, travel and inn; serve only shipped files.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'reports/expansion');
fs.mkdirSync(OUT,{recursive:true});
const allowed=new Set(require('../tools/size_check').shipList().files);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg','.css':'text/css'};
const server=http.createServer((q,r)=>{const rel=q.url.split('?')[0].replace(/^\//,'')||'index.html';if(!allowed.has(rel)){r.writeHead(404);return r.end();}r.setHeader('Content-Type',mime[path.extname(rel)]||'application/octet-stream');fs.createReadStream(path.join(ROOT,rel)).pipe(r);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await require('playwright').chromium.launch({channel:'chrome',headless:true});
 const width=process.argv.includes('--mobile')?390:1280;
 const page=await browser.newPage({viewport:{width,height:Math.round(width*760/1280)}}),errors=[],visits=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?fresh=1&renderer=canvas');
 await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 await page.evaluate(()=>{const X=ADV.Expedition,r=X.Run.fresh();r.questId='coast';r.questsDone=['rain','marsh','city'];r.phase='inn';r.score=5000;r.tutorial.skipGuide=true;r.tutorial.arrowDone=true;r.tutorial.embarkDone=true;X.Run.save(r);X.Dev.go(__game.scene.getScenes(true)[0],'Inn',{run:r,seed:17});});
 // Reload an existing save at the new location boundary, rather than relying on dev state.
 await page.reload();await page.waitForFunction(()=>__game.scene.isActive('Inn')&&__game.scene.getScene('Inn').__presentationReady);
 let last='',cleared=false;const until=Date.now()+600000;
 while(Date.now()<until){
  const state=await page.evaluate(()=>{
   const X=ADV.Expedition,s=__game.scene.getScenes(true).find(s=>['Inn','Travel','Expedition','End'].includes(s.sys.settings.key));
   if(!s||!s.__presentationReady&&s.sys.settings.key!=='End')return {};
   const type=s.sys.settings.key,o={type,q:s.run?.questId,w:s.run?.wave,leg:s.leg,track:ADV.Music.track,done:s.run?.questsDone,zoom:s.cameras.main.zoom};
   if(type==='Inn'){o.rest=s.restBtn?.rect;o.embark=s.embarkBtn?.rect;o.canRest=X.Encounter.canRest(s.run).ok;}
   if(type==='Expedition'){
    o.hp=s.hero.unit.chp;o.bosses=[...s.actors.values()].filter(a=>a.unit.ch.boss).map(a=>a.sheet.actor);
    if(s.hud.completionCard)o.tap=s.hud.completionCard.replayRect;
    else if(s.arrowArmed)o.tap=s.hud.arrow.rect;
    else {const id=['finisher','counter_attack','god_aura'].find(id=>X.Encounter.skillState(s.enc,id).ready);if(id)o.tap=s.hud.icons[id]?.rect;}
   }
   return o;
  });
  if(!state.type){await page.waitForTimeout(150);continue;}
  assert.notEqual(state.type,'End','Hiro fell before completing expansion: '+JSON.stringify(state));
  const key=[state.type,state.q,state.w,state.leg].join(':');
  if(key!==last){last=key;visits.push(state);console.log(key);await page.screenshot({path:path.join(OUT,width+'-'+visits.length+'.png')});}
  if(state.type==='Inn'&&state.done.includes('citadel')){cleared=true;assert.equal(state.zoom,1);break;}
  let rect=state.tap;
  if(state.type==='Inn')rect=state.canRest&&state.rest?state.rest:state.embark;
  if(rect){const b=await page.locator('canvas').boundingBox();await page.mouse.click(b.x+(rect.x+rect.w/2)*b.width/1280,b.y+(rect.y+rect.h/2)*b.height/760);}
  await page.waitForTimeout(180);
 }
 assert(cleared,'expansion journey did not return to inn');
 for(const q of ['coast','citadel']){
  for(const w of [0,1,2])assert(visits.some(v=>v.type==='Expedition'&&v.q===q&&v.w===w),q+' missing fight '+w);
  assert(visits.some(v=>v.type==='Travel'&&v.q===q&&v.leg==='return'),q+' missing return journey');
  assert(visits.some(v=>v.q===q&&v.track===(q==='coast'?'coast_clove':'citadel_ronin')),q+' music not active');
 }
 const saved=await page.evaluate(()=>{const X=ADV.Expedition,r=X.Run.load();return {done:r.questsDone,next:X.Campaign.nextQuestId(r),phase:r.phase};});
 assert.equal(saved.next,'rain');assert.equal(saved.phase,'inn');assert.equal(saved.done.length,5);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(OUT,'journey-'+width+'.json'),JSON.stringify({visits,saved,errors},null,2));
 console.log('expansion journey: both complete locations, health carry, music, travel, save reload and inn passed at '+width);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
