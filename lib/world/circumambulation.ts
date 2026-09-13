/** Interpretive collective flow, never people, observations or measured density. */
const METRES_PER_DEGREE = 111195;
const R = Math.PI/180;
function scatter(index: number) {
  let value = Math.imul(index ^ (index >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0)/4294967296;
}
const smooth = (value: number) => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t); };
/** Continuous, counter-clockwise paths with a distributed density and cadence.
 * Sparse outer trajectories gather and disperse over minutes; none is a tracked
 * person, a crowd estimate or a prescribed route through the actual mosque. */
export function sampleCircumambulation(time: number, center: readonly number[], output: Float32Array) {
  const count = output.length/3;
  for (let i=0; i<count; i++) {
    const spread = scatter(i+1471), seed = scatter(i+809)*Math.PI*2;
    // A continuous radius distribution prevents visible mechanical lanes.
    // Angular perturbations have a smaller derivative than the forward speed,
    // preserving counter-clockwise motion while varying its local cadence.
    const speed = .0135 + scatter(i+173)*.007 - spread*.002;
    const angle = seed + .18*Math.sin(seed*2) + .045*Math.sin(seed*5)
      + time*speed + .055*Math.sin(time*.063+seed) + .02*Math.sin(time*.041+seed*3);
    let radius = 20 + Math.pow(spread,1.18)*36
      + 1.4*Math.sin(time*.022+seed*3+spread*7) + .65*Math.sin(time*.051+seed*5);
    if (i%9===0) {
      // The outer one ninth joins, shares the common flow, then leaves. Smooth
      // endpoints prevent jumps or pulses; a broad phase spread avoids waves.
      const phase=((time/(270+scatter(i+937)*180)+scatter(i+191))%1+1)%1;
      const gathered=smooth(phase/.28)*(1-smooth((phase-.68)/.32));
      const outer=72+scatter(i+367)*22;
      radius=outer+(radius-outer)*gathered;
    }
    const lon = (center[0] + Math.cos(angle)*radius/(METRES_PER_DEGREE*Math.cos(center[1]*R)))*R;
    const lat = (center[1] + Math.sin(angle)*radius/METRES_PER_DEGREE)*R;
    output[i*3] = Math.cos(lat)*Math.sin(lon)*1.000021;
    output[i*3+1] = Math.sin(lat)*1.000021;
    output[i*3+2] = Math.cos(lat)*Math.cos(lon)*1.000021;
  }
}
