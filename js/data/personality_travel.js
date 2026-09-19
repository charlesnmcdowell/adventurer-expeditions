// Personal observations, not sixty copies of the same traveller's biography.
// Columns: forest, city, coast, port, mountain, dungeon; two listening responses.
(function () {
'use strict';
const rows = {
M01: [
"I like a road where I can hear someone approaching.|Buildings make it easy to forget how far you've walked.|The sea can have the view. I'll keep the dry footing.|I watch a crew work before I trust their boat.|Short steps. I've nothing to prove to a mountain.|I'll remember the way out before I wonder what is inside.",
"I'm listening. Keep walking.|I'll give that some thought."
],
M02: [
"I used to race along woodland roads. The roots won most of them.|Every street looks like it ought to lead somewhere exciting.|That wind makes a fine entrance. Hard to compete with it.|There's something about a harbor that makes a small job feel bigger.|I've been calling this the last climb for some time now.|An expedition underground! Sounds splendid until you say it underground.",
"You've got me listening now.|Go on. I can walk and pay attention. Allegedly."
],
M03: [
"I find the trees easier company once I can see the path.|I wish people would leave a little room when they pass.|I like the shore better when I can see where the water ends.|I never know where to stand without being in somebody's way.|I'm keeping my eyes on the path. The view can wait.|I'll speak up if I need us to slow down. I'm practicing that.",
"I'm quiet because I'm listening, this time.|You can keep talking. It helps a little."
],
M04: [
"Branches in the face. Mud in the boots. Fucking picturesque.|I hate a street where everyone thinks their errand outranks yours.|That wind could strip paint. Finally, something louder than me.|A harbor brings out every lying prick with something to sell.|I'm saving my breath for the climb. Complaints will resume later.|I don't like the dark deciding what I get to see.",
"I heard you. I'm thinking, for fuck's sake.|Keep talking. It's better than listening to my own temper."
],
M05: [
"A woodland path is a lovely place to develop an innocent alibi.|City streets taught me the value of looking as if I belong.|The sea improves a silhouette. Does dreadful things to the hair.|I used to practice looking prosperous near the docks. Very expensive hobby.|I promised myself I'd admire the view without leaning over anything.|Charming place. I should have brought my less visible expression.",
"Do continue. This requires no charm on my part.|You have an attentive audience of one."
],
M06: [
"I keep wondering which came first here, the path or the gaps between trees.|A street can tell you what a town used to need.|I could spend a day studying what the water leaves behind.|I like watching people solve the same problem with different knots.|I wonder how many routes were tried before people settled on this one.|Stonework interests me. Especially when it is keeping the ceiling up.",
"I'm listening carefully. I'd rather understand than guess.|Give me a moment to take that in."
],
M07: [
"I can tolerate mud. Being expected to admire it is another matter.|A city ought to make room for pedestrians with somewhere to be.|Salt air has a way of making everything look insufficiently maintained.|A fine vessel deserves a competent crew. The paint proves very little.|I intend to reach the top with some dignity left.|Whoever built this expected their work to endure. I appreciate the ambition.",
"You have my attention. I do not give it merely to be polite.|I am considering what you said. Carry on."
],
M08: [
"The smell of damp leaves always makes a journey feel longer to me.|I like the small signs that people have made a home somewhere.|The shore is good for thoughts I don't particularly want to finish.|Harbors put leaving and coming home so close together.|There's a comfort in a path having only one direction for a while.|I find myself thinking about the people who used these places in daylight.",
"I don't have much to add. I am listening, though.|I'll carry that thought a little way."
],
M09: [
"I don't mind a bit of mud. Gives me something simple to complain about.|I prefer a city when nobody is trying to make me hurry.|Sea air. I can enjoy that without making a speech about it.|I'm content to let the people with ropes know more than me.|I'll enjoy the view when the path stops requiring my attention.|I'll take the dark slowly. It isn't going anywhere.",
"Yeah. I'm taking it in.|You can finish your thought. I'm in no rush."
],
M10: [
"A walk under trees improves my mood. My socks remain unconvinced.|I enjoy a town that sounds awake, even when I'd rather be asleep.|I always arrive at the shore feeling younger. Then I taste the sand.|Harbors make me want to wave at strangers. Occasionally they wave back.|I'm told the view is worth the climb. My legs want that in writing.|I'd whistle, but I'd rather not discover what whistles back.",
"I'm still listening. This is my thoughtful face.|You don't have to hurry through it on my account."
],
M11: [
"I like trees. Very few have tried to explain a contract to me.|A city is a collection of people certain somebody else will clean up.|At least the sea doesn't promise to give anything back.|Nothing smells quite like a harbor discovering what it can charge for.|The climb is honest work. More than I can say for most work.|I assume the builders had an exit. A dangerous burst of optimism.",
"I'm listening. Any sarcasm is incidental.|Keep going. I haven't found a useful objection yet."
],
M12: [
"I used to hurry through the woods. I try to notice a little more now.|It's easy to pray for a city and forget to look at its people.|The sea reminds me how little a loud voice changes.|I spare a prayer for those who make their living beyond the shore.|I breathe between prayers on climbs like this. Sometimes during them.|I won't mistake an unfamiliar place for an unholy one.",
"I will listen before I offer an answer.|You have my attention, without a sermon attached."
],
M13: [
"A long walk is cheaper than a carriage. I remind my feet of that.|I notice what people repair. It tells me what they cannot replace.|Anything the sea offers for free usually needs expensive cleaning.|I like to know who owns a boat before discussing what I owe it.|I hope the reward allows for wear on the knees.|Old stone means old expense. I prefer not to add to it.",
"I'm listening. There may be value in knowing.|Let me think that over before I price an opinion."
],
M14: [
"I try to leave enough room for whoever walks behind me.|I find myself looking for people who need a little space to pass.|The shore helps me breathe more slowly. I like that about it.|I used to worry for every boat leaving a harbor. Still do, a little.|I don't mind matching a slower pace on a climb.|I will keep close enough to hear if anyone needs me.",
"Take your time with the telling.|I hear you. You needn't find a cheerful ending for my sake."
],
M15: [
"Mud. Roots. Walk where you can see.|I like streets with readable signs.|Good view. Bad place to drop anything.|I want the fare settled before anyone unties a rope.|I'll talk after the steep part.|I want to know where this passage leads before I enter it.",
"Heard you. Thinking about it.|Go on. No need to dress it up."
],
M16: [
"I keep checking the path behind us. It reassures me when it stays there.|I get nervous when I can't tell which footsteps belong to us.|I know the tide is supposed to move. I still keep checking it.|Ropes everywhere. I worry I'll step on the one holding something important.|I'm looking at the next few steps. That is plenty of mountain for now.|I'm trying not to name every sound. I give them dreadful names.",
"Yes, I'm listening. The fidgeting is unrelated.|Keep talking if you like. It stops me inventing worse things."
],
M17: [
"A woodland entrance! Lovely light, dreadful surface for a confident stride.|Every city has an audience. Most of it is late for something.|The sea provides magnificent accompaniment and absolutely no restraint.|A harbor could stage a hundred departures. Mine will require fewer ropes.|I had a stirring remark prepared. The climb has taken my breath budget.|Such acoustics. I shall resist testing them until we know who is listening.",
"For once, I shall leave the telling to someone else.|Go on. I am capable of an attentive silence. Briefly."
],
M18: [
"I used to like long walks. Now I like knowing when they end.|Town roads are kinder to tired feet than they get credit for.|The sea can do the restless moving for both of us.|I enjoy watching a boat leave when I am not required to chase it.|No hurry. The summit has had longer to get ready than I have.|I would find old stone more restful with a little more daylight.",
"I'm listening. Answering may take a moment.|Go on, if you've the breath for it."
],
M19: [
"I like knowing that someone walked here and made the way easier.|I try to remember we are passing through somebody else's ordinary day.|I always want a moment to look at the sea properly.|Watching a crew work makes me want to be useful. Best to ask first.|I may be slow on the climb. I'll keep making progress.|I won't pretend I'm comfortable. I can still do my part.",
"I want to hear what you mean. Take your time.|I'm paying attention, even if I haven't found an answer."
],
M20: [
"I like a path with more than one way off it.|In a city, looking lost and being lost are separate problems.|I enjoy a coast where my footprints don't keep a permanent record.|You can learn a great deal at a harbor by seeming to wait for somebody.|A narrow path makes it difficult to leave an awkward conversation.|I'll watch the way behind us. Things get interesting there too.",
"Go on. I'm keeping my own thoughts for the moment.|I am listening more than I'm letting on."
],
M21: [
"I settle into a pace before the road starts deciding it for me.|I keep enough space to turn without striking a passerby.|I watch my footing when the surface changes. Habit, mostly.|I keep clear of working lines. Someone else has trained for this.|Steady breathing serves me better than a show of speed.|I count turns until I have the route firmly in mind.",
"I'm attending. Continue at your own pace.|I will think before I respond to that."
],
M22: [
"A woodland path rewards taking your feet seriously.|I let hurried people pass. We rarely need the same destination.|I have learned to let the shore set the pace for a while.|I never begrudge someone checking a boat twice.|A climb is easier once you stop negotiating with it.|I would rather lose a minute looking than an hour finding the way back.",
"There's time enough to finish the thought.|I'm in no hurry to decide what to make of that."
],
M23: [
"Watch the footing. A stupid fucking fall still breaks a bone.|Crowded streets are no excuse to stop paying attention.|I respect the sea enough to keep off uncertain ground.|I prefer a crew that checks its work without being applauded.|I have no patience for showing off on a narrow path.|I don't trust a passage merely because someone bothered to build it.",
"I'm considering it. Don't mistake silence for agreement.|Finish what you were saying. Then I'll judge it."
],
M24: [
"I watch where the path disappears, not just where it is clear.|I glance at windows as well as doorways. Old habit.|I like being able to see so far. It doesn't make me stop looking nearby.|I watch the people who watch arriving boats.|I look back on a climb so the return doesn't seem unfamiliar.|I listen before I move around a blind corner.",
"I'm hearing you. My eyes are on the road.|Keep going. I can listen and keep watch."
],
M25: [
"Mud has a distressingly democratic attitude toward good boots.|I enjoy city streets. So many opportunities to look accidentally interesting.|Sea wind is useful when one wishes to look nobly troubled.|A harbor makes departing sound romantic. Boarding tends to spoil that.|I'm climbing with dignity. Any wheezing is a private matter.|I shall try to look dashing without leaning against anything ancient.",
"Please continue. I shall save my dazzling interruption.|You've persuaded me to listen without even flattering me."
],
M26: [
"I once took a shortcut through a wood. Excellent adventure. Terrible shortcut.|Cities are better when somebody recognizes you. For the right reasons, ideally.|I could look heroic on this coast all afternoon.|I have a natural air of command around ships. I am told to stand aside.|I'm setting a sustainable pace. The mountain should feel honored.|I intend to emerge with a story. Preferably one I can tell honestly.",
"Go on. Even I can't provide all the conversation.|You've got my attention. No small achievement on this road."
],
M27: [
"Roots trip you like loose rope. Same bloody lesson, different ground.|Dry streets. I'll grant a town that much.|Salt in the air. That smell gets into a life and stays there.|I look at the lines before the paint. Paint doesn't hold a vessel.|Give me a rolling deck over a bloody hillside. Decks eventually roll back.|Stone overhead makes me miss a horizon something fierce.",
"I'm listening, mate. Keep your footing.|Go on. I've room for another road story."
],
M28: [
"I choose a pace the whole company can keep.|In a crowd, I keep checking that nobody has been separated.|I want us clear on the route before the tide makes it urgent.|On a working dock, I follow the crew's directions.|If someone needs a halt, I would rather hear it early.|I want to know who is behind me before we take the next turn.",
"You have my attention. Finish your account.|I'm listening before I decide whether anything needs doing."
],
M29: [
"I once tried to discuss terms while walking through mud. Poor negotiating posture.|A city's manners change from street to street. I try to notice.|The sea is a difficult conversational partner. Never concedes a point.|Harbors teach the difference between an assurance and an agreement.|I am saving my most persuasive language for the descent.|I would prefer to admire the masonry from somewhere less enclosed.",
"I'll hear the rest before attempting to improve the wording.|Please continue. I can leave a silence unoccupied."
],
M30: [
"I know it's only leaves behind me. Knowing doesn't always settle it.|I sometimes look for familiar faces before remembering why I won't find them.|The sea is loud enough to make my thoughts take turns.|Departures unsettle me. I make myself watch the ordinary work around them.|Counting steps gives my mind somewhere simple to stay.|Echoes get under my skin. I'll keep my voice low.",
"I heard you. It takes me a moment to return sometimes.|Keep talking. I'd rather follow your thoughts for a while."
],
F01: [
"I put my feet where I mean to. The path gets no further consideration.|A crowded street won't make me hurry into a mistake.|Water wears down stone. I'll give it the room it deserves.|I trust a dockworker who tells me where I shouldn't stand.|I'm pacing this climb. Nobody needs a demonstration.|I mark the entrance in my mind before taking another step.",
"I am listening. I needn't interrupt to prove it.|I haven't dismissed what you said. I'm weighing it."
],
F02: [
"I enjoy a road that makes me wonder what comes next.|A new street is usually worth a look. Once the work is done.|I could get used to a horizon that wide.|Harbors make me want to go farther than I planned.|I'll admit the climb is hard. Still want to see the top.|I'm curious enough to go in and sensible enough to watch my step.",
"You've got my interest. Let's hear it.|I'll let you finish before I jump in. For a change."
],
F03: [
"I like following a path someone else has already found.|I try to keep out of people's way. Sometimes they could try too.|I find the sea easier to admire from a dry patch.|I don't like asking which way to go twice. Better than boarding wrong, though.|I'll manage the climb. I may just need a moment here and there.|If I go quiet, please don't assume I've stopped noticing things.",
"I'm hearing you. I just need time to find my words.|You needn't stop because I haven't said much."
],
F04: [
"One more branch in my face and I'm arguing with the fucking forest.|A city puts far too many elbows within reach of mine.|The wind can have my hair. I'm not fucking chasing it.|Harbors attract the sort of bitches who charge you to discover the price.|I'm angry at the hill. The hill seems fucking unconcerned.|I hate not seeing what's ahead. Makes every noise feel smug.",
"I'm listening. My face does this when I'm fucking thinking.|Finish it. I can keep my mouth shut that long."
],
F05: [
"Woodland walks sound intimate until you're picking leaves out of everything.|I enjoy a city that gives me reasons to linger after work.|The sea leaves salt on your lips. Saves anyone wondering where you've been.|I like watching reunions at a harbor. People forget to look composed.|I'll enjoy the view once my breathing sounds less suggestive.|Close quarters have their charms. This place is asking a great deal of them.",
"You have my attention without needing to lean closer.|Go on. I'm enjoying being the listener for once."
],
F06: [
"I wonder who keeps this path open when nobody is watching.|Street names often outlive the things they describe. I like finding the traces.|The tide hides half the place. I'd like to know which half.|I like finding out what the unfamiliar cargo is, without touching it.|I keep wondering how the first traveller chose the way up.|I'm trying to distinguish what was built this way from what has fallen away.",
"I want to understand that properly before asking anything.|Let me hold my questions until you've finished."
],
F07: [
"A path can be rough without requiring me to be impressed.|I expect streets to get people somewhere. A modest ambition, apparently.|The sea has excellent scale and no discernible discipline.|I look for whoever is actually in charge, rather than whoever is shouting.|I refuse to let an incline dictate my disposition.|Someone spent considerable effort making this place imposing. I have noticed.",
"Continue. I have chosen to hear you out.|I am giving this consideration. Allow me to finish doing so."
],
F08: [
"I find the woods kind when I don't feel much like talking.|A lit window always makes me think of the person waiting behind it.|I like how the shore lets a thought trail away unfinished.|I look at people saying goodbye longer than I mean to.|The climb leaves less room for thinking. Today I don't mind.|Abandoned places make me wonder which ordinary day was the last.",
"I'm listening, even if I can't make much of an answer.|You can let the thought end where it needs to."
],
F09: [
"I enjoy walking when nobody expects me to discuss how I feel about it.|A city makes it easy to be alone without being isolated.|The sea is quite capable of filling a silence.|At a harbor, everyone assumes you're waiting for something. Convenient.|I would appreciate the view more if it required less climbing.|I'll observe quietly. This place supplies enough atmosphere on its own.",
"I heard. I'm not obliged to have an immediate opinion.|You can continue. My attention hasn't wandered."
],
F10: [
"I like the smell of the woods. Even when most of it comes home on my boots.|A busy street makes me feel the day still has possibilities.|I always forget how much I like the first sight of the water.|I like the moment a boat comes close enough for people to recognize faces.|I'm collecting views on the way up. Sensible excuses for a breather.|I'll be pleased to see daylight again. That's something to look forward to.",
"I'm listening. You don't have to make it entertaining.|Take your time. I can enjoy the walk while I hear you."
],
F11: [
"Trees are pleasant company until they start contributing branches to your hair.|A city spends centuries finding new ways to obstruct a short walk.|A lovely shore. The sea has clearly had practice.|Harbors make a convincing argument that every fee needs another fee.|I admire the view in installments. My lungs insist.|A promising place to learn why people prefer windows.",
"I'm hearing you. The raised eyebrow is a separate service.|Do finish. I'll ration the commentary."
],
F12: [
"A quiet path is where I find my thoughts turning into prayers.|I try to notice the people a procession would walk past.|I have never found a prayer that makes the sea look smaller.|I think of all the names people ask the water to return.|I offer thanks for each safe foothold. It keeps the prayers practical.|I can respect a place without knowing whom it was built to honor.",
"I'll give your words a little room before mine.|I'm listening with more than an answer in mind."
],
F13: [
"Mud gets into seams. I notice anything that shortens the life of good boots.|I look at locked doors and wonder what makes their owners nervous.|The sea takes things without even having to negotiate.|A harbor is where a small unasked question becomes a large bill.|I'm counting the climb as wear on every possession below my waist.|Old places make people imagine riches. I imagine the cost of getting them out.",
"I'm paying attention. That doesn't commit me to anything.|I'll hear you out before deciding what it's worth to me."
],
F14: [
"I like to keep a pace where nobody needs to apologize for falling behind.|I notice the small courtesies that let a crowded street keep moving.|The shore makes it easier to be quiet with someone.|I always hope the people waiting here get good news.|I'll wait if anyone needs to catch their breath. Including me.|I want us near enough that nobody has to call very loudly for help.",
"I'm here. You can take your time saying it.|You don't owe me a tidy thought. I'm listening anyway."
],
F15: [
"I'm watching for roots. That's enough sightseeing.|Too many corners. I'm keeping up.|Windy. I'll save the conversation for shelter.|I'll stay clear of the ropes.|My lungs need the air more than my opinion does.|I'll look first. Then move.",
"Listening. Finish it.|Understood so far. Continue."
],
F16: [
"I startle at branches. At least they rarely take offense.|Someone passing too close sets my nerves going for another street.|I keep looking at the waterline. I prefer it at a distance.|I jump every time a rope creaks. There are a lot of ropes.|I'll let my feet concentrate while the rest of me worries.|I don't trust an echo to sound like what made it.",
"I'm listening. Sorry if I looked away too quickly.|You can keep going. Your voice isn't what startled me."
],
F17: [
"The woods offer mystery, beauty, and nowhere sensible to put a trailing sleeve.|A city never knows when to end a scene. Someone is always entering.|The sea would upstage a coronation. I respect that.|Harbors contain such magnificent goodbyes. And such hurried sandwiches.|I shall admire the mountain extravagantly once it releases my lungs.|This place has presence. I would like it to have better lighting.",
"I'll let your words have the scene for a moment.|Go on. I can listen without supplying an overture."
],
F18: [
"I like a path that doesn't ask more of me than walking.|A street with even footing feels like someone doing me a favor.|I find the water restful from a place where it cannot reach my boots.|All that loading and unloading makes me tired in sympathy.|I'm not racing this hill. It has had years of practice.|I'll be glad when the ceiling is the sky again.",
"I heard that. My answer may arrive a little later.|Keep talking if you want. Listening is within my ambitions."
],
F19: [
"I like knowing a path will still be useful after we've passed.|I try to be the traveller who leaves people glad we came through.|I want a moment to remember this view before work fills my head.|A busy harbor reminds me how much people rely on strangers doing their part.|I'll say when I need a rest. No use pretending with people depending on me.|I'm uneasy, but I would rather say so than become careless hiding it.",
"I'm making an effort to understand, not just answer.|I'll hear the whole thought. You have my attention."
],
F20: [
"I like noticing where a path stops being the easiest way through.|A city's useful routes aren't always the ones on its signs.|The water removes tracks. I try to remember it removes other evidence too.|I watch which questions make a dockworker look at someone else.|A high path makes concealment difficult. Worth remembering both ways.|I look for places someone could wait, as well as places we can walk.",
"I'm keeping an open ear and my conclusions to myself.|Say the rest. I'll decide what follows afterward."
],
F21: [
"I let my pace settle before I let my thoughts wander.|A busy street is easier once I stop trying to anticipate everybody.|The sea helps put an ordinary worry back in proportion.|I find a place out of the work and wait until I am needed.|I concentrate on breathing evenly. The height can keep its opinion.|I am taking a moment to look before the unfamiliar becomes alarming.",
"I am listening. There's no need to rush to an answer.|Let me consider that without speaking over you."
],
F22: [
"I've walked enough paths to stop resenting the muddy ones in advance.|A town changes fastest in the places you once thought permanent.|I still like the sea. Age hasn't improved my appetite for wet socks.|I remember when waiting at a harbor seemed romantic. Chairs improved it.|Short steps get you up a hill at any age. Pride is optional luggage.|Old stone deserves care. So do old knees. I'll attend to both.",
"Finish your thought, dear. I've learned to wait for those.|I'm listening. Experience hasn't supplied every answer yet."
],
F23: [
"I would enjoy the trees more if they kept their fucking branches to themselves.|A crowded street is an excellent place to discover who thinks elbows are manners.|The sea is impressive. I don't need to fall into it to confirm that.|I listen closely when someone insists a harbor charge is perfectly standard.|I'm pacing myself. Save the fucking encouragement.|I want a look at the floor before anyone admires the ceiling.",
"Finish the point. I'll keep my objections until then.|I'm listening, damn it. Silence isn't inattention."
],
F24: [
"I find the woods easier to cross when I leave the quiet alone.|I notice doorways people no longer use.|The shore gives a person room to think without asking why.|I think about those who leave without anyone there to see them off.|A long ascent leaves me with simple thoughts. I welcome that.|I will walk carefully. Places like this make care feel particularly necessary.",
"I hear what you're saying. Let it rest a moment.|You have my attention, although I have few words for it."
],
F25: [
"I should like to finish this walk with my belongings still reasonably presentable.|I try to observe a district's customs before inconveniencing its residents.|The coast deserves a moment of attention. From secure footing, preferably.|I ask where passengers belong before becoming an obstruction.|I intend to maintain a reasonable pace, with allowances for breathing.|I shall take care where I step. Age does not make masonry obliging.",
"Please finish your account. I am attending to it.|I would rather hear you fully than offer a premature opinion."
],
F26: [
"I like a woodland ramble. The scratches are usually worth the story.|A city gives me plenty of chances to be somebody's bad influence.|This wind makes me want to shout. I rarely need the encouragement.|Harbors make reckless ideas sound as if they have schedules.|I can handle the climb. Let me bitch about it while I do.|I'm going to look brave until I have a good reason to look elsewhere.",
"You've got my ear. Try not to look so fucking astonished.|Go on. I'll give somebody else a turn at being interesting."
],
F27: [
"I enjoy the green light under trees. I make allowances for what it does to hems.|A city reveals itself in its small details. I prefer walking slowly enough to see them.|I love the changing color of the water. Rather less its effect on leather.|A working harbor has a grace of its own, best admired from outside the work.|I reserve my admiration for the view until I have breath to do it justice.|I can appreciate old stone without touching everything that has survived this long.",
"Do continue. I am content to leave the conversation in your hands.|I'm considering your words. They deserve more than a reflex."
],
F28: [
"I check behind us from time to time. Nobody should have to ask us to notice.|I make room for people carrying more than I am.|I'll enjoy the shoreline once I'm certain nobody needs a hand.|I wait for instructions on a dock. Helping badly creates more work.|I try to keep enough breath to answer if someone calls.|I'll watch the way back while we find the way forward.",
"I'm listening properly. The other things can wait a moment.|Please finish. I don't want to miss something you meant to say."
],
F29: [
"I like to know whether a bend in the path matches the route we were given.|I check a street name before assuming the directions were accurate.|I want to know where the water reaches, not merely where it is now.|I ask exactly what passage includes. Approximately is an expensive word.|I prefer a measured pace to repeatedly discovering I went too fast.|I count the turns. Similar-looking passages are no reason to guess.",
"I'll hear the complete account before drawing a conclusion.|I'm listening for what you mean, not just the phrasing."
],
F30: [
"I like the way a path can occupy my feet while my thoughts go elsewhere.|Sometimes an ordinary street reminds me of someone. I never know which one will.|I watch the water come back and try not to ask that of other things.|I find departures difficult. Watching the work gives me somewhere to put my eyes.|The climb makes me attend to the next step. There is kindness in that.|I don't need the dark to remind me what absence feels like.",
"I am listening. You don't have to ease every word for me.|Keep going. It's good to have someone else's thought to follow."
]
};
// Work and homeward thoughts deliberately don't invent a victory, survivor
// count, moral approval, or knowledge of a particular faction's secrets.
const journey = {
M01: "I want to do the work we agreed to. Nothing needs embellishing.|I'll be glad to put this road behind me.",
M02: "I like getting started. Waiting gives my better judgment too much room.|I'm looking forward to finding out how good a seat can feel.",
M03: "I feel better once I know where I'm expected to be.|I'm trying to think about getting back, one turn at a time.",
M04: "I read the fucking terms. Surprises had better stay within them.|I'm ready for a roof and something that isn't another fucking road.",
M05: "I enjoy knowing exactly what I've agreed to before anyone gets inventive.|I shall be considerably more charming once I've had a rest.",
M06: "I like to keep the actual task separate from what I wonder about.|I want to write down what I noticed before memory starts tidying it.",
M07: "I expect the work to be conducted with some competence. Mine included.|I intend to be unavailable for a reasonable period after our return.",
M08: "Having something definite to do can make a day easier.|I'm looking forward to somewhere I can sit with my thoughts.",
M09: "I keep the job in mind. Doesn't mean I need to talk about it constantly.|Nearly time to stop being somewhere on the way to somewhere.",
M10: "I brought my enthusiasm. It occupies very little space in the pack.|I keep imagining the first stretch without this pack on.",
M11: "I've learned to read what a job omits as well as what it promises.|The prospect of sitting down is doing most of the walking now.",
M12: "I ask myself what is required of me before asking for divine assistance.|I will have more to give thanks for once we've finished this road.",
M13: "I keep the agreed reward firmly in mind when considering extra effort.|I'll be glad to stop spending leather on the ground.",
M14: "I want to do what I can without making the day harder for someone else.|I hope there's a little rest waiting at the end of this walk.",
M15: "I know the task. I'll keep to it.|I want this pack off. Soon, preferably.",
M16: "I keep going over what we're meant to do. It beats inventing other worries.|I'm picturing somewhere familiar. Somewhere with very few surprises.",
M17: "I shall attempt to keep my interpretation of the task within the agreement.|I propose that my next appearance involve a chair.",
M18: "I intend to spend my effort on the actual work, if the world permits.|I'm saving a little energy for the last part of getting back.",
M19: "I want whoever relies on me to know I took the work seriously.|I'm thinking about what I can learn once I've had a chance to rest.",
M20: "I prefer knowing what the agreement says before discovering what someone meant.|I'm looking forward to a place where I can stop looking purposeful.",
M21: "I keep the objective simple enough to remember under pressure.|I'll see my equipment put in order when we get back. Then I'll rest.",
M22: "I take a moment to understand a task before getting eager to finish it.|There is still a road to finish. No need to spend tomorrow's strength on it.",
M23: "I expect us to know the work before improvising a fucking addition.|I will inspect my kit before I let fatigue make decisions for me.",
M24: "I keep watching the approach even when the job sounds straightforward.|I won't stop paying attention just because we're heading back.",
M25: "I endeavor to know the terms before bringing my charm into the arrangement.|I am anticipating a rest with increasing sincerity.",
M26: "I intend to do work worth mentioning. Possibly more than once.|I have plans for describing this. First I have plans for sitting down.",
M27: "Know the job before you set off. Saves a bloody argument halfway there.|I'll be glad to feel something under me that isn't another step.",
M28: "I want everyone clear on their part, including myself.|We're still on the road. I'll relax once we've actually finished it.",
M29: "I prefer an agreement that survives being repeated without its flattering adjectives.|My enthusiasm for a comfortable chair is becoming difficult to express modestly.",
M30: "I keep bringing my thoughts back to what is in front of me.|I'm trying to think about the place we're going, rather than what stays with me.",
F01: "I give my word carefully. I intend to keep what I've agreed.|I have enough left for the way back. I'll spend it steadily.",
F02: "I like a task I can put my energy into. I still read the terms.|I can keep going. I'm simply becoming very fond of the idea of stopping.",
F03: "I want to be useful without pretending I know more than I do.|I hope I can have a little time to settle when we get back.",
F04: "I've had enough of bitches deciding the agreement meant something fucking else.|I'm saving my remaining patience for getting back. There isn't fucking much.",
F05: "I like an arrangement where everyone knows what they've actually offered.|A place to sit close to someone is sounding better than another impressive view.",
F06: "I try to identify what I still need to know before a job makes it urgent.|I have things to note down. Rest first might improve the handwriting.",
F07: "I intend to uphold my part of the agreement. I expect the same standard returned.|I look forward to being somewhere my comfort can receive proper attention.",
F08: "A task gives my thoughts something solid to return to.|I'm thinking of familiar things. It makes the way back feel gentler.",
F09: "I'll do the work without needing to discuss every feeling it inspires.|I would appreciate some time alone once the travelling is over.",
F10: "I can look forward to a journey and still take its purpose seriously.|I'm giving my tired feet little promises about what happens when we get back.",
F11: "I like knowing what a job requires before discovering its employer's imagination.|My interest in the scenery is being overtaken by my interest in a seat.",
F12: "I try to bring a clear mind to the work, as well as a prayer.|I will be grateful to finish the road before putting it into words.",
F13: "I haven't mistaken agreeing to work for offering unlimited favors.|I'm thinking about what will need replacing. I'd prefer to think sitting down.",
F14: "I hope I can do my part without forgetting the people around me.|I would like us to have a little room to recover after the walk.",
F15: "I read the job. That's what I'm here for.|Enough road for one day. I'll finish it.",
F16: "I repeat the task in my head. It keeps less helpful thoughts busy.|I think I'll feel better once the things around me look familiar again.",
F17: "I have committed to the task. I shall try not to enlarge it for dramatic effect.|I am rehearsing a graceful collapse into a very ordinary chair.",
F18: "I keep my efforts close to what was actually asked of me.|Getting back is a fine ambition. I'm not adding another just yet.",
F19: "I want my actions to match what I said I would do.|I'm looking forward to having time to think without watching my footing.",
F20: "I pay attention to who benefits from the parts of a job left vague.|I'll feel more at ease once the road has stopped choosing where I can go.",
F21: "I let the purpose of the work guide my attention, without rushing it.|I'll use the rest of the walk to let my thoughts settle.",
F22: "I have learned to ask what the work involves before offering an opinion on it.|I'll be glad to get the weight off my feet. They remember every year.",
F23: "I'm here for the agreed job, not some prick's last-minute fucking inspiration.|I'm keeping enough patience for the road back. Don't make it a contest.",
F24: "I think about what the task asks of me before I begin.|I will be glad of a quiet place where I can stop moving.",
F25: "I prefer our obligations stated clearly before they are put into practice.|I shall appreciate a moment to restore some order to myself upon our return.",
F26: "I've read the terms. Reckless doesn't have to mean fucking uninformed.|I'm ready to stop pretending this pack and I enjoy each other's company.",
F27: "I like to understand an undertaking before lending it my enthusiasm.|I am increasingly taken with the beauty of comfortable furniture.",
F28: "I want to finish what I agreed to without quietly leaving my part to someone else.|I'll make time to rest when we're back. That needs doing too.",
F29: "I distinguish what was promised from what I merely assumed.|I will take stock once we're back and I can do it without walking.",
F30: "I give myself a clear task to return to when my thoughts drift.|A familiar place won't settle everything. I'm still looking forward to it."
};
const terrains=['forest','city','coast','port','mountain','dungeon'];
for(const [pid,row] of Object.entries(rows)) {
 const p=ADV.DATA.DIALOGUE[pid], observations=row[0].split('|'), responses=row[1].split('|');
 const [job,home]=journey[pid].split('|');
 p.travelObservations=Object.fromEntries(terrains.map((terrain,i)=>[terrain,observations[i]]));
 for(const [id,loc] of Object.entries(ADV.DATA.TRAVEL_LOCATIONS)) p['travel_'+id]=[observations[terrains.indexOf(loc.terrain)]];
 for(const band of ['law','criminal','neutral'])p['travel_'+band]=[job];
 for(const band of ['return_win','return_loss'])p['travel_'+band]=[home];
 p.travel_midleg=[job];
 p.travel_response=responses;
 // Existing bonus lines belong to this actor and this relationship, and retain
 // the player's current profanity edits. Never borrow another actor's response.
 p.travel_hatred=[p.hatred[p.hatred.length-1]];
 p.travel_romantic=[p.romantic[p.romantic.length-1]];
}
// Preserve the user's particular hostile vocabulary when differentiating these.
ADV.DATA.DIALOGUE.M04.travel_criminal=['I once got paid to frighten a debtor. The bitch who hired me owed him more than he owed us.'];
ADV.DATA.DIALOGUE.M04.travel_law=['I have seen a guard beat a man with a rolled warrant. Official fucking business, apparently.'];
ADV.DATA.DIALOGUE.M04.travel_response=["I can listen without being a prick about it. Keep going.","I heard you. I'm thinking, for fuck's sake."];
ADV.DATA.DIALOGUE.F04.travel_law=["A seal on a contract doesn't make the person carrying it any less of a fucking bully."];
ADV.DATA.DIALOGUE.F04.travel_criminal=['I read the quiet-work contracts twice. I want to know what some lying bitch expects me to keep quiet about.'];
ADV.DATA.PERSONALITY_TRAVEL = rows;
const captions={
road:'Milestones outlast the promises made along the county road.',
forest:'The old bridge is officially condemned. Its crossing toll is still collected.',
marsh:'Marsh guides distrust lanterns whose light never touches the reeds.',
ruins:'Three crests occupy the same stones. None quite conceals the name beneath it.',
crypt:'Gravediggers advise counting the steps down, then counting them again on the way out.',
city:'Old watch marks linger on sheltered doors. Rain has cleared the others.',
alley:'An address here may have two doors. Only one is mentioned when strangers ask.',
prison:'Visitors bring food to the lockup. Guards have been known to charge for returning the bowl.',
tavern:'The chalkboard prices leave generous room for revision.',
coast:'Old charts place a village beyond the present shoreline.',
port:'A passage fare does not always include everything a passenger assumes it does.',
mountain:'Carriers built the shelters low enough for the worst wind to pass over them.',
maw:'Behind the laundry, parcels change hands that nobody has brought to wash.',
antler:'Companies change their banners. The toll collector remains at the same gate.',
academy:'At Varenholm, a delivery of ink may receive a more thorough inspection than its courier.',
bell:'The paper shops trade in names as readily as stationery.',
green:'Recruits sweep the steps in the rain. Their teachers say the leaves are not the lesson.',
tally:'Tally crews defend their shares even when nobody wants what is being divided.',
navy:'The tide keeps its own timetable. Admiralty paperwork prefers another.',
ossuary:'Bone carts serve the Ossuary. The drivers are reluctant to discuss their work.',
salt_court:'Salt has erased the king from surviving coins of the drowned court. His crown remains.',
green_altar:'A woodcutter claimed his buried axe grew leaves here. Others have come to look.',
birthing_house:'Roots have lifted sections of the old garden wall clear of the ground.',
low_tide:'The safe crossing stones change as winter tides reshape the coves.',
pyre:'The charcoal burners left after fires began appearing where none had been set.',
maw_boss:'Windows once dark after supper now keep candles burning, even in empty rooms.',
green_boss:'At practice in the courtyard, permission to speak comes after permission to lower a blade.'
};
for(const [id,text]of Object.entries(captions))ADV.DATA.TRAVEL_LOCATIONS[id].caption=text;
})();
