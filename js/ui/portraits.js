// Procedural bust portraits (§1a placeholder pipeline).
// JRPG bust crop: head + hair dominate ~60% of frame height, eye line fixed,
// one lighting key, flat palette-shiftable background. Deterministic per seed,
// so generated NPCs keep their face forever. Real art swaps in later by
// replacing textures keyed the same way (see PORTRAIT_MANIFEST note in README).
//
// Expression pass (EXPRESSION_PROMPT.md): the bust is still drawn ONCE into a
// cached texture; everything emotional is an overlay painted from META anchors.
//  - Part F: eyes, nose, lips, form shading, hair strands, skin variety.
//  - Part G: two silhouettes × three builds, 24 costume patterns, faction gear.
//  - Part A/D: 16-mood palette (Portraits.MOODS), wolf/sentinel rigs.
//  - Part B: Portraits.react — transient expressions on a queue.
//  - Part C: Portraits.moodFor — one standing-mood chooser for every surface.
//  - Part E: gaze, lip flap, head motion, skin states.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const W = 220, H = 280;
const EYE_Y = 118;            // identical eye line across every portrait (§1a)
const EYE_DX = 14;

const SKIN = {
  dark:   ['#5a3a26', '#6b4630'],
  brown:  ['#8a5c3a', '#9c6c48'],
  tan:    ['#a5714a', '#b78257'],
  fair:   ['#c9976b', '#d9a97c'],
  pale:   ['#d8ab87', '#e5bc97'],
  ashen:  ['#9a9a8a', '#ababa0'],
};
const HAIR_COLORS = ['#191410', '#2e2013', '#4a2f18', '#6b4423', '#8a6a3a', '#3a3a3f', '#7a7a72', '#8a3020', '#b8b4a6'];
const BG = ['#43506088', '#50435f88', '#435f4e88', '#5f524388', '#5f434388', '#43585f88'];
const GOLD = '#d4a94e';

function rngFor(seed) { return new ADV.RNG((seed >>> 0) || 1); }

// ---- drawing primitives ----------------------------------------------------
function shade(hex, f) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
// hue/undertone nudge: rotate the r/b balance a touch (warm > 0, cool < 0)
function tint(hex, warm) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + Math.round(warm * 255)));
  const g = (n >> 8) & 255;
  const b = Math.min(255, Math.max(0, (n & 255) - Math.round(warm * 255)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function rgba(hex, a) {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function hexInt(hex) { return parseInt(hex.slice(1, 7), 16); }
// soft blob: radial-gradient fill so shading has no hard edge (blur() is not
// available on every canvas backend, so we never rely on ctx.filter)
function softEllipse(ctx, x, y, rx, ry, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.7, rgba(color, alpha * 0.55));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

function chinYOf(o) {
  return o.sex === 'f' ? EYE_Y + 38 : EYE_Y + 42 + (o.jaw || 0) * 2;
}

// ---- body: two silhouettes, three builds (Part G1) --------------------------
// build: 'lean' | 'broad' | 'heavy' (men) / 'lean' | 'athletic' | 'sturdy' (women)
const BUILDS = {
  m: { lean:   { shoulder: 66, neckTop: 17, neckBot: 24, trap: 0,  pec: 0.0, arm: 0.6 },
       broad:  { shoulder: 80, neckTop: 19, neckBot: 30, trap: 6,  pec: 0.7, arm: 1.0 },
       heavy:  { shoulder: 86, neckTop: 22, neckBot: 36, trap: 10, pec: 0.5, arm: 1.2 } },
  f: { lean:     { shoulder: 60, neckTop: 15, neckBot: 22, trap: 0, pec: 0, arm: 0.5, bust: 0.75 },
       athletic: { shoulder: 66, neckTop: 16, neckBot: 24, trap: 2, pec: 0, arm: 0.8, bust: 0.9 },
       sturdy:   { shoulder: 72, neckTop: 17, neckBot: 28, trap: 4, pec: 0, arm: 1.0, bust: 1.0 } },
};
function buildOf(o) {
  const set = BUILDS[o.sex === 'f' ? 'f' : 'm'];
  const b = set[o.build] || (o.sex === 'f' ? set.athletic : set.broad);
  const v = Object.assign({}, b);
  // rank 4+ fighters/tanks fill out (Part G1)
  if ((o.rank || 1) >= 4 && o.sex === 'm' && (o.role === 'fighter' || o.role === 'tank')) { v.pec = Math.min(1, v.pec + 0.4); v.neckBot += 3; }
  return v;
}

// Skin torso under every garment: neck, shoulders, upper chest. Drawn first so
// open necklines reveal skin and closed garments can imply the form beneath.
function drawBody(ctx, o, cx, skin) {
  const chinY = chinYOf(o);
  const b = buildOf(o);
  // Sit the garment just under this face's chin so lean/broad/jaw variants
  // don't leave a floating collar or a buried neck.
  const y0 = chinY + 12;
  const sh = b.shoulder;
  ctx.fillStyle = shade(skin, o.sex === 'f' ? 1.0 : 0.94);
  // neck
  ctx.beginPath();
  ctx.moveTo(cx - b.neckTop / 2, chinY - 2);
  ctx.lineTo(cx + b.neckTop / 2, chinY - 2);
  ctx.lineTo(cx + b.neckBot / 2, y0 + 4);
  ctx.lineTo(cx - b.neckBot / 2, y0 + 4);
  ctx.closePath(); ctx.fill();
  // shoulders + chest slab (skin) — trapezius rise for broad builds
  ctx.beginPath();
  ctx.moveTo(cx - sh, H);
  ctx.quadraticCurveTo(cx - sh + 4, y0 + 14, cx - sh / 2 - 6, y0 + 2 - b.trap);
  ctx.quadraticCurveTo(cx, y0 - 6 - b.trap * 0.4, cx + sh / 2 + 6, y0 + 2 - b.trap);
  ctx.quadraticCurveTo(cx + sh - 4, y0 + 14, cx + sh, H);
  ctx.closePath(); ctx.fill();
  // jaw shadow onto the neck (Part F)
  softEllipse(ctx, cx, chinY + 6, b.neckTop / 2 + 4, 7, '#000000', 0.28);
  // collarbones
  ctx.strokeStyle = shade(skin, 0.86); ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 5, y0 + 8); ctx.quadraticCurveTo(cx - 18, y0 + 12, cx - sh / 2 + 2, y0 + 9);
  ctx.moveTo(cx + 5, y0 + 8); ctx.quadraticCurveTo(cx + 18, y0 + 12, cx + sh / 2 - 2, y0 + 9);
  ctx.stroke();
  if (o.sex === 'f') {
    // bust contour: two soft curves below the collarbone with a centre shadow.
    // Ordinary proportion — reads as a woman at 60px, nothing more.
    const k = b.bust || 0.9;
    const by = y0 + 34, bw = 17 * k, bh = 12 * k;
    softEllipse(ctx, cx, by + 4, 6, 14 * k, '#000000', 0.16);                 // centre
    for (const s of [-1, 1]) {
      softEllipse(ctx, cx + s * 20, by + 10, bw, bh, '#000000', 0.13);       // underside
      softEllipse(ctx, cx + s * 18, by - 6, bw * 0.9, bh * 0.6, '#ffffff', 0.10); // upper light
    }
  } else if (b.pec > 0) {
    // pectoral plane + sternum line on broad/heavy men
    softEllipse(ctx, cx, y0 + 34, 5, 16, '#000000', 0.14 * b.pec);
    for (const s of [-1, 1]) softEllipse(ctx, cx + s * 22, y0 + 40, 20, 10, '#000000', 0.10 * b.pec);
    // deltoid line
    ctx.strokeStyle = rgba('#000000', 0.16 * b.arm); ctx.lineWidth = 2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * (sh / 2 + 10), y0 + 12); ctx.quadraticCurveTo(cx + s * (sh / 2 + 4), y0 + 34, cx + s * (sh / 2 + 14), y0 + 60); ctx.stroke(); }
  }
  return { y0, sh, b };
}

// ---- costumes (Part G2) -----------------------------------------------------
// A pattern is a drawing recipe; a palette is {base, trim, metal}. SET_LOOK maps
// gear sets to both. Bare kinds used by NPC recipes map to patterns via KIND_PATTERN.
const KIND_PATTERN = {
  armor: 'plate', samurai: 'lamellar', ninja: 'shinobi', pirate: 'pirate', navy: 'navy',
  robe: 'robe', dress: 'dress', hide: 'hide', suit: 'duelist', hiking: 'ranger',
};
// which patterns leave the shoulders bare (skin shows above the garment line)
const OPEN_NECK = { dress: 1, hide: 1, pirate: 1 };

function palette(o) {
  const base = o.wardrobeColor || '#3a4150';
  return Object.assign({ base, trim: shade(base, 1.5), metal: '#8a8f99' }, o.palette || {});
}

// garment silhouette that follows the body: closed neckline unless open
function garmentShape(ctx, cx, y0, sh, neck) {
    ctx.beginPath();
  ctx.moveTo(cx - sh - 2, H);
  ctx.quadraticCurveTo(cx - sh + 2, y0 + 16, cx - sh / 2 - 8, y0 + 4);
  if (neck === 'v') { ctx.lineTo(cx - 16, y0 + 2); ctx.lineTo(cx, y0 + 30); ctx.lineTo(cx + 16, y0 + 2); }
  else if (neck === 'scoop') { ctx.quadraticCurveTo(cx, y0 + 26, cx + sh / 2 + 8, y0 + 4); }
  else if (neck === 'open') { ctx.lineTo(cx - 22, y0 + 14); ctx.quadraticCurveTo(cx, y0 + 46, cx + 22, y0 + 14); ctx.lineTo(cx + sh / 2 + 8, y0 + 4); }
  else if (neck === 'high') { ctx.lineTo(cx - 18, y0 - 8); ctx.lineTo(cx + 18, y0 - 8); }
  else { ctx.quadraticCurveTo(cx, y0 - 2, cx + sh / 2 + 8, y0 + 4); }
  ctx.quadraticCurveTo(cx + sh - 2, y0 + 16, cx + sh + 2, H);
  ctx.closePath();
}
function rivets(ctx, pts, col) { ctx.fillStyle = col; for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); } }
function folds(ctx, cx, y0, sh, col, n) {
  ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 1.4;
  for (let i = 0; i < n; i++) {
    const x = cx - sh * 0.7 + (i / (n - 1)) * sh * 1.4;
    ctx.beginPath(); ctx.moveTo(x, y0 + 40 + (i % 2) * 8); ctx.quadraticCurveTo(x + 3, y0 + 80, x - 2, H); ctx.stroke();
  }
}
// Scale costume details to this bust's shoulder width (72 is the design default).
function fit(sh, n) { return n * (sh / 72); }
function headWOf(o) { return 46 + (o.jaw || 0) * 4; }
// pauldron sits on the actual shoulder, not a fixed inset
function pauldron(ctx, cx, y0, sh, s, col, size, rim) {
  const px = cx + s * (sh - size * 0.42);
  const py = y0 + 10;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(px, py, size, size * 0.66, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(px, py - 2, size - 3, size * 0.5, s * 0.2, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
}
// form shading over the whole garment: shaded side + light side
function garmentLight(ctx, cx, y0, sh) {
  ctx.save();
  garmentShape(ctx, cx, y0, sh, 'round'); ctx.clip();
  const g = ctx.createLinearGradient(cx - sh, 0, cx + sh, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g; ctx.fillRect(cx - sh - 2, y0 - 12, sh * 2 + 4, H - y0 + 12);
  ctx.restore();
}

const PATTERNS = {
  // segmented steel plate: gorget, three chest lames, riveted pauldrons
  plate(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'high'); ctx.fillStyle = P.base; ctx.fill();
    ctx.fillStyle = shade(P.base, 0.8);
    const lame = fit(sh, 40);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - lame + i * 3, y0 + 36 + i * 22); ctx.quadraticCurveTo(cx, y0 + 46 + i * 22, cx + lame - i * 3, y0 + 36 + i * 22); ctx.lineTo(cx + lame + 4 - i * 3, y0 + 58 + i * 22); ctx.quadraticCurveTo(cx, y0 + 68 + i * 22, cx - lame - 4 + i * 3, y0 + 58 + i * 22); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = P.metal; ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - lame + i * 3, y0 + 36 + i * 22); ctx.quadraticCurveTo(cx, y0 + 46 + i * 22, cx + lame - i * 3, y0 + 36 + i * 22); ctx.stroke(); }
    // gorget
    const gw = fit(sh, 22);
    ctx.fillStyle = shade(P.base, 1.1);
    ctx.beginPath(); ctx.moveTo(cx - gw, y0 - 8); ctx.lineTo(cx - gw - 4, y0 + 26); ctx.quadraticCurveTo(cx, y0 + 36, cx + gw + 4, y0 + 26); ctx.lineTo(cx + gw, y0 - 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.metal; ctx.lineWidth = 2; ctx.stroke();
    for (const s of [-1, 1]) pauldron(ctx, cx, y0, sh, s, shade(P.base, 1.25), fit(sh, 26), P.metal);
    rivets(ctx, [[cx - sh / 2 - 4, y0 + 8], [cx - sh / 2 + 8, y0 + 6], [cx + sh / 2 + 4, y0 + 8], [cx + sh / 2 - 8, y0 + 6], [cx - fit(sh, 18), y0 + 30], [cx + fit(sh, 18), y0 + 30]], P.metal);
    if (o.centreRidge) { ctx.strokeStyle = P.metal; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx, y0 + 36); ctx.lineTo(cx, H); ctx.stroke(); }
    if (o.sunEmblem) { ctx.strokeStyle = P.trim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, y0 + 14, 7, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 9, y0 + 14 + Math.sin(a) * 9); ctx.lineTo(cx + Math.cos(a) * 13, y0 + 14 + Math.sin(a) * 13); ctx.stroke(); } }
    garmentLight(ctx, cx, y0, sh);
  },
  // brown leather cuirass with steel plates buckled on, mismatched pauldrons
  leather_plate(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'round'); ctx.fillStyle = P.base; ctx.fill();
    ctx.fillStyle = P.metal;
    const pw = fit(sh, 26);
    ctx.beginPath(); ctx.rect(cx - fit(sh, 30), y0 + 30, pw, 34); ctx.fill();
    ctx.beginPath(); ctx.rect(cx + fit(sh, 6), y0 + 36, fit(sh, 24), 30); ctx.fill();
    ctx.strokeStyle = shade(P.base, 0.6); ctx.lineWidth = 4;   // straps
    ctx.beginPath(); ctx.moveTo(cx - sh * 0.48, y0 + 8); ctx.lineTo(cx + 8, H); ctx.moveTo(cx + sh * 0.48, y0 + 8); ctx.lineTo(cx - 8, H); ctx.stroke();
    rivets(ctx, [[cx - 4, y0 + 52], [cx - fit(sh, 12), y0 + 74], [cx + fit(sh, 12), y0 + 74], [cx + 4, y0 + 52]], P.trim);
    pauldron(ctx, cx, y0, sh, -1, P.metal, fit(sh, 24), shade(P.metal, 1.3));
    pauldron(ctx, cx, y0, sh, 1, shade(P.base, 1.2), fit(sh, 20), shade(P.base, 1.5));
    garmentLight(ctx, cx, y0, sh);
  },
  // samurai lamellar: rows of laced plates, sode shoulder guards, katana hilt
  lamellar(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'high'); ctx.fillStyle = shade(P.base, 0.7); ctx.fill();
    const rowW = sh * 0.68;
    for (let r = 0; r < 4; r++) {
      const y = y0 + 28 + r * 20;
      ctx.fillStyle = r % 2 ? P.base : shade(P.base, 1.12);
      ctx.beginPath(); ctx.moveTo(cx - rowW + r * 2, y); ctx.lineTo(cx + rowW - r * 2, y); ctx.lineTo(cx + rowW + 2 - r * 2, y + 18); ctx.lineTo(cx - rowW - 2 + r * 2, y + 18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.trim; ctx.lineWidth = 1;                  // cord lacing
      for (let x = cx - rowW + 4; x <= cx + rowW - 4; x += 8) { ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + 4, y + 15); ctx.moveTo(x + 4, y + 3); ctx.lineTo(x, y + 15); ctx.stroke(); }
    }
    // sode (square shoulder guards) — hung from the shoulder, not mid-chest
    for (const s of [-1, 1]) {
      ctx.fillStyle = P.base;
      ctx.beginPath(); ctx.moveTo(cx + s * (sh - 14), y0 + 2); ctx.lineTo(cx + s * (sh + 8), y0 + 8); ctx.lineTo(cx + s * (sh + 10), y0 + 40); ctx.lineTo(cx + s * (sh - 12), y0 + 34); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.trim; ctx.lineWidth = 1.2;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx + s * (sh - 13), y0 + 2 + i * 8); ctx.lineTo(cx + s * (sh + 9), y0 + 8 + i * 8); ctx.stroke(); }
    }
    // collar + katana at the shoulder (§14a)
    const cw = fit(sh, 18);
    ctx.fillStyle = shade(P.base, 0.55); ctx.beginPath(); ctx.moveTo(cx - cw, y0 - 8); ctx.lineTo(cx - cw - 4, y0 + 26); ctx.lineTo(cx + cw + 4, y0 + 26); ctx.lineTo(cx + cw, y0 - 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx + 40, y0 + 4); ctx.lineTo(cx + 88, y0 - 44); ctx.stroke();
    ctx.strokeStyle = P.trim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 36, y0 + 8); ctx.lineTo(cx + 46, y0 - 2); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 37 + i * 2.4, y0 + 6 - i * 2.4); ctx.lineTo(cx + 39 + i * 2.4, y0 + 8 - i * 2.4); ctx.stroke(); }
    if (o.clanKnot) { ctx.fillStyle = P.trim; ctx.beginPath(); ctx.arc(cx, y0 + 16, 4.5, 0, Math.PI * 2); ctx.fill(); }
    garmentLight(ctx, cx, y0, sh);
  },
  // shinobi shōzoku: wrap top with crossed chest ties, forearm wraps, face cowl
  shinobi(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'v'); ctx.fillStyle = P.base; ctx.fill();
    ctx.fillStyle = shade(P.base, 0.8);                               // under-layer in the V
    const vw = fit(sh, 16);
    ctx.beginPath(); ctx.moveTo(cx - vw, y0 + 2); ctx.lineTo(cx, y0 + 30); ctx.lineTo(cx + vw, y0 + 2); ctx.lineTo(cx + vw - 4, y0 - 4); ctx.lineTo(cx - vw + 4, y0 - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.trim; ctx.lineWidth = 3;                      // crossed ties
    ctx.beginPath(); ctx.moveTo(cx - sh * 0.55, y0 + 22); ctx.lineTo(cx + sh * 0.45, y0 + 78); ctx.moveTo(cx + sh * 0.55, y0 + 22); ctx.lineTo(cx - sh * 0.45, y0 + 78); ctx.stroke();
    ctx.strokeStyle = shade(P.base, 1.3); ctx.lineWidth = 1.2;        // wrap seams on the arms
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx + s * (sh * 0.55), y0 + 30 + i * 12); ctx.lineTo(cx + s * (sh + 2), y0 + 36 + i * 12); ctx.stroke(); }
    if (o.clanKnot) { ctx.fillStyle = P.trim; ctx.beginPath(); ctx.arc(cx, y0 + 30, 4, 0, Math.PI * 2); ctx.fill(); }
    garmentLight(ctx, cx, y0, sh);
  },
  // pirate: open shirt, brocade coat with wide lapels, sash, earring
  pirate(ctx, o, cx, y0, sh, P) {
    // shirt (cream) with open neck over skin
    ctx.fillStyle = '#e8e2d2';
    ctx.beginPath(); ctx.moveTo(cx - sh / 2 - 4, y0 + 6); ctx.lineTo(cx - 24, y0 + 10); ctx.quadraticCurveTo(cx, y0 + 48, cx + 24, y0 + 10); ctx.lineTo(cx + sh / 2 + 4, y0 + 6); ctx.lineTo(cx + sh / 2 + 6, H); ctx.lineTo(cx - sh / 2 - 6, H); ctx.closePath(); ctx.fill();
    // coat
    ctx.fillStyle = P.base;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * (sh / 2 - 14), y0); ctx.quadraticCurveTo(cx + s * (sh - 6), y0 + 10, cx + s * (sh + 2), H); ctx.lineTo(cx + s * 30, H); ctx.lineTo(cx + s * 22, y0 + 60); ctx.lineTo(cx + s * 34, y0 + 8); ctx.closePath(); ctx.fill(); }
    // wide turned lapels in brocade
    ctx.fillStyle = P.trim;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 34, y0 + 8); ctx.lineTo(cx + s * 52, y0 + 6); ctx.lineTo(cx + s * 26, y0 + 60); ctx.lineTo(cx + s * 22, y0 + 60); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = shade(P.trim, 0.7); ctx.lineWidth = 1.2;        // brocade sinusoid
    for (const s of [-1, 1]) { ctx.beginPath(); for (let t = 0; t <= 1; t += 0.05) { const x = cx + s * (44 - t * 18) + Math.sin(t * 24) * 1.6, y = y0 + 8 + t * 50; if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    // sash
    ctx.fillStyle = shade(P.trim, 0.85);
    ctx.beginPath(); ctx.moveTo(cx - sh, y0 + 92); ctx.lineTo(cx + sh, y0 + 84); ctx.lineTo(cx + sh, y0 + 104); ctx.lineTo(cx - sh, y0 + 112); ctx.closePath(); ctx.fill();
    if (o.pistol) { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.rect(cx + 24, y0 + 78, 22, 8); ctx.fill(); ctx.fillStyle = P.metal; ctx.beginPath(); ctx.arc(cx + 46, y0 + 82, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx + (o.sex === 'f' ? 24 : 26), EYE_Y + 10, 3, 0, Math.PI * 2); ctx.fill();   // earring
    garmentLight(ctx, cx, y0, sh);
  },
  // navy: double-breasted coat, epaulettes, white cross-belt, brass buttons, stock
  navy(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'high'); ctx.fillStyle = P.base; ctx.fill();
    ctx.fillStyle = '#e8e2d2';                                         // neck stock
    const sw = fit(sh, 12);
    ctx.beginPath(); ctx.moveTo(cx - sw, y0 - 8); ctx.lineTo(cx + sw, y0 - 8); ctx.lineTo(cx + sw - 4, y0 + 12); ctx.lineTo(cx - sw + 4, y0 + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(P.base, 0.75);                               // double-breasted front panel
    const pw = fit(sh, 30);
    ctx.beginPath(); ctx.moveTo(cx - pw, y0 + 16); ctx.lineTo(cx + pw, y0 + 16); ctx.lineTo(cx + pw - 4, H); ctx.lineTo(cx - pw + 4, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.trim; ctx.lineWidth = 5;                       // cross-belt
    ctx.beginPath(); ctx.moveTo(cx - sh * 0.55, y0 + 10); ctx.lineTo(cx + 26, H); ctx.stroke();
    const btn = [];
    for (let i = 0; i < 4; i++) { btn.push([cx - fit(sh, 12), y0 + 26 + i * 18]); btn.push([cx + fit(sh, 12), y0 + 26 + i * 18]); }
    for (const [x, y] of btn) { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = shade(GOLD, 1.3); ctx.beginPath(); ctx.arc(x - 1, y - 1, 1, 0, Math.PI * 2); ctx.fill(); }
    for (const s of [-1, 1]) {                                          // epaulettes with fringe
      const ex = cx + s * (sh - 14);
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.ellipse(ex, y0 + 6, fit(sh, 18), 8, s * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = shade(GOLD, 0.8); ctx.lineWidth = 1.2;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(ex + i * 4, y0 + 12); ctx.lineTo(ex + i * 4 + s * 3, y0 + 24); ctx.stroke(); }
    }
    garmentLight(ctx, cx, y0, sh);
  },
  // robe: high collar, layered front panel, embroidered hem line; optional gorget
  robe(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'high'); ctx.fillStyle = P.base; ctx.fill();
    ctx.fillStyle = shade(P.base, 1.12);
    const rw = fit(sh, 16);
    ctx.beginPath(); ctx.moveTo(cx - rw, y0 - 8); ctx.lineTo(cx + rw, y0 - 8); ctx.lineTo(cx + rw + 6, H); ctx.lineTo(cx - rw - 6, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.trim; ctx.lineWidth = 1.6;                    // embroidered edges
    ctx.beginPath(); ctx.moveTo(cx - rw, y0 - 8); ctx.lineTo(cx - rw - 6, H); ctx.moveTo(cx + rw, y0 - 8); ctx.lineTo(cx + rw + 6, H); ctx.stroke();
    ctx.beginPath(); for (let y = y0 + 10; y < H; y += 10) { ctx.moveTo(cx - rw - 4, y); ctx.lineTo(cx - rw - 1, y + 4); ctx.moveTo(cx + rw + 4, y); ctx.lineTo(cx + rw + 1, y + 4); } ctx.stroke();
    if (o.stole) { ctx.fillStyle = P.trim; ctx.beginPath(); ctx.moveTo(cx - sh * 0.48, y0 + 2); ctx.lineTo(cx - rw - 6, y0 + 4); ctx.lineTo(cx - sh * 0.42, H); ctx.lineTo(cx - sh * 0.62, H); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + sh * 0.48, y0 + 2); ctx.lineTo(cx + rw + 6, y0 + 4); ctx.lineTo(cx + sh * 0.42, H); ctx.lineTo(cx + sh * 0.62, H); ctx.closePath(); ctx.fill(); }
    if (o.pendant) { ctx.strokeStyle = P.metal; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, y0 - 2, 14, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.fillStyle = P.metal; ctx.beginPath(); ctx.moveTo(cx, y0 + 10); ctx.lineTo(cx - 4, y0 + 16); ctx.lineTo(cx, y0 + 22); ctx.lineTo(cx + 4, y0 + 16); ctx.closePath(); ctx.fill(); }
    if (o.gorget) { const gw = fit(sh, 22); ctx.fillStyle = P.metal; ctx.beginPath(); ctx.moveTo(cx - gw, y0 - 6); ctx.lineTo(cx - gw - 2, y0 + 18); ctx.quadraticCurveTo(cx, y0 + 26, cx + gw + 2, y0 + 18); ctx.lineTo(cx + gw, y0 - 6); ctx.closePath(); ctx.fill(); }
    folds(ctx, cx, y0, sh, '#000000', 4);
    garmentLight(ctx, cx, y0, sh);
  },
  // ranger: quilted jacket, leather shoulder strap with a quiver line, cap elsewhere
  ranger(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'round'); ctx.fillStyle = P.base; ctx.fill();
    ctx.strokeStyle = rgba('#000000', 0.22); ctx.lineWidth = 1;        // quilting
    for (let y = y0 + 20; y < H; y += 14) { ctx.beginPath(); ctx.moveTo(cx - sh, y); ctx.quadraticCurveTo(cx, y + 6, cx + sh, y); ctx.stroke(); }
    for (let x = -3; x <= 3; x++) { ctx.beginPath(); ctx.moveTo(cx + x * 14, y0 + 14); ctx.lineTo(cx + x * 15, H); ctx.stroke(); }
    ctx.strokeStyle = P.trim; ctx.lineWidth = 6;                       // strap
    ctx.beginPath(); ctx.moveTo(cx - sh / 2 - 8, y0 + 8); ctx.lineTo(cx + 20, H); ctx.stroke();
    ctx.strokeStyle = P.metal; ctx.lineWidth = 2;                      // quiver line + arrow nocks
    ctx.beginPath(); ctx.moveTo(cx + sh / 2 + 10, y0 - 30); ctx.lineTo(cx + sh / 2 + 22, y0 + 10); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx + sh / 2 + 6 + i * 4, y0 - 34 - i * 4); ctx.lineTo(cx + sh / 2 + 10 + i * 4, y0 - 26 - i * 4); ctx.stroke(); }
    rivets(ctx, [[cx - sh / 2 - 4, y0 + 14], [cx + 12, y0 + 90]], P.metal);
    garmentLight(ctx, cx, y0, sh);
  },
  // hide: asymmetric fur-and-hide wrap over one shoulder, bone necklace, bare other shoulder
  hide(ctx, o, cx, y0, sh, P) {
    ctx.fillStyle = P.base;                                            // wrap from left shoulder across
    ctx.beginPath(); ctx.moveTo(cx - sh - 2, H); ctx.lineTo(cx - sh + 2, y0 + 10); ctx.lineTo(cx - sh / 2 - 10, y0 - 2); ctx.lineTo(cx + 34, y0 + 50); ctx.lineTo(cx + 44, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(P.base, 0.6);                                // fur edge
    for (let i = 0; i < 9; i++) { const t = i / 8; const x = cx - sh / 2 - 10 + t * (sh / 2 + 44), y = y0 - 2 + t * 52; ctx.beginPath(); ctx.ellipse(x, y, 5, 8, 0.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = shade(P.base, 0.9);                                // lower wrap
    ctx.beginPath(); ctx.moveTo(cx - sh, H); ctx.lineTo(cx + sh, H); ctx.lineTo(cx + sh, y0 + 96); ctx.quadraticCurveTo(cx, y0 + 86, cx - sh, y0 + 96); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8e2d2'; ctx.lineWidth = 1.4;                  // bone necklace
    ctx.beginPath(); ctx.arc(cx, y0 + 6, 20, 0.25, Math.PI - 0.25); ctx.stroke();
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 8, y0 + 22 - Math.abs(i) * 2); ctx.lineTo(cx + i * 8 + 1, y0 + 30 - Math.abs(i) * 2); ctx.stroke(); }
    garmentLight(ctx, cx, y0, sh);
  },
  // dress: neckline sits on the chest; statement jewellery
  dress(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'scoop'); ctx.fillStyle = P.base; ctx.fill();
    ctx.strokeStyle = P.trim; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - sh / 2 - 8, y0 + 4); ctx.quadraticCurveTo(cx, y0 + 26, cx + sh / 2 + 8, y0 + 4); ctx.stroke();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(cx, y0 + 4, 18, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx, y0 + 22, 4, 0, Math.PI * 2); ctx.fill();
    folds(ctx, cx, y0, sh, '#000000', 5);
    garmentLight(ctx, cx, y0, sh);
  },
  // duelist: fitted coat, stand collar, sash, rapier guard at the hip line
  duelist(ctx, o, cx, y0, sh, P) {
    ctx.fillStyle = '#e8e2d2';                                         // shirt
    ctx.beginPath(); ctx.moveTo(cx - 18, y0 - 4); ctx.lineTo(cx, y0 + 30); ctx.lineTo(cx + 18, y0 - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.base;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 18, y0 - 6); ctx.lineTo(cx + s * (sh / 2 + 8), y0 + 2); ctx.quadraticCurveTo(cx + s * (sh + 2), y0 + 16, cx + s * (sh + 2), H); ctx.lineTo(cx + s * 4, H); ctx.lineTo(cx + s * 2, y0 + 40); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = shade(P.base, 1.3);                                // stand collar
    ctx.beginPath(); ctx.moveTo(cx - 22, y0 - 10); ctx.lineTo(cx - 30, y0 + 6); ctx.lineTo(cx - 18, y0 - 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 22, y0 - 10); ctx.lineTo(cx + 30, y0 + 6); ctx.lineTo(cx + 18, y0 - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.trim;                                            // sash
    ctx.beginPath(); ctx.moveTo(cx - sh, y0 + 96); ctx.lineTo(cx + sh, y0 + 88); ctx.lineTo(cx + sh, y0 + 106); ctx.lineTo(cx - sh, y0 + 114); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.metal; ctx.lineWidth = 2;                      // rapier guard
    ctx.beginPath(); ctx.arc(cx - sh + 8, y0 + 100, 7, 0, Math.PI * 2); ctx.stroke();
    rivets(ctx, [[cx - 4, y0 + 50], [cx - 4, y0 + 66], [cx - 4, y0 + 82]], P.metal);
    garmentLight(ctx, cx, y0, sh);
  },
  // street: hooded jacket, cloth mask, patched shoulder
  street(ctx, o, cx, y0, sh, P) {
    garmentShape(ctx, cx, y0, sh, 'round'); ctx.fillStyle = P.base; ctx.fill();
    ctx.fillStyle = shade(P.base, 0.8);                                // hood bunched at the neck
    ctx.beginPath(); ctx.ellipse(cx, y0 + 10, 36, 14, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = P.trim;                                            // patch
    ctx.beginPath(); ctx.rect(cx + sh / 2 - 6, y0 + 18, 22, 18); ctx.fill();
    ctx.strokeStyle = shade(P.trim, 0.6); ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(cx + sh / 2 - 4, y0 + 20, 18, 14); ctx.setLineDash([]);
    ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, y0 + 24); ctx.lineTo(cx, H); ctx.stroke();  // zip line
    folds(ctx, cx, y0, sh, '#000000', 3);
    garmentLight(ctx, cx, y0, sh);
  },
};

function drawCloak(ctx, cx, y0, sh, col) {
  ctx.fillStyle = shade(col, 0.55);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * (sh - 8), y0 + 8);
    ctx.quadraticCurveTo(cx + s * (sh + 12), y0 + 40, cx + s * (sh + 6), H);
    ctx.lineTo(cx + s * (sh / 2 + 2), H);
    ctx.quadraticCurveTo(cx + s * (sh / 2 + 8), y0 + 30, cx + s * (sh / 2 - 10), y0 + 4);
    ctx.closePath(); ctx.fill();
  }
}

// draws body then costume; returns geometry for callers
function drawWardrobe(ctx, o, cx) {
  const skin = o.skin[0];
  const { y0, sh } = drawBody(ctx, o, cx, skin);
  const pat = o.pattern || KIND_PATTERN[o.wardrobe] || 'ranger';
  const P = palette(o);
  if (o.cloak) drawCloak(ctx, cx, y0, sh, P.base);
  (PATTERNS[pat] || PATTERNS.ranger)(ctx, o, cx, y0, sh, P);
  tailorGarment(ctx, o, cx, y0, sh, pat, P);
  return { y0, sh, open: !!OPEN_NECK[pat] };
}

// Shared material and tailoring pass: clipped to the garment, below face/hair.
function tailorGarment(ctx,o,cx,y,sh,pat,P) {
  const metal=/plate|lamellar|navy/.test(pat), ninja=pat==='shinobi';
  ctx.save();
  // Exclude neckline and skin. Existing patterns own their collar and fastenings.
  ctx.beginPath();ctx.moveTo(cx-sh+10,y+26);ctx.lineTo(cx-27,y+31);ctx.lineTo(cx,y+51);ctx.lineTo(cx+27,y+31);ctx.lineTo(cx+sh-10,y+26);ctx.lineTo(cx+sh,H);ctx.lineTo(cx-sh,H);ctx.closePath();ctx.clip();
  const key=ctx.createLinearGradient(cx-sh,y,cx+sh,y+90);
  key.addColorStop(0,'rgba(241,225,190,.17)');key.addColorStop(.36,'rgba(255,242,211,.07)');key.addColorStop(.65,'rgba(0,0,0,.03)');key.addColorStop(1,'rgba(5,9,16,.32)');
  ctx.fillStyle=key;ctx.fillRect(cx-sh,y,sh*2,H-y);
  // Cloth follows an adult bust; plate uses one shaped cuirass, with subtle form light.
  if(o.sex==='f') {
    const b=buildOf(o).bust || .9, yy=y+57;
    for(const side of [-1,1]) {
      softEllipse(ctx,cx+side*23,yy,25*b,21,'#f3dfbc',metal?.17:.14);
      ctx.strokeStyle='rgba(5,8,15,.25)';ctx.lineWidth=metal?2:1.5;
      ctx.beginPath();ctx.moveTo(cx+side*43,yy-2);ctx.quadraticCurveTo(cx+side*44,yy+23,cx+side*7,yy+23);ctx.stroke();
      ctx.strokeStyle='rgba(244,227,198,.17)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+side*10,yy+30);ctx.quadraticCurveTo(cx+side*25,yy+39,cx+side*31,H);ctx.stroke();
    }
    softEllipse(ctx,cx,y+95,12,27,'#040710',.2);
  }
  // Small seams / rivets / grain follow the material rather than a full-screen texture.
  for(const side of [-1,1]) {
    ctx.strokeStyle='rgba(4,7,13,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+side*(sh-16),y+28);ctx.quadraticCurveTo(cx+side*(sh-28),y+65,cx+side*(sh-19),H);ctx.stroke();
    ctx.strokeStyle='rgba(231,211,172,.36)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+side*(sh-18),y+28);ctx.quadraticCurveTo(cx+side*(sh-30),y+65,cx+side*(sh-21),H);ctx.stroke();
    for(let yy=y+38;yy<H;yy+=metal?18:7){ctx.fillStyle=metal?'#b7a787':'rgba(211,193,158,.25)';ctx.fillRect(cx+side*(sh-20),yy,metal?2:1,metal?2:2);}
  }
  if(metal){for(let i=0;i<9;i++){const xx=cx-sh+12+i*17,yy=y+45+(i*13)%60;ctx.strokeStyle='rgba(239,233,209,.13)';ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+3,yy-8);ctx.stroke();}}
  else {ctx.strokeStyle='rgba(236,221,189,.035)';ctx.lineWidth=.7;for(let yy=y+30;yy<H;yy+=4){ctx.beginPath();ctx.moveTo(cx-sh,yy);ctx.lineTo(cx+sh,yy+8);ctx.stroke();}}
  if(ninja) {
    for(const side of [-1,1]){ctx.fillStyle='#121c29';ctx.beginPath();ctx.moveTo(cx+side*25,y+19);ctx.lineTo(cx+side*40,y+23);ctx.lineTo(cx+side*19,H);ctx.lineTo(cx+side*7,H);ctx.closePath();ctx.fill();ctx.strokeStyle='#5b6975';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+side*28,y+23);ctx.lineTo(cx+side*11,H);ctx.stroke();}
    for(let i=0;i<3;i++){ctx.fillStyle='#161b23';ctx.fillRect(cx+29+i*8,y+66,6,24);ctx.fillStyle='#9dabb0';ctx.beginPath();ctx.moveTo(cx+30+i*8,y+66);ctx.lineTo(cx+32+i*8,y+54);ctx.lineTo(cx+34+i*8,y+66);ctx.fill();}
  }
  // Distinct identity accents for sets whose cut is shared.
  const id=o.setId||'';
  if(/green|wild|hunter/.test(id))for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#789476':'#506b55';ctx.beginPath();ctx.ellipse(cx-39+i*4,y+36+i*8,4,9,-.8,0,Math.PI*2);ctx.fill();}
  if(/shadow|assassin/.test(id)){ctx.strokeStyle='#8875a0';ctx.lineWidth=1.4;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx-40+i*5,y+40);ctx.lineTo(cx-34+i*5,y+53);ctx.lineTo(cx-28+i*5,y+40);ctx.stroke();}}
  if(/mage|adept|chantry/.test(id)){ctx.strokeStyle='#b7b1db';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.strokeRect(cx+34,y+37+i*14,5,5);}}
  if(/green_eyed/.test(id)){ctx.fillStyle='#173a2d';ctx.beginPath();ctx.ellipse(cx,y+70,13,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b3e59d';ctx.beginPath();ctx.ellipse(cx,y+70,3,6,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function fittedMask(ctx,o,cx,hw) {
  const half=hw/2+6, base=(o.palette&&o.palette.base)||'#202934';
  ctx.save();
  const g=ctx.createLinearGradient(cx-half,125,cx+half,164);g.addColorStop(0,shade(base,1.35));g.addColorStop(.45,base);g.addColorStop(1,shade(base,.55));
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx-half,126);ctx.lineTo(cx-9,127);ctx.quadraticCurveTo(cx,119,cx+9,127);ctx.lineTo(cx+half,126);ctx.lineTo(cx+half-5,149);ctx.quadraticCurveTo(cx,177,cx-half+5,149);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(164,182,192,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-half+2,129);ctx.lineTo(cx-8,130);ctx.quadraticCurveTo(cx,123,cx+8,130);ctx.lineTo(cx+half-2,129);ctx.stroke();
  for(let i=0;i<3;i++){ctx.strokeStyle=i%2?'rgba(168,184,196,.18)':'rgba(0,0,0,.3)';ctx.beginPath();ctx.moveTo(cx-half+5,135+i*7);ctx.quadraticCurveTo(cx,144+i*7,cx+half-5,135+i*7);ctx.stroke();}
  ctx.restore();
}
function liftFur(hex) { const n=parseInt(hex.slice(1),16);return '#'+[n>>16&255,n>>8&255,n&255].map(v=>Math.max(42,v).toString(16).padStart(2,'0')).join(''); }
function enemyInsignia(ctx,o,color) {
  let seed=0;for(const c of (o.variant||'enemy')+(color||''))seed=(seed*31+c.charCodeAt(0))>>>0;
  const y=216,x=seed%2?61:159;
  ctx.save();ctx.strokeStyle=o.boss?'#d2b578':'#9e9987';ctx.fillStyle=o.boss?'#5d2928':'#303c42';ctx.lineWidth=o.boss?2:1;
  ctx.beginPath();ctx.moveTo(x-9,y-12);ctx.lineTo(x+9,y-12);ctx.lineTo(x+8,y+5);ctx.lineTo(x,y+12);ctx.lineTo(x-8,y+5);ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=0;i<1+seed%3;i++){ctx.beginPath();ctx.moveTo(x-5,y-6+i*5);ctx.lineTo(x+5,y-6+i*5);ctx.stroke();}
  if(o.boss){for(const side of [-1,1]){ctx.strokeStyle='#be9e62';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(110+side*40,197);ctx.quadraticCurveTo(110+side*66,199,110+side*71,223);ctx.stroke();}}
  ctx.restore();
}
function creatureDetail(ctx,rig,type,o,color) {
  let seed=73;for(const ch of type+(color||''))seed=(seed*31+ch.charCodeAt(0))>>>0;
  const rng=rngFor(seed),c=rig.fur||color||'#59615f',kind=rig.rig;
  ctx.save();
  // Detail sits on cheek/body surfaces, leaving the expression rig unobstructed.
  for(const side of [-1,1])for(let i=0;i<24;i++){
    const x=110+side*(24+i%4*6+Math.sin(Math.floor(i/4)*1.3)*2),y=139+Math.floor(i/4)*7+(i%4%2)*3;
    ctx.strokeStyle=rgba(shade(c,1.9),.4);ctx.lineWidth=.9;
    if(kind==='serpent'||kind==='insect'||kind==='crab'){
      ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x,y+3);ctx.lineTo(x+3,y);ctx.stroke();
    }else if(kind==='plant'){
      ctx.strokeStyle=rgba('#b0c58e',.5);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-side*4,y-7);ctx.lineTo(x-side*5,y-10);ctx.stroke();
    }else if(kind==='bird'){
      ctx.fillStyle=rgba(shade(c,1.5),.5);ctx.beginPath();ctx.ellipse(x,y,3,8,side*.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=rgba(shade(c,.5),.6);ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+side*2,y+5);ctx.stroke();
    }else {
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*(3+rng.int(0,3)),y+5);ctx.stroke();
    }
  }
  if(kind==='serpent')for(let i=0;i<7;i++){ctx.strokeStyle=rgba(shade(c,.4),.45);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(99,144+i*4);ctx.quadraticCurveTo(110,149+i*4,121,144+i*4);ctx.stroke();}
  if(kind==='bird'){ctx.strokeStyle='#f3d4a0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(109,128);ctx.lineTo(106,144);ctx.stroke();}
  if(kind==='plant'){for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#718c62':'#536f51';ctx.beginPath();ctx.ellipse(67+i*4,142+i*7,5,10,-.7,0,Math.PI*2);ctx.fill();}}
  if(o.boss){ctx.strokeStyle=rgba('#dbd0b7',.8);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(139,119);ctx.lineTo(148,141);ctx.moveTo(142,118);ctx.lineTo(152,138);ctx.stroke();}
  ctx.restore();
}

// ---- face (Part F) ------------------------------------------------------------
function drawEye(ctx, cx, s, o, skin) {
  const ex = cx + s * EYE_DX, ey = EYE_Y;
  const ew = 7.5, eh = o.sex === 'f' ? 5.5 : 4.6;
  // almond white: lens shape, slightly heavier upper curve
  ctx.fillStyle = '#f2ede2';
  ctx.beginPath();
  ctx.moveTo(ex - ew, ey + 0.5);
  ctx.quadraticCurveTo(ex, ey - eh - 1.5, ex + ew, ey + 0.5);
  ctx.quadraticCurveTo(ex, ey + eh, ex - ew, ey + 0.5);
  ctx.closePath(); ctx.fill();
  // iris: radial gradient with a limbal ring
  const ix = ex + 1, iy = ey + 0.3;
  const g = ctx.createRadialGradient(ix - 0.6, iy - 0.6, 0.4, ix, iy, 3.6);
  g.addColorStop(0, shade(o.eyes, 1.55)); g.addColorStop(0.75, o.eyes); g.addColorStop(1, shade(o.eyes, 0.55));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix, iy, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#131313'; ctx.beginPath(); ctx.arc(ix, iy, 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ix - 1.3, iy - 1.2, 0.9, 0, Math.PI * 2); ctx.fill();   // specular, lit side
  // upper lid line (heavier) + lower lid line (faint)
  ctx.strokeStyle = shade(skin, 0.5); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ex - ew, ey + 0.5); ctx.quadraticCurveTo(ex, ey - eh - 1.5, ex + ew, ey + 0.5); ctx.stroke();
  ctx.strokeStyle = rgba(shade(skin, 0.6), 0.45); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ex - ew + 1, ey + 1); ctx.quadraticCurveTo(ex, ey + eh, ex + ew - 1, ey + 1); ctx.stroke();
  if (o.sex === 'f') { ctx.strokeStyle = shade(skin, 0.4); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex + s * ew, ey + 0.5); ctx.lineTo(ex + s * (ew + 2.2), ey - 1.4); ctx.stroke(); } // lash flick
  // brow-ridge shadow under the brow
  softEllipse(ctx, ex, ey - 7, 9, 3, '#000000', 0.12);
}

function drawFace(ctx, o, cx, skin, headW) {
  // temple / cheekbone plane on the shaded (right) side; cheek light on the lit side
  softEllipse(ctx, cx + headW / 2 - 6, EYE_Y + 16, 12, 16, '#000000', 0.16);
  softEllipse(ctx, cx - headW / 2 + 12, EYE_Y + 12, 10, 8, '#ffffff', 0.09);
  for (const s of [-1, 1]) drawEye(ctx, cx, s, o, skin);
  // brows (resting face) — thickness by sex, arch by o.brow
  for (const s of [-1, 1]) {
    ctx.strokeStyle = shade(o.hairColor, 0.8); ctx.lineWidth = o.sex === 'f' ? 2 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + s * (EYE_DX - 8), EYE_Y - 11 + o.brow);
    ctx.quadraticCurveTo(cx + s * EYE_DX, EYE_Y - 14, cx + s * (EYE_DX + 8), EYE_Y - 10 - o.brow);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  // nose: bridge shadow (shaded side), nostril pair, tip highlight
  softEllipse(ctx, cx + 3.5, EYE_Y + 12, 2.4, 7, '#000000', 0.22);
  ctx.strokeStyle = shade(skin, 0.7); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cx + 1, EYE_Y + 8); ctx.quadraticCurveTo(cx + 4, EYE_Y + 17, cx + 1, EYE_Y + 20); ctx.stroke();
  ctx.fillStyle = rgba(shade(skin, 0.5), 0.7);
  ctx.beginPath(); ctx.ellipse(cx - 3, EYE_Y + 20.5, 1.7, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 3.6, EYE_Y + 20.5, 1.7, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(cx - 0.5, EYE_Y + 17, 1.3, 0, Math.PI * 2); ctx.fill();
  // mouth: two-tone lips the expression curve later deforms; philtrum shadow above
  // A ninja mask covers this — do not bake lips under cloth or they show through.
  if (!o.masked) {
    const my = EYE_Y + 30, curve = o.mouth;
    softEllipse(ctx, cx, my - 5, 2.2, 3, '#000000', 0.12);
    const lipDark = o.sex === 'f' ? '#7a3a34' : shade(skin, 0.6);
    const lipLight = o.sex === 'f' ? '#a85a50' : shade(skin, 0.8);
    ctx.fillStyle = lipDark;                                             // upper lip
    ctx.beginPath(); ctx.moveTo(cx - 8, my); ctx.quadraticCurveTo(cx - 3, my - 2.6, cx, my - 1.4); ctx.quadraticCurveTo(cx + 3, my - 2.6, cx + 8, my); ctx.quadraticCurveTo(cx, my + curve * 0.4 + 0.6, cx - 8, my); ctx.fill();
    ctx.fillStyle = lipLight;                                            // lower lip
    ctx.beginPath(); ctx.moveTo(cx - 7, my + 0.6); ctx.quadraticCurveTo(cx, my + 4.4 + curve * 0.5, cx + 7, my + 0.6); ctx.quadraticCurveTo(cx, my + 1.4 + curve * 0.4, cx - 7, my + 0.6); ctx.fill();
    ctx.strokeStyle = shade(lipDark, 0.7); ctx.lineWidth = o.sex === 'f' ? 1.4 : 1.1;  // parting line
    ctx.beginPath(); ctx.moveTo(cx - 8, my); ctx.quadraticCurveTo(cx, my + curve, cx + 8, my); ctx.stroke();
    ctx.fillStyle = rgba(shade(skin, 0.5), 0.5);                        // corner dots
    ctx.beginPath(); ctx.arc(cx - 8.4, my + curve * 0.15, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8.4, my + curve * 0.15, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  // skin variety: freckles (30% of seeds), undertone already applied in recipe
  if (o.freckles) {
    ctx.fillStyle = rgba(shade(skin, 0.6), 0.55);
    const r = rngFor(o.freckleSeed || 7);
    for (let i = 0; i < o.freckles; i++) { const fx = cx + r.int(-22, 22), fy = EYE_Y + 10 + r.int(0, 14); if (Math.abs(fx - cx) < 6) continue; ctx.beginPath(); ctx.arc(fx, fy, 0.8, 0, Math.PI * 2); ctx.fill(); }
  }
  // age lines at rank 6+: crow's-feet and nasolabial
  if ((o.rank || 1) >= 6) {
    ctx.strokeStyle = rgba(shade(skin, 0.55), 0.6); ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * (EYE_DX + 8), EYE_Y - 1); ctx.lineTo(cx + s * (EYE_DX + 12), EYE_Y - 3); ctx.moveTo(cx + s * (EYE_DX + 8), EYE_Y + 1); ctx.lineTo(cx + s * (EYE_DX + 12), EYE_Y + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s * 6, EYE_Y + 22); ctx.quadraticCurveTo(cx + s * 12, EYE_Y + 30, cx + s * 11, EYE_Y + 36); ctx.stroke();
    }
  }
}

// seeded strand groups over the hair silhouette: darker following strokes and a
// couple of highlights on the lit side. Called after hairFront.
function hairStrands(ctx, o, cx, headW) {
  const s = o.hairStyle;
  if (s === 'bald' || s === 'hood' || s === 'buzz') return;
  const r = rngFor((o.strandSeed || 3) * 31 + 7);
  const dark = shade(o.hairColor, 0.62), light = shade(o.hairColor, 1.45);
  const n = r.int(4, 7);
  ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x0 = cx - headW / 2 + 6 + (i / (n - 1)) * (headW - 12) + r.int(-3, 3);
    ctx.strokeStyle = rgba(dark, 0.55);
    ctx.beginPath(); ctx.moveTo(x0, EYE_Y - 44 + r.int(-3, 3)); ctx.quadraticCurveTo(x0 + r.int(-6, 6), EYE_Y - 30, x0 + (o.fringe || 0) * 0.3 + r.int(-4, 4), EYE_Y - 18 + r.int(-3, 3)); ctx.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const x0 = cx - headW / 2 + 8 + i * 7;
    ctx.strokeStyle = rgba(light, 0.35);
    ctx.beginPath(); ctx.moveTo(x0, EYE_Y - 42); ctx.quadraticCurveTo(x0 + 2, EYE_Y - 32, x0 + 4, EYE_Y - 24); ctx.stroke();
  }
  // fringe shadow onto the forehead
  softEllipse(ctx, cx, EYE_Y - 20, headW / 2 - 4, 4, '#000000', 0.14);
  ctx.lineCap = 'butt';
}

// bounding boxes recorded for overlays: hair-front region (Part E hair shear)
function hairFrontBox(o, headW) {
  return { x: W / 2 - headW / 2 - 10, y: EYE_Y - 52, w: headW + 20, h: 36 };
}

function drawBust(ctx, o) {
  // o: {bg, skin:[base,hi], hairColor, hairStyle, sex, build, wardrobe, pattern, palette, eyes, jaw, extras}
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = o.bg || BG[0];
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const skin = o.skin[0];
  const headW = 46 + o.jaw * 4, headH = 60;
  const chinY = chinYOf(o);

  // torso + costume, then hair behind the body, then the head over both
  ctx.fillStyle = o.hairColor;
  hairBack(ctx, o, cx, headW);
  drawWardrobe(ctx, o, cx);

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, EYE_Y + 2, headW / 2 + 6, headH / 2 + 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - headW / 2 - 4, EYE_Y + 8);
  ctx.quadraticCurveTo(cx - headW / 2 - (o.sex === 'f' ? 2 : 0), EYE_Y + (o.sex === 'f' ? 30 : 36), cx, chinY);
  ctx.quadraticCurveTo(cx + headW / 2 + (o.sex === 'f' ? 2 : 0), EYE_Y + (o.sex === 'f' ? 30 : 36), cx + headW / 2 + 4, EYE_Y + 8);
  ctx.fill();
  // lighting key: consistent left-high light, right shade (§1a)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx + headW / 4 + 4, EYE_Y + 6, headW / 3.2, headH / 2 + 8, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.ellipse(cx - headW / 4, EYE_Y - 12, headW / 4, headH / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.fillStyle = shade(skin, 0.92);
  ctx.beginPath(); ctx.ellipse(cx - headW / 2 - 5, EYE_Y + 6, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + headW / 2 + 5, EYE_Y + 6, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = rgba(shade(skin, 0.6), 0.5); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx - headW / 2 - 5, EYE_Y + 6, 2.5, 5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx + headW / 2 + 5, EYE_Y + 6, 2.5, 5, 0, 0, Math.PI * 2); ctx.stroke();

  drawFace(ctx, o, cx, skin, headW);

  // veteran marks — a scar past a few contracts
  if ((o.quests || 0) >= 6 || (o.rank || 1) >= 3) {
    const side = ((o.quests || 0) + (o.rank || 0)) % 2 ? 1 : -1;
    ctx.strokeStyle = shade(skin, 0.52);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(cx + side * 16, EYE_Y + 1);
    ctx.lineTo(cx + side * 26, EYE_Y + 20);
    ctx.stroke();
  }

  // hair front + strands; rim light on the lit side of the silhouette
  ctx.fillStyle = o.hairColor;
  hairFront(ctx, o, cx, headW);
  hairStrands(ctx, o, cx, headW);
  ctx.strokeStyle = rgba(shade(o.hairColor, 1.8), 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, EYE_Y - 8, headW / 2 + 10, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
  // stubble / beard is men only — never on a woman's jaw
  if (o.sex === 'm' && o.beard) {
    ctx.fillStyle = shade(o.hairColor, 0.7);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y + 34, 15 + o.jaw * 2, 11 + o.jaw, 0, 0.15, Math.PI - 0.15);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (o.extras) o.extras(ctx, cx, o);
  drawHeadwear(ctx, o, cx);
  if (o.masked) fittedMask(ctx, o, cx, headWOf(o));
  return { headW, hairBox: hairFrontBox(o, headW) };
}

// hair silhouettes — the primary differentiator (§1a)
function hairBack(ctx, o, cx, headW) {
  const s = o.hairStyle;
  const f = o.sex === 'f';
  if (s === 'long') {
    // Crown mass, then two shoulder-length curtains with a neck gap so the
    // hair cannot wrap the chin.
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 18, headW / 2 + 16, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    const gap = f ? 12 : 10;
    ctx.beginPath();
    ctx.moveTo(cx - headW / 2 - 18, EYE_Y + 4);
    ctx.quadraticCurveTo(cx - headW / 2 - 34, EYE_Y + 56, cx - 40, EYE_Y + 116);
    ctx.lineTo(cx - gap, EYE_Y + 116);
    ctx.quadraticCurveTo(cx - 18, EYE_Y + 50, cx - headW / 2 - 2, EYE_Y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + headW / 2 + 18, EYE_Y + 4);
    ctx.quadraticCurveTo(cx + headW / 2 + 34, EYE_Y + 56, cx + 40, EYE_Y + 116);
    ctx.lineTo(cx + gap, EYE_Y + 116);
    ctx.quadraticCurveTo(cx + 18, EYE_Y + 50, cx + headW / 2 + 2, EYE_Y + 10);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (s === 'braids' || s === 'dreads') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 28, headW / 2 + 2, 22, 0, Math.PI, 0);
    ctx.fill();
    const ids = f ? [-3.2, -2.2, -1.2, 1.2, 2.2, 3.2] : [-3, -2, -1, 0, 1, 2, 3];
    const long = f && s === 'braids';
    for (const i of ids) {
      ctx.beginPath();
      ctx.ellipse(cx + i * 11, EYE_Y + (long ? 72 : 54), long ? 4.2 : 4.5, long ? 56 : 30, i * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (s === 'afro') {
    ctx.beginPath();
    ctx.arc(cx, EYE_Y - 42, headW / 2 + 20, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (s === 'locs' || s === 'twists') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 16, headW / 2 + 14, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    const ids = f ? [-3.2, -2.2, -1.2, 1.2, 2.2, 3.2] : [-3, -2, -1, 0, 1, 2, 3];
    const thick = s === 'locs' ? 6 : 3.6;
    const drop = s === 'locs' ? (f ? 34 : 32) : 26;
    for (const i of ids) {
      ctx.beginPath();
      ctx.ellipse(cx + i * 11, EYE_Y + 60, thick, drop, i * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (s === 'cornrows') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 14, headW / 2 + 8, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y + 10, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (s === 'puff') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 14, headW / 2 + 8, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, EYE_Y - 52, 28, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (s === 'twa') {
    ctx.beginPath();
    ctx.arc(cx, EYE_Y - 20, headW / 2 + 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  if (s === 'ponytail') {
    ctx.ellipse(cx, EYE_Y - 10, headW / 2 + 10, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + headW / 2 + 16, EYE_Y + 26, 10, 46, -0.25, 0, Math.PI * 2);
  }
  else if (s === 'bun') {
    ctx.ellipse(cx, EYE_Y - 12, headW / 2 + 9, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, EYE_Y - 52, 14, 0, Math.PI * 2);
  }
  else { ctx.ellipse(cx, EYE_Y - 8, headW / 2 + 10, 46, 0, 0, Math.PI * 2); }
  ctx.fill();
}
function hairFront(ctx, o, cx, headW) {
  const s = o.hairStyle;
  ctx.beginPath();
  if (s === 'buzz' || s === 'bald' || s === 'twa' || s === 'puff' || s === 'locs' || s === 'twists') {
    if (s === 'buzz') { ctx.globalAlpha = 0.55; ctx.ellipse(cx, EYE_Y - 26, headW / 2 + 5, 24, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; }
    return;
  }
  if (s === 'afro') return;
  if (s === 'hood') return;
  if (s === 'cornrows') {
    ctx.strokeStyle = shade(o.hairColor, 0.7);
    ctx.lineWidth = 2.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 5, EYE_Y - 8);
      ctx.quadraticCurveTo(cx + i * 4, EYE_Y - 36, cx + i * 2, EYE_Y - 48);
      ctx.stroke();
    }
    ctx.fillStyle = o.hairColor;
    return;
  }
  // generic fringe
  ctx.moveTo(cx - headW / 2 - 8, EYE_Y - 8);
  ctx.quadraticCurveTo(cx - headW / 2, EYE_Y - 50, cx, EYE_Y - 46);
  ctx.quadraticCurveTo(cx + headW / 2, EYE_Y - 50, cx + headW / 2 + 8, EYE_Y - 8);
  ctx.quadraticCurveTo(cx + headW / 2 - 2, EYE_Y - 26, cx + (o.fringe || 0), EYE_Y - 22);
  ctx.quadraticCurveTo(cx - headW / 2 + 4, EYE_Y - 28, cx - headW / 2 - 8, EYE_Y - 8);
  ctx.fill();
  if (s === 'sidecut') {
    ctx.fillStyle = shade(o.hairColor, 0.5);
    ctx.beginPath(); ctx.rect(cx + headW / 2 - 8, EYE_Y - 34, 16, 22); ctx.fill();
    ctx.fillStyle = o.hairColor;
  }
}
function drawExtras(kind, col) {
  return (ctx, cx, o) => {
    const hw = headWOf(o), hr = hw / 2 + 16;
    if (kind === 'hood' || o.hairStyle === 'hood') {
      const hc = col || '#2a2d36';
      ctx.fillStyle = hc;
      ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 12, hr, hr + 10, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - hr, EYE_Y - 10); ctx.quadraticCurveTo(cx, EYE_Y - 70, cx + hr, EYE_Y - 10); ctx.fill();
    }
    if (kind === 'mask') {
      fittedMask(ctx, o, cx, hw);
    }
    if (kind === 'bandana') {
      ctx.fillStyle = col || '#8a3020';
  ctx.beginPath();
      ctx.moveTo(cx - hr + 2, EYE_Y - 8);
      ctx.quadraticCurveTo(cx, EYE_Y - 52, cx + hr - 2, EYE_Y - 8);
      ctx.lineTo(cx + hr - 6, EYE_Y + 4);
      ctx.quadraticCurveTo(cx, EYE_Y - 18, cx - hr + 6, EYE_Y + 4);
  ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + hr - 14, EYE_Y - 6);
      ctx.lineTo(cx + hr + 10, EYE_Y + 18);
      ctx.lineTo(cx + hr - 8, EYE_Y + 4);
      ctx.closePath(); ctx.fill();
    }
    if (kind === 'tricorne') {
      ctx.fillStyle = '#1c1c22';
    ctx.beginPath();
      ctx.moveTo(cx - hr - 12, EYE_Y - 16);
      ctx.quadraticCurveTo(cx, EYE_Y - 8, cx + hr + 12, EYE_Y - 16);
      ctx.quadraticCurveTo(cx + 20, EYE_Y - 54, cx, EYE_Y - 58);
      ctx.quadraticCurveTo(cx - 20, EYE_Y - 54, cx - hr - 12, EYE_Y - 16);
    ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d4a94e'; ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (kind === 'bicorne') {
      ctx.fillStyle = '#1a2030';
      ctx.beginPath();
      ctx.ellipse(cx, EYE_Y - 36, hr + 6, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - hr - 6, EYE_Y - 36);
      ctx.quadraticCurveTo(cx, EYE_Y - 72, cx + hr + 6, EYE_Y - 36);
      ctx.quadraticCurveTo(cx, EYE_Y - 44, cx - hr - 6, EYE_Y - 36);
      ctx.fill();
      ctx.fillStyle = '#d4a94e';
      ctx.beginPath(); ctx.arc(cx, EYE_Y - 40, 3, 0, Math.PI * 2); ctx.fill();
    }
  };
}
function drawHeadwear(ctx, o, cx) {
  const kind = o.headwear;
  const P = palette(o);
  const col = P.base;
  const hw = headWOf(o), hr = hw / 2 + 14;
  if (kind === 'helm') {
    ctx.fillStyle = shade(col, 1.15);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 18, hr, 36, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - hr, EYE_Y - 22, hr * 2, 18);
    ctx.fillStyle = shade(col, 0.7);
    ctx.fillRect(cx - hr + 4, EYE_Y - 12, hr * 2 - 8, 6);
    ctx.fillStyle = shade(col, 1.35);
    ctx.fillRect(cx - 4, EYE_Y - 52, 8, 34);
    rivets(ctx, [[cx - hr + 10, EYE_Y - 14], [cx - hr / 2, EYE_Y - 14], [cx, EYE_Y - 14], [cx + hr / 2, EYE_Y - 14], [cx + hr - 10, EYE_Y - 14]], P.metal);
    ctx.strokeStyle = rgba('#ffffff', 0.25); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, EYE_Y - 18, hr - 4, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
  } else if (kind === 'kabuto') {
    // samurai helm: bowl, neck guard flare, fukigaeshi turnbacks, maedate crest
    ctx.fillStyle = shade(col, 0.8);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 20, hr + 2, 34, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - hr - 2, EYE_Y - 22, (hr + 2) * 2, 12);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * hr, EYE_Y - 20); ctx.lineTo(cx + s * (hr + 16), EYE_Y - 30); ctx.lineTo(cx + s * (hr + 10), EYE_Y - 6); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = P.trim; ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * (hr / 3), EYE_Y - 52); ctx.lineTo(cx + i * (hr / 2.4), EYE_Y - 12); ctx.stroke(); }
    ctx.fillStyle = GOLD;                                              // crescent crest
    ctx.beginPath(); ctx.arc(cx, EYE_Y - 52, 16, Math.PI * 1.15, Math.PI * 1.85); ctx.arc(cx, EYE_Y - 46, 12, Math.PI * 1.85, Math.PI * 1.15, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, 0.6); ctx.fillRect(cx - hr + 2, EYE_Y - 10, hr * 2 - 4, 6);
  } else if (kind === 'cap') {
    ctx.fillStyle = shade(col, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 28, hr - 4, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(col, 0.65);
    ctx.beginPath(); ctx.ellipse(cx + 6, EYE_Y - 18, hr + 4, 8, 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.metal; ctx.beginPath(); ctx.arc(cx - hr + 16, EYE_Y - 28, 2, 0, Math.PI * 2); ctx.fill();  // pin
  } else if (kind === 'hood' && o.hairStyle !== 'hood') {
    ctx.fillStyle = shade(col, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 12, hr, hr + 10, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - hr, EYE_Y - 10); ctx.quadraticCurveTo(cx, EYE_Y - 70, cx + hr, EYE_Y - 10); ctx.fill();
    ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - hr + 6, EYE_Y - 12); ctx.quadraticCurveTo(cx, EYE_Y - 58, cx + hr - 6, EYE_Y - 12); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.fillStyle = shade(col, .7); ctx.beginPath();
      ctx.moveTo(cx + side * (hr - 4), EYE_Y - 24);
      ctx.quadraticCurveTo(cx + side * (hr + 10), EYE_Y + 16, cx + side * (hr + 15), EYE_Y + 58);
      ctx.lineTo(cx + side * 18, EYE_Y + 53);
      ctx.quadraticCurveTo(cx + side * (hw / 2 + 6), EYE_Y + 10, cx + side * (hr - 10), EYE_Y - 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#bdc7d1', .2); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx + side * (hr - 7), EYE_Y - 15); ctx.quadraticCurveTo(cx + side * (hr - 2), EYE_Y + 16, cx + side * 23, EYE_Y + 48); ctx.stroke();
    }
  } else if (kind === 'bicorne' || kind === 'tricorne' || kind === 'bandana') {
    drawExtras(kind, col)(ctx, cx, o);
  }
}

// ---- portrait recipes -------------------------------------------------------
// Creation portraits — slots 1–5 keep the original looks; 6–17 add
// more faces plus shinobi / samurai / privateer / Admiralty kits.
const SLOT_RECIPES = {
  1: { skin: 'dark',  tag: 'Look', f: { hair: 'afro', wardrobe: 'armor' },   m: { hair: 'buzz', wardrobe: 'armor' },   wardrobeColor: '#5a5f6e' },
  2: { skin: 'brown', tag: 'Look', f: { hair: 'braids', wardrobe: 'ninja' }, m: { hair: 'hood', wardrobe: 'ninja' },   wardrobeColor: '#2a2d36' },
  3: { skin: 'fair',  tag: 'Look', f: { hair: 'long', wardrobe: 'dress' },   m: { hair: 'short', wardrobe: 'suit' },   wardrobeColor: '#4a3550' },
  4: { skin: 'pale',  tag: 'Look', f: { hair: 'ponytail', wardrobe: 'hiking' }, m: { hair: 'short', wardrobe: 'hiking' }, wardrobeColor: '#4e5a3e' },
  5: { skin: 'tan',   tag: 'Look', f: { hair: 'long', wardrobe: 'hide' },    m: { hair: 'bun', wardrobe: 'hide' },     wardrobeColor: '#6e4a30' },
  // four more African-American looks, distinct hair on each face
  6: { skin: 'dark',  tag: 'Look', hairColor: '#191410', f: { hair: 'locs', wardrobe: 'dress' }, m: { hair: 'twists', wardrobe: 'armor' }, wardrobeColor: '#4a3550' },
  7: { skin: 'dark',  tag: 'Look', hairColor: '#2e2013', f: { hair: 'puff', wardrobe: 'hiking' }, m: { hair: 'twa', wardrobe: 'suit' }, wardrobeColor: '#3a4150' },
  8: { skin: 'brown', tag: 'Look', hairColor: '#191410', f: { hair: 'cornrows', wardrobe: 'hide' }, m: { hair: 'cornrows', wardrobe: 'hiking' }, wardrobeColor: '#6e4a30' },
  9: { skin: 'dark',  tag: 'Look', hairColor: '#3a3a3f', f: { hair: 'twists', wardrobe: 'robe' }, m: { hair: 'locs', wardrobe: 'robe', beard: true }, wardrobeColor: '#3f3a50' },
  // Hollow Bell / Green-Eyed shinobi
  10: { skin: 'tan',  tag: 'Shinobi', f: { hair: 'ponytail', wardrobe: 'ninja' }, m: { hair: 'hood', wardrobe: 'ninja' }, wardrobeColor: '#1a1c22' },
  11: { skin: 'fair', tag: 'Shinobi', f: { hair: 'bun', wardrobe: 'ninja' }, m: { hair: 'sidecut', wardrobe: 'ninja', extras: 'mask' }, wardrobeColor: '#2a3228' },
  // Green-Eyed / Bell samurai
  12: { skin: 'tan',  tag: 'Samurai', f: { hair: 'long', wardrobe: 'samurai' }, m: { hair: 'bun', wardrobe: 'samurai' }, wardrobeColor: '#38343e' },
  13: { skin: 'pale', tag: 'Samurai', f: { hair: 'ponytail', wardrobe: 'samurai' }, m: { hair: 'fringe', wardrobe: 'samurai' }, wardrobeColor: '#3a4a38' },
  // Red Tally privateers
  14: { skin: 'tan',  tag: 'Privateer', f: { hair: 'bandana', wardrobe: 'pirate', extras: 'bandana' }, m: { hair: 'fringe', wardrobe: 'pirate', extras: 'tricorne', beard: true }, wardrobeColor: '#503028' },
  15: { skin: 'brown', tag: 'Privateer', f: { hair: 'long', wardrobe: 'pirate', extras: 'bandana' }, m: { hair: 'dreads', wardrobe: 'pirate', extras: 'bandana', beard: true }, wardrobeColor: '#3a2a22' },
  // Admiralty
  16: { skin: 'fair', tag: 'Admiralty', f: { hair: 'bun', wardrobe: 'navy', extras: 'bicorne' }, m: { hair: 'fringe', wardrobe: 'navy', extras: 'bicorne' }, wardrobeColor: '#2a3a55' },
  17: { skin: 'pale', tag: 'Admiralty', f: { hair: 'ponytail', wardrobe: 'navy' }, m: { hair: 'buzz', wardrobe: 'navy', extras: 'bicorne' }, wardrobeColor: '#243048' },
};

// default per-kind palettes for bare wardrobe kinds (NPC randoms, creation slots)
const KIND_PALETTE = {
  ninja: { trim: '#3a3a44', metal: '#5a5a62' }, samurai: { trim: '#c8a24a', metal: '#1c1c22' },
  pirate: { trim: '#c8a24a', metal: '#b08a40' }, navy: { trim: '#e8e2d2', metal: '#d4a94e' },
  armor: { metal: '#a8adb8' }, robe: { trim: '#a89ab8', metal: '#a8adb8' }, hide: { trim: '#e8e2d2', metal: '#e8e2d2' },
  suit: { trim: '#7a2a2a', metal: '#a8adb8' }, hiking: { trim: '#5a4630', metal: '#8a7a50' }, dress: { trim: '#d4a94e' },
};

// seeded variety shared by player + NPC recipes (Part F/G)
function varietyFrom(r, sex, role) {
  const build = sex === 'f' ? r.pick(['lean', 'athletic', 'athletic', 'sturdy']) : r.pick(['lean', 'broad', 'broad', 'heavy']);
  return {
    build: role === 'tank' ? (sex === 'f' ? 'sturdy' : 'heavy') : role === 'mage' || role === 'healer' ? 'lean' : build,
    freckles: r.chance(0.3) ? r.int(4, 12) : 0, freckleSeed: r.int(1, 99999),
    strandSeed: r.int(1, 99999), warm: (r.int(-4, 4)) / 100,
  };
}
function finishRecipe(rec) {
  if (rec.warm && rec.skin) rec.skin = [tint(rec.skin[0], rec.warm), tint(rec.skin[1], rec.warm)];
  if (!rec.pattern) rec.pattern = KIND_PATTERN[rec.wardrobe] || 'ranger';
  if (!rec.palette) rec.palette = Object.assign({}, KIND_PALETTE[rec.wardrobe] || {});
  if (rec.pattern === 'pirate') rec.pistol = rec.sex === 'm';
  const ninja = rec.pattern === 'shinobi' || rec.wardrobe === 'ninja' || rec.extrasKind === 'mask';
  if (ninja && rec.headwear !== 'helm' && rec.headwear !== 'kabuto') rec.masked = true;
  return rec;
}

function recipePlayer(slot, sex, seed) {
  const r = rngFor(seed || (slot * 7919 + (sex === 'f' ? 13 : 29)));
  const rec = SLOT_RECIPES[slot] || SLOT_RECIPES[1];
  const v = rec[sex] || rec.m;
  const hair = v.hair === 'short' || v.hair === 'bandana' ? 'fringe' : v.hair;
  const extraKind = v.extras || (v.hair === 'hood' ? 'hood' : null);
  const out = Object.assign({
    bg: BG[slot % BG.length],
    skin: SKIN[rec.skin],
    hairColor: rec.hairColor || HAIR_COLORS[r.int(0, 4)],
    hairStyle: hair,
    sex, wardrobe: v.wardrobe, wardrobeColor: v.wardrobeColor || rec.wardrobeColor,
    eyes: r.pick(['#4a3520', '#2f4a2a', '#2a3a55', '#4a2a20']),
    jaw: sex === 'f' ? 0 : 1.5, brow: r.int(0, 2), mouth: r.int(0, 3), fringe: r.int(-6, 6),
    beard: sex === 'm' && !!v.beard,
    extrasKind: extraKind,
    extras: extraKind ? drawExtras(extraKind, v.wardrobeColor || rec.wardrobeColor) : null,
  }, varietyFrom(r, sex));
  if (v.wardrobe === 'samurai' && !extraKind) out.headwear = null;
  return finishRecipe(out);
}

function recipeNPC(sex, seed, role) {
  const r = rngFor(seed);
  const skins = Object.keys(SKIN).filter(k => k !== 'ashen');
  const styles = sex === 'f' ? ['long', 'braids', 'ponytail', 'bun', 'fringe', 'afro', 'sidecut']
                             : ['fringe', 'buzz', 'bun', 'dreads', 'afro', 'sidecut', 'bald'];
  const out = Object.assign({
    bg: BG[r.int(0, BG.length - 1)],
    skin: SKIN[r.pick(skins)],
    hairColor: r.pick(HAIR_COLORS),
    hairStyle: r.pick(styles),
    sex,
    wardrobe: r.pick(['armor', 'hiking', 'robe', 'suit', 'hide', 'ninja', 'dress']),
    wardrobeColor: r.pick(['#3a4150', '#504338', '#38503e', '#503a3a', '#3f3a50']),
    eyes: r.pick(['#4a3520', '#2f4a2a', '#2a3a55', '#4a2a20', '#3a3a3a']),
    jaw: sex === 'f' ? 0 : r.int(0, 3), brow: r.int(0, 3), mouth: r.int(-1, 3), fringe: r.int(-8, 8),
    beard: sex === 'm' && r.chance(0.4),
    headwear: r.int(0, 7) === 0 ? r.pick(['helm', 'cap', 'hood']) : null,
    cloak: r.int(0, 5) === 0,
  }, varietyFrom(r, sex, role));
  if (out.wardrobe === 'dress' && sex === 'm') out.wardrobe = 'suit';
  return finishRecipe(out);
}

// Part G2: 24 gear sets as costumes — pattern + three-colour palette + flags.
const SET_LOOK = {
  warrior:           { pattern: 'plate',         palette: { base: '#5a5f6e', trim: '#2a2622', metal: '#c0c6d0' }, headwear: 'helm' },
  mercenarys_gear:   { pattern: 'leather_plate', palette: { base: '#6a5a48', trim: '#b08a40', metal: '#7a7f88' }, headwear: 'helm' },
  plate:             { pattern: 'plate',         palette: { base: '#8a9098', trim: '#7a1f1c', metal: '#d4a94e' }, headwear: 'helm', cloak: true, centreRidge: true },
  oath:              { pattern: 'plate',         palette: { base: '#d8d2c2', trim: '#d4a94e', metal: '#a8adb8' }, cloak: true, sunEmblem: true },
  green_eyed_armour: { pattern: 'lamellar',      palette: { base: '#4a5a38', trim: '#d4a94e', metal: '#1c1c22' }, headwear: 'kabuto' },
  assassins_gear:    { pattern: 'shinobi',       palette: { base: '#2a2d36', trim: '#4a4a56', metal: '#5a5a62' }, headwear: 'hood' },
  shinobi_gear:      { pattern: 'shinobi',       palette: { base: '#1a1c22', trim: '#3a3a48', metal: '#5a5a62' }, headwear: 'hood', clanKnot: true },
  shadowweave:       { pattern: 'shinobi',       palette: { base: '#2a2438', trim: '#4a3a60', metal: '#5a5a62' }, headwear: 'hood', cloak: true },
  leathers:          { pattern: 'shinobi',       palette: { base: '#3a3228', trim: '#5a4a38', metal: '#5a5a62' }, extras: 'mask' },
  privateers_kit:    { pattern: 'pirate',        palette: { base: '#5a1f1c', trim: '#c8a24a', metal: '#b08a40' }, extras: 'tricorne', pistol: true },
  kings_uniform:     { pattern: 'navy',          palette: { base: '#1f2c48', trim: '#e8e2d2', metal: '#d4a94e' }, extras: 'bicorne' },
  wardens_gear:      { pattern: 'leather_plate', palette: { base: '#3a4a3a', trim: '#8a8a6a', metal: '#a8adb8' }, cloak: true },
  mage:              { pattern: 'robe',          palette: { base: '#3a3644', trim: '#a89ab8', metal: '#a8adb8' }, cloak: true },
  battle_mages_gear: { pattern: 'robe',          palette: { base: '#4a3a5a', trim: '#c0a8d8', metal: '#8a8f99' }, cloak: true, gorget: true },
  adept:             { pattern: 'robe',          palette: { base: '#2a3850', trim: '#8aa0c8', metal: '#a8adb8' } },
  healer:            { pattern: 'robe',          palette: { base: '#4a5a48', trim: '#e8e2d2', metal: '#a8adb8' }, stole: true, pendant: true },
  chantry:           { pattern: 'robe',          palette: { base: '#4a4a38', trim: '#e8e2d2', metal: '#d4a94e' }, stole: true, pendant: true },
  ranger:            { pattern: 'ranger',        palette: { base: '#3a4a32', trim: '#5a4630', metal: '#8a7a50' }, headwear: 'cap', cloak: true },
  hunter:            { pattern: 'ranger',        palette: { base: '#3a4a28', trim: '#4a3a28', metal: '#8a7a50' }, headwear: 'cap' },
  greenward:         { pattern: 'ranger',        palette: { base: '#2f4a2a', trim: '#5a4630', metal: '#8a7a50' }, headwear: 'cap', cloak: true },
  wildhide:          { pattern: 'hide',          palette: { base: '#5a4030', trim: '#e8e2d2', metal: '#e8e2d2' } },
  duelist:           { pattern: 'duelist',       palette: { base: '#4a2a32', trim: '#1c1c22', metal: '#a8adb8' } },
  street:            { pattern: 'street',        palette: { base: '#4a3830', trim: '#7a3a2a', metal: '#5a5a62' }, extras: 'mask' },
  ronin:             { pattern: 'lamellar',      palette: { base: '#38343e', trim: '#8a6fd0', metal: '#1c1c22' }, clanKnot: true },
};
const PATTERN_KIND = { plate: 'armor', leather_plate: 'armor', lamellar: 'samurai', shinobi: 'ninja', pirate: 'pirate', navy: 'navy', robe: 'robe', ranger: 'hiking', hide: 'hide', duelist: 'suit', street: 'hiking', dress: 'dress' };

function applySetLook(rec, setId) {
  const L = SET_LOOK[setId];
  if (!L || !rec) return rec;
  // Gear is a complete appearance layer; remove flags belonging to the previous set.
  for (const k of ['headwear','cloak','masked','extras','extrasKind','centreRidge','sunEmblem','clanKnot','pistol','gorget','stole','pendant']) delete rec[k];
  rec.setId = setId;
  rec.pattern = L.pattern;
  rec.wardrobe = PATTERN_KIND[L.pattern] || rec.wardrobe;
  rec.palette = Object.assign({}, L.palette);
  rec.wardrobeColor = L.palette.base;
  if (L.headwear) rec.headwear = L.headwear;
  if (L.cloak) rec.cloak = true;
  for (const k of ['centreRidge', 'sunEmblem', 'clanKnot', 'pistol', 'gorget', 'stole', 'pendant']) if (L[k]) rec[k] = true;
  if (L.extras) {
    rec.extrasKind = typeof L.extras === 'string' ? L.extras : rec.extrasKind;
    rec.extras = typeof L.extras === 'function' ? L.extras : drawExtras(L.extras, L.palette.base);
    if (L.extras === 'mask') rec.masked = true;
  }
  if (L.pattern === 'shinobi' && L.headwear !== 'helm' && L.headwear !== 'kabuto') rec.masked = true;
  return rec;
}

function applyVeteran(rec, ch) {
  if (!rec || !ch) return rec;
  rec.rank = ch.rank || 1;
  rec.quests = ch.questsCompleted || 0;
  rec.role = ch.archetype || ch.role || rec.role || null;
  if (rec.rank >= 5 && rec.sex === 'm') rec.jaw = Math.min(3, (rec.jaw || 0) + 1);
  if (rec.rank >= 4 && rec.hairColor) rec.hairColor = shade(rec.hairColor, 1.55);
  return rec;
}

// Campaign characters (campaign doc §6a): fixed looks from their data recipe.
const FACTION_SET = { maw: 'leathers', antler: 'greenward', varenholm: 'warrior', bell: 'shinobi_gear', green: 'green_eyed_armour', tally: 'privateers_kit', navy: 'kings_uniform' };
function recipeCampaign(id) {
  const def = ADV.DATA.CAMPAIGN_CHARS[id];
  const pr = (def && def.portrait) || { skin: 'tan', hair: 'fringe', wardrobe: 'armor', color: '#4a4a4a' };
  const tintBg = { maw: '#3a2a4a88', antler: '#2f3f2a88', varenholm: '#2a3a5588', bell: '#2a2a3a88', green: '#2f3f2a88', tally: '#4a2a2a88', navy: '#2a3a5588' }[def ? def.faction : ''] || '#33333388';
  const r = rngFor(ADV.hashStr(id));
  const sex = def ? def.sex : 'm';
  const out = Object.assign({
    bg: tintBg, skin: SKIN[pr.skin] || SKIN.tan,
    hairColor: pr.skin === 'ashen' ? '#333' : HAIR_COLORS[r.int(0, HAIR_COLORS.length - 1)],
    hairStyle: pr.hair === 'short' ? 'fringe' : pr.hair, sex, wardrobe: pr.wardrobe, wardrobeColor: pr.color,
    eyes: pr.skin === 'ashen' ? '#7a9a8a' : r.pick(['#4a3520', '#2f4a2a', '#2a3a55', '#4a2a20']),
    jaw: sex === 'f' ? 0 : r.int(1, 3), brow: r.int(0, 2), mouth: r.int(-1, 2), fringe: r.int(-6, 6),
  }, varietyFrom(r, sex, def && def.role === 'boss' ? 'tank' : null));
  // faction costume, keeping the character's own colour as the base
  const setId = def && FACTION_SET[def.faction];
  if (setId && def.role !== 'antagonist') { applySetLook(out, setId); out.palette.base = pr.color || out.palette.base; out.wardrobeColor = out.palette.base; }
  if (def && def.role === 'boss' && out.pattern === 'plate') out.centreRidge = true;
  return finishRecipe(out);
}

const HIRO_RECIPE = {
  bg: '#3a2a5588',
  skin: SKIN.dark,
  hairColor: '#6a3faa', hairStyle: 'dreads',    // purple dreadlocks (§14a)
  sex: 'm', build: 'broad', wardrobe: 'samurai', pattern: 'lamellar', wardrobeColor: '#38343e',
  palette: { base: '#38343e', trim: '#8a6fd0', metal: '#1c1c22' },
  eyes: '#8a7a3a',                              // hazel
  jaw: 2, brow: 1, mouth: 1, fringe: 0, strandSeed: 11,
  warm: 0.02, clanKnot: true,
};

// ---- monster heads ----------------------------------------------------------
// Returns rig info for META: { rig: 'wolf'|'sentinel'|'human', anchors }
function blob(ctx, x, y, rx, ry, color) {
  const g = ctx.createRadialGradient(x-rx*.35,y-ry*.45,1,x,y,Math.max(rx,ry));
  g.addColorStop(0,shade(color,1.5));g.addColorStop(.6,color);g.addColorStop(1,shade(color,.6));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function pairEyes(ctx, cx, y, dx, color) {
  for (const s of [-1, 1]) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx + s * dx, y, 7, 5, s * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#101010';
    ctx.beginPath(); ctx.arc(cx + s * dx, y, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}
function drawCreature(ctx, typeId, tint, o) {
  const cx = W / 2;
  const c = tint || '#5a5a5f';
  const dark = shade(c, 0.55);
  const lit = shade(c, 1.25);
  if (typeId === 'plant' || typeId === 'moss_giant') {
    blob(ctx, cx, EYE_Y + 48, 70, 58, dark);
    blob(ctx, cx, EYE_Y + 8, 48, 50, c);
    ctx.fillStyle = lit;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 10, EYE_Y - 20);
      ctx.quadraticCurveTo(cx + s * 48, EYE_Y - 90, cx + s * 22, EYE_Y - 28);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = lit; ctx.lineWidth = 3;
    for (const s of [-1, 0, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * 18, EYE_Y + 40); ctx.lineTo(cx + s * 28, EYE_Y + 78); ctx.stroke();
    }
    pairEyes(ctx, cx, EYE_Y - 2, 16, '#8ad44a');
    return { rig: 'plant', fur: c, eyeY: EYE_Y - 2, eyeDX: 16, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'boar') {
    blob(ctx, cx, EYE_Y + 28, 72, 52, c);
    blob(ctx, cx, EYE_Y + 8, 50, 40, dark);
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#e8e0c8';
      ctx.beginPath(); ctx.moveTo(cx + s * 14, EYE_Y + 36); ctx.lineTo(cx + s * 36, EYE_Y + 58); ctx.lineTo(cx + s * 10, EYE_Y + 46); ctx.closePath(); ctx.fill();
    }
    pairEyes(ctx, cx, EYE_Y - 6, 22, '#c8a018');
    blob(ctx, cx, EYE_Y + 28, 10, 8, '#1c1c1c');
    return { rig: 'boar', fur: c, eyeY: EYE_Y - 6, eyeDX: 22, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'raptor' || typeId === 'roc' || typeId === 'vulture' || typeId === 'owl') {
    blob(ctx, cx, EYE_Y + 20, 62, 56, c);
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(cx - 70, EYE_Y + 10); ctx.quadraticCurveTo(cx - 20, EYE_Y - 40, cx, EYE_Y + 8); ctx.lineTo(cx - 40, EYE_Y + 30); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 70, EYE_Y + 10); ctx.quadraticCurveTo(cx + 20, EYE_Y - 40, cx, EYE_Y + 8); ctx.lineTo(cx + 40, EYE_Y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = typeId === 'owl' ? '#e8c84a' : '#d4a04a';
    ctx.beginPath(); ctx.moveTo(cx, EYE_Y + 8); ctx.lineTo(cx - 10, EYE_Y + 34); ctx.lineTo(cx + 10, EYE_Y + 34); ctx.closePath(); ctx.fill();
    pairEyes(ctx, cx, EYE_Y - 8, typeId === 'owl' ? 14 : 18, typeId === 'owl' ? '#f0d060' : '#c8a018');
    return { rig: 'bird', fur: c, eyeY: EYE_Y - 8, eyeDX: 18, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'serpent' || typeId === 'hydra' || typeId === 'wyrm' || typeId === 'drake' || typeId === 'salamander' || typeId === 'basilisk') {
    const heads = typeId === 'hydra' ? [-28, 0, 28] : [0];
    for (const dx of heads) {
      blob(ctx, cx + dx, EYE_Y + 18, typeId === 'hydra' ? 28 : 54, typeId === 'hydra' ? 36 : 50, c);
      ctx.fillStyle = lit;
      ctx.beginPath(); ctx.ellipse(cx + dx, EYE_Y + 40, typeId === 'hydra' ? 10 : 16, 22, 0, 0, Math.PI * 2); ctx.fill();
      pairEyes(ctx, cx + dx, EYE_Y - 4, typeId === 'hydra' ? 9 : 16, typeId === 'salamander' ? '#e86a30' : '#7ad0e8');
    }
    return { rig: 'serpent', fur: c, eyeY: EYE_Y - 4, eyeDX: 16, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'hag') {
    blob(ctx, cx, EYE_Y + 24, 50, 56, c);
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(cx - 56, EYE_Y - 8); ctx.lineTo(cx + 56, EYE_Y - 8); ctx.lineTo(cx + 8, EYE_Y - 92); ctx.closePath(); ctx.fill();
    pairEyes(ctx, cx, EYE_Y, 15, '#b8e0ff');
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 28, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
    return { rig: 'hag', fur: c, eyeY: EYE_Y, eyeDX: 15, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'shadow') {
    blob(ctx, cx, EYE_Y + 20, 68, 60, dark);
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(cx - 20, EYE_Y - 20); ctx.lineTo(cx - 40, EYE_Y - 70); ctx.lineTo(cx - 4, EYE_Y - 24); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 20, EYE_Y - 20); ctx.lineTo(cx + 40, EYE_Y - 70); ctx.lineTo(cx + 4, EYE_Y - 24); ctx.closePath(); ctx.fill();
    pairEyes(ctx, cx, EYE_Y - 4, 18, '#8a70c0');
    return { rig: 'shadow', fur: c, eyeY: EYE_Y - 4, eyeDX: 18, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'stag') {
    blob(ctx, cx, EYE_Y + 22, 56, 50, c);
    ctx.strokeStyle = lit; ctx.lineWidth = 4;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * 16, EYE_Y - 18); ctx.lineTo(cx + s * 38, EYE_Y - 78); ctx.lineTo(cx + s * 52, EYE_Y - 58); ctx.stroke();
    }
    pairEyes(ctx, cx, EYE_Y - 2, 16, '#c8a018');
    return { rig: 'stag', fur: c, eyeY: EYE_Y - 2, eyeDX: 16, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'panther') {
    blob(ctx, cx, EYE_Y + 18, 60, 48, c);
    pairEyes(ctx, cx, EYE_Y - 4, 16, '#e8c84a');
    blob(ctx, cx, EYE_Y + 28, 16, 14, dark);
    return { rig: 'panther', fur: c, eyeY: EYE_Y - 4, eyeDX: 16, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'toad') {
    blob(ctx, cx, EYE_Y + 30, 74, 50, c);
    blob(ctx, cx - 22, EYE_Y - 8, 16, 16, lit);
    blob(ctx, cx + 22, EYE_Y - 8, 16, 16, lit);
    pairEyes(ctx, cx, EYE_Y - 8, 22, '#c8e060');
    blob(ctx, cx, EYE_Y + 38, 22, 10, '#1c1c1c');
    return { rig: 'toad', fur: c, eyeY: EYE_Y - 8, eyeDX: 22, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'spider') {
    blob(ctx, cx, EYE_Y + 16, 46, 40, c);
    ctx.strokeStyle = dark; ctx.lineWidth = 5;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx + s * 20, EYE_Y + 10 + i * 10); ctx.lineTo(cx + s * 70, EYE_Y - 10 + i * 18); ctx.stroke();
      }
    }
    pairEyes(ctx, cx, EYE_Y, 10, '#e8f0ff');
    return { rig: 'spider', fur: c, eyeY: EYE_Y, eyeDX: 10, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'scorpion') {
    blob(ctx, cx, EYE_Y + 24, 50, 36, c);
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(cx + 20, EYE_Y - 8); ctx.quadraticCurveTo(cx + 70, EYE_Y - 70, cx + 36, EYE_Y - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lit;
    ctx.beginPath(); ctx.arc(cx + 38, EYE_Y - 10, 8, 0, Math.PI * 2); ctx.fill();
    pairEyes(ctx, cx, EYE_Y + 4, 14, '#c8a018');
    return { rig: 'scorpion', fur: c, eyeY: EYE_Y + 4, eyeDX: 14, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'beetle' || typeId === 'crab') {
    blob(ctx, cx, EYE_Y + 18, 62, 46, c);
    ctx.strokeStyle = dark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, EYE_Y - 20); ctx.lineTo(cx, EYE_Y + 50); ctx.stroke();
    if (typeId === 'crab') {
      ctx.fillStyle = lit;
      ctx.beginPath(); ctx.ellipse(cx - 58, EYE_Y + 8, 16, 22, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 58, EYE_Y + 8, 16, 22, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    pairEyes(ctx, cx, EYE_Y - 2, 16, '#58c8e8');
    return { rig: typeId, fur: c, eyeY: EYE_Y - 2, eyeDX: 16, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'golem' || typeId === 'troll') {
    blob(ctx, cx, EYE_Y + 16, 60, 58, c);
    ctx.fillStyle = dark;
    ctx.fillRect(cx - 28, EYE_Y - 8, 56, 12);
    pairEyes(ctx, cx, EYE_Y - 2, 16, typeId === 'troll' ? '#8ad44a' : '#58c8e8');
    return { rig: typeId, fur: c, eyeY: EYE_Y - 2, eyeDX: 16, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'ape' || typeId === 'goblin' || typeId === 'orc') {
    blob(ctx, cx, EYE_Y + 22, 52, 50, c);
    blob(ctx, cx, EYE_Y + 36, 28, 18, dark);
    for (const s of [-1, 1]) {
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(cx + s * 38, EYE_Y + 4, 10, 16, s * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    pairEyes(ctx, cx, EYE_Y - 4, 15, typeId === 'goblin' ? '#8ad44a' : '#c8a018');
    return { rig: typeId, fur: c, eyeY: EYE_Y - 4, eyeDX: 15, eyeW: 7, eyeH: 5 };
  }
  if (typeId === 'hound') {
    blob(ctx, cx, EYE_Y + 26, 68, 52, c);
    for (const s of [-1, 1]) {
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(cx + s * 16, EYE_Y - 16); ctx.lineTo(cx + s * 36, EYE_Y - 58); ctx.lineTo(cx + s * 38, EYE_Y - 12); ctx.closePath(); ctx.fill();
    }
    pairEyes(ctx, cx, EYE_Y - 2, 18, '#5d8a4a');
    return { rig: 'hound', fur: c, eyeY: EYE_Y - 2, eyeDX: 18, eyeW: 7, eyeH: 5 };
  }
  return null;
}

function drawMonster(ctx, typeId, tint, o) {
  o = o || {};
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tint ? tint + '66' : '#4a303055';
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.05)'); grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  const creature = drawCreature(ctx, typeId, tint, o);
  if (creature) { creatureDetail(ctx, creature, typeId, o, tint); return creature; }
  if (typeId === 'dire_wolf') {
    const fur = tint || '#5a5a5f';
    ctx.fillStyle = fur;
    blob(ctx, cx, EYE_Y + 30, 75, 65, fur); // ruff
    // fur direction strokes on the ruff
    ctx.strokeStyle = rgba(shade(fur, 0.6), 0.6); ctx.lineWidth = 1.4;
    for (let i = 0; i < 26; i++) { const a = Math.PI * 0.15 + (i / 25) * Math.PI * 0.7; const r0 = 46, r1 = 64 + (i % 3) * 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, EYE_Y + 30 + Math.sin(a) * r0 * 0.9); ctx.lineTo(cx + Math.cos(a) * r1, EYE_Y + 30 + Math.sin(a) * r1 * 0.9); ctx.stroke(); }
    ctx.fillStyle = fur;
    blob(ctx, cx, EYE_Y + 4, 48, 44, fur); // head
    for (const s of [-1, 1]) { // ears
      ctx.beginPath(); ctx.moveTo(cx + s * 20, EYE_Y - 30);
      ctx.lineTo(cx + s * 44, EYE_Y - 72); ctx.lineTo(cx + s * 44, EYE_Y - 28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(fur, 0.7);
      ctx.beginPath(); ctx.moveTo(cx + s * 26, EYE_Y - 32); ctx.lineTo(cx + s * 41, EYE_Y - 62); ctx.lineTo(cx + s * 41, EYE_Y - 32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = fur;
    }
    if (o.boss) { ctx.fillStyle = tint ? shade(tint, 0.4) : '#2a2a2a'; ctx.beginPath(); ctx.moveTo(cx + 44, EYE_Y - 60); ctx.lineTo(cx + 38, EYE_Y - 50); ctx.lineTo(cx + 45, EYE_Y - 48); ctx.closePath(); ctx.fill(); } // torn ear
    softEllipse(ctx, cx + 20, EYE_Y + 10, 24, 30, '#000000', 0.22);   // shaded side
    ctx.fillStyle = shade(fur, 0.8); // snout
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 34, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 24, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx - 3, EYE_Y + 22, 1.6, 0, Math.PI * 2); ctx.fill(); // wet nose
    for (const s of [-1, 1]) { // eyes
      ctx.fillStyle = '#c8a018';
      ctx.beginPath(); ctx.ellipse(cx + s * 20, EYE_Y - 4, 8, 5, s * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#131313';
      ctx.beginPath(); ctx.arc(cx + s * 20, EYE_Y - 4, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#e8e2d2'; ctx.lineWidth = 3; // fangs
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * 12, EYE_Y + 48); ctx.lineTo(cx + s * 10, EYE_Y + 58); ctx.stroke();
    }
    const wolfRig = { rig: 'wolf', fur, earL: { x: cx - 32, y: EYE_Y - 50 }, earR: { x: cx + 32, y: EYE_Y - 50 }, eyeY: EYE_Y - 4, eyeDX: 20, eyeW: 8, eyeH: 5, lipY: EYE_Y + 46 };
    creatureDetail(ctx, wolfRig, typeId, o, tint);
    return wolfRig;
  }
  if (typeId === 'plated_sentinel' && !o.factionSet) {
    const metal = tint || '#6e7480';
    drawWardrobe(ctx, { wardrobe: 'armor', pattern: 'plate', wardrobeColor: shade(metal, 0.8), palette: { base: shade(metal, 0.8), trim: '#222', metal: shade(metal, 1.4) }, skin: SKIN.ashen, sex: 'm', build: 'heavy' }, cx);
    const steel=ctx.createLinearGradient(cx-34,0,cx+34,0);steel.addColorStop(0,shade(metal,1.6));steel.addColorStop(.25,metal);steel.addColorStop(.58,shade(metal,1.15));steel.addColorStop(1,shade(metal,.55));
    ctx.fillStyle = steel;
    ctx.beginPath();ctx.moveTo(cx-34,EYE_Y-34);ctx.lineTo(cx-22,EYE_Y-48);ctx.lineTo(cx+22,EYE_Y-48);ctx.lineTo(cx+34,EYE_Y-34);ctx.lineTo(cx+34,EYE_Y+29);ctx.lineTo(cx+20,EYE_Y+49);ctx.lineTo(cx-20,EYE_Y+49);ctx.lineTo(cx-34,EYE_Y+29);ctx.closePath();ctx.fill();
    ctx.fillStyle = shade(metal, 1.25);
    ctx.beginPath(); ctx.rect(cx - 34, EYE_Y - 44, 68, 18); ctx.fill();
    rivets(ctx, [[cx - 28, EYE_Y - 35], [cx - 14, EYE_Y - 35], [cx, EYE_Y - 35], [cx + 14, EYE_Y - 35], [cx + 28, EYE_Y - 35]], shade(metal, 0.5));
    ctx.strokeStyle = shade(metal, 0.55); ctx.lineWidth = 1.2;         // scratches
    ctx.beginPath(); ctx.moveTo(cx - 26, EYE_Y + 20); ctx.lineTo(cx - 8, EYE_Y + 36); ctx.moveTo(cx + 10, EYE_Y + 26); ctx.lineTo(cx + 22, EYE_Y + 42); ctx.stroke();
    if (o.boss) { softEllipse(ctx, cx + 20, EYE_Y + 30, 12, 9, '#000000', 0.45); }     // dent
    ctx.fillStyle = '#0e0e12';
    ctx.fillRect(cx - 26, EYE_Y - 8, 52, 14); // visor slit
    softEllipse(ctx, cx, EYE_Y - 1, 30, 10, '#58c8e8', 0.25);         // heat haze behind the visor
    ctx.fillStyle = '#58c8e8';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 14, EYE_Y - 1, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = shade(metal, 0.6); ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - 34, EYE_Y + 12 + i * 12); ctx.lineTo(cx + 34, EYE_Y + 12 + i * 12); ctx.stroke(); }
    ctx.strokeStyle=shade(metal,1.65);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-30,EYE_Y-27);ctx.lineTo(cx-30,EYE_Y+26);ctx.lineTo(cx-18,EYE_Y+42);ctx.stroke();
    enemyInsignia(ctx,o,metal);
    return { rig: 'sentinel', metal, lightL: { x: cx - 14, y: EYE_Y - 1 }, lightR: { x: cx + 14, y: EYE_Y - 1 }, lightR0: 4 };
  }
  // human-frame monsters
  const base = {
    bandit:       { skin: SKIN.tan, hairStyle: 'hood', hairColor: '#332d26', wardrobe: 'ninja', pattern: 'street', wardrobeColor: tint || '#4a3f30', eyes: '#3a3a3a', mask: true, build: 'broad' },
    hedge_mage:   { skin: SKIN.pale, hairStyle: 'long', hairColor: '#7a7a72', wardrobe: 'robe', pattern: 'robe', wardrobeColor: tint || '#3f3a50', eyes: '#2a3a55', hat: true, build: 'lean' },
    grave_acolyte:{ skin: SKIN.ashen, hairStyle: 'bald', hairColor: '#222', wardrobe: 'robe', pattern: 'robe', wardrobeColor: tint || '#333833', eyes: '#5d8a4a', cowl: true, build: 'lean' },
    // a faction's armoured line (Marines, Green Recruits, Chain-Hands): a human in the faction's heavy kit
    plated_sentinel: { skin: SKIN.tan, hairStyle: 'buzz', hairColor: '#2e2013', wardrobe: 'armor', pattern: 'plate', wardrobeColor: tint || '#4a4a52', eyes: '#3a3a3a', build: 'heavy', headwear: 'helm' },
  }[typeId] || recipeNPC('m', 1);
  const rec = Object.assign({}, base);
  const oo = Object.assign({ sex: o.sex || 'm', jaw: 2, brow: 2, mouth: -1, bg: 'transparent', strandSeed: 5 }, rec);
  oo.skin = rec.skin;
  // faction costume for campaign enemies (Part G2): the skin tint becomes the base colour
  if (o.factionSet) {
    const hadHelm = rec.headwear === 'helm';
    applySetLook(oo, o.factionSet);
    if (tint) { oo.palette.base = tint; oo.wardrobeColor = tint; }
    if (!hadHelm && !o.boss && oo.headwear === 'kabuto') oo.headwear = null;        // rank-and-file samurai go bareheaded
    if (hadHelm && o.factionSet !== 'green_eyed_armour') oo.headwear = 'helm';
    if (o.factionSet === 'privateers_kit' && !o.boss && !hadHelm) oo.extras = drawExtras('bandana', tint || '#8a3020');
    if (o.factionSet === 'kings_uniform' && hadHelm) oo.headwear = 'helm';
  }
  finishRecipe(oo);
  drawBust(ctx, Object.assign({}, oo, { bg: 'rgba(0,0,0,0)' }));
  if (rec.mask && !o.factionSet) {
    ctx.fillStyle = '#2a2620';
    ctx.beginPath(); ctx.rect(cx - 30, EYE_Y + 12, 60, 26); ctx.fill();
    ctx.fillStyle = shade(rec.wardrobeColor, 0.85);   // hood up
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 14, 44, 54, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 44, EYE_Y - 12); ctx.quadraticCurveTo(cx, EYE_Y - 74, cx + 44, EYE_Y - 12); ctx.fill();
  }
  if (rec.hat && !o.factionSet) {
    ctx.fillStyle = shade(rec.wardrobeColor, 1.1);
    ctx.beginPath(); ctx.moveTo(cx - 52, EYE_Y - 26); ctx.lineTo(cx + 52, EYE_Y - 26); ctx.lineTo(cx + 8, EYE_Y - 96); ctx.closePath(); ctx.fill();
  }
  if (rec.cowl) {
    ctx.fillStyle = shade(rec.wardrobeColor, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 16, 46, 56, 0, Math.PI, 0); ctx.fill();
  }
  if (oo.masked || (rec.mask && !o.factionSet)) fittedMask(ctx, oo, W / 2, 46 + oo.jaw * 4);
  enemyInsignia(ctx, o, tint || oo.wardrobeColor);
  const headCovered = !!oo.headwear || ['bandana','tricorne','bicorne','hood'].includes(oo.extrasKind) || oo.hairStyle === 'hood' || !!rec.cowl || !!(rec.hat && !o.factionSet);
  return { rig: 'human', skinHex: oo.skin[0], hairHex: oo.hairColor, masked: !!oo.masked || !!(rec.mask && !o.factionSet), browsCovered: headCovered, headCovered };
}

// ---- public API -------------------------------------------------------------
const cacheKeys = new Set();
// Overlays repaint over the bust rather than regenerating the texture, so the
// geometry and palette of each portrait are kept beside its cache key.
const META = {};

// ---- Part A: the 16-mood palette --------------------------------------------
// Geometry in 220x280 design px; +y is down. brow: [inner, arch, outer] offsets
// per side [left, right]; lid 1 = open, <1 lowers the upper lid, >1 widens;
// mouth: curve (+ = corners up / apex down = smile), open 0-1, side (-1..1
// shifts the apex for one-sided expressions); accent name.
const MOODS = {
  neutral:   { brow: [[0, 0, 0], [0, 0, 0]],       lid: 1.0,  mouth: { curve: 0, open: 0, side: 0 },   accent: null,      use: 'default' },
  content:   { brow: [[-1, -1, -1], [-1, -1, -1]], lid: 0.9,  mouth: { curve: 3, open: 0, side: 0 },   accent: null,      use: 'friendly, paid, fed, healed' },
  happy:     { brow: [[-3, -2, -2], [-3, -2, -2]], lid: 0.8,  mouth: { curve: 6, open: 0.25, side: 0 }, accent: 'cheek',   use: 'romantic, big win, married' },
  laughing:  { brow: [[-5, -3, -3], [-5, -3, -3]], lid: 0.5,  mouth: { curve: 7, open: 0.7, side: 0 },  accent: 'cheek',   use: '[laughs], kill on a taunt' },
  tender:    { brow: [[-1, -1, 0], [-1, -1, 0]],   lid: 0.75, mouth: { curve: 3, open: 0, side: 0.6 }, accent: null,      use: 'spouse/child, [warmly]' },
  sad:       { brow: [[-3, 0, 2], [-3, 0, 2]],     lid: 0.85, mouth: { curve: -4, open: 0, side: 0 },  accent: null,      use: 'hungry, jilted, [sighs]' },
  grief:     { brow: [[-4, 0, 3], [-4, 0, 3]],     lid: 0.6,  mouth: { curve: -5, open: 0.3, side: 0 }, accent: 'tear',    use: 'bereaved, funeral' },
  angry:     { brow: [[4, 1, -1], [4, 1, -1]],     lid: 0.85, mouth: { curve: -1, open: 0, side: 0 },  accent: 'crease',  use: 'hatred, my turn, [coldly]' },
  furious:   { brow: [[6, 2, 0], [6, 2, 0]],       lid: 0.7,  mouth: { curve: -3, open: 0.6, side: 0 }, accent: 'teeth',   use: 'villain, taunt, boss <25%' },
  disgust:   { brow: [[3, 1, 0], [-1, -2, -1]],    lid: 0.8,  mouth: { curve: -3, open: 0, side: -0.8 }, accent: 'nose',  use: 'undead, forbidden arts, [sneers]' },
  smug:      { brow: [[0, 0, 0], [-4, -3, -2]],    lid: 0.9,  mouth: { curve: 3, open: 0, side: 0.9 },  accent: null,      use: 'rival, crit landed, villain' },
  afraid:    { brow: [[-4, -3, -3], [-4, -3, -3]], lid: 1.15, mouth: { curve: -3, open: 0.3, side: 0 }, accent: 'sweat',   use: '<25% HP, ambushed, fleeing' },
  surprised: { brow: [[-6, -5, -5], [-6, -5, -5]], lid: 1.2,  mouth: { curve: 0, open: 0.6, side: 0 },  accent: null,      use: 'transient: ambush, reveal, [gasps]' },
  pain:      { brow: [[3, 0, -2], [-3, -4, -1]],   lid: 0.4,  mouth: { curve: -2, open: 0.6, side: 0.3 }, accent: null,    use: 'transient: just hit' },
  resolve:   { brow: [[1, 0, 1], [1, 0, 1]],       lid: 0.8,  mouth: { curve: -1, open: 0, side: 0 },  accent: null,      use: 'low HP but unafraid' },
  dazed:     { brow: [[1, 2, 1], [1, 2, 1]],       lid: 0.55, mouth: { curve: 0, open: 0.35, side: 0 }, accent: null,      use: 'Frozen, Shock, undead, exhausted' },
};
const MOOD_IDS = Object.keys(MOODS);

// resting bias per personality (Part C §6) — mood + intensity when nothing else speaks
const PERSONALITY_BIAS = {
  M01: ['neutral', 0], M02: ['content', 0.35], M03: ['afraid', 0.2], M04: ['angry', 0.35], M05: ['smug', 0.3], M06: ['content', 0.2],
  M07: ['smug', 0.3], M08: ['sad', 0.3], M09: ['neutral', 0], M10: ['content', 0.4], M11: ['disgust', 0.15], M12: ['resolve', 0.2],
  M13: ['smug', 0.2], M14: ['tender', 0.25], M15: ['angry', 0.15], M16: ['afraid', 0.25], M17: ['happy', 0.25], M18: ['dazed', 0.3],
  M19: ['content', 0.25], M20: ['smug', 0.3],
  F01: ['resolve', 0.25], F02: ['content', 0.35], F03: ['afraid', 0.2], F04: ['angry', 0.4], F05: ['tender', 0.25], F06: ['content', 0.2],
  F07: ['disgust', 0.15], F08: ['sad', 0.3], F09: ['neutral', 0], F10: ['happy', 0.35], F11: ['smug', 0.3], F12: ['resolve', 0.2],
  F13: ['smug', 0.2], F14: ['tender', 0.3], F15: ['angry', 0.15], F16: ['afraid', 0.25], F17: ['happy', 0.25], F18: ['dazed', 0.3],
  F19: ['content', 0.25], F20: ['smug', 0.3],
  M21: ['angry', 0.2], M22: ['resolve', 0.2], M23: ['angry', 0.2], M24: ['neutral', 0], M25: ['content', 0.35], M26: ['content', 0.35],
  M27: ['content', 0.2], M28: ['angry', 0.2], M29: ['smug', 0.3], M30: ['dazed', 0.4],
  F21: ['neutral', 0], F22: ['sad', 0.15], F23: ['smug', 0.2], F24: ['sad', 0.25], F25: ['disgust', 0.15], F26: ['content', 0.35],
  F27: ['smug', 0.3], F28: ['resolve', 0.2], F29: ['disgust', 0.15], F30: ['sad', 0.25],
  HIRO: ['smug', 0.3],
};
// personalities that meet low HP with resolve rather than fear
const STEADY = { M01: 1, M12: 1, M21: 1, M22: 1, M23: 1, M28: 1, F01: 1, F12: 1, F21: 1, F24: 1, F25: 1, F28: 1, HIRO: 1 };

// delivery tags → reaction (Part B). Every tag that occurs in the dialogue data
// is either here or in TAG_IGNORE; test/expressions.js asserts the union.
const TAG_MOODS = {
  laughs: ['laughing', 1], happily: ['happy', 0.8], excited: ['happy', 0.8], playfully: ['smug', 0.6], mischievously: ['smug', 0.8],
  sighs: ['sad', 0.6], sad: ['sad', 0.9], sorrowful: ['grief', 0.8], tired: ['dazed', 0.5], 'exhales sharply': ['sad', 0.4],
  coldly: ['angry', 0.4], flatly: ['angry', 0.3], deadpan: ['angry', 0.25], angry: ['furious', 0.8], frustrated: ['angry', 0.7],
  annoyed: ['angry', 0.5], dismissive: ['disgust', 0.5], appalled: ['disgust', 0.9], sarcastic: ['smug', 0.6],
  warmly: ['tender', 0.8], softly: ['tender', 0.6], gently: ['tender', 0.6], reassuring: ['content', 0.6], sympathetic: ['tender', 0.6],
  nervously: ['afraid', 0.5], cautiously: ['afraid', 0.35], hesitates: ['afraid', 0.3], stammers: ['afraid', 0.5], sheepishly: ['sad', 0.3],
  alarmed: ['surprised', 0.9], surprised: ['surprised', 0.9], gasps: ['surprised', 0.9], desperately: ['afraid', 0.9],
  shouts: ['furious', 0.9], dramatically: ['surprised', 0.6], impressed: ['content', 0.6], curious: ['surprised', 0.3], questioning: ['surprised', 0.25],
  smirks: ['smug', 0.8], dryly: ['smug', 0.5], sneers: ['disgust', 0.8], disgusted: ['disgust', 0.9],
  firmly: ['resolve', 0.7], steadily: ['resolve', 0.6], grimly: ['resolve', 0.7], wearily: ['dazed', 0.5],
  tense: ['resolve', 0.7], focused: ['resolve', 0.55],
};
const TAG_IGNORE = ['calm', 'thoughtful', 'formal', 'quietly', 'whisper', 'whispers', 'pause', 'beat'];

// ---- geometry helpers for overlays -----------------------------------------
function metaFor(key, ch) {
  return (key && META[key]) || { eyeY: EYE_Y, eyeDX: EYE_DX, eyeW: 7.5, eyeH: 5, browY: EYE_Y - 12, mouthY: EYE_Y + 30, rig: 'human', monster: !!(ch && ch.isMonster), lid: 0x8a5c3a, hair: 0x2a1c12, sex: (ch && ch.sex) || 'm' };
}
function frame(img) {
  // scale + origin of the displayed image in WORLD coords (containers included)
  let w = img.displayWidth, h = img.displayHeight, ox, oy;
  if (img.parentContainer) {
    const b = img.getBounds();
    w = b.width; h = b.height; ox = b.x; oy = b.y;
  } else {
    ox = img.x - w * (img.originX != null ? img.originX : 0.5);
    oy = img.y - h * (img.originY != null ? img.originY : 0.5);
  }
  const s = w / W;
  return { w, h, s, ox, oy, x: (px) => ox + px * s, y: (py) => oy + py * (h / H) };
}
// overlays sit above the image (or its container) and follow its alpha
function depthOf(img) { return (img.parentContainer ? img.parentContainer.depth : img.depth) || 0; }
// overlays inherit the clip of a scrolled pane so they never draw outside it
function adoptMask(g, img) {
  const pc = img.parentContainer;
  if (pc && pc.mask && g.mask !== pc.mask) { try { g.setMask(pc.mask); } catch (e) {} }
}
function worldAlpha(img) {
  if (!img || img.visible === false || img.active === false) return 0;
  let a = img.alpha == null ? 1 : img.alpha;
  let p = img.parentContainer;
  while (p) {
    if (p.visible === false || p.active === false) return 0;
    a *= (p.alpha == null ? 1 : p.alpha);
    p = p.parentContainer;
  }
  return a;
}
function alphaOf(img) { return worldAlpha(img); }
function hostLive(img) { return !!(img && img.scene && worldAlpha(img) > 0.02); }
function syncOverlay(g, img) {
  if (!g || !g.active) return false;
  const on = hostLive(img);
  try { g.__faceFx = true; } catch (e) {}
  try { g.setVisible(!!on); } catch (e) {}
  try { g.setAlpha(on ? worldAlpha(img) : 0); } catch (e) {}
  return on;
}
function followHost(scene, g, img) {
  if (!scene || !g || !img) return () => {};
  try { g.__faceFx = true; } catch (e) {}
  const tick = () => {
    if (!g.active || !img.scene) {
      try { scene.events.off('update', tick); } catch (e) {}
      return;
    }
    syncOverlay(g, img);
  };
  scene.events.on('update', tick);
  const stop = () => { try { scene.events.off('update', tick); } catch (e) {} };
  try { img.once('destroy', stop); } catch (e) {}
  try { g.once('destroy', stop); } catch (e) {}
  tick();
  return stop;
}
function lerp(a, b, t) { return a + (b - a) * t; }

// Paint a mood at intensity onto Graphics g for the image. Pure function of
// (meta, frame, mood, intensity, extra) — used for standing and transient layers.
function paintMood(g, img, meta, moodId, k, extra) {
  g.clear();
  const M = MOODS[moodId] || MOODS.neutral;
  if (moodId === 'neutral' || k <= 0.001) return;
  const F = frame(img);
  const small = F.w < 90;
  const lw = Math.max(1.5, 2.6 * F.s);
  if (meta.rig === 'wolf') return paintWolf(g, img, meta, moodId, k, F);
  if (meta.rig === 'sentinel') return paintSentinel(g, img, meta, moodId, k, F, extra);
  if (meta.rig !== 'human') {
    const lid = lerp(1, M.lid, k);
    if (lid < .98) {
      g.fillStyle(meta.furHex || 0x515959, 1);
      for (const side of [-1, 1]) g.fillEllipse(F.x(W / 2 + side * meta.eyeDX), F.y(meta.eyeY - 3), (meta.eyeW * 2 + 1) * F.s, (1 - lid) * 9 * F.s);
    }
    return;
  }
  const cx = F.x(W / 2);
  const dx = meta.eyeDX * F.s;
  const ey = F.y(meta.eyeY);
  const eyeW = (meta.eyeW || 7.5) * F.s, eyeH = (meta.eyeH || 5) * F.s;
  const browY = F.y(meta.browY);
  const mouthY = F.y(meta.mouthY);
  const skin = meta.lid != null ? meta.lid : 0x8a5c3a;
  const hair = meta.hair != null ? meta.hair : skin;
  const moved = M.brow.some(b => b.some(v => Math.abs(v * k) > 0.6));
  // ---- lids first so a later brow stroke cannot be wiped by skin fill
  const lid = lerp(1, M.lid, k);
  if (lid < 0.98) {
    g.fillStyle(skin, 1);
    const drop = (1 - lid) * eyeH * 2;
    const hh = eyeH + 1.2;
    for (const sgn of [-1, 1]) {
      const ex = cx + sgn * dx;
      const yc = ey - eyeH + drop - hh;
      if (meta.browsCovered) g.fillRect(ex-eyeW,ey-eyeH*.75,eyeW*2,drop);
      else g.fillEllipse(ex, yc, (eyeW + 1.2) * 2, hh * 2);
    }
  } else if (lid > 1.02) {
    g.fillStyle(0xf2ede2, Math.min(1, (lid - 1) * 4));
    for (const sgn of [-1, 1]) g.fillEllipse(cx + sgn * dx + 1 * F.s, ey - eyeH * 0.55, eyeW * 1.2, eyeH * 0.7);
  }
  if (!meta.browsCovered && (moved || lid < 0.98)) {
    if (moved) {
      g.fillStyle(skin, 1);
      for (const sgn of [-1, 1]) g.fillEllipse(cx + sgn * dx, browY + 0.5 * F.s, 20 * F.s, 7 * F.s);
    }
    const browCol = Phaser.Display.Color.IntegerToColor(hair).darken(25).color;
    g.lineStyle(Math.max(2, lw * (meta.sex === 'f' ? 1.0 : 1.3)), browCol, 0.95);
    for (let i = 0; i < 2; i++) {
      const sgn = i === 0 ? -1 : 1;
      const [bin, barch, bout] = moved ? M.brow[i] : [0, 0, 0];
      const x0 = cx + sgn * (dx - 8 * F.s), x1 = cx + sgn * dx, x2 = cx + sgn * (dx + 8 * F.s);
      const y0 = browY + (1 + bin * k) * F.s, y1 = browY + (-3 + barch * k) * F.s, y2 = browY + (2 + bout * k) * F.s;
      new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x0, y0), new Phaser.Math.Vector2(x1, y1), new Phaser.Math.Vector2(x2, y2)).draw(g, 8);
    }
    if (moved && M.accent === 'crease' && !small) { g.lineStyle(lw * 0.6, skin, 0.9); g.lineBetween(cx - 2 * F.s, browY - 2 * F.s, cx - 1 * F.s, browY + 6 * F.s); g.lineBetween(cx + 2 * F.s, browY - 2 * F.s, cx + 1 * F.s, browY + 6 * F.s); }
  }
  // ---- mouth: cover the resting mouth, draw curve + opening
  const mc = M.mouth;
  const curve = mc.curve * k * F.s, open = mc.open * k, side = mc.side * k;
  if (!meta.masked && (Math.abs(curve) > 0.4 || open > 0.02)) {
    g.fillStyle(skin, 1);
    g.fillEllipse(cx, mouthY + 1 * F.s, 22 * F.s, 11 * F.s);
    const halfW = 8 * F.s;
    const apexX = cx + side * 4 * F.s;
    const lipCol = meta.sex === 'f' ? 0x7a3a34 : Phaser.Display.Color.IntegerToColor(skin).darken(35).color;
    if (open > 0.02) {
      const oh = (2 + open * 7) * F.s;
      g.fillStyle(0x2a1a18, 1);
      g.fillEllipse(apexX, mouthY + curve * 0.5 + oh * 0.35, halfW * 2 * (0.7 + open * 0.3), oh);
      if (M.accent === 'teeth' && !small) { g.fillStyle(0xe8e2d2, 1); g.fillRect(apexX - halfW * 0.7, mouthY + curve * 0.5 - oh * 0.1, halfW * 1.4, Math.max(1.5, oh * 0.28)); }
    }
    g.lineStyle(lw * 0.9, lipCol, 0.95);
    const left = new Phaser.Math.Vector2(cx - halfW, mouthY - curve * 0.15 * (1 + side));
    const right = new Phaser.Math.Vector2(cx + halfW, mouthY - curve * 0.15 * (1 - side));
    const apex = new Phaser.Math.Vector2(apexX, mouthY + curve);
    new Phaser.Curves.QuadraticBezier(left, apex, right).draw(g, 10);
    if (open > 0.02) { const bot = new Phaser.Math.Vector2(apexX, mouthY + curve + (2 + open * 7) * F.s * 0.8); new Phaser.Curves.QuadraticBezier(left, bot, right).draw(g, 10); }
  }
  // ---- accents
  if (small || meta.masked || meta.headCovered) return;
  if (M.accent === 'cheek') { g.lineStyle(lw * 0.6, skin, 0.7); for (const sgn of [-1, 1]) g.lineBetween(cx + sgn * (dx + 6 * F.s), mouthY - 6 * F.s, cx + sgn * (dx + 9 * F.s), mouthY - 14 * F.s); }
  if (M.accent === 'tear') { g.fillStyle(0xbfe0f0, 0.85 * k); g.fillEllipse(cx - dx - 2 * F.s, ey + eyeH + 6 * F.s, 2.2 * F.s, 5 * F.s); g.fillEllipse(cx - dx - 3 * F.s, ey + eyeH + 14 * F.s, 1.6 * F.s, 3 * F.s); }
  if (M.accent === 'sweat') { g.fillStyle(0xbfe0f0, 0.85 * k); g.fillEllipse(cx + dx + 12 * F.s, browY - 10 * F.s, 2.4 * F.s, 4 * F.s); }
  if (M.accent === 'nose') { g.lineStyle(lw * 0.6, skin, 0.9); g.lineBetween(cx - 5 * F.s, ey + 14 * F.s, cx - 2 * F.s, ey + 20 * F.s); }
}

// Wolf rig: ears (flat back / forward), squint, lip over the fangs.
function paintWolf(g, img, meta, moodId, k, F) {
  const fur = meta.furHex || 0x5a5a5f;
  const cx = F.x(W / 2);
  const back = (moodId === 'afraid' || moodId === 'pain' || moodId === 'surprised') ? 1 : 0;
  const fwd = (moodId === 'angry' || moodId === 'furious' || moodId === 'resolve') ? 1 : 0;
  const slack = (moodId === 'dazed') ? 1 : 0;
  if ((back || fwd || slack) && !meta.beast) {
    // repaint ears over the originals
    g.fillStyle(0x000000, 0);   // no-op to keep API symmetric
    for (const sgn of [-1, 1]) {
      const bx = cx + sgn * 20 * F.s, by = F.y(EYE_Y - 30);
      const tipX = cx + sgn * (44 + (fwd ? -8 : back ? 10 : 4) * k) * F.s;
      const tipY = F.y(EYE_Y - 72 + (back ? 30 : fwd ? -4 : 14) * k);
      // cover original ear with background-ish fur then draw new
      g.fillStyle(fur, 1);
      g.fillTriangle(bx, by, cx + sgn * 44 * F.s, F.y(EYE_Y - 72), cx + sgn * 44 * F.s, F.y(EYE_Y - 28));
      g.fillTriangle(bx, by, tipX, tipY, cx + sgn * 44 * F.s, F.y(EYE_Y - 28));
    }
  }
  // squint: fur-coloured lids over the gold eyes
  const lid = lerp(1, MOODS[moodId].lid, k);
  if (lid < 0.98) {
    g.fillStyle(fur, 1);
    for (const sgn of [-1, 1]) g.fillEllipse(cx + sgn * meta.eyeDX * F.s, F.y(meta.eyeY) - meta.eyeH * F.s * lid, (meta.eyeW*2+2) * F.s, 6 * F.s * (1 - lid) * 2 + 1);
  }
  // snarl: lip line raised, more fang
  if (fwd || moodId === 'furious') {
    g.lineStyle(Math.max(1.5, 3 * F.s), 0x1c1c1c, 0.9 * k);
    g.lineBetween(cx - 16 * F.s, F.y(meta.lipY), cx + 16 * F.s, F.y(meta.lipY));
    g.lineStyle(Math.max(1.5, 3 * F.s), 0xe8e2d2, 0.95 * k);
    for (const sgn of [-1, 1]) g.lineBetween(cx + sgn * 12 * F.s, F.y(meta.lipY+2), cx + sgn * 11 * F.s, F.y(meta.lipY+(meta.beast==='panther'?10:14)));
  }
  if (slack) { g.fillStyle(0x1c1c1c, 0.8 * k); g.fillEllipse(cx, F.y(meta.lipY+4), 14 * F.s, 6 * F.s); }
}

// Sentinel rig: the two visor lights change size, brightness and colour.
function paintSentinel(g, img, meta, moodId, k, F, extra) {
  const cx = F.x(W / 2);
  const y = F.y(EYE_Y - 1);
  const r0 = 4 * F.s;
  let r = r0, col = 0x58c8e8, a = 1;
  if (moodId === 'afraid' || moodId === 'surprised') { r = r0 * lerp(1, 0.55, k); a = lerp(1, 0.55, k); }
  else if (moodId === 'angry' || moodId === 'resolve') { r = r0 * lerp(1, 1.35, k); }
  else if (moodId === 'furious') { r = r0 * lerp(1, 1.5, k); col = 0xe84a3a; }
  else if (moodId === 'dazed') { const t = (extra && extra.t) || 0; a = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t / 90)); }
  else if (moodId === 'pain') { a = 1; }
  // cover the originals with visor black, then paint
  g.fillStyle(0x0e0e12, 1);
  g.fillRect(cx - 26 * F.s, y - 7 * F.s, 52 * F.s, 14 * F.s);
  for (let i = 0; i < 2; i++) {
    const sgn = i === 0 ? -1 : 1;
    if (moodId === 'pain' && i === 1) continue;   // one light out
    g.fillStyle(col, a * 0.35); g.fillCircle(cx + sgn * 14 * F.s, y, r * 2.2);
    g.fillStyle(col, a); g.fillCircle(cx + sgn * 14 * F.s, y, r);
  }
}

// ---- overlay lifecycle --------------------------------------------------------
function sigOf(img, mood, k, extra) {
  const F = frame(img);
  return [mood, k.toFixed(2), Math.round(F.ox), Math.round(F.oy), Math.round(F.w), depthOf(img), alphaOf(img).toFixed(2), extra ? Math.round((extra.t || 0) / 120) : 0].join('|');
}

// cheap profiling counters for the budget test (§3): overlay paint time
const STATS = { paintMs: 0, paints: 0, ticks: 0 };
const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
function timedPaint(g, img, meta, mood, k, extra) {
  const t0 = now(); paintMood(g, img, meta, mood, k, extra); STATS.paintMs += now() - t0; STATS.paints++;
}

// ---- beast portraits (HEALER_DRUID_PROMPT.md C1) ----------------------------
// The portrait becomes the beast, but it is still THIS person: the fur takes
// the hair colour, the eyes keep their colour, the costume's trim shows as a
// collar. Three rigs share the wolf's mood machinery (ears, eyes, lip line).
function drawBeast(ctx, beast, pal) {
  ctx.clearRect(0,0,W,H);
  const wolf=beast==='werewolf',bear=beast==='werebear',cat=!wolf&&!bear,cx=110;
  const fur=liftFur(pal.fur||'#554538'),eye=pal.eye||'#dbc477';
  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,pal.bg||'#39444a');bg.addColorStop(1,'#141e27');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  function shape(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  function volume(x,y,rx,ry,base){const g=ctx.createRadialGradient(x-rx*.35,y-ry*.45,2,x,y,Math.max(rx,ry));g.addColorStop(0,shade(base,1.65));g.addColorStop(.58,base);g.addColorStop(1,shade(base,.54));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  const body=ctx.createLinearGradient(25,175,200,280);body.addColorStop(0,shade(fur,1.38));body.addColorStop(.5,fur);body.addColorStop(1,shade(fur,.5));
  const shoulder=bear?8:cat?34:14;
  shape([[0,280],[shoulder,219],[48,196],[61,165],[159,165],[172,196],[220-shoulder,219],[220,280]],body);
  // Angular ruff silhouette breaks the round head outline.
  if(!cat)for(const side of [-1,1]){
    const pts=[[cx+side*32,123],[cx+side*(bear?64:55),118]];
    for(let i=0;i<9;i++){pts.push([cx+side*(58+i*2+(i%2?8:0)),132+i*11]);pts.push([cx+side*(52+i*2),138+i*11]);}
    pts.push([cx+side*20,234]);shape(pts,body);
  }
  volume(cx,bear?144:143,bear?66:cat?52:53,bear?67:cat?53:62,fur);
  // Bear ears are round, wolf ears tall and tufted, feline ears rounded and low.
  for(const side of [-1,1]){
    if(bear){volume(cx+side*49,79,19,21,fur);volume(cx+side*49,80,10,12,shade(fur,.55));}
    else if(wolf){shape([[cx+side*22,97],[cx+side*48,35],[cx+side*53,105]],shade(fur,1.12));shape([[cx+side*30,90],[cx+side*46,49],[cx+side*47,95]],'#796d66');shape([[cx+side*36,93],[cx+side*45,63],[cx+side*44,98]],shade(fur,.55));}
    else {volume(cx+side*37,94,16,22,fur);volume(cx+side*38,91,8,12,'#625756');}
  }
  volume(cx,127,bear?59:cat?46:47,bear?53:cat?43:49,fur);
  // Brow planes slope into a distinct muzzle bridge.
  for(const side of [-1,1]) {
    shape([[cx+side*8,108],[cx+side*25,96],[cx+side*(bear?47:39),103],[cx+side*34,116],[cx+side*13,120]],shade(fur,1.25));
    volume(cx+side*(cat?22:25),145,cat?23:25,cat?19:30,shade(fur,1.1));
  }
  const muzzle=cat?shade(fur,1.5):bear?'#88755e':shade(fur,1.9);
  volume(cx,cat?158:166,cat?26:bear?34:23,cat?22:bear?29:35,muzzle);
  const ey=EYE_Y+(wolf?-6:bear?-2:-4),dx=wolf?22:bear?24:20,ew=bear?7:cat?8:9,eh=cat?5:bear?5:5.5;
  for(const side of [-1,1]) {
    ctx.fillStyle='#111618';ctx.beginPath();ctx.ellipse(cx+side*dx,ey,ew+4,eh+3,-side*.15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=eye;ctx.beginPath();ctx.ellipse(cx+side*dx,ey,ew,eh,side*.18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#101819';ctx.beginPath();ctx.ellipse(cx+side*dx,ey,cat?1.6:2.7,eh*.85,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fffae3';ctx.beginPath();ctx.arc(cx+side*dx-2,ey-2,1.3,0,Math.PI*2);ctx.fill();
  }
  const ny=cat?145:bear?149:148;
  shape([[cx-12,ny-4],[cx+12,ny-4],[cx+9,ny+5],[cx,ny+10],[cx-9,ny+5]],'#161b1c');
  ctx.strokeStyle='#81817a';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(cx-8,ny-2);ctx.quadraticCurveTo(cx,ny-5,cx+6,ny-2);ctx.stroke();
  const lipY=cat?158:bear?178:172;
  ctx.strokeStyle='#201d1c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,ny+9);ctx.lineTo(cx,lipY);ctx.moveTo(cx-19,lipY);ctx.quadraticCurveTo(cx,lipY+9,cx+19,lipY);ctx.stroke();
  if(wolf){shape([[91,174],[129,174],[125,189],[110,195],[95,189]],'#2c171a');}
  for(const side of [-1,1]){
    shape([[cx+side*14-3,lipY+2],[cx+side*14+3,lipY+2],[cx+side*12,lipY+(wolf?17:11)]],'#dcd5ba');
    if(cat)for(let i=0;i<3;i++){ctx.strokeStyle='rgba(201,211,198,.65)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(cx+side*12,157+i*4);ctx.quadraticCurveTo(cx+side*35,152+i*6,cx+side*53,153+i*7);ctx.stroke();}
  }
  // Directional fur on forehead, cheek edges and shoulder planes; never across features.
  const rng=rngFor(879+(bear?19:cat?43:0));
  for(let i=0;i<(cat?120:470);i++){
    const x=rng.int(20,200),y=rng.int(85,279),dist=Math.abs(x-cx);
    if(y<190 && (dist<34 || dist> (y<102?26:y<149?46:bear?65:58)))continue;
    if(y>=190 && dist>(y-190)*.6+57)continue;
    const side=x<cx?-1:1,len=cat?3:5+rng.int(0,7);
    ctx.strokeStyle=i%4?rgba(shade(fur,1.9),cat?.18:.27):rgba('#080c12',.43);ctx.lineWidth=cat?.6:1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*2,y+len*.4,x+side*len*.5,y+len);ctx.stroke();
  }
  ctx.strokeStyle=pal.trim||'#b6a374';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(61,226);ctx.quadraticCurveTo(110,255,159,226);ctx.stroke();
  ctx.fillStyle='#d1c394';ctx.beginPath();ctx.arc(110,241,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#537767';ctx.beginPath();ctx.arc(110,241,3,0,Math.PI*2);ctx.fill();
  if(cat){volume(54,263,29,24,fur);for(let i=0;i<3;i++){ctx.strokeStyle=shade(fur,.5);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(37+i*12,254);ctx.lineTo(40+i*12,269);ctx.stroke();shape([[36+i*12,249],[40+i*12,238],[42+i*12,250]],'#c9cbbd');}}
  return {rig:'wolf',fur,earL:{x:cx-(bear?49:cat?37:36),y:bear?79:cat?91:60},earR:{x:cx+(bear?49:cat?37:36),y:bear?79:cat?91:60},eyeY:ey,eyeDX:dx,eyeW:ew,eyeH:eh,lipY};
}

const Portraits = {
  W, H, MOODS, MOOD_IDS, PERSONALITY_BIAS, TAG_MOODS, TAG_IGNORE, SET_LOOK, PATTERNS, STATS,
  CREATION_SLOTS: 17,
  slotTag(slot) {
    const rec = SLOT_RECIPES[slot];
    return (rec && rec.tag) || 'Look';
  },
  // Returns a texture key, generating the canvas texture on first request.
  key(scene, ch) {
    let key;
    const TYPE_TINTS = { marsh_stalker: '#2a4a2a', ember_cultist: '#7a3a1a', frost_hag: '#2a4a6a', gravewarden: '#3a3a26', field_chaplain: '#6a5a2a', cutpurse_leech: '#4a2a3a', moss_matron: '#2a5a3a' };
    const typeTint = ch.isMonster && TYPE_TINTS[ch.enemyTypeId];
    const setBit = ch.equippedSet ? '_s' + ch.equippedSet : '';
    const vetBit = '_r' + (ch.rank || 1) + 'q' + (ch.questsCompleted || 0);
    // campaign enemies: faction costume + skin palette
    const cdef = ch.isMonster && ch.enemyTypeId && ADV.DATA.CAMPAIGN_ENEMIES ? ADV.DATA.CAMPAIGN_ENEMIES[ch.enemyTypeId] : null;
    const factionSet = cdef && cdef.faction ? FACTION_SET[cdef.faction] : null;
    const skinBit = ch.skinTint ? '_k' + ch.skinTint.slice(1) : '';
    if (ch.portraitId && ch.isMonster) key = 'pm7_' + (ch.enemyTypeId || '') + '_' + (ch.sex || 'm') + '_' + ch.portraitId + (ch.boss ? '_boss' : '') + (ch.isUndead ? '_risen' : '') + (typeTint ? '_' + ch.enemyTypeId : '') + (factionSet ? '_f' + (cdef.faction) : '') + skinBit;
    else if (ch.portraitKind === 'campaign') key = 'pc6_' + ch.portraitId + setBit + vetBit;
    else if (ch.portraitId) key = 'pr6_' + ch.portraitId + setBit + vetBit;
    else if (ch.portraitKind === 'player') key = 'pp6_' + ch.portraitSlot + '_' + ch.sex + '_' + (ch.portraitSeed % 1000) + setBit + vetBit;
    else key = 'pn7_' + ch.sex + '_' + ch.portraitSeed + setBit + vetBit;
    if (cacheKeys.has(key) && scene.textures.exists(key)) return key;
    let rec = null, rig = null;
    const tex = scene.textures.createCanvas(key, W, H);
    const ctx = tex.getContext();
    if (ch.isMonster) {
      const bossTints = { bandit: '#7a3a2a', hedge_mage: '#5a2a6a', dire_wolf: '#3a1f1f', plated_sentinel: '#7a6a2a', grave_acolyte: '#2a4a3a' };
      const t = ch.isUndead ? '#2a3a3a' : ch.skinTint ? ch.skinTint : ch.boss ? bossTints[ch.portraitId] : (typeTint || null);
      const species = cdef ? cdef.species : (ADV.DATA.ENEMIES[ch.enemyTypeId] || {}).species;
      rig = drawMonster(ctx, ch.portraitId, t, { boss: !!ch.boss, factionSet: species === 'human' ? factionSet : null, sex: ch.sex || 'm', variant: ch.enemyTypeId || ch.portraitId });
    } else {
      if (ch.portraitKind === 'campaign') rec = recipeCampaign(ch.portraitId);
      else if (ch.portraitId === 'hiro') rec = finishRecipe(Object.assign({}, HIRO_RECIPE));
      else if (ch.portraitKind === 'player') rec = recipePlayer(ch.portraitSlot || 1, ch.sex, ch.portraitSeed);
      else rec = recipeNPC(ch.sex, ch.portraitSeed, ch.archetype);
      if (ch.equippedSet && ch.portraitId !== 'hiro') applySetLook(rec, ch.equippedSet);
      applyVeteran(rec, ch);
      drawBust(ctx, rec);
    }
    tex.refresh();
    cacheKeys.add(key);
    if (!META[key]) {
      const skinHex = rec && rec.skin ? rec.skin[0] : (rig && rig.skinHex) || null;
      const hairHex = rec && rec.hairColor ? rec.hairColor : (rig && rig.hairHex) || null;
      META[key] = Object.assign({
        eyeY: EYE_Y, eyeDX: EYE_DX, eyeW: 7.5, eyeH: (rec && rec.sex === 'f') ? 5.5 : 4.6,
        browY: EYE_Y - 12, mouthY: EYE_Y + 30,
        monster: !!ch.isMonster, rig: rig ? rig.rig : 'human',
        sex: rec ? rec.sex : (ch.sex || 'm'),
        lid: skinHex ? hexInt(shade(skinHex, 0.97)) : null,
        hair: hairHex ? hexInt(hairHex) : null,
        skinHex, hairBox: { x: W / 2 - 40, y: EYE_Y - 52, w: 80, h: 36 },
        masked: !!(rec && rec.masked) || !!(rig && rig.masked),
        browsCovered: !!(rec && (rec.headwear || rec.hairStyle === 'hood' || ['bandana','tricorne','bicorne','hood'].includes(rec.extrasKind))) || !!(rig && rig.browsCovered),
        headCovered: !!(rec && (rec.headwear || rec.hairStyle === 'hood' || ['bandana','tricorne','bicorne','hood'].includes(rec.extrasKind))) || !!(rig && rig.headCovered),
      }, rig || {});
      if (rig && rig.fur) META[key].furHex = hexInt(rig.fur);
    }
    return key;
  },

  // C1: the beast this character becomes. Palette from their own portrait meta.
  beastKey(scene, ch, beast) {
    beast = beast || 'werewolf';
    const humanKey = Portraits.key(scene, ch);
    const meta = metaFor(humanKey, ch);
    const hair = meta.hair != null ? '#' + meta.hair.toString(16).padStart(6, '0') : '#3a2a1c';
    const skin = meta.skinHex || '#8a5c3a';
    const look = ch.equippedSet && SET_LOOK[ch.equippedSet];
    const trim = look && look.palette && look.palette.trim ? (typeof look.palette.trim === 'number' ? '#' + look.palette.trim.toString(16).padStart(6, '0') : look.palette.trim) : '#8a6a2a';
    const eye = meta.eyeHex || (beast === 'panther' ? '#9ad84a' : '#c8a018');
    const key = 'pb2_' + beast + '_' + hair.slice(1) + '_' + skin.slice(1) + '_' + trim.slice(1);
    if (cacheKeys.has(key) && scene.textures.exists(key)) return key;
    const tex = scene.textures.createCanvas(key, W, H);
    const ctx = tex.getContext();
    const fur = beast === 'panther' ? shade(hair, 0.5) : shade(hair, 1.05);
    const rig = drawBeast(ctx, beast, { fur, eye, trim, bg: shade(skin, 0.35) });
    tex.refresh();
    cacheKeys.add(key);
    META[key] = Object.assign({
      eyeY: EYE_Y, eyeDX: EYE_DX, eyeW: 8, eyeH: 5, browY: EYE_Y - 12, mouthY: EYE_Y + 30,
      monster: true, rig: 'wolf', sex: ch.sex || 'm', lid: null, hair: hexInt(hair), skinHex: skin, beast,
      hairBox: { x: W / 2 - 40, y: EYE_Y - 52, w: 80, h: 36 }, masked: false,
    }, rig);
    META[key].furHex = hexInt(rig.fur);
    return key;
  },
  BEASTS: ['werewolf', 'werebear', 'panther'],

  // Idle life. A bust that breathes and blinks reads as a person; the same bust
  // held perfectly still reads as a placeholder. Two tweens, no new textures.
  animate(scene, img, ch, key) {
    if (!scene || !img || !img.scene) return () => {};
    const meta = metaFor(key, ch);
    const seed = Math.abs(((ch && (ch.portraitSeed || 0)) | 0) + ((ch && ch.name) ? ch.name.length : 0));
    const y0 = img.y;
    const bob = scene.tweens.add({
      targets: img, y: y0 - 2, duration: 2200 + (seed % 900),
      delay: seed % 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    if (meta.rig === 'sentinel') return () => { try { bob.remove(); } catch (e) {} };
    // blink: two lids painted over the eye line, in the portrait's own tone
    const lids = [];
    const lidCol = meta.rig !== 'human' ? (meta.furHex || 0x5a5a5f) : (meta.lid != null ? meta.lid : 0x8a5c3a);
    const drawLids = () => {
      if (!hostLive(img)) return;
      const F = frame(img);
      const ey = F.y(meta.eyeY);
      const dx = meta.eyeDX * F.s;
      for (const sgn of [-1, 1]) {
        const g = scene.add.graphics().setDepth(depthOf(img) + 1);
        adoptMask(g, img);
        followHost(scene, g, img);
        lids.push(g);
        g.fillStyle(lidCol, 1);
        g.fillEllipse(F.x(W / 2) + sgn * dx, ey + 1 * F.s, (meta.eyeW || 7.5) * 2.1 * F.s, (meta.eyeH || 5) * 2.2 * F.s);
      }
    };
    const clearLids = () => { for (const g of lids.splice(0)) { try { g.destroy(); } catch (e) {} } };
    let timer = null;
    const schedule = () => {
      timer = scene.time.delayedCall(2600 + Math.random() * 4200, () => {
        if (!img.scene) return;
        if (hostLive(img)) drawLids();
        scene.time.delayedCall(95, () => { clearLids(); if (img.scene) schedule(); });
      });
    };
    schedule();
    // gaze saccades (Part E1): tiny pupil drift every 1.5–4 s at rest
    let gazeTimer = null;
    if (meta.rig === 'human' && img.displayWidth >= 90) {
      const sac = () => {
        gazeTimer = scene.time.delayedCall(1500 + Math.random() * 2500, () => {
          if (!img.scene) return;
          if (!img.__gazeLock && hostLive(img)) Portraits.look(scene, img, ch, key, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.2, 260);
          sac();
        });
      };
      sac();
    }
    const stop = () => { try { bob.remove(); } catch (e) {} if (timer) { try { timer.remove(false); } catch (e) {} } if (gazeTimer) { try { gazeTimer.remove(false); } catch (e) {} } clearLids(); };
    try { img.once('destroy', stop); } catch (e) {}
    return stop;
  },

  // Standing expression (Part A). Neutral at any intensity, or intensity 0,
  // draws nothing. Repaints only when the image moved or the mood changed.
  express(scene, img, ch, key, mood, intensity) {
    if (!scene || !img || !img.scene) return () => {};
    mood = MOODS[mood] ? mood : 'neutral';
    const k = intensity == null ? 1 : Math.max(0, Math.min(1, intensity));
    if (img.__expressStop) { try { img.__expressStop(); } catch (e) {} img.__expressStop = null; }
    img.__expressMood = mood; img.__expressK = k;
    if (mood === 'neutral' || k <= 0.001) {
      const noop = () => { img.__expressMood = 'neutral'; img.__expressStop = null; };
      img.__expressStop = noop;
      try { img.once('destroy', noop); } catch (e) {}
      return noop;
    }
    const meta = metaFor(key, ch);
    const g = scene.add.graphics().setDepth(depthOf(img) + 3);
    try { g.__faceFx = true; } catch (e) {}
    let last = null;
    const extra = { t: 0 };
    const tick = (t) => {
      if (!img.scene) return;
      STATS.ticks++;
      extra.t = t || 0;
      if (!syncOverlay(g, img)) { last = null; try { g.clear(); } catch (e) {} return; }
      const sig = sigOf(img, mood, k, meta.rig === 'sentinel' && mood === 'dazed' ? extra : null);
      if (sig === last) return;
      last = sig;
      g.setDepth(depthOf(img) + 3); adoptMask(g, img);
      timedPaint(g, img, meta, mood, k, extra);
    };
    tick(0);
    scene.events.on('update', tick);
    const stop = () => {
      try { scene.events.off('update', tick); } catch (e) {}
      try { g.destroy(); } catch (e) {}
      img.__expressMood = null; img.__expressStop = null;
    };
    try { img.once('destroy', stop); } catch (e) {}
    img.__expressStop = stop;
    return stop;
  },

  // Transient expression (Part B): paints on top of the standing mood at depth
  // +4, eases in (~80 ms), holds, eases out (~200 ms), then removes itself.
  // Reactions queue per image; a repeat of the running mood extends the hold.
  react(scene, img, ch, key, mood, opts) {
    if (!scene || !img || !img.scene || !MOODS[mood] || mood === 'neutral') return;
    opts = opts || {};
    const ms = opts.ms != null ? opts.ms : 700;
    const k = opts.intensity == null ? 1 : Math.max(0, Math.min(1, opts.intensity));
    const q = img.__reactQ || (img.__reactQ = []);
    if (img.__reactCur && img.__reactCur.mood === mood) { img.__reactCur.until = Math.max(img.__reactCur.until, scene.time.now + ms); return; }
    q.push({ mood, ms, k });
    if (!img.__reactCur) Portraits._nextReact(scene, img, ch, key);
  },
  _nextReact(scene, img, ch, key) {
    const q = img.__reactQ;
    if (!q || !q.length || !img.scene) { img.__reactCur = null; return; }
    const r = q.shift();
    const meta = metaFor(key, ch);
    const g = scene.add.graphics().setDepth(depthOf(img) + 4).setAlpha(0);
    try { g.__faceFx = true; } catch (e) {}
    const fade = { a: 0 };
    const cur = { mood: r.mood, until: scene.time.now + r.ms, g };
    img.__reactCur = cur;
    let last = null;
    const tick = () => {
      if (!img.scene) return;
      const host = worldAlpha(img);
      try { g.setVisible(host > 0.02); g.setAlpha(host * fade.a); } catch (e) {}
      const sig = sigOf(img, r.mood, r.k, null);
      if (sig !== last) { last = sig; g.setDepth(depthOf(img) + 4); adoptMask(g, img); timedPaint(g, img, meta, r.mood, r.k, null); }
      if (scene.time.now >= cur.until && !cur.leaving) {
        cur.leaving = true;
        scene.tweens.add({ targets: fade, a: 0, duration: 200, onComplete: finish });
      }
    };
    const finish = () => {
      try { scene.events.off('update', tick); } catch (e) {}
      try { g.destroy(); } catch (e) {}
      try { img.off('destroy', finish); } catch (e) {}
      if (img.__reactCur === cur) img.__reactCur = null;
      if (img.scene) Portraits._nextReact(scene, img, ch, key);
    };
    scene.events.on('update', tick);
    scene.tweens.add({ targets: fade, a: 1, duration: 80 });
    try { img.once('destroy', finish); } catch (e) {}
  },

  // Part E1: gaze. Repaints iris+pupil offset toward (dx, dy) in [-1, 1]; a
  // duration eases there and back to centre. Skipped under 90 px.
  look(scene, img, ch, key, dx, dy, ms, hold) {
    if (!scene || !img || !img.scene) return;
    const meta = metaFor(key, ch);
    if (meta.rig !== 'human' || img.displayWidth < 90) return;
    if (img.__gazeG) { try { img.__gazeG.destroy(); } catch (e) {} img.__gazeG = null; }
    const g = scene.add.graphics().setDepth(depthOf(img) + 2);
    img.__gazeG = g;
    followHost(scene, g, img);
    const st = { t: 0 };
    const paint = () => {
      if (!img.scene) return;
      if (!syncOverlay(g, img)) { try { g.clear(); } catch (e) {} return; }
      g.clear(); adoptMask(g, img);
      const F = frame(img);
      const cx = F.x(W / 2), ey = F.y(meta.eyeY), edx = meta.eyeDX * F.s;
      const ox = dx * 2.6 * F.s * st.t, oy = dy * 1.6 * F.s * st.t;
      const eyeCol = meta.eyeHex != null ? meta.eyeHex : 0x3a2a20;
      for (const sgn of [-1, 1]) {
        // cover the resting iris with white, then redraw offset
        g.fillStyle(0xf2ede2, 1); g.fillEllipse(cx + sgn * edx + 1 * F.s, ey + 0.3 * F.s, 7.4 * F.s, (meta.eyeH || 5) * 1.6 * F.s);
        g.fillStyle(eyeCol, 1); g.fillCircle(cx + sgn * edx + 1 * F.s + ox, ey + 0.3 * F.s + oy, 3.5 * F.s);
        g.fillStyle(0x131313, 1); g.fillCircle(cx + sgn * edx + 1 * F.s + ox, ey + 0.3 * F.s + oy, 1.7 * F.s);
        g.fillStyle(0xffffff, 0.85); g.fillCircle(cx + sgn * edx - 0.3 * F.s + ox * 0.5, ey - 0.9 * F.s + oy * 0.5, 0.9 * F.s);
      }
    };
    const dur = ms || 260;
    const tw = scene.tweens.add({ targets: st, t: 1, duration: dur, ease: 'Sine.easeInOut', yoyo: !hold, hold: hold ? 0 : 900, onUpdate: paint,
      onComplete: () => { if (!hold) { try { g.destroy(); } catch (e) {} if (img.__gazeG === g) img.__gazeG = null; } } });
    const stop = () => { try { tw.remove(); } catch (e) {} try { g.destroy(); } catch (e) {} if (img.__gazeG === g) img.__gazeG = null; };
    try { img.once('destroy', stop); } catch (e) {}
    return stop;
  },

  // Part E3: head micro-motion. kind: 'nod' | 'shake' | 'tilt' | 'recoil' | 'slump'
  motion(scene, img, kind, opts) {
    if (!scene || !img || !img.scene) return;
    opts = opts || {};
    const x0 = img.x, y0 = img.y, r0 = img.rotation || 0;
    const a = opts.amount || 1;
    if (kind === 'nod') scene.tweens.add({ targets: img, y: y0 + 3 * a, duration: 110, yoyo: true, ease: 'Sine.easeInOut' });
    else if (kind === 'shake') scene.tweens.add({ targets: img, x: x0 - 3 * a, duration: 70, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => { if (img.scene) img.x = x0; } });
    else if (kind === 'tilt') scene.tweens.add({ targets: img, rotation: r0 + 0.04 * a, duration: 150, yoyo: true, hold: 300, ease: 'Sine.easeInOut', onComplete: () => { if (img.scene) img.rotation = r0; } });
    else if (kind === 'recoil') scene.tweens.add({ targets: img, rotation: r0 + (opts.side || 1) * 0.06 * a, x: x0 + (opts.side || 1) * 3 * a, duration: 60, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { if (img.scene) { img.rotation = r0; img.x = x0; } } });
    else if (kind === 'slump') scene.tweens.add({ targets: img, y: y0 + 6 * a, rotation: r0 + 0.05, duration: 600, ease: 'Quad.easeIn' });
  },

  // Part E4: skin states — palette-shift overlays over the face mask.
  // state: {pale, flush, sick, frozen, burning, wound} each 0..1 or bool
  skinState(scene, img, ch, key, state) {
    if (!scene || !img || !img.scene) return () => {};
    if (img.__skinStop) { try { img.__skinStop(); } catch (e) {} img.__skinStop = null; }
    const meta = metaFor(key, ch);
    const any = state && Object.keys(state).some(k => state[k]);
    if (!any || meta.rig !== 'human' || meta.masked || meta.headCovered) { const noop = () => {}; img.__skinStop = noop; return noop; }
    const g = scene.add.graphics().setDepth(depthOf(img) + 2);
    try { g.__faceFx = true; } catch (e) {}
    let last = null; let t0 = scene.time.now;
    const tick = (t) => {
      if (!img.scene) return;
      if (!syncOverlay(g, img)) { last = null; try { g.clear(); } catch (e) {} return; }
      const sig = sigOf(img, 'skin', 1, state.burning ? { t } : null) + JSON.stringify(state);
      if (sig === last) return; last = sig;
      g.clear(); g.setDepth(depthOf(img) + 2); adoptMask(g, img);
      const F = frame(img);
      const cx = F.x(W / 2), ey = F.y(meta.eyeY);
      const faceW = 52 * F.s, faceH = 70 * F.s;
      const small = F.w < 90;
      if (state.pale) { g.fillStyle(0xffffff, 0.12 * (+state.pale || 1)); g.fillEllipse(cx, ey + 8 * F.s, faceW, faceH); }
      if (state.flush && !small) { g.fillStyle(0xd04040, 0.10 * (+state.flush || 1)); for (const s of [-1, 1]) g.fillEllipse(cx + s * 18 * F.s, ey + 14 * F.s, 14 * F.s, 9 * F.s); }
      if (state.sick && !small) { g.fillStyle(0x6a9a5a, 0.08 * (+state.sick || 1)); g.fillEllipse(cx, ey + 8 * F.s, faceW, faceH); }
      if (state.frozen && !small) { g.lineStyle(Math.max(1.5, 3 * F.s), 0x8ac8ff, 0.55); g.strokeEllipse(cx, ey + 8 * F.s, faceW + 2 * F.s, faceH + 2 * F.s); }
      if (state.burning && !small) { const f = 0.5 + 0.5 * Math.sin(((t || 0) - t0) / 70); g.fillStyle(0xff7a2a, 0.12 + 0.1 * f); g.fillEllipse(cx, ey + 36 * F.s, 30 * F.s, 10 * F.s); }
      if (state.wound) { g.lineStyle(Math.max(1.2, 2 * F.s), 0x8a1f1c, 0.9); g.lineBetween(cx - 18 * F.s, ey - 12 * F.s, cx - 8 * F.s, ey + 14 * F.s); }
    };
    tick(scene.time.now);
    scene.events.on('update', tick);
    const stop = () => { try { scene.events.off('update', tick); } catch (e) {} try { g.destroy(); } catch (e) {} img.__skinStop = null; };
    try { img.once('destroy', stop); } catch (e) {}
    img.__skinStop = stop;
    return stop;
  },

  // Part E2: lip flap driven by an <audio> element (or a timed fallback).
  // Composes UNDER the standing expression: only the mouth opening is animated.
  lipFlap(scene, img, ch, key, audioEl, opts) {
    if (!scene || !img || !img.scene) return () => {};
    const meta = metaFor(key, ch);
    if (meta.rig !== 'human' || meta.masked) return () => {};
    opts = opts || {};
    const g = scene.add.graphics().setDepth(depthOf(img) + 2.5);
    try { g.__faceFx = true; } catch (e) {}
    // Timed flap only. Routing the clip through Web Audio
    // (createMediaElementSource) takes exclusive output — a suspended
    // AudioContext after a tab switch then mutes every later line.
    const words = Math.max(1, (opts.words || 6));
    const fallbackMs = opts.ms || Math.min(6000, 220 * words);
    const t0 = scene.time.now;
    let lastOpen = -1, acc = 0;
    const tick = (t, dt) => {
      if (!img.scene) return;
      if (!syncOverlay(g, img)) { try { g.clear(); } catch (e) {} return; }
      acc += dt || 16; if (acc < 66) return; acc = 0;   // ~15 Hz
      const elapsed = t - t0;
      const playing = audioEl && !audioEl.error && !audioEl.paused && !audioEl.ended;
      if (audioEl && (audioEl.ended || (audioEl.paused && audioEl.currentTime > 0))) { stop(); return; }
      if (!playing && elapsed > fallbackMs) { stop(); return; }
      const open = 0.15 + 0.3 * Math.abs(Math.sin(elapsed / 110)) * (Math.sin(elapsed / 370) > -0.3 ? 1 : 0);
      if (Math.abs(open - lastOpen) < 0.03) return; lastOpen = open;
      g.clear();
      if (open < 0.05) return;
      const F = frame(img);
      const cx = F.x(W / 2), my = F.y(meta.mouthY);
      const curve = ((img.__expressMood && MOODS[img.__expressMood]) ? MOODS[img.__expressMood].mouth.curve * (img.__expressK || 1) : 0) * F.s;
      g.fillStyle(0x2a1a18, 0.95);
      g.fillEllipse(cx, my + curve * 0.5 + 2 * F.s, 12 * F.s, (1.5 + open * 8) * F.s);
    };
    scene.events.on('update', tick);
    const stop = () => { try { scene.events.off('update', tick); } catch (e) {} try { g.destroy(); } catch (e) {} };
    try { img.once('destroy', stop); } catch (e) {}
    return stop;
  },

  // Part C: one standing-mood chooser for every surface.
  // context: 'dialogue'|'combat'|'town'|'roster'|'cutscene'|'death'; extra: {unit, st}
  moodFor(game, ch, context, extra) {
    extra = extra || {};
    const out = (mood, k) => ({ mood: MOODS[mood] ? mood : 'neutral', intensity: Math.max(0, Math.min(1, k == null ? 1 : k)) });
    if (!ch) return out('neutral', 0);
    const world = game && game.world;
    const isBoss = !!ch.boss;
    const isVillain = ch.status === 'villain';
    const pid = ch.personalityId || (ch.isPlayer ? null : null);
    const steady = (pid && STEADY[pid]) || ch.status === 'hero' || isBoss || isVillain ||
      (ch.perks || []).some(p => /bulwark|arena_champion|devoted/.test(p.skillId));
    // 1. combat state
    if (context === 'combat' && extra.unit) {
      const u = extra.unit;
      if (u.dead || u.downed || u.chp <= 0) return out('neutral', 0);
      const has = (k) => (u.statuses || []).some(s => s.kind === k);
      if (ch.status === 'undead' || ch.isUndead || u.risen) return out('dazed', 0.8);
      if (has('frozen') || has('shock') || has('shocked') || ch.status === 'conscript' || u.conscripted) return out('dazed', 1);
      const pct = u.maxHp ? u.chp / u.maxHp : 1;
      if (pct < 0.25) return isBoss || isVillain ? out('furious', 1) : steady ? out('resolve', 1) : out('afraid', 1);
      if (pct < 0.55) return out('pain', 0.5);
      if (u.stealth) return out('smug', 0.4);
      if (has('taunted') || has('marked')) return out('furious', 0.5);
      const st = extra.st;
      let turn = null;
      try { turn = st && ADV.Combat && ADV.Combat.currentTurn ? ADV.Combat.currentTurn(st) : null; } catch (e) { turn = null; }
      if (turn && turn.unit && turn.unit.uid === u.uid) return out('angry', 0.6);
      if (extra.facingUndead && !ch.isUndead && ch.status !== 'undead') return out('disgust', extra.cleanse ? 0.7 : 0.4);
      if (isVillain) return out('smug', 0.5);
    }
    // 2. undead
    if (ch.status === 'undead' || ch.isUndead) return out('dazed', 0.8);
    // 3. survival (players and NPCs)
    if (ADV.Survival && !ch.isMonster) {
      const sv = ADV.Survival.state(ch);
      if (sv.sick) return out('pain', 0.6);
      if (sv.hunger >= 4) return out('dazed', 0.8);
      if (sv.hunger > 0) return out('sad', 0.3 + (sv.hunger - 1) * 0.23);
    }
    // 4. recent event in the feed (last 2 quest ticks)
    if (world && world.eventFeed && !ch.isMonster) {
      const recent = world.eventFeed.slice(-60).filter(e => e.actorIds && e.actorIds.includes(ch.id) && (world.questClock - e.questClock) <= 2);
      for (let i = recent.length - 1; i >= 0; i--) {
        const t = recent[i].text.toLowerCase();
        if (/died|fell|was killed|buried|did not return/.test(t) && !new RegExp(ch.name.toLowerCase() + ' (died|fell|was killed)').test(t)) return out('grief', 1);
        if (/jilt|left .* for|broke off/.test(t)) return t.indexOf(ch.name.toLowerCase()) === 0 && /jilted/.test(t) ? out('smug', 0.6) : out('sad', 0.8);
        if (/married|wed|born|gave birth|a son|a daughter/.test(t)) return out('happy', 1);
        if (/fired|dismissed|robbed|stole|theft/.test(t)) return out('angry', 0.7);
        if (/became a hero|hero/.test(t) && ch.status === 'hero') return out('content', 0.8);
        if (/villain/.test(t) && isVillain) return out('smug', 0.8);
      }
    }
    // 5. relationship to the player / campaign role
    if (world && ADV.Rel && !ch.isPlayer && !ch.isMonster && world.playerId && ch.id !== world.playerId) {
      if (ch.campaign) {
        const def = ADV.DATA.CAMPAIGN_CHARS && ADV.DATA.CAMPAIGN_CHARS[ch.campaignId];
        if (def && def.role === 'rival') return out('smug', 0.7);
        if (def && def.role === 'antagonist') return out(context === 'combat' ? 'furious' : 'smug', 0.6);
      }
      let tier = 'neutral', score = 0;
      try { tier = ADV.Rel.tierBetween(world, ch.id, world.playerId); score = ADV.Rel.score(world, ch.id, world.playerId); } catch (e) {}
      const composed = pid && /^(F21|F25|F24|M01|M09|M21|M23)$/.test(pid);
      if (tier === 'romantic') return out(composed ? 'content' : 'tender', 0.8);
      if (tier === 'friendly') return out('content', 0.6);
      if (tier === 'hatred') { const H = ADV.DATA.CONST && ADV.DATA.CONST.REL ? Math.abs(ADV.DATA.CONST.REL.HATRED_MAX) : 30; return out('angry', Math.min(1, 0.5 + Math.abs(score) / (H * 2))); }
    }
    if (isVillain) return out('smug', 0.5);
    if (ch.isMonster && ch.boss) return out('angry', 0.35);
    // 6. personality baseline
    const b = pid && PERSONALITY_BIAS[pid];
    if (b) return out(b[0], b[1]);
    // 7.
    return out('neutral', 0);
  },

  // Reaction lookup for a raw dialogue line's delivery tags (Part B).
  // Returns [{mood, intensity}] in order of appearance; unknown tags skipped.
  tagsIn(rawLine) {
    const out = [];
    if (!rawLine) return out;
    const re = /\[([a-z][a-z ,'-]*)\]/gi; let m;
    while ((m = re.exec(rawLine))) {
      const tag = m[1].toLowerCase().trim();
      const r = TAG_MOODS[tag];
      if (r) out.push({ tag, mood: r[0], intensity: r[1] });
    }
    return out;
  },

  // Convenience: express the standing mood from moodFor in one call.
  stand(scene, img, game, ch, key, context, extra) {
    const m = Portraits.moodFor(game, ch, context, extra);
    return Portraits.express(scene, img, ch, key, m.mood, m.intensity);
  },

  // For the creation screen grid
  creationKey(scene, slot, sex) {
    return Portraits.key(scene, { portraitKind: 'player', portraitSlot: slot, sex, portraitSeed: slot * 7919 + (sex === 'f' ? 13 : 29) });
  },
  hiroKey(scene) { return Portraits.key(scene, { portraitId: 'hiro', portraitKind: 'player', sex: 'm' }); },

  // test/debug: draw a mood directly onto a canvas texture copy (contact sheets)
  _meta: META, _recipes: { recipePlayer, recipeNPC, recipeCampaign, applySetLook, drawBust, drawMonster },
};

ADV.Portraits = Portraits;
})();
