import {FeatureExtractor} from './features.mjs';
// One source, one stereo playback connection. Analysis is a separate branch.
export class AudioOwner {
 constructor(onFeatures,onEnd=()=>{}){this.onFeatures=onFeatures;this.onEnd=onEnd;this.generation=0;}
 async attachStream(stream,monitor=true){await this.stop();const token=++this.generation;this.stream=stream;
  try{this.context=new AudioContext();await this.context.resume();if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}this.source=this.context.createMediaStreamSource(stream);this.connect(monitor);stream.getTracks().forEach(track=>track.addEventListener('ended',()=>{if(token===this.generation){this.stop().then(()=>this.onEnd('Source ended'));}},{once:true}));}
  catch(e){await this.stop();throw e;}
 }
 async attachElement(element){await this.stop();const token=++this.generation;this.element=element;try{this.context=new AudioContext();await this.context.resume();if(token!==this.generation)return;this.source=this.context.createMediaElementSource(element);this.connect(true);await element.play();}catch(e){await this.stop();throw e;}}
 connect(monitor){const ctx=this.context;this.analysisInput=ctx.createGain();this.analysisInput.channelCount=2;this.analysisInput.channelCountMode='explicit';this.analysisInput.channelInterpretation='speakers';this.splitter=ctx.createChannelSplitter(2);this.source.connect(this.analysisInput);this.analysisInput.connect(this.splitter);if(monitor)this.source.connect(ctx.destination);
  this.analysers=[ctx.createAnalyser(),ctx.createAnalyser()];this.analysers.forEach((a,i)=>{a.fftSize=2048;a.smoothingTimeConstant=.25;this.splitter.connect(a,i);});
  const freq=this.analysers.map(()=>new Float32Array(1024)),wave=this.analysers.map(()=>new Float32Array(2048)),extractor=new FeatureExtractor(ctx.sampleRate);
  this.timer=setInterval(()=>{this.analysers.forEach((a,i)=>{a.getFloatFrequencyData(freq[i]);a.getFloatTimeDomainData(wave[i]);});this.onFeatures(extractor.process(freq[0],freq[1],wave[0],wave[1],Date.now()));},1000/30);
 }
 async stop(){++this.generation;clearInterval(this.timer);this.timer=null;this.source?.disconnect();this.analysisInput?.disconnect();this.splitter?.disconnect();this.analysers?.forEach(a=>a.disconnect());const stream=this.stream;this.stream=null;stream?.getTracks().forEach(t=>t.stop());this.element?.pause();this.element=null;const ctx=this.context;this.context=null;this.source=null;this.analysisInput=null;this.splitter=null;this.analysers=null;if(ctx&&ctx.state!=='closed')await ctx.close();}
}
