import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {server} from './serve.mjs';
import {VISUAL_PALETTES} from '../src/engine/palette-library.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'),sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={version:'0.2.0',environment:'Chromium '+await browser.version()+'; software SwiftShader; synthetic features, no physical listening or GPU test',errors,framing:[],motion:[],fullscreen:{}};
try {
 await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>window.__V32.pause());
 report.defaults=await page.evaluate(()=>({mode:window.__V32.settings.mode,paletteCycle:window.__V32.settings.paletteCycle}));assert.equal(report.defaults.mode,'shuffle');assert.equal(report.defaults.paletteCycle,true);
 const baseline=JSON.parse(await readFile('docs/baseline-framing-report.json','utf8'));
 await mkdir('previews/revision',{recursive:true});const sheets=[];
 for(let i=0;i<32;i++){
  const f=await page.evaluate(i=>{
   const a=window.__V32,r=a.renderer,s=a.presets[i*8];r.setScene(s);r.resize(640,360);r.render(7,{level:.5,bass:.6,mid:.4,treble:.3,onset:.7,trend:.55},{...a.settings,budget:8500});
   const p=r.pixels(),tiles=new Set();let pixels=0;
   for(let j=0;j<p.length;j+=4)if(p[j]||p[j+1]||p[j+2]){pixels++;const k=j/4;tiles.add(Math.floor(k%640/40)+16*Math.floor(k/640/40));}
   return {id:s.id,pixels:pixels/(640*360),tiles:tiles.size/144,png:r.canvas.toDataURL().split(',')[1],glError:r.gl.getError()};
  },i);
  assert.equal(f.glError,0);const png=Buffer.from(f.png,'base64');delete f.png;
  report.framing.push({...f,baselineTiles:baseline.presets[i].tiles});
  sheets.push({input:await sharp(png).resize(320,180).toBuffer(),left:i%4*320,top:Math.floor(i/4)*180});
 }
 await sharp({create:{width:1280,height:1440,channels:3,background:'#000'}}).composite(sheets).png().toFile('previews/revision/framing.png');
 report.framingSummary={baselineMeanTiles:report.framing.reduce((n,f)=>n+f.baselineTiles,0)/32,meanTiles:report.framing.reduce((n,f)=>n+f.tiles,0)/32,minTiles:Math.min(...report.framing.map(f=>f.tiles)),improved:report.framing.filter(f=>f.tiles>f.baselineTiles).length};
 assert(report.framingSummary.meanTiles>report.framingSummary.baselineMeanTiles*1.7,'Too little framing improvement');
 for(let i=0;i<256;i++){
  const check=await page.evaluate(i=>{
   const a=window.__V32,r=a.renderer,s=a.presets[i],tone={level:.65,bass:.7,mid:.5,treble:.4,onset:0,trend:.6};
   const sample=features=>{r.setScene(s);r.resize(320,180);r.render(7,features,{...a.settings,budget:6500});return r.buffers.map(b=>{const data=new Float32Array(128*8);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,b.buffers[b.read]);r.gl.getBufferSubData(r.gl.ARRAY_BUFFER,0,data);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,null);return [...data];});};
   const quiet=sample({}),music=sample(tone);let valid=0,moved=0,colorChanges=0,total=0;
   for(let j=0;j<quiet.length;j++)for(let k=0;k<128;k++){
    const at=k*8,a=quiet[j],b=music[j];if(a[at+2]>99||b[at+2]>99)continue;
    valid++;const delta=Math.hypot(a[at+2]-b[at+2],a[at+3]-b[at+3],a[at+4]-b[at+4]);if(delta>.02)moved++;total+=delta;
    if([5,6,7].some(n=>a[at+n]!==b[at+n]))colorChanges++;
   }
   return {id:s.id,samples:valid,movedShare:moved/Math.max(1,valid),meanDisplacement:total/Math.max(1,valid),colorChanges,glError:r.gl.getError()};
  },i);
  assert(check.movedShare>.85,check.id+' leaves too many marks unaffected between beats');assert.equal(check.colorChanges,0);assert.equal(check.glError,0);report.motion.push(check);
  if(i%64===0)console.log('Music response checked '+(i+1)+'/256');
 }
 const colors=[];
 for(let i=0;i<VISUAL_PALETTES.length;i++){
  const p=VISUAL_PALETTES[i];await page.evaluate(id=>{const a=window.__V32;a.settings.palette=id;a.settings.depth=32;a.renderer.setPalette(a.settings);},p.id);await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
  const frame=await page.evaluate(()=>{const a=window.__V32,r=a.renderer;r.setScene(a.presets[0]);r.resize(320,180);r.render(7,{level:.5,bass:.6,mid:.4,treble:.3,onset:.2,trend:.5},{...a.settings,budget:8500});return r.canvas.toDataURL().split(',')[1];});
  const input=Buffer.from(frame,'base64'),left=i%5*320,top=Math.floor(i/5)*206;
  const label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="26"><rect width="320" height="26" fill="#10171b"/><text x="12" y="18" fill="#d6e3ec" font-family="sans-serif" font-size="12">${p.name.replaceAll('&','&amp;')}</text></svg>`);
  colors.push({input,left,top},{input:label,left,top:top+180});
 }
 await sharp({create:{width:1600,height:Math.ceil(VISUAL_PALETTES.length/5)*206,channels:3,background:'#000'}}).composite(colors).png().toFile('previews/Palette-Collection.png');
 report.paletteCycle=await page.evaluate(()=>{const a=window.__V32,original=a.settings.palette;a.nextAutomatic();const cycled=a.settings.palette,kind=a.getState().current.kind;a.settings.paletteCycle=false;a.nextAutomatic();return {changed:cycled!==original,kind,staysWhenOff:a.settings.palette===cycled};});assert(report.paletteCycle.changed);assert.equal(report.paletteCycle.kind,'library');assert(report.paletteCycle.staysWhenOff);await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 report.fluidity=await page.evaluate(()=>{
  const a=window.__V32,r=a.renderer,tone={level:.65,bass:.7,mid:.5,treble:.4,onset:0,trend:.6},settings={...a.settings,budget:6500};r.setScene(a.presets[24]);r.resize(640,360);
  r.render(7,tone,settings);r.render(7+1/30,tone,settings);const first=r.canvas.toDataURL(),buffer=r.buffers[0].read,tick=r.buffers[0].lastUpdate;
  r.render(7+1/20,tone,settings);const between=r.canvas.toDataURL();
  return {changesBetweenAnalysisTicks:first!==between,analysisPoseRetained:r.buffers[0].read===buffer&&r.buffers[0].lastUpdate===tick,blend:r.gl.getUniform(r.programs[1],r.uniforms[1].interpolation),glError:r.gl.getError()};
 });assert(report.fluidity.changesBetweenAnalysisTicks);assert(report.fluidity.analysisPoseRetained);assert(Math.abs(report.fluidity.blend-.5)<.01);assert.equal(report.fluidity.glError,0);
 await page.locator('#fullscreen').click();report.fullscreen.nativeEntered=await page.evaluate(()=>Boolean(document.fullscreenElement));
 if(!report.fullscreen.nativeEntered)await page.evaluate(()=>{Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>document.body});document.dispatchEvent(new Event('fullscreenchange'));});
 report.fullscreen.scope=report.fullscreen.nativeEntered?'Browser fullscreen API':'DOM fullscreen-state emulation; physical fullscreen still requires device qualification';
 await page.waitForTimeout(2800);
 const hidden=await page.evaluate(()=>({immersed:document.body.classList.contains('immersed'),cursor:getComputedStyle(document.body).cursor,overlays:[...document.querySelectorAll('body > :not(canvas):not(script)')].map(e=>({id:e.id||e.tagName,opacity:getComputedStyle(e).opacity,visibility:getComputedStyle(e).visibility,inert:e.inert}))}));
 report.fullscreen.observedOverlays=hidden.overlays;assert(hidden.immersed);assert.equal(hidden.cursor,'none');assert(hidden.overlays.every(e=>e.opacity==='0'&&e.visibility==='hidden'&&e.inert));report.fullscreen.idleHidesEveryOverlay=true;
 await page.evaluate(()=>{const t=document.getElementById('toast');t.textContent='A scene message';t.hidden=false;});await page.waitForTimeout(100);assert.equal(await page.locator('#toast').evaluate(e=>getComputedStyle(e).opacity),'0');report.fullscreen.newMessagesStayHidden=true;
 await page.mouse.move(640,360);await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>document.body.classList.contains('immersed')),false);assert.equal(await page.locator('header').evaluate(e=>getComputedStyle(e).opacity),'1');report.fullscreen.mouseRevealsControls=true;
 await page.waitForTimeout(2600);await page.keyboard.press('h');assert.equal(await page.evaluate(()=>document.body.classList.contains('immersed')),false);report.fullscreen.keyboardRevealsControls=true;
 if(report.fullscreen.nativeEntered)await page.evaluate(()=>document.exitFullscreen());else await page.evaluate(()=>{Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>null});document.dispatchEvent(new Event('fullscreenchange'));});
 await page.waitForTimeout(2600);assert.equal(await page.evaluate(()=>document.body.classList.contains('immersed')),false);report.fullscreen.exitRestoresControls=true;
 assert.equal(errors.length,0);console.log(JSON.stringify({framing:report.framingSummary,motion:{scenes:report.motion.length,minMovedShare:Math.min(...report.motion.map(x=>x.movedShare)),colorChanges:report.motion.reduce((n,x)=>n+x.colorChanges,0)},fullscreen:report.fullscreen},null,2));
}catch(e){report.failure=e.message;console.error(e);process.exitCode=1;}
await writeFile('docs/revision-report.json',JSON.stringify(report,null,2));await browser.close();server.close();
