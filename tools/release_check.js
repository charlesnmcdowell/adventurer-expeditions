// Adventurer: Expeditions — the last gate before the package goes to CrazyGames.
//
// The developer's tools are on all through development (Hiro, 2026-09-21), so
// the one thing that can slip out the door is the flag that hides them. This
// refuses to bless a build while it is still on, and checks the other things
// that are easy to forget at the same time. It changes nothing.
//
//   node tools/release_check.js            report, exit 1 if the build is not ready
//   node tools/release_check.js --json
'use strict';
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const checks = [];
const add = (name, ok, detail, fatal, note) => checks.push({ name, ok, detail, note, fatal: fatal !== false });

// 1. The developer's tools are hidden.
const dev = read('js/expedition/dev.js');
const flag = /Dev\.DEV_BUILD\s*=\s*(true|false)\s*;/.exec(dev);
add('developer tools hidden (Dev.DEV_BUILD = false)', !!flag && flag[1] === 'false',
  flag ? 'js/expedition/dev.js has Dev.DEV_BUILD = ' + flag[1] : 'Dev.DEV_BUILD not found in js/expedition/dev.js');

// 2. Nothing else can put the panel back: attach() must return on the flag.
add('the panel is gated on that flag', /Dev\.attach\s*=\s*function[\s\S]{0,200}?if\s*\(!Dev\.DEV_BUILD\)\s*return;/.test(dev),
  'Dev.attach must start with `if (!Dev.DEV_BUILD) return;`');

// 3. The size gate passes. Megabytes are decimal here, the way size_check.js
//    counts them and the way the portal states its limit.
let size = null;
try {
  size = require('./size_check.js').report();
  add('build inside the size budget', !size.over && !size.missing.length,
    null, true, (size.total / 1e6).toFixed(2) + ' MB of ' + (size.budget / 1e6).toFixed(1) + ' MB' + (size.missing.length ? '; missing: ' + size.missing.join(', ') : ''));
} catch (e) { add('build inside the size budget', false, String(e.message || e)); }

// 4. The busts are baked, or the part sheets are riding along.
add('recruit busts baked', !!(size && size.baked), 'run node tools/bake_busts.js — the 4.4 MB of part sheets are in the build', false, size && size.baked ? 'part sheets excluded' : null);

// 5. No debugging left switched on in the boot path.
const html = read('index.html');
add('no forced entry point in index.html', !/\bat=inn\b/.test(html.replace(/params\.get\('at'\)[^\n]*/g, '')),
  'index.html still hard-codes a jump');

// 6. The notices file the portal requires is present and non-empty.
add('THIRD_PARTY_NOTICES.txt present', fs.existsSync(path.join(ROOT, 'THIRD_PARTY_NOTICES.txt')) && fs.statSync(path.join(ROOT, 'THIRD_PARTY_NOTICES.txt')).size > 200, 'required by the licences we ship under');

const failed = checks.filter(c => !c.ok && c.fatal);
const warned = checks.filter(c => !c.ok && !c.fatal);
if (process.argv.includes('--json')) console.log(JSON.stringify({ ready: !failed.length, checks }, null, 2));
else {
  for (const c of checks) console.log((c.ok ? '  ok   ' : c.fatal ? '  FAIL ' : '  warn ') + c.name + (c.ok ? (c.note ? ' — ' + c.note : '') : c.detail ? ' — ' + c.detail : ''));
  console.log(failed.length ? '\nnot ready to ship: ' + failed.length + ' blocking' + (warned.length ? ', ' + warned.length + ' to look at' : '')
    : '\nready to ship' + (warned.length ? ' (' + warned.length + ' to look at)' : ''));
}
if (failed.length) process.exit(1);
