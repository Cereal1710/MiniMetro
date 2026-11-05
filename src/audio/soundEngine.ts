/**
 * Procedural Web Audio Engine for Mini Metro Manager
 * Synthesizes pentatonic melodic chimes, train departure clicks, station bell,
 * and overcrowding alarm pulses with pleasant ambient timbre.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  private pentatonicFreqs = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00  // A5
  ];

  // Station Ambience State & Audio Nodes
  private isAmbienceRunning: boolean = false;
  private ambienceGainNode: GainNode | null = null;
  private rumbleSource: AudioBufferSourceNode | null = null;
  private subwayOsc: OscillatorNode | null = null;
  private chimeTimer: ReturnType<typeof setTimeout> | null = null;
  private clickClackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // AudioContext will be lazily initialized upon first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = typeof window !== 'undefined'
        ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
        : null;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambienceGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambienceGainNode.gain.setValueAtTime(this.ambienceGainNode.gain.value, now);
        this.ambienceGainNode.gain.linearRampToValueAtTime(muted ? 0 : 0.08 * this.volume, now + 0.3);
      } catch {}
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ambienceGainNode && this.ctx && !this.isMuted) {
      try {
        const now = this.ctx.currentTime;
        this.ambienceGainNode.gain.setValueAtTime(this.ambienceGainNode.gain.value, now);
        this.ambienceGainNode.gain.linearRampToValueAtTime(0.08 * this.volume, now + 0.2);
      } catch {}
    }
  }

  /**
   * Played when a passenger boards a train (subtle wooden / tick chime)
   */
  public playBoard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = this.pentatonicFreqs[Math.floor(Math.random() * 5)];
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore audio context failures
    }
  }

  /**
   * Played when a passenger arrives at their destination (rewarding crystalline chime)
   */
  public playArrive(bonusLevel = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseIdx = Math.min(this.pentatonicFreqs.length - 1, 4 + (bonusLevel % 5));
      const freq1 = this.pentatonicFreqs[baseIdx];
      const freq2 = this.pentatonicFreqs[Math.min(this.pentatonicFreqs.length - 1, baseIdx + 2)];

      [freq1, freq2].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.001, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.5);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Played when a new station pops up in the city
   */
  public playStationSpawn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(196, now); // G3
      osc.frequency.exponentialRampToValueAtTime(392, now + 0.2); // G4

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {
      // ignore
    }
  }

  /**
   * Line connection click / snap
   */
  public playConnect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.15 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  /**
   * Line removed / undo
   */
  public playDisconnect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  /**
   * Overcrowding warning tick (subtle heartbeat / danger alert)
   */
  public playWarning(intensity = 0.5) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = 180 + intensity * 120;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15 * this.volume * Math.max(0.3, intensity), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  /**
   * Cash reward sound
   */
  public playCashReward() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 880.00]; // D5 -> A5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  public playCash() {
    this.playCashReward();
  }

  /**
   * Upgrade unlocked or celebration fanfare
   */
  public playFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.55);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Game Over buzzer / melancholic chord
   */
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [330, 311, 293, 261];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.001, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + idx * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.75);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Authentic Hanoi Metro (Line 2A Cat Linh - Ha Dong) 4-note arrival chime
   */
  public playHanoiMetroChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Melodic major chime: E5 -> G#5 -> B5 -> E6
      const chimeNotes = [659.25, 830.61, 987.77, 1318.51];
      chimeNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);

        gain.gain.setValueAtTime(0.001, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + idx * 0.16 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.65);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Resonant bell of St. Joseph's Cathedral / Hanoi Temple
   */
  public playCathedralBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const fundamental = 220; // A3 deep bronze bell
      const harmonics = [1, 2.02, 2.76, 4.07, 5.43];

      harmonics.forEach((h, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(fundamental * h, now);

        const decay = 2.4 / (idx + 1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime((0.15 / (idx + 1)) * this.volume, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Inspector boards train - distinctive dual-whistle chirp
   */
  public playInspectorBoard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-pitched conductor whistle: 1480Hz -> 1760Hz
      [0, 0.08].forEach((delay, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 1480 : 1760, now + delay);
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.14 * this.volume, now + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.14);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Inspector visits and verifies a station - ascending chime with progress level
   */
  public playInspectorCheck(step = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 523.25; // C5
      const noteMultiplier = Math.pow(2, (step * 2) / 12);
      const freq = baseFreq * noteMultiplier;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.16 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }

  /**
   * Inspector finishes 5 stations successfully: glorious triumphant victory fanfare
   */
  public playInspectorReward() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Bright major triad arpeggio: C5 -> E5 -> G5 -> C6
      const chordNotes = [523.25, 659.25, 783.99, 1046.50];
      chordNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);

        gain.gain.setValueAtTime(0.001, now + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.20 * this.volume, now + idx * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.55);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Inspector mission failed (timeout or overcrowding) - low buzz
   */
  public playInspectorFail() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15 * this.volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  /**
   * Authentic resonant two-tone Train Whistle / Horn
   */
  public playTrainWhistle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [440, 554.37].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 0.45);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      });
    } catch {}
  }

  /**
   * Authentic Double-Honk City Bus Horn (Beep-Beep!)
   */
  public playBusHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.12].forEach((offset) => {
        [349.23, 440].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset);

          gain.gain.setValueAtTime(0.001, now + offset);
          gain.gain.linearRampToValueAtTime(0.14 * this.volume, now + offset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      });
    } catch {}
  }

  /**
   * Futuristic Turbo Nitro Boost whoosh
   */
  public playTurboBoost() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.3);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }

  /**
   * Royal VIP passenger arrival chime
   */
  public playVipSpawn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {}
  }

  /**
   * VIP Mission accomplished / huge cash celebration fanfare
   */
  public playVipSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.22 * this.volume, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.65);
      });
    } catch {}
  }

  /**
   * Adrenaline-pumping Frenzy Rush start boom
   */
  public playFrenzyStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {}
  }

  /**
   * Fast combo chime
   */
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 440;
      const freq = baseFreq * Math.pow(1.05946, Math.min(18, comboCount * 2));
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /**
   * Generates a 4-second seamless looping pink/brown noise buffer for subterranean subway rumble
   */
  private createRumbleBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    try {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
      return buffer;
    } catch {
      return null;
    }
  }

  /**
   * Start realistic, immersive subway station ambience:
   * Low tunnel rumble, gentle air resonance, distant rail click-clack, and authentic station PA chimes
   */
  public startStationAmbience() {
    if (this.isAmbienceRunning) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.isAmbienceRunning = true;
      const now = this.ctx.currentTime;

      // Master Ambience Gain
      const masterGain = this.ctx.createGain();
      const targetGain = this.isMuted ? 0 : 0.08 * this.volume;
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(targetGain, now + 1.5);
      masterGain.connect(this.ctx.destination);
      this.ambienceGainNode = masterGain;

      // 1. Low Tunnel Rumble (Filtered Brown Noise)
      const rumbleBuf = this.createRumbleBuffer();
      if (rumbleBuf) {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = rumbleBuf;
        noiseSource.loop = true;

        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(140, now);
        rumbleFilter.Q.setValueAtTime(1.8, now);

        noiseSource.connect(rumbleFilter);
        rumbleFilter.connect(masterGain);
        noiseSource.start(now);
        this.rumbleSource = noiseSource;
      }

      // 2. Subterranean Rail Air Resonance (Low-frequency 55Hz drone with soft LFO modulation)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now); // Low A

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.035, now);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      this.subwayOsc = subOsc;

      // Schedule periodic background station PA chimes and rail click-clack
      this.scheduleNextChime();
      this.scheduleNextClickClack();
    } catch {}
  }

  /**
   * Smoothly stops station background ambience
   */
  public stopStationAmbience() {
    if (!this.isAmbienceRunning) return;
    this.isAmbienceRunning = false;

    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (this.clickClackTimer) {
      clearTimeout(this.clickClackTimer);
      this.clickClackTimer = null;
    }

    if (this.ambienceGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambienceGainNode.gain.setValueAtTime(this.ambienceGainNode.gain.value, now);
        this.ambienceGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.8);
        setTimeout(() => {
          try {
            this.rumbleSource?.stop();
            this.rumbleSource?.disconnect();
            this.rumbleSource = null;
            this.subwayOsc?.stop();
            this.subwayOsc?.disconnect();
            this.subwayOsc = null;
            this.ambienceGainNode?.disconnect();
            this.ambienceGainNode = null;
          } catch {}
        }, 900);
      } catch {}
    }
  }

  /**
   * Schedule automated periodic station PA chimes
   */
  private scheduleNextChime() {
    if (!this.isAmbienceRunning) return;
    const delay = 35000 + Math.random() * 35000; // 35 - 70 seconds
    this.chimeTimer = setTimeout(() => {
      if (this.isAmbienceRunning) {
        this.playStationAnnouncementChime();
        this.scheduleNextChime();
      }
    }, delay);
  }

  /**
   * Schedule automated periodic distant rail clatter
   */
  private scheduleNextClickClack() {
    if (!this.isAmbienceRunning) return;
    const delay = 14000 + Math.random() * 18000; // 14 - 32 seconds
    this.clickClackTimer = setTimeout(() => {
      if (this.isAmbienceRunning) {
        this.playRailClickClack();
        this.scheduleNextClickClack();
      }
    }, delay);
  }

  /**
   * Authentic Station PA Melodic Chime (Four-tone melody echoing in a tiled subway hall)
   */
  public playStationAnnouncementChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Iconic melodic motif: E4 -> G#4 -> B4 -> E5
      const notes = [329.63, 415.30, 493.88, 659.25];

      // Station Hall Delay / Reverb simulation
      const delay = this.ctx.createDelay();
      delay.delayTime.setValueAtTime(0.24, now);
      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.35, now);

      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.setValueAtTime(1800, now);

      delay.connect(delayFilter);
      delayFilter.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.ctx.destination);

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.28;
        const osc = this.ctx!.createOscillator();
        const overtone = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.08 * this.volume, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.85);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(this.ctx!.destination);
        gain.connect(delay);

        osc.start(noteTime);
        overtone.start(noteTime);
        osc.stop(noteTime + 0.9);
        overtone.stop(noteTime + 0.9);
      });
    } catch {}
  }

  /**
   * Distant mechanical train rail click-clack ("ch-clack... ch-clack...")
   */
  public playRailClickClack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Pair of wheel impacts over rail joints
      [0, 0.08].forEach((offset) => {
        const pulseTime = now + offset;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160 + Math.random() * 40, pulseTime);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(280, pulseTime);
        filter.Q.setValueAtTime(3, pulseTime);

        gain.gain.setValueAtTime(0.001, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.04 * this.volume, pulseTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(pulseTime);
        osc.stop(pulseTime + 0.11);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
