/** An original short figure with breathing room between repetitions. The
 * opening's sustained tones leave after awakening instead of droning beneath
 * every phrase. No recording, note-on timer or copied score. */
export const WEAVE_FREQUENCIES = [108, 162, 216, 288, 324, 432] as const;
const FIGURE = [2, 4, 5, 4, 3, 4] as const;
const modulo = (value: number, period: number) => ((value % period) + period) % period;

export function harmonicWeave(seconds: number, presence: number, motion: boolean, introduction = false) {
  const time = motion ? seconds : 9;
  const octave = time / 64 * Math.PI * 2;
  const levels = introduction ? [.27 * (.86 + .14 * Math.sin(octave)), .115, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0];
  if (!motion) return introduction ? levels : [.035, .012, 0, 0, 0, 0];
  for (let step = 0; step < FIGURE.length; step++) {
    const age = modulo(time - step * 2, introduction ? 12 : 20);
    const duration = introduction ? 4.6 : 3.2;
    if (age >= duration) continue;
    const voice = FIGURE[step];
    const envelope = Math.sin(Math.PI * age / duration) ** 2;
    const handoff = .70 + .30 * Math.cos(octave - (voice - 2) * Math.PI / 2);
    levels[voice] += envelope * handoff * (introduction ? [.19, .14, .17, .13] : [.30, .24, .32, .25])[voice - 2] * presence;
  }
  return levels;
}
