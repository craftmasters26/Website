/**
 * Forgiving name search for the catalog.
 *  1. every typed word appears somewhere in the name ("ichigo kuro" -> "Ichigo Kurosaki"), or
 *  2. the typed letters appear in order ("ichgo" / "kursaki" -> "Ichigo Kurosaki").
 * Accents and punctuation are ignored. Tier-2 only kicks in from 3 letters so short
 * queries do not match everything.
 */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");
}

export function matchesName(name: string, query: string): boolean {
  const q = normalize(query).trim();
  if (!q) return true;
  const n = normalize(name);
  const words = q.split(/\s+/);
  if (words.every((w) => n.includes(w))) return true;
  const compact = q.replace(/\s+/g, "");
  if (compact.length < 3) return false;
  let i = 0;
  for (const ch of n) if (ch === compact[i]) i++;
  return i === compact.length;
}
