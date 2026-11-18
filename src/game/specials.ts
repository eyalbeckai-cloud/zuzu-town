// Per-object special behaviors (drawing extras, animated slots, custom taps).
import type { ThingActor, Actor } from './actors';
import { CharActor, PetActor } from './actors';
import type { PlayScene } from './play';
import { sound } from '../engine/audio';
import { ease, rand, clamp } from '../engine/tween';
import { SWING_PIVOTS, SWING_LEN, SLIDE_PATH } from './locations/park';

const slides = new Map<string, { t: number; k: number }>();

export interface Special {
  draw?(g: CanvasRenderingContext2D, a: ThingActor, sc: PlayScene): void;
  update?(a: ThingActor, dt: number, sc: PlayScene): void;
  slotPos?(a: ThingActor, i: number, sc: PlayScene): { x: number; y: number; rot: number } | null;
  tap?(a: ThingActor, sc: PlayScene): boolean;
  attach?(a: ThingActor, child: Actor, i: number, sc: PlayScene): void;
}

const OL = '#45365a';

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export const SPECIALS: Record<string, Special> = {
  tv: {
    draw(g, a, sc) {
      if (!a.e.s.on) return;
      const x = -100, y = -246, w = 200, h = 128;
      const t = sc.time;
      g.save();
      rr(g, x, y, w, h, 8);
      g.clip();
      const ch = (a.e.s.ch as number) ?? 0;
      if (ch === 0) {
        const cols = ['#ff6b9a', '#ffd866', '#80dcc1', '#7cc4ff', '#b79cff'];
        for (let i = 0; i < 5; i++) { g.fillStyle = cols[i]; g.fillRect(x + i * 40, y, 40, h); }
        const bx = x + 100 + Math.sin(t * 2.2) * 70, by = y + 70 - Math.abs(Math.sin(t * 4.4)) * 50;
        g.fillStyle = '#fff'; g.strokeStyle = OL; g.lineWidth = 4;
        g.beginPath(); g.arc(bx, by, 16, 0, Math.PI * 2); g.fill(); g.stroke();
      } else if (ch === 1) {
        g.fillStyle = '#9fe0ff'; g.fillRect(x, y, w, h);
        g.fillStyle = '#ffd866'; g.beginPath(); g.arc(x + 160, y + 34, 18, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8fd16a';
        for (let i = -1; i < 4; i++) {
          const hx = x + ((i * 90 - t * 40) % 360 + 360) % 360 - 60;
          g.beginPath(); g.ellipse(hx, y + h + 10, 70, 50, 0, 0, Math.PI * 2); g.fill();
        }
        const cx = x + ((t * 60) % 280) - 40;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, y + 40, 14, 0, Math.PI * 2); g.arc(cx + 16, y + 34, 16, 0, Math.PI * 2); g.arc(cx + 32, y + 42, 12, 0, Math.PI * 2); g.fill();
      } else {
        g.fillStyle = '#4e9fe6'; g.fillRect(x, y, w, h);
        for (let i = 0; i < 3; i++) {
          const fx = x + ((t * (40 + i * 25) + i * 70) % 260) - 30, fy = y + 30 + i * 36 + Math.sin(t * 3 + i) * 6;
          g.fillStyle = ['#ffa25c', '#ffd866', '#ff6b9a'][i];
          g.beginPath(); g.ellipse(fx, fy, 16, 10, 0, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.moveTo(fx - 14, fy); g.lineTo(fx - 26, fy - 9); g.lineTo(fx - 26, fy + 9); g.closePath(); g.fill();
          g.fillStyle = OL; g.beginPath(); g.arc(fx + 7, fy - 2, 2.5, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + 30 + i * 40, y + h - ((t * 30 + i * 37) % h), 4, 0, Math.PI * 2); g.fill(); }
      }
      g.fillStyle = 'rgba(255,255,255,0.12)';
      for (let yy = y; yy < y + h; yy += 6) g.fillRect(x, yy, w, 2);
      g.restore();
    },
  },
  sink: {
    draw(g, a, sc) {
      if (!a.e.s.on) return;
      const t = sc.time;
      g.save();
      g.strokeStyle = 'rgba(124,196,255,0.85)';
      g.lineCap = 'round';
      g.lineWidth = 9 + Math.sin(t * 20) * 1.5;
      g.beginPath();
      g.moveTo(36, -218);
      g.lineTo(36 + Math.sin(t * 15) * 1.5, -186);
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(33, -214);
      g.lineTo(33, -192);
      g.stroke();
      g.restore();
    },
    update(a, dt, sc) {
      if (a.e.s.on && Math.random() < dt * 12) {
        const p = a.localToWorld(36 + rand(-10, 10), -188);
        sc.fx.emit('drop', p.x, p.y, 1, { color: '#9fd8ff' });
      }
      if (a.e.s.on && Math.random() < dt * 1.5) sound.play('bubble', 0.7);
    },
  },
  stove: {
    update(a, dt, sc) {
      if (a.e.s.on && Math.random() < dt * 2) {
        const p = a.localToWorld(rand(-70, 70), -200);
        sc.fx.emit('steam', p.x, p.y, 1, { color: '#ffffff' });
      }
    },
  },
  radio: {
    update(a, dt, sc) {
      if (a.e.s.on && Math.random() < dt * 2.2) {
        const p = a.localToWorld(rand(-30, 30), -80);
        sc.fx.emit('note', p.x, p.y, 1);
      }
      if (a.e.s.on) {
        a.sx = 1 + Math.sin(sc.time * 13) * 0.025;
        a.sy = 1 - Math.sin(sc.time * 13) * 0.025;
        for (const c of sc.actors.values()) if (c instanceof CharActor && !c.dragging) c.dance = Math.max(c.dance, 0.5);
      }
    },
  },
  floorlamp: {
    draw(g, a) {
      if (!a.e.s.on) return;
      g.save();
      const gr = g.createRadialGradient(0, -260, 10, 0, -260, 120);
      gr.addColorStop(0, 'rgba(255,240,170,0.55)');
      gr.addColorStop(1, 'rgba(255,240,170,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, -260, 120, 0, Math.PI * 2);
      g.fill();
      g.restore();
    },
  },
  bathsink: {
    draw(g, a, sc) {
      if (!a.e.s.on) return;
      g.save();
      g.strokeStyle = 'rgba(124,196,255,0.85)';
      g.lineCap = 'round';
      g.lineWidth = 7 + Math.sin(sc.time * 20);
      g.beginPath();
      g.moveTo(22, -214);
      g.lineTo(22, -176);
      g.stroke();
      g.restore();
    },
    update(a, dt, sc) {
      if (a.e.s.on && Math.random() < dt * 8) {
        const p = a.localToWorld(22 + rand(-8, 8), -176);
        sc.fx.emit('drop', p.x, p.y, 1, { color: '#9fd8ff' });
      }
    },
  },
  bathtub: {
    update(a, dt, sc) {
      if (!a.e.s.on) return;
      const kids = sc.world.children(a.id).length;
      if (Math.random() < dt * (1.2 + kids * 2)) {
        const p = a.localToWorld(rand(-150, 150), -110);
        sc.fx.emit('bubble', p.x, p.y, 1);
      }
      for (const k of sc.world.children(a.id)) {
        const ka = sc.actors.get(k.id);
        if (ka instanceof CharActor && Math.random() < dt * 0.4) { ka.setMood('happy', 1); }
      }
    },
    attach(a, child, _i, sc) {
      const p = a.localToWorld(0, -110);
      sc.fx.emit('drop', p.x, p.y, 10, { color: '#bfe8ff', speed: 200 });
      if (a.e.s.on) sc.fx.emit('bubble', p.x, p.y, 8);
      if (child instanceof PetActor) child.setMood('happy', 2);
    },
  },
  toilet: {
    tap(a, sc) {
      sound.play('flush');
      const p = a.localToWorld(0, -96);
      for (let i = 0; i < 12; i++) sc.timers.after(i * 0.06, () => sc.fx.emit('bubble', p.x + Math.cos(i) * 30, p.y + Math.sin(i) * 8, 1, { color: '#bfe8ff' }));
      sc.wobble(a, 0.05);
      for (const k of sc.world.children(a.id)) {
        const ka = sc.actors.get(k.id);
        if (ka instanceof CharActor) { ka.setMood('surprise', 1); sound.play('giggle', 1.2); }
      }
      return true;
    },
  },
  swingset: {
    update(a, dt, sc) {
      let st = sc.swing.get(a.id);
      if (!st) { st = { a: [0, 0], v: [0, 0] }; sc.swing.set(a.id, st); }
      for (let i = 0; i < 2; i++) {
        const occ = !!sc.world.childAt(a.id, i);
        let ang = st.a[i], v = st.v[i];
        const acc = -3.1 * Math.sin(ang) - (occ ? 0.05 : 0.9) * v;
        v += acc * dt;
        if (occ && Math.abs(ang) < 0.05 && Math.abs(v) < 0.95) v += Math.sign(v || 1) * 0.04;
        ang += v * dt;
        st.a[i] = clamp(ang, -0.85, 0.85);
        st.v[i] = v;
        if (occ && Math.abs(ang) < 0.02 && Math.abs(v) > 0.9 && Math.random() < 0.08) sound.play('swing');
      }
    },
    slotPos(a, i, sc) {
      const st = sc.swing.get(a.id);
      const ang = st ? st.a[i] : 0;
      const pv = SWING_PIVOTS[i];
      const w = a.localToWorld(pv.x + Math.sin(ang) * SWING_LEN, pv.y + Math.cos(ang) * SWING_LEN);
      return { x: w.x, y: w.y, rot: -ang };
    },
    draw(g, a, sc) {
      const st = sc.swing.get(a.id);
      for (let i = 0; i < 2; i++) {
        const ang = st ? st.a[i] : 0;
        const pv = SWING_PIVOTS[i];
        g.save();
        g.translate(pv.x, pv.y);
        g.rotate(-ang);
        g.strokeStyle = OL;
        g.lineWidth = 7;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(-26, 0); g.lineTo(-30, SWING_LEN); g.moveTo(26, 0); g.lineTo(30, SWING_LEN); g.stroke();
        g.strokeStyle = '#aab7c6';
        g.lineWidth = 3;
        g.setLineDash([6, 5]);
        g.beginPath(); g.moveTo(-26, 0); g.lineTo(-30, SWING_LEN); g.moveTo(26, 0); g.lineTo(30, SWING_LEN); g.stroke();
        g.setLineDash([]);
        rr(g, -46, SWING_LEN - 4, 92, 18, 8);
        g.fillStyle = '#80dcc1';
        g.fill();
        g.lineWidth = 4;
        g.strokeStyle = OL;
        g.stroke();
        g.restore();
      }
    },
    tap(a, sc) {
      const st = sc.swing.get(a.id);
      if (st) for (let i = 0; i < 2; i++) st.v[i] += (Math.sign(st.v[i]) || 1) * 1.2;
      sound.play('swing');
      return true;
    },
    attach(a, child, i, sc) {
      const st = sc.swing.get(a.id);
      if (st) st.v[i] = 1.0;
      if (child instanceof CharActor) sound.play('wheee', 1.1);
    },
  },
  slide: {
    update(a, dt, sc) {
      for (const k of sc.world.children(a.id)) {
        let st = slides.get(k.id);
        if (!st) { st = { t: 0, k: 0 }; slides.set(k.id, st); }
        st.t += dt;
        if (st.t > 0.5) {
          if (st.k === 0) sound.play('wheee');
          st.k = Math.min(1, st.k + dt * (0.5 + st.k * 2.2));
        }
        if (st.k >= 1) {
          slides.delete(k.id);
          const ka = sc.actors.get(k.id);
          sc.world.detach(k);
          const end = a.localToWorld(SLIDE_PATH.x1 + 50, 0);
          k.x = end.x;
          k.y = clamp(end.y, sc.loc.floor.top, sc.loc.floor.bottom);
          if (ka) {
            ka.x = k.x; ka.y = k.y;
            sc.land(ka);
            if (ka instanceof CharActor) ka.setMood('happy', 1.5);
          }
          const p = a.localToWorld(SLIDE_PATH.x1, SLIDE_PATH.y1);
          sc.fx.emit('star', p.x, p.y, 4, { color: '#ffd866' });
        }
      }
      for (const id of [...slides.keys()]) { const e = sc.world.get(id); if (!e || e.p !== a.id) slides.delete(id); }
    },
    slotPos(a, _i, sc) {
      const k0 = sc.world.childAt(a.id, 0);
      const st = k0 ? slides.get(k0.id) : undefined;
      const t = st ? st.k : 0;
      const P = SLIDE_PATH;
      const x = (1 - t) * (1 - t) * P.x0 + 2 * (1 - t) * t * P.cx + t * t * P.x1;
      const y = (1 - t) * (1 - t) * P.y0 + 2 * (1 - t) * t * P.cy + t * t * P.y1;
      const w = a.localToWorld(x, y);
      return { x: w.x, y: w.y, rot: t > 0 && t < 1 ? 0.35 : 0 };
    },
    attach(_a, child) {
      slides.set(child.id, { t: 0, k: 0 });
    },
  },
  fountain: {
    update(a, dt, sc) {
      if (!a.e.s.on) return;
      if (Math.random() < dt * 30) {
        const p = a.localToWorld(rand(-6, 6), -132);
        sc.fx.emit('drop', p.x, p.y, 1, { color: '#9fd8ff' });
        const L = sc.fx.list;
        const q = L[L.length - 1];
        q.vy = -rand(380, 470);
        q.vx = rand(-110, 110);
        q.life = q.max = 0.95;
      }
    },
  },
  register: {
    tap(a, sc) {
      sound.play('kaching');
      const p = a.localToWorld(0, -110);
      sc.fx.emit('coin', p.x, p.y, 6);
      sc.wobble(a, 0.08);
      return true;
    },
  },
  xray: {
    tap(a, sc) {
      a.e.s.on = !a.e.s.on;
      sound.play(a.e.s.on ? 'xray' : 'click');
      sc.wobble(a, 0.03);
      return true;
    },
    draw(g, a, sc) {
      if (!a.e.s.on) return;
      // local coords: screen area x -105..105, y -170..-20
      g.save();
      rr(g, -105, -170, 210, 150, 10);
      g.clip();
      const t = sc.time;
      g.strokeStyle = 'rgba(190,240,255,0.95)';
      g.fillStyle = 'rgba(190,240,255,0.9)';
      g.lineWidth = 6;
      g.lineCap = 'round';
      let kind: string | null = null;
      for (const ac of sc.actors.values()) {
        if ((ac as any).d?.id === 'examtable') {
          const k0 = sc.world.childAt(ac.id, 0) || sc.world.childAt(ac.id, 1);
          if (k0?.pet) kind = k0.pet.kind;
          else if (k0?.def === 'char') kind = 'char';
        }
      }
      const cx = 0, cy = -95;
      if (kind === 'char') {
        g.beginPath(); g.arc(cx, cy - 30, 22, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 40); g.moveTo(cx - 30, cy + 5); g.lineTo(cx + 30, cy + 5);
        for (let i = 0; i < 3; i++) { g.moveTo(cx - 16, cy + 12 + i * 9); g.lineTo(cx + 16, cy + 12 + i * 9); }
        g.stroke();
      } else if (kind) {
        g.beginPath(); g.ellipse(cx - 50, cy - 10, 22, 18, 0, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(cx - 28, cy - 4); g.lineTo(cx + 50, cy - 4);
        for (let i = 0; i < 5; i++) { g.moveTo(cx - 14 + i * 14, cy - 18); g.lineTo(cx - 14 + i * 14, cy + 10); }
        g.moveTo(cx - 20, cy); g.lineTo(cx - 24, cy + 40); g.moveTo(cx + 40, cy); g.lineTo(cx + 44, cy + 40);
        g.moveTo(cx + 50, cy - 4); g.quadraticCurveTo(cx + 80, cy - 20, cx + 86, cy - 44);
        if (kind === 'bunny') { g.moveTo(cx - 56, cy - 26); g.lineTo(cx - 62, cy - 60); g.moveTo(cx - 44, cy - 26); g.lineTo(cx - 40, cy - 60); }
        g.stroke();
      } else {
        g.beginPath();
        g.moveTo(cx - 40, cy); g.lineTo(cx + 40, cy); g.stroke();
        for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 44, cy - 7, 9, 0, Math.PI * 2); g.arc(cx + sx * 44, cy + 7, 9, 0, Math.PI * 2); g.fill(); }
      }
      const yy = -170 + ((t * 60) % 150);
      g.fillStyle = 'rgba(128,220,193,0.35)';
      g.fillRect(-105, yy, 210, 10);
      g.restore();
    },
  },
  petscale: {
    draw(g, a, sc) {
      const k = sc.world.childAt(a.id, 0);
      let txt = '0.0';
      if (k) {
        if (k.pet) txt = ({ cat: '4.2', dog: '9.5', bunny: '1.8', hamster: '0.1' } as Record<string, string>)[k.pet.kind] ?? '1.0';
        else if (k.look) txt = k.look.size === 'adult' ? '68' : k.look.size === 'baby' ? '9.0' : '22';
        else txt = '0.5';
      }
      g.save();
      g.fillStyle = k ? '#bfffd9' : '#6f8a8a';
      g.font = '800 20px Rubik, system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(txt, 0, -24);
      g.restore();
    },
    attach(a, _c, _i, sc) { sound.play('scale'); const p = a.localToWorld(0, -60); sc.fx.emit('star', p.x, p.y - 60, 3, { color: '#ffd866' }); },
  },
  bedlamp: {
    draw(g, a) {
      if (!a.e.s.on) return;
      g.save();
      const gr = g.createRadialGradient(0, -120, 6, 0, -120, 90);
      gr.addColorStop(0, 'rgba(255,240,170,0.6)');
      gr.addColorStop(1, 'rgba(255,240,170,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, -120, 90, 0, Math.PI * 2);
      g.fill();
      g.restore();
    },
  },
};

SPECIALS.petbath = { update: SPECIALS.bathtub.update, attach: SPECIALS.bathtub.attach };

export function registerSpecials(more: Record<string, Special>) {
  Object.assign(SPECIALS, more);
}

export { ease, CharActor, PetActor };
