// Connected contracts and authored exchanges, using the existing five-quest arcs.
(function () {
'use strict';
const D = ADV.DATA;
const scripts = D.STORY_SCENES = {};
function lines(fid, who, key, text) {
  const table = D.CAMPAIGN_DIALOGUE[fid] || D.CAMPAIGN2_DIALOGUE[fid];
  table[who] = table[who] || {};
  table[who][key] = text.split('|').map(t => ({ t }));
}
function scene(fid, who, key, turns) { scripts[fid + ':' + who + ':' + key] = turns; }
function turn(who, key, to, caption) { return { who, key, to, caption }; }
const arcs = {
maw: {
briefs: [
 'A debtor has hired guards against a Maw contract. Wren wants the contract settled and the papers recovered; those papers may explain who has been warning the watch.',
 'The recovered papers point to a courier carrying guild names. Recover the ledger before the watch receives another copy.',
 'The ledger points to an insider called the Understudy. Find how the names are leaving the guild. Kite can accompany you.',
 'The next contract uses the same courier route. Follow it to the target, but expect someone to be watching for the guild.',
 'Arden still has informants placing guild members in danger. Vane will help stop her operation. The evidence already delivered to the watch will remain a threat.'
],
offer: "[quietly] Wren Pell. The laundry is real. The work behind it is less respectable.|[calm] You have a record of criminal contracts. That is why I'm speaking to you.|[quietly] The Gaping Maw pays for work people won't put on the public board. If you want in, I have a contract ready.",
rival1: "[calm] Kite. Before you ask, no, the laundry doesn't clean blood out for free.|[thoughtful] I check the way out before I look at the target. The fee isn't much use if you can't collect it.",
rival2: "[calm] That ledger has people frightened. I'm one of them. Give me a moment with it before Wren files it away.|[quietly] If we're sent after the leak, I'd rather we both knew what we're walking into.",
join: "[calm] I'll watch for whoever is watching us. You keep an eye on the job itself.",
after3: "[quietly] It's easier to think when I don't have to watch every direction alone.|[playfully] Don't tell Wren. He'll put partnership down as a substitute for hazard pay.",
before4: "[calm] Same courier route. I don't like that.|[quietly] We'll compare what we see before we commit to anything.",
debriefs: [
 '[calm] The contract is closed. These papers are the part I want to examine. Someone knew where our people would be.',
 '[thoughtful] The list matches our contracts. This is coming from inside the guild. I want the Understudy found before another name goes out.',
 '[quietly] The leak is real. The next contract follows its route. I will not call that a coincidence.',
 '[sad] Kite is gone. I keep looking toward the door.|[quietly] I used to complain about the mud on those boots. I wish there were mud on the floor now.'
],
appear: '[calm] Guild marks. A contract. Witnesses. You have brought everything I needed.',
death: '[alarmed] Crossbow! Get behind the stone—',
afterKill: '[quietly] The guild killed my mother. My father paid for it. I killed him, and the contracts kept coming.|[flatly] The watch has the names now. Tell Vane his secrecy is gone. That is why I am letting you leave.',
hunt: '[quietly] Arden has been turning our contracts into traps. I should have acted when the first names disappeared.|[calm] We stop the killings tonight. Then we deal with the watch. Killing her will not make that ledger vanish.',
final: '[angry] Vane. You finally came yourself.|[calm] The evidence is already delivered. If you want silence, you are too late.',
afterFall: '[quietly] No more contracts through that route. I will tell Wren myself.|[sad] Kite should have been here to tell me I was late.',
ending: '[calm] The watch still has our names. We move the people at risk and abandon the exposed routes.|[quietly] There is a place for you here. We will remember who made room for it.'
},
antler: {
briefs: [
 'A rival company is collecting an unauthorized toll. Reopen the road under the client\'s contract and find out who hired them.',
 'The client disputes payment for the reopened road. Settle the contract. The company\'s low costs have also attracted an auditor\'s attention.',
 'Two companies claim the same work. Resolve the competing contract. Dain can accompany you; ask what his contract expects of the people under him.',
 'Escort duty along the reopened road. Dain\'s use of Conscript has drawn a divine champion. The company cannot assume its paperwork protects him.',
 'Crane wants revenge for Dain. Hargrave acted against his use of Conscript. Choose whose cause you will support; the choice has consequences beyond this company.'
],
offer: '[calm] Bregga Holt. I hire for the Antler.|[calm] You have completed enough work to know that a contract and a promise ought to mean the same thing. They do here, on paper at least.|[thoughtful] We take lawful clients and criminals. Read the work before you sign. Interested?',
rival1: '[calm] Dain Roscarrow. I read the road contract. A toll is easy to remove; keeping the next band out takes a company.|[playfully] Which is why Holt keeps us. That and our ability to carry furniture.',
rival2: '[thoughtful] People see a shield and expect you to stand still. The trick is knowing where standing matters.|[calm] Come on the next one if you want to see how I work.',
join: '[calm] Keep the contract in mind. Winning a fight in the wrong place can still lose the job.',
after3: '[quietly] I like having someone beside me who is here by choice.|[thoughtful] Yes. I know what that sounds like, coming from me.',
before4: '[quietly] Holt thinks a champion is coming for me. She may be right.|[calm] Whatever happens, the people on this road still need an escort.',
debriefs: [
 '[calm] The road contract is closed. The client wants to discuss the bill. They always find the courage afterward.',
 '[thoughtful] Payment is settled. An auditor has asked about Dain\'s crews. Some serve under Conscript. They did not choose the work.',
 '[quietly] The competing claim is settled. Dain says the contract justified his methods. I do not think a price on paper answers that question.',
 '[sad] I have to close Dain\'s file. I have not picked up the pen.|[quietly] I can miss him and still wish he had listened about Conscript. Both are true.'
],
appear: '[angry] Roscarrow. There you are. I came to kill you. What the fuck did you think this was going to be.',
death: '[quietly] Get the others clear. Finish the escort.',
afterKill: '[flatly] Conscript made people fight for him without a choice. The divine call named him for it.|[quietly] I served beside him once. That did not make this easier, and it did not make those people free.|[calm] My call was for him. Take the survivors home.',
hunt: '[quietly] You deserve the truth before you choose.|[angry] Dain used Conscript to keep his costs down. I let myself believe the figures because they suited the company.|[sad] We were together. I loved him. That does not answer what he did.|[calm] I want Hargrave dead. Helping me kill a hero will bring the divine pursuit on us too. Read that part before you sign.',
final: '[quietly] Crane. I hoped you would bring questions, not a company armed for me.',
afterFall: '[quietly] Dain is still gone. I knew he would be.|[sad] I will have to live with what I asked of you.',
ending: '[calm] There will be no bound crews on our books. I should have said that while he could hear it.|[quietly] Your place in this company is earned. It is not his place. Nobody can fill that by decree.'
},
varenholm: {
briefs: [
 'An unsupervised working is still active in the old quarter. Stop it and recover the student\'s notes so the Academy can identify the fault.',
 'The recovered notation also appears in stolen Academy research. Retrieve the notes from the criminal market before someone repeats the working.',
 'The research points to something raised in the old quarter. Investigate its origin. Cassiel can accompany you to examine the magic.',
 'Six risen bodies are operating without a visible caster. Follow the pattern Cassiel identified and find who controls them.',
 'The Quiet is using Academy research to attack its people. Venn will join the search. Stop him and recover the dangerous research.'
],
offer: '[calm] Adept Lirien, Varenholm Academy. We need field help.|[thoughtful] Your record of lawful work qualifies you. You need not pretend to be a graduate.|[calm] An unsupervised working has escaped its lesson. We need it stopped before someone calls it a new department. Will you take the work?',
rival1: '[calm] Cassiel Vaunt. I am checking the notes from that working.|[annoyed] They copied the containment diagram beautifully. Unfortunately, they copied the coffee stain too.|[thoughtful] I want to know where they got the original.',
rival2: '[thoughtful] These pages belong together. Someone separated the safety instructions from the useful part.|[calm] I would like to work with you on the next investigation. You know what the field actually looks like.',
join: '[calm] I will examine the working. Keep an eye on the room while I do. We both need to be able to concentrate.',
after3: '[warmly] I enjoyed working with you. That is not a mark on an assessment.|[playfully] If you visit the library, come find me. I know which chairs are comfortable. Classified information.',
before4: '[thoughtful] Six bodies, no caster. Someone wants us looking at the bodies.|[calm] Let us take our time before we decide what the spell is doing.',
debriefs: [
 '[calm] The working is stopped. Cassiel is examining the notes. There is something familiar in the notation.',
 '[thoughtful] The pages are back. They came from restricted research, with the warnings removed. I have sent a copy to the Magister.',
 '[quietly] The raised thing confirms it: this is deliberate. The next report mentions six bodies moving together.',
 '[sad] Cassiel left notes for the next investigation. I keep reaching for them as if she will come in to explain.|[quietly] Sit a moment. There is no form you need to fill in for me.'
],
appear: '[calm] Still examining the visible spell. You were taught to look for the caster afterward.',
death: '[alarmed] The working is behind us. Move—',
afterKill: '[flatly] I wrote the research you followed. I knew where it would lead you.|[angry] They expelled me for raising a body and kept teaching from my notes. Now they will have to explain whose work this is.|[calm] Tell Venn I am done asking to be readmitted.',
hunt: '[quietly] I expelled him. I also let his research stay in circulation. That was my responsibility.|[calm] We have the pattern now. We stop him and secure the notes. I am coming with you.',
final: '[angry] Magister. Are you here to take the notes or destroy the evidence?|[flatly] You could have answered me before any of this.',
afterFall: '[quietly] Secure the research. No one copies another page until it has been reviewed.|[sad] Cassiel should have been the one arguing with me about the precautions.',
ending: '[calm] The Academy owes you more than a certificate. Your place here includes the right to ask difficult questions.|[quietly] I am keeping Cassiel\'s desk until her work is properly recorded. Come by when you want to remember her.'
},
bell: {
briefs: [
 'A scribe is collecting the Bell\'s names. Stop the leak and recover the list; Obaa-San needs to know how it was assembled.',
 'A watcher has followed the list\'s route. Find who sent him. Records say this man has been dead for years.',
 'The watcher knew a route used by the Bell\'s Left Hand. Investigate the connection. Suzume can accompany you.',
 'A contract leads through another old Bell route. The repeated use of dead agents suggests someone knows the clan\'s past too well.',
 'Jiro has returned from an old assassination order. Kaede will confront the consequence of that order beside you.'
],
offer: '[calm] The paper is for sale. The work is behind the counter.|[thoughtful] I am Obaa-San. The Hollow Bell needs people who pay attention before reaching for a knife.|[calm] There is a scribe keeping our names. Bring me his list. You may take the contract if you want to join us.',
rival1: '[calm] Suzume. If you hear someone running over the shop, that is usually me.|[playfully] The roof is quicker. The stairs are for carrying tea without explaining yourself.',
rival2: '[thoughtful] A watcher who should be dead. I checked the old route; someone has been using it.|[calm] On the next job, I would like another pair of eyes.',
join: '[calm] I will watch ahead. If I come back, let me finish telling you why before we move.',
after3: '[warmly] I liked having you there. It was good to compare what we saw.|[playfully] You can use the stairs when you visit. I will only judge you a little.',
before4: '[quietly] Another old route. I have marked where we can turn back.|[calm] Whatever is waiting knows the Bell. We should not assume it is waiting alone.',
debriefs: [
 '[calm] The list is recovered. Someone added names that have not been used in years. That concerns me more than the fresh ones.',
 '[quietly] That watcher was recorded dead. Someone has put him back to work. I have asked Kaede to open the old records.',
 '[thoughtful] The routes connect. This is someone using our own history to approach us.',
 '[sad] Suzume used to arrive through the upstairs window. I have asked people not to close it yet.|[quietly] Kaede is here. This time she can tell the old story herself.'
],
appear: '[quietly] These routes were mine before they were yours.',
death: '[alarmed] Behind us. Get clear of the passage—',
afterKill: '[flatly] Kaede ordered my death twenty years ago. Someone raised me, and I kept walking after the working ended.|[quietly] I asked why. Her people sent knives instead of an answer.|[calm] Tell her I am close enough now to ask myself.',
hunt: '[quietly] I signed the order against him. The file survives; the reason in it does not justify the certainty I had.|[calm] I let the old routes stay open. Suzume paid for that. We close them and face him together.',
final: '[quietly] Kaede. You brought yourself this time.|[flatly] Tell me you at least read the order before you signed.',
afterFall: '[sad] I should have answered while he could still hear an answer.|[quietly] We are closing those routes. No one else is going out through them.',
ending: '[calm] Every old order will be reviewed. Remembering names is not enough if we refuse to remember what we did.|[quietly] Suzume has a place in the record as she lived, not just a line about how she died. So do you.'
},
green: {
briefs: [
 'Clear the north road under the clan\'s writ. Takeda also wants reports of anyone questioning the clan\'s old enforcement orders.',
 'A summons has been resisted. Enforce the writ and recover the disputed record; the complaint concerns a house the clan burned.',
 'The disputed record has divided the clan\'s officers. Resolve the challenge to the current mission. Ayame can accompany you.',
 'Escort Isamu\'s cousin along the north road. A survivor of the old fire is targeting the clan; the escort may draw her out.',
 'Tomoe seeks Isamu over the deaths in the fire. He will face her alongside you. The clan must answer for the order as well as stop the killings.'
],
offer: '[calm] Master Takeda, of the Green-Eyed. Your lawful contracts qualify you for our work.|[thoughtful] We train people to hold a position when others depend on it. Footwork is part of that. Judgment is the harder part.|[calm] There is work on the north road. Take it if you wish to be considered.',
rival1: '[formal] Ayame. I train here when I am not on the road.|[calm] People watch the blade. I watch where the next step can go.|[playfully] Less impressive in a demonstration. Much more useful when the floor is wet.',
rival2: '[thoughtful] I read the disputed order. I want to hear why it was issued, not just that it bears a seal.|[calm] I have asked to accompany you. We should both know what we are enforcing.',
join: '[calm] I will keep an eye on the approach. Tell me if the job stops matching the order.',
after3: '[warmly] I was glad you were there. It helps to have someone outside the hall\'s arguments.|[calm] Come practise with me sometime. We can leave the reports outside.',
before4: '[quietly] An escort along the same road. I have checked the approach, but I do not like the timing.|[calm] Keep the person we are escorting in mind. That is the work.',
debriefs: [
 '[calm] The road is clear. The reports mention an old fire. I have asked for the writ that authorized it.',
 '[quietly] The writ was lawful. The complaint about the fire is also true. I will not use one fact to hide the other.',
 '[thoughtful] The officers have their answer for now. Isamu needs to answer the older question himself.',
 '[sad] Ayame questioned an order and still did the work carefully. That took more courage than some of this hall admits.|[quietly] I will miss practising with her. Isamu is waiting, and he can wait a little longer.'
],
appear: '[quietly] Move the escort aside. I am here for the clan that burned my home.',
death: '[alarmed] She is already drawing. Get clear—',
afterKill: '[flatly] Isamu signed the order. My husband and children died in the house.|[quietly] I learned the clan\'s forms because a petition never reached him.|[calm] Tell him whose road this has become. I am coming for him.',
hunt: '[quietly] I signed the order that destroyed her home. I accepted the city\'s account without examining it.|[calm] She has killed Ayame. We must stop this, and then the order will be opened to the hall. I will answer for my part.',
final: '[angry] Isamu. Will you say their names now that you have to look at me?|[quietly] I wanted an answer before I learned how to reach you with a blade.',
afterFall: '[sad] Ayame should have lived to hear the answer she asked for.|[quietly] Bring the order to the hall. No sealed file, no private explanation.',
ending: '[calm] The order and the names of those killed will be read before the clan. My signature will remain on it.|[quietly] You have earned your place. Keep the judgment that Ayame valued in a companion.'
},
tally: {
briefs: [
 'Find where the missing shares went. Cask needs the ledger corrected and the crew paid; he wants the dispute settled rather than another empty berth.',
 'The Factor is withholding payment for cargo. Recover what the contract owes and learn why naval pressure has made him hesitate.',
 'Ordell\'s fleet is competing for the same prize. Settle the claim before the navy closes the channel. Beau can accompany you.',
 'A merchant prize offers a route through the tightening patrols. The escort appears light; inspect what is waiting behind that appearance.',
 'Kessler is closing the channel on the remaining crews. Saint-Cloud will sail with you to break the interception and get them home.'
],
offer: '[calm] Cask. I keep the Red Tally\'s shares. You can sit down; just leave the ledger where it is.|[thoughtful] Your criminal work qualifies you. We are pirates, and joining us closes the lawful doors for this life.|[calm] The crew needs an honest count even when the cargo is stolen. Want a place on the books?',
rival1: '[playfully] Beau Castell. Best shot in the fleet. Cask leaves that out because he pays me the same either way.',
rival2: '[thoughtful] The navy has the Factor nervous. I would rather know where the patrols are than how brave he thinks we are.|[playfully] Come on the next prize. You can see whether my stories improve in the telling.',
join: '[calm] Keep an eye on the whole deck. I will watch the guns.',
after3: '[warmly] Cask is paying out. Come eat with me after.',
before4: '[thoughtful] Light escort. Plenty of space to hide more men below.|[calm] I will watch the rail. We should know what is on the deck before trusting the manifest.',
debriefs: [
 '[calm] The shares are accounted for. The crew needed to see the book checked. Now, there is someone you should meet.',
 '[thoughtful] The payment is settled. The Factor is frightened of the navy. Saint-Cloud is checking the patrol routes.',
 '[calm] The competing claim is settled. The patrols are moving inward. We will need a route for the rest of the crews.',
 '[sad] Beau is gone. I have opened the ledger at his entry three times.|[quietly] I keep thinking he will come in and argue about the wording.'
],
appear: '[calm] Marines, close the rail. The boarding party has nowhere else to go.',
death: '[alarmed] Over the side! Take the rope—',
afterKill: '[quietly] He cut the way open for you. I saw it.|[calm] Tell Saint-Cloud the channel is closed. She can bring her ships in or come and dispute it herself.',
hunt: '[quietly] Kessler is closing the channel. If we leave the crews there, Beau will not be the last name Cask has to close.|[calm] I am sailing with you. We break the interception and bring them home.',
final: '[calm] Captain Saint-Cloud. I offered you a surrender.|[flatly] I cannot keep trade moving while your fleet takes its cargo. You knew that before you sailed.',
afterFall: '[calm] The ships can clear the channel now. Send the signal.|[quietly] I wish Beau were here to make an outrageous claim about his contribution.',
ending: '[calm] The shallows are open for now. The empire still has ships; this buys our crews a way home.|[quietly] When you are ready, come stand with us when we say goodbye to Beau. You have a place with the crew.'
},
navy: {
briefs: [
 'Clear the smugglers\' route through the shallows and recover their sailing papers. Crell wants to know how they avoided the patrol.',
 'The papers identify a captain carrying cargo without clearance. Settle the seizure and examine the route; coastal villages depend on these shipments too.',
 'Two officers dispute how the route should be patrolled. Resolve the command problem. Merrow can accompany you to examine the water herself.',
 'Patrol the revised route. Ash has avoided the obvious channels, and Merrow suspects he has learned the navy\'s schedule.',
 'Ash used the patrol schedule to strike. Kessler will join the pursuit. End the raids and reopen the route for civilian cargo.'
],
offer: '[calm] Boatswain Crell. Your lawful work qualifies you to sign on.|[thoughtful] We keep cargo moving through these waters. Sometimes that means shooting. Usually it means finding out why the shooting started.|[calm] King\'s pay, naval orders, and no criminal contracts while you serve. Read that before you make your mark.',
rival1: '[formal] Lieutenant Isolde Merrow. I am reviewing the patrol reports.|[thoughtful] The official chart has a sandbar where the deep channel is. An impressive place to put the ink.|[calm] I would like the next report to come from someone who was actually there.',
rival2: '[thoughtful] The cargo was bound for a village. The seizure may be lawful, but the village still needs to eat.|[calm] I have asked to see the route with you before another order is written.',
join: '[calm] I will watch the approach. Tell me what the chart gets wrong.',
after3: '[warmly] I enjoyed working with you. That part is not going in the formal report.|[playfully] Come by when I am off duty. I can discuss something other than shipping. I would appreciate the practice.',
before4: '[thoughtful] The patrols are too predictable. If we can read the schedule, so can Ash.|[calm] Keep an eye beyond the usual approach.',
debriefs: [
 '[calm] The route is cleared. Merrow is checking the papers. The old chart is making this harder than it needs to be.',
 '[quietly] The seizure is settled. The captain named the village expecting that cargo. I have passed it to the Admiral, not just the filing clerk.',
 '[calm] The command dispute is settled. Merrow has a revised route. She wants it checked on the water before anyone calls it safe.',
 '[sad] Merrow left a correction on my desk. I was going to tease her about the handwriting.|[quietly] I have not moved it. Sit a moment if you need to.'
],
appear: '[playfully] Right on schedule. What the hell did you expect from a very orderly navy.',
death: '[alarmed] The other rail! Get off the crossing—',
afterKill: '[quietly] She saw the second boarding party. Most officers kept watching me.|[calm] Take that home with you. Tell the Admiral his schedule is no longer his alone. God damn it, he should have listened.',
hunt: '[quietly] Merrow warned us about the schedule. I should have acted sooner.|[calm] We have changed the patrols. Now we go after the man using them against us. I am coming with you.',
final: '[playfully] Admiral. A different route this time. Someone finally changed the fucking orders.|[calm] You still have to take the deck from me.',
afterFall: '[calm] Signal the patrol. The cargo route can reopen.|[sad] Merrow should have been here to correct the report. Write it properly anyway.',
ending: '[calm] The north-coast cargo will have an escort. The village gets its supplies, and the patrol charts will be corrected.|[quietly] Your service is recorded beside hers. She wanted the work done properly. You helped us do that.'
}
};
for (const [fid, arc] of Object.entries(arcs)) {
  const f = D.FACTIONS[fid], r = f.rival, rec = f.recruiter, boss = f.boss, ant = f.antagonist;
  arc.briefs.forEach((brief, i) => { D.CAMPAIGN_QUESTS[fid][i].brief = brief; });
  lines(fid, rec, 'offer', arc.offer);
  arc.debriefs.forEach((text, i) => lines(fid, rec, 'debrief' + (i + 1), text));
  for (const [key, text] of Object.entries({after1:arc.rival1, after2:arc.rival2, join3:arc.join, after3:arc.after3, before4:arc.before4, death:arc.death})) lines(fid,r,key,text);
  lines(fid, r, 'banter', '[calm] Keep watching the field. I am with you.|[quietly] We still have work to do.');
  for (const [key,text] of Object.entries({appear:arc.appear, afterKill:arc.afterKill, final:arc.final})) lines(fid,ant,key,text);
  for (const [key,text] of Object.entries({hunt:arc.hunt, afterFall:arc.afterFall, ending:arc.ending})) lines(fid,boss,key,text);
  // Captions establish place and objective without claiming an unplayed action.
  D.CAMPAIGN_QUESTS[fid].forEach((q,i) => { q.storyCaption = arc.briefs[i]; });
}
// Antler's branches retain their gameplay effects but have a consistent timeline.
const fieldLines = {
 maw: 'Keep an eye on the approaches. I will watch the way out.|Stay aware of the exits. This job is no use if we cannot leave.',
 antler: 'Keep your footing. A shield is useful; falling over behind it is not.|Watch the gaps between us. That is where a company comes apart.',
 varenholm: 'Watch the shape of the working, not just the light.|Keep sight of the casters. The impressive glow is a distraction.',
 bell: 'Watch the hands. Feet can lie more convincingly.|Keep the approaches in view. A quiet enemy is still an enemy.',
 green: 'Watch the distance before the blade. That is where the strike begins.|Keep your balance. A beautiful cut is little comfort from the ground.',
 tally: 'Watch your footing. Looking dashing is secondary to having feet.|Keep the lines clear. Tangled equipment is a fucking embarrassing opponent.',
 navy: 'Keep the approaches in sight. Watch for the move behind the obvious one.|Mind the spacing. We need room to work without leaving gaps.'
};
for (const [fid, text] of Object.entries(fieldLines)) lines(fid, D.FACTIONS[fid].rival, 'banter', text.split('|').map(t => '[focused] ' + t).join('|'));
D.STORY_DEATH_CAPTIONS = {
 maw: 'Kite sees the crossbow in the upper window and pulls you behind the stonework. Arden has a second line of fire. Kite falls before reaching cover.',
 antler: 'Dain puts his shield between the escort and Hargrave. He holds the narrow road long enough for the others to withdraw. Hargrave advances to face him alone.',
 varenholm: 'Cassiel catches the first working and turns it aside. Then he sees the second, prepared behind your position. He breaks his own ward to shove you clear.',
 bell: 'Your companion checks the passage behind you and catches the first blade. Jiro is already inside the guard. There is only time for a warning.',
 green: 'Your companion recognizes the opening form and moves to intercept. The swordswoman changes the angle at the last step, driving past the guard.',
 tally: 'Beau cuts a fouled rope and kicks it over the rail toward you. The way off the deck opens. He turns to cover the crossing; his opponent is already moving.',
 navy: 'Merrow spots the second boarding party and hauls the crossing line clear. Her warning gives you a way off. She turns back toward the other rail.'
};
lines('antler','holloway','facing','[quietly] Crane. I hoped you would bring questions, not swords.|[calm] You know why I was called. Killing me will not undo what Dain did.');
lines('antler','holloway','join','[quietly] Thank you for listening before choosing.|[calm] I want this to stop. Stay aware of the people she brought; they follow her orders.');
lines('antler','holloway','afterCrane','[sad] We served in the same company. I never wanted it to end here.|[quietly] We will release every bound worker and put their names on the books as people owed wages.');
lines('antler','holloway','ending','[calm] The company still has contracts to finish. No one will finish them under a binding.|[quietly] We will remember Dain and Crane honestly. That includes what we wished they had done differently.');
lines('antler','crane','afterHolloway',arcs.antler.afterFall);
lines('antler','crane','against','[sad] You chose against me. I understand why.|[angry] I am still here. If this ends in a fight, then face me.');
// Fixed exchanges are clips owned by the named speaker, never borrowed voices.
lines('tally','hallow','introduce','[calm] This is Beau. You will be working together if you stay.');
lines('tally','hallow','harness','[flatly] That harness belongs to a deckhand. Stop charging him for repairs.');
lines('tally','beau','harness','[calm] I am not charging him. Look at the buckle. It would have opened halfway across.');
lines('tally','hallow','checkHarness','[quietly] Leave it with me. I will check the rest.');
lines('tally','beau','cantSpare','[playfully] See? Cannot spare me.');
scene('tally','beau','after1',[
 turn('hallow','introduce','player','Beau is checking a boarding harness beside the ledger.'), turn('beau','after1','player'),
 turn('hallow','harness','beau'), turn('beau','harness','hallow'), turn('hallow','checkHarness','beau'), turn('beau','cantSpare','player')
]);
lines('tally','hallow','tab','[flatly] Your tab first.');
lines('tally','beau','tab','[playfully] I was building up to that.');
lines('tally','beau','seat','[warmly] I will save you a seat.');
scene('tally','beau','after3',[turn('beau','after3','player'),turn('hallow','tab','beau'),turn('beau','tab','hallow'),turn('beau','seat','player')]);
lines('tally','saintcloud','crew','[quietly] Who has told the crew?');
lines('tally','hallow','crew','[quietly] No one yet.');
lines('tally','saintcloud','tellCrew','[quietly] I will do it.');
lines('tally','hallow','stay','[softly] You can stay here a while.');
scene('tally','hallow','debrief4',[turn('hallow','debrief4','player','Cask closes the ledger. Saint-Cloud joins you.'),turn('saintcloud','crew','hallow'),turn('hallow','crew','saintcloud'),turn('saintcloud','tellCrew','hallow'),turn('hallow','stay','player')]);
// Make the opposing role clear; Jiro does not represent the clan hunting him.
D.FACTION_WAR_DIALOGUE.bell.who = 'kaede';
D.FACTION_WAR_DIALOGUE.bell.open = [
 {t:'[quietly] You are approaching a Hollow Bell operation. Our people know you are coming.'},
 {t:'[calm] Turn back if you do not want to fight for this contract.'},
 {t:'[angry] What the fuck did you think this was. Draw or leave.'}
];
D.FACTION_WAR_DIALOGUE.bell.boss = [
 {t:'[quietly] Those are our people at the last post. They have orders to hold it.'},
 {t:'[calm] Whatever you were paid, this will not end the Bell.'},
 {t:'[angry] God damn it, finish it. They will not give you a second chance.'}
];
// Kessler's rewritten afterKill must not play the hanging clip (afterKill_2).
const kesslerKill = (D.CAMPAIGN2_DIALOGUE.tally && D.CAMPAIGN2_DIALOGUE.tally.vanekessler || {}).afterKill;
if (kesslerKill && kesslerKill[1]) kesslerKill[1].vo = 3;
// Bosses who never received a fight beat still need one unique remark.
lines('maw','vane','fight','[angry] Do not let her talk. Put that bitch down.|[flatly] Watch the knife. If she speaks, she is buying time.');
lines('varenholm','venn','fight','[angry] Kill the word before the spell.|[flatly] Do not let him finish a sentence. God damn it, hit him.');
// Remove false offers of a peaceful departure from mandatory boss openings.
D.GOD_LINE_DIALOGUE.pale_mother = [
 {t:'[quietly] You have reached the bonehouse armed. I know what that means.'},
 {t:'[calm] These names were people before they were mine to keep. Remember that when you draw.'},
 {t:'[quietly] Come, then. Let us see what you brought all this way.'}
];
D.GOD_LINE_DIALOGUE.first_bloom[2] = {t:'[flatly] You have brought steel into the roots. The green will remember where you stood.'};
})();
