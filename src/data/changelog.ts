/**
 * What's new. Newest first. Add an entry at the top whenever you ship something players will notice;
 * the page, its structured data and the sitemap all read from here.
 * `date` is an ISO date (YYYY-MM-DD).
 */
export type ChangelogEntry = { date: string; title: string; items: string[] };

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-11-07",
    title: "Faster art, clearer rarity, new guide",
    items: [
      "Card and weapon art now loads as small, resized WebP images instead of full-size PNGs, so the List opens much faster on phones.",
      "Cards are framed in their tier colour, with a light sweep on Legendary and Mythic.",
      "New Guide page explaining tiers, the hourly boss, crafting and weapons, with numbers read from the live catalog.",
      "Premium now has a Free vs Premium comparison table and spells out the exact /redeem rewards command.",
      "The home page shows how many servers BleachDex is in and how many players caught something today.",
    ],
  },
  {
    date: "2026-11-01",
    title: "Collection, filters and leaderboard polish",
    items: [
      "List filters (type, tier, sort, search, owned or missing) are saved in the address, so you can share a filtered view.",
      "My Collection shows a progress bar and a checklist for new players.",
      "The leaderboard has daily, weekly and monthly views.",
      "Commands page got search and jump links.",
    ],
  },
];
