import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserById, withoutPassword } from '../services/repository.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'safebuddy-development-secret', { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Use a password with at least 8 characters.' });
    if (await findUserByEmail(email)) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await createUser({ name: name.trim(), email: email.trim(), passwordHash: await bcrypt.hash(password, 10), avatar: avatar || '🌟' });
    res.status(201).json({ token: signToken(user), user: withoutPassword(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email || '');
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Email or password is not correct.' });
    res.json({ token: signToken(user), user: withoutPassword(user) });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    res.json({ user: withoutPassword(user) });
  } catch (error) { next(error); }
});

export default router;
