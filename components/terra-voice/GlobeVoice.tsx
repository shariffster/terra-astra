'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Mic, Square, X } from 'lucide-react';
import QuestionBar from '../terra-input/QuestionBar';
import { createLiveController, type TranscriptRow } from './live-controller';
import { readAnswerStream } from './answer-stream';
import { executeLiveNavigation, planLiveNavigation } from './world-navigator';
import type { WorldState } from '@/lib/world/commands';
import styles from './globe-voice.module.css';

type Props = {
  ready: boolean;
  onVoiceOutput?: (stream: MediaStream | null) => void;
  discoveryReady?: boolean;
  exploring?: boolean;
  worldState?: WorldState | null;
  onAskReady?: (ask: ((question: string) => void) | null) => void;
};
type LiveController = ReturnType<typeof createLiveController>;

const SUGGESTIONS = [
  'Show me the vibe in New York',
  'Take me to Makkah',
  'Show me Palm Jumeirah',
  'Where is the deepest place on Earth?',
] as const;
const INVITATION_KEY = 'terra-astra-discovery-v010';

/** The invitation, typed questions and Live delegation share one bounded navigation path. */
export default function GlobeVoice({ ready, exploring = false, discoveryReady = true, worldState, onAskReady, onVoiceOutput }: Props) {
  const [open, setOpen] = useState(false);
  const [invitationDismissed, setInvitationDismissed] = useState(() => {
    try { return sessionStorage.getItem(INVITATION_KEY) === 'seen'; } catch { return false; }
  });
  const [status, setStatus] = useState('off');
  const [rows, setRows] = useState<TranscriptRow[]>([]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceSignIn, setVoiceSignIn] = useState(false);
  const live = useRef<LiveController | null>(null);
  const active = useRef<AbortController | null>(null);
  const askRef = useRef<(question: string, delegationId?: string) => Promise<void>>(async () => {});
  const toggle = useRef<HTMLButtonElement>(null);
  const requestNumber = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissInvitation = useCallback(() => {
    setInvitationDismissed(true);
    try { sessionStorage.setItem(INVITATION_KEY, 'seen'); } catch { /* Exploration works without storage. */ }
  }, []);

  const startedExploring = exploring || !!worldState?.targetId || (!!worldState && worldState.tier !== 'planet');

  const inviting = discoveryReady && !startedExploring && !invitationDismissed;

  useEffect(() => {
    if (startedExploring) {
      try { sessionStorage.setItem(INVITATION_KEY, 'seen'); } catch { /* Optional session memory. */ }
    }
  }, [startedExploring]); // Visual staging comes from the renderer-owned clock.


  const ask = useCallback(async (question: string, delegationId?: string, reveal = true) => {
    if (!ready || !question.trim()) return;
    const sequence = ++requestNumber.current;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    dismissInvitation();
    active.current?.abort();
    const request = new AbortController();
    active.current = request;
    setOpen(reveal); setBusy(true); setError(''); setVoiceSignIn(false); setAnswer('');
    try {
      const plan = planLiveNavigation(question);
      if (plan) {
        setAnswer(plan.acknowledgement);
        const result = await executeLiveNavigation(plan, {
          signal: request.signal,
          onDispatch: (_command, index) => { if (index === 0) live.current?.say(delegationId ?? null, plan.acknowledgement); },
        });
        if (request.signal.aborted) return;
        if (!result.ok) throw new Error(result.reason ?? 'The world could not move there.');
        setAnswer(plan.context);
        live.current?.say(delegationId ?? null, plan.context);
        // Navigation gives the canvas back after the acknowledgement has been read.
        if (reveal && !delegationId) closeTimer.current = setTimeout(() => {
          if (requestNumber.current === sequence) setOpen(false);
        }, 4200);
        return;
      }
      const response = await fetch('/api/terra/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({ query: question, selectedIds: [], previous: null }), signal: request.signal,
      });
      const data = await readAnswerStream(response, (text, complete) => {
        if (request.signal.aborted) return;
        setAnswer(text);
        if (complete) live.current?.say(delegationId ?? null, text);
      }) as { error?: string; measured?: { output?: string }; answer?: string };
      if (request.signal.aborted) return;
      if (!response.ok || data.error) throw new Error(data.error ?? 'The answer service is unavailable.');
      const text = data.measured?.output ?? data.answer;
      if (typeof text !== 'string' || !text.trim()) throw new Error('The answer service returned no answer.');
      setAnswer(text);
      live.current?.say(delegationId ?? null, text);
    } catch (cause) {
      if (!request.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'The request could not complete.');
        setOpen(true);
      }
    } finally {
      if (active.current === request) { active.current = null; setBusy(false); }
    }
  }, [ready, dismissInvitation]);
  useEffect(() => { askRef.current = ask; }, [ask]);

  useEffect(() => {
    live.current = createLiveController({
      onStatus: setStatus, onTranscript: setRows, onOutputStream: onVoiceOutput,
      onError: (message) => {
        if (/sign.?in|signed in/i.test(message)) { setVoiceSignIn(true); setError(''); }
        else setError(message);
      },
      onAssistantText: setAnswer,
      onDelegation: ({ id, query }) => { void askRef.current(query, id); },
    });
    return () => {
      active.current?.abort(); live.current?.dispose(); live.current = null;
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [onVoiceOutput]);
  useEffect(() => {
    onAskReady?.((question) => { void ask(question); });
    return () => onAskReady?.(null);
  }, [ask, onAskReady]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open]);

  const connected = !['off', 'stopped', 'disposed', 'error', 'startup timed out', 'disconnected'].includes(status) && !status.startsWith('closed') && !status.startsWith('disconnected');
  const statusLabel = status.startsWith('closed') || ['off', 'stopped'].includes(status) ? 'Voice off' : status === 'started' ? 'Listening' : status;
  const clearCloseTimer = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  return <aside className={styles.dock} data-astra-panel data-live={connected ? 'true' : undefined} data-inviting={inviting && !open ? 'true' : undefined} data-open={open ? 'true' : undefined} aria-label="Astra navigation" onFocusCapture={clearCloseTimer} onPointerDown={clearCloseTimer}>
    {open && <div id="astra-discovery-body" className={styles.body}>
      <div className={styles.bodyHeading}>
        <p>Where shall we go?</p>
        <button type="button" aria-label="Close Ask Astra" onClick={() => { setOpen(false); toggle.current?.focus(); }}><X size={16}/></button>
      </div>
      {!answer && !busy && <div className={styles.suggestions} aria-label="Try asking Astra">
        {SUGGESTIONS.map(question => <button key={question} type="button" disabled={!ready} onClick={() => void ask(question, undefined, false)}>{question}<ArrowUpRight size={14} aria-hidden="true"/></button>)}
      </div>}
      <QuestionBar onQuestion={(text) => ask(text)} disabled={!ready} busy={busy} onCancel={() => { active.current?.abort(); active.current = null; setBusy(false); }} />
      {answer && <p className={styles.answer} aria-live="polite">{answer}</p>}
      {voiceSignIn && <p className={styles.signIn} role="status"><a href="/signin-with-chatgpt?return_to=%2F">Sign in with ChatGPT to talk</a><span>Or choose a suggestion and explore right away.</span></p>}
      {error && <p className={styles.error} role="alert">{error}{/sign.?in|signed in/i.test(error) && <> <a href="/signin-with-chatgpt?return_to=%2F">Sign in with ChatGPT</a><span className={styles.errorHelp}>You can still explore the places above.</span></>}</p>}
      {rows.length > 0 && <details className={styles.transcript}><summary>Conversation</summary>{rows.slice(-6).map((row, index) => <p key={index}><strong>{row.who === 'user' ? 'You' : 'Astra'}:</strong> {row.text}</p>)}</details>}
      <p className={styles.status}>{connected ? `Live · ${statusLabel}` : voiceSignIn ? 'Exploration is open to everyone.' : 'Tap a suggestion, type, or talk to Astra.'}</p>
    </div>}
    <div className={styles.heading}>
      <button ref={toggle} type="button" aria-expanded={open} aria-controls="astra-discovery-body" onClick={() => { clearCloseTimer(); dismissInvitation(); setOpen(!open); }}><span>Ask Astra</span><ChevronDown size={15} className={open ? styles.expandedChevron : ''} aria-hidden="true"/></button>
      <button type="button" disabled={!ready} onClick={() => { clearCloseTimer(); dismissInvitation(); setOpen(true); setError(''); setVoiceSignIn(false); if (connected) live.current?.stop(); else { setAnswer(''); void live.current?.start(); } }} aria-label={connected ? 'Stop Live voice' : 'Start Live voice'}>{connected ? <Square size={13} aria-hidden="true"/> : <Mic size={15} aria-hidden="true"/>}{connected ? 'Stop voice' : 'Talk'}</button>
    </div>
    {inviting && !open && <div className={styles.invitation}>
      <button type="button" disabled={!ready} onClick={() => void ask(SUGGESTIONS[0], undefined, false)}><span>{SUGGESTIONS[0]}</span><ArrowUpRight size={15} aria-hidden="true"/></button>
      <button type="button" onClick={dismissInvitation} aria-label="Dismiss Astra suggestion"><X size={13}/></button>
    </div>}
  </aside>;
}
