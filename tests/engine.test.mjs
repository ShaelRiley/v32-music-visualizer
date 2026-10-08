import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {glyphs,formLookup,glyphAtlas,DESCRIPTORS} from '../src/engine/glyphs.mjs';
import {PALETTES,PALETTE_DEPTHS,getPaletteBundle,quantizeColor} from '../src/engine/palettes.mjs';
import {PRESETS,COVERAGE} from '../src/engine/catalog.mjs';
import {validateScene,generateDiscovery,fingerprint,qualityCheck} from '../src/engine/scenes.mjs';
import {OPERATORS,sampleLayer} from '../src/engine/operators.mjs';
import {MixedScheduler} from '../src/engine/scheduler.mjs';import {rng} from '../src/engine/random.mjs';
import {FeatureExtractor} from '../src/audio/features.mjs';
const require=createRequire(import.meta.url),upstream=require('../vendor/ansitube-core.cjs');
const digest=b=>createHash('sha256').update(b).digest('hex');
test('Canonical 32 masks, ordering, blank, source aspect and byte identity',()=>{
 const binary=readFileSync(new URL('../assets/video32.bin',import.meta.url));assert.equal(binary.length,512);assert.equal(glyphs.glyphCount,32);assert.equal(glyphs.width,8);assert.equal(glyphs.height,16);assert.equal(digest(binary),glyphs.sha256);
 assert.deepEqual(glyphs.selectedIndices,Array.from({length:32},(_,i)=>i));assert.deepEqual(glyphs.masks,upstream.VIDEO_GLYPH_MASKS.slice(0,32));assert.equal(glyphs.masks[0].reduce((a,b)=>a+b),0);
 const atlas=glyphAtlas();for(let g=0;g<32;g++)for(let y=0;y<16;y++)for(let x=0;x<8;x++)assert.equal(atlas[y*256+g*8+x],(glyphs.masks[g][y]&(128>>x))?255:0);
 const lut=formLookup();assert(lut.pixels.every(x=>x<32));assert(new Set(lut.pixels).size>=20);assert.equal(DESCRIPTORS[0].area,0);
});
test('Full palette registry, depth, grading and 5-bit lookup parity',()=>{
 const registry=JSON.parse(readFileSync(new URL('../vendor/palette-registry.json',import.meta.url)));assert.deepEqual(PALETTES,registry);assert.equal(PALETTES.length,55);assert.deepEqual(PALETTE_DEPTHS,upstream.PALETTE_DEPTHS);
 for(const p of PALETTES){for(const depth of [...PALETTE_DEPTHS,'truecolor']){
  const ours=getPaletteBundle(p.id,depth),theirs=upstream.getPaletteBundle(p.id,depth);assert.deepEqual(ours?.palette,theirs?.palette,p.id+':'+depth);if(ours)assert.deepEqual(ours.lookup,theirs.lookup);
  for(const c of [[0,0,0],[127,220,36],[244,44,188],[255,255,255]])assert.deepEqual(quantizeColor(p.id,depth,...c,{saturationBoost:.42,brightnessBoost:.17}),upstream.quantizeColor(p.id,depth,...c,{saturationBoost:.42,brightnessBoost:.17}));
 }}
});
test('Authored catalog has 256 distinct structural compositions in 32 families',()=>{
 assert.equal(PRESETS.length,256);assert.equal(new Set(PRESETS.map(s=>s.id)).size,256);assert.equal(new Set(PRESETS.map(s=>s.name)).size,256);assert.equal(new Set(PRESETS.map(s=>s.family)).size,32);assert.equal(new Set(PRESETS.map(fingerprint)).size,256);
 for(const p of PRESETS){assert.deepEqual(validateScene(p),p);assert(qualityCheck(p).valid,p.id);for(const t of [0,4,31,90])for(const l of p.layers)for(let i=0;i<32;i++){const a=sampleLayer(l,(i*.754877+.01)%1,(i*.56984+.01)%1,t,{bass:.8,mid:.4,treble:.5,onset:.9,trend:.6});assert([...a].every(x=>Number.isFinite(x)&&Math.abs(x)<12),p.id);}}
 assert.equal(COVERAGE.length,256);assert.equal(new Set(PRESETS.flatMap(s=>s.layers.map(l=>l.op))).size,OPERATORS.length);
});
test('1,000 reproducible Discovery seeds: graph variety and bounded evolving state',()=>{
 const report={seeds:1000,fallbacks:0,rejections:{},structuralDuplicates:0,layerCounts:{},operators:{},maxCoordinate:0,generationMs:[],examples:[]};const seen=new Set();
 for(let i=0;i<1000;i++){
  const start=performance.now(),g=generateDiscovery('qa-'+i),s=g.scene;report.generationMs.push(performance.now()-start);assert.deepEqual(generateDiscovery('qa-'+i).scene,s);assert(qualityCheck(s).valid);assert.deepEqual(validateScene(s),s);
  if(g.fallback)report.fallbacks++;for(const reason of g.attempts)report.rejections[reason]=(report.rejections[reason]||0)+1;const fp=fingerprint(s);if(seen.has(fp))report.structuralDuplicates++;seen.add(fp);
  report.layerCounts[s.layers.length]=(report.layerCounts[s.layers.length]||0)+1;
  for(const l of s.layers){report.operators[l.op]=(report.operators[l.op]||0)+1;for(const t of [0,10,60])for(let k=0;k<8;k++){const p=sampleLayer(l,(k*.754877+.03)%1,(k*.56984+.02)%1,t,{bass:1,mid:1,treble:1,onset:1,trend:1});assert([...p].every(Number.isFinite));report.maxCoordinate=Math.max(report.maxCoordinate,...[...p].map(Math.abs));}}
  if(i<32)report.examples.push(s);
 }
 const sorted=report.generationMs.sort((a,b)=>a-b);report.generationMedianMs=sorted[500];report.generationP95Ms=sorted[950];report.generationMaxMs=sorted[999];delete report.generationMs;
 assert.equal(report.fallbacks,0);assert.equal(report.structuralDuplicates,0);assert(report.maxCoordinate<12);assert.equal(Object.keys(report.operators).length,32);
 writeFileSync(new URL('../docs/discovery-report.json',import.meta.url),JSON.stringify(report,null,2));
});
test('Scene import rejects executable-looking IDs, oversized graphs and invalid numbers',()=>{
 const mutate=fn=>{const s=structuredClone(PRESETS[0]);fn(s);assert.throws(()=>validateScene(s));};
 mutate(s=>s.layers[0].op='eval');mutate(s=>s.layers[0].scale[0]=Infinity);mutate(s=>s.layers[0].scale[0]=NaN);mutate(s=>s.layers.push(...s.layers,...s.layers));mutate(s=>s.layers[0].domain=[0,0,2,2]);mutate(s=>s.budget=1e9);mutate(s=>s.schemaVersion=100);mutate(s=>s.generatorVersion='untrusted');
 const input=structuredClone(PRESETS[0]);input.script='alert(1)';assert.equal(validateScene(input).script,undefined);
});
test('Time-balanced mixed playback preserves complete library traversals and bounded streaks',()=>{
 const r=rng('scheduler-test'),s=new MixedScheduler(PRESETS.map(p=>p.id),r);let visited=new Set(),cycles=0,streak=0,prev=null,total=0,maxStreak=0;
 for(let i=0;i<3600;i++){const choice=s.choose('mixed',.5),duration=30+r()*30;s.account(duration);total+=duration;streak=choice.kind===prev?streak+1:1;prev=choice.kind;maxStreak=Math.max(maxStreak,streak);if(choice.kind==='library'){assert(!visited.has(choice.id));visited.add(choice.id);if(visited.size===256){cycles++;visited.clear();}}}
 const report={environment:'deterministic scheduler simulation',selections:3600,seconds:total,librarySeconds:s.elapsed.library,discoverySeconds:s.elapsed.discovery,authoredShare:s.snapshot().share,maxStreak,completeLibraryCycles:cycles};
 assert(Math.abs(report.authoredShare-.5)<.025);assert(maxStreak<=2);assert(cycles>=6);
 const before={...s.elapsed};s.account(500,{held:true});s.account(500,{manual:true});s.account(500,{visible:false});s.account(500,{paused:true});assert.deepEqual(s.elapsed,before);
 for(const mode of ['library','discovery'])for(let i=0;i<10;i++)assert.equal(s.choose(mode).kind,mode);
 writeFileSync(new URL('../docs/scheduler-report.json',import.meta.url),JSON.stringify(report,null,2));
});
test('Audio fixtures: silence, quiet noise, bass, transients, irregular rhythms and stereo changes',()=>{
 const ex=new FeatureExtractor(),freq=new Float32Array(1024).fill(-140),wave=new Float32Array(2048);let f;
 for(let i=0;i<60;i++)f=ex.process(freq,freq,wave,wave,i*33+1);assert.equal(f.level,0);assert.equal(f.bass,0);assert.equal(f.onset,0);assert.equal(f.confidence,0);
 for(let i=0;i<2048;i++)wave[i]=Math.sin(i)*.0002;for(let i=0;i<30;i++)f=ex.process(freq,freq,wave,wave,2001+i*33);assert(f.level<.005);assert(f.onset<.01);
 const left=new Float32Array(2048),right=new Float32Array(2048);for(let i=0;i<2048;i++){left[i]=Math.sin(i*2*Math.PI*100/48000)*.2;right[i]=left[i]*.2;}freq.fill(-110);freq[4]=-15;freq[5]=-12;for(let i=0;i<60;i++)f=ex.process(freq,freq,left,right,4001+i*33);assert(f.bass>.5);assert(f.stereo<-.5);assert(f.mid<.1);assert(f.treble<.1);
 const fixtures=['transient','sustained','irregular','quiet','silence','stereo'];for(const fixture of fixtures){const a=new FeatureExtractor();for(let i=0;i<120;i++){const on=fixture==='silence'?false:fixture==='transient'?i%15<2:fixture==='irregular'?[3,21,57,61,100].includes(i):true;const amplitude=fixture==='quiet'?.002:on?.2:0;for(let j=0;j<2048;j++)left[j]=Math.sin(j*.08)*amplitude;right.set(left);if(fixture==='stereo')right.fill(i<60?0:.2);freq.fill(on?-38:-140);f=a.process(freq,freq,left,right,i*33+1);for(const k of ['level','bass','mid','treble','onset','flux','trend'])assert(Number.isFinite(f[k])&&f[k]>=0&&f[k]<=1,k);}}
});
