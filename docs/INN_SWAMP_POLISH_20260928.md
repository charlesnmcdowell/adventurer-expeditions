# Enemy scale, inn guests and swamp polish

Crowded waves no longer call Actor.rescale. They retain authored body size and use horizontal spacing and draw order. Alpha and other large enemies retain their existing full sizes even in boss packs. Goblin height is 175 (formerly 205), spider 155 (formerly 190), against Hiro's 330. Four replacement paired finisher sheets depict those smaller enemies; neither enemy is resized dynamically for crowd count.

Five stable inn variants rotate by total completed quests modulo five: solo, Bram, mage with dancer, warrior with barmaid, ranger. Guests do not join the party. Reloading preserves the variant. Existing candle and stew animation is reused; the mage scene omits the hearth overlay where it would paint over the background dancer. The ranger has closed gloved hands around her spoon/bowl; the supplied reference's extra-finger pose was not copied.

The marsh now uses its own level causeway battle painting, with atmospheric haze. The swamp defeat effect is a single 750 ms low earth/dust burst with dispersing flecks. It respects pause and scene shutdown, is reusable for any enemy and does not replay the old three-strip mud sheets. Forest and city effects are unchanged.

## Sources and rebuilding

Generated with built-in image_gen. Paintings, corrected pair masters, exact prompts and source registration manifests: `../adventurer-expeditions-source-art/astra-v3/inn-swamp-20260928/`. Repack with `python tools/build_inn_swamp_polish.py`. Older monster masters remain available; use this newer packer for goblin/spider to retain these corrections. New inn images are listed explicitly in the shipping allowlist. No original Adventurer or synced shared files changed.

## Verification

- Actor animation lifecycle 25/25, inn lifecycle 6/6, finisher pacing passed.
- Browser: all 14 later-monster finishers, seven monsters and four travel beats passed.
- Browser: all three Alpha finishers, unchanged crowd scale, three battle floors and all five inns at 1280 and 390 px passed; dust lifecycle cleanup passed.
- Cold startup, desktop and emulated mobile: 13.66 MB at gameplay, 14.74 MB after audio unlock. Total ship set approximately 42.21 MB / 271 files. Tests used installed Chrome because the local Playwright package expected an absent bundled browser.
- Full `npm test` is NOT green: the automatic-combat floor in `test/expedition_sim.js:501` fails at a 0.20 win rate. Reproduced against the pre-art checkpoint's JavaScript loaded directly from Git HEAD, with identical results. The recent balance settings and test floor need reconciliation separately; this pass does not change them or weaken the assertion.

No public deployment or refreshed release candidate. In-game visual approval is pending.
