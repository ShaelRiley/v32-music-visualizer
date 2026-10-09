#!/usr/bin/env python3
"""Bundle eight immutable local fabrics per file; view IDs/hashes remain stable."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for bank,constant,extension in [('spaces','SPACE_DATA','.v32p'),('vr','VR_DATA','.png')]:
 folder=ROOT/'assets'/bank;data=json.loads((folder/'manifest.json').read_text());views=data['views'];bundles=[]
 for block in range(0,len(views),8):
  group=views[block:block+8];file=f'bank-{block//8:02d}.v32b';parts=[];offset=0
  for view in group:
   source=folder/'data'/(view['id']+extension)
   if source.exists():raw=source.read_bytes()
   else:
    existing=(folder/'data'/view['file']).read_bytes();raw=existing[view['offset']:view['offset']+view['bytes']]
   if hashlib.sha256(raw).hexdigest()!=view['sha256']:raise ValueError('Fabric integrity mismatch')
   view['file']=file;view['offset']=offset;parts.append(raw);offset+=len(raw)
  combined=b''.join(parts);(folder/'data'/file).write_bytes(combined);bundles.append({'file':file,'bytes':len(combined),'sha256':hashlib.sha256(combined).hexdigest()})
 data['bundles']=bundles;(folder/'manifest.json').write_text(json.dumps(data,indent=2)+'\n');(folder/'manifest.mjs').write_text('export const '+constant+'='+json.dumps(data,separators=(',',':'))+';\n')
 keep={b['file'] for b in bundles}
 for p in (folder/'data').iterdir():
  if p.name not in keep:p.unlink()
 print(bank,len(bundles),'bundles',sum(b['bytes'] for b in bundles),'bytes')
