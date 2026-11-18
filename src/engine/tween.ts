export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outBack: (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  outBounce: (t: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

interface Tw {
  target: any;
  from: Record<string, number>;
  to: Record<string, number>;
  t: number;
  dur: number;
  delay: number;
  ease: Ease;
  done?: () => void;
  started: boolean;
}

export class Tweens {
  private list: Tw[] = [];

  to(target: any, to: Record<string, number>, dur: number, e: Ease = ease.outQuad, done?: () => void, delay = 0) {
    // replace conflicting props on same target
    for (const tw of this.list) {
      if (tw.target === target) for (const k of Object.keys(to)) delete tw.to[k];
    }
    this.list.push({ target, from: {}, to: { ...to }, t: 0, dur: Math.max(0.0001, dur), delay, ease: e, done, started: false });
  }

  kill(target: any) { this.list = this.list.filter((t) => t.target !== target); }

  active(target: any) { return this.list.some((t) => t.target === target && Object.keys(t.to).length > 0); }

  update(dt: number) {
    if (!this.list.length) return;
    const fin: Tw[] = [];
    for (const tw of this.list) {
      if (tw.delay > 0) { tw.delay -= dt; continue; }
      if (!tw.started) {
        tw.started = true;
        for (const k of Object.keys(tw.to)) tw.from[k] = tw.target[k] ?? 0;
      }
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      const e = tw.ease(k);
      for (const p of Object.keys(tw.to)) tw.target[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e;
      if (k >= 1) fin.push(tw);
    }
    if (fin.length) {
      this.list = this.list.filter((t) => !fin.includes(t));
      for (const f of fin) f.done?.();
    }
  }

  clear() { this.list = []; }
}

interface Timer { at: number; fn: () => void; every?: number; tag?: any }

export class Timers {
  now = 0;
  private list: Timer[] = [];
  after(sec: number, fn: () => void, tag?: any) { this.list.push({ at: this.now + sec, fn, tag }); }
  every(sec: number, fn: () => void, tag?: any) { this.list.push({ at: this.now + sec, fn, every: sec, tag }); }
  cancel(tag: any) { this.list = this.list.filter((t) => t.tag !== tag); }
  update(dt: number) {
    this.now += dt;
    const due = this.list.filter((t) => t.at <= this.now);
    if (!due.length) return;
    this.list = this.list.filter((t) => t.at > this.now || t.every);
    for (const t of due) {
      if (t.every) t.at = this.now + t.every;
      t.fn();
    }
  }
  clear() { this.list = []; }
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const randi = (a: number, b: number) => Math.floor(rand(a, b + 1));
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
