import type { Look, PetKind } from '../art/characters';

export type Tag =
  | 'char' | 'pet' | 'item' | 'food' | 'drink' | 'wear' | 'toy' | 'dough' | 'batter' | 'egg'
  | 'petfood' | 'med' | 'soap' | 'brush' | 'flower' | 'ball' | 'icecream' | 'small' | 'plate';

export type SlotPose = 'stand' | 'sit' | 'lie' | 'swing' | 'bath' | 'slide' | 'hold' | 'place';

export interface SlotDef {
  x: number;
  y: number;
  accept: Tag[];
  pose?: SlotPose;
  /** for 'lie': which way the head points (-1 left, 1 right) */
  dir?: -1 | 1;
  /** hidden when parent state.open is false */
  inside?: boolean;
  /** draw child above parent's overlay layer */
  front?: boolean;
  /** item def to restock here when parent opens */
  restock?: string;
  /** scale applied to child while in slot */
  scale?: number;
  /** snap radius override */
  r?: number;
}

export type TapAction =
  | 'toggle' | 'open' | 'spawn' | 'ring' | 'flush' | 'spin' | 'light' | 'tv' | 'radio' | 'bounce' | 'xray' | 'none';

export interface ArtDef {
  w: number;
  h: number;
  ax?: number;
  ay?: number;
  /** variant keys; art() is called with one of these */
  variants?: string[];
  art: (v: string) => string;
  outline?: number;
}

export interface ThingDef {
  id: string;
  tags: Tag[];
  art: ArtDef;
  /** pick variant from state */
  variant?: (s: EntState) => string;
  /** drawn after attached children (e.g., blanket, tub front) */
  overlay?: ArtDef;
  overlayVariant?: (s: EntState) => string | null;
  fixed?: boolean;
  slots?: SlotDef[];
  tap?: TapAction;
  /** def ids that can be spawned by tap */
  spawn?: string[];
  bites?: number;
  /** transforms: when in a slot of an active (on) parent with this cook kind */
  cook?: { by: 'stove' | 'bakeoven'; to: string; time: number }[];
  /** tap sound */
  sound?: string;
  /** draw layer bias; negative = behind (rugs), positive = in front */
  z?: number;
  /** offset for wearables on a head (relative to head center, in head radii) */
  wearY?: number;
  /** hide from the pocket */
  noPocket?: boolean;
  /** animation hint */
  anim?: 'wag' | 'float' | 'none';
  /** light source radius when on (for night mode) */
  light?: { x: number; y: number; r: number };
  /** pitch for character's sounds */
  pitch?: number;
  /** cooking appliance kind (slots cook items when state.on) */
  cooks?: 'stove' | 'bakeoven';
  /** refill empty restock slots automatically */
  autoRestock?: boolean;
  /** door to another location */
  door?: string;
  /** tap spawns go out at this local point */
  spawnAt?: { x: number; y: number };
}

export interface EntState {
  on?: boolean;
  open?: boolean;
  bites?: number;
  flavor?: number;
  cookT?: number;
  ch?: number; // tv channel
  color?: number;
  [k: string]: unknown;
}

export interface Ent {
  id: string;
  def: string; // thing def id, 'char' or 'pet'
  loc: string; // location id or 'pocket'
  x: number;
  y: number;
  s: EntState;
  p?: string; // parent id
  slot?: number; // slot index on parent ('hand' = -1, 'head' = -2)
  flip?: boolean;
  look?: Look; // characters
  pet?: { kind: PetKind; color: number }; // pets
  pocketIdx?: number;
}

export const HAND = -1;
export const HEAD = -2;

export interface Placement {
  def: string;
  x: number;
  y: number;
  s?: EntState;
  /** children placed in slots: [slotIndex, defId, state?] */
  kids?: [number, string, EntState?][];
  flip?: boolean;
}

export interface LocationDef {
  id: string;
  /** entitlement needed (undefined = free) */
  pack?: string;
  width: number;
  floor: { top: number; bottom: number };
  /** svg body of the background in world units (covers x -500..width+500, y -500..1400) */
  bg: () => string;
  music: 'calm' | 'park' | 'shop';
  seed: number;
  place: Placement[];
  chars?: { roster: string; x: number; y: number; hat?: string; hold?: string }[];
  pets?: { kind: PetKind; color: number; x: number; y: number }[];
  /** world rect of the night overlay (for light switch) */
  hasLights?: boolean;
  /** map position & icon */
  map: { x: number; y: number };
  nameKey: string;
}
