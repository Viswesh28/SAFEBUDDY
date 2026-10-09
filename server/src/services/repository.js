import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { DatabaseSync } from 'node:sqlite';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import { lessons, quizzes, starterUsers } from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');
const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(serverRoot, process.env.SQLITE_PATH)
  : path.resolve(serverRoot, 'data/safebuddy.sqlite');

let mode = 'sqlite';
let sqliteDb = null;

const makeId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();
const withoutPassword = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};
const mongoPlain = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  const { externalId, _id, __v, ...rest } = plain;
  return { id: externalId, ...rest };
};
const toMongo = ({ id, ...value }) => ({ externalId: id || makeId(), ...value });

/* ------------------------------------------------------------------ */
/* SQLite helpers                                                      */
/* ------------------------------------------------------------------ */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id                 TEXT PRIMARY KEY,
    name               TEXT NOT NULL,
    email              TEXT NOT NULL UNIQUE,
    passwordHash       TEXT NOT NULL,
    role               TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
    avatar             TEXT NOT NULL DEFAULT '🌟',
    xp                 INTEGER NOT NULL DEFAULT 0,
    streak             INTEGER NOT NULL DEFAULT 0,
    completedLessonIds TEXT NOT NULL DEFAULT '[]',
    completedGameIds   TEXT NOT NULL DEFAULT '[]',
    badges             TEXT NOT NULL DEFAULT '[]',
    lastActiveAt       TEXT,
    createdAt          TEXT NOT NULL,
    updatedAt          TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    summary     TEXT NOT NULL,
    category    TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT '📚',
    color       TEXT NOT NULL DEFAULT '#5B5CE2',
    minutes     INTEGER NOT NULL DEFAULT 5,
    level       TEXT NOT NULL DEFAULT 'Starter',
    sections    TEXT NOT NULL DEFAULT '[]',
    published   INTEGER NOT NULL DEFAULT 1,
    sortOrder   INTEGER NOT NULL DEFAULT 0,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id         TEXT PRIMARY KEY,
    lessonId   TEXT NOT NULL REFERENCES lessons(id),
    title      TEXT NOT NULL,
    xpReward   INTEGER NOT NULL DEFAULT 30,
    questions  TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lessonId);

  CREATE TABLE IF NOT EXISTS attempts (
    id         TEXT PRIMARY KEY,
    userId     TEXT NOT NULL REFERENCES users(id),
    quizId     TEXT NOT NULL REFERENCES quizzes(id),
    lessonId   TEXT NOT NULL,
    score      INTEGER NOT NULL,
    total      INTEGER NOT NULL,
    answers    TEXT NOT NULL DEFAULT '[]',
    createdAt  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(userId, createdAt);
`;

// Thin async wrappers over Node's built-in SQLite (node:sqlite). Keeps the same call shape the
// repository used with the sqlite3 package. Every call is synchronous underneath, so no
// native addon needs to be downloaded or compiled.
const run = async (sql, params = []) => sqliteDb.prepare(sql).run(...params);
const get = async (sql, params = []) => sqliteDb.prepare(sql).get(...params) ?? null;
const all = async (sql, params = []) => sqliteDb.prepare(sql).all(...params);
const exec = async (sql) => sqliteDb.exec(sql);

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

const userFromRow = (row) => row && ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.passwordHash,
  role: row.role,
  avatar: row.avatar,
  xp: row.xp,
  streak: row.streak,
  completedLessonIds: parseJson(row.completedLessonIds, []),
  completedGameIds: parseJson(row.completedGameIds, []),
  badges: parseJson(row.badges, []),
  lastActiveAt: row.lastActiveAt || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const lessonFromRow = (row) => row && ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  category: row.category,
  icon: row.icon,
  color: row.color,
  minutes: row.minutes,
  level: row.level,
  sections: parseJson(row.sections, []),
  published: Boolean(row.published),
  order: row.sortOrder
});

const quizFromRow = (row) => row && ({
  id: row.id,
  lessonId: row.lessonId,
  title: row.title,
  xpReward: row.xpReward,
  questions: parseJson(row.questions, [])
});

const attemptFromRow = (row) => row && ({
  id: row.id,
  userId: row.userId,
  quizId: row.quizId,
  lessonId: row.lessonId,
  score: row.score,
  total: row.total,
  answers: parseJson(row.answers, []),
  createdAt: row.createdAt
});

// Builds "col = ?" pairs from an updates object, using only whitelisted keys.
function buildUpdate(updates, columnMap) {
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (!(key in updates)) continue;
    const { column: name, encode = (value) => value } = column;
    sets.push(`${name} = ?`);
    params.push(encode(updates[key]));
  }
  return { sets, params };
}

const userColumns = {
  name: { column: 'name' },
  email: { column: 'email', encode: (value) => String(value).toLowerCase() },
  passwordHash: { column: 'passwordHash' },
  role: { column: 'role' },
  avatar: { column: 'avatar' },
  xp: { column: 'xp', encode: Number },
  streak: { column: 'streak', encode: Number },
  completedLessonIds: { column: 'completedLessonIds', encode: JSON.stringify },
  completedGameIds: { column: 'completedGameIds', encode: JSON.stringify },
  badges: { column: 'badges', encode: JSON.stringify },
  lastActiveAt: { column: 'lastActiveAt' }
};

const lessonColumns = {
  title: { column: 'title' },
  summary: { column: 'summary' },
  category: { column: 'category' },
  icon: { column: 'icon' },
  color: { column: 'color' },
  minutes: { column: 'minutes', encode: Number },
  level: { column: 'level' },
  sections: { column: 'sections', encode: JSON.stringify },
  published: { column: 'published', encode: (value) => (value ? 1 : 0) },
  order: { column: 'sortOrder', encode: Number }
};

async function seedSqliteIfEmpty() {
  const { count } = await get('SELECT COUNT(*) AS count FROM users');
  if (count > 0) return;

  const timestamp = nowIso();
  const userRows = [];
  for (const person of starterUsers) {
    const password = person.role === 'admin' ? 'Admin@123' : 'Learn@123';
    userRows.push({ ...person, passwordHash: await bcrypt.hash(password, 10) });
  }

  await run('BEGIN');
  try {
    for (const person of userRows) {
      await run(
        `INSERT INTO users (id, name, email, passwordHash, role, avatar, xp, streak,
           completedLessonIds, completedGameIds, badges, lastActiveAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          person.id, person.name, person.email.toLowerCase(), person.passwordHash,
          person.role, person.avatar || '🌟', person.xp || 0, person.streak || 0,
          JSON.stringify(person.completedLessonIds || []), '[]', JSON.stringify(person.badges || []),
          null, timestamp, timestamp
        ]
      );
    }
    for (const [index, lesson] of lessons.entries()) {
      await run(
        `INSERT INTO lessons (id, title, summary, category, icon, color, minutes, level,
           sections, published, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          lesson.id, lesson.title, lesson.summary, lesson.category, lesson.icon, lesson.color,
          lesson.minutes, lesson.level, JSON.stringify(lesson.sections), index + 1, timestamp, timestamp
        ]
      );
    }
    for (const quiz of quizzes) {
      await run(
        `INSERT INTO quizzes (id, lessonId, title, xpReward, questions) VALUES (?, ?, ?, ?, ?)`,
        [quiz.id, quiz.lessonId, quiz.title, quiz.xpReward || 30, JSON.stringify(quiz.questions)]
      );
    }
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK').catch(() => {});
    throw error;
  }
  console.log('Seeded SQLite database with SafeBuddy starter content and demo accounts.');
}

// Adds columns introduced after a database was first created.
async function migrateSqlite() {
  const columns = await all('PRAGMA table_info(users)');
  if (!columns.some((column) => column.name === 'completedGameIds')) {
    await run("ALTER TABLE users ADD COLUMN completedGameIds TEXT NOT NULL DEFAULT '[]'");
  }
}

async function openSqlite() {
  await fs.mkdir(path.dirname(sqlitePath), { recursive: true });
  sqliteDb = new DatabaseSync(sqlitePath);
  await run('PRAGMA foreign_keys = ON');
  await run('PRAGMA journal_mode = WAL');
  await exec(SCHEMA);
  await migrateSqlite();
  await seedSqliteIfEmpty();
}

/* ------------------------------------------------------------------ */
/* MongoDB seeding (unchanged behaviour)                               */
/* ------------------------------------------------------------------ */

async function seedMongoIfEmpty() {
  if (await Lesson.countDocuments()) return;
  const seededUsers = [];
  for (const person of starterUsers) {
    const password = person.role === 'admin' ? 'Admin@123' : 'Learn@123';
    seededUsers.push(toMongo({ ...person, passwordHash: await bcrypt.hash(password, 10) }));
  }
  await Promise.all([
    User.insertMany(seededUsers),
    Lesson.insertMany(lessons.map(toMongo)),
    Quiz.insertMany(quizzes.map(toMongo))
  ]);
  console.log('Seeded MongoDB with SafeBuddy demo content.');
}

/* ------------------------------------------------------------------ */
/* Public repository API                                               */
/* ------------------------------------------------------------------ */

export async function initialiseRepository() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
      mode = 'mongo';
      await seedMongoIfEmpty();
      console.log('Connected to MongoDB.');
      return mode;
    } catch (error) {
      console.warn(`MongoDB unavailable (${error.message}). Using SQLite instead.`);
    }
  }
  mode = 'sqlite';
  await openSqlite();
  console.log(`Using SQLite database at ${path.relative(serverRoot, sqlitePath)}. Set MONGO_URI to use MongoDB.`);
  return mode;
}

export const repositoryMode = () => mode;

export async function findUserByEmail(email) {
  if (mode === 'mongo') return mongoPlain(await User.findOne({ email: email.toLowerCase() }));
  return userFromRow(await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]));
}

export async function findUserById(id) {
  if (mode === 'mongo') return mongoPlain(await User.findOne({ externalId: id }));
  return userFromRow(await get('SELECT * FROM users WHERE id = ?', [id]));
}

export async function createUser({ name, email, passwordHash, avatar = '🌟', role = 'learner' }) {
  const user = {
    id: makeId(), name, email: email.toLowerCase(), passwordHash, avatar, role,
    xp: 0, streak: 0, completedLessonIds: [], completedGameIds: [], badges: [], lastActiveAt: null,
    createdAt: nowIso(), updatedAt: nowIso()
  };
  if (mode === 'mongo') return mongoPlain(await User.create(toMongo(user)));
  await run(
    `INSERT INTO users (id, name, email, passwordHash, role, avatar, xp, streak,
       completedLessonIds, completedGameIds, badges, lastActiveAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, '[]', '[]', '[]', NULL, ?, ?)`,
    [user.id, user.name, user.email, user.passwordHash, user.role, user.avatar, user.createdAt, user.updatedAt]
  );
  return user;
}

export async function updateUser(id, updates) {
  if (mode === 'mongo') return mongoPlain(await User.findOneAndUpdate({ externalId: id }, { $set: updates }, { new: true }));
  const { sets, params } = buildUpdate(updates, userColumns);
  if (sets.length) {
    await run(
      `UPDATE users SET ${sets.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...params, nowIso(), id]
    );
  }
  return findUserById(id);
}

export async function allLessons({ includeUnpublished = false } = {}) {
  if (mode === 'mongo') {
    const query = includeUnpublished ? {} : { published: true };
    return (await Lesson.find(query).sort({ order: 1 })).map(mongoPlain);
  }
  const rows = await all(
    `SELECT * FROM lessons ${includeUnpublished ? '' : 'WHERE published = 1'} ORDER BY sortOrder ASC, rowid ASC`
  );
  return rows.map(lessonFromRow);
}

export async function lessonById(id) {
  if (mode === 'mongo') return mongoPlain(await Lesson.findOne({ externalId: id }));
  return lessonFromRow(await get('SELECT * FROM lessons WHERE id = ?', [id]));
}

export async function createLesson(payload) {
  const { count } = await get('SELECT COUNT(*) AS count FROM lessons');
  const lesson = { id: makeId(), published: true, order: count + 1, ...payload };
  if (mode === 'mongo') return mongoPlain(await Lesson.create(toMongo(lesson)));
  const timestamp = nowIso();
  await run(
    `INSERT INTO lessons (id, title, summary, category, icon, color, minutes, level,
       sections, published, sortOrder, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lesson.id, lesson.title, lesson.summary, lesson.category, lesson.icon, lesson.color,
      lesson.minutes, lesson.level, JSON.stringify(lesson.sections), lesson.published ? 1 : 0,
      lesson.order, timestamp, timestamp
    ]
  );
  return lessonFromRow(await get('SELECT * FROM lessons WHERE id = ?', [lesson.id]));
}

export async function updateLesson(id, updates) {
  if (mode === 'mongo') return mongoPlain(await Lesson.findOneAndUpdate({ externalId: id }, { $set: updates }, { new: true }));
  const { sets, params } = buildUpdate(updates, lessonColumns);
  if (sets.length) {
    await run(
      `UPDATE lessons SET ${sets.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...params, nowIso(), id]
    );
  }
  return lessonById(id);
}

export async function quizByLessonId(lessonId) {
  if (mode === 'mongo') return mongoPlain(await Quiz.findOne({ lessonId }));
  return quizFromRow(await get('SELECT * FROM quizzes WHERE lessonId = ? LIMIT 1', [lessonId]));
}

export async function quizById(id) {
  if (mode === 'mongo') return mongoPlain(await Quiz.findOne({ externalId: id }));
  return quizFromRow(await get('SELECT * FROM quizzes WHERE id = ?', [id]));
}

export async function createQuiz(payload) {
  const quiz = { id: makeId(), xpReward: 30, ...payload };
  if (mode === 'mongo') return mongoPlain(await Quiz.create(toMongo(quiz)));
  if (!(await lessonById(quiz.lessonId))) {
    const error = new Error('The lesson for this quiz does not exist.');
    error.status = 400;
    throw error;
  }
  await run(
    `INSERT INTO quizzes (id, lessonId, title, xpReward, questions) VALUES (?, ?, ?, ?, ?)`,
    [quiz.id, quiz.lessonId, quiz.title, Number(quiz.xpReward) || 30, JSON.stringify(quiz.questions)]
  );
  return quizById(quiz.id);
}

// Appends questions to an existing lesson quiz. Returns the updated quiz.
export async function addQuestionsToQuiz(quizId, questions) {
  if (mode === 'mongo') return mongoPlain(await Quiz.findOneAndUpdate({ externalId: quizId }, { $push: { questions: { $each: questions } } }, { new: true }));
  const quiz = await quizById(quizId);
  if (!quiz) return null;
  await run('UPDATE quizzes SET questions = ? WHERE id = ?', [JSON.stringify([...quiz.questions, ...questions]), quizId]);
  return quizById(quizId);
}

export async function totalCounts() {
  if (mode === 'mongo') return { lessons: await Lesson.countDocuments({ published: true }) };
  const row = await get('SELECT COUNT(*) AS count FROM lessons WHERE published = 1');
  return { lessons: row.count };
}

export async function attemptsForUser(userId) {
  if (mode === 'mongo') return (await Attempt.find({ userId }).sort({ createdAt: -1 })).map((doc) => ({ id: doc._id.toString(), ...doc.toObject(), _id: undefined, __v: undefined }));
  const rows = await all('SELECT * FROM attempts WHERE userId = ? ORDER BY createdAt DESC, rowid DESC', [userId]);
  return rows.map(attemptFromRow);
}

export async function saveAttempt(attempt) {
  const record = { id: makeId(), ...attempt, createdAt: nowIso() };
  if (mode === 'mongo') {
    const created = await Attempt.create(record);
    return { id: created._id.toString(), ...created.toObject() };
  }
  await run(
    `INSERT INTO attempts (id, userId, quizId, lessonId, score, total, answers, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.userId, record.quizId, record.lessonId, record.score, record.total,
      JSON.stringify(record.answers || []), record.createdAt]
  );
  return attemptFromRow(await get('SELECT * FROM attempts WHERE id = ?', [record.id]));
}

export { withoutPassword };
