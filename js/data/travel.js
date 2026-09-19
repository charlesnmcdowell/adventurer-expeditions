// Travel locations are content identities: contracts and character lives are not.
(function () {
'use strict';
const locations = {
 road: ['The County Road','forest','near','milestone','I learned to read the mile stones before I could read a contract. The distances lie less often.'],
 forest: ['The Deep Wood','forest','near','bridge','The bridge here was condemned before my first job. They still collect the crossing toll.'],
 marsh: ['The Reed Marsh','forest','mid','reeds','I used to follow the lanterns here. Then I noticed they never lit the reeds beneath them.'],
 ruins: ['The Old Ruins','dungeon','far','arch','I have seen three different crests cut into these stones. Each owner left the previous name underneath.'],
 crypt: ['The Crypt Steps','dungeon','far','grave','A gravedigger taught me to count the steps down. If the count changes coming back, find another stair.'],
 city: ['The Watch District','city','near','gate','The watch used to chalk safe houses on these doors. Rain made a lot of people suddenly respectable.'],
 alley: ['The Back Alleys','city','near','laundry','I delivered parcels here once. Every address had two doors, and only one admitted it existed.'],
 prison: ['The Lockup Quarter','city','near','bars','I brought food to a prisoner here. The guard charged me for the bowl on the way out.'],
 tavern: ['The Tavern Quarter','city','near','sign','I learned to ask for the price before ordering here. The chalkboard somehow gets dearer behind your back.'],
 coast: ['The Tidelands','coast','mid','wreck','I once found a road marker under the tide. There was a whole village on the old chart.'],
 port: ['The Outer Harbor','port','far','lighthouse','My first passage cost less than the rope they charged me for touching. Always ask what the fare includes.'],
 mountain: ['The High Pass','mountain','mid','shrine','An old carrier showed me those shelters. Built low for the wind, not because the builders were short.'],
 maw: ['Behind the Laundry','city','near','laundry','I once waited here for a shirt to dry. Three people collected parcels. Nobody brought any washing.'],
 antler: ['The Antler Toll Road','forest','near','toll','I have crossed this toll gate under three companies. They change the banner and keep the same collector.'],
 academy: ['Varenholm Approach','dungeon','far','runes','I carried ink to the Academy once. They inspected the bottles more carefully than the man carrying them.'],
 bell: ['The Paper Shop Lanes','city','near','paper','I bought paper here once. The shopkeeper knew who had sent me before I mentioned a name.'],
 green: ['The Green-Eyed Pass','mountain','mid','bamboo','I watched a recruit sweep these steps in the rain. His teacher said the leaves were not the lesson.'],
 tally: ['The Red Tally Anchorage','port','far','red_sails','I saw a Tally crew divide a broken compass into shares. Nobody wanted it; nobody would waive their portion.'],
 navy: ['The Admiralty Docks','port','far','blue_sails','I once stood in this queue until the tide changed. The clerk called the departing ship a scheduling error.'],
 ossuary: ['The Ossuary','dungeon','far','bones','I have seen the bone carts leave this district. Empty going in, empty coming out. I stopped asking the drivers.'],
 salt_court: ['The Salt Court','port','far','throne','A sailor showed me a coin from this drowned kingdom. Salt had eaten the king away. The crown was still clear.'],
 green_altar: ['The Green Altar','forest','far','roots','A woodcutter told me he buried his axe here. By spring the handle had put out leaves.'],
 birthing_house: ['The Birthing House','dungeon','far','roots','I remember when this place had a garden wall. The roots have lifted it clear of the ground.'],
 low_tide: ['The Low Tide Coves','coast','mid','wreck','A fisher once showed me the safe stones. I wrote them down. The sea moved two of them that winter.'],
 pyre: ['The Ash Fields','forest','mid','fire','I used to buy charcoal from this hillside. The burners left when the fires began lighting themselves.'],
 maw_boss: ['The Lamplighter Quarter','city','near','candles','I remember these windows dark after supper. Now every room keeps a candle burning. Even the empty ones.'],
 green_boss: ['The Widow’s Courtyard','mountain','mid','banner','I once watched practice through that gate. Nobody spoke when the last blade stopped. They waited for permission.'],
};
ADV.DATA.TRAVEL_LOCATIONS = Object.fromEntries(Object.entries(locations).map(([id,r])=>[id,{id,name:r[0],terrain:r[1],distance:r[2],landmark:r[3],lore:r[4],version:1}]));
const jobs = {
 law: 'I used to think a seal meant someone had checked the facts. Now I read the names underneath it.',
 criminal: 'My first quiet delivery came with a promise that nobody would get hurt. I check the locks myself now.',
 neutral: 'I have tracked hungry beasts before. They go where the food is, whatever the contract calls their territory.',
 return_win: 'I used to count the coin before the road home. These days I count the people first.',
 return_loss: 'I have walked away from work unfinished before. You remember the road back better than the one going in.',
 midleg: 'I mark the turns when the path gets narrow. Learned that after a very long night going in circles.',
};
ADV.DATA.TRAVEL_REGISTERS = {};
const registers = {
 dry: /Cool|Aloof|Cynical|Wry|Watchful|Sharp/,
 warm: /Jovial|Sunny|Gentle|Tender|Earnest|Sincere|Elder/,
 hard: /Stoic|Steely|Blunt|Curt|Disciplined|Severe|Exacting|Wrathful|Furious|Salted|Commanding/,
 proud: /Brash|Bold|Haughty|Imperious|Rakish|Boastful|Brazen|Theatrical|Dramatic/,
 anxious: /Timid|Meek|Nervous|Skittish/,
 weary: /Melancholy|Sorrowful|Weary|Worn|Grave|Unquiet|Bereaved/,
 sly: /Roguish|Sultry|Avaricious|Grasping|Sly|Cunning|Silver-Tongued/,
 formal: /Devout|Pious|Patient|Composed|Formal|Dutiful|Elegant|Curious|Inquisitive/,
};
const replies = {
 dry: ['That explains a few things. None of them encouraging.','Experience is an expensive way to discover the obvious.'],
 warm: ['I am glad you remembered. Someone should.','Tell me the rest when we get home.'],
 hard: ['Useful. Keep your eyes on the road.','That is how you learn. Once should be enough.'],
 proud: ['I will remember that. Preferably without repeating the mistake.','There is always something they leave out of the stories.'],
 anxious: ['I wish you had mentioned that before we set out.','Right. I will stay where I can see you.'],
 weary: ['Funny what stays with you after a job.','I know the sort of lesson. You keep paying for it.'],
 sly: ['Somebody made money out of that. Somebody always does.','Good to know. I would rather learn it at someone else’s expense.'],
 formal: ['That belongs in the briefing. I will remember it.','Experience is worth recording, even when it is inconvenient.'],
};
for (const [pid,p] of Object.entries(ADV.DATA.DIALOGUE)) {
 if (!/^[MF]\d\d$/.test(pid)) continue;
 const reg = Object.keys(registers).find(k=>registers[k].test(p.name)) || 'dry';
 ADV.DATA.TRAVEL_REGISTERS[pid] = reg;
 // Shared writing is recorded separately for every established actor.
 for (const [id,r] of Object.entries(ADV.DATA.TRAVEL_LOCATIONS)) p['travel_'+id] = [r.lore];
 for (const [id,t] of Object.entries(jobs)) p['travel_'+id] = [t];
 p.travel_response = replies[reg].slice();
 p.travel_hatred = [/Wrathful|Furious|Severe|Sharp|Blunt|Curt/.test(p.name)
   ? 'Keep your fucking distance. I can watch the road without watching you as well.'
   : 'We can share a road. That does not mean I trust you.'];
 p.travel_romantic = ['Stay beside me. I like knowing which footsteps are yours.'];
 if (/Wrathful|Furious/.test(p.name)) {
   p.travel_law = ['I have seen a guard beat a man with a rolled warrant. Official fucking business, apparently.'];
   p.travel_criminal = ['I once got paid to frighten a debtor. The bitch who hired me owed him more than he owed us.'];
   p.travel_response = ['Useful. Those bitches could have told us sooner.','I have heard worse. Usually from the prick paying us.'];
 }
}
const named={
 kite:['I learned these lanes carrying messages. A short route is no use if someone remembers your face.','Good. Remember the way out as well.'],
 roscarrow:['My first company paid us at the gate. I still count heads here, even when there is nobody waiting with a purse.','Keep that in mind when the contract gets complicated.'],
 vaunt:['I used to rehearse examinations on the walk to the Academy. Nobody examines what you do when the approved answer fails.','Observation before conclusion. That much they taught correctly.'],
 suzume:['I carried paper down this street as a child. They taught me to notice which windows opened when I passed.','Remember it. Small details keep people alive.'],
 ayame:['I practised my first form on these steps. The slope shows you which foot you are trusting too much.','Then we know something we did not know at the gate.'],
 beau:['My first share bought me a coat. Lost the coat overboard that afternoon. The ledger still calls it a profitable voyage.','That sounds like something worth putting in the small print.'],
 fane:['My first posting was at the harbor chain. I thought the ships were the whole world. Mostly I learned to wait.','We will account for it before we commit.'],
 vane:['I have sent people through these streets for years. Today I get to see what I have been asking of them.'],
 crane:['I signed the company through this gate. I am walking through it with you.'],
 venn:['I remember arriving here with a trunk of books. None of them prepared me for this walk.'],
 kaede:['I used to take this road with someone who knew when to let the silence stand.'],
 isamu:['I have given enough orders from behind these walls. Today I will be where they lead.'],
 saintcloud:['I know what the ledger says this voyage costs. I want to see who comes back to collect.'],
 vanekessler:['I have watched ships leave from this quay for years. It looks different from the departing side.'],
};
for(const [who,lines] of Object.entries(named)) {
 const def=ADV.DATA.CAMPAIGN_CHARS[who];if(!def)continue;
 const table=ADV.DATA.CAMPAIGN_DIALOGUE[def.faction]||ADV.DATA.CAMPAIGN2_DIALOGUE[def.faction];
 if(table&&table[who])table[who].travel=lines.map(t=>({t,v:t}));
}
})();
