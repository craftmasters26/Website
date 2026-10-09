import { Link, createFileRoute } from "@tanstack/react-router";
import { TIER_META, WHOP_LABEL, type Tier } from "@/lib/premium-tiers";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [{ title: "Premium · BleachDex" }],
  }),
  component: PremiumPage,
});

function PremiumPage() {
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
          {(["bleach-enjoyer", "urahara-foundation-shareholder"] as Tier[]).map((kind) => (
            <TierCard key={kind} kind={kind} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11.5px] text-bone-faint">
          <span>Secure payment via Whop</span>
          <span>Cancel anytime</span>
          <span>Role granted instantly</span>
        </div>
      </div>
    </main>
  );
}

function TierCard({ kind }: { kind: Tier }) {
  const meta = TIER_META[kind];
  return (
    <div
      className="panel group relative flex flex-col overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1.5"
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = `0 18px 50px -18px ${meta.accent}66`)
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
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
            <CheckIcon color={meta.accent} />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/checkout"
        search={{ tier: kind }}
        className={
          kind === "urahara-foundation-shareholder" ? "btn btn-fill relative" : "btn btn-outline relative"
        }
      >
        {meta.cta}
      </Link>
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-[3px] size-[15px] shrink-0"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}
