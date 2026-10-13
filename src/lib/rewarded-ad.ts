/**
 * Rewarded-ad playback for the "watch an ad, get extra /pack daily" button.
 *
 * Real ads: Google Ad Manager REWARDED ad unit through Google Publisher Tag.
 *   VITE_GAM_REWARDED_AD_UNIT=/1234567/your_rewarded_unit
 * (This is Google's supported way to reward people for watching an ad. Plain
 * AdSense display ads cannot be used for this — AdSense policy forbids
 * rewarding users for viewing or clicking them.)
 *
 * Testing the whole flow without an ad account:
 *   VITE_REWARDED_AD_TEST=true   -> a 10-second fake "ad" instead of a real one.
 *   Never leave this on in production: it gives out packs for waiting.
 */

export type AdMode = "gam" | "test" | "off";
export type AdOutcome = "completed" | "closed-early" | "no-fill" | "unsupported";

export function adMode(): AdMode {
  if (import.meta.env.VITE_REWARDED_AD_TEST === "true") return "test";
  if (import.meta.env.VITE_GAM_REWARDED_AD_UNIT) return "gam";
  return "off";
}

type GptSlot = unknown;
type GptEvent = { slot: GptSlot; isEmpty?: boolean; makeRewardedVisible?: () => boolean };
type Gpt = {
  cmd: Array<() => void>;
  pubads: () => {
    addEventListener: (name: string, cb: (e: GptEvent) => void) => void;
    removeEventListener: (name: string, cb: (e: GptEvent) => void) => void;
  };
  defineOutOfPageSlot: (unit: string, format: unknown) => (GptSlot & { addService: (s: unknown) => void }) | null;
  enums: { OutOfPageFormat: { REWARDED: unknown } };
  enableServices: () => void;
  display: (slot: GptSlot) => void;
  destroySlots: (slots: GptSlot[]) => boolean;
};
declare global {
  interface Window {
    googletag?: Partial<Gpt> & { cmd: Array<() => void> };
  }
}

let gptLoading: Promise<void> | null = null;
function loadGpt(): Promise<void> {
  if (gptLoading) return gptLoading;
  window.googletag = window.googletag || { cmd: [] };
  gptLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gptLoading = null; // allow a retry (an ad blocker will land here)
      reject(new Error("gpt blocked"));
    };
    document.head.appendChild(s);
  });
  return gptLoading;
}

/** Plays one Google rewarded ad. Resolves once the ad is closed (or never filled). */
export async function playGamRewarded(adUnit: string): Promise<AdOutcome> {
  try {
    await loadGpt();
  } catch {
    return "unsupported"; // blocked by an ad blocker / network
  }
  return new Promise<AdOutcome>((resolve) => {
    const g = window.googletag as unknown as Gpt;
    g.cmd.push(() => {
      const slot = g.defineOutOfPageSlot(adUnit, g.enums.OutOfPageFormat.REWARDED);
      if (!slot) return resolve("unsupported"); // browser/page can't show rewarded ads
      slot.addService(g.pubads());

      let granted = false;
      let settled = false;
      let waitTimer: ReturnType<typeof setTimeout> | undefined;

      const onReady = (e: GptEvent) => {
        if (e.slot !== slot) return;
        clearTimeout(waitTimer);
        e.makeRewardedVisible?.();
      };
      const onGranted = (e: GptEvent) => {
        if (e.slot === slot) granted = true;
      };
      const onClosed = (e: GptEvent) => {
        if (e.slot === slot) finish(granted ? "completed" : "closed-early");
      };
      const onRender = (e: GptEvent) => {
        if (e.slot === slot && e.isEmpty) finish("no-fill");
      };
      const finish = (outcome: AdOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(waitTimer);
        const p = g.pubads();
        p.removeEventListener("rewardedSlotReady", onReady);
        p.removeEventListener("rewardedSlotGranted", onGranted);
        p.removeEventListener("rewardedSlotClosed", onClosed);
        p.removeEventListener("slotRenderEnded", onRender);
        try {
          g.destroySlots([slot]);
        } catch {
          /* already gone */
        }
        resolve(outcome);
      };

      const p = g.pubads();
      p.addEventListener("rewardedSlotReady", onReady);
      p.addEventListener("rewardedSlotGranted", onGranted);
      p.addEventListener("rewardedSlotClosed", onClosed);
      p.addEventListener("slotRenderEnded", onRender);
      // If Google never offers an ad, don't leave the button spinning.
      waitTimer = setTimeout(() => finish("no-fill"), 12_000);
      g.enableServices();
      g.display(slot);
    });
  });
}
