// Battlefield props (2026-10-11, physics proposal step 1). Crates, barrels,
// rocks and the like stand on the combat floor as Matter.js bodies (bundled in
// Phaser): blows near them knock them about, a body thrown by X.Knockback shoves
// them along, and breakables shatter into debris. Presentation only — nothing
// here touches the simulation. A location has props only once its painted
// sheet is delivered (docs/PHYSICS_ART_BRIEF_20261011.md §1) and listed in
// P.available; until then this module loads and draws nothing.
(function () {
'use strict';
const A = ADV, X = A.Expedition, P = X.Props = {
  enabled: true,
  available: [],               // stage sets with assets/expedition/props/<set>/props.json delivered
  floorY: 612,
  density: { light: 0.0008, medium: 0.0018, heavy: 0.005 },
  breakSpeed: 13,              // px/frame at which a breakable shatters (heavy blows, not every graze)
  debrisMs: 2400,
};
const BASE = 'assets/expedition/props/';
P.keyFor = set => 'xp_props_' + set;
P.setFor = bg => (X.BattleStage && X.BattleStage.sets && X.BattleStage.sets[bg]) || null;

P.preload = function (scene, bg) {
  const set = P.setFor(bg);
  if (!P.enabled || !set || !P.available.includes(set)) return;
  const key = P.keyFor(set);
  if (!scene.textures.exists(key)) scene.load.multiatlas(key, BASE + set + '/props.json', BASE + set + '/');
  if (!scene.cache.json.exists(key + '_data')) scene.load.json(key + '_data', BASE + set + '/props.json');
};

// A manifest is usable when every placed prop is defined, has a frame and a size.
P.validate = function (data) {
  const errors = [], defs = new Map(((data && data.props) || []).map(p => [p.id, p]));
  for (const p of defs.values()) {
    if (!p.frame) errors.push(p.id + ': no frame');
    if (!(p.w > 0 && p.h > 0)) errors.push(p.id + ': no size');
    if (p.shape && !['box', 'circle'].includes(p.shape)) errors.push(p.id + ': shape must be box or circle');
    if (p.mass && !P.density[p.mass]) errors.push(p.id + ': mass must be light, medium or heavy');
  }
  for (const l of ((data && data.layout) || [])) if (!defs.has(l.id)) errors.push('layout uses unknown prop ' + l.id);
  return errors;
};

P.spawn = function (scene, bg) {
  const set = P.setFor(bg), key = set && P.keyFor(set);
  if (!P.enabled || !key || !scene.matter || !scene.textures.exists(key)) return null;
  const data = scene.cache.json.get(key + '_data');
  return data && !P.validate(data).length ? P.build(scene, key, data) : null;
};

// Floor, side walls and the placed props. Returns the live set; also scene.props.
P.build = function (scene, key, data) {
  const M = scene.matter, floor = P.floorY;
  M.add.rectangle(640, floor + 40, 4000, 80, { isStatic: true, label: 'floor', friction: 0.9 });
  M.add.rectangle(-60, 300, 120, 1200, { isStatic: true, label: 'wall' });
  M.add.rectangle(1340, 300, 120, 1200, { isStatic: true, label: 'wall' });
  const defs = new Map(data.props.map(p => [p.id, p]));
  const live = { key, items: [], debris: [] };
  for (const l of (data.layout || [])) {
    const d = defs.get(l.id);
    const img = M.add.image(l.x, floor - d.h / 2 - 1, key, d.frame, { shape: d.shape === 'circle' ? { type: 'circle' } : undefined,
      friction: 0.7, frictionAir: 0.01, restitution: 0.12 });
    img.setDisplaySize(d.w, d.h).setDepth(l.front ? 170 : 95);
    img.setDensity(P.density[d.mass || 'medium']);
    live.items.push({ img, def: d });
  }
  P.attachClock(scene);
  scene.props = live;
  scene.events.once('shutdown', () => { if (scene.props === live) scene.props = null; });
  return live;
};

// Matter runs only while the fight does: menu pause, the scene clock and
// painted hit-stop freeze it; cinematic slow motion slows it.
P.attachClock = function (scene) {
  if (scene.__propsClock) return;
  const tick = () => {
    const world = scene.matter && scene.matter.world; if (!world) return;
    const frozen = !!(scene.paused || scene.time.paused || scene.__paintedHitStopCount > 0);
    world.enabled = !frozen;
    world.engine.timing.timeScale = scene.time.timeScale || 1;
    if (scene.props) P.checkBreaks(scene);
  };
  scene.__propsClock = tick;
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => { scene.events.off('update', tick); scene.__propsClock = null; });
};

// A blow lands at (x, y): props within `radius` are knocked away from `dir`.
P.blast = function (scene, x, y, dir, power, radius) {
  const live = scene && scene.props; if (!live) return 0;
  radius = radius || 170; let hit = 0;
  for (const p of live.items) {
    if (!p.img.active) continue;
    const dx = p.img.x - x, dy = p.img.y - y, d = Math.hypot(dx, dy);
    if (d > radius) continue;
    const k = (1 - d / radius) * (power || 8) / Math.sqrt(P.density[p.def.mass || 'medium'] / P.density.medium);
    p.img.setVelocity(p.img.body.velocity.x + (dir || Math.sign(dx) || 1) * k, p.img.body.velocity.y - k * 0.6);
    p.img.setAngularVelocity((dir || 1) * k * 0.012);
    hit++;
  }
  return hit;
};

// A thrown body sweeps along the floor: props it overlaps are carried with it.
P.sweep = function (scene, x, halfWidth, vx) {
  const live = scene && scene.props; if (!live) return;
  for (const p of live.items) {
    if (!p.img.active || Math.abs(p.img.x - x) > halfWidth + p.def.w / 2 || p.img.y < P.floorY - 160) continue;
    const want = vx / 60 * 0.8;                                    // px/s to Matter's px/frame
    if (Math.abs(want) > Math.abs(p.img.body.velocity.x)) p.img.setVelocity(want, Math.min(p.img.body.velocity.y, -1.5));
  }
};

P.checkBreaks = function (scene) {
  const live = scene.props;
  for (const p of live.items) {
    if (!p.img.active || !p.def.breakable || !(p.def.debris || []).length) continue;
    const v = p.img.body.velocity;
    if (Math.hypot(v.x, v.y) >= P.breakSpeed) P.shatter(scene, p, v);
  }
};

P.shatter = function (scene, p, v) {
  const { x, y } = p.img, M = scene.matter, live = scene.props;
  p.img.destroy();
  p.def.debris.forEach((frame, i) => {
    const s = M.add.image(x + (i - 1.5) * 10, y - 6, live.key, frame, { friction: 0.8, restitution: 0.2 });
    s.setDisplaySize(Math.max(10, p.def.w * 0.35), Math.max(10, p.def.h * 0.35)).setDepth(96).setDensity(P.density.light);
    s.setVelocity(v.x * 0.7 + (i - 1.5) * 1.6, v.y * 0.5 - 3 - (i % 2) * 2);
    s.setAngularVelocity((i - 1.5) * 0.08);
    live.debris.push(s);
    scene.time.delayedCall(P.debrisMs, () => { if (s.active) scene.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.destroy() }); });
  });
};
})();
