'use strict';
// Shadow Rise / Smoke Bomb must never leave a living enemy invisible
// Outside the authored resurrection, living bodies remain drawn. During the
// grave emergence, that actor's visible grave is the required substitute cue.
// Afterward stealth keeps a visible body, smoke veil and "Invisible" tag.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT='test/reports/story-stealth';fs.mkdirSync(OUT,{recursive:true});
const ORIGIN=process.env.TEST_ORIGIN||'http://127.0.0.1:8742';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(ORIGIN+'/docs/STORY_CAMPAIGN_PREVIEW.html?through=14');
  await page.waitForFunction(()=>ADV.Expedition.Story.Presentation.data);
  await page.evaluate(()=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,{chapter:10,encounter:3,phase:'combat',completed:[1,2,3,4,5,6,7,8,9]});s.record.run.tutorial.skipGuide=true;S.syncQuest(s);S.save(s);});
  await page.goto(ORIGIN+'/docs/STORY_FIGHT_PREVIEW.html');
  await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.hero);
  await page.evaluate(()=>{const s=storyGame.scene.getScene('StoryBattle');s.fight=async function(first){await this.intro(first);this.__testReady=true;};s.scene.restart({record:s.story.record,seed:29,muted:true});ADV.Expedition.fx.cinematics=false;});
  await page.waitForFunction(()=>storyGame.scene.getScene('StoryBattle').__testReady);
  // 1. The engine's real order for Shadow Rise: down, then revive + stealth.
  const rise=await page.evaluate(async()=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');
    const a=[...s.actors.values()].find(x=>x.side==='b'&&(x.unit.ch.actives||[]).some(k=>k.skillId==='shadow_rise'));if(!a)throw Error('no Shadow Rise foe');
    const u=a.unit;u.chp=Math.round(u.maxHp*.05);u.downed=false;ADV.Combat.applyStealth(u,2);
    await X.Beats.ticksOnly(s,[{t:'damage',uid:u.uid,by:s.hero.uid,dmg:99},{t:'down',uid:u.uid,by:s.hero.uid},{t:'revive',uid:u.uid,by:u.uid,skillId:'shadow_rise'},{t:'stealth',uid:u.uid}]);await new Promise(r=>setTimeout(r,450));
    return{name:u.ch.name,alive:a.alive,visible:a.root.visible,imgAlpha:a.img.alpha,veil:!!a.veil&&a.veil.alpha>0,tag:a.badges.has('stealth')};});
  console.log('shadow rise',JSON.stringify(rise));
  assert(rise.alive&&rise.visible,'risen enemy stays on the field');assert(rise.imgAlpha>0.3,'body still drawn');
  assert(rise.veil,'veil of smoke');assert(rise.tag,'Invisible tag');
  await page.screenshot({path:OUT+'/shadow-rise.png'});
  // 2. Stealth ends: veil and tag clear, body back to full.
  const after=await page.evaluate(async()=>{const s=storyGame.scene.getScene('StoryBattle');const a=[...s.actors.values()].find(x=>x.veil);
    a.unit.stealth=false;a.unit.stealthRounds=0;a.unit.untargetable=0;a.refresh(true);await new Promise(r=>setTimeout(r,500));
    return{veil:!!a.veil,tag:a.badges.has('stealth'),imgAlpha:a.img.alpha};});
  assert(!after.veil&&!after.tag&&after.imgAlpha===1,'veil clears with stealth '+JSON.stringify(after));
  // 3. A body whose fall was already shown comes back when the engine revives it.
  const back=await page.evaluate(async()=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');
    const a=[...s.actors.values()].filter(x=>x.side==='b'&&x.alive)[1];await a.fadeOut();const u=a.unit;u.chp=5;u.downed=false;
    await X.Beats.ticksOnly(s,[{t:'revive',uid:u.uid,by:u.uid,skillId:'shadow_rise'}]);return{alive:a.alive,visible:a.root.visible,imgAlpha:a.img.alpha};});
  assert(back.alive&&back.visible&&back.imgAlpha===1,'faded body restored '+JSON.stringify(back));
  // 4. Real fights through chapter 10's shape-thieves: no living enemy is ever left undrawn.
  const real=[];
  for(const seed of [3,7,11]){real.push(await page.evaluate(async seed=>{const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle');
    X.turnPauseMs=()=>0;window.__rises=window.__rises||0;if(!X.Beats.__counted){X.Beats.__counted=true;const wrap=fn=>async function(sc,x){const evs=Array.isArray(x)?x:(x?.events||[]);window.__rises+=evs.filter(e=>e.t==='revive'&&sc.actors.get?.(e.uid)?.side!=='a').length;return fn.apply(this,arguments);};X.Beats.play=wrap(X.Beats.play);X.Beats.ticksOnly=wrap(X.Beats.ticksOnly);}const r0=window.__rises;delete s.fight;let introDone=false;const intro=s.intro;s.intro=async function(f){await intro.call(this,f);introDone=true;};
    s.scene.restart({record:s.story.record,seed,muted:true});
    return new Promise(res=>{const bad=[],rises=new Set(),t0=Date.now();const iv=setInterval(()=>{const sc=storyGame.scene.getScene('StoryBattle');const hu=sc.enc&&ADV.Expedition.Encounter.heroUnit(sc.enc);if(hu&&hu.chp>0)hu.chp=hu.maxHp;for(const fu of sc.enc?.st?.units||[])if(fu.side!==hu?.side&&fu.chp>3&&!fu.__lowered){fu.chp=3;fu.__lowered=true;}
      
      if(introDone&&!sc.ended)for(const a of sc.actors?.values()||[])if(a.side==='b'&&!a._destroyed&&a.unit.chp>0&&!a.unit.downed){
        const grave=sc.children.list.find(x=>x.name==='shadow_rise_grave'&&x.__riserUid===a.uid&&x.active&&x.visible&&x.alpha>.3);
        if(a.__rising&&grave){rises.add(a.uid);continue;}
        if(!a.alive||!a.root.visible||a.img.alpha<.3)bad.push(a.unit.ch.name);
      }
      if(sc.ended||sc.enc?.st?.over||Date.now()-t0>170000){clearInterval(iv);res({seed,round:sc.enc?.st?.round,rises:window.__rises-r0,bad:[...new Set(bad)],over:!!sc.enc?.st?.over});}},200);});},seed));
    console.log('real fight',JSON.stringify(real.at(-1)));}
  assert(real.every(r=>!r.bad.length),'a living enemy went invisible');assert(real.some(r=>r.rises>0),'at least one real Shadow Rise was seen');
  assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/verification.json',JSON.stringify({rise,after,back,real},null,2));
  console.log('story stealth: Shadow Rise stays visible, smoke veil and Invisible tag, faded bodies restored passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
