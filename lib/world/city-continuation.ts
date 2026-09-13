/** Dim procedural context beyond the accurate OSM core. Never mapped or live streets. */
export type ContinuationCity = 'singapore' | 'new-york' | 'palm-jumeirah' | 'makkah';
export type CityContinuation = {
  /** Band C: sparse, interpretive urban constellation. */
  stars: Float32Array;
  lines: Float32Array;
  /** Band B: selected peripheral roads and simplified continuation. */
  intermediate: { stars: Float32Array; lines: Float32Array };
  bounds: { south: number; west: number; north: number; east: number };
  core: { centerLat: number; centerLon: number; halfLatitude: number; halfLongitude: number };
  feather: { start: number; end: number };
  interpretation: string;
};
export type ContinuationOptions = { elevation?: Int16Array; pointBudget?: number };
type Point = readonly [number, number];
const R = Math.PI / 180;
const cache = new WeakMap<Float32Array, { key: string; elevation: Int16Array | undefined; result: CityContinuation }[]>();
const smooth = (a: number, b: number, value: number) => { const t = Math.max(0, Math.min(1, (value - a) / (b - a))); return t * t * (3 - 2 * t); };
function random(n: number) { let x = Math.imul(n ^ (n >>> 16), 0x21f0aaad); x = Math.imul(x ^ (x >>> 15), 0x735a2d97); return ((x ^ (x >>> 15)) >>> 0) / 4294967296; }
const cities = {
  singapore: {
    core: { centerLat: 1.305, centerLon: 103.8525, halfLatitude: .039, halfLongitude: .055 },
    bounds: { south: 1.265, west: 103.67, north: 1.455, east: 104.015 },
    hubs: [[103.8525,1.305],[103.795,1.327],[103.746,1.352],[103.714,1.345],[103.835,1.375],[103.875,1.38],[103.925,1.348],[103.954,1.365],[103.814,1.423]] as Point[],
    // Conservative artistic land envelopes; not a replacement coastline dataset.
    land: [[[103.67,1.34],[103.70,1.41],[103.755,1.443],[103.82,1.452],[103.88,1.415],[103.944,1.414],[104.0,1.375],[103.978,1.333],[103.93,1.304],[103.855,1.27],[103.79,1.284],[103.714,1.30]]] as Point[][],
  },
  'new-york': {
    core: { centerLat: 40.72155, centerLon: -73.9957, halfLatitude: .01805, halfLongitude: .0237 },
    bounds: { south: 40.65, west: -74.02, north: 40.86, east: -73.87 },
    hubs: [[-73.9957,40.72155],[-73.985,40.752],[-73.969,40.78],[-73.95,40.811],[-73.943,40.834],[-73.941,40.742],[-73.921,40.769],[-73.955,40.694],[-73.934,40.674]] as Point[],
    land: [
      [[-74.014,40.706],[-74.008,40.739],[-73.995,40.766],[-73.976,40.802],[-73.944,40.855],[-73.934,40.85],[-73.945,40.818],[-73.944,40.795],[-73.966,40.761],[-73.976,40.735],[-73.991,40.712]],
      [[-73.97,40.685],[-73.956,40.718],[-73.947,40.731],[-73.956,40.749],[-73.938,40.772],[-73.907,40.783],[-73.876,40.757],[-73.886,40.69],[-73.928,40.655],[-73.962,40.657]],
    ] as Point[][],
  },
  'palm-jumeirah': {
    core: { centerLat: 25.1124, centerLon: 55.139, halfLatitude: .025, halfLongitude: .035 },
    bounds: { south: 25.011, west: 55.062, north: 25.151, east: 55.265 },
    hubs: [[55.123,25.059],[55.154,25.061],[55.179,25.09],[55.208,25.109],[55.236,25.102],[55.093,25.034]] as Point[],
    // Conservative mainland only: the mapped Palm and its water stay untouched.
    land: [[[55.062,25.011],[55.095,25.046],[55.136,25.068],[55.19,25.106],[55.232,25.131],[55.265,25.151],[55.265,25.011]]] as Point[][],
  },
  makkah: {
    core: { centerLat: 21.4225172, centerLon: 39.8261942, halfLatitude: .013, halfLongitude: .014 },
    bounds: { south: 21.383, west: 39.776, north: 21.469, east: 39.88 },
    hubs: [[39.826,21.4225],[39.81,21.414],[39.799,21.426],[39.814,21.443],[39.843,21.435],[39.849,21.415],[39.827,21.397],[39.863,21.431]] as Point[],
    land: [[[39.776,21.415],[39.791,21.446],[39.822,21.469],[39.852,21.459],[39.88,21.432],[39.861,21.401],[39.824,21.383],[39.794,21.395]]] as Point[][],
  },
};
function inside(lon: number, lat: number, polygon: Point[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > lat) !== (b[1] > lat) && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}
function sphere(lon: number, lat: number, out: number[], radius: number) {
  const a = lon * R, b = lat * R;
  out.push(radius * Math.cos(b) * Math.sin(a), radius * Math.sin(b), radius * Math.cos(b) * Math.cos(a));
}
/** Smooth spatial weights shared by stars and filament endpoint colours. The
 * overlap is deliberately broad; there is no rendered rectangle at a data edge. */
export function continuationBandWeight(cityId: ContinuationCity, band: 'intermediate' | 'far', lon: number, lat: number) {
  const { core, bounds } = cities[cityId];
  const d = Math.hypot((lon-core.centerLon)/core.halfLongitude, (lat-core.centerLat)/core.halfLatitude);
  const edge = Math.min((lon-bounds.west)/(bounds.east-bounds.west), (bounds.east-lon)/(bounds.east-bounds.west), (lat-bounds.south)/(bounds.north-bounds.south), (bounds.north-lat)/(bounds.north-bounds.south));
  const envelope = smooth(0,.17,edge);
  return envelope * (band === 'intermediate'
    ? smooth(.46,.96,d) * (1-smooth(1.5,3.6,d))
    : smooth(.95,2.15,d) / (1+Math.max(0,d-2)*.36));
}
/** Camera ownership remains with the engine. These are bounded opacity factors. */
export function continuationScale(altitude: number) {
  return { intermediate: 1-.83*smooth(.003,.019,altitude), far: .42+.58*smooth(.0012,.008,altitude) };
}
/** Inputs must be treated as immutable. Repeated calls with the same arrays/options reuse the prepared buffers. */
export function createCityContinuation(cityId: ContinuationCity, roadPositions: Float32Array, options: ContinuationOptions = {}): CityContinuation {
  const budget = Math.max(0, Math.min(24000, Math.floor(Number.isFinite(options.pointBudget) ? options.pointBudget! : 16000)));
  const key = `${cityId}:${budget}`;
  let entries = cache.get(roadPositions);
  const cached = entries?.find(entry=>entry.key===key&&entry.elevation===options.elevation);
  if (cached) return cached.result;
  const city = cities[cityId], core = city.core, bounds = city.bounds;
  const geographic: number[] = [];
  for (let i=0; i+5<roadPositions.length; i+=6) {
    const ax=roadPositions[i],ay=roadPositions[i+1],az=roadPositions[i+2],bx=roadPositions[i+3],by=roadPositions[i+4],bz=roadPositions[i+5];
    const ar=Math.hypot(ax,ay,az),br=Math.hypot(bx,by,bz),length=Math.hypot(ax-bx,ay-by,az-bz)*6371000;
    if (!(ar>.98&&ar<1.02&&br>.98&&br<1.02&&length>18&&length<900)) continue;
    const alon=Math.atan2(ax,az)/R,alat=Math.atan2(ay,Math.hypot(ax,az))/R,blon=Math.atan2(bx,bz)/R,blat=Math.atan2(by,Math.hypot(bx,bz))/R;
    if (Math.abs(alon-core.centerLon)>.16||Math.abs(alat-core.centerLat)>.16) continue;
    geographic.push(alon,alat,blon,blat,length);
  }
  const supported = (lon: number, lat: number) => {
    if(lon<bounds.west||lon>bounds.east||lat<bounds.south||lat>bounds.north||!city.land.some(polygon=>inside(lon,lat,polygon))) return false;
    // ETOPO is too coarse for local rivers: artistic land envelopes carry those.
    if(options.elevation?.length===1440*720){const x=Math.max(0,Math.min(1439,Math.floor((lon+180)*4))),y=Math.max(0,Math.min(719,Math.floor((90-lat)*4)));if(options.elevation[y*1440+x]<-150)return false;}
    return true;
  };
  const segmentSupported = (alon:number,alat:number,blon:number,blat:number) => {
    const metres=Math.hypot((blon-alon)*Math.cos(core.centerLat*R),blat-alat)*111195;
    const samples=Math.max(2,Math.ceil(metres/75));
    for(let k=0;k<=samples;k++){const t=k/samples;if(!supported(alon+(blon-alon)*t,alat+(blat-alat)*t))return false;}
    return true;
  };
  const middleStars:number[]=[],middleLines:number[]=[],stars:number[]=[],lines:number[]=[];
  const count=geographic.length/5,seed=260928+Object.keys(cities).indexOf(cityId)*719;
  const middleBudget=Math.floor(budget*.56), farBudget=budget-middleBudget;
  const routePoints=[0,0,0],coreMetres=Math.min(core.halfLatitude,core.halfLongitude*Math.cos(core.centerLat*R))*111195;
  const distance = (lon:number,lat:number) => Math.hypot((lon-core.centerLon)/core.halfLongitude,(lat-core.centerLat)/core.halfLatitude);
  // Retain a sparse peripheral skeleton at its actual position, then continue
  // selected outward tangents. Short connected pieces cross the core feather;
  // they do not repeat a rectangular tile or invent a new mapped-road dataset.
  const appendRoute = (alon:number,alat:number,blon:number,blat:number,n:number,importance:number) => {
    const metres=Math.hypot((blon-alon)*Math.cos(core.centerLat*R),blat-alat)*111195;
    const samples=Math.max(2,Math.min(32,Math.ceil(metres/36)));
    for(let k=0;k<samples&&middleStars.length/6<middleBudget;k++) {
      const t=(k+.25+random(n+k+41)*.5)/samples,lon=alon+(blon-alon)*t,lat=alat+(blat-alat)*t;
      const weight=continuationBandWeight(cityId,'intermediate',lon,lat);
      if(!supported(lon,lat)||weight<.008)continue;
      sphere(lon,lat,middleStars,1.000019);
      middleStars.push((.14+importance*.085)*weight*(.75+random(n+k+51)*.45),.62+random(n+k+61)*.38,random(n+k+71)*Math.PI*2);
    }
    // Filaments are selected more aggressively than point light, and their
    // endpoint colours use exactly the same spatial fade in the owning view.
    if(middleLines.length/6<2400&&random(n+83)<.38&&segmentSupported(alon,alat,blon,blat)) {
      sphere(alon,alat,middleLines,1.000013);sphere(blon,blat,middleLines,1.000013);
    }
  };
  for(let attempt=0;count&&middleStars.length/6<middleBudget&&attempt<budget*16;attempt++) {
    const n=seed+attempt*113,route=Math.floor(random(n)*count)*5,strategy=attempt%3;
    if(attempt<budget*8&&((strategy===0&&routePoints[0]>=middleBudget*.28)||(strategy===1&&routePoints[1]>=middleBudget*.32)))continue;
    let alon=geographic[route],alat=geographic[route+1],blon=geographic[route+2],blat=geographic[route+3];
    const length=geographic[route+4],importance=Math.min(1,length/200);
    if(strategy===0) {
      // Real positions across the broad overlap retain the centre's grammar.
      if(distance((alon+blon)/2,(alat+blat)/2)<.46)continue;
    } else if(strategy===1) {
      // Start on a real peripheral endpoint and continue its outward tangent.
      if(distance(alon,alat)>distance(blon,blat)){[alon,blon]=[blon,alon];[alat,blat]=[blat,alat];}
      const d=distance(blon,blat);if(d<.6||d>1.65||length<20)continue;
      const dx=blon-alon,dy=blat-alat,scale=Math.min(100,coreMetres*(.12+random(n+2)*.32)/length);
      alon=blon;alat=blat;blon+=dx*scale;blat+=dy*scale;
      if(distance(blon,blat)<d+.025)continue;
    } else {
      // Longer, selected continuations lose branch detail before the far field.
      // Every segment starts on its real peripheral road: never clone a grid.
      if(distance(alon,alat)>distance(blon,blat)){[alon,blon]=[blon,alon];[alat,blat]=[blat,alat];}
      const d=distance(blon,blat);if(d<.55||d>1.7||length<25)continue;
      const dx=blon-alon,dy=blat-alat,scale=Math.min(240,coreMetres*(.5+random(n+3)*1.35)/length);
      alon=blon;alat=blat;blon+=dx*scale;blat+=dy*scale;
      if(distance(blon,blat)<d+.12)continue;
    }
    if(!supported((alon+blon)/2,(alat+blat)/2))continue;
    const before=middleStars.length/6;
    appendRoute(alon,alat,blon,blat,n,importance);
    routePoints[strategy]+=middleStars.length/6-before;
  }
  // Band C loses road-level detail. Irregular hub-centred density creates a
  // wider constellation with no copied source footprint and no geometric edge.
  for(let attempt=0;count&&stars.length/6<farBudget&&attempt<budget*24;attempt++) {
    const n=seed+attempt*127,hub=city.hubs[attempt%city.hubs.length];
    const angle=random(n)*Math.PI*2,radius=Math.sqrt(random(n+1));
    const lon=hub[0]+Math.cos(angle)*radius*core.halfLongitude*1.08;
    const lat=hub[1]+Math.sin(angle)*radius*core.halfLatitude*.91;
    const weight=continuationBandWeight(cityId,'far',lon,lat);
    if(!supported(lon,lat)||weight<.009||random(n+2)>.32+.68*weight)continue;
    sphere(lon,lat,stars,1.000019);
    stars.push((.045+random(n+3)*.078)*weight,.43+random(n+4)*.48,random(n+5)*Math.PI*2);
    // Very sparse short fragments suggest structure without a far-field grid.
    if(lines.length/6<48&&random(n+6)<.012) {
      const route=Math.floor(random(n+7)*count)*5;
      const dx=(geographic[route+2]-geographic[route])*.55,dy=(geographic[route+3]-geographic[route+1])*.55;
      if(segmentSupported(lon,lat,lon+dx,lat+dy)){sphere(lon,lat,lines,1.000013);sphere(lon+dx,lat+dy,lines,1.000013);}
    }
  }
  const result:CityContinuation={stars:new Float32Array(stars),lines:new Float32Array(lines),intermediate:{stars:new Float32Array(middleStars),lines:new Float32Array(middleLines)},bounds:{...bounds},core:{...core},feather:{start:.46,end:.96},interpretation:'Mapped core detail gives way to a selected peripheral skeleton, interpretive road continuation and a sparse procedural constellation. Outside-core filaments are not mapped roads, live traffic or observed people.'};
  if(!entries){entries=[];cache.set(roadPositions,entries);}entries.push({key,elevation:options.elevation,result});return result;
}
