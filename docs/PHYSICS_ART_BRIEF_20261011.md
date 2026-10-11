# Physics and open-road art brief — for Astra

Written 11 October 2026 for the physics and open-road proposal. Code for each drop is built or specified so the art plugs straight in. Match the existing standard: painted anime cel-shaded finish, side view at eye level, true transparency (never a painted checkerboard or grey matte), no text, no logos, no UI. Save every prompt and output path beside the art, as earlier rounds did. Generate one test asset per category and get Hiro's approval before the rest (the forest travel beat showed this saves most rework).

Runtime scale: Hiro stands about 330 px tall on screen; the combat floor is at y = 612 on a 1280 × 760 stage. Paint props at twice their runtime size.

---

## 1. Battlefield props (code ready: `js/expedition/props.js`)

**Deliver per location:** one transparent PNG sheet, 2048 × 2048, a 4 × 4 grid of 512 × 512 cells. Each prop is centred in its cell with its base on a line at 85 % of the cell height, at least 40 px clear on every side. Cells 13–16 hold the debris for the breakable props (four shards per breakable, spread inside the cell).

**Lighting:** soft neutral daylight from upper left, no cast shadow baked in (the game draws contact shadows and grades night and storm itself).

| Location | Props (runtime size in px, w × h) | Breakable |
|---|---|---|
| Forest road | wooden crate 80 × 70, small barrel 60 × 80, broken cart wheel 90 × 90, mossy rock 70 × 45, fallen branch 160 × 26, iron lantern 32 × 56, wooden bucket 42 × 46 | crate, bucket |
| Swamp | half-rotten log section 130 × 50, clay pot 46 × 54, coil of rope 56 × 30, cracked skull 34 × 30, leaning reed bundle 40 × 90, sunken barrel 60 × 70, bottle gourd 24 × 40 | pot, gourd |
| City | market crate 80 × 70, basket of apples 64 × 52, water barrel 64 × 86, cobblestone chunk 50 × 34, wooden signboard 70 × 90, clay jar 44 × 60, cart wheel 90 × 90 | crate, basket, jar |
| Coast | driftwood 150 × 30, lobster trap 76 × 52, ship's barrel 62 × 84, small anchor 66 × 80, shell-crusted rock 72 × 48, coiled rope 56 × 30, broken oar 170 × 20 | trap |
| Citadel | stone urn 50 × 66, rune lantern 34 × 60, stack of spell tomes 54 × 40, crystal cluster 46 × 52, small marble bust 44 × 60, porcelain vase 36 × 58, bronze brazier 60 × 70 (stays put) | urn, tomes, vase |

**Prompt skeleton:**
> Use case: production game props. Adventurer Expeditions, detailed anime cel-shaded painted finish matching the reference battle plate. ONE transparent PNG, 2048 × 2048, exactly 4 columns × 4 rows of 512 px cells, no grid lines. Side view at eye level. Cells 1–7 (row-major): [list for the location]. Each object alone, centred, resting on an invisible ground line at 85 % of its cell height, generous empty margin, no cast shadow, soft neutral daylight from upper left. Cells 13–16: four broken shards each of [breakables], scattered within the cell. Real alpha transparency, no checkerboard, no matte, no text, no characters.

**Intake (code side):** cut into an atlas plus `assets/expedition/props/<location>/props.json` with, per prop, its frame, runtime size, collision shape (box or circle), mass class (light, medium, heavy) and debris frames. The props module reads this; locations without a file simply have no props.

---

## 2. Segmented ragdoll pilot (wolf and elven ranger)

A ragdoll needs the body as separate pieces joined at pivots. Paint the pieces, not a pose.

**Deliver per creature:** one transparent PNG, 2048 × 1024, every piece separate with 30 px of clear space around it, painted at the same scale as the creature's existing combat sheet (300 px standing reference), in a neutral side view facing left. Plus one assembled reference image of the same pieces put together in a relaxed standing pose, so joints can be registered.

| Creature | Pieces |
|---|---|
| Wolf | head with ears and jaw, neck and chest, torso and hips, tail, front leg near, front leg far, hind leg near, hind leg far (8) |
| Elven ranger | head with hair, torso, pelvis, upper arm ×2, forearm and hand ×2, thigh ×2, shin and boot ×2, bow (12) |

Each piece overlaps its neighbour by 10–15 % at the joint, with the overlap painted as a rounded end (shoulder ball, hip, knee), so rotating limbs never show a gap or a hard cut. Same costume, colours and markings as the existing sprites. No blood on the pieces (the gore layer adds it on the website build).

**Prompt note:** "Production cut-out rig, all body parts separated and laid out flat with clear space, rounded overlapping joint ends, same character design and scale as reference, transparent background, no text."

---

## 3. World map (for map travel)

**Deliver:** one painted map, 2560 × 1440 (16:9, also right for Poki), top-down three-quarter illustrated fantasy map in the same painterly anime finish, warm parchment edges, no text, no labels, no compass lettering (the game draws names). It must show, with clear open ground around each site for a tappable marker:

- the forest road and its rain-soaked woods, the swamp, the walled city, the shipwreck coast and the arcane citadel on its cliff;
- roads linking them (forest to swamp, forest to city, city to coast, coast to citadel, swamp to citadel);
- three unclaimed sites for later updates: a mountain pass, a desert ruin and a frozen lake.

Deliver the plain map and a second copy with a small red dot on each site, used only to register marker positions.

---

## 4. Road segment kit (for map travel)

Roads are assembled from segments, so each segment must tile with any other of the same region.

**Deliver per region, starting with the forest:** four segments, each three layers exactly as today's travel (far 2280 × 760 opaque, ground 2280 × 760 transparent above the path, near 2280 × 760 transparent foreground strip), with the path entering at the left edge and leaving at the right edge at **exactly y = 612** so segments join. Inside the segment the path may rise or dip by up to 60 px.

Forest segments: level road through trees; gentle hill up and down; wooden bridge over a stream; overgrown ruins beside the road.

Also deliver one **ground line** per segment: a copy of the ground layer with the walkable surface traced as a single 4 px bright green line. It is used only to build the collision line Hiro runs on.

---

## 5. Road event vignettes

Small painted scenes placed on the road when an event fires. Transparent PNG, one per event, 1024 × 768, sitting on y = 612 of a 1280-wide frame.

| Event | Vignette |
|---|---|
| Merchant | travelling merchant's cart with a canvas awning and a lantern, merchant waving |
| Shrine | small roadside stone shrine with offerings and a soft glow |
| Treasure | half-buried chest at the roadside, lid ajar |
| Traveller | a wounded traveller sitting against a milestone |
| Ambush | three silhouettes stepping out of the trees (a teaser before the fight cuts in) |

---

## Order

1. One location's prop sheet (forest), approve, then the other four.
2. Wolf rig, approve, then the ranger.
3. World map.
4. Forest road kit and its ground lines, then the events.
