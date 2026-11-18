// The park
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, shine, shade, cloudPath, heartPath, starPath } from '../../art/kit';
import type { ThingDef, LocationDef } from '../types';

const W = 2800;

export const SWING_PIVOTS = [{ x: -72, y: -330 }, { x: 72, y: -330 }];
export const SWING_LEN = 220;

const swingset: ThingDef = {
  id: 'swingset', tags: [], fixed: true, tap: 'none', sound: 'swing',
  art: { w: 380, h: 360, art: () => svg(380, 360,
    P('M14 356 L60 20 L74 20 L40 356Z', C.red) + P('M100 356 L74 20 L60 20 L86 356Z', C.redD) +
    P('M280 356 L306 20 L320 20 L294 356Z', C.redD) + P('M366 356 L320 20 L306 20 L340 356Z', C.red) +
    R(40, 10, 300, 24, 12, C.yellow) + Ci(118, 30, 6, C.greyDD, 3) + Ci(262, 30, 6, C.greyDD, 3)) },
  slots: [
    { x: -72, y: -110, accept: ['char', 'pet', 'toy'], pose: 'swing', r: 130 },
    { x: 72, y: -110, accept: ['char', 'pet', 'toy'], pose: 'swing', r: 130 },
  ],
};

export const SLIDE_PATH = { x0: -110, y0: -268, cx: 30, cy: -200, x1: 200, y1: -40 };

const slide: ThingDef = {
  id: 'slide', tags: [], fixed: true,
  art: { w: 440, h: 370, art: () => svg(440, 370,
    R(24, 80, 18, 288, 6, C.blueD) + R(104, 80, 18, 288, 6, C.blueD) +
    Ps('M34 130 H112 M34 180 H112 M34 230 H112 M34 280 H112 M34 330 H112', 8, C.blue) +
    R(14, 70, 150, 26, 10, C.blue) + Ps('M24 70 V24 M154 70 V24 M24 30 H154', 7, C.blueD) +
    P('M150 74 Q260 110 330 250 Q360 320 420 330 L424 360 Q340 362 300 280 Q250 150 150 100Z', C.yellow) +
    Ps('M154 84 Q262 124 318 262 Q348 334 420 344', 4, C.yellowD, 0.8) +
    R(396, 320, 14, 48, 5, C.blueD, 3.5)) },
  slots: [{ x: -110, y: -270, accept: ['char', 'pet', 'toy'], pose: 'slide', r: 140 }],
};

const sandbox: ThingDef = {
  id: 'sandbox', tags: [], fixed: true, z: -30,
  art: { w: 380, h: 130, art: () => svg(380, 130,
    P('M10 50 L40 14 H340 L370 50 V112 H10Z', C.wood) + P('M30 50 L54 26 H326 L350 50 V100 H30Z', '#f7dda0', 3.5) +
    Cf(120, 60, 18, '#efc97f') + Cf(250, 72, 24, '#efc97f') + P('M200 64 Q220 40 240 64Z', '#efc97f', 3) +
    R(10, 100, 360, 26, 8, C.woodD)) },
  slots: [
    { x: -110, y: -50, accept: ['char', 'pet', 'item'], pose: 'sit' },
    { x: 0, y: -46, accept: ['item', 'char', 'pet'], pose: 'place' },
    { x: 110, y: -50, accept: ['char', 'pet', 'item'], pose: 'sit' },
  ],
};

export const bench: ThingDef = {
  id: 'bench', tags: [], fixed: true,
  art: { w: 310, h: 160, art: () => svg(310, 160,
    R(14, 6, 282, 24, 10, C.greenD) + R(14, 38, 282, 24, 10, C.greenD) +
    R(36, 24, 14, 50, 4, C.greyDD) + R(260, 24, 14, 50, 4, C.greyDD) +
    R(6, 76, 298, 26, 10, C.green) + R(30, 98, 16, 58, 5, C.greyDD) + R(264, 98, 16, 58, 5, C.greyDD)) },
  slots: [
    { x: -76, y: -84, accept: ['char', 'pet', 'toy', 'item'], pose: 'sit' },
    { x: 76, y: -84, accept: ['char', 'pet', 'toy', 'item'], pose: 'sit' },
  ],
};

const icecart: ThingDef = {
  id: 'icecart', tags: [], fixed: true, tap: 'spawn', spawn: ['icecream'], sound: 'pop', spawnAt: { x: -40, y: -150 },
  art: { w: 270, h: 340, art: () => svg(270, 340,
    R(128, 60, 10, 140, 4, C.greyDD) +
    P('M18 92 Q133 -10 252 92Z', C.rose) + P('M58 92 Q133 -10 133 92Z', '#ffffff', 0) + Ps('M18 92 Q133 -10 252 92', 4) + Ps('M58 92 Q100 30 133 4 M208 92 Q166 30 133 4', 3, C.ol, 0.6) +
    Ci(133, 2, 8, C.yellow, 3) +
    R(26, 180, 218, 112, 18, C.blueL) + R(18, 160, 234, 32, 12, '#ffffff') +
    Ci(70, 172, 14, C.pinkL, 3) + Ci(104, 170, 14, C.mintL, 3) + Ci(138, 172, 14, '#c48a5a', 3) + Ci(172, 170, 14, C.yellowL, 3) +
    P('M110 216 L135 270 L160 216Z', '#f0c37a', 3.5) + Ci(135, 210, 16, C.pink, 3.5) +
    Ci(60, 300, 26, C.greyDD) + Ci(60, 300, 10, C.grey, 3) + Ci(212, 300, 26, C.greyDD) + Ci(212, 300, 10, C.grey, 3) + Ps('M244 200 L262 178', 6)) },
};

const tree: ThingDef = {
  id: 'appletree', tags: [], fixed: true, tap: 'spawn', spawn: ['apple', 'apple', 'flower'], sound: 'whoosh', spawnAt: { x: 0, y: -260 }, z: -40,
  art: { w: 300, h: 440, art: () => svg(300, 440,
    P('M130 440 Q140 330 120 260 H180 Q160 330 170 440Z', C.brown) + Ps('M150 300 Q190 270 210 240', 12, C.brown) + Ps('M150 300 Q190 270 210 240', 5, shade(C.brown, 0.1)) +
    Ci(150, 150, 120, C.greenD) + Ci(80, 200, 70, C.green) + Ci(220, 200, 76, C.green) + Ci(150, 90, 86, C.green) + Cf(110, 70, 22, '#ffffff', 0.25) +
    Ci(90, 160, 13, C.red, 3) + Ci(200, 120, 13, C.red, 3) + Ci(160, 230, 13, C.red, 3) + Ci(240, 220, 13, C.red, 3) + Ci(120, 90, 13, C.red, 3)) },
};

const fountain: ThingDef = {
  id: 'fountain', tags: [], fixed: true, tap: 'toggle', sound: 'splash', z: -20,
  art: { w: 260, h: 200, art: () => svg(260, 200,
    El(130, 150, 124, 40, C.greyL) + El(130, 146, 104, 28, C.blue, 3.5) + R(110, 70, 40, 80, 10, C.greyL) + El(130, 72, 56, 16, C.greyL) + El(130, 70, 44, 10, C.blue, 3)) },
};

export const PARK_DEFS: ThingDef[] = [swingset, slide, sandbox, bench, icecart, tree, fountain];

function bg() {
  let s = '';
  s += Rf(-600, -600, W + 1200, 1300, 0, '#bfe9ff');
  s += Rf(-600, 260, W + 1200, 400, 0, '#d4f1ff');
  s += Cf(2300, 80, 80, '#fff6c2', 0.7) + Cf(2300, 80, 56, C.yellow);
  for (const [x, y, w] of [[100, 60, 220], [700, 120, 180], [1300, 40, 240], [1900, 140, 180], [2600, 60, 200], [-400, 100, 200]] as [number, number, number][]) s += P(cloudPath(x, y, w, w * 0.36), '#ffffff', 3.5);
  s += Pf('M-600 520 Q-200 380 300 470 Q800 360 1300 460 Q1800 370 2300 450 Q2800 380 3400 470 V900 H-600Z', '#b5e39a');
  for (let x = -500; x < W + 600; x += 210) s += R(x, 410, 16, 150, 5, C.brown, 3) + Ci(x + 8, 400, 60, C.greenD, 3.5) + Ci(x - 22, 420, 36, C.green, 3);
  s += Rf(-600, 560, W + 1200, 700, 0, '#9fdc7a');
  // fence
  for (let x = -580; x < W + 600; x += 60) s += R(x, 520, 26, 100, 8, '#ffffff', 3.5);
  s += R(-600, 545, W + 1200, 16, 6, '#ffffff', 3.5) + R(-600, 585, W + 1200, 16, 6, '#ffffff', 3.5);
  // path
  s += Pf('M-600 700 Q400 660 1400 700 Q2200 740 3400 690 V820 Q2200 860 1400 820 Q400 790 -600 830Z', '#f7e1b0');
  // pond
  s += El(150, 790, 260, 60, C.blue, 4) + Ef(110, 780, 200, 40, C.skyD, 0.6) + Ps('M40 800 Q80 790 120 800 M200 780 Q240 770 280 780', 4, '#ffffff', 0.7);
  s += Ci(240, 770, 14, '#ffffff', 3) + P('M230 760 Q228 740 240 738 Q252 740 250 756Z', '#ffffff', 3) + P('M250 744 L262 748 L250 752Z', C.orange, 2.5);
  // flowers & grass tufts
  for (let i = 0; i < 70; i++) {
    const x = -560 + ((i * 173) % (W + 1100)), y = 640 + ((i * 61) % 300);
    if (i % 3 === 0) s += Cf(x, y, 7, [C.pink, C.yellow, '#ffffff', C.purpleL][i % 4]) + Cf(x, y, 3, C.orange);
    else s += Ps(`M${x} ${y} l-6 -14 M${x} ${y} l0 -16 M${x} ${y} l6 -14`, 3, C.greenD, 0.7);
  }
  return s;
}

export const PARK: LocationDef = {
  id: 'park',
  width: W,
  floor: { top: 700, bottom: 880 },
  bg,
  music: 'park',
  seed: 11,
  map: { x: 700, y: 470 },
  nameKey: 'loc.park',
  place: [
    { def: 'fountain', x: 420, y: 700, s: { on: true } },
    { def: 'swingset', x: 700, y: 820 },
    { def: 'slide', x: 1220, y: 820 },
    { def: 'sandbox', x: 1700, y: 860, kids: [[1, 'bucket']] },
    { def: 'spade', x: 1820, y: 868 },
    { def: 'bench', x: 2100, y: 800 },
    { def: 'icecart', x: 2420, y: 810 },
    { def: 'appletree', x: 2700, y: 760 },
    { def: 'ball', x: 960, y: 870 },
    { def: 'kite', x: 1460, y: 860 },
    { def: 'flower', x: 2260, y: 870 },
  ],
  chars: [
    { roster: 'tamar', x: 628, y: 710 },
    { roster: 'omer', x: 1010, y: 860 },
    { roster: 'max', x: 2024, y: 716 },
  ],
  pets: [{ kind: 'bunny', color: 0, x: 1590, y: 810 }],
};
