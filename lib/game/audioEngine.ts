/**
 * Nostalgic Web Audio Synthesizer & Sound Effects Engine
 * Generates 90s radio music, vinyl tape warmth, and realistic chai brewing sound effects.
 */

export type PourSoundKind = 'water' | 'milk' | 'grain' | 'sugar';

/** Collectible nostalgia sounds, synthesised rather than sampled. */
export type NostalgiaClip =
  | 'cooker-whistle'
  | 'cycle-bell'
  | 'crowd-roar'
  | 'evening-raga'
  | 'temple-bell';

interface PourProfile {
  filterType: BiquadFilterType;
  freqFrom: number;
  freqTo: number;
  q: number;
  peak: number;
  settleFreq: number;
}

const POUR_PROFILES: Record<PourSoundKind, PourProfile> = {
  water: { filterType: 'bandpass', freqFrom: 780, freqTo: 1750, q: 1.2, peak: 0.24, settleFreq: 520 },
  milk: { filterType: 'lowpass', freqFrom: 540, freqTo: 980, q: 0.9, peak: 0.22, settleFreq: 340 },
  grain: { filterType: 'highpass', freqFrom: 2200, freqTo: 3600, q: 0.8, peak: 0.18, settleFreq: 1600 },
  sugar: { filterType: 'bandpass', freqFrom: 1500, freqTo: 2400, q: 1.6, peak: 0.17, settleFreq: 900 },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isRadioPlaying: boolean = false;
  private activeStationId: string = 'vividh_bharati';
  private radioInterval: number | null = null;
  private tapeHissNode: AudioNode | null = null;
  private masterGain: GainNode | null = null;
  private radioGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private boilingNode: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private flameNode: { noise: AudioBufferSourceNode; gain: GainNode } | null = null;
  private pourNode: {
    source: AudioBufferSourceNode;
    filter: BiquadFilterNode;
    gain: GainNode;
    profile: PourProfile;
  } | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.radioGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getRadioPlaying(): boolean {
    return this.isRadioPlaying;
  }

  public getActiveStation(): string {
    return this.activeStationId;
  }

  // --- 90s RADIO ENGINE ---
  public startRadio(stationId: string = 'vividh_bharati') {
    this.initContext();
    if (!this.ctx || !this.radioGain) return;
    this.activeStationId = stationId;
    this.isRadioPlaying = true;
    this.stopRadioMelody();

    // Start tape warmth / subtle vinyl hiss
    this.startTapeWarmth();

    // Play melody sequences for nostalgic Indian vibes
    this.playStationMelody(stationId);
  }

  public stopRadio() {
    this.isRadioPlaying = false;
    this.stopRadioMelody();
    this.stopTapeWarmth();
  }

  public switchStation(stationId: string) {
    if (this.isRadioPlaying) {
      this.playTuningStaticSound();
      this.startRadio(stationId);
    } else {
      this.activeStationId = stationId;
    }
  }

  private startTapeWarmth() {
    if (!this.ctx || !this.radioGain || this.tapeHissNode) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.015;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.radioGain);

      noise.start();
      this.tapeHissNode = noise;
    } catch {
      // Ignored
    }
  }

  private stopTapeWarmth() {
    if (this.tapeHissNode) {
      try {
        (this.tapeHissNode as AudioBufferSourceNode).stop();
      } catch {
        // Ignored
      }
      this.tapeHissNode = null;
    }
  }

  private playStationMelody(stationId: string) {
    if (!this.ctx || !this.radioGain) return;

    // Nostalgic melodic notes (Frequencies in Hz)
    // Scale: D Minor / Bhoopali / Kalyan classic 90s Indian nostalgic progressions
    const notesDMinor = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33]; // D4, E4, F4, G4, A4, C5, D5
    const notesBhoopali = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33]; // C, D, E, G, A, C5, D5 (Raag Bhoopali)
    const notesMonsoon = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00]; // A Minor nostalgic rains

    let scale = notesDMinor;
    let tempo = 500;

    if (stationId === 'maa_ki_rasoi') {
      scale = notesBhoopali;
      tempo = 650;
    } else if (stationId === 'monsoon_tapri') {
      scale = notesMonsoon;
      tempo = 450;
    }

    let step = 0;
    const melodyPattern = [
      0, 2, 4, 3, 2, 0, 1, 2, 4, 5, 4, 3, 2, 4, 2, 0,
      1, 3, 5, 4, 3, 1, 2, 4, 6, 5, 4, 3, 2, 0, 2, 0
    ];

    const playNextNote = () => {
      if (!this.isRadioPlaying || !this.ctx || !this.radioGain) return;

      const noteIdx = melodyPattern[step % melodyPattern.length];
      const freq = scale[noteIdx % scale.length];
      const now = this.ctx.currentTime;

      // Primary tone (Warm flute / harmonium style sine + triangle)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc1.type = stationId === 'maa_ki_rasoi' ? 'triangle' : 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 0.5, now); // Sub warmth

      // Nostalgic warm envelope
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + (tempo / 1000) * 1.5);

      // Warm lowpass filter for 90s cassette warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(stationId === 'maa_ki_rasoi' ? 1400 : 2000, now);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(filter);
      filter.connect(this.radioGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + (tempo / 1000) * 1.6);
      osc2.stop(now + (tempo / 1000) * 1.6);

      step++;
    };

    playNextNote();
    this.radioInterval = window.setInterval(playNextNote, tempo);
  }

  private stopRadioMelody() {
    if (this.radioInterval !== null) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  // --- SOUND EFFECTS FOR CHAI MAKING ---

  public playTuningStaticSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Stove lighter click + burner flame sound
  public playStoveIgnition() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Spark click
    const osc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);

    // Whoosh gas ignite
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now + 0.03);
    filter.frequency.linearRampToValueAtTime(700, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now + 0.03);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.48);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now + 0.03);
  }

  // Sachet tear sound
  public playSachetTear() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  // Pouring granular tea leaves / sugar / spices into liquid
  public playIngredientPour(type: 'tea_powder' | 'sugar' | 'ginger' | 'elaichi') {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    this.playSachetTear();

    // Splash / sprinkle noise
    const duration = 0.9;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    if (type === 'tea_powder') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(2, now);
    } else if (type === 'sugar') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2800, now);
    } else if (type === 'ginger') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
    } else {
      // Elaichi pod crush & sprinkle
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now + 0.1);

    // Warm chord chime indicating ingredient accepted
    this.playChime(type === 'tea_powder' ? 392 : type === 'sugar' ? 440 : type === 'ginger' ? 523 : 587);
  }

  public playChime(freq: number = 523.25) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  // --- HOLD-TO-POUR STREAM ---

  private createNoiseBuffer(seconds: number, amplitude: number) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * amplitude;
    }
    return buffer;
  }

  /** Starts a looping stream whose body grows for as long as the player holds. */
  public startPour(kind: PourSoundKind) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    this.stopPour(false);

    const profile = POUR_PROFILES[kind];
    const now = this.ctx.currentTime;

    try {
      const buffer = this.createNoiseBuffer(2, 0.3);
      if (!buffer) return;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = profile.filterType;
      filter.frequency.setValueAtTime(profile.freqFrom, now);
      filter.Q.setValueAtTime(profile.q, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(profile.peak * 0.35, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);

      this.pourNode = { source: noise, filter, gain, profile };
    } catch {
      // Ignored
    }
  }

  /** ratio is the live flow (0..1) so the stream audibly opens up as the vessel tilts. */
  public setPourIntensity(ratio: number) {
    if (!this.pourNode || !this.ctx) return;
    const { filter, gain, profile } = this.pourNode;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    const now = this.ctx.currentTime;
    filter.frequency.setTargetAtTime(
      profile.freqFrom + (profile.freqTo - profile.freqFrom) * clamped,
      now,
      0.05,
    );
    gain.gain.setTargetAtTime(profile.peak * (0.35 + clamped * 0.65), now, 0.05);
  }

  public stopPour(withSettle: boolean = true) {
    if (!this.pourNode || !this.ctx) return;
    const { source, gain, profile } = this.pourNode;
    const now = this.ctx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.03);
    try {
      source.stop(now + 0.22);
    } catch {
      // Ignored
    }
    this.pourNode = null;

    if (withSettle) {
      this.playPourSettle(profile.settleFreq);
    }
  }

  /** The last drops landing in the pot. */
  private playPourSettle(freq: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.16);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Kettle whistle for the brewing beat: two detuned oscillators plus breath noise,
   * sliding up into a held note and falling away as the flame goes off.
   */
  public playKettleWhistle(duration: number = 2.2) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const body = this.ctx.createGain();
    body.gain.setValueAtTime(0.0001, now);
    body.gain.linearRampToValueAtTime(0.16, now + duration * 0.35);
    body.gain.setValueAtTime(0.16, now + duration * 0.72);
    body.gain.exponentialRampToValueAtTime(0.0005, now + duration);
    body.connect(this.sfxGain);

    [1, 1.006].forEach((detune, index) => {
      const osc = this.ctx!.createOscillator();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(1180 * detune, now);
      osc.frequency.exponentialRampToValueAtTime(2050 * detune, now + duration * 0.4);
      osc.frequency.linearRampToValueAtTime(1990 * detune, now + duration);

      // Slight wobble so the whistle breathes instead of sitting dead still.
      const vibrato = this.ctx!.createOscillator();
      const vibratoGain = this.ctx!.createGain();
      vibrato.frequency.setValueAtTime(5.5 + index, now);
      vibratoGain.gain.setValueAtTime(14, now);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      osc.connect(body);
      osc.start(now);
      vibrato.start(now);
      osc.stop(now + duration + 0.05);
      vibrato.stop(now + duration + 0.05);
    });

    const buffer = this.createNoiseBuffer(duration + 0.2, 0.25);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.05, now + duration * 0.45);
      noiseGain.gain.exponentialRampToValueAtTime(0.0005, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
    }
  }

  // --- AMBIENT BACKGROUND (low-volume 90s transistor) ---

  public startAmbient(stationId: string = 'monsoon_tapri') {
    this.initContext();
    if (this.radioGain && this.ctx) {
      this.radioGain.gain.setTargetAtTime(0.13, this.ctx.currentTime, 0.4);
    }
    this.startRadio(stationId);
  }

  public stopAmbient() {
    this.stopRadio();
  }

  // Boiling simmering sound loop
  public startBoilingSound(intensity: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.boilingNode) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + intensity * 600, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18 * intensity, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
      this.boilingNode = { source: noise, filter, gain };
    } catch {
      // Ignored
    }
  }

  public setBoilingIntensity(intensity: number) {
    if (this.boilingNode && this.ctx) {
      this.boilingNode.filter.frequency.setTargetAtTime(600 + intensity * 800, this.ctx.currentTime, 0.2);
      this.boilingNode.gain.gain.setTargetAtTime(0.25 * intensity, this.ctx.currentTime, 0.2);
    }
  }

  public stopBoilingSound() {
    if (this.boilingNode) {
      try {
        this.boilingNode.source.stop();
      } catch {
        // Ignored
      }
      this.boilingNode = null;
    }
  }

  // Kettle pouring stream sound into cup
  public playKettlePour() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const duration = 2.2;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1400, now + duration * 0.8);
    filter.Q.setValueAtTime(4, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
    gain.gain.setValueAtTime(0.38, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  // Victory Fanfare for 300ml Chai Ready!
  public playVictoryFanfare() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const notes = [392, 440, 523.25, 659.25, 783.99]; // G4, A4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.14;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(noteTime);
      osc.stop(noteTime + 0.75);
    });
  }

  // --- NOSTALGIA FRAGMENT CLIPS ---

  /** Plays a collectible clip and reports how long it runs, in ms. */
  public playNostalgiaClip(clip: NostalgiaClip): number {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return 0;

    switch (clip) {
      case 'cooker-whistle':
        return this.playCookerWhistle();
      case 'cycle-bell':
        return this.playCycleBell();
      case 'crowd-roar':
        return this.playCrowdRoar();
      case 'evening-raga':
        return this.playEveningRaga();
      case 'temple-bell':
        return this.playTempleBell();
      default:
        return 0;
    }
  }

  /**
   * One shaped tone. Kept private and generic so each clip below reads as
   * musical intent rather than a wall of Web Audio boilerplate.
   */
  private tone(options: {
    at: number;
    freq: number;
    endFreq?: number;
    duration: number;
    type?: OscillatorType;
    peak?: number;
    attack?: number;
    filterType?: BiquadFilterType;
    filterHz?: number;
  }) {
    if (!this.ctx || !this.sfxGain) return;
    const {
      at,
      freq,
      endFreq,
      duration,
      type = 'sine',
      peak = 0.2,
      attack = 0.02,
      filterType,
      filterHz,
    } = options;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), at + duration);
    }

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0005, at + duration);

    osc.connect(gain);
    if (filterType && filterHz) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterHz, at);
      gain.connect(filter);
      filter.connect(this.sfxGain);
    } else {
      gain.connect(this.sfxGain);
    }

    osc.start(at);
    osc.stop(at + duration + 0.05);
  }

  /** Three whistles from the next room, each a little more insistent. */
  private playCookerWhistle(): number {
    if (!this.ctx || !this.sfxGain) return 0;
    const now = this.ctx.currentTime;
    const bursts = [0, 0.78, 1.56];

    bursts.forEach((offset, index) => {
      const at = now + offset;
      const duration = 0.52 + index * 0.06;

      [1, 1.008].forEach((detune, layer) => {
        this.tone({
          at,
          freq: 1520 * detune,
          endFreq: 1760 * detune,
          duration,
          type: layer === 0 ? 'sine' : 'triangle',
          peak: 0.11,
          attack: 0.07,
        });
      });

      // Steam escaping around the weight.
      const buffer = this.createNoiseBuffer(duration + 0.1, 0.22);
      if (!buffer) return;
      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, at);
      filter.Q.setValueAtTime(2.2, at);
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.05, at + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0005, at + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      noise.start(at);
    });

    return 2400;
  }

  /** The doodhwala's cycle bell: a struck metal ring, twice. */
  private playCycleBell(): number {
    if (!this.ctx) return 0;
    const now = this.ctx.currentTime;

    [0, 0.34, 0.72].forEach((offset, index) => {
      const at = now + offset;
      const peak = 0.17 - index * 0.03;
      // Inharmonic partials are what make it read as metal rather than a beep.
      [
        { freq: 1860, duration: 0.55, level: 1 },
        { freq: 2790, duration: 0.4, level: 0.6 },
        { freq: 4300, duration: 0.26, level: 0.35 },
      ].forEach((partial) => {
        this.tone({
          at,
          freq: partial.freq,
          duration: partial.duration,
          type: 'sine',
          peak: peak * partial.level,
          attack: 0.004,
        });
      });
    });

    return 1400;
  }

  /** The whole lane cheering at once — a swell of filtered noise plus claps. */
  private playCrowdRoar(): number {
    if (!this.ctx || !this.sfxGain) return 0;
    const now = this.ctx.currentTime;
    const duration = 2.6;

    const buffer = this.createNoiseBuffer(duration + 0.2, 0.4);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520, now);
      filter.frequency.linearRampToValueAtTime(1150, now + duration * 0.45);
      filter.frequency.linearRampToValueAtTime(700, now + duration);
      filter.Q.setValueAtTime(0.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + duration * 0.4);
      gain.gain.setValueAtTime(0.2, now + duration * 0.65);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
    }

    // Scattered claps riding on top of the roar.
    for (let index = 0; index < 22; index += 1) {
      const at = now + 0.25 + Math.random() * (duration - 0.7);
      const clapBuffer = this.createNoiseBuffer(0.05, 0.5);
      if (!clapBuffer) continue;
      const clap = this.ctx.createBufferSource();
      clap.buffer = clapBuffer;
      const clapFilter = this.ctx.createBiquadFilter();
      clapFilter.type = 'highpass';
      clapFilter.frequency.setValueAtTime(1800, at);
      const clapGain = this.ctx.createGain();
      clapGain.gain.setValueAtTime(0.05 + Math.random() * 0.05, at);
      clapGain.gain.exponentialRampToValueAtTime(0.0005, at + 0.05);
      clap.connect(clapFilter);
      clapFilter.connect(clapGain);
      clapGain.connect(this.sfxGain);
      clap.start(at);
    }

    return 2700;
  }

  /** A drifting transistor tune, cassette-warm and slightly out of tune. */
  private playEveningRaga(): number {
    if (!this.ctx || !this.sfxGain) return 0;
    const now = this.ctx.currentTime;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const pattern = [0, 1, 2, 4, 3, 2, 1, 3, 2, 0];
    const step = 0.34;

    pattern.forEach((noteIndex, position) => {
      const at = now + position * step;
      const freq = scale[noteIndex];
      this.tone({
        at,
        freq,
        duration: step * 1.7,
        type: 'triangle',
        peak: 0.13,
        attack: 0.06,
        filterType: 'lowpass',
        filterHz: 1500,
      });
      this.tone({
        at,
        freq: freq * 0.5,
        duration: step * 1.5,
        type: 'sine',
        peak: 0.07,
        attack: 0.08,
      });
    });

    const duration = pattern.length * step + 0.6;

    // Tape hiss under the melody, so it sounds like it came through a speaker.
    const buffer = this.createNoiseBuffer(duration, 0.05);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
    }

    return duration * 1000;
  }

  /** The 6 AM bell two lanes away: long decay, struck twice. */
  private playTempleBell(): number {
    if (!this.ctx) return 0;
    const now = this.ctx.currentTime;

    [0, 1.5].forEach((offset, index) => {
      const at = now + offset;
      const level = index === 0 ? 1 : 0.7;
      [
        { freq: 293.66, duration: 3.2, level: 1 },
        { freq: 440.0, duration: 2.4, level: 0.55 },
        { freq: 587.33, duration: 1.8, level: 0.35 },
        { freq: 880.0, duration: 1.1, level: 0.2 },
      ].forEach((partial) => {
        this.tone({
          at,
          freq: partial.freq,
          duration: partial.duration,
          type: 'sine',
          peak: 0.2 * partial.level * level,
          attack: 0.006,
        });
      });
    });

    return 4200;
  }
}

export const audioEngine = new AudioEngine();
