// Parametric, original character art: bodies + heads as SVG, faces drawn live on canvas.
import { C, svg, R, Ci, El, Ef, P, Pf, Ps, L, G, Cf, starPath, heartPath, clip, stripes, dots, shade } from './kit';

export const SKIN = ['#ffe5d2', '#f9cca8', '#e9ae82', '#c98b5e', '#9a6342', '#6b432c'];
export const HAIR = ['#3a2a3a', '#6b4226', '#a8652f', '#f2c76a', '#e07a3a', '#ff8fb8', '#6fa8ff', '#a07bf0', '#d9d6e2'];
export const CLOTH = ['#ff6b9a', '#ffa25c', '#ffd866', '#8fd16a', '#80dcc1', '#7cc4ff', '#4a5fb5', '#b79cff', '#fff7e8', '#45365a', '#e04848', '#9b6b4a'];

export type Size = 'baby' | 'kid' | 'adult';
export type Pose = 'stand' | 'sit';

export interface Look {
  size: Size;
  skin: number;
  hair: number;
  hairColor: number;
  top: number; // 0 tee, 1 dress, 2 hoodie, 3 overalls, 4 sweater
  topColor: number;
  pattern: number; // 0 plain, 1 stripes, 2 dots, 3 star, 4 heart
  bottom: number; // 0 pants, 1 shorts, 2 skirt
  bottomColor: number;
  shoes: number;
  acc: number; // 0 none, 1 glasses, 2 bow, 3 flower, 4 star clip
}

export const HAIR_STYLES = 10; // 0 short 1 bob 2 long 3 pigtails 4 afro 5 bun 6 spiky 7 buzz 8 curl 9 bald
export const TOPS = 5;
export const PATTERNS = 5;
export const BOTTOMS = 3;
export const ACCS = 5;

interface Dim { tw: number; th: number; legH: number; lw: number; armL: number; aw: number; hr: number }
export const DIM: Record<Size, Dim> = {
  baby: { tw: 74, th: 56, legH: 24, lw: 21, armL: 44, aw: 15, hr: 50 },
  kid: { tw: 84, th: 76, legH: 46, lw: 20, armL: 56, aw: 17, hr: 56 },
  adult: { tw: 94, th: 100, legH: 80, lw: 23, armL: 74, aw: 19, hr: 55 },
};

export function legLen(look: Look, pose: Pose) {
  const d = DIM[look.size];
  return pose === 'sit' ? Math.round(d.legH * 0.6) : d.legH;
}

export interface CharMetrics {
  headX: number; headY: number; headR: number;
  handX: number; handY: number;
  /** hip height above feet (stand) */
  hip: number;
  height: number;
}

/** metrics relative to the pose anchor (stand: feet, sit: hip) */
export function charMetrics(look: Look, pose: Pose): CharMetrics {
  const d = DIM[look.size];
  const legH = legLen(look, pose);
  const base = pose === 'sit' ? 0 : -legH;
  const shoulder = base - d.th;
  return {
    headX: 0,
    headY: shoulder - d.hr * 0.8,
    headR: d.hr,
    handX: d.tw / 2 + 12,
    handY: shoulder + d.armL,
    hip: legH,
    height: d.legH + d.th + d.hr * 1.8,
  };
}

export interface ArtOut { svg: string; w: number; h: number; ax: number; ay: number }

export function bodyArt(look: Look, pose: Pose): ArtOut {
  const d = DIM[look.size];
  const legH = legLen(look, pose);
  const { tw, th, lw, armL, aw } = d;
  const W = tw + 70;
  const H = legH + th + 36;
  const X0 = W / 2;
  const Y0 = H - 6;
  const skin = SKIN[look.skin];
  const top = CLOTH[look.topColor];
  const bot = CLOTH[look.bottomColor];
  const shoe = CLOTH[look.shoes];
  const isDress = look.top === 1;
  const isOveralls = look.top === 3;
  const longSleeve = look.top === 2 || look.top === 4;
  const sy = -legH - th; // shoulder line
  const hip = -legH + 4;
  let s = '';

  // arms (behind torso)
  for (const side of [-1, 1]) {
    const x1 = side * (tw / 2 - 6), y1 = sy + 16;
    const x2 = side * (tw / 2 + 11), y2 = sy + armL;
    s += L(x1, y1, x2, y2, aw + 8, C.ol);
    s += L(x1, y1, x2, y2, aw, longSleeve ? top : skin);
    if (!longSleeve) {
      const mx = x1 + (x2 - x1) * 0.42, my = y1 + (y2 - y1) * 0.42;
      s += L(x1, y1, mx, my, aw + 8, C.ol);
      s += L(x1, y1, mx, my, aw + 1, isOveralls ? top : top);
    } else {
      const cx = x1 + (x2 - x1) * 0.86, cy = y1 + (y2 - y1) * 0.86;
      s += L(cx, cy, x2 - (x2 - x1) * 0.02, y2, aw - 2, shade(top, -0.12));
    }
    s += Ci(x2, y2 + 3, aw * 0.62, skin, 3.5);
  }

  // legs
  const gap = look.size === 'baby' ? 4 : 6;
  const legCol = isDress ? skin : look.bottom === 0 || isOveralls ? bot : skin;
  const spread = pose === 'sit' ? 4 : 0;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -gap - lw - spread : gap + spread;
    s += R(x0, -legH - 10, lw, legH + 4, lw / 2, legCol, 4);
    if (!isDress && !isOveralls && look.bottom === 1) {
      s += R(x0 - 2, -legH - 10, lw + 4, legH * 0.5 + 8, 7, bot, 4);
    }
    if (pose === 'sit') s += El(x0 + lw / 2, -legH - 2, lw * 0.62, 9, legCol === skin ? skin : shade(legCol, 0.08), 3);
    const sx = x0 + lw / 2 + side * 3;
    s += El(sx, -7, lw * 0.82, 9.5, shoe, 4);
    s += Ef(sx - side * 2 - 3, -11, lw * 0.3, 3, '#ffffff', 0.55);
  }

  // neck
  s += R(-8, sy - 12, 16, 20, 6, skin, 3.5);

  // torso
  const bodyBottom = isDress ? hip - 8 : hip + 6;
  const torsoD = `M${-tw / 2 + 16} ${sy} H${tw / 2 - 16} Q${tw / 2} ${sy} ${tw / 2 + 1} ${sy + 16} L${tw / 2 + 3} ${bodyBottom - 6} Q${tw / 2 + 3} ${bodyBottom} ${tw / 2 - 6} ${bodyBottom} H${-tw / 2 + 6} Q${-tw / 2 - 3} ${bodyBottom} ${-tw / 2 - 3} ${bodyBottom - 6} L${-tw / 2 - 1} ${sy + 16} Q${-tw / 2} ${sy} ${-tw / 2 + 16} ${sy}Z`;
  let torsoFill = '';
  const pat = patternBody(look.pattern, top, -tw / 2 - 4, sy, tw + 8, bodyBottom - sy + 2);
  torsoFill += pat;
  s += P(torsoD, top, 4);
  if (pat) s += clip(`<path d="${torsoD}"/>`, torsoFill);

  // skirt / dress flare
  if (isDress) {
    const sk = `M${-tw / 2 - 1} ${hip - 14} L${-tw * 0.7} ${-legH * 0.42} Q0 ${-legH * 0.3} ${tw * 0.7} ${-legH * 0.42} L${tw / 2 + 1} ${hip - 14}Z`;
    s += P(sk, top, 4);
    if (look.pattern) s += clip(`<path d="${sk}"/>`, patternBody(look.pattern, top, -tw * 0.75, hip - 16, tw * 1.5, legH));
    s += Ps(`M${-tw * 0.62} ${-legH * 0.47} Q0 ${-legH * 0.37} ${tw * 0.62} ${-legH * 0.47}`, 3, shade(top, -0.2), 0.6);
  } else if (!isOveralls) {
    // waistband / skirt
    if (look.bottom === 2) {
      const sk = `M${-tw / 2 - 2} ${hip - 14} L${-tw * 0.66} ${-legH * 0.45} Q0 ${-legH * 0.36} ${tw * 0.66} ${-legH * 0.45} L${tw / 2 + 2} ${hip - 14}Z`;
      s += P(sk, bot, 4);
    } else {
      s += R(-tw / 2 - 3, hip - 14, tw + 6, 18, 6, bot, 4);
    }
  }

  // top details
  if (look.top === 0) {
    s += Ps(`M-11 ${sy + 1} Q0 ${sy + 12} 11 ${sy + 1}`, 3.5, shade(top, -0.25));
  } else if (look.top === 2) {
    s += P(`M-20 ${sy - 2} Q0 ${sy + 18} 20 ${sy - 2}`, shade(top, -0.1), 3.5);
    s += L(-6, sy + 6, -7, sy + 24, 3, C.white);
    s += L(6, sy + 6, 7, sy + 24, 3, C.white);
    s += R(-tw * 0.3, hip - 40, tw * 0.6, 22, 9, shade(top, -0.1), 3.5);
  } else if (look.top === 4) {
    s += R(-tw / 2 - 2, hip - 22, tw + 4, 12, 5, shade(top, -0.15), 3.5);
    s += Ps(`M-12 ${sy + 1} Q0 ${sy + 10} 12 ${sy + 1}`, 5, shade(top, -0.15));
  } else if (isOveralls) {
    s += R(-tw / 2 - 3, hip - 14, tw + 6, 18, 6, bot, 4);
    s += R(-tw * 0.33, sy + 26, tw * 0.66, hip - sy - 22, 8, bot, 4);
    s += L(-tw * 0.3, sy + 30, -tw * 0.36, sy + 2, 7, C.ol);
    s += L(-tw * 0.3, sy + 30, -tw * 0.36, sy + 2, 3, bot);
    s += L(tw * 0.3, sy + 30, tw * 0.36, sy + 2, 7, C.ol);
    s += L(tw * 0.3, sy + 30, tw * 0.36, sy + 2, 3, bot);
    s += Ci(-tw * 0.24, sy + 34, 4, C.yellow, 2.5) + Ci(tw * 0.24, sy + 34, 4, C.yellow, 2.5);
    s += R(-tw * 0.16, sy + 44, tw * 0.32, 16, 5, shade(bot, -0.1), 3);
  }
  // shine
  s += `<path d="M${-tw / 2 + 8} ${sy + 18} Q${-tw / 2 + 6} ${sy + 8} ${-tw / 2 + 18} ${sy + 6}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.45"/>`;

  return { svg: svg(W, H, G(`translate(${X0} ${Y0})`, s)), w: W, h: H, ax: X0, ay: pose === 'sit' ? Y0 - legH : Y0 };
}

function patternBody(p: number, base: string, x: number, y: number, w: number, h: number) {
  const c = shade(base, base === '#fff7e8' ? -0.25 : -0.22);
  const lc = base === '#45365a' ? '#ffffff' : '#ffffff';
  switch (p) {
    case 1: return stripes(x, y, w, h, c, 16, 7, 0.55);
    case 2: return dots(x, y, w, h, lc, 20, 4.2, 0.75);
    case 3: return `<path d="${starPath(x + w / 2, y + h * 0.55, Math.min(w, h) * 0.24)}" fill="${C.yellow}" stroke="${C.ol}" stroke-width="3" stroke-linejoin="round"/>`;
    case 4: return `<path d="${heartPath(x + w / 2, y + h * 0.5, Math.min(w, h) * 0.2)}" fill="${C.rose}" stroke="${C.ol}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  return '';
}

// ---------------------------------------------------------------- heads

export function headArt(look: Look): ArtOut {
  const r = DIM[look.size].hr;
  const W = Math.round(r * 2 + 76);
  const H = Math.round(r * 2 + 96);
  const cx = W / 2;
  const cy = H / 2 - 4;
  const skin = SKIN[look.skin];
  const hc = HAIR[look.hairColor];
  const hcD = shade(hc, -0.18);
  let s = '';
  const st = look.size === 'baby' && look.hair !== 9 ? 8 : look.hair;

  // back hair
  switch (st) {
    case 1: s += P(`M${-r * 1.1} ${-r * 0.2} Q${-r * 1.15} ${r * 0.62} ${-r * 0.8} ${r * 0.7} H${r * 0.8} Q${r * 1.15} ${r * 0.62} ${r * 1.1} ${-r * 0.2}Z`, hc); break;
    case 2: s += P(`M${-r * 1.1} ${-r * 0.3} Q${-r * 1.28} ${r * 1.0} ${-r * 0.9} ${r * 1.32} Q0 ${r * 1.45} ${r * 0.9} ${r * 1.32} Q${r * 1.28} ${r * 1.0} ${r * 1.1} ${-r * 0.3}Z`, hc); break;
    case 3:
      for (const sd of [-1, 1]) {
        s += Ci(sd * r * 1.12, r * 0.18, r * 0.4, hc);
        s += Ci(sd * r * 0.95, -r * 0.18, r * 0.13, C.rose, 3);
      }
      break;
    case 4: {
      const R0 = r * 1.22, n = 13;
      const circ: [number, number, number][] = [[0, -r * 0.15, R0 * 0.88]];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.2;
        circ.push([Math.cos(a) * R0 * 0.8, -r * 0.15 + Math.sin(a) * R0 * 0.78, r * 0.36]);
      }
      s += merged(circ, hc);
      break;
    }
    case 5: s += Ci(0, -r * 1.12, r * 0.42, hc) + Ps(`M${-r * 0.25} ${-r * 0.82} Q0 ${-r * 0.92} ${r * 0.25} ${-r * 0.82}`, 4, hcD); break;
  }

  // ears
  s += Ci(-r * 0.98, r * 0.12, r * 0.2, skin, 4) + Ci(r * 0.98, r * 0.12, r * 0.2, skin, 4);
  s += Ef(-r * 0.98, r * 0.12, r * 0.09, r * 0.1, shade(skin, -0.15)) + Ef(r * 0.98, r * 0.12, r * 0.09, r * 0.1, shade(skin, -0.15));
  // face
  s += Ci(0, 0, r, skin, 4);
  s += Ef(-r * 0.35, -r * 0.5, r * 0.28, r * 0.14, '#ffffff', 0.35);

  // front hair
  const capTop = `M${-r * 1.05} ${r * 0.08} C${-r * 1.1} ${-r * 1.55} ${r * 1.1} ${-r * 1.55} ${r * 1.05} ${r * 0.08}`;
  switch (st) {
    case 0: s += P(`${capTop} Q${r * 0.92} ${-r * 0.2} ${r * 0.7} ${-r * 0.42} Q${r * 0.2} ${-r * 0.5} ${-r * 0.1} ${-r * 0.36} Q${-r * 0.45} ${-r * 0.62} ${-r * 0.92} ${-r * 0.1}Z`, hc); break;
    case 1: s += P(`${capTop} L${r * 0.98} ${-r * 0.06} L${r * 0.8} ${-r * 0.34} H${-r * 0.8} L${-r * 0.98} ${-r * 0.06}Z`, hc); break;
    case 2: s += P(`${capTop} Q${r * 0.7} ${-r * 0.3} ${r * 0.08} ${-r * 0.72} L0 ${-r * 0.6} L${-r * 0.08} ${-r * 0.72} Q${-r * 0.7} ${-r * 0.3} ${-r * 1.0} ${r * 0.08}Z`, hc); break;
    case 3: s += P(`${capTop} Q${r * 0.9} ${-r * 0.36} ${r * 0.5} ${-r * 0.36} Q${r * 0.25} ${-r * 0.5} 0 ${-r * 0.34} Q${-r * 0.25} ${-r * 0.5} ${-r * 0.5} ${-r * 0.36} Q${-r * 0.9} ${-r * 0.36} ${-r * 1.0} ${r * 0.08}Z`, hc); break;
    case 4: {
      const circ: [number, number, number][] = [];
      for (let i = 0; i < 6; i++) circ.push([-r * 0.78 + i * r * 0.312, -r * 0.5 - (i % 2) * r * 0.06, r * 0.24]);
      circ.push([-r * 0.5, -r * 0.82, r * 0.34], [r * 0.05, -r * 0.92, r * 0.36], [r * 0.55, -r * 0.8, r * 0.34]);
      s += merged(circ, hc);
      break;
    }
    case 5: s += P(`${capTop} Q${r * 0.9} ${-r * 0.45} 0 ${-r * 0.48} Q${-r * 0.9} ${-r * 0.45} ${-r * 1.0} ${r * 0.08}Z`, hc); break;
    case 6: {
      let d = `${capTop} L${r * 0.98} ${-r * 0.12}`;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const x1 = r * 0.98 - ((i + 0.5) / n) * r * 1.96;
        const x2 = r * 0.98 - ((i + 1) / n) * r * 1.96;
        d += ` Q${(x1 + r * 0.12).toFixed(1)} ${(-r * 0.62).toFixed(1)} ${x1.toFixed(1)} ${(-r * 0.6).toFixed(1)} Q${(x1 - r * 0.02).toFixed(1)} ${(-r * 0.42).toFixed(1)} ${x2.toFixed(1)} ${(i === n - 1 ? -r * 0.12 : -r * 0.3).toFixed(1)}`;
      }
      s += P(d + 'Z', hc);
      s += P(`M${-r * 0.12} ${-r * 1.04} Q${-r * 0.05} ${-r * 1.42} ${r * 0.32} ${-r * 1.4} Q${r * 0.12} ${-r * 1.24} ${r * 0.16} ${-r * 1.02}Z`, hc);
      break;
    }
    case 7: s += P(`M${-r * 0.98} ${-r * 0.2} C${-r * 1.0} ${-r * 1.32} ${r * 1.0} ${-r * 1.32} ${r * 0.98} ${-r * 0.2} Q0 ${-r * 0.62} ${-r * 0.98} ${-r * 0.2}Z`, hc); break;
    case 8: s += Ps(`M${-r * 0.05} ${-r * 0.96} C${-r * 0.4} ${-r * 1.35} ${r * 0.35} ${-r * 1.5} ${r * 0.25} ${-r * 1.12} C${r * 0.18} ${-r * 0.9} ${-r * 0.1} ${-r * 1.0} ${r * 0.02} ${-r * 1.15}`, 7, hc) + Ps(`M${-r * 0.05} ${-r * 0.96} C${-r * 0.4} ${-r * 1.35} ${r * 0.35} ${-r * 1.5} ${r * 0.25} ${-r * 1.12}`, 2, C.ol, 0.5); break;
    case 9: s += P(`M${-r * 1.02} ${r * 0.1} Q${-r * 1.08} ${-r * 0.5} ${-r * 0.7} ${-r * 0.55} Q${-r * 0.82} ${-r * 0.2} ${-r * 0.78} ${r * 0.12}Z`, hc) + P(`M${r * 1.02} ${r * 0.1} Q${r * 1.08} ${-r * 0.5} ${r * 0.7} ${-r * 0.55} Q${r * 0.82} ${-r * 0.2} ${r * 0.78} ${r * 0.12}Z`, hc); break;
  }
  if (st <= 6 && st !== 4) {
    s += Ps(`M${-r * 0.55} ${-r * 0.88} Q${-r * 0.2} ${-r * 1.08} ${r * 0.3} ${-r * 1.0}`, 5, '#ffffff', 0.35);
  }

  // accessories
  switch (look.acc) {
    case 1:
      for (const sd of [-1, 1]) s += `<circle cx="${sd * r * 0.36}" cy="${r * 0.06}" r="${r * 0.24}" fill="#ffffff" fill-opacity="0.25" stroke="${C.ol}" stroke-width="4"/>`;
      s += L(-r * 0.12, r * 0.04, r * 0.12, r * 0.04, 4);
      break;
    case 2: {
      const bx = r * 0.62, by = -r * 0.82;
      s += P(`M${bx} ${by} L${bx - r * 0.38} ${by - r * 0.22} L${bx - r * 0.34} ${by + r * 0.24}Z`, C.rose, 3.5);
      s += P(`M${bx} ${by} L${bx + r * 0.38} ${by - r * 0.22} L${bx + r * 0.34} ${by + r * 0.24}Z`, C.rose, 3.5);
      s += Ci(bx, by, r * 0.1, C.pinkD, 3);
      break;
    }
    case 3: {
      const fx = -r * 0.66, fy = -r * 0.78;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        s += Ci(fx + Math.cos(a) * r * 0.15, fy + Math.sin(a) * r * 0.15, r * 0.12, C.yellowL, 3);
      }
      s += Ci(fx, fy, r * 0.1, C.orange, 3);
      break;
    }
    case 4:
      s += `<path d="${starPath(r * 0.6, -r * 0.78, r * 0.24)}" ${'fill="' + C.yellow + '" stroke="' + C.ol + '" stroke-width="3.5" stroke-linejoin="round"'}/>`;
      break;
  }
  return { svg: svg(W, H, G(`translate(${cx} ${cy})`, s)), w: W, h: H, ax: cx, ay: cy };
}

/** union of circles with a single outside outline */
function merged(circ: [number, number, number][], fill: string) {
  let a = '', b = '';
  for (const [x, y, r] of circ) {
    a += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${C.ol}" stroke="${C.ol}" stroke-width="8"/>`;
    b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
  }
  return a + b;
}

// ---------------------------------------------------------------- faces (live)

export type EyeState = 'open' | 'closed' | 'happy' | 'wide';
export type MouthState = 'smile' | 'open' | 'o' | 'chew' | 'grin' | 'flat' | 'tongue';

export interface Expr {
  eyes: EyeState;
  mouth: MouthState;
  lx: number;
  ly: number;
  blink: number; // 0..1 (1 closed)
}

export function drawFace(g: CanvasRenderingContext2D, r: number, size: Size, skin: number, e: Expr) {
  const baby = size === 'baby';
  const ex = r * 0.36, ey = r * 0.06;
  const erx = r * (baby ? 0.13 : 0.11);
  const ery = r * (baby ? 0.16 : 0.14);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // cheeks
  g.fillStyle = 'rgba(255,120,150,0.38)';
  for (const sd of [-1, 1]) {
    g.beginPath();
    g.ellipse(sd * r * 0.6, r * 0.32, r * 0.16, r * 0.11, 0, 0, Math.PI * 2);
    g.fill();
  }
  // eyes
  g.strokeStyle = C.ol;
  g.fillStyle = '#3a2a48';
  const eyes = e.blink > 0.6 && e.eyes === 'open' ? 'closed' : e.eyes;
  for (const sd of [-1, 1]) {
    const cx = sd * ex + e.lx * r * 0.06;
    const cy = ey + e.ly * r * 0.05;
    g.lineWidth = r * 0.075;
    if (eyes === 'open' || eyes === 'wide') {
      const k = eyes === 'wide' ? 1.25 : 1;
      g.beginPath();
      g.ellipse(cx, cy, erx * k, ery * k * (1 - e.blink * 0.8), 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(cx - erx * 0.3, cy - ery * 0.35, erx * 0.38, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3a2a48';
    } else if (eyes === 'closed') {
      g.beginPath();
      g.moveTo(cx - erx * 1.1, cy);
      g.quadraticCurveTo(cx, cy + ery * 0.9, cx + erx * 1.1, cy);
      g.stroke();
    } else if (eyes === 'happy') {
      g.beginPath();
      g.moveTo(cx - erx * 1.1, cy + ery * 0.3);
      g.quadraticCurveTo(cx, cy - ery * 1.1, cx + erx * 1.1, cy + ery * 0.3);
      g.stroke();
    }
  }
  // nose
  g.strokeStyle = shade(SKIN[skin] ?? SKIN[1], -0.3);
  g.lineWidth = r * 0.05;
  g.beginPath();
  g.moveTo(-r * 0.05, r * 0.24);
  g.quadraticCurveTo(0, r * 0.3, r * 0.05, r * 0.24);
  g.stroke();
  // mouth
  const my = r * 0.44;
  g.strokeStyle = C.ol;
  g.lineWidth = r * 0.065;
  switch (e.mouth) {
    case 'smile':
      g.beginPath();
      g.moveTo(-r * 0.17, my - r * 0.03);
      g.quadraticCurveTo(0, my + r * 0.14, r * 0.17, my - r * 0.03);
      g.stroke();
      break;
    case 'grin':
      g.fillStyle = '#7a2e45';
      g.beginPath();
      g.moveTo(-r * 0.22, my - r * 0.04);
      g.quadraticCurveTo(0, my + r * 0.28, r * 0.22, my - r * 0.04);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#ff8fa8';
      g.beginPath();
      g.ellipse(0, my + r * 0.09, r * 0.09, r * 0.045, 0, 0, Math.PI * 2);
      g.fill();
      break;
    case 'open':
    case 'tongue':
      g.fillStyle = '#7a2e45';
      g.beginPath();
      g.ellipse(0, my + r * 0.03, r * 0.13, r * 0.15, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#ff8fa8';
      g.beginPath();
      g.ellipse(0, my + r * 0.11, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
      g.fill();
      break;
    case 'o':
      g.fillStyle = '#7a2e45';
      g.beginPath();
      g.ellipse(0, my + r * 0.02, r * 0.07, r * 0.08, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      break;
    case 'chew':
      g.beginPath();
      g.moveTo(-r * 0.14, my);
      g.quadraticCurveTo(-r * 0.07, my + r * 0.08, 0, my);
      g.quadraticCurveTo(r * 0.07, my + r * 0.08, r * 0.14, my);
      g.stroke();
      break;
    case 'flat':
      g.beginPath();
      g.moveTo(-r * 0.12, my + r * 0.02);
      g.lineTo(r * 0.12, my + r * 0.02);
      g.stroke();
      break;
  }
}

// ---------------------------------------------------------------- pets

export type PetKind = 'cat' | 'dog' | 'bunny' | 'hamster';
export const PET_COLORS: Record<PetKind, string[]> = {
  cat: ['#ffb066', '#bdbacb', '#5a4a5e', '#fff1dc'],
  dog: ['#c98a4f', '#f2d18a', '#ffffff', '#6b4a3a'],
  bunny: ['#ffffff', '#c9c4d6', '#b8865c', '#ffd6e6'],
  hamster: ['#f2c27a', '#ffffff', '#d9a066', '#c9c4d6'],
};

export interface PetArt extends ArtOut { eyes: [number, number][]; eyeR: number; mouth: [number, number]; headR: number }

export function petArt(kind: PetKind, color: number): PetArt {
  const col = PET_COLORS[kind][color % 4];
  const dk = shade(col, -0.18);
  const light = shade(col, 0.45);
  let s = '';
  let W = 120, H = 120;
  let eyes: [number, number][] = [];
  let mouth: [number, number] = [0, 0];
  let eyeR = 6;
  let headR = 34;
  if (kind === 'cat') {
    W = 128; H = 142;
    const cx = W / 2;
    // tail
    s += Ps(`M${cx + 30} ${H - 16} Q${cx + 66} ${H - 30} ${cx + 52} ${H - 72} Q${cx + 46} ${H - 92} ${cx + 58} ${H - 100}`, 18, C.ol);
    s += Ps(`M${cx + 30} ${H - 16} Q${cx + 66} ${H - 30} ${cx + 52} ${H - 72} Q${cx + 46} ${H - 92} ${cx + 58} ${H - 100}`, 10, col);
    // body
    s += P(`M${cx - 36} ${H - 6} Q${cx - 42} ${H - 60} ${cx} ${H - 66} Q${cx + 42} ${H - 60} ${cx + 36} ${H - 6}Z`, col);
    s += El(cx, H - 22, 18, 20, light, 0);
    s += El(cx - 16, H - 8, 12, 8, col, 3.5) + El(cx + 16, H - 8, 12, 8, col, 3.5);
    // ears + head
    const hy = H - 84;
    s += P(`M${cx - 34} ${hy - 6} L${cx - 30} ${hy - 44} L${cx - 6} ${hy - 26}Z`, col);
    s += P(`M${cx + 34} ${hy - 6} L${cx + 30} ${hy - 44} L${cx + 6} ${hy - 26}Z`, col);
    s += Pf(`M${cx - 28} ${hy - 14} L${cx - 27} ${hy - 34} L${cx - 14} ${hy - 24}Z`, C.pinkL);
    s += Pf(`M${cx + 28} ${hy - 14} L${cx + 27} ${hy - 34} L${cx + 14} ${hy - 24}Z`, C.pinkL);
    s += El(cx, hy, 40, 34, col);
    if (color === 0) s += Ps(`M${cx - 10} ${hy - 32} L${cx - 8} ${hy - 22} M${cx} ${hy - 34} L${cx} ${hy - 23} M${cx + 10} ${hy - 32} L${cx + 8} ${hy - 22}`, 4, dk);
    s += El(cx, hy + 14, 14, 10, light, 0);
    s += P(`M${cx - 5} ${hy + 6} H${cx + 5} L${cx} ${hy + 11}Z`, C.pinkD, 2.5);
    s += Ps(`M${cx} ${hy + 11} Q${cx - 6} ${hy + 18} ${cx - 11} ${hy + 14} M${cx} ${hy + 11} Q${cx + 6} ${hy + 18} ${cx + 11} ${hy + 14}`, 3);
    s += Ps(`M${cx - 22} ${hy + 8} L${cx - 44} ${hy + 4} M${cx - 22} ${hy + 13} L${cx - 42} ${hy + 16} M${cx + 22} ${hy + 8} L${cx + 44} ${hy + 4} M${cx + 22} ${hy + 13} L${cx + 42} ${hy + 16}`, 2.5, C.ol, 0.6);
    eyes = [[cx - 15, hy - 4], [cx + 15, hy - 4]];
    mouth = [cx, hy + 14];
    eyeR = 6;
    headR = 40;
  } else if (kind === 'dog') {
    W = 132; H = 136;
    const cx = W / 2;
    s += Ps(`M${cx + 28} ${H - 22} Q${cx + 56} ${H - 40} ${cx + 52} ${H - 66}`, 16, C.ol);
    s += Ps(`M${cx + 28} ${H - 22} Q${cx + 56} ${H - 40} ${cx + 52} ${H - 66}`, 8, col);
    s += P(`M${cx - 38} ${H - 6} Q${cx - 44} ${H - 62} ${cx} ${H - 68} Q${cx + 44} ${H - 62} ${cx + 38} ${H - 6}Z`, col);
    s += El(cx, H - 24, 18, 22, light, 0);
    if (color === 2) s += Ef(cx + 18, H - 46, 12, 10, '#6b4a3a', 0.85);
    s += El(cx - 17, H - 8, 13, 8, col, 3.5) + El(cx + 17, H - 8, 13, 8, col, 3.5);
    s += R(cx - 27, H - 72, 54, 10, 4, C.red, 3);
    s += Ci(cx, H - 61, 5, C.yellow, 2.5);
    const hy = H - 92;
    s += El(cx, hy, 40, 36, col);
    if (color === 2) s += Ef(cx - 16, hy - 12, 13, 12, '#6b4a3a', 0.85);
    // floppy ears
    s += P(`M${cx - 30} ${hy - 26} Q${cx - 58} ${hy - 20} ${cx - 50} ${hy + 18} Q${cx - 40} ${hy + 24} ${cx - 32} ${hy + 4}Z`, dk);
    s += P(`M${cx + 30} ${hy - 26} Q${cx + 58} ${hy - 20} ${cx + 50} ${hy + 18} Q${cx + 40} ${hy + 24} ${cx + 32} ${hy + 4}Z`, dk);
    s += El(cx, hy + 14, 18, 13, light, 3.5);
    s += El(cx, hy + 6, 8, 6, C.ol, 0);
    s += Ps(`M${cx} ${hy + 11} L${cx} ${hy + 17} M${cx} ${hy + 17} Q${cx - 6} ${hy + 22} ${cx - 10} ${hy + 18} M${cx} ${hy + 17} Q${cx + 6} ${hy + 22} ${cx + 10} ${hy + 18}`, 3);
    s += P(`M${cx - 6} ${hy + 22} Q${cx} ${hy + 34} ${cx + 6} ${hy + 22}Z`, C.rose, 2.5);
    eyes = [[cx - 15, hy - 6], [cx + 15, hy - 6]];
    mouth = [cx, hy + 18];
    eyeR = 6.5;
    headR = 40;
  } else if (kind === 'bunny') {
    W = 112; H = 176;
    const cx = W / 2;
    s += Ci(cx + 34, H - 18, 12, light, 3.5);
    s += P(`M${cx - 34} ${H - 6} Q${cx - 40} ${H - 56} ${cx} ${H - 62} Q${cx + 40} ${H - 56} ${cx + 34} ${H - 6}Z`, col);
    s += El(cx, H - 22, 16, 18, light, 0);
    s += El(cx - 16, H - 8, 13, 8, col, 3.5) + El(cx + 16, H - 8, 13, 8, col, 3.5);
    const hy = H - 80;
    s += El(cx - 15, hy - 46, 11, 32, col) + El(cx + 15, hy - 46, 11, 32, col);
    s += Ef(cx - 15, hy - 44, 5, 22, C.pinkL) + Ef(cx + 15, hy - 44, 5, 22, C.pinkL);
    s += El(cx, hy, 34, 30, col);
    s += El(cx, hy + 13, 12, 8, light, 0);
    s += P(`M${cx - 4} ${hy + 6} H${cx + 4} L${cx} ${hy + 10}Z`, C.pinkD, 2.5);
    s += Ps(`M${cx} ${hy + 10} L${cx} ${hy + 15}`, 3);
    s += R(cx - 6, hy + 15, 12, 8, 2, '#ffffff', 2.5);
    eyes = [[cx - 13, hy - 3], [cx + 13, hy - 3]];
    mouth = [cx, hy + 14];
    eyeR = 5.5;
    headR = 34;
  } else {
    W = 96; H = 84;
    const cx = W / 2;
    s += Ci(cx - 22, H - 66, 10, col) + Ci(cx + 22, H - 66, 10, col);
    s += Cf(cx - 22, H - 66, 5, C.pinkL) + Cf(cx + 22, H - 66, 5, C.pinkL);
    s += El(cx, H - 36, 40, 32, col);
    s += El(cx, H - 22, 24, 16, light, 0);
    s += El(cx - 16, H - 6, 9, 6, C.pinkL, 3) + El(cx + 16, H - 6, 9, 6, C.pinkL, 3);
    s += P(`M${cx - 3} ${H - 40} H${cx + 3} L${cx} ${H - 36}Z`, C.pinkD, 2.5);
    s += Ef(cx - 22, H - 32, 7, 5, C.pinkL, 0.8) + Ef(cx + 22, H - 32, 7, 5, C.pinkL, 0.8);
    eyes = [[cx - 12, H - 46], [cx + 12, H - 46]];
    mouth = [cx, H - 33];
    eyeR = 4.5;
    headR = 30;
  }
  return { svg: svg(W, H, s), w: W, h: H, ax: W / 2, ay: H - 2, eyes: eyes.map(([x, y]) => [x - W / 2, y - (H - 2)] as [number, number]), mouth: [mouth[0] - W / 2, mouth[1] - (H - 2)], eyeR, headR };
}

export function drawPetEyes(g: CanvasRenderingContext2D, a: PetArt, closed: boolean, blink: number, lx: number, ly: number) {
  g.fillStyle = '#3a2a48';
  g.strokeStyle = C.ol;
  g.lineCap = 'round';
  for (const [x, y] of a.eyes) {
    if (closed || blink > 0.6) {
      g.lineWidth = 3.5;
      g.beginPath();
      g.moveTo(x - a.eyeR, y);
      g.quadraticCurveTo(x, y + a.eyeR, x + a.eyeR, y);
      g.stroke();
    } else {
      g.beginPath();
      g.ellipse(x + lx * 2, y + ly * 2, a.eyeR, a.eyeR * 1.2 * (1 - blink * 0.8), 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(x + lx * 2 - a.eyeR * 0.3, y + ly * 2 - a.eyeR * 0.4, a.eyeR * 0.38, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3a2a48';
    }
  }
}
