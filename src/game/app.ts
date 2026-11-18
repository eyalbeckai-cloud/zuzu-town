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
import { DISCOVERIES, discoveriesFor, flagKey, type DEv, type Discovery } from './discover';
import { getLang, t } from '../i18n';

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
  private frameDt = 0.016;
  private pops: { d: Discovery; t: number; all: boolean }[] = [];
  private badgePulse = 0;

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
    (window as any).__tex = textures;
    (window as any).__disc = DISCOVERIES;
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
      { key: 'album', x: 0, y: 0, r: 46, scale: 1, on: () => this.overlay.showAlbum(this.curLoc()), show: () => this.scene?.kind === 'play' },
    ];
    this.layoutButtons();
  }

  layoutButtons() {
    const st = this.stage;
    const [m, g, al] = this.btns;
    m.x = st.safe.l + 64; m.y = st.safe.t + 60;
    al.x = m.x + 124; al.y = m.y;
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

  curLoc(): string { return this.scene instanceof PlayScene ? this.scene.loc.id : this.world.current || 'home'; }

  foundCount(loc: string) {
    const list = discoveriesFor(loc);
    return { n: list.filter((d) => this.world.flags[flagKey(d)]).length, m: list.length };
  }

  /** called by the play scene on every meaningful interaction */
  discover(e: DEv, loc: string, wx: number, wy: number) {
    for (const d of discoveriesFor(loc)) {
      const k = flagKey(d);
      if (this.world.flags[k]) continue;
      let ok = false;
      try { ok = d.test(e); } catch { ok = false; }
      if (!ok) continue;
      this.world.flags[k] = true;
      this.markDirty();
      const { n, m } = this.foundCount(loc);
      this.pops.push({ d, t: 0, all: n === m });
      const sc = this.scene;
      if (sc instanceof PlayScene) {
        sc.fx.emit('star', wx, wy - 40, 7, { color: '#ffd866' });
        sc.fx.emit('sparkle', wx, wy - 40, 8);
        if (n === m) sc.fx.emit('confetti', sc.camX + this.stage.view.w / 2, this.stage.view.y + 120, 60);
      }
      sound.play('sparkle', 1.2);
      setTimeout(() => sound.play(n === m ? 'wheee' : 'ding', 1.1), 220);
      haptic('medium');
    }
  }

  private drawBadge(g: CanvasRenderingContext2D, b: Btn) {
    const { n, m } = this.foundCount(this.curLoc());
    const pulse = this.badgePulse > 0 ? 1 + Math.sin((1 - this.badgePulse) * Math.PI) * 0.25 : 1;
    const pressed = this.btnDown === b ? 0.92 : 1;
    g.save();
    g.translate(b.x, b.y);
    g.scale(pulse * pressed, pulse * pressed);
    const w = 132, h = 66;
    g.fillStyle = 'rgba(69,54,90,0.22)';
    roundRectPath(g, -w / 2, -h / 2 + 5, w, h, h / 2); g.fill();
    g.fillStyle = n === m ? '#fff3b0' : '#ffffff';
    roundRectPath(g, -w / 2, -h / 2, w, h, h / 2); g.fill();
    g.lineWidth = 5; g.strokeStyle = '#45365a'; g.stroke();
    const star = textures.get('ui:star');
    if (star) { g.save(); g.translate(-w / 2 + 34, 22); g.scale(0.78, 0.78); drawTex(g, star); g.restore(); }
    g.fillStyle = '#45365a';
    g.font = '800 30px Rubik, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.direction = 'ltr';
    g.fillText(`${n}/${m}`, 22, 2);
    g.restore();
  }

  private drawPops(g: CanvasRenderingContext2D, dt: number) {
    if (this.badgePulse > 0) this.badgePulse = Math.max(0, this.badgePulse - dt * 2.5);
    const p = this.pops[0];
    if (!p) return;
    p.t += dt;
    const T = p.all ? 3.2 : 2.4;
    const W = this.stage.view.w;
    const al = this.btns[2];
    const cx0 = W / 2, cy0 = 210;
    let x = cx0, y = cy0, sc = 1, a = 1;
    if (p.t < 0.4) { sc = ease.outBack(p.t / 0.4); }
    else if (p.t > T - 0.55) {
      const k = ease.inQuad(Math.min(1, (p.t - (T - 0.55)) / 0.55));
      x = cx0 + (al.x - cx0) * k; y = cy0 + (al.y - cy0) * k; sc = 1 - k * 0.75; a = 1 - k * 0.3;
    }
    g.save();
    g.globalAlpha = a;
    g.translate(x, y);
    g.scale(sc, sc);
    // glow rays
    g.save();
    g.rotate(p.t * 0.8);
    g.fillStyle = 'rgba(255,216,102,0.35)';
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-22, -150); g.lineTo(22, -150); g.closePath(); g.fill(); }
    g.restore();
    g.beginPath(); g.arc(0, 0, 86, 0, Math.PI * 2);
    g.fillStyle = '#ffffff'; g.fill();
    g.lineWidth = 8; g.strokeStyle = '#45365a'; g.stroke();
    g.beginPath(); g.arc(0, 0, 72, 0, Math.PI * 2); g.fillStyle = '#fff3b0'; g.fill();
    g.font = '84px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(p.d.icon, 0, 6);
    if (p.t < T - 0.55) {
      const label = (p.all ? '⭐ ' + t('album.all') : getLang() === 'he' ? p.d.he : p.d.en);
      g.font = '800 34px Rubik, system-ui, sans-serif';
      g.direction = getLang() === 'he' ? 'rtl' : 'ltr';
      const tw = g.measureText(label).width + 50;
      g.fillStyle = '#ffffff';
      roundRectPath(g, -tw / 2, 104, tw, 60, 30); g.fill();
      g.lineWidth = 5; g.stroke();
      g.fillStyle = '#45365a';
      g.fillText(label, 0, 135);
    }
    g.restore();
    if (p.t >= T) { this.pops.shift(); this.badgePulse = 1; sound.play('pop', 1.3); }
  }

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
    this.frameDt = dt;
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
      if (b.key === 'album') { this.drawBadge(g, b); continue; }
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
    if (this.scene?.kind === 'play') this.drawPops(g, this.frameDt);
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

function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
