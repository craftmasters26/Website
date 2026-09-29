/**
 * Reiatsu copies. Mirrors the constants in the bot's reiatsu.py: every
 * character added to a collection has a 10% chance to be a Reiatsu copy,
 * which fights with +20% damage and +10% HP. If you retune the bot, change
 * the numbers here too.
 */
export const REIATSU_CHANCE = 0.1;
export const REIATSU_DAMAGE_MULT = 1.2;
export const REIATSU_HP_MULT = 1.1;

/** Python's round() sends exact halves to the nearest even number; match it. */
function pyRound(x: number): number {
  const rounded = Math.round(x);
  return Math.abs(x % 1) === 0.5 && rounded % 2 !== 0 ? rounded - 1 : rounded;
}

export const reiatsuHp = (hp: number) => pyRound(hp * REIATSU_HP_MULT);
export const reiatsuAttack = (attack: number) => pyRound(attack * REIATSU_DAMAGE_MULT);
