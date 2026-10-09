import { Router } from 'express';
import {
  addQuestionsToQuiz, allLessons, attemptsForUser, createQuiz, findUserById, quizById,
  quizByLessonId, saveAttempt, updateUser
} from '../services/repository.js';
import { awardBadges, nextStreak, PASS_SCORE, quizReward } from '../services/rewards.js';
import { games } from '../services/games.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const publicQuiz = (quiz) => quiz && ({ ...quiz, questions: quiz.questions.map(({ answerIndex, explanation, ...question }) => question) });

// Validates one question from an admin request. Returns a clean question or throws a 400.
function cleanQuestion(question) {
  const options = Array.isArray(question?.options) ? question.options.map((option) => String(option ?? '').trim()) : [];
  const prompt = String(question?.prompt ?? '').trim();
  const answerIndex = Number(question?.answerIndex);
  if (!prompt || options.length < 2 || options.length > 6 || options.some((option) => !option)) {
    throw Object.assign(new Error('Each question needs text, two to six filled-in options, and a correct answer.'), { status: 400 });
  }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
    throw Object.assign(new Error('The correct answer must be one of the options.'), { status: 400 });
  }
  return { prompt, options, answerIndex, explanation: String(question?.explanation ?? '').trim() };
}

router.get('/lesson/:lessonId', requireAuth, async (req, res, next) => {
  try {
    const quiz = await quizByLessonId(req.params.lessonId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found for this lesson.' });
    res.json({ quiz: publicQuiz(quiz) });
  } catch (error) { next(error); }
});

// Admin: publish a question. If the lesson already has a quiz, the question is added to it.
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { lessonId, title, xpReward, questions } = req.body;
    if (!lessonId || !title || !Array.isArray(questions) || !questions.length) return res.status(400).json({ message: 'Lesson, title, and questions are required.' });
    const cleaned = questions.map(cleanQuestion);
    const existing = await quizByLessonId(lessonId);
    if (existing) {
      const quiz = await addQuestionsToQuiz(existing.id, cleaned);
      return res.status(200).json({ quiz, added: cleaned.length });
    }
    const quiz = await createQuiz({ lessonId, title: String(title).trim(), xpReward: Math.min(Math.max(Number(xpReward) || 30, 5), 100), questions: cleaned });
    res.status(201).json({ quiz, added: cleaned.length });
  } catch (error) { next(error); }
});

router.post('/:quizId/submit', requireAuth, async (req, res, next) => {
  try {
    const quiz = await quizById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    const answers = req.body.answers;
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) return res.status(400).json({ message: 'Please answer every question.' });
    const valid = answers.every((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < quiz.questions[index].options.length);
    if (!valid) return res.status(400).json({ message: 'Please choose one of the answers for each question.' });

    const correct = quiz.questions.reduce((total, question, index) => total + (answers[index] === question.answerIndex ? 1 : 0), 0);
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= PASS_SCORE;
    const now = new Date();

    const user = await findUserById(req.user.id);
    const attempts = await attemptsForUser(user.id);
    const isFirstAttemptAtQuiz = !attempts.some((attempt) => attempt.quizId === quiz.id);
    const isFirstPassForLesson = passed && !user.completedLessonIds.includes(quiz.lessonId);
    const reward = quizReward({ quizXp: quiz.xpReward, passed, isFirstAttemptAtQuiz, isFirstPassForLesson });

    const completedLessonIds = isFirstPassForLesson ? [...user.completedLessonIds, quiz.lessonId] : user.completedLessonIds;
    const lessons = await allLessons();
    const badges = awardBadges({ ...user, completedLessonIds }, { totalLessons: lessons.length, totalGames: games.length, perfectQuiz: score === 100 }, now);
    const newBadges = badges.filter((badge) => !user.badges.some((existing) => existing.key === badge.key));

    const updatedUser = await updateUser(user.id, {
      completedLessonIds,
      badges,
      xp: (user.xp || 0) + reward.total,
      streak: nextStreak(user, now),
      lastActiveAt: now.toISOString()
    });
    await saveAttempt({ userId: user.id, quizId: quiz.id, lessonId: quiz.lessonId, score, total: quiz.questions.length, answers });

    res.json({
      score,
      correct,
      total: quiz.questions.length,
      passed,
      xpEarned: reward.total,
      xpBreakdown: { participation: reward.participation, lessonBonus: reward.lessonBonus },
      newBadges,
      user: (({ passwordHash, ...safe }) => safe)(updatedUser),
      feedback: quiz.questions.map((question, index) => ({ correct: answers[index] === question.answerIndex, correctIndex: question.answerIndex, explanation: question.explanation }))
    });
  } catch (error) { next(error); }
});

export default router;
