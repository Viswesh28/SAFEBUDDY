// Child-safety game catalogue. Game content (scenarios, maze layout) lives in the client;
// the server owns the XP values and validates completions.
export const games = [
  {
    id: 'safe-or-not',
    title: 'Safe or Not?',
    description: 'Read everyday situations and decide if they are safe, unsafe, or need a trusted adult.',
    icon: '🚦',
    color: '#1D9E75',
    minutes: 4,
    xpReward: 25
  },
  {
    id: 'trusted-helper-match',
    title: 'Trusted Helper Match',
    description: 'Match each worry to the right person or helpline who can help.',
    icon: '🤝',
    color: '#5B5CE2',
    minutes: 3,
    xpReward: 25
  },
  {
    id: 'safe-path-maze',
    title: 'Safe Path Maze',
    description: 'Guide your buddy home. Collect trusted helpers and avoid risky spots.',
    icon: '🧭',
    color: '#E6A535',
    minutes: 4,
    xpReward: 30
  }
];

export const findGame = (id) => games.find((game) => game.id === id) || null;
