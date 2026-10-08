const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function cameraMatrix(t,scene,aspect=16/9,settings={}) {
  const mode=settings.camera==='preset'||!settings.camera?scene.camera:settings.camera;
  const motion=settings.restrained?.27:1,angle=t*.13*motion+(settings.yaw||0)+.7;
  const distanceRatio=(settings.distance||4.7)/4.7;
  let d=(settings.distance||4.7),height=1.6+(settings.pitch||0),eye=[Math.sin(angle)*d,height,Math.cos(angle)*d],target=[0,0,0];
  if(mode==='hold')eye=[2.7*distanceRatio,height,d];
  if(mode==='rise')eye=[Math.sin(angle)*d,1.5+Math.sin(t*.075*motion)*2,Math.cos(angle)*d];
  if(mode==='passage'){d=(2.5+2.2*(.5+.5*Math.sin(t*.10*motion)))*distanceRatio;eye=[Math.sin(angle*.6)*d,.8+Math.sin(t*.07)*.5+(settings.pitch||0),Math.cos(angle*.6)*d];}
  if(mode==='interior'){
    // Begin outside the enclosure so its identity is readable, then pass inside.
    // The return reveals the surrounding layers again instead of cropping forever.
    const journey=.5-.5*Math.cos(t*.11*motion);
    d=(4.8-3.45*journey)*distanceRatio;
    eye=[Math.sin(angle)*d,.45+(settings.pitch||0)*.3,Math.cos(angle)*d];
    target=[0,Math.sin(t*.05)*.15,0];
  }
  if(mode==='detail'){d=(2.2+Math.sin(t*.06))*distanceRatio;eye=[Math.sin(angle)*d,.7+(settings.pitch||0),Math.cos(angle)*d];}
  const z=norm(eye.map((n,i)=>n-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
  const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  const f=1/Math.tan(.78/2),near=.08,far=60;
  const p=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
  const m=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)m[col*4+row]+=p[k*4+row]*view[col*4+k];
  return m;
}
export function project(p,m){const a=[...p,1],o=[];for(let i=0;i<4;i++)o[i]=a.reduce((s,x,j)=>s+x*m[j*4+i],0);return o;}
