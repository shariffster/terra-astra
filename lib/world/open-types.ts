import type { ScaleTier } from './commands';

export type PlaceKind = 'city' | 'settlement' | 'country' | 'region' | 'mountain' | 'island' | 'maritime' | 'lake' | 'feature';
export type GeographicBounds = readonly [number, number, number, number];
export type SourcePlace = {
  id: string; label: string; lat: number; lon: number; kind: PlaceKind;
  category: string; region: string; population: number; aliases: string[];
  source: 'natural-earth' | 'photon' | 'geonames'; dataset: string; bounds?: GeographicBounds;
};
export type ResolvedWorldTarget = Readonly<{
  id: string; label: string; lat: number; lon: number; kind: PlaceKind;
  mode: 'authored' | 'open'; authoredId?: string; tier: ScaleTier;
  region: string; contextRadiusKm: number; cityRadiusKm: number;
  bounds?: GeographicBounds; source: string; sourceId: string; sourceUrl: string;
  detail: string; population: number;
}>;
export type PlaceResolution = {
  status: 'resolved' | 'ambiguous' | 'unknown' | 'unavailable';
  target?: ResolvedWorldTarget; candidates?: ResolvedWorldTarget[]; message?: string;
};
export type OpenDetailState = 'DETAILED' | 'SIMPLIFIED' | 'INTERPRETIVE';
export type OpenWorldContext = {
  target: ResolvedWorldTarget; detailState: OpenDetailState;
  detailLoading: boolean; detailMessage: string; nearby: { id: string; label: string; distanceKm: number; lat:number;lon:number }[];
  radiusKm: number; recenterCount: number; cacheSize: number; disposedWindows: number;
  requests: number; failures: number; ocean: number; urban: number;
};

export const degrees = Math.PI / 180;
export const wrapLongitude = (n: number) => ((n + 180) % 360 + 360) % 360 - 180;
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dlat = (b.lat - a.lat) * degrees, dlon = wrapLongitude(b.lon - a.lon) * degrees;
  const q = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * degrees) * Math.cos(b.lat * degrees) * Math.sin(dlon / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(q)));
}
export function cameraAltitude(radiusKm: number, width: number, height: number) {
  return Math.max(.0005, radiusKm / 6371 / Math.tan(21 * degrees) * Math.max(1, height / Math.max(1, width)) * 1.15);
}
