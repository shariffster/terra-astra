import { seededRandom } from './seeded-scheduler';

/** The opening keeps its accepted shape. Settled Earth develops a sequence of
 * deterministic, distinct phrases with changing voicing, space and register.
 * Every decision reads renderer time; there is no playback/transport clock. */
export const WEAVE_FREQUENCIES = [108, 162, 216, 288, 324, 432] as const;
const FIGURE = [2, 4, 5, 4, 3, 4] as const;
const modulo = (value: number, period: number) => ((value % period) + period) % period;
export const PHRASE_SECONDS = 26;
const VOICINGS = [
  [216, 288, 324, 432], [216, 243, 324, 432],
  [216, 259.2, 324, 432], [162, 216, 324, 486], [216, 270, 324, 432],
] as const;
const HARMONIC_ARC = [0, 1, 2, 0, 3, 1, 4, 2, 3] as const;

export function planHarmonicPhrase(index: number) {
  const random = seededRandom(928371 ^ Math.imul(index + 1, 2654435761));
  const voicing = HARMONIC_ARC[modulo(index, HARMONIC_ARC.length)];
  const frequencies: number[] = [108, 162, ...VOICINGS[voicing]];
  if (random() > .58) frequencies[5] *= .5;
  const notes = [];
  const count = 3 + Math.floor(random() * 4);
  let at = .6 + random() * 1.2, previous = -1;
  for (let i = 0; i < count; i++) {
    let voice = 2 + Math.floor(random() * 4);
    if (voice === previous) voice = 2 + (voice - 1) % 4;
    notes.push({ voice, at, duration: 3.2 + random() * .8,
      level: .25 + random() * .11, detail: i < 3 ? 0 : .35 + random() * .45 });
    previous = voice; at += 1.6 + random() * 1.15;
  }
  return { frequencies, notes, colour: 1400 + random() * 1500, spread: .6 + random() * .4 };
}

export function harmonicFrame(seconds: number, presence: number, motion: boolean, introduction = false, detail = 1) {
  const time = motion ? seconds : 9;
  const octave = time / 64 * Math.PI * 2;
  const levels = introduction ? [.27 * (.86 + .14 * Math.sin(octave)), .115, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0];
  const frame = { levels, frequencies: [...WEAVE_FREQUENCIES] as number[], colour: 3200, spread: 1 };
  if (!motion) { frame.levels = introduction ? levels : [.035, .012, 0, 0, 0, 0]; return frame; }
  if (!introduction) {
    const plan = planHarmonicPhrase(Math.floor(seconds / PHRASE_SECONDS));
    const position = modulo(seconds, PHRASE_SECONDS);
    for (const note of plan.notes) {
      const age = position - note.at;
      if (age < 0 || age >= note.duration) continue;
      const reveal = note.detail === 0 ? 1 : Math.max(0, Math.min(1, (detail - note.detail + .1) / .2));
      levels[note.voice] += Math.sin(Math.PI * age / note.duration) ** 2 * note.level * presence * reveal * reveal * (3 - 2 * reveal);
    }
    return { levels, frequencies: plan.frequencies, colour: plan.colour, spread: plan.spread };
  }
  for (let step = 0; step < FIGURE.length; step++) {
    const age = modulo(time - step * 2, 12);
    const duration = 4.6;
    if (age >= duration) continue;
    const voice = FIGURE[step];
    const envelope = Math.sin(Math.PI * age / duration) ** 2;
    const handoff = .70 + .30 * Math.cos(octave - (voice - 2) * Math.PI / 2);
    levels[voice] += envelope * handoff * [.19, .14, .17, .13][voice - 2] * presence;
  }
  return frame;
}

export function harmonicWeave(seconds: number, presence: number, motion: boolean, introduction = false, detail = 1) {
  return harmonicFrame(seconds, presence, motion, introduction, detail).levels;
}
