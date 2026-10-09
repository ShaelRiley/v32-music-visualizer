import {SPACE_DATA} from '../../assets/spaces/manifest.mjs';
import {FabricCache} from './fabric-cache.mjs';
import {scene,layer,validateScene} from './scenes.mjs';
export const SPACE_SOURCES=new Map(SPACE_DATA.sources.map(s=>[s.id,s]));
export const SPACE_VIEWS=new Map(SPACE_DATA.views.map(s=>[s.id,s]));
export const SPACE_PRESETS=SPACE_DATA.views.map(view=>{
 const source=SPACE_SOURCES.get(view.source);
 return validateScene(scene('space-'+view.id,view.name,source.id,[layer('wave',{effect:'still',audio:['bass','mid','trend','bass','treble','mid','bass','trend'][view.tour],phase:view.tour*.87})],{
  camera:'passage',space:{view:view.id},budget:8000,
  description:source.group+'. A guided glyph journey through '+source.name+', bent and rippled by the music.',
  audioBehavior:'Sustained energy flexes the reconstructed surfaces. Band accents shape traveling waves; beats rotate the marks.',
  distinction:'Licensed source geometry and a distinct authored camera rail. '+source.adaptation
 }));
});

export function decodeSpaceFabric(buffer){
 if(buffer.byteLength!==8192*14)throw Error('Invalid spatial fabric size');
 const input=new DataView(buffer),data=new Float32Array(8192*8);
 for(let i=0;i<8192;i++)for(let j=0;j<3;j++){
  data[i*8+j]=input.getInt16(i*14+j*2,true)/32767*8;
  data[i*8+4+j]=input.getInt16(i*14+6+j*2,true)/32767;
 }
 for(let i=0;i<8192;i++)data[i*8+7]=input.getInt16(i*14+12,true);
 return data;
}
export class SpaceCache {
 constructor(){this.entries=new Map();this.fabrics=new FabricCache('spaces');}
 prefetch(view){
  if(!SPACE_VIEWS.has(view))return Promise.reject(Error('Unknown spatial fabric'));
  if(this.entries.has(view)){const entry=this.entries.get(view);this.entries.delete(view);this.entries.set(view,entry);return entry.promise;}
  const entry={};entry.promise=this.fabrics.read(SPACE_VIEWS.get(view)).then(buffer=>{entry.data=decodeSpaceFabric(buffer);return entry.data;}).catch(e=>{this.entries.delete(view);throw e;});
  if(this.entries.size>=8)this.entries.delete(this.entries.keys().next().value);this.entries.set(view,entry);return entry.promise;
 }
}
