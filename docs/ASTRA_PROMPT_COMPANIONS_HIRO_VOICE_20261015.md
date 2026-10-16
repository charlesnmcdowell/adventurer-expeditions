Add companions who fight beside Hiro (two at a time, from chapter 2 on) to Adventurer: Expeditions, with their art, a companion-unlocked moment, and a voice for Hiro's lines (15 October 2026).

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: no publishing, pushing or portal export. Hiro publishes the website himself (tools/site_demo.js).
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui). Companion identities, personalities, kits and the story's join and leave beats come from it. Don't rewrite or re-record existing dialogue.
- Read first:
  - the top of docs/CHANGELOG.md (everything from 2026-10-13 on);
  - docs/STORY_CAMPAIGN_PRODUCTION.md (binding art rules);
  - the sprite-cleanup workflow (docs/skills/sprite-cleanup-pilot).
  Save every prompt, reference and rejected draft under adventurer-expeditions-source-art/ (a new astra-v10 folder).
- Keep working what's there:
  - Counter (2 blocks, deflects arrows and spells);
  - Iaido Draw (god_aura slot, power 3.6);
  - the per-opponent hit scale (`B.hitScale`, tools/story_hit_scale.js);
  - Snarl's retaliation fix in shim.js;
  - the tutorial in the first two fights won;
  - the dev chapter jump;
  - the password-gated site package.
- Player-facing text sounds casual and plain, not like AI. Hiro (the character) uses no "cyber" and no "purple" glows.

THE COMPANIONS (from the original campaign data; confirm each against the source)
| Joins | Companion (id) |
|---|---|
| Ch 1 | Hiwot (wren_ward) |
| Ch 2 | Desmond (vess), Winston (fennick), Santiago (cassian), Beau (dorran), Delphine (selene) |
| Ch 3 | Itsuki (ithrel), Bahadır (bramm), Yasemin (ysolde), Devendra (aurelius) |
| Ch 5 | Layla (ilvara) |
| Ch 6 | Kaito (faelen), Wanjiru (nettle) |
| Ch 7 | Dai Morgan (durnik) |
| Ch 13 | Amara (amara); Hiwot can rejoin |

Some joins depend on choices or seats: the company holds 5 riders. Several companions can leave, die or betray in the story (the original's `gone`, `dead`, `C3.kill`). A companion who is gone or dead can't be picked.

1. COMPANIONS IN BATTLE (code)
   - From chapter 2, Hiro fights with up to **2 companions** picked from the riding company. Chapter 1 stays solo: Hiwot isn't a fighter yet and the tutorial is built for Hiro alone.
   - Today story_combat.js forces solo play: `C.alliesFor` returns `[]`, and `B.create` passes `allies: []`. Replace that with the 2 picked companions, built at the chapter's level from their original Campaign3 kit.
   - Use the existing ally slots: scene.js `spawnCompanions` has two marks behind Hiro, `X.party.fieldMax = 2`. Keep the HUD clear: no companion skill buttons. Companions act on their own.
   - Each companion has their own weapon and fighting style, a basic attack, and **2 signature moves** taken from their source kit, used on their own every so often (cooldown-driven, so not every turn). Read the moves from the source kit; don't invent new rules unless a kit has fewer than two attacking skills, and say which ones you made up.
   - **Knocked out, never finished.** Enemy finishers only ever target Hiro (enemy_finishers.js). A companion at 0 HP plays a knocked-out animation, leaves the field, and is back at full health in the next fight. Never use death, gore or knockback-death on a companion, and nothing in the story treats a knockout as a death.
   - If both companions are knocked out the fight goes on with Hiro alone. Hiro's defeat is still the only way to lose.
   - Story outcomes stay as they are: an escaping or spared named enemy keeps its survival rules, and no companion can land a lethal blow where the story needs that enemy alive (respect `campaignExit` and `noEscape`).
   - Balance:
     - the hit scale was tuned with Hiro solo, and with companions the enemies split their attacks, so rerun tools/story_hit_scale.js;
     - decide whether hits on companions follow the same "3–4 hits" rule (Hiro wants Hiro at 3–4 hits; companions can take a bit more);
     - rerun `node test/story_balance.js --gate` with a 2-companion party and report the win rate per encounter before and after;
     - raise enemy HP in party fights if they get too easy.

2. PICKING COMPANIONS (UI in docs/story_preview.js)
   - Offer "Choose who fights with you" **before each chapter**, at the inn before Continue, and **whenever a new companion joins**.
   - Show each riding companion's portrait, name, weapon and their 2 signature moves in one plain line each. Two slots; tap to fill or swap.
   - Remember the pair in the save. Default to the two who joined most recently if the player skips.
   - Gone or dead companions don't appear. The original's full-company seat choice (`seatMenu`) still decides who rides; the pick decides who fights.

3. COMPANION UNLOCKED MOMENT
   - When a companion joins, pause the dialogue for about 2–3 seconds:
     - a short "companion unlocked" jingle;
     - their portrait slides or scales in with a glow or banner and the name "Hiwot joins you";
     - then dialogue continues.
   - This replaces today's small join toast (`noteSeats` in story_preview.js) for real recruits, not seat swaps.
   - Make the jingle with ElevenLabs sound effects (see 6), or compose it. Keep it under 3 seconds and in key with the campaign music, and give it a mute-respecting volume.
   - Add a test: the moment plays once per companion per save, and never again after a reload.

4. COMPANION ART (the big job; do it in join order: Hiwot, then the chapter-2 five, then chapter 3, and so on)
   - For each companion, full-body side-view sheets facing right at Hiro's body scale and ground line, on-model with their original portrait and the source character's look. Each needs:
     - idle, enter or walk, a basic attack, signature move 1, signature move 2;
     - hit or stagger, knocked-out (down, then gone, with no blood or death), and victory.
   - **No finisher art and no enemy-on-companion finisher pairs.**
   - Every companion gets a distinct weapon and silhouette: blades, polearms, bows, staves, fists, thrown weapons and so on. No two companions should fight alike. List each companion's weapon and two moves in the CHANGELOG before painting, so Hiro can veto.
   - The art rules for humanoid moves apply: at least 16 distinct drawings per move, double the planned count, and holds don't count. Mark contact and release frames.
   - Signature projectiles (arrows, spells, thrown blades) go through the painted effect path used by enemies today (story_effects.js / releaseAnchor), launched from the hand or weapon on the release frame.
   - Companions must look feminine or masculine as their source portrait does. Hiro asked earlier that feminine characters stay feminine and attractive, never made ugly.
   - Register each companion like an enemy set (story_art.js bindings, atlases under assets/expedition/), and add them to the chapter readiness checks so a fight never opens with a companion who has no art.

5. HIRO'S VOICE (ElevenLabs)
   - **Voice id: `V8MrPOnARtlsjrlxEsE7`.** In the original, Hiro is a silent hero: his lines are the choice options the player picks (`CH(...)` options in campaign3_dialogue.js and gate_finale.js). That's about **210 lines and about 9,000 characters**.
   - Voice each option's exact text, minus the bracketed direction tags. Output to `audio/vo/campaign/hiro/<choiceId>_<optionId>.mp3`, and add the files to preview-media.json.
   - Play the line when the player picks it, before the reply. It obeys the mute setting and has a replay, like other lines.
   - Follow the original's voice tooling (../adventurer/tools/gen_campaign_voices.py):
     - model `eleven_v3`;
     - the key comes from the same key file it uses; never print, log or commit the key;
     - resumable, so existing files are skipped;
     - normalize loudness to match the existing campaign lines.
   - **Credits:** Hiro has 200,000. The Hiro lines take about 10k, and the jingle a few hundred. Stay under **40,000 in total**, including retakes and auditions. Audition the voice on 5 lines first and save them for Hiro to approve before the full run. Log credits used in the CHANGELOG.
   - Lines with `{target}`-style placeholders or names follow the original's name-free rule for audio.

6. WEBSITE IMPACT
   - The site is at about **0.84 GB of the 1 GB** GitHub Pages limit, and the demo package carries chapters 1–6. Companion art for the companions who appear in chapters 1–6 has to fit.
   - Report the added size per companion. Add companion folders to tools/site_demo.js the same way enemies are chosen (only companions who can join by SITE_THROUGH).
   - If it won't fit, say so. Hiro is weighing giving Expeditions its own Pages site.
   - The site verify must also open one party fight and the companion picker.

DONE MEANS
- Chapter 2 played for real in the browser: the unlocked moment for a new companion, picking two, a fight with both (signature moves fire, a companion gets knocked out and is back next fight), and swapping before chapter 3.
- Hiro's chosen line is heard on a choice.
- These pass:
  - `npm test`
  - `npm run test:story`
  - `npm run test:ship`
  - `node test/story_balance.js --gate`
  - the story browser tests (update them for the picker and party fights).
- Screenshots of each finished companion in a fight, the picker, and the unlocked moment, in test/reports/.
- A dated CHANGELOG entry: companions done and pending, credits used, size added, balance before and after.
- Commit only your own files after checking git status. Nothing is published.
