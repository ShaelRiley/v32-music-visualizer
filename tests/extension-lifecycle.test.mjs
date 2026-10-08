import test from 'node:test';
import assert from 'node:assert/strict';
// This exercises routing and lifecycle against an API mock. It is not a capture test.
const event=()=>({listeners:[],addListener(fn){this.listeners.push(fn);},async emit(...args){await Promise.all(this.listeners.map(fn=>fn(...args)));}});
test('MV3 routing preserves the selected source, reuses its viewer and closes offscreen ownership',async()=>{
 const previous=globalThis.chrome,state={capture:{status:'idle'}},tabs=new Map(),sources=[],messages=[];
 let created=0,closed=0,hasOffscreen=false,denied=false;
 const url=path=>'chrome-extension://video32/'+path;
 globalThis.chrome={
  storage:{session:{get:async()=>({...state}),set:async values=>Object.assign(state,values)}},
  action:{onClicked:event(),setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},
  offscreen:{createDocument:async()=>{assert.equal(hasOffscreen,false);hasOffscreen=true;},closeDocument:async()=>{hasOffscreen=false;closed++;}},
  tabCapture:{getMediaStreamId:async options=>{sources.push(options.targetTabId);if(denied)throw Error('Capture permission denied');return 'source-'+options.targetTabId;}},
  tabs:{onRemoved:event(),get:async id=>{if(!tabs.has(id))throw Error('Tab closed');return tabs.get(id);},update:async id=>tabs.get(id),create:async options=>{const t={id:100+(created++),url:options.url};tabs.set(t.id,t);return t;}},
  runtime:{id:'video32',getURL:url,onConnect:event(),onMessage:event(),onStartup:event(),getContexts:async()=>hasOffscreen?[{}]:[],sendMessage:async m=>{messages.push(m);return {ok:true};}}
 };
 const c=globalThis.chrome;
 const request=m=>new Promise(resolve=>{for(const listener of c.runtime.onMessage.listeners)listener(m,{id:c.runtime.id},resolve);});
 try{
  await import('../src/extension/worker.mjs');
  await c.action.onClicked.emit({id:7,title:'Music source',url:'https://audio.example/'});
  assert.equal(state.capture.tabId,7);assert.equal(state.capture.status,'active');assert.equal(created,1);
  const viewer=state.capture.viewerId;assert.equal(tabs.get(viewer).url,url('visualizer.html'));
  await c.action.onClicked.emit({id:viewer,url:url('visualizer.html')});assert.deepEqual(sources,[7]);
  await request({type:'stop-capture'});assert.equal(state.capture.status,'idle');assert.equal(state.capture.viewerId,viewer);assert.equal(hasOffscreen,false);
  await c.action.onClicked.emit({id:8,title:'Second source',url:'https://audio.example/2'});
  assert.equal(state.capture.tabId,8);assert.equal(created,1);assert.equal(state.capture.viewerId,viewer);
  await c.tabs.onRemoved.emit(8);assert.equal(state.capture.status,'idle');assert.equal(hasOffscreen,false);
  denied=true;await c.action.onClicked.emit({id:9,url:'https://audio.example/3'});
  assert.equal(state.capture.status,'error');assert.match(state.capture.error,/permission denied/);assert.equal(hasOffscreen,false);assert.equal(created,1);
  denied=false;await c.action.onClicked.emit({id:7,url:'https://audio.example/'});tabs.delete(viewer);await c.tabs.onRemoved.emit(viewer);
  assert.equal(state.capture.status,'idle');assert.equal(state.capture.viewerId,null);assert.equal(hasOffscreen,false);
  assert.equal(closed,4);assert.equal(messages.filter(m=>m.type==='start').length,3);assert(sources.every(id=>id<100));
 }finally{globalThis.chrome=previous;}
});
