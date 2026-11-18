// The supermarket (paid pack)
import { C, svg, R, Ci, El, P, Pf, Ps, L, Rf, Cf, shine, shade, cloudPath, starPath, heartPath, stripes } from '../../art/kit';
import type { ThingDef, LocationDef } from '../types';

const W = 2600;

function crate(x: number, y: number, w: number, h: number, c: string) {
  return R(x, y, w, h, 8, c) + Ps(`M${x + 10} ${y + h / 2} H${x + w - 10}`, 3, shade(c, 0.18)) + R(x + w / 2 - 22, y + 10, 44, 16, 6, '#ffffff', 3);
}

const produce: ThingDef = {
  id: 'produce', tags: [], fixed: true, autoRestock: true,
  art: { w: 440, h: 280, art: () => svg(440, 280,
    R(24, 230, 20, 46, 5, C.woodD) + R(396, 230, 20, 46, 5, C.woodD) +
    crate(10, 168, 205, 70, C.wood) + crate(225, 168, 205, 70, C.woodL) +
    crate(40, 90, 170, 66, C.woodL) + crate(230, 90, 170, 66, C.wood) +
    R(150, 10, 140, 54, 14, C.green) + `<path d="${heartPath(220, 40, 14)}" fill="#ffffff" stroke="${C.ol}" stroke-width="3"/>` + Ps('M220 64 V90', 4)) },
  slots: [
    { x: -110, y: -186, accept: ['item'], pose: 'place', restock: 'apple', r: 70 },
    { x: 100, y: -186, accept: ['item'], pose: 'place', restock: 'banana', r: 70 },
    { x: -160, y: -110, accept: ['item'], pose: 'place', restock: 'carrot', r: 70 },
    { x: -55, y: -110, accept: ['item'], pose: 'place', restock: 'apple', r: 70 },
    { x: 55, y: -110, accept: ['item'], pose: 'place', restock: 'watermelon', r: 70 },
    { x: 160, y: -110, accept: ['item'], pose: 'place', restock: 'banana', r: 70 },
  ],
};

const dairy: ThingDef = {
  id: 'dairyfridge', tags: [], fixed: true, tap: 'open', sound: 'door',
  art: {
    w: 300, h: 380, variants: ['closed', 'open'],
    art: (v) => {
      const body = R(6, 6, 288, 370, 18, C.blueL) + R(6, 6, 288, 46, 18, C.blue) + Ps('M60 30 H240', 6, '#ffffff', 0.9) +
        R(22, 66, 256, 290, 10, '#eef8ff') +
        R(28, 140, 244, 8, 3, C.steelD, 3) + R(28, 222, 244, 8, 3, C.steelD, 3) + R(28, 304, 244, 8, 3, C.steelD, 3);
      const doors = v === 'closed'
        ? R(22, 66, 126, 290, 10, C.glass, 4) + R(152, 66, 126, 290, 10, C.glass, 4) + Pf('M40 80 L80 80 L50 340 L32 340Z', '#ffffff', 0.55) + Pf('M170 80 L200 80 L176 340 L162 340Z', '#ffffff', 0.5) +
          R(134, 170, 8, 60, 4, C.greyD, 3) + R(158, 170, 8, 60, 4, C.greyD, 3)
        : P('M22 66 L-2 80 V342 L22 356Z', C.glass) + P('M278 66 L302 80 V342 L278 356Z', C.glass);
      return svg(300, 380, body + doors);
    },
  },
  variant: (s) => (s.open ? 'open' : 'closed'),
  slots: [
    { x: -60, y: -250, accept: ['item'], pose: 'place', inside: true, restock: 'milk' },
    { x: 60, y: -250, accept: ['item'], pose: 'place', inside: true, restock: 'juice' },
    { x: -60, y: -168, accept: ['item'], pose: 'place', inside: true, restock: 'cheese' },
    { x: 60, y: -168, accept: ['item'], pose: 'place', inside: true, restock: 'egg' },
    { x: -60, y: -86, accept: ['item'], pose: 'place', inside: true, restock: 'milk' },
    { x: 60, y: -86, accept: ['item'], pose: 'place', inside: true, restock: 'pizza' },
  ],
};

const freezer: ThingDef = {
  id: 'freezer', tags: [], fixed: true, tap: 'open', sound: 'whoosh',
  art: {
    w: 320, h: 200, variants: ['closed', 'open'],
    art: (v) => svg(320, 200,
      R(10, 70, 300, 126, 16, '#ffffff') + R(10, 150, 300, 46, 16, C.blue) + Pf('M40 172 H280', '#ffffff') + Ps('M40 172 H280', 5, '#ffffff', 0.8) +
      (v === 'closed'
        ? R(4, 46, 312, 40, 12, C.glass) + Pf('M30 54 L70 54 L56 80 L20 80Z', '#ffffff', 0.7) + Pf('M110 54 L130 54 L118 80 L100 80Z', '#ffffff', 0.6)
        : R(18, 60, 284, 40, 8, '#cfeeff') + P('M4 60 L20 6 H300 L316 60Z', C.glass) + Pf('M40 14 L80 14 L60 56 L24 56Z', '#ffffff', 0.6))) },
  variant: (s) => (s.open ? 'open' : 'closed'),
  slots: [
    { x: -90, y: -132, accept: ['item'], pose: 'place', inside: true, restock: 'icecream' },
    { x: 0, y: -132, accept: ['item'], pose: 'place', inside: true, restock: 'icecream' },
    { x: 90, y: -132, accept: ['item'], pose: 'place', inside: true, restock: 'icecream' },
  ],
};

function box(x: number, y: number, w: number, h: number, c: string, mark: string) {
  return R(x, y, w, h, 5, c, 3.5) + Rf(x + 5, y + 8, w - 10, 12, 3, '#ffffff', 0.75) + mark;
}

const shelf: ThingDef = {
  id: 'shelf', tags: [], fixed: true, autoRestock: true,
  art: { w: 380, h: 360, art: () => {
    let s = R(6, 6, 368, 350, 14, C.purpleL) + R(20, 20, 340, 322, 8, '#f7f3ff');
    for (const y of [116, 226, 336]) s += R(14, y, 352, 14, 5, C.purple);
    s += box(30, 40, 56, 76, C.red, Ci(58, 82, 12, C.yellow, 3)) + box(92, 50, 56, 66, C.yellow, `<path d="${starPath(120, 88, 12)}" fill="${C.red}"/>`) +
      box(154, 36, 56, 80, C.mint, Ci(182, 84, 11, '#ffffff', 3)) + box(216, 50, 56, 66, C.orange, `<path d="${heartPath(244, 86, 10)}" fill="#ffffff"/>`) + box(278, 40, 62, 76, C.blue, Ci(309, 82, 12, C.pinkL, 3));
    return svg(380, 360, s);
  } },
  slots: [
    { x: -110, y: -146, accept: ['item'], pose: 'place', restock: 'bread', r: 70 },
    { x: 0, y: -146, accept: ['item'], pose: 'place', restock: 'cookie', r: 70 },
    { x: 110, y: -146, accept: ['item'], pose: 'place', restock: 'croissant', r: 70 },
    { x: -110, y: -36, accept: ['item'], pose: 'place', restock: 'sandwich', r: 70 },
    { x: 0, y: -36, accept: ['item'], pose: 'place', restock: 'donut', r: 70 },
    { x: 110, y: -36, accept: ['item'], pose: 'place', restock: 'cheese', r: 70 },
  ],
};

const checkout: ThingDef = {
  id: 'checkout', tags: [], fixed: true, tap: 'ring', sound: 'blip',
  art: { w: 460, h: 240, art: () => svg(460, 240,
    R(10, 70, 440, 166, 14, C.mintL) + R(24, 96, 200, 120, 10, '#ffffff', 3.5) + stripes(28, 100, 192, 112, C.mint, 16, 7, 0.5) +
    R(236, 96, 200, 120, 10, '#ffffff', 3.5) +
    R(0, 52, 460, 28, 10, C.greyDD) + R(14, 58, 300, 16, 6, '#4a4060', 0) + Ps('M30 66 H300', 3, '#ffffff', 0.25) +
    R(330, 38, 100, 30, 8, '#2b3446') + Pf('M346 52 H414', '#ff6b6b') + Ps('M346 53 H414', 3, C.red, 0.9)) },
  slots: [
    { x: -170, y: -184, accept: ['item'], pose: 'place', r: 70 },
    { x: -100, y: -184, accept: ['item'], pose: 'place', r: 70 },
    { x: -30, y: -184, accept: ['item'], pose: 'place', r: 70 },
  ],
};

const cart: ThingDef = {
  id: 'cart', tags: [], z: 6,
  art: { w: 260, h: 230, art: () => svg(260, 230,
    Ps('M8 22 H40 L64 160 H216', 8, C.greyDD) + R(0, 12, 22, 22, 8, C.red) +
    P('M44 48 H246 L226 150 H62Z', C.steel) + Ps('M60 82 H238 M66 116 H230 M96 48 L104 150 M140 48 V150 M184 48 L180 150 M222 48 L212 150', 3.5, C.steelD) +
    P('M44 48 H246 L226 150 H62Z', 'none') + R(36, 38, 220, 14, 6, C.red) +
    Ci(88, 196, 18, C.greyDD) + Ci(88, 196, 7, C.grey, 3) + Ci(204, 196, 18, C.greyDD) + Ci(204, 196, 7, C.grey, 3) + Ps('M88 176 V160 M204 176 V160', 6, C.greyDD)) },
  slots: [
    { x: -40, y: -176, accept: ['char', 'pet', 'toy'], pose: 'sit', scale: 0.92, r: 90 },
    { x: 20, y: -150, accept: ['item'], pose: 'place', r: 80 },
    { x: 80, y: -150, accept: ['item'], pose: 'place', r: 80 },
  ],
};

const candy: ThingDef = {
  id: 'candymachine', tags: [], fixed: true, tap: 'spawn', spawn: ['lollipop', 'lollipop', 'cookie'], sound: 'boing', spawnAt: { x: 0, y: -60 },
  art: { w: 140, h: 270, art: () => svg(140, 270,
    R(46, 150, 48, 112, 10, C.red) + R(30, 250, 80, 16, 6, C.redD) + R(56, 176, 28, 20, 6, C.greyL, 3) + Ci(70, 222, 10, C.yellow, 3) +
    Ci(70, 82, 64, C.glass) + Cf(46, 96, 11, C.pink) + Cf(76, 110, 11, C.yellow) + Cf(98, 86, 11, C.mint) + Cf(60, 64, 11, C.purple) + Cf(88, 56, 10, C.orange) + Cf(50, 124, 10, C.blue) + Cf(92, 122, 10, C.red) +
    Pf('M34 52 Q50 26 76 24', '#ffffff', 0) + Ps('M36 58 Q46 32 74 26', 6, '#ffffff', 0.8) + R(52, 10, 36, 14, 6, C.red)) },
};

const fruitscale: ThingDef = {
  id: 'fruitscale', tags: [], fixed: true,
  art: { w: 170, h: 120, art: () => svg(170, 120,
    R(10, 56, 150, 60, 12, '#ffffff') + El(85, 52, 74, 14, C.steel) + R(46, 78, 78, 26, 6, '#2b3446', 3)) },
  slots: [{ x: 0, y: -62, accept: ['item'], pose: 'place', r: 90 }],
};

export const MARKET_DEFS: ThingDef[] = [produce, dairy, freezer, shelf, checkout, cart, candy, fruitscale];

function bg() {
  let s = '';
  s += Rf(-600, -600, W + 1200, 1250, 0, '#f1fbf4');
  for (let x = -600; x < W + 600; x += 120) s += Rf(x, -600, 60, 1100, 0, '#e3f6e8');
  s += Rf(-600, 450, W + 1200, 180, 0, '#cdeedd') + L(-600, 450, W + 600, 450, 6, C.mintD);
  // aisle signs
  const sign = (x: number, c: string, icon: string) => Ps(`M${x} -600 V60`, 3, C.greyDD) + R(x - 80, 60, 160, 70, 14, c) + icon;
  s += sign(380, C.green, Ci(380, 95, 20, C.red, 3) + Ps('M380 75 Q384 66 392 62', 3, C.brownD));
  s += sign(1000, C.blue, R(368 + 620, 78, 24, 36, 6, '#ffffff', 3) + R(372 + 620, 70, 16, 10, 3, '#ffffff', 3));
  s += sign(1600, C.yellow, `<path d="${starPath(1600, 96, 22)}" fill="#ffffff" stroke="${C.ol}" stroke-width="3" stroke-linejoin="round"/>`);
  s += sign(2240, C.pink, `<path d="${heartPath(2240, 98, 20)}" fill="#ffffff" stroke="${C.ol}" stroke-width="3"/>`);
  // windows with town view
  for (const x of [600, 1320, 1920]) {
    s += R(x, 170, 220, 190, 16, '#ffffff') + R(x + 14, 184, 192, 162, 8, C.sky, 3.5) + Pf(`M${x + 14} 300 H${x + 206} V346 H${x + 14}Z`, '#c9e7a8') + P(cloudPath(x + 70, 220, 70, 28), '#ffffff', 3) + L(x + 110, 184, x + 110, 346, 6, '#ffffff');
  }
  // basket logo
  s += Ci(150, 240, 100, '#ffffff') + Ci(150, 240, 86, C.mintL, 3.5) + P('M96 236 H204 L190 300 H110Z', C.wood, 3.5) + Ps('M114 236 Q150 170 186 236', 6) + Ps('M122 254 L128 290 M150 254 V292 M178 254 L172 290', 3, C.woodDD);
  // floor
  s += Rf(-600, 620, W + 1200, 26, 0, '#ffffff') + L(-600, 620, W + 600, 620, 4) + L(-600, 646, W + 600, 646, 4);
  for (let y = 646; y < 1400; y += 70) for (let x = -600; x < W + 600; x += 70) s += Rf(x, y, 70, 70, 0, (((x + 600) / 70 + (y - 646) / 70) | 0) % 2 ? '#f7f7fb' : '#dcdff0');
  return s;
}

export const MARKET: LocationDef = {
  id: 'market',
  pack: 'full_town',
  width: W,
  floor: { top: 690, bottom: 880 },
  bg,
  music: 'shop',
  seed: 23,
  map: { x: 560, y: 800 },
  nameKey: 'loc.market',
  place: [
    { def: 'produce', x: 380, y: 800 },
    { def: 'fruitscale', x: 690, y: 812 },
    { def: 'dairyfridge', x: 1000, y: 790 },
    { def: 'shelf', x: 1380, y: 790 },
    { def: 'freezer', x: 1760, y: 820 },
    { def: 'candymachine', x: 2000, y: 800 },
    { def: 'checkout', x: 2310, y: 800 },
    { def: 'register', x: 2440, y: 616 },
    { def: 'cart', x: 1180, y: 900 },
  ],
  chars: [
    { roster: 'cashier', x: 2250, y: 700 },
    { roster: 'daniel', x: 860, y: 860 },
    { roster: 'ella', x: 1560, y: 880 },
  ],
  pets: [],
};
