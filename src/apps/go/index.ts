export const appMetadata = {
  name: "Go",
  version: "1.0.0",
  creator: {
    name: "Buster Franken",
    url: "https://www.busterfranken.com",
  },
  github: "https://github.com/BusterFranken/ryos-portfolio",
  icon: "/icons/default/go.png",
};

export const helpItems = [
  {
    icon: "⚫",
    title: "Place a Stone",
    description:
      "You play Black. Click or tap an empty intersection to place a stone; the computer replies as White.",
  },
  {
    icon: "⚔️",
    title: "Capture",
    description:
      "Surround an opponent group so it has no empty adjacent points (liberties) left, and it is removed from the board.",
  },
  {
    icon: "🚫",
    title: "Illegal Moves",
    description:
      "You cannot play self-capture (suicide) or immediately retake a single stone in a ko.",
  },
  {
    icon: "⏭️",
    title: "Pass",
    description:
      "Use File ▸ Pass when you have no useful move. Two passes in a row end the game.",
  },
  {
    icon: "🏆",
    title: "Scoring",
    description:
      "At the end, area scoring counts your stones plus the empty points only you surround. White gets 5.5 komi.",
  },
  {
    icon: "🔄",
    title: "New Game",
    description:
      "File ▸ New Game clears the board and starts over. You always move first as Black.",
  },
];
