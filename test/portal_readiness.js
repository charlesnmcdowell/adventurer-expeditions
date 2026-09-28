'use strict';
// SDK hook timing is based on presented gameplay, not Phaser RUNNING alone.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
(async () => {
  const calls = [];
  const SDK = { init: async () => {}, game: Object.fromEntries(['loadingStart', 'loadingStop', 'gameplayStart', 'gameplayStop'].map(name => [name, () => calls.push(name)])) };
  const context = vm.createContext({
    ADV: { Release: { target: 'crazygames' }, Expedition: { portalSceneKeys: ['Expedition', 'Travel', 'Inn'] } },
    Phaser: { Scenes: { RUNNING: 5 } }, window: { CrazyGames: { SDK } },
    document: { createElement: () => ({}), head: { append: script => script.onload() } },
    setTimeout, clearTimeout, console,
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/portal.js'), 'utf8'), context);
  const portal = context.ADV.Portal;
  await portal.prepare(); assert.deepEqual(calls, ['loadingStart']);
  let presented = false;
  const scene = { sys: { settings: { key: 'Expedition', status: 5 } }, isPortalReady: () => presented };
  portal.sync([scene]); portal.sync([scene]);
  assert.deepEqual(calls, ['loadingStart'], 'RUNNING with scenery pending must not stop loading or start play');
  presented = true; portal.sync([scene]); portal.sync([scene]);
  assert.deepEqual(calls, ['loadingStart', 'loadingStop', 'gameplayStart'], 'ready presentation starts once');
  scene.paused = true; portal.sync([scene]); assert.equal(calls.at(-1), 'gameplayStop');
  scene.paused = false; portal.sync([scene]); assert.equal(calls.at(-1), 'gameplayStart');
  presented = false; portal.sync([scene]); assert.equal(calls.at(-1), 'gameplayStop');
  const n = calls.length;
  portal.sync([{ sys: { settings: { key: 'End', status: 5 } }, isPortalReady: () => false }]);
  assert.equal(calls.length, n, 'redirect/loading scenes cannot announce play');
  console.log('portal_readiness: 6 checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
