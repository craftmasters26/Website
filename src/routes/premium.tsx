import { useEffect, useState } from "react";
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

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="kicker">Premium</div>
        <h1 className="mb-11 font-serif text-[38px] leading-tight">Support the bot.</h1>
        <div className="grid gap-5 md:grid-cols-2">
          <TierCard
            kind="support"
            price="$3"
            perks={[
              "Extra entries to giveaways",
              "A custom role with your choice of up to 2 colours + an icon",
              "1 BleachDex item of your choice (excluding certain items)",
            ]}
            open={open}
            done={done}
            onOpen={() => setOpen((cur) => (cur === "support" ? null : "support"))}
            onClose={() => setOpen(null)}
          />
          <TierCard
            kind="vip"
            price="$5"
            perks={[
              "Extra entries to giveaways",
              "A custom role with your choice of up to 2 colours + an icon",
              "3 BleachDex items of your choice (instead of one)",
              "A custom private spawn party once a week",
            ]}
            open={open}
            done={done}
            onOpen={() => setOpen((cur) => (cur === "vip" ? null : "vip"))}
            onClose={() => setOpen(null)}
          />
        </div>
      </div>
    </main>
  );
}

function TierCard({
  kind,
  price,
  perks,
  open,
  done,
  onOpen,
  onClose,
}: {
  kind: Tier;
  price: string;
  perks: string[];
  open: Tier | null;
  done: Tier | null;
  onOpen: () => void;
  onClose: () => void;
}) {
  const isVip = kind === "vip";
  return (
    <div
      className={
        isVip
          ? "panel flex flex-col p-8 transition-transform duration-300 hover:-translate-y-1"
          : "panel flex flex-col p-8 transition-transform duration-300 hover:-translate-y-1"
      }
    >
      <div className="font-serif text-[19px]">{WHOP_LABEL[kind]}</div>
      <div
        className={
          isVip
            ? "my-2.5 font-serif text-[38px] text-ember-bright"
            : "my-2.5 font-serif text-[38px] text-azure-bright"
        }
      >
        {price}
      </div>
      <ul className="mb-7 flex-1 list-none space-y-3 p-0">
        {perks.map((perk) => (
          <li
            key={perk}
            className="relative pl-[22px] text-[13.5px] leading-[1.55] text-bone-dim before:absolute before:left-0 before:top-[7px] before:size-2 before:rounded-sm before:bg-azure-bright"
          >
            {perk}
          </li>
        ))}
      </ul>
      <button type="button" className={isVip ? "btn btn-fill" : "btn btn-outline"} onClick={onOpen}>
        {isVip ? "Become a Shareholder" : "Become a Bleach Enjoyer"}
      </button>
      {open === kind ? (
        <div className="mt-4 overflow-hidden rounded-[6px_18px_6px_18px] border border-line-bright bg-void">
          {done === kind ? (
            <div className="px-4 py-6 text-center">
              <div className="font-serif text-[22px]">{WHOP_LABEL[kind]}: locked in.</div>
              <div className="mt-1.5 text-[13px] text-bone-dim">
                Stay on this page. Your Discord role attaches automatically from the payment.
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="font-mono text-[11.5px] text-bone-faint">
                  Checkout on BleachDex · {WHOP_LABEL[kind]}
                </span>
                <button
                  type="button"
                  className="text-xs text-bone-faint hover:text-bone"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
              <div
                data-whop-checkout-plan-id={WHOP_PLAN[kind]}
                data-whop-checkout-theme="dark"
                data-whop-checkout-skip-redirect="true"
                data-whop-checkout-hide-price="true"
                className="min-h-[420px]"
              />
              <div className="border-t border-line px-4 py-2.5 text-center">
                <a
                  href={`https://whop.com/checkout/${WHOP_PLAN[kind]}/`}
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
      ) : null}
    </div>
  );
}
