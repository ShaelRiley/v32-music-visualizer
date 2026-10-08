import {shuffle,clamp} from './random.mjs';
export class MixedScheduler {
 constructor(ids,random=Math.random){this.ids=[...ids];this.random=random;this.queue=[];this.elapsed={library:0,discovery:0};this.lastKind=null;this.streak=0;this.currentKind='library';this.manual=false;}
 account(seconds,{held=false,manual=this.manual,visible=true,paused=false}={}) {if(visible&&!held&&!manual&&!paused&&Number.isFinite(seconds)&&seconds>0)this.elapsed[this.currentKind]+=seconds;}
 prime(id){this.queue=shuffle(this.ids.filter(x=>x!==id),this.random);this.currentKind='library';}
 choose(mode='mixed',share=.5){
  share=clamp(share);let kind;
  if(mode==='library'||share===1)kind='library';else if(mode==='discovery'||share===0)kind='discovery';
  else {
   const total=this.elapsed.library+this.elapsed.discovery,deficit=share*total-this.elapsed.library;
   const chance=clamp(share+deficit/45,.05,.95);kind=this.random()<chance?'library':'discovery';
   if(this.streak>=2&&kind===this.lastKind&&share>=.15&&share<=.85)kind=kind==='library'?'discovery':'library';
  }
  this.streak=kind===this.lastKind?this.streak+1:1;this.lastKind=kind;this.currentKind=kind;this.manual=false;
  if(kind==='discovery')return {kind};
  if(!this.queue.length)this.queue=shuffle(this.ids,this.random);
  return {kind,id:this.queue.shift()};
 }
 snapshot(){return {elapsed:{...this.elapsed},libraryRemaining:this.queue.length,share:this.elapsed.library/Math.max(1,this.elapsed.library+this.elapsed.discovery)};}
}
