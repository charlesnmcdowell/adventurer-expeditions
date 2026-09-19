// Party cutscenes: the ride home after a won contract, and the funeral when a
// party leader falls. Both are built from the same march-of-portraits grammar
// as the embark beat in scene_town.js (playEmbark) — portraits slide across the
// housing art with a caption bar, click to skip — so the three read as one
// language rather than three separate ideas.
//
// The embark beat is deliberately left where it is. This file adds; it does not
// refactor scene_town.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;

const Cut = {};
const DEPTH = 420;

// One at a time. playEmbark guards itself with __embarking; without the same
// guard a funeral queued behind a won contract draws over the ride home.
function busy(scene) { return !!(scene.__cutscene || scene.__embarking); }

function shortName(c) { return (c && c.name ? c.name : 'Someone').split(' ')[0]; }

// Shared stage: dims the hub, lays a caption bar, returns the handles a scene
// needs to animate portraits and finish. Mirrors playEmbark's setup exactly.
function stage(scene, opts) {
  const W = T().W, H = T().H;
  const actors = [];
  const keep = (o) => { actors.push(o); return o; };

  if (ADV.Tutor && ADV.Tutor.clear) { try { ADV.Tutor.clear(scene); } catch (e) {} }
  scene.children.list.forEach(o => {
    if (o && o.depth >= 900) {
      try { if (o.disableInteractive) o.disableInteractive(); } catch (e) {}
      scene.tweens.add({ targets: o, alpha: 0, duration: 200 });
    }
  });
  scene.__cutscene = true;
  if (scene.hideChrome) scene.hideChrome();

  // A funeral wants the light pulled down; the ride home does not.
  const location=opts.location||(!opts.gloom?'road':null);
  if(location&&ADV.AnimeEnvironments&&!scene.game.__artPreview)keep(ADV.AnimeEnvironments.view(scene,location,opts.gloom?'evening':ADV.BattleArt.phaseFor(scene.game_),{depth:DEPTH-3,travel:!opts.gloom}));
  if (opts && opts.gloom) {
    keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0c12, opts.gloom).setDepth(DEPTH - 2));
  }
  keep(scene.add.rectangle(W / 2, H - 54, W, 108, 0x0c0a08, 0.58).setDepth(DEPTH));
  const cap = keep(T().text(scene, W / 2, H - 68, opts.caption || '', {
    size: 18, display: true, ox: 0.5, oy: 0.5,
    color: opts.captionColor || T().css.gold, wrap: W - 80, align: 'center',
  }).setDepth(DEPTH + 1));
  keep(T().text(scene, W / 2, H - 30, 'click to skip', {
    size: 12, ox: 0.5, italic: true, color: T().css.inkFaint,
  }).setDepth(DEPTH + 1).setAlpha(0.75));

  return { W, H, actors, keep, cap,
    say(text) { try { if (cap.active) cap.setText(text); } catch (e) {} } };
}

// Fade to black, tear down, hand back control.
function closeOut(scene, st, done) {
  const veil = st.keep(scene.add.rectangle(st.W / 2, st.H / 2, st.W, st.H, 0x0b0a08, 0).setDepth(DEPTH + 80));
  scene.tweens.add({
    targets: veil, alpha: 1, duration: 320,
    onComplete: () => {
      st.actors.forEach(o => { try { o.destroy(); } catch (e) {} });
      scene.__cutscene = false;
      if (scene.showChrome) scene.showChrome();
      if (done) done();
    },
  });
}

// A click-anywhere skip that can only fire once, armed after a short grace so a
// stray click from the previous screen cannot eat the whole scene.
function armSkip(scene, st, finish, graceMs) {
  scene.time.delayedCall(graceMs == null ? 450 : graceMs, () => {
    if (st.done) return;
    st.keep(scene.add.rectangle(st.W / 2, st.H / 2, st.W, st.H, 0x000000, 0.001)
      .setDepth(DEPTH + 70).setInteractive()).on('pointerdown', finish);
  });
}

// One portrait card. Returns the container so the caller can tween it.
function card(scene, st, c, x0, y0, opts) {
  opts = opts || {};
  const bw = opts.lead ? 100 : 82;
  const bh = opts.lead ? 128 : 104;
  const cont = st.keep(scene.add.container(x0, y0).setDepth(DEPTH + 2 + (opts.z || 0)).setAlpha(opts.alpha == null ? 0 : opts.alpha));
  const img = scene.add.image(0, 0, ADV.Portraits.key(scene, c)).setDisplaySize(bw, bh);
  if (opts.tint != null) { try { img.setTint(opts.tint); } catch (e) {} }
  const rim = scene.add.rectangle(0, 0, bw + 4, bh + 4, 0x000000, 0)
    .setStrokeStyle(2, opts.lead ? T().c.gold : T().c.panelEdge, 0.95);
  const nm = T().text(scene, 0, bh / 2 + 10, shortName(c), {
    size: 12, ox: 0.5, display: true, color: opts.lead ? T().css.gold : T().css.ink,
  });
  cont.add([rim, img, nm]);
  cont.__img = img;
  // faces in a cutscene carry the moment: grief at a funeral, the standing mood
  // (relief reads as content) on the ride home. Overlays follow the container.
  if (ADV.Portraits.express) {
    const game = scene.game_ || (scene.g && scene.g());
    const ckey = img.texture && img.texture.key;
    if (opts.mood) ADV.Portraits.express(scene, img, c, ckey, opts.mood, opts.moodK == null ? 1 : opts.moodK);
    else if (game && ADV.Portraits.stand) { const m = ADV.Portraits.moodFor(game, c, 'cutscene'); ADV.Portraits.express(scene, img, c, ckey, m.mood === 'neutral' ? 'content' : m.mood, m.mood === 'neutral' ? 0.5 : m.intensity); }
  }
  return cont;
}

// A grave: mound, headstone and the one warm light. Drawn here rather than in
// two places — scene_death.js stages the same tableau at a different scale.
// (x, y) is the ground line the mound sits on.
Cut.grave = function (scene, o) {
  o = o || {};
  const x = o.x == null ? T().W / 2 : o.x;
  const y = o.y == null ? 566 : o.y;
  const s = o.scale || 1;
  const art=ADV.AnimeWorld?.prop(scene,'grave');
  if(art){
    const root=scene.add.container(x,y).setDepth(o.depth==null?DEPTH-1:o.depth);
    root.add(scene.add.image(0,-96*s,art).setDisplaySize(225*s,225*s));
    const lantern=ADV.AnimeWorld.prop(scene,'lantern');if(lantern)root.add(scene.add.image(102*s,-28*s,lantern).setDisplaySize(52*s,65*s));
    return root;
  }
  const g = scene.add.graphics().setDepth(o.depth == null ? DEPTH - 1 : o.depth);
  g.fillStyle(0x241f19, 1); g.fillEllipse(x, y, 210 * s, 46 * s);
  g.fillStyle(0x2f2a22, 1); g.fillEllipse(x, y - 6 * s, 190 * s, 36 * s);
  g.fillStyle(0x4a4a52, 1); g.fillRoundedRect(x - 26 * s, y - 96 * s, 52 * s, 78 * s, 6);
  g.fillStyle(0x5a5a64, 1); g.fillRoundedRect(x - 22 * s, y - 92 * s, 44 * s, 40 * s, 5);
  g.fillStyle(0x1a1814, 1);
  g.fillRect(x - 3 * s, y - 80 * s, 6 * s, 22 * s);
  g.fillRect(x - 12 * s, y - 72 * s, 24 * s, 6 * s);
  g.fillStyle(0xd4a94e, 0.15); g.fillCircle(x + 100 * s, y - 26 * s, 48 * s);
  g.fillStyle(0xd4a94e, 0.85); g.fillCircle(x + 100 * s, y - 26 * s, 7 * s);
  return g;
};

function livingRoster(game) {
  let roster = [];
  try { roster = ADV.Game.partyRoster(game).filter(c => c && c.alive !== false); } catch (e) { roster = []; }
  if (!roster.length) { const p = ADV.Game.player(game); if (p) roster = [p]; }
  const cap = (ADV.Party && ADV.Party.companyCap) ? ADV.Party.companyCap() : 8;
  return roster.slice(0, cap);
}

// ============================================================ THE RIDE HOME
// Plays on arrival in town after a won contract. Silent by design: the embark
// beat says nothing either, and the pair of them bracket the quest.
Cut.rideHome = function (scene, done) {
  const game = scene.g ? scene.g() : scene.game_;
  if (!game) { if (done) done(); return; }
  const p = ADV.Game.player(game);
  const roster = livingRoster(game);
  const party = roster.length > 1;
  if (busy(scene)) { if (done) done(); return; }
  const home = (ADV.Housing && ADV.Housing.of) ? ADV.Housing.of(p) : null;
  const where = home && home.title ? home.title.toLowerCase().replace(/^the /, 'the ') : 'home';

  const st = stage(scene, {
    caption: party ? 'The road back is quieter than the road out.'
                   : `${p.name} walks the last mile alone.`,
  });
  const n = roster.length;
  const mid = (n - 1) / 2;

  // Mirror of embark: there they walked out of frame to the right, so coming
  // home they enter from the right and settle at the door.
  roster.forEach((c, i) => {
    const isLead = c.id === p.id;
    // Far off they read as a clump on the road; at the door they spread out.
    const x0 = 1040 + (i - mid) * 54;
    const y0 = 538 + (i % 2) * 12;
    const cont = card(scene, st, c, x0, y0, { lead: isLead, z: isLead ? n : i });
    scene.tweens.add({ targets: cont, alpha: 1, duration: 300, delay: 120 + i * 80 });
    scene.tweens.add({
      targets: cont,
      x: 470 + (i - mid) * 122,
      y: 548 + (i % 2) * 14,
      duration: 1900, delay: 360 + i * 70, ease: 'Cubic.easeInOut',
    });
  });

  scene.time.delayedCall(1380, () => st.say(party
    ? `They come back to ${where}.`
    : `${shortName(p)} comes back to ${where}.`));

  let finished = false;
  const finish = (skip) => {
    if (finished) return;
    finished = true; st.done = true;
    closeOut(scene, st, () => {
      const turns = skip ? [] : ADV.Conversation.partyExchange(game, 'return');
      ADV.DialogueBox.playExchange(scene, game, turns, done);
    });
  };
  armSkip(scene, st, () => finish(true), 450);
  scene.time.delayedCall(2480, () => finish(false));
};

// ============================================================== THE FUNERAL
// The company buries its leader and then stops being a company. Each survivor
// speaks once, in their own personality's voice, from the band their standing
// with the dead leader earns — warm, indifferent, or unforgiving. Then they
// walk off in different directions, which is the party dissolving on screen.
Cut.funeral = function (scene, rec, done) {
  const game = scene.g ? scene.g() : scene.game_;
  if (!game || !rec) { if (done) done(); return; }
  if (busy(scene)) { if (done) done(); return; }
  const world = game.world;
  const player = ADV.Game.player(game);
  const leaderName = rec.leaderName || 'The lead';
  const wordsById = {};
  for (const w of rec.words || []) wordsById[w.id] = w;

  const mourners = (rec.memberIds || [])
    .map(id => ADV.World.byId(world, id))
    .filter(c => c && c.alive);
  if (player && player.alive && !mourners.some(c => c.id === player.id)) mourners.unshift(player);

  if (ADV.WeatherFX && ADV.Weather) {
    const pick = ((ADV.hashStr ? ADV.hashStr((world && world.seed) + ':funeral') : 1) % 2) ? 'rain' : 'overcast';
    ADV.WeatherFX.attach(scene, { kind: pick, intensity: 0.75, wind: 0.45 }, 'evening', { x: 0, y: 0, w: T().W, h: T().H }, { depth: DEPTH-1, town: true });
  }
  const st = stage(scene, {
    caption: mourners.length > 1
      ? `They walk ${leaderName} to the ground.`
      : `${shortName(player)} walks ${leaderName} to the ground.`,
    captionColor: T().css.inkDim,
    location: 'cemetery',
    gloom: 0.45,
  });
  const W = st.W;

  st.keep(Cut.grave(scene, { x: W / 2, y: 566, scale: 1 }));

  // Same march grammar as embark: they enter from the left and settle at the stone.
  const n = Math.max(1, mourners.length);
  const mid = (n - 1) / 2;
  const dest = mourners.map((_, i) => ({
    x: W / 2 + (i - mid) * 118,
    y: 392 + Math.abs(i - mid) * 9,
  }));
  const conts = mourners.map((c, i) => {
    const x0 = 220 + (i - mid) * 54;
    const y0 = 548 + (i % 2) * 14;
    const word = wordsById[c.id];
    const hostile = word && word.band === 'hatred';
    const cont = card(scene, st, c, x0, y0, { z: i, tint: 0x9aa0aa, lead: c.isPlayer, mood: hostile ? 'stern' : 'grief', moodK: hostile ? 0.45 : 0.8 });
    scene.tweens.add({ targets: cont, alpha: 1, duration: 280, delay: 140 + i * 90 });
    scene.tweens.add({
      targets: cont,
      x: dest[i].x,
      y: dest[i].y,
      duration: 1750, delay: 400 + i * 80, ease: 'Cubic.easeInOut',
    });
    return cont;
  });

  const finishAll = () => {
    if (st.done) return;
    st.done = true;
    st.say('The company does not re-form.');
    // Each mourner leaves by a different road: the party breaking up, shown.
    conts.forEach((cont, i) => {
      const dir = (i - mid) === 0 ? (i % 2 ? 1 : -1) : Math.sign(i - mid) || (i % 2 ? 1 : -1);
      scene.tweens.add({
        targets: cont,
        x: cont.x + dir * (320 + Math.abs(i - mid) * 80),
        alpha: 0,
        duration: 1500, delay: 260 + i * 170, ease: 'Cubic.easeIn',
      });
    });
    scene.time.delayedCall(2100, () => closeOut(scene, st, done));
  };

  // Speeches use the band earned with the dead lead, not the player.
  // DialogueBox.show hands back a {close} handle so a skip can shut an open box.
  const speakers = mourners
    .map((c, i) => ({ c, i, word: wordsById[c.id] }))
    .filter(x => x.word && x.c.personalityId);
  let idx = 0, openBox = null;
  const speakNext = () => {
    if (st.done) return;
    const turn = speakers[idx++];
    if (!turn) { finishAll(); return; }
    const { c, i, word } = turn;
    const cont = conts[i];
    if (cont) {
      try { cont.__img.clearTint(); } catch (e) {}
      scene.tweens.add({ targets: cont, y: cont.y - 10, duration: 260, yoyo: true });
    }
    st.say(`${c.name} says a word over ${leaderName}.`);
    const ctx = ADV.DialogueBox.ctxFor(game, c, {
      listenerId: null, scene: 'funeral',
      target: leaderName, subjectName: leaderName,
      them: leaderName,
      score: word.score,
    });
    openBox = ADV.DialogueBox.show(scene, game, c, 'funeral_' + (word.band || 'general'), ctx, () => {
      openBox = null;
      if (cont) { try { cont.__img.setTint(0x9aa0aa); } catch (e) {} }
      speakNext();
    });
    // show invokes the callback itself when no line is eligible.
  };

  armSkip(scene, st, () => {
    finishAll();
    if (openBox && openBox.close) { try { openBox.close(); } catch (e) {} openBox = null; }
  }, 700);
  scene.time.delayedCall(2280, () => {
    st.say(`They put ${leaderName} in the ground.`);
    speakNext();
  });
};

const CONSCRIPT_TINT = 0x9a8ab0;

function hatredMood(ch) {
  const b = ADV.Portraits && ADV.Portraits.PERSONALITY_BIAS && ch
    ? ADV.Portraits.PERSONALITY_BIAS[ch.personalityId] : null;
  const rest = b && b[0];
  if (rest === 'angry' || rest === 'furious' || rest === 'resolve') return 'furious';
  if (rest === 'disgust' || rest === 'smug') return 'disgust';
  if (rest === 'afraid') return 'afraid';
  if (rest === 'sad' || rest === 'grief') return 'grief';
  return 'angry';
}

Cut.conscription = function (scene, game, victor, c, done, extra) {
  extra = extra || {};
  if (!c) { if (done) done(); return; }
  if (busy(scene) && !scene.__cutscene) { if (done) done(); return; }
  const W = T().W;
  const st = stage(scene, { caption: '', gloom: 0.6 });
  if (ADV.VFX && ADV.VFX.cine) { ADV.VFX.cine.letterbox(scene, true); ADV.VFX.cine.camMove(scene, 'drift', { ms: 5000 }); }
  const vCard = card(scene, st, victor, 220, 340, { lead: true, z: 2 });
  const nCard = card(scene, st, c, W - 220, 340, { lead: true, z: 3 });
  scene.tweens.add({ targets: vCard, alpha: 1, x: 360, duration: 360, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: nCard, alpha: 1, x: W - 360, duration: 360, ease: 'Cubic.easeOut' });
  const mood = hatredMood(c);
  if (nCard.__img && ADV.Portraits.express) {
    ADV.Portraits.express(scene, nCard.__img, c, nCard.__img.texture && nCard.__img.texture.key, mood, 1);
    if (ADV.Portraits.look) ADV.Portraits.look(scene, nCard.__img, c, nCard.__img.texture.key, -0.9, 0, 0);
  }

  let openBox = null;
  const bind = () => {
    const g = st.keep(scene.add.graphics().setDepth(DEPTH + 6));
    if (ADV.SkillArt) st.keep(ADV.SkillArt.ritual(scene, 'conscript', vCard, nCard, DEPTH + 6));
    else {
    const dummy = { a: 0 };
    scene.tweens.add({
      targets: dummy, a: Math.PI * 2, duration: 600,
      onUpdate: () => {
        g.clear();
        g.lineStyle(3, 0x6a4a8a, 0.95);
        g.beginPath(); g.arc(nCard.x, nCard.y, 78, -Math.PI / 2, -Math.PI / 2 + dummy.a); g.strokePath();
      },
    });
    for (let i = 0; i < 3; i++) {
      scene.time.delayedCall(200 + i * 140, () => {
        if (ADV.VFX && ADV.VFX.beam) ADV.VFX.beam(scene, vCard.x + 40, vCard.y, nCard.x - 40, nCard.y - 10 + i * 10, 0x3a2a48, { w: 3, dur: 180 });
        if (ADV.VFX && ADV.VFX.camShake) ADV.VFX.camShake(scene, 0.002);
      });
    }
    }
    scene.time.delayedCall(640, () => {
      try { if (nCard.__img) nCard.__img.setTint(CONSCRIPT_TINT); } catch (e) {}
      if (nCard.__img && ADV.Portraits.express) {
        ADV.Portraits.express(scene, nCard.__img, c, nCard.__img.texture && nCard.__img.texture.key, 'dazed', 0.8);
      }
      scene.tweens.add({ targets: g, alpha: 0.35, duration: 400 });
      const n = c.conscriptQuestsLeft || 3;
      const count = extra.count | 0;
      st.say(count > 1
        ? `${count} of them are yours for ${n} quest${n === 1 ? '' : 's'}.`
        : `${c.name} is yours for ${n} quest${n === 1 ? '' : 's'}.`);
      if (extra.townRemember !== false) {
        scene.time.delayedCall(700, () => st.say('The town will remember.'));
      }
    });
    if (extra.released) {
      const old = extra.released;
      const free = card(scene, st, old, 80, 560, { lead: false, mood: 'content', moodK: 0.7, z: 1 });
      scene.tweens.add({ targets: free, alpha: 1, duration: 200 });
      scene.tweens.add({ targets: free, x: -80, alpha: 0, duration: 900, delay: 400 });
      st.keep(T().text(scene, 80, 640, `${shortName(old)} walks free.`, { size: 12, ox: 0.5, italic: true, color: T().css.inkDim }).setDepth(DEPTH + 4));
    }
  };

  const speakThenBind = () => {
    if (st.done) return;
    const ctx = ADV.DialogueBox && ADV.DialogueBox.ctxFor
      ? ADV.DialogueBox.ctxFor(game, c, { listenerId: victor.id, target: victor.name, subjectName: victor.name, scene: 'binding' })
      : {};
    if (ADV.DialogueBox && ADV.DialogueBox.show) {
      openBox = ADV.DialogueBox.show(scene, game, c, 'hatred', ctx, () => { openBox = null; bind(); });
    } else bind();
  };

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true; st.done = true;
    if (openBox && openBox.close) { try { openBox.close(); } catch (e) {} }
    if (ADV.VFX && ADV.VFX.cine) ADV.VFX.cine.letterbox(scene, false);
    closeOut(scene, st, done);
  };
  armSkip(scene, st, finish, 700);
  scene.time.delayedCall(420, speakThenBind);
  scene.time.delayedCall(7200, finish);
};

Cut.raising = function (scene, game, victor, c, done, extra) {
  extra = extra || {};
  if (!c) { if (done) done(); return; }
  const W = T().W;
  const st = stage(scene, { caption: (extra.count | 0) > 1 ? 'They stand again.' : `${c.name} stands again.`, gloom: 0.6 });
  if (ADV.VFX && ADV.VFX.cine) { ADV.VFX.cine.letterbox(scene, true); ADV.VFX.cine.camMove(scene, 'drift', { ms: 4200 }); }
  const vCard = card(scene, st, victor, 220, 340, { lead: true, z: 2 });
  const nCard = card(scene, st, c, W - 220, 340, { lead: true, z: 3, tint: 0x9aa0aa, mood: 'neutral', moodK: 0.2 });
  scene.tweens.add({ targets: vCard, alpha: 1, x: 360, duration: 360 });
  scene.tweens.add({ targets: nCard, alpha: 1, x: W - 360, duration: 360 });
  if (ADV.SkillArt) scene.time.delayedCall(360, () => { if (!st.done) st.keep(ADV.SkillArt.ritual(scene, 'necromancy', vCard, nCard, DEPTH + 6)); });
  else {
  const g = st.keep(scene.add.graphics().setDepth(DEPTH + 6));
  const dummy = { a: 0 };
  scene.tweens.add({
    targets: dummy, a: Math.PI * 2, duration: 600,
    onUpdate: () => {
      g.clear(); g.lineStyle(3, 0x9a70c0, 0.95);
      g.beginPath(); g.arc(nCard.x, nCard.y, 78, -Math.PI / 2, -Math.PI / 2 + dummy.a); g.strokePath();
    },
  });
  if (ADV.VFX && ADV.VFX.motes) ADV.VFX.motes(scene, W - 360, 360, 0x5d8a4a, 8);
  }
  scene.time.delayedCall(500, () => {
    if (nCard.__img && ADV.Portraits.express) {
      ADV.Portraits.express(scene, nCard.__img, c, nCard.__img.texture && nCard.__img.texture.key, 'dazed', 1);
      if (ADV.Portraits.look) ADV.Portraits.look(scene, nCard.__img, c, nCard.__img.texture.key, 0, -0.4, 0);
    }
  });
  const mourners = extra.mourners || [];
  mourners.forEach((m, i) => {
    scene.time.delayedCall(800 + i * 200, () => {
      if (m.img && ADV.Portraits.react) ADV.Portraits.react(scene, m.img, m.ch, m.img.texture && m.img.texture.key, 'grief', { ms: 800, intensity: 0.8 });
    });
  });
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true; st.done = true;
    if (ADV.VFX && ADV.VFX.cine) ADV.VFX.cine.letterbox(scene, false);
    closeOut(scene, st, done);
  };
  armSkip(scene, st, finish, 700);
  if (mourners[0] && ADV.DialogueBox) {
    scene.time.delayedCall(900, () => {
      const m = mourners[0].ch;
      ADV.DialogueBox.show(scene, game, m, 'hatred', ADV.DialogueBox.ctxFor(game, m, { listenerId: victor.id, target: victor.name, scene: 'binding' }), () => {});
    });
  }
  scene.time.delayedCall(5200, finish);
};

ADV.Cutscenes = Cut;
ADV.CONSCRIPT_TINT = CONSCRIPT_TINT;
})();
