#!/usr/bin/env python3
"""Fetch only selected, licensed source frames via public HTTP byte ranges.
Development-only. Python 3 + Pillow. Never needed by the extension or build.
Usage: python3 tools/fetch-vr.py /path/to/source-frames
"""
import argparse,hashlib,io,json,struct,urllib.request,zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];record=json.loads((ROOT/'vendor/vr/acquisition.json').read_text())
parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
base='https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/'+record['datasetCommit']+'/'
def acquire(source):
 meta=source['metadata'];folder=args.output/meta['video_id'];folder.mkdir(exist_ok=True)
 if (folder/'source.json').exists():return
 frames=source['frames'];assert len({f['disk'] for f in frames})==1
 start=min(f['offset'] for f in frames);end=max(f['offset']+f['size']+1024 for f in frames)
 request=urllib.request.Request(base+record['archiveParts'][frames[0]['disk']],headers={'Range':f'bytes={start}-{end-1}'})
 with urllib.request.urlopen(request,timeout=90) as response:
  if response.status!=206:raise ValueError('Byte range was not honored; refusing a full-archive download')
  data=response.read()
 for f in frames:
  at=f['offset']-start;h=struct.unpack_from('<4s5H3I2H',data,at)
  if h[0]!=b'PK\x03\x04':raise ValueError('Invalid source header')
  begin=at+30+h[-2]+h[-1];packed=data[begin:begin+f['size']];raw=zlib.decompress(packed,-15) if f['method']==8 else packed
  if len(raw)!=f['raw'] or hashlib.sha256(raw).hexdigest()!=f['sha256'] or f'{zlib.crc32(raw)&0xffffffff:08x}'!=f['archiveCRC32']:raise ValueError('Source frame integrity mismatch')
  Image.open(io.BytesIO(raw)).convert('RGB').resize((1024,512),Image.Resampling.LANCZOS).save(folder/Path(f['path']).name)
 (folder/'source.json').write_text(json.dumps(meta,indent=2))
with ThreadPoolExecutor(max_workers=4) as pool:
 for i,_ in enumerate(pool.map(acquire,record['sources'])):
  if (i+1)%16==0:print('Acquired',i+1,'/ 256',flush=True)
