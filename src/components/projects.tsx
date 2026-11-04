import { useMemo, useState, type ReactNode } from "react";
import { Bot, Rocket } from "lucide-react";
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
    premise:
      "Tired of having 30 bots for 30 different things? Well forget that when you can have Boundless, an all in one bot that offers security, moderation, music, utility, engagement, and supporting features just for you if you choose to add it.\n\nJack of all traits, master of none? Nah, it's more like Jack of none, master of all.",
    stage: "In development",
  },
  {
    id: "scattered-stars",
    name: "Scattered Stars",
    kind: "game",
    status: "development",
    platform: "Game",
    genre: "Original game",
    premise:
      "Scattered across the universe, you, just a friend sets off on your journey to look for your lost friends only to find ███ ████ ████ ███████ ███ ████.\n\nor\n\nA desire to explore the ends of the universe, you and your 11 friends set off on a journey only to ██ ██████ ██ █████████ or ███████.",
    stage: "In development",
  },
];

function matches(p: Project, f: ProjectFilter) {
  if (f === "all") return true;
  if (f === "live" || f === "development") return p.status === f;
  return f === "games" ? p.kind === "game" : p.kind === "bot";
}

/** Splits a premise on blank lines. A lone "or" becomes a quiet divider; ██ blocks are read as "redacted". */
function Premise({ text, className }: { text: string; className: string }) {
  return (
    <div className="mt-3 grid gap-3">
      {text.split("\n\n").map((para) =>
        para === "or" ? (
          <p key={para} className="font-mono text-[12px] uppercase tracking-widest text-bone-faint">
            or
          </p>
        ) : (
          <p key={para} className={className}>
            {para.split(/(█[█\s]*█|█)/).map((part, i) =>
              part.startsWith("█") ? (
                <span key={i}>
                  <span aria-hidden="true">{part}</span>
                  <span className="sr-only">[redacted]</span>
                </span>
              ) : (
                part
              ),
            )}
          </p>
        ),
      )}
    </div>
  );
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
          <Premise text={p.premise} className="max-w-prose text-[16px] leading-7" />
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-xl border border-line-bright bg-void-raised-2 text-azure-bright"
          aria-hidden="true"
        >
          {p.kind === "game" ? <Rocket className="size-6" /> : <Bot className="size-6" />}
        </span>
        <Status status={p.status} />
      </div>
      <p className="mt-4 font-mono text-[12px] text-bone-faint">
        {p.platform} · {p.genre}
      </p>
      <h2 className="mt-1 font-serif text-[28px]">{p.name}</h2>
      <Premise text={p.premise} className="text-[15px] leading-6 text-bone-dim" />
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
