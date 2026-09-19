// Shared UI plumbing for town panels and modals. One implementation of the
// patterns that were previously copy-pasted per panel:
//  - keepBtn: register every part of a composite button for panel cleanup
//    (a button not registered leaves an invisible, still-clickable zone
//    behind when the panel switches — that's the rule to remember).
//  - header: standard panel title + subtitle.
//  - modalBtn / modalText: depth-raise + register modal widgets in one call.
//  - scrollArea: clipped, wheel+drag pane for any list that can overflow.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;

function walkDisplay(list, fn) {
  if (!list) return;
  for (const o of list) {
    fn(o);
    if (o.list) walkDisplay(o.list, fn);
  }
}

const UI = {
  keepBtn(scene, b) {
    scene.keep(b.g); scene.keep(b.txt);
    if (b.sub) scene.keep(b.sub);
    scene.keep(b.zone);
    return b;
  },

  header(scene, r, title, sub) {
    const titleT = scene.keep(T().text(scene, r.x + 24, r.y + 18, title, { size: 24, display: true, color: T().css.gold, wrap: r.w - 48 }));
    if (sub) {
      const subY = r.y + 18 + (titleT.height || T().gap(28)) + T().gap(6);
      scene.keep(T().text(scene, r.x + 24, subY, sub, { size: 13, color: T().css.inkDim, wrap: r.w - 48 }));
    }
  },

  // For Notices.custom-style modals: raise a button above the dim layer and
  // register all its parts with the modal's keep().
  modalBtn(keep, D, b) {
    b.g.setDepth(D); b.txt.setDepth(D + 1);
    if (b.sub) b.sub.setDepth(D + 1);
    b.zone.setDepth(D + 2);
    keep(b.g); keep(b.txt); if (b.sub) keep(b.sub); keep(b.zone);
    return b;
  },

  modalText(keep, D, t) {
    t.setDepth(D);
    return keep(t);
  },

  walk(scene, fn) { walkDisplay(scene.children.list, fn); },

  // Exclusive informational cards. Tooltip, tutor callout, notice modal, and
  // the dialogue box must not stack — the screenshot of Sunder over "Try
  // another" over Marek's line is the failure this blocks. Higher rank wins;
  // a lower card will not open while a higher one is up, and opening a
  // higher card dismisses whatever is underneath.
  //   tooltip 1 < tutor 2 < notice/dialogue 3
  holdCard(kind, dismiss) {
    const rank = { tooltip: 1, tutor: 2, notice: 3, dialogue: 3 };
    const need = rank[kind] || 0;
    const have = rank[UI._card] || 0;
    if (have > need) return false;
    if (UI._card && UI._card !== kind && UI._cardDismiss) {
      const prev = UI._cardDismiss;
      UI._card = null;
      UI._cardDismiss = null;
      try { prev(); } catch (e) {}
    }
    UI._card = kind;
    UI._cardDismiss = dismiss || null;
    return true;
  },
  releaseCard(kind) {
    if (UI._card === kind) { UI._card = null; UI._cardDismiss = null; }
  },
  cardIs(kind) { return UI._card === kind; },

  allText(scene) {
    const out = [];
    walkDisplay(scene.children.list, o => { if (o.text != null && o.text !== '') out.push(o); });
    return out;
  },

  worldRect(obj) {
    if (!obj) return null;
    if (obj.getBounds) {
      const b = obj.getBounds();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }
    let x = obj.x, y = obj.y;
    const p = obj.parentContainer;
    if (p) { x += p.x; y += p.y; }
    return { x, y, w: obj.width || 0, h: obj.height || 0 };
  },

  // Clipped scrolling pane. Children keep their layout (scene) coordinates;
  // the container's x/y is the negative scroll offset. A geometry mask clips
  // drawing to `rect`; hit tests reject pointers outside it so masked-out
  // buttons are not clickable. Wheel, drag, and a thin scrollbar.
  //
  // opts.keep       — register for cleanup (defaults to scene.keep)
  // opts.horizontal — scroll on x instead of y
  // opts.bar        — draw the scrollbar (default true)
  scrollArea(scene, rect, opts) {
    opts = opts || {};
    const horiz = !!opts.horizontal;
    const keep = opts.keep || (o => { if (scene.keep) scene.keep(o); return o; });
    const barW = 8;
    const view = horiz ? rect.w : rect.h;
    const start = horiz ? rect.x : rect.y;

    const container = scene.add.container(0, 0).setDepth(opts.depth || 0);
    keep(container);

    const maskG = scene.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(rect.x, rect.y, rect.w, rect.h);
    keep(maskG);
    container.setMask(maskG.createGeometryMask());

    const barG = scene.add.graphics().setDepth(opts.depth ? opts.depth + 1 : 6);
    keep(barG);
    const barZone = scene.add.zone(
      horiz ? rect.x : rect.x + rect.w - 14,
      horiz ? rect.y + rect.h - 14 : rect.y,
      horiz ? rect.w : 14,
      horiz ? 14 : rect.h
    ).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(opts.depth ? opts.depth + 2 : 7);
    keep(barZone);

    let offset = 0;
    let contentEnd = start;
    let dead = false;
    let drag = null;
    let barDrag = null;

    function contains(x, y) {
      return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    function modalUp() {
      let blocked = false;
      walkDisplay(scene.children.list, o => {
        if (o.depth >= Math.max(900, opts.depth || 0) && o.input && o.input.enabled && o.type === 'Rectangle') blocked = true;
      });
      return blocked;
    }

    function maxOffset() { return Math.max(0, contentEnd - (start + view) + 6); }

    function drawBar() {
      barG.clear();
      const max = maxOffset();
      if (max <= 0 || opts.bar === false) { barZone.disableInteractive(); return; }
      barZone.setInteractive({ useHandCursor: true });
      const trackX = horiz ? rect.x + 4 : rect.x + rect.w - barW - 4;
      const trackY = horiz ? rect.y + rect.h - barW - 4 : rect.y + 4;
      const trackLen = (horiz ? rect.w : rect.h) - 8;
      barG.fillStyle(0x000000, 0.45);
      if (horiz) barG.fillRoundedRect(trackX, trackY, trackLen, barW, 4);
      else barG.fillRoundedRect(trackX, trackY, barW, trackLen, 4);
      const thumbLen = Math.max(28, trackLen * (view / (view + max)));
      const thumbOff = (trackLen - thumbLen) * (offset / max);
      barG.fillStyle(T().c.gold, 0.95);
      if (horiz) barG.fillRoundedRect(trackX + thumbOff, trackY, thumbLen, barW, 3);
      else barG.fillRoundedRect(trackX, trackY + thumbOff, barW, thumbLen, 3);
    }

    function setOffset(v) {
      const max = maxOffset();
      offset = Math.max(0, Math.min(max, v));
      if (horiz) container.x = -offset;
      else container.y = -offset;
      drawBar();
      if (ADV.Tooltip) ADV.Tooltip.hide();
    }

    function extend(end) {
      if (end > contentEnd) contentEnd = end;
      drawBar();
    }

    function note(obj) {
      if (!obj) return;
      const w = obj.width || obj.displayWidth || 0;
      const h = obj.height || obj.displayHeight || 0;
      extend(horiz ? obj.x + w : obj.y + h);
    }

    function clipInteractive(go) {
      if (!go || !go.input) return;
      const ha = go.input.hitArea;
      const w = (ha && ha.width) || go.width || go.displayWidth || 0;
      const h = (ha && ha.height) || go.height || go.displayHeight || 0;
      if (w <= 0 || h <= 0) return;
      const cursor = go.input.cursor;
      go.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), (area, x, y, obj) => {
        if (x < 0 || y < 0 || x > area.width || y > area.height) return false;
        const mat = obj.getWorldTransformMatrix();
        const wx = mat.getX(x, y), wy = mat.getY(x, y);
        return contains(wx, wy);
      });
      if (cursor) go.input.cursor = cursor;
    }

    function add(obj) {
      if (!obj) return obj;
      container.add(obj);
      keep(obj);
      clipInteractive(obj);
      note(obj);
      return obj;
    }

    function addBtn(b) {
      add(b.g); add(b.txt);
      if (b.sub) add(b.sub);
      add(b.zone);
      return b;
    }

    function show(obj, margin) {
      margin = margin == null ? 8 : margin;
      const h = obj.height || obj.displayHeight || 40;
      const w = obj.width || obj.displayWidth || 40;
      if (horiz) {
        if (obj.x - offset < rect.x + margin) setOffset(obj.x - rect.x - margin);
        if (obj.x + w - offset > rect.x + rect.w - margin) setOffset(obj.x + w - (rect.x + rect.w) + margin);
      } else {
        if (obj.y - offset < rect.y + margin) setOffset(obj.y - rect.y - margin);
        if (obj.y + h - offset > rect.y + rect.h - margin) setOffset(obj.y + h - (rect.y + rect.h) + margin);
      }
    }

    function onWheel(pointer, _over, dx, dy) {
      if (dead || modalUp()) return;
      if (!contains(pointer.x, pointer.y)) return;
      const delta = horiz ? (dx || dy) : dy;
      setOffset(offset + delta * 0.45);
    }
    function onDown(p) {
      if (dead || modalUp()) return;
      if (!contains(p.x, p.y)) return;
      drag = { x: p.x, y: p.y, off: offset };
    }
    function onMove(p) {
      if (dead) return;
      if (barDrag) {
        const max = maxOffset();
        const trackLen = (horiz ? rect.w : rect.h) - 8;
        const span = horiz ? (p.x - barDrag.x) : (p.y - barDrag.y);
        setOffset(barDrag.off + (max * span) / Math.max(1, trackLen));
        return;
      }
      if (!drag) return;
      const d = horiz ? (p.x - drag.x) : (p.y - drag.y);
      if (Math.abs(d) > 2) setOffset(drag.off - d);
    }
    function onUp() { drag = null; barDrag = null; }

    barZone.on('pointerdown', (p) => {
      if (maxOffset() <= 0) return;
      barDrag = { x: p.x, y: p.y, off: offset };
      p.event && p.event.stopPropagation && p.event.stopPropagation();
    });

    scene.input.on('wheel', onWheel);
    scene.input.on('pointerdown', onDown);
    scene.input.on('pointermove', onMove);
    scene.input.on('pointerup', onUp);
    const onShutdown = () => destroy();
    scene.events.once('shutdown', onShutdown);

    function destroy() {
      if (dead) return;
      dead = true;
      scene.events.off('shutdown', onShutdown);
      scene.input.off('wheel', onWheel);
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      scene.input.off('pointerup', onUp);
      try { container.clearMask(true); } catch (e) {}
      try { maskG.destroy(); } catch (e) {}
      try { barG.destroy(); } catch (e) {}
      try { barZone.destroy(); } catch (e) {}
      try { container.destroy(); } catch (e) {}
    }
    container.once('destroy', () => { if (!dead) { dead = true; scene.events.off('shutdown', onShutdown); scene.input.off('wheel', onWheel); scene.input.off('pointerdown', onDown); scene.input.off('pointermove', onMove); scene.input.off('pointerup', onUp); try { maskG.destroy(); } catch (e) {} try { barG.destroy(); } catch (e) {} try { barZone.destroy(); } catch (e) {} } });

    const area = {
      rect, container, add, addBtn, extend, show, destroy, contains,
      setOffset, maxOffset,
      offset() { return offset; },
      contentEnd() { return contentEnd; },
    };
    scene.panelScrolls = scene.panelScrolls || [];
    scene.panelScrolls.push(area);
    return area;
  },
};

// ---- DOM text fields --------------------------------------------------------
// Canvas text cannot summon a phone's software keyboard, so every typed field
// in the game is a real <input> laid over the canvas. Fields are declared in
// GAME-SPACE coordinates (the 1280x760 design grid) and re-projected onto the
// page whenever the canvas is re-fit — index.html calls UI.repositionFields()
// from its resize burst. Font size never drops below 16 CSS px (iOS zooms
// into anything smaller), so a narrow phone gets a slightly larger field than
// the design grid says; that is the right trade.
//
//   const f = ADV.UI.textField(scene, { x, y, w, h, value, maxLen, pattern,
//                                        onChange(v), onCommit(v), color, size });
//   f.value() / f.set(v) / f.focus() / f.destroy()
//
// The field is destroyed with the scene (shutdown/destroy hooks) so a scene
// switch never leaves a stray input on the page.
const FIELDS = new Set();

function fieldHost() {
  const d = document;
  return (d && (d.fullscreenElement || d.webkitFullscreenElement))
    || (d && d.getElementById('game'))
    || (d && d.body);
}

function projectField(f) {
  const game = window.__game;
  if (!game || !game.canvas || !f || !f.el) return;
  const host = fieldHost();
  if (host && f.el.parentNode !== host) host.appendChild(f.el);
  const r = game.canvas.getBoundingClientRect();
  const hr = host && host.getBoundingClientRect ? host.getBoundingClientRect() : { left: 0, top: 0 };
  const sx = r.width / T().W, sy = r.height / T().H;
  const s = Math.min(sx, sy);
  // Minimum sizes win over the design grid on small phones; keep the field
  // centred on its design point either way.
  const w = Math.max(44, f.w * sx), h = Math.max(32, f.h * sy);
  const el = f.el;
  el.style.left = (r.left - hr.left + f.x * sx - w / 2) + 'px';
  el.style.top = (r.top - hr.top + f.y * sy - h / 2) + 'px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.fontSize = Math.max(16, f.size * s) + 'px';
  el.style.lineHeight = h + 'px';
  el.style.display = f.hidden ? 'none' : '';
}

UI.textField = function (scene, o) {
  const el = document.createElement('input');
  el.type = 'text';
  el.className = 'adv-field' + (o.color === 'purple' ? ' adv-purple' : '');
  el.autocomplete = 'off'; el.autocapitalize = o.autocapitalize || 'words';
  el.autocorrect = 'off'; el.spellcheck = false;
  el.setAttribute('enterkeyhint', 'done');
  el.maxLength = o.maxLen || 14;
  if (o.placeholder) el.placeholder = o.placeholder;
  el.value = o.value || '';
  const pattern = o.pattern || /^[a-zA-Z '\-]*$/;
  const f = { el, x: o.x, y: o.y, w: o.w, h: o.h, size: o.size || 18, hidden: false,
    value() { return el.value; },
    set(v) { el.value = v; },
    focus() { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } },
    blur() { el.blur(); },
    hide() { f.hidden = true; projectField(f); },
    show() { f.hidden = false; projectField(f); },
    destroy() { FIELDS.delete(f); if (el.parentNode) el.parentNode.removeChild(el); },
  };
  let last = el.value;
  el.addEventListener('input', () => {
    // Enforce the same alphabet the old keydown handlers allowed, without
    // fighting the keyboard: strip disallowed characters rather than refuse.
    let v = el.value.split('').filter(ch => pattern.test(ch)).join('').slice(0, el.maxLength);
    if (v !== el.value) el.value = v;
    if (v !== last) { last = v; if (o.onChange) o.onChange(v); }
  });
  el.addEventListener('keydown', (ev) => {
    ev.stopPropagation();               // Phaser's window listener must not see typing
    if (ev.key === 'Enter') { ev.preventDefault(); el.blur(); if (o.onCommit) o.onCommit(el.value); }
  });
  el.addEventListener('blur', () => { if (o.onBlur) o.onBlur(el.value); });
  // A phone tap must focus on the FIRST touch: the game shell sets
  // touch-action:none on the body, so the field opts back in.
  el.addEventListener('touchstart', () => { f.focus(); }, { passive: true });
  (fieldHost() || document.body).appendChild(el);
  FIELDS.add(f);
  projectField(f);
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => projectField(f));
  if (scene && scene.events) {
    scene.events.once('shutdown', () => f.destroy());
    scene.events.once('destroy', () => f.destroy());
  }
  return f;
};

UI.repositionFields = function () { FIELDS.forEach(projectField); };
UI.isTouch = function () {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
};
UI.hasFocusedField = function () {
  const a = document.activeElement;
  return !!(a && a.classList && a.classList.contains('adv-field'));
};

ADV.UI = UI;
})();
