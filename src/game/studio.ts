import { textures, drawTex, makeCanvas, svgSize, loadSvgImage } from '../engine/textures';
import { C, svg, R, Ci, El, P, Pf, Ps, Rf, Cf, starPath, heartPath, dots } from '../art/kit';
import { Tweens, ease, pick, randi } from '../engine/tween';
import { Particles } from '../engine/particles';
import { sound } from '../engine/audio';
import type { App, Scene } from './app';
import type { PEvt } from './play';
import { CharActor, charSpecs } from './actors';
import { SKIN, HAIR, CLOTH, headArt, bodyArt, HAIR_STYLES, TOPS, PATTERNS, BOTTOMS, ACCS, type Look } from '../art/characters';
import type { Ent } from './types';
import { t } from '../i18n';
import { LOC } from './catalog';

const W = 1600;

type Cat = 'skin' | 'hair' | 'hairColor' | 'top' | 'topColor' | 'pattern' | 'bottom' | 'bottomColor' | 'shoes' | 'acc';
const CATS: Cat[] = ['skin', 'hair', 'hairColor', 'top', 'topColor', 'pattern', 'bottom', 'bottomColor', 'shoes', 'acc'];
const COUNTS: Record<Cat, number> = {
  skin: SKIN.length, hair: HAIR_STYLES, hairColor: HAIR.length, top: TOPS, topColor: CLOTH.length,
  pattern: PATTERNS, bottom: BOTTOMS, bottomColor: CLOTH.length, shoes: CLOTH.length, acc: ACCS,
};

const TAB_ICON: Record<Cat, string> = {
  skin: svg(60, 60, Ci(30, 30, 22, SKIN[2]) + Cf(23, 28, 3, C.ol) + Cf(37, 28, 3, C.ol) + Ps('M23 37 Q30 42 37 37', 3)),
  hair: svg(60, 60, Ci(30, 34, 18, SKIN[1]) + P('M12 34 C10 6 50 6 48 34 Q40 22 30 24 Q20 22 12 34Z', HAIR[1])),
  hairColor: svg(60, 60, P('M30 6 Q48 30 46 40 Q44 54 30 54 Q16 54 14 40 Q12 30 30 6Z', HAIR[5])),
  top: svg(60, 60, P('M18 12 L8 22 L14 30 L20 26 V50 H40 V26 L46 30 L52 22 L42 12 Q30 20 18 12Z', CLOTH[5])),
  topColor: svg(60, 60, Ci(20, 22, 10, CLOTH[0]) + Ci(40, 22, 10, CLOTH[2]) + Ci(30, 40, 10, CLOTH[4])),
  pattern: svg(60, 60, R(10, 10, 40, 40, 10, CLOTH[7]) + Cf(22, 22, 4, '#fff') + Cf(38, 22, 4, '#fff') + Cf(30, 34, 4, '#fff') + Cf(22, 44, 3, '#fff') + Cf(38, 44, 3, '#fff')),
  bottom: svg(60, 60, P('M16 10 H44 L48 52 H34 L30 28 L26 52 H12Z', CLOTH[6])),
  bottomColor: svg(60, 60, Ci(20, 22, 10, CLOTH[6]) + Ci(40, 22, 10, CLOTH[3]) + Ci(30, 40, 10, CLOTH[9])),
  shoes: svg(60, 60, P('M8 40 Q8 26 22 28 L30 34 Q52 34 52 44 V48 H8Z', CLOTH[10]) + Rf(8, 44, 44, 4, 2, '#fff', 0.7)),
  acc: svg(60, 60, P(`M30 30 L12 18 L14 42Z`, C.rose, 3.5) + P(`M30 30 L48 18 L46 42Z`, C.rose, 3.5) + Ci(30, 30, 6, C.pinkD, 3)),
};

function studioBg() {
  let s = '';
  s += Rf(-800, -800, W + 1600, 2400, 0, '#f1e8ff');
  s += dots(-800, -800, W + 1600, 1440, '#d9c8ff', 60, 7, 0.55);
  s += Rf(-800, 640, W + 1600, 1000, 0, '#ffd6e6');
  s += Rf(-800, 630, W + 1600, 14, 0, '#ffffff');
  // mirror
  s += El(430, 330, 200, 270, C.yellow, 5) + El(430, 330, 178, 248, '#e8f6ff', 4) + Pf('M330 200 L420 120 L450 140 L350 230Z', '#ffffff', 0.6) + Pf('M360 300 L470 200 L480 215 L372 316Z', '#ffffff', 0.5);
  s += El(430, 830, 260, 50, C.purpleL, 4) + El(430, 830, 210, 36, '#ffffff', 0) + El(430, 826, 200, 32, C.purple, 4);
  // lights
  for (let i = 0; i < 9; i++) {
    const x = -200 + i * 230;
    s += Ps(`M${x} -10 Q${x + 115} 40 ${x + 230} -10`, 3, C.greyDD) + Ci(x + 115, 30, 11, [C.yellow, C.pink, C.mint][i % 3], 3);
  }
  // clothes rack
  s += Ps('M1100 140 H1560', 8, C.greyDD) + Ps('M1100 140 V640 M1560 140 V640', 8, C.greyDD);
  const shirt = (x: number, c: string) => Ps(`M${x} 140 V160`, 3) + P(`M${x - 34} 168 L${x - 50} 186 L${x - 40} 200 L${x - 30} 194 V250 H${x + 30} V194 L${x + 40} 200 L${x + 50} 186 L${x + 34} 168 Q${x} 180 ${x - 34} 168Z`, c);
  s += shirt(1170, C.pink) + shirt(1270, C.mint) + shirt(1370, C.yellow) + shirt(1470, C.blue);
  s += `<path d="${starPath(1300, 80, 26)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="4" stroke-linejoin="round"/>` + `<path d="${heartPath(1460, 84, 20)}" fill="${C.rose}" stroke="${C.ol}" stroke-width="4"/>`;
  return s;
}

const imgCache = new Map<string, string>();
function dataUrl(svgStr: string) {
  let u = imgCache.get(svgStr);
  if (!u) { u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr); imgCache.set(svgStr, u); }
  return u;
}

export class StudioScene implements Scene {
  kind = 'studio' as const;
  app: App;
  camX = 0;
  tiles: { c: HTMLCanvasElement; x: number; y: number; w: number; h: number }[] = [];
  chars: Ent[] = [];
  sel = 0;
  cat: Cat = 'hair';
  actor: CharActor | null = null;
  tweens = new Tweens();
  fx = new Particles();
  time = 0;
  panel: HTMLDivElement | null = null;
  bounce = { y: 0, s: 1 };

  constructor(app: App) { this.app = app; }

  async enter(onProgress?: (k: number) => void) {
    const st = this.app.stage;
    this.camX = st.centerCam(W);
    const w = this.app.world;
    const home = LOC.get('home');
    if (home) w.ensureLocation(home);
    this.chars = [...w.ents.values()].filter((e) => e.def === 'char');
    this.chars.sort((a, b) => (a.loc === w.current ? -1 : 0) - (b.loc === w.current ? -1 : 0));
    await this.buildBg();
    onProgress?.(0.5);
    await this.select(0);
    onProgress?.(1);
    this.buildPanel();
    sound.setMusic('shop', 21);
  }

  async buildBg() {
    const st = this.app.stage;
    const ppu = Math.min(st.ppu, 2.2);
    const x0 = Math.min(0, this.camX) - 4, x1 = Math.max(W, this.camX + st.view.w) + 4;
    const tileW = Math.max(200, Math.floor(1600 / ppu));
    const body = studioBg();
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
    await this.buildBg();
    if (this.actor) await textures.loadAll(this.actor.specs());
    this.buildPanel();
  }

  exit() {
    this.panel?.remove();
    this.panel = null;
    this.tiles = [];
  }

  async select(i: number) {
    if (!this.chars.length) return;
    this.sel = (i + this.chars.length) % this.chars.length;
    const e = this.chars[this.sel];
    const a = new CharActor(e);
    await textures.loadAll(a.specs());
    this.actor = a;
    this.refreshPanel();
  }

  async change(cat: Cat, v: number) {
    const e = this.chars[this.sel];
    if (!e?.look) return;
    const look: Look = { ...e.look, [cat]: v };
    await textures.loadAll(charSpecs(look));
    e.look = look;
    this.app.world.touch();
    this.app.markDirty();
    if (this.actor) { this.actor.e = e; this.actor.refreshLook(); this.actor.setMood('happy', 1.2); }
    this.pop();
    this.refreshPanel();
  }

  async randomize() {
    const e = this.chars[this.sel];
    if (!e?.look) return;
    const look: Look = { ...e.look };
    for (const c of CATS) (look as any)[c] = randi(0, COUNTS[c] - 1);
    if (look.size !== 'baby' && look.hair === 8) look.hair = 0;
    await textures.loadAll(charSpecs(look));
    e.look = look;
    this.app.world.touch();
    if (this.actor) { this.actor.refreshLook(); this.actor.setMood('happy', 1.5); }
    this.pop();
    sound.play('sparkle');
    this.refreshPanel();
  }

  pop() {
    this.bounce.s = 1.12;
    this.tweens.to(this.bounce, { s: 1 }, 0.5, ease.outElastic);
    this.fx.emit('sparkle', 430, 400, 10);
    this.fx.emit('star', 430, 300, 3, { color: pick(['#ffd866', '#ff9ec4', '#80dcc1']) });
    sound.play('pop', 1.1);
  }

  // ---------------------------------------------------------------- DOM panel
  buildPanel() {
    this.panel?.remove();
    const ui = document.getElementById('ui')!;
    const p = document.createElement('div');
    p.className = 'studio';
    p.innerHTML = `
      <div class="st-chars"></div>
      <div class="st-tabs"></div>
      <div class="st-opts"></div>
      <div class="st-bottom">
        <button class="st-btn st-dice" aria-label="random"></button>
        <button class="st-btn st-done" aria-label="done"></button>
      </div>`;
    ui.appendChild(p);
    this.panel = p;
    p.querySelector('.st-dice')!.innerHTML = `<img src="${dataUrl(svg(100, 100, Ci(50, 50, 46, C.purple) + R(26, 26, 48, 48, 12, '#fff') + Cf(39, 39, 5, C.ol) + Cf(61, 61, 5, C.ol) + Cf(50, 50, 5, C.ol) + Cf(61, 39, 5, C.ol) + Cf(39, 61, 5, C.ol)))}" alt="">`;
    p.querySelector('.st-done')!.innerHTML = `<img src="${dataUrl(svg(100, 100, Ci(50, 50, 46, C.green) + Ps('M30 50 L44 64 L72 34', 12) + Ps('M30 50 L44 64 L72 34', 6, '#fff')))}" alt="">`;
    (p.querySelector('.st-dice') as HTMLElement).onclick = () => this.randomize();
    (p.querySelector('.st-done') as HTMLElement).onclick = () => { sound.play('pop'); this.app.goto(this.app.world.current || 'home'); };
    const tabs = p.querySelector('.st-tabs')!;
    for (const c of CATS) {
      const b = document.createElement('button');
      b.className = 'st-tab' + (c === this.cat ? ' on' : '');
      b.innerHTML = `<img src="${dataUrl(TAB_ICON[c])}" alt="${t('studio.' + c)}">`;
      b.onclick = () => { this.cat = c; sound.play('click'); this.refreshPanel(); };
      tabs.appendChild(b);
    }
    this.refreshPanel();
  }

  refreshPanel() {
    const p = this.panel;
    if (!p) return;
    const e = this.chars[this.sel];
    const chars = p.querySelector('.st-chars')!;
    chars.innerHTML = '';
    this.chars.forEach((c, i) => {
      if (!c.look) return;
      const b = document.createElement('button');
      b.className = 'st-char' + (i === this.sel ? ' on' : '');
      b.innerHTML = `<img src="${dataUrl(headArt(c.look).svg)}" alt="">`;
      b.onclick = () => { sound.play('click'); this.select(i); };
      chars.appendChild(b);
    });
    p.querySelectorAll('.st-tab').forEach((el, i) => el.classList.toggle('on', CATS[i] === this.cat));
    const opts = p.querySelector('.st-opts')!;
    opts.innerHTML = '';
    if (!e?.look) return;
    const look = e.look;
    const cur = (look as any)[this.cat] as number;
    for (let v = 0; v < COUNTS[this.cat]; v++) {
      if (this.cat === 'hair' && v === 8 && look.size !== 'baby') continue;
      const b = document.createElement('button');
      b.className = 'st-opt' + (v === cur ? ' on' : '');
      b.innerHTML = `<img src="${dataUrl(this.optArt(look, this.cat, v))}" alt="">`;
      b.onclick = () => this.change(this.cat, v);
      opts.appendChild(b);
    }
  }

  optArt(look: Look, cat: Cat, v: number): string {
    const sw = (col: string) => svg(80, 80, Ci(40, 40, 32, col) + Pf('M22 30 Q28 18 40 16', '#fff', 0) + Ps('M24 30 Q30 20 42 18', 5, '#fff', 0.5));
    switch (cat) {
      case 'skin': return sw(SKIN[v]);
      case 'hairColor': return sw(HAIR[v]);
      case 'topColor': case 'bottomColor': case 'shoes': return sw(CLOTH[v]);
      case 'hair': case 'acc': {
        const a = headArt({ ...look, [cat]: v });
        const r = (look.size === 'baby' ? 50 : look.size === 'kid' ? 56 : 55);
        const face = `<g transform="translate(${a.ax} ${a.ay})"><ellipse cx="${-r * 0.36}" cy="${r * 0.06}" rx="${r * 0.11}" ry="${r * 0.14}" fill="#3a2a48"/><ellipse cx="${r * 0.36}" cy="${r * 0.06}" rx="${r * 0.11}" ry="${r * 0.14}" fill="#3a2a48"/><path d="M${-r * 0.17} ${r * 0.41} Q0 ${r * 0.55} ${r * 0.17} ${r * 0.41}" fill="none" stroke="#45365a" stroke-width="${r * 0.065}" stroke-linecap="round"/></g>`;
        return a.svg.replace('</svg>', face + '</svg>');
      }
      case 'top': case 'pattern': case 'bottom': {
        const a = bodyArt({ ...look, [cat]: v, size: look.size === 'baby' ? 'kid' : look.size }, 'stand');
        return a.svg;
      }
    }
  }

  // ---------------------------------------------------------------- loop
  update(dt: number) {
    this.time += dt;
    this.tweens.update(dt);
    this.fx.update(dt);
    this.actor?.update(dt);
  }

  draw(g: CanvasRenderingContext2D) {
    const st = this.app.stage;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#f1e8ff';
    g.fillRect(0, 0, st.canvas.width, st.canvas.height);
    st.worldTransform(this.camX);
    for (const t of this.tiles) g.drawImage(t.c, t.x, t.y, t.w + 0.6, t.h);
    const a = this.actor;
    if (a) {
      const k = a.look.size === 'adult' ? 1.45 : a.look.size === 'baby' ? 2.1 : 1.75;
      g.save();
      g.translate(430, 830);
      g.scale(k * this.bounce.s, k * (2 - this.bounce.s));
      a.x = 0; a.y = 0;
      a.drawBody(g);
      g.restore();
    }
    this.fx.draw(g);
  }

  down(p: PEvt) {
    // tap the character to make them giggle
    if (this.actor && Math.abs(p.wx - 430) < 170 && p.wy > 250 && p.wy < 840) {
      this.actor.setMood('giggle', 0.9);
      sound.play('giggle');
      this.pop();
    }
    return true;
  }
  move(_p: PEvt) {}
  up(_p: PEvt) {}
}
