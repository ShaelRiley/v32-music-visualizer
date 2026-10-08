"""One-time import from pinned, read-only checkouts. No upstream files are edited."""
from pathlib import Path
import hashlib, json, re, subprocess
root=Path(__file__).resolve().parents[1]
up=root.parent/'upstream'
pins={'v64':'8281e7feb2ecae0ecc436e8ffadc74aaf6600c28', 'ansi-tube':'ee08e6659bdb060f0689457ee32b22ff7b4dc664'}
for name,commit in pins.items():
    actual=subprocess.check_output(['git','-C',str(up/name),'rev-parse','HEAD'],text=True).strip()
    assert actual==commit, f'{name} must be checked out at pinned commit {commit}'
def sha(b): return hashlib.sha256(b).hexdigest()
core=(up/'ansi-tube/core.js').read_text()
content=(up/'ansi-tube/content.js').read_text()
binary=(up/'v64/assets/glyphs/video64-v1.bin').read_bytes()
meta=json.loads((up/'v64/assets/glyphs/video64-v1.json').read_text())
assert len(binary)==1024 and sha(binary)==meta['sha256']
glyphs={**meta,'glyphCount':32,'names':meta['names'][:32],
        'selectedIndices':list(range(32)), 'masks':[list(binary[i*16:i*16+16]) for i in range(32)],
        'parentSha256':meta['sha256'],'sha256':sha(binary[:512])}
glyphs.pop('sha256',None)
glyphs['sha256']=sha(binary[:512])
(root/'assets/video32.bin').write_bytes(binary[:512])
(root/'assets/video32.json').write_text(json.dumps(glyphs,indent=2)+'\n')
def between(a,b): return core[core.index(a):core.index(b)]
pal=between('  const ANSI_16 =','  const BAYER_4X4 =')
pal+=between('  function clamp(','  function popcount32(')
pal+=between('  function closestPaletteIndex(','  function invertLuminanceColor(')
pal=pal.replace('    paletteCache.set(key, bundle);','    if (paletteCache.size >= 8) paletteCache.delete(paletteCache.keys().next().value);\n    paletteCache.set(key, bundle);')
pal='// Palette port from ShaelRiley/ansi-tube, pinned in assets/provenance.json.\n// Definitions, grading, farthest-point selection and 5-bit lookup are unchanged.\n'+pal
pal+='\nexport { PALETTE_DEPTHS, FIXED_PALETTES, buildPalette, getPaletteBundle, quantizeColor, styledColor };\n'
styled=between('  function styledColor(','  function uniformCube(')
mono=re.search(r'const monochrome = (\{.*?\})\[style\]',styled,re.S).group(1)
grades=re.search(r'const grade = (\{.*?\})\[style\]',styled,re.S).group(1)
tones=re.search(r'if \((\[.*?\])\.includes\(style\)\)',styled,re.S).group(1)
pal+='\n// Exact source treatment tables, shared with the GPU color stage.\n'
pal+='export const MONOCHROME_TINTS = '+mono+';\nexport const COLOR_GRADES = '+grades+';\nexport const TONE_STYLES = '+tones+';\n'
section=content[content.index('<optgroup label="Core">'):content.index('</select></div>',content.index('<optgroup label="Core">'))]
registry=[]
for group,options in re.findall(r'<optgroup label="([^"]+)">(.*?)</optgroup>',section):
    for key,label in re.findall(r'<option value="([^"]+)">(.*?)</option>',options):
        registry.append({'id':key,'name':label.replace('&amp;','&'),'group':group,'available':key!='nativeglyph'})
pal+='export const PALETTES = '+json.dumps(registry,ensure_ascii=False)+';\n'
hp=content[content.index('  const HARDWARE_PRESETS ='):content.index('  const DEFAULTS =')]
pal+=hp+'\nexport { HARDWARE_PRESETS };\n'
(root/'src/engine/palettes.mjs').write_text(pal)
features='// Structural descriptors ported from ANSI Tube; only canonical 32 masks.\nimport glyphs from "./glyph-data.mjs";\nconst CELL_WIDTH=8, CELL_HEIGHT=16;\n'
features+=between('  function orientationHistogram(','  const VIDEO_GLYPH_FEATURES =')
features+='export const DESCRIPTORS=glyphs.masks.map(buildVideoGlyphFeature);\nexport { orientationHistogram, buildVideoGlyphFeature };\n'
(root/'src/engine/descriptors.mjs').write_text(features)
(root/'src/engine/glyph-data.mjs').write_text('export default '+json.dumps(glyphs)+';\n')
(root/'vendor/ansitube-core.cjs').write_text(core)
(root/'vendor/palette-registry.json').write_text(json.dumps(registry,indent=2)+'\n')
provenance={'date':'2026-10-08','glyphSubset':list(range(32)),'glyphSize':[8,16],
 'sources':[{'repository':'https://github.com/ShaelRiley/'+name,
 'commit':subprocess.check_output(['git','-C',str(up/name),'rev-parse','HEAD'],text=True).strip()}
 for name in ['v64','ansi-tube']],
 'hashes':{'parentGlyphAsset':sha(binary),'selectedGlyphAsset':sha(binary[:512]),'ansitubeCore':sha(core.encode()),'ansitubeContent':sha(content.encode())},
 'palettePort':'Exact extracted definitions and functions; bounded eight-entry FIFO cache replaces unlimited cache only.',
 'specialModes':{'nativeglyph':'No equivalent: these canonical bitmap masks have no intrinsic colors. The option is identified and disabled rather than bypassing depth.',
 'mooburst':'Palette and luminance treatment retained. Cow bitmap cameo and associated audio are omitted: replacing canonical masks or injecting audio would violate this instrument.'},
 'licensing':'Video64 MIT notice retained. ANSI Tube currently has no LICENSE file; palette port is used in this private deliverable at its author’s explicit direction. Public redistribution needs an ANSI Tube license decision.'}
(root/'assets/provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
