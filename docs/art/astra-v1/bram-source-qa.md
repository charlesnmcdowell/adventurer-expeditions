# Bram source-board QA and extraction regions

Read-only art QA, 2026-09-19. No source PNG, runtime code, gameplay data or Bram clip manifest was modified. This pass creates this report and `bram-source-regions.json` only.

## Result

**14 selected source sheets / 78 visibly drawn poses inspected.** These are useful painted source boards; they are **not ready-to-load uniform sprite atlases**.

No obvious severe extra limb or fully cropped head/foot was identified in the selected solo/leg drawings during this still-image pass. That does not establish animation quality: matte quality, planted feet, scale, body/weapon continuity and timing still require extracted playback. The selected “clean” sheets solve prior large clipping problems but do not supply registered sprite frames.

| File | Actual pixels | Drawn poses | Mode |
|---|---:|---:|---|
| idle_clean.png | 1024 × 1536 | 4 | RGB |
| walk_clean.png | 1774 × 887 | 8 | RGB |
| draw.png | 1536 × 1024 | 8 | RGB |
| short_draw.png | 1254 × 1254 | 4 | RGBA |
| slash_clean.png | 1536 × 1024 | 6 | RGB |
| hit_short.png | 1774 × 887 | 3 | RGBA |
| roll.png | 1536 × 1024 | 6 | RGB |
| intercept.png | 1536 × 1024 | 5 | RGB |
| riposte_clean.png | 1536 × 1024 | 6 | RGB |
| cast.png | 1227 × 1282 | 6 | RGB |
| victory.png | 1536 × 1024 | 8 | RGB |
| kneel.png | 1024 × 1536 | 4 | RGB |
| bite_leg_a_clean.png | 1536 × 1024 | 6 | RGB |
| bite_leg_b.png | 1536 × 1024 | 4 | RGB |

## Most important intake corrections

1. **`intercept.png` has unequal columns:** boundaries x=512 and x=1099. The lower-right cell is empty. A default 3-column spritesheet loader cuts the second-column sword and misplaces the third figure.
2. **`cast.png` is 1227 × 1282**, with column boundaries x=400 and x=827, row boundary y=641. It is not a 1536 × 1024 sheet and its cells are not square.
3. **`kneel.png` cannot be sliced at y=768.** First-row sword/boot detail extends below that midpoint. The suggested intake row boundary is y=832, in the clear gap above the lower figures.
4. **`slash_clean.png` lower-left frame 4 extends past x=512.** Its sword is intact in the source but a naive equal-grid crop would cut it. The JSON widens that frame to x=536; frame 5 starts at x=548.
5. **`bite_leg_a_clean.png` has a few silhouettes past nominal cell boundaries.** In particular, the lower-left wolf rear paw reaches into the next 512-pixel column. Intake crops overlap intentionally. Crop rectangles alone cannot separate neighboring subjects: use a per-frame foreground mask and preserve the paired figures together.
6. **`riposte_clean.png` contains six drawn poses**, although the older GDD budget specified five. Let the clip manifest explicitly select/order them instead of silently dropping a pose.

The exact coordinate rectangles are in `bram-source-regions.json`. They are practical source extraction regions, **not alpha-trimmed sprite bounds**, and intentionally still include background or divider strokes. Root owns final `bram-clips` metadata.

## Baseline and continuity

Most standing/guard sheets have approximately consistent sole height **within each source row**, but none encodes a reliable runtime origin. Auto-trimming each frame and centering the resulting image would make Bram slide and bob. Mark the support-foot ground point or root explicitly, then align the drawings before packing.

Rolling, kneeling and the paired bite should **not** share a “lowest visible pixel = foot baseline” rule. A sword tip, shield rim, inverted boot or wolf paw may be the lowest point. Root motion and paired group registration are part of intake.

The paired bite boards have different Bram source-pixel scales: six small pairs in A, four larger pairs in B. Normalize the **whole pair** to the same Bram body scale at the A→B transition; never scale the wolf independently or shift it away from its drawn contact.

Weapon continuity is broadly coherent: right hand sword, left arm shield. Draw/victory show a partly concealed blade during unsheathing/sheathing, which is intentional. However the exact scabbard-mouth/blade path, lengths under foreshortening and shield orientation must be reviewed in sequence. No still sheet can prove those transitions smooth.

## Sheet-specific notes

### idle_clean.png

Approximate foot ground-line consistent across the four source cells; breathing/cloth changes subtle. Register to boot sole, not auto-trim center.

No severe clipping or anatomy defect identified in the still-sheet inspection.

### walk_clean.png

Grounded soles near row bottom; small per-frame vertical shifts remain. Different foot contacts/passing poses require explicit contact registration; loop continuity not proven.

- Painted divider strokes must be removed. Verify alternating leading leg in playback; repeated contact poses may need timing changes.

### draw.png

Grounded boot soles vary modestly around the row baseline; knees lower the torso intentionally. No fixed pivot encoded.

- Blue/gray background must be masked. Frame 6 raised sword approaches top of lower row; preserve its tip.

### short_draw.png

Grounded baseline broadly consistent after row offset. Center-of-crop varies substantially due to overhead sword.

- Blade alpha fringe/light edge requires dark-background check. Source border padding limited at bottom and final sword tip.

### slash_clean.png

Feet and stance span change with lunge. Register support foot/hips and intentional root lunge; don't normalize each crop by center.

- Frame 4 blade crosses nominal x512 boundary; use widened region below. Frame 3 sword tip close to outer right edge but visible.

### hit_short.png

Lowest boot soles approximately stable across all three frames; torso compresses and recovers. Root needs common ground calibration.

- White/light alpha fringe around swords needs compositing review; do not aggressively cut blade highlight.

### roll.png

No stable foot baseline is appropriate: frames 3–4 are inverted/sideways. Register rolling body/root path, then use boots only on entry/exit.

- Blue/gray matte and white dividers need removal. Shield/sword rotate with body; no extra limbs identified, but roll arc unverified in playback.

### intercept.png

Feet roughly stay near ground line, but lunge/contact root changes. Unequal cell widths must not affect actor scale.

- Unequal columns: x512 and x1099. Five drawn poses; lower-right cell empty. Remove grid strokes before trim.

### riposte_clean.png

Forward thrust changes stance; baseline roughly stable by row but per-frame pivot is not. Hold supporting heel through thrust.

- Six source poses exist, not five. Frame 3 long blade tip has very tight right margin. First and last guards are similar but not identical.

### cast.png

Boot soles approximately line up within rows; cast stance and raised sword change bounds rather than intended body size.

- Unequal 400/427/400-wide columns, not square frames. Golden aura/glows baked over white need careful matte. Lower-left sword begins close to row divider.

### victory.png

First seven poses have a broadly shared planted baseline; final pose intentionally steps. Registration must preserve this step rather than locking both feet.

- Sword becomes partially inserted during frames 4–6 then sheathed in 7–8; don't interpret shortened visible blade as an extra weapon. Check scabbard alignment in sequence.

### kneel.png

Ground contact switches boots→knee→seated body/shield. Lowest sword point is not a reliable root marker.

- Nominal y768 slice cuts first-row sword tips/feet. Use row boundary832. Lower-row poses occupy shorter cells; never scale each frame to its full crop height.

### bite_leg_a_clean.png

Support boot stays grounded through grip/lift but apparent pair size differs from bite_leg_b. Calibrate Bram height once, with both figures scaled together.

- Six paired poses. Neighboring silhouettes cross nominal x512 boundaries; overlapping intake rectangles require per-frame foreground masks. Paw/boot contact migrates from shin to boot as the leg lifts; inspect sequence.

### bite_leg_b.png

Support boot ground line broadly consistent. First-frame Bram is larger in source pixels than bite_leg_a; pair must be registered as one unit across both boards.

- Four paired poses. Shield and raised boot both meet wolf at kick frame; actual wolf release/contact needs beat tagging. Last two frames show grounded recovery. Remove divider strokes.

## Matte and playback requirements

- Twelve of the fourteen selected files are **RGB source boards**; only short_draw and hit_short are RGBA. Remove the plain white or blue-gray background, fine dividers and any residual fringe before compositing.
- White blade highlights and gold casting glow are part of the drawing. A simplistic white-color key can remove them; preserve their soft edges.
- Clean alpha alone does not make a loop. Review each sequence at intended screen size and at 0.25× beside the existing art, including the transition from idle to draw, slash to guard, and bite A to bite B.
- Loop the walk before approval and check that the correct leading leg alternates, supporting feet do not skate, and head size does not pulse.
- Contact/release indices and event timing remain in the root-authored clip metadata; this independent pass does not override them.
- No game browser tests or animation playback tests were run by this read-only source review. No production greenlight is claimed.

## Checks performed

All 14 files were opened/viewed. Actual image size and mode were read from the files. All 78 supplied rectangle regions were checked to lie within their corresponding source dimensions. Counts and dimensions in the JSON were validated against the PNGs.

