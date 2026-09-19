// Shared slate, ivory and gold chrome for the illustrated world.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.Censorship?.installText(globalThis.Phaser);

const T = {
  W: 1280, H: 760,

  font: {
    display: 'Georgia, "Times New Roman", serif',
    body: '"Segoe UI", system-ui, Arial, sans-serif',
    mono: 'Consolas, "Courier New", monospace',
  },

  // Base palette — warm lettering over cool, inked panels.
  c: {
    bg: 0x142032, bgPanel: 0x1a293b, panelEdge: 0x475c72,
    parchment: 0x223347, parchmentHi: 0x2e445b,
    ink: 0xf0e8d9, inkDim: 0xc0c4c9, inkFaint: 0x9aaabc,
    gold: 0xe0bd77, goldDim: 0x9e865a,
    blood: 0xa8352c, bloodHi: 0xd8574a,
    green: 0x5d8a4a, greenHi: 0x83b56b,
    blue: 0x4a6f8a, blueHi: 0x6fa0bf,
    purple: 0x6a4a8a, purpleHi: 0x9a70c0,
    hp: 0xa8352c, tempHp: 0xd4a94e, xp: 0x5d8a4a,
  },
  css: {
    ink: '#f0e8d9', inkDim: '#c0c4c9', inkFaint: '#9aaabc',
    gold: '#e0bd77', blood: '#ee8275', green: '#a4c892', blue: '#9ac4df',
    purple: '#9a70c0', white: '#f4eee0',
  },
  // Faction palettes recolor panel chrome per quest region (§1a)
  factionTint: { law: 0x4a6f8a, criminal: 0x6a4a8a, neutral: 0x5d8a4a },
  // Town hub panels: translucent enough that the housing art and the time of
  // day read through the chrome, opaque enough to keep body text legible.
  chromeAlpha: 0.78,

  scale() { return (ADV.Prefs && ADV.Prefs.textScale()) || 1; },
  gap(n) { return Math.round((n == null ? 8 : n) * T.scale()); },

  text(scene, x, y, str, opts) {
    opts = opts || {};
    const scale = opts.noscale ? 1 : T.scale();
    const size = Math.round((opts.size || 15) * scale);
    return scene.add.text(x, y, str, {
      fontFamily: opts.display ? T.font.display : T.font.body,
      fontSize: size + 'px',
      color: opts.color || T.css.ink,
      fontStyle: opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'),
      align: opts.align || 'left',
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
      lineSpacing: Math.round(4 * (opts.noscale ? 1 : scale)),
    }).setOrigin(opts.ox != null ? opts.ox : 0, opts.oy != null ? opts.oy : 0);
  },

  panel(scene, x, y, w, h, opts) {
    opts = opts || {};
    const g = scene.add.graphics();
    g.fillStyle(opts.fill != null ? opts.fill : T.c.bgPanel, opts.alpha != null ? opts.alpha : 1);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(1.5, opts.edge != null ? opts.edge : T.c.panelEdge, 1);
    g.strokeRoundedRect(x, y, w, h, 6);
    return g;
  },

  // Button: rectangle + label + hover states. Returns container-ish object.
  button(scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    const g = scene.add.graphics();
    const draw = (hover) => {
      g.clear();
      const fill = opts.disabled ? 0x1b2431 : hover ? (opts.hoverFill || 0x344b61) : (opts.fill || 0x233448);
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(1.5, opts.disabled ? 0x384553 : (hover ? T.c.gold : (opts.edge || T.c.panelEdge)), 1);
      g.strokeRoundedRect(x, y, w, h, 5);
    };
    draw(false);
    const txt = T.text(scene, x + w / 2, y + h / 2, label, {
      size: opts.size || 15, ox: 0.5, oy: 0.5, display: opts.display,
      color: opts.disabled ? T.css.inkFaint : (opts.color || T.css.ink), bold: opts.bold,
    });
    let sub = null;
    if (opts.sub) {
      const lift = T.gap(8);
      txt.setY(y + h / 2 - lift);
      sub = T.text(scene, x + w / 2, y + h / 2 + Math.round(lift * 1.35), opts.sub, { size: 11, ox: 0.5, oy: 0.5, color: opts.subColor || T.css.inkDim });
    }
    // Touch devices (mobile pass): pad the invisible hit area by 4px a side —
    // the tightest stacked buttons sit 4-6px apart, so this never overlaps a
    // neighbour, and it turns near-misses on small controls into hits.
    const pad = (ADV.UI && ADV.UI.isTouch && ADV.UI.isTouch()) ? 4 : 0;
    const zone = scene.add.zone(x - pad, y - pad, w + 2 * pad, h + 2 * pad).setOrigin(0).setInteractive({ useHandCursor: !opts.disabled });
    if (!opts.disabled) {
      zone.on('pointerover', () => draw(true));
      zone.on('pointerout', () => { draw(false); zone.__press = null; });
      zone.on('pointerdown', (p) => { zone.__press = { x: p.x, y: p.y }; });
      zone.on('pointerup', (p) => {
        const press = zone.__press;
        zone.__press = null;
        if (!press || !onClick) return;
        if (Math.abs(p.x - press.x) + Math.abs(p.y - press.y) > 10) return;
        onClick();
      });
    }
    return { g, txt, sub, zone,
      destroy() { g.destroy(); txt.destroy(); if (sub) sub.destroy(); zone.destroy(); } };
  },

  bar(scene, x, y, w, h, pct, color, backColor) {
    const g = scene.add.graphics();
    g.fillStyle(backColor != null ? backColor : 0x141210, 1);
    g.fillRect(x, y, w, h);
    g.fillStyle(color, 1);
    g.fillRect(x, y, Math.max(0, Math.min(1, pct)) * w, h);
    g.lineStyle(1, 0x000000, 0.6);
    g.strokeRect(x, y, w, h);
    return g;
  },

  hexToCss(hex) { return '#' + hex.toString(16).padStart(6, '0'); },

  relColor(tier) {
    return tier === 'hatred' ? T.css.blood : tier === 'friendly' ? T.css.green :
           tier === 'romantic' ? T.css.purple : T.css.inkDim;
  },
};

ADV.T = T;
})();
