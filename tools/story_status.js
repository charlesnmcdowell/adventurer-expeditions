// Read-only runtime inventory; regenerate the campaign production checklist.
'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const d=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json'));
const X={Story:{bindings:{}},Painted:{actors:[]},monsterActors:[],enemies:{},EnemyFinishers:{registerActor(){}}};
vm.runInNewContext(fs.readFileSync('js/expedition/story_art.js','utf8'),{ADV:{Expedition:X}});
const rows=d.combatRoster.map(e=>{
 const id=e.kind+':'+e.id,b=X.Story.bindings[id],files=b&&[
  `assets/expedition/${b.actor}/${b.actor}.json`,
  `assets/expedition/adult/${b.actor}-fatal/${b.actor}-fatal.json`];
 const ready=b&&b.combatReady&&b.enemyFinisherReady&&b.hiroFinishersReady>=2&&files.every(f=>fs.existsSync(f));
 return {id,name:e.name,chapters:[...new Set(e.appearances.map(a=>a.chapter))],ready:!!ready,actor:b?.actor||'',reused:!!b?.reuse};
});
const ready=rows.filter(r=>r.ready).length;
const text=['# Campaign combat production status','',
 'Generated from the imported campaign inventory, runtime bindings and atlas file existence. A registered set still needs visual playtest; this is not a release certificate.','',
 `**${ready} of ${rows.length} opponent identities registered. ${rows.length-ready} remain.**`,
 '','| Enemy | First chapter | Runtime art | State |','| --- | ---: | --- | --- |',
 ...rows.map(r=>`| ${r.name} (${r.id}) | ${Math.min(...r.chapters)} | ${r.actor||'—'} | ${r.ready?(r.reused?'Registered reuse':'Registered'):'Pending'} |`),''].join('\n');
fs.writeFileSync('docs/STORY_CAMPAIGN_STATUS.md',text);
console.log(`${ready}/${rows.length} campaign identities registered`);
