import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import lessonsRouter from './routes/lessons.js';
import quizzesRouter from './routes/quizzes.js';
import progressRouter from './routes/progress.js';
import gamesRouter from './routes/games.js';
import { initialiseRepository, repositoryMode } from './services/repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5000);
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim());
const fifteenMinutes = 15 * 60 * 1000;
const apiLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ message: 'You are doing a lot at once. Please wait a little while and try again.' })
});
const authLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' })
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin(origin, callback) {
  if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
  callback(new Error('This origin is not permitted.'));
}, credentials: true }));
app.use(express.json({ limit: '300kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'SafeBuddy API', storage: repositoryMode() }));
app.use('/api/auth', authRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/games', gamesRouter);

app.use('/api', (req, res) => res.status(404).json({ message: 'This API route does not exist.' }));

const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (error) => error && next());
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
    return res.status(status).json({ message: 'Something went wrong. Please try again.' });
  }
  res.status(status).json({ message: error.message || 'Something went wrong. Please try again.' });
});

initialiseRepository().then(() => {
  app.listen(port, '0.0.0.0', () => console.log(`SafeBuddy API running on port ${port}`));
}).catch((error) => {
  console.error('Could not start SafeBuddy:', error);
  process.exit(1);
});
