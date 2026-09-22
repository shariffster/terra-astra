import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {planetFraming,compositionFraming}=await import('../lib/terra/composition-framing.ts');
const {cableFilamentGeometry,movingPathGeometry}=await import('../lib/terra/cable-filaments.ts');
const focal=h=>h/(2*Math.tan(21*Math.PI/180));
// Independent projected silhouette checks at the two opening breakpoints and
// wide desktop. These fail if the text reservation clips Earth at the far edge.
for(const [w,h,copyRight] of [[701,900,350],[880,800,353],[1095,998,390],[1440,900,500],[1920,1080,590]]){
 const d=3.6,frame=planetFraming(w,h,d,{left:40,right:copyRight,top:180,bottom:400});
 const radius=focal(h)*1.035/Math.sqrt(d*d-1.035**2)*frame.zoom,cx=w/2-frame.x;
 assert.ok(cx-radius>=copyRight+27.99,`opening clearance ${w}`);
 assert.ok(cx+radius<=w-89.99,`rail clearance ${w}`);
 assert.deepEqual(planetFraming(w,h,d,null),{x:0,y:0,zoom:1},'Exploration reclaims the full view and zoom');
}
for(const [w,h] of [[375,667],[390,844],[699,844],[700,800]]){
 const r=Math.min(w*(w<700?.37:.38),h*.38),d=Math.max(3.15,Math.sqrt(1+(focal(h)/r)**2));
 const frame=planetFraming(w,h,d,null),edge=w/2-frame.x+focal(h)/Math.sqrt(d*d-1);
 assert.ok(w-57-edge>=16,`phone globe to rail gutter ${w}`);
 assert.equal(frame.zoom,1,'Phone exploration remains zoomable');
 const panel=compositionFraming(w,h,{left:12,right:w-12,top:474,bottom:h-14},d);
 assert.ok(panel.zoom<=1&&Number.isFinite(panel.x),'Composition panel fit remains independent');
 const panelEdge=w/2-panel.x+focal(h)*1.09/Math.sqrt(d*d-1.09**2)*panel.zoom;
 assert.ok(w-57-panelEdge>=16,'Open controls also keep the phone gutter');
}
// Projected spacing uses the actual accepted (possibly narrowed) fan rather
// than a nominal spread value. An outer fan's mean gap matches the inner one.
const base=new Float32Array([0,0,1, .1,0,1, .2,0,1]);
const inner=new Float32Array([0,0,1,.1,.004,1,.2,0,1]);
const outer=new Float32Array([0,0,1,.1,.008,1,.2,0,1]);
const progress=new Float32Array([0,.5,1]),sources=[{intensity:.8}];
const paths=[{positions:base,progress,sourceIndex:0,strand:0},{positions:inner,progress,sourceIndex:0,strand:1},{positions:outer,progress,sourceIndex:0,strand:3}];
const snapshot=paths.map(p=>p.positions.slice());
const g=cableFilamentGeometry(paths,sources,new Float32Array([0])),gap=g.getAttribute('routeRelief');
assert.equal(gap.count,18);assert.equal(gap.itemSize,2);assert.ok(Object.keys(g.attributes).length<=12,'No additional GPU attribute slot');assert.ok(gap.array.every(Number.isFinite));
assert.equal(gap.getY(2),0);assert.ok(Math.abs(gap.getY(8)-.004)<1e-7);assert.equal(gap.getY(8),gap.getY(14));
for(let i=0;i<paths.length;i++)assert.deepEqual(paths[i].positions,snapshot[i],'No curve mutations');
for(const i of [0,4,6,10,12,16])assert.equal(gap.getY(i),0,'Coincident endpoints stay gathered');
g.dispose();const moving=movingPathGeometry(2,12);assert.ok(moving.getAttribute('routeRelief').array.every(x=>x===0));moving.dispose();
console.log(JSON.stringify({result:'PASS',framing:'five desktop and four phone cases; opening and exploration',marineSpacing:'measured fan distance; no geometry mutation; moving paths neutral'}));
