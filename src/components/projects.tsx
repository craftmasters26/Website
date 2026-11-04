import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { botAvatar } from "@/assets";
import { BLEACHDEX_URL } from "@/lib/site";
import { DISCORD_INVITE, SOULS, CRAFT_SOULS, WEAPONS } from "@/lib/catalog";
import { BOUNDLESS_DISCORD } from "@/components/bp-layout";

export type ProjectFilter = "all" | "live" | "development" | "games" | "bots";

export const FILTERS: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "development", label: "In development" },
  { id: "games", label: "Games" },
  { id: "bots", label: "Discord bots" },
];

type Project = {
  id: string;
  name: string;
  kind: "bot" | "game";
  status: "live" | "development";
  platform: string;
  genre: string;
  premise: string;
  stage: string;
};

/** Edit this list to change the cards. Replace the premises with real details as they are decided. */
export const PROJECTS: Project[] = [
  {
    id: "bleachdex",
    name: "BleachDex",
    kind: "bot",
    status: "live",
    platform: "Discord",
    genre: "Character collection game",
    premise:
      "Characters spawn in your server. Catch them, build a three-character team, fight bosses, craft new characters and climb the leaderboard.",
    stage: "Live now",
  },
  {
    id: "boundless",
    name: "Boundless",
    kind: "bot",
    status: "development",
    platform: "Discord",
    genre: "Discord bot",
    premise: "The next bot from Boundless Production, made for server communities.",
    stage: "In development",
  },
  {
    id: "scattered-stars",
    name: "Scattered Stars",
    kind: "game",
    status: "development",
    platform: "Game",
    genre: "Original game",
    premise: "An original game from Boundless Production, with its own world, rules and characters.",
    stage: "In development",
  },
];

function matches(p: Project, f: ProjectFilter) {
  if (f === "all") return true;
  if (f === "live" || f === "development") return p.status === f;
  return f === "games" ? p.kind === "game" : p.kind === "bot";
}

function Status({ status }: { status: Project["status"] }) {
  return (
    <span className={cn("status-chip", status === "live" && "status-chip-live")}>
      {status === "live" ? "Live" : "In development"}
    </span>
  );
}

function LiveCard() {
  const p = PROJECTS[0];
  return (
    <article className="showcase p-7 md:p-10 md:col-span-3">
      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
        <img
          src={botAvatar}
          alt=""
          width={112}
          height={112}
          className="size-28 rounded-2xl border border-white/15 object-cover"
        />
        <div>
          <span className="status-chip status-chip-live">Live</span>
          <p className="showcase-label mt-4">{p.platform} · {p.genre}</p>
          <h2 className="mt-1 font-serif text-[34px]">{p.name}</h2>
          <p className="mt-3 max-w-prose text-[16px] leading-7">{p.premise}</p>
          <p className="mt-4 font-mono text-[12.5px] text-[#9fb3d6]">
            {SOULS.length + CRAFT_SOULS.length} characters · {WEAPONS.length} weapons
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn btn-sun">
            Add to Discord
          </a>
          <a href={BLEACHDEX_URL} className="btn btn-ghost-night">
            Explore BleachDex
          </a>
        </div>
      </div>
    </article>
  );
}

function DevCard({ p }: { p: Project }) {
  return (
    <article className="flex flex-col rounded-xl border border-line-bright bg-void-raised p-7">
      <div
        className="mb-6 flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-line bg-void-raised-2 font-serif text-5xl text-azure-bright"
        aria-hidden="true"
      >
        {p.kind === "game" ? "✦" : "B"}
      </div>
      <Status status={p.status} />
      <p className="mt-4 font-mono text-[12px] text-bone-faint">
        {p.platform} · {p.genre}
      </p>
      <h2 className="mt-1 font-serif text-[28px]">{p.name}</h2>
      <p className="mt-3 text-[15px] leading-6 text-bone-dim">{p.premise}</p>
      <a
        href={BOUNDLESS_DISCORD}
        target="_blank"
        rel="noreferrer"
        className="mt-6 font-semibold text-azure-bright underline-offset-4 hover:underline"
      >
        Follow development →
      </a>
    </article>
  );
}

export function ProjectsBrowser({ initial = "all" }: { initial?: ProjectFilter }) {
  const [filter, setFilter] = useState<ProjectFilter>(initial);
  const shown = useMemo(() => PROJECTS.filter((p) => matches(p, filter)), [filter]);
  return (
    <div>
      <div role="group" aria-label="Filter projects" className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="filter-btn"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {shown.length} {shown.length === 1 ? "project" : "projects"} shown
      </p>
      {shown.length === 0 ? (
        <p className="text-bone-dim">Nothing here yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {shown.map((p) => (p.id === "bleachdex" ? <LiveCard key={p.id} /> : <DevCard key={p.id} p={p} />))}
        </div>
      )}
    </div>
  );
}

/** Home page version: the live project large, the in-development ones smaller. */
export function ProjectsSummary(): ReactNode {
  return (
    <div className="grid gap-6">
      <LiveCard />
      <div className="grid gap-6 md:grid-cols-2">
        {PROJECTS.filter((p) => p.status === "development").map((p) => (
          <DevCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
