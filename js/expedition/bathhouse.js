// Lazy, standalone environmental scene. No character movement or game rules.
(function(){
'use strict';const X=ADV.Expedition;
let active=null;
X.Bathhouse={open({onClose=()=>{}}={}){
  if(active)return active;
  const previous=document.activeElement,dialog=document.createElement('dialog');
  dialog.className='bathhouse-dialog';dialog.setAttribute('aria-label','Rest at the bathhouse');
  dialog.style.cssText='position:fixed;inset:0;margin:0;width:100vw;height:100dvh;max-width:none;max-height:none;padding:0;border:0;background:#080c12;color:#f3e0bd;overflow:hidden';
  const frame=document.createElement('iframe');frame.title='Moonlit bathhouse';
  frame.src='assets/expedition/bathhouse/index.html?embed=1';
  frame.style.cssText='position:absolute;inset:0;width:100%;height:calc(100% - 76px);border:0';
  const controls=document.createElement('div');controls.style.cssText='position:absolute;bottom:max(12px,env(safe-area-inset-bottom));left:0;right:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;padding:0 12px;font:16px system-ui';
  const label=document.createElement('span');label.textContent='Health restored';
  const pause=document.createElement('button'),back=document.createElement('button');
  let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  pause.textContent=paused?'Play atmosphere':'Pause atmosphere';back.textContent='Return to inn';
  for(const b of [pause,back])b.style.cssText='min-height:44px;padding:10px 18px;border:1px solid #a28859;border-radius:6px;background:#172033;color:#f3e0bd;font:inherit;cursor:pointer';
  pause.onclick=()=>{paused=!paused;frame.contentWindow?.postMessage({type:'bathhouse-pause',paused},location.origin);pause.textContent=paused?'Play atmosphere':'Pause atmosphere';};
  function close(){if(!active)return;active=null;dialog.close();dialog.remove();onClose();if(previous?.isConnected)previous.focus();}
  back.onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  controls.append(label,pause,back);dialog.append(frame,controls);document.body.append(dialog);dialog.showModal();back.focus();
  active={close,dialog};return active;
}};
})();
