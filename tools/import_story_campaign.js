// Read-only source import. Never sync, evaluate runtime code, or write to Adventurer.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),SOURCE=path.resolve(ROOT,'../adventurer');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function collect(){
  const D={};for(const k of ['FACTIONS','GEAR_SETS','CAMPAIGN_CHARS','CAMPAIGN_ENEMIES','CAMPAIGN_MINIBOSSES','CAMPAIGN_QUESTS','SKILLS'])D[k]={};
  const A={DATA:D},ctx=vm.createContext({ADV:A});const provenance=[];
  const read=rel=>{const b=fs.readFileSync(path.join(SOURCE,rel));provenance.push({file:rel,sha256:sha(b)});return b.toString('utf8');};
  for(const f of ['campaign3_data','campaign3_dialogue','gate_finale','gate_epilogue_voice','campaign3_perks'])vm.runInContext(read('js/data/'+f+'.js'),ctx,{timeout:3000});
  vm.runInContext(read('js/ui/gate_manifest.js'),ctx,{timeout:3000});
  const artCode=read('js/ui/gate_art.js');
  for(const rel of ['js/core/campaign3.js','js/core/gate_finale.js','js/ui/campaign3_ui.js','js/ui/gate_cinema.js','js/ui/gate_finale.js'])read(rel);
  // Extract only literal route tables. Do not execute source rendering hooks.
  const literal=name=>{const m=artCode.match(new RegExp('const '+name+'=G\\.'+name+'=(\\{[\\s\\S]*?\\n\\});'));if(!m)throw Error('Missing route table '+name);return vm.runInNewContext('('+m[1]+')',{}, {timeout:1000});};
  const routes=literal('encounterRoutes'),journeys=literal('journeys');
  const cinema=fs.readFileSync(path.join(SOURCE,'js/ui/gate_cinema.js'),'utf8');
  const presentation={};
  for(const name of ['departures','arrivals','changes','phases']){
    const match=cinema.match(new RegExp('const '+name+'=(.+);'));
    if(!match)throw Error('Missing scene routing '+name);
    presentation[name]=vm.runInNewContext('('+match[1]+')',{}, {timeout:1000});
  }
  const art=A.GateManifest;
  art.environments.morrak_realm={file:'assets/anime/gate/v1/runtime/environment_morrak_realm.webp',width:1774,height:887,indoor:true};
  for(const id of ['hiwot_sacrifice','hiwot_bound'])art.stills[id]={file:'assets/anime/gate/v1/runtime/still_'+id+'.webp',width:1536,height:1024};
  const assets=new Map();
  function asset(rel,kind){rel=path.posix.normalize(rel);if(rel.startsWith('../')||path.isAbsolute(rel))throw Error('Unsafe source path '+rel);if(assets.has(rel))return;const f=path.join(SOURCE,rel),exists=fs.existsSync(f);assets.set(rel,{file:rel,kind,exists,...(exists?{bytes:fs.statSync(f).size,sha256:sha(fs.readFileSync(f))}:{})});}
  for(const [who,keys]of Object.entries(D.CAMPAIGN3_DIALOGUE.gate))for(const [key,lines]of Object.entries(keys))for(let i=0;i<lines.length;i++)asset('audio/vo/campaign/'+who+'/'+key+'_'+(lines[i].vo||i+1)+'.mp3','voice');
  const music=new Set();function strings(x){if(typeof x==='string')music.add(x);else if(x&&typeof x==='object')Object.values(x).forEach(strings);}strings(D.CAMPAIGN3_MUSIC);
  for(const id of music)asset('audio/music/'+id+'.mp3','music');
  for(const group of ['environments','panoramas','stills','ui'])for(const a of Object.values(art[group]))asset(a.file,group);
  for(const a of Object.values(art.parts))asset(path.posix.normalize('assets/anime/v2/runtime/'+a.file),'portrait-parts');
  const foes=new Map();function foe(id,kind,n,enc){const key=kind+':'+id;if(!foes.has(key)){const def=(kind==='mini'?D.CAMPAIGN_MINIBOSSES:kind==='named'?D.CAMPAIGN_CHARS:D.CAMPAIGN_ENEMIES)[id];if(!def)throw Error('Unknown enemy '+key);foes.set(key,{id,kind,name:def.name,definition:def,appearances:[],artStatus:'pending',hiroFinishersRequired:2,enemyFinishersRequired:1,humanoidFinisherMinDistinctFrames:16});}foes.get(key).appearances.push({chapter:n,encounter:enc});}
  function encounter(e,n,i){if(e.boss)foe(e.boss,'named',n,i);if(e.mini)foe(e.mini,'mini',n,i);for(const id of [...(e.types||[]),...(e.with||[])])foe(id,D.CAMPAIGN_CHARS[id]?'named':'enemy',n,i);for(const v of Object.values(e.variants||{}))encounter(v,n,i);}
  for(const q of D.CAMPAIGN3_QUESTS)q.enc.forEach((e,i)=>encounter(e,q.n,i));
  const result={schema:1,title:'Adventurer: Expeditions',campaignLabel:'Campaign',sourceLabel:'Original Adventurer campaign',
    rules:{hero:'hiro',companions:'dialogue-only',defeat:'retry-fight',keepChapterProgress:true,firstFightTutorial:true,humanoidGoreBothDirections:true,humanoidFinisherMinDistinctFrames:16,originalGameReadOnly:true},
    chapters:D.CAMPAIGN3_QUESTS,scripts:D.CAMPAIGN3_SCRIPT,choices:D.CAMPAIGN3_CHOICES,dialogue:D.CAMPAIGN3_DIALOGUE.gate,
    characters:D.CAMPAIGN_CHARS,enemies:D.CAMPAIGN_ENEMIES,minibosses:D.CAMPAIGN_MINIBOSSES,music:D.CAMPAIGN3_MUSIC,
    endings:D.CAMPAIGN3_ENDINGS,epilogue:D.CAMPAIGN3_EPILOGUE,epilogueVoice:D.GATE_EPILOGUE_VO,courtship:D.CAMPAIGN3_COURTSHIP,
    art,routes,journeys,presentation,combatRoster:[...foes.values()],assets:[...assets.values()],provenance};
  return JSON.parse(JSON.stringify(result));
}
function main(){
  const d=collect(),out=path.join(ROOT,'assets/expedition/story');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'campaign.json'),JSON.stringify(d));
  const count=k=>d.assets.filter(a=>a.kind===k),missing=count('voice').filter(a=>!a.exists);
  const rows=['# Story campaign import inventory','',
    'Development inventory, not a completed playable campaign. Generated by `node tools/import_story_campaign.js`. Original Adventurer is read-only; text and source identifiers are preserved. Player-facing campaign label is **Campaign**.', '',
    '## Confirmed direction','',
    '- Hiro fights alone; companions stay in dialogue and cutscenes.',
    '- Defeat retries the current fight and keeps completed chapter progress; separate save from Arcade.',
    '- Tutorial runs on the first actual fight, even if an earlier fight is bypassed peacefully.',
    '- Humanoid paired finishers: gore both directions; at least 16 distinct drawings each, not repeated frames.',
    '- Original dialogue, music and recordings are reused; missing audio is listed rather than silently re-recorded.', '',
    `## Source coverage`, '',
    `${d.chapters.length} chapters; ${d.chapters.reduce((n,q)=>n+q.enc.length,0)} authored encounter slots; ${d.combatRoster.length} opponent identities including alternate branches. ${Object.keys(d.characters).length} named story characters.`, '',
    `${count('voice').length} referenced dialogue clips: ${count('voice').filter(a=>a.exists).length} available locally, ${missing.length} absent locally. ${count('music').length} music tracks. ${d.assets.filter(a=>a.kind!=='voice'&&a.kind!=='music').length} reusable scene/portrait files.`, '',
    '## Chapters and combat art queue','', '| Chapter | Title | Encounters |', '|---|---|---:|',
    ...d.chapters.map(q=>`| ${q.n} | ${q.name} | ${q.enc.length} |`),'',
    '| Opponent | Source ID | Kind | Chapters | Art |','|---|---|---|---|---|',
    ...d.combatRoster.map(e=>`| ${e.name} | ${e.id} | ${e.kind} | ${[...new Set(e.appearances.map(a=>a.chapter))].join(', ')} | Needs full-body/paired-set verification |`),'',
    '## Asset readiness','',
    'Existing portrait cells are identity references, not finished animated combat sets. Do not substitute unrelated elves/monsters, inflate a portrait, or quietly skip an unavailable opponent. Named enemies who escape or can be spared must not play a lethal gore finisher before later dialogue.', '',
    'Original art supplies scenes, but each battle floor still needs side-view contact and three-plane validation. Keep the approved distance → animated weather/scenery → Hiro/contact-ground order. No foreground objects in front of Hiro.', '',
    '## Missing local voice files','',
    'These may be intentionally unvoiced or hosted externally. Verify source voice hashes/hosting before generating anything.', '',
    ...missing.map(a=>'- '+a.file),'',
    '## Implementation status','',
    '- Source data import and hash inventory: complete.',
    '- Separate campaign state/checkpoint adapter: implemented; reuses original Campaign3 and GateFinale rather than flattening choices.',
    '- Development title and original voiced prologue/choice preview: implemented at docs/STORY_CAMPAIGN_PREVIEW.html. Stops before unfinished combat.',
    '- Complete cutscene presentation, first-fight tutorial/combat integration and main-game title boot: pending.',
    '- Full-body enemies and minimum two Hiro/one enemy finisher per identity: pending.',
    '- Chapter balance, ending branches, supplemental encounters and full playthrough QA: pending.',
    '- Existing Arcade remains playable; this manifest does not enable unfinished campaign encounters.',''];
  fs.writeFileSync(path.join(ROOT,'docs/STORY_CAMPAIGN_INVENTORY.md'),rows.join('\n'));
  console.log(JSON.stringify({chapters:d.chapters.length,encounters:d.chapters.reduce((n,q)=>n+q.enc.length,0),opponentIdentities:d.combatRoster.length,voiceClips:count('voice').length,missingLocalVoices:missing.length,music:count('music').length,assets:d.assets.length}));
}
module.exports={collect};if(require.main===module)main();
