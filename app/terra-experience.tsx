'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Minus, Plus, Pause, Play, Layers3, SlidersHorizontal, X, Sparkles, Info, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Engine, Stage, ViewOptions } from '@/lib/terra/engine';
import { stories } from '@/lib/terra/stories';
import { DepthControls } from './depth-controls';
import { type EarthView, type StudyRegion } from '@/lib/terra/spatial';
import { currentVersion } from '@/lib/terra/releases';
import { PersonalConstellationForm } from './personal-constellation-form';
import { validatePersonalPlaces } from '@/lib/personal/model';
import type { PersonalPlaces, TransformationState } from '@/lib/terra/personal-contract';
import { WorldNavigation } from './world-navigation';
import { CompositionControls, type CompositionTab } from './composition-controls';
import type { SoloMemory } from './transport-controls';
import { COMPOSITION_STORAGE, DEFAULT_LIGHT, composition, parseComposition, type Composition } from '@/lib/terra/composition';
import { connectWorldNavigator, publishWorldState, sendWorldCommand } from '@/lib/world/bridge';
import { WORLD_TARGETS, type GenesisState, type WorldState } from '@/lib/world/commands';
import specialStyles from './special-destinations.module.css';
import GlobeVoice from '@/components/terra-voice/GlobeVoice';
import { useSonicEarth } from '@/components/terra-sound/use-sonic-earth';
import SoundControl from '@/components/terra-sound/SoundControl';
import { ConstellationLoading } from './constellation-loading';

const initialOptions = DEFAULT_LIGHT;
const formatCoordinate=(n:number,a:string,b:string)=>`${Math.abs(n).toFixed(2)}° ${n>=0?a:b}`;
export default function TerraExperience(){
 const opening=useRef<HTMLElement>(null);
 const host=useRef<HTMLDivElement>(null),markers=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),coordinate=useRef<HTMLSpanElement>(null);
 const sound=useSonicEarth(()=>engine.current?.audioState()??null);
 const [stage,setStage]=useState<Stage>('orbit'),[ready,setReady]=useState(false),[loadingCity,setLoadingCity]=useState(false),[error,setError]=useState(''),[fatalError,setFatalError]=useState(false),[options,setOptions]=useState<ViewOptions>(initialOptions),[selected,setSelected]=useState<string|null>(null),[returned,setReturned]=useState(false);
 const [view,setView]=useState<EarthView>('globe'),[region,setRegion]=useState<StudyRegion>('indonesia');
 const [remembered,setRemembered]=useState<string|null>(null),[settling,setSettling]=useState(false);
 const [exploring,setExploring]=useState(false),[expanded,setExpanded]=useState(false);
 const [transformation,setTransformation]=useState<TransformationState>({phase:'terra',progress:0,busy:false});
 const [personalPlaces,setPersonalPlaces]=useState<PersonalPlaces|undefined>(),[editingPersonal,setEditingPersonal]=useState(false),[personalReturned,setPersonalReturned]=useState(false),[showDepth,setShowDepth]=useState(false);
 const [discoveryReady,setDiscoveryReady]=useState(false);
 const [introduced,setIntroduced]=useState(false);
 const enterOpening=useCallback(()=>{engine.current?.beginGenesis();setIntroduced(true);},[]);
 const [genesis,setGenesis]=useState<GenesisState>({phase:'core',progress:0,busy:true});
 const [world,setWorld]=useState<WorldState|null>(null);
 const [compositionTab,setCompositionTab]=useState<CompositionTab|null>(null);
 const soloMemory=useRef<SoloMemory|null>(null);
 const composeTrigger=useRef<HTMLButtonElement|null>(null),savedStartup=useRef<Composition|null>(null),preferencesReady=useRef(false),restoringPreferences=useRef(false),lightRevision=useRef(0);
 const [preferencesRestored,setPreferencesRestored]=useState(false);
 const closeComposition=useCallback(()=>{setCompositionTab(null);composeTrigger.current?.focus();},[]);
 const target=world?.resolvedTarget??WORLD_TARGETS.find(t=>t.id===world?.targetId);
 const openTarget=world?.resolvedTarget;const openUrban=!!openTarget&&['city','settlement'].includes(openTarget.kind);
 const isMakkah=world?.targetId==='makkah';
 const isSingapore=!world?.targetId||world.targetId==='singapore';
 const astra=transformation.phase!=='terra';
 const panelObserver=useRef<ResizeObserver|null>(null);
 const measureStory=useCallback((panel:HTMLDivElement|null)=>{panelObserver.current?.disconnect();if(!panel){engine.current?.storyInset(0);return;}const measure=()=>engine.current?.storyInset(panel.offsetHeight+(parseFloat(getComputedStyle(panel).bottom)||0));const observer=new ResizeObserver(measure);panelObserver.current=observer;observer.observe(panel);if(host.current)observer.observe(host.current);measure();},[]);
 const previousStage=useRef<Stage>('orbit');const story=stories.find(x=>x.id===selected);const inCity=stage==='city';const flying=stage==='descending'||stage==='ascending';const approaching=flying&&world?.tier!=='planet';
 const configure=useCallback((partial:Partial<ViewOptions>)=>{lightRevision.current++;setOptions(current=>({...current,...partial}));},[]);
 const compareLight=useCallback((light:ViewOptions|null)=>{engine.current?.compareLight(light);},[]);
 const applyComposition=useCallback(async(c:Composition,restoreLight=true)=>{
  const revision=lightRevision.current;
  const earth=engine.current;if(!earth)throw new Error('Earth is still opening. Try again in a moment.');
  const current=earth.worldState();
  if(current.busy)throw new Error('Let this journey settle before applying a composition.');
  if((current.tier==='city'||current.tier==='street')&&c.presentation.focus!=='living')throw new Error('Return to Planet or Region before applying this geographic lens.');
  if((c.presentation.focus==='population'||c.presentation.focus==='footprint')&&current.humanFields!=='ready')throw new Error('The geographic fields could not load. Your view is unchanged; reload to retry.');
  const result=await earth.command({type:'setPresentation',presentation:c.presentation});if(!result.ok)throw new Error(result.reason??'This lens could not be applied.');
  for(const [layer,enabled] of Object.entries(c.layers)){const result=await earth.command({type:'focusLayer',layer:layer as keyof typeof c.layers,enabled});if(!result.ok)throw new Error(result.reason??'Layer settings could not be applied.');}
  if(restoreLight&&revision===lightRevision.current)configure({...c.light,motion:matchMedia('(prefers-reduced-motion: reduce)').matches?false:c.light.motion});
 },[configure]);
 useEffect(()=>{const controller=new AbortController();let instance:Engine|undefined;let disconnectWorld:(()=>void)|undefined;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let stored:Composition|null=null;try{stored=parseComposition(localStorage.getItem(COMPOSITION_STORAGE)??'');}catch{}savedStartup.current=stored;const opts={...(stored?.light??initialOptions),motion:reduced?false:stored?.light.motion??true};setOptions(opts);
  import('@/lib/terra/engine').then(({createEarth})=>{if(controller.signal.aborted||!host.current||!markers.current)return;return createEarth(host.current,markers.current,{deferGenesis:true,discovery:setDiscoveryReady,genesis:setGenesis,worldState:state=>{setWorld(state);publishWorldState(state);},transformation:setTransformation,personalSettled:()=>{setPersonalReturned(true);setExploring(false);},ready:()=>setReady(true),stage:s=>{setSettling(s==='orbit'&&previousStage.current==='ascending');previousStage.current=s;setStage(s);setExploring(false);},view:setView,arrival:id=>{setReturned(!!id);setSettling(false);},error:(message,fatal=false)=>{setError(message);setFatalError(fatal);if(fatal)setReady(false);},interact:()=>setExploring(true),coordinates:(lat,lon)=>{if(coordinate.current)coordinate.current.textContent=`${formatCoordinate(lat,'N','S')}  /  ${formatCoordinate(lon,'E','W')}`;}},controller.signal,opts);}).then(e=>{if(!e)return;if(controller.signal.aborted){e.dispose();return;}instance=e;engine.current=e;e.configure(opts);setOptions(opts);disconnectWorld=connectWorldNavigator(async command=>{if(command.type==='flyTo'||command.type==='flyToPlace'||command.type==='resetView'||command.type==='setScale'){setSelected(null);setPersonalReturned(false);setEditingPersonal(false);setShowDepth(false);setReturned(false);setRemembered(null);setSettling(false);}return e.command(command);},()=>e.worldState());setWorld(e.worldState());}).catch(e=>{if(e?.name!=='AbortError')setError('The star field could not open. Please try a browser with WebGL enabled, or reload to try again.');});
  return()=>{controller.abort();disconnectWorld?.();instance?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setOptions(current=>({...current,motion:!preference.matches}));preference.addEventListener('change',change);return()=>preference.removeEventListener('change',change);},[]);
 useEffect(()=>{engine.current?.configure(options);},[options]);
 useEffect(()=>{
  const visible=!exploring&&!openTarget&&!astra&&!personalReturned&&!settling&&view==='globe'&&world?.tier!=='region';
  const element=opening.current,canvas=host.current;
  const measure=()=>{const r=element?.getBoundingClientRect(),h=canvas?.getBoundingClientRect();engine.current?.narrativePanel(visible,r&&h?{left:r.left-h.left,right:r.right-h.left,top:r.top-h.top,bottom:r.bottom-h.top}:undefined);};
  measure();const observer=new ResizeObserver(measure);if(element)observer.observe(element);if(canvas)observer.observe(canvas);return()=>observer.disconnect();
 },[exploring,openTarget,astra,personalReturned,settling,view,world?.tier,stage,ready]);
 useEffect(()=>{
  const panel=document.getElementById('composition-panel'),earth=engine.current,canvas=host.current;
  if(!compositionTab||!panel||!earth||!canvas){earth?.compositionPanel(false);return;}
  const measure=()=>{const parent=panel.offsetParent?.getBoundingClientRect()??{left:0,top:0},h=canvas.getBoundingClientRect(),left=parent.left+panel.offsetLeft-h.left,top=parent.top+panel.offsetTop-h.top;earth.compositionPanel(true,{left,top,right:left+panel.offsetWidth,bottom:top+panel.offsetHeight});};
  const observer=new ResizeObserver(measure);observer.observe(panel);observer.observe(canvas);measure();
  return()=>{observer.disconnect();earth.compositionPanel(false);};
 },[compositionTab,ready,genesis.busy,astra]);
 useEffect(()=>{if(!ready||genesis.busy||preferencesReady.current||restoringPreferences.current)return;restoringPreferences.current=true;const c=savedStartup.current;
  const finish=()=>{preferencesReady.current=true;restoringPreferences.current=false;setPreferencesRestored(true);};
  if(c)void applyComposition(c,false).catch(e=>setError(e instanceof Error?e.message:'Saved settings could not be restored.')).finally(finish);else finish();
 },[ready,genesis.busy,applyComposition]);
 useEffect(()=>{if(!ready||!preferencesRestored||!world)return;
  const save=()=>{try{localStorage.setItem(COMPOSITION_STORAGE,JSON.stringify(composition('Last view',options,world.presentation,world.layers)));}catch{}};
  const timer=setTimeout(save,150);window.addEventListener('pagehide',save);
  return()=>{clearTimeout(timer);window.removeEventListener('pagehide',save);};
 },[options,world,ready,preferencesRestored]);
 useEffect(()=>{if(stage!=='city')return;const timer=setTimeout(()=>setExploring(true),4500);return()=>clearTimeout(timer);},[stage]);
 async function descend(){if(!engine.current||loadingCity||flying||astra)return;setPersonalReturned(false);setError('');setLoadingCity(true);setSelected(null);try{await engine.current.descend();setRemembered(null);setReturned(false);}catch{}finally{setLoadingCity(false);}}
 async function enterTarget(){if(!target||(target.id==='challenger-deep'&&world?.tier==='planet')){await descend();return;}const result=await sendWorldCommand({type:'setScale',tier:target.id==='challenger-deep'||openTarget&&!openUrban?'planet':'city'});if(!result.ok)setError(result.reason??'This view could not open.');}
 function openAstra(){if(!engine.current||flying||loadingCity)return;setPersonalReturned(false);setReturned(false);setShowDepth(false);setExploring(false);engine.current.transform(true);}
 function reformEarth(){setEditingPersonal(false);setExploring(false);engine.current?.transform(false);}
 function submitPersonal(input:PersonalPlaces){const result=validatePersonalPlaces(input);if(!result.ok){setError(result.error);return;}setError('');setPersonalPlaces(result.places);setEditingPersonal(false);setPersonalReturned(false);engine.current?.personal(result.places);}
 function clearPersonal(){engine.current?.personal(null);setPersonalPlaces(undefined);setPersonalReturned(false);setEditingPersonal(false);}
 function orbit(){setSelected(null);engine.current?.orbit();}
 function replayGenesis(){setSelected(null);setReturned(false);setPersonalReturned(false);setEditingPersonal(false);setExploring(false);setShowDepth(false);engine.current?.replayGenesis();}
 function choose(id:string|null){if(id)setRemembered(id);setExpanded(false);setSelected(id);engine.current?.select(id);}
 return <main className={`experience stage-${stage} view-${view}${selected?' has-story':''}${remembered?' has-memory':''}${exploring?' is-exploring':''}${settling?' is-settling':''}${options.motion?'':' motion-paused'}${astra?' in-astra':''}${editingPersonal?' editing-personal':''}${personalReturned?' personal-returned':''}${compositionTab?' composing-earth':''}${!introduced||genesis.busy?' genesis-active':ready?' is-born':''}`} data-genesis={genesis.phase} data-scale={world?.tier??'planet'} data-target={world?.targetId??''} data-transformation={transformation.phase}>
  <header className="masthead"><span className="wordmark">TERRA <i aria-hidden="true">✦</i> ASTRA</span><span className="edition">EARTH, CONSTELLATED</span>{ready&&(!genesis.busy||sound.status==='enabled'||sound.status==='paused'||sound.status==='muted')?<SoundControl status={sound.status} onToggle={sound.toggle}/>:null}<Dialog><DialogTrigger asChild><button className="about-button" aria-label="About Terra Astra"><Info size={17}/><span>About</span></button></DialogTrigger><DialogContent className="about-dialog"><DialogTitle className="dialog-title">A sky full of us.</DialogTitle><DialogDescription className="about-intro">We have always looked up to find the stars. Terra Astra imagines what happens when Earth itself becomes a constellation.</DialogDescription><p>A dense stellar core becomes Earth. Follow its light through surface, atmosphere and orbit, then descend into Singapore, New York, Palm Jumeirah or Makkah.</p><p>Orbit, air, sea and street activity are deterministic visualisations, not live tracking. Satellites and aircraft use exaggerated altitudes to reveal the space above Earth. The same celestial material carries the journey from nucleus to street.</p><button className="text-button" onClick={openAstra}>Explore a personal constellation</button><div className="data-note"><h3>The light behind the world</h3><p>Geography: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a>. City light patterns: <a href="https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/" target="_blank" rel="noreferrer">NASA Black Marble, 2016</a>, artistically sampled from the historical composite. Light intensity does not represent population.</p><p>Population light: <a href="https://doi.org/10.7927/H49C6VHW" target="_blank" rel="noreferrer">CIESIN GPWv4 Revision 11, 2020 estimates</a> (CC BY 4.0), via the Stanford Natural Capital Project. Human-footprint light: <a href="https://doi.org/10.5061/dryad.052q5" target="_blank" rel="noreferrer">Venter et al., 2009</a> (CC0), via WCS. Both historical grids are resampled and artistically represented as particles; colours and brightness are not a quantitative legend. They do not describe current conditions.</p><p>Air connections: <a href="https://openflights.org/data" target="_blank" rel="noreferrer">OpenFlights / Airline Route Mapper, June 2014</a>. A bounded historical selection joins airport endpoints with illustrative arcs; these are not current services or flown tracks. <a href="/data/networks/air-connections.json" download>Derived connection database</a> · <a href="/data/networks/airports.json" download>Airport key</a> · <a href="/data/networks/OPENFLIGHTS-LICENSE.txt">ODbL licence</a>. Marine branches use Natural Earth coastal regions and ETOPO water constraints; they are not actual shipping or cable routes.</p><p>Terrain and ocean depth: <a href="https://www.ncei.noaa.gov/products/etopo-global-relief-model" target="_blank" rel="noreferrer">NOAA ETOPO 2022</a>.</p><p>Street geometry: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>, Singapore snapshot retrieved 9 September 2026; New York, Palm Jumeirah and Makkah snapshots retrieved 13 September 2026. Authored detail covers central Singapore and a curated lower-Manhattan neighbourhood. Open Earth resolves places from Natural Earth and sourced OpenStreetMap records. Generic local roads are delivered by OpenFreeMap using OpenMapTiles; unavailable detail falls back to broader context. Generic urban light is interpretive, never a mapped street network. Dim surrounding city fields are impressionistic continuations, not surveyed roads. Palm and Makkah use bounded snapshots. Makkah’s collective flow is illustrative and does not represent measured crowd density.</p><p>Fine undersea filaments illustrate a connected global network; soft sea corridors carry imagined maritime activity. They do not show actual cable alignments, owners, landing stations, navigation routes or live tracking. The distant sky is an illustrative, seeded star field, not an astronomical catalogue. Sparse ocean light suggests water volume; its slow gyres are interpretive, not measured currents. Narrow straits and canal connections are schematic.</p><p>Relief follows NOAA ETOPO 2022 land and seafloor elevation, sampled for a globe view and exaggerated for visibility. The interior light is imagined material. The three human stories are fictional. Their stars represent imagined connections to real places, with no real people or live location data.</p></div><p className="about-ending">The constellation was us all along.</p><a className="about-history-link" href="/history">Build history · v{currentVersion}</a></DialogContent></Dialog></header>
  <div ref={host} className="universe" />
  {genesis.busy&&ready&&introduced?<button className="genesis-skip" onClick={()=>engine.current?.skipGenesis()}>Skip introduction</button>:null}
  <div ref={markers} className="map-markers" aria-label="Explore the constellations">
   <button hidden data-star="singapore" className="map-star destination-star" onClick={descend} disabled={loadingCity}><span className="star-anchor" aria-hidden="true">✦</span><span className="marker-label">Singapore <ArrowDown size={12}/></span></button>
   {stories.map(s=><button hidden key={s.id} data-star={s.id} className="map-star human-star" onClick={()=>choose(s.id)} aria-label={`Discover ${s.name}'s constellation`}><span className="star-anchor" aria-hidden="true">✦</span><span className="marker-label">{s.name}</span></button>)}
   {[0,1,2].map(i=><div hidden key={i} data-star={`place-${i}`} className="map-star place-marker"><span className="star-anchor" aria-hidden="true">✦</span><span className="marker-label">{story?.places[i]?.label}</span></div>)}
   {openTarget?<div hidden data-star="open-selected" className="map-star open-selected"><span className="star-anchor" aria-hidden="true">✦</span><span className="marker-label">{openTarget.label}</span></div>:null}
   {world?.open?.nearby.map(p=><button hidden key={p.id} data-star={'open-'+p.id} className="map-star open-settlement" onClick={()=>void sendWorldCommand({type:'flyToPlace',query:p.label})}><span className="marker-label">{p.label}</span></button>)}
   {[0,1,2].map(i=><div hidden key={`personal-${i}`} data-star={`personal-${i}`} className="map-star place-marker personal-marker"><span className="marker-label">{personalPlaces?.[i]?.label.split(',')[0]}</span></div>)}
  </div>
  {!error&&!introduced?<ConstellationLoading ready={ready} motion={options.motion} onComplete={enterOpening}/>:null}
  {error?<div className="error-message" role="alert"><p>{error}</p><button onClick={()=>ready&&!fatalError?setError(''):location.reload()}>{fatalError?'Restart journey':ready?'Dismiss':'Try again'}</button></div>:null}
  <section ref={opening} className="opening" aria-live="polite" aria-hidden={!!openTarget||astra||personalReturned||settling||exploring||view!=='globe'}>
   <p className="eyebrow" hidden={stage==='orbit'||inCity&&isMakkah}>{stage==='orbit'?'A LIVING CELESTIAL EARTH':stage==='city'?'A CITY, ALIVE':!approaching?'PART OF SOMETHING LARGER':'A LITTLE CLOSER'}</p>
   {stage==='orbit'?<><h1>Earth,<br/><em>constellated.</em></h1><p key={returned?'recalled':'opening'} className={returned?'return-line':undefined}>{returned?<>The constellation<br/>was us all along.</>:<>Born from stars.<br/>Alive at every scale.</>}</p></>:inCity&&isMakkah?<><h1>Makkah.<br/><em>Masjid al-Haram.</em></h1><p>Collective movement around the Kaaba.<br/>An interpretive flow, never live tracking.</p></>:inCity?<><h1>{target?.label??'Singapore'},<br/><em>alive.</em></h1><p>{target?.id==='palm-jumeirah'?<>A city drawn into the sea.<br/>Light follows its designed geometry.</>:isSingapore?<>City, island, constellation.<br/>Everyday life gathers in the light.</>:<>A city in motion.<br/>Roads become rivers of light.</>}</p></>:<><h1>{approaching?'Coming':'Going'}<br/><em>{approaching?'closer.':'beyond.'}</em></h1><p>{approaching?'A planet becomes a place.':remembered?'A life becomes part of the world.':'A city becomes part of the world.'}</p></>}
  </section>
  {stage==='orbit'&&!astra&&!personalReturned?<div className="terra-invitation">
   <WorldNavigation state={world} disabled={!ready||loadingCity||genesis.busy} onReplay={replayGenesis} onDepth={()=>setShowDepth(true)}/>
   <button className="text-button depth-toggle" aria-expanded={showDepth} onClick={()=>setShowDepth(!showDepth)}>{showDepth?'Close depth study':"Explore Earth's depth"}</button>
  </div>:null}
  {stage==='orbit'&&!astra&&showDepth?<DepthControls view={view} region={region} activeTargetLabel={world?.tier==='region'?target?.label:undefined} depth={options.depth} disabled={!ready||loadingCity} onView={mode=>engine.current?.view(mode)} onRegion={id=>{setRegion(id);engine.current?.region(id);}} onDepth={depth=>configure({depth})}/>:null}
  {astra?<section className={`personal-panel${editingPersonal?' personal-panel-editing':''}`} aria-label="Your personal constellation">
   {editingPersonal?<><div className="personal-panel-heading"><button className="personal-close" onClick={()=>setEditingPersonal(false)} aria-label="Close place chooser"><X size={18}/></button></div><PersonalConstellationForm initialValue={personalPlaces} disabled={transformation.busy} onSubmit={submitPersonal} onReset={()=>{}}/></>:personalPlaces?<>
    <h2>Your<br/><em>constellation.</em></h2>
    <ol className="personal-place-list">{personalPlaces.map((p,i)=><li key={p.id}><span className="personal-star-number">{i+1}</span><div><strong>{p.label}</strong><p>{p.meaning}</p></div></li>)}</ol>
    <button className="journey-button" disabled={transformation.busy} onClick={reformEarth}>Return to Earth <ArrowUp size={18}/></button>
    <div className="personal-secondary"><button className="text-button" disabled={transformation.busy} onClick={()=>setEditingPersonal(true)}>Change my places</button><button className="text-button" disabled={transformation.busy} onClick={clearPersonal}>Clear</button></div>
   </>:<>
    <h2>A universe,<br/><em>within.</em></h2>
    <p className="personal-intro">The world opens.<br/>The places we carry become stars.</p>
    <button className="journey-button" disabled={transformation.busy} onClick={()=>setEditingPersonal(true)}>Find my constellation <Sparkles size={18}/></button>
    <button className="text-button" disabled={transformation.busy} onClick={reformEarth}>Reform Earth</button>
   </>}
  </section>:null}
  {personalReturned&&!astra&&stage==='orbit'?<section className="personal-ending" aria-live="polite"><h1>The constellation<br/>was us<br/><em>all along.</em></h1><p>{personalPlaces?.map(p=>p.label).join(' · ')}</p><button className="text-button" onClick={openAstra}>Visit my constellation <Sparkles size={16}/></button></section>:null}
  {transformation.busy?<p className="transformation-status" role="status">{transformation.phase==='opening'?'Earth is opening into Astra…':'Your stars are finding Earth…'}</p>:null}
  {openTarget&&!astra&&world?.tier!=='planet'&&!flying?<aside className="open-world-context" aria-label="Place context">
   <h2>{openTarget.label}</h2><p>{openTarget.region||openTarget.kind} · {world?.tier==='region'?`${Math.round(openTarget.contextRadiusKm)} km regional context`:world?.tier==='city'?`${Math.round(openTarget.cityRadiusKm*2)} km metropolitan context`:'Moving local view'}</p>
   {world?.tier==='region'&&world.open?.nearby.length?<div className="nearby-places" aria-label="Nearby settlements">{world.open.nearby.slice(0,4).map(p=><button key={p.id} onClick={()=>void sendWorldCommand({type:'flyToPlace',query:p.label})}>{p.label}<span>{p.distanceKm} km</span></button>)}</div>:null}
   {world?.tier==='region'?<button className="text-button connection-study" onClick={()=>void sendWorldCommand({type:'setPresentation',presentation:{focus:world.presentation?.focus==='connections'?'living':'connections'}})}>{world.presentation?.focus==='connections'?'Return to Living Earth':'Study illustrated connections'}</button>:null}
   <details className="open-provenance"><summary>{world?.open?.detailLoading?'Preparing local context…':world?.open?.detailState==='DETAILED'?'Sourced local roads':world?.open?.detailState==='SIMPLIFIED'?'Sourced major roads':'Geography & interpretive light'}</summary><p>{world?.open?.detailMessage}</p><p><a href={openTarget.sourceUrl} target="_blank" rel="noreferrer">{openTarget.source}</a>. {world?.open?.detailState!=='INTERPRETIVE'?<>Roads: <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>, © OpenMapTiles / <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</>:null} City light is interpretive. No live tracking.</p></details>
  </aside>:null}
  <div className="view-tools" aria-label="View controls">
   <button disabled={!ready||flying||transformation.busy||genesis.busy||astra} aria-label="Choose Earth layers" title="Choose Earth layers" aria-controls="composition-panel" aria-expanded={compositionTab==='layers'} onClick={e=>{composeTrigger.current=e.currentTarget;setCompositionTab(compositionTab==='layers'?null:'layers');}}><Layers3 size={18}/></button>
   <button onClick={()=>location.reload()} aria-label="Restart journey" title="Restart journey"><RotateCcw size={17}/></button>
   <button disabled={!ready||flying||transformation.busy||genesis.busy} onClick={()=>engine.current?.zoom(.80)} aria-label="Zoom in" title="Zoom in"><Plus size={19}/></button><button disabled={!ready||flying||transformation.busy||genesis.busy} onClick={()=>engine.current?.zoom(1.25)} aria-label="Zoom out" title="Zoom out"><Minus size={19}/></button><span className="tool-divider"/>
   <button disabled={!ready} onClick={()=>configure({motion:!options.motion})} aria-label={options.motion?'Pause world animation':'Resume world animation'} title={options.motion?'Pause world animation':'Resume world animation'}>{options.motion?<Pause size={16}/>:<Play size={16}/>}</button>
   <button disabled={!ready||genesis.busy||astra} aria-label="Adjust the constellations" title="Adjust the constellations" aria-controls="composition-panel" aria-expanded={compositionTab==='light'} onClick={e=>{composeTrigger.current=e.currentTarget;setCompositionTab(compositionTab==='light'?null:'light');}}><SlidersHorizontal size={18}/></button>
  </div>
  {compositionTab&&ready&&!genesis.busy&&!astra?<CompositionControls soloMemory={soloMemory} tab={compositionTab} setTab={setCompositionTab} onClose={closeComposition} options={options} onChange={configure} state={world} onApply={applyComposition} onCompare={compareLight} disabled={!!world?.busy||!preferencesRestored}/>:null}
  {ready&&!genesis.busy&&!astra&&world?.presentation?.focus!=='living'?<button className="active-earth-lens" onClick={e=>{composeTrigger.current=e.currentTarget;setCompositionTab('layers');}}>{({'night-lights':'Night lights · NASA 2016',population:'Population · 2020',footprint:'Human footprint · 2009',connections:'Illustrated connections',living:'Living Earth'} as const)[world?.presentation?.focus??'living']}</button>:null}
  {ready&&!genesis.busy&&!astra?<nav className="scale-navigation" aria-label="World scale">{(['planet','region','city','street'] as const).map(tier=><button key={tier} title={{planet:"The whole Earth",region:"Coastlines and wider context",city:"The city and its movement",street:"Close to the detailed streets"}[tier]} aria-current={world?.tier===tier?'step':undefined} disabled={!!world?.busy||(!world?.targetId&&tier!=='planet')||((world?.targetId==='challenger-deep'||!!openTarget&&!openUrban)&&(tier==='city'||tier==='street'))} onClick={()=>void sendWorldCommand({type:'setScale',tier})}>{tier}</button>)}</nav>:null}
  <div className="journey-bar">
   <div className="journey-location"><span className="journey-index scale-name">{astra?'Astra':world?.tier??'planet'}</span><div><span className="location-label">{astra?'ASTRA':personalReturned?'YOUR EARTH':selected?story?.name.toUpperCase():(inCity||world?.tier==='region')?(target?.label.toUpperCase()??'SINGAPORE'):stage==='descending'?`APPROACHING ${target?.label.toUpperCase()??'SINGAPORE'}`:stage==='ascending'?'RETURNING TO ORBIT':'PLANET EARTH'}</span><span ref={coordinate} className="coordinates">19.00° N / 95.00° E</span></div></div>
   <span className={`gesture-hint ${inCity&&isMakkah?specialStyles.flowDisclosure:''}`}>{transformation.busy?'':astra?'Drag to explore the space between':flying?'':selected?'A life, held by its places':openTarget?'Sourced geography · Interpretive light':inCity?(isMakkah?'Interpretive flow · No live tracking':'Procedural activity · Drag to explore'):'Drag to orbit · Scroll or pinch to approach'}</span>
   {astra?<button className="journey-button return-button" disabled={transformation.busy} onClick={reformEarth}><span>Reform Earth</span><ArrowUp size={18}/></button>:inCity?<button className="journey-button return-button" onClick={orbit}><span>Return to orbit</span><ArrowUp size={18}/></button>:<button className={`journey-button${stage==='orbit'&&world?.tier==='planet'?' home-entry':''}`} disabled={!ready||flying||loadingCity} onClick={()=>void enterTarget()}><span>{loadingCity?'Gathering Singapore…':flying?(!approaching?'Returning to orbit…':'Following the light…'):(target?.id==='challenger-deep'||!!openTarget&&!openUrban)&&world?.tier!=='planet'?'Return to planet':`Enter ${openUrban?target?.label:target?.tier==='city'?target.label:'Singapore'}`}</span>{stage==='ascending'||(target?.id==='challenger-deep'&&world?.tier==='region')?<ArrowUp size={18}/>:<ArrowDown size={18}/>}</button>}
  </div>
  <footer className="credits"><span><span className="geography-credit-long">Geography: Natural Earth / NOAA ETOPO <span className="credit-dot">·</span> Night lights: NASA, 2016</span><span className="geography-credit-short">Natural Earth · NOAA ETOPO · NASA, 2016</span></span><span className="credit-links">{openTarget?<a className="open-data-credit" href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap © OpenMapTiles</a>:null}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a><a className="version-link" href="/history" aria-label={`Build history, version ${currentVersion}`}>v{currentVersion}</a></span></footer>
  {inCity&&isSingapore&&!selected?<div className="story-access" aria-label="Human constellations">{stories.map(s=><button key={s.id} onClick={()=>choose(s.id)}><Sparkles size={13}/>{s.name}</button>)}<span>Three imagined lives</span></div>:null}
  <Sheet modal={false} open={!!story&&inCity} onOpenChange={open=>{if(!open)choose(null);}}>
   <SheetContent ref={measureStory} side="bottom" className={`story-sheet${expanded?' story-expanded':''}${options.motion?'':' motion-paused'}`} showCloseButton={false} onInteractOutside={e=>e.preventDefault()}>
    <button className="story-close" onClick={()=>choose(null)} aria-label="Close this constellation"><X size={18}/></button>
    {story?<div className="story-reveal">
     <p className="eyebrow">03 / A HUMAN CONSTELLATION</p>
     <SheetTitle className="story-name">{story.name}</SheetTitle>
     <SheetDescription className="story-subtitle">{story.subtitle}</SheetDescription>
     <blockquote key={story.id} className="story-first-line">{story.quote}</blockquote>
     <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild><button className="text-button story-read">{expanded?'Let the stars speak':`Explore ${story.name}’s story`}<span aria-hidden="true">{expanded?'−':'+'}</span></button></CollapsibleTrigger>
      <CollapsibleContent className="story-details">
       <p className="story-body">{story.body}</p>
       <ol className="life-places">{story.places.map(p=><li key={p.label}><span>{p.label}</span><p>{p.meaning}</p></li>)}</ol>
      </CollapsibleContent>
     </Collapsible>
     <p className="fiction-label">An imagined life, connected to real places.</p>
     <button className="text-button next-life" onClick={()=>choose(stories[(stories.findIndex(s=>s.id===story.id)+1)%stories.length].id)}>Discover another life <span aria-hidden="true">↗</span></button>
    </div>:null}
   </SheetContent>
  </Sheet>
  <noscript><p className="error-message">Enable JavaScript to explore Terra Astra.</p></noscript>
  {ready&&!genesis.busy&&!astra?<GlobeVoice ready={ready} worldState={world} exploring={exploring} discoveryReady={discoveryReady} onVoiceOutput={sound.setVoiceOutput}/>:null}
 </main>;
}
