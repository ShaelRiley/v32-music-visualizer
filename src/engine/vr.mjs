import {VR_DATA} from '../../assets/vr/manifest.mjs';
import {FabricCache} from './fabric-cache.mjs';
import {scene,layer,validateScene} from './scenes.mjs';
export const VR_VIEWS=new Map(VR_DATA.views.map(v=>[v.id,v]));
export const VR_PRESETS=VR_DATA.views.map((v,i)=>validateScene(scene('vr-'+v.id,v.name,'spherical-video',[layer('wave',{effect:'still',audio:['bass','mid','treble','trend'][i%4],phase:i*.17%6.28})],{
 video:{view:v.id},camera:'passage',budget:8000,
 description:'A full 360° glyph panorama of licensed spherical footage. Drag to look around, or follow the camera through a complete turn.',
 audioBehavior:'Music continuously bends and ripples the image surface; beats rotate its marks. Source image detail chooses the glyph shapes and color placement.',
 distinction:'One of 256 distinct source videos. A slow nine-frame spherical study with matched canonical forms, not a mesh or stereoscopic depth reconstruction.'
})));
export class VideoCache {
 constructor(){this.entries=new Map();this.fabrics=new FabricCache('vr');}
 prefetch(view){
  if(!VR_VIEWS.has(view))return Promise.reject(Error('Unknown spherical video study'));
  if(this.entries.has(view)){const e=this.entries.get(view);this.entries.delete(view);this.entries.set(view,e);return e.promise;}
  const e={};e.promise=this.fabrics.read(VR_VIEWS.get(view)).then(bytes=>new Blob([bytes],{type:'image/png'})).then(blob=>createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none'})).then(bitmap=>{e.bitmap=bitmap;return bitmap;}).catch(error=>{this.entries.delete(view);throw error;});
  if(this.entries.size>=4){const oldest=this.entries.keys().next().value,old=this.entries.get(oldest);this.entries.delete(oldest);old.promise.then(bitmap=>{if(!this.entries.has(oldest))bitmap.close();}).catch(()=>{});}
  this.entries.set(view,e);return e.promise;
 }
 dispose(){for(const e of this.entries.values())e.promise.then(b=>b.close()).catch(()=>{});this.entries.clear();}
}
