(async function(){
'use strict';
const S=ADV.Expedition.Story,C=ADV.Campaign3,$=id=>document.getElementById(id),panel=$('panel');
let session=null,muted=true,voice=null,music=null,reply=null,line=0,applied=null;
const d=await fetch('assets/expedition/story/campaign.json').then(r=>{if(!r.ok)throw Error('Campaign manifest failed');return r.json();});
const available=new Set(await fetch('assets/expedition/story/preview-media.json').then(r=>r.json()));
const url=path=>'assets/expedition/story/media/'+path;
function stopVoice(){if(voice){voice.pause();voice.src='';voice=null;}}
function button(label,action,parent=panel){const b=document.createElement('button');b.textContent=label;b.onclick=action;parent.append(b);return b;}
function text(tag,content,parent,cls){const e=document.createElement(tag);e.textContent=content;if(cls)e.className=cls;parent.append(e);return e;}
function playMusic(){if(!music){music=new Audio(url('audio/music/vg_lanternhold.mp3'));music.loop=true;music.volume=.17;}if(!muted)music.play().catch(()=>{});}
function say(beat){stopVoice();if(muted)return;const rows=beat.lines||C.lines('gate',beat.who,beat.key),row=rows[line];if(!row)return;
  const file='audio/vo/campaign/'+beat.who+'/'+beat.key+'_'+(row.vo||(beat.voOffset||0)+line+1)+'.mp3';
  if(!available.has(file))return;voice=new Audio(url(file));voice.volume=.9;voice.play().catch(()=>{});
}
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'Sound on':'Mute';if(muted){stopVoice();music?.pause();}else{playMusic();const beat=reply||session&&S.beats(session)[0];if(beat)say(beat);}};
$('home').onclick=()=>{stopVoice();session=null;reply=null;title();};
function open(record){session=S.open(record);window.storyPreview=session;reply=null;line=0;applied=null;playMusic();render();}
function title(){panel.replaceChildren();const box=text('section','',panel,'menu');text('h1','ADVENTURER',box);text('h1','',box).innerHTML='<small>EXPEDITIONS</small>';
  const buttons=text('div','',box,'buttons');if(S.load())button('Continue campaign preview',()=>open(S.load()),buttons);
  button('Begin campaign preview',()=>{if(S.load()){panel.replaceChildren();text('p','Start a new campaign preview? Your Arcade run stays as it is.',panel);button('Start new campaign',()=>open(S.fresh()));button('Cancel',title);}else open(S.fresh());},buttons);
  button('Play Arcade',()=>location.href='index.html',buttons);
  text('p','Opening dialogue, original recordings and checkpoint prototype. Campaign battles are not available yet; enemy art and combat integration are still in production.',box,'notice');
}
function render(){
  stopVoice();panel.replaceChildren();const r=session.record;
  if(r.phase==='combat'||r.phase==='defeat'){
    const box=text('section','',panel,'menu');text('h1','The road ahead',box);text('p',session.game.quest.quest.encounters[r.encounter]?.label||'Encounter',box,'speaker');
    text('p','This fight is not ready to play. The campaign needs its own approved full-body enemies and finishers before combat can open. Your dialogue choices have been saved.',box,'notice');
    text('p','Pending: '+S.readiness(session).join(', '),box,'notice error');button('Back to title',title,box);return;
  }
  let beat=reply||S.beats(session)[0];
  if(!beat){S.nextPhase(session);if(r.phase==='complete'){text('p','Campaign complete',panel);return;}return render();}
  const identity=r.chapter+':'+r.encounter+':'+r.phase+':'+beat.who+':'+beat.key;
  if(applied!==identity){S.applyBeat(session,beat);applied=identity;}
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
