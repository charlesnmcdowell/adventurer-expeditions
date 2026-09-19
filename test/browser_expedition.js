// Adventurer: Expeditions — browser run of the loop.
// Serves this folder, opens index.html, and plays like a guided beginner:
// whenever the game holds on something (ring + hand) it taps that thing;
// when a skill icon glows it taps it; when the arrow appears it taps it;
// when a chip is open it confirms. At the inn it buys a recruit when it can,
// levels a skill otherwise, then embarks. Screenshots land in test/reports/expedition/.
// Fails on any page error or if the tutorial + one full cycle of the four loop
// quests does not complete (5 clears) and return to the inn.
// Usage: node test/browser_expedition.js [--seed=N] [--headed] [--clears=N] [--at=inn [--gold=N]] [--width=375] [--ship]
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'test', 'reports', 'expedition');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] == null ? true : m[2]] : [a, true]; }));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

// --ship: serve only the build's ship set (tools/size_check.js), so a request for
// anything that would not be uploaded is a 404 and fails the run.
const SHIP = args.ship ? new Set(require('../tools/size_check.js').shipList().files) : null;
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const rel = u === '/' ? 'index.html' : u.replace(/^\//, '');
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory() || (SHIP && !SHIP.has(rel))) { console.log('404', u + (SHIP && fs.existsSync(f) ? ' (not in ship set)' : '')); res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const pw = require('playwright');
  const srv = await serve();
  const port = srv.address().port;
  // Software WebGL in headless Chromium runs ~10 fps; the Canvas renderer with the GPU
  // process off holds 60, which is what the timing assumes.
  const browser = await pw.chromium.launch({ headless: !args.headed, args: args.headed ? [] : ['--disable-gpu'] });
  const vw = Number(args.width || 1280);
  const page = await browser.newPage({ viewport: { width: vw, height: Math.round(vw * 760 / 1280) } });
  const errors = [], logs = []; global.__logs = logs; global.__errors = errors;
  if (process.env.PROBE) {   // PROBE=<regex>: print the initiator stack of matching requests
    const cdp = await page.context().newCDPSession(page); await cdp.send('Network.enable');
    const re = new RegExp(process.env.PROBE);
    cdp.on('Network.requestWillBeSent', e => { if (re.test(e.request.url)) { const st = e.initiator && e.initiator.stack; console.log('PROBE', e.request.url.split('/').pop(), st ? st.callFrames.slice(0, 8).map(f => f.functionName + '@' + f.url.split('/').pop() + ':' + f.lineNumber).join(' | ') : e.initiator.type); } });
  }
  page.on('pageerror', e => { errors.push(String(e && e.stack || e)); });
  page.on('console', m => { const t = m.text(); logs.push('[' + m.type() + '] ' + t); if (m.type() === 'error') errors.push(t); });
  const seed = args.seed || 11;
  const entry = args.at ? '?at=' + args.at + (args.gold ? '&gold=' + args.gold : '') : '?fresh=1';
  await page.goto('http://127.0.0.1:' + port + '/index.html' + entry + '&seed=' + seed + (args.headed ? '' : '&renderer=canvas'));
  let n = 0;
  const shot = async (label) => { n++; const f = path.join(OUT, String(n).padStart(2, '0') + '-' + label + '.png'); await page.screenshot({ path: f }); console.log('shot', f); };
  const st = () => page.evaluate(() => {
    const g = window.__game; if (!g) return null;
    const active = g.scene.getScenes(true).map(x => x.sys.settings.key);
    const key = active[0];
    const sc = key && g.scene.getScene(key);
    if (key !== 'Expedition') {
      const r = sc && sc.run;
      const dialogue = !!(ADV.UI && ADV.UI.cardIs && ADV.UI.cardIs('dialogue'));
      const o = { scene: key, phase: r && r.phase, questId: r && r.questId, leg: sc && sc.opts && sc.opts.leg, dialogue,
        done: r && r.questsDone ? r.questsDone.length : 0, gold: r && r.gold, gate: sc && sc.__gateRect || null, confirm: sc && sc.__confirmRect || null,
        btn: sc && sc.btn && sc.btn.rect || null };
      if (key === 'Inn' && sc.busts && r) {
        const C = ADV.Expedition.Campaign;
        o.roster = r.roster.slice(); o.field = r.field.slice();
        o.buyable = Object.values(sc.busts).filter(b => C.canBuy(r, b.key) && !C.owns(r, b.key)).map(b => ({ key: b.key, rect: b.rect }));
        const h = sc.hud;
        o.chip = h && h.chip ? h.chip.confirmRect : null;
        o.upgrades = h ? Object.keys(h.icons).map(id => ({ id, rect: h.icons[id].rect, plusRect: h.icons[id].plusRect, owned: (r.levels[id] || 0) > 0, can: ADV.Expedition.Encounter.canUpgrade(r, id) })).filter(i => i.can) : [];
      }
      return o;
    }
    const s = sc;
    if (!s || !s.enc || !s.hud) return { scene: key };
    const E = ADV.Expedition.Encounter, enc = s.enc, hud = s.hud;
    const glowing = Object.keys(hud.icons).filter(id => hud.icons[id].readyTween).map(id => ({ id, rect: hud.icons[id].rect }));
    return { scene: 'Expedition', phase: s.run.phase, questId: s.run.questId, party: !!s.run.party, over: !!enc.st.over, wave: s.run.wave, round: enc.st.round, steps: enc.steps, gate: hud.gateActive(), gateFor: hud._gateFor,
      gateRect: hud._gateRect || null, gold: s.run.gold, levels: s.run.levels, arrow: !!s.arrowArmed, arrowRect: hud.arrow.rect,
      chip: hud.chip ? hud.chip.confirmRect : null, glowing, done: !!(hud.completionCard), replay: hud.completionCard ? hud.completionCard.replayRect : null,
      defeated: hud.defeatCardObj ? hud.defeatCardObj.againRect : null, tutorial: !!(s.quest && s.quest.tutorial),
      heroHp: E.heroUnit(enc) ? E.heroUnit(enc).chp : null, request: enc.request ? enc.request.skillId : null };
  });
  const tap = async (r, why) => { console.log('tap', why, JSON.stringify(r)); await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); };

  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length, null, { timeout: 15000 });
  await page.waitForTimeout(1200); await shot('start');
  if (process.env.PROBE) await page.evaluate(re => { const orig = ADV.ArtAssets.load; ADV.ArtAssets.load = function (u) { if (new RegExp(re).test(u)) console.log('PROBE ' + u + ' :: ' + new Error().stack.split('\n').slice(8, 14).join(' | ')); return orig.apply(this, arguments); }; }, process.env.PROBE);
  const t0 = Date.now();
  const TARGET = Number(args.clears || 5);   // tutorial + one full cycle of the four loop quests
  let lastKey = '', lastShot = 0, s = null, tappedSkillAt = 0, inns = 0, dialogues = 0, recruits = 0, innBuys = 0, embarks = 0, innShots = 0, defeats = 0;
  while (Date.now() - t0 < 900000) {
    await page.waitForTimeout(250);
    s = await st(); if (!s || !s.scene) continue;
    const tag = s.scene + ':' + (s.questId || '') + ':' + (s.scene === 'Travel' ? (s.leg || '') : (s.wave == null ? '' : s.wave));
    if (tag !== lastKey) { lastKey = tag; await page.waitForTimeout(1800); await shot(tag.replace(/:/g, '-')); lastShot = Date.now(); }
    else if (Date.now() - lastShot > 7000 && s.scene === 'Expedition' && !s.over) { await shot(tag.replace(/:/g, '-') + '-r' + s.round); lastShot = Date.now(); }
    if (s.scene === 'Inn') {
      inns++;
      if (s.done >= TARGET) { await page.waitForTimeout(400); await shot('inn-after-cycle'); break; }
      if (s.chip) { await tap(s.chip, 'confirm upgrade'); innBuys++; await page.waitForTimeout(500); continue; }
      if (s.confirm) { await tap(s.confirm, 'confirm recruit'); recruits++; await page.waitForTimeout(700); if (innShots++ < 3) await shot('inn-bought-' + recruits); continue; }
      if (s.buyable && s.buyable.length) { await tap(s.buyable[0].rect, 'recruit ' + s.buyable[0].key); await page.waitForTimeout(500); continue; }
      if (s.upgrades && s.upgrades.length) { const u = s.upgrades.find(i => !i.owned) || s.upgrades[0]; await tap(u.owned ? u.plusRect : u.rect, 'inn upgrade ' + u.id); innBuys++; await page.waitForTimeout(500); continue; }
      if (s.gate) { await tap(s.gate, 'inn gate'); await page.waitForTimeout(400); continue; }
      if (s.btn) { await tap(s.btn, 'embark'); embarks++; await page.waitForTimeout(700); }
      continue;
    }
    if (s.scene === 'Travel') { if (s.dialogue) { dialogues++; await page.waitForTimeout(900); if (dialogues <= 6) await shot('travel-dialogue-' + dialogues); await page.mouse.click(640, 660); } continue; }
    if (s.scene === 'Grave') { if (s.btn) { await tap(s.btn, 'grave → inn'); await page.waitForTimeout(500); } continue; }
    if (s.scene !== 'Expedition' || s.over == null) continue;
    if (s.done && s.replay) { await page.waitForTimeout(400); await tap(s.replay, 'contract done →'); await page.waitForTimeout(600); continue; }
    if (s.defeated) { defeats++; await shot('defeat-' + defeats); await tap(s.defeated, 'again'); await page.waitForTimeout(600); continue; }
    if (s.gate && s.gateRect) { await shot(tag.replace(/:/g, '-') + '-gate-' + (s.gateFor || 'x')); await tap(s.gateRect, 'gate ' + s.gateFor); await page.waitForTimeout(400); continue; }
    if (s.chip) { await tap(s.chip, 'confirm'); await page.waitForTimeout(400); continue; }
    if (s.arrow) { await tap(s.arrowRect, 'arrow'); await page.waitForTimeout(600); continue; }
    if (!s.over && s.glowing.length && !s.request && Date.now() - tappedSkillAt > 1500) { await tap(s.glowing[0].rect, 'skill ' + s.glowing[0].id); tappedSkillAt = Date.now(); continue; }
    // On the tutorial road a beginner buys only what the guide holds on; the inn is where the rest is spent.
    if (s.over && !s.gate && !s.chip && s.gold >= 20 && !s.tutorial) {
      const icons = await page.evaluate(() => { const h = window.__game.scene.getScene('Expedition').hud; return Object.keys(h.icons).map(id => ({ id, rect: h.icons[id].rect, plusRect: h.icons[id].plusRect, owned: (h.run.levels[id] || 0) > 0, can: ADV.Expedition.Encounter.canUpgrade(h.run, id) })); });
      const pick = icons.find(i => i.can && !i.owned) || icons.find(i => i.can);
      if (pick) { await tap(pick.owned ? pick.plusRect : pick.rect, 'buy ' + pick.id); await page.waitForTimeout(400); continue; }
    }
  }
  console.log('summary', JSON.stringify({ inns, dialogues, recruits, innBuys, embarks, defeats, last: s }));
  fs.writeFileSync(path.join(OUT, 'console.log'), logs.join('\n'));
  await browser.close(); srv.close();
  if (errors.length) { console.error('PAGE ERRORS:\n' + errors.join('\n')); process.exit(1); }
  if (!(s && s.scene === 'Inn' && s.done >= TARGET)) { console.error('the loop did not complete ' + TARGET + ' quests and return to the inn'); process.exit(1); }
  if (recruits < 1) { console.error('no recruit was bought at the inn'); process.exit(1); }
  if (dialogues < 2) { console.error('no travel dialogue seen'); process.exit(1); }
  console.log('browser_expedition: ok');
})().catch(e => { console.error(e); if ((global.__errors || []).length) console.error('PAGE ERRORS:\n' + global.__errors.join('\n')); try { fs.writeFileSync(path.join(OUT, 'console.log'), (global.__logs || []).join('\n')); } catch (x) {} process.exit(1); });
