import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  ALL_SOULS,
  CRAFT_SOULS,
  FACTION_LABEL,
  SOULS,
  TIER_LABEL,
  TIERS,
  WEAPONS,
  type Tier,
} from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";
import { cn } from "@/lib/utils";

type Kind = "soul" | "craft" | "weapon";
type KindFilter = Kind | "all";
type Sort = "rarity" | "strongest" | "name";

export const Route = createFileRoute("/list")({
  validateSearch: (search: Record<string, unknown>): { kind?: Kind } => {
    const kind = search.kind;
    return kind === "soul" || kind === "craft" || kind === "weapon" ? { kind } : {};
  },
  head: () => ({
    meta: [
      { title: "List · BleachDex" },
      {
        name: "description",
        content:
          "Every BleachDex soul, craft-only character and zanpakutō in one list, with tier, HP, attack and crafting recipes.",
      },
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
      stats: `+${weapon.attackBonus} ATK`,
      power: weapon.attackBonus,
    })),
  ];
}

const KIND_LABEL: Record<Kind, string> = {
  soul: "Soul",
  craft: "Craft only",
  weapon: "Zanpakutō",
};

const KIND_CHIPS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "soul", label: "Souls" },
  { value: "craft", label: "Craft-only" },
  { value: "weapon", label: "Zanpakutō" },
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
          className="size-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Row({ entry }: { entry: Entry }) {
  const inner = (
    <>
      <span className={cn("self-stretch", `tier-${entry.tier}`)} />
      <Thumb src={entry.imagePath} name={entry.name} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-bold text-bone">{entry.name}</span>
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
    <Link to="/weapons/$id" params={{ id: String(entry.id) }} className={className}>
      {inner}
    </Link>
  ) : (
    <Link to="/roster/$id" params={{ id: String(entry.id) }} className={className}>
      {inner}
    </Link>
  );
}

function ListPage() {
  const { kind: initialKind } = Route.useSearch();
  const [kind, setKind] = useState<KindFilter>(initialKind ?? "all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [sort, setSort] = useState<Sort>("rarity");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const catalogVersion = useCatalogVersion();

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
    const q = search.trim().toLowerCase();
    return entries
      .filter(
        (e) =>
          (kind === "all" || e.kind === kind) &&
          (tier === "all" || e.tier === tier) &&
          (!q || e.name.toLowerCase().includes(q)),
      )
      .sort(COMPARE[sort]);
  }, [entries, kind, tier, sort, search]);

  const change =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setLimit(PAGE_SIZE);
    };

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="kicker">List</div>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
          <h1 className="max-w-xl font-serif text-[38px] leading-tight">
            One list for the whole roster.
          </h1>
          <p className="max-w-xs text-[14.5px] leading-6 text-bone-dim">
            {SOULS.length} souls from packs and spawns, {CRAFT_SOULS.length} that only /craft can
            make, and {WEAPONS.length} zanpakutō.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {KIND_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={kind === chip.value}
              className={cn("chip", kind === chip.value && "chip-active")}
              onClick={() => change(setKind)(chip.value)}
            >
              {chip.label} {counts[chip.value]}
            </button>
          ))}
          <label className="search-box ml-auto">
            <Search className="size-4 text-bone-faint" />
            <input
              value={search}
              onChange={(e) => change(setSearch)(e.target.value)}
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
              onClick={() => change(setTier)(value)}
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
                onClick={() => change(setSort)(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-[3px_44px_minmax(0,1fr)_110px_100px_150px] gap-3 px-3 pb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-bone-faint md:grid">
          <span />
          <span />
          <span>Name</span>
          <span>Type</span>
          <span>Tier</span>
          <span className="text-right">Stats</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-16 text-center font-mono text-[13px] text-bone-faint">
            Nothing matches that search.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-line">
            {rows.slice(0, limit).map((entry) => (
              <Row key={entry.key} entry={entry} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[12.5px] text-bone-faint">
          <span>
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
