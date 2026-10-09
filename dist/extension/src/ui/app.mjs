import {GlyphRenderer} from '../engine/renderer.mjs';
import {PRESETS} from '../engine/catalog.mjs';
import {SPACE_PRESETS,SPACE_SOURCES,SPACE_VIEWS} from '../engine/spaces.mjs';
import {VR_PRESETS,VR_VIEWS} from '../engine/vr.mjs';
import {LibraryShow} from '../engine/library-show.mjs';
const ALL_PRESETS=[...PRESETS,...SPACE_PRESETS,...VR_PRESETS];
import {PALETTES,PALETTE_DEPTHS,HARDWARE_PRESETS,DEFAULT_PALETTE} from '../engine/palette-library.mjs';
import {defaults,sanitizeSettings} from './settings.mjs';
import {bindFullscreenIdle} from './fullscreen-idle.mjs';
import {generateDiscovery,validateScene,fingerprint} from '../engine/scenes.mjs';
import {MixedScheduler} from '../engine/scheduler.mjs';
import {PaletteCycle} from '../engine/palette-cycle.mjs';
import {freshSeed,clamp} from '../engine/random.mjs';
import {SILENCE,demoFeatures} from '../audio/features.mjs';
import {AudioOwner} from '../audio/owner.mjs';
const $=id=>document.getElementById(id),ext=Boolean(globalThis.chrome?.runtime?.id);
const cleanupImmersion=bindFullscreenIdle(document);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
let settings=sanitizeSettings(read('v32-settings',{}),{migrate:true,restrained:matchMedia('(prefers-reduced-motion: reduce)').matches}),saved=read('v32-saved',[]).slice(0,100).flatMap(x=>{try{return [{scene:validateScene(x.scene),settings:sanitizeSettings(x.settings)}];}catch{return [];}}),favorites=new Set(read('v32-favorites',[]).filter(id=>ALL_PRESETS.some(p=>p.id===id)||saved.some(s=>s.scene.id===id)));
const scheduler=new MixedScheduler(PRESETS.map(s=>s.id)),libraryShow=new LibraryShow(PRESETS.map(s=>s.id),SPACE_PRESETS.map(s=>s.id),VR_PRESETS.map(s=>s.id)),recent=[];let history=read('v32-history',[]).slice(-40).flatMap(x=>{try{return [validateScene(x)];}catch{return [];}}),historyIndex=history.length-1;
const paletteCycle=new PaletteCycle(PALETTES.filter(p=>p.available).map(p=>p.id));
let renderer,current,sceneTime=0,clock=0,source='demo',features={...SILENCE},paused=false,held=false,nextPrepared=null,nextPreparedOrigin=null,manual=false,autoScale=1,budget=10000,objectURL=null,localToken=0;
const owner=new AudioOwner(f=>{features=f;},reason=>{source='idle';features={...SILENCE};showSource(reason);});
const notify=text=>{clearTimeout(notify.timer);$('toast').textContent=text;$('toast').hidden=false;notify.timer=setTimeout(()=>$('toast').hidden=true,4200);};
function persist(){try{localStorage.setItem('v32-settings',JSON.stringify(settings));localStorage.setItem('v32-favorites',JSON.stringify([...favorites]));localStorage.setItem('v32-saved',JSON.stringify(saved));localStorage.setItem('v32-history',JSON.stringify(history));}catch{notify('Local storage is full; export scenes to retain them.');}}
function showSource(name){$('sourceLabel').textContent=name.toUpperCase();$('sourceDot').classList.toggle('live',source==='tab'||source==='file'||source==='share');$('stopAudio').disabled=source==='idle';}
async function stopAudio(){localToken++;if(ext)await chrome.runtime.sendMessage({type:'stop-capture'});await owner.stop();if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}$('audio').removeAttribute('src');$('audio').hidden=true;source='idle';features={...SILENCE};showSource('Audio stopped');}
async function demo(){await stopAudio();source='demo';showSource('Demo · simulated features');}
function paletteOptions(){if($('palette').options.length)return;$('palette').replaceChildren();for(const p of PALETTES){let group=[...$('palette').children].find(g=>g.label===p.group);if(!group){group=document.createElement('optgroup');group.label=p.group;$('palette').append(group);}const option=new Option(p.name+(p.available?'':' · unavailable'),p.id);option.disabled=!p.available;group.append(option);}}
function sync(){paletteOptions();$('balanceControl').hidden=settings.mode!=='mixed';document.querySelectorAll('[data-setting]').forEach(e=>{const v=settings[e.dataset.setting];if(e.type==='checkbox')e.checked=v;else e.value=String(v);});document.querySelectorAll('[data-output]').forEach(e=>{const k=e.dataset.output;e.value=k==='balance'?Math.round(settings[k]*100)+'%':k==='duration'?Math.round(settings[k])+' s':Number(settings[k]).toFixed(2);});$('presetCount').textContent=String(ALL_PRESETS.length);const palette=PALETTES.find(p=>p.id===settings.palette);$('paletteNote').textContent=!renderer?.paletteReady?'Preparing the selected palette; the previous frame is retained.':(palette.description||'Distinctive classic palette and treatment. Native Glyph is unavailable for these masks.')+(settings.depth==='truecolor'?' True Color; finite quantization is bypassed.':' Up to '+settings.depth+' exact artwork colors, plus stage black when absent.');const colors=palette.stops||renderer?.palette||[];$('palettePreview').replaceChildren(...colors.slice(0,12).map(c=>{const mark=document.createElement('span');mark.style.backgroundColor=`rgb(${c.join(',')})`;return mark;}));}
function cancelPrepared(){if(nextPrepared?.kind==='library'){if(nextPreparedOrigin==='show')libraryShow.restore(nextPrepared.id);else scheduler.queue.unshift(nextPrepared.id);}nextPrepared=null;nextPreparedOrigin=null;}
function display(s,isManual=false,remember=true){cancelPrepared();if(current&&!isManual&&settings.paletteCycle){settings.palette=paletteCycle.next(settings.palette);renderer.setPalette(settings);sync();}current=validateScene(s);renderer.setScene(current);clock=current.initialState.clock;sceneTime=0;scheduler.currentKind=current.kind;manual=isManual;scheduler.manual=isManual;
 if(remember){history=history.slice(0,historyIndex+1);history.push(current);if(history.length>40)history.shift();historyIndex=history.length-1;}
 $('sceneName').textContent=current.name;$('family').textContent=current.family.toUpperCase();$('sceneKind').textContent=current.video?'VR VIDEO':current.space?'POLYGON SPACES':current.kind==='discovery'?'DISCOVERY':'LIBRARY';const credit=current.space?SPACE_SOURCES.get(SPACE_VIEWS.get(current.space.view).source):current.video?{credit:VR_VIEWS.get(current.video.view).author,license:'CC BY-SA 4.0'}:null;$('spaceCredit').hidden=!credit;$('spaceCredit').textContent=credit?credit.credit+' · '+credit.license:'';$('sceneDescription').textContent=current.description;$('favorite').textContent=favorites.has(current.id)?'★':'☆';$('saveDiscovery').disabled=current.kind!=='discovery';persist();}
function prepared(){if(['shuffle','library','spaces','video'].includes(settings.mode)){nextPreparedOrigin='show';const id=libraryShow.next(settings.mode,current?.id),s=ALL_PRESETS.find(p=>p.id===id);renderer.prefetchSpace(s).catch(e=>notify(e.message));return s;}nextPreparedOrigin='mixed';const selection=scheduler.choose(settings.mode,settings.balance);if(selection.kind==='library')return PRESETS.find(s=>s.id===selection.id);const g=generateDiscovery(freshSeed(),new Set(recent));recent.push(g.fingerprint);if(recent.length>64)recent.shift();if(g.fallback)notify('Discovery validation retained an identified authored fallback.');return g.scene;}
function next(isManual=true){const s=nextPrepared||prepared();nextPrepared=null;nextPreparedOrigin=null;display(s,isManual);}
function nextManual(){if(historyIndex<history.length-1){historyIndex++;display(history[historyIndex],true,false);}else next(true);}
function previous(){if(historyIndex>0){historyIndex--;display(history[historyIndex],true,false);}else notify('You are at the start of recent history.');}
function saveCurrent(){if(current.kind!=='discovery'){notify('This is an authored preset; use the star to favorite it.');return;}if(saved.some(s=>s.scene.id===current.id)){notify('This Discovery is already saved.');return;}saved.push({scene:structuredClone(current),settings:{...settings}});if(saved.length>100)saved.shift();persist();renderSaved();notify('Discovery saved with its world, mappings and initial state.');}
function renderSaved(){$('saved').replaceChildren(...saved.map(item=>{const b=document.createElement('button');b.textContent=item.scene.name;b.onclick=()=>{settings=sanitizeSettings(item.settings);sync();renderer.setPalette(settings);display(item.scene,true);};return b;}));}
let favoritesOnly=false;
function renderCatalog(){const query=$('search').value.toLowerCase(),family=$('familyFilter').value,bank=$('bankFilter').value;const visible=ALL_PRESETS.filter(p=>(!bank||(bank==='spaces'?Boolean(p.space):bank==='video'?Boolean(p.video):!p.space&&!p.video))).filter(p=>(!family||p.family===family)&&(!favoritesOnly||favorites.has(p.id))&&(p.name+' '+p.description+' '+p.audioBehavior+' '+p.family).toLowerCase().includes(query));
 $('catalogGrid').replaceChildren(...visible.map(p=>{const b=document.createElement('button'),tag=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('p');tag.className='tag';tag.textContent=p.family+' / '+p.id;title.textContent=p.name;desc.textContent=p.description;b.append(tag,title,desc);b.title=p.distinction+' '+p.audioBehavior;b.onclick=()=>{display(p,true);$('catalog').close();};return b;}));
}
function exportScene(){const data={format:'VIDEO32-SCENE',schemaVersion:1,scene:current,settings};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=current.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
let port,reconnect;
function connectExtension(){if(!ext)return;clearTimeout(reconnect);port=chrome.runtime.connect({name:'v32-features'});port.onMessage.addListener(m=>{if(m.type==='features'&&source==='tab')features=m.features;if(m.type==='capture-state'){
  if(m.state.status==='active'){owner.stop();source='tab';showSource('Tab · '+(m.state.title||'selected source'));}
  else if(m.state.status==='error'){notify(m.state.error);if(source==='tab'){source='idle';features={...SILENCE};showSource('Capture error');}}
  else if(source==='tab'){source='idle';features={...SILENCE};showSource('Tab capture ended');}
 }});port.onDisconnect.addListener(()=>{reconnect=setTimeout(connectExtension,800);});chrome.runtime.sendMessage({type:'viewer-ready'}).catch(()=>{});}
function bindAudioEnd(a){a.addEventListener('ended',()=>{features={...SILENCE};showSource('File ended · Play to restart');});}
function bind(){
 paletteOptions();
 [...PALETTE_DEPTHS,'truecolor'].forEach(n=>$('depth').add(new Option(n==='truecolor'?'True Color':n+' colors',String(n))));
 [...new Set(ALL_PRESETS.map(p=>p.family))].forEach(f=>$('familyFilter').add(new Option(f,f)));
 document.querySelectorAll('[data-setting]').forEach(e=>e.addEventListener('input',()=>{const k=e.dataset.setting;settings[k]=e.type==='checkbox'?e.checked:e.type==='range'?Number(e.value):k==='depth'&&e.value!=='truecolor'?Number(e.value):e.value;
  if(k==='palette'&&HARDWARE_PRESETS[settings.palette]){const p=HARDWARE_PRESETS[settings.palette];settings.brightness=p.brightnessBoost;settings.boost=p.saturationBoost;settings.blackFloor=p.blackThreshold;}
  if(['palette','depth'].includes(k))renderer.setPalette(settings);if(['mode','balance'].includes(k))cancelPrepared();sync();persist();}));
 const actions={controls:()=>{$('inspector').hidden=!$('inspector').hidden;},closeControls:()=>{$('inspector').hidden=true;},demo,openFile:()=>$('file').click(),next:nextManual,previous,pause:()=>{paused=!paused;lastRender=performance.now();$('pause').textContent=paused?'Resume':'Pause';$('pause').classList.toggle('active',paused);},hold:()=>{held=!held;$('hold').classList.toggle('active',held);},browse:()=>{renderCatalog();$('catalog').showModal();},closeCatalog:()=>$('catalog').close(),fresh:()=>{const s=generateDiscovery(freshSeed(),new Set(recent));recent.push(s.fingerprint);if(recent.length>64)recent.shift();display(s.scene,true);},favorite:()=>{favorites.has(current.id)?favorites.delete(current.id):favorites.add(current.id);if(current.kind==='discovery')saveCurrent();$('favorite').textContent=favorites.has(current.id)?'★':'☆';persist();},saveDiscovery:saveCurrent,export:exportScene,import:()=>$('importFile').click(),reset:()=>{Object.assign(settings,{...Object.fromEntries(['markSize','density','sceneScale','distance','camera','yaw','pitch'].map(k=>[k,defaults[k]]))});sync();persist();},fullscreen:async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){notify(e.message);}},hide:()=>{document.body.classList.toggle('clean');$('inspector').hidden=true;$('reveal').hidden=!document.body.classList.contains('clean');},reveal:()=>{document.body.classList.remove('clean');$('reveal').hidden=true;},stopAudio, favoritesOnly:()=>{favoritesOnly=!favoritesOnly;$('favoritesOnly').classList.toggle('active',favoritesOnly);renderCatalog();},shareAudio:async()=>{
  if(!navigator.mediaDevices?.getDisplayMedia){notify('This browser does not support sharing audio. Use extension tab capture or a local audio file.');return;}
  try{await stopAudio();const token=++localToken;const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:{suppressLocalAudioPlayback:true},selfBrowserSurface:'exclude',systemAudio:'include'});
   if(token!==localToken){stream.getTracks().forEach(t=>t.stop());return;}
   if(!stream.getAudioTracks().length){stream.getTracks().forEach(t=>t.stop());throw Error('No audio track was shared. Select a browser tab and enable its audio checkbox, or use a local file.');}
   const browser=stream.getVideoTracks()[0]?.getSettings().displaySurface==='browser';stream.getVideoTracks().forEach(t=>t.enabled=false);await owner.attachStream(stream,browser);source='share';showSource('Shared '+(browser?'tab':'screen/window')+' audio');notify(browser?'Tab audio is played once through this page.':'Screen/window audio is analyzed without replaying system sound.');
  }catch(e){notify(e.name==='NotAllowedError'?'Audio sharing was canceled or denied.':e.message);}
 }};
 for(const [id,fn]of Object.entries(actions))$(id).onclick=()=>Promise.resolve(fn()).catch(e=>notify(e.message));
 $('search').oninput=renderCatalog;$('familyFilter').onchange=renderCatalog;$('bankFilter').onchange=renderCatalog;
 $('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;$('file').value='';try{await stopAudio();const a=$('audio').cloneNode(false);$('audio').replaceWith(a);bindAudioEnd(a);objectURL=URL.createObjectURL(f);a.src=objectURL;a.hidden=false;await owner.attachElement(a);source='file';showSource('File · '+f.name);}catch(e){notify(e.message);}};
 bindAudioEnd($('audio'));
 $('importFile').onchange=async()=>{const f=$('importFile').files[0];if(!f)return;$('importFile').value='';try{if(f.size>512000)throw Error('Scene files must be smaller than 512 KB');const data=JSON.parse(await f.text());if(data.format!=='VIDEO32-SCENE'||data.schemaVersion!==1)throw Error('Unsupported scene export');const s=validateScene(data.scene);settings=sanitizeSettings(data.settings);sync();renderer.setPalette(settings);display(s,true);notify('Scene imported; audio source remains under your control.');}catch(e){notify(e.message);}};
 document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('catalog').open)return;const key=e.key.toLowerCase(),map={'arrowright':'next','arrowleft':'previous',' ':'pause','h':'hold','f':'fullscreen','s':'favorite','tab':'hide'};if(map[key]){e.preventDefault();actions[map[key]]();}});
 let drag=null;$('art').addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,settings.yaw,settings.pitch];$('art').setPointerCapture(e.pointerId);});$('art').addEventListener('pointermove',e=>{if(!drag)return;settings.yaw=drag[2]+(e.clientX-drag[0])*.005;settings.pitch=clamp(drag[3]+(e.clientY-drag[1])*.006,-3,3);});$('art').addEventListener('pointerup',()=>{drag=null;persist();});$('art').addEventListener('wheel',e=>{settings.distance=clamp(settings.distance+e.deltaY*.004,2.5,8);sync();persist();},{passive:true});
 sync();renderSaved();connectExtension();showSource('Demo · simulated features');
}
let last=performance.now(),lastRender=performance.now(),statsTime=0,frames=[];
function frame(now){requestAnimationFrame(frame);const dt=clamp((now-last)/1000,0,.25);last=now;if(document.hidden||paused)return;
 if(!renderer.paletteReady){lastRender=now;return;}const fps=settings.quality==='low'?30:60;if(now-lastRender<1000/fps-1)return;
 const step=Math.max(0,(now-lastRender)/1000);lastRender=now;clock+=step;sceneTime+=step;if(settings.mode==='mixed')scheduler.account(step,{held,manual,visible:true});
 const f=source==='demo'?demoFeatures(clock):Date.now()-(features.timestamp||0)>700?SILENCE:features;
 const response={...f};for(const k of ['level','bass','mid','treble','onset','flux','trend'])response[k]=clamp((f[k]||0)*settings.sensitivity*(settings.restrained?.4:1));
 const scale=settings.quality==='low'?.7:settings.quality==='high'?1:settings.quality==='balanced'?.9:autoScale;
 budget=settings.quality==='low'?4500:settings.quality==='high'?16000:settings.quality==='balanced'?9000:Math.floor(10000*autoScale);
 renderer.resize(innerWidth,innerHeight,Math.min(1,1280/innerWidth)*scale);
 const transition=held||manual?1:Math.min(1,sceneTime/.75,Math.max(0,(settings.duration+1-sceneTime)/.75));
 renderer.render(clock,response,{...settings,budget},transition);
 frames.push(step*1000);if(frames.length>600)frames.shift();
 if(!held&&sceneTime>settings.duration-3&&!nextPrepared){nextPrepared=prepared();scheduler.currentKind=current.kind;}
 if(!held&&sceneTime>=settings.duration){const boundary=f.confidence>.5&&f.onset>.5;if(boundary||sceneTime>=settings.duration+1)next(false);}
 if(now-statsTime>2000){statsTime=now;const sorted=[...frames].sort((a,b)=>a-b),p95=sorted[Math.floor(sorted.length*.95)]||0,mean=frames.reduce((a,b)=>a+b,0)/Math.max(1,frames.length);$('performance').textContent=`${Math.round(1000/mean)} FPS · p95 ${p95.toFixed(1)} ms · ${renderer.markCount||0} marks`;
  if(settings.quality==='auto'){if(p95>27)autoScale=Math.max(.55,autoScale-.05);else if(p95<19)autoScale=Math.min(1,autoScale+.025);}
  const s=scheduler.snapshot();$('balanceStats').hidden=settings.mode!=='mixed';$('balanceStats').textContent=`Automatic viewing: ${s.elapsed.library.toFixed(0)} s library / ${s.elapsed.discovery.toFixed(0)} s Discovery. Holds and manual scenes excluded.`;
 }
}
try{
 renderer=await GlyphRenderer.create($('art'));renderer.onSceneError=e=>notify(e.message);renderer.onPalettePending=sync;renderer.onPalette=sync;renderer.setPalette(settings);bind();const first=settings.mode==='mixed'?PRESETS[0]:prepared();if(first.kind==='library'){scheduler.prime(first.id);libraryShow.prime(first.id);}display(first);lastRender=performance.now();requestAnimationFrame(frame);
 const error=new URLSearchParams(location.search).get('captureError');if(error)notify(error);
 if(new URLSearchParams(location.search).has('dev'))globalThis.__V32={renderer,get settings(){return settings;},scheduler,presets:PRESETS,spacePresets:SPACE_PRESETS,videoPresets:VR_PRESETS,allPresets:ALL_PRESETS,generateDiscovery,validateScene,display,setFixedGlyph:g=>{renderer.fixedGlyph=g;},pause:()=>{paused=true;},renderAt:(s,t,f=demoFeatures(t))=>{renderer.setScene(s);renderer.resize(1280,720);renderer.render(t,f,{...settings,budget:10000});return true;},nextAutomatic:()=>next(false),metrics:()=>({frames:[...frames],resources:renderer.resourceCount,history:history.length,scheduler:scheduler.snapshot(),palette:renderer.palette,glError:renderer.gl.getError()}),getState:()=>({current,source,paused,held,settings,clock,sceneTime})};
}catch(e){$('failure').hidden=false;$('failureText').textContent=e.message;console.error(e);}
window.addEventListener('pagehide',()=>{cleanupImmersion();clearTimeout(reconnect);port?.disconnect();owner.stop();if(objectURL)URL.revokeObjectURL(objectURL);renderer?.dispose();});
document.addEventListener('visibilitychange',()=>{last=performance.now();lastRender=last;});
