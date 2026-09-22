import type { PanelBounds } from './composition-framing';

/** Composed observing space, not an ephemeris. Earth spin is removed by the
 * engine before these inspection angles arrive. The Moon's twelve-minute
 * orbit is independent of Earth's rotation and uses the shared sky clock. */
export type CelestialView={longitude:number;latitude:number;tilt:number;zoom:number};
const radians=Math.PI/180;
export function celestialParallax(width:number,height:number,view:CelestialView) {
 const scale=Math.min(1,Math.min(width,height)/800);
 const yaw=(view.longitude-95)*radians,pitch=(view.latitude-19)*radians;
 const tilt=Math.sin(view.tilt*radians)*scale;
 const approach=Math.max(-1,Math.min(1,Math.log(Math.max(.25,view.zoom))))*scale;
 const x=-Math.sin(yaw)*scale,y=Math.sin(pitch)*scale;
 return {nebula:{x:x*3,y:y*2+tilt*2},sun:{x:x*17-approach*3,y:y*11+tilt*4},moon:{x:x*43+approach*9,y:y*29+tilt*13-approach*3}};
}

export function lunarOrbit(width:number,height:number,earth:{x:number;y:number;r:number},panel:PanelBounds|null,time:number) {
 const phone=width<=700;
 const left=panel&&!phone?Math.min(width*.65,panel.right+18):0;
 const bottom=panel&&phone?Math.max(120,panel.top-12):height;
 // A tilted orbit passes behind Earth on its upper half and in front on the
 // lower half. Its envelope stays inside the available observing window.
 const cx=Math.max(left+40,Math.min(width-40,earth.x));
 const cy=Math.max(60,Math.min(bottom-60,earth.y));
 // Keep the right control rail out of the lunar sweep at typical body sizes.
 const rx=Math.max(32,Math.min(earth.r*1.4,cx-left-32,width-(phone?70:80)-cx-32));
 const ry=Math.max(30,Math.min(Math.max(earth.r*1.25,(bottom)*.34),cy-54,bottom-cy-62));
 const angle=(phone?-1.00:-.70)+time*Math.PI*2/720;
 return {x:cx+rx*Math.cos(angle),y:cy+ry*Math.sin(angle),depth:Math.sin(angle),phase:Math.max(-.72,Math.min(.72,-.32+Math.sin(time*Math.PI*2/720)*.55))};
}
