# Astra source-art delivery — 19 September 2026

Start with [the visual gallery](index.html). All artwork is inside this offshoot; the original Adventurer website game was not changed.

## What this delivery means

This is a **painted source-art package for Fable's animation intake**. It includes complete painted action poses rather than separate body parts or puppet rigs. The game still uses its existing visuals until Fable extracts, registers, packs, wires and reviews these frames.

Hiro remains the opening playable character: dark brown skin, purple locs, graphite/purple cyberpunk samurai armor, katana. Bram is the first selected hero being developed after the tutorial. He does not replace Hiro.

| GDD area | Supplied | Current state |
|---|---|---|
| Hiro opening hero | Identity reference; ready/draw, locomotion, reactions, counters, katana skill tiers, aura tiers, paired wolf contact, finishers and sheathing victory | Source sheets; see Hiro manifest for preferred revisions and exact coverage |
| First picked hero: Bram | 12 solo clips, arm/leg wolf interactions, four paired finisher categories | 96 selected drawings; starter duelist outfit only |
| Beasts | Dire wolf full action set; boar, thorn lurker and Alpha action/reaction/defeat sources | Per-species manifests distinguish motion clips from proof keys |
| Paired finishers | Bram with wolf, plant, human bandit and Alpha; Hiro wolf finishers at three tiers | Both figures painted together; only supported identities may use them |
| Shared human choreography | Approach, slash, cast, hit and down | 25 drawings of one female bandit exemplar |
| Effects / skill icons | 16 effects, 29 skill/perk icons and 3 tier rims | Source textures and exact region maps |
| Environment plates | New bandit camp and toll-house alley | Static painted base plates with suggested atmosphere anchors; WebP candidates supplied |

The gallery presents **preferred sources only**. Old drafts remain alongside them as provenance, excluded from the gallery and preferred manifests.

## Where to find things

- All new images: `assets/expedition/astra-v1/`
- Hiro: [hiro.md](hiro.md), [manifest.json](../../../assets/expedition/astra-v1/heroes/hiro/manifest.json)
- Bram: [bram.md](bram.md), [bram-clips.json](bram-clips.json), [source QA](bram-source-qa.md)
- Beasts: [beasts.md](beasts.md), [beasts-clips.json](beasts-clips.json)
- Human exemplar: [humans.md](humans.md), [humans-regions.json](humans-regions.json)
- Effects/icons: [effects-icons.md](effects-icons.md), [effects-icons-regions.json](effects-icons-regions.json)
- Environments: [backgrounds.md](backgrounds.md)
- Source intake and current renderer findings: [ART_INTAKE_NOTES.md](ART_INTAKE_NOTES.md)
- Generated file inventory, image decode and metadata checks: [delivery-validation.json](delivery-validation.json)

Exact built-in image_gen prompts and original output paths are retained in the corresponding `*-prompts.json` files; background prompts are embedded in their notes. No external artwork was downloaded, no new voice recordings or music were purchased, and existing artwork was not overwritten.

## Fable's next work, in order

1. **Prove one short clip.** Use Bram's selected slash and Hiro's selected slash L1. Extract complete silhouettes, register their feet/body scale and retain the frame origins. Review the faces and weapons against their existing game portraits.
2. **Make the frame player work.** The inspected Actor creates a Phaser Image but calls `.play()`; sheets are not assigned by the scene. It also needs clip-local contact/release events, loop policy and variable frame holds. See the intake notes for exact findings; this art pass does not fix or certify the code.
3. **Register contact and paired clips.** Hide the normal hero/opponent while their shared paired drawing plays. Fire combat events once from simulation, not once per repeated frame. Restore the correct living/defeated actors. Check pause, background/resume and reduced motion.
4. **Preview complete moves.** Ready → idle → wind-up → contact → recoil → guard, then victory → travel. Do not enable every sheet just because it decodes. Correct any visible anatomy, weapon, scale or costume drift before greenlight.
5. **Apply the proposed impact values.** The manifests contain draft contact holds, flashes, shake and drift. They require in-engine art direction before becoming final `X.impact` values. Reduced motion must retain gameplay timing while removing camera shake/zoom and full-screen flash.
6. **Optimize and stage the load.** Preserve the large masters outside the runtime preload. Pack and compress consumed frames into scene-specific atlases; load later contracts after the opening. Measure the real first-gameplay download; this folder is not a release bundle.
7. **Run the existing game checks after integration.** Simulation, browser journey, isolation/sync check, mobile readability and performance. The source-only validation here does not replace those tests.

## Open visual work and scope limits

**Not yet an animation greenlight.** The image generator returned mixed RGB/RGBA, white or colored mattes, irregular grids and inconsistent margins. Some sources require custom masks where cloth or weapons extend across a cell midpoint. Ground line, scale, face, weapon, shield and costume continuity must be assessed in actual playback. Concrete findings and preferred repairs are recorded per set.

**The human reuse assumption needs care.** A fully painted human frame includes the head and outfit. Replacing a bust alone would reintroduce the detached-head/puppet problem. This delivery supplies one human choreography exemplar, not a completed visual variant for every bandit, watchman, mage or rival. Reuse timing and movement design; paint identity/outfit variants as needed.

**Gear and other heroes remain staged.** Bram's purchased Plate Harness needs its own action variants. Nyx and Sable have skill icons, but no full body clip sets in this pass, consistent with the GDD's one-picked-hero-first priority. They remain separate work after the first pipeline is proven.

**Finishers are identity-specific.** Do not use a painted wolf against a boar, the female bandit against every human, or a starter-outfit Bram after a plate purchase. No finisher is authored for the deliberately unwinnable Pass Tyrant. Use truthful supported fallbacks until matching art exists.

**Background animation remains integration work.** The camp and alley are still base paintings; lantern shimmer, motes, smoke and appropriate environmental motion need the runtime effects pass. They are not seamless scrolling panoramas or separate parallax layers.

## Review status

Source sheets were visually inspected and several clipped/extra-limb drawings were repaired. Final intake regions and metadata checks are recorded in the linked files. This delivery does not claim in-game motion quality, content-rating approval, storefront acceptance, publication or runtime performance.

Final source checks passed: **82 preferred image files**, all **100 source/reference/revision images** decoded, **152 mapped rectangles** in bounds, selected file paths and documentation links present, and clip counts/timing indices valid. The preferred set contains **362 character/beast drawings or pose studies**, 48 effect/icon cells and two environment plates; references are not included in those drawing counts.

The static gallery passed headless Chromium checks at **1440×1000** and **375×812**: no broken images, working category/search filters, and no horizontal overflow on the phone layout. See [gallery-validation.json](gallery-validation.json). These checks exercise the art review page only. Runtime tests were not run because this pass changes no game code and installs none of the art.

To rebuild the local inventory/gallery after later art revisions, run `python docs/art/astra-v1/build_review.py` from the Expeditions folder. `check_gallery.cjs` uses this machine's bundled Playwright path for optional local gallery verification. Neither helper edits images or game files.
