import { textures, drawTex, texHit, type TexSpec, type Tex } from '../engine/textures';
import { bodyArt, headArt, charMetrics, drawFace, petArt, drawPetEyes, type Look, type Expr, type PetArt, type PetKind, type Pose } from '../art/characters';
import { DEFS } from './catalog';
import type { Ent, ThingDef, SlotDef, Tag, SlotPose } from './types';
import { HAND, HEAD } from './types';

export function lookKey(l: Look) {
  return [l.size, l.skin, l.hair, l.hairColor, l.top, l.topColor, l.pattern, l.bottom, l.bottomColor, l.shoes, l.acc].join('.');
}

export const thingKey = (d: ThingDef, v: string) => `t:${d.id}:${v}`;
export const overKey = (d: ThingDef, v: string) => `o:${d.id}:${v}`;

export function thingSpecs(d: ThingDef): TexSpec[] {
  const out: TexSpec[] = [];
  const a = d.art;
  for (const v of a.variants ?? ['base']) {
    out.push({ key: thingKey(d, v), svg: () => a.art(v), w: a.w, h: a.h, ax: a.ax, ay: a.ay, outline: a.outline ?? 5 });
  }
  if (d.overlay) {
    const o = d.overlay;
    for (const v of o.variants ?? ['base']) out.push({ key: overKey(d, v), svg: () => o.art(v), w: o.w, h: o.h, ax: o.ax, ay: o.ay, outline: o.outline ?? 0, shadow: false });
  }
  return out;
}

export function charSpecs(l: Look): TexSpec[] {
  const k = lookKey(l);
  const b1 = () => bodyArt(l, 'stand');
  const b2 = () => bodyArt(l, 'sit');
  const h = () => headArt(l);
  const a1 = b1(), a2 = b2(), ah = h();
  return [
    { key: `cb:${k}:stand`, svg: () => a1.svg, w: a1.w, h: a1.h, ax: a1.ax, ay: a1.ay, outline: 5 },
    { key: `cb:${k}:sit`, svg: () => a2.svg, w: a2.w, h: a2.h, ax: a2.ax, ay: a2.ay, outline: 5 },
    { key: `ch:${k}`, svg: () => ah.svg, w: ah.w, h: ah.h, ax: ah.ax, ay: ah.ay, outline: 5 },
  ];
}

const petCache = new Map<string, PetArt>();
export function petInfo(kind: PetKind, color: number): PetArt {
  const k = kind + color;
  let a = petCache.get(k);
  if (!a) { a = petArt(kind, color); petCache.set(k, a); }
  return a;
}

export function petSpecs(kind: PetKind, color: number): TexSpec[] {
  const a = petInfo(kind, color);
  return [{ key: `p:${kind}:${color}`, svg: () => a.svg, w: a.w, h: a.h, ax: a.ax, ay: a.ay, outline: 5 }];
}

export abstract class Actor {
  e: Ent;
  x = 0;
  y = 0;
  ox = 0;
  oy = 0;
  rot = 0;
  sx = 1;
  sy = 1;
  lift = 0;
  alpha = 1;
  t = Math.random() * 10;
  dragging = false;
  hidden = false;
  /** pose given by the slot this actor sits in */
  slotPose: SlotPose | null = null;
  slotDir: -1 | 1 = -1;
  constructor(e: Ent) { this.e = e; }
  get id() { return this.e.id; }
  abstract get tags(): Tag[];
  abstract get fixed(): boolean;
  abstract specs(): TexSpec[];
  abstract drawBody(g: CanvasRenderingContext2D): void;
  drawOverlay(_g: CanvasRenderingContext2D) {}
  hasOverlay() { return false; }
  abstract hitLocal(lx: number, ly: number): boolean;
  slots(): SlotDef[] { return []; }
  update(dt: number) { this.t += dt; }
  flipSign() { return this.e.flip ? -1 : 1; }

  /** draw transform: translate to anchor, rotate, scale */
  applyTransform(g: CanvasRenderingContext2D) {
    g.translate(this.x + this.ox, this.y + this.oy - this.lift);
    if (this.rot) g.rotate(this.rot);
    g.scale(this.sx * this.flipSign(), this.sy);
  }

  localToWorld(lx: number, ly: number) {
    const sx = this.sx * this.flipSign();
    const px = lx * sx, py = ly * this.sy;
    const c = Math.cos(this.rot), s = Math.sin(this.rot);
    return { x: this.x + this.ox + px * c - py * s, y: this.y + this.oy - this.lift + px * s + py * c };
  }

  worldToLocal(wx: number, wy: number) {
    const dx = wx - (this.x + this.ox), dy = wy - (this.y + this.oy - this.lift);
    const c = Math.cos(-this.rot), s = Math.sin(-this.rot);
    const rx = dx * c - dy * s, ry = dx * s + dy * c;
    return { x: rx / (this.sx * this.flipSign()), y: ry / this.sy };
  }

  hit(wx: number, wy: number) {
    if (this.hidden) return false;
    const l = this.worldToLocal(wx, wy);
    return this.hitLocal(l.x, l.y);
  }

  slotWorld(i: number) {
    const s = this.slots()[i];
    if (!s) return { x: this.x, y: this.y };
    return this.localToWorld(s.x, s.y);
  }

  /** point used to measure drop distance & "center" */
  center() { return { x: this.x, y: this.y - 40 }; }

  /** thumbnail texture for pocket */
  thumb(): Tex | undefined { return undefined; }
}

export class ThingActor extends Actor {
  d: ThingDef;
  constructor(e: Ent) {
    super(e);
    const d = DEFS.get(e.def);
    if (!d) throw new Error('unknown def ' + e.def);
    this.d = d;
  }
  get tags() { return this.d.tags; }
  get fixed() { return !!this.d.fixed; }
  specs() { return thingSpecs(this.d); }
  variant() { return this.d.variant ? this.d.variant(this.e.s) : this.d.art.variants?.[0] ?? 'base'; }
  tex() { return textures.get(thingKey(this.d, this.variant())); }
  thumb() { return this.tex(); }
  slots() { return this.d.slots ?? []; }
  hasOverlay() { return !!this.d.overlay; }
  center() {
    const a = this.d.art;
    return { x: this.x, y: this.y - a.h * 0.45 };
  }

  drawBody(g: CanvasRenderingContext2D) {
    const t = this.tex();
    if (!t) return;
    g.save();
    g.globalAlpha *= this.alpha;
    this.applyTransform(g);
    drawTex(g, t);
    this.extra?.(g, this);
    g.restore();
  }

  /** hook for special per-def rendering (tv screen, water...) */
  extra?: (g: CanvasRenderingContext2D, a: ThingActor) => void;

  drawOverlay(g: CanvasRenderingContext2D) {
    if (!this.d.overlay) return;
    const v = this.d.overlayVariant ? this.d.overlayVariant(this.e.s) : this.d.overlay.variants?.[0] ?? 'base';
    if (v === null) return;
    const t = textures.get(overKey(this.d, v));
    if (!t) return;
    g.save();
    g.globalAlpha *= this.alpha;
    this.applyTransform(g);
    drawTex(g, t);
    g.restore();
  }

  hitLocal(lx: number, ly: number) {
    const t = this.tex();
    if (!t) return false;
    return texHit(t, lx, ly);
  }
}

export type Mood = 'idle' | 'eat' | 'happy' | 'surprise' | 'sleep' | 'want' | 'giggle' | 'yuck';

export class CharActor extends Actor {
  look: Look;
  key: string;
  mood: Mood = 'idle';
  moodT = 0;
  blink = 0;
  blinkT = 2 + Math.random() * 3;
  lookX = 0;
  lookY = 0;
  lookTX = 0;
  lookTY = 0;
  chew = 0;
  headTilt = 0;
  /** extra child actors drawn in hand/head (set by scene each frame) */
  handKid: Actor | null = null;
  headKid: Actor | null = null;
  bounce = 0;
  dance = 0;

  constructor(e: Ent) {
    super(e);
    this.look = e.look!;
    this.key = lookKey(this.look);
  }
  get tags(): Tag[] { return ['char']; }
  get fixed() { return false; }
  refreshLook() { this.look = this.e.look!; this.key = lookKey(this.look); }
  specs() { return charSpecs(this.look); }
  pose(): Pose {
    if (this.dragging) return 'stand';
    const p = this.slotPose;
    return p === 'sit' || p === 'swing' || p === 'bath' || p === 'slide' ? 'sit' : 'stand';
  }
  metrics() { return charMetrics(this.look, this.pose()); }
  bodyTex() { return textures.get(`cb:${this.key}:${this.pose()}`); }
  headTex() { return textures.get(`ch:${this.key}`); }
  thumb() { return this.headTex(); }

  setMood(m: Mood, dur = 1.2) { this.mood = m; this.moodT = dur; }

  update(dt: number) {
    super.update(dt);
    if (this.moodT > 0) {
      this.moodT -= dt;
      if (this.moodT <= 0 && this.mood !== 'sleep') this.mood = 'idle';
    }
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blink = 1;
      this.blinkT = 2.2 + Math.random() * 3.5;
    }
    this.blink = Math.max(0, this.blink - dt * 7);
    this.lookX += (this.lookTX - this.lookX) * Math.min(1, dt * 8);
    this.lookY += (this.lookTY - this.lookY) * Math.min(1, dt * 8);
    if (this.mood === 'eat') this.chew += dt * 12;
    if (this.dance > 0) this.dance = Math.max(0, this.dance - dt * 0.2);
  }

  expr(): Expr {
    const e: Expr = { eyes: 'open', mouth: 'smile', lx: this.lookX, ly: this.lookY, blink: this.blink };
    switch (this.mood) {
      case 'eat': e.eyes = 'happy'; e.mouth = Math.sin(this.chew) > 0 ? 'chew' : 'o'; break;
      case 'happy': e.eyes = 'happy'; e.mouth = 'grin'; break;
      case 'giggle': e.eyes = 'happy'; e.mouth = 'open'; break;
      case 'surprise': e.eyes = 'wide'; e.mouth = 'o'; break;
      case 'sleep': e.eyes = 'closed'; e.mouth = 'flat'; e.blink = 0; break;
      case 'want': e.eyes = 'wide'; e.mouth = 'open'; break;
      case 'yuck': e.eyes = 'closed'; e.mouth = 'tongue'; break;
    }
    if (this.dragging && this.mood === 'idle') { e.eyes = 'wide'; e.mouth = 'grin'; }
    return e;
  }

  headOffset() {
    const m = this.metrics();
    const breathe = this.dragging ? 0 : Math.sin(this.t * 2.2) * 1.2;
    return { x: m.headX, y: m.headY + breathe - this.bounce * 0, r: m.headR };
  }

  drawBody(g: CanvasRenderingContext2D) {
    const b = this.bodyTex();
    const h = this.headTex();
    if (!b || !h) return;
    g.save();
    g.globalAlpha *= this.alpha;
    this.applyTransform(g);
    // breathing squash
    const br = this.dragging ? 0 : Math.sin(this.t * 2.2) * 0.012;
    g.scale(1, 1 + br);
    drawTex(g, b);
    const ho = this.headOffset();
    g.save();
    g.translate(ho.x, ho.y);
    const tilt = this.headTilt + (this.dragging ? Math.sin(this.t * 6) * 0.08 : Math.sin(this.t * 0.9) * 0.025) + (this.dance ? Math.sin(this.t * 9) * 0.12 * Math.min(1, this.dance * 3) : 0);
    g.rotate(tilt);
    drawTex(g, h);
    drawFace(g, ho.r, this.look.size, this.look.skin, this.expr());
    if (this.headKid) {
      const d = (this.headKid as ThingActor).d;
      g.translate(0, (d?.wearY ?? -0.9) * ho.r);
      this.headKid.x = 0; // drawn relative
      drawKid(g, this.headKid);
    }
    g.restore();
    if (this.handKid) {
      const m = this.metrics();
      g.save();
      g.translate(m.handX - 6, m.handY + 14);
      drawKid(g, this.handKid);
      g.restore();
    }
    g.restore();
  }

  hitLocal(lx: number, ly: number) {
    const b = this.bodyTex();
    const h = this.headTex();
    const ho = this.headOffset();
    if (h && texHit(h, lx - ho.x, ly - ho.y)) return true;
    if (Math.hypot(lx - ho.x, ly - ho.y) < ho.r * 1.05) return true;
    if (b && texHit(b, lx, ly)) return true;
    return false;
  }

  headWorld() {
    const ho = this.headOffset();
    return this.localToWorld(ho.x, ho.y);
  }

  handWorld() {
    const m = this.metrics();
    return this.localToWorld(m.handX, m.handY);
  }

  center() {
    const m = this.metrics();
    return this.localToWorld(0, m.headY * 0.6);
  }
}

function drawKid(g: CanvasRenderingContext2D, k: Actor) {
  if (k instanceof ThingActor) {
    const t = k.tex();
    if (!t) return;
    g.save();
    g.rotate(k.rot);
    g.scale(k.sx, k.sy);
    drawTex(g, t);
    g.restore();
  }
}

export class PetActor extends Actor {
  info: PetArt;
  kind: PetKind;
  color: number;
  blink = 0;
  blinkT = 2 + Math.random() * 3;
  mood: Mood = 'idle';
  moodT = 0;
  lookX = 0;
  lookY = 0;
  wag = Math.random() * 6;
  constructor(e: Ent) {
    super(e);
    this.kind = e.pet!.kind;
    this.color = e.pet!.color;
    this.info = petInfo(this.kind, this.color);
  }
  get tags(): Tag[] { return ['pet']; }
  get fixed() { return false; }
  specs() { return petSpecs(this.kind, this.color); }
  tex() { return textures.get(`p:${this.kind}:${this.color}`); }
  thumb() { return this.tex(); }
  setMood(m: Mood, dur = 1.2) { this.mood = m; this.moodT = dur; }
  update(dt: number) {
    super.update(dt);
    this.wag += dt * (this.mood === 'happy' ? 14 : 4);
    if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0 && this.mood !== 'sleep') this.mood = 'idle'; }
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 1; this.blinkT = 2 + Math.random() * 4; }
    this.blink = Math.max(0, this.blink - dt * 7);
  }
  drawBody(g: CanvasRenderingContext2D) {
    const t = this.tex();
    if (!t) return;
    g.save();
    g.globalAlpha *= this.alpha;
    this.applyTransform(g);
    const br = this.dragging ? 0 : Math.sin(this.t * 2.6) * 0.015;
    g.scale(1 + Math.sin(this.wag) * 0.01, 1 + br);
    drawTex(g, t);
    drawPetEyes(g, this.info, this.mood === 'sleep' || this.mood === 'happy', this.blink, this.lookX, this.lookY);
    g.restore();
  }
  hitLocal(lx: number, ly: number) {
    const t = this.tex();
    return !!t && texHit(t, lx, ly);
  }
  headWorld() {
    const [a, b] = this.info.eyes;
    return this.localToWorld((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6);
  }
  center() { return this.localToWorld(0, -this.info.h * 0.5); }
}

export { HAND, HEAD };
