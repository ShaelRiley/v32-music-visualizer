import {sampleLayer} from './operators.mjs';
import {SPACE_DATA} from '../../assets/spaces/manifest.mjs';
import {railPoint,warpSpacePoint} from './space-motion.mjs';
const spaceViews=new Map(SPACE_DATA.views.map(v=>[v.id,v])),spaceSources=new Map(SPACE_DATA.sources.map(s=>[s.id,s]));
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const frames=new WeakMap(),FOV=.9;

// Stable world envelope: no GPU readback, per-frame resampling or audio zoom.
export function sceneFraming(scene) {
  if(frames.has(scene))return frames.get(scene);
  if(scene.video)return {center:[0,0,0],half:[2.4,2.4,2.4],landscape:false};
  if(scene.space){const b=spaceSources.get(spaceViews.get(scene.space.view).source).bounds,result={center:b[0].map((v,i)=>(v+b[1][i])/2),half:b[0].map((v,i)=>Math.max(.2,(b[1][i]-v)/2)),landscape:false};frames.set(scene,result);return result;}
  const axes=[[],[],[]],audio={level:.5,bass:.55,mid:.45,treble:.35,onset:.3,trend:.5};
  for(const t of [0,7,19])for(const layer of scene.layers)for(let i=0;i<64;i++){
    const u=layer.domain[0]+((.5+i*.754877666)%1)*layer.domain[2];
    const v=layer.domain[1]+((.5+i*.569840296)%1)*layer.domain[3];
    const p=sampleLayer(layer,u,v,t,audio);
    for(let j=0;j<3;j++)if(Number.isFinite(p[j])&&Math.abs(p[j])<20)axes[j].push(p[j]);
  }
  const low=[],high=[];
  for(const axis of axes){axis.sort((a,b)=>a-b);low.push(axis[Math.floor(axis.length*.025)]??-1);high.push(axis[Math.floor(axis.length*.975)]??1);}
  const center=low.map((v,i)=>(v+high[i])*.5),half=low.map((v,i)=>Math.max(.2,(high[i]-v)*.5));
  const landscape=['wave','strata','gyroid','reaction','weft'].includes(scene.layers[0].op);
  const result={center,half,landscape};frames.set(scene,result);return result;
}

export function cameraMatrix(t,scene,aspect=16/9,settings={}) {
  const mode=settings.camera==='preset'||!settings.camera?scene.camera:settings.camera;
  if(scene.video){const motion=settings.restrained?.27:1,yaw=(settings.yaw||0)+(mode==='hold'?0:Math.sin(t*.07*motion)*.23),pitch=(settings.pitch||0)*.15+Math.sin(t*.045*motion)*.045;
    return perspectiveView([0,0,0],[Math.sin(yaw),pitch,-Math.cos(yaw)],aspect,.015,Math.max(.8,Math.min(1.65,1.3*4.7/(settings.distance||4.7))));}
  if(scene.space&&mode==='passage'){
    const v=spaceViews.get(scene.space.view),motion=settings.restrained?.27:1,at=t*motion/v.period,scale=settings.sceneScale||1;
    const eye=warpSpacePoint(railPoint(v.path,at),t,scene.layers[0],settings.audio||{},v.warp*.45).map(x=>x*scale);
    const target=warpSpacePoint(railPoint(v.targetPath||v.path,at+(v.targetPath?0:.025)),t,scene.layers[0],settings.audio||{},v.warp*.45).map(x=>x*scale);
    eye[1]+=((settings.distance||4.7)-4.7)*.08;target[1]-=v.lookDown*scale;
    const delta=target.map((x,i)=>x-eye[i]),yaw=settings.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    target[0]=eye[0]+c*delta[0]+s*delta[2];target[2]=eye[2]-s*delta[0]+c*delta[2];target[1]+=(settings.pitch||0)*.2;
    return perspectiveView(eye,target,aspect,.002,v.fov||1.05);
  }
  const frame=sceneFraming(scene),motion=settings.restrained?.27:1;
  let angle=t*.075*motion+(settings.yaw||0)+.7;
  let lift=frame.landscape?.48:.34;
  if(mode==='hold')angle=.7+(settings.yaw||0);
  if(mode==='rise')lift+=.17*Math.sin(t*.09*motion);
  if(mode==='passage'){angle=.12*Math.sin(t*.14*motion)+(settings.yaw||0);lift=frame.landscape?.48:.12;}
  if(mode==='interior')lift=.12;
  if(mode==='detail')lift=.25;
  lift+=(settings.pitch||0)*.22;
  const z=norm([Math.sin(angle),lift,Math.cos(angle)]),x=norm(cross([0,1,0],z)),y=cross(z,x);
  const tangent=Math.tan(FOV/2);
  let fit=1;
  for(const a of [-1,1])for(const b of [-1,1])for(const c of [-1,1]){
    const corner=[a*frame.half[0],b*frame.half[1],c*frame.half[2]],depth=dot(corner,z);
    fit=Math.max(fit,depth+Math.abs(dot(corner,x))/(tangent*aspect*.92),depth+Math.abs(dot(corner,y))/(tangent*.88));
  }
  const distanceRatio=(settings.distance||4.7)/4.7;
  let approach=scene.kind==='discovery'?.58:frame.landscape?.66:.70;
  if(mode==='passage')approach=(scene.kind==='discovery'?.58:.65)-.09*(.5-.5*Math.cos(t*.26*motion));
  if(mode==='interior')approach=.74-.09*(.5-.5*Math.cos(t*.11*motion));
  if(mode==='detail')approach=.65+.025*Math.sin(t*.08*motion);
  const distance=fit*distanceRatio*approach;
  const target=frame.center.map(v=>v*(settings.sceneScale||1)),eye=target.map((v,i)=>v+z[i]*distance);
  return perspectiveView(eye,target,aspect,.08);
}
function perspectiveView(eye,target,aspect,near,fov=FOV){
  const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
  const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  const f=1/Math.tan(fov/2),far=80;
  const p=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
  const m=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)m[col*4+row]+=p[k*4+row]*view[col*4+k];
  return m;
}
export function project(p,m){const a=[...p,1],o=[];for(let i=0;i<4;i++)o[i]=a.reduce((s,x,j)=>s+x*m[j*4+i],0);return o;}
