import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {server} from './serve.mjs';
import {VR_DATA} from '../assets/vr/manifest.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'),sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
let browser;const report={scope:'All 256 video presets at four cardinal headings in software Chromium. Synthetic audio and finite-palette checks; genuine source fades retained, with their opening frame used for previews. No device performance claim.',sourceFades:[],presets:[],errors:[]};
try{
 browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});report.browser=await browser.version();
 const page=await browser.newPage({viewport:{width:640,height:360}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>window.__V32.pause());
 await mkdir('previews/spatial-frames',{recursive:true});await mkdir('previews/spatial',{recursive:true});const contact=[];
 for(let i=0;i<256;i++){
  const checks=[],pictures=[],view=VR_DATA.views[i];
  const bank=await readFile('assets/vr/data/'+view.file),fabric=await sharp(bank.subarray(view.offset,view.offset+view.bytes)).raw().toBuffer();
  const voidFrame=f=>{for(let j=f*64*256*3;j<(f+1)*64*256*3;j+=3)if(fabric[j]!==0)return false;return true;};
  const time=voidFrame(3)&&voidFrame(4)?0:7;if(time===0)report.sourceFades.push({id:'vr-'+view.id,sourceFrames:[4,5],previewTime:0});
  for(let turn=0;turn<4;turn++){
   const result=await page.evaluate(async({i,turn,time})=>{
    const a=window.__V32,r=a.renderer,s=a.videoPresets[i];if(turn===0){await r.prefetchSpace(s);r.setScene(s);}r.resize(640,360);
    r.render(time,{level:.6,bass:.7,mid:.4,treble:.3,onset:.2,trend:.5},{...a.settings,camera:'hold',yaw:turn*Math.PI/2,pitch:0,budget:8000});
    const p=r.pixels(),allowed=new Set(r.palette.map(c=>c[0]*65536+c[1]*256+c[2]));allowed.add(0);let lit=0,invalid=0;
    for(let j=0;j<p.length;j+=4){const c=p[j]*65536+p[j+1]*256+p[j+2];if(c)lit++;if(!allowed.has(c))invalid++;}
    const marks=new Float32Array(r.markCount*8);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,r.buffers[0].buffers[r.buffers[0].read]);r.gl.getBufferSubData(r.gl.ARRAY_BUFFER,0,marks);r.gl.bindBuffer(r.gl.ARRAY_BUFFER,null);const forms=new Set();for(let j=0;j<r.markCount;j++)forms.add(marks[j*8]);
    return {id:s.id,turn,time,lit,invalid,forms:[...forms],glError:r.gl.getError(),png:r.canvas.toDataURL().split(',')[1]};
   },{i,turn,time});assert.equal(result.glError,0,result.id);assert.equal(result.invalid,0,result.id);assert(result.forms.every(g=>Number.isInteger(g)&&g>=0&&g<32));pictures.push(Buffer.from(result.png,'base64'));delete result.png;checks.push(result);
  }
  // A real scene may have a dark rear wall or a blank sky. Coverage is tested
  // against the source fabric separately, rather than inventing missing detail.
  assert(checks.some(x=>x.lit>100),checks[0].id+' is entirely empty');
  const id=checks[0].id,raw=await sharp({create:{width:640,height:1440,channels:4,background:'#000'}}).composite(pictures.map((input,j)=>({input,left:0,top:j*360}))).raw().toBuffer();
  await sharp(raw,{raw:{width:640,height:1440,channels:4,pageHeight:360}}).webp({quality:78,loop:0,delay:[650,650,650,650]}).toFile('previews/spatial-frames/'+id+'.webp');
  if(i%32===0)for(let turn=0;turn<4;turn++)contact.push({input:await sharp(pictures[turn]).resize(320,180).toBuffer(),left:turn*320,top:i/32*180});
  report.presets.push({id,headings:checks});if(i%32===0)console.log('Panoramas '+(i+1)+'/256');
 }
 await sharp({create:{width:1280,height:1440,channels:3,background:'#000'}}).composite(contact).png().toFile('previews/spatial/full-360.png');
 report.navigation=await page.evaluate(async()=>{const a=window.__V32,r=a.renderer;await r.prefetchSpace(a.videoPresets[0]);r.setScene(a.videoPresets[0]);const draw=(yaw,t=7)=>{r.render(t,{},{...a.settings,camera:'hold',yaw,pitch:0,budget:8000});return r.canvas.toDataURL();};const first=draw(0),rear=draw(Math.PI),wrapped=draw(Math.PI*2),later=draw(0,23);return {seamlessWrap:first===wrapped,rearDiffers:first!==rear,framesEvolve:first!==later,glError:r.gl.getError()};});
 assert(report.navigation.seamlessWrap&&report.navigation.rearDiffers&&report.navigation.framesEvolve);assert.equal(report.navigation.glError,0);assert.equal(report.errors.length,0);report.pass=true;
 console.log(JSON.stringify({pass:true,presets:report.presets.length,headings:report.presets.length*4,navigation:report.navigation}));
}catch(error){report.pass=false;report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await writeFile('docs/panorama-report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.close();}
