'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../adventurer');
const d=JSON.parse(fs.readFileSync(path.join(root,'assets/expedition/story/campaign.json')));
const media=[];
for(const a of d.assets){
  const input=path.join(source,a.file),output=path.join(root,'assets/expedition/story/media',a.file),bytes=fs.readFileSync(input);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('Source changed: '+a.file);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  if(!fs.existsSync(output)||crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex')!==a.sha256)fs.writeFileSync(output,bytes);
  media.push(a.file);
}
const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="[^"]+"><\/script>/g)].map(m=>m[0]).join('\n');
// The story's own scripts carry the same release stamp, so a returning player
// never runs a cached copy against newer data (2026-10-11).
const stamp=(scripts.match(/js\/expedition\/[^"?]+\.js\?v=([\w-]+)/)||[])[1];
const stampStory=page=>stamp?page.replace(/src="((?:js\/expedition\/story[a-z_]*|docs\/story_preview)\.js)"/g,'src="$1?v='+stamp+'"'):page;
let html=fs.readFileSync(path.join(__dirname,'story_preview.template.html'),'utf8').replace('<!-- MODULES -->',scripts);
fs.writeFileSync(path.join(root,'docs/STORY_CAMPAIGN_PREVIEW.html'),stampStory(html));
fs.writeFileSync(path.join(root,'assets/expedition/story/preview-media.json'),JSON.stringify(media,null,2));
const fight=fs.readFileSync(path.join(__dirname,'story_fight.template.html'),'utf8').replace('<!-- MODULES -->',scripts);
fs.writeFileSync(path.join(root,'docs/STORY_FIGHT_PREVIEW.html'),stampStory(fight));
console.log('Story preview: '+media.length+' existing media files reused; no new voice generation.');
