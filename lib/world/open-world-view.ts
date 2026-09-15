import * as THREE from 'three';
import { getOpenCatalogue } from './place-resolver';
import { degrees, distanceKm, wrapLongitude, type OpenWorldContext, type ResolvedWorldTarget, type SourcePlace } from './open-types';
import { LocalWindowCache, needsRecenter, type RoadWindow } from './local-window';
import type { ScaleTier } from './commands';
import { RegionalCoast } from './regional-coast';
import { reliefRadius } from '../terra/spatial';

type Cloud={points:THREE.Points;material:THREE.ShaderMaterial;count:number};
type Batch={stars:Cloud;lines:THREE.LineSegments};
type Factory={cloud:(data:Float32Array,tint:string)=>Cloud;terrain:(data:Float32Array,kind:number)=>Cloud;replaceLines:(batch:Batch,data:Float32Array)=>void;lines:(data:Float32Array,color:string)=>THREE.LineSegments;remove:(batch:Batch)=>void;elevation:(lon:number,lat:number)=>number;wake:()=>void;notify:(context:OpenWorldContext|null)=>void};
const ease=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function random(n:number){let x=Math.imul(n^(n>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return ((x^(x>>>15))>>>0)/4294967296;}
function sphere(lon:number,lat:number,out:number[],radius=1.00002){const a=lon*degrees,b=lat*degrees;out.push(radius*Math.cos(b)*Math.sin(a),radius*Math.sin(b),radius*Math.cos(b)*Math.cos(a));}
function hide(batch:Batch){batch.stars.material.uniforms.opacity.value=0;(batch.lines.material as THREE.LineBasicMaterial).opacity=0;batch.lines.visible=false;}
function expose(batch:Batch|undefined,alpha:number,lines:number,size=1){if(!batch)return;batch.stars.material.uniforms.opacity.value=alpha;batch.stars.material.uniforms.sizeScale.value=size;batch.lines.visible=lines>.001;(batch.lines.material as THREE.LineBasicMaterial).opacity=lines;}

/** The engine still owns camera, clocks, materials, Genesis and input. This
 * adapter prepares bounded generic context and disposes every replaced batch. */
export function createOpenWorldView(factory:Factory) {
  const cache=new LocalWindowCache(),coastCache=new RegionalCoast();
  const regionCache=new Map<string,{stars:Float32Array;nearby:SourcePlace[]}>();
  const cityCache=new Map<string,Float32Array>();
  let target:ResolvedWorldTarget|null=null,context:OpenWorldContext|null=null;
  let region:Batch|undefined,metro:Batch|undefined,major:Batch|undefined,local:Batch|undefined,previous:Batch|undefined,terrainLand:Batch|undefined,terrainSea:Batch|undefined;
  let targetRequest=new AbortController(),windowRequest:AbortController|null=null,window:RoadWindow|undefined;
  let tier:ScaleTier='planet',pending=false,recenters=0,disposedWindows=0,fadeStart=0,revision=0,lastNotice=0;
  let majorTier:ScaleTier|null=null,majorRequest:AbortController|null=null;
  let regionalFocus:{lat:number;lon:number}|undefined,regionGeneration=0,regionRecenters=0,regionRequest:AbortController|null=null,allPlaces:SourcePlace[]=[];
  const all=()=>[region,metro,major,local,previous,terrainLand,terrainSea].filter(Boolean) as Batch[];
  function drop(batch:Batch|undefined){if(batch){factory.remove(batch);disposedWindows++;}}
  function notify(){if(!context)return;Object.assign(context,{cacheSize:cache.size,requests:cache.requests,failures:cache.failures,recenterCount:recenters,disposedWindows});factory.notify({...context});factory.wake();}
  function batch(stars:Float32Array,lines:Float32Array=new Float32Array(0),color='#d5c5a5'):Batch {const b={stars:factory.cloud(stars,color),lines:factory.lines(lines,'#bba785')};hide(b);return b;}
  function data(window:RoadWindow,pointBudget:number,segmentBudget:number):{stars:Float32Array;lines:Float32Array} {
    const stars:number[]=[],lines:number[]=[];
    const rows=window.tiles.flatMap(t=>Array.from({length:t.segments},(_,i)=>({a:t.coordinates,i:i*5})));
    // Stable hash ordering distributes budgets across roads instead of cutting a rectangle.
    rows.sort((a,b)=>random(Math.round(a.a[a.i]*1e5)+Math.round(a.a[a.i+1]*1e5))-random(Math.round(b.a[b.i]*1e5)+Math.round(b.a[b.i+1]*1e5)));
    for(const {a,i} of rows){
      const alon=a[i],alat=a[i+1],blon=a[i+2],blat=a[i+3],importance=a[i+4];
      const d=distanceKm(window,{lon:(alon+blon)/2,lat:(alat+blat)/2}),weight=1-ease(window.radiusKm*.55,window.radiusKm,d);
      if(weight<.01)continue;
      if(lines.length/6<segmentBudget){sphere(alon,alat,lines);sphere(blon,blat,lines);}
      const length=distanceKm({lon:alon,lat:alat},{lon:blon,lat:blat});
      const count=Math.min(36,Math.max(1,Math.ceil(length/(window.z===14?.045:.6))));
      for(let k=0;k<count&&stars.length/6<pointBudget;k++){const t=(k+.5)/count;sphere(alon+(blon-alon)*t,alat+(blat-alat)*t,stars,1.000024);stars.push((.28+importance*.28)*weight,.75+importance*.45,random(i+k)*Math.PI*2);}
    }
    return {stars:new Float32Array(stars),lines:new Float32Array(lines)};
  }
  function featherLines(b:Batch,w:RoadWindow){const positions=b.lines.geometry.getAttribute('position'),colors=new Float32Array(positions.count*3);for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);const d=distanceKm(w,{lon:Math.atan2(x,z)/degrees,lat:Math.atan2(y,Math.hypot(x,z))/degrees}),v=1-ease(w.radiusKm*.55,w.radiusKm,d);colors.set([v,v,v],i*3);}b.lines.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));(b.lines.material as THREE.LineBasicMaterial).vertexColors=true;}
  async function prepareLocal(lat:number,lon:number,first=false) {
    if(!target||target.mode!=='open'||pending)return;
    const current=revision;windowRequest?.abort();windowRequest=new AbortController();
    const signal=AbortSignal.any([targetRequest.signal,windowRequest.signal]);pending=true;
    if(context){context.detailLoading=true;notify();}
    try{
      const next=await cache.prepare(lat,lon,14,signal);if(current!==revision||signal.aborted)return;
      const result=data(next,18000,14000);
      if(result.stars.length){
        drop(previous);previous=local;local=batch(result.stars,result.lines);featherLines(local,next);window=next;fadeStart=performance.now();if(!first)recenters++;
        if(context){context.detailState=next.failures?'SIMPLIFIED':'DETAILED';context.detailMessage=next.failures?'Some local roads are unavailable; showing sourced partial coverage.':'Source-backed roads · interpretive surrounding light.';}
      }else{
        window=next;
        if(context){context.detailState=major?.stars.count?'SIMPLIFIED':'INTERPRETIVE';context.detailMessage='Local roads are unavailable here. Broader city and regional context remain available.';}
      }
    }catch{ /* Aborted work never changes the current target. */ }
    finally{if(current===revision){pending=false;if(context)context.detailLoading=false;notify();}}
  }
  async function prepareMajor(nextTier:ScaleTier,focus=target,force=false) {
    if(!target||!focus||majorTier===nextTier&&!force)return;majorTier=nextTier;majorRequest?.abort();majorRequest=new AbortController();
    const current=revision,signal=AbortSignal.any([targetRequest.signal,majorRequest.signal]);
    const z=nextTier==='region'?(target.contextRadiusKm>600?6:8):target.cityRadiusKm>30?10:11;
    try{const w=await cache.prepare(focus.lat,focus.lon,z,signal);if(current!==revision||signal.aborted)return;const result=data(w,6000,7000);drop(major);major=batch(result.stars,result.lines);featherLines(major,w);if(context&&context.detailState==='INTERPRETIVE'&&result.stars.length){context.detailState='SIMPLIFIED';context.detailMessage='Source-backed major roads · interpretive surrounding light.';}notify();}catch{ /* Source detail is optional. */ }
  }
  function prepareRegion(next:ResolvedWorldTarget,places:SourcePlace[]) {
    drop(region);drop(terrainLand);drop(terrainSea);regionalFocus={lat:next.lat,lon:next.lon};
    const current=revision,generation=++regionGeneration,key=`${next.id}:${next.lat.toFixed(1)}:${next.lon.toFixed(1)}`;
    regionRequest?.abort();regionRequest=new AbortController();const signal=AbortSignal.any([targetRequest.signal,regionRequest.signal]);
    let prepared=regionCache.get(key);if(prepared){regionCache.delete(key);regionCache.set(key,prepared);}
    if(!prepared){
      const nearby=places.filter(p=>(p.kind==='city'||p.kind==='settlement')&&distanceKm(next,p)<=next.contextRadiusKm*1.2).sort((a,b)=>distanceKm(next,a)-distanceKm(next,b)).slice(0,100);
      const stars:number[]=[];for(const p of nearby){sphere(p.lon,p.lat,stars,1.00014);stars.push(.35+Math.min(.9,Math.log10(Math.max(1000,p.population))*.11),1+Math.min(2,p.population/3000000),random(p.lat*1e6)*6.28);}
      prepared={stars:new Float32Array(stars),nearby};regionCache.set(key,prepared);while(regionCache.size>3)regionCache.delete(regionCache.keys().next().value!);
    }
    region=batch(prepared.stars,new Float32Array(0),'#efdaad');
    const ground:number[]=[],sea:number[]=[],coast:number[]=[],radius=next.contextRadiusKm*1.5;
    for(let i=0;i<20000;i++){
      const angle=random(i*13+11)*Math.PI*2,r=Math.sqrt(random(i*13+12))*radius;
      const lat=next.lat+Math.sin(angle)*r/111.195,lon=wrapLongitude(next.lon+Math.cos(angle)*r/(111.195*Math.max(.15,Math.cos(lat*degrees))));
      const h=factory.elevation(lon,lat);if(!Number.isFinite(h)||Math.abs(lat)>85)continue;
      const values=h>=0?ground:sea,weight=1-ease(radius*.64,radius,r);
      sphere(lon,lat,values,reliefRadius(h));values.push((h>=0?.24:.20)*weight,.60+random(i*13+13)*.55,random(i*13+14)*6.28);
    }
    terrainLand={stars:factory.terrain(new Float32Array(ground),1),lines:factory.lines(new Float32Array(coast),'#a1b6b9')};
    terrainSea={stars:factory.terrain(new Float32Array(sea),2),lines:factory.lines(new Float32Array(0),'#7794a8')};hide(terrainLand);hide(terrainSea);
    const groundBatch=terrainLand;void coastCache.prepare(next,signal).then(lines=>{if(!signal.aborted&&current===revision&&generation===regionGeneration){factory.replaceLines(groundBatch,lines);factory.wake();}}).catch(()=>{});
    if(context)context.nearby=prepared.nearby.filter(p=>p.id!==next.id).slice(0,8).map(p=>({id:p.id,label:p.label,lat:p.lat,lon:p.lon,distanceKm:Math.round(distanceKm(next,p))}));
    return prepared;
  }
  async function setTarget(next:ResolvedWorldTarget|null) {
    revision++;regionRequest?.abort();regionalFocus=undefined;regionRecenters=0;targetRequest.abort();windowRequest?.abort();majorRequest?.abort();targetRequest=new AbortController();pending=false;majorTier=null;
    all().forEach(drop);region=metro=major=local=previous=terrainLand=terrainSea=undefined;window=undefined;target=next;context=null;recenters=0;factory.notify(null);
    if(!next||next.mode!=='open')return;
    const current=revision,signal=targetRequest.signal;
    context={target:next,detailState:'INTERPRETIVE',detailLoading:false,detailMessage:'Sourced geography · interpretive urban light.',nearby:[],radiusKm:next.contextRadiusKm,recenterCount:0,cacheSize:cache.size,disposedWindows,requests:cache.requests,failures:cache.failures,ocean:factory.elevation(next.lon,next.lat)<0?1:.15,urban:Math.min(1,Math.log10(Math.max(1000,next.population))/7)};notify();
    let places:SourcePlace[]=[];try{places=await getOpenCatalogue(signal);}catch{if(signal.aborted)return;}
    if(current!==revision||signal.aborted)return;
    allPlaces=places;const prepared=prepareRegion(next,places);
    let city=cityCache.get(next.id);if(city){cityCache.delete(next.id);cityCache.set(next.id,city);}
    if(!city){
      const stars:number[]=[],hubs=[next,...prepared.nearby.filter(p=>distanceKm(next,p)<next.cityRadiusKm*1.4)].slice(0,12),budget=10000;
      // A circular, seeded density field, explicitly INTERPRETIVE. There are no
      // generated filaments, roads, blocks or buildings in this band.
      for(let i=0;i<budget*5&&stars.length/6<budget;i++){
        const n=i*17+Math.round((next.lon+180)*1000),hub=hubs[i%hubs.length],angle=random(n)*Math.PI*2,r=Math.sqrt(random(n+1))*next.cityRadiusKm;
        const lat=hub.lat+Math.sin(angle)*r/111.195,lon=wrapLongitude(hub.lon+Math.cos(angle)*r/(111.195*Math.max(.15,Math.cos(lat*degrees))));
        if(factory.elevation(lon,lat)<-20)continue;
        const d=distanceKm(next,{lat,lon}),fade=1-ease(next.cityRadiusKm*.52,next.cityRadiusKm*1.45,d);
        if(fade<.01)continue;sphere(lon,lat,stars,1.000016);stars.push((.035+.10*random(n+2))*fade*(1-r/next.cityRadiusKm*.72),.55+random(n+3)*.65,random(n+4)*6.28);
      }
      city=new Float32Array(stars);cityCache.set(next.id,city);while(cityCache.size>2)cityCache.delete(cityCache.keys().next().value!);
    }
    metro=batch(city);notify();
    if(tier!=='planet')void prepareMajor(tier==='region'?'region':'city');
    if(tier==='city'||tier==='street')void prepareLocal(next.lat,next.lon,true);
  }
  function setTier(next:ScaleTier){tier=next;if(next==='planet'){windowRequest?.abort();majorRequest?.abort();majorTier=null;all().forEach(hide);return;}if(target?.mode!=='open')return;if(next==='region')windowRequest?.abort();void prepareMajor(next==='region'?'region':'city');if((next==='city'||next==='street')&&!window)void prepareLocal(target.lat,target.lon,true);}
  function update(lat:number,lon:number,alt:number,now:number,visible:boolean,motion:boolean,urban:boolean,nightFocus=0) {
    if(!target||!context)return;
    if(!visible||tier==='planet'){all().forEach(hide);return;}
    if(tier==='region'&&regionalFocus&&distanceKm(regionalFocus,{lat,lon})>target.contextRadiusKm*.55){const focus={...target,lat,lon};prepareRegion(focus,allPlaces);regionRecenters++;void prepareMajor('region',focus,true);notify();}
    if((tier==='street'||tier==='city')&&!pending&&(!window||needsRecenter(window,lat,lon)))void prepareLocal(lat,lon,!window);
    const fade=motion?ease(0,850,now-fadeStart):1;
    expose(region,tier==='region'?1.7:.16,0,tier==='region'?1.15:.6);
    expose(terrainLand,tier==='region'?2.4:0,tier==='region'?.18:0,1);
    expose(terrainSea,tier==='region'?1.8:0,0,.85);
    expose(metro,urban?(tier==='region'?.32:tier==='city'?2.8:1.3):0,0,tier==='city'?1.12:.85);
    expose(major,urban?(tier==='region'?.65:1.45):0,urban?(tier==='region'?.09:.14):0,.8);
    const localExposure=urban?(tier==='street'?1.7:tier==='city'?.035:0):0;
    expose(local,localExposure*fade,localExposure*.14*fade,.9);
    expose(previous,localExposure*(1-fade),localExposure*.14*(1-fade),.9);
    // The NASA lens must not mix its light pattern with population-weighted
    // settlement markers or the interpretive metropolitan field.
    for(const b of [region,metro,major,local,previous])if(b){b.stars.material.uniforms.opacity.value*=1-nightFocus;(b.lines.material as THREE.LineBasicMaterial).opacity*=1-nightFocus;}
    for(const b of [terrainLand,terrainSea])if(b){b.stars.material.uniforms.opacity.value*=1-nightFocus*.78;(b.lines.material as THREE.LineBasicMaterial).opacity*=1-nightFocus;}
    if(previous&&fade===1){drop(previous);previous=undefined;notify();}
    if(now-lastNotice>1000){lastNotice=now;notify();}
  }
  function dispose(){revision++;regionRequest?.abort();targetRequest.abort();windowRequest?.abort();majorRequest?.abort();all().forEach(drop);region=metro=major=local=previous=terrainLand=terrainSea=undefined;cache.clear();coastCache.clear();regionCache.clear();cityCache.clear();target=null;context=null;}
  return {setTarget,setTier,update,dispose,getContext:()=>context,diagnostics:()=>({cacheSize:cache.size,cacheBytes:cache.byteLength,requests:cache.requests,failures:cache.failures,evictions:cache.evictions,recenters,regionRecenters,disposedWindows,regionCache:regionCache.size,coastCache:coastCache.size,cityCache:cityCache.size,gpuBatches:all().length,pending})};
}
