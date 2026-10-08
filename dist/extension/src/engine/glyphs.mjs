import glyphs from './glyph-data.mjs';
import {DESCRIPTORS,buildVideoGlyphFeature} from './descriptors.mjs';
export {glyphs,DESCRIPTORS};
export function glyphAtlas() {
  const pixels=new Uint8Array(8*32*16);
  for(let g=0;g<32;g++)for(let y=0;y<16;y++)for(let x=0;x<8;x++)pixels[y*256+g*8+x]=(glyphs.masks[g][y]&(128>>x))?255:0;
  return pixels;
}
export function score(target,g) {
  let occupancy=0,orientation=0,hamming=0;
  for(let i=0;i<32;i++)hamming+=Math.abs(target.coverage[i]-g.coverage[i]);
  for(let i=0;i<8;i++)occupancy+=Math.abs(target.occupancy[i]-g.occupancy[i]);
  for(let i=0;i<4;i++)orientation+=Math.abs(target.orientation[i]-g.orientation[i]);
  return hamming/32*3.2+Math.abs(target.area-g.area)*1.4+occupancy*.30+(Math.abs(target.centroidX-g.centroidX)+Math.abs(target.centroidY-g.centroidY))*.70+orientation*.55;
}
// Cached structural matching against analytic local bands and boundary half-planes.
// Categorical IDs are never interpolated or cycled.
export function formLookup() {
  const pixels=new Uint8Array(32*12*5),info=new Float32Array(32*4*2);
  for(let g=0;g<32;g++){
    const d=DESCRIPTORS[g];info.set([d.area,d.centroidX,d.centroidY,0],g*4);
    info.set(d.orientation,(32+g)*4);
  }
  for(let b=0;b<5;b++)for(let weight=0;weight<12;weight++)for(let dir=0;dir<32;dir++) {
    const angle=dir*Math.PI/32,c=Math.cos(angle),s=Math.sin(angle),width=weight/11*.95;
    const rows=[];
    for(let y=0;y<16;y++){let row=0;for(let x=0;x<8;x++){
      const px=(x-3.5)/7,py=(y-7.5)/15;
      const inBand=Math.abs(-px*s+py*c)<width*.52;
      const inHalf=b===0 || (b===1?px>-.05:b===2?px<.05:b===3?py>-.05:py<.05);
      if(inBand&&inHalf)row|=128>>x;
    }rows.push(row);}
    const target=buildVideoGlyphFeature(rows);let best=0,dist=Infinity;
    DESCRIPTORS.forEach((d,i)=>{const q=score(target,d);if(q<dist){best=i;dist=q;}});
    pixels[(b*12+weight)*32+dir]=best;
  }
  return {pixels,info};
}
