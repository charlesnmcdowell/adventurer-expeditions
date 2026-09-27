// Exercise real atlases and the animation director, plus sampled painted travel.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'reports/v3');
fs.mkdirSync(OUT,{recursive:true});
const allowed=new Set(require('../tools/size_check').shipList().files);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg','.css':'text/css'};
const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'')||'index.html';
  if(!allowed.has(rel)){res.writeHead(404);return res.end();}
  res.writeHead(200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream'});
  fs.createReadStream(path.join(ROOT,rel)).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,args:['--disable-gpu']});
  const page=await browser.newPage({viewport:{width:1280,height:760}});
  const errors=[],results=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?fresh=1&renderer=canvas');
  await page.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
  await page.evaluate(()=>{
    const X=ADV.Expedition,s=window.__game.scene.getScene('Expedition');
    // Isolate art playback from simulated turns, while using real scene setup,
    // entrance movement, registration and paired-target lifecycle.
    s.fight=async function(first){await this.intro(first);this.__artReviewReady=true;};
    window.__travelPlay=X.TravelScene.prototype.play;
    X.TravelScene.prototype.play=function(){};
  });
  for(const [q,w,ids] of (process.argv.includes('--travel-only')?[]:[['marsh',0,['serpent','beetle']],['marsh',1,['moss_giant']],['marsh',2,['hag']],['city',0,['goblin','spider']],['city',2,['orc']]])){
    await page.evaluate(([q,w])=>{
      const X=ADV.Expedition,s=window.__game.scene.getScenes(true)[0],r=X.Run.fresh();
      r.questId=q;r.wave=w;r.phase='quest';r.gold=200;
      r.levels={katana_slash:1,finisher:1,god_aura:1,counter_attack:1};
      const battle=window.__game.scene.getScene('Expedition');battle.__artReviewReady=false;
      X.Dev.go(s,'Expedition',{run:r,seed:17});
    },[q,w]);
    await page.waitForFunction(()=>window.__game.scene.getScene('Expedition').__artReviewReady,{},{timeout:30000});
    const visible=await page.evaluate(()=>{
      const s=window.__game.scene.getScene('Expedition');
      return [...s.actors.values()].filter(a=>a.side==='b').map(a=>({id:ADV.Expedition.paintedActorOf(a),x:a.x,visible:a.root.visible,texture:a.img.texture.key,scale:a.img.scaleX}));
    });
    assert(visible.every(a=>a.visible&&a.x<1280&&a.x>600&&a.scale>0),JSON.stringify(visible));
    await page.screenshot({path:path.join(OUT,q+'-'+w+'-enemies.png')});
    for(const id of ids)for(const variant of [0,1]){
      await page.evaluate(([id,variant])=>{
        const X=ADV.Expedition,s=window.__game.scene.getScene('Expedition');
        const a=[...s.actors.values()].find(a=>X.paintedActorOf(a)===id);
        a.alive=true;a.root.setVisible(true);a.img.setAlpha(1);a.idle();
        s.hero.root.x=s.hero.home.x;s.__pairContact=false;s.__pairDone=false;
        s.__pairExpected=id;
        s.hero.play('finisher',{target:a,lethal:true,finisherVariant:variant,onContact:()=>{s.__pairContact=true;s.paused=true;}}).then(()=>{
          s.__pairDone=true;s.__pairResult={id,variant,gone:!a.alive&&!a.root.visible,heroTexture:s.hero.img.texture.key,heroScale:s.hero.img.scaleY};
        });
      },[id,variant]);
      await page.waitForFunction(()=>window.__game.scene.getScene('Expedition').__pairContact,null,{timeout:10000});
      await page.waitForTimeout(40);
      await page.screenshot({path:path.join(OUT,id+'-finisher-'+(variant+1)+'.png')});
      await page.evaluate(()=>{window.__game.scene.getScene('Expedition').paused=false;});
      await page.waitForFunction(()=>window.__game.scene.getScene('Expedition').__pairDone,null,{timeout:10000});
      const r=await page.evaluate(()=>window.__game.scene.getScene('Expedition').__pairResult);
      assert(r.gone&&r.heroTexture==='xp_hiro_sheet',JSON.stringify(r));results.push(r);
    }
  }
  for(const [q,w,leg]of [['rain',1,'midleg'],['marsh',1,'midleg'],['city',0,'outbound'],['city',2,'midleg']]){
    await page.evaluate(([q,w,leg])=>{
      const X=ADV.Expedition,r=X.Run.fresh();r.questId=q;r.wave=w;r.phase='travel';r.travelLeg=leg;
      const s=window.__game.scene.getScenes(true)[0];X.Dev.go(s,'Travel',{run:r,leg});
    },[q,w,leg]);
    await page.waitForFunction(()=>window.__game.scene.isActive('Travel')&&window.__game.scene.getScene('Travel').__presentationReady,null,{timeout:30000});
    const duration=await page.evaluate(()=>__game.scene.getScene('Travel').pano.durationMs);
    assert(duration>=6000&&duration<=8000);
    for(const ms of [0,1500,2999,3500,4200,duration-2999,duration-1500,duration-1]){
      const info=await page.evaluate(ms=>{
        const s=window.__game.scene.getScene('Travel');s.paused=true;s.pano.seek(ms);
        return {id:s.pano.artId,frame:s.pano.currentFrame,texture:s.pano.hero.texture.key,x:s.pano.hero.x+s.pano.x,phase:s.pano.phase};
      },ms);
      assert(info.texture!=='__MISSING');
      assert.equal(info.phase,ms<3000?'run-in':ms>=duration-3000?'run-out':'action');
      await page.waitForTimeout(50);await page.screenshot({path:path.join(OUT,info.id+'-'+ms+'.png')});results.push(info);
    }
  }
  // Exercise the real scene handoff: the longer presentation must not get
  // cut short by the old transition timer.
  await page.evaluate(()=>{
    const X=ADV.Expedition;X.TravelScene.prototype.play=window.__travelPlay;
    const r=X.Run.fresh();r.questId='city';r.wave=0;r.phase='travel';r.travelLeg='outbound';
    X.Dev.go(__game.scene.getScenes(true)[0],'Travel',{run:r,leg:'outbound'});
  });
  await page.waitForFunction(()=>__game.scene.isActive('Travel')&&__game.scene.getScene('Travel').__presentationReady&&!__game.scene.getScene('Travel').paused);
  const start=Date.now();await page.waitForTimeout(6100);
  assert(await page.evaluate(()=>__game.scene.isActive('Travel')),'travel exited before both running beats');
  await page.waitForFunction(()=>__game.scene.isActive('Expedition'),null,{timeout:10000});
  assert(Date.now()-start>=7300,'travel presentation was cut short');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,process.argv.includes('--travel-only')?'travel-verification.json':'verification.json'),JSON.stringify({results,errors},null,2));
  await browser.close();server.close();console.log(process.argv.includes('--travel-only')?'v3 art: 4 painted travel beats passed':'v3 art: 14 paired finishers, 7 visible enemies, 4 painted travel beats passed');
})().catch(e=>{console.error(e);process.exit(1);});
