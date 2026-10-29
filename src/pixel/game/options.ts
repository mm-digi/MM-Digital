import type {
  AccessoryId,
  Appearance,
  EmoteId,
  EyeStyle,
  HairStyle,
  HatId,
  OutfitId,
  ShoeId,
  StaffSlug,
  Status,
} from "@/pixel/types";

export const HAIR_STYLES: { id: HairStyle; name: string; level: number }[] = [
  { id: "bob", name: "Bob", level: 1 },
  { id: "sweep", name: "Side sweep", level: 1 },
  { id: "curls", name: "Curls", level: 1 },
  { id: "long", name: "Long", level: 1 },
  { id: "pixie", name: "Pixie", level: 1 },
  { id: "spikes", name: "Spikes", level: 1 },
  { id: "braids", name: "Braids", level: 1 },
  { id: "bun", name: "Bun", level: 1 },
];

export const HAIR_COLOURS = [
  { id: "ink", name: "Ink", hex: "#2a211c" },
  { id: "brown", name: "Brown", hex: "#6b3e2a" },
  { id: "auburn", name: "Auburn", hex: "#a24e32" },
  { id: "honey", name: "Honey", hex: "#e0a84a" },
  { id: "blonde", name: "Blonde", hex: "#f2d48a" },
  { id: "rose", name: "Rose", hex: "#c45b78" },
  { id: "ash", name: "Ash", hex: "#8a8580" },
  { id: "night", name: "Night", hex: "#243044" },
];

export const SKINS = [
  { id: "porcelain", name: "Porcelain", hex: "#f3d2c3" },
  { id: "fair", name: "Fair", hex: "#efc2aa" },
  { id: "light", name: "Light", hex: "#e0aa8e" },
  { id: "medium", name: "Medium", hex: "#c68658" },
  { id: "tan", name: "Tan", hex: "#a86b45" },
  { id: "deep", name: "Deep", hex: "#6b4030" },
  { id: "rich", name: "Rich", hex: "#4a2c22" },
];

export const EYE_STYLES: { id: EyeStyle; name: string }[] = [
  { id: "round", name: "Round" },
  { id: "soft", name: "Soft" },
  { id: "focused", name: "Focused" },
  { id: "happy", name: "Happy" },
  { id: "lashes", name: "Lashes" },
];

export const EYE_COLOURS = [
  { id: "brown", name: "Brown", hex: "#4a3428" },
  { id: "green", name: "Green", hex: "#2f6a45" },
  { id: "blue", name: "Blue", hex: "#3a6e9a" },
  { id: "hazel", name: "Hazel", hex: "#8a6230" },
  { id: "dark", name: "Dark", hex: "#1c1a19" },
];

export const OUTFITS: { id: OutfitId; name: string; level: number }[] = [
  { id: "sweater", name: "Sweater", level: 1 },
  { id: "shirt", name: "Shirt", level: 1 },
  { id: "blazer", name: "Blazer", level: 1 },
  { id: "dress", name: "Dress", level: 1 },
  { id: "hoodie", name: "Hoodie", level: 2 },
  { id: "dungarees", name: "Dungarees", level: 3 },
  { id: "mm-night", name: "MM night jacket", level: 5 },
];

export const OUTFIT_COLOURS = [
  { id: "pink", name: "MM pink", hex: "#ff808b" },
  { id: "navy", name: "Navy", hex: "#243656" },
  { id: "cream", name: "Cream", hex: "#f3e6cf" },
  { id: "forest", name: "Forest", hex: "#2f6a45" },
  { id: "mustard", name: "Mustard", hex: "#e0a04a" },
  { id: "charcoal", name: "Charcoal", hex: "#3a3532" },
  { id: "sage", name: "Sage", hex: "#7d9a78" },
  { id: "rust", name: "Rust", hex: "#b5523a" },
];

export const SHOES: { id: ShoeId; name: string }[] = [
  { id: "trainers", name: "Trainers" },
  { id: "loafers", name: "Loafers" },
  { id: "boots", name: "Boots" },
];

export const SHOE_COLOURS = [
  { id: "charcoal", name: "Charcoal", hex: "#2c2826" },
  { id: "brown", name: "Brown", hex: "#6e432c" },
  { id: "cream", name: "Cream", hex: "#f3e6cf" },
  { id: "navy", name: "Navy", hex: "#243656" },
  { id: "pink", name: "Pink", hex: "#e56b78" },
];

export const ACCESSORIES: { id: AccessoryId; name: string; level: number }[] = [
  { id: "none", name: "None", level: 1 },
  { id: "glasses", name: "Glasses", level: 1 },
  { id: "earrings", name: "Earrings", level: 1 },
  { id: "scarf", name: "Scarf", level: 2 },
  { id: "headphones", name: "Headphones", level: 4 },
];

export const HATS: { id: HatId; name: string; level: number }[] = [
  { id: "none", name: "No hat", level: 1 },
  { id: "beanie", name: "Beanie", level: 2 },
  { id: "cap", name: "Cap", level: 2 },
  { id: "beret", name: "Beret", level: 3 },
  { id: "flower", name: "Flower clip", level: 3 },
  { id: "frog", name: "Frog hat", level: 1 },
];

export const STATUSES: { id: Status; label: string; hint: string }[] = [
  { id: "working", label: "Working", hint: "At the desk" },
  { id: "meeting", label: "In a meeting", hint: "In the room or on a call" },
  { id: "break", label: "Taking a break", hint: "Breaks are part of the day" },
  { id: "away", label: "Away", hint: "Out of the office" },
  { id: "available", label: "Available", hint: "Free for a question" },
  { id: "focus", label: "Focusing", hint: "Heads down, back soon" },
];

export const EMOTES: { id: EmoteId; icon: string; label: string }[] = [
  { id: "wave", icon: "👋", label: "Wave" },
  { id: "thumbs", icon: "👍", label: "Thumbs up" },
  { id: "coffee", icon: "☕", label: "Grabbing a coffee" },
  { id: "call", icon: "📞", label: "On a call" },
  { id: "party", icon: "🎉", label: "Celebrate" },
  { id: "think", icon: "🤔", label: "Thinking" },
];

const LEVELS: Record<string, number> = {};
for (const item of [...HAIR_STYLES, ...OUTFITS, ...ACCESSORIES, ...HATS]) LEVELS[item.id] = item.level;

export function requiredLevel(id: string) {
  return LEVELS[id] ?? 1;
}

export function itemName(id: string) {
  const found = [...HAIR_STYLES, ...OUTFITS, ...ACCESSORIES, ...HATS, ...SHOES, ...EYE_STYLES].find((item) => item.id === id);
  return found?.name ?? id;
}

export function hexOf(group: "hair" | "skin" | "eye" | "outfit" | "shoe", id: string) {
  const lists = { hair: HAIR_COLOURS, skin: SKINS, eye: EYE_COLOURS, outfit: OUTFIT_COLOURS, shoe: SHOE_COLOURS };
  return lists[group].find((item) => item.id === id)?.hex ?? "#888888";
}

export function statusLabel(status: Status) {
  return STATUSES.find((item) => item.id === status)?.label ?? status;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function cleanAppearance(
  input: Partial<Appearance> | null | undefined,
  level: number,
  enforceLocks: boolean,
): { appearance: Appearance; error: string | null } {
  const base = input ?? {};
  const appearance: Appearance = {
    hair: pick(base.hair, HAIR_STYLES.map((item) => item.id), "bob"),
    hairColour: pick(base.hairColour, HAIR_COLOURS.map((item) => item.id), "brown"),
    skin: pick(base.skin, SKINS.map((item) => item.id), "fair"),
    eyes: pick(base.eyes, EYE_STYLES.map((item) => item.id), "round"),
    eyeColour: pick(base.eyeColour, EYE_COLOURS.map((item) => item.id), "brown"),
    outfit: pick(base.outfit, OUTFITS.map((item) => item.id), "sweater"),
    outfitColour: pick(base.outfitColour, OUTFIT_COLOURS.map((item) => item.id), "navy"),
    shoes: pick(base.shoes, SHOES.map((item) => item.id), "loafers"),
    shoeColour: pick(base.shoeColour, SHOE_COLOURS.map((item) => item.id), "brown"),
    accessory: pick(base.accessory, ACCESSORIES.map((item) => item.id), "none"),
    hat: pick(base.hat, HATS.map((item) => item.id), "none"),
  };
  if (!enforceLocks) return { appearance, error: null };
  const locked = [appearance.outfit, appearance.accessory, appearance.hat].find((id) => requiredLevel(id) > level);
  if (locked) {
    return { appearance, error: `${itemName(locked)} unlocks at level ${requiredLevel(locked)}.` };
  }
  return { appearance, error: null };
}

export const DEFAULTS: Record<StaffSlug, Appearance> = {
  max: {
    hair: "sweep",
    hairColour: "brown",
    skin: "medium",
    eyes: "focused",
    eyeColour: "brown",
    outfit: "blazer",
    outfitColour: "navy",
    shoes: "loafers",
    shoeColour: "brown",
    accessory: "none",
    hat: "none",
  },
  tash: {
    hair: "bob",
    hairColour: "honey",
    skin: "fair",
    eyes: "round",
    eyeColour: "green",
    outfit: "sweater",
    outfitColour: "pink",
    shoes: "trainers",
    shoeColour: "cream",
    accessory: "earrings",
    hat: "none",
  },
  mariette: {
    hair: "curls",
    hairColour: "auburn",
    skin: "light",
    eyes: "lashes",
    eyeColour: "hazel",
    outfit: "dress",
    outfitColour: "sage",
    shoes: "boots",
    shoeColour: "brown",
    accessory: "none",
    hat: "none",
  },
  natasha: {
    hair: "long",
    hairColour: "ink",
    skin: "tan",
    eyes: "soft",
    eyeColour: "dark",
    outfit: "shirt",
    outfitColour: "charcoal",
    shoes: "loafers",
    shoeColour: "charcoal",
    accessory: "glasses",
    hat: "none",
  },
};

export function unlockNamesBetween(previous: number, next: number) {
  return Object.entries(LEVELS)
    .filter(([, level]) => level > previous && level <= next)
    .map(([id]) => itemName(id));
}
