/** Original twelve-second suspended figure requested in the third listening
 * pass. Fixed voices overlap smoothly; no recording, note-on timer or copied
 * score. Octave energy circulates over 64 seconds without detuning the chord. */
export const WEAVE_FREQUENCIES = [108, 162, 216, 288, 324, 432] as const;
const FIGURE = [2, 4, 5, 4, 3, 4] as const;
const modulo = (value: number, period: number) => ((value % period) + period) % period;

export function harmonicWeave(seconds: number, presence: number, motion: boolean) {
  const time = motion ? seconds : 9;
  const octave = time / 64 * Math.PI * 2;
  const levels = [.27 * (.86 + .14 * Math.sin(octave)), .115, 0, 0, 0, 0];
  for (let step = 0; step < FIGURE.length; step++) {
    const age = modulo(time - step * 2, 12);
    if (age >= 4.6) continue;
    const voice = FIGURE[step];
    const envelope = Math.sin(Math.PI * age / 4.6) ** 2;
    const handoff = .70 + .30 * Math.cos(octave - (voice - 2) * Math.PI / 2);
    levels[voice] += envelope * handoff * [.19, .14, .17, .13][voice - 2] * presence;
  }
  return levels;
}
