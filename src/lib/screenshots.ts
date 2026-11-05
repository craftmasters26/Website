/**
 * Real product screenshots (files live in public/screens/, cropped to their content).
 * Other players' names in the leaderboard shot are blurred on purpose.
 * Add or remove entries here; the gallery lists them in this order and hides itself if empty.
 */
export type Screenshot = {
  key: "spawn" | "boss" | "leaderboard" | "catch";
  title: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export const SCREENSHOTS: Screenshot[] = [
  {
    key: "spawn",
    title: "Souls spawn",
    src: "/screens/spawn.png",
    alt: "BleachDex posts a soul in a Discord channel with Catch Soul! and What is this? buttons",
    caption: "A soul appears in chat. The first person to press Catch Soul! keeps it.",
    width: 416,
    height: 464,
  },
  {
    key: "boss",
    title: "Boss fights",
    src: "/screens/boss.png",
    alt: "BleachDex announces that Chojiro Sasakibe has appeared with a Challenge button",
    caption: "Bosses appear on a timer. Challenge them with your /team.",
    width: 592,
    height: 468,
  },
  {
    key: "catch",
    title: "Catching",
    src: "/screens/catch.png",
    alt: "BleachDex congratulating a player for catching Pesche Guatiche",
    caption: "Catch one and it joins your collection.",
    width: 598,
    height: 95,
  },
  {
    key: "leaderboard",
    title: "Leaderboard",
    src: "/screens/leaderboard.png",
    alt: "The BleachDex overall leaderboard in Discord, showing 31,201 characters owned by 488 players",
    caption: "Climb the overall leaderboard: 31,201 characters owned by 488 players.",
    width: 452,
    height: 577,
  },
];

export const shot = (key: Screenshot["key"]) => SCREENSHOTS.find((s) => s.key === key)!;
