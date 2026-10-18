'use strict';
// Real director/atlas playback, isolated saves. Every authored chapter branch.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test/reports/combat-identity');fs.mkdirSync(out,{recursive:true});
const wanted=process.argv.slice(2),roster=JSON.parse(fs.readFileSync(path.join(out,'inventory.json'))).filter(r=>!wanted.length||wanted.includes(r.id));
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 const p=await b.newPage({viewport:{width:1280,height:760}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('const record=S.load();',`const pilot=S.open(S.fresh());Object.assign(pilot.record,{chapter:7,encounter:0,phase:'combat'});pilot.record.run.tutorial.skipGuide=true;S.syncQuest(pilot);
 for(const id of ['fennick','ithrel']){ADV.Campaign3.recruit(pilot.game,id);S.Companions.register(id,await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json').then(r=>r.json()));}S.Companions.select(pilot,['fennick','ithrel']);const record=pilot.record;S.save(pilot);X.StoryBattle.prototype.fight=async function(){await this.intro(false);this.__ready=true;};`);await route.fulfill({response:r,body});});
 await p.goto('http://127.0.0.1:'+server.address().port+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:60000});
 const companionResults=await p.evaluate(async()=>{
  const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),output=[];
  for(const [id,skills]of [['fennick',['basic_attack','venom_fang','whisper_of_ending']],['ithrel',['basic_attack','aimed_shot','snare']]]){
   const a=[...s.actors.values()].find(a=>a.unit.ch.expeditionStoryCompanion===id),t=[...s.actors.values()].find(a=>a.side==='b');
   for(const skill of skills){const clips=[],flights=[],old=a.play.bind(a),fx=X.StoryEffects.play;a.play=(n,o)=>{clips.push({n,c:o?.companionClip});return old(n,o);};X.StoryEffects.play=(...args)=>{flights.push(args[1]);return fx(...args);};
    await X.Beats.play(s,{events:[{t:'use',uid:a.uid,target:t.uid,skillId:skill},{t:'damage',uid:t.uid,by:a.uid,dmg:5}]});a.play=old;X.StoryEffects.play=fx;output.push({id,skill,clips,flights});
   }
  }return output;
 });
 for(const r of companionResults.filter(r=>r.id==='fennick')){assert.equal(r.flights.length,0);assert(r.clips.some(c=>c.n==='slash'));assert(!r.clips.some(c=>c.n==='cast'));}
 for(const r of companionResults.filter(r=>r.id==='ithrel'))assert(r.flights.length>0);
 await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');for(const a of s.actors.values())if(a!==s.hero)a.root.setVisible(false);s.actors=new Map([[s.hero.uid,s.hero]]);});
 for(const row of roster){
  const result=await p.evaluate(async row=>{
   const X=ADV.Expedition,S=X.Story,s=storyGame.scene.getScene('StoryBattle'),loc=row.appearances[0],test=S.open(S.fresh());let ch;
   if(row.arcade)ch=X.Encounter.makeEnemy(new ADV.RNG(1),row.arcade,1);
   else {Object.assign(test.record,{chapter:loc.chapter,encounter:loc.encounter,phase:'combat'});if(loc.flag)ADV.Campaign3.setFlag(test.game,loc.flag);S.syncQuest(test);ch=S.Combat.spawn(test).find(c=>c.storyOpponent===row.id);}
   if(!ch)throw Error('No subject '+row.id);
   const previousStory=s.story;if(row.arcade)s.story=null;
   const key='xp_'+row.actor+'_sheet',cache='xp_'+row.actor+'_clips',base='assets/expedition/'+row.actor+'/',existed=s.textures.exists(key);
   if(!existed){s.load.multiatlas(key,base+row.actor+'.json',base);s.load.json(cache,base+row.actor+'.json');await new Promise(ok=>{s.load.once('complete',ok);s.load.start();});}
   const sheet=X.Painted.sheet(s,row.actor),a=new X.Actor(s,{uid:'qa-foe',unit:{chp:1000,maxHp:1000,statuses:[],ch},side:'b',x:910,y:650,sheet,texture:key,height:row.height||S.bindings[row.id].height,kind:row.arcade?X.enemies[row.arcade].kind:row.actor});if(s.hudCam)s.hudCam.ignore(a.root);s.actors.set(a.uid,a);a.syncPerspective();a.home={x:a.x,y:a.y};
   const output={id:row.id,actor:row.actor,skills:[],missingAnchors:[],existed};
   for(const id of Object.keys(row.skills)){
    // Exercise source skills through the real director without random combat
    // killing the subject. This tests presentation, not balance or AI choice.
    const sk=ADV.SkillSys.manifest(ch,ch.actives.find(e=>e.skillId===id)||{skillId:id,level:1}).data,support=['self','party','ally','deadAlly','allyLane'].includes(sk.target),t=support?a:s.hero;
    const clips=[],flights=[],old=a.play.bind(a),fx=X.StoryEffects.play;let contact=0,arrived=0,clock=performance.now();
    const hit=t.play.bind(t);if(t!==a)t.play=(n,o)=>{if(n==='hit_short')contact=performance.now()-clock;return hit(n,o);};
    a.play=(n,o)=>{clips.push(n);return old(n,o);};
    X.StoryEffects.play=(scene,effect,from,to,opts)=>{if(!opts?.clip?.releaseAnchor)output.missingAnchors.push(id);flights.push({effect,from,to,release:performance.now()-clock});return fx(scene,effect,from,to,opts).then(r=>{arrived=performance.now()-clock;return r;});};
    await X.Beats.play(s,{hero:false,events:[{t:'use',uid:a.uid,target:t.uid,skillId:id},support?{t:'status',uid:t.uid,kind:'guard',rounds:2}:{t:'damage',uid:t.uid,by:a.uid,dmg:5,tag:'attack'}]});
    a.play=old;if(t!==a)t.play=hit;X.StoryEffects.play=fx;
    output.skills.push({id,clips,flights,contact,arrived,position:{x:a.x,y:a.y,home:a.home},restored:Math.abs(a.x-a.home.x)<1&&Math.abs(a.y-a.home.y)<1});
   }
   s.story=previousStory;window.auditActor=a;return output;
  },row);
  assert(result.skills.every(s=>s.restored),row.id+' did not return home: '+JSON.stringify(result.skills.filter(s=>!s.restored)));
  for(const r of result.skills)if(r.contact&&r.flights.length)assert(r.contact>=r.arrived,row.id+'/'+r.id+' hit before flight');
  await p.screenshot({path:path.join(out,row.actor+'-idle.png')});
  await p.evaluate(({actor,existed})=>{const s=storyGame.scene.getScene('StoryBattle');auditActor.destroy();s.actors.delete('qa-foe');if(!existed){for(const key of Object.keys(s.anims.anims.entries))if(key.startsWith('xp_'+actor+'_sheet:'))s.anims.remove(key);s.textures.remove('xp_'+actor+'_sheet');s.cache.json.remove('xp_'+actor+'_clips');}},{actor:row.actor,existed:result.existed});
  results.push(result);fs.writeFileSync(path.join(out,wanted.length?'browser-focus.json':'browser.json'),JSON.stringify({companions:companionResults,enemies:results,errors},null,2));console.log('PASS',row.id,result.skills.length,'moves; missing anchors',result.missingAnchors.join(','));
 }
 assert.deepEqual(errors,[]);console.log('PASS all',results.length,'campaign identities');
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
