// Public game version and patch notes. Bump `id` for each live patch so
// returning players see the notes once and receive the thank-you gold.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.PATCHES = [
  {
    id: '1.2.0',
    label: '1.2.0',
    date: '14 Sep 2026',
    gold: 5000,
    notes: [
      'Gate named foes bring fuller kits, and a lone ward meets a fairer first fight.',
      'Every living spouse shares one vault — a later marriage no longer hides the gold.',
      'The ordinary town has grown to eighty people, and Lookism no longer reserves every stranger.',
      'The Bandit Camp has its own battle hymn, and the quest score returns after a reload.',
    ],
  },
  {
    id: '1.2.1',
    label: '1.2.1',
    date: '15 Sep 2026',
    gold: 10000,
    notes: [
      'Continue is back for a life already in progress. On the phone, Keep my current game resumes it.',
      'Easy is the old Normal. Normal and Hard ask more of you.',
      'The Gate ends in Morrak\'s realm — restore Hiwot, or claim the throne.',
      'Inn courtship is optional conversation, and Gate voices recover if playback was blocked.',
    ],
  },
  {
    id: '1.2.2',
    label: '1.2.2',
    date: '15 Sep 2026',
    gold: 10000,
    notes: [
      'The story hall is now Varenholm’s Iron War.',
      'Tesfaye reads the ending aloud. You can stop or play it, and the writing stays on the page.',
      'Bahadır travels with a tiger named Fındık.',
      'The temple ending shows Hiwot as she is when you restore her — or when you do not.',
    ],
  },
];

ADV.DATA.VERSION = ADV.DATA.PATCHES[ADV.DATA.PATCHES.length - 1];
})();
