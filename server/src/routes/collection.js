import { Router } from 'express';
import { attemptsForUser, findUserById } from '../services/repository.js';
import { BADGE_RULES } from '../services/rewards.js';
import { games } from '../services/games.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const levels = [
  { level: 1, title: 'Bright Beginner', icon: '🌱', minXp: 0, color: '#1D9E75', unlockMessage: 'Your learning journey starts here!' },
  { level: 2, title: 'Curious Explorer', icon: '🧭', minXp: 100, color: '#5B5CE2', unlockMessage: 'You are exploring your rights with confidence.' },
  { level: 3, title: 'Safety Star', icon: '⭐', minXp: 250, color: '#E6A535', unlockMessage: 'You are building a brilliant safety toolkit.' },
  { level: 4, title: 'Rights Champion', icon: '🏆', minXp: 500, color: '#D96B48', unlockMessage: 'You are a champion for children’s rights.' },
  { level: 5, title: 'Super Guide', icon: '🦸', minXp: 1000, color: '#7A55A3', unlockMessage: 'You have reached the top level. Keep learning!' }
];

const badgeDetails = {
  'first-step': 'Complete your first lesson.',
  'safety-scout': 'Pass the Personal Safety lesson quiz.',
  'sharp-thinker': 'Get every answer right in a quiz.',
  'rights-champion': 'Complete all available lessons.',
  'game-explorer': 'Complete your first safety game.',
  'game-master': 'Complete every safety game.'
};

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [user, attempts] = await Promise.all([
      findUserById(req.user.id),
      attemptsForUser(req.user.id)
    ]);
    if (!user) return res.status(404).json({ message: 'Learner not found.' });

    // Older profiles may not yet have had the badge awarded; derive the perfect-quiz
    // badge from their attempt history as a safe, read-only fallback.
    const earnedBadges = new Map((user.badges || []).map((badge) => [badge.key, badge]));
    if (attempts.some((attempt) => attempt.total > 0 && attempt.score === attempt.total) && !earnedBadges.has('sharp-thinker')) {
      earnedBadges.set('sharp-thinker', { key: 'sharp-thinker', earnedAt: null });
    }

    const xp = Math.max(0, Number(user.xp) || 0);
    const currentIndex = levels.reduce((index, item, candidateIndex) => xp >= item.minXp ? candidateIndex : index, 0);
    const current = levels[currentIndex];
    const next = levels[currentIndex + 1];
    const progress = next
      ? Math.max(0, Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)))
      : 100;

    res.json({
      level: {
        level: current.level,
        title: current.title,
        icon: current.icon,
        percent: progress,
        xpToNext: next ? Math.max(0, next.minXp - xp) : 0,
        nextLevelXp: next?.minXp || null
      },
      levelCards: levels.map((card) => ({ ...card, unlocked: xp >= card.minXp })),
      badges: BADGE_RULES.map((rule) => {
        const earned = earnedBadges.get(rule.key);
        return {
          key: rule.key,
          title: rule.title,
          icon: rule.icon,
          howToEarn: badgeDetails[rule.key],
          earned: Boolean(earned),
          earnedAt: earned?.earnedAt || null
        };
      }),
      gamesCount: games.length
    });
  } catch (error) { next(error); }
});

export default router;
