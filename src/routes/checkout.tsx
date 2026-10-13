import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  TIER_META,
  WHOP_LABEL,
  WHOP_PLAN,
  type Tier,
} from "@/lib/premium-tiers";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { tier: Tier } => ({
    tier:
      search.tier === "urahara-foundation-shareholder"
        ? "urahara-foundation-shareholder"
        : "bleach-enjoyer",
  }),
  head: () => ({
    meta: [{ title: "Checkout · BleachDex" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { tier } = Route.useSearch();
  const meta = TIER_META[tier];
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
  }, [tier]);

  // (Re)load Whop's embed script whenever the checkout element is mounted.
  useEffect(() => {
    if (done) return;
    document.getElementById("whop-checkout-loader")?.remove();
    const script = document.createElement("script");
    script.id = "whop-checkout-loader";
    script.src = "https://js.whop.com/static/checkout/loader.js";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [tier, done]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { event?: string; type?: string } | null;
      if (!data || typeof data !== "object") return;
      if (data.event === "complete" || data.type === "complete") setDone(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <main className="page-enter py-10 md:py-14">
      <div className="wrap">
        <Link
          to="/premium"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[12px] text-bone-faint transition-colors hover:text-azure-bright"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4l-6 6 6 6" />
          </svg>
          Back to Premium
        </Link>

        <div className="mb-6 flex flex-wrap gap-2.5">
          {(["bleach-enjoyer", "urahara-foundation-shareholder"] as Tier[]).map((t) => {
            const active = t === tier;
            const m = TIER_META[t];
            return (
              <Link
                key={t}
                to="/checkout"
                search={{ tier: t }}
                replace
                className="rounded-full border px-4 py-2 font-mono text-[12px] transition-colors"
                style={{
                  color: active ? m.accent : undefined,
                  borderColor: active
                    ? `${m.accent}99`
                    : "var(--color-line-bright)",
                  background: active ? `${m.accent}14` : "transparent",
                }}
              >
                {WHOP_LABEL[t]} · {m.price}/mo
              </Link>
            );
          })}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Summary */}
          <aside className="panel relative overflow-hidden p-8 lg:sticky lg:top-24">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)`,
              }}
            />
            <div
              className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-20 blur-3xl"
              style={{ background: meta.accent }}
            />
            <div className="relative">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-bone-faint">
                Your order
              </div>
              <h1 className="mt-1.5 font-serif text-[26px] leading-snug">
                {WHOP_LABEL[tier]}
              </h1>
              <div className="my-5 flex items-baseline gap-1.5">
                <span
                  className="font-serif text-[52px] leading-none"
                  style={{ color: meta.accent }}
                >
                  {meta.price}
                </span>
                <span className="font-mono text-[12px] text-bone-faint">
                  / month
                </span>
              </div>
              <div className="mb-5 h-px w-full bg-line" />
              <ul className="mb-6 list-none space-y-3.5 p-0">
                {meta.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-3 text-[13.5px] leading-[1.55] text-bone-dim"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="mt-[3px] size-[15px] shrink-0"
                      fill="none"
                      stroke={meta.accent}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-line pt-4 font-mono text-[11.5px] text-bone-faint">
                <div>Cancel anytime</div>
                <div>Discord role granted instantly after payment</div>
              </div>
            </div>
          </aside>

          {/* Checkout */}
          <section className="panel relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-faint">
                <svg
                  viewBox="0 0 20 20"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="9" width="12" height="8" rx="2" />
                  <path d="M7 9V6.5a3 3 0 016 0V9" />
                </svg>
                Secure checkout
              </span>
              <span className="font-mono text-[11px] text-bone-faint">
                Payments by Whop
              </span>
            </div>

            {done ? (
              <div className="grid min-h-[420px] place-items-center px-6 py-16 text-center">
                <div>
                  <div
                    className="bd-pop mx-auto mb-5 grid size-[72px] place-items-center rounded-full border"
                    style={{
                      borderColor: `${meta.accent}88`,
                      background: `${meta.accent}1a`,
                      boxShadow: `0 0 40px ${meta.accent}55`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-9"
                      fill="none"
                      stroke={meta.accent}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path className="bd-check" d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  </div>
                  <div className="font-serif text-[28px]">
                    {WHOP_LABEL[tier]}: locked in.
                  </div>
                  <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-[1.6] text-bone-dim">
                    Thank you for supporting BleachDex. Your Discord role
                    attaches automatically from the payment, so just sit tight.
                  </p>
                  <Link to="/premium" className="btn btn-outline mt-7">
                    Back to Premium
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="bd-skeleton pointer-events-none absolute inset-0" />
                  <div className="pointer-events-none absolute inset-x-0 top-24 text-center font-mono text-[11.5px] text-bone-faint">
                    Loading secure checkout…
                  </div>
                  <div
                    key={tier}
                    data-whop-checkout-plan-id={WHOP_PLAN[tier]}
                    data-whop-checkout-theme="dark"
                    data-whop-checkout-theme-accent-color={meta.whopAccent}
                    data-whop-checkout-skip-redirect="true"
                    data-whop-checkout-hide-price="true"
                    className="relative min-h-[560px] px-1 py-2"
                  />
                </div>
                <div className="border-t border-line px-6 py-3.5 text-right">
                  <a
                    href={`https://whop.com/checkout/${WHOP_PLAN[tier]}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-bone-faint underline underline-offset-4 hover:text-azure-bright"
                  >
                    Not loading? Open in new tab
                  </a>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
