'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict'),http=require('http'),path=require('path');
const out='test/reports/idle-roster/browser';fs.mkdirSync(out,{recursive:true});
(async()=>{
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const type={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());pilot.record.chapter=1;pilot.record.encounter=1;pilot.record.phase='combat';pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__ready=true;};`);await route.fulfill({response,body});});
 await p.goto(base+'/docs/STORY_FIGHT_PREVIEW.html?idle-roster=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:60000});
 await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');for(const a of s.actors.values())a.root.setVisible(false);});
 const roster=JSON.parse(fs.readFileSync('docs/IDLE_ROSTER_REVIEW.json','utf8')),guides=JSON.parse(fs.readFileSync('tools/idle_roster_registration.json','utf8')).actors;
 for(const row of roster){
  const result=await p.evaluate(async({row,guide})=>{
   const s=storyGame.scene.getScene('StoryBattle'),X=ADV.Expedition,key='xp_'+row.id+'_sheet',cache='xp_'+row.id+'_clips',base='assets/expedition/'+row.id+'/',existed=s.textures.exists(key);
   if(!existed){s.load.multiatlas(key,base+row.id+'.json?idle-qa=1',base);s.load.json(cache,base+row.id+'.json?idle-qa=1');await new Promise((ok,bad)=>{const timer=setTimeout(()=>bad(Error('load timeout '+row.id)),25000);s.load.once('complete',()=>{clearTimeout(timer);ok();});s.load.start();});}
   const sheet=X.Painted.sheet(s,row.id);if(!sheet)throw Error('missing sheet '+row.id);
   const a=new X.Actor(s,{uid:'idle-audit',unit:{chp:100,maxHp:100,statuses:[],ch:{}},side:row.id.startsWith('companion_')?'a':'b',x:900,y:650,sheet,texture:key,height:300,kind:row.id});
   if(s.hudCam)s.hudCam.ignore(a.root);a.syncPerspective();window.auditActor=a;
   const origin=[a.x,a.y,a.root.scaleX],seen=new Set([a.img.frame.name]),positions=[];
   const sample=()=>{seen.add(a.img.frame.name);positions.push([a.x,a.y,a.root.scaleX]);};a.img.on('animationupdate',sample);
   await new Promise(r=>setTimeout(r,sheet.clips.idle.durationMs+160));sample();
   const trims=sheet.clips.idle.frames.map(name=>{const f=s.textures.getFrame(key,name);return {name,x:f.x,y:f.y};});
   // Preserve the final frame for a screenshot; next actor destroys it.
   a.img.anims.pause();return {id:row.id,origin,positions,seen:[...seen],trims,existed};
  },{row,guide:guides[row.id]||null});
  assert.deepEqual(result.seen.sort(),row.frames.map(f=>f.name).sort(),row.id+' did not cycle all drawings');
  assert(result.positions.every(p=>p.every((v,i)=>Math.abs(v-result.origin[i])<.001)),row.id+' idle root drift');
  for(const f of row.frames){const live=result.trims.find(t=>t.name===f.name);assert.equal(live.x,f.after.x,row.id);assert.equal(live.y,f.after.y,row.id);}
  if(guides[row.id])for(const g of guides[row.id].frames){const live=result.trims.find(t=>t.name===g.frame);assert(Math.abs(live.x+g.anchorX-guides[row.id].targetX)<=.5);assert.equal(live.y+g.anchorY,guides[row.id].targetY);}
  if(['story_grell','story_skarn','story_web_spider','companion_ilvara','companion_ysolde'].includes(row.id))await p.screenshot({path:out+'/'+row.id+'.png'});
  await p.evaluate(({id,existed})=>{const s=storyGame.scene.getScene('StoryBattle');auditActor.destroy();if(!existed){s.anims.remove('xp_'+id+'_sheet:idle');s.textures.remove('xp_'+id+'_sheet');s.cache.json.remove('xp_'+id+'_clips');}},{id:row.id,existed:result.existed});
  results.push(result);console.log('PASS idle',row.id);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));
 // Review controls and both views also work without changing game saves.
 await p.goto(base+'/docs/IDLE_ROSTER_REVIEW.html#story_grell');await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('story_grell'));
 await p.getByRole('button',{name:'Pause',exact:true}).click();await p.getByRole('button',{name:'Next frame',exact:true}).click();await p.screenshot({path:out+'/review.png'});
 console.log('PASS: '+results.length+' real Phaser idle loops; no root drift; all frame placements match; review controls work');
}finally{await b.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
