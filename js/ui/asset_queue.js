// Shared bounded image decoding. Callers own references and eviction policy.
(function(){
'use strict';
const pending=new Map(),queue=[],failed=new Map();let active=0,banner=null;
function retry(){const jobs=[...failed.values()];failed.clear();banner?.remove();banner=null;for(const run of jobs)run();}
window.addEventListener('online',retry);
function pump(){
 while(active<4 && queue.length){
  const job=queue.shift();active++;
  const img=new Image();img.decoding='async';let done=false;
  const timer=setTimeout(()=>finish(new Error('Artwork request timed out: '+job.url)),15000);
  const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;active--;
   if(error&&job.attempt<2){job.attempt++;setTimeout(()=>{queue.push(job);pump();},job.attempt*300);pump();return;}
   pending.delete(job.url);if(error)job.reject(error);else job.resolve(img);pump();};
  img.onload=()=>finish();img.onerror=()=>finish(new Error('Could not load '+job.url));img.src=job.url;
 }
}
ADV.ArtAssets={
  load(url){if(pending.has(url))return pending.get(url);const p=new Promise((resolve,reject)=>queue.push({url,resolve,reject,attempt:0}));pending.set(url,p);pump();return p;},
  readPixels(ctx,x,y,w,h){try{return ctx.getImageData(x,y,w,h);}catch(e){return null;}},
 failed(id,run){
  failed.set(id,run);if(banner)return;
  banner=document.createElement('aside');banner.className='art-warning';banner.setAttribute('role','alert');
  banner.textContent='Some artwork could not load. ';
  const b=document.createElement('button');b.type='button';b.textContent='Retry artwork';b.onclick=retry;banner.append(b);document.body.append(banner);
 },
 recovered(id){failed.delete(id);if(!failed.size){banner?.remove();banner=null;}},
 retry,
 stats(){return {active,queued:queue.length,pending:pending.size,failed:failed.size};}
};
})();
