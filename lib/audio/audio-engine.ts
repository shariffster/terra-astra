import { AUDIO_LIMITS } from './world-state';
import { WorldAudioGraph, smoothParam, resetParam } from './synthesis';

/** Measures only the existing remote output. Never routes it through the world
 * compressor, records it, or touches the microphone / Live transport. */
export class VoiceActivity {
  private lastLoud = -Infinity;
  reset() { this.lastLoud = -Infinity; }
  sample(rms: number, now: number) {
    if (Number.isFinite(rms) && rms >= AUDIO_LIMITS.voiceThreshold) this.lastLoud = now;
    return now - this.lastLoud < AUDIO_LIMITS.voiceHold;
  }
}

export class AudioEngine {
  readonly graph: WorldAudioGraph;
  private analyser: AnalyserNode | null = null;
  private voiceSource: MediaStreamAudioSourceNode | null = null;
  private samples = new Float32Array(1024);
  private activity = new VoiceActivity();
  private measurementFailed = false;
  ducked = false;

  readonly context: AudioContext;
  constructor(context: AudioContext) { this.context = context; this.graph = new WorldAudioGraph(context); }
  setVoiceOutput(stream: MediaStream | null) {
    this.voiceSource?.disconnect(); this.analyser?.disconnect();
    this.voiceSource = null; this.analyser = null; this.activity.reset(); this.measurementFailed = false;
    this.setDucked(false);
    if (!stream || this.context.state === 'closed') return;
    try {
      this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 1024;
      this.voiceSource = this.context.createMediaStreamSource(stream);
      // AnalyserNode works with its output unconnected: no double playback.
      this.voiceSource.connect(this.analyser);
    } catch {
      this.voiceSource?.disconnect(); this.analyser?.disconnect();
      this.voiceSource = null; this.analyser = null;
      this.measurementFailed = true; // Voice still wins if a browser cannot meter it.
    }
  }
  meterVoice() {
    if (!this.analyser) { this.setDucked(this.measurementFailed); return; }
    this.analyser.getFloatTimeDomainData(this.samples);
    let energy = 0;
    for (const sample of this.samples) energy += sample * sample;
    this.setDucked(this.activity.sample(Math.sqrt(energy / this.samples.length), this.context.currentTime));
  }
  private setDucked(active: boolean) {
    if (active === this.ducked) return;
    this.ducked = active;
    smoothParam(this.graph.duck.gain, active ? AUDIO_LIMITS.duckGain : 1, this.context.currentTime, active ? AUDIO_LIMITS.duckAttack : AUDIO_LIMITS.duckRelease);
  }
  fade(enabled: boolean, seconds: number = AUDIO_LIMITS.enableFade) {
    smoothParam(this.graph.activation.gain, enabled ? 1 : 0, this.context.currentTime, seconds);
  }
  prepareResume() {
    if (this.context.state !== 'running') resetParam(this.graph.activation.gain, 0, this.context.currentTime);
  }
  async suspend() {
    this.graph.clearEvents(); this.activity.reset(); this.setDucked(false);
    if (this.context.state === 'running') await this.context.suspend();
  }
  dispose() {
    this.setVoiceOutput(null); this.graph.dispose();
    this.context.onstatechange = null;
    if (this.context.state !== 'closed') void this.context.close().catch(() => {});
  }
}
