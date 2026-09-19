// Build-time policy. The future CrazyGames release profile must emit
// target: 'crazygames' here. Never derive this policy from a URL or saved game.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
Object.defineProperty(ADV, 'Release', {
  value: Object.freeze({ target: 'website' }), enumerable: true,
});
})();
