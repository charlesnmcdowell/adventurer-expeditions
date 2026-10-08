// Visual regression against the local dev server (default :8742).
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const b=await require('playwright').chromium.launch({channel:'chrome',headless:true});
 const p=await b.newPage({viewport:{width:1280,height:760}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try {
 await p.goto((process.env.EXPEDITION_TEST_URL || 'http://127.0.0.1:8742')+'/index.html?fresh=1&renderer=canvas&revision=layers-test');
 await p.waitForFunction(()=>window.__game?.scene.getScene('Expedition')?.hero);
 await p.evaluate(()=>{const s=__game.scene.getScene('Expedition');s.fight=async function(first){await this.intro(first);this.__layerReady=true;};ADV.Expedition.fx.cinematics=false;});
 const report=[];fs.mkdirSync('test/reports/battle-layers',{recursive:true});
 for(const [q,w] of [['rain',0],['rain',1],['rain',2],['marsh',0],['city',0]]){
 await p.evaluate(([q,w])=>{const X=ADV.Expedition,s=__game.scene.getScene('Expedition'),r=X.Run.fresh();r.questId=q;r.wave=w;r.phase='quest';r.tutorial.skipGuide=true;s.__layerReady=false;X.Dev.go(s,'Expedition',{run:r,seed:9});},[q,w]);
 await p.waitForFunction(()=>__game.scene.getScene('Expedition').__layerReady);
 const start=await p.evaluate(()=>{const s=__game.scene.getScene('Expedition');return s.env.layers.map(l=>({x:l.x,y:l.y,key:l.texture.key}));});
 await p.waitForTimeout(1000);
 const end=await p.evaluate(()=>__game.scene.getScene('Expedition').env.layers.map(l=>({x:l.x,y:l.y,key:l.texture.key})));
 assert.equal(start.length,3);assert.equal(start[1].x,end[1].x);assert.equal(start[1].y,end[1].y);assert.notEqual(start[0].x,end[0].x);assert.notEqual(start[2].x,end[2].x);
 await p.screenshot({path:`test/reports/battle-layers/${q}-${w}.png`});report.push({q,w,layers:end});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('test/reports/battle-layers/results.json',JSON.stringify(report,null,2));console.log('five battle stages: three layers, moving far/near, fixed ground, no page errors');
 } finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
