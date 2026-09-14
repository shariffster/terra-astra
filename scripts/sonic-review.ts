/** QA utility, never imported by the application. Render the actual audio graph
 * from captured renderer snapshots in a browser's native OfflineAudioContext. */
import { WorldAudioGraph, smoothParam } from '../lib/audio/synthesis';
import { directAudio } from '../lib/audio/audio-scene';
import { SeededScheduler } from '../lib/audio/seeded-scheduler';
import { destinationProfile } from '../lib/audio/destination-profiles';
import type { AudioWorldState } from '../lib/audio/world-state';

export type ReviewFrame = { at: number; state: AudioWorldState };
export async function renderSonicReview(frames: ReviewFrame[], duration: number, reduced = false) {
  const rate = 44100;
  const context = new OfflineAudioContext(2, Math.ceil(duration * rate), rate);
  const graph = new WorldAudioGraph(context), scheduler = new SeededScheduler();
  let index = 0, epoch = -1, destination: string | null = null, genesis = false;
  const update = () => {
    const time = context.currentTime;
    while (index < frames.length - 1 && frames[index + 1].at <= time) index++;
    const world = frames[index].state;
    const reset = epoch !== world.epoch || destination !== world.world.targetId;
    const settlement = genesis && !world.world.genesis.busy;
    if (reset) { scheduler.reset(destinationProfile(world.world.targetId)?.seed ?? 260914); graph.clearEvents(time, .12); }
    if (settlement) graph.clearEvents(time, .08);
    epoch = world.epoch; destination = world.world.targetId; genesis = world.world.genesis.busy;
    const scene = directAudio(world, reduced); graph.apply(scene, time, reset || settlement);
    scheduler.advance(world.seconds, scene.rates, (kind, variation, pan) => graph.play(kind, variation, pan, scene, time));
  };
  update(); smoothParam(graph.activation.gain, 1, 0, 2);
  let pause = context.suspend(.05);
  const rendering = context.startRendering();
  for (let step = 1; step < Math.floor(duration / .05); step++) {
    await pause; update();
    if (step < Math.floor(duration / .05) - 1) pause = context.suspend((step + 1) * .05);
    await context.resume();
  }
  const buffer = await rendering;
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)];
  const bytes = new ArrayBuffer(44 + buffer.length * 4), view = new DataView(bytes);
  const text = (at: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, bytes.byteLength - 44, true);
  let peak = 0, energy = 0, jump = 0;
  for (let i = 0; i < buffer.length; i++) for (let ch = 0; ch < 2; ch++) {
    const sample = channels[ch][i];
    if (!Number.isFinite(sample)) throw new Error('Non-finite audio output');
    peak = Math.max(peak, Math.abs(sample)); energy += sample * sample;
    if (i) jump = Math.max(jump, Math.abs(sample - channels[ch][i - 1]));
    view.setInt16(44 + (i * 2 + ch) * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true);
  }
  const metrics = { duration, sampleRate: rate, peak, peakDbFS: 20 * Math.log10(peak), rmsDbFS: 10 * Math.log10(energy / (buffer.length * 2)), maxAdjacentSampleDelta: jump, ...graph.diagnostics };
  graph.dispose();
  return { wav: new Blob([bytes], { type: 'audio/wav' }), metrics };
}
