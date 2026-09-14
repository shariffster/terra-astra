import { AWAKENING, awakeningEase as ease } from '../terra/awakening';
import { destinationProfile } from './destination-profiles';
import { emptyRates, type EventRates } from './seeded-scheduler';
import type { AudioWorldState, BusGains } from './world-state';

export type AudioScene = {
  buses: BusGains;
  rates: EventRates;
  cutoff: number;
  width: number;
  airHz: number;
  oceanHz: number;
  grainHz: number;
  pressure: number;
  circulation: number;
  phase: number;
  breath: number;
  swell: number;
  motion: boolean;
  genesis: boolean;
  drift: number;
  seconds: number;
  harmonicPresence: number;
  harmonicIntroduction: boolean;
  harmonicDetail: number;
};
const ramp = (n: number, start: number, end: number) => ease((n - start) / (end - start));

/** Pure interpretation of current world state, usable with OfflineAudioContext.
 * No event triggers in the renderer and no second awakening timeline. */
export function directAudio(world: AudioWorldState, reducedMotion: boolean): AudioScene {
  const p = world.world.genesis.progress;
  const genesis = world.world.genesis.busy;
  const motion = world.motion && !reducedMotion;
  const scene: AudioScene = {
    buses: { planet: 0, orbit: 0, atmosphere: 0, ocean: 0, network: 0, urban: 0, destination: 0, harmonic: 0 },
    rates: emptyRates(), cutoff: 8500, width: .85, airHz: 620, oceanHz: 430,
    grainHz: 300, pressure: 0, circulation: 0, phase: world.seconds * .017,
    breath: motion ? .58 + .42 * Math.sin(world.seconds * .093) ** 2 : .70,
    swell: motion ? .12 + .88 * (Math.sin(world.seconds * .073 + .4) * .5 + .5) ** 3 : .3,
    motion, genesis, drift: 0, seconds: world.seconds, harmonicPresence: 0,
    harmonicIntroduction: genesis || world.awakening.elapsed < 18,
    harmonicDetail: .55,
  };
  if (!world.available) return scene;
  if (genesis) {
    const compression = ramp(p, .20, .32) * (1 - ramp(p, .355, .52));
    const bloom = ramp(p, .32, .345) * (1 - ramp(p, .355, .41));
    const exhale = ramp(p, .355, .42) * (1 - ramp(p, .52, .67));
    const capture = ramp(p, .52, .68) * (1 - ramp(p, .80, .94));
    scene.buses.planet = .24 + compression * .14 + ramp(p, .78, 1) * .46;
    scene.buses.orbit = .08 * (1 - ramp(p, .12, .24)) + capture * .2;
    scene.buses.atmosphere = exhale * .33;
    scene.buses.destination = bloom * .55;
    scene.buses.harmonic = compression * .08 + bloom * .30 + capture * .18;
    scene.circulation = bloom * .65; // A short physical harmonic bloom, no score.
    scene.pressure = compression * .3;
    scene.airHz = 380 + exhale * 420;
    scene.rates.orbit = p < .12 ? .14 : capture * .42;
    scene.cutoff = 4800 - compression * 2100;
    scene.width = motion ? .3 + exhale * .65 : .2;
    return scene;
  }
  const t = world.awakening.elapsed;
  const awake = (layer: 'satellites' | 'aircraft' | 'ships' | 'cables') => ramp(t, AWAKENING[layer].start, AWAKENING[layer].end);
  const local = 1 - ramp(Math.log(Math.max(.0001, world.altitude)), Math.log(.004), Math.log(.18));
  const street = 1 - ramp(world.altitude, .00065, .0023);
  const near = 1 - ramp(world.altitude, .18, 1.8);
  const generic=world.world.open;
  const profile = destinationProfile(world.world.targetId) ?? (generic?{grainRate:.22*generic.urban,grainHz:300,warmth:.3,ocean:generic.ocean,width:.5,circulation:0,pressure:0}:null);
  const deep = (profile?.pressure ?? 0) * (1 - ramp(world.altitude, .32, 1.8));
  const terra = 1 - ease(world.opening);
  const a = world.activity;
  scene.width = motion ? (.9 * (1 - local) + (profile?.width ?? .4) * local) * (1 - deep * .75) : .15;
  scene.cutoff = 8500 * (1 - deep) + 480 * deep;
  scene.oceanHz = (380 + near * 170) * (1 - deep * .72);
  scene.airHz = 640 + near * 340;
  scene.grainHz = profile?.grainHz ?? 300;
  scene.pressure = deep * .7;
  scene.circulation = (profile?.circulation ?? 0) * a.circulation * local;
  scene.buses.planet = (.70 * (1 - local) + .15 * local) * (1 - deep * .42);
  scene.buses.orbit = awake('satellites') * a.satellites * .74 * (1 - local * .97) * (1 - deep * .9) * terra;
  scene.buses.atmosphere = awake('aircraft') * a.aircraft * (.10 + (motion && world.flying ? .035 : 0)) * (1 - local * .9) * (1 - deep * .97) * terra;
  // Ships precede the slow surface field; both read the original awakening.
  scene.buses.ocean = (awake('ships') * .11 * a.ships + world.awakening.ocean * .32) * (1 + near * .35) * ((1 - local) + local * (profile?.ocean ?? .4)) * terra;
  scene.buses.network = awake('cables') * a.network * .29 * (1 - local * .7) * (1 - deep * .94) * terra;
  scene.buses.urban = a.urban * local * (.46 + street * .14) * terra;
  scene.buses.destination = (scene.circulation * .55 + deep * .48 + (profile?.warmth ?? 0) * a.urban * local * .38) * terra;
  // The owner explicitly requested a repeating harmonic bed after rejecting
  // the noise-only candidates. It remains subordinate to the same world clock.
  // Makkah retains only its existing movement interpretation at local scale.
  scene.buses.harmonic = ramp(t, AWAKENING.breath, 18) * (.62 + local * .10) * (1 - deep * .80) * (1 - (profile?.circulation ?? 0) * local) * (1 - ease(world.opening) * .18);
  scene.harmonicPresence = ((scene.harmonicIntroduction ? .50 : .80) + local * (scene.harmonicIntroduction ? .42 : .20) * a.urban) * (1 - deep * .90);
  scene.harmonicDetail = (.55 + local * .35 * a.urban + ease(world.opening) * .15) * (1 - deep * .7);
  scene.rates.orbit = .22 * awake('satellites') * a.satellites * (1 - local) * (1 - deep);
  scene.rates.atmosphere = .12 * awake('aircraft') * a.aircraft * (1 - local) * (1 - deep);
  scene.rates.ocean = .10 * awake('ships') * a.ships * (1 - deep * .94);
  scene.rates.network = .105 * awake('cables') * a.network * (1 - deep);
  scene.rates.urban = (profile?.grainRate ?? 0) * a.urban * local;
  scene.rates.destination = profile && !profile.circulation && !profile.pressure ? profile.warmth * .17 * a.urban * local : 0;
  for (const key of Object.keys(scene.rates) as (keyof EventRates)[]) scene.rates[key] *= terra * (motion ? 1 : .32);
  // Astra retains a faint planetary presence as the same material opens out.
  scene.buses.planet *= 1 - ease(world.opening) * .6;
  if (t <= AWAKENING.breath) {
    for (const key of Object.keys(scene.buses) as (keyof BusGains)[]) if (key !== 'planet') scene.buses[key] = 0;
    scene.rates = emptyRates();
  }
  scene.drift = motion ? Math.sin(world.longitude * Math.PI / 180) * .08 : 0;
  return scene;
}
