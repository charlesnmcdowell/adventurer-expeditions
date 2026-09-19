// Ninja vs Pirates campaign dialogue (add-on §2, §5). Same rules as the first
// campaign: every line carries backstory, a want, a regret, a read on the
// player, or tactical information. Short sentences. Nothing hides the point.
// {target} is vocative and dropped in voice; {they}/{them}/{their} name the
// rival on screen and read as pronouns in audio.
// Bracketed tags are ElevenLabs v3 delivery cues — spoken, never shown.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {}; ADV.DATA = ADV.DATA || {};
const L = (t) => ({ t });

ADV.DATA.CAMPAIGN2_DIALOGUE = {

// =====================================================================
// THE HOLLOW BELL — neutral. Old, patient, and it remembers everything.
// =====================================================================
bell: {
  obaasan: {
    offer: [
      L('[calm] Come in. The cheap paper is on the left. The work I want to talk about is behind the counter.'),
      L('[flatly] I have kept this shop for sixty years. I also keep the Hollow Bell. We take contracts from anyone who pays, and we keep every name.'),
      L('[thoughtful] You finish jobs and you walk back into town. That is rarer than people think, and it is why I asked for you.'),
      L('[calm] Come and work for us, {target}. Do the jobs I hand you. Do not ask who paid.'),
    ],
    tutorial: [
      L('[calm] Your work comes from me now. Come to the shop. Do not take jobs off the town board while you are ours.'),
      L('[flatly] Five contracts. They get worse in order. Do them in order.'),
      L('[quietly] Watch our people fight. You cannot buy what they do — you have to see it done, and then it is yours.'),
      L('[calm] Finish all five and you keep a full set of our gear. Everything you saw stays with you as well.'),
    ],
    decline: [L('[flatly] Then take a sheet on your way out. I will still be here when you change your mind.')],
    debrief1: [
      L('[impressed] The scribe has stopped writing and he is still breathing. That is harder than killing him and worth more.'),
      L('[calm] The Paper-Keeper works for me. I sent him to find out whether you would check. You did not, and now you will.'),
    ],
    debrief2: [
      L('[calm] Ren was dead for six years before you met him. Somebody paid a necromancer to keep him useful and did not tell me.'),
      L('[thoughtful] That is the second time this year. Someone is raising our dead and putting them behind us.'),
    ],
    debrief3: [
      L('[warmly] You brought {them} home whole. {they} will not thank you for it, so I am doing it instead.'),
      L('[quietly] The Left Hand said you fight like someone who expects to lose and has decided not to. He meant it kindly.'),
    ],
    debrief4: [
      L('[sorrowful] Suzume is dead. Sit down. No — sit down.'),
      L('[sad] I took {them} off a roof as a child, stealing lamp oil. {they} told me {their} name was a number for a month.'),
      L('[flatly] The thing that killed {them} did not decay. It should have. Three quests and a raised body comes apart — that is the rule and it did not happen.'),
      L('[quietly] Kaede wants you upstairs. She has known his name for twenty years and she has never once said it out loud.'),
    ],
    why: [
      L('[tired] They think the paper is a front. It is not. People need it. I sell it, and I am good at it.'),
      L('[quietly] I have never held a knife. I have sent four hundred people out with one, and I sleep through the night.'),
      L('[calm] That is the work. Not the killing. Coming back, and sleeping after. You will learn it, and you will not notice the day you did.'),
    ],
  },
  suzume: {
    after1: [
      L('[flatly] You are the new one. I am Suzume. I have been the fastest in this clan for four years and I have the tally to prove it.'),
      L('[impressed] Your first job was ugly and you closed it anyway. Most of them freeze at the door. You did not.'),
      L('[calm] The jobs that pay real money would kill you today. I take those. Get better and I will take you on one.'),
    ],
    after2: [L('[impressed] Two for two. Fine. I am watching now, which is more than I give most people.')],
    join3: [L('[flatly] I am coming. You are not ready to go alone and I would rather be there than hear about it.')],
    banter: [
      L('[quietly] Take the left one. {they} watches a doorway all day and has never once been flanked.'),
      L('[impressed] Good. Kaede hears about every contract, and she will hear about that.'),
      L('[calm] Stop counting them. Count the exits.'),
    ],
    after3: [
      L('[impressed] You did not need me on that one. I want it noted that I noticed.'),
      L('[thoughtful] Everyone Obaa-San brings in wants my place. You are the first who might actually take it.'),
    ],
    before4: [
      L('[quietly] I have never worked twice with the same person. Not once in four years. It is a rule and I made it for a reason.'),
      L('[softly] This is twice, {target}. Do not make a speech about it.'),
    ],
    death: [L('[desperately] {target} — go. Do not look at him, just go.')],
  },
  jiro: {
    appear: [
      L('[flatly] Do not stop. Let {them} finish opening the girl first. It has to be our clan that did it or none of this works.'),
    ],
    afterKill: [
      L('[calm] Twenty years ago Kaede signed my name on a slate and someone cut my throat in a stairwell. Nobody remembers why. I have asked.'),
      L('[flatly] A necromancer raised me for three quests of work. The three ran out. I did not come apart. I have been walking ever since and nothing has switched me off.'),
      L('[quietly] Your priest is no use to me. True Rest ends a working, and there is no working left in me to end.'),
      L('[dismissive] Go and tell her I am close. That is the whole reason you are still standing, {target}.'),
    ],
    final: [
      L('[flatly] Kaede. Twenty years and you sent children to do it.'),
      L('[calm] I am not angry. That is the part nobody believes. I am simply still here, and everything I had went away.'),
      L('[quietly] You cannot kill me the ordinary way, so put everything you own into it at once. I would like it to be finished.'),
    ],
  },
  kaede: {
    first: [
      L('[quietly] I am Kaede. I keep the bell. Every name that goes out of this shop goes out because I said it could.'),
      L('[calm] I have ordered more deaths than anyone in this city, and I have never once raised my voice to do it.'),
      L('[flatly] Obaa-San says you are careful. Do the five contracts. When you have, we will talk about what you are for.'),
    ],
    hunt: [
      L('[quietly] Twenty years ago I ordered a man killed. I had a reason. I have forgotten it and that is the part I cannot forgive myself.'),
      L('[calm] He is undead and he does not decay, so nothing holy will help us. He has to be taken apart the way anything is taken apart.'),
      L('[flatly] He will lock you out of your reactions before he swings. Do not save anything for later. There is no later in this.'),
    ],
    fight: [
      L('[quietly] Behind him. The dead ones do not turn.'),
      L('[calm] Keep hitting. He does not heal, he only continues.'),
    ],
    afterFall: [
      L('[quietly] Twenty years. Thank you.'),
      L('[sad] He asked me why, at the end, and I still do not know. I want you to understand that I looked for the answer.'),
    ],
    ending: [
      L('[calm] The bell rang once tonight. It has not done that since before you were born and it will not again while I keep it.'),
      L('[quietly] You are the Bell\'s own hand now, {target}. Everything you saw on those five contracts is yours to keep.'),
    ],
  },
},

// =====================================================================
// THE GREEN-EYED — lawful. Correct about everything, right about less.
// =====================================================================
green: {
  takeda: {
    offer: [
      L('[flatly] Stand straight. I will not ask twice, and this is not a favour.'),
      L('[calm] I train blades for the Green-Eyed. The city writes the law. We keep it. That is the work.'),
      L('[thoughtful] Your guard is sloppy. Your feet are not. Feet are the hard part, so you may stay.'),
      L('[calm] Five contracts, {target}. Finish them and you wear a green cord with a clan behind it.'),
    ],
    tutorial: [
      L('[flatly] Your contracts come from this hall. Not the town board. Here.'),
      L('[calm] Five jobs, each harder. Do them in that order. We will see what you are.'),
      L('[thoughtful] Watch how our blades move. You cannot buy those forms. You take them by seeing them done.'),
      L('[calm] Finish, and the clan arms you. That armour says who you belong to. Do not treat it like a gift.'),
    ],
    decline: [L('[flatly] Then you are not a Green Cord and I will not remember your name. The door does not lock behind you.')],
    debrief1: [
      L('[impressed] Sagara said your footing went and you put it back. From him, that is the whole report.'),
      L('[calm] The road is clear. Nobody has written to complain. That is the job.'),
    ],
    debrief2: [
      L('[flatly] The man is in a cell. The summons was lawful. He was also right, and I will not lie to you about that.'),
      L('[quietly] We do that sometimes. You will have to decide what it means. I already have, and I still sleep here.'),
    ],
    debrief3: [
      L('[impressed] Ayame asked for you on the next one. She does not ask for people.'),
      L('[calm] Doi said you watched the field, not the sword. That is why you are still standing.'),
    ],
    debrief4: [
      L('[sorrowful] Ayame is dead. Do not stand there.'),
      L('[sad] I admitted her myself, against the hall, after the fire. She was the only woman we ever swore, and she made the rest of us look slow.'),
      L('[flatly] The woman who killed her used our draw. She learned it alone. She learned it well enough to kill our best.'),
      L('[quietly] Lord Isamu is waiting. Ask him the husband\'s name. Watch what his mouth does.'),
    ],
    why: [
      L('[tired] I was a poor swordsman and a worse man. This clan gave me a rule I could stand inside. That is all it is.'),
      L('[flatly] When I turn someone away I tell them why. Nobody else in this hall will.'),
      L('[quietly] We serve the law. People write the law. Some of those people are wrong, and we still go. You will have to live with that, or leave.'),
    ],
  },
  ayame: {
    after1: [
      L('[formal] Ayame. Sworn Blade. I hold the best record in this hall. I am not asking you to like it.'),
      L('[calm] I am the only woman they have ever sworn. I had to be twice as good for the same cord.'),
      L('[impressed] Your report was clean. Sagara writes messy ones about people he expects to bury.'),
    ],
    after2: [L('[calm] Two contracts and no one has filed against you. I read yours first now.')],
    join3: [L('[formal] I requested you. Do not embarrass either of us — I had to argue for it.')],
    banter: [
      L('[calm] Hold the line. Chase them and you are somewhere the clan did not send you.'),
      L('[flatly] Their archer draws late. Wait for it, then take him.'),
      L('[impressed] Yes. Like that. Again.'),
    ],
    after3: [
      L('[thoughtful] I thought you would take three contracts and go home. You are still here.'),
      L('[calm] I would stand beside you again. That is not something I waste.'),
    ],
    before4: [
      L('[quietly] Escort work. Isamu\'s cousin, a good road. Nothing ever happens on it.'),
      L('[formal] Stay on my left, {target}. I do not explain that.'),
    ],
    death: [L('[desperately] Guard — {target}, guard! She is already drawing —')],
  },
  kira: {
    appear: [
      L('[quietly] Not the girl. The one in the green cord. I have waited a long time for a Sworn Blade to stand still.'),
    ],
    afterKill: [
      L('[flatly] Isamu\'s clan burned my husband\'s house on the city\'s word. My children were inside. Every part of that was lawful.'),
      L('[calm] They do not admit women. So I learned their forms alone, in a shed, from a book and the way he used to stand.'),
      L('[quietly] I have just killed their best blade with their own draw. She never touched me.'),
      L('[dismissive] I am not hunting your clan, {target}. I am hunting Isamu. Anyone in front of him is in the way.'),
    ],
    final: [
      L('[angry] Say their names. You signed the order — say the names on it.'),
      L('[flatly] You will not, because you never read it. I have hated that since the fire. Not the flame. That you did not even look.'),
      L('[calm] I draw first. I always do. Stand aside or put me down.'),
    ],
  },
  isamu: {
    first: [
      L('[formal] I am Isamu. I hold this clan. I answer to the city, and the city answers to no one.'),
      L('[calm] We are not hired swords. Every blade in this hall is sworn. A sworn blade does not ask if the order is wise.'),
      L('[thoughtful] Takeda says you have promise. He is careful with that word. Complete the five.'),
    ],
    hunt: [
      L('[calm] Her name is Tomoe. Her husband held a house we destroyed on the city\'s word. Her children died in it.'),
      L('[flatly] She has trained in our forms since the fire, alone, to reach me. Today she does.'),
      L('[quietly] She opens with an Iai draw and it goes through any guard you set. Do not set one. Be somewhere else.'),
    ],
    fight: [
      L('[formal] Hold the line and let her come to it.'),
      L('[calm] She is fast and she is alone. Use that.'),
    ],
    afterFall: [
      L('[quietly] She was better than Ayame. Say that in this hall while she is still here.'),
      L('[thoughtful] I signed the order. I told myself the city had already decided. I still do not know which of those is the excuse.'),
    ],
    ending: [
      L('[formal] The clan buried her under her husband\'s name. I attended. Nobody asked me to.'),
      L('[calm] You are a Blade of the Clan now, {target}. The forms are yours. So is what we did with them.'),
    ],
  },
},

// =====================================================================
// THE RED TALLY — criminal. Piracy as accounting, with weather.
// =====================================================================
tally: {
  hallow: {
    offer: [
      L('[happily] Sit down, have a drink, do not touch the ledger. I am Cask and I keep the shares for the Red Tally.'),
      L('[calm] We are pirates. I write down every share, because a crew that fights over money sinks faster than one that gets shot at.'),
      L('[impressed] You did a job last week that paid badly and you still did it right. That is worth more to me than nerve.'),
      L('[playfully] Come on the tally, {target}. Full share, written honest, and nothing lawful will ever speak to you again.'),
    ],
    tutorial: [
      L('[calm] Your work comes off my book now, not the town board. Five jobs, and they get bigger.'),
      L('[flatly] One thing before you sign. On this crew you are a criminal for the rest of your life. No navy. No lawful clan. That door shuts tonight.'),
      L('[happily] Watch the crew fight. Half of what they do you cannot buy — you have to see it, then it is yours.'),
      L('[calm] Five jobs and you get a privateer\'s kit and a full share written in my hand.'),
    ],
    decline: [L('[calm] Sensible. Half the people who sign wish they had said that. The offer stays open — I do not chase.')],
    debrief1: [
      L('[impressed] Teague had been taking extra shares. You found it in a day and you left him breathing, which is what I wanted.'),
      L('[calm] Everyone on four decks knows the book gets read. That was the real job.'),
    ],
    debrief2: [
      L('[happily] The Factor paid, apologised, and asked for terms. I gave him terms. I am a quartermaster, not a butcher.'),
      L('[thoughtful] I have kept this book since the first prize. Most who sign are gone before the hard jobs. You are still here.'),
    ],
    debrief3: [
      L('[impressed] Ordell\'s fleet took the prize and dropped it. Beau said you were faster than he was. He looked sick saying it.'),
      L('[calm] {they} came home with all his fingers. For {them}, that is a good week.'),
    ],
    debrief4: [
      L('[sorrowful] Beau is dead. Put that down and sit.'),
      L('[sad] He shot for this fleet since he could hold a pistol. He was insufferable, and he was as good as he said.'),
      L('[flatly] Kessler killed him, took nothing, and let you go on purpose. He wanted the story delivered and he used you to do it.'),
      L('[quietly] Saint-Cloud is on deck. She has a letter from that man for every captain he has hanged. She keeps them.'),
    ],
    why: [
      L('[calm] People ask how I square it. I do not. I keep a book. The book is honest even when the fleet is not.'),
      L('[thoughtful] I have written down robberies and killings and every share was right to the coin.'),
      L('[quietly] That is what I am for. Not the taking — the shares. Somebody has to be trusted or this whole thing eats itself.'),
    ],
  },
  beau: {
    after1: [
      L('[playfully] Beau Castell. Best gun in the fleet. You will want to argue and you will lose.'),
      L('[impressed] Your first job was a mess and you finished it standing. I have watched better people run.'),
      L('[calm] The jobs with real money would put you in the water. I take those. Get better and I will let you carry something.'),
    ],
    after2: [L('[playfully] Two out of two. I have started using your name on purpose. Enjoy it.')],
    join3: [L('[calm] I am coming. Not because you need me — because I want the prize and you are slow.')],
    banter: [
      L('[playfully] Left one, then the one behind him. He is reloading and he is proud of it.'),
      L('[impressed] Fine. That was good. I am not saying it again.'),
      L('[calm] Do not stand in front of a gun captain. Stand in front of the boy loading for him.'),
    ],
    after3: [
      L('[calm] You did not need covering on that. I barely fired and I am annoyed about it.'),
      L('[thoughtful] I have shot beside a lot of people on this fleet. You are the one I would pick.'),
    ],
    before4: [
      L('[playfully] Fat merchantman, light escort, no trouble. I have said that before and been wrong.'),
      L('[softly] Stay behind me going over the rail, {target}. Forget I said it.'),
    ],
    death: [L('[desperately] Down — {target}, get down, he has already —')],
  },
  vanekessler: {
    appear: [
      L('[calm] Marines, hold. Let the man with the pistol raise it first. I will not have this written down as anything but what it is.'),
    ],
    afterKill: [
      L('[flatly] Admiral August Kessler. A foreign empire pays me to make these waters safe for trade. That is the whole instruction.'),
      L('[calm] I hanged captains. I did not like it. I did it anyway. That is the job.'),
      L('[thoughtful] That man was the best shot in your fleet. He died covering someone he had barely met. Tell them that. It is true.'),
      L('[dismissive] Go back to Saint-Cloud, {target}. Tell her the last rope is cut and hanging. She will know — I have written to her about every one.'),
    ],
    final: [
      L('[calm] Captain Saint-Cloud. Every letter, and you never answered one.'),
      L('[flatly] I am not a monster. I am a man with a fleet and orders. That is worse for both of us.'),
      L('[quietly] Steel comes back at you if you swing it at me. Come with something else, or come ready to lose.'),
    ],
  },
  saintcloud: {
    first: [
      L('[calm] Meriel Saint-Cloud. I command this fleet. I do not raise my voice on a deck. I have not needed to.'),
      L('[quietly] There is an admiral out there who writes to me. Courteous letters. He hangs my captains and describes each one.'),
      L('[calm] Do Cask\'s five jobs. Then we will talk about the letter he has not sent yet.'),
    ],
    hunt: [
      L('[quietly] He has hanged my captains and written to me about each one, by name, in his own hand. I keep the letters in my cabin.'),
      L('[calm] He is not a villain. He is a professional with a fleet and an order. That is harder to kill.'),
      L('[flatly] He turns steel back on whoever swings it. Shoot him. From the back of the deck. Do not go near him.'),
    ],
    fight: [
      L('[angry] Keep off his reach. Everything you give him he throws the fuck back.'),
      L('[flatly] Shoot him. From the back of the deck. Do not go near him.'),
      L('[angry] What the hell are you waiting for. Take the officer.'),
    ],
    afterFall: [
      L('[quietly] All those letters. I never answered one. Now I never will.'),
      L('[sad] He was the only honest man who ever came for me. I would have liked him on a different sea.'),
    ],
    ending: [
      L('[calm] The Admiralty has lost its admiral. The shallows are ours for a while. That is all anyone gets.'),
      L('[quietly] Captain\'s Portion, {target}. Written in Cask\'s hand, which means it is true.'),
    ],
  },
},

// =====================================================================
// THE ADMIRALTY — lawful. Funded, uniformed, and slower than what it hunts.
// =====================================================================
navy: {
  crell: {
    offer: [
      L('[calm] Boatswain Crell. I sign on anyone with two hands. I have signed on worse than you, and I mean that kindly.'),
      L('[flatly] This is a navy. We treat the sea like it answers to us. It does not, so we do a lot of paperwork and a lot of shooting.'),
      L('[tired] I have drowned twice. Properly, both times, and they got me back. I mention it so you know I am not joking about the shallows.'),
      L('[calm] Sign on, {target}. Rated hand, King\'s pay, lawful work only. That closes some doors. Know that before you make your mark.'),
    ],
    tutorial: [
      L('[calm] Your orders come from this room now. Not the town board. From me, in order.'),
      L('[flatly] Five commissions. They get worse. Do not skip and do not volunteer.'),
      L('[tired] Watch the officers work. Half of what they do is not in any manual. You learn it by being there.'),
      L('[calm] Finish the five and you are warranted — King\'s uniform, and whatever you picked up along the way.'),
    ],
    decline: [L('[calm] Right you are. The book stays open on the desk and I am always here. I have nowhere else to be and no sea legs left to take me.')],
    debrief1: [
      L('[impressed] Shallows are clear, smugglers in irons, and Holt says you took orders without arguing. That last part is the rare one.'),
      L('[calm] Nobody drowned. That is the part I care about.'),
    ],
    debrief2: [
      L('[tired] Ship taken, papers filed. The captain was feeding a village with that cargo. He said so, in front of everyone. It was still lawful.'),
      L('[quietly] That is going to happen again. I am telling you now so it does not knock you over next time.'),
    ],
    debrief3: [
      L('[impressed] Nairn lost the command and Merrow got it. She asked for you by name. The whole wardroom sat up.'),
      L('[calm] {they} wrote a report on you. All of it good. She does not waste paper.'),
    ],
    debrief4: [
      L('[sorrowful] Merrow is dead. Sit down, lad. Sit down.'),
      L('[sad] Youngest officer in the fleet. The only one who read the whole standing order before she signed it. She wanted a command so badly she never asked for one.'),
      L('[flatly] Ash said her name while he did it. Witnesses agree. He meant it, which is the part I cannot get past.'),
      L('[quietly] The Admiral wants you. Ash has beaten this fleet every time they met. He has read every report.'),
    ],
    why: [
      L('[tired] I have drowned twice and signed on again both times. People laugh. It is not a joke.'),
      L('[quietly] The sea does not care about our papers. We pretend it does, and because we pretend hard enough, cargo moves and people eat.'),
      L('[calm] That is worth going under for. I have not decided if it is worth going under again.'),
    ],
  },
  fane: {
    after1: [
      L('[formal] Lieutenant Isolde Merrow. Youngest officer in this fleet. I have read the standing orders. Most have not.'),
      L('[calm] Your commission was done correctly and reported accurately. I checked both.'),
      L('[flatly] The fights that matter would kill you as you are. I intend to have a command of my own, and I cannot carry passengers.'),
    ],
    after2: [L('[impressed] Two commissions, nothing irregular. I have stopped checking your reports twice.')],
    join3: [L('[formal] I asked for you. The wardroom found that funny. Do not make them right.')],
    banter: [
      L('[formal] Hold your position. The formation is the weapon, not you.'),
      L('[calm] Their gunner reloads late. Take him then.'),
      L('[impressed] Correctly done. I will put it in the report.'),
    ],
    after3: [
      L('[calm] You held the line without being told. Do you know how rare that is?'),
      L('[quietly] Since I put this coat on, everyone has measured me against someone else. You just stood next to me and did the work.'),
    ],
    before4: [
      L('[formal] Routine patrol. Nobody has seen Ash in the shallows for a month. I do not like a quiet sea.'),
      L('[quietly] Stay on the rail beside me, {target}. That is not in the orders. I know.'),
    ],
    death: [L('[desperately] Boarders — {target}, the rail, the rail —')],
  },
  ash: {
    appear: [
      L('[playfully] Good evening. Nobody move quickly and nobody has to be brave about anything.'),
    ],
    afterKill: [
      L('[warmly] Dorian Ash. The Tide-Taker, if you read broadsheets. This navy has come for me nine times. They are still coming.'),
      L('[calm] That was Lieutenant Isolde Merrow, and she was the finest officer they had. I knew her name before tonight. I said it while I did it. I meant it.'),
      L('[playfully] I would rather talk to you than fight you. Talking works. Fighting is what people do when talking fails.'),
      L('[calm] Go home, {target}. Tell them exactly what you saw. I would rather have the story out there than another body in the water.'),
    ],
    final: [
      L('[warmly] Admiral. Here we are again. You keep reading the reports. I keep writing them.'),
      L('[playfully] You know what I do and it has never helped you. I know that is irritating. I quite like it.'),
      L('[calm] Board me then. I have taken your ships by being the man they wanted to talk to first.'),
    ],
  },
  vanekessler: {
    first: [
      L('[calm] Admiral August Kessler. A foreign empire pays this fleet to keep trade moving. That is the instruction. I have never needed another.'),
      L('[flatly] I have hanged pirate captains. I did not enjoy it. I still fucking did it. Decide now if you can serve under that.'),
      L('[thoughtful] Crell says you can take an order. Do the five commissions. Then we will talk about the man who keeps beating this fleet.'),
    ],
    hunt: [
      L('[calm] He has beaten us every time we have met. I have read every report. I know what he does.'),
      L('[flatly] He talks first. He is very good at it. Every officer who answered him lost a ship. Do not answer him. Not once.'),
      L('[quietly] He will hook you off the back of the deck and into his reach. Stand where a pull forward does not matter, and shoot.'),
    ],
    fight: [
      L('[angry] Close order. Nothing gets between the lanes.'),
      L('[flatly] Do not listen to that son of a bitch. Shoot him.'),
      L('[angry] God damn it, hold the line. If he talks, he is buying a shot.'),
    ],
    afterFall: [
      L('[quietly] Somebody write this down properly. We have him.'),
      L('[thoughtful] He was the easiest man in these waters to like, and he drowned my sailors for cargo. Both of those are true. I am done trying to make them one thing.'),
    ],
    ending: [
      L('[calm] The shallows are open, trade is moving, and a village on the north coast will eat this winter. That is what the instruction meant.'),
      L('[flatly] King\'s Own, {target}. Wear it where people can see it — the uniform does more work than the sword.'),
    ],
  },
},
};

// God-line cutscenes. Each god speaks once in the last room.
ADV.DATA.GOD_LINE_DIALOGUE = {
  pale_mother: [
    L('[quietly] I have been called a great many things and I answer to none of them.'),
    L('[calm] Do you know how many died to make this room? I do. I know every name, and I will know yours.'),
    L('[flatly] You may leave. I will not stop you and I will not follow. Nobody has ever taken it.'),
    L('[quietly] No. Nobody ever does.'),
  ],
  drowned_king: [
    L('[calm] Sit down. You have walked a long way and I have been patient for longer than your city has existed.'),
    L('[flatly] I was a king. Then the water came in through the windows and I found out precisely what that was worth.'),
    L('[quietly] I am not angry. That is the part people never believe. I am simply still here, and everything else went away.'),
    L('[calm] Draw. I would like to see whether the world has learned anything.'),
  ],
  first_bloom: [
    L('[calm] Everything that lives wants to keep living. I am only the part that will not apologize for it.'),
    L('[quietly] They cut the woods back every spring. Every spring the woods come through the walls anyway.'),
    L('[flatly] You may go. I will not chase you. The green will find the place you sleep.'),
    L('[calm] Stay, then. Let me see whether you can kill a thing that refuses to end.'),
  ],
};

ADV.DATA.GOD_LINE_SMITE = {
  pale_mother: [
    L('[flatly] {target}. I have decided you have lived long enough.'),
    L('[quietly] {target}. Your name is already written. I am only finishing the page.'),
  ],
  drowned_king: [
    L('[calm] {target}. The tide does not argue with what it takes.'),
    L('[flatly] {target}. You grew too large for this water. I am correcting that.'),
  ],
  first_bloom: [
    L('[calm] {target}. That much life is a wound. I will close it.'),
    L('[quietly] {target}. You have taken more than a body should hold. Give it back.'),
  ],
};

ADV.DATA.GOD_LINE_HATRED = {
  pale_mother: [
    L('[flatly] I already have your name. The rest is housekeeping, you mother fucker.'),
    L('[quietly] You are not the first to come down here armed. You will not be the last I keep.'),
  ],
  drowned_king: [
    L('[calm] The water does not hate the stone. It simply outlasts it.'),
    L('[flatly] Your city taught you order. I am what is left when that lesson drowns.'),
  ],
  first_bloom: [
    L('[calm] I will grow through your ribs if I must. That is still a kindness.'),
    L('[quietly] Put the steel down. Living is the only argument I respect, and you are wasting yours.'),
  ],
};

ADV.DATA.FACTION_WAR_DIALOGUE = {
  bell: {
    who: 'jiro',
    open: [
      L('[quietly] The Bell does not hold streets. We hold names. Yours just went on the paper.'),
      L('[flatly] The city hired a knife. We have hired worse. Come and be written down.'),
      L('[angry] What the fuck did you think this contract was. Draw or walk.'),
    ],
    boss: [
      L('[quietly] Two of ours. That is what they paid you for. Take them if you can still see.'),
      L('[flatly] The Bell forgets no contract. Remember that when you sleep.'),
      L('[angry] God damn it, finish it. They will not give you a second chance.'),
    ],
  },
  green: {
    who: 'kira',
    open: [
      L('[quietly] The Green-Eyed are out enforcing someone\'s law. I am paying you to stop them.'),
      L('[flatly] They call it honour. You will meet two of them before this writ is done.'),
      L('[angry] I am done watching them burn houses and call it lawful. Cut them down.'),
    ],
    boss: [
      L('[calm] Instructor and captain. Walk over them if you can. The clan will still be there tomorrow.'),
      L('[flatly] They will call this a crime. They called my house a lawful fire.'),
      L('[angry] What in the hells are you waiting for. Those two die here.'),
    ],
  },
  tally: {
    who: 'vanekessler',
    open: [
      L('[calm] The Tally has been taking cargo from these shallows. That ends.'),
      L('[flatly] A bosun and a captain are running the take. We are the patrol. Keep up.'),
      L('[angry] God damn it, this is a navy. Act like it.'),
    ],
    boss: [
      L('[calm] Those two. Cut them down. The rest of the fleet will hear about it.'),
      L('[flatly] I have hanged men for less than this writ. I am being polite.'),
      L('[angry] I will sink the next punk ass bitch who lifts cargo under my flag. These two can go first.'),
      L('[flatly] What the hell are you waiting for. This is a patrol, not a conversation.'),
      L('[angry] Draw. God damn it. I am done being polite with pirates.'),
    ],
  },
  navy: {
    who: 'ash',
    open: [
      L('[calm] They closed a channel people live on. You are here because someone could not swallow that.'),
      L('[flatly] Uniforms, guns, and two officers who think the sea is a courtroom. We go through.'),
      L('[playfully] What the fuck did you expect. A polite request?'),
    ],
    boss: [
      L('[calm] A mate and a commander. The blockade does not care why you came.'),
      L('[playfully] I have taken cargo through worse. Draw, and we will see if you have.'),
      L('[angry] God damn it, do not freeze. They will hang you for standing still.'),
    ],
  },
};

// Spoken form: {target} dropped; third-person tokens read as the rival's
// pronouns. The text box carries the names; the audio never does.
ADV.DATA.campaign2VoiceText = function (fid, who, line) {
  if (line.v) return line.v;
  const f = ADV.DATA.FACTIONS[fid];
  const rival = ADV.DATA.CAMPAIGN_CHARS[f.rival];
  const self = who === f.rival;
  const P = self ? ['they', 'them', 'their'] : rival.sex === 'f' ? ['she', 'her', 'her'] : ['he', 'him', 'his'];
  return line.t.replace(/,\s*\{target\}/g, '').replace(/\{target\}[.!?]\s*/g, '').replace(/\{target\},?\s*/g, '')
    .replace(/\{they\}/g, P[0]).replace(/\{them\}/g, P[1]).replace(/\{their\}/g, P[2])
    .replace(/\s+([,.!?])/g, '$1').replace(/^\s+/, '');
};
})();
