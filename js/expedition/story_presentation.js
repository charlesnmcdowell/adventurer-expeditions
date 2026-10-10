// Edition presentation of the original campaign. Text and recordings stay authored.
(function(){
'use strict';
const A=ADV,S=A.Expedition.Story,C=A.Campaign3;
const P=S.Presentation={};
P.configure=d=>{P.data=d;};
P.media=path=>'assets/expedition/story/media/'+path;
P.portrait=function(beat){
  if(beat.who==='korvath'&&beat.key?.startsWith('q1_'))return 'korvath_helmet';
  if(beat.who==='amara'&&beat.key?.startsWith('q11_'))return 'amara_docks';
  return beat.who;
};
P.voice=function(beat,line){
  const rows=beat.lines||C.lines('gate',beat.who,beat.key),row=rows[line];
  if(!row)return null;
  return 'audio/vo/campaign/'+beat.who+'/'+beat.key+'_'+(row.vo||(beat.voOffset||0)+line+1)+'.mp3';
};
P.annotate=function(session,beats){
  const d=P.data,r=session.record,m=d.presentation;
  let location=r.phase==='departure'?m.departures[r.chapter]:r.phase==='arrival'?m.arrivals[r.chapter]:
    r.phase==='closing'?d.routes[r.chapter].at(-1):d.routes[r.chapter][r.encounter];
  let phase=r.chapter===1?'night':null;
  return beats.map(b=>{location=b.artLocation||m.changes[b.key]||location;phase=b.artPhase||m.phases[b.key]||phase;
    return {...b,artLocation:location,artPhase:phase};});
};
P.scene=function(session,beat,context){
  const d=P.data,k=beat.key||'',n=Number((k.match(/^q(\d+)_/)||[])[1]);
  if(beat.artPrison||(context?.prison&&/^q10_(?:letter|end)/.test(k)))return{kind:'environments',id:'catacombs',phase:'night',prison:true};
  let id=null;
  if(k==='q1_death')id='death';
  else if(k==='q14_final_taken')id='hiwot_sacrifice';
  else if(k==='q14_final_soul')id='hiwot_bound';
  else if(n===2&&/notice|bounty/.test(k))id='bounty';
  else if(k.startsWith('q4_dream'))id='dream_1';
  else if(k.startsWith('q7_dream'))id='dream_2';
  else if(k.startsWith('q10_dream'))id='dream_3';
  else if(n===7&&/valve|flood/.test(k))id=beat.who==='selene'?'valve_scene':null;
  else if(k.startsWith('q10_letter'))id='letter';
  else if(k==='q12_reveal'||k.startsWith('q12_face_'))id='reveal';
  else if(k==='q12_teleport')id='frost';
  else if(n===14&&/altar|plea/.test(k))id=C.inCompany(session.game,'amara')||C.flag(session.game,'amaraPassed')?'altar_amara':'altar';
  if(id&&d.art.stills[id])return{kind:'stills',id};
  if(!beat.artLocation&&context)return context;
  id=beat.artLocation||d.routes[n]?.[session.record.encounter];
  return id&&d.art.environments[id]?{kind:'environments',id,phase:beat.artPhase||context?.phase||'day'}:null;
};
P.music=function(session,combat=false,beat=null){
  const n=session.record.chapter,m=P.data.music;
  if(!combat&&session.record.phase==='complete')return m.ending;
  if(!combat&&beat?.dream)return m.dream;
  return combat?(n===14?m.boss:m.combatByQuest?.[n]||m.combat[n>=m.cityFrom?'city':'road']):m.quest[n];
};
P.ending=function(session){
  const state=C.state(session.game),id=state.ending,heading=P.data.endings[id]||{title:'The End',line:''};
  const paragraphs=C.endCardParagraphs(session.game),vo=P.data.epilogueVoice;
  const keys=new Map(vo.entries.map(row=>[row.text,row.key]));
  const text=[heading.title+'. '+heading.line,...paragraphs];
  return {...heading,paragraphs,art:({hero:'ending_hero',monster:'ending_vengeance',usurper:'ending_usurper',mercy:'ending_mercy',ascetic:'ending_empty',restored:'ending_hero',ascended:'ending_usurper'})[id],
    narration:text.map((t,i)=>({text:t,paragraph:i-1,file:keys.has(t)?'audio/vo/campaign/'+vo.speaker+'/'+keys.get(t)+'_1.mp3':null})).filter(row=>row.file)};
};
})();
