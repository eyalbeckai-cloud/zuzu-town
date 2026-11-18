import { describe, it, expect } from 'vitest';
import { DEFS, LOCATIONS, ROSTER } from '../src/game/catalog';
import { World } from '../src/game/world';
import { HEAD, HAND } from '../src/game/types';
import { rawStrings } from '../src/i18n';
import { bodyArt, headArt, petArt, HAIR_STYLES, TOPS, PATTERNS, BOTTOMS, ACCS, SKIN, HAIR, CLOTH, type Look, type PetKind } from '../src/art/characters';

describe('catalog integrity', () => {
  it('every referenced def exists', () => {
    for (const d of DEFS.values()) {
      for (const s of d.slots ?? []) if (s.restock) expect(DEFS.has(s.restock), `${d.id} restock ${s.restock}`).toBe(true);
      for (const sp of d.spawn ?? []) expect(DEFS.has(sp), `${d.id} spawn ${sp}`).toBe(true);
      for (const c of d.cook ?? []) expect(DEFS.has(c.to), `${d.id} cook ${c.to}`).toBe(true);
    }
    for (const L of LOCATIONS) {
      for (const p of L.place) {
        expect(DEFS.has(p.def), `${L.id} place ${p.def}`).toBe(true);
        for (const [, k] of p.kids ?? []) expect(DEFS.has(k), `${L.id} kid ${k}`).toBe(true);
      }
      for (const c of L.chars ?? []) {
        expect(ROSTER[c.roster], `${L.id} roster ${c.roster}`).toBeTruthy();
        if (c.hat) expect(DEFS.get(c.hat)?.tags.includes('wear')).toBe(true);
        if (c.hold) expect(DEFS.has(c.hold)).toBe(true);
      }
      for (const p of L.place) {
        const d = DEFS.get(p.def)!;
        if (d.door) expect(LOCATIONS.some((x) => x.id === d.door)).toBe(true);
      }
    }
  });

  it('every roster character appears in exactly one location', () => {
    const seen = new Map<string, string>();
    for (const L of LOCATIONS) for (const c of L.chars ?? []) {
      expect(seen.has(c.roster), `${c.roster} in ${seen.get(c.roster)} and ${L.id}`).toBe(false);
      seen.set(c.roster, L.id);
    }
  });

  it('all art renders without NaN/undefined', () => {
    for (const d of DEFS.values()) {
      for (const v of d.art.variants ?? ['base']) {
        const s = d.art.art(v);
        expect(s.startsWith('<svg'), d.id).toBe(true);
        expect(/NaN|undefined/.test(s), `${d.id}:${v}`).toBe(false);
      }
      if (d.overlay) for (const v of d.overlay.variants ?? ['base']) expect(/NaN|undefined/.test(d.overlay.art(v)), `${d.id} overlay`).toBe(false);
    }
    for (const L of LOCATIONS) expect(/NaN|undefined/.test(L.bg()), L.id).toBe(false);
  });

  it('every character option combination is valid svg', () => {
    const base: Look = ROSTER.noa;
    const opts: [keyof Look, number][] = [['skin', SKIN.length], ['hair', HAIR_STYLES], ['hairColor', HAIR.length], ['top', TOPS], ['topColor', CLOTH.length], ['pattern', PATTERNS], ['bottom', BOTTOMS], ['bottomColor', CLOTH.length], ['shoes', CLOTH.length], ['acc', ACCS]];
    for (const size of ['baby', 'kid', 'adult'] as const) {
      for (const [k, n] of opts) {
        for (let v = 0; v < n; v++) {
          const l = { ...base, size, [k]: v } as Look;
          for (const s of [bodyArt(l, 'stand').svg, bodyArt(l, 'sit').svg, headArt(l).svg]) expect(/NaN|undefined/.test(s), `${size} ${k}=${v}`).toBe(false);
        }
      }
    }
    for (const kind of ['cat', 'dog', 'bunny', 'hamster'] as PetKind[]) for (let c = 0; c < 4; c++) expect(/NaN|undefined/.test(petArt(kind, c).svg)).toBe(false);
  });
});

describe('world', () => {
  it('initializes locations, attaches and round-trips through save', () => {
    const w = new World();
    for (const L of LOCATIONS) w.ensureLocation(L);
    const n = w.ents.size;
    expect(n).toBeGreaterThan(80);
    // seated characters / worn hats exist
    const baker = [...w.ents.values()].find((e) => e.s.rid === 'baker')!;
    expect(w.childAt(baker.id, HEAD)?.def).toBe('chefhat');
    const vet = [...w.ents.values()].find((e) => e.s.rid === 'vet')!;
    expect(w.childAt(vet.id, HAND)?.def).toBe('stethoscope');
    const tamar = [...w.ents.values()].find((e) => e.s.rid === 'tamar')!;
    expect(w.get(tamar.p)?.def).toBe('swingset');
    // pocket
    const ball = [...w.ents.values()].find((e) => e.def === 'ball')!;
    w.setLoc(ball, 'pocket');
    ball.pocketIdx = 2;
    expect(w.pocket()[2]?.id).toBe(ball.id);
    // save / load
    w.owned.add('full_town');
    const json = w.serialize();
    const w2 = World.load(json);
    expect(w2.ents.size).toBe(n);
    expect(w2.owned.has('full_town')).toBe(true);
    expect(w2.pocket()[2]?.def).toBe('ball');
    expect(w2.childAt(baker.id, HEAD)?.def).toBe('chefhat');
  });

  it('remove deletes children too', () => {
    const w = new World();
    w.ensureLocation(LOCATIONS[0]);
    const sofa = [...w.ents.values()].find((e) => e.def === 'sofa')!;
    const kids = w.children(sofa.id).length;
    expect(kids).toBeGreaterThan(0);
    w.remove(sofa.id);
    expect(w.children(sofa.id).length).toBe(0);
  });

  it('survives corrupt saves', () => {
    expect(World.load('{bad json').ents.size).toBe(0);
    expect(World.load(JSON.stringify({ v: 999 })).ents.size).toBe(0);
  });
});

describe('i18n', () => {
  it('has Hebrew and English for every string', () => {
    for (const [k, v] of Object.entries(rawStrings())) {
      expect(v.en.length, k).toBeGreaterThan(0);
      expect(v.he.length, k).toBeGreaterThan(0);
    }
  });
});

import { DISCOVERIES, discoveriesFor } from '../src/game/discover';
import { LOCATIONS as LOCS2 } from '../src/game/catalog';
describe('discoveries', () => {
  it('8 unique surprises per location, labelled in both languages', () => {
    const ids = new Set(DISCOVERIES.map((d) => d.id));
    expect(ids.size).toBe(DISCOVERIES.length);
    for (const L of LOCS2) {
      const list = discoveriesFor(L.id);
      expect(list.length).toBe(8);
      for (const d of list) { expect(d.en.length).toBeGreaterThan(1); expect(d.he.length).toBeGreaterThan(1); expect(d.icon.length).toBeGreaterThan(0); }
    }
  });
});
