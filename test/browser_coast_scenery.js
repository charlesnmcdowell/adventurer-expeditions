'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'reports/coast');
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await require('playwright').chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/docs/art/coast-20261008/index.html');
  await page.waitForFunction(()=>window.coastScene?.hero);fs.mkdirSync(out,{recursive:true});
  for(const sky of ['day','evening','night','storm','day']){
   await page.click('[data-sky='+sky+']');await page.waitForTimeout(200);
   const before=await page.evaluate(()=>coastScene.env.layers.map(l=>l.x));
   await page.waitForTimeout(600);
   const state=await page.evaluate(()=>({layers:coastScene.env.layers.map(l=>({x:l.x,y:l.y,key:l.texture.key})),updates:coastScene.events.listenerCount('update'),ground:coastScene.hero.y}));
   assert.equal(state.layers.length,3);assert.equal(state.ground,612);assert.equal(before[1],state.layers[1].x);assert.notEqual(before[0],state.layers[0].x);assert.notEqual(before[2],state.layers[2].x);
   await page.screenshot({path:path.join(out,sky+'.png')});report.push({sky,...state});
  }
  assert.equal(report[0].updates,report.at(-1).updates,'weather switching must not leak update callbacks');
  await page.click('#music');await page.waitForTimeout(1000);assert.equal(await page.locator('#music').textContent(),'Pause music');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({report,errors,music:'loaded and playing'},null,2));console.log('Coast: three layers, ground lock, four skies, lifecycle and music passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
