"use strict";
const fs=require('fs'),assert=require('node:assert/strict');
const d=JSON.parse(fs.readFileSync('assets/expedition/story_femi/story_femi.json','utf8'));
const anchors=[82.5,84.5,81.5,83],floor=[309,309,309,306];
const xs=[],ys=[];
for(let i=0;i<4;i++){
 const name='idle/'+i,f=d.frames[name],s=f.spriteSourceSize;
 xs.push(s.x+anchors[i]);ys.push(s.y+floor[i]);
 const packed=d.textures.flatMap(t=>t.frames).find(f=>f.filename===name);
 assert.deepEqual(packed.spriteSourceSize,s,'Phaser and review registration must agree');
}
assert(Math.max(...xs)-Math.min(...xs)<=1,'idle feet must not jump horizontally');
assert(ys.every(y=>y===d.canvas.pivot.y),'idle feet must stay on ground');
assert.deepEqual(d.clips.idle.frameDurationsMs,[180,180,180,180]);
console.log('PASS: Femi idle boot registration, packed metadata and original timing');
