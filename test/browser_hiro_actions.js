'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
const out='test/reports/story/hiro-actions';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:760}}),errors=[],results=[];try{
p.on('pageerror',e=>errors.push(String(e)));
await p.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('<script>(async()=>',"<script>ADV.Expedition.StoryBattle.prototype.fight=async function(){await this.intro(true);this.__ready=true;};</script><script>(async()=>")});});
async function load(chapter,encounter){
await p.goto('http://127.0.0.1:8742/docs/STORY_CAMPAIGN_PREVIEW.html');await p.getByRole('button',{name:'Begin story',exact:true}).waitFor();
await p.evaluate(({chapter,encounter})=>{const S=ADV.Expedition.Story,s=S.open(S.fresh());Object.assign(s.record,{chapter,encounter,phase:'combat'});s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);},{chapter,encounter});
await p.goto('http://127.0.0.1:8742/docs/STORY_FIGHT_PREVIEW.html?muted=1');await p.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__ready,null,{timeout:90000});
}
await load(1,2);
await p.evaluate(()=>{const A=ADV,X=A.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero.unit;const from=s.enc.st.events.length;
const target=s.enc.st.units.find(u=>u.side==='b');const res=A.Combat.act(s.enc.st,h,{kind:'skill',skillId:'god_aura',targetUid:target.uid});if(!res.ok)throw Error(JSON.stringify(res));
s.__events=s.enc.st.events.slice(from);s.__done=false;s.events.on('update',()=>{if(!s.__contact&&s.hero.img.frame.name==='iaido-draw/7'){s.__contact=true;s.paused=true;}});
X.Beats.play(s,{actor:h.uid,hero:true,events:s.__events}).then(()=>s.__done=true);});
await p.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__contact);await p.screenshot({path:out+'/iaido-three-enemies.png'});
const iaido=await p.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');return {drawings:s.hero.sheet.clips['iaido-draw'].frames.length,foes:s.enc.st.units.filter(u=>u.side==='b').length,contact:s.hero.img.frame.name};});
assert.equal(iaido.drawings,16);assert.equal(iaido.foes,3);results.push(iaido);await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);await p.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__done);
for(const [chapter,encounter,identity,skill]of [[1,2,'enemy:consortium_mage','fire_bolt'],[1,2,'enemy:consortium_mage','prismatic_bolt'],[3,1,'enemy:bandit_archer','aimed_shot']]){
await load(chapter,encounter);
await p.evaluate(({identity,skill})=>{const A=ADV,X=A.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero.unit,foe=[...s.actors.values()].find(a=>a.unit.ch.storyOpponent===identity);if(!foe)throw Error('Missing '+identity);
let r=A.Combat.act(s.enc.st,h,{kind:'skill',skillId:'counter_attack',targetUid:h.uid});if(!r.ok)throw Error(JSON.stringify(r));
const from=s.enc.st.events.length;X.__deflecting=true;try{r=A.Combat.act(s.enc.st,foe.unit,{kind:'skill',skillId:skill,targetUid:h.uid});}finally{X.__deflecting=false;}if(!r.ok)throw Error(JSON.stringify(r));
const events=s.enc.st.events.slice(from);if(!events.some(e=>e.t==='damage'&&e.tag==='reflect'))throw Error('No reflected hit '+JSON.stringify(events));
s.__done=false;s.__shot=null;const watch=()=>{const shot=s.children.list.find(c=>c.name==='story_effect_'+skill&&c.texture?.key==='story_effects_reflected');if(shot&&!s.__shot){s.__shot={frame:s.hero.img.frame.name,key:shot.texture.key,rotation:shot.rotation,x:shot.x,target:foe.x};s.paused=true;}};
s.events.on('update',watch);X.Beats.play(s,{actor:foe.uid,hero:false,events}).then(()=>{s.events.off('update',watch);s.__done=true;});},{identity,skill});
await p.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__shot,null,{timeout:30000});const shot=await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').__shot);assert(shot.frame.startsWith('deflect/'));assert(shot.x<shot.target);
await p.screenshot({path:out+'/reflect-'+skill+'.png'});await p.evaluate(()=>storyGame.scene.getScene('StoryBattle').paused=false);await p.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__done);results.push({skill,...shot});
}
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,results,errors},null,2));console.log('Actual story Iaido and Counter: 16 drawings, 3 enemies, fire/prism/arrow reflected at deflect contact, recovery completed');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
