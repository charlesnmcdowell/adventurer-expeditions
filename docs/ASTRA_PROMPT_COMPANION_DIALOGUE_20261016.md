Fix the quality problems in the companions' dialogue in Adventurer: Expeditions, rewriting and re-voicing only the lines listed below, the same way Santiago was done (16 October 2026).

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: no publishing or pushing.
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui).
- **Use the Santiago method** (commit e4aea8c):
  - edition rewrites go in `js/expedition/story_dialogue.js`, which overrides the source lines by beat key;
  - each rewritten line gets a new recording, in the same companion's existing ElevenLabs voice, saved as `audio/vo/campaign/<id>/<beat>_<n>_<name><date>.mp3`;
  - preview-media.json and the story tests pick them up.
  Read that commit before starting.
- Rewrite only what's listed here. The rest of the 445 companion lines are good, and Delphine, Hiwot, Beau, Bahadır, Itsuki and Dai Morgan have strong, distinct voices worth protecting. Keep every plot fact, choice consequence and beat key unchanged.
- House style:
  - casual, plain and spoken, never like AI;
  - short sentences, specific details, no speeches and no therapy-talk;
  - each companion keeps the speech habits already established for them (listed below);
  - bracketed direction tags stay at the start of a line;
  - audio is name-free, following the original voice rule.
- Hiro is the hero's name in this edition, and he's a man. No line should be unsure of his gender.
- Credits: Hiro has a 200,000 ElevenLabs budget shared with other work. This job should need well under 15,000. Audition 3 rewritten lines per companion and save them for Hiro's approval before recording the rest. Log credits used.

AUDIT FINDINGS (445 lines, 15 companions; Santiago is excluded because he's already rewritten in story_dialogue.js)

A. Errors to fix outright
1. **Kaito, q6_web#2:** "Wardens cut people down for nothing" reads as Wardens killing people. He means cutting people down *out of webs* for free. Reword so it's unmistakable.
2. **Winston, q5_camp_storm:** "Loud. Sawa — fine." "Sawa" is Wanjiru's Swahili, and Winston hasn't met her yet (chapter 5 vs 6). Remove it.
3. **Desmond, q2_where_lie#2 and q2_pair_yes:** "No worry yourself" twice in the same scene. Keep it once.
4. **Hiwot's voice drifts.** She almost never uses contractions ("I am", "I will", "Let us go"), but these do:
   - q1_catchup#2 "I can't";
   - q4_down#2 "I can't";
   - q10_shore#2 "we'd";
   - q14_final_choice#1 "He's";
   - q14_final_restored#2 "Let's".
   Make them match her. Use straight apostrophes throughout: q14_final_* has curly ones.
5. **Hiwot's finale lines are her weakest writing**, at the moment that matters most: q14_final_taken, q14_final_soul, q14_final_choice, q14_final_restored, q14_final_farewell. "I can breathe. I thought I would never…" is generic. Rewrite them in her established voice: quick, funny under stress, fiercely loyal ("you are Tesfaye's"), with concrete details (locks, the honey, Brother Yonas). Same meaning and the same choice outcome.

B. Companions who go silent after they join
With companions about to fight beside Hiro (docs/ASTRA_PROMPT_COMPANIONS_HIRO_VOICE_20261015.md), silence for whole chapters will show. Lines after joining:
- Bahadır, Yasemin and Devendra say nothing after chapter 3, except 3 combat barks each.
- Wanjiru says nothing after chapter 7.
- Dai Morgan says nothing after chapter 9.
- Beau says nothing after chapter 7, if he lived.
- Desmond and Winston have only chapter 2, 7 and 9 beats.
- Yasemin sets up a big thread in chapter 3 ("something in your blood woke … what did it want?") and never mentions it again.

Fix: for each of those companions, write **1–2 short connective lines per later chapter they ride in**. Attach them to an existing beat moment the source already uses for asides (camp, arrival, the q8_door / q9_lobby / q13_maze style group beats), so no new plot is added. Give Yasemin one aura line in chapter 10 or 12 and one in chapter 14 that pays off her chapter-3 question, consistent with Layla's chapter 14 line about Morrak. These are new lines where the source has a gap, so mark each one `// new: gap` in story_dialogue.js and list them in the CHANGELOG.

C. Shared beats that read copy-pasted
Each player hears only the version for whoever is riding, but they're formulaic. Give each its companion's own voice:
- **q9_lobby / q9_lobby_talk** (Hiwot, Delphine, Kaito, Dai Morgan): all four say "Third floor … don't touch anything."
- **q8_door** (Hiwot, Winston, Kaito): all three open with "Doorman."
- **q13_maze_follow** (Hiwot, Kaito): both end "nobody bled".
- **q10_double_strike / _alone / _listen** (Delphine, Layla, Kaito): three near-identical "the real Hiwot was behind it, she's breathing" lines.

D. Combat barks (these become important once companions fight)
- Itsuki and Kaito both shout "Loosing"; give each a distinct call.
- Make sure every companion's three `banter` lines suit their weapon and fighting style in the companions prompt, and add 3 more each, so 6 per companion, so fights don't repeat every few turns.
- Barks must stay short: under about 12 words, readable in a second.

E. Voice and quirks to preserve (don't flatten these)
| Companion | Keep |
|---|---|
| Hiwot | no contractions, fast and funny under fear, locks and theft, "Tesfaye's" |
| Delphine | Southern warmth: "honey", "sugar", "ain't", "Del"; the hard edge when Beau's in danger |
| Beau | the stammer ("w-wore", "G-good"), the shield, "Del" |
| Desmond | gleeful, sing-song, "man", "No worry yourself" (once) |
| Winston | flat, transactional, "man", tired big-brother to Desmond |
| Itsuki | quiet, formal, grief for Hana |
| Bahadır | BOOMING, "Vallahi", "canım", Fındık |
| Yasemin | dry witch, "canım", reads auras |
| Devendra | disdainful, florid, "the large gentleman" |
| Layla | contempt and dry wit, "by the deep" (decide whether "ya stranger" fits a dark elf; keep it only if it's deliberate) |
| Kaito | cheerful performer, apologises, the magistrate |
| Wanjiru | fierce, "Sawa", "Eh?", the Mzee, the trees |
| Dai Morgan | gravelly Welsh: "bach", "there's lovely", stonework, cousins |
| Amara | exact, grave, "Stop him. Not kill him." |

F. Romance and bond lines (decide, don't silently drop)
Itsuki, Layla and Kaito have `bond_*` and `q9_romance*` lines (Santiago's were rewritten). Expeditions has no inn conversation or courtship screen, so these never play.
- Don't rewrite them in this pass.
- Check with a quick search that nothing tries to play them, and tell Hiro in the CHANGELOG that they're unreachable until an inn-conversation feature exists.

DONE MEANS
- Every item in A, C and D is fixed, and B is done for every listed companion, each new line marked.
- Rewritten and new lines are recorded in the right voices.
- Old recordings for replaced lines are no longer referenced, but they're kept on disk.
- A dialogue check passes. Add one to test/story_campaign.js:
  - every overridden beat has a recording;
  - no line has curly apostrophes;
  - no Hiwot line has a contraction;
  - no line contains an "{" placeholder the game can't fill;
  - banter lines are under 80 characters.
- In real play (dev chapter jump), see and hear the rewritten lines in chapters 2, 6, 9, 10 and 14 with screenshots, desktop and phone.
- `npm test`, `npm run test:story` and the story browser tests pass.
- A dated CHANGELOG entry: lines rewritten per companion, new gap lines (with keys), credits used, and anything you chose not to change and why.
- Commit only your own files after checking git status. Nothing is published.
