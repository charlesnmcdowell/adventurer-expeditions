// Motion authored against the shipped paintings, in normalized source coordinates.
// Battle images, journey bands and story illustrations have different compositions.
(function(){
'use strict';
const A=ADV,W=1280,H=760;
// Fires: [center x, base y, width, height]. Water/cloth/falls: [x,y,w,h].
const E={
 morrak_realm:{fires:[[.176,.199,.025,.047],[.326,.331,.018,.036],[.481,.323,.018,.036],[.512,.313,.019,.04],[.82,.23,.027,.05]],fireColor:0x97cbff,glow:[[.511,.244,0xf9d8a1,.08],[.267,.59,0x99cfff,.015],[.711,.51,0x99cfff,.018]],mist:.7,dust:true,sky:[[.22,0,.59,.14]]},
 lanternhold:{fires:[[.534,.50,.028,.055],[.943,.543,.026,.055],[.674,.59,.01,.024]],lights:[[.211,.044],[.211,.22],[.35,.286]],water:[[.76,.43,.14,.16]],windows:[[[.548,.1],[.578,0],[.924,0],[.943,.14],[.943,.475],[.81,.475],[.81,.37],[.548,.37]]]},
 griffon:{fires:[.437,.452,.467,.484,.505,.522,.538].map(x=>[x,.544,.004,.022]),mist:.57,sky:[[.46,.01,.23,.25]]},
 shore:{water:[[.2,.25,.31,.16],[.51,.33,.19,.11]],cloth:[[.095,.11,.055,.20]],sky:[[.22,.005,.43,.15]],birds:true},
 open_hand:{lights:[[.515,.345],[.712,.202],[.773,.323],[.128,.551],[.222,.558]],cloth:[[.824,.10,.052,.23]],sky:[[.17,.01,.19,.09]]},
 thornbury:{fires:[[.124,.587,.024,.074]],smoke:[[.125,.505,.13]],lights:[[.07,.337],[.226,.407]],cloth:[[.454,.12,.033,.18]],sky:[[.47,.002,.29,.07]]},
 ford:{water:[[.32,.66,.50,.095],[.43,.755,.31,.10]],falls:[[.351,.315,.019,.04],[.311,.268,.015,.09]],cloth:[[.936,.285,.025,.19]],sky:[[.25,.003,.25,.08]],birds:true},
 dunmere:{smoke:[[.313,.36,.19]],lights:[[.535,.33],[.61,.34]],cloth:[[.518,.173,.02,.102],[.615,.166,.02,.102]],sky:[[.23,0,.47,.062]]},
 dunmere_mine:{fires:[[.624,.568,.016,.045],[.587,.767,.009,.034]],lights:[[.092,.26],[.192,.251],[.316,.341],[.912,.619]],water:[[.701,.837,.119,.094]],falls:[[.807,.695,.013,.128]],mist:.86},
 holloway:{fires:[[.337,.598,.026,.05],[.565,.628,.026,.05],[.891,.575,.022,.043],[.448,.457,.018,.034]],cloth:[[.117,.193,.053,.29],[.216,.197,.025,.188]],falls:[[.502,.324,.018,.082]],sky:[[.40,.007,.25,.068]],birds:true},
 bandit_camp:{fires:[[.086,.504,.026,.095],[.337,.295,.014,.036],[.375,.302,.01,.026]],lights:[[.38,.447],[.566,.405],[.945,.343]],cloth:[[.613,.17,.021,.18]],mist:.52},
 mirkhollow:{falls:[[.627,.49,.021,.124],[.664,.538,.015,.068]],leaves:true,mist:.66},
 iron_mine:{fires:[[.44,.531,.028,.078],[.645,.493,.034,.098]],lights:[[.158,.44],[.708,.615],[.797,.621]],falls:[[.213,.454,.02,.282]],mist:.76},
 span:{water:[[.115,.79,.765,.19]],cloth:[[.118,.08,.021,.281],[.741,.07,.021,.223]],sky:[[.24,.008,.15,.15]],birds:true},
 sewers:{water:[[.5,.76,.495,.225],[.333,.59,.16,.13]],falls:[[.822,.485,.06,.091]],lights:[[.066,.102],[.143,.166],[.894,.358],[.967,.368]],fires:[[.154,.587,.012,.038]],mist:.68},
 nine_lanterns:{lights:[.207,.276,.34,.398,.454,.512,.563,.615,.66,.711].map((x,i)=>[x,.349+i*.008]),cloth:[[.838,.235,.035,.233]],water:[[.895,.77,.095,.053]],sky:[[.795,.005,.115,.14]]},
 palace:{fires:[[.359,.561,.033,.052],[.642,.561,.033,.052],[.128,.58,.019,.045],[.886,.586,.022,.045]],cloth:[[.327,.1,.062,.245],[.614,.09,.07,.32]],dust:true},
 tower:{lights:[[.40,.075],[.735,.146],[.978,.544],[.635,.43]],fires:[[.253,.553,.008,.024],[.46,.592,.008,.024],[.728,.609,.009,.023]],dust:true},
 catacombs:{fires:[[.493,.315,.018,.071],[.777,.184,.018,.068]],lights:[[.627,.401],[.778,.427]],water:[[.674,.785,.066,.179]],mist:.86},
 hunted_city:{water:[[.205,.525,.127,.068]],lights:[[.471,.485],[.632,.505],[.791,.255],[.688,.048]],cloth:[[.493,.286,.125,.07]],sky:[[.11,.013,.09,.235]]},
 undercity:{falls:[[.573,.54,.022,.098],[.59,.55,.012,.05]],water:[[.315,.727,.36,.045]],mist:.68,dust:true},
 temple:{fires:[[.269,.179,.029,.035],[.727,.18,.029,.035],[.233,.644,.024,.04],[.272,.63,.025,.035],[.741,.623,.032,.039],[.333,.416,.025,.035],[.655,.415,.025,.035],[.887,.63,.025,.04]],mist:.79},
 gnoll_fort:{fires:[[.989,.651,.016,.061],[.395,.313,.01,.031]],cloth:[[.671,.045,.02,.075],[.458,.01,.029,.08]],sky:[[.459,.022,.169,.077]],dust:true},
 black_altar:{fires:[[.074,.263,.022,.065],[.295,.377,.021,.058],[.434,.529,.024,.04],[.651,.529,.024,.04],[.863,.284,.022,.065]],mist:.82},
 grove:{leaves:true,mist:.67,falls:[[.803,.177,.023,.11]]},
 cliffs:{cloth:[[.501,.11,.02,.084]],mist:.72,sky:[[.02,.002,.45,.18]],birds:true},
 valve:{water:[[.225,.65,.185,.12]],falls:[[.185,.445,.017,.179],[.235,.447,.042,.152]],lights:[[.071,.253],[.42,.273],[.982,.411],[.923,.097]],mist:.63},
 study:{fires:[[.022,.757,.019,.065]],lights:[[.928,.423],[.696,.24],[.339,.242]],glow:[[.88,.668,0x9fcdff,.039]],dust:true},
 sickroom:{cloth:[[.375,.192,.039,.237],[.547,.262,.018,.352]],dust:true,windows:[[[.804,.032],[.849,.034],[.849,.355],[.804,.355]],[[.868,.028],[.909,.033],[.918,.415],[.868,.388]]]},
 undervault:{lights:[[.137,.104],[.33,.32],[.512,.373],[.852,.083]],glow:[[.274,.539,0x80c8ff,.023]],dust:true},
 mirrors:{fires:[[.17,.692,.029,.058],[.351,.638,.02,.04],[.651,.638,.02,.04],[.843,.689,.034,.069]],glow:[[.485,.287,0xb8d2ef,.029]],mist:.78},
 counting:{lights:[[.344,.199],[.896,.061],[.131,.046]],dust:true},
 silk_floor:{lights:[[.543,.186],[.878,.171]],cloth:[[.534,.144,.025,.254],[.828,.058,.022,.264]],dust:true}
};
const S={
 hiwot_sacrifice:{fires:[[.165,.085,.038,.044],[.794,.09,.037,.043],[.229,.312,.028,.051],[.341,.335,.014,.026],[.527,.337,.014,.026]],glow:[[.365,.562,0xb9e6ff,.046],[.617,.44,0xff5a50,.055],[.583,.28,0x8bc8ff,.06]],mist:.9,dust:true},
 hiwot_bound:{fires:[[.13,.409,.086,.175],[.908,.409,.084,.177]],fireColor:0x96d8ff,glow:[[.375,.451,0xa4d8ff,.032],[.626,.45,0xa4d8ff,.032],[.304,.574,0x98cfff,.025],[.69,.574,0x98cfff,.025]],mist:.86,dust:true},
 death:{fires:[[.809,.535,.008,.056],[.849,.517,.011,.072],[.968,.50,.011,.056]],sky:[[.515,0,.082,.107]],outdoor:true,phase:'night'},
 bounty:{fires:[[.043,.872,.025,.088]],lights:[[.022,.05],[.335,.263]],dust:true},
 dream_1:{mist:.57,dust:true},dream_2:{mist:.37,dust:true},
 dream_3:{fires:[[.898,.622,.036,.14],[.733,.255,.016,.099],[.117,.288,.013,.07]],dust:true},
 valve_scene:{water:[[.014,.502,.26,.072],[.27,.299,.085,.118]],falls:[[.065,.288,.02,.17],[.122,.289,.027,.08]],lights:[[.031,.123],[.655,.077]],mist:.51},
 letter:{lights:[[.928,.487]],dust:true},reveal:{fires:[[.954,.442,.019,.052],[.052,.504,.014,.04]],dust:true},
 frost:{glow:[[.511,.64,0x92d5ff,.19]],frost:true},
 altar:{fires:[[.186,.654,.033,.065],[.116,.427,.018,.065],[.145,.836,.036,.07],[.816,.657,.033,.065],[.888,.423,.018,.065],[.846,.835,.036,.07]],mist:.82},
 altar_amara:{fires:[[.565,.432,.022,.036],[.578,.752,.038,.065],[.512,.563,.021,.05]],mist:.82},
 ending_hero:{cloth:[[.18,.17,.04,.367],[.706,.243,.027,.237]],dust:true,sky:[[.45,.06,.079,.135]]},
 ending_vengeance:{fires:[[.587,.702,.007,.026],[.357,.69,.006,.025]],cloth:[[.75,.06,.022,.427]],sky:[[.431,.003,.235,.158]],dust:true},
 ending_usurper:{fires:[[.055,.519,.038,.067],[.23,.555,.048,.055],[.225,.272,.032,.04],[.35,.31,.028,.044],[.773,.555,.048,.06],[.772,.269,.032,.04],[.65,.31,.028,.04],[.956,.518,.038,.056]],fireColor:0xff633d,mist:.82},
 ending_mercy:{leaves:true,mist:.85},ending_empty:{mist:.79,dust:true}
};
// These coordinates are in the final seamless panorama files (not their source bands).
const P={
 lanternhold:{lights:[[.658,.688],[.892,.374],[.764,.204]],water:[[.033,.801,.069,.158]],cloth:[[.805,.082,.035,.355]],windows:[[[0,0],[.433,0],[.433,.7],[.324,.7],[.324,1],[0,1]],[[.557,.15],[.577,.12],[.591,.21],[.591,.6],[.557,.6]]]},
 griffon:{fires:[[.656,.567,.007,.04],[.685,.552,.006,.037],[.712,.536,.006,.041]],mist:.65,cloth:[[.351,.309,.039,.142]],sky:[[.61,.221,.178,.151]]},
 shore:{water:[[.249,.441,.644,.109]],cloth:[[.945,.18,.022,.266]],sky:[[.07,.026,.824,.112]],birds:true},
 open_hand:{lights:[[.063,.648],[.856,.439],[.918,.467]],cloth:[[.791,.075,.028,.288]],sky:[[.108,.051,.379,.072]]},
 thornbury:{fires:[[.153,.589,.018,.04]],smoke:[[.129,.139,.12]],cloth:[[.39,.126,.03,.263]],sky:[[.565,.01,.288,.061]]},
 ford:{water:[[.462,.715,.401,.05]],cloth:[[.107,.178,.067,.143]],sky:[[.312,.044,.213,.048]],birds:true},
 dunmere:{smoke:[[.073,.238,.11],[.327,.286,.17]],cloth:[[.786,.418,.028,.075]],sky:[[.58,.01,.311,.051]]},
 dunmere_mine:{lights:[[.149,.256],[.265,.407],[.311,.7],[.572,.91]],water:[[.59,.799,.178,.057]],falls:[[.781,.661,.012,.16]],mist:.78},
 holloway:{fires:[[.181,.571,.018,.045],[.456,.62,.019,.048]],cloth:[[.206,.449,.034,.262]],falls:[[.383,.246,.011,.105]],sky:[[.443,.016,.162,.039]],birds:true},
 bandit_camp:{fires:[[.081,.493,.009,.049],[.42,.532,.009,.048]],cloth:[[.332,.15,.028,.22]],mist:.61},
 mirkhollow:{falls:[[.739,.424,.015,.199],[.729,.473,.014,.13]],mist:.67,leaves:true},
 iron_mine:{fires:[[.614,.589,.018,.058],[.789,.538,.014,.045]],water:[[.117,.844,.578,.035]],falls:[[.194,.444,.017,.25]],mist:.75},
 span:{water:[[.297,.76,.484,.041]],cloth:[[.246,.237,.023,.286]],sky:[[.211,.006,.329,.101]],birds:true},
 sewers:{water:[[.2,.699,.708,.095]],falls:[[.103,.458,.049,.181],[.468,.468,.007,.043]],lights:[[.741,.213],[.862,.393],[.215,.752],[.862,.8]],mist:.62},
 nine_lanterns:{lights:[.418,.456,.497,.535,.577,.618,.662,.709,.751].map((x,i)=>[x,.352-i*.003]),water:[[.002,.481,.096,.044]],cloth:[[.77,.088,.04,.199]],sky:[[.115,.03,.059,.164]]},
 palace:{fires:[[.504,.436,.018,.034],[.638,.426,.026,.042]],cloth:[[.357,.139,.022,.19]],dust:true},
 tower:{lights:[[.134,.673],[.549,.731],[.723,.725],[.937,.713]],dust:true},
 catacombs:{fires:[[.092,.638,.018,.041],[.939,.633,.018,.044]],lights:[[.414,.707]],water:[[.733,.792,.062,.065]],mist:.83},
 hunted_city:{water:[[.445,.674,.14,.084]],lights:[[.654,.477],[.904,.685],[.719,.563]],cloth:[[.79,.157,.022,.148]],sky:[[.149,.028,.093,.099]]},
 undercity:{falls:[[.798,.466,.018,.11],[.151,.489,.018,.085]],water:[[.052,.703,.478,.03]],mist:.72,dust:true},
 temple:{fires:[[.183,.624,.027,.063],[.248,.615,.021,.047],[.389,.621,.027,.046],[.744,.626,.029,.055],[.84,.615,.024,.048],[.973,.633,.035,.055]],cloth:[[.052,.193,.026,.365]],mist:.77}
};
// Authored Griffon coordinates above refer to the original band; its runtime
// texture omits the stray strip belonging to Lanternhold at the top.
const griffonTrim=68/577;
for(const key of ['fires','cloth','sky'])P.griffon[key]=P.griffon[key].map(([x,y,w,h])=>[x,(y-griffonTrim)/(1-griffonTrim),w,h/(1-griffonTrim)]);
P.griffon.mist=(P.griffon.mist-griffonTrim)/(1-griffonTrim);
const enabled=()=>A.Prefs?.get().artMotion!==false&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let serial=0;
function attach(scene,root,bg,profile,opts={}){
 if(!profile)return null;
 const textureKey=opts.panorama?root.artTextureKey:bg.texture.key,frame=scene.textures.get(textureKey).get(),sw=frame.realWidth,sh=frame.realHeight;
 const layer=scene.add.container(0,0),paintLayer=scene.add.container(0,0),fx=scene.add.graphics(),strips=[],flames=[],flameKeys=[];
 // Repainted water and cloth belong below the same day/night grade as the
 // painting; luminous flames and airborne detail remain above that grade.
 const paintParent=opts.panorama?root:bg.parentContainer;paintParent.addAt(paintLayer,paintParent.getIndex(bg)+1);
 // Lift just the luminous paint inside each authored fire region. Its original
 // brushwork can now stretch and flicker without moving the brazier or masonry.
 for(const [index,[x,y,w,h]]of (profile.fires||[]).entries()){
  const cw=Math.max(4,Math.ceil(w*sw*1.4)),ch=Math.max(5,Math.ceil(h*sh*1.4)),c=document.createElement('canvas');c.width=cw;c.height=ch;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(frame.source.image,x*sw-cw/2,y*sh-ch,cw,ch,0,0,cw,ch);
  const pixels=A.ArtAssets.readPixels(ctx,0,0,cw,ch);if(!pixels)continue;const data=pixels.data;
  for(let py=0;py<ch;py++)for(let px=0;px<cw;px++){
   const at=(py*cw+px)*4,r=data[at],g=data[at+1],b=data[at+2];
   const warmth=profile.flameTone==='blue'
    ?Math.max(0,Math.min(1,(b-150)/65,(g-70)/70,(b-r-25)/65))
    :Math.max(0,Math.min(1,(r-150)/65,(g-70)/70,(r-b-35)/65));
   const edge=Math.min(1,px/3,(cw-1-px)/3,py/3,(ch-1-py)/3);data[at+3]=Math.round(255*warmth*Math.max(0,edge));
  }
  ctx.putImageData(pixels,0,0);const key='gate_fire_'+(++serial)+'_'+index;scene.textures.addCanvas(key,c);flameKeys.push(key);
 }
 const windowShape=opts.panorama&&profile.windows?scene.make.graphics({add:false}):null,windowMask=windowShape?.createGeometryMask();let maskedWeather=null;
 root.add(layer);let alive=true,time=0;const copies=opts.panorama?2:1,layers=[];
 for(let copy=0;copy<copies;copy++){
  const plane=scene.add.container(0,0),paint=scene.add.container(copy*sw,0);paintLayer.add(paint);layer.add(plane);layers.push(plane);
  for(const kind of ['water','cloth','foliage'])for(const r of profile[kind]||[]){
   const [x,y,w,h]=r,count=kind==='water'?10:8;
   for(let i=0;i<count;i++){
    const s=scene.add.image(0,0,textureKey).setOrigin(0).setCrop(x*sw,(y+h*i/count)*sh,w*sw,h*sh/count+.5);
    if(bg.tintTopLeft!==undefined)s.setTint(bg.tintTopLeft);if(kind==='water')s.setAlpha(.85);
    paint.add(s);strips.push({s,i,count,kind});
   }
  }
  const g=copy===0?fx:scene.add.graphics();plane.add(g);plane.fx=g;
  // Regular journeys give birds a flight corridor inside the painted sky.
  // The moving silhouette also keeps them behind trees and rooftops.
  if(Array.isArray(profile.birds)){
   plane.skyFx=scene.add.graphics();plane.add(plane.skyFx);
   if(opts.panorama&&root.skyMask)plane.skyFx.setMask(root.skyMask);
  }
  (profile.fires||[]).forEach(([x,y],i)=>{const s=scene.add.image(x*sw,y*sh,flameKeys[i]).setOrigin(.5,1);plane.add(s);flames.push({s,i,x:x*sw});});
 }
 const fire=(g,[x,y,w,h],t,index)=>{
  x*=sw;y*=sh;w*=sw;h*=sh;const beat=t/130+index*2.3,k=.86+Math.sin(beat)*.11+Math.sin(beat*1.7)*.07;
  for(let r=3;r>0;r--){g.fillStyle(profile.fireColor||0xffa34e,.025*k);g.fillEllipse(x,y-h*.38,w*(2+r),h*(1+r*.7));}
  if(w>13)for(let i=0;i<4;i++){const age=(t/1400+i*.25+index*.31)%1;g.fillStyle(profile.fireColor||0xffc06b,.65*(1-age));g.fillEllipse(x+Math.sin(age*9+i)*w*.4+age*w*.22,y-h*.5-age*h*2.2,1.5,2.4);}
 };
 function paint(g,t){
  g.clear();(profile.fires||[]).forEach((f,i)=>fire(g,f,t,i));
  for(const [x,y]of profile.lights||[]){const k=.73+Math.sin(t/230+x*27)*.19+Math.sin(t/97+y*19)*.08;
   for(let r=3;r>0;r--){g.fillStyle(0xffc67c,.036*k);g.fillCircle(x*sw,y*sh,r*9);}
   g.fillStyle(0xffe5a4,.46*k);g.fillEllipse(x*sw,y*sh,4,8*k);
  }
  for(const [x,y,h]of profile.smoke||[])for(let i=0;i<11;i++){const a=(t/5000+i/11)%1;g.fillStyle(0xbac3c8,.12*(1-a));g.fillEllipse(x*sw+a*25+Math.sin(a*8)*6,(y-a*h)*sh,8+a*28,9+a*19);}
  for(const [x,y,w,h]of profile.water||[])for(let i=0;i<24;i++){const a=(i*.173+t/12500)%1,px=(x+a*w)*sw,py=(y+((i*.419)%1)*h)*sh;
   g.lineStyle(.9,0xc0e0ed,.12+Math.sin(t/520+i)*.09);g.lineBetween(px,py,px+3+(i%5)*2,py);
  }
  for(const [x,y,w,h]of profile.falls||[]){
   for(let i=0;i<18;i++){const a=(t/1100+i/18)%1,px=(x+w*(.1+(i*.317)% .8))*sw,py=(y+a*h)*sh;
    g.lineStyle(1+i%2,0xe0f3f8,.13+Math.sin(a*Math.PI)*.16);g.lineBetween(px,py,px+Math.sin(a*6)*1.5,Math.min((y+h)*sh,py+h*sh*.14));}
   for(let i=0;i<5;i++){const a=(t/1700+i/5)%1;g.fillStyle(0xcbe2e8,.065*(1-a));g.fillEllipse((x+w*.5)*sw+Math.sin(i*2)*w*sw,(y+h)*sh-a*14,w*sw*(1+a),8+a*12);}
  }
  for(const [x,y,c,r]of profile.glow||[]){const k=.62+Math.sin(t/630)*.3;for(let j=3;j>0;j--){g.fillStyle(c,.035*k);g.fillEllipse(x*sw,y*sh,r*sw*j,r*sh*j);}}
  if(profile.mist)for(let i=0;i<7;i++){g.fillStyle(0xaac4d0,.04);g.fillEllipse((i*sw/6+t*.009)%(sw+200)-100,profile.mist*sh+Math.sin(t/3500+i)*12,280,20);}
  if(profile.leaves||profile.dust)for(let i=0;i<16;i++){const x=(i*113+t*.017)%(sw+10),y=(i*59+t*.01)%(sh+10);g.fillStyle(profile.leaves?0xc5cb96:0xe2d8be,profile.leaves?.4:.22);g.fillEllipse(x,y,profile.leaves?4+Math.sin(t/220+i)*2:1.5,profile.leaves?2:1);}
  if(profile.birds===true){g.lineStyle(1.2,0x354553,.7);for(let i=0;i<3;i++){const x=(t*.037+i*27)%(sw+100)-50,y=sh*.13+i*4,f=Math.sin(t/140+i)*3;g.lineBetween(x-5,y+f,x,y);g.lineBetween(x,y,x+5,y+f);}}
  for(const [x,y,w,h]of profile.motes||[])for(let i=0;i<8;i++){
   const a=(t/6400+i/8)%1,px=(x+(.5+Math.sin(i*2.7+t/1700)*.4)*w)*sw,py=(y+(1-a)*h)*sh,k=Math.sin(a*Math.PI);
   g.fillStyle(profile.moteColor||0xa0e5cb,.10*k);g.fillCircle(px,py,5);
   g.fillStyle(profile.moteColor||0xa0e5cb,.75*k);g.fillCircle(px,py,1.3);
  }
  if(profile.frost){for(let i=0;i<32;i++){const a=i/32*Math.PI*2+t/4000,x=(.51+Math.cos(a)*.25)*sw,y=(.55+Math.sin(a)*.39)*sh;g.lineStyle(1.5,0xcaf0ff,.3+Math.sin(t/310+i)*.18);g.lineBetween(x,y,x+Math.cos(a)*8,y+Math.sin(a)*8);}}
 }
 const update=(_t,dt=16)=>{
  if(!alive||!root.active)return;
  if(enabled()&&!document.hidden&&root.visible)time+=Math.min(50,dt);
  const scale=opts.panorama?root.tileScale:bg.scaleX,left=opts.panorama?-(root.distance%(sw*scale)):bg.x-bg.displayWidth/2,top=opts.panorama?0:bg.y-bg.displayHeight/2;
  layer.setPosition(left,top).setScale(scale);
  paintLayer.setPosition(left,top).setScale(scale);
  if(windowShape){
   windowShape.clear().fillStyle(0xffffff);
   for(let copy=0;copy<copies;copy++)for(const poly of profile.windows)windowShape.fillPoints(poly.map(([x,y])=>({x:left+(copy+x)*sw*scale,y:y*sh*scale})),true);
   if(root.weather&&!root.weather.destroyed&&root.weather!==maskedWeather){
    maskedWeather=root.weather;for(const o of maskedWeather._objs)o.setMask?.(windowMask);
    // The moon is already painted into this opening; avoid a second floating moon.
    maskedWeather.celestial?.setVisible(false);
   }
  }
  for(let i=0;i<layers.length;i++){
   const plane=layers[i];plane.x=i*sw;paint(plane.fx,time);
   if(plane.skyFx){
    const g=plane.skyFx;g.clear();
    if(opts.phase!=='night'){
     const [x,y,w,h]=profile.birds;
     for(let j=0;j<3;j++){
      const a=(time/18000+j*.095)%1,px=(x+a*w)*sw,py=(y+h*(.45+j*.13+Math.sin(time/3200)*.08))*sh,f=Math.sin(time/145+j)*2.5;
      g.lineStyle(1.2,0x354553,.75*Math.sin(a*Math.PI));g.lineBetween(px-5,py+f,px,py);g.lineBetween(px,py,px+5,py+f);
     }
    }
   }
  }
  for(const {s,i,count,kind}of strips)s.x=Math.sin(time/(kind==='water'?570:kind==='foliage'?1100:420)+i*.63)*(kind==='water'?1.8:kind==='foliage'?.85:(i+1)/count*2.8);
  for(const {s,i,x}of flames){const pulse=time/125+i*2.3;s.setScale(1+Math.sin(pulse)*.12,1+Math.sin(pulse*1.31)*.16).setAlpha(.76+Math.sin(pulse*.8)*.21);s.x=x+Math.sin(pulse*.65)*1.4;}
  api.elapsed=time;
 };
 const api={id:++serial,profile,layer,strips,elapsed:0,update};root.ambience=api;
 if(!opts.panorama)scene.events.on('update',update);
 root.once('destroy',()=>{alive=false;scene.events.off('update',update);windowMask?.destroy();windowShape?.destroy();for(const {s}of flames)s.destroy();for(const key of flameKeys)scene.textures.remove(key);});update(0,0);return api;
}
// Weather stays outside open arches; sealed interiors keep their indoor atmosphere.
function weather(scene,root,profile,indoor,weather,phase,opts={}){
 if(!root?.background||indoor&&!profile?.windows)return null;
 const bg=root.background,sw=bg.frame.realWidth,sh=bg.frame.realHeight,shape=scene.make.graphics({add:false});
 const project=(x,y)=>({x:bg.x-bg.displayWidth/2+x*sw*bg.scaleX,y:bg.y-bg.displayHeight/2+y*sh*bg.scaleY});
 let mask=null,skyMask=null,precipBounds;
 if(profile?.windows){shape.fillStyle(0xffffff);const points=[];for(const poly of profile.windows){const p=poly.map(([x,y])=>project(x,y));points.push(...p);shape.fillPoints(p,true);}mask=shape.createGeometryMask();
  const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));precipBounds={x,y,w:Math.max(...points.map(p=>p.x))-x,h:Math.max(...points.map(p=>p.y))-y};
 }
 const sky=scene.make.graphics({add:false});sky.fillStyle(0xffffff);
 for(const [x,y,w,h]of profile?.sky||[]){const p=project(x,y);sky.fillRect(p.x,p.y,w*sw*bg.scaleX,h*sh*bg.scaleY);}
 if(profile?.sky?.length)skyMask=sky.createGeometryMask();
 const fx=A.WeatherFX.attach(scene,weather,phase,null,{...opts,mask,precipBounds,clouds:!!skyMask,cloudMask:skyMask||mask});
 root.once('destroy',()=>{fx.destroy();mask?.destroy();skyMask?.destroy();shape.destroy();sky.destroy();});return fx;
}
A.GateAmbience={environments:E,stills:S,panoramas:P,attach,weather,enabled};
})();
