import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SPACE_DATA} from '../assets/spaces/manifest.mjs';
import {VR_DATA} from '../assets/vr/manifest.mjs';
import {SPACE_PRESETS,decodeSpaceFabric} from '../src/engine/spaces.mjs';
import {VR_PRESETS} from '../src/engine/vr.mjs';
import {PRESETS} from '../src/engine/catalog.mjs';
import {LibraryShow} from '../src/engine/library-show.mjs';
import {cameraMatrix} from '../src/engine/math.mjs';
import {railPoint} from '../src/engine/space-motion.mjs';
import {validateScene,fingerprint} from '../src/engine/scenes.mjs';
import {rng} from '../src/engine/random.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');

test('256 polygon tours retain source proofs, valid surface classes and distinct closed camera rails',()=>{
 assert.equal(SPACE_DATA.sources.length,32);assert.equal(SPACE_PRESETS.length,256);assert.equal(new Set(SPACE_PRESETS.map(fingerprint)).size,256);
 const checked=new Set();
 for(const source of SPACE_DATA.sources)for(const input of source.inputs)if(!checked.has(input.path)){assert.equal(sha(readFileSync(new URL('../'+input.path,import.meta.url))),input.sha256);checked.add(input.path);}
 for(const v of SPACE_DATA.views){
  const bundle=readFileSync(new URL('../assets/spaces/data/'+v.file,import.meta.url)),bytes=bundle.subarray(v.offset,v.offset+v.bytes);assert.equal(sha(bytes),v.sha256);const data=decodeSpaceFabric(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  for(let i=0;i<data.length;i+=8){assert([data[i],data[i+1],data[i+2]].every(x=>Number.isFinite(x)&&Math.abs(x)<8));assert(Math.abs(Math.hypot(data[i+4],data[i+5],data[i+6])-1)<.002);assert([0,1,2,3,4].includes(data[i+7]));}
  assert.deepEqual(railPoint(v.path,0),railPoint(v.path,1));assert(railPoint(v.path,.1).some((x,j)=>Math.abs(x-v.path[0][j])>.01));
  for(const t of [0,7,23,55])assert([...cameraMatrix(t,SPACE_PRESETS.find(s=>s.space.view===v.id),16/9)].every(Number.isFinite));
 }
 assert.throws(()=>decodeSpaceFabric(new ArrayBuffer(12)));
 const invalid=structuredClone(SPACE_PRESETS[0]);invalid.space.view='https://example.org/executable';assert.throws(()=>validateScene(invalid));
});

test('256 spherical studies are distinct licensed source videos, with matched canonical forms and local assets',()=>{
 assert.equal(VR_PRESETS.length,256);assert.equal(new Set(VR_DATA.views.map(v=>v.videoID)).size,256);assert.equal(new Set(VR_PRESETS.map(fingerprint)).size,256);
 assert.equal(VR_DATA.license,'CC-BY-SA-4.0');
 for(const v of VR_DATA.views){assert(['cc-by','cc-by-sa','cc-cc0'].includes(v.originalLicense));assert(v.sourceURL.startsWith('https://'));assert.equal(v.sourceFrames.length,9);assert.equal(v.frames,9);assert.equal(v.glyphCounts.length,32);assert.equal(v.glyphCounts.reduce((a,b)=>a+b,0),128*64*9);assert.equal(sha(readFileSync(new URL('../assets/vr/data/'+v.file,import.meta.url)).subarray(v.offset,v.offset+v.bytes)),v.sha256);}
 assert(VR_DATA.glyphCounts.filter(n=>n>0).length>=28,'Image detail should use a broad subset of the actual alphabet');
 const invalid=structuredClone(VR_PRESETS[0]);invalid.video.view='not-bundled';assert.throws(()=>validateScene(invalid));invalid.video.view=VR_PRESETS[0].video.view;invalid.space=SPACE_PRESETS[0].space;assert.throws(()=>validateScene(invalid));
});

test('Default authored shuffle alternates regular and spatial scenes, traverses every bank and restores canceled selections',()=>{
 const all=[PRESETS,SPACE_PRESETS,VR_PRESETS],show=new LibraryShow(...all.map(bank=>bank.map(s=>s.id)),rng('three-banks'));
 let current=show.next('shuffle');assert.equal(show.bank(current),'regular');show.prime(current);
 const visited=new Set([current]),cycles={regular:new Set([current]),spaces:new Set(),video:new Set()},counts={regular:1,spaces:0,video:0},spatial=[];
 for(let i=0;i<1023;i++){
  const next=show.next('shuffle',current),bank=show.bank(next);assert.equal(bank==='regular',show.bank(current)!=='regular');
  if(cycles[bank].size===256)cycles[bank].clear();assert(!cycles[bank].has(next),'Repeated '+next+' before completing its bank');cycles[bank].add(next);visited.add(next);counts[bank]++;
  if(bank!=='regular')spatial.push(bank);current=next;
 }
 assert.equal(visited.size,768);assert.deepEqual(counts,{regular:512,spaces:256,video:256});
 for(let i=0;i<spatial.length;i+=2)assert.notEqual(spatial[i],spatial[i+1]);
 for(let i=0;i<2;i++){const canceled=show.next('shuffle',current);show.restore(canceled);assert.equal(show.next('shuffle',current),canceled);current=canceled;}
 for(const [mode,bank]of [['library','regular'],['spaces','spaces'],['video','video']])assert.equal(show.bank(show.next(mode,current)),bank);
});
