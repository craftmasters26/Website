import { create } from "zustand";

type CatalogVersionState = {
  version: number;
  bump: () => void;
};

const useCatalogVersionStore = create<CatalogVersionState>()((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

/**
 * Subscribe to catalog refreshes. `ALL_SOULS` / `SOULS` / `CRAFT_SOULS` /
 * `WEAPONS` (from `@/lib/catalog`) update their contents in place on every
 * refresh regardless of whether anything reads this hook — but a value
 * built ONCE at module scope (e.g. a `const ENTRIES = [...]` outside a
 * component) needs a reason to recompute. Read this hook's return value as
 * a `useMemo`/`useEffect` dependency to get that: it changes by exactly 1
 * each time `applyCatalog()` runs.
 */
export function useCatalogVersion(): number {
  return useCatalogVersionStore((s) => s.version);
}

export function bumpCatalogVersion(): void {
  useCatalogVersionStore.getState().bump();
}
