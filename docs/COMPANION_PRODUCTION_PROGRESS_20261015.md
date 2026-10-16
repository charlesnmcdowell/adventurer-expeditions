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
| Winston | 128, eight groups of 16 | 1,798,601 bytes | Registered pilot; both source skills and nonlethal knockout passed in browser |
| Santiago | 128, eight groups of 16 | 4,274,300 bytes | Registered pilot; Shield Wall and Holy Smite passed in browser; spear/stance transitions still need polish review |
| Beau | 128, eight groups of 16 | See atlas files | Registered pilot; two wider eight-frame sources per attack avoid clipping |
| Delphine | 128, eight groups of 16 | See atlas files | Registered pilot; Mend, Thorn Skin and nonlethal knockout passed in browser |
| Remaining 9 | Chapter-three idle references and Itsuki motions underway | 0 runtime bytes | Not integrated yet |

Four pilot sets total **11,721,524 bytes**. A separate companion-only effects atlas adds **558,268 WebP bytes** for Whisper of Ending, Shield Wall, Holy Smite and Thorn Skin. Source-cell alpha at every crop edge is at most 2/255; packing adds transparent sampler gutters. The first crowded effect draft is retained but excluded. Original enemy effect mappings are unchanged. These pilots and companion-only effects remain excluded from the gated website package.

The second party slot moved from x=200 back to **x=150** because short Winston was hidden behind Hiwot. Companion casting now supplies its target and measures the left edge of all cast drawings before stepping into a safe x-position; successful completion and interruption both restore the formation. Both use and hit sounds now accompany companion moves. This solves crop/placement behavior, not all outstanding party composition or art quality work.

All new paintings use built-in `image_gen`. Prompts, references, rejected drafts, crop coordinates, fixed anatomical registration and contact/release markers are retained. Cropping follows connected character silhouettes instead of slicing through limbs on a guessed grid. The early walk drafts and fourteen-frame attack draft are not used. One edge-touching blade pixel in Hiwot's attack remains flagged for final art QA; this set is not marked production-approved.

Review: `http://127.0.0.1:8742/docs/art/companions-hiro-20261015/pilot.html`. This uses actual packed frames and ground pivots, with frame stepping and normal/half-speed playback.

## Tests and limits of the evidence

- `npm test`, `npm run test:ship`, `npm run test:story` passed. The stale script stamp and misplaced story-only jingle were caught and corrected before the final regression run.
- `test/story_companions.js`: source kits, party limits, death/departure, saved selection, once-only unlock, fresh health, and Hiro-only defeat passed.
- `test/browser_hiro_voice.js`: actual choice audio, reload, skip, replay path, mute, mobile and no duplicate choice hook passed.
- `test/browser_companion_ui.js`: actual picker, newest default pair, swapping, explicit solo, unlock/reload/mute and 390px layout passed under the gated fixture.
- `test/browser_companion_pilot.js`: Hiwot paired separately with Desmond, Winston and Santiago in the chapter-two battle scene. Each fixture checks sixteen animation groups, four source signature actions and nonlethal knockout. Set `PILOT_COMPANION` to `vess`, `fennick` or `cassian`. The pilot holds the autonomous fight loop and increases target HP while inspecting actions. **This is not a full chapter-two party playthrough.**
- The four-actor review page loads packed frames, switches animations and steps frames without page errors. New lifecycle checks cover rear-slot companion casts returning safely on completion/cancellation and companion-only effects freezing/cleaning up correctly.
- Evidence lives in `test/reports/story/companions/` and `test/reports/story/hiro-voice/` (generated reports are normally ignored by Git).
- Twenty seeds × 55 encounter slots: solo **1,048/1,100 wins**; one-companion fixture **960/1,100**; two-companion fixture **1,021/1,100**. All had zero unwinnable slots and zero stalls. These are reproducible Hiwot/Winston fixtures, not every legal story roster or support composition.
- An experimental +60% enemy HP per ally made the final confrontation unwinnable; it was reverted. Current party HP multiplier is **1.0**. Companion endurance targets 5.5 comparable basic hits; Hiro's damage tuning is unchanged. Full composition balancing is still required before enabling the feature.
- Website package continues to ship only chapters 1–6 media; the new Hiro audio follows those same filters. Draft companion atlases are excluded while the feature is disabled. The local package was about **431 MB**; nothing was staged to the website or published.

## Remaining work, in order

1. Final visual polish on all four pilots: normal-speed stride, weapon continuity, Hiwot's flagged blade edge and Santiago's guard/cast transitions; proper motion captures rather than only contact drawings.
2. Finish Beau and Delphine, followed by Itsuki, Bahadır, Yasemin, Devendra, Layla, Kaito, Wanjiru, Dai Morgan and Amara. Each requires eight groups of sixteen distinct drawings; no generated holds as substitutes. Beau's first attack has 15 connected figures (two poses join) and clipped steel; Cleave also touches the outer edge. Replace these with more spacious authoring layouts, keeping rejected sources. Do not repeatedly regenerate approved assets.
3. Paint missing support/missile effects and measure each release anchor. Resolve basic bow attacks and all support/offensive variants from the actual manifest. Do not reuse an unrelated spell as a placeholder.
4. Verify multi-target enemy reactions with two allies; all damaged/evading targets need a visible response. Verify the source survival rules when a companion lands the final hit.
5. Complete autonomous battle and party balance tests with damage and healing/protection compositions, including actual chapter-two join/pick/fight/KO/next-fight recovery and swapping before chapter three. Re-run the hit-scale measurement without blindly overwriting the approved damage values.
6. Register the complete roster, then enable the feature. Update readiness to validate selected assets before the fight opens; missing art must stop explicitly.
7. Measure finished website companion bytes (only joins through chapter six), exercise the packaged picker and a real party fight, and report against actual hosting headroom. Current pilot sizes suggest room, but do not prove the final roster fits.
8. Update this checkpoint and the changelog, run final gates, commit only this task's changes. No publishing, pushing or portal export.

Keep the other session's existing travel packaging, retry music, Snarl retaliation and Iaido Draw 3.6 changes. The original game and synced shared modules remain read-only.

## October 16 continuation

Beau and Delphine join the four earlier registered pilots. Their signature actions and knockouts passed the battle fixture. Beau uses two wide eight-frame sheets for both his basic strike and Cleave; they retain sixteen distinct drawings, with separate anatomical registration for each half. Delphine’s rejected extended staff strike was replaced; her corrected short overhead strike contacts at frame 8. Her detached staff component on Mend frame 13 is retained with its owner during extraction.

A second companion-only atlas adds Mend, Regenerate, Defiant Stand and Counter Attack: 399,008 bytes. Only measured alpha noise up to 12/255 is removed from this sheet’s crop margins; visible effects remain. Enemy effect mappings are unchanged. Multi-target enemy strikes now show secondary party damage and evade/block reactions at contact; the lifecycle suite has 41 passing cases. Basic bow attacks use the painted arrow path rather than a melee lunge.

Four chapter-three identity/idle sheets are saved; Itsuki’s remaining motions are in progress. These are not enabled in normal play. Final autonomous party QA, source-survivor assertions and full composition balance are still outstanding.
