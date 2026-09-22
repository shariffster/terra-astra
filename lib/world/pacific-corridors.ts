/** Illustrative offshore passages. Shared stretches have exact gates; branches
 * leave at different shoulders. Every candidate is checked against ETOPO. */
type Location = readonly [number, number];
const japan:Location=[33.875,142.125],guam:Location=[11.875,145.125],hawaii:Location=[21.875,-156.875];
const california:Location=[36.875,-124.875],southCalifornia:Location=[31.875,-119.875];
const fiji:Location=[-19.125,178.125],auckland:Location=[-35.125,176.125],sydney:Location=[-34.125,153.125];
const japanDeparture:readonly Location[]=[japan,[35,147],[37.5,155]];
const guamDeparture:readonly Location[]=[guam,[12.8,149],[15.2,156],[18,163]];
export const californiaArrival:readonly Location[]=[[39.7,-139],[38.8,-135],[38,-131],california];
export const hawaiiWest:readonly Location[]=[[23.5,-165],[23,-160],[22.4,-158.3],hawaii];
export const hawaiiEast:readonly Location[]=[hawaii,[22.5,-153.5],[24,-149]];
export const pacificNorth:readonly Location[]=[...japanDeparture,[38.8,160],[40.5,166],[43,179],[44,-165],[43,-152],[41.5,-145],...californiaArrival];
export const japanHawaii:readonly Location[]=[...japanDeparture,[37.8,160],[37.2,166],[35.3,174],[32,179.5],[28,-173],[25,-169],...hawaiiWest];
export const pacificMiddle:readonly Location[]=[...guamDeparture,[20.5,169],[22.5,177],[23.6,-173],...hawaiiWest];
export const guamCalifornia:readonly Location[]=[...guamDeparture,[20.5,169],[25,177],[31,-172],[36,-160],[38.2,-148],...californiaArrival];
export const hawaiiCalifornia:readonly Location[]=[...hawaiiEast,[26,-144],[29,-137],[32.4,-131.8],[35,-127.5],california];
export const hawaiiSouthCalifornia:readonly Location[]=[...hawaiiEast,[25.7,-144],[27.8,-137],[30,-130],[31.3,-124.5],southCalifornia];
export const pacificSouth:readonly Location[]=[guam,[11.4,148],[9.5,153],[5.8,159],[.5,165],[-5.5,170],[-11.5,174],[-16,174.5],[-18.6,176],[-19.4,177],fiji];
// A shared southern arrival opens gradually, staying west of the island chain.
export const hawaiiSouth:readonly Location[]=[[-11,-171],[-4,-166.8],[4,-164],[11,-163],[16,-162],[19,-160],[20.5,-158.5],hawaii];
const guamWest:readonly Location[]=[guam,[12,143.8],[12.8,142.8],[14.4,142.3],[17,142]];
export const philippineSea:readonly Location[]=[[28,137],[24,139],[19,142],...[...guamWest].reverse()];
export const californiaCoast:readonly Location[]=[california,[35.5,-123.6],[34,-122.5],[32.8,-121.3],southCalifornia];
export const pacificSpines:readonly (readonly Location[])[]=[
 pacificNorth,
 japanHawaii,
 pacificMiddle,
 guamCalifornia,
 hawaiiSouthCalifornia,
 hawaiiCalifornia,
 [auckland,[-29,179],[-20,-178],...hawaiiSouth],
 [fiji,[-18,-179.5],[-15,-176.5],...hawaiiSouth],
 pacificSouth,
 [guam,[11.4,148],[9.5,153],[5,153.5],[1,154],[-4,153],[-8,154],[-12,156],[-19,158],[-26,156.7],[-31,155],sydney],
 [sydney,[-32,157.5],[-28.5,164],[-23,172],[-20.5,176],fiji],
 [auckland,[-30,177.2],[-25,178],[-21.5,178.5],fiji],
 [...guamWest,[19,142],[24,141],[28,141.5],[31,142.2],japan],
 californiaCoast,
];
