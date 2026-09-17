'use client';
import {useState,useEffect,type CSSProperties,type ReactNode} from 'react';
import {Switch} from '@/components/ui/switch';
import {TRANSPORT_FAMILIES,FAMILY_RANGES,cloneTransport,type TransportFamily,type FamilyOptions,type FamilyNumber,type TransportOptions} from '@/lib/terra/transport';
import styles from './composition-controls.module.css';
const labels:Record<TransportFamily,string>={aircraft:'Flights',ships:'Ships',cables:'Undersea cables',satellites:'Satellites'};
const modes={full:'Full pathway',local:'Forward & fading rear',trail:'Light trail only'};
function FamilySlider({family,name,label,value,onChange,note}:{family:TransportFamily;name:FamilyNumber;label:string;value:number;onChange:(n:number)=>void;note?:string}){
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState('');
 const percent=['softness','bundle','roundness'].includes(name),unit=percent?100:1,[low,high,step]=FAMILY_RANGES[name],text=Number((value*unit).toFixed(percent||name==='count'?0:2));
 const id=`transport-${family}-${name}`,accessible=`${labels[family]} ${label.toLowerCase()}`;
 return <div className={styles.sliderRow}><div className={styles.sliderHeading}><label htmlFor={id}>{label}</label><label className={styles.number}><input type="number" aria-label={`${accessible} value`} min={low*unit} max={high*unit} step={step*unit} value={editing?draft:text} onFocus={()=>{setDraft(String(text));setEditing(true);}} onBlur={()=>setEditing(false)} onChange={e=>{setDraft(e.target.value);if(e.target.value!==''&&e.target.validity.valid)onChange(+e.target.value/unit);}}/><span>{percent?'%':name==='count'?'':'×'}</span></label></div><input id={id} aria-label={accessible} type="range" min={low*unit} max={high*unit} step={step*unit} value={value*unit} style={{'--slider-fill':`${(value-low)/(high-low)*100}%`} as CSSProperties} onChange={e=>onChange(+e.target.value/unit)}/>{note&&<p className={styles.note}>{note}</p>}</div>;
}
export function TransportControls({value,onChange,masterPaths,masterTravellers,layers,enableLayer,familyLight,disabled}:{value:TransportOptions;onChange:(v:TransportOptions)=>void;masterPaths:boolean;masterTravellers:boolean;layers:Partial<Record<TransportFamily,boolean>>;enableLayer:(f:TransportFamily)=>void;familyLight:(f:TransportFamily)=>ReactNode;disabled:boolean}){
 const [shapeStatus,setShapeStatus]=useState('ready');
 useEffect(()=>{const listener=(e:Event)=>setShapeStatus((e as CustomEvent<string>).detail);window.addEventListener('terra-route-shape',listener);return()=>window.removeEventListener('terra-route-shape',listener);},[]);
 const change=(family:TransportFamily,update:Partial<FamilyOptions>)=>{const next=cloneTransport(value);Object.assign(next[family],update);onChange(next);};
 return <details className={styles.section} open><summary>Individual families</summary>
 {shapeStatus!=='ready'&&<p className={styles.status} role="status">{shapeStatus==='working'?'Shaping the routes…':'That shape could not be prepared. Adjust the shape controls to try again.'}</p>}
 <p className={styles.note}>Choose what moves, what stays visible, and how much space each family takes.</p>
 <button type="button" className={styles.textButton} disabled={disabled} onClick={()=>{const next=cloneTransport(value);for(const f of TRANSPORT_FAMILIES){next[f].pathways=true;next[f].travellers=true;next[f].mode=f==='aircraft'?'local':f==='satellites'?'trail':'full';enableLayer(f);}onChange(next);}}>Try the quieter mix</button>
 {TRANSPORT_FAMILIES.map(f=>{const v=value[f],label=labels[f],enabled=layers[f]!==false;
 const slider=(name:FamilyNumber,label:string,note?:string)=><FamilySlider key={name} family={f} name={name} label={label} value={v[name]} onChange={n=>change(f,{[name]:n})} note={note}/>;
 return <details className={styles.family} key={f}><summary><span>{label}</span><small>{v.travellers&&enabled?`${v.count} lights`:'Travellers off'} · {v.pathways&&enabled?modes[v.mode]:'Paths off'}</small></summary><fieldset disabled={disabled}>
 <div className={styles.switchRow}><label htmlFor={`transport-${f}-paths`}>Pathways</label><Switch id={`transport-${f}-paths`} aria-label={`${label} pathways`} checked={enabled&&v.pathways} onCheckedChange={pathways=>{if(pathways)enableLayer(f);change(f,{pathways});}}/></div>
 <div className={styles.switchRow}><label htmlFor={`transport-${f}-travellers`}>Travellers &amp; pulses</label><Switch id={`transport-${f}-travellers`} aria-label={`${label} travellers and pulses`} checked={enabled&&v.travellers} onCheckedChange={travellers=>{if(travellers)enableLayer(f);change(f,{travellers});}}/></div>
 {(!masterPaths||!masterTravellers)&&<p className={styles.note}>{!masterPaths?'All pathways is off above. ':''}{!masterTravellers?'All travellers is off above.':''} Individual choices are kept.</p>}
 <label className={styles.selectLabel} htmlFor={`transport-${f}-mode`}>Pathway style</label><select id={`transport-${f}-mode`} aria-label={`${label} pathway style`} value={v.mode} onChange={e=>change(f,{mode:e.target.value as FamilyOptions['mode']})}>{Object.entries(modes).map(([mode,title])=><option key={mode} value={mode}>{mode==='full'&&f==='satellites'?'Complete orbit':title}</option>)}</select>
 {!v.pathways&&<p className={styles.note}>Paths and tails are hidden. The chosen style returns when pathways are on.</p>}
 {v.mode==='local'&&<p className={styles.note}>A short guide travels ahead and fades behind. It can remain visible with its traveller hidden.</p>}
 {slider('count',f==='cables'?'Pulse count':'Traveller count','Worldwide budget, before overall density and progressive arrival. The far side of Earth remains hidden.')}
 <label className={styles.selectLabel} htmlFor={`transport-${f}-distribution`}>Distribution</label><select id={`transport-${f}-distribution`} aria-label={`${label} distribution`} value={v.distribution} onChange={e=>change(f,{distribution:e.target.value as FamilyOptions['distribution']})}><option value="even">Even across {f==='satellites'?'orbits':'routes'}</option><option value="hubs" disabled={f==='satellites'}>Busier hubs · illustrative</option></select>
 {f!=='satellites'&&<p className={styles.note}>Hub weighting uses network connections and authored intensity, not measured or live traffic.</p>}
 <details className={styles.fine}><summary>Light &amp; trail</summary>
 {familyLight(f)}{slider('travellerLight','Traveller intensity')}{v.mode!=='trail'&&slider('pathLight','Pathway intensity')}{slider('softness','Line softness','Crisp at 0%; softer edges and glow towards 100%.')}{slider('tail','Tail length','Zero removes the bright tail. Full and forward/rear pathways stay visible.')}{slider('trailLight','Tail intensity')}
 {v.mode==='local'&&<>{slider('ahead','Forward reach')}{slider('behind','Rear reach')}</>}
 </details>
 {f!=='satellites'&&<details className={styles.fine}><summary>Route shape</summary>{slider('bundle','Hub gathering','Separate approaches at 0%; shared approaches towards 100%.')}{slider('roundness','Bend rounding',f==='aircraft'?'More direct approaches at 0%; gradual curves towards 100%.':'Tighter elbows at 0%; broader curves towards 100%, within the water constraints.')}<p className={styles.note}>Shape settles after you release the slider. Travellers follow the same adjusted routes.</p></details>}
 </fieldset></details>;
 })}</details>;
}
