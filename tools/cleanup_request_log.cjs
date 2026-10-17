// Read-only instrumentation for the existing browser gates. No URL queries,
// storage, dialogue, credentials or response bodies are recorded.
const fs=require('node:fs'),path=require('node:path');
const out=process.env.CLEANUP_REQUEST_LOG;
if(out){
 const seen=new Set(),pw=require('playwright');
 const note=(url,status)=>{try{const u=new URL(url);if(!['127.0.0.1','localhost'].includes(u.hostname))return;
  const p=decodeURIComponent(u.pathname).replace(/^\/+/,''),k=p+'|'+status;if(seen.has(k))return;seen.add(k);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.appendFileSync(out,JSON.stringify({test:path.basename(process.argv[1]||''),path:p,status})+'\n');
 }catch{}};
 const attach=p=>{p.on('request',r=>note(r.url(),'requested'));p.on('response',r=>note(r.url(),r.status()));};
 const launch=pw.chromium.launch.bind(pw.chromium);
 pw.chromium.launch=async(...args)=>{const b=await launch(...args),nc=b.newContext.bind(b),np=b.newPage.bind(b);
  b.newContext=async(...a)=>{const c=await nc(...a);c.on('page',attach);return c;};
  b.newPage=async(...a)=>{const p=await np(...a);attach(p);return p;};return b;};
}
