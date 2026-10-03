import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [{ title: "Premium · BleachDex" }],
  }),
  component: PremiumPage,
});

const WHOP_PLAN = {
  support: "plan_J7OuXMyBZFZeN",
  vip: "plan_UneUQNGIMsazS",
} as const;

const WHOP_LABEL = {
  support: "Bleach Enjoyer",
  vip: "Urahara Foundation Shareholder",
} as const;

type Tier = keyof typeof WHOP_PLAN;

const TIER_META = {
  support: {
    price: "$3",
    accent: "#5c8dff",
    whopAccent: "sky",
    tag: null as string | null,
    cta: "Become a Bleach Enjoyer",
    perks: [
      "Extra entries to giveaways",
      "A custom role with your choice of up to 2 colours + an icon",
      "1 BleachDex item of your choice (excluding certain items)",
    ],
  },
  vip: {
    price: "$5",
    accent: "#ff8f4d",
    whopAccent: "orange",
    tag: "Best value" as string | null,
    cta: "Become a Shareholder",
    perks: [
      "Extra entries to giveaways",
      "A custom role with your choice of up to 2 colours + an icon",
      "3 BleachDex items of your choice (instead of one)",
      "A custom private spawn party once a week",
    ],
  },
} as const;

function PremiumPage() {
  const [open, setOpen] = useState<Tier | null>(null);
  const [done, setDone] = useState<Tier | null>(null);

  useEffect(() => {
    if (!open) return;
    const existing = document.getElementById("whop-checkout-loader");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "whop-checkout-loader";
      script.src = "https://js.whop.com/static/checkout/loader.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        event?: string;
        type?: string;
        __scope?: string;
      };
      if (!data || typeof data !== "object") return;
      if (
        data.event === "complete" ||
        data.type === "complete" ||
        (data.__scope === "whop-embedded-checkout" && data.event === "complete")
      ) {
        setDone(open);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(null);
    setDone(null);
  }

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="kicker">Premium</div>
        <h1 className="mb-3 font-serif text-[38px] leading-tight">
          Support the bot.
        </h1>
        <p className="mb-11 max-w-[520px] text-[14.5px] leading-[1.65] text-bone-dim">
          Keep BleachDex running and get rewarded for it. Your Discord role and
          perks attach automatically the moment your payment goes through.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {(Object.keys(TIER_META) as Tier[]).map((kind) => (
            <TierCard
              key={kind}
              kind={kind}
              onOpen={() => {
                setDone(null);
                setOpen(kind);
              }}
            />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11.5px] text-bone-faint">
          <span>Secure payment via Whop</span>
          <span>Cancel anytime</span>
          <span>Role granted instantly</span>
        </div>
      </div>
      {open ? (
        <CheckoutModal kind={open} done={done === open} onClose={close} />
      ) : null}
    </main>
  );
}

function TierCard({ kind, onOpen }: { kind: Tier; onOpen: () => void }) {
  const meta = TIER_META[kind];
  return (
    <div
      className="panel group relative flex flex-col overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: `0 0 0 0 ${meta.accent}00` }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = `0 18px 50px -18px ${meta.accent}66`)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 0 0 ${meta.accent}00`)
      }
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-[0.12] blur-3xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: meta.accent }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="font-serif text-[21px] leading-snug">
          {WHOP_LABEL[kind]}
        </div>
        {meta.tag ? (
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider"
            style={{
              color: meta.accent,
              borderColor: `${meta.accent}66`,
              background: `${meta.accent}14`,
            }}
          >
            {meta.tag}
          </span>
        ) : null}
      </div>
      <div className="relative my-4 flex items-baseline gap-1.5">
        <span
          className="font-serif text-[48px] leading-none"
          style={{ color: meta.accent }}
        >
          {meta.price}
        </span>
        <span className="font-mono text-[12px] text-bone-faint">/ month</span>
      </div>
      <div className="mb-5 h-px w-full bg-line" />
      <ul className="relative mb-8 flex-1 list-none space-y-3.5 p-0">
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
      <button
        type="button"
        className={
          kind === "vip" ? "btn btn-fill relative" : "btn btn-outline relative"
        }
        onClick={onOpen}
      >
        {meta.cta}
      </button>
    </div>
  );
}

function CheckoutModal({
  kind,
  done,
  onClose,
}: {
  kind: Tier;
  done: boolean;
  onClose: () => void;
}) {
  const meta = TIER_META[kind];
  return (
    <div
      className="bd-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Checkout: ${WHOP_LABEL[kind]}`}
    >
      <div
        className="bd-modal relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[470px] flex-col overflow-hidden rounded-[10px_28px_10px_28px] border border-line-bright bg-void-raised sm:max-h-[calc(100dvh-2.5rem)]"
        style={{
          boxShadow: `0 30px 90px -20px ${meta.accent}55, 0 0 0 1px ${meta.accent}22`,
        }}
      >
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)`,
          }}
        />
        <div
          className="pointer-events-none absolute -left-20 -top-24 size-56 rounded-full opacity-20 blur-3xl"
          style={{ background: meta.accent }}
        />

        <div className="relative flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-5">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-bone-faint">
              BleachDex Premium
            </div>
            <div className="mt-1 font-serif text-[22px] leading-snug">
              {WHOP_LABEL[kind]}
            </div>
            <div
              className="mt-0.5 font-mono text-[12px]"
              style={{ color: meta.accent }}
            >
              {meta.price} / month
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line-bright text-bone-faint transition-colors hover:border-bone-dim hover:text-bone"
          >
            <svg
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="h-px w-full shrink-0 bg-line" />

        {done ? (
          <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-12 text-center">
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
            <div className="font-serif text-[26px]">
              {WHOP_LABEL[kind]}: locked in.
            </div>
            <p className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-[1.6] text-bone-dim">
              Thank you for supporting BleachDex. Your Discord role attaches
              automatically from the payment, so just sit tight.
            </p>
            <button
              type="button"
              className="btn btn-outline mt-7"
              onClick={onClose}
            >
              Back to Premium
            </button>
          </div>
        ) : (
          <>
            <div className="bd-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-void-raised">
              <div className="bd-skeleton pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[11.5px] text-bone-faint">
                Loading secure checkout…
              </div>
              <div
                key={kind}
                data-whop-checkout-plan-id={WHOP_PLAN[kind]}
                data-whop-checkout-theme="dark"
                data-whop-checkout-theme-accent-color={meta.whopAccent}
                data-whop-checkout-skip-redirect="true"
                data-whop-checkout-hide-price="true"
                className="relative min-h-[420px]"
              />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-6 py-3">
              <span className="flex items-center gap-2 font-mono text-[11px] text-bone-faint">
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
                Secure checkout by Whop
              </span>
              <a
                href={`https://whop.com/checkout/${WHOP_PLAN[kind]}/`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-bone-faint underline underline-offset-4 hover:text-azure-bright"
              >
                Not loading? Open in new tab
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
