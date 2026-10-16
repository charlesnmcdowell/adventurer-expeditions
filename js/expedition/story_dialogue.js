// Expeditions-owned editorial changes. Shared campaign files stay read-only.
(function(){
'use strict';
const S=ADV.Expedition.Story,source=ADV.DATA.CAMPAIGN3_DIALOGUE.gate.cassian;
const lines={
 q2_cassian:[
  '[formal, out of breath] Wait! Wolves in that den. Give me a moment. I ran all the way from the bend.',
  "[straightening] Santiago. I'm a squire with the Order of the Dawning Flame. They sent me to clear this road. No, there's no one else coming."
 ],
 q2_cassian_answer:["[reddening, honest] Nothing! This is my first errand. They said the road was quiet. I counted the tracks outside that den twice. Please don't tell the Order I asked for help."],
 q2_cassian_alone:["[honest] I've only fought in the training yard. Straw doesn't come at you in a pack. Could you stay?"],
 q2_cassian_order:["[earnest] Knights sworn to the sun. Our chapter house is down in the sun-lands, where I grew up. I still turn east when I pray, even under all these trees. They sent me north to learn the roads. I hadn't expected to be grateful for strangers this soon."],
 q2_cassian_tease:["[reddening, then honest] Sword practice. Prayers. They didn't put teeth on the practice dummy. With respect, are you going to help?"],
 q2_cassian_join:["[relieved] God keep you. Give me a moment to tighten this strap. All right. Stay behind my shield."],
 q2_cassian_no:["[formal, hurt] I see. God go with you. I'll wait until they come out. One at a time, I hope."],
 q5_patrol:["[uneasy] Burning Gauntlet. What's a city patrol doing down here? They've got a woman at sword-point. I don't recognise her dress."],
 q5_patrol_cassian:["[formal, tight] Which goddess, señora? Tell me her name before I draw my weapon."],
 q5_patrol_cassian_after:["[quietly] Yes, it matters to me. {target}, are we stepping in? I'll follow your lead here."],
 q5_cassian_leaves:[
  "[quietly] I've prayed over this every night. I still can't accept the company we're keeping. If I stay, we'll have this same argument at every fire. I'm leaving.",
  "[formal] I'll be at the Open Hand. If you part ways with them, come and find me. I'd like to ride with you again. God keep you, {target}."
 ],
 q9_floor_cassian:["[low] Let her wait. You don't owe her an answer just because she's frightened."],
 bond_first:[
  '[hesitant] In the yard, you could put your hand up and stop the bout. I miss that.',
  "[honest] I pray before we fight. Then I look for somewhere to run. Haven't done it yet. I'm afraid I will."
 ],
 bond_first_reply:["[relieved] Thank you. You've stood beside me. I'll try to remember that when I start worrying again."],
 bond_second:[
  "[easier] I wrote to Mother. Told her about you. Left out the fighting, or she'd walk all the way here to fetch me.",
  "[fond] She has a bakery. I used to carry flour before dawn and complain about the weight. I'd give a good deal to be back there tomorrow morning."
 ],
 bond_second_reply:["[warm] She's kept my stool by the oven. I used to sleep there between deliveries. Apparently my bedroom was too far away when she needed another sack."],
 bond_interest:["[shy] Yes. I'd like that. Could we take our time? There's still so much I don't know about you."],
 bond_later:["[gentle] All right. I won't keep asking. Come and sit with me later, if you'd like."],
 q9_romance:[
  "[nervous] I've been looking forward to our evenings together. Even when I'm too tired to say much.",
  "[earnest] Would you have supper with me when we get a night to ourselves? I'd like to take you somewhere decent."
 ],
 q9_romance_yes:["[pleased] Good. I know a place. And if I salute you at the table, please pretend you didn't see it."],
 q9_romance_no:["[bravely] All right. I'm glad you told me plainly. I won't bring it up again."],
 banter:[
  '[shouting] Dawning Flame, keep my hand steady!',
  '[earnest] Get behind my shield! Now!',
  "[strained] Caught the mail. I'm standing. Keep going!"
 ]
};
// Keep original segment boundaries and metadata for saved dialogue cursors.
for(const [key,rows] of Object.entries(lines)){
 if(source[key]?.length!==rows.length)throw Error('Santiago dialogue drift: '+key);
 source[key]=rows.map((t,i)=>({...source[key][i],t}));
}
S.SantiagoDialogue={revision:'santiago20261016',voiceId:'xHLnsxqUy4cc16VOmSD4',lines};
})();

// Companion dialogue production: 2026-10-16
(function(){
'use strict';
const S=ADV.Expedition.Story,C=ADV.Campaign3;
const rows=[
 {"who":"amara","key":"banter","index":4,"before":null,"t":"[exact] Leave room for my second blade.","voiceFile":"audio/vo/campaign/amara/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"amara","key":"banter","index":5,"before":null,"t":"[steady] Keep your guard. I will take this side.","voiceFile":"audio/vo/campaign/amara/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"amara","key":"banter","index":6,"before":null,"t":"[quiet] Watch my hands. Move when I move.","voiceFile":"audio/vo/campaign/amara/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"aurelius","key":"banter","index":1,"before":"[bored] Do kindly keep them off me; I am the expensive one.","t":"[bored] Kindly keep them off my robes.","voiceFile":"audio/vo/campaign/aurelius/banter_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"aurelius","key":"banter","index":4,"before":null,"t":"[disdainful] Must you stand in front of my staff?","voiceFile":"audio/vo/campaign/aurelius/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"aurelius","key":"banter","index":5,"before":null,"t":"[cool] Move aside. I have a spell prepared.","voiceFile":"audio/vo/campaign/aurelius/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"aurelius","key":"banter","index":6,"before":null,"t":"[irritated] This is taking far too long.","voiceFile":"audio/vo/campaign/aurelius/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"aurelius","key":"q10_exp_gap_aurelius","index":1,"before":null,"t":"[cool] We have the documents. I suggest we let the keepers read them before we begin arguing.","voiceFile":"audio/vo/campaign/aurelius/q10_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q11_exp_gap_aurelius","index":1,"before":null,"t":"[disdainful] They have spelled your name correctly on the notices. A pity. An error might have helped us.","voiceFile":"audio/vo/campaign/aurelius/q11_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q12_exp_gap_aurelius","index":1,"before":null,"t":"[quiet] Leave the talking to whoever has the evidence. I shall be ready if the guards object.","voiceFile":"audio/vo/campaign/aurelius/q12_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q13_exp_gap_aurelius","index":1,"before":null,"t":"[irritated] I can provide light. I cannot make these stairs fit for civilised use.","voiceFile":"audio/vo/campaign/aurelius/q13_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q14_exp_gap_aurelius","index":1,"before":null,"t":"[cold] Keep him occupied. I would prefer to finish my casting without a sword through it.","voiceFile":"audio/vo/campaign/aurelius/q14_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q4_exp_gap_aurelius","index":1,"before":null,"t":"[disdainful] A mine. Naturally. I wore the wrong boots for this expedition.","voiceFile":"audio/vo/campaign/aurelius/q4_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q5_exp_gap_aurelius","index":1,"before":null,"t":"[cool] Do retrieve the correspondence before setting anything alight.","voiceFile":"audio/vo/campaign/aurelius/q5_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q6_exp_gap_aurelius","index":1,"before":null,"t":"[irritated] Kindly keep the branches out of my face. I require my eyes for the spellwork.","voiceFile":"audio/vo/campaign/aurelius/q6_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q7_exp_gap_aurelius","index":1,"before":null,"t":"[cold] A wizard administering a mine. Evidently his ambitions were modest.","voiceFile":"audio/vo/campaign/aurelius/q7_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q8_exp_gap_aurelius","index":1,"before":null,"t":"[satisfied] At last. Paved streets. Let us see whether they also have competent officials.","voiceFile":"audio/vo/campaign/aurelius/q8_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"aurelius","key":"q9_exp_gap_aurelius","index":1,"before":null,"t":"[measured] The clerks will know where the records are. Do try asking before threatening them.","voiceFile":"audio/vo/campaign/aurelius/q9_exp_gap_aurelius_1_companion20261016.mp3","kind":"gap"},
 {"who":"bramm","key":"banter","index":4,"before":null,"t":"[booming] Stand back, canım. I need room to swing!","voiceFile":"audio/vo/campaign/bramm/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"bramm","key":"banter","index":5,"before":null,"t":"[roaring] You will need more than that!","voiceFile":"audio/vo/campaign/bramm/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"bramm","key":"banter","index":6,"before":null,"t":"[gleeful] Ha! My turn!","voiceFile":"audio/vo/campaign/bramm/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"bramm","key":"q10_exp_gap_bramm","index":1,"before":null,"t":"[warm] This is your home, canım? Then we shall be decent guests. Unless they give us cause.","voiceFile":"audio/vo/campaign/bramm/q10_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q11_exp_gap_bramm","index":1,"before":null,"t":"[angry] They have put your face on the walls. Let them put mine beside it.","voiceFile":"audio/vo/campaign/bramm/q11_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q12_exp_gap_bramm","index":1,"before":null,"t":"[low, emphatic] I will keep quiet until you speak. Do not ask me for much longer than that.","voiceFile":"audio/vo/campaign/bramm/q12_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q13_exp_gap_bramm","index":1,"before":null,"t":"[grumbling] More stairs. Does this city have no bottom?","voiceFile":"audio/vo/campaign/bramm/q13_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q14_exp_gap_bramm","index":1,"before":null,"t":"[firm] I am with you, canım. Say when, and I will move.","voiceFile":"audio/vo/campaign/bramm/q14_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q4_exp_gap_bramm","index":1,"before":null,"t":"[booming, lowered] Low ceiling. I shall have to swing carefully. Nobody stand beside me.","voiceFile":"audio/vo/campaign/bramm/q4_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q5_exp_gap_bramm","index":1,"before":null,"t":"[eager] A bandit camp? Good. Let them try shouting me off the road.","voiceFile":"audio/vo/campaign/bramm/q5_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q6_exp_gap_bramm","index":1,"before":null,"t":"[warm] Stay where I can see you, canım. There is too much web between these trees.","voiceFile":"audio/vo/campaign/bramm/q6_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q7_exp_gap_bramm","index":1,"before":null,"t":"[angry] Chains. Vallahi. We are not leaving those people down there.","voiceFile":"audio/vo/campaign/bramm/q7_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q8_exp_gap_bramm","index":1,"before":null,"t":"[booming] A fine big gate! They can open it for us like anyone else.","voiceFile":"audio/vo/campaign/bramm/q8_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"bramm","key":"q9_exp_gap_bramm","index":1,"before":null,"t":"[low] So this is where they send the money. I would like to meet the men who spend it.","voiceFile":"audio/vo/campaign/bramm/q9_exp_gap_bramm_1_companion20261016.mp3","kind":"gap"},
 {"who":"cassian","key":"banter","index":4,"before":null,"t":"[earnest] Behind my shield. Stay close.","voiceFile":"audio/vo/campaign/cassian/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"cassian","key":"banter","index":5,"before":null,"t":"[strained] Flame preserve us. That was close.","voiceFile":"audio/vo/campaign/cassian/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"cassian","key":"banter","index":6,"before":null,"t":"[firm] Keep back while I raise the ward.","voiceFile":"audio/vo/campaign/cassian/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"dorran","key":"banter","index":4,"before":null,"t":"[steady] B-behind me. Plenty of room.","voiceFile":"audio/vo/campaign/dorran/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"dorran","key":"banter","index":5,"before":null,"t":"[grunting] Sword arm free. Stand clear.","voiceFile":"audio/vo/campaign/dorran/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"dorran","key":"banter","index":6,"before":null,"t":"[firm] N-no. You stay on that side.","voiceFile":"audio/vo/campaign/dorran/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"dorran","key":"q10_exp_gap_dorran","index":1,"before":null,"t":"[quiet] T-this is where you grew up? We will stay close.","voiceFile":"audio/vo/campaign/dorran/q10_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"dorran","key":"q11_exp_gap_dorran","index":1,"before":null,"t":"[firm] L-let them look. They will have to get past my shield.","voiceFile":"audio/vo/campaign/dorran/q11_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"dorran","key":"q12_exp_gap_dorran","index":1,"before":null,"t":"[low] Go on. S-speak. I will watch the guards.","voiceFile":"audio/vo/campaign/dorran/q12_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"dorran","key":"q13_exp_gap_dorran","index":1,"before":null,"t":"[steady] Stay behind the shield on these stairs. N-no passing.","voiceFile":"audio/vo/campaign/dorran/q13_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"dorran","key":"q14_exp_gap_dorran","index":1,"before":null,"t":"[quiet] R-ready when you are. I am not moving away.","voiceFile":"audio/vo/campaign/dorran/q14_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"dorran","key":"q8_exp_gap_dorran","index":1,"before":null,"t":"[quiet] G-good to be above ground. Give me a moment before we cross.","voiceFile":"audio/vo/campaign/dorran/q8_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"dorran","key":"q9_exp_gap_dorran","index":1,"before":null,"t":"[steady] I will keep the door clear. You find the papers.","voiceFile":"audio/vo/campaign/dorran/q9_exp_gap_dorran_1_companion20261016.mp3","kind":"gap"},
 {"who":"durnik","key":"banter","index":1,"before":"[gravelly] Wall. I'm the wall, I am.","t":"[gravelly] Shield up. Come round me, bach.","voiceFile":"audio/vo/campaign/durnik/banter_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"durnik","key":"banter","index":4,"before":null,"t":"[calm] Hold still, bach. I'll mend that.","voiceFile":"audio/vo/campaign/durnik/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"durnik","key":"banter","index":5,"before":null,"t":"[grunting] Plenty of hammer left.","voiceFile":"audio/vo/campaign/durnik/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"durnik","key":"banter","index":6,"before":null,"t":"[gravelly] There we are. Breathe, now.","voiceFile":"audio/vo/campaign/durnik/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"durnik","key":"q10_exp_gap_durnik","index":1,"before":null,"t":"[gravelly] Keep those papers dry, bach. We brought them a long way.","voiceFile":"audio/vo/campaign/durnik/q10_exp_gap_durnik_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"durnik","key":"q11_exp_gap_durnik","index":1,"before":null,"t":"[grim] A wanted notice. Aye. Easier than answering what's in the ledgers.","voiceFile":"audio/vo/campaign/durnik/q11_exp_gap_durnik_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"durnik","key":"q12_exp_gap_durnik","index":1,"before":null,"t":"[quiet] Let them read the names. No one talks over that. Not while I am here.","voiceFile":"audio/vo/campaign/durnik/q12_exp_gap_durnik_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"durnik","key":"q13_exp_gap_durnik","index":1,"before":null,"t":"[gravelly] Old stone below new stone. Mind the joins, bach. Water gets between them.","voiceFile":"audio/vo/campaign/durnik/q13_exp_gap_durnik_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"durnik","key":"q14_exp_gap_durnik","index":1,"before":null,"t":"[low] Deep places should be quiet. Listen to this one. Keep your shield up, bach.","voiceFile":"audio/vo/campaign/durnik/q14_exp_gap_durnik_1_companion20261016.mp3","kind":"gap"},
 {"who":"durnik","key":"q9_lobby","index":1,"before":"[gravelly] Clerk with a list. Two guards. Good stone, again. Shame.","t":"[gravelly] Look at the stone they paid for here. Clerk's got guards, too. We'll need to get past him.","voiceFile":"audio/vo/campaign/durnik/q9_lobby_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"durnik","key":"q9_lobby_talk","index":1,"before":"[grunting] Third floor. Don't touch anything. Good advice for a tower, that.","t":"[grunting] Three floors up. Aye. Keep off the fittings, bach. No sense giving him a reason to call us back.","voiceFile":"audio/vo/campaign/durnik/q9_lobby_talk_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"banter","index":1,"before":"[smiling] Loosing, loosing — got him, and he was handsome, too. A pity.","t":"[smiling] Got him. Handsome fellow, too. What a pity.","voiceFile":"audio/vo/campaign/faelen/banter_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"banter","index":3,"before":"[light] If I die, tell the magistrate I was thinking of her.","t":"[light] Tell the magistrate I thought of her.","voiceFile":"audio/vo/campaign/faelen/banter_3_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"banter","index":4,"before":null,"t":"[cheerful] Excuse me. Coming round with a knife.","voiceFile":"audio/vo/campaign/faelen/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"faelen","key":"banter","index":5,"before":null,"t":"[quick] Duck, please. Bowstring is drawn.","voiceFile":"audio/vo/campaign/faelen/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"faelen","key":"banter","index":6,"before":null,"t":"[light] The magistrate would have enjoyed that.","voiceFile":"audio/vo/campaign/faelen/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"faelen","key":"q10_double_listen","index":1,"before":"[shouting] Not them! NOT them! It has teeth, {target}!","t":"[shouting] Those teeth! Get back, {target}! That is not your family!","voiceFile":"audio/vo/campaign/faelen/q10_double_listen_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q10_double_strike","index":1,"before":"[wincing] Right call, wrong result — the real Hiwot was behind it. She is breathing. I will carry her out; go.","t":"[wincing] Wait, the girl behind it is real! She is hurt. Still breathing. I will carry her out. Go!","voiceFile":"audio/vo/campaign/faelen/q10_double_strike_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q10_double_strike_alone","index":1,"before":"[breathless] Not him — and you knew. It is down. Two more behind it, and I do not like their faces either.","t":"[breathless] That was not him. You saw it first. Two more coming. I would rather not meet them here.","voiceFile":"audio/vo/campaign/faelen/q10_double_strike_alone_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q13_maze_follow","index":1,"before":"[murmuring] Left. Left. Do not step there. — And we are through, and nobody even bled. I love being right.","t":"[murmuring] This way. Mind your foot; that tile moves. There we are. You may applaud once we are outside.","voiceFile":"audio/vo/campaign/faelen/q13_maze_follow_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q6_web","index":2,"before":"[appraising] Not bounty hunters; you walk too close together. A green sash — Wardens, then, or with Wardens. Good. Wardens cut people down for nothing. Kaito. I hunt bounties, mostly, and I was hunting a wyvern's head when the spiders took offence.","t":"[appraising] A green sash. Wardens, or travelling with them? Good. You cut people out of webs without charging, I hope. Kaito. Bounty hunter. I came for a wyvern and found spiders instead.","voiceFile":"audio/vo/campaign/faelen/q6_web_2_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q8_door","index":1,"before":"[murmuring] Doorman. Big. Bored. I can talk us past him; bored men love a story, and I have several.","t":"[murmuring] That poor man has been standing there all day. I have a story he might enjoy. Follow my lead.","voiceFile":"audio/vo/campaign/faelen/q8_door_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q9_lobby","index":1,"before":"[murmuring] A clerk. A list. Two guards. Forgive me — I love a lobby.","t":"[murmuring] A list at the door. How exclusive. Forgive me if I look over his shoulder.","voiceFile":"audio/vo/campaign/faelen/q9_lobby_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"faelen","key":"q9_lobby_talk","index":1,"before":"[smiling] He believed it. Third floor. Touch nothing, he says — as if.","t":"[smiling] Third floor. Yes, of course. I shall keep my hands where the gentleman can see them.","voiceFile":"audio/vo/campaign/faelen/q9_lobby_talk_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"fennick","key":"banter","index":4,"before":null,"t":"[flat] Mind the blade. It's coated.","voiceFile":"audio/vo/campaign/fennick/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"fennick","key":"banter","index":5,"before":null,"t":"[low] Keep him busy. I need a moment.","voiceFile":"audio/vo/campaign/fennick/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"fennick","key":"banter","index":6,"before":null,"t":"[dry] Still working, man.","voiceFile":"audio/vo/campaign/fennick/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"fennick","key":"q10_exp_gap_fennick","index":1,"before":null,"t":"[low] Let the keepers see the seals before anyone touches the papers.","voiceFile":"audio/vo/campaign/fennick/q10_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"fennick","key":"q11_exp_gap_fennick","index":1,"before":null,"t":"[flat] Don't look at the posters. People watch whoever stops to read them.","voiceFile":"audio/vo/campaign/fennick/q11_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"fennick","key":"q12_exp_gap_fennick","index":1,"before":null,"t":"[low] Keep the papers in reach, man. No fumbling when they call on you.","voiceFile":"audio/vo/campaign/fennick/q12_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"fennick","key":"q13_exp_gap_fennick","index":1,"before":null,"t":"[flat] One at a time on the narrow steps. Keep your blade clear.","voiceFile":"audio/vo/campaign/fennick/q13_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"fennick","key":"q14_exp_gap_fennick","index":1,"before":null,"t":"[low] Watch his hands, man. I will watch the way behind us.","voiceFile":"audio/vo/campaign/fennick/q14_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 {"who":"fennick","key":"q5_camp_storm","index":1,"before":"[flat] Loud. Sawa — fine. The one with the horns is a sergeant; the rest look to him. Kill him first and they look to nobody.","t":"[flat] Loud, then. The one with the horns is the sergeant. Take him first, man. He's giving the orders.","voiceFile":"audio/vo/campaign/fennick/q5_camp_storm_1_companion20261016.mp3","kind":"rewrite"},
 // new: gap
 {"who":"fennick","key":"q6_exp_gap_fennick","index":1,"before":null,"t":"[flat] Watch where you step, man. I don't want to cut you out of a web.","voiceFile":"audio/vo/campaign/fennick/q6_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 {"who":"fennick","key":"q8_door","index":1,"before":"[flat] Doorman. Leave him to me. Everybody has a price, and his is written on his face.","t":"[flat] Let me speak to him. He's watching our purses, man. I doubt he needs much persuading.","voiceFile":"audio/vo/campaign/fennick/q8_door_1_companion20261016.mp3","kind":"rewrite"},
 // new: gap
 {"who":"fennick","key":"q9_exp_gap_fennick","index":1,"before":null,"t":"[low] Let them talk, man. We came for the records.","voiceFile":"audio/vo/campaign/fennick/q9_exp_gap_fennick_1_companion20261016.mp3","kind":"gap"},
 {"who":"ilvara","key":"banter","index":4,"before":null,"t":"[cool] Stand still if you want my help.","voiceFile":"audio/vo/campaign/ilvara/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"ilvara","key":"banter","index":5,"before":null,"t":"[contemptuous] By the deep. You call that a threat?","voiceFile":"audio/vo/campaign/ilvara/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"ilvara","key":"banter","index":6,"before":null,"t":"[dry] Keep fighting. I have not finished casting.","voiceFile":"audio/vo/campaign/ilvara/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"ilvara","key":"q10_double_listen","index":1,"before":"[sharp] That is not your kin. Kill it before it kisses you.","t":"[sharp] Stop listening to that thing. Kill it before it reaches you.","voiceFile":"audio/vo/campaign/ilvara/q10_double_listen_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"ilvara","key":"q10_double_strike","index":1,"before":"[approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out.","t":"[approving] The double is down. Your sister was behind it; you struck her too. She still breathes. Someone carry her.","voiceFile":"audio/vo/campaign/ilvara/q10_double_strike_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"ilvara","key":"q10_double_strike_alone","index":1,"before":"[approving] Good. You did not even let it finish. There are more behind it; kill them the same way.","t":"[approving] You struck before it could fool you. Good. The others behind it deserve no more time.","voiceFile":"audio/vo/campaign/ilvara/q10_double_strike_alone_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"ithrel","key":"banter","index":1,"before":"[quiet] Loosing.","t":"[quiet] Clear my shot.","voiceFile":"audio/vo/campaign/ithrel/banter_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"ithrel","key":"banter","index":4,"before":null,"t":"[low] Stay below my bow.","voiceFile":"audio/vo/campaign/ithrel/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"ithrel","key":"banter","index":5,"before":null,"t":"[precise] Wait. I have a clear line now.","voiceFile":"audio/vo/campaign/ithrel/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"ithrel","key":"banter","index":6,"before":null,"t":"[quiet] I can keep shooting. Go.","voiceFile":"audio/vo/campaign/ithrel/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"nettle","key":"banter","index":4,"before":null,"t":"[fierce] Hit the thorns. Go on.","voiceFile":"audio/vo/campaign/nettle/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"nettle","key":"banter","index":5,"before":null,"t":"[low] Sawa. Stay close while I cast.","voiceFile":"audio/vo/campaign/nettle/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"nettle","key":"banter","index":6,"before":null,"t":"[snarling] Eh? Still coming at me?","voiceFile":"audio/vo/campaign/nettle/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"nettle","key":"q10_exp_gap_nettle","index":1,"before":null,"t":"[wary] These keepers had better read what we brought. I did not come here to be waved away.","voiceFile":"audio/vo/campaign/nettle/q10_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"nettle","key":"q11_exp_gap_nettle","index":1,"before":null,"t":"[fierce] They call you the criminal. Eh? After what their mine did?","voiceFile":"audio/vo/campaign/nettle/q11_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"nettle","key":"q12_exp_gap_nettle","index":1,"before":null,"t":"[low] Let them hear the names from the mine. Loud enough for the back of the hall.","voiceFile":"audio/vo/campaign/nettle/q12_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"nettle","key":"q13_exp_gap_nettle","index":1,"before":null,"t":"[quiet] No roots this far down. Keep close. I do not like it here.","voiceFile":"audio/vo/campaign/nettle/q13_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"nettle","key":"q14_exp_gap_nettle","index":1,"before":null,"t":"[hard] He wants a sacrifice. He can come and try to take one.","voiceFile":"audio/vo/campaign/nettle/q14_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"nettle","key":"q8_exp_gap_nettle","index":1,"before":null,"t":"[hard] So this is where the iron goes. Look how much of it they put on one gate.","voiceFile":"audio/vo/campaign/nettle/q8_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"nettle","key":"q9_exp_gap_nettle","index":1,"before":null,"t":"[low] Let me see the men who signed those orders. I want them to hear what happened downstream.","voiceFile":"audio/vo/campaign/nettle/q9_exp_gap_nettle_1_companion20261016.mp3","kind":"gap"},
 {"who":"selene","key":"banter","index":4,"before":null,"t":"[calm] Easy, sugar. I've got a little healing left.","voiceFile":"audio/vo/campaign/selene/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"selene","key":"banter","index":5,"before":null,"t":"[sharp] Let them come. Mind the thorns.","voiceFile":"audio/vo/campaign/selene/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"selene","key":"banter","index":6,"before":null,"t":"[dry] That staff is harder than it looks, honey.","voiceFile":"audio/vo/campaign/selene/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"selene","key":"q10_double_listen","index":1,"before":"[urgent] That ain't who it looks like. {target}. That is NOT them. It's already reaching for your throat — move!","t":"[urgent] Back, {target}! Look at its hand. It's reaching for your throat!","voiceFile":"audio/vo/campaign/selene/q10_double_listen_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"selene","key":"q10_double_strike","index":1,"before":"[sharp] Two of 'em — and the real Hiwot was BEHIND it, {target}, you cut her — she's breathing. She's breathing. She ain't walking out of here on her own.","t":"[sharp] Stop swinging, {target}! You caught the real girl behind it. She's breathing, but she can't walk. Give me room.","voiceFile":"audio/vo/campaign/selene/q10_double_strike_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"selene","key":"q10_double_strike_alone","index":1,"before":"[grim] That wasn't him, and you knew it before I did. It's dead. There's two more behind it wearing faces I don't know — keep moving.","t":"[grim] You were right. That wasn't him. Two more coming, honey. I don't recognise those faces.","voiceFile":"audio/vo/campaign/selene/q10_double_strike_alone_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"selene","key":"q9_lobby","index":1,"before":"[murmuring] A clerk with a list and two guards who are paid to believe him.","t":"[murmuring] Best have your story ready, honey. Those two guards are waiting for the clerk to nod.","voiceFile":"audio/vo/campaign/selene/q9_lobby_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"selene","key":"q9_lobby_talk","index":1,"before":"[quiet] He believed it. Third floor. Don't touch anything.","t":"[quiet] Upstairs, honey. Third floor. Leave the ornaments alone till we're past his guards.","voiceFile":"audio/vo/campaign/selene/q9_lobby_talk_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"vess","key":"banter","index":4,"before":null,"t":"[delighted] Your turn to worry, man.","voiceFile":"audio/vo/campaign/vess/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"vess","key":"banter","index":5,"before":null,"t":"[sing-song] Still got another spell for you.","voiceFile":"audio/vo/campaign/vess/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"vess","key":"banter","index":6,"before":null,"t":"[bright] Ah, you saw the wand. Clever boy.","voiceFile":"audio/vo/campaign/vess/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"vess","key":"q10_exp_gap_vess","index":1,"before":null,"t":"[soft] You grew up here? Show me which windows they leave open.","voiceFile":"audio/vo/campaign/vess/q10_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q11_exp_gap_vess","index":1,"before":null,"t":"[amused] That picture does you no favours, man. Nearly walked past it.","voiceFile":"audio/vo/campaign/vess/q11_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q12_exp_gap_vess","index":1,"before":null,"t":"[hushed, delighted] All these fine clothes. I'll try not to singe yours.","voiceFile":"audio/vo/campaign/vess/q12_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q13_exp_gap_vess","index":1,"before":null,"t":"[sing-song] Down we go. Keep a little light for me, man.","voiceFile":"audio/vo/campaign/vess/q13_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q14_exp_gap_vess","index":1,"before":null,"t":"[quiet] No laughing now. I want to hear what he says.","voiceFile":"audio/vo/campaign/vess/q14_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 {"who":"vess","key":"q2_pair_yes","index":1,"before":"[sing-song] You hear that, Winston? We have friends now. — No worry yourself, {target}. I bite only the ones you tell me to.","t":"[sing-song] You hear that, Winston? We have friends now. Stay close, {target}. I'll keep the fire off you.","voiceFile":"audio/vo/campaign/vess/q2_pair_yes_1_companion20261016.mp3","kind":"rewrite"},
 // new: gap
 {"who":"vess","key":"q3_exp_gap_vess","index":1,"before":null,"t":"[bright] More road. Good, man. I was getting tired of sitting still.","voiceFile":"audio/vo/campaign/vess/q3_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q4_exp_gap_vess","index":1,"before":null,"t":"[sing-song] Careful where you put your hands. I like mine attached.","voiceFile":"audio/vo/campaign/vess/q4_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q5_exp_gap_vess","index":1,"before":null,"t":"[gleeful] A whole camp. Think any of them will be pleased to see us?","voiceFile":"audio/vo/campaign/vess/q5_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q6_exp_gap_vess","index":1,"before":null,"t":"[bright] Big webs, man. I want to see what made them. From here.","voiceFile":"audio/vo/campaign/vess/q6_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q8_exp_gap_vess","index":1,"before":null,"t":"[delighted] Look at those gates. Somebody paid plenty to feel safe.","voiceFile":"audio/vo/campaign/vess/q8_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"vess","key":"q9_exp_gap_vess","index":1,"before":null,"t":"[soft] Fancy place, man. Keep an eye on the stairs while we talk.","voiceFile":"audio/vo/campaign/vess/q9_exp_gap_vess_1_companion20261016.mp3","kind":"gap"},
 {"who":"wren_ward","key":"banter","index":3,"before":"[gleeful] Got his purse. And his knife. And his — never mind, keep fighting.","t":"[gleeful] Got his knife! He is rather upset about it!","voiceFile":"audio/vo/campaign/wren_ward/banter_3_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"banter","index":4,"before":null,"t":"[quick] Watch my knife. I am going round him.","voiceFile":"audio/vo/campaign/wren_ward/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"wren_ward","key":"banter","index":5,"before":null,"t":"[urgent] Stay close. I can cover us with smoke.","voiceFile":"audio/vo/campaign/wren_ward/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"wren_ward","key":"banter","index":6,"before":null,"t":"[breathless] He nearly had my coat!","voiceFile":"audio/vo/campaign/wren_ward/banter_6_companion20261016.mp3","kind":"bark"},
 {"who":"wren_ward","key":"q1_catchup","index":2,"before":"[quieter] He is dead. Tesfaye. I saw him fall. I can't believe we left him there. He should be with us.","t":"[quieter] He is dead. Tesfaye. I saw him fall. I cannot believe we left him there. He should be with us.","voiceFile":"audio/vo/campaign/wren_ward/q1_catchup_2_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q10_shore","index":2,"before":"[small] Sanni sent us into that room. Then he told the guards we'd murdered his father. He had this planned before we ever left the city.","t":"[small] Sanni sent us into that room. Then he told the guards we had murdered his father. He had this planned before we ever left the city.","voiceFile":"audio/vo/campaign/wren_ward/q10_shore_2_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q13_maze_follow","index":1,"before":"[murmuring] Left. Again. Not that one. — Through. Nobody bled. Tell Tesfaye I was paying attention.","t":"[murmuring] Left. Left again. Step over that plate. There. All those hours watching the locks finally paid off.","voiceFile":"audio/vo/campaign/wren_ward/q13_maze_follow_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_choice","index":1,"before":"[quiet] He’s gone. I can feel the power he took, and yours. It is holding this place open.","t":"[quiet] He is gone. The power he stole is still here. So is yours. It is keeping this place open.","voiceFile":"audio/vo/campaign/wren_ward/q14_final_choice_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_choice","index":2,"before":"[steady] If you let it all go, I can come back with you. You will lose Morrak’s blood, and any claim to his throne. If you keep it, you can take his place. I cannot come back that way.","t":"[steady] Let all of it go and I can come with you. No more of Morrak's blood. No throne. Keep it, and you take his place. I have to stay here.","voiceFile":"audio/vo/campaign/wren_ward/q14_final_choice_2_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_farewell","index":1,"before":"[quiet] I wanted to go home with you. I hope you remember that.","t":"[quiet] I wanted to walk home with you. That was all. Please remember me there.","voiceFile":"audio/vo/campaign/wren_ward/q14_final_farewell_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_restored","index":1,"before":"[unsteady] I can breathe. I thought I would never...","t":"[unsteady] My hands. I can feel them again. Hold on. My knees are not quite ready.","voiceFile":"audio/vo/campaign/wren_ward/q14_final_restored_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_restored","index":2,"before":"[soft] You came back for me. Let’s get out of here. Please.","t":"[soft] You came back for me. Come on. Both of us are getting out this time.","voiceFile":"audio/vo/campaign/wren_ward/q14_final_restored_2_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_soul","index":1,"before":"[weak] I can hear you. He has bound me to the throne. Break his hold before he can finish.","t":"[weak] I can hear you. I am still here. He has tied me to the throne. Break his hold. Please hurry.","voiceFile":"audio/vo/campaign/wren_ward/q14_final_soul_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q14_final_taken","index":1,"before":"[shocked] No. Let go of me!","t":"[shocked] Get your hands off me! Let go!","voiceFile":"audio/vo/campaign/wren_ward/q14_final_taken_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q4_down","index":2,"before":"[quiet] Keep your light up. I can't see where these stairs end.","t":"[quiet] Keep your light up. I cannot see where these stairs end.","voiceFile":"audio/vo/campaign/wren_ward/q4_down_2_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q8_door","index":1,"before":"[whispering] Doorman. I can get us past him. He will not even remember we were here.","t":"[whispering] He has not noticed the side window. Give me a moment and we can leave him to his nap.","voiceFile":"audio/vo/campaign/wren_ward/q8_door_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q9_lobby","index":1,"before":"[whispering] A clerk. Two guards. A very long list of names on his desk, and we are not on it.","t":"[whispering] Our names are missing from that list. The clerk has two guards. Try to look expected.","voiceFile":"audio/vo/campaign/wren_ward/q9_lobby_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"wren_ward","key":"q9_lobby_talk","index":1,"before":"[impressed] He BELIEVED you. Olamide's name still opens doors. Third floor, he says. Do not touch anything.","t":"[impressed] That worked. Olamide's name got us in. Third floor. Keep your hands to yourself; he is still watching.","voiceFile":"audio/vo/campaign/wren_ward/q9_lobby_talk_1_companion20261016.mp3","kind":"rewrite"},
 {"who":"ysolde","key":"banter","index":4,"before":null,"t":"[dry] A little room, canım. These fans are not decorative.","voiceFile":"audio/vo/campaign/ysolde/banter_4_companion20261016.mp3","kind":"bark"},
 {"who":"ysolde","key":"banter","index":5,"before":null,"t":"[cool] Stop moving. I am trying to freeze you.","voiceFile":"audio/vo/campaign/ysolde/banter_5_companion20261016.mp3","kind":"bark"},
 {"who":"ysolde","key":"banter","index":6,"before":null,"t":"[quiet] Watch their feet.","voiceFile":"audio/vo/campaign/ysolde/banter_6_companion20261016.mp3","kind":"bark"},
 // new: gap
 {"who":"ysolde","key":"q10_exp_gap_ysolde","index":1,"before":null,"t":"[dry] You know the keep. Lead on, canım. I will watch behind us.","voiceFile":"audio/vo/campaign/ysolde/q10_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q11_exp_gap_ysolde","index":1,"before":null,"t":"[low] Keep your face away from the lamps. We can argue with the notices later.","voiceFile":"audio/vo/campaign/ysolde/q11_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q12_exp_gap_ysolde","index":1,"before":null,"t":"[precise] Morrak's blood. At the cage I could only tell something had been worshipped. Now we know whose.","voiceFile":"audio/vo/campaign/ysolde/q12_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q13_exp_gap_ysolde","index":1,"before":null,"t":"[quiet] Watch the steps, canım. I cannot read a broken ankle before it happens.","voiceFile":"audio/vo/campaign/ysolde/q13_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q14_exp_gap_ysolde","index":1,"before":null,"t":"[low] Your aura is flaring here again. Stay beside me, canım. Tell me if you feel it pulling.","voiceFile":"audio/vo/campaign/ysolde/q14_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q4_exp_gap_ysolde","index":1,"before":null,"t":"[dry] Damp stone. Rust. I shall be very glad to wash after this.","voiceFile":"audio/vo/campaign/ysolde/q4_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q5_exp_gap_ysolde","index":1,"before":null,"t":"[quiet] Let us find the letters before someone burns them, canım.","voiceFile":"audio/vo/campaign/ysolde/q5_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q6_exp_gap_ysolde","index":1,"before":null,"t":"[dry] Mind the webs. I would rather not spend tonight cutting silk from my hair.","voiceFile":"audio/vo/campaign/ysolde/q6_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q7_exp_gap_ysolde","index":1,"before":null,"t":"[cold] They have put cages underground as well. Keep walking. I need a moment.","voiceFile":"audio/vo/campaign/ysolde/q7_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q8_exp_gap_ysolde","index":1,"before":null,"t":"[dry] The guards are looking for a reason to turn us back. Give them nothing extra.","voiceFile":"audio/vo/campaign/ysolde/q8_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"},
 // new: gap
 {"who":"ysolde","key":"q9_exp_gap_ysolde","index":1,"before":null,"t":"[quiet] Hands off their papers until we know which ones matter. They will notice a missing ledger.","voiceFile":"audio/vo/campaign/ysolde/q9_exp_gap_ysolde_1_companion20261016.mp3","kind":"gap"}
];
for(const r of rows){
 const speaker=ADV.DATA.CAMPAIGN3_DIALOGUE.gate[r.who],bank=speaker[r.key]||(speaker[r.key]=[]),old=bank[r.index-1];
 if(r.kind==='rewrite'&&old?.t!==r.before)throw Error('Companion dialogue drift: '+r.who+'/'+r.key+'/'+r.index);
 if(r.kind!=='rewrite'&&(old||bank.length!==r.index-1))throw Error('Companion segment collision: '+r.who+'/'+r.key);
 bank[r.index-1]={...old,t:r.t,voiceFile:r.voiceFile};
}
const D=S.CompanionDialogue={rows};
// A single short aside per missing companion, at the actual location it names.
// Chapter 5 waits for the palisade; chapter 7 waits for the cages.
D.moments={3:['departure',0],4:['opener',0],5:['opener',2],6:['opener',0],7:['opener',1],8:['departure',0],9:['departure',0],10:['opener',0],11:['departure',0],12:['departure',0],13:['opener',0],14:['departure',0]};
D.asides=function(session,beats){
 const r=session.record,m=D.moments[r.chapter];
 if(!m||r.phase!==m[0]||r.encounter!==m[1])return beats;
 return beats.concat(rows.filter(x=>x.kind==='gap'&&x.key.startsWith('q'+r.chapter+'_')&&C.inCompany(session.game,x.who)).map(x=>({
  who:x.who,key:x.key,fid:'gate',c3:true,to:'company',companionGap:true,
  lines:C.lines('gate',x.who,x.key)
 })));
};
// Recheck after preceding choices; an already queued aside cannot resurrect a
// departed companion. Do not repopulate consumed queues on resume.
D.available=(session,beat)=>!beat.companionGap||C.inCompany(session.game,beat.who);
D.refreshSaved=function(record){
 for(const beat of [...(record.queue||[]),record.reply].filter(Boolean)){
  if(!beat.lines)continue;
  beat.lines=beat.lines.map((line,i)=>{
   const index=line.vo||(beat.voOffset||0)+i+1;
   const edit=rows.find(r=>r.who===beat.who&&r.key===beat.key&&r.index===index);
   return edit&&line.t===edit.before?{...line,t:edit.t,voiceFile:edit.voiceFile}:line;
  });
 }
};
})();
