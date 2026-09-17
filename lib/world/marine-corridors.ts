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
 return changed?result:original;
}
