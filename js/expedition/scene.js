// Adventurer: Expeditions — the one scene of the CrazyGames demo.
// Foreground band over a painted plate; the director loop drives
// Encounter.step and hands every step to Beats; the HUD posts requests back.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const W = 1280, H = 760;
const GROUND_Y = 612;
const HERO_X = 400;
const FOE_X = [850, 1000, 1140];
const wait = (scene, t) => new Promise(r => scene.time.delayedCall(t, r));

class ExpeditionScene extends Phaser.Scene {
  constructor() { super('Expedition'); }

  init(data) { this.opts = data || {}; }

  preload() {
    this.load.image('xp_hiro_plates', 'assets/anime/v2/runtime/hiro_cyber_20260916.webp');
    this.load.spritesheet('xp_creatures1', 'assets/anime/v2/runtime/creatures_1.webp', { frameWidth: 512, frameHeight: 512 });
    // Astra's painted Hiro (tools/art_intake.py output); ?sheet=0 keeps the plate placeholder.
    if (X.art && X.art.hiroSheet && !/[?&]sheet=0/.test(location.search)) {
      this.load.atlas('xp_hiro_sheet', X.art.hiroAtlas + '.webp', X.art.hiroAtlas + '.json');
      this.load.json('xp_hiro_clips', X.art.hiroAtlas + '.json');
    }
    X.UI.preloadBusts(this);
  }

  // The painted sheet descriptor for Actor, or null while the plates stand in.
  hiroSheet() {
    if (!this.textures.exists('xp_hiro_sheet') || !this.cache.json.exists('xp_hiro_clips')) return null;
    const j = this.cache.json.get('xp_hiro_clips');
    return { key: 'xp_hiro_sheet', clips: j.clips, canvas: j.canvas, standing: j.standing };
  }

  // ---------------------------------------------------------------- create
  create() {
    this.actors = new Map();
    this.paused = false; this.time.paused = false;
    this.ended = false;
    this.run = this.opts.run || (!this.opts.fresh && X.Run.load()) || X.Run.fresh();
    // Resume at the current quest's wave (pre-fight checkpoint). Anything else starts over.
    if (this.run.done || this.run.phase !== 'quest') this.run = X.Run.reset();
    this.quest = X.Campaign.quest(this.run.questId) || X.quests[0];
    this.encs = X.Campaign.questEncounters(this.quest);
    if (this.run.wave >= this.encs.length) this.run.wave = 0;
    // The party (world, fielded recruits, relationships) lives for this quest.
    this.world = X.Campaign.buildWorld(this.run);
    this.game_ = this.world.game;
    this.seed = this.opts.seed != null ? this.opts.seed : ((Date.now() % 100000) + 1);
    if (this.opts.seed != null) this.seed = this.opts.seed;

    // The quest's time of day and weather grade the plate (§5: night and storm are data, not art).
    this.phase = this.quest.phase || 'day';
    this.game_.quest = { travel: { weather: X.Campaign.weatherOf(this.quest) } };
    this.buildTextures(); X.UI.installBusts(this);
    this.env = A.BattleArt.paint(this, this.encs[this.run.wave].bg, this.phase);
    this.buildBand();

    this.buildHero();
    this.hud = new X.Hud(this, {
      run: this.run, hero: this.world.hero, portraitKey: this.hero.faceKey,
      onSkill: id => this.tapSkill(id),
      onUpgrade: id => this.buyUpgrade(id),
      onArrow: () => this.tapArrow(),
      onPause: () => this.togglePause(),
    });
    this.startMusic();
    X.UI.corner(this);
    if (A.Portal && A.Portal.active) A.Portal.sync([this]);
    this.events.once('shutdown', () => { this.ended = true; });
    this.startWave(this.run.wave, this.run.wave === 0);
  }

  // One encounter: build its sim, spawn its foes, fight it out.
  startWave(i, first) {
    const allies = this.world.companions;
    const scale = X.Campaign.scaleFor(this.run, this.quest.id);
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
    this.fight(first);
  }

  buildTextures() {
    if (!this.textures.exists('xp_hiro')) {
      // Placeholder Hiro: the authored head plate over the outfit plate.
      const src = this.textures.get('xp_hiro_plates').getSourceImage();
      const c = document.createElement('canvas'); c.width = 520; c.height = 780;
      const ctx = c.getContext('2d');
      ctx.drawImage(src, 500, 0, 500, 500, 10, 250, 500, 500);          // outfit plate
      ctx.drawImage(src, 0, 0, 500, 500, 100, 0, 320, 320);             // head plate
      // Soften the plate's bottom edge so the bust sits on the band.
      const g = ctx.createLinearGradient(0, 640, 0, 750); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = g; ctx.fillRect(0, 640, 520, 140);
      this.textures.addCanvas('xp_hiro', c);
      const f = document.createElement('canvas'); f.width = 256; f.height = 256;
      f.getContext('2d').drawImage(src, 60, 20, 380, 380, 0, 0, 256, 256);
      this.textures.addCanvas('xp_hiro_face', f);
    }
  }

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
  }

  spawnCompanions() {
    for (const a of [...this.actors.values()]) if (a.side === 'a' && a !== this.hero) { a.destroy(); this.actors.delete(a.uid); }
    if (!this.world.companions.length) return;
    const marks = [{ x: 265, y: GROUND_Y - 34, depth: 98 }, { x: 150, y: GROUND_Y - 60, depth: 96 }];   // behind Hiro, clear of the HUD's icons (x < 230, y > 550)
    let i = 0;
    for (const u of this.enc.st.units) {
      if (u.side !== 'a' || u.uid === this.hero.uid) continue;
      const key = A.Portraits.key(this, u.ch);           // the website's own NPC portrait, as a placeholder bust
      const m = marks[i] || marks[marks.length - 1];
      const a = new X.Actor(this, { uid: u.uid, unit: u, side: 'a', x: m.x, y: m.y, texture: key, height: 240, name: u.ch.name, level: 3, depth: m.depth, kind: 'ally' });
      a.setLevel(3 + X.Campaign.timesCleared(this.run, this.quest.id));
      this.actors.set(u.uid, a);
      i++;
    }
  }

  spawnFoes() {
    for (const a of [...this.actors.values()]) if (a.side === 'b') { a.destroy(); this.actors.delete(a.uid); }
    let i = 0;
    for (const u of this.enc.st.units) {
      if (u.side === 'a') continue;
      const key = u.ch.expeditionKey || 'dire_wolf';
      const def = X.enemies[key] || {};
      const human = !!u.ch.expeditionHuman;
      // Humans (bandits, the watch, rivals) are the website's composed busts, mirrored to face the party.
      const texture = human ? A.Portraits.key(this, u.ch) : 'xp_creatures1';
      const a = new X.Actor(this, { uid: u.uid, unit: u, side: 'b', x: FOE_X[i] || FOE_X[FOE_X.length - 1], y: GROUND_Y - 4 + i * 6,
        texture, frame: human ? undefined : (def.frame || 0), flipX: human, height: def.height || (human ? 245 : 250), name: u.ch.name, level: def.level || u.ch.level || 1, tint: def.tint, depth: 100 + i, kind: human ? 'human' : (def.kind || 'wolf') });
      a.phase2At = def.phase2At || 0;
      a.root.x = W + 300 + i * 160;     // enters from the right
      this.actors.set(u.uid, a);
      i++;
    }
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
      if (id === 'finisher') { this.run.tutorial.finisherDone = true; X.Run.save(this.run); }
      this.hud.releaseGate({ tapped: true, skill: id });
    } else {
      this.hud.shakeIcon(id);
      this.hud.infoChip(id, r.reason === 'cooldown' ? 'Cooldown ' + r.left : r.reason === 'no_target' ? 'No target' : r.reason === 'locked' ? 'Locked' : 'Not now');
    }
  }
  tapFinisher() { this.tapSkill('finisher'); }

  buyUpgrade(id) {
    const r = X.Encounter.upgrade(this.run, id, this.world.hero);
    if (!r.ok) return r;
    X.Run.save(this.run);
    this.hud.setGold(this.run.gold, true);
    this.hud.refresh();
    this.hero.setLevel(X.Encounter.heroLevel(this.run));
    A.VFX.aura(this, this.hero.x, this.hero.y - this.hero.height * 0.5, X.SKILL_UI[id].color);
    this.hero.flash(0xffffff);
    this.hud.setSkillStates(X.Encounter.skillStates(this.enc));
    this.hud.releaseGate({ tapped: true, upgraded: id });
    return r;
  }

  tapArrow() {
    if (!this.arrowArmed) return;
    this.arrowArmed = false;
    this.run.tutorial.arrowDone = true;
    this.hud.releaseGate({ tapped: true });
    this.hud.hideArrow();
    // The road between fights is the travel panorama, party walking, a line of
    // banter — the same beat as the way out (§5.2). The next wave is the checkpoint.
    this.run.wave = this.run.wave + 1; this.run.checkpoint = this.run.wave;
    this.run.phase = 'travel'; this.run.travelLeg = 'midleg'; X.Run.save(this.run);
    this.scene.start('Travel', { run: this.run, seed: this.seed, leg: 'midleg' });
  }

  togglePause() { if (this.corner) this.corner.togglePause(); }

  // ---------------------------------------------------------------- director
  async fight(first) {
    const enc = this.enc, Enc = X.Encounter;
    await this.intro(first);
    while (!this.ended) {
      const pk = Enc.peek(enc);
      if (pk.events.length) await X.Beats.ticksOnly(this, pk.events);
      if (pk.over) break;
      const fs = Enc.finisherState(enc);
      this.hud.setSkillStates(Enc.skillStates(enc));
      // First Finisher window: hold and point at the portrait until it is tapped (or skipped).
      if (pk.hero && fs.ready && !this.run.tutorial.finisherDone && !enc.request) {
        const r = await this.hud.gate(this.hud.icons.finisher.rect, { skippable: true });
        if (r && r.skipped) { this.run.tutorial.finisherDone = true; X.Run.save(this.run); }
        if (this.ended) return;
      }
      const step = Enc.step(enc);
      if (step.hero && step.choice && step.choice.how === 'request') this.hud.fired(step.choice.action.skillId, this.hero.x, this.hero.y - this.hero.height * 0.55);
      if (step.hero && !enc.request) this.hud.setQueued(null);
      await X.Beats.play(this, step);
      this.hud.setSkillStates(Enc.skillStates(enc));
      if (step.over) break;
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
    // Between fights hostile effects clear and Hiro recovers (GDD §11).
    for (const a of this.actors.values()) if (a.side === 'a') { const u = a.unit; u.statuses = []; u.counter = 0; u.downed = false; u.chp = u.maxHp; a.alive = true; a.root.setVisible(true); a.img.setAlpha(1); a.plate.setVisible(true); a.refresh(); }
    await this.hero.play('victory');
    const award = X.Encounter.award(enc);
    X.Run.save(this.run);
    if (award.gold) {
      await new Promise(res => this.hud.payout(this.hero.x, this.hero.y - 200, award.gold, res));
    } else this.hud.setGold(this.run.gold);
    this.hud.refresh();
    // Guided purchases: after each of the first three payouts the hand shows the
    // next affordable buy (a locked skill first, then a level), skippable.
    await this.guidePurchase();
    this.hud.closeChip();
    if (this.enc.def.boss) { await this.complete(); return; }
    // Forward.
    this.hud.showArrow();
    this.arrowArmed = true;
    if (!this.run.tutorial.arrowDone) {
      const r = await this.hud.gate(this.hud.arrow.rect, { skippable: false });
      if (this.ended) return;
      if (r && r.skipped) this.tapArrow();
    }
  }

  // The next thing worth buying: an unowned skill in the recommended order, else the
  // cheapest level-up. Holds on it, then on the chip's confirm. Three guided buys total.
  async guidePurchase() {
    const t = this.run.tutorial; t.purchases = t.purchases || 0;
    if (this.run.hero || t.purchases >= 3 || t.skipGuide) return;     // a picked hero shops at the inn
    const Enc = X.Encounter, run = this.run;
    const order = ['finisher', 'god_aura', 'counter_attack'];
    const pick = order.find(id => !Enc.owned(run, id) && Enc.canUpgrade(run, id)) || order.filter(id => Enc.canUpgrade(run, id)).sort((a, b) => Enc.upgradeCost(run, a) - Enc.upgradeCost(run, b))[0];
    if (!pick) return;
    const icon = this.hud.icons[pick];
    const r1 = await this.hud.gateUntilChip(icon);
    if (this.ended) return;
    if (r1 && r1.skipped) { t.skipGuide = true; X.Run.save(run); return; }
    if (!this.hud.chip) return;
    const r2 = await this.hud.gate(this.hud.chip.confirmRect, { skippable: true });
    if (this.ended) return;
    if (r2 && r2.skipped) { t.skipGuide = true; this.hud.closeChip(); X.Run.save(run); return; }
    t.purchases++; X.Run.save(run);
  }

  async defeat() {
    await this.hero.play('kneel');
    await wait(this, 900);
    // Retry the same fight with the same purchases and a new seed. No story, no
    // grave (GDD v0.8 §18): losing costs time, never progress. The tutorial road
    // simply goes again; a loop quest also offers the inn, keeping the gold from
    // the fights already won, so a party that came under-manned is never stuck.
    if (this.quest.tutorial) {
      this.hud.banner('Again', 1200);
      await wait(this, 700);
      this.scene.restart({ seed: this.seed + 1 });
      return;
    }
    const won = this.encs.slice(0, this.run.wave).reduce((n, e) => n + (this.run.awarded.includes(e.id) ? e.gold : 0), 0);
    this.hud.defeatCard({ title: this.world.companions.length ? 'The party falls back' : 'Down', sub: won ? 'Gold kept: ' + won : 'Nothing lost but time' },
      () => this.scene.restart({ seed: this.seed + 1 }),
      () => { this.run.phase = 'travel'; this.run.travelLeg = 'return'; this.run.wave = 0; X.Run.save(this.run); this.scene.start('Travel', { run: this.run, seed: this.seed, leg: 'return' }); });
  }

  // Quest complete: sheathed Hiro, a compact card over the scene, Replay.
  async complete() {
    this.hud.setWave(this.encs.length); this.run.wave = 0;
    this.run.questsDone.push(this.quest.id);                                   // every clear counts: the loop cycles on it
    this.run.cycles = this.run.cycles || {}; this.run.cycles[this.quest.id] = (this.run.cycles[this.quest.id] || 0) + 1;
    if (this.world.companions.length) X.Campaign.afterQuest(this.run, true);
    this.run.phase = 'travel'; this.run.travelLeg = 'return';
    X.Run.save(this.run);
    await wait(this, 400);
    this.hud.completion(this.run, () => this.scene.start('Travel', { run: this.run, seed: this.seed, leg: 'return' }), { title: this.quest.done || 'Contract done', encounters: this.encs });
  }

}

X.Scene = ExpeditionScene;
A.ExpeditionScene = ExpeditionScene;
})();
