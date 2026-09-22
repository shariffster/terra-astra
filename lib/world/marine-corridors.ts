import { pacificFeederSpines } from './pacific-feeder-spines';
import { pacificSpines } from './pacific-corridors';
import { eastAsiaSpines } from './east-asia-corridors';
import { europeSpines } from './europe-corridors';
type Location = readonly [number, number];

/** Display spines in the existing ETOPO water mask, not surveyed alignments.
 * Shared gates retain the original connections and offshore endpoints. Long
 * crossings stay offshore; coastal passages curve around the relevant land. */
const spines: readonly (readonly Location[])[] = [
 // A broader offshore shoulder around the Horn replaces the old right-angle
 // gate. The existing Aden and East African anchors remain exact.
 [[12.375,45.125],[12.1,46.5],[12.2,48.8],[12.2,50.4],[12,51.8],[11.6,52.4],[10.8,52.5],[9.5,52],[7,51],[3,48.5],[-1,46],[-5.125,43.125]],
 // Coastal feeders reuse the same eastern Hormuz approach.
 [[26.375,56.625],[25.9,56.95],[25.35,57.55],[25,58.1],[24,59.1],[22.875,60.125]],
 [[26.375,56.375],[26.4,56.35],[26.375,56.625],[25.9,56.95],[25.35,57.55],[25,58.1],[24,59.1],[22.875,60.125]],
 [[21.625,39.125],[20.5,39.1],[18,40.2],[15,41.4],[13.5,42.5],[12.625,43.375],[12.15,44.1],[12.375,45.125]],
 // Hormuz and Bab al-Mandab: authored display approaches, water checked below.
 [[22.875,60.125],[24,59.1],[25,58.1],[25.35,57.55],[25.9,56.95],[26.375,56.625],[26.4,56.35],[26.5,56.1],[26.2,55.5],[25.9,54.5],[25.375,53.125]],
 [[12.375,45.125],[12.15,44.1],[12.625,43.375],[13.5,42.5],[15,41.4],[17,40],[20,38.8],[22,37.6],[24.875,35.125]],
 [[4.375,99.125],[5.55,97.3],[6.1,95.4],[6,92],[5.5,88],[4.8,84],[4.375,80.125]],
 [[4.375,80.125],[5,78],[6.5,74.5],[8.5,70],[10.5,66],[11.875,63.125]],
 [[4.375,80.125],[5.3,77.5],[7.5,75.5],[11,73.8],[15,72.3],[17.875,71.125]],
 [[48.875,-3.875],[49,-6],[47.8,-8.3],[45.8,-10.5],[43,-11],[40,-10.7],[38,-10.25],[36.5,-9.2],[35.875,-6.375]],
 [[38.875,-70.875],[42,-56],[47,-34],[49.2,-18],[49.2,-10],[48.875,-3.875]],
 [[38.875,-70.875],[42,-56],[47,-34],[50,-19],[50.875,-12.875]],
 [[38.875,-70.875],[40,-58],[42,-42],[41,-25],[39,-15],[37.875,-10.875]],
 ...pacificSpines,
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
 [[-36.125,19.125],[-36.8,24],[-38.2,33],[-41,46],[-43.5,62],[-43,79],[-40,95],[-36,106],[-32.125,113.125]],
 [[-36.125,19.125],[-36.3,24],[-34.5,29],[-30,33],[-23,36],[-16,42],[-10,43],[-5.125,43.125]],
 [[-5.125,43.125],[-3.3,45.5],[-1.8,50],[0,59],[1.2,68],[2.3,74],[3.4,78],[4.375,80.125]],
 [[-32.125,113.125],[-28,110],[-21,108],[-12,105],[-4,100],[1,93],[3.2,86],[4.375,80.125]],
 // Distinct feeders share a longer approach to the main Indian Ocean stems.
 [[-5.125,43.125],[-2,45.5],[2,49],[6,54],[9.5,59],[11.875,63.125]],
 [[11.875,63.125],[12.4,59],[12.5,55],[12.3,51],[12.375,45.125]],
 [[11.875,63.125],[13.5,63.5],[16.5,63],[20,61.5],[22.875,60.125]],
 [[11.875,63.125],[13,66],[14.8,68.8],[17.875,71.125]],
 [[17.875,71.125],[18.3,68],[19.6,64],[21.3,61.5],[22.875,60.125]],
 [[4.375,99.125],[5.55,97.3],[6.5,95.4],[7.1,92.5],[7.2,89],[6.875,86.125]],
 [[4.375,80.125],[4.7,81.4],[6.4,82.6],[9,82.8],[11.875,82.125]],
 [[4.375,80.125],[4.9,81.8],[5.8,84],[6.875,86.125]],
 [[6.875,86.125],[8.8,84.8],[10.5,83.1],[11.875,82.125]],
 [[-8.125,104.125],[-11,105.3],[-16,107.6],[-21,110],[-26,111.8],[-29.5,112.6],[-32.125,113.125]],
 // Java Sea: a real Sunda approach replaces the old detour east to Lombok
 // and back west. The eastern branch follows its own shared Lombok approach.
 // Every proposed leg is checked against the existing mask by the caller.
 [[1.12,103.7],[1.375,104.375],[1.375,105.625],[.2,106.25],[-.3,106.5],[-2,106.8],[-4,107],[-5.6,106.1],[-5.9,105.8],[-6.3,105.3],[-6.8,104.8],[-8.125,104.125]],
 [[1.12,103.7],[1.375,104.375],[1.375,105.625],[.2,106.25],[-.3,106.5],[-.9,107],[-1.8,108.3],[-2.8,109.3],[-4,110],[-5.5,112],[-6,114],[-7,115.5],[-8.125,115.875],[-8.625,115.875],[-9.4,115.75],[-10.125,115.125]],
 [[1.375,104.375],[1.375,105.625],[.2,106.25],[-.3,106.5],[-.9,107],[-1.8,108.3],[-2.8,109.3],[-4,110],[-5.5,112],[-6,114],[-7,115.5],[-8.125,115.875],[-8.625,115.875],[-9.4,115.75],[-10.125,115.125]],
 [[-5.875,106.875],[-5.2,107],[-4,107],[-2,106.8],[-.3,106.5],[.2,106.25],[1.375,105.625],[1.375,104.375],[1.12,103.7],[1.2,103.5],[1.5,103.1],[2.2,102.1],[3.1,100.9],[4.375,99.125]],
 [[-6.625,112.625],[-5.5,112],[-4,110],[-2.8,109.3],[-1.8,108.3],[-.9,107],[-.3,106.5],[.2,106.25],[1.375,105.625],[1.375,104.375],[1.375,103.125]],
 [[-5.875,106.875],[-5.5,108.5],[-5.5,112],[-6,114],[-7,115.5],[-8.125,115.875],[-8.625,115.875],[-9.4,115.75],[-10.125,115.125]],
 [[-6.625,112.625],[-6,114],[-7,115.5],[-8.125,115.875],[-8.625,115.875],[-9.4,115.75],[-10.125,115.125]],
 // Western Australia and the southern coast: long approach shoulders replace
 // the conspicuous Perth elbow without moving either offshore endpoint.
 [[-10.125,115.125],[-13,113],[-17,111],[-21,110],[-26,111.8],[-29.5,112.6],[-32.125,113.125]],
 [[-10.125,115.125],[-13,113],[-17,111],[-21,110],[-26,111.8],[-31,113],[-34.5,114.5],[-37,118],[-38,126],[-39,136],[-39,144],[-39.375,148.375],[-37,151],[-34.125,153.125]],
 ...europeSpines,
 ...eastAsiaSpines,
 ...pacificFeederSpines,
];
const equal=(a:Location,b:Location)=>a[0]===b[0]&&a[1]===b[1];

export function marineCorridorWaypoints(original:readonly Location[]):readonly Location[] {
 let result=[...original],changed=false;
 for(const spine of spines){
  const first=result.findIndex(p=>equal(p,spine[0])),last=result.findIndex(p=>equal(p,spine[spine.length-1]));
  if(first<0||last<0||first===last)continue;
  const start=Math.min(first,last),end=Math.max(first,last);
  const crossing=crossingBranch(spine,original);
  result.splice(start,end-start+1,...(first<last?crossing:[...crossing].reverse()));
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

/** Existing parallel crossings keep distinct broad ocean bows. The shared
 * coastal stems are exact; their branches separate at different distances,
 * rather than duplicating one curve with a constant sideways offset. Original
 * intermediate latitudes choose the bow, so reversing a route is identical. */
function crossingBranch(spine:readonly Location[],original:readonly Location[]):readonly Location[] {
 // Preserve the different western Mediterranean crossings as broad bows,
 // with identical Gibraltar and Sicily approaches. Source latitude supplies
 // stable variation; no random wiggle or fictitious endpoint is introduced.
 if(equal(spine[0],[35.875,-6.375])&&equal(spine[spine.length-1],[35.375,14.125])){
  const mids=original.filter(p=>p[1]>2&&p[1]<8),latitude=mids.length?mids.reduce((n,p)=>n+p[0],0)/mids.length:37.375;
  const band=Math.max(-1,Math.min(1,(latitude-37.375)/.5));
  return spine.map((p,i)=>i<7||i>11?p:[p[0]+.38*band*Math.sin(Math.PI*(i-6)/6)**2,p[1]] as Location);
 }
 if(!equal(spine[0],[33.875,142.125]))return spine;
 const end=spine[spine.length-1],hawaii=equal(end,[21.875,-156.875]);
 if(!hawaii&&!equal(end,[36.875,-124.875]))return spine;
 const mids=original.filter(p=>!equal(p,end)&&Math.abs(p[1])>154&&Math.abs(p[1])<179&&p[0]>20);
 if(!mids.length)return spine;
 const latitude=mids.reduce((sum,p)=>sum+p[0],0)/mids.length;
 const band=Math.max(-1,Math.min(1,(latitude-(hawaii?30:43))/2));
 return spine.map((p,i)=>{
  // Different departure/return shoulders preserve branch identity offshore.
  if(i<2||i>=spine.length-3)return p;
  const t=(i-1)/(spine.length-4),weight=Math.sin(Math.PI*t)**2;
  return [p[0]+band*(hawaii?3.5:3)*weight,p[1]] as Location;
 });
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
