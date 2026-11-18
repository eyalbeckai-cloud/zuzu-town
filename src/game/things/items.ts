// Small draggable items. Art is original, drawn with the SVG kit.
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, starPath, heartPath, shine, shade, dots } from '../../art/kit';
import type { ThingDef, ArtDef } from '../types';

let maskN = 0;
/** cut bite marks out of an item. bitesTaken 0..2 */
function bitten(w: number, h: number, body: string, taken: number, mode: 'corner' | 'end' = 'corner') {
  if (!taken) return svg(w, h, body);
  const id = 'bm' + (maskN++).toString(36);
  const r = Math.min(w, h) * (mode === 'end' ? 0.42 : 0.3);
  const holes: [number, number][] = mode === 'end'
    ? [[w * 1.0, h * 0.5], [w * 0.8, h * 0.45]]
    : [[w * 0.9, h * 0.22], [w * 0.98, h * 0.58]];
  let m = '';
  for (let i = 0; i < taken; i++) {
    const [x, y] = holes[i];
    m += `<circle cx="${x}" cy="${y}" r="${r}" fill="#000"/><circle cx="${x - r * 0.9}" cy="${y + r * 0.45}" r="${r * 0.45}" fill="#000"/><circle cx="${x - r * 0.75}" cy="${y - r * 0.6}" r="${r * 0.42}" fill="#000"/>`;
  }
  return svg(w, h, `<defs><mask id="${id}"><rect x="-10" y="-10" width="${w + 20}" height="${h + 20}" fill="#fff"/>${m}</mask></defs><g mask="url(#${id})">${body}</g>`);
}

function food(id: string, w: number, h: number, body: () => string, mode: 'corner' | 'end' = 'corner', extra: Partial<ThingDef> = {}): ThingDef {
  const art: ArtDef = { w, h, variants: ['b3', 'b2', 'b1'], art: (v) => bitten(w, h, body(), v === 'b3' ? 0 : v === 'b2' ? 1 : 2, mode) };
  return {
    id, tags: ['item', 'food', 'small'], art, bites: 3,
    variant: (s) => 'b' + Math.max(1, Math.min(3, s.bites ?? 3)),
    ...extra,
  };
}

function plain(id: string, tags: ThingDef['tags'], w: number, h: number, body: () => string, extra: Partial<ThingDef> = {}): ThingDef {
  return { id, tags, art: { w, h, art: () => svg(w, h, body()) }, ...extra };
}

export const ITEMS: ThingDef[] = [
  food('apple', 52, 58, () =>
    P('M26 18 C10 8 2 22 4 34 C6 50 18 56 26 52 C34 56 46 50 48 34 C50 22 42 8 26 18Z', C.red) +
    Ps('M26 18 Q27 10 31 5', 4, C.brownD) + P('M30 12 Q40 4 44 12 Q36 16 30 12Z', C.green, 3) +
    shine(11, 24, 8, 14, 4, 0.5)),
  food('banana', 76, 44, () =>
    P('M6 10 Q4 34 30 38 Q58 40 72 22 Q60 30 34 28 Q14 26 12 8Z', C.yellow) +
    Ps('M12 14 Q16 28 38 31', 3, C.yellowD) + R(4, 4, 8, 9, 3, C.brownD, 3), 'end'),
  food('sandwich', 74, 54, () =>
    P('M6 30 Q37 8 68 30 L68 38 Q37 20 6 38Z', '#f5d08b') +
    P('M4 36 Q20 30 37 36 Q54 30 70 36 L70 42 H4Z', C.green, 3) +
    R(5, 38, 64, 8, 3, C.red, 3) + R(4, 44, 66, 8, 4, '#f5d08b', 3.5) +
    P('M6 20 Q37 -2 68 20 L68 28 Q37 10 6 28Z', '#f8dfa8')),
  food('cupcake', 56, 66, () =>
    P('M10 34 L16 62 H40 L46 34Z', C.blueL) + Ps('M20 36 L22 60 M28 36 V60 M36 36 L34 60', 3, C.blueD) +
    P('M6 36 Q4 18 18 18 Q20 6 30 8 Q42 6 42 18 Q54 20 50 36Z', C.pinkL) + Ci(28, 8, 6, C.red, 3) +
    Cf(18, 28, 2.5, C.yellow) + Cf(34, 24, 2.5, C.blue) + Cf(26, 30, 2.5, C.mint) + Cf(40, 30, 2.5, C.yellow)),
  food('cookie', 48, 48, () =>
    Ci(24, 24, 20, '#e5ad6a') + Cf(16, 18, 4, C.brownD) + Cf(30, 14, 3.5, C.brownD) + Cf(28, 30, 4, C.brownD) + Cf(14, 31, 3, C.brownD) + shine(12, 8, 10, 5, 3, 0.4)),
  food('carrot', 76, 32, () =>
    P('M14 8 Q60 10 70 16 Q60 22 14 26 Q8 17 14 8Z', C.orange) + Ps('M28 12 L30 16 M42 18 L44 22 M52 13 L54 16', 3, C.orangeD) +
    P('M14 12 Q2 2 4 10 Q0 16 14 17 Q2 24 6 28 Q12 26 14 22Z', C.green, 3), 'end'),
  food('cheese', 60, 44, () =>
    P('M4 40 L4 24 L56 6 L56 40Z', C.yellow) + P('M4 24 L56 6 L56 14 L4 30Z', '#ffe58f', 3) + Cf(18, 34, 4, C.yellowD) + Cf(38, 28, 5, C.yellowD) + Cf(48, 36, 3, C.yellowD)),
  food('pizza', 62, 66, () =>
    P('M6 10 Q31 2 56 10 L31 62Z', '#f7c66b') + P('M9 14 Q31 7 53 14 L31 56Z', '#ff8a5c', 0) +
    Ci(24, 22, 5, C.redD, 3) + Ci(38, 24, 5, C.redD, 3) + Ci(31, 38, 5, C.redD, 3) + P('M6 10 Q31 2 56 10 Q31 -2 6 10Z', '#e8a94f', 4)),
  food('watermelon', 74, 46, () =>
    P('M4 8 Q37 70 70 8Z', C.green) + P('M10 10 Q37 58 64 10Z', '#ffffff', 0) + P('M13 10 Q37 52 61 10Z', C.red, 0) +
    Ps('M4 8 H70', 4) + Ef(26, 18, 2.5, 4, C.ol) + Ef(37, 26, 2.5, 4, C.ol) + Ef(48, 18, 2.5, 4, C.ol)),
  food('friedEgg', 66, 42, () =>
    P('M8 24 Q4 8 22 10 Q32 0 46 8 Q62 6 60 22 Q66 36 48 36 Q34 44 20 36 Q4 38 8 24Z', '#ffffff') + Ci(32, 22, 10, C.yellow, 3.5) + Cf(29, 19, 3, '#fff', 0.7)),
  food('bread', 94, 58, () =>
    P('M6 46 Q2 12 40 8 Q86 4 88 40 Q90 54 70 54 H22 Q6 54 6 46Z', '#e2a35c') + Ps('M30 20 L24 34 M48 16 L42 32 M66 18 L60 34', 4, '#b8763a') + shine(16, 18, 12, 8, 4, 0.35)),
  food('croissant', 80, 48, () =>
    P('M6 34 Q14 10 40 8 Q66 10 74 34 Q64 30 58 40 Q50 22 40 22 Q30 22 22 40 Q16 30 6 34Z', '#eeb35e') + Ps('M24 22 L30 36 M40 14 V30 M56 22 L50 36', 3.5, '#c9853a')),
  food('donut', 58, 58, () =>
    Ci(29, 29, 25, '#e5ad6a') + P('M8 26 Q8 6 29 6 Q50 6 50 26 Q46 34 40 30 Q34 38 28 32 Q20 38 16 31 Q10 34 8 26Z', C.pink, 3.5) + Ci(29, 29, 8, '#fff7e8', 3.5) +
    L(18, 16, 22, 14, 3, C.yellow) + L(36, 14, 40, 17, 3, C.blue) + L(28, 12, 31, 10, 3, C.mint) + L(42, 24, 45, 22, 3, C.white)),
  food('cakeSlice', 64, 58, () =>
    P('M6 50 L6 26 L58 12 L58 50Z', '#fff1d6') + P('M6 26 L58 12 L58 22 L6 36Z', C.pinkL, 3) + R(6, 38, 52, 6, 2, C.rose, 0) +
    P('M4 26 Q16 16 30 18 Q44 8 60 12', C.pink, 4) + Ci(34, 9, 6, C.red, 3) + Ps('M6 50 H58', 4)),
  food('icecream', 44, 90, () =>
    P('M8 38 L22 86 L36 38Z', '#f0c37a') + Ps('M12 46 L32 70 M32 46 L14 64 M20 40 L30 58', 3, '#c9913f') +
    Ci(22, 26, 18, C.pinkL) + Ci(12, 36, 9, C.pinkL) + Ci(32, 36, 9, C.pinkL) + Ci(22, 8, 6, C.red, 3) + shine(12, 16, 7, 9, 4, 0.45), 'corner', {
    tags: ['item', 'food', 'small', 'icecream'],
    art: undefined as any,
  }),
  food('lollipop', 40, 76, () =>
    R(17, 34, 6, 40, 3, '#ffffff', 3) + Ci(20, 20, 17, C.purpleL) + Ps('M20 20 m-10 0 a10 10 0 1 0 10 -10 a6 6 0 1 0 6 6', 4, C.rose)),
  food('pancake', 70, 40, () =>
    El(35, 30, 32, 8, '#e5a85c') + El(35, 24, 32, 8, '#f0bb6f') + El(35, 17, 32, 8, '#f5c97f') + P('M24 12 Q35 6 46 12 Q50 22 40 20 Q35 26 30 20 Q20 22 24 12Z', C.brown, 3)),
  plain('milk', ['item', 'drink', 'small'], 48, 78, () =>
    P('M6 24 L14 4 H34 L42 24Z', '#ffffff') + R(6, 22, 36, 52, 4, '#ffffff') + R(6, 34, 36, 22, 2, C.blue, 3.5) +
    El(24, 45, 7, 5, '#ffffff', 2.5) + R(16, 0, 16, 6, 2, C.blue, 3)),
  plain('juice', ['item', 'drink', 'small'], 42, 62, () =>
    P('M6 6 L10 58 H32 L36 6Z', C.glass) + P('M8 22 L11 56 H31 L34 22Z', C.orange, 0) + Ps('M6 6 L10 58 H32 L36 6', 4) +
    L(28, 2, 18, 40, 5, C.rose) + shine(12, 26, 4, 24, 2, 0.5)),
  plain('coffee', ['item', 'drink', 'small'], 50, 52, () =>
    R(6, 14, 32, 34, 8, '#ffffff') + Ps('M38 22 Q48 22 46 32 Q44 40 36 38', 5) + Ef(22, 18, 13, 3.5, C.brown) + P('M10 24 Q22 30 34 24', C.pinkL, 0) + heartPathEl(22, 36, 5)),
  plain('egg', ['item', 'egg', 'small'], 38, 48, () =>
    P('M19 4 C30 4 36 22 35 32 C34 42 27 46 19 46 C11 46 4 42 3 32 C2 22 8 4 19 4Z', '#fff9ef') + shine(10, 12, 6, 12, 3, 0.6)),
  plain('dough', ['item', 'dough', 'small'], 66, 40, () =>
    P('M6 34 Q2 14 20 12 Q30 2 44 8 Q62 8 62 26 Q64 36 52 36 H12 Q6 36 6 34Z', '#f8e6c4') + Cf(24, 22, 2, '#e8cf9f') + Cf(40, 18, 2, '#e8cf9f') + shine(14, 16, 10, 5, 3, 0.5)),
  plain('batter', ['item', 'batter', 'small'], 66, 50, () =>
    P('M4 18 H62 L54 46 H12Z', C.blueL) + El(33, 18, 29, 7, '#f6e3c0') + Ps('M44 4 L36 20', 5, C.woodD) + El(30, 22, 6, 3, C.pinkL)),
  plain('teddy', ['item', 'toy'], 72, 88, () =>
    Ci(18, 16, 11, C.brownL) + Ci(54, 16, 11, C.brownL) + Cf(18, 16, 5, C.pinkL) + Cf(54, 16, 5, C.pinkL) +
    El(36, 64, 24, 22, C.brownL) + Ci(14, 58, 9, C.brownL) + Ci(58, 58, 9, C.brownL) + Ci(22, 80, 9, C.brownL) + Ci(50, 80, 9, C.brownL) +
    Ci(36, 30, 22, C.brownL) + El(36, 37, 9, 7, '#f3dcc0', 3) + Cf(36, 33, 3, C.ol) + Cf(28, 26, 3, C.ol) + Cf(44, 26, 3, C.ol) +
    El(36, 66, 12, 11, '#f3dcc0', 0) + P('M30 50 L36 54 L42 50 L42 58 L36 54 L30 58Z', C.rose, 3), { sound: 'squeak' }),
  plain('ball', ['item', 'toy', 'ball'], 58, 58, () =>
    Ci(29, 29, 25, C.red) + P('M10 14 Q29 26 48 14 Q52 22 52 29 Q29 18 6 29 Q6 22 10 14Z', '#ffffff', 0) + Ps('M5 29 Q29 18 53 29 M10 14 Q29 26 48 14', 3.5) + shine(14, 34, 10, 6, 3, 0.4), { sound: 'boing' }),
  plain('book', ['item', 'toy'], 60, 48, () =>
    R(4, 4, 52, 40, 4, C.purple) + R(8, 6, 46, 34, 2, '#ffffff', 0) + R(4, 4, 10, 40, 3, C.purpleD) + `<path d="${starPath(36, 24, 9)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="3" stroke-linejoin="round"/>`),
  plain('duck', ['item', 'toy'], 52, 44, () =>
    P('M6 26 Q6 40 24 40 Q44 42 46 26 Q46 18 38 20 Q30 22 26 24 Z', C.yellow) + Ci(30, 14, 11, C.yellow) + P('M40 14 L50 17 L40 20Z', C.orange, 3) + Cf(33, 11, 2.5, C.ol) + Ps('M14 28 Q22 34 30 28', 3, C.yellowD), { sound: 'squeak' }),
  plain('toothbrush', ['item', 'brush', 'small'], 70, 22, () =>
    R(4, 9, 48, 8, 4, C.mint) + R(50, 4, 16, 10, 3, '#ffffff') + Ps('M54 4 V0 M58 4 V0 M62 4 V0', 3, C.blue)),
  plain('hairbrush', ['item', 'brush', 'small'], 68, 28, () =>
    R(4, 10, 30, 10, 5, C.pink) + R(32, 4, 32, 20, 8, C.pinkL) + Ps('M38 10 V18 M44 10 V18 M50 10 V18 M56 10 V18', 3)),
  plain('soap', ['item', 'soap', 'small'], 48, 32, () =>
    R(4, 6, 40, 22, 8, C.pinkL) + Ef(24, 16, 10, 5, '#ffffff', 0.6) + Ci(36, 6, 5, '#ffffff', 2) + Ci(42, 2, 3, '#ffffff', 2)),
  plain('towel', ['item', 'small'], 78, 44, () =>
    R(4, 6, 70, 32, 6, C.blue) + Rf(4, 26, 70, 6, 0, C.blueL) + Ps('M4 14 H74', 3, '#ffffff', 0.7)),
  plain('blocks', ['item', 'toy', 'small'], 46, 46, () =>
    R(4, 4, 38, 38, 6, C.yellow) + `<text x="23" y="34" text-anchor="middle" font-family="Rubik, Arial" font-weight="800" font-size="26" fill="${C.ol}">A</text>`),
  plain('toycar', ['item', 'toy'], 76, 46, () =>
    P('M6 30 Q6 20 16 20 L24 8 H52 L62 20 Q72 20 72 30 V36 H6Z', C.blue) + R(28, 11, 10, 9, 2, C.glass, 3) + R(42, 11, 10, 9, 2, C.glass, 3) + Ci(20, 38, 8, C.ol, 0) + Ci(20, 38, 4, C.grey, 0) + Ci(58, 38, 8, C.ol, 0) + Ci(58, 38, 4, C.grey, 0), { sound: 'boing' }),
  // wearables
  plain('crown', ['item', 'wear', 'small'], 66, 44, () =>
    P('M6 40 L4 10 L20 24 L33 4 L46 24 L62 10 L60 40Z', C.yellow) + Ci(33, 26, 5, C.rose, 3) + Ci(16, 32, 3.5, C.blue, 2.5) + Ci(50, 32, 3.5, C.mint, 2.5), { wearY: -0.78 }),
  plain('partyhat', ['item', 'wear', 'small'], 50, 66, () =>
    P('M6 60 L25 8 L44 60Z', C.purple) + Ps('M14 42 L36 30 M10 54 L40 40 M20 26 L30 20', 4, C.yellow) + Ci(25, 8, 7, C.rose, 3) + El(25, 60, 20, 5, C.purpleD, 3), { wearY: -0.82 }),
  plain('sunglasses', ['item', 'wear', 'small'], 70, 26, () =>
    R(4, 6, 26, 16, 7, C.ol, 3) + R(40, 6, 26, 16, 7, C.ol, 3) + L(30, 10, 40, 10, 4) + Rf(8, 9, 8, 4, 2, '#ffffff', 0.5) + Rf(44, 9, 8, 4, 2, '#ffffff', 0.5), { wearY: 0.06 }),
  plain('sleepcap', ['item', 'wear', 'small'], 70, 58, () =>
    P('M6 50 Q10 10 40 8 Q62 8 64 30 L58 34 Q54 20 40 22 Q24 26 22 50Z', C.blueL) + P('M4 48 Q35 36 66 48 L64 56 Q35 46 6 56Z', '#ffffff') + Ci(60, 34, 7, C.yellow, 3) + Cf(26, 24, 3, '#ffffff') + Cf(44, 16, 2.5, '#ffffff'), { wearY: -0.66 }),
  plain('chefhat', ['item', 'wear', 'small'], 64, 62, () =>
    R(10, 36, 44, 22, 4, '#ffffff') + Ci(20, 24, 14, '#ffffff') + Ci(44, 24, 14, '#ffffff') + Ci(32, 16, 16, '#ffffff') + Rf(12, 36, 40, 6, 0, '#ffffff') + Ps('M18 46 V54 M32 46 V54 M46 46 V54', 3, C.greyD), { wearY: -0.8 }),
  plain('cap', ['item', 'wear', 'small'], 72, 42, () =>
    P('M10 36 Q8 6 36 6 Q62 6 62 36Z', C.red) + P('M40 34 Q60 30 70 38 Q56 42 40 40Z', C.redD, 3.5) + Ci(36, 7, 4, C.red, 3) + Ps('M20 14 Q36 10 52 14', 3, '#ffffff', 0.5), { wearY: -0.6 }),
  // park
  plain('bucket', ['item', 'toy'], 58, 58, () =>
    P('M8 18 L14 54 H44 L50 18Z', C.blue) + El(29, 18, 21, 6, C.blueD) + Ps('M8 18 Q29 -10 50 18', 4) + Rf(16, 30, 26, 6, 3, '#ffffff', 0.4)),
  plain('spade', ['item', 'toy'], 30, 78, () =>
    R(12, 4, 6, 44, 3, C.yellow) + R(8, 0, 14, 8, 4, C.yellow) + P('M4 46 H26 L24 66 Q15 78 6 66Z', C.red)),
  plain('flower', ['item', 'flower', 'small'], 40, 70, () =>
    Ps('M20 30 Q16 50 20 68', 4, C.greenD) + P('M20 52 Q8 44 6 50 Q12 58 20 56Z', C.green, 3) +
    [0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return Ci(20 + Math.cos(a) * 10, 18 + Math.sin(a) * 10, 8, C.pink, 3); }).join('') + Ci(20, 18, 6, C.yellow, 3)),
  plain('kite', ['item', 'toy'], 60, 86, () =>
    P('M30 4 L54 30 L30 62 L6 30Z', C.rose) + P('M30 4 L30 62 M6 30 H54', C.rose, 3) + Pf('M30 4 L54 30 L30 30Z', '#ffffff', 0.35) + Ps('M30 62 Q22 70 30 76 Q38 82 30 86', 3)),
  // vet / pets
  plain('bone', ['item', 'petfood', 'small'], 64, 30, () =>
    P('M14 8 Q6 2 4 10 Q2 16 8 16 Q2 18 4 24 Q8 30 14 22 H50 Q56 30 60 24 Q62 18 56 16 Q62 14 60 8 Q56 2 50 8Z', '#fff7e8')),
  plain('fish', ['item', 'petfood', 'small'], 64, 34, () =>
    P('M6 17 Q22 2 44 10 L58 4 L54 17 L58 30 L44 24 Q22 32 6 17Z', C.blueL) + Cf(18, 14, 3, C.ol) + Ps('M28 12 Q32 17 28 22 M36 12 Q40 17 36 22', 3, C.blueD)),
  plain('petbowl', ['item', 'petfood', 'small'], 66, 32, () =>
    P('M4 14 H62 L56 30 H10Z', C.red) + El(33, 14, 29, 6, C.redD) + Cf(24, 12, 4, '#b8763a') + Cf(34, 10, 4, '#b8763a') + Cf(42, 13, 4, '#b8763a') + T2(33, 26, 'PET')),
  plain('bandage', ['item', 'med', 'small'], 58, 24, () =>
    R(4, 4, 50, 16, 8, '#ffd9b3') + R(20, 4, 18, 16, 2, '#fff0de', 3) + Cf(25, 9, 1.5, '#e8b98a') + Cf(33, 15, 1.5, '#e8b98a') + Cf(29, 12, 1.5, '#e8b98a')),
  plain('medicine', ['item', 'med', 'small'], 34, 56, () =>
    R(6, 14, 22, 38, 6, C.mint) + R(8, 4, 18, 12, 3, '#ffffff') + R(10, 26, 14, 14, 2, '#ffffff', 2.5) + Pf('M15 29 H19 V31 H21 V35 H19 V37 H15 V35 H13 V31 H15Z', C.red)),
  plain('stethoscope', ['item', 'med', 'small'], 66, 64, () =>
    Ps('M14 6 Q8 34 30 38 Q52 34 46 6', 6, C.ol) + Ps('M14 6 Q8 34 30 38 Q52 34 46 6', 3, C.blue) + Ps('M30 38 Q30 52 44 54', 6, C.ol) + Ps('M30 38 Q30 52 44 54', 3, C.blue) + Ci(48, 54, 9, C.steel) + Ci(14, 6, 4, C.grey, 2.5) + Ci(46, 6, 4, C.grey, 2.5)),
  plain('thermometer', ['item', 'med', 'small'], 22, 62, () =>
    R(6, 4, 10, 46, 5, '#ffffff') + Ci(11, 52, 8, C.red) + R(9, 20, 4, 32, 2, C.red, 0)),
  plain('comb', ['item', 'brush', 'small'], 60, 24, () =>
    R(4, 4, 52, 8, 3, C.purple) + Ps('M10 12 V20 M16 12 V20 M22 12 V20 M28 12 V20 M34 12 V20 M40 12 V20 M46 12 V20 M52 12 V20', 3)),
];

function heartPathEl(cx: number, cy: number, r: number) {
  return `<path d="${heartPath(cx, cy, r)}" fill="${C.rose}"/>`;
}

function T2(x: number, y: number, t: string) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Rubik, Arial" font-weight="800" font-size="9" fill="#ffffff">${t}</text>`;
}

// ice cream flavors: same item, color by state.flavor
const ice = ITEMS.find((i) => i.id === 'icecream')!;
const ICE = [[C.pinkL, C.red], [C.mintL, '#3a2a3a'], ['#c48a5a', C.yellow], [C.yellowL, C.blue]];
ice.art = {
  w: 44, h: 90,
  variants: ['f0b3', 'f0b2', 'f0b1', 'f1b3', 'f1b2', 'f1b1', 'f2b3', 'f2b2', 'f2b1', 'f3b3', 'f3b2', 'f3b1'],
  art: (v) => {
    const f = Number(v[1]);
    const b = Number(v[3]);
    const [c1, c2] = ICE[f];
    const body = P('M8 38 L22 86 L36 38Z', '#f0c37a') + Ps('M12 46 L32 70 M32 46 L14 64 M20 40 L30 58', 3, '#c9913f') +
      Ci(22, 26, 18, c1) + Ci(12, 36, 9, c1) + Ci(32, 36, 9, c1) + Ci(22, 8, 6, c2, 3) + shine(12, 16, 7, 9, 4, 0.45);
    return bitten(44, 90, body, 3 - b);
  },
};
ice.variant = (s) => `f${(s.flavor ?? 0) % 4}b${Math.max(1, Math.min(3, s.bites ?? 3))}`;

/** cooking transforms */
const COOK: Record<string, ThingDef['cook']> = {
  egg: [{ by: 'stove', to: 'friedEgg', time: 2.2 }],
  dough: [{ by: 'bakeoven', to: 'bread', time: 3 }, { by: 'stove', to: 'pancake', time: 2.4 }],
  batter: [{ by: 'bakeoven', to: 'cakeSlice', time: 3 }, { by: 'stove', to: 'pancake', time: 2.4 }],
};
for (const it of ITEMS) if (COOK[it.id]) it.cook = COOK[it.id];

export const itemShade = shade;
export const itemDots = dots;
