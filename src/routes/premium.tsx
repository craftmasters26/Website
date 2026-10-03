import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [{ title: "Premium · BleachDex" }],
  }),
  component: PremiumPage,
});

const WHOP_URL = {
  support: "https://whop.com/bleachdex/bleach-enjoyer/",
  vip: "https://whop.com/bleachdex/urahara-foundation-shareholder/",
} as const;

const WHOP_LABEL = {
  support: "Bleach Enjoyer",
  vip: "Urahara Foundation Shareholder",
} as const;

type Tier = keyof typeof WHOP_URL;

function PremiumPage() {
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
}: {
  kind: Tier;
  price: string;
  perks: string[];
}) {
  const isVip = kind === "vip";
  return (
    <div className="panel flex flex-col p-8 transition-transform duration-300 hover:-translate-y-1">
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
      <a
        href={WHOP_URL[kind]}
        target="_blank"
        rel="noreferrer"
        className={isVip ? "btn btn-fill" : "btn btn-outline"}
      >
        {isVip ? "Become a Shareholder" : "Become a Bleach Enjoyer"}
      </a>
    </div>
  );
}
