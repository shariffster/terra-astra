/** Movement interpretations, never recordings or claims about a place's sound. */
export const DESTINATION_PROFILES = {
  'new-york': { seed: 260914, grainRate: .52, grainHz: 290, warmth: .25, ocean: .22, width: .55, circulation: 0, pressure: 0 },
  singapore: { seed: 260913, grainRate: .31, grainHz: 380, warmth: .4, ocean: .65, width: .48, circulation: 0, pressure: 0 },
  'palm-jumeirah': { seed: 260915, grainRate: .14, grainHz: 220, warmth: .9, ocean: 1, width: .68, circulation: 0, pressure: 0 },
  makkah: { seed: 260916, grainRate: 0, grainHz: 162, warmth: .45, ocean: .06, width: .46, circulation: 1, pressure: 0 },
  'challenger-deep': { seed: 260917, grainRate: 0, grainHz: 114, warmth: .2, ocean: .85, width: .2, circulation: 0, pressure: 1 },
} as const;

export function destinationProfile(id: string | null) {
  return DESTINATION_PROFILES[id as keyof typeof DESTINATION_PROFILES] ?? null;
}
