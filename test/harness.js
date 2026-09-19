// Node harness: loads data + core files into globalThis so tests run headless.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'js/data/constants.js', 'js/data/version.js', 'js/data/skills.js', 'js/data/campaign_skills.js', 'js/data/campaign_data.js', 'js/data/campaign_dialogue.js',
  'js/data/campaign2_skills.js', 'js/data/monster_skills.js', 'js/data/campaign2_data.js', 'js/data/campaign2_dialogue.js', 'js/data/campaign3_data.js', 'js/data/campaign3_dialogue.js', 'js/data/gate_finale.js', 'js/data/gate_epilogue_voice.js', 'js/data/campaign3_perks.js',   'js/data/enemies.js',
  'js/data/minibosses.js',
  'js/data/enemy_tactics.js',
  'js/data/names.js', 'js/data/tutorial.js', 'js/data/registry.js',
  'js/data/dialogue.js', 'js/data/dialogue_hiro.js', 'js/data/dialogue2.js', 'js/data/dialogue_context.js', 'js/data/dialogue_bonus.js', 'js/data/travel.js', 'js/data/personality_events.js', 'js/data/personality_pairs.js', 'js/data/personality_travel.js', 'js/data/personality_social.js', 'js/data/campaign_story.js', 'js/data/voice_manifest.js', 'js/data/audio_update_manifest.js', 'js/data/lifecycle_voice_manifest.js',
  'js/core/rng.js', 'js/core/util.js', 'js/core/skillsys.js', 'js/core/character.js',
  'js/core/housing.js',
  'js/core/survival.js',
  'js/core/combat_events.js', 'js/core/combat_turns.js', 'js/core/combat_targeting.js', 'js/core/combat_damage.js', 'js/core/combat_healing.js', 'js/core/combat_statuses.js', 'js/core/combat.js', 'js/core/combat_ai.js', 'js/core/combat_effects.js', 'js/core/relationships.js', 'js/core/courtship.js', 'js/core/hiro.js', 'js/core/vault.js',
  'js/core/quests.js', 'js/core/party.js', 'js/core/divine.js', 'js/core/death.js',
  'js/core/world.js', 'js/core/save_store.js', 'js/core/save.js', 'js/core/release_config.js', 'js/core/prefs.js', 'js/core/censorship.js', 'js/core/campaign_router.js', 'js/core/campaign.js', 'js/core/campaign2.js', 'js/core/quest_lifecycle.js', 'js/core/game.js', 'js/core/campaign3.js', 'js/core/gate_finale.js', 'js/core/campaign3_perks.js', 'js/core/campaign3_perk_combat.js', 'js/core/conversation.js', 'js/core/travel.js', 'js/core/difficulty.js', 'js/core/balance_support.js', 'js/core/family_support.js',
];

function load() {
  delete globalThis.ADV;
  for (const f of FILES) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) throw new Error('Required runtime file missing: '+f);
    const code = fs.readFileSync(p, 'utf8');
    try { vm.runInThisContext(code, { filename: f }); }
    catch (e) { console.error('LOAD FAIL', f, e.message); throw e; }
  }
  return globalThis.ADV;
}

// In-memory localStorage stand-in for headless tests.
function memBackend() {
  return { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } };
}

// The harness must load the same data/core files, in the same order, as index.html.
function checkScriptOrder() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  // Cache-busting query strings (?v=...) are not part of the path.
  const tags = [...html.matchAll(/<script src="(js\/(?:data|core)\/[^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(m => m[1]);
  const missing = tags.filter(t => !FILES.includes(t)).concat(FILES.filter(f => !tags.includes(f)));
  return { ok: !missing.length && tags.join() === FILES.join(), missing, order: tags.join() === FILES.join() };
}

module.exports = { load, memBackend, checkScriptOrder, FILES };
