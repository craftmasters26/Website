/**
 * Conversion tracking for Umami (the analytics script is only loaded when configured, so every call
 * here is a harmless no-op otherwise). One delegated click listener covers every call-to-action on
 * the site; elements that already carry a `data-umami-event` attribute are left to Umami itself so
 * nothing is counted twice. No personal data is sent — just the event name and the page path.
 */
type Umami = { track: (name: string, data?: Record<string, string>) => void };

const INVITE_HOST = "discord.com/oauth2/authorize";
let installed = false;

export function installClickTracking() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener(
    "click",
    (event) => {
      const umami = (window as unknown as { umami?: Umami }).umami;
      if (!umami || !(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("data-umami-event")) return;
      const href = link.getAttribute("href") ?? "";
      const page = location.pathname;
      if (href.includes(INVITE_HOST)) umami.track("add-to-discord", { where: page });
      else if (href.includes("/bleachdex/checkout")) umami.track("premium-checkout-click", { where: page });
      else if (href.includes("/bleachdex/premium")) umami.track("premium-view-click", { where: page });
    },
    { capture: true },
  );
}
