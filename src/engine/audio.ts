// Fully synthesized audio (no sound files, no licensing): SFX + tiny procedural music.

type OscType = OscillatorType;

interface ToneOpts {
  type?: OscType;
  vol?: number;
  attack?: number;
  delay?: number;
  to?: number;
  mid?: number;
  vib?: number;
  vibDepth?: number;
  bus?: 'sfx' | 'music';
  lp?: number;
}

interface NoiseOpts {
  vol?: number;
  delay?: number;
  type?: BiquadFilterType;
  freq?: number;
  to?: number;
  q?: number;
  bus?: 'sfx' | 'music';
}

export type MusicStyle = 'calm' | 'radio' | 'park' | 'shop' | 'none';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class Sound {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private mus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  sfxOn = true;
  musicOn = true;
  private style: MusicStyle = 'none';
  private radio = false;
  private timer: number | null = null;
  private nextT = 0;
  private step = 0;
  private seed = 1;
  private lastPlay = new Map<string, number>();

  unlock() {
    try {
      if (!this.ctx) {
        const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain();
        this.sfx.gain.value = 1;
        this.sfx.connect(this.master);
        this.mus = this.ctx.createGain();
        this.mus.gain.value = 0.32;
        this.mus.connect(this.master);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.applyMusic();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      console.warn('audio unlock failed', e);
    }
  }

  suspend() { this.ctx?.suspend?.(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  private bus(b?: 'sfx' | 'music') { return b === 'music' ? this.mus : this.sfx; }

  tone(f: number, dur: number, o: ToneOpts = {}) {
    const c = this.ctx;
    if (!c) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(f, t0);
    if (o.mid !== undefined && o.to !== undefined) {
      osc.frequency.linearRampToValueAtTime(o.mid, t0 + dur * 0.45);
      osc.frequency.linearRampToValueAtTime(o.to, t0 + dur);
    } else if (o.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    }
    let lfo: OscillatorNode | null = null;
    if (o.vib) {
      lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = o.vib;
      lg.gain.value = o.vibDepth ?? 12;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    const g = c.createGain();
    const v = o.vol ?? 0.2;
    const a = o.attack ?? 0.006;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node: AudioNode = osc;
    if (o.lp) {
      const f2 = c.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = o.lp;
      osc.connect(f2);
      node = f2;
    }
    node.connect(g);
    g.connect(this.bus(o.bus));
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur: number, o: NoiseOpts = {}) {
    const c = this.ctx;
    if (!c || !this.noiseBuf) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.type ?? 'lowpass';
    f.frequency.setValueAtTime(o.freq ?? 1000, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    f.Q.value = o.q ?? 1;
    const g = c.createGain();
    const v = o.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.bus(o.bus));
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  play(name: string, pitch = 1) {
    if (!this.sfxOn || !this.ctx) return;
    const now = performance.now();
    const last = this.lastPlay.get(name) ?? 0;
    if (now - last < 45) return; // avoid stacking identical sounds
    this.lastPlay.set(name, now);
    const p = pitch;
    switch (name) {
      case 'pick': this.tone(520 * p, 0.1, { to: 820 * p, vol: 0.22 }); break;
      case 'drop':
        this.tone(300 * p, 0.13, { to: 150 * p, vol: 0.28 });
        this.noise(0.07, { type: 'lowpass', freq: 500, vol: 0.12 });
        break;
      case 'pop':
        this.tone(700 * p, 0.07, { to: 1150 * p, vol: 0.28 });
        this.tone(1400 * p, 0.05, { delay: 0.03, vol: 0.08, type: 'triangle' });
        break;
      case 'snap':
        this.tone(240 * p, 0.05, { type: 'square', vol: 0.05, lp: 1500 });
        this.tone(440 * p, 0.09, { to: 680 * p, vol: 0.2, delay: 0.02 });
        break;
      case 'chomp':
        for (let i = 0; i < 3; i++) {
          this.noise(0.055, { type: 'bandpass', freq: 1600 + Math.random() * 600, q: 2.5, vol: 0.32, delay: i * 0.14 });
          this.tone(170, 0.05, { to: 110, vol: 0.12, delay: i * 0.14 });
        }
        break;
      case 'yum':
        this.tone(523 * p, 0.14, { type: 'triangle', vol: 0.16 });
        this.tone(698 * p, 0.26, { type: 'triangle', vol: 0.16, delay: 0.13, vib: 7, vibDepth: 10 });
        break;
      case 'gulp':
        this.tone(380 * p, 0.12, { to: 170 * p, vol: 0.32 });
        this.tone(360 * p, 0.12, { to: 160 * p, vol: 0.28, delay: 0.2 });
        break;
      case 'toggle':
        this.tone(950 * p, 0.03, { type: 'square', vol: 0.05, lp: 3000 });
        this.tone(1300 * p, 0.06, { vol: 0.1, delay: 0.02 });
        break;
      case 'click': this.tone(1500 * p, 0.025, { type: 'square', vol: 0.05, lp: 4000 }); break;
      case 'whoosh': this.noise(0.35, { type: 'bandpass', freq: 500, to: 2600, q: 1.2, vol: 0.22 }); break;
      case 'door': this.noise(0.22, { type: 'bandpass', freq: 900, to: 300, q: 1.5, vol: 0.18 }); this.tone(180 * p, 0.12, { to: 120, vol: 0.12, delay: 0.12 }); break;
      case 'sparkle':
        [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f * p, 0.18, { vol: 0.12, delay: i * 0.06 }));
        break;
      case 'ding':
        this.tone(1568 * p, 0.6, { vol: 0.16 });
        this.tone(2093 * p, 0.45, { vol: 0.08 });
        break;
      case 'kaching':
        this.noise(0.08, { type: 'highpass', freq: 4000, vol: 0.18 });
        this.tone(1760, 0.12, { type: 'square', vol: 0.04, delay: 0.05, lp: 5000 });
        this.tone(2637, 0.5, { vol: 0.14, delay: 0.1 });
        this.tone(3520, 0.4, { vol: 0.07, delay: 0.16 });
        break;
      case 'splash': this.noise(0.5, { type: 'lowpass', freq: 1500, to: 300, vol: 0.32 }); break;
      case 'bubble': this.tone((600 + Math.random() * 500) * p, 0.07, { to: (1200 + Math.random() * 600) * p, vol: 0.12 }); break;
      case 'boing': this.tone(130 * p, 0.32, { to: 420 * p, vol: 0.2, vib: 16, vibDepth: 30 }); break;
      case 'giggle':
        for (let i = 0; i < 5; i++) this.tone((i % 2 ? 980 : 860) * p, 0.06, { type: 'triangle', vol: 0.12, delay: i * 0.075 });
        break;
      case 'meow': this.tone(600 * p, 0.42, { type: 'triangle', mid: 900 * p, to: 520 * p, vol: 0.16, vib: 6, vibDepth: 14 }); break;
      case 'woof':
        this.noise(0.11, { type: 'bandpass', freq: 520, q: 1.2, vol: 0.25 });
        this.tone(340 * p, 0.13, { type: 'sawtooth', to: 190 * p, vol: 0.1, lp: 900 });
        this.noise(0.11, { type: 'bandpass', freq: 560, q: 1.2, vol: 0.22, delay: 0.2 });
        this.tone(360 * p, 0.13, { type: 'sawtooth', to: 200 * p, vol: 0.09, lp: 900, delay: 0.2 });
        break;
      case 'squeak': this.tone(1400 * p, 0.16, { mid: 1950 * p, to: 1500 * p, vol: 0.16 }); break;
      case 'flush':
        this.noise(1.3, { type: 'lowpass', freq: 1400, to: 250, vol: 0.3 });
        this.noise(1.0, { type: 'bandpass', freq: 300, to: 1200, q: 3, vol: 0.12, delay: 0.2 });
        break;
      case 'wheee': this.tone(950 * p, 0.7, { to: 380 * p, vol: 0.16, vib: 9, vibDepth: 20 }); break;
      case 'swing': this.noise(0.28, { type: 'bandpass', freq: 380, q: 1, vol: 0.08 }); break;
      case 'tap': this.tone(880 * p, 0.06, { vol: 0.12 }); break;
      case 'yawn': this.tone(420 * p, 0.7, { type: 'triangle', to: 230 * p, vol: 0.13, vib: 5, vibDepth: 8 }); break;
      case 'tv': this.noise(0.25, { type: 'bandpass', freq: 3200, q: 0.8, vol: 0.06 }); this.tone(1200, 0.1, { vol: 0.05, delay: 0.2 }); break;
      case 'sizzle': this.noise(0.9, { type: 'highpass', freq: 3500, vol: 0.09 }); break;
      case 'blip': this.tone(1200 * p, 0.05, { vol: 0.1, type: 'triangle' }); break;
      case 'lock': this.tone(300, 0.08, { type: 'square', vol: 0.06, lp: 1200 }); this.tone(220, 0.12, { type: 'square', vol: 0.05, lp: 1200, delay: 0.09 }); break;
      case 'bark-small': this.tone(700 * p, 0.09, { type: 'triangle', to: 420 * p, vol: 0.18 }); break;
      case 'heart': this.tone(392, 0.12, { vol: 0.2 }); this.tone(330, 0.16, { vol: 0.22, delay: 0.16 }); break;
      case 'xray': this.tone(220, 0.6, { type: 'sawtooth', to: 440, vol: 0.05, lp: 1200 }); this.tone(1760, 0.2, { vol: 0.06, delay: 0.5 }); break;
      case 'mixer': this.tone(160, 0.8, { type: 'sawtooth', to: 220, vol: 0.06, lp: 600, vib: 30, vibDepth: 25 }); break;
      case 'brush': for (let i = 0; i < 4; i++) this.noise(0.08, { type: 'highpass', freq: 2500, vol: 0.12, delay: i * 0.12 }); break;
      case 'scale': this.tone(660, 0.08, { vol: 0.1 }); this.tone(880, 0.08, { vol: 0.1, delay: 0.1 }); this.tone(1320, 0.18, { vol: 0.12, delay: 0.2 }); break;
    }
  }

  // ---------------- music ----------------
  setMusic(style: MusicStyle, seed = 1) {
    this.style = style;
    this.seed = seed;
    this.applyMusic();
  }

  setRadio(on: boolean) {
    if (this.radio === on) return;
    this.radio = on;
    this.applyMusic();
  }

  applyMusic() {
    const want = this.radio ? (this.sfxOn ? 'radio' : 'none') : this.musicOn ? this.style : 'none';
    if (!this.ctx) return;
    if (want === 'none') {
      if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
      return;
    }
    if (this.timer === null) {
      this.nextT = this.ctx.currentTime + 0.1;
      this.step = 0;
      this.timer = window.setInterval(() => this.schedule(), 60);
    }
  }

  private current(): MusicStyle {
    if (this.radio) return 'radio';
    return this.style;
  }

  private schedule() {
    const c = this.ctx;
    if (!c) return;
    const style = this.current();
    if (style === 'none') return;
    const bpm = style === 'radio' ? 124 : style === 'park' ? 108 : style === 'shop' ? 100 : 92;
    const stepDur = 60 / bpm / 2; // 8th notes
    while (this.nextT < c.currentTime + 0.25) {
      this.note(style, this.step, this.nextT, stepDur);
      this.nextT += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private note(style: MusicStyle, step: number, t: number, d: number) {
    const c = this.ctx!;
    const delay = Math.max(0, t - c.currentTime);
    const bar = Math.floor(step / 8);
    // I - V - vi - IV in C (repeated)
    const roots = [48, 43, 45, 41, 48, 43, 45, 41];
    const chords = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]];
    const root = roots[bar];
    const chord = chords[bar % 4];
    const pos = step % 8;
    const busy = style === 'radio';
    const bus: 'music' | 'sfx' = style === 'radio' ? 'sfx' : 'music';
    const vm = style === 'radio' ? 0.55 : 1;
    // bass
    if (pos === 0 || pos === 4 || (busy && pos === 6)) {
      this.tone(NOTE(root), d * (busy ? 1.6 : 3.2), { type: 'triangle', vol: 0.22 * vm, delay, bus, attack: 0.01 });
    }
    // melody: deterministic pseudo-random from seed
    const pent = [0, 2, 4, 7, 9, 12, 14, 16];
    const h = hash(this.seed * 131 + step * 17 + (busy ? 7 : 0));
    const rest = busy ? h % 5 === 0 : h % 3 === 0 || pos % 2 === 1 && h % 2 === 0;
    if (!rest) {
      const base = chord[(h >>> 3) % 3];
      const n = 72 + pent[(h >>> 5) % pent.length] - (base % 12 > 6 ? 0 : 0);
      const fit = closestInChordScale(n, chord);
      this.tone(NOTE(fit), d * (busy ? 0.9 : 1.6), { type: style === 'shop' ? 'sine' : 'triangle', vol: 0.11 * vm, delay, bus, attack: 0.012 });
    }
    // soft chord pad on bar start (calm styles)
    if (!busy && pos === 0) {
      for (const n of chord) this.tone(NOTE(n), d * 7, { type: 'sine', vol: 0.035, delay, bus, attack: 0.25 });
    }
    // drums for radio
    if (busy) {
      if (pos % 4 === 0) this.tone(150, 0.16, { to: 50, vol: 0.4 * vm, delay, bus });
      if (pos % 2 === 1) this.noise(0.04, { type: 'highpass', freq: 7000, vol: 0.07 * vm, delay, bus });
      if (pos === 4) this.noise(0.12, { type: 'bandpass', freq: 1800, q: 0.8, vol: 0.18 * vm, delay, bus });
    }
  }
}

function hash(n: number) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

function closestInChordScale(n: number, chord: number[]) {
  const pcs = chord.map((c) => c % 12).concat([2, 9]); // chord tones + pentatonic color
  let best = n, bd = 99;
  for (let k = -3; k <= 3; k++) {
    const m = n + k;
    if (pcs.includes(((m % 12) + 12) % 12) && Math.abs(k) < bd) { bd = Math.abs(k); best = m; }
  }
  return best;
}

export const sound = new Sound();
