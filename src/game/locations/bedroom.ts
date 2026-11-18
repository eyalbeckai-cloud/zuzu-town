// Bedroom + bathroom (upstairs of the house)
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, shine, shade, cloudPath, heartPath, starPath, dots } from '../../art/kit';
import type { ThingDef, LocationDef } from '../types';
import { ICON_SOFA } from './home';

const W = 2400;

const doorHome: ThingDef = {
  id: 'door_home', tags: [], fixed: true, door: 'home', sound: 'door', z: -60,
  art: { w: 170, h: 300, art: () => svg(170, 300,
    R(4, 4, 162, 296, 14, C.woodL) + R(16, 16, 138, 284, 10, C.pink) +
    R(30, 36, 110, 100, 10, shade(C.pink, 0.15), 3.5) + R(30, 160, 110, 110, 10, shade(C.pink, 0.15), 3.5) +
    Ci(136, 160, 8, C.yellow, 3.5) + G('translate(85 86)', ICON_SOFA)) },
};

const bed: ThingDef = {
  id: 'bed', tags: [], fixed: true,
  art: { w: 450, h: 250, art: () => svg(450, 250,
    R(0, 20, 70, 226, 26, C.blue) + Ci(35, 70, 16, C.yellow, 3.5) + `<path d="${starPath(35, 70, 9)}" fill="#fff"/>` +
    R(392, 120, 54, 126, 18, C.blue) +
    R(40, 150, 380, 58, 16, C.blueL) + R(34, 196, 392, 30, 10, C.blueD) +
    R(52, 226, 18, 22, 4, C.woodD, 3.5) + R(380, 226, 18, 22, 4, C.woodD, 3.5) +
    El(112, 140, 62, 28, '#ffffff') + Ps('M70 138 Q112 128 154 138', 3, C.greyD, 0.6)) },
  overlay: { w: 450, h: 250, art: () => svg(450, 250,
    P('M150 138 Q300 124 420 138 Q430 170 420 204 H150 Q140 172 150 138Z', C.yellowL, 4) +
    Ps('M150 152 H420', 3, C.yellowD, 0.5) + dots(160, 160, 250, 40, C.orange, 26, 4, 0.5)) },
  slots: [
    { x: -108, y: -134, accept: ['char', 'pet', 'toy'], pose: 'lie', dir: -1 },
    { x: 150, y: -80, accept: ['char', 'pet', 'toy'], pose: 'sit', front: true },
  ],
};

const bunk: ThingDef = {
  id: 'bunkbed', tags: [], fixed: true,
  art: { w: 310, h: 390, art: () => svg(310, 390,
    R(8, 6, 26, 380, 10, C.wood) + R(276, 6, 26, 380, 10, C.wood) +
    R(30, 150, 250, 34, 10, C.woodL) + R(30, 330, 250, 34, 10, C.woodL) +
    R(36, 124, 238, 30, 10, C.mintL) + R(36, 304, 238, 30, 10, C.mintL) +
    El(80, 118, 40, 18, '#ffffff') + El(80, 298, 40, 18, '#ffffff') +
    R(30, 60, 250, 12, 6, C.wood, 3.5) +
    Ps('M250 160 V330 M276 190 H250 M276 230 H250 M276 270 H250 M276 310 H250', 5, C.woodD)) },
  overlay: { w: 310, h: 390, art: () => svg(310, 390,
    P('M110 118 Q190 108 262 118 Q270 136 262 160 H110 Q102 138 110 118Z', C.mint, 4) + dots(116, 124, 140, 32, '#ffffff', 22, 4, 0.6) +
    P('M110 298 Q190 288 262 298 Q270 316 262 340 H110 Q102 318 110 298Z', C.pink, 4) + dots(116, 304, 140, 32, '#ffffff', 22, 4, 0.6)) },
  slots: [
    { x: -76, y: -282, accept: ['char', 'pet', 'toy'], pose: 'lie', dir: -1 },
    { x: -76, y: -102, accept: ['char', 'pet', 'toy'], pose: 'lie', dir: -1 },
  ],
};

const wardrobe: ThingDef = {
  id: 'wardrobe', tags: [], fixed: true, tap: 'open', sound: 'door',
  art: {
    w: 300, h: 372, ax: 150, variants: ['closed', 'open'],
    art: (v) => svg(300, 372, v === 'closed'
      ? R(50, 6, 200, 352, 18, C.purple) + R(62, 28, 84, 312, 12, C.purpleL, 3.5) + R(154, 28, 84, 312, 12, C.purpleL, 3.5) +
        Ci(136, 190, 7, C.yellow, 3.5) + Ci(164, 190, 7, C.yellow, 3.5) + R(64, 356, 22, 14, 4, C.woodD, 3) + R(214, 356, 22, 14, 4, C.woodD, 3) +
        `<path d="${heartPath(104, 90, 16)}" fill="${C.pink}" stroke="${C.ol}" stroke-width="3.5"/>` + `<path d="${starPath(196, 92, 18)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="3.5" stroke-linejoin="round"/>`
      : R(50, 6, 200, 352, 18, C.purple) + R(62, 20, 176, 324, 10, '#6f5aa8', 3.5) +
        R(66, 120, 168, 10, 4, C.woodL, 3) + R(66, 240, 168, 10, 4, C.woodL, 3) +
        P('M50 10 L4 30 V330 L50 352Z', C.purpleL) + P('M250 10 L296 30 V330 L250 352Z', C.purpleL) +
        Ci(34, 190, 5, C.yellow, 3) + Ci(266, 190, 5, C.yellow, 3) + R(64, 356, 22, 14, 4, C.woodD, 3) + R(214, 356, 22, 14, 4, C.woodD, 3)),
  },
  variant: (s) => (s.open ? 'open' : 'closed'),
  slots: [
    { x: -60, y: -252, accept: ['item'], pose: 'place', inside: true, restock: 'crown', r: 70 },
    { x: 0, y: -252, accept: ['item'], pose: 'place', inside: true, restock: 'partyhat', r: 70 },
    { x: 60, y: -252, accept: ['item'], pose: 'place', inside: true, restock: 'sunglasses', r: 70 },
    { x: -42, y: -132, accept: ['item'], pose: 'place', inside: true, restock: 'sleepcap', r: 70 },
    { x: 42, y: -132, accept: ['item'], pose: 'place', inside: true, restock: 'cap', r: 70 },
  ],
};

const bedlamp: ThingDef = {
  id: 'bedlamp', tags: [], fixed: true, tap: 'light', sound: 'click',
  light: { x: 0, y: -160, r: 240 },
  art: {
    w: 124, h: 224, variants: ['off', 'on'],
    art: (v) => svg(124, 224,
      R(8, 120, 108, 100, 12, C.woodL) + R(20, 140, 84, 30, 6, C.wood, 3.5) + Ci(62, 155, 4, C.woodD, 2.5) + R(20, 178, 84, 30, 6, C.wood, 3.5) + Ci(62, 193, 4, C.woodD, 2.5) +
      El(62, 116, 26, 7, C.pinkD) + R(56, 76, 12, 40, 4, C.pinkD) +
      P('M26 82 L38 26 H86 L98 82Z', v === 'on' ? C.yellowL : C.pinkL) + (v === 'on' ? Ef(62, 84, 26, 5, '#fff7c2', 0.9) : '')),
  },
  variant: (s) => (s.on ? 'on' : 'off'),
  slots: [{ x: 34, y: -106, accept: ['item'], pose: 'place', r: 60 }],
};

const toybox: ThingDef = {
  id: 'toybox', tags: [], fixed: true, tap: 'spawn', spawn: ['ball', 'teddy', 'blocks', 'toycar', 'duck', 'kite', 'book'], sound: 'boing', spawnAt: { x: 0, y: -130 },
  art: { w: 200, h: 140, art: () => svg(200, 140,
    R(10, 40, 180, 96, 14, C.red) + R(4, 24, 192, 30, 12, C.redD) + R(84, 58, 32, 22, 6, C.yellow, 3.5) +
    `<path d="${starPath(48, 96, 16)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="3.5" stroke-linejoin="round"/>` + Ci(150, 96, 14, C.blue, 3.5) +
    Ci(70, 20, 14, C.yellow, 3) + R(110, 4, 30, 26, 6, C.mint, 3)) },
};

const bathtub: ThingDef = {
  id: 'bathtub', tags: [], fixed: true, tap: 'toggle', sound: 'splash',
  art: { w: 390, h: 214, art: () => svg(390, 214,
    Ps('M30 70 V22 Q30 8 44 8 H62', 9) + Ps('M30 70 V22 Q30 8 44 8 H62', 4, C.steel) + R(58, 4, 16, 14, 4, C.steelD, 3) +
    R(8, 64, 374, 128, 46, '#ffffff') + El(195, 82, 168, 18, '#d9f0ff', 3.5) +
    R(40, 186, 24, 26, 8, C.yellow, 3.5) + R(326, 186, 24, 26, 8, C.yellow, 3.5)) },
  overlay: {
    w: 390, h: 214, variants: ['dry', 'foam'],
    art: (v) => svg(390, 214,
      P('M8 104 H382 V150 Q382 192 336 192 H54 Q8 192 8 150Z', '#ffffff', 4) + shine(30, 116, 120, 8, 4, 0.5) + Ps('M60 164 H330', 4, C.blueL, 0.8) +
      (v === 'foam' ? [40, 90, 140, 190, 240, 290, 340].map((x, i) => Ci(x, 102 - (i % 2) * 8, 26 - (i % 3) * 4, '#ffffff', 3)).join('') + Cf(120, 82, 6, '#ffffff') : '')),
  },
  overlayVariant: (s) => (s.on ? 'foam' : 'dry'),
  slots: [
    { x: -88, y: -74, accept: ['char', 'pet', 'toy'], pose: 'bath' },
    { x: 72, y: -74, accept: ['char', 'pet', 'toy'], pose: 'bath' },
  ],
};

const toilet: ThingDef = {
  id: 'toilet', tags: [], fixed: true, tap: 'flush', sound: 'flush',
  art: { w: 136, h: 186, art: () => svg(136, 186,
    R(24, 4, 88, 74, 14, '#ffffff') + R(84, 18, 20, 8, 4, C.steelD, 3) +
    R(36, 120, 64, 62, 12, '#ffffff') + El(68, 100, 64, 22, '#ffffff') + El(68, 96, 46, 12, C.blueL, 3) + shine(30, 30, 10, 36, 5, 0.5)) },
  slots: [{ x: 0, y: -96, accept: ['char', 'pet', 'toy'], pose: 'sit' }],
};

const bathsink: ThingDef = {
  id: 'bathsink', tags: [], fixed: true, tap: 'toggle', sound: 'toggle',
  art: { w: 180, h: 244, art: () => svg(180, 244,
    Ps('M90 72 V40 Q90 30 100 30 H112', 8) + Ps('M90 72 V40 Q90 30 100 30 H112', 3.5, C.steel) +
    R(62, 108, 56, 132, 12, '#ffffff') + P('M4 68 H176 Q176 114 90 116 Q4 114 4 68Z', '#ffffff') + El(90, 72, 70, 9, C.blueL, 3)) },
  slots: [
    { x: -60, y: -178, accept: ['item'], pose: 'place', r: 70 },
    { x: 60, y: -178, accept: ['item'], pose: 'place', r: 70 },
  ],
};

export const BEDROOM_DEFS: ThingDef[] = [doorHome, bed, bunk, wardrobe, bedlamp, toybox, bathtub, toilet, bathsink];

function bg() {
  const bx = 1500;
  let s = '';
  s += Rf(-600, -600, bx + 600, 1250, 0, '#efe7ff');
  for (let y = -560; y < 470; y += 70) for (let x = -560 + ((y / 70) % 2 ? 35 : 0); x < bx; x += 70) s += `<path d="${starPath(x, y, 7)}" fill="#ffffff" opacity="0.8"/>`;
  s += Rf(-600, 470, bx + 600, 170, 0, '#e2d4ff') + L(-600, 470, bx, 470, 6, '#cdb8ff');
  // round window
  s += Ci(860, 210, 120, '#ffffff') + Ci(860, 210, 104, C.sky, 3.5);
  s += Ps('M770 250 A90 90 0 0 1 950 250', 14, C.red, 0.8) + Ps('M784 252 A76 76 0 0 1 936 252', 12, C.yellow, 0.8) + Ps('M798 254 A62 62 0 0 1 922 254', 12, C.mint, 0.8);
  s += P(cloudPath(780, 230, 70, 30), '#ffffff', 3) + P(cloudPath(880, 250, 70, 28), '#ffffff', 3);
  s += L(860, 106, 860, 314, 6, '#ffffff') + L(756, 210, 964, 210, 6, '#ffffff');
  // star mobile above bed
  s += Ps('M440 -40 V90', 3, C.greyDD) + Ps('M380 90 H500', 4, C.woodD) + Ps('M380 90 V130 M440 90 V150 M500 90 V120', 2.5, C.greyDD);
  s += `<path d="${starPath(380, 144, 16)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="3" stroke-linejoin="round"/>` + Ci(440, 160, 12, C.pink, 3) + `<path d="${starPath(500, 134, 14)}" fill="${C.mint}" stroke="${C.ol}" stroke-width="3" stroke-linejoin="round"/>`;
  // shelf with toys
  s += R(1100, 300, 230, 16, 6, C.woodD) + R(1110, 250, 40, 50, 8, C.yellow, 3) + Ci(1190, 276, 22, C.blue, 3) + R(1240, 240, 60, 60, 10, C.pink, 3);
  // frame with cat drawing
  s += R(1130, 110, 150, 110, 8, '#ffffff') + Ci(1205, 172, 24, C.orange, 3) + P('M1186 156 L1190 136 L1200 150Z', C.orange, 3) + P('M1224 156 L1220 136 L1210 150Z', C.orange, 3) + Cf(1197, 170, 3, C.ol) + Cf(1213, 170, 3, C.ol);
  // bathroom wall
  s += Rf(bx, -600, W - bx + 800, 1250, 0, '#ddf1ff');
  for (let y = 300; y < 640; y += 50) for (let x = bx; x < W + 800; x += 50) s += Rf(x + 2, y + 2, 46, 46, 6, ((x / 50 + y / 50) | 0) % 2 ? '#ffffff' : '#c6e6ff');
  s += Rf(bx, 290, W - bx + 800, 12, 0, '#9fd0f5');
  // mirror over sink
  s += R(2150, 120, 170, 200, 70, C.yellow) + R(2164, 134, 142, 172, 60, '#e8f6ff', 3.5) + Pf('M2190 180 L2240 150 L2250 160 L2196 196Z', '#ffffff', 0.7);
  // bath window
  s += R(1640, 110, 160, 140, 12, '#ffffff') + R(1652, 122, 136, 116, 8, C.sky, 3) + P(cloudPath(1670, 160, 80, 30), '#fff', 3);
  // towel rack
  s += Ps('M1880 250 H2040', 7, C.steelD) + R(1900, 252, 50, 90, 8, C.pink, 3.5) + R(1966, 252, 50, 74, 8, C.mint, 3.5);
  // divider
  s += R(bx - 40, -600, 80, 1240, 0, '#fff7e8') + L(bx - 40, -600, bx - 40, 640, 4) + L(bx + 40, -600, bx + 40, 640, 4);
  // floors
  s += Rf(-600, 620, W + 1400, 26, 0, '#ffffff') + L(-600, 620, W + 800, 620, 4) + L(-600, 646, W + 800, 646, 4);
  s += Rf(-600, 646, bx + 600, 900, 0, '#f6c9dc');
  for (let y = 680; y < 1400; y += 40) s += L(-600, y, bx, y, 2, '#eab3cb', 0.6);
  for (let y = 646; y < 1400; y += 64) for (let x = bx; x < W + 800; x += 64) s += Rf(x, y, 64, 64, 0, (((x - bx) / 64 + (y - 646) / 64) | 0) % 2 ? '#ffffff' : '#d9eefc');
  s += El(620, 840, 300, 50, C.yellow, 4) + El(620, 840, 250, 34, C.yellowL, 0) + `<ellipse cx="620" cy="840" rx="210" ry="24" fill="none" stroke="${C.orange}" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round"/>`;
  s += El(1900, 850, 160, 34, C.mint, 4);
  return s;
}

export const BEDROOM: LocationDef = {
  id: 'bedroom',
  width: W,
  floor: { top: 690, bottom: 880 },
  bg,
  music: 'calm',
  seed: 7,
  hasLights: true,
  map: { x: 360, y: 520 },
  nameKey: 'loc.bedroom',
  place: [
    { def: 'door_home', x: 140, y: 640 },
    { def: 'bedlamp', x: 300, y: 774, s: { on: true } },
    { def: 'bed', x: 590, y: 780 },
    { def: 'wardrobe', x: 940, y: 770, s: { open: false } },
    { def: 'bunkbed', x: 1220, y: 780 },
    { def: 'toybox', x: 1400, y: 860 },
    { def: 'lightswitch', x: 1400, y: 450, s: { on: true } },
    { def: 'bathtub', x: 1720, y: 800, s: { on: true }, kids: [[1, 'duck']] },
    { def: 'toilet', x: 2020, y: 780 },
    { def: 'bathsink', x: 2240, y: 780, kids: [[0, 'toothbrush'], [1, 'soap']] },
    { def: 'towel', x: 1940, y: 870 },
    { def: 'hairbrush', x: 2120, y: 860 },
    { def: 'book', x: 760, y: 870 },
  ],
  chars: [
    { roster: 'savta', x: 740, y: 700 },
    { roster: 'lia', x: 1140, y: 868 },
  ],
  pets: [{ kind: 'dog', color: 1, x: 420, y: 860 }],
};
