// Adventurer: Expeditions — the loop (GDD v0.8): tutorial → inn → recruit →
// level a skill → travel → quest → travel → inn → repeat. Hiro is the permanent
// first member and the only character the player taps; recruits are bought
// with gold, ship finished, and fight on their own. Four repeatable quests come
// from plates already in the build, graded to night and given weather.
// Uses the shipped World / Character / Rel systems for the party so travel
// banter comes from real relationship tiers, exactly as on the website.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const Camp = X.Campaign = {};

// ---------------------------------------------------------------- quests
// phase: day | evening | night. weather: clear | overcast | rain | storm.
// music: one track for the whole quest, travel included (three-track rule, §5.1).
// travel: the panorama location used before, between and after the fights.
X.quests = [
  { id: 'road',  title: 'Clear the road',       done: 'Road cleared',   tutorial: true,
    plates: ['deep_wood', 'bandit_road', 'mountain'], phase: 'day',   weather: 'clear',    music: 'battle_origin', travel: 'forest',
    encounters: ['road_ambush', 'thicket', 'clearing'] },
  { id: 'rain',  title: 'The road in the rain', done: 'Road held',
    plates: ['deep_wood', 'bandit_road', 'mountain'], phase: 'day',   weather: 'storm',    music: 'battle_origin', travel: 'forest',
    encounters: ['rain_boars', 'rain_bandits', 'rain_boar_boss'] },
  { id: 'city',  title: 'The city watch',       done: 'Watch broken',
    plates: ['alley', 'alley', 'alley'],              phase: 'day',   weather: 'overcast', music: 'battle_origin', travel: 'city',
    encounters: ['city_watch', 'city_bailiff', 'city_captain'] },
  { id: 'marsh', title: 'The reed marsh',       done: 'Marsh cleared',
    plates: ['marsh', 'marsh', 'marsh'],              phase: 'night', weather: 'clear',    music: 'night1',        travel: 'marsh',
    encounters: ['marsh_wolves', 'marsh_lurkers', 'marsh_alpha'] },
  { id: 'ruins', title: 'The old ruins',        done: 'Ruins cleared',
    plates: ['ruins', 'ruins', 'ruins'],              phase: 'night', weather: 'storm',    music: 'night1',        travel: 'ruins',
    encounters: ['ruins_lurkers', 'ruins_mage', 'ruins_alpha'] },
];
X.innMusic = 'edwyn2';           // "Weight of the Quiet Man", Edwyn theme 2
// The two night quests share the Hunter's Breath slot. `night1` is provisional
// until the intended file is named (GDD §16).

// Weather kinds as the shipped Weather layer wants them (override objects).
X.weatherKinds = {
  clear:    { kind: 'clear',    intensity: 0,   wind: 0.1 },
  overcast: { kind: 'overcast', intensity: 0.4, wind: 0.3 },
  rain:     { kind: 'rain',     intensity: 0.7, wind: 0.4 },
  storm:    { kind: 'storm',    intensity: 0.9, wind: 0.8 },
};
Camp.weatherOf = q => X.weatherKinds[(q && q.weather) || 'clear'] || X.weatherKinds.clear;

// The weather a quest actually gets, resolved once for both the battle plates
// and the travel panorama. Deliberately no `groundId`: a plate carries its own
// bias (the marsh plate's is rain) which would quietly overrule the quest's
// declared sky — the reed marsh is a *clear* night (GDD §5). The phase is
// applied, so a night storm reads as night rather than as a bright day storm.
Camp.weatherFor = function (quest, world, phase) {
  // Developer overrides (Hiro, 2026-09-21): the dev panel cycles these so a
  // location can be judged under every sky while a quest is being designed.
  // Unset for players — nothing writes them but the panel.
  const over = (X.devWeather && X.weatherKinds[X.devWeather]) || Camp.weatherOf(quest);
  if (X.devPhase) phase = X.devPhase;
  const w = (world && world.world) || world || { seed: 1, questClock: 0 };
  try { return A.Weather.at(w, { phase: phase || (quest && quest.phase) || 'day', override: over }); }
  catch (e) { return over; }
};

// Enemies beyond the tutorial. `bg` comes from the quest's plates, not the encounter.
Object.assign(X.enemies, {
  // No art wiring here on purpose: a finishing move matches on the painted set
  // (Actor.canPair via X.paintedActorOf), so every wolf variant pairs because it
  // is drawn from the wolf sheet. Add as many as a quest needs.
  dire_wolf_2:  { base: 'dire_wolf', level: 6, kind: 'wolf', frame: 0, height: 250, statMult: { hp: 2.0, atk: 1.15 } },
  cave_boar_2:  { base: 'cave_boar', level: 8, kind: 'boar', frame: 1, height: 250, actives: ['tusk_gore'], statMult: { hp: 2.2, atk: 1.1 } },
  thorn_2:      { base: 'thorn_lurker', level: 8, kind: 'plant', frame: 2, height: 260, actives: ['thorn_lash'], perks: [], statMult: { hp: 2.0 } },
  boar_boss:    { base: 'cave_boar', level: 6, kind: 'boar', frame: 1, height: 310, tint: 0xd8c2b0, actives: ['tusk_gore'], perks: ['momentum'],
                  boss: true, statMult: { hp: 4.0, atk: 1.0 }, phase2At: 0.5 },
  // Wired to the painted Alpha exactly as the road's boss is (2026-09-21). It
  // had neither artActor nor artIdentity, so it resolved to no painted set at
  // all: scene.js refuses to open a fight with an enemy that has no complete
  // art, which is why the loop threw the moment a boss wave came up. The tint is
  // gone too — it belonged to the plate art, not to a painted sheet.
  alpha_2:      { base: 'alpha', level: 6, kind: 'boss', artActor: 'alpha',
                  height: 330, actives: ['pack_snap', 'cleave'], perks: ['momentum'],
                  statMult: { atk: 1.0, hp: 3.2 }, phase2At: 0.5 },
  // Humans: sex, head and outfit are fixed so every bust composes from the
  // synced part sheets. The outfit is a real gear set.
  bandit:       { base: 'bandit', level: 5, kind: 'human', height: 240, human: { sex: 'f', head: 7, set: 'street' }, actives: ['scouts_cut'], statMult: { hp: 1.7, atk: 1.0 } },
  bandit_b:     { base: 'bandit', level: 5, kind: 'human', height: 240, human: { sex: 'f', head: 9, set: 'street' }, actives: ['scouts_cut'], statMult: { hp: 1.7, atk: 1.0 } },
  cutthroat:    { base: 'cutthroat', level: 6, kind: 'human', height: 240, human: { sex: 'm', head: 7, set: 'leathers' }, actives: ['venom_fang'], perks: [], statMult: { hp: 1.6 } },
  hedge_mage:   { base: 'hedge_mage', level: 6, kind: 'human', height: 240, human: { sex: 'm', head: 6, set: 'adept' }, actives: ['frost_touch', 'aimed_cantrip'], perks: [], statMult: { hp: 1.4 } },
  town_watch:   { base: 'town_watch', level: 6, kind: 'human', height: 245, human: { sex: 'm', head: 5, set: 'plate' }, actives: ['sunder', 'taunt'], statMult: { hp: 2.0, atk: 1.0 } },
  storm_bailiff:{ base: 'storm_bailiff', level: 7, kind: 'human', height: 245, human: { sex: 'm', head: 8, set: 'adept' }, actives: ['spark'], perks: [], statMult: { hp: 1.5 } },
  watch_captain:{ base: 'town_watch', level: 9, kind: 'human', height: 275, human: { sex: 'm', head: 8, set: 'plate' }, name: 'Watch Captain', boss: true, actives: ['sunder', 'taunt'],
                  statMult: { hp: 3.8, atk: 1.15, def: 1.2 }, phase2At: 0.5 },
});

Object.assign(X.encounterDefs = {}, Object.fromEntries(X.encounters.map(e => [e.id, e])), {
  // Wolf, plant and the Alpha only (Hiro, 2026-09-21: "we should only be using
  // the wolf and the plant creature for now, since those are the only ones with
  // full art"). The boars and the human foes are out of every open quest: the
  // boars have an animated set but no finishing move, and the humans are
  // composed from the old part sheets rather than a reworked set. The Alpha
  // stays as the boss — 9 clips, 45 frames and three Hiro finishers, the same
  // bar as the other two. The original rosters are kept below, commented, so
  // they can come back with the art.
  // Road in the Rain is where a new player starts, so it keeps the tutorial's
  // curve: ordinary wolves, then wolves and lurkers, then the Alpha. The three
  // levels after it use the tougher _2 variants.
  rain_boars:      { id: 'rain_boars',      enemies: ['dire_wolf', 'dire_wolf'],                    gold: 40 },
  rain_bandits:    { id: 'rain_bandits',    enemies: ['dire_wolf', 'thorn_lurker', 'thorn_lurker'], gold: 50 },
  rain_boar_boss:  { id: 'rain_boar_boss',  enemies: ['road_wolf_leader'], boss: true,              gold: 60 },
  // was: cave_boar_2 x2 / bandit, cutthroat, bandit_b / boar_boss + thorn_2
  city_watch:      { id: 'city_watch',      enemies: ['thorn_2', 'dire_wolf_2'],                    gold: 40 },
  city_bailiff:    { id: 'city_bailiff',    enemies: ['dire_wolf_2', 'dire_wolf_2', 'thorn_2'],     gold: 50 },
  city_captain:    { id: 'city_captain',    enemies: ['alpha_2', 'dire_wolf_2'], boss: true,        gold: 70 },
  // was: town_watch x2 / town_watch + storm_bailiff / watch_captain + storm_bailiff
  marsh_wolves:    { id: 'marsh_wolves',    enemies: ['dire_wolf_2', 'dire_wolf_2'],                gold: 40 },
  marsh_lurkers:   { id: 'marsh_lurkers',   enemies: ['thorn_2', 'dire_wolf_2', 'thorn_2'],         gold: 50 },
  marsh_alpha:     { id: 'marsh_alpha',     enemies: ['alpha_2', 'thorn_2'], boss: true,            gold: 60 },
  ruins_lurkers:   { id: 'ruins_lurkers',   enemies: ['dire_wolf_2', 'thorn_2', 'thorn_2'],         gold: 40 },   // was cave_boar_2
  ruins_mage:      { id: 'ruins_mage',      enemies: ['thorn_2', 'dire_wolf_2', 'thorn_2'],         gold: 50 },   // was bandit, hedge_mage, bandit_b
  ruins_alpha:     { id: 'ruins_alpha',     enemies: ['alpha_2', 'dire_wolf_2'], boss: true,        gold: 70 },
});
Camp.encounter = id => X.encounterDefs[id];
Camp.quest = id => X.quests.find(q => q.id === id);
// The quest's encounters with the plate the quest assigns to that wave.
Camp.questEncounters = q => { q = typeof q === 'string' ? Camp.quest(q) : q; return q.encounters.map((id, i) => Object.assign({}, Camp.encounter(id), { bg: q.plates[i] || q.plates[q.plates.length - 1] })); };

// Repeatable quests get harder each time they are cleared: +30% enemy hp and
// atk per completion, capped at ×3. This is the whole "what ends the loop"
// answer for now (GDD §16) — it does not end, it climbs. Measured: a first clear
// is near-certain with Hiro and two recruits; the fourth is a real fight.
Camp.timesCleared = (run, questId) => (run.cycles && run.cycles[questId]) || 0;
Camp.scaleFor = (run, questId) => Math.min(3.0, 1 + 0.3 * Camp.timesCleared(run, questId));

// The order the Embark button walks: tutorial once, then the four in a cycle.
// The quests this build will actually hand out, in order: the tutorial road,
// then whichever loop quests the slice has opened (all of them once the slice
// is lifted). Anything not on that list is unreachable, not merely unlisted.
Camp.openQuestIds = function () {
  const loop = X.quests.filter(q => !q.tutorial).map(q => q.id);
  if (!(X.slice && X.slice.firstLevelOnly)) return loop;
  const open = (X.slice.openQuests || []).filter(id => loop.includes(id));
  return open;
};
// Where a new run begins. Everything that used to hard-code 'road' asks this.
Camp.startQuestId = () => (X.slice && X.slice.startQuest) || 'road';
// A quest is open if it is the starting one, the retired tutorial (kept for the
// dev panel's preview), or on the whitelist.
Camp.questOpen = function (id) {
  const q = Camp.quest(id);
  return !!q && (id === Camp.startQuestId() || !!q.tutorial || Camp.openQuestIds().includes(id));
};
// The open quests in the order X.slice.openQuests lists them: the first one
// not yet cleared, and once they are all cleared, round again.
Camp.nextQuestId = function (run) {
  const open = Camp.openQuestIds();
  if (!open.length) return Camp.startQuestId();
  const done = (run.questsDone || []).filter(id => open.includes(id));
  for (const id of open) if (!done.includes(id)) return id;
  return open[done.length % open.length];
};

// ---------------------------------------------------------------- recruits
// Bought at the inn, finished on arrival: their design's gear and skills, at
// Intermediate. Each has its own personality (voice) so banter varies as the
// roster grows. Bram, Nyx and Sable's IDs are provisional (GDD §16).
X.recruits = [
  { key: 'bram',  name: 'Bram',  sex: 'm', head: 5, seed: 9101, personalityId: 'M05', title: 'Shieldbearer', classes: ['tank', 'fighter'], role: 'tank',
    actives: ['shield_wall', 'cleave', 'taunt'], perks: ['bulwark'], set: 'plate',   stats: { hp: 1.6, atk: 1.1, def: 1.4, spd: 0.9 } },
  { key: 'nyx',   name: 'Nyx',   sex: 'f', head: 6, seed: 9202, personalityId: 'F07', title: 'Poacher',      classes: ['rogue', 'ranger'], role: 'damage',
    actives: ['venom_fang', 'aimed_shot', 'snare'], perks: ['opportunist'], set: 'hunter', stats: { hp: 1.25, atk: 1.4, def: 1.0, spd: 1.4 } },
  { key: 'sable', name: 'Sable', sex: 'm', head: 8, seed: 9303, personalityId: 'M11', title: 'Hedge Mage',   classes: ['mage'], role: 'damage',
    actives: ['fire_bolt', 'spark', 'frost_touch'], perks: ['arcane_focus'], set: 'adept', stats: { hp: 1.0, atk: 1.5, def: 0.8, spd: 1.2 } },
  { key: 'aera',  name: 'Aera',  sex: 'f', head: 8, seed: 742,  personalityId: 'F03', title: 'Field Healer', classes: ['healer'], role: 'healer',
    actives: ['mend', 'guardian_ward'], perks: ['devoted'], set: 'oath',      stats: { hp: 1.2, atk: 0.8, def: 1.0, spd: 1.1 } },
  { key: 'ren',   name: 'Ren',   sex: 'm', head: 6, seed: 311,  personalityId: 'M02', title: 'Free Sword',   classes: ['fighter'], role: 'damage',
    actives: ['cleave', 'defiant_stand'], perks: ['momentum'], set: 'duelist',  stats: { hp: 1.6, atk: 1.2, def: 1.3, spd: 1.0 } },
];
X.party = { fieldMax: 2, recruitCosts: [60, 90, 120, 150, 180] };
Camp.recruit = key => X.recruits.find(r => r.key === key) || null;
// Reviewed identities and loaded animation coverage are separate gates. A saved
// purchase or a matching portrait filename cannot approve a new combat actor.
Camp.recruitArt = Object.freeze({
  bram: Object.freeze({ approved: true, clips: ['idle', 'walk', 'draw', 'short_draw', 'slash', 'hit_short', 'roll', 'intercept', 'riposte', 'cast', 'victory', 'kneel', 'bite_leg', 'bite_arm', 'finisher_quadruped', 'finisher_plant', 'finisher_human', 'finisher_boss'] }),
});
const loadedRecruitArt = new Set();
Camp.recruitApproved = key => !!(Camp.recruitArt[key] && Camp.recruitArt[key].approved);
Camp.registerRecruitArt = function (key, sheet, hasFrame) {
  loadedRecruitArt.delete(key);
  const spec = Camp.recruitArt[key];
  if (!spec || !spec.approved || !sheet || !sheet.clips || typeof hasFrame !== 'function') return false;
  const valid = spec.clips.every(id => {
    const clip = sheet.clips[id], frames = clip && clip.frames;
    return Array.isArray(frames) && frames.length >= 2 && new Set(frames).size === frames.length &&
      frames.every(frame => typeof frame === 'string' && hasFrame(frame));
  });
  if (valid) loadedRecruitArt.add(key);
  return valid;
};
// Is this recruit's art actually in the package? (Hiro, 2026-09-21.) Bram's
// combat atlas is out while the inn is locked, so he reads as "art unavailable"
// exactly like the unpainted recruits — re-adding him is one entry in
// X.shipped.actors and three in tools/ship_manifest.json, together.
Camp.artShipped = key => !(X.shipped && X.shipped.actors) || X.shipped.actors.includes(key);
Camp.recruitReady = key => Camp.recruitApproved(key) && Camp.artShipped(key) && loadedRecruitArt.has(key);
Camp.recruitingLocked = () => !!(X.slice && X.slice.firstLevelOnly);

// Save sanitation must work before textures load. Preserve known paid ownership,
// but strip unknown identities and unsupported field members; buildWorld applies
// the loaded-frame gate separately. The tutorial lock also covers old checkpoints.
Camp.sanitizeRun = function (run) {
  const record = v => v && typeof v === 'object' && !Array.isArray(v);
  const list = v => Array.isArray(v) ? v : [];
  const unique = v => [...new Set(list(v))];
  delete run.hero; // Hiro is permanent; old hero-pick saves cannot change his kit.
  run.roster = unique(run.roster).filter(key => !!Camp.recruit(key));
  run.field = unique(run.field).filter(key => run.roster.includes(key) && Camp.recruitApproved(key)).slice(0, X.party.fieldMax);
  run.gold = Number.isFinite(run.gold) ? Math.max(0, Math.floor(run.gold)) : 0;
  run.questsDone = list(run.questsDone).filter(id => !!Camp.quest(id));
  run.awarded = unique(run.awarded).filter(id => !!Camp.encounter(id));
  run.tutorial = record(run.tutorial) ? run.tutorial : {};
  run.voice = record(run.voice) ? run.voice : {};
  run.visits = record(run.visits) ? run.visits : {};
  run.cycles = record(run.cycles) ? run.cycles : {};
  const validIdentity = key => key === 'hiro' || !!Camp.recruit(key);
  const rel = {};
  for (const [from, tos] of Object.entries(record(run.rel) ? run.rel : {})) {
    if (!validIdentity(from) || !record(tos)) continue;
    rel[from] = {};
    for (const [to, score] of Object.entries(tos)) if (validIdentity(to) && Number.isFinite(score)) rel[from][to] = Math.max(-100, Math.min(100, score));
  }
  run.rel = rel;
  if (!['quest', 'travel', 'inn', 'grave'].includes(run.phase)) run.phase = 'quest';
  // A save naming a quest that is not open is pulled back to the road — but
  // "open" means the whitelist, not literally the road (Hiro, 2026-09-21). This
  // used to test `recruitingLocked() && questId !== 'road'`, so every quest the
  // slice had deliberately opened was undone on the next save load: embarking on
  // Road in the Rain worked, and then sanitation put the player back on the
  // tutorial. Quest two was unreachable by construction.
  if (!Camp.quest(run.questId) || !Camp.questOpen(run.questId)) {
    run.questId = Camp.startQuestId(); run.wave = 0; run.checkpoint = 0;
    if (run.phase !== 'inn') run.phase = 'quest';
    delete run.travelLeg;
  }
  const count = Camp.quest(run.questId).encounters.length;
  run.wave = Number.isFinite(run.wave) ? Math.max(0, Math.min(count, Math.floor(run.wave))) : 0;
  if (run.phase === 'quest' && run.wave === count) { run.phase = 'inn'; run.wave = 0; }
  run.checkpoint = Number.isFinite(run.checkpoint) ? Math.max(0, Math.min(count, Math.floor(run.checkpoint))) : 0;
  return run;
};
Camp.recruitCost = run => X.party.recruitCosts[Math.min(X.party.recruitCosts.length - 1, (run.roster || []).length)];
Camp.owns = (run, key) => (run.roster || []).includes(key);
Camp.fielded = (run, key) => (run.field || []).includes(key);
Camp.canBuy = (run, key) => !!Camp.recruit(key) && Camp.recruitReady(key) && !Camp.recruitingLocked() && !Camp.owns(run, key) && run.gold >= Camp.recruitCost(run);
Camp.buy = function (run, key) {
  if (!Camp.recruit(key)) return { ok: false, reason: 'unknown' };
  // The lock is checked before the art: while recruiting is shut a recruit's art
  // is deliberately not loaded (Painted.needed), so 'art unavailable' would be a
  // symptom reported as the cause. The honest refusal is the lock itself.
  if (Camp.recruitingLocked()) return { ok: false, reason: 'slice locked' };
  if (!Camp.recruitReady(key)) return { ok: false, reason: 'art unavailable' };
  if (Camp.owns(run, key)) return { ok: false, reason: 'owned' };
  const cost = Camp.recruitCost(run);
  if (run.gold < cost) return { ok: false, reason: 'gold', cost };
  run.gold -= cost; run.roster.push(key);
  if (run.field.length < X.party.fieldMax) run.field.push(key);       // a new recruit rides along unless the party is full
  return { ok: true, cost, fielded: Camp.fielded(run, key) };
};
Camp.toggleField = function (run, key) {
  if (!Camp.recruit(key)) return { ok: false, reason: 'unknown' };
  if (!Camp.recruitReady(key)) return { ok: false, reason: 'art unavailable' };
  if (!Camp.owns(run, key)) return { ok: false, reason: 'not owned' };
  const i = run.field.indexOf(key);
  if (i >= 0) { run.field.splice(i, 1); return { ok: true, fielded: false }; }
  if (run.field.length >= X.party.fieldMax) return { ok: false, reason: 'full' };
  run.field.push(key); return { ok: true, fielded: true };
};

// Build a recruit as a finished website character.
Camp.makeRecruit = function (run, key) {
  const d = Camp.recruit(key);
  if (!d || !Camp.recruitReady(key)) return null;
  const lvl = A.DATA.CONST.TIER_THRESHOLDS.intermediate;
  const ch = A.Character.makePlayer(new A.RNG(d.seed), { name: d.name, sex: d.sex, personalityId: d.personalityId, portraitSeed: d.seed, portraitSlot: 1, appearance: { head: d.head }, startingSkills: [] });
  ch.isPlayer = false; ch.freeSkillsUsed = A.DATA.CONST.FREE_STARTING_SKILLS;
  ch.companionKey = key; ch.role = d.role; ch.archetypeInclination = [d.classes[0]];
  for (const k of Object.keys(d.stats)) ch.stats[k] = Math.round(ch.stats[k] * d.stats[k]);
  ch.actives = d.actives.map(skillId => ({ skillId, level: lvl, uses: 0 }));
  ch.perks = d.perks.map(skillId => ({ skillId, level: lvl, uses: 0 }));
  ch.equippedSet = d.set;
  ch.autoOrder = d.actives.map(skillId => ({ skillId, off: false })).concat([{ skillId: 'basic_attack', off: false }]);
  ch.autoAdopted = true; ch.autoRepeat = null; ch.autoAttack = false;
  Camp.attachVoice(run, ch);
  return ch;
};

// speakEx keeps its round-robin on the character object; these characters are
// rebuilt every scene, so the rotation lives in the run and is attached by
// reference — speakEx mutates it in place and the next save carries it.
Camp.attachVoice = function (run, c) {
  if (!c || !c.personalityId) return c;
  const v = run.voice || (run.voice = {});
  const slot = v[c.personalityId] || (v[c.personalityId] = { rotation: {}, last: {} });
  c.dialogueRotation = slot.rotation; c.lastVariantUsed = slot.last;
  return c;
};

// A tiny world holds Hiro and the fielded recruits so Rel and the dialogue
// tables work unchanged. Rebuilt from the run (relationship scores persist).
Camp.buildWorld = function (run) {
  Camp.sanitizeRun(run);
  const rng = new A.RNG(48103);
  const nextId = A.Character.peekNextId ? A.Character.peekNextId() : null;
  const world = A.World.create(48103);
  const hero = X.Encounter.makeHero(new A.RNG(5), run);
  const companions = run.field.filter(k => Camp.recruitReady(k)).map(k => Camp.makeRecruit(run, k)).filter(Boolean);
  world.characters = [hero].concat(companions); world.playerId = hero.id;
  // Regard between everyone, from the run (so quests move it and banter follows).
  const rel = run.rel || (run.rel = {});
  const ids = { hiro: hero.id };
  for (const c of companions) ids[c.companionKey] = c.id;
  for (const [from, tos] of Object.entries(rel)) for (const [to, score] of Object.entries(tos)) if (ids[from] && ids[to]) A.Rel.move(world, ids[from], ids[to], score, 'demo');
  const game = { world, rng, player: hero, meta: { journal: {}, skillLevels: {}, codexUnlocked: [], promptsSeen: {} }, life: 1, quest: null, tutorial: { step: 'done' }, __expedition: true };
  return { game, world, hero, companions, ids, restoreIds: () => { if (nextId != null && A.Character.resetIds) A.Character.resetIds(nextId); } };
};

// Regard moves with shared quests, as in the original: a won contract warms
// everyone who rode together; a loss cools the pair.
Camp.afterQuest = function (run, won) {
  const rel = run.rel || (run.rel = {});
  const bump = (a, b, d) => { rel[a] = rel[a] || {}; rel[a][b] = Math.max(-100, Math.min(100, (rel[a][b] || 0) + d)); };
  const crew = ['hiro'].concat(run.field || []);
  for (const a of crew) for (const b of crew) if (a !== b) bump(a, b, won ? 22 : -12);
};

// ---------------------------------------------------------------- travel banter
// Mirrors Travel.dialogue: one companion speaks about the place (first visit),
// the road, or the leg between fights; the other answers by how they feel.
Camp.banter = function (ctx, world, companions, leg, location, opts) {
  opts = opts || {};
  const seed = (A.hashStr([leg, location, opts.visits || 0, opts.questId || '', opts.wave || 0].join(':')) >>> 0);
  const pool = companions.filter(c => c && c.alive !== false && /^[MF]\d\d$/.test(c.personalityId || ''));
  if (!pool.length) return [];
  const a = pool[seed % pool.length];
  const b = pool.find(c => c !== a) || null;
  const D = A.DATA.DIALOGUE;
  const has = (c, band) => !!(D[c.personalityId] && D[c.personalityId][band] && D[c.personalityId][band].length);
  let band;
  if (leg === 'return') band = 'travel_' + (opts.lost ? 'return_loss' : 'return_win');
  else if (leg === 'midleg') band = 'travel_midleg';
  else band = (opts.visits || 0) === 0 && has(a, 'travel_' + location) ? 'travel_' + location : 'travel_neutral';
  const lines = [{ speaker: a, band, to: b || null }];
  if (b && leg !== 'midleg') {                    // between fights one line is enough; the road is short
    const tier = A.Rel.tierBetween(world, b.id, a.id);
    const response = tier === 'hatred' ? 'travel_hatred' : tier === 'romantic' ? 'travel_romantic' : 'travel_response';
    lines.push({ speaker: b, band: has(b, response) ? response : 'travel_response', to: a });
  }
  return lines;
};

// ---------------------------------------------------------------- run state
Camp.freshRun = function () {
  const r = X.Encounter.freshRun();
  Object.assign(r, { phase: 'quest', questId: Camp.startQuestId(), wave: 0, roster: [], field: [], questsDone: [], cycles: {}, rel: { aera: { ren: -55 }, ren: { aera: -50 } }, visits: {}, voice: {} });
  return r;
};
})();
