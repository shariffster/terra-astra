/** Coarse-grid exceptions for authored passage illustrations, never navigation. */
export function schematicPassage(lon:number,lat:number) {
 return (lon>=102.9&&lon<=104.7&&lat>=.65&&lat<=1.8)||
        (lon>=.3&&lon<=2.5&&lat>=50.35&&lat<=51.85);
}
/** Surface-only sketches including the Gulf of Suez approach. The coarse
 * ocean-connected mask closes that narrow gulf as well as both canals.
 * Restrict the exception to a small corridor, not the whole region. */
const canalControls = [
 [[31.5,32.35],[31.25,32.31],[30.70,32.34],[30.30,32.45],[29.90,32.56],[29.50,32.70],[28.125,33.375]],
 [[8.7,-79.5],[8.95,-79.56],[9.05,-79.65],[9.12,-79.72],[9.22,-79.90],[9.38,-79.93],[9.6,-79.95]],
];
export function schematicCanal(lon:number,lat:number) {
 return canalControls.some(points=>points.slice(1).some((b,i)=>{
  const a=points[i],x=b[1]-a[1],y=b[0]-a[0];
  const t=Math.max(0,Math.min(1,((lon-a[1])*x+(lat-a[0])*y)/(x*x+y*y)));
  return Math.hypot(lon-a[1]-t*x,lat-a[0]-t*y)<.12;
 }));
}
