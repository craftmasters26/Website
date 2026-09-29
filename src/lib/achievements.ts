import raw from "@/data/achievements.json";
import { ALL_SOULS } from "@/lib/catalog";

type Track =
  | { kind: "souls"; ids: number[] }
  | { kind: "weapons"; ids: number[] }
  | { kind: "tier"; tier: string }
  | null;

export type Achievement = {
  key: string;
  name: string;
  description: string;
  target: number;
  reward: number;
  group: string;
  track: Track;
};

export const ACHIEVEMENTS = raw as Achievement[];

export const ACHIEVEMENT_GROUPS = [
  "Catching",
  "Rare souls",
  "Sets",
  "Trading",
  "Battle",
  "Crafting",
] as const;

/**
 * How far along an achievement is, worked out from the browser registry.
 * Returns null when it depends on things only Discord can see (catch speed,
 * trades, battles, crafting, Reiatsu copies).
 */
export function progressFor(
  achievement: Achievement,
  ownedSoulIds: number[],
  ownedWeaponIds: number[],
): number | null {
  const { track } = achievement;
  if (!track) return null;
  if (track.kind === "souls") {
    const owned = new Set(ownedSoulIds);
    return track.ids.filter((id) => owned.has(id)).length;
  }
  if (track.kind === "weapons") {
    const owned = new Set(ownedWeaponIds);
    return track.ids.filter((id) => owned.has(id)).length;
  }
  const owned = new Set(ownedSoulIds);
  return ALL_SOULS.filter((soul) => owned.has(soul.id) && soul.tier === track.tier).length;
}
