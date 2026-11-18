import type { Stage } from '../engine/stage';
import { textures, drawTex } from '../engine/textures';
import { sound } from '../engine/audio';
import { ease, clamp } from '../engine/tween';
import { World } from './world';
import { LOC } from './catalog';
import { PlayScene, type PEvt } from './play';
import { MapScene } from './map';
import { StudioScene } from './studio';
import { uiSpecs } from '../art/ui';
import { loadSave, writeSave, nativeSetup, haptic } from '../platform';
import { Overlay } from '../ui/overlay';
import { store } from '../iap';

export interface Scene {
  camX: number;
  enter(onProgress?: (k: number) => void): Promise<void>;
  exit(): void;
  update(dt: number): void;
  draw(g: CanvasRenderingContext2D): void;
  down(p: PEvt): boolean;
  move(p: PEvt): void;
  up(p: PEvt): void;
  cancel?(p: PEvt): void;
  onResize?(): Promise<void>;
  kind: 'play' | 'map' | 'studio';
}

interface Btn { key: string; x: number; y: number; r: number; on: () => void; show: () => boolean; scale: number }

export class App {
  stage: Stage;
  world: World = new World();
  scene: Scene | null = null;
  overlay: Overlay;
  private last = 0;
  private trans: { k: number; dir: 1 | -1; busy: boolean } = { k: 0, dir: -1, busy: false };
  private saveT = 0;
  private btns: Btn[] = [];
  private btnDown: Btn | null = null;
  private pointerScene = new Set<number>();
  loadingK = 0;

  constructor(stage: Stage) {
    this.stage = stage;
    this.overlay = new Overlay(this);
    stage.onResize(() => this.onResize());
  }

  async start() {
    const json = await loadSave();
    this.world = World.load(json);
    sound.sfxOn = this.world.settings.sfx;
    sound.musicOn = this.world.settings.music;
    this.overlay.applyLang();
    textures.setPpu(this.stage.ppu);
    await textures.loadAll(uiSpecs());
    this.setupButtons();
    this.bindInput();
    nativeSetup(() => this.pause(), () => this.resume(), () => this.back());
    store.init(this).catch((e) => console.warn('store init', e));
    const q = new URLSearchParams(location.search);
    if (q.get('unlock') === '1') this.world.owned.add('full_town');
    const want = q.get('loc') || this.world.current;
    const startLoc = LOC.get(want) && !this.isLocked(want) ? want : 'home';
    if (q.get('scene') === 'map') { await this.setScene(new MapScene(this)); this.trans.k = 1; requestAnimationFrame((t) => this.frame(t)); this.animTrans(-1); (window as any).__app = this; (window as any).__done = true; return; }
    if (q.get('scene') === 'studio') { await this.setScene(new StudioScene(this)); this.trans.k = 1; requestAnimationFrame((t) => this.frame(t)); this.animTrans(-1); (window as any).__app = this; (window as any).__done = true; return; }
    await this.setScene(new PlayScene(this, LOC.get(startLoc)!));
    this.trans.k = 1;
    this.trans.dir = -1;
    requestAnimationFrame((t) => this.frame(t));
    this.animTrans(-1);
    (window as any).__app = this;
    (window as any).__done = true;
  }

  isLocked(loc: string) {
    const L = LOC.get(loc);
    if (!L || !L.pack) return false;
    return !this.world.owned.has(L.pack);
  }

  setupButtons() {
    this.btns = [
      { key: 'map', x: 0, y: 0, r: 46, scale: 0.92, on: () => this.openMap(), show: () => this.scene?.kind === 'play' },
      { key: 'gear', x: 0, y: 0, r: 34, scale: 0.8, on: () => this.overlay.openParents(), show: () => true },
    ];
    this.layoutButtons();
  }

  layoutButtons() {
    const st = this.stage;
    const [m, g] = this.btns;
    m.x = st.safe.l + 64; m.y = st.safe.t + 60;
    g.x = st.view.w - st.safe.r - 50; g.y = st.safe.t + 48;
  }

  private async onResize() {
    this.layoutButtons();
    if (textures.setPpu(this.stage.ppu)) await textures.loadAll(uiSpecs());
    await this.scene?.onResize?.();
  }

  bindInput() {
    const c = this.stage.canvas;
    c.style.touchAction = 'none';
    const ev = (e: PointerEvent): PEvt => {
      const l = this.stage.clientToLocal(e.clientX, e.clientY);
      const s = this.stage.scale;
      const sx = l.x / s, sy = l.y / s;
      const camX = this.scene?.camX ?? 0;
      return { id: e.pointerId, sx, sy, wx: camX + sx, wy: this.stage.view.y + sy };
    };
    c.addEventListener('pointerdown', (e) => {
      sound.unlock();
      try { c.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      if (this.trans.busy) return;
      const p = ev(e);
      for (const b of this.btns) {
        if (b.show() && Math.hypot(p.sx - b.x, p.sy - b.y) < b.r + 14) { this.btnDown = b; return; }
      }
      if (this.scene?.down(p)) this.pointerScene.add(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.pointerScene.has(e.pointerId)) return;
      this.scene?.move(ev(e));
    });
    const up = (e: PointerEvent, cancel = false) => {
      sound.unlock();
      if (this.btnDown) {
        const p = ev(e);
        const b = this.btnDown;
        this.btnDown = null;
        if (!cancel && Math.hypot(p.sx - b.x, p.sy - b.y) < b.r + 24) { sound.play('pop'); haptic('light'); b.on(); }
        return;
      }
      if (!this.pointerScene.has(e.pointerId)) return;
      this.pointerScene.delete(e.pointerId);
      if (cancel && this.scene?.cancel) this.scene.cancel(ev(e));
      else this.scene?.up(ev(e));
    };
    c.addEventListener('pointerup', (e) => up(e));
    c.addEventListener('pointercancel', (e) => up(e, true));
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.back(); });
  }

  async setScene(s: Scene) {
    this.scene?.exit();
    this.scene = s;
    this.loadingK = 0;
    await s.enter((k) => (this.loadingK = k));
  }

  /** iris transition to a new scene */
  async transitionTo(make: () => Scene) {
    if (this.trans.busy) return;
    this.trans.busy = true;
    sound.play('whoosh');
    await this.animTrans(1);
    await this.setScene(make());
    this.markDirty();
    await this.animTrans(-1);
    this.trans.busy = false;
  }

  private animTrans(dir: 1 | -1) {
    return new Promise<void>((res) => {
      this.trans.dir = dir;
      const step = () => {
        this.trans.k = clamp(this.trans.k + (dir === 1 ? 1 : -1) * 0.07, 0, 1);
        if ((dir === 1 && this.trans.k >= 1) || (dir === -1 && this.trans.k <= 0)) res();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  goto(locId: string) {
    const L = LOC.get(locId);
    if (!L) return;
    if (this.isLocked(locId)) { this.overlay.openStore(locId); return; }
    this.transitionTo(() => new PlayScene(this, L));
  }

  openMap() { this.transitionTo(() => new MapScene(this)); }

  openStudio() { this.transitionTo(() => new StudioScene(this)); }

  back(): boolean {
    if (this.overlay.isOpen()) { this.overlay.close(); return true; }
    if (this.scene?.kind === 'studio' || this.scene?.kind === 'map') {
      this.goto(this.world.current || 'home');
      return true;
    }
    return false;
  }

  markDirty() { this.world.dirty = true; }

  async resetWorld() {
    const fresh = new World();
    fresh.owned = new Set(this.world.owned);
    fresh.settings = { ...this.world.settings };
    this.world = fresh;
    await writeSave(fresh.serialize());
    location.reload();
  }

  async saveNow() {
    this.world.dirty = false;
    if (this.scene instanceof PlayScene) this.world.cam[this.scene.loc.id] = this.scene.camX;
    await writeSave(this.world.serialize());
  }

  pause() {
    sound.suspend();
    this.saveNow();
  }

  resume() {
    sound.resume();
  }

  private frame(t: number) {
    const dt = Math.min(0.05, this.last ? (t - this.last) / 1000 : 0.016);
    this.last = t;
    try {
      this.scene?.update(dt);
      this.draw();
    } catch (e) {
      console.error(e);
    }
    this.saveT += dt;
    if (this.world.dirty && this.saveT > 2) { this.saveT = 0; this.saveNow(); }
    requestAnimationFrame((tt) => this.frame(tt));
  }

  private draw() {
    const g = this.stage.ctx;
    this.scene?.draw(g);
    // buttons
    this.stage.uiTransform();
    for (const b of this.btns) {
      if (!b.show()) continue;
      const tex = textures.get('ui:' + b.key);
      if (!tex) continue;
      g.save();
      g.translate(b.x, b.y);
      const pressed = this.btnDown === b ? 0.9 : 1;
      g.scale(b.scale * pressed, b.scale * pressed);
      if (b.key === 'gear') g.globalAlpha = 0.75;
      drawTex(g, tex);
      g.restore();
    }
    // transition iris
    if (this.trans.k > 0) {
      const st = this.stage;
      const W = st.view.w, H = st.view.h;
      const k = ease.inOutQuad(this.trans.k);
      const R = Math.hypot(W, H) * 0.6 * (1 - k);
      g.save();
      g.beginPath();
      g.rect(-10, -10, W + 20, H + 20);
      g.arc(W / 2, H / 2, Math.max(0, R), 0, Math.PI * 2, true);
      g.fillStyle = '#ff9ec4';
      g.fill('evenodd');
      if (k > 0.98) {
        g.fillStyle = '#ffffff';
        g.font = '800 64px Rubik, system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const dots = '•'.repeat(1 + (Math.floor(performance.now() / 300) % 3));
        g.fillText(dots, W / 2, H / 2);
      }
      g.restore();
    }
  }
}
