"""Run F: deterministic illustrative ocean topology from incumbent geography.

This is a reproducible artistic route preparation tool, not a navigation planner
or a source of real cable alignments. No external data or network access.
"""
import array
import heapq
import json
import math
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
grid = array.array('h', (ROOT / 'public/data/relief-grid.bin').read_bytes())
W, H = 1440, 720
ocean = bytearray(W*H)
seed = 360*W+80
frontier = deque([seed]); ocean[seed] = 1
while frontier:
    i = frontier.popleft(); x,y = i%W,i//W
    for j in (y*W+(x-1)%W,y*W+(x+1)%W,i-W,i+W):
        if 0<=j<W*H and not ocean[j] and grid[j]<-15:
            ocean[j]=1;frontier.append(j)

def elevation(lat, lon):
    x = ((lon + 180) * 4 - .5) % W
    y = min(H - 1, max(0, (90 - lat) * 4 - .5))
    ix, iy = int(x), int(y)
    tx, ty = x - ix, y - iy
    a, b = grid[iy*W+ix], grid[iy*W+(ix+1)%W]
    c, d = grid[min(H-1,iy+1)*W+ix], grid[min(H-1,iy+1)*W+(ix+1)%W]
    return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty

def coords(i):
    return [90-(i//W+.5)/4, (i%W+.5)/4-180]

def nearest(point):
    lat, lon = point
    x, y = round((lon+180)*4-.5)%W, round((90-lat)*4-.5)
    candidates = [((dx*math.cos(math.radians(lat)))**2+dy*dy, (y+dy)*W+(x+dx)%W)
                  for dy in range(-18,19) for dx in range(-18,19) if 1<y+dy<H-2]
    return next(i for _,i in sorted(candidates) if ocean[i])

def great(a, b, t):
    def xyz(p):
        lat,lon=map(math.radians,p)
        return (math.cos(lat)*math.sin(lon),math.sin(lat),math.cos(lat)*math.cos(lon))
    aa,bb=xyz(a),xyz(b)
    angle=math.acos(max(-1,min(1,sum(x*y for x,y in zip(aa,bb)))))
    if angle<1e-10:return a
    s=math.sin(angle)
    v=[(x*math.sin((1-t)*angle)+y*math.sin(t*angle))/s for x,y in zip(aa,bb)]
    return [math.degrees(math.asin(max(-1,min(1,v[1])))), math.degrees(math.atan2(v[0],v[2]))]

def wet(a,b):
    # Quarter-cell checks including curved great-circle interpolation.
    n=max(2,math.ceil(max(abs(a[0]-b[0]),abs((a[1]-b[1]+180)%360-180))/.015))
    return all(elevation(*great(a,b,k/n))<-5 for k in range(n+1))

cache={}
def route(a,b):
    start,end=nearest(a),nearest(b)
    if (start,end) in cache:return cache[start,end]
    ca,cb=coords(start),coords(end)
    if wet(ca,cb): return [ca,cb]
    ex,ey=end%W,end//W
    def heuristic(i):
        x,y=i%W,i//W
        dx=min(abs(x-ex),W-abs(x-ex))*math.cos(math.radians((coords(i)[0]+cb[0])/2))
        return math.hypot(dx,y-ey)
    queue=[(heuristic(start),start)]
    costs={start:0}; previous={}
    while queue:
        _,i=heapq.heappop(queue)
        if i==end:break
        x,y=i%W,i//W
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                if not (dx or dy) or not 1<y+dy<H-2:continue
                j=(y+dy)*W+(x+dx)%W
                if grid[j]>=-15:continue
                if dy and dx and (grid[y*W+(x+dx)%W]>=-15 or grid[(y+dy)*W+x]>=-15):continue
                move=math.hypot(dx*math.cos(math.radians(coords(i)[0])),dy)
                score=costs[i]+move*(1+.08*math.exp(grid[j]/200))
                if score<costs.get(j,math.inf):
                    costs[j]=score;previous[j]=i;heapq.heappush(queue,(score+heuristic(j),j))
    else:raise ValueError(f'No water connection: {a} -> {b}')
    path=[end]
    while path[-1]!=start:path.append(previous[path[-1]])
    points=[coords(i) for i in reversed(path)]
    # Greedy string-pulling keeps smooth arcs while preserving water clearance.
    smooth=[points[0]];k=0
    while k<len(points)-1:
        j=len(points)-1
        while j>k+1 and not wet(points[k],points[j]):j-=1
        if not wet(points[k],points[j]):raise ValueError('Unresolved water-mask edge')
        smooth.append(points[j]);k=j
    cache[start,end]=smooth;cache[end,start]=list(reversed(smooth))
    return smooth

# Shared offshore gathering areas. These are not asserted port/landing positions.
nodes={
 'sg':[1.0,104.2], 'malacca':[4.5,99.0], 'bengal':[7,86], 'lanka':[4.5,80],
 'arabian':[12,63], 'aden':[12.3,45], 'red':[25,35], 'oman':[23,60], 'gulf':[25.5,53],
 'mumbai':[18,71], 'karachi':[23,66], 'mombasa':[-5,43], 'cape':[-36,19],
 'perth':[-32,113], 'sunda':[-8,104], 'java':[-10,115], 'scs':[13,113],
 'hongkong':[21,115], 'taiwan':[24,123], 'japan':[34,142], 'shanghai':[30,124],
 'korea':[34,128], 'manila':[15,118], 'guam':[12,145], 'sydney':[-34,153],
 'auckland':[-35,176], 'hawaii':[22,-157], 'la':[32,-120], 'sf':[37,-125],
 'panamap':[7,-80], 'panamac':[10,-80], 'mexico':[20,-88], 'ny':[39,-71],
 'norfolk':[35,-73], 'miami':[26,-78], 'brazil':[-23,-42], 'recife':[-8,-32],
 'lisbon':[38,-11], 'gibraltar':[35.8,-6.5], 'channel':[49,-4], 'northsea':[55,3],
 'ireland':[51,-13], 'iceland':[60,-22], 'marseille':[42,5], 'sicily':[35.5,14],
 'egypt':[32.5,30], 'greece':[35,23], 'dakar':[14,-19], 'lagos':[3,3],
 'chile':[-33,-75], 'fiji':[-19,178], 'indian':[-14,72], 'atlantic':[15,-40],
}


# Reuse accepted routes; imagery is never input geometry.
source=(ROOT/'lib/world/living-routes.ts').read_text()
base=json.loads(source.split('export const livingRoutes = ')[1].split(' as const;')[0])
# The .25-degree ETOPO mask cannot resolve these narrow passages. Explicit
# schematic, authored strait controls replace the old around-island detours.
# They are approximations, not surveyed alignments or navigational guidance.
passages={
 ('sg','malacca'):[[1.12,103.70],[1.20,103.50],[1.50,103.10],[2.20,102.10],[3.10,100.90],[4.375,99.125]],
 ('channel','northsea'):[[48.875,-3.875],[49.65,-3.0],[50.12,-1.45],[50.55,.80],[51.10,1.55],[51.80,2.35],[54.875,3.125]],
}
nodes['sg']=passages['sg','malacca'][0]
# Explicit gateway segments are local exceptions; every other leg is ETOPO checked.
def leg(a,b):
    if isinstance(a,str) and isinstance(b,str) and (a,b) in passages:return passages[a,b]
    if isinstance(a,str) and isinstance(b,str) and (b,a) in passages:return list(reversed(passages[b,a]))
    return route(nodes[a] if isinstance(a,str) else a,nodes[b] if isinstance(b,str) else b)

def make(a,b,kind,via=(),tier='regional',intensity=1,variant=0):
    controls=[a,*via,b];points=[]
    for left,right in zip(controls,controls[1:]):
        part=leg(left,right)
        if points and points[-1]!=part[0]:points.append(part[0])
        points.extend(part if not points else part[1:])
    return dict(id=f'{kind}-{a}-{b}'+(f'-{variant}' if variant else ''),label=f'{a.title()} / {b.title()}',waypoints=points,tier=tier,intensity=intensity,hubA=a,hubB=b)

busy={'sg','malacca','hongkong','shanghai','korea','channel','northsea','egypt','red','aden','gibraltar'}
trunks={'ny','norfolk','japan','sf','la','hawaii','arabian','lanka','cape','recife','perth','sydney'}
def decorate(p):
    a,b=p['id'].split('-')[1:3]
    p.update(hubA=a,hubB=b,tier='gateway' if a in busy and b in busy else 'trunk' if a in trunks and b in trunks else 'regional',intensity=1.30 if a in busy or b in busy else .88 if a in trunks or b in trunks else .58)
    # Preserve each accepted leg except the two unresolved strait detours and
    # routes that inherited that Singapore detour. All fixes are Run F only.
    for (x,y),passage in passages.items():
        oldA=next((q['waypoints'][0] for q in base['sea'] if q['id']==f'sea-{x}-{y}'),None)
        oldB=next((q['waypoints'][-1] for q in base['sea'] if q['id']==f'sea-{x}-{y}'),None)
        pts=p['waypoints']
        if oldA in pts and oldB in pts:
            i,j=pts.index(oldA),pts.index(oldB)
            lo,hi=min(i,j),max(i,j)
            pts[lo:hi+1]=passage if i<j else list(reversed(passage))
    # Shared Singapore origin for all branches.
    p['waypoints']=[nodes['sg'] if q==[.625,104.375] else q for q in p['waypoints']]
    return p
# Capture old geometry first: mutating a route must not change lookup endpoints.
original=json.loads(json.dumps(base))
sea=[decorate(dict(p)) for p in original['sea']]
cables=[decorate(dict(p)) for p in original['cables']]
# Author broad regional connections around known offshore gathering areas.
sea_links=[('malacca','bengal'),('lanka','mumbai'),('mumbai','oman'),('oman','karachi'),('aden','mombasa'),('scs','taiwan'),('hongkong','shanghai'),('japan','korea'),('japan','guam'),('guam','hawaii'),('sf','la'),('ny','norfolk'),('norfolk','miami'),('miami','recife'),('panamac','recife'),('channel','ireland'),('ireland','northsea'),('channel','gibraltar'),('gibraltar','marseille'),('marseille','greece'),('greece','egypt'),('egypt','sicily'),('sydney','fiji'),('perth','cape')]
for a,b in sea_links:
    sea.append(make(a,b,'flow',tier='regional',intensity=1.1 if a in busy or b in busy else .7))
# Parallel ocean crossings converge into common endpoints. Wider in open water,
# tighter at the gateways; never offset an entire path through a coastline.
bundles=[('ny','channel',[[46,-38]],1.35),('ny','lisbon',[[38,-40]],1.05),('japan','sf',[[43,175],[43,-155]],1.25),('japan','hawaii',[[30,177]],1.1),('lanka','arabian',[[9,73]],1.0),('malacca','lanka',[[6,93]],1.45),('gibraltar','sicily',[[37,4]],1.25),('scs','hongkong',[[17,113]],1.4)]
for a,b,via,intensity in bundles:
    for v,shift in enumerate((-.8,.8),1):
        sea.append(make(a,b,'bundle',[[lat+shift,lon] for lat,lon in via],tier='trunk',intensity=intensity,variant=v))
# Canal topology is an explicit surface-only schematic: the incumbent grid
# cannot resolve these cuts. Do not reuse these legs as subsea cables.
suez = route(nodes['egypt'],[31.5,32.35])+[[31.5,32.35],[31.25,32.31],[30.70,32.34],[30.30,32.45],[29.90,32.56],[29.50,32.70]]+route([29.50,32.70],nodes['red'])
panama = route(nodes['panamap'],[8.7,-79.5])+[[8.7,-79.5],[8.95,-79.56],[9.05,-79.65],[9.12,-79.72],[9.22,-79.90],[9.38,-79.93],[9.6,-79.95]]+route([9.6,-79.95],nodes['panamac'])
for a,b,points in [('egypt','red',suez),('panamap','panamac',panama)]:
    sea.append(dict(id=f'canal-{a}-{b}',label='Schematic canal connection',waypoints=points,tier='gateway',intensity=1.5,hubA=a,hubB=b))
# 44 accepted + 24 branches + 16 bundled + 2 schematic canals = 86.

extra=[('sg','taiwan',['scs']),('sg','mumbai',['malacca','lanka']),('sg','chennai',['malacca','bengal']),('malacca','oman',['lanka']),('mumbai','lanka',[]),('mumbai','karachi',[]),('lanka','chennai',[]),('chennai','bengal',[]),('oman','karachi',[]),('oman','aden',[]),('aden','mombasa',[]),('egypt','marseille',['sicily']),('egypt','gibraltar',['sicily']),('marseille','greece',[]),('channel','lisbon',[]),('ireland','lisbon',[]),('northsea','ireland',[]),('ny','channel',[]),('norfolk','ireland',[]),('norfolk','lisbon',[]),('miami','norfolk',[]),('miami','panamac',[]),('recife','lagos',[]),('recife','ny',[[10,-48]]),('hongkong','shanghai',['taiwan']),('hongkong','japan',['taiwan']),('korea','taiwan',[]),('scs','guam',[]),('manila','japan',['guam']),('sf','guam',[[30,-170]]),('la','japan',['hawaii']),('perth','lanka',[]),('sydney','fiji',[]),('fiji','guam',[[0,163]]),('mombasa','lanka',[]),('cape','perth',[[-32,65]])]
nodes['chennai']=[12,82]
for a,b,via in extra:cables.append(make(a,b,'branch',via,intensity=1.05 if a in busy or b in busy else .78))
for i,(a,b,via,intensity) in enumerate(bundles):
    for v,shift in enumerate((-1.8,0,1.8),1):
        cables.append(make(a,b,'parallel',[[lat+shift,lon] for lat,lon in via],tier='trunk',intensity=.85,variant=v))
# 56 accepted + 36 regional + 24 parallel = 116 information paths.
# Hub coordinates come only from our authored paths, and counts encode topology.
hubs={}
for p in cables:
    for key,point in [(p['hubA'],p['waypoints'][0]),(p['hubB'],p['waypoints'][-1])]:
        if key not in hubs:hubs[key]=dict(id=key,point=point,degree=0)
        hubs[key]['degree']+=1
# A small set of interpretive circulation loops: no assertion of observed currents.
flows=[
 ('north-atlantic',[[22,-66],[36,-64],[45,-40],[42,-17],[25,-23],[15,-40],[22,-66]]),
 ('south-atlantic',[[-12,-30],[-28,-40],[-37,-15],[-30,8],[-8,0],[-12,-30]]),
 ('north-pacific',[[20,135],[32,147],[39,175],[35,-145],[20,-125],[12,-160],[20,135]]),
 ('south-pacific',[[-12,-95],[-28,-90],[-38,-125],[-32,-170],[-14,-170],[-8,-130],[-12,-95]]),
 ('indian',[[-8,58],[-25,50],[-32,75],[-27,100],[-12,100],[-6,78],[-8,58]]),
 ('equatorial-pacific',[[1,-100],[2,-130],[1,-160],[1,175],[0,150]]),
 ('equatorial-atlantic',[[2,-5],[1,-20],[2,-36],[8,-50]]),
 ('arabian-sea',[[8,57],[18,60],[18,67],[8,73],[6,64],[8,57]]),
]
flow_records=[]
for name,controls in flows:
    points=[]
    for a,b in zip(controls,controls[1:]):
        part=route(a,b);points.extend(part if not points else part[1:])
    flow_records.append(dict(id=name,waypoints=points))
result=dict(sea=sea,cables=cables,hubs=list(hubs.values()),currents=flow_records)
p=ROOT/'lib/world/ocean-network-data.ts'
p.write_text('/** Run F authored illustrations; generated with bundled ETOPO.\n * Narrow Singapore/Malacca and Dover passages are explicitly schematic.\n * Not AIS, actual cables, landing stations, measured currents or navigation data. */\nexport const oceanNetwork = '+json.dumps(result,separators=(',',':'))+' as const;\n')
print(json.dumps({'sea':len(sea),'cables':len(cables),'hubs':len(hubs),'currents':len(flows),'bytes':p.stat().st_size}))
