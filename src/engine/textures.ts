// SVG -> bitmap texture pipeline with automatic "sticker" outline + soft shadow,
// plus a low-res alpha mask for touch hit-testing.

export interface TexSpec {
  key: string;
  svg: () => string;
  /** art size in world units (svg viewBox must be 0 0 w h) */
  w: number;
  h: number;
  /** anchor (base point) in art-local units, default bottom-center */
  ax?: number;
  ay?: number;
  /** white sticker border width in world units (0 = none) */
  outline?: number;
  shadow?: boolean;
}

export interface Tex {
  c: HTMLCanvasElement;
  w: number;
  h: number;
  ax: number;
  ay: number;
  pad: number;
  mask: Uint8Array | null;
  mw: number;
  mh: number;
  mk: number;
}

const MASK_K = 0.25; // mask cells per world unit

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext('2d')!;
  return { c, g };
}

export function svgSize(svg: string, pxW: number, pxH: number) {
  return svg.replace(/<svg\b/, `<svg width="${Math.max(1, Math.round(pxW))}" height="${Math.max(1, Math.round(pxH))}" preserveAspectRatio="none"`);
}

export function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export async function rasterize(spec: TexSpec, ppu: number): Promise<Tex> {
  const outline = spec.outline ?? 5;
  const shadow = spec.shadow ?? outline > 0;
  const pad = outline > 0 ? outline + 8 : 2;
  const W = (spec.w + pad * 2) * ppu;
  const H = (spec.h + pad * 2) * ppu;
  const img = await loadSvgImage(svgSize(spec.svg(), spec.w * ppu, spec.h * ppu));
  const art = makeCanvas(W, H);
  art.g.drawImage(img, pad * ppu, pad * ppu, spec.w * ppu, spec.h * ppu);
  let out = art;
  let maskSrc = art.c;
  if (outline > 0) {
    const sil = makeCanvas(W, H);
    sil.g.drawImage(art.c, 0, 0);
    sil.g.globalCompositeOperation = 'source-in';
    sil.g.fillStyle = '#ffffff';
    sil.g.fillRect(0, 0, W, H);
    const dil = makeCanvas(W, H);
    const r = outline * ppu;
    const rings: [number, number][] = [[r, 20], [r * 0.55, 10]];
    for (const [rr, n] of rings) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        dil.g.drawImage(sil.c, Math.cos(a) * rr, Math.sin(a) * rr);
      }
    }
    const fin = makeCanvas(W, H);
    if (shadow) {
      fin.g.save();
      fin.g.shadowColor = 'rgba(70,40,90,0.28)';
      fin.g.shadowBlur = 5 * ppu;
      fin.g.shadowOffsetY = 3.5 * ppu;
      fin.g.drawImage(dil.c, 0, 0);
      fin.g.restore();
    } else {
      fin.g.drawImage(dil.c, 0, 0);
    }
    fin.g.drawImage(art.c, 0, 0);
    out = fin;
    maskSrc = dil.c;
  }
  // hit mask
  const mw = Math.max(1, Math.ceil((spec.w + pad * 2) * MASK_K));
  const mh = Math.max(1, Math.ceil((spec.h + pad * 2) * MASK_K));
  let mask: Uint8Array | null = null;
  try {
    const m = makeCanvas(mw, mh);
    m.g.drawImage(maskSrc, 0, 0, mw, mh);
    const d = m.g.getImageData(0, 0, mw, mh).data;
    mask = new Uint8Array(mw * mh);
    for (let i = 0; i < mw * mh; i++) mask[i] = d[i * 4 + 3] > 24 ? 1 : 0;
  } catch {
    mask = null;
  }
  return {
    c: out.c,
    w: spec.w,
    h: spec.h,
    ax: spec.ax ?? spec.w / 2,
    ay: spec.ay ?? spec.h,
    pad,
    mask,
    mw,
    mh,
    mk: MASK_K,
  };
}

/** draw texture with its anchor at (0,0) of the current transform */
export function drawTex(g: CanvasRenderingContext2D, t: Tex) {
  g.drawImage(t.c, -t.ax - t.pad, -t.ay - t.pad, t.w + t.pad * 2, t.h + t.pad * 2);
}

/** local point relative to anchor (world units) -> hit? */
export function texHit(t: Tex, lx: number, ly: number): boolean {
  const px = lx + t.ax + t.pad;
  const py = ly + t.ay + t.pad;
  if (px < 0 || py < 0 || px > t.w + t.pad * 2 || py > t.h + t.pad * 2) return false;
  if (!t.mask) return true;
  const mx = Math.floor(px * t.mk);
  const my = Math.floor(py * t.mk);
  if (mx < 0 || my < 0 || mx >= t.mw || my >= t.mh) return false;
  return t.mask[my * t.mw + mx] === 1;
}

export class TexCache {
  ppu = 1;
  private map = new Map<string, Tex>();
  private pending = new Map<string, Promise<Tex>>();
  private specs = new Map<string, TexSpec>();

  get(key: string): Tex | undefined { return this.map.get(key); }

  has(key: string) { return this.map.has(key); }

  load(spec: TexSpec): Promise<Tex> {
    this.specs.set(spec.key, spec);
    const have = this.map.get(spec.key);
    if (have) return Promise.resolve(have);
    const p = this.pending.get(spec.key);
    if (p) return p;
    const ppu = this.ppu;
    const prom = rasterize(spec, ppu).then((t) => {
      this.pending.delete(spec.key);
      if (ppu === this.ppu) this.map.set(spec.key, t);
      return t;
    }).catch((e) => {
      this.pending.delete(spec.key);
      console.warn('tex fail', spec.key, e);
      throw e;
    });
    this.pending.set(spec.key, prom);
    return prom;
  }

  async loadAll(specs: TexSpec[], onProgress?: (k: number) => void) {
    let done = 0;
    const n = specs.length || 1;
    const queue = specs.slice();
    const worker = async () => {
      while (queue.length) {
        const s = queue.shift()!;
        try { await this.load(s); } catch { /* keep going */ }
        done++;
        onProgress?.(done / n);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }

  /** resolution changed: drop everything (scenes reload what they need) */
  setPpu(ppu: number) {
    const q = Math.round(ppu * 100) / 100;
    if (q === this.ppu) return false;
    this.ppu = q;
    this.map.clear();
    this.pending.clear();
    return true;
  }

  dropWhere(pred: (key: string) => boolean) {
    for (const k of [...this.map.keys()]) if (pred(k)) this.map.delete(k);
  }

  size() { return this.map.size; }

  /** approximate bytes held by rasterized textures (backing stores + masks) */
  bytes() {
    let b = 0;
    for (const t of this.map.values()) b += t.c.width * t.c.height * 4 + (t.mask ? t.mask.length : 0);
    return b;
  }
}

export const textures = new TexCache();
