// UI icons (original)
import { C, svg, R, Ci, El, P, Pf, Ps, L, Rf, Cf, G, starPath, heartPath } from './kit';
import type { TexSpec } from '../engine/textures';

const btn = (inner: string, col = C.white, size = 100) =>
  svg(size, size, Ci(size / 2, size / 2, size / 2 - 4, col) + G(`translate(${size / 2} ${size / 2})`, inner));

export const UI_ICONS: Record<string, { w: number; h: number; s: () => string; outline?: number }> = {
  map: { w: 100, h: 100, s: () => btn(
    P('M-30 -22 L-10 -28 L10 -22 L30 -28 V24 L10 30 L-10 24 L-30 30Z', C.mintL, 3.5) + Ps('M-10 -28 V24 M10 -22 V30', 3, C.mintD) +
    P('M4 -14 Q4 -26 14 -26 Q24 -26 24 -14 Q24 -6 14 6 Q4 -6 4 -14Z', C.rose, 3.5) + Cf(14, -15, 4, '#fff') +
    Ps('M-24 14 Q-16 2 -6 10', 3, C.blueD), C.yellow) },
  gear: { w: 80, h: 80, s: () => svg(80, 80, Ci(40, 40, 34, '#ffffff') + G('translate(40 40)',
    `<path d="${gearPath(0, 0, 20, 14, 8)}" fill="${C.greyD}" stroke="${C.ol}" stroke-width="3.5" stroke-linejoin="round"/>` + Ci(0, 0, 6, '#ffffff', 3))) },
  bag: { w: 90, h: 96, s: () => svg(90, 96,
    Ps('M30 30 Q30 8 45 8 Q60 8 60 30', 6) + R(8, 26, 74, 64, 22, C.orange) + R(20, 50, 50, 26, 10, C.orangeD, 3.5) + Ci(45, 50, 5, C.yellow, 3) + Rf(16, 32, 20, 8, 4, '#fff', 0.4)) },
  lock: { w: 70, h: 80, s: () => svg(70, 80, Ps('M20 36 V24 Q20 8 35 8 Q50 8 50 24 V36', 8) + Ps('M20 36 V24 Q20 8 35 8 Q50 8 50 24 V36', 3, C.greyL) + R(8, 34, 54, 42, 10, C.yellow) + Ci(35, 52, 6, C.ol, 0) + R(32, 52, 6, 14, 3, C.ol, 0)) },
  back: { w: 100, h: 100, s: () => btn(P('M14 -22 L-14 0 L14 22Z', C.white, 4) + R(-4, -8, 30, 16, 6, C.white, 4), C.mint) },
  dice: { w: 100, h: 100, s: () => btn(R(-24, -24, 48, 48, 12, '#ffffff', 4) + Cf(-11, -11, 5, C.ol) + Cf(11, 11, 5, C.ol) + Cf(0, 0, 5, C.ol) + Cf(11, -11, 5, C.ol) + Cf(-11, 11, 5, C.ol), C.purple) },
  check: { w: 100, h: 100, s: () => btn(Ps('M-20 0 L-6 14 L22 -16', 12) + Ps('M-20 0 L-6 14 L22 -16', 6, '#ffffff'), C.green) },
  star: { w: 60, h: 60, s: () => svg(60, 60, `<path d="${starPath(30, 31, 26)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="4" stroke-linejoin="round"/>`) },
  heart: { w: 60, h: 60, s: () => svg(60, 60, `<path d="${heartPath(30, 30, 22)}" fill="${C.rose}" stroke="${C.ol}" stroke-width="4" stroke-linejoin="round"/>`) },
  hanger: { w: 100, h: 100, s: () => btn(Ps('M0 -26 Q0 -34 7 -34 Q14 -34 14 -27 Q14 -21 0 -16 L-28 8 H28 L0 -16', 5) + R(-24, 8, 48, 22, 8, C.pink, 3.5), C.yellow) },
};

function gearPath(cx: number, cy: number, ro: number, ri: number, teeth: number) {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? ri : ro;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a0) * r).toFixed(1) + ' ' + (cy + Math.sin(a0) * r).toFixed(1);
    d += 'L' + (cx + Math.cos(a1) * r).toFixed(1) + ' ' + (cy + Math.sin(a1) * r).toFixed(1);
  }
  return d + 'Z';
}

export function uiSpecs(): TexSpec[] {
  return Object.entries(UI_ICONS).map(([k, v]) => ({ key: 'ui:' + k, svg: v.s, w: v.w, h: v.h, ax: v.w / 2, ay: v.h / 2, outline: v.outline ?? 4 }));
}
