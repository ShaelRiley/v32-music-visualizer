import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {server} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
let browser;
const report={scope:'Synthetic stereo PCM through a real native media-element monitor and a separate analysis graph. No physical listening or Chrome tabCapture permission test.'};
try{
 browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 report.browser=await browser.version();const page=await browser.newPage();await page.goto('http://localhost:4173/space-credits.html');
 report.result=await page.evaluate(async()=>{
  const {AudioOwner}=await import('/src/audio/owner.mjs');
  const input=new AudioContext({sampleRate:48000}),out=input.createMediaStreamDestination(),merger=input.createChannelMerger(2),tones=[[35,1000,9000],[220,2700,13000]],oscillators=[];
  for(let ch=0;ch<2;ch++)for(const frequency of tones[ch]){const o=input.createOscillator(),g=input.createGain();o.frequency.value=frequency;g.gain.value=.12;o.connect(g).connect(merger,0,ch);o.start();oscillators.push(o);}
  merger.connect(out);await input.resume();let features=0;const owner=new AudioOwner(()=>features++);try{await owner.attachStream(out.stream,true);}catch(e){throw Error(JSON.stringify({step:'attach native player',error:e.name,message:e.message,constraint:e.constraint,caps:out.stream.getAudioTracks()[0].getCapabilities(),format:out.stream.getAudioTracks()[0].getSettings()}));}
  const monitor=owner.monitorElement,probe=new AudioContext({sampleRate:48000});await probe.resume();
  const channels=stream=>{const split=probe.createChannelSplitter(2);probe.createMediaStreamSource(stream).connect(split);return [0,1].map(ch=>{const a=probe.createAnalyser();a.fftSize=32768;a.smoothingTimeConstant=0;split.connect(a,ch);return a;});};
  const direct=channels(out.stream),relayed=channels(monitor.captureStream());await new Promise(resolve=>setTimeout(resolve,1400));
  const spectrum=a=>{const x=new Float32Array(a.frequencyBinCount);a.getFloatFrequencyData(x);return x;};
  const original=direct.map(spectrum),heard=relayed.map(spectrum),measurements=[];
  for(let ch=0;ch<2;ch++)for(const frequency of tones[ch]){const bin=Math.round(frequency*32768/probe.sampleRate),peak=x=>Math.max(...x.slice(bin-1,bin+2));measurements.push({channel:ch,frequency,referenceDB:peak(original[ch]),monitorDB:peak(heard[ch]),deltaDB:peak(heard[ch])-peak(original[ch]),otherChannelDB:peak(heard[1-ch])});}
  const format=out.stream.getAudioTracks()[0].getSettings(),result={measurements,features,volume:monitor.volume,muted:monitor.muted,playing:!monitor.paused,format,analysisSampleRate:owner.context.sampleRate};
  await owner.stop();result.playerReleased=monitor.srcObject===null&&monitor.paused;result.trackReleased=out.stream.getAudioTracks().every(track=>track.readyState==='ended');
  oscillators.forEach(o=>o.stop());await input.close();await probe.close();return result;
 });
 const r=report.result;assert(r.playing&&!r.muted&&r.volume===1);assert(r.features>15);assert(r.playerReleased&&r.trackReleased);
 for(const m of r.measurements){assert(Number.isFinite(m.monitorDB));assert(Math.abs(m.deltaDB)<.35,JSON.stringify(m));assert(m.monitorDB-m.otherChannelDB>35,'Stereo leakage: '+JSON.stringify(m));}
 report.pass=true;console.log(JSON.stringify(report));
}catch(error){report.pass=false;report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await writeFile('docs/audio-fidelity-report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.close();}
