'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='test/reports/chapter10-polish';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const results=[];try{
 for(const slug of ['rennick','grell']){
 const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();const row=JSON.parse(fs.readFileSync('docs/art/chapter-6-14-roster.json')).find(r=>r.slug===slug);
 body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());Object.assign(pilot.record,${JSON.stringify({...row.appearances[0],phase:'combat'})});pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(false);this.__ready=true;};`);await route.fulfill({response:r,body});});
 await p.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?muted=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready);
 await p.evaluate(slug=>{window.s=storyGame.scene.getScene('StoryBattle');window.a=[...s.actors.values()].find(a=>a.unit.ch.storyOpponent==='named:'+slug);window.X=ADV.Expedition;X.fx.cinematics=true;},slug);
 if(slug==='rennick'){
  for(let variant=0;variant<2;variant++){
   await p.evaluate(v=>{a.restoreFromFade();a.unit.chp=0;a.unit.downed=true;X.finisherLast.story_rennick=v===0?'hiro-finisher-2':'hiro-finisher-1';window.qa={done:false,seen:[],dimmed:false};const h=s.hero;const watch=()=>{if(h.img.texture.key.includes('rennick')){qa.seen.push(h.img.frame.name);qa.dimmed||=[...s.actors.values()].some(t=>t!==h&&t!==a&&t.root.alpha<.5);}};s.events.on('update',watch);X.Beats.play(s,{hero:true,choice:{how:'cast',action:{skillId:'finisher'}},events:[{t:'use',uid:h.uid,target:a.uid,skillId:'finisher'},{t:'execute',uid:a.uid,by:h.uid},{t:'down',uid:a.uid}]}).then(()=>{s.events.off('update',watch);qa.done=true;});},variant);
   await p.waitForFunction(()=>qa.dimmed);await p.waitForTimeout(500);await p.screenshot({path:`${out}/rotimi-${variant}-after.png`});await p.waitForFunction(()=>qa.done);
   const r=await p.evaluate(()=>({...qa,seen:[...new Set(qa.seen)],alpha:[...s.actors.values()].filter(t=>t.alive).map(t=>t.root.alpha),texture:s.hero.img.texture.key}));assert.equal(r.seen.length,16);assert(r.dimmed);assert(r.alpha.every(a=>a===1));assert.equal(r.texture,'xp_hiro_sheet');results.push({slug,variant,...r});
  }
 }else{
  const entrance=await p.evaluate(async()=>{const seen=new Set();a.img.on('animationupdate',window.watchEntrance=(anim,f)=>{if(anim.key.endsWith(':entrance'))seen.add(f.textureFrame);});await a.play('entrance');a.img.off('animationupdate',watchEntrance);return{seen:[...seen],idle:a.sheet.clips.idle.frames};});assert(entrance.seen.length>=11);assert.equal(entrance.idle.length,2);results.push({entrance});
  for(const skill of ['basic_attack','aimed_shot','killing_angle','backstab']){
   await p.evaluate(skill=>{window.qa={done:false,positions:[],releases:[]};const fx=X.StoryEffects.play,watch=()=>qa.positions.push(a.root.x);s.events.on('update',watch);X.StoryEffects.play=(scene,id,from,to,opts)=>{qa.releases.push({id,from,to,release:opts.clip?.release});return fx(scene,id,from,to,opts);};X.Beats.play(s,{events:[{t:'use',uid:a.uid,target:s.hero.uid,skillId:skill},{t:'damage',uid:s.hero.uid,by:a.uid,dmg:3}]}).then(()=>{s.events.off('update',watch);X.StoryEffects.play=fx;qa.done=true;});},skill);
   await p.waitForFunction(()=>qa.releases.length);if(skill==='backstab'){await p.evaluate(()=>s.paused=true);await p.screenshot({path:out+'/gbenga-kneeling.png'});await p.evaluate(()=>s.paused=false);}
   await p.waitForFunction(()=>qa.done);const r=await p.evaluate(()=>qa);assert(Math.max(...r.positions)-Math.min(...r.positions)<2,skill+' stays ranged');assert.equal(r.releases[0].id,'aimed_shot');assert.equal(r.releases[0].release,6);assert(r.releases[0].from.x>r.releases[0].to.x);results.push({skill,...r,positions:undefined});
  }
  for(const who of ['enemy','hero']){
   await p.evaluate(who=>{window.riser=who==='hero'?s.hero:a;riser.unit.chp=Math.round(riser.unit.maxHp*.3);riser.unit.downed=false;window.hp=riser.unit.chp;window.qa={done:false,count:0};const old=X.StoryEffects.resurrect;X.StoryEffects.resurrect=(...args)=>{qa.count++;return old(...args);};X.Beats.ticksOnly(s,[{t:'down',uid:riser.uid},{t:'revive',uid:riser.uid,by:riser.uid,skillId:'shadow_rise'},{t:'stealth',uid:riser.uid}]).then(()=>{qa.done=true;X.StoryEffects.resurrect=old;});},who);
   await p.waitForFunction(()=>s.children.list.some(x=>x.name==='shadow_rise_grave'));await p.waitForTimeout(1000);const before=await p.evaluate(()=>{s.paused=true;const f=s.children.list.find(x=>x.name==='shadow_rise_grave');return {y:riser.img.y,frame:f.frame.name};});await p.waitForTimeout(250);const after=await p.evaluate(()=>({y:riser.img.y,frame:s.children.list.find(x=>x.name==='shadow_rise_grave').frame.name}));assert.deepEqual(before,after);await p.screenshot({path:`${out}/shadow-rise-${who}.png`});await p.evaluate(()=>s.paused=false);await p.waitForFunction(()=>qa.done);
   const r=await p.evaluate(()=>({...qa,hp:riser.unit.chp,expectedHp:hp,alive:riser.alive,y:riser.img.y,mask:!!riser.img.mask,alpha:riser.img.alpha,effects:s.children.list.filter(x=>x.name==='shadow_rise_grave').length}));assert.equal(r.hp,r.expectedHp);assert.equal(r.count,1);assert(r.alive);assert.equal(r.y,0);assert(!r.mask);assert.equal(r.effects,0);results.push({rise:who,...r});
  }
 }
 assert.deepEqual(errors,[]);await p.close();
 }fs.writeFileSync(out+'/verification.json',JSON.stringify(results,null,2));console.log('PASS Chapter 10: both paired finishers, crowd restoration; entrance/hood-off idle; four ranged attacks; reusable Shadow Rise, pause and cleanup');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
