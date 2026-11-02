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

  constructor() {
    // AudioContext will be lazily initialized upon first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
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
}

export const soundEngine = new SoundEngine();
