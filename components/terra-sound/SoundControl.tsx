'use client';

import { Volume2, VolumeX } from 'lucide-react';
import type { SoundStatus } from '@/lib/audio/audio-director';
import styles from './sound-control.module.css';

export default function SoundControl({ status, onToggle }: { status: SoundStatus; onToggle: () => void }) {
  const enabled = status === 'enabled' || status === 'enabling';
  const label = enabled ? 'Mute the living Earth' : status === 'paused' ? 'Resume Earth sound' : status === 'unavailable' ? 'Try Earth sound again' : status === 'muted' ? 'Unmute the living Earth' : 'Hear the living Earth';
  return <button className={styles.control} type="button" onClick={onToggle} aria-label={label} title={label} aria-pressed={enabled} data-sound-control data-sound-status={status}>
    {enabled ? <Volume2 size={17} aria-hidden="true"/> : <VolumeX size={17} aria-hidden="true"/>}
    <span className={status === 'locked' || status === 'unavailable' ? styles.invitation : styles.compact}>{status === 'unavailable' ? 'Try sound again' : 'Hear the living Earth'}</span>
  </button>;
}
