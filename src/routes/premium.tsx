import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Gift, Lock, ShieldCheck, Sparkles, X } from "lucide-react";

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

const WHOP_URL = {
  support: "https://whop.com/bleachdex/bleach-enjoyer/",
  vip: "https://whop.com/bleachdex/urahara-foundation-shareholder/",
} as const;

const WHOP_LABEL = {
  support: "Bleach Enjoyer",
  vip: "Urahara Foundation Shareholder",
} as const;

const WHOP_ACCENT = {
  support: "blue",
  vip: "orange",
} as const;

type Tier = keyof typeof WHOP_PLAN;

const TIERS: Record<
  Tier,
  { price: string; tagline: string; perks: string[]; cta: string; badge?: string }
> = {
  support: {
    price: "$3",
    tagline: "Back the bot and get the essentials.",
    perks: [
      "Extra entries to giveaways",
      "A custom role with your choice of up to 2 colours + an icon",
      "1 BleachDex item of your choice (excluding certain items)",
    ],
    cta: "Become a Bleach Enjoyer",
  },
  vip: {
    price: "$5",
    tagline: "The full Urahara Foundation experience.",
    perks: [
      "Extra entries to giveaways",
      "A custom role with your choice of up to 2 colours + an icon",
      "3 BleachDex items of your choice (instead of one)",
      "A custom private spawn party once a week",
    ],
    cta: "Become a Shareholder",
    badge: "Best value",
  },
};

function PremiumPage() {
  const [open, setOpen] = useState<Tier | null>(null);
  const [done, setDone] = useState<Tier | null>(null);

  // Load Whop's checkout script each time the checkout opens so it always
  // mounts onto the freshly rendered element.
  useEffect(() => {
    if (!open) return;
    document.getElementById("whop-checkout-loader")?.remove();
    const script = document.createElement("script");
    script.id = "whop-checkout-loader";
    script.src = "https://js.whop.com/static/checkout/loader.js";
    script.async = true;
    document.head.appendChild(script);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { event?: string; type?: string; __scope?: string };
      if (!data || typeof data !== "object") return;
      if (
        data.event === "complete" ||
        data.type === "complete" ||
        (data.__scope === "whop-embedded-checkout" && data.event === "complete")
      ) {
        setDone(open);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open]);

  // Close on Escape + lock page scroll while the checkout is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    setOpen(null);
    setDone(null);
  };

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="kicker">Premium</div>
        <h1 className="font-serif text-[38px] leading-tight md:text-[46px]">Support the bot.</h1>
        <p className="mb-11 mt-3 max-w-xl text-[15px] leading-7 text-bone-dim">
          Keep BleachDex running and get something back for it. Pick a tier, check out right here,
          and your Discord perks attach automatically.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {(Object.keys(TIERS) as Tier[]).map((kind) => (
            <TierCard key={kind} kind={kind} onOpen={() => { setDone(null); setOpen(kind); }} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[12px] text-bone-faint">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-azure-bright" /> Secure checkout by Whop
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock className="size-4 text-azure-bright" /> Card details never touch our servers
          </span>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4 text-azure-bright" /> Perks delivered automatically
          </span>
        </div>
      </div>

      {open ? <CheckoutModal kind={open} done={done === open} onClose={close} /> : null}
    </main>
  );
}

function TierCard({ kind, onOpen }: { kind: Tier; onOpen: () => void }) {
  const tier = TIERS[kind];
  const isVip = kind === "vip";
  const Icon = isVip ? Crown : Gift;
  return (
    <div data-kind={kind} className="prem-card flex flex-col p-8">
      {tier.badge ? (
        <span className="absolute right-6 top-6 rounded-full border border-ember-bright/40 bg-ember-dim px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ember-bright">
          {tier.badge}
        </span>
      ) : null}

      <div
        className={
          "mb-5 flex size-12 items-center justify-center rounded-[6px_16px_6px_16px] border " +
          (isVip
            ? "border-ember-bright/40 bg-ember-dim text-ember-bright"
            : "border-azure-bright/40 bg-azure-dim text-azure-bright")
        }
      >
        <Icon className="size-6" />
      </div>

      <div className="font-serif text-[22px] leading-tight">{WHOP_LABEL[kind]}</div>
      <div className="mt-1 text-[13.5px] text-bone-dim">{tier.tagline}</div>

      <div
        className={
          "my-5 font-serif text-[52px] leading-none " +
          (isVip ? "text-ember-bright" : "text-azure-bright")
        }
      >
        {tier.price}
      </div>

      <div className="mb-6 h-px bg-gradient-to-r from-line-bright via-line to-transparent" />

      <ul className="mb-8 flex-1 list-none space-y-3.5 p-0">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3 text-[13.5px] leading-[1.55] text-bone-dim">
            <span
              className={
                "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full " +
                (isVip ? "bg-ember-dim text-ember-bright" : "bg-azure-dim text-azure-bright")
              }
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={"btn w-full " + (isVip ? "btn-fill" : "btn-azure")}
        onClick={onOpen}
      >
        {tier.cta}
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
  const tier = TIERS[kind];
  const isVip = kind === "vip";
  const accent = isVip ? "text-ember-bright" : "text-azure-bright";

  return (
    <div
      className="prem-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md md:items-center md:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Checkout for ${WHOP_LABEL[kind]}`}
    >
      <div
        data-kind={kind}
        className="prem-modal relative grid w-full max-w-[960px] overflow-hidden rounded-[8px_26px_8px_26px] border border-line-bright bg-void-raised md:grid-cols-[0.9fr_1.1fr]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-line-bright bg-void/80 text-bone-dim transition hover:text-bone"
        >
          <X className="size-4" />
        </button>

        {/* Summary side */}
        <div
          className="relative flex flex-col gap-5 border-b border-line p-8 md:border-b-0 md:border-r md:p-10"
          style={{
            background: isVip
              ? "radial-gradient(420px 260px at 0% 0%, rgba(255,106,44,0.20), transparent 70%), var(--color-void-raised-2)"
              : "radial-gradient(420px 260px at 0% 0%, rgba(92,141,255,0.20), transparent 70%), var(--color-void-raised-2)",
          }}
        >
          <div className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-bone-faint">
            Your order
          </div>
          <div>
            <div className="font-serif text-[26px] leading-tight">{WHOP_LABEL[kind]}</div>
            <div className={"mt-2 font-serif text-[46px] leading-none " + accent}>{tier.price}</div>
          </div>
          <ul className="list-none space-y-3 p-0">
            {tier.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-[13px] leading-[1.55] text-bone-dim">
                <Check className={"mt-0.5 size-4 shrink-0 " + accent} strokeWidth={3} />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-2 pt-4 font-mono text-[11.5px] text-bone-faint">
            <ShieldCheck className="size-4 text-azure-bright" />
            Encrypted &amp; processed securely by Whop
          </div>
        </div>

        {/* Checkout side */}
        <div className="bg-[#111111] p-5 md:p-7">
          {done ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center">
              <div
                className={
                  "mb-5 flex size-20 items-center justify-center rounded-full border-2 " +
                  (isVip
                    ? "border-ember-bright text-ember-bright"
                    : "border-azure-bright text-azure-bright")
                }
              >
                <svg viewBox="0 0 24 24" className="prem-check size-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </div>
              <div className="font-serif text-[26px]">{WHOP_LABEL[kind]}: locked in.</div>
              <p className="mt-2 max-w-xs text-[13.5px] leading-6 text-bone-dim">
                Payment received. Stay on this page and your Discord role attaches automatically.
              </p>
              <button type="button" onClick={onClose} className="btn btn-outline mt-7 !py-3">
                Back to Premium
              </button>
            </div>
          ) : (
            <>
              <div className="relative min-h-[460px]">
                <div className="absolute inset-0 space-y-4 p-1" aria-hidden="true">
                  <div className="prem-skeleton h-5 w-24" />
                  <div className="prem-skeleton h-12 w-full" />
                  <div className="prem-skeleton h-5 w-32" />
                  <div className="prem-skeleton h-28 w-full" />
                  <div className="prem-skeleton h-12 w-full" />
                </div>
                <div
                  key={kind}
                  data-whop-checkout-plan-id={WHOP_PLAN[kind]}
                  data-whop-checkout-theme="dark"
                  data-whop-checkout-theme-accent-color={WHOP_ACCENT[kind]}
                  data-whop-checkout-skip-redirect="true"
                  data-whop-checkout-hide-price="true"
                  className="relative min-h-[460px]"
                />
              </div>
              <div className="mt-3 text-center">
                <a
                  href={WHOP_URL[kind]}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11.5px] text-bone-faint underline underline-offset-4 hover:text-azure-bright"
                >
                  Checkout not loading? Open it in a new tab instead
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
