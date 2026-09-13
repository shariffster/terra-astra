'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, RotateCcw, X } from 'lucide-react';
import { sendWorldCommand } from '@/lib/world/bridge';
import { WORLD_TARGETS, type WorldCommand, type WorldState } from '@/lib/world/commands';
import styles from './world-navigation.module.css';

const DESTINATION_LINES: Record<string, string> = {
  singapore: 'City, island, constellation.',
  'new-york': 'Roads become rivers of light.',
  'palm-jumeirah': 'A city drawn into the sea.',
  makkah: 'Collective flow around a centre.',
  'challenger-deep': 'Into Earth’s deepest relief.',
};

/** A small editorial doorway into the same destination commands used by Live. */
export function WorldNavigation({ state, disabled, onReplay, onDepth }: { state: WorldState | null; disabled: boolean; onReplay: () => void; onDepth?: () => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => { setOpen(false); trigger.current?.focus(); }, []);
  const unavailable = disabled || !!state?.busy;
  const run = async (command: WorldCommand) => {
    setMessage(''); setOpen(false);
    const result = await sendWorldCommand(command);
    if (!result.ok) setMessage(result.reason ?? 'That journey could not complete. Please try again.');
  };

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('keydown', escape);
    window.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('pointerdown', outside); };
  }, [open, close]);

  return <div ref={root} className="world-navigation">
    <button ref={trigger} type="button" className="journey-button world-explore" disabled={unavailable} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="world-destination-collection">Explore the world <ArrowUpRight size={17}/></button>
    {open && <section id="world-destination-collection" className={`world-destinations ${styles.collection}`} aria-label="Explore destinations">
      <div className={`world-destinations-heading ${styles.heading}`}><h2>Follow a light.</h2><button type="button" aria-label="Close destinations" onClick={close}><X size={17}/></button></div>
      <p className={styles.introduction}>Five places. Five ways the world moves.</p>
      <div className={styles.places}>
        {WORLD_TARGETS.map(target => <button key={target.id} type="button" disabled={unavailable} className={`world-target ${styles.destination}`} aria-current={state?.targetId === target.id ? 'location' : undefined} onClick={() => void run({ type: 'flyTo', targetId: target.id })}>
          <span><span className={styles.name}>{target.label}</span><small>{DESTINATION_LINES[target.id] ?? target.detail}</small></span>
          <ArrowUpRight size={17} aria-hidden="true"/>
        </button>)}
      </div>
      <p className={styles.provenance}>Mapped detail. Interpretive surroundings &amp; motion.</p>
      <div className={`world-layer-actions ${styles.layers}`}><span>Above &amp; around Earth</span><button type="button" disabled={unavailable} onClick={() => void run({ type: 'focusLayer', layer: 'satellites', enabled: !state?.layers.satellites })} aria-pressed={state?.layers.satellites ?? true}>Orbit</button><button type="button" disabled={unavailable} onClick={() => void run({ type: 'focusLayer', layer: 'aircraft', enabled: !state?.layers.aircraft })} aria-pressed={state?.layers.aircraft ?? true}>Air</button><button type="button" disabled={unavailable} onClick={() => void run({ type: 'focusLayer', layer: 'ships', enabled: !state?.layers.ships })} aria-pressed={state?.layers.ships ?? true}>Sea</button></div>
      {onDepth && <button type="button" className={`text-button ${styles.depth}`} disabled={unavailable} onClick={() => { setOpen(false); onDepth(); }}><ArrowDown size={13}/> Explore Earth’s depth</button>}
      <button type="button" className={`text-button world-replay ${styles.replay}`} onClick={() => { setOpen(false); onReplay(); }}><RotateCcw size={13}/> Replay the birth of Earth</button>
    </section>}
    {message && <p className="world-command-message" role="status">{message}</p>}
  </div>;
}
