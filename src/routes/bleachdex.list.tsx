import { useEffect, useMemo, useState } from "react";
import { SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  ALL_SOULS,
  CRAFT_SOULS,
  FACTION_LABEL,
  SOULS,
  TIER_LABEL,
  TIERS,
  WEAPONS,
  weaponBoostLabel,
  type Tier,
} from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";
import { cn } from "@/lib/utils";
import { matchesName } from "@/lib/fuzzy";
import { useOwnedMe } from "@/lib/owned";

type Kind = "soul" | "craft" | "weapon";
type KindFilter = Kind | "all";
type Sort = "rarity" | "strongest" | "name";
type OwnFilter = "owned" | "missing";
/** Every filter lives in the URL, so a filtered view can be shared or bookmarked. */
type ListSearch = { kind?: Kind; tier?: Tier; sort?: Sort; q?: string; own?: OwnFilter };
const SORT_KEY = "bp-list-sort";

export const Route = createFileRoute("/bleachdex/list")({
  validateSearch: (search: Record<string, unknown>): ListSearch => {
    const out: ListSearch = {};
    const kind = search.kind;
    if (kind === "soul" || kind === "craft" || kind === "weapon") out.kind = kind;
    if (typeof search.tier === "string" && (TIERS as readonly string[]).includes(search.tier)) {
      out.tier = search.tier as Tier;
    }
    if (search.sort === "strongest" || search.sort === "name" || search.sort === "rarity") {
      out.sort = search.sort;
    }
    if (typeof search.q === "string" && search.q.trim()) out.q = search.q.slice(0, 60);
    if (search.own === "owned" || search.own === "missing") out.own = search.own;
    return out;
  },
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_URL}/bleachdex/list` }],
    meta: [
      { title: "BleachDex Character & Weapon List — tiers, stats, crafting recipes" },
      {
        name: "description",
        content:
          "Browse every BleachDex soul, craft-only character and weapon. Search by name, filter by tier, and see HP, attack and crafting recipes for the Bleach Discord collection bot.",
      },
    ],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "BleachDex character and weapon list",
        url: `${SITE_URL}/bleachdex/list`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: ALL_SOULS.length + WEAPONS.length,
          itemListElement: ALL_SOULS.slice(0, 100).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `${SITE_URL}/bleachdex/roster/${s.id}`,
          })),
        },
      }),
    ],
  }),
  component: ListPage,
});

type Entry = {
  key: string;
  kind: Kind;
  id: number;
  name: string;
  imagePath: string;
  tier: Tier;
  note: string;
  stats: string;
  /** Pressure (HP + attack) for characters, attack bonus for weapons. */
  power: number;
};

function buildEntries(): Entry[] {
  return [
    ...ALL_SOULS.map((soul): Entry => ({
      key: `s${soul.id}`,
      kind: soul.craftOnly ? "craft" : "soul",
      id: soul.id,
      name: soul.name,
      imagePath: soul.imagePath,
      tier: soul.tier,
      note: soul.craftOnly
        ? `${soul.craftCategory}, ${soul.recipe.length} ingredients`
        : soul.faction === "unaffiliated"
          ? ""
          : FACTION_LABEL[soul.faction],
      stats: `${soul.hp} HP · ${soul.attack} ATK`,
      power: soul.pressure,
    })),
    ...WEAPONS.map((weapon): Entry => ({
      key: `w${weapon.id}`,
      kind: "weapon",
      id: weapon.id,
      name: weapon.name,
      imagePath: weapon.imagePath,
      tier: weapon.tier,
      note: "",
      stats: weaponBoostLabel(weapon),
      power: weapon.boostPercent,
    })),
  ];
}

const KIND_LABEL: Record<Kind, string> = {
  soul: "Soul",
  craft: "Craft only",
  weapon: "Weapon",
};

const KIND_CHIPS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "soul", label: "Souls" },
  { value: "craft", label: "Craft-only" },
  { value: "weapon", label: "Weapons" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "rarity", label: "Rarity" },
  { value: "strongest", label: "Strongest" },
  { value: "name", label: "Name" },
];

const kindGroup = (entry: Entry) => (entry.kind === "weapon" ? 1 : 0);

const COMPARE: Record<Sort, (a: Entry, b: Entry) => number> = {
  rarity: (a, b) =>
    TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) ||
    b.power - a.power ||
    a.name.localeCompare(b.name),
  strongest: (a, b) => kindGroup(a) - kindGroup(b) || b.power - a.power,
  name: (a, b) => a.name.localeCompare(b.name),
};

const PAGE_SIZE = 80;

function Thumb({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="size-11 shrink-0 overflow-hidden rounded-[5px] bg-line">
      {failed ? (
        <div className="flex size-full items-center justify-center font-serif text-lg text-line-bright">
          {name.slice(0, 1)}
        </div>
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Row({ entry, owned }: { entry: Entry; owned?: boolean }) {
  const inner = (
    <>
      <span className={cn("self-stretch", `tier-${entry.tier}`)} />
      <Thumb src={entry.imagePath} name={entry.name} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-bold text-bone">
          {entry.name}
          {owned ? (
            <span className="ml-2 rounded-sm border border-line-bright px-1.5 py-0.5 align-middle font-mono text-[10px] font-medium text-bone-dim">
              Owned
            </span>
          ) : null}
        </span>
        <span className="block truncate font-mono text-[11px] text-bone-faint">
          {entry.note}
          {entry.note ? " · " : ""}
          <span className="md:hidden">
            {KIND_LABEL[entry.kind]} · {TIER_LABEL[entry.tier]} · {entry.stats}
          </span>
        </span>
      </span>
      <span className="hidden font-mono text-[12px] text-bone-dim md:block">
        {KIND_LABEL[entry.kind]}
      </span>
      <span className="hidden font-mono text-[12px] text-bone-dim md:block">
        {TIER_LABEL[entry.tier]}
      </span>
      <span className="hidden text-right font-mono text-[12px] text-bone-dim md:block">
        {entry.stats}
      </span>
    </>
  );
  const className =
    "grid grid-cols-[3px_44px_minmax(0,1fr)] items-center gap-3 border-t border-line bg-void-raised px-3 py-2 no-underline transition-colors first:border-t-0 hover:bg-void-raised-2 md:grid-cols-[3px_44px_minmax(0,1fr)_110px_100px_150px]";
  return entry.kind === "weapon" ? (
    <Link to="/bleachdex/weapons/$id" params={{ id: String(entry.id) }} className={className}>
      {inner}
    </Link>
  ) : (
    <Link to="/bleachdex/roster/$id" params={{ id: String(entry.id) }} className={className}>
      {inner}
    </Link>
  );
}

function ListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const kind: KindFilter = search.kind ?? "all";
  const tier: Tier | "all" = search.tier ?? "all";
  const query = search.q ?? "";
  const own = search.own;
  const [savedSort, setSavedSort] = useState<Sort>("rarity");
  const sort: Sort = search.sort ?? savedSort;
  const [limit, setLimit] = useState(PAGE_SIZE);
  const catalogVersion = useCatalogVersion();
  const [owned] = useOwnedMe();

  // Remember the visitor's preferred sort when the URL does not say otherwise.
  useEffect(() => {
    try {
      const v = localStorage.getItem(SORT_KEY);
      if (v === "rarity" || v === "strongest" || v === "name") setSavedSort(v);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const ownedKeys = useMemo(() => {
    if (owned.status !== "signed-in") return null;
    const keys = new Set<string>();
    for (const id of owned.me.ownedCharacterIds) keys.add(`s${id}`);
    for (const id of owned.me.ownedWeaponIds) keys.add(`w${id}`);
    return keys;
  }, [owned]);

  const update = (patch: Partial<ListSearch>) => {
    setLimit(PAGE_SIZE);
    void navigate({
      search: (prev: ListSearch) => {
        const next = { ...prev, ...patch };
        // Drop defaults so URLs stay short and clean.
        if (next.kind === undefined || (next.kind as string) === "all") delete next.kind;
        if (!next.tier || (next.tier as string) === "all") delete next.tier;
        if (!next.q) delete next.q;
        if (!next.own) delete next.own;
        if (next.sort === "rarity") delete next.sort;
        return next;
      },
      replace: true,
    });
  };

  const setSort = (value: Sort) => {
    try {
      localStorage.setItem(SORT_KEY, value);
    } catch {
      /* ignore */
    }
    setSavedSort(value);
    update({ sort: value });
  };

  // Recomputed whenever the hourly bot sync bumps the catalog version, not
  // just once at module load — otherwise a page left open all day would
  // keep showing the roster from when it was first opened.
  const entries = useMemo(() => buildEntries(), [catalogVersion]);
  const counts = useMemo<Record<KindFilter, number>>(
    () => ({
      all: entries.length,
      soul: SOULS.length,
      craft: CRAFT_SOULS.length,
      weapon: WEAPONS.length,
    }),
    [entries],
  );

  const rows = useMemo(() => {
    return entries
      .filter(
        (e) =>
          (kind === "all" || e.kind === kind) &&
          (tier === "all" || e.tier === tier) &&
          (!own || !ownedKeys || (own === "owned") === ownedKeys.has(e.key)) &&
          matchesName(e.name, query),
      )
      .sort(COMPARE[sort]);
  }, [entries, kind, tier, sort, query, own, ownedKeys]);

  const filtersActive = kind !== "all" || tier !== "all" || Boolean(query) || Boolean(own);
  const clearFilters = () => {
    setLimit(PAGE_SIZE);
    void navigate({ search: {}, replace: true });
  };

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
          <h1 className="max-w-xl font-serif text-[38px] leading-tight">
            One list for the whole roster.
          </h1>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {KIND_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={kind === chip.value}
              className={cn("chip", kind === chip.value && "chip-active")}
              onClick={() => update({ kind: chip.value === "all" ? undefined : chip.value })}
            >
              {chip.label} {counts[chip.value]}
            </button>
          ))}
          <label className="search-box ml-auto">
            <Search className="size-4 text-bone-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search a name…"
              aria-label="Search the list"
            />
          </label>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(["all", ...TIERS] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tier === value}
              className={cn(
                "font-mono text-[12px] px-3 py-2 border-b-2",
                tier === value
                  ? "border-ember-bright text-bone"
                  : "border-transparent text-bone-faint hover:text-bone",
              )}
              onClick={() => update({ tier: value === "all" ? undefined : value })}
            >
              {value === "all" ? "Any tier" : TIER_LABEL[value]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 font-mono text-[12px] text-bone-faint">
            Sort
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={sort === option.value}
                className={cn(
                  "px-2 py-2 underline-offset-4",
                  sort === option.value ? "text-bone underline" : "hover:text-bone",
                )}
                onClick={() => setSort(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {ownedKeys ? (
          <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Collection filter">
            {([undefined, "owned", "missing"] as const).map((value) => (
              <button
                key={value ?? "any"}
                type="button"
                aria-pressed={own === value}
                className={cn("chip", own === value && "chip-active")}
                onClick={() => update({ own: value })}
              >
                {value === undefined ? "Everything" : value === "owned" ? "I own" : "Still missing"}
              </button>
            ))}
          </div>
        ) : null}

        <div className="hidden grid-cols-[3px_44px_minmax(0,1fr)_110px_100px_150px] gap-3 px-3 pb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-bone-faint md:grid">
          <span />
          <span />
          <span>Name</span>
          <span>Type</span>
          <span>Tier</span>
          <span className="text-right">Stats</span>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[13px] text-bone-faint">Nothing matches these filters.</p>
            {filtersActive ? (
              <button type="button" className="btn btn-outline mt-5 px-5 py-3 text-sm" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-line">
            {rows.slice(0, limit).map((entry) => (
              <Row key={entry.key} entry={entry} owned={ownedKeys?.has(entry.key)} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[12.5px] text-bone-faint">
          <span role="status" aria-live="polite">
            {Math.min(limit, rows.length)} of {rows.length} shown
          </span>
          {limit < rows.length ? (
            <button
              type="button"
              className="btn btn-outline px-5 py-3 text-sm"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
            >
              Show {Math.min(PAGE_SIZE, rows.length - limit)} more
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
