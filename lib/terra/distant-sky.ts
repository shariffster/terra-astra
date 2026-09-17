import { Vector3 } from 'three';

/** An imagined setting, not a star catalogue. Fixed seeds keep saved views comparable. */
export function distantSky() {
 let seed = 901;
 const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
 const point = (lon: number, lat: number, radius: number) => new Vector3(
  radius * Math.cos(lat) * Math.sin(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon),
 );
 const stars = ([[4200,48,'#d5dce5',.85,.88],[150,42,'#dfd1b8',1.05,1.15],[70,36,'#d7e4f1',1.28,1.48]] as const).map(([count,radius,tint,brightness,size]) => {
  const data: number[] = [];
  for(let i=0;i<count;i++) {
   const p = point(random()*Math.PI*2,Math.asin(random()*2-1),radius);
   data.push(...p.toArray(),brightness*(.65+random()*.35),size*(.78+random()*.22),random()*6.28);
  }
  return {data:new Float32Array(data),tint,radius};
 });
 // Loose, irregular patches rather than a continuous band or a coloured wallpaper.
 const dust: number[][] = [[],[]];
 const patches = [[-62,-7],[112,-18],[163,48],[-145,-25],[-82,28],[-25,-42],[8,62],[98,-62]];
 patches.forEach(([lon,lat],patch) => {
  const centre = point(lon*Math.PI/180,lat*Math.PI/180,1);
  const east = new Vector3(Math.cos(lon*Math.PI/180),0,-Math.sin(lon*Math.PI/180));
  const north = new Vector3().crossVectors(centre,east);
  for(let i=0;i<1200;i++) {
   const angle=random()*Math.PI*2,spread=Math.sqrt(-2*Math.log(Math.max(.001,random())));
   const x=Math.cos(angle)*spread*.32,y=Math.sin(angle)*spread*.034;
   const p=centre.clone().addScaledVector(east,x).addScaledVector(north,y+.065*Math.sin(x*8)+.018*Math.sin(x*19)).normalize().multiplyScalar(46);
   dust[patch%2].push(...p.toArray(),.13*(.25+random()*.75),.65+random()*1.25,random()*6.28);
  }
 });
 return {stars,dust:dust.map((data,i)=>({data:new Float32Array(data),tint:i?'#8983b9':'#748fae'}))};
}

// Separate from Earth's terrain, shimmer and point-size response. A readable core
// survives normal screen scaling; the sphere occlusion keeps it behind Earth.
export const skyVertex = `attribute float brightness;attribute float starSize;
uniform float pixelRatio;uniform float skyRadius;varying float vB;
void main(){
 vec3 world=(modelMatrix*vec4(position,1.0)).xyz;
 vec3 ray=normalize(world-cameraPosition);float b=dot(cameraPosition,ray);
 float d=b*b-dot(cameraPosition,cameraPosition)+skyRadius*skyRadius;
 float hit=-b-sqrt(max(0.0,d));
 vB=brightness*(d>0.0&&hit>0.0&&hit<distance(world,cameraPosition)?0.0:1.0);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
 gl_PointSize=starSize*4.1*pixelRatio;
}`;
export const skyFragment = `uniform vec3 tint;uniform float opacity;varying float vB;
void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
 float core=exp(-r*r*18.0),edge=1.0-smoothstep(.38,.5,r);
 gl_FragColor=vec4(tint,core*edge*vB*opacity);
}`;
export const dustFragment = `uniform vec3 tint;uniform float opacity;varying float vB;
void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
 gl_FragColor=vec4(tint,exp(-r*r*24.0)*(1.0-smoothstep(.3,.5,r))*vB*opacity);
}`;
