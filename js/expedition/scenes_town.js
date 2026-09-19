// Adventurer: Expeditions — the inn and the road (GDD v0.8).
// Inn: Hiro at the near table; the recruits along the bar — owned ones bright
// and tappable to field, the rest dimmed with a price. Hiro's skill icons sit
// by his portrait for levelling, the same + badge and chip the tutorial taught.
// One Embark button. Travel: the website's scrolling panorama, graded to the
// quest's time of day with its weather, the party walking, mood banter through
// DialogueBox with the recorded voice — before, between and after the fights.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const T = () => A.T;
const W = 1280, H = 760;
const wait = (scene, t) => new Promise(r => scene.time.delayedCall(t, r));

const ensureHiroTextures = scene => X.UI.ensureHiroTextures(scene);
const bigButton = (...args) => X.UI.bigButton(...args);

// Hiro in a town scene (placeholder plates until the painted bust lands).
function heroImage(scene, x, bottom, height, depth) {
  return scene.add.image(x, bottom, 'xp_hiro').setOrigin(0.5, 1).setScale(height / 780).setDepth(depth);
}
// The scene's weather/phase context, read by BattleArt and the panorama.
function questContext(scene, quest) {
  scene.game_ = scene.game_ || { world: { seed: 1, questClock: 0 } };
  scene.game_.quest = { travel: { weather: X.Campaign.weatherOf(quest) } };
  return quest ? quest.phase || 'day' : 'day';
}

// ================================================================ INN
class InnScene extends Phaser.Scene {
  constructor() { super('Inn'); }
  init(d) { this.opts = d || {}; }
  preload() { this.load.image('xp_hiro_plates', 'assets/anime/v2/runtime/hiro_cyber_20260916.webp'); X.UI.preloadBusts(this); }
  create() {
    this.run = this.opts.run || X.Run.load() || X.Run.fresh();
    this.run.phase = 'inn'; this.run.wave = 0; X.Run.save(this.run);
    this.seed = this.opts.seed != null ? this.opts.seed : ((Date.now() % 100000) + 1);
    ensureHiroTextures(this); X.UI.installBusts(this);
    questContext(this, null);
    A.BattleArt.paint(this, 'tavern', 'day');
    try { A.Music.playStory(X.innMusic); } catch (e) {}
    // Phaser reuses the scene object: clear what the last visit left behind.
    this.ended = false; this.gate = null; this.chipObj = null; this.btn = null; this._gateFor = null; this.busts = {};
    this.paused = false; this.time.paused = false;
    this.events.once('shutdown', () => { this.ended = true; });
    X.UI.corner(this);
    if (A.Portal && A.Portal.active) A.Portal.sync([this]);
    this.build();
  }

  build() {
    const run = this.run;
    this.world = X.Campaign.buildWorld(run);
    heroImage(this, 240, 700, 300, 100);
    this.pill = X.UI.goldPill(this, run.gold);
    // Hiro's skills, for levelling: the combat HUD in inn mode (portrait + icons only).
    this.hud = new X.Hud(this, { run, hero: this.world.hero, portraitKey: 'xp_hiro_face', inn: true,
      onSkill: () => {}, onUpgrade: id => this.buyUpgrade(id), onArrow: () => {}, onPause: () => {} });
    this.hud.refresh();
    // The recruits along the bar.
    X.recruits.forEach((d, i) => this.busts[d.key] = this.bust(d, 470 + i * 118, 600 - (i % 2) * 8));
    this.world.restoreIds();
    // Embark: the next quest in the cycle.
    const q = X.Campaign.quest(X.Campaign.nextQuestId(run));
    this.embarkBtn = bigButton(this, W - 112, H - 110, 200, 100, '⚔', q.title, () => this.embark(), 0xf2c94c);
    this.btn = this.embarkBtn;
    this.refreshBusts();
    this.guide();
  }

  // One recruit at the bar: bust, name, and either a price or the fielded ring.
  bust(d, x, bottom) {
    const ch = X.Campaign.makeRecruit(this.run, d.key);
    const key = A.Portraits.key(this, ch);
    const c = this.add.container(x, bottom).setDepth(90);
    const img = this.add.image(0, 0, key).setOrigin(0.5, 1).setDisplaySize(150, 191);
    const ring = this.add.graphics(); ring.lineStyle(4, 0xffe28a, 1); ring.strokeRoundedRect(-78, -196, 156, 200, 14); ring.setVisible(false);
    const name = T().text(this, 0, 8, d.name, { size: 14, ox: 0.5, oy: 0, color: '#f4eee0', display: true }); name.setStroke('#000000', 4);
    const tag = this.add.container(0, 30);
    const tbg = this.add.graphics(); tbg.fillStyle(0x14110d, 0.9); tbg.fillRoundedRect(-40, -12, 80, 24, 8); tbg.lineStyle(2, 0x9a7a1f, 1); tbg.strokeRoundedRect(-40, -12, 80, 24, 8);
    const coin = this.add.circle(-22, 0, 7, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f);
    const price = T().text(this, 4, 0, '', { size: 13, ox: 0.5, oy: 0.5, color: '#f4eee0', display: true });
    tag.add([tbg, coin, price]);
    const zone = this.add.zone(0, -96, 150, 200).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.tapRecruit(d.key));
    c.add([ring, img, name, tag, zone]);
    Object.assign(c, { key: d.key, img, ring, tag, price, rect: { x: x - 75, y: bottom - 191, w: 150, h: 191 } });
    return c;
  }

  refreshBusts() {
    const run = this.run, cost = X.Campaign.recruitCost(run);
    for (const c of Object.values(this.busts)) {
      const owned = X.Campaign.owns(run, c.key), fielded = X.Campaign.fielded(run, c.key), can = X.Campaign.canBuy(run, c.key);
      c.img.setTint(owned ? 0xffffff : 0x6a6a72).setAlpha(owned ? 1 : 0.85);
      c.ring.setVisible(fielded);
      c.tag.setVisible(!owned); c.price.setText(String(cost)); c.price.setColor(can ? '#f4eee0' : '#d9433b');
      if (can && !c.inviteTween) c.inviteTween = this.tweens.add({ targets: c.tag, scale: 1.1, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      if (!can && c.inviteTween) { c.inviteTween.stop(); c.inviteTween = null; c.tag.setScale(1); }
    }
    this.pill.text.setText(String(run.gold));
    this.hud.setGold(run.gold);
  }

  // Unowned: a confirm chip with the price. Owned: ride along or stay behind.
  tapRecruit(key) {
    const run = this.run, c = this.busts[key];
    if (X.Campaign.owns(run, key)) {
      const r = X.Campaign.toggleField(run, key);
      if (!r.ok) { this.tweens.add({ targets: c, x: c.x + 5, duration: 40, yoyo: true, repeat: 3 }); return; }
      X.Run.save(run); this.refreshBusts();
      this.tweens.add({ targets: c, scale: 1.06, duration: 120, yoyo: true });
      return;
    }
    if (!X.Campaign.canBuy(run, key)) { this.tweens.add({ targets: c, x: c.x + 5, duration: 40, yoyo: true, repeat: 3 }); return; }
    this.openChip(key);
  }
  openChip(key) {
    this.closeChip();
    const c = this.busts[key], d = X.Campaign.recruit(key), cost = X.Campaign.recruitCost(this.run);
    const w = 190, h = 92, x = Math.min(W - w / 2 - 8, Math.max(w / 2 + 8, c.x)), y = c.rect.y - 60;
    const root = this.add.container(x, y).setDepth(X.UI.DEPTH.hud + 2);
    const g = this.add.graphics(); g.fillStyle(0x1c1712, 0.97); g.fillRoundedRect(-w / 2, -h / 2, w, h, 10); g.lineStyle(2, 0xf2c94c, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10); g.fillTriangle(-10, h / 2, 10, h / 2, 0, h / 2 + 10);
    const title = T().text(this, -w / 2 + 12, -h / 2 + 10, d.name + ' · ' + d.title, { size: 13, color: '#e8dfc8', display: true });
    const kit = T().text(this, -w / 2 + 12, -h / 2 + 30, d.actives.map(id => X.skillUi(id).glyph).join(' ') + '  ' + d.classes.join(' / '), { size: 12, color: '#c9c0b0' });
    const coin = this.add.circle(w / 2 - 22, -h / 2 + 18, 9, 0xf2c94c).setStrokeStyle(2, 0x9a7a1f);
    const price = T().text(this, w / 2 - 34, -h / 2 + 18, String(cost), { size: 14, ox: 1, oy: 0.5, color: '#f4eee0', display: true });
    const bw = w - 24, bh = 30;
    const bg = this.add.graphics(); bg.fillStyle(0x62c95a, 1); bg.fillRoundedRect(-bw / 2, 14, bw, bh, 8);
    const check = T().text(this, 0, 14 + bh / 2, '✓', { size: 20, ox: 0.5, oy: 0.5, color: '#0f2d0f', display: true });
    const zone = this.add.zone(0, 14 + bh / 2, bw, bh).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.buyRecruit(key));
    root.add([g, title, kit, coin, price, bg, check, zone]);
    root.setScale(0.6); this.tweens.add({ targets: root, scale: 1, duration: 160, ease: 'Back.Out' });
    this.chipObj = { root, key, confirmRect: { x: x - bw / 2, y: y + 14, w: bw, h: bh } };
    this.__confirmRect = this.chipObj.confirmRect;
    if (this.gate && this._gateFor === 'recruit') this.releaseGate({ opened: key });
    this.time.delayedCall(60, () => this.input.once('pointerdown', p => { if (this.chipObj && this.chipObj.root === root && !zone.getBounds().contains(p.x, p.y)) this.closeChip(); }));
  }
  closeChip() { if (this.chipObj) { this.chipObj.root.destroy(); this.chipObj = null; this.__confirmRect = null; } }
  buyRecruit(key) {
    const r = X.Campaign.buy(this.run, key);
    if (!r.ok) return r;
    X.Run.save(this.run); this.closeChip();
    const c = this.busts[key];
    A.VFX.aura(this, c.x, c.rect.y + 80, 0xf2c94c);
    this.tweens.add({ targets: c, scale: 1.1, duration: 160, yoyo: true });
    this.refreshBusts();
    this.releaseGate({ bought: key });
    return r;
  }
  buyUpgrade(id) {
    const r = X.Encounter.upgrade(this.run, id, this.world.hero);
    if (!r.ok) return r;
    X.Run.save(this.run);
    this.hud.setGold(this.run.gold, true); this.hud.refresh(); this.refreshBusts();
    A.VFX.aura(this, 300, 540, X.skillUi(id).color);
    this.releaseGate({ upgraded: id });
    return r;
  }

  // Guidance, first time each, never choosing for the player: an invitation
  // over every affordable recruit (not one), then the confirm, then Embark.
  async guide() {
    const t = this.run.tutorial, run = this.run;
    const hold = async (rect, tag, opts) => { const g = X.UI.gate(this, rect, Object.assign({ skippable: true }, opts || {})); this.gate = g; this._gateFor = tag; const r = await g.promise; this.gate = null; this._gateFor = null; return r; };
    if (!t.recruitDone && X.recruits.some(d => X.Campaign.canBuy(run, d.key))) {
      const rects = X.recruits.filter(d => X.Campaign.canBuy(run, d.key)).map(d => this.busts[d.key].rect);
      const inv = X.UI.invite(this, rects);
      this.gate = inv; this._gateFor = 'recruit';
      const r = await inv.promise; this.gate = null; this._gateFor = null;
      if (this.ended) return;
      if (r && r.skipped) { t.recruitDone = true; X.Run.save(run); }
      else if (this.chipObj) {
        const r2 = await hold(this.chipObj.confirmRect, 'recruit:buy');
        if (this.ended) return;
        if (r2 && r2.skipped) this.closeChip();
        t.recruitDone = true; X.Run.save(run);
      }
    }
    if (this.ended || run.phase !== 'inn') return;
    // Points, never holds: the bar stays open for a second recruit or a skill first.
    if (!t.embarkDone) { const r = await hold(this.embarkBtn.rect, 'embark', { block: false }); if (r && r.skipped) { t.embarkDone = true; X.Run.save(run); } }
  }
  releaseGate(payload) { if (this.gate && this.gate.release) this.gate.release(payload); }

  embark() {
    if (this.gate && this.gate.clear) { this.gate.clear(); this.gate = null; }
    this.closeChip();
    const run = this.run;
    run.tutorial.embarkDone = true;
    if (!run.field.length) for (const k of run.roster) if (run.field.length < X.party.fieldMax) run.field.push(k);   // nobody rides alone by accident
    run.questId = X.Campaign.nextQuestId(run);
    run.awarded = run.awarded.filter(id => !X.Campaign.questEncounters(run.questId).some(e => e.id === id));   // a fresh contract pays again
    run.phase = 'travel'; run.travelLeg = 'outbound'; run.wave = 0;
    X.Run.save(run);
    this.scene.start('Travel', { run, seed: this.seed + 1, leg: 'outbound' });
  }
}

// ================================================================ TRAVEL
// leg: outbound (inn → first fight), midleg (between fights), return (last fight → inn).
class TravelScene extends Phaser.Scene {
  constructor() { super('Travel'); }
  init(d) { this.opts = d || {}; }
  preload() { this.load.image('xp_hiro_plates', 'assets/anime/v2/runtime/hiro_cyber_20260916.webp'); X.UI.preloadBusts(this); }
  create() {
    this.run = this.opts.run || X.Run.load() || X.Run.fresh();
    this.leg = this.opts.leg || this.run.travelLeg || 'outbound';
    this.seed = this.opts.seed != null ? this.opts.seed : 1;
    this.quest = X.Campaign.quest(this.run.questId) || X.quests[0];
    ensureHiroTextures(this); X.UI.installBusts(this);
    const world = this.world = X.Campaign.buildWorld(this.run);
    this.game_ = world.game;
    const phase = questContext(this, this.quest);
    this.pano = A.TravelPanorama.view(this, this.quest.travel, phase);
    this.pano.setDepth(-10);
    // The quest's weather over the panorama (the battle plates get it from BattleArt).
    try {
      // No groundId: the marsh's rain bias would overrule the quest's declared sky (§5: night-clear marsh, storm ruins).
      const wx = A.Weather.at(world.world, { phase, override: X.Campaign.weatherOf(this.quest) });
      this.pano.weather = A.WeatherFX.attach(this, wx, phase, { x: 0, y: 0, w: W, h: H }, { depth: -5 });
    } catch (e) {}
    try { A.Music.playStory(this.quest.music); } catch (e) {}
    // The walkers, bobbing in step.
    this.walkers = [];
    this.walkers.push(heroImage(this, 560, 690, 300, 100));
    world.companions.forEach((c, i) => {
      const key = A.Portraits.key(this, c);
      this.walkers.push(this.add.image(410 - i * 120, 675 - i * 22, key).setOrigin(0.5, 1).setDisplaySize(180, 229).setDepth(98 - i));
    });
    this.elapsed = 0;
    this.events.on('update', (t, dt) => { this.elapsed += dt; if (this.pano.advance) this.pano.advance(dt, this.moving ? 120 : 0); this.walkers.forEach((w, i) => { w.y = w.__base != null ? w.__base + (this.moving ? Math.sin(this.elapsed / 112 + i * 1.7) * 3.5 : 0) : (w.__base = w.y); }); });
    this.moving = true;
    this.paused = false; this.time.paused = false;
    X.UI.corner(this);
    if (A.Portal && A.Portal.active) A.Portal.sync([this]);
    this.play();
  }
  async play() {
    await wait(this, this.leg === 'midleg' ? 900 : 1400);
    const run = this.run, world = this.world;
    const loc = this.quest.travel;
    if (world.companions.length) {
      const visits = run.visits[loc] || 0;
      const lines = X.Campaign.banter(null, world.world, world.companions, this.leg, loc, { visits, questId: this.quest.id, wave: run.wave });
      if (this.leg === 'outbound') run.visits[loc] = visits + 1;
      X.Run.save(run);
      for (const l of lines) {
        if (!this.scene.isActive()) return;
        await new Promise(res => { const box = A.DialogueBox.show(this, this.game_, l.speaker, l.band, { target: l.to && l.to.name, self: l.speaker.name }, res); if (!box) res(); });
        await wait(this, 250);
      }
    } else {
      // Alone, the road just rolls by for a moment.
      await wait(this, this.leg === 'midleg' ? 900 : 1600);
    }
    await wait(this, 400);
    world.restoreIds();
    X.Run.save(run);
    if (this.leg === 'return') {
      run.phase = 'inn'; X.Run.save(run);
      this.scene.start('Inn', { run, seed: this.seed });
    } else {
      run.phase = 'quest'; X.Run.save(run);          // midleg: run.wave already points at the next fight
      this.scene.start('Expedition', { run, seed: this.seed });
    }
  }
}

// ================================================================ GRAVE (shelved, GDD §18)
// Kept registered so an old save cannot strand; nothing routes here in the loop.
class GraveScene extends Phaser.Scene {
  constructor() { super('Grave'); }
  init(d) { this.opts = d || {}; }
  create() {
    this.run = this.opts.run || X.Run.load() || X.Run.fresh();
    this.run.phase = 'inn'; X.Run.save(this.run);
    this.scene.start('Inn', { run: this.run, seed: this.opts.seed });
  }
}

X.InnScene = InnScene; X.TravelScene = TravelScene; X.GraveScene = GraveScene;
A.ExpeditionInnScene = InnScene; A.ExpeditionTravelScene = TravelScene; A.ExpeditionGraveScene = GraveScene;
X.portalSceneKeys = ['Expedition', 'Travel', 'Inn', 'Grave'];
})();
