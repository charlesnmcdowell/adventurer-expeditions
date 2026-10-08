'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync(require('path').join(__dirname,'../js/expedition/enemy_finishers.js'),'utf8');
for(const target of ['website','crazygames','poki',undefined]) {
 const state=new Map([['expeditions.enemyFinishers.v1','1']]);
 const ADV={Release:{target},Expedition:{}};
 vm.runInNewContext(code,{ADV,localStorage:{getItem:k=>state.get(k),setItem:(k,v)=>state.set(k,v)}});
 const f=ADV.Expedition.EnemyFinishers,local=target==='website';
 assert.equal(f.enabled(),local);assert.equal(f.setEnabled(true),local);
 const queued=[];const scene={textures:{exists:()=>false},cache:{json:{exists:()=>false}},load:{multiatlas:(...a)=>queued.push(a),json:(...a)=>queued.push(a)}};
 f.preload(scene,['alpha']);assert.equal(queued.length,local?2:0);
 if(local)assert.notEqual(queued[0][0],queued[1][0],'multiatlas and metadata must use distinct keys on a cold load');
 scene.textures.exists=()=>true;scene.cache.json.get=()=>({});
 const hero=scene.hero={uid:'hero',alive:true,unit:{chp:0}},foe={uid:'alpha',side:'b',alive:true,sheet:{actor:'alpha'}};
 const hit={t:'damage',uid:'hero',by:'alpha',tag:'hit'};
 assert.equal(!!f.canPlay(scene,foe,hero,[hit]),local);
 for(const actor of ['wolf','plant','serpent','beetle','moss_giant','hag','goblin','spider','orc']) {
  foe.sheet.actor=actor;assert.equal(!!f.canPlay(scene,foe,hero,[hit]),local,actor);
  const before=queued.length;f.preload(scene,[actor,actor,'unknown']);
  // Texture exists already; only missing JSON is queued, once per actor.
  assert.equal(queued.length-before,local?1:0);
 }
 foe.sheet.actor='unknown';assert.equal(!!f.canPlay(scene,foe,hero,[hit]),false);
 foe.sheet.actor='alpha';
 scene.textures.exists=()=>false;assert.equal(!!f.canPlay(scene,foe,hero,[hit]),false);scene.textures.exists=()=>true;
 assert.equal(!!f.canPlay(scene,foe,hero,[{...hit,tag:'dot'}]),local);
 scene.actors=new Map([['hero',hero],['alpha',foe]]);
 assert.equal(f.defeatKiller(scene,null,hero,[])===foe,local);
 assert.equal(f.defeatKiller(scene,{...foe,alive:false},hero,[{...hit,tag:'dot'}])===foe,local);
 hero.unit.chp=1;assert.equal(!!f.canPlay(scene,foe,hero,[hit]),false);hero.unit.chp=0;
 hero.unit.maxHp=100;
 for(const hp of [31,30,29]) {hero.unit.chp=hp;assert.equal(!!f.canPlay(scene,foe,hero,[hit]),local&&hp<=30);}
 assert.equal(!!f.canPlay(scene,foe,hero,[{...hit,tag:'dot'}]),false);
 assert.equal(!!f.canPlay(scene,foe,hero,[]),false);
 f.setEnabled(false);assert.equal(!!f.canPlay(scene,foe,hero,[hit]),false);
}
console.log('enemy_finishers: preference, fail-closed profiles, 30% direct hits, fatal DOT and fallback attacker pass');
