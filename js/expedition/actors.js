// Adventurer: Expeditions — actors on the foreground band.
// An Actor owns one sprite (a sheet, or a one-frame placeholder), its shadow,
// floating level tag + HP bar, and status badges. It plays named clips and
// resolves a promise when the clip releases. With painted sheets the clip is a
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
    // Every frame shares the hero canvas whose bottom centre is the ground pivot
    // (GDD §10.3 registration), so origin (0.5, 1) holds across clips.
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
    this.img.setScale(s * (opts.flipX ? -1 : 1), s);
    if (opts.tint) { this.img.setTint(opts.tint); this.img.__baseTint = opts.tint; }
    this.root.add([this.shadow, this.img]);
    this.badges = new Map();
    this.buildPlates(scene);
    if (this.sheet) this.idle();
  }

  // ---------------------------------------------------------------- plates
  buildPlates(scene) {
    const w = 132, top = -this.height - 14;
    const plate = scene.add.container(0, top);
    this.tag = T().text(scene, 0, 0, '[Lvl.' + this.level + ']', { size: 12, ox: 0.5, color: '#f4eee0', display: true });
    this.tag.setStroke('#000000', 3);
    this.barBg = scene.add.rectangle(0, 18, w, 9, 0x1a1512, 0.9).setStrokeStyle(1, 0x000000, 0.9);
    this.bar = scene.add.rectangle(-w / 2 + 1, 18, w - 2, 7, this.side === 'a' ? 0x62c95a : 0xd9433b).setOrigin(0, 0.5);
    this.barHurt = scene.add.rectangle(-w / 2 + 1, 18, w - 2, 7, 0xf4eee0, 0.8).setOrigin(0, 0.5);
    plate.add([this.tag, this.barBg, this.barHurt, this.bar]);
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
    for (const b of this.badges.values()) { b.setPosition(-this.height * 0.28 + i * 26, -this.height - 34); i++; }
  }

  pulseBadge(kind) {
    const b = this.badges.get(kind);
    if (b) this.scene.tweens.add({ targets: b, scale: 1.45, duration: 90, yoyo: true });
  }

  setLevel(n) { this.level = n; this.tag.setText('[Lvl.' + n + ']'); }

  // ---------------------------------------------------------------- geometry
  get x() { return this.root.x; }
  get y() { return this.root.y; }
  chest() { return { x: this.root.x, y: this.root.y - this.height * 0.55 }; }
  contactPoint(other) { return { x: (this.root.x + other.root.x) / 2, y: this.root.y - this.height * 0.4 }; }

  // ---------------------------------------------------------------- clips
  // Every clip resolves when it releases. `opts.onContact` fires at the
  // contact moment so the director can apply impact presentation exactly then.
  play(clip, opts) {
    opts = opts || {};
    const sheetClip = this.sheet ? this.sheetClipFor(clip, opts) : null;
    if (sheetClip) return this.playSheet(sheetClip, clip, opts);
    const fn = Actor.PLACEHOLDER[clip];
    if (!fn) return Promise.resolve();
    return new Promise(resolve => fn.call(this, this.scene, opts, resolve));
  }

  // Director clip name → painted clip id (X.clipFor maps the vocabulary; a
  // clip the sheet lacks falls back to placeholder motion, so partial
  // deliveries play).
  sheetClipFor(clip, opts) {
    const id = X.clipFor ? X.clipFor(clip, opts) : clip;
    return id && this.sheet.clips[id] ? id : null;
  }

  // Idle loop; the resting state every other clip returns to.
  idle() {
    if (!this.sheet || !this.alive) return;
    const c = this.sheet.clips.idle; if (!c) return;
    this.img.play(this.animKey('idle'), true);
  }

  animKey(id) {
    const key = this.sheet.key + ':' + id, scene = this.scene, c = this.sheet.clips[id];
    if (!scene.anims.exists(key)) {
      const ms = c.frameMs || Math.round((c.durationMs || c.frames.length * 100) / c.frames.length);
      scene.anims.create({ key, frames: c.frames.map(f => ({ key: this.sheet.key, frame: f, duration: ms })), repeat: c.loop ? -1 : 0 });
    }
    return key;
  }

  // Frame playback with Astra's zero-based, clip-local marks (GDD §10.3):
  // onContact at the first contact frame (frame 0 included), onHit(k) for any
  // further contact, the promise resolves at the release frame while the
  // frames run out to the end, then idle. Impact drift moves the root forward
  // over the contact and back after release (X.impact overrides the draft).
  playSheet(id, clip, opts) {
    const c = this.sheet.clips[id], scene = this.scene, key = this.animKey(id);
    const imp = (X.impact && X.impact[id]) || c.impact || {};
    const drift = imp.drift && imp.drift.distancePx ? imp.drift.distancePx : 0;
    // A looping locomotion clip: play while the root moves, then idle.
    if (c.loop) {
      return (async () => {
        if (opts.from != null) this.root.x = opts.from;
        this.img.play(key, true);
        const to = opts.x != null ? opts.x : (clip === 'enter' ? this.home.x : this.root.x + 200);
        if (to !== this.root.x) await this.tween({ x: to }, opts.duration || 700, clip === 'enter' ? 'Sine.Out' : 'Sine.InOut');
        if (clip !== 'walk' || opts.thenIdle !== false) this.idle();
      })();
    }
    return new Promise(resolve => {
      const contacts = (c.contact || []).slice();
      const release = c.release != null ? c.release : c.frames.length - 1;
      let hits = 0, released = false;
      const at = (i) => {
        while (contacts.length && i >= contacts[0]) {
          contacts.shift();
          if (hits === 0) { if (opts.onContact) opts.onContact(); if (drift) this.tween({ x: this.root.x + drift * this.facing }, 90, imp.drift.ease || 'Quad.Out'); }
          else if (opts.onHit) opts.onHit(hits);
          hits++;
        }
        if (!released && i >= release) { released = true; if (opts.onRelease) opts.onRelease(); resolve(); }
      };
      const onStart = (anim, frame) => at(frame.index - 1);
      const onUpdate = (anim, frame) => at(frame.index - 1);
      const onDone = () => {
        this.img.off('animationstart', onStart); this.img.off('animationupdate', onUpdate);
        at(c.frames.length - 1);
        if (drift) this.tween({ x: this.home.x }, 160, 'Sine.Out');
        if (clip !== 'kneel') this.idle();
      };
      this.img.on('animationstart', onStart);
      this.img.on('animationupdate', onUpdate);
      this.img.once('animationcomplete', onDone);
      this.img.play(key, true);
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
    this.alive = false;
    this.plate.setVisible(false);
    for (const b of this.badges.values()) b.setVisible(false);
    this.img.setTintFill(0xfff4d6);
    await Promise.all([
      this.tweenImg({ alpha: 0, y: this.img.y - 30 }, 420, 'Power1'),
      new Promise(res => this.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 420, onComplete: res })),
    ]);
    this.root.setVisible(false);
  }

  destroy() { this.root.destroy(); }
}

// ---------------------------------------------------------------- placeholder motion
// Each entry: function(scene, opts, done). Uses only the placeholder image;
// replaced by sheet clips of the same name when painted frames land.
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
