import { DEFAULT_PRESENTATION, validateWorldCommand, type WorldPresentation, type WorldLayer } from '../world/commands';

export const LIGHT_RANGES = {
 skyLight: [0, 1.5, .01], skyDust: [0, 1, .01], glow: [.25, 2, .01], shimmer: [0, 2, .01], threads: [0, 1.4, .01], density: [.2, 1, .01],
 nightLights: [0, 2, .01], warmth: [0, 1, .01], oceanLight: [0, 2, .01],
 pathLight: [0, 2, .01], pathVolume: [0, 1, .01], travellerLight: [0, 2, .01], travellerVolume: [0, 1, .01],
 airLight: [0, 2, .01], seaLight: [0, 2, .01], cableLight: [0, 2, .01], orbitLight: [0, 2, .01],
 population: [0, 1.5, .01], footprint: [0, 1.5, .01], fieldDensity: [.1, 1, .01], colour: [0, 1, .01],
} as const;
export type LightNumber = keyof typeof LIGHT_RANGES;
export type LightOptions = Record<LightNumber, number> & { depth: boolean; borders: boolean; motion: boolean };
export const DEFAULT_LIGHT: LightOptions = Object.freeze({
 skyLight: .7, skyDust: 0, glow: 1.15, shimmer: 1.1, depth: true, threads: .55, density: .85, borders: false, motion: true,
 nightLights: 1.15, warmth: .65, oceanLight: .8, pathLight: 1, pathVolume: .85, travellerLight: 1, travellerVolume: .85,
 airLight: .9, seaLight: 1, cableLight: .85, orbitLight: 1, population: .55, footprint: .38, fieldDensity: .75, colour: .6,
});
export type Composition = { schema: 'terra-astra-composition'; version: 1; name: string; light: LightOptions; presentation: WorldPresentation; layers: Record<WorldLayer, boolean> };
export const COMPOSITION_STORAGE = 'terra-astra:composition:v1';
export const SAVED_COMPOSITIONS = 'terra-astra:saved-compositions:v1';
export const DEFAULT_LAYERS: Readonly<Record<WorldLayer,boolean>> = Object.freeze({ satellites: true, aircraft: true, ships: true, cables: true, urban: true });
export function composition(name: string, light: LightOptions, presentation = DEFAULT_PRESENTATION, layers: Readonly<Record<WorldLayer,boolean>> = DEFAULT_LAYERS): Composition {
 return { schema: 'terra-astra-composition', version: 1, name: name.trim().slice(0, 60) || 'My Earth', light: {...light}, presentation: {...presentation}, layers: {...layers} };
}
export function validateComposition(value: unknown): Composition | null {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
 const c = value as Record<string, unknown>;
 if(c.schema !== 'terra-astra-composition' || c.version !== 1 || typeof c.name !== 'string' || c.name.length > 60) return null;
 if(!c.light || typeof c.light !== 'object' || !c.layers || typeof c.layers !== 'object') return null;
 const light = c.light as Record<string, unknown>, layers = c.layers as Record<string, unknown>, clean = {...DEFAULT_LIGHT};
 for(const key of Object.keys(LIGHT_RANGES) as LightNumber[]) {
  const v = (key === 'skyLight' || key === 'skyDust') && light[key] === undefined ? DEFAULT_LIGHT[key] : light[key], [min,max] = LIGHT_RANGES[key];
  if(typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) return null;
  clean[key] = Math.round(v * 100) / 100;
 }
 for(const key of ['motion','borders','depth'] as const) { if(typeof light[key] !== 'boolean') return null; clean[key] = light[key]; }
 const presentation = validateWorldCommand({type:'setPresentation',presentation:c.presentation});
 if(presentation?.type !== 'setPresentation' || Object.keys(presentation.presentation).length !== Object.keys(DEFAULT_PRESENTATION).length) return null;
 const safeLayers = {...DEFAULT_LAYERS};
 for(const key of Object.keys(safeLayers) as WorldLayer[]) { if(typeof layers[key] !== 'boolean') return null; safeLayers[key] = layers[key]; }
 return composition(c.name, clean, {...DEFAULT_PRESENTATION,...presentation.presentation}, safeLayers);
}
export function parseComposition(text: string) { if(text.length > 32768) return null; try { return validateComposition(JSON.parse(text)); } catch { return null; } }

/** These change light only: preserve the chosen lens, transport switches and motion preference. */
export const COMPOSITION_PRESETS: Record<'Quiet'|'Balanced'|'Rich', LightOptions> = {
 Quiet: {...DEFAULT_LIGHT, glow: 1, shimmer: .65, density: .72, nightLights: 1.08, population: .3, footprint: .18, fieldDensity: .6, pathLight: .72, pathVolume: .5, travellerVolume: .55, skyLight: .45},
 Balanced: {...DEFAULT_LIGHT},
 Rich: {...DEFAULT_LIGHT, glow: 1.24, shimmer: 1.05, density: .94, nightLights: 1.24, population: .85, footprint: .62, fieldDensity: .95, colour: .62, pathLight: 1.08, pathVolume: 1, travellerVolume: .9, skyLight: .9},
};
export function sameComposition(a: Composition, b: Composition) {
 return (Object.keys(DEFAULT_LIGHT) as (keyof LightOptions)[]).every(k=>a.light[k]===b.light[k]) &&
 Object.keys(DEFAULT_PRESENTATION).every(k=>a.presentation[k as keyof WorldPresentation]===b.presentation[k as keyof WorldPresentation]) &&
 (Object.keys(DEFAULT_LAYERS) as WorldLayer[]).every(k=>a.layers[k]===b.layers[k]);
}
