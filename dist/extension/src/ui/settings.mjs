import {PALETTES,PALETTE_DEPTHS,DEFAULT_PALETTE} from '../engine/palette-library.mjs';
import {clamp} from '../engine/random.mjs';
export const defaults={settingsVersion:3,mode:'shuffle',balance:.5,duration:45,palette:DEFAULT_PALETTE,paletteCycle:true,depth:32,brightness:.08,boost:.25,blackFloor:.035,markSize:.9,density:1,sceneScale:1,stability:.8,sensitivity:1,camera:'preset',distance:4.7,restrained:false,quality:'auto',yaw:0,pitch:0};

export function sanitizeSettings(input,{migrate=false,restrained=false}={}){
 const s={...defaults,restrained};
 if(!input||typeof input!=='object')return s;
 for(const [k,range] of Object.entries({balance:[0,1],duration:[30,90],brightness:[0,.5],boost:[0,1],blackFloor:[0,.2],markSize:[.3,2],density:[.3,1.5],sceneScale:[.5,2],stability:[0,1],sensitivity:[.25,2],distance:[2.5,8],yaw:[-100,100],pitch:[-3,3]}))
  if(typeof input[k]==='number'&&Number.isFinite(input[k]))s[k]=clamp(input[k],...range);
 for(const [k,allowed]of Object.entries({mode:['shuffle','mixed','library','spaces','video','discovery'],camera:['preset','orbit','passage','interior','hold','rise','detail'],quality:['auto','low','balanced','high'],palette:PALETTES.filter(p=>p.available).map(p=>p.id),depth:[...PALETTE_DEPTHS,'truecolor']}))
  if(allowed.includes(input[k]))s[k]=input[k];
 if(typeof input.restrained==='boolean')s.restrained=input.restrained;
 if(typeof input.paletteCycle==='boolean')s.paletteCycle=input.paletteCycle;
 if(migrate&&input.settingsVersion!==3){
  // Upgrade default preferences only; imported/saved scenes keep original colors.
  if(input.markSize===1)s.markSize=defaults.markSize;
  if(input.stability===.65)s.stability=defaults.stability;
  if(input.mode==='mixed'||input.mode==='library')s.mode=defaults.mode;
  if(input.palette==='standard'&&input.brightness===.12&&input.boost===.42){s.palette=DEFAULT_PALETTE;s.brightness=defaults.brightness;s.boost=defaults.boost;}
 }
 return s;
}
