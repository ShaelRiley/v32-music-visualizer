#!/usr/bin/env python3
"""Match 9-frame spherical studies to the exact 32 masks, entirely offline.
Input is a folder containing <video_id>/01.png..09.png and source.json.
The acquisition snapshot and licences remain separate from the MIT renderer.
"""
import argparse,hashlib,io,json,re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/vr';W,H=256,64
parser=argparse.ArgumentParser();parser.add_argument('input',type=Path);args=parser.parse_args()
canonical=json.loads((ROOT/'src/engine/glyph-data.mjs').read_text().removeprefix('export default ').rstrip().removesuffix(';'))
masks=np.array([[[1 if row&(128>>x) else 0 for x in range(8)] for row in g] for g in canonical['masks']],dtype=np.float32)
covers=masks.reshape(32,8,2,4,2).mean(axis=(2,4)).reshape(32,32);areas=masks.mean(axis=(1,2));names=canonical['names']
inputs=[]
for folder in sorted(args.input.iterdir()):
 if not (folder/'source.json').exists():continue
 meta=json.loads((folder/'source.json').read_text())
 if meta['license'] not in ['cc-by','cc-by-sa','cc-cc0'] or meta['projection']!='equirectangular':continue
 inputs.append((folder,meta))
if len(inputs)<256:raise ValueError('Need 256 distinct eligible video sources')
# Reject source studies that proved too dark/sparse in renderer review.
curation=ROOT/'vendor/vr/curation.json'
rejected=set(json.loads(curation.read_text())['rejectedVideoIDs']) if curation.exists() else set()
inputs=[item for item in inputs if item[1]['video_id'] not in rejected]
if len(inputs)<256:raise ValueError('Too few eligible visible source studies')
# Prefer identified titles; every item remains one distinct original video.
inputs.sort(key=lambda x:(not bool(x[1].get('title')),x[1]['video_id']));inputs=inputs[:256]

def compile(item):
 index,(folder,meta)=item;frames=[];hist=np.zeros(32,dtype=np.int64);previous=None
 initial=Image.open(folder/'01.png').convert('RGB');arr=np.array(initial.resize((512,256)),dtype=float);grey=arr.mean(axis=2)
 # Choose an opening heading, while retaining every longitude of the source.
 scores=[]
 for center in [0,.25,.5,.75]:
  at=(np.arange(256)+int(center*512)-128)%512;patch=grey[72:184,at[64:192]];scores.append(patch.std()+.12*patch.mean()+40*np.mean(patch>24))
 heading=int(np.argmax(scores))/4
 for name in [f'{i:02d}.png' for i in range(1,10)]:
  original=Image.open(folder/name).convert('RGB').resize((2048,1024),Image.Resampling.LANCZOS);full=np.array(original)
  at=(np.arange(2048)+int(heading*2048)-1024)%2048;image=full[:,at]
  blocks=image.reshape(H,16,W,8,3).transpose(0,2,1,3,4).reshape(W*H,16,8,3).astype(np.float32)
  luminance=blocks@np.array([.299,.587,.114],dtype=np.float32);mean=luminance.mean(axis=(1,2));std=luminance.std(axis=(1,2))
  density=.025+.95*(mean/255)
  target=np.clip(density[:,None,None]+(luminance-mean[:,None,None])/np.maximum(30,std*2.2)[:,None,None],0,1)
  coverage=target.reshape(W*H,8,2,4,2).mean(axis=(2,4)).reshape(W*H,32)
  error=np.mean(np.abs(coverage[:,None,:]-covers[None,:,:]),axis=2)*3.2+np.abs(target.mean(axis=(1,2))[:,None]-areas)*1.4
  if previous is not None:error+=np.where(np.arange(32)[None,:]==previous[:,None],0,.035)
  glyph=error.argmin(axis=1);glyph[mean<12]=0;previous=glyph;hist+=np.bincount(glyph,minlength=32)
  rgb=np.round(blocks.mean(axis=(1,2))).astype(np.uint16);rgb565=((rgb[:,0]*31//255)<<11)|((rgb[:,1]*63//255)<<5)|(rgb[:,2]*31//255)
  packed=np.column_stack([glyph,rgb565>>8,rgb565&255]).astype(np.uint8).reshape(H,W,3);frames.append(packed)
 id='sphere-'+meta['video_id'];file=OUT/'data'/(id+'.png');png=io.BytesIO();Image.fromarray(np.vstack(frames)).save(png,format='PNG',optimize=True);encoded=png.getvalue()
 with Image.open(io.BytesIO(encoded)) as check:check.load()
 temporary=file.with_suffix('.pending');temporary.write_bytes(encoded);temporary.replace(file)
 title=meta.get('title') or ('Spherical Study '+str(index+1).zfill(3));title=re.sub(r'\s+',' ',title).strip()[:75]
 return dict(id=id,name=title,videoID=meta['video_id'],clipID=meta['clip_id'],sourceURL=meta['url'],author=meta.get('author') or 'Original video creator (see source link)',authorURL=meta.get('authorURL') or meta['url'],publisher=meta['publisher'],originalLicense=meta['license'],publishedAt=meta['published_at'],license='CC-BY-SA-4.0',licenseURL='https://creativecommons.org/licenses/by-sa/4.0/',projection='360° equirectangular spherical study',horizontalCoverage=360,verticalCoverage=180,sourceFrames=meta['sourceFrames'],sourceDimensions=[int(meta['width']),int(meta['height'])],frames=9,columns=W,rows=H,heading=heading,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),bytes=file.stat().st_size,glyphCounts=hist.tolist(),adaptation='Nine consecutive source frames, matched to canonical glyphs over all 360° of longitude and 180° of latitude. Opening heading rotates the panorama without cropping it. Music-driven glyph deformation is added; no stereoscopic depth is claimed.')
with ThreadPoolExecutor(max_workers=4) as pool:
 results=[]
 for result in pool.map(compile,enumerate(inputs)):
  results.append(result)
  if len(results)%16==0:print('Matched',len(results),'/ 256',flush=True)
data={'version':2,'dataset':'UGC360','datasetURL':'https://huggingface.co/datasets/FAU-LMS/UGC360','commit':'99f74d256df961695968f6f39d58e1b004ce0a59','license':'CC-BY-SA-4.0','glyphSha256':canonical['sha256'],'views':results,'glyphCounts':np.sum([r['glyphCounts'] for r in results],axis=0).tolist()}
(OUT/'manifest.json').write_text(json.dumps(data,indent=2)+'\n');(OUT/'manifest.mjs').write_text('export const VR_DATA='+json.dumps(data,separators=(',',':'))+';\n')
print('Total bytes',sum(r['bytes'] for r in results),'glyphs used',sum(n>0 for n in data['glyphCounts']),flush=True)
