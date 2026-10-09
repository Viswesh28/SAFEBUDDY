import SafeOrNot from './SafeOrNot';
import TrustedHelperMatch from './TrustedHelperMatch';
import SafePathMaze from './SafePathMaze';

// Maps the game IDs from the server catalogue to their React components.
export const gameComponents = {
  'safe-or-not': SafeOrNot,
  'trusted-helper-match': TrustedHelperMatch,
  'safe-path-maze': SafePathMaze
};
