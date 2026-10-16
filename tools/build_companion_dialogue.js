'use strict';
// Rebuild the edition-only overrides from the approved, recorded production manifest.
const fs=require('node:fs');
const rows=JSON.parse(fs.readFileSync('assets/expedition/story/companion-voice.json')).files;
const file='js/expedition/story_dialogue.js',marker='// Companion dialogue production: 2026-10-16';
const base=fs.readFileSync(file,'utf8').split(marker)[0].trimEnd();
const entries=rows.slice().sort((a,b)=>a.who.localeCompare(b.who)||a.key.localeCompare(b.key)||a.index-b.index).map(r=>
 (r.kind==='gap'?' // new: gap\n':'')+' '+JSON.stringify({who:r.who,key:r.key,index:r.index,before:r.before,t:r.text,voiceFile:r.file,kind:r.kind}));
fs.writeFileSync(file,base+'\n\n'+marker+`
(function(){
'use strict';
const S=ADV.Expedition.Story,C=ADV.Campaign3;
const rows=[
${entries.join(',\n')}
];
for(const r of rows){
 const speaker=ADV.DATA.CAMPAIGN3_DIALOGUE.gate[r.who],bank=speaker[r.key]||(speaker[r.key]=[]),old=bank[r.index-1];
 if(r.kind==='rewrite'&&old?.t!==r.before)throw Error('Companion dialogue drift: '+r.who+'/'+r.key+'/'+r.index);
 if(r.kind!=='rewrite'&&(old||bank.length!==r.index-1))throw Error('Companion segment collision: '+r.who+'/'+r.key);
 bank[r.index-1]={...old,t:r.t,voiceFile:r.voiceFile};
}
const D=S.CompanionDialogue={rows};
// A single short aside per missing companion, at the actual location it names.
// Chapter 5 waits for the palisade; chapter 7 waits for the cages.
D.moments={3:['departure',0],4:['opener',0],5:['opener',2],6:['opener',0],7:['opener',1],8:['departure',0],9:['departure',0],10:['opener',0],11:['departure',0],12:['departure',0],13:['opener',0],14:['departure',0]};
D.asides=function(session,beats){
 const r=session.record,m=D.moments[r.chapter];
 if(!m||r.phase!==m[0]||r.encounter!==m[1])return beats;
 return beats.concat(rows.filter(x=>x.kind==='gap'&&x.key.startsWith('q'+r.chapter+'_')&&C.inCompany(session.game,x.who)).map(x=>({
  who:x.who,key:x.key,fid:'gate',c3:true,to:'company',companionGap:true,
  lines:C.lines('gate',x.who,x.key)
 })));
};
// Recheck after preceding choices; an already queued aside cannot resurrect a
// departed companion. Do not repopulate consumed queues on resume.
D.available=(session,beat)=>!beat.companionGap||C.inCompany(session.game,beat.who);
D.refreshSaved=function(record){
 for(const beat of [...(record.queue||[]),record.reply].filter(Boolean)){
  if(!beat.lines)continue;
  beat.lines=beat.lines.map((line,i)=>{
   const index=line.vo||(beat.voOffset||0)+i+1;
   const edit=rows.find(r=>r.who===beat.who&&r.key===beat.key&&r.index===index);
   return edit&&line.t===edit.before?{...line,t:edit.t,voiceFile:edit.voiceFile}:line;
  });
 }
};
})();
`);
console.log('Wrote '+rows.length+' edition dialogue segments.');
