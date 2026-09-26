import { Router } from 'express';
import { createQuiz, quizById, quizByLessonId, saveAttempt, updateUser, findUserById } from '../services/repository.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const publicQuiz = (quiz) => quiz && ({ ...quiz, questions: quiz.questions.map(({ answerIndex, explanation, ...question }) => question) });

router.get('/lesson/:lessonId', requireAuth, async (req, res, next) => {
  try {
    const quiz = await quizByLessonId(req.params.lessonId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found for this lesson.' });
    res.json({ quiz: publicQuiz(quiz) });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { lessonId, title, xpReward, questions } = req.body;
    if (!lessonId || !title || !Array.isArray(questions) || !questions.length) return res.status(400).json({ message: 'Lesson, title, and questions are required.' });
    if (questions.some((q) => !q.prompt || !Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(q.answerIndex))) return res.status(400).json({ message: 'Each question needs text, two or more options, and an answer.' });
    res.status(201).json({ quiz: await createQuiz({ lessonId, title, xpReward: Number(xpReward) || 30, questions }) });
  } catch (error) { next(error); }
});

router.post('/:quizId/submit', requireAuth, async (req, res, next) => {
  try {
    const quiz = await quizById(req.params.quizId);
    const answers = req.body.answers;
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) return res.status(400).json({ message: 'Please answer every question.' });
    const correct = quiz.questions.reduce((total, question, index) => total + (Number(answers[index]) === question.answerIndex ? 1 : 0), 0);
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= 60;
    const user = await findUserById(req.user.id);
    const completedLessonIds = passed && !user.completedLessonIds.includes(quiz.lessonId) ? [...user.completedLessonIds, quiz.lessonId] : user.completedLessonIds;
    const badges = [...(user.badges || [])];
    const grant = (key, title, icon) => { if (!badges.some((badge) => badge.key === key)) badges.push({ key, title, icon, earnedAt: new Date().toISOString() }); };
    if (completedLessonIds.length >= 1) grant('first-step', 'First Step', '🌟');
    if (completedLessonIds.includes('personal-safety')) grant('safety-scout', 'Safety Scout', '🛡️');
    if (score === 100) grant('sharp-thinker', 'Sharp Thinker', '🧠');
    if (completedLessonIds.length >= 4) grant('rights-champion', 'Rights Champion', '🏆');
    const now = new Date();
    const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const differentDay = !last || last.toDateString() !== now.toDateString();
    const reward = passed ? quiz.xpReward : 5;
    const updatedUser = await updateUser(user.id, { completedLessonIds, badges, xp: (user.xp || 0) + reward, streak: differentDay ? (user.streak || 0) + 1 : user.streak || 1, lastActiveAt: now.toISOString() });
    await saveAttempt({ userId: user.id, quizId: quiz.id, lessonId: quiz.lessonId, score, total: quiz.questions.length, answers: answers.map(Number) });
    res.json({ score, correct, total: quiz.questions.length, passed, xpEarned: reward, user: (({ passwordHash, ...safe }) => safe)(updatedUser), feedback: quiz.questions.map((question, index) => ({ correct: Number(answers[index]) === question.answerIndex, correctIndex: question.answerIndex, explanation: question.explanation })) });
  } catch (error) { next(error); }
});

export default router;
