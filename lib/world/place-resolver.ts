import { WORLD_TARGETS } from './commands';
import { placeCatalogue } from '../personal/catalogue';
import { distanceKm, type PlaceKind, type PlaceResolution, type ResolvedWorldTarget, type SourcePlace } from './open-types';

export const normalizePlace = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/^the /, '');
let catalogue: SourcePlace[] | undefined;
const results = new Map<string, PlaceResolution>();
const aliases: Record<string, string> = { nyc: 'new-york', mecca: 'makkah', 'masjid al haram': 'makkah', kaaba: 'makkah', 'the palm': 'palm-jumeirah', 'mariana trench': 'challenger-deep' };

export async function getOpenCatalogue(signal?: AbortSignal): Promise<SourcePlace[]> {
  if (catalogue) return catalogue;
  const response = await fetch('/data/open-earth/places.json', { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Place catalogue is unavailable.');
  const raw = await response.json() as SourcePlace[];
  if (!Array.isArray(raw) || raw.length > 20000 || !raw.every(validPlace)) throw new Error('Invalid place catalogue.');
  catalogue = raw;
  return raw;
}
function validPlace(p: SourcePlace) {
  return p && typeof p.id === 'string' && typeof p.label === 'string' && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lon) && Math.abs(p.lon) <= 180 && Array.isArray(p.aliases);
}
function authored(name: string): ResolvedWorldTarget | undefined {
  const n = normalizePlace(name), t = WORLD_TARGETS.find(t => normalizePlace(t.label) === n || t.id === name || aliases[n] === t.id);
  return t ? { ...t, mode: 'authored', authoredId: t.id, kind: t.id === 'challenger-deep' ? 'maritime' : 'city', region: '', contextRadiusKm: t.id === 'new-york' ? 250 : 180, cityRadiusKm: 10, source: 'Authored destination', sourceId: t.id, sourceUrl: '/history', population: 0 } : undefined;
}
export function resolveSourcePlace(p: SourcePlace): ResolvedWorldTarget {
  const special = authored(p.label);
  if (special && distanceKm(special, p) < 100) return special;
  let kind: PlaceKind = p.kind;
  if (/island/i.test(p.category)) kind = 'island';
  else if (/mountain|range|peak/i.test(p.category)) kind = 'mountain';
  else if (kind === 'city' && p.population > 0 && p.population < 50000) kind = 'settlement';
  let radius = kind === 'city' ? (p.population > 5000000 ? 350 : p.population > 1000000 ? 250 : 160) : kind === 'settlement' ? 110 : kind === 'country' ? 700 : kind === 'mountain' ? 280 : kind === 'maritime' ? 450 : 250;
  if (p.bounds) radius = Math.max(kind === 'city' || kind === 'settlement' ? 100 : 180, Math.min(2200, distanceKm({lon:p.bounds[0],lat:p.bounds[1]}, {lon:p.bounds[2],lat:p.bounds[3]}) * .6));
  const cityRadiusKm = p.population > 10000000 ? 65 : p.population > 5000000 ? 45 : p.population > 1000000 ? 30 : p.population > 100000 ? 20 : 12;
  return { id:p.id, label:p.label, lat:p.lat, lon:p.lon, kind, mode:'open', tier:'region', region:p.region,
    contextRadiusKm:radius, cityRadiusKm, bounds:p.bounds, population:p.population,
    source:p.source === 'natural-earth' ? 'Natural Earth · public domain' : p.source === 'geonames' ? 'GeoNames · CC BY 4.0' : 'OpenStreetMap via Photon · ODbL',
    sourceId:p.id, sourceUrl:p.source === 'natural-earth' ? 'https://www.naturalearthdata.com/' : p.source === 'geonames' ? `https://www.geonames.org/${p.id.replace('gn-','')}/` : 'https://www.openstreetmap.org/copyright',
    detail:'Sourced geography; local roads where available. Surrounding light is interpretive.' };
}
function remember(key: string, result: PlaceResolution) {
  results.delete(key); results.set(key,result);
  while(results.size > 64) results.delete(results.keys().next().value!);
  return result;
}
function select(candidates: ResolvedWorldTarget[], choice?: string): PlaceResolution {
  const unique = [...new Map(candidates.map(c => [c.id,c])).values()];
  const chosen = choice ? unique.find(c => c.id === choice) : unique.length === 1 ? unique[0] : undefined;
  return chosen ? {status:'resolved',target:chosen} : unique.length ? {status:'ambiguous',candidates:unique.slice(0,6),message:'Choose the place you mean.'} : {status:'unknown',message:'That place was not found. Try its country or another spelling.'};
}
/** Only sourced entries can produce coordinates. Callers supply text and, for
 * ambiguity, an ID from this exact query's candidates; never arbitrary geometry. */
export async function resolvePlace(query: string, options: { signal?: AbortSignal; choice?: string; remote?: boolean } = {}): Promise<PlaceResolution> {
  const n = normalizePlace(query);
  if (!n || n.length > 120) return {status:'unknown',message:'Enter a place name, up to 120 characters.'};
  const special = authored(n);
  if(special) return {status:'resolved',target:special};
  const cached = results.get(n);
  if(cached) { results.delete(n); results.set(n,cached); return options.choice ? select(cached.candidates ?? (cached.target ? [cached.target] : []), options.choice) : cached; }
  let entries: SourcePlace[] = [];
  try { entries = await getOpenCatalogue(options.signal); } catch { if(options.signal?.aborted) throw options.signal.reason; }
  const personal = placeCatalogue.filter(p => p.source === 'geonames').map(p => ({...p,kind:'settlement' as const,category:'settlement',population:0,aliases:[p.label,p.searchNames],dataset:'GeoNames SG'}));
  const names = n === 'gulf' ? ['persian gulf','gulf of mexico'] : [n];
  const matches = [...entries,...personal].filter(p => names.some(q => [p.label,...p.aliases].some(a => normalizePlace(a) === q || normalizePlace(a+' '+p.region) === q)));
  if(matches.length) {
    // Prefer a source country over a same-name regional polygon; retain true
    // same-name cities as choices rather than guessing the user's intent.
    const countries = matches.filter(p => p.kind === 'country');
    const selected = countries.length === 1 && !matches.some(p => p.kind === 'city') ? countries : matches;
    const result = select(selected.map(resolveSourcePlace)); remember(n,result);
    return options.choice ? select(result.candidates ?? [result.target!],options.choice) : result;
  }
  if(options.remote === false) return {status:'unknown',message:'No matching place in the bundled catalogue.'};
  try {
    const response = await fetch('/api/terra/places?q='+encodeURIComponent(query), {signal:options.signal ? AbortSignal.any([options.signal,AbortSignal.timeout(6500)]) : AbortSignal.timeout(6500)});
    if(!response.ok) throw new Error('Resolver unavailable');
    const data = await response.json() as {places?:SourcePlace[]};
    const valid = (data.places ?? []).filter(validPlace).slice(0,6);
    const result = select(valid.map(resolveSourcePlace));
    if(result.status !== 'unknown') remember(n,result);
    return options.choice ? select(result.candidates ?? (result.target ? [result.target] : []),options.choice) : result;
  } catch {
    if(options.signal?.aborted) throw options.signal.reason;
    return {status:'unavailable',message:'Place lookup is unavailable. Try a known city, country or region; Earth remains ready to explore.'};
  }
}

export function resolverDiagnostics() { return {cacheSize:results.size,cacheLimit:64,catalogueSize:catalogue?.length ?? 0}; }
