/**
 * Real product screenshots (files live in public/screens/). Add or remove entries here;
 * the "See BleachDex in action" section lists them in this order and hides itself if empty.
 * Other players' names in the leaderboard shot are blurred on purpose.
 */
export type Screenshot = { src: string; alt: string; caption: string; width: number; height: number };

export const SCREENSHOTS: Screenshot[] = [
  {
    src: "/screens/spawn.png",
    alt: "BleachDex posts a soul in a Discord channel with Catch Soul! and What is this? buttons",
    caption: "A soul spawns in chat. Be first to catch it.",
    width: 660,
    height: 464,
  },
  {
    src: "/screens/boss.png",
    alt: "BleachDex announces that Chojiro Sasakibe has appeared with a Challenge button",
    caption: "Bosses appear. Challenge them with your /team.",
    width: 688,
    height: 468,
  },
  {
    src: "/screens/leaderboard.png",
    alt: "The BleachDex overall leaderboard in Discord, showing 31,201 characters owned by 488 players",
    caption: "The overall leaderboard: 31,201 characters owned by 488 players.",
    width: 602,
    height: 577,
  },
  {
    src: "/screens/catch.png",
    alt: "BleachDex congratulating a player for catching Pesche Guatiche",
    caption: "Catch one and it joins your collection.",
    width: 714,
    height: 95,
  },
];
