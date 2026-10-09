import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRESETS} from '../src/engine/catalog.mjs';
import {sampleLayer,EFFECTS} from '../src/engine/operators.mjs';
import {layer,validateScene} from '../src/engine/scenes.mjs';
import {musicalActivity,musicalDrive} from '../src/audio/motion.mjs';
import {VISUAL_PALETTES,PALETTES,getPaletteBundle,quantizeColor} from '../src/engine/palette-library.mjs';
import {defaults,sanitizeSettings} from '../src/ui/settings.mjs';
import {cameraMatrix,project} from '../src/engine/math.mjs';
import {PaletteCycle} from '../src/engine/palette-cycle.mjs';
import {rng} from '../src/engine/random.mjs';

test('Authored shuffle defaults and optional palette shuffle traverse the applicable collection without adjacent repeats',()=>{
 assert.equal(defaults.mode,'shuffle');assert.equal(defaults.paletteCycle,true);assert.equal(sanitizeSettings({paletteCycle:false}).paletteCycle,false);
 const ids=PALETTES.filter(p=>p.available).map(p=>p.id),cycle=new PaletteCycle(ids,rng('palettes')),seen=new Set();let current=defaults.palette;
 for(let i=0;i<ids.length*2;i++){const next=cycle.next(current);assert(ids.includes(next));assert.notEqual(next,current);seen.add(next);current=next;}
 assert.equal(seen.size,ids.length);
});

test('Sustained music moves every effect and most samples, even onset-only layers between beats',()=>{
 const tone={level:.65,bass:.7,mid:.5,treble:.4,onset:0,trend:.6};
 assert.equal(musicalActivity({}),0);assert(musicalDrive(tone,'onset')>.2);
 for(const effect of EFFECTS){
  const l=layer('wave',{effect,audio:'onset'});let changed=0,total=0;
  for(let i=0;i<128;i++){
   const u=(i*.754877+.05)%1,v=(i*.56984+.03)%1,a=sampleLayer(l,u,v,7,{}),b=sampleLayer(l,u,v,7,tone),delta=Math.hypot(...a.map((n,j)=>n-b[j]));
   if(delta>.04)changed++;total+=delta;
  }
  assert(changed/128>.9,effect+' leaves too many marks unmoved');assert(total/128>.12,effect+' has too little sustained response');
 }
});

test('Long strands and sheets flex internally rather than moving only as rigid segments',()=>{
 const tone={level:.65,bass:.7,mid:.5,treble:.4,onset:0,trend:.6};
 for(const op of ['helix','braid','ribbon','weft','arch'])for(const effect of ['still','circulate']){
  const l=layer(op,{effect,audio:'onset'});let changedLengths=0;
  for(let i=0;i<64;i++){
   const u=(i+.5)/64,v=.43,neighbor=u+.04;
   const distance=t=>{const a=sampleLayer(l,u,v,t,tone),b=sampleLayer(l,neighbor,v,t,tone);return Math.hypot(...a.map((n,j)=>n-b[j]));};
   const a=distance(7),b=distance(7.75);
   if(Math.abs(a-b)/Math.max(.001,a)>.015)changedLengths++;
  }
  assert(changedLengths/64>.6,op+' '+effect+' moves too rigidly');
 }
});

test('Scene imports normalize color roles and settings migrate only known defaults',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/scene-v0.1.0.json',import.meta.url)));
 const normalized=validateScene(old.scene);assert.deepEqual({...normalized,layers:normalized.layers.map(({colorRole,...l})=>l)},old.scene);assert(normalized.layers.every(l=>l.colorRole==='body'));
 const s=sanitizeSettings(old.settings);for(const [k,v]of Object.entries(old.settings))assert.equal(s[k],v);
 const migrated=sanitizeSettings(old.settings,{migrate:true});assert.equal(migrated.palette,defaults.palette);assert.equal(migrated.settingsVersion,3);assert.equal(migrated.mode,'shuffle');
 const custom=sanitizeSettings({...old.settings,markSize:1.4,palette:'gbdmg',brightness:.2},{migrate:true});assert.equal(custom.markSize,1.4);assert.equal(custom.palette,'gbdmg');assert.equal(custom.brightness,.2);
 assert(PALETTES.some(p=>p.id==='standard'));assert(!PALETTES.some(p=>p.id==='vga'));
});

test('Camera framing stays bounded and keeps every authored world visible across aspect ratios',()=>{
 for(const scene of PRESETS)for(const aspect of [16/9,4/3,9/16]){
  const matrix=cameraMatrix(7,scene,aspect);assert([...matrix].every(Number.isFinite));let visible=0;
  for(const l of scene.layers)for(let i=0;i<64;i++){
   const p=sampleLayer(l,(.5+i*.754877666)%1,(.5+i*.569840296)%1,7,{level:.5,bass:.6,mid:.4,treble:.3,onset:.2,trend:.5}),c=project(p,matrix);
   if(c[3]>.08&&Math.abs(c[0])<c[3]&&Math.abs(c[1])<c[3])visible++;
  }
  assert(visible/(scene.layers.length*64)>.15,scene.id+' loses its formation at '+aspect);
 }
});

test('Curated palettes have distinct color paths and bounded, unique finite artwork colors',()=>{
 assert.equal(VISUAL_PALETTES.length,25);
 const signatures=[];
 for(const palette of VISUAL_PALETTES){
  const finite=getPaletteBundle(palette.id,32);assert(finite.palette.length<=32);assert.equal(new Set(finite.palette.map(c=>c.join(','))).size,finite.palette.length);
  const signature=[];
  for(let i=0;i<48;i++){
   const h=i/48*6,x=220*(1-Math.abs(h%2-1)),rgb=h<1?[220,x,0]:h<2?[x,220,0]:h<3?[0,220,x]:h<4?[0,x,220]:h<5?[x,0,220]:[220,0,x];
   const c=quantizeColor(palette.id,32,...rgb);assert(finite.palette.some(p=>p.every((v,j)=>v===c[j])));signature.push(c);
  }
  signatures.push({id:palette.id,colors:signature});
 }
 for(let i=0;i<signatures.length;i++)for(let j=0;j<i;j++){
  const a=signatures[i],b=signatures[j],difference=a.colors.reduce((sum,c,k)=>sum+Math.hypot(...c.map((n,m)=>n-b.colors[k][m])),0)/a.colors.length;
  assert(difference>22,a.id+' too close to '+b.id+': '+difference);
 }
});
