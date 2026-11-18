// The bakery (paid pack)
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, Rf, Cf, G, shine, shade, cloudPath, heartPath, starPath, stripes } from '../../art/kit';
import type { ThingDef, LocationDef } from '../types';

const W = 2400;

const showcase: ThingDef = {
  id: 'showcase', tags: [], fixed: true, autoRestock: true,
  art: { w: 450, h: 250, art: () => svg(450, 250,
    R(6, 150, 438, 96, 14, C.pinkL) + R(20, 166, 410, 66, 10, '#ffffff', 3.5) + stripes(24, 170, 402, 58, C.pink, 18, 8, 0.5) +
    R(14, 10, 422, 146, 16, '#fff7e8') + R(26, 20, 398, 126, 10, '#f3fbff', 3.5) +
    R(26, 84, 398, 10, 4, C.woodL, 3) + R(6, 140, 438, 16, 6, C.wood)) },
  overlay: { w: 450, h: 250, art: () => svg(450, 250,
    `<rect x="26" y="20" width="398" height="126" rx="10" fill="#dff3ff" opacity="0.28"/>` + Pf('M60 24 L120 24 L70 142 L30 142Z', '#ffffff', 0.4) + Pf('M140 24 L160 24 L110 142 L90 142Z', '#ffffff', 0.3) + Ps('M26 20 H424', 4)) },
  slots: [
    { x: -150, y: -166, accept: ['item'], pose: 'place', restock: 'cupcake', r: 80 },
    { x: -50, y: -166, accept: ['item'], pose: 'place', restock: 'donut', r: 80 },
    { x: 50, y: -166, accept: ['item'], pose: 'place', restock: 'croissant', r: 80 },
    { x: 150, y: -166, accept: ['item'], pose: 'place', restock: 'cookie', r: 80 },
    { x: -150, y: -110, accept: ['item'], pose: 'place', restock: 'cakeSlice', r: 80 },
    { x: -50, y: -110, accept: ['item'], pose: 'place', restock: 'bread', r: 80 },
    { x: 50, y: -110, accept: ['item'], pose: 'place', restock: 'lollipop', r: 80 },
    { x: 150, y: -110, accept: ['item'], pose: 'place', restock: 'cupcake', r: 80 },
  ],
};

const counter: ThingDef = {
  id: 'counter', tags: [], fixed: true,
  art: { w: 380, h: 230, art: () => svg(380, 230,
    R(10, 30, 360, 196, 14, C.mintL) + R(26, 56, 160, 150, 10, '#ffffff', 3.5) + R(196, 56, 160, 150, 10, '#ffffff', 3.5) +
    `<path d="${heartPath(106, 130, 26)}" fill="${C.pink}" stroke="${C.ol}" stroke-width="3.5"/>` + `<path d="${starPath(276, 132, 30)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="3.5" stroke-linejoin="round"/>` +
    R(0, 14, 380, 26, 10, C.wood)) },
  slots: [
    { x: -40, y: -216, accept: ['item'], pose: 'place', r: 80 },
    { x: 40, y: -216, accept: ['item'], pose: 'place', r: 80 },
  ],
};

const register: ThingDef = {
  id: 'register', tags: [], fixed: true, tap: 'ring', sound: 'kaching',
  art: { w: 130, h: 120, art: () => svg(130, 120,
    R(16, 50, 100, 64, 12, C.purple) + R(26, 62, 80, 36, 6, C.purpleL, 3) +
    Ci(42, 74, 5, '#fff', 2.5) + Ci(60, 74, 5, '#fff', 2.5) + Ci(78, 74, 5, '#fff', 2.5) + Ci(42, 88, 5, '#fff', 2.5) + Ci(60, 88, 5, '#fff', 2.5) + Ci(78, 88, 5, C.yellow, 2.5) +
    R(30, 10, 70, 38, 8, C.purpleD) + R(38, 18, 54, 22, 4, '#bfffd9', 3) + R(4, 104, 122, 14, 6, C.purpleD)) },
};

const coffeeMachine: ThingDef = {
  id: 'coffeemachine', tags: [], fixed: true, tap: 'spawn', spawn: ['coffee', 'juice', 'milk'], sound: 'blip', spawnAt: { x: 0, y: -40 },
  art: { w: 110, h: 150, art: () => svg(110, 150,
    R(8, 8, 94, 136, 14, C.red) + R(20, 22, 70, 36, 8, C.greyL, 3) + Ci(40, 40, 6, C.green, 2.5) + Ci(70, 40, 6, C.yellow, 2.5) +
    R(26, 64, 58, 14, 4, C.greyDD) + R(48, 78, 14, 14, 3, C.greyDD) + R(16, 118, 78, 14, 5, C.greyD, 3)) },
};

const bakeoven: ThingDef = {
  id: 'bakeoven', tags: [], fixed: true, tap: 'toggle', sound: 'whoosh', cooks: 'bakeoven',
  light: { x: 0, y: -160, r: 260 },
  art: {
    w: 280, h: 340, variants: ['off', 'on'],
    art: (v) => {
      let bricks = '';
      for (let y = 30; y < 330; y += 30) for (let x = 6 + ((y / 30) % 2 ? 0 : 22); x < 270; x += 44) bricks += Rf(x, y, 40, 26, 6, shade('#e8875f', ((x * y) % 7) / 40));
      return svg(280, 340,
        R(4, 20, 272, 316, 30, '#e8875f') + bricks +
        P('M60 300 V170 Q60 100 140 100 Q220 100 220 170 V300Z', v === 'on' ? '#ffb15c' : '#4a3a4a') +
        (v === 'on' ? Pf('M90 300 Q100 220 120 250 Q130 190 150 240 Q170 200 175 260 Q190 230 190 300Z', '#ffe08a') : '') +
        R(48, 296, 184, 24, 8, C.greyDD) + R(110, -2, 60, 40, 8, C.greyDD) + R(100, -8, 80, 14, 6, C.grey));
    },
  },
  variant: (s) => (s.on ? 'on' : 'off'),
  slots: [{ x: 0, y: -44, accept: ['dough', 'batter', 'food'], pose: 'place', r: 110 }],
};

const worktable: ThingDef = {
  id: 'worktable', tags: [], fixed: true, tap: 'spin', sound: 'mixer', spawn: ['dough', 'batter'], spawnAt: { x: 70, y: -190 },
  art: { w: 320, h: 300, art: () => svg(320, 300,
    R(20, 140, 20, 156, 6, C.woodD) + R(280, 140, 20, 156, 6, C.woodD) + R(28, 250, 264, 12, 4, C.woodD, 3) +
    R(4, 124, 312, 26, 10, C.wood) +
    // mixer
    R(170, 92, 120, 32, 10, C.mint) + P('M260 92 V30 Q260 12 240 12 H170 Q150 12 150 30 V48 H244 V92Z', C.mint) + R(190, 48, 12, 40, 4, C.greyD, 3) +
    P('M174 92 H250 L240 120 H184Z', C.steel) + Ci(240, 30, 6, '#ffffff', 2.5) +
    // flour bag
    P('M30 124 L34 70 Q60 54 86 70 L90 124Z', '#ffffff') + Ps('M44 74 Q60 82 76 74', 3) + `<text x="60" y="108" text-anchor="middle" font-family="Rubik, Arial" font-weight="800" font-size="14" fill="${C.ol}">✿</text>`) },
  slots: [
    { x: -80, y: -176, accept: ['item'], pose: 'place', r: 80 },
    { x: -10, y: -176, accept: ['item'], pose: 'place', r: 80 },
  ],
};

const cafetable: ThingDef = {
  id: 'cafetable', tags: [], fixed: true,
  art: { w: 200, h: 170, art: () => svg(200, 170,
    R(92, 30, 16, 128, 5, C.greyDD) + El(100, 162, 50, 8, C.greyDD) + El(100, 26, 96, 18, '#ffffff') + El(100, 22, 96, 18, C.pinkL) + Ps('M14 22 Q100 50 186 22', 3, C.pink, 0.8)) },
  slots: [
    { x: -40, y: -152, accept: ['item'], pose: 'place', r: 70 },
    { x: 40, y: -152, accept: ['item'], pose: 'place', r: 70 },
  ],
};

export const BAKERY_DEFS: ThingDef[] = [showcase, counter, register, coffeeMachine, bakeoven, worktable, cafetable];

function bg() {
  let s = '';
  s += Rf(-600, -600, W + 1200, 1250, 0, '#fff4f7');
  for (let x = -600; x < W + 600; x += 80) s += Rf(x, -600, 40, 1100, 0, '#ffe0ea');
  s += Rf(-600, 470, W + 1200, 170, 0, '#ffd1e0') + L(-600, 470, W + 600, 470, 6, '#ffb3cc');
  // shop window
  s += R(120, 90, 520, 320, 18, '#ffffff') + R(138, 108, 484, 284, 10, C.sky, 3.5);
  s += Pf('M138 330 H622 V392 H138Z', '#c9e7a8') + R(180, 230, 120, 100, 6, '#ffd9b3', 3) + P('M170 236 L240 190 L310 236Z', C.red, 3) + R(440, 250, 130, 80, 6, C.blueL, 3) + P('M432 256 L505 216 L578 256Z', C.purple, 3) + P(cloudPath(330, 140, 120, 44), '#fff', 3);
  s += L(380, 108, 380, 392, 7, '#ffffff');
  s += P('M110 76 H650 L630 130 H130Z', C.rose) + Ps('M180 76 L176 130 M250 76 L248 130 M320 76 V130 M390 76 V130 M460 76 L462 130 M530 76 L534 130 M600 76 L606 130', 9, '#ffffff', 0.85);
  // chalkboard
  s += R(760, 110, 300, 210, 14, C.woodD) + R(776, 126, 268, 178, 8, '#3d4a48', 3);
  s += Ps('M830 230 Q830 180 860 180 Q890 180 890 230 Z', 3, '#ffffff', 0.8) + Ps('M820 232 H900 L890 270 H830Z', 3, '#ffffff', 0.8) + Ps('M950 200 Q960 170 990 180 Q1010 190 1000 220 Q990 250 960 250 Q930 240 950 200', 3, '#ffe08a', 0.8) + Ps('M800 150 H1020', 3, '#ffffff', 0.35);
  // bread shelves
  for (const y of [190, 310]) {
    s += R(1120, y, 360, 16, 6, C.woodD);
    for (let i = 0; i < 4; i++) s += P(`M${1140 + i * 86} ${y} Q${1140 + i * 86} ${y - 50} ${1180 + i * 86} ${y - 52} Q${1220 + i * 86} ${y - 50} ${1220 + i * 86} ${y}Z`, '#e2a35c', 3.5) + Ps(`M${1160 + i * 86} ${y - 30} L${1170 + i * 86} ${y - 14} M${1186 + i * 86} ${y - 36} L${1196 + i * 86} ${y - 18}`, 3, '#b8763a');
  }
  // lamps
  for (const x of [400, 1000, 1600, 2100]) s += Ps(`M${x} -600 V40`, 3, C.greyDD) + P(`M${x - 50} 90 Q${x} 20 ${x + 50} 90Z`, C.mint) + Cf(x, 96, 14, C.yellowL);
  // big cupcake sign
  s += Ci(1820, 220, 110, '#ffffff') + Ci(1820, 220, 96, C.pinkL, 3.5) + P('M1776 240 L1790 300 H1850 L1864 240Z', C.blueL, 3.5) + P('M1764 244 Q1760 196 1796 196 Q1800 168 1822 172 Q1846 166 1848 196 Q1882 198 1878 244Z', '#ffffff', 3.5) + Ci(1822, 166, 9, C.red, 3);
  // floor
  s += Rf(-600, 620, W + 1200, 26, 0, '#ffffff') + L(-600, 620, W + 600, 620, 4) + L(-600, 646, W + 600, 646, 4);
  for (let y = 646; y < 1400; y += 66) for (let x = -600; x < W + 600; x += 66) s += Rf(x, y, 66, 66, 0, (((x + 600) / 66 + (y - 646) / 66) | 0) % 2 ? '#fff1d6' : '#e8b98a');
  return s;
}

export const BAKERY: LocationDef = {
  id: 'bakery',
  pack: 'full_town',
  width: W,
  floor: { top: 690, bottom: 880 },
  bg,
  music: 'shop',
  seed: 17,
  map: { x: 950, y: 560 },
  nameKey: 'loc.bakery',
  place: [
    { def: 'showcase', x: 420, y: 800 },
    { def: 'counter', x: 930, y: 790 },
    { def: 'register', x: 830, y: 576 },
    { def: 'coffeemachine', x: 1050, y: 576 },
    { def: 'bakeoven', x: 1420, y: 790 },
    { def: 'worktable', x: 1790, y: 800, kids: [[0, 'dough']] },
    { def: 'chair', x: 2060, y: 812 },
    { def: 'chair', x: 2330, y: 812 },
    { def: 'cafetable', x: 2195, y: 830, kids: [[0, 'coffee']] },
  ],
  chars: [
    { roster: 'baker', x: 1250, y: 860, hat: 'chefhat' },
    { roster: 'yuval', x: 2060, y: 720 },
  ],
  pets: [{ kind: 'cat', color: 3, x: 640, y: 870 }],
};
