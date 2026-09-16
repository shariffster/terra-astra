"""Prepare small, source-backed artistic fields. Runtime needs no data provider.
Requires rasterio, numpy. Source downloads stay outside the Site checkout.
Population is GPWv4 2020 via Stanford's COG mirror. Footprint is Venter et al.
2009 via the authors' WCS mirror, not the later HF3 data series.
"""
import argparse, hashlib, json, pathlib
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling
from rasterio.transform import from_bounds
ROOT = pathlib.Path(__file__).resolve().parents[1]
POP_URL = 'https://data.naturalcapitalalliance.stanford.edu/download/global/ciesin-nasa-gpw-grdi/ciesen_nasa_gpw_v4_population_density_2020.tif'
parser=argparse.ArgumentParser();parser.add_argument('--footprint-tif',required=True);parser.add_argument('--population-cache');parser.add_argument('--footprint-cache');args=parser.parse_args()
width,height=2160,1080
if args.population_cache: population=np.load(args.population_cache)
else:
 with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
  with rasterio.open(POP_URL) as src: population=src.read(1,out_shape=(height,width),resampling=Resampling.average)
if args.footprint_cache: footprint=np.load(args.footprint_cache)
else:
 footprint=np.full((height,width),-1,dtype='float32')
 with rasterio.open(args.footprint_tif) as src:
  reproject(source=rasterio.band(src,1),destination=footprint,src_transform=src.transform,src_crs=src.crs,dst_transform=from_bounds(-180,-90,180,90,width,height),dst_crs='EPSG:4326',dst_nodata=-1,resampling=Resampling.average,warp_mem_limit=128)
grid=np.fromfile(ROOT/'public/data/relief-grid.bin',dtype='<i2').reshape(720,1440)
def elevation(lon,lat):
 x=((lon+180)/360*1440-.5+1440)%1440;y=np.clip((90-lat)/180*720-.5,0,719)
 x0=x.astype(int);y0=y.astype(int);tx=x-x0;ty=y-y0
 return (grid[y0,x0]*(1-tx)+grid[y0,(x0+1)%1440]*tx)*(1-ty)+(grid[np.minimum(y0+1,719),x0]*(1-tx)+grid[np.minimum(y0+1,719),(x0+1)%1440]*tx)*ty
metadata={ 'grid':[width,height], 'sampling':'Area-weighted seeded sampling; cell jitter, logarithmic population weights, positive footprint index weights; ETOPO ocean rejection. Density and brightness are artistic, not quantitative legends.', 'fields':{} }
for name,values,count,seed in [('population',population,60000,2020),('footprint',footprint,72000,2009)]:
 clean=np.where(np.isfinite(values)&(values>0),values,0)
 weight=(np.log1p(clean)/np.log(1001) if name=='population' else clean/50)**.82
 weight=np.clip(weight,0,1.6)*np.cos(np.deg2rad(90-(np.arange(height)+.5)*180/height))[:,None]
 rng=np.random.default_rng(seed);flat=weight.ravel();idx=rng.choice(len(flat),count*3,replace=True,p=flat/flat.sum())
 lon=(idx%width+rng.random(len(idx)))/width*360-180;lat=90-(idx//width+rng.random(len(idx)))/height*180
 e=elevation(lon,lat);keep=e>=0;lon=lon[keep][:count];lat=lat[keep][:count];idx=idx[keep][:count];e=e[keep][:count]
 assert len(lon)==count
 radius=1+.078*(np.maximum(0,e)/8500)**.72+.00010;a=np.deg2rad(lon);b=np.deg2rad(lat)
 v=clean.ravel()[idx];strength=np.clip(np.log1p(v)/np.log(1001) if name=='population' else v/50,0,1)
 out=np.column_stack([radius*np.cos(b)*np.sin(a),radius*np.sin(b),radius*np.cos(b)*np.cos(a),.22+.62*strength,.45+rng.random(count)*.5,rng.random(count)*np.pi*2]).astype('<f4')
 path=ROOT/f'public/data/human-{name}.bin';out.tofile(path)
 metadata['fields'][name]={'particles':count,'year':2020 if name=='population' else 2009,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':POP_URL if name=='population' else 'https://hii-v2-downloads.wcshumanfootprint.org/data/HFP2009.zip','citation':'CIESIN (2018), GPWv4 Population Density Revision 11, 2020 estimates, NASA SEDAC. doi:10.7927/H49C6VHW' if name=='population' else 'Venter et al. (2016), Global terrestrial Human Footprint maps for 1993 and 2009. doi:10.5061/dryad.052q5','license':'CC BY 4.0' if name=='population' else 'CC0 (original Dryad dataset)','rawRange':[float(clean.min()),float(clean.max())]}
 for label,x,y in [('Tokyo',139.7,35.7),('Nile',31,30),('Sahara',10,23),('Amazon',-65,-5)]:
  col=int((x+180)/360*width);row=int((90-y)/180*height);metadata['fields'][name].setdefault('referenceCells',{})[label]=round(float(values[row,col]),3)
(ROOT/'public/data/human-fields-manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata))
