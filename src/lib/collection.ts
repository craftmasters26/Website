import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SOULS, WEAPONS, type Soul } from "@/lib/catalog";

const CATCH_REWARD = 80;

type CollectionState = {
  ownedSoulIds: number[];
  ownedWeaponIds: number[];
  kan: number;
  battleWins: number;
  catchSoul: (id: number) => boolean;
  releaseSoul: (id: number) => void;
  catchWeapon: (id: number) => boolean;
  hasSoul: (id: number) => boolean;
  hasWeapon: (id: number) => boolean;
};

export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => ({
      ownedSoulIds: [],
      ownedWeaponIds: [],
      kan: 300,
      battleWins: 0,
      catchSoul: (id) => {
        if (get().ownedSoulIds.includes(id)) return false;
        set((state) => ({
          ownedSoulIds: [...state.ownedSoulIds, id],
          kan: state.kan + CATCH_REWARD,
        }));
        return true;
      },
      releaseSoul: (id) => {
        set((state) => ({
          ownedSoulIds: state.ownedSoulIds.filter((owned) => owned !== id),
        }));
      },
      catchWeapon: (id) => {
        if (get().ownedWeaponIds.includes(id)) return false;
        set((state) => ({
          ownedWeaponIds: [...state.ownedWeaponIds, id],
          kan: state.kan + CATCH_REWARD,
        }));
        return true;
      },
      hasSoul: (id) => get().ownedSoulIds.includes(id),
      hasWeapon: (id) => get().ownedWeaponIds.includes(id),
    }),
    { name: "bleachdex-registry" },
  ),
);

export function ownedSouls(ids: number[]): Soul[] {
  const set = new Set(ids);
  return SOULS.filter((soul) => set.has(soul.id));
}

export function collectionStats(ids: number[], weaponIds: number[]) {
  const uniqueSouls = ids.length;
  const uniqueWeapons = weaponIds.length;
  return {
    uniqueSouls,
    uniqueWeapons,
    soulPct: SOULS.length ? uniqueSouls / SOULS.length : 0,
    weaponPct: WEAPONS.length ? uniqueWeapons / WEAPONS.length : 0,
  };
}
