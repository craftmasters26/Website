export const COMMAND_GROUPS = [
  {
    title: "Collection",
    commands: [
      ["/collection completion", "See your collection progress"],
      ["/collection inventory", "List your owned characters and weapons by name"],
      ["/card view", "Preview the fully-rendered card for a character or weapon you own"],
      ["/equip", "Equip a weapon onto one of your characters"],
      ["/unequip", "Remove the weapon equipped on one of your characters"],
    ],
  },
  {
    title: "Packs",
    commands: [
      ["/pack daily", "Claim a daily pack (3 per day)"],
      ["/pack weekly", "Claim your weekly pack (guaranteed Epic or better)"],
    ],
  },
  {
    title: "Shop & Merchant",
    commands: [
      ["/shop", "Daily shop with 5 faction pages and boss drops, refreshes every 24 hours"],
      ["/merchant", "See this window's rotating trades and make one"],
    ],
  },
  {
    title: "Team & Battle",
    commands: [
      ["/team add", "Build a team by name and save it into one of your 2 slots"],
      ["/team use", "Switch which of your 2 saved slots is active for battles"],
      ["/team show", "Show one of your saved teams (defaults to your active slot)"],
      ["/team list", "Quick overview of both of your saved team slots"],
      [
        "/battle start",
        "Challenge another player. Teams fight it out automatically, round by round",
      ],
    ],
  },
  {
    title: "Boss & Crafting",
    commands: [["/craft", "Craft a character from boss drops, weapons and cards"]],
  },
  {
    title: "Trading",
    commands: [
      ["/trade give", "Give one of your owned characters or weapons directly to someone"],
      ["/trade start", "Propose a trade with another player"],
      ["/trade add", "Add one of your owned items to your active trade"],
      ["/trade remove", "Remove an item from your active trade"],
    ],
  },
  {
    title: "Economy",
    commands: [
      ["/daily", "Claim your daily KAN coins"],
      ["/balance", "Check your KAN coin balance"],
    ],
  },
  {
    title: "Achievements & Ranks",
    commands: [
      ["/achievements", "See your earned achievements and progress"],
      ["/leaderboard", "See who owns the most cards or KAN, or the most of one item"],
    ],
  },
  {
    title: "Reference",
    commands: [
      ["/help", "See what this bot can do"],
      ["/about", "About BleachDex - what it is and how it's doing"],
    ],
  },
  {
    title: "Server Setup",
    commands: [["/set spawn", "Server admins: set the channel where Souls spawn"]],
  },
] as const;
