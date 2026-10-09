import { Router } from 'express';
import { allLessons, attemptsForUser, findUserById, withoutPassword } from '../services/repository.js';
import { games } from '../services/games.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user, lessons, attempts] = await Promise.all([findUserById(req.user.id), allLessons(), attemptsForUser(req.user.id)]);
    // Best score per lesson, averaged across lessons the learner has attempted.
    const bestByLesson = attempts.reduce((out, attempt) => ({ ...out, [attempt.lessonId]: Math.max(out[attempt.lessonId] ?? 0, attempt.score) }), {});
    const bestScores = Object.values(bestByLesson);
    res.json({
      user: withoutPassword(user),
      stats: {
        completedLessons: user.completedLessonIds.length,
        totalLessons: lessons.length,
        averageScore: bestScores.length ? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length) : 0,
        quizzesTaken: attempts.length,
        gamesCompleted: user.completedGameIds.length,
        totalGames: games.length
      },
      attempts
    });
  } catch (error) { next(error); }
});

export default router;
