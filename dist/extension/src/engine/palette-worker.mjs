import {getPaletteBundle,styledColor,hueColor,colorTreatment} from './palette-library.mjs';
self.onmessage=({data})=>{
 try {
  const {id,palette,depth}=data;
  const bundle=getPaletteBundle(palette,depth),lut=new Uint8Array(32*32*32*4),ramp=new Uint8Array(256*4);
  if(bundle)for(let i=0;i<32768;i++){
   const color=bundle.palette[bundle.lookup[i]];lut.set([...color,255],i*4);
  }
  const treatment=colorTreatment(palette);
  for(let i=0;i<256;i++){const c=styledColor(palette,i,i,i);ramp.set(treatment.colorMode===3?[...hueColor(palette,i/255),255]:[c>>16&255,c>>8&255,c&255,255],i*4);}
  self.postMessage({id,lut,ramp,...treatment,trueColor:depth==='truecolor',palette:bundle?.palette||null},[lut.buffer,ramp.buffer]);
 }catch(e){self.postMessage({id:data.id,error:e.message});}
};
