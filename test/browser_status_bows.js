'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test/reports/combat-identity');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[],results=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());Object.assign(pilot.record,{chapter:7,encounter:0,phase:'combat'});pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
 for(const id of ['ithrel','faelen']){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}S.Companions.select(pilot,['ithrel','faelen']);const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(false);this.__ready=true;};`);await route.fulfill({response:r,body});});
 await p.goto('http://127.0.0.1:'+server.address().port+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:60000});
 for(const id of ['ithrel','faelen'])for(const skill of ['basic_attack','aimed_shot']){
  await p.evaluate(({id,skill})=>{
   const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion===id),t=[...s.actors.values()].find(a=>a.side==='b'),fx=X.StoryEffects.play;
   window.arrowQA={done:false,release:false};
   X.StoryEffects.play=(scene,effect,from,to,opts)=>{Object.assign(arrowQA,{release:true,effect,from,to,anchor:opts.clip.releaseAnchor,clipRelease:opts.clip.release});return fx(scene,effect,from,to,opts);};
   X.Beats.play(s,{events:[{t:'use',uid:a.uid,target:t.uid,skillId:skill},{t:'damage',uid:t.uid,by:a.uid,dmg:6}]}).then(()=>{arrowQA.done=true;X.StoryEffects.play=fx;});
  },{id,skill});
  await p.waitForFunction(()=>arrowQA.release);await p.waitForTimeout(120);
  const r=await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.paused=true;const shot=s.children.list.find(o=>o.name==='story_effect_aimed_shot');return {...arrowQA,rotation:shot?.rotation,x:shot?.x,y:shot?.y};});
  assert.equal(r.effect,'aimed_shot');assert(r.anchor);assert(r.to.x>r.from.x&&r.x>r.from.x&&r.x<r.to.x);assert(Number.isFinite(r.rotation));
  await p.screenshot({path:path.join(out,id+'-'+skill+'-arrow.png')});await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);await p.waitForFunction(()=>arrowQA.done);results.push({id,skill,...r});
 }
 const status=await p.evaluate(()=>{
  const s=storyGame.scene.getScene('StoryBattle'),a=s.hero,u=a.unit,saved={statuses:u.statuses,counter:u.counter,evade:u.evade,stealth:u.stealth,untargetable:u.untargetable};
  window.restoreStatus=()=>{Object.assign(u,saved);a.refresh(true);};
  Object.assign(u,{counter:0,evade:0,stealth:0,untargetable:0});
  const groups=[['poison','bleed','withering','frozen'],['burn','shocked','rooted','ward'],['shadowDot','healcut','hot','exposed'],['marked','contractMark','taunted','shield'],['atkBuff','closed','lifesteal','takenReduce']];
  const rows=[];
  for(const kinds of groups){u.statuses=kinds.map(kind=>({kind,rounds:2}));a.refresh(true);
   const labels=[...a.badges.values()].map(b=>({text:b.list.find(c=>c.type==='Text')?.text,x:b.x,y:b.y,width:b.__badgeWidth}));
   rows.push(labels);u.statuses=[];a.refresh(true);if(a.badges.size)throw Error('Expired status remained');
  }
  u.statuses=groups[0].map(kind=>({kind,rounds:2}));a.refresh(true);return rows;
 });
 for(const row of status){assert.equal(row.length,4);assert(row.every(b=>b.text&&b.text.length>2));for(const y of new Set(row.map(b=>b.y))){const r=row.filter(b=>b.y===y).sort((a,b)=>a.x-b.x);assert(r.at(-1).x+r.at(-1).width/2-r[0].x+r[0].width/2<=180);for(let i=1;i<r.length;i++)assert(r[i].x-r[i].width/2>r[i-1].x+r[i-1].width/2);}}
 await p.waitForTimeout(220);await p.screenshot({path:path.join(out,'status-labels-desktop.png')});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(350);await p.screenshot({path:path.join(out,'status-labels-phone.png')});await p.evaluate(()=>restoreStatus());
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'bows-status.json'),JSON.stringify({arrows:results,statusGroups:status,errors},null,2));console.log('PASS both companion bows: firing pose, arrow direction, recovery; 20 status labels, wrapping and expiration; desktop/phone render');
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
