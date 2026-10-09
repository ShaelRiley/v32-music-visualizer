import test from 'node:test';import assert from 'node:assert/strict';
import {AudioOwner} from '../src/audio/owner.mjs';
import {tabAudioConstraints,prepareMusicStream} from '../src/audio/capture.mjs';
class Node {constructor(){this.connections=[];this.disconnected=false;}connect(...args){this.connections.push(args);}disconnect(){this.disconnected=true;}getFloatFrequencyData(a){a.fill(-140);}getFloatTimeDomainData(a){a.fill(0);}}
class Context {
 constructor(options){this.options=options;this.nodes=[];this.destination={};this.state='suspended';this.sampleRate=options?.sampleRate||48000;Context.created.push(this);}
 async resume(){this.state='running';}async close(){this.state='closed';}
 node(){const n=new Node();this.nodes.push(n);return n;}
 createGain(){return this.node();}createChannelSplitter(){return this.node();}createAnalyser(){return this.node();}createMediaStreamSource(){return this.node();}createMediaElementSource(){return this.node();}
 static created=[];
}
class Player{async play(){this.playing=true;}pause(){this.playing=false;}}
function stream(){const track={stops:0,listeners:[],format:{sampleRate:44100,channelCount:2,echoCancellation:true,autoGainControl:true,noiseSuppression:true},async applyConstraints(c){this.constraints=c;Object.assign(this.format,c);},getSettings(){return this.format;},getCapabilities(){return {echoCancellation:[false,true],autoGainControl:[false,true],noiseSuppression:[false,true],channelCount:{min:1,max:2}};},stop(){this.stops++;},addEventListener(_,fn){this.listeners.push(fn);}};return {track,getTracks:()=>[track],getAudioTracks:()=>[track]};}
test('20 capture cycles use one unity native player, no Web Audio monitor, and release every resource',async()=>{
 const previous=globalThis.AudioContext,oldAudio=globalThis.Audio;globalThis.AudioContext=Context;globalThis.Audio=Player;try{
  const owner=new AudioOwner(()=>{});for(let i=0;i<20;i++){const s=stream();await owner.attachStream(s,true);const ctx=owner.context,player=owner.monitorElement;assert.equal(owner.source.connections.filter(c=>c[0]===ctx.destination).length,0);assert.equal(player.srcObject,s);assert.equal(player.volume,1);assert.equal(player.muted,false);assert.equal(player.playing,true);assert.equal(ctx.options.latencyHint,'playback');assert.equal(ctx.sampleRate,44100);assert.deepEqual(s.track.constraints,{echoCancellation:false,noiseSuppression:false,autoGainControl:false});assert.equal(owner.analysisInput.channelCount,2);await owner.stop();assert.equal(player.playing,false);assert.equal(player.srcObject,null);assert.equal(ctx.state,'closed');assert.equal(s.track.stops,1);assert(ctx.nodes.every(n=>n.disconnected));assert.equal(owner.timer,null);assert.equal(owner.stream,null);await owner.stop();assert.equal(s.track.stops,1);}
  const s=stream();await owner.attachStream(s,false);assert.equal(owner.monitorElement,null);assert.equal(owner.source.connections.filter(c=>c[0]===owner.context.destination).length,0);await owner.stop();
 }finally{globalThis.AudioContext=previous;globalThis.Audio=oldAudio;}
});
test('Source termination cleans up and reports the ended source',async()=>{
 const previous=globalThis.AudioContext,oldAudio=globalThis.Audio;globalThis.AudioContext=Context;globalThis.Audio=Player;try{let ended=0;const owner=new AudioOwner(()=>{},()=>ended++),s=stream();await owner.attachStream(s);s.track.listeners[0]();await new Promise(r=>setTimeout(r,0));assert.equal(owner.context,null);assert.equal(owner.stream,null);assert.equal(ended,1);}finally{globalThis.AudioContext=previous;globalThis.Audio=oldAudio;}
});
test('Tab capture avoids mixed legacy/modern dictionaries and refuses active speech processing',async()=>{
 const c=tabAudioConstraints('source-id');assert.equal(c.mandatory.chromeMediaSource,'tab');assert.equal(c.mandatory.chromeMediaSourceId,'source-id');assert(!('echoCancellation' in c));assert(c.optional.every(item=>Object.values(item)[0]===false));
 await assert.rejects(()=>prepareMusicStream({getAudioTracks:()=>[]}),/no audio/);
 for(const key of ['echoCancellation','autoGainControl','noiseSuppression']){const s=stream();s.track.format[key]=true;s.track.applyConstraints=async()=>{};await assert.rejects(()=>prepareMusicStream(s),/speech processing/);}
});
test('Fixed unprocessed tracks require no reconfiguration and retain their original channel format',async()=>{
 for(const channelCount of [1,2]){const s=stream();s.track.getCapabilities=()=>({echoCancellation:[false],autoGainControl:[false],noiseSuppression:[false]});s.track.format={sampleRate:48000,channelCount};s.track.applyConstraints=async()=>{throw Error('Fixed stream cannot be reconfigured');};assert.deepEqual(await prepareMusicStream(s),{sampleRate:48000,channelCount});}
});
test('A native playback failure stops capture and restores ordinary source playback',async()=>{
 const previous=globalThis.AudioContext,oldAudio=globalThis.Audio;globalThis.AudioContext=Context;globalThis.Audio=class extends Player{async play(){throw Error('autoplay denied');}};
 try{const owner=new AudioOwner(()=>{}),s=stream();await assert.rejects(()=>owner.attachStream(s),/autoplay denied/);assert.equal(s.track.stops,1);assert.equal(owner.context,null);assert.equal(owner.monitorElement,null);assert.equal(owner.timer,null);}finally{globalThis.AudioContext=previous;globalThis.Audio=oldAudio;}
});
test('Failed local-file playback releases its graph and pauses its element',async()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=Context;try{let paused=0;const element={play:async()=>{throw Error('denied');},pause:()=>paused++};const owner=new AudioOwner(()=>{});await assert.rejects(()=>owner.attachElement(element),/denied/);assert.equal(owner.context,null);assert.equal(owner.timer,null);assert.equal(paused,1);}finally{globalThis.AudioContext=previous;}
});
