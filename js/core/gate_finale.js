// Resolved encounter history and the two-stage Gate finale. No world NPCs are mutated.
(function () {
'use strict';
const A = ADV, C = A.Campaign3, W = 'wren_ward';
const F = A.GateFinale = {};
F.state = game => {
 const s = C.state(game);
 return s.finale || (s.finale = { version: 1, outcomes: {}, soulTaken: false, realmWon: false });
};
const isFinal = game => game.quest?.quest?.campaign3 && game.quest.quest.n === 14;
const B = (who, key, more = {}) => ({ who, key, c3: true, fid: 'gate', ...more });

// Store actual resolution, not the hostile dialogue option preceding it. Named
// fixtures with campaignExit withdraw at zero HP; they are not combat deaths.
F.record = function (game, index, mode, units = []) {
 const q = game.quest?.quest; if (!q?.campaign3) return;
 const f = F.state(game), actors = {};
 for (const u of units.filter(u => u.side === 'b' && u.ch?.campaignId)) {
  actors[u.ch.campaignId] = u.fled || u.ch.campaignExit ? 'withdrew' : u.downed ? 'killed' : 'survived';
 }
 f.outcomes[q.n + ':' + index] = { mode, actors };
 if (q.n === 13 && index === 1) {
  const killed = mode === 'combat' && actors.amara === 'killed';
  C.setFlag(game, 'amaraDead', killed);
  if (killed) C.kill(game, 'amara');
  else if (mode === 'bypass') C.setFlag(game, 'amaraPassed', true);
 }
 C.save(game);
};
F.history = function (game) {
 const s = C.state(game), o = F.state(game).outcomes, keys = [];
 let mercies = 0, avoidable = 0;
 const add = key => keys.push('q14_final_' + key);
 if (o['13:1']?.actors.amara === 'killed') { add('amara_dead'); avoidable++; }
 else if (C.inCompany(game, 'amara')) { add('amara_here'); mercies++; }
 else if (C.isAlive(game, 'amara') && (o['13:1']?.mode === 'bypass' || C.flag(game, 'amaraPassed'))) { add('amara_spared'); mercies++; }
 const folake = F.state(game).folake;
 if (folake === 'kill') { add('folake_dead'); avoidable++; }
 else if (folake === 'arrest') { add('folake_arrested'); mercies++; }
 else if (folake === 'deal') add('folake_bargain');
 if (C.flag(game, 'floodedEarly')) { add('flood'); avoidable++; }
 else if (s.stage >= 7 && C.flag(game, 'waitedForDorran') && !s.dead.includes('dorran')) { add('rescue'); mercies++; }
 if (o['4:3']?.actors.grukhar === 'killed') { add('grukhar_dead'); avoidable++; }
 else if (C.flag(game, 'grukharSpared') || o['4:3']?.mode === 'bypass') { add('grukhar_spared'); mercies++; }
 if (C.flag(game, 'druidsPeace') || o['6:1']?.mode === 'bypass') { add('grove_peace'); mercies++; }
 else if (o['6:1']?.actors.thornwise === 'withdrew') add('grove_retreat');
 if (s.stage >= 13 || o['13:4']) add('segun');
 C.setFlag(game, 'finaleMercyKnown', mercies > 0);
 // Three concrete examples at most. The conclusion is a contested claim, never
 // a hidden god-power reward for ordinary kills or a judgement of self-defence.
 const beats = keys.slice(0, 3).map(key => B('korvath', key));
 if (avoidable >= 2) beats.push(B('korvath', 'q14_final_accuse', { choice: 'q14_final_history' }));
 else if (mercies >= 2) beats.push(B('korvath', 'q14_final_mercy', { choice: 'q14_final_history' }));
 return beats;
};
F.captureSister = function (game) {
 const f = F.state(game), s = C.state(game);
 if (!f.sister) f.sister = { state: s.dead.includes(W) ? 'dead' : C.inCompany(game, W) ? 'company' : C.isRecruited(game, W) ? 'inn' : 'absent', seat: s.company.indexOf(W) };
 return f.sister;
};
F.takeSoul = function (game) {
 const f = F.state(game); if (f.soulTaken) return;
 F.captureSister(game); f.soulTaken = true;
 C.kill(game, W);
 // A quest keeps a roster snapshot in addition to the campaign's seated IDs.
 if (game.quest?.campaignAllies) game.quest.campaignAllies = game.quest.campaignAllies.filter(ch => ch.campaignId !== W);
 C.save(game);
};

const applyBeat = C.applyBeat;
C.applyBeat = function (game, beat) {
 const out = applyBeat(game, beat);
 const folake = {q9_lysandra_kill:'kill',q9_lysandra_arrest:'arrest',q9_lysandra_deal:'deal'}[beat.key];
 if (beat.who === 'lysandra' && folake) F.state(game).folake = folake;
 if (beat.key === 'q14_final_rescue_truth') C.setFlag(game, 'finaleRescueKnown', true);
 if (beat.finaleEvent === 'takeSoul') F.takeSoul(game);
 C.save(game); return out;
};
const replyBeat = C.replyBeat;
C.replyBeat = function (reply, speaker, game, opt, choiceId) {
 const beat = replyBeat(reply, speaker, game, opt, choiceId);
 if (beat && opt?.menu) beat.choice = opt.menu;
 if (beat?.key === 'q14_final_trap') {
  if (C.flag(game, 'leadersKilled')) beat.key += '_killed';
  else if (C.flag(game, 'leadersSpared')) beat.key += '_spared';
 }
 return beat;
};
const bypass = C.bypassEncounter;
C.bypassEncounter = function (game) {
 if (isFinal(game) && game.quest.encIdx >= 2) return false;
 const index = game.quest?.encIdx, result = bypass(game);
 if (result) F.record(game, index, 'bypass');
 return result;
};
const combatFinished = C.combatFinished;
C.combatFinished = function (game, result, context = {}) {
 if (result?.won && Number.isInteger(context.encIdx)) {
  F.record(game, context.encIdx, 'combat', context.units);
  if (isFinal(game) && context.encIdx === 3) { F.state(game).realmWon = true; C.save(game); }
 }
 return combatFinished(game, result, context);
};
const verbFinished = C.verbFinished;
C.verbFinished = function (game, result, context) {
 if (result?.success && result.mode === 'bypass') F.record(game, context.encIdx, 'bypass');
 return verbFinished(game, result, context);
};

const openerBeats = C.openerBeats;
C.openerBeats = function (game, quest, index) {
 if (quest.n !== 14 || C.state(game).ending) return openerBeats(game, quest, index);
 if (index === 2) {
  const sister = F.captureSister(game), beats = openerBeats(game, quest, index);
  const at = beats.findIndex(b => b.key === 'q14_final_reports');
  beats.splice(at + 1, 0, ...F.history(game));
  if (sister.state !== 'company') {
   const key = { inn: 'abducted', absent: 'absent', dead: 'dead_sister' }[sister.state];
   const at = beats.findIndex(b => b.key === 'q14_final_hiwot');
   beats.splice(at + 1, 0, B('korvath', 'q14_final_' + key, { caption: sister.state === 'dead' ? 'Pale light gathers beneath a sealed rune on the altar.' : 'Beyond the guards, Hiwot is bound inside the altar rail. You must break through to her.' }));
  }
  return beats;
 }
 if (index !== 3) return openerBeats(game, quest, index);
 const f = F.state(game), sister = F.captureSister(game), beats = [];
 if (!f.soulTaken) {
  beats.push(B('korvath', 'q14_final_ritual', { artLocation: 'temple', ...(sister.state === 'dead' ? { finaleEvent: 'takeSoul' } : {}), caption: 'Kolade falls against the altar. With his bleeding hand, he completes the last mark in the rite.' }));
  if (sister.state !== 'dead') {
   beats.push(B(W, 'q14_final_warning', { force: true, artLocation: 'temple' }));
   beats.push(B(W, 'q14_final_taken', { force: true, death: true, finaleEvent: 'takeSoul', artLocation: 'temple', caption: 'The circle flares before you can reach Hiwot. Kolade draws her soul into the altar. She falls, and a breach opens behind him.' }));
  }
  beats.push(B('korvath', 'q14_final_crossing', { artLocation: 'temple', caption: 'Kolade vanishes through the breach. Hiwot’s soul is still bound to him. You follow before the passage closes.' }));
 }
 beats.push(B('korvath', 'q14_final_realm', { artLocation: 'morrak_realm', caption: f.soulTaken ? 'The breach remains open. You return to Morrak’s realm to free Hiwot.' : 'You step onto a broken platform above an abyss. Kolade stands before the empty throne, still drawing power into himself.' }));
 beats.push(B(W, 'q14_final_soul', { force: true, artLocation: 'morrak_realm' }));
 return beats;
};

// Completed legacy endings stay completed. An unfinished old Q14 gains the
// realm encounter without discarding victories or making the player pay again.
F.upgradeQuest = function (game) {
 if (!isFinal(game) || C.state(game).ending) return;
 const q = game.quest;
 if (q.quest.finaleVersion === 1) return;
 const fresh = C.buildQuest(game, 14);
 q.quest.cEnc = fresh.cEnc; q.quest.encounters = fresh.encounters; q.quest.finaleVersion = 1;
 if (q.encIdx >= 2) {
  q.readyToComplete = false; q.__c3closed = false; q.closingBeats = [];
  q.__c3openerFor = null;
  q.openerShownIdx = null;
  if (!q.combat) { q.enemies = null; q.verbs = null; q.openerBeats = []; }
 }
 C.save(game);
};
const currentEncounter = A.Game.currentEncounter;
A.Game.currentEncounter = function (game) { F.upgradeQuest(game); return currentEncounter(game); };
const queueClosing = C.queueClosing;
C.queueClosing = function (game) {
 const q = game.quest;
 if (isFinal(game) && q.readyToComplete && !q.failed && !C.state(game).ending && F.state(game).realmWon && !q.closingBeats?.length) q.__c3closed = false;
 return queueClosing(game);
};
const startQuest = A.Game.startQuest;
A.Game.startQuest = function (game, quest, ...args) {
 const result = startQuest(game, quest, ...args);
 if (result?.ok && isFinal(game)) {
  game.quest.quest.finaleVersion = 1;
  // Retrying the realm must not kill or resurrect Hiwot a second time, or
  // require the entire temple again after the irreversible story transition.
  if (F.state(game).soulTaken && !C.state(game).ending) game.quest.encIdx = 3;
  if (F.state(game).realmWon && !C.state(game).ending) {
   game.quest.encIdx = 4; game.quest.readyToComplete = true; C.queueClosing(game);
  }
 }
 return result;
};
const alliesFor = C.alliesFor;
C.alliesFor = function (game, quest) {
 const allies = alliesFor(game, quest);
 return quest?.n === 14 && (F.state(game).soulTaken || game.quest?.encIdx === 3) ? allies.filter(ch => ch.campaignId !== W) : allies;
};
const spawnEncounter = C.spawnEncounter;
C.spawnEncounter = function (game, quest, index) {
 const enemies = spawnEncounter(game, quest, index);
 if (quest.n === 14 && index === 3) {
  const boss = enemies.find(ch => ch.campaignId === 'korvath');
  if (boss) {
   boss.name = 'Kolade — the Unbound'; boss.campaignExit = false;
   // The arc he was already swinging in the temple, now carrying what he took from the
   // throne, plus the challenge he only makes once he believes he has already won.
   boss.actives = ['cleave', 'unbound_arc', 'the_strongest_among_you', 'sunder', 'fire_bolt', 'ashfall']
    .map(skillId => ({ skillId, level: 30, uses: 300 }));
   boss.perks = boss.perks.filter(p => p.skillId !== 'bulwark');
   boss.stats.hp *= .75; boss.hpFloor *= .75;
   boss.gateAscendant = true;
  }
 }
 return enemies;
};
const encounterReady = C.encounterReady;
C.encounterReady = function (game, encounter, context) {
 const out = encounterReady(game, encounter, context);
 if (out && isFinal(game) && game.quest.encIdx >= 2 && !C.state(game).ending) {
  // These are directed boss phases. A generic bribe cannot skip the ritual.
  game.quest.verbs = out.verbs = out.verbs.filter(v => v.verb === 'fight' || v.verb === 'flee');
 }
 return out;
};
const resolveEnding = C.resolveEnding;
C.resolveEnding = function (game, resolution) {
 if (!['restore', 'ascend'].includes(resolution)) return resolveEnding(game, resolution);
 const s = C.state(game), f = F.state(game);
 if (s.ending) return s.ending;
 if (!f.realmWon || !f.soulTaken) return null;
 s.resolution = resolution; s.ending = resolution === 'restore' ? 'restored' : 'ascended';
 if (resolution === 'restore') {
  s.dead = s.dead.filter(id => id !== W); s.gone = s.gone.filter(id => id !== W);
  if (!s.recruited.includes(W)) s.recruited.push(W);
  if (f.sister?.state === 'company' && !s.company.includes(W) && s.company.length < C.MAX_COMPANY) s.company.splice(Math.max(0, f.sister.seat), 0, W);
  s.heritage = -3;
 } else s.heritage = 3;
 game.__c3actors = null;
 s.epilogue = C.epilogue(game); s.endCardDue = true;
 C.save(game); return s.ending;
};
// New endings describe the soul's outcome themselves; legacy Hiwot paragraphs
// must not simultaneously claim that she stayed dead or opened a lock shop.
const epilogue = C.epilogue;
C.epilogue = function (game) {
 const paragraphs = epilogue(game), s = C.state(game);
 if (!['restored', 'ascended'].includes(s.ending)) return paragraphs;
 const e = A.DATA.CAMPAIGN3_EPILOGUE, obsolete = new Set([...Object.values(e.companion[W] || {}), ...Object.values(e.heritage)]);
 const out = paragraphs.filter(text => !obsolete.has(text)).map(text => text === e.companion.amara.present
  ? e.finale.amaraMourning : text);
 // Resolve the public conspiracy as well as the private choice in Morrak's realm.
 out.splice(1, 0, e.finale.cityAftermath);
 const def = A.DATA.CAMPAIGN_CHARS[s.romance], romance = e.romance[s.romance];
 if (romance && C.isRecruited(game, s.romance) && ((s.ending === 'restored' && def.favours === 'hero') || (s.ending === 'ascended' && def.favours === 'usurper') || def.favours === 'kill')) {
  if (!out.includes(romance.favoured)) out.push(romance.favoured);
 }
 return out;
};
})();
