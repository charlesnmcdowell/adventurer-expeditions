// Adventurer: Expeditions — one-way sync of shared runtime files from the
// original game. The original is never written; this folder is the only target.
//
//   node tools/sync_shared.js            copy/refresh shared files from ../adventurer
//   node tools/sync_shared.js --check    report drift without copying
//   node tools/sync_shared.js --source=<path-to-adventurer>
//
// Files listed under LOCAL are owned by this folder and never overwritten.
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const HERE = path.join(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] == null ? true : m[2]] : [a, true]; }));
const SRC = path.resolve(args.source || path.join(HERE, '..', 'adventurer'));

// Whole folders copied file-for-file (only these extensions).
const FOLDERS = [
  { dir: 'js/data', ext: ['.js'] },
  { dir: 'js/core', ext: ['.js'] },
  { dir: 'audio/sfx', ext: ['.mp3', '.ogg', '.wav'] },
  { dir: 'assets/app', ext: ['.png', '.svg', '.ico'] },
];
// Individual files.
const FILES = [
  'lib/phaser.min.js',
  'THIRD_PARTY_NOTICES.txt',
  'assets/mobile.css', 'assets/save-ui.css',
  'assets/anime/v2/runtime/forest.webp', 'assets/anime/v2/runtime/road.webp', 'assets/anime/v2/runtime/mountain.webp',
  'assets/anime/v2/runtime/hiro_cyber_20260916.webp', 'assets/anime/v2/runtime/creatures_1.webp',
  'audio/music/battle_origin.mp3', 'audio/music/edwyn2.mp3', 'audio/music/night1.mp3',   // the three tracks (GDD §5.1)
  'test/harness.js', 'play_local.js',
  'js/ui/theme.js', 'js/ui/uikit.js', 'js/ui/home_art.js', 'js/ui/home_life.js', 'js/ui/music.js', 'js/ui/tooltip.js', 'js/ui/portraits.js',
  'js/ui/vfx.js', 'js/ui/combat_presentation.js', 'js/ui/weather.js', 'js/ui/spell_fx.js', 'js/ui/skill_art_catalog.js', 'js/ui/skill_art.js',
  'js/ui/battle_art.js', 'js/ui/travel_battle_art.js', 'js/ui/mobile_viewport.js', 'js/ui/anime_art.js', 'js/ui/anime_manifest.js',
  'js/ui/anime_identities.js', 'js/ui/asset_queue.js', 'js/ui/anime_world.js', 'js/ui/anime_environments.js', 'js/ui/travel_ambience.js',
  'js/ui/travel_panorama.js', 'js/ui/dialoguebox.js', 'js/ui/cutscenes.js',
  'assets/anime/v2/runtime/marsh.webp', 'assets/anime/v2/runtime/ruins.webp',
  'assets/anime/travel/v1/runtime/forest.webp', 'assets/anime/travel/v1/runtime/marsh.webp', 'assets/anime/travel/v1/runtime/ruins.webp',
  // The recruits' and human foes' busts are composed from these part sheets, then
  // baked by tools/bake_busts.js; the sheets never ship (tools/ship_manifest.json).
  'assets/anime/v2/runtime/heads_m_styles1.webp', 'assets/anime/v2/runtime/wardrobe_m2.webp', 'assets/anime/v2/runtime/heads_f_styles1.webp', 'assets/anime/v2/runtime/wardrobe_f3.webp',
  'assets/anime/v2/runtime/headgear.webp',      // the Plate Harness helm (Bram's set)
  // The city quest: the toll-house alley and the city road.
  'assets/anime/v2/runtime/alley.webp', 'assets/anime/travel/v1/runtime/city.webp',
  'assets/anime/v2/runtime/tavern.webp',        // the inn's taproom
];
// Recorded travel lines for the five recruits — only the bands the loop plays
// (GDD v0.8 §9: forest/city/marsh/ruins on first visit, neutral after, one line
// between fights, the answer by regard, the ride home). No funeral: no grave.
// Personality IDs mirror X.recruits in js/expedition/campaign.js (M05/F07/M11 provisional, GDD §16).
const VOICE_BANDS = ['travel_forest', 'travel_city', 'travel_marsh', 'travel_ruins', 'travel_neutral', 'travel_response', 'travel_hatred', 'travel_romantic', 'travel_return_win', 'travel_return_loss', 'travel_midleg'];
const VOICE_PIDS = ['M02', 'F03', 'M05', 'F07', 'M11'];
for (const pid of VOICE_PIDS) {
  const d = path.join(SRC, 'audio/vo', pid);
  if (fs.existsSync(d)) for (const n of fs.readdirSync(d)) if (VOICE_BANDS.some(b => n.startsWith(b + '_'))) FILES.push('audio/vo/' + pid + '/' + n);
}
// Owned here: synced once when missing, then never overwritten (portal.js carries the Expedition scene-key hook).
const LOCAL = ['js/ui/portal.js'];
// Copied once, then re-encoded here for the CrazyGames size budget (tools/shrink_audio.sh:
// music 48 kbps mono, voice 64 kbps mono); a re-sync must not put the big originals back.
const ONCE = rel => rel.startsWith('audio/music/') || rel.startsWith('audio/vo/');

function hash(f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }
function list() {
  const out = [];
  for (const { dir, ext } of FOLDERS) {
    const d = path.join(SRC, dir);
    if (!fs.existsSync(d)) { console.warn('missing source folder', dir); continue; }
    for (const n of fs.readdirSync(d)) if (ext.includes(path.extname(n)) && fs.statSync(path.join(d, n)).isFile()) out.push(path.join(dir, n));
  }
  return out.concat(FILES);
}

if (!fs.existsSync(path.join(SRC, 'index.html'))) { console.error('Source game not found at ' + SRC + ' (use --source=)'); process.exit(2); }
let copied = 0, same = 0, drift = [];
for (const rel of list().concat(LOCAL)) {
  const from = path.join(SRC, rel), to = path.join(HERE, rel);
  if (!fs.existsSync(from)) { console.warn('missing in source:', rel); continue; }
  const local = LOCAL.includes(rel) || ONCE(rel);
  if (fs.existsSync(to)) {
    if (local) { same++; continue; }
    if (hash(from) === hash(to)) { same++; continue; }
    drift.push(rel);
  }
  if (args.check) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to); copied++;
}
if (args.check) { console.log('shared files in sync: ' + same + ', drifted/missing: ' + drift.length); if (drift.length) console.log(drift.join('\n')); process.exit(drift.length ? 1 : 0); }
console.log('sync_shared: copied ' + copied + ', unchanged ' + same + ' (source: ' + SRC + ')');
