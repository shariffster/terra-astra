'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioDirector, type SoundStatus } from '@/lib/audio/audio-director';
import type { AudioWorldState } from '@/lib/audio/world-state';

declare global { interface Window { __terraSound?: { diagnostics: () => ReturnType<AudioDirector['diagnostics']> } } }

export function useSonicEarth(readWorld: () => AudioWorldState | null) {
  const reader = useRef(readWorld);
  useEffect(() => { reader.current = readWorld; }, [readWorld]);
  const director = useRef<AudioDirector | null>(null);
  const [status, setStatus] = useState<SoundStatus>('locked');
  useEffect(() => {
    const instance = new AudioDirector(() => reader.current(), setStatus); director.current = instance;
    if (process.env.NODE_ENV !== 'production') window.__terraSound = { diagnostics: () => instance.diagnostics() };
    return () => {
      instance.dispose(); director.current = null;
      if (process.env.NODE_ENV !== 'production') delete window.__terraSound;
    };
  }, []);
  const toggle = useCallback(() => director.current?.toggle(), []);
  const setVoiceOutput = useCallback((stream: MediaStream | null) => director.current?.setVoiceOutput(stream), []);
  return { status, toggle, setVoiceOutput };
}
