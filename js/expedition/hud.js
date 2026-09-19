// Adventurer: Expeditions — HUD and non-verbal guidance.
// Top: gold, wave nodes, mute/pause. Bottom: Hiro's portrait as the Finisher
// control, four upgrade cards with inline confirm chips. Right: forward arrow.
// Guidance is a pointing hand + pulsing ring over the one thing to tap, with an
// input blocker behind it so the game holds until that thing is tapped.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const W = 1280, H = 760;
const D = X.UI.DEPTH;

// Placeholder glyphs until the painted icon set lands; colour follows the class.
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
// Tier a known skill manifests at (gear can lift it): 1 basic, 2 intermediate, 3 advanced.
function tierIndex(ch, skillId) {
  const e = ch && A.SkillSys.knownEntry(ch, skillId); if (!e) return 0;
  const t = A.SkillSys.tierFor(ch, skillId, A.SkillSys.effectiveLevel(ch, skillId, e.level));
  return { basic: 1, intermediate: 2, advanced: 3 }[t] || 1;
}
function tierName(ch, skillId) {
  const e = ch && A.SkillSys.knownEntry(ch, skillId); if (!e) return '';
  const m = A.SkillSys.manifest(ch, e);
  return (m && m.data && m.data.name) || (A.DATA.SKILLS[skillId] || {}).name || skillId;
}
function ui(id) {
  const sk = (A.DATA.SKILLS || {})[id] || {};
  const e = SKILL_UI[id] || (SKILL_UI[id] = { glyph: (sk.name || id).charAt(0).toUpperCase() });
  if (!e.color) e.color = CLASS_COLOR[sk.archetype] || 0xc9c0b0;
  if (!e.short) e.short = (sk.name || id).split(' ')[0];
  return e;
}

class Hud {
  constructor(scene, opts) {
    this.scene = scene;
    this.run = opts.run;
    this.hero = opts.hero || null;
    this.kit = opts.kit || X.Encounter.kit(this.hero);
    this.onSkill = opts.onSkill || (() => {});
    this.onUpgrade = opts.onUpgrade || (() => {});
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
      const pr = this.portrait.rect, pcx = pr.x + pr.w / 2, pcy = pr.y + pr.h / 2, R = pr.w / 2 + 30;
      this.kit.actives.forEach((id, i) => { const a = [-82, -40, 2][i] * Math.PI / 180; this.icons[id] = this.buildIcon(id, Math.round(pcx + Math.cos(a) * R), Math.round(pcy + Math.sin(a) * R), 'active'); });
      this.refresh();
      return;
    }
    // Gold pill (top-left)
    this.goldPill = s.add.container(24, 20).setDepth(D.hud).setScrollFactor(0);
    const gbg = s.add.graphics(); gbg.fillStyle(0x14110d, 0.85); gbg.fillRoundedRect(0, 0, 150, 40, 10); gbg.lineStyle(2, 0x3a3128, 1); gbg.strokeRoundedRect(0, 0, 150, 40, 10);
    const coin = s.add.circle(122, 20, 12, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f);
    this.goldText = T().text(s, 100, 20, String(this.run.gold), { size: 20, ox: 1, oy: 0.5, display: true, color: '#f4eee0' });
    this.goldPill.add([gbg, coin, this.goldText]);
    this.goldPillRect = { x: 24, y: 20, w: 150, h: 40 };

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
    const pr = this.portrait.rect, pcx = pr.x + pr.w / 2, pcy = pr.y + pr.h / 2, R = pr.w / 2 + 30;
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
    c.rect = { x: x - w / 2 - 6, y: bottom - h - 6, w: w + 12, h: h + 12 };
    return c;
  }

  // One mini skill icon: ring + glyph, level pips under it, a + badge when an
  // upgrade is affordable, a cooldown wedge, and a glow when ready to use.
  buildIcon(id, x, y, kind) {
    const s = this.scene, u = ui(id), perk = kind === 'perk';
    const r = perk ? 15 : 18;
    const c = s.add.container(x, y).setDepth(D.hud).setScrollFactor(0);
    const glow = s.add.circle(0, 0, r + 8, u.color, 0.0).setStrokeStyle(3, 0xffe28a, 0);
    const disc = perk ? s.add.rectangle(0, 0, r * 2, r * 2, 0x14110d, 0.95).setStrokeStyle(3, u.color, 1) : s.add.circle(0, 0, r, 0x14110d, 0.95).setStrokeStyle(3, u.color, 1);
    const fill = perk ? s.add.rectangle(0, 0, r * 2 - 6, r * 2 - 6, u.color, 0.22) : s.add.circle(0, 0, r - 3, u.color, 0.22);
    const glyph = T().text(s, 0, 0, u.glyph, { size: perk ? 14 : 16, ox: 0.5, oy: 0.5, color: '#ffffff' });
    const lock = s.add.graphics();                  // drawn when locked
    lock.fillStyle(0x0b0908, 1); lock.fillRoundedRect(-6, -2, 12, 9, 2); lock.lineStyle(2, 0xc9c0b0, 1); lock.strokeRoundedRect(-6, -2, 12, 9, 2);
    lock.beginPath(); lock.arc(0, -3, 4, Math.PI, 0, false); lock.strokePath();
    const cd = s.add.graphics();                    // cooldown wedge
    const pips = s.add.container(0, r + 7);
    for (let i = 0; i < 3; i++) pips.add(s.add.circle((i - 1) * 9, 0, 3, 0x3a3128).setStrokeStyle(1, 0x000000));
    const plus = s.add.container(r - 3, -r + 3);
    const pb = s.add.circle(0, 0, 9, 0x62c95a).setStrokeStyle(2, 0x1e4d1c);
    const pt = T().text(s, 0, 0, '+', { size: 14, ox: 0.5, oy: 0.55, color: '#ffffff', display: true });
    plus.add([pb, pt]);
    const plusZone = s.add.zone(r - 3, -r + 3, 22, 22).setInteractive({ useHandCursor: true });
    plusZone.on('pointerdown', () => this.openChip(id));
    const zone = s.add.zone(0, 0, r * 2 + 8, r * 2 + 8).setInteractive({ useHandCursor: true });
    // Perk: a tap tells what it does. Locked active: the unlock chip. Owned active: a request.
    zone.on('pointerdown', () => { if (perk) this.infoChip(id); else if (X.Encounter.owned(this.run, id)) this.onSkill(id); else this.openChip(id); });
    c.add([glow, disc, fill, glyph, lock, cd, pips, zone, plus, plusZone]);
    Object.assign(c, { glow, disc, fill, glyph, lock, cd, pips, plus, plusZone, zone, r, id, kind: kind || 'active' });
    lock.setVisible(false); plus.setVisible(false); plusZone.setVisible(false);
    c.rect = { x: x - r - 4, y: y - r - 4, w: r * 2 + 8, h: r * 2 + 8 };
    c.plusRect = { x: x + r - 3 - 11, y: y - r + 3 - 11, w: 22, h: 22 };
    return c;
  }

  buildArrow(x, y) {
    const s = this.scene;
    const root = s.add.container(x, y).setDepth(D.hud).setScrollFactor(0);
    const bg = s.add.circle(0, 0, 40, 0x14110d, 0.85).setStrokeStyle(3, 0x62c95a);
    const tri = s.add.triangle(4, 0, -14, -22, -14, 22, 22, 0, 0x62c95a);
    const zone = s.add.zone(0, 0, 90, 90).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.onArrow());
    root.add([bg, tri, zone]);
    const pulse = s.tweens.add({ targets: root, scale: 1.08, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
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

  setGold(n, animate) {
    if (!this.goldText) return;
    if (!animate) { this.goldText.setText(String(n)); return; }
    const from = parseInt(this.goldText.text, 10) || 0;
    const o = { v: from };
    this.scene.tweens.add({ targets: o, v: n, duration: 600, ease: 'Sine.Out', onUpdate: () => this.goldText.setText(String(Math.round(o.v))) });
    this.scene.tweens.add({ targets: this.goldPill, scale: 1.12, duration: 120, yoyo: true });
  }

  // Coins fly from a point to the pill, then the counter ticks up.
  payout(fromX, fromY, amount, done) {
    const s = this.scene;
    const n = Math.min(10, Math.max(4, Math.round(amount / 5)));
    for (let i = 0; i < n; i++) {
      const c = s.add.circle(fromX + (Math.random() - 0.5) * 60, fromY + (Math.random() - 0.5) * 40, 8, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f).setDepth(D.hud + 1);
      s.tweens.add({ targets: c, x: 146, y: 40, duration: 520 + i * 60, delay: i * 40, ease: 'Sine.In', onComplete: () => c.destroy() });
    }
    s.time.delayedCall(560 + n * 60, () => { this.setGold(this.run.gold, true); if (done) done(); });
  }

  refresh() {
    const run = this.run;
    if (!this.kit.hiro) {
      // A picked hero: everything shown is owned; pips are the tier the skill manifests at (gear lifts it).
      for (const c of Object.values(this.icons).concat(Object.values(this.perkIcons))) {
        const tier = tierIndex(this.hero, c.id);
        c.pips.list.forEach((p, i) => p.setFillStyle(i < tier ? ui(c.id).color : 0x3a3128));
      }
      return;
    }
    for (const id of Object.keys(this.icons)) {
      const c = this.icons[id], lvl = run.levels[id] || 0, owned = lvl > 0;
      c.pips.list.forEach((p, i) => p.setFillStyle(i < lvl ? SKILL_UI[id].color : 0x3a3128));
      c.lock.setVisible(!owned); c.glyph.setVisible(owned);
      c.disc.setStrokeStyle(3, owned ? SKILL_UI[id].color : 0x4a4036, 1);
      c.fill.setFillStyle(SKILL_UI[id].color, owned ? 0.22 : 0.05);
      const can = X.Encounter.canUpgrade(run, id);
      // Owned + affordable: a + badge. Locked + affordable: the whole icon invites (gold pulse).
      c.plus.setVisible(can && owned); c.plusZone.setVisible(can && owned);
      if (can && owned && !c.plusTween) c.plusTween = this.scene.tweens.add({ targets: c.plus, scale: 1.18, duration: 420, yoyo: true, repeat: -1 });
      if (!(can && owned) && c.plusTween) { c.plusTween.stop(); c.plusTween = null; c.plus.setScale(1); }
      if (can && !owned && !c.inviteTween) { c.disc.setStrokeStyle(3, 0xf2c94c, 1); c.inviteTween = this.scene.tweens.add({ targets: c, scale: 1.12, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); }
      if (!(can && !owned) && c.inviteTween) { c.inviteTween.stop(); c.inviteTween = null; c.setScale(1); }
    }
  }

  // Ready glow / cooldown wedge per icon. states: { skillId: {ready, reason, left} }
  setSkillStates(states) {
    for (const id of Object.keys(this.icons)) {
      const c = this.icons[id], st = states && states[id];
      const owned = X.Encounter.owned(this.run, id);
      const ready = owned && !!(st && st.ready);
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
      const maxCd = owned ? this.cooldownOf(id) : 0;
      const left = st && st.reason === 'cooldown' ? st.left : 0;
      if (left > 0 && maxCd > 0) {
        const frac = Math.min(1, left / maxCd);
        c.cd.fillStyle(0x000000, 0.6); c.cd.slice(0, 0, c.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false); c.cd.fillPath();
      }
    }
  }
  setFinisher(state) { this.setSkillStates({ finisher: state }); }
  cooldownOf(id) {
    if (this.kit.hiro) return ((X.skills[id] || {})[this.run.levels[id] || 1] || {}).cooldown || 0;
    const e = this.hero && A.SkillSys.knownEntry(this.hero, id); if (!e) return 0;
    const m = A.SkillSys.manifest(this.hero, e);
    return (m && m.data && m.data.cooldown) || 0;
  }

  // ---------------------------------------------------------------- info chip
  // What a skill is: its tier name, kind, and one line of what it does. Opens on a
  // perk tap or an active tapped while it cannot fire; closes on the next tap.
  infoChip(id, reason) {
    this.closeInfo();
    const s = this.scene, icon = this.icons[id] || this.perkIcons[id]; if (!icon) return;
    const sk = A.DATA.SKILLS[id] || { name: id, desc: '' };
    const name = this.hero && !this.kit.hiro ? tierName(this.hero, id) : sk.name;
    const tier = this.hero && !this.kit.hiro ? ['', 'Basic', 'Intermediate', 'Advanced'][tierIndex(this.hero, id)] : ('Lv ' + (this.run.levels[id] || 1));
    const w = 250, pad = 12;
    const c = s.add.container(0, 0).setDepth(D.hud + 2);
    const title = T().text(s, -w / 2 + pad, 0, ui(id).glyph + '  ' + name, { size: 15, color: '#f4eee0', display: true });
    const sub = T().text(s, -w / 2 + pad, 22, (sk.kind === 'perk' ? 'Perk' : 'Skill') + ' · ' + tier + (reason ? '  ·  ' + reason : ''), { size: 12, color: '#c9c0b0' });
    const body = T().text(s, -w / 2 + pad, 42, (sk.desc || '').split('. ')[0].replace(/\.?$/, '.'), { size: 12, color: '#e8dfc8', wrap: w - pad * 2 });
    const h = 42 + body.height + pad;
    const g = s.add.graphics(); g.fillStyle(0x1c1712, 0.97); g.fillRoundedRect(-w / 2, -pad, w, h + pad, 10); g.lineStyle(2, ui(id).color, 1); g.strokeRoundedRect(-w / 2, -pad, w, h + pad, 10);
    c.add([g, title, sub, body]);
    c.x = Math.min(W - w / 2 - 8, Math.max(w / 2 + 8, icon.x + 40)); c.y = icon.y - h - 30;
    c.setAlpha(0); s.tweens.add({ targets: c, alpha: 1, y: c.y - 6, duration: 140 });
    this.info = { root: c, id };
    s.time.delayedCall(60, () => { if (this.info && this.info.root === c) s.input.once('pointerdown', () => { if (this.info && this.info.root === c) this.closeInfo(); }); });
    s.time.delayedCall(4200, () => { if (this.info && this.info.root === c) this.closeInfo(); });
    return this.info;
  }
  closeInfo() { if (this.info) { this.info.root.destroy(); this.info = null; } }

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

  // ---------------------------------------------------------------- upgrade chip
  openChip(id) {
    if (this.chip) this.closeChip();
    const run = this.run;
    const cost = X.Encounter.upgradeCost(run, id);
    if (cost == null || run.gold < cost) { this.shakeIcon(id); return; }
    const s = this.scene, icon = this.icons[id];
    const w = 150, h = 74, x = Math.max(w / 2 + 8, icon.x + 30), y = icon.y - 74;
    const c = s.add.container(x, y).setDepth(D.hud + 2);
    const g = s.add.graphics(); g.fillStyle(0x1c1712, 0.97); g.fillRoundedRect(-w / 2, -h / 2, w, h, 10); g.lineStyle(2, 0xf2c94c, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.fillTriangle(-10, h / 2, 10, h / 2, 0, h / 2 + 10);
    const cur = run.levels[id] || 0;
    const lvl = T().text(s, -w / 2 + 12, -h / 2 + 10, SKILL_UI[id].glyph + '  ' + (cur === 0 ? '🔓' : 'Lv ' + cur + ' → ' + (cur + 1)), { size: 13, color: '#e8dfc8', display: true });
    const coin = s.add.circle(w / 2 - 22, -h / 2 + 18, 9, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f);
    const price = T().text(s, w / 2 - 34, -h / 2 + 18, String(cost), { size: 14, ox: 1, oy: 0.5, color: '#f4eee0', display: true });
    const bw = w - 24, bh = 30;
    const bg = s.add.graphics(); bg.fillStyle(0x62c95a, 1); bg.fillRoundedRect(-bw / 2, 4, bw, bh, 8);
    const check = T().text(s, 0, 4 + bh / 2, '✓', { size: 20, ox: 0.5, oy: 0.5, color: '#0f2d0f', display: true });
    const zone = s.add.zone(0, 4 + bh / 2, bw, bh).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { const r = this.onUpgrade(id); if (r && r.ok) this.closeChip(); });
    c.add([g, lvl, coin, price, bg, check, zone]);
    c.setScale(0.6); s.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.Out' });
    this.chip = { root: c, id, zone, confirmRect: { x: x - bw / 2, y: y + 4, w: bw, h: bh } };
    if (this.gateActive() && (this._gateFor === 'plus:' + id || this._gateFor === 'unlock:' + id)) this.releaseGate({ opened: id });
    return this.chip;
  }

  // Hold on an icon (locked: the icon itself; owned: its + badge) until its chip opens.
  gateUntilChip(icon) {
    const id = icon.id, owned = X.Encounter.owned(this.run, id);
    const p = this.gate(owned ? icon.plusRect : icon.rect, { skippable: true });
    this._gateFor = (owned ? 'plus:' : 'unlock:') + id;
    return p;
  }

  closeChip() { if (this.chip) { this.chip.root.destroy(); this.chip = null; } }

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
  // Quest-complete card: gold, the three skills at their final levels, Replay.
  completion(run, onReplay, opts) {
    opts = opts || {};
    const s = this.scene;
    const w = 420, h = 250, x = W / 2, y = H / 2 - 20;
    const c = s.add.container(x, y).setDepth(D.hud + 5).setScrollFactor(0);
    const shade = s.add.rectangle(0, 0, W, H, 0x000000, 0.35).setInteractive();
    const g = s.add.graphics(); g.fillStyle(0x14110d, 0.96); g.fillRoundedRect(-w / 2, -h / 2, w, h, 16); g.lineStyle(3, 0xf2c94c, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const title = T().text(s, 0, -h / 2 + 34, opts.title || 'Contract done', { size: 28, ox: 0.5, oy: 0.5, display: true, color: '#f4eee0' });
    const coin = s.add.circle(-30, -h / 2 + 84, 14, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f);
    const encs = opts.encounters || X.encounters;
    const earned = encs.reduce((n, e) => n + (run.awarded.includes(e.id) ? e.gold : 0), 0);
    const gold = T().text(s, -8, -h / 2 + 84, String(earned), { size: 22, ox: 0, oy: 0.5, display: true, color: '#f4eee0' });
    const row = s.add.container(0, -h / 2 + 140);
    this.kit.actives.forEach((id, i) => {
      const u = ui(id), lvl = this.kit.hiro ? (run.levels[id] || 0) : tierIndex(this.hero, id), cx = (i - 1) * 96;
      const disc = s.add.circle(cx, 0, 20, 0x14110d, 1).setStrokeStyle(3, lvl ? u.color : 0x4a4036, 1);
      const glyph = T().text(s, cx, 0, lvl ? u.glyph : '', { size: 18, ox: 0.5, oy: 0.5, color: '#ffffff' });
      row.add([disc, glyph]);
      for (let k = 0; k < 3; k++) row.add(s.add.circle(cx + (k - 1) * 11, 28, 4, k < lvl ? u.color : 0x3a3128).setStrokeStyle(1, 0x000000));
    });
    const bw = 200, bh = 46, by = h / 2 - 44;
    const bg = s.add.graphics(); bg.fillStyle(0x62c95a, 1); bg.fillRoundedRect(-bw / 2, by - bh / 2, bw, bh, 10);
    const glyph = T().text(s, 0, by, '↻', { size: 28, ox: 0.5, oy: 0.5, color: '#0f2d0f', display: true });
    const zone = s.add.zone(0, by, bw, bh).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (onReplay) onReplay(); });
    c.add([shade, g, title, coin, gold, row, bg, glyph, zone]);
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
