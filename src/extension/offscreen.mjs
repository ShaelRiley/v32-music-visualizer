import {AudioOwner} from '../audio/owner.mjs';
import {tabAudioConstraints} from '../audio/capture.mjs';
const send=m=>chrome.runtime.sendMessage(m).catch(()=>{});
const owner=new AudioOwner(features=>send({type:'features',features}),()=>send({type:'ended'}));let generation=0;
chrome.runtime.onMessage.addListener((m,sender,respond)=>{
 if(sender.id!==chrome.runtime.id||m.target!=='offscreen')return;
 if(m.type==='stop'){generation++;owner.stop().then(()=>respond({ok:true}));return true;}
 if(m.type==='start'){
  const ticket=++generation;
  (async()=>{await owner.stop();const stream=await navigator.mediaDevices.getUserMedia({audio:tabAudioConstraints(m.streamId),video:false});
   if(ticket!==generation){stream.getTracks().forEach(t=>t.stop());throw Error('Capture canceled');}
   if(!stream.getAudioTracks().length){stream.getTracks().forEach(t=>t.stop());throw Error('The source supplied no audio track');}
   await owner.attachStream(stream,true);return {ok:true};
  })().then(respond,async e=>{await owner.stop();respond({ok:false,error:e.message});});return true;
 }
});
window.addEventListener('pagehide',()=>owner.stop());
