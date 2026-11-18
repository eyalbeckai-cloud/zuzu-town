// Home: living room + kitchen
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, shine, shade, cloudPath, heartPath, starPath, stripes, dots, T } from '../../art/kit';
import type { ThingDef, LocationDef } from '../types';

const W = 2600;

// ------------------------------------------------------------- furniture

const sofa: ThingDef = {
  id: 'sofa', tags: [], fixed: true,
  art: { w: 400, h: 190, art: () => svg(400, 190,
    R(22, 18, 356, 96, 26, C.pink) +
    Ps('M140 26 V100 M260 26 V100', 4, C.pinkD) +
    shine(40, 28, 80, 10, 5, 0.4) +
    R(10, 92, 380, 50, 18, C.pinkL) + Ps('M140 96 V136 M260 96 V136', 3, C.pinkD, 0.7) +
    R(0, 60, 52, 92, 20, C.pinkD) + R(348, 60, 52, 92, 20, C.pinkD) +
    R(16, 132, 368, 32, 10, C.pinkD) +
    R(42, 160, 16, 26, 4, C.woodD, 3.5) + R(342, 160, 16, 26, 4, C.woodD, 3.5) +
    Ci(80, 70, 22, C.yellow, 3.5) + Ci(320, 70, 22, C.mint, 3.5) + `<path d="${starPath(80, 70, 10)}" fill="#fff" opacity=".7"/>` + `<path d="${heartPath(320, 72, 9)}" fill="#fff" opacity=".7"/>`
  ) },
  slots: [
    { x: -120, y: -96, accept: ['char', 'pet', 'toy'], pose: 'sit' },
    { x: 0, y: -96, accept: ['char', 'pet', 'toy'], pose: 'sit' },
    { x: 120, y: -96, accept: ['char', 'pet', 'toy'], pose: 'sit' },
  ],
};

const armchair: ThingDef = {
  id: 'armchair', tags: [], fixed: true,
  art: { w: 200, h: 180, art: () => svg(200, 180,
    R(24, 16, 152, 92, 30, C.mint) + shine(40, 26, 50, 9, 5, 0.4) +
    R(14, 86, 172, 44, 16, C.mintL) +
    R(0, 58, 42, 86, 18, C.mintD) + R(158, 58, 42, 86, 18, C.mintD) +
    R(12, 126, 176, 28, 10, C.mintD) +
    R(30, 150, 14, 28, 4, C.woodD, 3.5) + R(156, 150, 14, 28, 4, C.woodD, 3.5)) },
  slots: [{ x: 0, y: -90, accept: ['char', 'pet', 'toy'], pose: 'sit' }],
};

const coffeeTable: ThingDef = {
  id: 'coffeetable', tags: [], fixed: true,
  art: { w: 240, h: 96, art: () => svg(240, 96,
    R(18, 26, 14, 66, 4, C.woodD) + R(208, 26, 14, 66, 4, C.woodD) + R(60, 50, 120, 10, 4, C.woodD, 3) +
    R(4, 8, 232, 24, 10, C.wood) + shine(16, 12, 90, 5, 3, 0.45)) },
  slots: [
    { x: -76, y: -88, accept: ['item'], pose: 'place' },
    { x: 0, y: -88, accept: ['item'], pose: 'place' },
    { x: 76, y: -88, accept: ['item'], pose: 'place' },
  ],
};

const tv: ThingDef = {
  id: 'tv', tags: [], fixed: true, tap: 'tv', sound: 'tv',
  art: {
    w: 260, h: 262, variants: ['off', 'on'],
    art: (v) => svg(260, 262,
      R(14, 168, 232, 88, 12, C.woodL) + R(26, 182, 98, 62, 8, C.wood, 3.5) + R(136, 182, 98, 62, 8, C.wood, 3.5) +
      Ci(112, 213, 4, C.woodD, 3) + Ci(148, 213, 4, C.woodD, 3) +
      R(110, 150, 40, 22, 4, C.greyDD) +
      R(16, 4, 228, 152, 16, C.greyDD) +
      R(30, 16, 200, 128, 8, v === 'on' ? '#9fe0ff' : '#3c4a66', 3) +
      (v === 'off' ? shine(42, 26, 60, 10, 5, 0.25) + Pf('M150 20 L200 20 L120 140 L70 140Z', '#ffffff', 0.06) : '') +
      Ci(232, 150, 0.1, C.greyDD, 0)),
  },
  variant: (s) => (s.on ? 'on' : 'off'),
};

const floorLamp: ThingDef = {
  id: 'floorlamp', tags: [], fixed: true, tap: 'light', sound: 'click',
  light: { x: 0, y: -280, r: 320 },
  art: {
    w: 120, h: 330, variants: ['off', 'on'],
    art: (v) => svg(120, 330,
      El(60, 318, 40, 10, C.greyDD) + R(55, 70, 10, 246, 5, C.greyD) +
      P('M22 86 L36 10 H84 L98 86Z', v === 'on' ? C.yellowL : C.yellow) +
      (v === 'on' ? Ef(60, 90, 30, 6, '#fff7c2', 0.9) : '') +
      Ps('M40 30 H80', 3, C.yellowD, 0.6) + L(88, 86, 88, 120, 3) + Ci(88, 124, 5, C.rose, 3)),
  },
  variant: (s) => (s.on ? 'on' : 'off'),
};

const plant: ThingDef = {
  id: 'plant', tags: [], fixed: true, tap: 'bounce', sound: 'blip',
  art: { w: 120, h: 200, art: () => svg(120, 200,
    P('M60 120 Q20 70 22 30 Q50 50 60 110Z', C.green) + P('M60 120 Q100 70 100 26 Q70 50 60 110Z', C.greenD) +
    P('M60 120 Q50 50 62 6 Q76 50 62 118Z', C.green) + P('M60 124 Q14 110 6 78 Q40 84 58 118Z', C.greenD) + P('M62 124 Q104 112 114 82 Q80 86 62 118Z', C.green) +
    P('M26 124 H94 L84 194 H36Z', C.orange) + R(20, 116, 80, 18, 6, C.orangeD) + Ps('M40 150 Q60 160 80 150', 3, '#ffffff', 0.5)) },
};

const lightSwitch: ThingDef = {
  id: 'lightswitch', tags: [], fixed: true, tap: 'light', sound: 'click', z: -50,
  art: {
    w: 46, h: 66, variants: ['off', 'on'], outline: 3,
    art: (v) => svg(46, 66, R(4, 4, 38, 58, 9, '#ffffff', 3.5) + R(15, 15, 16, 36, 5, C.greyL, 3) + R(17, v === 'on' ? 17 : 31, 12, 18, 4, v === 'on' ? C.yellow : C.greyD, 3)),
  },
  variant: (s) => (s.on === false ? 'off' : 'on'),
};

const radio: ThingDef = {
  id: 'radio', tags: [], fixed: true, tap: 'radio', sound: 'toggle',
  art: {
    w: 124, h: 92, variants: ['off', 'on'],
    art: (v) => svg(124, 92,
      Ps('M24 26 L40 4', 4) + Ci(40, 4, 3, C.ol, 0) +
      R(6, 24, 112, 64, 14, C.red) + R(16, 34, 52, 44, 10, C.cream, 3.5) +
      Ps('M24 44 H60 M24 52 H60 M24 60 H60 M24 68 H60', 3, C.redD, 0.7) +
      Ci(92, 46, 12, v === 'on' ? C.yellow : C.greyL, 3.5) + L(92, 46, 98, 40, 3) +
      R(78, 64, 28, 12, 6, v === 'on' ? C.mint : C.greyD, 3) + shine(12, 28, 30, 5, 3, 0.35)),
  },
  variant: (s) => (s.on ? 'on' : 'off'),
};

function doorArt(icon: string, col: string) {
  return svg(170, 300,
    R(4, 4, 162, 296, 14, C.woodL) + R(16, 16, 138, 284, 10, col) +
    R(30, 36, 110, 100, 10, shade(col, 0.15), 3.5) + R(30, 160, 110, 110, 10, shade(col, 0.15), 3.5) +
    Ci(136, 160, 8, C.yellow, 3.5) + G('translate(85 86)', icon));
}

export const ICON_BED = R(-36, -6, 72, 26, 8, C.blueL, 3.5) + R(-40, -24, 18, 50, 6, C.wood, 3.5) + Ci(-12, -6, 9, '#ffffff', 3) + Ps('M-40 26 V32 M36 20 V32', 4);
export const ICON_SOFA = R(-36, -18, 72, 26, 10, C.pink, 3.5) + R(-40, 2, 80, 18, 8, C.pinkL, 3.5) + Ps('M-34 20 V28 M34 20 V28', 4);

const doorUp: ThingDef = {
  id: 'door_bedroom', tags: [], fixed: true, door: 'bedroom', sound: 'door', z: -60,
  art: { w: 170, h: 300, art: () => doorArt(ICON_BED, C.blue) },
};

const fridge: ThingDef = {
  id: 'fridge', tags: [], fixed: true, tap: 'open', sound: 'door',
  art: {
    w: 250, h: 360, ax: 92, variants: ['closed', 'open'],
    art: (v) => svg(250, 360, v === 'closed'
      ? R(6, 6, 172, 350, 22, '#ffffff') + L(8, 112, 176, 112, 4) + R(150, 36, 12, 50, 6, C.greyD, 3) + R(150, 140, 12, 80, 6, C.greyD, 3) +
        shine(22, 20, 14, 70, 7, 0.6) + shine(22, 128, 14, 150, 7, 0.6) + Ci(50, 60, 10, C.rose, 3) + Ci(60, 170, 12, C.yellow, 3) + `<path d="${starPath(60, 170, 6)}" fill="#fff"/>` + R(36, 200, 34, 26, 3, '#ffffff', 3) + Ps('M42 208 H64 M42 216 H58', 2.5, C.blue)
      : R(6, 6, 172, 350, 22, '#ffffff') + R(18, 18, 148, 326, 14, '#e8f6ff') + L(8, 112, 176, 112, 4) +
        R(20, 116, 144, 8, 3, C.blueL, 3) + R(20, 196, 144, 8, 3, C.blueL, 3) + R(20, 276, 144, 8, 3, C.blueL, 3) +
        R(30, 34, 40, 30, 6, C.blueL, 3) + R(80, 34, 40, 30, 6, C.blueL, 3) +
        P('M178 12 L240 30 L240 340 L178 354Z', '#ffffff') + Ps('M190 60 L230 70 M190 170 L230 176', 3, C.greyD) + R(196, 100, 10, 60, 5, C.greyD, 3)),
  },
  variant: (s) => (s.open ? 'open' : 'closed'),
  slots: [
    { x: -40, y: -244, accept: ['item'], pose: 'place', inside: true, restock: 'milk' },
    { x: 40, y: -244, accept: ['item'], pose: 'place', inside: true, restock: 'cheese' },
    { x: -40, y: -164, accept: ['item'], pose: 'place', inside: true, restock: 'apple' },
    { x: 40, y: -164, accept: ['item'], pose: 'place', inside: true, restock: 'juice' },
    { x: -40, y: -84, accept: ['item'], pose: 'place', inside: true, restock: 'egg' },
    { x: 40, y: -84, accept: ['item'], pose: 'place', inside: true, restock: 'watermelon' },
  ],
};

const stove: ThingDef = {
  id: 'stove', tags: [], fixed: true, tap: 'toggle', sound: 'toggle', cooks: 'stove',
  art: {
    w: 210, h: 244, variants: ['off', 'on'],
    art: (v) => svg(210, 244,
      R(6, 4, 198, 34, 10, C.steel) + Ci(40, 21, 7, C.greyDD, 3) + Ci(70, 21, 7, C.greyDD, 3) + Ci(140, 21, 7, C.greyDD, 3) + Ci(170, 21, 7, C.greyDD, 3) +
      R(4, 36, 202, 204, 12, '#ffffff') + R(2, 36, 206, 18, 6, C.steelD) +
      El(60, 44, 34, 7, v === 'on' ? C.red : C.greyDD, 3) + El(150, 44, 34, 7, v === 'on' ? C.red : C.greyDD, 3) +
      R(22, 72, 166, 150, 12, C.steel) + R(40, 92, 130, 86, 10, v === 'on' ? '#ffb15c' : '#4a4060', 3.5) + R(54, 76, 102, 10, 5, C.greyD, 3) +
      (v === 'on' ? Ef(105, 135, 50, 26, '#ffe08a', 0.7) : shine(50, 100, 40, 8, 4, 0.2))),
  },
  variant: (s) => (s.on ? 'on' : 'off'),
  slots: [
    { x: -45, y: -200, accept: ['egg', 'dough', 'batter', 'food'], pose: 'place' },
    { x: 45, y: -200, accept: ['egg', 'dough', 'batter', 'food'], pose: 'place' },
  ],
};

const sink: ThingDef = {
  id: 'sink', tags: [], fixed: true, tap: 'toggle', sound: 'toggle',
  art: {
    w: 250, h: 250, variants: ['off', 'on'],
    art: (v) => svg(250, 250,
      Ps('M126 60 V22 Q126 8 140 8 H150 Q162 8 162 22 V30', 10, C.ol) + Ps('M126 60 V22 Q126 8 140 8 H150 Q162 8 162 22 V30', 4, C.steel) +
      R(108, 40, 36, 10, 5, C.steelD, 3) +
      R(10, 74, 230, 172, 12, C.mintL) + R(24, 96, 96, 136, 10, C.mint, 3.5) + R(130, 96, 96, 136, 10, C.mint, 3.5) +
      Ci(106, 164, 5, C.mintD, 3) + Ci(144, 164, 5, C.mintD, 3) +
      R(0, 56, 250, 22, 8, C.cream) + R(62, 60, 110, 10, 5, C.steelD, 3) +
      (v === 'on' ? '' : '')),
  },
  variant: (s) => (s.on ? 'on' : 'off'),
  slots: [
    { x: -96, y: -194, accept: ['item'], pose: 'place' },
    { x: 92, y: -194, accept: ['item'], pose: 'place' },
  ],
};

const cookieJar: ThingDef = {
  id: 'cookiejar', tags: [], fixed: true, tap: 'spawn', spawn: ['cookie', 'cookie', 'cupcake', 'donut'], sound: 'pop', spawnAt: { x: 0, y: -60 },
  art: { w: 76, h: 86, art: () => svg(76, 86,
    R(14, 2, 48, 14, 6, C.wood) + Ci(38, 2, 6, C.woodD, 3) +
    P('M10 18 H66 Q72 18 72 30 V76 Q72 84 62 84 H14 Q4 84 4 76 V30 Q4 18 10 18Z', C.glass) +
    Ci(26, 60, 12, '#e5ad6a', 3) + Ci(48, 64, 12, '#e5ad6a', 3) + Ci(38, 44, 12, '#e5ad6a', 3) +
    Cf(24, 58, 2.5, C.brownD) + Cf(50, 62, 2.5, C.brownD) + Cf(36, 42, 2.5, C.brownD) + shine(10, 26, 6, 40, 3, 0.6)) },
};

const kitchenTable: ThingDef = {
  id: 'kitchentable', tags: [], fixed: true,
  art: { w: 290, h: 140, art: () => svg(290, 140,
    R(26, 40, 16, 98, 5, C.woodD) + R(248, 40, 16, 98, 5, C.woodD) +
    R(4, 6, 282, 18, 8, C.wood) +
    P('M4 14 H286 V58 Q270 64 254 58 Q238 64 222 58 Q206 64 190 58 Q174 64 158 58 Q142 64 126 58 Q110 64 94 58 Q78 64 62 58 Q46 64 30 58 Q16 64 4 58Z', '#ffffff') +
    Rf(20, 16, 18, 42, 0, C.red, 0.45) + Rf(74, 16, 18, 42, 0, C.red, 0.45) + Rf(128, 16, 18, 42, 0, C.red, 0.45) + Rf(182, 16, 18, 42, 0, C.red, 0.45) + Rf(236, 16, 18, 42, 0, C.red, 0.45) +
    Rf(4, 26, 282, 12, 0, C.red, 0.35)) },
  slots: [
    { x: -100, y: -134, accept: ['item'], pose: 'place' },
    { x: -34, y: -134, accept: ['item'], pose: 'place' },
    { x: 34, y: -134, accept: ['item'], pose: 'place' },
    { x: 100, y: -134, accept: ['item'], pose: 'place' },
  ],
};

export const chair: ThingDef = {
  id: 'chair', tags: [], fixed: true,
  art: { w: 112, h: 186, art: () => svg(112, 186,
    R(18, 4, 76, 92, 16, C.yellow) + R(30, 16, 52, 50, 10, C.yellowL, 3) +
    R(18, 96, 12, 88, 4, C.woodD) + R(82, 96, 12, 88, 4, C.woodD) +
    R(8, 86, 96, 20, 8, C.yellowD)) },
  slots: [{ x: 0, y: -92, accept: ['char', 'pet', 'toy'], pose: 'sit' }],
};

export const HOME_DEFS: ThingDef[] = [sofa, armchair, coffeeTable, tv, floorLamp, plant, lightSwitch, radio, doorUp, fridge, stove, sink, cookieJar, kitchenTable, chair];

// ------------------------------------------------------------- background

function bg() {
  const kx = 1480;
  let s = '';
  // living wall
  s += Rf(-600, -600, kx + 600, 1250, 0, '#fff0cc');
  s += dots(-600, -600, kx + 600, 1240, '#ffd98f', 46, 5, 0.35);
  s += Rf(-600, 470, kx + 600, 170, 0, '#ffe2a8');
  s += L(-600, 470, kx, 470, 6, '#f2c97c');
  // kitchen wall
  s += Rf(kx, -600, W - kx + 700, 1250, 0, '#dff5ec');
  // backsplash tiles
  for (let y = 380; y < 600; y += 44) for (let x = kx + 20; x < W + 600; x += 44) s += Rf(x + 2, y + 2, 40, 40, 6, ((x / 44 + y / 44) | 0) % 2 ? '#ffffff' : '#c9efe2');
  // upper cabinets
  s += R(kx + 60, 110, 300, 190, 12, C.mintL) + R(kx + 76, 126, 128, 158, 8, '#ffffff', 3) + R(kx + 216, 126, 128, 158, 8, '#ffffff', 3);
  s += Ci(kx + 194, 270, 5, C.mintD, 3) + Ci(kx + 226, 270, 5, C.mintD, 3);
  // kitchen window
  s += R(kx + 440, 100, 220, 200, 14, '#ffffff') + R(kx + 456, 116, 188, 168, 8, C.sky, 3) + P(cloudPath(kx + 480, 150, 90, 36), '#ffffff', 3) + L(kx + 550, 116, kx + 550, 284, 6, '#ffffff') + L(kx + 456, 200, kx + 644, 200, 6, '#ffffff');
  s += R(kx + 720, 110, 380, 190, 12, C.mintL) + R(kx + 736, 126, 170, 158, 8, '#ffffff', 3) + R(kx + 916, 126, 170, 158, 8, '#ffffff', 3);
  // shelf with jars
  s += R(kx + 760, 330, 250, 16, 6, C.wood) + R(kx + 780, 290, 34, 40, 6, C.yellowL, 3) + R(kx + 830, 280, 40, 50, 8, C.pinkL, 3) + R(kx + 890, 296, 30, 34, 6, C.purpleL, 3);
  // arch / divider
  s += R(kx - 40, -600, 80, 1240, 0, '#fff7e8');
  s += L(kx - 40, -600, kx - 40, 640, 4) + L(kx + 40, -600, kx + 40, 640, 4);
  // window living room
  s += R(430, 120, 300, 300, 18, '#ffffff');
  const [gd, gu] = ['', C.sky];
  s += gd + R(448, 138, 264, 264, 10, gu, 3);
  s += Cf(650, 190, 28, C.yellowL) + Cf(650, 190, 20, C.yellow);
  s += P(cloudPath(470, 210, 120, 44), '#ffffff', 3) + P(cloudPath(560, 300, 110, 40), '#ffffff', 3);
  s += Pf('M448 360 Q520 330 600 352 Q660 368 712 350 V402 H448Z', C.green);
  s += L(580, 138, 580, 402, 7, '#ffffff') + L(448, 270, 712, 270, 7, '#ffffff');
  // curtains
  s += P('M400 96 Q420 260 396 440 H460 Q446 260 470 96Z', C.rose) + P('M760 96 Q740 260 764 440 H700 Q714 260 690 96Z', C.rose);
  s += R(380, 84, 400, 20, 10, C.woodD);
  // garland
  s += Ps('M60 60 Q260 130 460 60 M780 60 Q980 130 1180 60', 4, C.greyDD);
  for (let i = 0; i < 9; i++) {
    const x = 90 + i * 42;
    const y = 60 + Math.sin((i / 8) * Math.PI) * 34;
    s += P(`M${x - 13} ${y} L${x + 13} ${y} L${x} ${y + 26}Z`, [C.yellow, C.mint, C.pink, C.blue][i % 4], 3);
    const x2 = 810 + i * 42;
    s += P(`M${x2 - 13} ${y} L${x2 + 13} ${y} L${x2} ${y + 26}Z`, [C.purple, C.orange, C.mint, C.rose][i % 4], 3);
  }
  // picture frames
  s += R(900, 160, 160, 130, 10, C.wood) + R(914, 174, 132, 102, 4, '#ffffff', 3) + Pf('M914 276 L960 220 L990 250 L1014 230 L1046 276Z', C.greenL) + Cf(1010, 200, 12, C.yellow);
  s += R(1110, 190, 90, 90, 45, C.purple) + `<path d="${heartPath(1155, 236, 22)}" fill="${C.rose}" stroke="${C.ol}" stroke-width="3.5"/>`;
  // shelf for radio
  s += R(840, 356, 260, 18, 6, C.woodD) + P('M870 374 L890 374 L880 398Z', C.woodD, 3) + P('M1050 374 L1070 374 L1060 398Z', C.woodD, 3);
  s += R(1040, 312, 18, 44, 3, C.blue, 3) + R(1060, 318, 16, 38, 3, C.yellow, 3) + R(1078, 306, 14, 50, 3, C.rose, 3);
  // clock
  s += Ci(1290, 170, 46, '#ffffff') + Ci(1290, 170, 38, C.yellowL, 3) + L(1290, 170, 1290, 142, 5) + L(1290, 170, 1310, 180, 5) + Cf(1290, 170, 5, C.ol);
  // baseboard + floors
  s += Rf(-600, 620, W + 1300, 26, 0, '#ffffff') + L(-600, 620, W + 700, 620, 4) + L(-600, 646, W + 700, 646, 4);
  s += Rf(-600, 646, kx + 600, 900, 0, '#f0c08a');
  for (let y = 680; y < 1400; y += 52) s += L(-600, y, kx, y, 3, '#d9a066', 0.8);
  for (let y = 646, r = 0; y < 1400; y += 52, r++) for (let x = -600 + (r % 2) * 130; x < kx; x += 260) s += L(x, y, x, y + 52, 3, '#d9a066', 0.8);
  // kitchen floor tiles
  for (let y = 646; y < 1400; y += 70) for (let x = kx; x < W + 700; x += 70) s += Rf(x, y, 70, 70, 0, (((x - kx) / 70 + (y - 646) / 70) | 0) % 2 ? '#ffffff' : '#ffd6e6');
  // rug
  s += El(430, 830, 330, 56, C.purpleL, 4) + El(430, 830, 290, 40, C.purple, 0) + `<ellipse cx="430" cy="830" rx="250" ry="28" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 12" opacity=".7"/>`;
  return s;
}

export const HOME: LocationDef = {
  id: 'home',
  width: W,
  floor: { top: 690, bottom: 880 },
  bg,
  music: 'calm',
  seed: 3,
  hasLights: true,
  map: { x: 360, y: 520 },
  nameKey: 'loc.home',
  place: [
    { def: 'door_bedroom', x: 150, y: 640 },
    { def: 'floorlamp', x: 70, y: 770 },
    { def: 'sofa', x: 430, y: 770, kids: [[2, 'teddy']] },
    { def: 'armchair', x: 760, y: 770 },
    { def: 'coffeetable', x: 430, y: 862, kids: [[0, 'cupcake'], [2, 'apple']] },
    { def: 'radio', x: 960, y: 358 },
    { def: 'tv', x: 1080, y: 760, s: { on: false } },
    { def: 'plant', x: 1300, y: 760 },
    { def: 'lightswitch', x: 1390, y: 450, s: { on: true } },
    { def: 'fridge', x: 1600, y: 770, s: { open: false } },
    { def: 'stove', x: 1840, y: 770, kids: [[0, 'egg']] },
    { def: 'sink', x: 2090, y: 770, kids: [[1, 'batter']] },
    { def: 'cookiejar', x: 1990, y: 576 },
    { def: 'chair', x: 2260, y: 800 },
    { def: 'chair', x: 2530, y: 800 },
    { def: 'kitchentable', x: 2395, y: 820, kids: [[0, 'milk'], [1, 'sandwich'], [3, 'banana']] },
    { def: 'ball', x: 860, y: 860 },
    { def: 'toycar', x: 1230, y: 870 },
    { def: 'blocks', x: 560, y: 884 },
  ],
  chars: [
    { roster: 'mom', x: 1720, y: 860 },
    { roster: 'noa', x: 310, y: 674 },
    { roster: 'ben', x: 960, y: 850 },
    { roster: 'baby', x: 640, y: 878 },
    { roster: 'dad', x: 2180, y: 860 },
  ],
  pets: [{ kind: 'cat', color: 0, x: 760, y: 680 }],
};
