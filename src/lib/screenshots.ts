/**
 * Real product screenshots. Put image files in public/screens/ and add them here; the
 * "See it in Discord" section appears automatically once this list has entries.
 * Example: { src: "/screens/spawn.png", alt: "A soul spawning in a server", caption: "A soul spawns" }
 */
export type Screenshot = { src: string; alt: string; caption: string; width?: number; height?: number };

export const SCREENSHOTS: Screenshot[] = [];
