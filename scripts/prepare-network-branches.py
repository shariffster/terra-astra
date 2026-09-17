"""Illustrative coastal branches from existing Natural Earth / ETOPO assets.
Not AIS, ports, cable landing sites or actual cable alignments. Reproducible offline.
"""
from ocean_routing import *
import hashlib
out=ROOT/'public/data/networks';out.mkdir(exist_ok=True)
raw=(ROOT/'lib/world/ocean-network-data.ts').read_text()
base=json.loads(raw.split('export const oceanNetwork = ')[1].split(' as const;')[0])
places=json.loads((ROOT/'public/data/open-earth/places.json').read_text())
def dist(a,b):
 lat1,lat2=map(math.radians,[a[0],b[0]]);dl=math.radians((a[1]-b[1]+180)%360-180)
 return math.acos(max(-1,min(1,math.sin(lat1)*math.sin(lat2)+math.cos(lat1)*math.cos(lat2)*math.cos(dl))))
nodes={h['id']:h['point'] for h in base['hubs']}; selected=[]
for p in sorted(places,key=lambda p:-(p.get('population') or 0)):
 if p['source']!='natural-earth' or (p.get('population') or 0)<60000 or not -55<p['lat']<65:continue
 point=[p['lat'],p['lon']]
 try:q=coords(nearest(point))
 except StopIteration:continue
 if dist(point,q)>.014 or any(dist(q,s['point'])<.025 for s in selected):continue
 selected.append({'id':p['id'],'label':p['label'],'point':q,'sourcePoint':point})
 if len(selected)==145:break
# Add two water-constrained coastal approaches. Reject long land detours.
branches=[]
for index,p in enumerate(selected):
 candidates=sorted(nodes,key=lambda key:dist(p['point'],nodes[key]))
 accepted=0
 for key in candidates[:4]:
  d=dist(p['point'],nodes[key])
  if not .006<d<.36:continue

  try:pts=route(p['point'],nodes[key],max_nodes=35000)
  except ValueError:continue
  length=sum(dist(a,b) for a,b in zip(pts,pts[1:]))
  if length>d*2.8:continue
  branches.append({'id':f"coastal-{p['id']}-{key}",'label':p['label']+' offshore / '+key,'waypoints':pts,'tier':'regional','intensity':.55+(index%7)*.055,'hubA':p['id'],'hubB':key})
  accepted+=1
  if accepted==2:break
 if index%20==0:print('coastal',index,len(branches),flush=True)
# Fan ocean crossings between real coastal regions. Direct ocean arcs are tested
# first; where a continent blocks them, no new crossing is invented.
crossings=[]
groups=[([p for p in selected if 25<p['point'][0]<53 and -84<p['point'][1]<-51],[p for p in selected if 35<p['point'][0]<60 and -14<p['point'][1]<7]),([p for p in selected if 15<p['point'][0]<43 and 120<p['point'][1]<146],[p for p in selected if 20<p['point'][0]<55 and -133<p['point'][1]<-115]),([p for p in selected if -30<p['point'][0]<5 and -50<p['point'][1]<-32],[p for p in selected if -34<p['point'][0]<14 and -20<p['point'][1]<17])]
for ga,gb in groups:
 candidates=sorted([(a,b) for a in ga for b in gb],key=lambda p:hashlib.sha256((p[0]['id']+p[1]['id']).encode()).hexdigest())
 for a,b in candidates[:70]:
  # A short offshore approach may be routed, but only accept broad open-water
  # central crossings. This avoids expensive continent-scale coast detours.
  start,end=a['point'],b['point'];innerA,innerB=great(start,end,.08),great(start,end,.92)
  if not wet(innerA,innerB):continue
  try: pts=route(start,innerA)+route(innerB,end)
  except (ValueError,StopIteration):continue
  # route() snaps to centres; validate the central join after that snap.
  ia=len(route(start,innerA))-1
  if not wet(pts[ia],pts[ia+1]):continue
  crossings.append({'id':f"cross-{a['id']}-{b['id']}",'label':a['label']+' offshore / '+b['label']+' offshore','waypoints':pts,'tier':'trunk','intensity':.60+(len(crossings)%5)*.09,'hubA':a['id'],'hubB':b['id']})
 print('crossings',len(crossings),flush=True)
sea=branches+crossings
cables=[dict(p,id='cable-'+p['id'],intensity=round(p['intensity']*.86,3)) for i,p in enumerate(sea) if i%3!=2]
result={'sea':sea,'cables':cables,'coastalRegions':selected}
(out/'marine-branches.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
(out/'marine-manifest.json').write_text(json.dumps({'source':'Existing Natural Earth populated places and NOAA ETOPO 2022 ocean mask','prepared':'2026-09-17','provenance':'Illustrative topology. Offshore points, pairings, geometry and intensities are artistic; not actual ports, cable landings, measured routes or traffic.','counts':{'coastalRegions':len(selected),'seaPaths':len(sea),'cablePaths':len(cables),'oceanCrossings':len(crossings)},'selection':'Up to 145 population-ranked coastal cities, >159 km separation, <=89 km offshore snap; two nearby offshore connections; bounded water-checked ocean fans.','inputs':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['public/data/open-earth/places.json','public/data/relief-grid.bin']}},indent=2)+'\n')
print('done',len(sea),len(cables),flush=True)
