import {OPERATORS,EFFECTS,RELATIONS,CAMERAS,sampleLayer} from './operators.mjs';
import {hash,rng,pick} from './random.mjs';
import {cameraMatrix,project} from './math.mjs';
export const SCHEMA_VERSION=1,GENERATOR_VERSION='1.0.0';
export const CUTS=['none','slit','pores','rim','bands','open','petals'];
export const AUDIO=['bass','mid','treble','onset','trend'];
export function layer(op,options={}) {
 return {op,partner:op,relation:'independent',effect:'ripple',cut:'none',audio:'bass',phase:0,hue:0,
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
 const graph=s.layers.map(l=>[l.op,l.relation==='independent'?null:l.partner,l.relation,l.effect,l.cut,l.audio,
  l.offset.map(x=>Math.abs(x)<.05?0:Math.sign(x)),l.scale.map(x=>x<.65?'small':x>1.5?'large':'body'),l.domain.map(x=>Math.round(x*4)/4)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 return JSON.stringify([s.camera,graph]);
}
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
function vector(value,n,a,b){if(!Array.isArray(value)||value.length!==n||!value.every(x=>finite(x,a,b)))throw Error('Invalid bounded numeric vector');return [...value];}
export function validateScene(input) {
 if(!input||typeof input!=='object'||Array.isArray(input)||input.schemaVersion!==SCHEMA_VERSION)throw Error('Unsupported scene schema');
 if(input.generatorVersion!==GENERATOR_VERSION)throw Error('Unsupported generator/operator version');
 if(!Array.isArray(input.layers)||input.layers.length<1||input.layers.length>5)throw Error('A scene needs 1–5 layers');
 if(!CAMERAS.includes(input.camera))throw Error('Unknown camera path');
 const text=(v,n)=>{if(typeof v!=='string'||v.length<1||v.length>n)throw Error('Invalid scene text');return v;};
 const layers=input.layers.map(l=>{
  if(!l||!OPERATORS.includes(l.op)||!OPERATORS.includes(l.partner)||!RELATIONS.includes(l.relation)||!EFFECTS.includes(l.effect)||!CUTS.includes(l.cut)||!AUDIO.includes(l.audio))throw Error('Unknown mathematical operator or mapping');
  const domain=vector(l.domain,4,0,1);if(domain[0]+domain[2]>1.00001||domain[1]+domain[3]>1.00001||domain[2]<.03||domain[3]<.03)throw Error('Invalid sampling domain');
  if(!finite(l.phase,-100,100)||!finite(l.hue,-10,10))throw Error('Invalid initial phase');
  return layer(l.op,{partner:l.partner,relation:l.relation,effect:l.effect,cut:l.cut,audio:l.audio,phase:l.phase,hue:l.hue,scale:vector(l.scale,3,.08,3),offset:vector(l.offset,3,-3,3),rotate:vector(l.rotate,3,-10,10),domain});
 });
 if(!finite(input.budget,1200,24000)||!finite(input.initialState?.clock,0,3600))throw Error('Scene budget or initial clock exceeds limits');
 return scene(text(input.id,100),text(input.name,100),text(input.family,60),layers,{kind:input.kind==='discovery'?'discovery':'library',seed:text(input.seed,100),camera:input.camera,
  description:text(input.description,800),audioBehavior:text(input.audioBehavior,800),distinction:text(input.distinction,800),budget:Math.round(input.budget),initialState:{clock:input.initialState.clock}});
}
export function qualityCheck(s) {
 let span=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity],occupied=0,visible=0,footprint=0;const matrix=cameraMatrix(3,s,16/9),samples=s.layers.length*48;
 for(const l of s.layers)for(let i=0;i<48;i++){
  const u=l.domain[0]+(((i+.5)*.754877)%1)*l.domain[2],v=l.domain[1]+(((i+.5)*.56984)%1)*l.domain[3];
  const p=sampleLayer(l,u,v,3,{bass:.4,mid:.3,treble:.3,onset:.2,trend:.45});
  if(![...p].every(Number.isFinite))return {valid:false,reason:'nonfinite'};
  for(let j=0;j<3;j++){span[j]=Math.min(span[j],p[j]);span[j+3]=Math.max(span[j+3],p[j]);}
  if(Math.hypot(...p)<5)occupied++;
  const c=project(p,matrix);if(c[3]>.08&&Math.abs(c[0])<c[3]*1.1&&Math.abs(c[1])<c[3]*1.1&&c[2]>-c[3]&&c[2]<c[3]){visible++;const height=Math.min(36,.054*2.43/c[3]*720);footprint+=height*height*.5*.28;}
 }
 const extents=span.slice(3).map((x,i)=>x-span[i]);
 if(extents.filter(x=>x>.16).length<2)return {valid:false,reason:'collapsed'};
 if(Math.max(...extents)>10||occupied<32)return {valid:false,reason:'extent'};
 if(visible/samples<.035)return {valid:false,reason:'poor-initial-visibility'};
 const occupiedEstimate=1-Math.exp(-footprint/samples*s.budget/(1280*720));
 if(occupiedEstimate>.82)return {valid:false,reason:'insufficient-negative-space'};
 return {valid:true,extents,visibleSampleFraction:visible/samples,estimatedOccupiedFraction:occupiedEstimate};
}
export function generateDiscovery(seed,recent=new Set()) {
 const r=rng(seed),attempts=[];
 for(let attempt=0;attempt<12;attempt++){
  const count=2+Math.floor(r()*4),root=pick(r,OPERATORS),layout=pick(r,['contain','constellation','crossing','corridor','asymmetric']);
  const layers=[];
  for(let i=0;i<count;i++){
   const op=i===0?root:pick(r,OPERATORS);let partner=pick(r,OPERATORS);
   const relation=pick(r,RELATIONS),size=layout==='contain'?(i===0?1.65:.85/(i+.25)):layout==='corridor'?.74:layout==='constellation'?.62:1;
   if(relation!=='independent'&&partner===op)partner=pick(r,OPERATORS.filter(x=>x!==op));
   const offset=layout==='constellation'?[Math.cos(i*2.4)*1.15,Math.sin(i*1.7)*.45,Math.sin(i*2.4)*1.15]:layout==='corridor'?[0,0,(i-(count-1)/2)*1.5]:layout==='asymmetric'?[r()*1.8-.9,r()*1.2-.6,r()*1.8-.9]:[0,0,0];
   layers.push(layer(op,{partner,relation,effect:pick(r,EFFECTS),cut:pick(r,['none','none','pores','slit','open','bands']),audio:pick(r,AUDIO),phase:r()*6.28,hue:r(),scale:[size,size*(.7+r()*.6),size],offset,rotate:[r()*2-.5,r()*3,r()*1.6],domain:[0,0,1,1]}));
  }
  const camera=layout==='corridor'?'passage':layout==='contain'?pick(r,['interior','orbit','detail']):pick(r,['orbit','rise','hold','passage']);
  const s=scene('discovery-'+seed+'-'+attempt,`${pick(r,['Luminous','Oblique','Porous','Resonant','Spectral','Folded'])} ${pick(r,['Sanctuary','Confluence','Passage','Organism','Paradox','Weather'])}`,root,layers,{
   kind:'discovery',seed,camera,budget:12000,description:`A newly composed ${layout} of ${count} interacting ${layers.map(l=>l.op).join(', ')} constructions.`,
   audioBehavior:`${[...new Set(layers.map(l=>l.audio))].join(', ')} drive separate ${[...new Set(layers.map(l=>l.effect))].join(', ')} gestures.`,distinction:`Generated ${layout}; graph structure, relationships, apertures and audio mappings are seed-dependent.`
  });
  const checked=qualityCheck(s),fp=fingerprint(s);
  if(!checked.valid){attempts.push(checked.reason);continue;}
  if(recent.has(fp)){attempts.push('recent-structural-repeat');continue;}
  return {scene:validateScene(s),attempts,fingerprint:fp,fallback:false};
 }
 return {scene:VERTICAL_SLICE,attempts,fingerprint:fingerprint(VERTICAL_SLICE),fallback:true};
}
