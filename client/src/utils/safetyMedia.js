// Spoken safety clips (generated voice, stored in client/public/audio)
// and YouTube videos (embedded via YouTube's official player; nothing is downloaded).
// All content is India-specific: Indian laws, Indian helplines, and Indian channels/makers.
// Video IDs were checked against YouTube's oEmbed endpoint.

export const safetyClips = {
  learn: { src: '/audio/safety-01-learn.mp3', title: 'Every child can learn (India’s RTE Act)' },
  body: { src: '/audio/safety-02-body.mp3', title: 'Your body belongs to you (POCSO Act)' },
  unsafe: { src: '/audio/safety-03-unsafe.mp3', title: 'If you feel unsafe' },
  online: { src: '/audio/safety-04-online.mp3', title: 'Staying safe online (cybercrime 1930)' },
  secrets: { src: '/audio/safety-05-secrets.mp3', title: 'Secrets that feel wrong' },
  stranger: { src: '/audio/safety-06-stranger.mp3', title: 'Strangers' },
  helpers: { src: '/audio/safety-07-helpers.mp3', title: 'Trusted helpers' },
  emergency: { src: '/audio/safety-08-emergency.mp3', title: 'Who to call for help in India' },
  fairness: { src: '/audio/safety-09-fairness.mp3', title: 'Fairness and fresh starts (Juvenile Justice Act)' },
  games: { src: '/audio/safety-10-games.mp3', title: 'Games: think before you act' },
};

export const lessonMedia = {
  'right-to-learn': {
    clips: [safetyClips.learn, safetyClips.emergency],
    videos: [
      { id: 'M9HocXB_T0k', title: 'Right to Education Act (RTE), 2009 — explained', channel: "Let's LEARN" },
      { id: '8NQvL8oDIEA', title: 'The Right of Children to Free & Compulsory Education Act', channel: 'UNICEF India' },
    ],
  },
  'personal-safety': {
    clips: [safetyClips.body, safetyClips.stranger, safetyClips.helpers],
    videos: [
      { id: '3WyHuHspbjk', title: 'KOMAL — a film on safe and unsafe touch (English)', channel: 'CBSE Channel (Ministry of Women & Child Development film)' },
      { id: 'eilEBbOAAcc', title: 'Good touch and bad touch — safety for kids', channel: 'Buddhu Baksa (with 94.3 MY FM RJ Viny)' },
      { id: '3G2Vdb6W0-E', title: 'CHILDLINE 1098 — new procedure for parents (Tamil)', channel: 'Common Man' },
    ],
  },
  'safe-childhood': {
    clips: [safetyClips.online, safetyClips.secrets],
    videos: [
      { id: 'KAnKujVDjf4', title: '1930 — short film on cybercrime awareness', channel: 'Vanitaa Pande' },
      { id: '--C0JJwXIyg', title: 'POCSO Act explained: the child safety law every Indian must know', channel: 'Misfit Humans' },
    ],
  },
  'care-and-justice': {
    clips: [safetyClips.fairness],
    videos: [
      { id: '3G2Vdb6W0-E', title: 'CHILDLINE 1098 — new procedure for parents (Tamil)', channel: 'Common Man' },
      { id: '--C0JJwXIyg', title: 'POCSO Act explained: the child safety law every Indian must know', channel: 'Misfit Humans' },
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
  { id: '3WyHuHspbjk', title: 'KOMAL — a film on safe and unsafe touch (English)', channel: 'CBSE Channel (Ministry of Women & Child Development film)' },
  { id: 'eilEBbOAAcc', title: 'Good touch and bad touch — safety for kids', channel: 'Buddhu Baksa (with 94.3 MY FM RJ Viny)' },
];
