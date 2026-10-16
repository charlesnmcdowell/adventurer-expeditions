'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const H=require('./harness'),A=H.load();global.localStorage=H.memBackend();
for(const f of ['data','shim','encounter','campaign','run','story','story_companions'])vm.runInThisContext(fs.readFileSync('js/expedition/'+f+'.js','utf8'),{filename:f});
const S=A.Expedition.Story,C=A.Campaign3,script=JSON.stringify(A.DATA.CAMPAIGN3_SCRIPT),choices=JSON.stringify(A.DATA.CAMPAIGN3_CHOICES);
const source=fs.readFileSync('js/expedition/story_dialogue.js','utf8').split('// Companion dialogue production: 2026-10-16');
vm.runInThisContext(source[0]);const before=JSON.parse(JSON.stringify(A.DATA.CAMPAIGN3_DIALOGUE.gate));
vm.runInThisContext(source[1]);vm.runInThisContext(fs.readFileSync('js/expedition/story_presentation.js','utf8'));
const rows=JSON.parse(fs.readFileSync('assets/expedition/story/companion-voice.json')).files,bank=A.DATA.CAMPAIGN3_DIALOGUE.gate;
const cast=JSON.parse(fs.readFileSync('../adventurer/tools/voice_casting.json')),media=new Set(JSON.parse(fs.readFileSync('assets/expedition/story/preview-media.json')));
assert.equal(rows.length,156);assert.equal(new Set(rows.map(r=>r.id)).size,156);
assert.equal(rows.filter(r=>r.kind==='rewrite').length,41);assert.equal(rows.filter(r=>r.kind==='gap').length,70);
const vars=t=>t.match(/\{[^}]*\}/g)||[],tags=t=>t.match(/\[[^\]]*\]/g)||[];
for(const r of rows){
 const line=bank[r.who][r.key][r.index-1];assert.equal(line.t,r.text);assert.equal(r.voiceId,cast[r.who]);
 assert.equal(S.Presentation.voice({who:r.who,key:r.key},r.index-1),r.file);assert(media.has(r.file));
 assert.equal(S.Presentation.voice({who:r.who,key:r.key,lines:[line],voOffset:r.index-1},0),r.file);
 const hash=crypto.createHash('sha256').update(fs.readFileSync('assets/expedition/story/media/'+r.file)).digest('hex');assert.equal(hash,r.sha256);
 assert(!/[\u2018\u2019]/.test(r.text));assert(vars(r.text).every(v=>v==='{target}'));assert(!/[{}]/.test(r.spokenText));
 if(r.before){
  assert.equal(before[r.who][r.key][r.index-1].t,r.before);assert.deepEqual(vars(r.text),vars(r.before));assert.deepEqual(tags(r.text),tags(r.before));
  const {t,voiceFile,...meta}=line,{t:oldText,...oldMeta}=before[r.who][r.key][r.index-1];assert.deepEqual(meta,oldMeta);
  const old='audio/vo/campaign/'+r.who+'/'+r.key+'_'+r.index+'.mp3';assert(!media.has(old));assert(fs.existsSync('assets/expedition/story/media/'+old));
 }
 if(r.audition){const original=fs.readFileSync('docs/COMPANION_DIALOGUE_REVIEW_20261016/audio/'+r.id+'.mp3');assert.equal(crypto.createHash('sha256').update(original).digest('hex'),hash);}
}
for(const [who,groups] of Object.entries(before))for(const [key,segments] of Object.entries(groups))segments.forEach((r,i)=>{
 if(!rows.some(e=>e.who===who&&e.key===key&&e.index===i+1))assert.deepEqual(bank[who][key][i],r,'unchanged '+who+'/'+key+'/'+i);
});
for(const who of new Set(rows.map(r=>r.who))){
 assert.equal(bank[who].banter.length,6);
 for(const line of bank[who].banter){const t=line.t.replace(/\[[^\]]*\]/g,'').trim();assert(t.length<80,who+': '+t);assert(t.split(/\s+/).length<=12,who+': '+t);}
}
for(const segments of Object.values(bank.wren_ward))for(const line of segments){
 const t=line.t.replace(/\b(?:Olamide|Tesfaye|Morrak)'s\b/g,'');
 assert(!/\b(?:\w+n't|\w+'(?:re|ve|ll|d|m)|it’s|it's|that's|there's|he's|she's|what's)\b/i.test(t),'Hiwot contraction '+t);
}
for(const r of rows.filter(r=>r.kind==='gap')){
 const n=Number(r.key.match(/^q(\d+)/)[1]),s=S.open(),state=C.state(s.game),moment=S.CompanionDialogue.moments[n];
 s.record.chapter=n;s.record.phase=moment[0];s.record.encounter=moment[1];S.syncQuest(s);
 state.recruited=[r.who];state.company=[r.who];
 const first=S.beats(s),gap=first.find(b=>b.key===r.key);assert(gap,r.id+' attached');assert.equal(gap.lines.length,1);
 assert.deepEqual(S.beats(S.open(S.load())),first,'resume keeps queue');
 // A party change after queue preparation still suppresses the aside.
 for(const field of ['dead','gone']){state[field]=[r.who];assert(!S.beats(s).some(b=>b.key===r.key),field);state[field]=[];s.record.queue=null;}
 state.company=[];assert(!S.beats(s).some(b=>b.key===r.key),'benched');
 state.company=[r.who];state.recruited=[];s.record.queue=null;assert(!S.beats(s).some(b=>b.key===r.key),'unrecruited');
 s.record.queue=[];state.recruited=[r.who];assert.deepEqual(S.beats(s),[],'consumed queue stays consumed');
 s.record.queue=null;s.record.encounter=moment[1]+1;assert(!S.CompanionDialogue.asides(s,[]).length,'wrong encounter');
}
// Existing saves in a rewritten segment keep their cursor and hooks but receive
// matching text/audio together; unchanged segments are byte-for-byte preserved.
const edit=rows.find(r=>r.kind==='rewrite'),r=S.fresh();r.line=edit.index-1;r.queue=[{who:edit.who,key:edit.key,lines:before[edit.who][edit.key],choice:'sentinel'}];
const restored=S.open(r).record;assert.equal(restored.line,r.line);assert.equal(restored.queue[0].choice,'sentinel');assert.equal(restored.queue[0].lines[edit.index-1].voiceFile,edit.file);
// Real companion actor IDs feed the original contextual/no-repeat bark selector.
const s=S.open();s.record.chapter=2;S.syncQuest(s);C.state(s.game).recruited=['vess'];C.state(s.game).company=['vess'];
const ally=S.Companions.make(s,'vess');assert.equal(ally.campaignId,'vess');
const seen=new Set();for(let i=0;i<6;i++){
 const st={round:2,units:[{side:'a',ch:ally},{side:'b',statuses:[{kind:'burn'}]}]};const b=C.banter(s.game,st,2);assert(b);assert(!seen.has(b.id));seen.add(b.id);
 assert(media.has(S.Presentation.voice({...b,lines:[b.line]},0)));assert.equal(C.banter(s.game,st,2),null,'once per fight');
}
assert.equal(C.banter(s.game,{round:2,units:[{side:'a',ch:ally,downed:true}]},2),null);
assert.equal(S.Companions.enabled,false,'dialogue pass does not enable staged combat roster');
assert.equal(JSON.stringify(A.DATA.CAMPAIGN3_SCRIPT),script);assert.equal(JSON.stringify(A.DATA.CAMPAIGN3_CHOICES),choices);
const ledger=JSON.parse(fs.readFileSync('docs/COMPANION_DIALOGUE_REVIEW_20261016/production-ledger.json'));
for(const r of rows){const paid=ledger.requests.find(p=>p.id===r.id);assert.equal(paid.text,r.spokenText);assert.equal(paid.voiceId,r.voiceId);assert.equal(paid.state,'saved');}
assert.equal(ledger.requests.length,156);assert(ledger.requests.reduce((n,r)=>n+Math.max(r.characters,Number(r.chargedCharacters||0)),0)<=15000);
console.log('Companion dialogue: 156 matched voices, casting/cap, 70 guarded asides, metadata/plot preserved, six contextual barks, saved cursors passed.');
