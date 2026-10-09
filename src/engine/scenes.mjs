import {OPERATORS,EFFECTS,RELATIONS,CAMERAS,sampleLayer} from './operators.mjs';
import {hash,rng,pick} from './random.mjs';
import {cameraMatrix,project} from './math.mjs';
import {SPACE_DATA} from '../../assets/spaces/manifest.mjs';
import {VR_DATA} from '../../assets/vr/manifest.mjs';
const spaceIDs=new Set(SPACE_DATA.views.map(v=>v.id));
const videoIDs=new Set(VR_DATA.views.map(v=>v.id));
export const SCHEMA_VERSION=1,GENERATOR_VERSION='1.1.0';
export const CUTS=['none','slit','pores','rim','bands','open','petals'];
export const AUDIO=['bass','mid','treble','onset','trend'];
export const COLOR_ROLES=['body','accent','counter','detail','structure','edge','ground','distance','canopy'];
export function layer(op,options={}) {
 return {op,partner:op,relation:'independent',effect:'ripple',cut:'none',audio:'bass',phase:0,hue:0,colorRole:'body',
  scale:[1,1,1],offset:[0,0,0],rotate:[0,0,0],domain:[0,0,1,1],...options};
}
export function scene(id,name,family,layers,options={}) {
 return {schemaVersion:SCHEMA_VERSION,generatorVersion:GENERATOR_VERSION,id,name,family,kind:'library',seed:id,initialState:{clock:0},camera:'orbit',layers,
  description:'A spatial formation assembled directly from canonical glyph marks.',audioBehavior:'Low frequencies articulate the structure; higher bands travel across its fabric.',distinction:'A deliberately composed spatial relationship.',budget:10000,...options};
}
export const VERTICAL_SLICE=scene('ribbon-01','Prism Sail','ribbon',[
 layer('ribbon',{effect:'fold',rotate:[.3,0,.4],audio:'mid'}),
 layer('knot',{effect:'circulate',scale:[.5,.5,.5],hue:.25,audio:'onset'})
],{description:'An open spectral membrane folds around a circulating knot.',distinction:'A folded surface surrounds a moving filament without filling the central void.'});
export function fingerprint(s) {
 if(s.space)return JSON.stringify(['space',s.space.view,s.layers,s.camera]);
 if(s.video)return JSON.stringify(['video',s.video.view,s.layers,s.camera]);
 const graph=s.layers.map(l=>[l.op,l.relation==='independent'?null:l.partner,l.relation,l.effect,l.cut,l.audio,
  l.offset.map(x=>Math.abs(x)<.05?0:Math.sign(x)),l.scale.map(x=>x<.65?'small':x>1.5?'large':'body'),l.domain.map(x=>Math.round(x*4)/4)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 return JSON.stringify([s.camera,graph]);
}
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
function vector(value,n,a,b){if(!Array.isArray(value)||value.length!==n||!value.every(x=>finite(x,a,b)))throw Error('Invalid bounded numeric vector');return [...value];}
export function validateScene(input) {
 if(!input||typeof input!=='object'||Array.isArray(input)||input.schemaVersion!==SCHEMA_VERSION)throw Error('Unsupported scene schema');
 if(!['1.0.0',GENERATOR_VERSION].includes(input.generatorVersion))throw Error('Unsupported generator/operator version');
 if(!Array.isArray(input.layers)||input.layers.length<1||input.layers.length>5)throw Error('A scene needs 1–5 layers');
 if(!CAMERAS.includes(input.camera))throw Error('Unknown camera path');
 const text=(v,n)=>{if(typeof v!=='string'||v.length<1||v.length>n)throw Error('Invalid scene text');return v;};
 const layers=input.layers.map(l=>{
  if(!l||!OPERATORS.includes(l.op)||!OPERATORS.includes(l.partner)||!RELATIONS.includes(l.relation)||!EFFECTS.includes(l.effect)||!CUTS.includes(l.cut)||!AUDIO.includes(l.audio))throw Error('Unknown mathematical operator or mapping');
  const domain=vector(l.domain,4,0,1);if(domain[0]+domain[2]>1.00001||domain[1]+domain[3]>1.00001||domain[2]<.03||domain[3]<.03)throw Error('Invalid sampling domain');
  if(!finite(l.phase,-100,100)||!finite(l.hue,-10,10))throw Error('Invalid initial phase');
  if(l.colorRole!==undefined&&!COLOR_ROLES.includes(l.colorRole))throw Error('Unknown color role');
  return layer(l.op,{partner:l.partner,relation:l.relation,effect:l.effect,cut:l.cut,audio:l.audio,phase:l.phase,hue:l.hue,colorRole:l.colorRole||'body',scale:vector(l.scale,3,.08,3),offset:vector(l.offset,3,-3,3),rotate:vector(l.rotate,3,-10,10),domain});
 });
 if(!finite(input.budget,1200,24000)||!finite(input.initialState?.clock,0,3600))throw Error('Scene budget or initial clock exceeds limits');
 if(input.space&&(!spaceIDs.has(input.space.view)||input.kind!=='library'||layers.length!==1))throw Error('Unknown or invalid bundled spatial world');
 if(input.video&&(!videoIDs.has(input.video.view)||input.kind!=='library'||layers.length!==1||input.space))throw Error('Unknown or invalid bundled spherical video');
 return scene(text(input.id,100),text(input.name,100),text(input.family,60),layers,{...(input.space?{space:{view:input.space.view}}:{}),...(input.video?{video:{view:input.video.view}}:{}),generatorVersion:input.generatorVersion,kind:input.kind==='discovery'?'discovery':'library',seed:text(input.seed,100),camera:input.camera,
  description:text(input.description,800),audioBehavior:text(input.audioBehavior,800),distinction:text(input.distinction,800),budget:Math.round(input.budget),initialState:{clock:input.initialState.clock}});
}
export function qualityCheck(s) {
 let span=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity],occupied=0,visible=0;
 const matrix=cameraMatrix(3,s,16/9),samples=s.layers.length*64,tiles=new Float64Array(96),projected=[Infinity,Infinity,-Infinity,-Infinity];
 for(const l of s.layers)for(let i=0;i<64;i++){
  const u=l.domain[0]+(((i+.5)*.754877)%1)*l.domain[2],v=l.domain[1]+(((i+.5)*.56984)%1)*l.domain[3];
  const p=sampleLayer(l,u,v,3,{level:.5,bass:.4,mid:.3,treble:.3,onset:.2,trend:.45});
  if(![...p].every(Number.isFinite))return {valid:false,reason:'nonfinite'};
  for(let j=0;j<3;j++){span[j]=Math.min(span[j],p[j]);span[j+3]=Math.max(span[j+3],p[j]);}
  if(Math.hypot(...p)<6)occupied++;
  const c=project(p,matrix),x=c[0]/c[3],y=c[1]/c[3];
  if(c[3]>.08&&Math.abs(x)<1&&Math.abs(y)<1&&c[2]>-c[3]&&c[2]<c[3]){
   visible++;projected[0]=Math.min(projected[0],x);projected[1]=Math.min(projected[1],y);projected[2]=Math.max(projected[2],x);projected[3]=Math.max(projected[3],y);
   const tile=Math.min(11,Math.floor((x+1)*6))+12*Math.min(7,Math.floor((y+1)*4));
   const height=Math.min(32,.036*2.43/c[3]*720);tiles[tile]+=height*height*.5*.38;
  }
 }
 const extents=span.slice(3).map((x,i)=>x-span[i]);
 if(extents.filter(x=>x>.16).length<2)return {valid:false,reason:'collapsed'};
 if(Math.max(...extents)>12||occupied<32)return {valid:false,reason:'extent'};
 if(visible/samples<.12)return {valid:false,reason:'poor-initial-visibility'};
 // Estimate overlap locally rather than treating clustered marks as though
 // their footprints were spread uniformly across the entire screen.
 const occupiedEstimate=tiles.reduce((n,area)=>n+1-Math.exp(-area/samples*s.budget/(1280*720/96)),0)/96;
 const width=(projected[2]-projected[0])/2,height=(projected[3]-projected[1])/2;
 if(occupiedEstimate>.85)return {valid:false,reason:'insufficient-negative-space'};
 if(s.kind==='discovery'&&s.generatorVersion===GENERATOR_VERSION&&(width<.72||height<.62))return {valid:false,reason:'insufficient-screen-extent'};
 return {valid:true,extents,visibleSampleFraction:visible/samples,estimatedOccupiedFraction:occupiedEstimate,projectedWidth:width,projectedHeight:height};
}

export function generateDiscovery(seed,recent=new Set()) {
 const r=rng(seed),attempts=[];
 for(let attempt=0;attempt<12;attempt++){
  const layout=pick(r,['landscape','landscape','tunnel','archway','asteroids','orbitals','crossing']);
  const count=layout==='crossing'?2+Math.floor(r()*2):3+Math.floor(r()*2);
  const root=pick(r,layout==='landscape'?['wave','strata','gyroid','reaction','weft']:layout==='tunnel'?['catenoid','hourglass','torus']:layout==='archway'?['arch']:layout==='asteroids'?['cell','crystal']:layout==='orbitals'?['torus']:OPERATORS);
  const layers=[];
  for(let i=0;i<count;i++){
   let op=i===0?root:pick(r,OPERATORS),relation=pick(r,['independent','independent','wrap','weave']),partner=pick(r,OPERATORS),effect=pick(r,['fold','twist','ripple','circulate','grow']);
   let scale=[1.35,1.25,1.35],offset=[(i===0?-1:1)*1.05,(r()-.5)*.5,(r()-.5)*1.2],rotate=[r()*.7,r()*1.6,r()*.4],cut=pick(r,['none','none','pores']);
   if(layout==='landscape'){
    if(i===0){scale=[1.95,.72,1.75];offset=[0,-.65,0];rotate=[0,(r()-.5)*.3,0];cut='none';effect=pick(r,['fold','ripple']);}
    else{scale=[.95,1.1,.95];offset=[(i%2?-1:1)*(1.2+r()*.6),.5,-.6-i*.55];relation='independent';cut='none';}
   }
   if(layout==='tunnel'){
    op=i===0?root:pick(r,['catenoid','hourglass','torus','iris']);scale=[1.5+r()*.2,1.45+r()*.2,.85];offset=[0,0,(i-(count-1)/2)*1.85];rotate=[Math.PI/2,0,0];relation='independent';cut='none';effect=pick(r,['ripple','fold','twist']);
   }
   if(layout==='archway'){
    op='arch';scale=[1.65,1.5,.85];offset=[(r()-.5)*.3,.15,(i-(count-1)/2)*1.8];rotate=[0,0,0];relation='independent';cut='none';effect=pick(r,['ripple','fold']);
    if(i===count-1){op=pick(r,['wave','strata','weft']);scale=[1.7,.45,2.8];offset=[0,-1.05,0];effect='ripple';}
   }
   if(layout==='asteroids'){
    op=pick(r,['cell','cell','crystal','superquadric']);scale=op==='cell'?[2.1,1.8,2.1]:[.8+r()*.5,1,1];offset=[(r()-.5)*2.6,(r()-.5)*1.4,(i-(count-1)/2)*1.65];relation='independent';cut=op==='cell'?'none':pick(r,['none','pores']);effect='circulate';
   }
   if(layout==='orbitals'){
    op=pick(r,['torus','torus','catenoid']);scale=[1.4+r()*.35,1.4+r()*.35,1.2];offset=[Math.sin(i*2.4)*1.35,Math.cos(i*1.6)*.5,(i-(count-1)/2)*1.5];rotate=[Math.PI/2+(r()-.5)*.6,(r()-.5)*.5,0];relation=pick(r,['independent','wrap']);partner=pick(r,['torus','ribbon','spiral']);cut='none';
   }
   if(partner===op&&relation!=='independent')partner=pick(r,OPERATORS.filter(x=>x!==op));
   layers.push(layer(op,{partner,relation,effect,cut,audio:pick(r,AUDIO),phase:r()*6.28,hue:i*.29+r()*.08,colorRole:i===0?(layout==='landscape'?'ground':'structure'):i===1?'accent':i===2?'counter':'distance',scale,offset,rotate,domain:[0,0,1,1]}));
  }
  const camera=layout==='crossing'?pick(r,['orbit','rise']):'passage';
  const nouns={landscape:'Horizon',tunnel:'Tunnel',archway:'Arcade',asteroids:'Asteroid Field',orbitals:'Orbital Passage',crossing:'Confluence'};
  const s=scene('discovery-'+seed+'-'+attempt,`${pick(r,['Luminous','Oblique','Resonant','Spectral','Folded','Undulating'])} ${nouns[layout]}`,root,layers,{
   kind:'discovery',seed,camera,budget:12000,description:`A sweeping ${layout} of ${count} layered ${layers.map(l=>l.op).join(', ')} constructions, composed for close, immersive travel.`,
   audioBehavior:`Sustained energy drives every wave and ripple; ${[...new Set(layers.map(l=>l.audio))].join(', ')} articulate individual layers and beats rotate the marks.`,distinction:`Generated ${layout}; geometry, depth arrangement, graph relationships and audio mappings are seed-dependent.`
  });
  const checked=qualityCheck(s),fp=fingerprint(s);
  if(!checked.valid){attempts.push(checked.reason);continue;}
  if(recent.has(fp)){attempts.push('recent-structural-repeat');continue;}
  return {scene:validateScene(s),attempts,fingerprint:fp,fallback:false};
 }
 return {scene:VERTICAL_SLICE,attempts,fingerprint:fingerprint(VERTICAL_SLICE),fallback:true};
}
