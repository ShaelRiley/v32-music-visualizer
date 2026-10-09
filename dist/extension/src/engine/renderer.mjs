import {OPERATORS,EFFECTS,RELATIONS} from './operators.mjs';
import {glyphAtlas,formLookup} from './glyphs.mjs';
import {cameraMatrix} from './math.mjs';
import {musicalActivity,musicalDrive} from '../audio/motion.mjs';
import {SpaceCache,SPACE_VIEWS,SPACE_SOURCES} from './spaces.mjs';
import {VideoCache} from './vr.mjs';
import {COLOR_ROLES} from './scenes.mjs';
const common=`
precision highp float;precision highp int;
uniform float clock,phaseOffset,worldScale,markSize,stability,envelope,blackFloor,activity,signal,interpolation;
uniform vec4 features,mapping;uniform vec3 scaling,offset,rotation;uniform mat4 viewProjection;
uniform int op,partner,relation,effect,cut,spaceMode,colorRole;uniform float spaceWarp;uniform vec2 spaceHeight;uniform sampler2D spaceFabric,videoFabric;uniform vec4 domain;uniform vec2 viewport;
uniform float hueOffset,sampleCount;uniform int fixedGlyph;
uniform highp usampler2D forms;uniform sampler2D descriptors;
vec2 sampleUV(float i){if(spaceMode==2){int at=(int(i)*4093)%8192;return (vec2(at%128,at/128)+.5)/vec2(128,64);}return spaceMode==1?vec2((i+.5)/8192.,fract(.5+i*.569840296)):domain.xy+fract(vec2(.5)+i*vec2(.754877666,.569840296))*domain.zw;}
vec3 fabric(vec2 uv,int field){int at=int(clamp(floor(uv.x*8192.),0.,8191.))*2+field;return texelFetch(spaceFabric,ivec2(at%256,at/256),0).xyz;}
float material(vec2 uv){int at=int(clamp(floor(uv.x*8192.),0.,8191.))*2+1;return texelFetch(spaceFabric,ivec2(at%256,at/256),0).w;}
`;
const selection=`
vec4 structure(vec2 uv){
 vec3 p=surface(uv),p1,p2;
 if(spaceMode==1){vec3 n=fabric(uv,1),a=normalize(cross(n,abs(n.y)<.9?vec3(0,1,0):vec3(1,0,0)));p1=surfaceAt(uv,a*.02);p2=surfaceAt(uv,cross(n,a)*.02);}
 else{p1=surface(uv+vec2(.002,0));p2=surface(uv+vec2(0,.002));}
 vec4 clip=viewProjection*vec4(p,1),c1=viewProjection*vec4(p1,1);
 vec2 tangent=c1.xy/max(.1,c1.w)-clip.xy/max(.1,clip.w);tangent.x*=viewport.x/viewport.y;
 float angle=mod(atan(tangent.y,tangent.x)+3.14159265,3.14159265);
 vec3 normal=normalize(cross(p1-p,p2-p)+vec3(1e-5));
 float density=clamp(.34+.20*abs(normal.y)+.08*sin(uv.x*TAU*2.+phaseOffset),.22,.72);
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
vec3 videoRGB(vec3 packed){int code=int(round(packed.g*255.))*256+int(round(packed.b*255.));return vec3((code>>11)&31,(code>>5)&63,code&31)/vec3(31,63,31);}
void main(){
 vec2 uv=sampleUV(float(gl_VertexID));
 if(spaceMode==2){
  float cycle=mod(clock*.45,16.),frame=cycle<8.?cycle:16.-cycle;int lo=int(floor(frame)),hi=min(8,lo+1);ivec2 at=ivec2(floor(uv*vec2(128,64)));
  vec3 a=texelFetch(videoFabric,at+ivec2(0,lo*64),0).rgb,b=texelFetch(videoFabric,at+ivec2(0,hi*64),0).rgb;
  int best=int(round(a.r*255.));bool change=previous.y<0.||clock<previous.y||clock-previous.y>.16+stability*.20;
  nextState=change?vec2(float(best),clock):previous;worldPosition=surface(uv);
  vec3 rgb=mix(videoRGB(a),videoRGB(b),fract(frame));if(dot(rgb,vec3(.299,.587,.114))<blackFloor)nextState.x=0.;
  markColor=paletteColor(rgb*255.);gl_Position=vec4(0);return;
 }
 vec4 intent=structure(uv);
 ivec2 cell=ivec2(clamp(floor(intent.x/3.14159265*32.),0.,31.),int(intent.z)*12+int(clamp(floor(intent.y/.9*11.),0.,11.)));
 int best=int(texelFetch(forms,cell,0).r),old=int(previous.x);
 float improvement=formError(old,intent)-formError(best,intent);
 float dwell=.4+stability*.9+fract(uv.x*17.3+uv.y*11.7)*.4;
 bool change=previous.y<0.||clock<previous.y||((clock-previous.y)>dwell && improvement>.035+stability*.25);
 nextState=change?vec2(float(best),clock):previous;worldPosition=surface(uv);
 if(relation==4&&length(shape(partner,uv)-shape(op,uv))<.48)worldPosition=vec3(999);
 // Music changes space, spin and size, never per-mark brightness or presence.
 // Color roles describe the construction, using its resting coordinates.
 // They stay anchored to the surface while audio bends it around them.
 float anchors[9]=float[9](.18,.70,.48,.84,.12,.88,.04,.48,.35);
 float hue=anchors[colorRole]+hueOffset*.035,value=.87;
 vec3 resting=shapeTime(op,uv,0.);
 if(op==4||op==5||op==11||op==19||op==30||op==31){float elevation=clamp(resting.y*.65+.5,0.,1.);hue+=(floor(elevation*4.)/3.-.5)*.18;value=.71+.22*elevation;}
 else if(op==3||op==6||op==9||op==21||op==26||op==28){hue+=floor(uv.y*(op==28?3.:4.))*.035;value=.79+.12*cos(uv.y*TAU);}
 else if(op==17||op==24||op==25){hue+=floor(uv.x*6.)*.022;value=.80+.12*abs(resting.y);}
 else {hue+=(floor(uv.y*4.)/3.-.5)*.075;value=.78+.14*(.5+.5*cos(uv.y*TAU));}
 if(spaceMode==1){
  vec3 source=fabric(uv,0),normal=fabric(uv,1);int surfaceClass=int(material(uv));
  float height=clamp((source.y-spaceHeight.x)/max(.01,spaceHeight.y-spaceHeight.x),0.,1.);
  if(surfaceClass==4){float terrace=floor(height*5.)/4.;hue=.08+terrace*.35+abs(normal.y)*.04;value=.68+height*.24;}
  else {hue=surfaceClass==0?.05:surfaceClass==1?.20:surfaceClass==2?.67:.42;value=surfaceClass==0?.74:surfaceClass==1?.88:surfaceClass==2?.93:.68;hue+=floor(height*3.)*.018;}
  hue+=hueOffset*.025;
 }
 vec3 rgb=hsv(hue,.87,value);
 if(dot(rgb,vec3(.299,.587,.114))<blackFloor)nextState.x=0.;
 markColor=paletteColor(rgb*255.);gl_Position=vec4(0);
}
`;
const draw=`
const float TAU=6.28318530718;
layout(location=0) in vec2 state;layout(location=1) in vec3 position;layout(location=2) in vec3 markColor;layout(location=3) in vec3 previousPosition;
out vec2 bitmapUV;flat out int glyph;flat out vec3 color;
void main(){
 float id=float(gl_InstanceID);vec2 uv=sampleUV(id);
 vec3 flowingPosition=position.x>99.||previousPosition.x>99.?position:mix(previousPosition,position,interpolation);
 vec4 at=viewProjection*vec4(flowingPosition,1);
 glyph=fixedGlyph>=0?fixedGlyph:int(state.x);
 bool visible=true;
 if(cut==1)visible=visible&&abs(uv.x-.5)>.07;
 if(cut==2)visible=visible&&sin(uv.x*32.)*sin(uv.y*32.)<.66;
 if(cut==3)visible=visible&&(uv.y<.16||uv.y>.84);
 if(cut==4)visible=visible&&sin(uv.y*TAU*5.)>-.12;
 if(cut==5)visible=visible&&uv.x<.64;
 if(cut==6)visible=visible&&sin(uv.x*TAU*7.)>.0;
 if(position.x>99.)visible=false;
 if(!visible || at.w<(spaceMode==1?.003:.08)){gl_Position=vec4(4,4,4,1);bitmapUV=vec2(0);color=vec3(0);return;}
 vec2 corners[6]=vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
 vec2 c=corners[gl_VertexID];bitmapUV=c*.5+.5;
 float halfHeight=clamp(markSize*.018*2.43/max(.12,at.w),1.4/viewport.y,16./viewport.y);
 halfHeight*=1.+.10*activity+.12*features.w;
 float spin=.28*sin(uv.x*9.+uv.y*5.+clock*.65+phaseOffset)*activity+.38*features.w*sin(uv.y*7.+phaseOffset);
 vec2 local=c*vec2(halfHeight*.5,halfHeight);
 local=mat2(cos(spin),sin(spin),-sin(spin),cos(spin))*local;
 at.xy*=.96+.04*envelope;
 at.xy+=local*vec2(viewport.y/viewport.x,1.)*at.w;gl_Position=at;
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
  this.uniforms=this.programs.map(p=>Object.fromEntries(['clock','phaseOffset','worldScale','markSize','stability','envelope','blackFloor','activity','signal','interpolation','spaceMode','spaceWarp','spaceHeight','spaceFabric','videoFabric','colorRole','features','mapping','scaling','offset','rotation','viewProjection','op','partner','relation','effect','cut','domain','viewport','hueOffset','sampleCount','fixedGlyph','forms','descriptors','colors','atlas','toneRamp','colorGrade','colorBoost','colorMode','trueColor'].map(n=>[n,gl.getUniformLocation(p,n)])));
  const forms=formLookup();this.textures=[];
  this.makeTexture(0,gl.R8,gl.RED,gl.UNSIGNED_BYTE,256,16,glyphAtlas());
  this.makeTexture(1,gl.R8UI,gl.RED_INTEGER,gl.UNSIGNED_BYTE,32,60,forms.pixels);
  this.makeTexture(2,gl.RGBA32F,gl.RGBA,gl.FLOAT,32,2,forms.info);
  this.toneTexture=this.makeTexture(4,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,256,1,new Uint8Array(1024));
  this.spaceTexture=this.makeTexture(5,gl.RGBA32F,gl.RGBA,gl.FLOAT,256,64,new Float32Array(65536));this.spaceCache=new SpaceCache();this.spaceRequest=0;this.spaceReady=true;
  this.videoTexture=this.makeTexture(6,gl.RGB8,gl.RGB,gl.UNSIGNED_BYTE,128,576,new Uint8Array(128*576*3));this.videoCache=new VideoCache();
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
  const request=++this.spaceRequest;this.spaceReady=!scene.space&&!scene.video;this.sceneError=null;
  const gl=this.gl;for(const layer of this.buffers){layer.buffers.forEach(b=>gl.deleteBuffer(b));layer.vaos.forEach(v=>gl.deleteVertexArray(v));gl.deleteTransformFeedback(layer.tf);}
  this.scene=scene;this.buffers=scene.layers.map(()=>{
   const init=new Float32Array(64000);for(let i=0;i<8000;i++)init[i*8+1]=-1;
   const buffers=[],vaos=[];
   for(let j=0;j<2;j++){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,init,gl.DYNAMIC_COPY);const v=gl.createVertexArray();vaos.push(v);gl.bindVertexArray(v);for(const [i,n,offset]of [[0,2,0],[1,3,8],[2,3,20]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,32,offset);}}
   return {buffers,vaos,tf:gl.createTransformFeedback(),read:0,lastUpdate:-1};
  });gl.bindVertexArray(null);gl.bindBuffer(gl.ARRAY_BUFFER,null);this.resourceCount=this.buffers.length*5+this.textures.length+1;
  if(scene.space){const upload=data=>{if(this.spaceRequest!==request)return;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.spaceTexture);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,64,gl.RGBA,gl.FLOAT,data);this.spaceReady=true;};const entry=this.spaceCache.entries.get(scene.space.view);if(entry?.data)upload(entry.data);else this.prefetchSpace(scene).then(upload).catch(e=>{if(request===this.spaceRequest){this.sceneError=e.message;this.onSceneError?.(e);}});}
  if(scene.video){const upload=bitmap=>{if(this.spaceRequest!==request)return;gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,this.videoTexture);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGB,gl.UNSIGNED_BYTE,bitmap);this.spaceReady=true;};const entry=this.videoCache.entries.get(scene.video.view);if(entry?.bitmap)upload(entry.bitmap);else this.prefetchSpace(scene).then(upload).catch(e=>{if(request===this.spaceRequest){this.sceneError=e.message;this.onSceneError?.(e);}});}
 }
 prefetchSpace(scene){return scene.space?this.spaceCache.prefetch(scene.space.view):scene.video?this.videoCache.prefetch(scene.video.view):Promise.resolve();}
 resize(width,height,scale=1){const w=Math.max(1,Math.floor(width*scale)),h=Math.max(1,Math.floor(height*scale));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}}
 uniformsFor(which,t,layer,features,settings,envelope,count,interpolation=1){
  const gl=this.gl,p=this.programs[which],u=this.uniforms[which];gl.useProgram(p);
  const view=this.scene.space?SPACE_VIEWS.get(this.scene.space.view):null;
  const bounds=view?SPACE_SOURCES.get(view.source).bounds:[[0,0,0],[1,1,1]];gl.uniform2f(u.spaceHeight,bounds[0][1],bounds[1][1]);
  const floats={clock:t,phaseOffset:layer.phase,worldScale:settings.sceneScale,markSize:settings.markSize*(view?.markScale||1),stability:settings.stability,envelope,blackFloor:settings.blackFloor,hueOffset:layer.hue,sampleCount:count,activity:musicalActivity(features),signal:musicalDrive(features,layer.audio),interpolation,spaceWarp:(view?.warp||1)*.45};
  for(const [k,v]of Object.entries(floats))gl.uniform1f(u[k],v);
  gl.uniform2fv(u.colorGrade,this.colorTreatment.grade);gl.uniform2f(u.colorBoost,settings.brightness,settings.boost);gl.uniform1i(u.colorMode,this.colorTreatment.colorMode);gl.uniform1i(u.trueColor,this.colorTreatment.trueColor?1:0);gl.uniform1i(u.toneRamp,4);
  const i=['bass','mid','treble','onset'].indexOf(layer.audio),mapping=[0,0,0,0];if(i>=0)mapping[i]=1;else mapping[1]=1;
  gl.uniform4f(u.features,features.bass||0,features.mid||0,features.treble||0,features.onset||0);
  gl.uniform4fv(u.mapping,mapping);gl.uniform3fv(u.scaling,layer.scale);gl.uniform3fv(u.offset,layer.offset);gl.uniform3fv(u.rotation,layer.rotate);
  gl.uniform4fv(u.domain,layer.domain);gl.uniform2f(u.viewport,this.canvas.width,this.canvas.height);gl.uniformMatrix4fv(u.viewProjection,false,cameraMatrix(t,this.scene,this.canvas.width/this.canvas.height,{...settings,audio:features}));
  for(const [k,v]of Object.entries({op:OPERATORS.indexOf(layer.op),partner:OPERATORS.indexOf(layer.partner),relation:RELATIONS.indexOf(layer.relation),effect:EFFECTS.indexOf(layer.effect),cut:['none','slit','pores','rim','bands','open','petals'].indexOf(layer.cut),fixedGlyph:this.fixedGlyph,atlas:0,forms:1,descriptors:2,colors:3,spaceFabric:5,videoFabric:6,spaceMode:view?1:this.scene.video?2:0,colorRole:Math.max(0,COLOR_ROLES.indexOf(layer.colorRole))}))gl.uniform1i(u[k],v);
 }
 render(t,features,settings,envelope=1){
  if(!this.scene||!this.paletteReady||!this.spaceReady)return;const start=performance.now(),gl=this.gl;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const count=Math.min(8000,Math.max(128,Math.floor(Math.min(settings.budget||10000,this.scene.budget)*settings.density/this.scene.layers.length)));
  this.scene.layers.forEach((layer,j)=>{
   const state=this.buffers[j];
   // Keep expensive form analysis at 30 Hz. Drawing blends the last two poses
   // on every display frame, with one analysis tick of latency and no CPU copy.
   const tick=Math.floor((t+1e-7)*30)/30;
   if(tick>state.lastUpdate+1e-7||state.lastUpdate<0||tick<state.lastUpdate){
    state.smooth=state.lastUpdate>=0&&Math.abs(tick-state.lastUpdate-1/30)<1e-5;
    this.uniformsFor(0,tick,layer,features,settings,envelope,count);gl.bindVertexArray(state.vaos[state.read]);
    gl.bindBuffer(gl.ARRAY_BUFFER,state.buffers[state.read]);gl.vertexAttribPointer(3,3,gl.FLOAT,false,32,8);gl.disableVertexAttribArray(3);for(let i=0;i<3;i++)gl.vertexAttribDivisor(i,0);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,state.tf);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,state.buffers[1-state.read]);
    gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,count);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,null);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);state.read=1-state.read;state.lastUpdate=tick;
   }
   const blend=state.smooth?Math.min(1,Math.max(0,(t-state.lastUpdate)*30)):1;
   this.uniformsFor(1,t,layer,features,settings,envelope,count,blend);gl.bindVertexArray(state.vaos[state.read]);for(let i=0;i<3;i++)gl.vertexAttribDivisor(i,1);
   gl.bindBuffer(gl.ARRAY_BUFFER,state.buffers[1-state.read]);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,3,gl.FLOAT,false,32,8);gl.vertexAttribDivisor(3,1);gl.drawArraysInstanced(gl.TRIANGLES,0,6,count);
  });gl.bindVertexArray(null);this.markCount=count*this.scene.layers.length;this.frameTimes[this.frameCursor++%1800]=performance.now()-start;
 }
 pixels(){const gl=this.gl,out=new Uint8Array(this.canvas.width*this.canvas.height*4);gl.readPixels(0,0,this.canvas.width,this.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,out);return out;}
 dispose(){this.spaceRequest++;this.videoCache.dispose();const gl=this.gl;this.paletteWorker.terminate();for(const s of this.buffers){s.buffers.forEach(b=>gl.deleteBuffer(b));s.vaos.forEach(v=>gl.deleteVertexArray(v));gl.deleteTransformFeedback(s.tf);}this.textures.forEach(t=>gl.deleteTexture(t));gl.deleteTexture(this.colorTexture);this.programs.forEach(p=>gl.deleteProgram(p));}
}
