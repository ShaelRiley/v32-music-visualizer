import * as ansi from './palettes.mjs';

// New stage palettes are hue paths, not luminance recolorings of one rainbow.
// Retain distinctive source treatments; omit redundant choices from the picker.
const recipes = [
  ['prism', 'Prism Current', 'Electric', ['26f6d5','2864ff','a94dff','ff407e','ffc14f'], 'Teal, cobalt, violet, rose and gold.'],
  ['aurora', 'Aurora', 'Electric', ['30fca8','06aa94','5547ed','ce65ff','b8faff'], 'Emerald ribbons, violet air and cold light.'],
  ['voltage', 'Violet Voltage', 'Electric', ['4315ba','983dff','e546ec','faff43','efe3ff'], 'Ultraviolet with a sharp sulfur accent.'],
  ['laser', 'Laser Garden', 'Electric', ['41ff36','11ad77','052cb5','12f7f5','dbfaff'], 'Acid green against deep blue and cyan.'],
  ['blacklight', 'Blacklight', 'Electric', ['be00ff','5511b4','ff35c5','ff705c','00ddff'], 'Fluorescent magenta, indigo and electric blue.'],
  ['arcade', 'Arcade Primary', 'Electric', ['ff242d','ffb900','f5ee35','0958ff','efefff'], 'Bold poster primaries with porcelain highlights.'],
  ['lagoon', 'Lagoon', 'Elements', ['006c78','02c2a3','62ecc4','d4f6ba','429adf'], 'Marine teal, sea glass and pale sunlit water.'],
  ['magma', 'Magma', 'Elements', ['8c1233','e12416','ff701a','ffbe36','fff1ac'], 'Carmine, molten orange and pale heat.'],
  ['desert', 'Desert Bloom', 'Elements', ['9c3e30','e2a764','efc8ab','ff5985','746cb9'], 'Clay, sand, coral blossom and dusty violet.'],
  ['forest', 'Moss & Copper', 'Elements', ['28784c','8eae35','e8ca64','c76c3c','70433c'], 'Leaf green, moss, brass and copper.'],
  ['glacier', 'Glacier Rose', 'Elements', ['2667a4','65bedd','cbefff','ffa8c4','ad4797'], 'Glacial blue crossed by rose and mauve.'],
  ['storm', 'Storm & Sulfur', 'Elements', ['2c315d','647a94','c6d5df','eced49','b4b91a'], 'Slate air and an unmistakable sulfur seam.'],
  ['jade', 'Vermilion Jade', 'Duets', ['ef4030','f28b57','f3d1a1','38b69b','13756e'], 'Vermilion and jade with warm ivory between.'],
  ['cobalt', 'Cobalt & Gold', 'Duets', ['123caf','2888df','d9efff','f5c33f','b9790d'], 'Cobalt blue and metallic gold.'],
  ['citrus', 'Midnight Citrus', 'Duets', ['482783','8370cb','eeb92f','ffef77','ed751b'], 'Purple night, lemon and burnt orange.'],
  ['porcelain', 'Porcelain Indigo', 'Duets', ['27379b','575dc4','b6bee1','f1eada','c08a63'], 'Indigo ceramics with cream and terracotta.'],
  ['peppermint', 'Peppermint Ink', 'Duets', ['0d676a','50cdb7','d7f6e0','f66574','ac274a'], 'Peppermint and scarlet with paper highlights.'],
  ['bubblegum', 'Bubblegum Circuit', 'Duets', ['df4e8c','ff97cc','fce1e8','52bdec','5366df'], 'Candy pink and powder blue.'],
  ['copper', 'Copper Wire', 'Materials', ['663b35','ad5835','ec9a54','f7db9d','ac735a'], 'A warm, purely copper and amber fabric.'],
  ['mercury', 'Mercury', 'Materials', ['374453','667a8a','a5bdcc','e8f5ff','8b9bba'], 'Cool silver with blue steel midtones.'],
  ['cinema', 'Sepia Cinema', 'Materials', ['645143','aa8b65','dbc399','f7ecd1','8c7460'], 'Sepia and parchment, without neon accents.'],
  ['chalk', 'Charcoal & Chalk', 'Materials', ['777777','b0b0b0','ffffff','d8d8d8','8e8e8e'], 'Neutral grayscale, from graphite to clean white.'],
  ['orchid', 'Orchid Velvet', 'Materials', ['5b2a74','9049ac','d083dc','f3c7e5','b95185'], 'Plum velvet, lavender and orchid.'],
  ['honey', 'Honeycomb', 'Materials', ['956510','cf921b','f6c741','fff09a','ddb55b'], 'A bright amber and honey monochrome family.']
];

const redundantNew = new Set(['arcade','chalk','cinema','honey']);
export const VISUAL_PALETTES = recipes.filter(([id])=>!redundantNew.has(id)).map(([id, name, group, hex, description]) => ({
  id: 'v32-' + id, name, group, description, collection: 'visual', available: true,
  stops: hex.map(h => [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)])
}));
const retainedHueThemes={nes:['NES','Retro'],c64:['Commodore 64','Retro'],mooburst:['MooBurst','Materials'],silvergold:['Silver & Gold','Materials'],psychedelic:['Psychedelic','Electric']};
for(const [id,[name,group]]of Object.entries(retainedHueThemes))VISUAL_PALETTES.push({id,name,group,available:true,collection:'visual',stops:ansi.FIXED_PALETTES[id].filter(c=>Math.max(...c)>80),description:'Distinctive source colors, distributed as a spatial hue path.'});
export const RETAINED_ORIGINALS=['standard','blackwhite','cyan','purple','blue','pink','amber','toxic','sepia','gbdmg','virtualb','apple2green','nativeglyph'];
export const PALETTES=[...VISUAL_PALETTES,...ansi.PALETTES.filter(p=>RETAINED_ORIGINALS.includes(p.id)).map(p=>({...p,name:p.id==='standard'?'Classic Spectrum':p.name,group:['gbdmg','virtualb','apple2green'].includes(p.id)?'Retro':p.id==='standard'||p.id==='nativeglyph'?'Spectrum':'Monochrome',collection:'ansi'}))];
export const PALETTE_DEPTHS = ansi.PALETTE_DEPTHS;
export const HARDWARE_PRESETS = ansi.HARDWARE_PRESETS;
export const DEFAULT_PALETTE = 'v32-prism';
const definitions = new Map(VISUAL_PALETTES.map(p => [p.id,p]));
const cache = new Map();
const clip = n => Math.max(0,Math.min(255,n));

export function hueColor(id, position) {
  const stops = definitions.get(id).stops;
  const at = Math.max(0,Math.min(1,position)) * stops.length;
  const low = Math.floor(at), mix = at-low;
  return stops[low % stops.length].map((c,j) => Math.round(c*(1-mix)+stops[(low+1)%stops.length][j]*mix));
}

export function colorTreatment(id) {
  if (definitions.has(id)) return {colorMode:3, grade:[1,1]};
  return {colorMode:ansi.MONOCHROME_TINTS[id] || ansi.TONE_STYLES.includes(id) ? 1 : id==='psychedelic' ? 2 : 0,
    grade:ansi.COLOR_GRADES[id] || [1,1]};
}

export function styledColor(id,r,g,b) {
  if (!definitions.has(id)) return ansi.styledColor(id,r,g,b);
  const peak=Math.max(r,g,b),low=Math.min(r,g,b),delta=peak-low;
  if (!peak) return 0;
  let numerator=peak===r?g-b:peak===g?b-r+2*delta:r-g+4*delta;
  if(numerator<0)numerator+=6*delta;
  const index=delta===0?0:Math.floor((numerator*255+3*delta)/(6*delta));
  const color=hueColor(id,index/255);
  return color.reduce((n,c)=>n*256+Math.floor((c*(2805+9*peak)+2550)/5100),0);
}

function nearest(r,g,b,palette) {
  let index=0,best=Infinity;
  for(let i=0;i<palette.length;i++) {
    const c=palette[i],d=(r-c[0])**2*.30+(g-c[1])**2*.59+(b-c[2])**2*.11;
    if(d<best){best=d;index=i;}
  }
  return index;
}

export function getPaletteBundle(id='standard',depth=32) {
  if (!definitions.has(id)) return ansi.getPaletteBundle(id,depth);
  if (depth==='truecolor') return null;
  const count=PALETTE_DEPTHS.includes(Number(depth)) ? Number(depth) : 32,key=id+':'+count;
  if(cache.has(key))return cache.get(key);
  const candidates=[[0,0,0]],seen=new Set(['0,0,0']);
  for(const shade of [.55,.72,.86,1])for(let i=0;i<256;i++) {
    const color=hueColor(id,i/255).map(c=>Math.round(c*shade)),key=color.join(',');
    if(!seen.has(key)){candidates.push(color);seen.add(key);}
  }
  const palette=[],distances=new Float64Array(candidates.length).fill(Infinity);
  let chosen=0;
  for(let n=0;n<Math.min(count,candidates.length);n++) {
    const color=candidates[chosen];palette.push(color);let next=0,farthest=-1;
    for(let i=0;i<candidates.length;i++){
      const c=candidates[i],d=(c[0]-color[0])**2*.30+(c[1]-color[1])**2*.59+(c[2]-color[2])**2*.11;
      distances[i]=Math.min(distances[i],d);
      if(distances[i]>farthest){farthest=distances[i];next=i;}
    }
    chosen=next;
  }
  const lookup=new Uint16Array(32768);
  for(let r=0;r<32;r++)for(let g=0;g<32;g++)for(let b=0;b<32;b++)lookup[r<<10|g<<5|b]=nearest(r*8+4,g*8+4,b*8+4,palette);
  const bundle={palette,lookup};if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,bundle);return bundle;
}

export function quantizeColor(id='standard',depth=32,r=0,g=0,b=0,settings={}) {
  if(!definitions.has(id))return ansi.quantizeColor(id,depth,r,g,b,settings);
  let c=[r,g,b].map(n=>clip(Number(n)||0)),peak=Math.max(...c),low=Math.min(...c),sat=peak===0?0:(peak-low)/peak;
  if(sat>=.02){const target=Math.max(0,Math.min(1,sat*(1+Number(settings.saturationBoost??0))+.06));c=c.map(v=>clip(peak-(peak-v)*target/sat));}
  const scale=peak===0?0:Math.min(255,peak*(1+Number(settings.brightnessBoost??0)))/peak;
  c=c.map(v=>Math.round(v*scale));const packed=styledColor(id,...c);c=[packed>>16&255,packed>>8&255,packed&255];
  const bundle=getPaletteBundle(id,depth);
  return bundle ? bundle.palette[bundle.lookup[(c[0]>>3)<<10|(c[1]>>3)<<5|c[2]>>3]] : c;
}
