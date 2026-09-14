import { tileCoordinate, tileLonLat, type RoadTile } from './vector-roads';
import { distanceKm } from './open-types';

export const LOCAL_CACHE_LIMIT=24, LOCAL_CACHE_BYTES=6*1024*1024;
export type RoadWindow = { tiles:RoadTile[];lat:number;lon:number;radiusKm:number;key:string;failures:number;z:number };
/** CPU tiles are LRU bounded; a view holds at most two batched GPU windows.
 * Requests are explicit, timeout bounded, and tied to that view's AbortSignal. */
export class LocalWindowCache {
  private entries=new Map<string,RoadTile>();
  private bytes=0;
  requests=0; failures=0; evictions=0;
  get size(){return this.entries.size;}
  get byteLength(){return this.bytes;}
  clear(){this.entries.clear();this.bytes=0;}
  async prepare(lat:number,lon:number,z:number,signal:AbortSignal):Promise<RoadWindow> {
    const t=tileCoordinate(lon,lat,z),cx=Math.floor(t.x),cy=Math.floor(t.y),n=2**z;
    const jobs:{x:number;y:number}[]=[];
    for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)if(cy+y>=0&&cy+y<n)jobs.push({x:(cx+x+n)%n,y:cy+y});
    // The current tile first, followed by its immediate neighbors.
    jobs.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
    const tiles:RoadTile[]=[],deadline=Date.now()+10000;let index=0,failures=0;
    const worker=async()=>{while(index<jobs.length){signal.throwIfAborted();const job=jobs[index++],key=`${z}/${job.x}/${job.y}`;const cached=this.entries.get(key);if(cached){this.entries.delete(key);this.entries.set(key,cached);tiles.push(cached);continue;}
      try{
        const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Window deadline');
        this.requests++;
        const response=await fetch(`/api/terra/roads?z=${z}&x=${job.x}&y=${job.y}`,{signal:AbortSignal.any([signal,AbortSignal.timeout(Math.min(7500,remaining))])});
        if(!response.ok)throw new Error('Roads unavailable');
        const bytes=await response.arrayBuffer();signal.throwIfAborted();
        if(bytes.byteLength%20||bytes.byteLength>240000)throw new Error('Invalid road tile');
        const coordinates=new Float32Array(bytes);
        if(!coordinates.every(Number.isFinite))throw new Error('Invalid road coordinates');
        const tile={coordinates,segments:coordinates.length/5,z,x:job.x,y:job.y};
        this.entries.set(key,tile);this.bytes+=bytes.byteLength;tiles.push(tile);
        while(this.entries.size>LOCAL_CACHE_LIMIT||this.bytes>LOCAL_CACHE_BYTES){const oldest=this.entries.keys().next().value!;this.bytes-=this.entries.get(oldest)!.coordinates.byteLength;this.entries.delete(oldest);this.evictions++;}
      }catch(e){if(signal.aborted)throw e;failures++;this.failures++;}
    }};
    await Promise.all([worker(),worker()]);signal.throwIfAborted();
    const [centerLon,centerLat]=tileLonLat(cx+.5,cy+.5,z),[edgeLon,edgeLat]=tileLonLat(cx+1.5,cy+.5,z);
    return {tiles,lat:centerLat,lon:centerLon,radiusKm:distanceKm({lat:centerLat,lon:centerLon},{lat:edgeLat,lon:edgeLon})*1.43,key:`${z}/${cx}/${cy}`,failures,z};
  }
}

export function needsRecenter(window:RoadWindow,lat:number,lon:number) {
  const a=tileCoordinate(window.lon,window.lat,window.z),b=tileCoordinate(lon,lat,window.z),n=2**window.z;
  let dx=b.x-a.x;if(dx>n/2)dx-=n;if(dx< -n/2)dx+=n;
  return Math.max(Math.abs(dx),Math.abs(b.y-a.y))>.55;
}
