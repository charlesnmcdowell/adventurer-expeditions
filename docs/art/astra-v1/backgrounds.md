# Astra v1 environment plates

Created 2026-09-19 for GDD v0.7 §15.2 item 7. Built-in image generation was used; no API/CLI fallback. Original Adventurer files and existing Expedition assets are unchanged. These are art deliverables, not runtime integration.

## Files

All images are **1672 × 941**, opaque RGB, approximately 16:9. Preserve the native aspect ratio. Master PNGs are archival source; **ship only the WebPs**, not both formats.

| Scene | Master | Runtime candidate | WebP size |
|---|---|---|---|
| Bandit camp | `assets/expedition/astra-v1/backgrounds/bandit-camp.png` | `assets/expedition/astra-v1/backgrounds/bandit-camp.webp` | 634,128 bytes |
| Toll-house alley | `assets/expedition/astra-v1/backgrounds/toll-house-alley.png` | `assets/expedition/astra-v1/backgrounds/toll-house-alley.webp` | 536,972 bytes |

WebPs were encoded directly from the PNG masters at quality 90 / method 6 with no resize or pixel editing.

SHA-256:
- Bandit camp WebP: `06661346f673727b3859b49fe2e7d00ab375060386acb1e7f19a00850904b17f`
- Toll-house alley WebP: `d880b2e33444b4822d9a1dc2bfa9772cc7a25ad8217786922a1f70c95f63c41f`

## Composition and art QA

Both generated masters and both encoded WebPs were visually inspected. The established detailed painted anime material treatment, masonry, vegetation, light and atmosphere are retained. They are side-on stages with a broad clear horizontal combat lane, rather than a road receding directly away from the player. There are no characters, UI or visible lettering.

- **Camp:** weathered tents and lookout behind the lane; palisade, cart, barrels and supplies tell the contract's story. Bright, warm light contrasts the cool forest mass. Clear floor begins at roughly 58% image height. Central playable band is x = 12–88%, y = 64–84%; actors can stand there without covering clutter.
- **Alley:** toll-house service elevation, shuttered counting window, solid door, arch and stored customs goods. Clear cobbled floor begins around 64% height. Central playable band is x = 8–92%, y = 67–88%. Rich architecture is above/behind the action.

Coordinates are normalized to the full source plate and are **integration suggestions**, not live engine tags.

## Future atmosphere anchors

These are visual anchor suggestions for Fable's existing scenery/effects system. No animation is embedded in these still plates; no parallax layers or seamless tiles are supplied.

- Camp cold fire ring: about **(0.514, 0.529)**. Optional small animated flame/smoke can be overlaid behind actors. Keep the flame below the pot.
- Camp cloth: pennants around **(0.147, 0.28)** and **(0.91, 0.23)**, lookout canopy around **(0.41, 0.09)**. Cloth is painted in the master; do not add a second moving copy on top without removing/replacing the underlying cloth in a separate asset pass.
- Camp atmosphere: subtle drifting motes over the rear tree line; restrained leaf motion at edges. Ground shadows are painted, so major moving sunbeams would require coordinated treatment.
- Alley lantern: around **(0.482, 0.30)**, with painted warm light. An animated low-amplitude glow may sit on that source.
- Alley shallow foreground puddles: roughly **(0.79, 0.88)** and **(0.16, 0.87)**; subtle specular shimmer may work without changing floor geometry.
- Alley hanging cloth remains part of the flattened master. Independently moving awnings/pennants need extraction and a clean underlying wall patch before implementation.

## Limitations and intake

These are finished **static base plates**, not completed animated environments. Runtime loading, in-engine sprite contrast, phone cropping, HUD clearance, performance and effect placement still need Fable's integration pass. The 1672×941 native output is enough for the current game canvas but is not a native 1920×1080 master. Avoid upscaling and claiming additional detail. Plates are not tileable; scroll a short distance within available crop or transition to another plate instead of looping a visible seam.

The two WebPs total 1,171,100 bytes. Replace their predecessor plates in the build allowlist when adopted rather than adding both sets to the initial download. Keep the masters out of browser preload and release packaging.

## Provenance

Reference images (style only; original files unchanged):
- `assets/anime/v2/runtime/camp.webp`
- `assets/anime/v2/runtime/alley.webp`
- `assets/anime/v2/runtime/forest.webp`

Generated originals:
- `C:/Users/charl/.codex/generated_images/01a0b9f3-fa8b-7832-bd71-550af509d4b9/exec-fc785725-5625-4135-b126-69fa9dee7fbf.png`
- `C:/Users/charl/.codex/generated_images/01a0b9f3-fa8b-7832-bd71-550af509d4b9/exec-e59b53c8-014f-4adc-9468-a449f2452bf3.png`

## Exact generation prompts

### Bandit camp

Use case: stylized-concept.
Asset type: finished 2D side-scrolling fantasy RPG battle background plate, high fidelity wide 16:9 landscape.
Primary request: paint an ORIGINAL BANDIT CAMP environment for Adventurer: Expeditions. Match the detailed painted anime environment craftsmanship, natural color, architectural materials, crisp cel-shaped light and shade, lush vegetation, and atmospheric depth of the three attached STYLE REFERENCES. Their compositions are not edit targets. This new scene is a side-view battlefield, not a portrait backdrop.
Scene: a secluded forest clearing used by highway bandits. At the rear of the clearing sit two weathered olive-and-tan canvas tents, a rough timber lookout platform and low uneven log palisade, neatly clustered supply crates and rope-bound barrels, one parked unhitched handcart. Dark green forest and hazy wooded hills behind. A cold stone fire ring is tucked behind the combat strip toward a rear tent, unlit so runtime animated flame may later be added. Small unmarked cloth pennants hang from camp poles, designed for later animation overlays. No written signs or lettering.
Composition: eye-level side-view wide stage, horizontal readable ground plane spanning the entire image. Bottom 38 percent is an OPEN UNOBSTRUCTED packed-earth and short-grass combat lane with subtle texture, no major prop, no tree root crossing it, no tall foliage hiding feet. Natural boundary foliage only at far left/right edges. Tent doors and all props begin behind the combat lane. Clear silhouettes against the middle ground, with a darker forest mass at back and soft lighter openings for depth. The scene must support heroes on the left fighting enemies on the right. Broad lateral composition; do not aim a road toward a central vanishing point. No characters, animals, people, shadows cast by absent characters, UI, typography, captions, borders or watermarks.
Lighting: warm late-afternoon sunlight from upper left, believable dappled light, soft atmospheric haze. High-quality finished painted anime film background matching the references; rich detail in rear set dressing, restrained detail in the combat lane. No photorealism, no low-poly 3D, no chibi simplification, no gore.
Deliver one complete environment image, not a contact sheet.

### Toll-house alley

Use case: stylized-concept.
Asset type: finished 2D side-scrolling fantasy RPG battle background plate, high fidelity wide 16:9 landscape.
Primary request: paint an ORIGINAL TOLL-HOUSE ALLEY environment for Adventurer: Expeditions. Match the detailed painted anime craftsmanship, natural colors, crisp cel-shaped light and shade, textured masonry/timber, and atmospheric depth of the attached style references. The refs establish painting style only. Their compositions are not edit targets.
Scene: the broad service alley beside a medieval city toll house, viewed ACROSS the alley rather than looking down its length. Background is a readable side elevation of a weathered stone-and-timber customs building: securely shuttered counting window, stout iron-banded side door and lintel, timber balcony above, a few stacked customs crates and bound barrels parked tightly against the wall, iron lantern brackets and ivy. Toward the right background an arched checkpoint passage frames a glimpse of a sunlit city street and distant tower; the arch is behind the play lane, never blocking the path. A suspended unmarked cloth awning and two small blank pennants provide future animation anchor opportunities; no symbols, writing or lettering.
Composition: eye-level side-view wide stage; horizontal ground plane spans all the way left to right. Bottom 38 percent is a CLEAR UNOBSTRUCTED broad cobblestone combat lane, enough room for a party fighting guards. Keep ground quietly textured, a shallow gutter and small reflective damp patches tucked near the far back wall. All barrels/crates/stairs/doors sit BEHIND the fighting lane. Only restrained plants at extreme edges, no large foreground prop obscuring feet. Main building occupies upper/middle field; wall openings and irregular stone give depth without noisy clutter. Side-on lateral arrangement, do not make a central alley recede directly away from camera. No characters, animals, people, weapons, character shadows, text, posters, UI, logos, captions, borders or watermarks.
Lighting: cool shaded alley with warm late-afternoon sunlight raking from upper left onto roofs and upper wall, balanced readable middle ground, soft blue aerial perspective visible beyond arch. Polished painted anime film background coherent with original Adventurer assets, richly detailed behind a restrained arena floor. No photorealism, no low-poly 3D, no chibi, no horror or gore.
Deliver one complete environment image, not a contact sheet.

