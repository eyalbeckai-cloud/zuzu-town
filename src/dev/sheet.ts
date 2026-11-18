import { rasterize, drawTex, Tex } from '../engine/textures';
import { bodyArt, headArt, charMetrics, drawFace, Look, petArt, drawPetEyes, PetKind } from '../art/characters';

const params = new URLSearchParams(location.search);
const which = params.get('s') || 'chars';
const ppu = Number(params.get('ppu') || 1);

async function tex(a: { svg: string; w: number; h: number; ax: number; ay: number }, outline = 5) {
  return rasterize({ key: Math.random() + '', svg: () => a.svg, w: a.w, h: a.h, ax: a.ax, ay: a.ay, outline }, ppu);
}

async function chars() {
  const cv = document.getElementById('c') as HTMLCanvasElement;
  cv.width = 1600 * ppu; cv.height = 900 * ppu;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#fff1c9'; g.fillRect(0, 0, cv.width, cv.height);
  g.scale(ppu, ppu);
  const looks: Look[] = [
    { size: 'kid', skin: 1, hair: 3, hairColor: 1, top: 1, topColor: 0, pattern: 2, bottom: 0, bottomColor: 5, shoes: 10, acc: 2 },
    { size: 'kid', skin: 4, hair: 4, hairColor: 0, top: 2, topColor: 3, pattern: 0, bottom: 0, bottomColor: 6, shoes: 0, acc: 0 },
    { size: 'kid', skin: 2, hair: 6, hairColor: 4, top: 0, topColor: 5, pattern: 1, bottom: 1, bottomColor: 9, shoes: 2, acc: 1 },
    { size: 'kid', skin: 0, hair: 2, hairColor: 3, top: 4, topColor: 7, pattern: 3, bottom: 2, bottomColor: 0, shoes: 5, acc: 3 },
    { size: 'adult', skin: 3, hair: 5, hairColor: 0, top: 4, topColor: 4, pattern: 1, bottom: 0, bottomColor: 6, shoes: 9, acc: 4 },
    { size: 'adult', skin: 1, hair: 0, hairColor: 2, top: 3, topColor: 8, pattern: 0, bottom: 0, bottomColor: 5, shoes: 11, acc: 0 },
    { size: 'adult', skin: 0, hair: 9, hairColor: 8, top: 0, topColor: 10, pattern: 4, bottom: 0, bottomColor: 11, shoes: 9, acc: 1 },
    { size: 'baby', skin: 2, hair: 8, hairColor: 1, top: 3, topColor: 2, pattern: 0, bottom: 0, bottomColor: 4, shoes: 8, acc: 0 },
  ];
  let x = 110;
  for (const [i, lk] of looks.entries()) {
    for (const pose of ['stand', 'sit'] as const) {
      const b = await tex(bodyArt(lk, pose));
      const h = await tex(headArt(lk));
      const m = charMetrics(lk, pose);
      const bx = x + (pose === 'sit' ? 0 : 0), by = pose === 'stand' ? 420 : 760;
      g.save(); g.translate(bx, by); drawTex(g, b);
      g.translate(m.headX, m.headY); drawTex(g, h);
      drawFace(g, m.headR, lk.size, lk.skin, { eyes: i % 3 === 2 ? 'happy' : 'open', mouth: (['smile', 'grin', 'open', 'o', 'chew', 'smile', 'tongue', 'smile'] as const)[i], lx: 0, ly: 0, blink: 0 });
      g.restore();
      g.fillStyle = 'red'; g.fillRect(bx - 3, by - 3, 6, 6);
    }
    x += 190;
  }
}

async function pets() {
  const cv = document.getElementById('c') as HTMLCanvasElement;
  cv.width = 1600 * ppu; cv.height = 900 * ppu;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#e8f7ff'; g.fillRect(0, 0, cv.width, cv.height);
  g.scale(ppu, ppu);
  const kinds: PetKind[] = ['cat', 'dog', 'bunny', 'hamster'];
  for (const [i, k] of kinds.entries()) {
    for (let c = 0; c < 4; c++) {
      const a = petArt(k, c);
      const t = await tex(a);
      const x = 150 + c * 200, y = 200 + i * 190;
      g.save(); g.translate(x, y); drawTex(g, t); drawPetEyes(g, a, false, 0, 0, 0); g.restore();
    }
  }
}

(async () => {
  try {
    if (which === 'chars') await chars();
    if (which === 'pets') await pets();
    const mod: any = await import('./sheet_extra');
    if (mod[which]) await mod[which](ppu);
  } catch (e) { console.error(e); }
  (window as any).__done = true;
})();
