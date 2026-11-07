import { Link, createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";
import { TIER_META, WHOP_LABEL, type Tier } from "@/lib/premium-tiers";
import { jsonLd } from "@/lib/seo";

const COMPARE_ROWS: { perk: string; free: string; enjoyer: string; shareholder: string }[] = [
  { perk: "Catch, packs, bosses, crafting, leaderboard", free: "Included", enjoyer: "Included", shareholder: "Included" },
  { perk: "Giveaway entries", free: "Standard", enjoyer: "Average ÷ 10 extra", shareholder: "Average ÷ 6.5 extra" },
  { perk: "Custom role (name, colour, icon)", free: "—", enjoyer: "Yes", shareholder: "Yes" },
  { perk: "Cards of your choice", free: "—", enjoyer: "1 Mythical · 2 Legendary · 3 Rare · 4 Uncommon · 5 Common", shareholder: "2 Mythical · 4 Legendary · 5 Rare · 6 Uncommon · 7 Common" },
  { perk: "Exclusive weekly boss day (a boss every 15 min)", free: "—", enjoyer: "—", shareholder: "Yes" },
  { perk: "Exclusive weekly spawn party channel", free: "—", enjoyer: "—", shareholder: "Yes" },
  { perk: "Price", free: "$0", enjoyer: "$3", shareholder: "$5" },
];

function CompareTable() {
  return (
    <section aria-labelledby="compare-title" className="mt-16">
      <h2 id="compare-title" className="mb-6 font-serif text-[26px] leading-tight">
        Free vs Premium, side by side
      </h2>
      <div className="overflow-x-auto rounded-md border border-line bg-void-raised">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
          <caption className="sr-only">Comparison of the free experience, Bleach Enjoyer and Urahara Foundation Shareholder</caption>
          <thead>
            <tr className="border-b border-line font-mono text-[11.5px] uppercase tracking-[0.06em] text-bone-faint">
              <th scope="col" className="p-4 font-normal">Perk</th>
              <th scope="col" className="p-4 font-normal">Free</th>
              <th scope="col" className="p-4 font-normal">Bleach Enjoyer</th>
              <th scope="col" className="p-4 font-normal text-bone">Shareholder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {COMPARE_ROWS.map((r) => (
              <tr key={r.perk}>
                <th scope="row" className="p-4 font-medium text-bone">{r.perk}</th>
                <td className="p-4 text-bone-faint">{r.free}</td>
                <td className="p-4 text-bone-dim">{r.enjoyer}</td>
                <td className="p-4 text-bone">{r.shareholder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "When do I get my perks?",
    a: "Right after your payment clears. Sign in to the website with the Discord account you play with, then run /redeem rewards in the BleachDex server to attach your plan. Most people are set within a minute.",
  },
  {
    q: "I paid but my role or perks are missing. What now?",
    a: "Wait two minutes and run /redeem rewards again. If nothing changes, send us your Whop receipt email and your Discord username through the contact page and we will fix it by hand.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, any time from your Whop account. You keep the perks until the end of the period you already paid for.",
  },
  {
    q: "Do you offer refunds?",
    a: "Digital perks start immediately, so refunds are handled case by case. If something went wrong with your purchase, contact us within 7 days and we will make it right.",
  },
  {
    q: "Is the payment secure?",
    a: "Payments are processed by Whop. BleachDex never sees or stores your card details.",
  },
  {
    q: "What is the difference between the two plans?",
    a: "Both give you a custom role, extra giveaway entries and cards of your choice. The Urahara Foundation Shareholder plan adds higher card counts, bigger giveaway weight and the exclusive weekly boss and spawn parties.",
  },
];

export const Route = createFileRoute("/bleachdex/premium")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_URL}/bleachdex/premium` }],
    meta: [
      { title: "BleachDex Premium: perks, price and how it works" },
      {
        name: "description",
        content:
          "Support BleachDex and get a custom Discord role, bonus giveaway entries, cards of your choice and exclusive boss and spawn parties. Plans from $3 a month, cancel anytime.",
      },
    ],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    ],
  }),
  component: PremiumPage,
});

function PremiumPage() {
  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <h1 className="mb-3 font-serif text-[38px] leading-tight">
          Support the bot.
        </h1>
        <p className="mb-11 max-w-[520px] text-[14.5px] leading-[1.65] text-bone-dim">
          Keep BleachDex running and get rewarded for it. Pay once on Whop, then run
          /redeem rewards in the BleachDex server to claim your role and perks.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {(["bleach-enjoyer", "urahara-foundation-shareholder"] as Tier[]).map((kind) => (
            <TierCard key={kind} kind={kind} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11.5px] text-bone-faint">
          <span>Secure payment via Whop</span>
          <span>Cancel anytime</span>
          <span>Claim perks with /redeem rewards</span>
        </div>

        <CompareTable />

        <section aria-labelledby="after-pay" className="mt-16">
          <h2 id="after-pay" className="mb-6 font-serif text-[26px] leading-tight">
            What happens after you pay
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              ["1. Checkout", "Pay securely on Whop. You get a receipt by email straight away."],
              ["2. Redeem", "Sign in with Discord here, then run /redeem rewards in the BleachDex server."],
              ["3. Enjoy", "Your role, giveaway weight and card picks are applied. Not showing? Contact us with your receipt."],
            ].map(([title, body]) => (
              <li key={title} className="rounded-md border border-line bg-void-raised p-5">
                <div className="mb-1.5 text-[14px] font-bold text-bone">{title}</div>
                <p className="text-[13px] leading-5 text-bone-dim">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="premium-faq" className="mt-16 max-w-3xl">
          <h2 id="premium-faq" className="mb-6 font-serif text-[26px] leading-tight">
            Questions before you buy
          </h2>
          <div className="divide-y divide-line rounded-md border border-line bg-void-raised">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none text-[14.5px] font-bold text-bone marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 text-[13.5px] leading-6 text-bone-dim">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-bone-dim">
            Still unsure?{" "}
            <Link to="/bleachdex/contact" className="underline underline-offset-4 hover:text-bone">
              Ask us
            </Link>{" "}
            before you buy.
          </p>
        </section>
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
        to="/bleachdex/checkout"
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
