// Adventurer: Expeditions — actors on the foreground band.
// An Actor owns one sprite (a sheet, or a one-frame placeholder), its shadow,
// floating HP bar (no level tag since 2026-09-28), and status badges. It plays named clips and
// resolves a promise after the clip's recovery. With painted sheets the clip is a
// frame animation with tagged contact frames; until then, the same clip names
// are performed as motion on the placeholder (the website's portrait-motion
// vocabulary: lunge, recoil, hit-stop, arcs), so the director never changes.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const V = () => A.VFX;

const STATUS_STYLE = {
  bleed:   { color: 0xc0392b, glyph: '/' },
  poison:  { color: 0x5cb85c, glyph: '~' },
  aura:    { color: 0xa66bff, glyph: '◈' },
  counter: { color: 0xe8c86a, glyph: '⟲' },
};

class Actor {
  constructor(scene, opts) {
    this.scene = scene;
    this.uid = opts.uid;
    this.unit = opts.unit;          // combat unit (live)
    this.side = opts.side;           // 'a' hero, 'b' foe
    this.facing = opts.facing || (this.side === 'a' ? 1 : -1);
    this.home = { x: opts.x, y: opts.y };
    this.groundY = opts.y;
    this.name = opts.name || '';
    this.kind = opts.kind || (opts.side === 'a' ? 'hero' : 'wolf');
    this.level = opts.level || 1;
    this.alive = true;
    // A painted sheet from tools/art_intake.py: { key, clips, canvas, standing }.
    // Every frame shares an actor canvas and an authored ground pivot (GDD
    // §10.3 registration). Older sheets default to the bottom-centre pivot.
    this.sheet = opts.sheet || null;
    this.height = opts.height || 300;

    this.root = scene.add.container(opts.x, opts.y).setDepth(opts.depth != null ? opts.depth : 100);
    this.shadow = scene.add.ellipse(0, 6, this.height * 0.55, 26, 0x000000, 0.35);
    let s;
    if (this.sheet) {
      const idle = this.sheet.clips.idle || this.sheet.clips[Object.keys(this.sheet.clips)[0]];
      this.img = scene.add.sprite(0, 0, this.sheet.key, idle.frames[0]).setOrigin(0.5, 1);
      s = this.height / (this.sheet.standing || this.img.height);
    } else {
      this.img = scene.add.image(0, 0, opts.texture, opts.frame).setOrigin(0.5, 1);
      s = this.height / this.img.height;
    }
    this._baseScaleX = s * ((this.sheet && this.sheet.authoredFacing === -1) ? 1 : (opts.flipX ? -1 : 1));
    this._baseScaleY = s;
    this.img.setScale(this._baseScaleX, this._baseScaleY);
    this._playback = null;
    this._destroyed = false;
    if (opts.tint) { this.img.setTint(opts.tint); this.img.__baseTint = opts.tint; }
    this.root.add([this.shadow, this.img]);
    this.root.once('destroy', () => {
      this._destroyed = true; this.cancelPlayback();
      if (scene.events) scene.events.off('update', this.syncPause, this);
    });
    if (scene.events) scene.events.on('update', this.syncPause, this);
    if (this.sheet && this.sheet.canvas && this.sheet.canvas.pivot) {
      const canvas = this.sheet.canvas;
      this.img.setOrigin(canvas.pivot.x / canvas.w, canvas.pivot.y / canvas.h);
    }
    this.badges = new Map();
    this.buildPlates(scene);
    if (this.sheet) this.idle();
  }

  // Shrink a standing actor a little (a crowded boss wave, 2026-09-27): the
  // base scale, the ground shadow and the plate all follow, so later clips
  // and borrowed sheets keep the new size.
  rescale(k) {
    if (!(k > 0) || k === 1) return;
    this.height *= k;
    this._baseScaleX *= k; this._baseScaleY *= k;
    this.img.setScale(this._baseScaleX, this._baseScaleY);
    if (this.shadow) this.shadow.setSize(this.height * 0.55, 26);
    if (this.plate) this.plate.y = -this.height - 42;
  }

  // ---------------------------------------------------------------- plates
  buildPlates(scene) {
    const w = 132, top = -this.height - 42;
    const plate = scene.add.container(0, top);
    // No level tag (Hiro, 2026-09-28): the number meant nothing to the player.
    // The plate is the health bar alone, sitting where the tag's bar used to.
    this.barBg = scene.add.rectangle(0, 10, w, 9, 0x1a1512, 0.9).setStrokeStyle(1, 0x000000, 0.9);
    this.bar = scene.add.rectangle(-w / 2 + 1, 10, w - 2, 7, this.side === 'a' ? 0x62c95a : 0xd9433b).setOrigin(0, 0.5);
    this.barHurt = scene.add.rectangle(-w / 2 + 1, 10, w - 2, 7, 0xf4eee0, 0.8).setOrigin(0, 0.5);
    plate.add([this.barBg, this.barHurt, this.bar]);
    this.plate = plate;
    this.root.add(plate);
    this.refresh(true);
  }

  refresh(instant) {
    const u = this.unit;
    const pct = Math.max(0, Math.min(1, (u.chp + (u.tempHp || 0)) / u.maxHp));
    const w = 130;
    if (instant) { this.bar.width = w * pct; this.barHurt.width = w * pct; }
    else {
      this.scene.tweens.add({ targets: this.bar, width: w * pct, duration: 160 });
      this.scene.tweens.add({ targets: this.barHurt, width: w * pct, duration: 520, delay: 220, ease: 'Power2' });
    }
    // Badges follow the unit's live statuses.
    const kinds = new Set();
    for (const s of u.statuses || []) if (STATUS_STYLE[s.kind]) kinds.add(s.kind);
    if (u.counter > 0) kinds.add('counter');
    for (const k of kinds) if (!this.badges.has(k)) this.addBadge(k);
    this.setOutline(kinds.has('aura') ? 0xa66bff : kinds.has('counter') ? 0xe8c86a : null);
    for (const [k, b] of this.badges) if (!kinds.has(k)) { b.destroy(); this.badges.delete(k); }
    this.layoutBadges();
  }

  // A soft coloured outline behind the figure while a buff or stance is live.
  setOutline(color) {
    if (!color) { if (this.outline) { this.scene.tweens.killTweensOf(this.outline); this.outline.destroy(); this.outline = null; } return; }
    if (this.outline && this.outline.__color === color) return;
    if (this.outline) { this.scene.tweens.killTweensOf(this.outline); this.outline.destroy(); }
    const o = this.scene.add.ellipse(0, -this.height * 0.5, this.height * 0.62, this.height * 1.05, color, 0.16).setStrokeStyle(4, color, 0.7);
    o.__color = color;
    this.root.addAt(o, 1);
    this.scene.tweens.add({ targets: o, alpha: 0.55, scaleX: 1.04, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.outline = o;
  }

  addBadge(kind) {
    const st = STATUS_STYLE[kind];
    const c = this.scene.add.container(0, 0);
    const bg = this.scene.add.circle(0, 0, 11, st.color, 0.95).setStrokeStyle(2, 0x000000, 0.8);
    const g = T().text(this.scene, 0, 0, st.glyph, { size: 12, ox: 0.5, oy: 0.5, color: '#ffffff' });
    c.add([bg, g]);
    c.setScale(0); this.scene.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.Out' });
    this.badges.set(kind, c);
    this.root.add(c);
  }

  layoutBadges() {
    let i = 0;
    for (const b of this.badges.values()) { b.setPosition(-this.height * 0.28 + i * 26, -this.height - 64); i++; }
  }

  pulseBadge(kind) {
    const b = this.badges.get(kind);
    if (b) this.scene.tweens.add({ targets: b, scale: 1.45, duration: 90, yoyo: true });
  }

  setLevel(n) { this.level = n; }   // kept for the clip picker; nothing is drawn

  // ---------------------------------------------------------------- geometry
  get x() { return this.root.x; }
  get y() { return this.root.y; }
  chest() { return { x: this.root.x, y: this.root.y - this.height * 0.55 }; }
  contactPoint(other) { return { x: (this.root.x + other.root.x) / 2, y: this.root.y - this.height * 0.4 }; }

  // ---------------------------------------------------------------- clips
  // `opts.onContact` fires at contact, `opts.onRelease` at the release frame,
  // and the promise resolves after recovery so another clip cannot cut it off.
  play(clip, opts) {
    opts = opts || {};
    const sheetClip = this.sheet ? this.sheetClipFor(clip, opts) : null;
    if (sheetClip) {
      const playing = this.playSheet(sheetClip, clip, opts);
      return clip === 'down_fade' ? playing.then(() => this._destroyed ? undefined : this.fadeOut()) : playing;
    }
    const fn = Actor.PLACEHOLDER[clip];
    if (!fn) return Promise.resolve();
    return new Promise(resolve => fn.call(this, this.scene, opts, resolve));
  }

  // Exact actor vocabulary wins before Hiro's aliases. Bram and the beasts use
  // underscores in their own manifests, so accept either separator at intake.
  sheetClipFor(clip, opts) {
    if (!this.sheet) return null;
    opts = opts || {};
    let sheet = this.sheet;
    const targetIdentity = opts.target && opts.target.unit && opts.target.unit.ch && opts.target.unit.ch.expeditionArtIdentity;
    // Alpha's paired source sheets contain both Hiro and the boss. Play those
    // frames on Hiro for an exact contact pose, then restore Hiro's own atlas
    // and scale when the pair releases.
    // Borrowed by PAINTED SET, not by identity string (2026-09-22). This asked for
    // the exact identity 'tutorial-alpha', which only the rain's boss carries, so
    // Hiro never borrowed the sheet against the Alpha on the marsh, city and
    // ruins: the paired frames were not found and the boss died with a plain
    // `down`. Any target drawn from the Alpha sheet now gets the Alpha's pair.
    const drawnFrom = X.paintedActorOf ? X.paintedActorOf(opts.target) : null;
    if (clip === 'finisher' && (drawnFrom === 'alpha' || (X.monsterActors || []).includes(drawnFrom) || targetIdentity === 'tutorial-alpha') && X.Painted && X.Painted.sheet) {
      const alpha = X.Painted.sheet(this.scene, drawnFrom || 'alpha');
      if (alpha) { sheet = alpha; opts.sheet = alpha; }
    }
    if (clip === 'finisher' && (X.monsterActors || []).includes(drawnFrom)) {
      // Round robin per creature (Hiro, 2026-09-28): the next kill on this
      // painted set gets the move it did not get last time. An explicit
      // finisherVariant (tests, the dev panel) still wins.
      const order = opts.finisherVariant != null ? ['hiro-finisher-' + (opts.finisherVariant + 1)]
        : (X.finisherOrder ? X.finisherOrder(drawnFrom, ['hiro-finisher-1', 'hiro-finisher-2']) : ['hiro-finisher-1', 'hiro-finisher-2']);
      for (const id of order) if (sheet.clips[id] && this.canPair(sheet.clips[id], clip, opts)) { if (X.finisherLast) X.finisherLast[drawnFrom] = id; return id; }
    }
    const available = sheet.clips, level = Math.max(1, Math.min(3, opts.level || 1));
    const aliases = {
      enter: ['walk', 'run', 'approach', 'idle'], leap: ['approach', 'leap', 'attack'], short_draw: ['short-draw', 'draw'],
      slash: ['slash-l' + level, 'slash-l1', 'attack', 'attack-light', 'bite'],
      slash_wide: ['slash-l3', 'slash-l1', 'slash', 'attack'], lash: ['lash', 'attack'],
      hit_short: ['hit-short', 'hit-heavy', 'hit'], stagger: ['hit-short', 'hit-heavy', 'hit'],
      bite_grip: [opts.arm ? 'bite-arm-paired' : 'bite-leg-paired', opts.arm ? 'bite-arm' : 'bite-leg', 'bite-paired', 'hit-short', 'hit'],
      victory: ['victory-sheath', 'victory'], kneel: ['kneel', 'down'],
      aura: ['aura-l' + level, 'aura-l1', 'cast'],
      stance: ['intercept', 'cast', 'counter-l' + Math.max(2, level)],
      cast: ['cast', 'attack', 'aura-l1'], roll: ['roll', 'overshoot-land', 'land-tumble', 'hit-short'],
      finisher: ['finisher-l' + level + '-paired', 'finisher-' + (opts.target && ['wolf', 'boar'].includes(opts.target.kind) ? 'quadruped' : opts.target && opts.target.kind), 'slash-l' + level, 'slash-l1', 'slash', 'attack'],
      bite: ['bite', 'attack', 'hit'], charge: ['charge', 'run', 'leap', 'attack'], pounce: ['pounce', 'approach-leap', 'leap', 'attack'],
      land_tumble: ['land-tumble', 'down', 'hit', 'idle'], overshoot_land: ['overshoot-land', 'land-tumble', 'hit', 'down'],
      land_beside: ['land-beside', 'land-tumble', 'hit', 'idle'], lash_back: ['recover', 'idle'],
      down_fade: ['down-fade', 'down'], enrage: ['enrage', 'idle'], stalk: ['stalk', 'idle'],
    };
    // X.clipFor may answer with a list (the finisher families, in round-robin order).
    const candidates = [clip].concat(X.clipFor ? (X.clipFor(clip, opts) || []) : [], aliases[clip] || []);
    for (const candidate of candidates) {
      if (!candidate) continue;
      for (const id of [candidate, candidate.replace(/_/g, '-'), candidate.replace(/-/g, '_')]) {
        const c = available[id];
        if (c && (!c.paired || this.canPair(c, clip, opts))) {
          if (clip === 'finisher' && c.paired && X.finisherLast) X.finisherLast[drawnFrom || (opts.target && opts.target.kind) || 'any'] = id;
          return id;
        }
      }
    }
    // Missing painted variants stay painted; do not deform a whole body as a
    // portrait puppet. The release contract still lets the director progress.
    if (available.idle) return 'idle';
    return null;
  }

  canPair(c, clip, opts) {
    const target = opts.target;
    if (!target || !target.alive || target._destroyed) return false;
    // Sep20: every resolved kill may finish, not only the wave's last foe.
    if (/finisher/.test(clip) && !opts.lethal) return false;
    if (!Array.isArray(c.opponentKinds) || !c.opponentKinds.includes(target.kind)) return false;
    // The pair is eligible when the target is the creature in the painting —
    // the same painted SET, not the same entity id (Hiro, 2026-09-22: "why is
    // finisher and animations hard tied to a specific entity, instead of a
    // class type ... that way it doesn't matter how many of them you have").
    // Both of the target's names are resolved to the set they are drawn from,
    // and the clip's opponentKeys to theirs; if any of the target's resolve
    // into that set, it is the creature in the frames. So every wolf variant
    // pairs because it comes out of the wolf sheet, while a differently
    // painted wolf still does not.
    const XD = ADV.Expedition, ch = target.unit && target.unit.ch;
    // Without data.js loaded (the animation harness) a name resolves to itself,
    // which is the old exact-key behaviour and keeps those contracts honest.
    const toSet = k => (XD && XD.paintedActorOfKey ? XD.paintedActorOfKey(k) : k);
    if (c.opponentKeys && c.opponentKeys.length) {
      const want = new Set(c.opponentKeys.map(toSet).filter(Boolean));
      const names = ch ? [ch.expeditionArtIdentity, ch.expeditionKey].filter(Boolean) : [];
      const mine = names.map(toSet).filter(Boolean);
      const drawn = XD && XD.paintedActorOf && XD.paintedActorOf(target);
      if (drawn) mine.push(drawn);
      if (want.size && mine.length && !mine.some(k => want.has(k))) return false;
    }
    // A recolour still disqualifies a lookalike: the gray wolf painted into
    // the pair cannot double as the green blight wolf.
    if (target.img.__baseTint != null) return false;
    return true;
  }

  syncPause() {
    if (this._destroyed || !this.img.anims) return;
    const clock = this.scene.time;
    const paused = !!(this.scene.paused || (clock && clock.paused) || this.scene.__paintedHitStopCount > 0 || (clock && clock.now < (this.scene.__paintedHitStopUntil || 0)));
    if (paused) {
      if (!this.img.anims.isPaused) { this.img.anims.pause(); this._pausedByScene = true; }
    } else if (this._pausedByScene) { this.img.anims.resume(); this._pausedByScene = false; }
  }

  resetImageTransform() {
    this.scene.tweens.killTweensOf(this.img);
    this.img.setScale(this._baseScaleX, this._baseScaleY);
    if (this.sheet && this.sheet.canvas && this.sheet.canvas.pivot) {
      const canvas = this.sheet.canvas;
      this.img.setOrigin(canvas.pivot.x / canvas.w, canvas.pivot.y / canvas.h);
    }
    this.img.setPosition(0, 0).setAngle(0);
  }

  cancelPlayback() {
    if (this._playback) this._playback.cancel();
  }

  // Victory is a persistent rest state until the next action. An arriving
  // idle-sheathed atlas can loop it; older deliveries hold the closing frame.
  idle() {
    if (!this.sheet || !this.alive || this._destroyed) return;
    const sheathed = this.sheet.clips['idle-sheathed'] || this.sheet.clips.idle_sheathed;
    if (this._sheathed && !sheathed) return;
    const id = this._sheathed ? (this.sheet.clips['idle-sheathed'] ? 'idle-sheathed' : 'idle_sheathed') : 'idle';
    if (!this.sheet.clips[id]) return;
    this.resetImageTransform();
    this.img.play(this.animKey(id), true);
    this.syncPause();
  }

  animKey(id, sheet) {
    sheet = sheet || this.sheet;
    const key = sheet.key + ':' + id, scene = this.scene, c = sheet.clips[id];
    if (!scene.anims.exists(key)) {
      const explicit = c.frameDurationsMs || (Array.isArray(c.frameMs) ? c.frameMs : null);
      const total = c.durationMs || c.durationMsDraft || c.frames.length * (Number(c.frameMs) || 100);
      const durations = c.frames.map((f, i) => explicit ? explicit[i] : total / c.frames.length);
      // Bundled Phaser treats AnimationFrame.duration as the whole frame hold,
      // not an addition. Set duration too so progress/complete metadata agrees.
      scene.anims.create({ key, frames: c.frames.map((f, i) => ({ key: sheet.key, frame: f, duration: Math.max(1, Number(durations[i]) || total / c.frames.length) })),
        duration: durations.reduce((sum, n) => sum + (Math.max(1, Number(n)) || total / c.frames.length), 0), repeat: c.loop ? -1 : 0 });
    }
    return key;
  }

  // One playback owns all callbacks and root drift. Release is a contact-side
  // notification; awaiting play waits for the recovery frames to finish. This
  // prevents the next combat action from being reset by the previous clip.
  playSheet(id, clip, opts) {
    this.cancelPlayback();
    if (this._destroyed) return Promise.resolve();
    this.resetImageTransform();
    this.img.anims.stop();
    const sheet = opts.sheet || this.sheet;
    const c = sheet.clips[id], scene = this.scene, key = this.animKey(id, sheet);
    const applySheetTransform = () => {
      if (sheet !== this.sheet && sheet.canvas && sheet.canvas.pivot) {
        const canvas = sheet.canvas;
        // A paired clip can have its own measured hero body reference.
        // Uniform scale preserves the painted contact between both figures.
        const s = this.height / (sheet.standing || this.img.height) * (c.bodyScale || 1);
        this.img.setOrigin(canvas.pivot.x / canvas.w, canvas.pivot.y / canvas.h);
        this.img.setScale(s * (this.facing < 0 ? -1 : 1), s);
      }
    };
    const imp = (X.impact && X.impact[id]) || c.impact || {};
    const drift = !c.paired && imp.drift ? Number(imp.drift.distancePx) || 0 : 0;
    if (!['walk', 'enter', 'idle', 'victory'].includes(clip)) this._sheathed = false;
    return new Promise(resolve => {
      let ended = false, released = false, hits = 0;
      const target = c.paired ? opts.target : null, targetVisible = target && target.root.visible;
      const originX = this.root.x;
      const pairedFinish = !!(target && /finisher/.test(clip) && opts.lethal);
      // Pair canvases are registered on the hero. Close to the embedded foe's
      // authored offset before replacing the separate actor, rather than making
      // a distant foe teleport into the contact pose. Metadata can tune each pair.
      const pairDistance = c.pairTargetDistance != null ? c.pairTargetDistance : this.height * (c.pairTargetDistanceRatio || 0.65);
      const pairX = pairedFinish ? target.root.x - pairDistance * this.facing : originX;
      const pairApproach = pairedFinish && Math.abs(pairX - originX) > 24;
      const approaching = !c.paired && opts.target && /^(slash|slash_wide|riposte|finisher|leap|pounce|charge)$/.test(clip);
      const attacking = /^(slash|slash_wide|riposte|finisher)$/.test(clip);
      const returning = /^(land_tumble|land_beside|overshoot_land|lash_back)$/.test(clip);
      const reach = c.contactDistance || this.height * (attacking ? 0.55 : 0.34) + (opts.target ? opts.target.height * 0.2 : 0);
      const contactX = approaching ? opts.target.root.x - reach * this.facing : originX;
      const contacts = [...new Set(c.contact || c.contactFramesZeroBased || [])].filter(n => Number.isInteger(n) && n >= 0 && n < c.frames.length).sort((a, b) => a - b);
      const release = Math.max(0, Math.min(c.frames.length - 1, c.release != null ? c.release : c.releaseFrameZeroBased != null ? c.releaseFrameZeroBased : c.frames.length - 1));
      const motion = new Set();
      const detach = () => {
        this.img.off('animationstart', onStart); this.img.off('animationupdate', onUpdate); this.img.off('animationcomplete', onDone);
      };
      const clean = () => {
        detach();
        for (const t of motion) t.stop();
        motion.clear();
        if (target && !target._destroyed && target.alive) target.root.setVisible(targetVisible);
      };
      const finish = (cancelled) => {
        if (ended) return;
        if (!cancelled && pairedFinish && !target._destroyed) {
          // The embedded ending already disposed of the foe. Retire its visual
          // actor so playDowns cannot briefly revive it for a second death clip.
          target.alive = false;
          target.cancelPlayback();
          if (target.img.anims) target.img.anims.stop();
          target.root.setVisible(false);
        }
        ended = true; clean();
        if (this._playback === playback) this._playback = null;
        if (cancelled && (drift || approaching || returning || pairApproach)) this.root.x = originX;
        resolve();
      };
      const playback = this._playback = { cancel: () => finish(true) };
      const live = () => !ended && !this._destroyed && this._playback === playback;
      const move = (x, duration, ease, then) => {
        const t = scene.tweens.add({ targets: this.root, x, duration, ease, onComplete: () => { motion.delete(t); if (live() && then) then(); } });
        motion.add(t);
      };
      const at = i => {
        if (!live()) return;
        while (contacts.length && i >= contacts[0]) {
          contacts.shift();
          if (hits++ === 0) {
            if (opts.onContact) opts.onContact();
            if (drift && live()) move(contactX + drift * this.facing, 70, imp.drift.ease || 'Quad.Out');
          } else if (opts.onHit) opts.onHit(hits - 1);
          if (!live()) return;
        }
        if (!released && i >= release) { released = true; if (opts.onRelease) opts.onRelease(); }
      };
      const onStart = (anim, frame) => { if (anim.key === key) at(frame.index - 1); };
      const onUpdate = (anim, frame) => { if (anim.key === key) at(frame.index - 1); };
      const settle = () => {
        if (!live()) return;
        if (clip === 'victory' || /victory/.test(id)) {
          this._sheathed = true;
          this.img.setFrame(c.frames[c.frames.length - 1]);
          this.idle();
        } else if (clip === 'kneel' || /^down/.test(clip)) this.img.setFrame(c.frames[c.frames.length - 1]);
        else this.idle();
        finish(false);
      };
      const onDone = (anim) => {
        if (anim.key !== key || !live()) return;
        at(c.frames.length - 1); detach();
        if (pairApproach) {
          this.resetImageTransform();
          if (this.sheet.clips.walk) this.img.play(this.animKey('walk'), true);
          move(originX, Math.min(260, Math.abs(pairX - originX)), 'Sine.InOut', settle);
        } else if (drift || (approaching && attacking)) move(originX, 100, 'Sine.Out', settle); else settle();
      };
      const startClip = () => {
        if (!live()) return;
        applySheetTransform();
        if (target) target.root.setVisible(false);
        this.img.on('animationstart', onStart); this.img.on('animationupdate', onUpdate); this.img.on('animationcomplete', onDone);
        this.img.play(key, false);
        this.syncPause();
      };
      if (pairApproach) {
        this.resetImageTransform();
        if (this.sheet.clips.walk) this.img.play(this.animKey('walk'), true);
        move(pairX, Math.min(280, Math.max(120, Math.abs(pairX - originX))), 'Sine.InOut', startClip);
        this.syncPause();
      } else startClip();
      if (!c.loop && approaching) {
        const first = contacts.length ? contacts[0] : Math.floor(c.frames.length / 2);
        const leadMs = (c.durationMs || 600) * first / c.frames.length;
        move(contactX, Math.max(1, Math.min(170, leadMs || 1)), 'Sine.Out');
      } else if (!c.loop && returning) move(this.home.x, Math.max(100, (c.durationMs || 500) - 80), 'Sine.Out');
      if (c.loop) {
        // Idle used as a safe painted fallback is a hold, never an accidental
        // 200px walk. Locomotion alone moves the root and owns that tween.
        if (clip === 'enter' || clip === 'walk') {
          if (opts.from != null) this.root.x = opts.from;
          const to = opts.x != null ? opts.x : clip === 'enter' ? this.home.x : this.root.x + 200;
          move(to, opts.duration || 700, 'Sine.InOut', () => { if (opts.thenIdle !== false) this.idle(); finish(false); });
        } else if (opts.onContact && /^(slash|slash_wide|riposte|finisher|bite|lash|charge|pounce|leap|cast)$/.test(clip)) {
          // An attack with no painted clip of its own (Hiro, 2026-09-28: a
          // mob must never die to an invisible animation). Hold the pose,
          // land the hit after a readable beat, then recover, instead of
          // firing contact the instant the fallback idle starts.
          const after = (ms, fn) => { if (scene.time && scene.time.delayedCall) scene.time.delayedCall(ms, () => { if (live()) fn(); }); else fn(); };
          after(220, () => { opts.onContact(); if (!released && opts.onRelease) { released = true; opts.onRelease(); } after(200, () => finish(false)); });
        } else {
          if (opts.onContact) opts.onContact();
          if (!released && opts.onRelease) opts.onRelease();
          finish(false);
        }
      }
    });
  }

  tween(props, duration, ease) {
    return new Promise(res => this.scene.tweens.add(Object.assign({ targets: this.root, duration, ease: ease || 'Power2', onComplete: res }, props)));
  }
  tweenImg(props, duration, ease) {
    return new Promise(res => this.scene.tweens.add(Object.assign({ targets: this.img, duration, ease: ease || 'Power2', onComplete: res }, props)));
  }

  flash(color) { V().tintFlash(this.scene, this.img, color); }

  async fadeOut() {
    if (X.DefeatFX) X.DefeatFX.play(this);
    this.alive = false;
    this.plate.setVisible(false);
    for (const b of this.badges.values()) b.setVisible(false);
    const loc = X.DefeatFX && X.DefeatFX.location(this.scene.run);
    this.img.setTintFill(loc === 'swamp' ? 0x715337 : loc === 'city' ? 0x63cfff : 0xfff4d6);
    await Promise.all([
      this.tweenImg({ alpha: 0, y: this.img.y - 30 }, 420, 'Power1'),
      new Promise(res => this.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 420, onComplete: res })),
    ]);
    this.root.setVisible(false);
  }

  destroy() { this._destroyed = true; this.cancelPlayback(); this.scene.tweens.killTweensOf(this.img); this.scene.tweens.killTweensOf(this.root); if (this.img.anims) this.img.anims.stop(); this.root.destroy(); }
}

// ---------------------------------------------------------------- placeholder motion
// Each entry: function(scene, opts, done). Uses only the placeholder image;
// replaced by sheet clips of the same name when painted frames land.
// Finisher round robin (Hiro, 2026-09-28): the last paired finisher played
// against each painted set, and a family's clip list rotated so the move
// after the last one comes first. Nothing repeats back to back on a creature.
X.finisherLast = X.finisherLast || {};
X.finisherOrder = function (family, list) {
  const last = X.finisherLast[family], i = list.indexOf(last);
  return i < 0 ? list.slice() : list.slice(i + 1).concat(list.slice(0, i + 1));
};

const P = Actor.PLACEHOLDER = {};
const ms = (scene, t) => new Promise(r => scene.time.delayedCall(t, r));

P.idle = function (scene, o, done) { done(); };

P.enter = async function (scene, o, done) {
  // Walk/run in from off-screen to the home mark.
  const from = o.from != null ? o.from : this.root.x;
  this.root.x = from;
  const bob = scene.tweens.add({ targets: this.img, y: -8, duration: 140, yoyo: true, repeat: -1 });
  await this.tween({ x: this.home.x }, o.duration || 700, 'Sine.Out');
  bob.stop(); this.img.y = 0;
  done();
};

P.walk = async function (scene, o, done) {
  const bob = scene.tweens.add({ targets: this.img, y: -7, duration: 170, yoyo: true, repeat: -1 });
  await this.tween({ x: o.x != null ? o.x : this.root.x + 200 }, o.duration || 1500, 'Sine.InOut');
  bob.stop(); this.img.y = 0;
  done();
};

P.draw = async function (scene, o, done) {
  // Plant, settle, draw: a lean back then a snap forward with a blade-glint arc.
  await this.tweenImg({ angle: -4 * this.facing, scaleX: this.img.scaleX * 0.98 }, 260, 'Sine.Out');
  await ms(scene, 160);
  V().slashArc(scene, this.root.x + 70 * this.facing, this.root.y - this.height * 0.5, 0xd9c2ff);
  await this.tweenImg({ angle: 0, scaleX: this.img.scaleX / 0.98 }, 140, 'Back.Out');
  done();
};

P.short_draw = async function (scene, o, done) {
  V().slashArc(scene, this.root.x + 60 * this.facing, this.root.y - this.height * 0.5, 0xd9c2ff);
  await this.tweenImg({ angle: 3 * this.facing }, 90, 'Sine.Out'); await this.tweenImg({ angle: 0 }, 120);
  done();
};

P.slash = async function (scene, o, done) {
  const tgt = o.target;
  const reach = tgt ? tgt.root.x - 150 * this.facing : this.root.x + 120 * this.facing;
  await this.tween({ x: reach }, 170, 'Power3');
  if (o.onContact) o.onContact();
  await ms(scene, o.hold || 140);
  await this.tween({ x: this.home.x }, 220, 'Power2');
  done();
};

P.slash_wide = async function (scene, o, done) {
  // Level 3: a crossing dash through the line with an afterimage.
  const ghost = scene.add.image(this.root.x, this.root.y, this.img.texture.key, this.img.frame.name).setOrigin(0.5, 1).setScale(this.img.scaleX, this.img.scaleY).setAlpha(0.45).setTint(0x9b6bff).setDepth(this.root.depth - 1);
  scene.tweens.add({ targets: ghost, alpha: 0, duration: 380, onComplete: () => ghost.destroy() });
  await this.tween({ x: this.root.x + 260 * this.facing }, 150, 'Power3');
  if (o.onContact) o.onContact();
  await ms(scene, 160);
  await this.tween({ x: this.home.x }, 260, 'Power2');
  done();
};

P.aura = async function (scene, o, done) {
  V().aura(scene, this.root.x, this.root.y - this.height * 0.5, 0xa66bff);
  V().aura(scene, this.root.x, this.root.y - this.height * 0.5, 0xd9c2ff);
  this.img.setTint(0xcdb0ff); scene.time.delayedCall(360, () => { if (this.img.__baseTint != null) this.img.setTint(this.img.__baseTint); else this.img.clearTint(); });
  await this.tweenImg({ scaleY: this.img.scaleY * 1.04 }, 160, 'Sine.Out');
  await this.tweenImg({ scaleY: this.img.scaleY / 1.04 }, 200);
  done();
};

P.stance = async function (scene, o, done) {
  // Counter stance: a half-step back, blade angled, gold outline pulse.
  await this.tween({ x: this.home.x - 24 * this.facing }, 140, 'Sine.Out');
  V().aura(scene, this.root.x, this.root.y - this.height * 0.5, 0xe8c86a);
  await ms(scene, 220);
  await this.tween({ x: this.home.x }, 200);
  done();
};

P.hit_short = async function (scene, o, done) {
  this.flash(0xffffff);
  await this.tweenImg({ x: -16 * this.facing, angle: -5 * this.facing }, 60, 'Power1');
  await this.tweenImg({ x: 0, angle: 0 }, 200, 'Sine.Out');
  done();
};

P.bite_grip = async function (scene, o, done) {
  // The wolf has clamped on: brace, shudder, shake it off.
  this.flash(0xff9a8a);
  await this.tweenImg({ angle: -7 * this.facing, x: -10 * this.facing }, 90, 'Power1');
  await new Promise(r => scene.tweens.add({ targets: this.img, x: -10 * this.facing + 5, duration: 45, yoyo: true, repeat: 3, onComplete: r }));
  await this.tweenImg({ angle: 4 * this.facing, x: 8 * this.facing }, 110, 'Power3');   // the shake-off
  if (o.onRelease) o.onRelease();
  await this.tweenImg({ angle: 0, x: 0 }, 220, 'Sine.Out');
  done();
};

P.roll = async function (scene, o, done) {
  // Drop into a compact roll away from the leap, rise facing it.
  const back = this.home.x - 110 * this.facing;
  const p1 = this.tween({ x: back }, 260, 'Power2');
  const p2 = this.tweenImg({ angle: 360 * this.facing * -1, scaleY: this.img.scaleY * 0.7 }, 260, 'Sine.InOut');
  await Promise.all([p1, p2]);
  this.img.angle = 0;
  await this.tweenImg({ scaleY: this.img.scaleY / 0.7 }, 120, 'Back.Out');
  await this.tween({ x: this.home.x }, 260, 'Sine.InOut');
  done();
};

P.intercept = async function (scene, o, done) {
  // Plant, angle the blade, spark at the redirected lunge.
  await this.tweenImg({ angle: -6 * this.facing }, 80, 'Power2');
  if (o.onContact) o.onContact();
  await ms(scene, 120);
  await this.tweenImg({ angle: 0 }, 160, 'Sine.Out');
  done();
};

P.riposte = async function (scene, o, done) {
  const tgt = o.target;
  const reach = tgt ? tgt.root.x - 130 * this.facing : this.root.x + 100 * this.facing;
  await this.tween({ x: reach }, 120, 'Power3');
  if (o.onContact) o.onContact();
  await ms(scene, 110);
  await this.tween({ x: this.home.x }, 200, 'Power2');
  done();
};

P.finisher = async function (scene, o, done) {
  const tgt = o.target;
  // Low stance, then a dash through the target; the blade trail draws itself.
  await this.tweenImg({ scaleY: this.img.scaleY * 0.9, x: -12 * this.facing }, 160, 'Sine.Out');
  await ms(scene, 90);
  const through = tgt ? tgt.root.x + 90 * this.facing : this.root.x + 300 * this.facing;
  const trail = scene.add.rectangle(this.root.x, this.root.y - this.height * 0.45, 4, 6, 0xead8ff, 0.9).setOrigin(0, 0.5).setDepth(this.root.depth + 1);
  scene.tweens.add({ targets: trail, width: Math.abs(through - this.root.x), duration: 120, onComplete: () => scene.tweens.add({ targets: trail, alpha: 0, duration: 260, onComplete: () => trail.destroy() }) });
  if (this.facing < 0) trail.setOrigin(1, 0.5);
  await this.tween({ x: through }, 130, 'Power4');
  if (o.onContact) o.onContact();
  await ms(scene, 220);
  await this.tweenImg({ scaleY: this.img.scaleY / 0.9, x: 0 }, 140);
  await this.tween({ x: this.home.x }, 320, 'Sine.InOut');
  done();
};

P.victory = async function (scene, o, done) {
  // Hold, check the road, turn the blade, sheath with a click.
  await ms(scene, 260);
  await this.tweenImg({ angle: 3 * this.facing }, 220, 'Sine.InOut');
  await this.tweenImg({ angle: -2 * this.facing }, 220, 'Sine.InOut');
  V().slashArc(scene, this.root.x - 40 * this.facing, this.root.y - this.height * 0.55, 0xd9c2ff);
  await this.tweenImg({ angle: 0, scaleY: this.img.scaleY * 1.02 }, 160, 'Back.Out');
  await this.tweenImg({ scaleY: this.img.scaleY / 1.02 }, 200);
  done();
};

P.cast = async function (scene, o, done) {
  V().aura(scene, this.root.x, this.root.y - this.height * 0.5, 0x9edaa5);
  await this.tweenImg({ y: -10, scaleY: this.img.scaleY * 1.03 }, 200, 'Sine.Out');
  await this.tweenImg({ y: 0, scaleY: this.img.scaleY / 1.03 }, 220, 'Sine.In');
  done();
};

P.kneel = async function (scene, o, done) {
  await this.tweenImg({ scaleY: this.img.scaleY * 0.72, angle: 6 * this.facing }, 420, 'Power2');
  done();
};

// ---- wolf
P.stalk = async function (scene, o, done) {
  await this.tween({ x: this.home.x - 18 * this.facing }, 240, 'Sine.InOut');
  await this.tween({ x: this.home.x }, 240, 'Sine.InOut');
  done();
};

P.leap = async function (scene, o, done) {
  // Crouch tell, then an arc onto the target's mark. Resolves at landing.
  const tgt = o.target;
  const land = tgt ? tgt.root.x - 120 * this.facing : this.root.x + 200 * this.facing;
  await this.tweenImg({ scaleY: this.img.scaleY * 0.86, x: -14 * this.facing }, 170, 'Sine.Out');
  const up = this.tweenImg({ y: -110, scaleY: this.img.scaleY / 0.86, x: 0 }, 190, 'Power2');
  const fwd = this.tween({ x: land }, 360, 'Sine.InOut');
  await up;
  await this.tweenImg({ y: 0 }, 170, 'Power2');
  await fwd;
  if (o.onContact) o.onContact();
  done();
};

P.bite = async function (scene, o, done) {
  // Clamped on: hold with a shudder, then release on the shake-off.
  await new Promise(r => scene.tweens.add({ targets: this.img, x: 6 * this.facing, duration: 45, yoyo: true, repeat: 4, onComplete: r }));
  done();
};

P.land_tumble = async function (scene, o, done) {
  // Shaken off: thrown back, a half roll, feet under it again.
  const p1 = this.tween({ x: this.home.x }, 380, 'Power2');
  const p2 = (async () => { await this.tweenImg({ angle: 30 * this.facing, y: -40 }, 170, 'Power1'); await this.tweenImg({ angle: 0, y: 0 }, 210, 'Bounce.Out'); })();
  await Promise.all([p1, p2]);
  done();
};

P.overshoot_land = async function (scene, o, done) {
  // The target rolled: cross its former mark, skid, turn back.
  const tgt = o.target;
  const past = tgt ? tgt.home.x - 80 * this.facing : this.root.x + 120 * this.facing;
  await this.tween({ x: past }, 200, 'Power1');
  await this.tweenImg({ angle: 8 * this.facing }, 100); await this.tweenImg({ angle: 0 }, 120);
  await this.tween({ x: this.home.x }, 360, 'Sine.InOut');
  done();
};

P.land_beside = async function (scene, o, done) {
  // Redirected by the blade: drop short and scramble back.
  await this.tweenImg({ y: -20, angle: -12 * this.facing }, 90, 'Power1');
  await this.tweenImg({ y: 0, angle: 0 }, 160, 'Bounce.Out');
  await this.tween({ x: this.home.x }, 300, 'Sine.Out');
  done();
};

P.down_fade = async function (scene, o, done) { await this.fadeOut(); done(); };

// ---- boar
P.charge = async function (scene, o, done) {
  // Paw the ground, then a flat, fast charge into the target's mark.
  const tgt = o.target;
  const land = tgt ? tgt.root.x - 130 * this.facing : this.root.x + 220 * this.facing;
  await this.tweenImg({ x: -10 * this.facing, scaleX: this.img.scaleX * 0.94 }, 160, 'Sine.Out');
  await this.tweenImg({ x: 0, scaleX: this.img.scaleX / 0.94 }, 90);
  const bob = scene.tweens.add({ targets: this.img, y: -6, duration: 60, yoyo: true, repeat: -1 });
  await this.tween({ x: land }, 260, 'Power3');
  bob.stop(); this.img.y = 0;
  V().burst(scene, this.root.x + 40 * this.facing, this.root.y, 0xcbb894, 8);
  if (o.onContact) o.onContact();
  done();
};

// ---- plant: rooted, so the lash is a whip from where it stands
P.lash = async function (scene, o, done) {
  await this.tweenImg({ angle: 14 * this.facing, scaleY: this.img.scaleY * 1.06 }, 180, 'Sine.In');
  const reach = this.tween({ x: this.home.x + 90 * this.facing }, 110, 'Power3');
  const snap = this.tweenImg({ angle: -22 * this.facing }, 110, 'Power3');
  await Promise.all([reach, snap]);
  if (o.onContact) o.onContact();
  await this.tweenImg({ angle: 0, scaleY: this.img.scaleY / 1.06 }, 220, 'Sine.Out');
  await this.tween({ x: this.home.x }, 200, 'Sine.Out');
  done();
};

P.lash_back = async function (scene, o, done) { await this.tweenImg({ angle: 0 }, 160, 'Sine.Out'); await this.tween({ x: this.home.x }, 180, 'Sine.Out'); done(); };

// ---- boss
P.pounce = async function (scene, o, done) {
  // Scrape, crouch tell, then a higher arc with a heavy landing.
  const tgt = o.target;
  const land = tgt ? tgt.root.x - 150 * this.facing : this.root.x + 240 * this.facing;
  await this.tweenImg({ x: 10 * this.facing }, 90); await this.tweenImg({ x: -6 * this.facing }, 90);
  V().burst(scene, this.root.x - 30 * this.facing, this.root.y, 0xcbb894, 6);
  await this.tweenImg({ scaleY: this.img.scaleY * 0.82, x: -18 * this.facing }, 260, 'Sine.Out');
  const up = this.tweenImg({ y: -170, scaleY: this.img.scaleY / 0.82, x: 0 }, 230, 'Power2');
  const fwd = this.tween({ x: land }, 440, 'Sine.InOut');
  await up;
  await this.tweenImg({ y: 0 }, 210, 'Power2');
  await fwd;
  V().burst(scene, this.root.x, this.root.y + 4, 0xcbb894, 12);
  V().camShake(scene, 0.006);
  if (o.onContact) o.onContact();
  done();
};

P.enrage = async function (scene, o, done) {
  // Second wind at half health: a roar, a red pulse, the ground answers.
  this.img.setTint(0xff6a5a);
  V().camShake(scene, 0.009);
  await this.tweenImg({ scaleX: this.img.scaleX * 1.1, scaleY: this.img.scaleY * 1.1 }, 160, 'Back.Out');
  await this.tweenImg({ scaleX: this.img.scaleX / 1.1, scaleY: this.img.scaleY / 1.1 }, 260, 'Sine.Out');
  if (this.img.__baseTint != null) this.img.setTint(this.img.__baseTint); else this.img.clearTint();
  this.enraged = true;
  this.trail = scene.add.rectangle(0, -this.height * 0.5, 30, 6, 0xff3b2f, 0.0);
  done();
};

// ---- hero, knocked a step back by a heavier hit
P.stagger = async function (scene, o, done) {
  this.flash(0xffffff);
  await this.tween({ x: this.home.x - 46 * this.facing }, 120, 'Power2');
  await this.tweenImg({ angle: -8 * this.facing }, 60); await this.tweenImg({ angle: 0 }, 140, 'Sine.Out');
  await this.tween({ x: this.home.x }, 260, 'Sine.InOut');
  done();
};

X.Actor = Actor;
})();
