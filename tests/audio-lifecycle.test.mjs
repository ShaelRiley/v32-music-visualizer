import test from 'node:test';import assert from 'node:assert/strict';
import {AudioOwner} from '../src/audio/owner.mjs';
class Node {constructor(){this.connections=[];this.disconnected=false;}connect(...args){this.connections.push(args);}disconnect(){this.disconnected=true;}getFloatFrequencyData(a){a.fill(-140);}getFloatTimeDomainData(a){a.fill(0);}}
class Context {
 constructor(){this.nodes=[];this.destination={};this.state='suspended';this.sampleRate=48000;Context.created.push(this);}
 async resume(){this.state='running';}async close(){this.state='closed';}
 node(){const n=new Node();this.nodes.push(n);return n;}
 createGain(){return this.node();}createChannelSplitter(){return this.node();}createAnalyser(){return this.node();}createMediaStreamSource(){return this.node();}createMediaElementSource(){return this.node();}
 static created=[];
}
function stream(){const track={stops:0,listeners:[],stop(){this.stops++;},addEventListener(_,fn){this.listeners.push(fn);}};return {track,getTracks:()=>[track]};}
test('20 capture start/stop cycles have one stereo monitor connection and release every resource',async()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=Context;try{
  const owner=new AudioOwner(()=>{});for(let i=0;i<20;i++){const s=stream();await owner.attachStream(s,true);const ctx=owner.context;assert.equal(owner.source.connections.filter(c=>c[0]===ctx.destination).length,1);assert.equal(owner.analysisInput.channelInterpretation,'speakers');assert.equal(owner.analysisInput.channelCount,2);await owner.stop();assert.equal(ctx.state,'closed');assert.equal(s.track.stops,1);assert(ctx.nodes.every(n=>n.disconnected));assert.equal(owner.timer,null);assert.equal(owner.stream,null);await owner.stop();assert.equal(s.track.stops,1);}
  const s=stream();await owner.attachStream(s,false);assert.equal(owner.source.connections.filter(c=>c[0]===owner.context.destination).length,0);await owner.stop();
 }finally{globalThis.AudioContext=previous;}
});
test('Source termination cleans up and reports the ended source',async()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=Context;try{let ended=0;const owner=new AudioOwner(()=>{},()=>ended++),s=stream();await owner.attachStream(s);s.track.listeners[0]();await new Promise(r=>setTimeout(r,0));assert.equal(owner.context,null);assert.equal(owner.stream,null);assert.equal(ended,1);}finally{globalThis.AudioContext=previous;}
});
test('Failed local-file playback releases its graph and pauses its element',async()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=Context;try{let paused=0;const element={play:async()=>{throw Error('denied');},pause:()=>paused++};const owner=new AudioOwner(()=>{});await assert.rejects(()=>owner.attachElement(element),/denied/);assert.equal(owner.context,null);assert.equal(owner.timer,null);assert.equal(paused,1);}finally{globalThis.AudioContext=previous;}
});
