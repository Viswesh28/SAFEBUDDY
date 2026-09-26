import { Router } from 'express';
import { allLessons, createLesson, lessonById, updateLesson } from '../services/repository.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try { res.json({ lessons: await allLessons({ includeUnpublished: req.query.all === 'true' && req.headers['x-admin-preview'] === 'true' }) }); }
  catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await lessonById(req.params.id);
    if (!lesson || lesson.published === false) return res.status(404).json({ message: 'Lesson not found.' });
    res.json({ lesson });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, summary, category, icon, color, minutes, level, sections } = req.body;
    if (!title || !summary || !category || !Array.isArray(sections) || !sections.length) return res.status(400).json({ message: 'Title, summary, category, and at least one section are required.' });
    const lesson = await createLesson({ title, summary, category, icon: icon || '📚', color: color || '#5B5CE2', minutes: Number(minutes) || 5, level: level || 'Starter', sections });
    res.status(201).json({ lesson });
  } catch (error) { next(error); }
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const lesson = await updateLesson(req.params.id, req.body);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
    res.json({ lesson });
  } catch (error) { next(error); }
});

export default router;
