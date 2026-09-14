"""Compact deterministic gazetteer from the incumbent Natural Earth source revision.
Coordinates are copied from source representative points, or derived from source bounds.
Raw downloaded inputs stay ignored; their URLs/hashes accompany the distributed output.
"""
import json, hashlib, urllib.request, urllib.parse, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data-source/open-earth'; RAW.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/data/open-earth'; OUT.mkdir(parents=True,exist_ok=True)
REV='789c9904087846cc3361302857aa2e76b0ae71ff'
sources=[]; places=[]
def source(name):
    url=f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/{name}.geojson'
    path=RAW/(name+'.geojson')
    if not path.exists():
        path.write_bytes(urllib.request.urlopen(url,timeout=60).read())
    data=path.read_bytes();sources.append({'dataset':name,'url':url,'sha256':hashlib.sha256(data).hexdigest(),'license':'Public domain'})
    return json.loads(data)['features']
def get(p,*keys):
    return next((p[k] for k in keys if p.get(k) is not None),None)
def append(f,dataset,kind):
    p=f['properties']; name=get(p,'name_en','NAME_EN','name','NAME'); b=f.get('bbox')
    if not name:return
    if f['geometry']['type']=='Point':lon,lat=f['geometry']['coordinates'][:2]
    elif get(p,'LONGITUDE','longitude','long_x','LONG_X') is not None:
        lon=get(p,'LONGITUDE','longitude','long_x','LONG_X');lat=get(p,'LATITUDE','latitude','lat_y','LAT_Y')
    elif b:lon=(b[0]+b[2])/2;lat=(b[1]+b[3])/2
    else:return
    if lat is None or not math.isfinite(float(lat)):return
    aliases=list(dict.fromkeys(str(v).replace('\n',' ') for k,v in p.items() if v and (k.lower().startswith('name') or k.lower() in ['label','nameascii','namealt','name_alt','abbrev','postal'])))
    places.append({'id':'ne-'+str(get(p,'ne_id','NE_ID') or f'{dataset}-{len(places)}'),'label':str(name).replace('\n',' '),'lat':float(lat),'lon':float(lon),'kind':kind,'category':str(get(p,'featurecla','FEATURECLA') or kind),'region':str(get(p,'adm0name','ADMIN','region','REGION') or ''),'population':max(0,int(get(p,'pop_max','POP_MAX') or 0)),'aliases':aliases,'source':'natural-earth','dataset':dataset,**({'bounds':b} if b and b[0]!=b[2] and b[2]-b[0]<180 else {})})

for f in source('ne_10m_populated_places_simple'):append(f,'ne_10m_populated_places_simple','city')
for dataset,kind in [('ne_10m_geography_regions_points','feature'),('ne_10m_geography_regions_polys','region'),('ne_10m_geography_marine_polys','maritime'),('ne_50m_admin_0_countries','country'),('ne_10m_lakes','lake')]:
    for f in source(dataset):append(f,dataset,kind)

# A geographic grouping, not a new administrative boundary. Derive the view from
# Natural Earth's source bounds of the eight northern Italian regions.
names={'Piemonte','Valle d’Aosta','Valle d\'Aosta','Lombardia','Trentino-Alto Adige','Veneto','Friuli-Venezia Giulia','Liguria','Emilia-Romagna'}
italy=[f for f in source('ne_10m_admin_1_states_provinces') if f['properties'].get('admin')=='Italy' and f['properties'].get('region') in names]
if italy:
    b=[min(f['bbox'][0] for f in italy),min(f['bbox'][1] for f in italy),max(f['bbox'][2] for f in italy),max(f['bbox'][3] for f in italy)]
    places.append({'id':'ne-northern-italy','label':'Northern Italy','lat':(b[1]+b[3])/2,'lon':(b[0]+b[2])/2,'kind':'region','category':'geographic grouping','region':'Italy','population':0,'aliases':['Northern Italy','North Italy','Italia settentrionale'],'source':'natural-earth','dataset':'ne_10m_admin_1_states_provinces','bounds':b,'members':[f['properties']['name'] for f in italy]})
    print('Northern Italy source members:',[f['properties']['name'] for f in italy])
fuji=RAW/'fuji-photon.json'
fuji_url='https://photon.komoot.io/api/?'+urllib.parse.urlencode({'q':'Mount Fuji Japan','limit':5,'lang':'en'})
if not fuji.exists():fuji.write_bytes(urllib.request.urlopen(fuji_url,timeout=20).read())
fuji_bytes=fuji.read_bytes()
for f in json.loads(fuji_bytes)['features']:
    p=f['properties']
    if p.get('osm_id')==714354378 and p.get('osm_value')=='volcano' and p.get('countrycode')=='JP':
        lon,lat=f['geometry']['coordinates']
        places.append({'id':'osm-N-714354378','label':'Mount Fuji','lat':lat,'lon':lon,'kind':'mountain','category':'volcano','region':'Japan','population':0,'aliases':['Mount Fuji','Fuji','Fujisan','富士山'],'source':'photon','dataset':'OSM node 714354378 via Photon, snapshot 2026-09-14'})
sources.append({'dataset':'Mount Fuji source snapshot','url':fuji_url,'sha256':hashlib.sha256(fuji_bytes).hexdigest(),'license':'OpenStreetMap ODbL','sourceId':'https://www.openstreetmap.org/node/714354378'})
seen=set();places=[p for p in places if p['id'] not in seen and not seen.add(p['id'])]
(OUT/'places.json').write_text(json.dumps(places,ensure_ascii=False,separators=(',',':')))
(OUT/'provenance.json').write_text(json.dumps({'prepared':'2026-09-14','revision':REV,'sources':sources,'count':len(places),'note':'Historical source points and generalized bounds, not surveyed addresses. Context radii and camera framing are interpretive.'},indent=2))
print('Prepared',len(places),'places;', (OUT/'places.json').stat().st_size,'bytes')
for q in ['reyk','nairobi','kyoto','alps','fuji','malacca','patagonia','victoria','sicily','bali','gulf']:
    matches=[(p['label'],p['kind'],p['lat'],p['lon']) for p in places if q in p['label'].lower()]
    print(q,matches[:8])
