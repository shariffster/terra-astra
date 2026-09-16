import * as THREE from 'three';
import { resolvePlace, resolverDiagnostics } from '../world/place-resolver';
import { cameraAltitude, type ResolvedWorldTarget, type OpenWorldContext } from '../world/open-types';
import { createOpenWorldView } from '../world/open-world-view';
import { HELD_KEYS, navigationVector, editableTarget } from './held-navigation';
import type { AudioWorldState } from '../audio/world-state';
import { SPECIAL_CITIES } from '../world/special-destinations';
import { specialDestinationViews } from '../world/special-destination-view';
import { aircraftSignals, aircraftCorridors, satelliteSignals, shipSignals, sampleSignal, signalProgress, signalColors, type WorldSignal } from '../world/signals';
import { flightPathId, prepareFlightPaths, liftFlight, flightRadius } from '../world/flight-paths';
import { ActivityTransitions, activitySeed, smoothUnit } from './activity-transitions';
import { createCityContinuation, continuationBandWeight, continuationScale } from '../world/city-continuation';
import { cablePaths, cableColor, CABLE_SEGMENTS_PER_PATH, CABLE_PULSE_SLOTS, cableJourney, cableHubs } from '../world/cables';
import { prepareSmoothCables, sampleSmoothCable, marineStrands } from '../world/smooth-cables';
import { cableFilamentGeometry, cableFilamentVertex, cableFilamentFragment } from './cable-filaments';
import { seaLanePaths, seaLaneColor } from '../world/sea-lanes';
import { createOceanVolume, sampleSuspended, currentPaths, CURRENT_PARTICLES, sampleCurrent, oceanExposure } from '../world/ocean-volume';
import { LIVING_MATERIAL, livingExposure, networkRadius } from './living-material';
import { createUrbanActivity, type UrbanActivity } from '../world/urban-activity';
import { GENESIS_DURATION, genesisGLSL, genesisSeed, genesisLight, genesisState } from './genesis';
import { AwakeningTimeline, AWAKENING, awakeningOrder, signalOnset, signalReveal, cableOnsets, cableReveal } from './awakening';
import { WORLD_TARGETS, DEFAULT_PRESENTATION, validateWorldCommand, type WorldPresentation, type GenesisState, type WorldState, type WorldCommand, type WorldCommandResult, type ScaleTier, type WorldLayer } from '../world/commands';
import { stories, type Story } from './stories';
import { CanvasStarRenderer } from './canvas-renderer';
import { cityFeather, flightProgress, lightLevels, revealProgress, memoryLight, cityScreenBudget, recallFocus } from './choreography';
import { scintillationGLSL } from './scintillation';
import type { PersonalPlaces, TransformationState } from './personal-contract';
import { openingFrame, transformationEase, transformationGLSL } from './transformation';
import { personalAstra, personalArc, personalCamera, personalGeography } from './personal-rendering';
import { TERRAIN, terrainTuning, terrainVertexGLSL } from './terrain-material';
import { reliefRadius, sampleElevation, spatialBlend, spatialVertexGLSL, studyRegions, type EarthView, type StudyRegion } from './spatial';
export type Stage = 'orbit'|'descending'|'city'|'ascending';
import { DEFAULT_LIGHT, type LightOptions } from './composition';
export type ViewOptions = LightOptions;
export type Engine = { audioState:()=>AudioWorldState; replayGenesis:()=>void; skipGenesis:()=>void; command:(command:WorldCommand)=>Promise<WorldCommandResult>; worldState:()=>WorldState; transform:(open:boolean)=>void; personal:(places:PersonalPlaces|null)=>void; descend:()=>Promise<void>; orbit:()=>void; zoom:(factor:number)=>void; rotate:(dx:number,dy:number)=>void; select:(id:string|null)=>void; configure:(o:ViewOptions)=>void; storyInset:(pixels:number)=>void; compositionPanel:(open:boolean)=>void; narrativePanel:(visible:boolean)=>void; compareLight:(light:ViewOptions|null)=>void; view:(view:EarthView)=>void; region:(region:StudyRegion)=>void; dispose:()=>void };
type Callbacks={discovery?:(ready:boolean)=>void;genesis?:(state:GenesisState)=>void;worldState?:(state:WorldState)=>void;transformation?:(state:TransformationState)=>void;personalSettled?:()=>void;stage:(s:Stage)=>void;ready:()=>void;error:(s:string,fatal?:boolean)=>void;coordinates:(lat:number,lon:number)=>void;interact:()=>void;arrival:(storyId:string|null)=>void;view?:(view:EarthView)=>void};
type Cloud={points:THREE.Points|THREE.Mesh;material:THREE.ShaderMaterial;count:number};
const R=Math.PI/180;
export function geo(lon:number,lat:number,r=1){const a=lon*R,b=lat*R;return new THREE.Vector3(r*Math.cos(b)*Math.sin(a),r*Math.sin(b),r*Math.cos(b)*Math.cos(a));}
const clamp=THREE.MathUtils.clamp;
const wrap=(x:number)=>((x+180)%360+360)%360-180;
const vertex=`attribute float brightness;attribute float starSize;attribute float phase;attribute float revealAt;
uniform float time;uniform float motion;uniform float pixelRatio;uniform float zoomFactor;uniform float sizeScale;uniform float reveal;uniform float sparkle;uniform float signature;uniform float shell;
uniform float regional;uniform float regionMix;uniform vec3 regionFocus;uniform float regionOuter;uniform float regionInner;
varying float vB;varying float vG;varying float vP;
${scintillationGLSL}
${transformationGLSL}
${terrainVertexGLSL}
${spatialVertexGLSL}
${genesisGLSL}
float shellVisibility(vec3 world){if(shell<.5)return 1.0;if(shell>1.5)return smoothstep(-.02,.08,dot(normalize(world),normalize(cameraPosition-world)));vec3 ray=normalize(world-cameraPosition);float b=dot(cameraPosition,ray),d=b*b-dot(cameraPosition,cameraPosition)+1.0;if(d<=0.0)return 1.0;float hit=-b-sqrt(d);return hit>0.0&&hit<distance(world,cameraPosition)-.001?0.0:1.0;}
void main(){vec3 world=genesisPosition(openedPosition(spatialPosition(position)));vec2 terrain=terrainLight(position);vec4 p=modelViewMatrix*vec4(world,1.0);gl_Position=projectionMatrix*p;vec3 light=scintillate(time,phase,motion,sparkle,signature);vB=mix(brightness,max(brightness,.24),vMarine)*light.x*terrain.x*shellVisibility(world)*smoothstep(revealAt,revealAt+.18,reveal)*mix(spatialVisibility(world),1.0,genesisEnabled*(1.0-genRamp(.78,1.0,genesis)))*mix(1.0,genesisExposure,genesisEnabled);vG=light.y;vP=phase;vB*=mix(1.0,.12+.88*smoothstep(regionOuter,regionInner,dot(normalize(world),regionFocus)),regional*regionMix);gl_PointSize=clamp(starSize*pixelRatio*4.1*zoomFactor*sizeScale*light.z*terrain.y*mix(1.0,genesisSize,genesisEnabled)*mix(1.0,clamp(cameraDistance/max(.01,-p.z),.55,2.6),max(spatial*depthMix,opening)),.75*pixelRatio,40.0*pixelRatio);}`;
const fragment=`uniform vec3 tint;uniform float opacity;uniform float glow;uniform float soft;varying float vB;varying float vG;varying float vP;
void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;float core=exp(-r*r*205.0);float halo=exp(-r*r*24.0)*.27*glow;float ray=exp(-abs(p.x)*120.0)*exp(-abs(p.y)*12.0)+exp(-abs(p.y)*120.0)*exp(-abs(p.x)*12.0);float flare=ray*(.035*step(.96,fract(vP*13.37))+.42*vG);float a=mix(core+halo+flare,exp(-r*r*14.0)*.18*glow,soft)*vB*opacity;vec3 color=mix(tint,vec3(1.0),core*.38+min(vG,.8)*.2);gl_FragColor=vec4(color,a);}`;
export async function createEarth(host:HTMLDivElement,markers:HTMLDivElement,callbacks:Callbacks,signal:AbortSignal):Promise<Engine>{
 let renderer:THREE.WebGLRenderer|CanvasStarRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});}catch{renderer=new CanvasStarRenderer();}
 const fallback=renderer instanceof CanvasStarRenderer;host.dataset.renderer=fallback?'canvas':'webgl';
 renderer.setClearColor(0x03070b);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const pixelRatio=Math.min(window.devicePixelRatio||1,window.innerWidth<700?1.35:1.7);renderer.setPixelRatio(pixelRatio);
 renderer.domElement.setAttribute('aria-label','Focus Earth: WASD pans, Q and E orbit, R and F zoom, T and G tilt. Keys 1 through 4 change scale; 0 resets. Arrow keys and drag also rotate.');renderer.domElement.tabIndex=0;renderer.domElement.style.touchAction='none';host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(42,1,.000001,100);const earth=new THREE.Group();scene.add(earth);
 const geometries:THREE.BufferGeometry[]=[];const materials:THREE.Material[]=[];const clouds:Cloud[]=[];
 const homeAltitude=()=>{const w=host.clientWidth,h=host.clientHeight,r=Math.min(w*(w<700?.44:.30),h*.38);return Math.max(2.15,Math.sqrt(1+Math.pow(h/(2*Math.tan(21*R)*r),2))-1);};
 const heldKeys=new Set<string>();
 let disposed=false,raf=0,stage:Stage='orbit',lat=19,lon=95,alt=homeAltitude(),targetLat=lat,targetLon=lon,targetAlt=alt,selected:Story|null=null,remembered:Story|null=null;
 let remembering=false,settledAt:number|null=null,arrivalSent=false,stillFrames=0,graphicsLost=false;
 let terrain=terrainTuning(3,0,0);
 let viewMode:EarthView='globe',region:StudyRegion='indonesia',tilt=0,targetTilt=0,cut=0,depth=1;
 let genesisProgress=matchMedia('(prefers-reduced-motion: reduce)').matches?1:0,genesisStarted=0,lastGenesis=-Infinity,particleOffset=0;
 const awakening=new AwakeningTimeline();let discoveryReady=false;
 function notifyAwakening(){if(discoveryReady!==awakening.discovery){discoveryReady=awakening.discovery;callbacks.discovery?.(discoveryReady);}host.dataset.awakening=awakening.state;host.dataset.awakeningSeconds=awakening.elapsed.toFixed(3);host.dataset.idleDegreesPerSecond=awakening.idleRate.toFixed(3);}
 let activeOpenTarget:ResolvedWorldTarget|undefined,openContext:OpenWorldContext|undefined;let resolverRequest:AbortController|null=null,resolving=false,lookupSequence=0;
 let loadingDetail=false;let targetId:string|null=null,scaleTier:ScaleTier='planet';const layerFlags:Record<WorldLayer,boolean>={satellites:true,aircraft:true,ships:true,cables:true,urban:true};
 let presentation:WorldPresentation={...DEFAULT_PRESENTATION},layerClock=0,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const focusTransition=new ActivityTransitions(['thematic-focus'],'focus',false);
 const populationFocus=new ActivityTransitions(['population'],'focus',false),footprintFocus=new ActivityTransitions(['footprint'],'focus',false),connectionsFocus=new ActivityTransitions(['connections'],'focus',false);
 const idleWaiters:Array<(active:boolean)=>void>=[];let commandChain:Promise<unknown>=Promise.resolve(),commandSequence=0,journeyEpoch=0;let warmupTimer:ReturnType<typeof setTimeout>|null=null,warmupScheduled=false;
 let openProgress=0,openTarget=false,lastTransformation=-Infinity,personalSettledAt:number|null=null,personalArrivalSent=false;
 const openFrame=new THREE.Matrix3();openingFrame(lon,lat,openFrame);
 let morph:{from:number;to:number;start:number;duration:number;prelude:number;fromLat:number;fromLon:number;toLat:number;toLon:number}|null=null;
 let personalPlaces:PersonalPlaces|null=null,personalCloud:Cloud|null=null,personalLines:THREE.LineSegments|null=null;
 let personalEarth:THREE.Vector3[]=[],personalStars:THREE.Vector3[]=[],personalLineEarth=new Float32Array(0),personalLineAstra=new Float32Array(0);
 const personalProjected=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 const openAltitude=()=>homeAltitude()*1.62;
 const cutNormal=geo(202,-5),cutFacing=geo(112,-5);let elevation=new Int16Array(0);
 let options:ViewOptions={...DEFAULT_LIGHT,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches};
 const displayedLight={...options};let configuredLight={...options},comparingLight=false;
 let flight:{start:number;duration:number;fromLat:number;fromLon:number;fromAlt:number;toLat:number;toLon:number;toAlt:number;end:Stage;anchorLat:number;anchorLon:number;viaPlanet?:boolean}|null=null;
 let cityReady=false,newYorkReady=false;let newYorkLoading:Promise<void>|null=null;let cityLoading:Promise<void>|null=null;let lastInteraction=0;let lastTime=performance.now(),time=0,lastCoordinate=0,frameCount=0,totalFrame=0,sampleFrames=0,diagnosticStart=performance.now(),diagnosticFrames=0;
 const setStage=(s:Stage)=>{stage=s;callbacks.stage(s);notifyWorld();};
 function geometry(positions:number[]|Float32Array){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometries.push(g);return g;}
 function cloud(data:Float32Array,tint:string,feather:boolean|((lon:number,lat:number)=>number)=false){const count=data.length/6;const p=new Float32Array(count*3),b=new Float32Array(count),s=new Float32Array(count),ph=new Float32Array(count);for(let i=0;i<count;i++){p.set(data.subarray(i*6,i*6+3),i*3);b[i]=data[i*6+3]*(feather?(typeof feather==='function'?feather:cityFeather)(Math.atan2(p[i*3],p[i*3+2])/R,Math.atan2(p[i*3+1],Math.hypot(p[i*3],p[i*3+2]))/R):1);s[i]=data[i*6+4];ph[i]=data[i*6+5];}
 const g=geometry(p);const ids=new Float32Array(count),seeds=new Float32Array(count*3);for(let i=0;i<count;i++){ids[i]=particleOffset+i+1;seeds.set([genesisSeed(ids[i],1),genesisSeed(ids[i],2),genesisSeed(ids[i],3)],i*3);}particleOffset+=count;g.setAttribute('particleId',new THREE.BufferAttribute(ids,1));g.setAttribute('genesisSeed',new THREE.BufferAttribute(seeds,3));g.setAttribute('brightness',new THREE.BufferAttribute(b,1));g.setAttribute('starSize',new THREE.BufferAttribute(s,1));g.setAttribute('phase',new THREE.BufferAttribute(ph,1));g.setAttribute('revealAt',new THREE.BufferAttribute(new Float32Array(count),1));
 const m=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{genesis:{value:1},genesisEnabled:{value:0},genesisExposure:{value:1},genesisSize:{value:1},tint:{value:new THREE.Color(tint)},opacity:{value:1},glow:{value:1},time:{value:0},motion:{value:1},pixelRatio:{value:renderer.getPixelRatio()},zoomFactor:{value:1},sizeScale:{value:1},reveal:{value:1},sparkle:{value:1},signature:{value:-1},shell:{value:0},opening:{value:0},openingFrame:{value:openFrame},personalStar:{value:0},terrainKind:{value:0},terrainLand:{value:1},terrainFloor:{value:1},terrainStudy:{value:0},terrainReady:{value:0},seaMotion:{value:0},spatial:{value:0},depthMix:{value:0},cutaway:{value:0},cutNormal:{value:cutNormal},cutFacing:{value:cutFacing},cameraDistance:{value:3},soft:{value:0},regional:{value:0},regionMix:{value:0},regionFocus:{value:new THREE.Vector3(0,0,1)},regionOuter:{value:.78},regionInner:{value:.975}},transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});Object.assign(m.defaultAttributeValues,{terrainData:[0,0,0,0]});materials.push(m);const points=new THREE.Points(g,m);points.frustumCulled=false;earth.add(points);const c={points,material:m,count};clouds.push(c);return c;}
 function lines(data:Float32Array|number[],color:string,feather:boolean|((lon:number,lat:number)=>number)=false){const m=new THREE.LineBasicMaterial({color,transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending});materials.push(m);const o=new THREE.LineSegments(geometry(data),m);o.frustumCulled=false;earth.add(o);if(feather){const a=o.geometry.getAttribute('position'),colors=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){const w=(typeof feather==='function'?feather:cityFeather)(Math.atan2(a.getX(i),a.getZ(i))/R,Math.atan2(a.getY(i),Math.hypot(a.getX(i),a.getZ(i)))/R);colors.set([w,w,w],i*3);}o.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));m.vertexColors=true;}return o;}
 async function load(name:string,requestSignal=signal){const res=await fetch('/data/'+name+'.bin',{signal:requestSignal});if(!res.ok)throw new Error('Could not load '+name);const b=await res.arrayBuffer();if(b.byteLength%4)throw new Error('Invalid geographic data');return new Float32Array(b);}
 function spatialCloud(data:Float32Array,tint:string){const c=cloud(data,tint);c.material.uniforms.spatial.value=1;c.points.userData.spatial=true;c.points.userData.sampleBudget=22000;c.points.userData.spatialExposure=1.8;return c;}
 // One-time slope attributes from the existing coarse grid. No per-frame terrain buffer uploads.
 function terrainCloud(c:Cloud,kind:number,gradients=false){
  c.material.uniforms.terrainKind.value=kind;c.points.userData.terrainKind=kind;
  if(!gradients)return;
  const p=c.points.geometry.getAttribute('position'),field=new Float32Array(p.count*4);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,y,z),lon=Math.atan2(x,z)/R,lat=Math.atan2(y,Math.hypot(x,z))/R;
   const h=sampleElevation(elevation,1440,720,lon,lat);
   const east=(reliefRadius(sampleElevation(elevation,1440,720,lon+.25,lat))-reliefRadius(sampleElevation(elevation,1440,720,lon-.25,lat)))/(.5*R*Math.max(.15,Math.cos(lat*R)));
   const north=(reliefRadius(sampleElevation(elevation,1440,720,lon,Math.min(89.9,lat+.25)))-reliefRadius(sampleElevation(elevation,1440,720,lon,Math.max(-89.9,lat-.25))))/(.5*R);
   const ex=Math.cos(lon*R),ez=-Math.sin(lon*R),nx=-Math.sin(lat*R)*Math.sin(lon*R),ny=Math.cos(lat*R),nz=-Math.sin(lat*R)*Math.cos(lon*R);
   // Cap exaggerated normals at steep faces to avoid sparkling sawtooth ridges.
   const e=clamp(east,-1.2,1.2),n=clamp(north,-1.2,1.2);
   const ax=x/r-e*ex-n*nx,ay=y/r-n*ny,az=z/r-e*ez-n*nz,len=Math.hypot(ax,ay,az);
   const metres=kind===2?-11000*Math.pow(Math.max(0,(1-r)/.070),1/.65):h;
   field.set([ax/len,ay/len,az/len,metres/11000],i*4);
  }
  c.points.geometry.setAttribute('terrainData',new THREE.BufferAttribute(field,4));
 }
 function lift(data:Float32Array){const out=data.slice();for(let i=0;i<out.length;i+=6){const v=new THREE.Vector3(out[i],out[i+1],out[i+2]);const h=sampleElevation(elevation,1440,720,Math.atan2(v.x,v.z)/R,Math.atan2(v.y,Math.hypot(v.x,v.z))/R);v.normalize().multiplyScalar(reliefRadius(Math.max(0,h))+.00004);out.set(v.toArray(),i);}return out;}
 const sphereG=new THREE.SphereGeometry(1,96,64);geometries.push(sphereG);const sphereM=new THREE.MeshBasicMaterial({color:0x020609});materials.push(sphereM);const sphere=new THREE.Mesh(sphereG,sphereM);earth.add(sphere);
 // A very restrained atmospheric edge; its surface fades away during descent.
 const edgeG=new THREE.SphereGeometry(1.001,80,48);geometries.push(edgeG);const edgeM=new THREE.ShaderMaterial({uniforms:{opacity:{value:1}},vertexShader:`varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 n;varying vec3 v;uniform float opacity;void main(){float f=pow(1.0-max(0.0,dot(normalize(n),normalize(v))),5.0);gl_FragColor=vec4(.20,.40,.51,f*.13*opacity);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});materials.push(edgeM);earth.add(new THREE.Mesh(edgeG,edgeM));
 // Three distant shells share the existing draw lifecycle. Tiny steady points
 // carry depth; occasional warmer stars remain quieter than terrestrial light.
 let seed=901;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const backgroundLayers:Cloud[]=[];
 for(const [count,radius,tint,brightness,size] of [[4200,48,'#c3ccd7',.48,.72],[150,42,'#d4c8ad',.62,.95],[70,36,'#bec9d8',.72,1.15]] as const){
  const data:number[]=[];for(let i=0;i<count;i++){const v=geo(random()*360-180,Math.asin(random()*2-1)/R,radius);data.push(...v.toArray(),brightness*(.45+random()*.55),size*(.55+random()*.45),random()*6.28);}
  const c=cloud(new Float32Array(data),tint);c.material.fragmentShader=`uniform vec3 tint;uniform float opacity;varying float vB;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float core=exp(-r*r*62.0),halo=exp(-r*r*16.0)*.045;gl_FragColor=vec4(tint,(core+halo)*vB*opacity);}`;earth.remove(c.points);scene.add(c.points);c.points.userData.backgroundDepth=radius;c.points.userData.shimmer=0;backgroundLayers.push(c);
 }
 host.dataset.distantStars='4420';
 let reliefLand:Cloud,reliefOcean:Cloud,body:Cloud,interior:Cloud,haze:Cloud,halo:Cloud;
 let populationField:Cloud|null=null,footprintField:Cloud|null=null;
 let land:Cloud,coast:Cloud,lights:Cloud,coastLines:THREE.LineSegments,borders:THREE.LineSegments;
 let cityStars:Cloud|null=null,cityCoast:Cloud|null=null,streetLines:THREE.LineSegments|null=null,regional:THREE.LineSegments|null=null;
 let storyCloud:Cloud|null=null;let memoryCloud:Cloud|null=null;let storyLines:THREE.LineSegments|null=null;
 let newYorkStars:Cloud|null=null,newYorkStreets:THREE.LineSegments|null=null;
 type UrbanView={model:UrbanActivity;traffic:Cloud;activity:Cloud;trafficXYZ:Float32Array;activityXYZ:Float32Array;feather:(lon:number,lat:number)=>number};
 const urbanViews=new Map<string,UrbanView>();const contextViews=new Map<string,{stars:Cloud;lines:THREE.LineSegments;intermediate:{stars:Cloud;lines:THREE.LineSegments}}>();
 let peopleCloud:Cloud|null=null;let storyStarted=0,focus=0,storyInset=0;
 const smoothCameraOffset=new THREE.Vector2();let compositionOpen=false,narrativeVisible=true;
 let previousHomeAltitude=homeAltitude();
 function resize(){stillFrames=0;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const nextHomeAltitude=homeAltitude();if(stage==='orbit'&&scaleTier==='planet'&&viewMode==='globe'&&!flight&&!morph){const scale=nextHomeAltitude/previousHomeAltitude;alt*=scale;targetAlt*=scale;}if(flight?.end==='orbit'&&scaleTier==='planet')flight.toAlt=nextHomeAltitude;previousHomeAltitude=nextHomeAltitude;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(selected&&storyInset)setStoryInset(storyInset);}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const openViews=createOpenWorldView({cloud,lines,replaceLines:(batch,data)=>{earth.remove(batch.lines);release(batch.lines.geometry,batch.lines.material as THREE.Material);batch.lines=lines(data,'#a1b6b9');},terrain:(data,kind)=>{const c=spatialCloud(data,kind===1?'#a3a6a0':'#658497');terrainCloud(c,kind,true);return c;},elevation:(x,y)=>sampleElevation(elevation,1440,720,x,y),wake:()=>{stillFrames=0;},notify:context=>{openContext=context??undefined;if(context&&scaleTier==='street'&&!context.detailLoading&&context.detailState!=='DETAILED'&&!context.detailMessage.startsWith('Source-backed')){scaleTier='city';targetAlt=cameraAltitude(activeOpenTarget?.cityRadiusKm??20,host.clientWidth,host.clientHeight);openViews.setTier('city');}notifyWorld();},remove:batch=>{for(const object of [batch.stars.points,batch.lines]){earth.remove(object);release(object.geometry,object.material as THREE.Material);}const i=clouds.indexOf(batch.stars);if(i>=0)clouds.splice(i,1);}});
 const destroy=()=>{if(disposed)return;disposed=true;resolverRequest?.abort();openViews?.dispose();awakening.dispose();if(warmupTimer!==null)clearTimeout(warmupTimer);for(const resolve of idleWaiters.splice(0))resolve(false);cancelAnimationFrame(raf);observer.disconnect();host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',up);host.removeEventListener('pointercancel',cancel);host.removeEventListener('wheel',wheel);renderer.domElement.removeEventListener('keydown',key);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clearHeld);renderer.domElement.removeEventListener('blur',clearHeld);heldKeys.clear();renderer.domElement.removeEventListener('webglcontextlost',contextLost);document.removeEventListener('visibilitychange',visibility);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();renderer.domElement.remove();};
 const contextLost=(e:Event)=>{e.preventDefault();heldKeys.clear();graphicsLost=true;resolverRequest?.abort();openViews.dispose();awakening.dispose();notifyAwakening();for(const resolve of idleWaiters.splice(0))resolve(false);notifyWorld();callbacks.error('Graphics became unavailable. Restart the journey to gather the stars again.',true);cancelAnimationFrame(raf);};renderer.domElement.addEventListener('webglcontextlost',contextLost);
 try{
 const humanAbort=new AbortController(),abortHuman=()=>humanAbort.abort();signal.addEventListener('abort',abortHuman,{once:true});
 const humanTimeout=setTimeout(abortHuman,6000);
 const humanRequest=Promise.all([load('human-population',humanAbort.signal),load('human-footprint',humanAbort.signal)]).then(fields=>{
  if(fields.some((data,index)=>data.length!==(index?72000:60000)*6||!data.every(Number.isFinite)))throw new Error('Invalid optional geographic field');return fields;
 }).catch(()=>{humanAbort.abort();return null;}).finally(()=>{clearTimeout(humanTimeout);signal.removeEventListener('abort',abortHuman);});
 const gridRequest=fetch('/data/relief-grid.bin',{signal}).then(async res=>{if(!res.ok)throw new Error('Relief unavailable');const buffer=await res.arrayBuffer();if(buffer.byteLength!==1440*720*2)throw new Error('Invalid relief grid');return new Int16Array(buffer);});
 const [data,grid]=await Promise.all([Promise.all(['land','coast','lights','coast-lines','borders','relief-land','relief-ocean','stellar-body','stellar-interior','stellar-haze','stellar-halo'].map(name=>load(name))),gridRequest]);
 if(signal.aborted){destroy();throw new DOMException('Aborted','AbortError');}elevation=grid;
 land=spatialCloud(lift(data[0]),'#b9b0a0');coast=spatialCloud(lift(data[1]),'#e6dabe');lights=spatialCloud(lift(data[2]),'#eed7a8');coastLines=lines(data[3],'#789dab');borders=lines(data[4],'#89a8b5');
 for(const c of [land,coast,lights]){c.points.userData.sampleBudget=5000;c.points.userData.spatialExposure=1;}
 reliefLand=spatialCloud(data[5],'#8f9598');reliefOcean=spatialCloud(data[6],'#718084');body=spatialCloud(data[7],'#a79a83');interior=spatialCloud(data[8],'#b4a17f');haze=spatialCloud(data[9],'#887f75');halo=spatialCloud(data[10],'#c7d0d6');haze.material.uniforms.soft.value=1;reliefOcean.material.uniforms.seaMotion.value=1;
 terrainCloud(land,1);terrainCloud(coast,3);terrainCloud(lights,4);terrainCloud(reliefLand,1,true);terrainCloud(reliefOcean,2,true);
 const humanData=await humanRequest;
 if(signal.aborted){destroy();throw new DOMException('Aborted','AbortError');}
 if(humanData){populationField=spatialCloud(humanData[0],'#8eabc6');footprintField=spatialCloud(humanData[1],'#9786ae');for(const c of [populationField,footprintField]){terrainCloud(c,1);c.points.userData.humanField=true;c.points.userData.shimmer=.06;c.material.uniforms.opacity.value=0;}}
 host.dataset.humanFields=humanData?'ready':'unavailable';
 scene.userData.spatial={depth:1,cut:0,cutNormal,cutFacing};
 }catch(e){destroy();throw e;}
 function setView(mode:EarthView){if(stage!=='orbit'||flight||morph||genesisProgress<1||openProgress>0)return;viewMode=mode;targetTilt=mode==='oblique'?68:0;targetAlt=mode==='oblique'?(activeOpenTarget&&scaleTier==='region'?Math.min(.62,Math.max(.10,cameraAltitude(activeOpenTarget.contextRadiusKm*1.8,host.clientWidth,host.clientHeight))):.62):targetId&&scaleTier==='region'?(activeOpenTarget?cameraAltitude(activeOpenTarget.contextRadiusKm,host.clientWidth,host.clientHeight):.20):homeAltitude();if(mode!=='globe'){const r=activeOpenTarget??WORLD_TARGETS.find(t=>t.id===targetId)??studyRegions[region];targetLat=r.lat;targetLon=lon+wrap(r.lon-lon);}if(mode==='cutaway'){cutFacing.copy(geo(targetLon,targetLat));cutNormal.copy(geo(targetLon+90,0));}lastInteraction=performance.now();stillFrames=0;callbacks.interact();callbacks.view?.(mode);}
 function setRegion(id:StudyRegion){if(stage!=='orbit'||flight||morph||genesisProgress<1||openProgress>0)return;region=id;activeOpenTarget=undefined;void openViews.setTarget(null);targetId=null;scaleTier='planet';highlight(null);notifyWorld();const r=studyRegions[id];targetLat=r.lat;targetLon=lon+wrap(r.lon-lon);cutFacing.copy(geo(r.lon,r.lat));cutNormal.copy(geo(r.lon+90,0));lastInteraction=performance.now();stillFrames=0;callbacks.interact();}
 function resetView(){viewMode='globe';targetTilt=0;callbacks.view?.('globe');}

 function fly(toLat:number,toLon:number,toAlt:number,end:Stage,duration=6800){awakening.depart();resetView();lastInteraction=performance.now();stillFrames=0;flight={start:performance.now(),duration:options.motion?duration:0,fromLat:lat,fromLon:lon,fromAlt:alt,toLat,toLon:lon+wrap(toLon-lon),toAlt,end,anchorLat:end==='orbit'&&remembered?remembered.places.reduce((n,p)=>n+p.lat,0)/remembered.places.length:lat,anchorLon:end==='orbit'&&remembered?remembered.places.reduce((n,p)=>n+p.lon,0)/remembered.places.length:lon};setStage(end==='city'?'descending':'ascending');}
 async function ensureCity(){if(cityReady)return;if(cityLoading)return cityLoading;cityLoading=(async()=>{const requestedAt=performance.now();host.dataset.detailSingaporeStatus='fetching';const data=await Promise.all(['singapore-stars','singapore-streets','regional-lines','singapore-coast'].map(name=>load(name)));const fetchedAt=performance.now();host.dataset.detailSingaporeFetchMs=(fetchedAt-requestedAt).toFixed(1);host.dataset.detailSingaporeStatus='preparing';if(disposed||graphicsLost||signal.aborted)return;// Stable random order makes draw-range detail changes spatially even.
 const raw=data[0],order=Array.from({length:raw.length/6},(_,i)=>i).sort((a,b)=>(Math.imul(a+1,2654435761)>>>0)-(Math.imul(b+1,2654435761)>>>0));const sorted=new Float32Array(raw.length);order.forEach((i,j)=>sorted.set(raw.subarray(i*6,i*6+6),j*6));
 cityStars=cloud(sorted,'#d5c5a5',true);streetLines=lines(data[1],'#c1a780',true);cityStars.points.userData.fallbackExposure=2.4;streetLines.userData.fallbackExposure=2;regional=lines(data[2],'#aac6cd');cityCoast=cloud(data[3],'#decca4');const people:number[]=[];for(const s of stories)people.push(...geo(s.lon,s.lat,1.000024).toArray(),1.3,5,6.1);peopleCloud=cloud(new Float32Array(people),'#f9dfb2');createUrbanView('singapore',data[1],cityFeather);cityReady=true;host.dataset.detailSingaporePrepareMs=(performance.now()-fetchedAt).toFixed(1);host.dataset.detailSingaporeStatus='ready';})();try{await cityLoading;}catch(e){cityLoading=null;throw e;}}

 function newYorkFeather(lon:number,lat:number){const d=Math.hypot((lon+73.9957)/.0237,(lat-40.72155)/.01805);return 1-transformationEase((d-.65)/.35);}
 function createUrbanView(id:string,roads:Float32Array,feather:(lon:number,lat:number)=>number){
  const model=createUrbanActivity(roads,{trafficCount:host.clientWidth<700?680:1200,activityCount:host.clientWidth<700?500:900,seed:id==='singapore'?260913:260914});
  const make=(brightness:Float32Array,size:Float32Array,color:string)=>{const data=new Float32Array(brightness.length*6);for(let i=0;i<brightness.length;i++)data.set([0,0,0,brightness[i],size[i],(i*.713)%6.28],i*6);return cloud(data,color);};
  const traffic=make(model.trafficBrightness,model.trafficSize,'#F0A36B'),activity=make(model.activityBrightness,model.activitySize,'#EBA69B');activity.material.uniforms.soft.value=.58;
  traffic.points.userData.urban=id;activity.points.userData.urban=id;traffic.points.userData.fallbackExposure=1.8;activity.points.userData.fallbackExposure=2.5;
  const trafficXYZ=traffic.points.geometry.getAttribute('position').array as Float32Array,activityXYZ=activity.points.geometry.getAttribute('position').array as Float32Array;
  urbanViews.set(id,{model,traffic,activity,trafficXYZ,activityXYZ,feather});
  if(id!=='singapore'&&id!=='new-york')return;
  const cityId=id as 'singapore'|'new-york';
  const context=createCityContinuation(cityId,roads,{elevation,pointBudget:host.clientWidth<700?12000:16000});
  const stars=cloud(context.stars,'#a89577'),filaments=lines(context.lines,'#8c7961',(lon,lat)=>continuationBandWeight(cityId,'far',lon,lat));
  const middleStars=cloud(context.intermediate.stars,'#bba586'),middleLines=lines(context.intermediate.lines,'#ab9473',(lon,lat)=>continuationBandWeight(cityId,'intermediate',lon,lat));
  for(const [c,band] of [[stars,'far'],[middleStars,'intermediate']] as const){c.points.userData.cityContinuation=id;c.points.userData.cityContinuationBand=band;c.points.userData.fallbackExposure=1.6;}
  filaments.userData.cityContinuation=id;middleLines.userData.cityContinuation=id;
  contextViews.set(id,{stars,lines:filaments,intermediate:{stars:middleStars,lines:middleLines}});
 }
 async function ensureNewYork(){if(newYorkReady)return;if(newYorkLoading)return newYorkLoading;newYorkLoading=(async()=>{const requestedAt=performance.now();host.dataset.detailNewYorkStatus='fetching';const [stars,streets]=await Promise.all(['new-york-stars','new-york-streets'].map(name=>load(name)));const fetchedAt=performance.now();host.dataset.detailNewYorkFetchMs=(fetchedAt-requestedAt).toFixed(1);host.dataset.detailNewYorkStatus='preparing';if(disposed||graphicsLost||signal.aborted)return;const order=Array.from({length:stars.length/6},(_,i)=>i).sort((a,b)=>(Math.imul(a+1,2654435761)>>>0)-(Math.imul(b+1,2654435761)>>>0)),sorted=new Float32Array(stars.length);order.forEach((i,j)=>sorted.set(stars.subarray(i*6,i*6+6),j*6));newYorkStars=cloud(sorted,'#d5c5a5',newYorkFeather);newYorkStreets=lines(streets,'#c1a780',newYorkFeather);newYorkStars.points.userData.fallbackExposure=2.4;newYorkStreets.userData.fallbackExposure=2;createUrbanView('new-york',streets,newYorkFeather);newYorkReady=true;host.dataset.detailNewYorkPrepareMs=(performance.now()-fetchedAt).toFixed(1);host.dataset.detailNewYorkStatus='ready';})();try{await newYorkLoading;}catch(e){newYorkLoading=null;throw e;}}
 const specialViews=specialDestinationViews({load,cloud,lines,urban:createUrbanView,alive:()=>!disposed&&!graphicsLost&&!signal.aborted});
 function updateUrban(nowSeconds:number,visibility:number){for(const [id,v] of urbanViews){const active=targetId===id&&layerFlags.urban&&genesisProgress>=1&&openProgress===0;v.traffic.material.uniforms.opacity.value=active?visibility*1.6:0;v.activity.material.uniforms.opacity.value=active?visibility*2.5:0;if(!active||visibility<.002)continue;v.model.sample(nowSeconds,v.trafficXYZ,v.activityXYZ);const brightness=v.traffic.points.geometry.getAttribute('brightness') as THREE.BufferAttribute;for(let i=0;i<v.model.trafficCount;i++){const x=v.trafficXYZ[i*3],y=v.trafficXYZ[i*3+1],z=v.trafficXYZ[i*3+2],weight=v.feather(Math.atan2(x,z)/R,Math.atan2(y,Math.hypot(x,z))/R);brightness.setX(i,v.model.trafficBrightness[i]*v.model.trafficOpacity[i]*weight);}brightness.needsUpdate=true;const activityBrightness=v.activity.points.geometry.getAttribute('brightness') as THREE.BufferAttribute;for(let i=0;i<v.model.activityCount;i++){const x=v.activityXYZ[i*3],y=v.activityXYZ[i*3+1],z=v.activityXYZ[i*3+2];activityBrightness.setX(i,v.model.activityBrightness[i]*v.feather(Math.atan2(x,z)/R,Math.atan2(y,Math.hypot(x,z))/R));}activityBrightness.needsUpdate=true;v.traffic.points.geometry.getAttribute('position').needsUpdate=true;v.activity.points.geometry.getAttribute('position').needsUpdate=true;}}
 const flightPaths=prepareFlightPaths(aircraftCorridors,(lon,lat)=>sampleElevation(elevation,1440,720,lon,lat));
 const flightPathsById=new Map(flightPaths.map(path=>[path.id,path]));
 const smoothShipping=prepareSmoothCables(seaLanePaths,(lon,lat)=>sampleElevation(elevation,1440,720,lon,lat),1.002);
 const shippingById=new Map(smoothShipping.map(path=>[path.id,path]));
 const flightReferences=new Map(aircraftSignals.map(record=>[record,flightPathsById.get(flightPathId(record))!]));
 const shipReferences=new Map(shipSignals.map(record=>[record,shippingById.get(flightPathId(record))!]));
 type SignalView={records:readonly WorldSignal[];cloud:Cloud;positions:Float32Array;brightness:THREE.BufferAttribute;onsets:Float32Array;trailCount:number;layer:'satellites'|'aircraft'|'ships';gates:ActivityTransitions;activity:number;drawCount:number};
 function signalView(source:readonly WorldSignal[],layer:'satellites'|'aircraft'|'ships'):SignalView{
  const records=awakeningOrder(source),trailCount=layer==='aircraft'?24:9,data=new Float32Array(records.length*trailCount*6),onsets=new Float32Array(records.length);
  for(let i=0;i<records.length;i++){onsets[i]=signalOnset(layer,i,records.length);for(let k=0;k<trailCount;k++){const tail=1-k/trailCount;data.set([0,0,0,0,k===0?LIVING_MATERIAL[layer].size:(layer==='ships'?1.25:.85)*tail,(source.indexOf(records[i])*.73)%6.28],(i*trailCount+k)*6);}}
  const c=cloud(data,signalColors[layer]);c.points.userData.shell=layer;c.points.userData.rhythm=LIVING_MATERIAL[layer].rhythm;c.points.userData.shimmer=LIVING_MATERIAL[layer].shimmer;c.material.uniforms.shell.value=1;c.points.userData.fallbackExposure=1.4;c.points.geometry.setDrawRange(0,0);
  return {records,cloud:c,positions:c.points.geometry.getAttribute('position').array as Float32Array,brightness:c.points.geometry.getAttribute('brightness') as THREE.BufferAttribute,onsets,trailCount,layer,gates:new ActivityTransitions(records.map(r=>r.id),'travellers'),activity:0,drawCount:0};
 }
 const signalViews=[signalView(satelliteSignals,'satellites'),signalView(aircraftSignals,'aircraft'),signalView(shipSignals,'ships')],signalOutput=new Float64Array(3);
 function updateSignals(nowSeconds:number,visibility:number){const exposure=livingExposure(alt);for(const v of signalViews){
  v.cloud.material.uniforms.opacity.value=visibility*displayedLight.travellerLight*displayedLight[v.layer==='satellites'?'orbitLight':v.layer==='aircraft'?'airLight':'seaLight']*LIVING_MATERIAL[v.layer].opacity*(v.layer==='satellites'?exposure.orbit:v.layer==='aircraft'?exposure.air:exposure.ships)*Math.min(1,v.gates.average*4);
  let active=0,full=0;v.activity=0;
  for(let i=0;i<v.records.length;i++){
   const age=awakening.elapsed-v.onsets[i];if(age<=0||awakening.state==='waiting')break;active++;if(age>=AWAKENING[v.layer].fade)full++;
   const densityGate=smoothUnit((displayedLight.travellerVolume-activitySeed(v.records[i].id)*.92)*12);const gate=v.gates.values[i]*densityGate,record=v.records[i];v.activity+=signalReveal(v.layer,age,0,true)*gate/v.records.length;
   for(let k=0;k<v.trailCount;k++){
    const fraction=k/(v.trailCount-1),tail=1-k/v.trailCount;
    v.brightness.setX(i*v.trailCount+k,(k===0?LIVING_MATERIAL[v.layer].head:record.anchorProgress!==undefined?0:LIVING_MATERIAL[v.layer].tail*Math.pow(tail,1.7))*signalReveal(v.layer,age,fraction,!reducedMotion)*smoothUnit((gate-fraction*.3)/.7));
    // A tail extends behind its own head as it appears, never a complete old arc.
    if(visibility>=.002){
     const lag=record.trailSeconds*fraction*Math.min(gate,Math.max(0,age)/AWAKENING[v.layer].tail);
     if(v.layer==='ships')sampleSmoothCable(shipReferences.get(record)!,signalProgress(record,nowSeconds,lag),signalOutput);
     else sampleSignal(record,nowSeconds,signalOutput,lag);
     if(v.layer==='aircraft')liftFlight(flightReferences.get(record)!,depth,terrain.land*(1+TERRAIN.grazingLand*terrain.study),signalOutput);
     v.positions.set(signalOutput,(i*v.trailCount+k)*3);
    }
   }
  }
  v.drawCount=active*v.trailCount;v.activity=v.activity>.999999?1:v.activity;v.cloud.points.geometry.setDrawRange(0,v.drawCount);v.brightness.needsUpdate=true;
  if(active&&visibility>=.002)v.cloud.points.geometry.getAttribute('position').needsUpdate=true;
  host.dataset[v.layer+'Awake']=String(active);host.dataset[v.layer+'Full']=String(full);
 }}

 // A bounded water column, sampled from the original seafloor buffer.
 const floorP=reliefOcean.points.geometry.getAttribute('position'),floorPhase=reliefOcean.points.geometry.getAttribute('phase');
 const volumeSource=new Float32Array(floorP.count*6);
 for(let i=0;i<floorP.count;i++)volumeSource.set([floorP.getX(i),floorP.getY(i),floorP.getZ(i),0,0,floorPhase.getX(i)],i*6);
 const suspendedData=createOceanVolume(volumeSource),suspended=cloud(suspendedData,'#718C93');
 const currentData=new Float32Array(currentPaths.length*CURRENT_PARTICLES*6),waterSample=new Float64Array(3);
 for(let i=0;i<currentPaths.length;i++)for(let k=0;k<CURRENT_PARTICLES;k++){const light=sampleCurrent(i,k,0,elevation,waterSample);currentData.set([...waterSample,light,.58+(k%3)*.14,i*.73+k*.618],(i*CURRENT_PARTICLES+k)*6);}
 const currents=cloud(currentData,'#5E999E');
 for(const c of [suspended,currents]){c.points.userData.spatial=true;c.points.userData.oceanVolume=true;c.points.userData.rhythm=.13;c.points.userData.shimmer=.18;c.points.userData.sampleBudget=5000;c.material.uniforms.spatial.value=1;terrainCloud(c,6);}
 const suspendedPosition=suspended.points.geometry.getAttribute('position') as THREE.BufferAttribute;
 const currentPosition=currents.points.geometry.getAttribute('position') as THREE.BufferAttribute;
 const currentBrightness=currents.points.geometry.getAttribute('brightness') as THREE.BufferAttribute;
 let lastWaterTime=-Infinity;
 function updateWater(seconds:number,visibility:number){
  const exposure=oceanExposure(alt,tilt,cut)*visibility*depth*awakening.ocean;
  suspended.material.uniforms.opacity.value=exposure*2.3*displayedLight.oceanLight;currents.material.uniforms.opacity.value=exposure*1.4*displayedLight.oceanLight;
  suspended.points.geometry.setDrawRange(0,Math.floor(suspended.count*(host.clientWidth<700?.58:1)));
  if((seconds===0||Math.abs(seconds-lastWaterTime)>=1/30)&&exposure>.001){
   for(let i=0;i<suspended.count;i++){const n=i*6;sampleSuspended(suspendedData[n],suspendedData[n+1],suspendedData[n+2],suspendedData[n+5],seconds,waterSample);suspendedPosition.setXYZ(i,waterSample[0],waterSample[1],waterSample[2]);}
   for(let i=0;i<currentPaths.length;i++)for(let k=0;k<CURRENT_PARTICLES;k++){const light=sampleCurrent(i,k,seconds,elevation,waterSample),n=i*CURRENT_PARTICLES+k;currentPosition.setXYZ(n,waterSample[0],waterSample[1],waterSample[2]);currentBrightness.setX(n,light);}
   suspendedPosition.needsUpdate=true;currentPosition.needsUpdate=true;currentBrightness.needsUpdate=true;lastWaterTime=seconds;
  }
  host.dataset.oceanVolumePoints=String(suspended.count);host.dataset.currentPoints=String(currents.count);host.dataset.oceanVolumeExposure=exposure.toFixed(3);
 }

 const airPathGates=new ActivityTransitions(flightPaths.map(p=>p.id),'pathways');
 const shipPathGates=new ActivityTransitions(smoothShipping.map(p=>p.id),'pathways');
 const cablePathGates=new ActivityTransitions(cablePaths.map(p=>p.id),'pathways');
 const cableTravellerGates=new ActivityTransitions(cablePaths.map(p=>p.id),'travellers');
 const activityTransitions=[...signalViews.map(v=>v.gates),airPathGates,shipPathGates,cablePathGates,cableTravellerGates,focusTransition,populationFocus,footprintFocus,connectionsFocus];
 const airOnsets=Float32Array.from(flightPaths,(_,i)=>signalOnset('aircraft',i,flightPaths.length));
 const shipOnsets=Float32Array.from(smoothShipping,(_,i)=>signalOnset('ships',i,smoothShipping.length));
 type PathGeometry=Pick<ReturnType<typeof prepareSmoothCables>[number],'positions'|'progress'>;
 function ribbon(c:Cloud,paths:readonly PathGeometry[],sources:readonly {intensity:number}[],onsets:Float32Array,kind:number,gates:ActivityTransitions){
  const original=c.points;earth.remove(original);original.geometry.dispose();geometries.splice(geometries.indexOf(original.geometry),1);
  const g=cableFilamentGeometry(paths,sources,onsets);geometries.push(g);
  c.material.vertexShader=cableFilamentVertex;c.material.fragmentShader=cableFilamentFragment;c.material.side=THREE.DoubleSide;
  Object.assign(c.material.uniforms,{resolution:{value:new THREE.Vector2(host.clientWidth,host.clientHeight)},awakeningTime:{value:0},pathKind:{value:kind},routeGate:{value:gates.values},richness:{value:DEFAULT_LIGHT.pathVolume},drawDuration:{value:kind===0?AWAKENING.cables.draw:2.2},fadeDuration:{value:kind===0?AWAKENING.cables.fade:1.1}});
  const mesh=new THREE.Mesh(g,c.material);mesh.userData={...original.userData};mesh.frustumCulled=false;earth.add(mesh);c.points=mesh;c.count=g.getAttribute('position').count;
 }
 function pathway(paths:readonly PathGeometry[],sources:readonly {intensity:number}[],onsets:Float32Array,tint:string,kind:number,gates:ActivityTransitions){
  const data:number[]=[],routeIndices:number[]=[],progress:number[]=[];
  if(fallback)paths.forEach((p,i)=>{const count=Math.min(256,p.progress.length);for(let k=0;k<count;k++){const n=Math.round(k*(p.progress.length-1)/(count-1));data.push(...p.positions.subarray(n*3,n*3+3),0,.62,i*.73);routeIndices.push(i);progress.push(p.progress[n]);}});
  const c=cloud(new Float32Array(data),tint);c.material.uniforms.regional.value=1;c.material.uniforms.shell.value=1;
  c.points.userData.shell=kind===2?'air-lanes':'sea-lanes';c.points.userData.rhythm=.15;c.points.userData.shimmer=0;c.points.userData.fallbackExposure=.65;
  const base=fallback?(c.points.geometry.getAttribute('position').array as Float32Array).slice():null;
  if(!fallback)ribbon(c,kind===1?marineStrands(paths as typeof smoothShipping,(lon,lat)=>sampleElevation(elevation,1440,720,lon,lat),true):paths,sources,onsets,kind,gates);
  // The material does not move; the travelling light supplies local highlights.
  return {cloud:c,gates,onsets,kind,sources,base,routeIndices,progress};
 }
 const airLanes=pathway(flightPaths,flightPaths.map((_,i)=>({intensity:i%13===12?0:.65})),airOnsets,signalColors.aircraft,2,airPathGates);
 const seaLaneView=pathway(smoothShipping,seaLanePaths.map((p,i)=>({intensity:i%19===18?0:p.intensity,tier:p.tier})),shipOnsets,seaLaneColor,1,shipPathGates),seaLanes=seaLaneView.cloud;
 seaLanes.points.userData.seaLanes=true;
 function updatePathway(view:ReturnType<typeof pathway>,visibility:number){
  const c=view.cloud;c.material.uniforms.opacity.value=visibility*Math.min(1,view.gates.average*4);
  if(!fallback){c.material.uniforms.richness.value=displayedLight.pathVolume;c.material.uniforms.awakeningTime.value=awakening.elapsed;c.material.uniforms.resolution.value.set(host.clientWidth,host.clientHeight);return;}
  const b=c.points.geometry.getAttribute('brightness') as THREE.BufferAttribute,p=c.points.geometry.getAttribute('position') as THREE.BufferAttribute;
  for(let k=0;k<view.routeIndices.length;k++){
   const i=view.routeIndices[k],progress=view.progress[k],age=awakening.elapsed-view.onsets[i];
   b.setX(k,displayedLight.pathVolume*view.sources[i].intensity*smoothUnit((age-progress*2.2)/1.1)*smoothUnit((view.gates.values[i]-progress*.3)/.7));
   if(view.kind===2){const scale=flightRadius(flightPaths[i],depth,terrain.land*(1+TERRAIN.grazingLand*terrain.study))/flightPaths[i].radius;p.setXYZ(k,view.base![k*3]*scale,view.base![k*3+1]*scale,view.base![k*3+2]*scale);}
  }
  b.needsUpdate=true;if(view.kind===2)p.needsUpdate=true;
 }
 function syncPresentation(){
  const activity=presentation.focus==='living'||presentation.focus==='connections'||presentation.keepActivity;
  for(const v of signalViews)v.gates.set(activity&&presentation.travellers&&layerFlags[v.layer],layerClock,reducedMotion);
  airPathGates.set(activity&&presentation.pathways&&layerFlags.aircraft,layerClock,reducedMotion);
  shipPathGates.set(activity&&presentation.pathways&&layerFlags.ships,layerClock,reducedMotion);
  cablePathGates.set(activity&&presentation.pathways&&layerFlags.cables,layerClock,reducedMotion);
  cableTravellerGates.set(activity&&presentation.travellers&&layerFlags.cables,layerClock,reducedMotion);
  focusTransition.set(presentation.focus!=='living'&&presentation.focus!=='connections',layerClock,reducedMotion);populationFocus.set(presentation.focus==='population',layerClock,reducedMotion);footprintFocus.set(presentation.focus==='footprint',layerClock,reducedMotion);connectionsFocus.set(presentation.focus==='connections',layerClock,reducedMotion);
 }

 // Cable-only rounded geography; the seated stroke and signal lights share it.
 const cableSample=new Float64Array(3),cableStars:number[]=[],pulseStars:number[]=[];
 function seatNetwork(out:Float64Array){const r=Math.hypot(out[0],out[1],out[2]),h=sampleElevation(elevation,1440,720,Math.atan2(out[0],out[2])/R,Math.atan2(out[1],Math.hypot(out[0],out[2]))/R);const scale=networkRadius(h)/r;for(let j=0;j<3;j++)out[j]*=scale;}
 const smoothCables=prepareSmoothCables(cablePaths,(lon,lat)=>sampleElevation(elevation,1440,720,lon,lat));
 const seaOnsets=cableOnsets(cablePaths);
 for(let i=0;fallback&&i<cablePaths.length;i++){
  for(let k=0;k<CABLE_SEGMENTS_PER_PATH;k++){sampleSmoothCable(smoothCables[i],k/(CABLE_SEGMENTS_PER_PATH-1),cableSample);cableStars.push(...cableSample,0,.48,(i*.61+k*.017)%6.28);}
 }
 for(let i=0;i<CABLE_PULSE_SLOTS;i++)for(let k=0;k<4;k++)pulseStars.push(0,0,.98,0,k===0?1.35:.58,i*.61+k*.07);
 const hubStars:number[]=[];
 for(const hub of cableHubs){const [lat,lon]=hub.point;cableSample.set(geo(lon,lat).toArray());seatNetwork(cableSample);hubStars.push(...cableSample,.55,.75,hub.degree);for(let k=0;k<Math.min(22,4+hub.degree);k++){const radius=.035+.018*Math.sqrt(k),angle=k*2.39996;const latK=lat+Math.sin(angle)*radius,lonK=lon+Math.cos(angle)*radius/Math.max(.3,Math.cos(lat*R));const v=geo(lonK,latK);cableSample.set(v.toArray());seatNetwork(cableSample);hubStars.push(...cableSample,.22+Math.min(.4,hub.degree*.02),.38+(k%4)*.10,k*.71+hub.degree);}}
 const seaHubs=cloud(new Float32Array(hubStars),'#AC98D0');seaHubs.points.userData.hubField=true;
 const seaFilaments:Cloud=cloud(new Float32Array(cableStars),cableColor),seaPulses=cloud(new Float32Array(pulseStars),'#C5ABEE');
 if(!fallback)ribbon(seaFilaments,marineStrands(smoothCables,(lon,lat)=>sampleElevation(elevation,1440,720,lon,lat)),cablePaths,seaOnsets,0,cablePathGates);
 host.dataset.cableStroke=fallback?'smooth-points':'continuous-ribbon';
 host.dataset.cableCurveVertices=String(smoothCables.reduce((n,p)=>n+p.progress.length,0));
 for(const c of [seaFilaments,seaPulses,seaHubs]){
  c.points.userData.seaBackbone=c!==seaHubs;c.points.userData.network=true;c.points.userData.spatial=true;
  c.points.userData.shell='network';c.points.userData.rhythm=.17;c.points.userData.shimmer=.30;
  c.points.userData.fallbackExposure=1.5;c.material.uniforms.regional.value=1;c.material.uniforms.shell.value=2;c.material.uniforms.spatial.value=1;
  // Kind 4 follows floor displacement without selecting any moving ocean samples.
  terrainCloud(c,4);
 }
 const cableBrightness=seaFilaments.points.geometry.getAttribute('brightness') as THREE.BufferAttribute;
 function updateSea(seconds:number,visibility:number){
  const exposure=livingExposure(alt);
  updatePathway(airLanes,visibility*exposure.air*.38*displayedLight.pathLight*displayedLight.airLight);
  updatePathway(seaLaneView,visibility*exposure.lanes*.30*displayedLight.pathLight*displayedLight.seaLight);
  const lanesFull=shipOnsets.reduce((n,onset)=>n+(awakening.elapsed-onset>=3.3?1:0),0);
  const alpha=awakening.elapsed>AWAKENING.cables.start?visibility*exposure.cables:0;
  seaFilaments.material.uniforms.opacity.value=(fallback?displayedLight.pathVolume:1)*alpha*.70*displayedLight.pathLight*displayedLight.cableLight*Math.min(1,cablePathGates.average*4);
  seaPulses.material.uniforms.opacity.value=alpha*1.7*displayedLight.travellerLight*displayedLight.cableLight*Math.min(1,cableTravellerGates.average*4);
  seaHubs.material.uniforms.opacity.value=alpha*.13*displayedLight.pathLight*displayedLight.cableLight*cableReveal(awakening.elapsed-AWAKENING.cables.start-2,1)*cablePathGates.average;
  if(!fallback){seaFilaments.material.uniforms.richness.value=displayedLight.pathVolume;seaFilaments.material.uniforms.awakeningTime.value=awakening.elapsed;seaFilaments.material.uniforms.resolution.value.set(host.clientWidth,host.clientHeight);}
  const a=seaPulses.points.geometry.getAttribute('position') as THREE.BufferAttribute,b=seaPulses.points.geometry.getAttribute('brightness') as THREE.BufferAttribute;
  let active=0,full=0;
  for(let i=0;i<cablePaths.length;i++){
   const age=awakening.elapsed-seaOnsets[i];if(age>0)active++;if(cableReveal(age,1)===1)full++;
   if(fallback)for(let k=0;k<CABLE_SEGMENTS_PER_PATH;k++){
    // A sparse bright knot at branches, with quiet precise trunks between them.
    const endpoint=k<3||k>CABLE_SEGMENTS_PER_PATH-4;
    cableBrightness.setX(i*CABLE_SEGMENTS_PER_PATH+k,(endpoint?.85:.54)*cablePaths[i].intensity*cableReveal(age,k/(CABLE_SEGMENTS_PER_PATH-1))*smoothUnit((cablePathGates.values[i]-k/(CABLE_SEGMENTS_PER_PATH-1)*.3)/.7));
   }
  }
  let journeys=0;
  for(let i=0;i<CABLE_PULSE_SLOTS;i++){
   const journey=cableJourney(i,seconds),path=smoothCables[journey.index];
   const visible=smoothUnit((displayedLight.travellerVolume-i/CABLE_PULSE_SLOTS)*12)*journey.light*cableReveal(awakening.elapsed-seaOnsets[journey.index]-1,1)*cableTravellerGates.values[journey.index];
   if(visible>.01)journeys++;
   for(let k=0;k<4;k++){const n=i*4+k;sampleSmoothCable(path,clamp(journey.progress+(i%2?1:-1)*k*.0025,0,1),cableSample);a.setXYZ(n,cableSample[0],cableSample[1],cableSample[2]);b.setX(n,visible*(k===0?1.35:reducedMotion?0:.30*(1-k/4)*smoothUnit((cableTravellerGates.values[journey.index]-k*.08)/.76)));}
  }
  host.dataset.cablePulseJourneys=String(journeys);host.dataset.cableHubs=String(cableHubs.length);
  if(fallback)cableBrightness.needsUpdate=true;
  b.needsUpdate=true;if(alpha>=.001)a.needsUpdate=true;
  host.dataset.cablesAwake=String(active);host.dataset.cablesFull=String(full);host.dataset.seaLanesFull=String(lanesFull);
 }
 function resetAwakening(){awakening.reset();time=0;for(const v of signalViews){v.cloud.points.geometry.setDrawRange(0,0);v.cloud.material.uniforms.opacity.value=0;v.brightness.array.fill(0);v.brightness.needsUpdate=true;}updateSea(0,0);updateWater(0,0);notifyAwakening();}
 let navigationHighlight:Cloud|null=null,highlightedTargetId:string|null=null;
 function highlight(id:string|null){
  highlightedTargetId=id;const target=activeOpenTarget?.id===id?activeOpenTarget:WORLD_TARGETS.find(t=>t.id===id);
  if(!target){if(navigationHighlight)navigationHighlight.material.uniforms.opacity.value=0;return;}
  const undersea=id==='challenger-deep';
  const radius=undersea?reliefRadius(Math.min(0,sampleElevation(elevation,1440,720,target.lon,target.lat)))+.0012:1.013;
  const position=geo(target.lon,target.lat,radius);
  if(!navigationHighlight){navigationHighlight=cloud(new Float32Array([...position.toArray(),1.5,3.8,1.27]),'#e5dfff');navigationHighlight.points.userData.highlight=true;}
  else{(navigationHighlight.points.geometry.getAttribute('position') as THREE.BufferAttribute).setXYZ(0,position.x,position.y,position.z);navigationHighlight.points.geometry.getAttribute('position').needsUpdate=true;}
  // The existing beacon descends with sampled bathymetry instead of floating in air.
  navigationHighlight.points.userData.spatial=undersea;navigationHighlight.points.userData.terrainKind=undersea?5:0;
  navigationHighlight.material.uniforms.spatial.value=undersea?1:0;navigationHighlight.material.uniforms.terrainKind.value=undersea?5:0;
  navigationHighlight.material.uniforms.opacity.value=1;
 }
 function release(g:THREE.BufferGeometry,m:THREE.Material){g.dispose();m.dispose();const gi=geometries.indexOf(g),mi=materials.indexOf(m);if(gi>=0)geometries.splice(gi,1);if(mi>=0)materials.splice(mi,1);}
 function setStoryInset(pixels:number){stillFrames=0;storyInset=pixels;if(selected&&host.clientWidth<700){const available=Math.max(120,host.clientHeight-pixels-115);const span=Math.max(...selected.places.map(p=>p.lat))-Math.min(...selected.places.map(p=>p.lat));targetAlt=Math.max(.0019,span*R*host.clientHeight/(2*Math.tan(21*R)*available)*1.18);}}
 function clearStory(){stillFrames=0;if(storyCloud){storyCloud.points.visible=false;}if(storyLines)storyLines.visible=false;selected=null;}
 function select(id:string|null){if(stage!=='city'||(targetId!==null&&targetId!=='singapore')||flight||morph)return;if(!id){clearStory();return;}const s=stories.find(x=>x.id===id);if(!s)return;clearStory();selected=s;remembered=s;storyStarted=performance.now();targetLat=(Math.min(...s.places.map(p=>p.lat))+Math.max(...s.places.map(p=>p.lat)))/2;targetLon=(Math.min(...s.places.map(p=>p.lon))+Math.max(...s.places.map(p=>p.lon)))/2;targetAlt=host.clientWidth<700?.0019:.00125;if(storyInset)setStoryInset(storyInset);lastInteraction=performance.now();stillFrames=0;const pts:number[]=[],links:number[]=[];for(const p of s.places)pts.push(...geo(p.lon,p.lat,1.00003).toArray(),1.4,4.1,6.15);
 for(let i=1;i<s.places.length;i++){const a=s.places[i-1],b=s.places[i];for(let k=0;k<32;k++){const t=k/32,u=(k+1)/32;links.push(...geo(THREE.MathUtils.lerp(a.lon,b.lon,t),THREE.MathUtils.lerp(a.lat,b.lat,t),1.00004).toArray(),...geo(THREE.MathUtils.lerp(a.lon,b.lon,u),THREE.MathUtils.lerp(a.lat,b.lat,u),1.00004).toArray());}}
 // Release each old story from the scene and disposal registry when switching lives.
 if(storyCloud){earth.remove(storyCloud.points);const idx=clouds.indexOf(storyCloud);if(idx>=0)clouds.splice(idx,1);release(storyCloud.points.geometry,storyCloud.material);}
 if(storyLines){earth.remove(storyLines);release(storyLines.geometry,storyLines.material as THREE.Material);}
 if(memoryCloud){earth.remove(memoryCloud.points);const idx=clouds.indexOf(memoryCloud);if(idx>=0)clouds.splice(idx,1);release(memoryCloud.points.geometry,memoryCloud.material);}
 const memoryAnchor=geo(s.places.reduce((n,p)=>n+p.lon,0)/s.places.length,s.places.reduce((n,p)=>n+p.lat,0)/s.places.length,1.00004);
 memoryCloud=cloud(new Float32Array([...memoryAnchor.toArray(),1.4,5,6.15]),'#ffe4b3');memoryCloud.material.uniforms.opacity.value=0;
 storyCloud=cloud(new Float32Array(pts),'#ffe4b3');const signature=stories.indexOf(s)*2.1;storyCloud.material.uniforms.signature.value=signature;memoryCloud.material.uniforms.signature.value=signature;
 storyLines=lines(links,'#f0c885');storyLines.geometry.setDrawRange(0,0);const revealAt=storyCloud.points.geometry.getAttribute('revealAt');for(let i=0;i<revealAt.count;i++)revealAt.setX(i,i*.25);}
 function notifyTransformation(force=false){const now=performance.now();if(!force&&now-lastTransformation<120)return;lastTransformation=now;callbacks.transformation?.({phase:morph?(openTarget?'opening':'reforming'):openProgress===1?'astra':'terra',progress:openProgress,busy:!!morph});}
 function setTransformation(open:boolean){
   if(disposed||genesisProgress<1||stage!=='orbit'||flight||open===openTarget&&(!!morph||openProgress===(open?1:0)))return;
   const now=performance.now();awakening.depart();openTarget=open;personalArrivalSent=false;personalSettledAt=null;lastInteraction=now;stillFrames=0;
   // Keep a live reversal continuous: never resample positions or replace the frame.
   if(open&&openProgress===0&&!morph){openingFrame(lon,lat,openFrame);if(personalPlaces)rebuildPersonal();}
   const destination=!open&&personalPlaces?personalCamera(personalPlaces):{lat,lon};
   morph={from:openProgress,to:open?1:0,start:now,duration:Math.max(1,5400*Math.abs((open?1:0)-openProgress)),prelude:open&&alt<homeAltitude()*.75?1000:0,fromLat:lat,fromLon:lon,toLat:destination.lat,toLon:lon+wrap(destination.lon-lon)};
   targetLat=lat;targetLon=lon;targetAlt=open?openAltitude():homeAltitude();resetView();clearStory();remembering=false;settledAt=null;arrivalSent=true;notifyTransformation(true);
 }
 function releasePersonal(){
   if(personalCloud){earth.remove(personalCloud.points);const index=clouds.indexOf(personalCloud);if(index>=0)clouds.splice(index,1);release(personalCloud.points.geometry,personalCloud.material);personalCloud=null;}
   if(personalLines){earth.remove(personalLines);release(personalLines.geometry,personalLines.material as THREE.Material);personalLines=null;}
 }
 function rebuildPersonal(){
   releasePersonal();if(!personalPlaces)return;
   personalEarth=personalGeography(personalPlaces);personalStars=personalAstra(personalPlaces,openFrame);
   const data=new Float32Array(18);for(let i=0;i<3;i++)data.set([...personalEarth[i].toArray(),1.65,5.0,1.4+i*1.6],i*6);
   personalCloud=cloud(data,'#ffdc99');personalCloud.points.userData.personal=true;personalCloud.points.renderOrder=20;personalCloud.material.depthTest=false;personalCloud.material.uniforms.personalStar.value=1;personalCloud.material.uniforms.signature.value=1.3;
   personalCloud.points.geometry.setAttribute('astraPosition',new THREE.Float32BufferAttribute(personalStars.flatMap(p=>p.toArray()),3));
   const earthPositions:number[]=[],astraPositions:number[]=[],sample=new THREE.Vector3();
   for(let edge=0;edge<3;edge++){const next=(edge+1)%3;for(let k=0;k<48;k++)for(const t of [k/48,(k+1)/48]){
     personalArc(personalEarth[edge],personalEarth[next],t,sample);earthPositions.push(sample.x,sample.y,sample.z);
     sample.copy(personalStars[edge]).lerp(personalStars[next],t);astraPositions.push(sample.x,sample.y,sample.z);
   }}
   personalLineEarth=new Float32Array(earthPositions);personalLineAstra=new Float32Array(astraPositions);
   personalLines=lines(personalLineEarth.slice(),'#e9bf78');personalLines.userData.personal=true;personalLines.renderOrder=19;(personalLines.material as THREE.LineBasicMaterial).depthTest=false;
 }
 function setPersonal(places:PersonalPlaces|null){
   if(disposed)return;personalPlaces=places;personalSettledAt=null;personalArrivalSent=false;stillFrames=0;lastInteraction=performance.now();rebuildPersonal();
   if(!places){personalEarth=[];personalStars=[];for(let i=0;i<3;i++)placePersonalLabel(i,false);}
 }

 function isBusy(){return genesisProgress<1||!!flight||!!morph||loadingDetail;}
 function worldState():WorldState{return {targetId,tier:scaleTier,busy:isBusy(),genesis:genesisState(genesisProgress),layers:{...layerFlags},presentation:{...presentation},humanFields:populationField&&footprintField?'ready':'unavailable',...(activeOpenTarget?{resolvedTarget:activeOpenTarget}:{}),...(openContext?{open:openContext}:{}),resolving};}
 /** A bounded read-only view. Audio never advances a visual clock or samples
  * every moving object; twelve representative traffic weights are sufficient. */
 function audioState():AudioWorldState {
  const urban=urbanViews.get(targetId??''),weights=urban?.model.trafficOpacity;
  let activity=0;
  if(weights?.length){const count=Math.min(12,weights.length);for(let i=0;i<count;i++)activity+=weights[Math.floor(i*weights.length/count)];activity/=count;}
  const signalActivity=(index:number)=>{const v=signalViews[index];return Math.min(1,v.activity*v.cloud.points.geometry.drawRange.count/Math.max(1,v.drawCount));};
  // Remove Run D's shader/material exposure from the acoustic activity. The
  // denser Run F network has the same unit range as accepted Sonic Earth.
  const networkExposure=livingExposure(alt).cables;
  const networkActivity=networkExposure>0?Math.max(0,Math.min(1,Math.max(seaFilaments.material.uniforms.opacity.value/(.74*networkExposure)*cablePathGates.average,seaPulses.material.uniforms.opacity.value/(1.7*networkExposure)*cableTravellerGates.average))):0;
  const present=genesisProgress>=1&&openProgress===0;
  return {world:worldState(),epoch:journeyEpoch,available:!disposed&&!graphicsLost&&!signal.aborted,
   seconds:time,awakening:{state:awakening.state,elapsed:awakening.elapsed,ocean:awakening.ocean},
   altitude:alt,longitude:lon,latitude:lat,flying:!!flight,opening:openProgress,motion:options.motion,
   activity:{satellites:signalActivity(0),aircraft:signalActivity(1),ships:signalActivity(2),
    network:present?networkActivity*cableReveal(awakening.elapsed-AWAKENING.cables.start,1):0,
    urban:present&&layerFlags.urban?(urban?activity*Math.min(1,urban.traffic.material.uniforms.opacity.value/1.6):openContext?.urban??0):0,
    circulation:present&&layerFlags.urban?specialViews.circulationActivity(targetId):0}};
 }
 function notifyWorld(){if(activeOpenTarget){host.dataset.openEarth=JSON.stringify({...openViews.diagnostics(),resolver:resolverDiagnostics()});host.dataset.openDetail=openContext?.detailState??'INTERPRETIVE';host.dataset.regionRadiusKm=activeOpenTarget.contextRadiusKm.toFixed(0);}callbacks.worldState?.(worldState());}
 function notifyGenesis(force=false){const now=performance.now();if(!force&&now-lastGenesis<120)return;lastGenesis=now;callbacks.genesis?.(genesisState(genesisProgress));notifyWorld();}
 function skipGenesis(){if(disposed||graphicsLost||genesisProgress>=1)return;genesisProgress=1;awakening.settle(options.motion);lastTime=performance.now();stillFrames=0;notifyAwakening();notifyGenesis(true);}
 function replayGenesis(){if(disposed||graphicsLost||loadingDetail)return;journeyEpoch++;lookupSequence++;resolverRequest?.abort();resolving=false;activeOpenTarget=undefined;void openViews.setTarget(null);for(const resolve of idleWaiters.splice(0))resolve(false);resetAwakening();heldKeys.clear();pointer.clear();flight=null;morph=null;clearStory();highlight(null);remembering=false;openProgress=0;openTarget=false;resetView();targetId=null;scaleTier='planet';lat=targetLat=19;lon=targetLon=95;alt=targetAlt=homeAltitude();genesisProgress=options.motion?0:1;genesisStarted=performance.now();lastTime=genesisStarted;if(genesisProgress===1)awakening.settle(false);notifyAwakening();stillFrames=0;setStage('orbit');notifyTransformation(true);notifyGenesis(true);}
 function waitIdle(){return disposed||graphicsLost?Promise.resolve(false):!isBusy()?Promise.resolve(true):new Promise<boolean>(resolve=>idleWaiters.push(resolve));}
 async function executeCommand(cmd:WorldCommand,queuedAt:number,sequence:number,epoch:number,resolved?:ResolvedWorldTarget):Promise<WorldCommandResult>{
  if(epoch!==journeyEpoch)return {ok:false,command:cmd,reason:'Journey replayed'};
  if(!await waitIdle())return {ok:false,command:cmd,reason:'World is unavailable'};
  if(epoch!==journeyEpoch)return {ok:false,command:cmd,reason:'Journey replayed'};
  const startedAt=performance.now();host.dataset.worldCommandStartedAt=startedAt.toFixed(1);host.dataset.worldCommandQueueMs=(startedAt-queuedAt).toFixed(1);host.dataset.worldCommandSequence=String(sequence);host.dataset.worldCommandStatus='running';
  if(openProgress>0){setTransformation(false);if(!await waitIdle())return {ok:false,command:cmd,reason:'World is unavailable'};}
  if(cmd.type==='focusLayer'){layerFlags[cmd.layer]=cmd.enabled??!layerFlags[cmd.layer];syncPresentation();stillFrames=0;notifyWorld();return {ok:true,command:cmd};}
  if(cmd.type==='setPresentation'){if((cmd.presentation.focus==='population'||cmd.presentation.focus==='footprint')&&(!populationField||!footprintField))return {ok:false,command:cmd,reason:'The geographic fields could not load. Your Earth is still available; reload to retry.'};if(cmd.presentation.focus&&cmd.presentation.focus!=='living'&&(scaleTier==='city'||scaleTier==='street'))return {ok:false,command:cmd,reason:'Geographic lenses can be studied at Planet or Region.'};presentation={...presentation,...cmd.presentation};syncPresentation();stillFrames=0;notifyWorld();return {ok:true,command:cmd};}
  const target=cmd.type==='resetView'?undefined:cmd.type==='flyToPlace'?resolved:cmd.type==='flyTo'||cmd.type==='highlightTarget'?WORLD_TARGETS.find(t=>t.id===cmd.targetId):activeOpenTarget??WORLD_TARGETS.find(t=>t.id===targetId);
  if((cmd.type==='flyTo'||cmd.type==='flyToPlace'||cmd.type==='highlightTarget')&&!target)return {ok:false,command:cmd,reason:'Unknown target'};
  if(cmd.type==='highlightTarget'){highlight(cmd.targetId);stillFrames=0;notifyWorld();return {ok:true,command:cmd};}
  const tier:ScaleTier=cmd.type==='resetView'?'planet':cmd.type==='setScale'?cmd.tier:target!.tier;
  if(target?.id==='challenger-deep'&&(tier==='city'||tier==='street'))return {ok:false,command:cmd,reason:'Challenger Deep supports planet and regional relief views'};
  const nextOpen=cmd.type==='flyToPlace'&&resolved?.mode==='open'?resolved:cmd.type==='setScale'?activeOpenTarget:undefined;
  if((tier==='city'||tier==='street')&&presentation.focus!=='living'){presentation={...presentation,focus:'living'};syncPresentation();}
  if(nextOpen&&(tier==='city'||tier==='street')&&!['city','settlement'].includes(nextOpen.kind))return {ok:false,command:cmd,reason:'This feature is best explored at Region. Choose a nearby settlement for city and local roads.'};
  if(tier!=='planet'&&!target)return {ok:false,command:cmd,reason:'Choose a target before descending'};
  try{
   const sameTarget=targetId===(target?.id??null);let detail:Promise<void>=Promise.resolve();
   if(tier==='city'||tier==='street'){loadingDetail=true;detail=(target?.id==='singapore'?ensureCity():target?.id==='new-york'?ensureNewYork():target&&SPECIAL_CITIES[target.id]?specialViews.ensure(target.id):Promise.resolve()).finally(()=>{loadingDetail=false;stillFrames=0;});}
   if(disposed||graphicsLost)return {ok:false,command:cmd,reason:'World is unavailable'};
   if(!sameTarget||nextOpen&&!openContext){for(const id of markerElements.keys())if(id.startsWith('open-'))markerElements.delete(id);activeOpenTarget=nextOpen;void openViews.setTarget(activeOpenTarget??null);}
   clearStory();remembering=false;remembered=null;arrivalSent=true;settledAt=null;targetId=cmd.type==='resetView'?null:target?.id??null;scaleTier=tier;openViews.setTier(tier);highlight(targetId);
   const trenchHorizon=target?.id==='challenger-deep'&&tier==='region';
   const destinationAlt=activeOpenTarget&&tier!=='planet'?cameraAltitude(tier==='region'?activeOpenTarget.contextRadiusKm:tier==='city'?activeOpenTarget.cityRadiusKm:1.45,host.clientWidth,host.clientHeight):tier==='planet'?homeAltitude():tier==='region'?(trenchHorizon?.62:.20):tier==='city'?(SPECIAL_CITIES[target?.id??'']?SPECIAL_CITIES[target!.id].cityAltitude*Math.max(1,host.clientHeight/host.clientWidth*.82):.0018):(SPECIAL_CITIES[target?.id??'']?SPECIAL_CITIES[target!.id].streetAltitude*Math.max(1,host.clientHeight/host.clientWidth*.82):.00075);
   const duration=cmd.type==='setScale'&&sameTarget?1100:6800;host.dataset.worldCommandCameraStartedAt=performance.now().toFixed(1);host.dataset.worldCommandTransitionMs=String(options.motion?duration:0);
   fly(cmd.type==='setScale'&&activeOpenTarget?targetLat:target?.lat??19,cmd.type==='setScale'&&activeOpenTarget?targetLon:target?.lon??95,destinationAlt,tier==='city'||tier==='street'?'city':'orbit',duration);if(activeOpenTarget?.kind==='mountain'&&tier==='region'){viewMode='oblique';targetTilt=28;callbacks.view?.('oblique');}if(trenchHorizon){viewMode='oblique';targetTilt=68;callbacks.view?.('oblique');}if(flight)flight.viaPlanet=alt<.025&&destinationAlt<.025&&Math.hypot(target!.lat-lat,wrap(target!.lon-lon))>8;notifyWorld();
   await detail;if(epoch!==journeyEpoch)return {ok:false,command:cmd,reason:'Journey replayed'};if(!await waitIdle())return {ok:false,command:cmd,reason:'World is unavailable'};host.dataset.worldCommandSettledAt=performance.now().toFixed(1);host.dataset.worldCommandDurationMs=(performance.now()-startedAt).toFixed(1);host.dataset.worldCommandStatus='settled';notifyWorld();return {ok:true,command:cmd};
  }catch{loadingDetail=false;stillFrames=0;host.dataset.worldCommandStatus='failed';scaleTier='region';fly(target?.lat??lat,target?.lon??lon,.20,'orbit',1100);notifyWorld();return {ok:false,command:cmd,reason:'Target detail could not load; Earth remains available'};}
 }
 function command(input:WorldCommand):Promise<WorldCommandResult>{
  heldKeys.clear();const cmd=validateWorldCommand(input);if(!cmd)return Promise.resolve({ok:false,command:input,reason:'Invalid world command'});
  const queuedAt=performance.now(),sequence=++commandSequence,epoch=journeyEpoch;
  host.dataset.worldCommandQueuedAt=queuedAt.toFixed(1);host.dataset.worldCommandStatus='queued';
  const interruptOpen=()=>{if(!activeOpenTarget)return;flight=null;loadingDetail=false;targetLat=lat;targetLon=lon;targetAlt=alt;for(const resolve of idleWaiters.splice(0))resolve(false);void openViews.setTarget(null);};
  if(cmd.type==='flyTo'||cmd.type==='resetView'){lookupSequence++;resolverRequest?.abort();resolving=false;interruptOpen();}
  if(cmd.type==='flyToPlace'){
   const lookup=++lookupSequence;resolverRequest?.abort();resolverRequest=new AbortController();const request=resolverRequest;resolving=true;notifyWorld();
   return (async()=>{try{
    const resolution=await resolvePlace(cmd.query,{signal:AbortSignal.any([signal,request.signal]),choice:cmd.choice});
    if(request.signal.aborted||lookup!==lookupSequence||disposed||epoch!==journeyEpoch)return {ok:false,command:cmd,reason:'Navigation was replaced.'};
    resolving=false;notifyWorld();if(resolution.status!=='resolved')return {ok:false,command:cmd,reason:resolution.message,resolution};
    interruptOpen();const resolved=resolution.target!;
    const action:WorldCommand=resolved.mode==='authored'?{type:'flyTo',targetId:resolved.authoredId!}:cmd;
    const result=commandChain.then(()=>lookup===lookupSequence?executeCommand(action,queuedAt,sequence,epoch,resolved):{ok:false,command:cmd,reason:'Navigation was replaced.'});commandChain=result.catch(()=>undefined);
    return {...await result,command:cmd,resolution};
   }catch{return {ok:false,command:cmd,reason:'Navigation was cancelled.'};}finally{if(lookup===lookupSequence){resolving=false;notifyWorld();}}})();
  }
  const result=commandChain.then(()=>executeCommand(cmd,queuedAt,sequence,epoch));commandChain=result.catch(()=>undefined);return result;
 }
 const pointer=new Map<number,{x:number;y:number}>();let dragged=false,initial={x:0,y:0},pinch=0;
 function rotate(dx:number,dy:number){if(flight||morph||genesisProgress<1)return;callbacks.interact();lastInteraction=performance.now();stillFrames=0;const scale=stage==='city'?targetAlt*2*Math.tan(21*R)/(R*host.clientHeight):.18*Math.min(1,targetAlt/1.4);targetLon-=dx*scale/(activeOpenTarget?Math.max(.15,Math.cos(targetLat*R)):1);targetLat=clamp(targetLat+dy*scale,-80,80);if(stage==='city'&&!activeOpenTarget){const ny=targetId==='new-york',special=SPECIAL_CITIES[targetId??''];const bounds=special?.bounds??(ny?[-74.015,40.707,-73.975,40.737]:[103.810,1.272,103.890,1.330]);targetLon=clamp(targetLon,bounds[0],bounds[2]);targetLat=clamp(targetLat,bounds[1],bounds[3]);}}
 function zoom(f:number){if(flight||morph||genesisProgress<1)return;callbacks.interact();lastInteraction=performance.now();stillFrames=0;if(activeOpenTarget){if(!['city','settlement'].includes(activeOpenTarget.kind)){targetAlt=clamp(targetAlt*f,cameraAltitude(activeOpenTarget.contextRadiusKm*.45,host.clientWidth,host.clientHeight),cameraAltitude(activeOpenTarget.contextRadiusKm*2.4,host.clientWidth,host.clientHeight));return;}const minimum=cameraAltitude(.65,host.clientWidth,host.clientHeight),maximum=cameraAltitude(activeOpenTarget.contextRadiusKm*2.4,host.clientWidth,host.clientHeight);targetAlt=clamp(targetAlt*f,minimum,maximum);const next:ScaleTier=targetAlt>cameraAltitude(activeOpenTarget.cityRadiusKm*2,host.clientWidth,host.clientHeight)?'region':targetAlt<cameraAltitude(2.5,host.clientWidth,host.clientHeight)?'street':'city';if(next!==scaleTier){scaleTier=next;openViews.setTier(next);setStage(next==='region'?'orbit':'city');notifyWorld();}return;}targetAlt=clamp(targetAlt*f,stage==='city'?(SPECIAL_CITIES[targetId??'']?.minAltitude??.00055):openProgress>0?openAltitude()*.78:viewMode==='oblique'?.32:scaleTier==='region'?.10:.42,stage==='city'?.004:homeAltitude()*(openProgress>0?2.5:1.8));}
 function down(e:PointerEvent){if(flight||morph||genesisProgress<1||!(e.target instanceof HTMLCanvasElement))return;renderer.domElement.focus({preventScroll:true});pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});host.setPointerCapture(e.pointerId);initial={x:e.clientX,y:e.clientY};dragged=false;lastInteraction=performance.now();stillFrames=0;if(pointer.size===2){const p=[...pointer.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}}
 function move(e:PointerEvent){const old=pointer.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});if(Math.hypot(e.clientX-initial.x,e.clientY-initial.y)>3)dragged=true;if(pointer.size===2){const p=[...pointer.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(dist>0&&pinch>0)zoom(pinch/dist);pinch=dist;}else rotate(dx,dy);}
 function up(e:PointerEvent){pointer.delete(e.pointerId);pinch=0;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);void dragged;}
 function cancel(e:PointerEvent){pointer.delete(e.pointerId);pinch=0;}
 function wheel(e:WheelEvent){e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-150,150)*.002));}
 function clearHeld(){heldKeys.clear();stillFrames=0;}
 function keyUp(e:KeyboardEvent){heldKeys.delete(e.key.toLowerCase());stillFrames=0;}
 function key(e:KeyboardEvent){if(e.altKey||e.ctrlKey||e.metaKey||editableTarget(e.target)){clearHeld();return;}const k=e.key.toLowerCase();
 if(HELD_KEYS.has(k)){e.preventDefault();if(flight||morph||genesisProgress<1)return;if(!heldKeys.size)lastTime=performance.now();heldKeys.add(k);stillFrames=0;lastInteraction=performance.now();callbacks.interact();return;}
 if(/^[0-4]$/.test(k)){e.preventDefault();if(e.repeat)return;if(k==='0')void command({type:'resetView'});else{const tier=(['planet','region','city','street'] as const)[Number(k)-1];if(tier==='planet'||targetId&&!(targetId==='challenger-deep'&&(tier==='city'||tier==='street')))void command({type:'setScale',tier});}return;}
 if(e.key.startsWith('Arrow')){e.preventDefault();rotate(e.key==='ArrowLeft'?-35:e.key==='ArrowRight'?35:0,e.key==='ArrowUp'?-35:e.key==='ArrowDown'?35:0);}if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.82);}if(e.key==='-'){e.preventDefault();zoom(1.22);}}
 host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',cancel);host.addEventListener('wheel',wheel,{passive:false});renderer.domElement.addEventListener('keydown',key);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clearHeld);renderer.domElement.addEventListener('blur',clearHeld);
 const markerElements=new Map<string,HTMLElement>();const proj=new THREE.Vector3();const openLabelBoxes:{left:number;right:number;top:number;bottom:number}[]=[];
 function placeLabel(id:string,lat:number,lon:number,show:boolean){let el=markerElements.get(id);if(!el||!el.isConnected){el=markers.querySelector<HTMLElement>('[data-star="'+id+'"]')||undefined;if(el)markerElements.set(id,el);}if(!el)return;const world=geo(lon,lat,1.00005);const front=world.dot(camera.position.clone().sub(world))>0;proj.copy(world).project(camera);const x=(proj.x*.5+.5)*host.clientWidth,y=(-proj.y*.5+.5)*host.clientHeight;el.hidden=!(show&&front&&proj.z<1&&x>20&&x<host.clientWidth-20&&y>75&&y<host.clientHeight-125);if(!el.hidden){el.style.transform=`translate(${x}px,${y}px)`;const labelWidth=el.querySelector<HTMLElement>('.marker-label')?.offsetWidth||120;el.dataset.labelSide=x+labelWidth+30>host.clientWidth-(host.clientWidth<700?65:25)?'left':'right';if(id.startsWith('open-')){const left=el.dataset.labelSide==='left'?x-labelWidth-28:x+15,box={left,right:left+labelWidth+12,top:y-13,bottom:y+13};const crowded=openLabelBoxes.some(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top);const behindControls=host.clientWidth<700?(y<245||y>host.clientHeight-260||box.right>host.clientWidth-62):(box.left<345||y>host.clientHeight-180);el.hidden=crowded||behindControls;if(!el.hidden)openLabelBoxes.push(box);}}}
 function placePersonalLabel(index:number,show:boolean){
   const id='personal-'+index;let el=markerElements.get(id);if(!el||!el.isConnected){el=markers.querySelector<HTMLElement>('[data-star="'+id+'"]')||undefined;if(el)markerElements.set(id,el);}if(!el)return;
   if(!show){el.hidden=true;return;}
   proj.copy(personalProjected[index]).project(camera);const x=(proj.x*.5+.5)*host.clientWidth,y=(-proj.y*.5+.5)*host.clientHeight;
   el.hidden=!(proj.z<1&&x>12&&x<host.clientWidth-12&&y>60&&y<host.clientHeight-55);
   if(!el.hidden){el.style.transform=`translate(${x}px,${y}px)`;const labelWidth=el.querySelector<HTMLElement>('.marker-label')?.offsetWidth||120;el.dataset.labelSide=x+labelWidth+30>host.clientWidth-24?'left':'right';}
 }
 function updateHeld(dt:number){
  if(!heldKeys.size)return;
  if(flight||morph||genesisProgress<1||editableTarget(document.activeElement)){clearHeld();return;}
  const input=navigationVector(heldKeys);
  // WASD moves the viewpoint north/east. Orbit keys retain their drag direction.
  if(activeOpenTarget&&(input.x||input.y)){const speed=scaleTier==='region'?activeOpenTarget.contextRadiusKm*.22:scaleTier==='city'?2.0:.32;targetLon+=input.x*speed*dt/(111.195*Math.max(.15,Math.cos(targetLat*R)));targetLat=clamp(targetLat+input.y*speed*dt/111.195,-80,80);}else if(input.x||input.y)rotate(-input.x*240*dt,input.y*240*dt);if(input.orbit)rotate(input.orbit*420*dt,0);
  if(input.zoom)zoom(Math.exp(input.zoom*1.25*dt));
  if(input.tilt&&stage==='orbit'&&!isBusy()&&openProgress===0){targetTilt=clamp(targetTilt+input.tilt*34*dt,0,74);const next=targetTilt>0?'oblique':'globe';if(next!==viewMode){viewMode=next;callbacks.view?.(viewMode);}if(targetTilt>0)targetAlt=Math.max(targetAlt,.32);}
  stillFrames=0;lastInteraction=performance.now();
 }
 const north=new THREE.Vector3();
 function frame(now:number){if(disposed||graphicsLost||document.hidden)return;if(!options.motion&&stillFrames>2&&!activityTransitions.some(t=>t.pending)&&!heldKeys.size&&!flight&&!morph&&genesisProgress>=1&&personalSettledAt===null&&awakening.state!=='awakening'){raf=requestAnimationFrame(frame);return;}if(fallback&&now-lastTime<50){raf=requestAnimationFrame(frame);return;}const elapsed=Math.max(0,(now-lastTime)/1000),dt=Math.min(elapsed,.06);lastTime=now;awakening.advance(elapsed,options.motion);if(options.motion)time+=dt;layerClock+=dt;for(const transition of activityTransitions)transition.update(layerClock,reducedMotion);frameCount++;stillFrames++;updateHeld(dt);
 if(flight){const t=flight.duration?clamp((now-flight.start)/flight.duration,0,1):1;const p=flight.viaPlanet?{altitude:t<.35?Math.exp(THREE.MathUtils.lerp(Math.log(flight.fromAlt),Math.log(1.1),transformationEase(t/.35))):t>.53?Math.exp(THREE.MathUtils.lerp(Math.log(1.1),Math.log(flight.toAlt),transformationEase((t-.53)/.47))):1.1,turn:transformationEase((t-.27)/.35)}:flightProgress(t,flight.fromAlt,flight.toAlt,flight.toAlt>=flight.fromAlt,host.clientWidth/host.clientHeight);const recall=flight.end==='orbit'?recallFocus(t):0;const fromLat=THREE.MathUtils.lerp(flight.fromLat,flight.anchorLat,recall),fromLon=THREE.MathUtils.lerp(flight.fromLon,flight.anchorLon,recall);lat=THREE.MathUtils.lerp(fromLat,flight.toLat,p.turn);lon=THREE.MathUtils.lerp(fromLon,flight.toLon,p.turn);alt=p.altitude;if(t>=1){targetLat=lat;targetLon=lon;targetAlt=alt;const end=flight.end;flight=null;if(end==='orbit')settledAt=now;setStage(end);}}
 else{if(stage==='orbit'&&viewMode==='globe'&&!morph&&genesisProgress>=1&&openProgress===0&&!personalPlaces&&!targetId&&(!remembering||settledAt!==null&&now-settledAt>6500)&&options.motion&&!compositionOpen&&!comparingLight&&pointer.size===0&&now-lastInteraction>4000)targetLon+=dt*awakening.idleRate;const smooth=options.motion?1-Math.exp(-dt*5):1;lat=THREE.MathUtils.lerp(lat,targetLat,smooth);lon=THREE.MathUtils.lerp(lon,targetLon,smooth);alt=THREE.MathUtils.lerp(alt,targetAlt,smooth);}
 if(morph){
   const elapsed=options.motion?Math.max(0,(now-morph.start-morph.prelude)/morph.duration):1;const t=clamp(elapsed,0,1);
   openProgress=THREE.MathUtils.lerp(morph.from,morph.to,t);
   if(!openTarget){const turn=transformationEase(t);lat=THREE.MathUtils.lerp(morph.fromLat,morph.toLat,turn);lon=THREE.MathUtils.lerp(morph.fromLon,morph.toLon,turn);targetLat=lat;targetLon=lon;}
   if(t>=1){openProgress=morph.to;morph=null;if(openProgress===0&&personalPlaces)personalSettledAt=now;notifyTransformation(true);}else notifyTransformation();
 }
 if(genesisProgress<1){genesisProgress=options.motion?clamp((now-genesisStarted)/GENESIS_DURATION,0,1):1;if(genesisProgress===1)awakening.settle(options.motion);notifyGenesis(genesisProgress===1);}
 notifyAwakening();reliefOcean.material.uniforms.seaMotion.value=awakening.ocean;
 const born=genesisLight(genesisProgress),opened=transformationEase(openProgress);
 for(const key of Object.keys(displayedLight) as (keyof LightOptions)[]){if(typeof options[key]==='number')(displayedLight as unknown as Record<string,number>)[key]=THREE.MathUtils.lerp((displayedLight as unknown as Record<string,number>)[key],(options as unknown as Record<string,number>)[key],reducedMotion||!options.motion?1:1-Math.exp(-dt*5));}
 const levels=lightLevels(alt),global=levels.global;const ease=options.motion?1-Math.exp(-dt*3):1;tilt=THREE.MathUtils.lerp(tilt,targetTilt,ease);cut=THREE.MathUtils.lerp(cut,viewMode==='cutaway'&&options.depth?1:0,ease);depth=THREE.MathUtils.lerp(depth,activeOpenTarget&&scaleTier==='region'&&options.depth?1:spatialBlend(alt,options.depth),ease);terrain=terrainTuning(alt,tilt,cut);scene.userData.spatial={depth,cut,cutNormal,cutFacing};sphere.visible=genesisProgress>=.94&&cut<.02&&opened<.995;sphere.scale.setScalar((1-depth*.30)*(1-opened));scene.userData.coreRadius=sphere.visible?(1-depth*.30)*(1-opened):0;scene.userData.opening=openProgress;scene.userData.genesis=genesisProgress;focus=THREE.MathUtils.lerp(focus,selected?1:0,options.motion?1-Math.exp(-dt*3.2):1);const cityDim=1-focus*.64;const reveal=revealProgress((now-storyStarted)/1000,options.motion);
 north.copy(geo(lon,lat+90));camera.position.copy(geo(lon,lat)).addScaledVector(geo(lon,lat),alt*Math.cos(tilt*R)).addScaledVector(north,-alt*Math.sin(tilt*R));camera.up.copy(north);camera.lookAt(geo(lon,lat).multiplyScalar(born.settled));const w=host.clientWidth,h=host.clientHeight,mobile=w<700;const offsetY=mobile?(compositionOpen?Math.min(170,h*.19):selected?(storyInset?Math.max(0,(storyInset-70)/2):h*.225):openProgress>0?h*.25:personalPlaces&&stage==='orbit'?-h*.09:viewMode==='cutaway'?h*.11:stage==='orbit'&&scaleTier==='planet'?h*.015:-h*.035):0;const desktopInset=stage==='city'?(SPECIAL_CITIES[targetId??'']?.desktopOffset??.17):(compositionOpen||narrativeVisible||openProgress>0||!!personalPlaces)?.17:0;smoothCameraOffset.lerp(new THREE.Vector2(mobile?0:-w*desktopInset*born.settled,offsetY*born.settled),frameCount===1||!options.motion?1:1-Math.exp(-dt*4));const panelZoom=compositionOpen?(mobile?Math.min(1,(h*.57-105)/(Math.min(w*.44,h*.38)*2)):w<=1100?Math.min(1,(w-(w<=1000?328:364)-84)/(Math.min(w*.30,h*.38)*2)):1):1;camera.zoom=THREE.MathUtils.lerp(camera.zoom,panelZoom,!options.motion?1:1-Math.exp(-dt*6));camera.setViewOffset(w,h,smoothCameraOffset.x,smoothCameraOffset.y,w,h);camera.near=Math.max(.0000004,alt*.002);camera.far=65;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 // Project the actual places: the merge follows their visible separation at every viewport.
 let spread=0;if(remembering&&remembered){const places=remembered.places.map(p=>geo(p.lon,p.lat,1.00003).project(camera));for(let i=0;i<places.length;i++)for(let j=i+1;j<places.length;j++)spread=Math.max(spread,Math.hypot((places[i].x-places[j].x)*w/2,(places[i].y-places[j].y)*h/2));}
 const memory=memoryLight(spread,settledAt===null?null:(now-settledAt)/1000,options.motion);
 land.material.uniforms.tint.value.set('#c8ced1').lerp(new THREE.Color('#cbb78f'),displayedLight.warmth);
 land.material.uniforms.opacity.value=global*.65*(1-depth*.8);coast.material.uniforms.opacity.value=global*.44*(1-depth*.2);lights.material.uniforms.opacity.value=displayedLight.nightLights*global*1.12*(1-depth*.40);lights.material.uniforms.sizeScale.value=1-depth*.42;coast.material.uniforms.sizeScale.value=.82-depth*.16;(coastLines.material as THREE.LineBasicMaterial).opacity=global*options.threads*.10*(1-depth)*(1-opened);(borders.material as THREE.LineBasicMaterial).opacity=options.borders?global*.15*(1-cut)*(1-opened):0;edgeM.uniforms.opacity.value=global*(1-depth)*(1-opened)*born.settled;(coastLines.material as THREE.LineBasicMaterial).opacity*=born.settled;(borders.material as THREE.LineBasicMaterial).opacity*=born.settled;for(const c of backgroundLayers)c.material.uniforms.opacity.value=born.settled*displayedLight.skyLight*(.2+.8*global);
 const quality=mobile?.45:.8;const singaporeVisibility=targetId===null||targetId==='singapore'?1:0,newYorkVisibility=targetId==='new-york'?1:0;
 openViews.update(lat,wrap(lon),alt,now,genesisProgress>=1&&openProgress===0&&!flight,options.motion,layerFlags.urban,focusTransition.values[0]);
 updateSignals(time,born.settled*(1-opened));updateSea(time,born.settled*(1-opened));updateWater(time,born.settled*(1-opened));updateUrban(time,levels.city*cityDim);
 specialViews.update(targetId,time,levels.city,levels.regional,levels.cityFraction,levels.citySize,cityScreenBudget(w,h),options.threads,layerFlags.urban,alt);
 for(const [id,context] of contextViews){
  const visibility=targetId===id&&genesisProgress>=1&&openProgress===0?(levels.city*5.5+levels.regional*.8*(1-transformationEase((alt-.012)/.025)))*cityDim:0;
  const bands=continuationScale(alt);
  context.stars.material.uniforms.opacity.value=visibility*bands.far;context.stars.material.uniforms.sizeScale.value=Math.max(.90,levels.citySize*1.4);
  (context.lines.material as THREE.LineBasicMaterial).opacity=Math.min(.09,visibility*options.threads*.035)*bands.far;
  context.intermediate.stars.material.uniforms.opacity.value=visibility*bands.intermediate;context.intermediate.stars.material.uniforms.sizeScale.value=Math.max(.74,levels.citySize*1.25);
  (context.intermediate.lines.material as THREE.LineBasicMaterial).opacity=Math.min(.22,visibility*options.threads*.085)*bands.intermediate;
 }
 if(navigationHighlight)navigationHighlight.material.uniforms.opacity.value=highlightedTargetId?born.settled*(1-opened)*transformationEase((alt-.01)/.06):0;
 if(newYorkStars){newYorkStars.material.uniforms.opacity.value=newYorkVisibility*levels.city*.72;newYorkStars.material.uniforms.sizeScale.value=levels.citySize;newYorkStars.points.geometry.setDrawRange(0,Math.floor(newYorkStars.count*levels.cityFraction*cityScreenBudget(w,h)));}if(newYorkStreets)(newYorkStreets.material as THREE.LineBasicMaterial).opacity=newYorkVisibility*(levels.city*.16+levels.regional*.018)*options.threads;
 for(const c of [reliefLand,reliefOcean,body,interior])c.points.geometry.setDrawRange(0,Math.floor(c.count*quality*(c===reliefLand?options.density:1)));
 const nearDetail=clamp((1.5-alt)/.9,0,1);
 reliefLand.points.userData.sampleBudget=36000+nearDetail*50000;reliefOcean.points.userData.sampleBudget=60000+nearDetail*100000;
 reliefLand.material.uniforms.sizeScale.value=mobile?1.10:1;reliefOcean.material.uniforms.sizeScale.value=mobile?1.18:1;
 reliefLand.material.uniforms.opacity.value=depth*(1.85+terrain.study*.65-opened*.48);reliefOcean.material.uniforms.opacity.value=depth*(1.60+terrain.study*1.35-opened*.70)*(mobile?1.35:1)*(1+(targetId==='challenger-deep'&&scaleTier==='region'?.35:0));body.material.uniforms.opacity.value=depth*(1.30-opened*.55)*(1-terrain.study*.38);interior.material.uniforms.opacity.value=depth*(.82+cut*.70+opened*.15);haze.material.uniforms.opacity.value=depth*(.32+cut*.35+opened*.05);halo.material.uniforms.opacity.value=depth*(.82-opened*.22);
 if(cityStars){cityStars.material.uniforms.opacity.value=singaporeVisibility*levels.city*.70*cityDim;cityStars.material.uniforms.sizeScale.value=levels.citySize;cityStars.points.geometry.setDrawRange(0,Math.floor(cityStars.count*levels.cityFraction*cityScreenBudget(w,h)));}
 if(cityCoast){cityCoast.material.uniforms.opacity.value=singaporeVisibility*levels.coast*cityDim;cityCoast.material.uniforms.sizeScale.value=.60;}
 if(streetLines)(streetLines.material as THREE.LineBasicMaterial).opacity=singaporeVisibility*levels.city*options.threads*.16*cityDim;
 if(regional)(regional.material as THREE.LineBasicMaterial).opacity=singaporeVisibility*levels.regional*(.16+.12*(1-levels.city))*cityDim;
 if(peopleCloud)peopleCloud.material.uniforms.opacity.value=singaporeVisibility*levels.people*1.55*(1-focus);
 if(storyCloud){storyCloud.material.uniforms.opacity.value=remembering?memory.places*1.4:levels.people*1.4;storyCloud.material.uniforms.reveal.value=remembering?1:reveal.stars;}
 if(memoryCloud){memoryCloud.material.uniforms.opacity.value=remembering?memory.glimmer*1.5:0;memoryCloud.material.uniforms.sizeScale.value=memory.size;}
 if(storyLines){(storyLines.material as THREE.LineBasicMaterial).opacity=(remembering?memory.places:levels.people)*.75;storyLines.visible=!!selected||remembering;const count=storyLines.geometry.getAttribute('position').count;storyLines.geometry.setDrawRange(0,2*Math.floor(count/2*(remembering?1:reveal.links)));}
 if(personalCloud){
   personalCloud.material.uniforms.opacity.value=stage==='orbit'?1.65*born.settled:0;personalCloud.material.uniforms.sizeScale.value=1+opened*.16;
   for(let i=0;i<3;i++)personalProjected[i].copy(personalEarth[i]).lerp(personalStars[i],opened);
   if(personalLines){personalLines.visible=stage==='orbit'&&genesisProgress>.96;const a=personalLines.geometry.getAttribute('position') as THREE.BufferAttribute;const values=a.array as Float32Array;for(let i=0;i<values.length;i++)values[i]=personalLineEarth[i]+(personalLineAstra[i]-personalLineEarth[i])*opened;a.needsUpdate=true;(personalLines.material as THREE.LineBasicMaterial).opacity=.25+opened*.30;}
 }
 const thematicFocus=focusTransition.values[0],popFocus=populationFocus.values[0],footFocus=footprintFocus.values[0],connectionFocus=connectionsFocus.values[0];
 const nightFocus=Math.max(0,thematicFocus-Math.max(popFocus,footFocus));
 for(const [field,intensity,own,other,colour] of [[populationField,displayedLight.population,popFocus,footFocus,'#769ebe'],[footprintField,displayedLight.footprint,footFocus,popFocus,'#9b79b4']] as const){if(!field)continue;
  field.material.uniforms.opacity.value=global*born.settled*(1-opened)*intensity*(.85+own*7)*(1-other*.9)*(1-nightFocus*.9)*(1-connectionFocus*.75);
  field.material.uniforms.tint.value.set('#c2b7a5').lerp(new THREE.Color(colour),displayedLight.colour);
  field.material.uniforms.sizeScale.value=.88;
  field.points.geometry.setDrawRange(0,Math.floor(field.count*displayedLight.fieldDensity*(mobile?.6:1)));
 }
 lights.material.uniforms.opacity.value*=1-Math.max(popFocus,footFocus)*.52;
 if(connectionFocus>0){for(const c of [land,coast,reliefLand,reliefOcean,body,interior,haze,halo])c.material.uniforms.opacity.value*=1-connectionFocus*.45;}
 if(thematicFocus>0){for(const c of [land,coast,reliefLand,reliefOcean,body,interior,haze,halo,suspended,currents])c.material.uniforms.opacity.value*=1-thematicFocus*.55;}

 if(nightFocus>0){
  for(const c of [land,coast,reliefLand,reliefOcean,body,interior,haze,halo,suspended,currents])c.material.uniforms.opacity.value*=1-nightFocus*.78;
  lights.material.uniforms.opacity.value*=1+nightFocus*.65;
  lights.material.uniforms.sizeScale.value*=1+nightFocus*.10;
  (coastLines.material as THREE.LineBasicMaterial).opacity*=1-nightFocus;
  (borders.material as THREE.LineBasicMaterial).opacity*=1-nightFocus;
  edgeM.uniforms.opacity.value*=1-nightFocus*.8;
 }
 for(const c of clouds){const u=c.material.uniforms;u.genesis.value=genesisProgress;u.genesisEnabled.value=c.points.userData.spatial&&!c.points.userData.network&&!c.points.userData.oceanVolume&&!c.points.userData.humanField?1:0;if(c.points.userData.baseRegional===undefined)c.points.userData.baseRegional=u.regional.value;const regionOpen=!!activeOpenTarget&&scaleTier==='region'&&!backgroundLayers.includes(c);u.regional.value=regionOpen?1:c.points.userData.baseRegional;u.regionOuter.value=regionOpen?Math.cos(Math.min(1.2,activeOpenTarget!.contextRadiusKm*2.8/6371)):.78;u.regionInner.value=regionOpen?Math.cos(Math.min(.8,activeOpenTarget!.contextRadiusKm*.6/6371)):.975;u.regionMix.value=regionOpen?1:1-transformationEase((alt-.30)/1.1);u.regionFocus.value.copy(geo(lon,lat));u.genesisExposure.value=born.exposure;u.genesisSize.value=born.size;u.opening.value=c.points.userData.spatial||c===personalCloud?openProgress:0;c.points.visible=u.opacity.value>.001&&(c!==storyCloud||!!selected||remembering);u.terrainLand.value=terrain.land;u.terrainFloor.value=terrain.floor;u.terrainStudy.value=terrain.study;u.terrainReady.value=born.settled*(1-opened);u.depthMix.value=depth;u.cutaway.value=cut;u.cameraDistance.value=camera.position.length();u.time.value=time*(c.points.userData.rhythm??1);u.motion.value=options.motion?1:0;u.glow.value=backgroundLayers.includes(c)?.45:options.glow;u.sparkle.value=options.shimmer*(c.points.userData.shimmer??(backgroundLayers.includes(c)?.25:c===land?.8:1));u.zoomFactor.value=backgroundLayers.includes(c)?1:Math.min(1.45,Math.pow(2.1/Math.max(alt,.3),.14))*(mobile?1-global*.4:1);if(c===land)c.points.geometry.setDrawRange(0,Math.floor(c.count*options.density));}
 if(personalSettledAt!==null&&!personalArrivalSent&&!morph&&stage==='orbit'&&(!options.motion||now-personalSettledAt>=1100)&&Math.abs(alt-targetAlt)<.035){personalArrivalSent=true;personalSettledAt=null;callbacks.personalSettled?.();}
 if(settledAt!==null&&!arrivalSent&&(!options.motion||now-settledAt>=1400)){arrivalSent=true;callbacks.arrival(remembered?.id||null);}
 if(!options.motion||frameCount%2===0){placeLabel('singapore',1.30,103.85,stage==='orbit'&&viewMode==='globe'&&!morph&&genesisProgress>=1&&openProgress===0&&!personalPlaces);for(const s of stories)placeLabel(s.id,s.lat,s.lon,stage==='city'&&(targetId===null||targetId==='singapore')&&!selected);for(let i=0;i<3;i++){const p=selected?.places[i];placeLabel('place-'+i,p?.lat||0,p?.lon||0,stage==='city'&&!!p&&reveal.stars>i*.25+.15);}}
 openLabelBoxes.length=0;if(activeOpenTarget)placeLabel('open-selected',activeOpenTarget.lat,activeOpenTarget.lon,scaleTier==='region'&&!flight&&openProgress===0);if(openContext){for(const p of openContext.nearby)placeLabel('open-'+p.id,p.lat,p.lon,scaleTier==='region'&&!flight&&openProgress===0&&(!activeOpenTarget||Math.hypot(p.lat-activeOpenTarget.lat,wrap(p.lon-activeOpenTarget.lon))>.10));}
 for(let i=0;i<3;i++)placePersonalLabel(i,!!personalPlaces&&stage==='orbit'&&openProgress>.72&&!morph);
 if(!isBusy())for(const resolve of idleWaiters.splice(0))resolve(true);
 if(genesisProgress>=1&&!isBusy()&&!warmupScheduled){warmupScheduled=true;warmupTimer=setTimeout(()=>{warmupTimer=null;if(disposed||graphicsLost)return;if(isBusy()){warmupScheduled=false;return;}void ensureCity().then(()=>ensureNewYork()).catch(()=>{host.dataset.detailWarmupStatus='retry-on-demand';});},600);}
 renderer.render(scene,camera);diagnosticFrames++;if(!options.motion||now-diagnosticStart>=1000){host.dataset.presentationFocus=presentation.focus;host.dataset.pathwayExposure=JSON.stringify({air:airPathGates.average,sea:shipPathGates.average,cables:cablePathGates.average});host.dataset.travellerExposure=JSON.stringify({satellites:signalViews[0].activity,aircraft:signalViews[1].activity,ships:signalViews[2].activity,cables:cableTravellerGates.average});if(activeOpenTarget){const d=openViews.diagnostics();host.dataset.openEarth=JSON.stringify({...d,resolver:resolverDiagnostics()});host.dataset.openDetail=openContext?.detailState??'INTERPRETIVE';host.dataset.regionRadiusKm=activeOpenTarget.contextRadiusKm.toFixed(0);host.dataset.openLatitude=lat.toFixed(6);host.dataset.openLongitude=wrap(lon).toFixed(6);}else{delete host.dataset.openEarth;delete host.dataset.openDetail;delete host.dataset.regionRadiusKm;}host.dataset.terrainLand=terrain.land.toFixed(3);host.dataset.terrainFloor=terrain.floor.toFixed(3);host.dataset.oceanAwake=awakening.ocean.toFixed(3);host.dataset.renderFps=(diagnosticFrames*1000/(now-diagnosticStart)).toFixed(1);host.dataset.renderFrames=String(frameCount);if(!fallback){const info=(renderer as THREE.WebGLRenderer).info;host.dataset.renderCalls=String(info.render.calls);host.dataset.renderPoints=String(info.render.points);host.dataset.renderTriangles=String(info.render.triangles);host.dataset.renderGeometries=String(info.memory.geometries);}host.dataset.renderFrameMs=((now-diagnosticStart)/diagnosticFrames).toFixed(1);diagnosticStart=now;diagnosticFrames=0;}if(!options.motion||now-lastCoordinate>500){callbacks.coordinates(lat,wrap(lon));lastCoordinate=now;}
 if(!flight&&frameCount>60&&sampleFrames<150){totalFrame+=dt;sampleFrames++;if(sampleFrames===150&&totalFrame/sampleFrames>.034&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);for(const c of clouds)c.material.uniforms.pixelRatio.value=1;resize();}}
 raf=requestAnimationFrame(frame);
 }
 function visibility(){clearHeld();stillFrames=0;if(document.hidden||graphicsLost){cancelAnimationFrame(raf);}else{lastTime=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}}document.addEventListener('visibilitychange',visibility);
 genesisStarted=performance.now();lastTime=genesisStarted;if(genesisProgress===1)awakening.settle(options.motion);notifyAwakening();callbacks.ready();notifyGenesis(true);notifyTransformation(true);raf=requestAnimationFrame(frame);
 return {audioState,replayGenesis,skipGenesis,command,worldState,transform:setTransformation,personal:setPersonal,descend:async()=>{if(flight||morph||genesisProgress<1||openProgress>0)return;try{personalSettledAt=null;personalArrivalSent=false;clearStory();remembered=null;remembering=false;settledAt=null;arrivalSent=false;activeOpenTarget=undefined;void openViews.setTarget(null);targetId='singapore';scaleTier='city';if(presentation.focus!=='living'){presentation={...presentation,focus:'living'};syncPresentation();}loadingDetail=true;fly(1.2965,103.851,.0018,'city');notifyWorld();try{await ensureCity();}finally{loadingDetail=false;stillFrames=0;notifyWorld();}if(disposed)return;}catch(e){if(!signal.aborted)callbacks.error('Singapore could not load. Your Earth is still here; try entering again.');throw e;}},orbit:()=>{if(flight||morph||stage!=='city')return;clearStory();remembering=!!remembered;settledAt=null;arrivalSent=false;activeOpenTarget=undefined;void openViews.setTarget(null);targetId=null;scaleTier='planet';fly(19,95,homeAltitude(),'orbit');notifyWorld();},zoom,rotate,select,view:setView,region:setRegion,configure:(o)=>{configuredLight={...DEFAULT_LIGHT,...o};if(!comparingLight)options={...configuredLight};reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;for(const transition of activityTransitions)transition.update(layerClock,reducedMotion);if(!o.motion)awakening.advance(0,false);notifyAwakening();if(flight&&!o.motion)flight.duration=0;lastInteraction=performance.now();stillFrames=0;},storyInset:setStoryInset,compositionPanel:(open)=>{compositionOpen=open;stillFrames=0;},narrativePanel:(visible)=>{narrativeVisible=visible;stillFrames=0;},compareLight:(light)=>{comparingLight=!!light;options={...(light??configuredLight),motion:configuredLight.motion};Object.assign(displayedLight,options);lastInteraction=performance.now();stillFrames=0;},dispose:destroy};
}
