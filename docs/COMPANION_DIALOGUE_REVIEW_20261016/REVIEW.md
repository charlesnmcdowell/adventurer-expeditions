# Companion dialogue pass: audition checkpoint

## State
All 45 auditions approved and reused. The complete 156-segment production is now integrated locally. See [CHANGES.md](CHANGES.md) for every revision, new line, placement and exception, or [production.html](production.html) to hear all recordings.

## Verified corrections to the supplied audit
- The live inventory totals 445 spoken segments across 15 companions, including Santiago overrides.
- Winston already speaks in chapters 3, 4, 5 and 8. Do not add lines merely because those chapters were missing from the audit summary.
- Chapter-nine Desmond/Winston lines belong to their betrayal encounter. The loyal riding-company route still needs an aside, gated on company membership.
- Layla's deep-city culture is explicitly Arabic-influenced in js/data/campaign3_data.js. Keep “ya stranger”; it is intentional, not an accidental borrowing.
- Existing barks carry withCompany and foeStatus guards (Delphine/Desmond/Yasemin presence; burn/poison/rooted). Preserve those guards. A line about a burning enemy is not a generic random bark.
- No bond/courtship entry exists in docs/story_preview.js or story_companion_ui.js. Shared courtship functions and optional recordings remain intact. This pass will not activate romance or delete those lines. The same limitation affects Santiago's optional bond recordings.

## Production plan (completed; detailed results in CHANGES.md)
- Apply only the listed errors and repeated beats, with per-segment voice revisions. Retain unchanged audio within partially edited beats.
- Expand every banter bank from three to six; use measured weapon-specific language and preserve existing eligibility metadata.
- Planned gap coverage: 70 short remarks across eight companions; one per missing later chapter, living/riding companions only. Listed in gap-plan.json. Do not place them inside a dream, after an ending, or before a revelation they depend on.
- Yasemin's chapter-12 comment follows the chapter-10 lineage revelation. Her chapter-14 comment recalls the aura she sensed at the cage without claiming she knew its name then.
- Reuse approved audition masters; never pay for the same line twice. Keep the combined audition/production ledger under the 15,000-credit cap.
- Recheck subtitle tags, apostrophes, Hiwot contractions, fillable placeholders, bark length, recorded file coverage and story guards; then verify chapters 2/6/9/10/14 in desktop and phone browsers.

## Existing speech counts
| Companion | Segments | Voice ID |
| --- | ---: | --- |
| Hiwot | 85 | 0F4ybvRD5Lm0AIt5almW |
| Desmond | 14 | 5OtKrUz8y0NUBuMW6YcK |
| Winston | 31 | R7jdv6H5bZOU3sQIMhbd |
| Santiago | 29 | xHLnsxqUy4cc16VOmSD4 |
| Beau | 15 | 7ma36jg9JC0d1pfrWXMw |
| Delphine | 89 | a3tSl2M9CVI359Oy7H6v |
| Itsuki | 33 | EqIniNyrvzFcbGecFyI5 |
| Bahadır | 9 | ZZKBkhKNX9bfxn63cQTM |
| Yasemin | 10 | E7IRB2a3OVqRb6T7du39 |
| Devendra | 8 | Sm4AUh4ykvT9ljuZ5Uy8 |
| Layla | 30 | 7nj1jqrTE7EDXPyxWBhY |
| Kaito | 35 | O5EDsXljBLA6l3KfYEde |
| Wanjiru | 15 | U1NXjHF5ene7Eze10d5J |
| Dai Morgan | 18 | QZU5JP2C26gx328DNBza |
| Amara | 24 | nlQtoxiWTYC3witBlK1H |

## Audition changes
| Companion | ID | Before | Proposed |
| --- | --- | --- |
| Hiwot | q14_final_restored_1 | [unsteady] I can breathe. I thought I would never... | [unsteady] My hands. I can feel them again. Hold on. My knees are not quite ready. |
| Hiwot | q9_lobby_talk_1 | [impressed] He BELIEVED you. Olamide's name still opens doors. Third floor, he says. Do not touch anything. | [impressed] That worked. Olamide's name got us in. Third floor. Keep your hands to yourself; he is still watching. |
| Hiwot | banter_4 | (new bark) | [quick] Watch my knife. I am going round him. |
| Desmond | q2_pair_yes_1 | [sing-song] You hear that, Winston? We have friends now. — No worry yourself, {target}. I bite only the ones you tell me to. | [sing-song] You hear that, Winston? We have friends now. Stay close, {target}. I'll keep the fire off you. |
| Desmond | q10_exp_gap_vess_1 | (new gap) | [soft] You grew up here? Show me which windows they leave open. |
| Desmond | banter_4 | (new bark) | [delighted] Your turn to worry, man. |
| Winston | q5_camp_storm_1 | [flat] Loud. Sawa — fine. The one with the horns is a sergeant; the rest look to him. Kill him first and they look to nobody. | [flat] Loud, then. The one with the horns is the sergeant. Take him first, man. He's giving the orders. |
| Winston | q8_door_1 | [flat] Doorman. Leave him to me. Everybody has a price, and his is written on his face. | [flat] Let me speak to him. He's watching our purses, man. I doubt he needs much persuading. |
| Winston | banter_4 | (new bark) | [flat] Mind the blade. It's coated. |
| Santiago | banter_4 | (new bark) | [earnest] Behind my shield. Stay close. |
| Santiago | banter_5 | (new bark) | [strained] Flame preserve us. That was close. |
| Santiago | banter_6 | (new bark) | [firm] Keep back while I raise the ward. |
| Beau | q12_exp_gap_dorran_1 | (new gap) | [low] Go on. S-speak. I will watch the guards. |
| Beau | banter_4 | (new bark) | [steady] B-behind me. Plenty of room. |
| Beau | banter_5 | (new bark) | [grunting] Sword arm free. Stand clear. |
| Delphine | q9_lobby_talk_1 | [quiet] He believed it. Third floor. Don't touch anything. | [quiet] Upstairs, honey. Third floor. Leave the ornaments alone till we're past his guards. |
| Delphine | q10_double_strike_1 | [sharp] Two of 'em — and the real Hiwot was BEHIND it, {target}, you cut her — she's breathing. She's breathing. She ain't walking out of here on her own. | [sharp] Stop swinging, {target}! You caught the real girl behind it. She's breathing, but she can't walk. Give me room. |
| Delphine | banter_4 | (new bark) | [calm] Easy, sugar. I've got a little healing left. |
| Itsuki | banter_1 | [quiet] Loosing. | [quiet] Clear my shot. |
| Itsuki | banter_4 | (new bark) | [low] Stay below my bow. |
| Itsuki | banter_5 | (new bark) | [precise] Wait. I have a clear line now. |
| Bahadır | q7_exp_gap_bramm_1 | (new gap) | [angry] Chains. Vallahi. We are not leaving those people down there. |
| Bahadır | banter_4 | (new bark) | [booming] Stand back, canım. I need room to swing! |
| Bahadır | banter_5 | (new bark) | [roaring] You will need more than that! |
| Yasemin | q12_exp_gap_ysolde_1 | (new gap) | [precise] Morrak's blood. At the cage I could only tell something had been worshipped. Now we know whose. |
| Yasemin | q14_exp_gap_ysolde_1 | (new gap) | [low] Your aura is flaring here again. Stay beside me, canım. Tell me if you feel it pulling. |
| Yasemin | banter_4 | (new bark) | [dry] A little room, canım. These fans are not decorative. |
| Devendra | q9_exp_gap_aurelius_1 | (new gap) | [measured] The clerks will know where the records are. Do try asking before threatening them. |
| Devendra | banter_4 | (new bark) | [disdainful] Must you stand in front of my staff? |
| Devendra | banter_5 | (new bark) | [cool] Move aside. I have a spell prepared. |
| Layla | q10_double_strike_1 | [approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out. | [approving] The double is down. Your sister was behind it; you struck her too. She still breathes. Someone carry her. |
| Layla | q10_double_listen_1 | [sharp] That is not your kin. Kill it before it kisses you. | [sharp] Stop listening to that thing. Kill it before it reaches you. |
| Layla | banter_4 | (new bark) | [cool] Stand still if you want my help. |
| Kaito | q6_web_2 | [appraising] Not bounty hunters; you walk too close together. A green sash — Wardens, then, or with Wardens. Good. Wardens cut people down for nothing. Kaito. I hunt bounties, mostly, and I was hunting a wyvern's head when the spiders took offence. | [appraising] A green sash. Wardens, or travelling with them? Good. You cut people out of webs without charging, I hope. Kaito. Bounty hunter. I came for a wyvern and found spiders instead. |
| Kaito | q9_lobby_talk_1 | [smiling] He believed it. Third floor. Touch nothing, he says — as if. | [smiling] Third floor. Yes, of course. I shall keep my hands where the gentleman can see them. |
| Kaito | banter_1 | [smiling] Loosing, loosing — got him, and he was handsome, too. A pity. | [smiling] Got him. Handsome fellow, too. What a pity. |
| Wanjiru | q8_exp_gap_nettle_1 | (new gap) | [hard] So this is where the iron goes. Look how much of it they put on one gate. |
| Wanjiru | banter_4 | (new bark) | [fierce] Hit the thorns. Go on. |
| Wanjiru | banter_5 | (new bark) | [low] Sawa. Stay close while I cast. |
| Dai Morgan | q9_lobby_talk_1 | [grunting] Third floor. Don't touch anything. Good advice for a tower, that. | [grunting] Three floors up. Aye. Keep off the fittings, bach. No sense giving him a reason to call us back. |
| Dai Morgan | q13_exp_gap_durnik_1 | (new gap) | [gravelly] Old stone below new stone. Mind the joins, bach. Water gets between them. |
| Dai Morgan | banter_4 | (new bark) | [calm] Hold still, bach. I'll mend that. |
| Amara | banter_4 | (new bark) | [exact] Leave room for my second blade. |
| Amara | banter_5 | (new bark) | [steady] Keep your guard. I will take this side. |
| Amara | banter_6 | (new bark) | [quiet] Watch my hands. Move when I move. |
