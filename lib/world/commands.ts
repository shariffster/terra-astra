import { SPECIAL_TARGETS } from './special-destinations';
import type { OpenWorldContext, PlaceResolution, ResolvedWorldTarget } from './open-types';
/** Serializable boundary for YC's Live navigator. Rendering stays inside the engine. */
export type ScaleTier = 'planet' | 'region' | 'city' | 'street';
export type WorldLayer = 'satellites' | 'aircraft' | 'ships' | 'cables' | 'urban';
export type WorldPresentation = { focus: 'living' | 'night-lights' | 'population' | 'footprint' | 'connections'; pathways: boolean; travellers: boolean; keepActivity: boolean };
export const DEFAULT_PRESENTATION: WorldPresentation = Object.freeze({ focus: 'living', pathways: true, travellers: true, keepActivity: false });
export type WorldCommand =
  | { type: 'flyTo'; targetId: string }
  | { type: 'flyToPlace'; query: string; choice?: string }
  | { type: 'setScale'; tier: ScaleTier }
  | { type: 'focusLayer'; layer: WorldLayer; enabled?: boolean }
  | { type: 'setPresentation'; presentation: Partial<WorldPresentation> }
  | { type: 'highlightTarget'; targetId: string }
  | { type: 'resetView' };
export type GenesisPhase = 'core' | 'compression' | 'ignition' | 'ejection' | 'capture' | 'settlement' | 'complete';
export type GenesisState = Readonly<{ phase: GenesisPhase; progress: number; busy: boolean }>;
export type WorldState = Readonly<{ targetId: string | null; tier: ScaleTier; busy: boolean; genesis: GenesisState; layers: Readonly<Record<WorldLayer, boolean>>; presentation?: WorldPresentation; humanFields?: 'ready' | 'unavailable'; resolvedTarget?:ResolvedWorldTarget; open?:OpenWorldContext; resolving?:boolean }>;
export type WorldCommandResult = Readonly<{ ok: boolean; command: WorldCommand; reason?: string; resolution?:PlaceResolution }>;
export type WorldTarget = Readonly<{ id: string; label: string; lat: number; lon: number; tier: ScaleTier; detail: string }>;
export const WORLD_TARGETS: readonly WorldTarget[] = Object.freeze(([
  { id: 'singapore', label: 'Singapore', lat: 1.2965, lon: 103.851, tier: 'city', detail: 'Detailed central Singapore streets; procedural activity.' },
  { id: 'new-york', label: 'New York', lat: 40.721562, lon: -73.995718, tier: 'city', detail: 'Curated New York showcase; procedural activity.' },
  ...SPECIAL_TARGETS,
  { id: 'challenger-deep', label: 'Challenger Deep', lat: 11.369, lon: 142.587, tier: 'region', detail: 'Mariana Trench; exaggerated NOAA relief.' },
] satisfies WorldTarget[]).map(target=>Object.freeze(target)));
export function validateWorldCommand(input: unknown): WorldCommand | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const c=input as Record<string,unknown>;
  if(c.type==='flyToPlace')return typeof c.query==='string'&&c.query.trim().length>=1&&c.query.length<=120&&(c.choice===undefined||typeof c.choice==='string'&&c.choice.length<=100)?{type:'flyToPlace',query:c.query.trim(),...(typeof c.choice==='string'?{choice:c.choice}:{})}:null;
  if(c.type==='flyTo'||c.type==='highlightTarget') return typeof c.targetId==='string'&&WORLD_TARGETS.some(t=>t.id===c.targetId)?{type:c.type,targetId:c.targetId}:null;
  if(c.type==='resetView')return {type:'resetView'};
  if(c.type==='setScale'&&['planet','region','city','street'].includes(c.tier as string))return {type:'setScale',tier:c.tier as ScaleTier};
  if(c.type==='focusLayer'&&['satellites','aircraft','ships','cables','urban'].includes(c.layer as string)&&(c.enabled===undefined||typeof c.enabled==='boolean'))return {type:'focusLayer',layer:c.layer as WorldLayer,...(c.enabled===undefined?{}:{enabled:c.enabled})};
  if(c.type==='setPresentation'&&c.presentation&&typeof c.presentation==='object'&&!Array.isArray(c.presentation)){
    const p=c.presentation as Record<string,unknown>,result:Partial<WorldPresentation>={};
    if(Object.keys(p).some(key=>!['focus','pathways','travellers','keepActivity'].includes(key)))return null;
    if(p.focus!==undefined){if(!['living','night-lights','population','footprint','connections'].includes(p.focus as string))return null;result.focus=p.focus as WorldPresentation['focus'];}
    for(const key of ['pathways','travellers','keepActivity'] as const){if(p[key]!==undefined){if(typeof p[key]!=='boolean')return null;result[key]=p[key];}}
    return Object.keys(result).length?{type:'setPresentation',presentation:result}:null;
  }
  return null;
}
