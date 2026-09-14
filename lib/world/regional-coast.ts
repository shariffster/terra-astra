import { distanceKm, degrees, type ResolvedWorldTarget } from './open-types';

/** Three by three regional cells, LRU capped to nine / two MiB. */
export class RegionalCoast {
  private tiles=new Map<string,Float32Array>();
  private bytes=0;
  clear(){this.tiles.clear();this.bytes=0;}
  get size(){return this.tiles.size;}
  async prepare(focus:Pick<ResolvedWorldTarget,'lat'|'lon'|'contextRadiusKm'>,signal:AbortSignal) {
    const cx=Math.min(17,Math.max(0,Math.floor((focus.lon+180)/20))),cy=Math.min(8,Math.max(0,Math.floor((focus.lat+90)/20))),result:number[]=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      signal.throwIfAborted();if(cy+dy<0||cy+dy>8)continue;const key=`${(cx+dx+18)%18}-${cy+dy}`;
      let tile=this.tiles.get(key);
      if(tile){this.tiles.delete(key);this.tiles.set(key,tile);}
      else try{
        const response=await fetch(`/data/open-earth/coast/${key}.bin`,{signal:AbortSignal.any([signal,AbortSignal.timeout(4000)])});if(!response.ok)continue;
        const data=await response.arrayBuffer();signal.throwIfAborted();if(data.byteLength>512000||data.byteLength%16)continue;tile=new Float32Array(data);if(!tile.every(Number.isFinite))continue;this.tiles.set(key,tile);this.bytes+=data.byteLength;
        while(this.tiles.size>9||this.bytes>2097152){const oldest=this.tiles.keys().next().value!;this.bytes-=this.tiles.get(oldest)!.byteLength;this.tiles.delete(oldest);}
      }catch{if(signal.aborted)throw signal.reason;continue;}
      for(let i=0;i+3<tile.length&&result.length/6<25000;i+=4){
        if(distanceKm(focus,{lon:(tile[i]+tile[i+2])/2,lat:(tile[i+1]+tile[i+3])/2})>focus.contextRadiusKm*1.5)continue;
        for(const k of [0,2]){const a=tile[i+k]*degrees,b=tile[i+k+1]*degrees;result.push(1.000065*Math.cos(b)*Math.sin(a),1.000065*Math.sin(b),1.000065*Math.cos(b)*Math.cos(a));}
      }
    }
    return new Float32Array(result);
  }
}
