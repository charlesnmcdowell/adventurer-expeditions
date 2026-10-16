# Companions and Hiro voice — production checkpoint

The user approved the five voice samples and all fifteen proposed kits on October 15. No further audition or kit approval is needed. This is an unfinished production checkpoint, not a declaration that companions are available in normal play.

## Completed voice work

- 200 reachable choice lines recorded with `V8MrPOnARtlsjrlxEsE7`, `eleven_v3`; the five auditions were reused. Ten retired finale options were deliberately not recorded.
- 8,811 spoken characters after the source's name-free audio substitutions. The visible choice text and original NPC recordings remain unchanged.
- Response charge headers total **3,878 credits**, including auditions; reserve 8,811 conservatively against the 40,000 cap. No retakes. The immediate account counter can lag; it is not the authoritative cost of this batch.
- Two-pass loudness normalization targets −22.9 LUFS to match the opening Tesfaye recording. All 200 MP3s decode without errors; runtime audio totals **4,542,941 bytes**.
- A saved intermediate choice step plays Hiro before applying the original choice hook. Continue escapes failed/slow audio. Replay, mute, reload, and duplicate-hook prevention have browser coverage.
- `assets/expedition/story/hiro-voice.json` records exact hashes. The story rebuild validates and retains these edition-owned recordings alongside the original media.
- Source generator, raw masters, normalized masters, scripts and ledger remain in `../adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015/`. No credentials were copied into this repository.

## Companion framework and pilots

`S.Companions.enabled` remains **false**. Test fixtures enable it locally without enabling incomplete companions in the normal story or website package.

- Fifteen source kits, at most two riding companions, chapter one solo, remembered empty/one/two selections, and departed/dead filters are implemented.
- Companion actors are copies, not mutations of Campaign3's cached characters. Knockouts leave the field, do not change story death state, and recover next fight. Hiro's defeat ends the fight even with surviving allies.
- Picker, a 2.4-second join presentation, and an original 2.2-second unpitched welcome flourish are implemented. Recruitment announcements persist once per save, including reload. The percussion avoids a conflicting musical chord and costs no voice credits.
- Original company seating remains authoritative. Portraits, weapon descriptions and both skill names appear in the picker. At the inn the choice sits beside Rest and Continue.
- The source skill id `cleanse` is currently named **Holy Smite** and is offensive. Santiago's approved source pair is Shield Wall / Holy Smite; the older review table's “Cleanse” label should not be interpreted as adding a new cleansing skill.

| Actor | Drawings | Runtime files | Status |
| --- | ---: | ---: | --- |
| Hiwot | 128, eight groups of 16 | 3,116,303 bytes | Registered pilot; broader visual polish still required |
| Desmond | 128, eight groups of 16 | 2,532,320 bytes | Registered pilot; walk replacement needs continued visual review |
| Remaining 13 | 0 | 0 | Not painted yet |

All new paintings use built-in `image_gen`. Prompts, references, rejected drafts, crop coordinates, fixed anatomical registration and contact/release markers are retained. Cropping follows connected character silhouettes instead of slicing through limbs on a guessed grid. The early walk drafts and fourteen-frame attack draft are not used. One edge-touching blade pixel in Hiwot's attack remains flagged for final art QA; this set is not marked production-approved.

Review: `http://127.0.0.1:8742/docs/art/companions-hiro-20261015/pilot.html`. This uses actual packed frames and ground pivots, with frame stepping and normal/half-speed playback.

## Tests and limits of the evidence

- `npm test`, `npm run test:ship`, `npm run test:story` passed. The stale script stamp and misplaced story-only jingle were caught and corrected before the final regression run.
- `test/story_companions.js`: source kits, party limits, death/departure, saved selection, once-only unlock, fresh health, and Hiro-only defeat passed.
- `test/browser_hiro_voice.js`: actual choice audio, reload, skip, replay path, mute, mobile and no duplicate choice hook passed.
- `test/browser_companion_ui.js`: actual picker, newest default pair, swapping, explicit solo, unlock/reload/mute and 390px layout passed under the gated fixture.
- `test/browser_companion_pilot.js`: two actual registered actors in the chapter-two battle scene, sixteen animation groups, four source signature actions, and nonlethal knockout passed. The pilot holds the autonomous fight loop and increases target HP while inspecting actions. **This is not a full chapter-two party playthrough.**
- Evidence lives in `test/reports/story/companions/` and `test/reports/story/hiro-voice/` (generated reports are normally ignored by Git).
- Twenty seeds × 55 encounter slots: solo **1,048/1,100 wins**; one-companion fixture **960/1,100**; two-companion fixture **1,021/1,100**. All had zero unwinnable slots and zero stalls. These are reproducible Hiwot/Winston fixtures, not every legal story roster or support composition.
- An experimental +60% enemy HP per ally made the final confrontation unwinnable; it was reverted. Current party HP multiplier is **1.0**. Companion endurance targets 5.5 comparable basic hits; Hiro's damage tuning is unchanged. Full composition balancing is still required before enabling the feature.
- Website package continues to ship only chapters 1–6 media; the new Hiro audio follows those same filters. Draft companion atlases are excluded while the feature is disabled. The local package was about **431 MB**; nothing was staged to the website or published.

## Remaining work, in order

1. Final visual polish on the Hiwot/Desmond pilots: normal-speed stride, weapon continuity and the flagged blade edge; proper motion screenshots rather than only contact drawings.
2. Produce Winston, Santiago, Beau and Delphine, followed by Itsuki, Bahadır, Yasemin, Devendra, Layla, Kaito, Wanjiru, Dai Morgan and Amara. Each requires eight groups of sixteen distinct drawings; no generated holds as substitutes.
3. Paint missing support/missile effects and measure each release anchor. Resolve basic bow attacks and all support/offensive variants from the actual manifest. Do not reuse an unrelated spell as a placeholder.
4. Verify multi-target enemy reactions with two allies; all damaged/evading targets need a visible response. Verify the source survival rules when a companion lands the final hit.
5. Complete autonomous battle and party balance tests with damage and healing/protection compositions, including actual chapter-two join/pick/fight/KO/next-fight recovery and swapping before chapter three. Re-run the hit-scale measurement without blindly overwriting the approved damage values.
6. Register the complete roster, then enable the feature. Update readiness to validate selected assets before the fight opens; missing art must stop explicitly.
7. Measure finished website companion bytes (only joins through chapter six), exercise the packaged picker and a real party fight, and report against actual hosting headroom. Current pilot sizes suggest room, but do not prove the final roster fits.
8. Update this checkpoint and the changelog, run final gates, commit only this task's changes. No publishing, pushing or portal export.

Keep the other session's existing travel packaging, retry music, Snarl retaliation and Iaido Draw 3.6 changes. The original game and synced shared modules remain read-only.
