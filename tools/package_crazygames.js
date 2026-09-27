// Frozen allowlist export. Source, shared files and previous candidates stay intact.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),size=require('./size_check').report();
if(size.over||size.missing.length)throw Error('Ship manifest/size check failed');
const name=process.argv[2]||('crazygames-'+new Date().toISOString().replace(/[:.]/g,'-'));
if(!/^crazygames-[a-zA-Z0-9-]+$/.test(name))throw Error('Use a crazygames- name with letters, digits and hyphens');
const dest=path.join(ROOT,'dist',name);if(fs.existsSync(dest))throw Error('Candidate already exists; choose a new name');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// Freeze every source before writing anything. Refuse a concurrently changed tree.
const frozen=size.files.map(({rel})=>({rel,body:fs.readFileSync(path.join(ROOT,rel))}));
const replace=(rel,from,to)=>{const f=frozen.find(f=>f.rel===rel);if(!f||f.body.toString().split(from).length!==2)throw Error('Unexpected build policy: '+rel);f.body=Buffer.from(f.body.toString().replace(from,to));};
const sourceHashes=new Map(frozen.map(f=>[f.rel,sha(f.body)]));
replace('js/expedition/dev.js','Dev.DEV_BUILD = true;','Dev.DEV_BUILD = false;');
replace('js/core/release_config.js',"target: 'website'","target: 'crazygames'");
replace('index.html',"if (params.get('at') === 'inn')", "if (ADV.Expedition.Dev.DEV_BUILD && params.get('at') === 'inn')");
for(const f of frozen)if(sha(fs.readFileSync(path.join(ROOT,f.rel)))!==sourceHashes.get(f.rel))throw Error('Source changed during freeze: '+f.rel);
fs.mkdirSync(dest,{recursive:true});
for(const f of frozen){const p=path.join(dest,f.rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.body);if(sha(fs.readFileSync(p))!==sha(f.body))throw Error('Export verification failed: '+f.rel);}
const report={generatedAt:new Date().toISOString(),candidate:dest,totalBytes:frozen.reduce((n,f)=>n+f.body.length,0),files:frozen.map(f=>({path:f.rel,bytes:f.body.length,sha256:sha(f.body)})),policy:{target:'crazygames',developerTools:false},pending:['User art/pacing playtest approval','Uploaded CrazyGames preview and physical device QA','Platform content/quality acceptance']};
fs.writeFileSync(dest+'-manifest.json',JSON.stringify(report,null,2));
console.log('Verified '+frozen.length+' files -> '+dest+'\nUpload the contents directly, including index.html; the manifest stays outside the upload folder.');
