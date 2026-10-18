'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test/reports/magic-polish');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 async function scene(chapter,encounter,pair=[]){const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[];p.errors=errors;p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());Object.assign(pilot.record,{chapter:${chapter},encounter:${encounter},phase:'combat'});pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
   for(const id of ${JSON.stringify(pair)}){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}
   S.Companions.select(pilot,${JSON.stringify(pair)});const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(false);this.__testReady=true;};`);await route.fulfill({response:r,body});});
  await p.goto('http://127.0.0.1:'+server.address().port+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__testReady,null,{timeout:60000});return p;
 }
 async function spell(p,who,skill,label){
  await p.evaluate(({who,skill})=>{
   const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion===who||a.unit.ch.storyOpponent===who),support=['self','ally','party','allyLane'].includes(ADV.SkillSys.manifest(a.unit.ch,{skillId:skill,level:1}).data.target),target=support?a:a.side==='a'?[...s.actors.values()].find(a=>a.side==='b'):s.hero;
   if(!a)throw Error('Missing actor '+who);window.spellQA={done:false,charge:false,flight:false,damage:false,clips:[],origin:{x:a.x,y:a.y},start:performance.now()};
   const oldHeal=ADV.VFX.healSparkle;ADV.VFX.healSparkle=(...args)=>{if(support){spellQA.damage=true;spellQA.hitAt=performance.now()-spellQA.start;}return oldHeal(...args);};
   const originalHit=target.play.bind(target);target.play=(clip,opts)=>{if(/hit|stagger/.test(clip)){spellQA.damage=true;spellQA.hitAt=performance.now()-spellQA.start;}return originalHit(clip,opts);};
   const original=a.play.bind(a);a.play=(clip,opts)=>{spellQA.clips.push({clip,companionClip:opts?.companionClip});return original(clip,opts);};
   const originalFX=X.StoryEffects.play;X.StoryEffects.play=function(scene,id,from,to,opts){
    spellQA.flight=true;spellQA.release=performance.now()-spellQA.start;spellQA.size=opts?.height;spellQA.effect=id;
    spellQA.launch=from;spellQA.atRelease=a.releasePoint(opts.clip);return originalFX.call(this,scene,id,from,to,opts).then(v=>{spellQA.arrived=performance.now()-spellQA.start;return v;});};
   s.events.on('update',()=>{if(s.children.list.some(x=>x.name==='spell_charge_focus'&&x.alpha>.05))spellQA.charge=true;});
   X.Beats.play(s,{hero:false,events:[{t:'use',uid:a.uid,target:target.uid,skillId:skill},support?{t:'heal',uid:target.uid,by:a.uid,amount:6}:{t:'damage',uid:target.uid,by:a.uid,dmg:6,tag:'spell'}]}).then(()=>{a.play=original;target.play=originalHit;ADV.VFX.healSparkle=oldHeal;X.StoryEffects.play=originalFX;spellQA.end={x:a.x,y:a.y};spellQA.done=true;});
  },{who,skill});
  await p.waitForFunction(()=>spellQA.charge||spellQA.done);assert(await p.evaluate(()=>spellQA.charge),label+' charge missing');
  await p.waitForTimeout(300);await p.screenshot({path:path.join(out,label+'-charge.png')});
  await p.waitForFunction(()=>spellQA.flight);await p.waitForTimeout(130);await p.screenshot({path:path.join(out,label+'-flight.png')});
  await p.waitForFunction(()=>spellQA.done);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>({...spellQA,effects:storyGame.scene.getScene('StoryBattle').children.list.filter(x=>/^spell_|^story_effect_/.test(x.name||'')).length}));
  assert(r.release>150&&r.arrived>r.release+300,label+' readable windup and flight');assert(r.damage&&r.hitAt>=r.arrived,label+' hit must wait for projectile arrival');assert.deepEqual(r.launch,r.atRelease);assert.deepEqual(r.end,r.origin);assert.equal(r.effects,0);assert(r.clips.every(c=>c.clip==='cast'||c.clip==='hit_short'),label+' must cast instead of melee');assert.deepEqual(p.errors,[]);results.push({label,...r});console.log('PASS',label);
 }
 for(const pair of [['vess','aurelius'],['ysolde','selene'],['ilvara','fennick']]){
  const p=await scene(7,0,pair);
  for(const id of pair)await spell(p,id,'basic_attack',id+'-basic');
  if(pair[0]==='vess'){await spell(p,'aurelius','spark','devendra-lightning');await spell(p,'vess','wither_touch','desmond-wither');}
  if(pair[0]==='ilvara'){await spell(p,'ilvara','wither_touch','layla-wither');await spell(p,'fennick','venom_fang','winston-venom');}
  await p.close();
 }
 {const p=await scene(7,0,['nettle','durnik']);
  await spell(p,'nettle','thorn_skin','wanjiru-thorns');await spell(p,'durnik','mend','dai-heal');await spell(p,'durnik','regenerate','dai-regenerate');
  const r=await p.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion==='nettle'),t=[...s.actors.values()].find(a=>a.side==='b'),clips=[];const old=a.play.bind(a);a.play=(id,opts)=>{clips.push(id);return old(id,opts);};
   await ADV.Expedition.Beats.play(s,{events:[{t:'use',uid:a.uid,target:t.uid,skillId:'wither_touch'},{t:'damage',uid:t.uid,by:a.uid,dmg:5}]});return clips;});assert(r.includes('slash'),'Wanjiru keeps her contact strike');assert.deepEqual(p.errors,[]);await p.close();}
 for(const [ch,en,who,skill,label]of [[2,2,'named:morwin','fire_bolt','merle-fire'],[7,3,'named:malvane','frost_touch','olamide-ice'],[6,1,'named:thornwise','poison_spray','mzee-nature']]){
  const p=await scene(ch,en);await spell(p,who,skill,label);
  // Pause and scene shutdown must cancel the charge and its listener ownership.
  const life=await p.evaluate(async()=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.side==='b'),clip=a.sheet.clips.cast||a.sheet.clips.attack;
   const before=s.events.listenerCount('update');const stop=X.StoryEffects.charge(s,'fire_bolt',a,clip);await new Promise(r=>setTimeout(r,100));s.paused=true;
   const focus=s.children.list.find(x=>x.name==='spell_charge_focus'),size=focus.displayWidth;await new Promise(r=>setTimeout(r,180));const same=focus.displayWidth===size;s.paused=false;stop();
   return {same,before,after:s.events.listenerCount('update'),left:s.children.list.filter(x=>x.name.startsWith('spell_charge')).length};});
  assert(life.same);assert.equal(life.before,life.after);assert.equal(life.left,0);await p.close();
 }
 {const p=await scene(1,1);const r=await p.evaluate(async()=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),a=[...s.actors.values()].find(a=>a.side==='b'),h=s.hero,clips=[];let effects=0;const old=a.play.bind(a),fx=X.StoryEffects.play;
  a.play=(name,o)=>{clips.push(name);return old(name,o);};X.StoryEffects.play=(...args)=>{effects++;return fx(...args);};
  for(const skillId of ['marked_for_the_knife','contract_mark','taunt'])await X.Beats.play(s,{hero:false,events:[{t:'use',uid:a.uid,target:h.uid,skillId},{t:'damage',uid:h.uid,by:a.uid,dmg:5,tag:'attack'},{t:'status',uid:h.uid,kind:'marked',rounds:2}]});
  a.play=old;X.StoryEffects.play=fx;return {clips,effects};});assert.equal(r.effects,0);assert.equal(r.clips.filter(c=>c==='slash').length,3);assert.deepEqual(p.errors,[]);results.push({label:'weapon-status',...r});await p.close();}
 {const p=await scene(2,0);for(const arm of [false,true]){
  await p.evaluate(arm=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),wolf=[...s.actors.values()].find(a=>a.side==='b'),h=s.hero;window.wolfDone=false;
   X.Beats.play(s,{hero:false,events:[{t:'use',uid:wolf.uid,target:h.uid,skillId:'basic_attack'},{t:'damage',uid:h.uid,by:wolf.uid,dmg:h.unit.maxHp*(arm?.24:.1),tag:'attack'}]}).then(()=>window.wolfDone=true);},arm);
  await p.waitForTimeout(850);await p.screenshot({path:path.join(out,'wolf-'+(arm?'arm':'leg')+'-contact.png')});await p.waitForFunction(()=>wolfDone);
  const r=await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return [...s.actors.values()].map(a=>({alive:a.alive,visible:a.root.visible,clip:a.img.anims.currentAnim.key,x:a.x,home:a.home.x}));});assert(r.every(a=>a.alive&&a.visible&&Math.abs(a.x-a.home)<1));
 }assert.deepEqual(p.errors,[]);await p.close();}
 fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(results,null,2));console.log('PASS: caster basics, elemental enemy spells, weapon marks, charge lifecycle, wolf arm/leg contacts');
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
