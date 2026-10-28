import SafeOrNot from './SafeOrNot';
import TrustedHelperMatch from './TrustedHelperMatch';
import SafePathMaze from './SafePathMaze';
import MythBuster from './MythBuster';
import RightsDetective from './RightsDetective';
import ChooseYourPath from './ChooseYourPath';
import RightsSorter from './RightsSorter';
import SpotTheRedFlag from './SpotTheRedFlag';
import EmergencyNumberSprint from './EmergencyNumberSprint';
import RightsMemoryMatch from './RightsMemoryMatch';

// Maps the game IDs from the server catalogue to their React components.
export const gameComponents = {
  'safe-or-not': SafeOrNot,
  'trusted-helper-match': TrustedHelperMatch,
  'safe-path-maze': SafePathMaze,
  'myth-buster': MythBuster,
  'rights-detective': RightsDetective,
  'choose-your-path': ChooseYourPath,
  'rights-sorter': RightsSorter,
  'spot-the-red-flag': SpotTheRedFlag,
  'emergency-number-sprint': EmergencyNumberSprint,
  'rights-memory-match': RightsMemoryMatch
};
