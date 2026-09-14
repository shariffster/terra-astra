import { AUDIO_LIMITS, BUS_NAMES, type BusName } from './world-state';
import { seededRandom, type EventKind } from './seeded-scheduler';
import type { AudioScene } from './audio-scene';
import { harmonicFrame, WEAVE_FREQUENCIES } from './harmonic-weave';

type Ramp = { from: number; to: number; start: number; end: number };
const ramps = new WeakMap<AudioParam, Ramp>();
/** Analytic hold avoids both accumulated automation and a gain jump when a
 * transition is interrupted. Also works in browsers without cancelAndHold. */
export function smoothParam(param: AudioParam, value: number, now: number, seconds = .6) {
  if (!Number.isFinite(value)) return;
  const last = ramps.get(param);
  if (last && Math.abs(last.to - value) < .00001) return;
  const from = last ? last.from + (last.to - last.from) * Math.max(0, Math.min(1, (now - last.start) / Math.max(.0001, last.end - last.start))) : param.value;
  param.cancelScheduledValues(now);
  param.setValueAtTime(from, now);
  param.linearRampToValueAtTime(value, now + Math.max(.005, seconds));
  ramps.set(param, { from, to: value, start: now, end: now + Math.max(.005, seconds) });
}

/** Used only while inaudible/suspended, before resuming a context. */
export function resetParam(param: AudioParam, value: number, now: number) {
  param.cancelScheduledValues(now); param.setValueAtTime(value, now); ramps.delete(param);
}

type Texture = { source: AudioScheduledSourceNode; gain: GainNode; pan: StereoPannerNode; filter?: BiquadFilterNode };
type Voice = { source: AudioScheduledSourceNode; gain: GainNode; nodes: AudioNode[]; end: number; stopped: boolean };

/** Native graph shared by real-time playback and PCM review rendering. Sources
 * are normalized; the last bounded transfer function gives a strict ceiling. */
export class WorldAudioGraph {
  readonly buses: Record<BusName, GainNode>;
  readonly master: GainNode;
  readonly duck: GainNode;
  readonly activation: GainNode;
  readonly output: GainNode;
  readonly colour: BiquadFilterNode;
  private readonly nodes: AudioNode[] = [];
  private readonly persistent: Texture[] = [];
  private readonly voices = new Set<Voice>();
  private readonly noise: AudioBuffer;
  private readonly planet: Texture[];
  private readonly ocean: Texture[];
  private readonly air: Texture;
  private readonly partials: Texture[];
  private readonly pressure: Texture;
  private readonly weave: Texture[];
  private readonly harmonicRoom: GainNode;
  private readonly harmonicColour: BiquadFilterNode;
  private disposed = false;
  peakVoices = 0;
  eventCount = 0;

  readonly context: BaseAudioContext;
  constructor(context: BaseAudioContext) {
    this.context = context;
    const own = <T extends AudioNode>(node: T) => { this.nodes.push(node); return node; };
    this.master = own(context.createGain()); this.master.gain.value = AUDIO_LIMITS.master;
    this.duck = own(context.createGain());
    this.activation = own(context.createGain()); this.activation.gain.value = 0;
    this.output = own(context.createGain());
    const highpass = own(context.createBiquadFilter()); highpass.type = 'highpass'; highpass.frequency.value = 26; highpass.Q.value = .5;
    this.colour = own(context.createBiquadFilter()); this.colour.type = 'lowpass'; this.colour.frequency.value = 8500; this.colour.Q.value = .5;
    const compressor = own(context.createDynamicsCompressor());
    compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 8;
    compressor.attack.value = .005; compressor.release.value = .25;
    const ceiling = own(context.createWaveShaper());
    const curve = new Float32Array(4097);
    for (let i = 0; i < curve.length; i++) curve[i] = .8 * Math.tanh((i / (curve.length - 1) * 2 - 1) / .8);
    ceiling.curve = curve; // Output is strictly < .8 × .14 = .112 (-19 dBFS).
    highpass.connect(this.colour).connect(compressor).connect(ceiling).connect(this.master).connect(this.duck).connect(this.activation).connect(this.output);
    this.output.connect(context.destination);
    this.buses = Object.fromEntries(BUS_NAMES.map(name => {
      const gain = own(context.createGain()); gain.gain.value = 0; gain.connect(highpass); return [name, gain];
    })) as Record<BusName, GainNode>;
    this.harmonicRoom = own(context.createGain());
    this.harmonicColour = own(context.createBiquadFilter());
    this.harmonicColour.type = 'lowpass'; this.harmonicColour.frequency.value = 3200; this.harmonicColour.Q.value = .5;
    this.harmonicRoom.connect(this.harmonicColour).connect(this.buses.harmonic);
    // Two quiet damped reflections give the sustained figure depth. The bus
    // follows the room, so settlement and voice ducking clear the whole field.
    for (const [seconds, position] of [[.413, -.65], [.619, .65]]) {
      const delay = own(context.createDelay(1)); delay.delayTime.value = seconds;
      const filter = own(context.createBiquadFilter()); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = .5;
      const feedback = own(context.createGain()); feedback.gain.value = .22;
      const wet = own(context.createGain()); wet.gain.value = .22;
      const pan = own(context.createStereoPanner()); pan.pan.value = position;
      this.harmonicColour.connect(delay).connect(filter);
      filter.connect(feedback).connect(delay); filter.connect(wet).connect(pan).connect(this.buses.harmonic);
    }
    this.noise = context.createBuffer(1, Math.round(context.sampleRate * 8), context.sampleRate);
    const random = seededRandom(728103), data = this.noise.getChannelData(0);
    // Sum differently correlated bands: a soft, continuous coloured texture
    // with much less high-frequency energy than the rejected white-noise pass.
    let slow = 0, middle = 0, fast = 0;
    for (let i = 0; i < data.length; i++) {
      const white = random() * 2 - 1;
      slow = slow * .995 + white * .005;
      middle = middle * .97 + white * .03;
      fast = fast * .8 + white * .2;
      data[i] = Math.max(-.8, Math.min(.8, slow * 2.4 + middle * .85 + fast * .12));
    }
    // Feather the loop seam, while offset sources avoid a shared repetition.
    const seam = Math.round(context.sampleRate * .12);
    for (let i = 0; i < seam; i++) data[data.length - seam + i] = data[data.length - seam + i] * (1 - i / seam) + data[i] * (i / seam);
    this.planet = [this.tone('planet', 54, .10), this.tone('planet', 162, .019)];
    this.ocean = [this.texture('ocean', 290, .24, -.5, 0), this.texture('ocean', 440, .14, .5, 3.713)];
    this.air = this.texture('atmosphere', 620, .13, 0, 1.731);
    this.partials = [this.tone('destination', 108, 0), this.tone('destination', 162, 0), this.tone('destination', 216, 0)];
    this.pressure = this.tone('destination', 36, 0);
    const organ = context.createPeriodicWave(new Float32Array(7), new Float32Array([0, 1, .30, .14, .045, .02, .008]));
    this.weave = WEAVE_FREQUENCIES.map((hz, i) => {
      const source = context.createOscillator(); source.frequency.value = hz; source.setPeriodicWave(organ);
      const texture = this.chain(source, 'harmonic', 0, (i % 2 ? 1 : -1) * .15);
      source.start(); return texture;
    });
    if (this.persistent.length > AUDIO_LIMITS.maxPersistentSources) throw new Error('Persistent audio budget exceeded');
  }

  private chain(source: AudioScheduledSourceNode, bus: BusName, level: number, panValue: number, filter?: BiquadFilterNode): Texture {
    const gain = this.context.createGain(), pan = this.context.createStereoPanner();
    gain.gain.value = level; pan.pan.value = panValue;
    if (filter) {
      const softness = this.context.createBiquadFilter(); softness.type = 'lowpass'; softness.frequency.value = 1600; softness.Q.value = .5;
      source.connect(filter).connect(softness).connect(gain); this.nodes.push(softness);
    } else source.connect(gain);
    gain.connect(pan).connect(bus === 'harmonic' ? this.harmonicRoom : this.buses[bus]);
    this.nodes.push(source, gain, pan, ...(filter ? [filter] : []));
    const texture = { source, gain, pan, filter }; this.persistent.push(texture); return texture;
  }
  private tone(bus: BusName, hz: number, level: number) {
    const source = this.context.createOscillator(); source.type = 'sine'; source.frequency.value = hz;
    const texture = this.chain(source, bus, level, 0); source.start(); return texture;
  }
  private texture(bus: BusName, hz: number, level: number, pan: number, offset: number) {
    const source = this.context.createBufferSource(); source.buffer = this.noise; source.loop = true;
    const filter = this.context.createBiquadFilter(); filter.type = 'bandpass'; filter.Q.value = .55; filter.frequency.value = hz;
    const texture = this.chain(source, bus, level, pan, filter); source.start(0, offset); return texture;
  }

  apply(scene: AudioScene, now = this.context.currentTime, clear = false) {
    if (this.disposed) return;
    for (const bus of BUS_NAMES) smoothParam(this.buses[bus].gain, scene.buses[bus], now, clear ? .12 : scene.genesis ? .1 : .65);
    smoothParam(this.colour.frequency, scene.cutoff, now, .7);
    smoothParam(this.planet[0].gain.gain, .10 * scene.breath, now, 1.4);
    smoothParam(this.planet[1].gain.gain, .019 * scene.breath, now, 1.4);
    smoothParam(this.air.filter!.frequency, scene.airHz, now, .7);
    smoothParam(this.air.gain.gain, .13 * scene.swell, now, 1.5);
    smoothParam(this.air.pan.pan, scene.motion ? Math.sin(scene.phase * 3.2) * scene.width * .35 + scene.drift : 0, now, .7);
    this.ocean.forEach((texture, i) => {
      smoothParam(texture.filter!.frequency, scene.oceanHz * (i ? 1.1 : .7) * (.78 + scene.swell * .22), now, 1.6);
      smoothParam(texture.pan.pan, (i ? 1 : -1) * scene.width * .65, now, .8);
      const wave = i ? .22 + .78 * (1 - scene.swell) ** 2 : scene.swell;
      smoothParam(texture.gain.gain, (i ? .14 : .24) * wave, now, 1.8);
    });
    this.partials.forEach((partial, i) => {
      // Phase comes from the same visual movement time; no tempo or tune.
      const phase = scene.phase + i * Math.PI * 2 / 3;
      const movement = scene.motion ? .72 + .28 * Math.sin(phase) : .78;
      smoothParam(partial.gain.gain, scene.circulation * [ .037, .021, .013 ][i] * movement, now, scene.genesis ? .09 : 1);
      smoothParam(partial.pan.pan, scene.motion ? Math.cos(phase) * scene.width : 0, now, .8);
    });
    smoothParam(this.pressure.gain.gain, scene.pressure * .065, now, .9);
    const weave = harmonicFrame(scene.seconds, scene.harmonicPresence, scene.motion, scene.harmonicIntroduction, scene.harmonicDetail);
    smoothParam(this.harmonicColour.frequency, scene.harmonicIntroduction ? 8500 : weave.colour * (.8 + scene.harmonicDetail * .2), now, 2);
    this.weave.forEach((tone, i) => {
      // Voicing changes at phrase boundaries, after a guaranteed quiet tail.
      smoothParam((tone.source as OscillatorNode).frequency, weave.frequencies[i], now, .4);
      smoothParam(tone.gain.gain, weave.levels[i], now, i < 2 && !scene.harmonicIntroduction ? 3.2 : .18);
      smoothParam(tone.pan.pan, (i % 2 ? 1 : -1) * scene.width * (.12 + i * .065) * weave.spread, now, .8);
    });
    this.prune(now);
  }

  play(kind: EventKind, variation: number, position: number, scene: AudioScene, now = this.context.currentTime) {
    this.prune(now);
    if (this.disposed || this.voices.size >= AUDIO_LIMITS.maxOneShots || scene.buses[kind] < .015) return false;
    const noise = kind === 'atmosphere' || kind === 'ocean' || kind === 'urban';
    const source = noise ? this.context.createBufferSource() : this.context.createOscillator();
    const filter = this.context.createBiquadFilter(), softness = this.context.createBiquadFilter(), gain = this.context.createGain(), pan = this.context.createStereoPanner();
    const hz = kind === 'orbit' ? 620 + variation * 830 : kind === 'network' ? 180 + variation * 100 : kind === 'ocean' ? 110 + variation * 130 : kind === 'atmosphere' ? 630 + variation * 340 : scene.grainHz * (.85 + variation * .3);
    const attack = kind === 'urban' ? .12 + variation * .09 : kind === 'orbit' ? .28 : kind === 'network' ? .85 : 1.8;
    const duration = kind === 'urban' ? .55 + variation * .45 : kind === 'orbit' ? 2.1 + variation : kind === 'network' ? 4.1 : 5.5 + variation * 1.5;
    const level = kind === 'orbit' ? .032 : kind === 'urban' ? .14 : kind === 'network' ? .044 : noise ? .25 : .055;
    filter.type = 'bandpass'; filter.frequency.value = hz; filter.Q.value = noise ? .8 : .55;
    softness.type = 'lowpass'; softness.frequency.value = noise ? 1200 : 2600; softness.Q.value = .5;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + attack);
    gain.gain.exponentialRampToValueAtTime(.00001, now + duration - .03);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    const startPan = position * scene.width;
    pan.pan.setValueAtTime(startPan, now);
    if (scene.motion && kind !== 'urban') pan.pan.linearRampToValueAtTime(startPan * -.45, now + duration);
    source.connect(filter).connect(softness).connect(gain).connect(pan).connect(this.buses[kind]);
    if (noise) {
      const buffer = source as AudioBufferSourceNode; buffer.buffer = this.noise; buffer.loop = true;
      buffer.start(now, variation * 3);
    } else {
      const oscillator = source as OscillatorNode; oscillator.type = 'sine'; oscillator.frequency.value = hz;
      oscillator.start(now);
    }
    source.stop(now + duration + .02);
    const voice: Voice = { source, gain, nodes: [source, filter, softness, gain, pan], end: now + duration + .02, stopped: false };
    this.voices.add(voice); this.eventCount++; this.peakVoices = Math.max(this.peakVoices, this.voices.size);
    source.onended = () => this.release(voice);
    return true;
  }

  private release(voice: Voice) {
    voice.source.onended = null;
    for (const node of voice.nodes) node.disconnect();
    this.voices.delete(voice);
  }
  private prune(now: number) {
    for (const voice of this.voices) if (voice.end <= now) this.release(voice);
  }
  clearEvents(now = this.context.currentTime, seconds = .12) {
    for (const voice of this.voices) {
      if (voice.stopped) continue;
      voice.stopped = true;
      const param = voice.gain.gain;
      if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
      else { const value = param.value; param.cancelScheduledValues(now); param.setValueAtTime(value, now); }
      param.linearRampToValueAtTime(0, now + seconds);
      voice.source.stop(now + seconds + .01); voice.end = now + seconds + .01;
    }
  }
  get diagnostics() { return { voices: this.voices.size, persistentSources: this.persistent.length, peakVoices: this.peakVoices, events: this.eventCount }; }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const voice of this.voices) { try { voice.source.stop(); } catch { /* Already ended. */ } this.release(voice); }
    for (const texture of this.persistent) { try { texture.source.stop(); } catch { /* Already ended. */ } }
    for (const node of this.nodes) node.disconnect();
    this.nodes.length = 0; this.persistent.length = 0;
  }
}
