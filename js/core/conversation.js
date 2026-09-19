// Authored exchanges: explicit participants, asymmetric regard, and event memory.
(function () {
'use strict';
const A = globalThis.ADV;
const Talk = A.Conversation = {};
Talk.personalityPool = sex => Object.values(A.DATA.DIALOGUE).filter(p => !p.hidden && p.id !== 'HIRO' && p.sex === sex);
Talk.assign = function (ch, id) {
  const p = A.DATA.DIALOGUE[id];
  if (!ch || ch.personalityId || !p || p.hidden || p.sex !== ch.sex) return false;
  ch.personalityId = id;
  ch.lastVariantUsed = {};
  ch.dialogueRotation = {};
  return true;
};
Talk.band = function (world, from, to) {
  if (!from || !to) return 'general';
  const tier = A.Rel.tierBetween(world, from.id, to.id);
  return ['friendly', 'hatred', 'romantic'].includes(tier) ? tier : 'general';
};
Talk.context = function (game, speaker, opts) {
  opts = opts || {};
  const world = game.world;
  // Null listener is intentional: group remarks and words addressed to the dead.
  const listener = Object.prototype.hasOwnProperty.call(opts, 'listenerId')
    ? A.World.byId(world, opts.listenerId) : A.Game.player(game);
  const subject = opts.subjectId ? A.World.byId(world, opts.subjectId) : null;
  const partner = speaker.partnerId ? A.World.byId(world, speaker.partnerId) : null;
  return Object.assign({}, opts, {
    listenerId: listener ? listener.id : null,
    target: opts.target != null ? opts.target : listener ? listener.name : '',
    them: opts.subjectName || (subject && subject.name) || opts.them || null,
    partner: opts.partner || (partner && partner.name) || null,
    self: speaker.name,
    score: opts.score != null ? opts.score : listener ? A.Rel.score(world, speaker.id, listener.id) : 0,
    scene: opts.scene || 'social',
  });
};
Talk.remember = function (world, kind, actorId, otherId) {
  if (!actorId || !otherId || actorId === otherId) return;
  const c = A.World.byId(world, otherId);
  if (!c) return;
  c.conversationMemory = c.conversationMemory || [];
  const key = kind + ':' + actorId + ':' + (world.questClock || 0);
  if (c.conversationMemory.some(e => e.key === key)) return;
  c.conversationMemory.push({ key, kind, actorId, at: world.questClock || 0, heard: false });
  c.conversationMemory = c.conversationMemory.slice(-24);
};
Talk.select = function (game, speaker, opts) {
  if (!speaker || speaker.alive === false || !speaker.personalityId) return null;
  const ctx = Talk.context(game, speaker, opts);
  const listener = ctx.listenerId && A.World.byId(game.world, ctx.listenerId);
  let band = ctx.band || Talk.band(game.world, speaker, listener);
  let event = null;
  if (['social', 'return'].includes(ctx.scene) && listener) {
    event = (speaker.conversationMemory || []).find(e => !e.heard && e.actorId === listener.id &&
      (game.world.questClock || 0) - e.at <= 3 && ['revived', 'theft'].includes(e.kind));
    if (event) ctx.event = event.kind;
  }
  if (ctx.scene === 'funeral') band = 'funeral_' + band;
  else if (ctx.event === 'revived') band = 'revived';
  else if (ctx.event === 'theft') band = 'theft';
  else if (ctx.scene === 'departure') band = 'departure';
  else if (ctx.scene === 'return') band = 'return';
  const line = A.util.speakEx(game.world, speaker, band, ctx);
  if (!line) return null;
  if (event) event.heard = true;
  const p = A.DATA.DIALOGUE[speaker.personalityId];
  const family = (p.families && p.families[band] && p.families[band][line.idx]) || null;
  return Object.assign(line, { speaker, ctx, family, raw: p[band][line.idx] });
};
Talk.exchange = function (game, speaker, opts) {
  opts = opts || {};
  const opening = Talk.select(game, speaker, opts);
  if (!opening) return [];
  const out = [opening];
  const listener = opening.ctx.listenerId && A.World.byId(game.world, opening.ctx.listenerId);
  if (opts.noReply || opts.scene === 'funeral' || !opening.family || !listener || listener.id === speaker.id ||
      listener.alive === false || !listener.personalityId || listener.campaignId || listener.personalityId === 'HIRO') return out;
  const p = A.DATA.DIALOGUE[listener.personalityId];
  const regard = Talk.band(game.world, listener, speaker);
  const band = opening.family === 'dismissal' ? 'dismissal_response' : opening.family === 'inquiry' && regard !== 'hatred' ? 'inquiry_response' : regard + '_response';
  const ctx = Talk.context(game, listener, { listenerId: speaker.id, replyTo: opening.family === 'inquiry' && regard === 'hatred' ? 'contact' : opening.family, scene: opening.ctx.scene });
  const line = A.util.speakEx(game.world, listener, band, ctx);
  if (line) out.push(Object.assign(line, { speaker: listener, ctx, raw: p[band][line.idx] }));
  return out;
};
Talk.partyExchange = function (game, scene) {
  const world = game.world;
  const party = A.Party.of(world, A.Game.player(game));
  const roster = party ? A.Party.roster(world, party).filter(c => c.alive && c.personalityId && !c.isMonster && !c.campaignId && c.personalityId !== 'HIRO') : [];
  if (roster.length < 2) return [];
  const leader = A.Party.leader(world, party);
  const candidates = roster.filter(c => c !== leader);
  if (!leader || !candidates.length) return [];
  const speaker = candidates[(world.questClock || 0) % candidates.length];
  return Talk.exchange(game, speaker, { listenerId: leader.id, scene });
};
})();
