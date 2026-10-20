import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  TIER_META,
  WHOP_LABEL,
  WHOP_PLAN,
  type Tier,
} from "@/lib/premium-tiers";
import { getMyDiscordId } from "@/lib/premium";
import { signInWithDiscord } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/checkout")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tier: Tier; status?: string } => ({
    tier:
      search.tier === "urahara-foundation-shareholder"
        ? "urahara-foundation-shareholder"
        : "bleach-enjoyer",
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  head: () => ({
    meta: [{ title: "Checkout · BleachDex" }],
  }),
  component: CheckoutPage,
});

/* eslint-disable @typescript-eslint/no-explicit-any -- Whop's Elements are loaded in the browser only */
type WhopLib = {
  elements: unknown;
  WhopElements: ComponentType<any>;
  Checkout: ComponentType<any>;
  CheckoutElement: ComponentType<any>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function CheckoutPage() {
  const { tier, status } = Route.useSearch();
  const meta = TIER_META[tier];
  const [done, setDone] = useState(status === "succeeded");
  const { user, isPending } = useCurrentUserState();
  const [discordId, setDiscordId] = useState<string | null | undefined>(
    undefined,
  );
  const [lib, setLib] = useState<WhopLib | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    setDone(status === "succeeded");
  }, [tier, status]);

  // The verified Discord id of whoever is paying (needs a Discord login).
  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setDiscordId(null);
      return;
    }
    let alive = true;
    getMyDiscordId()
      .then((r) => alive && setDiscordId(r.discordId))
      .catch(() => alive && setDiscordId(null));
    return () => {
      alive = false;
    };
  }, [isPending, user]);

  // Whop's checkout runs in the browser only.
  useEffect(() => {
    let alive = true;
    void Promise.all([
      import("@whop/elements"),
      import("@whop/elements-react"),
    ]).then(([core, react]) => {
      if (!alive) return;
      setLib({
        elements: core.loadWhop(),
        WhopElements: react.WhopElements,
        Checkout: react.Checkout,
        CheckoutElement: react.CheckoutElement,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  async function signIn() {
    setSignInError(null);
    try {
      await signInWithDiscord(`/checkout?tier=${tier}`);
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Sign-in failed.");
    }
  }

  let checkoutBody: ReactNode;
  if (isPending || discordId === undefined) {
    checkoutBody = (
      <div className="grid min-h-[420px] place-items-center font-mono text-[12px] text-bone-faint">
        Loading…
      </div>
    );
  } else if (!discordId) {
    checkoutBody = (
      <div className="grid min-h-[420px] place-items-center px-6 py-16 text-center">
        <div>
          <div className="font-serif text-[24px]">
            Sign in with Discord first
          </div>
          <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-[1.6] text-bone-dim">
            Your perks are delivered to your Discord account, so we need to know
            which one is yours before you pay.
          </p>
          <button
            type="button"
            onClick={() => void signIn()}
            className="btn btn-outline mt-6"
          >
            Continue with Discord
          </button>
          {signInError ? (
            <p className="mt-3 font-mono text-[12px] text-ember-bright">
              {signInError}
            </p>
          ) : null}
        </div>
      </div>
    );
  } else if (!lib) {
    checkoutBody = (
      <div className="relative min-h-[560px]">
        <div className="bd-skeleton pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 top-24 text-center font-mono text-[11.5px] text-bone-faint">
          Loading secure checkout…
        </div>
      </div>
    );
  } else {
    const { WhopElements, Checkout, CheckoutElement } = lib;
    checkoutBody = (
      <div className="px-3 py-4">
        <WhopElements elements={lib.elements}>
          <Checkout
            key={tier}
            plan={WHOP_PLAN[tier]}
            metadata={{ discord_id: discordId, tier }}
            returnUrl={`${window.location.origin}/checkout?tier=${tier}`}
            onComplete={(completion: { result?: string }) => {
              if (completion.result === "payment") setDone(true);
            }}
          >
            <CheckoutElement />
          </Checkout>
        </WhopElements>
      </div>
    );
  }

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
                <div>Then run /redeem rewards in Discord</div>
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
                    Thank you for supporting BleachDex. Your member role arrives on
                    Discord automatically. Run{" "}
                    <span className="font-mono">/redeem rewards</span> in the
                    server to pick your cards and create your custom role.
                  </p>
                  <Link to="/premium" className="btn btn-outline mt-7">
                    Back to Premium
                  </Link>
                </div>
              </div>
            ) : (
              checkoutBody
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
