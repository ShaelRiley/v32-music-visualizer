import {createRequire} from 'node:module';import {mkdir,writeFile,readFile} from 'node:fs/promises';import {server} from './serve.mjs';
import {PRESETS,COVERAGE} from '../src/engine/catalog.mjs';import {PALETTES,PALETTE_DEPTHS} from '../src/engine/palette-library.mjs';
import {sampleLayer} from '../src/engine/operators.mjs';import {makeFixture} from './audio-fixture.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'),sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning'&&warnings.length<8)warnings.push(m.text());});
await mkdir('previews/presets',{recursive:true});await mkdir('previews/discovery',{recursive:true});await mkdir('previews/motion-frames',{recursive:true});
const report={environment:{browser:await browser.version(),viewport:[1280,720],kind:'headless Chromium, software SwiftShader; no physical GPU or listening test'},errors,warnings,presets:[],discovery:[],paletteChecks:[],gpuCpuChecks:[],audio:{},ui:{},performance:{}};
if(process.env.V32_QA_RESUME==='1')report.presets=JSON.parse(await readFile('docs/browser-report.json','utf8')).presets;
function assert(check,message){if(!check)throw Error(message);}
async function readFrame(scene,t,width=640,height=360){return page.evaluate(({scene,t,width,height})=>{
 const api=window.__V32;api.renderer.resize(width,height);if(scene)api.renderer.setScene(scene);api.renderer.render(t,{level:.5,bass:.6,mid:.4,treble:.3,onset:.7,trend:.55},{...api.settings,budget:6500});
 const pixels=api.renderer.pixels();let visible=0;const colors=new Set();for(let i=0;i<pixels.length;i+=4){const key=pixels[i]*65536+pixels[i+1]*256+pixels[i+2];colors.add(key);if(key!==0)visible++;}
 const ids=new Set();for(const layer of api.renderer.buffers){const out=new Float32Array(8000*8);const gl=api.renderer.gl;gl.bindBuffer(gl.ARRAY_BUFFER,layer.buffers[layer.read]);gl.getBufferSubData(gl.ARRAY_BUFFER,0,out);for(let i=0;i<Math.floor(6500/api.renderer.buffers.length);i++)ids.add(out[i*8]);gl.bindBuffer(gl.ARRAY_BUFFER,null);}
 const png=api.renderer.canvas.toDataURL('image/png').split(',')[1];return {png,visibleFraction:visible/(width*height),colors:colors.size,glyphs:[...ids],glError:api.renderer.gl.getError(),resources:api.renderer.resourceCount};
},{scene,t,width,height});}
try{
 await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>{window.__V32.pause();document.body.classList.add('clean');});
 report.environment.renderer=await page.evaluate(()=>{const gl=window.__V32.renderer.gl,e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 // Exercise every authored scene through four materially separated stages.
 for(let i=0;i<PRESETS.length;i++){
  const s=PRESETS[i],frames=[];let first=null,changed=0,maxResources=0;
 if(process.env.V32_QA_RESUME==='1'&&s.camera!=='interior')continue;
  for(const t of [0,2.5,8,23]){const f=await readFrame(t===0?s:null,t);assert(f.glError===0,s.id+' WebGL error');assert(f.glyphs.every(g=>Number.isInteger(g)&&g>=0&&g<32),s.id+' invalid glyph');frames.push(Buffer.from(f.png,'base64'));if(first===null)first=f.png;else if(f.png!==first)changed++;maxResources=Math.max(maxResources,f.resources);}
  const metric=await readFrame(s,4);report.presets[i]={id:s.id,visibleFraction:metric.visibleFraction,colors:metric.colors,glyphForms:metric.glyphs.length,changedStages:changed,resources:maxResources};
  assert(changed>=2,s.id+' did not evolve');
  await sharp(frames[1]).png().toFile('previews/presets/'+s.id+'.png');
  const stacked=await sharp({create:{width:640,height:360*4,channels:4,background:'#000'}}).composite(frames.map((input,j)=>({input,top:360*j,left:0}))).raw().toBuffer();
  await sharp(stacked,{raw:{width:640,height:360*4,channels:4,pageHeight:360}}).webp({quality:78,loop:0,delay:[550,550,550,550]}).toFile('previews/presets/'+s.id+'.webp');
  if(i%16===0)console.log('Rendered '+(i+1)+'/256 presets');if(metric.visibleFraction<=.001)console.log('Needs visual review: '+s.id+' ('+metric.visibleFraction+')');
 }
 // Representative generated worlds, with actual final-frame visibility.
 for(let i=0;i<32;i++){const s=await page.evaluate(i=>window.__V32.generateDiscovery('qa-'+i).scene,i),f=await readFrame(s,7);assert(f.glError===0,'Discovery WebGL error');report.discovery.push({seed:s.seed,id:s.id,visibleFraction:f.visibleFraction,glyphForms:f.glyphs.length});await sharp(Buffer.from(f.png,'base64')).png().toFile('previews/discovery/qa-'+i+'.png');}
 // Native Glyph is deliberately unavailable; all other registry entries preserve finite output.
 for(const p of PALETTES.filter(p=>p.available)){
  await page.evaluate(p=>{const a=window.__V32;a.settings.palette=p.id;a.settings.depth=16;a.renderer.setPalette(a.settings);},p);await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
  await readFrame(PRESETS[0],7);const check=await page.evaluate(()=>{const a=window.__V32,p=a.renderer.pixels(),allowed=new Set(a.renderer.palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);let invalid=0;const unique=new Set();for(let i=0;i<p.length;i+=4){const n=p[i]*65536+p[i+1]*256+p[i+2];unique.add(n);if(!allowed.has(n))invalid++;}return {invalid,colors:unique.size};});assert(check.invalid===0,p.id+' generated off-palette pixels');report.paletteChecks.push({palette:p.id,depth:16,...check});
 }
 for(const depth of PALETTE_DEPTHS){await page.evaluate(depth=>{const a=window.__V32;a.settings.palette='standard';a.settings.depth=depth;a.renderer.setPalette(a.settings);},depth);await page.waitForFunction(()=>window.__V32.renderer.paletteReady);await readFrame(PRESETS[0],7);const count=await page.evaluate(()=>{const a=window.__V32,p=a.renderer.pixels(),allowed=new Set(a.renderer.palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);const out=new Set();let invalid=0;for(let i=0;i<p.length;i+=4){const key=p[i]*65536+p[i+1]*256+p[i+2];out.add(key);if(!allowed.has(key))invalid++;}return {colors:out.size,invalid};});assert(count.invalid===0&&count.colors<=depth+1,'Depth '+depth+' is not finite');report.paletteChecks.push({palette:'standard',depth,...count});}
 // GPU spatial outputs must match independently implemented CPU equations.
 await page.evaluate(()=>{const a=window.__V32;a.settings.palette='standard';a.settings.depth=32;a.renderer.setPalette(a.settings);});await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 for(let i=0;i<32;i++){
  const s=PRESETS[i*8];await readFrame(s,7);const gpu=await page.evaluate(()=>{const r=window.__V32.renderer,g=r.gl,out=new Float32Array(64*8);g.bindBuffer(g.ARRAY_BUFFER,r.buffers[0].buffers[r.buffers[0].read]);g.getBufferSubData(g.ARRAY_BUFFER,0,out);g.bindBuffer(g.ARRAY_BUFFER,null);return [...out];});let maxError=0;
  for(let k=0;k<64;k++){const u=((.5+k*.754877666)%1),v=((.5+k*.569840296)%1),p=sampleLayer(s.layers[0],u,v,7,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.55});for(let j=0;j<3;j++)maxError=Math.max(maxError,Math.abs(gpu[k*8+2+j]-p[j]));}
  assert(maxError<.03,s.id+' GPU/CPU mismatch '+maxError);report.gpuCpuChecks.push({operator:s.family,maxCoordinateError:maxError});
 }
 // Freeze every other variable for the requested form-contribution comparison.
 const normal=await readFrame(PRESETS[0],7,1280,720);await page.evaluate(()=>window.__V32.setFixedGlyph(7));const fixed=await readFrame(null,7,1280,720);await page.evaluate(()=>window.__V32.setFixedGlyph(-1));
 report.formComparison={fixedCanonicalGlyph:7,normalVisibleFraction:normal.visibleFraction,fixedVisibleFraction:fixed.visibleFraction,different:normal.png!==fixed.png};assert(report.formComparison.different,'Form selection contributed no visible difference');await sharp(Buffer.from(normal.png,'base64')).png().toFile('previews/form-composed.png');await sharp(Buffer.from(fixed.png,'base64')).png().toFile('previews/form-fixed-block.png');
 // A sampled 12-second moving sequence from the actual renderer, not a mockup.
 for(let i=0;i<96;i++){const f=await readFrame(i===0?PRESETS[0]:null,i/8,960,540);await sharp(Buffer.from(f.png,'base64')).png().toFile('previews/motion-frames/'+String(i).padStart(4,'0')+'.png');}
 // Real browser Web Audio graph and file routes; the output device is not listened to.
 const fixture=await makeFixture();await page.evaluate(()=>document.body.classList.remove('clean'));await page.locator('#controls').click();await page.locator('#file').setInputFiles(fixture);await page.waitForTimeout(1400);report.audio.first=await page.evaluate(()=>({source:window.__V32.getState().source,playing:!document.getElementById('audio').paused,time:document.getElementById('audio').currentTime}));assert(report.audio.first.playing&&report.audio.first.time>.5,'Local file failed');
 await page.locator('#file').setInputFiles(fixture);await page.waitForTimeout(700);report.audio.second=await page.evaluate(()=>({source:window.__V32.getState().source,playing:!document.getElementById('audio').paused,time:document.getElementById('audio').currentTime}));assert(report.audio.second.playing,'Repeated file playback failed');await page.locator('#stopAudio').click();report.audio.stopped=await page.evaluate(()=>window.__V32.getState().source);assert(report.audio.stopped==='idle','Stop did not release local source');
 await page.locator('#browse').click();report.ui.catalogCount=await page.locator('#catalogGrid button').count();assert(report.ui.catalogCount===768,'Browse catalog is incomplete');await page.locator('#search').fill('Prism Sail');assert(await page.locator('#catalogGrid button').count()===1,'Catalog search failed');await page.locator('#closeCatalog').click();await page.locator('#fresh').click();await page.getByText('Saved scenes',{exact:true}).click();await page.locator('#saveDiscovery').click();report.ui.savedCount=await page.locator('#saved button').count();assert(report.ui.savedCount>=1,'Discovery did not save');await page.locator('#previous').click();await page.locator('#next').click();
 await page.setViewportSize({width:800,height:600});report.ui.resize=true;await page.setViewportSize({width:1280,height:720});
 await page.locator('#fullscreen').click();report.ui.fullscreen=await page.evaluate(()=>Boolean(document.fullscreenElement));await page.locator('#fullscreen').click();
 await page.evaluate(()=>window.__V32.display(window.__V32.presets[0],true));await page.locator('#demo').click();await page.locator('#closeControls').click();await page.waitForFunction(()=>window.__V32.renderer.paletteReady);await page.evaluate(()=>{const a=window.__V32;document.getElementById('toast').hidden=true;a.renderer.resize(1280,720);a.renderer.render(7,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.55},{...a.settings,budget:10000});});await page.screenshot({path:'previews/Video32-Preview.png'});
 // Readback forces completion. Its overhead is diagnostic, not production FPS.
 await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 report.performance=await page.evaluate(()=>{const a=window.__V32,r=a.renderer;r.setScene({...a.presets[0],budget:10000});r.resize(1280,720);const results=[],pixel=new Uint8Array(4);for(let i=0;i<60;i++){const start=performance.now();r.render(i/30,{bass:.5,mid:.3,treble:.2,onset:.4,trend:.5},{...a.settings,budget:10000});r.gl.readPixels(640,360,1,1,r.gl.RGBA,r.gl.UNSIGNED_BYTE,pixel);results.push(performance.now()-start);}results.sort((a,b)=>a-b);return {samples:60,marks:r.markCount,resolution:[1280,720],method:'render plus synchronous 1-pixel GPU readback; includes diagnostic overhead; diagnostic scene budget 10000',completedFrameMedianMs:results[30],completedFrameP95Ms:results[57],maxMs:results[59],framesOver16_7ms:results.filter(t=>t>16.7).length,framesOver33_3ms:results.filter(t=>t>33.3).length,target60fpsVerified:false};});
 assert(report.performance.marks===10000,'Benchmark did not render its expected marks');
 assert(errors.length===0,'Browser errors: '+errors.join('; '));console.log('Browser verification completed');
}catch(e){report.failure=e.message;console.error(e.message);process.exitCode=1;}
await writeFile('docs/browser-report.json',JSON.stringify(report,null,2));await writeFile('docs/preset-inventory.json',JSON.stringify(COVERAGE,null,2));await browser.close();server.close();
