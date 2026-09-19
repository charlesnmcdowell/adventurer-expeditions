// Hiro's own voice (request): the author as an NPC. Bracketed tags are
// ElevenLabs v3 delivery cues — spoken, never shown (util.renderLine strips
// them). Hidden from the random personality draw.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {}; ADV.DATA = ADV.DATA || {};
ADV.DATA.DIALOGUE.HIRO = {
  id: 'HIRO', name: 'Hiro', sex: 'm', hidden: true,
  general: [
    '[tired] What it do {target}. Enjoying the game?',
    "[sighs] Glad to see you're still checking out my game. Have you tried my other games?",
    "[sad] If you can't afford to donate, it's no big deal. Just send feedback.",
    "If you'd like your own character as an NPC, email me.",
  ],
  friendly: [
    '[softly] Hmmm, now where did I put that katana.',
    "[warmly] I'm glad you're enjoying the game {target}.",
    '[sorrowful] Let me know if I need to balance some of this game\'s mechanics.',
    '[thoughtful] Hmmm, I should put guns in the game.',
  ],
  hatred: [
    "[tired] Oh, now I'm pissed.",
    '[sad] You are one annoying bitch.',
    '[sighs] You evil mother fucker, you.',
    "[sorrowful] When I kill you, I'll make sure you don't respawn.",
  ],
  romantic: [
    '[warmly] Nice work bae. You can play secret characters like me by typing our first name into the password field.',
    '[quietly] Want your own overpowered character added as an NPC? Send me an email.',
    '[softly] Our kids are going places {target}.',
    '[sad] I should have added ramen to this game.',
  ],
};
})();
