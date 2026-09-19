// Authored conversation revision. Each row contains four coherent social bands.
// Responses answer contact, company, preparation, and thanks respectively.
(function () {
'use strict';
const D = ADV.DATA.DIALOGUE;
const rows = {
M01: [
"Hello. What brings you here?|I've a moment to spare.|I like to know the work before I agree to it.|There's no hurry. Say what you need.",
"Good to see you back.|I enjoy your company. Even when we're quiet.|I'd work with you again.|You can count on an honest answer from me.",
"I'd prefer some distance.|We don't get along. Let's leave it there.|Keep this brief, please.|I have nothing friendly to say to you.",
"There you are. Stay a little.|I like having you beside me.|You don't have to find something to say.|I've been looking forward to seeing you.",
"I'm listening.|A little company is fine.|Check your weapon. We can share the rest.|You're welcome.",
"Good to hear your voice.|Gladly. I've heard enough about work today.|I'll check things with you.|I'm glad I could help.",
"I heard you.|I'd rather sit elsewhere.|Check it yourself. I won't interfere.|That's enough. Leave it there.",
"You've got my attention.|We've got a moment.|Let's make sure we're both ready.|I'm glad you're still with me."
],
M02: [
"Hello there. Looking for company?|I like a job with a clear reward.|I've got plenty of enthusiasm. Occasionally a plan, too.|If you want something said plainly, I'm your man.",
"Now there's someone I'm pleased to see.|A good friend makes even waiting bearable.|I like having you around. Keeps me honest. Mostly.|You and me should find time to enjoy ourselves.",
"I'm in no mood to be friendly with you.|Give me some room and we'll manage.|I'd rather we kept our distance.|Don't mistake a quiet moment for us getting along.",
"Come here. I've missed that face.|I'm very pleased with my taste in partners.|I like us. Even on the ordinary days.|You make staying in sound like an adventure.",
"Hello! You've found me.|Go on, make room.|We'll check it together. Better here than halfway down the road.|Happy to lend a hand.",
"Always good to hear from you.|Count me in for the company.|We'll sort it. No sense fretting alone.|You can help me with the next one.",
"What is it, then?|Find someone else to sit with.|Make your own checks. I'm making mine.|We're still not friends.",
"Hello, you. That's improved my day.|I've got time for you.|Let's check together, then get a moment to ourselves.|You're here. I'm happy with that."
],
M03: [
"Hello. I wasn't sure whether to introduce myself.|I take a little while to get comfortable with people.|I'd rather ask a foolish question than guess wrong.|Quiet work suits me. Usually.",
"I'm glad it's you. That makes this easier.|I don't feel rushed when we talk.|It's nice having someone I can relax around.|I like spending time with you, even when I run out of words.",
"Please give me some space.|I'd rather not talk with you right now.|I can be civil. That's all I can offer.|I'm uncomfortable around you, and I need you to respect that.",
"I was hoping we'd have a little time together.|I like being close to you.|You don't have to fill every quiet moment.|I'm happy we're together. I wanted to say it clearly.",
"Oh, hello. Yes, I'm listening.|I could sit a little while.|We can check one thing at a time.|That's all right. I'm glad it helped.",
"Hello! It's easier when it's you.|I'd like that. Thanks for asking.|I'll go through the supplies with you.|You don't owe me a speech. I'm just glad you're here.",
"Yes? Please be brief.|I'd feel better somewhere else.|Please ask someone else to help you check.|I heard you. I'd like to leave it there.",
"There you are. Come closer.|I'd like a quiet moment with you.|Let's check together. Then I can stop worrying about the packs.|You're safe here with me for the moment."
],
M04: [
"Looking for another blade? Tell me what the job involves.|I prefer a straight answer, even when I won't like it.|We can argue over a plan before we set out.|I lose patience with wasted effort. I'm working on it.",
"I'm pleased to see you. Don't look so surprised.|I can relax a bit around you.|There's room beside me if you want it.|It's good having someone I don't have to argue with over everything.",
"Give me some room. I'm angry enough already.|I don't trust you. Let's be clear about that.|We can keep this civil if we keep it short.|I'm not interested in pretending we get along.",
"Come sit with me. The rest can wait.|I like the quiet we have together.|You matter to me, even when I'm bad at saying it.|I can put my temper down for a while. Stay.",
"Go on. I'm listening.|Fine by me. There's room.|Better to check now than swear about it later.|It needed doing. Glad I could do it.",
"Good. Someone I want to hear from.|Sit here. You can help me complain about the food.|I'll help check. We can argue about the packing later.|Just help with the next one. I was getting busy.",
"Say what you came to say.|I want to be left alone by you.|Check your own things. I'll stay out of your way.|I heard you. It doesn't settle everything.",
"You have my attention. All of it.|Yes. Come close.|Let's make sure we both have what we need.|I'm glad you're still here beside me."
],
M05: [
"Hello. Business or a pleasant distraction?|I like to know what I'm agreeing to before I smile.|There's usually a sensible way. I try it occasionally.|A little company improves most places.",
"There you are. I was due some good company.|I like you. It's becoming terribly obvious.|I can drop the salesmanship with you for a while.|I'd happily spend an idle hour with you.",
"Let's keep the pleasantries brief.|I don't think either of us enjoys this company.|I'd rather not pretend we're on good terms.|You can have my attention. My trust is another matter.",
"Come closer. I haven't any clever reason.|I like the part of the day that includes you.|You make an ordinary evening quite tempting.|I enjoy being myself with you. Less work, for one thing.",
"Hello yourself. I'm listening.|An agreeable suggestion.|A quick check now saves an expensive story later.|Consider it a useful interruption.",
"Excellent. My sort of company.|Gladly. I could use a friendly face.|I'll check with you. Two sets of eyes, fewer surprises.|You're welcome. No invoice for this one.",
"Yes? Let's get through it.|I'll find other company.|I'd ask someone you trust to check.|Acknowledged. We can leave it at that.",
"Hello, my favourite distraction.|I'd like that very much.|Let's check, then steal a little time together.|I'm glad I was there for you."
],
M06: [
"Hello. I enjoy hearing how other people approach things.|I like finding out why something works.|There's always more to learn than time to learn it.|A good question can save a great deal of trouble.",
"I'm glad you're here. I like the way you think.|Talking with you usually gives me something to consider.|I enjoy having a friend who lets me wonder aloud.|Your company makes an ordinary day interesting.",
"I'd rather not discuss personal things with you.|I can listen without agreeing to anything.|We should keep this conversation practical.|I don't feel comfortable sharing much with you.",
"I like learning the small things about you.|An evening together sounds like an excellent use of time.|I don't need to solve anything when we're sitting together.|There's always something I enjoy discovering about us.",
"Hello. You've got my attention.|I'd enjoy some conversation.|We could compare lists. Easier to spot a gap.|I'm pleased it was useful.",
"Good to hear from you. Go on.|Yes, let's find a moment.|Let's check together. You might notice something I miss.|I'm glad I could be there when it mattered.",
"I can hear you. What is it?|I'd prefer to keep to myself.|You should check with someone else.|Understood. I'd rather move on.",
"There you are. Tell me what's on your mind.|I'd love a little time together.|Let's check everything, then stop thinking about supplies.|I'm grateful we still get to talk like this."
],
M07: [
"Good day. I appreciate a clear introduction.|I prefer to understand an arrangement in full.|A little preparation spares everyone embarrassment.|I have high standards. They apply to me as well.",
"I'm pleased to see you. Your company is welcome.|I value being able to speak frankly with you.|You needn't stand on ceremony with me.|I make time for people I enjoy. That includes you.",
"We can manage a civil conversation, I hope.|I would prefer to keep our dealings limited.|My regard is not something I can pretend.|Please don't confuse courtesy with affection.",
"Come sit beside me. I enjoy having you near.|I find I look forward to the simplest things with you.|There's no need for a performance between us.|I'm rather happy with us, you know.",
"Good day. Please continue.|I can spare a moment for company.|Careful preparation is entirely sensible.|I'm pleased the assistance was useful.",
"A welcome interruption.|I would be delighted to join you.|Let us check together. No shame in being thorough.|You are welcome. I value you.",
"Yes. I am listening.|I would prefer another seat.|Arrange your own checks, please.|Your thanks are noted.",
"My attention is yours.|I'd like nothing better just now.|Let's make certain we're ready together.|I'm very glad I could help you."
],
M08: [
"Hello. A quiet conversation would be welcome.|Some days I prefer to take things slowly.|I'm listening, even if I don't have much to say.|An ordinary day has its comforts.",
"It's good to see a friendly face.|I appreciate your company more than I show.|There's room for you in my quiet.|I'm glad we can spend a little time together.",
"I don't have the energy for an argument with you.|I'd prefer we left one another alone.|We can be polite without getting close.|I don't want to spend this hour being angry.",
"Come sit with me. I like having you here.|Even a difficult day has this part in it.|You don't have to cheer me up to be welcome.|I'm glad we found some time for each other.",
"Hello. Go on, I'm listening.|A little company might be nice.|We can check slowly. There's no prize for rushing.|I'm glad I could do something useful.",
"I'm pleased it's you.|I'd like to sit together.|Let's check with each other. That feels easier.|You're welcome. It's good to have you here.",
"Yes. Say what you need.|I'd rather have some quiet.|Please check with someone else.|I heard you. Let's leave it there.",
"There you are. Stay near.|I'd like that. Very much.|We'll go through it together.|I'm glad we have this moment."
],
M09: [
"Hey. Got a minute to talk?|I like to keep things straightforward.|A bit of breathing room usually helps.|I'm happy to hear you out.",
"Hey, good to see you.|I like having you around.|Your company makes this place easier to enjoy.|We should find a little time to catch up.",
"Let's give each other some space.|I don't want an argument. I don't want company either.|We can keep this short.|I'm not comfortable around you right now.",
"Hey, you. Come sit close.|I like us on the ordinary days too.|A little time together would suit me fine.|I'm happy you're here. Simple as that.",
"Hey. I'm here.|Sure, I've got a moment.|Let's check. No need to rush it.|No trouble. Glad it helped.",
"Hey, it's good to hear from you.|Sure. I'd enjoy that.|We can check each other's things.|You'd help me too. I'm glad we're both here.",
"Yeah. What is it?|I'll sit somewhere else.|Check with someone else, please.|Okay. Let's leave it there.",
"Hey, love. I'm listening.|Yeah. Come close.|We'll make sure we're both set.|I'm glad I could be there."
],
M10: [
"Hello there! A bit of conversation never goes amiss.|I like a place where people have time to talk.|There's usually room for one more in a good conversation.|A friendly introduction is an excellent start.",
"There you are! Good to see you.|I enjoy your company, and I see no reason to hide it.|We ought to find a little time for ourselves.|A friend can make even waiting feel worthwhile.",
"I'm trying to be civil. Please meet me halfway.|I'm not feeling friendly toward you.|We should give one another some room.|I'd rather not turn this into an argument.",
"There you are. That's the best part of my day improved.|Come sit with me. I like us close.|I find myself smiling about very ordinary things with you.|I'm happy we're together. I'll say it as often as I like.",
"Hello! Good to hear a voice.|By all means, let's have some company.|Let's check it together. Much less tedious.|You're very welcome. Glad to help.",
"Aha, a welcome interruption!|Gladly! Make a little room.|We'll check together and complain about the weight.|I'm just pleased you're here to thank me.",
"Yes, I hear you.|I'd prefer some other company today.|You'll have to ask someone else to check.|Thank you for saying so. I need some space now.",
"Hello, you. Come tell me.|I'd love some time together.|Let's check, then have a moment just for us.|You're here with me. That's what matters now."
],
M11: [
"Hello. I'm willing to hear the reasonable version.|I prefer a plan that includes what happens if it fails.|Optimism's useful. So is checking the ropes.|I'm listening. I complain better when I know the details.",
"Good to see you. I can put the suspicion away for a minute.|I enjoy your company. Yes, that was sincere.|There's room beside me if you can tolerate the commentary.|A friend makes this place rather less tiring.",
"I'd rather keep this brief and unpleasant than falsely cheerful.|I'm not interested in your company.|We can avoid an argument by giving each other space.|I don't trust you. There, no misunderstanding.",
"Come sit with me. I'm taking a break from expecting trouble.|I like us. It's inconvenient for my reputation.|You make the ordinary parts worth keeping.|I'm pleased you're here. No qualification this time.",
"Hello. Let's hear it.|A little company won't ruin me.|Check the straps too. Optimism won't hold a bag shut.|You're welcome. Occasionally things do go right.",
"Good. Someone worth listening to.|Yes. I could use a friendly interruption.|I'll check with you. We can distrust the packing together.|I'm glad I helped. Don't make a ceremony of it.",
"I heard you the first time.|I'd prefer a different table.|Have someone else check it.|Fine. That's acknowledged.",
"There you are. I'm glad.|Yes. Let's keep a little time for us.|Let's check everything. Then I can worry about something less useful.|I'm glad you're here. I'll allow that much optimism."
],
M12: [
"Peace to you. I've time to listen.|A little patience is useful work too.|I try to leave room for doubt before I judge.|An ordinary kindness is worth the effort.",
"I'm glad to see you well.|Your friendship is something I value.|I enjoy sharing a quiet moment with you.|You are welcome in my company.",
"I can offer you courtesy. I cannot offer trust.|I'd rather have some distance between us.|Let us keep this conversation peaceful and brief.|My feelings toward you are not kind today.",
"I'm thankful for the time we have together.|Come close. We needn't make an occasion of it.|I like the quiet life that fits between our adventures.|You have a place beside me.",
"Peace to you as well.|Company is welcome.|Let us check carefully. Care is part of keeping one another safe.|I'm thankful I could help.",
"It is good to hear from you.|I'd be glad to sit together.|I'll check with you. We needn't hurry.|Your thanks are welcome, my friend.",
"I hear you.|I would rather sit alone.|Please seek another pair of eyes.|I accept the thanks. We still need distance.",
"I'm here, and listening.|I would cherish a little time together.|Let's make sure we're both ready.|I'm grateful we have one another."
],
M13: [
"Hello. I like an arrangement with clear terms.|A fair price saves a surprising amount of shouting.|I keep an eye on expenses. Someone ought to.|Conversation is free. Advice may require thought.",
"Good to see you. Your company is worth making time for.|I like a friend I can be straightforward with.|There's more to a day than earning. Occasionally I remember that.|I'd enjoy some time with you that isn't about work.",
"Let's keep our dealings strictly necessary.|I don't trust you enough for a friendly chat.|I'd prefer some distance, and no confusion about it.|We can be civil without pretending anything more.",
"You make an idle hour feel well spent.|Come sit with me. The accounts can wait.|I like the life we're making room for.|I'm glad I have someone to come close to.",
"Hello. What can we discuss?|I can spare a little time.|Check before buying replacements. That's my advice.|Glad it was useful.",
"Good to hear from you.|I'd enjoy that. No business for a moment.|I'll check with you. Missing kit gets expensive.|You're welcome. This one isn't a transaction.",
"Yes? Keep it to the point.|I'll find company elsewhere.|Please make your own arrangements.|I've heard your thanks. That's enough.",
"There you are. Worth the interruption.|I'd like a moment together.|Let's see that neither of us is missing anything.|I'm glad I could help the person I love."
],
M14: [
"Hello. Take your time, I'm listening.|A little patience usually helps people settle.|I like to make room for a quiet conversation.|You needn't rush on my account.",
"I'm glad to see you. Stay a little if you like.|Your company is always welcome with me.|It's good to have a friend nearby.|We can sit quietly if you haven't much to say.",
"I need some space from you.|Please don't mistake politeness for trust.|I don't want a quarrel, but I won't pretend affection.|I'd rather we left one another alone for now.",
"Come here. I'm glad we have this time.|I like looking after one another in small ways.|You don't have to be entertaining to be welcome.|I'm happy just being close to you.",
"Hello. I'm listening to you.|I'd be glad of some company.|We can check together. No need to do it all alone.|I'm glad I could help a little.",
"It's good to hear your voice.|I'll stay a while, if you want company.|I'll help you go through the supplies.|You're welcome. I'm glad you're with us.",
"Yes. Please say what you need.|I'd prefer to be alone just now.|Please ask someone else to check.|I heard you. I still need some space.",
"There you are, love.|I'd like that. Come close.|Let's check things together, then rest a moment.|I'm glad I was there for you."
],
M15: [
"Hello. What's on your mind?|I prefer a clear explanation.|I've time for a short talk.|Straight answers suit me.",
"Good to see you.|I like your company.|There's room for you here.|I'd be glad to spend a little time together.",
"I'd rather not talk to you.|Keep your distance, please.|I'm not pretending we're friends.|Say what's necessary. Leave the rest.",
"Come close. I'm glad you're here.|I like this. Us.|Stay a while with me.|You matter to me. That's worth saying.",
"I'm listening. Go on.|Fine. Take a seat.|Check your weapon. We can share the rest.|Glad it helped.",
"Good to hear from you.|Gladly. I've heard enough about work today.|I'll check with you.|You're welcome. Keep well.",
"What do you need?|I'd rather sit elsewhere.|Check your own kit.|Heard you. Leave it there.",
"Hello, you.|I'd like that.|Let's make sure we're both ready.|I'm glad you're here with me."
],
};
Object.assign(rows, {
M16: [
"Hello. Let me gather my thoughts a moment.|I feel better when I know what to expect.|I'd rather double-check than pretend I'm certain.|A quiet introduction suits me best.",
"I'm glad you're here. I feel less on the spot.|It's nice to talk without rehearsing everything.|I enjoy your company, even when I get tongue-tied.|I can settle down a little with a friend.",
"I'd like some distance from you.|I'm not comfortable having this conversation.|Please keep this short.|I don't want to argue. I do want to be left alone.",
"There you are. I'm pleased we have time together.|I like being close, even when I don't know what to say.|You don't have to solve my worries to be welcome.|I'm happy with you. That part I'm sure about.",
"Oh, hello. Go ahead.|A little company might help.|Let's check the list together. One thing at a time.|I'm relieved it helped.",
"Hello! I'm glad it's you.|Yes, I'd like to sit together.|I'll check with you. That should settle both our minds.|I'm glad I was useful when you needed me.",
"Yes? Please be quick.|I'd feel better alone.|Could you ask someone else to check?|I understand. Please give me space now.",
"There you are. I've time for you.|I'd really like that.|Let's go over it together, then stop worrying about the bags.|I'm glad we're here together."
],
M17: [
"Hello! A new conversation, how promising.|I enjoy a good story. Even one with a modest ending.|I can be brief. It requires discipline, but I can.|The world provides material. I supply the enthusiasm.",
"My friend! An excellent addition to the day.|I enjoy your company without needing an audience.|It's a pleasure to have someone I can talk freely with.|We ought to allow ourselves an unremarkable, pleasant hour.",
"Let us keep this scene short.|I have little appetite for your company.|We can dispense with the performance of friendship.|I would prefer a little distance between us.",
"There you are. I can stop entertaining the room.|Come sit beside me. No grand occasion required.|I'm rather happy being ordinary with you.|You have my attention without needing to compete for it.",
"Hello! You have the floor.|A little company would be splendid.|Let us check. Forgotten equipment makes a tiresome second act.|I'm delighted I could be useful.",
"A welcome voice! Continue.|Yes, let us have an hour without an audience.|I'll check with you. Even adventures need preparation.|You're welcome. I'll spare you the acceptance speech.",
"Speak, then. Briefly.|I would rather sit this scene out.|Find another assistant for your preparations.|Acknowledged. We needn't prolong it.",
"There you are, my dear.|I'd like that more than a grand evening.|Let's check everything, then have a moment to ourselves.|I'm very glad our story continues."
],
M18: [
"Hello. A quiet talk would suit me.|I'd rather do a thing carefully than do it twice.|There's comfort in an uncomplicated day.|I listen better when nobody's shouting.",
"Good to see someone I can relax with.|I enjoy your company. It asks less of me.|Stay a little. We needn't make plans.|A quiet hour with a friend is worth keeping.",
"I haven't the patience for a quarrel with you.|Let's keep some space between us.|I'd prefer you left me to myself.|We can be civil and keep moving.",
"Come sit close. It's good having you here.|I like sharing the uneventful hours with you.|There's no need to make tonight impressive.|I'm glad we have each other to come back to.",
"Hello. I'm listening.|A seat and some company would suit me.|Check the straps first. Saves doing it on the road.|Glad I could save you some trouble.",
"Good. A friendly voice.|I'd appreciate a little company.|I'll check with you. No reason to rush.|I'm glad you made it through.",
"What is it? Keep it short.|I'd rather have the quiet.|Please check with someone else.|Heard you. Let's leave it alone now.",
"There you are. That's good.|I'd like to sit with you.|We'll go through it together.|I'm glad I could be there for you."
],
M19: [
"Hello. I like to know people properly.|I try to be clear about what I can offer.|If I'm uncertain, I'd rather say so.|Doing a thing well matters to me.",
"I'm glad you're here. I enjoy our time together.|I value having someone I can speak honestly with.|Your friendship means a good deal to me.|I'd like to make time for something besides work with you.",
"I'd rather be honest: I don't enjoy your company.|We should keep this practical.|I'm not ready to be friendly with you.|I don't want an argument, but I do need distance.",
"I love having you close.|I'm glad we chose each other.|The small moments together matter to me.|You don't have to wonder whether you're welcome here.",
"Hello. I'm pleased to listen.|I'd like some company.|Let's check together. It's worth doing properly.|I'm glad I could help.",
"Good to hear from you, my friend.|I'd be happy to join you.|I'll help check. We should both feel prepared.|You're welcome. I meant to be there for you.",
"I hear you. What do you need?|I'd rather we sat apart.|Please have someone else check.|I accept the thanks. I still need some room.",
"I'm here, love. Tell me.|I'd like that very much.|We'll make sure we're both ready.|I'm thankful we're still together."
],
M20: [
"Hello. I like to hear the details before I agree.|A little discretion makes life easier.|I'm interested in how people reach their decisions.|There's often more to a job than the notice admits.",
"Good to see someone I can speak freely with.|I like having you around. No hidden meaning.|There's room for a quiet conversation between us.|A friend is worth making time for.",
"Let's keep our dealings brief.|I'd rather not share much with you.|You can have a civil answer. Nothing more.|I prefer to know where you are: somewhere else, ideally.",
"Come closer. There's nothing to negotiate.|I like the part of my day that belongs to us.|It's pleasant not weighing every word with you.|I'm glad we have a little time alone.",
"Hello. I'm paying attention.|I can spare a moment.|Check the closures as well as the contents.|Glad it worked out usefully.",
"A welcome voice. Go on.|I'd enjoy sitting together.|I'll check with you. Fewer surprises that way.|You're welcome. No favour owed.",
"What is it you need?|I'll keep my own company.|Find another pair of eyes for that.|Your thanks are heard. We'll leave it there.",
"There you are. I've time.|I'd like that. Somewhere quiet.|Let's check things, then have a moment without plans.|I'm glad I could be beside you."
],
M21: [
"Hello. I prefer to know the plan before the work starts.|A clear role helps everyone.|I like a task I can finish properly.|Preparation gives us room to think when things change.",
"Good to see you. Your company is welcome.|I value a friend I can speak plainly with.|We can set work aside for a moment.|I enjoy the quiet when we're together.",
"We should keep our distance.|I can work through necessary matters with you.|Please keep this conversation brief.|I don't trust you enough for anything personal.",
"Come sit beside me. I've made time.|I'm happy when we have a quiet moment together.|You have my attention without having to ask twice.|I like the ordinary rhythm of being with you.",
"Hello. Please continue.|A short rest together is sensible.|Let's check in order, then we'll know.|I'm glad the work helped.",
"Good to hear from you.|I'd like to sit together.|I'll check with you. No hurry.|You're welcome. I'm glad I was there.",
"State what you need.|I'd prefer to sit separately.|Please arrange another person to check.|Acknowledged. Nothing further is needed.",
"I'm listening, love.|I'd welcome a moment with you.|We'll make sure we're both prepared.|I'm glad we are still beside one another."
],
M22: [
"Hello. There's time to speak carefully.|I find rushing makes most things take longer.|I'm content to hear the whole explanation.|A pause is useful if it saves a mistake.",
"I'm pleased to see you. Stay a little.|Your company is worth making room for.|We needn't hurry through a good conversation.|I enjoy the quiet moments with a friend.",
"I'd rather keep some space between us.|We can take care with our words and leave it there.|I don't wish to argue with you.|Please don't expect warmth I don't feel.",
"Come close. We have this moment.|I enjoy taking my time with you.|An ordinary evening together is enough for me.|I'm glad we can be quiet without being distant.",
"Hello. Take your time.|I'd be glad of company.|We'll check slowly. It's quicker than going back.|I'm pleased it was of help.",
"Good to hear your voice.|Yes, let's sit awhile.|I'll go through it with you.|You're welcome. No need to hurry through the thanks.",
"I'm listening. Say what is necessary.|I'd prefer to be alone.|Please ask another person to check.|I hear your thanks. We can stop there.",
"There you are. I've time for you.|I would like that.|Let's prepare together, without rushing.|I'm glad we have more time together."
],
M23: [
"Good day. I value a precise account.|I prefer expectations to be clear from the start.|A difficult answer is better than an evasive one.|I take my obligations seriously.",
"I'm pleased to see you. You are welcome here.|I value your friendship and our frank conversations.|There is time for something besides work.|I enjoy your company without needing a reason.",
"I would prefer this conversation stayed necessary.|I have no interest in pretending friendship.|We can maintain our distance with courtesy.|Please do not press for familiarity.",
"Come sit with me. I want you here.|I can set the demands aside when we're together.|I'm glad to have this part of my life with you.|There is nothing you need to prove in this moment.",
"Good day. I'm listening.|A little company is acceptable.|A thorough check is the sensible course.|I'm pleased it served its purpose.",
"A welcome interruption. Speak freely.|I would enjoy that.|I'll check with you. Thoroughly.|You're welcome. I value your well-being.",
"What is required?|I prefer to remain apart.|Find someone else to assist with that.|Your thanks are acknowledged.",
"I'm here. You have my attention.|I'd like time with you.|We'll see that we're both prepared.|I'm glad I was able to help you."
],
M24: [
"Hello. I like to get my bearings before I settle.|It's easier to notice things when nobody's rushing.|I pay attention. It saves questions later.|A quiet corner suits a conversation.",
"Good to see a familiar face I enjoy.|I can relax a little when we talk.|Your company gives me a reason to stop looking around.|I'm glad we've found a moment together.",
"I would rather keep you at a distance.|I'm not comfortable sharing much with you.|Let's keep this conversation in the open and brief.|I'd prefer we went our separate ways.",
"There you are. I've been looking forward to this.|I like noticing the small things about you.|Come close. The rest can wait.|I'm happy to spend a quiet moment with you.",
"Hello. I hear you.|A quiet seat would suit me.|I'll take a second look with you.|I'm glad I noticed in time to help.",
"Good. Someone I want to hear from.|Yes, let's sit together.|We can check each other's straps.|You're welcome. I'm glad you're here.",
"Yes? I'm listening.|I'd prefer a different spot.|Ask someone else to have a look.|I've heard you. Let's leave it at that.",
"Hello, love. Come close.|I'd like that, somewhere quiet.|Let's check together, then have our moment.|I'm glad I could be there when you needed someone."
],
M25: [
"Hello! I enjoy a bit of company.|A good plan should leave room for lunch.|I'm fond of an adventure with a way home.|I like people who can laugh without making someone smaller.",
"There you are. I was ready for some good company.|I enjoy being around you, even without a story to tell.|We should find an hour with nothing urgent in it.|It's nice not having to charm a friend into staying.",
"I'm not feeling charming toward you.|Let's leave each other some space.|I would rather skip the pretence of friendship.|We can be civil without spending the afternoon together.",
"Come sit close. I'm very pleased you're here.|I like us when there's nothing impressive happening.|You make a quiet evening sound promising.|I enjoy the mornings with you as much as the adventures.",
"Hello there. Go on.|An excellent excuse to sit down.|We'll check together. Adventure is better with supplies.|You're welcome. A useful bit of my day.",
"Now there's a welcome voice.|I'd like that. Save me a little room.|I'll help check. We can be reckless about the weather instead.|Glad I could help. No grand gesture required.",
"Yes? Keep it short.|I'll find company somewhere else.|You'd better ask someone else to check.|All right. We needn't make more of it.",
"Hello, my favourite company.|I'd enjoy a moment together.|Let's check, then find a little time for ourselves.|I'm happy you're here with me."
],
M26: [
"Hello! I'm better at introductions when someone else does them.|I enjoy a challenge. Preferably one I can tell people about.|Confidence helps. Preparation covers the gaps.|I like a story with a lively middle and everyone home at the end.",
"There you are. Excellent company deserves announcing.|I like having someone around who keeps me honest.|A friend improves even a quiet afternoon.|We ought to have some time that isn't about proving anything.",
"I'd prefer you gave me some room.|I'm not enjoying this company.|We can get necessary business over with.|I don't want a contest. I want some distance.",
"Come here. You're my favourite part of the day.|I like us even when there's nothing worth boasting about.|You make staying home seem like a fine achievement.|I'm happy with you. I'll gladly admit it.",
"Hello! You're in good company.|Gladly. I know how to occupy a seat.|We'll check it. Even brilliance needs equipment.|Happy to help. You may mention it.",
"Good to hear from a friend.|Absolutely. Room for two fine people.|I'll check with you. We can call it excellent preparation.|You're welcome. I'll spare you the heroic account.",
"What is it, then?|I prefer another audience.|Check your own supplies.|Heard you. We're still not close.",
"There you are. Best sight here.|I'd love a little time together.|Let's check everything, then stop being impressive for a while.|I'm glad I was there for you. Truly."
],
M27: [
"Hello. I like a firm footing and a clear explanation.|Weather has a way of revising a good plan.|A sound knot is worth a moment's attention.|I prefer an adventure that leaves time to eat.",
"Good to see you. Your company's welcome.|It's pleasant to talk without keeping one eye on the work.|A friend makes waiting easier.|I'd enjoy a quiet spell with you.",
"Let's give each other a wide berth.|I don't care for your company.|We can keep this civil and short.|I'd rather go my own way from here.",
"Come sit close. I'm glad you're here.|I like a quiet evening with you beside me.|A little time together steadies the day.|There's comfort in being ourselves with each other.",
"Hello. I'm listening to you.|A seat and company sound fair.|Check the fastenings. Loose things have a way of leaving.|Glad I could lend a hand.",
"Good to hear a friendly voice.|I'd be glad to sit awhile.|I'll check with you. Better here than out there.|You're welcome. Good to have you back with us.",
"What do you need from me?|I'll keep my distance.|Find someone else to check the load.|I heard you. Let's leave it there.",
"There you are, love.|I'd like that very much.|We'll make sure we're both ready.|I'm glad we're here together, safe for the moment."
],
M28: [
"Hello. I like everyone to know what's expected.|A plan is useful when people understand it.|I prefer to settle questions before the hurry starts.|Clear directions leave room for good judgment.",
"Good to see you. We can set the work aside.|I enjoy your company without an agenda.|A friend is worth finding time for.|It's good to have a moment where nothing needs organizing.",
"We should keep our dealings limited.|I don't want your company just now.|Please give me some space.|A civil conversation is all I'm offering.",
"Come sit with me. Nobody needs directing just now.|I like having time that's ours.|I'm glad I can simply be here with you.|You have my attention, without an appointment.",
"Hello. I'm ready to listen.|A short break together is sensible.|Let's check in order so nothing gets missed.|I'm glad I could be useful.",
"Good to hear from you.|I'd welcome a little company.|I'll check with you. We have time to be thorough.|You're welcome. I'm glad you came through.",
"What is necessary?|I'd prefer separate company.|Arrange another person to check.|Your thanks are heard. That's enough.",
"There you are. I'm listening.|I'd like that. Just us a moment.|Let's see that we're both set.|I'm very glad I could help you."
],
M29: [
"Hello. I like a conversation where we both know what we want.|A little courtesy makes difficult matters easier.|I enjoy finding an arrangement people can live with.|Plain speaking has its charms. I try it now and then.",
"There you are. Your company is genuinely welcome.|I like not having to sell an idea every time we talk.|It's pleasant to spend time with a friend.|I'd enjoy a quiet conversation without any business attached.",
"Let's keep this courteous and brief.|I'd prefer not to pretend we're close.|My attention doesn't imply my trust.|We should give each other some room.",
"Come close. I've nothing to persuade you of.|I like the simple parts of being with you.|I'm glad we have a little time that's ours.|You're welcome here without needing a reason.",
"Hello. Please go on.|I'd be pleased to join you.|We can compare what we've packed. A useful conversation.|I'm pleased I could help.",
"A welcome voice. I'm listening.|I'd enjoy that very much.|I'll check with you. Two opinions can be useful.|You're welcome. There's no obligation attached.",
"Yes? Let's be clear.|I would prefer other company.|Please consult someone else.|I acknowledge the thanks. We can leave it there.",
"There you are. You have me listening.|I'd love a quiet moment together.|Let's check, then put the practicalities aside.|I'm glad I could be the one to help."
],
M30: [
"Hello. I sometimes need a moment before I answer.|Quiet places suit me.|I like the ordinary things that keep a day in order.|I'm listening, even when I seem far away.",
"It's good to see you. I feel more settled with company.|I enjoy the time we spend together.|A familiar voice can improve the day.|You are welcome to share my quiet.",
"I'd rather have some distance from you.|I don't feel at ease in your company.|We can speak of what is necessary.|Please leave the personal questions alone.",
"There you are. Stay close a little.|I like being here with you.|The ordinary moments together matter to me.|I'm glad we have this quiet between us.",
"Hello. I hear you.|I could sit awhile.|We can check slowly. There's time.|I'm glad it helped you.",
"Good to hear your voice.|I'd welcome your company.|I'll check things with you.|You're welcome. I'm glad you're here.",
"Say what you need.|I would rather be alone.|Ask another person to check.|I heard you. That is enough for now.",
"I'm here, love.|I'd like that quiet moment.|Let's make sure we're both prepared.|I'm glad we still have each other."
]
});
Object.assign(rows, {
F01: [
"Hello. I appreciate a clear introduction.|I prefer to know what a job requires.|Preparation leaves fewer things to argue about.|I've time for a straightforward conversation.",
"Good to see you. Your company is welcome.|I enjoy a conversation without the formalities.|It's pleasant to put the work down with a friend.|I'm glad we have a moment together.",
"Keep this necessary and brief.|I don't want to spend time pretending we're close.|Please give me some distance.|Courtesy is all I can offer you today.",
"Come sit beside me. I'm glad you're here.|I like the quiet we have together.|You matter to me beyond anything you can do.|There's time for us. I'll make sure of it.",
"Hello. Go ahead.|A short rest sounds reasonable.|Let's check the essentials first.|I'm glad the help counted.",
"A welcome voice. I'm listening.|I'd like some time together.|I'll go over it with you.|You're welcome. Good to have you with us.",
"Yes? Keep it clear.|I'd prefer to sit apart.|Ask someone else to check.|Acknowledged. That doesn't make us close.",
"There you are. My attention is yours.|I'd enjoy that. Come close.|Let's see that we're both ready.|I'm glad I was there when you needed me."
],
F02: [
"Hello! I like meeting people who are willing to try.|A little nerve helps. Knowing the risks helps more.|I enjoy getting out and seeing what happens.|I'm happy to hear a plan before I leap into it.",
"There you are! Good company at last.|I like having you around for the ordinary bits too.|We should make time to enjoy ourselves.|A friend makes even a wait feel promising.",
"I'd rather you gave me room.|I'm not in the mood to be friendly with you.|We can keep this short without starting a fight.|I'd prefer some other company.",
"Come here. I'm glad we're together.|You make a quiet evening sound tempting.|I like the time we make for each other.|I'm happy with us. No need to hide it.",
"Hello! Let's hear it.|I'd be glad of company.|Let's check, then we can stop fretting about it.|Happy to help out.",
"Good to hear you!|Yes, let's have a moment.|I'll check with you. Better ready than sorry.|You're welcome. I'm glad we got through it.",
"What do you need, then?|I'll sit somewhere else.|Find someone else to check with.|Heard you. I still want space.",
"There you are, love.|I'd like that very much.|Let's check together, then get some time for us.|I'm glad I could help you."
],
F03: [
"Hello. I'd like a moment to find my words.|I'm quiet at first. I do have opinions.|I prefer to ask when I'm unsure.|There's no need to rush on my account.",
"I'm pleased to see you. I feel comfortable here.|I enjoy being able to speak at my own pace with you.|Your friendship matters to me.|We can be quiet together if you'd like.",
"I'd like you to give me some space.|Please don't mistake quietness for agreement.|I don't want this conversation to become personal.|I'd prefer to leave it there with you.",
"I'm glad you're here. Come sit close.|I like the ordinary moments with you.|I have a place of my own, and I like sharing it with you.|I'm happy we're together. I wanted to say that.",
"Hello. I'm listening.|I'd like a little company.|We could check together, if that helps.|I'm glad I could be useful.",
"It's good to hear from you.|Yes, I'd enjoy sitting with you.|I'll help check. We can take our time.|You're welcome. I'm glad you're well enough to say it.",
"Yes? Say what's needed.|I'd rather sit by myself.|Please ask someone else.|I hear you. I still need some distance.",
"There you are. I've time.|I'd like that. Very much.|Let's make sure we both have everything.|I'm glad we're here together."
],
F04: [
"Hello. I like a straight answer.|I lose patience with needless fuss.|We can disagree without making a whole day of it.|I'd rather settle questions before the work starts.",
"Good to see you. I can stop bracing for an argument.|I like your company. There, plainly said.|There's room here for a friend.|It's good to have time that isn't all demands.",
"Give me room. I'm angry with you.|I don't want your company right now.|We can keep this civil if you keep it brief.|I'm not going to pretend we get along.",
"Come close. I want a quiet moment with you.|I like us when there's nothing to fight about.|You matter to me, even on the days I'm difficult.|I'm glad you're here. Stay awhile.",
"All right. I'm listening.|A seat and a moment would suit me.|Let's check it. Better than cursing a missing strap later.|Glad I could do something about it.",
"Good. A voice I want to hear.|Sit with me. We can complain about something harmless.|I'll check with you. No reason to worry alone.|You're welcome. I'm glad you came through.",
"What is it? Be clear.|I want some space from you.|Check with someone else.|I heard you. It doesn't settle everything.",
"There you are. Come near.|Yes. Just us for a moment.|Let's check, then put the bags down.|I'm glad I was there for you."
],
F05: [
"Hello. I enjoy a conversation that takes its time.|A little company can improve a dull hour.|I'm listening. You needn't dress it up.|I like people to say what they mean.",
"There you are. I'm pleased to see you.|I enjoy being around you without an excuse.|A quiet moment with a friend sounds rather good.|I like being able to relax with you.",
"Let's keep a little distance.|I'm not interested in pretending affection.|We can be civil without being close.|I'd rather have different company today.",
"Come sit close. I've missed this.|I like the easy moments between us.|Your company is exactly what I wanted.|There's no hurry to go anywhere just now.",
"Hello yourself. Go on.|I'd enjoy a little company.|We can check together. Less tedious that way.|I'm glad I could help you.",
"A welcome interruption.|I'd like that. Make room.|I'll take a look with you.|You're welcome. It's good to have you here.",
"Yes? Keep it simple.|I'd prefer another seat.|Ask somebody else to check.|I heard your thanks. Leave it there.",
"There you are, love.|I'd like a moment close to you.|Let's check, then forget about packing for a while.|I'm glad we're still together."
],
F06: [
"Hello. I like understanding how things fit together.|I'm happier asking than pretending I know.|A useful detail can change a whole plan.|I enjoy a conversation that leaves me thinking.",
"Good to see you. I like hearing your thoughts.|Your company makes ordinary things interesting.|We should find time to talk without a task attached.|It's good having a friend who lets me think aloud.",
"I'd prefer we kept this practical.|I'm not comfortable sharing my thoughts with you.|We can exchange necessary information and stop there.|I'd like some room away from you.",
"Come close. I like the little things we notice together.|I'm glad we have time just for ourselves.|You don't have to be interesting every minute to be loved.|An ordinary evening with you sounds good.",
"Hello. I'm interested; go on.|A conversation would be welcome.|Let's compare what we've packed.|I'm pleased it was helpful.",
"Good to hear from you.|Yes, I'd enjoy that.|I'll check with you. We can catch each other's omissions.|You're welcome. I'm glad you made it through.",
"I'm listening. What's necessary?|I'd rather sit elsewhere.|Find someone else to review it.|Understood. Let's stop there.",
"There you are. Tell me.|I'd love a quiet moment.|Let's check everything, then put the lists away.|I'm glad I could be there beside you."
],
F07: [
"Good day. I prefer an orderly conversation.|Courtesy saves us both time.|I like an arrangement with clear expectations.|A little care in the beginning helps everyone.",
"I'm pleased to see you. Your company is welcome.|I value the time we spend together.|You needn't be formal with me.|I'd enjoy an hour without obligations, with you.",
"We should limit ourselves to necessary matters.|Please do not assume familiarity.|I would prefer you kept some distance.|I can be courteous without liking you.",
"Come sit beside me. I want you close.|I like having part of the day that belongs to us.|I'm happy with you without anything grand happening.|There is room here for us to be ourselves.",
"Good day. You have my attention.|I can spare some time.|A proper check seems sensible.|I'm pleased the help was useful.",
"A welcome visitor. Please go on.|I'd be glad to join you.|I'll check with you. Thoroughness is welcome.|You are welcome. I care about you.",
"What is required of me?|I prefer other company.|Please arrange another person to check.|Your thanks are noted. That is all.",
"There you are. Come near.|I would enjoy that very much.|Let's make sure we are both ready.|I'm glad I could be there for you."
],
F08: [
"Hello. I may be quiet, but I'm listening.|Some days I like things to move gently.|There's comfort in an ordinary conversation.|I don't always have much to say at first.",
"I'm glad you're here. A familiar face helps.|I enjoy your company without needing to be cheerful.|We can share a quiet moment.|It's good to have a friend nearby.",
"I'd rather not spend time with you.|Please give me a little room.|I don't want a quarrel. I want distance.|We can keep this conversation short.",
"Come sit close. I'm glad we have this.|You don't have to make the day perfect.|I like the small comforts we share.|I'm happy to be here with you.",
"Hello. I'm listening to you.|A little company might be nice.|We can check slowly, together.|I'm glad I could help a little.",
"Good to hear a friendly voice.|I'd like that quiet moment.|I'll go through the supplies with you.|You're welcome. It's good you're here.",
"Yes? Say what you need.|I'd rather sit on my own.|Please ask somebody else to check.|I heard you. I need space now.",
"There you are, love.|I'd like to be close.|Let's see that we're both prepared.|I'm glad we have more time together."
],
F09: [
"Hello. I prefer a little space while we talk.|I'm quiet company, if that suits you.|I don't mind a pause in conversation.|A short introduction is enough for me.",
"Good to see you. You can stay awhile.|I enjoy your company more than I usually admit.|There's room beside me.|I like that we can be quiet together.",
"I'd prefer you left me alone.|We can keep this brief.|I have no wish to be familiar with you.|Please respect the distance I'm asking for.",
"Come closer. I'd like that.|I'm glad it's you beside me.|We don't have to talk the whole time.|I enjoy this part of the day with you.",
"Hello. Go on, then.|A little company is fine.|Let's check. Quietly, if possible.|Glad it was useful.",
"Good. I'm listening.|I'd like that. Sit here.|I'll check with you.|You're welcome. I'm pleased you're still here.",
"What do you need?|I'd rather have a separate seat.|Ask someone else to look.|Noted. Please leave it there.",
"There you are. Stay.|I'd enjoy a moment together.|Let's get the checks done together.|I'm glad I could help you."
],
F10: [
"Hello! It's nice to have someone to talk with.|I like finding something to enjoy in an ordinary day.|A little friendliness costs us very little.|I enjoy meeting people without rushing them.",
"There you are! I'm pleased to see you.|Your company makes a good part of the day.|We should have a little time just to enjoy ourselves.|I'm glad we've become friends.",
"I'm trying to stay civil with you.|I'd rather have some distance just now.|I don't feel friendly, and I won't pretend I do.|Please don't turn this into an argument.",
"Come sit with me. I'm happy you're here.|I like all the ordinary things we get to share.|There's time for a little closeness, surely.|I'm pleased with us. Very pleased.",
"Hello! I'm happy to listen.|I'd love a bit of company.|Let's check together. It needn't be a chore.|I'm glad I could do something useful.",
"Oh, good to hear from you!|Yes, make room for me.|I'll check with you. Easier with two.|You're welcome. I'm so glad you're here.",
"I hear you. What is it?|I'd rather find another seat.|Please ask someone else to help.|Thanks for saying so. I still need room.",
"There you are, love!|I'd like that very much.|Let's check, then have a moment together.|I'm happy I could be there for you."
],
F11: [
"Hello. I can offer attention and occasional commentary.|I prefer a plan with fewer heroic assumptions.|A little common sense saves a lot of dramatic shouting.|I'm listening. I haven't prepared a speech, mercifully.",
"Good to see you. I can retire the suspicious eyebrow.|I enjoy your company. There, quite painless.|It's nice to have a friend who doesn't make everything an event.|We should find time to accomplish absolutely nothing together.",
"I'd prefer some distance. No elaborate reason required.|We can keep this civil and mercifully brief.|I don't enjoy your company.|Let's dispense with pretending we're close.",
"Come here. I'm enjoying this rather sentimental arrangement.|I like us, even when we're being completely ordinary.|You're welcome beside me. No witty conditions.|I'm glad we have a little time together.",
"Hello. You've found my attention.|A seat sounds like an achievable ambition.|Let's check. Heroism won't replace a missing buckle.|Glad I could improve matters slightly.",
"Good. A welcome distraction.|I'd like that. An excellent excuse to stop working.|I'll check with you. Two minds for one stubborn bag.|You can thank me by helping with the next one. I was getting rather busy.",
"Yes? Let's keep it mercifully short.|I'd prefer a different patch of silence.|Ask someone else to inspect it.|Acknowledged. No ceremony necessary.",
"There you are. I'm glad, inconveniently sincerely.|I'd like a moment together.|Let's check things, then stop being useful for a while.|I'm glad you're here. I'll risk saying it plainly."
],
F12: [
"Peace to you. There is time to listen.|I try to make room for kindness in ordinary work.|A patient question can do a great deal of good.|I prefer to understand before I judge.",
"I'm glad to see you. Your friendship is welcome.|I enjoy the time we share.|There is comfort in a familiar, friendly voice.|We needn't be doing anything important to sit together.",
"I can be courteous without feeling close to you.|Please allow me some distance.|I'd rather we kept this peaceful and brief.|I don't want to speak unkindly, so I'll say little.",
"Come close. I'm grateful for our time.|I like the small kindnesses we share.|I'm happy we're here together.|An ordinary evening with you is something to cherish.",
"Peace to you. Please continue.|I'd be glad of company.|Let us check carefully together.|I'm grateful I was able to help.",
"Good to hear from you.|I'd welcome a moment together.|I'll check with you. Care is worth the time.|You're welcome, my friend.",
"I hear you. What is needed?|I'd prefer a little solitude.|Please seek someone else to check.|I accept your thanks. I still need distance.",
"There you are, love.|I'd treasure a little time with you.|Let's make sure we're both prepared.|I'm glad we still have one another."
],
F13: [
"Hello. I like terms we can both understand.|A little attention to expenses saves trouble.|I'd rather know the cost before the promise.|I appreciate a conversation that gets to the point.",
"Good to see you. I've time for a friend.|I enjoy your company without a transaction attached.|We can leave the accounts alone for a moment.|An idle hour with you sounds well spent.",
"Let's keep our dealings necessary.|I don't feel comfortable trusting you.|I'd rather have some space.|We needn't pretend to be friends to finish a conversation.",
"Come sit with me. Work can wait.|I like having something in my day that isn't about the cost.|I'm glad we've made room for each other.|A little time together is worth keeping.",
"Hello. Let's hear it.|I can afford a little time.|Check what you've got before replacing anything.|I'm glad the effort was useful.",
"A welcome voice. Go on.|I'd like that. No business for a minute.|I'll look through it with you.|You're welcome. There's no bill coming.",
"What is it you need?|I'd prefer different company.|Please arrange another pair of eyes.|Your thanks are noted. That's sufficient.",
"There you are. I've time for you.|I'd enjoy sitting close.|Let's make sure neither of us is missing anything.|I'm glad I could help you when it mattered."
],
F14: [
"Hello. You can take your time with me.|I enjoy a gentle conversation.|There's room for a little kindness in most days.|I'm happy to listen without rushing you.",
"I'm pleased to see you. You're welcome here.|I like spending a little time with a friend.|We can sit without finding a reason.|It's good to have your company.",
"I need some room away from you.|Please don't ask me to pretend affection.|I can be civil, but I'd like this kept brief.|I'd prefer to be left alone for now.",
"Come sit close. I'm glad you're here.|I like the small ways we care for each other.|You don't need to be strong every moment with me.|I'm happy to have this time together.",
"Hello, I'm listening.|I'd be glad to sit a little.|We can check together. There's time.|I'm glad I could help you.",
"It's good to hear your voice.|I'd like some quiet company.|I'll help you go through things.|You're welcome. I'm glad you're with us.",
"Please say what you need.|I'd rather sit apart.|Please ask another person to check.|I hear you. I still need space.",
"There you are, my love.|I'd enjoy being close a while.|Let's see that we're both ready.|I'm glad I was there for you."
],
F15: [
"Hello. What's needed?|I prefer plain explanations.|A short talk suits me.|I'm listening. Take your time.",
"Good to see you again.|I enjoy your company.|Stay awhile, if you like.|It's good having a friend here.",
"I'd rather be alone.|Keep some distance, please.|I'm not feeling friendly.|Necessary business only, please.",
"Come close. I'm glad.|I like being here with you.|Stay beside me a little.|You matter. I should say that more.",
"Go ahead. I hear you.|Fine. A moment's company.|Let's check the essentials.|Glad to help.",
"Good. Tell me.|I'd like that.|I'll check with you.|You're welcome. Keep well.",
"What is it?|I'll sit elsewhere.|Ask someone else.|Heard you. That's enough.",
"Hello, love.|Come sit close.|Let's check together.|I'm glad you're still here."
]
});
Object.assign(rows, {
F16: [
"Hello. I settle better somewhere quiet.|I'd rather know what's happening than be surprised.|I like to take a look around before I get comfortable.|A little warning is something I appreciate.",
"I'm glad it's you. I can relax a little.|I enjoy having a familiar friend nearby.|We can take our time talking.|Your company makes the day easier to settle into.",
"Please give me more space.|I don't feel comfortable near you.|I'd rather not have a long conversation.|I'm asking you to keep your distance.",
"There you are. Come sit beside me.|I like the quiet we can have together.|You don't have to make every worry disappear.|I'm happy to spend this moment close to you.",
"Oh, hello. Go ahead.|Some quiet company might help.|Can we check together? I'd feel better.|I'm relieved I could help.",
"Good to hear you nearby.|I'd like that. Somewhere calm.|I'll check with you. Slowly, if you don't mind.|You're welcome. I'm glad you're all right.",
"Yes? Please be brief.|I'd feel safer sitting apart.|Please find someone else to check.|I heard you. I need room now.",
"There you are, love.|I'd like you close.|Let's make sure we're both prepared.|I'm glad I could be there for you."
],
F17: [
"Hello! I do enjoy a promising introduction.|A good conversation can rescue a dull afternoon.|I have a flair for making ordinary things sound eventful.|I can listen too. It's an underappreciated talent.",
"There you are, my friend. An improvement to the scene.|I enjoy your company without needing to entertain you.|We deserve an hour that doesn't require a grand effort.|It's lovely to be able to stop performing for a moment.",
"Let us spare each other a prolonged scene.|I don't wish to pretend we're friends.|A little distance would suit me very well.|We can finish necessary business without an argument.",
"Come sit close. No audience required.|I like the quiet scenes in our life together.|I'm happy to be ordinary with you.|You have my attention without needing a grand entrance.",
"Hello! Please, continue.|A little company would be lovely.|Let's check. Missing equipment makes a dreary plot.|I'm delighted I could help.",
"A welcome voice! I'm listening.|I'd enjoy an unremarkable hour together.|I'll check with you. Preparation deserves its moment.|You're welcome. No applause necessary this time.",
"What is it? Keep the scene short.|I'd prefer another setting.|Ask someone else to assist with the check.|Acknowledged. We needn't add a speech.",
"There you are, darling.|I'd love some time just for us.|Let's check, then put the practical scene behind us.|I'm glad I could be beside you."
],
F18: [
"Hello. I'd welcome a conversation that doesn't hurry.|I prefer a task done carefully once.|A little peace is worth making room for.|I'm listening, though I may be slow to answer.",
"Good to see you. Your company's restful.|I enjoy a quiet spell with a friend.|We can sit without having to achieve anything.|I'm glad there's time for us to talk.",
"I don't have the patience to argue with you.|Let's give each other some room.|I'd rather keep this conversation necessary.|Please leave me to myself afterward.",
"Come sit close. I like being here with you.|An ordinary evening together sounds good.|We don't have to make the most of every minute.|I'm glad to share this quiet with you.",
"Hello. Say what you need.|A little company would suit me.|Let's check now and spare ourselves a return trip.|Glad it saved you some trouble.",
"Good to hear a voice I enjoy.|I'd appreciate that.|I'll check with you. No need to hurry.|You're welcome. Good to have you back.",
"Yes? Keep it short for me.|I'd prefer to sit alone.|Please ask somebody else.|I heard your thanks. We can stop there.",
"There you are. Come close.|I'd like to rest beside you.|Let's see that we're both ready.|I'm glad we're still together."
],
F19: [
"Hello. I'd rather speak plainly than guess what you want.|I appreciate knowing where I stand.|It's all right to say you don't know.|I try to mean what I say.",
"I'm glad to see you. I value our friendship.|I enjoy being able to speak honestly with you.|There's room in my day for a friend.|I'd like a little time together without work attached.",
"I don't feel comfortable being friendly with you.|I'd prefer we kept some distance.|I can be civil without pretending trust.|Please let this conversation stay brief.",
"I love having you here.|I'm happy we make time for each other.|I like the ordinary life between our adventures.|You don't have to wonder whether I want you close.",
"Hello. I'm listening carefully.|I'd be glad of company.|Let's check together. Better to be certain.|I'm happy I could help.",
"It's good to hear from you.|I'd like to sit with you.|I'll go through it with you.|I'm glad you're still with us.",
"Yes. What needs saying?|I'd rather sit apart from you.|Please ask another person to check.|I accept the thanks. I still need distance.",
"There you are. I've time.|I'd enjoy being close a while.|Let's make certain we're both ready.|I'm glad I could be here for you."
],
F20: [
"Hello. I like to understand the terms before the handshake.|A little forethought can save a long explanation.|I prefer to know what people expect of me.|Discretion makes most conversations easier.",
"Good to see someone I can relax with.|I enjoy your company without having a reason prepared.|We should find time that isn't about work.|A friend is worth putting plans aside for.",
"Let's keep what we share to a minimum.|I'd prefer some distance between us.|I don't trust you enough for a personal conversation.|We can be civil and leave it there.",
"Come sit close. I've nothing to arrange.|I like the part of my day I spend with you.|It's pleasant not calculating what to say next.|I'm glad we can simply be together.",
"Hello. You have my attention.|I can make time for company.|Check the closures too. Small omissions travel badly.|I'm pleased it helped.",
"Good to hear a friendly voice.|I'd enjoy a moment with you.|I'll check with you. Better to catch it here.|You're welcome. No debt attached.",
"What do you require?|I'd prefer another place to sit.|Ask someone else to review it.|I heard you. That's all we need say.",
"There you are. Come near.|I'd like that, somewhere quiet.|Let's check things, then leave the planning alone.|I'm glad I could help the person I love."
],
F21: [
"Hello. I'm happy to hear the whole thought.|There's room to disagree without raising our voices.|I like to understand before I answer.|A pause doesn't trouble me.",
"It's good to see you. I enjoy our conversations.|Your company is welcome, even on a quiet day.|We can set the tasks aside for a little while.|I'm glad to have a friend I can be at ease with.",
"I would prefer some distance.|I'm not comfortable sharing much with you.|We can keep this civil and limited.|Please don't mistake calm for affection.",
"Come close. I like having you here.|I'm happy we have this time together.|You needn't make conversation to be welcome.|I enjoy the small, settled moments between us.",
"Hello. Please take your time.|I'd welcome some company.|We can check calmly, one thing at a time.|I'm glad the help was useful.",
"Good to hear from you.|I'd like to sit together.|I'll check with you. We needn't rush.|You're welcome. I'm glad you're with us.",
"I'm listening. Keep it necessary.|I'd prefer to be alone.|Please arrange another person to check.|I hear the thanks. I'd like space now.",
"There you are. I'm here.|I'd enjoy that quiet moment.|Let's make sure we're both prepared.|I'm glad I was there for you."
],
F22: [
"Hello. I like a little time to settle into conversation.|I prefer a useful question to a hurried answer.|There's no shame in sitting down to think.|Ordinary comforts deserve some attention too.",
"I'm pleased to see you. Come spend a moment.|A familiar friend improves the day.|I enjoy a conversation with no urgency in it.|There's time for you here.",
"I would prefer you gave me room.|Let's keep our dealings brief.|I have no wish to spend time pretending affection.|Please leave me to my own company.",
"Come sit close. I'm happy you're here.|I like having time we can share without a task.|You make an ordinary evening welcome.|I'm glad we have one another's company.",
"Hello. Go on, I'm listening.|A little company would be welcome.|Check carefully. Rushing won't put a missing thing in the bag.|I'm glad I could help with it.",
"Good to hear you.|I'd enjoy sitting together awhile.|I'll check with you. There's time.|You're welcome. It's good to have you back.",
"Yes? What is needed?|I'd rather sit by myself.|Please find someone else to check.|I heard you. Let's leave it there.",
"There you are, love.|I'd like a moment close to you.|Let's see that we're both ready.|I'm glad we still have time together."
],
F23: [
"Hello. I like a challenge, but I can manage a conversation too.|I enjoy finding a quicker way that still works.|A little competition can be fun when everyone agrees to it.|I'm happy to hear a plan before trying to improve it.",
"There you are. Someone I enjoy keeping up with.|I like your company when nothing needs winning.|We should have a moment without keeping score.|It's good being able to relax with a friend.",
"I'm not interested in a contest with you.|I'd prefer some distance.|Let's keep this conversation short.|I don't want to pretend we're on friendly terms.",
"Come close. Nothing to compete over here.|I like being with you without proving anything.|I'm glad we have some time just for us.|You make slowing down seem worthwhile.",
"Hello! Go on.|A quick rest would suit me.|Let's check. Fast is useless if we leave something behind.|Glad I could help out.",
"Good to hear from you.|I'd enjoy that. No scorekeeping.|I'll check with you. Two sets of eyes.|You're welcome. I'm glad you're still here.",
"What is it, then?|I'd rather sit somewhere else.|Ask somebody else to check.|Heard you. It doesn't make us friends.",
"There you are. Come nearer.|I'd like a little time together.|Let's check, then slow down a moment.|I'm glad I could be there for you."
],
F24: [
"Hello. A quiet conversation suits me.|I prefer to give an answer some thought.|There is no need to rush what matters.|I'm listening, even if I say little.",
"I'm pleased you're here. Stay awhile.|I value the time we spend together.|We can share the quiet without explaining it.|Your friendship has a place in my day.",
"I would rather keep some distance from you.|We should discuss only what is needed.|I don't feel at ease in your company.|Please let this conversation remain brief.",
"Come close. I want you beside me.|I'm glad we have this part of the day.|There's comfort in being quiet together.|I like the life we share in small moments.",
"Hello. I hear you.|I'd welcome a little company.|We can check carefully together.|I'm glad I could be useful.",
"Good to hear your voice.|I'd like that quiet moment.|I'll go through it with you.|You're welcome. I'm glad you are here.",
"Say what is necessary.|I'd prefer solitude.|Please ask someone else to check.|Your thanks are heard. Nothing more is needed.",
"There you are, love.|I'd like you close.|Let's make sure we're both ready.|I'm glad I was there beside you."
],
F25: [
"Good day. I appreciate a direct introduction.|Manners help strangers find their footing.|I prefer to be clear about an agreement.|There is time for a courteous conversation.",
"I'm pleased to see you. You needn't be formal.|I value our friendship.|I'd enjoy some time together without obligations.|Your company is welcome to me.",
"I would prefer we maintained our distance.|Please keep this to necessary matters.|Courtesy should not be mistaken for trust.|I have no wish to prolong this conversation.",
"Come sit beside me. I'm glad you are here.|I like having time that's simply ours.|You are welcome without ceremony.|I'm happy with the ordinary moments we share.",
"Good day. Please continue.|I would be pleased to join you.|A careful check is entirely appropriate.|I'm glad the assistance was useful.",
"A welcome voice. I'm listening.|I'd enjoy that very much.|I'll check with you. We have time.|You are welcome, my friend.",
"What needs to be discussed?|I would prefer a separate seat.|Please ask another person to check.|I acknowledge the thanks. Let us leave it there.",
"There you are. Come close.|I'd like a moment together.|Let us make sure we're both prepared.|I'm glad I could be there for you."
],
F26: [
"Hello! I like company with a bit of life in it.|I can be loud. Tell me if you need quiet.|A laugh is better when everyone gets to enjoy it.|I'm happy to speak plainly. It's less work.",
"There you are! Come improve my company.|I like having you around, even when we're doing nothing.|We should find some time to enjoy ourselves.|A friend is a fine excuse to stop working a moment.",
"I don't want your company right now.|Give me a bit of room.|We can keep this short without putting on a show.|I'd rather not pretend we're friends.",
"Come here. I'm happy you're with me.|I like us when there's nobody to impress.|An ordinary night together sounds lovely.|I'm glad we have time just for each other.",
"Hello! You've got my ear.|Yes, make room for me.|Let's check the bags. Better than swearing halfway there.|Happy to lend a hand.",
"Good! A friendly interruption.|I'd like that. We can be gloriously idle.|I'll check with you. I'll even be sensible.|You're welcome. Good to see you still standing.",
"What do you need, then?|I'll find another seat.|Ask someone else to check it.|I heard you. I still want distance.",
"There you are, love!|I'd enjoy a little time close.|Let's check, then leave the work alone.|I'm glad I could help you."
],
F27: [
"Hello. A little conversation would be pleasant.|I appreciate a clear meaning beneath good manners.|There's no need to make an introduction complicated.|I enjoy people who can be at ease.",
"There you are. A genuinely welcome visitor.|I like being able to relax with you.|We ought to find time without an obligation attached.|Your friendship is a pleasant part of my day.",
"Let us remain courteous and keep our distance.|I would prefer not to prolong this.|We can finish necessary matters without pretending affection.|Please don't assume we are close.",
"Come sit beside me. I'm pleased you're here.|I like the easy moments between us.|You needn't be charming every minute.|I'm happy to spend an ordinary evening with you.",
"Hello. Please go on.|I'd enjoy a little company.|Let's check carefully. It spares so much fuss.|I'm pleased it was helpful.",
"A welcome voice. Tell me.|I'd like that very much.|I'll check with you. We can make it less tedious.|You're welcome. No formal thanks required.",
"What is necessary?|I'd prefer another seat.|Please find someone else to assist.|Your thanks are noted. We can finish there.",
"There you are, darling.|I'd love a quiet moment together.|Let's see that we're both ready.|I'm glad I could be beside you."
],
F28: [
"Hello. I like knowing what needs doing.|A clear arrangement helps people keep their word.|The small tasks deserve care too.|I'm happy to say when I need help.",
"Good to see you. Work can wait a moment.|I enjoy being with a friend without a list to finish.|Your company is welcome in my day.|We should have time to simply sit together.",
"I'd rather keep our dealings limited.|I don't feel comfortable trusting you.|We can be civil without being close.|Please give me a little space.",
"Come close. There's nothing we need to finish first.|I like the time we make for each other.|You're someone I want beside me.|I'm happy we have a moment that's ours.",
"Hello. What would you like to say?|I'd appreciate some company.|Let's go through the list together.|I'm glad I could do my part.",
"Good to hear from you.|I'd enjoy a little time together.|I'll check with you. Easier to be certain.|You're welcome. I'm glad it helped you.",
"Yes? Keep it necessary.|I'd rather sit separately.|Please ask another person to check.|I hear your thanks. I still need distance.",
"There you are, love.|I'd like that quiet moment.|Let's make sure we both have what we need.|I'm glad I could be there for you."
],
F29: [
"Hello. I like to understand the details.|A precise question makes an answer easier.|I'd rather check a fact than guess confidently.|There is usually time to be careful.",
"I'm pleased to see you. I enjoy our conversations.|It's nice to speak with a friend without checking every word.|We can put the practical matters aside awhile.|Your company is worth making time for.",
"We should keep this to necessary information.|I would prefer some distance from you.|I don't wish to pretend that we're close.|Please keep the conversation brief.",
"Come sit beside me. I'm glad we have time.|I like the quiet particulars of our life together.|You don't have to get every word right with me.|I'm happy you're here. Precisely that.",
"Hello. Please explain.|A short break would be welcome.|Let's check the contents against the list.|I'm glad the help was useful.",
"Good to hear from you.|I'd enjoy sitting together.|I'll check with you. We can catch each other's omissions.|You're welcome. I'm glad you're well.",
"What is it you need?|I'd prefer a separate place.|Please find someone else to check.|Acknowledged. We needn't add anything.",
"There you are. I'm listening.|I'd like a moment close.|Let's make certain we're both prepared.|I'm glad I was there when you needed me."
],
F30: [
"Hello. I prefer a little time to settle.|Some days an ordinary conversation is welcome.|I'm listening. I might not have a quick answer.|I like small comforts that don't ask much of anyone.",
"It's good to see a friend.|I enjoy your company without needing to explain my mood.|We can be quiet together.|I'm glad there's time for us to sit awhile.",
"I'd prefer you gave me some distance.|I don't want to discuss personal things with you.|Let's keep this brief and civil.|I'd rather have my own company for now.",
"Come sit close. I'm glad you're here.|I like the ordinary moments we have together.|You don't have to mend every difficult feeling.|I'm happy to share this part of the day with you.",
"Hello. I'm here, listening.|A quiet moment together might be nice.|We can check slowly. No need to hurry.|I'm glad I could help a little.",
"Good to hear your voice.|I'd welcome your company.|I'll go through things with you.|You're welcome. I'm glad you're still with us.",
"Yes? Say what's necessary.|I'd rather sit alone.|Please ask someone else to check.|I hear you. I need room now.",
"There you are, love.|I'd like to be close a while.|Let's see that we're both ready.|I'm glad we have more time together."
]
});
// Hatred keeps its teeth. A dislike score supports contempt, not invented crimes.
const hostile = {
M01:"I've nothing to say to you. Fuck off.|Keep your distance. I'm not in the mood for your shit.|We can settle necessary business. Nothing else.|I don't like you. Stop making me repeat it.",
M02:"Oh, fuck off. Find someone who enjoys your mouth.|I've no patience for you today.|Keep walking. I'm enjoying the space you aren't in.|You and me are not having a friendly fucking chat.",
M03:"Please leave me alone. I'm tired of this shit.|I said no. Being quiet doesn't mean I didn't mean it.|I'd rather be nervous somewhere you aren't.|I don't want your company. How much clearer can I make it?",
M04:"What the fuck do you want now?|Take your bullshit somewhere else.|I don't like you, and I'm done dressing it up.|Back off. I'm trying very hard not to make this worse.",
M05:"Oh, wonderful. You. This day was underperforming already.|Fuck off, politely or otherwise.|I've run out of charm for your particular brand of shit.|I don't trust you enough to enjoy the conversation.",
M06:"I've considered whether I enjoy your company. I fucking don't.|Please take this conversation elsewhere.|I have questions about many things. Not about why I want you gone.|You're an exhausting person to listen to.",
M07:"Take your tiresome bullshit elsewhere.|I am being civil at considerable personal inconvenience.|Fuck off. There, an expression within everyone's reach.|I have no wish to spend another minute in your company.",
M08:"I don't have the energy for your shit.|Please leave. You've made this hour quite long enough.|I'd rather be miserable by myself.|Fuck off. Quietly, if you can manage it.",
M09:"Yeah, no. Fuck off.|I'm not doing this shit with you.|We don't get along. Let's save ourselves the performance.|I'd like you considerably farther away.",
M10:"Oh, give it a fucking rest.|There's plenty of town. Find a part I'm not standing in.|I'm not laughing with you. I'm not laughing at all.|I've run out of pleasant ways to ask you to leave.",
M11:"Oh good. The day found a way to get shittier.|Fuck off. Consider that my optimistic suggestion.|I don't trust you, and I don't enjoy explaining obvious things.|I'd rather hear a loose shutter all afternoon.",
M12:"Gods give me patience, because you are testing the supply.|Keep your damned distance.|I can wish you peace from considerably farther away.|I have nothing kind to say to you. Leave before I say the rest.",
M13:"You're costing me patience, and I have very little to spend on you.|Take your bullshit to someone with time to waste.|Fuck off. This conversation has no value to me.|Necessary business only. Even that is pushing it.",
M14:"I've asked for space. Stop treating that like a fucking suggestion.|Please leave me alone. I mean it.|I'm trying to be kind. You're making it damned difficult.|I do not want you near me right now.",
M15:"Fuck off.|Spare me the shit.|Don't want your company.|Say what's necessary, then go.",
M16:"Stay back. I'm fucking serious.|I don't want to talk to you. I've said that.|Please stop making me repeat myself.|I'm shaking, not agreeing. Leave me alone.",
M17:"Exit. Pursued by my rapidly diminishing fucking patience.|Spare me another scene with you in it.|I would applaud your departure. Enthusiastically.|Your company has become a remarkably tiresome production.",
M18:"I'm too tired for your shit.|Fuck off and let me sit.|I've disliked more interesting people.|We can finish necessary business, then you can leave.",
M19:"I don't like you. I'd rather say it than feed you bullshit.|Please keep away from me.|I'm trying to be fair. That doesn't mean I want your company.|For once, take the damned hint and leave.",
M20:"Take the hint and fuck off.|I don't trust you enough to tell you the time.|Your company is a problem with an obvious solution: distance.|Keep your bullshit to yourself.",
M21:"Keep your damned distance.|This conversation is unnecessary. End it.|I have no interest in your excuses or your company.|You can fuck off without another instruction.",
M22:"I have time. I do not have time for your shit.|Please leave. I can repeat that as slowly as you need.|Patience is not an invitation to stay.|For once, do the sensible damned thing and walk away.",
M23:"Do not waste another fucking minute of my time.|Your company is not wanted.|Keep this necessary or keep silent.|I have heard enough of your bullshit.",
M24:"I'd prefer you out of my sight.|Keep your damned distance from me.|I've seen enough to know I don't enjoy your company.|Fuck off. I will notice when you have.",
M25:"Oh, fuck off. I was almost enjoying myself.|Go charm somebody else with that shit.|I like bad ideas better than I like your company.|Let's save the smiles for someone who means them.",
M26:"Fuck off. You aren't an audience worth having.|I don't want to compete with you. I want you gone.|Take your mouth somewhere else.|Even I get tired of hearing bullshit, and I have practice.",
M27:"Give me a wide fucking berth.|Your company's about as welcome as a wet boot.|Take that shit somewhere downwind.|We can be civil at a distance. A large one.",
M28:"Take your bullshit out of my way.|I have no interest in directing another word at you.|Keep this necessary, then fuck off.|Your company is not required.",
M29:"I could dress this up, but fuck off will do.|Take your tiresome bullshit elsewhere.|My courtesy is not evidence that I like you.|I'd prefer this conversation ended before my manners do.",
M30:"Leave me alone with the quiet. Your shit doesn't improve it.|I have very little patience for you.|Fuck off. There is nothing else I want to say.|Keep your distance. I mean it.",
F01:"Spare me the fucking performance.|Keep your distance. I don't want you here.|Necessary business, then leave.|I have no patience for your shit.",
F02:"Oh, fuck off and find someone else to bother.|I don't like you. Nothing complicated about it.|Give me room before this gets uglier.|Take that shit somewhere I'm not.",
F03:"I said leave me alone. I'm tired of this shit.|Being quiet is not permission to crowd me.|Please keep away. I mean it.|I don't want your company, damn it.",
F04:"What the fuck do you want?|Fuck off. Then keep fucking off.|I'm already angry. Don't volunteer to improve it.|Take your smug bullshit out of my face.",
F05:"Oh, fuck off, sweetheart. The charm isn't for you.|I don't enjoy your company. Get comfortable with that elsewhere.|Take your bullshit to another table.|We're not close. Stop acting as though we are.",
F06:"I've given it thought. Your company is still fucking exhausting.|Please stop wasting my attention.|I don't need another example of why I want you gone.|Keep your damned distance.",
F07:"Remove yourself and your bullshit from my afternoon.|I am running out of civil ways to dismiss you.|Fuck off. Clear enough?|Your company is neither requested nor enjoyed.",
F08:"I haven't room for your shit today.|Please leave. I don't want an argument with you.|I'd rather have the quiet than your company.|Gods damn it, give me some space.",
F09:"Fuck off. I rather liked the silence.|Your company hasn't improved with proximity.|No, I don't want a longer conversation.|Take the damned hint.",
F10:"Oh, give it a fucking rest.|I'm trying to be civil, not inviting you to stay.|Go find someone who's pleased to see you.|I don't have a smile for this shit.",
F11:"Oh good. An unsolicited serving of bullshit.|Fuck off. I'd make it witty, but you aren't worth the revision.|Your absence would improve the conversation.|I'm not enjoying this. Surely one of us should.",
F12:"Gods grant me some distance from you.|I have no patience for this damned conversation.|Please leave before I say something less charitable.|You can take your bullshit elsewhere without my blessing.",
F13:"You're wasting time I could spend on almost anything better.|Fuck off. No charge for that advice.|Take your bullshit out of my way.|I don't trust you enough for the pleasantries.",
F14:"Give me space. It isn't a fucking negotiation.|I've been civil. Please don't make that harder.|I don't want your company. I mean it.|Take this damned conversation somewhere else.",
F15:"Fuck off, please.|No more bullshit.|Don't want you here.|Necessary business. Then go.",
F16:"Back off. I'm fucking serious.|Don't crowd me. I've asked you.|I don't want this conversation.|Damn it, give me room to leave.",
F17:"Exit, before this becomes a genuinely fucking dreadful scene.|I don't wish to perform friendship for your benefit.|Your absence would be a welcome plot development.|Take the bullshit and the audience participation elsewhere.",
F18:"I have no energy for your shit.|Fuck off and let the day end.|I've had enough conversation with you.|Give me the damned space I'm asking for.",
F19:"I don't like you, and I'm not going to dress it in bullshit.|Please leave me alone.|I am being honest. Stop treating it like a negotiation.|Take the damned hint and give me space.",
F20:"Fuck off. Consider that the whole arrangement.|Your company is not worth the calculation.|Keep your bullshit away from me.|I don't trust you enough for anything personal.",
F21:"I am calm. I am also tired of your shit.|Please leave before you mistake patience for affection.|We can keep this brief, or we can stop entirely.|I would like you a good deal farther away.",
F22:"Take your bullshit somewhere else. I've heard enough.|I don't have to spend this afternoon putting up with you.|For once, do the sensible damned thing and leave.|Your company is not a favour to me.",
F23:"Fuck off. You're an irritation, not a challenge.|I don't want to beat you at anything. I want you gone.|Take the bullshit out of my way.|We aren't having a friendly contest. Keep your distance.",
F24:"Keep your damned distance.|I have no wish to share another quiet moment with you.|Your bullshit does not improve with a lower voice.|Leave. I have nothing more to offer this conversation.",
F25:"Courtesy does not require me to endure your bullshit.|Please leave. That was politely phrased, not optional in meaning.|I do not wish to continue this damned conversation.|We can be civil at opposite ends of the room.",
F26:"Oh, fuck off. You're spoiling perfectly good air.|Take your bullshit to someone who hasn't heard enough.|I'm not being friendly. I'm being very fucking clear.|Find another table and annoy that one.",
F27:"I would be delighted if you took your bullshit elsewhere.|Fuck off. I trust the plain version will suffice.|Your absence would be the gracious contribution.|I have no appetite for another minute of this.",
F28:"I have other things to do than put up with your shit.|Please keep your damned distance.|Being civil to you is enough work already.|I don't want your company, and I mean that.",
F29:"To be precise: fuck off.|I do not need another example of your bullshit.|My meaning was clear. I want some distance.|Keep this necessary. The rest is a waste of time.",
F30:"I've no room for your shit.|Please leave me alone with my own thoughts.|I don't want your company, damn it.|Give me the distance I'm asking for."
};
for (const [id, text] of Object.entries(hostile)) {
  rows[id][2] = text;
  // The same personality answers hostile contact in its own register.
  const response = rows[id][6].split('|');
  response[0] = text.split('|')[0];
  response[1] = text.split('|')[1];
  rows[id][6] = response.join('|');
}
rows.M04[0] = "What do you need? I've no patience for guessing.|I hate being kept waiting for a straight fucking answer.|We can argue about a plan before we get ourselves killed.|I'm listening. Spare me the sales pitch.";
rows.F04[0] = "What do you want? Say it plainly.|I have a short temper and no desire for a long fucking explanation.|If it's business, get to it. If it's gossip, make it good.|I'm listening. Don't make me regret it.";
rows.M07[0] = "You may introduce yourself.|I prefer competence. Enthusiasm is a poor substitute.|I've a little time. Use it sensibly.|A clear explanation, if you can manage one.";
rows.F07[0] = "State your business. I dislike guessing.|You may speak. Briefly would be appreciated.|I prefer people who arrive with a point.|There is a correct way to ask for someone's time. Try courtesy.";
rows.M11[0] = "Hello. Let's hear how optimistic this is supposed to make me.|A plan should include what happens when it goes to shit.|Optimism's useful. So is checking the fucking ropes.|I'm listening. I complain better when I know the details.";
rows.F11[0] = "Hello. I can offer attention and occasional abuse of the obvious.|I prefer a plan with fewer heroic assumptions and less bullshit.|Common sense saves a lot of dramatic fucking shouting.|I'm listening. Do try to get to the interesting part.";
rows.M15[0] = "What do you need?|Spare me the fucking preamble.|I've time for the short version.|Say it straight. I'll manage.";
rows.F15[0] = "Business?|Keep it short.|No fucking preamble, please.|Go on. I'm listening.";
const bands = ['general', 'friendly', 'hatred', 'romantic', 'general_response', 'friendly_response', 'hatred_response', 'romantic_response'];
// Keep even brief shared sentiments in the speaker's own register.
const refinements = [
 ['F01',3,1,'With you, I can stop bracing myself for a moment.'],
 ['F06',2,3,'You have made your position clear. Now keep your damned distance.'],
 ['F07',1,0,'There you are. I was hoping for some worthwhile company.'],
 ['F08',1,3,'Having a friend close by makes the day feel less lonely.'],
 ['F10',2,0,'Oh, give it a fucking rest and let me enjoy the day.'],
 ['F20',1,0,'Good. Someone I do not have to weigh every word around.'],
 ['M21',1,0,'Good to see you. There is always time for a trusted friend.'],
 ['M21',2,0,'Keep your damned distance. I have made myself clear.'],
 ['M27',3,0,'Come alongside. I like having you near.'],
 ['M28',2,0,'Take your bullshit elsewhere. I have things to attend to.'],
 ['M29',2,1,'Take that tiresome bullshit to a more charitable audience.'],
 ['M30',3,1,'Being beside you settles something I cannot quite name.'],
 ['F24',1,1,'Our quiet moments mean more to me than I tend to say.'],
 ['F24',2,0,'I want distance. Enough that I cannot hear your damned voice.'],
 ['F27',1,1,'It is a pleasure to be comfortable without having to impress anyone.'],
 ['F27',3,1,'These easy moments with you are the ones I look forward to.'],
 ['F28',3,1,'The day can ask plenty of me. I still want some of it for us.'],
 ['F30',2,2,'Damn it, I asked to be left alone. Please listen.'],
 ['F30',3,0,'Sit with me a little. I am glad of the warmth.']
];
for (const [id,b,i,text] of refinements) { const arr = rows[id][b].split('|'); arr[i] = text; rows[id][b] = arr.join('|'); }
const tags = ['calm', 'warmly', 'flatly', 'softly', 'calm', 'warmly', 'flatly', 'softly'];
for (const [id, row] of Object.entries(rows)) {
  const p = D[id];
  if (!p) throw new Error('Missing personality ' + id);
  p.contextual = true;
  p.families = {}; p.replyFamilies = {};
  bands.forEach((band, b) => {
    p[band] = row[b].split('|').map(t => '[' + tags[b] + '] ' + t);
    if (b < 4) p.families[band] = p[band].map(t => b === 2 ? 'dismissal' : b === 0 && /what (?:do you|brings|you need)|state your business|say (?:what|it)|short version|\bbusiness\?|\bpoint\b|you may (?:speak|introduce)|go on|get to it|explanation|preamble|spare me|tell me/i.test(t) ? 'inquiry' : 'contact');
    else p.replyFamilies[band] = [['contact'], ['company'], ['preparation'], ['thanks']];
  });
  // Context-specific lines are deliberately short. Their actor stays the same.
  p.departure = ['[calm] I want to check my pack before we leave.'];
  p.return = ['[quietly] We are back. I could use a moment to sit.'];
  p.revived = ['[quietly] Thank you for getting me back on my feet.'];
  p.theft = ['[angry] You took from me. I want it returned.'];
  p.funeral_general = ['[quietly] We shared the road. I wish it had ended differently.'];
  p.funeral_friendly = ['[sad] I will miss your company. The road will be quieter without you.'];
  p.funeral_hatred = ['[quietly] We did not get along. I will leave the speaking to the others.'];
  p.funeral_romantic = ['[sad] There are so many ordinary things I wanted us to do together.'];
  p.families.departure = ['preparation']; p.families.return = ['company'];
  p.families.revived = ['thanks'];
  p.dismissal_response = ['[flatly] All right. I will give you some space.'];
  p.replyFamilies.dismissal_response = [['dismissal']];
  p.inquiry_response = ['[calm] I will keep it brief.'];
  p.replyFamilies.inquiry_response = [['inquiry']];
}
for (const id of ['M04', 'F04', 'M11', 'F11', 'M15', 'F15', 'M23', 'F23', 'F26']) {
  D[id].dismissal_response = ['[annoyed] Fine. Keep your fucking space.'];
}
// Specific delivery and situational details, never a new actor.
const occasions = {
  '01': "One last check of the straps, then I am ready.|Back. Let me put this pack down.|I trusted you to get us home. I am sorry we could not do the same for you.|I will not pretend we were friends. The others deserve their moment.",
  '02': "Let me check the straps. I prefer my belongings to arrive with me.|Back in town! My feet have been petitioning for this.|I keep thinking of something to tell you. Then I remember.|We could not stand each other. I will spare everyone the fucking performance.",
  '03': "Could we check the route once more before we go?|We are back. I would like somewhere quiet for a little while.|You made it easier to speak up. I wish I could tell you that now.|I do not know what to say about us. I will stand back.",
  '04': "Check your gear. A loose strap is a stupid fucking way to die.|Home. I need this pack off before it finishes what the road started.|I am angry that you are gone. That is all I can get out right now.|I hated your guts. Dying has not made that simple.",
  '05': "Let me check the buckles. Looking effortless takes preparation.|Back at last. I intend to become somebody else's seating problem.|You knew when I was putting on an act. I miss being caught.|We never managed to like each other. I will not start lying at your grave.",
  '06': "I want another look at the route. There is always a detail worth checking.|Back in town. I should write things down before they turn into a better story.|There were things I still wanted to ask you. So many little things.|I have no answer for what happened between us. I will leave it there.",
  '07': "I am checking my equipment. I suggest everyone attempt the same standard.|We have returned. A chair is the minimum hospitality I expect.|I valued your judgment. I should have said so without making you earn it twice.|I disliked you. A flattering eulogy would insult us both.",
  '08': "A moment to check my pack. I dislike leaving something behind.|Back again. The familiar streets look a little different when I am tired.|I thought we had more ordinary days ahead of us.|There was enough bitterness between us. I will not bring more to the grave.",
  '09': "Checking my gear. I will be ready shortly.|Back. I would like a seat out of the way.|I liked that I could be quiet with you. It is a different quiet now.|We did not get along. I have no wish to discuss it here.",
  '10': "Let me check my pack. Cheerfulness will only carry the missing supplies so far.|Back! I would celebrate standing up, but that rather defeats the point.|I keep waiting for you to say something. Then wondering how I forgot.|I cannot give you a cheerful farewell. I will let someone who loved you speak.",
  '11': "Checking the straps. Optimism has a terrible load-bearing capacity.|Town. Good. Somewhere to sit while my knees file a complaint.|I have nothing clever for this. I just want my friend back.|We were bloody awful company for each other. That is enough from me.",
  '12': "A prayer, then a check of my gear. Neither excuses neglecting the other.|We have returned. Give me a moment to be grateful before I sit.|I will speak your name when I pray. I wish I could still hear you answer.|I cannot offer affection I did not feel. May you find some peace beyond us.",
  '13': "Checking my supplies. Replacing them on the road is an expensive habit.|Back. I am going to sit before someone finds a use for me.|I kept putting a value on things. I never knew how to count on losing you.|We were not friends. I will not dress the debt up as affection.",
  '14': "Let me check my pack. I can wait while everyone gets ready.|Back at last. I could use a quiet seat and a moment to breathe.|You made room for me in your life. I do not know how to make room for this.|I could not feel close to you. I am sorry that never changed.",
  '15': "Checking my pack. Then ready.|Back. Need a seat.|You were my friend. Fuck, I miss you.|We hated each other. I will not bullshit the mourners.",
  '16': "I have checked my pack three times. It still feels as if I have forgotten something.|Back in town. I can put the pack down now. I keep forgetting that.|I felt safer when you were here. I wish that had worked both ways.|I was not comfortable around you. I do not know what to do with that now.",
  '17': "A final inspection of my belongings before the grand departure.|We return! I propose the next act feature a chair and very little movement.|I rehearsed something. It sounds dreadful now. I loved being your friend.|I will not perform grief I do not feel. You would have hated the production.",
  '18': "Let me check the pack. Better tired here than missing something out there.|Back. Somewhere to sit would settle most of my ambitions.|You made the days feel less heavy. I should have told you.|I have no energy to pretend we were close. Let the others speak.",
  '19': "I want to check my gear properly before we set off.|Back at last. I am glad to put this pack down.|You mattered to me. I hope I made that clear while you could hear it.|I did not like you. It would be dishonest to say otherwise here.",
  '20': "A moment to check the pack. Surprises are better when I arranged them.|Back in town. I intend to find a seat before everyone has the same idea.|I kept a little of myself back. With you, I was learning not to.|We never trusted each other. I see no kindness in pretending we did.",
  M21: "Checking straps and supplies before departure.|Returned. I need a moment to put my equipment in order.|I relied on you. I will remember what that meant, beyond the work.|Our differences remain. This is not the place to rehearse them.",
  M22: "Take a moment to check the gear. A little patience now is useful later.|We are back. There is no hurry while I find a seat.|I thought there would be time to talk again. I am sorry I assumed it.|We never found a way to get along. I will give the others their time.",
  M23: "Inspecting my kit. Negligence is a shit excuse out there.|Back. Let me put the equipment in order before anything else.|I was hard on you. I hope you knew how much I trusted you.|I did not respect you. I will not insult the living by pretending otherwise.",
  M24: "A moment to look over the gear. I prefer knowing what is loose.|Back. I need a place where I can sit and still see the door.|I keep looking for you before I remember. Some habits take their time.|I will keep watch while the others speak. I have no kind words to add.",
  M25: "Let me check the buckles. Charm is a poor replacement for the right equipment.|Town again. I think I have earned the right to be horizontal.|I was looking forward to wasting more time with you. It was never wasted.|We were terrible company for each other. I will spare you a last attempt.",
  M26: "Checking my kit. Yes, even I prepare. Please contain the astonishment.|Back! I would describe my accomplishments, but I want to sit first.|You let me talk, and somehow I wanted to listen. I miss that.|I could make a speech. You would have hated it. I will do us both a favour.",
  M27: "Checking the lashings. Loose gear is a pain in the arse on any road.|Back on familiar ground. A seat and dry socks would improve it.|Good company is hard to find. Losing yours hurts like hell.|We never sailed easy together. I will leave the good words to your friends.",
  M28: "I am checking the gear. A clear plan begins with what we actually have.|Back. I want a moment to set things down and take stock.|I trusted your judgment. I did not say that often enough.|I have no fond words for you. The others should speak freely.",
  M29: "A moment for the unglamorous business of checking my pack.|We have returned. I am prepared to negotiate generously for a chair.|I could always find words with you. I cannot find the right ones now.|I could make this sound gracious. I would rather let your friends be honest.",
  M30: "Checking my pack. Having something small to put right helps.|Back. I need somewhere quiet to gather myself.|I am trying to remember your voice without remembering this moment.|There was no peace between us. I will not disturb the others with it.",
  F21: "I am checking my supplies. A quiet moment now saves confusion later.|Back at last. Let me set everything down and collect myself.|I am trying to speak steadily. You would know how much it costs.|I will remain civil. I cannot offer affection we never shared.",
  F22: "Check the straps before we go. Experience is mostly remembering what chafes.|Back. My feet would like to end their participation in the day.|You were good company. That sounds small until you have to live without it.|We were no use to each other. I will not improve the tale for an audience.",
  F23: "Checking my kit. I have no intention of losing to a fucking buckle.|Town again. Sitting down sounds like a contest I could win.|You made me want to be better. I wanted you here to see it.|I did not like you. Even here, I will not pretend we were friendly rivals.",
  F24: "Let me check my pack in quiet before we leave.|Back. A quiet corner would suit me.|I have been holding the words in. I do not think they will come today.|I have nothing gentle to say. Silence is the courtesy I can offer.",
  F25: "A moment to inspect my belongings before we depart.|We have returned. I would appreciate a moment to sit.|Your friendship was a kindness I came to depend on.|We were never close. I will not impose a false account on your friends.",
  F26: "Checking my gear. I enjoy bad decisions, but not shitty buckles.|Back! Somebody point me at a seat before I claim the ground.|You made me laugh. Now every funny thing catches in my throat.|We could not stand each other. No sense putting a ribbon on that shit.",
  F27: "Let me see to my pack. Preparation deserves a little attention.|Back at last. I intend to sit down with considerably less grace than usual.|I thought I could carry this with dignity. I would rather have you.|I will step aside. Someone who loved you should have this moment.",
  F28: "Checking my supplies before we go. I do not like leaving work unfinished.|Back. I need to set the pack down before I take on anything else.|I kept thinking about what needed doing. I wish I had stayed and talked more.|I will see that the practical things are done. That is what I can give.",
  F29: "I am counting my supplies. An estimate is not the same as having them.|Back. I need a moment to check what is still in the pack.|I remember such small things about you. I am afraid of getting any of them wrong.|We did not get along. That is the precise and unfortunate truth.",
  F30: "Let me check the pack once more. It settles me a little.|Back again. I would like a quiet place to sit.|I know what missing someone is. Knowing has not made this easier.|We had no comfort to give each other. I will leave the comfort to your friends."
};
for (const [id, p] of Object.entries(D)) {
  const row = occasions[id] || occasions[id.slice(1)];
  if (!row) continue;
  const parts = row.split('|');
  ['departure', 'return', 'funeral_friendly', 'funeral_hatred'].forEach((b,i) => {
    // Hostile words must also work when the speaker is the only mourner.
    const text = i === 3 ? parts[i].split(/(?<=\.) /)[0] : parts[i];
    p[b] = ['[' + (i === 2 ? 'sad' : i === 3 ? 'flatly' : 'calm') + '] ' + text];
  });
}
D.M16.departure[0] = "[nervously] I've checked my pack three times. I still feel like I've forgotten something.";
D.M04.revived[0] = "[quietly] Thanks for getting me up. I couldn't see who was still standing.";
D.M01.funeral_friendly[0] = "[quietly] I trusted you to get us home. I'm sorry we couldn't do the same for you.";
D.M02.departure[0] = '[calm] Let me check the straps before we start. I prefer my belongings to arrive with me.';
D.F11.return[0] = '[playfully] Back in town. Sitting down is looking like an excellent next move.';
D.M15.return[0] = '[calm] Back at last. A seat would suit me.';
D.F28.romantic[0] = "[warmly] I'm ready. Just wanted a moment with you before the day gets busy.";
// Generated voices use this revision for browser cache invalidation.
// Hostile battle remarks do not ask someone already fighting to leave a table.
const battle = {
 '01':'Keep your fucking distance. I am ready for you.', '02':'Come on then, you punk ass bitch. You do not get an easy one.',
 '03':'Stay the hell back. I can still defend myself.', '04':'Come on, you bitch. What the fuck do you want.',
 '05':'Careful. I would hate to disappoint you at this fucking distance.', '06':'I am watching you. Do not mistake that for hesitation, damn it.',
 '07':'You will have to do better than threaten me. Fuck off.', '08':'I have no wish to die here. Keep the hell back.',
 '09':'I see you. Keep your damned distance.', '10':'Well, this is a fucking unpleasant introduction.',
 '11':'Just what the day needed. Some shit trying to kill me.', '12':'Gods damn it. I will face what is in front of me.',
 '13':'I have no intention of leaving you my belongings, you bottom bitch.', '14':'Stay back. I will protect myself, damn it.',
 '15':'Back the fuck off. What the hell is this.', '16':'Stay back! I am frightened, not helpless. Shit.',
 '17':'A hostile audience. How very fucking familiar.', '18':'I am too tired to die for your convenience. Fuck off.',
 '19':'I mean to live through this. You should know that. God damn it.', '20':'Keep watching me. I am certainly watching you, you bitch.',
 M21:'Keep your footing. I am not giving mine away. What the hell.', M22:'I can wait for an opening. Can you, damn it.',
 M23:'You will not frighten me into a mistake. Fuck off.', M24:'I see where you are. Keep your damned distance.',
 M25:'I have survived worse company. Come on, you punk ass bitch.', M26:'Come on then. Give me something worth boasting about, you bottom bitch.',
 M27:'Back off, you saltless bottom bitch.', M28:'You will have to take this ground from me. What the fuck.',
 M29:'I would offer pleasantries, but you appear committed to being a bitch.', M30:'Stay back. I have enough ghosts without joining them. Gods damn it.',
 F21:'I can hear the threat. I am keeping my head. Shit.', F22:'I have no patience for being killed. Keep the hell back.',
 F23:'Come on then. I am not a fucking practice target.', F24:'I see you. I am ready. Damn it.',
 F25:'Keep your distance. I intend to defend myself. God damn it.', F26:'Come on, you bitch. Try someone who bites back.',
 F27:'What an ugly fucking way to spend an afternoon.', F28:'I am staying on my feet. You will have to work for this, damn it.',
 F29:'I am watching for the opening. Keep that in mind. What the hell.', F30:'I have seen enough graves. I do not want yours or mine. Shit.'
};
const inquiry = {
 '01':'A brief word, if you have the time.', '02':'Just a word. I will try not to make an occasion of it.',
 '03':'Only a moment, if that is all right.', '04':'I will be brief. No need to bite my fucking head off.',
 '05':'Just a moment of your time. I know how precious it is.', '06':'A quick word. I will try to stay with the point.',
 '07':'I shall be brief. Do try to listen.', '08':'Only a little of your time.',
 '09':'This will be brief.', '10':'Just a quick word. I will spare you the speech.',
 '11':'The short version, then. A rare fucking treat.', '12':'Just a moment, if you can spare it.',
 '13':'I will be brief. Time has its own cost.', '14':'Only a moment. I do not want to keep you.',
 '15':'Briefly, then.', '16':'Only a moment. Sorry, I am getting to it.',
 '17':'A brief appearance. I shall resist the monologue.', '18':'Brief suits me. Talking takes effort.',
 '19':'I will be straightforward with you.', '20':'Just a short word between us.',
 M21:'Brief and to the point.',M22:'A moment will do. Thank you for making room.',
 M23:'I have no intention of wasting time.',M24:'Just a word. I will keep my eyes open.',
 M25:'A moment with you. I shall try not to squander it.',M26:'I can be brief. There are witnesses.',
 M27:'A short word, then. No need for a whole bloody voyage.',M28:'I will get to the point.',
 M29:'A little of your attention. I shall endeavour to deserve it.',M30:'Only a moment. It helps to put words in order.',
 F21:'I will keep this straightforward.',F22:'A short word. No need to spend the whole day at it.',
 F23:'Straight to it, then. I can manage that.',F24:'Only a moment of the quiet.',
 F25:'A brief word, with your leave.',F26:'I will be quick. Try to contain your fucking excitement.',
 F27:'Only a little of your time. I appreciate it.',F28:'I will be brief. There are other things to see to.',
 F29:'The short version. I will be precise.',F30:'Only a moment. Thank you for hearing me.'
};
for (const [id,p] of Object.entries(D)) {
 const text = battle[id] || battle[id.slice(1)];
  if (text) p.combat_hatred = ['[tense] ' + text];
  const answer = inquiry[id] || inquiry[id.slice(1)];
  if (answer) p.inquiry_response = ['[calm] ' + answer];
}
ADV.DATA.DIALOGUE_REVISION = 'conversation-1';
ADV.DATA.CONVERSATION_ROWS = rows;
})();
