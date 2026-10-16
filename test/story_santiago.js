'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const A=require('./harness').load();
const before=JSON.parse(JSON.stringify(A.DATA.CAMPAIGN3_DIALOGUE));
const choices=JSON.stringify(A.DATA.CAMPAIGN3_CHOICES),script=JSON.stringify(A.DATA.CAMPAIGN3_SCRIPT);
A.Expedition={Story:{}};
// Isolate the original Santiago pass; the later batch has its own full test.
vm.runInThisContext(fs.readFileSync('js/expedition/story_dialogue.js','utf8').split('// Companion dialogue production: 2026-10-16')[0]);
vm.runInThisContext(fs.readFileSync('js/expedition/story_presentation.js','utf8'));
const S=A.Expedition.Story,P=S.Presentation,newLines=A.DATA.CAMPAIGN3_DIALOGUE.gate.cassian;
const edits=JSON.parse(fs.readFileSync('docs/SANTIAGO_DIALOGUE_REVIEW_20261016/changes.json'));
const voice=JSON.parse(fs.readFileSync('assets/expedition/story/santiago-voice.json'));
const tags=t=>t.match(/\[[^\]]*\]/g)||[],vars=t=>t.match(/\{[^}]*\}/g)||[];
assert.equal(voice.voiceId,'xHLnsxqUy4cc16VOmSD4');
assert.equal(edits.length,29);assert.equal(voice.files.length,29);
assert.deepEqual(Object.keys(newLines).sort(),Object.keys(before.gate.cassian).sort());
for(const e of edits){
 const original=before.gate.cassian[e.key][e.index-1].t,after=newLines[e.key][e.index-1].t;
 assert.equal(original,e.text);assert.equal(after,e.after);assert.notEqual(after,original);
 assert.deepEqual(vars(after),vars(original));assert.deepEqual(tags(after),tags(original));
 assert.equal(newLines[e.key].length,before.gate.cassian[e.key].length);
 const file=P.voice({who:'cassian',key:e.key},e.index-1),row=voice.files.find(r=>r.id===e.id);
 assert.equal(file,row.file);assert.equal(row.text,after);
 const bytes=fs.readFileSync('assets/expedition/story/media/'+file);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);
 if(e.key==='banter')assert(after.replace(/\[[^\]]*\]/g,'').trim().split(/\s+/).length<12);
 assert(!/what I am for|It is my duty|I exist to|As a paladin/i.test(after));
}
// Sliced combat barks carry their original audio index.
assert.equal(P.voice({who:'cassian',key:'banter',lines:[newLines.banter[2]],voOffset:2},0),voice.files.find(r=>r.id==='banter_3').file);
assert.equal(JSON.stringify(A.DATA.CAMPAIGN3_CHOICES),choices);
assert.equal(JSON.stringify(A.DATA.CAMPAIGN3_SCRIPT),script);
for(const [id,rows] of Object.entries(before.gate))if(id!=='cassian')assert.deepEqual(A.DATA.CAMPAIGN3_DIALOGUE.gate[id],rows);
assert.equal(P.voice({who:'wren_ward',key:'q2_cassian_hiwot'},0),'audio/vo/campaign/wren_ward/q2_cassian_hiwot_1.mp3');
for(const file of ['tools/story_preview.template.html','tools/story_fight.template.html','docs/STORY_CAMPAIGN_PREVIEW.html','docs/STORY_FIGHT_PREVIEW.html']){
 const html=fs.readFileSync(file,'utf8');assert(html.includes('js/expedition/story_dialogue.js'),file+' loads overrides');
}
console.log('Santiago: 29 edits/recordings, exact tags/variables/IDs, banter offsets, other speakers and story hooks preserved.');
