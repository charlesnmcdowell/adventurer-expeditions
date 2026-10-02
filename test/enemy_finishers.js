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
 scene.textures.exists=()=>true;scene.cache.json.get=()=>({});
 const hero=scene.hero={uid:'hero',alive:true,unit:{chp:0}},foe={uid:'alpha',side:'b',alive:true,sheet:{actor:'alpha'}};
 const hit={t:'damage',uid:'hero',by:'alpha',tag:'hit'};
 assert.equal(!!f.canPlay(scene,foe,hero,[hit]),local);
 assert.equal(!!f.canPlay(scene,foe,hero,[{...hit,tag:'dot'}]),false);
 hero.unit.chp=1;assert.equal(!!f.canPlay(scene,foe,hero,[hit]),false);hero.unit.chp=0;
 f.setEnabled(false);assert.equal(!!f.canPlay(scene,foe,hero,[hit]),false);
}
console.log('enemy_finishers: preference, fail-closed profiles, lethal-only and DOT exclusion pass');
