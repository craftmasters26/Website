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
      ["/pack weekly", "Claim your weekly pack (1 per week)"],
    ],
  },
  {
    title: "Team & Battle",
    commands: [
      ["/team add", "Build your 3-character squad and equip weapons per slot"],
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
      ["/leaderboard", "See who owns the most cards overall, or of one item"],
    ],
  },
  {
    title: "Reference",
    commands: [["/about", "See what this bot can do"]],
  },
] as const;
