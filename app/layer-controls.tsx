'use client';

import { useState } from 'react';
import { Layers3, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { sendWorldCommand } from '@/lib/world/bridge';
import { DEFAULT_PRESENTATION, type WorldCommand, type WorldState } from '@/lib/world/commands';
import styles from './layer-controls.module.css';

export function LayerControls({ state, disabled }: { state: WorldState | null; disabled: boolean }) {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const presentation = state?.presentation ?? DEFAULT_PRESENTATION;
  const focus = presentation.focus === 'night-lights';
  const local = state?.tier === 'city' || state?.tier === 'street';
  const run = async (command: WorldCommand) => {
    setMessage('');
    const result = await sendWorldCommand(command);
    if (!result.ok) setMessage(result.reason ?? 'That layer could not change. Please try again.');
  };
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button disabled={disabled} aria-label="Choose Earth layers" title="Choose Earth layers"><Layers3 size={18}/></button></PopoverTrigger>
    <PopoverContent side="left" align="end" sideOffset={12} collisionPadding={16} className={styles.panel} aria-label="Earth layers">
      <div className={styles.heading}><h2>Earth in layers.</h2><button type="button" onClick={()=>setOpen(false)} aria-label="Close Earth layers"><X size={17}/></button></div>
      <ToggleGroup type="single" value={presentation.focus} onValueChange={focus => { if (focus) void run({ type: 'setPresentation', presentation: { focus: focus as 'living' | 'night-lights' } }); }} className={styles.focus} aria-label="Earth focus" disabled={disabled}>
        <ToggleGroupItem value="living">Living Earth</ToggleGroupItem>
        <ToggleGroupItem value="night-lights" disabled={disabled || local}>Night lights</ToggleGroupItem>
      </ToggleGroup>
      <p className={styles.note}>{focus ? <>NASA’s 2016 night-light pattern, artistically sampled. Brightness is not population.</> : local ? <>Night lights can be studied at Planet or Region.</> : <>Let the whole world mingle, or follow its light.</>}</p>
      {focus && <div className={styles.keep}>
        <label htmlFor="layer-keep-activity">Keep transport visible</label><Switch id="layer-keep-activity" checked={presentation.keepActivity} onCheckedChange={keepActivity => void run({ type: 'setPresentation', presentation: { keepActivity } })} disabled={disabled}/>
      </div>}
      <fieldset className={styles.families} disabled={disabled}>
        <legend>World activity</legend>
        {([['aircraft', 'Flights'], ['ships', 'Ships'], ['cables', 'Undersea cables'], ['satellites', 'Satellites']] as const).map(([layer, label]) => <div className={styles.row} key={layer}>
          <label htmlFor={`layer-${layer}`}>{label}</label><Switch id={`layer-${layer}`} checked={state?.layers[layer] ?? true} onCheckedChange={enabled => void run({ type: 'focusLayer', layer, enabled })}/>
        </div>)}
      </fieldset>
      <fieldset className={styles.material} disabled={disabled}>
        <legend>Paths &amp; passing light</legend>
        <div className={styles.row}><label htmlFor="layer-pathways">Pathways</label><Switch id="layer-pathways" checked={presentation.pathways} onCheckedChange={pathways => void run({ type: 'setPresentation', presentation: { pathways } })}/></div>
        <div className={styles.row}><label htmlFor="layer-travellers">Travellers &amp; pulses</label><Switch id="layer-travellers" checked={presentation.travellers} onCheckedChange={travellers => void run({ type: 'setPresentation', presentation: { travellers } })}/></div>
      </fieldset>
      <p className={styles.note}>{focus && !presentation.keepActivity ? 'Your activity choices return with Living Earth.' : 'Activity gathers over a few seconds. Satellites travel without visible paths.'}</p>
      {message && <p className={styles.message} role="status">{message}</p>}
    </PopoverContent>
  </Popover>;
}
