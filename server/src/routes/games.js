import { Router } from 'express';
import { findUserById, totalCounts, updateUser } from '../services/repository.js';
import { awardBadges, gameReward, nextStreak } from '../services/rewards.js';
import { findGame, games } from '../services/games.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const isWholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

// Catalogue, with the signed-in learner's completion status.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    res.json({ games: games.map((game) => ({ ...game, completed: user.completedGameIds.includes(game.id) })) });
  } catch (error) { next(error); }
});

// Records a finished game. XP is awarded only on the first completion of each game.
router.post('/:gameId/complete', requireAuth, async (req, res, next) => {
  try {
    const game = findGame(req.params.gameId);
    if (!game) return res.status(404).json({ message: 'Game not found.' });
    const { score, total } = req.body;
    if (!isWholeNumber(total, 1, 50) || !isWholeNumber(score, 0, total)) {
      return res.status(400).json({ message: 'Score must be a whole number within the game total.' });
    }

    const now = new Date();
    const user = await findUserById(req.user.id);
    const isFirstCompletion = !user.completedGameIds.includes(game.id);
    const reward = gameReward({ gameXp: game.xpReward, isFirstCompletion });
    const completedGameIds = isFirstCompletion ? [...user.completedGameIds, game.id] : user.completedGameIds;
    const { lessons: totalLessons } = await totalCounts();
    const badges = awardBadges({ ...user, completedGameIds }, { totalLessons, totalGames: games.length, perfectQuiz: false }, now);
    const newBadges = badges.filter((badge) => !user.badges.some((existing) => existing.key === badge.key));

    const updatedUser = await updateUser(user.id, {
      completedGameIds,
      badges,
      xp: (user.xp || 0) + reward.total,
      streak: nextStreak(user, now),
      lastActiveAt: now.toISOString()
    });

    res.json({
      gameId: game.id,
      score,
      total,
      firstCompletion: isFirstCompletion,
      xpEarned: reward.total,
      xpBreakdown: { gameBonus: reward.gameBonus },
      newBadges,
      user: (({ passwordHash, ...safe }) => safe)(updatedUser)
    });
  } catch (error) { next(error); }
});

export default router;
