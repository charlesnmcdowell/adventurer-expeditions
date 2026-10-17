'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const roster=read('docs/IDLE_ROSTER_REVIEW.json');
const specs=read('tools/idle_roster_registration.json').actors;
const root='assets/expedition';
const actual=fs.readdirSync(root).flatMap(id=>{
 const p=path.join(root,id,id+'.json');if(!fs.existsSync(p))return[];
 const d=read(p);return d.clips?.idle?[id]:[];
});
assert.deepEqual(roster.map(r=>r.id).sort(),actual.sort(),'review covers every runtime idle set');
assert.equal(roster.filter(r=>r.id.startsWith('companion_')).length,15);
for(const r of roster){
 const d=read(path.join(root,r.id,r.id+'.json'));
 assert.deepEqual(r.times,d.clips.idle.frameDurationsMs);
 assert.deepEqual(r.frames.map(f=>f.name),d.clips.idle.frames);
 for(const f of r.frames){
  assert.deepEqual(f.after,d.frames[f.name].spriteSourceSize,r.id+' review must match runtime');
  const g=specs[r.id]?.frames.find(x=>x.frame===f.name);
  if(g){
   assert(Math.abs(f.after.x+g.anchorX-specs[r.id].targetX)<=0.5,r.id+' horizontal anchor');
   assert.equal(f.after.y+g.anchorY,specs[r.id].targetY,r.id+' ground anchor');
  }
 }
}
console.log('PASS: entire idle roster coverage, reviewed frame placements, timings and companion coverage');
