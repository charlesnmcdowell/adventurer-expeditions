// Adventurer: Expeditions — HUD and non-verbal guidance.
// Top: score and wave nodes. Bottom: portrait with an automatic Slash badge and
// three painted active controls with upgrade chips. Right: forward arrow.
// Guidance is a pointing hand + pulsing ring over the one thing to tap, with an
// input blocker behind it so the game holds until that thing is tapped.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const W = 1280, H = 760;
const D = X.UI.DEPTH;

// Authored Hiro art has a glyph fallback; other heroes retain their class glyphs.
const ICON_KEY = 'xp_hiro_skill_icons';
const PAINTED_SKILLS = new Set(['katana_slash', 'god_aura', 'counter_attack', 'finisher']);
function hasArt(scene, id) {
  return PAINTED_SKILLS.has(id) && scene.textures.exists(ICON_KEY) && scene.textures.get(ICON_KEY).has(id);
}
function paintedIcon(scene, id, x, y, size) {
  return hasArt(scene, id) ? scene.add.image(x, y, ICON_KEY, id).setDisplaySize(size, size) : null;
}
const CLASS_COLOR = { tank: 0x8fb4ff, fighter: 0xf2a25a, rogue: 0xb489ff, ranger: 0x9fd86a, mage: 0xff8f5a, druid: 0x7fd2a0, healer: 0xffe28a, hiro: 0xb489ff };
const SKILL_UI = {
  katana_slash:   { glyph: '⚔', color: 0xb489ff },
  god_aura:       { glyph: '◈', color: 0x8fd3ff },
  counter_attack: { glyph: '⟲', color: 0xf2d27a },
  finisher:       { glyph: '✦', color: 0xff8fa8 },
  shield_wall: { glyph: '⛨' }, cleave: { glyph: '⚔' }, taunt: { glyph: '☍' }, sunder: { glyph: '⚒' }, stand_fast: { glyph: '⟰' },
  venom_fang: { glyph: '☠' }, aimed_shot: { glyph: '➶' }, snare: { glyph: '⌗' }, smoke_bomb: { glyph: '☁' },
  fire_bolt: { glyph: '♨' }, spark: { glyph: '⚡' }, frost_touch: { glyph: '❄' }, ember_lash: { glyph: '〰' },
  bulwark: { glyph: '▣' }, momentum: { glyph: '»' }, arena_champion: { glyph: '♛' }, opportunist: { glyph: '◉' },
  marksman: { glyph: '◎' }, sniper: { glyph: '⌖' }, septic_sanguine: { glyph: '☣' }, arcane_focus: { glyph: '✧' },
  pyromaniac: { glyph: '🔥' }, lightning_king: { glyph: '☇' },
};
function ui(id) {
  const sk = (A.DATA.SKILLS || {})[id] || {};
  const e = SKILL_UI[id] || (SKILL_UI[id] = { glyph: (sk.name || id).charAt(0).toUpperCase() });
  if (!e.color) e.color = CLASS_COLOR[sk.archetype] || 0xc9c0b0;
  if (!e.short) e.short = (sk.name || id).split(' ')[0];
  return e;
}

class Hud {
  // Shared Painted.preload calls this for combat and the inn. A failed optional
  // image/atlas load leaves the existing glyph controls fully usable.
  static preloadArt(scene) {
    if (!scene.textures.exists(ICON_KEY)) scene.load.atlas(ICON_KEY, 'assets/expedition/icons/hiro-skills.webp', 'assets/expedition/icons/hiro-skills.json');
  }

  constructor(scene, opts) {
    this.scene = scene;
    this.run = opts.run;
    this.hero = opts.hero || null;
    this.kit = opts.kit || X.Encounter.kit(this.hero);
    this.onSkill = opts.onSkill || (() => {});
    this.onArrow = opts.onArrow || (() => {});
    this.onPause = opts.onPause || (() => {});
    this.icons = {}; this.perkIcons = {};
    this.build(opts);
  }

  // ---------------------------------------------------------------- build
  build(opts) {
    const s = this.scene;
    this.inn = !!opts.inn;
    if (this.inn) {
      // Inn mode: just the portrait and its icons, for levelling between quests.
      this.portrait = this.buildPortrait(opts.portraitKey, 150, H - 24);
      const pr = this.portrait.rect, pcx = pr.x + pr.w / 2, pcy = pr.y + pr.h / 2, R = pr.w / 2 + 58;
      this.kit.actives.forEach((id, i) => { const a = [-82, -40, 2][i] * Math.PI / 180; this.icons[id] = this.buildIcon(id, Math.round(pcx + Math.cos(a) * R), Math.round(pcy + Math.sin(a) * R), 'active'); });
      this.refresh();
      return;
    }
    // Score pill (top-left): the arcade counter, replacing the gold purse.
    this.scorePill = s.add.container(24, 20).setDepth(D.hud).setScrollFactor(0);
    const gbg = X.UI.frame(s,0,0,170,40);
    const star = T().text(s, 152, 20, '★', { size: 20, ox: 0.5, oy: 0.5, display: true, color: '#f2c94c' });
    this.scoreText = T().text(s, 132, 20, String(this.run.score || 0), { size: 20, ox: 1, oy: 0.5, display: true, color: '#f4eee0' });
    this.scorePill.add([gbg, star, this.scoreText]);
    this.scorePillRect = { x: 24, y: 20, w: 170, h: 40 };

    // Wave nodes (top-center)
    this.nodes = [];
    const n = X.encounters.length, cx = W / 2, gap = 74;
    this.nodeBar = s.add.container(0, 0).setDepth(D.hud).setScrollFactor(0);
    const bar = s.add.rectangle(cx, 40, gap * (n - 1) + 10, 6, 0x2a2420).setStrokeStyle(1, 0x000000, 0.6);
    this.nodeBar.add(bar);
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * gap;
      const c = s.add.container(x, 40);
      const ring = s.add.circle(0, 0, 20, 0x26211c).setStrokeStyle(3, 0x4a4036);
      const glyph = T().text(s, 0, 0, '⚔', { size: 18, ox: 0.5, oy: 0.5, color: '#8d8377' });
      c.add([ring, glyph]); c.ring = ring; c.glyph = glyph;
      this.nodeBar.add(c); this.nodes.push(c);
    }
    this.setWave(this.run.wave || 0);

    // Mute / pause / start over live in the scene's corner control (X.UI.corner), not here.

    // Portrait (bottom-left): actives as mini icons on an arc at its top-right,
    // perks on the mirror arc at its top-left (a picked hero only).
    const perks = this.kit.perks || [];
    this.portrait = this.buildPortrait(opts.portraitKey, perks.length ? 150 : 100, H - 24);
    const pr = this.portrait.rect, pcx = pr.x + pr.w / 2, pcy = pr.y + pr.h / 2, R = pr.w / 2 + 58;
    const angles = perks.length ? [-70, -28, 14] : [-82, -40, 2];
    this.kit.actives.forEach((id, i) => {
      const a = angles[i] * Math.PI / 180;
      this.icons[id] = this.buildIcon(id, Math.round(pcx + Math.cos(a) * R), Math.round(pcy + Math.sin(a) * R), 'active');
    });
    perks.forEach((id, i) => {
      const a = (180 - angles[i]) * Math.PI / 180;
      this.perkIcons[id] = this.buildIcon(id, Math.round(pcx + Math.cos(a) * R), Math.round(pcy + Math.sin(a) * R), 'perk');
    });

    // Forward arrow (right edge)
    this.arrow = this.buildArrow(W - 70, H / 2 - 40);
    this.arrow.root.setVisible(false);

    this.refresh();
  }

  iconButton(x, y, label, onTap) {
    const s = this.scene;
    const c = s.add.container(x, y).setDepth(D.hud).setScrollFactor(0);
    const g = s.add.graphics(); g.fillStyle(0x14110d, 0.85); g.fillRoundedRect(0, 0, 48, 40, 9); g.lineStyle(2, 0x3a3128, 1); g.strokeRoundedRect(0, 0, 48, 40, 9);
    const t = T().text(s, 24, 20, label, { size: 16, ox: 0.5, oy: 0.5, color: '#f4eee0' });
    const z = s.add.zone(24, 20, 48, 40).setInteractive({ useHandCursor: true });
    z.on('pointerdown', onTap);
    c.add([g, t, z]); c.label = t;
    return c;
  }


  buildPortrait(key, x, bottom) {
    const s = this.scene;
    const w = 128, h = 128;
    const c = s.add.container(x, bottom - h / 2).setDepth(D.hud).setScrollFactor(0);
    const frame = s.add.graphics(); frame.fillStyle(0x14110d, 0.95); frame.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 12); frame.lineStyle(3, 0x5a4a34, 1); frame.strokeRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 12);
    const img = s.add.image(0, 0, key).setDisplaySize(w, h);
    const mask = s.add.graphics().fillRoundedRect(x - w / 2, bottom - h, w, h, 10);
    img.setMask(mask.createGeometryMask()); mask.setVisible(false);
    // A bracket ties the icon row to the portrait.
    const bracket = s.add.graphics(); bracket.lineStyle(3, 0x5a4a34, 1); bracket.beginPath(); bracket.moveTo(w / 2 + 6, -12); bracket.lineTo(w / 2 + 20, -12); bracket.lineTo(w / 2 + 20, 12); bracket.lineTo(w / 2 + 6, 12); bracket.strokePath();
    c.add([frame, img, bracket]);
    // Slash stays automatic; this art is a label, never a fourth input control.
    {
      const auto = s.add.container(-42, h / 2 - 18);
      const bg = s.add.rectangle(20, 0, 76, 34, 0x14110d, 0.92).setStrokeStyle(1, 0x5a4a34);
      const art = paintedIcon(s, 'katana_slash', 0, 0, 32);
      const symbol = art || T().text(s, 0, 0, ui('katana_slash').glyph, { size: 20, ox: 0.5, oy: 0.5, color: '#b489ff' });
      const label = T().text(s, 20, 0, 'AUTO', { size: 11, ox: 0, oy: 0.5, color: '#e8dfc8', display: true });
      auto.add([bg, symbol, label]); c.add(auto); c.autoSlashBadge = auto;
    }
    c.rect = { x: x - w / 2 - 6, y: bottom - h - 6, w: w + 12, h: h + 12 };
    return c;
  }

  // One skill icon: painted art (or glyph), a cooldown wedge, and a glow when
  // ready to use. Arcade: no lock, no level pips, no + badge; nothing is bought.
  buildIcon(id, x, y, kind) {
    const s = this.scene, u = ui(id), perk = kind === 'perk';
    const painted = !perk && PAINTED_SKILLS.has(id);
    const r = painted ? 34 : (perk ? 15 : (X.hudIconR || 18));
    const c = s.add.container(x, y).setDepth(D.hud).setScrollFactor(0);
    const glow = s.add.circle(0, 0, r + 8, u.color, 0.0).setStrokeStyle(3, 0xffe28a, 0);
    const disc = perk || painted ? s.add.rectangle(0, 0, r * 2, r * 2, 0x14110d, 0.95).setStrokeStyle(3, u.color, 1) : s.add.circle(0, 0, r, 0x14110d, 0.95).setStrokeStyle(3, u.color, 1);
    const fill = perk ? s.add.rectangle(0, 0, r * 2 - 6, r * 2 - 6, u.color, 0.22) : s.add.circle(0, 0, r - 3, u.color, 0.22);
    const glyph = T().text(s, 0, 0, u.glyph, { size: perk ? 14 : Math.round(r * 0.9), ox: 0.5, oy: 0.5, color: '#ffffff' });
    const art = paintedIcon(s, id, 0, 0, 64);
    glyph.setVisible(!art);
    const cd = s.add.graphics();                    // cooldown wedge
    const hitSize = Math.max(48, r * 2 + 8);
    const zone = s.add.zone(0, 0, hitSize, hitSize).setInteractive({ useHandCursor: true });
    // A tap: perk → what it does; active → a request.
    // A hold of X.infoHoldMs: the info box, which lingers X.infoLingerMs after release.
    let holdTimer = null, held = false;
    const tap = () => { if (perk) this.infoChip(id); else this.onSkill(id); };
    zone.on('pointerdown', () => {
      held = false;
      if (holdTimer) holdTimer.remove(false);
      holdTimer = s.time.delayedCall(X.infoHoldMs || 3000, () => { held = true; holdTimer = null; this.infoChip(id, null, { hold: true }); });
    });
    const up = () => {
      if (holdTimer) { holdTimer.remove(false); holdTimer = null; if (!held) tap(); }
      if (held && this.info && this.info.id === id) this.lingerInfo();
      held = false;
    };
    zone.on('pointerup', up); zone.on('pointerout', () => { if (holdTimer) { holdTimer.remove(false); holdTimer = null; } if (held) this.lingerInfo(); held = false; });
    c.add([glow, disc, fill, ...(art ? [art] : []), glyph, cd, zone]);
    Object.assign(c, { glow, disc, fill, glyph, art, cd, zone, r, id, kind: kind || 'active' });
    c.rect = { x: x - hitSize / 2, y: y - hitSize / 2, w: hitSize, h: hitSize };
    return c;
  }

  buildArrow(x, y) {
    const s = this.scene;
    const root = s.add.container(x, y).setDepth(D.hud).setScrollFactor(0);
    const bg = X.UI.frame(s,-40,-40,80,80);
    const tri = s.add.graphics();
    tri.fillStyle(0xe9c975);tri.fillPoints([{x:-23,y:-18},{x:2,y:-18},{x:2,y:-30},{x:27,y:-7},{x:2,y:16},{x:2,y:4},{x:-23,y:4}],true);
    tri.lineStyle(2,0xffefbc);tri.lineBetween(-20,-16,1,-16);
    const label=T().text(s,0,25,'Next',{size:16,ox:.5,oy:.5,display:true,color:'#fff0c9'});
    const zone = s.add.zone(0, 0, 90, 90).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.onArrow());
    root.add([bg, tri, label, zone]);
    const pulse = s.tweens.add({ targets: root, scale: 1.035, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    return { root, zone, pulse, rect: { x: x - 40, y: y - 40, w: 80, h: 80 } };
  }

  // ---------------------------------------------------------------- state
  setWave(i) {
    this.run.wave = i;
    this.nodes.forEach((c, k) => {
      if (k < i) { c.ring.setFillStyle(0x2f6b33).setStrokeStyle(3, 0x62c95a); c.glyph.setText('✓').setColor('#c8f0c0'); }
      else if (k === i) { c.ring.setFillStyle(0x7a1f1f).setStrokeStyle(3, 0xd9433b); c.glyph.setText('⚔').setColor('#ffe0dc'); c.setScale(1.15); }
      else { c.ring.setFillStyle(0x26211c).setStrokeStyle(3, 0x4a4036); c.glyph.setText('⚔').setColor('#8d8377'); c.setScale(1); }
    });
  }

  setScore(n, animate) {
    if (!this.scoreText) return;
    if (!animate) { this.scoreText.setText(String(n)); return; }
    const from = parseInt(this.scoreText.text, 10) || 0;
    const o = { v: from };
    this.scene.tweens.add({ targets: o, v: n, duration: 600, ease: 'Sine.Out', onUpdate: () => this.scoreText.setText(String(Math.round(o.v))) });
    this.scene.tweens.add({ targets: this.scorePill, scale: 1.12, duration: 120, yoyo: true });
  }

  // Points fly from a point to the pill as sparks, then the counter ticks up.
  payout(fromX, fromY, amount, done) {
    const s = this.scene;
    const n = Math.min(12, Math.max(4, Math.round(amount / 60)));
    for (let i = 0; i < n; i++) {
      const c = s.add.circle(fromX + (Math.random() - 0.5) * 60, fromY + (Math.random() - 0.5) * 40, 7, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f).setDepth(D.hud + 1);
      s.tweens.add({ targets: c, x: 176, y: 40, duration: 520 + i * 60, delay: i * 40, ease: 'Sine.In', onComplete: () => c.destroy() });
    }
    const label = T().text(s, fromX, fromY - 30, '+' + amount, { size: 26, ox: 0.5, oy: 0.5, display: true, color: '#ffe28a' }).setDepth(D.hud + 1);
    label.setStroke('#000000', 5);
    s.tweens.add({ targets: label, y: fromY - 90, alpha: 0, duration: 900, ease: 'Sine.Out', onComplete: () => label.destroy() });
    s.time.delayedCall(560 + n * 60, () => { this.setScore(this.run.score || 0, true); if (done) done(); });
  }

  refresh() {
    // Arcade: every skill is owned at one level, so an icon is simply lit.
    for (const id of Object.keys(this.icons)) {
      const c = this.icons[id];
      c.glyph.setVisible(!c.art);
      if (c.art) c.art.setAlpha(1);
      c.disc.setStrokeStyle(3, SKILL_UI[id].color, 1);
      c.fill.setFillStyle(SKILL_UI[id].color, 0.22);
    }
  }

  // Ready glow / cooldown wedge per icon. states: { skillId: {ready, reason, left} }
  setSkillStates(states) {
    for (const id of Object.keys(this.icons)) {
      const c = this.icons[id], st = states && states[id];
      const owned = X.Encounter.owned(this.run, id);
      const ready = owned && !!(st && st.ready);
      if (c.art) c.art.setAlpha(!owned ? 0.25 : (ready ? 1 : 0.58));
      if (ready && !c.readyTween) {
        c.glow.setStrokeStyle(4, 0xffe28a, 1).setFillStyle(ui(id).color, 0.18);
        c.readyTween = this.scene.tweens.add({ targets: c.glow, alpha: 0.35, duration: 420, yoyo: true, repeat: -1 });
        this.scene.tweens.add({ targets: c, scale: 1.18, duration: 110, yoyo: true });     // the pop when it comes off cooldown
        c.glyph.setColor('#ffffff'); c.fill.setAlpha(1);
      } else if (!ready && c.readyTween) {
        c.readyTween.stop(); c.readyTween = null; c.glow.setAlpha(1).setStrokeStyle(4, 0xffe28a, 0).setFillStyle(ui(id).color, 0);
      }
      if (!ready && owned) { c.glyph.setColor('#9a9184'); c.fill.setAlpha(0.35); }
      // Cooldown wedge: the remaining fraction of the icon shaded clockwise.
      c.cd.clear();
      // Recovery is wall-clock since 2026-09-22, so the wedge drains smoothly
      // rather than stepping once per turn. `leftMs` comes from the encounter's
      // own timer; the turn-based path is kept for any kit that still uses it.
      const maxCd = owned ? this.cooldownOf(id) : 0;
      const usingMs = st && st.leftMs != null;
      const left = st && st.reason === 'cooldown' ? (usingMs ? st.leftMs : st.left) : 0;
      const span = usingMs ? this.cooldownMsOf(id) : maxCd;
      if (left > 0 && span > 0) {
        const frac = Math.min(1, left / span);
        c.cd.fillStyle(0x000000, 0.6); c.cd.slice(0, 0, c.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false); c.cd.fillPath();
      }
    }
  }
  setFinisher(state) { this.setSkillStates({ finisher: state }); }
  // The full recovery for this skill in milliseconds, so the wedge knows what
  // fraction is left. Zero when the skill has no clock-based recovery.
  cooldownMsOf(id) {
    return (X.cooldownMsFor ? X.cooldownMsFor(id, 1) : 0) || 0;
  }
  cooldownOf(id) {
    return ((X.skills[id] || {})[1] || {}).cooldown || 0;
  }

  // ---------------------------------------------------------------- info chip
  // What a skill is: its tier name, kind, and one line of what it does. Opens on a
  // perk tap or an active tapped while it cannot fire; closes on the next tap.
  // The info box: big enough to read on a phone, written for a fourth-grader
  // (X.skillText). Opened by a hold (opts.hold) it stays until the finger lifts,
  // then lingers X.infoLingerMs; opened by a tap (a dark icon's reason, a perk)
  // it closes itself after the linger.
  infoChip(id, reason, opts) {
    opts = opts || {};
    this.closeInfo();
    const s = this.scene, icon = this.icons[id] || this.perkIcons[id]; if (!icon) return;
    const sk = A.DATA.SKILLS[id] || { name: id, desc: '' };
    const kid = X.skillText && X.skillText[id];
    const name = kid ? kid.name : sk.name;
    const w = 340, pad = 16;
    const c = s.add.container(0, 0).setDepth(D.hud + 2);
    const title = T().text(s, -w / 2 + pad, 0, ui(id).glyph + '  ' + name, { size: 20, color: '#f4eee0', display: true });
    const sub = T().text(s, -w / 2 + pad, 28, (sk.kind === 'perk' ? 'Perk' : 'Skill') + (reason ? '  ·  ' + reason : ''), { size: 14, color: '#c9c0b0' });
    const text = kid ? kid.text : (sk.desc || '').split('. ')[0].replace(/\.?$/, '.');
    const body = T().text(s, -w / 2 + pad, 54, text, { size: 16, color: '#e8dfc8', wrap: w - pad * 2 });
    const h = 54 + body.height + pad;
    const g = s.add.graphics(); g.fillStyle(0x1c1712, 0.97); g.fillRoundedRect(-w / 2, -pad, w, h + pad, 12); g.lineStyle(3, ui(id).color, 1); g.strokeRoundedRect(-w / 2, -pad, w, h + pad, 12);
    c.add([g, title, sub, body]);
    c.x = Math.min(W - w / 2 - 8, Math.max(w / 2 + 8, icon.x + 60)); c.y = icon.y - h - 40;
    c.setAlpha(0); s.tweens.add({ targets: c, alpha: 1, y: c.y - 6, duration: 140 });
    this.info = { root: c, id, rect: { x: c.x - w / 2, y: c.y - pad - 6, w, h: h + pad } };
    if (opts.hold) { if (this.gateActive() && this._gateFor === 'inspect:' + id) this.releaseGate({ inspected: id }); }
    else this.lingerInfo();
    return this.info;
  }
  lingerInfo() {
    const c = this.info && this.info.root; if (!c) return;
    this.scene.time.delayedCall(X.infoLingerMs || 3000, () => { if (this.info && this.info.root === c) this.closeInfo(); });
  }
  closeInfo() { if (this.info) { this.info.root.destroy(); this.info = null; } }
  // Tutorial: hold on an icon until the player has held it long enough to read it.
  gateUntilInspected(icon) {
    const p = this.gate(icon.rect, { skippable: true, hint: 'hold' });
    this._gateFor = 'inspect:' + icon.id;
    return p;
  }

  // A tap was accepted: the icon presses, and a gold "queued" ring stays on it
  // until the skill actually fires (setQueued(null)).
  flashQueued(id) {
    const s = this.scene, c = this.icons[id]; if (!c) return;
    s.tweens.add({ targets: c, scale: 0.86, duration: 70, yoyo: true });
    this.setQueued(id);
  }
  setQueued(id) {
    for (const k of Object.keys(this.icons)) {
      const c = this.icons[k];
      if (k === id) {
        if (!c.queuedRing) { c.queuedRing = this.scene.add.circle(0, 0, c.r + 5, 0xffe28a, 0).setStrokeStyle(3, 0xffe28a, 1); c.addAt(c.queuedRing, 1); this.scene.tweens.add({ targets: c.queuedRing, scale: 1.12, duration: 300, yoyo: true, repeat: -1 }); }
      } else if (c.queuedRing) { c.queuedRing.destroy(); c.queuedRing = null; }
    }
  }
  // The queued skill fires: a streak from the icon to the actor, ring cleared.
  fired(id, toX, toY) {
    const c = this.icons[id]; if (!c) return;
    this.setQueued(null);
    const s = this.scene;
    const streak = s.add.circle(c.x, c.y, 10, ui(id).color, 0.95).setDepth(D.hud + 2);
    s.tweens.add({ targets: streak, x: toX, y: toY, duration: 220, ease: 'Power2', onComplete: () => { A.VFX.burst(s, toX, toY, ui(id).color, 10); streak.destroy(); } });
  }

  shakeIcon(id) { const c = this.icons[id] || this.portrait; this.scene.tweens.add({ targets: c, x: c.x + 5, duration: 40, yoyo: true, repeat: 3 }); }
  shakePortrait() { this.shakeIcon('finisher'); }

  // ---------------------------------------------------------------- arrow
  showArrow() { this.arrow.root.setVisible(true).setScale(0.2); this.scene.tweens.add({ targets: this.arrow.root, scale: 1, duration: 260, ease: 'Back.Out' }); }
  hideArrow() { this.arrow.root.setVisible(false); }

  // ---------------------------------------------------------------- guidance
  // Hold the game on one rect (see UI.gate). Resolves when the real control
  // under the hole is tapped (its handler calls releaseGate) or on skip.
  gate(rect, opts) {
    this.clearGate();
    this._gate = X.UI.gate(this.scene, rect, opts);
    this._gateRect = rect;
    return this._gate.promise.then(r => { this._gate = null; this._gateRect = null; this._gateFor = null; return r; });
  }
  releaseGate(payload) { return this._gate ? this._gate.release(payload) : false; }
  gateActive() { return !!(this._gate && this._gate.active); }
  clearGate() { if (this._gate) { this._gate.clear(); } }

  // ---------------------------------------------------------------- overlays
  // Quest-complete card: the points this quest paid, the score, the three skills, onward.
  completion(run, onReplay, opts) {
    opts = opts || {};
    const s = this.scene;
    const w = 420, h = 250, x = W / 2, y = H / 2 - 20;
    const c = s.add.container(x, y).setDepth(D.hud + 5).setScrollFactor(0);
    const shade = s.add.rectangle(0, 0, W, H, 0x000000, 0.35).setInteractive();
    const g = s.add.graphics(); g.fillStyle(0x14110d, 0.96); g.fillRoundedRect(-w / 2, -h / 2, w, h, 16); g.lineStyle(3, 0xf2c94c, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const title = T().text(s, 0, -h / 2 + 34, opts.title || 'Contract done', { size: 28, ox: 0.5, oy: 0.5, display: true, color: '#f4eee0' });
    const coin = T().text(s, -30, -h / 2 + 84, '★', { size: 24, ox: 0.5, oy: 0.5, display: true, color: '#f2c94c' });
    const earned = opts.points != null ? opts.points : (run.score || 0);
    const gold = T().text(s, -8, -h / 2 + 84, (opts.points != null ? '+' : '') + String(earned), { size: 22, ox: 0, oy: 0.5, display: true, color: '#f4eee0' });
    const total = T().text(s, 0, -h / 2 + 112, 'Score ' + (run.score || 0) + '   ·   Playthrough ' + (run.loop || 1), { size: 14, ox: 0.5, oy: 0.5, color: '#c9c0b0' });
    const row = s.add.container(0, -h / 2 + 150);
    this.kit.actives.forEach((id, i) => {
      const u = ui(id), cx = (i - 1) * 96;
      const disc = s.add.circle(cx, 0, 20, 0x14110d, 1).setStrokeStyle(3, u.color, 1);
      const glyph = T().text(s, cx, 0, u.glyph, { size: 18, ox: 0.5, oy: 0.5, color: '#ffffff' });
      row.add([disc, glyph]);
    });
    const bw = 200, bh = 46, by = h / 2 - 44;
    const bg = s.add.graphics(); bg.fillStyle(0x62c95a, 1); bg.fillRoundedRect(-bw / 2, by - bh / 2, bw, bh, 10);
    const glyph = T().text(s, 0, by, '↻', { size: 28, ox: 0.5, oy: 0.5, color: '#0f2d0f', display: true });
    const zone = s.add.zone(0, by, bw, bh).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (onReplay) onReplay(); });
    c.add([shade, g, title, coin, gold, total, row, bg, glyph, zone]);
    c.setScale(0.7); s.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.Out' });
    this.completionCard = { root: c, replayRect: { x: x - bw / 2, y: y + by - bh / 2, w: bw, h: bh } };
    return this.completionCard;
  }

  // Defeat card: Again (same fight, new seed) or, past the tutorial, back to the inn
  // with the gold already won — the loop never traps a party that came under-manned.
  defeatCard(opts, onAgain, onInn) {
    opts = opts || {};
    const s = this.scene;
    const two = !!onInn;
    const w = 420, h = two ? 210 : 170, x = W / 2, y = H / 2 - 20;
    const c = s.add.container(x, y).setDepth(D.hud + 5).setScrollFactor(0);
    const shade = s.add.rectangle(0, 0, W, H, 0x000000, 0.35).setInteractive();
    const g = s.add.graphics(); g.fillStyle(0x14110d, 0.96); g.fillRoundedRect(-w / 2, -h / 2, w, h, 16); g.lineStyle(3, 0xd9433b, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const title = T().text(s, 0, -h / 2 + 34, opts.title || 'Down', { size: 28, ox: 0.5, oy: 0.5, display: true, color: '#f4eee0' });
    const sub = T().text(s, 0, -h / 2 + 68, opts.sub || '', { size: 15, ox: 0.5, oy: 0.5, color: '#c9c0b0' });
    const bw = 200, bh = 46, by = -h / 2 + 118;
    const button = (cx, cy, color, glyph, label, fg, on) => {
      const bg = s.add.graphics(); bg.fillStyle(color, 1); bg.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 10);
      const gl = T().text(s, cx - (label ? 40 : 0), cy, glyph, { size: 26, ox: 0.5, oy: 0.5, color: fg, display: true });
      const lb = label ? T().text(s, cx + 12, cy, label, { size: 16, ox: 0.5, oy: 0.5, color: fg, display: true }) : null;
      const zone = s.add.zone(cx, cy, bw, bh).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { if (on) on(); });
      c.add(lb ? [bg, gl, lb, zone] : [bg, gl, zone]);
      return { x: x + cx - bw / 2, y: y + cy - bh / 2, w: bw, h: bh };
    };
    c.add([shade, g, title, sub]);
    const againRect = button(0, by, 0x62c95a, '↻', two ? 'Again' : '', '#0f2d0f', onAgain);
    const innRect = two ? button(0, by + 58, 0x8a7a5a, '⌂', 'Back to the inn', '#f4eee0', onInn) : null;
    c.setScale(0.7); s.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.Out' });
    this.defeatCardObj = { root: c, againRect, innRect };
    return this.defeatCardObj;
  }

  banner(text, ms) {
    const s = this.scene;
    const t = T().text(s, W / 2, 120, text, { size: 30, ox: 0.5, oy: 0.5, display: true, color: '#f4eee0' }).setDepth(D.hud + 3).setAlpha(0);
    t.setStroke('#000000', 6);
    s.tweens.add({ targets: t, alpha: 1, y: 110, duration: 220 });
    s.time.delayedCall(ms || 1400, () => s.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }));
    return t;
  }
}

X.Hud = Hud;
X.SKILL_UI = SKILL_UI;
X.skillUi = ui;
})();
