import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin(origin, callback) {
  if (!origin || configuredOrigins.includes(origin) || /^https:\/\/\d+-.*\.e2b\.app$/.test(origin)) return callback(null, true);
  callback(new Error('This origin is not permitted.'));
}, credentials: true }));
app.use(express.json({ limit: '300kb' }));
app.use(morgan('dev'));

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
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Something went wrong. Please try again.' });
});

initialiseRepository().then(() => {
  app.listen(port, '0.0.0.0', () => console.log(`SafeBuddy API running on port ${port}`));
}).catch((error) => {
  console.error('Could not start SafeBuddy:', error);
  process.exit(1);
});
