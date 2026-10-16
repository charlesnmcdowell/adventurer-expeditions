'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const A=require('./harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const S=A.Expedition.Story,P=S.Companions;
const atlas=id=>JSON.parse(fs.readFileSync('assets/expedition/companion_'+id+'/companion_'+id+'.json'));
for(const id of Object.keys(P.kits)){
 const doc=atlas(id);P.register(id,doc);
 for(const clip of Object.values(doc.clips)){
  assert.equal(clip.frames.length,16);assert.equal(new Set(clip.frames).size,16);
  assert(clip.frames.every(f=>doc.frames[f]));
  assert(clip.contact.every(i=>i>=0&&i<16));assert(clip.release>=0&&clip.release<16);
 }
 for(const t of doc.textures)assert(fs.existsSync('assets/expedition/companion_'+id+'/'+t.image));
}
(async()=>{
 const s=S.open();s.record.chapter=2;S.syncQuest(s);for(const id of ['wren_ward','vess'])A.Campaign3.recruit(s.game,id);P.select(s,['wren_ward','vess']);
 P.bindings={};P.enabled=true;let requests=0,fail=true;
 global.fetch=async url=>{requests++;if(fail)return {ok:false};return {ok:true,json:async()=>atlas(/companion_([a-z_]+)\//.exec(url)[1])};};
 await assert.rejects(P.ensure(s),/could not load/);fail=false;requests=0;
 await Promise.all([P.ensure(s),P.ensure(s)]);assert.equal(requests,2,'one manifest request per selected companion');
 assert.deepEqual(P.readiness(s),[]);await P.ensure(s);assert.equal(requests,2,'ready manifests reused');
 console.log('15 companion atlases: 1,920 registered frames; selected loading, retry and deduplication passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
