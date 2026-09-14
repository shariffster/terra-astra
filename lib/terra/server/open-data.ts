import { decodeRoadTile } from '../../world/vector-roads';
import type { SourcePlace } from '../../world/open-types';

const tileCache = new Map<string,{data:ArrayBuffer;at:number}>();
const placeCache = new Map<string,{places:SourcePlace[];at:number}>();
let tileBytes=0,tileActive=0,placeActive=0,lastLookup=0;
const TILE_BYTES=8*1024*1024, TTL=86400000;
const TILE_TEMPLATE='https://tiles.openfreemap.org/planet/20260906_080001_pt/{z}/{x}/{y}.pbf';
// Deliberately pin source revision for reproducible caching. OpenFreeMap's
// missing historical versions can redirect to latest; provenance states this.
const headers={'User-Agent':'TerraAstra-OpenEarth/1.0 (+https://terra-astra-peoples-choice-v010.riffster.chatgpt.site)'};
async function bounded(response:Response,max:number) {
  if(!response.ok)throw new Error('Data unavailable');
  if(Number(response.headers.get('content-length'))>max)throw new Error('Data exceeds budget');
  const reader=response.body?.getReader();if(!reader)return new Uint8Array(0);
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw new Error('Data exceeds budget');chunks.push(value);}}catch(e){await reader.cancel();throw e;}finally{reader.releaseLock();}
  const result=new Uint8Array(size);let i=0;for(const chunk of chunks){result.set(chunk,i);i+=chunk.length;}return result;
}
function json(body:unknown,status=200,ttl=60) {return Response.json(body,{status,headers:{'Cache-Control':`public, max-age=${ttl}`}});}
export async function handlePlaceRequest(request:Request) {
  const q=new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if(q.length<2||q.length>120)return json({error:'Enter a place name.'},400);
  const key=q.toLowerCase(),cached=placeCache.get(key);
  if(cached&&Date.now()-cached.at<TTL){placeCache.delete(key);placeCache.set(key,cached);return json({places:cached.places},200,86400);}
  if(placeActive>=1||Date.now()-lastLookup<1100)return json({error:'Place lookup is busy. Try again shortly.'},429,0);
  lastLookup=Date.now();placeActive++;
  try{
    const url='https://photon.komoot.io/api/?'+new URLSearchParams({q,limit:'6',lang:'en'});
    const bytes=await bounded(await fetch(url,{headers,signal:AbortSignal.any([request.signal,AbortSignal.timeout(5000)])}),200000);
    const data=JSON.parse(new TextDecoder().decode(bytes));const places:SourcePlace[]=[];
    for(const f of (data.features ?? []).slice(0,6)){
      const p=f.properties ?? {},c=f.geometry?.coordinates;
      if(f.geometry?.type!=='Point'||!Array.isArray(c)||!Number.isFinite(c[0])||!Number.isFinite(c[1])||Math.abs(c[0])>180||Math.abs(c[1])>90||typeof p.name!=='string'||!p.osm_id)continue;
      // Addresses/shops are outside this public place-name resolver's scope.
      if(!['place','natural','waterway','boundary'].includes(p.osm_key))continue;
      const kind=p.osm_value==='city'?'city':['town','village','hamlet'].includes(p.osm_value)?'settlement':p.osm_value==='peak'?'mountain':['sea','strait','bay'].includes(p.osm_value)?'maritime':['island','islet'].includes(p.osm_value)?'island':p.osm_value==='country'?'country':'region';
      places.push({id:`osm-${p.osm_type}-${p.osm_id}`,label:p.name.slice(0,100),lat:c[1],lon:c[0],kind,category:p.osm_value,region:[p.state,p.country].filter(Boolean).join(', ').slice(0,160),population:0,aliases:[p.name],source:'photon',dataset:'Photon OSM place index',...(Array.isArray(p.extent)&&p.extent.length===4&&p.extent.every(Number.isFinite)?{bounds:[p.extent[0],p.extent[3],p.extent[2],p.extent[1]] as const}:{})});
    }
    if(places.length){placeCache.delete(key);placeCache.set(key,{places,at:Date.now()});while(placeCache.size>64)placeCache.delete(placeCache.keys().next().value!);}
    return json({places,source:'OpenStreetMap via Photon · ODbL'},200,places.length?86400:60);
  }catch{return json({error:'Place lookup is unavailable.'},503,0);}finally{placeActive--;}
}
export async function handleRoadRequest(request:Request) {
  const q=new URL(request.url).searchParams,z=Number(q.get('z')),x=Number(q.get('x')),y=Number(q.get('y'));
  if(!['z','x','y'].every(k=>q.has(k))||![6,8,10,11,14].includes(z)||![x,y].every(n=>Number.isInteger(n)&&n>=0&&n<2**z))return json({error:'Invalid road tile.'},400);
  const key=`${z}/${x}/${y}`,cached=tileCache.get(key);
  const response=(data:ArrayBuffer)=>new Response(data.slice(0),{headers:{'Content-Type':'application/octet-stream','Cache-Control':'public, max-age=86400','X-Terra-Source':'OpenFreeMap / OpenMapTiles / OpenStreetMap ODbL','X-Terra-Requested-Tile-Revision':'20260906_080001_pt'}});
  if(cached&&Date.now()-cached.at<TTL){tileCache.delete(key);tileCache.set(key,cached);return response(cached.data);}
  if(tileActive>=4)return json({error:'Road data is busy.'},429,0);
  tileActive++;
  try{
    const url=TILE_TEMPLATE.replace('{z}',String(z)).replace('{x}',String(x)).replace('{y}',String(y));
    const bytes=await bounded(await fetch(url,{headers,signal:AbortSignal.any([request.signal,AbortSignal.timeout(6000)])}),1024*1024);
    const tile=decodeRoadTile(bytes,z,x,y),data=tile.coordinates.buffer as ArrayBuffer;
    const previous=tileCache.get(key);if(previous){tileCache.delete(key);tileBytes-=previous.data.byteLength;}
    tileCache.set(key,{data,at:Date.now()});tileBytes+=data.byteLength;
    while(tileCache.size>32||tileBytes>TILE_BYTES){const oldest=tileCache.keys().next().value!,entry=tileCache.get(oldest)!;tileBytes-=entry.data.byteLength;tileCache.delete(oldest);}
    return response(data);
  }catch{return json({error:'Local roads are unavailable. Broader geography remains available.'},503,0);}finally{tileActive--;}
}
export function openDataDiagnostics(){return {tileCache:tileCache.size,tileBytes,tileActive,placeCache:placeCache.size,placeActive};}
