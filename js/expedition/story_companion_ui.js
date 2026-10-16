// Story-only companion controls. Recruitment/seat ownership remains Campaign3's.
(function(){
'use strict';const A=ADV,S=A.Expedition.Story,C=A.Campaign3,P=S.Companions;
S.CompanionUI=function({panel,portraits,muted,render,getSession}){
 const el=(tag,parent,value)=>{const n=document.createElement(tag);if(value)n.textContent=value;parent.append(n);return n;};
 const button=(parent,label,action)=>{const b=el('button',parent,label);b.type='button';b.onclick=action;return b;};
 function portrait(parent,id){const p=portraits.portraits[id];if(p){const img=el('img',parent);img.src='assets/expedition/story/portraits/'+p.file;img.alt='';img.width=110;img.height=140;} }
 let sound=null,timer=null;
 function stop(){clearTimeout(timer);timer=null;if(sound){sound.pause();sound=null;}}
 function unlock(){
  const s=getSession();if(!P.enabled||!s?.record.companionUnlocksPending?.length)return false;
  stop();const id=P.claimUnlock(s),box=el('section',panel);box.id='companion-unlocked';box.className='companion-unlock';
  box.setAttribute('aria-live','polite');portrait(box,id);el('h1',box,C.charName(id)+' joins you');
  el('p',box,P.kits[id].weapon);
  if(!muted()){sound=new Audio('assets/expedition/story/companion-unlocked.mp3');sound.volume=.32;sound.play().catch(()=>{});}
  const finish=()=>{if(getSession()!==s||!box.isConnected)return;stop();render();};
  button(box,'Continue',finish);timer=setTimeout(finish,2400);return true;
 }
 function picker(done=render){
  const s=getSession(),ids=P.eligible(s);if(!P.enabled||!ids.length)return false;
  panel.replaceChildren();const box=el('section',panel);box.id='companion-picker';box.className='companion-picker';
  el('h1',box,'Choose who fights with you');el('p',box,'Pick up to two. Everyone else stays with the company.');
  let picked=P.selected(s).slice(),swap=0;const slots=el('div',box),list=el('div',box);slots.className='companion-slots';list.className='companion-list';
  const buttons=new Map();
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
   el('span',b,'').className='pick-state';buttons.set(id,b);
  }
  draw();const actions=el('div',box);actions.className='buttons';
  function finish(selection){P.select(s,selection);delete s.record.companionPickerDue;s.record.companionPickedChapter=s.record.chapter;S.save(s);done();}
  button(actions,'Ready',()=>finish(picked));button(actions,'Keep current team',()=>finish(P.selected(s)));
  button(actions,'Fight alone',()=>finish([]));return true;
 }
 return {unlock,picker,stop};
};
})();
