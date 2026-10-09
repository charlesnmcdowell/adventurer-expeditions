// Shared, edition-owned environmental motion. Ground and contact art stay fixed.
(function () {
'use strict';
const X=ADV.Expedition, E=X.Atmosphere={};
E.create=(scene,parent,{night=false}={})=>{
  // Soft canvas gradients avoid the visible concentric ellipse bands of the
  // old Graphics clouds. Created once; only sprite positions move per frame.
  const key='xp_atmosphere_cloud';
  if(!scene.textures.exists(key)){
    const tex=scene.textures.createCanvas(key,512,160),ctx=tex.context;
    for(let p=0;p<9;p++){
      const x=65+p*47,y=75+Math.sin(p*1.7)*12,r=50+(p%3)*9;
      ctx.save();ctx.translate(x,y);ctx.scale(1,.5);
      const grad=ctx.createRadialGradient(0,0,0,0,0,r);
      grad.addColorStop(0,'rgba(231,240,255,.21)');
      grad.addColorStop(.45,'rgba(231,240,255,.12)');
      grad.addColorStop(1,'rgba(231,240,255,0)');
      ctx.fillStyle=grad;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
    }
    tex.refresh();
  }
  const g=scene.add.container(0,0);parent.add(g);
  const banks=Array.from({length:5},(_,i)=>{
    const s=scene.add.image(0,85+(i%3)*53,key).setAlpha(night?.22:.32);
    if(night)s.setTint(0x9cadcc);g.add(s);return s;
  });
  return {graphics:g,draw(t){
    banks.forEach((s,i)=>s.x=((i*397+t*(.011+i*.002))%2100)-410);
  }};
};
E.lights=(scene,parent,points)=>{
  const g=scene.add.graphics();parent.add(g);
  return {graphics:g,draw(t){
    g.clear();
    points.forEach(([x,y,s=1],i)=>{
      const glow=.68+.18*Math.sin(t/119+i*3)+.12*Math.sin(t/53+i);
      for(let j=4;j>0;j--){g.fillStyle(0xffae48,glow*.032);g.fillEllipse(x,y,17*s*j,22*s*j);}
      g.fillStyle(0xffd883,.48*glow);g.fillEllipse(x,y,5*s,9*s);
    });
  }};
};
})();
