// Adventurer: Expeditions — resolved combat events → choreography.
// Beats.play(scene, step) receives one sim step (Encounter.step / peek) and
// performs it with the actors. Nothing here changes a number: the damage on
// screen is e.dmg, the death on screen is e.down, the dodge on screen is e.evade.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const V = () => A.VFX;
const CP = () => A.CombatPresentation;
const TM = () => X.timing;
const Beats = X.Beats = {};

const wait = (scene, t) => new Promise(r => scene.time.delayedCall(t, r));

// SFX through the website's sample bank (slash_/bite_/block/miss/guard_).
function sfx(scene, family, phase) {
  const cp = CP(); if (!cp) return;
  try { cp.sound(scene, { id: family, family, melee: true, tier: 'basic', intensity: 1 }, phase); } catch (e) {}
}

function actorOf(scene, uid) { return scene.actors.get(uid) || null; }

// The shared helper pauses tweens, not painted frame animations. Use the same
// scaled scene timer for both, including cinematic slow motion and user pause.
function hitStop(scene, ms) {
  const sync = () => { for (const a of scene.actors.values()) if (a.syncPause) a.syncPause(); };
  scene.__paintedHitStopCount = (scene.__paintedHitStopCount || 0) + 1;
  sync();
  V().hitStop(scene, ms);
  scene.time.delayedCall(ms || 60, () => {
    scene.__paintedHitStopCount = Math.max(0, scene.__paintedHitStopCount - 1);
    sync();
  });
}

function trackImpact(scene, promise) {
  const work = scene.__paintedReactions || (scene.__paintedReactions = new Set());
  work.add(promise);
  promise.then(() => work.delete(promise), () => work.delete(promise));
}

function deferImpact(scene, delay, fn) {
  trackImpact(scene, new Promise((resolve, reject) => scene.time.delayedCall(delay, () => {
    try { fn(); resolve(); } catch (error) { reject(error); }
  })));
}

async function finishReactions(scene) {
  const work = scene.__paintedReactions;
  while (work && work.size) await Promise.all([...work]);
}

function recoil(scene, target, event) {
  if (target.side !== 'b' || !target.alive || target._destroyed || !target.root.visible || !target.sheet || event.tag === 'dot' || !(event.dmg > 0)) return;
  const id = target.sheetClipFor('hit_short');
  if (!id || !/^(hit[-_](short|heavy)|hit)$/.test(id) || target.sheet.clips[id].paired) return;
  trackImpact(scene, target.play('hit_short'));
}

function dmgColor(e) { return e.tag === 'dot' ? (e.visual && e.visual.dotKind === 'poison' ? '#9be79b' : '#ff8a80') : '#f4eee0'; }

// Impact presentation shared by every landed blow.
function impact(scene, tgt, e, opts) {
  opts = opts || {};
  if (!tgt) return;
  const p = tgt.chest();
  if (opts.arc) V().slashArc(scene, p.x, p.y, opts.arc);
  if (opts.burst) V().burst(scene, p.x, p.y, opts.burst, 8);
  V().damageNumber(scene, p.x + (Math.random() - 0.5) * 30, p.y - 20, e.dmg, dmgColor(e));
  tgt.refresh();
  recoil(scene, tgt, e);
  // A painted clip brings its own impact parameters (X.impact, GDD §10.1);
  // placeholder motion keeps the timing table's single hit-stop.
  const im = opts.clip && X.impact && X.impact[opts.clip];
  if (im) {
    if (opts.hitStop) hitStop(scene, im.hitStopMs || TM().hitStop);
    if (im.flash && im.flash.alpha && opts.hitStop) V().flashOverlay(scene, parseInt((im.flash.color || '#ffffff').slice(1), 16), im.flash.alpha);
    const mag = Math.max(opts.shake || 0, opts.hitStop ? (im.shakeAmplitude || 0) : 0);
    if (mag) V().camShake(scene, mag);
    return;
  }
  if (opts.hitStop) hitStop(scene, TM().hitStop);
  if (opts.shake) V().camShake(scene, opts.shake);
}

// Group a step's events by the action they belong to.
function splitEvents(events) {
  const out = { pre: [], use: null, after: [], down: [], end: false, statuses: [] };
  let seenUse = false;
  for (const e of events) {
    if (e.t === 'use' && !seenUse) { out.use = e; seenUse = true; continue; }
    if (e.t === 'end') { out.end = true; continue; }
    if (e.t === 'down') { out.down.push(e); continue; }
    // An execution downs its target without a separate `down` event.
    if (e.t === 'execute') { out.down.push({ t: 'down', uid: e.uid, by: e.by, execute: true }); }
    if (e.t === 'status') { out.statuses.push(e); }
    (seenUse ? out.after : out.pre).push(e);
  }
  return out;
}

// DOT ticks and other round-boundary events (from peek or the tail of a step).
async function playTicks(scene, events) {
  const ticks = events.filter(e => e.t === 'damage' && e.tag === 'dot');
  for (const e of ticks) {
    const tgt = actorOf(scene, e.uid); if (!tgt) continue;
    const kind = e.visual && e.visual.dotKind;
    tgt.pulseBadge(kind);
    const p = tgt.chest();
    V().damageNumber(scene, p.x, p.y - 10, e.dmg, dmgColor(e));
    tgt.refresh();
    if (e.dmg >= tgt.unit.maxHp * 0.08) tgt.flash(kind === 'poison' ? 0x9be79b : 0xff8a80);
  }
  if (ticks.length) await wait(scene, 260);
  for (const e of events) if (e.t === 'heal' && !e.tick) { const t = actorOf(scene, e.uid); if (t) { V().healSparkle(scene, t.x, t.y - t.height * 0.5); t.refresh(); } }
}

const lethalTarget = (g, target) => !!target && g.down.some(d => d.uid === target.uid);

async function cinematic(scene, kind, actor, target, fn) {
  if (scene.__cine > 0 || !X.UI || !X.UI.cinematic) return fn();
  const focus = target ? { x: (actor.x + target.x) / 2, y: actor.y - actor.height * 0.45 } : { x: actor.x + 120 * actor.facing, y: actor.y - actor.height * 0.45 };
  return X.UI.cinematic(scene, kind, focus, fn);
}

async function playDowns(scene, downs, events) {
  // Resolve each death once, sequentially: a paired clip embeds one victim.
  // This also covers off-turn ripostes, DOT kills and additional cleave victims.
  for (const e of downs) {
    const target = actorOf(scene, e.uid);
    if (!target || !target.alive || target._destroyed) continue;
    if (target.__finisherPresented) { await target.play('down_fade'); continue; }
    const source = e.by || [...(events || [])].reverse().find(p => p.uid === e.uid && ['damage', 'execute'].includes(p.t))?.by;
    const killer = actorOf(scene, source) || scene.hero;
    if (target.side === 'b' && killer && killer.side === 'a' && killer.alive && !killer._destroyed) {
      await cinematic(scene, 'kill', killer, target, async () => {
        sfx(scene, 'slash', 'use');
        await killer.play('finisher', { target, lethal: true, level: scene.enc?.run?.levels?.finisher || 1,
          onContact: () => { sfx(scene, 'slash', 'hit'); V().burst(scene, target.chest().x, target.chest().y, 0xd9c2ff, 12); hitStop(scene, TM().hitStop * 2); } });
        // A matching paired finisher already retired its victim. Unpaired art
        // keeps the correct creature visible and uses that creature's own down.
        if (target.alive) await target.play('down_fade');
      });
    } else await target.play('down_fade');
  }
}

// ---------------------------------------------------------------- hero actions
async function heroAction(scene, hero, g, step) {
  const e = g.use;
  const skill = e.skillId;
  const targetOf = ev => actorOf(scene, ev.uid);
  const hits = g.after.filter(x => x.t === 'damage' && x.tag !== 'dot' && x.by === hero.uid);
  const executes = g.after.filter(x => x.t === 'execute' && x.by === hero.uid);
  const level = (scene.enc.run.levels[skill] || 1);

  if (skill === 'katana_slash' || skill === 'basic_attack') {
    const first = hits[0] ? targetOf(hits[0]) : actorOf(scene, e.target);
    const lethal = lethalTarget(g, first);
    const clip = lethal ? 'finisher' : level >= 3 && skill === 'katana_slash' ? 'slash_wide' : 'slash';
    const painted = hero.sheetClipFor ? hero.sheetClipFor(clip, { level, target: first, lethal }) : null;
    sfx(scene, 'slash', 'use');
    await hero.play(clip, { target: first, level, lethal, hold: level >= 2 ? 200 : 140, onContact: () => {
      sfx(scene, 'slash', 'hit');
      hits.forEach((h, i) => deferImpact(scene, i * 70, () => impact(scene, targetOf(h), h, { arc: level >= 2 ? 0xd9c2ff : 0xe8dfc8, hitStop: i === 0, shake: level >= 3 ? 0.004 : 0, clip: painted })));
      if (!hits.length) { const t = first; if (t) { sfx(scene, 'miss', 'miss'); } }
      if (level >= 2 && first) scene.time.delayedCall(90, () => V().slashArc(scene, first.chest().x + 20, first.chest().y - 10, 0xd9c2ff));
    } });
    if (lethal && first.alive) first.__finisherPresented = true;
  } else if (skill === 'god_aura') {
    sfx(scene, 'guard', 'use');
    V().flashOverlay(scene, 0xa66bff, 0.12);
    await hero.play('aura', { level });
    hero.refresh();
    for (const a of scene.actors.values()) if (a.side === 'a' && a.alive) a.refresh();
  } else if (skill === 'counter_attack') {
    sfx(scene, 'guard', 'use');
    await hero.play('stance', { level });
    V().slashArc(scene, hero.x + 50 * hero.facing, hero.y - hero.height * 0.55, 0xe8c86a);
    hero.refresh();
  } else if (skill === 'finisher') {
    const tgt = executes[0] ? targetOf(executes[0]) : (hits[0] ? targetOf(hits[0]) : actorOf(scene, e.target));
    // The cinematic wrapper already owns the camera through recovery. A second
    // zoom tween here would reset it to 1 midway through a slow finisher.
    if (!scene.__cine) V().zoomPunch(scene);
    sfx(scene, 'slash', 'use');
    await hero.play('finisher', { target: tgt, level, lethal: lethalTarget(g, tgt), onContact: () => {
      sfx(scene, 'slash', 'hit');
      V().flashOverlay(scene, 0xffffff, 0.22);
      if (executes[0] && tgt) { V().slashArc(scene, tgt.chest().x, tgt.chest().y, 0xfff4d6); V().burst(scene, tgt.chest().x, tgt.chest().y, 0xd9c2ff, 14); hitStop(scene, TM().hitStop * 2); tgt.unit && tgt.refresh(); }
      for (const h of hits) impact(scene, targetOf(h), h, { arc: 0xfff4d6, hitStop: true, shake: 0.006 });
    } });
    if (lethalTarget(g, tgt) && tgt.alive) tgt.__finisherPresented = true;
    const heal = g.after.find(x => x.t === 'heal' && x.uid === hero.uid);
    if (heal) { V().healSparkle(scene, hero.x, hero.y - hero.height * 0.5); hero.refresh(); }
  } else {
    await kitAction(scene, hero, g);
  }
}

// A picked hero's (or a companion's) skill, read from the skill table: a self
// or party buff is a cast with an aura; a spell or shot is a cast that sends a
// bolt to the target; anything else is the melee lunge. Placeholder choreography.
const ELEMENT_COLOR = { fire: 0xff8f5a, ice: 0x9fe0ff, lightning: 0xfff2a0 };
async function kitAction(scene, actor, g) {
  const e = g.use, sk = (A.DATA.SKILLS || {})[e.skillId] || {};
  const targetOf = ev => actorOf(scene, ev.uid);
  const hits = g.after.filter(x => x.t === 'damage' && x.tag !== 'dot' && x.by === actor.uid);
  const color = ELEMENT_COLOR[sk.element] || (X.skillUi ? X.skillUi(e.skillId).color : 0xe8dfc8);
  const buffs = g.after.filter(x => x.t === 'status' && actorOf(scene, x.uid) && actorOf(scene, x.uid).side === actor.side);
  if (!hits.length && (sk.target === 'self' || sk.target === 'party' || sk.target === 'ally')) {
    sfx(scene, 'heal', 'use');
    await actor.play('cast');
    V().aura(scene, actor.x, actor.y - actor.height * 0.5, color);
    for (const b of buffs) { const t = targetOf(b); if (t && t !== actor) V().aura(scene, t.x, t.y - t.height * 0.5, color); if (t) t.refresh(); }
    actor.refresh();
    return;
  }
  const first = hits[0] ? targetOf(hits[0]) : actorOf(scene, e.target);
  const ranged = sk.elemental || (sk.reach === 'any' && !sk.melee && !sk.katana);
  if (ranged && first) {
    sfx(scene, sk.elemental ? 'magic' : 'projectile', 'use');
    await actor.play('cast');
    const from = actor.chest(), to = first.chest();
    await new Promise(res => {
      const bolt = scene.add.circle(from.x, from.y, sk.elemental ? 12 : 6, color, 0.95).setDepth(650);
      scene.tweens.add({ targets: bolt, x: to.x, y: to.y, duration: 220, ease: 'Power2', onComplete: () => { bolt.destroy(); res(); } });
    });
    sfx(scene, 'slash', 'hit');
    hits.forEach((h, i) => deferImpact(scene, i * 60, () => impact(scene, targetOf(h), h, { burst: color, hitStop: i === 0 })));
    if (sk.elemental) V().burst(scene, to.x, to.y, color, 14);
    await new Promise(res => scene.time.delayedCall(220, res));
    return;
  }
  sfx(scene, 'slash', 'use');
  await actor.play('slash', { target: first, onContact: () => { sfx(scene, 'slash', 'hit'); hits.forEach((h, i) => deferImpact(scene, i * 60, () => impact(scene, targetOf(h), h, { arc: 0xe8dfc8, hitStop: i === 0 }))); } });
}

// ---------------------------------------------------------------- enemy actions
async function enemyAction(scene, foe, g) {
  const kind = foe.kind || 'wolf';
  // The victim is whoever the sim resolved against (Hiro or a companion).
  const victimEv = g.after.find(x => ['damage', 'evade', 'counter'].includes(x.t) && x.tag !== 'dot' && x.by === foe.uid && actorOf(scene, x.uid) && actorOf(scene, x.uid).side === 'a')
    || (g.use && g.use.target ? { uid: g.use.target } : null);
  const hero = (victimEv && actorOf(scene, victimEv.uid)) || scene.hero;
  const onHero = x => x.uid === hero.uid;
  const hit = g.after.find(x => x.t === 'damage' && x.tag !== 'dot' && onHero(x) && x.by === foe.uid);
  const evade = g.after.find(x => x.t === 'evade' && onHero(x));
  const counter = g.after.find(x => x.t === 'counter' && onHero(x));
  const riposte = g.after.find(x => x.t === 'riposte' && x.uid === hero.uid);
  const riposteHit = g.after.find(x => x.t === 'damage' && x.uid === foe.uid && x.by === hero.uid && x.tag !== 'dot');
  const riposteKill = g.after.find(x => x.t === 'execute' && x.uid === foe.uid);
  const poisoned = g.after.some(x => x.t === 'status' && onHero(x) && x.kind === 'poison');

  if (kind === 'human') return humanAction(scene, foe, hero, g, { hit, evade, counter, riposte, riposteHit, riposteKill });
  // Approach: each kind closes the distance its own way.
  if (kind === 'boar') { sfx(scene, 'unarmed', 'use'); await foe.play('charge', { target: hero }); }
  else if (kind === 'plant') { sfx(scene, 'whip', 'use'); await foe.play('lash', { target: hero }); }
  else if (kind === 'boss') { sfx(scene, 'bite', 'use'); await foe.play('pounce', { target: hero }); }
  else { sfx(scene, 'bite', 'use'); await foe.play('leap', { target: hero }); }

  const heavy = kind === 'boar' || kind === 'boss';
  if (counter) {
    // Parry and answer: intercept spark, the attacker lands short, the riposte cut.
    sfx(scene, 'block', 'block');
    await hero.play('intercept', { onContact: () => { const c = hero.contactPoint(foe); V().burst(scene, c.x, c.y - 40, 0xfff2b0, 10); hitStop(scene, TM().hitStop); } });
    if (kind === 'plant') await foe.play('lash_back'); else await foe.play('land_beside');
    if (riposte) {
      sfx(scene, 'slash', 'use');
      await hero.play('riposte', { target: foe, onContact: () => { sfx(scene, 'slash', 'hit'); if (riposteHit) impact(scene, foe, riposteHit, { arc: 0xe8dfc8, hitStop: true }); if (riposteKill) V().burst(scene, foe.chest().x, foe.chest().y, 0xd9c2ff, 12); } });
    }
    if (hit) impact(scene, hero, hit, {});
  } else if (evade) {
    sfx(scene, 'miss', 'miss');
    if (kind === 'plant') await hero.play('roll');
    else await Promise.all([hero.play('roll'), foe.play('overshoot_land', { target: hero })]);
  } else if (hit) {
    if (kind === 'plant') {
      // The briar lands: a quick recoil and the poison badge, no grip.
      sfx(scene, 'whip', 'hit');
      impact(scene, hero, hit, { burst: poisoned ? 0x5cb85c : 0x9ad6a0, hitStop: true });
      await hero.play('hit_short');
      if (poisoned) hero.flash(0x9be79b);
      await foe.play('lash_back');
    } else if (heavy) {
      // Tusks or the Alpha's weight: Hiro is knocked a step back.
      sfx(scene, kind === 'boar' ? 'unarmed' : 'bite', 'hit');
      impact(scene, hero, hit, { burst: 0xc0392b, hitStop: true, shake: 0.006 });
      await Promise.all([hero.play('stagger'), foe.play('bite')]);
      await foe.play('land_tumble');
    } else {
      // Contact: jaws on the boot, grimace, shake-off, wolf tumbles back.
      sfx(scene, 'bite', 'hit');
      impact(scene, hero, hit, { burst: 0xc0392b, hitStop: true, shake: 0.004 });
      const grip = { target: foe, arm: hit.dmg >= hero.unit.maxHp * 0.2 };
      const id = hero.sheetClipFor && hero.sheetClipFor('bite_grip', grip);
      const paired = id && hero.sheet && hero.sheet.clips[id].paired;
      if (paired) {
        await hero.play('bite_grip', grip);
        await foe.play('land_beside');
      } else {
        await Promise.all([hero.play('hit_short'), foe.play('bite')]);
        await foe.play('land_tumble');
      }
    }
  } else {
    // A strike that resolved to nothing visible (guard, immune): land and back off.
    if (kind === 'plant') await foe.play('lash_back'); else await foe.play('land_beside');
  }
  hero.refresh(); foe.refresh();
}

// ---------------------------------------------------------------- companion actions
async function allyAction(scene, ally, g) {
  const e = g.use;
  const targetOf = ev => actorOf(scene, ev.uid);
  const hits = g.after.filter(x => x.t === 'damage' && x.tag !== 'dot' && x.by === ally.uid);
  const heals = g.after.filter(x => x.t === 'heal' && !x.tick && x.by === ally.uid);
  const wards = g.after.filter(x => x.t === 'status' && ['shield', 'ward', 'guard', 'guarded'].includes(x.kind));
  if (heals.length || (!hits.length && /mend|ward|triage|regen|guard/.test(e.skillId || ''))) {
    sfx(scene, 'heal', 'use');
    await ally.play('cast');
    for (const h of heals) { const t = targetOf(h); if (t) { V().healSparkle(scene, t.x, t.y - t.height * 0.5); t.refresh(); } }
    for (const w of wards) { const t = targetOf(w); if (t) V().aura(scene, t.x, t.y - t.height * 0.5, 0x8fd3ff); }
    return;
  }
  const first = hits[0] ? targetOf(hits[0]) : actorOf(scene, e.target);
  const lethal = lethalTarget(g, first);
  sfx(scene, 'slash', 'use');
  await ally.play(lethal ? 'finisher' : 'slash', { target: first, lethal, onContact: () => { sfx(scene, 'slash', 'hit'); hits.forEach((h, i) => deferImpact(scene, i * 60, () => impact(scene, targetOf(h), h, { arc: 0xe8dfc8, hitStop: i === 0 }))); } });
  if (lethal && first.alive) first.__finisherPresented = true;
}

// A human foe: a spell or shot is a cast and a bolt; anything else a lunge.
// The party's answers (evade, parry + riposte) are the same as against a beast.
async function humanAction(scene, foe, hero, g, r) {
  const sk = (A.DATA.SKILLS || {})[g.use && g.use.skillId] || {};
  const ranged = sk.elemental || (sk.reach === 'any' && !sk.melee && !sk.katana && sk.target && sk.target !== 'self');
  const color = ELEMENT_COLOR[sk.element] || 0xe8dfc8;
  const answer = async () => {
    if (r.counter) {
      sfx(scene, 'block', 'block');
      await hero.play('intercept', { onContact: () => { const c = hero.contactPoint(foe); V().burst(scene, c.x, c.y - 40, 0xfff2b0, 10); hitStop(scene, TM().hitStop); } });
      if (r.riposte) { sfx(scene, 'slash', 'use'); await hero.play('riposte', { target: foe, onContact: () => { sfx(scene, 'slash', 'hit'); if (r.riposteHit) impact(scene, foe, r.riposteHit, { arc: 0xe8dfc8, hitStop: true }); if (r.riposteKill) V().burst(scene, foe.chest().x, foe.chest().y, 0xd9c2ff, 12); } }); }
      if (r.hit) impact(scene, hero, r.hit, {});
    } else if (r.evade) { sfx(scene, 'miss', 'miss'); await hero.play('roll'); }
    else if (r.hit) { sfx(scene, 'slash', 'hit'); impact(scene, hero, r.hit, { burst: color, hitStop: true, shake: 0.004 }); await hero.play('hit_short'); }
  };
  if (!r.hit && !r.evade && !r.counter && (sk.target === 'self' || sk.target === 'party')) {
    sfx(scene, 'heal', 'use'); await foe.play('cast'); V().aura(scene, foe.x, foe.y - foe.height * 0.5, color); foe.refresh(); return;
  }
  if (ranged) {
    sfx(scene, sk.elemental ? 'magic' : 'projectile', 'use');
    await foe.play('cast');
    const from = foe.chest(), to = hero.chest();
    await new Promise(res => { const bolt = scene.add.circle(from.x, from.y, sk.elemental ? 12 : 6, color, 0.95).setDepth(650); scene.tweens.add({ targets: bolt, x: to.x, y: to.y, duration: 220, ease: 'Power2', onComplete: () => { bolt.destroy(); res(); } }); });
    await answer();
    return;
  }
  sfx(scene, 'slash', 'use');
  let reply = null;
  await foe.play('slash', { target: hero, onContact: () => { reply = answer(); } });
  if (reply) await reply;
}

// ---------------------------------------------------------------- entry point
Beats.play = async function (scene, step) {
  const g = splitEvents(step.events || []);
  await playTicks(scene, g.pre);
  // Round-boundary downs (a wolf bleeding out) happen before any action.
  const preDowns = g.pre.length ? g.down.filter(d => g.pre.some(p => p.uid === d.uid && p.t === 'damage')) : [];
  if (preDowns.length) await playDowns(scene, preDowns, g.pre);
  if (g.use) {
    const actor = actorOf(scene, g.use.uid);
    const perform = async () => {
      if (actor && actor.alive && !actor._destroyed) {
        if (step.hero) await heroAction(scene, actor, g, step);
        else if (actor.side === 'a') await allyAction(scene, actor, g);
        else await enemyAction(scene, actor, g);
      }
      await finishReactions(scene);
      await playTicks(scene, g.after);
      await playDowns(scene, g.down, step.events);
    };
    const kills = actor && actor.side === 'a' && g.down.some(d => actorOf(scene, d.uid)?.side === 'b');
    const tapped = step.hero && step.choice && step.choice.how === 'request';
    const tgt = actorOf(scene, (kills && g.down.find(d => actorOf(scene, d.uid)?.side === 'b')?.uid) || g.use.target);
    if (actor && (kills || tapped)) await cinematic(scene, kills ? 'kill' : 'cast', actor, tgt, perform);
    else await perform();
  } else if (step.choice && step.choice.action && step.choice.action.kind === 'hold') {
    await wait(scene, 200);
  } else if (!g.pre.length) {
    await wait(scene, 60);
  } else if (g.down.length) {
    await playDowns(scene, g.down, step.events);
  }
  for (const a of scene.actors.values()) if (a.alive) a.refresh();
  // Boss second wind: once, the first time it drops under its threshold.
  for (const a of scene.actors.values()) {
    if (a.alive && a.kind === 'boss' && !a.enraged && a.phase2At && a.unit.chp / a.unit.maxHp < a.phase2At) { await a.play('enrage'); }
  }
  // Extra-turn markers and exposure bursts read as a small flourish only.
  for (const e of step.events) if (e.t === 'exposedBurst') { const t = actorOf(scene, e.uid); if (t) V().burst(scene, t.chest().x, t.chest().y, 0xf4c26b, 6); }
};

Beats.ticksOnly = async function (scene, events) { await playTicks(scene, events); const downs = events.filter(e => e.t === 'down'); if (downs.length) await playDowns(scene, downs, events); };
})();
