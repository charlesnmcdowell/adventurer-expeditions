'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../adventurer');
const d=JSON.parse(fs.readFileSync(path.join(root,'assets/expedition/story/campaign.json')));
const media=[];
for(const a of d.assets){
  if(!(a.kind==='voice'&&/\/q1_/.test(a.file)||['panorama_lanternhold.webp','environment_lanternhold.webp','vg_lanternhold.mp3'].some(n=>a.file.endsWith('/'+n))))continue;
  const input=path.join(source,a.file),output=path.join(root,'assets/expedition/story/media',a.file),bytes=fs.readFileSync(input);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('Source changed: '+a.file);
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes);media.push(a.file);
}
const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="[^"]+"><\/script>/g)].map(m=>m[0]).join('\n');
let html=fs.readFileSync(path.join(__dirname,'story_preview.template.html'),'utf8').replace('<!-- MODULES -->',scripts);
fs.writeFileSync(path.join(root,'docs/STORY_CAMPAIGN_PREVIEW.html'),html);
fs.writeFileSync(path.join(root,'assets/expedition/story/preview-media.json'),JSON.stringify(media,null,2));
console.log('Story preview: '+media.length+' existing media files reused; no new voice generation.');
