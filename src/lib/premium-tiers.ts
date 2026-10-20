export const WHOP_PLAN = {
  "bleach-enjoyer": "plan_J7OuXMyBZFZeN",
  "urahara-foundation-shareholder": "plan_UneUQNGIMsazS",
} as const;

export type Tier = keyof typeof WHOP_PLAN;

export const WHOP_LABEL: Record<Tier, string> = {
  "bleach-enjoyer": "Bleach Enjoyer",
  "urahara-foundation-shareholder": "Urahara Foundation Shareholder",
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
  "bleach-enjoyer": {
    price: "$3",
    accent: "#5c8dff",
    whopAccent: "sky",
    tag: null,
    cta: "Become a Bleach Enjoyer",
    perks: [
      "Extra giveaway entries (average entries ÷ 10)",
      "A custom role: your name, colour (solid, gradient or holographic) and icon",
      "Cards of your choice: 1 Mythical, 2 Legendary, 3 Rare, 4 Uncommon, 5 Common",
    ],
  },
  "urahara-foundation-shareholder": {
    price: "$5",
    accent: "#ff8f4d",
    whopAccent: "orange",
    tag: "Best value",
    cta: "Become a Shareholder",
    perks: [
      "Extra giveaway entries (average entries ÷ 6.5)",
      "A custom role: your name, colour (solid, gradient or holographic) and icon",
      "Cards of your choice: 2 Mythical, 4 Legendary, 5 Rare, 6 Uncommon, 7 Common",
      "Exclusive weekly boss day: a boss every 15 minutes, all day",
      "Exclusive weekly spawn party channel",
    ],
  },
};
