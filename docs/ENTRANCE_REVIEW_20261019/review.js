(async()=>{
'use strict';const X=ADV.Expedition,S=X.Story,E=X.Entrances,$=id=>document.getElementById(id),q=new URLSearchParams(location.search);
S.save=()=>true;X.Run.save=()=>({ok:true});
S.Presentation.configure(await fetch('assets/expedition/story/campaign.json').then(r=>r.json()));
const catalogue=Object.values(X.EntranceData.actors),selected=q.get('actor')||'wolf',p=X.EntranceData.actors[selected];
if(!p)throw Error('Unknown entrance');
for(const r of catalogue){const o=document.createElement('option');o.value=r.actor;o.textContent=r.name+(r.appearances?.length?' · Ch '+[...new Set(r.appearances.map(a=>a.chapter))].join(','):' · Arcade');$('enemy').append(o);}
$('enemy').value=selected;$('enemy').onchange=()=>{q.set('actor',$('enemy').value);q.delete('variant');location.search=q.toString();};
const variant=q.get('variant')||'';
for(const [value,label]of [['','First encounter'],...(['story_gorruk','story_amara'].includes(p.actor)?[['return','Chapter 13 rematch']]:p.actor==='story_korvath'?[['ascendant','Ascended encounter']]:[])]){const o=document.createElement('option');o.value=value;o.textContent=label;$('moment').append(o);}
$('moment').hidden=$('moment').options.length<2;$('moment').value=variant;$('moment').onchange=()=>{q.set('variant',$('moment').value);location.search=q.toString();};
const choices=Object.values(X.EntranceData.voices).filter(r=>r.kind==='reaction'&&r.actor===p.actor);
const who=choices.some(r=>r.who===q.get('companion'))?q.get('companion'):'cassian';
for(const r of choices){const o=document.createElement('option');o.value=r.who;o.textContent=r.name;$('companion').append(o);}
$('companion').hidden=!choices.length;$('companion').value=who;$('companion').onchange=()=>{q.set('companion',$('companion').value);location.search=q.toString();};
$('description').textContent=p.action+(p.voiceId?' · Existing character voice.':p.monsterReaction?' · One fielded companion reacts.':' · Silent entrance.');
const ids=['hiro',p.actor,...(choices.length?['companion_'+who]:[])];
const appearance=(variant==='return'?p.appearances?.find(a=>a.chapter===13):variant==='ascendant'?p.appearances?.find(a=>a.chapter===14&&a.encounter===3):null)||p.appearances?.[0],chapter=appearance?.chapter||6;
const place=appearance?S.Presentation.data.routes[chapter][appearance.encounter]:({wolf:'mirkhollow',alpha:'mirkhollow',hag:'grove',orc:'hunted_city',hydra:'shore',enchantress:'temple'}[p.actor]||'mirkhollow');
const stageLocation=S.Stage.files[place]||S.Presentation.data.art.environments[place]?place:'mirkhollow';
const file=S.Stage.files[stageLocation]||S.Presentation.media(S.Presentation.data.art.environments[stageLocation].file);
class Review extends X.Scene{
 constructor(){super();this.sys.settings.key='EntranceReview';}
 init(){this.opts={muted:true};this.__entranceReview=true;this.artIds=ids;this.story={record:{chapter,encounter:appearance?.encounter||0}};}
 preload(){X.Painted.preload(this,ids);this.load.image('entrance_review_bg',file);}
 create(){
  if(!X.Painted.require(this,ids))return;
  this.ended=false;this.paused=false;this.actors=new Map();this.location=stageLocation;this.run=X.Run.fresh();this.game_={quest:{travel:{weather:'clear'}}};
  this.env=S.Stage.paint(this,stageLocation,'entrance_review_bg','day');
  const unit=(uid,name,cid)=>({uid,side:uid==='foe'?'b':'a',chp:100,maxHp:100,statuses:[],ch:{name,...(cid?{expeditionStoryCompanion:cid}:{})}});
  const binding=Object.values(S.bindings).find(b=>b.actor===p.actor),def=Object.values(X.enemies).find(e=>(e.artActor||e.kind)===p.actor);
  this.hero=new X.Actor(this,{uid:'hero',unit:unit('hero','Hiro'),side:'a',kind:'hero',name:'Hiro',sheet:X.Painted.sheet(this,'hiro'),x:400,y:612,height:330});this.actors.set('hero',this.hero);
  this.foe=new X.Actor(this,{uid:'foe',unit:unit('foe',p.name),side:'b',name:p.name,sheet:X.Painted.sheet(this,p.actor),x:890,y:612,height:binding?.height||def?.height||300});this.actors.set('foe',this.foe);
  if(choices.length){const kit=S.Companions.kits[who],ally=new X.Actor(this,{uid:'ally',unit:unit('ally',choices.find(r=>r.who===who).name,who),side:'a',kind:'ally',name:choices.find(r=>r.who===who).name,sheet:X.Painted.sheet(this,'companion_'+who),x:200,y:558,height:kit.height||310});this.actors.set('ally',ally);}
  for(const a of this.actors.values())this.placeOnGround(a);
  X.UI.splitCameras(this);window.reviewScene=this;
  Promise.resolve(this.env.ready).then(()=>{$('status').textContent='Ready. Replay to see the entrance; enable Sound for its line.';window.reviewReady=true;});
 }
 groundProfile(){return S.Stage.groundProfiles[this.location]||super.groundProfile();}
}
window.reviewAction=async()=>{
 const s=window.reviewScene;if(!s||window.reviewBusy)return;window.reviewBusy=true;s.ended=false;s.paused=false;s.time.paused=false;$('pause').textContent='Pause';s.opts.muted=!$('sound').checked;s.game.sound.mute=s.opts.muted;
 $('status').textContent='Playing...';try{await E.present(s,s.foe,{force:true,companion:who});$('status').textContent='Ready — same scale, formation and camera restored.';}catch(e){$('status').textContent=e.message;throw e;}finally{window.reviewBusy=false;}
};
$('play').onclick=()=>window.reviewAction().catch(console.error);
$('pause').onclick=()=>{const s=window.reviewScene;if(s){s.paused=!s.paused;s.time.paused=s.paused;$('pause').textContent=s.paused?'Resume':'Pause';}};
$('speed').onchange=()=>{if(window.reviewScene)window.reviewScene.time.timeScale=Number($('speed').value);};
$('sound').onchange=()=>{if(window.reviewScene){window.reviewScene.opts.muted=!$('sound').checked;window.reviewScene.game.sound.mute=!$('sound').checked;}};
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1280,height:760,backgroundColor:'#080b15',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Review]});window.reviewGame=game;
})().catch(e=>{document.getElementById('status').textContent=e.message;console.error(e);});
