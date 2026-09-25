/**
 * GET /api/catalog — the same character/weapon data as the bundled
 * `src/data/characters.json` / `weapons.json`, but read live from the bot's
 * MongoDB (mirrored from its SQLite by `sync/mongo_sync.py`, which the bot
 * already runs on an hourly timer). The browser polls this once an hour
 * (see `src/lib/catalog-live.ts`) so the List/roster/weapon pages pick up
 * new or edited characters without a site redeploy.
 *
 * Requires the MONGODB_URI env var on the SITE's Vercel project — the same
 * connection string the bot uses. Without it (or on any Mongo error) this
 * just returns 503 and the browser silently keeps using the bundled JSON.
 *
 * Cached in-memory for CACHE_MS so a burst of concurrent page loads (or a
 * warm serverless instance getting hit repeatedly within the hour) doesn't
 * open a new Mongo connection or re-query every time.
 */
import { defineEventHandler, setResponseStatus } from "h3";
import { MongoClient, type Db } from "mongodb";

const CACHE_MS = 60 * 60 * 1000; // 1 hour

type CraftIngredient = [string, string, number];

type CharacterDoc = {
  sourceId: number;
  name: string;
  faction?: string;
  tier: string;
  hp: number;
  attack: number;
  abilityName?: string;
  abilityDescription?: string;
  imagePath: string;
  enabled: boolean;
  craftableOnly?: boolean;
  craftCategory?: string;
  craftRecipe?: CraftIngredient[];
};

type WeaponDoc = {
  sourceId: number;
  name: string;
  faction?: string;
  tier: string;
  attackBonus: number;
  abilityName?: string;
  abilityDescription?: string;
  imagePath: string;
  enabled: boolean;
};

type CatalogPayload = {
  characters: Array<{
    id: number;
    name: string;
    image_path: string;
    hp: number;
    attack: number;
    tier: string;
    ability_name: string;
    ability_description: string;
    enabled: number;
    faction: string;
    craft?: { category: string; recipe: CraftIngredient[] };
  }>;
  weapons: Array<{
    id: number;
    name: string;
    image_path: string;
    attack_bonus: number;
    tier: string;
    ability_name: string;
    ability_description: string;
    enabled: number;
    faction: string;
  }>;
};

let client: MongoClient | null = null;
let cache: { at: number; payload: CatalogPayload } | null = null;

async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set on the site's environment");
  client ??= new MongoClient(uri);
  const connected = client as MongoClient & { topology?: unknown };
  if (!connected.topology) await client.connect();
  return client.db();
}

async function loadCatalog(): Promise<CatalogPayload> {
  const db = await getDb();
  const [characters, weapons] = await Promise.all([
    db.collection<CharacterDoc>("characters").find({}).toArray(),
    db.collection<WeaponDoc>("weapons").find({}).toArray(),
  ]);

  return {
    characters: characters.map((c) => ({
      id: c.sourceId,
      name: c.name,
      image_path: c.imagePath,
      hp: c.hp,
      attack: c.attack,
      tier: c.tier,
      ability_name: c.abilityName ?? "",
      ability_description: c.abilityDescription ?? "",
      enabled: c.enabled ? 1 : 0,
      faction: c.faction ?? "",
      ...(c.craftableOnly
        ? { craft: { category: c.craftCategory ?? "", recipe: c.craftRecipe ?? [] } }
        : {}),
    })),
    weapons: weapons.map((w) => ({
      id: w.sourceId,
      name: w.name,
      image_path: w.imagePath,
      attack_bonus: w.attackBonus,
      tier: w.tier,
      ability_name: w.abilityName ?? "",
      ability_description: w.abilityDescription ?? "",
      enabled: w.enabled ? 1 : 0,
      faction: w.faction ?? "",
    })),
  };
}

export default defineEventHandler(async (event) => {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.payload;
  }
  try {
    const payload = await loadCatalog();
    cache = { at: Date.now(), payload };
    return payload;
  } catch (err) {
    // Serve a stale cache rather than nothing if Mongo hiccups mid-hour.
    if (cache) return cache.payload;
    setResponseStatus(event, 503);
    return { error: err instanceof Error ? err.message : "catalog fetch failed" };
  }
});
