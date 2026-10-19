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
  if (X.fx && X.fx.cinematics === false) return;                  // full speed: nothing holds
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

function outcome(scene,target,kind,label){
  if(!target||scene.ended||target._destroyed)return;
  const p=target.chest();
  V().damageNumber(scene,p.x,p.y-45,label,kind==='evade'?'#d7eaf3':'#bce5ff');
  if(kind!=='evade')V().burst(scene,p.x,p.y,0xbce5ff,8);
  sfx(scene,kind==='evade'?'miss':'block',kind==='evade'?'miss':'block');
  trackImpact(scene,target.reactOutcome?target.reactOutcome(kind):target.play('hit_short'));
}

// Resolved defensive events are just as visible as damage. Ward events have
// no `by` field; they belong to the action grouped by splitEvents.
function showDefences(scene,actor,g){
  const targets=new Set([g.use.target]);
  for(const e of g.after)if(['damage','evade','counter','ward','shieldAbsorb','blocked','immune'].includes(e.t)&&(!e.by||e.by===actor.uid))targets.add(e.uid);
  for(const uid of targets){
    const target=actorOf(scene,uid);if(!target||target.side===actor.side)continue;
    const events=g.after.filter(e=>e.uid===uid&&e.tag!=='dot'&&(!e.by||e.by===actor.uid));
    const hit=events.find(e=>e.t==='damage');
    if(events.some(e=>e.t==='execute'))continue;
    if(events.some(e=>e.t==='evade'))outcome(scene,target,'evade','Miss');
    else if(events.some(e=>e.t==='ward'||e.t==='shieldAbsorb'))outcome(scene,target,'guard','Shielded');
    else if(events.some(e=>e.t==='counter'||e.t==='blocked'))outcome(scene,target,'guard','Blocked');
    else if(!hit||hit.dmg<=0)outcome(scene,target,'resist',hit?'0':'Resisted');
  }
  // Reflected/counter damage is not one of Hiro's outgoing hit events.
  for(const e of g.after)if(e.t==='damage'&&e.uid===actor.uid&&e.by!==actor.uid&&e.tag!=='dot'){
    // Say where a passive hit came from: a taunting foe striking back.
    if(e.tag==='retaliation')V().damageNumber(scene,actor.x,actor.y-actor.height*.78,'Struck back','#ffb3a1');
    impact(scene,actor,e,{});
  }
}

// Impact presentation shared by every landed blow.
function impact(scene, tgt, e, opts) {
  opts = opts || {};
  // A beat can outlive its scene when the run is ended from the pause menu
  // (UI.endRun): nothing to flash or shake once the scene is gone.
  if (!tgt || scene.ended || (scene.cameras && !scene.cameras.main)) return;
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
  for(const e of events)if(e.t==='revive'||e.t==='selfRevive'){
    const a=actorOf(scene,e.uid),id=a?.unit?.ch?.expeditionStoryCompanion;
    // An enemy that cheats death (Shadow Rise) stays on the field; if its fall
    // was already shown, bring the body back instead of leaving it invisible.
    if(!id){if(a&&!scene.ended&&!a.alive&&a.unit.chp>0&&!a.unit.downed){a.restoreFromFade();a.refresh(true);}continue;}
    if(scene.ended)continue;
    a.alive=true;a.root.setVisible(true);a.root.setAlpha(1);a.plate.setVisible(true);
    const ix=X.Story.Companions.kits[id].skills.indexOf(e.skillId);
    if(ix>=0){
      V().damageNumber(scene,a.x,a.y-a.height-50,A.DATA.SKILLS[e.skillId]?.name||e.skillId,'#d7eaf3');
      await a.play('cast',{companionClip:'signature-'+(ix+1),target:a,holdRelease:true,
        onWindup:(from,clip)=>X.StoryEffects.charge(scene,e.skillId,a,clip,{companion:true}),
        onRelease:(from,clip)=>X.StoryEffects.play(scene,e.skillId,from,a.chest(),{height:a.height,clip,companion:true,cinematic:true})});
    }
    a.refresh();
  }
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

// A finishing move plays only when the player spent the Finisher on the kill
// (Hiro, round 3): `byFinisher` is true only for the step whose hero action was
// a tapped Finisher request. Every other death — Katana Slash, a counter, a
// riposte, a bleed tick — is an ordinary death with the normal hit-stop.
async function playDowns(scene, downs, events, byFinisher) {
  // Resolve each death once, sequentially: a paired clip embeds one victim.
  // This also covers off-turn ripostes, DOT kills and additional cleave victims.
  for (const e of downs) {
    const target = actorOf(scene, e.uid);
    if (!target || !target.alive || target._destroyed) continue;
    // Shadow Rise (and Demigod) answer the killing blow at once: the engine
    // reports the fall and then the rise. Show a stagger and a burst of smoke,
    // never the death, or the living enemy would vanish from sight (2026-10-17).
    if (target.side === 'b' && target.unit && target.unit.chp > 0 && !target.unit.downed) {
      const rose = (events || []).find(x => (x.t === 'revive' || x.t === 'selfRevive') && x.uid === e.uid);
      await Promise.all([target.play('hit_short'), target.smokePuff()]);
      if (scene.ended || target._destroyed) continue;
      (scene.__smoked ||= new Set()).add(target.uid);
      V().damageNumber(scene, target.x, target.y - target.height * .7, A.DATA.SKILLS[rose?.skillId]?.name || 'Rises again', '#d7eaf3');
      target.refresh();
      continue;
    }
    if (target.unit?.ch?.expeditionStoryCompanion) {
      if(target.unit.chp>0&&!target.unit.downed)continue; // Defiant Stand already restored this ally.
      await target.play('knockout');if(scene.ended||target._destroyed)continue;
      target.alive=false;target.plate.setVisible(false);for(const badge of target.badges.values())badge.setVisible(false);
      await target.tween({alpha:0},250);target.root.setVisible(false);continue;
    }
    if (target.__finisherPresented) { await target.play('down_fade'); continue; }
    const source = e.by || [...(events || [])].reverse().find(p => p.uid === e.uid && ['damage', 'execute'].includes(p.t))?.by;
    const sourceActor = actorOf(scene, source);
    const killer = X.EnemyFinishers?.defeatKiller(scene, sourceActor, target, events) || sourceActor || scene.hero;
    if (byFinisher && target.side === 'b' && killer && killer.side === 'a' && killer.alive && !killer._destroyed) {
      await cinematic(scene, 'kill', killer, target, async () => {
        sfx(scene, 'slash', 'use');
        await killer.play('finisher', { target, lethal: true, level: scene.enc?.run?.levels?.finisher || 1,
          onContact: () => { sfx(scene, 'slash', 'hit'); V().burst(scene, target.chest().x, target.chest().y, 0xd9c2ff, 12); hitStop(scene, TM().hitStop * 2); } });
        // A matching paired finisher already retired its victim. Unpaired art
        // keeps the correct creature visible and uses that creature's own down.
        if (target.alive) await target.play('down_fade');
        else if (X.DefeatFX) X.DefeatFX.play(target);
      });
    } else if (X.EnemyFinishers?.canPlay(scene, killer, target, events)) {
      const shown = await X.EnemyFinishers.play(scene, killer, target);
      if (!shown && !scene.ended && !target._destroyed) await target.play('down_fade');
    } else await target.play('down_fade');
  }
  if(downs.some(e=>actorOf(scene,e.uid)?.side==='b'))await scene.reformFoes?.();
}

// ---------------------------------------------------------------- hero actions
async function heroAction(scene, hero, g, step) {
  const e = g.use;
  const skill = e.skillId;
  const targetOf = ev => actorOf(scene, ev.uid);
  const hits = g.after.filter(x => x.t === 'damage' && x.tag !== 'dot' && x.by === hero.uid);
  const executes = g.after.filter(x => x.t === 'execute' && x.by === hero.uid);
  const level = 1;                               // arcade: one level for every skill

  if (skill === 'katana_slash' || skill === 'basic_attack') {
    const first = hits[0] ? targetOf(hits[0]) : actorOf(scene, e.target);
    // A lethal Katana Slash is a normal kill (GDD §7, Hiro round 3): the ordinary
    // slash, then the victim's own death. The finishing move belongs to the
    // Finisher the player tapped, and to nothing else.
    const clip = 'slash';
    const painted = hero.sheetClipFor ? hero.sheetClipFor(clip, { level, target: first, lethal: false }) : null;
    sfx(scene, 'slash', 'use');
    await hero.play(clip, { target: first, level, lethal: false, hold: 140, onContact: () => {
      sfx(scene, 'slash', 'hit');
      hits.forEach((h, i) => deferImpact(scene, i * 70, () => impact(scene, targetOf(h), h, { arc: 0xe8dfc8, hitStop: i === 0, clip: painted })));
      showDefences(scene,hero,g);
    } });
  } else if (skill === 'god_aura') {
    // Iaido Draw (Hiro, 2026-10-13): one drawn cut through every enemy. Plays
    // the registered sixteen-drawing draw, contact and re-sheathing sequence.
    const first = hits[0] ? targetOf(hits[0]) : actorOf(scene, e.target);
    if (!scene.__cine) V().zoomPunch(scene);
    sfx(scene, 'slash', 'use');
    await hero.play('iaido', { target: first, level, lethal: false, onContact: () => {
      sfx(scene, 'slash', 'hit');
      V().flashOverlay(scene, 0xffffff, 0.18);
      const start=hero.chest(),end=Math.max(start.x+80,...hits.map(h=>targetOf(h)?.chest().x||start.x));
      const streak=scene.add.rectangle((start.x+end)/2,start.y,end-start.x,4,0xfffcf2,.95).setDepth(650).setName('iaido_blade_streak');
      const clear=()=>streak.destroy();scene.events.once('shutdown',clear);
      scene.tweens.add({targets:streak,alpha:0,scaleY:.2,duration:160,onComplete:()=>{scene.events.off('shutdown',clear);clear();}});
      hits.forEach((h, i) => deferImpact(scene, i * 90, () => impact(scene, targetOf(h), h, { arc: 0xfff4d6, hitStop: i === 0, shake: 0.005 })));
      showDefences(scene, hero, g);
    } });
  } else if (skill === 'counter_attack') {
    // No ring or arc around Hiro (Hiro, 2026-10-13); the stance and the badge say it.
    sfx(scene, 'guard', 'use');
    await hero.play('stance', { level });
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
      showDefences(scene,hero,g);
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
    if (actor !== scene.hero) V().aura(scene, actor.x, actor.y - actor.height * 0.5, color);
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
    showDefences(scene,actor,g);
    if (sk.elemental) V().burst(scene, to.x, to.y, color, 14);
    await new Promise(res => scene.time.delayedCall(220, res));
    return;
  }
  sfx(scene, 'slash', 'use');
  await actor.play('slash', { target: first, onContact: () => { sfx(scene, 'slash', 'hit'); hits.forEach((h, i) => deferImpact(scene, i * 60, () => impact(scene, targetOf(h), h, { arc: 0xe8dfc8, hitStop: i === 0 }))); showDefences(scene,actor,g); } });
}

// ---------------------------------------------------------------- enemy actions
async function enemyAction(scene, foe, g) {
  if(scene.story){
    V().damageNumber(scene,foe.x,foe.y-foe.height-65,g.use.name||A.DATA.SKILLS[g.use.skillId]?.name||g.use.skillId,'#f5dca4');
  }
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

  if (kind === 'human' || (X.paintedActorOf && (X.monsterActors || []).includes(X.paintedActorOf(foe)))) return humanAction(scene, foe, hero, g, { hit, evade, counter, riposte, riposteHit, riposteKill });
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
      // The damage, burst and stagger wait for the bite's contact frame.
      let reacting = null;
      const land = () => {
        if (reacting) return;
        sfx(scene, kind === 'boar' ? 'unarmed' : 'bite', 'hit');
        impact(scene, hero, hit, { burst: 0xc0392b, hitStop: true, shake: 0.006 });
        reacting = hero.play('stagger');
      };
      await foe.play('bite', { onContact: land });
      land(); await reacting;
      await foe.play('land_tumble');
    } else {
      // Contact: jaws on the boot, grimace, shake-off, wolf tumbles back.
      const grip = { target: foe, arm: hit.dmg >= hero.unit.maxHp * 0.2 };
      const id = hero.sheetClipFor && hero.sheetClipFor('bite_grip', grip);
      const paired = id && hero.sheet && hero.sheet.clips[id].paired;
      if (paired) {
        // The paired drawing shows the bite itself, so it lands with the clip.
        sfx(scene, 'bite', 'hit');
        impact(scene, hero, hit, { burst: 0xc0392b, hitStop: true, shake: 0.004 });
        await hero.play('bite_grip', grip);
        await foe.play('land_beside');
      } else {
        let reacting = null;
        const land = () => {
          if (reacting) return;
          sfx(scene, 'bite', 'hit');
          impact(scene, hero, hit, { burst: 0xc0392b, hitStop: true, shake: 0.004 });
          reacting = hero.play('hit_short');
        };
        await foe.play('bite', { onContact: land });
        land(); await reacting;
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
  if(ally.unit?.ch?.expeditionStoryCompanion)return storyCompanionAction(scene,ally,g);
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
  // A companion's kill is an ordinary kill: only Hiro's tapped Finisher finishes.
  sfx(scene, 'slash', 'use');
  await ally.play('slash', { target: first, lethal: false, onContact: () => { sfx(scene, 'slash', 'hit'); hits.forEach((h, i) => deferImpact(scene, i * 60, () => impact(scene, targetOf(h), h, { arc: 0xe8dfc8, hitStop: i === 0 }))); } });
}

async function storyCompanionAction(scene,ally,g){
  const id=g.use.skillId,kit=X.Story.Companions.kits[ally.unit.ch.expeditionStoryCompanion],ix=kit.skills.indexOf(id);
  const caster=X.Story.Companions.casters[ally.unit.ch.expeditionStoryCompanion];
  const basicMagic=id==='basic_attack'&&caster;
  const form=X.Story.Companions.formAttack(ally,id);
  const knifeEnding=ally.unit.ch.expeditionStoryCompanion==='fennick'&&id==='whisper_of_ending';
  const companionClip=knifeEnding?'signature-1':form?'form-'+form:basicMagic?caster.clip:caster?.spellClips?.[id]||(ix<0?'attack':'signature-'+(ix+1));
  const entry=ally.unit.ch.actives.find(e=>e.skillId===id)||{skillId:id,level:1};
  const sk=A.SkillSys.manifest(ally.unit.ch,entry).data;
  const hits=g.after.filter(e=>e.t==='damage'&&e.by===ally.uid&&e.tag!=='dot');
  const target=actorOf(scene,g.use.target)||ally;
  const bowBasic=id==='basic_attack'&&/bow/i.test(kit.weapon);
  const effectId=basicMagic?caster.effect:caster?.effects?.[id]||(bowBasic?'aimed_shot':id);
  const ranged=bowBasic||sk.elemental||(sk.reach==='any'&&!sk.melee&&!sk.katana);
  const support=['self','party','ally','deadAlly'].includes(sk.target);
  const soundFamily=support?(/mend|regen|blood_pact/.test(id)?'heal':'guard'):ranged?(sk.elemental?'magic':'projectile'):'slash';
  sfx(scene,soundFamily,'use');
  V().damageNumber(scene,ally.x,ally.y-ally.height-60,form?(form==='bear'?'Bear Swipe':'Eagle Dive'):basicMagic?caster.name:sk.name||id,'#d7eaf3');
  let landed=false;
  const land=()=>{
    if(landed||scene.ended)return;landed=true;
    if(hits.some(e=>e.dmg>0))sfx(scene,soundFamily,'hit');
    for(const e of hits)impact(scene,actorOf(scene,e.uid),e,{arc:0xe8dfc8,hitStop:true});
    for(const e of g.after.filter(e=>e.t==='heal')){const a=actorOf(scene,e.uid);if(a){V().healSparkle(scene,a.x,a.y-a.height*.5);a.refresh();}}
    showDefences(scene,ally,g);
    for(const a of scene.actors.values())a.refresh();
  };
  if(ranged||support){
    let flight=null;
    if(!X.StoryEffects.supports(effectId,{companion:true}))throw Error('Companion effect art not ready: '+effectId);
    await ally.play('cast',{companionClip,target,holdRelease:true,
     onWindup:(from,clip)=>X.StoryEffects.charge(scene,effectId,ally,clip,{companion:true}),onRelease:(from,clip)=>{
      flight=X.StoryEffects.play(scene,effectId,from,target.chest(),{height:ally.height,clip,companion:true,cinematic:!['aimed_shot','kunai_line','suppressing_volley'].includes(effectId)}).then(land);return flight;
    }});if(flight)await flight;
  }else await ally.play('slash',{companionClip,target,
    // Wanjiru keeps her gauntlet strike; its nature magic charges on the fist.
    onWindup:!form&&id==='wither_touch'?(from,clip)=>X.StoryEffects.charge(scene,'thorn_lash',ally,clip,{companion:true}):undefined,
    onContact:()=>{if(form||id==='wither_touch')X.StoryEffects.impact(scene,'thorn_lash',target.chest(),ally.height);
      if(knifeEnding){const p=target.chest();V().slashArc(scene,p.x,p.y,0xbdcf95);}land();}});
}

// A human foe: a spell or shot is a cast and a bolt; anything else a lunge.
// The party's answers (evade, parry + riposte) are the same as against a beast.
// A countered arrow or spell (Hiro, 2026-10-13): knocked off the blade and
// back into the shooter, who takes the bounced damage, before the riposte.
async function deflect(scene, hero, foe, color, back, skillId) {
  const from = hero.contactPoint ? hero.contactPoint(foe) : hero.chest(), to = foe.chest();
  if(X.StoryEffects?.supports(skillId)&&(scene.story||scene.textures?.exists('story_effects_weapons')))await X.StoryEffects.play(scene,skillId,from,to,{height:hero.height,reflected:true});
  else await new Promise(res => {
    const bolt = scene.add.circle(from.x, from.y - 40, 9, color, 0.95).setDepth(650);
    scene.tweens.add({ targets: bolt, x: to.x, y: to.y, duration: 260, ease: 'Quad.In', onComplete: () => { bolt.destroy(); res(); } });
  });
  if (scene.ended || foe._destroyed) return;
  if (back) impact(scene, foe, back, { burst: color, hitStop: true, shake: 0.004 });
  else V().burst(scene, to.x, to.y, color, 10);
}

async function humanAction(scene, foe, hero, g, r) {
  const id=g.use.skillId,entry=foe.unit.ch?.actives?.find(e=>e.skillId===id)||{skillId:id,level:1};
  const sk = (A.SkillSys?.manifest&&foe.unit.ch?A.SkillSys.manifest(foe.unit.ch,entry)?.data:null) || (A.DATA.SKILLS||{})[id] || {};
  const presentation=X.StoryEffects?.enemyAction?.(foe,id,sk)||{};
  const weaponStatus=presentation.weaponStatus;
  const effectId=presentation.effect||id;
  const ranged = presentation.ranged??(!weaponStatus&&(sk.elemental || (sk.reach === 'any' && !sk.melee && !sk.katana && sk.target && sk.target !== 'self')));
  const hasEffects=!!X.StoryEffects?.supports(effectId)&&(!!scene.story||scene.textures?.exists('story_effects_weapons'));
  const color = ELEMENT_COLOR[sk.element] || 0xe8dfc8;
  const answer = async () => {
    if(scene.ended||foe._destroyed||hero._destroyed||scene.actors.get(foe.uid)!==foe)return;
    // A volley or cleave can hit both companions as well as the primary victim.
    // Show every resolved recipient at contact, before any knockout is staged.
    const secondary=[];
    for(const target of scene.actors.values()){
      if(target===hero||target.side===foe.side||!target.alive||target._destroyed)continue;
      const events=g.after.filter(e=>e.uid===target.uid&&e.tag!=='dot'&&(!e.by||e.by===foe.uid));
      const damage=events.filter(e=>e.t==='damage');
      if(events.some(e=>e.t==='evade'))outcome(scene,target,'evade','Miss');
      else if(events.some(e=>['counter','blocked','ward','shieldAbsorb'].includes(e.t)))outcome(scene,target,'guard','Blocked');
      else if(damage.some(e=>e.dmg>0))secondary.push(target.play('hit_short'));
      for(const event of damage)impact(scene,target,event,{burst:color});
      if(damage.length&&!damage.some(e=>e.dmg>0))outcome(scene,target,'resist','0');
    }
    secondary.forEach(work=>trackImpact(scene,work));
    if (r.counter) {
      sfx(scene, 'block', 'block');
      V().damageNumber(scene,hero.x,hero.y-hero.height*.65,'Blocked','#bce5ff');
      let reflected=null;
      await hero.play(ranged ? 'deflect' : 'intercept', { onContact: () => { const c = hero.contactPoint(foe); V().burst(scene, c.x, c.y - 40, 0xfff2b0, 10); hitStop(scene, TM().hitStop);
        if(ranged)reflected=deflect(scene,hero,foe,color,g.after.find(x=>x.t==='damage'&&x.uid===foe.uid&&x.tag==='reflect'),effectId);
      } });
      if(reflected)await reflected;
      if (r.riposte) { sfx(scene, 'slash', 'use'); await hero.play('riposte', { target: foe, onContact: () => { sfx(scene, 'slash', 'hit'); if (r.riposteHit) impact(scene, foe, r.riposteHit, { arc: 0xe8dfc8, hitStop: true }); if (r.riposteKill) V().burst(scene, foe.chest().x, foe.chest().y, 0xd9c2ff, 12); } }); }
      if (r.hit) impact(scene, hero, r.hit, {});
    } else if (r.evade) { sfx(scene, 'miss', 'miss'); V().damageNumber(scene,hero.x,hero.y-hero.height*.6,'Miss','#d7eaf3'); await hero.play('roll'); }
    else if (r.hit) { sfx(scene, 'slash', 'hit'); impact(scene, hero, r.hit, { burst: color, hitStop: true, shake: 0.004 }); await hero.play('hit_short'); }
    else showDefences(scene,foe,g);
  };
  if (!r.hit && !r.evade && !r.counter && ['self','party','ally','deadAlly','allyLane'].includes(sk.target)) {
    // Footwork and weapon guards use their own recovery/guard poses, never
    // the generic healing sparkle. Magical wards take the painted path below.
    const stance=X.StoryEffects?.stanceFor?.(id);
    if(stance){
      sfx(scene,stance==='roll'?'miss':'block','use');
      await foe.play(stance);
      V().damageNumber(scene,foe.x,foe.y-foe.height*.65,sk.name||g.use.name||id,'#c7dded');
      foe.refresh();return;
    }
    if(hasEffects){
      const recipients=[...new Set(g.after.filter(e=>['heal','status','revive'].includes(e.t)).map(e=>actorOf(scene,e.uid)).filter(a=>a?.side===foe.side))];
      if(!recipients.length)recipients.push(foe);
      if(g.use.skillId==='smoke_bomb'){await foe.play('cast');(scene.__smoked||=new Set()).add(foe.uid);await foe.smokePuff();}
      else await foe.play('cast',{target:foe,holdRelease:true,onWindup:(from,clip)=>X.StoryEffects.charge(scene,effectId,foe,clip),
       onRelease:(from,clip)=>Promise.all(recipients.map(a=>X.StoryEffects.play(scene,effectId,from,a.chest(),{height:a.height,clip,cinematic:true})))});
      if(!scene.ended){foe.refresh();if(g.use.skillId==='smoke_bomb')V().damageNumber(scene,foe.x,foe.y-foe.height*.65,'Invisible','#d7eaf3');}return;
    }
    sfx(scene, 'heal', 'use');
    await foe.play('cast',{onRelease:()=>{for(const e of g.after.filter(e=>e.t==='heal'||e.t==='status')){const a=actorOf(scene,e.uid);if(a)V().healSparkle(scene,a.x,a.y-a.height*.5);}}});
    V().aura(scene, foe.x, foe.y - foe.height * 0.5, color); foe.refresh(); return;
  }
  if (ranged) {
    sfx(scene, ['aimed_shot','kunai_line','suppressing_volley'].includes(effectId) ? 'projectile' : 'magic', 'use');
    if(hasEffects){
      let flight=null;
      await foe.play('cast',{target:hero,holdRelease:true,onWindup:(from,clip)=>X.StoryEffects.charge?.(scene,effectId,foe,clip),onRelease:(from,clip)=>{
        flight=X.StoryEffects.play(scene,effectId,from,hero.chest(),{height:foe.height,clip,cinematic:!['aimed_shot','kunai_line','suppressing_volley'].includes(effectId)})
          .then(async()=>{if(!scene.ended)await answer();});
        return flight;
      }});
      if(flight)await flight;
      return;
    }
    await foe.play('cast');
    const from = foe.chest(), to = hero.chest();
    if(hasEffects)await X.StoryEffects.play(scene,effectId,from,to);
    else await new Promise(res => { const bolt = scene.add.circle(from.x, from.y, sk.elemental ? 12 : 6, color, 0.95).setDepth(650); scene.tweens.add({ targets: bolt, x: to.x, y: to.y, duration: 220, ease: 'Power2', onComplete: () => { bolt.destroy(); res(); } }); });
    if(!scene.ended)await answer();
    return;
  }
  sfx(scene, 'slash', 'use');
  let reply = null;
  await foe.play('slash', { target: hero, onContact: () => {
    if(weaponStatus){const at=hero.chest();V().slashArc(scene,at.x,at.y,id==='marked_for_the_knife'?0xff967f:0xffe3a0);hitStop(scene,TM().hitStop);}
    reply = answer(); } });
  if (reply) await reply;
}

// Smoke comes out of whoever slips into hiding this step (Smoke Step, Ghoststep,
// Vanish, an ally's Smoke Bomb), unless their own move already showed it.
async function smokeOnHide(scene, events) {
  const seen = scene.__smoked || new Set(), work = [];
  for (const e of events || []) {
    if (e.t !== 'stealth' || seen.has(e.uid)) continue;
    const a = actorOf(scene, e.uid);seen.add(e.uid);
    if (!a || !a.alive || a._destroyed || !(a.unit.chp > 0) || a.unit.downed) continue;
    work.push(a.smokePuff());V().damageNumber(scene, a.x, a.y - a.height * .65, 'Invisible', '#d7eaf3');
  }
  scene.__smoked = seen;
  if (work.length) { await Promise.all(work); for (const e of events) actorOf(scene, e.uid)?.alive && actorOf(scene, e.uid).refresh(); }
}

// ---------------------------------------------------------------- entry point
Beats.play = async function (scene, step) {
  scene.__smoked = new Set();
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
      await playDowns(scene, g.down, step.events, finisherKill);
      await smokeOnHide(scene, step.events);
      await X.EnemyFinishers?.tryLowHealth(scene, step.events);
    };
    // Cinematic rules (Hiro, round 3): a tapped skill gets the `cast` beat; only
    // a kill made *with the tapped Finisher* gets the heavier `kill` beat and a
    // finishing move. An automatic Katana Slash that happens to kill gets neither.
    // 'cast' is a tap resolved between turns (Enc.castNow, 2026-09-22). Missing
    // it meant a between-turns Finisher never got its `kill` beat, and no cast
    // got the `cast` beat, whenever the Cinematic camera setting is switched on.
    const tapped = step.hero && step.choice && (step.choice.how === 'request' || step.choice.how === 'cast');
    const tappedFinisher = tapped && step.choice.action && step.choice.action.skillId === 'finisher';
    const kills = actor && actor.side === 'a' && g.down.some(d => actorOf(scene, d.uid)?.side === 'b');
    const finisherKill = !!(tappedFinisher && kills);
    const tgt = actorOf(scene, (kills && g.down.find(d => actorOf(scene, d.uid)?.side === 'b')?.uid) || g.use.target);
    if (actor && tapped) await cinematic(scene, finisherKill ? 'kill' : 'cast', actor, tgt, perform);
    else await perform();
  } else if (step.choice && step.choice.action && step.choice.action.kind === 'hold') {
    await wait(scene, 200);
  } else if (g.down.length) {
    await playDowns(scene, g.down, step.events);
    await smokeOnHide(scene, step.events);
  } else if (!g.pre.length) {
    await wait(scene, 60);
  }
  for (const a of scene.actors.values()) if (a.alive) a.refresh();
  // Boss second wind: once, the first time it drops under its threshold.
  for (const a of scene.actors.values()) {
    if (a.alive && a.kind === 'boss' && !a.enraged && a.phase2At && a.unit.chp / a.unit.maxHp < a.phase2At) { a.enraged = true; await a.play('enrage'); }
  }
  // Extra-turn markers and exposure bursts read as a small flourish only.
  for (const e of step.events) if (e.t === 'exposedBurst') { const t = actorOf(scene, e.uid); if (t) V().burst(scene, t.chest().x, t.chest().y, 0xf4c26b, 6); }
};

Beats.ticksOnly = async function (scene, events) { scene.__smoked = new Set(); await playTicks(scene, events); const downs = events.filter(e => e.t === 'down'); if (downs.length) await playDowns(scene, downs, events); await smokeOnHide(scene, events); await X.EnemyFinishers?.tryLowHealth(scene, events); };
})();
