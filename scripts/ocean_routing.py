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
def route(a,b,max_nodes=None):
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
    costs={start:0}; previous={}; settled=set()
    while queue:
        _,i=heapq.heappop(queue)
        if i in settled:continue
        settled.add(i)
        if max_nodes and len(settled)>max_nodes:raise ValueError("Ocean search budget exceeded")
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
