import { Router } from 'express';
import { allLessons, createLesson, lessonById, updateLesson } from '../services/repository.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const editableFields = {
  title: (value) => typeof value === 'string',
  summary: (value) => typeof value === 'string',
  category: (value) => typeof value === 'string',
  icon: (value) => typeof value === 'string',
  color: (value) => typeof value === 'string',
  minutes: (value) => typeof value === 'number' && Number.isFinite(value),
  level: (value) => typeof value === 'string',
  sections: Array.isArray,
  published: (value) => typeof value === 'boolean'
};

router.get('/', (req, res, next) => {
  if (req.query.all === 'true') return requireAuth(req, res, next);
  next();
}, (req, res, next) => {
  if (req.query.all === 'true') return requireAdmin(req, res, next);
  next();
}, async (req, res, next) => {
  try { res.json({ lessons: await allLessons({ includeUnpublished: req.query.all === 'true' }) }); }
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
    const updates = {};
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    for (const [field, value] of Object.entries(body)) {
      if (!(field in editableFields)) continue;
      if (!editableFields[field](value)) return res.status(400).json({ message: `Invalid ${field}.` });
      updates[field] = value;
    }
    const lesson = await updateLesson(req.params.id, updates);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
    res.json({ lesson });
  } catch (error) { next(error); }
});

export default router;
