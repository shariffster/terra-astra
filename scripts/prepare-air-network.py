"""Bounded historical OpenFlights connection atlas. Re-run from pinned input files.
Derived database: ODbL 1.0. Geometry/altitude/brightness are artistic, not flight plans.
"""
import csv, json, math, hashlib, array
from collections import Counter, defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'data-source/openflights'; out=ROOT/'public/data/networks';out.mkdir(exist_ok=True)
airports={r[0]:r for r in csv.reader((source/'airports.dat').open()) if len(r)>7}
pairs=Counter()
for r in csv.reader((source/'routes.dat').open()):
 if r[3] in airports and r[5] in airports and r[3]!=r[5] and r[7]=='0': pairs[tuple(sorted([r[3],r[5]],key=int))]+=1
xyz=lambda a: (math.cos(math.radians(float(a[6])))*math.sin(math.radians(float(a[7]))),math.sin(math.radians(float(a[6]))),math.cos(math.radians(float(a[6])))*math.cos(math.radians(float(a[7]))))
angle=lambda a,b: math.acos(max(-1,min(1,sum(x*y for x,y in zip(xyz(a),xyz(b))))))
degree=Counter(i for p in pairs for i in p)
# Spread the selection across geography, then fill with substantial connections.
# Record multiplicity ranks routes; it is NOT passenger volume or frequency.
buckets=defaultdict(list)
for pair,n in pairs.items():
 a,b=(airports[i] for i in pair);arc=angle(a,b)
 if not .035<arc<2.85:continue
 score=math.log1p(n)*2+math.log1p(degree[pair[0]]*degree[pair[1]])*.3+min(arc,.9)
 for p in (a,b):buckets[(int((float(p[6])+90)//15),int((float(p[7])+180)//20))].append((score,pair))
chosen=set()
for items in buckets.values():chosen.update(p for _,p in sorted(items,reverse=True)[:10])
ranked=sorted({p:s for items in buckets.values() for s,p in items}.items(),key=lambda x:(-x[1],x[0]))
for p,_ in ranked:
 if len(chosen)>=2400:break
 chosen.add(p)
grid=array.array('h',(ROOT/'public/data/relief-grid.bin').read_bytes())
def relief(lat,lon):
 x=((lon+180)*4-.5)%1440;y=min(719,max(0,(90-lat)*4-.5));i,j=int(x),int(y);tx,ty=x-i,y-j
 h=(grid[j*1440+i]*(1-tx)+grid[j*1440+(i+1)%1440]*tx)*(1-ty)+(grid[min(719,j+1)*1440+i]*(1-tx)+grid[min(719,j+1)*1440+(i+1)%1440]*tx)*ty
 return max(0,h)
rows=[]
for pair in sorted(chosen,key=lambda p:hashlib.sha256(('/'.join(p)).encode()).hexdigest()):
 a,b=(airports[i] for i in pair);aa,bb=xyz(a),xyz(b);arc=angle(a,b);s=math.sin(arc);high=0
 # Conservative route-wide maximum from the same grid used by Earth.
 for k in range(math.ceil(arc/.0008)+1):
  t=k/math.ceil(arc/.0008);v=[(x*math.sin((1-t)*arc)+y*math.sin(t*arc))/s for x,y in zip(aa,bb)]
  high=max(high,relief(math.degrees(math.asin(max(-1,min(1,v[1])))),math.degrees(math.atan2(v[0],v[2]))))
 rows.append([a[0],b[0],float(a[6]),float(a[7]),float(b[6]),float(b[7]),round(high),round(.32+min(1,math.log1p(pairs[pair])/3)*.48,3)])
(out/'air-connections.json').write_text(json.dumps(rows,separators=(',',':')))
used=sorted(set(i for p in chosen for i in p),key=int)
(out/'airports.json').write_text(json.dumps([[i,airports[i][1],airports[i][2],airports[i][3],airports[i][4],float(airports[i][6]),float(airports[i][7])] for i in used],ensure_ascii=False,separators=(',',':')))
(out/'OPENFLIGHTS-LICENSE.txt').write_text('\n'.join(line.rstrip() for line in (source/'LICENSE').read_text().splitlines()).rstrip()+'\n')
manifest={'source':'OpenFlights / Airline Route Mapper','sourceUrl':'https://openflights.org/data','revision':(source/'revision.txt').read_text().strip(),'historicalDate':'2014-06','prepared':'2026-09-17','license':'ODbL-1.0','inputs':{name:hashlib.sha256((source/name).read_bytes()).hexdigest() for name in ['airports.dat','routes.dat']},'counts':{'connections':len(rows),'airports':len(used)},'columns':['fromOpenFlightsId','toOpenFlightsId','fromLat','fromLon','toLat','toLon','routeMaximumMetres','artisticIntensity'],'selection':'Deduplicated undirected nonstop pairs. Geographic cell coverage then record-multiplicity and endpoint-connectivity ranking; bounded at 2400. Multiplicity is not traffic volume.','geometry':'Illustrative great-circle interpolation and exaggerated constant cruise clearance; not historical flown paths or current service.'}
(out/'air-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(manifest['counts'])
