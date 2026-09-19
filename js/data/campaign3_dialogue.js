// Varenholm's Gate story campaign — every line, choice and epilogue paragraph.
// Recorded campaign clips are checked by vo_coverage.
// VARENHOLMS_GATE_VOICE_SCRIPT.md is generated from this file.
//
// Register: sincere, unhurried, a little formal — the classic CRPG voice.
// Every named person speaks from a region (see CAMPAIGN3_REGIONS in
// campaign3_data.js): the accent lives in word choice, rhythm and idiom, never
// in phonetic spelling, so TTS stays intelligible.
//
// How scenes are built: nobody in this script explains the world for its own
// sake. Each person wants something and works the scene for it — companions
// put their own questions to the people you meet (gated on who is riding
// along), the people you meet ask you things and read your answer, and two
// strangers sharing a scene argue with each other before they turn to you.
// The player is silent: the only lines they "say" are the options they pick.
// Options marked `ask` are questions — the answer plays and the same choice
// returns without that question. Options that answer an NPC's question do not
// return. Bracketed tags are ElevenLabs v3 delivery cues (spoken, never shown).
// {target} is the listener's name.
// Editorial rule: no ink-on-body character shorthand or "question" metaphors.
// Literal requests for information are fine; ask them directly.
// Keep the action and stakes concrete. Do not give unrelated speakers the same
// chained metaphors, mock-profound reversals or compulsory punchline cadence.
// Contextual humour, distinctive idiom, cruelty and profanity stay in character.
// Revise individual recorded segments; preserve clip indices and plot callbacks.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const D = ADV.DATA;
const DLG = D.CAMPAIGN3_DIALOGUE = { gate: {} };
const CHOICES = D.CAMPAIGN3_CHOICES = {};
const SCRIPT = D.CAMPAIGN3_SCRIPT = {};

function L(who, key, text) {
  const t = DLG.gate[who] = DLG.gate[who] || {};
  t[key] = text.split('|').map(s => ({ t: s.trim() }));
}
function CH(id, options) { CHOICES[id] = { id, options }; }
const B = (who, key, extra) => Object.assign({ who, key }, extra || {});
const Q = (n, script) => { SCRIPT[n] = script; };
const W = 'wren_ward';   // Hiwot
const co = (id, extra) => Object.assign({ when: { company: id } }, extra || {});          // only when this companion rides along
const both = (a, b, extra) => Object.assign({ when: { companyAll: [a, b] } }, extra || {}); // only when both do
const without = (id, extra) => Object.assign({ when: { noCompany: id } }, extra || {});

// =====================================================================
// Q1 — The Road from Lanternhold
// =====================================================================
L('aldric', 'q1_wake', `[low, urgent] Wake, my child, and dress. Not the library robe — the travelling coat, and your boots. We leave Lanternhold tonight.|[calm] I know you have questions. I have dreaded them for twenty years, and I will answer every one once we are past the gate and out of the hearing of these walls. Not before. Trust me in this as you have trusted me in everything.`);
CH('q1_wake', [
  { id: 'why', text: 'Why tonight? What has happened?', ask: true, reply: B('aldric', 'q1_wake_why') },
  { id: 'afraid', text: 'You have never been afraid of anything. You are afraid now.', ask: true, reply: B('aldric', 'q1_wake_afraid') },
  { id: 'go', text: 'I will get my things.', reply: B('aldric', 'q1_wake_go') },
]);
L('aldric', 'q1_wake_why', `[quietly] A message came at dusk, of the kind that is not written down. It said that people who wish you harm know where you are. Lanternhold, which I chose because nothing here changes and no one ever comes, has stopped being safe. That is all I will say inside these walls.`);
L('aldric', 'q1_wake_afraid', `[a breath] Yes. I am afraid. I have never lied to you and I will not begin tonight. Fear is not shameful, my child; it is a messenger. Mine says to have you on the road before the moon is up.`);
L('aldric', 'q1_wake_go', `[warm] Good.`);
// Tesfaye checks his fear against what the ward saw today
L('aldric', 'q1_wake_ask', `[careful] One thing before you go, and answer it truly. Has anyone spoken to you today whom you did not know? A pilgrim, a pedlar, a man asking directions. Anyone.`);
CH('q1_wake_seen', [
  { id: 'nobody', text: 'No one. The same faces as every day.', reply: B('aldric', 'q1_seen_nobody') },
  { id: 'pilgrim', text: 'A pilgrim at the well asked my name. I told him.', set: { toldName: true }, reply: B('aldric', 'q1_seen_pilgrim') },
  { id: 'why', text: 'Why? Who would come here?', reply: B('aldric', 'q1_seen_why') },
]);
L('aldric', 'q1_seen_nobody', `[relieved] Then they are not inside the walls yet, and we have the hours I hoped for. Take what coin you have to Dawit at the storehouse and buy a true blade; the practice swords stay behind. Meet me at the gate at the second bell, and if anyone stops you between here and there — anyone — do not argue with them. Come to me.`);
L('aldric', 'q1_seen_pilgrim', `[very quiet] You told him. — No. It is not your fault; you had no reason not to. It means they are inside already, and it means we go now, not at the bell. Take your coin to Dawit at the storehouse and buy a true blade, and come straight back to me. Do not stop for anyone.`);
L('aldric', 'q1_seen_why', `[gently] Because the people I have feared for twenty years have found the one place I hoped they never would. That is the whole answer, and I will give you the rest on the road. Take your coin to Dawit at the storehouse and buy a true blade. Then the gate, at the second bell.`);
L('nib', 'q1_store', `[easy] Evening. You'd be the old man's ward, then. Younger than I was told, and about to make somebody a good deal richer.|[almost kindly] No call to make this hard. I've a purse to earn and a road to be on before sun-up, and you've got — what, a practice sword? Stand still and I'll make it quick.`);
CH('q1_nib', [
  { id: 'who', text: 'Who paid you? Say the name and I let you walk.', ask: true, set: { nibSeal: true }, reply: B('nib', 'q1_nib_who') },
  { id: 'richer', text: 'Richer for whom?', ask: true, reply: B('nib', 'q1_nib_richer') },
  { id: 'draw', text: 'You have picked the wrong storehouse.', reply: B('nib', 'q1_nib_draw') },
  { id: 'run', text: 'Go. Run, and I will not follow.', bypass: true, heritage: -1, set: { nibSpared: true }, reply: B('nib', 'q1_nib_run') },
]);
L('nib', 'q1_nib_who', `[a shrug] There's never a name, friend. A seal on a letter, a purse left at an inn, a description of a face. That's how it's done, and it's done that way so men like me can't answer questions like yours.`);
L('nib', 'q1_nib_richer', `[amused] For somebody who don't want to be spoken of. Two hundred in gold for the ward of Tesfaye of Lanternhold, alive or otherwise. That's a heap of money for a scholar's foundling, and I'll be honest, I did wonder why.`);
L('nib', 'q1_nib_draw', `[flat] Reckon I have.`);
L('nib', 'q1_nib_run', `[backing away] ...You're either real kind or real foolish, and I ain't paid enough to find out which.`);
// Tesfaye debriefs the ward outside the brothers' quarters — he wants the seal
L('aldric', 'q1_cobb', `[hard] Two of them, inside the keep, on the same night. Somebody bought a keeper's silence for that, and I mean to know whose. Later.|[urgent] The one in the storehouse. Did he say anything before it ended? Who sent him — a name, a house, a mark?`);
L('aldric', 'q1_cobb_spared', `[thoughtful] He went. That was kinder than I would have been in your place. Remember that it cost us nothing tonight; it will not always.|[urgent] And here is a second one, in the brothers' quarters. Before you finish him — the first one. Did he say who sent him? A name, a house, a mark?`);
CH('q1_cobb', [
  { id: 'seal', text: 'No name. He said there is only ever a seal on a letter and a purse at an inn.', when: { flag: 'nibSeal' }, reply: B('aldric', 'q1_cobb_seal') },
  { id: 'bounty', text: 'Two hundred in gold for me, alive or otherwise. He wondered why.', reply: B('aldric', 'q1_cobb_bounty') },
  { id: 'nothing', text: 'I did not ask. There was no time.', reply: B('aldric', 'q1_cobb_nothing') },
]);
L('aldric', 'q1_cobb_seal', `[grim] A seal. Then it is a house that wants you, not a man, and houses keep ledgers and ledgers keep names. That is the first useful thing anyone has told me in twenty years. Finish this one; we go the moment the gate opens.`);
L('aldric', 'q1_cobb_bounty', `[quiet] Two hundred. That is not a grudge; that is a budget. Somebody with money has decided you are worth it, and I would give a great deal to know how they came to that sum. Finish this one; we go the moment the gate opens.`);
L('aldric', 'q1_cobb_nothing', `[gently] No. There would not have been. It is a thing you learn: ask first, strike after, when you can. Finish this one; we go the moment the gate opens.`);
L('aldric', 'q1_road', `[quiet] Stay close, and keep to the shadow of the trees. This road is empty at night, and I have learned to dislike empty roads.|[after a silence] {target}. In case I do not find a better moment — I have been proud of you every day since I carried you through that gate. Whatever you hear about yourself in the days to come, hold to that. A tree with deep roots laughs at the wind.|[sharp] Torches. Ahead, and closing. Off the road — now.`);
// The giant and the mentor: he is checking what the child has been told
L('korvath', 'q1_appear', `[calm, courteous] Tesfaye of Lanternhold. You have run a very long way to end up on a road at night with the one thing I want.|[measured] Give the child to me, and you may keep your life and your library. It is not a small thing I offer. I will not offer it twice.`);
L('aldric', 'q1_refuse', `[steady] You know my name; I do not know yours, and I find I do not care to. You will not have this child while I stand. Take that as my answer.`);
L('korvath', 'q1_question', `[curious, unhurried] Before you die for it, old man, satisfy me on one point. Does the child know? Have you told it what it is, or have you let it grow up believing it is yours?`);
L('aldric', 'q1_answer', `[level] It knows what I taught it. Letters, kindness, and how to hold a blade. That is all the knowing it needs, and more than you were ever given.|[to the ward, fierce and low] Run. Do not look back, whatever you hear. Find the Open Hand Inn on the Shore Road. Ask for Beau and Delphine. Run!`);
L('aldric', 'q1_death', `[struck through] Go —`);
L('korvath', 'q1_after', `[unhurried, to the dark] Then it will learn the rest from me. Let the child run. The road is long, my friends, and I own most of it.`);
// Hiwot catches up — and wants what she could not hear
L(W, 'q1_catchup', `[breathless] {target}! Oh, thank every saint that listens. I saw you both leave and I followed — yes, I know, I was not supposed to — and then I saw the torches, and the big one in the black armour, and I ran the other way, because I am not brave. I am only fast.|[quieter] He is dead. Tesfaye. I saw him fall. I can't believe we left him there. He should be with us.|[urgent] Tell me what the big one said to him. I was too far; I saw his mouth move and Tesfaye shake his head. What did he want?`);
CH('q1_wren', [
  { id: 'kind', text: 'Me. Tesfaye said no. We do what he told us — the Open Hand. Stay close to me.', aff: { wren_ward: 1 }, reply: B(W, 'q1_wren_kind') },
  { id: 'cold', text: 'Later. Keep your voice down; grief will not help us, and it will get us found.', reply: B(W, 'q1_wren_cold') },
  { id: 'dark', text: 'He asked whether I knew what I am. I will find him, ask him what he meant, and take him apart.', heritage: 1, reply: B(W, 'q1_wren_dark') },
]);
L(W, 'q1_wren_kind', `[steadying] He wanted you. By name. Then it was never about Tesfaye at all. — Close. Yes. I can do close. I have his letter; it was in his coat. An inn on the Shore Road, and two names, Beau and Delphine. He must have meant for us to go to them.`);
L(W, 'q1_wren_cold', `[stung, then flat] Right. I am fine. — I have his letter. An inn and two names. You may read it when you have finished being a wall.`);
L(W, 'q1_wren_dark', `[uneasy] "What you are." He said that? — You sounded like him just then. Not Tesfaye. The other one. [softer] There is a letter. An inn, two names. Let us go and be alive first. You can be terrible later.`);
L(W, 'q1_join', `[firm] I am coming with you. I can pick locks and keep watch while you sleep. Besides, if you leave me here, I will only have to follow you again.`);
Q(1, {
  departure: [
    B('aldric', 'q1_wake', { choice: 'q1_wake', caption: 'Lanternhold, after the last bell. Tesfaye is standing in your doorway with a lamp, dressed for the road.' }),
    B('aldric', 'q1_wake_ask', { choice: 'q1_wake_seen' }),
  ],
  openers: {
    0: [B('nib', 'q1_store', { choice: 'q1_nib', caption: 'The storehouse. A stranger in a road-cloak is standing between the shelves. He is not one of the keepers.' })],
    1: [B('aldric', 'q1_cobb', { when: { not: 'nibSpared' }, choice: 'q1_cobb' }), B('aldric', 'q1_cobb_spared', { when: { flag: 'nibSpared' }, choice: 'q1_cobb' })],
    2: [B('aldric', 'q1_road', { caption: 'The Griffon Road, after dark.' })],
  },
  closing: [
    B('korvath', 'q1_appear', { caption: 'A man in spiked black plate steps into the torchlight, taller than any man should be. Tesfaye puts himself between the giant and you.' }),
    B('aldric', 'q1_refuse'),
    B('korvath', 'q1_question'),
    B('aldric', 'q1_answer'),
    B('aldric', 'q1_death', { death: true }),
    B('korvath', 'q1_after'),
  ],
  arrival: [B(W, 'q1_catchup', { choice: 'q1_wren', caption: 'A village at the edge of the hills, an hour before dawn. Someone small is running up the road behind you.' }), B(W, 'q1_join', { recruit: [W] })],
});

// =====================================================================
// Q2 — The Open Hand
// =====================================================================
L(W, 'q2_road', `[reading] "The Open Hand, on the Shore Road, past the salt-flats. Ask for Beau and Delphine. They are Wardens, and they were my friends before you were born. Trust them as you would trust me." — That is all it says. He never wasted ink.|[thinking] Wardens. He never once said that word in twenty years, and now it is the first thing he wants us to know. That is the first thing I am asking them.`);
// The Umbral pair size you up — Winston wants to know where you are going and why
L('vess', 'q2_pair', `[bright] Well now — look at this, Winston. Two little travellers on a big empty road, and one of them holding a sword like it might bite.|[delighted] Desmond. This is Winston. We are going the same way as you, which is a coincidence, and we are very good in a fight, which is not.`);
L('fennick', 'q2_pair', `[flat] He talks. I do the rest.`);
L(W, 'q2_pair_hiwot', `[low, to you] Do not tell them anything. We do not know them.`);
L('fennick', 'q2_pair_ask', `[level] Before anybody says yes or no: where are two children walking so fast, with one blade between them and no pack? People with a reason walk like that. I want the reason.`);
CH('q2_pair_where', [
  { id: 'truth', text: 'An inn called the Open Hand. Friends of my father\'s. He is dead.', set: { toldPair: true }, reply: B('fennick', 'q2_where_truth') },
  { id: 'lie', text: 'South. Family.', reply: B('vess', 'q2_where_lie') },
  { id: 'refuse', text: 'That is my business.', reply: B('fennick', 'q2_where_refuse') },
]);
L('fennick', 'q2_where_truth', `[thoughtful] The Open Hand. That's a Warden house; everybody on this coast knows it. So you are walking toward trouble, not away from it, and you are honest about it. Both of those are useful to me.`);
L('vess', 'q2_where_lie', `[gleeful] Lying. Look at the hands, Winston — the hands always know. I like them already.|[sing-song] No worry yourself. Everybody lies to us. We are used to it.`);
L('fennick', 'q2_where_refuse', `[unbothered] Fair. It is. Then here is mine, so we are even.`);
L('fennick', 'q2_pair_offer', `[flat] We are hired blades between hirings, and the road is bad for two and better for four. Say yes or say no, but say it before the light goes. I do not like this stretch after dark.`);
CH('q2_pair', [
  { id: 'who', text: 'Who are you, really? Nobody walks this road for the pleasure of it.', ask: true, reply: B('fennick', 'q2_pair_who') },
  { id: 'vess', text: 'Your friend is laughing at nothing. Is he well?', ask: true, reply: B('fennick', 'q2_pair_vess') },
  { id: 'yes', text: 'Four is better than two. Walk with us.', recruit: ['vess', 'fennick'], set: { umbralRecruited: true }, aff: { vess: 1, fennick: 1 }, reply: B('vess', 'q2_pair_yes') },
  { id: 'no', text: 'We travel alone. Good road to you.', set: { umbralRefused: true }, reply: B('fennick', 'q2_pair_no') },
]);
L('fennick', 'q2_pair_who', `[dry] You want the true answer or the polite one? Polite: two men with skills and no master this month. True: we work for people who pay to know things, and right now they would like to know why iron costs three times what it did last year. You are not the thing we are looking for. You are on the road to it.`);
L('fennick', 'q2_pair_vess', `[a sigh] Desmond is well the way a fire is well. He can raise the dead for a little while and he laughs when the dead fall down again. I keep him pointed the right way. I have done it since we were boys and I am tired, but I am still doing it.`);
L('vess', 'q2_pair_yes', `[sing-song] You hear that, Winston? We have friends now. — No worry yourself, {target}. I bite only the ones you tell me to.`);
L('fennick', 'q2_pair_no', `[unbothered] Then go easy. If you change your mind, we will be the ones ahead of you with the fire lit. — Desmond. Walk.`);
L(W, 'q2_wolves', `[low] Wolves. Road wolves, the big grey kind — Tesfaye said they only come down to the road when the hills are hungry.|[very quiet] Something has made the hills hungry.`);
// Santiago — and Hiwot wants to know who sends one boy after a wolf den
L('cassian', 'q2_cassian', `[formal, out of breath] Hold — with respect, hold! Do not go into the den, señor — señora — forgive me, I do not know which, and I have run a long way.|[straightening] Santiago, squire of the Order of the Dawning Flame. I have been sent to clear these wolves from the road, and I have been sent alone.`);
L(W, 'q2_cassian_hiwot', `[sceptical] Alone. Who sends one squire to a wolf den? What did you do to your Order?`);
L('cassian', 'q2_cassian_answer', `[reddening, honest] Nothing. That is the difficulty. A knight who has done nothing is sent to do something, and a wolf den on a road nobody uses is the something. I will confess to you, as I would to no one in the Order, that I am not certain I can.`);
L('cassian', 'q2_cassian_alone', `[honest] I will confess to you, as I would to no one in the Order, that I am not certain I can. I have never fought anything that was not a straw man.`);
CH('q2_cassian', [
  { id: 'order', text: 'The Dawning Flame. What is that?', ask: true, reply: B('cassian', 'q2_cassian_order') },
  { id: 'join', text: 'Then we clear them together, and you may tell your Order whatever you like.', recruit: ['cassian'], aff: { cassian: 1 }, reply: B('cassian', 'q2_cassian_join') },
  { id: 'tease', text: 'A knight who cannot manage wolves. What do they teach in that Order?', ask: true, aff: { cassian: 1 }, reply: B('cassian', 'q2_cassian_tease') },
  { id: 'no', text: 'We are in a hurry. Manage your own wolves.', reply: B('cassian', 'q2_cassian_no') },
]);
L('cassian', 'q2_cassian_order', `[earnest] An order of knights sworn to the sun and the sunrise: to be first into the dark and last out of it. Our chapter house is far south of here, in the sun-lands, where I was born. The Order sent me north to learn what the roads are like. I am learning.`);
L('cassian', 'q2_cassian_tease', `[reddening, then honest] Prayers, mostly. And the sword, and how to stand still while people say unkind things — which, with respect, you are doing very well.`);
L('cassian', 'q2_cassian_join', `[relieved] God keep you for it. Then I will take the front, because that is what I am for, and you will tell me if I am doing it wrong.`);
L('cassian', 'q2_cassian_no', `[formal, hurt] Of course. God go with you, then. I will — I will manage.`);
// Merle on the steps wants to be sure which of you is worth the money
L('morwin', 'q2_morwin', `[drawling, on the inn steps] Well, look here. Two of you, and a paper in my pocket with one face on it. Now which one's the ward of Tesfaye of Lanternhold? Don't all shout at once.`);
L(W, 'q2_morwin_hiwot', `[quickly] Neither. We are pilgrims. Going to the shrine at — the shrine.`);
L('morwin', 'q2_morwin_hiwot_reply', `[amused] Pilgrims. With that face, that the paper's got drawn near perfect. Nice try, little sister.|[unhurried] Merle. I'm the fella they send when the first fella don't come back. Now I'll say this once: I'd sooner do this out here than in Delphine's yard. That woman scares me.`);
L('morwin', 'q2_morwin_alone', `[unhurried] Merle. I'm the fella they send when the first fella don't come back. I'd sooner do this out here than in Delphine's yard. That woman scares me.`);
CH('q2_morwin', [
  { id: 'name', text: 'Whose name is on that paper? Who is paying?', ask: true, reply: B('morwin', 'q2_morwin_name') },
  { id: 'how', text: 'How did you know to wait here?', ask: true, reply: B('morwin', 'q2_morwin_how') },
  { id: 'kill', text: 'You should have stayed home, Merle.', heritage: 1, reply: B('morwin', 'q2_morwin_kill') },
  { id: 'inn', text: 'Delphine! Beau! There is a man on your steps who means murder!', reply: B('morwin', 'q2_morwin_inn') },
]);
L('morwin', 'q2_morwin_name', `[chuckling] Same as always. A seal, no name. Iron hand on red wax, pressed hard, like whoever did it was angry at the wax. If you want a name you'll have to go up the road a good deal further than me.`);
L('morwin', 'q2_morwin_how', `[a shrug] The old man had two friends in the whole world, and they run this inn. Anybody who knew him knew that. Whoever's paying knew him.`);
L('morwin', 'q2_morwin_kill', `[grinning] Now there's the temper the paper warned me about.`);
L('morwin', 'q2_morwin_inn', `[cursing] Oh, that's low. That's — I hear the door. All right. All right, quick then.`);
L(W, 'q2_notice', `[picking up the paper] He was carrying this. Your face, and a bounty, and a seal of an iron hand in red wax. No name.|[quiet] Somebody with a great deal of money wants you dead badly enough to send two men in one night and a third to wait at the one door Tesfaye trusted. I am keeping this. Somebody at that inn will know the mark.`);
// The Open Hand: Delphine wants the whole account before she decides anything
L('dorran', 'q2_selene', `[stammering, warm] You're — y-you're his. Tesfaye's. I'd know that coat anywhere; he w-wore it the day we met. Come in. Come in out of the road.|[quiet] Del. It's the ward. He sent the ward.`);
L('selene', 'q2_selene', `[warm, gentle] I'm Delphine, Beau's wife. Your late stepfather, Tesfaye, was an old friend of ours. Sit down, honey. Beau, get the good bread.|[steady] He wrote to us from Lanternhold every year for twenty years. Said you and Hiwot were growing up in that keepers' library, getting into everything he tried to keep you out of. His last letter said if you came here without him, we were to keep you safe.|[quiet, direct] So. How did he die? All of it. Don't you spare me.`);
CH('q2_selene_how', [
  { id: 'armour', text: 'A man in black plate, taller than a man should be. He asked for me by name. Tesfaye said no.', set: { toldArmour: true }, reply: B('selene', 'q2_how_armour') },
  { id: 'quick', text: 'Quickly. He did not suffer.', reply: B('selene', 'q2_how_quick') },
  { id: 'refuse', text: 'I cannot. Not tonight.', reply: B('selene', 'q2_how_refuse') },
]);
L('selene', 'q2_how_armour', `[very still] Black plate. Asked for you by name.|[to Beau] Beau. The letter from the spring. He said if a big man in black iron ever came asking, we weren't to fight him, we were to run with the child and ask questions after. I thought he'd gone strange.`);
L('selene', 'q2_how_quick', `[gently] That's a kindness, and a lie, and I'll take both. Thank you, sugar.|[to Beau] Beau. Whoever did it knew where Tesfaye was, and Tesfaye chose that library because nobody knew. Somebody talked.`);
L('selene', 'q2_how_refuse', `[soft] Then don't. But you'll tell Beau when you can; he loved him too, and he's worse at waiting than I am.`);
// Beau has been looking at the paper; he checks his theory with Delphine
L('dorran', 'q2_beau_seal', `[low] Del. The p-paper the man on the steps had. Look at the seal. Iron hand, red wax.|[steadier] That's the mark on the ore wagons. The ones that come up from Dunmere and go north. I've seen it a hundred times at the ford.`);
L('selene', 'q2_selene_seal', `[looking] It is. The Iron Consortium's mark — the trading house out of the Gate that's been buying every bar on this coast since the ore went bad.|[slowly] So the folks paying to kill Tesfaye's ward are the folks who own the iron. That ain't two stories, honey. That's one. Now you ask me whatever you need to, and then we decide what he'd have done.`);
CH('q2_selene', [
  { id: 'wardens', text: 'What are the Wardens? He never told me.', ask: true, reply: B('selene', 'q2_selene_wardens') },
  { id: 'why', text: 'Why would a trading house pay two hundred in gold for a scholar\'s foundling?', ask: true, reply: B('selene', 'q2_selene_why') },
  { id: 'trust', text: 'He trusted you. So will I. Tell me what he would have done.', aff: { selene: 1, dorran: 1 }, reply: B('selene', 'q2_selene_trust') },
  { id: 'alone', text: 'I did not come for bread. Tell me who killed him and I will go alone.', heritage: 1, aff: { selene: -1 }, reply: B('selene', 'q2_selene_alone') },
]);
L('selene', 'q2_selene_wardens', `[matter-of-fact] Folks who keep the balance between the towns and the wild, and between the strong and the weak, when the law's too far off to do it. Tesfaye was one, before the library. So are we. It don't pay, and nobody thanks you, and you do it anyway. That's the whole of the oath.`);
L('selene', 'q2_selene_why', `[carefully] I don't know, and I won't pretend I do. I know Tesfaye hid you like a man hides a lit candle in a wind, and never said from what. A trading house don't spend two hundred on spite. They think you're worth it, or they think you're dangerous, and I can't tell you which from here.`);
L('selene', 'q2_selene_trust', `[softening] He'd have followed the money. The iron's gone bad since spring — tools snapping, blades cracking, every smith from here to the Gate cussing — and the ore comes up out of Dunmere. The Consortium's mark is on the wagons and on your bounty. So we go to Dunmere and find out what's wrong with that ore, and I'd bet my house we find out who wants you dead the same day.`);
L('selene', 'q2_selene_alone', `[flat] You'll go with us or you'll go over my husband, and he's a big man. Tesfaye asked. I don't break a promise to a dead friend because a child is grieving and rude about it.`);
L('selene', 'q2_join', `[decisive] Beau, get the shields. We're going to Dunmere.|[to you] I'll tell you what: you're Tesfaye's, and Tesfaye's is ours. That's all the reason we need, and it's all the reason you're getting tonight.`);
Q(2, {
  departure: [B(W, 'q2_road', co(W))],
  openers: {
    0: [
      B('vess', 'q2_pair', { caption: 'The Shore Road. Two men are sitting on a milestone: one pale and long-haired, laughing at nothing; the other small and sour, watching you.' }),
      B('fennick', 'q2_pair'),
      B(W, 'q2_pair_hiwot', co(W)),
      B('fennick', 'q2_pair_ask', { choice: 'q2_pair_where' }),
      B('fennick', 'q2_pair_offer', { choice: 'q2_pair' }),
    ],
    1: [
      B(W, 'q2_wolves', co(W)),
      B('cassian', 'q2_cassian', { caption: 'A young man in a white tabard, running down the road towards you with his hand up.' }),
      B(W, 'q2_cassian_hiwot', co(W)), B('cassian', 'q2_cassian_answer', co(W, { choice: 'q2_cassian' })),
      B('cassian', 'q2_cassian_alone', without(W, { choice: 'q2_cassian' })),
    ],
    2: [
      B('morwin', 'q2_morwin', { caption: 'The Open Hand Inn. A lean man in a patched coat sits on the steps with a sheet of paper in one hand and a wand in the other.' }),
      B(W, 'q2_morwin_hiwot', co(W)),
      B('morwin', 'q2_morwin_hiwot_reply', co(W, { choice: 'q2_morwin' })),
      B('morwin', 'q2_morwin_alone', without(W, { choice: 'q2_morwin' })),
    ],
  },
  closing: [B(W, 'q2_notice', co(W))],
  arrival: [
    B('dorran', 'q2_selene', { caption: 'The inn door opens. A broad man with a shield on his back, and behind him a woman with grey in her braids and a look that has already counted you.' }),
    B('selene', 'q2_selene', { choice: 'q2_selene_how', caption: 'Delphine — Beau’s wife, a Warden druid and an old friend of your late stepfather, Tesfaye.' }),
    B('dorran', 'q2_beau_seal'),
    B('selene', 'q2_selene_seal', { choice: 'q2_selene' }),
    B('selene', 'q2_join', { recruit: ['dorran', 'selene'] }),
  ],
});

// =====================================================================
// Q3 — South to Dunmere
// =====================================================================
L('selene', 'q3_south', `[calm] Dunmere's two days south. Mining town, hard folk, honest as far as it goes. The mayor's a man called Gethin Pryce; he'll be sweating, and he'll pay.|[dry] Stay off the river road after dark. Gnolls come down it. I know because I've buried the people who didn't listen.`);
// Delphine works Hiwot for what Tesfaye kept
L('selene', 'q3_south_hiwot', `[casual, not casual] Hiwot. You grew up in that library with him. Did he keep letters? Anything from the Gate, anything with that iron seal on it?`);
L(W, 'q3_south_hiwot', `[thinking] A locked drawer in his study. I never got it open, and I tried twice, which he knew, because he moved the key. He never moved anything else.|[quiet] It is still there. Whatever it is.`);
L('selene', 'q3_south_hiwot_reply', `[nodding] Then it's still there. Remember that, both of you. If this road ever bends back toward Lanternhold, that drawer's the first door we open.`);
// Itsuki asks before he tells; Delphine wants to know why the Wardens never heard of him
L('ithrel', 'q3_ithrel', `[quiet, from the treeline] Forgive me. I do not mean to alarm you. I have walked beside your road for an hour, deciding whether to speak.|[level] You are going north to the Gate, by the river road? — Then I will be plain. I am Itsuki. A year ago an ogre called Gorruk, who leads the bandit companies in the north, burned a wagon on this road. My wife was in it. I have hunted him since, alone, and alone I cannot reach him.`);
L('selene', 'q3_ithrel_selene', `[sharp] A year hunting one ogre alone, and the Wardens never heard of you. Why didn't you come to us?`);
L('ithrel', 'q3_ithrel_selene_reply', `[calm] I did. A man at a Warden house on the coast told me the north road is not the Wardens' road. He was polite about it.`);
L('selene', 'q3_ithrel_selene_after', `[a beat] ...It ain't. Damn it. It should be.`);
L('ithrel', 'q3_ithrel_ask', `[level] You are going towards him. I would go with you. I ask nothing else.`);
CH('q3_ithrel', [
  { id: 'seal', text: 'Gorruk. Does he use a seal? An iron hand in red wax?', ask: true, reply: B('ithrel', 'q3_ithrel_seal') },
  { id: 'wife', text: 'Your wife. I am sorry. What was her name?', ask: true, aff: { ithrel: 1 }, reply: B('ithrel', 'q3_ithrel_wife') },
  { id: 'yes', text: 'Walk with us. When we find him, he is yours.', recruit: ['ithrel'], aff: { ithrel: 2 }, reply: B('ithrel', 'q3_ithrel_yes') },
  { id: 'no', text: 'I have enough grief in this company. I do not need yours.', aff: { ithrel: -1 }, reply: B('ithrel', 'q3_ithrel_no') },
]);
L('ithrel', 'q3_ithrel_seal', `[thinking] I have seen letters carried to his camp. Sealed. I did not read them; I was too far, and I am no thief. The seal was red, and pressed hard. That is all I can say honestly.`);
L('ithrel', 'q3_ithrel_wife', `[a long pause] Hana. Thank you for asking. No one asks. They ask about him.`);
L('ithrel', 'q3_ithrel_yes', `[a small bow] Then I am in your debt before I have earned my place. I will keep the rear. You will not hear me unless you need to.`);
L('ithrel', 'q3_ithrel_no', `[calm] I understand. I will walk on ahead of you, then. If our roads cross again, I will not ask twice.`);
// Lurleen at the inn — Winston wants the going rate, because the rate says who is paying
L('lessa', 'q3_lessa', `[smiling, from a corner table] There you are, sugar. I've been nursing this cider an hour, waiting on you. Lurleen. You don't know me, but I know that face; I've got it on paper in my pocket.|[light] Three sent before me, I hear. And one of them Merle, who I liked. So this ain't only money now. Just so you know.`);
L('fennick', 'q3_lessa_winston', `[flat] Before the knives, girl. What's the rate? Two hundred, still, or has it gone up since Merle?`);
L('lessa', 'q3_lessa_winston_reply', `[amused] Three now. It goes up every time one of us don't come back. You thinking of switching sides, halfling?`);
L('fennick', 'q3_lessa_winston_after', `[dry] Thinking about who can afford to keep raising it. Carry on.`);
L('lessa', 'q3_lessa_ask', `[light] Well? You going to say something clever, or are we going to get on with it?`);
CH('q3_lessa', [
  { id: 'why', text: 'Why do you do this work?', ask: true, reply: B('lessa', 'q3_lessa_why') },
  { id: 'fight', text: 'Then let it be personal.', reply: B('lessa', 'q3_lessa_fight') },
]);
L('lessa', 'q3_lessa_why', `[a shrug] Because I'm good at it, and because nobody else in this country pays a woman to be good at anything. You'd know, if you'd grown up anywhere but a library.`);
L('lessa', 'q3_lessa_fight', `[pleased] There she is. — There he is. Whichever. Come on, then.`);
// Bahadır and Devendra are already arguing when you reach the ford
L('bramm', 'q3_bramm', `[booming] — and I say AGAIN, red man, you touch that cage and I will fold you into it!|[turning] VALLAHI. Strangers. Good. Strangers, listen: Bahadır, ranger of Kalden, and this is Fındık, who is small but very brave. There is a woman in that fortress, in a cage. Yasemin. A witch of my country, and a good one.`);
L('aurelius', 'q3_bramm', `[disdainful] Kindly disregard the large gentleman; his enthusiasms are exhausting. Devendra, Crimson Wizard of Vashk. The woman in the cage is a Kalden witch, and it is quite evident that a Kalden witch loose in these hills is a calamity waiting for a date.`);
L('bramm', 'q3_bramm_argue', `[hot] Tell them why Vashk burns women, wizard! Tell them what your Crimson masters do with a witch's bones!`);
L('aurelius', 'q3_bramm_argue', `[coolly] Vashk and Kalden have been at war, in one form or another, since before these strangers' grandparents were born. I do not expect the large gentleman to understand policy. I expect him to understand a hundred in gold — which I am offering to you, not to him. A hundred to see her burned, and my considerable talents beside you until the Gate.`);
CH('q3_bramm', [
  { id: 'why', text: 'Why would a Crimson Wizard care what happens to one witch?', ask: true, reply: B('aurelius', 'q3_bramm_why') },
  { id: 'rescue', text: 'We are freeing her. Bahadır, with me.', recruit: ['bramm', 'ysolde'], aff: { bramm: 2 }, heritage: -1, reply: B('bramm', 'q3_bramm_rescue') },
  { id: 'coin', text: 'A hundred gold, and your staff until the Gate. Done.', recruit: ['aurelius'], set: { brammEnemy: true }, gold: 100, heritage: 1, aff: { aurelius: 1 }, reply: B('aurelius', 'q3_bramm_coin') },
  { id: 'both', text: 'The witch lives, and the wizard walks with us and holds his tongue about it.', recruit: ['bramm', 'aurelius', 'ysolde'], aff: { bramm: 1, aurelius: -1 }, reply: B('aurelius', 'q3_bramm_both') },
]);
L('aurelius', 'q3_bramm_why', `[coolly] Because one witch becomes a coven, and a coven becomes a border dispute, and a border dispute becomes my problem. That I am polite about it is a courtesy, not a change of policy.`);
L('bramm', 'q3_bramm_rescue', `[overjoyed] With you! Yes! Fındık, did you hear? We have friends, and they are good ones. Come — the gate is that way, and I am going through it.`);
L('aurelius', 'q3_bramm_coin', `[satisfied] A sensible arrangement. The large gentleman will object; I recommend we not be near him when he does.`);
L('aurelius', 'q3_bramm_both', `[thin] Hold my tongue. Very well. I shall hold it most eloquently. Do not expect me to be happy about it.`);
L('bramm', 'q3_road_block', `[wounded, roaring] You TOOK his coin. You looked at me and you took his coin! Then you go through me, and Fındık, and every tree in this valley — come on! COME ON!`);
// Yasemin asks first; she wants to know what she felt
L('ysolde', 'q3_freed', `[cold, from the cage] Thank you. I would kneel, but the bars have made it difficult.|[looking at you] You. Come closer. Something in your blood woke when you came through the fortress gate; I felt it through the bars like heat from a stove in the next room. I have read auras all my life and I have never felt one like it.|[direct] So tell me, before I decide what to do about it. When it woke — what did it want?`);
CH('q3_ysolde', [
  { id: 'blood', text: 'The warleader\'s throat. I gave it that.', heritage: 1, reply: B('ysolde', 'q3_ysolde_blood') },
  { id: 'nothing', text: 'I felt nothing. I fought, and it ended.', reply: B('ysolde', 'q3_ysolde_nothing') },
  { id: 'what', text: 'You tell me. What is it? Say it plainly.', ask: true, reply: B('ysolde', 'q3_ysolde_what') },
  { id: 'quiet', text: 'Whatever you felt, keep it to yourself in front of the others.', reply: B('ysolde', 'q3_ysolde_quiet') },
]);
L('ysolde', 'q3_ysolde_blood', `[a slow nod] Honest. Good. Then I know what kind of thing it is, if not its name: something that was worshipped once, and fed. I would sooner walk beside it than behind it. Bahadır goes where I go, and Fındık goes where Bahadır goes, and so you have three. Two and a half.`);
L('ysolde', 'q3_ysolde_nothing', `[dry] You felt nothing. Canım, I watched your hand. — Very well; you are not ready to say it, and that is your right. I will walk beside you anyway, and I will keep watching the hand. Bahadır goes where I go.`);
L('ysolde', 'q3_ysolde_what', `[precise] Something that was worshipped once, and should not have been. That is as plain as I can be without lying to you. I read auras, not histories. Now answer mine.`);
L('ysolde', 'q3_ysolde_quiet', `[dry] As you like. I am a witch. Keeping things to myself is most of the work. I will walk beside you, and I will not say it again in front of the others. Bahadır goes where I go.`);
L('bramm', 'q3_joined', `[emphatic] We are yours, {target}. Vallahi. Where you go, we go, and anyone who says otherwise answers to Fındık.`);
// Dunmere: Gethin — and Delphine (or Winston) puts him on the spot about the ore
L('tollan', 'q3_tollan', `[harried, Welsh sing-song] Now then. You'll be Delphine's lot, is it? She sent a boy ahead with a note. Duw, I've been praying somebody would come, and I'm not a praying man.|[wiping his face] Gethin Pryce, mayor of Dunmere, for my sins. The ore's gone bad — comes up grey and brittle and the smiths won't touch it, and my crews won't go below the second level, and I don't blame them.`);
L('selene', 'q3_tollan_selene', `[level] Gethin. Before the crews. Who's been buying your bad ore since spring, and who's been selling the smiths good iron since?`);
L('tollan', 'q3_tollan_selene_reply', `[bitter] Same hand, bach, and you know it or you wouldn't ask. The Iron Consortium out of the Gate takes every wagon — they've the roads. They've been very sorry about the bad ore. Very sorry, and very quick to sell the smiths their own stock instead, at a price.`);
L('selene', 'q3_tollan_selene_after', `[to Beau, quiet] Same hand. Beau, I told you. Buy the ore cheap because it's bad, sell the iron dear because it's the only good iron left. Somebody's making that ore bad on purpose.`);
L('fennick', 'q3_tollan_winston', `[flat] Mayor. Who takes your wagons north? One buyer, or many?`);
L('tollan', 'q3_tollan_winston_reply', `[bitter] One. The Iron Consortium out of the Gate. They've the roads, so they've the ore, and they've been very sorry about it being bad, and very quick to sell the smiths good iron of their own instead.`);
L('fennick', 'q3_tollan_winston_after', `[low, to himself] One buyer. That's what they wanted to know. — Go on, man.`);
L('tollan', 'q3_tollan_ask', `[hopeful] So. Will you go down, and what will it cost me? Say it plain; I've no head for haggling today.`);
CH('q3_tollan', [
  { id: 'crews', text: 'What did your crews see, before they stopped going down?', ask: true, reply: B('tollan', 'q3_tollan_crews') },
  { id: 'iron', text: 'Who profits when your iron goes bad?', ask: true, reply: B('tollan', 'q3_tollan_iron') },
  { id: 'fee', text: 'We will go down. Two hundred in gold, and the town\'s thanks.', gold: 100, set: { tollanFee: true }, aff: { wren_ward: 1 }, reply: B('tollan', 'q3_tollan_fee') },
  { id: 'yes', text: 'We will go down. Pay what the town can spare.', aff: { selene: 1, cassian: 1 }, reply: B('tollan', 'q3_tollan_yes') },
]);
L('tollan', 'q3_tollan_crews', `[low] Lights, on the fourth level, where there's no lamps. Chanting. And a man — the last crew that came up swore it was a man, big, in a robe, standing by something like an altar. They didn't stay to ask him his business, and I don't blame them for that either.`);
L('tollan', 'q3_tollan_iron', `[bitter] Whoever's selling good iron while mine's bad. There's one house doing that on this coast, and it's the Consortium, and I've said so to the magistrate twice and got a shrug both times.`);
L('tollan', 'q3_tollan_fee', `[wincing] Two hundred. There's lovely. — Fine. Fine! Half now and half when you come up, and if you come up with clean ore I'll carry you round the square myself.`);
L('tollan', 'q3_tollan_yes', `[nearly weeping] Bless you. Bless you, I mean it. It won't be much, but it'll be everything we've got, and the whole town will know your name.`);
Q(3, {
  departure: [B('selene', 'q3_south', co('selene')), B('selene', 'q3_south_hiwot', both('selene', W)), B(W, 'q3_south_hiwot', both('selene', W)), B('selene', 'q3_south_hiwot_reply', both('selene', W))],
  openers: {
    0: [
      B('ithrel', 'q3_ithrel', { caption: 'The road south. An elf in grey steps out of the trees with his hands where you can see them.' }),
      B('selene', 'q3_ithrel_selene', co('selene')), B('ithrel', 'q3_ithrel_selene_reply', co('selene')), B('selene', 'q3_ithrel_selene_after', co('selene')),
      B('ithrel', 'q3_ithrel_ask', { choice: 'q3_ithrel' }),
      B('lessa', 'q3_lessa', { caption: 'The Dunmere inn, first night. A woman at a corner table raises her cup to you.' }),
      B('fennick', 'q3_lessa_winston', co('fennick')), B('lessa', 'q3_lessa_winston_reply', co('fennick')), B('fennick', 'q3_lessa_winston_after', co('fennick')),
      B('lessa', 'q3_lessa_ask', { choice: 'q3_lessa' }),
    ],
    1: [B('bramm', 'q3_bramm', { caption: 'The river crossing below the gnoll fortress. A huge ranger is arguing with a wizard in red. A tiger waits beside the ranger.' }), B('aurelius', 'q3_bramm'), B('bramm', 'q3_bramm_argue'), B('aurelius', 'q3_bramm_argue', { choice: 'q3_bramm' })],
    2: [B('bramm', 'q3_road_block', { when: { flag: 'brammEnemy' } })],
  },
  closing: [B('ysolde', 'q3_freed', { when: { recruited: 'bramm' }, choice: 'q3_ysolde', caption: 'The cage in the fortress yard. A woman in a dark robe waits inside it, quite calm.' }), B('bramm', 'q3_joined', { when: { recruited: 'bramm' }, recruit: ['ysolde'] })],
  arrival: [
    B('tollan', 'q3_tollan', { caption: 'Dunmere. The mayor meets you in the square, mopping his face with a handkerchief.' }),
    B('selene', 'q3_tollan_selene', co('selene')), B('tollan', 'q3_tollan_selene_reply', co('selene')), B('selene', 'q3_tollan_selene_after', co('selene')),
    B('fennick', 'q3_tollan_winston', { when: { company: 'fennick', noCompany: 'selene' } }), B('tollan', 'q3_tollan_winston_reply', { when: { company: 'fennick', noCompany: 'selene' } }), B('fennick', 'q3_tollan_winston_after', { when: { company: 'fennick', noCompany: 'selene' } }),
    B('tollan', 'q3_tollan_ask', { choice: 'q3_tollan' }),
  ],
});

// =====================================================================
// Q4 — The Dunmere Mines
// =====================================================================
L(W, 'q4_down', `[low] It smells like wet dog and hot metal. Four levels of that, going down.|[quiet] Keep your light up. I can't see where these stairs end.`);
L('fennick', 'q4_healing', `[firm] That chief keeps healing. I've shut it off for now. Hit him before it wears off.`);
L('selene', 'q4_down', `[calm] Mind the timbers; half of them are rotten. If the kobolds are as thick as the mayor says, we go slow and we keep the healer in the middle. That's me, honey. Don't argue.`);
L('selene', 'q4_flooded', `[calm] Water on the second level, and not from any spring. Somebody opened a channel and let the river in on purpose.|[thoughtful] Kobolds don't plan. Kobolds dig where they're pointed. Whoever's pointing them is below us, and has been for weeks.`);
L('grukhar', 'q4_chamber', `[hoarse] So. Somebody finally came down. The crews have been whispering about a company from the coast for a week; I hoped you were bringing my pay.|[bitter] They lied about that part. I have not seen a coin since spring. I have letters — orders, names, the whole rotten trade. Let me walk out of this hole and they are yours.`);
// Delphine wants one thing confirmed before anyone bargains
L('selene', 'q4_grukhar_selene', `[flat] Your orders. Sealed how? Iron hand, red wax, pressed hard.`);
L('grukhar', 'q4_grukhar_selene_reply', `[a grunt] You've seen it, then.`);
L('selene', 'q4_grukhar_selene_after', `[to you, low] On a wagon, on a bounty, and now on an altar. That's three. — Go on, honey. He's yours to deal with.`);
L('fennick', 'q4_grukhar_winston', `[flat] Which spring shipment, priest? Whose wagons?`);
L('grukhar', 'q4_grukhar_winston_reply', `[hoarse] The Consortium's. They're the ones who hired me. You'll find the details in those letters.`);
CH('q4_grukhar', [
  { id: 'who', text: 'Who lied to you? Say the names.', ask: true, reply: B('grukhar', 'q4_grukhar_who') },
  { id: 'why', text: 'Why foul the ore at all? Who profits from a town starving?', ask: true, reply: B('grukhar', 'q4_grukhar_why') },
  { id: 'walk', text: 'Leave the letters on the altar and walk. Now, before I change my mind.', bypass: true, set: { grukharSpared: true }, aff: { ithrel: -1, cassian: -1 }, heritage: -1, reply: B('grukhar', 'q4_grukhar_walk') },
  { id: 'kill', text: 'I will take the letters off your body.', heritage: 1, reply: B('grukhar', 'q4_grukhar_kill') },
]);
L('grukhar', 'q4_grukhar_who', `[hoarse] A courier called Femi, who keeps a room at the inn in Thornbury and calls himself a wine merchant. Above him, something that signs itself Gorruk and holds the north road. Above THAT, I never met. Nobody meets it. The money used to come down the same way the orders do.`);
L('grukhar', 'q4_grukhar_why', `[a laugh like a cough] You think I asked? Somebody wants iron dear this year. Somebody wants the smiths of the Gate buying from one hand. I was told to keep this mine useless until the spring shipment, and I did, and I was to be paid for it, and I was not.`);
L('grukhar', 'q4_grukhar_walk', `[relieved, backing away] The altar. Read the one with the ogre's mark first; it names the courier and the inn.|[muttering] Veylan keep me. I am finished with iron.`);
L('grukhar', 'q4_grukhar_kill', `[snarling] Then come and take them, foundling.`);
L('selene', 'q4_letters', `[reading] "To the priest, from Femi at the Thornbury inn. Keep the ore fouled until the spring shipment. Gorruk holds the north road; do not use it without his mark."|[calm] A courier, and a bandit lord above him, and above them somebody who buys with a seal instead of a name. The mine was only the bottom of this.`);
L(W, 'q4_letters', `[reading] "Keep the ore fouled until the spring shipment. Gorruk holds the north road." And a name — Femi, at the inn in Thornbury.|[quiet] Tesfaye died over a shipping schedule. That cannot be the whole of it. It cannot.`);
L('tollan', 'q4_thanks', `[overjoyed] The crews went down at dawn and came up with clean ore. Clean! I haven't heard a bar ring true on that anvil since winter. Duw, I could sing.|[earnest] Dunmere owes you more than it can pay, bach. Here's what it can. And — if you go north after the people who did this, the town would take it kindly if you didn't come back alone.`);
// Camp: Hiwot has been wanting to ask this since the inn
L(W, 'q4_camp_hiwot', `[quiet, at the fire] Delphine. Was he a good Warden? Tesfaye. He never talked about it, and I have been wondering all day whether that was because it was bad, or because it was good.`);
L('selene', 'q4_camp_selene', `[after a moment] He was the best of us, sugar. And he quit. Those ain't two different stories either.`);
// Core succession lore belongs before the first heritage choice, on every route.
// Later evidence distinguishes Adigun's iron monopoly from Kolade's use of it.
L('aldric', 'q4_dream', `[echoing] You are dreaming, my child, and I am dead, and both of those things are true at once.|[gentle] That throne belonged to Morrak, the god of murder. He died before you were born. You are one of his children, and part of his power lives in you.|[grave] He intended his children to kill one another and take that power for themselves, until one could claim his throne. You can refuse, my child. You do not have to kill for him.`);
CH('q4_dream', [
  { id: 'ask', text: 'You knew what I was when you brought me to Lanternhold?', ask: true, reply: B('aldric', 'q4_dream_ask') },
  { id: 'reject', text: 'I do not want whatever this is. Starve it.', heritage: -1, set: { dream1: 'reject' }, reply: B('aldric', 'q4_dream_reject') },
  { id: 'embrace', text: 'Show me the throne.', heritage: 1, set: { dream1: 'embrace' }, reply: B('aldric', 'q4_dream_embrace') },
]);
L('aldric', 'q4_dream_ask', `[sorrowful] I did. I brought you there to keep you out of Morrak's followers' reach. I should have told you while I was alive. I was afraid of what it would do to you.`);
L('aldric', 'q4_dream_reject', `[warm] Good. That is the harder road, and the right one. You will wake with a gift for closing wounds. Spend it on other people.`);
L('aldric', 'q4_dream_embrace', `[grieving] I cannot stop you here; only you can. You will wake with a gift for opening wounds. Mind what it makes you want.`);
Q(4, {
  departure: [],
  openers: {
    0: [B(W, 'q4_down', { anyOf: [W, 'selene'] })],
    1: [B('selene', 'q4_flooded', co('selene'))],
    3: [
      B('grukhar', 'q4_chamber', { caption: 'The fourth level opens into a chamber with a black altar. A half-orc in a priest\'s robe stands behind it, and he has been waiting a long time.' }),
      B('selene', 'q4_grukhar_selene', co('selene')), B('grukhar', 'q4_grukhar_selene_reply', co('selene')), B('selene', 'q4_grukhar_selene_after', co('selene', { choice: 'q4_grukhar' })),
      B('fennick', 'q4_grukhar_winston', { when: { company: 'fennick', noCompany: 'selene' } }), B('grukhar', 'q4_grukhar_winston_reply', { when: { company: 'fennick', noCompany: 'selene' } }),
      B('grukhar', 'q4_chamber_ask', { when: { noCompany: 'selene' }, choice: 'q4_grukhar' }),
    ],
  },
  closing: [B('selene', 'q4_letters', { anyOf: ['selene', W] })],
  arrival: [
    B('tollan', 'q4_thanks'),
    B(W, 'q4_camp_hiwot', both(W, 'selene')), B('selene', 'q4_camp_selene', both(W, 'selene')),
    B('aldric', 'q4_dream', { choice: 'q4_dream', caption: 'That night you dream of a field of ash, and a throne of black stone standing in it. Tesfaye is beside it, as though he has always been there.', dream: true }),
  ],
});
L('grukhar', 'q4_chamber_ask', `[hoarse] Well? The letters for my life. It is a fair trade and you know it.`);

// =====================================================================
// Q5 — The Bandit Camp
// =====================================================================
// Yohannes does not lecture. He tests, and decides from the answer how much you have earned.
L('torvald', 'q5_sage', `[amused] You have looked at me three times this week, my child, and decided each time that I was nobody. That is a good instinct. It is wrong this once.|[calm] I am called Yohannes. Tesfaye was my friend before this town had a wall, and I have watched his ward from a distance because that is what he asked of me, and because I am a coward about goodbyes.|[quiet, exact] Now. Before I tell you anything, tell me something. The man in black on the Griffon Road. What did he say to Tesfaye? Word for word, if you can.`);
CH('q5_torvald_test', [
  { id: 'word', text: '"Give the child to me and you may keep your life and your library."', set: { toldYohannes: true }, reply: B('torvald', 'q5_test_word') },
  { id: 'forget', text: 'I did not hear it. I was running, as I was told.', reply: B('torvald', 'q5_test_forget') },
  { id: 'refuse', text: 'Ask him yourself, old man. I am going to.', heritage: 1, reply: B('torvald', 'q5_test_refuse') },
]);
L('torvald', 'q5_test_word', `[very still] "Your library." He knew about the library. Then he has known where you were for years, and waited, and chose his night. That is worse than I feared and better than I guessed: a patient man can be found. — Ask me what you like. I will answer what I can.`);
L('torvald', 'q5_test_forget', `[gently] Then you did as you were told, and you are alive to be asked, and that is the whole of what Tesfaye wanted from that night. Ask me what you like. I will answer what I can.`);
L('torvald', 'q5_test_refuse', `[chuckling] Tesfaye said you would be like this. He said it fondly, mostly. — Ask me what you like, before you go and do it.`);
CH('q5_torvald', [
  { id: 'why', text: 'Why did Tesfaye die? You know. Say it.', ask: true, reply: B('torvald', 'q5_torvald_why') },
  { id: 'armour', text: 'The man in black armour. Who is he?', ask: true, reply: B('torvald', 'q5_torvald_armour') },
  { id: 'help', text: 'Then help. Not riddles — help.', reply: B('torvald', 'q5_torvald_help') },
  { id: 'go', text: 'North, then. Stay out of my way, old man.', heritage: 1, reply: B('torvald', 'q5_torvald_go') },
]);
L('torvald', 'q5_torvald_why', `[gently] He died so that you would live long enough to be told properly, by the right person, in the right place. That place is not a stable yard in Thornbury, and I am not the right person; I am only the one who knew him longest.|[calm] Go north. Find the letters. Paper will bring you to the truth faster than I would, and you will believe paper where you would not believe me.`);
L('torvald', 'q5_torvald_armour', `[carefully] I have not seen his face. I have seen his work. He does not want you dead for anything you have done; he wants you dead for what you are, and he is not the only one who will. That is as much as I will say before you have earned the rest.`);
L('torvald', 'q5_torvald_help', `[dry] I have helped. Twice. You did not see either time, which is what help from me looks like.|[warm] The courier you want keeps a room at the inn here; the bandits are north, in the Gnashing Wood. Bring the letters out alive. That is the help I need from you.`);
L('torvald', 'q5_torvald_go', `[calm] The inn, for the courier. The Gnashing Wood, for the rest. Go well, child, since you will go anyway.`);
// Femi at the inn — Delphine has been in Thornbury often enough to know what does not add up
L('verlan', 'q5_inn', `[nervous, city-polished] I do not know you. I do not know any priest, or any mine. I am a wine merchant, my friend, and I should like you to leave my table.`);
L('selene', 'q5_inn_selene', `[pleasant, deadly] Hollister says you've had that room since the spring, Femi. Now I'll tell you what puzzles me. What does a wine merchant sell for six months in a town with one inn, that already has a cellar?`);
L('verlan', 'q5_inn_selene_reply', `[sweating] Ah-ah — madam, I do not answer to — I have a licence, I have papers —`);
L('selene', 'q5_inn_selene_after', `[to you] He's got papers, honey. I'd like to see them.`);
CH('q5_verlan', [
  { id: 'letters', text: 'A priest under Dunmere had your letters. Your name, your inn, your hand.', ask: true, reply: B('verlan', 'q5_verlan_letters') },
  { id: 'beat', text: 'Wrong answer.', reply: B('verlan', 'q5_verlan_beat') },
  { id: 'pay', text: 'Fifty in gold for the camp\'s location. Then you leave this town tonight.', gold: -50, bypass: true, set: { verlanPaid: true }, reply: B('verlan', 'q5_verlan_pay') },
  { id: 'pocket', text: 'Hiwot. His coat.', when: { company: W }, bypass: true, aff: { wren_ward: 1 }, reply: B(W, 'q5_verlan_pocket') },
]);
L('verlan', 'q5_verlan_letters', `[sweating] Then the priest is a liar. Or dead. Or both. I carry wine. I carry what I am given to carry, and I do not read it, and nobody has ever asked me to.`);
L('verlan', 'q5_verlan_beat', `[panicking] Wait — wait —`);
L('verlan', 'q5_verlan_pay', `[greedy, low] Fifty. Yes. There is a map in my boot: past Holloway Vale, under the old oak line. Do not use the road; they watch the road.|[scurrying] I was never here, o.`);
L(W, 'q5_verlan_pocket', `[murmuring] Map, seal, and a very old sausage. He did not feel a thing.|[low] Past Holloway Vale, under the oaks. There is a note about the road being watched.`);
// Layla and the patrol — Santiago has one question, and it is not an idle one
L('cassian', 'q5_patrol', `[uneasy] Burning Gauntlet. A patrol, this far south of the city. They have someone at sword-point — and with respect, by her look, she is not from anywhere near here.`);
L('ilvara', 'q5_patrol', `[cold] Yes. Stare. A dark elf, above ground, in daylight. You will not see another.|[contemptuous] I am a priestess, and a fugitive, and there is a bounty on me that these three would like to collect. I cured a village of the coughing sickness on my way here. They are arresting me for having the wrong face. Decide what that makes you.`);
L('cassian', 'q5_patrol_cassian', `[formal, tight] A priestess of what, señora? Say it. I would know what I am deciding about.`);
L('ilvara', 'q5_patrol_cassian_reply', `[level] Of a goddess your Order has no name for, boy, and would not like if it did. Does it change your sword arm?`);
L('cassian', 'q5_patrol_cassian_after', `[quietly] It might. — {target}. Your word decides it. Not mine.`);
CH('q5_ilvara', [
  { id: 'why', text: 'What are you fleeing?', ask: true, reply: B('ilvara', 'q5_ilvara_why') },
  { id: 'defend', text: 'Let her go. She is under my protection.', set: { ilvaraSaved: true }, recruit: ['ilvara'], aff: { ilvara: 2, cassian: -2 }, reply: B('ilvara', 'q5_ilvara_defend') },
  { id: 'walk', text: 'This is not my fight. We keep moving.', bypass: true, aff: { cassian: 1, ilvara: -1 }, reply: B('ilvara', 'q5_ilvara_walk') },
  { id: 'sell', text: 'There is a bounty? Then I will take her in myself.', bypass: true, gold: 100, heritage: 1, set: { ilvaraSold: true }, aff: { cassian: -1, selene: -2 }, reply: B('ilvara', 'q5_ilvara_sell') },
]);
L('ilvara', 'q5_ilvara_why', `[flat] My own people. I refused a thing that was asked of me, and among my kind refusal is answered with a knife. I came up into the light because there was nowhere left to go down. I have not found the light kinder, ya stranger. Only brighter.`);
L('ilvara', 'q5_ilvara_defend', `[surprised] Protection. From you. How strange, and how useful.|[dry] Very well. By the deep, I go where you go, until I decide otherwise. Try to be interesting.`);
L('ilvara', 'q5_ilvara_walk', `[flat] Of course. Walk on. Everyone does.`);
L('ilvara', 'q5_ilvara_sell', `[venomous] You will remember this. I will see that you do, from wherever they put me.`);
L('cassian', 'q5_cassian_leaves', `[quietly] I cannot ride beside a company that shelters what this one shelters. I have prayed on it, and I have tried to find a way, and I cannot.|[formal] If your company changes, you will find me at the Open Hand. I hope it does. I hope that very much. God keep you, {target}.`);
L('fennick', 'q5_camp', `[calm] Three ways into a camp like that, man. Loud, quiet, or invited.|[dry] Desmond and I can be invited. Recruiters never look too close at faces that frighten them.`);
L(W, 'q5_camp', `[whispering] Or I go over the palisade and open the back gate while every eye is on the front.`);
CH('q5_camp', [
  { id: 'recruits', text: 'Get us invited.', when: { flag: 'umbralRecruited' }, bypass: true, set: { campInvited: true }, aff: { fennick: 1 }, reply: B('fennick', 'q5_camp_recruits') },
  { id: 'quiet', text: 'Hiwot. The back gate.', when: { company: W }, bypass: true, set: { campQuiet: true }, aff: { wren_ward: 1 }, reply: B(W, 'q5_camp_quiet') },
  { id: 'storm', text: 'Loud. The front gate, now.', heritage: 1, reply: B('$speaker', 'q5_camp_storm') },
]);
L('fennick', 'q5_camp_recruits', `[murmuring] Walk like you already killed somebody today. Desmond — no smiling.|[low] We are in. The big tent is Gorruk's. There is a chained man inside; don't look at him yet.`);
L(W, 'q5_camp_quiet', `[breathless] The back gate is open. Two sentries were sleeping, and one of them is going to wake with a headache and no boots.|[low] The big tent is the lord's. There is a man chained in it who looks as though he still has jokes left.`);
L(W, 'q5_camp_storm', `[resigned] Loud, then. Go for the one with the horns first; the rest will look to him.`);
L('fennick', 'q5_camp_storm', `[flat] Loud. Sawa — fine. The one with the horns is a sergeant; the rest look to him. Kill him first and they look to nobody.`);
// The tent: Cal, and Itsuki's one question
L('cael', 'q5_tent', `[hoarse, drawling] Visitors. Well, ain't that fine. Y'all here for me, or for the ogre? Say me. Please say me.|[urgent] Cal Boone — Warden, or I was 'fore the chain. That chest by the cot is full of letters, and every last one of 'em carries the same seal. Take the chest. Take me. In that order, if it's got to be.`);
L('ithrel', 'q5_tent_ithrel', `[very quiet] Gorruk. Where does he sleep?`);
L('cael', 'q5_tent_ithrel_reply', `[a nod at the cot] Right there, friend. And he's waking up.`);
L('gorruk', 'q5_tent', `[booming] The foundling. In my own tent. Somebody in the city is going to be very embarrassed when I send them your head in a bag.`);
L('ithrel', 'q5_shot', `[very quietly] {target}. I have him. A clean line, no cover. Say yes.`);
CH('q5_ithrel_shot', [
  { id: 'shoot', text: 'Yes. Take it.', noEscape: true, set: { gorrukDead: true }, aff: { ithrel: 2 }, reply: B('ithrel', 'q5_shot_yes') },
  { id: 'hold', text: 'Hold. I want him alive to answer questions.', aff: { ithrel: -2 }, set: { ithrelHeld: true }, reply: B('ithrel', 'q5_shot_no') },
]);
L('ithrel', 'q5_shot_yes', `[exhaling] Thank you. Whatever comes after this — thank you.`);
L('ithrel', 'q5_shot_no', `[tight] Alive. I have waited a year. I can wait until the end of a fight.`);
L('gorruk', 'q5_escape', `[snarling] Not today, foundling. Not for you. The city will finish what I started.`);
L('cael', 'q5_letters', `[grinning through a split lip] Told you. Every one sealed with the iron hand. The Iron Consortium — the trading house in the Gate — pays for the mine, for these bandits, and for you.|[serious] There's a second name under theirs. A mage called Olamide, in the Mirkhollow. They call his place "the other mine." I heard it twice through that tent wall, and men don't say a thing twice unless it matters.`);
CH('q5_rescue', [
  { id: 'free_first', text: 'Break Cal’s chains first. Then take the chest.', set: { caelFreed: true, lettersRecovered: true }, reply: B('cael', 'q5_letters', { caption: 'You break Cal’s chains, then recover the chest. He can barely stand; you will escort him back to the Wardens. First, he shows you what is in the letters.' }) },
  { id: 'letters_first', text: 'Secure the chest first. Then break Cal’s chains.', set: { caelFreed: true, lettersRecovered: true }, reply: B('cael', 'q5_letters', { caption: 'You secure the chest, then break Cal’s chains. He can barely stand; you will escort him back to the Wardens. First, he shows you what is in the letters.' }) },
]);
L('selene', 'q5_letters_selene', `[level] A name, Cal. Not a seal. Somebody at the Consortium signs for this. Who?`);
L('cael', 'q5_letters_selene_reply', `[thinking] No name on the paper, Del, I'll swear to that. But the ogre said "the Gate office" like it was one man, and once — only once — "Adeyinka." Said it the way a fella says a name he's scared of.`);
L('ithrel', 'q5_gone', `[cold] He walked out of that tent because you wished it. I will find him myself.|[flat] Do not follow me.`);
L('ithrel', 'q5_dead', `[quietly] It is done. I thought I would feel taller. I feel as though I could sleep for a year.|[soft] I will stay, if you will have me. There is nothing else I was for.`);
Q(5, {
  departure: [B('torvald', 'q5_sage', { choice: 'q5_torvald_test', caption: 'An old man in a grey cloak sits on the stable wall in Thornbury, eating an apple. You have seen him three times this week.' }), B('torvald', 'q5_sage_ask', { choice: 'q5_torvald' })],
  openers: {
    0: [
      B('verlan', 'q5_inn', { caption: 'Hollister\'s Inn. A soft man in a merchant\'s coat has a table to himself and a cup he has not touched.' }),
      B('selene', 'q5_inn_selene', co('selene')), B('verlan', 'q5_inn_selene_reply', co('selene')), B('selene', 'q5_inn_selene_after', co('selene', { choice: 'q5_verlan' })),
      B('verlan', 'q5_inn_ask', without('selene', { choice: 'q5_verlan' })),
    ],
    1: [
      B('cassian', 'q5_patrol', co('cassian', { caption: 'Following the courier’s map north toward the bandit camp, you reach Holloway Vale. A patrol blocks the crossing.' })),
      B('ilvara', 'q5_patrol', { caption: 'Holloway Vale, on the way to the bandit camp. You come upon a Burning Gauntlet patrol holding a dark-elf priestess at sword-point.' }),
      B('cassian', 'q5_patrol_cassian', co('cassian')), B('ilvara', 'q5_patrol_cassian_reply', co('cassian')), B('cassian', 'q5_patrol_cassian_after', co('cassian', { choice: 'q5_ilvara' })),
      B('ilvara', 'q5_patrol_ask', without('cassian', { choice: 'q5_ilvara' })),
    ],
    2: [
      B('fennick', 'q5_camp', { when: { companyAll: ['fennick', W] } }),
      B(W, 'q5_camp', co(W, { choice: 'q5_camp' })),
      B('fennick', 'q5_camp', { when: { company: 'fennick', noCompany: W }, choice: 'q5_camp' }),
    ],
    3: [
      B('cael', 'q5_tent', { caption: 'The lord\'s tent. A man in chains, a chest, and an ogre in a mage\'s coat rising from the cot.' }),
      B('ithrel', 'q5_tent_ithrel', co('ithrel')), B('cael', 'q5_tent_ithrel_reply', co('ithrel')),
      B('gorruk', 'q5_tent'),
      B('ithrel', 'q5_shot', co('ithrel', { choice: 'q5_ithrel_shot' })),
    ],
  },
  closing: [
    B('gorruk', 'q5_escape', { when: { not: 'gorrukDead' } }),
    B('cael', 'q5_rescue', { lines: [], choice: 'q5_rescue', promptText: 'Gorruk no longer blocks your way. Cal is still chained beside the chest of letters. Get them both out of the tent.' }),
    B('selene', 'q5_letters_selene', co('selene')), B('cael', 'q5_letters_selene_reply', co('selene')),
    B('ithrel', 'q5_gone', { when: { flag: 'ithrelHeld' }, dismiss: ['ithrel'], gone: ['ithrel'] }),
    B('ithrel', 'q5_dead', { when: { flag: 'gorrukDead' } }),
  ],
  arrival: [
    B('cassian', 'q5_cassian_leaves', { when: { recruited: 'cassian', any: [{ flag: 'ilvaraSaved' }, { recruited: 'vess' }] }, dismiss: ['cassian'], gone: ['cassian'] }),
  ],
});
L('torvald', 'q5_sage_ask', `[dry] Well? I can see you are not satisfied. Tell me what you want to know.`);
L('verlan', 'q5_inn_ask', `[stiff] Well? Leave my table, or say what you came to say.`);
L('ilvara', 'q5_patrol_ask', `[cold] Well? You have looked long enough to decide.`);

// =====================================================================
// Q6 — Mirkhollow
// =====================================================================
L('selene', 'q6_forest', `[calm] The Mirkhollow. Old wood — older than the Wardens, older than the Gate. It's got its own druids, and they ain't friends of ours; we keep the balance by law and they keep it by blood.|[quiet] Keep to the deer paths. Anything down here that looks like a road was made by something with a great many legs.`);
L(W, 'q6_forest', `[low] Old trees. Very old, very big. Things in the branches that stop moving when we look.|[a breath] I will go first. No. I will not. You go first.`);
// Kaito reads you before he asks anything of you
L('faelen', 'q6_web', `[cheerful, from above] Ah — hello. Yes. Up here. In the web. It is exactly as embarrassing as it looks, and I apologise for it.|[appraising] Not bounty hunters; you walk too close together. A green sash — Wardens, then, or with Wardens. Good. Wardens cut people down for nothing. Kaito. I hunt bounties, mostly, and I was hunting a wyvern's head when the spiders took offence.`);
CH('q6_faelen', [
  { id: 'wyvern', text: 'Who pays a bounty on a wyvern?', ask: true, reply: B('faelen', 'q6_faelen_wyvern') },
  { id: 'price', text: 'Wardens cut for nothing. I am not a Warden. What is your debt worth?', ask: true, aff: { faelen: 1 }, reply: B('faelen', 'q6_faelen_price') },
  { id: 'cut', text: 'Hold still. I’ll cut you free. You can ride with us.', recruit: ['faelen'], set: { faelenRecruited: true }, aff: { faelen: 1 }, reply: B('faelen', 'q6_faelen_cut') },
  { id: 'leave', text: 'Spiders have to eat too.', heritage: 1, set: { faelenLeft: true }, reply: B('faelen', 'q6_faelen_leave') },
]);
L('faelen', 'q6_faelen_wyvern', `[bright] The magistrate of Thornbury, whose sheep keep disappearing. Three hundred in gold, and — I am told — the gratitude of a woman with a very fine face. I am still negotiating the second part.`);
L('faelen', 'q6_faelen_price', `[delighted] Ah. Now we are talking properly. My bow, until your road ends. And a thing I saw, which I think you will want: east of here, past the wyvern cliffs, there is a mine under the hill. Men in iron livery go in at dawn and men in chains come out at dusk. I did not go closer. I hunt beasts. That did not look like a beast.`);
L('faelen', 'q6_faelen_cut', `[relieved] You are my favourite person. I say that to everyone. This once, forgive me, I mean it.|[smiling] I will come along, if you will have me. The wyverns are that way, and so, I suspect, is whatever you came into these woods to find.`);
L('faelen', 'q6_faelen_leave', `[calling after you] Fair enough! If you change your mind, I will be — well. Here.`);
L('nettle', 'q6_grove', `[fierce] Far enough. This wood is not a road, and you are not welcome on it. The Umbra hold this grove, and the Umbra say turn around. Eh?|[sniffing] You carry iron from the Gate. The wood smells it on you. Which of you is theirs?`);
L('selene', 'q6_grove_selene', `[steady] None of us. The iron's what we took off the men who are poisoning your river. We're here to shut their mine.`);
// The Mzee is at the stones the whole time. He used to be a name Wanjiru invoked and a
// boss the player killed without ever hearing him speak; now the thing she reports about
// him — that he would rather they bled than talked — is something the player watches him
// say, and her "he can take it up with the trees" has something to answer.
L('thornwise', 'q6_grove_mzee', `[old, unhurried] Wanjiru. They have been told to leave.|[flat] I have buried nine of ours since that mine opened. If these people work for the Consortium, they will get no mercy from me.|[cold] Hear them out if you must. They stay where they are.`);
L('thornwise', 'q6_grove_mzee_peace', `[flat, from the trees] Wanjiru. If they are lying, you are the one who let them in.|[grudging] Go with them, then. Make sure they shut that mine. I expect you back when it is done.`);
L('nettle', 'q6_grove_selene_reply', `[narrowing] A Warden says so. Wardens said so about the last mine, and the last mine is still there.|[low] Mzee Kamau would sooner have you bleed than speak. I would sooner hear you first. So. Speak.`);
L('nettle', 'q6_grove_ask', `[low] No answer. Then hear this: the Mzee would sooner have you bleed than speak. I would sooner hear you first. Speak, or turn around.`);
CH('q6_nettle', [
  { id: 'ask', text: 'What has been done to this wood?', ask: true, set: { heardTheWood: true }, reply: B('nettle', 'q6_nettle_ask') },
  { id: 'talk', text: 'We are here for the men who poison your river with their mine. Your enemy is ours.', when: { any: [{ company: 'selene' }, { heritageMax: 0 }, { flag: 'heardTheWood' }] }, bypass: true, recruit: ['nettle'], set: { druidsPeace: true }, aff: { nettle: 2, selene: 1 }, reply: B('nettle', 'q6_nettle_talk') },
  { id: 'fight', text: 'Move, or be moved.', heritage: 1, set: { druidsFought: true }, reply: B('nettle', 'q6_nettle_fight') },
]);
L('nettle', 'q6_nettle_ask', `[bitter] Dead fish for a mile downstream. Stags with sores on their flanks. And men — men in chains, walking into a hole in the hill every dawn, and fewer walking out. The wood knows what is being done to it. It does not know how to stop it. I do.`);
L('nettle', 'q6_nettle_talk', `[grudging] Then we want the same thing, and I would rather kill them beside you than argue with the Mzee about killing you.|[decisive] Sawa. I am coming. He can take it up with the trees.`);
L('nettle', 'q6_nettle_fight', `[snarling] Then the roots will have you. MZEE! Kamau! They have chosen!`);
L('faelen', 'q6_wyverns', `[bright] There she is. The matriarch. That head is worth three hundred in gold and a magistrate's gratitude, and I intend, respectfully, to collect both.`);
L(W, 'q6_wyverns', `[appalled] It has a sting on its tail. Its tail has a sting.`);
L('selene', 'q6_gate', `[calm] Iron livery on the guards. Consortium men. And the tall one — Kestrel. A sword for hire who'll guard anything for anybody. I've crossed him before.|[flat] He won't talk. Don't waste your breath on it.`);
L('selene', 'q6_fire', `[quiet] Sit a minute. The forest's loud tonight and I want to say a thing before I lose the nerve.|[soft] Tesfaye wrote to us every year about you. Twenty letters. I feel like I've known you since you could walk, and I met you a month ago. It's a strange thing. It ain't an unwelcome one.`);
CH('q6_selene_fire', [
  { id: 'letters', text: 'What did he write?', ask: true, reply: B('selene', 'q6_fire_letters') },
  { id: 'warm', text: 'He wrote to me about you, too. Not twenty letters. But enough.', aff: { selene: 2 }, reply: B('selene', 'q6_fire_warm') },
  { id: 'deflect', text: 'You should sleep. It is a long walk to the mine.', reply: B('selene', 'q6_fire_deflect') },
  { id: 'dorran', text: 'Beau is a fortunate man.', aff: { selene: 1, dorran: 1 }, reply: B('selene', 'q6_fire_dorran') },
]);
L('selene', 'q6_fire_letters', `[fond] The first year, that you'd learned to walk and walked straight into the library. The seventh, that you'd stolen honey from the brothers and let a cat take the blame. The last — that you were ready, and that he wasn't.`);
L('selene', 'q6_fire_warm', `[a soft laugh] Enough. Yeah. That's a very Tesfaye amount.|[warm] Goodnight, {target}. Wake me if the trees start walking.`);
L('selene', 'q6_fire_deflect', `[quiet] All right. Get some rest. We can talk another time.|[calm] Goodnight.`);
L('selene', 'q6_fire_dorran', `[fond] He is. He also snores like a bear in a barrel, so the fortune runs both ways.|[warm] Goodnight, {target}. Don't you tell him I said that.`);
Q(6, {
  departure: [B('selene', 'q6_forest', { anyOf: ['selene', W] })],
  openers: {
    0: [B('faelen', 'q6_web', { choice: 'q6_faelen', caption: 'The nest: white web thick as sailcloth between the trunks, and a man hanging in it upside down, apparently at his ease.' })],
    1: [
      B('nettle', 'q6_grove', { caption: 'A ring of standing stones in a clearing. A woman in bark and hide steps out of nothing and puts a staff across the path.' }),
      B('thornwise', 'q6_grove_mzee', { caption: 'An old man is sitting against the nearest stone. He does not get up.' }),
      B('selene', 'q6_grove_selene', co('selene')), B('nettle', 'q6_grove_selene_reply', co('selene', { choice: 'q6_nettle' })),
      B('nettle', 'q6_grove_ask', without('selene', { choice: 'q6_nettle' })),
    ],
    2: [
      // Openers are prepared when the encounter opens, so this sees the flag the grove set.
      B('thornwise', 'q6_grove_mzee_peace', { when: { flag: 'druidsPeace' } }),
      B('faelen', 'q6_wyverns', co('faelen')), B(W, 'q6_wyverns', { when: { company: W, noCompany: 'faelen' } })],
    3: [B('selene', 'q6_gate', co('selene'))],
  },
  closing: [],
  arrival: [B('selene', 'q6_fire', { when: { recruited: 'selene', alive: 'selene' }, choice: 'q6_selene_fire', caption: 'Delphine, Beau’s wife and Tesfaye’s old friend, sits beside you at the fire.' })],
});

// =====================================================================
// Q7 — The Iron Mine
// =====================================================================
L('dorran', 'q7_gate', `[grim] Slaves. They're w-working slaves in there. I can hear the chains from here.|[steady] I'm going to the bottom for 'em, {target}. Whatever else we do today. Tell me you're with me.`);
CH('q7_dorran', [
  { id: 'with', text: 'We are with you. Everyone comes out.', aff: { dorran: 2, selene: 1 }, reply: B('dorran', 'q7_dorran_with') },
  { id: 'mission', text: 'The mage first. Then the slaves, if there is time.', aff: { dorran: -1 }, reply: B('dorran', 'q7_dorran_mission') },
]);
L('dorran', 'q7_dorran_with', `[fierce] Good. G-good. The front's mine. Nothing gets past me today.`);
L('dorran', 'q7_dorran_mission', `[quiet] There'll be time. I'll m-make time.`);
L(W, 'q7_cages', `[sick] They keep them in cages between shifts. Like dogs. Worse than dogs; I have seen dogs kept better than this.`);
// Dai in the cage — he asks who you are with, because the answer decides whether he talks
L('durnik', 'q7_cage', `[gravelly, Welsh] Well now. Either you're the new drivers or the old ones are dead. Which is it, then? — No, don't tell me; you're too muddy for drivers, and they'd have shot me by now.|[hopeful] Dai Morgan. Priest of the deep places, and the last of the clan that cut this mine before the Consortium took it with paper and knives. I know every valve in it — including the one at the bottom that lets the river in.`);
L('dorran', 'q7_cage_beau', `[urgent] The ch-chain-gang. Where do they keep them between shifts?`);
L('durnik', 'q7_cage_beau_reply', `[grim] Bottom level, by the valve room, so the drivers can drown them if the mine's ever taken. Mind that, shield-man. Whoever turns that wheel turns it on them.`);
CH('q7_durnik', [
  { id: 'paper', text: 'Paper and knives? How does a trading house take a dwarven mine?', ask: true, reply: B('durnik', 'q7_durnik_paper') },
  { id: 'free', text: 'The old ones are dead. Get up; you are with us.', recruit: ['durnik'], set: { durnikFreed: true }, aff: { durnik: 2 }, reply: B('durnik', 'q7_durnik_free') },
  { id: 'leave', text: 'Stay where you are. We will come back for you.', set: { durnikLeft: true }, heritage: 1, reply: B('durnik', 'q7_durnik_leave') },
]);
L('durnik', 'q7_durnik_paper', `[grim] A debt we didn't owe, bought off a man who didn't own it, and enforced by men with swords while the magistrate looked at the ceiling. My cousins argued. My cousins are on the lowest level now, and they don't argue anymore.`);
L('durnik', 'q7_durnik_free', `[grunting to his feet] With you. Aye. There's lovely. Mind the third level; the mage keeps his study there, and he doesn't care for knocking.`);
L('durnik', 'q7_durnik_leave', `[flat] Come back for me. Aye. Everybody says that, bach.`);
// Olamide's study — Dai has one question before anyone asks about papers
L('malvane', 'q7_study', `[irritated] Get away from my desk. Those ledgers are Consortium property.|[cold] Guards, kill them. The Consortium wants this mine kept running.`);
L('durnik', 'q7_study_dai', `[very level] Morgan. Bryn and Gareth Morgan. My cousins. Which ledger are they in, mage?`);
L('malvane', 'q7_study_dai_reply', `[without looking up] Ledger four. The deceased column, I should think; the deep levels take the dwarves first. Guards!`);
L('durnik', 'q7_study_dai_after', `[quiet] ...Then I'll be having ledger four. Go on, {target}.`);
L('fennick', 'q7_study_winston', `[flat] Two sets of books, mage. Which one goes to the Gate?`);
L('malvane', 'q7_study_winston_reply', `[contemptuous] Both. One to each partner, and neither to you. Guards!`);
CH('q7_malvane', [
  { id: 'who', text: 'Who do you answer to? Say the name and I may let you keep your ledgers.', ask: true, reply: B('malvane', 'q7_malvane_who') },
  { id: 'fight', text: 'Enough. We’re freeing the prisoners.', reply: B('malvane', 'q7_malvane_fight') },
]);
L('malvane', 'q7_malvane_who', `[contemptuous] To the Gate office, and the Gate office answers to the men whose names are on the letters you have not yet found. You will not find them, my friend. Guards!`);
L('malvane', 'q7_malvane_fight', `[cold] So be it.`);
L('durnik', 'q7_valve', `[urgent] The valve room. Turn the great wheel and the river takes the bottom two levels in the time it takes to say a prayer.|[hard] Your shield-man went below for the chain-gang. He isn't up yet.`);
L('selene', 'q7_valve', `[tight] Beau's still down there. {target}. Beau is still down there.`);
L(W, 'q7_valve', `[frantic] Beau is below with the chain-gang. If you turn that wheel he drowns with them.`);
CH('q7_flood', [
  { id: 'now', text: 'Turn the wheel. Now.', bypass: true, set: { floodedEarly: true }, kill: ['dorran'], aff: { selene: -3, durnik: -1, wren_ward: -1 }, heritage: 1, reply: B('$speaker', 'q7_flood_now') },
  { id: 'wait', text: 'No one touches that wheel until Beau is up. Hold this room.', set: { waitedForDorran: true }, aff: { selene: 1, dorran: 1 }, reply: B('dorran', 'q7_flood_wait') },
]);
L('selene', 'q7_flood_now', `[screaming] NO —|[broken] He was coming up. He was coming up. You heard the chains. You heard him.`);
L(W, 'q7_flood_now', `[shouting] NO —|[hollow] He was coming up. We could hear the chains.`);
L('dorran', 'q7_flood_wait', `[shouting from below] Coming up! Nineteen of 'em and me! Hold the d-door — they're right behind us!`);
L('dorran', 'q7_after', `[exhausted] Nineteen. Every one. Not one left in the dark.|[quiet] Thank you for holding. I heard you say it. I won't forget it.`);
L('selene', 'q7_after_dead', `[hollow] Olamide's papers. Names in the city. Take them. I don't care.|[cold] I'll finish this road because Tesfaye asked it of me. Don't you speak to me until it's done.`);
L('selene', 'q7_papers', `[reading] Olamide wrote to three men at the Consortium's tower in Varenholm's Gate. Adigun Adeyinka. Bankole. Rotimi.|[calm] Adeyinka. Cal heard right. The bandits are broke and the mine's drowned, and the road north is open, and so, at last, are the names.`);
L(W, 'q7_papers', `[reading] Three names at the Consortium's tower in the city. Adigun Adeyinka, Bankole, Rotimi.|[quiet] The road north is open now. There is nothing between us and the Gate but the Gate.`);
L('vess', 'q7_papers', `[soft] Those papers. Names, seals, routes. The people we answer to would pay plenty to read them before the Gauntlet does.|[softer] Let Winston copy them tonight, and we stay quiet and useful for as long as you like.`);
L('fennick', 'q7_papers', `[flat] He means it. So do I. It is the only thing we were ever on this road for, and I told you I would say so before the day came. This is the day.`);
CH('q7_vess_papers', [
  { id: 'who', text: 'Who are the people you answer to?', ask: true, reply: B('fennick', 'q7_papers_who') },
  { id: 'give', text: 'Copy them tonight. The originals go to the city.', set: { umbralPapers: true }, aff: { vess: 2, fennick: 2, selene: -1, cassian: -1 }, reply: B('fennick', 'q7_papers_give') },
  { id: 'refuse', text: 'No. And if either of you touches them, you leave this company.', set: { umbralBetrayed: true }, dismiss: ['vess', 'fennick'], gone: ['vess', 'fennick'], reply: B('vess', 'q7_papers_refuse') },
]);
L('fennick', 'q7_papers_who', `[level] The Umbral Hand. You have heard the name; everybody has, and everybody pretends they haven't. Merchants, mostly, of a kind. They want to know who is cornering iron on this coast, and why, and they don't much care who dies of the knowing.`);
L('fennick', 'q7_papers_give', `[nodding] Copies. Fair. You won't regret keeping us.|[dry] You may regret Desmond. That is a separate matter.`);
L('vess', 'q7_papers_refuse', `[very calm] Then we go, and you will see us again, and it won't be as friends.|[light] It never was, really. I did tell you stories like yours get told badly.`);
L('aldric', 'q7_dream', `[echoing] The throne is closer this time, my child. You'll keep seeing it as your power grows.|[grave] Morrak, the god of murder, left many children. You are one of them. Some of your kin have begun killing the others for his power. The man who hunts you is using the Consortium's money and hired killers to find them.|[fading] Each child he kills makes him stronger and removes another rival for the throne. That is why he wants you dead. You can stop him without claiming Morrak's throne yourself.`);
CH('q7_dream', [
  { id: 'others', text: 'Others. How many? Who?', ask: true, reply: B('aldric', 'q7_dream_others') },
  { id: 'reject', text: 'I will stop him. I will not claim Morrak\'s throne.', heritage: -1, set: { dream2: 'reject' }, reply: B('aldric', 'q7_dream_reject') },
  { id: 'embrace', text: 'If there are others, I had better be the strongest.', heritage: 1, set: { dream2: 'embrace' }, reply: B('aldric', 'q7_dream_embrace') },
]);
L('aldric', 'q7_dream_others', `[quiet] I do not know how many are still alive. Most were raised by mortal families, as you were. Some may not know what they are. The man in black has been searching for them for years.`);
L('aldric', 'q7_dream_reject', `[proud] Twice now. It grows harder each time and you keep saying no. That is what courage is. No one warns you that it is dull.`);
L('aldric', 'q7_dream_embrace', `[grieving] The strongest of them is waiting for you at the end of this road, and he thinks exactly that.|[fading] Please, my child. Be careful what you become on the way to him.`);
// At the mine, acknowledge the grove outcome: Wanjiru wants to stop the pollution,
// or Hiwot regrets fighting the druids when they shared the party's goal.
L('nettle', 'q7_mine_umbra', `[quiet] So this is the mine.|[hard] For two years, I have watched the river get worse. Dead fish, sick animals. All because of this place.|[firm] I want this mine shut before we leave.`);
L(W, 'q7_mine_umbra_none', `[low] The druids wanted this mine shut down too.|[dry] We could have had their help. Instead, we picked a fight with them. That was clever of us.`);
Q(7, {
  departure: [B('dorran', 'q7_gate', co('dorran', { choice: 'q7_dorran' }))],
  openers: {
    0: [B('nettle', 'q7_mine_umbra', co('nettle')), B(W, 'q7_mine_umbra_none', { when: { flag: 'druidsFought', company: W } })],
    1: [B(W, 'q7_cages', co(W))],
    2: [
      B('durnik', 'q7_cage', { caption: 'A cage of iron bars at the end of the second level. The dwarf inside has been waiting in the dark long enough to be polite about it.' }),
      B('dorran', 'q7_cage_beau', co('dorran')), B('durnik', 'q7_cage_beau_reply', co('dorran', { choice: 'q7_durnik' })),
      B('durnik', 'q7_cage_ask', without('dorran', { choice: 'q7_durnik' })),
    ],
    3: [
      B('malvane', 'q7_study', { caption: 'A study cut into the rock, warm and dry, with shelves of ledgers. A man in a good coat does not look up from his writing.' }),
      B('durnik', 'q7_study_dai', co('durnik')), B('malvane', 'q7_study_dai_reply', co('durnik')), B('durnik', 'q7_study_dai_after', co('durnik', { choice: 'q7_malvane' })),
      B('fennick', 'q7_study_winston', { when: { company: 'fennick', noCompany: 'durnik' } }), B('malvane', 'q7_study_winston_reply', { when: { company: 'fennick', noCompany: 'durnik' } }),
      B('malvane', 'q7_study_ask', { when: { noCompany: 'durnik' }, choice: 'q7_malvane' }),
    ],
    4: [B('durnik', 'q7_valve', { when: { company: 'dorran', flag: 'durnikFreed' } }), B('selene', 'q7_valve', { when: { company: 'dorran' }, anyOf: ['selene', W], choice: 'q7_flood' })],
  },
  closing: [
    B('dorran', 'q7_after', { when: { flag: 'waitedForDorran' } }),
    B('selene', 'q7_after_dead', { when: { flag: 'floodedEarly', company: 'selene' } }),
    B('selene', 'q7_papers', { when: { not: 'floodedEarly' }, anyOf: ['selene', W] }),
    B(W, 'q7_papers', { when: { flag: 'floodedEarly' } }),
  ],
  arrival: [
    B('vess', 'q7_papers', { when: { recruited: 'vess', not: 'umbralBetrayed' } }),
    B('fennick', 'q7_papers', { when: { recruited: 'fennick', not: 'umbralBetrayed' }, choice: 'q7_vess_papers' }),
    B('aldric', 'q7_dream', { choice: 'q7_dream', caption: 'The throne again, nearer. Figures stand in the ash now, hundreds of them, and every one of them is looking at the chair.', dream: true }),
  ],
});
L('durnik', 'q7_cage_ask', `[hopeful] So. Are you letting me out, or are you the polite sort of drivers?`);
L('malvane', 'q7_study_ask', `[cold] Well? You have interrupted my afternoon. Say why.`);

// =====================================================================
// Q8 — Varenholm's Gate
// =====================================================================
// Emeka Obi is a soldier writing a report; he wants a number he can put in it
L('halloran', 'q8_span', `[gruff] Serpent's Span. Papers. — Ah. You are the company from the south. The one that drowned the Consortium's mine; half the city has heard it, the Consortium made sure of that when they went crying to the Council.|[plain] Emeka Obi, Burning Gauntlet. One question before anything, and I want a number, not a story. The Consortium told the Council there were no slaves in that mine. How many did you see in chains?`);
CH('q8_span_count', [
  { id: 'nineteen', text: 'Nineteen. I counted them out.', when: { flag: 'waitedForDorran' }, set: { toldNineteen: true }, reply: B('halloran', 'q8_count_nineteen') },
  { id: 'many', text: 'Cages of them. I did not count.', reply: B('halloran', 'q8_count_many') },
  { id: 'none', text: 'That is between me and the Duke.', reply: B('halloran', 'q8_count_none') },
]);
L('halloran', 'q8_count_nineteen', `[writing] Nineteen. Good. A number a man can read aloud to a room of merchants. I will remember it when they tell me again that there were none.`);
L('halloran', 'q8_count_many', `[grunting] Cages. Ah-ah. "Cages" is a word the Council can argue with; a number they cannot. Next time, count. — It is not a small thing, what you did down there. I will say that once.`);
L('halloran', 'q8_count_none', `[flat] Between you and the Duke. Very well. The Duke will ask the same question, and he does not like "between" any more than I do.`);
L('halloran', 'q8_jobs', `[plain] Duke Adebayo wants a word with you, but first I want two things done, and I would rather they were done by people the Consortium already hates. One: something under the docks is eating dock-workers, and the sewer-men will not go down. Two: the Nine Lanterns trading house has stopped being the Nine Lanterns. Same faces, wrong people; I cannot explain it better than that, and I have tried.|[flat] Do both. Then the Duke.`);
CH('q8_halloran', [
  { id: 'why', text: 'Why does the Duke want me? He does not know me.', ask: true, reply: B('halloran', 'q8_halloran_why') },
  { id: 'yes', text: 'Consider it done.', aff: { cassian: 1 }, reply: B('halloran', 'q8_halloran_yes') },
  { id: 'pay', text: 'The Gauntlet pays for this, I assume.', aff: { wren_ward: 1 }, reply: B('halloran', 'q8_halloran_pay') },
]);
L('halloran', 'q8_halloran_why', `[quiet] Because the iron trouble has a name now, and the name is the Iron Consortium, and you are the only people alive who walked out of their mine with proof. He does not know you. He knows that. Do the jobs, my friend. Bring the proof.`);
L('halloran', 'q8_halloran_yes', `[approving] Good answer. The docks are that way. Hold your breath.`);
L('halloran', 'q8_halloran_pay', `[snorting] It pays. Not well. Nobody in this city pays well except the people you are fighting.`);
L(W, 'q8_sewers', `[gagging] I have been in a mine, a fortress and a spider nest this month, and THIS is the worst. This is the worst place.`);
L('durnik', 'q8_sewers', `[approving] Good stonework, mind. Dwarven, some of it, and old. Shame about the smell.`);
L('faelen', 'q8_door', `[murmuring] Doorman. Big. Bored. I can talk us past him; bored men love a story, and I have several.`);
L(W, 'q8_door', `[whispering] Doorman. I can get us past him. He will not even remember we were here.`);
L('fennick', 'q8_door', `[flat] Doorman. Leave him to me. Everybody has a price, and his is written on his face.`);
CH('q8_door', [
  { id: 'faelen', text: 'Kaito. Talk.', when: { company: 'faelen' }, bypass: true, aff: { faelen: 1 }, reply: B('faelen', 'q8_door_faelen') },
  { id: 'wren_ward', text: 'Hiwot. Quietly.', when: { company: W }, bypass: true, aff: { wren_ward: 1 }, reply: B(W, 'q8_door_wren') },
  { id: 'fennick', text: 'Winston. Pay him.', when: { company: 'fennick' }, bypass: true, gold: -30, reply: B('fennick', 'q8_door_fennick') },
  { id: 'force', text: 'We go through him.', reply: B('$speaker', 'q8_door_force') },
]);
L('faelen', 'q8_door_faelen', `[pleased] — and that is how I lost the boot. He is still laughing. In, in, before he thinks about it.`);
L(W, 'q8_door_wren', `[smug] Side window. He is asleep on his feet. I told you.`);
L('fennick', 'q8_door_fennick', `[flat] Thirty gold and the man has gone for a very long lunch.`);
L(W, 'q8_door_force', `[sighing] Loud again. I am keeping a list.`);
L('faelen', 'q8_door_force', `[resigned] Through him. Very well. I will apologise to him afterwards; it seems only polite.`);
L('fennick', 'q8_door_force', `[dry] Through him, then. Mind — a man that size falls slow.`);
L('selene', 'q8_faces', `[disturbed] That's the merchant's face and it ain't the merchant. Look at the eyes, honey. Nothing lives behind 'em.|[hard] Shape-thieves. They wear you after they kill you. Don't let one get behind you.`);
L(W, 'q8_faces', `[horrified] That is the merchant's face. That is his FACE and it is not him. Nothing is behind the eyes.`);
// Adebayo is precise; his first question is about custody of the evidence
L('halvard', 'q8_duke', `[weary] So. The company that drowned a mine. Obi says you are rude and effective. I have use for both.|[precise] Before I say anything worth hearing: the papers you carried out of that mine. Who else has seen them? Every name. I do not enjoy surprises in Council.`);
CH('q8_duke_seen', [
  { id: 'nobody', text: 'My company, and now you.', reply: B('halvard', 'q8_seen_nobody') },
  { id: 'hand', text: 'The Umbral Hand has copies. I allowed it.', when: { flag: 'umbralPapers' }, reply: B('halvard', 'q8_seen_hand') },
  { id: 'wardens', text: 'Wardens. Delphine of the Open Hand read them first.', when: { recruited: 'selene' }, reply: B('halvard', 'q8_seen_wardens') },
]);
L('halvard', 'q8_seen_nobody', `[a nod] Good. Keep it so. A paper nobody has read is worth twice one everybody has argued about.`);
L('halvard', 'q8_seen_hand', `[a long breath] The Umbral Hand. Then the whole market will have read them by the week's end, and the Council will hear it from fishwives before it hears it from me. Ah-ah. — Fine. Faster than my clerks, at least. It is not a small thing you have done, and I am not yet sure whether it was a good one.`);
L('halvard', 'q8_seen_wardens', `[dry] Wardens. Then they are honest and nobody in this city will believe them. Good. That is one problem I already know how to solve.`);
L('halvard', 'q8_duke_work', `[precise] The Consortium poisoned its rivals' ore and kept its own iron to sell at a higher price. Adigun blames Calder for the shortage. Now someone is demanding we settle it with a war. The Council votes in a fortnight. I need the orders from their tower to prove who caused this, before ten thousand people die over a shortage those men arranged.`);
CH('q8_halvard', [
  { id: 'city', text: 'Then we will get them. For the city.', allegianceLean: 'gauntlet', aff: { cassian: 1, selene: 1 }, reply: B('halvard', 'q8_halvard_city') },
  { id: 'pay', text: 'For the city, and for a price.', aff: { wren_ward: 1, faelen: 1 }, reply: B('halvard', 'q8_halvard_pay') },
  { id: 'blood', text: 'The Consortium has been trying to kill me since Lanternhold. Why me, Duke?', set: { askedHalvard: true }, reply: B('halvard', 'q8_halvard_blood') },
]);
L('halvard', 'q8_halvard_city', `[nodding] Good. I will remember that when this is over. Dukes remember more than people think, my friend.`);
L('halvard', 'q8_halvard_pay', `[dry] Five hundred on delivery. Obi will scowl. Ignore him; he scowls at me too.`);
L('halvard', 'q8_halvard_blood', `[careful] I do not know, and I will not insult you with a guess. I know they were hunting Tesfaye's ward before they were hunting anyone else, and Tesfaye was a Warden who spent twenty years hiding something in a library.|[quiet] Bring me the papers. Whatever they are hiding, it will be in them.`);
Q(8, {
  departure: [B('halloran', 'q8_span', { choice: 'q8_span_count', caption: 'Serpent\'s Span: a bridge of black stone, a checkpoint, and behind it the towers of Varenholm\'s Gate. An officer with a burn-scarred jaw is reading your papers.' }), B('halloran', 'q8_jobs', { choice: 'q8_halloran' })],
  openers: {
    0: [B(W, 'q8_sewers', co(W)), B('durnik', 'q8_sewers', { when: { company: 'durnik', noCompany: W } })],
    1: [B('faelen', 'q8_door', { anyOf: ['faelen', W, 'fennick'], choice: 'q8_door' })],
    2: [B('selene', 'q8_faces', co('selene')), B(W, 'q8_faces', { when: { company: W, noCompany: 'selene' } })],
  },
  closing: [],
  arrival: [B('halvard', 'q8_duke', { choice: 'q8_duke_seen', caption: 'The Ducal Palace. A tired man in a red coat sits at a table covered in maps and does not get up.' }), B('halvard', 'q8_duke_work', { choice: 'q8_halvard' })],
});

// =====================================================================
// Q9 — The Consortium Tower
// =====================================================================
L('halvard', 'q9_plan', `[precise] The Consortium is hiring swords. Go in as hired guards and search the top-floor offices. We need the orders bearing Adigun's seal.|[dry] If you can do it without burning the tower down, the city would appreciate it. If you cannot, the city will understand.`);
// Sanni's account is a deliberate lie: he attributes his own war plan to Adigun.
// The player can investigate that claim and refuse to kill at the Q10 summit.
L('sarn', 'q9_tower', `[quiet, city-formal] Tesfaye's ward. I am Sanni. I knew him through the keep's book trade. He wrote about you and Hiwot. I was sorry to hear what happened on the Griffon Road.|[low] Adigun Adeyinka is my father. Those orders from the mine carry his seal. He and his partners have gone to Lanternhold for a hearing over the iron shortage. He means to persuade the keepers that Calder is to blame.|[urgent] He is preparing a war with Calder. Kill him before he buys the Council's vote and you could save thousands of lives. Go to the summit at Lanternhold. Read the evidence first, and hear what he has to say. I will meet you there.`);
L(W, 'q9_lobby', `[whispering] A clerk. Two guards. A very long list of names on his desk, and we are not on it.`);
L('selene', 'q9_lobby', `[murmuring] A clerk with a list and two guards who are paid to believe him.`);
L('faelen', 'q9_lobby', `[murmuring] A clerk. A list. Two guards. Forgive me — I love a lobby.`);
L('durnik', 'q9_lobby', `[gravelly] Clerk with a list. Two guards. Good stone, again. Shame.`);
CH('q9_lobby', [
  { id: 'talk', text: 'We are the company from the south. Olamide sent for us before the mine flooded.', when: { not: 'umbralBetrayed' }, bypass: true, set: { toweredQuiet: true }, reply: B('$speaker', 'q9_lobby_talk') },
  { id: 'fight', text: 'Guards first. The clerk if he runs.', heritage: 1, reply: B('$speaker', 'q9_lobby_fight') },
  { id: 'wren_ward', text: 'Hiwot, go and see what is on that list.', when: { company: W }, bypass: true, aff: { wren_ward: 1 }, reply: B(W, 'q9_lobby_wren') },
]);
L(W, 'q9_lobby_talk', `[impressed] He BELIEVED you. Olamide's name still opens doors. Third floor, he says. Do not touch anything.`);
L(W, 'q9_lobby_fight', `[flat] So much for quiet. Stairs. Go.`);
L(W, 'q9_lobby_wren', `[hushed] Got it. There is a name at the bottom in red: "the ward — as agreed." Whatever we do up there, somebody upstairs already knows we are coming.`);
L('selene', 'q9_lobby_talk', `[quiet] He believed it. Third floor. Don't touch anything.`);
L('selene', 'q9_lobby_fight', `[flat] Stairs, then.`);
L('faelen', 'q9_lobby_talk', `[smiling] He believed it. Third floor. Touch nothing, he says — as if.`);
L('faelen', 'q9_lobby_fight', `[cheerful] Stairs it is.`);
L('durnik', 'q9_lobby_talk', `[grunting] Third floor. Don't touch anything. Good advice for a tower, that.`);
L('durnik', 'q9_lobby_fight', `[grim] Stairs.`);
L('vess', 'q9_betrayal', `[bright] {target}! You found us! We work here now, you see it? It pays better than you did.|[giggling] Winston says we should kill you quick. Me, I would like to take my time.`);
L('fennick', 'q9_betrayal', `[flat] Nothing personal, man. You said that yourself once.`);
// Folake: a negotiator. She pays for what she wants with what she has, and never gives first.
L('lysandra', 'q9_floor', `[silken] Put the swords down; you will not need them on my floor, and I have poured two cups. I am Folake. I keep Kolade Adeyinka's bed warm and the Consortium's secrets warmer.|[pleasant] I have given you his name. Now tell me what happened on the Griffon Road. Before Tesfaye died, did Kolade offer him a bargain? He usually does. I want to know what he offered.`);
L('cassian', 'q9_floor_cassian', `[low] With respect. You do not have to answer her. She is bargaining.`);
L('ilvara', 'q9_floor_ilvara', `[low, amused] Answer her. She is the only person in this tower telling the truth, and she is doing it for money. I respect that.`);
CH('q9_floor_offer', [
  { id: 'library', text: 'His life and his library, in exchange for me.', set: { toldFolake: true }, reply: B('lysandra', 'q9_offer_library') },
  { id: 'nothing', text: 'Nothing. He simply took.', reply: B('lysandra', 'q9_offer_nothing') },
  { id: 'price', text: 'Tell me what you are selling first, and I will decide what it costs.', reply: B('lysandra', 'q9_offer_price') },
]);
L('lysandra', 'q9_offer_library', `[satisfied] His library. Not gold, not the child's life — the old man's books. Kolade knew what Tesfaye loved and offered him exactly that. That is how he does everything, my dear, and it is why he will win unless somebody who understands him is on the other side. Which brings us to business.`);
L('lysandra', 'q9_offer_nothing', `[a small smile] A lie, and a loyal one. He offered. He always offers; it is the only thing about him I still find beautiful. Keep your lie; it tells me you loved the old man, which is also useful. Now, business.`);
L('lysandra', 'q9_offer_price', `[delighted] Oh, good. Somebody taught you. — I am selling a way into the palace, and the truth about what you are, and I want his head and the Consortium afterward. That is the whole shop. Now you know the price; pay me the answer, or do not, and we go on to business either way.`);
CH('q9_lysandra', [
  { id: 'kolade', text: 'Kolade Adeyinka. Who is he to this city? Say it as if I had never heard the name.', ask: true, reply: B('lysandra', 'q9_lysandra_kolade') },
  { id: 'deal', text: 'Talk. Quickly.', set: { lysandraBargain: true }, aff: { faelen: 1, ilvara: 1, cassian: -1 }, reply: B('lysandra', 'q9_lysandra_deal') },
  { id: 'arrest', text: 'You will talk to Duke Adebayo. In chains.', set: { lysandraArrested: true }, aff: { cassian: 1 }, reply: B('lysandra', 'q9_lysandra_arrest') },
  { id: 'kill', text: 'You share his bed. You share his end.', heritage: 1, set: { lysandraDead: true }, aff: { selene: -1, amara: -1 }, reply: B('lysandra', 'q9_lysandra_kill') },
]);
L('lysandra', 'q9_lysandra_kolade', `[precise] Adigun Adeyinka's foster-son, and the head of the Consortium in everything but the ledger. The man in the black armour on your road; he told me about the road himself, and he told it fondly. He collects people like you. He says you are family. He does not mean it kindly, and he does not mean it as a threat either, which is the frightening part.`);
L('lysandra', 'q9_lysandra_deal', `[pleased] Adigun wants high iron prices. A frightened city pays them. Kolade wants the war to happen. He has been using his father's couriers to hunt Morrak's children behind his back, and his tutor promises him godhood through mass murder. His father would stop the war if he knew how close it was.|[soft] When you need a way into the palace, come to me. I will have one. The price is his head, and the Consortium afterward — for me.`);
L('lysandra', 'q9_lysandra_arrest', `[amused] Chains. How lawful. Fine. I will tell Adebayo everything and he will hang me for it, and Kolade will still be sworn in on time.|[bitter] Go upstairs. The top floor is where he keeps the truth about you.`);
L('lysandra', 'q9_lysandra_kill', `[whispering] He will feel this. That is the only thing I am sorry for.`);
L('selene', 'q9_top', `[reading] Adigun Adeyinka, Bankole, Rotimi. Gone to Lanternhold — to LANTERNHOLD — for a summit with the keepers.|[cold] The three men behind all of this are sitting in the library you grew up in.`);
L(W, 'q9_top', `[stunned] Lanternhold. They went HOME. The three men who paid to kill Tesfaye are sitting in his library. — The drawer. Delphine, the locked drawer. We are going to be in that room.`);
L('halvard', 'q9_book', `[grave] The keepers hold shipping records both kingdoms trust. They are hearing the dispute over the iron shortage. Take Adigun's orders to Lanternhold and show them who caused it.|[quiet] I will have my officers keep looking for Kolade here. His father may know where he is. Question Adigun, and bring him back alive if you can. This book will pay your way into the keep.`);
// Delphine is a family friend. This reassurance is separate from romantic choices.

// Optional inn conversations. The player must finish both on separate occasions.
// Friendship is the default; the explicit interest choice is a separate action.
D.CAMPAIGN3_COURTSHIP = {
  cassian: { conversations: [
    { key: 'bond_first', text: 'You held your ground. Being afraid does not change that.', reply: 'bond_first_reply' },
    { key: 'bond_second', text: 'I would like to hear about your home. Tell me more.', reply: 'bond_second_reply' },
  ], interest: 'bond_interest', later: 'bond_later' },
  ithrel: { conversations: [
    { key: 'bond_first', text: 'You can stay with us while you decide what comes next.', reply: 'bond_first_reply' },
    { key: 'bond_second', text: 'I would like to see the woods with you sometime.', reply: 'bond_second_reply' },
  ], interest: 'bond_interest', later: 'bond_later' },
  ilvara: { conversations: [
    { key: 'bond_first', text: 'You owe me no service. Stay because you want to.', reply: 'bond_first_reply' },
    { key: 'bond_second', text: 'Tell me about the shrine. What was your life there like?', reply: 'bond_second_reply' },
  ], interest: 'bond_interest', later: 'bond_later' },
  faelen: { conversations: [
    { key: 'bond_first', text: 'You do not have to entertain me. I am glad you are here.', reply: 'bond_first_reply' },
    { key: 'bond_second', text: 'I would enjoy hearing you play. Leave the hat at home.', reply: 'bond_second_reply' },
  ], interest: 'bond_interest', later: 'bond_later' },
};
L('cassian', 'bond_first', `[hesitant] The training yard was easy. You knew the other man would stop.|[honest] In a real fight, I still want to run. I worry that one day I will.`);
L('cassian', 'bond_first_reply', `[relieved] Thank you. I needed to hear that from someone who had actually seen me fight.`);
L('cassian', 'bond_second', `[easier] I wrote home. Mostly about the people I have met. My mother would worry if I described the fighting.|[fond] She runs a bakery. I used to get up before dawn to carry flour. I complained every morning. Now I miss it.`);
L('cassian', 'bond_second_reply', `[warm] There is a stool by the oven where I used to sleep between deliveries. Mother still keeps it there. She says my room is too far from the work.`);
L('cassian', 'bond_interest', `[shy] I would like that too. May we take a little time? I want to know you better.`);
L('cassian', 'bond_later', `[gentle] Of course. Tell me when you are ready. We can still enjoy each other's company.`);
L('ithrel', 'bond_first', `[low] I have spent so long following tracks that I have given little thought to what comes after.|[tired] I cannot go back to the life I had with my wife. I do not yet know what else I want.`);
L('ithrel', 'bond_first_reply', `[quiet] I would like to stay. It helps to have people expecting me back.`);
L('ithrel', 'bond_second', `[thoughtful] I used to guide travellers through the woods. Some had never slept outside. They would wake me over every rustle.|[faintly amused] One paid me extra to keep the owls away. I gave him something to plug his ears.`);
L('ithrel', 'bond_second_reply', `[warm] I would enjoy that. There are places worth visiting without a bounty to collect.`);
L('ithrel', 'bond_interest', `[careful] I care for you. I need time before I can promise more. If you are willing to wait, I would like to try.`);
L('ithrel', 'bond_later', `[calm] Take the time you need. You know where to find me.`);
L('ilvara', 'bond_first', `[direct] I appreciate what you did for me. Understand something, though. You did not buy my loyalty by keeping me alive.|[firm] I choose where I go and whom I serve.`);
L('ilvara', 'bond_first_reply', `[approving] Good. I prefer travelling with someone who understands that.`);
L('ilvara', 'bond_second', `[unguarded] I miss the quiet of the shrine. Before the petitions began, I had an hour to myself.|[dry] Up here, someone is always shouting, selling something, or telling me what a lovely morning it is. Usually in the rain.`);
L('ilvara', 'bond_second_reply', `[measured] The work was demanding. I liked that. I knew what was expected of me, and I was good at it. I miss having a place of my own.`);
L('ilvara', 'bond_interest', `[interested] You have my attention. Let us spend more time together before deciding anything.`);
L('ilvara', 'bond_later', `[level] Then leave it for now. You can bring it up when you know what you want.`);
L('faelen', 'bond_first', `[quieter] I know I make a performance of everything. It is easier than admitting I was scared.|[honest] When you found me, I thought I was going to die there. I have been sleeping badly since.`);
L('faelen', 'bond_first_reply', `[soft] Thank you. I might be rather poor company tonight, but I would like you to stay.`);
L('faelen', 'bond_second', `[cheerful] I used to play for supper at roadside inns. I know six songs well and about forty badly.|[smiling] I still have the lute. I sold the feathered hat. A man has to improve himself somehow.`);
L('faelen', 'bond_second_reply', `[amused] Cruel, but fair. I will play you the good six. You can request the others after enough wine.`);
L('faelen', 'bond_interest', `[pleased] I was hoping you might say that. Let us have a little time together and see how we get on.`);
L('faelen', 'bond_later', `[easy] All right. Let me know if you want to try again. No awkwardness between us.`);
L('amara', 'q13_trust', `[quiet] You kept your word. Thank you for letting me help.`);

L('selene', 'q9_family', `[warm] You're family, honey. You don't have to face this alone. Get some rest. We leave for Lanternhold in the morning.`);
// Offers occur only in a player-initiated private conversation after courtship.
L('cassian', 'q9_romance', `[nervous] I enjoy the time we spend together. More than I know how to say properly.|[earnest] When we have a quiet evening, may I take you to supper? Just the two of us.`);
L('cassian', 'q9_romance_yes', `[pleased] Supper, then. I know a decent place. I will try to get through the evening without saluting you.`);
L('cassian', 'q9_romance_no', `[bravely] Then I am glad I said it, and I will not say it again. Thank you for hearing it.`);
L('ithrel', 'q9_romance', `[low] I still miss my wife. I always will.|[quiet] But I have come to care for you too. If you feel the same, I would like us to be together.`);
L('ithrel', 'q9_romance_yes', `[quiet] Then we will take our time. I am glad you told me.`);
L('ithrel', 'q9_romance_no', `[calm] I understand. It was enough to say it. Sleep.`);
L('ilvara', 'q9_romance', `[dry] I enjoy your company when you stop trying to give me orders.|[direct] I would like some time alone with you. Interested?`);
L('ilvara', 'q9_romance_yes', `[pleased] Good. Come and sit with me. Your duties can wait for an evening.`);
L('ilvara', 'q9_romance_no', `[cool] Very well. I will not ask again.`);
L('faelen', 'q9_romance', `[smiling] I like you. I'd like to spend an evening with you, without the rest of this lot.`);
L('faelen', 'q9_romance_yes', `[delighted] Excellent. A decent meal, some wine, and no work.|[warm] I have been looking forward to this.`);
L('faelen', 'q9_romance_no', `[light] Stop it is. Friends, then, and I am very good at that as well.`);
Q(9, {
  departure: [B('halvard', 'q9_plan'), B('sarn', 'q9_tower', { caption: 'Inside the Consortium headquarters, a man in a fine merchant\'s coat draws you aside before the clerk can ask your business. He introduces himself as Sanni.' })],
  openers: {
    0: [B(W, 'q9_lobby', { anyOf: [W, 'selene', 'faelen', 'durnik'], choice: 'q9_lobby' })],
    1: [B('vess', 'q9_betrayal', { when: { flag: 'umbralBetrayed' } }), B('fennick', 'q9_betrayal', { when: { flag: 'umbralBetrayed' } })],
    2: [
      B('lysandra', 'q9_floor', { caption: 'A floor of silk hangings and one desk. The woman behind it has been expecting you, and has poured two cups.' }),
      B('cassian', 'q9_floor_cassian', co('cassian')), B('ilvara', 'q9_floor_ilvara', co('ilvara')),
      B('lysandra', 'q9_floor_wait', { choice: 'q9_floor_offer' }),
      B('lysandra', 'q9_floor_business', { choice: 'q9_lysandra' }),
    ],
  },
  closing: [B('selene', 'q9_top', { anyOf: ['selene', W] })],
  arrival: [
    B('halvard', 'q9_book'),
    B('selene', 'q9_family', { when: { recruited: 'selene', alive: 'selene', not: 'floodedEarly', affMin: ['selene', 0] }, artPhase: 'night' }),
  ],
});
L('lysandra', 'q9_floor_wait', `[patient, smiling] I can wait. I am very good at waiting; it is most of what I do up here.`);
L('lysandra', 'q9_floor_business', `[brisk, pleasant] Now. He is going to be a Grand Duke by month's end, and he is going to have you killed for it. I would rather the reverse. Shall we talk, my dear?`);

// =====================================================================
// Q10 — Return to Lanternhold
// =====================================================================
// The familiar merchant renews his invitation; the ring and claimed friendship are bait.
L('sarn', 'q10_ring', `[quiet, city-formal] You found the papers, then. My father is in the reading room with Bankole and Rotimi. Before you go in, I have something of Tesfaye's for you.|[calm] Take this ring. It was his once, before it was mine. And know this, my friend: the three men inside deserve whatever you decide to give them. Nobody will weep.`);
L(W, 'q10_ring_hiwot', `[suspicious] How did you know Tesfaye? I lived in that keep twenty years and I never once saw you.`);
L('sarn', 'q10_ring_hiwot_reply', `[a warm, easy smile] He had dealings outside the keep, young lady. Some of them were confidential. I gave him my word that they would stay that way.`);
L(W, 'q10_ring_hiwot_after', `[flat] That is not an answer.`);
L('sarn', 'q10_ring_hiwot_end', `[pleasantly] No. It is not. — The ring, {target}. Take it or do not; I have a long walk either way.`);
CH('q10_sarn', [
  { id: 'take', text: 'If it was Tesfaye\'s, I want it back.', set: { sarnRing: true }, reply: B('sarn', 'q10_sarn_take') },
  { id: 'refuse', text: 'Keep it. I have not decided whether to trust you.', aff: { wren_ward: 1 }, reply: B('sarn', 'q10_sarn_refuse') },
  { id: 'threat', text: 'If this is a trick, I will find you.', heritage: 1, set: { sarnRing: true }, reply: B('sarn', 'q10_sarn_threat') },
]);
L('sarn', 'q10_sarn_take', `[soft] Wear it inside. The keepers will know it. Find my father before he leaves the reading room.`);
L('sarn', 'q10_sarn_refuse', `[amused] Wise. Tesfaye taught you that. Go well anyway.`);
L('sarn', 'q10_sarn_threat', `[pleased] I believe you would. Go well, {target}.`);
// The gate: Abba Gebre's grief comes out as procedure
L('hadrian', 'q10_gate', `[cold] A book buys you the door. It does not buy you my good opinion.|[stiff] Where did he die? On what road, and on what night? The keep's book of the dead wants a road and a night, and nobody has given me either.`);
CH('q10_gate_where', [
  { id: 'road', text: 'The Griffon Road, the night we left. He stood between me and the man who killed him.', reply: B('hadrian', 'q10_where_road') },
  { id: 'refuse', text: 'Write "on the road." It is all you need.', reply: B('hadrian', 'q10_where_refuse') },
]);
L('hadrian', 'q10_where_road', `[writing, not looking up] "The Griffon Road. Standing." — Tesfaye left this keep with you and came back to it as a line in my book. Do not make a habit of it.`);
L('hadrian', 'q10_where_refuse', `[cold] "On the road." Very well. It is what he would have wanted written; he never cared for particulars. Do not make a habit of this, child.`);
L('ambrose', 'q10_gate', `[kind] Pay him no mind. He mourns like a wall. — Come and find me in the upper reading room before you do anything else, my child. Tesfaye left something with me. For you. For now.`);
L(W, 'q10_home', `[strange] It smells the same. Ink and dust and the brothers' lentils. I thought it would feel like home, and it feels like a trap.`);
// The summit: Adigun, and Delphine's one question about the seal
L('maddox', 'q10_summit', `[startled] Guards — no. No, hold. I know who you are.|[shaking] Adigun Adeyinka. The mines, the bandits, the lies about Calder — we paid for those. I wanted higher prices, not a war that would close our trade routes. My foster-son is buying votes to send the army across the border. He used my seal to order your death, and Tesfaye's. My own couriers obey him now.`);
L('selene', 'q10_summit_selene', `[flat] Then answer me this, Adeyinka, before anybody decides anything. The iron hand in red wax on the ore wagons. Whose seal is that?`);
L('maddox', 'q10_summit_selene_reply', `[miserable] Mine. The house's. — He took it off my desk in the spring, and my couriers with it, and I have been signing for a man who no longer asks me.`);
L('selene', 'q10_summit_selene_after', `[to you, quiet] Your seal on the wagons and his on the bounty. Same wax. I've been right since the inn, honey, and I ain't glad of it.`);
L('vask', 'q10_summit', `[bluster] Kill them, Adigun, they have swords in a LIBRARY —`);
CH('q10_summit', [
  { id: 'kill', text: 'You paid for the mines and the bandits. You will not leave this room alive.', heritage: 1, set: { leadersKilled: true }, aff: { cassian: -1, selene: -1, ilvara: 1 }, reply: B('maddox', 'q10_summit_kill') },
  { id: 'talk', text: 'I will not kill you. Tell me what your son has been doing.', bypass: true, set: { leadersSpared: true }, reply: B('maddox', 'q10_summit_talk') },
  { id: 'arrest', text: 'You will answer to Adebayo. All three of you. Nobody dies in a library.', bypass: true, set: { leadersSpared: true, leadersArrested: true }, aff: { cassian: 1 }, heritage: -1, reply: B('maddox', 'q10_summit_arrest') },
]);
L('maddox', 'q10_summit_kill', `[terrified] He will not stop when we are dead. He will not STOP —`);
L('maddox', 'q10_summit_talk', `[whispering] Kolade. Kolade Adeyinka. His tutor told him who his real father was. Then he started paying for reports on other children, all over the coast. I thought he was looking for relatives. I found the death notices with the bounty payments.|[broken] He is in this keep tonight. I do not know what face he is wearing.`);
L('maddox', 'q10_summit_arrest', `[relieved] Yes. Yes. Adebayo. Anything. Take us out of here before he —`);
// The letter — Dawit asks his one question first, because he has waited twenty years to ask it
L('ambrose', 'q10_letter', `[gently] Sit. I have Tesfaye's letter here. Before you read it... did he say anything at the end? I need to know.`);
CH('q10_letter_end', [
  { id: 'proud', text: 'That he had been proud of me every day since he carried me through the gate.', reply: B('ambrose', 'q10_end_proud') },
  { id: 'run', text: 'Only "run." And two names.', reply: B('ambrose', 'q10_end_run') },
  { id: 'nothing', text: 'I did not hear. I was doing as I was told.', reply: B('ambrose', 'q10_end_nothing') },
]);
L('ambrose', 'q10_end_proud', `[closing his eyes] Then he managed it. He practised that sentence on me for a year, my child, and never once got through it without stopping. — Here. Read it. I will stay.`);
L('ambrose', 'q10_end_run', `[softly] "Run." Yes. He was a practical man to the last breath. He wrote the rest down, so that he would not have to trust the last breath to carry it. — Here. Read it. I will stay.`);
L('ambrose', 'q10_end_nothing', `[gently] Then you did the only thing he asked, and it is the reason I can give you this at all. — Here. Read it. I will stay.`);
L('ambrose', 'q10_letter_give', `[quiet] Tesfaye wrote it the year he brought you here. He made me swear to give it to you only when someone had already tried to tell you the wrong way.`);
L('aldric', 'q10_letter', `[echoing, read aloud] "If you are reading this, my child, I failed to tell you myself, and I am sorry. Your mother was one of many. Your father was Morrak, the god of murder, in the last year before he died — and he sired children so that one of them might one day take his place. You are one. So is the man who killed me. He is your brother. He believes the throne is his. It is not, unless you decide it is."`);
CH('q10_letter', [
  { id: 'grief', text: 'He raised a monster and loved it anyway.', heritage: -1, aff: { selene: 1, wren_ward: 1 }, set: { letter: 'grief' }, reply: B('ambrose', 'q10_letter_grief') },
  { id: 'anger', text: 'Twenty years and he never said a word. He should have told me.', aff: { wren_ward: -1 }, set: { letter: 'anger' }, reply: B('ambrose', 'q10_letter_anger') },
  { id: 'hunger', text: 'A throne. And a brother sitting in my seat.', heritage: 1, set: { letter: 'hunger' }, reply: B('ambrose', 'q10_letter_hunger') },
]);
L('ambrose', 'q10_letter_grief', `[soft] He raised a child. What the child became was always going to be the child's own work. He knew that. He hoped.`);
L('ambrose', 'q10_letter_anger', `[sad] He tried, every year. He wrote it out and burned it. He thought one more year of not knowing was one more year of you being only his.`);
L('ambrose', 'q10_letter_hunger', `[frightened] Do not — {target}. He wrote the last line for exactly that look on your face. Read it again.`);
L('sarn', 'q10_murder', `[cold] You were supposed to kill him. Very well. Father, your couriers brought me your letter to the Council. You will not be calling off my war.`);
L('sarn', 'q10_accuse', `[shouting] Guards! In here! Tesfaye's ward has murdered my father and his partners. Take their weapons. Do not let this company leave the keep!`);
L('hadrian', 'q10_arrest', `[thundering] Three men dead in my reading room. Put down your weapons. You and your whole company are under arrest. To the cells. Now.`);
L('hadrian', 'q10_arrest_spared', `[thundering] You say you spared them. Sanni says he found you over their bodies. I will hear you separately, under guard. Put down your weapons. To the cells.`);
L('ambrose', 'q10_escape', `[urgent] I brought the cell key. Your gear is in the chest outside; take it. Sanni has ordered your transfer to the Gate at dawn. I do not trust him. The old passage behind this wall leads through the catacombs to the shore. Go, and do not trust any face you meet down there.`);
// Gbenga: a professional, bored, and only mildly curious which of you he is paid for
L('grell', 'q10_catacombs', `[bored] Down here, then. Good. Fewer witnesses and no keepers.|[professional] Gbenga. Your brother sends his regards and would like this finished before breakfast. — Which of you is the ward? I was given a face, not a name, and it is dark.`);
L('ilvara', 'q10_catacombs_ilvara', `[amused] Guess.`);
L(W, 'q10_catacombs_hiwot', `[brightly] None of us. We are pilgrims.`);
L('grell', 'q10_catacombs_end', `[sighing] Then all of you. It costs me nothing extra.`);
L(W, 'q10_double', `[Hiwot's voice, wrong] {target}. Thank the saints. I got separated — come here, come HERE, we have to go —`);
L('aldric', 'q10_double', `[Tesfaye's voice, wrong] {target}. I am not dead. It was a trick — a Warden trick — come to me, child, come here —`);
CH('q10_double', [
  { id: 'strike', text: 'Wrong voice. Strike first.', when: { company: W }, set: { wrenHurt: true }, dismiss: [W], reply: B(['selene', 'ilvara', 'faelen'], 'q10_double_strike') },
  { id: 'strike_alone', text: 'Wrong voice. Strike first.', when: { noCompany: W }, reply: B(['selene', 'ilvara', 'faelen'], 'q10_double_strike_alone') },
  { id: 'question', text: 'What did I steal from the brothers\' kitchen when I was nine?', when: { company: W }, aff: { wren_ward: 2 }, set: { wrenKept: true }, reply: B(W, 'q10_double_question') },
  { id: 'listen', text: '...Come here, then. Slowly.', heritage: 1, set: { listenedToDouble: true }, reply: B(['selene', 'ilvara', 'faelen'], 'q10_double_listen') },
]);
L('selene', 'q10_double_strike', `[sharp] Two of 'em — and the real Hiwot was BEHIND it, {target}, you cut her — she's breathing. She's breathing. She ain't walking out of here on her own.|[grim] I'll get her to the surface. Go on without us.`);
L(W, 'q10_double_question', `[the real Hiwot, furious] The HONEY. It was the honey, and Brother Yonas still blames the cat — that thing wearing my face does not know that, so STAB IT.`);
L('selene', 'q10_double_listen', `[urgent] That ain't who it looks like. {target}. That is NOT them. It's already reaching for your throat — move!`);
L('ilvara', 'q10_double_strike', `[approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out.`);
L('ilvara', 'q10_double_listen', `[sharp] That is not your kin. Kill it before it kisses you.`);
L('faelen', 'q10_double_strike', `[wincing] Right call, wrong result — the real Hiwot was behind it. She is breathing. I will carry her out; go.`);
L('selene', 'q10_double_strike_alone', `[grim] That wasn't him, and you knew it before I did. It's dead. There's two more behind it wearing faces I don't know — keep moving.`);
L('ilvara', 'q10_double_strike_alone', `[approving] Good. You did not even let it finish. There are more behind it; kill them the same way.`);
L('faelen', 'q10_double_strike_alone', `[breathless] Not him — and you knew. It is down. Two more behind it, and I do not like their faces either.`);
L('faelen', 'q10_double_listen', `[shouting] Not them! NOT them! It has teeth, {target}!`);
L('selene', 'q10_shore', `[weary] The shore. Air. We're out.|[hard] Sanni sent us after his father. Then he called the guards on us. With Adigun dead and us wanted for murder, who is left to stop him?`);
L(W, 'q10_shore', `[shaking] Out. We are out. I am never going home again, am I.|[small] Sanni sent us into that room. Then he told the guards we'd murdered his father. He had this planned before we ever left the city.`);
L('ostwin', 'q10_unmasked', `[dry] Your father is dead, Kolade. The ward has escaped the keep. I take it we are continuing with the war?`);
L('korvath', 'q10_unmasked', `[calm] Of course. Adigun wanted frightened customers paying twice the price. He would never have let the armies march. Now the Consortium is mine, and the ward will be hunted as a murderer.|[pleased] Let them run. We know where to look for the other children. Once the war begins, nobody will spare soldiers to protect them. I will deal with Tesfaye's ward when I choose.`);
L('aldric', 'q10_dream', `[echoing] Now you have my letter. I should have told you about your brother myself, when I could still help you face him.|[grave] Kolade plans to murder the other children and take their power. His tutor means to use the deaths in the war as an offering to Morrak, to make Kolade a god. Stop the war and you deny him that sacrifice.|[fading] The last time I ask. Feed it, or starve it.`);
CH('q10_dream', [
  { id: 'reject', text: 'Starve it. I will stop him as myself.', heritage: -1, set: { dream3: 'reject' }, reply: B('aldric', 'q10_dream_reject') },
  { id: 'embrace', text: 'If it takes a god to stop a god, then feed it.', heritage: 1, set: { dream3: 'embrace' }, reply: B('aldric', 'q10_dream_embrace') },
]);
L('aldric', 'q10_dream_reject', `[at peace] Then I did enough. Go and finish it, my child, and come home to whoever is waiting.`);
L('aldric', 'q10_dream_embrace', `[quiet] Then I hope I am wrong about what that costs. I have been wrong before. Not about this. Go.`);
Q(10, {
  departure: [
    B('sarn', 'q10_ring', { caption: 'The hill road to Lanternhold. Sanni, the merchant you met at the Consortium headquarters, is waiting at the milestone with a ring in his hand.' }),
    B(W, 'q10_ring_hiwot', co(W)), B('sarn', 'q10_ring_hiwot_reply', co(W)), B(W, 'q10_ring_hiwot_after', co(W)), B('sarn', 'q10_ring_hiwot_end', co(W, { choice: 'q10_sarn' })),
    B('sarn', 'q10_ring_ask', without(W, { choice: 'q10_sarn' })),
  ],
  openers: {
    0: [B('hadrian', 'q10_gate', { choice: 'q10_gate_where' }), B('ambrose', 'q10_gate'), B(W, 'q10_home', co(W))],
    1: [
      B('maddox', 'q10_summit', { caption: 'Before the hearing, you find the three Consortium partners in the great reading room. Maps and shipping records cover their table.' }),
      B('selene', 'q10_summit_selene', co('selene')), B('maddox', 'q10_summit_selene_reply', co('selene')), B('selene', 'q10_summit_selene_after', co('selene')),
      B('vask', 'q10_summit', { choice: 'q10_summit' }),
    ],
    2: [
      B('sarn', 'q10_murder', { when: { not: 'leadersKilled' }, caption: 'Before you can escort the merchants out, Sanni enters and bars the door. Two of his retainers seize Bankole and Rotimi. Sanni draws a knife and steps toward Adigun.' }),
      B('maddox', 'q10_summit_kill', { when: { not: 'leadersKilled' }, death: true, caption: 'Sanni drives the knife into Adigun. Behind him, his retainers cut the other two merchants\' throats. Sanni wipes the blade inside his sleeve and opens the door.' }),
      B('sarn', 'q10_accuse', { caption: 'Sanni calls the keep\'s guards into the reading room. He points at your company, standing beside the three bodies. His retainers step aside to let the guards through.' }),
      B('hadrian', 'q10_arrest', { when: { flag: 'leadersKilled' } }),
      B('hadrian', 'q10_arrest_spared', { when: { not: 'leadersKilled' } }),
      B('ambrose', 'q10_letter', { choice: 'q10_letter_end', artPrison: true, caption: 'The lock turns behind your company. Your weapons are taken to a chest outside the cell. Hours later, Dawit comes to the bars with Tesfaye\'s sealed letter.' }),
      B('ambrose', 'q10_letter_give'),
      B('aldric', 'q10_letter', { choice: 'q10_letter', caption: 'You read it twice. Then you read the last line a third time.' }),
      B('ambrose', 'q10_escape', { caption: 'Dawit opens the cell. You reclaim your gear while he uncovers a narrow passage behind the wall. Footsteps are already coming down the stairs.' }),
      B('grell', 'q10_catacombs'),
      B('ilvara', 'q10_catacombs_ilvara', co('ilvara')), B(W, 'q10_catacombs_hiwot', { when: { company: W, noCompany: 'ilvara' } }),
      B('grell', 'q10_catacombs_end'),
    ],
    3: [B(W, 'q10_double', co(W, { choice: 'q10_double' })), B('aldric', 'q10_double', without(W, { choice: 'q10_double' }))],
  },
  closing: [B('selene', 'q10_shore', { anyOf: ['selene', W] })],
  arrival: [
    B('ostwin', 'q10_unmasked', { to: 'korvath', caption: 'Back at the Consortium tower, away from your company: Sanni has set aside his merchant\'s coat. He wears the spiked black armour from the Griffon Road. His tutor calls him Kolade.', artLocation: 'counting' }),
    B('korvath', 'q10_unmasked', { to: 'ostwin', set: { sarnUnmasked: true }, artLocation: 'counting' }),
    B('aldric', 'q10_dream', { choice: 'q10_dream', caption: 'The throne is close enough to touch. A man in black armour is already sitting in it, and he is smiling at you like a brother.', dream: true }),
  ],
});
L('sarn', 'q10_ring_ask', `[pleasantly] Take it or do not, my friend; I have a long walk either way.`);

// =====================================================================
// Q11 — The Hunted City
// =====================================================================
L(W, 'q11_posters', `[reading] "Wanted, for the murder of Grand Duke Ayodele and of the Consortium summit at Lanternhold: the ward of Tesfaye, and company." That is your face. That is a BAD drawing of your face.|[quiet] The street is full of it: Emeka Obi is dead. A man called Segun Marr commands the Gauntlet now, and he is the one who signed this.`);
L('selene', 'q11_posters', `[cold] Grand Duke Ayodele was murdered last night and they've put your name on it. Obi's dead too. A man called Segun Marr runs the Gauntlet now.|[calm] Kolade will be sworn in as the new Duke within days. He's moved everything into place while we were underground.`);
L('selene', 'q11_doors', `[calm] Three ways into that palace, and we won't get a second try.|[measured] Adebayo's dying; cure him and the Gauntlet is ours. Folake offered a way in, for a price. And the thieves under the Undervault will sell us a door if we owe 'em after.`);
L(W, 'q11_doors', `[thinking] Three doors. Adebayo, if we can save him. Folake, if you can stand her. Or Tunde Softfoot and a debt.`);
CH('q11_allegiance', [
  { id: 'gauntlet', text: 'We find Adebayo and we save him. We do this lawfully.', allegiance: 'gauntlet', aff: { cassian: 2, selene: 1, faelen: -1 }, reply: B('$speaker', 'q11_alleg_gauntlet') },
  { id: 'consortium', text: 'Folake. Kolade\'s head for her Consortium. I can live with that.', when: { flag: 'lysandraBargain' }, allegiance: 'consortium', aff: { ilvara: 1, cassian: -2 }, heritage: 1, reply: B('$speaker', 'q11_alleg_consortium') },
  { id: 'thieves', text: 'The thieves. A debt is cheaper than a Duke.', allegiance: 'thieves', aff: { faelen: 2, wren_ward: 1, cassian: -1 }, reply: B('$speaker', 'q11_alleg_thieves') },
]);
L('selene', 'q11_alleg_gauntlet', `[approving] Lawfully. Tesfaye would've said the same, and then he'd have cheated a little. Let's go find the Duke.`);
L('selene', 'q11_alleg_consortium', `[flat] Her. Fine. I'll hold my nose. Don't you let her hold anything of yours.`);
L('selene', 'q11_alleg_thieves', `[dry] Tunde Softfoot never forgets a debt. Neither will you. All right — the Undervault.`);
L(W, 'q11_alleg_gauntlet', `[nodding] The Duke. All right. I like a Duke who owes us.`);
L(W, 'q11_alleg_consortium', `[uneasy] Folake. I do not trust her smile. I do not trust anything about her. But she does have a door.`);
L(W, 'q11_alleg_thieves', `[grinning] Tunde! Yes. I was hoping you would say that. Thieves are honest about what they are.`);
L('idris', 'q11_healer', `[oily] The Duke is resting. He must not be disturbed. I am his physician, and I will thank you to —|[dropping the voice] — ah. You. The face on the posters. How very tiresome.`);
L('halvard', 'q11_cured', `[weak] Poison. Slow. He was — the physician was — I could not make my mouth work to say it.|[rallying] Kolade. It was always Kolade. Get me to my own guard and I will get you into that coronation.`);
// Amara: she asks one thing, and it is the only thing she needs to know about you
L('amara', 'q11_docks', `[steady] Put the swords away. If I wanted you dead I would have done it from the rooftop.|[grave] I am Amara. I love Kolade Adeyinka. I also helped him kill the man who raised you. I know what that makes me to you. But I need you to hear me. Have you ever loved someone even after you knew what they'd done?`);
CH('q11_amara_loved', [
  { id: 'yes', text: 'Yes.', aff: { amara: 1 }, reply: B('amara', 'q11_loved_yes') },
  { id: 'tesfaye', text: 'I loved a man who lied to me for twenty years. Does that count?', reply: B('amara', 'q11_loved_tesfaye') },
  { id: 'no', text: 'No. And I do not intend to start.', reply: B('amara', 'q11_loved_no') },
]);
L('amara', 'q11_loved_yes', `[a slow nod] Then you know the shape of it. Good. I will not have to explain the rest, only ask it.`);
L('amara', 'q11_loved_tesfaye', `[quiet] Yes. Kolade has lied to me too. I know he has hurt people. I still care for him, but I cannot let him go on killing.`);
L('amara', 'q11_loved_no', `[level] Then you will think what I ask is weakness. Hear it anyway; you may need it later, when you are older and less certain.`);
L('ithrel', 'q11_docks_ithrel', `[very quiet] The north road. A year ago. Were you there when the wagons burned?`);
L('amara', 'q11_docks_ithrel_reply', `[without flinching] No. I was not. But I did not stop him sending Gorruk north, and I could have. Put that on my account with the rest, ranger. I will not argue the sum.`);
L('amara', 'q11_docks_ask', `[grave] Here is what I ask. Stop him. Not kill him. Stop him. There is a difference, and it matters to me more than my own life.`);
CH('q11_amara', [
  { id: 'how', text: 'How does one stop a man like that without killing him?', ask: true, reply: B('amara', 'q11_amara_how') },
  { id: 'promise', text: 'If it can be done without killing him, I will do it that way. You have my word.', bypass: true, set: { promisedAmara: true }, aff: { amara: 3, ithrel: -1 }, heritage: -1, reply: B('amara', 'q11_amara_promise') },
  { id: 'refuse', text: 'He killed Tesfaye. He dies.', bypass: true, aff: { amara: -2, ithrel: 1 }, reply: B('amara', 'q11_amara_refuse') },
  { id: 'lie', text: 'Of course. You have my word.', bypass: true, set: { liedToAmara: true }, heritage: 1, aff: { amara: 1 }, reply: B('amara', 'q11_amara_lie') },
]);
L('amara', 'q11_amara_how', `[exact] Chains, and a cell, and the Council's law. He is not a god yet. He bleeds, he tires, he can be beaten to his knees; I have seen it done, once, in the fire temple where we met. On his knees he can be bound. It is not a small thing I ask. I know that.`);
L('amara', 'q11_amara_promise', `[exhaling] Thank you. I did not expect that.|[quiet] The coronation is in three nights. Two people called Rasheed and Kemi hold the invitations in the Undervault. Take them from them; they will not give them up.`);
L('amara', 'q11_amara_refuse', `[cold] Then we will meet at the gate of the Undercity, and one of us will not walk past the other.|[flat] Rasheed and Kemi hold the invitations. Undervault. Take them; it does not change what I said.`);
L('amara', 'q11_amara_lie', `[searching] ...Your word. Yes. — Rasheed and Kemi, the Undervault. The invitations. Go.`);
L('ravel', 'q11_undervault', `[grinning] Kemi. Kemi, look. It is the poster. In person! Ah-ah — do we get the reward if we kill it ourselves?`);
L('kessa', 'q11_undervault', `[bored] The reward is a thousand and the invitations are worth more. Stop talking and start bleeding them.`);
L('halvard', 'q11_way', `[stronger] Two invitations and a Duke who owes you his life. Olumide will hold the doors. Folasade will hold the Council. You hold the evidence.|[grave] He will not go quietly. He will run for the Undercity. When he does, do not let him reach the altar first.`);
L('fen', 'q11_way', `[soft] Two invitations, and a debt to the Undervault that you will pay when I say. Fair?|[softer] Fair. Here is what nobody told you, my friend: under the palace is the old city. Under the old city is a temple. He is going there when it falls apart. So are you.`);
L('lysandra', 'q11_way', `[silken] Two invitations and a bargain kept. His head; my Consortium. I will have a carriage at the palace steps.|[cool] When it goes wrong — and it will — he will run for the Undercity. I will show you the way down. Nobody else knows it but Amara.`);
Q(11, {
  departure: [B(W, 'q11_posters', { anyOf: [W, 'selene'], caption: 'The Gate, at dawn. Your face is nailed to every post on the street.' }), B('selene', 'q11_doors', { anyOf: ['selene', W], choice: 'q11_allegiance' })],
  openers: {
    1: [B('idris', 'q11_healer', { caption: 'The Duke\'s sick-room. A man in a physician\'s coat stands between you and the bed with a cup in his hand.' })],
    2: [
      B('amara', 'q11_docks', { choice: 'q11_amara_loved', caption: 'The docks, at dusk. A woman with two swords across her back is waiting at the end of the pier, alone.' }),
      B('ithrel', 'q11_docks_ithrel', co('ithrel')), B('amara', 'q11_docks_ithrel_reply', co('ithrel')),
      B('amara', 'q11_docks_ask', { choice: 'q11_amara' }),
    ],
    3: [B('ravel', 'q11_undervault'), B('kessa', 'q11_undervault')],
  },
  closing: [B('halvard', 'q11_cured', { when: { allegiance: 'gauntlet' } })],
  arrival: [
    B('halvard', 'q11_way', { when: { allegiance: 'gauntlet' } }),
    B('fen', 'q11_way', { when: { allegiance: 'thieves' } }),
    B('lysandra', 'q11_way', { when: { allegiance: 'consortium' } }),
  ],
});

// =====================================================================
// Q12 — The Coronation
// =====================================================================
L('selene', 'q12_steps', `[low] Borrowed silks, real steel, two invitations. Everybody in that hall is either a guest or a shape-thief, and there's no way to tell which till the knives come out.|[calm] Stay near the dukes. He needs them dead more than he needs you.`);
L(W, 'q12_steps', `[itching] I hate silk. I hate silk SO much. — There he is. On the dais. Smiling. He has a lovely smile. I want to put it through a wall.`);
L('orlan', 'q12_hall', `[booming] Blades! Blades in the hall! Folasade — Folasade, to me —`);
CH('q12_dukes', [
  { id: 'orlan', text: 'Olumide first. He is the one with the sword.', set: { protectedOrlan: true, dukeDead: true }, reply: B('orlan', 'q12_dukes_orlan') },
  { id: 'mira', text: 'Folasade first. She is the one who will believe us.', set: { protectedMira: true }, reply: B('mira', 'q12_dukes_mira') },
  { id: 'korvath', text: 'Neither. Kolade. Now, while he is on the dais.', heritage: 1, set: { wentForKorvath: true, dukeDead: true, bothDukesDead: true }, reply: B(['selene', W], 'q12_dukes_korvath') },
]);
L('orlan', 'q12_dukes_orlan', `[roaring] HA! With me, then! Folasade — Folasade, get BEHIND something!`);
L('mira', 'q12_dukes_mira', `[sharp] Good. Keep them off me and I will keep the Council listening. That is the only thing that matters in this room.`);
L('selene', 'q12_dukes_korvath', `[shouting] The dukes are DYING, {target} — we can't hold both if you run at him —`);
L(W, 'q12_dukes_korvath', `[shouting] The dukes — {target}, the DUKES — we cannot hold them if you run at him —`);
// Kolade unmasked: courteous to the hall, warm to you, and enjoying every second
L('korvath', 'q12_reveal', `[calm, pleasant, to the hall] Enough. Put it down, all of you; nobody in this room is going to be paid tonight, and I would rather not lose good people to bad timing.|[warm, to you] There you are. I have wanted to hear my brother's voice — my sister's — for a year, and I have only ever had it second-hand, from frightened men. Say something. The hall can wait; it is mostly dead.`);
CH('q12_face', [
  { id: 'evidence', text: 'Olamide\'s ledgers. Adigun\'s confession. Folake\'s letters. Every duke here can read.', aff: { cassian: 1, selene: 1 }, reply: B('korvath', 'q12_face_evidence') },
  { id: 'aldric', text: 'You killed the only father either of us ever had.', heritage: -1, aff: { wren_ward: 1 }, reply: B('korvath', 'q12_face_aldric') },
  { id: 'throne', text: 'You are sitting in my seat, brother.', heritage: 1, aff: { ilvara: 1, cassian: -1 }, reply: B('korvath', 'q12_face_throne') },
]);
L('korvath', 'q12_face_evidence', `[delighted] Paper! Tesfaye's child brings paper to a coronation. That is the most charming thing I have seen in a year, and I mean that; he taught you well.|[gently] It does not matter. Look at their faces: the war is already in their mouths, and paper does not take words back out. Baba — take me down.`);
L('korvath', 'q12_face_aldric', `[quiet, honest] He was never mine. He chose you. He could have chosen both of us, and he chose you, and I have made my peace with it in a way I do not think you have.|[courteous] Baba. Take me down.`);
L('korvath', 'q12_face_throne', `[a slow, real smile] THERE you are. I knew it. I said to Amara, I said, it will be in the child too, wait and see.|[warm] Come and take it, then. Not here — this is a hall for merchants. Come to the altar and take it from me properly. Baba — take me down.`);
L('ostwin', 'q12_teleport', `[dry] My boy. This way. — You people: enjoy the rear-guard. They were expensive, o.`);
L('mira', 'q12_council', `[shaken] The Council has read it. The vote on the war is dead, and so is his claim.|[steady] He went into the ground. Olumide is bleeding but standing. Go and finish it, and bring me a head or a prisoner; I will take either.`);
L('orlan', 'q12_council', `[wheezing] Folasade is dead. He put a knife in her while the whole hall watched.|[grim] The vote is dead too; she made sure of that first. Go and finish him. I will hold the door until you come back or he does.`);
L('halvard', 'q12_council_dead', `[hoarse, from a chair] Two Grand Dukes dead in their own hall, and the Council is me and a room full of ghosts. It is not a small thing you did, running at him.|[hard] The vote is dead with them; nobody will vote for his war now. Go down and finish it. I will hold what is left.`);
L('fen', 'q12_council_dead', `[soft] Two dead dukes and a hall full of witnesses. The Undervault will take you down; the Gauntlet is too busy counting bodies.|[softer] The debt grows, {target}. It always does.`);
L('lysandra', 'q12_council_dead', `[cool] Two dead dukes. You do not do things by halves, my dear; I will remember that when I am counting what is left of the Council.|[silken] The carriage is at the steps. The way down is under the palace kitchens. Bring me his head.`);
Q(12, {
  departure: [B('selene', 'q12_steps', { anyOf: ['selene', W], caption: 'The palace steps, at night. Every window is lit.' })],
  openers: {
    0: [B('orlan', 'q12_hall', { choice: 'q12_dukes', caption: 'The great hall. Halfway through the oath, the guests nearest the dukes draw knives.' })],
    1: [B('korvath', 'q12_reveal', { choice: 'q12_face', caption: 'The armoured giant from the Griffon Road pulls off the face of a Grand Duke\'s guest. Under it is a man who looks like you.' })],
    2: [B('ostwin', 'q12_teleport', { caption: 'A ring of frost. He and his tutor are gone. The rear-guard is not.' })],
  },
  closing: [],
  arrival: [
    B('mira', 'q12_council', { when: { not: 'dukeDead' } }),
    B('orlan', 'q12_council', { when: { flag: 'dukeDead', not: 'bothDukesDead' } }),
    B('halvard', 'q12_council_dead', { when: { flag: 'bothDukesDead', allegiance: 'gauntlet' } }),
    B('fen', 'q12_council_dead', { when: { flag: 'bothDukesDead', allegiance: 'thieves' } }),
    B('lysandra', 'q12_council_dead', { when: { flag: 'bothDukesDead', allegiance: 'consortium' } }),
  ],
});

// =====================================================================
// Q13 — The Undercity
// =====================================================================
L(W, 'q13_return', `[stiff, bandaged] I heard you were going under the city without me. Absolutely not.|[fierce] I am stitched, I am furious, and I still open locks better than anyone here. Move over.`);
L('faelen', 'q13_maze', `[hushed] The thieves' maze. Every third flagstone is a trap and every fourth is a thief. I know the path; follow my feet exactly, please.`);
L(W, 'q13_maze', `[hushed] The thieves' maze. I can read it — half of it is Lanternhold locks, the cheap kind. Follow me exactly.`);
CH('q13_maze', [
  { id: 'follow', text: 'Lead.', bypass: true, aff: { faelen: 1, wren_ward: 1 }, reply: B('$speaker', 'q13_maze_follow') },
  { id: 'cut', text: 'No time. Straight through.', heritage: 1, reply: B('$speaker', 'q13_maze_cut') },
]);
L('faelen', 'q13_maze_follow', `[murmuring] Left. Left. Do not step there. — And we are through, and nobody even bled. I love being right.`);
L('faelen', 'q13_maze_cut', `[sighing] Straight through. Watch the flagstones, then, and try to bleed on the thieves and not on me.`);
L(W, 'q13_maze_follow', `[murmuring] Left. Again. Not that one. — Through. Nobody bled. Tell Tesfaye I was paying attention.`);
L(W, 'q13_maze_cut', `[groaning] Straight through. Fine. The loud list is getting long.`);
L('amara', 'q13_gate', `[quiet] I said one of us would not walk past the other.|[steady] I am still asking. Stop him. Do not kill him. And if you cannot promise me that, then draw, because I will not let you reach him without it.`);
CH('q13_amara_gate', [
  { id: 'fight', text: 'Then draw.', set: { amaraDead: true }, kill: ['amara'], aff: { ithrel: 1 }, heritage: 1, reply: B('amara', 'q13_gate_fight') },
  { id: 'pass', text: 'Stand aside. I keep my promises.', when: { flag: 'promisedAmara' }, bypass: true, set: { amaraPassed: true }, reply: B('amara', 'q13_gate_pass') },
  { id: 'join', text: 'Come with us. Help me stop him the way you want him stopped.', when: { flag: 'promisedAmara', affMin: ['amara', 3] }, bypass: true, recruit: ['amara'], set: { amaraJoined: true }, aff: { amara: 2 }, reply: B('amara', 'q13_gate_join') },
  { id: 'lie', text: 'Stand aside. He will live.', when: { not: 'promisedAmara' }, bypass: true, set: { amaraPassed: true, liedToAmara: true }, heritage: 1, reply: B('amara', 'q13_gate_lie') },
]);
L('amara', 'q13_gate_fight', `[sad] Then draw.`);
L('amara', 'q13_gate_pass', `[stepping aside] Go. I will be at the altar before you, on my knees, asking him the same thing. He will not listen to me. He might listen to you.`);
L('amara', 'q13_gate_join', `[startled] With — yes. Yes. I know the way; I have walked it a hundred times. Stay behind me at the stairs.`);
L('amara', 'q13_gate_lie', `[searching your face] ...Go, then. If you are lying, I will know it at the altar.`);
L('jarem', 'q13_street', `[sneering] The brother. Or the sister. It does not matter which — Kolade says the blood is the same, and the blood is what burns.|[cold] Cultists! Light the street!`);
L('gorruk', 'q13_again', `[roaring] YOU. Twice. TWICE you walk into my tent. There is no city to run to this time, orphan.`);
L('ithrel', 'q13_gorruk', `[very quietly] Mine. You said. Say it again.`);
L('lucan', 'q13_steps', `[sneering] The Gauntlet stands with the new Duke. Whatever is left of the Council can argue about it afterwards.|[cold] I signed your poster myself, my friend. Let me sign the rest of it.`);
L('selene', 'q13_steps_selene', `[flat] Where's Emeka Obi, Marr? He had a wife on Tanner Street. She'd like to know where to put the flowers.`);
L('lucan', 'q13_steps_selene_reply', `[cold] In the river, where the old Duke's friends go. Tell her to look downstream.`);
Q(13, {
  departure: [B(W, 'q13_return', { when: { flag: 'wrenHurt' }, recruit: [W] })],
  openers: {
    0: [B('faelen', 'q13_maze', { anyOf: ['faelen', W], choice: 'q13_maze' })],
    1: [B('amara', 'q13_gate', { when: { not: 'amaraDead' }, choice: 'q13_amara_gate', caption: 'The gate of the Undercity: an arch of old stone under the thieves\' maze. Amara stands in it with both swords drawn.' })],
    2: [B('jarem', 'q13_street', { caption: 'A buried street, lit by torches that should have gone out a thousand years ago.' })],
    3: [B('gorruk', 'q13_again', { when: { not: 'gorrukDead' } }), B('ithrel', 'q13_gorruk', { when: { not: 'gorrukDead', company: 'ithrel' } })],
    4: [B('lucan', 'q13_steps', { caption: 'The temple steps. A Gauntlet officer in a new cloak stands at the top with the men he sold.' }), B('selene', 'q13_steps_selene', co('selene')), B('lucan', 'q13_steps_selene_reply', co('selene'))],
  },
  closing: [],
  arrival: [B('amara', 'q13_trust', { when: { company: 'amara', flag: 'promisedAmara' }, artPhase: 'night' })],
});

// =====================================================================
// Q14 — The Temple of Morrak
// =====================================================================
L('selene', 'q14_sanctum', `[low] A temple to a dead god, still swept, still lit. Somebody's been praying here for twenty years.|[steady] Whatever he says at that altar, {target}, you remember who raised you. Then you do what you have to.`);
L(W, 'q14_sanctum', `[whispering] It is warm down here. It should not be warm.|[fierce] Whatever he says in there — you are Tesfaye's. Not his. Tesfaye's.`);
L('ilvara', 'q14_sanctum', `[reverent] Do you feel it? The stone remembers him. Morrak. By the deep — it would remember you too, if you let it.`);
L(W, 'q14_mirrors', `[horrified] That is ME. That is all of us. They are wearing US.`);
L('selene', 'q14_mirrors', `[cold] Our faces. Every one. Kill 'em quick; don't look at the eyes.`);
// The altar: Kolade is glad you came, and there is one thing he has always wanted to know
L('korvath', 'q14_altar', `[warm] You came. I hoped you would. Every other one of us I have found, I have had to hunt; you walked here on your own feet, and I find I am proud of that, which is a strange thing to feel about someone I mean to kill.|[calm] Sit with me a moment. Did Tesfaye ever speak of me? In all those years he raised you, did he mention my name? I've waited thirty years to hear that he remembered me.`);
CH('q14_spoke', [
  { id: 'never', text: 'Never. Not once. He did not know you existed.', reply: B('korvath', 'q14_spoke_never') },
  { id: 'letter', text: 'Only in a letter, after he was dead. He called you my brother.', reply: B('korvath', 'q14_spoke_letter') },
  { id: 'nothing', text: 'There was nothing to say about you. There still is not.', heritage: 1, reply: B('korvath', 'q14_spoke_nothing') },
]);
L('korvath', 'q14_spoke_never', `[a long quiet] Not once. — Thank you. I would rather that than a lie, and you could have lied; I would have believed you. It is easier, somehow. A man cannot be refused by someone who never knew he was at the door.`);
L('korvath', 'q14_spoke_letter', `[very still] "Brother." In his own hand. — He could have written it to me. He knew where I was; he made a point of never coming. I have wondered for thirty years what he would call me, and it turns out he called me the right thing and sent it to you.|[gently] Thank you. That was not a kindness, but it was the truth, and I have had little enough of either.`);
L('korvath', 'q14_spoke_nothing', `[laughing softly] Oh, that is his. That is his exactly; he could put a whole man in a sentence and leave the sentence out. — Good. Then we understand each other, and I do not have to be gentle.`);
L('amara', 'q14_plea', `[kneeling] Kolade. Please. Look at me. It does not have to be the altar. It can be a cell and a window and me visiting every week for the rest of your life.`);
L('korvath', 'q14_plea_answer', `[gently] Amara. My love. Get up; you are kneeling in ash.|[cold] No.`);
L('korvath', 'q14_altar_last', `[patient] Now. Say what you came to say. I have waited thirty years to hear it, and I would like to hear it properly, before we begin.`);
CH('q14_last', [
  { id: 'aldric', text: 'Tesfaye chose me. He would have chosen you too, if you had let him.', heritage: -1, reply: B('korvath', 'q14_last_aldric') },
  { id: 'brother', text: 'Brother. I am sorry for what they did to you. I am still going to stop you.', aff: { amara: 1, selene: 1 }, reply: B('korvath', 'q14_last_brother') },
  { id: 'throne', text: 'Get out of my chair.', heritage: 1, aff: { ilvara: 1 }, reply: B('korvath', 'q14_last_throne') },
]);
L('korvath', 'q14_last_aldric', `[flinching, then smooth] He did not know me. He had a choice between two children in a gutter and he took the one that cried less; I have never held it against him. I hold it against the gutter.|[rising] Enough. Draw.`);
L('korvath', 'q14_last_brother', `[very quiet] Sorry. Nobody has said that to me in thirty years, and you say it as if it cost nothing.|[rising] It changes nothing. Draw, brother. Sister. Blood.`);
L('korvath', 'q14_last_throne', `[laughing] YES. Yes. Come and take it. Whichever of us stands up from this floor gets to be a god, and I would honestly be content either way.`);
L('korvath', 'q14_beaten', `[on his knees, bleeding] Well. Well. There it is.|[strangely calm] The chair is right there, {target}. Someone is going to sit in it. You, me, or the next one of us who walks down those stairs. Choose. I am curious, even now; I think I will be curious to the end.`);
CH('q14_resolution', [
  { id: 'kill', text: 'Nobody sits in it. Starting with you.', ending: 'kill', reply: B('korvath', 'q14_res_kill') },
  { id: 'gauntlet', text: 'You go up those stairs in chains. Amara asked. I promised.', when: { any: [{ allegiance: 'gauntlet' }, { flag: 'promisedAmara' }, { company: 'amara' }] }, ending: 'gauntlet', reply: B('korvath', 'q14_res_gauntlet') },
  { id: 'usurp', text: 'I sit in it. Move.', when: { heritageMin: 2 }, ending: 'usurp', reply: B('korvath', 'q14_res_usurp') },
  { id: 'walk', text: 'Sit in it, then. Alone. I am going home.', when: { heritageMax: -2 }, ending: 'walk', reply: B('korvath', 'q14_res_walk') },
]);
L('korvath', 'q14_res_kill', `[closing his eyes] He chose right, then. Good. Good. I am so tired of choosing.`);
L('korvath', 'q14_res_gauntlet', `[laughing weakly] Chains. Amara — Amara, you have won, do you hear me — you have —|[quiet] Fine. A window. Every week. Fine.`);
L('korvath', 'q14_res_usurp', `[grinning through blood] THERE. There it is. I was right about you.|[dying] It is warm, is it not. The chair. It is so warm.`);
L('korvath', 'q14_res_walk', `[bewildered] You — no. No, you cannot simply — it is RIGHT THERE —|[alone, as you climb] ...it is right there.`);
Q(14, {
  departure: [B('selene', 'q14_sanctum', { anyOf: ['selene', W, 'ilvara'], caption: 'The Temple of Morrak. The stairs end in a hall of black stone, and the braziers are lit.' })],
  openers: {
    1: [B(W, 'q14_mirrors', { anyOf: [W, 'selene'] })],
    2: [
      B('korvath', 'q14_altar', { choice: 'q14_spoke', caption: 'The altar is a throne of black stone. Your brother sits in it with his helmet in his lap.' }),
      B('amara', 'q14_plea', { when: { any: [{ company: 'amara' }, { flag: 'amaraPassed' }] } }),
      B('korvath', 'q14_plea_answer', { when: { any: [{ company: 'amara' }, { flag: 'amaraPassed' }] }, to: 'amara' }),
      B('korvath', 'q14_altar_last', { choice: 'q14_last' }),
    ],
  },
  closing: [B('korvath', 'q14_beaten', { choice: 'q14_resolution', caption: 'It is over. He is on his knees between you and the chair.' })],
  arrival: [],
});

// =====================================================================
// Companion banter (round 2 of a fight). Keep numbered slots stable for voice clips.
// =====================================================================
L(W, 'banter', `[shouting] The left one! The left one is looking at YOU!|[breathless] Still with you. Keep going!|[gleeful] Got his purse. And his knife. And his — never mind, keep fighting.`);
L('dorran', 'banter', `[steady] H-hold the line. Hold it. Nothing gets past.|[grunting] Shield's up. Hit 'em while they hit me.|[shouting] Del! Behind you!`);
L('selene', 'banter', `[calm] Breathe, honey. The one in front's slower than he looks.|[sharp] Mind the mage. I'll mind the rest.|[dry] If you die, I will be very put out. Don't.`);
L('vess', 'banter', `[giggling] Oh, he is BURNING. Look at him go, man.|[sing-song] More, more, more —|[delighted] Come on, then. I'm right here.`);
L('fennick', 'banter', `[flat] Back lane. Poison. Done.|[calm] Stay close. Don't give them a gap.|[dry] Desmond, stop laughing, it puts them off.`);
L('cassian', 'banter', `[shouting] For the Dawning Flame! — forgive me. Habit.|[earnest] On me! I can take it!|[strained] I am fine! I am — mostly fine!`);
L('ithrel', 'banter', `[quiet] Loosing.|[flat] The archer is mine. Leave him.|[cold] Again.`);
L('bramm', 'banter', `[roaring] FINDIK SAYS GO FOR THE EYES!|[booming] Nobody touches the witch! NOBODY! Vallahi!|[gleeful] Ha HA! Did you SEE that, canım?`);
L('ysolde', 'banter', `[calm] Frost. Hold him still.|[formal] Your aura flares when you fight. Interesting.|[cool] Keep them in front of us.`);
L('aurelius', 'banter', `[bored] Do kindly keep them off me; I am the expensive one.|[smug] Burning. Obviously.|[sneering] Barely worth the spell.`);
L('ilvara', 'banter', `[contemptuous] Bleed, then, if you must.|[cool] Wound them. I will decide who heals.|[dry] Surface-dwellers. Always the front lane.`);
L('faelen', 'banter', `[smiling] Loosing, loosing — got him, and he was handsome, too. A pity.|[cheerful] Behind them! I am behind them!|[light] If I die, tell the magistrate I was thinking of her.`);
L('nettle', 'banter', `[snarling] The roots have him.|[fierce] Trees do not forgive. Neither do I.|[low] Bleed into the soil. Good. Sawa.`);
L('durnik', 'banter', `[gravelly] Wall. I'm the wall, I am.|[grunting] Hit 'em. I've got 'em.|[calm] The deep places keep me. Keep going, bach.`);
L('amara', 'banter', `[exact] Two blades. Two throats. Next.|[steady] Watch the flank. I have the front.|[quiet] Not like this. Quickly. Clean.`);

// A named listener must be standing on our side, not merely in the journal.
DLG.gate.dorran.banter[2].withCompany = ['selene'];
DLG.gate.fennick.banter[2].withCompany = ['vess'];
DLG.gate.bramm.banter[1].withCompany = ['ysolde'];
DLG.gate.vess.banter[0].foeStatus = 'burn';
DLG.gate.fennick.banter[0].foeStatus = 'poison';
DLG.gate.nettle.banter[0].foeStatus = 'rooted';

// =====================================================================
// Epilogue paragraphs (§5) — assembled by C3.epilogue(game)
// =====================================================================
D.CAMPAIGN3_EPILOGUE = {
  "ending": {
    "hero": "Kolade Adeyinka died beneath the city. The Council made the Consortium's ledgers public and rejected war with Calder. The people of Varenholm knew you had stopped the conspiracy. Few knew that the man you defeated was your brother.",
    "monster": "Kolade Adeyinka died at the altar. The Council exposed the Consortium's conspiracy and halted preparations for war. The city celebrated your victory. It knew nothing of Morrak's children, or of the power that had drawn both you and Kolade to the throne.",
    "usurper": "You claimed the throne beneath the city after defeating Kolade. The Council halted preparations for war and honored you for exposing the conspiracy. Most of the people who cheered had no idea what you had taken for yourself.",
    "mercy": "Kolade Adeyinka was imprisoned beneath the Gauntlet's hall. The Consortium's ledgers were made public, and the Council rejected war with Calder. You had stopped him without killing him. He would face trial for the people he had ordered murdered.",
    "ascetic": "You refused the throne and left Kolade alive beneath the city. By dawn, he had disappeared. You returned home, knowing that he might yet come after you. What became of him remained unknown."
  },
  "allegiance": {
    "gauntlet": "Duke Adebayo recovered and kept his promise to you. The wanted posters came down, and the Gauntlet publicly cleared your company's name. Its hall recorded your part in exposing Kolade.",
    "consortium": "Folake took control of the Consortium and honored her bargain with you. She began reopening trade routes and hiring new guards. Her letters made it clear that she hoped to employ you again.",
    "thieves": "Tunde Softfoot had given you a way into the palace when you needed one. Afterwards, he reminded you that the favor had not been a gift. He had yet to name his price.",
    "none": "The Council publicly cleared your name and thanked you for exposing the conspiracy. You left without entering the service of any of the city's factions."
  },
  "dukes": {
    "both": "Olumide and Folasade survived the attack on the Council. Together, they began restoring order and investigating the officials Kolade had paid.",
    "one": "Folasade was buried with the city's honors. Olumide survived, but the attack left the Council badly weakened.",
    "none": "Olumide and Folasade were buried on the same morning. Their deaths left the surviving councillors to choose new leaders and settle a frightened city."
  },
  "companion": {
    "wren_ward": {
      "present": "Hiwot opened a small locksmith's shop on the harbour road. She repaired locks by day and declined to explain where she had learned to open the difficult ones.",
      "gone": "Hiwot returned to Lanternhold. Brother Yonas listened to her account of the journey, then asked her to write it down for the archives.",
      "dead": ""
    },
    "dorran": {
      "present": "Beau helped the people driven from their homes by the fighting. When there was heavy work to do, he was usually the first to volunteer. He never had much patience for being called a hero.",
      "gone": "",
      "dead": "Beau's companions raised a memorial for him near Mirkhollow. They remembered his loyalty, his patience, and how readily he had put himself in danger for others."
    },
    "selene": {
      "present": "Delphine helped rebuild the Warden house on the Shore Road. She kept Tesfaye's letters there, along with a room you could use whenever you visited.",
      "gone": "Delphine returned to the Wardens. News of the campaign reached her through their reports.",
      "dead": ""
    },
    "vess": {
      "present": "Desmond stayed in Varenholm and found work trading information. He was careful about who knew his clients' names.",
      "gone": "No reliable news of Desmond reached you after Kolade's defeat. The Umbral Hand refused to discuss its agents.",
      "dead": ""
    },
    "fennick": {
      "present": "Winston took work guarding merchant caravans. He insisted on seeing the route, the cargo and the full payment before agreeing to leave town.",
      "gone": "No further word of Winston reached you after Kolade's defeat.",
      "dead": ""
    },
    "cassian": {
      "present": "Santiago was knighted by the Order of the Dawning Flame. His report named the companions who had helped him, including those his superiors would rather have left out.",
      "gone": "Santiago returned to the Order of the Dawning Flame. He sent occasional letters, keeping his account of the journey brief.",
      "dead": ""
    },
    "ithrel": {
      "present": "Itsuki visited his wife's grave before settling outside the city. He began taking work as a guide again, and made plans that had nothing to do with revenge.",
      "gone": "Itsuki travelled north after leaving the company. Little news of him reached Varenholm.",
      "dead": ""
    },
    "bramm": {
      "present": "Bahadır settled by the river with Fındık. The tiger liked to sleep across the front steps. Visitors soon learned to call from the gate.",
      "gone": "",
      "dead": ""
    },
    "ysolde": {
      "present": "Yasemin stayed in Varenholm to continue her studies. She kept in touch with the people who had helped free her.",
      "gone": "",
      "dead": ""
    },
    "aurelius": {
      "present": "Devendra returned to Vashk and secured a promotion from the Crimson Wizards. He sent you a copy of his report. Your name appeared in it, though not nearly as often as his.",
      "gone": "",
      "dead": ""
    },
    "ilvara": {
      "present": "Layla opened a small chapel in Varenholm. People who would once have crossed the street to avoid her began coming to her for healing. She made them wait their turn like everyone else.",
      "gone": "Layla left Varenholm after the fighting ended. She gave no destination and made no promise to return.",
      "dead": ""
    },
    "faelen": {
      "present": "Kaito found steady work as a tracker. Between jobs, he performed in the inns. He asked you not to mention the spiders during his songs about the campaign.",
      "gone": "Kaito returned to the inns of Thornbury. His songs about the campaign gave him a considerably larger role than you remembered.",
      "dead": ""
    },
    "nettle": {
      "present": "Wanjiru returned to Mirkhollow to help restore the riverbanks and woodland damaged by the mine. She had little interest in the celebrations in Varenholm; she wanted to see the river run clear again.",
      "gone": "Wanjiru returned to Mirkhollow after leaving your company. She sent word that the river was beginning to clear.",
      "dead": ""
    },
    "durnik": {
      "present": "Dai Morgan obtained permission to reclaim his clan's mine. Before work began, he made copies of the prisoners' names and arranged a memorial for those who had died there.",
      "gone": "Dai Morgan left the company to seek help reclaiming his clan's mine.",
      "dead": ""
    },
    "amara": {
      "present": "Amara visited Kolade in prison. She still cared for him, but no longer excused what he had done.",
      "gone": "Amara left Varenholm by sea. She asked for privacy and gave no address where she could be reached.",
      "dead": "Amara was buried near the entrance to the Undercity, where she had tried to stop you from reaching Kolade."
    }
  },
  "romance": {
    "cassian": {
      "line": "Santiago asked you to attend his knighting. You went together, then slipped away for supper before the speeches had finished.",
      "favoured": "He asked to help rebuild the damaged streets. You spent several mornings working beside him."
    },
    "ithrel": {
      "line": "You and Itsuki make time to walk outside the city. Some days he speaks about his wife. On others, you plan where to travel next.",
      "favoured": "After the hunt was over, he asked you to visit the woods where he once worked as a guide."
    },
    "ilvara": {
      "line": "Layla invites you to her chapel after the day's work. You share meals, argue over the wine, and make plans together.",
      "favoured": "She insists on keeping her own duties. The two of you arrange time together around them."
    },
    "faelen": {
      "line": "Kaito takes you to the inns where he once played for his supper. He remembers the songs better than he claims.",
      "favoured": "His work with the Undervault keeps him busy, but he always makes time for an evening with you."
    },
    "amara": {
      "line": "You and Amara agree to take your relationship slowly. There is much still to discuss, including her feelings for Kolade.",
      "favoured": "She thanks you for hearing her out. Neither of you pretends that the road ahead will be easy."
    }
  },
  "heritage": {
    "reject": "The dreams of Morrak's throne ceased. You had refused his succession and meant to keep that promise.",
    "neutral": "The dreams of Morrak's realm became less frequent, but they did not stop. You still had to decide what your heritage would mean for the rest of your life.",
    "embrace": "The dreams continued, and you welcomed them. You still wanted to know how much of Morrak's power you could claim."
  },
  "outcome": {
    "beauDrowned": "Beau and nineteen prisoners died when the mine flooded. Their names were carved into a memorial above the sealed entrance.",
    "daiAbandoned": "Dai Morgan was never rescued from the mine. No one could confirm that he had escaped before it flooded.",
    "laylaSold": "The patrol took Layla toward the coast in chains. After that, you heard nothing certain about her fate.",
    "kaitoAbandoned": "You left Kaito trapped in the spiders' web. After the campaign, no word reached you of whether he had escaped."
  }
};
// Exact old paragraphs allow surgical updates to cached endings in existing saves.
D.CAMPAIGN3_OLD_ROMANCE_ENDINGS = {
  "selene": {
    "line": "Delphine is at the Warden house. So are you, most nights. Neither of you has said Beau's name in front of the other yet. You will.",
    "favoured": "She says Tesfaye would have liked how it ended. Then she says he would have cheated a little. Then she laughs, for the first time since the mine."
  },
  "cassian": {
    "line": "Santiago asked you to attend his knighting. You did. The Order pretended not to notice you.",
    "favoured": "He calls it the right ending. He calls everything the right ending. This time you agree with him."
  },
  "ithrel": {
    "line": "Itsuki sleeps through the night now. He says it is the tree. You suspect it is not the tree.",
    "favoured": "He said \"mine\" once more, at the altar, and then never again. He did not need to."
  },
  "ilvara": {
    "line": "Layla sleeps in the chapel and, when it suits her, elsewhere. She is very clear that it suits her.",
    "favoured": "She was standing beside the chair when you sat in it. She has not stopped smiling. It is not a warm smile. It is yours."
  },
  "faelen": {
    "line": "Kaito still flirts with everything. He says it is professional courtesy. He comes home to one door.",
    "favoured": "The Undervault knows his face now, and yours, and treats you both as family. Tunde says that is the debt, paid."
  },
  "amara": {
    "line": "Amara brings bread to the cell every week. You walk her there and wait outside. She has never once asked you to come in.",
    "favoured": "She said you kept your word. She said it as if it were the strangest thing anyone had ever done for her."
  }
};
})();
