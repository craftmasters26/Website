import { useEffect, useState } from "react";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4630325130876570";

/**
 * Crawlers and headless browsers never see the gate. That covers Googlebot
 * and Google's AdSense crawler (which must be able to read the page), plus
 * the common AI crawlers. It is a user-agent check, so a visitor can fake it.
 */
const NON_HUMAN_AGENT =
  /bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|ccbot|bytespider|amazonbot|applebot|petalbot|yandex|duckduckbot|headless|lighthouse|prerender/i;

function looksHuman(): boolean {
  return !NON_HUMAN_AGENT.test(navigator.userAgent) && !navigator.webdriver;
}

/**
 * Phones and tablets are excluded from the gate entirely. Mobile Safari,
 * Firefox and Chrome all ship built-in tracking/ad protections that are far
 * more aggressive than desktop, so the "is AdSense blocked?" probe below
 * false-positives constantly on mobile — which showed the full-screen modal
 * (with scroll locked) to most phone visitors and left them unable to reach
 * any other page. Desktop keeps the real check.
 */
function isMobileDevice(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768)
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AdsWindow = Window & { adsbygoogle?: unknown };

/**
 * Three independent checks, because blockers work in different ways:
 *  1. a bait element that filter lists hide by class name,
 *  2. a network request to the AdSense script that a blocker cancels,
 *  3. the AdSense script never defining window.adsbygoogle.
 *
 * Each one alone is unreliable for reasons that have nothing to do with an
 * ad blocker: antivirus "web protection" can quietly drop the fetch,
 * flaky mobile networks can make it time out, and a screen reader or
 * forced-colors mode can make an off-screen bait element measure as
 * hidden. Requiring at least two of the three agree keeps the wall for
 * actual blockers (which normally trip all three at once) while no longer
 * locking out a real visitor over one flaky signal.
 */
async function adsAreBlocked(): Promise<boolean> {
  const bait = document.createElement("div");
  bait.className = "adsbox ad-banner ad-placement pub_300x250 text-ad textAd";
  bait.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;";
  bait.textContent = "\u00a0";
  document.body.appendChild(bait);

  let requestBlocked = false;
  try {
    await fetch(ADSENSE_SRC, { method: "GET", mode: "no-cors", cache: "no-store" });
  } catch {
    requestBlocked = true;
  }

  await wait(150);
  const style = getComputedStyle(bait);
  const baitHidden =
    bait.offsetHeight === 0 || style.display === "none" || style.visibility === "hidden";
  bait.remove();

  const scriptMissing = typeof (window as AdsWindow).adsbygoogle === "undefined";
  const signals = [baitHidden, requestBlocked, scriptMissing].filter(Boolean).length;
  return signals >= 2;
}

export function AdBlockGate() {
  const [blocked, setBlocked] = useState(false);
  const [recheckFailed, setRecheckFailed] = useState(false);

  useEffect(() => {
    if (!looksHuman() || isMobileDevice()) return;
    let cancelled = false;

    const run = async () => {
      const result = await adsAreBlocked();
      if (!cancelled) setBlocked(result);
    };

    // Give the AdSense script a moment to load before judging it — longer
    // than before, since a slow connection alone shouldn't read as "blocked".
    const first = window.setTimeout(run, 3500);
    const repeat = window.setInterval(run, 8000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(repeat);
    };
  }, []);

  useEffect(() => {
    if (!blocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [blocked]);

  if (!blocked) return null;

  const recheck = async () => {
    const stillBlocked = await adsAreBlocked();
    setBlocked(stillBlocked);
    setRecheckFailed(stillBlocked);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void px-6"
    >
      <div className="panel max-w-md p-8">
        <div className="kicker">Before you go on</div>
        <h2 id="gate-title" className="font-serif text-[28px] leading-tight">
          Your ad blocker is on.
        </h2>
        <p className="mt-4 text-[14.5px] leading-6 text-bone-dim">
          BleachDex is free, and the ads on it pay for the hosting. Turn the blocker off for this
          site, or add it to your allow list, then press the button below.
        </p>
        {recheckFailed ? (
          <p className="mt-4 font-mono text-[12.5px] text-ember-bright">
            It still looks blocked. Some blockers only apply the change after a reload.
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" className="btn btn-fill" onClick={recheck}>
            I turned it off
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </div>
      </div>
    </div>
  );
}
