'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test/reports/wanjiru-forms');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 for(const profile of [{name:'desktop',width:1280,height:760},{name:'phone',width:390,height:844}]){
  const p=await b.newPage({viewport:{width:profile.width,height:profile.height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());Object.assign(pilot.record,{chapter:7,encounter:0,phase:'combat'});pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
   for(const id of ['nettle','durnik']){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}
   S.Companions.select(pilot,['nettle','durnik']);const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(false);this.__testReady=true;};`);await route.fulfill({response:r,body});});
  await p.goto('http://127.0.0.1:'+server.address().port+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__testReady,null,{timeout:60000});
  await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');window.formActor=[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion==='nettle');window.formTarget=[...s.actors.values()].find(a=>a.side==='b');});
  for(let n=0;n<4;n++){
   await p.evaluate(()=>{
    const s=storyGame.scene.getScene('StoryBattle'),a=formActor,t=formTarget;window.formQA={done:false,hits:0,origin:[a.x,a.y],frames:[],samples:[]};
    const hit=t.play.bind(t);t.play=(clip,opts)=>{if(clip==='hit_short')formQA.hits++;return hit(clip,opts);};
    const play=a.play.bind(a);a.play=(clip,opts)=>{formQA.clip=opts?.companionClip;return play(clip,opts);};
    const collect=()=>formQA.samples.push({x:a.x,y:a.y,lift:a.img.y,frame:a.img.frame.name,scale:a.img.scaleY});s.events.on('update',collect);
    ADV.Expedition.Beats.play(s,{hero:false,events:[{t:'use',uid:a.uid,target:t.uid,skillId:'basic_attack'},{t:'damage',uid:t.uid,by:a.uid,dmg:6,tag:'melee'}]}).then(()=>{
     s.events.off('update',collect);a.play=play;t.play=hit;formQA.end=[a.x,a.y];formQA.finalFrame=a.img.frame.name;formQA.finalLift=a.img.y;formQA.done=true;});
   });
   if(n%2){
    await p.waitForFunction(()=>formActor.img.frame.name.endsWith('/7'));
    await p.screenshot({path:path.join(out,profile.name+(n===1?'-bear-contact.png':'-eagle-contact.png'))});
   }
   await p.waitForFunction(()=>formQA.done);const r=await p.evaluate(()=>formQA);
   assert.equal(r.clip,['attack','form-bear','attack','form-eagle'][n]);assert.equal(r.hits,1);assert.deepEqual(r.end,r.origin);assert.equal(r.finalLift,0);assert(r.finalFrame.startsWith('idle/'));
   if(n===1)assert(r.samples.every(v=>v.lift===0),'bear must stay grounded');
   if(n===3)assert(Math.min(...r.samples.map(v=>v.lift))<-100,'eagle must actually fly');
   assert(r.samples.every(v=>v.scale===r.samples[0].scale),'no body rescaling');
   results.push({profile:profile.name,clip:r.clip,hits:r.hits,restored:true,frames:[...new Set(r.samples.map(s=>s.frame))],peakLift:Math.min(...r.samples.map(s=>s.lift))});
  }
  // Pause midflight, then cancel. No extra hit, lingering animal or moving root.
  await p.evaluate(()=>{const a=formActor;window.cancelQA={hits:0,origin:[a.x,a.y],done:false};a.play('slash',{companionClip:'form-eagle',target:formTarget,onContact:()=>cancelQA.hits++}).then(()=>cancelQA.done=true);});
  await p.waitForFunction(()=>formActor.img.frame.name==='form-eagle/4');
  const frozen=await p.evaluate(()=>{storyGame.scene.getScene('StoryBattle').paused=true;formActor.syncPause();return [formActor.x,formActor.y,formActor.img.y,formActor.img.frame.name];});
  await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>[formActor.x,formActor.y,formActor.img.y,formActor.img.frame.name]),frozen);
  await p.evaluate(()=>{formActor.cancelPlayback();storyGame.scene.getScene('StoryBattle').paused=false;formActor.syncPause();});
  await p.waitForFunction(()=>cancelQA.done);
  const cancelled=await p.evaluate(()=>({...cancelQA,end:[formActor.x,formActor.y],lift:formActor.img.y,frame:formActor.img.frame.name}));assert.equal(cancelled.hits,0);assert.deepEqual(cancelled.origin,cancelled.end);assert.equal(cancelled.lift,0);assert(cancelled.frame.startsWith('idle/'));
  if(profile.name==='desktop'){
   await p.evaluate(()=>{
    const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');window.liveQA={done:false,forms:[]};
    const play=formActor.play.bind(formActor);formActor.play=(clip,opts)=>{if(opts?.companionClip?.startsWith('form-'))liveQA.forms.push(opts.companionClip);return play(clip,opts);};
    s.intro=async()=>{};s.guideSkillUse=async()=>{};s.storyBanter=()=>{};X.turnPauseMs=()=>0;
    s.victory=async()=>{s.ended=true;liveQA.result='victory';};s.defeat=async()=>{s.ended=true;liveQA.result='defeat';};
    X.Scene.prototype.fight.call(s,false).then(()=>liveQA.done=true);
   });
   await p.waitForFunction(()=>liveQA.done,null,{timeout:180000});const live=await p.evaluate(()=>liveQA);assert(live.forms.length>0,'actual AI battle must select a transformation');results.push({profile:'actual-ai-battle',...live});
  }
  assert.deepEqual(errors,[]);await p.close();console.log('PASS',profile.name,'normal/bear/normal/eagle, contact, pause, cancellation and restore');
 }
 fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(results,null,2));
}finally{await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
