import {OPERATORS,EFFECTS,RELATIONS} from './operators.mjs';
import {glyphAtlas,formLookup} from './glyphs.mjs';
import {cameraMatrix} from './math.mjs';
const common=`
precision highp float;precision highp int;
uniform float clock,phaseOffset,worldScale,markSize,stability,envelope,blackFloor;
uniform vec4 features,mapping;uniform vec3 scaling,offset,rotation;uniform mat4 viewProjection;
uniform int op,partner,relation,effect,cut;uniform vec4 domain;uniform vec2 viewport;
uniform float hueOffset,sampleCount;uniform int fixedGlyph;
uniform highp usampler2D forms;uniform sampler2D descriptors;
vec2 sampleUV(float i){return domain.xy+fract(vec2(.5)+i*vec2(.754877666,.569840296))*domain.zw;}
`;
const selection=`
vec4 structure(vec2 uv){
 vec3 p=surface(uv),p1=surface(uv+vec2(.002,0)),p2=surface(uv+vec2(0,.002));
 vec4 clip=viewProjection*vec4(p,1),c1=viewProjection*vec4(p1,1);
 vec2 tangent=c1.xy/max(.1,c1.w)-clip.xy/max(.1,clip.w);tangent.x*=viewport.x/viewport.y;
 float angle=mod(atan(tangent.y,tangent.x)+3.14159265,3.14159265);
 vec3 normal=normalize(cross(p1-p,p2-p)+vec3(1e-5));
 float density=clamp(.16+.37*abs(normal.y)+.14*dot(features,mapping)+.11*sin(uv.x*TAU*2.+phaseOffset),0.,.9);
 int bias=abs(normal.x)>.68?(normal.x>0.?1:2):abs(normal.z)>.78?(normal.z>0.?3:4):0;
 return vec4(angle,density,float(bias),.55+.45*abs(dot(normal,normalize(vec3(1,2,3)))));
}
float formError(int g,vec4 intent){
 vec4 d=texelFetch(descriptors,ivec2(g,0),0),o=texelFetch(descriptors,ivec2(g,1),0);
 float bin=mod(intent.x/3.14159265*4.+2.,4.);vec4 target=vec4(0);target[int(mod(floor(bin+.5),4.))]=1.;
 vec2 center=vec2(.5);if(intent.z==1.)center.x=.72;if(intent.z==2.)center.x=.28;if(intent.z==3.)center.y=.72;if(intent.z==4.)center.y=.28;
 return abs(d.x-intent.y)*2.+length(d.yz-center)*.7+dot(abs(o-target),vec4(.27));
}
`;
const update=`
layout(location=0) in vec2 previous;out vec2 nextState;out vec3 worldPosition;out vec3 markColor;
vec3 hsv(float h,float s,float v){vec3 p=abs(fract(vec3(h)+vec3(0.,2./3.,1./3.))*6.-3.);return v*mix(vec3(1),clamp(p-1.,0.,1.),s);}
void main(){
 vec2 uv=sampleUV(float(gl_VertexID));vec4 intent=structure(uv);
 ivec2 cell=ivec2(clamp(floor(intent.x/3.14159265*32.),0.,31.),int(intent.z)*12+int(clamp(floor(intent.y/.9*11.),0.,11.)));
 int best=int(texelFetch(forms,cell,0).r),old=int(previous.x);
 float improvement=formError(old,intent)-formError(best,intent);
 bool change=previous.y<0.||clock<previous.y||((clock-previous.y)>.18+stability*.6 && improvement>.015+stability*.21);
 nextState=change?vec2(float(best),clock):previous;worldPosition=surface(uv);
 if(relation==4&&length(shape(partner,uv)-shape(op,uv))<.48)worldPosition=vec3(999);
 float wave=sin(uv.y*15.-clock*.8+features.x*1.7),hue=uv.x*.83+uv.y*.24+hueOffset+wave*.025;
 float value=clamp((.55+intent.w*.3+wave*.10)*(.9+dot(features,mapping)*.10),0.,1.);
 vec3 rgb=hsv(hue,.87,value);
 if(dot(rgb,vec3(.299,.587,.114))<blackFloor)nextState.x=0.;
 markColor=paletteColor(rgb*255.);gl_Position=vec4(0);
}
`;
const draw=`
const float TAU=6.28318530718;
layout(location=0) in vec2 state;layout(location=1) in vec3 position;layout(location=2) in vec3 markColor;
out vec2 bitmapUV;flat out int glyph;flat out vec3 color;
void main(){
 float id=float(gl_InstanceID);vec2 uv=sampleUV(id);vec4 at=viewProjection*vec4(position,1);
 glyph=fixedGlyph>=0?fixedGlyph:int(state.x);
 bool visible=fract(id*.61803398875)<envelope;
 if(cut==1)visible=visible&&abs(uv.x-.5)>.07;
 if(cut==2)visible=visible&&sin(uv.x*32.)*sin(uv.y*32.)<.66;
 if(cut==3)visible=visible&&(uv.y<.16||uv.y>.84);
 if(cut==4)visible=visible&&sin(uv.y*TAU*5.)>-.12;
 if(cut==5)visible=visible&&uv.x<.64;
 if(cut==6)visible=visible&&sin(uv.x*TAU*7.)>.0;
 if(position.x>99.)visible=false;
 if(!visible || at.w<.08){gl_Position=vec4(4,4,4,1);bitmapUV=vec2(0);color=vec3(0);return;}
 vec2 corners[6]=vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
 vec2 c=corners[gl_VertexID];bitmapUV=c*.5+.5;
 float halfHeight=clamp(markSize*.027*2.43/max(.12,at.w),1.4/viewport.y,18./viewport.y);
 at.xy+=c*vec2(halfHeight*.5*viewport.y/viewport.x,halfHeight)*at.w;gl_Position=at;
 color=markColor;
}
`;
const fragment=`#version 300 es
precision highp float;precision highp int;
uniform sampler2D atlas;in vec2 bitmapUV;flat in int glyph;flat in vec3 color;out vec4 pixel;
void main(){ivec2 cell=ivec2(clamp(floor(bitmapUV.x*8.),0.,7.)+float(glyph*8),clamp(floor((1.-bitmapUV.y)*16.),0.,15.));if(texelFetch(atlas,cell,0).r<.5)discard;pixel=vec4(color,1.);}
`;
const dummy=`#version 300 es\nprecision highp float;out vec4 pixel;void main(){pixel=vec4(0);}`;
function program(gl,vs,fs,feedback) {
 const p=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);
 }
 if(feedback)gl.transformFeedbackVaryings(p,['nextState','worldPosition','markColor'],gl.INTERLEAVED_ATTRIBS);
 gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
}
export class GlyphRenderer {
 static async create(canvas){const [shapes,color]=await Promise.all(['shapes.glsl','color.glsl'].map(async file=>(await fetch(new URL(file,import.meta.url))).text()));return new GlyphRenderer(canvas,shapes,color);}
 constructor(canvas,shapes,color){
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:new URLSearchParams(location.search).has('dev'),powerPreference:'low-power'});
  if(!gl)throw Error('WebGL2 is unavailable. Enable browser hardware acceleration, then reload.');
  gl.disable(gl.BLEND);gl.disable(gl.DITHER);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,1);
  this.programs=[program(gl,'#version 300 es\n'+common+shapes+selection+color+update,dummy,true),program(gl,'#version 300 es\n'+common+draw,fragment)];
  this.uniforms=this.programs.map(p=>Object.fromEntries(['clock','phaseOffset','worldScale','markSize','stability','envelope','blackFloor','features','mapping','scaling','offset','rotation','viewProjection','op','partner','relation','effect','cut','domain','viewport','hueOffset','sampleCount','fixedGlyph','forms','descriptors','colors','atlas','toneRamp','colorGrade','colorBoost','colorMode','trueColor'].map(n=>[n,gl.getUniformLocation(p,n)])));
  const forms=formLookup();this.textures=[];
  this.makeTexture(0,gl.R8,gl.RED,gl.UNSIGNED_BYTE,256,16,glyphAtlas());
  this.makeTexture(1,gl.R8UI,gl.RED_INTEGER,gl.UNSIGNED_BYTE,32,60,forms.pixels);
  this.makeTexture(2,gl.RGBA32F,gl.RGBA,gl.FLOAT,32,2,forms.info);
  this.toneTexture=this.makeTexture(4,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,256,1,new Uint8Array(1024));
  this.colorTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_3D,this.colorTexture);
  gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T,gl.TEXTURE_WRAP_R])gl.texParameteri(gl.TEXTURE_3D,k,gl.CLAMP_TO_EDGE);
  gl.texImage3D(gl.TEXTURE_3D,0,gl.RGBA8,32,32,32,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(32768*4));
  this.paletteWorker=new Worker(new URL('./palette-worker.mjs',import.meta.url),{type:'module'});this.paletteRequest=0;
  this.paletteWorker.onmessage=({data})=>{if(data.id!==this.paletteRequest)return;if(data.error){this.paletteError=data.error;return;}gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_3D,this.colorTexture);gl.texImage3D(gl.TEXTURE_3D,0,gl.RGBA8,32,32,32,0,gl.RGBA,gl.UNSIGNED_BYTE,data.lut);gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,this.toneTexture);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,1,gl.RGBA,gl.UNSIGNED_BYTE,data.ramp);this.colorTreatment={grade:data.grade,colorMode:data.colorMode,trueColor:data.trueColor};this.palette=data.palette;for(const state of this.buffers)state.lastUpdate=-1;this.paletteReady=true;this.onPalette?.();};
  this.buffers=[];this.frameTimes=new Float32Array(1800);this.frameCursor=0;this.resourceCount=0;this.fixedGlyph=-1;
 }
 makeTexture(unit,internal,format,type,w,h,pixels){const gl=this.gl,t=gl.createTexture();this.textures.push(t);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,internal,w,h,0,format,type,pixels);return t;}
 setPalette(settings){this.paletteReady=false;this.onPalettePending?.();this.paletteWorker.postMessage({id:++this.paletteRequest,palette:settings.palette,depth:settings.depth});}
 setScene(scene){
  const gl=this.gl;for(const layer of this.buffers){layer.buffers.forEach(b=>gl.deleteBuffer(b));layer.vaos.forEach(v=>gl.deleteVertexArray(v));gl.deleteTransformFeedback(layer.tf);}
  this.scene=scene;this.buffers=scene.layers.map(()=>{
   const init=new Float32Array(64000);for(let i=0;i<8000;i++)init[i*8+1]=-1;
   const buffers=[],vaos=[];
   for(let j=0;j<2;j++){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,init,gl.DYNAMIC_COPY);const v=gl.createVertexArray();vaos.push(v);gl.bindVertexArray(v);for(const [i,n,offset]of [[0,2,0],[1,3,8],[2,3,20]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,32,offset);}}
   return {buffers,vaos,tf:gl.createTransformFeedback(),read:0,lastUpdate:-1};
  });gl.bindVertexArray(null);gl.bindBuffer(gl.ARRAY_BUFFER,null);this.resourceCount=this.buffers.length*5+this.textures.length+1;
 }
 resize(width,height,scale=1){const w=Math.max(1,Math.floor(width*scale)),h=Math.max(1,Math.floor(height*scale));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}}
 uniformsFor(which,t,layer,features,settings,envelope,count){
  const gl=this.gl,p=this.programs[which],u=this.uniforms[which];gl.useProgram(p);
  const floats={clock:t,phaseOffset:layer.phase,worldScale:settings.sceneScale,markSize:settings.markSize,stability:settings.stability,envelope,blackFloor:settings.blackFloor,hueOffset:layer.hue,sampleCount:count};
  for(const [k,v]of Object.entries(floats))gl.uniform1f(u[k],v);
  gl.uniform2fv(u.colorGrade,this.colorTreatment.grade);gl.uniform2f(u.colorBoost,settings.brightness,settings.boost);gl.uniform1i(u.colorMode,this.colorTreatment.colorMode);gl.uniform1i(u.trueColor,this.colorTreatment.trueColor?1:0);gl.uniform1i(u.toneRamp,4);
  const i=['bass','mid','treble','onset'].indexOf(layer.audio),mapping=[0,0,0,0];if(i>=0)mapping[i]=1;else mapping[1]=1;
  gl.uniform4f(u.features,features.bass||0,i<0?features.trend||0:features.mid||0,features.treble||0,features.onset||0);
  gl.uniform4fv(u.mapping,mapping);gl.uniform3fv(u.scaling,layer.scale);gl.uniform3fv(u.offset,layer.offset);gl.uniform3fv(u.rotation,layer.rotate);
  gl.uniform4fv(u.domain,layer.domain);gl.uniform2f(u.viewport,this.canvas.width,this.canvas.height);gl.uniformMatrix4fv(u.viewProjection,false,cameraMatrix(t,this.scene,this.canvas.width/this.canvas.height,settings));
  for(const [k,v]of Object.entries({op:OPERATORS.indexOf(layer.op),partner:OPERATORS.indexOf(layer.partner),relation:RELATIONS.indexOf(layer.relation),effect:EFFECTS.indexOf(layer.effect),cut:['none','slit','pores','rim','bands','open','petals'].indexOf(layer.cut),fixedGlyph:this.fixedGlyph,atlas:0,forms:1,descriptors:2,colors:3}))gl.uniform1i(u[k],v);
 }
 render(t,features,settings,envelope=1){
  if(!this.scene||!this.paletteReady)return;const start=performance.now(),gl=this.gl;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const count=Math.min(8000,Math.max(128,Math.floor(Math.min(settings.budget||10000,this.scene.budget)*settings.density/this.scene.layers.length)));
  this.scene.layers.forEach((layer,j)=>{
   const state=this.buffers[j];
   if(t-state.lastUpdate>=1/30||state.lastUpdate<0||t<state.lastUpdate){
    this.uniformsFor(0,t,layer,features,settings,envelope,count);gl.bindVertexArray(state.vaos[state.read]);for(let i=0;i<3;i++)gl.vertexAttribDivisor(i,0);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,state.tf);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,state.buffers[1-state.read]);
    gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,count);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,null);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);state.read=1-state.read;state.lastUpdate=t;
   }
   this.uniformsFor(1,t,layer,features,settings,envelope,count);gl.bindVertexArray(state.vaos[state.read]);for(let i=0;i<3;i++)gl.vertexAttribDivisor(i,1);gl.drawArraysInstanced(gl.TRIANGLES,0,6,count);
  });gl.bindVertexArray(null);this.markCount=count*this.scene.layers.length;this.frameTimes[this.frameCursor++%1800]=performance.now()-start;
 }
 pixels(){const gl=this.gl,out=new Uint8Array(this.canvas.width*this.canvas.height*4);gl.readPixels(0,0,this.canvas.width,this.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,out);return out;}
 dispose(){const gl=this.gl;this.paletteWorker.terminate();for(const s of this.buffers){s.buffers.forEach(b=>gl.deleteBuffer(b));s.vaos.forEach(v=>gl.deleteVertexArray(v));gl.deleteTransformFeedback(s.tf);}this.textures.forEach(t=>gl.deleteTexture(t));gl.deleteTexture(this.colorTexture);this.programs.forEach(p=>gl.deleteProgram(p));}
}
