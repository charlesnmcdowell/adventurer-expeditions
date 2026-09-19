// Keep orientation independent of WKWebView's sometimes stale visual viewport.
(function (root) {
'use strict';
function install(win, doc, game) {
  const media = win.matchMedia('(orientation: landscape)');
  const phone = /Android|iPhone|iPod|Mobile/i.test(win.navigator.userAgent) && !/iPad/i.test(win.navigator.userAgent);
  const box = doc.getElementById('rotate');
  let timer, dismissed = false;
  try { dismissed = win.sessionStorage.getItem('adv:rotate-dismissed') === '1'; } catch (_) {}
  function refit() {
    const landscape = media.matches || win.innerWidth > win.innerHeight;
    const vv = win.visualViewport;
    // A keyboard may shorten the visual viewport. Only use it for fitting if
    // its width still agrees with the layout; never use it to decide rotation.
    const fresh = vv && Math.abs(vv.width - win.innerWidth) < 8;
    const w = fresh ? vv.width : win.innerWidth;
    const h = fresh ? vv.height : win.innerHeight;
    doc.documentElement.style.setProperty('--adv-view-width', Math.round(w) + 'px');
    doc.documentElement.style.setProperty('--adv-view-height', Math.round(h) + 'px');
    const show = phone && !landscape && !dismissed && !doc.body.classList.contains('mobile-launch') && !doc.body.classList.contains('mobile-loading');
    doc.body.classList.toggle('rotate-required', show);
    if (box) { box.setAttribute('aria-hidden', String(!show)); box.inert = !show; }
    const el = doc.getElementById('game');
    if (el && game?.canvas && game.scale) {
      const rect = el.getBoundingClientRect();
      game.scale.setParentSize(rect.width, rect.height);
      game.scale.refresh();
    }
    root.ADV?.UI?.repositionFields?.();
  }
  function schedule() { win.clearTimeout(timer); timer = win.setTimeout(refit, 150); }
  function dismiss() {
    dismissed = true;
    try { win.sessionStorage.setItem('adv:rotate-dismissed', '1'); } catch (_) {}
    refit();
  }
  if (media.addEventListener) media.addEventListener('change', schedule);
  else media.addListener(schedule);
  win.addEventListener('resize', schedule);
  win.visualViewport?.addEventListener('resize', schedule);
  win.addEventListener('pageshow', schedule);
  doc.addEventListener('visibilitychange', schedule);
  doc.addEventListener('fullscreenchange', schedule);
  doc.addEventListener('webkitfullscreenchange', schedule);
  doc.getElementById('rotate-dismiss')?.addEventListener('click', dismiss);
  doc.addEventListener('keydown', event => { if (event.key === 'Escape' && doc.body.classList.contains('rotate-required')) dismiss(); });
  game?.events?.once('ready', schedule);
  refit();
  return { refit, schedule, dismiss };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { install };
else { root.ADV = root.ADV || {}; root.ADV.MobileViewport = { install }; }
})(globalThis);
