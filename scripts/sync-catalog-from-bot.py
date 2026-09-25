#!/usr/bin/env python3
"""
Rebuild the site's data files from the bot itself, so the website (List,
Rarity, Registry) always agrees with what the bot really does.

Run from the site root, pointing at your bot checkout (the folder that holds
factions.py and db/):

    python3 scripts/sync-catalog-from-bot.py --bot-dir ../bleachdex

Writes:
    src/data/characters.json    every character, including craft-only ones
                                (with their /craft recipe and category)
    src/data/weapons.json       every weapon
    src/data/achievements.json  every achievement, with targets worked out
                                from the current roster

Nothing is written to the bot's database. Achievements are read through the
bot's own db/achievements.py, so the targets ("Obtain 1x each Captain" and
friends) come from the same code the bot uses.
"""

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = SITE_ROOT / "src" / "data"

# Craft-only characters are grouped by category in the bot. The site's
# faction filter has four factions, so each category maps onto one of them.
CRAFT_CATEGORY_FACTION = {
    "Quincy Vollständig": "quincy",
    "Yhwach": "quincy",
    "Soul Reaper Captains": "soul_reaper",
    "Soul Reaper Lieutenants": "soul_reaper",
    "Visored": "soul_reaper",
    "Ichigo": "soul_reaper",
    "Aizen": "soul_reaper",
    "Espada Resurrección": "hollow",
    "Ulquiorra": "hollow",
    "Ginjo": "fullbringer",
}

# Heading each achievement sits under on the Registry page.
ACHIEVEMENT_GROUPS = {
    "Catching": ["main_catcher", "speed_is_a_burden", "fast_catcher", "sniper",
                 "catch_100", "catch_500", "catch_1000"],
    "Rare souls": ["reiatsu_knot", "reiatsu_supply", "reiatsu_collector",
                   "mythical_aura", "mythic_collector", "mighty_myths"],
    "Sets": ["gotei_13", "zanpakuto_collector", "espada_fleet", "vizard_mask",
             "zanpakuto_spirit", "quincy_k", "perfectionist"],
    "Trading": ["the_marketplace", "kan_trader", "junior_trade", "trading_beginner",
                "semi_pro_trader", "trusted_deal", "high_roller"],
    "Battle": ["fighter", "bankai_spammer", "boss_slayer", "flawless_victory",
               "beating_the_boss", "dethroning_the_king"],
    "Crafting": ["crafter", "master_craftsman"],
}

# Achievements the browser registry can work out on its own, because they
# only depend on which souls or weapons you own. The rest need Discord.
SOUL_SET_POOLS = {"gotei_13": "captains", "espada_fleet": "arrancar",
                  "vizard_mask": "vizards", "zanpakuto_spirit": "spirits",
                  "quincy_k": "quincy"}
MYTHIC_KEYS = {"mythical_aura", "mythic_collector", "mighty_myths"}


def base_name(weapon_name: str) -> str:
    """'Tensa Zangetsu (Bankai - Ichigo)' -> 'tensa zangetsu'."""
    return re.sub(r"\s*\(.*\)\s*$", "", weapon_name).strip().lower()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--bot-dir", required=True, type=Path,
                        help="folder containing the bot's factions.py and db/")
    args = parser.parse_args()

    bot_dir = args.bot_dir.resolve()
    sys.path.insert(0, str(bot_dir))
    import factions  # noqa: E402  (imported from the bot checkout)
    from db import achievements as ach  # noqa: E402

    conn = sqlite3.connect(f"file:{bot_dir / 'db' / 'bleachdex.sqlite3'}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    recipes: dict[int, list] = {}
    for r in conn.execute(
        "SELECT character_id, kind, item_name, qty FROM craft_ingredients "
        "ORDER BY character_id, sort_order"
    ):
        recipes.setdefault(r["character_id"], []).append([r["kind"], r["item_name"], r["qty"]])
    for r in conn.execute("SELECT character_id, required_drop_name, required_drop_qty FROM craft_recipes"):
        recipes.setdefault(r["character_id"], [["drop", r["required_drop_name"], r["required_drop_qty"]]])

    characters = []
    for r in conn.execute("SELECT * FROM characters ORDER BY id"):
        row = {
            "id": r["id"],
            "name": r["name"],
            "position": r["position"],
            "image_path": r["image_path"],
            "hp": r["hp"],
            "attack": r["attack"],
            "tier": r["tier"],
            "ability_name": r["ability_name"],
            "ability_description": r["ability_description"],
            "card_image_path": r["card_image_path"],
            "enabled": r["enabled"],
        }
        if r["craftable_only"]:
            category = r["craft_category"] or ""
            row["faction"] = CRAFT_CATEGORY_FACTION.get(category, "")
            row["craft"] = {"category": category, "recipe": recipes.get(r["id"], [])}
        else:
            row["faction"] = factions.CHARACTER_FACTIONS.get(r["name"], "")
        characters.append(row)

    # Weapon names no longer encode their owner, so keep any faction the
    # previous export already knew for the same base name.
    weapons_path = DATA_DIR / "weapons.json"
    previous = json.loads(weapons_path.read_text()) if weapons_path.exists() else []
    known_faction = {base_name(w["name"]): w.get("faction", "") for w in previous}
    weapons = [
        {
            "id": r["id"],
            "name": r["name"],
            "position": r["position"],
            "image_path": r["image_path"],
            "attack_bonus": r["attack_bonus"],
            "tier": r["tier"],
            "ability_name": r["ability_name"],
            "ability_description": r["ability_description"],
            "card_image_path": r["card_image_path"],
            "enabled": r["enabled"],
            "faction": factions.weapon_faction(r["name"]) or known_faction.get(base_name(r["name"]), ""),
        }
        for r in conn.execute("SELECT * FROM weapons ORDER BY id")
    ]
    conn.close()

    pools = ach._pools()
    group_of = {k: g for g, keys in ACHIEVEMENT_GROUPS.items() for k in keys}
    achievements = []
    for a in ach.ACHIEVEMENTS:
        track = None
        if a.key in SOUL_SET_POOLS:
            track = {"kind": "souls", "ids": sorted(pools[SOUL_SET_POOLS[a.key]])}
        elif a.key == "zanpakuto_collector":
            track = {"kind": "weapons", "ids": sorted(pools["zanpakuto"])}
        elif a.key in MYTHIC_KEYS:
            track = {"kind": "tier", "tier": "mythic"}
        achievements.append({
            "key": a.key,
            "name": a.name,
            "description": a.description,
            "target": a.target(),
            "reward": a.kan_reward,
            "group": group_of.get(a.key, "Other"),
            "track": track,
        })

    (DATA_DIR / "characters.json").write_text(json.dumps(characters, indent=2) + "\n")
    weapons_path.write_text(json.dumps(weapons, indent=2) + "\n")
    (DATA_DIR / "achievements.json").write_text(json.dumps(achievements, indent=2) + "\n")
    craft = sum(1 for c in characters if "craft" in c)
    print(f"{len(characters)} characters ({craft} craft-only) · {len(weapons)} weapons · "
          f"{len(achievements)} achievements")


if __name__ == "__main__":
    main()
