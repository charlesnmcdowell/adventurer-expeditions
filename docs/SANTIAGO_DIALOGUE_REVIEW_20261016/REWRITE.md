# Santiago rewrite — 16 October 2026

Applies only to Expeditions. The original Adventurer and its shared dialogue files remain untouched.

## Editorial review
The wolf encounter was reviewed first: nervous first assignment, a request for help, relief expressed through preparing his shield. That voice was then carried into the later scenes.
Faith uses only the existing Dawning Flame, sun/sunrise, southern chapter house, prayer and blessing vocabulary. Facing east is a personal prayer habit consistent with sun worship, not a new rule imposed on his order. No new deities, rites, saints or festivals are proposed.
The optional bond scenes retain his mother’s bakery and the stool by the oven. Romance remains conditional on the existing relationship choices. No new automatic attraction.
Chapter-five departure wording covers both existing triggers. His objection is intentionally unresolved: the source supplies incompatible company but does not establish a detailed theological dispute.

## Before / after
| Source file:line | Line ID | Before | After |
| --- | --- | --- | --- |
| js/data/campaign3_dialogue.js:161 | q2_cassian_1 | [formal, out of breath] Hold — with respect, hold! Do not go into the den, señor — señora — forgive me, I do not know which, and I have run a long way. | [formal, out of breath] Wait! Wolves in that den. Give me a moment. I ran all the way from the bend. |
| js/data/campaign3_dialogue.js:161 | q2_cassian_2 | [straightening] Santiago, squire of the Order of the Dawning Flame. I have been sent to clear these wolves from the road, and I have been sent alone. | [straightening] Santiago. I'm a squire with the Order of the Dawning Flame. They sent me to clear this road. No, there's no one else coming. |
| js/data/campaign3_dialogue.js:163 | q2_cassian_answer_1 | [reddening, honest] Nothing. That is the difficulty. A knight who has done nothing is sent to do something, and a wolf den on a road nobody uses is the something. I will confess to you, as I would to no one in the Order, that I am not certain I can. | [reddening, honest] Nothing! This is my first errand. They said the road was quiet. I counted the tracks outside that den twice. Please don't tell the Order I asked for help. |
| js/data/campaign3_dialogue.js:164 | q2_cassian_alone_1 | [honest] I will confess to you, as I would to no one in the Order, that I am not certain I can. I have never fought anything that was not a straw man. | [honest] I've only fought in the training yard. Straw doesn't come at you in a pack. Could you stay? |
| js/data/campaign3_dialogue.js:171 | q2_cassian_order_1 | [earnest] An order of knights sworn to the sun and the sunrise: to be first into the dark and last out of it. Our chapter house is far south of here, in the sun-lands, where I was born. The Order sent me north to learn what the roads are like. I am learning. | [earnest] Knights sworn to the sun. Our chapter house is down in the sun-lands, where I grew up. I still turn east when I pray, even under all these trees. They sent me north to learn the roads. I hadn't expected to be grateful for strangers this soon. |
| js/data/campaign3_dialogue.js:172 | q2_cassian_tease_1 | [reddening, then honest] Prayers, mostly. And the sword, and how to stand still while people say unkind things — which, with respect, you are doing very well. | [reddening, then honest] Sword practice. Prayers. They didn't put teeth on the practice dummy. With respect, are you going to help? |
| js/data/campaign3_dialogue.js:173 | q2_cassian_join_1 | [relieved] God keep you for it. Then I will take the front, because that is what I am for, and you will tell me if I am doing it wrong. | [relieved] God keep you. Give me a moment to tighten this strap. All right. Stay behind my shield. |
| js/data/campaign3_dialogue.js:174 | q2_cassian_no_1 | [formal, hurt] Of course. God go with you, then. I will — I will manage. | [formal, hurt] I see. God go with you. I'll wait until they come out. One at a time, I hope. |
| js/data/campaign3_dialogue.js:457 | q5_patrol_1 | [uneasy] Burning Gauntlet. A patrol, this far south of the city. They have someone at sword-point — and with respect, by her look, she is not from anywhere near here. | [uneasy] Burning Gauntlet. What's a city patrol doing down here? They've got a woman at sword-point. I don't recognise her dress. |
| js/data/campaign3_dialogue.js:459 | q5_patrol_cassian_1 | [formal, tight] A priestess of what, señora? Say it. I would know what I am deciding about. | [formal, tight] Which goddess, señora? Tell me her name before I draw my weapon. |
| js/data/campaign3_dialogue.js:461 | q5_patrol_cassian_after_1 | [quietly] It might. — {target}. Your word decides it. Not mine. | [quietly] Yes, it matters to me. {target}, are we stepping in? I'll follow your lead here. |
| js/data/campaign3_dialogue.js:472 | q5_cassian_leaves_1 | [quietly] I cannot ride beside a company that shelters what this one shelters. I have prayed on it, and I have tried to find a way, and I cannot. | [quietly] I've prayed over this every night. I still can't accept the company we're keeping. If I stay, we'll have this same argument at every fire. I'm leaving. |
| js/data/campaign3_dialogue.js:472 | q5_cassian_leaves_2 | [formal] If your company changes, you will find me at the Open Hand. I hope it does. I hope that very much. God keep you, {target}. | [formal] I'll be at the Open Hand. If you part ways with them, come and find me. I'd like to ride with you again. God keep you, {target}. |
| js/data/campaign3_dialogue.js:822 | q9_floor_cassian_1 | [low] With respect. You do not have to answer her. She is bargaining. | [low] Let her wait. You don't owe her an answer just because she's frightened. |
| js/data/campaign3_dialogue.js:867 | bond_first_1 | [hesitant] The training yard was easy. You knew the other man would stop. | [hesitant] In the yard, you could put your hand up and stop the bout. I miss that. |
| js/data/campaign3_dialogue.js:867 | bond_first_2 | [honest] In a real fight, I still want to run. I worry that one day I will. | [honest] I pray before we fight. Then I look for somewhere to run. Haven't done it yet. I'm afraid I will. |
| js/data/campaign3_dialogue.js:868 | bond_first_reply_1 | [relieved] Thank you. I needed to hear that from someone who had actually seen me fight. | [relieved] Thank you. You've stood beside me. I'll try to remember that when I start worrying again. |
| js/data/campaign3_dialogue.js:869 | bond_second_1 | [easier] I wrote home. Mostly about the people I have met. My mother would worry if I described the fighting. | [easier] I wrote to Mother. Told her about you. Left out the fighting, or she'd walk all the way here to fetch me. |
| js/data/campaign3_dialogue.js:869 | bond_second_2 | [fond] She runs a bakery. I used to get up before dawn to carry flour. I complained every morning. Now I miss it. | [fond] She has a bakery. I used to carry flour before dawn and complain about the weight. I'd give a good deal to be back there tomorrow morning. |
| js/data/campaign3_dialogue.js:870 | bond_second_reply_1 | [warm] There is a stool by the oven where I used to sleep between deliveries. Mother still keeps it there. She says my room is too far from the work. | [warm] She's kept my stool by the oven. I used to sleep there between deliveries. Apparently my bedroom was too far away when she needed another sack. |
| js/data/campaign3_dialogue.js:871 | bond_interest_1 | [shy] I would like that too. May we take a little time? I want to know you better. | [shy] Yes. I'd like that. Could we take our time? There's still so much I don't know about you. |
| js/data/campaign3_dialogue.js:872 | bond_later_1 | [gentle] Of course. Tell me when you are ready. We can still enjoy each other's company. | [gentle] All right. I won't keep asking. Come and sit with me later, if you'd like. |
| js/data/campaign3_dialogue.js:895 | q9_romance_1 | [nervous] I enjoy the time we spend together. More than I know how to say properly. | [nervous] I've been looking forward to our evenings together. Even when I'm too tired to say much. |
| js/data/campaign3_dialogue.js:895 | q9_romance_2 | [earnest] When we have a quiet evening, may I take you to supper? Just the two of us. | [earnest] Would you have supper with me when we get a night to ourselves? I'd like to take you somewhere decent. |
| js/data/campaign3_dialogue.js:896 | q9_romance_yes_1 | [pleased] Supper, then. I know a decent place. I will try to get through the evening without saluting you. | [pleased] Good. I know a place. And if I salute you at the table, please pretend you didn't see it. |
| js/data/campaign3_dialogue.js:897 | q9_romance_no_1 | [bravely] Then I am glad I said it, and I will not say it again. Thank you for hearing it. | [bravely] All right. I'm glad you told me plainly. I won't bring it up again. |
| js/data/campaign3_dialogue.js:1288 | banter_1 | [shouting] For the Dawning Flame! — forgive me. Habit. | [shouting] Dawning Flame, keep my hand steady! |
| js/data/campaign3_dialogue.js:1288 | banter_2 | [earnest] On me! I can take it! | [earnest] Get behind my shield! Now! |
| js/data/campaign3_dialogue.js:1288 | banter_3 | [strained] I am fine! I am — mostly fine! | [strained] Caught the mail. I'm standing. Keep going! |

## Five recurring speech habits
1. Practical instructions when frightened: tighten a strap, take cover behind the shield, wait outside the den.
2. Short prayers or blessings at moments of need; no lecture about his calling.
3. Courtly address used sparingly, especially when suspicious or trying not to lose his temper.
4. Plain admissions of fear, followed by an immediate decision. He does not turn every doubt into a lesson.
5. Dry humour from his own embarrassment, training and home life; no generic witty slogans.

## Recording convention
Casting verified in original tools/voice_casting.json and VARENHOLMS_GATE_VOICE_SCRIPT.md: cassian → xHLnsxqUy4cc16VOmSD4. ElevenLabs v3; original-style name-free audio, with {target} retained in subtitles. New revision filenames prevent stale audio or source reimports from replacing the edits.
