// Vet clinic (paid pack)
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, shine, shade, cloudPath, heartPath, starPath, dots } from '../../art/kit';
import type { ThingDef, LocationDef } from '../types';

const W = 2400;

const paw = (x: number, y: number, k: number, col: string, op = 1) =>
  Cf(x, y + 6 * k, 9 * k, col, op) + Cf(x - 9 * k, y - 6 * k, 4 * k, col, op) + Cf(x - 3 * k, y - 11 * k, 4 * k, col, op) + Cf(x + 4 * k, y - 11 * k, 4 * k, col, op) + Cf(x + 10 * k, y - 5 * k, 4 * k, col, op);

const desk: ThingDef = {
  id: 'vetdesk', tags: [], fixed: true,
  art: { w: 380, h: 220, art: () => svg(380, 220,
    R(10, 40, 360, 176, 16, '#ffffff') + R(10, 40, 360, 30, 12, C.mint) + G('translate(190 140)', R(-34, -34, 68, 68, 14, C.red, 4) + Pf('M-8 -24 H8 V-8 H24 V8 H8 V24 H-8 V8 H-24 V-8 H-8Z', '#ffffff')) +
    R(0, 26, 380, 22, 9, C.mintD)) },
  slots: [
    { x: -110, y: -194, accept: ['item'], pose: 'place', r: 80 },
    { x: 110, y: -194, accept: ['item', 'pet'], pose: 'place', r: 80 },
  ],
};

const bell: ThingDef = {
  id: 'bell', tags: [], fixed: true, tap: 'ring', sound: 'ding',
  art: { w: 70, h: 56, art: () => svg(70, 56, R(6, 44, 58, 10, 4, C.greyDD) + P('M12 44 Q12 10 35 10 Q58 10 58 44Z', C.yellow) + Ci(35, 8, 5, C.yellowD, 3) + shine(20, 20, 8, 16, 4, 0.5)) },
};

const examTable: ThingDef = {
  id: 'examtable', tags: [], fixed: true,
  art: { w: 320, h: 200, art: () => svg(320, 200,
    R(140, 70, 40, 110, 8, C.steelD) + R(80, 178, 160, 18, 8, C.greyDD) +
    R(6, 44, 308, 34, 14, C.blueL) + R(18, 30, 284, 20, 10, '#ffffff') + Ps('M30 40 H290', 3, C.blue, 0.5)) },
  slots: [
    { x: -60, y: -168, accept: ['pet', 'toy'], pose: 'place', r: 130 },
    { x: 80, y: -168, accept: ['pet', 'char', 'toy'], pose: 'sit', r: 100 },
  ],
};

const xray: ThingDef = {
  id: 'xray', tags: [], fixed: true, tap: 'xray', sound: 'xray', z: -80,
  art: { w: 250, h: 190, variants: ['off', 'on'], art: (v) => svg(250, 190,
    R(6, 6, 238, 178, 16, C.greyDD) + R(20, 20, 210, 150, 10, v === 'on' ? '#123a5a' : '#2b3446', 3.5) + Ci(214, 172, 6, v === 'on' ? C.green : C.red, 2.5)) },
  variant: (s) => (s.on ? 'on' : 'off'),
};

const scale: ThingDef = {
  id: 'petscale', tags: [], fixed: true,
  art: { w: 190, h: 120, art: () => svg(190, 120,
    R(6, 70, 178, 44, 12, '#ffffff') + R(14, 58, 162, 18, 8, C.mint) + R(60, 84, 70, 24, 6, '#2b3446', 3)) },
  slots: [{ x: 0, y: -60, accept: ['pet', 'char', 'item'], pose: 'place', r: 100 }],
};

const cabinet: ThingDef = {
  id: 'medcabinet', tags: [], fixed: true, tap: 'open', sound: 'door',
  art: {
    w: 270, h: 340, ax: 135, variants: ['closed', 'open'],
    art: (v) => svg(270, 340, v === 'closed'
      ? R(35, 6, 200, 330, 16, '#ffffff') + R(48, 20, 174, 300, 10, C.glass, 3.5) + R(48, 110, 174, 8, 3, C.steelD, 0) + R(48, 210, 174, 8, 3, C.steelD, 0) +
        G('translate(135 64)', R(-24, -24, 48, 48, 10, C.red, 3.5) + Pf('M-6 -16 H6 V-6 H16 V6 H6 V16 H-6 V6 H-16 V-6 H-6Z', '#ffffff')) + R(210, 150, 10, 40, 5, C.greyD, 3) + Pf('M60 30 L100 30 L70 300 L52 300Z', '#ffffff', 0.4)
      : R(35, 6, 200, 330, 16, '#ffffff') + R(48, 20, 174, 300, 10, '#eaf7ff', 3.5) +
        R(48, 110, 174, 10, 3, C.steelD, 3) + R(48, 210, 174, 10, 3, C.steelD, 3) + R(48, 306, 174, 10, 3, C.steelD, 3) +
        P('M35 10 L4 26 V314 L35 332Z', C.glass) + P('M235 10 L266 26 V314 L235 332Z', C.glass)),
  },
  variant: (s) => (s.open ? 'open' : 'closed'),
  slots: [
    { x: -45, y: -230, accept: ['item'], pose: 'place', inside: true, restock: 'bandage', r: 70 },
    { x: 45, y: -230, accept: ['item'], pose: 'place', inside: true, restock: 'medicine', r: 70 },
    { x: -45, y: -130, accept: ['item'], pose: 'place', inside: true, restock: 'stethoscope', r: 70 },
    { x: 45, y: -130, accept: ['item'], pose: 'place', inside: true, restock: 'thermometer', r: 70 },
    { x: -45, y: -34, accept: ['item'], pose: 'place', inside: true, restock: 'bone', r: 70 },
    { x: 45, y: -34, accept: ['item'], pose: 'place', inside: true, restock: 'fish', r: 70 },
  ],
};

const petbath: ThingDef = {
  id: 'petbath', tags: [], fixed: true, tap: 'toggle', sound: 'splash',
  art: { w: 300, h: 190, art: () => svg(300, 190,
    Ps('M40 60 V20 Q40 8 52 8 H66', 8) + Ps('M40 60 V20 Q40 8 52 8 H66', 3.5, C.steel) +
    R(8, 56, 284, 110, 34, C.blueL) + El(150, 72, 126, 14, '#d9f0ff', 3.5) + R(40, 160, 22, 26, 6, C.greyDD, 3) + R(238, 160, 22, 26, 6, C.greyDD, 3)) },
  overlay: {
    w: 300, h: 190, variants: ['dry', 'foam'],
    art: (v) => svg(300, 190,
      P('M8 92 H292 V132 Q292 166 258 166 H42 Q8 166 8 132Z', C.blueL, 4) + dots(20, 100, 260, 60, '#ffffff', 26, 5, 0.6) +
      (v === 'foam' ? [36, 86, 136, 186, 236, 270].map((x, i) => Ci(x, 90 - (i % 2) * 8, 22 - (i % 3) * 3, '#ffffff', 3)).join('') : '')),
  },
  overlayVariant: (s) => (s.on ? 'foam' : 'dry'),
  slots: [{ x: 0, y: -60, accept: ['pet', 'toy', 'char'], pose: 'bath', r: 130 }],
};

const petbed: ThingDef = {
  id: 'petbed', tags: [], fixed: true,
  art: { w: 190, h: 84, art: () => svg(190, 84, El(95, 54, 90, 28, C.purple) + El(95, 48, 70, 18, C.purpleL, 3.5) + R(14, 40, 26, 30, 12, C.purple, 0) + R(150, 40, 26, 30, 12, C.purple, 0)) },
  slots: [{ x: 0, y: -24, accept: ['pet', 'toy'], pose: 'place', r: 100 }],
};

export const VET_DEFS: ThingDef[] = [desk, bell, examTable, xray, scale, cabinet, petbath, petbed];

function bg() {
  let s = '';
  s += Rf(-600, -600, W + 1200, 1250, 0, '#e3f8f1');
  for (let y = -560, r = 0; y < 460; y += 90, r++) for (let x = -560 + (r % 2) * 60; x < W + 600; x += 120) s += paw(x, y, 1.4, '#bfeadb', 1);
  s += Rf(-600, 470, W + 1200, 170, 0, '#ffffff') + L(-600, 470, W + 600, 470, 6, C.mintD);
  // window
  s += R(760, 100, 260, 220, 16, '#ffffff') + R(776, 116, 228, 188, 10, C.sky, 3.5) + P(cloudPath(800, 160, 110, 40), '#ffffff', 3) + Pf('M776 260 Q860 230 1004 262 V304 H776Z', C.green) + L(890, 116, 890, 304, 6, '#ffffff');
  // posters
  s += R(120, 120, 180, 220, 12, '#ffffff') + Ci(210, 210, 54, C.yellowL, 3) + G('translate(210 220)', paw(0, 0, 2.4, C.orange)) + Rf(150, 296, 120, 10, 5, C.mint) + Rf(170, 314, 80, 8, 4, C.mintL);
  s += R(1500, 120, 200, 160, 12, '#ffffff') + `<path d="${heartPath(1600, 196, 44)}" fill="${C.rose}" stroke="${C.ol}" stroke-width="4"/>` + Pf('M1592 172 H1608 V188 H1624 V204 H1608 V220 H1592 V204 H1576 V188 H1592Z', '#ffffff');
  s += Ci(1820, 180, 50, '#ffffff') + Ci(1820, 180, 42, C.mintL, 3) + L(1820, 180, 1820, 150, 5) + L(1820, 180, 1840, 192, 5);
  s += R(1960, 110, 220, 180, 12, '#ffffff') + El(2070, 210, 60, 40, C.orangeL, 3) + Ci(2030, 170, 26, C.orangeL, 3) + Ci(2110, 175, 22, '#bdbacb', 3) + Cf(2022, 166, 3, C.ol) + Cf(2038, 166, 3, C.ol) + Cf(2104, 172, 3, C.ol) + Cf(2116, 172, 3, C.ol);
  // plant
  s += P('M560 640 Q520 560 540 520 Q570 560 580 630Z', C.green) + P('M600 640 Q640 560 620 510 Q590 560 590 630Z', C.greenD) + P('M540 640 H620 L612 600 H548Z', C.mint, 3.5);
  // floor
  s += Rf(-600, 620, W + 1200, 26, 0, '#ffffff') + L(-600, 620, W + 600, 620, 4) + L(-600, 646, W + 600, 646, 4);
  for (let y = 646; y < 1400; y += 70) for (let x = -600; x < W + 600; x += 70) s += Rf(x, y, 70, 70, 0, (((x + 600) / 70 + (y - 646) / 70) | 0) % 2 ? '#f3fbff' : '#d4efe6');
  s += G('translate(1600 800)', paw(0, 0, 3, '#bfeadb'));
  return s;
}

export const VET: LocationDef = {
  id: 'vet',
  pack: 'full_town',
  width: W,
  floor: { top: 690, bottom: 880 },
  bg,
  music: 'shop',
  seed: 23,
  map: { x: 1260, y: 500 },
  nameKey: 'loc.vet',
  place: [
    { def: 'vetdesk', x: 330, y: 790 },
    { def: 'bell', x: 250, y: 600 },
    { def: 'bench', x: 760, y: 800 },
    { def: 'petbed', x: 1010, y: 860 },
    { def: 'xray', x: 1330, y: 440 },
    { def: 'examtable', x: 1330, y: 800 },
    { def: 'petscale', x: 1660, y: 860 },
    { def: 'medcabinet', x: 1920, y: 780, s: { open: false } },
    { def: 'petbath', x: 2230, y: 820 },
    { def: 'petbowl', x: 1110, y: 878 },
  ],
  chars: [
    { roster: 'vet', x: 1530, y: 860, hold: 'stethoscope' },
    { roster: 'shira', x: 684, y: 716 },
  ],
  pets: [
    { kind: 'cat', color: 1, x: 1270, y: 632 },
    { kind: 'hamster', color: 0, x: 1010, y: 836 },
    { kind: 'bunny', color: 2, x: 836, y: 716 },
  ],
};
