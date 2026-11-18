import { rand, pick } from './tween';

export type PKind = 'heart' | 'star' | 'sparkle' | 'bubble' | 'zzz' | 'note' | 'crumb' | 'drop' | 'coin' | 'steam' | 'confetti' | 'puff';

interface P {
  k: PKind;
  x: number; y: number;
  vx: number; vy: number;
  g: number;
  life: number; max: number;
  s: number; rot: number; vr: number;
  color: string;
  drag: number;
}

const CONFETTI = ['#ff6b9a', '#ffd866', '#7cc4ff', '#7fdcc0', '#b79cff', '#ffa25c'];

export interface EmitOpts {
  color?: string;
  spread?: number;
  speed?: number;
  up?: number;
  size?: number;
  life?: number;
  gravity?: number;
}

export class Particles {
  list: P[] = [];

  emit(k: PKind, x: number, y: number, n = 1, o: EmitOpts = {}) {
    for (let i = 0; i < n; i++) {
      const spread = o.spread ?? 1;
      const sp = o.speed ?? 120;
      let vx = rand(-sp, sp) * spread;
      let vy = -rand(sp * 0.5, sp) * (o.up ?? 1);
      let g = o.gravity ?? 0;
      let life = o.life ?? rand(0.9, 1.5);
      let size = (o.size ?? 1) * rand(0.8, 1.2);
      let drag = 0.6;
      let color = o.color ?? '#ff6b9a';
      switch (k) {
        case 'heart': vy = -rand(60, 130); vx = rand(-50, 50); color = o.color ?? '#ff6b9a'; break;
        case 'star': g = 0; break;
        case 'sparkle': g = 0; life = o.life ?? rand(0.5, 0.9); color = o.color ?? '#fff3a0'; break;
        case 'bubble': vy = -rand(40, 110); vx = rand(-30, 30); life = rand(1.2, 2.2); color = o.color ?? '#bfe8ff'; break;
        case 'zzz': vy = -40; vx = rand(10, 30); life = 2.2; drag = 0; break;
        case 'note': vy = -rand(50, 80); vx = rand(-40, 40); life = 1.8; color = pick(['#b79cff', '#ff6b9a', '#4e9fe6', '#4fbf9f']); break;
        case 'crumb': g = 900; vy = -rand(80, 220); vx = rand(-140, 140); life = rand(0.6, 1.0); color = o.color ?? '#e3a86b'; drag = 0; break;
        case 'drop': g = 1200; vy = rand(0, 60); vx = rand(-20, 20); life = 0.6; color = o.color ?? '#7cc4ff'; drag = 0; break;
        case 'coin': g = 1000; vy = -rand(250, 420); vx = rand(-120, 120); life = 1.1; color = '#ffd34d'; drag = 0; break;
        case 'steam': vy = -rand(30, 60); vx = rand(-12, 12); life = rand(1.0, 1.6); color = o.color ?? '#ffffff'; break;
        case 'confetti': g = 500; vy = -rand(250, 500); vx = rand(-260, 260); life = rand(1.4, 2.2); color = pick(CONFETTI); break;
        case 'puff': vy = -rand(10, 40); vx = rand(-60, 60); life = 0.5; color = o.color ?? '#ffffff'; break;
      }
      this.list.push({ k, x, y, vx, vy, g, life, max: life, s: size, rot: rand(-0.4, 0.4), vr: rand(-3, 3), color, drag });
    }
  }

  update(dt: number) {
    if (!this.list.length) return;
    for (const p of this.list) {
      p.life -= dt;
      p.vy += p.g * dt;
      const d = Math.pow(p.drag, dt);
      if (p.g === 0) { p.vx *= d; p.vy *= d; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.k === 'bubble' || p.k === 'zzz' || p.k === 'note') p.x += Math.sin(p.life * 6) * 18 * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  clear() { this.list = []; }

  draw(g: CanvasRenderingContext2D) {
    for (const p of this.list) {
      const t = p.life / p.max; // 1 -> 0
      const a = Math.min(1, t * 2.2);
      g.save();
      g.globalAlpha = a;
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      const s = p.s;
      switch (p.k) {
        case 'heart': heart(g, 16 * s * (0.6 + (1 - t) * 0.6), p.color); break;
        case 'star': star(g, 14 * s, p.color); break;
        case 'sparkle': sparkle(g, 18 * s * (0.4 + Math.sin(t * Math.PI)), p.color); break;
        case 'bubble': bubble(g, 13 * s * (0.7 + (1 - t) * 0.5)); break;
        case 'zzz': text(g, 'z', 26 * s * (0.7 + (1 - t) * 0.6), '#7a6bb0'); break;
        case 'note': text(g, Math.floor(p.max * 10) % 2 ? '♪' : '♫', 30 * s, p.color); break;
        case 'crumb': dot(g, 5 * s, p.color); break;
        case 'drop': drop(g, 7 * s, p.color); break;
        case 'coin': coin(g, 13 * s); break;
        case 'steam': puff(g, 14 * s * (1.4 - t), p.color, 0.5 * t); break;
        case 'confetti': g.fillStyle = p.color; g.fillRect(-6 * s, -3 * s, 12 * s, 6 * s); break;
        case 'puff': puff(g, 18 * s * (1.6 - t), p.color, 0.8); break;
      }
      g.restore();
    }
  }
}

const OL = '#45365a';

function heart(g: CanvasRenderingContext2D, r: number, c: string) {
  g.beginPath();
  g.moveTo(0, r * 0.9);
  g.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.45);
  g.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9);
  g.closePath();
  g.fillStyle = c;
  g.strokeStyle = '#fff';
  g.lineWidth = 3;
  g.stroke();
  g.fill();
}

function star(g: CanvasRenderingContext2D, r: number, c: string) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = c;
  g.strokeStyle = '#fff';
  g.lineWidth = 3;
  g.stroke();
  g.fill();
}

function sparkle(g: CanvasRenderingContext2D, r: number, c: string) {
  g.beginPath();
  g.moveTo(0, -r);
  g.quadraticCurveTo(0, 0, r, 0);
  g.quadraticCurveTo(0, 0, 0, r);
  g.quadraticCurveTo(0, 0, -r, 0);
  g.quadraticCurveTo(0, 0, 0, -r);
  g.fillStyle = c;
  g.fill();
}

function bubble(g: CanvasRenderingContext2D, r: number) {
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fillStyle = 'rgba(220,240,255,0.45)';
  g.fill();
  g.strokeStyle = 'rgba(120,170,230,0.9)';
  g.lineWidth = 2.5;
  g.stroke();
  g.beginPath();
  g.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
  g.fillStyle = '#fff';
  g.fill();
}

function text(g: CanvasRenderingContext2D, s: string, size: number, c: string) {
  g.font = `800 ${size}px Rubik, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 5;
  g.strokeStyle = '#fff';
  g.strokeText(s, 0, 0);
  g.fillStyle = c;
  g.fillText(s, 0, 0);
}

function dot(g: CanvasRenderingContext2D, r: number, c: string) {
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
}

function drop(g: CanvasRenderingContext2D, r: number, c: string) {
  g.beginPath();
  g.moveTo(0, -r * 1.6);
  g.quadraticCurveTo(r, 0, 0, r);
  g.quadraticCurveTo(-r, 0, 0, -r * 1.6);
  g.fillStyle = c;
  g.fill();
}

function coin(g: CanvasRenderingContext2D, r: number) {
  g.beginPath();
  g.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  g.fillStyle = '#ffd34d';
  g.strokeStyle = OL;
  g.lineWidth = 3;
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  g.strokeStyle = '#e8a91a';
  g.lineWidth = 2.5;
  g.stroke();
}

function puff(g: CanvasRenderingContext2D, r: number, c: string, a: number) {
  g.globalAlpha *= a;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.arc(r * 0.8, r * 0.2, r * 0.7, 0, Math.PI * 2);
  g.arc(-r * 0.8, r * 0.25, r * 0.65, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
}
