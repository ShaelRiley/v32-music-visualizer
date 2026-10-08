import {clamp} from '../engine/random.mjs';
export const SILENCE=Object.freeze({level:0,bass:0,mid:0,treble:0,onset:0,flux:0,trend:0,stereo:0,bpm:0,confidence:0,timestamp:0});
export class FeatureExtractor {
 constructor(sampleRate=48000,fftSize=2048){this.sampleRate=sampleRate;this.fftSize=fftSize;this.previous=new Float32Array(fftSize/2);this.smoothed={...SILENCE};this.reference=[.012,.007,.004];this.peak=.03;this.fluxMean=.001;this.lastBeat=0;this.intervals=[];this.trend=0;}
 process(left,right,leftWave,rightWave,timestamp){
  let lr=0,rr=0;for(let i=0;i<leftWave.length;i++){lr+=leftWave[i]**2;rr+=(rightWave?.[i]??leftWave[i])**2;}lr=Math.sqrt(lr/leftWave.length);rr=Math.sqrt(rr/leftWave.length);
  const rms=Math.sqrt((lr*lr+rr*rr)/2),gate=clamp((rms-.00045)/.006),dt=this.lastTimestamp?clamp((timestamp-this.lastTimestamp)/1000,.005,.1):1/30;this.lastTimestamp=timestamp;
  this.peak=Math.max(.018,rms,this.peak*Math.exp(-dt/3));
  const bands=[0,0,0],counts=[0,0,0];let flux=0;
  for(let i=1;i<left.length;i++){
   const hz=i*this.sampleRate/this.fftSize;if(hz<30||hz>12000)continue;const l=Number.isFinite(left[i])?left[i]:-140,r=Number.isFinite(right?.[i])?right[i]:l;const a=(10**(l/20)+10**(r/20))*.5;
   const band=hz<180?0:hz<2200?1:2;bands[band]+=a;counts[band]++;flux+=Math.max(0,a-this.previous[i]);this.previous[i]=a;
  }
  flux/=left.length;this.fluxMean+=(flux-this.fluxMean)*(1-Math.exp(-dt/1.2));
  const active=gate>.12&&flux>Math.max(.00008,this.fluxMean*1.55)&&timestamp-this.lastBeat>250;
  let onset=0;if(active){onset=clamp(flux/Math.max(.00015,this.fluxMean*3));if(this.lastBeat){const interval=timestamp-this.lastBeat;if(interval>=280&&interval<=1100){this.intervals.push(interval);if(this.intervals.length>24)this.intervals.shift();}}this.lastBeat=timestamp;}
  const level=clamp(rms/this.peak)*gate;this.trend+=(level-this.trend)*(1-Math.exp(-dt/5));
  const raw={level,flux:clamp(flux/Math.max(.0002,this.fluxMean*3))*gate,onset,trend:this.trend,stereo:clamp((rr-lr)/Math.max(.005,lr+rr),-1,1)};
  ['bass','mid','treble'].forEach((key,i)=>{const mean=bands[i]/Math.max(1,counts[i]);this.reference[i]=Math.max(i===0?.008:i===1?.003:.0015,mean,this.reference[i]*Math.exp(-dt/4));raw[key]=clamp(mean/this.reference[i])*gate;});
  for(const key of ['level','bass','mid','treble','onset','flux','stereo']){const old=this.smoothed[key],attack=key==='onset'?.015:.045,release=key==='onset'?.18:.35;this.smoothed[key]=old+(raw[key]-old)*(1-Math.exp(-dt/(raw[key]>old?attack:release)));}
  let bpm=0,confidence=0;if(this.intervals.length>=5){const sorted=[...this.intervals].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)],deviation=sorted.reduce((s,n)=>s+Math.abs(n-median),0)/sorted.length/median;bpm=60000/median;confidence=clamp(1-deviation*5)*Math.min(1,sorted.length/12);}
  return {...this.smoothed,trend:this.trend,bpm,confidence,timestamp};
 }
}
export function demoFeatures(t){const pulse=Math.exp(-(t%.5)*15);return {...SILENCE,level:.45+.12*Math.sin(t*.7),bass:.35+.4*pulse,mid:.4+.2*Math.sin(t*1.3),treble:.22+.25*Math.sin(t*2.1)**2,onset:pulse,flux:pulse*.5,trend:.45,stereo:Math.sin(t*.3)*.5,bpm:120,confidence:1,timestamp:Date.now()};}
