// Five additional statements and twenty authored responses per personality.
// Groups: statements; neutral; friendly; hostile; romantic; inquiry; dismissal;
// preparation, company, thanks, thanks. Existing clip indexes stay unchanged.
(function () {
'use strict';
const rows = {
M01: [
"I prefer a little quiet between jobs.|A person can speak plainly without raising their voice.|It is easier to rest with someone I trust nearby.|I have no wish to hear another fucking word from you.|There is room in my day for you. Always.",
"I hear you. Go on.|Fair enough. Hello to you too.|You have my attention for a moment.|No need to dress it up for me.",
"It is good to have you here.|I am glad we can speak easily.|A word with you is time well spent.|You are welcome beside me.",
"I heard. I still want some distance.|Keep the pleasantries. We both know better.",
"You make the quiet feel comfortable.|Stay close. I like hearing you.",
"Just a few words, then.|I can keep to the point.",
"Understood. I will step away.|Very well. You will have your quiet.",
"Take the time to check properly.|A quiet rest sounds sensible.|You are welcome. Nothing more is owed.|I am glad it made a difference."
],
M02: [
"I like a little noise around the edges of a day.|Enthusiasm is cheap. I make up for it in quantity.|Your company puts a bit of life into the waiting.|I would rather argue with a fucking door than listen to you.|I am very fond of the trouble you cause my concentration.",
"Hello! There is life in the day yet.|Right, you have my attention.|I hear you loud enough.|A word or two will not kill me.",
"Now we are talking. Good company at last.|Always room in my day for you.|I was hoping for a friendly face.|Glad of the company. Especially yours.",
"Oh, spare me the fucking charm.|I heard you. It did not improve my mood.",
"Well, you have the whole of my attention now.|That voice could ruin a perfectly productive afternoon.",
"The short version! I do possess one.|A quick word. Hold the fanfare.",
"Fine, I can take a bloody hint.|All right. Find some other entertainment.",
"Better a check here than a surprise halfway out.|A breather sounds bloody wonderful.|Glad to be useful for more than noise.|You are welcome. I am pleased it helped."
],
M03: [
"I find introductions easier without an audience.|I usually need a moment to get the words straight.|I do not worry so much about saying the wrong thing with you.|Please leave. I cannot keep pretending this is fucking comfortable.|I like how close we can sit without needing to explain anything.",
"Hello. Yes, I heard you.|I am listening, even if I seem quiet.|All right. Take your time.|I can spare a little attention.",
"Oh, it is good to hear from you.|I feel less awkward with you here.|I am glad we can talk like this.|You make the quiet feel less lonely.",
"I heard that. Please do not crowd me.|I would rather we kept this impersonal.",
"I like it when your attention finds me.|You can stay near. I want that.",
"Only a few words, I think.|I will try to say it clearly.",
"All right. I will leave you room.|I understand. Sorry for lingering.",
"We can take the checks one at a time.|A little time to settle sounds good.|It is all right. I am glad I could help.|You need not make a fuss over it."
],
M04: [
"I can manage quiet. It is bullshit that wears me out.|A straight answer saves everyone a lot of fucking effort.|You can speak your mind with me. I would rather hear it.|Your voice is getting right on my fucking nerves.|I like being close to you. Do not make me turn it into a speech.",
"All right, I fucking heard you.|You have my attention. Make use of it.|Go on. I can listen without smiling.|Fine. We can have a word.",
"Good. Someone I do not have to grit my teeth around.|I have time for you. Say your piece.|Glad it is you. The day is less irritating already.|Your company is worth the occasional fucking interruption.",
"Shut the fuck up for a moment.|I have heard enough of that shit from you.",
"Come closer. I am not angry with you.|You get the softer side. Keep it between us.",
"I will keep the bullshit to a minimum.|A short word. You can survive that.",
"Fine. Enjoy your fucking solitude.|All right. I know when I am not wanted.",
"Check the gear. Pride will not fix a broken strap.|A moment off my feet sounds fucking excellent.|You are welcome. No need to make it awkward.|Glad you are here to say it."
],
M05: [
"I find people easier to enjoy when they are not trying to sell me something.|A little courtesy opens more doors than a good shoulder.|Your company is one of my more respectable pleasures.|Try that shit on someone who still finds you charming.|I like having someone I do not need to impress every moment.",
"Well, hello. A civil beginning.|You have caught my attention.|I can offer a moment without a surcharge.|Go on. I enjoy a little conversation.",
"A familiar voice. My day improves.|For you, I can spare more than politeness.|I rather like having you about.|Always a pleasure when it is you.",
"Keep the charm. I know what yours is worth.|Oh, do take that shit to another audience.",
"You have a very unfair effect on my attention.|I like being yours in these little moments.",
"A brief word. I shall resist the embellishments.|Just a moment, without the salesmanship.",
"As you wish. I can make an elegant exit.|All right. I shall take the hint with me.",
"Do check. Looking confident is not the same as being ready.|A little rest would improve my disposition.|No debt between us over that.|My pleasure. I can occasionally be useful."
],
M06: [
"I like hearing how other people put things.|I find the ordinary details are often the interesting ones.|You make conversation feel like discovering something together.|I am tired of giving your bullshit the benefit of doubt.|I like learning the little things that make a day yours.",
"I am following you.|Go on. I am interested enough to listen.|Hello. You have my attention now.|I would like to hear you out.",
"It is always interesting talking with you.|I am glad you stopped for a word.|I like how easily we get talking.|There is room for your thoughts here.",
"I have examined my patience. There is none left for you.|I heard you. I am not inviting an explanation.",
"You remain my favourite interruption.|I could spend a long time noticing you.",
"A small point, briefly put.|I will try not to wander off the subject.",
"Understood. Another time, perhaps.|All right. I will leave you to yourself.",
"Worth checking twice while a mistake is still easy to fix.|A pause might help us gather our thoughts.|I am glad it was useful to you.|You are welcome. That is good to hear."
],
M07: [
"There is an art to being brief. Few people practise it.|Competence need not announce itself quite so loudly.|Your company is a welcome exception to the general standard.|Your continued presence is a fucking imposition.|I find I care less about appearances when it is just us.",
"Yes. You may continue.|I am attending. Do not squander it.|Very well. A moment, then.|I hear you perfectly well.",
"Ah, someone whose company I value.|For you, I shall make time.|I am pleased to hear your voice.|We can dispense with the formalities between us.",
"Your familiarity is not welcome.|Do spare me another helping of your bullshit.",
"You have privileges no one else enjoys.|I find your presence rather difficult to resist.",
"I shall state the point clearly.|A brief exchange should suffice.",
"Very well. I have other uses for my time.|As you wish. No need to repeat yourself.",
"An inspection is sensible. I expect as much.|A little repose is entirely appropriate.|Your acknowledgment is appreciated.|I am pleased the effort was worthwhile."
],
M08: [
"Some days are easier to take a little at a time.|I like the sounds of people getting on with ordinary things.|A quiet word with you makes the day feel less distant.|I have enough weight on my mind without your damned company.|I like the ordinary days we get to share.",
"Hello. I am here, if a little distracted.|I hear what you are saying.|A little conversation is all right.|Go on. There is no need to hurry.",
"Your voice is a comfort.|I am glad you found a moment for me.|It is easier with a friend close by.|I value these little conversations with you.",
"I have no room for your bitterness as well as mine.|Please do not turn this into another unpleasant minute.",
"You make it easier to be present.|I am glad this moment has you in it.",
"Only a short word, then.|I will not keep you from your day.",
"All right. I will take my leave.|I understand. You will have your space.",
"A careful check might settle the mind a little.|Yes, a rest would be welcome.|I am glad something good came of it.|You are welcome. I mean that."
],
M09: [
"I prefer conversation without much ceremony.|Quiet does not trouble me.|I do not mind my time being interrupted by you.|Your company is a damned good argument for being alone.|I like having you close enough that we need not raise our voices.",
"I hear you. Carry on.|Hello. I have a moment.|You have my attention now.|We can keep this easy.",
"Good to have you near.|I am comfortable talking with you.|Your company suits me.|A word with you is welcome.",
"I heard. That is enough.|Keep your voice and your distance down to a minimum.",
"I have time for just us.|You make closeness feel uncomplicated.",
"A brief word will do.|I will make it concise.",
"Understood. I am stepping away.|Fine. I will leave you the quiet.",
"Take a moment to check. No hurry from me.|A quiet pause sounds right.|You are welcome. Leave it at that if you like.|Glad it was of use."
],
M10: [
"I like a day with room for a little conversation.|A laugh is easier to carry than most things.|It is good to have a friend I need not entertain every second.|Go brighten someone else's fucking afternoon.|You make even a dull day worth paying attention to.",
"Hello! I can spare an ear.|I hear you. Glad of the conversation.|Go on, I am with you.|A word or two sounds pleasant enough.",
"Now that is a welcome voice.|I am always glad to make time for you.|There is the company I enjoy.|You make this part of the day better.",
"I have no cheer to spare for you.|Oh, take your shit somewhere it is wanted.",
"You have got me smiling again.|I do love having you within reach.",
"The little version, then. No parade.|A quick word, and I will release you.",
"All right. I will find a friendlier corner.|Fair enough. No need for an encore.",
"Worth checking now. Fewer surprises to swear at later.|A breather would do us good.|Happy to have been some help.|You are very welcome. Truly."
],
M11: [
"I like people who can admit they have not thought of everything.|Silence is underrated. Particularly after a speech.|Your company is one of the few things I complain about only for sport.|You are a remarkably persistent pain in the fucking arse.|You make my usual pessimism feel poorly researched.",
"All right, my attention is reluctantly available.|Hello. I can manage civil for a minute.|I hear you. No grand conclusion required.|Go on. I might even learn something.",
"Good. Someone I can speak plainly with.|Your company makes the day less of a chore.|I am pleased to hear from you. Try not to look shocked.|A friendly voice. That is unexpectedly decent of the day.",
"I heard the bullshit the first time.|Your silence would be a fucking improvement.",
"You are a terrible influence on my cynicism.|I like us. There, an unqualified statement.",
"Briefly. Neither of us needs a fucking lecture.|I will get to the part worth hearing.",
"Gladly. This was not improving with length.|Fine. I shall cherish the distance.",
"A proper check beats an optimistic obituary.|Sitting still sounds like a plan with manageable flaws.|You are welcome. I am useful in occasional emergencies.|Glad it helped. That part is sincere."
],
M12: [
"I try to leave a little room in the day for patience.|A kind word need not be an elaborate one.|Your friendship makes gratitude an easy habit.|Spare me the damned pretence of goodwill.|I am thankful for the ordinary time we are given together.",
"Peace to you. I am listening.|I can offer a little of my time.|Go on. I will hear you.|A quiet word is welcome enough.",
"It does me good to hear you.|Your company is a small blessing.|I am glad we have time to speak.|A friend is always worth pausing for.",
"Do not mistake restraint for welcome.|I have no charitable answer for that shit today.",
"I count these moments with you among my blessings.|There is warmth enough here for both of us.",
"A few words, with your patience.|I will try to speak plainly.",
"Then I will leave you in peace.|Understood. I shall not press you.",
"Check what is in our keeping before we go.|A moment of rest is no failure of purpose.|I am grateful I could be of help.|You are welcome. Let that be enough."
],
M13: [
"I like knowing where the cost of a thing actually lies.|A conversation is cheaper when people come to the point.|Time with you feels well spent, even without a return.|Your company costs more patience than it is fucking worth.|I find I do not resent the time you take from me.",
"I can spare a moment at no charge.|Go on. I am paying attention.|Hello. Let us not waste the whole day.|I hear you. Words are still inexpensive.",
"For you, I do not need a reason to stop.|A good friend is worth the time.|I am glad to hear your voice.|You are welcome to a little of my day.",
"I would pay a modest sum for you to shut up.|Take that shit to someone with patience to lose.",
"I do not keep accounts on time with you.|You are rather bad for my carefully rationed attention.",
"I will keep the cost in minutes low.|A short word, with no hidden conditions.",
"Fine. I can cut my losses.|Understood. No further time spent here.",
"Check the supplies. Replacements rarely get cheaper on the road.|A rest sounds like a worthwhile investment.|No invoice for that. You are welcome.|Glad it helped. We can leave the account there."
],
M14: [
"I like conversation that gives people room to think.|There is no harm in taking a moment before speaking.|I find myself more at ease when you are nearby.|Please go. I have reached the end of my fucking patience.|I like being close to you without either of us needing anything.",
"Hello. I can listen a little.|Take your time. I hear you.|A word is perfectly all right.|There is no need to rush for my sake.",
"I am glad of your company.|It is lovely to have a moment with you.|I like the ease between us.|Your voice is always welcome here.",
"Please do not ask me to pretend this is pleasant.|I would rather keep my thoughts to myself around you.",
"You make it easy to be tender.|I like the way we fit into a quiet moment.",
"Only a little of your time.|I will be clear, and brief if I can.",
"Of course. I will give you room.|I understand. I will not push for company.",
"A little care with the checks is worth our time.|A gentle pause sounds welcome.|You need not worry about owing me.|I am happy it made things easier."
],
M15: [
"Short conversations suit me.|Plain words save effort.|I like your company. That is the whole explanation.|I have had enough of your fucking mouth.|Stay near. I like us this way.",
"Heard you. Go on.|Hello. I have a minute.|You have my ear.|I can listen. Briefly.",
"Good. You are welcome here.|Always time for you.|Glad of your voice.|I like talking with you.",
"Enough fucking noise.|Spare me another word of that shit.",
"Closer suits me.|You are my favourite company.",
"Few words. That is all.|I will get to it.",
"Fine. I am going.|Heard. Keep your distance, then.",
"Check it now. Better here.|A rest would suit us.|No debt. You are welcome.|Glad it helped. Simple as that."
],
M16: [
"I find it easier to speak when nobody is rushing me.|I like knowing there is room to change my mind.|I am less busy second-guessing myself around you.|Back off. Being nervous does not mean I will take your fucking shit.|It helps knowing I can be quiet beside you and still be wanted.",
"Hello. Yes, I am paying attention.|Go on. I was only gathering myself.|I hear you. Give me a moment.|A few words are all right.",
"Oh, good. I can relax a little.|Your voice helps settle me.|I am glad it is you talking with me.|It is easier to find the words with you.",
"I heard you. Please stop pressing me.|I do not want another fucking argument with you.",
"I feel wanted when you speak to me like that.|Stay close a little. If you want to.",
"Just a short word. I have nearly got it straight.|I will try to keep this simple.",
"All right. I will not follow you.|I understand. I will step back now.",
"One careful check might stop us worrying about it later.|A little time to breathe sounds good.|I am relieved I could help.|You are welcome. No need to thank me twice."
],
M17: [
"I enjoy conversation more when it permits a little personality.|A pause can be as expressive as a speech.|Your company is a welcome relief from performing for strangers.|Your presence has become an intolerable fucking monologue.|I like the moments with you that require no performance.",
"Hello. You have secured my attention.|Proceed. I shall try to resist interrupting.|A small exchange, then. How civil.|I hear you. No balcony required.",
"A familiar voice enters, and the scene improves.|For you, I can put the performance aside.|I enjoy our little interludes.|Your company deserves no less than my attention.",
"Spare me. This production has run too fucking long.|I decline a further scene with you.",
"You make me forget there was ever an audience.|I would happily lose the afternoon in your company.",
"A brief appearance, without an overture.|I shall attempt the unprecedented: concision.",
"Very well. I shall make my exit.|Understood. The scene ends here.",
"Check the props before the dangerous part begins.|An interval would be most welcome.|Glad to have played a useful part.|You are welcome. No curtain call necessary."
],
M18: [
"I like a conversation that leaves some energy for later.|A quiet minute is a fine thing to have.|Your company does not feel like another task.|Go exhaust someone else's fucking patience.|I like being able to rest beside you without explanations.",
"Hello. I can manage a few words.|I hear you. Slowly is fine.|Go on. I am awake enough.|You have what is left of my attention.",
"Good to have easy company.|I have energy for a word with you.|Your voice is worth sitting up for.|I am glad we can take this quietly.",
"I have no strength for your shit.|Stop making this more tiring than it needs to be.",
"You are the company I do not tire of.|A little closer would be comfortable.",
"The short version is all I have energy for.|A few words. Nothing elaborate.",
"Gladly. I could use the quiet.|All right. That saves us both the effort.",
"Check it here, while we can still sit down afterwards.|Yes. A pause would be a kindness.|Glad I could be useful.|You are welcome. Let us not make work of it."
],
M19: [
"I prefer saying what I mean, even when it comes out awkwardly.|A little honesty saves an awful lot of guessing.|I like knowing we can speak without putting on an act.|I do not want to hear another damned excuse for your company.|I want you to know that these small moments matter to me.",
"I am listening. Say it as you mean it.|Hello. A word is welcome.|You have my attention, honestly.|Go on. I would rather hear you clearly.",
"I am pleased you made time for me.|Your company matters to me.|It is good to speak with someone I trust.|I like that we can be straightforward together.",
"I heard you. I do not feel any friendlier.|Please do not mistake this for me enjoying your company.",
"I want this time with you, too.|You make me glad I said how I felt.",
"I will put it as plainly as I can.|A short word, with no hidden meaning.",
"All right. I respect that you want space.|I understand. I will leave you alone.",
"A proper check seems the responsible thing.|A rest sounds reasonable to me.|I am glad I was able to help.|You are welcome. There is no obligation in it."
],
M20: [
"I prefer conversations where the point is not concealed under courtesy.|I like knowing which silences are comfortable.|I can stop weighing every word around you.|I have better uses for my attention than your fucking games.|With you, I like not having to keep a little of myself in reserve.",
"I hear you. Let us see where this goes.|Hello. I can spare a moment's attention.|Go on. I am listening closely.|A little conversation is a manageable risk.",
"Good. We can speak without all the measuring.|I like hearing from you directly.|Your company is worth the pause.|I am glad we can be at ease.",
"I heard you. I am still not buying the act.|Take your bullshit to an easier audience.",
"You are the distraction I do not plan around.|I like how little I need to guard with you.",
"A brief word, without manoeuvring.|I will come directly to the point.",
"Very well. I know when to withdraw.|Understood. I will not press my welcome.",
"Check it while mistakes are still cheap to correct.|A pause would give us a little room to think.|No hidden debt. You are welcome.|Glad the help landed where it was needed."
]
};
Object.assign(rows, {
F01: [
"I prefer a clear word to a careful performance.|A quiet moment does not need filling for its own sake.|I can let my guard rest a little around you.|I have no intention of putting up with your fucking company.|I like how little armour I need between us.",
"Hello. I can hear you clearly.|Go on. I am giving you my attention.|We can have a moment to speak.|I hear you. Keep it straightforward.",
"I am glad you are within talking distance.|You are worth putting the day aside for.|I enjoy the ease we have together.|Your company is a welcome pause.",
"I heard that. I do not welcome more.|Take your fucking pleasantries elsewhere.",
"You have the part of me I keep quiet.|Come near. I like having you here.",
"A few plain words will do.|I will make this worth the moment.",
"Very well. I will give you distance.|Understood. There is no need to push.",
"Check everything while we have room to correct it.|A moment to rest is sensible.|I am glad I could make things easier.|You owe me no ceremony for that."
],
F02: [
"I like people who put a little life into a conversation.|I would rather be direct than spend the day dropping hints.|You are good company even when nothing much is happening.|I would enjoy this place more with you fucking elsewhere.|I like how readily my attention goes to you.",
"Hello! I am here and listening.|Go on, you have caught my ear.|A little conversation suits me fine.|I hear you. No need to circle round it.",
"Good, a voice I am happy to hear.|I can always find a moment for you.|Your company makes a decent change of pace.|I am glad we get to talk easily.",
"I have heard quite enough of your shit.|I am not being friendly. Do remember that.",
"There is nobody else I want this close right now.|You make it easy to want more time together.",
"I will be direct, then.|Just a quick word. Nothing to brace for.",
"Fine. I can walk away without a fucking escort.|All right. The space is yours.",
"Check it properly. I prefer surprises that do not injure us.|A breather sounds like an excellent idea.|Happy I could do something useful.|You are welcome. I am glad it worked out."
],
F03: [
"It helps when a conversation is not a contest.|I do better with a little time to find the words.|I am getting used to how easy it is to be near you.|Please stop. I am tired of swallowing my fucking discomfort.|I like being wanted even when I have nothing much to say.",
"Hello. I can listen for a while.|Yes, I am following what you say.|Go ahead. You are not troubling me.|A quiet word is all right with me.",
"I am really glad to hear your voice.|It is nice not to feel on the spot.|You make this feel comfortable.|I like having a friend to talk with.",
"I heard you. I would prefer to stop there.|Please do not make me keep asking for distance.",
"It is lovely being this comfortable with you.|I like knowing I can come close.",
"Just a little of your time, then.|I will say it as simply as I can.",
"Of course. I will not linger.|All right. I will leave you in quiet.",
"We can check slowly enough not to miss things.|A little rest sounds comforting.|I am happy the help was useful.|You are welcome. Please do not feel indebted."
],
F04: [
"I prefer blunt words to a long trail of bullshit.|A little fucking quiet can be a wonderful thing.|Your company is one interruption I do not resent.|I am sick of the sound of your fucking voice.|I like having someone I do not need to be sharp around.",
"Fine, I am fucking listening.|I heard you. There is no need for a performance.|You have a moment of my attention.|Go on. I can handle plain words.",
"Good. You can stay in my good mood a while.|I actually like hearing from you.|You are worth making a little room for.|Glad of your company. There, I said it.",
"Oh, shut your fucking mouth.|I have absolutely no patience for that shit.",
"You can have me without the barbs for a bit.|Come closer. I want the company.",
"A quick word, if you can stand the strain.|I will keep it short and spare the fucking fanfare.",
"Fine. Take your fucking mood somewhere over there.|All right. I can leave you to it.",
"Check the kit. I hate preventable fucking problems.|A chance to sit down sounds damn good.|Glad you are here to complain another day.|You are welcome. Do not turn it into a production."
],
F05: [
"I like a conversation with room to breathe.|There is a difference between attention and being crowded.|I enjoy your company without needing to make an occasion of it.|I am not offering you a smile, so stop fucking waiting for one.|I like knowing I can reach for you without making a show of it.",
"Hello there. I can spare a little attention.|Go on. I am listening now.|A moment of conversation sounds harmless.|I hear you. No need to lean so hard on it.",
"You are easy company to make time for.|It is good to have you close enough to talk.|I like the way we can relax together.|There is a voice I enjoy hearing.",
"You are confusing my attention with affection.|Spare me the fucking act, darling.",
"You have me paying closer attention now.|I like being near enough to forget the room.",
"Only a moment, without the ceremony.|I will get to it. No teasing required.",
"As you wish. I can give you room.|All right. I will leave you wanting less company.",
"Make the checks. Confidence is better with something behind it.|A little ease sounds very appealing.|You are welcome. No strings tucked into it.|I am pleased I could help you."
],
F06: [
"I enjoy hearing what people notice in an ordinary day.|I would rather ask for clarity than nod through confusion.|I like that a word with you never feels like an examination.|Your bullshit has exhausted my interest.|I like discovering how much of my attention you already have.",
"I hear you. I am taking it in.|Hello. I can give this a moment.|Go on; I like to understand before answering.|You have my attention, not a judgment.",
"I am glad we have room to talk.|Your company makes me feel more present.|It is good to hear your thoughts.|I enjoy how easily we find a conversation.",
"I understood you. That does not mean I want more.|Please take the tiresome shit elsewhere.",
"You are very easy to be interested in.|I like the small things we learn about each other.",
"A brief point, clearly put.|I will resist the side questions for a moment.",
"Understood. I will stop pressing for your attention.|All right. I can leave that space alone.",
"Check the details now, before they become discoveries later.|A pause would let things settle a little.|I am glad the effort helped.|You are welcome. That is enough acknowledgment."
],
F07: [
"I appreciate people who know when they have made their point.|Courtesy works best when it includes respect for my time.|Your company improves the standard of an afternoon.|I have dismissed you. Must I put it in fucking writing?|I find I want your attention even when there is nothing to arrange.",
"Very well. I am listening now.|You have a moment; use it plainly.|I hear you. There is no need to embellish.|Proceed. I can spare the attention.",
"Ah, company I actually welcome.|For you, I can set the formalities aside.|I am pleased we have a moment together.|Your voice is a considerable improvement.",
"Do not mistake being heard for being welcome.|Remove the bullshit from this exchange.",
"You have more of my attention than I intended.|Come close. I am asking, this time.",
"I shall keep to the purpose.|A brief word should be sufficient for us.",
"Very well. I have no wish to linger unwanted.|As you prefer. I can occupy myself elsewhere.",
"Inspect it properly. There is no merit in a hurried omission.|A pause is entirely acceptable.|I am pleased my help served its purpose.|Your thanks are received. Nothing further is required."
],
F08: [
"I like the little sounds that tell me life is going on.|Some silences feel easier than others.|Being near you makes the day feel a little gentler.|I cannot carry your damned company on top of everything else.|I like having someone to share the unremarkable hours with.",
"Hello. I am here to listen.|I hear you through the distraction.|We can have a quiet word.|Go on. I can give you a moment.",
"It is a comfort hearing a friendly voice.|I am glad we found time for this.|Your company makes the quiet kinder.|I like not having to explain myself so much with you.",
"Please do not add another unpleasant thing to the day.|I have heard enough from you for now.",
"You make this moment easier to stay in.|I am glad I can be close to you.",
"Just a small part of your time.|I will keep the words few.",
"All right. I will leave you your quiet.|I understand. I will not ask you to stay.",
"A careful check is one worry we can put down.|A little rest would help me settle.|I am glad I could do some good.|You are welcome. I am grateful it helped."
],
F09: [
"I prefer my conversations without a crowd around them.|I am comfortable letting a pause remain a pause.|I do not mind sharing the quiet with you.|You make solitude sound fucking delightful.|I like being close without having to advertise it.",
"Hello. I have heard you.|Go ahead. I am attending.|A few words will be fine.|You have a little of my time.",
"It is good to have uncomplicated company.|I am at ease talking with you.|Your voice is welcome enough to interrupt the quiet.|I like that we can take our time.",
"Do not take my attention as encouragement.|I would prefer less of your fucking presence.",
"This closeness suits us.|I like the way the room matters less with you here.",
"I will be succinct.|Only a brief exchange, then.",
"Certainly. I will leave you alone.|Understood. We can end it here.",
"Check it at your pace. I can wait.|A quiet break is appealing.|I am pleased it was useful.|No need for more thanks. I heard you."
],
F10: [
"I like a day that leaves room for an unexpected conversation.|A bit of cheer is easier to share than most belongings.|Your company makes the ordinary parts feel worthwhile.|I would smile a lot more if you fucked off.|I like the little happiness of finding you nearby.",
"Hello! You have got my attention.|Go on, I am happy to listen.|A word sounds like a nice pause.|I hear you. No rush at my end.",
"It is lovely having a moment with you.|There is someone I am pleased to hear.|Your company makes this feel lighter.|I like that we can just talk.",
"I have no cheerful answer for your bullshit.|Do not expect a smile just because you kept talking.",
"You make me happy in the smallest ways.|I like being the person you come close to.",
"Only a quick word, I promise.|I will spare you the long version.",
"All right. I will not force the sunshine on you.|Understood. I can find my own space.",
"A little check now will save a lot of fuss later.|A rest sounds like something to look forward to.|I am so glad the help mattered.|You are welcome. No paying it back required."
],
F11: [
"I appreciate a conversation that does not require applause.|There is a lot to be said for saying a little less.|Your company is remarkably low on unnecessary bullshit.|I would rather listen to a fucking hinge than another word from you.|You have an irritating talent for making me sentimental.",
"Hello. I can offer attention without the fanfare.|I hear you. Mercifully, no speech is required.|Go on. I have not exhausted my civil minutes yet.|A word will do. We need not found a committee.",
"Good. Someone whose company is not an endurance test.|I like hearing from you. No sarcastic footnote.|You are welcome to distract me for a while.|I enjoy our conversations. Even the unremarkable ones.",
"You could improve that enormously by shutting up.|I decline the additional serving of bullshit.",
"You make being soft feel less embarrassing.|I do like us. Please do not make a commemorative plaque.",
"The short version. Civilisation survives another day.|A quick word, without the fucking preamble.",
"Happily. We can both enjoy my absence.|Fine. I shall resist the urge to commemorate this.",
"A check sounds better than discovering the problem dramatically.|Sitting down has an excellent record of making feet happier.|Glad it helped. I have moments of usefulness.|You are welcome. We can skip the awkward ceremony."
],
F12: [
"I try to notice the kindness in unremarkable moments.|A little patience can change the sound of a conversation.|I am thankful to have a friend I can speak plainly with.|I have reached the end of my damned charity toward you.|I like the peace we can find in each other's company.",
"I hear you. There is time for a word.|Hello. I will give you my attention.|Go on. I can listen without hurry.|A quiet exchange is welcome.",
"It is a blessing to have easy company.|I am glad our paths have paused together.|Your friendship gives the day some warmth.|I like hearing your voice near me.",
"I do not have a blessing for that bullshit.|Please do not test what remains of my restraint.",
"I am grateful for the tenderness between us.|You make the ordinary feel worth cherishing.",
"A few plain words, if you please.|I will not take more time than I need.",
"Then I will give you peace.|Understood. I will leave the space you ask for.",
"Let us be careful with what we carry.|A little rest is a kindness worth allowing.|I am thankful I could help you.|You are welcome. Nothing is owed in return."
],
F13: [
"I prefer knowing whether a conversation has hidden costs.|Attention is a resource, too.|I find I do not count the minutes when I am with you.|Your company is a fucking expense I can do without.|You have rather disrupted my careful division of time.",
"Hello. I can afford a short word.|I hear you. Do get to the useful part.|Go on. My attention is available briefly.|A little conversation need not be costly.",
"For you, I can spare the time gladly.|A familiar voice is worth the interruption.|I am pleased to have your company.|You make the pause feel well spent.",
"There is no return worth listening to your shit.|I would rather lose the minute in silence.",
"You have more of my attention than any sensible account allows.|I do not need a return on being close to you.",
"A short word, with no charge attached.|I will keep the cost in time modest.",
"Fine. I know when the return is poor.|Understood. I will stop spending my time here.",
"Check the supplies. I dislike paying twice for the same mistake.|A rest sounds like a sensible use of the moment.|No debt recorded for that.|You are welcome. I am satisfied it helped."
],
F14: [
"I like leaving people room to gather their thoughts.|A soft voice can still mean exactly what it says.|Your company feels like somewhere I can set things down.|I have asked nicely enough. Give me some fucking space.|I like these small moments when we do not have to be useful.",
"Hello. I have a little time to listen.|I hear you. No need to hurry the words.|Go on. I am paying attention gently.|We can take a moment to speak.",
"I am happy you are here with me.|Your voice makes the pause feel warm.|I like how comfortable we are together.|It is good to have time for a friend.",
"Please do not ask for warmth I cannot give you.|I heard you. I would like to stop there.",
"You make me want to stay close.|I like having you near enough for the quiet words.",
"Only a small moment of your day.|I will be brief and clear.",
"All right. I will not crowd you.|I understand. Take the room you need.",
"Take care with the checks. There is time for that.|A gentle pause would be welcome.|I am glad the help reached you.|You are welcome. Please do not make it a burden to repay."
],
F15: [
"A few words usually do the job.|I prefer a point to a preamble.|Your company is welcome. No embellishment needed.|Take your fucking voice out of my day.|I like you close. That is enough reason.",
"Hello. You have a moment.|I hear you. Continue.|A word is fine.|Listening. Keep it plain.",
"Glad you are here.|Time for you is easy to find.|Good to hear your voice.|I like this ease with you.",
"Enough of your shit.|I heard. I am not interested in more.",
"Stay. I like this.|You make the quiet warmer.",
"A short word, then.|Straight to the point.",
"Understood. Leaving you room.|Fine. Enjoy the silence.",
"Check first. Save trouble.|A pause suits me.|Help given. Nothing owed.|You are welcome. Glad it mattered."
],
F16: [
"I like being able to see a conversation coming.|A little space helps me think more clearly.|I do not feel so braced for things when you are here.|Stop crowding me, for fuck's sake.|I like knowing I can lean closer without guessing whether I should.",
"Hello. Yes, I am listening now.|I hear you. I only needed a moment.|Go on. I am not trying to avoid you.|A short conversation feels manageable.",
"Oh, good. A voice I can relax around.|I am glad we get a quiet moment.|It helps to have your company.|I like not having to measure every word with you.",
"I heard you. Do not come any closer.|Please stop pushing for a fucking conversation.",
"You make me feel less on edge.|I like being wanted beside you.",
"Just a quick word. I will manage it.|I will try to be clear without rambling.",
"All right. I will move away.|I understand. I will not keep you here.",
"A slow check would help settle the nerves.|A chance to breathe would be nice.|I am glad I could do something right for you.|You are welcome. We need not make a fuss."
],
F17: [
"I like a conversation with a little room for expression.|Even I appreciate an interval between speeches.|Your company is the part where I stop playing to the room.|You have become a spectacular fucking waste of my attention.|I like how easily the performance falls away when it is us.",
"Hello. You have the floor for a moment.|Go on. I am an attentive audience when I choose.|I hear you, without a need for projection.|A brief exchange. How refreshingly modest.",
"A friend arrives, and the scene brightens.|I am glad we have our little interlude.|Your company is worth leaving the spotlight for.|I enjoy talking with you without an audience.",
"I refuse another act of this fucking nonsense.|Spare me the production. I have seen enough.",
"You make me forget to be impressive.|I like the private little world of being near you.",
"A short entrance, without the orchestra.|I shall attempt to leave out the dramatic pause.",
"Then I shall depart without an encore.|Very well. Your silence can have the stage.",
"A little preparation prevents a dreadful improvisation.|An interval sounds entirely deserved.|I am glad my part was a useful one.|You are welcome. The applause is optional."
],
F18: [
"I value a conversation that knows when to settle.|A little quiet is a fine use of time.|Your company takes less out of me than most things.|Go wear out somebody else's fucking nerves.|I like being with someone I do not need to gather myself for.",
"Hello. I can give you a little attention.|I hear you. No need to hurry me.|A few words are within my ambitions.|Go on. I have enough left to listen.",
"Your voice is worth the effort of looking up.|I am glad of some easy company.|It is good to have a moment with you.|I like that we do not need to make work of talking.",
"I cannot spare the energy for your bullshit.|Please stop asking me to endure another minute of you.",
"You are the closeness that feels restful.|I like having you within easy reach.",
"A short word is all I intended.|I will spend as few words as possible.",
"Gladly. I could use the rest.|All right. No more effort required from either of us.",
"Better to check before we are tired in the wrong place.|A rest sounds like the kindest option.|I am glad the effort was not wasted.|You are welcome. Let us leave it easy."
],
F19: [
"I like knowing the words are meant, even when they are clumsy.|It is easier to talk when nobody has to perform certainty.|Your friendship is something I want to make time for.|I do not want to dress my dislike in polite bullshit.|I like us best when we can simply say what we feel.",
"I hear you. I will give you a fair hearing.|Hello. I can take a moment.|Go on. I am listening in earnest.|A clear word is welcome with me.",
"I am happy we have time to talk.|Your company matters more than I sometimes say.|I like being able to speak openly with you.|It is good to hear from a friend I trust.",
"I heard you. I cannot honestly offer warmth.|Please do not pretend this is a friendly exchange.",
"I want to be near you, too.|You make me glad to be open about this.",
"I will say it plainly, then.|A few honest words should be enough.",
"All right. I will respect your wish for distance.|Understood. I will not stay where I am unwanted.",
"Taking care with the checks seems right to me.|A little rest would be sensible.|I am glad I was able to make a difference.|You are welcome. There is no bargain hidden in it."
],
F20: [
"I prefer knowing what a conversation is actually about.|There is a pleasure in not having to fill every silence.|I can stop looking for the hidden angle with you.|I have no interest in spending another minute on your fucking act.|I like how little of myself I feel obliged to hold back with you.",
"Hello. I am listening for a moment.|I hear you. Let us keep it simple.|Go on. My attention is yours briefly.|A short exchange seems reasonable.",
"It is good to talk without all the calculation.|I like having you close enough for a word.|Your company is worth the interruption to my thoughts.|I am glad we can be comfortable together.",
"I have heard the pitch. I do not want the bullshit.|Take the performance to someone easier to fool.",
"You are the distraction I make room for.|I like being close without keeping score.",
"A brief word, with the angle left out.|I will say it directly this time.",
"Very well. I know when to end an exchange.|Understood. I can give you the distance.",
"Check before the road makes the correction expensive.|A pause gives us room to collect ourselves.|No conditions attached to the help.|You are welcome. I am pleased it was useful."
]
});
ADV.DATA.CONVERSATION_BONUS_ROWS = rows;
Object.assign(rows, {
M21: [
"A clear word leaves less room for a careless assumption.|I like a little order in how I spend my attention.|Your company makes it easier to set duty aside for a moment.|I will not waste another fucking minute tolerating you.|I like the part of the day that belongs to us without a schedule.",
"I hear you. You have my attention.|Go ahead. I can spare the moment.|Hello. Let us keep this clear.|A short exchange is in order.",
"Good to hear from someone I can rely on.|I am glad we have time for a word.|Your company is worth a pause in the day.|I appreciate how easily we speak together.",
"I have heard enough. Do not keep pressing.|Your bullshit will get no further attention.",
"I like making room for you.|You are the interruption I welcome.",
"I will keep this orderly and brief.|A few direct words should cover it.",
"Understood. I will withdraw.|Very well. Your space will be respected.",
"A proper check is part of being ready.|A rest can be a sensible use of time.|I am glad the help served you.|You are welcome. Nothing further is required of you."
],
M22: [
"Most conversations improve when nobody is racing to finish them.|I like giving a thought time to settle before answering.|I am glad we can share time without putting a task around it.|My patience has a limit, and you are fucking leaning on it.|I like how easily a moment with you becomes time well spent.",
"I hear you. Take the moment you need.|Hello. There is room for a word.|Go on. I am in no hurry to interrupt.|I can give this a little thought.",
"Your company is always worth slowing down for.|I am pleased we have a moment together.|It is good to hear a familiar voice.|I like the comfortable pace we find.",
"I heard you. Patience is not an invitation.|I have no wish to give your shit another minute.",
"I like taking my time with you.|There is no hurry in being close like this.",
"A brief word, at an easy pace.|I will keep to what I mean.",
"All right. I will leave you the room.|Understood. We can let this rest.",
"Take the time now. A careful check is rarely wasted.|A pause would do no harm at all.|You are welcome. I am happy it helped.|There is no hurry to repay a kindness."
],
M23: [
"I prefer purpose to a great deal of conversational padding.|I have more respect for a plain admission than a polished excuse.|Your company earns my time without having to demand it.|I am done indulging your fucking presence.|I like that I need not keep a hard edge between us.",
"I am listening. Be clear.|Hello. A moment is available.|I hear you without the emphasis.|Go on. Stay with the point.",
"I value the time we spend speaking.|Your company meets a standard I seldom find.|I am glad to have a word with you.|You can expect my attention when you need it.",
"I have no intention of entertaining your shit.|Enough. My dislike was not a request for debate.",
"You have the warmth I do not spend freely.|I like having no need to be severe with you.",
"I will get directly to the matter.|A concise word is all this requires.",
"Fine. I have no interest in imposing myself.|Understood. You will have the distance you requested.",
"Inspect it properly. Carelessness gains us nothing.|A rest is sensible when it is needed.|I am pleased the help was effective.|Your thanks are enough. We can leave it there."
],
M24: [
"I like to keep a little attention on the room while I talk.|There is no need to fill a silence just because it arrived.|I find myself less busy watching everything when you are nearby.|I would prefer your fucking presence somewhere I cannot hear it.|I like how much easier it is to be here when you are close.",
"I hear you. I am still paying attention.|Hello. I can spare a word.|Go on. I can listen and look about.|You have caught my ear, at least.",
"It is good to have familiar company.|I am glad we can share a quiet word.|Your voice is one I like to notice.|I feel more at ease with you here.",
"I have heard enough to want more distance.|Do not mistake being noticed for being welcome.",
"You make it easier to stop watching the edges.|I like keeping you close for reasons beyond caution.",
"Just a short word, clearly put.|I will keep the point in sight.",
"Understood. I will step out of your space.|All right. I can leave you untroubled.",
"Look it over carefully while we have the chance.|A pause would let us settle for a moment.|Glad I could be there to help.|You are welcome. No more needs saying."
],
M25: [
"I like a little warmth in a conversation without a lot of ceremony.|An easy manner is not the same as having nothing on my mind.|Your company is one of the nicer habits I have acquired.|I would rather court a fucking headache than hear you out.|I like the moments when being near you is the whole point.",
"Hello. You have found me attentive.|Go on. A little conversation is agreeable.|I hear you. No need to make a grand entrance.|A moment of my time seems a fair request.",
"There is company I enjoy without an ulterior motive.|I am pleased we have a moment for each other.|Your voice is an agreeable distraction.|I like how easily we fall into conversation.",
"Do take the bullshit somewhere more appreciative.|I have no charm left for you, and little patience.",
"You make behaving myself look rather unappealing.|I like being close enough to lose track of the room.",
"Only a quick word, with the flourish omitted.|I shall keep the wandering to a minimum.",
"As you wish. I can leave gracefully enough.|Fine. I know when the invitation has ended.",
"A quick inspection is worth more than a convincing swagger.|A little repose would suit me beautifully.|Happy to be useful as well as decorative.|You are welcome. No favour held over you."
],
M26: [
"I enjoy a conversation with a little room for enthusiasm.|Even a fine story benefits from somebody else's voice.|Your company is worth shutting up for now and then.|I would rather hear a fucking echo than another word from you.|I like being with someone I do not need to impress every minute.",
"Hello! I can lend an ear as well as a voice.|Go on. I am capable of listening.|I hear you. Witness my restraint.|A little conversation sounds like a fine idea.",
"Good! Company I need not win over.|I am glad we have time to talk.|Your voice is worth making room for.|I like that we can be ordinary for a minute.",
"You are a poor audience and worse fucking company.|Spare me. Even I know when the boasting is empty.",
"You get the part with nothing to prove.|I like being enough for you without a story attached.",
"A short word. Yes, I know those exist.|I will leave out the impressive introduction.",
"Fine. There are other people in the world.|Understood. You can enjoy missing my company.",
"Check the gear. Greatness still has to fasten its straps.|A rest would help my heroic feet.|Glad the help lived up to the promise.|You are welcome. I can do useful things quietly, too."
],
M27: [
"I like a conversation with a bit of plain weather in it.|A person need not shout to make themselves understood.|Your company sits easy with me, like a well-worn coat.|You are a fucking nuisance in every direction.|I like having you close when there is nowhere urgent to be.",
"Hello there. I have an ear to spare.|I hear you through the day's noise.|Go on. Plain speaking suits me.|A short yarn will not sink the afternoon.",
"Good to hear a welcome voice.|I am glad of your company alongside mine.|A word with a friend sits well.|You are easy company to make room for.",
"Take your bullshit well downwind of me.|I have had enough of your damned noise.",
"I like you close enough to share the quiet.|You make staying put feel like somewhere worth going.",
"A short word, with no detour round the harbour.|I will get to it without hauling up a whole bloody tale.",
"Fine. I will give you a wide berth.|All right. The wind can carry me elsewhere.",
"Check the straps. Loose gear is a miserable travelling companion.|A breather would be welcome on any shore.|Glad I could lend a useful hand.|You are welcome. No tally against you."
],
M28: [
"I appreciate people who can make a point without making a scene.|A clear understanding saves a great deal of shouting.|I enjoy your company without needing a reason to direct it.|I have no intention of giving your shit another hearing.|I like being beside you without either of us having to take charge.",
"I hear you. Proceed plainly.|Hello. I can give you a moment.|You have my attention. Keep the point clear.|A short exchange is perfectly manageable.",
"Good to have a voice I can trust nearby.|I am glad we can speak freely.|Your company deserves some time of its own.|I like the ease of talking with you.",
"I did not invite more of your fucking commentary.|Your point is heard. Your company is unwanted.",
"You get my attention without having to ask for it.|I like the quiet we make together.",
"I will state it directly.|A brief word, without further arrangement.",
"Understood. I will leave you to yourself.|Very well. I can step aside.",
"Check what we have before relying on it.|A pause would help us take stock.|I am glad the help reached its mark.|You are welcome. No obligation follows it."
],
M29: [
"I appreciate a conversation that leaves room for another voice.|Politeness is useful. An excess of it can obscure the furniture.|Your company is a pleasure I need not dress up in better language.|Your tiresome fucking presence has outlasted my courtesy.|I like the words we do not need when we are close.",
"Hello. A little attention is easily offered.|I hear you. Please do continue.|You have secured a moment of my interest.|A short exchange need not trouble either of us.",
"A familiar voice is a most welcome interruption.|I am pleased we have time to speak without ceremony.|Your company makes the moment feel generously spent.|I like how little polishing our conversations require.",
"I would prefer your bullshit delivered beyond earshot.|Do not confuse my manners with a wish to continue.",
"You make me considerably less interested in saying the clever thing.|I like being near you more than describing why.",
"A concise word, without the ornamental wrapping.|I shall try to deserve the time I take.",
"As you wish. I will withdraw my company.|Understood. There is no elegance in overstaying.",
"An inspection would give confidence something solid to rest on.|A little repose sounds eminently civilised.|I am pleased I could be of service.|You are welcome. No debt concealed in the courtesy."
],
M30: [
"I like the small conversations that keep a day from drifting past.|A quiet word can help me feel properly here.|Your company draws me out of my own head a little.|I have enough unrest without your fucking company.|I like the way being near you brings the moment into focus.",
"Hello. I am listening through the distraction.|Go on. A word might help me settle.|I hear you. I am here.|You have a little of my attention now.",
"It is good to hear a voice I know kindly.|I am glad we have this quiet pause.|Your company helps the day feel real.|I like being brought back to the moment by you.",
"Please do not add your shit to the noise in my head.|I heard you. I do not want more of this.",
"You make being here feel worth the effort.|I like knowing I can be close to you now.",
"Only a few words, if I can put them in order.|I will keep it simple and stay with the point.",
"All right. I will take my thoughts elsewhere.|Understood. I can leave you the silence.",
"Checking the small things might help us feel ready.|A pause sounds like something I could use.|I am glad I was able to help in that moment.|You are welcome. Let the good of it stand."
],
F21: [
"I prefer giving a conversation a little space before judging it.|A calm voice can still be quite certain.|Your company makes it easier to let the day settle.|My composure does not make your shit any more welcome.|I like how easily I can be unguarded with you.",
"I hear you. I can give this a moment.|Hello. We can speak at an easy pace.|Go on. I am considering what you say.|You have my attention without needing to insist.",
"It is good to have your company nearby.|I am glad we can talk with this ease.|Your voice is a welcome part of the day.|I like that we can share the quiet without strain.",
"I have heard enough to prefer silence.|Please take your damned conversation elsewhere.",
"I like the warmth we have without needing to display it.|You make being close feel peaceful.",
"A short, straightforward word, then.|I will be clear without taking much time.",
"Understood. I will give you the room.|Very well. There is no need for either of us to press.",
"A careful check is worth doing calmly.|A moment to settle would be welcome.|I am glad the help was useful to you.|You are welcome. We need not make more of it."
],
F22: [
"I like people who let a conversation find its own pace.|A little perspective saves a lot of needless fuss.|Your company is a good reason to stop being busy for a moment.|Go try someone else's fucking patience for a change.|I like that we can be comfortable without making an occasion of it.",
"Hello. I can spare a word or two.|I hear you. No need to rush your tongue.|Go on. I am listening well enough.|A short talk will not hurt the day.",
"Good to hear from someone I enjoy.|I am glad we have a moment for each other.|Your company is worth leaving a little room for.|I like how easy it is to have you about.",
"I have heard enough bullshit to recognise yours.|Do not make me spend the afternoon repeating myself.",
"You make the ordinary hours feel well spent.|I like being near without any fuss about it.",
"A few words, and no unnecessary trimmings.|I will get to the point before the day grows old.",
"All right. I know how to leave someone be.|Fine. We can both use our time elsewhere.",
"Check it now. A little care spares a great deal of cursing.|A rest would do us more good than pretending we do not need one.|You are welcome. It was worth doing.|I am glad it helped. No tally needed."
],
F23: [
"I like a conversation that can keep up without turning into a contest.|A sharp answer is not always the useful one. I do know that.|Your company is one thing I do not need to win.|Your fucking presence is not a challenge. It is an irritation.|I like the moments when neither of us has anything to prove.",
"Hello. You have a quick hearing.|I hear you. Get on with the thought.|Go on. I am paying attention.|A short word seems reasonable enough.",
"Good. Someone I can relax around without feeling dull.|I like having your voice in the conversation.|Your company is worth a pause.|I am glad we can speak without competing for the last word.",
"I am not interested in another round of your shit.|Enough. You do not win my attention by being irritating.",
"You make it easy to put the sharp edges down.|I like how much I want to be close to you.",
"Quickly and clearly, then.|I will spare you a long fucking explanation.",
"Fine. I have better ways to spend the minute.|Understood. I am not competing to stay here.",
"Check it properly. I prefer losing time to losing equipment.|A pause sounds like a sensible move.|Glad the help counted for something.|You are welcome. No victory speech from me."
],
F24: [
"I prefer words that do not disturb more than they need to.|A little silence can hold a conversation together.|Your company makes the quiet feel shared instead of empty.|I would rather have silence than your damned attention.|I like having someone close enough to hear the softer words.",
"Hello. I am listening quietly.|I hear you. Let the words come at their pace.|Go on. There is space for a little conversation.|You have my attention for now.",
"I am glad of this moment with you.|Your voice belongs comfortably in the quiet.|It is good to share a little time.|I like not having to explain the pauses with you.",
"I heard that. Silence would be kinder to us both.|I have no wish to hear your fucking voice again today.",
"I like how close we can be without speaking loudly.|You make the quiet feel full.",
"Only a few considered words.|I will keep to the necessary part.",
"Understood. I shall leave the quiet to you.|All right. I will stand apart.",
"A patient check seems wise.|A still moment would be welcome.|I am glad I could be of help.|You are welcome. Nothing further need be said."
],
F25: [
"I appreciate courtesy that leaves room for an honest answer.|A little formality should make conversation easier, not longer.|Your company is a pleasure beyond any obligation of manners.|I will not disguise my wish for you to take your bullshit elsewhere.|I like that we can put the formalities down when we are together.",
"Hello. I can offer you a moment.|I hear you. Please go on.|Your words have my attention.|A brief conversation is quite acceptable.",
"It is a pleasure to speak with you again.|I am glad we have time without obligations attached.|Your company is most welcome to me.|I like the ease our friendship permits.",
"Do not mistake courtesy for approval of your company.|I have no patience left for this damned exchange.",
"I like being yours without having to phrase it elegantly.|You make closeness feel wonderfully simple.",
"I shall keep the matter brief.|A few direct words, with your attention.",
"Of course. I will respect your wish for privacy.|Understood. I shall take my leave now.",
"A proper inspection is worth the time it takes.|A brief rest seems entirely reasonable.|I am pleased the assistance was useful.|Your thanks are sufficient. There is no debt."
],
F26: [
"I like a conversation with a bit of fucking life in it.|A little honesty is more entertaining than perfect manners.|Your company is the sort of trouble I make time for.|You are a miserable fucking use of perfectly good air.|I like how close I can get to you without needing an excuse.",
"Hello! My attention is up for grabs briefly.|Go on. I can listen as well as mouth off.|I hear you. No need for the fucking drumroll.|A little talk sounds like harmless fun.",
"Good! Someone I actually want near me.|I like hearing your voice in the room.|Your company makes the day less tedious.|I am glad we can talk without dressing it up.",
"Oh, fuck right off with that.|I have heard your bullshit. It has not improved.",
"You make behaving myself a very uninteresting option.|I like being your favourite interruption.",
"A quick word. You will survive the excitement.|I will get to the fucking point, then.",
"Fine. Enjoy the riveting pleasure of yourself.|All right. I can take my noise elsewhere.",
"Check the gear. Surprises are better when they do not hurt.|A breather sounds fucking splendid.|Glad I could do something besides run my mouth.|You are welcome. No need to get shy about it."
],
F27: [
"I appreciate a conversation that knows how to be at ease.|A little grace should leave people more comfortable, not less.|Your company lets me stop considering how everything appears.|I have no appetite for another helping of your fucking company.|I like that I can be comfortable with you without being composed.",
"Hello. A little attention is yours.|I hear you. Please continue at your ease.|A brief exchange would be agreeable.|You have a moment of my interest now.",
"I am delighted to have your company a while.|Your voice is a welcome change in the day.|I like how comfortably we can talk.|It is a pleasure to make time for you.",
"I would be grateful for considerably less of your presence.|Take the bullshit somewhere my manners need not endure it.",
"You make being unguarded feel very natural.|I like how little else matters when you are close.",
"A few words, without unnecessary ornament.|I will keep the exchange pleasantly brief.",
"As you wish. I shall give you room.|Understood. I have no desire to impose.",
"An inspection would spare a less graceful surprise later.|A little rest sounds perfectly agreeable.|I am pleased the help was well received.|You are welcome. No elaborate thanks are necessary."
],
F28: [
"I like a conversation that leaves people clearer than it found them.|Not every moment needs to be used for something practical.|Your company reminds me that time can be worthwhile without a task.|I have no duty to endure your fucking company.|I like making time for us before the day asks for everything else.",
"Hello. I can put aside a moment.|I hear you. Let us keep this clear.|Go on. I am giving you my attention.|A short conversation will fit into the day.",
"I am glad to have a word with you.|Your company is worth making time for.|It is good to speak without a task between us.|I like these pauses we get together.",
"I have work enough without your damned interruptions.|I heard you. I have no wish to hear more.",
"You are someone I want time for, not another obligation.|I like the part of the day that belongs to us.",
"A brief word, and then I will let you continue.|I will keep to what needs saying.",
"Understood. I will leave you to your day.|All right. I can attend to something else.",
"Check the supplies. It is worth doing before we rely on them.|A rest sounds like something we should allow ourselves.|I am glad the effort helped you.|You are welcome. I did not do it to create a debt."
],
F29: [
"I prefer a clear meaning to an impressive choice of words.|A useful conversation makes room for uncertainty.|Your company lets me stop examining every small detail.|I have measured my patience, and your bullshit exceeds it.|I like how little correction a moment with you requires.",
"I hear you. I am attending to the point.|Hello. A brief word is possible.|Go on. I would like the meaning clear.|You have a moment of focused attention.",
"I am glad we can speak so easily.|Your company is worth the time exactly as it is.|It is good to hear a voice I trust.|I like not having to untangle our conversations.",
"I understood you precisely. I still want you gone.|I do not require another fucking example.",
"You are the detail my attention returns to.|I like how comfortably we fit into a quiet moment.",
"A short and specific word, then.|I will state exactly what I mean.",
"Understood. I will give the requested distance.|All right. Your meaning was clear enough.",
"Count and check. An assumption is not a spare supply.|A pause would give us time to settle our thoughts.|I am glad the help did what was needed.|Your thanks are understood. No further accounting is necessary."
],
F30: [
"I like the small exchanges that make a place feel inhabited.|An ordinary voice can keep a day from slipping too far away.|Your company makes the quiet a little less empty.|I have no space left for your fucking unpleasantness.|I like knowing I can be near you in this particular moment.",
"Hello. I hear you here with me.|Go on. A little conversation is all right.|I can give you a moment's attention.|Your words have reached me. I am listening.",
"I am glad to have a familiar voice close by.|Your company helps me feel part of the day.|It is good to share a little time with you.|I like being able to pause beside a friend.",
"Please do not make the quiet worse by staying.|I have no room for another damned word from you.",
"I like having this moment with you while it is here.|You make the ordinary hours feel precious.",
"Only a little of your time, briefly.|I will try to keep the words simple.",
"All right. I will leave you alone with your thoughts.|I understand. I can take my company elsewhere.",
"A careful check gives us one less thing to worry about.|A quiet rest would be welcome now.|I am glad I could make something easier for you.|You are welcome. Let that kindness stand on its own."
]
});
const D = ADV.DATA.DIALOGUE;
for (const [id, row] of Object.entries(rows)) {
 const p = D[id], groups = row.map(s => s.split('|'));
 if (!p || groups.map(g=>g.length).join(',') !== '5,4,4,2,2,2,2,4') throw new Error('Invalid bonus dialogue: '+id);
 function add(band, text, family, response, tag) {
  const index = p[band].length;
  p[band].push('['+(tag||'calm')+'] '+text);
  if (response) p.replyFamilies[band].push([family]);
  else p.families[band].push(family);
  return index;
 }
 const statementBands = ['general','general','friendly','hatred','romantic'];
 groups[0].forEach((t,i)=>add(statementBands[i],t,i===3?'dismissal':'contact',false,i===3?'annoyed':i===4?'softly':'calm'));
 ['general_response','friendly_response','hatred_response','romantic_response','inquiry_response','dismissal_response'].forEach((band,i)=>{
  groups[i+1].forEach(t=>add(band,t,i===4?'inquiry':i===5?'dismissal':'contact',true,i===2?'annoyed':i===3?'softly':'calm'));
 });
 // The same authored situational reply can be appropriate at multiple levels
 // of positive regard. Reuse that actor's recording, not another actor's voice.
 ['general_response','friendly_response','romantic_response'].forEach(band=>{
  groups[7].forEach((t,i)=>add(band,t,['preparation','company','thanks','thanks'][i],true));
 });
}
ADV.DATA.DIALOGUE_REVISION = 'conversation-bonus-1';
})();
