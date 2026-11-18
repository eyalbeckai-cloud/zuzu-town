import type { Ent, EntState, LocationDef, Placement } from './types';
import { HAND, HEAD } from './types';
import { DEFS, LOC, ROSTER } from './catalog';
import type { Look } from '../art/characters';

export const SAVE_VERSION = 1;
export const POCKET_SIZE = 5;

export interface Settings {
  music: boolean;
  sfx: boolean;
  lang: 'auto' | 'he' | 'en';
}

export interface SaveData {
  v: number;
  seq: number;
  ents: Ent[];
  inited: string[];
  current: string;
  cam: Record<string, number>;
  settings: Settings;
  owned: string[];
}

export class World {
  ents = new Map<string, Ent>();
  inited = new Set<string>();
  current = 'home';
  cam: Record<string, number> = {};
  settings: Settings = { music: true, sfx: true, lang: 'auto' };
  owned = new Set<string>();
  seq = 1;
  dirty = false;
  private kidsIdx: Map<string, Ent[]> | null = null;

  newId() { return 'e' + (this.seq++).toString(36); }

  touch() { this.dirty = true; this.kidsIdx = null; }

  add(e: Ent) { this.ents.set(e.id, e); this.touch(); return e; }

  remove(id: string) {
    for (const k of this.children(id)) this.remove(k.id);
    this.ents.delete(id);
    this.touch();
  }

  get(id: string | undefined) { return id ? this.ents.get(id) : undefined; }

  children(id: string): Ent[] {
    if (!this.kidsIdx) {
      this.kidsIdx = new Map();
      for (const e of this.ents.values()) {
        if (!e.p) continue;
        let a = this.kidsIdx.get(e.p);
        if (!a) this.kidsIdx.set(e.p, (a = []));
        a.push(e);
      }
    }
    return this.kidsIdx.get(id) ?? [];
  }

  childAt(id: string, slot: number): Ent | undefined {
    return this.children(id).find((c) => c.slot === slot);
  }

  /** top-level entities of a location */
  roots(loc: string): Ent[] {
    const out: Ent[] = [];
    for (const e of this.ents.values()) if (!e.p && e.loc === loc) out.push(e);
    return out;
  }

  /** set location for entity + all descendants */
  setLoc(e: Ent, loc: string) {
    e.loc = loc;
    for (const c of this.children(e.id)) this.setLoc(c, loc);
    this.touch();
  }

  attach(child: Ent, parent: Ent, slot: number) {
    child.p = parent.id;
    child.slot = slot;
    this.setLoc(child, parent.loc);
    this.touch();
  }

  detach(child: Ent) {
    delete child.p;
    delete child.slot;
    this.touch();
  }

  pocket(): (Ent | undefined)[] {
    const arr: (Ent | undefined)[] = new Array(POCKET_SIZE).fill(undefined);
    for (const e of this.ents.values()) {
      if (e.loc === 'pocket' && !e.p && e.pocketIdx !== undefined && e.pocketIdx < POCKET_SIZE) arr[e.pocketIdx] = e;
    }
    return arr;
  }

  makeThing(def: string, loc: string, x: number, y: number, s: EntState = {}): Ent {
    const d = DEFS.get(def);
    const st: EntState = { ...s };
    if (d?.bites && st.bites === undefined) st.bites = d.bites;
    return this.add({ id: this.newId(), def, loc, x, y, s: st });
  }

  makeChar(rid: string, look: Look, loc: string, x: number, y: number): Ent {
    return this.add({ id: this.newId(), def: 'char', loc, x, y, s: { rid }, look: { ...look } });
  }

  ensureLocation(loc: LocationDef) {
    if (this.inited.has(loc.id)) return;
    this.inited.add(loc.id);
    const placed: Ent[] = [];
    const place = (p: Placement) => {
      const e = this.makeThing(p.def, loc.id, p.x, p.y, p.s ?? {});
      if (p.flip) e.flip = true;
      placed.push(e);
      for (const [slot, d, st] of p.kids ?? []) {
        const k = this.makeThing(d, loc.id, p.x, p.y, st ?? {});
        this.attach(k, e, slot);
      }
      const dd = DEFS.get(p.def);
      if (dd?.autoRestock) dd.slots?.forEach((sl, i) => {
        if (!sl.restock || this.childAt(e.id, i)) return;
        const k = this.makeThing(sl.restock, loc.id, p.x, p.y);
        this.attach(k, e, i);
      });
    };
    for (const p of loc.place) place(p);
    const trySeat = (e: Ent) => {
      // snap initial characters/pets into a nearby free slot
      let best: { p: Ent; i: number; d: number } | null = null;
      for (const f of placed) {
        const d = DEFS.get(f.def);
        d?.slots?.forEach((s, i) => {
          if (!s.accept.includes(e.def === 'pet' ? 'pet' : 'char')) return;
          if (this.childAt(f.id, i)) return;
          const dd = Math.hypot(f.x + s.x - e.x, f.y + s.y - e.y);
          if (dd < 50 && (!best || dd < best.d)) best = { p: f, i, d: dd };
        });
      }
      if (best) this.attach(e, (best as any).p, (best as any).i);
    };
    for (const c of loc.chars ?? []) {
      const look = ROSTER[c.roster];
      if (!look) continue;
      const ce = this.makeChar(c.roster, look, loc.id, c.x, c.y);
      trySeat(ce);
      if (c.hat) this.giveHat(ce.id, c.hat);
      if (c.hold) this.giveHand(ce.id, c.hold);
    }
    for (const p of loc.pets ?? []) {
      const e = this.add({ id: this.newId(), def: 'pet', loc: loc.id, x: p.x, y: p.y, s: {}, pet: { kind: p.kind, color: p.color } });
      trySeat(e);
    }
    // extra character-held / worn items declared via state
    this.touch();
  }

  /** wear / hold helpers used by location setup */
  giveHat(charId: string, def: string) {
    const c = this.get(charId);
    if (!c) return;
    const h = this.makeThing(def, c.loc, c.x, c.y);
    this.attach(h, c, HEAD);
  }

  giveHand(charId: string, def: string) {
    const c = this.get(charId);
    if (!c) return;
    const h = this.makeThing(def, c.loc, c.x, c.y);
    this.attach(h, c, HAND);
  }

  serialize(): string {
    const d: SaveData = {
      v: SAVE_VERSION,
      seq: this.seq,
      ents: [...this.ents.values()],
      inited: [...this.inited],
      current: this.current,
      cam: this.cam,
      settings: this.settings,
      owned: [...this.owned],
    };
    return JSON.stringify(d);
  }

  static load(json: string | null): World {
    const w = new World();
    if (!json) return w;
    try {
      const d = JSON.parse(json) as SaveData;
      if (!d || d.v !== SAVE_VERSION) return w;
      w.seq = d.seq || 1;
      for (const e of d.ents || []) {
        if (e.def !== 'char' && e.def !== 'pet' && !DEFS.has(e.def)) continue;
        w.ents.set(e.id, e);
      }
      // drop orphans
      for (const e of [...w.ents.values()]) if (e.p && !w.ents.has(e.p)) { delete e.p; delete e.slot; }
      w.inited = new Set((d.inited || []).filter((id) => LOC.has(id)));
      w.current = LOC.has(d.current) ? d.current : 'home';
      w.cam = d.cam || {};
      w.settings = { ...w.settings, ...(d.settings || {}) };
      w.owned = new Set(d.owned || []);
    } catch (e) {
      console.warn('save load failed', e);
      return new World();
    }
    return w;
  }
}
