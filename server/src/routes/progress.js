import { Router } from 'express';
import { allLessons, attemptsForUser, findUserById, leaderboard, withoutPassword } from '../services/repository.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user, lessons, attempts] = await Promise.all([findUserById(req.user.id), allLessons(), attemptsForUser(req.user.id)]);
    const highestScores = Object.values(attempts.reduce((out, attempt) => ({ ...out, [attempt.lessonId]: Math.max(out[attempt.lessonId] || 0, attempt.score) }), {}));
    res.json({ user: withoutPassword(user), stats: { completedLessons: user.completedLessonIds.length, totalLessons: lessons.length, averageScore: highestScores.length ? Math.round(highestScores.reduce((a, b) => a + b, 0) / highestScores.length) : 0, quizzesTaken: attempts.length }, attempts });
  } catch (error) { next(error); }
});

router.get('/leaderboard', requireAuth, async (req, res, next) => {
  try { res.json({ learners: await leaderboard() }); }
  catch (error) { next(error); }
});

export default router;
