import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {server} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>window.__V32.pause());
const report={environment:{browser:await browser.version(),backend:'software SwiftShader, headless, no hardware performance claim'},cadence:[],transitions:{},target60fpsVerified:false};
for(const profile of [{name:'Low',budget:4500,scale:.7},{name:'Balanced',budget:9000,scale:.9},{name:'High',budget:16000,scale:1}]){
 const result=await page.evaluate(async profile=>{
  const a=window.__V32,r=a.renderer;r.setScene({...a.presets[0],budget:profile.budget});r.resize(1280,720,profile.scale);
  const intervals=[];let previous;
  for(let i=0;i<70;i++){
   const now=await new Promise(resolve=>requestAnimationFrame(resolve));
   if(i>9)intervals.push(now-previous);previous=now;
   r.render(now/1000,{bass:.5,mid:.3,treble:.2,onset:.4,trend:.5},{...a.settings,budget:profile.budget});
  }
  intervals.sort((a,b)=>a-b);return {...profile,marks:r.markCount,internalResolution:[r.canvas.width,r.canvas.height],samples:intervals.length,frameIntervalMedianMs:intervals[30],frameIntervalP95Ms:intervals[57],maxMs:intervals[59],intervalsOver16_7ms:intervals.filter(t=>t>16.7).length,intervalsOver33_3ms:intervals.filter(t=>t>33.3).length};
 },profile);
 report.cadence.push(result);console.log(result);
}
report.transitions=await page.evaluate(()=>{
 const a=window.__V32,r=a.renderer,pixel=new Uint8Array(4),times=[],counts=[];r.resize(1280,720,.7);
 for(let i=0;i<64;i++){
  const s=i%2?a.generateDiscovery('transition-'+i).scene:a.presets[(i*13)%256];
  const start=performance.now();r.setScene(s);r.render(i+4,{bass:.5,mid:.3,treble:.2,onset:.4,trend:.5},{...a.settings,budget:4500});r.gl.readPixels(1,1,1,1,r.gl.RGBA,r.gl.UNSIGNED_BYTE,pixel);times.push(performance.now()-start);counts.push({layers:s.layers.length,resources:r.resourceCount});
 }
 times.sort((a,b)=>a-b);return {samples:64,method:'scene replacement plus first rendered frame and synchronous readback',medianMs:times[32],p95Ms:times[60],maxMs:times[63],maxTrackedLayerResources:Math.max(...counts.map(x=>x.resources)),resourcesMatchLayerBound:counts.every(x=>x.resources===x.layers*5+5),finalTrackedLayerResources:r.resourceCount};
});
await page.evaluate(()=>{const a=window.__V32;a.display(a.presets[0],true);document.getElementById('toast').hidden=true;document.getElementById('inspector').hidden=true;a.renderer.resize(1280,720);a.renderer.render(7,{bass:.6,mid:.4,treble:.3,onset:.7,trend:.55},{...a.settings,budget:10000});});
await page.screenshot({path:'previews/Video32-Preview.png'});
await writeFile('docs/performance-report.json',JSON.stringify(report,null,2));await browser.close();server.close();console.log('Performance diagnostics completed');
