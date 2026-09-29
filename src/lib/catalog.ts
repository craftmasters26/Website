import rawCharacters from "@/data/characters.json";
import rawWeapons from "@/data/weapons.json";

export const TIERS = ["mythic", "legendary", "epic", "rare", "uncommon", "common"] as const;
export type Tier = (typeof TIERS)[number];

export const FACTIONS = ["soul_reaper", "quincy", "hollow", "fullbringer", "unaffiliated"] as const;
export type Faction = (typeof FACTIONS)[number];

type RawCraft = { category: string; recipe: [string, string, number][] };

export type RawCharacter = {
  id: number;
  name: string;
  image_path: string;
  hp: number;
  attack: number;
  tier: string;
  ability_name: string;
  ability_description: string;
  enabled?: number;
  faction?: string;
  craft?: RawCraft;
};

export type RawWeapon = {
  id: number;
  name: string;
  image_path: string;
  attack_bonus: number;
  tier: string;
  ability_name: string;
  ability_description: string;
  enabled?: number;
  faction?: string;
};

export type Ingredient = { kind: "drop" | "weapon" | "character"; name: string; qty: number };

export type Soul = {
  id: number;
  name: string;
  imagePath: string;
  hp: number;
  attack: number;
  /** HP + attack, the number the old Ranks page sorted by. */
  pressure: number;
  tier: Tier;
  abilityName: string;
  abilityDescription: string;
  faction: Faction;
  /** True for characters that only /craft can make (never in a pack or spawn). */
  craftOnly: boolean;
  craftCategory: string;
  recipe: Ingredient[];
};

export type Zanpakuto = {
  id: number;
  name: string;
  imagePath: string;
  attackBonus: number;
  tier: Tier;
  abilityName: string;
  abilityDescription: string;
  faction: Faction;
};

function asTier(value: string): Tier {
  return (TIERS as readonly string[]).includes(value) ? (value as Tier) : "common";
}

function asFaction(value: string | undefined): Faction {
  return value && (FACTIONS as readonly string[]).includes(value)
    ? (value as Faction)
    : "unaffiliated";
}

function buildSouls(raw: RawCharacter[]): Soul[] {
  return raw
    .filter((row) => row.enabled !== 0)
    .map((row) => ({
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      hp: row.hp,
      attack: row.attack,
      pressure: row.hp + row.attack,
      tier: asTier(row.tier),
      abilityName: row.ability_name,
      abilityDescription: row.ability_description,
      faction: asFaction(row.faction),
      craftOnly: Boolean(row.craft),
      craftCategory: row.craft?.category ?? "",
      recipe: (row.craft?.recipe ?? []).map(([kind, name, qty]) => ({
        kind: kind as Ingredient["kind"],
        name,
        qty,
      })),
    }));
}

function buildWeapons(raw: RawWeapon[]): Zanpakuto[] {
  return raw
    .filter((row) => row.enabled !== 0)
    .map((row) => ({
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      attackBonus: row.attack_bonus,
      tier: asTier(row.tier),
      abilityName: row.ability_name,
      abilityDescription: row.ability_description,
      faction: asFaction(row.faction),
    }));
}

/**
 * These four are exported `const` — the BINDING never changes — but their
 * CONTENT is replaced in place by `applyCatalog()` below (`.length = 0` then
 * `.push(...)`), so every file that imported them keeps looking at the same
 * array object and sees the update automatically. No re-import needed.
 * Components that build something ONCE from these at module scope (instead
 * of inside a render/useMemo) won't pick up a later refresh — see
 * `useCatalogVersion()` for how to opt in to that.
 */
export const ALL_SOULS: Soul[] = buildSouls(rawCharacters as RawCharacter[]);
/** Characters a pack or a wild spawn can hand out. */
export const SOULS: Soul[] = ALL_SOULS.filter((soul) => !soul.craftOnly);
/** Characters that only /craft can make. */
export const CRAFT_SOULS: Soul[] = ALL_SOULS.filter((soul) => soul.craftOnly);
export const WEAPONS: Zanpakuto[] = buildWeapons(rawWeapons as RawWeapon[]);

/**
 * Swap in freshly-fetched data (see `refreshCatalogFromApi` in
 * `catalog-live.ts`) without breaking referential identity. Called at most
 * once an hour, from the client only.
 */
export function applyCatalog(nextCharacters: RawCharacter[], nextWeapons: RawWeapon[]): void {
  const nextAllSouls = buildSouls(nextCharacters);
  const nextSouls = nextAllSouls.filter((soul) => !soul.craftOnly);
  const nextCraftSouls = nextAllSouls.filter((soul) => soul.craftOnly);
  const nextWeaponList = buildWeapons(nextWeapons);

  ALL_SOULS.length = 0;
  ALL_SOULS.push(...nextAllSouls);
  SOULS.length = 0;
  SOULS.push(...nextSouls);
  CRAFT_SOULS.length = 0;
  CRAFT_SOULS.push(...nextCraftSouls);
  WEAPONS.length = 0;
  WEAPONS.push(...nextWeaponList);
}

export const TIER_LABEL: Record<Tier, string> = {
  mythic: "Mythic",
  legendary: "Legendary",
  epic: "Epic",
  rare: "Rare",
  uncommon: "Uncommon",
  common: "Common",
};

export const FACTION_LABEL: Record<Faction, string> = {
  soul_reaper: "Soul Reaper",
  quincy: "Quincy",
  hollow: "Hollow",
  fullbringer: "Full Bringer",
  unaffiliated: "Unaffiliated",
};

export const DISCORD_INVITE =
  "https://discord.com/oauth2/authorize?client_id=1538038846493565008&permissions=2147595408&scope=bot%20applications.commands";
export const SUPPORT_SERVER = "https://discord.gg/RNp5d5TGPD";

export function getSoul(id: string | number): Soul | undefined {
  const n = Number(id);
  return ALL_SOULS.find((soul) => soul.id === n);
}

export function getWeapon(id: string | number): Zanpakuto | undefined {
  const n = Number(id);
  return WEAPONS.find((weapon) => weapon.id === n);
}

/** Same faction and craft status, closest total stats first. */
export function similarSouls(soul: Soul, limit = 4): Soul[] {
  const pool = soul.craftOnly ? CRAFT_SOULS : SOULS;
  return pool
    .filter((other) => other.id !== soul.id && other.faction === soul.faction)
    .sort((a, b) => Math.abs(a.pressure - soul.pressure) - Math.abs(b.pressure - soul.pressure))
    .slice(0, limit);
}
