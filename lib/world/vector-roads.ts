/** Bounded reader for Mapbox Vector Tile v2 transportation LineStrings.
 * Spec: https://github.com/mapbox/vector-tile-spec/tree/master/2.1
 * It skips other layers and keeps actual coordinates; never generates roads. */
class Reader {
  pos = 0;
  readonly bytes:Uint8Array;
  constructor(bytes: Uint8Array) {this.bytes=bytes;}
  uint() { let n=0,scale=1; for(let i=0;i<10;i++){if(this.pos>=this.bytes.length)throw new Error('Truncated vector tile');const b=this.bytes[this.pos++];n+=(b&127)*scale;if(!(b&128))return n;scale*=128;}throw new Error('Invalid varint'); }
  block() { const length=this.uint(),start=this.pos;this.pos+=length;if(this.pos>this.bytes.length)throw new Error('Truncated vector tile');return this.bytes.subarray(start,this.pos); }
  skip(wire:number) { if(wire===0)this.uint();else if(wire===2)this.block();else if(wire===1)this.pos+=8;else if(wire===5)this.pos+=4;else throw new Error('Invalid wire type');if(this.pos>this.bytes.length)throw new Error('Truncated vector tile'); }
}
const text = new TextDecoder();
function values(bytes:Uint8Array) {const r=new Reader(bytes),out:number[]=[];while(r.pos<bytes.length)out.push(r.uint());return out;}
function value(bytes:Uint8Array):string {const r=new Reader(bytes);while(r.pos<bytes.length){const tag=r.uint();if(tag===10)return text.decode(r.block());r.skip(tag&7);}return '';}
export function tileCoordinate(lon:number,lat:number,z:number) {
  const n=2**z,a=Math.max(-85.0511,Math.min(85.0511,lat))*Math.PI/180;
  return {x:((lon+180)/360*n%n+n)%n,y:(1-Math.asinh(Math.tan(a))/Math.PI)/2*n,z};
}
export function tileLonLat(x:number,y:number,z:number): [number,number] {const n=2**z;return [x/n*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI];}
export type RoadTile = { coordinates: Float32Array; segments: number; z:number; x:number; y:number };
export function decodeRoadTile(bytes:Uint8Array,z:number,x:number,y:number,maxSegments=12000):RoadTile {
  if(bytes.byteLength>1024*1024)throw new Error('Vector tile exceeds byte budget');
  const outer=new Reader(bytes),out:number[]=[];
  while(outer.pos<bytes.length) {
    const tag=outer.uint();if(tag!==26){outer.skip(tag&7);continue;}
    const layer=new Reader(outer.block()),features:Uint8Array[]=[],keys:string[]=[],vals:string[]=[];let name='',extent=4096;
    while(layer.pos<layer.bytes.length){const t=layer.uint();if(t===10)name=text.decode(layer.block());else if(t===18)features.push(layer.block());else if(t===26)keys.push(text.decode(layer.block()));else if(t===34)vals.push(value(layer.block()));else if(t===40)extent=layer.uint();else layer.skip(t&7);}
    if(name!=='transportation'||extent<=0||extent>65536)continue;
    for(const bytes of features){
      const f=new Reader(bytes);let type=0,tags:number[]=[],geometry:Uint8Array=new Uint8Array(0);
      while(f.pos<bytes.length){const t=f.uint();if(t===18)tags=values(f.block());else if(t===24)type=f.uint();else if(t===34)geometry=f.block();else f.skip(t&7);}
      if(type!==2)continue;
      let kind='';for(let k=0;k+1<tags.length;k+=2)if(keys[tags[k]]==='class')kind=vals[tags[k+1]];
      if(!['motorway','trunk','primary','secondary','tertiary','minor','service','path','track','rail'].includes(kind))continue;
      if(z<13&&!['motorway','trunk','primary','secondary','tertiary','rail'].includes(kind))continue;
      const g=new Reader(geometry);let px=0,py=0,previous:[number,number]|undefined;
      while(g.pos<geometry.length&&out.length/5<maxSegments){
        const command=g.uint(),id=command&7,count=command>>>3;if(count>65536)throw new Error('Invalid geometry count');
        if(id===7){previous=undefined;continue;}if(id!==1&&id!==2)throw new Error('Unsupported geometry');
        for(let k=0;k<count;k++){
          const dx=g.uint(),dy=g.uint();px+=(dx>>>1)^-(dx&1);py+=(dy>>>1)^-(dy&1);
          const p=tileLonLat(x+px/extent,y+py/extent,z);
          // Clip duplication from tile buffer to the tile owning the midpoint.
          if(id===2&&previous){const mid=tileCoordinate((previous[0]+p[0])/2,(previous[1]+p[1])/2,z);if(Math.floor(mid.x)===x&&Math.floor(mid.y)===y)out.push(previous[0],previous[1],p[0],p[1],['motorway','trunk','primary','rail'].includes(kind)?1:.5);}
          previous=p;
          if(out.length/5>=maxSegments)break;
        }
      }
      if(out.length/5>=maxSegments)break;
    }
  }
  return {coordinates:new Float32Array(out),segments:out.length/5,z,x,y};
}
