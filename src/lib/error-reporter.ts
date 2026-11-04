/** Sends uncaught browser errors to /api/client-error (which forwards them to Discord). Max 5 per page load. */
let installed = false;

export function installErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  let sent = 0;
  const seen = new Set<string>();

  const report = (message: string, stack?: string) => {
    const key = message.slice(0, 120);
    if (sent >= 5 || seen.has(key)) return;
    seen.add(key);
    sent += 1;
    const body = JSON.stringify({
      message: message.slice(0, 300),
      stack: (stack ?? "").slice(0, 900),
      url: location.pathname + location.search,
      ua: navigator.userAgent.slice(0, 160),
    });
    try {
      navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    } catch {
      /* reporting must never throw */
    }
  };

  window.addEventListener("error", (e) => {
    if (!e.message || e.message.startsWith("Script error")) return;
    report(e.message, e.error?.stack);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    report(r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined);
  });
}
