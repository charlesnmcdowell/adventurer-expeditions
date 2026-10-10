(async function(){
'use strict';
const S=ADV.Expedition.Story,P=S.Presentation,C=ADV.Campaign3,$=id=>document.getElementById(id),panel=$('panel');
let session=null,muted=true,voice=null,music=null,reply=null,line=0,applied=null;
let battleFrame=null;
const d=await fetch('assets/expedition/story/campaign.json').then(r=>{if(!r.ok)throw Error('Campaign manifest failed');return r.json();});
P.configure(d);let sceneContext=null,musicId=null;
const available=new Set(await fetch('assets/expedition/story/preview-media.json').then(r=>r.json()));
const url=path=>'assets/expedition/story/media/'+path;
function stopVoice(){if(voice){voice.pause();voice.src='';voice=null;}}
function button(label,action,parent=panel){const b=document.createElement('button');b.textContent=label;b.onclick=action;parent.append(b);return b;}
function text(tag,content,parent,cls){const e=document.createElement(tag);e.textContent=content;if(cls)e.className=cls;parent.append(e);return e;}
function playMusic(){const id=session?P.music(session):'vg_lanternhold';if(id!==musicId){music?.pause();music=new Audio(url('audio/music/'+id+'.mp3'));music.loop=true;music.volume=.17;musicId=id;}if(!muted)music.play().catch(()=>{});}
function say(beat){stopVoice();if(muted)return;const rows=beat.lines||C.lines('gate',beat.who,beat.key),row=rows[line];if(!row)return;
  const file=P.voice(beat,line);
  if(!available.has(file))return;voice=new Audio(url(file));voice.volume=.9;voice.play().catch(()=>{});
}
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'Sound on':'Mute';if(muted){stopVoice();music?.pause();}else{playMusic();const beat=reply||session&&S.beats(session)[0];if(beat)say(beat);}};
$('home').onclick=()=>{stopVoice();battleFrame?.remove();battleFrame=null;session=null;reply=null;title();};
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==battleFrame?.contentWindow||event.data?.type!=='expeditions-story-battle')return;
  battleFrame.remove();battleFrame=null;open(S.load());
});
function battle(){
  stopVoice();music?.pause();S.save(session);panel.replaceChildren();
  battleFrame=document.createElement('iframe');battleFrame.title='Campaign battle';battleFrame.src='docs/STORY_FIGHT_PREVIEW.html?muted='+(muted?'1':'0');
  battleFrame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;background:#070a12;z-index:6';document.body.append(battleFrame);
}
function open(record){session=S.open(record);window.storyPreview=session;reply=null;line=0;applied=null;sceneContext=null;playMusic();render();}
function showScene(beat){
  const spec=P.scene(session,beat,sceneContext);if(!spec)return;sceneContext=spec;
  const art=d.art[spec.kind]?.[spec.id];if(!art)return;
  const bg=document.querySelector('.backdrop');bg.style.backgroundImage='url("'+url(art.file)+'")';
  bg.dataset.location=spec.id;bg.dataset.kind=spec.kind;
  bg.classList.toggle('story-still',spec.kind==='stills');
  $('weather').hidden=spec.kind==='stills'||!!art.indoor;
}
function title(){stopVoice();session=null;reply=null;sceneContext=null;playMusic();const bg=document.querySelector('.backdrop');bg.style.backgroundImage='url("'+url(d.art.environments.lanternhold.file)+'")';bg.dataset.location='lanternhold';bg.dataset.kind='environments';bg.classList.remove('story-still');$('weather').hidden=false;panel.replaceChildren();const box=text('section','',panel,'menu');text('h1','ADVENTURER',box);text('h1','',box).innerHTML='<small>EXPEDITIONS</small>';
  const buttons=text('div','',box,'buttons');if(S.load())button('Continue campaign preview',()=>open(S.load()),buttons);
  button('Begin campaign preview',()=>{if(S.load()){panel.replaceChildren();text('p','Start a new campaign preview? Your Arcade run stays as it is.',panel);button('Start new campaign',()=>open(S.fresh()));button('Cancel',title);}else open(S.fresh());},buttons);
  button('Play Arcade',()=>location.href='index.html',buttons);
  text('p','Development preview: original story and recordings, with the opening Nib battle playable. Later fights remain locked while their combat art is completed.',box,'notice');
}
function render(){
  stopVoice();panel.replaceChildren();const r=session.record;
  if(r.phase==='combat'||r.phase==='defeat'){
    const box=text('section','',panel,'menu');text('h1','The road ahead',box);text('p',session.game.quest.quest.encounters[r.encounter]?.label||'Encounter',box,'speaker');
    if(!S.readiness(session).length){
      text('p',r.phase==='defeat'?'Your chapter progress is safe. Retry from the start of this fight.':'Ready to fight. Hiro battles alone; your companions remain part of the story.',box,'notice');
      button(r.phase==='defeat'?'Retry fight':'Begin fight',()=>{if(r.phase==='defeat')S.retry(session);battle();},box);button('Back to title',title,box);return;
    }
    text('p','This fight is not ready to play. The campaign needs its own approved full-body enemies and finishers before combat can open. Your dialogue choices have been saved.',box,'notice');
    text('p','Pending: '+S.readiness(session).join(', '),box,'notice error');button('Back to title',title,box);return;
  }
  let beat=reply||S.beats(session)[0];
  if(!beat){S.nextPhase(session);if(r.phase==='complete'){text('p','Campaign complete',panel);return;}return render();}
  const identity=r.chapter+':'+r.encounter+':'+r.phase+':'+beat.who+':'+beat.key;
  if(applied!==identity){S.applyBeat(session,beat);applied=identity;}
  showScene(beat);playMusic();
  const box=text('section','',panel);box.id='dialogue';text('div',ADV.DATA.CAMPAIGN_CHARS[beat.who]?.name||beat.who,box,'speaker');
  if(beat.caption)text('div',beat.caption,box,'caption');
  const rows=beat.lines||C.lines('gate',beat.who,beat.key);line=Math.min(line,Math.max(0,rows.length-1));
  const raw=rows[line]?.t||beat.promptText||'';
  const target=beat.to&&beat.to!=='player'?ADV.DATA.CAMPAIGN_CHARS[beat.to]?.name||'':session.hero.name;
  text('p',raw.replace(/\[[^\]]+\]/g,'').replaceAll('{target}',target).trim(),box,'speech');
  const choices=text('div','',box,'choices');
  if(line<rows.length-1)button('Continue',()=>{line++;render();},choices);
  else if(beat.choice){const opts=S.options(session,beat.choice);for(const o of opts)button(o.text,()=>{reply=S.choose(session,beat,o.id);line=0;applied=null;if(!reply)S.shiftBeat(session);render();},choices);if(!opts.length)button('Continue',advance,choices);}
  else button('Continue',advance,choices);
  function advance(){if(reply)reply=null;S.shiftBeat(session);line=0;applied=null;render();}
  say(beat);
}
// Separate animated atmosphere on the reused panorama, never in front of UI.
const canvas=$('weather'),ctx=canvas.getContext('2d');let w=0,h=0;
function draw(t){if(w!==innerWidth||h!==innerHeight){w=canvas.width=innerWidth;h=canvas.height=innerHeight;}ctx.clearRect(0,0,w,h);
  if(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(let i=0;i<24;i++){const x=(i*143+t*.009)%(w+70)-35,y=h*(.1+(i%7)*.09)+Math.sin(t/2400+i)*12;ctx.fillStyle='rgba(236,217,150,'+(.08+.1*(1+Math.sin(t/1300+i))/2)+')';ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<3;i++){const x=((t*.009+i*w*.42)%(w*1.6))-w*.3,y=h*(.15+i*.055);const g=ctx.createRadialGradient(x,y,1,x,y,w*.23);g.addColorStop(0,'rgba(145,168,195,.045)');g.addColorStop(1,'rgba(145,168,195,0)');ctx.fillStyle=g;ctx.fillRect(x-w*.3,y-h*.15,w*.6,h*.3);}
  }requestAnimationFrame(draw);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();music?.pause();}else if(!muted&&session)playMusic();});
requestAnimationFrame(draw);title();
})().catch(e=>{document.getElementById('panel').textContent='Preview could not load: '+e.message;console.error(e);});
