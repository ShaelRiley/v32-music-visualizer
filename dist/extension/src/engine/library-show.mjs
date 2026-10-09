import {shuffle} from './random.mjs';
// Alternate regular and spatial creations, shuffling both spatial banks and every scene queue.
export class LibraryShow {
 constructor(regular,spaces,video=[],random=Math.random){this.ids={regular:[...regular],spaces:[...spaces],video:[...video]};this.random=random;this.queues={regular:[],spaces:[],video:[]};this.banks=new Map(Object.entries(this.ids).flatMap(([bank,ids])=>ids.map(id=>[id,bank])));this.order=[];this.lastIDs={};}
 bank(id){return this.banks.get(id)||'regular';}
 prime(id){const bank=this.bank(id);this.queues[bank]=shuffle(this.ids[bank].filter(x=>x!==id),this.random);this.lastIDs[bank]=id;this.order=[];this.lastChoice=null;}
 next(mode,current){
  let bank=mode==='spaces'?'spaces':mode==='video'?'video':mode==='library'?'regular':null;
  let spatialSlot=false;
  if(!bank){
   if(current&&this.bank(current)==='regular'){
    if(!this.order.length)this.order=shuffle(['spaces','video'].filter(b=>this.ids[b].length),this.random);
    bank=this.order.shift();spatialSlot=Boolean(bank);
   }
   bank||='regular';
  }
  if(!this.queues[bank].length)this.queues[bank]=shuffle(this.ids[bank],this.random);
  const queue=this.queues[bank];if((queue[0]===current||queue[0]===this.lastIDs[bank])&&queue.length>1)[queue[0],queue[1]]=[queue[1],queue[0]];
  const id=queue.shift();this.lastChoice={id,bank,previous:this.lastIDs[bank],spatialSlot};this.lastIDs[bank]=id;return id;
 }
 restore(id){if(this.lastChoice?.id!==id)return;const {bank,previous,spatialSlot}=this.lastChoice;this.queues[bank].unshift(id);this.lastIDs[bank]=previous;if(spatialSlot)this.order.unshift(bank);this.lastChoice=null;}
}
