// Story-only companion controls. Recruitment/seat ownership remains Campaign3's.
(function(){
'use strict';const A=ADV,S=A.Expedition.Story,C=A.Campaign3,P=S.Companions;
S.CompanionUI=function({panel,portraits,muted,render,getSession,duckMusic=()=>{}}){
 const el=(tag,parent,value)=>{const n=document.createElement(tag);if(value)n.textContent=value;parent.append(n);return n;};
 const button=(parent,label,action)=>{const b=el('button',parent,label);b.type='button';b.onclick=action;return b;};
 function portrait(parent,id){const p=portraits.portraits[id];if(p){const img=el('img',parent);img.src='assets/expedition/story/portraits/'+p.file;img.alt='';img.width=110;img.height=140;} }
 const hooks={wren_ward:'I can pick locks and keep watch while you sleep.',vess:"Stay close, {target}. I'll keep the fire off you.",fennick:'He talks. I do the rest.',cassian:'Give me a moment to tighten this strap. All right. Stay behind my shield.',dorran:'Come in. Come in out of the road.',selene:"Beau, get the shields. We're going to Dunmere.",ithrel:'You are going towards him. I would go with you. I ask nothing else.',bramm:'Where you go, we go, and anyone who says otherwise answers to Fındık.',ysolde:'Thank you. I would kneel, but the bars have made it difficult.',aurelius:'Kindly disregard the large gentleman; his enthusiasms are exhausting.',ilvara:'I have not found the light kinder, ya stranger. Only brighter.',faelen:'My bow, until your road ends.',nettle:'I would sooner hear you first. So. Speak.',durnik:'I know every valve in it — including the one at the bottom that lets the river in.',amara:'Stay behind me at the stairs.'};
 // Names stay on one line: shrink a name that overflows its space, step by step (Hiro, 2026-10-17).
 const fitName=n=>{if(!n)return;requestAnimationFrame(()=>{let size=parseFloat(getComputedStyle(n).fontSize)||32;for(let i=0;i<30&&n.scrollWidth>n.clientWidth+1&&size>16;i++){size-=2;n.style.fontSize=size+'px';}});};
 const style=(box,id)=>{box.dataset.companionStyle=id;box.style.setProperty('--entry-side',Object.keys(P.kits).indexOf(id)%2?'110%':'-110%');};
 let sound=null,timer=null;
 function stopAudio(){if(sound){sound.pause();sound=null;}duckMusic(false);}
 function stop(){clearTimeout(timer);timer=null;stopAudio();}
 function unlock(){
  const s=getSession(),id=s&&P.pendingUnlock(s);if(!P.enabled||!id)return false;
  stop();const box=el('section',panel);box.id='companion-unlocked';box.className='companion-unlock';style(box,id);
  box.setAttribute('aria-label',C.charName(id)+' joins you');portrait(box,id);
  const details=el('div',box);details.className='companion-welcome';el('p',details,'Joined your company').className='join-label';
  const nameEl=el('h1',details,C.charName(id));nameEl.className='companion-name';fitName(nameEl);
  el('p',details,hooks[id].replaceAll('{target}',s.hero.name)).className='join-hook';
  el('p',details,P.kits[id].weapon).className='join-weapon';
  if(!muted()){sound=new Audio('assets/expedition/story/companion-unlocked.mp3');sound.volume=.32;duckMusic(true);sound.onended=()=>duckMusic(false);sound.play().catch(()=>duckMusic(false));}
  let accepted=false;
  const finish=()=>{if(accepted||getSession()!==s||!box.isConnected)return;accepted=true;P.claimUnlock(s,id);s.record.companionPickerDue=true;S.save(s);box.classList.add('leaving');
   timer=setTimeout(()=>{stop();render();},matchMedia('(prefers-reduced-motion:reduce)').matches?80:240);};
  const accept=button(details,'Accept',finish);accept.className='join-accept';accept.focus({preventScroll:true});return true;
 }
 function loadArt(next){
  const s=getSession(),ids=P.eligible(s);if(ids.every(id=>P.bindings[id]?.ready))return false;
  panel.replaceChildren();const box=el('section',panel);box.className='companion-picker';el('p',box,'Getting your company ready…');
  P.ensure(s,ids).then(()=>{if(getSession()===s&&box.isConnected)next();}).catch(error=>{if(!box.isConnected)return;el('p',box,error.message);button(box,'Try again',next);});return true;
 }
 function confirm(){
  const s=getSession();if(!P.enabled||s.record.chapter<2)return false;
  if(loadArt(confirm))return true;
  panel.replaceChildren();const box=el('section',panel);box.id='companion-confirm';box.className='companion-picker';
  const selected=P.selected(s),recommended=P.isRecommended(s,selected);
  const head=el('h1',box,'Your party for this chapter');if(recommended&&selected.length)el('span',head,'Recommended').className='recommended-tag';
  if(recommended&&selected.length)el('p',box,'Your newest companions, so you get to know everyone. Change them any time.').className='recommended-note';
  const list=el('div',box);list.className='party-confirm-list';
  const hiro=el('article',list);hiro.className='party-member';
  const hi=el('img',hiro);hi.src='assets/expedition/hiro/hiro-portrait.webp';hi.alt='Hiro';
  el('strong',hiro,'Hiro');el('p',hiro,'Katana');el('p',hiro,'Counter Attack · Iaido Draw');
  for(const id of selected){const card=el('article',list);card.className='party-member';style(card,id);portrait(card,id);{const n=el('strong',card,C.charName(id));n.className='companion-name';fitName(n);}el('p',card,P.kits[id].weapon);el('p',card,P.kits[id].skills.map(k=>A.DATA.SKILLS[k]?.name||k).join(' · '));}
  if(selected.length<2)el('p',box,selected.length?'There is room for one more.':'Hiro is fighting alone. You can bring up to two companions.');
  const actions=el('div',box);actions.className='buttons';button(actions,'Change',()=>picker(confirm)).disabled=!P.eligible(s).length;
  button(actions,'Set out',()=>{P.select(s,selected,{explicit:s.record.companionSelectionExplicit===true});delete s.record.companionPickerDue;s.record.companionPickedChapter=s.record.chapter;S.save(s);render();});return true;
 }
 function picker(done=render){
  const s=getSession(),ids=P.eligible(s);if(!P.enabled||!ids.length)return false;
  if(loadArt(()=>picker(done)))return true;
  panel.replaceChildren();const box=el('section',panel);box.id='companion-picker';box.className='companion-picker';
  el('h1',box,'Choose who fights with you');el('p',box,'Pick up to two. Everyone else stays with the company.');
  let picked=P.selected(s).slice(),swap=0;const slots=el('div',box),list=el('div',box);slots.className='companion-slots';list.className='companion-list';
  const buttons=new Map(),suggested=P.recommended(s);
  function draw(){
   slots.replaceChildren();for(let i=0;i<2;i++){const b=button(slots,picked[i]?C.charName(picked[i]):'Empty slot',()=>{swap=i;draw();});b.setAttribute('aria-pressed',String(swap===i));}
   for(const [id,b]of buttons){b.setAttribute('aria-pressed',String(picked.includes(id)));b.querySelector('.pick-state').textContent=picked.includes(id)?'Selected':'Choose';}
  }
  for(const id of ids){const kit=P.kits[id],b=button(list,'',()=>{
   if(picked.includes(id))picked=picked.filter(v=>v!==id);
   else if(picked.length<2)picked.push(id);else{picked[swap]=id;swap=1-swap;}
   draw();
  });b.dataset.companion=id;portrait(b,id);el('strong',b,C.charName(id));el('span',b,kit.weapon);
   for(const skill of kit.skills)el('span',b,A.DATA.SKILLS[skill]?.name||skill);
   if(suggested.includes(id))el('span',b,'Recommended').className='recommended-tag';
   el('span',b,'').className='pick-state';buttons.set(id,b);
  }
  draw();const actions=el('div',box);actions.className='buttons';
  function finish(selection){P.select(s,selection);S.save(s);done();}
  button(actions,'Ready',()=>finish(picked));button(actions,'Keep current team',()=>finish(P.selected(s)));
  if(suggested.length)button(actions,'Recommended party',()=>finish(suggested));
  button(actions,'Fight alone',()=>finish([]));return true;
 }
 return {unlock,picker,confirm,stop,stopAudio};
};
})();
