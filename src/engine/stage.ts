// Stage: owns the canvas, maps the 1600x900 "core" design area onto any screen.
// Portrait screens are handled by rotating the whole stage 90deg (landscape game).

export const CORE_W = 1600;
export const CORE_H = 900;

export interface Rect { x: number; y: number; w: number; h: number }

export class Stage {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  cssW = 0;
  cssH = 0;
  dpr = 1;
  /** css px per world unit */
  scale = 1;
  /** device px per world unit */
  ppu = 1;
  /** visible world rect (camera at 0) */
  view: Rect = { x: 0, y: 0, w: CORE_W, h: CORE_H };
  /** safe-area insets in world units (landscape frame) */
  safe = { l: 0, r: 0, t: 0, b: 0 };
  rotated = false;
  private fns: (() => void)[] = [];
  private probe: HTMLElement | null;

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    this.root = root;
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.probe = document.getElementById('safe-probe');
    const r = () => this.resize();
    window.addEventListener('resize', r);
    window.addEventListener('orientationchange', () => setTimeout(r, 120));
    window.visualViewport?.addEventListener('resize', r);
    this.resize();
  }

  onResize(fn: () => void) { this.fns.push(fn); }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rotated = vh > vw * 1.08;
    const W = rotated ? vh : vw;
    const H = rotated ? vw : vh;
    const dpr = Math.min(window.devicePixelRatio || 1, /[?&]hidpi=1/.test(location.search) ? 3 : 2);
    if (W === this.cssW && H === this.cssH && dpr === this.dpr && rotated === this.rotated) return;
    this.rotated = rotated;
    this.cssW = W;
    this.cssH = H;
    this.dpr = dpr;
    const rs = this.root.style;
    rs.width = W + 'px';
    rs.height = H + 'px';
    rs.transformOrigin = '0 0';
    rs.transform = rotated ? `translate(${vw}px,0) rotate(90deg)` : 'none';
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.scale = Math.min(W / CORE_W, H / CORE_H);
    this.ppu = this.scale * dpr;
    this.view = {
      w: W / this.scale,
      h: H / this.scale,
      x: 0,
      y: 0,
    };
    this.view.x = (CORE_W - this.view.w) / 2;
    this.view.y = (CORE_H - this.view.h) / 2;
    this.readSafe();
    for (const f of this.fns) f();
  }

  private readSafe() {
    let t = 0, r = 0, b = 0, l = 0;
    if (this.probe) {
      const cs = getComputedStyle(this.probe);
      t = parseFloat(cs.paddingTop) || 0;
      r = parseFloat(cs.paddingRight) || 0;
      b = parseFloat(cs.paddingBottom) || 0;
      l = parseFloat(cs.paddingLeft) || 0;
    }
    if (this.rotated) {
      // content rotated 90deg clockwise: stage top = screen right, stage right = screen bottom,
      // stage bottom = screen left, stage left = screen top
      [t, r, b, l] = [r, b, l, t];
    }
    const s = this.scale;
    this.safe = { t: t / s, r: r / s, b: b / s, l: l / s };
  }

  /** client (css px, page) -> local landscape css px */
  clientToLocal(cx: number, cy: number) {
    if (this.rotated) return { x: cy, y: window.innerWidth - cx };
    return { x: cx, y: cy };
  }

  /** client -> world units. camX = world x shown at the left screen edge */
  clientToWorld(cx: number, cy: number, camX: number) {
    const p = this.clientToLocal(cx, cy);
    return { x: camX + p.x / this.scale, y: this.view.y + p.y / this.scale };
  }

  /** camera x that centers a scene of width w (or clamps a scrolling one) */
  centerCam(w: number) { return (w - this.view.w) / 2; }

  /** set ctx transform so that drawing in world units (with camera) maps to device px */
  worldTransform(camX: number) {
    const k = this.ppu;
    this.ctx.setTransform(k, 0, 0, k, -camX * k, -this.view.y * k);
  }

  /** screen-space transform in world-unit scale (for UI drawn relative to screen edges) */
  uiTransform() {
    const k = this.ppu;
    this.ctx.setTransform(k, 0, 0, k, 0, 0);
  }
}
