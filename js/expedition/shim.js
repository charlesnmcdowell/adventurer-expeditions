// Adventurer: Expeditions — the only hooks into shared code, all additive.
//  1. SkillSys.manifest: a Hiro flagged `ch.expedition` resolves his four skills
//     (and the riposte) from Expedition.skills[skill][level] instead of the
//     website tiers. Every other character is untouched, so the 24 seeded
//     combat traces cannot change.
//  2. DATA.SKILLS gains `expedition_riposte` (a new id; nothing existing changes).
//  3. Portal: 'Expedition' counts as a gameplay scene.
(function () {
'use strict';
const A = ADV, X = A.Expedition;
const TIERS = ['basic', 'intermediate', 'advanced'];

if (A.DATA && A.DATA.SKILLS && !A.DATA.SKILLS[X.riposte.id]) A.DATA.SKILLS[X.riposte.id] = X.riposte;

const Sys = A.SkillSys;
if (Sys && !Sys.__expeditionWrapped) {
  const orig = Sys.manifest;
  Sys.manifest = function (ch, entry) {
    const m = orig.call(Sys, ch, entry);
    const run = ch && ch.expedition;
    if (!run || !m) return m;
    const id = entry.skillId;
    // The riposte follows Counter Attack's level; the four signature skills their own.
    const levelOf = id === X.riposte.id ? 'counter_attack' : id;
    const table = X.skills[levelOf];
    if (!table && id !== X.riposte.id) return m;
    const lvl = Math.max(1, Math.min(X.economy.maxLevel, (run.levels && run.levels[levelOf]) || 1));  // 0 (locked) is never used in combat
    const tier = TIERS[lvl - 1];
    if (id === X.riposte.id) {
      const sk = X.riposte;
      return { skill: sk, tier, level: lvl, data: Object.assign({}, sk, sk.tiers[tier] || {}), flare: m.flare };
    }
    const sk = m.skill;
    const data = Object.assign({}, sk, table.base || {}, table[lvl] || {});
    // Shipped tier slices are identical and would reintroduce the website bleed
    // values; the level entry above is the whole tier for this edition.
    return { skill: sk, tier, level: lvl, data, flare: m.flare };
  };
  Sys.__expeditionWrapped = true;
}

// Solo-demo rule: the website's boss rider adds 12% of the target's max HP to
// every boss hit, tuned for a party with a healer. Alone, that is four bites to
// death whatever the numbers say, so the offshoot runs it at a third. This edition
// only ever fights its own encounters, so the constant is set once, here.
if (A.DATA && A.DATA.CONST && A.DATA.CONST.BOSS_HIT_PCT > 0.04) A.DATA.CONST.BOSS_HIT_PCT = 0.04;

// Younger audience: the website's presentation-only profanity mask stays on,
// and the line picker prefers lines that need no masking at all (a row of
// asterisks is not a line). Clip indices are untouched: the same idx, the same recording.
if (A.Censorship) A.Censorship.enabled = () => true;
if (A.util && A.util.speakEx && !A.util.__expeditionClean) {
  const orig = A.util.speakEx;
  A.util.speakEx = function (world, speaker, band, ctx) {
    let r = orig.call(A.util, world, speaker, band, ctx);
    for (let i = 0; i < 6 && r && A.Censorship && A.Censorship.contains(r.text); i++) r = orig.call(A.util, world, speaker, band, ctx);
    if (r && A.Censorship && A.Censorship.contains(r.text) && band !== 'travel_response') { const alt = orig.call(A.util, world, speaker, 'travel_response', ctx); if (alt && !A.Censorship.contains(alt.text)) return alt; }
    return r;
  };
  A.util.__expeditionClean = true;
}

// Portal adapter: the scene key that means "the player is playing".
X.portalSceneKeys = ['Expedition'];
})();
