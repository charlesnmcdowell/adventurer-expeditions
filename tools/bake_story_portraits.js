// Reuse the original portrait compositor through a read-only HTTP server.
// No source-game saves, rendering modules or files are modified.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),SOURCE=path.resolve(ROOT,'../adventurer'),OUT=path.join(ROOT,'assets/expedition/story/portraits');
const modules=[...fs.readFileSync(path.join(SOURCE,'index.html'),'utf8').matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[0]).join('\n');
const html='<!doctype html><html><body>'+modules+`<script>
class BakeStoryPortraits extends Phaser.Scene {
 constructor(){super('BakeStoryPortraits');}
 create(){window.bakeScene=this;window.bakeWorld={meta:{c3:ADV.Campaign3.fresh()}};}
}
window.bakeGame=new Phaser.Game({type:Phaser.CANVAS,width:440,height:560,audio:{noAudio:true},scene:[BakeStoryPortraits]});
</script></body></html>`;
const MIME={'.js':'text/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 const rel=decodeURIComponent(req.url.split('?')[0]);if(rel==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}
 const f=path.resolve(SOURCE,'.'+rel);if(!f.startsWith(SOURCE+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',MIME[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.bakeScene);
 const ids=await page.evaluate(()=>Object.keys(ADV.DATA.CAMPAIGN3_DIALOGUE.gate));
 fs.mkdirSync(OUT,{recursive:true});const manifest={schema:1,portraits:{},source:'Original Adventurer portrait compositor',sourceModules:{}};
 for(const rel of ['js/ui/anime_world.js','js/ui/anime_art.js','js/ui/gate_art.js','js/ui/gate_manifest.js','js/ui/anime_identities.js']){
  const p=path.join(SOURCE,rel);if(fs.existsSync(p))manifest.sourceModules[rel]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 }
 const variants=ids.map(id=>({id,who:id})).concat([{id:'korvath_helmet',who:'korvath',appearance:'korvath_helmet'},{id:'amara_docks',who:'amara',appearance:'amara_docks'}]);
 for(const spec of variants){
  const key=await page.evaluate(spec=>{const ch=ADV.Campaign3.actor(bakeWorld,spec.who);if(!ch)return null;const copy={...ch,gateAppearance:spec.appearance||spec.who};return ADV.Portraits.key(bakeScene,copy);},spec);
  if(!key)continue;
  await page.waitForFunction(k=>{const m=ADV.AnimeArt.META.get(k);return m&&!m.pending;},key,{timeout:45000});
  const data=await page.evaluate(k=>{const src=bakeScene.textures.get(k).getSourceImage(),c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);return c.toDataURL('image/webp',.94);},key);
  const bytes=Buffer.from(data.split(',')[1],'base64'),hash=crypto.createHash('sha256').update(bytes).digest('hex');
  const file=spec.id+'-'+hash.slice(0,12)+'.webp';fs.writeFileSync(path.join(OUT,file),bytes);manifest.portraits[spec.id]={file,width:440,height:560,sha256:hash};
  console.log('Baked '+spec.id);
 }
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(OUT,'portraits.json'),JSON.stringify(manifest,null,2));console.log('Story portraits: '+Object.keys(manifest.portraits).length);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
