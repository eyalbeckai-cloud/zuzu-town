import { textures, drawTex, makeCanvas, svgSize, loadSvgImage, type TexSpec } from '../engine/textures';
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, cloudPath, starPath, heartPath, shine } from '../art/kit';
import { Tweens, ease, clamp } from '../engine/tween';
import { Particles } from '../engine/particles';
import { sound } from '../engine/audio';
import type { App, Scene } from './app';
import type { PEvt } from './play';
import { LOC } from './catalog';

interface Bld { id: string; x: number; y: number; key: string; sx: number; sy: number; bob: number; w: number; h: number; target: 'loc' | 'studio' }

const W = 1600;

function roofHouse(body: string, roof: string, w: number, h: number, inner: string) {
  return svg(w, h, inner.replace('{body}', body).replace('{roof}', roof));
}

const BUILD: Record<string, { w: number; h: number; s: () => string }> = {
  home: { w: 250, h: 240, s: () => svg(250, 240,
    R(150, 30, 34, 70, 6, C.red) + R(146, 22, 42, 16, 5, C.redD) +
    P('M10 112 L125 16 L240 112Z', C.rose) + Ps('M40 92 L125 30 L210 92', 4, C.pinkD, 0.6) +
    R(34, 104, 182, 130, 14, C.yellowL) +
    R(56, 128, 52, 46, 8, C.sky, 3.5) + L(82, 128, 82, 174, 4, '#fff') + L(56, 151, 108, 151, 4, '#fff') +
    R(140, 140, 54, 94, 10, C.mint) + Ci(182, 190, 5, C.yellow, 3) +
    `<path d="${heartPath(125, 76, 14)}" fill="#fff" stroke="${C.ol}" stroke-width="3.5"/>` +
    P('M30 234 Q20 210 40 206 Q44 190 60 200 Q74 196 70 214 Q80 226 64 234Z', C.green)) },
  park: { w: 270, h: 230, s: () => svg(270, 230,
    R(124, 120, 22, 106, 6, C.brown) + Ci(135, 84, 66, C.green) + Ci(96, 110, 40, C.greenD) + Ci(176, 106, 42, C.green) + Cf(110, 60, 10, '#fff', 0.3) +
    Ci(90, 96, 7, C.red, 3) + Ci(170, 80, 7, C.red, 3) + Ci(140, 120, 7, C.red, 3) +
    R(8, 150, 6, 76, 3, C.woodD) + R(56, 150, 6, 76, 3, C.woodD) + R(4, 140, 62, 10, 4, C.woodD) +
    Ps('M20 150 V196 M48 150 V196', 3) + R(14, 194, 40, 8, 3, C.yellow, 3) +
    P('M200 226 L214 160 H246 L252 226Z', C.blueL) + R(206, 150, 46, 14, 5, C.blue) + Ps('M220 196 Q236 176 248 200', 3, '#fff')) },
  bakery: { w: 250, h: 250, s: () => svg(250, 250,
    R(24, 64, 202, 180, 14, C.pinkL) +
    P('M14 64 H236 L224 104 H26Z', C.rose) + Ps('M50 64 L46 104 M86 64 L84 104 M124 64 V104 M162 64 L164 104 M200 64 L204 104', 5, '#fff', 0.85) +
    R(44, 124, 82, 64, 10, C.sky, 3.5) + R(146, 140, 56, 104, 10, C.wood) + Ci(192, 192, 5, C.yellow, 3) +
    P('M105 4 Q90 4 92 22 Q76 24 80 40 H170 Q174 24 158 22 Q160 4 145 4 Q138 -2 125 6 Q112 -2 105 4Z', C.pinkL) +
    P('M88 40 H162 L152 62 H98Z', C.yellow) + Ci(125, 4, 0.1, C.red, 0) + Ci(125, 10, 7, C.red, 3)) },
  vet: { w: 250, h: 250, s: () => svg(250, 250,
    R(24, 70, 202, 174, 14, '#ffffff') + P('M12 76 L125 14 L238 76Z', C.mint) +
    R(92, 108, 66, 66, 14, C.red) + Pf('M116 118 H134 V132 H148 V150 H134 V164 H116 V150 H102 V132 H116Z', '#ffffff') +
    R(40, 186, 52, 40, 8, C.sky, 3.5) + R(158, 186, 52, 40, 8, C.sky, 3.5) + R(102, 182, 46, 62, 8, C.mintD) +
    Ci(125, 52, 9, C.ol, 0) + Ci(110, 38, 5, C.ol, 0) + Ci(125, 32, 5, C.ol, 0) + Ci(140, 38, 5, C.ol, 0)) },
  studio: { w: 240, h: 250, s: () => svg(240, 250,
    R(20, 70, 200, 174, 14, C.purpleL) + P('M8 76 Q120 0 232 76Z', C.purple) +
    R(40, 110, 70, 110, 10, C.sky, 3.5) + R(130, 120, 70, 124, 10, C.pink) + Ci(188, 182, 5, C.yellow, 3) +
    Ps('M75 120 Q75 112 80 112 Q85 112 85 117 Q85 121 75 125 L55 142 H95 L75 125', 3.5) + R(58, 142, 34, 40, 8, C.rose, 3) +
    `<path d="${starPath(120, 46, 22)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="4" stroke-linejoin="round"/>`) },
};

function mapBg() {
  let s = '';
  s += Rf(-800, -800, W + 1600, 2400, 0, '#bfe9ff');
  s += Cf(1380, 110, 70, '#fff3b0', 0.8) + Cf(1380, 110, 48, C.yellow);
  s += P(cloudPath(120, 90, 200, 70), '#fff', 3.5) + P(cloudPath(700, 50, 160, 56), '#fff', 3.5) + P(cloudPath(-500, 120, 220, 70), '#fff', 3.5) + P(cloudPath(1800, 80, 200, 64), '#fff', 3.5);
  s += Pf('M-800 420 Q-400 260 0 380 Q400 250 800 370 Q1200 260 1600 360 Q2000 250 2400 380 V1600 H-800Z', '#a7dd86');
  s += Pf('M-800 520 Q-300 420 200 500 Q700 420 1100 500 Q1500 430 2400 510 V1600 H-800Z', '#8fd16a');
  // river
  s += Pf('M-800 860 Q-200 800 300 860 Q800 920 1300 850 Q1800 790 2400 860 V1600 H-800Z', '#7cc4ff');
  s += Ps('M-600 900 Q-300 880 0 905 M600 920 Q900 900 1200 915 M1500 890 Q1800 870 2100 890', 5, '#ffffff', 0.6);
  // roads
  s += Ps('M-800 690 Q200 640 800 690 Q1400 740 2400 680', 76, '#f2dcb3');
  s += Ps('M-800 690 Q200 640 800 690 Q1400 740 2400 680', 6, '#ffffff', 0.7);
  s += `<path d="M-800 690 Q200 640 800 690 Q1400 740 2400 680" fill="none" stroke="#e8c88f" stroke-width="5" stroke-dasharray="26 22"/>`;
  s += Ps('M1020 520 Q1010 600 980 680', 50, '#f2dcb3');
  // trees
  const tree = (x: number, y: number, k = 1) => R(x - 7 * k, y - 10 * k, 14 * k, 34 * k, 4, C.brown, 3.5) + Ci(x, y - 30 * k, 34 * k, C.greenD) + Ci(x - 16 * k, y - 18 * k, 20 * k, C.green) + Cf(x - 10 * k, y - 46 * k, 7 * k, '#fff', 0.3);
  for (const [x, y, k] of [[-300, 560, 1], [-120, 600, 0.8], [520, 560, 0.9], [1180, 560, 1], [1480, 600, 0.9], [1720, 560, 1], [1900, 610, 0.8], [80, 820, 0.9], [1500, 820, 1]] as [number, number, number][]) s += tree(x, y, k);
  // flowers
  for (let i = 0; i < 40; i++) {
    const x = -600 + ((i * 197) % 2800), y = 760 + ((i * 53) % 70);
    s += Cf(x, y, 6, [C.pink, C.yellow, '#fff', C.purpleL][i % 4]) + Cf(x, y, 2.5, C.orange);
  }
  return s;
}

export class MapScene implements Scene {
  kind = 'map' as const;
  app: App;
  camX = 0;
  tiles: { c: HTMLCanvasElement; x: number; y: number; w: number; h: number }[] = [];
  blds: Bld[] = [];
  tweens = new Tweens();
  fx = new Particles();
  t = 0;
  down_: { b: Bld | null; id: number } | null = null;

  constructor(app: App) { this.app = app; }

  specs(): TexSpec[] {
    return Object.entries(BUILD).map(([k, v]) => ({ key: 'map:' + k, svg: v.s, w: v.w, h: v.h, outline: 6 }));
  }

  async enter(onProgress?: (k: number) => void) {
    const st = this.app.stage;
    this.camX = st.centerCam(W);
    await textures.loadAll(this.specs(), (k) => onProgress?.(k * 0.5));
    await this.buildBg();
    const mk = (id: string, x: number, y: number, target: 'loc' | 'studio'): Bld => ({ id, x, y, key: 'map:' + id, sx: 1, sy: 1, bob: Math.random() * 6, w: BUILD[id].w, h: BUILD[id].h, target });
    this.blds = [
      mk('home', 250, 660, 'loc'),
      mk('park', 600, 610, 'loc'),
      mk('studio', 1020, 520, 'studio'),
      mk('bakery', 900, 760, 'loc'),
      mk('vet', 1320, 690, 'loc'),
    ];
    onProgress?.(1);
    sound.setMusic('park', 9);
  }

  async buildBg() {
    const st = this.app.stage;
    const ppu = Math.min(st.ppu, 2.2);
    const x0 = Math.min(0, this.camX) - 4, x1 = Math.max(W, this.camX + st.view.w) + 4;
    const tileW = Math.max(200, Math.floor(1600 / ppu));
    const body = mapBg();
    this.tiles = [];
    for (let x = x0; x < x1; x += tileW) {
      const w = Math.min(tileW, x1 - x);
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${st.view.y} ${w} ${st.view.h}">${body}</svg>`;
      const img = await loadSvgImage(svgSize(s, w * ppu, st.view.h * ppu));
      const c = makeCanvas(w * ppu, st.view.h * ppu);
      c.g.drawImage(img, 0, 0, Math.ceil(w * ppu), Math.ceil(st.view.h * ppu));
      this.tiles.push({ c: c.c, x, y: st.view.y, w, h: st.view.h });
    }
  }

  async onResize() {
    this.camX = this.app.stage.centerCam(W);
    await textures.loadAll(this.specs());
    await this.buildBg();
  }

  exit() { this.tiles = []; }

  update(dt: number) {
    this.t += dt;
    this.tweens.update(dt);
    this.fx.update(dt);
  }

  draw(g: CanvasRenderingContext2D) {
    const st = this.app.stage;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#bfe9ff';
    g.fillRect(0, 0, st.canvas.width, st.canvas.height);
    st.worldTransform(this.camX);
    for (const t of this.tiles) g.drawImage(t.c, t.x, t.y, t.w + 0.6, t.h);
    // car driving on the road
    const k = (this.t * 0.06) % 1;
    const cx = -200 + k * 2000;
    const cy = 690 + Math.sin((cx + 800) / 3200 * Math.PI * 2) * 22 - 26;
    g.save();
    g.translate(cx, cy + Math.sin(this.t * 14) * 1.5);
    g.fillStyle = '#ff6b9a'; g.strokeStyle = '#45365a'; g.lineWidth = 4;
    g.beginPath(); g.roundRect(-44, -26, 88, 30, 12); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-24, -46, 50, 26, 10); g.fill(); g.stroke();
    g.fillStyle = '#dff3ff'; g.beginPath(); g.roundRect(-16, -40, 34, 16, 5); g.fill();
    g.fillStyle = '#45365a';
    g.beginPath(); g.arc(-24, 6, 11, 0, Math.PI * 2); g.arc(24, 6, 11, 0, Math.PI * 2); g.fill();
    g.restore();
    const sorted = [...this.blds].sort((a, b) => a.y - b.y);
    for (const b of sorted) {
      const tex = textures.get(b.key);
      if (!tex) continue;
      const locked = b.target === 'loc' && this.app.isLocked(b.id);
      g.save();
      g.translate(b.x, b.y + Math.sin(this.t * 2 + b.bob) * 3);
      g.scale(b.sx, b.sy);
      drawTex(g, tex);
      g.restore();
      if (locked) {
        const lt = textures.get('ui:lock');
        if (lt) { g.save(); g.translate(b.x + b.w * 0.32, b.y - b.h * 0.78); g.rotate(Math.sin(this.t * 3) * 0.08); drawTex(g, lt); g.restore(); }
      } else {
        // name tag
      }
    }
    this.fx.draw(g);
  }

  hitB(wx: number, wy: number): Bld | null {
    const sorted = [...this.blds].sort((a, b) => b.y - a.y);
    for (const b of sorted) {
      if (wx > b.x - b.w / 2 - 10 && wx < b.x + b.w / 2 + 10 && wy > b.y - b.h - 10 && wy < b.y + 10) return b;
    }
    return null;
  }

  down(p: PEvt) { this.down_ = { b: this.hitB(p.wx, p.wy), id: p.id }; if (this.down_.b) { const b = this.down_.b; this.tweens.to(b, { sx: 0.94, sy: 0.94 }, 0.08); } return true; }
  move(_p: PEvt) {}
  up(p: PEvt) {
    const d = this.down_;
    this.down_ = null;
    if (!d || !d.b) return;
    const b = d.b;
    this.tweens.to(b, { sx: 1.08, sy: 0.92 }, 0.08, ease.outQuad, () => this.tweens.to(b, { sx: 1, sy: 1 }, 0.4, ease.outElastic));
    if (this.hitB(p.wx, p.wy) !== b) return;
    sound.play('pop');
    this.fx.emit('sparkle', b.x, b.y - b.h * 0.6, 8);
    if (b.target === 'studio') { this.app.openStudio(); return; }
    if (this.app.isLocked(b.id)) { sound.play('lock'); this.app.overlay.openStore(b.id); return; }
    if (LOC.has(b.id)) this.app.goto(b.id);
  }
}

export { clamp, Ef, El, G, L, shine };
