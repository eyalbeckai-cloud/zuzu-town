import '../ui/styles.css';
import { rasterize, drawTex } from '../engine/textures';
import { bodyArt, headArt, charMetrics, drawFace, petArt, drawPetEyes, type Look } from '../art/characters';
import { ROSTER } from '../game/catalog';

const q = new URLSearchParams(location.search);
const kind = q.get('b') || 'icon';

const SIZES: Record<string, [number, number]> = {
  icon: [1024, 1024], fg: [1024, 1024], bg: [1024, 1024], splash: [2732, 2732],
  'feature-en': [1024, 500], 'feature-he': [1024, 500], playicon: [512, 512],
};

async function head(look: Look, k: number) {
  const a = headArt(look);
  return rasterize({ key: 'h', svg: () => a.svg, w: a.w, h: a.h, ax: a.ax, ay: a.ay, outline: 6 }, k);
}
async function body(look: Look, k: number) {
  const a = bodyArt(look, 'stand');
  return rasterize({ key: 'b', svg: () => a.svg, w: a.w, h: a.h, ax: a.ax, ay: a.ay, outline: 5 }, k);
}

function grad(g: CanvasRenderingContext2D, w: number, h: number) {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#ffc2da');
  gr.addColorStop(1, '#ffe7a3');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  // soft dots
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = 0; y < h; y += w / 9) for (let x = (y / (w / 9)) % 2 ? w / 18 : 0; x < w; x += w / 9) { g.beginPath(); g.arc(x, y, w / 70, 0, Math.PI * 2); g.fill(); }
}

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
  g.fillStyle = c; g.strokeStyle = '#45365a'; g.lineWidth = r * 0.16; g.lineJoin = 'round';
  g.fill(); g.stroke();
}

async function drawHeadAt(g: CanvasRenderingContext2D, look: Look, x: number, y: number, scale: number, mouth: 'smile' | 'grin' = 'grin') {
  const t = await head(look, scale);
  const m = charMetrics(look, 'stand');
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  drawTex(g, t);
  drawFace(g, m.headR, look.size, look.skin, { eyes: 'open', mouth, lx: 0, ly: 0.1, blink: 0 });
  g.restore();
}

async function drawCharAt(g: CanvasRenderingContext2D, look: Look, x: number, y: number, scale: number, mouth: 'smile' | 'grin' = 'grin') {
  const b = await body(look, scale);
  const h = await head(look, scale);
  const m = charMetrics(look, 'stand');
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  drawTex(g, b);
  g.translate(m.headX, m.headY);
  drawTex(g, h);
  drawFace(g, m.headR, look.size, look.skin, { eyes: 'open', mouth, lx: 0, ly: 0, blink: 0 });
  g.restore();
}

function title(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  g.save();
  g.font = `800 ${size}px Rubik, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.32;
  g.strokeStyle = '#45365a';
  g.strokeText(text, x, y);
  g.lineWidth = size * 0.18;
  g.strokeStyle = '#ffffff';
  g.strokeText(text, x, y);
  const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  gr.addColorStop(0, '#ff6b9a');
  gr.addColorStop(1, '#ff9a5c');
  g.fillStyle = gr;
  g.fillText(text, x, y);
  g.restore();
}

(async () => {
  await (document as any).fonts.load('800 80px Rubik');
  const [W, H] = SIZES[kind];
  const cv = document.getElementById('c') as HTMLCanvasElement;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  const noa = ROSTER.noa;
  if (kind === 'icon' || kind === 'playicon') {
    grad(g, W, H);
    const k = W / 1024;
    await drawHeadAt(g, noa, W * 0.5, H * 0.54, 5.6 * k);
    star(g, W * 0.82, H * 0.2, 60 * k, '#ffd866');
    star(g, W * 0.17, H * 0.78, 40 * k, '#80dcc1');
  } else if (kind === 'fg') {
    await drawHeadAt(g, noa, W * 0.5, H * 0.53, 3.7);
  } else if (kind === 'bg') {
    grad(g, W, H);
  } else if (kind === 'splash') {
    g.fillStyle = '#ffe3ef';
    g.fillRect(0, 0, W, H);
    await drawHeadAt(g, noa, W * 0.5, H * 0.45, 5);
    title(g, 'Zuzu Town', W * 0.5, H * 0.66, 190);
  } else if (kind.startsWith('feature')) {
    grad(g, W, H);
    const he = kind.endsWith('he');
    await drawCharAt(g, ROSTER.ben, 86, 478, 1.12);
    await drawCharAt(g, ROSTER.noa, 196, 488, 1.16);
    await drawCharAt(g, ROSTER.tamar, 944, 488, 1.16);
    const p = petArt('cat', 0);
    const pt = await rasterize({ key: 'p', svg: () => p.svg, w: p.w, h: p.h, ax: p.ax, ay: p.ay, outline: 5 }, 1.3);
    g.save(); g.translate(834, 490); g.scale(1.1, 1.1); drawTex(g, pt); drawPetEyes(g, p, false, 0, 0, 0); g.restore();
    title(g, he ? 'זוזו טאון' : 'Zuzu Town', 520, 200, he ? 104 : 96);
    g.save();
    g.font = `700 30px Rubik, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const sub = he ? 'משחק דמיון לילדים, בלי פרסומות' : 'Pretend play for kids. No ads.';
    const tw = g.measureText(sub).width + 50;
    g.beginPath(); g.roundRect(520 - tw / 2, 300, tw, 52, 26); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#45365a'; g.stroke();
    g.fillStyle = '#45365a';
    g.fillText(sub, 520, 327);
    g.restore();
    star(g, 690, 86, 30, '#ffd866');
    star(g, 360, 110, 20, '#80dcc1');
  }
  (window as any).__done = true;
})();
