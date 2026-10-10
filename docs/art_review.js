/* Review-only player. Uses shipped modules without booting their gameplay scenes. */
(()=>{'use strict';
const $=id=>document.getElementById(id),X=ADV.Expedition,entries=window.REVIEW_ENTRIES;
const storageKey='expeditions.visualReview.v1';let feedback={};
try{feedback=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch(_){}
let selected=null,scene=null,playing=true,clock=0,frame=0,duration=1,starts=[],ready=false,speed=1,game;
const atlasKey=e=>'review_atlas_'+(e.meta||e.id).replace(/[^a-zA-Z0-9]/g,'_');
function candidates(){return entries.filter(e=>($('location').value==='all'||e.location===$('location').value||e.location==='all')&&($('kind').value==='all'||$('kind').value===e.kind||$('kind').value==='marked'&&(feedback[e.id]?.rework||feedback[e.id]?.remove)));}
function list(){
 $('items').replaceChildren();for(const e of candidates()){
  const b=document.createElement('button');b.classList.toggle('active',selected?.id===e.id);b.dataset.id=e.id;b.disabled=!ready;
  const small=document.createElement('small');small.textContent=e.id+(feedback[e.id]?.rework?' · REWORK':'')+(feedback[e.id]?.remove?' · REMOVE':'');b.append(small,document.createTextNode(e.label));b.onclick=()=>select(e);$('items').append(b);
 }
 if(!$('items').children.length){const p=document.createElement('p');p.className='empty';p.textContent='No items in this filter.';$('items').append(p);}
 $('total').textContent=entries.length+' items · '+Object.values(feedback).filter(f=>f.rework||f.remove).length+' marked';
}
function pause(value=true){playing=!value;if(scene)scene.paused=value;$('play').textContent=playing?'Pause':'Play';}
function busy(value){ready=!value;$('loading').hidden=!value;for(const id of ['play','replay','previousFrame','nextFrame','capture','scrub','previousItem','nextItem','related'])$(id).disabled=value;document.querySelectorAll('#items button').forEach(b=>b.disabled=value);}
function select(e){
 if(!e)return;selected=e;clock=0;frame=0;busy(true);pause(false);$('loading').textContent='Loading '+e.label+'…';
 $('id').textContent=e.id;$('title').textContent=e.label;
 const f=feedback[e.id]||{};$('rework').checked=!!f.rework;$('remove').checked=!!f.remove;$('note').value=f.note||'';
 const isClip=!!e.clip;$('ghostLabel').hidden=!isClip;$('weatherLabel').hidden=isClip;$('related').hidden=!['travel','action'].includes(e.kind);
 $('related').textContent=e.kind==='travel'?'Inspect action poses':'View full journey';
 $('known').hidden=!e.id.startsWith('T-CITADEL');$('known').textContent='Portal rework: twelve replacement poses, passing legs, planted casting, tucked crossing and a bent-knee landing. Inspect the run-in/action/run-out transitions at normal speed; final visual approval remains yours.';
 $('modeNote').textContent=e.kind==='travel'?'Live game travel renderer, including parallax, action placement and weather. Use “Inspect action poses” to inspect all twelve source poses individually.':e.kind==='background'?'Live game battle scenery and environmental motion. The fighting surface stays fixed. Weather can be changed for review.':'Current packed frames with authored holds and registration. Fixed review camera; in-game cinematic zoom, slowdown and separate blood overlay are not simulated. Frame numbers below are 1-based.';
 $('file').textContent=e.meta||e.artId||'Battle background: '+e.bg;
 history.replaceState(null,'','#'+e.id);list();
 if(game.scene.isActive('Review'))game.scene.stop('Review');
 // A single selected atlas is sufficient; do not keep all 51 pairs in memory.
 for(const key of game.textures.getTextureKeys())if(key.startsWith('review_atlas_')&&key!==atlasKey(e))game.textures.remove(key);
 game.scene.start('Review',{entry:e});
}
function record(){if(!selected)return;feedback[selected.id]={rework:$('rework').checked,remove:$('remove').checked,note:$('note').value};try{localStorage.setItem(storageKey,JSON.stringify(feedback));$('status').textContent='Notes saved in this browser.';}catch(_){$('status').textContent='Browser storage unavailable — download your notes before closing.';}list();}
function download(name,content,type='text/plain'){const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function report(){const rows=['Adventurer: Expeditions — visual review','Marks request changes; no game content has been removed.',''];for(const e of entries){const f=feedback[e.id];if(f&&(f.rework||f.remove||f.note))rows.push((f.remove?'REMOVE':f.rework?'REWORK':'NOTE')+' '+e.id+' | '+e.label+'\n'+(e.clipId||e.artId||e.bg||'')+'\n'+(f.note||'')+'\n');}if(rows.length===3)rows.push('No feedback marked yet.');return rows.join('\n');}
async function copy(text){try{await navigator.clipboard.writeText(text);$('status').textContent='Copied. Paste it into the chat.';}catch(_){download('Expeditions-Visual-Review.txt',text);$('status').textContent='Clipboard unavailable; downloaded the list instead.';}}
function step(direction){if(!ready)return;pause();
 if(selected.clip){frame=(frame+direction+selected.clip.frames.length)%selected.clip.frames.length;clock=starts[frame];}
 else if(selected.kind==='travel'){
  const d=scene.cache.json.get('travel_'+selected.artId),offset=scene.pano.runInMs,first=d.actionStartFrame??1,end=d.actionEndFrame??9;
  let t=0,points=[0,offset/2];for(let i=0;i<d.frames.length;i++){if(i>=first&&i<end)points.push(offset+t-startsFor(d.frames,first)+1);t+=d.frames[i].ms;}points.push(duration-scene.pano.runOutMs+1,duration-1);points.sort((a,b)=>a-b);
  clock=direction>0?(points.find(t=>t>clock+1)??0):([...points].reverse().find(t=>t<clock-1)??duration-1);
 }else clock=(clock+direction*500+duration)%duration;
 render();}
const startsFor=(frames,index)=>frames.slice(0,index).reduce((n,f)=>n+f.ms,0);
function render(){if(!ready||!scene)return;const e=selected;
 if(e.clip){frame=starts.findLastIndex(t=>t<=clock);frame=Math.max(0,Math.min(e.clip.frames.length-1,frame));scene.sprite.setFrame(e.clip.frames[frame]);scene.ghost.setFrame(e.clip.frames[Math.max(0,frame-1)]).setVisible($('ghost').checked&&frame>0);$('scrub').max=e.clip.frames.length-1;$('scrub').value=frame;$('position').textContent='Frame '+(frame+1)+' / '+e.clip.frames.length+' · index '+frame+' · '+e.clip.frameDurationsMs[frame]+' ms hold'+((e.clip.contact||[]).includes(frame)?' · CONTACT':'')+' · '+Math.round(Math.min(clock,duration))+' / '+duration+' ms';}
 else{$('scrub').max=duration-1;$('scrub').value=Math.min(clock,duration-1);if(scene.pano){scene.pano.seek(Math.min(clock,duration-1));$('position').textContent=(clock/1000).toFixed(2)+' / '+(duration/1000).toFixed(2)+' s · '+scene.pano.phase+(scene.pano.phase==='action'?' · action frame '+(scene.pano.currentFrame+1):'');}else $('position').textContent=(clock/1000).toFixed(2)+' s · distance / weather + scenery / hero ground';}
}
function weather(){if(!scene||selected.clip)return;const q=X.Campaign.quest(selected.quest),phase=q?.phase||'day',choice=$('weather').value;
 const wx=choice==='authored'?X.Campaign.weatherFor(q,{seed:17,questClock:0},phase):{kind:choice,intensity:choice==='clear'?0:.75,wind:.4};
 const handle=ADV.WeatherFX.attach(scene,wx,phase,{x:0,y:0,w:1280,h:760},{depth:-5});
 (scene.pano||scene.battleArt)?.mountWeather?.(handle);
}
class Review extends Phaser.Scene{
 constructor(){super('Review');}
 init({entry}){this.entry=entry;this.pano=null;this.sprite=null;this.ghost=null;this.opts={run:{questId:entry.quest||'rain',wave:entry.wave||0,roster:[],field:[]},leg:'midleg'};this.paused=!playing;this.failed=false;}
 preload(){const e=this.entry;this.load.on('loaderror',f=>{this.failed=true;$('loading').textContent='Could not load '+f.src+'. Reload this review page to retry.';});
  if(e.clip){if(!this.textures.exists(atlasKey(e)))this.load.multiatlas(atlasKey(e),e.meta,e.base);}
  else if(e.kind==='travel'){
   if(!this.textures.exists('xp_hiro_sheet'))this.load.multiatlas('xp_hiro_sheet','assets/expedition/hiro/hiro.json','assets/expedition/hiro/');
   if(!this.cache.json.exists('xp_hiro_clips'))this.load.json('xp_hiro_clips','assets/expedition/hiro/hiro.json');X.TravelArt.preload(this);
  }else X.BattleStage.preloadBackground(this,e.bg);
 }
 create(){scene=this;if(this.failed)return;const e=this.entry;this.time.timeScale=speed;
  if(e.clip){const c=e.canvas,s=Math.min(300/e.standing*(e.clip.bodyScale||1),1200/c.w,650/c.h),x=(1280-c.w*s)/2+c.pivot.x*s,y=690-(c.h-c.pivot.y)*s;
   const grid=this.add.graphics();grid.fillStyle(0x242c36,1).fillRect(0,0,1280,760);grid.fillStyle(0x2b3541,1);for(let yy=0;yy<760;yy+=40)for(let xx=0;xx<1280;xx+=40)if((xx+yy)%80===0)grid.fillRect(xx,yy,40,40);grid.lineStyle(1,0xaebfc0,.6).lineBetween(0,y,1280,y);
   this.ghost=this.add.image(x,y,atlasKey(e),e.clip.frames[0]).setOrigin(c.pivot.x/c.w,c.pivot.y/c.h).setScale(s).setAlpha(.22).setVisible(false);
   this.sprite=this.add.image(x,y,atlasKey(e),e.clip.frames[0]).setOrigin(c.pivot.x/c.w,c.pivot.y/c.h).setScale(s);
   starts=[];duration=0;for(const ms of e.clip.frameDurationsMs){starts.push(duration);duration+=ms;}
  }else if(e.kind==='travel'){this.pano=X.TravelArt.paint(this);duration=this.pano.durationMs;weather();}
  else{X.BattleStage.paint(this,e.bg,X.Campaign.quest(e.quest)?.phase||'day');duration=12000;weather();}
  busy(false);render();window.__reviewReady=e.id;
 }
 update(_t,dt){if(!ready)return;this.time.timeScale=speed;if(playing){clock+=Math.min(dt,100)*speed;if(clock>=duration+400){if($('loop').checked)clock=0;else{clock=duration-1;pause();}}}render();}
}
game=new Phaser.Game({type:Phaser.CANVAS,parent:'game',width:1280,height:760,backgroundColor:'#161b26',audio:{noAudio:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[]});
game.events.once('ready',()=>{game.scene.add('Review',Review,false);select(entries.find(e=>e.id===decodeURIComponent(location.hash.slice(1)))||entries.find(e=>e.id==='T-CITADEL-ACTION'));});
window.__artReview={entries,get selected(){return selected;},get ready(){return ready;},get frame(){return frame;},get clock(){return clock;},select:id=>select(entries.find(e=>e.id===id)),report,game};
$('location').onchange=$('kind').onchange=list;
$('play').onclick=()=>pause(playing);$('replay').onclick=()=>{clock=0;pause(false);render();};$('previousFrame').onclick=()=>step(-1);$('nextFrame').onclick=()=>step(1);
$('previousItem').onclick=()=>{const a=candidates(),i=a.indexOf(selected);select(a[(i-1+a.length)%a.length]);};$('nextItem').onclick=()=>{const a=candidates(),i=a.indexOf(selected);select(a[(i+1)%a.length]);};
$('speed').onchange=()=>speed=+$('speed').value;$('ghost').onchange=render;$('weather').onchange=weather;
$('scrub').oninput=()=>{pause();clock=selected.clip?starts[+$('scrub').value]:+$('scrub').value;render();};
$('related').onclick=()=>select(entries.find(e=>e.id===selected.id.replace(selected.kind==='travel'?'JOURNEY':'ACTION',selected.kind==='travel'?'ACTION':'JOURNEY')));
$('rework').onchange=$('remove').onchange=$('note').oninput=record;
$('cite').onclick=()=>{const cite=selected.clip?'Frame '+(frame+1)+' (index '+frame+')':(clock/1000).toFixed(2)+' s'+(scene?.pano?' / '+scene.pano.phase:'');$('note').value+=($('note').value?'\n':'')+cite+': ';record();$('note').focus();};
$('copy').onclick=()=>copy(report());$('download').onclick=()=>download('Expeditions-Visual-Review.txt',report());$('link').onclick=()=>copy(location.href);
$('capture').onclick=()=>{const a=document.createElement('a');a.download=selected.id+'-'+(selected.clip?'frame-'+(frame+1):Math.round(clock)+'ms')+'.png';a.href=game.canvas.toDataURL('image/png');a.click();};
document.addEventListener('keydown',event=>{if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName))return;if(event.code==='Space'){event.preventDefault();pause(playing);}if(event.code==='ArrowRight'){event.preventDefault();step(1);}if(event.code==='ArrowLeft'){event.preventDefault();step(-1);}});
window.addEventListener('hashchange',()=>{const e=entries.find(e=>e.id===location.hash.slice(1));if(e&&e!==selected)select(e);});
})();
