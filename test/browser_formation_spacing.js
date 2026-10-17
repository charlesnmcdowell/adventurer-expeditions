'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict'),http=require('http'),path=require('path');
const out='test/reports/story/formation';fs.mkdirSync(out,{recursive:true});
(async()=>{
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const type={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 for(const [pair,width,height,chapter,encounter] of [[['wren_ward','vess'],1280,760,2,0],[['dorran','bramm'],1280,760,7,0],[['fennick','durnik'],390,844,7,0],[['ithrel','aurelius'],1280,760,3,2],[['wren_ward','vess'],1280,760,5,0],[['wren_ward','vess'],1280,760,5,2]]){
  const p=await b.newPage({viewport:{width,height}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const response=await route.fetch();let body=await response.text();
   body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());pilot.record.chapter=${chapter};pilot.record.encounter=${encounter};pilot.record.phase='combat';pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
    for(const id of ${JSON.stringify(pair)}){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}
    S.Companions.select(pilot,${JSON.stringify(pair)});const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__ready=true;};`);
   await route.fulfill({response,body});});
  await p.goto(base+'/docs/STORY_FIGHT_PREVIEW.html?formation=1');
  try{await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:60000});}catch(e){console.error({pair,errors,body:await p.locator('body').innerText(),state:await p.evaluate(()=>{const s=window.storyGame?.scene.getScene('StoryBattle');return {ready:s?.__presentationReady,ended:s?.ended,loading:s?.load?.isLoading()};})});throw e;}
  const geometry=await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.paused=true;return [...s.actors.values()].map(a=>({id:a.unit.ch.expeditionStoryCompanion||a.kind,side:a.side,x:a.x,y:a.y,minY:s.groundPoint(a.x,a.y,a).minY,height:a.height,perspective:a.root.scaleX,scale:a.img.scaleX,formation:s.formationScale,...s.idleExtents(a)}));});
  const allies=geometry.filter(a=>a.side==='a').sort((a,b)=>a.x-b.x),foes=geometry.filter(a=>a.side==='b');
  assert.equal(allies.length,3);
  const ordered=foes.slice().sort((a,b)=>a.x-b.x);
  const gaps=ordered.slice(1).map((a,i)=>(a.x+a.left)-(ordered[i].x+ordered[i].right));
  if(gaps.length>1)assert(Math.max(...gaps)-Math.min(...gaps)<3,'idle gaps must share available room evenly: '+gaps);
  for(let i=1;i<ordered.length;i++)assert(ordered[i].x-ordered[i-1].x>1,'enemy centres piled together '+JSON.stringify({chapter,encounter,ordered}));

  assert(allies[1].x-allies[0].x>=140,JSON.stringify(allies));assert(allies[2].x-allies[1].x>=140,JSON.stringify(allies));
  for(const a of geometry){assert(a.x+a.left>=20,JSON.stringify(a));assert(a.x+a.right<=1253,JSON.stringify(a));assert(a.y-a.height*a.perspective>=100,JSON.stringify(a));assert(a.y>=a.minY,JSON.stringify(a));}
  assert(Math.min(...foes.map(a=>a.x+a.left))-Math.max(...allies.map(a=>a.x+a.right))>=100,'centre should remain clear');
  await p.screenshot({path:out+'/'+pair.join('-')+'-'+width+'-ch'+chapter+'-'+encounter+'.png'});
  await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);
  if(chapter===5&&encounter===0){
   const idle=await p.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.kind==='story_femi');
    if(!a)throw Error('Femi missing');a.idle();const samples=[];
    for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,50));const f=a.img.frame;samples.push({frame:f.name,x:a.x,y:a.y,anchor:f.x+[82.5,84.5,81.5,83][Number(f.name.split('/')[1])]});}
    return samples;});
   assert.equal(new Set(idle.map(s=>s.frame)).size,4);assert.equal(new Set(idle.map(s=>s.x)).size,1);assert.equal(new Set(idle.map(s=>s.y)).size,1);
   assert(Math.max(...idle.map(s=>s.anchor))-Math.min(...idle.map(s=>s.anchor))<=1);
   fs.writeFileSync(out+'/femi-idle.json',JSON.stringify(idle,null,2));
  }
  // Real actor playback must meet a rear-row foe and return to its own slot.
  const action=await p.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),a=s.hero,target=[...s.actors.values()].filter(a=>a.side==='b').at(-1);
   const start={x:a.x,y:a.y,scale:a.img.scaleX,perspective:a.root.scaleX};let contact;
   await a.play('slash',{target,onContact:()=>contact={x:a.x,y:a.y,targetY:target.y,perspective:a.root.scaleX,targetPerspective:target.root.scaleX}});
   return {start,contact,end:{x:a.x,y:a.y,scale:a.img.scaleX,perspective:a.root.scaleX}};});
  assert(action.contact.x>action.start.x+100);assert(Math.abs(action.contact.y-action.contact.targetY)<1);assert.deepEqual(action.end,action.start);assert(Math.abs(action.contact.perspective-action.contact.targetPerspective)<.01);
  assert.deepEqual(errors,[]);const floorCheck=await p.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),foes=[...s.actors.values()].filter(a=>a.side==='b'),dead=foes[0];
   dead.unit.chp=0;await dead.play('down_fade');await s.reformFoes();
   const survivors=foes.filter(a=>a.alive).map(a=>({x:a.x,y:a.y,minY:s.groundPoint(a.x,a.y,a).minY,...s.idleExtents(a)}));
   const scale=dead.root.scaleX,bodyX=dead.x+dead.img.x*scale,bodyY=dead.y+dead.img.y*scale;
   return {survivors,bodyY,formation:s.formationScale,floor:s.groundPoint(bodyX,dead.y,dead).y};});
  assert.equal(floorCheck.formation,geometry[0].formation,'deaths must not resize the formation');
  assert(floorCheck.survivors.every(a=>a.y>=a.minY));
  const remaining=floorCheck.survivors.sort((a,b)=>a.x-b.x),newGaps=remaining.slice(1).map((a,i)=>a.x+a.left-remaining[i].x-remaining[i].right);
  if(newGaps.length>1)assert(Math.max(...newGaps)-Math.min(...newGaps)<3,'survivor spacing '+newGaps);assert(Math.abs(floorCheck.bodyY-floorCheck.floor)<2,JSON.stringify(floorCheck));
  assert.deepEqual(errors,[]);results.push({pair,width,height,chapter,encounter,geometry,action,floorCheck});await p.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));console.log('PASS: spaced full-size party/enemies, clear centre, desktop/mobile, rear-row melee and return');
}finally{await b.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
