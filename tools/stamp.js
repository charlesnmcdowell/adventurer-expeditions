// Adventurer: Expeditions — move every expedition script to one fresh cache stamp.
//
// A half-updated set is what froze the game on 2026-09-21: today's dev.js loaded
// against a cached yesterday's campaign.js. The contract test in
// test/ship_budget_contract.js enforces one shared stamp, no older than the
// newest file it covers; this writes it, so nobody has to type a date.
//
//   node tools/stamp.js            bump to today (UTC), next free suffix
//   node tools/stamp.js --check    print the current stamp, change nothing
'use strict';
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const RE = /(src="js\/expedition\/[A-Za-z0-9_]+\.js\?v=)([^"]*)(")/g;

const html = fs.readFileSync(INDEX, 'utf8');
const current = [...new Set([...html.matchAll(RE)].map(m => m[2]))];
if (process.argv.includes('--check')) {
  console.log('stamp: ' + (current.length === 1 ? current[0] : 'MIXED — ' + current.join(', ')));
  process.exit(current.length === 1 ? 0 : 1);
}
// Today in UTC, because the contract compares against the end of the stamp's day.
const d = new Date();
const today = d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
let n = 1;
const prev = current[0] || '';
const m = new RegExp('^' + today + '-xp(\\d+)$').exec(prev);
if (m) n = Number(m[1]) + 1;
const stamp = today + '-xp' + n;
const out = html.replace(RE, (_, a, __, c) => a + stamp + c);
fs.writeFileSync(INDEX, out);
const count = [...out.matchAll(RE)].length;
console.log('stamped ' + count + ' expedition scripts: ' + (prev || '(none)') + ' -> ' + stamp);
