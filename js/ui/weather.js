// Weather is derived in the UI from (world.seed, questClock). Same quest,
// same sky. Never stored on the world. Overlay is one container, rebuilt
// with the backdrop, never leaked across scenes.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const KINDS = ['clear', 'sunny', 'overcast', 'rain', 'storm', 'snow'];
const TINT = {
  sunny:    { color: 0xfff2d0, a: 0.10 },
  overcast: { color: 0x8a96a4, a: 0.18 },
  rain:     { color: 0x6a8094, a: 0.22 },
  storm:    { color: 0x3a4658, a: 0.30 },
  snow:     { color: 0xd8e4ee, a: 0.16 },
  clear:    { color: 0x000000, a: 0 },
};

let _force = null;

function hash01(s) {
  return ((ADV.hashStr ? ADV.hashStr(String(s)) : 1) >>> 0) / 4294967296;
}

function kindFromRoll(r) {
  if (r < 0.45) return 'clear';
  if (r < 0.60) return 'sunny';
  if (r < 0.75) return 'overcast';
  if (r < 0.87) return 'rain';
  if (r < 0.95) return 'storm';
  return 'snow';
}

function fill(seed, start, kind, h2) {
  const intensity = kind === 'clear' ? 0
    : kind === 'sunny' ? 0.5 + h2 * 0.5
    : kind === 'overcast' ? 0.3 + h2 * 0.4
    : kind === 'storm' ? 0.7 + h2 * 0.3
    : 0.3 + h2 * 0.7;
  const wind = kind === 'sunny' ? 0
    : kind === 'snow' ? (h2 * 1 - 0.5)
    : kind === 'storm' ? (h2 * 2 - 1)
    : (h2 * 2 - 1);
  const dur = 1 + Math.floor(hash01(seed + ':d:' + start) * 3);
  return { kind, intensity, wind, start, dur };
}

function runAt(seed, clock) {
  let t = 0;
  let prev = 'clear';
  let cur = fill(seed, 0, kindFromRoll(hash01(seed + ':0')), hash01(seed + ':w:0'));
  while (t <= clock) {
    let kind = kindFromRoll(hash01(seed + ':' + t));
    if (kind !== 'clear' && kind === prev) {
      const alts = KINDS.filter(k => k !== kind);
      kind = alts[Math.floor(hash01(seed + ':alt:' + t) * alts.length)];
    }
    cur = fill(seed, t, kind, hash01(seed + ':w:' + t));
    prev = cur.kind;
    if (t + cur.dur > clock) return cur;
    t += cur.dur;
  }
  return cur;
}

function applyBias(w, groundId) {
  if (!groundId || !ADV.BattleArt || !ADV.BattleArt.GROUNDS) return w;
  const rec = ADV.BattleArt.GROUNDS[groundId];
  const bias = rec && rec.weatherBias;
  if (!bias) return w;
  const out = Object.assign({}, w);
  if (bias === 'rain' && (w.kind === 'clear' || w.kind === 'sunny')) {
    out.kind = hash01(groundId + ':' + w.start) < 0.55 ? 'rain' : 'overcast';
    out.intensity = Math.max(out.intensity, 0.4);
  } else if (bias === 'snow' && w.kind !== 'storm') {
    out.kind = 'snow';
    out.intensity = Math.max(out.intensity, 0.4);
    out.wind = Math.max(-0.5, Math.min(0.5, out.wind));
  } else if (bias === 'storm') {
    out.kind = hash01(groundId + ':' + w.start) < 0.45 ? 'storm' : 'overcast';
    out.intensity = Math.max(out.intensity, 0.7);
  }
  return out;
}

function applyPhase(w, phase) {
  const out = Object.assign({}, w);
  if (out.kind === 'sunny' && phase && phase !== 'day') {
    out.kind = 'clear';
    out.intensity = 0;
  }
  return out;
}

const Weather = {};
Weather.KINDS = KINDS;
Weather.force = function (kind, extra) {
  _force = kind ? Object.assign({ kind, intensity: 0.8, wind: kind === 'storm' ? 0.8 : 0.2 }, extra || {}) : null;
  return _force;
};
Weather.at = function (world, opts) {
  opts = opts || {};
  const seed = (world && world.seed) || 1;
  const clock = (world && world.questClock) | 0;
  const phase = opts.phase || (ADV.Housing && ADV.Housing.timeOfDay ? ADV.Housing.timeOfDay(clock) : 'day');
  if (_force) return applyPhase(Object.assign({}, _force), phase);
  let w = runAt(seed, clock);
  if (opts.override) w = Object.assign({}, w, opts.override);
  w = applyBias(w, opts.groundId);
  return applyPhase(w, phase);
};
Weather.forScene = function (scene, opts) {
  const game = scene && (scene.game_ || (scene.g && scene.g()));
  const world = game && game.world;
  return Weather.at(world || { seed: 1, questClock: 0 }, opts);
};

function phone(scene) {
  try {
    if (ADV.UI && ADV.UI.isTouch && ADV.UI.isTouch()) return true;
    if (scene && scene.scale && scene.scale.width < 900) return true;
  } catch (e) {}
  return false;
}

function tex(scene, key, w, h, draw) {
  if (ADV.VFX && ADV.VFX._tex && ADV.VFX._tex.fxTex) return ADV.VFX._tex.fxTex(scene, key, w, h, draw);
  if (scene.textures.exists(key)) return key;
  try {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    scene.textures.addCanvas(key, c);
  } catch (e) {}
  return key;
}
function rainTex(scene) {
  return tex(scene, 'wx_rain', 4, 16, (ctx) => {
    ctx.strokeStyle = 'rgba(170,198,220,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(2, 1); ctx.lineTo(2, 15); ctx.stroke();
  });
}
function snowTex(scene) {
  return (ADV.VFX && ADV.VFX._tex) ? ADV.VFX._tex.snowKey(scene) : tex(scene, 'fx_snow', 8, 8, (ctx) => {
    ctx.fillStyle = 'rgba(244,238,224,0.9)';
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
  });
}
function cloudTex(scene, dark) {
  const key = dark ? 'wx_cloud_anime_d' : 'wx_cloud_anime';
  return tex(scene, key, 512, 128, (ctx) => {
    // A continuous, wispy bank instead of overlapping translucent circles.
    const data=ctx.createImageData(512,128),p=data.data;
    const rand=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
    const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return(rand(ix,iy)*(1-u)+rand(ix+1,iy)*u)*(1-v)+(rand(ix,iy+1)*(1-u)+rand(ix+1,iy+1)*u)*v;};
    for(let y=0;y<128;y++)for(let x=0;x<512;x++){
      const n=noise(x/88,y/30)*.6+noise(x/32,y/14)*.28+noise(x/13,y/7)*.12;
      const envelope=Math.pow(Math.sin(Math.PI*y/128),1.8),seam=Math.min(1,x/40,(511-x)/40),i=(y*512+x)*4;
      const c=dark?45+n*20:192+n*38;p[i]=c;p[i+1]=c+8;p[i+2]=c+18;p[i+3]=Math.max(0,n-.27)*envelope*seam*(dark?160:125);
    }
    ctx.putImageData(data,0,0);
  });
}

function emit(scene, key, cfg) {
  try {
    const em = scene.add.particles(0, 0, key, cfg);
    if (em && em.setDepth) em.setDepth(cfg.depth == null ? 0 : cfg.depth);
    if (em) em.__em = em;
    return em;
  } catch (e) {
    try {
      const mgr = scene.add.particles(key);
      if (mgr && mgr.setDepth) mgr.setDepth(cfg.depth == null ? 0 : cfg.depth);
      if (mgr && mgr.createEmitter) {
        mgr.__em = mgr.createEmitter(cfg);
        return mgr;
      }
    } catch (e2) {}
  }
  return null;
}

const WeatherFX = {};
WeatherFX.STATS = { lastMs: 0, avgMs: 0, n: 0 };

// A conservative sky silhouette keeps celestial light behind roofs and tree crowns.
WeatherFX.skyMask = function(scene,source,scale,x=0,y=0,repeat=false){
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
  const pixels=ADV.ArtAssets.readPixels(ctx,0,0,canvas.width,canvas.height)?.data,profile=[],step=6;
  if(!pixels){const shape=scene.make.graphics({add:false}),mask=shape.createGeometryMask();return{mask,anchor:null,update(){},destroy(){mask.destroy();shape.destroy();}};}
  for(let px=0;px<canvas.width;px+=step){let py=0;
    for(;py<canvas.height*.4;py++){
      const at=(py*canvas.width+px)*4,r=pixels[at],g=pixels[at+1],b=pixels[at+2];
      if(!((b>180&&b>r*1.07&&b>g*.97)||(r>185&&g>185&&b>190&&b>=r*.97)))break;
    }profile.push([px*scale,py*scale]);
  }
  const shape=scene.make.graphics({add:false}),mask=shape.createGeometryMask(),span=canvas.width*scale;
  const update=offset=>{shape.clear().fillStyle(0xffffff);for(let copy=0;copy<(repeat?2:1);copy++){
    const left=x+copy*span-(repeat?offset%span:0);shape.beginPath();shape.moveTo(left,y);shape.lineTo(left+span,y);
    for(let i=profile.length-1;i>=0;i--)shape.lineTo(left+profile[i][0],y+profile[i][1]);shape.closePath();shape.fillPath();
  }};update(0);
  let anchor=null,best=-Infinity;
  for(let i=5;i<profile.length-5;i++){
    const sx=x+profile[i][0],bottom=y+Math.min(...profile.slice(i-5,i+6).map(p=>p[1]));
    if(sx<100||sx>1180||bottom<40)continue;
    const score=bottom-Math.abs(sx-980)*.035;if(score>best){best=score;anchor={x:sx,y:Math.max(20,Math.min(90,bottom*.45))};}
  }
  return{mask,anchor,update,destroy(){mask.destroy();shape.destroy();}};
};

WeatherFX.attach = function (scene, weather, phase, bounds, opts) {
  opts = opts || {};
  if (!opts.independent && scene.weatherFx && scene.weatherFx.destroy) {
    try { scene.weatherFx.destroy(); } catch (e) {}
    scene.weatherFx = null;
  }
  weather = weather || { kind: 'clear', intensity: 0, wind: 0 };
  phase = phase || 'day';
  bounds = bounds || { x: 0, y: 0, w: ADV.T.W, h: ADV.T.H };
  const precipitationBounds=opts.precipBounds||bounds;
  const depth = opts.depth == null ? -5 : opts.depth;
  const cont = scene.add.container(0, 0).setDepth(depth);
  const handle = { container: cont, weather, intensity: weather.intensity, _objs: [], _timers: [] };
  const keep = (o) => { if (o) { handle._objs.push(o); if (o !== cont) cont.add(o); if(opts.mask&&o.setMask)o.setMask(opts.mask); } return o; };
  const reduced = () => ADV.Prefs?.get().artMotion===false || typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Recurring weather must retain only pending timers on a long-lived home screen.
  const later = (delay, callback) => {
    const timer = scene.time.delayedCall(delay, () => {
      handle._timers = handle._timers.filter(t => t !== timer);
      if (!handle.destroyed) callback();
    });
    handle._timers.push(timer);return timer;
  };

  const night = phase === 'night' ? 0.5 : 1;
  const tintDef = TINT[weather.kind] || TINT.clear;
  const tintA = Math.min(0.35, tintDef.a * night * (opts.tintScale == null ? 1 : opts.tintScale));
  const tint = keep(scene.add.rectangle(
    bounds.x + bounds.w / 2, bounds.y + bounds.h / 2,
    bounds.w, bounds.h, tintDef.color, tintA
  ).setDepth(depth));
  handle.tint = tint;

  if(opts.celestial && ['clear','sunny'].includes(weather.kind)){
    const sky=keep(scene.add.graphics()),sx=opts.sunX??1080,sy=opts.sunY??(phase==='evening'?160:82);
    const moon=phase==='night',color=moon?0xdce8fa:phase==='evening'?0xffb36e:0xfff0bd;
    if(moon){
      for(let i=0;i<48;i++){const x=bounds.x+(i*193%bounds.w),y=bounds.y+12+(i*47%180);sky.fillStyle(0xe0ebff,.25+i%4*.12);sky.fillCircle(x,y,i%5===0?1.5:.8);}
    }
    for(let i=5;i>0;i--){sky.fillStyle(color,moon?.025:.023);sky.fillCircle(sx,sy,20+i*12);}
    sky.fillStyle(color,moon?.88:.6);sky.fillCircle(sx,sy,moon?25:30);
    if(moon){sky.fillStyle(0x95acc9,.27);for(const [x,y,r]of [[-9,-7,6],[7,9,8],[10,-11,4],[-8,13,3]])sky.fillCircle(sx+x,sy+y,r);}
    if(opts.celestialMask)sky.setMask(opts.celestialMask);
    handle.celestial=sky;
  }

  if (weather.kind === 'sunny' && phase === 'day') {
    const sx = opts.sunX == null ? 1080 : opts.sunX;
    const sy = opts.sunY == null ? 70 : opts.sunY;
    const rays = scene.add.graphics().setPosition(sx,sy).setDepth(depth);
    rays.setBlendMode && rays.setBlendMode(Phaser.BlendModes.ADD);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = 1.9 + i * 0.22;
      rays.fillStyle(0xfff4c8, 0.012 + i * 0.002);
      rays.beginPath();
      rays.moveTo(0, 0);
      rays.lineTo(Math.cos(a - 0.04) * 1200, Math.sin(a - 0.04) * 1200);
      rays.lineTo(Math.cos(a + 0.04) * 1200, Math.sin(a + 0.04) * 1200);
      rays.closePath(); rays.fillPath();
    }
    keep(rays);
    handle.rays=rays;
    if(!reduced())scene.tweens.add({ targets: rays, alpha: .6, duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  if (opts.clouds || opts.celestial || weather.kind === 'overcast' || weather.kind === 'rain' || weather.kind === 'storm') {
    const key = cloudTex(scene, weather.kind === 'storm');
    const a = weather.kind === 'storm' ? 0.55 : ['clear','sunny'].includes(weather.kind) ? (phase==='night'?.14:.22) : 0.4;
    const c1 = scene.add.tileSprite(bounds.x, bounds.y + 40, bounds.w + 256, 90, key).setOrigin(0, 0).setAlpha(a).setDepth(depth);
    const c2 = scene.add.tileSprite(bounds.x - 80, bounds.y + 70, bounds.w + 256, 80, key).setOrigin(0, 0).setAlpha(a * 0.7).setDepth(depth);
    keep(c1); keep(c2);
    if(opts.cloudMask){c1.setMask(opts.cloudMask);c2.setMask(opts.cloudMask);}
    handle.clouds = [c1, c2];
    const spd = Math.max(0.2, Math.abs(weather.wind) * 6);
    handle._cloudTick = (dt) => {
      c1.tilePositionX += spd * (dt / 16) * (weather.wind >= 0 ? 1 : -1);
      c2.tilePositionX += spd * 0.6 * (dt / 16) * (weather.wind >= 0 ? 1 : -1);
    };
  }

  const wet = weather.kind === 'rain' || weather.kind === 'storm';
  const half = phone(scene) ? 0.5 : 1;
  if (wet) {
    const dens = weather.kind === 'storm' ? 1.6 : 1;
    const qty = Math.round((120 + 140 * weather.intensity) * dens * half);
    const ang = -20 * weather.wind;
    const mgr = emit(scene, rainTex(scene), {
      x: { min: precipitationBounds.x - 40, max: precipitationBounds.x + precipitationBounds.w + 40 },
      y: precipitationBounds.y - 20,
      speedY: { min: 900, max: 1200 },
      speedX: weather.wind * 220,
      lifespan: Math.max(400, precipitationBounds.h + 200),
      quantity: Math.max(1,Math.round((weather.kind==='storm'?6:4)*half)),
      frequency: weather.kind==='storm'?24:36,
      alpha: 0.55,
      rotate: ang,
      maxParticles: qty,
      depth: depth + 1,
    });
    if (mgr) {
      keep(mgr);
      handle.precip = mgr;
      if (opts.mask) { try { mgr.setMask(opts.mask); } catch (e) {} }
    }
    if (opts.town && !opts.mask && ADV.VFX && ADV.VFX.ring) {
      const splash = scene.time.addEvent({
        delay: 220, loop: true,
        callback: () => {
          if (!cont.visible || Math.random() > 1 / 12) return;
          const x = bounds.x + 20 + Math.random() * (bounds.w - 40);
          ADV.VFX.ring(scene, x, bounds.y + bounds.h - 40, 0x9ab0c0, { r: 3, scale: 1.4, dur: 120 });
        },
      });
      handle._timers.push(splash);
    }
  }

  if (weather.kind === 'snow') {
    const qty = Math.round((80 + 80 * weather.intensity) * half);
    const mgr = emit(scene, snowTex(scene), {
      x: { min: precipitationBounds.x, max: precipitationBounds.x + precipitationBounds.w },
      y: { min: precipitationBounds.y - 30, max: precipitationBounds.y + precipitationBounds.h * .9 },
      speedY: { min: 40, max: 90 },
      speedX: weather.wind * 40,
      accelerationX: weather.wind * 8,
      lifespan: 6500,
      quantity: 1,
      frequency: 40,
      alpha: { start: 0.85, end: 0.3 },
      scale: { start: 0.7, end: 0.35 },
      maxParticles: qty,
      depth: depth + 1,
    });
    if (mgr) {
      keep(mgr);
      handle.precip = mgr;
      if (opts.mask) { try { mgr.setMask(opts.mask); } catch (e) {} }
    }
    if (opts.town) {
      const strip = keep(scene.add.rectangle(
        bounds.x + bounds.w / 2, bounds.y + bounds.h - 8,
        bounds.w, 16 + 10 * weather.intensity, 0xf4eee0, 0.25
      ).setDepth(depth + 1));
      handle.accumulation = strip;
    }
  }

  if (weather.kind === 'storm') {
    const flash=keep(scene.add.rectangle(bounds.x+bounds.w/2,bounds.y+bounds.h/2,bounds.w,bounds.h,0xd5e7ff,0));
    const bolt=keep(scene.add.graphics());
    const strike = () => {
      if (handle.destroyed || !cont.visible || document.hidden || reduced() || !scene.sys || !scene.sys.isActive()) return;
      if (opts.combat && scene.__fxBusy) return;
      const x = bounds.x + 80 + Math.random() * (bounds.w - 160);
      {
        bolt.clear().setAlpha(.7);bolt.lineStyle(2,0xd5e7ff,.8);let px=x,py=bounds.y;
        for(let i=1;i<8;i++){const nx=x+(i%2?22:-12)+Math.random()*15,ny=bounds.y+i*bounds.h*.045;bolt.lineBetween(px,py,nx,ny);px=nx;py=ny;}
        scene.tweens.add({targets:bolt,alpha:0,duration:230});
      }
      if (tint) {
        scene.tweens.add({ targets: tint, alpha: Math.min(0.35, tintA + 0.04), duration: 70, yoyo: true });
      }
      flash.setAlpha(.14);scene.tweens.add({targets:flash,alpha:0,duration:220});
      if (opts.onLightning) try { opts.onLightning(); } catch (e) {}
      handle._lastFlash = Date.now();
    };
    const arm = (first=false) => {
      if(handle.destroyed)return;
      const wait = first ? 2300 + Math.random()*1700 : 6000 + Math.random() * 8000;
      later(wait, () => { strike(); arm(); });
    };
    arm(true);
    if (handle.clouds) {
      const gust = () => {
        if (handle.destroyed || !handle.clouds) return;
        scene.tweens.add({
          targets: handle.clouds, alpha: { from: handle.clouds[0].alpha, to: handle.clouds[0].alpha * 0.85 },
          duration: 600, yoyo: true,
        });
        later(3000 + Math.random() * 2000, gust);
      };
      later(3500, gust);
    }
  }

  if (opts.windTrees && opts.windTrees.length && weather.kind !== 'clear' && weather.kind !== 'sunny') {
    const mag = (weather.kind === 'storm' ? 0.05 : 0.03) * Math.max(0.3, Math.abs(weather.wind));
    opts.windTrees.forEach((t) => {
      scene.tweens.add({
        targets: t, angle: mag * 57,
        duration: 1400 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  handle.setIntensity = function (v) {
    handle.intensity = v;
    if (tint) tint.setAlpha(Math.min(0.35, tintDef.a * night * v));
  };
  handle.destroy = function () {
    if(handle.destroyed)return;handle.destroyed=true;
    scene.events.off('shutdown',handle.destroy);
    handle._timers.forEach(t => { try { t.remove(false); } catch (e) {} });
    handle._timers = [];
    handle._objs.forEach(o => { try { scene.tweens.killTweensOf(o);if (o && o.destroy) o.destroy(); } catch (e) {} });
    try { cont.destroy(true); } catch (e) {}
    if (scene.weatherFx === handle) scene.weatherFx = null;
  };
  if (handle._cloudTick || handle.precip) {
    handle._upd = (t, dt) => {
      const paused = !cont.visible || document.hidden || reduced();
      if (handle.precip) handle.precip.active = !paused;
      if (!paused && handle._cloudTick) handle._cloudTick(Math.min(dt,50));
    };
    scene.events.on('update', handle._upd);
    const prev = handle.destroy;
    handle.destroy = function () {
      try { scene.events.off('update', handle._upd); } catch (e) {}
      prev();
    };
  }
  if (!opts.independent) scene.weatherFx = handle;
  scene.events.once('shutdown', handle.destroy);
  return handle;
};

ADV.Weather = Weather;
ADV.WeatherFX = WeatherFX;
})();
