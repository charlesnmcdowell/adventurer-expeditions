'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const all=JSON.parse(fs.readFileSync('assets/expedition/story/campaign.json')).combatRoster;
const bindingText=fs.readFileSync('js/expedition/story_art.js','utf8');
const roster=all.filter(r=>bindingText.includes("S.bindings['"+r.kind+':'+r.id+"']"));
const OUT='test/reports/all-chapter-art';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=process.argv.includes('--resume')?JSON.parse(fs.readFileSync(OUT+'/playback.json')):[];
try{
 for(const u of roster){
  if(results.some(r=>r.identity===u.kind+':'+u.id))continue;
  const identity=u.kind+':'+u.id,context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(90000);
  page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(r.failure().errorText+' '+r.url());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/docs/STORY_CAMPAIGN_PREVIEW.html');await page.waitForFunction(()=>window.ADV?.Expedition?.Story?.Presentation?.data);
  await page.evaluate(({at,id})=>{const S=ADV.Expedition.Story,s=S.open();Object.assign(s.record,at,{phase:'combat'});s.record.run.tutorial.skipGuide=true;if(id==='named:bramm')s.record.c3.flags.aurelius=true;if(id==='mini:umbral_pair')s.record.c3.flags.umbralBetrayed=true;S.syncQuest(s);S.save(s);},{at:u.appearances[0],id:identity});
  await page.route('**/docs/STORY_FIGHT_PREVIEW.html*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace('<script>(async()=>',`<script>ADV.Expedition.StoryBattle.prototype.fight=async function(){for(const a of this.actors.values()){a.root.setPosition(a.home.x,a.home.y);a.idle();}this.__testReady=true;};</script><script>(async()=>`);await route.fulfill({response:r,body});});
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8742')+'/docs/STORY_FIGHT_PREVIEW.html?muted=1');await page.waitForFunction(()=>window.storyGame?.scene.getScene('StoryBattle')?.__testReady);
  const result=await page.evaluate(async identity=>{
   const X=ADV.Expedition,s=storyGame.scene.getScene('StoryBattle'),h=s.hero,t=[...s.actors.values()].find(a=>a.unit.ch.storyOpponent===identity);
   if(!t)throw Error('Missing '+identity);X.fx.cinematics=false;
   const out={identity,actor:t.sheet.actor,attacks:[],pairs:[],bounds:[]};
   const readBounds=()=>{
    const name=t.img.frame.name,d=s.cache.json.get('xp_'+t.sheet.actor+'_clips'),f=d.frames[name];if(!f)return;
    const r=f.spriteSourceSize,p=d.canvas.pivot,sc=t.img.scaleX,sy=t.img.scaleY;
    const left=t.root.x+Math.min((r.x-p.x)*sc,(r.x+r.w-p.x)*sc),right=t.root.x+Math.max((r.x-p.x)*sc,(r.x+r.w-p.x)*sc),top=t.root.y+(r.y-p.y)*sy,bottom=t.root.y+(r.y+r.h-p.y)*sy;
    if(left<0||right>1280||top<0||bottom>760)out.bounds.push({frame:name,left,right,top,bottom});
   };
   readBounds();
   for(const name of ['slash',...(t.sheet.clips.cast?['cast']:[])]){
    const seen=new Set();let contacts=0;const watch=(_,f)=>{seen.add(f.textureFrame);readBounds();};t.img.on('animationstart',watch);t.img.on('animationupdate',watch);
    await t.play(name,{target:h,onContact:()=>contacts++});t.img.off('animationstart',watch);t.img.off('animationupdate',watch);
    out.attacks.push({name,frames:seen.size,contacts,facing:t.facing,scaleX:t.img.scaleX,authoredFacing:t.sheet.authoredFacing,home:t.root.x===t.home.x});
   }
   for(const variant of [0,1]){
    t.alive=true;t.root.setVisible(true);t.idle();const seen=new Set();let clip=null;
    const watch=(anim,f)=>{if(/finisher|cleave|paired/.test(anim.key)){seen.add(f.textureFrame);clip=anim.key;}};h.img.on('animationupdate',watch);h.img.on('animationstart',watch);
    await h.play('finisher',{target:t,lethal:true,finisherVariant:variant});h.img.off('animationupdate',watch);h.img.off('animationstart',watch);
    out.pairs.push({variant,frames:seen.size,clip,restored:h.img.texture.key==='xp_hiro_sheet'});
   }
   t.alive=true;t.root.setVisible(true);t.idle();h.alive=true;h.unit.chp=0;s.__enemyFinishPresented=false;
   const seen=new Set(),tick=()=>{if(s.__enemyFinishSprite)seen.add(s.__enemyFinishSprite.frame.name);};s.events.on('update',tick);
   await X.Beats.ticksOnly(s,[{t:'damage',uid:h.uid,by:t.uid,dmg:999,tag:'dot'},{t:'down',uid:h.uid}]);await X.EnemyFinishers.ensureDefeat(s);s.events.off('update',tick);
   out.fatal={presented:s.__enemyFinishPresented,frames:seen.size};return out;
  },identity);
  assert(result.attacks.every(a=>a.frames>1&&a.contacts>0&&a.facing===-1),JSON.stringify(result));
  assert(result.pairs.every(p=>p.frames>=8&&p.restored),JSON.stringify(result));assert(result.fatal.presented&&result.fatal.frames>=8,JSON.stringify(result));assert.deepEqual(result.bounds,[],'attack artwork stays inside the viewport');assert.deepEqual(errors,[]);
  await page.screenshot({path:OUT+'/'+u.id+'-defeat.png'});results.push(result);fs.writeFileSync(OUT+'/playback.json',JSON.stringify(results,null,2));console.log(identity+': attacks, two Hiro pairs, fatal passed; '+result.bounds.length+' edge observations');await context.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
