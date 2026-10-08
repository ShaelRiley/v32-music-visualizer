import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';import {server} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'),sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']}),checks=[];
for(const deviceScaleFactor of [1,1.25,2]){
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor});await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>{window.__V32.pause();document.body.classList.add('clean');});
 for(const ratio of [.55,.7,.9,1]){
  const palette=await page.evaluate(ratio=>{const a=window.__V32;a.renderer.setScene(a.presets[0]);a.renderer.resize(1280,720,ratio);a.renderer.render(7,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.5},{...a.settings,budget:9000});return a.renderer.palette;},ratio);
  const png=await page.screenshot(),{data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true}),allowed=new Set(palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);const colors=new Set();let invalid=0;
  for(let i=0;i<data.length;i+=info.channels){const c=data[i]*65536+data[i+1]*256+data[i+2];colors.add(c);if(!allowed.has(c))invalid++;}
  checks.push({deviceScaleFactor,internalRatio:ratio,finalScreenshot:[info.width,info.height],colors:colors.size,invalid});
 }
 // Change a finite palette without advancing time or resetting the scene.
 await page.evaluate(()=>{const a=window.__V32;a.settings.palette='blackwhite';a.settings.depth=3;a.renderer.setPalette(a.settings);});await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 const allowedPalette=await page.evaluate(()=>{const a=window.__V32;a.renderer.render(7,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.5},{...a.settings,budget:9000});return a.renderer.palette;});
 const screenshot=await page.screenshot(),decoded=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true}),allowedSwitch=new Set(allowedPalette.map(c=>c[0]*65536+c[1]*256+c[2]));allowedSwitch.add(0);let invalidSwitch=0;
 for(let i=0;i<decoded.data.length;i+=decoded.info.channels){const c=decoded.data[i]*65536+decoded.data[i+1]*256+decoded.data[i+2];if(!allowedSwitch.has(c))invalidSwitch++;}
 checks.push({deviceScaleFactor,type:'palette-change-at-fixed-time',palette:'blackwhite',depth:3,invalid:invalidSwitch});
 await page.close();
}
await writeFile('docs/final-display-report.json',JSON.stringify(checks,null,2));console.log(checks);await browser.close();server.close();if(checks.some(c=>c.invalid))process.exitCode=1;
