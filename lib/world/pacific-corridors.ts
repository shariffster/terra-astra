/** Illustrative offshore passages. Shared stretches have exact gates; branches
 * leave at different shoulders. Every candidate is checked against ETOPO. */
type Location = readonly [number, number];
const japan:Location=[33.875,142.125],guam:Location=[11.875,145.125],hawaii:Location=[21.875,-156.875];
const california:Location=[36.875,-124.875],southCalifornia:Location=[31.875,-119.875];
const fiji:Location=[-19.125,178.125],auckland:Location=[-35.125,176.125],sydney:Location=[-34.125,153.125];
export const pacificNorth:readonly Location[]=[japan,[35,147],[37.5,155],[40.5,166],[43,179],[44,-165],[43,-152],[40,-139],[38,-131],california];
export const pacificMiddle:readonly Location[]=[guam,[12.8,149],[15.2,156],[19,166],[22,177],[23.6,-173],[23.5,-165],[23,-160],[22.4,-158.3],hawaii];
export const pacificSouth:readonly Location[]=[guam,[11.4,148],[9.5,153],[5.8,159],[.5,165],[-5.5,170],[-11.5,174],[-16,174.5],[-18.6,176],[-19.4,177],fiji];
export const hawaiiSouth:readonly Location[]=[[-11,-171],[0,-164],[11,-161],[17,-160.5],[19,-159],[20.5,-158.5],hawaii];
const guamWest:readonly Location[]=[guam,[12,143.8],[12.8,142.8],[14.4,142.3],[17,142]];
export const philippineSea:readonly Location[]=[[28,137],[24,139],[19,142],...[...guamWest].reverse()];
export const californiaCoast:readonly Location[]=[california,[35.5,-123.6],[34,-122.5],[32.8,-121.3],southCalifornia];
export const pacificSpines:readonly (readonly Location[])[]=[
 pacificNorth,
 [japan,[35,147],[37.5,155],[37.2,161],[35.5,169],[32,178],[28,-173],[25,-165],[23,-160],[22.4,-158.3],hawaii],
 pacificMiddle,
 [guam,[12.8,149],[15.2,156],[20,166],[27,177],[33,-170],[37.5,-155],[40,-139],[38,-131],california],
 [hawaii,[22.5,-153.5],[24,-149],[26.5,-142],[29,-134],[31,-126],southCalifornia],
 [hawaii,[22.5,-153.5],[24,-149],[28,-140],[32,-132],[35,-127.5],california],
 [auckland,[-29,179],[-20,-178],...hawaiiSouth],
 [fiji,[-18,-179.5],[-15,-176.5],...hawaiiSouth],
 pacificSouth,
 [guam,[11.4,148],[9.5,153],[5,153.5],[1,154],[-4,153],[-8,154],[-12,156],[-19,158],[-26,156.7],[-31,155],sydney],
 [sydney,[-32,157.5],[-28.5,164],[-23,172],[-20.5,176],fiji],
 [auckland,[-30,177.2],[-25,178],[-21.5,178.5],fiji],
 [...guamWest,[19,142],[24,141],[28,141.5],[31,142.2],japan],
 californiaCoast,
];
