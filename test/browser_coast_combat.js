'use strict';
// Preview-only validation. Passing does not approve anatomy or unlock Coast.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'reports/coast');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await require('playwright').chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/docs/art/coast-20261008/combat.html');
  await page.waitForFunction(()=>window.coastCombatReady);await page.click('#play');
  const report=await page.evaluate(()=>coastCombatReviews.map(r=>{
   const clips=Object.entries(r.d.clips).map(([name,c])=>{
    r.select.value=name;
    const samples=c.frames.map((frame,i)=>{r.index=i;draw(r);const f=r.d.frames[frame],tex=r.pages[f.page];
     const pixels=r.canvas.getContext('2d').getImageData(0,0,640,400).data;let visible=0;for(let p=3;p<pixels.length;p+=4)if(pixels[p]>64)visible++;
     return {frame,visible,inAtlas:f.frame.x>=0&&f.frame.y>=0&&f.frame.x+f.frame.w<=tex.width&&f.frame.y+f.frame.h<=tex.height};});
    return {name,count:c.frames.length,samples,contact:c.contact};
   });r.select.value='idle';r.index=0;draw(r);return {actor:r.actor,clips};
  }));
  assert.equal(report.length,4);
  assert.equal(report.reduce((n,r)=>n+r.clips.reduce((s,c)=>s+c.count,0),0),116);
  for(const actor of report){assert.equal(actor.clips.find(c=>c.name==='attack').count,12);for(const c of actor.clips){for(const f of c.samples){assert(f.inAtlas,actor.actor+'/'+f.frame);assert(f.visible>100,actor.actor+'/'+f.frame+' empty');}for(const contact of c.contact)assert(contact>=0&&contact<c.count);}}
  fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'combat-idle.png'),fullPage:true});
  await page.evaluate(()=>{for(const r of coastCombatReviews){r.select.value='attack';r.index=6;draw(r);}});
  await page.screenshot({path:path.join(out,'combat-contact.png'),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'combat-results.json'),JSON.stringify({report,errors},null,2));
  console.log('Coast combat preview: 4 atlases, 116 nonempty frames, contact markers and atlas bounds passed; art acceptance remains separate.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
