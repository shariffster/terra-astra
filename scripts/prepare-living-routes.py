"""Author illustrative marine structures against the existing ETOPO water mask.

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
                  for dy in range(-5,6) for dx in range(-5,6) if 1<y+dy<H-2]
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

# Each structure is a leg of a connected global circulation, not a drawn arrow.
sea=[
 ('sg','malacca'),('malacca','lanka'),('lanka','arabian'),('arabian','aden'),('aden','red'),
 ('arabian','oman'),('oman','gulf'),('arabian','mumbai'),('lanka','bengal'),('bengal','malacca'),
 ('sg','scs'),('scs','hongkong'),('hongkong','taiwan'),('taiwan','japan'),('taiwan','shanghai'),
 ('shanghai','korea'),('scs','manila'),('japan','hawaii'),('hawaii','la'),('japan','sf'),
 ('la','panamap'),('panamap','chile'),('panamac','miami'),('miami','ny'),('ny','channel'),
 ('channel','northsea'),('ny','lisbon'),('lisbon','gibraltar'),('gibraltar','sicily'),('sicily','egypt'),
 ('sicily','marseille'),('lisbon','dakar'),('dakar','lagos'),('lagos','cape'),('cape','mombasa'),
 ('mombasa','arabian'),('cape','recife'),('recife','brazil'),('sg','sunda'),('sunda','perth'),
 ('sunda','java'),('java','sydney'),('sydney','auckland'),('auckland','hawaii'),
]
network=[
 ('sg','hongkong',['scs']),('sg','japan',['guam']),('sg','manila',[]),('sg','perth',['sunda']),
 ('sg','lanka',['malacca']),('sg','bengal',['malacca']),('lanka','mumbai',[]),('mumbai','oman',[]),
 ('oman','gulf',[]),('oman','karachi',[]),('oman','aden',[]),('aden','red',[]),
 ('lanka','mombasa',['indian']),('mombasa','cape',[]),('cape','perth',['indian']),
 ('perth','java',[]),('java','sg',['sunda']),('hongkong','taiwan',[]),('taiwan','shanghai',[]),
 ('shanghai','korea',[]),('korea','japan',[]),('japan','guam',[]),('guam','manila',[]),
 ('guam','sydney',[[0,155],[-18,160]]),('sydney','auckland',[]),('auckland','fiji',[]),
 ('fiji','hawaii',[[0,-170]]),('hawaii','sf',[]),('hawaii','la',[]),
 ('japan','sf',[[43,165],[44,-170],[43,-145]]),('sf','la',[]),('la','panamap',[]),
 ('panamap','chile',[]),('panamac','miami',[]),('miami','ny',[]),('ny','norfolk',[]),
 ('ny','ireland',[[43,-50],[49,-30]]),('ny','lisbon',[[36,-48],[37,-27]]),
 ('norfolk','channel',[[38,-55],[46,-25]]),('ireland','iceland',[]),('ireland','channel',[]),
 ('channel','northsea',[]),('lisbon','gibraltar',[]),('gibraltar','marseille',[[37,0]]),
 ('marseille','sicily',[]),('sicily','greece',[]),('greece','egypt',[]),('lisbon','dakar',[]),
 ('dakar','lagos',[]),('lagos','cape',[]),('dakar','recife',[]),('recife','brazil',[]),
 ('brazil','cape',[[-30,-20],[-32,0]]),('miami','recife',[[20,-60],[5,-45]]),
 ('ny','panamac',['miami']),('bengal','hongkong',['malacca','sg','scs']),
]

def prepare(a,b,via,kind,index):
    controls=[nodes[a]]+[nodes[p] if isinstance(p,str) else p for p in via]+[nodes[b]]
    points=[]
    for left,right in zip(controls,controls[1:]):
        leg=route(left,right)
        points.extend(leg if not points else leg[1:])
    return {'id':f'{kind}-{a}-{b}','label':f'{a.title()} / {b.title()}', 'waypoints':points}

out={'sea':[prepare(a,b,[],'sea',i) for i,(a,b) in enumerate(sea)],
     'cables':[prepare(a,b,via,'network',i) for i,(a,b,via) in enumerate(network)]}
target=ROOT/'lib/world/living-routes.ts'
target.write_text('/** Generated by scripts/prepare-living-routes.py from the bundled ETOPO grid.\n'
                  ' * Authored illustrations, not actual traffic or cable alignments. */\n'
                  'export const livingRoutes = '+json.dumps(out,separators=(',',':'))+' as const;\n')
print(f'Prepared {len(sea)} sea structures and {len(network)} network paths; {target.stat().st_size} bytes')
