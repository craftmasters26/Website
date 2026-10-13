import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Daily Leaderboard · BleachDex" },
      {
        name: "description",
        content: "Live BleachDex leaderboard: who has caught the most souls today.",
      },
    ],
  }),
  component: LeaderboardPage,
});

type Entry = {
  rank: number;
  discord_id: string;
  username: string;
  avatar_url: string;
  catches: number;
  characters: number;
  weapons: number;
};
type Board = {
  date: string;
  generated_at: number;
  resets_in_seconds: number;
  total_catches: number;
  total_players: number;
  entries: Entry[];
  stale?: boolean;
};

const POLL_MS = 15_000;

function formatReset(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function Avatar({ entry, size }: { entry: Entry; size: string }) {
  const [failed, setFailed] = useState(false);
  if (!entry.avatar_url || failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-line bg-void-raised font-serif text-bone-dim",
          size,
        )}
        aria-hidden="true"
      >
        {entry.username.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={entry.avatar_url}
      alt=""
      className={cn("shrink-0 rounded-full border border-line object-cover", size)}
      onError={() => setFailed(true)}
    />
  );
}

function LeaderboardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard", { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Board;
      if (!Array.isArray(data.entries)) throw new Error("bad payload");
      setBoard(data);
      setFetchedAt(Date.now());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  // Poll while the tab is visible; refresh immediately when it comes back.
  useEffect(() => {
    void load();
    const start = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => void load(), POLL_MS);
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      } else {
        void load();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = fetchedAt ? Math.max(0, Math.round((now - fetchedAt) / 1000)) : null;
  const resetLeft =
    board && fetchedAt
      ? Math.max(0, board.resets_in_seconds - Math.round((now - fetchedAt) / 1000))
      : null;
  const live = !error && !board?.stale;

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="kicker">Leaderboard</div>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-[38px] leading-tight">Today's top catchers.</h1>
            <p className="mt-3 max-w-lg text-[14.5px] leading-[1.65] text-bone-dim">
              Every soul or blade caught today — pack pulls, wild spawns and shop grabs — counts.
              The board resets at 00:00 UTC.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 font-mono text-[12px] text-bone-faint md:items-end">
            <span className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full",
                  live ? "animate-pulse bg-emerald-400" : "bg-ember",
                )}
                aria-hidden="true"
              />
              <span className={live ? "text-emerald-300" : "text-ember-bright"}>
                {live ? "LIVE" : error ? "OFFLINE" : "DELAYED"}
              </span>
              {ago !== null ? <span>· updated {ago}s ago</span> : null}
            </span>
            {resetLeft !== null ? <span>Resets in {formatReset(resetLeft)}</span> : null}
          </div>
        </div>

        {!board ? (
          <p className="py-16 text-center font-mono text-[13px] text-bone-faint">
            {error ? "The leaderboard couldn't be loaded. Retrying…" : "Loading the board…"}
          </p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-6 font-mono text-[12.5px] text-bone-dim">
              <span>
                <b className="text-bone">{board.total_catches.toLocaleString()}</b> catches today
              </span>
              <span>
                <b className="text-bone">{board.total_players.toLocaleString()}</b> players
              </span>
              <span>{board.date} UTC</span>
            </div>

            {board.entries.length === 0 ? (
              <div className="panel flex flex-col items-center gap-3 px-6 py-20 text-center">
                <Trophy className="size-8 text-line-bright" aria-hidden="true" />
                <p className="max-w-sm text-[14.5px] leading-6 text-bone-dim">
                  Nobody has caught anything yet today. Be first — pull a pack or catch a spawn in
                  Discord.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                  {board.entries.slice(0, 3).map((e) => (
                    <div
                      key={e.discord_id}
                      className={cn(
                        "panel relative flex items-center gap-4 p-5",
                        e.rank === 1 && "md:order-2 md:-translate-y-2",
                        e.rank === 2 && "md:order-1",
                        e.rank === 3 && "md:order-3",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute right-4 top-3 font-serif text-[34px] leading-none",
                          e.rank === 1 ? "text-gold" : "text-bone-faint",
                        )}
                      >
                        {e.rank}
                      </span>
                      <Avatar entry={e} size="size-14" />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-bone">{e.username}</div>
                        <div className="font-mono text-[12px] text-gold">
                          {e.catches.toLocaleString()} catches
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-md border border-line">
                  <div className="grid grid-cols-[44px_minmax(0,1fr)_90px] gap-3 border-b border-line px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-bone-faint md:grid-cols-[56px_minmax(0,1fr)_110px_110px_110px]">
                    <span>#</span>
                    <span>Player</span>
                    <span className="hidden text-right md:block">Souls</span>
                    <span className="hidden text-right md:block">Blades</span>
                    <span className="text-right">Catches</span>
                  </div>
                  {board.entries.map((e) => (
                    <div
                      key={e.discord_id}
                      className="grid grid-cols-[44px_minmax(0,1fr)_90px] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[56px_minmax(0,1fr)_110px_110px_110px]"
                    >
                      <span className="font-mono text-[13px] text-bone-dim">{e.rank}</span>
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar entry={e} size="size-8" />
                        <span className="truncate text-[14px] text-bone">{e.username}</span>
                      </span>
                      <span className="hidden text-right font-mono text-[13px] text-bone-dim md:block">
                        {e.characters.toLocaleString()}
                      </span>
                      <span className="hidden text-right font-mono text-[13px] text-bone-dim md:block">
                        {e.weapons.toLocaleString()}
                      </span>
                      <span className="text-right font-mono text-[13.5px] font-semibold text-gold">
                        {e.catches.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
