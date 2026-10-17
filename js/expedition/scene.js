// Adventurer: Expeditions — the one scene of the CrazyGames demo.
// Foreground band over a painted plate; the director loop drives
// Encounter.step and hands every step to Beats; the HUD posts requests back.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const W = 1280, H = 760;
const GROUND_Y = 612;
const HERO_X = 450;
const FOE_X = [850, 1000, 1140];
const wait = (scene, t) => new Promise(r => scene.time.delayedCall(t, r));

class ExpeditionScene extends Phaser.Scene {
  // Matter.js (bundled in Phaser) for battlefield props, X.Props. Idle when a location has none.
  constructor() { super({ key: 'Expedition', physics: { matter: { gravity: { y: 1.6 }, enableSleeping: true } } }); }

  init(data) { this.opts = data || {}; }

  preload() {
    this.__needsAlpha = true;
    if (X.Memory) X.Memory.trim(this);
    X.Painted.preload(this);
    X.UI.preloadBusts(this);
    X.DefeatFX.preload(this);
    X.BattleStage.preload(this);
  }

  // The painted sheet descriptor for Actor, or null while the plates stand in.
  hiroSheet() {
    return X.Painted.sheet(this, 'hiro');
  }

  isPortalReady() { return !!this.__presentationReady; }

  // ---------------------------------------------------------------- create
  create() {
    this.__presentationReady = false;
    // The scene object is reused: a fight left mid hit-stop must not freeze
    // the next one's painted animations (bug review 2026-10-11, item 1).
    this.__paintedHitStopCount = 0;
    X.Painted.install(this);
    if (!X.Painted.require(this, X.Painted.needed(this))) return;
    this.actors = new Map();
    this.paused = false; this.time.paused = false;
    this.ended = false;
    this.__enemyFinishPresented = false;
    this.run = this.opts.run || (!this.opts.fresh && X.Run.load()) || X.Run.fresh();
    // Resume at the current quest's wave (pre-fight checkpoint). Anything else starts over.
    if (this.run.done || this.run.phase !== 'quest') this.run = X.Run.reset();
    this.quest = X.Campaign.quest(this.run.questId) || X.quests[0];
    this.encs = X.Campaign.questEncounters(this.quest, this.run);
    if (this.run.wave >= this.encs.length) this.run.wave = 0;
    // The party (world, fielded recruits, relationships) lives for this quest.
    this.world = X.Campaign.buildWorld(this.run);
    this.game_ = this.world.game;
    this.seed = this.opts.seed != null ? this.opts.seed : ((Date.now() % 100000) + 1);
    if (this.opts.seed != null) this.seed = this.opts.seed;

    // The quest's time of day and weather grade the plate (§5: night and storm are data, not art).
    this.phase = this.quest.phase || 'day';
    this.game_.quest = { travel: { weather: X.Campaign.weatherFor(this.quest, this.world, this.phase) } };
    this.buildTextures(); X.UI.installBusts(this);
    this.env = X.BattleStage.paint(this, this.encs[this.run.wave].bg, this.phase);
    if (X.Props) X.Props.spawn(this, this.encs[this.run.wave].bg);
    // The shared painted environment re-resolves ground weather, whose marsh
    // bias can override an explicitly clear quest. Keep the edition's declared
    // sky authoritative without changing the synced website renderer.
    if (A.WeatherFX) {
      if (this.weatherFx && this.weatherFx.destroy) this.weatherFx.destroy();
      A.WeatherFX.attach(this, this.game_.quest.travel.weather, this.phase,
        { x: 0, y: 0, w: W, h: H }, { depth: -5, combat: true });
      this.env.mountWeather?.(this.weatherFx);
    }
    this.buildBand();

    this.buildHero();
    this.hud = new X.Hud(this, {
      run: this.run, hero: this.world.hero, portraitKey: this.hero.faceKey,
      onSkill: id => this.tapSkill(id),
      onArrow: () => this.tapArrow(),
      onPause: () => this.togglePause(),
    });
    this.startMusic();
    X.UI.corner(this);
    X.UI.splitCameras(this);
    this.events.once('shutdown', () => { this.ended = true; });
    X.Painted.present(this, this.env, () => this.startWave(this.run.wave, this.run.wave === 0));
  }

  // One encounter: build its sim, spawn its foes, fight it out.
  startWave(i, first) {
    const allies = this.world.companions;
    const scale = X.Campaign.scaleFor(this.run);
    this.enc = X.Encounter.create({ encounter: this.encs[i], seed: (this.seed * 10 + i) >>> 0, run: this.run, hero: this.world.hero, allies, scale });
    this.hero.unit = X.Encounter.heroUnit(this.enc);
    this.hero.uid = this.hero.unit.uid; this.actors.clear(); this.actors.set(this.hero.uid, this.hero);
    this.hero.refresh(true);
    this.spawnCompanions();
    this.spawnFoes();
    this.hud.setWave(i);
    this.hud.refresh();
    this.hud.setSkillStates(X.Encounter.skillStates(this.enc));
    this.startMusic(this.quest.music);            // one track for the whole quest (§5.1)
    // Recovery runs on a clock now, so the wedge has to be repainted between
    // beats or it would sit still through a long animation and then jump. Ten
    // times a second is enough to read as draining, and it only does the work
    // while something is actually recovering.
    this.cooldownTicker = this.time.addEvent({ delay: 100, loop: true, callback: () => {
      if (this.ended || !this.enc || this.enc.st.over) return;
      const states = X.Encounter.skillStates(this.enc);
      let live = false;
      for (const id of Object.keys(states)) if (states[id] && states[id].leftMs > 0) { live = true; break; }
      if (live || this.__cooldownWasLive) this.hud.setSkillStates(states);
      this.__cooldownWasLive = live;                // one last repaint when it ends
    } });
    this.events.once('shutdown', () => { if (this.cooldownTicker) { this.cooldownTicker.remove(); this.cooldownTicker = null; } });
    this.fight(first);
  }

  buildTextures() { X.UI.ensureHiroTextures(this); }

  buildBand() {
    // No strip and no foliage bar: the painted plate is the whole frame. The
    // actors' shadows alone ground them.
    this.foreground = this.add.container(0, 0).setDepth(700);
  }

  buildHero() {
    // Hiro, always (GDD v0.8 §3): the painted sheet when it loaded, the plates otherwise.
    const a = new X.Actor(this, { uid: 'hero', unit: { chp: 1, maxHp: 1, statuses: [] }, side: 'a', x: HERO_X, y: GROUND_Y, texture: 'xp_hiro', height: 330, name: 'Hiro', level: 1, depth: 106, kind: 'hero', sheet: this.hiroSheet() });
    a.setLevel(X.Encounter.heroLevel(this.run));
    a.faceKey = 'xp_hiro_face';
    this.hero = a;
    this.placeOnGround(a);
  }

  spawnCompanions() {
    for (const a of [...this.actors.values()]) if (a.side === 'a' && a !== this.hero) { a.destroy(); this.actors.delete(a.uid); }
    if (!this.world.companions.length) return;
    const marks = this.companionMarks();
    let i = 0;
    for (const u of this.enc.st.units) {
      if (u.side !== 'a' || u.uid === this.hero.uid) continue;
      const id = u.ch.companionKey;
      const sheet = X.Painted.sheet(this, id);
      if (!sheet || !X.Campaign.recruitReady(id, this)) continue;
      const key = sheet.key;
      const m = marks[i] || marks[marks.length - 1];
      const a = new X.Actor(this, { uid: u.uid, unit: u, side: 'a', x: m.x, y: m.y, texture: key, height: 310, name: u.ch.name, level: 3, depth: m.depth, kind: 'ally', sheet });
      a.setLevel(2 + X.Campaign.loopOf(this.run));
      this.placeOnGround(a);
      this.actors.set(u.uid, a);
      i++;
    }
    this.spreadParty();
  }

  companionMarks() {
    // Separate faces and silhouettes without reducing authored character size.
    // Rear feet sit above the skill buttons; the centre remains an attack lane.
    return [{x:280,y:GROUND_Y-100,depth:98},{x:110,y:GROUND_Y-182,depth:96}];
  }

  perspectiveAt(y) {
    // Ground-depth factors: near 100%, middle 81%, far 65%, multiplied
    // by the common encounter framing (never an individual crowd shrink).
    // Root scaling keeps art, shadows and plates together through all clips.
    return (this.formationScale||1)*Math.max(.60,Math.min(1.08,1+(y-GROUND_Y)*.0019));
  }

  groundProfile() { return [[0,530],[1280,530]]; }
  groundPoint(x,y,actor) {
    const line=this.groundProfile(),radius=Math.min(45,(actor?.height||250)*.12)*this.perspectiveAt(y);
    const floorAt=q=>{
      q=Math.max(0,Math.min(1280,q));
      for(let i=1;i<line.length;i++)if(q<=line[i][0]){
        const [x0,y0]=line[i-1],[x1,y1]=line[i];return y0+(y1-y0)*(q-x0)/(x1-x0);
      }
      return line.at(-1)[1];
    };
    const minY=Math.max(floorAt(x-radius),floorAt(x),floorAt(x+radius));
    return {x,y:Math.max(minY,Math.min(710,Number.isFinite(y)?y:minY)),minY,maxY:710};
  }
  placeOnGround(a) {
    const p=this.groundPoint(a.home.x,a.home.y,a);
    a.home.y=a.groundY=a.root.y=p.y;a.syncPerspective();
  }

  spreadParty() {
    const allies=[...this.actors.values()].filter(a=>a.side==='a').sort((a,b)=>a.home.x-b.home.x);
    let previous=null;
    for(const a of allies){
      if(previous)a.root.x=a.home.x=Math.max(a.home.x,previous.home.x+(a===this.hero?170:155));
      this.placeOnGround(a);previous=a;
    }
    const foes=[...this.actors.values()].filter(a=>a.side==='b');
    this.spaceFoes(foes);
    if(this.foeSlots)this.foeSlots=foes.map(a=>({...a.home})).sort((a,b)=>a.x-b.x);
  }

  spawnFoes() {
    this.formationScale=1;this._formationFramed=false;
    for (const a of [...this.actors.values()]) if (a.side === 'b') { a.destroy(); this.actors.delete(a.uid); }
    const spawned = [];
    let i = 0;
    for (const u of this.enc.st.units) {
      if (u.side === 'a') continue;
      const key = u.ch.expeditionKey || 'dire_wolf';
      const def = X.enemies[key] || {};
      const human = !!u.ch.expeditionHuman;
      // Humans (bandits, the watch, rivals) are the website's composed busts, mirrored to face the party.
      const artId = def.artActor || def.kind;
      const sheet = X.Painted.sheet(this, artId);
      if (!sheet) throw new Error('No complete painted enemy in tutorial: ' + key);
      const texture = sheet.key;
      const a = new X.Actor(this, { uid: u.uid, unit: u, side: 'b', x: FOE_X[i] || FOE_X[FOE_X.length - 1], y: GROUND_Y - 4 + i * 6,
        texture, sheet, height: def.height || 200, name: u.ch.name, level: def.level || u.ch.level || 1, tint: def.tint, depth: 100 + i, kind: def.kind });
      a.phase2At = def.phase2At || 0;
      a.root.x = W + 300 + i * 160;     // enters from the right
      this.actors.set(u.uid, a);
      spawned.push(a);
      i++;
    }
    this.spaceFoes(spawned);
  }

  // Solve idle footprints across the enemy half, rather than clamping each
  // nominal slot independently (which piles wide actors onto the same edge).
  // Large waves share unavoidable overlap evenly and retain size ratios.
  spaceFoes(foes, minimumLeft=735) {
    if (!foes.length) return;
    const left=Math.max(minimumLeft,this.hero?this.hero.home.x+this.idleExtents(this.hero).right+120:735),right=1252;
    foes.forEach((a,i)=>{
      const rank=foes.length===1?0:i/(foes.length-1);
      a.home.y=GROUND_Y-180*rank;
      this.placeOnGround(a);
    });
    if(!this._formationFramed){
      // Fit one common view scale, including Hiro/allies, before the entrance.
      // Keep it for the whole encounter: deaths/finishers never resize actors.
      const ext=foes.map(a=>this.idleExtents(a)),widths=ext.map(b=>b.right-b.left);
      const span=(widths[0]+widths.at(-1))/2+150*(foes.length-1);
      this.formationScale=foes.length>1?Math.max(.65,Math.min(1,(right-left)/span)):1;
      this._formationFramed=true;
      for(const a of this.actors.values())a.syncPerspective();
    }
    // Ground contours alter perspective/width, so converge on their bounds.
    for(let pass=0;pass<12;pass++){
      const bounds=foes.map(a=>this.idleExtents(a));
      const widths=bounds.map(b=>b.right-b.left),total=widths.reduce((a,b)=>a+b,0);
      const gap=foes.length>1?(right-left-total)/(foes.length-1):0;
      let edge=left;
      foes.forEach((a,i)=>{
        a.home.x=foes.length===1?Math.max(left-bounds[i].left,Math.min(1010,right-bounds[i].right)):edge-bounds[i].left;
        this.placeOnGround(a);
        a.root.setDepth(90+a.home.y/100);
        edge+=widths[i]+gap;
      });
    }
  }

  idleExtents(a) {
    const pivot=a.sheet.canvas.pivot.x,scale=a._baseScaleX*this.perspectiveAt(a.home.y);
    const edges=a.sheet.clips.idle.frames.flatMap(id=>{
      const f=this.textures.getFrame(a.sheet.key,id);
      return [(f.x-pivot)*scale,(f.x+f.width-pivot)*scale];
    });
    return {left:Math.min(...edges),right:Math.max(...edges)};
  }

  startMusic(track) {
    const M = A.Music; if (!M) return;
    try { M.init && !M.__inited && (M.__inited = true, M.init()); } catch (e) {}
    try { M.playStory(track || this.quest.music || 'battle_origin'); } catch (e) {}
  }

  // ---------------------------------------------------------------- input handlers
  tapSkill(id) {
    if (this.ended || this.paused) return;
    const r = X.Encounter.requestSkill(this.enc, id);
    if (r.ok) {
      this.hud.flashQueued(id);
      const t = this.run.tutorial; t.used = t.used || {}; t.used[id] = true;
      if (id === 'finisher') t.finisherDone = true;
      X.Run.save(this.run);
      this.hud.releaseGate({ tapped: true, skill: id });
    } else {
      this.hud.shakeIcon(id);
      this.hud.infoChip(id, r.reason === 'cooldown' ? 'Cooldown ' + r.left : r.reason === 'no_target' ? 'No target' : r.reason === 'locked' ? 'Locked' : 'Not now');
    }
  }
  tapFinisher() { this.tapSkill('finisher'); }

  tapArrow() {
    if (!this.arrowArmed) return;
    this.arrowArmed = false;
    this.run.tutorial.arrowDone = true;
    this.hud.releaseGate({ tapped: true });
    this.hud.hideArrow();
    // The road between fights is the travel panorama, party walking, a line of
    // banter — the same beat as the way out (§5.2). The next wave is the checkpoint.
    this.run.wave = this.run.wave + 1; this.run.checkpoint = this.run.wave;
    if (this.hero.unit) X.Encounter.rememberHp(this.run, this.hero.unit);
    this.run.phase = 'travel'; this.run.travelLeg = 'midleg'; X.Run.save(this.run);
    X.UI.resetCamera(this);
    this.scene.start('Travel', { run: this.run, seed: this.seed, leg: 'midleg' });
  }

  togglePause() { if (this.corner) this.corner.togglePause(); }

  // The tutorial (Hiro, 2026-09-28): on the first quest of a run the game holds
  // (nothing steps while the gate is up) and points at an icon:
  //  - Counter Attack the first time it is ready: the first lesson.
  //  - Finisher every time it becomes ready.
  //  - Counter Attack every time Hiro is under half health with it ready.
  //  - God Aura once, the first time it is ready on the boss.
  // A hold happens once per readiness window: a skipped hold does not come
  // back next turn, the skill has to lapse and be ready again. Called before a
  // step and after a swing that opened a window. From the second quest on
  // (the first boss beaten) nothing holds: knowing when is on the player.
  tutoring() { return this.run.questsDone.length === 0 && !(this.run.tutorial && this.run.tutorial.skipGuide); }
  async guideSkillUse() {
    const enc = this.enc, Enc = X.Encounter;
    if (!enc || enc.request || this.ended || !this.tutoring()) return;
    const t = this.run.tutorial; t.used = t.used || {};
    const u = Enc.heroUnit(enc); if (!u || u.downed) return;
    const armed = this.__guideArmed || (this.__guideArmed = {});
    const ready = id => { const st = Enc.skillState(enc, id); return !!(st && st.ready); };
    for (const id of X.tappable) if (!ready(id)) armed[id] = false;
    const low = u.chp / u.maxHp < (X.tutorialLowHp != null ? X.tutorialLowHp : 0.5);
    const want = [];
    if (!t.used.counter_attack) want.push('counter_attack');
    want.push('finisher');
    if (low) want.push('counter_attack');
    // Iaido Draw (the second slot) is taught once, when it can catch two or more enemies.
    if (!t.used.god_aura && A.Combat.living(enc.st, 'b').length >= 2) want.push('god_aura');
    for (const id of want) {
      if (armed[id] || !ready(id)) continue;
      const icon = this.hud.icons[id]; if (!icon || !icon.rect) continue;
      armed[id] = true;
      this.hud._gateFor = 'use:' + id;
      const r = await this.hud.gate(icon.rect, { skippable: true });
      if (this.ended) return;
      if (r && r.skipped && (id === 'god_aura' || !t.used.counter_attack)) { t.used[id] = true; X.Run.save(this.run); }
      break;
    }
  }

  // Fire whatever the player has tapped, as soon as nothing is playing. Called
  // between beats and inside the gap between turns, never in the middle of an
  // animation — Hiro, 2026-09-22: "I don't want it to cancel out a current
  // enemies animation though, so that animation finishes first before the skill
  // takes place, but it happens regardless of turn count". A cast costs nobody
  // a turn: Enc.castNow commits the action without advancing the order.
  async drainCasts() {
    const Enc = X.Encounter, enc = this.enc;
    let fired = 0;
    while (!this.ended && enc.request && !enc.st.over && fired < 4) {
      const before = enc.log.length;
      const cast = Enc.castNow(enc);
      if (!cast) {                                   // not ready yet: say why, keep it queued
        for (const e of enc.log.slice(before)) {
          if (e.t === 'requestWaiting') this.hud.infoChip(e.skillId, e.reason === 'cooldown' ? 'Recovering' : 'Waiting for a target');
          else if (e.t === 'requestDropped' && e.reason !== 'over') this.hud.infoChip(e.skillId, e.reason === 'no_target' ? 'No target left' : 'Not now');
        }
        break;
      }
      fired++;
      this.hud.fired(cast.choice.action.skillId, this.hero.x, this.hero.y - this.hero.height * 0.55);
      this.hud.setQueued(null);
      await X.Beats.play(this, cast);
      if (this.ended) return true;
      this.hud.setSkillStates(Enc.skillStates(enc));
      if (cast.over) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- director
  async fight(first) {
    const enc = this.enc, Enc = X.Encounter;
    // Arcade: nothing to buy before a fight. Every skill is owned, and the
    // first quest teaches them one per fight inside the fight (guideSkillUse).
    await this.intro(first);
    while (!this.ended) {
      const pk = Enc.peek(enc);
      if (pk.events.length) await X.Beats.ticksOnly(this, pk.events);
      if (this.ended) return;
      if (pk.over || enc.st.over) break;
      this.hud.setSkillStates(Enc.skillStates(enc));
      // A tap made during the last animation fires here, before anyone's turn.
      if (enc.request) { await this.drainCasts(); if (this.ended) return; if (enc.st.over) break; }
      await this.guideSkillUse();
      if (this.ended) return;
      const before = enc.log.length;
      const step = Enc.step(enc);
      // Say what happened to a tap that could not fire. Silence here is what
      // made the skills feel unresponsive: the icon glowed, the tap was taken,
      // and then Katana Slash came out with no explanation (Hiro, 2026-09-21).
      for (const e of enc.log.slice(before)) {
        if (e.t === 'requestWaiting') this.hud.infoChip(e.skillId, e.reason === 'cooldown' ? 'Waiting — recovering' : 'Waiting for a target');
        else if (e.t === 'requestDropped' && e.reason !== 'over') this.hud.infoChip(e.skillId, e.reason === 'no_target' ? 'No target left' : 'Not now');
      }
      if (step.hero && step.choice && step.choice.how === 'request') this.hud.fired(step.choice.action.skillId, this.hero.x, this.hero.y - this.hero.height * 0.55);
      if (step.hero && !enc.request) this.hud.setQueued(null);
      await X.Beats.play(this, step);
      if (this.ended) return;                        // the run was ended from the pause menu mid-beat
      this.hud.setSkillStates(Enc.skillStates(enc));
      if (step.over || enc.st.over) break;
      this.storyBanter?.();
      // A beat of air between turns (Hiro, 2026-09-22: "turns are going by too
      // quickly ... lets go with 2s to give me more time to click my skills").
      // It sits after the beats have played and the icons have been refreshed,
      // so it is time to read a truthful HUD and tap, not dead air. A tap that
      // lands during it fires inside the gap rather than waiting for a turn:
      // the wait is sliced so the delay a player feels is a fraction of a second.
      const pause = X.turnPauseMs ? X.turnPauseMs() : 0;
      for (let left = pause; left > 0 && !this.ended && !enc.st.over; left -= 120) {
        await wait(this, Math.min(120, left));
        if (enc.request) { await this.drainCasts(); if (this.ended) return; }
      }
      if (this.ended) return;
      if (enc.st.over) break;
      // Pause the moment a swing first opens Finisher, not only on Hiro's next
      // turn — by then Katana Slash had often already spent the window.
      await this.guideSkillUse();
      if (this.ended) return;
    }
    if (this.ended) return;
    if (Enc.won(enc)) await this.victory(); else await this.defeat();
  }

  async intro(first) {
    // Foes pour in from the right while Hiro plants and draws (a short draw on later waves).
    const foes = [...this.actors.values()].filter(a => a.side === 'b');
    const ambush = !!this.enc.def.ambush;
    const enters = foes.map((a, i) => wait(this, i * (ambush ? 90 : 180)).then(() => a.play('enter', { from: a.root.x, duration: ambush ? 420 : a.kind === 'plant' ? 900 : 720 })));
    if (ambush) {
      // Jumped on the road: a red flash, the rivals pour in fast, the party draws late.
      A.VFX.flashOverlay(this, 0xc0392b, 0.35);
      this.cameras.main.shake(260, 0.006);
      const r = X.Campaign.rival(this.enc.def.rival);
      this.hud.banner('Ambush!  ' + (r ? r.name : ''), 1500);
      await Promise.all([wait(this, 260).then(() => this.hero.play('short_draw')), ...enters]);
      await wait(this, 200);
      return;
    }
    if (!first) { await Promise.all([this.hero.play('short_draw'), ...enters]); await wait(this, 150); return; }
    await wait(this, 120);
    // A slight settle from a low, close framing. The HUD ignores the camera.
    const cam = this.cameras.main;
    cam.setZoom(1.08); cam.centerOn(W / 2 + 30, H / 2 + 40);
    this.tweens.add({ targets: cam, zoom: 1, scrollX: 0, scrollY: 0, duration: X.timing.draw + 400, ease: 'Sine.Out' });
    await Promise.all([this.hero.play('draw'), ...enters]);
    this.hud.banner(this.quest.title, 1200);
    await wait(this, 200);
  }

  async victory() {
    const enc = this.enc;
    X.UI.resetCamera(this);                                                    // the fight ended: zoom/pan home before the payout (round 3 #1)
    // Between fights hostile effects clear; health does NOT recover (Hiro,
    // 2026-09-27: arcade — "maintain their health throughout the entire
    // quest"). The Finisher's heal on a kill and Rest at the inn are the only
    // ways back up. The run remembers the health so the next fight, and a
    // reload, open on it.
    for (const a of this.actors.values()) if (a.side === 'a') { const u = a.unit; u.statuses = []; u.counter = 0; a.refresh(); }
    if (this.hero.unit) { X.Encounter.rememberHp(this.run, this.hero.unit); this.world.hero.combatHp = this.hero.unit.chp; }
    await this.hero.play('victory');
    const award = X.Encounter.award(enc);
    X.Run.save(this.run);
    if (award.points) {
      await new Promise(res => this.hud.payout(this.hero.x, this.hero.y - 200, award.points, res));
    } else this.hud.setScore(this.run.score);
    this.hud.refresh();
    if (this.enc.def.boss) { await this.complete(); return; }
    // Forward.
    this.hud.showArrow();
    this.arrowArmed = true;
    // On the first quest the arrow holds every time, so the beat the player is
    // learning — fight, use the skill, move on — repeats for all three lessons.
    if (this.run.questsDone.length === 0 || !this.run.tutorial.arrowDone) {
      const r = await this.hud.gate(this.hud.arrow.rect, { skippable: false });
      if (this.ended) return;
      if (r && r.skipped) this.tapArrow();
    }
  }

  async defeat() {
    await X.EnemyFinishers?.ensureDefeat(this);
    if (this.ended) return;
    if (!this.__enemyFinishPresented) await this.hero.play('kneel');
    X.UI.resetCamera(this);                                                    // a kill cinematic must not survive into the defeat card (round 3 #1)
    await wait(this, 900);
    // Arcade (Hiro, 2026-09-27): a fall ends the run. No retry, no retreat to
    // the inn — the score is what it is, and the end screen takes it from here.
    this.endRun('defeat');
  }

  // The run is over — Hiro fell, or the player ended it from the pause menu.
  // The run is marked over and saved once, so a reload lands on the end screen
  // rather than back in a fight, and the End scene takes over.
  endRun(why) {
    if (this.ended) return;
    this.ended = true;
    X.UI.resetCamera(this);
    if (this.hero && this.hero.unit) X.Encounter.rememberHp(this.run, this.hero.unit);
    this.run.over = why || 'defeat'; this.run.phase = 'end'; X.Run.save(this.run);
    this.scene.start('End', { run: this.run, seed: this.seed, why: why || 'defeat' });
  }

  // Quest complete: sheathed Hiro, a compact card over the scene, Replay.
  async complete() {
    this.hud.setWave(this.encs.length); this.run.wave = 0;
    if (this.hero.unit) X.Encounter.rememberHp(this.run, this.hero.unit);
    const clear = X.Encounter.awardQuest(this.run);                             // the quest itself pays, on top of its waves, at this loop's rate
    this.run.questsDone.push(this.quest.id);                                   // every clear counts: the loop cycles on it
    this.run.loop = X.Campaign.loopOf(this.run);
    this.run.cycles = this.run.cycles || {}; this.run.cycles[this.quest.id] = (this.run.cycles[this.quest.id] || 0) + 1;
    if (this.world.companions.length) X.Campaign.afterQuest(this.run, true);
    this.run.phase = 'travel'; this.run.travelLeg = 'return';
    X.Run.save(this.run);
    X.UI.resetCamera(this);                                                    // the completion card always draws over an un-zoomed scene (round 3 #1)
    this.hud.setScore(this.run.score, true);
    await wait(this, 400);
    this.hud.completion(this.run, () => { X.UI.resetCamera(this); this.scene.start('Travel', { run: this.run, seed: this.seed, leg: 'return' }); }, { title: this.quest.done || 'Contract done', encounters: this.encs, points: clear.points });
  }

}

X.Scene = ExpeditionScene;
A.ExpeditionScene = ExpeditionScene;
})();
