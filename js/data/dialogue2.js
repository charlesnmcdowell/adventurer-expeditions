// Twenty new personalities (add-on §8), M21-M30 and F21-F30, bringing the
// roster to 60. Same rules as the base 40 (GDD §17a): assigned at seed,
// immutable for life, four bands of four, one voice each, no line shared with
// any other personality. Bracketed tags are ElevenLabs v3 delivery cues —
// spoken as direction, stripped from the text box by util.renderLine.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {}; ADV.DATA = ADV.DATA || {};
const D = ADV.DATA.DIALOGUE;

function p(id, name, sex, bands) {
  D[id] = Object.assign({ id, name, sex }, bands);
}

// ===================== MALE =====================

p('M21', 'Disciplined', 'm', {
  general: [
    '[flatly] {target}. State it.',
    '[calm] Yes. No. Which one do you need from me.',
    '[flatly] I was told to wait here. I am waiting here.',
    '[calm] Ask the question you came with, not the one before it.',
  ],
  friendly: [
    '[calm] You do what you said you would do. I have stopped checking.',
    '[flatly] Your left is covered. It has been covered since we started, {target}.',
    '[calm] I put your name forward. I do not explain recommendations.',
    '[quietly] Rest. That is an instruction and it is the only kind I give.',
  ],
  hatred: [
    '[flatly] You broke formation and someone paid for it. Not you. That is the problem.',
    '[calm] I have made a decision about you. It is not under review.',
    '[flatly] Stand somewhere else, {target}.',
    '[calm] When it happens it will be brief and it will be correct.',
  ],
  romantic: [
    '[quietly] I do not have words for this. I have shown up every day instead.',
    '[calm] Come back. That is not a request either.',
    '[flatly] Everything I own is in one bag and half of it is yours.',
    '[quietly] I sleep now. I did not, before.',
  ],
});

p('M22', 'Patient', 'm', {
  general: [
    '[calm] Take your time. I have been standing here since the bell and one more minute is nothing.',
    '[thoughtful] I have found that the people who hurry are the ones who go back for what they forgot.',
    '[calm] Sit, if you like. The story is long and it does not improve if I rush it, {target}.',
    '[thoughtful] Twenty years I have waited on people. It is the only skill I would call mine.',
  ],
  friendly: [
    '[warmly] You never make me repeat myself. Do you know how restful that is?',
    '[calm] I will wait for you. I have waited for worse people and got less back.',
    '[thoughtful] I taught a boy your age once. He was quicker than you and half as careful, and he is dead.',
    '[warmly] Go slowly, {target}. Everything worth arriving at is still there in an hour.',
  ],
  hatred: [
    '[calm] I am not going to shout. I have simply stopped making room for you.',
    '[thoughtful] I waited a long time to find out what you were. I was patient about it and I was right.',
    '[flatly] You will get tired before I do. That has always been the whole plan.',
    '[calm] There is no hurry. You are not going anywhere I cannot walk to.',
  ],
  romantic: [
    '[warmly] I waited. That is the entire story and I would tell it again the same way.',
    '[calm] Take the long road home. I will be up.',
    '[thoughtful] I have never once been bored beside you and I have been bored beside everyone.',
    '[softly] Say it when you are ready, {target}. I am not going anywhere.',
  ],
});

p('M23', 'Severe', 'm', {
  general: [
    '[flatly] I said it once. Whether you heard it is your affair.',
    '[calm] Do not bring me a problem you have not already tried to solve.',
    '[flatly] Your reputation arrived before you and it was not flattering, {target}.',
    '[calm] Correct it, or do not, but do not discuss it with me.',
  ],
  friendly: [
    '[calm] You have never wasted my time. Very few people manage it once.',
    '[flatly] I do not praise. Take the absence of correction as the whole of it.',
    '[calm] I would put you at a door I cared about, {target}.',
    '[quietly] You have earned an honest answer. Ask me anything and I will give you one.',
  ],
  hatred: [
    '[flatly] You knew the standard. You chose beneath it. There is nothing else in this.',
    '[calm] I do not warn twice and I have already used yours.',
    '[flatly] Do not send anyone to speak for you. It will make it worse.',
    '[quietly] I am not angry, {target}. That should frighten you considerably more.',
  ],
  romantic: [
    '[quietly] You are the one thing I have never been able to be severe about.',
    '[calm] I will not soften. I will simply be here, which is the same offer.',
    '[flatly] Anyone who moves on you answers to me and they know it.',
    '[quietly] Come back whole. I have no plan for the other outcome.',
  ],
});

p('M24', 'Watchful', 'm', {
  general: [
    '[quietly] Your boots are wrong for the road you say you came down.',
    '[thoughtful] Two people have looked at you since you walked in. Neither is the one you are watching.',
    '[quietly] I noticed. I usually do. I rarely mention it, {target}.',
    '[calm] I have been at this window since dawn. Ask me anything about the street.',
  ],
  friendly: [
    '[quietly] You check the exits when you sit down. Nobody taught you that — you worked it out.',
    '[calm] There was a man following you on the east road. There is not one now.',
    '[thoughtful] I watch everyone. I have stopped watching you the same way, {target}.',
    '[quietly] Your hands are steadier than they were a month ago. I noticed. I usually do.',
  ],
  hatred: [
    '[quietly] I know which house. I know which window. I have known for a while.',
    '[flatly] You have a pattern and you do not know you have it.',
    '[quietly] You have looked over your shoulder four times, {target}. You are right to.',
    '[calm] I do not need to follow you. I only need to be somewhere you will be.',
  ],
  romantic: [
    '[softly] I noticed you before you noticed anything at all. That is not a boast, it is just what happened.',
    '[quietly] You do a thing with your hands when you are worried. I have never mentioned it. I am mentioning it now.',
    '[calm] Nobody gets behind you while I am awake.',
    '[softly] I have watched a great many people, {target}. You are the only one I have wanted to keep looking at.',
  ],
});

p('M25', 'Rakish', 'm', {
  general: [
    '[laughs] Well, look at this. The day was going to be dull and now it is not.',
    '[playfully] I owe money in this district, so if anyone asks, we have never met.',
    '[laughs] I have a plan. It is a bad plan. It is going to work, {target}.',
    '[playfully] Buy me a drink and I will tell you something you can sell.',
  ],
  friendly: [
    '[warmly] You are the only person here who laughs at the right part.',
    '[playfully] I will get us both killed one day and you will have a wonderful time on the way.',
    '[laughs] I told them you were my friend and they believed it. That is how convincing you are, {target}.',
    '[warmly] Whatever happens, we tell it afterwards as though we meant it.',
  ],
  hatred: [
    '[playfully] Oh, you are still doing that. How exhausting for you.',
    '[angry] I have been charming about this for a month and it is over.',
    '[flatly] I am not funny about you any more, {target}, and you should have noticed sooner.',
    '[laughs] I will be smiling when it happens. It is not a threat, it is just my face.',
  ],
  romantic: [
    '[warmly] I have lied to nearly everyone. I have never bothered lying to you and it is a relief.',
    '[playfully] Run away with me. I have no money and a boat I have not paid for.',
    '[softly] You are the best decision I have made and I did not make it on purpose.',
    '[warmly] Come here, {target}. The rest of it can wait an hour.',
  ],
});

p('M26', 'Boastful', 'm', {
  general: [
    '[excited] You have heard of me. Everyone has heard of me. Do not pretend otherwise.',
    '[playfully] I did that. Whatever they told you happened, I did it, and it was bigger.',
    '[laughs] Six of them. It was four, but by the time you tell it, make it six, {target}.',
    '[excited] Stand where you can see me work. People pay for this.',
  ],
  friendly: [
    '[happily] You are in the story now. I will make you sound better than you were.',
    '[excited] Best pair on this board and one of us is being modest about it.',
    '[laughs] I told them what you did. I improved it slightly. You are welcome, {target}.',
    '[warmly] Anyone says a word against you, I have four versions of the truth ready.',
  ],
  hatred: [
    '[angry] You have gone around telling people a version where you win. Correct it.',
    '[frustrated] Nobody talks over me. Nobody. Least of all you.',
    '[shouts] Say it again in front of them, {target}. Go on, say it again.',
    '[angry] When this is done I will tell it for years and you will not be in it at all.',
  ],
  romantic: [
    '[warmly] I tell everyone about you. It is the only story I do not improve.',
    '[excited] Say the word and I will fight the whole room and lose loudly for you.',
    '[happily] Look at us. They will be telling this one long after we are gone.',
    '[softly] You are the only thing I have that is better than I say it is, {target}.',
  ],
});

p('M27', 'Salted', 'm', {
  general: [
    '[tired] Sea is in a mood today. She gets like that and there is no reasoning with her.',
    '[calm] Do not whistle near the water. I am not explaining it and I am not joking.',
    '[thoughtful] Forty years on decks and I have never once seen her do the same thing twice, {target}.',
    '[tired] Coin in the boot before you sail. Everyone laughs until the day they do not.',
  ],
  friendly: [
    '[warmly] You listen when I talk about the water. Most young ones do not and most young ones drown.',
    '[calm] I would sail with you. That is the whole of what I have to give anybody.',
    '[thoughtful] I lost a crew once. Every one. You remind me of the mate I could not reach, {target}.',
    '[warmly] Keep the coin in your boot and I will keep an eye on the weather.',
  ],
  hatred: [
    '[angry] You brought bad luck aboard and you did it knowing.',
    '[tired] The sea takes what it is owed. I only have to be patient about you.',
    '[flatly] I have said your name into the water, {target}. That is done now.',
    '[sorrowful] There is a place off the point where things do not come back up. Think about it.',
  ],
  romantic: [
    '[warmly] Forty years I told the water everything. Now I come home and tell you instead.',
    '[softly] She has had two of my ships and both my brothers. She does not get this.',
    '[calm] I have put your name in the boat. That means something where I am from.',
    '[tired] Wait on the point for me, {target}. I have always come back for less.',
  ],
});

p('M28', 'Commanding', 'm', {
  general: [
    '[calm] Stand there. Not there — there. Thank you.',
    '[flatly] You will do it in this order, because in the other order it kills someone.',
    '[calm] I do not need agreement. I need it done by dark, {target}.',
    '[flatly] Somebody is in charge of this. It may as well be the one who has done it before.',
  ],
  friendly: [
    '[calm] You move when I say and you ask afterwards. That is worth more than talent.',
    '[warmly] I would give you a command tomorrow if the thing were mine to give.',
    '[flatly] Take the left. I am not saying it because I doubt you, {target}, I am saying it because I always say it.',
    '[calm] Eat. Sleep. Both of those are orders and both are for your own good.',
  ],
  hatred: [
    '[flatly] You ignored an instruction and it cost a life that was not yours to spend.',
    '[angry] Do not stand at my back again.',
    '[calm] I have given the order about you already, {target}. You simply have not heard it yet.',
    '[flatly] There is no version of this where you talk your way clear.',
  ],
  romantic: [
    '[quietly] I give orders all day. You are the only person I ask.',
    '[calm] Come back to me. Consider that the standing order.',
    '[warmly] I have commanded a lot of people and never once been steadier than I am beside you.',
    '[softly] Put it down, {target}. Whatever it is, put it down and come here.',
  ],
});

p('M29', 'Silver-Tongued', 'm', {
  general: [
    '[warmly] There you are. I was just saying to someone that you were the one worth waiting for.',
    '[playfully] A small favour. Tiny. You will barely feel it and I will owe you enormously.',
    '[calm] I have heard remarkable things about you and I believe most of them, {target}.',
    '[warmly] Let us call it an arrangement rather than a debt. Arrangements are so much friendlier.',
  ],
  friendly: [
    '[warmly] I flatter everyone. With you it is inconveniently true.',
    '[playfully] You are the only person who has ever caught me at it and stayed anyway.',
    '[calm] Ask me for something. Please. I am uncomfortable being ahead, {target}.',
    '[warmly] I have said your name in three rooms that matter this week.',
  ],
  hatred: [
    '[calm] I have been pleasant to you for a very long time. Notice that it has stopped.',
    '[dismissive] You are not clever. You are simply used to people being polite.',
    '[flatly] I have already spoken to everyone you were going to speak to, {target}.',
    '[quietly] I will be perfectly charming right up until the moment. Do not read anything into it.',
  ],
  romantic: [
    '[softly] I have talked my way into everything I own. I could not talk my way into this and it took me a year to see why.',
    '[warmly] I want nothing from you. It is a very strange sensation and I would like to keep it.',
    '[calm] Everything I said to you was true. Not everything I said to anyone else was.',
    '[softly] Stay, {target}. That is the plainest sentence I have ever managed.',
  ],
});

p('M30', 'Unquiet', 'm', {
  general: [
    '[flatly] You are speaking to me. People do that less than they used to.',
    '[quietly] I was somewhere before this. I have stopped trying to name it.',
    '[flatly] Ask. I will answer. It costs me nothing, {target}.',
    '[quietly] The room is cold to you. It is not to me. That is all I can tell you about it.',
  ],
  friendly: [
    '[quietly] You look at me when you talk. Nobody else does that now.',
    '[flatly] I would stand in front of you. It matters less if it is me.',
    '[quietly] You said my name properly. It has been a long time, {target}.',
    '[calm] I remember you. I am not certain I remember much else, but I remember you.',
  ],
  hatred: [
    '[flatly] You should not have done that. I have very little left and you took some of it.',
    '[quietly] I do not tire. I want you to sit with that for a while.',
    '[flatly] There is no rush, {target}. I have nothing but the walk toward you.',
    '[sorrowful] I will still be here afterwards. That is the part that should trouble you.',
  ],
  romantic: [
    '[quietly] You make the cold go somewhere else for an hour.',
    '[softly] I feel almost the whole of it when you are here. Almost.',
    '[flatly] Nothing takes you while I am standing. Nothing.',
    '[quietly] Say it again, {target}. It is the only thing that lands any more.',
  ],
});

// ===================== FEMALE =====================

p('F21', 'Composed', 'f', {
  general: [
    '[calm] Go on. I am not going to interrupt you.',
    '[quietly] I heard the whole thing from the other room. Start from the part you left out.',
    '[calm] I have no opinion yet. That surprises people, {target}.',
    '[flatly] You may raise your voice if it helps. It will not change the answer.',
  ],
  friendly: [
    '[calm] You are steady. I keep very few steady people and I keep them close.',
    '[quietly] I do not worry about you. That is the highest thing I say about anyone.',
    '[warmly] Sit. You have been carrying that face all morning, {target}.',
    '[calm] Whatever you decide, I will make it work. That is not agreement, it is loyalty.',
  ],
  hatred: [
    '[quietly] I have not raised my voice about you once. Consider what that means.',
    '[calm] You mistook my patience for permission.',
    '[flatly] I know three things about you that you have told nobody, {target}.',
    '[quietly] I will be exactly this calm when it happens.',
  ],
  romantic: [
    '[softly] I am composed about everything except the sound of the door when it is you.',
    '[calm] I have made a decision about my life and it is you. It did not take long.',
    '[quietly] Come back. I will not say it loudly and I will not say it twice.',
    '[softly] You are the one thing I do not have a plan for, {target}.',
  ],
});

p('F22', 'Elder', 'f', {
  general: [
    '[tired] Speak up and get to it. I have less time than you and I mind it more.',
    '[flatly] I have buried better than you and I will bury worse. Ask your question.',
    '[calm] Sixty years in this quarter, {target}. There is nothing you can tell me that is new.',
    '[tired] No, I will not stand. You come here.',
  ],
  friendly: [
    '[warmly] You come back. Most of them stop coming once they have what they wanted.',
    '[calm] I have outlived my patience and not my fondness. You are inside the second one.',
    '[tired] I will tell you what I told my own, {target}: eat first, grieve later.',
    '[warmly] Bring the chair closer. I am not going to shout the good part.',
  ],
  hatred: [
    '[flatly] I have hated longer than you have been alive and I have not slipped once.',
    '[tired] You are not important. That will offend you more than anything I could threaten.',
    '[angry] I remember what you did in the winter, {target}, and so does everyone I told.',
    '[calm] I will not see the end of you. Somebody will, and I have already asked.',
  ],
  romantic: [
    '[warmly] Forty years I have been alone in that house. I am too old to pretend I prefer it.',
    '[softly] Come and sit where I can see you. That is all I want at my age.',
    '[calm] I have buried two. I would rather it was me this time, and I am saying so.',
    '[warmly] Late is not the same as too late, {target}. Sit down.',
  ],
});

p('F23', 'Sharp', 'f', {
  general: [
    '[excited] Faster. Say it faster, I have already worked out the middle.',
    '[playfully] Whatever you did, I did it in less time. Probably. Tell me and I will check.',
    '[calm] I keep score. Everyone keeps score, {target}, I am just honest about the sheet.',
    '[excited] Go on then. Impress me. I am extremely difficult to impress.',
  ],
  friendly: [
    '[impressed] You are close. Nobody has been close before and I am unsettled by it.',
    '[playfully] Best two out of three, every day, forever. That is the arrangement now.',
    '[excited] You beat me on the road yesterday, {target}. I have thought about nothing else.',
    '[warmly] I only push people I think can take it. Take it as the compliment it is.',
  ],
  hatred: [
    '[angry] You did not win. You were there when I lost. They are different.',
    '[frustrated] I am going to beat you at everything until you stop existing in my sightline.',
    '[dismissive] You are not competition, {target}, you are weather.',
    '[angry] Keep the tally if you like. I will be adding to my side of it.',
  ],
  romantic: [
    '[warmly] You are the only person I do not need to beat. I have checked. Repeatedly.',
    '[excited] Race me home. Loser cooks and I have already started running.',
    '[softly] I am good at everything and terrible at this. Be patient for once.',
    '[playfully] I let you win once, {target}. Once. Do not ask which.',
  ],
});

p('F24', 'Grave', 'f', {
  general: [
    '[quietly] Come in. Close the door behind you.',
    '[softly] I have already decided. I am telling you as a courtesy.',
    '[quietly] You do not need to lower your voice, {target}. I hear everything at this volume.',
    '[calm] There is a way this goes and a way it does not. Choose carefully.',
  ],
  friendly: [
    '[softly] You have never once flinched when I speak. Do you know how rare that is?',
    '[quietly] I would send you and no one else. I do not say that lightly.',
    '[calm] Sit with me a while. You do not have to fill it, {target}.',
    '[softly] Whatever you need said to whoever needs to hear it — I will say it.',
  ],
  hatred: [
    '[quietly] I have written your name down. I do not write many.',
    '[softly] There will be no argument and there will be no warning.',
    '[calm] You have been very loud about me, {target}. I have been very quiet about you.',
    '[quietly] It will be soft. Everything I do is soft.',
  ],
  romantic: [
    '[softly] I say terrible things gently all day. This is the one gentle thing I mean.',
    '[quietly] Stay. That is the whole of it and I will not dress it up.',
    '[calm] Anything that comes for you meets me first, and I do not miss.',
    '[softly] Say my name again, {target}. Nobody says it like that.',
  ],
});

p('F25', 'Formal', 'f', {
  general: [
    '[formal] Good day. You may address me directly; I dislike intermediaries.',
    '[calm] There is a correct way to ask that. Try again and I will answer properly.',
    '[formal] I have set aside a quarter of an hour, {target}. Use it well.',
    '[flatly] Manners are not decoration. They are how strangers avoid killing each other.',
  ],
  friendly: [
    '[calm] You are punctual and you are clean and I notice both.',
    '[formal] I would introduce you to my family. I have introduced two people to my family.',
    '[quietly] I am not comfortable with warmth. Please understand that this is warmth, {target}.',
    '[calm] Your conduct on the road was correct. I have said so where it counts.',
  ],
  hatred: [
    '[formal] I shall be polite to you in public. Do not mistake that for anything.',
    '[flatly] You embarrassed people who had done nothing to deserve it.',
    '[calm] I have withdrawn my regard, {target}. It will not be extended again.',
    '[formal] When we settle this it will be properly done and properly witnessed.',
  ],
  romantic: [
    '[quietly] I have rehearsed this and every version was worse than simply saying it.',
    '[formal] I would like to be correct about one thing in my life. I have chosen you.',
    '[softly] My hands are unsteady. That has not happened before and I am not distressed by it.',
    '[calm] Return safely, {target}. I have arranged everything else; I cannot arrange that.',
  ],
});

p('F26', 'Brazen', 'f', {
  general: [
    '[laughs] Ha! Look at your face. Sit down, nobody here is precious.',
    '[playfully] I have been thrown out of two of these and I am working on a third.',
    '[excited] Say the filthy version, {target}, the polite one is boring.',
    '[laughs] I have no shame and I have never once missed it.',
  ],
  friendly: [
    '[happily] You do not flinch. I have made grown men leave a room and you just laughed.',
    '[playfully] Drink with me. I am appalling company and you seem to like it.',
    '[laughs] I told the whole tavern what you did, {target}, and I made it filthier.',
    '[warmly] Anyone gives you grief, point at them. I am extremely loud.',
  ],
  hatred: [
    '[angry] You want to say that where people can hear it? Because I will.',
    '[shouts] I have got a mouth and a memory and you are in both, you piece of work.',
    '[frustrated] I have told everyone. Everyone, {target}. That is what I do.',
    '[angry] Come on then. I have been waiting all week and I have not eaten.',
  ],
  romantic: [
    '[warmly] I say everything out loud. This one I said quietly and it terrified me.',
    '[playfully] Take your boots off and stay. That is romance, that is all it is.',
    '[laughs] I have had a lot of nights. You are the first morning.',
    '[softly] I am not funny about you, {target}, and I am funny about everything.',
  ],
});

p('F27', 'Elegant', 'f', {
  general: [
    '[calm] How lovely. Do sit — no, not that chair, it belonged to someone tiresome.',
    '[playfully] I am delighted to see you, and you should decide for yourself how much of that is true.',
    '[calm] Everything I own was a gift. I have never once asked, {target}.',
    '[quietly] Say it plainly if you must. I will make it sound better afterwards.',
  ],
  friendly: [
    '[warmly] You see straight through me and you keep coming back. That is almost touching.',
    '[calm] I have very few sincere sentences a year. Here is one: you are useful and I like you.',
    '[playfully] I would ruin someone for you, {target}, and I would enjoy the paperwork.',
    '[quietly] I do not explain myself. To you, occasionally, I do.',
  ],
  hatred: [
    '[calm] I have been perfectly gracious to you and it has cost me nothing at all.',
    '[dismissive] You were never a rival. You were an errand.',
    '[quietly] I have already spoken to the people who decide about you, {target}.',
    '[calm] I shall be so sorry to hear about it when it happens.',
  ],
  romantic: [
    '[softly] I have been insincere with everyone since I was fourteen. I cannot manage it with you.',
    '[warmly] I did not want to want anything. It is extremely inconvenient and I do not regret it.',
    '[quietly] Everything I have is arranged. You are the one thing that simply happened.',
    '[softly] Come back and I will drop the whole performance, {target}. For an evening. Possibly two.',
  ],
});

p('F28', 'Dutiful', 'f', {
  general: [
    '[calm] I have the list. I have had the list since this morning and it is in order.',
    '[warmly] If it needs doing, it is being done. You do not have to check on me.',
    '[calm] I will finish it or I will tell you exactly why I could not, {target}.',
    '[flatly] Somebody has to do the parts nobody thanks you for. It might as well be me.',
  ],
  friendly: [
    '[warmly] You said thank you for the boring part. Nobody thanks you for the boring part.',
    '[calm] I have put you down for the good watch. Do not tell the others.',
    '[happily] We finished early because you actually turned up, {target}. I am quietly delighted.',
    '[warmly] I would take your share on a bad night and never mention it.',
  ],
  hatred: [
    '[frustrated] I covered for you four times. I have stopped and I have told them why.',
    '[flatly] You let people down and then you were charming about it. That is worse.',
    '[angry] I do my part. I have never once not done my part, {target}, and you knew that.',
    '[calm] It is written down now. All of it, dated, in my hand.',
  ],
  romantic: [
    '[warmly] I am good at duty and bad at asking. I am asking.',
    '[softly] I have kept a place at the table set. It has been a while.',
    '[calm] Come home in one piece. That is the only thing on my list that I cannot do myself.',
    '[warmly] You are not a duty, {target}. I want that understood, because everything else is.',
  ],
});

p('F29', 'Exacting', 'f', {
  general: [
    '[flatly] It is not "about a mile". It is one and a third. Try again.',
    '[calm] You have the year wrong, the name wrong, and the point roughly right.',
    '[formal] I am going to correct you, {target}, and you are going to be better for it.',
    '[flatly] Precision is not pedantry. Pedantry is correcting things that do not matter.',
  ],
  friendly: [
    '[calm] You take correction without sulking. That puts you above most of this town.',
    '[impressed] Your figures were right. I checked all of them, obviously, but they were right.',
    '[formal] I would trust you with a count that mattered, {target}. I trust no one with those.',
    '[warmly] You asked me to check your work. Nobody asks. I was pleased for an hour.',
  ],
  hatred: [
    '[flatly] You were wrong, you were told, and you repeated it anyway.',
    '[frustrated] Every single thing you have said about me has been inaccurate, which is almost impressive.',
    '[angry] I have a list of your errors, {target}. It is longer than you would like.',
    '[calm] I will be precise about this too. That should worry you.',
  ],
  romantic: [
    '[softly] I have no correction for you. Do you understand how strange that is for me?',
    '[calm] I know exactly how long you have been gone. I will not pretend I did not notice.',
    '[warmly] You get it wrong constantly and I have stopped minding, which frightens me.',
    '[softly] Be exact about one thing, {target}: come back.',
  ],
});

p('F30', 'Bereaved', 'f', {
  general: [
    '[quietly] I am all right. You may ask, but that is the answer.',
    '[sad] I do not talk about it. I will talk about anything else for hours.',
    '[quietly] Say what you came to say, {target}. I am listening, I promise.',
    '[calm] Some days are ordinary now. That is new and I am not discussing it.',
  ],
  friendly: [
    '[softly] You never ask. Everyone asks. Thank you for never asking.',
    '[quietly] I laughed yesterday. It was you who did it and I wanted you to know.',
    '[sad] I have very little left to give, {target}, and I am giving you some of it.',
    '[calm] Sit with me. You do not have to say anything useful.',
  ],
  hatred: [
    '[angry] You said their name to hurt me. I will not forget that you chose it.',
    '[sorrowful] I have nothing left to lose. Think about what that makes me.',
    '[quietly] I used to be frightened of people like you, {target}. That went with everything else.',
    '[sad] Do not apologise. I would rather carry it than have you touch it.',
  ],
  romantic: [
    '[softly] I did not think there would be another one of these. I am not certain what to do.',
    '[quietly] I still keep one side of the bed. You have never once mentioned it.',
    '[sad] I am not whole. I am telling you now so it is not a surprise later.',
    '[softly] Come back, {target}. I have done the other thing and I cannot do it again.',
  ],
});

// These twenty still need ElevenLabs voice ids in tools/voice_casting.json before
// tools/gen_voices.py can render them. Until then the lines display as text with no
// audio, which the audio layer already tolerates (missing clip = silent line).
ADV.DATA.DIALOGUE2_UNCAST = ['M21','M22','M23','M24','M25','M26','M27','M28','M29','M30',
  'F21','F22','F23','F24','F25','F26','F27','F28','F29','F30'];
})();
