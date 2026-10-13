import { useCallback, useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { claimAd, getAdStatus, startAd, type AdStatus } from "@/lib/rewards";
import { adMode, playGamRewarded, type AdOutcome } from "@/lib/rewarded-ad";

const TEST_AD_SECONDS = 10;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatReset(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * "Watch an ad -> extra /pack daily". Each completed ad unlocks +1 daily pull
 * (the bot caps it at 2 a day), usable with /pack daily in Discord.
 */
export function WatchAdCard() {
  const mode = adMode();
  const [info, setInfo] = useState<AdStatus | null>(null);
  const [minWatch, setMinWatch] = useState(8);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [testLeft, setTestLeft] = useState<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await getAdStatus();
      if (!mounted.current) return;
      if (r.status === "ok") {
        setInfo(r.info);
        setMinWatch(r.minWatchSeconds);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch {
      if (mounted.current) setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function playAd(): Promise<AdOutcome> {
    if (mode === "gam") return playGamRewarded(import.meta.env.VITE_GAM_REWARDED_AD_UNIT as string);
    // test mode: a visible countdown instead of a real ad
    for (let left = TEST_AD_SECONDS; left > 0; left--) {
      if (mounted.current) setTestLeft(left);
      await sleep(1000);
    }
    if (mounted.current) setTestLeft(null);
    return "completed";
  }

  async function watch() {
    if (busy || mode === "off") return;
    setBusy(true);
    setMessage(null);
    try {
      const started = await startAd();
      if (started.status === "limit-reached") {
        setMessage({ tone: "warn", text: "You've already watched today's ads. Come back after the reset." });
        await refresh();
        return;
      }
      if (started.status !== "ok") {
        setMessage({ tone: "warn", text: "Couldn't start the ad right now. Try again in a moment." });
        return;
      }
      const startedAt = Date.now();
      const outcome = await playAd();
      if (outcome === "unsupported") {
        setMessage({
          tone: "warn",
          text: "The ad couldn't load. If you use an ad blocker, turn it off for this site and try again.",
        });
        return;
      }
      if (outcome === "no-fill") {
        setMessage({ tone: "warn", text: "No ad is available right now. Try again in a minute." });
        return;
      }
      if (outcome === "closed-early") {
        setMessage({ tone: "warn", text: "The ad was closed before the end, so no reward. Watch it to the end." });
        return;
      }
      // Very short ads: the server wants a minimum watch time, so wait out the rest.
      await sleep(Math.max(0, started.minWatchSeconds * 1000 - (Date.now() - startedAt)) + 600);
      let result = await claimAd({ data: { token: started.token } });
      if (result.status === "too-fast") {
        await sleep(2000);
        result = await claimAd({ data: { token: started.token } });
      }
      if (result.status === "ok") {
        setInfo(result.info);
        setMessage({
          tone: "ok",
          text: `+1 daily pack unlocked! Use /pack daily in Discord — you have ${result.info.daily_packs_left} left today.`,
        });
      } else if (result.status === "limit-reached") {
        setMessage({ tone: "warn", text: "You've already unlocked the maximum extra packs today." });
        await refresh();
      } else {
        setMessage({ tone: "warn", text: "The reward couldn't be confirmed. Please try again." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ tone: "warn", text: "Something went wrong. Please try again." });
    } finally {
      if (mounted.current) {
        setBusy(false);
        setTestLeft(null);
      }
    }
  }

  const remaining = info?.ads_remaining ?? 0;
  const max = info?.max_ads_per_day ?? 2;

  return (
    <section className="panel mb-10 flex flex-wrap items-center justify-between gap-5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-bright bg-void text-ember-bright">
          <Gift className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-serif text-[20px] leading-tight text-bone">Extra daily packs</h2>
          <p className="mt-1 max-w-md text-[13.5px] leading-6 text-bone-dim">
            Watch a short ad to unlock <b className="text-bone">+1 /pack daily</b> — up to {max} extra
            a day. Then claim it in Discord with <span className="font-mono text-bone">/pack daily</span>.
          </p>
          {info ? (
            <p className="mt-2 font-mono text-[11.5px] text-bone-faint">
              {info.ads_watched_today}/{max} ads watched today · {info.daily_packs_left} pack
              {info.daily_packs_left === 1 ? "" : "s"} left · resets in {formatReset(info.resets_in_seconds)}
            </p>
          ) : loadError ? (
            <p className="mt-2 font-mono text-[11.5px] text-bone-faint">
              Couldn't reach the bot to check your ads right now.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <button
          type="button"
          className="btn btn-fill px-6 py-3 text-sm"
          disabled={busy || mode === "off" || !info || remaining <= 0}
          onClick={() => void watch()}
        >
          {busy
            ? testLeft !== null
              ? `Test ad… ${testLeft}s`
              : "Playing ad…"
            : remaining <= 0 && info
              ? "All ads watched today"
              : `Watch ad (+1 pack)`}
        </button>
        {mode === "off" ? (
          <p className="max-w-[260px] text-right font-mono text-[11px] text-bone-faint">
            Rewarded ads aren't set up on this site yet.
          </p>
        ) : mode === "test" ? (
          <p className="max-w-[260px] text-right font-mono text-[11px] text-ember-bright">
            Test mode: a {TEST_AD_SECONDS}s timer stands in for an ad (min {minWatch}s server check).
          </p>
        ) : null}
        {message ? (
          <p
            className={`max-w-[320px] font-mono text-[12px] leading-5 ${
              message.tone === "ok" ? "text-azure-bright" : "text-ember-bright"
            }`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
