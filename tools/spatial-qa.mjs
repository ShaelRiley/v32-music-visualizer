import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {server} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'),sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={environment:'Chromium '+await browser.version()+'; software SwiftShader, synthetic features; no physical stereo / GPU qualification',errors,spaces:[],video:[],banks:{},races:{}};
await mkdir('previews/spatial',{recursive:true});await mkdir('previews/spatial-frames',{recursive:true});
try{
 await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>window.__V32.pause());
 for(const bank of ['spaces','video']){
  const sheets=[],glyphs=new Set();
  for(let i=0;i<256;i++){
   const frames=[],observations=[];
   for(const t of [0,7,23]){
    const f=await page.evaluate(async ({bank,i,t})=>{
     const a=window.__V32,r=a.renderer,s=bank==='spaces'?a.spacePresets[i]:a.videoPresets[i];if(t===0){await r.prefetchSpace(s);r.setScene(s);}r.resize(640,360);r.render(t,{level:.6,bass:.7,mid:.4,treble:.3,onset:.2,trend:.5},{...a.settings,budget:8000});
     const p=r.pixels(),tiles=new Set(),colors=new Set(),allowed=new Set(r.palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);let pixels=0,invalid=0;
     for(let j=0;j<p.length;j+=4){const color=p[j]*65536+p[j+1]*256+p[j+2];if(!allowed.has(color))invalid++;colors.add(color);if(color){pixels++;const k=j/4;tiles.add(Math.floor(k%640/40)+16*Math.floor(k/640/40));}}
     const data=new Float32Array(r.markCount*8);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,r.buffers[0].buffers[r.buffers[0].read]);r.gl.getBufferSubData(r.gl.ARRAY_BUFFER,0,data);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,null);const forms=new Set();for(let j=0;j<r.markCount;j++)forms.add(data[j*8]);
     return {id:s.id,t,pixels:pixels/(640*360),tiles:tiles.size/144,colors:colors.size,invalid,forms:[...forms],glError:r.gl.getError(),resources:r.resourceCount,png:r.canvas.toDataURL().split(',')[1]};
    },{bank,i,t});
    assert.equal(f.glError,0,f.id);assert.equal(f.invalid,0,f.id+' off-palette pixels');assert(f.forms.every(g=>Number.isInteger(g)&&g>=0&&g<32));f.forms.forEach(g=>glyphs.add(g));frames.push(Buffer.from(f.png,'base64'));delete f.png;observations.push(f);
   }
   assert(observations.some(f=>f.pixels>.004),observations[0].id+' is empty');assert(!frames[0].equals(frames[2]),observations[0].id+' does not evolve');
   const id=observations[0].id;await sharp(frames[1]).png().toFile('previews/spatial-frames/'+id+'.png');const raw=await sharp({create:{width:640,height:1080,channels:4,background:'#000'}}).composite(frames.map((input,j)=>({input,left:0,top:360*j}))).raw().toBuffer();await sharp(raw,{raw:{width:640,height:1080,channels:4,pageHeight:360}}).webp({quality:78,loop:0,delay:[650,650,650]}).toFile('previews/spatial-frames/'+id+'.webp');
   report[bank].push({id,observations});if(i%8===0)sheets.push({input:await sharp(frames[1]).resize(320,180).toBuffer(),left:(i/8)%4*320,top:Math.floor(i/8/4)*180});
   if(i%32===0)console.log(bank+' '+(i+1)+'/256');
  }
  await sharp({create:{width:1280,height:1440,channels:3,background:'#000'}}).composite(sheets).png().toFile('previews/spatial/'+bank+'.png');
  report.banks[bank]={presets:256,glyphs:[...glyphs].sort((a,b)=>a-b),meanTiles:report[bank].reduce((n,s)=>n+s.observations[1].tiles,0)/256,minBestTiles:Math.min(...report[bank].map(s=>Math.max(...s.observations.map(f=>f.tiles))))};
 }
 report.motion=await page.evaluate(async()=>{
  const a=window.__V32,r=a.renderer,checks=[];
  for(const s of [...a.spacePresets.filter((_,i)=>i%8===0),...a.videoPresets.filter((_,i)=>i%8===0)]){
   await r.prefetchSpace(s);const pose=f=>{r.setScene(s);r.resize(640,360);r.render(7,f,{...a.settings,budget:8000});const out=new Float32Array(128*8);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,r.buffers[0].buffers[r.buffers[0].read]);r.gl.getBufferSubData(r.gl.ARRAY_BUFFER,0,out);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,null);return out;};const quiet=pose({}),music=pose({level:.65,bass:.7,mid:.5,treble:.4,onset:0,trend:.6});let moved=0,colors=0;
   for(let i=0;i<128;i++){const at=i*8;if(Math.hypot(...[2,3,4].map(j=>quiet[at+j]-music[at+j]))>.02)moved++;if([5,6,7].some(j=>quiet[at+j]!==music[at+j]))colors++;}checks.push({id:s.id,movedShare:moved/128,audioColorChanges:colors,glError:r.gl.getError()});
  }return checks;
 });assert(report.motion.every(c=>c.movedShare>.9&&c.audioColorChanges===0&&c.glError===0));
 report.races=await page.evaluate(async()=>{const a=window.__V32,r=a.renderer;for(let i=0;i<12;i++)r.setScene(i%2?a.videoPresets[i]:a.spacePresets[i]);await new Promise(resolve=>setTimeout(resolve,500));const expected=a.videoPresets[11].id,seen=r.scene.id;r.setScene(a.presets[0]);r.render(7,{},{...a.settings,budget:6500});return {expected,seen,regularReady:r.spaceReady,glError:r.gl.getError(),spaceCache:r.spaceCache.entries.size,videoCache:r.videoCache.entries.size};});assert.equal(report.races.seen,report.races.expected);assert(report.races.regularReady);assert.equal(report.races.glError,0);assert(report.races.spaceCache<=8&&report.races.videoCache<=4);
 await page.locator('#controls').click();await page.locator('#browse').click();assert.equal(await page.locator('#catalogGrid button').count(),768);for(const bank of ['regular','spaces','video']){await page.selectOption('#bankFilter',bank);assert.equal(await page.locator('#catalogGrid button').count(),256);}await page.locator('#closeCatalog').click();
 await page.goto('http://localhost:4173/space-credits.html');assert.equal(await page.locator('#sources tr').count(),32);assert.equal(await page.locator('#videoSources tr').count(),256);assert.equal(errors.length,0);console.log(JSON.stringify(report.banks));
}catch(e){report.failure=e.message;console.error(e);process.exitCode=1;}
await writeFile('docs/spatial-report.json',JSON.stringify(report,null,2));await browser.close();server.close();
