/* Standalone scene study. Original pixels stay fixed outside environment masks.
   24-second periodic shader: integer cycle counts make every effect loop.
   No new image, character rig, camera motion, audio or game integration. */
'use strict';
const canvas=document.querySelector('#view'),gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 uv;uniform sampler2D image;uniform float time;uniform float motion;
const float PI=3.14159265359;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 a=floor(p),b=fract(p);b=b*b*(3.-2.*b);return mix(mix(hash(a),hash(a+vec2(1,0)),b.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),b.x),b.y);}
float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03)+.15*noise(p*4.07);}
float oval(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.35,1.,length((p-c)/r));}
float box(vec2 p,vec4 b,float feather){return smoothstep(b.x,b.x+feather,p.x)*(1.-smoothstep(b.z-feather,b.z,p.x))*smoothstep(b.y,b.y+feather,p.y)*(1.-smoothstep(b.w-feather,b.w,p.y));}
float glow(vec2 p,vec2 center,float radius){float d=length(p-center)/radius;return exp(-d*d)*(1.-smoothstep(.65,1.,d));}
void main(){
 vec2 p=uv*vec2(1536.,1024.);float a=time*2.*PI/24.;vec2 q=p;
 // Pool begins BELOW Hiro's legs. Reflections ripple, characters never warp.
 float pool=smoothstep(892.,934.,p.y);
 q.x+=pool*(1.8*sin(p.y*.10+a*12.)+.6*sin(p.x*.023-p.y*.054-a*8.))*motion;
 q.y+=pool*.5*sin(p.x*.033+a*8.)*motion;
 // Narrow foliage masks avoid lattice, towels, hair and faces.
 float leaf=max(box(p,vec4(1395.,340.,1535.,544.),22.),box(p,vec4(1380.,68.,1455.,161.),14.));
 leaf=max(leaf,box(p,vec4(1468.,44.,1534.,167.),12.));
 q.x+=leaf*1.8*sin(a*3.+p.y*.019)*motion;
 q.y+=leaf*.8*sin(a*2.+p.x*.037)*motion;
 // Fountain: tightly isolated falling ribbons, no movement of stone lip.
 float fall=box(p,vec4(1394.,714.,1500.,907.),15.);
 q.y+=fall*1.25*sin(p.y*.12-a*32.)*motion;
 q.x+=fall*.55*sin(p.y*.095-a*24.)*motion;
 vec3 base=texture2D(image,q/vec2(1536.,1024.)).rgb,col=base;
 float luminance=dot(base,vec3(.21,.72,.07));
 float waterLight=pool*pow(max(luminance-.42,0.),1.25)*(.065*sin(p.y*.14+a*12.)+.035*sin(p.x*.08-a*8.));
 col+=vec3(1.,.85,.59)*waterLight*motion;
 float stream=fall*max(0.,luminance-.38)*(.14*sin(p.y*.23-a*44.)+.07*sin(p.y*.41-a*32.));
 col+=vec3(.80,.89,1.)*stream*motion;
 // Moon halo and local lantern shimmer, deliberately outside the figures.
 float lunar=glow(p,vec2(1466.,32.),62.)*(.025+.015*sin(a));
 col+=vec3(.59,.73,1.)*lunar*motion;
 float lamps=glow(p,vec2(980.,187.),53.)+glow(p,vec2(324.,200.),27.)+glow(p,vec2(71.,598.),49.)+glow(p,vec2(1482.,556.),31.)+glow(p,vec2(1459.,267.),18.);
 float flicker=.022*sin(a*17.)+.013*sin(a*29.+.8)+.009*sin(a*43.+1.7);
 col+=vec3(1.,.57,.19)*lamps*flicker*motion;
 // Steam stays low over the pool and around the stone steps. Cyclic noise
 // offsets avoid any jump at the loop boundary; no fixed rectangular sprites.
 float fog=oval(p,vec2(260.,828.),vec2(350.,118.))+oval(p,vec2(1100.,850.),vec2(315.,110.));
 vec2 drift=vec2(sin(a)*.85,cos(a)*.8);
 float n=fbm(p*vec2(.006,.014)+drift);
 float wisps=smoothstep(.43,.82,n)*fog*.095;
 col=mix(col,vec3(.81,.84,.84),clamp(wisps*motion,0.,.16));
 // Water from bowl: small moving highlights on the existing stream only.
 float pour=box(p,vec4(529.,293.,574.,378.),8.);
 col+=vec3(.75,.84,.91)*pour*max(0.,luminance-.48)*.13*sin(p.y*.40-a*36.)*motion;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
let ready=false,paused=false,compare=false,elapsed=0,last=0,frames=0;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
if(gl){
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const clock=gl.getUniformLocation(program,'time'),amount=gl.getUniformLocation(program,'motion');
 function draw(t=elapsed){gl.uniform1f(clock,t%24);gl.uniform1f(amount,compare?0:1);gl.drawArrays(gl.TRIANGLES,0,6);frames++;}
 const plate=new Image();plate.onload=()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,plate);ready=true;draw();};plate.src='bathhouse.png';
 function tick(now){if(last&&!paused&&!document.hidden)elapsed+=Math.min((now-last)/1000,.1);last=now;if(ready&&!document.hidden)draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
 window.bathhouse={get ready(){return ready;},get frames(){return frames;},get paused(){return paused;},get time(){return elapsed;},seek(t){elapsed=t;draw();},pause(value){paused=value;document.querySelector('#pause').textContent=value?'Play':'Pause';},compare(value){compare=value;draw();}};
}else{canvas.hidden=true;document.querySelector('nav span').textContent='Your browser cannot animate this preview; showing the original painting.';}
document.querySelector('#pause').onclick=()=>window.bathhouse?.pause(!paused);
document.querySelector('#still').onclick=e=>{compare=!compare;window.bathhouse?.compare(compare);e.target.textContent=compare?'Return to animation':'Compare still';};
document.querySelector('#full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.querySelector('#scene').requestFullscreen?.();};
document.addEventListener('visibilitychange',()=>{last=0;});
if(matchMedia('(prefers-reduced-motion: reduce)').matches)window.bathhouse?.pause(true);
if(new URLSearchParams(location.search).has('clean')||new URLSearchParams(location.search).has('embed'))document.body.classList.add('clean');
window.addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='bathhouse-pause')window.bathhouse?.pause(!!e.data.paused);});
