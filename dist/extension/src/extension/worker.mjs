let operation=Promise.resolve();const viewers=new Set();
const serial=fn=>{operation=operation.catch(()=>{}).then(fn);return operation;};
const state=async()=> (await chrome.storage.session.get('capture')).capture||{status:'idle'};
const offscreen=async()=> (await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length>0;
async function publish(s){await chrome.storage.session.set({capture:s});for(const p of viewers){try{p.postMessage({type:'capture-state',state:s});}catch{viewers.delete(p);}}}
async function stop(){const {viewerId}=await state();if(await offscreen()){try{await chrome.runtime.sendMessage({target:'offscreen',type:'stop'});}finally{await chrome.offscreen.closeDocument();}}await publish({status:'idle',viewerId});await chrome.action.setBadgeText({text:''});}
async function openViewer(s){const old=await state();let tab;try{if(old.viewerId)tab=await chrome.tabs.get(old.viewerId);}catch{}if(tab){await chrome.tabs.update(tab.id,{active:true});return tab.id;}return (await chrome.tabs.create({url:chrome.runtime.getURL('visualizer.html')+(s?.error?'?captureError='+encodeURIComponent(s.error):'')})).id;}
chrome.action.onClicked.addListener(tab=>serial(async()=>{
 const old=await state();if(tab.url?.startsWith(chrome.runtime.getURL(''))){await openViewer();return;}
 if(old.status==='active'&&old.tabId===tab.id){await openViewer();return;}
 const viewerId=old.viewerId;await stop();
 try {
  if(!await offscreen())await chrome.offscreen.createDocument({url:'offscreen.html',reasons:['USER_MEDIA'],justification:'Analyze user-selected tab audio locally and keep its stereo playback audible.'});
  const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
  await publish({status:'starting',tabId:tab.id,title:tab.title||'Selected tab',viewerId});
  const reply=await chrome.runtime.sendMessage({target:'offscreen',type:'start',streamId});if(!reply?.ok)throw Error(reply?.error||'Capture could not start');
  await publish({status:'active',tabId:tab.id,title:tab.title||'Selected tab',viewerId});const id=await openViewer();await publish({...(await state()),viewerId:id});await chrome.action.setBadgeText({text:'ON'});await chrome.action.setBadgeBackgroundColor({color:'#22d3af'});
 }catch(e){await stop();await publish({status:'error',error:e.message,viewerId});const id=await openViewer({error:e.message});await publish({...(await state()),viewerId:id});}
}));
chrome.runtime.onConnect.addListener(p=>{if(p.name!=='v32-features')return;viewers.add(p);state().then(s=>p.postMessage({type:'capture-state',state:s}));p.onDisconnect.addListener(()=>viewers.delete(p));});
chrome.runtime.onMessage.addListener((m,sender,respond)=>{
 if(sender.id!==chrome.runtime.id)return;
 if(m.type==='features'&&sender.url===chrome.runtime.getURL('offscreen.html')){for(const p of viewers){try{p.postMessage(m);}catch{viewers.delete(p);}}return;}
 if(m.type==='ended'&&sender.url===chrome.runtime.getURL('offscreen.html')){serial(stop).catch(()=>{});return;}
 if(m.type==='stop-capture'){serial(stop).then(()=>respond({ok:true}),e=>respond({ok:false,error:e.message}));return true;}
 if(m.type==='get-capture'){state().then(respond);return true;}
 if(m.type==='viewer-ready'&&sender.tab){state().then(s=>publish({...s,viewerId:sender.tab.id})).then(()=>respond({ok:true}));return true;}
});
chrome.tabs.onRemoved.addListener(id=>serial(async()=>{const s=await state();if(s.tabId===id||s.viewerId===id){await stop();await publish({status:'idle',viewerId:s.viewerId===id?null:s.viewerId});}}));
chrome.runtime.onStartup.addListener(()=>serial(stop));
