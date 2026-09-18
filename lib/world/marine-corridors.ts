type Location = readonly [number, number];

/** Display spines in the existing ETOPO water mask, not surveyed alignments.
 * Shared gates retain the original connections and offshore endpoints. Long
 * crossings stay offshore; coastal passages curve around the relevant land. */
const spines: readonly (readonly Location[])[] = [
 [[4.375,99.125],[5.55,97.3],[6.1,95.4],[6,92],[5.5,88],[4.8,84],[4.375,80.125]],
 [[4.375,80.125],[5,78],[6.5,74.5],[8.5,70],[10.5,66],[11.875,63.125]],
 [[4.375,80.125],[5.3,77.5],[7.5,75.5],[11,73.8],[15,72.3],[17.875,71.125]],
 [[48.875,-3.875],[49,-6],[47.8,-8.3],[45.8,-10.5],[43,-11],[40,-10.7],[38,-10.25],[36.5,-9.2],[35.875,-6.375]],
 [[38.875,-70.875],[42,-56],[47,-34],[49.2,-18],[49.2,-10],[48.875,-3.875]],
 [[38.875,-70.875],[42,-56],[47,-34],[50,-19],[50.875,-12.875]],
 [[38.875,-70.875],[40,-58],[42,-42],[41,-25],[39,-15],[37.875,-10.875]],
 // Pacific branches share offshore approaches before separating across water.
 [[33.875,142.125],[36,150],[40,164],[43,179],[43,-165],[40,-141],[38,-132],[36.875,-124.875]],
 [[33.875,142.125],[36,150],[36,160],[33,175],[29,-172],[25,-163],[21.875,-156.875]],
 [[11.875,145.125],[16,151],[22,163],[27,179],[29,-172],[25,-163],[21.875,-156.875]],
 [[11.875,145.125],[16,151],[22,163],[27,179],[29,-172],[31,-153],[35,-139],[38,-132],[36.875,-124.875]],
 [[21.875,-156.875],[25,-149],[30,-140],[33,-132],[33,-126],[31.875,-119.875]],
 [[21.875,-156.875],[25,-149],[30,-140],[35,-133],[36.875,-124.875]],
 [[-35.125,176.125],[-28,179],[-15,-179],[-5,-171],[8,-164],[17,-159],[21.875,-156.875]],
 [[-19.125,178.125],[-15,-179],[-5,-171],[8,-164],[17,-159],[21.875,-156.875]],
 [[-34.125,153.125],[-32,159],[-28,166],[-23,173],[-19.125,178.125]],
 [[-35.125,176.125],[-29,179],[-24,179],[-19.125,178.125]],
 // Atlantic coast approaches, equatorial crossings and the Cape fan.
 [[2.875,3.125],[-3,4],[-11,7],[-20,10],[-28,13],[-33,15],[-36.125,19.125]],
 [[-36.125,19.125],[-33,10],[-28,-2],[-22,-15],[-14,-25],[-8.125,-31.875]],
 [[-23.125,-41.875],[-27,-33],[-30,-22],[-32,-8],[-33,6],[-36.125,19.125]],
 [[13.875,-18.875],[9,-22],[4,-26],[-2,-29],[-8.125,-31.875]],
 [[-8.125,-31.875],[-5,-25],[-2,-15],[0,-5],[2.875,3.125]],
 [[-8.125,-31.875],[-13,-34],[-18,-38],[-23.125,-41.875]],
 [[25.875,-77.875],[27,-76],[31,-74],[35,-72],[38.875,-70.875]],
 [[34.875,-72.875],[40,-59],[44,-42],[47,-25],[49.2,-10],[48.875,-3.875]],
 [[34.875,-72.875],[40,-59],[44,-42],[48,-23],[50.875,-12.875]],
 [[34.875,-72.875],[39,-59],[41,-42],[40,-24],[37.875,-10.875]],
 // Southern Indian Ocean and the offshore East African approach.
 [[-36.125,19.125],[-37,30],[-37,47],[-36,66],[-35,85],[-34,101],[-32.125,113.125]],
 [[-36.125,19.125],[-36,25],[-33,30],[-27,35],[-20,38],[-12.125,43.125],[-5.125,43.125]],
 [[-5.125,43.125],[-4,49],[-1,60],[2,72],[4.375,80.125]],
 [[-32.125,113.125],[-27,108],[-19,101],[-9,94],[0,86],[4.375,80.125]],

];
const equal=(a:Location,b:Location)=>a[0]===b[0]&&a[1]===b[1];

export function marineCorridorWaypoints(original:readonly Location[]):readonly Location[] {
 let result=[...original],changed=false;
 for(const spine of spines){
  const first=result.findIndex(p=>equal(p,spine[0])),last=result.findIndex(p=>equal(p,spine[spine.length-1]));
  if(first<0||last<0||first===last)continue;
  const start=Math.min(first,last),end=Math.max(first,last);
  result.splice(start,end-start+1,...(first<last?spine:[...spine].reverse()));
  changed=true;
 }
 if(changed)return result;
 const gathered:Location[]=[original[0]];
 for(let i=1;i<original.length;i++){
  const a=original[i-1],b=original[i],span=distance(a,b);
  const basin=basinSpine(a,b);
  if(!basin||span<.45){gathered.push(b);continue;}
  const reverse=basin.reverse,centre=basin.points;
  for(const t of [.16,.32,.5,.68,.84]){
   const p=spherical(a,b,t),q=along(centre,reverse?1-t:t);
   // Bounded gathering leaves each endpoint and coastal approach in place.
   // The central crossing follows a shared curve, then eases apart into feeders.
   const delta=distance(p,q),blend=.88*Math.sin(Math.PI*t)**2*Math.min(1,.12/Math.max(.00001,delta));
   gathered.push(spherical(p,q,blend));
  }
  gathered.push(b);changed=true;
 }
 return changed?gathered:original;
}


const R=Math.PI/180;
const unit=([lat,lon]:Location)=>[Math.cos(lat*R)*Math.sin(lon*R),Math.sin(lat*R),Math.cos(lat*R)*Math.cos(lon*R)];
const distance=(a:Location,b:Location)=>{const x=unit(a),y=unit(b);return Math.acos(Math.max(-1,Math.min(1,x.reduce((n,v,i)=>n+v*y[i],0))));};
function spherical(a:Location,b:Location,t:number):Location {
 const x=unit(a),y=unit(b),theta=distance(a,b),s=Math.sin(theta);
 if(theta<1e-8)return a;
 const p=x.map((v,i)=>(v*Math.sin((1-t)*theta)+y[i]*Math.sin(t*theta))/s);
 return [Math.atan2(p[1],Math.hypot(p[0],p[2]))/R,Math.atan2(p[0],p[2])/R];
}
function along(points:readonly Location[],t:number):Location {
 const lengths=points.slice(1).map((p,i)=>distance(points[i],p)),total=lengths.reduce((a,b)=>a+b,0);let d=t*total;
 for(let i=0;i<lengths.length;i++){if(d<=lengths[i])return spherical(points[i],points[i+1],d/lengths[i]);d-=lengths[i];}
 return points[points.length-1];
}
function basinSpine(a:Location,b:Location):{points:readonly Location[];reverse:boolean}|undefined {
 const northPacific:readonly Location[]=[[36,143],[41,165],[43,-170],[40,-145],[36,-127]];
 const northAtlantic:readonly Location[]=[[35,-72],[40,-56],[43,-38],[44,-23],[43,-12]];
 const southAtlantic:readonly Location[]=[[-13,-35],[-8,-28],[-4,-20],[-1,-10],[0,1]];
 const pacific=(p:Location,q:Location)=>p[1]>125&&q[1]<-110&&p[0]>23&&q[0]>23;
 const atlantic=(p:Location,q:Location)=>p[1]<-55&&p[1]>-85&&q[1]>-25&&q[1]<0&&p[0]>20&&q[0]>25;
 const south=(p:Location,q:Location)=>p[1]<-25&&p[1]>-50&&q[1]>-22&&q[1]<15&&p[0]<12&&p[0]>-35&&q[0]<16&&q[0]>-20;
 for(const [matches,points] of [[pacific,northPacific],[atlantic,northAtlantic],[south,southAtlantic]] as const){
  if(matches(a,b))return {points,reverse:false};if(matches(b,a))return {points,reverse:true};
 }
}
