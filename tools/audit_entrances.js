'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');process.chdir(root);
const A=require('../test/harness').load();
for(const n of ['data','shim','encounter','campaign','run','story','story_combat','story_companions'])vm.runInThisContext(fs.readFileSync('js/expedition/'+n+'.js','utf8'));
const X=A.Expedition;X.Painted={actors:[]};X.EnemyFinishers={registerActor(){}};
vm.runInThisContext(fs.readFileSync('js/expedition/story_art.js','utf8'));
const cast=JSON.parse(fs.readFileSync('../adventurer/tools/voice_casting.json','utf8'));
const rows=[];
for(const [identity,b]of Object.entries(X.Story.bindings)){
 const who=identity.split(':')[1],ch=A.DATA.CAMPAIGN_CHARS[who],mini=A.DATA.CAMPAIGN_MINIBOSSES?.[who];
 const appearances=[];
 const find=(e,n,i)=>{if(e.boss===who||e.mini===who||(e.types||[]).includes(who)||(e.with||[]).includes(who))appearances.push({chapter:n,encounter:i,label:e.label});for(const v of Object.values(e.variants||{}))find(v,n,i);};
 for(const q of A.DATA.CAMPAIGN3_QUESTS)q.enc.forEach((e,i)=>find(e,q.n,i));
 const doc=JSON.parse(fs.readFileSync('assets/expedition/'+b.actor+'/'+b.actor+'.json','utf8'));
 rows.push({identity,actor:b.actor,who,name:ch?.name||mini?.name||who,humanoid:!!b.humanoid,unique:!identity.startsWith('enemy:'),voiceId:cast[who]||null,appearances,clips:Object.fromEntries(Object.entries(doc.clips).filter(([k,v])=>!v.paired).map(([k,v])=>[k,{frames:v.frames.length,ms:v.durationMs}]))});
}
const dir='docs/ENTRANCE_REVIEW_20261019';fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'/inventory.json',JSON.stringify({story:rows,arcade:X.quests,companions:X.Story.Companions.kits},null,2));
console.log(rows.length+' story identities inventoried; '+rows.filter(r=>r.unique).length+' unique enemies.');
