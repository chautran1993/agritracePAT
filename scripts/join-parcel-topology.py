import sys,json,heapq,math
sys.path.insert(0,'.tmp-analysis')
import shapely
from shapely.geometry import Polygon,shape,mapping
from shapely.ops import transform
from pathlib import Path
source=json.load(open('.tmp-analysis/join-request.json',encoding='utf-8-sig'))
records=source['records']; coeff=source['affineCoefficients']
fixed_count=source.get('fixedParcelCount',1)
(a,b,c),(d,e,f)=coeff;det=a*e-b*d
xy=lambda x,y,z=None:((e*(x-c)-b*(y-f))/det,(-d*(x-c)+a*(y-f))/det)
geo=lambda x,y,z=None:(a*x+b*y+c,d*x+e*y+f)
precision=0.00001
original_polys=[shapely.set_precision(transform(xy,shape(r['geometry'])),precision) for r in records]
# Reassign pre-existing point-attached slivers through shared edges rather than
# keeping a parcel connected only at a single vertex.
polys=[max(p.geoms,key=lambda x:x.area)if p.geom_type=='MultiPolygon'else p for p in original_polys]
occupied=shapely.union_all(polys,grid_size=precision)
outer=shapely.set_precision(Polygon(source['perimeter']),precision)
extent=shapely.union_all([outer]+original_polys,grid_size=precision)
# Close interior voids as requested, keeping the outer field contour.
extent=Polygon(extent.exterior)
gaps=shapely.difference(extent,occupied,grid_size=precision)
triangles=[shapely.set_precision(p,precision) for p in shapely.constrained_delaunay_triangles(gaps).geoms]
triangles=[p for p in triangles if p.area>1e-7]
centers=[p.centroid for p in triangles]
owners=[-1]*len(triangles);cost=[math.inf]*len(triangles);queue=[]
for i,triangle in enumerate(triangles):
 best=0.1
 for j,parcel in enumerate(polys[fixed_count:],fixed_count):
  shared=shapely.intersection(triangle.boundary,parcel.boundary,grid_size=precision).length
  if shared>best:best=shared;owners[i]=j
 if owners[i]>=0:cost[i]=0;heapq.heappush(queue,(0,i))
edge_to_triangles={};neighbours=[set()for _ in triangles]
for i,triangle in enumerate(triangles):
 ring=list(triangle.exterior.coords)
 for p,q in zip(ring,ring[1:]):
  key=tuple(sorted((tuple(round(v/precision)for v in p),tuple(round(v/precision)for v in q))))
  for j in edge_to_triangles.get(key,[]):neighbours[i].add(j);neighbours[j].add(i)
  edge_to_triangles.setdefault(key,[]).append(i)
while queue:
 distance,i=heapq.heappop(queue)
 if distance>cost[i]:continue
 for j in neighbours[i]:
  candidate=distance+centers[i].distance(centers[j])
  if candidate<cost[j]:cost[j]=candidate;owners[j]=owners[i];heapq.heappush(queue,(candidate,j))
if -1 in owners and not source.get('skipUnattachedFixedGaps',False):raise ValueError('An unassigned gap remains')
for i in range(fixed_count,len(records)):
 joined=shapely.union_all([polys[i]]+[p for j,p in enumerate(triangles)if owners[j]==i],grid_size=precision)
 if joined.geom_type!='Polygon':
  print('ORIGINAL',polys[i].geom_type);print('SPLIT',records[i]['sourceRow'],[p.area for p in joined.geoms],joined.geoms[0].distance(joined.geoms[1]))
  raise ValueError('Parcel split')
 world=transform(geo,joined)
 # The supplied red parcel is immutable, including its original precision.
 sample_corners=records[0]['geometry']['coordinates'][0]
 world=Polygon([next((tuple(c)for c in sample_corners if math.hypot(c[0]-p[0],c[1]-p[1])<1e-9),p)for p in world.exterior.coords])
 world=world.difference(shape(records[0]['geometry']))
 if world.geom_type!='Polygon':raise ValueError('Invalid red boundary connection')
 records[i]['geometry']=mapping(world)
 point=world.representative_point();records[i]['lng']=point.x;records[i]['lat']=point.y
 records[i]['googleMaps']=f'https://www.google.com/maps?q={point.y},{point.x}'
 records[i]['note']=source.get('topologyNote','Đường bao ước tính đã nối kín cạnh chung sau khi xóa MP-0061 và MP-0084; số thửa và chủ hộ giữ nguyên.')
source.pop('perimeter',None)
source['source']=source.get('topologySource','83 parcels joined continuously after removing MP-0061 and MP-0084; stable identifiers preserved')
source['connectedParcelCount']=len(records)
json.dump(source,open('.tmp-analysis/join-result.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print({'parcels':len(records),'gapTriangles':len(triangles),'pixelUnion':extent.geom_type,'holes':len(extent.interiors)if extent.geom_type=='Polygon'else None})



