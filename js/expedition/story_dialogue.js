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
