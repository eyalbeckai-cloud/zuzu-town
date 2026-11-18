import type { ThingDef, LocationDef } from './types';
import type { Look } from '../art/characters';
import { ITEMS } from './things/items';
import { HOME, HOME_DEFS } from './locations/home';
import { BEDROOM, BEDROOM_DEFS } from './locations/bedroom';
import { PARK, PARK_DEFS } from './locations/park';
import { BAKERY, BAKERY_DEFS } from './locations/bakery';
import { VET, VET_DEFS } from './locations/vet';
import { MARKET, MARKET_DEFS } from './locations/market';

export const DEFS = new Map<string, ThingDef>();
for (const d of [...ITEMS, ...HOME_DEFS, ...BEDROOM_DEFS, ...PARK_DEFS, ...BAKERY_DEFS, ...VET_DEFS, ...MARKET_DEFS]) {
  if (DEFS.has(d.id)) console.warn('dup def', d.id);
  DEFS.set(d.id, d);
}

export const LOCATIONS: LocationDef[] = [HOME, BEDROOM, PARK, BAKERY, VET, MARKET];
export const LOC = new Map(LOCATIONS.map((l) => [l.id, l]));

/** v1 store product: unlocks every paid location */
export const PACK_FULL = 'full_town';

export const ROSTER: Record<string, Look> = {
  mom: { size: 'adult', skin: 1, hair: 2, hairColor: 1, top: 4, topColor: 0, pattern: 1, bottom: 0, bottomColor: 6, shoes: 10, acc: 0 },
  dad: { size: 'adult', skin: 1, hair: 0, hairColor: 0, top: 0, topColor: 5, pattern: 0, bottom: 0, bottomColor: 9, shoes: 11, acc: 1 },
  noa: { size: 'kid', skin: 1, hair: 3, hairColor: 1, top: 1, topColor: 7, pattern: 2, bottom: 0, bottomColor: 5, shoes: 0, acc: 2 },
  ben: { size: 'kid', skin: 1, hair: 6, hairColor: 4, top: 2, topColor: 3, pattern: 0, bottom: 0, bottomColor: 6, shoes: 2, acc: 0 },
  baby: { size: 'baby', skin: 1, hair: 8, hairColor: 1, top: 3, topColor: 2, pattern: 0, bottom: 0, bottomColor: 4, shoes: 8, acc: 0 },
  savta: { size: 'adult', skin: 2, hair: 5, hairColor: 8, top: 4, topColor: 4, pattern: 0, bottom: 2, bottomColor: 7, shoes: 9, acc: 1 },
  tamar: { size: 'kid', skin: 4, hair: 4, hairColor: 0, top: 0, topColor: 2, pattern: 3, bottom: 1, bottomColor: 6, shoes: 5, acc: 0 },
  omer: { size: 'kid', skin: 3, hair: 0, hairColor: 0, top: 4, topColor: 10, pattern: 1, bottom: 0, bottomColor: 11, shoes: 9, acc: 0 },
  lia: { size: 'kid', skin: 0, hair: 2, hairColor: 3, top: 1, topColor: 0, pattern: 4, bottom: 0, bottomColor: 5, shoes: 7, acc: 3 },
  baker: { size: 'adult', skin: 0, hair: 7, hairColor: 2, top: 0, topColor: 8, pattern: 0, bottom: 0, bottomColor: 9, shoes: 9, acc: 0 },
  vet: { size: 'adult', skin: 4, hair: 1, hairColor: 0, top: 0, topColor: 4, pattern: 0, bottom: 0, bottomColor: 4, shoes: 8, acc: 1 },
  max: { size: 'kid', skin: 5, hair: 7, hairColor: 0, top: 3, topColor: 5, pattern: 0, bottom: 0, bottomColor: 6, shoes: 3, acc: 4 },
  yuval: { size: 'kid', skin: 2, hair: 1, hairColor: 2, top: 0, topColor: 4, pattern: 2, bottom: 1, bottomColor: 7, shoes: 0, acc: 0 },
  cashier: { size: 'adult', skin: 3, hair: 3, hairColor: 6, top: 0, topColor: 3, pattern: 0, bottom: 0, bottomColor: 9, shoes: 10, acc: 0 },
  daniel: { size: 'kid', skin: 0, hair: 0, hairColor: 2, top: 2, topColor: 9, pattern: 0, bottom: 1, bottomColor: 4, shoes: 1, acc: 1 },
  ella: { size: 'kid', skin: 5, hair: 4, hairColor: 7, top: 1, topColor: 11, pattern: 2, bottom: 0, bottomColor: 3, shoes: 6, acc: 2 },
  shira: { size: 'kid', skin: 3, hair: 5, hairColor: 1, top: 1, topColor: 5, pattern: 1, bottom: 0, bottomColor: 5, shoes: 2, acc: 3 },
};

export function def(id: string): ThingDef | undefined {
  return DEFS.get(id);
}
