import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {server} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={servedDirectory:process.argv[2]||'.',environment:'Headless Chromium '+await browser.version()+'; software SwiftShader; web-served build, not MV3 capture',errors};
try{
 await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>window.__V32.pause());
 report.finite=await page.evaluate(()=>{
  const a=window.__V32,r=a.renderer;r.setScene(a.presets[0]);r.resize(640,360);r.render(4,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.55},{...a.settings,budget:10000});const pixels=r.pixels(),allowed=new Set(r.palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);let invalid=0;for(let i=0;i<pixels.length;i+=4)if(!allowed.has(pixels[i]*65536+pixels[i+1]*256+pixels[i+2]))invalid++;return {marks:r.markCount,artistBaseBudget:r.scene.budget,presets:a.allPresets.length,paletteSize:r.palette.length,invalid,glError:r.gl.getError()};
 });assert.equal(report.finite.presets,768);assert.equal(report.finite.marks,8500);assert.equal(report.finite.invalid,0);assert.equal(report.finite.glError,0);
 report.spatial=await page.evaluate(async()=>{
  const a=window.__V32,r=a.renderer,results=[],allowed=new Set(r.palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);
  for(const s of [a.spacePresets[0],a.spacePresets[64],a.spacePresets[160],a.spacePresets[224],a.videoPresets[0],a.videoPresets[128],a.videoPresets[255]]){
   await r.prefetchSpace(s);r.setScene(s);r.resize(640,360);r.render(7,{level:.6,bass:.6,mid:.4,treble:.3,onset:.4,trend:.55},{...a.settings,budget:10000});
   const first=r.canvas.toDataURL(),pixels=r.pixels();let invalid=0,lit=0;for(let i=0;i<pixels.length;i+=4){const color=pixels[i]*65536+pixels[i+1]*256+pixels[i+2];if(!allowed.has(color))invalid++;if(color)lit++;}
   r.render(23,{level:.6,bass:.6,mid:.4,treble:.3,onset:.4,trend:.55},{...a.settings,budget:10000});results.push({id:s.id,ready:r.spaceReady,marks:r.markCount,lit,invalid,changed:first!==r.canvas.toDataURL(),glError:r.gl.getError()});
  }return results;
 });for(const s of report.spatial){assert(s.ready&&s.lit>100&&s.changed,s.id);assert.equal(s.invalid,0);assert.equal(s.glError,0);}
 report.shuffle=await page.evaluate(()=>{const a=window.__V32,bank=s=>s.space?'spaces':s.video?'video':'regular',banks=[bank(a.getState().current)];for(let i=0;i<4;i++){a.nextAutomatic();banks.push(bank(a.getState().current));}return {banks,discovery:banks.includes('discovery')};});
 assert.deepEqual(report.shuffle.banks.map(b=>b==='regular'),[true,false,true,false,true]);assert.notEqual(report.shuffle.banks[1],report.shuffle.banks[3]);
 await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 await page.evaluate(()=>{const a=window.__V32;a.settings.palette='v32-prism';a.settings.depth='truecolor';a.renderer.setPalette(a.settings);});await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 report.trueColor=await page.evaluate(()=>{const a=window.__V32,r=a.renderer;r.setScene(a.presets[0]);r.render(4.1,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.55},{...a.settings,budget:10000});const pixels=r.pixels(),colors=new Set();for(let i=0;i<pixels.length;i+=4)colors.add(pixels[i]*65536+pixels[i+1]*256+pixels[i+2]);return {colors:colors.size,finiteLookupBypassed:r.colorTreatment.trueColor,glError:r.gl.getError()};});assert(report.trueColor.finiteLookupBypassed);assert(report.trueColor.colors>report.finite.paletteSize);assert.equal(report.trueColor.glError,0);
 const credits=await browser.newPage();await credits.goto('http://localhost:4173/space-credits.html');await credits.waitForSelector('#videoSources tr');report.credits=await credits.evaluate(()=>({polygon:document.querySelectorAll('#sources tr').length,video:document.querySelectorAll('#videoSources tr').length}));assert.equal(report.credits.polygon,32);assert.equal(report.credits.video,256);await credits.close();assert.equal(errors.length,0);console.log(report);
}catch(e){report.failure=e.message;console.error(e);process.exitCode=1;}
await writeFile('docs/package-runtime-report.json',JSON.stringify(report,null,2));await browser.close();server.close();
