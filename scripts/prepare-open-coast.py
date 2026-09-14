"""Regional coastline tiles from pinned Natural Earth 1:10m, public domain.
Simplification is source-coordinate selection; no generated coastline geometry.
"""
from pathlib import Path
import json,math,array,hashlib,urllib.request
root=Path(__file__).resolve().parents[1];raw=root/'data-source/open-earth/ne_10m_coastline.geojson'
url='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/789c9904087846cc3361302857aa2e76b0ae71ff/geojson/ne_10m_coastline.geojson'
if not raw.exists():raw.write_bytes(urllib.request.urlopen(url,timeout=60).read())
data=raw.read_bytes();sources=[{'url':url,'sha256':hashlib.sha256(data).hexdigest()}];features=json.loads(data)['features']
lakes_url=url.replace('ne_10m_coastline','ne_10m_lakes');lakes_raw=raw.with_name('ne_10m_lakes.geojson')
if not lakes_raw.exists():lakes_raw.write_bytes(urllib.request.urlopen(lakes_url,timeout=60).read())
lake_data=lakes_raw.read_bytes();sources.append({'url':lakes_url,'sha256':hashlib.sha256(lake_data).hexdigest()});features+=json.loads(lake_data)['features']
out=root/'public/data/open-earth/coast';out.mkdir(parents=True,exist_ok=True)
tiles={(x,y):[] for x in range(18) for y in range(9)}
def simplify(points,epsilon=.012):
    if len(points)<3:return points
    ax,ay=points[0][:2];bx,by=points[-1][:2];dx=bx-ax;dy=by-ay;den=dx*dx+dy*dy
    far=-1;best=epsilon*epsilon
    for i in range(1,len(points)-1):
        px,py=points[i][:2];t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/den)) if den else 0
        d=(px-ax-dx*t)**2+(py-ay-dy*t)**2
        if d>best:best=d;far=i
    if far<0:return [points[0],points[-1]]
    return simplify(points[:far+1],epsilon)[:-1]+simplify(points[far:],epsilon)
for f in features:
    g=f['geometry']
    if not g:continue
    paths=g['coordinates'] if g['type'] in ('MultiLineString','Polygon') else [ring for polygon in g['coordinates'] for ring in polygon] if g['type']=='MultiPolygon' else [g['coordinates']]
    for path in paths:
        pts=simplify(path)
        for a,b in zip(pts,pts[1:]):
            if abs(a[0]-b[0])>180:continue
            x=min(17,max(0,int(((a[0]+b[0])/2+180)/20)));y=min(8,max(0,int(((a[1]+b[1])/2+90)/20)))
            tiles[x,y].extend([*a[:2],*b[:2]])
count=0
for (x,y),coords in tiles.items():
    buf=array.array('f',coords)
    if __import__('sys').byteorder!='little':buf.byteswap()
    (out/f'{x}-{y}.bin').write_bytes(buf.tobytes());count+=len(coords)//4
(out/'provenance.json').write_text(json.dumps({'sources':sources,'license':'Natural Earth public domain','prepared':'2026-09-14','segments':count,'tileDegrees':20,'simplificationDegrees':.012,'note':'Generalized ocean and inland-lake shorelines; not local navigation data.'},indent=2))
print(count,'sourced coastline segments in',len(tiles),'bounded geographic cells')
