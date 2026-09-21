// Atlas closure and the size-jump regression reported in the playable preview.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const counts={hiro:175,bram:96,wolf:38,boar:20,plant:17,alpha:45};
for(const [id,count] of Object.entries(counts)){
  const dir=path.join(root,'assets/expedition',id);
  const m=JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8'));
  const all=new Map();
  for(const t of m.textures){
    assert(t.size.w<=2048&&t.size.h<=4096,id+' exceeds mobile texture cap');
    assert(fs.statSync(path.join(dir,t.image)).size>0,'missing atlas page '+t.image);
    for(const f of t.frames){
      assert(!all.has(f.filename),'duplicate '+f.filename);all.set(f.filename,f);
      assert(f.frame.x>=0&&f.frame.y>=0&&f.frame.x+f.frame.w<=t.size.w&&f.frame.y+f.frame.h<=t.size.h,'out-of-bounds '+f.filename);
      assert.equal(f.sourceSize.w,m.canvas.w);assert.equal(f.sourceSize.h,m.canvas.h);
    }
  }
  assert.equal(all.size,count,id+' incomplete painted frame set');
  for(const [name,c] of Object.entries(m.clips)){
    assert(c.frames.every(f=>all.has(f)),id+'/'+name+' missing frame');
    assert.equal(c.frameDurationsMs.length,c.frames.length);
    assert.equal(c.durationMs,c.frameDurationsMs.reduce((a,b)=>a+b,0));
    assert(c.frameDurationsMs.every(v=>v>0));
    assert(c.release>=0&&c.release<c.frames.length);
    assert(c.contact.every(n=>n>=0&&n<c.frames.length));
    if(c.paired)assert(c.opponentKinds.length>0,'unrestricted paired identity '+name);
  }
  if(id==='hiro'||id==='bram'){
    const idle=all.get('idle/0').frame.h,hit=m.clips[id==='hiro'?'hit-short':'hit_short'];
    for(const f of hit.frames){
      const ratio=all.get(f).frame.h/idle;
      // The middle recoil drawing bends at the knees; do not inflate it to
      // match standing height. The final guard pose must return at full scale.
      assert(ratio>=.70&&ratio<=1.10,id+' hit grows/shrinks: '+ratio);
    }
    assert(all.get(hit.frames.at(-1)).frame.h/idle>=.90,id+' recovery is undersized');
    // The pivot is authored ground, not the bottom of a canvas that may contain
    // below-ground overshoot. Renderer must use metadata instead of originY=1.
    assert(m.canvas.pivot.y<m.canvas.h);
  }
  if(id==='hiro'){
    const required={walk:16,'idle-sheathed':4,'wolf-cleave-paired':12,
      'wolf-pin-paired':6,'wolf-rising-cut-paired':6,'plant-stem-cut-paired':8,
      'plant-vine-pin-paired':6,'plant-crosscut-paired':6};
    for(const [name,n] of Object.entries(required)){
      const c=m.clips[name];assert(c,'missing approved v2 clip '+name);assert.equal(c.frames.length,n,name);
      if(c.paired){
        assert.deepEqual(c.opponentKinds,[name.startsWith('wolf-')?'wolf':'plant']);
        assert.deepEqual(c.opponentKeys,[name.startsWith('wolf-')?'dire_wolf':'thorn_lurker']);
        assert(c.contact.includes(c.primaryImpactFrame),'missing sole logical impact '+name);
        assert(c.victimFullyGoneFrame<=c.release,'victim must disappear before release '+name);
        assert(c.pairTargetDistanceRatio>.5&&c.pairTargetDistanceRatio<1.5,'implausible paired staging distance');
      }
    }
    for(const old of ['finisher-l1-paired','finisher-l2-paired','finisher-l3-paired'])assert(!m.clips[old],'obsolete victim art '+old);
    const retained={idle:4,draw:8,'short-draw':4,'slash-l1':6,'slash-l2':6,'slash-l3':6,
      roll:6,'victory-sheath':8,kneel:4,'aura-l1':4,'aura-l2':4,'aura-l3':4,
      'bite-leg-paired':10,'bite-arm-paired':10,intercept:6,riposte:6,'hit-short':3,'counter-l2':6,'counter-l3':6};
    assert.deepEqual(Object.keys(m.clips).sort(),Object.keys({...retained,...required}).sort(),'delta must retain every unaffected v1 clip');
    for(const [name,n] of Object.entries(retained))assert.equal(m.clips[name].frames.length,n,'lost approved v1 poses: '+name);
    assert.deepEqual(m.clips['wolf-cleave-paired'].sources,['wolf-overhead-v4-a.png','wolf-overhead-v4-b.png']);
    assert.equal(m.clips['wolf-cleave-paired'].primaryImpactFrame,3);
    assert.equal(m.clips['wolf-cleave-paired'].victimFullyGoneFrame,5);
    assert.equal(m.clips['wolf-cleave-paired'].finalState,'drawn-idle');
    assert.deepEqual(m.clips.walk.sources,['samurai-run-v4-a.png','samurai-run-v4-b.png']);
    assert.deepEqual(m.clips.walk.contact,[],'footsteps must not become combat hits');
    assert(m.clips['idle-sheathed'].loop);
    const walk=m.clips.walk.sourceRegistration;
    assert.equal(walk.referenceHeights.length,16);
    assert(walk.referenceHeights.every(v=>v===480),'run must use a constant anatomical scale');
    assert.deepEqual(walk.maskedFrames,[6,7],'overlapping run cells need authored masks');
    const overhead=m.clips['wolf-cleave-paired'].sourceRegistration;
    assert(overhead.referenceHeights.slice(0,6).every(v=>v===358));
    assert(overhead.referenceHeights.slice(6).every(v=>v===391),'twirl must keep body calibration');
    assert.deepEqual(overhead.authoredAlphaFrames,[6,7,8,9,10,11],'twirl must keep original alpha');
  }
  if(id==='alpha'){
    const required={idle:4,'approach-leap':6,attack:6,hit:3,enrage:3,down:3,
      'hiro-alpha-cleave-paired':8,'hiro-alpha-pin-paired':6,'hiro-alpha-parry-paired':6};
    for(const [name,n] of Object.entries(required)){
      const c=m.clips[name];assert(c,'missing Alpha clip '+name);assert.equal(c.frames.length,n,name);
      if(c.paired){
        assert.deepEqual(c.opponentKinds,['wolf','boss']);
        assert.deepEqual(c.opponentKeys,['road_wolf_leader']);
        assert(c.contact.includes(3),'missing Alpha impact '+name);
        assert(c.victimFullyGoneFrame<=c.release,'Alpha victim must disappear before release '+name);
      }
    }
    assert.equal(m.standing,360,'Alpha atlas standing height changed');
  }
  console.log('registered '+id+': '+count+' frames');
}
console.log('art_registration: 6 complete atlases, size-jump and frame contracts pass');
