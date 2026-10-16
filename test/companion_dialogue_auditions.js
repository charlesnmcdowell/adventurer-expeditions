'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir='docs/COMPANION_DIALOGUE_REVIEW_20261016/';
const rows=JSON.parse(fs.readFileSync(dir+'auditions.json'));
const cast=JSON.parse(fs.readFileSync('../adventurer/tools/voice_casting.json'));
const ledger=JSON.parse(fs.readFileSync(dir+'voice-ledger.json'));
assert.equal(rows.length,45);assert.equal(new Set(rows.map(r=>r.who)).size,15);
assert.equal(new Set(rows.map(r=>r.id)).size,45);
for(const r of rows){
 assert.equal(rows.filter(x=>x.who===r.who).length,3);
 assert.equal(r.voiceId,cast[r.who]);assert(/^\[[^\]]+\]/.test(r.text));
 assert(!/[\u2018\u2019]/.test(r.text),'curly apostrophe '+r.id);
 const variables=t=>t.match(/\{[^}]+\}/g)||[];
 assert(variables(r.text).every(v=>v==='{target}'));
 if(r.before)assert.deepEqual(variables(r.text),variables(r.before));
 assert(!/[{}]/.test(r.spokenText));
 const spoken=r.text.replace(/\[[^\]]*\]/g,'').trim();
 if(r.who==='wren_ward')assert(!/\b(?:\w+n't|\w+'(?:s|re|ve|ll|d|m))\b/i.test(spoken.replace(/\bOlamide's\b/g,'')),'Hiwot contraction '+r.id);
 if(r.key==='banter'){assert(spoken.length<80);assert(spoken.split(/\s+/).length<=12);}
 const audio=fs.readFileSync(dir+r.file);
 assert.equal(crypto.createHash('sha256').update(audio).digest('hex'),r.sha256);
 const paid=ledger.requests.find(x=>x.id===r.id);assert(paid);assert.equal(paid.voiceId,r.voiceId);assert.equal(paid.text,r.spokenText);
}
const reserved=ledger.requests.reduce((n,r)=>n+Math.max(r.characters,Number(r.chargedCharacters||0)),0);
assert(reserved<=15000);assert.equal(ledger.requests.length,45);
console.log('45 auditions: original casting, unique IDs, preserved placeholders, Hiwot register, bark lengths, audio hashes and credit cap passed.');
