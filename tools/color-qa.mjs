import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {server} from './serve.mjs';
import {PALETTES,quantizeColor,getPaletteBundle} from '../src/engine/palette-library.mjs';
import {rng} from '../src/engine/random.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage();await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);await page.evaluate(()=>window.__V32.pause());
const r=rng('color-parity'),inputs=[[0,0,0],[255,255,255],[127,220,36],[244,44,188]];
while(inputs.length<512)inputs.push([Math.floor(r()*256),Math.floor(r()*256),Math.floor(r()*256)]);
await page.evaluate(async inputs=>{
 const gl=window.__V32.renderer.gl,color=await (await fetch('src/engine/color.glsl')).text(),p=gl.createProgram();
 for(const [type,source]of [[gl.VERTEX_SHADER,'#version 300 es\nprecision highp float;precision highp int;layout(location=0) in vec3 inputRGB;out vec3 result;'+color+'\nvoid main(){result=paletteColor(inputRGB);gl_Position=vec4(0); }'],[gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 pixel;void main(){pixel=vec4(0);}']]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}
 gl.transformFeedbackVaryings(p,['result'],gl.INTERLEAVED_ATTRIBS);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 const vao=gl.createVertexArray(),input=gl.createBuffer(),output=gl.createBuffer(),tf=gl.createTransformFeedback();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,input);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputs.flat()),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,output);gl.bufferData(gl.ARRAY_BUFFER,inputs.length*12,gl.DYNAMIC_COPY);gl.bindVertexArray(null);
 gl.bindBuffer(gl.ARRAY_BUFFER,null);window.__COLOR={p,vao,input,output,tf,count:inputs.length};
},inputs);
const report={environment:'Headless Chromium '+await browser.version()+' / software SwiftShader',inputCount:inputs.length,checks:[],errors:[]};
try{
 for(const palette of PALETTES.filter(p=>p.available))for(const depth of ['truecolor',16]){
  await page.evaluate(({palette,depth})=>{const a=window.__V32;a.settings.palette=palette;a.settings.depth=depth;a.renderer.setPalette(a.settings);},{palette:palette.id,depth});await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
  const output=await page.evaluate(()=>{
   const r=window.__V32.renderer,gl=r.gl,q=window.__COLOR;gl.useProgram(q.p);for(const [k,v]of Object.entries({colors:3,toneRamp:4,colorMode:r.colorTreatment.colorMode,trueColor:r.colorTreatment.trueColor?1:0}))gl.uniform1i(gl.getUniformLocation(q.p,k),v);gl.uniform2fv(gl.getUniformLocation(q.p,'colorGrade'),r.colorTreatment.grade);gl.uniform2f(gl.getUniformLocation(q.p,'colorBoost'),.12,.42);
   gl.bindVertexArray(q.vao);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,q.tf);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,q.output);gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,q.count);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,null);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);gl.bindVertexArray(null);gl.bindBuffer(gl.ARRAY_BUFFER,q.output);const data=new Float32Array(q.count*3);gl.getBufferSubData(gl.ARRAY_BUFFER,0,data);gl.bindBuffer(gl.ARRAY_BUFFER,null);return {colors:[...data].map(v=>Math.round(v*255)),error:gl.getError()};
  });
  let mismatch=0,maxDifference=0,offPalette=0;const allowed=depth===16?new Set(getPaletteBundle(palette.id,16).palette.map(c=>c.join(','))):null;
  for(let i=0;i<inputs.length;i++){const expected=quantizeColor(palette.id,depth,...inputs[i],{brightnessBoost:.12,saturationBoost:.42}),actual=output.colors.slice(i*3,i*3+3);const difference=Math.max(...expected.map((v,j)=>Math.abs(v-actual[j])));if(difference)mismatch++;maxDifference=Math.max(maxDifference,difference);if(allowed&&!allowed.has(actual.join(',')))offPalette++;}
  report.checks.push({palette:palette.id,depth,mismatch,maxDifference,offPalette,glError:output.error});
  if(output.error||offPalette||(depth==='truecolor'&&maxDifference>1))throw Error('GPU color mismatch: '+JSON.stringify(report.checks.at(-1)));
 }
 report.exactMatches=report.checks.reduce((n,c)=>n+inputs.length-c.mismatch,0);report.totalComparisons=report.checks.length*inputs.length;console.log({checks:report.checks.length,exactMatches:report.exactMatches,totalComparisons:report.totalComparisons,trueColorMaxError:Math.max(...report.checks.filter(c=>c.depth==='truecolor').map(c=>c.maxDifference)),finiteMismatches:report.checks.filter(c=>c.depth===16&&c.mismatch)});
}catch(e){report.errors.push(e.message);console.error(e.message);process.exitCode=1;}
await writeFile('docs/color-gpu-report.json',JSON.stringify(report,null,2));await browser.close();server.close();
