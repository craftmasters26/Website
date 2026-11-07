import { useEffect, useState } from "react";

export type LiveStats = { players: number; cardsCaught: number; servers?: number; activePlayers24h?: number };

/** Real totals from the bot, or null while loading / unavailable (callers render nothing, never a fake number). */
export function useLiveStats(): LiveStats | null {
  const [stats, setStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Partial<LiveStats> | null) => {
        if (cancelled || !j) return;
        if (typeof j.players === "number" && typeof j.cardsCaught === "number") {
          setStats({
            players: j.players,
            cardsCaught: j.cardsCaught,
            servers: typeof j.servers === "number" ? j.servers : undefined,
            activePlayers24h: typeof j.activePlayers24h === "number" ? j.activePlayers24h : undefined,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return stats;
}
