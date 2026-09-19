// The revised finale is separate from legacy dialogue so queued old endings remain readable.
(function () {
'use strict';
const D = ADV.DATA, W = 'wren_ward', K = 'korvath';
const L = (who, key, text) => { D.CAMPAIGN3_DIALOGUE.gate[who][key] = text.split('|').map(t => ({ t })); };
const B = (who, key, more = {}) => ({ who, key, ...more });
const CH = (id, options) => { D.CAMPAIGN3_CHOICES[id] = { options }; };
const old = D.CAMPAIGN3_SCRIPT[14];
D.GATE_LEGACY_FINALE = old;

// ---------------------------------------------------------------- Kolade's set-pieces
// Kolade's plate and reach are the whole point of him, so his sweeps are written as a share
// of what each body can take rather than as a power number. A company in the best armour in
// the game feels the same arc as a company in mail; the answer is to move, to guard, or to
// kill him before the count comes round again — not to out-stat him. All three are boss-only:
// `unique` keeps them out of every learnable pool, trainer offer and gear set.
const boss = o => { D.SKILLS[o.id] = Object.assign({ kind: 'active', unique: true, noSlot: true, noTierGrowth: true, reach: 'any', power: 0, melee: true, signature: true }, o); };
boss({ id: 'reaving_arc', name: 'Reaving Arc', target: 'enemyFront', pctMaxHp: 0.20, cooldown: 3,
 desc: 'A single sweep across the front rank. Everyone standing in it loses a fifth of their maximum health. Once every three rounds.' });
boss({ id: 'unbound_arc', name: 'Unbound Arc', target: 'enemyFront', pctMaxHp: 0.40, cooldown: 3,
 desc: 'The same sweep, carrying a god\'s stolen strength. Everyone in the front rank loses two fifths of their maximum health. Once every three rounds.' });
boss({ id: 'the_strongest_among_you', name: 'The Strongest Among You', target: 'enemy', targetHighestHp: true,
 pctMaxHp: 0.75, cooldown: 5, ignoreGuards: true,
 say: { who: K, on: 'q14_boss_challenge', survived: 'q14_boss_survived', killed: 'q14_boss_killed' },
 desc: 'Kolade picks out the largest body on the field — by the health it was built to carry, not the health it has left — and takes three quarters of it in one cut. Once every five rounds.' });
L(K, 'q14_boss_challenge', '[cold] I will challenge the strongest among you.');
L(K, 'q14_boss_survived', '[hard] You will not stop me, you will join our sister and the rest.');
L(K, 'q14_boss_killed', '[quiet] One more murder, one more sacrifice on my road to God Hood.');

// Hostility is an approach, not a death certificate. Resolution is recorded by GateFinale.
const amaraFight = D.CAMPAIGN3_CHOICES.q13_amara_gate.options.find(o => o.id === 'fight');
delete amaraFight.kill; delete amaraFight.set;
amaraFight.noEscape = true;
const q14 = D.CAMPAIGN3_QUESTS[13];
q14.brief = 'Kolade has lost the city and the war he planned. Follow him into Morrak’s temple before he can complete another sacrifice.';
q14.enc[2].escapes = true;
q14.enc.push({ boss: K, with: [], ascendant: true, label: 'Morrak’s realm — the unfinished ascension' });
D.CAMPAIGN_QUESTS.gate[13].enc = q14.enc.map(e => ({ ...e }));

L('ambrose', 'q10_letter_give', '[quiet] Tesfaye began this letter when he brought you here. He added to it before you left. He asked me to keep it safe until you were ready to know.');
L('aldric', 'q10_blood_of_two', '[echoing] "There is something else I should have told you both. Hiwot is also Morrak’s child. A Warden brought her to Lanternhold after the same raid. I raised you together because neither of you should have had to face this alone.|[echoing] If one of you dies, the power in your blood returns to Morrak’s realm. His priests know how to bind a soul to it. Keep each other away from their altars."');
const letterBeats = D.CAMPAIGN3_SCRIPT[10].openers[2];
letterBeats.splice(letterBeats.findIndex(b => b.who === 'aldric' && b.key === 'q10_letter') + 1, 0,
 B('aldric', 'q10_blood_of_two', { artPrison: true, set: { hiwotHeritageKnown: true }, caption: 'On the back of the letter, Tesfaye has added a warning for both of you.' }));

L(K, 'q14_final_open', '[controlled] The Council has your evidence. My claim to the city is finished, and the war I prepared will not happen. You have cost me an army and years of work.|[cold] You have not stopped the succession. Morrak left part of his power in each of his children. I have taken it from those I killed. Baba taught me how to use it.');
CH('q14_final_first', [
 { id: 'anger', text: 'You murdered Tesfaye, you bastard. I came here to kill you.', reply: B(K, 'q14_final_anger') },
 { id: 'justice', text: 'You have killed enough people. Surrender.', reply: B(K, 'q14_final_justice') },
 { id: 'truth', text: 'Before this ends, you are going to tell me the truth.', reply: B(K, 'q14_final_truth') },
]);
L(K, 'q14_final_anger', '[hard] I killed him. He knew what I wanted, and he stood between us. He chose to die protecting you. I went there prepared to kill him.');
L(K, 'q14_final_justice', '[cold] The Council would keep me in chains until it could decide how to execute me. You may prefer that. I do not.');
L(K, 'q14_final_truth', '[measured] Then ask. You have read enough of my correspondence to deserve an answer from me.');
L(K, 'q14_final_reports', '[measured] My couriers brought reports from the roads, the mines and the city. I know how you reached me.');
L(K, 'q14_final_amara_dead', '[quiet] Amara is dead. She went there to bargain for my life, and you killed her. Tell me again how far you are willing to go for someone you love.');
L(K, 'q14_final_amara_here', '[hard] Amara. I asked you to hold the gate. Now you stand beside the person who means to kill me.');
L(K, 'q14_final_amara_spared', '[quiet] You let Amara live. I had expected you to kill anyone I put between us.');
L(K, 'q14_final_folake_dead', '[cold] Folake offered you information. You killed her. My guards reported what happened on her floor.');
L(K, 'q14_final_folake_arrested', '[measured] You had Folake arrested. She knew enough to ruin me, and you kept her alive to give evidence. That was a costly loss.');
L(K, 'q14_final_folake_bargain', '[dry] Folake offered you my death in return for the Consortium. One of her servants brought me the terms. She always did know what she wanted.');
L(K, 'q14_final_grove_peace', '[measured] You reached an agreement with the druids. They let you through their wood. I had only enemies there.');
L(K, 'q14_final_grove_retreat', '[measured] You drove the druids from the path. Their elders survived. My scouts saw them withdraw into the wood.');
L(K, 'q14_final_grukhar_dead', '[cold] Grukhar offered you the letters for his life. You killed him and took them. You had already been offered another way.');
L(K, 'q14_final_grukhar_spared', '[dry] Grukhar gave you the letters, and you let him leave. A useful bargain. I doubt the miners thanked you for it.');
L(K, 'q14_final_flood', '[hard] You opened the sluice while the prisoners were still below. Beau died with them. You knew they had not reached the stairs.');
L(K, 'q14_final_rescue', '[measured] You held the valve room until the prisoners were clear. That cost you time and put your company at risk. You could have opened the sluice sooner.');
L(K, 'q14_final_segun', '[dismissive] Segun and his men failed to hold the stairs. I paid him well to keep you out. It seems I overestimated him.');
L(K, 'q14_final_accuse', '[insistent] You have killed people who offered you another way. You had reasons for each of them. I have reasons too. Do you believe Morrak cares which of us can defend those reasons?');
L(K, 'q14_final_mercy', '[measured] You spared people I expected you to kill. Some of them helped you reach me. I misjudged what you could achieve that way.');
CH('q14_final_history', [
 { id: 'reject', text: 'You ordered these murders. Fighting your men does not make me your accomplice.', reply: B(K, 'q14_final_rebuttal') },
 { id: 'regret', text: 'I made choices I regret. I am still going to stop you.', reply: B(K, 'q14_final_regret') },
 { id: 'mercy', text: 'I spared people you would have killed. You know that.', when: { flag: 'finaleMercyKnown' }, reply: B(K, 'q14_final_mercy_reply') },
]);
L(K, 'q14_final_rebuttal', '[cold] You are responsible for your choices. I am responsible for mine. I will not pretend otherwise.');
L(K, 'q14_final_regret', '[cold] Regret will not bring them back. You still have to decide what to do with me.');
L(K, 'q14_final_mercy_reply', '[measured] I do. I thought mercy would make you easier to stop. I was wrong.');
L(K, 'q14_final_questions', '[steady] You wanted answers. What else do you need to know?');
CH('q14_final_questions', [
 { id: 'lineage', text: 'How did you learn who your father was?', ask: true, reply: B(K, 'q14_final_lineage') },
 { id: 'rescue', text: 'What happened when Tesfaye found us?', ask: true, menu: 'q14_final_childhood', reply: B(K, 'q14_final_rescue_truth') },
 { id: 'plans', text: 'Tell me about Adigun and your plans for the throne.', ask: true, menu: 'q14_final_plans', reply: B(K, 'q14_final_questions') },
 { id: 'enough', text: 'Enough. I will stop you.' },
]);
CH('q14_final_childhood', [
 { id: 'blame', text: 'Tesfaye believed you were dead. He did not choose to abandon you.', ask: true, reply: B(K, 'q14_final_blame') },
 { id: 'back', text: 'There is something else I want to know.', reply: B(K, 'q14_final_questions') },
]);
CH('q14_final_plans', [
 { id: 'father', text: 'What did Adigun know about your plans?', ask: true, reply: B(K, 'q14_final_father') },
 { id: 'trap', text: 'You arranged Adigun’s death and my arrest.', ask: true, reply: B(K, 'q14_final_trap') },
 { id: 'rite', text: 'You have lost the war. How can you still ascend?', ask: true, reply: B(K, 'q14_final_rite') },
 { id: 'back', text: 'There is something else I want to know.', reply: B(K, 'q14_final_questions') },
]);
L(K, 'q14_final_lineage', '[measured] Baba Olusegun brought me the temple records. He found my mother’s name and traced what happened to her child. Adigun had paid him to educate me. He gave me considerably more than my father intended.|[cold] At first I had only his word and the records. Then he found another of Morrak’s children. I killed the man and felt his power pass into me. After that, I paid for the searches myself.');
L(K, 'q14_final_rescue_truth', '[controlled] Morrak’s priests had gathered children for a sacrifice. They believed our deaths could restore him. Tesfaye and the Wardens attacked before they could finish. He found you alive. He counted me among the dead.|[bitter] Someone came back through the chapel afterwards and found me breathing. I survived. In time, Adigun took me into his house. I knew none of this until Baba found the reports.');
L(K, 'q14_final_blame', '[strained] That is what his report says. I have read it many times. He believed I was dead. He was wrong. He left, and he never came back.|[hard] No, surviving gave me no right to murder him. I wanted you dead, and he would not let me have you. That was the choice I made.');
L(K, 'q14_final_father', '[measured] Adigun paid for the ruined ore and the bandits. He wanted the city frightened enough to pay his prices. A war would have closed his trade routes. When he learned I was buying votes to send the army into Calder, he tried to stop me.|[cold] By then, his couriers were taking my orders. They carried payments to the men hunting our kin. He did not understand what I was doing until he found the death notices.');
L(K, 'q14_final_trap_killed', '[measured] I sent you to his meeting and arranged the witnesses. You killed him. My men told the guards what they had seen, and I accused you. With him dead and you in custody, I could take control of the Consortium.');
L(K, 'q14_final_trap_spared', '[measured] You refused to kill him. I could not let him leave that room alive, so I killed him myself. Then I called the guards. My men supported my accusation, and you were standing beside his body.');
L(K, 'q14_final_trap', '[measured] I arranged the meeting, the witnesses and the guards. Adigun died, you went to prison, and I took control of the Consortium.');
L(K, 'q14_final_rite', '[measured] The war would have given me enough power to claim Morrak’s realm outright. Without it, I need another divine soul to force a passage. Once inside, I can bind the power still held there.|[cold] It will take time. That is why I intend to kill you before you can follow me.');
L(K, 'q14_final_hiwot', '[cold] Hiwot carries the same blood. Tesfaye raised two of Morrak’s children at Lanternhold. Baba found her name beside yours. His rite can bind her soul even after death.');
L(K, 'q14_final_plea_reply', '[firm] Get up, Amara. I know what you are offering. I will not spend the rest of my life in that cell.');
L(K, 'q14_final_last', '[hard] I have answered you. Now decide what you came here to do.');
CH('q14_final_last', [
 { id: 'tesfaye', text: 'Tesfaye should be here. You took him from me. Draw your weapon.', reply: B(K, 'q14_final_draw') },
 { id: 'justice', text: 'I will stop you. Surrender while you still can.', reply: B(K, 'q14_final_draw') },
 { id: 'power', text: 'I know what taking your power would mean. I want it anyway.', heritage: 1, reply: B(K, 'q14_final_power') },
]);
L(K, 'q14_final_draw', '[hard] Then fight me. I will not ask you to forgive me.');
L(K, 'q14_final_power', '[cold] You understand what I have done to reach this point, and you still want to continue it. Very well. You will have to kill me first.');

L(K, 'q14_final_abducted', '[cold] While you followed me down here, my remaining guards went to the inn. They brought Hiwot through the servants’ passage. She is behind the altar.');
L(K, 'q14_final_absent', '[cold] My remaining guards found Hiwot before you reached the temple. They brought her through the servants’ passage. She is behind the altar.');
L(K, 'q14_final_dead_sister', '[cold] Hiwot’s soul has already returned to our father’s realm. Baba bound it to this altar. I did not need to find her alive.');
L(K, 'q14_final_ritual', '[breathless] You broke my army. You have beaten me here. But you brought the rite within reach.');
L(W, 'q14_final_warning', '[urgent] The marks on the floor! They lead to the altar. Get away from them!');
L(W, 'q14_final_taken', '[shocked] No. Let go of me!');
L(K, 'q14_final_crossing', '[strained] The passage is open. By the time you reach me, I will have bound the throne.');
L(K, 'q14_final_realm', '[furious] You followed me. Before the binding was complete.|[hard] Then I will finish this myself. Your soul will join hers.');
L(W, 'q14_final_soul', '[weak] I can hear you. He has bound me to the throne. Break his hold before he can finish.');
L(W, 'q14_final_choice', '[quiet] He’s gone. I can feel the power he took, and yours. It is holding this place open.|[steady] If you let it all go, I can come back with you. You will lose Morrak’s blood, and any claim to his throne. If you keep it, you can take his place. I cannot come back that way.');
CH('q14_final_resolution', [
 { id: 'restore', text: 'Come home, Hiwot. I give up the divine power.', ending: 'restore', reply: B(W, 'q14_final_restored', { force: true, artLocation: 'temple' }) },
 { id: 'ascend', text: 'I will keep the power and claim the throne. [Hiwot cannot return.]', ending: 'ascend', reply: B(W, 'q14_final_farewell', { force: true, artLocation: 'morrak_realm' }) },
]);
L(W, 'q14_final_restored', '[unsteady] I can breathe. I thought I would never...|[soft] You came back for me. Let’s get out of here. Please.');
L(W, 'q14_final_farewell', '[quiet] I wanted to go home with you. I hope you remember that.');

D.CAMPAIGN3_SCRIPT[14] = {
 departure: old.departure,
 openers: { 1: old.openers[1], 2: [
  B(K, 'q14_final_open', { choice: 'q14_final_first', caption: 'Kolade waits beside the altar. His helmet lies on the steps. The last of his guards bar the doors behind you.' }),
  B(K, 'q14_final_reports'),
  // GateFinale inserts up to three truthful callbacks here.
  B(K, 'q14_final_questions', { choice: 'q14_final_questions' }),
  B(K, 'q14_final_hiwot'),
  B('amara', 'q14_plea', { when: { not: 'amaraDead', any: [{ company: 'amara' }, { flag: 'amaraPassed' }] } }),
  B(K, 'q14_final_plea_reply', { when: { not: 'amaraDead', any: [{ company: 'amara' }, { flag: 'amaraPassed' }] }, to: 'amara' }),
  B(K, 'q14_final_last', { choice: 'q14_final_last' }),
 ] },
 closing: [B(W, 'q14_final_choice', { force: true, artLocation: 'morrak_realm', choice: 'q14_final_resolution', caption: 'Kolade falls. His binding breaks, and Hiwot’s soul is free. The throne remains empty.' })],
 arrival: [],
};
D.CAMPAIGN3_EPILOGUE.finale = {"amaraMourning":"Amara mourns Kolade. She had hoped to bring him back alive. She asks for time before speaking about what happened in the temple.","cityAftermath":"In Varenholm, the Consortium's ledgers were made public. The Council rejected war with Calder. Caravans began using the roads again, and iron returned to the markets. The families who had lost people to the mines and the hired killers were still waiting for justice.","amaraWaiting":"Amara stayed in Varenholm for a time, hoping for news of Kolade. She would not say what she would do if he returned."};
D.CAMPAIGN3_ENDINGS.restored = { title: 'Home Together', line: 'You gave up the throne to bring Hiwot home.' };
D.CAMPAIGN3_ENDINGS.ascended = { title: 'Morrak’s Successor', line: 'You claimed the throne. Hiwot did not return.' };
D.CAMPAIGN3_EPILOGUE.ending.restored = "Kolade died in Morrak's realm. You released the souls he had bound and gave up the divine power in your blood to bring Hiwot back. She woke beside you on the temple floor, alive and mortal. The passage closed behind you. You had lost your claim to the throne, but you could take your sister home.";
D.CAMPAIGN3_EPILOGUE.ending.ascended = "Kolade died in Morrak's realm, and you claimed the power he had tried to take. Hiwot could not return with you. Her soul passed beyond your reach as you became Morrak's successor. You could still walk the mortal world, but you would return to it without your sister.";
})();
