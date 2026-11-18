import type { Stage } from '../engine/stage';
import { textures, drawTex, makeCanvas, svgSize, loadSvgImage, type TexSpec, type Tex } from '../engine/textures';
import { Tweens, Timers, ease, clamp, rand, pick, dist } from '../engine/tween';
import { Particles } from '../engine/particles';
import { sound } from '../engine/audio';
import { Actor, ThingActor, CharActor, PetActor, thingSpecs, charSpecs, petSpecs } from './actors';
import { DEFS } from './catalog';
import type { World } from './world';
import { POCKET_SIZE } from './world';
import type { Ent, LocationDef, SlotDef, ThingDef } from './types';
import { HAND, HEAD } from './types';
import { SPECIALS } from './specials';
import { haptic } from '../platform';
import { drawFace } from '../art/characters';

export interface PEvt { id: number; sx: number; sy: number; wx: number; wy: number }

export interface AppLike {
  world: World;
  stage: Stage;
  goto(loc: string): void;
  isLocked(loc: string): boolean;
}

interface Drag {
  id: number;
  mode: 'item' | 'tap' | 'pan';
  actor: Actor | null;
  sx: number; sy: number; // current screen pos (world units from top-left)
  ssx: number; ssy: number; // start
  offX: number; offY: number;
  moved: boolean;
  t0: number;
  vx: number;
  lastWX: number;
  started: boolean;
}

const MOVE_SLOP = 14; // world units

export class PlayScene {
  kind = 'play' as const;
  app: AppLike;
  loc: LocationDef;
  stage: Stage;
  world: World;
  actors = new Map<string, Actor>();
  camX = 0;
  camV = 0;
  tweens = new Tweens();
  timers = new Timers();
  fx = new Particles();
  tiles: { c: HTMLCanvasElement; x: number; y: number; w: number; h: number }[] = [];
  bgFor = '';
  drags = new Map<number, Drag>();
  drawList: Actor[] = [];
  roots: Actor[] = [];
  hint: { x: number; y: number; t: number } | null = null;
  time = 0;
  ready = false;
  nightCanvas: HTMLCanvasElement | null = null;
  swing = new Map<string, { a: number[]; v: number[] }>();

  constructor(app: AppLike, loc: LocationDef) {
    this.app = app;
    this.loc = loc;
    this.stage = app.stage;
    this.world = app.world;
  }

  // ------------------------------------------------------------ setup
  camMin() { const w = this.loc.width, vw = this.stage.view.w; return w >= vw ? 0 : (w - vw) / 2; }
  camMax() { const w = this.loc.width, vw = this.stage.view.w; return w >= vw ? w - vw : (w - vw) / 2; }

  async enter(onProgress?: (k: number) => void) {
    this.world.ensureLocation(this.loc);
    this.world.current = this.loc.id;
    const saved = this.world.cam[this.loc.id];
    this.camX = clamp(saved ?? (this.loc.width - this.stage.view.w) / 2 - 300, this.camMin(), this.camMax());
    this.rebuildActors();
    const specs = this.neededSpecs();
    await textures.loadAll(specs, (k) => onProgress?.(k * 0.7));
    await this.buildBg();
    onProgress?.(1);
    this.syncRadio();
    sound.setMusic(this.loc.music, this.loc.seed);
    this.ready = true;
  }

  exit() {
    this.world.cam[this.loc.id] = this.camX;
    sound.setRadio(false);
    this.tiles = [];
    this.actors.clear();
  }

  neededSpecs(): TexSpec[] {
    const specs: TexSpec[] = [];
    const seen = new Set<string>();
    const add = (arr: TexSpec[]) => { for (const s of arr) if (!seen.has(s.key)) { seen.add(s.key); specs.push(s); } };
    for (const d of DEFS.values()) if (!d.fixed) add(thingSpecs(d));
    for (const a of this.actors.values()) add(a.specs());
    for (const e of this.world.pocket()) {
      if (!e) continue;
      const a = this.makeActor(e);
      if (a) add(a.specs());
    }
    return specs;
  }

  async buildBg() {
    const st = this.stage;
    const key = `${this.loc.id}:${st.ppu}:${st.view.w}:${st.view.h}`;
    if (key === this.bgFor && this.tiles.length) return;
    this.bgFor = key;
    const ppu = Math.min(st.ppu, 2.2);
    const y0 = st.view.y, h = st.view.h;
    const x0 = Math.min(0, this.camMin()) - 4;
    const x1 = Math.max(this.loc.width, this.camMax() + st.view.w) + 4;
    const tileW = Math.max(200, Math.floor(1600 / ppu));
    const body = this.loc.bg();
    const tiles: typeof this.tiles = [];
    for (let x = x0; x < x1; x += tileW) {
      const w = Math.min(tileW, x1 - x);
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}">${body}</svg>`;
      try {
        const img = await loadSvgImage(svgSize(s, w * ppu, h * ppu));
        const c = makeCanvas(w * ppu, h * ppu);
        c.g.drawImage(img, 0, 0, Math.ceil(w * ppu), Math.ceil(h * ppu));
        tiles.push({ c: c.c, x, y: y0, w, h });
      } catch (e) {
        console.warn('bg tile failed', e);
      }
    }
    this.tiles = tiles;
  }

  async onResize() {
    this.camX = clamp(this.camX, this.camMin(), this.camMax());
    this.nightCanvas = null;
    await textures.loadAll(this.neededSpecs());
    await this.buildBg();
  }

  makeActor(e: Ent): Actor | null {
    try {
      if (e.def === 'char') return new CharActor(e);
      if (e.def === 'pet') return new PetActor(e);
      const a = new ThingActor(e);
      const sp = SPECIALS[a.d.id];
      if (sp?.draw) a.extra = (g, ac) => sp.draw!(g, ac, this);
      return a;
    } catch (err) {
      console.warn(err);
      return null;
    }
  }

  rebuildActors() {
    this.actors.clear();
    for (const e of this.world.ents.values()) {
      if (e.loc !== this.loc.id) continue;
      const a = this.makeActor(e);
      if (a) this.actors.set(e.id, a);
    }
  }

  addActorTree(e: Ent) {
    const a = this.makeActor(e);
    if (a) this.actors.set(e.id, a);
    for (const k of this.world.children(e.id)) this.addActorTree(k);
    return a;
  }

  removeActorTree(id: string) {
    for (const k of this.world.children(id)) this.removeActorTree(k.id);
    this.actors.delete(id);
  }

  async ensureTex(a: Actor) {
    await textures.loadAll(a.specs());
  }

  // ------------------------------------------------------------ layout
  layout(dt: number) {
    const vis = new Set<string>();
    const place = (a: Actor) => {
      vis.add(a.id);
      const kids = this.world.children(a.id);
      if (a instanceof CharActor) { a.handKid = null; a.headKid = null; }
      for (const k of kids) {
        const ka = this.actors.get(k.id);
        if (!ka) continue;
        ka.hidden = a.hidden;
        if (k.slot === HAND || k.slot === HEAD) {
          if (a instanceof CharActor) {
            if (k.slot === HAND) { a.handKid = ka; const p = a.handWorld(); ka.x = p.x; ka.y = p.y; }
            else { a.headKid = ka; const p = a.headWorld(); ka.x = p.x; ka.y = p.y; }
          } else if (a instanceof PetActor) {
            const p = a.headWorld(); ka.x = p.x; ka.y = p.y - a.info.headR * 0.55;
          }
          ka.slotPose = 'hold';
          ka.rot = 0;
          place(ka);
          continue;
        }
        const sd = a.slots()[k.slot ?? 0];
        if (!sd) continue;
        if (sd.inside && !a.e.s.open) ka.hidden = true;
        ka.slotPose = sd.pose ?? 'place';
        ka.slotDir = sd.dir ?? -1;
        let pos = a.slotWorld(k.slot ?? 0);
        let rot = 0;
        const sp = a instanceof ThingActor ? SPECIALS[a.d.id] : undefined;
        if (sp?.slotPos && a instanceof ThingActor) {
          const o = sp.slotPos(a, k.slot ?? 0, this);
          if (o) { pos = { x: o.x, y: o.y }; rot = o.rot; }
        }
        if (!ka.dragging) {
          if (ka instanceof CharActor && sd.pose === 'lie') {
            const m = ka.look ? (ka as CharActor).metrics() : null;
            const hy = m ? m.headY : -170;
            ka.x = pos.x + (sd.dir === 1 ? hy : -hy);
            ka.y = pos.y;
            ka.rot = sd.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
          } else if (ka instanceof PetActor && sd.pose === 'lie') {
            ka.x = pos.x; ka.y = pos.y + 46; ka.rot = 0;
          } else if (ka instanceof ThingActor && sd.pose === 'bath') {
            ka.x = pos.x; ka.y = pos.y - 34 + Math.sin(this.time * 2 + pos.x) * 3; ka.rot = Math.sin(this.time * 1.5 + pos.x) * 0.08;
          } else {
            ka.x = pos.x; ka.y = pos.y; ka.rot = rot;
          }
        }
        place(ka);
      }
    };
    for (const a of this.actors.values()) {
      if (a.e.p) continue;
      if (!a.dragging) { a.x = a.e.x; a.y = a.e.y; }
      a.slotPose = null;
      if (!a.dragging && !this.tweens.active(a)) a.rot = 0;
      a.hidden = false;
      place(a);
    }
    // orphans whose parent isn't in this scene (shouldn't happen)
    for (const a of this.actors.values()) if (!vis.has(a.id)) { a.x = a.e.x; a.y = a.e.y; }
    void dt;
  }

  buildDrawList() {
    const roots: Actor[] = [];
    for (const a of this.actors.values()) if (!a.e.p && !a.dragging) roots.push(a);
    roots.sort((p, q) => this.zKey(p) - this.zKey(q));
    this.roots = roots;
    const list: Actor[] = [];
    const walk = (a: Actor) => {
      list.push(a);
      for (const k of this.world.children(a.id)) {
        if (k.slot === HAND || k.slot === HEAD) continue;
        const ka = this.actors.get(k.id);
        if (ka && !ka.dragging) walk(ka);
      }
    };
    for (const r of roots) walk(r);
    this.drawList = list;
  }

  zKey(a: Actor) {
    const d = a instanceof ThingActor ? a.d : null;
    return a.e.y + (d?.z ?? 0) + (a.fixed ? 0 : 0.5);
  }

  // ------------------------------------------------------------ update
  update(dt: number) {
    if (!this.ready) return;
    this.time += dt;
    this.tweens.update(dt);
    this.timers.update(dt);
    // camera inertia & auto-pan
    let panning = false;
    for (const d of this.drags.values()) {
      if (d.mode === 'pan' && d.moved) panning = true;
      if (d.mode === 'item' && d.started && d.actor) {
        const edge = 110;
        const vw = this.stage.view.w;
        let v = 0;
        if (d.sx < edge) v = -(edge - d.sx) * 9;
        else if (d.sx > vw - edge) v = (d.sx - (vw - edge)) * 9;
        if (v) this.camX = clamp(this.camX + v * dt, this.camMin(), this.camMax());
        this.dragFollow(d);
      }
    }
    if (!panning && Math.abs(this.camV) > 1) {
      this.camX = clamp(this.camX + this.camV * dt, this.camMin(), this.camMax());
      this.camV *= Math.pow(0.04, dt);
    }
    for (const a of this.actors.values()) a.update(dt);
    this.layout(dt);
    this.lookAround();
    for (const a of this.actors.values()) {
      if (a instanceof ThingActor) {
        SPECIALS[a.d.id]?.update?.(a, dt, this);
        if (a.d.cooks && a.e.s.on) this.cookTick(a, dt);
        if (a.d.autoRestock) this.autoRestock(a, dt);
      }
      if (a instanceof CharActor && a.mood === 'sleep' && Math.random() < dt * 0.7) {
        const h = a.headWorld();
        this.fx.emit('zzz', h.x + 20, h.y - 30, 1);
      }
      if (a instanceof CharActor && a.slotPose !== 'lie' && a.mood === 'sleep' && !a.dragging) a.mood = 'idle';
    }
    this.fx.update(dt);
    if (this.hint) { this.hint.t -= dt; if (this.hint.t <= 0) this.hint = null; }
    this.buildDrawList();
  }

  lookAround() {
    let target: { x: number; y: number } | null = null;
    let food: Actor | null = null;
    for (const d of this.drags.values()) if (d.actor && d.started) { target = d.actor.center(); food = d.actor; }
    for (const a of this.actors.values()) {
      if (!(a instanceof CharActor) && !(a instanceof PetActor)) continue;
      if (a.dragging) continue;
      const h = a instanceof CharActor ? a.headWorld() : a.headWorld();
      if (target) {
        const dx = target.x - h.x, dy = target.y - h.y;
        const dd = Math.hypot(dx, dy) || 1;
        const lx = clamp(dx / Math.max(200, dd), -1, 1), ly = clamp(dy / Math.max(200, dd), -1, 1);
        if (a instanceof CharActor) { a.lookTX = lx; a.lookTY = ly; } else { a.lookX = lx; a.lookY = ly; }
        if (food && food instanceof ThingActor && a instanceof CharActor && (food.d.tags.includes('food') || food.d.tags.includes('drink')) && a.mood !== 'eat' && a.mood !== 'sleep') {
          const near = dd < 150;
          if (near && a.mood !== 'want') a.setMood('want', 0.3);
          else if (near) a.moodT = 0.3;
        }
      } else if (a instanceof CharActor) {
        if (Math.random() < 0.004) { a.lookTX = rand(-0.8, 0.8); a.lookTY = rand(-0.4, 0.4); }
      }
    }
  }

  // ------------------------------------------------------------ drawing
  draw(g: CanvasRenderingContext2D) {
    const st = this.stage;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#ffe9f2';
    g.fillRect(0, 0, st.canvas.width, st.canvas.height);
    if (!this.ready) return;
    st.worldTransform(this.camX);
    const vx0 = this.camX, vx1 = this.camX + st.view.w;
    for (const t of this.tiles) {
      if (t.x + t.w < vx0 || t.x > vx1) continue;
      g.drawImage(t.c, t.x, t.y, t.w + 0.6, t.h);
    }
    // contact shadows
    g.fillStyle = 'rgba(70,40,90,0.13)';
    for (const a of this.actors.values()) {
      if (a.fixed || a.e.p || a.hidden) continue;
      const w = a instanceof CharActor ? 46 : a instanceof PetActor ? 40 : Math.min(40, (a as ThingActor).d.art.w * 0.4);
      let y = a.y, x = a.x, k = 1;
      if (a.dragging) { y = clamp(a.e.y, this.loc.floor.top, this.loc.floor.bottom) + 4; k = 0.6; }
      g.beginPath();
      g.ellipse(x, y - 2, w * k, 9 * k, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (const a of this.roots) this.drawTree(g, a);
    // slot hint
    if (this.hint) {
      const p = 0.6 + Math.sin(this.time * 10) * 0.2;
      g.save();
      g.globalAlpha = p;
      g.strokeStyle = '#ffffff';
      g.lineWidth = 6;
      g.setLineDash([12, 10]);
      g.beginPath();
      g.arc(this.hint.x, this.hint.y - 20, 42, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    this.fx.draw(g);
    this.drawNight(g);
    // dragged on top
    for (const d of this.drags.values()) {
      if (d.actor && d.started) this.drawTree(g, d.actor);
    }
    this.drawPocket(g);
  }

  drawTree(g: CanvasRenderingContext2D, a: Actor) {
    if (a.hidden) return;
    a.drawBody(g);
    if (a instanceof PetActor) {
      const hk = this.world.childAt(a.id, HEAD);
      const ka = hk && this.actors.get(hk.id);
      if (ka && !ka.dragging && ka instanceof ThingActor) {
        const t = ka.tex();
        if (t) { g.save(); g.translate(ka.x, ka.y); g.scale(0.8, 0.8); drawTex(g, t); g.restore(); }
      }
    }
    const slots = a.slots();
    const front: Actor[] = [];
    for (const k of this.world.children(a.id)) {
      if (k.slot === HAND || k.slot === HEAD) continue;
      const ka = this.actors.get(k.id);
      if (!ka || ka.dragging) continue;
      if (slots[k.slot ?? 0]?.front) front.push(ka);
      else this.drawTree(g, ka);
    }
    if (a.hasOverlay()) a.drawOverlay(g);
    for (const ka of front) this.drawTree(g, ka);
  }

  drawNight(g: CanvasRenderingContext2D) {
    if (!this.isNight()) return;
    const st = this.stage;
    const W = st.canvas.width, H = st.canvas.height;
    if (!this.nightCanvas || this.nightCanvas.width !== W || this.nightCanvas.height !== H) {
      this.nightCanvas = makeCanvas(W, H).c;
    }
    const n = this.nightCanvas.getContext('2d')!;
    n.setTransform(1, 0, 0, 1, 0, 0);
    n.globalCompositeOperation = 'source-over';
    n.clearRect(0, 0, W, H);
    n.fillStyle = 'rgba(28,22,78,0.58)';
    n.fillRect(0, 0, W, H);
    const k = st.ppu;
    n.setTransform(k, 0, 0, k, -this.camX * k, -st.view.y * k);
    n.globalCompositeOperation = 'destination-out';
    const hole = (x: number, y: number, r: number, a = 1) => {
      const gr = n.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${a})`);
      gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.7})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      n.fillStyle = gr;
      n.beginPath();
      n.arc(x, y, r, 0, Math.PI * 2);
      n.fill();
    };
    for (const a of this.actors.values()) {
      if (!(a instanceof ThingActor) || a.hidden) continue;
      const L = a.d.light;
      if (L && a.e.s.on) { const p = a.localToWorld(L.x, L.y); hole(p.x, p.y + L.r * 0.3, L.r); }
      if (a.d.id === 'tv' && a.e.s.on) { const p = a.localToWorld(0, -180); hole(p.x, p.y, 260, 0.8); }
      if (a.d.cooks && a.e.s.on) { const p = a.localToWorld(0, -a.d.art.h * 0.5); hole(p.x, p.y, 160, 0.7); }
    }
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.nightCanvas, 0, 0);
    g.restore();
    st.worldTransform(this.camX);
  }

  isNight() {
    if (!this.loc.hasLights) return false;
    for (const a of this.actors.values()) if (a instanceof ThingActor && a.d.id === 'lightswitch' && a.e.s.on === false) return true;
    return false;
  }

  // ------------------------------------------------------------ pocket UI
  pocketOpen = false;
  pocketAnim = 0;

  pocketRect() {
    const st = this.stage;
    const cell = 86, n = POCKET_SIZE, h = 104;
    const x = st.safe.l + 14;
    const y = st.view.h - st.safe.b - h - 10;
    return { x, y, w: 104 + n * cell + 12, h, cell, n, cx0: x + 104, bagX: x + 52, bagY: y + h / 2 };
  }

  pocketShown() {
    return this.pocketOpen || [...this.drags.values()].some((d) => d.actor && d.started);
  }

  drawPocket(g: CanvasRenderingContext2D) {
    const st = this.stage;
    st.uiTransform();
    const r = this.pocketRect();
    const dragging = [...this.drags.values()].some((d) => d.actor && d.started);
    const target = this.pocketShown() ? 1 : 0;
    this.pocketAnim += (target - this.pocketAnim) * 0.25;
    const k = this.pocketAnim;
    const items = this.world.pocket();
    if (k > 0.02) {
      const w = 104 + (r.w - 104) * k;
      g.save();
      g.globalAlpha = 0.92;
      roundRect(g, r.x, r.y, w, r.h, 32);
      g.fillStyle = 'rgba(255,255,255,0.92)';
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = dragging ? '#ff9ec4' : 'rgba(69,54,90,0.35)';
      g.stroke();
      g.restore();
      g.save();
      roundRect(g, r.x, r.y, w, r.h, 32);
      g.clip();
      for (let i = 0; i < r.n; i++) {
        const cx = r.cx0 + i * r.cell + r.cell / 2, cy = r.y + r.h / 2;
        g.save();
        g.setLineDash([9, 8]);
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(69,54,90,0.28)';
        roundRect(g, cx - 38, cy - 38, 76, 76, 20);
        g.stroke();
        g.restore();
        const e = items[i];
        if (e) this.drawThumb(g, e, cx, cy, 66);
      }
      g.restore();
    }
    const bag = textures.get('ui:bag');
    if (bag) {
      g.save();
      g.translate(r.bagX, r.bagY);
      const pulse = dragging ? 1 + Math.sin(this.time * 10) * 0.05 : 1;
      g.scale(0.9 * pulse, 0.9 * pulse);
      drawTex(g, bag);
      g.restore();
    }
    const count = items.filter(Boolean).length;
    if (count && k < 0.5) {
      g.save();
      g.beginPath();
      g.arc(r.bagX + 34, r.bagY - 34, 17, 0, Math.PI * 2);
      g.fillStyle = '#ff6b9a';
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = '#ffffff';
      g.stroke();
      g.fillStyle = '#ffffff';
      g.font = '800 22px Rubik, system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(count), r.bagX + 34, r.bagY - 32);
      g.restore();
    }
  }

  drawThumb(g: CanvasRenderingContext2D, e: Ent, cx: number, cy: number, box: number) {
    let tex: Tex | undefined;
    if (e.def === 'char') {
      const a = new CharActor(e);
      tex = a.headTex();
      if (!tex) { textures.loadAll(a.specs()); return; }
      const k = box / Math.max(tex.w, tex.h) * 1.15;
      g.save();
      g.translate(cx, cy);
      g.scale(k, k);
      drawTex(g, tex);
      drawFace(g, a.metrics().headR, a.look.size, a.look.skin, { eyes: 'happy', mouth: 'smile', lx: 0, ly: 0, blink: 0 });
      g.restore();
      return;
    }
    const a = this.makeActor(e);
    tex = a?.thumb();
    if (!tex) { if (a) textures.loadAll(a.specs()); return; }
    const k = Math.min(1.1, box / Math.max(tex.w, tex.h));
    g.save();
    g.translate(cx, cy + (tex.h * k) / 2 - (tex.h - tex.ay) * k);
    g.scale(k, k);
    drawTex(g, tex);
    g.restore();
  }

  /** -2 outside, -1 bag, 0..n cell */
  pocketCellAt(sx: number, sy: number): number {
    const r = this.pocketRect();
    if (Math.hypot(sx - r.bagX, sy - r.bagY) < 62) return -1;
    if (!this.pocketShown()) return -2;
    if (sx < r.x - 10 || sx > r.x + r.w + 10 || sy < r.y - 20 || sy > r.y + r.h + 10) return -2;
    if (sx < r.cx0) return -1;
    return clamp(Math.floor((sx - r.cx0) / r.cell), 0, r.n - 1);
  }

  // ------------------------------------------------------------ input
  hitTest(wx: number, wy: number, exclude?: Actor | null): Actor | null {
    for (let i = this.drawList.length - 1; i >= 0; i--) {
      const a = this.drawList[i];
      if (a === exclude || a.hidden) continue;
      if (exclude && this.isDescendant(a, exclude)) continue;
      if (a instanceof CharActor) {
        for (const k of [a.headKid, a.handKid]) if (k && !k.dragging && dist(k.x, k.y - 15, wx, wy) < 32) return k;
      }
      if (a instanceof PetActor) {
        const hk = this.world.childAt(a.id, HEAD);
        const ka = hk && this.actors.get(hk.id);
        if (ka && dist(ka.x, ka.y - 15, wx, wy) < 30) return ka;
      }
      if (a.hit(wx, wy)) return a;
    }
    return null;
  }

  isDescendant(a: Actor, root: Actor): boolean {
    let p = a.e.p;
    while (p) {
      if (p === root.id) return true;
      p = this.world.get(p)?.p;
    }
    return false;
  }

  down(p: PEvt): boolean {
    if (!this.ready) return false;
    // pocket
    const cell = this.pocketCellAt(p.sx, p.sy);
    if (cell >= -1) {
      if (cell >= 0) {
        const e = this.world.pocket()[cell];
        if (e) { this.pullFromPocket(e, p); return true; }
        return true;
      }
      this.pocketOpen = !this.pocketOpen;
      sound.play(this.pocketOpen ? 'pop' : 'click');
      return true;
    }
    const a = this.hitTest(p.wx, p.wy);
    const d: Drag = { id: p.id, mode: 'pan', actor: null, sx: p.sx, sy: p.sy, ssx: p.sx, ssy: p.sy, offX: 0, offY: 0, moved: false, t0: this.time, vx: 0, lastWX: p.wx, started: false };
    if (a && !a.fixed) {
      d.mode = 'item';
      d.actor = a;
      d.offX = a.x - p.wx;
      d.offY = a.y - p.wy;
    } else if (a) {
      d.mode = 'tap';
      d.actor = a;
    }
    this.camV = 0;
    this.drags.set(p.id, d);
    return true;
  }

  move(p: PEvt) {
    const d = this.drags.get(p.id);
    if (!d) return;
    const dx = p.sx - d.sx;
    d.sx = p.sy !== undefined ? p.sx : d.sx;
    d.sy = p.sy;
    if (!d.moved && Math.hypot(p.sx - d.ssx, p.sy - d.ssy) > MOVE_SLOP) d.moved = true;
    if (d.mode === 'item' && d.moved && !d.started && d.actor) this.beginDrag(d);
    if ((d.mode === 'pan' || d.mode === 'tap') && d.moved) {
      d.mode = 'pan';
      const others = [...this.drags.values()].some((o) => o !== d && o.mode === 'pan' && o.moved);
      if (!others) {
        this.camX = clamp(this.camX - dx, this.camMin(), this.camMax());
        const dt = Math.max(0.016, this.time - d.t0);
        d.vx = d.vx * 0.6 + (-dx / 0.016) * 0.4;
        d.t0 = this.time;
        void dt;
      }
    }
  }

  up(p: PEvt) {
    const d = this.drags.get(p.id);
    if (!d) return;
    this.drags.delete(p.id);
    if (d.mode === 'item' && d.actor) {
      if (d.started) this.drop(d);
      else this.tap(d.actor);
    } else if (d.mode === 'tap' && d.actor && !d.moved) {
      this.tap(d.actor);
    } else if (d.mode === 'pan') {
      this.camV = clamp(d.vx, -3000, 3000);
    }
    this.hint = null;
  }

  cancel(p: PEvt) { this.up(p); }

  // ------------------------------------------------------------ drag & drop
  beginDrag(d: Drag) {
    const a = d.actor!;
    d.started = true;
    if (a.e.p) {
      const w = { x: a.x, y: a.y };
      this.world.detach(a.e);
      a.e.x = w.x; a.e.y = w.y;
      d.offX = a.e.x - (this.camX + d.sx);
      d.offY = a.e.y - (this.stage.view.y + d.sy);
      // adjust offset for chars that were rotated/sitting
      if (a instanceof CharActor || a instanceof PetActor) {
        const h = a instanceof CharActor ? a.metrics().headY * 0.5 : -40;
        d.offX = 0;
        d.offY = -h;
      }
    }
    a.dragging = true;
    a.rot = 0;
    this.tweens.to(a, { lift: 10, sx: 1.06, sy: 1.06 }, 0.12, ease.outBack);
    if (a instanceof CharActor) { a.setMood('surprise', 0.35); sound.play('giggle', a.look.size === 'baby' ? 1.3 : a.look.size === 'adult' ? 0.8 : 1.05); }
    else if (a instanceof PetActor) { a.setMood('happy', 0.4); this.petSound(a); }
    else sound.play('pick');
    haptic('light');
    this.world.touch();
  }

  dragFollow(d: Drag) {
    const a = d.actor!;
    const wx = this.camX + d.sx, wy = this.stage.view.y + d.sy;
    const nx = wx + d.offX, ny = wy + d.offY;
    const vx = nx - a.e.x;
    a.e.x = nx;
    a.e.y = ny;
    a.x = nx; a.y = ny;
    // dangle
    const target = clamp(-vx * 0.02, -0.5, 0.5);
    a.rot += (target - a.rot) * 0.25;
    // drop hint
    const slot = this.findSlot(a, wx, wy);
    this.hint = slot ? { x: slot.pos.x, y: slot.pos.y, t: 0.15 } : null;
  }

  fingerWorld(d: Drag) { return { x: this.camX + d.sx, y: this.stage.view.y + d.sy }; }

  drop(d: Drag) {
    const a = d.actor!;
    const f = this.fingerWorld(d);
    a.dragging = false;
    this.tweens.to(a, { lift: 0, sx: 1, sy: 1 }, 0.15, ease.outQuad);
    // pocket?
    const cell = this.pocketCellAt(d.sx, d.sy);
    if (cell >= -1 && this.putInPocket(a, cell)) return;
    // onto a character / pet?
    const target = this.hitTest(f.x, f.y, a);
    const tags = a.tags;
    if (target && (target instanceof CharActor || target instanceof PetActor) && a instanceof ThingActor) {
      const h = target.headWorld();
      const hr = target instanceof CharActor ? target.metrics().headR : target.info.headR;
      const nearHead = dist(f.x, f.y, h.x, h.y) < hr * 1.7 || dist(a.center().x, a.center().y, h.x, h.y) < hr * 1.5;
      if (nearHead && (tags.includes('food') || tags.includes('drink') || tags.includes('petfood'))) { this.feed(target, a); return; }
      if (tags.includes('wear') && (nearHead || target instanceof CharActor)) { this.wear(target, a); return; }
      if (tags.includes('brush') && nearHead) { this.brush(target, a); return; }
      if (tags.includes('med') && target instanceof PetActor) { this.heal(target, a); return; }
      if (target instanceof CharActor && !this.world.childAt(target.id, HAND)) { this.hold(target, a); return; }
    }
    // slots
    const slot = this.findSlot(a, f.x, f.y);
    if (slot) { this.attachTo(a, slot.parent, slot.i); return; }
    this.fall(a);
  }

  findSlot(a: Actor, fx: number, fy: number): { parent: Actor; i: number; pos: { x: number; y: number } } | null {
    let best: { parent: Actor; i: number; pos: { x: number; y: number }; d: number } | null = null;
    const c = a.center();
    for (const p of this.actors.values()) {
      if (p === a || p.hidden || p.dragging || this.isDescendant(p, a)) continue;
      const slots = p.slots();
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.inside && !p.e.s.open) continue;
        if (!s.accept.some((t) => a.tags.includes(t))) continue;
        if (this.world.childAt(p.id, i)) continue;
        const pos = p.slotWorld(i);
        const r = s.r ?? 120;
        const dd = Math.min(dist(pos.x, pos.y, fx, fy), dist(pos.x, pos.y, c.x, c.y), dist(pos.x, pos.y, a.x, a.y));
        if (dd < r && (!best || dd < best.d)) best = { parent: p, i, pos, d: dd };
      }
    }
    return best;
  }

  attachTo(a: Actor, parent: Actor, i: number) {
    const s = parent.slots()[i];
    this.world.attach(a.e, parent.e, i);
    a.sx = 1.12; a.sy = 0.9;
    this.tweens.to(a, { sx: 1, sy: 1 }, 0.35, ease.outElastic);
    const pose = s.pose ?? 'place';
    if (a instanceof CharActor) {
      if (pose === 'lie') { a.setMood('sleep', 999); sound.play('yawn', a.look.size === 'baby' ? 1.4 : 1); }
      else if (pose === 'bath') { a.setMood('happy', 1.5); sound.play('splash'); }
      else if (pose === 'swing') { a.setMood('happy', 2); sound.play('snap'); }
      else { a.setMood('happy', 0.8); sound.play('snap'); }
    } else if (a instanceof PetActor) {
      if (pose === 'lie') a.setMood('sleep', 999);
      sound.play('snap');
    } else {
      sound.play('pop');
    }
    const sp = parent instanceof ThingActor ? SPECIALS[parent.d.id] : undefined;
    sp?.attach?.(parent as ThingActor, a, i, this);
    haptic('light');
  }

  fall(a: Actor) {
    const fl = this.loc.floor;
    const e = a.e;
    e.x = clamp(e.x, 30, this.loc.width - 30);
    const target = e.y < fl.top ? fl.top + rand(4, 30) : clamp(e.y, fl.top, fl.bottom);
    const h = target - e.y;
    if (h > 4) {
      const t = Math.sqrt(h) * 0.028;
      this.tweens.to(e, { y: target }, t, ease.inQuad, () => this.land(a));
    } else {
      e.y = target;
      this.land(a);
    }
    this.world.touch();
  }

  land(a: Actor) {
    a.sx = 1.18; a.sy = 0.84;
    this.tweens.to(a, { sx: 1, sy: 1 }, 0.4, ease.outElastic);
    if (a instanceof CharActor) sound.play('drop', 0.8);
    else if (a instanceof ThingActor && a.d.tags.includes('ball')) {
      sound.play('boing');
      this.tweens.to(a, { oy: -60 }, 0.18, ease.outQuad, () => this.tweens.to(a, { oy: 0 }, 0.2, ease.outBounce));
    } else sound.play('drop', 1.2);
  }

  putInPocket(a: Actor, cell: number): boolean {
    const items = this.world.pocket();
    let idx = cell >= 0 && !items[cell] ? cell : items.findIndex((x) => !x);
    if (idx < 0) return false;
    const e = a.e;
    this.world.detach(e);
    this.world.setLoc(e, 'pocket');
    e.pocketIdx = idx;
    const f = { x: a.x, y: a.y };
    this.removeActorTree(e.id);
    this.fx.emit('sparkle', f.x, f.y - 40, 6);
    sound.play('pop', 1.2);
    haptic('light');
    this.world.touch();
    return true;
  }

  pullFromPocket(e: Ent, p: PEvt) {
    delete e.pocketIdx;
    this.world.setLoc(e, this.loc.id);
    e.x = p.wx;
    e.y = p.wy + 60;
    const a = this.addActorTree(e);
    if (!a) return;
    this.ensureTex(a);
    const d: Drag = { id: p.id, mode: 'item', actor: a, sx: p.sx, sy: p.sy, ssx: p.sx, ssy: p.sy, offX: 0, offY: 60, moved: true, t0: this.time, vx: 0, lastWX: p.wx, started: false };
    this.drags.set(p.id, d);
    this.beginDrag(d);
    d.offX = 0;
    d.offY = a instanceof CharActor ? -a.metrics().headY * 0.5 : 40;
    this.dragFollow(d);
  }

  // ------------------------------------------------------------ interactions
  feed(t: CharActor | PetActor, food: ThingActor) {
    const tags = food.d.tags;
    const h = t.headWorld();
    if (t instanceof CharActor && tags.includes('petfood')) {
      t.setMood('yuck', 1);
      sound.play('boing', 0.7);
      this.fall(food);
      return;
    }
    if (t instanceof PetActor && !tags.includes('petfood') && !tags.includes('food')) {
      this.fall(food);
      return;
    }
    if (tags.includes('drink')) {
      sound.play('gulp');
      this.fx.emit('drop', h.x, h.y + 10, 4, { color: '#bfe8ff' });
    } else {
      sound.play('chomp', t instanceof PetActor ? 1.3 : 1);
      this.fx.emit('crumb', h.x, h.y + 20, 8, { color: '#e3a86b' });
      food.e.s.bites = (food.e.s.bites ?? 3) - 1;
    }
    t.setMood('eat', 1.2);
    this.timers.after(1.2, () => {
      t.setMood('happy', 1.2);
      sound.play('yum', t instanceof CharActor && t.look.size === 'baby' ? 1.3 : 1);
      this.fx.emit('heart', h.x, h.y - 50, 3);
    });
    haptic('light');
    if ((food.e.s.bites ?? 1) <= 0) {
      this.fx.emit('puff', h.x, h.y + 10, 3);
      this.removeActorTree(food.id);
      this.world.remove(food.id);
      return;
    }
    if (t instanceof CharActor && !this.world.childAt(t.id, HAND)) {
      this.world.attach(food.e, t.e, HAND);
    } else {
      food.e.x = h.x + 70;
      food.e.y = h.y;
      this.fall(food);
    }
    this.world.touch();
  }

  wear(t: CharActor | PetActor, item: ThingActor) {
    const old = this.world.childAt(t.id, HEAD);
    if (old) {
      const oa = this.actors.get(old.id);
      this.world.detach(old);
      const h = t.headWorld();
      old.x = h.x + 80;
      old.y = h.y;
      if (oa) this.fall(oa);
    }
    this.world.attach(item.e, t.e, HEAD);
    t.setMood('happy', 1.2);
    sound.play('sparkle');
    const h = t.headWorld();
    this.fx.emit('sparkle', h.x, h.y - 40, 7);
    this.world.touch();
  }

  hold(t: CharActor, item: ThingActor) {
    this.world.attach(item.e, t.e, HAND);
    t.setMood('happy', 0.8);
    sound.play('pop');
    this.world.touch();
  }

  brush(t: CharActor | PetActor, item: ThingActor) {
    const h = t.headWorld();
    sound.play('brush');
    this.fx.emit('bubble', h.x, h.y, 6);
    this.fx.emit('sparkle', h.x, h.y - 30, 4);
    t.setMood('happy', 1.2);
    item.e.x = h.x + 70;
    item.e.y = h.y;
    this.fall(item);
  }

  heal(t: PetActor, item: ThingActor) {
    const h = t.headWorld();
    sound.play('heart');
    this.fx.emit('heart', h.x, h.y - 40, 5);
    t.setMood('happy', 1.5);
    item.e.x = h.x + 60;
    item.e.y = h.y;
    this.fall(item);
  }

  petSound(a: PetActor) {
    const s = a.kind === 'cat' ? 'meow' : a.kind === 'dog' ? 'woof' : 'squeak';
    sound.play(s, a.kind === 'hamster' ? 1.5 : 1);
  }

  tap(a: Actor) {
    haptic('light');
    if (a instanceof CharActor) {
      const held = this.world.childAt(a.id, HAND);
      const hd = held && DEFS.get(held.def);
      if (held && hd && (hd.tags.includes('food') || hd.tags.includes('drink'))) {
        const ha = this.actors.get(held.id);
        if (ha instanceof ThingActor) { this.world.detach(held); this.feed(a, ha); return; }
      }
      if (a.mood === 'sleep') { sound.play('yawn', 1.2); this.wobble(a, 0.06); return; }
      a.setMood('giggle', 0.9);
      sound.play('giggle', a.look.size === 'baby' ? 1.35 : a.look.size === 'adult' ? 0.8 : 1.05);
      this.tweens.to(a, { oy: -36 }, 0.16, ease.outQuad, () => this.tweens.to(a, { oy: 0 }, 0.3, ease.outBounce));
      const h = a.headWorld();
      this.fx.emit('heart', h.x, h.y - 60, 2);
      return;
    }
    if (a instanceof PetActor) {
      a.setMood('happy', 1.2);
      this.petSound(a);
      this.tweens.to(a, { oy: -30 }, 0.15, ease.outQuad, () => this.tweens.to(a, { oy: 0 }, 0.3, ease.outBounce));
      const h = a.headWorld();
      this.fx.emit('heart', h.x, h.y - 40, 3);
      return;
    }
    if (!(a instanceof ThingActor)) return;
    const d = a.d;
    const sp = SPECIALS[d.id];
    if (sp?.tap && sp.tap(a, this)) { this.world.touch(); return; }
    if (d.door) {
      sound.play(d.sound ?? 'door');
      this.wobble(a, 0.05);
      this.app.goto(d.door);
      return;
    }
    const s = a.e.s;
    switch (d.tap) {
      case 'toggle':
        s.on = !s.on;
        sound.play(d.sound ?? 'toggle');
        if (s.on && d.cooks) sound.play('sizzle');
        this.wobble(a, 0.04);
        break;
      case 'open':
        s.open = !s.open;
        sound.play(d.sound ?? 'door');
        if (s.open) this.restock(a);
        this.wobble(a, 0.03);
        break;
      case 'light':
        s.on = s.on === false ? true : d.id === 'lightswitch' ? false : !s.on;
        sound.play('click');
        this.wobble(a, 0.05);
        break;
      case 'tv':
        if (!s.on) { s.on = true; s.ch = 0; }
        else if ((s.ch ?? 0) < 2) s.ch = (s.ch ?? 0) + 1;
        else s.on = false;
        sound.play('tv');
        break;
      case 'radio':
        s.on = !s.on;
        sound.play('toggle');
        this.syncRadio();
        this.wobble(a, 0.08);
        break;
      case 'spawn':
        this.spawnFrom(a);
        break;
      case 'spin':
        sound.play(d.sound ?? 'mixer');
        this.wobble(a, 0.1);
        this.timers.after(0.5, () => this.spawnFrom(a));
        break;
      case 'bounce':
        sound.play(d.sound ?? 'boing');
        this.wobble(a, 0.12);
        break;
      case 'ring':
        sound.play(d.sound ?? 'ding');
        this.wobble(a, 0.08);
        break;
      default:
        if (!d.fixed) {
          sound.play(d.sound ?? 'tap');
          this.wobble(a, 0.12);
          if (d.tags.includes('ball')) {
            this.tweens.to(a, { oy: -80 }, 0.22, ease.outQuad, () => this.tweens.to(a, { oy: 0 }, 0.35, ease.outBounce));
          }
        } else {
          this.wobble(a, 0.03);
          sound.play('tap', 0.8);
        }
    }
    this.world.touch();
  }

  wobble(a: Actor, k: number) {
    a.sx = 1 + k * 1.3;
    a.sy = 1 - k;
    this.tweens.to(a, { sx: 1, sy: 1 }, 0.45, ease.outElastic);
  }

  syncRadio() {
    let on = false;
    for (const a of this.actors.values()) if (a instanceof ThingActor && a.d.tap === 'radio' && a.e.s.on) on = true;
    sound.setRadio(on);
    if (on) for (const a of this.actors.values()) if (a instanceof CharActor) a.dance = 1;
  }

  restock(a: ThingActor) {
    const slots = a.slots();
    slots.forEach((s, i) => {
      if (!s.restock || this.world.childAt(a.id, i)) return;
      const e = this.world.makeThing(s.restock, this.loc.id, a.x, a.y);
      this.world.attach(e, a.e, i);
      this.addActorTree(e);
    });
  }

  restockT = new Map<string, number>();
  autoRestock(a: ThingActor, dt: number) {
    const t = (this.restockT.get(a.id) ?? 0) + dt;
    if (t < 4) { this.restockT.set(a.id, t); return; }
    this.restockT.set(a.id, 0);
    const before = this.world.children(a.id).length;
    this.restock(a);
    if (this.world.children(a.id).length > before) {
      const p = a.localToWorld(0, -a.d.art.h * 0.6);
      this.fx.emit('sparkle', p.x, p.y, 5);
      sound.play('sparkle', 1.3);
    }
  }

  spawnFrom(a: ThingActor) {
    const d = a.d;
    const list = d.spawn ?? [];
    if (!list.length) return;
    const id = pick(list);
    const at = d.spawnAt ?? { x: 0, y: -d.art.h };
    const p = a.localToWorld(at.x, at.y);
    const st: Record<string, unknown> = {};
    if (id === 'icecream') st.flavor = Math.floor(rand(0, 4));
    const e = this.world.makeThing(id, this.loc.id, p.x, p.y, st);
    const na = this.addActorTree(e);
    if (na) this.ensureTex(na);
    sound.play(d.sound ?? 'pop');
    this.wobble(a, 0.06);
    this.fx.emit('sparkle', p.x, p.y, 6);
    const tx = p.x + rand(-90, 90) + (d.spawnAt?.x ?? 0) * 0;
    const ty = clamp(this.loc.floor.top + rand(20, 120), this.loc.floor.top, this.loc.floor.bottom);
    const up = p.y - 90;
    this.tweens.to(e, { y: up, x: (p.x + tx) / 2 }, 0.22, ease.outQuad, () => {
      this.tweens.to(e, { y: ty, x: tx }, 0.35, ease.inQuad, () => na && this.land(na));
    });
    this.world.touch();
  }

  cookTick(a: ThingActor, dt: number) {
    const kind = a.d.cooks!;
    for (const k of this.world.children(a.id)) {
      const kd = DEFS.get(k.def);
      const c = kd?.cook?.find((x) => x.by === kind);
      if (!c) continue;
      k.s.cookT = (k.s.cookT ?? 0) + dt;
      const ka = this.actors.get(k.id);
      if (ka && Math.random() < dt * 4) this.fx.emit('steam', ka.x + rand(-14, 14), ka.y - 30, 1);
      if ((k.s.cookT ?? 0) >= c.time) {
        k.def = c.to;
        k.s = {};
        const nd = DEFS.get(c.to);
        if (nd?.bites) k.s.bites = nd.bites;
        this.actors.delete(k.id);
        const na = this.addActorTree(k);
        if (na) { this.ensureTex(na); na.sx = 1.3; na.sy = 0.8; this.tweens.to(na, { sx: 1, sy: 1 }, 0.5, ease.outElastic); }
        const p = ka ? { x: ka.x, y: ka.y } : a.localToWorld(0, -a.d.art.h);
        this.fx.emit('sparkle', p.x, p.y - 30, 8);
        this.fx.emit('star', p.x, p.y - 30, 3, { color: '#ffd866' });
        sound.play('ding');
        this.world.touch();
      }
    }
  }
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export type { SlotDef, ThingDef };
