// Spoken safety clips (generated voice, stored in client/public/audio)
// and YouTube videos (embedded via YouTube's official player; nothing is downloaded).
// Video titles/channels were checked against YouTube's oEmbed endpoint.

export const safetyClips = {
  learn: { src: '/audio/safety-01-learn.mp3', title: 'Every child can learn' },
  body: { src: '/audio/safety-02-body.mp3', title: 'Your body belongs to you' },
  unsafe: { src: '/audio/safety-03-unsafe.mp3', title: 'If you feel unsafe' },
  online: { src: '/audio/safety-04-online.mp3', title: 'Staying safe online' },
  secrets: { src: '/audio/safety-05-secrets.mp3', title: 'Secrets that feel wrong' },
  stranger: { src: '/audio/safety-06-stranger.mp3', title: 'Strangers' },
  helpers: { src: '/audio/safety-07-helpers.mp3', title: 'Trusted helpers' },
  emergency: { src: '/audio/safety-08-emergency.mp3', title: 'Who to call for help' },
  fairness: { src: '/audio/safety-09-fairness.mp3', title: 'Fairness and fresh starts' },
  games: { src: '/audio/safety-10-games.mp3', title: 'Games: think before you act' },
};

export const lessonMedia = {
  'right-to-learn': {
    clips: [safetyClips.learn, safetyClips.emergency],
    videos: [
      { id: 'TafvHxXFzUM', title: 'Rights and responsibilities of children', channel: 'Smile and Learn' },
      { id: 'y_2nA49p3yw', title: 'The UN Convention on the Rights of the Child (animation)', channel: 'cradub' },
    ],
  },
  'personal-safety': {
    clips: [safetyClips.body, safetyClips.stranger, safetyClips.helpers],
    videos: [
      { id: 'xSTS9WahLMw', title: 'STOP! When touching isn’t safe!', channel: 'Fresberg Cartoon' },
      { id: 'Tg4z2aO48RE', title: 'Good touch, bad touch for kids', channel: 'Edukidzium' },
      { id: 'zNTUMNKSNwk', title: 'Protect Yourself Rules: safe touch / unsafe touch', channel: 'Fight Child Abuse' },
    ],
  },
  'safe-childhood': {
    clips: [safetyClips.online, safetyClips.secrets],
    videos: [
      { id: 'CqH2QYt6oOc', title: 'Safety tips for kids', channel: 'learning junction' },
      { id: 'r4BnCGAIj5E', title: 'Red flag secrets', channel: 'I Said No!' },
      { id: 'GmW1-60Wdfo', title: 'Learn to be safe: my body belongs to me', channel: 'Act for Kids' },
    ],
  },
  'care-and-justice': {
    clips: [safetyClips.fairness],
    videos: [
      { id: 'y_2nA49p3yw', title: 'The UN Convention on the Rights of the Child (animation)', channel: 'cradub' },
    ],
  },
};

export const gameMedia = {
  'safe-or-not': { clips: [safetyClips.unsafe] },
  'trusted-helper-match': { clips: [safetyClips.helpers] },
  'safe-path-maze': { clips: [safetyClips.games] },
};

// Shown below the Play page game cards.
export const playSoundVideos = [
  { id: 'LZE3LEl-Fj0', title: 'My body is MY body', channel: 'Educate2Empower Publishing' },
  { id: 'a-5mdt9YN6I', title: 'My Body Belongs To Me (animated short film)', channel: 'CultureOfSilenceFilm' },
];
