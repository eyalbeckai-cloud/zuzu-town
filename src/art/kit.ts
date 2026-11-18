// Tiny SVG authoring kit. All art in Zuzu Town is original and generated from code.

export const C = {
  ol: '#45365a',
  white: '#ffffff',
  cream: '#fff7e8',
  ink: '#45365a',
  wood: '#e6ae72', woodD: '#c98a4f', woodL: '#f5cf9f', woodDD: '#a86d3b',
  pink: '#ff9ec4', pinkD: '#f27aa8', pinkL: '#ffd6e6',
  rose: '#ff6b9a',
  blue: '#7cc4ff', blueD: '#4e9fe6', blueL: '#cbe8ff', navy: '#4a5fb5',
  mint: '#80dcc1', mintD: '#4fbf9f', mintL: '#cdf4e8',
  yellow: '#ffd866', yellowD: '#f2b632', yellowL: '#fff1bd',
  orange: '#ffa25c', orangeD: '#f27f2e', orangeL: '#ffd2ad',
  red: '#ff6b6b', redD: '#e04848',
  purple: '#b79cff', purpleD: '#9273ec', purpleL: '#e5dbff',
  green: '#8fd16a', greenD: '#62b145', greenL: '#d2f1bf', greenDD: '#3f8f3a',
  grey: '#cdcadb', greyD: '#9d99b0', greyL: '#efedf5', greyDD: '#6f6a86',
  brown: '#9b6b4a', brownD: '#6e4a33', brownL: '#c49a72',
  sky: '#bfe6ff', skyD: '#94d3ff',
  steel: '#dfe6ee', steelD: '#aab7c6',
  glass: '#dff3ff',
  black: '#2e2438',
};

const n = (v: number) => (Math.round(v * 10) / 10).toString();

export const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}">${body}</svg>`;

export const st = (fill: string, sw = 4, stroke = C.ol) =>
  `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;

export const nf = (fill: string, op = 1) => `fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}`;

/** outlined rect */
export const R = (x: number, y: number, w: number, h: number, r: number, fill: string, sw = 4) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" ${st(fill, sw)}/>`;
/** flat rect (no stroke) */
export const Rf = (x: number, y: number, w: number, h: number, r: number, fill: string, op = 1) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" ${nf(fill, op)}/>`;
export const Ci = (cx: number, cy: number, r: number, fill: string, sw = 4) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${st(fill, sw)}/>`;
export const Cf = (cx: number, cy: number, r: number, fill: string, op = 1) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${nf(fill, op)}/>`;
export const El = (cx: number, cy: number, rx: number, ry: number, fill: string, sw = 4) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${st(fill, sw)}/>`;
export const Ef = (cx: number, cy: number, rx: number, ry: number, fill: string, op = 1) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${nf(fill, op)}/>`;
export const P = (d: string, fill: string, sw = 4) => `<path d="${d}" ${st(fill, sw)}/>`;
export const Pf = (d: string, fill: string, op = 1) => `<path d="${d}" ${nf(fill, op)}/>`;
/** stroke-only path */
export const Ps = (d: string, sw = 4, color = C.ol, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
export const L = (x1: number, y1: number, x2: number, y2: number, sw = 4, color = C.ol, op = 1) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
export const G = (tr: string, body: string) => `<g transform="${tr}">${body}</g>`;
export const Gop = (op: number, body: string) => `<g opacity="${op}">${body}</g>`;
export const T = (x: number, y: number, size: number, fill: string, text: string, weight = 800, anchor = 'middle') =>
  `<text x="${n(x)}" y="${n(y)}" font-family="Rubik, Arial Rounded MT Bold, Arial, sans-serif" font-weight="${weight}" font-size="${n(size)}" fill="${fill}" text-anchor="${anchor}">${text}</text>`;

/** soft white highlight stripe */
export const shine = (x: number, y: number, w: number, h: number, r = 6, op = 0.45) => Rf(x, y, w, h, r, '#ffffff', op);

/** rounded polygon via points */
export const Poly = (pts: [number, number][], fill: string, sw = 4) =>
  `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" ${st(fill, sw)}/>`;

/** star path centered at cx,cy */
export function starPath(cx: number, cy: number, r: number, inner = 0.45, pts = 5) {
  let d = '';
  for (let i = 0; i < pts * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
    d += (i ? 'L' : 'M') + n(cx + Math.cos(a) * rr) + ' ' + n(cy + Math.sin(a) * rr);
  }
  return d + 'Z';
}

export function heartPath(cx: number, cy: number, r: number) {
  return `M${n(cx)} ${n(cy + r * 0.9)} C${n(cx - r * 1.4)} ${n(cy - r * 0.1)} ${n(cx - r * 0.7)} ${n(cy - r * 1.2)} ${n(cx)} ${n(cy - r * 0.45)} C${n(cx + r * 0.7)} ${n(cy - r * 1.2)} ${n(cx + r * 1.4)} ${n(cy - r * 0.1)} ${n(cx)} ${n(cy + r * 0.9)}Z`;
}

/** cloud blob path (puffy) */
export function cloudPath(x: number, y: number, w: number, h: number) {
  const r = h / 2;
  return `M${n(x + r)} ${n(y + h)} H${n(x + w - r)} A${n(r)} ${n(r)} 0 0 0 ${n(x + w - r * 0.6)} ${n(y + r * 0.5)} A${n(r * 0.9)} ${n(r * 0.9)} 0 0 0 ${n(x + w * 0.6)} ${n(y + r * 0.1)} A${n(r * 1.1)} ${n(r * 1.1)} 0 0 0 ${n(x + w * 0.28)} ${n(y + r * 0.35)} A${n(r * 0.9)} ${n(r * 0.9)} 0 0 0 ${n(x + r)} ${n(y + h)}Z`;
}

/** pattern fill rect helpers used for clothes / wallpaper */
export function stripes(x: number, y: number, w: number, h: number, color: string, gap = 14, sw = 6, op = 0.5) {
  let s = '';
  for (let yy = y + gap / 2; yy < y + h; yy += gap) s += L(x, yy, x + w, yy, sw, color, op);
  return s;
}

export function dots(x: number, y: number, w: number, h: number, color: string, gap = 22, r = 4, op = 0.6) {
  let s = '';
  let row = 0;
  for (let yy = y + gap / 2; yy < y + h; yy += gap, row++) {
    for (let xx = x + gap / 2 + (row % 2 ? gap / 2 : 0); xx < x + w; xx += gap) s += Cf(xx, yy, r, color, op);
  }
  return s;
}

/** clip helper: wraps body in a clipPath defined by `shape` (unique id) */
let clipN = 0;
export function clip(shape: string, body: string) {
  const id = 'k' + (clipN++).toString(36);
  return `<defs><clipPath id="${id}">${shape}</clipPath></defs><g clip-path="url(#${id})">${body}</g>`;
}

/** linear gradient def + returns url */
let gradN = 0;
export function vgrad(stops: [number, string][]): [string, string] {
  const id = 'gr' + (gradN++).toString(36);
  const def = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
  return [def, `url(#${id})`];
}

export function shade(hex: string, k: number) {
  // k<0 darker, k>0 lighter
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  const f = (c: number) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  const h = (c: number) => Math.max(0, Math.min(255, f(c))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
