// CrazyGames Basic Launch adapter. Website builds never request the SDK.
// No advertisements are requested here: Basic Launch has ads disabled.
(function () {
'use strict';
const A = globalThis.ADV;
const P = A.Portal = { active: A.Release?.target === 'crazygames', ready: false, error: null };
let sdk, loading = false, playing = false;
function call(name) {
  try { sdk.game[name](); } catch (error) { P.error = error.message; console.warn('CrazyGames ' + name + ':', error); }
}
P.prepare = async function () {
  if (!P.active) return;
  try {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => reject(new Error('SDK loading timed out')), 8000);
      script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('SDK unavailable')); };
      document.head.append(script);
    });
    sdk = window.CrazyGames.SDK;
    let timer;
    try { await Promise.race([sdk.init(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('SDK initialization timed out')), 8000); })]); }
    finally { clearTimeout(timer); }
    P.ready = true; call('loadingStart'); loading = true;
  } catch (error) {
    P.error = error.message;
    console.warn('CrazyGames initialization:', error);
    // SDK trouble must not trap the player at a loading screen.
  }
};
P.sync = function (scenes) {
  if (!P.ready) return;
  const opened = scenes.filter(scene => scene.sys?.settings?.status === Phaser.Scenes.RUNNING);
  // A RUNNING Phaser scene can still be fetching its scenery outside the
  // loader. Its explicit presentation gate must clear before SDK readiness.
  const presented = opened.filter(scene => typeof scene.isPortalReady !== 'function' || scene.isPortalReady());
  if (loading && presented.length) { call('loadingStop'); loading = false; }
  const next = presented.some(scene => {
    const key = scene.sys.settings.key;
    if (key === 'Town') return !scene._arrivalPending && !['settings', 'difficulty', 'codex'].includes(scene.currentPanel);
    return key === 'Quest' || key === 'Combat' || !!(A.Expedition && A.Expedition.portalSceneKeys && A.Expedition.portalSceneKeys.includes(key) && !scene.paused);
  });
  if (next !== playing) { playing = next; call(playing ? 'gameplayStart' : 'gameplayStop'); }
};
P.attach = function (game) {
  if (!P.active) return;
  const sync = () => P.sync(game.scene.getScenes(true));
  game.events.on('poststep', sync);
  game.events.once('destroy', () => { game.events.off('poststep', sync); if (playing) { playing = false; call('gameplayStop'); } });
};
})();
