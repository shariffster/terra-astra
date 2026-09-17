// Exercise the real engine lifecycle with a deterministic clock and inert Canvas surface.
// This verifies behavior and geography, not rendered pixels or browser performance.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import * as THREE from 'three';
import { openingFrame, openingPosition, transformationEase } from '../lib/terra/transformation.ts';
import { personalGeography, personalCamera, personalAstra, personalArc } from '../lib/terra/personal-rendering.ts';
import { scintillation } from '../lib/terra/scintillation.ts';
import { memoryLight, cityScreenBudget } from '../lib/terra/choreography.ts';

const root = new URL('../lib/', import.meta.url).href;
registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.startsWith(root) && specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(specifier + '.ts', context);
  return next(specifier, context);
} });
let clock = 0, frame = null, resizeCallback = null;
const noop = () => {};
const ctx = new Proxy({ createRadialGradient: () => ({ addColorStop: noop }) }, { get: (o, key) => o[key] ?? noop, set: (o, key, value) => { o[key] = value; return true; } });
let graphicsLostCallback=null,keyCallback=null,keyUpCallback=null;
class Canvas {
  style = {}; width = 1; height = 1;
  getContext(type) { return type === '2d' ? ctx : null; }
  addEventListener(type,callback) {if(type==='webglcontextlost')graphicsLostCallback=callback;if(type==='keydown')keyCallback=callback;} removeEventListener() {} setAttribute() {} remove() {}
}
globalThis.document = { hidden: false, createElement: () => new Canvas(), createElementNS: () => new Canvas(), addEventListener: noop, removeEventListener: noop };
globalThis.window = { devicePixelRatio: 1, innerWidth: 1363, addEventListener(type,fn){if(type==='keyup')keyUpCallback=fn;},removeEventListener:noop };
globalThis.matchMedia = () => ({ matches: false });
globalThis.ResizeObserver = class { constructor(callback) { resizeCallback = callback; } observe() {} disconnect() {} };
globalThis.Path2D = class { moveTo() {} lineTo() {} };
globalThis.requestAnimationFrame = callback => { frame = callback; return 1; };
globalThis.cancelAnimationFrame = () => { frame = null; };
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock } });
globalThis.fetch = async path => new Response(await readFile(new URL('../public' + path, import.meta.url)));
const host = { clientWidth: 1363, clientHeight: 936, dataset: {}, appendChild: noop, addEventListener: noop, removeEventListener: noop };
const stages = [], states = [], genesisStates=[], worldStates=[], views=[];let personalArrivals=0;
let rendered = null;
const { CanvasStarRenderer } = await import('../lib/terra/canvas-renderer.ts');
// Pixel review is done separately in the preview browser. Capture the real engine's
// scene and camera here without spending the lifecycle test drawing inert sprites.
CanvasStarRenderer.prototype.render = (scene, camera) => { rendered = { scene, camera }; };

const { createEarth } = await import('../lib/terra/engine.ts');
const engine = await createEarth(host, { querySelector: () => null }, {
  view:v=>views.push(v),genesis:s=>genesisStates.push(s),worldState:s=>worldStates.push(s),ready: noop, coordinates: noop, interact: noop, arrival: noop,
  stage: s => stages.push(s), transformation: state => states.push(state), personalSettled: () => personalArrivals++, error: message => {if(!message.includes('Graphics became unavailable'))assert.fail(message);},
}, new AbortController().signal);

const tick=(ms=60)=>{clock+=ms;const next=frame;frame=null;assert.ok(next);next(clock);};

engine.skipGenesis();
const baseOptions={glow:1.15,shimmer:1.1,depth:true,threads:.55,density:.85,borders:false,motion:false,travellerVolume:1,airLight:1,seaLight:1,cableLight:1,orbitLight:1};engine.configure(baseOptions);tick();
const objects=()=>{const result=[];rendered.scene.traverse(o=>{if(o instanceof THREE.Points)result.push(o);});return result;};
assert.deepEqual(objects().filter(o=>o.userData.backgroundDepth).map(o=>o.userData.backgroundDepth).sort((a,b)=>a-b),[36,42,48],'Three distant background shells');assert.equal(engine.worldState().layers.ships,true,'Sea movement starts enabled');assert.ok(objects().some(o=>o.userData.seaBackbone),'Existing engine carries illustrated sea pulses');
const sky=()=>objects().filter(o=>o.userData.backgroundDepth);
assert.equal(sky().reduce((n,o)=>n+o.geometry.getAttribute('position').count,0),4420,'Bounded distant field');
assert.ok(sky().every(o=>o.material.uniforms.sparkle.value===0),'Distant stars remain steady');
const dust=()=>objects().filter(o=>o.userData.stellarDust);
assert.equal(dust().reduce((n,o)=>n+o.geometry.getAttribute('position').count,0),7200,'Bounded optional dust');
assert.ok(dust().every(o=>o.material.uniforms.opacity.value===0),'Dust starts off');
engine.narrativePanel(false);tick();assert.equal(rendered.camera.view.offsetX,0,'Earth recentres when the narrative leaves');
engine.compositionPanel(true);tick();assert.ok(rendered.camera.view.offsetX<0,'Controls reserve left space');
const comparisonCamera=rendered.camera.position.clone(),comparisonWorld=engine.worldState();
const {DEFAULT_LIGHT}=await import('../lib/terra/composition.ts');engine.compareLight({...DEFAULT_LIGHT,motion:false,skyLight:0,skyDust:.6});tick();
assert.ok(sky().every(o=>o.material.uniforms.opacity.value===0),'Comparison can remove stars independently');
assert.ok(dust().every(o=>o.material.uniforms.opacity.value>0),'Dust can show without stars');
assert.deepEqual(engine.worldState(),comparisonWorld,'Light comparison never changes world choices');assert.deepEqual(rendered.camera.position,comparisonCamera,'Comparison preserves the camera');
engine.compareLight(null);tick();assert.ok(sky().every(o=>o.material.uniforms.opacity.value>0),'Comparison release restores configured sky');assert.ok(dust().every(o=>o.material.uniforms.opacity.value===0),'Comparison restores dust setting');engine.compositionPanel(false);engine.narrativePanel(true);tick();
const shells=()=>objects().filter(o=>['satellites','aircraft'].includes(o.userData.shell));
assert.equal(shells().length,2,'One orbital and one atmosphere shell');
// Integration contract: at full traveller density, populations remain unit acoustic activity.
const acoustic=engine.audioState();
assert.deepEqual([acoustic.activity.satellites,acoustic.activity.aircraft,acoustic.activity.ships,acoustic.activity.network],[1,1,1,1]);
assert.deepEqual(acoustic.world,engine.worldState());
assert.equal(acoustic.seconds,engine.audioState().seconds,'Reading sound never advances the renderer clock');
const network=objects().find(o=>o.userData.seaBackbone);
const {livingExposure}=await import('../lib/terra/living-material.ts');
for(const visibility of [0,.25,.5,1]){
 network.material.uniforms.opacity.value=.74*livingExposure(acoustic.altitude).cables*visibility;
 objects().find(o=>o.userData.seaBackbone&&o!==network).material.uniforms.opacity.value=1.7*livingExposure(acoustic.altitude).cables*visibility;
 assert.ok(Math.abs(engine.audioState().activity.network-visibility)<1e-12,'Network shader exposure is normalized to accepted unit activity');
}
for(const layer of ['satellites','aircraft','ships']){
 const cloud=objects().find(o=>o.userData.shell===layer),full=cloud.geometry.drawRange.count;
 cloud.geometry.setDrawRange(0,full/2);
 assert.equal(engine.audioState().activity[layer],.5,'Half of any new population remains half acoustic intensity');
 cloud.geometry.setDrawRange(0,full);
}

const radii=shells().map(o=>{const a=o.geometry.getAttribute('position');return [o.userData.shell,...Array.from({length:a.count},(_,i)=>Math.hypot(a.getX(i),a.getY(i),a.getZ(i)))];});
for(const [layer,...values] of radii)assert.ok(values.every(r=>layer==='satellites'?r>=1.19&&r<=1.39:r>=1.024&&r<1.19),'Air clears sculpted land and remains below orbital shells');
const paused=shells().map(o=>o.geometry.getAttribute('position').array.slice());engine.rotate(20,4);tick(1000);for(let i=0;i<2;i++)assert.deepEqual(shells()[i].geometry.getAttribute('position').array,paused[i],'Pause holds actual shell positions during camera interaction');
engine.configure({...baseOptions,motion:true});tick(1000);assert.notDeepEqual(shells()[0].geometry.getAttribute('position').array,paused[0]);engine.configure(baseOptions);tick();
async function complete(cmd){let done=false,result;const pending=engine.command(cmd).then(v=>{done=true;result=v;});for(let i=0;i<150&&!done;i++){await new Promise(resolve=>setImmediate(resolve));tick(100);}assert.ok(done,'Command resolves within bounded lifecycle');await pending;return result;}
assert.equal((await complete({type:'focusLayer',layer:'satellites',enabled:false})).ok,true);for(let i=0;i<20;i++)tick();assert.equal(shells().find(o=>o.userData.shell==='satellites').visible,false);
assert.equal((await complete({type:'focusLayer',layer:'satellites',enabled:true})).ok,true);for(let i=0;i<105;i++)tick();assert.equal(shells().find(o=>o.userData.shell==='satellites').visible,true);
// Presentation preferences survive a thematic focus and its interrupted return.
await complete({type:'focusLayer',layer:'ships',enabled:false});for(let i=0;i<20;i++)tick();
await complete({type:'setPresentation',presentation:{focus:'night-lights'}});for(let i=0;i<30;i++)tick();
assert.equal(engine.worldState().layers.ships,false);assert.equal(engine.worldState().layers.cables,true);
assert.ok(Object.values(engine.audioState().activity).slice(0,4).every(n=>n===0),'Focused night light silences faded transport');
await complete({type:'setPresentation',presentation:{keepActivity:true}});for(let i=0;i<105;i++)tick();
assert.equal(engine.audioState().activity.aircraft,1);assert.equal(engine.audioState().activity.ships,0);assert.equal(engine.audioState().activity.network,1);
await complete({type:'setPresentation',presentation:{focus:'living',pathways:false,keepActivity:false}});for(let i=0;i<30;i++)tick();
assert.equal(network.visible,false,'Pathway toggle hides resting cable strokes');assert.equal(engine.audioState().activity.network,1,'Visible pulses retain their existing sound activity');
await complete({type:'focusLayer',layer:'cables',enabled:false});for(let i=0;i<20;i++)tick();assert.equal(engine.audioState().activity.network,0);
await complete({type:'setPresentation',presentation:{pathways:true}});
await complete({type:'focusLayer',layer:'cables',enabled:true});await complete({type:'focusLayer',layer:'ships',enabled:true});for(let i=0;i<105;i++)tick();
assert.equal(engine.audioState().activity.ships,1);assert.equal(engine.worldState().presentation.focus,'living');
const keyTarget={matches:()=>false,isContentEditable:false,closest:()=>null};const press=(key,extra={})=>{let prevented=false;keyCallback({key,target:keyTarget,preventDefault(){prevented=true;},...extra});return prevented;};const releaseKey=key=>keyUpCallback({key});const keyboardPose=rendered.camera.position.clone();assert.equal(press('q'),true);tick();releaseKey('q');assert.ok(rendered.camera.position.distanceTo(keyboardPose)>.01,'Focused canvas Q orbits');const afterOrbit=rendered.camera.position.clone();assert.equal(press('w',{target:{matches:()=>true}}),false);tick();assert.deepEqual(rendered.camera.position.toArray(),afterOrbit.toArray(),'Typing target ignored');assert.equal(press('w',{ctrlKey:true}),false);tick();assert.deepEqual(rendered.camera.position.toArray(),afterOrbit.toArray(),'Browser modifier shortcut ignored');const oldRadius=rendered.camera.position.length();press('r');tick();releaseKey('r');assert.ok(rendered.camera.position.length()<oldRadius,'R zooms inward');press('t');tick();releaseKey('t');assert.equal(views.at(-1),'oblique','T tilts through existing camera');press('g');tick();releaseKey('g');assert.equal(views.at(-1),'globe');
// A fixed renderer clock proves diagonal speed independently of browser timing.
const heldLengths=[];
for(const keys of ['w','wa','wd','sa','sd']){
 await complete({type:'resetView'});const start=engine.audioState();
 for(const key of keys)press(key);
 for(let frame=0;frame<10;frame++)tick(20);
 for(const key of keys)releaseKey(key);tick(20);
 const end=engine.audioState();heldLengths.push(Math.hypot(end.longitude-start.longitude,end.latitude-start.latitude));
}
for(const length of heldLengths)assert.ok(Math.abs(length-heldLengths[0])<1e-10,'Simultaneous diagonals have exactly the axial displacement at fixed elapsed time');
// Direct entry may complete its zero-motion flight before async detail arrives.
// Subscribers must receive the later ready state so scale buttons unlock.
await complete({type:'setPresentation',presentation:{focus:'night-lights'}});
const directEntry=engine.descend();tick(100);await directEntry;tick();assert.equal(engine.worldState().presentation.focus,'living','Direct city entry restores Living Earth too');
assert.equal(worldStates.at(-1).busy,false,'Direct reduced-motion arrival publishes detail readiness');
engine.orbit();tick();for(let i=0;i<30;i++)tick(); // Let the Night-light focus fade finish before comparing later view exposure.
assert.equal((await complete({type:'flyTo',targetId:'new-york'})).ok,true);assert.equal(engine.worldState().targetId,'new-york');assert.equal(engine.worldState().tier,'city');assert.equal(stages.at(-1),'city');
assert.ok(Math.abs(Math.atan2(rendered.camera.position.y,Math.hypot(rendered.camera.position.x,rendered.camera.position.z))*180/Math.PI-40.721562)<.01,'New York camera reaches true target');
assert.equal(shells().every(o=>!o.visible),true,'Global shells fade by city scale');assert.equal(engine.audioState().activity.network,0,'Hidden local cable shader cannot feed the network bus');assert.ok(objects().filter(o=>o.userData.seaBackbone).every(o=>!o.visible),'Sea backbone fades before city scale');
const nyBands=objects().filter(o=>o.userData.cityContinuation==='new-york');
const nyNear=nyBands.find(o=>o.userData.cityContinuationBand==='intermediate'),nyFar=nyBands.find(o=>o.userData.cityContinuationBand==='far');
assert.ok(nyNear?.visible&&nyFar?.visible,'Both NY continuation bands bridge the mapped core');
assert.ok(nyNear.material.uniforms.opacity.value>nyFar.material.uniforms.opacity.value,'At city scale, intermediate structure leads the far constellation');
assert.ok(nyNear.material.uniforms.opacity.value>=4.5&&nyFar.material.uniforms.opacity.value>=2,'Both authored bands receive useful city exposure');
assert.equal(nyNear.geometry.getAttribute('position').count+nyFar.geometry.getAttribute('position').count,16000,'Band split preserves the desktop continuation point budget');
assert.ok(nyFar.material.uniforms.sizeScale.value>=.9,'Far context cores remain larger than subpixel sparks');
const ny=objects().filter(o=>o.userData.urban==='new-york');assert.equal(ny.length,2);assert.ok(ny.every(o=>o.visible),'Traffic and soft activity visible');
for(const cloud of ny){const a=cloud.geometry.getAttribute('position');for(let i=0;i<a.count;i++)assert.ok(Math.abs(Math.hypot(a.getX(i),a.getY(i),a.getZ(i))-1.00003)<1e-6);}
const nyBefore=ny.map(o=>o.geometry.getAttribute('position').array.slice());engine.rotate(15,0);tick(500);for(let i=0;i<2;i++)assert.deepEqual(ny[i].geometry.getAttribute('position').array,nyBefore[i]);
await complete({type:'setScale',tier:'street'});assert.equal(engine.worldState().tier,'street');
await complete({type:'focusLayer',layer:'urban',enabled:false});tick();assert.ok(ny.every(o=>!o.visible));await complete({type:'focusLayer',layer:'urban',enabled:true});tick();assert.ok(ny.every(o=>o.visible));
await complete({type:'flyTo',targetId:'singapore'});assert.equal(engine.worldState().targetId,'singapore');assert.equal(stages.at(-1),'city');assert.ok(ny.every(o=>!o.visible));assert.ok(objects().filter(o=>o.userData.urban==='singapore').every(o=>o.visible));const sgContext=objects().find(o=>o.userData.cityContinuation==='singapore'&&o.userData.cityContinuationBand==='intermediate');assert.ok(sgContext?.visible&&sgContext.material.uniforms.opacity.value>=4.5,'Singapore receives the same intermediate context treatment');
const singaporePose=rendered.camera.position.clone();await complete({type:'highlightTarget',targetId:'new-york'});assert.equal(engine.worldState().targetId,'singapore','Highlight does not replace active camera target');engine.rotate(10,0);tick();assert.ok(rendered.camera.position.distanceTo(singaporePose)<.0001,'Highlight another city does not change camera bounds or snap across Earth');assert.ok(objects().filter(o=>o.userData.urban==='singapore').every(o=>o.visible),'Highlight preserves current city activity');
engine.select('amina');tick();engine.orbit();tick();for(let i=0;i<30;i++)tick(); // Let the Night-light focus fade finish before comparing later view exposure.assert.equal(stages.at(-1),'orbit');
await complete({type:'flyTo',targetId:'challenger-deep'});assert.equal(engine.worldState().tier,'region');assert.equal(engine.worldState().targetId,'challenger-deep');assert.ok(rendered.camera.position.length()>1.19);const deepBeacon=objects().find(o=>o.userData.highlight);assert.ok(deepBeacon.userData.terrainKind===5&&new THREE.Vector3().fromBufferAttribute(deepBeacon.geometry.getAttribute('position'),0).length()<1,'Challenger beacon follows sampled seafloor, not an airborne target');
const trenchAnchor=new THREE.Vector3(Math.cos(11.369*Math.PI/180)*Math.sin(142.587*Math.PI/180),Math.sin(11.369*Math.PI/180),Math.cos(11.369*Math.PI/180)*Math.cos(142.587*Math.PI/180));const sea=objects().find(o=>o.material.uniforms?.seaMotion?.value===1);assert.equal(views.at(-1),'oblique','Challenger announces the existing Horizon view');assert.ok(Math.abs(rendered.camera.position.distanceTo(trenchAnchor)-.62)<1e-6,'Challenger arrives at existing .62 horizon altitude');assert.ok(Math.abs(Math.acos(rendered.camera.position.clone().sub(trenchAnchor).normalize().dot(trenchAnchor))*180/Math.PI-68)<1e-6,'Challenger uses the existing 68-degree camera');assert.ok(Math.abs(sea.material.uniforms.opacity.value-3.9825)<1e-6,'Trench uses the bounded study exposure, not the old blanket threefold boost');engine.zoom(.8);tick();assert.ok(Math.abs(rendered.camera.position.distanceTo(trenchAnchor)-.496)<1e-6,'Horizon zoom moves closer');engine.zoom(.01);tick();assert.ok(Math.abs(rendered.camera.position.distanceTo(trenchAnchor)-.32)<1e-6,'Horizon retains safe minimum');engine.configure({...baseOptions,depth:false});tick();assert.equal(sea.material.uniforms.opacity.value,0,'User Surface reference remains respected');engine.configure(baseOptions);tick();
engine.view('cutaway');tick();assert.equal(engine.worldState().targetId,'challenger-deep');assert.ok(Math.abs(Math.atan2(rendered.camera.position.y,Math.hypot(rendered.camera.position.x,rendered.camera.position.z))*180/Math.PI-11.369)<.01,'View change retains Challenger target');assert.ok(Math.abs(rendered.camera.position.length()-1.20)<1e-6);engine.view('globe');tick();host.clientWidth=800;host.clientHeight=600;resizeCallback();tick();assert.ok(Math.abs(rendered.camera.position.length()-1.20)<1e-6,'Idle region resize preserves altitude');engine.zoom(.8);tick();assert.ok(Math.abs(rendered.camera.position.length()-1.16)<1e-6,'Regional zoom-in moves closer rather than snapping to old planet minimum');engine.zoom(.01);tick();assert.ok(Math.abs(rendered.camera.position.length()-1.10)<1e-6,'Regional zoom retains safe .10 minimum');engine.zoom(2);tick();
assert.equal((await complete({type:'setScale',tier:'street'})).ok,false,'Unsupported trench street scale rejected');assert.equal(engine.worldState().tier,'region');
await complete({type:'resetView'});assert.equal(engine.worldState().targetId,null);assert.equal(engine.worldState().tier,'planet');assert.ok(Math.abs(sea.material.uniforms.opacity.value-1.60)<1e-6,'Planet ocean returns to its restrained base exposure');assert.ok(objects().filter(o=>o.userData.cityContinuation).every(o=>!o.visible),'Context remains absent on the global planet');
assert.equal((await complete({type:'flyTo',targetId:'missing'})).ok,false);
engine.configure({...baseOptions,motion:true});const flight=engine.command({type:'flyTo',targetId:'challenger-deep'});for(let i=0;i<5;i++){await Promise.resolve();tick(100);}host.clientWidth=390;host.clientHeight=844;resizeCallback();for(let i=0;i<80;i++){tick(100);await Promise.resolve();}assert.equal((await flight).ok,true);assert.ok(Math.abs(rendered.camera.position.distanceTo(trenchAnchor)-.62)<1e-6,'In-flight regional resize retains its intended horizon altitude');engine.region('indonesia');assert.equal(engine.worldState().targetId,null,'Explicit depth preset clears old command target');
const lostCommand=engine.command({type:'flyTo',targetId:'singapore'});for(let i=0;i<6;i++){await Promise.resolve();tick(100);}assert.ok(graphicsLostCallback);graphicsLostCallback({preventDefault(){}});assert.equal((await lostCommand).ok,false,'Graphics loss settles active command');assert.equal((await engine.command({type:'resetView'})).ok,false,'Graphics loss rejects later commands');
assert.equal(engine.audioState().available,false,'Renderer loss makes audio unavailable');engine.dispose();assert.equal(frame,null);assert.equal(engine.audioState().available,false,'Disposed renderer cannot feed sound');
console.log('PASS: distinct orbital/aircraft shells with trails; real pause of positions; layer toggles; serialized target/scale commands; sourced NYC detail and activity; SG return; Mariana region; reset; invalid command. Inert Canvas lifecycle, not pixel/performance evidence.');
