export const WHOP_PLAN = {
  support: "plan_J7OuXMyBZFZeN",
  vip: "plan_UneUQNGIMsazS",
} as const;

export type Tier = keyof typeof WHOP_PLAN;

export const WHOP_LABEL: Record<Tier, string> = {
  support: "Bleach Enjoyer",
  vip: "Urahara Foundation Shareholder",
};

export const TIER_META: Record<
  Tier,
  {
    price: string;
    accent: string;
    whopAccent: string;
    tag: string | null;
    cta: string;
    perks: string[];
  }
> = {
  support: {
    price: "$3",
    accent: "#5c8dff",
    whopAccent: "sky",
    tag: null,
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
    tag: "Best value",
    cta: "Become a Shareholder",
    perks: [
      "Extra entries to giveaways",
      "A custom role with your choice of up to 2 colours + an icon",
      "3 BleachDex items of your choice (instead of one)",
      "A custom private spawn party once a week",
    ],
  },
};
