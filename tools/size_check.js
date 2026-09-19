// Adventurer: Expeditions — the build-size gate (GDD v0.8 §12a).
//
//   node tools/size_check.js            list the ship set by group, fail over budget
//   node tools/size_check.js --zip      also write dist/expeditions.zip from that set
//   node tools/size_check.js --json     machine-readable summary
//
// The ship set = scripts, styles and icons referenced by index.html, plus the
// files and folders in tools/ship_manifest.json. Part sheets baked into busts
// (manifest.partSheets) are counted only while the baked busts are missing, so
// the gate tells the truth either way. Also exported: shipList(), used by the
// browser test's --ship mode to serve nothing else.
'use strict';
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const MAN = JSON.parse(fs.readFileSync(path.join(__dirname, 'ship_manifest.json'), 'utf8'));

function fromIndex() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const out = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"?]+)(?:\?[^"]*)?"/g)) {
    const f = m[1];
    if (/^(https?:)?\/\//.test(f) || f.startsWith('#') || f.startsWith('data:')) continue;
    out.add(f);
  }
  return [...out];
}
function walk(dir, out) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const n of fs.readdirSync(abs)) {
    const rel = path.posix.join(dir, n), st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel, out); else if (!n.startsWith('.')) out.push(rel);
  }
  return out;
}
function shipList() {
  const set = new Set(fromIndex());
  for (const f of MAN.files) set.add(f);
  for (const d of MAN.dirs) for (const f of walk(d, [])) set.add(f);
  const baked = MAN.partSheets && MAN.dirs.includes('assets/expedition/busts') && walk('assets/expedition/busts', []).length > 0;
  if (MAN.partSheets && !baked) for (const f of MAN.partSheets.files) set.add(f);
  return { files: [...set].sort(), baked };
}
function group(rel) {
  if (rel.startsWith('lib/')) return 'lib';
  if (rel.startsWith('js/')) return 'js';
  if (rel.startsWith('audio/music')) return 'music';
  if (rel.startsWith('audio/vo')) return 'voice';
  if (rel.startsWith('audio/')) return 'sfx';
  if (rel.startsWith('assets/expedition')) return 'expedition art';
  if (rel.startsWith('assets/')) return 'shared art';
  return 'other';
}
function report() {
  const { files, baked } = shipList();
  const rows = [], missing = [], groups = {};
  let total = 0;
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) { missing.push(rel); continue; }
    const b = fs.statSync(abs).size; total += b; rows.push({ rel, b });
    groups[group(rel)] = (groups[group(rel)] || 0) + b;
  }
  const budget = MAN.budgetMB * 1024 * 1024;
  return { files: rows, missing, groups, total, budget, budgetMB: MAN.budgetMB, over: total > budget, baked };
}
const MB = b => (b / 1024 / 1024).toFixed(2) + ' MB';

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const r = report();
  if (args.has('--json')) { console.log(JSON.stringify({ total: r.total, budget: r.budget, over: r.over, groups: r.groups, missing: r.missing, count: r.files.length, baked: r.baked })); }
  else {
    console.log('ship set: ' + r.files.length + ' files' + (r.baked ? ' (busts baked; part sheets excluded)' : ' (part sheets included: bake busts to drop them)'));
    for (const [g, b] of Object.entries(r.groups).sort((a, b) => b[1] - a[1])) console.log('  ' + g.padEnd(16) + MB(b).padStart(10));
    console.log('  largest:');
    for (const f of r.files.slice().sort((a, b) => b.b - a.b).slice(0, 12)) console.log('    ' + MB(f.b).padStart(9) + '  ' + f.rel);
    if (r.missing.length) console.log('  MISSING: ' + r.missing.join(', '));
    console.log('total ' + MB(r.total) + ' of ' + r.budgetMB.toFixed(1) + ' MB budget' + (r.over ? '  — OVER by ' + MB(r.total - r.budget) : '  — ' + MB(r.budget - r.total) + ' to spare'));
  }
  if (args.has('--zip')) {
    const { execFileSync } = require('node:child_process');
    fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
    const list = path.join(ROOT, 'dist', 'ship_list.txt');
    fs.writeFileSync(list, r.files.map(f => f.rel).join('\n') + '\n');
    const zip = path.join(ROOT, 'dist', 'expeditions.zip');
    try { fs.rmSync(zip, { force: true }); execFileSync('zip', ['-q', '-X', zip, '-@'], { cwd: ROOT, input: r.files.map(f => f.rel).join('\n') + '\n' }); console.log('wrote dist/expeditions.zip (' + MB(fs.statSync(zip).size) + ')'); }
    catch (e) { console.log('zip not available here (' + (e.message || e).split('\n')[0] + '); dist/ship_list.txt written instead'); }
  }
  if (r.missing.length) { console.error('size_check: ' + r.missing.length + ' listed file(s) missing'); process.exit(1); }
  if (r.over) { console.error('size_check: over budget'); process.exit(1); }
}
module.exports = { shipList, report };
