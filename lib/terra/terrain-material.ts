/** Artistic view response over the existing ETOPO radii, never literal vertical scale.
 * This module owns both GPU coefficients and the reduced-detail Canvas equivalent.
 */
export const TERRAIN = Object.freeze({
  landPlanet: .70, landRegion: 1.05, landHorizon: 1.28, landCutaway: 1.10,
  floorPlanet: .90, floorRegion: 1.25, floorHorizon: 1.65, floorCutaway: 1.90,
  grazingLand: .18, grazingFloor: .12,
  surfaceShare: .14, surfaceRadius: 1.00035, drift: .0011, breath: .00009,
});
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (a: number, b: number, n: number) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
export function terrainTuning(altitude: number, tilt: number, cut: number) {
  const near = 1 - smooth(.65, 1.8, altitude), horizon = smooth(20, 68, tilt) * near;
  return {
    study: Math.max(near, cut),
    land: (TERRAIN.landPlanet + (TERRAIN.landRegion - TERRAIN.landPlanet) * near + (TERRAIN.landHorizon - TERRAIN.landRegion) * horizon) * (1 - cut) + TERRAIN.landCutaway * cut,
    floor: (TERRAIN.floorPlanet + (TERRAIN.floorRegion - TERRAIN.floorPlanet) * near + (TERRAIN.floorHorizon - TERRAIN.floorRegion) * horizon) * (1 - cut) + TERRAIN.floorCutaway * cut,
  };
}
export function terrainGrazing(x: number, y: number, z: number, cx: number, cy: number, cz: number) {
  const r = Math.hypot(x, y, z), d = Math.hypot(cx - x, cy - y, cz - z);
  return 1 - smooth(.12, .72, Math.abs((x * (cx - x) + y * (cy - y) + z * (cz - z)) / Math.max(.00001, r * d)));
}
export function terrainScale(radius: number, land: number, floor: number, study: number, grazing: number) {
  return radius >= 1 ? land * (1 + TERRAIN.grazingLand * study * grazing) : floor * (1 + TERRAIN.grazingFloor * study * grazing);
}
export function marineSample(phase: number, radius: number) {
  // Keep the deepest prepared samples on the floor; do not puncture the trenches.
  return radius > .947 && (phase * 7.13 % 1) < TERRAIN.surfaceShare;
}

export const terrainVertexGLSL = `
attribute vec4 terrainData;
uniform float seaMotion;uniform float depthMix;
uniform float terrainKind;uniform float terrainLand;uniform float terrainFloor;uniform float terrainStudy;uniform float terrainReady;
varying float vMarine;
float terrainGraze(vec3 p){return 1.0-smoothstep(.12,.72,abs(dot(normalize(p),normalize(cameraPosition-p))));}
float isMarine(vec3 p){return terrainKind>1.5&&terrainKind<2.5&&length(p)>.947&&fract(phase*7.13)<${TERRAIN.surfaceShare} ? 1.0:0.0;}
vec3 terrainPosition(vec3 original){
  vMarine=0.0;
  if(terrainKind<.5)return original;
  float r=length(original);vec3 n=original/r;float graze=terrainGraze(original);
  float gain=r>=1.0?terrainLand*(1.0+${TERRAIN.grazingLand}*terrainStudy*graze):terrainFloor*(1.0+${TERRAIN.grazingFloor}*terrainStudy*graze);
  float radius=1.00002+(r-1.00002)*mix(1.0,gain,terrainReady);
  vMarine=isMarine(original)*terrainReady;
  if(vMarine>0.0){
    float shelf=exp(min(0.0,terrainData.w)*11.0);
    float flow=seaMotion*motion*terrainReady*depthMix;
    vec3 east=normalize(vec3(n.z,0.0,-n.x));vec3 north=cross(n,east);
    float basin=n.y*9.0+n.x*3.0+n.z*2.0;
    // A slow, coherent tangent drift. Shallow particles barely move across land masks.
    vec3 drift=(east*sin(time*.045+basin)*${TERRAIN.drift}+north*cos(time*.032+basin)*.0003)*(1.0-shelf*.97);
    n=normalize(n+drift*flow);
    radius=mix(radius,${TERRAIN.surfaceRadius}+flow*${TERRAIN.breath}*sin(time*.11+basin),terrainReady);
  }
  return n*radius;
}
vec2 terrainLight(vec3 original){
  if(terrainKind<.5||depthMix<.001)return vec2(1.0);
  vec3 n=normalize(original);float graze=terrainGraze(original);
  vec3 slope=length(terrainData.xyz)>.1?normalize(terrainData.xyz):n;
  float rough=clamp(length(slope-n)*2.0,0.0,1.0);
  float facing=dot(slope,normalize(cameraPosition-original));
  float catchLight=smoothstep(.05,.7,facing)*rough*graze;
  float light=1.0;float size=1.0;
  if(terrainKind<1.5){
    float high=smoothstep(.003,.04,length(original)-1.0);
    light=.76+high*.35+rough*.42+catchLight*.62;
    size=1.0+terrainStudy*(high*.07+rough*.06);
  }else if(terrainKind<2.5){
    float deep=clamp(-terrainData.w,0.0,1.0),shelf=exp(-deep*11.0);
    float band=pow(max(0.0,cos(terrainData.w*11000.0/850.0*3.14159)),16.0);
    light=(.78+rough*.85+shelf*.28+band*.24)*(1.0-deep*.36)+catchLight*.32;
    size=1.0+terrainStudy*(rough*.09+shelf*.04);
    if(isMarine(original)>.5){
      float field=.5+.5*sin(n.y*13.0+n.x*4.0+sin(n.z*5.0));
      float breathing=1.0+seaMotion*motion*.10*sin(time*.11+n.y*9.0+n.x*3.0);
      light=seaMotion*(.24+field*.30+shelf*.26)*breathing*(1.0-terrainStudy*.24);
      size=.78+field*.16;
    }
  }else if(terrainKind<3.5){light=.88+graze*.15;size=.92;}else{return vec2(1.0);}
  return mix(vec2(1.0),vec2(light,size),depthMix*terrainReady);
}`;

/** Allocation-free fallback; original ETOPO buffers are never mutated. */
export function terrainSample(x: number, y: number, z: number, phase: number, nx: number, ny: number, nz: number, metres: number,
  kind: number, land: number, floor: number, study: number, ready: number, depth: number, sea: number, motion: number, time: number,
  cx: number, cy: number, cz: number, out: { x: number; y: number; z: number; light: number; size: number }) {
  const r = Math.hypot(x, y, z), graze = terrainGrazing(x, y, z, cx, cy, cz);
  let dx = x / r, dy = y / r, dz = z / r;
  let radius = 1.00002 + (r - 1.00002) * (1 + (terrainScale(r, land, floor, study, graze) - 1) * ready);
  const normalLength = Math.hypot(nx, ny, nz);
  const sx = normalLength > .1 ? nx / normalLength : dx, sy = normalLength > .1 ? ny / normalLength : dy, sz = normalLength > .1 ? nz / normalLength : dz;
  const rough = clamp(Math.hypot(sx - dx, sy - dy, sz - dz) * 2);
  const distance = Math.hypot(cx - x, cy - y, cz - z);
  const caught = smooth(.05, .7, (sx * (cx - x) + sy * (cy - y) + sz * (cz - z)) / distance) * rough * graze;
  let light = 1, size = 1;
  if (kind === 1) {
    const high = smooth(.003, .04, r - 1);
    light = .76 + high * .35 + rough * .42 + caught * .62;
    size = 1 + study * (high * .07 + rough * .06);
  } else if (kind === 2) {
    const deep = clamp(-metres / 11000), shelf = Math.exp(-deep * 11);
    const band = Math.pow(Math.max(0, Math.cos(metres / 850 * Math.PI)), 16);
    light = (.78 + rough * .85 + shelf * .28 + band * .24) * (1 - deep * .36) + caught * .32;
    size = 1 + study * (rough * .09 + shelf * .04);
    if (marineSample(phase, r)) {
      const field = .5 + .5 * Math.sin(dy * 13 + dx * 4 + Math.sin(dz * 5));
      const basin = dy * 9 + dx * 3 + dz * 2;
      light = sea * (.24 + field * .30 + shelf * .26) * (1 + sea * motion * .10 * Math.sin(time * .11 + basin)) * (1 - study * .24);
      size = .78 + field * .16;
      const flow = sea * motion * ready * depth, horizontal = Math.max(.00001, Math.hypot(dx, dz));
      const ex = dz / horizontal, ez = -dx / horizontal;
      const a = Math.sin(time * .045 + basin) * TERRAIN.drift * (1 - shelf * .97) * flow;
      const b = Math.cos(time * .032 + basin) * .0003 * (1 - shelf * .97) * flow;
      dx += ex * a + dy * ez * b; dz += ez * a - dy * ex * b; dy += horizontal * b;
      const len = Math.hypot(dx, dy, dz); dx /= len; dy /= len; dz /= len;
      radius += (TERRAIN.surfaceRadius + flow * TERRAIN.breath * Math.sin(time * .11 + basin) - radius) * ready;
    }
  } else if (kind === 3) { light = .88 + graze * .15; size = .92; }
  const mixed = 1.00002 + (radius - 1.00002) * depth;
  out.x = dx * mixed; out.y = dy * mixed; out.z = dz * mixed;
  out.light = 1 + (light - 1) * depth * ready; out.size = 1 + (size - 1) * depth * ready;
}
