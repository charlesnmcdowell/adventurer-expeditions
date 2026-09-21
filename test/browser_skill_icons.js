// Real Phaser HUD input/art check without loading a combat campaign or altering saves.
// Run: node test/browser_skill_icons.js. Evidence: test/reports/skill-icons/.
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'reports/skill-icons');
const html = `<!doctype html><html><meta charset="utf-8"><style>body{margin:0;background:#171512}</style><script src="/lib/phaser.min.js"></script><script>
window.calls={skills:[],upgrades:[]};
window.ADV={Expedition:{},Portraits:{key(){return'test-portrait'}},DATA:{SKILLS:{}},T:{W:1280,H:760,text(s,x,y,t,o={}){const z=s.add.text(x,y,t,{fontFamily:'Arial',fontSize:o.size||16,color:o.color||'#fff',wordWrap:o.wrap?{width:o.wrap}:undefined});z.setOrigin(o.ox||0,o.oy||0);return z;}}};
const X=ADV.Expedition;X.infoHoldMs=3000;X.hudIconR=26;X.skills={};
for(const id of ['katana_slash','god_aura','counter_attack','finisher','shield_wall']){ADV.DATA.SKILLS[id]={name:id.replaceAll('_',' '),kind:'active',desc:'Test skill explanation.'};X.skills[id]={1:{cooldown:3},2:{cooldown:3}};}
X.Encounter={kit(){return{hiro:true,actives:['finisher','god_aura','counter_attack'],perks:[]}},owned(r,id){return r.levels[id]>0},upgradeCost(r,id){return r.levels[id]<3?25:null},canUpgrade(r,id){return r.gold>=25&&r.levels[id]<3}};
</script><script src="/js/expedition/ui_common.js"></script><script src="/js/expedition/hud.js"></script><script>
class Icons extends Phaser.Scene{preload(){X.Hud.preloadArt(this)}create(){
 const g=this.add.graphics();g.fillStyle(0x54445f);g.fillRect(0,0,128,128);g.generateTexture('test-portrait',128,128);g.destroy();
 this.run={gold:200,levels:{katana_slash:1,finisher:1,god_aura:1,counter_attack:1,shield_wall:1}};
 this.hud=new X.Hud(this,{run:this.run,inn:true,portraitKey:'test-portrait',onSkill:id=>calls.skills.push(id),onUpgrade:id=>{calls.upgrades.push(id);this.run.levels[id]++;this.run.gold-=25;this.hud.refresh();return{ok:true}}});
 this.hud.setSkillStates(Object.fromEntries(['finisher','god_aura','counter_attack'].map(id=>[id,{ready:true}])));
 window.testScene=this;window.ready=true;
 }}
window.game=new Phaser.Game({type:Phaser.CANVAS,width:1280,height:760,backgroundColor:'#171512',scene:Icons,audio:{noAudio:true}});
</script></html>`;
const types={'.js':'text/javascript','.json':'application/json','.webp':'image/webp','.html':'text/html'};
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  const f=path.resolve(ROOT,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await require('playwright').chromium.launch({headless:true,args:['--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.ready);
  const before=await page.evaluate(()=>({ids:Object.keys(testScene.hud.icons),icons:Object.values(testScene.hud.icons).map(c=>({id:c.id,frame:c.art&&c.art.frame.name,width:c.art&&c.art.displayWidth,rect:c.rect,plusRect:c.plusRect})),autoInteractive:testScene.hud.portrait.autoSlashBadge.list.some(o=>o.input),frames:testScene.textures.get('xp_hiro_skill_icons').getFrameNames()}));
  assert.deepEqual(before.ids,['finisher','god_aura','counter_attack']);assert.equal(before.autoInteractive,false);assert.equal(before.frames.length,4);
  for(const i of before.icons){assert.equal(i.frame,i.id);assert.equal(i.width,64);assert.ok(i.rect.w>=48&&i.rect.h>=48&&i.plusRect.w>=48&&i.plusRect.h>=48)}
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const a of before.icons)for(const b of before.icons)if(a!==b){assert.ok(!overlap(a.rect,b.rect),'main regions overlap');assert.ok(!overlap(a.plusRect,b.rect),'upgrade steals neighbor tap');}
  const center=r=>({x:r.x+r.w/2,y:r.y+r.h/2}),tap=async r=>{const p=center(r);await page.mouse.click(p.x,p.y);};
  const first=before.icons[0];await tap(first.rect);assert.deepEqual(await page.evaluate(()=>calls.skills),['finisher']);
  await page.evaluate(()=>{testScene.hud.gateUntilInspected(testScene.hud.icons.finisher);});
  const p=center(first.rect);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(3200);await page.mouse.up();
  assert.equal(await page.evaluate(()=>testScene.hud.info&&testScene.hud.info.id),'finisher');assert.equal(await page.evaluate(()=>testScene.hud.gateActive()),false);assert.equal(await page.evaluate(()=>calls.skills.length),1);
  await page.evaluate(()=>testScene.hud.closeInfo());await tap(first.plusRect);await page.waitForTimeout(200);
  const confirm=await page.evaluate(()=>testScene.hud.chip.confirmRect);assert.ok(confirm.h>=48);await tap(confirm);assert.deepEqual(await page.evaluate(()=>calls.upgrades),['finisher']);
  await page.evaluate(()=>{testScene.run.levels.god_aura=0;testScene.hud.refresh()});
  const locked=await page.evaluate(()=>({lock:testScene.hud.icons.god_aura.lock.visible,alpha:testScene.hud.icons.god_aura.art.alpha}));assert.equal(locked.lock,true);assert.equal(locked.alpha,.25);
  await tap(before.icons[1].rect);assert.equal(await page.evaluate(()=>testScene.hud.chip.id),'god_aura');await page.evaluate(()=>testScene.hud.closeChip());
  const fallback=await page.evaluate(()=>{const s=testScene,real=s.textures.exists;s.textures.exists=k=>k==='xp_hiro_skill_icons'?false:real.call(s.textures,k);const f=s.hud.buildIcon('finisher',600,620,'active');s.textures.exists=real;const other=s.hud.buildIcon('shield_wall',720,620,'active');return{art:!!f.art,glyph:f.glyph.visible,otherArt:!!other.art,otherGlyph:other.glyph.visible,otherWidth:other.rect.w}});
  assert.deepEqual(fallback,{art:false,glyph:true,otherArt:false,otherGlyph:true,otherWidth:60});
  await page.screenshot({path:path.join(OUT,'hud-icons.png')});assert.deepEqual(errors,[]);
  const report={passed:true,atlasBytes:fs.statSync(path.join(ROOT,'assets/expedition/icons/hiro-skills.webp')).size,atlasFrames:before.frames,controls:before.icons,checks:['3existing actives; slash AUTO has no input','64px distinct frames','nonoverlapping48px-or-larger control regions','tap requests skill','3second hold opens info and releases tutorial gate without firing','upgrade confirm preserves callback','locked art+unlock chip','missing atlas and recruit glyph fallback'],errors};
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
