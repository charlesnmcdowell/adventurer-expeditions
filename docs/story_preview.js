(async function(){
'use strict';
const S=ADV.Expedition.Story,P=S.Presentation,C=ADV.Campaign3,$=id=>document.getElementById(id),panel=$('panel');
// Sound starts on and the player's choice is remembered; the fight page reads
// and writes the same key, so one setting covers story and battle (2026-10-11).
const MUTE_KEY='adventurer_expeditions_story_muted';
const storedMute=()=>{try{return localStorage.getItem(MUTE_KEY)==='1';}catch(_){return false;}};
let session=null,muted=storedMute(),voice=null,music=null,reply=null,line=0,applied=null;
let battleFrame=null;
// Complete local campaign. The website packager independently sets its free
// and password chapter limits; changing this does not publish more chapters.
// A local ?through=N remains useful when checking an earlier chapter boundary.
const DEMO_THROUGH=14,localHost=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
// Password access (Hiro, 2026-10-14: chapter one free on the site, chapters two
// to five "if they know password"). UNLOCK_THROUGH above DEMO_THROUGH turns it on;
// the site packager sets both. Only a SHA-256 of the lower-cased password is
// here. It is a casual gate: the chapters' files ship with the page.
const UNLOCK_THROUGH=DEMO_THROUGH,UNLOCK_HASH='e2324f665ae42249ee042331e8e804bb24aa492e123ca40ea13ac9fa0ab56de9',UNLOCK_KEY='adventurer_expeditions_unlocked';
const unlocked=()=>{try{return localStorage.getItem(UNLOCK_KEY)===UNLOCK_HASH;}catch(_){return false;}};
const askedThrough=Number(new URLSearchParams(location.search).get('through'));
const PLAYABLE_THROUGH=localHost&&askedThrough>=1&&askedThrough<=14?askedThrough:unlocked()?Math.max(DEMO_THROUGH,UNLOCK_THROUGH):DEMO_THROUGH;
// The original's fallback caption for a death beat without its own (campaign3_ui.js).
const DEATH_CAPTION='The sword goes through him. You run because he told you to.';
const d=await fetch('assets/expedition/story/campaign.json').then(r=>{if(!r.ok)throw Error('Campaign manifest failed');return r.json();});
P.configure(d);let sceneContext=null,musicId=null;
const available=new Set(await fetch('assets/expedition/story/preview-media.json').then(r=>r.json()));
const portraits=await fetch('assets/expedition/story/portraits/portraits.json').then(r=>{if(!r.ok)throw Error('Story portraits missing');return r.json();});
const companionUI=S.CompanionUI({panel,portraits,muted:()=>muted,render,getSession:()=>session});
const backdrop=S.Backdrop('animated-background',()=>$('stage').classList.add('rendered'));window.storyBackdrop=backdrop;
const url=path=>'assets/expedition/story/media/'+path;
function setMuted(value){muted=value;try{localStorage.setItem(MUTE_KEY,value?'1':'0');}catch(_){}$('sound').textContent=muted?'Sound on':'Mute';}
$('sound').textContent=muted?'Sound on':'Mute';
function stopVoice(){if(voice){voice.onended=null;voice.onerror=null;voice.pause();voice.src='';voice=null;}}
function button(label,action,parent=panel){const b=document.createElement('button');b.textContent=label;b.onclick=action;parent.append(b);return b;}
function text(tag,content,parent,cls){const e=document.createElement(tag);e.textContent=content;if(cls)e.className=cls;parent.append(e);return e;}
function playMusic(beat){const atInn=session?.record.phase==='inn',id=atInn?ADV.Expedition.innMusic:session?P.music(session,false,beat):'vg_lanternhold';if(id!==musicId){music?.pause();music=new Audio(atInn?'audio/music/'+id+'.mp3':url('audio/music/'+id+'.mp3'));music.loop=true;music.volume=.17;musicId=id;}if(!muted)music.play().catch(()=>{});}
function say(beat){stopVoice();if(muted)return;const rows=beat.lines||C.lines('gate',beat.who,beat.key),row=rows[line];if(!row)return;
  const file=P.voice(beat,line);
  if(!available.has(file))return;voice=new Audio(url(file));voice.volume=.9;voice.play().catch(()=>{});
}
// Replay the current line's recording on request, even while muted (2026-10-11).
function lineFile(beat){const file=P.voice(beat,line);return file&&available.has(file)?file:null;}
function replay(beat){const file=lineFile(beat);if(!file)return;stopVoice();voice=new Audio(url(file));voice.volume=.9;voice.play().catch(()=>{});}
// Joins and full-company seat offers, worded and ordered as the original's
// announceJoins/offerSeats (campaign3_ui.js). Diffed around each beat and choice.
// Choice speech is a saved, cancellable step before the source choice hook.
// Reload cannot repeat rewards/recruits; Continue also escapes failed audio.
function hiroChoiceFile(id){const file='audio/vo/campaign/hiro/'+id+'.mp3';return available.has(file)?file:null;}
function chooseWithVoice(beat,o){
  session.record.hiroChoice={choice:beat.choice,option:o.id,text:o.text};S.save(session);render();
}
function hiroChoice(){
  const active=session,r=active.record,pending=r.hiroChoice;
  const beat=S.beats(active)[0],option=beat?.choice===pending.choice&&S.options(active,pending.choice).find(o=>o.id===pending.option);
  if(!option){delete r.hiroChoice;S.save(active);render();return;}
  const box=text('section','',panel);box.id='hiro-choice';text('div','Hiro',box,'speaker');
  text('p',pending.text.replace(/\[[^\]]+\]/g,'').trim(),box,'speech');
  const file=hiroChoiceFile(pending.choice+'_'+pending.option);let finished=false;
  function finish(){
    if(finished||session!==active||!box.isConnected)return;finished=true;stopVoice();
    delete r.hiroChoice;r.lastHiroChoice=pending.choice+'_'+pending.option;
    const before=company();reply=S.choose(active,beat,option.id);noteSeats(before);line=0;applied=null;
    if(!reply)S.shiftBeat(active);S.save(active);render();
  }
  button('Continue',finish,box);
  function speak(){stopVoice();if(muted)return;voice=new Audio(url(file));voice.volume=.9;voice.onended=finish;voice.play().catch(()=>{});}
  if(file)button('Replay line',speak,box).classList.add('replay');
  if(muted||!file)finish();else speak();
}
function company(){const g=session.game;return {roster:C.roster(g),riding:C.companyIds(g)};}
function names(ids){const n=ids.map(C.charName);return n.length<3?n.join(' and '):n.slice(0,-1).join(', ')+', and '+n.at(-1);}
function toast(msg){const t=text('div',msg,document.body,'story-toast');setTimeout(()=>t.classList.add('gone'),3200);setTimeout(()=>t.remove(),4200);}
function noteSeats(before){
  const after=company(),r=session.record;
  const joined=after.riding.filter(id=>!before.riding.includes(id));
  const waiting=after.roster.filter(id=>!before.roster.includes(id)&&!after.riding.includes(id));
  const newRecruits=S.Companions.enabled?S.Companions.queueUnlocks(session,before.roster):[];
  const reseated=joined.filter(id=>!newRecruits.includes(id));
  if(reseated.length)toast(names(reseated)+(reseated.length===1?' rides with you.':' ride with you.'));
  if(waiting.length){r.seatOffer=[...(r.seatOffer||[]),...waiting];S.save(session);}
}
function seatMenu(){
  const r=session.record,g=session.game;
  r.seatOffer=r.seatOffer.filter(id=>C.isRecruited(g,id)&&!C.inCompany(g,id));
  const who=r.seatOffer[0];if(!who){delete r.seatOffer;S.save(session);return false;}
  const done=msg=>{r.seatOffer.shift();if(!r.seatOffer.length)delete r.seatOffer;S.save(session);if(msg)toast(msg);render();};
  if(C.seat(g,who)){done(C.charName(who)+' rides with you.');return true;}
  const name=C.charName(who),box=text('section','',panel,'menu');text('h1','The company is full',box);
  text('p',name+' wants to ride, but only '+(C.MAX_COMPANY+1)+' can. Who stays at the inn?',box);
  const list=text('div','',box,'buttons seat-list');
  for(const id of C.companyIds(g))button('Send '+C.charName(id)+' back — '+name+' rides',()=>{C.replaceCompany(g,id,who);done(name+' rides. '+C.charName(id)+' waits at the inn.');},list);
  button('Leave '+name+' at the inn',()=>done(name+' waits at the inn.'),list);
  return true;
}
// Each chapter opens on its title over the departure scene, like the original's
// chapter plates (gate_cinema.js). Shown once per chapter per save.
function chapterCard(){
  const r=session.record,first=S.beats(session)[0];if(first)showScene(first);playMusic(first);
  const box=text('section','',panel,'menu chapter-card');text('div','Chapter '+r.chapter,box,'chapter-number');text('h1',session.game.quest.quest.name,box);
  const go=button('Continue',()=>{r.titleCards=[...(r.titleCards||[]),r.chapter];S.save(session);render();},box);go.hidden=true;setTimeout(()=>{go.hidden=false;},1800);
}
$('sound').onclick=()=>{setMuted(!muted);if(muted){stopVoice();music?.pause();}else{const beat=reply||session&&S.beats(session)[0];playMusic(beat);if(session?.record.hiroChoice)render();else if(beat)say(beat);}};
$('home').onclick=()=>{companionUI.stop();stopVoice();battleFrame?.remove();battleFrame=null;session=null;reply=null;title();};
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==battleFrame?.contentWindow||event.data?.type!=='expeditions-story-battle')return;
  battleFrame.remove();battleFrame=null;setMuted(storedMute());backdrop.pause(false);open(S.load());
});
function battle(){
  stopVoice();music?.pause();backdrop.pause(true);S.save(session);panel.replaceChildren();
  battleFrame=document.createElement('iframe');battleFrame.title='Campaign battle';battleFrame.src='docs/STORY_FIGHT_PREVIEW.html?muted='+(muted?'1':'0');
  battleFrame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;background:#070a12;z-index:6';document.body.append(battleFrame);
}
function open(record){session=S.open(record);window.storyPreview=session;reply=session.record.reply||null;line=session.record.line||0;applied=null;sceneContext=null;playMusic();render();}
function showScene(beat){
  const spec=P.scene(session,beat,sceneContext);if(!spec)return null;
  const changed=JSON.stringify(spec)!==JSON.stringify(sceneContext);sceneContext=spec;
  backdrop.show(spec);
  const art=d.art[spec.kind]?.[spec.id];if(!art)return null;
  const bg=document.querySelector('.backdrop');bg.style.backgroundImage='url("'+url(art.file)+'")';
  bg.dataset.location=spec.id;bg.dataset.kind=spec.kind;
  bg.classList.toggle('story-still',spec.kind==='stills');
  $('weather').hidden=spec.kind==='stills'||!!art.indoor;
  return changed?url(art.file):null;
}
// Like the original's withScene, a new painting shows on its own first: the
// box waits until the image has loaded and then a beat more.
function holdForScene(box,file,then){
  box.classList.add('scene-hold');
  const reveal=()=>setTimeout(()=>{if(!box.isConnected)return;box.classList.remove('scene-hold');then();},1200);
  const img=new Image();img.onload=img.onerror=reveal;img.src=file;
}
function flash(){const f=text('div','',document.body,'story-flash');setTimeout(()=>f.remove(),900);}
function title(){stopVoice();session=null;reply=null;sceneContext=null;playMusic();const bg=document.querySelector('.backdrop');bg.style.backgroundImage='url("'+url(d.art.environments.lanternhold.file)+'")';bg.dataset.location='lanternhold';bg.dataset.kind='environments';bg.classList.remove('story-still');$('weather').hidden=false;panel.replaceChildren();const box=text('section','',panel,'menu');text('h1','ADVENTURER',box);text('h1','',box).innerHTML='<small>EXPEDITIONS</small>';
  backdrop.pause(false);backdrop.show({kind:'environments',id:'lanternhold',phase:'night'});
  const buttons=text('div','',box,'buttons');if(S.load())button('Continue story',()=>open(S.load()),buttons);
  button('Begin story',()=>{if(S.load()){panel.replaceChildren();text('p','Start over from chapter one? This replaces your current save.',panel);button('Start over',()=>open(S.fresh()));button('Cancel',title);}else open(S.fresh());},buttons);
  text('p',PLAYABLE_THROUGH===1?'Demo: chapter one of the story. More chapters are on the way.':'Chapters 1–'+PLAYABLE_THROUGH+' are playable.',box,'notice');
  passwordBox(box);
  if(devTools()){
    const row=text('div','',box,'buttons dev-skip');text('span','Dev: jump to chapter',row);
    for(let n=2;n<=PLAYABLE_THROUGH;n++)button(String(n),()=>{try{open(devSkipTo(n));}catch(e){console.error(e);alert('Chapter jump failed: '+e.message);}},row);
  }
}
// Dev-only chapter jump for playtesting (Hiro, 2026-10-14). Local server and a
// dev build only: the site package turns DEV_BUILD off and is never localhost.
// The skipped chapters' story runs instantly with the first ordinary answer to
// each choice, so flags, recruits and the company are real; their fights count
// as won. Replaces the current save.
// "Have a password?" for the locked chapters. A match is remembered on this
// browser and the page reloads with the chapters open.
function passwordBox(parent){
  if(UNLOCK_THROUGH<=DEMO_THROUGH||unlocked())return;
  const form=document.createElement('form');form.className='board-entry unlock';
  const input=document.createElement('input');input.type='password';input.placeholder='Have a password?';input.setAttribute('aria-label','Password for more chapters');
  const go=document.createElement('button');go.textContent='Unlock';form.append(input,go);parent.append(form);
  const note=text('p','',parent,'caption unlock-note');
  form.onsubmit=async e=>{e.preventDefault();
    try{const bytes=new TextEncoder().encode(input.value.trim().toLowerCase());
      const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==UNLOCK_HASH){note.textContent="That's not it.";input.select();return;}
      localStorage.setItem(UNLOCK_KEY,UNLOCK_HASH);note.textContent='Unlocked. Chapters '+(DEMO_THROUGH+1)+'–'+UNLOCK_THROUGH+' are open.';
      setTimeout(()=>location.reload(),700);
    }catch(_){note.textContent="Couldn't check that here. Try again on the website.";}
  };
}
function devTools(){return localHost&&!!ADV.Expedition.Dev?.enabled?.();}
function devSkipTo(target){
  const s=S.open(S.fresh()),r=s.record,g=s.game;
  for(let guard=0;guard<20000&&!(r.chapter===target&&r.phase==='departure');guard++){
    const perks=ADV.GatePerks?.state(g);if(perks?.pending.length)ADV.GatePerks.acknowledge(g,perks.pending.slice());
    delete r.chapterRewardDue;delete r.seatOffer;
    if(r.travelPending){S.finishTravel(s);continue;}
    if(r.phase==='inn'){S.leaveInn(s);continue;}
    if(r.phase==='combat'){S.victory(s,[]);continue;}
    const beat=r.reply||S.beats(s)[0];
    if(!beat){S.nextPhase(s);continue;}
    S.applyBeat(s,beat);
    const opts=beat.choice?S.options(s,beat.choice):[];
    const pick=opts.find(o=>!o.ask&&!o.bypass)||opts.find(o=>!o.ask)||opts[0];
    if(pick){if(!S.choose(s,beat,pick.id))S.shiftBeat(s);}
    else S.shiftBeat(s);
  }
  if(r.chapter!==target)throw Error('stopped at chapter '+r.chapter+' ('+r.phase+')');
  r.titleCards=Array.from({length:target-1},(_,i)=>i+1);r.tutorialFightStarted=true;
  if(r.run.hpMax)r.run.hp=r.run.hpMax;S.save(s);return r;
}
function render(){
  companionUI.stop();stopVoice();panel.replaceChildren();const r=session.record;
  if(companionUI.unlock())return;
  if(r.hiroChoice)return hiroChoice();
  // Cap the outbound leg before showing content from a locked website chapter.
  if(r.travelPending&&r.travelPending.chapter<=PLAYABLE_THROUGH)return travel();
  const perks=ADV.GatePerks?.state(session.game);
  if(perks?.pending.length){
    const notices=perks.pending.slice(),box=text('section','',panel,'menu');text('h1','Campaign gifts',box);
    for(const notice of notices){const skill=ADV.DATA.SKILLS[notice.id];text('h2',skill.name,box);text('p',ADV.GatePerks.description(session.game,notice.id),box);}
    button('Continue',()=>{ADV.GatePerks.acknowledge(session.game,notices);render();},box);return;
  }
  if(r.chapterRewardDue){const reward=r.chapterRewardDue,box=text('section','',panel,'menu');
    text('h1','Chapter complete',box);text('h2',reward.name,box);text('p','Score: '+(r.run.score||0)+' points. Your progress is saved.',box);
    button('Continue',()=>{delete r.chapterRewardDue;S.save(session);render();},box);return;
  }
  if(r.phase==='complete')return ending();
  if(r.phase==='inn')return inn();
  if(r.chapter>PLAYABLE_THROUGH&&(r.completed||[]).includes(PLAYABLE_THROUGH))return toBeContinued();
  if(r.phase==='combat'||r.phase==='defeat'){
    const box=text('section','',panel,'menu');text('h1','The road ahead',box);text('p',session.game.quest.quest.encounters[r.encounter]?.label||'Encounter',box,'speaker');
    if(S.Companions.enabled&&S.Companions.readiness(session).length){
      const active=session;const note=text('p','Getting your companions ready…',box,'notice');
      S.Companions.ensure(active).then(()=>{if(session===active&&box.isConnected)render();}).catch(error=>{
        if(!box.isConnected)return;note.textContent=error.message;
        button('Try again',render,box);button('Back to title',title,box);
      });return;
    }
    if(!S.readiness(session).length){
      text('p',r.phase==='defeat'?'Your chapter progress is safe. Retry this fight with full health.':(S.Companions.enabled&&S.Companions.selected(session).length?'Ready to fight. '+names(S.Companions.selected(session))+' will fight beside Hiro.':'Ready to fight. Hiro battles alone.'),box,'notice');
      button(r.phase==='defeat'?'Retry fight':'Begin fight',()=>{if(r.phase==='defeat')S.retry(session);battle();},box);button('Back to title',title,box);return;
    }
    text('p','This fight is not ready to play. The campaign needs its own approved full-body enemies and finishers before combat can open. Your dialogue choices have been saved.',box,'notice');
    text('p','Pending: '+S.readiness(session).join(', '),box,'notice error');button('Back to title',title,box);return;
  }
  if(r.seatOffer?.length&&!reply&&applied===null&&seatMenu())return;
  if(S.Companions.enabled&&r.chapter>=2&&(r.companionPickerDue||(r.phase==='departure'&&r.companionPickedChapter!==r.chapter))&&companionUI.picker())return;
  if(r.phase==='departure'&&!reply&&applied===null&&line===0&&!(r.titleCards||[]).includes(r.chapter))return chapterCard();
  let beat=reply||S.beats(session)[0];
  if(!beat){S.nextPhase(session);return render();}
  const identity=r.chapter+':'+r.encounter+':'+r.phase+':'+beat.who+':'+beat.key;
  if(applied!==identity){const before=company();S.applyBeat(session,beat);applied=identity;noteSeats(before);if(r.companionUnlocksPending?.length)return render();}
  const sceneFile=showScene(beat);playMusic(beat);
  const box=text('section','',panel);box.id='dialogue';text('div',ADV.DATA.CAMPAIGN_CHARS[beat.who]?.name||beat.who,box,'speaker');
  const portrait=portraits.portraits[P.portrait(beat)];
  if(portrait&&sceneContext?.kind!=='stills'){const img=document.createElement('img');img.className='speaker-portrait';img.alt='';img.width=portrait.width;img.height=portrait.height;img.src='assets/expedition/story/portraits/'+portrait.file;box.append(img);}
  const caption=beat.death?beat.caption||ADV.DATA.STORY_DEATH_CAPTIONS?.gate||DEATH_CAPTION:beat.caption;
  if(caption)text('div',caption,box,'caption');
  const rows=beat.lines||C.lines('gate',beat.who,beat.key);line=Math.min(line,Math.max(0,rows.length-1));
  const raw=rows[line]?.t||beat.promptText||'';
  const target=beat.to&&beat.to!=='player'?ADV.DATA.CAMPAIGN_CHARS[beat.to]?.name||'':session.hero.name;
  text('p',raw.replace(/\[[^\]]+\]/g,'').replaceAll('{target}',target).trim(),box,'speech');
  const choices=text('div','',box,'choices');
  if(line<rows.length-1)button('Continue',()=>{line++;r.line=line;S.save(session);render();},choices);
  else if(beat.choice){const opts=S.options(session,beat.choice);for(const o of opts)button(o.text,()=>chooseWithVoice(beat,o),choices);if(!opts.length)button('Continue',advance,choices);}
  else button('Continue',advance,choices);
  if(lineFile(beat))button('Replay line',()=>replay(beat),choices).classList.add('replay');
  const chosenFile=reply&&hiroChoiceFile(r.lastHiroChoice);
  if(chosenFile)button('Replay Hiro',()=>{stopVoice();if(muted)return;voice=new Audio(url(chosenFile));voice.volume=.9;voice.play().catch(()=>{});},choices).classList.add('replay');
  // A death keeps the original's red flash and short hold before the story moves on.
  function advance(){if(beat.death&&!reply){choices.querySelectorAll('button').forEach(b=>b.disabled=true);flash();setTimeout(step,600);}else step();}
  function step(){if(!box.isConnected)return;if(reply)reply=null;S.shiftBeat(session);line=0;applied=null;render();}
  if(sceneFile)holdForScene(box,sceneFile,()=>say(beat));else say(beat);
}
function travel(){
  const activeSession=session,spec=S.travelSpec(session);if(!spec){S.finishTravel(session);render();return;}
  sceneContext=null;$('weather').hidden=true;playMusic();backdrop.pause(false);
  // Leave the entire painting visible; the title/sound controls remain usable.
  const note=text('div',spec.leg==='return'?'Returning to the inn':'On the road',panel,'travel-caption');
  note.style.cssText='position:fixed;bottom:max(18px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);color:#fff;text-shadow:0 2px 4px #000;pointer-events:none';
  const id=spec.id;
  backdrop.show({...spec,onComplete:()=>{
    if(session!==activeSession||S.travelSpec(session)?.id!==id)return;
    S.finishTravel(session);render();
  }});
}
function inn(){
  const X=ADV.Expedition,r=session.record,run=r.run;
  sceneContext=null;backdrop.pause(false);
  // Reuse the five existing inn paintings and their registered candle/steam/fire
  // loops. Each chapter return counts as one visit; reloading keeps its painting.
  backdrop.show({kind:'inn',id:'inn',visit:r.chapter,run:{...run,cycles:{story:r.completed.length}}});
  document.querySelector('.backdrop').style.backgroundImage='url("assets/expedition/inn/inn-hiro-solo.webp")';
  $('weather').hidden=true;playMusic();
  const box=text('section','',panel,'menu inn-menu');box.id='story-inn';
  text('h1','The inn',box);text('p','Next: Chapter '+r.chapter+' — '+session.game.quest.quest.name,box,'inn-next');
  const hp=run.hp??run.hpMax;const stats=text('p','Health: '+(hp==null?'full':hp+' / '+run.hpMax)+' · Score: '+(run.score||0)+' points',box);stats.id='inn-stats';
  const actions=text('div','',box,'buttons'),can=X.Encounter.canRest(run),cost=X.restCost(run);
  const rest=button(X.Encounter.atFullHp(run)?'Rest — full health':'Rest to heal — '+cost.toLocaleString()+' points',()=>{
    const result=S.rest(session);if(result.ok)render();
  },actions);rest.id='story-rest';rest.disabled=!can.ok;
  if(S.Companions.enabled&&S.Companions.eligible(session).length)button('Choose who fights with you',()=>companionUI.picker(),actions).id='story-party';
  button('Continue story',()=>{
    const leave=()=>{if(S.leaveInn(session))render();};
    if(S.Companions.enabled&&r.companionPickedChapter!==r.chapter&&companionUI.picker(leave))return;leave();
  },actions).id='story-embark';
  text('p',can.reason==='score'?'You need '+cost.toLocaleString()+' points to rest. You can continue with your current health; a lost fight can be retried at full health.':can.reason==='full'?'You are fully healed and ready to travel.':'Rest restores all health. The point cost doubles each time.',box,'notice');
  if(r.restScenePending){
    backdrop.pause(true);X.Bathhouse.open({onClose:()=>{S.finishRest(session);backdrop.pause(false);render();}});
  }
}
function toBeContinued(){
  stopVoice();const r=session.record,X=ADV.Expedition,score=r.run.score||0,box=text('section','',panel,'menu demo-end');
  text('h1','Chapter '+(PLAYABLE_THROUGH+1)+' is coming soon',box);
  text('p',"That's as far as the story goes for now. Your save picks up right here when the next chapter lands.",box,'notice');
  text('h2','Score: '+score+' points',box);
  const board=text('div','',box,'story-board');
  const list=()=>{board.replaceChildren();X.Board.load().forEach((row,i)=>text('div',(i+1)+'. '+row.name+' — '+row.score,board,'board-row'));};
  if(!r.boardEntered&&score>0&&X.Board.qualifies(score)){
    const form=document.createElement('form');form.className='board-entry';box.insertBefore(form,board);
    const name=document.createElement('input');name.maxLength=16;name.placeholder='Your name';name.setAttribute('aria-label','Your name');form.append(name);
    const save=document.createElement('button');save.textContent='Save score';form.append(save);
    form.onsubmit=e=>{e.preventDefault();const n=name.value.trim().slice(0,16)||'Hiro';X.Board.insert({name:n,score,loop:1});r.boardEntered=true;S.save(session);form.remove();list();};
  }
  list();if(X.board.note)text('p',X.board.note,box,'caption');
  passwordBox(box);
  const buttons=text('div','',box,'buttons');button('Back to title',title,buttons);
}
function ending(){
  const end=P.ending(session),box=text('section','',panel);box.id='epilogue';
  backdrop.show({kind:'stills',id:end.art});
  const art=d.art.stills[end.art];if(art){const bg=document.querySelector('.backdrop');bg.style.backgroundImage='url("'+url(art.file)+'")';bg.classList.add('story-still');$('weather').hidden=true;}
  playMusic();text('h1',end.title,box);text('p',end.line,box,'caption');
  const scroll=text('div','',box,'ending-scroll'),rows=end.paragraphs.map(p=>text('p',p,scroll));
  const controls=text('div','',box,'buttons');let at=-1,active=false;
  const read=button('Read aloud',()=>{if(active){active=false;stopVoice();read.textContent='Read aloud';return;}setMuted(false);playMusic();active=true;at=-1;next();},controls);
  function next(){stopVoice();if(!active||!box.isConnected||muted)return;const row=end.narration[++at];rows.forEach(p=>p.classList.remove('reading'));if(!row){active=false;read.textContent='Read again';return;}
    const el=rows[row.paragraph];if(el){el.classList.add('reading');el.scrollIntoView({block:'nearest'});}read.textContent='Stop narration';voice=new Audio(url(row.file));voice.onended=next;voice.onerror=next;voice.play().catch(()=>{active=false;read.textContent='Read aloud';});}
  button('Continue',endCard,controls);
  button('Back to title',title,controls);
}
// A separate closing card follows the authored ending; it never replaces the
// player's final choice, the epilogue, or its narration.
function endCard(){
  stopVoice();panel.replaceChildren();sceneContext=null;backdrop.pause(false);
  backdrop.show({kind:'inn',id:'inn',visit:15,run:{...session.record.run,cycles:{story:14}}});
  const box=text('section','',panel,'menu');box.id='story-thanks';
  text('h1','Thanks for playing!',box);
  text('p','Thank you for taking Hiro all the way to the end. I hope you enjoyed the journey.',box,'speech');
  text('p','There are more games and books to explore at Neverending Narratives. If you can, a donation helps keep the site running and pays for the next game.',box,'speech');
  text('p','Stay tuned for the next adventure. — Hiro Protagonist',box,'caption');
  const links=text('div','',box,'buttons');
  for(const [label,section]of [['More games','games'],['Explore the books','read'],['Support the next game','fund']]){
    const a=document.createElement('a');a.textContent=label;a.href='https://neverendingnarratives.com/#'+section;a.target='_blank';a.rel='noopener noreferrer';
    a.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 20px;color:#ebcf8f;border:1px solid #a28859;border-radius:5px;background:#172033e8';links.append(a);
  }
  button('Read the ending again',()=>{panel.replaceChildren();ending();},box);button('Back to title',title,box);
}
// Separate animated atmosphere on the reused panorama, never in front of UI.
const canvas=$('weather'),ctx=canvas.getContext('2d');let w=0,h=0;
function draw(t){if(w!==innerWidth||h!==innerHeight){w=canvas.width=innerWidth;h=canvas.height=innerHeight;}ctx.clearRect(0,0,w,h);
  if(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(let i=0;i<24;i++){const x=(i*143+t*.009)%(w+70)-35,y=h*(.1+(i%7)*.09)+Math.sin(t/2400+i)*12;ctx.fillStyle='rgba(236,217,150,'+(.08+.1*(1+Math.sin(t/1300+i))/2)+')';ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<3;i++){const x=((t*.009+i*w*.42)%(w*1.6))-w*.3,y=h*(.15+i*.055);const g=ctx.createRadialGradient(x,y,1,x,y,w*.23);g.addColorStop(0,'rgba(145,168,195,.045)');g.addColorStop(1,'rgba(145,168,195,0)');ctx.fillStyle=g;ctx.fillRect(x-w*.3,y-h*.15,w*.6,h*.3);}
  }requestAnimationFrame(draw);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();music?.pause();}else if(!muted&&session)playMusic(reply||S.beats(session)[0]);});
requestAnimationFrame(draw);title();
})().catch(e=>{document.getElementById('panel').textContent='Preview could not load: '+e.message;console.error(e);});
