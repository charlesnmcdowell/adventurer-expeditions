// JRPG dialogue box (§1a/§17a): portrait + name plate + one line, rendered
// wherever a character speaks. The only place characters exist as people.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;

const DialogueBox = {
  displayScale(scene) {
    const r = scene.game.canvas.getBoundingClientRect();
    return Math.max(.25, Math.min(r.width / T().W, r.height / T().H));
  },
  fontSize(scene, base, cssMinimum = 14) {
    return Math.max(base, Math.ceil(cssMinimum / DialogueBox.displayScale(scene)));
  },
  crisp(text) { return text.setResolution(Math.min(2, globalThis.devicePixelRatio || 1)); },
  // Show a speech line. opts: {band, ctx, onDone}. Returns a closer.
  show(scene, game, speaker, band, ctx, onDone) {
    const r = ADV.util.speakEx(game.world, speaker, band, ctx || {});
    if (!r) { if (onDone) onDone(); return null; }
    // Cut the tutor clip first so an NPC join line can own the voice channel.
    if (ADV.Music && ADV.Music.stopTutorial) ADV.Music.stopTutorial();
    // one personality, one voice — play this exact line's clip (§17a)
    if (ADV.Music && speaker.personalityId) {
      const world = game && game.world;
      ADV.Music.speakFile(speaker.personalityId, r.band, r.idx + 1,
        ADV.Character.voiceTagFor(world, speaker));
    }
    // the raw line still carries its delivery tags — the face reads them (expression pass)
    const raw = (() => { try { const p = ADV.DATA.DIALOGUE[speaker.personalityId]; const arr = p && (p[r.band] || p.general); return arr ? arr[r.idx] : null; } catch (e) { return null; } })();
    const recipient = ctx && ctx.scene === 'funeral' ? 'Remembering ' + (ctx.subjectName || ctx.target || 'the deceased')
      : ctx && ctx.target ? 'To ' + ctx.target : null;
    return DialogueBox.showText(scene, game, speaker, r.text, onDone, { raw, recipient });
  },

  // opts: { raw } — the untrimmed line with [delivery] tags, for reactions
  showText(scene, game, speaker, line, onDone, opts) {
    opts = opts || {};
    const W = T().W, H = T().H;
    const textStyle = { size: DialogueBox.fontSize(scene, 17), wrap: W - 220 };
    const probe = T().text(scene, -800, -800, line || ' ', textStyle);
    // Wrap the finished sentence once; revealing letters must not move words
    // back and forth between lines while the player is trying to read them.
    line = probe.getWrappedText(line || '').join('\n');
    const header = Math.max(30, Math.round(DialogueBox.fontSize(scene, 12, 12) * T().scale()) + 14);
    const bh = Math.max(156, Math.round(header + (probe.height || 24) + T().gap(34)));
    try { probe.destroy(); } catch (e) {}
    const y = H - bh - 12;
    const group = [];
    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(900).setInteractive();
    const panel = scene.add.graphics().setDepth(901);
    panel.fillStyle(0x14110d, 0.96);
    panel.fillRoundedRect(20, y, W - 40, bh, 8);
    panel.lineStyle(2, T().c.gold, 0.85);
    panel.strokeRoundedRect(20, y, W - 40, bh, 8);
    group.push(dim, panel);
    if (opts.caption) {
      const captionY = opts.captionY ?? 150;
      group.push(scene.add.rectangle(W / 2, captionY, W - 100, 110, 0x14110d, 0.96).setDepth(901));
      group.push(DialogueBox.crisp(T().text(scene, W / 2, captionY, opts.caption, { size: DialogueBox.fontSize(scene,17), ox: 0.5, oy: 0.5, wrap: W - 170, align: 'center', color: T().css.ink })).setDepth(902));
    }
    // portrait
    const key = ADV.Portraits.key(scene, speaker);
    const img = scene.add.image(88, y + bh / 2, key).setDisplaySize(96, 122).setDepth(902);
    if (ADV.Portraits.animate) ADV.Portraits.animate(scene, img, speaker, key);
    if (ADV.Portraits.moodFor && game && speaker) {
      const P = ADV.Portraits;
      P.stand(scene, img, game, speaker, key, 'dialogue');
      // delivery tags → a reaction as the line opens; the speaker looks at the player
      const tags = P.tagsIn(opts.raw || line);
      tags.slice(0, 2).forEach((t, i) => scene.time.delayedCall(i * 500, () => P.react(scene, img, speaker, key, t.mood, { ms: 900, intensity: t.intensity })));
      if (/\[(nod|agrees?)\]/i.test(opts.raw || '')) P.motion(scene, img, 'nod');
      if (/\[(shakes head|refus)/i.test(opts.raw || '')) P.motion(scene, img, 'shake');
      if (/\[(curious|questioning)\]/i.test(opts.raw || '')) P.motion(scene, img, 'tilt');
      P.look(scene, img, speaker, key, 0.8, 0.2, 320, true);
      // lip flap on the voice clip (or a word-count fallback when the line is silent)
      const el = ADV.Music && ADV.Music.voiceEl;
      P.lipFlap(scene, img, speaker, key, el && !el.error ? el : null, { words: String(line || '').split(/\s+/).length });
      // skin states the standing mood does not carry
      const sv = ADV.Survival && !speaker.isMonster ? ADV.Survival.state(speaker) : null;
      P.skinState(scene, img, speaker, key, { sick: !!(sv && sv.sick), pale: sv && sv.hunger >= 3 ? 0.6 : 0 });
    }
    const frame = scene.add.graphics().setDepth(903);
    frame.lineStyle(2, T().c.panelEdge, 1);
    frame.strokeRect(40, y + bh / 2 - 61, 96, 122);
    group.push(img, frame);
    // name plate
    const nameBg = scene.add.graphics().setDepth(903);
    nameBg.fillStyle(0x2b261f, 1);
    const nameTxt = DialogueBox.crisp(T().text(scene, 164, y, speaker.name + (speaker.title ? ' · ' + speaker.title : ''), { size: DialogueBox.fontSize(scene,14,12), oy: 0.5, wrap: W-380, color: T().css.gold })).setDepth(904);
    const nameH = Math.max(28,nameTxt.height+10), nameW = Math.max(200,nameTxt.width+28);
    nameBg.fillRoundedRect(150, y - nameH/2, nameW, nameH, 4);
    nameBg.lineStyle(1.5, T().c.gold, 0.8);
    nameBg.strokeRoundedRect(150, y - nameH/2, nameW, nameH, 4);
    group.push(nameBg, nameTxt);
    if (opts.recipient) group.push(DialogueBox.crisp(T().text(scene, W - 48, y + 8, opts.recipient, { size: DialogueBox.fontSize(scene,12,12), ox: 1, color: T().css.inkDim })).setDepth(904));
    // typewriter text
    const txt = DialogueBox.crisp(T().text(scene, 160, y + header, '', textStyle)).setDepth(904);
    group.push(txt);
    let i = Math.min(line.length,opts.revealCount||0), doneTyping = i >= line.length;
    const reveal = () => txt.setText((ADV.Censorship ? ADV.Censorship.text(line) : line).slice(0, i));
    reveal();
    ADV.Censorship?.watch(reveal, txt);
    const timer = doneTyping ? null : scene.time.addEvent({ delay: 14, repeat: line.length - i - 1, callback: () => {
      i++; reveal();
      if (i >= line.length) doneTyping = true;
    } });
    const hint = T().text(scene, W - 44, y + bh - 20, '▼', { size: 13, ox: 0.5, oy: 0.5, color: T().css.inkDim }).setDepth(904);
    scene.tweens.add({ targets: hint, y: hint.y + 4, duration: 420, yoyo: true, repeat: -1 });
    group.push(hint);

    // Keep replay separate from "next": a blocked or late-loading recording
    // can be heard with a direct tap without losing its text or choice.
    const voice = ADV.Music?.voiceEl;
    if (opts.voiceReplay && voice) {
      const scale = DialogueBox.displayScale(scene);
      const bw = Math.max(180, 130 / scale), bheight = Math.max(44, 44 / scale);
      const replay = T().button(scene, W - 40 - bw, y - bheight - 8, bw, bheight, 'Replay voice', () => {
        ADV.Music.replayVoice(voice);
      }, { size: DialogueBox.fontSize(scene, 15), color: T().css.gold });
      for (const part of [replay.g, replay.txt, replay.zone]) { part.setDepth(905); group.push(part); }
    }

    if (ADV.Tooltip) ADV.Tooltip.hide();
    if (ADV.Tutor) ADV.Tutor.clear(scene);
    if (ADV.Notices && ADV.Notices.block) ADV.Notices.block(scene);
    if (!scene.__cutscene && scene.hideChrome) scene.hideChrome();
    let closed = false;
    const close = (dispose = false) => {
      if (closed) return;
      closed = true;
      timer?.remove(false);
      if (!dispose && ADV.Music) ADV.Music.stopVoice();
      scene.tweens.killTweensOf(group);
      for (const g of group) { try { g.destroy(); } catch (e) {} }
      if (ADV.UI && ADV.UI.releaseCard) ADV.UI.releaseCard('dialogue');
      if (!scene.__cutscene && scene.showChrome) scene.showChrome();
      if (ADV.Notices && ADV.Notices.unblock) ADV.Notices.unblock(scene);
      if (!dispose && onDone) onDone();
    };
    if (ADV.UI && ADV.UI.holdCard) ADV.UI.holdCard('dialogue', () => close());
    if (opts.autoAdvance) hint.setVisible(false);
    dim.on('pointerdown', () => {
      if (opts.autoAdvance) return;
      if (!doneTyping) { timer?.remove(false); i = line.length; reveal(); doneTyping = true; }
      else close();
    });
    return { close:()=>close(), dispose:()=>close(true), progress:()=>doneTyping?Infinity:i,
      completeText() { timer?.remove(false); i = line.length; reveal(); doneTyping = true; } };
  },

  choosePersonality(scene, ch, onDone, onCancel) {
    ADV.Notices.custom(scene, (keep, depth, close) => {
      const W = T().W;
      keep(T().text(scene, W / 2, 100, 'How do you speak?', { size: 26, ox: 0.5, color: T().css.gold }).setDepth(depth));
      keep(T().text(scene, W / 2, 141, 'Choose one personality and voice for this life. Remarks are automatic; your decisions stay yours.', { size: 14, ox: 0.5, wrap: 950, align: 'center' }).setDepth(depth));
      const pool = ADV.Conversation.personalityPool(ch.sex);
      let selected = null;
      const sample = keep(T().text(scene, W / 2, 615, 'Select a personality to hear its voice.', { size: 15, ox: 0.5, wrap: 900, align: 'center' }).setDepth(depth));
      pool.forEach((p, i) => {
        const x = 100 + (i % 5) * 218, y = 180 + Math.floor(i / 5) * 66;
        ADV.UI.modalBtn(keep, depth, T().button(scene, x, y, 202, 48, p.name, () => {
          selected = p.id;
          sample.setText(p.name + ' — ' + ADV.util.renderLine(p.general[0], {}));
          ADV.Music.speakFile(p.id, 'general', 1);
        }, { size: 14 }));
      });
      ADV.UI.modalBtn(keep, depth, T().button(scene, W / 2 - 280, 678, 200, 44, 'Back', () => {
        ADV.Music.stopVoice(); close(); if (onCancel) onCancel();
      }, { size: 16 }));
      ADV.UI.modalBtn(keep, depth, T().button(scene, W / 2 - 50, 678, 270, 44, 'Keep this personality', () => {
        if (!selected) return;
        ADV.Conversation.assign(ch, selected);
        ADV.Music.stopVoice(); close(); if (onDone) onDone(ch.personalityId);
      }, { size: 16, color: T().css.gold }));
    }, { x: 60, y: 70, w: 1160, h: 660 });
  },

  playExchange(scene, game, turns, onDone) {
    let stopped = false, open = null, index = 0;
    const shutdown = () => { stopped = true; if (open) open.close(); };
    const detach = () => { if (scene.events) scene.events.off('shutdown', shutdown); };
    if (scene.events) scene.events.once('shutdown', shutdown);
    const done = () => { if (stopped) return; stopped = true; detach(); if (onDone) onDone(); };
    const next = () => {
      if (stopped) return;
      const turn = turns[index++];
      if (!turn) { done(); return; }
      if (turn.speaker.alive === false) { next(); return; }
      ADV.Music.stopTutorial();
      ADV.Music.speakFile(turn.speaker.personalityId, turn.band, turn.idx + 1);
      const listener = turn.ctx.listenerId && ADV.World.byId(game.world, turn.ctx.listenerId);
      open = DialogueBox.showText(scene, game, turn.speaker, turn.text, next,
        { raw: turn.raw, recipient: listener ? 'To ' + listener.name : turn.ctx.scene === 'funeral' ? 'At the grave' : 'To the company' });
    };
    next();
    return { close() { if (stopped) return; stopped = true; detach(); if (open) open.close(); if (onDone) onDone(); } };
  },

  // Build the token context for a speaker addressing the player (§17a)
  ctxFor(game, speaker, extra) {
    if (ADV.Conversation) return ADV.Conversation.context(game, speaker, extra);
    const world = game.world;
    const p = ADV.Game.player(game);
    const partner = speaker.partnerId ? world.characters.find(c => c.id === speaker.partnerId) : null;
    return Object.assign({
      target: p.name,
      partner: partner ? partner.name : null,
      them: extra && extra.themName ? extra.themName : (partner ? partner.name : null),
      score: ADV.Rel.score(world, speaker.id, p.id),
      rand: Math.random(),
    }, extra || {});
  },

  bandFor(game, speaker) {
    const world = game.world;
    const tier = ADV.Rel.tierBetween(world, speaker.id, world.playerId);
    return tier === 'romantic' ? 'romantic' : tier === 'hatred' ? 'hatred' :
           tier === 'friendly' ? 'friendly' : 'general';
  },
};

// Folding/rotating a phone changes the CSS size without changing the game grid.
// Rebuild only this card, keeping its voice, callback and reveal progress intact.
const mountText = DialogueBox.showText;
DialogueBox.showText = function(scene,game,speaker,line,onDone,opts) {
  const audio=ADV.Music?.voiceEl;
  let box,resizeTimer,closed=false,lastScale=DialogueBox.displayScale(scene);
  const unbind=()=>{scene.scale.off('resize',resize);scene.events.off('shutdown',shutdown);resizeTimer?.remove(false);};
  const finish=()=>{if(closed)return;closed=true;unbind();onDone?.();};
  const resize=()=>{
    resizeTimer?.remove(false);
    resizeTimer=scene.time.delayedCall(40,()=>{
      if(closed)return;const scale=DialogueBox.displayScale(scene);if(Math.abs(scale-lastScale)<.001)return;
      lastScale=scale;const revealCount=box.progress();box.dispose();
      box=mountText.call(DialogueBox,scene,game,speaker,line,finish,{...opts,revealCount});
    });
  };
  const shutdown=()=>{if(closed)return;closed=true;unbind();box.dispose();if(audio&&ADV.Music.voiceEl===audio)ADV.Music.stopVoice();};
  box=mountText.call(DialogueBox,scene,game,speaker,line,finish,opts);
  scene.scale.on('resize',resize);scene.events.once('shutdown',shutdown);
  return {close:()=>box.close(),completeText:()=>box.completeText()};
};
ADV.DialogueBox = DialogueBox;
})();
