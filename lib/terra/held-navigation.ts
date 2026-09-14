/** Held input is sampled by the existing renderer clock, never OS key repeat. */
export const HELD_KEYS = new Set(['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 't', 'g']);

export function navigationVector(keys: ReadonlySet<string>) {
  let x = Number(keys.has('d')) - Number(keys.has('a'));
  let y = Number(keys.has('w')) - Number(keys.has('s'));
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  return { x, y, orbit: Number(keys.has('e')) - Number(keys.has('q')),
    zoom: Number(keys.has('f')) - Number(keys.has('r')),
    tilt: Number(keys.has('t')) - Number(keys.has('g')) };
}

export function editableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!(el?.matches?.('input,textarea,select') || el?.isContentEditable || el?.closest?.('[contenteditable]:not([contenteditable="false"])'));
}
