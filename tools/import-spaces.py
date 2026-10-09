#!/usr/bin/env python3
"""Compile the retained licensed source snapshots into bounded glyph point fabrics.
Development-only: Python 3, NumPy, Pillow, Shapely. No network or game engine.
"""
import bisect, hashlib, json, math, re, struct, shutil, gzip
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, LineString
from shapely.ops import triangulate, polygonize

ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/'vendor/spaces'; OUT=ROOT/'assets/spaces'; COUNT=8192
OUT.mkdir(exist_ok=True,parents=True);(OUT/'data').mkdir(exist_ok=True);(OUT/'licenses').mkdir(exist_ok=True)
SOURCES=[];VIEWS=[]
TOURS=['Street Current','Crossing Flight','Courtyard Drift','Long Approach','Roofline Run','Oblique Passage','Rising Sweep','Returning Horizon']

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def triangles_from(poly,y,weight=.45):
 result=[]
 if poly.is_empty:return result
 geoms=list(poly.geoms) if hasattr(poly,'geoms') else [poly]
 for p in geoms:
  if p.geom_type!='Polygon':continue
  for tr in triangulate(p):
   if p.covers(tr):result.append(([[x,y,z] for x,z in list(tr.exterior.coords)[:3]],weight))
 return result

def ground_grid(x0,x1,z0,z1,y,weight=.14,steps=24):
 result=[]
 for z in range(steps):
  for x in range(steps):
   X=x0+(x1-x0)*x/steps;Z=z0+(z1-z0)*z/steps;xx=x0+(x1-x0)*(x+1)/steps;zz=z0+(z1-z0)*(z+1)/steps
   result.extend([([[X,y,Z],[xx,y,Z],[xx,y,zz]],weight),([[X,y,Z],[xx,y,zz],[X,y,zz]],weight)])
 return result

def walls(poly,low,high,weight=3):
 result=[]
 for p in (list(poly.geoms) if hasattr(poly,'geoms') else [poly]):
  if p.geom_type!='Polygon':continue
  for ring in [p.exterior,*p.interiors]:
   coords=list(ring.coords)
   for a,b in zip(coords,coords[1:]):
    A=[a[0],low,a[1]];B=[b[0],low,b[1]];C=[b[0],high,b[1]];D=[a[0],high,a[1]]
    result.extend([( [A,B,C],weight),([A,C,D],weight)])
 return result

def normalized(tris,routes,height_gain=1):
 tri=np.array([p for p,w in tris],dtype=float); weights=np.array([w for p,w in tris],dtype=float)
 lo=tri.min(axis=(0,1));hi=tri.max(axis=(0,1));center=(lo+hi)/2;center[1]=lo[1]
 scale=8/max(hi[0]-lo[0],hi[2]-lo[2],1e-4)
 gain=np.array([scale,scale*height_gain,scale]);tri=(tri-center)*gain
 rail=[(np.array(p)-center)*gain for p in routes]
 return tri,weights,rail

def resample(route,n=32):
 p=np.array(route,dtype=float);p=np.vstack([p,p[0]])
 lengths=np.linalg.norm(np.diff(p,axis=0),axis=1);at=np.concatenate([[0],np.cumsum(lengths)])
 if at[-1]<.01:raise ValueError('Collapsed camera rail')
 return np.stack([np.interp(np.arange(n)/n*at[-1],at,p[:,j]) for j in range(3)],axis=1)

def compile_source(meta,tri,weights,routes,mark_scale=1):
 # Area/route importance is baked into each tour. Playback performs texture
 # reads, never triangle searches, mesh imports, geographic requests or scans.
 normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);area=np.linalg.norm(normal,axis=1)*.5
 valid=np.isfinite(area)&(area>1e-9)&(np.max(np.abs(tri),axis=(1,2))<7.9)
 tri=tri[valid];weights=weights[valid];normal=normal[valid];area=area[valid]
 normal/=np.linalg.norm(normal,axis=1)[:,None];centroid=tri.mean(axis=1)
 meta['bounds']=[tri.min(axis=(0,1)).round(6).tolist(),tri.max(axis=(0,1)).round(6).tolist()]
 meta['triangles']=len(tri);SOURCES.append(meta)
 for view in range(8):
  rail=resample(routes[view]);focus=None
  if meta['group'] in ['Mapped cities','CC0 neighborhoods']:
   facade=np.flatnonzero((weights>=2)&(np.abs(normal[:,1])<.7));focus=[]
   for k,eye in enumerate(rail):
    ahead=rail[(k+2)%len(rail)];candidate=centroid[facade];delta=candidate-eye;forward=ahead-eye
    score=np.sum((candidate-ahead)**2,axis=1)+.3*np.sum(delta**2,axis=1)
    score+=np.where(np.sum(delta[:,[0,2]]*forward[[0,2]],axis=1)>0,0,20)
    focus.append(candidate[np.argsort(score)[:8]].mean(axis=0))
   focus=np.array(focus);focus=(np.roll(focus,1,axis=0)+focus*2+np.roll(focus,-1,axis=0))/4
  distance=np.min(np.sum((centroid[:,None,:]-rail[None,:,:])**2,axis=2),axis=1)
  importance=area*weights/(.06+distance)
  ground=np.isclose(weights,.6) if meta['group']=='Open game spaces' else weights<.2
  if ground.any() and (~ground).any():importance[ground]*=importance[~ground].sum()/max(1e-9,importance[ground].sum())*(.38/.62)
  cdf=np.cumsum(importance);cdf/=cdf[-1]
  seq=np.arange(COUNT,dtype=float)
  chosen=np.searchsorted(cdf,np.mod(.5+seq*.7548776662466927,1))
  a=np.sqrt(np.mod(.5+seq*.5698402909980532,1));b=np.mod(.5+seq*.4384471871911697,1)
  points=tri[chosen,0]*(1-a)[:,None]+tri[chosen,1]*(a*(1-b))[:,None]+tri[chosen,2]*(a*b)[:,None]
  packed=np.concatenate([points/8,normal[chosen]],axis=1)
  category=np.ones(COUNT,dtype=np.int16)
  w=weights[chosen];category[w<.2]=0;category[np.isclose(w,.6)]=0;category[np.isclose(w,.2)]=3;category[np.isclose(w,.5)|np.isclose(w,.45)]=2
  if meta['group']=='Measured landscapes':category[:]=4
  if meta['group']=='CC0 neighborhoods':category[(np.abs(normal[chosen,1])>.4)&(points[:,1]>.15)]=2
  quantized=np.round(np.clip(packed,-1,1)*32767).astype('<i2')
  data=np.column_stack([quantized,category]).astype('<i2').tobytes()
  id=meta['id']+'-'+str(view+1).zfill(2);path=OUT/'data'/(id+'.v32p');path.write_bytes(data)
  VIEWS.append(dict(id=id,source=meta['id'],name=meta['name']+' · '+TOURS[view],tour=view,path=rail.round(6).tolist(),targetPath=focus.round(6).tolist() if focus is not None else None,points=COUNT,sha256=digest(path),bytes=len(data),markScale=mark_scale,period=42+view*3,warp=.65+view*.07,lookDown=(.004+view*.001 if meta['group']=='Open game spaces' else .04+view*.015),fov=1.05))
 print(meta['id'],len(tri),'triangles, 8 tours',flush=True)

# OSM snapshots are separately licensed ODbL derivative databases. Only public
# mapped footprints/parts and way coordinates are reconstructed; missing heights
# use a disclosed 12m / 3m-per-level estimate and vertical exaggeration of 2.5.
osm_meta=json.loads((INPUT/'osm/sources.json').read_text())
names={'louvre':'Louvre Precinct','venice':'Venice · San Marco','prague':'Prague · Old Town','rome':'Rome · Pantheon','barcelona':'Barcelona · Gothic Quarter','kyoto':'Kyoto · Gion','westminster':'London · Westminster','manhattan':'Manhattan · Financial District'}
for key,info in osm_meta.items():
 source=INPUT/'osm'/(key+'.osm.gz');doc=ET.parse(gzip.open(source,'rb')).getroot();bbox=info['bbox'];lat=(bbox[1]+bbox[3])/2;lon=(bbox[0]+bbox[2])/2
 nodes={n.attrib['id']:((float(n.attrib['lon'])-lon)*111320*math.cos(math.radians(lat)),-(float(n.attrib['lat'])-lat)*111320) for n in doc.findall('node')}
 tris=[];paths=[];features=0;bounds=[[],[]]
 for w in doc.findall('way'):
  tags={t.attrib['k']:t.attrib['v'] for t in w.findall('tag')};p=[nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]
  if len(p)<2:continue
  if 'building' in tags or 'building:part' in tags:
   if len(p)<4 or p[0]!=p[-1]:continue
   poly=Polygon(p).buffer(0)
   if poly.is_empty or poly.area<4:continue
   def number(value,default):
    try:return float(re.sub(r'[^0-9.+-]','',value))
    except (ValueError,TypeError):return default
   height=min(180,max(3,number(tags.get('height'),number(tags.get('building:levels'),4)*3)))
   low=max(0,number(tags.get('min_height'),0));tris+=walls(poly,low,height);tris+=triangles_from(poly,height,.5);features+=1
   bounds[0]+=list(poly.bounds[::2]);bounds[1]+=list(poly.bounds[1::2])
  elif 'highway' in tags and tags['highway'] not in ['motorway','motorway_link']:
   length=LineString(p).length
   if length>70:paths.append((length,p))
 if not tris:raise ValueError(key+' has no building geometry')
 xs=[x for p,w in tris for x,y,z in p];zs=[z for p,w in tris for x,y,z in p];x0,x1=min(xs),max(xs);z0,z1=min(zs),max(zs)
 tris+=ground_grid(x0,x1,z0,z1,-.5)
 paths.sort(reverse=True,key=lambda p:p[0]);routes=[]
 for i in range(8):
  p=paths[i%len(paths)][1];p=[q for q in p if x0<=q[0]<=x1 and z0<=q[1]<=z1]
  if len(p)<2:p=[(x0+(x1-x0)*.3,z0),(x0+(x1-x0)*.3,z1)]
  altitude=12+i%4*5+(22 if i>=4 else 0)
  forward=[[x,altitude,z] for x,z in p]
  # Distinct forward and return rails give a continuous turning loop.
  route=forward+[[x+5,altitude+2,z+5] for x,y,z in reversed(forward)]
  routes.append(route)
 tri,weights,routes=normalized(tris,routes,2.5)
 compile_source(dict(id='osm-'+key,name=names[key],group='Mapped cities',license='ODbL-1.0',credit='© OpenStreetMap contributors',url=info['url'],licenseURL='https://opendatacommons.org/licenses/odbl/1-0/',inputs=[{'path':'vendor/spaces/osm/'+source.name,'sha256':digest(source)}],snapshot='2026-10-08',features=features,adaptation='Selected way footprints and building parts extruded using mapped heights or 12m / 3m-per-level estimates. Heights exaggerated 2.5×. Roads guide artistic camera rails. No interior or facade survey.'),tri,weights,routes,.85)

# Actual Freedoom level lump geometry; no commercial Doom data, textures, music
# or game code. Floors and ceilings derive from sector polygons, openings from
# two-sided lines and adjacent heights. Rails follow connected static portals.
credits=(INPUT/'freedoom/CREDITS-LEVELS').read_text();commit=(INPUT/'freedoom/commit.txt').read_text().strip()
for i in range(1,13):
 source=INPUT/'freedoom'/('map%02d.wad'%i);data=source.read_bytes();magic,n,offset=struct.unpack_from('<4sii',data)
 lumps={}
 for j in range(n):
  at,size,name=struct.unpack_from('<ii8s',data,offset+j*16);lumps[name.rstrip(b'\0').decode()]=data[at:at+size]
 def records(name,fmt):return list(struct.iter_unpack(fmt,lumps[name]))
 vertices=records('VERTEXES','<hh');sides=records('SIDEDEFS','<hh8s8s8sh');sectors=records('SECTORS','<hh8s8shhh');lines=records('LINEDEFS','<HHHHHHH')
 edges=[[] for s in sectors];graph={j:{} for j in range(len(sectors))};tris=[]
 for a,b,flags,special,tag,right,left in lines:
  A=vertices[a];B=vertices[b];rs=sides[right][-1] if right!=65535 else None;ls=sides[left][-1] if left!=65535 else None
  for s in [rs,ls]:
   if s is not None:edges[s].append(LineString([A,B]))
  if rs is None:continue
  floor,ceil=sectors[rs][:2]
  spans=[(floor,ceil)] if ls is None else [(floor,max(floor,sectors[ls][0])),(min(ceil,sectors[ls][1]),ceil)]
  for low,high in spans:
   if high<=low:continue
   x,z=A;X,Z=B;tris.extend([([[x,low,z],[X,low,Z],[X,high,Z]],3),([[x,low,z],[X,high,Z],[x,high,z]],3)])
  if ls is not None and min(ceil,sectors[ls][1])-max(floor,sectors[ls][0])>=48:
   portal=[(A[0]+B[0])/2,max(floor,sectors[ls][0])+40,(A[1]+B[1])/2];graph[rs][ls]=portal;graph[ls][rs]=portal
 centers={};areas={}
 for s,e in enumerate(edges):
  polygons=list(polygonize(e));floor,ceil=sectors[s][:2]
  for poly in polygons:
   tris+=triangles_from(poly,floor,.6)
   if b'F_SKY' not in sectors[s][3]:tris+=triangles_from(poly,ceil,.2)
  if polygons and ceil-floor>=48:
   poly=max(polygons,key=lambda p:p.area);p=poly.representative_point();centers[s]=[p.x,floor+40,p.y];areas[s]=poly.area
 candidates=sorted([s for s in centers if graph[s]],key=lambda s:areas[s],reverse=True)[:max(8,min(16,len(centers)))]
 routes=[]
 for tour in range(8):
  start=candidates[tour*len(candidates)//8];prev={start:None};queue=[start]
  for s in queue:
   if len(queue)>120:break
   for next in graph[s]:
    if next not in prev and next in centers:prev[next]=s;queue.append(next)
  endpoint=queue[min(len(queue)-1,7+tour*3)];chain=[];s=endpoint
  while s is not None:chain.append(s);s=prev[s]
  chain=list(reversed(chain))[:10];route=[centers[chain[0]]]
  for a,b in zip(chain,chain[1:]):route.extend([graph[a][b],centers[b]])
  if len(route)<2:route+=[[route[0][0]+32,route[0][1],route[0][2]+32]]
  # Offset the return by four map units to soften the reversal without a reset.
  route+=[[x+4,y+4,z+4] for x,y,z in reversed(route)];routes.append(route)
 tri,weights,routes=normalized(tris,routes)
 match=re.search(r'MAP%02d: (.+)'%i,credits);title=match.group(1).split(' by ')[0] if match else 'Level %02d'%i;author=match.group(1).split(' by ')[-1] if match else 'Freedoom contributors'
 compile_source(dict(id='freedoom-%02d'%i,name='Freedoom · '+title,group='Open game spaces',license='BSD-3-Clause',credit=author+'; Freedoom contributors',url='https://github.com/freedoom/freedoom/blob/'+commit+'/levels/'+source.name,licenseURL='https://github.com/freedoom/freedoom/blob/'+commit+'/COPYING.adoc',inputs=[{'path':'vendor/spaces/freedoom/'+source.name,'sha256':digest(source)}],commit=commit,adaptation='Static linedef/sector geometry only. Floors, ceilings and portal openings reconstructed; textures, actors, sounds and mechanics omitted. Authored guided tours are not game collision simulation.'),tri,weights,routes,.65)

# CC0 house meshes assembled into eight fixed, different neighborhoods.
def obj(path):
 verts=[];faces=[]
 for line in path.read_text().splitlines():
  if line.startswith('v '):verts.append(list(map(float,line.split()[1:4])))
  if line.startswith('f '):
   f=[int(x.split('/')[0])-1 for x in line.split()[1:]]
   for j in range(1,len(f)-1):faces.append([verts[f[0]],verts[f[j]],verts[f[j+1]]])
 return np.array(faces)
kit_names=['Gabled Quarter','Garden Hamlet','Courtyard Houses','Canal Avenue','Terraced Village','Market Crossroads','Roof Garden','Lantern Neighborhood']
for i,title in enumerate(kit_names):
 tris=[];inputs=[]
 for j in range(12):
  c=chr(ord('a')+(i*2+j%3)%16);source=INPUT/'kenney'/('building-type-'+c+'.obj');mesh=obj(source)
  turn=(j%4)*math.pi/2+i*.08;rot=np.array([[math.cos(turn),0,math.sin(turn)],[0,1,0],[-math.sin(turn),0,math.cos(turn)]])
  if i%3==0:offset=[(j%4-1.5)*2.1,0,(j//4-1)*2.4]
  elif i%3==1:offset=[math.cos(j*math.pi/6)*3.4,0,math.sin(j*math.pi/6)*3.4]
  else:offset=[(-1 if j%2 else 1)*2.4,0,(j//2-2.5)*1.4]
  mesh=(mesh@rot.T)*(1.15+.12*(j%3))+offset
  tris.extend([(p,3) for p in mesh]);entry={'path':'vendor/spaces/kenney/'+source.name,'sha256':digest(source)}
  if entry not in inputs:inputs.append(entry)
 extent=5.6;tris+=ground_grid(-extent,extent,-extent,extent,-.02)
 routes=[]
 for tour in range(8):
  rail=[]
  for k in range(24):
   angle=k*math.pi/12+tour*.31
   if tour<4:p=[math.cos(angle)*(1.1+tour*.45),.5+tour*.1,math.sin(angle)*(2.8-tour*.3)]
   else:p=[math.cos(angle)*3.9,1.4+(tour-4)*.25,math.sin(angle)*3.9]
   rail.append(p)
  routes.append(rail)
 tri,weights,routes=normalized(tris,routes)
 compile_source(dict(id='kenney-'+str(i+1).zfill(2),name=title,group='CC0 neighborhoods',license='CC0-1.0',credit='Kenney (www.kenney.nl)',url='https://kenney.nl/assets/city-kit-suburban',licenseURL='https://creativecommons.org/publicdomain/zero/1.0/',inputs=inputs,adaptation='Original CC0 OBJ house meshes, instanced into a fixed authored neighborhood. Materials are replaced by canonical glyphs and the selected palette.'),tri,weights,routes,1.0)

# Four actual US elevation tiles, bilinearly reduced to 65×65 vertices.
# Terrarium values: R*256 + G + B/256 - 32768 metres.
for meta in json.loads((INPUT/'terrain/sources.json').read_text()):
 source=INPUT/'terrain'/(meta['id']+'.png');rgb=np.array(Image.open(source).convert('RGB')).astype(float);elevation=rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768
 # Pixel-center sampling retains measured elevation values without color grading.
 at=np.linspace(0,255,65);xx,zz=np.meshgrid(at,at);x0=xx.astype(int);z0=zz.astype(int);x1=np.minimum(255,x0+1);z1=np.minimum(255,z0+1);fx=xx-x0;fz=zz-z0
 e=elevation[z0,x0]*(1-fx)*(1-fz)+elevation[z0,x1]*fx*(1-fz)+elevation[z1,x0]*(1-fx)*fz+elevation[z1,x1]*fx*fz
 lat=math.degrees(math.atan(math.sinh(math.pi*(1-2*(meta['y']+.5)/2**meta['z']))));metres=40075016.686*math.cos(math.radians(lat))/2**meta['z'];gain=8/metres*1.7
 h=(e-e.min())*gain;vertices=np.stack([xx/255*8-4,h,zz/255*8-4],axis=2);tris=[]
 for z in range(64):
  for x in range(64):
   A=vertices[z,x];B=vertices[z,x+1];C=vertices[z+1,x+1];D=vertices[z+1,x];tris.extend([([A,B,C],1),([A,C,D],1)])
 routes=[]
 for tour in range(8):
  p=[]
  for k in range(40):
   angle=k*math.pi/20+tour*.27;rx=2.9-tour%4*.25;rz=1.7+tour%4*.32;x=math.cos(angle)*rx;z=math.sin(angle)*rz
   gx=min(63,max(0,int((x+4)/8*64)));gz=min(63,max(0,int((z+4)/8*64)));near=h[max(0,gz-3):min(65,gz+4),max(0,gx-3):min(65,gx+4)].max()
   p.append([x,float(near)+.35+tour//4*.65,z])
  routes.append(p)
 tri=np.array([p for p,w in tris]);weights=np.array([w for p,w in tris])
 compile_source(dict(id='terrain-'+meta['id'],name=meta['name'],group='Measured landscapes',license='Public domain',credit='USGS 3DEP, GMTED2010 and SRTM terrain data; Mapzen / Tilezen',url=meta['url'],licenseURL='https://github.com/tilezen/joerd/blob/master/docs/attribution.md',inputs=[{'path':'vendor/spaces/terrain/'+source.name,'sha256':digest(source)}],tile=[meta['z'],meta['x'],meta['y']],adaptation='Terrarium elevation decoded, reduced to a 65×65 heightfield, normalized to 8 world units, vertical relief exaggerated 1.7×. Artistic routes and musical displacement are added.'),tri,weights,routes,1.0)

assert len(SOURCES)==32 and len(VIEWS)==256
manifest=dict(format='VIDEO32-SPACE-FABRIC',version=2,pointFormat='8192 little-endian int16 records: x,y,z mapped from [-8,8]; nx,ny,nz mapped from [-1,1]; surface class (0 ground/floor, 1 facade/wall, 2 roof, 3 ceiling, 4 terrain)' ,sources=SOURCES,views=VIEWS)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
(OUT/'manifest.mjs').write_text('export const SPACE_DATA = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n')
shutil.copyfile(INPUT/'freedoom/COPYING.adoc',OUT/'licenses/Freedoom-BSD.txt');shutil.copyfile(INPUT/'freedoom/CREDITS-LEVELS',OUT/'licenses/Freedoom-level-credits.txt');shutil.copyfile(INPUT/'kenney/License.txt',OUT/'licenses/Kenney-CC0.txt')
(OUT/'licenses/OpenStreetMap-ODbL.txt').write_text('© OpenStreetMap contributors.\nThe source subsets in vendor/spaces/osm and their derived point fabrics in assets/spaces/data (OSM sources and bundle ranges identified in manifest.json) are available under ODbL 1.0:\nhttps://opendatacommons.org/licenses/odbl/1-0/\nhttps://www.openstreetmap.org/copyright\nOriginal URLs, snapshot hashes and transformations are recorded in the manifests.\n')
(OUT/'licenses/USGS-terrain.txt').write_text('USGS 3DEP, GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey; Mapzen / Tilezen.\nPublic-domain US terrain elevation, decoded and artistically transformed as recorded in manifest.json.\nhttps://github.com/tilezen/joerd/blob/master/docs/attribution.md\nhttps://www.usgs.gov/3d-elevation-program/about-3dep-products-services\n')
print('Compiled 32 spatial sources and 256 bounded tours; '+str(COUNT*14*256)+' fabric bytes.')
