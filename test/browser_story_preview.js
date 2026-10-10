'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'reports/story');fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,''),f=path.resolve(ROOT,rel);if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],media=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(r.url().endsWith('.mp3'))media.push(r.url());});
    await page.addInitScript(()=>{localStorage.setItem('adv:sentinel','keep');localStorage.setItem('adventurer_expeditions_arcade_v1','keep arcade');});
    await page.goto('http://127.0.0.1:'+server.address().port+'/docs/STORY_CAMPAIGN_PREVIEW.html');
    const button=name=>page.getByRole('button',{name,exact:true});
    await button('Begin campaign preview').waitFor();await page.screenshot({path:path.join(OUT,'title.png')});
    await button('Begin campaign preview').click();await page.getByText('Tesfaye',{exact:true}).waitFor();
    await button('Sound on').click();await page.waitForTimeout(1200);await page.screenshot({path:path.join(OUT,'opening.png')});
    await button('Continue').click();await button('Why tonight? What has happened?').click();
    assert.equal(await button('Why tonight? What has happened?').count(),0,'asked question removed');
    await button('I will get my things.').click();await button('Continue').click();
    await button('No one. The same faces as every day.').click();await button('Continue').click();
    assert.equal(await page.locator('.speaker').textContent(),'Nib');await button('Continue').click();
    await button('You have picked the wrong storehouse.').click();await button('Continue').click();
    await page.getByText('The road ahead',{exact:true}).waitFor();await page.screenshot({path:path.join(OUT,'pending-combat.png')});
    await page.reload();await button('Continue campaign preview').waitFor();
    await button('Continue campaign preview').click();await page.getByText('The road ahead',{exact:true}).waitFor();
    await button('Title').click();
    for(const width of [375,390]){await page.setViewportSize({width,height:width===375?667:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(OUT,'title-'+width+'.png')});}
    assert(media.some(u=>u.includes('q1_wake_1.mp3')),'original opening recording requested');assert(media.some(u=>u.includes('vg_lanternhold.mp3')),'original quest music requested');
    assert.equal(await page.evaluate(()=>localStorage.getItem('adv:sentinel')),'keep');assert.equal(await page.evaluate(()=>localStorage.getItem('adventurer_expeditions_arcade_v1')),'keep arcade');
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify({errors,media,viewports:[1280,375,390],combat:'deliberately blocked pending art'},null,2));
    console.log('story preview: title, original voice/music, ask/reply choices, resume, art gate and mobile layout passed');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
