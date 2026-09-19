// Cel-shaded combat animation. Visual state is scene-owned and never uses the combat RNG.
(function(){
'use strict';
const A=ADV,C=A.SkillArtCatalog,PI=Math.PI,TAU=PI*2,states=new Map();
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>1-Math.pow(1-clamp(t),3),point=(x,y)=>({x,y});
const reduced=()=>A.Prefs?.get().artMotion===false||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const color=p=>p.palette[2];
function poly(g,pts,c,a=1,edge){g.fillStyle(c,a);g.fillPoints(pts,true);if(edge){g.lineStyle(edge,0x101c30,a*.85);g.strokePoints(pts,true);}}
function line(g,pts,c,w=2,a=1,closed=false){g.lineStyle(w,c,a);g.strokePoints(pts,closed);}
function ray(g,x,y,a,r1,r2,c,w=2,alpha=1){line(g,[point(x+Math.cos(a)*r1,y+Math.sin(a)*r1),point(x+Math.cos(a)*r2,y+Math.sin(a)*r2)],c,w,alpha);}
function ellipse(g,x,y,rx,ry,c,w=2,a=1){g.lineStyle(w,c,a);g.strokeEllipse(x,y,rx*2,ry*2);}
function bezier(a,b,c,t){const u=1-t;return point(u*u*a.x+2*u*t*b.x+t*t*c.x,u*u*a.y+2*u*t*b.y+t*t*c.y);}
function path(a,b,bend=0,n=22){const mid=point((a.x+b.x)/2,(a.y+b.y)/2-bend);return Array.from({length:n+1},(_,i)=>bezier(a,mid,b,i/n));}
function ribbon(g,pts,w,p,alpha=1){
 const band=scale=>{const upper=[],lower=[];for(let i=0;i<pts.length;i++){const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)],angle=Math.atan2(next.y-prev.y,next.x-prev.x)+PI/2,thick=Math.sin(PI*i/(pts.length-1))*(w*scale)+.15;upper.push(point(pts[i].x+Math.cos(angle)*thick,pts[i].y+Math.sin(angle)*thick));lower.unshift(point(pts[i].x-Math.cos(angle)*thick,pts[i].y-Math.sin(angle)*thick));}return upper.concat(lower);};
 poly(g,band(1.22),p.palette[0],alpha*.8);poly(g,band(1),color(p),alpha);poly(g,band(.33),p.palette[3],alpha*.96);
}
function crescent(g,x,y,r,angle,span,w,p,alpha=1){
 const pts=Array.from({length:25},(_,i)=>point(x+Math.cos(angle+span*i/24)*r,y+Math.sin(angle+span*i/24)*r));ribbon(g,pts,w,p,alpha);
}
function shard(g,x,y,r,a,p,alpha=1){const u=point(Math.cos(a),Math.sin(a)),v=point(-u.y,u.x),pts=[point(x+u.x*r,y+u.y*r),point(x+v.x*r*.3,y+v.y*r*.3),point(x-u.x*r*.6,y-u.y*r*.6),point(x-v.x*r*.3,y-v.y*r*.3)];poly(g,pts,color(p),alpha,1);poly(g,[pts[0],pts[1],pts[2],point(x,y)],p.palette[3],alpha*.85);}
function leaf(g,x,y,r,a,p,alpha=1){const pts=path(point(x-Math.cos(a)*r,y-Math.sin(a)*r),point(x+Math.cos(a)*r,y+Math.sin(a)*r),r*.6,8);const back=path(pts.at(-1),pts[0],r*.45,8);poly(g,pts.concat(back),color(p),alpha,1);line(g,[pts[0],pts.at(-1)],p.palette[3],1,alpha*.65);}
function star(g,x,y,r,p,alpha=1,n=4){const pts=[];for(let i=0;i<n*2;i++){const a=i*PI/n-PI/2,rr=i%2?r*.25:r;pts.push(point(x+Math.cos(a)*rr,y+Math.sin(a)*rr));}poly(g,pts,p.palette[3],alpha,1);}
function halo(g,x,y,r,p,a=.18){for(let i=3;i>=0;i--){g.fillStyle(color(p),a/(5+i));g.fillEllipse(x,y,r*(2+i*.45),r*(1.4+i*.35));}}
function flame(g,x,y,r,angle,p,alpha=1,phase=0){
 halo(g,x,y,r,p,alpha*.18);
 const pt=(u,v)=>point(x+Math.cos(angle)*u-Math.sin(angle)*v,y+Math.sin(angle)*u+Math.cos(angle)*v);
 for(const side of [-1,1]){const end=pt(-r*(2.2+.35*Math.sin(phase*4+side)),side*r*(.3+.18*Math.sin(phase*3)));ribbon(g,path(pt(-r*.25,side*r*.2),end,side*r*.3,12),r*.13,p,alpha*.8);}
 const pts=[];for(let i=0;i<24;i++){const a=i*TAU/24,noise=1+Math.sin(a*5+phase*3)*.15,tail=Math.max(0,-Math.cos(a))*(1.3+.15*Math.sin(phase*7)),xx=Math.cos(a)*r*(noise+tail),yy=Math.sin(a)*r*(.64+Math.sin(a*3+phase)*.13);pts.push(point(x+xx*Math.cos(angle)-yy*Math.sin(angle),y+xx*Math.sin(angle)+yy*Math.cos(angle)));}
 poly(g,pts,p.palette[1],alpha,2);const inner=pts.map(q=>point(x+(q.x-x)*.72,y+(q.y-y)*.7));poly(g,inner,color(p),alpha);poly(g,inner.map(q=>point(x+(q.x-x)*.45,y+(q.y-y)*.44)),p.palette[3],alpha*.95);
}
function droplets(g,x,y,r,p,t,n=7){for(let i=0;i<n;i++){const a=i*2.399+p.seed%19,travel=(.2+ease(t))*r*(.4+(i%3)*.18),xx=x+Math.cos(a)*travel,yy=y+Math.sin(a)*travel+t*t*24;const rr=(3+i%3)*(1-t*.6);g.fillStyle(p.palette[0],.8);g.fillCircle(xx,yy,rr+1);g.fillStyle(color(p),.95);g.fillCircle(xx,yy,rr);g.fillStyle(p.palette[3],.7);g.fillCircle(xx-rr*.25,yy-rr*.3,rr*.3);}}
function sparks(g,x,y,p,t,n=9,r=60){for(let i=0;i<n;i++){const a=i*2.399+p.seed%37,d=(.12+ease(t))*r*(.45+(i%4)*.17),xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d+t*t*10;if(p.family==='nature')leaf(g,xx,yy,4+i%3,a+t,p,1-t*.65);else shard(g,xx,yy,(3+i%4)*(1-t*.5),a,p,1-t*.6);}}
function circle(g,x,y,r,p,t=0,rank=0){
 ellipse(g,x,y,r,r*.3,p.palette[0],5,.6);ellipse(g,x,y,r,r*.3,color(p),2,.9);ellipse(g,x,y,r*.78,r*.23,p.palette[3],1,.65);
 for(let i=0;i<6+rank*2;i++){const a=i*TAU/(6+rank*2)+t*.35;line(g,[point(x+Math.cos(a)*r*.82,y+Math.sin(a)*r*.25),point(x+Math.cos(a)*r*1.07,y+Math.sin(a)*r*.32)],color(p),2,.85);}
 if(rank>0)ellipse(g,x,y,r*1.18,r*.36,color(p),1,.4);
}
function shield(g,x,y,r,p,alpha=1){
 const pts=[[-.75,-.65],[0,-.95],[.75,-.65],[.65,.25],[.35,.75],[0,1],[-.35,.75],[-.65,.25]].map(([a,b])=>point(x+a*r,y+b*r));
 poly(g,pts,p.palette[0],alpha*.35);line(g,pts,color(p),3,alpha,true);line(g,pts.map(q=>point(x+(q.x-x)*.84,y+(q.y-y)*.84)),p.palette[3],1,alpha*.8,true);
 line(g,[point(x,y-r*.55),point(x,y+r*.57)],p.palette[3],2,alpha);line(g,[point(x-r*.35,y-r*.12),point(x+r*.35,y-r*.12)],p.palette[3],2,alpha);
}
function eye(g,x,y,r,p,alpha=1){const left=point(x-r,y),right=point(x+r,y),top=path(left,right,r*.75,12),bottom=path(right,left,r*.75,12);line(g,top.concat(bottom),color(p),2,alpha,true);g.fillStyle(p.palette[1],alpha*.65);g.fillCircle(x,y,r*.36);ellipse(g,x,y,r*.36,r*.36,p.palette[3],1.5,alpha);g.fillStyle(p.palette[3],alpha);g.fillCircle(x,y,r*.13);}
function cross(g,x,y,r,p,a=1){const pts=[[-.2,-1],[.2,-1],[.2,-.2],[1,-.2],[1,.2],[.2,.2],[.2,1],[-.2,1],[-.2,.2],[-1,.2],[-1,-.2],[-.2,-.2]].map(([a,b])=>point(x+a*r,y+b*r));poly(g,pts,color(p),a,1);line(g,[point(x,y-r*.6),point(x,y+r*.6)],p.palette[3],1,a);}
function skull(g,x,y,r,p,a=1){g.fillStyle(p.palette[0],a*.8);g.fillCircle(x,y,r+2);g.fillStyle(color(p),a);g.fillEllipse(x,y,r*1.8,r*1.7);poly(g,[point(x-r*.48,y+r*.4),point(x+r*.48,y+r*.4),point(x+r*.4,y+r),point(x-r*.4,y+r)],color(p),a);g.fillStyle(p.palette[0],a);g.fillEllipse(x-r*.34,y,r*.45,r*.54);g.fillEllipse(x+r*.34,y,r*.45,r*.54);for(let i=-1;i<=1;i++)line(g,[point(x+i*r*.23,y+r*.55),point(x+i*r*.23,y+r*.92)],p.palette[1],1.3,a);}
function paper(g,x,y,r,p,t){poly(g,[point(x-r*.5,y-r),point(x+r*.5,y-r*.9),point(x+r*.45,y+r),point(x-r*.45,y+r*.85)],0xf7e4bb,1,1.5);line(g,[point(x,y-r*.6),point(x,y+r*.5)],p.palette[1],2);for(let i=0;i<3;i++)line(g,[point(x-r*.25,y-r*.35+i*r*.25),point(x+r*.25,y-r*.48+i*r*.25)],p.palette[1],1.5);star(g,x,y+r*1.2,3+Math.sin(t*PI)*2,p,.8);}
function crown(g,x,y,r,p){poly(g,[[-1,-.4],[-.5,0],[0,-.85],[.5,0],[1,-.4],[.7,.55],[-.7,.55]].map(([a,b])=>point(x+a*r,y+b*r)),color(p),.9,1.5);line(g,[point(x-r*.6,y+r*.35),point(x+r*.6,y+r*.35)],p.palette[3],2);star(g,x,y+r*.15,r*.17,p);}
function blade(g,x,y,r,a,p,motion){
 const pt=(u,v)=>point(x+Math.cos(a)*u-Math.sin(a)*v,y+Math.sin(a)*u+Math.cos(a)*v);
 line(g,[pt(-r*.45,0),pt(-r*.07,0)],p.palette[0],7);line(g,[pt(-r*.45,0),pt(-r*.07,0)],p.palette[1],4);
 if(motion==='hammer'||motion==='boulder'){poly(g,[pt(r*.25,-r*.28),pt(r*.65,-r*.23),pt(r*.75,r*.21),pt(r*.23,r*.27)],p.palette[1],1,2);poly(g,[pt(r*.28,-r*.25),pt(r*.63,-r*.2),pt(r*.55,0),pt(r*.27,0)],p.palette[3],.9);return;}
 poly(g,[pt(-r*.08,-r*.065),pt(r*.75,-r*.065),pt(r,0),pt(r*.75,r*.065),pt(-r*.08,r*.065)],color(p),1,1.5);line(g,[pt(0,0),pt(r*.9,0)],p.palette[3],1.2);line(g,[pt(-r*.09,-r*.19),pt(-r*.09,r*.19)],p.palette[1],4);
}
function tree(g,x,y,r,p,t=0){
 const foot=point(x,y+r*.75),top=point(x,y-r*.85);
 ribbon(g,path(foot,top,-r*.14),r*.085,{...p,palette:[p.palette[0],0x4c6041,0x749660,p.palette[3]]},.85);
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const yy=y+r*.2-i*r*.28,xx=x+side*r*(.65-i*.13),sway=Math.sin(t+i)*r*.025;
  line(g,path(point(x,yy+r*.2),point(xx,yy-r*.15+sway),-r*.12),p.palette[1],3,.85);
  for(let j=0;j<3;j++)leaf(g,xx-side*j*r*.14,yy-r*.15-j*r*.035+sway,r*(.13-j*.014),side*(.5+j*.25),p,.85);
 }
 for(let i=0;i<4;i++)line(g,path(foot,point(x+(i-1.5)*r*.32,foot.y+7),-4),p.palette[1],2,.85);
}
function symbol(g,p,x,y,r,t=0){
 const m=p.motion;
 if(m==='flurry'){blade(g,x-r*.3,y,r,-PI/4,p,'cut');blade(g,x+r*.3,y,r,-PI*.75,p,'cut');}
 else if(m==='sweep'||m==='whirlwind'){crescent(g,x,y,r*.8,-2,PI*1.65,r*.14,p);if(m==='whirlwind')crescent(g,x,y,r*.5,.2,PI*1.65,r*.1,p);else blade(g,x,y,r,-PI/4,p,'cut');}
 else if(m==='heart'){const pts=[[-1,-.25],[-.9,-.65],[-.4,-.85],[0,-.48],[.4,-.85],[.9,-.65],[1,-.25],[.75,.25],[0,1],[-.75,.25]].map(([a,b])=>point(x+a*r,y+b*r));poly(g,pts,color(p),1,1.5);line(g,[point(x-r*.55,y-r*.4),point(x-r*.4,y-r*.6)],p.palette[3],2);}
 else if(m==='speech'){g.fillStyle(p.palette[1]);g.fillRoundedRect(x-r,y-r*.75,r*2,r*1.3,4);poly(g,[point(x-r*.5,y+r*.3),point(x-r*.65,y+r*.9),point(x+r*.1,y+r*.3)],p.palette[1]);for(let i=-1;i<=1;i++){g.fillStyle(p.palette[3]);g.fillCircle(x+i*r*.5,y-r*.12,2);}}
 else if(m==='rootField'){tree(g,x,y,r,p);}
 else if(m==='trap'||m==='web'||m==='iceTomb'){for(let i=0;i<6;i++)ray(g,x,y,i*PI/3,0,r,color(p),2);ellipse(g,x,y,r*.6,r*.6,p.palette[3],1);}
 else if(/guard|counter|lastStand|bond/.test(m))shield(g,x,y,r,p);
 else if(/heal|Heal|stitch|bloom|ration/.test(m))cross(g,x,y,r*.7,p);
 else if(/raise|summon|drain|curse/.test(m))skull(g,x,y,r*.6,p);
 else if(/eye|mark|gaze/.test(m))eye(g,x,y,r,p);
 else if(m==='paper')paper(g,x,y,r,p,t);
 else if(/crown|command|conscript/.test(m))crown(g,x,y,r,p);
 else if(m==='coin'){g.fillStyle(p.palette[1]);g.fillCircle(x,y,r);ellipse(g,x,y,r*.8,r*.8,p.palette[3],1.5);line(g,[point(x,y-r*.55),point(x,y+r*.55)],p.palette[3],3);}
 else if(/transform|grove|tree|thorn|lash/.test(m)){leaf(g,x,y,r,-PI/4,p);}
 else if(/bite|claw|gore|pincer|sting|fists/.test(m)){for(let i=-1;i<=1;i++)ribbon(g,path(point(x-r*.7+i*r*.3,y-r*.8),point(x+r*.25+i*r*.3,y+r*.8),r*.25,10),r*.07,p);}
 else if(m==='smoke'){for(let i=0;i<3;i++){g.fillStyle(p.palette[1],.8);g.fillCircle(x+(i-1)*r*.4,y+(i%2)*r*.25,r*.6);}star(g,x,y-r*.3,r*.32,p);}
 else if(m==='arrow'||m==='volley'){crescent(g,x-r*.4,y,r*.85,-1.3,2.6,r*.09,p);line(g,[point(x-r*.17,y-r*.82),point(x-r*.17,y+r*.82)],p.palette[3],1.4);for(let i=0;i<(m==='volley'?3:1);i++){const yy=y+(i-(m==='volley'?1:0))*r*.43;line(g,[point(x-r*.55,yy),point(x+r*.75,yy)],color(p),2);shard(g,x+r*.75,yy,r*.28,0,p);}}
 else if(m==='stars'){const pts=[];for(let i=0;i<8;i++){const a=i*PI/4,rr=i%2?r*.3:r;pts.push(point(x+Math.cos(a)*rr,y+Math.sin(a)*rr));}poly(g,pts,color(p),1,1.5);g.fillStyle(p.palette[0]);g.fillCircle(x,y,r*.16);}
 else if(/bullet|scatter|cannon|chainshot/.test(m)){for(let i=0;i<(m==='scatter'?3:1);i++){const xx=x+(i-1)*(m==='scatter'?r*.6:0),rr=m==='scatter'?r*.32:r*.65;g.fillStyle(p.palette[1]);g.fillCircle(xx,y,rr);ellipse(g,xx,y,rr,rr,color(p),2);star(g,xx-rr*.25,y-rr*.3,rr*.2,p);}ray(g,x,y,PI,2,r,p.palette[3],2);}
 else if(/cut|sweep|draw|rise|flurry|thrust|hammer|ambush/.test(m))blade(g,x,y,r*1.25,-PI/4,p,m);
 else if(p.family==='fire'||p.family==='powder')flame(g,x,y,r*.65,-PI/2,p,1,t);
 else if(p.family==='ice')shard(g,x,y,r,-PI/2,p);
 else if(p.family==='lightning')poly(g,[[-.1,-1],[-.65,.15],[-.05,.1],[-.35,1],[.7,-.25],[.12,-.2]].map(([a,b])=>point(x+a*r,y+b*r)),color(p),1,1);
 else{star(g,x,y,r,p,1,6);ellipse(g,x,y,r*.63,r*.63,color(p),1,.8);}
}
function manager(scene){
 if(states.has(scene))return states.get(scene);
 const s={jobs:[],status:new Map(),elapsed:0,stopped:false};states.set(scene,s);
 const mask=scene.make.graphics({add:false});mask.fillStyle(0xffffff);mask.fillRect(18,103,1244,530);s.mask=mask;s.geometry=mask.createGeometryMask();
 s.tick=(time,delta)=>{
  if(s.stopped)return;const dt=Math.max(0,Math.min(delta||16,80))*(scene.time?.timeScale??1);s.elapsed+=dt;
  const small=reduced();
  for(const j of [...s.jobs]){j.elapsed+=dt;const t=clamp(j.elapsed/j.duration);j.g.clear();j.g.setAlpha(Math.min(1,(1-t)*5));j.draw(j.g,t,small);if(t>=1)finish(s,j,false);}
  for(const [view,mark]of s.status){if(!view.img?.active||view.u?.downed||view.u?.fled){mark.g.destroy();s.status.delete(view);continue;}mark.g.clear();paintStatus(mark.g,view,mark.kinds,small?0:s.elapsed/1000);}
 };
 s.close=()=>{if(s.stopped)return;s.stopped=true;for(const j of [...s.jobs])finish(s,j,true);for(const m of s.status.values())m.g.destroy();s.status.clear();s.geometry.destroy();mask.destroy();scene.events.off('update',s.tick);scene.events.off('shutdown',s.close);states.delete(scene);};
 scene.events.on('update',s.tick);scene.events.once('shutdown',s.close);return s;
}
function finish(s,j,cancel){if(!s.jobs.includes(j))return;s.jobs.splice(s.jobs.indexOf(j),1);j.g.destroy();if(j.done)j.done(cancel);}
function animate(scene,duration,draw,opts={}){
 const s=manager(scene);while(s.jobs.length>=18)finish(s,s.jobs[0],true);
 const g=scene.add.graphics().setDepth(opts.depth||534);g.setMask(s.geometry);
 const j={g,elapsed:0,duration,draw,done:opts.done,kind:opts.kind||'effect'};s.jobs.push(j);draw(g,0,reduced());return j;
}
function origin(v,dir){return point(v?.x??(dir===-1?900:380),v?.y??330);}
function melee(m){return /^(cut|sweep|whirlwind|draw|rise|flurry|thrust|hammer|ambush|claw|bite|gore|sting|fists|pincer)$/.test(m);}
function attackMotion(g,p,a,b,t,small){
 const dir=b.x>=a.x?1:-1,m=p.motion,rank=p.rank,progress=ease(t),start=point(a.x+dir*42,a.y),reach=Math.min(Math.abs(b.x-a.x)*.4,125),cx=start.x+dir*reach*progress,cy=start.y;
 const n=m==='flurry'?2+rank:m==='claw'?3:m==='bite'&&p.id==='tri_bite'?3:1;
 if(m==='whirlwind'){
  for(let i=0;i<3;i++){const rr=66+i*13,ang=(small?.3:t)*TAU*1.3+i*2;
   crescent(g,cx,cy+(i-1)*18,rr,ang,PI*1.2,5-i*.8,p,1-i*.16);
   for(let k=0;k<3;k++)ray(g,cx,cy+(i-1)*18,ang+k*.6,rr+6,rr+14,color(p),1.2,.6);
  }
  sparks(g,cx,cy,p,t,8,65);return;
 }
 for(let i=0;i<n;i++){
  const u=clamp(t*(1+n*.2)-i*.15);if(u<=0)continue;const alpha=1-clamp((u-.7)/.3),angle=(dir===1?0:PI)+(m==='rise'?-1:1)*lerp(-1.2,1,ease(u));
  if(m==='thrust'||m==='sting'){const end=point(cx+dir*(45+rank*15),cy-i*6);ribbon(g,path(point(start.x-dir*25,cy+12),end,-8,14),5*p.scale,p,alpha);blade(g,end.x-dir*30,end.y,46,dir===1?0:PI,p,'thrust');}
  else if(m==='bite'){const x=cx+i*8,opening=(1-ease(u))*28+6;for(const sign of [-1,1]){const teeth=[];for(let k=0;k<4;k++)teeth.push(point(x-24+k*16,cy+sign*(opening+(k%2?10:0))),point(x-18+k*16,cy+sign*(opening-11)));line(g,teeth,p.palette[0],7,alpha);line(g,teeth,color(p),4,alpha);}}
  else if(m==='pincer'){for(const sign of [-1,1])crescent(g,cx,cy,28+12*(1-u),sign*PI*.5+PI*.25,PI*.75,7,p,alpha);}
  else if(m==='fists'){for(const side of [-1,1]){const x=cx+dir*side*12,y=cy+side*12;poly(g,[[-12,-10],[5,-15],[17,-5],[13,12],[-10,13]].map(([xx,yy])=>point(x+xx,y+yy)),p.palette[1],alpha,2);for(let k=0;k<3;k++)line(g,[point(x-7+k*6,y-8),point(x-6+k*6,y)],p.palette[3],1,alpha);}}
  else if(m==='gore'){for(const side of [-1,1])ribbon(g,path(point(start.x,cy+side*22),point(cx+dir*48,cy+side*10),-side*16),7,p,alpha);}
  else if(m==='hammer'){blade(g,cx,cy,68,angle,p,m);for(let k=0;k<3;k++)crescent(g,cx-dir*25,cy-22,50+k*7,angle-1.8,.7,1.6,p,alpha*.5);}
  else{
   const rr=(m==='sweep'?79:m==='draw'?64:49)*p.scale,span=m==='draw'?.55:m==='claw'?1.5:2.15;
   crescent(g,cx,cy+(i-(n-1)/2)*17,rr,angle+(i%2?PI:0)-1.2,span,m==='claw'?4:7,p,alpha);
   if(m!=='claw')blade(g,start.x-dir*7,cy,46,angle,p,m);
  }
 }
 if(rank&&t>.2)sparks(g,cx-dir*12,cy,p,t,4+rank*2,32);
 if(m==='ambush'){for(let i=0;i<5;i++){const x=start.x+dir*(i*20+progress*40),y=cy+Math.sin(i*4)*18;g.fillStyle(p.palette[1],.16*(1-t));g.fillEllipse(x,y,30,66);}crescent(g,cx,cy,58,lerp(-2,1,t),1.6,8,p);}
}
function lightning(g,p,a,b,t,width=1){
 const pts=[];for(let i=0;i<=16;i++){const u=i/16,jitter=i===0||i===16?0:Math.sin(i*17+p.seed%73+Math.floor(t*8))*(10+p.rank*5);pts.push(point(lerp(a.x,b.x,u),lerp(a.y,b.y,u)+jitter));}
 line(g,pts,color(p),17*width,.07);line(g,pts,p.palette[0],10*width,.6);line(g,pts,color(p),5*width,.9);line(g,pts,p.palette[3],1.6*width,1);
 if(p.rank>0)for(let i=4;i<15;i+=5)line(g,[pts[i],point(pts[i].x+12,pts[i].y-19),point(pts[i].x+28,pts[i].y-24)],color(p),1.5,.7);
}
function projectile(g,p,a,b,t,small){
 const m=p.motion,rank=p.rank,dir=b.x>=a.x?1:-1,start=point(a.x+dir*36,a.y),end=point(b.x-dir*22,b.y);
 const flight=clamp((t-.15)/.78),u=small?.6:ease(flight),arc=/volley|rain|boulder|keg|spit/.test(m)?60:15;
 const q=bezier(start,point((start.x+end.x)/2,Math.min(start.y,end.y)-arc),end,u),a0=Math.atan2(end.y-start.y,end.x-start.x),trail=path(point(lerp(start.x,q.x,.55),lerp(start.y,q.y,.55)),q,arc*.22,18);
 if(t<.3)circle(g,a.x,a.y+52,20*(.4+t*3)*p.scale,p,t,rank);
 if(t<.13)return;
 if(m==='flare'){
  const q=point(a.x,a.y-30-flight*95);ribbon(g,path(point(a.x,a.y+10),q,-8),3,p,.8);flame(g,q.x,q.y,12*p.scale,-PI/2,p,1,small?0:t);
  if(t>.5)for(let i=0;i<8;i++)ray(g,q.x,q.y,i*TAU/8,16,28+flight*22,p.palette[3],2,.8);return;
 }
 if(m==='field'){
  circle(g,b.x,b.y+50,50*p.scale,p,t,rank);
  for(const side of [-1,1]){const x=b.x+side*48*p.scale;line(g,[point(x,b.y+47),point(x,b.y-38)],color(p),2,.8);shard(g,x,b.y-43,13,-PI/2,p);}
  for(let i=0;i<4;i++){const yy=b.y+30-i*20;ellipse(g,b.x,yy,46*p.scale,9,color(p),1,.35);}return;
 }
 if(m==='shell'){
  for(let i=0;i<7+rank*2;i++){const aa=i*TAU/(7+rank*2),rr=20+flight*65,xx=a.x+Math.cos(aa)*rr,yy=a.y+Math.sin(aa)*rr*.65;shard(g,xx,yy,18*(1-flight*.45),aa,p);}
  ellipse(g,a.x,a.y,25+flight*45,30+flight*30,color(p),3,1-flight*.6);return;
 }
 if(m==='spiral'){
  for(let i=0;i<3+rank;i++){const ang=t*TAU*2+i*TAU/(3+rank),rr=15*p.scale,xx=q.x+Math.cos(ang)*rr,yy=q.y+Math.sin(ang)*rr;
   ribbon(g,path(point(lerp(start.x,q.x,.6),lerp(start.y,q.y,.6)),point(xx,yy),Math.sin(ang)*30),3,p,.8);shard(g,xx,yy,13,ang,p);}
  star(g,q.x,q.y,8*p.scale,p);return;
 }
 if(p.family==='lightning'&&/bolt|chain|descent/.test(m)){
  const from=m==='descent'?point(end.x-20,118):start;lightning(g,p,from,point(lerp(from.x,end.x,clamp(flight*2.3)),lerp(from.y,end.y,clamp(flight*2.3))),small?0:t,p.scale*.8);return;
 }
 if(m==='chain'||m==='tongue'||m==='coil'||m==='lash'){
  const pts=path(start,q,Math.sin(t*PI)*55,25);line(g,pts,p.palette[0],m==='tongue'?11:5);line(g,pts,color(p),m==='tongue'?7:2.5);
  for(let i=1;i<pts.length;i+=3){const pt=pts[i];if(p.family==='nature')leaf(g,pt.x,pt.y,7,i,p);else if(m==='tongue')g.fillCircle(pt.x,pt.y,3);else ellipse(g,pt.x,pt.y,4.5,2.6,p.palette[3],1,.8);}
  if(p.id==='boarding_hook')crescent(g,q.x,q.y,12,-PI*.7,PI*1.5,3,p);else if(m==='chain')shard(g,q.x,q.y,13,a0,p);return;
 }
 if(m==='roar'||m==='breath'||m==='wave'||m==='spray'){
  for(let i=0;i<5+rank;i++){const k=clamp(flight*1.5-i*.12),xx=lerp(start.x,end.x,k),yy=lerp(start.y,end.y,k),r=12+k*(40+rank*13);if(m==='roar')crescent(g,xx,yy,r,dir===1?-1.1:PI-1.1,2.2,2.4,p,1-k*.6);else if(p.family==='fire')flame(g,xx,yy,r*.52,a0,p,.68,small?0:t+i);else if(p.family==='ice')shard(g,xx,yy+(i%2?1:-1)*r*.35,r*.5,a0,p,.8);else droplets(g,xx,yy,r,p,k,4);}
  return;
 }
 if(/arrow|volley|stars|bullet|scatter|cannon|chainshot/.test(m)){
  const n=/volley|scatter|stars/.test(m)?3+rank*2:m==='chainshot'?2:1;
  for(let i=0;i<n;i++){const offset=(i-(n-1)/2)*10,yy=q.y+offset,tip=point(q.x,yy);
   ribbon(g,path(point(lerp(start.x,q.x,.5),start.y+offset),tip,arc*.1,12),m==='cannon'?8:2,p,.6);
   if(m==='stars'){const pts=[];for(let k=0;k<8;k++){const aa=k*PI/4+(small?0:t*10),rr=k%2?3:14;pts.push(point(q.x+Math.cos(aa)*rr,yy+Math.sin(aa)*rr));}poly(g,pts,color(p),1,1.5);g.fillStyle(p.palette[0]);g.fillCircle(q.x,yy,2);}
   else if(/bullet|scatter|cannon|chainshot/.test(m)){const r=m==='cannon'?11:m==='chainshot'?7:4;g.fillStyle(p.palette[0]);g.fillCircle(q.x,yy,r+1);g.fillStyle(p.palette[1]);g.fillCircle(q.x,yy,r);g.fillStyle(p.palette[3]);g.fillCircle(q.x-r*.3,yy-r*.35,r*.23);}
   else{line(g,[point(q.x-dir*28,yy+5),tip],p.palette[0],4);line(g,[point(q.x-dir*28,yy+5),tip],color(p),2);shard(g,q.x,yy,9,a0,p);for(let k=0;k<3;k++)line(g,[point(q.x-dir*(22+k*3),yy+5),point(q.x-dir*(27+k*3),yy+1)],p.palette[3],2);}
  }
  if(/bullet|scatter|cannon/.test(m)&&t<.43){flame(g,start.x,start.y,16*p.scale,a0,p,1-t,0);sparks(g,start.x,start.y,p,t,6,33);}
  if(m==='chainshot')line(g,[point(q.x,q.y-6),point(q.x,q.y+6)],p.palette[3],2);
  return;
 }
 if(m==='boulder'||m==='tree'){
  ribbon(g,trail,7,p,.3);
  if(m==='tree'){line(g,[point(q.x-30,q.y-38),point(q.x+28,q.y+28)],p.palette[0],22);line(g,[point(q.x-30,q.y-38),point(q.x+28,q.y+28)],p.palette[1],17);for(let i=0;i<5;i++)leaf(g,q.x-20+i*10,q.y-30+i*7,18,i,p);}
  else{const pts=Array.from({length:7},(_,i)=>{const aa=i*TAU/7+(small?0:t*3),r=(i%2?21:29)*p.scale;return point(q.x+Math.cos(aa)*r,q.y+Math.sin(aa)*r);});poly(g,pts,p.palette[1],1,2);poly(g,[pts[0],pts[1],pts[2],point(q.x,q.y)],color(p),1);}
  return;
 }
 if(m==='keg'){
  const r=15*p.scale;poly(g,[[-.7,-1],[.7,-1],[.9,.7],[.55,1],[-.55,1],[-.9,.7]].map(([x,y])=>point(q.x+x*r,q.y+y*r)),0x795132,1,2);for(const side of [-1,1])line(g,[point(q.x-r*.72,q.y+side*r*.6),point(q.x+r*.72,q.y+side*r*.6)],p.palette[3],3);line(g,[point(q.x,q.y-r),point(q.x+5,q.y-r-10)],0xdab985,2);star(g,q.x+5,q.y-r-11,4,p);return;
 }
 if(m==='gaze'){eye(g,start.x,start.y,18,p);ribbon(g,path(start,q,0,16),6,p,.75);return;}
 if(m==='web'||m==='grasp'||m==='trap'||m==='fault'||m==='rootField'||m==='iceTomb'){
  const x=lerp(start.x,end.x,u),y=lerp(start.y+45,end.y+48,u);ribbon(g,path(start,point(x,y),-25),3,p,.5);
  if(m==='web'){for(let i=0;i<7;i++)ray(g,x,y-25,i*TAU/7,3,28*p.scale,color(p),1.5);for(let j=1;j<=3;j++)line(g,Array.from({length:7},(_,i)=>point(x+Math.cos(i*TAU/7)*j*9*p.scale,y-25+Math.sin(i*TAU/7)*j*9*p.scale)),color(p),1,.65,true);}
  else if(m==='rootField'){for(let i=-1;i<=1;i++)tree(g,x+i*26,y-16,30,p,t);}
  else if(m==='iceTomb'){for(let i=-2;i<=2;i++)shard(g,x+i*16,y-23,48-Math.abs(i)*8,-PI/2,p,.7);}
  else if(m==='trap'){for(const side of [-1,1])crescent(g,x+side*12,y,23,-PI*.9+(side>0?PI:0),PI*.85,3,p);}
  else for(let i=0;i<4+rank;i++)shard(g,x+(i-2)*13,y-12,12+(i%2)*8,-PI/2,p);
  return;
 }
 ribbon(g,trail,(p.family==='shadow'?8:5)*p.scale,p,.8);
 if(p.family==='fire'||p.family==='powder')flame(g,q.x,q.y,(m==='siege'?23:13)*p.scale,a0,p,1,small?0:t*4);
 else if(p.family==='ice')shard(g,q.x,q.y,(m==='lance'?32:20)*p.scale,a0,p);
 else if(p.family==='poison'){droplets(g,q.x,q.y,18*p.scale,p,flight,5);g.fillStyle(p.palette[1]);g.fillCircle(q.x,q.y,10*p.scale);g.fillStyle(p.palette[3],.8);g.fillCircle(q.x-2,q.y-3,3);}
 else if(p.family==='shadow')shard(g,q.x,q.y,30*p.scale,a0,p);
 else{
  for(let i=0;i<3;i++){const pp=p.family==='prism'?{...p,palette:C.PALETTES[['ice','fire','arcane'][i]]}:p;const angle=(small?0:t*5)+i*TAU/3;shard(g,q.x+Math.cos(angle)*12,q.y+Math.sin(angle)*12,13,angle,pp);}
  star(g,q.x,q.y,14*p.scale,p);
 }
 if(rank>0)for(let i=0;i<rank*2;i++)star(g,lerp(start.x,q.x,.5+i*.1),lerp(start.y,q.y,.5+i*.1)+Math.sin(i*3+t*4)*10,3,p,.7);
}
const SUPPORT=new Set(['guard','counter','thornGuard','heal','stitch','groupHeal','bloom','raise','grove','crown','command','eye','mark','bond','paper','ration','lastStand','transform','summon','conscript','smoke','dispel','curse']);
function support(g,p,a,b,t,small){
 const m=p.motion,x=b.x,y=b.y,scale=p.scale,phase=small?.45:t,r=(22+ease(phase)*23)*scale;
 if(m==='smoke'){
  for(let i=0;i<8+p.rank*2;i++){const aa=i*2.399,rr=(15+ease(phase)*44),xx=a.x+Math.cos(aa)*rr,yy=a.y+Math.sin(aa)*rr*.7-phase*16;g.fillStyle(p.palette[0],.3);g.fillCircle(xx,yy,(18+i%4*3)*(1-phase*.2));g.fillStyle(p.palette[1],.4);g.fillCircle(xx-3,yy-5,13+i%3*3);}for(let i=0;i<4;i++)crescent(g,a.x,a.y,40+i*9,phase+i,1.1,2,p,.6);return;
 }
 if(m==='dispel'){for(let i=0;i<6;i++){const aa=i*TAU/6;shard(g,x+Math.cos(aa)*r,y+Math.sin(aa)*r,12*(1-phase*.5),aa,p);}ellipse(g,x,y,r,r,color(p),2,1-phase);return;}
 circle(g,x,y+53,r,p,phase,p.rank);
 if(m==='guard'||m==='counter'||m==='lastStand'||m==='thornGuard'){
  if(p.family==='fire')for(let i=0;i<5;i++)flame(g,x-36+i*18,y+28,11*scale,-PI/2,p,.6,small?0:t+i);
  if(p.id==='iron_fan_guard'){
   const fan=[];for(let i=0;i<=10;i++)fan.push(point(x+Math.cos(PI+i*PI/10)*r,y+25+Math.sin(PI+i*PI/10)*r));fan.push(point(x,y+25));poly(g,fan,p.palette[1],.8,2);
   for(let i=0;i<=10;i++)line(g,[point(x,y+25),fan[i]],i%2?color(p):p.palette[3],1.5,.9);return;
  }
  if(p.id==='crossing_guard'||m==='counter'){blade(g,x,y,r*1.1,-PI/4,p,'cut');blade(g,x,y,r*1.1,-PI*.75,p,'cut');star(g,x,y,7,p);return;}
  if(m==='thornGuard'){for(let i=0;i<8;i++){const aa=i*TAU/8+phase;leaf(g,x+Math.cos(aa)*r,y+Math.sin(aa)*r,10,aa,p);line(g,[point(x+Math.cos(aa)*r,y+Math.sin(aa)*r),point(x+Math.cos(aa)*(r-9),y+Math.sin(aa)*(r-9))],p.palette[1],3);}}
  else shield(g,x,y,r*.93,p,.88);
  if(p.rank>0)for(const side of [-1,1]){shield(g,x+side*r*.78,y+9,r*.44,p,.5);}
  return;
 }
 if(m==='heal'||m==='stitch'||m==='groupHeal'||m==='bloom'||m==='grove'||m==='raise'){
  for(let i=0;i<6+p.rank*3;i++){const u=(phase+i*.13)%1,xx=x+Math.sin(i*4+p.seed)*31*scale,yy=y+48-u*105;
   if(m==='grove'||m==='bloom'||p.family==='nature')leaf(g,xx,yy,5+i%3,phase+i,p,.9);
   else if(m==='stitch'){line(g,[point(xx-6,yy-5),point(xx+6,yy+5)],p.palette[3],1.5);line(g,[point(xx-6,yy+5),point(xx+6,yy-5)],color(p),2);}
   else cross(g,xx,yy,4+i%3,p,.9);
  }
  if(m==='raise'){for(const side of [-1,1])for(let i=0;i<5;i++){const angle=-PI/2+side*(.6+i*.13);shard(g,x+side*(15+i*7),y-10-i*5,28-i*3,angle,p,.7);}star(g,x,y-48,10*scale,p);}
  else if(m==='grove'){tree(g,x+38,y+20,43,p,phase);}
  if(m==='bloom')for(let i=0;i<5;i++){const aa=i*TAU/5;leaf(g,x+Math.cos(aa)*18,y+Math.sin(aa)*18,13,aa,p,.8);}
  return;
 }
 if(m==='summon'||m==='curse'){
  for(let i=0;i<3+p.rank;i++){const aa=i*TAU/(3+p.rank)+phase,xx=x+Math.cos(aa)*r,yy=y+Math.sin(aa)*r*.45;skull(g,xx,yy-phase*24,7+i%2*2,p,.75);ribbon(g,path(point(xx,yy),point(x,y+48),20),2,p,.5);}
  return;
 }
 if(m==='conscript'){
  crown(g,x,y-30,20*scale,p);
  for(const side of [-1,1]){const pts=path(point(x+side*55,y+28),point(x-side*38,y-10),side*30,20);for(let i=0;i<pts.length;i+=2)ellipse(g,pts[i].x,pts[i].y,7,4,color(p),2,.9);}
  return;
 }
 if(m==='mark'||m==='eye'){eye(g,x,y-25,18*scale,p);for(let i=0;i<4;i++)ray(g,x,y,i*PI/2+(small?0:phase*.5),r*.66,r,color(p),2,.9);return;}
 if(m==='transform'){
  for(let i=0;i<8;i++){const aa=i*TAU/8+phase*2,xx=x+Math.cos(aa)*r,yy=y+Math.sin(aa)*r*.7;shard(g,xx,yy,10,aa,p,.8);}crescent(g,x,y,r,-PI/2+phase*2,PI*1.2,6,p,.8);
  symbol(g,{...p,motion:/marine|sea_dog/.test(p.id)?'command':p.id==='spellblade_form'?'cut':'claw'},x,y,16,phase);
  if(p.id==='fox_form')for(let i=0;i<1+p.rank*4;i++){const aa=-PI*.9+i*PI*.8/Math.max(1,p.rank*4);ribbon(g,path(point(x,y+32),point(x+Math.cos(aa)*56,y+Math.sin(aa)*65),25),5,p,.6);}
  return;
 }
 if(m==='paper'){paper(g,x,y-13,22*scale,p,phase);return;}
 if(m==='bond'){ribbon(g,path(a,b,35),3,p,.8);for(let i=0;i<4;i++)star(g,lerp(a.x,b.x,i/3),lerp(a.y,b.y,i/3)-Math.sin(i/3*PI)*35,5,p);shield(g,x,y,25,p);return;}
 if(m==='ration'){poly(g,[[-12,-15],[12,-15],[10,14],[-10,14]].map(([a,b])=>point(x+a,y+b)),p.palette[1],1,2);ellipse(g,x,y-15,12,4,p.palette[3],2);cross(g,x+22,y-10,8,p);return;}
 if(m==='command'){const xx=x+20;line(g,[point(xx,y+45),point(xx,y-50)],p.palette[1],3);poly(g,[point(xx,y-49),point(xx+48,y-45),point(xx+37,y-29),point(xx+49,y-14),point(xx,y-18)],color(p),.9,1.5);symbol(g,{...p,motion:'crown'},xx+19,y-34,8);return;}
 crown(g,x,y-25,r*.55,p);for(let i=0;i<8;i++)ray(g,x,y-25,i*TAU/8,30*scale,45*scale,p.palette[3],1,.55);
}
function impactPaint(g,p,v,t,phase){
 const x=v.x,y=v.y,scale=p.scale*(phase==='tick'?.65:1),r=(18+ease(t)*40)*scale;
 if(phase==='miss'){for(let i=0;i<3;i++)ribbon(g,path(point(x-36,y-17+i*16),point(x+33,y-30+i*16),-6),1,p,.3);return;}
 if(phase==='block'){shield(g,x,y,34+ease(t)*12,{...p,palette:C.PALETTES.gold},1-t*.7);sparks(g,x,y,p,t,6,42);return;}
 if(p.motion==='heal'||p.motion==='groupHeal'||p.motion==='stitch'||p.motion==='bloom'){support(g,p,v,v,t,reduced());return;}
 if(p.family==='fire'||p.family==='powder'){
  for(let i=0;i<5+p.rank*2;i++){const aa=i*2.399;flame(g,x+Math.cos(aa)*r*.35,y+Math.sin(aa)*r*.3,Math.max(3,(20+p.rank*7)*(1-t*.75)),aa,p,.95,t+i);}ellipse(g,x,y+32,r,r*.25,color(p),2,1-t);
 }else if(p.family==='ice'){
  halo(g,x,y,r*.7,p,.23*(1-t));
  for(let i=0;i<6+p.rank*2;i++){const aa=i*TAU/(6+p.rank*2)+Math.sin(i*19+p.seed)*.12,rr=r*(.4+.27*((i*7%5)/4));shard(g,x+Math.cos(aa)*rr,y+Math.sin(aa)*rr,(14+i%3*5)*(1-t*.6)*scale,aa,p);ray(g,x,y,aa,r*.1,rr*.8,p.palette[3],1.1,1-t);}
  for(let i=0;i<5;i++)star(g,x+Math.cos(i*2.4)*r*.9,y+Math.sin(i*2.4)*r*.9,3,p,1-t,4);star(g,x,y,18*(1-t),p,1,6);
 }else if(p.family==='lightning'){
  for(let i=0;i<4+p.rank;i++){const aa=i*TAU/(4+p.rank);lightning(g,p,point(x,y),point(x+Math.cos(aa)*r,y+Math.sin(aa)*r),t,.55);}star(g,x,y,12*(1-t),p);
 }else if(p.family==='poison'||p.family==='blood'){
  droplets(g,x,y,r,p,t,8+p.rank*2);if(melee(p.motion))crescent(g,x,y,31*scale,-1+t*2,1.8,4,p,1-t*.5);
 }else if(p.family==='nature'||p.motion==='fault'||p.motion==='boulder'||p.motion==='tree'){
  for(let i=0;i<6;i++){const aa=i*TAU/6;line(g,[point(x,y+28),point(x+Math.cos(aa)*r*.6,y+28+Math.sin(aa)*r*.28),point(x+Math.cos(aa+.2)*r,y+28+Math.sin(aa+.2)*r*.3)],p.palette[0],4,1-t);}
  sparks(g,x,y,p,t,8,r);
 }else if(p.motion==='drain'||p.family==='necromancy'){skull(g,x,y-8,14*(1-t*.4),p,.75);sparks(g,x,y,p,t,7,r);}
 else if(p.motion==='judgment'){for(let i=-2;i<=2;i++)ribbon(g,path(point(x+i*12,112),point(x+i*8,y+25),0),i===0?8:2,p,(1-t)*.85);star(g,x,y,r*.6,p,1-t,8);}
 else if(p.family==='arcane'||p.family==='prism'){
  for(let i=0;i<6+p.rank*2;i++){const aa=i*TAU/(6+p.rank*2)+t,pp=p.family==='prism'?{...p,palette:C.PALETTES[['ice','fire','arcane'][i%3]]}:p;shard(g,x+Math.cos(aa)*r*.65,y+Math.sin(aa)*r*.65,13*scale,aa,pp);}
  star(g,x,y,20*scale*(1-t*.5),p,.9,6);ellipse(g,x,y,r*.85,r*.85,color(p),1,1-t);
 }else{
  star(g,x,y,(18+ease(t)*16)*scale,p,1-t*.65,p.motion==='hammer'?8:4);
  const n=p.motion==='claw'?3:p.motion==='flurry'?2:1;for(let i=0;i<n;i++)crescent(g,x,y+(i-(n-1)/2)*13,34*scale,-2.1+i*.8+t*.45,1.8,4,p,1-t*.7);
  sparks(g,x,y,p,t,7+p.rank*2,r);
 }
}
function recipients(scene,ctx,p){
 const src=ctx.src,tgt=ctx.tgt,s=p.definition,all=[...(scene.unitViews?.values()||[])],side=src?.u?.side;
 if(p.offensive)return tgt?[tgt]:[];
 const ally=s.target==='party'||s.target==='allyLane',self=s.target==='self'||['smoke','transform','lastStand'].includes(p.motion);
 if(self)return src?[src]:[];
 if(ally){const out=all.filter(v=>v.u&&v.u.side===side&&!v.u.fled&&(!v.u.downed||p.motion==='raise')&&(s.target!=='allyLane'||v.u.lane===(tgt?.u?.lane??src?.u?.lane)));return out.length?out:[tgt||src].filter(Boolean);}
 return[tgt||src].filter(Boolean);
}
function play(scene,ctx){
 const p=C.describe(ctx.skillId,ctx.tier,ctx);if(!p||p.passive||!ctx.src)return 200;
 const a=origin(ctx.src,ctx.dir),b=origin(ctx.tgt||ctx.src,-(ctx.dir||1));
 const duration=p.id==='basic_attack'?250:330+p.rank*85,wait=reduced()?Math.min(duration,290):duration;
 const group=recipients(scene,ctx,p),motion=p.motion;scene.__fxBusy=true;
 const src=ctx.src.img,baseX=src?.x,baseY=src?.y,dir=ctx.dir||(b.x>=a.x?1:-1);
 animate(scene,wait,(g,t,small)=>{
  if(src?.active&&melee(motion)&&!small){const push=Math.sin(t*PI)*18;src.x=baseX+dir*push;src.y=baseY-(motion==='rise'?Math.sin(t*PI)*5:0);}
  if(SUPPORT.has(motion))for(const v of group)support(g,p,a,origin(v),t,small);
  else if(melee(motion))attackMotion(g,p,a,b,t,small);
  else if(motion==='drain'){
   const to=p.offensive||p.id==='blood_pact'?a:b,from=p.offensive||p.id==='blood_pact'?b:a;
   ribbon(g,path(from,to,28),4*p.scale,p,.75);for(let i=0;i<5;i++){const u=(t+i*.16)%1,q=bezier(from,point((a.x+b.x)/2,Math.min(a.y,b.y)-35),to,u);shard(g,q.x,q.y,7,0,p);}
  }else if(motion==='judgment'){symbol(g,p,b.x,b.y-50,22*p.scale,t);circle(g,b.x,b.y+48,35*p.scale,p,t,p.rank);}
  else if(motion==='rain'||motion==='storm'){
   for(let i=0;i<5+p.rank*3;i++){const offset=(i-(4+p.rank*3)/2)*15,from=point(b.x+offset-25,115),to=point(b.x+offset,b.y);projectile(g,p,from,to,clamp(t*1.3-(i%3)*.08),small);}
  }else if(motion==='descent'&&p.definition.target==='allEnemies'){
   for(const v of scene.unitViews?.values()||[])if(v.u.side!==ctx.src.u.side&&!v.u.fled&&!v.u.downed)projectile(g,p,a,origin(v),t,small);
  }else projectile(g,p,a,b,t,small);
 },{kind:'cast',done:()=>{if(src?.active&&melee(motion)){src.x=baseX;src.y=baseY;}scene.__fxBusy=!!states.get(scene)?.jobs.some(j=>j.kind==='cast');}});
 return wait;
}
function outcome(scene,view,id,tier,phase='hit',ctx){
 const p=C.describe(id,tier,ctx);if(!view||!p)return;
 animate(scene,reduced()?220:phase==='hit'?340+p.rank*45:240,(g,t)=>{
  if(phase==='hit'&&ctx?.previous&&p.family==='lightning'&&(p.motion==='chain'||p.definition.chainDecay))lightning(g,p,origin(ctx.previous),origin(view),reduced()?0:t,.65);
  impactPaint(g,p,view,t,phase);
 },{kind:phase});
}
function transform(scene,view,key,opts={}){
 if(!view?.img?.active)return 0;
 const img=view.img,w=img.displayWidth,h=img.displayHeight,x=img.x,y=img.y,startAlpha=img.alpha;
 const form=opts.form||view.u?.form||key;
 const family=/storm/.test(form)?'lightning':/fox|spellblade/.test(form)?'arcane':/serpent/.test(form)?'poison':/marine|sea_dog|unbroken/.test(form)?'gold':'nature';
 const p={...C.describe('beast_shape',opts.tier||'advanced'),family,palette:C.PALETTES[family]},ms=reduced()?240:opts.revert?360:520;let swapped=false;
 const swap=()=>{if(!swapped&&img.active){swapped=true;img.setTexture(key);img.setDisplaySize(w,h);}};
 animate(scene,ms,(g,t,small)=>{
  if(!img.active)return;if(t>=.48)swap();
  if(!small){img.alpha=startAlpha*(.38+Math.abs(t-.5)*1.24);img.setDisplaySize(w*(1-Math.sin(t*PI)*.06),h*(1+Math.sin(t*PI)*.035));}
  circle(g,x,y+h*.48,42*p.scale,p,t,p.rank);
  for(const side of [-1,1])crescent(g,x,y,45+Math.sin(t*PI)*24,-PI/2+side*t*TAU,PI*1.25,5,p,.8);
  sparks(g,x,y,p,t,12,75);if(t>.35&&t<.7)symbol(g,{...p,motion:/marine|sea_dog|unbroken/.test(form)?'command':/spellblade/.test(form)?'cut':'claw'},x,y,20,p.rank);
 },{kind:'transform',done:()=>{swap();if(img.active){img.setDisplaySize(w,h);img.setAlpha(startAlpha);}}});
 return ms;
}
const statusFamily={burn:'fire',poison:'poison',bleed:'blood',frozen:'ice',shocked:'lightning',rooted:'nature',ward:'holy',guard:'gold',taunted:'gold',conscript:'necromancy',hot:'holy',thornShield:'nature',grove:'nature',wings:'holy'};
function paintStatus(g,v,kinds,time){
 const x=v.img?.x??v.x,y=v.img?.y??v.y,h=v.img?.displayHeight||116;
 for(let n=0;n<kinds.length;n++){
  const k=kinds[n],p={palette:C.PALETTES[statusFamily[k]],family:statusFamily[k],rank:0,seed:n*27};
  if(k==='burn'){for(let i=0;i<3;i++)flame(g,x-22+i*22,y+h*.35,7+Math.sin(time*3+i)*2,-PI/2,p,.85,time+i);}
  else if(k==='frozen'){for(let i=0;i<5;i++)shard(g,x-30+i*15,y+h*.37,16+i%2*6,-PI/2,p,.75);line(g,[point(x-40,y+24),point(x-36,y-32),point(x-25,y-42)],color(p),2,.55);}
  else if(k==='guard'||k==='ward'){shield(g,x+(v.u.side==='a'?1:-1)*38,y+15,19,p,.65+.12*Math.sin(time*1.5));}
  else if(k==='thornShield'||k==='grove'){tree(g,x+(v.u.side==='a'?40:-40),y+22,34,p,time);if(k==='grove')for(let i=0;i<3;i++)leaf(g,x-22+i*20,y+37+(time*.3+i/3)%1*18,5,i+time,p,.6);}
  else if(k==='rooted'){for(const side of [-1,1]){const pts=path(point(x+side*35,y+h*.44),point(x+side*30,y+20),side*12);line(g,pts,color(p),2.4,.75);leaf(g,x+side*33,y+30,7,-side,p,.8);}}
  else if(k==='shocked'){const a=point(x-35,y+15),b=point(x+30,y+30);lightning(g,p,a,b,time*.05,.28);}
  else if(k==='hot'||k==='wings'){for(let i=0;i<3;i++){const t=(time*.24+i/3)%1;cross(g,x-20+i*20,y+h*.4-t*50,3.5,p,.8);}if(k==='wings')for(const side of [-1,1])for(let i=0;i<3;i++)shard(g,x+side*(30+i*7),y+20-i*5,12-i*2,-PI/2+side*.7,p,.6);}
  else if(k==='poison'||k==='bleed'){for(let i=0;i<3;i++){const t=(time*.27+i/3)%1;const yy=y+25+(k==='bleed'?1:-1)*t*22;droplets(g,x+(i-1)*14,yy,3,p,t,1);}}
  else if(k==='taunted')crown(g,x,y-h*.44,7,p);
  else if(k==='conscript')skull(g,x+35,y+38,6,p,.9);
 }
}
function clearStatus(v){for(const s of states.values()){const m=s.status.get(v);if(m){m.g.destroy();s.status.delete(v);}}}
function syncStatus(scene,v){
 if(!v?.u||!v.img?.active)return;
 const kinds=[...new Set((v.u.statuses||[]).map(s=>s.kind).filter(k=>statusFamily[k]))];if(v.u.ch?.isConscript)kinds.push('conscript');
 const keep=kinds.slice(0,4),s=manager(scene);let mark=s.status.get(v);
 if(!keep.length||v.u.downed||v.u.fled){clearStatus(v);return;}
 if(!mark){const g=scene.add.graphics().setDepth(526).setMask(s.geometry);mark={g,kinds:keep};s.status.set(v,mark);}else mark.kinds=keep;
 mark.g.clear();paintStatus(mark.g,v,keep,reduced()?0:s.elapsed/1000);
}
function tick(scene,v,e){
 const visual=e?.visual||{},kind=visual.dotKind||(v?.u?.statuses||[]).find(s=>['burn','poison','bleed'].includes(s.kind))?.kind;
 const family=statusFamily[kind]||({fire:'fire',ward:'arcane',poison:'poison'}[visual.hazard])||'arcane';
 const p=C.describe(visual.skillId,visual.tier)||{palette:C.PALETTES[family],family,rank:0,scale:.8,seed:19,motion:'tick'};
 if(v)animate(scene,visual.hazard?360:230,(g,t)=>impactPaint(g,p,v,t,visual.hazard?'hit':'tick'),{kind:'tick'});return 140;
}
function icon(scene,id,tier='basic',opts={}){
 const p=C.describe(id,tier,opts);if(!p)return null;
 const key='skill_art_v1_'+id+'_'+tier+'_'+p.family+'_'+p.motion+(opts.offensive?'_off':'');if(scene.textures.exists(key))return key;
 const g=scene.make.graphics({add:false});const hex=Array.from({length:6},(_,i)=>point(32+Math.cos(i*TAU/6-PI/6)*30,32+Math.sin(i*TAU/6-PI/6)*30));
 poly(g,hex,p.palette[0],1);line(g,hex,color(p),1.8,.9,true);ellipse(g,32,32,23,23,p.palette[1],1,.6);symbol(g,p,32,30,20,0);
 if(p.passive){star(g,51,13,3.5,p);star(g,13,13,3.5,p);}
 for(let i=0;i<=p.rank;i++)shard(g,32+(i-p.rank/2)*7,55,2.5,-PI/2,p);
 g.generateTexture(key,64,64);g.destroy();return key;
}
function perk(scene,v,id){const p=C.describe(id,'basic');if(!p||!v)return;animate(scene,340,(g,t)=>{circle(g,v.x,v.y+48,25+ease(t)*20,p,t);symbol(g,p,v.x,v.y-43,12,t);sparks(g,v.x,v.y+20,p,t,4,35);},{kind:'perk'});}
function ritual(scene,id,actor,target,depth=426){
 const p=C.describe(id,'advanced');if(!p)return{destroy(){}};
 const job=animate(scene,reduced()?500:1050,(g,t,small)=>{support(g,p,actor,target,t,small);ribbon(g,path(point(actor.x+40,actor.y),point(target.x-40,target.y),35),3,p,.65);if(id==='necromancy')for(let i=0;i<3;i++){const u=(t+i/3)%1;skull(g,target.x-28+i*28,target.y+30-u*100,7,p,.65);}}, {kind:'ritual',depth});
 return{destroy:()=>{const s=states.get(scene);if(s)finish(s,job,true);}};
}
A.SkillArt={version:1,play,outcome,transform,icon,perk,ritual,syncStatus,clearStatus,tick,describe:C.describe,has:id=>!!C.describe(id),clear:scene=>states.get(scene)?.close(),inspect:scene=>({jobs:states.get(scene)?.jobs.length||0,statuses:states.get(scene)?.status.size||0}),
 // Used by the art contact sheet to compare the same animation phase on both renderers.
 sample:(scene,ms)=>states.get(scene)?.tick(0,ms),paintSymbol:symbol};
})();
