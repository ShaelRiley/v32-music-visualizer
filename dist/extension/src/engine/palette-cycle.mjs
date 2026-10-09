import {shuffle} from './random.mjs';
export class PaletteCycle {
 constructor(ids,random=Math.random){this.ids=[...ids];this.random=random;this.queue=[];}
 next(current){
  if(!this.queue.length)this.queue=shuffle(this.ids,this.random);
  if(this.queue[0]===current){const other=this.queue.findIndex(id=>id!==current);if(other<0){this.queue=[];return this.next(current);} [this.queue[0],this.queue[other]]=[this.queue[other],this.queue[0]];}
  return this.queue.shift();
 }
}
