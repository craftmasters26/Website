import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import {
  FACTION_LABEL,
  TIER_LABEL,
  TIERS,
  getSoul,
  getWeapon,
  weaponBoostLabel,
  type Tier,
} from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";
import { signInWithDiscord } from "@/lib/auth/client";
import { useOwnedMe, signOutOwned } from "@/lib/owned";
import { cn } from "@/lib/utils";
import { discordMark } from "@/assets";

export const Route = createFileRoute("/owned")({
  head: () => ({
    meta: [
      { title: "Owned · BleachDex" },
      {
        name: "description",
        content: "Your real BleachDex collection — every soul and zanpakutō you actually own.",
      },
    ],
  }),
  component: OwnedPage,
});

type Kind = "soul" | "weapon";
type KindFilter = Kind | "all";
type Sort = "rarity" | "strongest" | "name";

type Entry = {
  key: string;
  kind: Kind;
  id: number;
  name: string;
  imagePath: string;
  tier: Tier;
  note: string;
  stats: string;
  power: number;
  isReiatsu: boolean;
};

const KIND_LABEL: Record<Kind, string> = { soul: "Soul", weapon: "Zanpakutō" };

const KIND_CHIPS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "soul", label: "Souls" },
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
        <span className="flex items-center gap-1.5 truncate text-[14px] font-bold text-bone">
          {entry.name}
          {entry.isReiatsu ? (
            <Sparkles className="size-3.5 shrink-0 text-gold" aria-label="Reiatsu copy" />
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
    <Link to="/weapons/$id" params={{ id: String(entry.id) }} className={className}>
      {inner}
    </Link>
  ) : (
    <Link to="/roster/$id" params={{ id: String(entry.id) }} className={className}>
      {inner}
    </Link>
  );
}

function SignedOutView() {
  const [pending, setPending] = useState(false);
  return (
    <div className="flex flex-col items-center gap-5 rounded-md border border-line bg-void-raised px-6 py-20 text-center">
      <p className="max-w-sm text-[14.5px] leading-6 text-bone-dim">
        Log in with Discord to see the souls and zanpakutō your account actually owns.
      </p>
      <button
        type="button"
        className="btn btn-azure px-6 py-3 text-sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await signInWithDiscord("/owned");
          } catch (err) {
            console.error(err);
            setPending(false);
          }
        }}
      >
        <img src={discordMark} alt="" className="size-4" />
        {pending ? "Redirecting…" : "Login with Discord"}
      </button>
    </div>
  );
}

function NoRecordView() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-line bg-void-raised px-6 py-20 text-center">
      <p className="max-w-sm text-[14.5px] leading-6 text-bone-dim">
        You're logged in, but the bot hasn't seen this Discord account yet. Catch a soul or claim
        a blade in Discord, then come back.
      </p>
      <Link to="/list" className="btn btn-outline px-6 py-3 text-sm">
        Browse the full list
      </Link>
    </div>
  );
}

const ERROR_HINT: Record<string, string> = {
  unreachable: "The site can't reach the bot's URL. Check BOT_API_URL on Vercel and that the tunnel is running.",
  "secret-mismatch": "The bot rejected the site's secret. BOT_API_SECRET on Vercel and on the bot must be identical.",
  "bot-secret-missing": "The bot has no BOT_API_SECRET set. Add it to the bot's environment and restart it.",
  "bad-response": "The bot URL answered with a non-JSON page. Check BOT_API_URL points at the bot itself.",
  "bot-error": "The bot answered with an error. Check the bot's console.",
  "not-configured": "BOT_API_URL / BOT_API_SECRET aren't set on Vercel.",
  "not-linked": "This login isn't linked to a Discord account. Log out and log in with Discord.",
  timeout: "The request timed out. The bot or its tunnel is too slow or down.",
};

function ErrorView({ onRetry, reason }: { onRetry: () => void; reason?: string }) {
  const hint = reason ? ERROR_HINT[reason] : undefined;
  return (
    <div className="flex flex-col items-center gap-5 rounded-md border border-line bg-void-raised px-6 py-20 text-center">
      <p className="max-w-sm text-[14.5px] leading-6 text-bone-dim">
        Couldn't reach the bot to load your collection. It may be offline right now.
      </p>
      {hint ? <p className="max-w-md font-mono text-[11.5px] leading-5 text-bone-faint">{hint}</p> : null}
      <button type="button" className="btn btn-outline px-6 py-3 text-sm" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function OwnedPage() {
  const [state, reload] = useOwnedMe();
  const [kind, setKind] = useState<KindFilter>("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [sort, setSort] = useState<Sort>("rarity");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const catalogVersion = useCatalogVersion();

  const me = state.status === "signed-in" ? state.me : null;

  const entries = useMemo<Entry[]>(() => {
    if (!me) return [];
    const reiatsuSet = new Set(me.reiatsuCharacterIds);
    const souls: Entry[] = me.ownedCharacterIds
      .map((id) => {
        const soul = getSoul(id);
        if (!soul) return null;
        const isReiatsu = reiatsuSet.has(id);
        const entry: Entry = {
          key: `s${soul.id}`,
          kind: "soul",
          id: soul.id,
          name: soul.name,
          imagePath: soul.imagePath,
          tier: soul.tier,
          note: isReiatsu
            ? "Reiatsu copy"
            : soul.faction === "unaffiliated"
              ? ""
              : FACTION_LABEL[soul.faction],
          stats: `${soul.hp} HP · ${soul.attack} ATK`,
          power: soul.pressure,
          isReiatsu,
        };
        return entry;
      })
      .filter((e): e is Entry => e !== null);
    const weapons: Entry[] = me.ownedWeaponIds
      .map((id) => {
        const weapon = getWeapon(id);
        if (!weapon) return null;
        const entry: Entry = {
          key: `w${weapon.id}`,
          kind: "weapon",
          id: weapon.id,
          name: weapon.name,
          imagePath: weapon.imagePath,
          tier: weapon.tier,
          note: "",
          stats: weaponBoostLabel(weapon),
          power: weapon.boostPercent,
          isReiatsu: false,
        };
        return entry;
      })
      .filter((e): e is Entry => e !== null);
    return [...souls, ...weapons];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogVersion just forces a re-pull of getSoul/getWeapon after a bot sync
  }, [me, catalogVersion]);

  const counts = useMemo<Record<KindFilter, number>>(
    () => ({
      all: entries.length,
      soul: entries.filter((e) => e.kind === "soul").length,
      weapon: entries.filter((e) => e.kind === "weapon").length,
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
        <div className="kicker">Inventory</div>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
          <h1 className="max-w-xl font-serif text-[38px] leading-tight">
            Your actual collection.
          </h1>
          {me ? (
            <div className="flex items-center gap-3 rounded-md border border-line bg-void-raised px-4 py-3">
              <img src={me.avatarUrl} alt="" className="size-9 rounded-full border border-line" />
              <span className="leading-tight">
                <span className="block text-[13.5px] font-bold text-bone">{me.username}</span>
                <span className="block font-mono text-[11.5px] text-gold">
                  {me.kan.toLocaleString()} KAN
                </span>
              </span>
              <button
                type="button"
                onClick={signOutOwned}
                className="ml-1 font-mono text-[11px] text-bone-faint underline-offset-4 hover:text-bone hover:underline"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>

        {state.status === "loading" ? (
          <p className="py-16 text-center font-mono text-[13px] text-bone-faint">
            Loading your collection…
          </p>
        ) : state.status === "signed-out" ? (
          <SignedOutView />
        ) : state.status === "no-record" ? (
          <NoRecordView />
        ) : state.status === "error" ? (
          <ErrorView onRetry={reload} reason={state.reason} />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-md border border-line bg-void-raised px-6 py-20 text-center">
            <p className="max-w-sm text-[14.5px] leading-6 text-bone-dim">
              You don't own anything yet. Catch a soul or claim a blade in Discord, then come back.
            </p>
            <Link to="/list" className="btn btn-outline px-6 py-3 text-sm">
              Browse the full list
            </Link>
          </div>
        ) : (
          <>
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
                  placeholder="Search what you own…"
                  aria-label="Search your collection"
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
                Nothing you own matches that search.
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
          </>
        )}
      </div>
    </main>
  );
}
