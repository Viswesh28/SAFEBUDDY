// Supabase (PostgreSQL) storage backend.
//
// This module implements the same function contract as ./repository.js, but talks to
// Postgres over the `pg` driver instead of node:sqlite or Mongoose. The active backend is
// chosen in repository.js: MONGO_URI > SUPABASE_DB_URL > local SQLite.
//
// Conventions:
//   - Column names are snake_case, the API contract is camelCase (see the *FromRow mappers).
//   - IDs stay TEXT: the seed content uses slugs such as `right-to-learn`, and users get UUIDs.
//   - Array-ish learner fields are TEXT[], rich content is JSONB.
//   - One-time XP awards use a conditional UPDATE ... WHERE NOT (x = ANY(column)) so two
//     concurrent requests cannot both earn the reward.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { lessons, quizzes, starterUsers } from './seedData.js';
import { PARTICIPATION_XP, quizReward } from './rewards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../db/schema.sql');

const makeId = () => crypto.randomUUID();
const isoOrNull = (value) => {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
};

let pool = null;

/* ------------------------------------------------------------------ */
/* Connection                                                          */
/* ------------------------------------------------------------------ */

const isLocalHost = (url) => /@(localhost|127\.0\.0\.1|0\.0\.0\.0)[:/]/.test(url);

// Supabase requires TLS. The pooler (Supavisor/PgBouncer) is fronted by a certificate that is
// not in every host's CA bundle, so certificate verification is relaxed while the connection
// stays encrypted. Pass an explicit `ssl` option to override.
const sslFor = (connectionString) => (isLocalHost(connectionString) ? false : { rejectUnauthorized: false });

// Removes sslmode from the URL: otherwise pg-connection-string turns it into `ssl: true`,
// which re-enables strict verification and overrides the option below.
const withoutSslMode = (connectionString) => {
  try {
    const parsed = new URL(connectionString);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch {
    return connectionString.replace(/([?&])sslmode=[^&]*/gi, '').replace(/[?&]$/, '');
  }
};

export function createPool(connectionString, options = {}) {
  if (!connectionString || !/^postgres(ql)?:\/\//i.test(connectionString)) {
    throw new Error('SUPABASE_DB_URL must be a postgres:// or postgresql:// connection string.');
  }
  const { ssl, connectionString: _ignored, ...rest } = options;
  return new pg.Pool({
    connectionString: withoutSslMode(connectionString),
    ssl: ssl ?? sslFor(connectionString),
    max: Number(process.env.PG_POOL_MAX) || 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    ...rest
  });
}

const requirePool = () => {
  if (!pool) throw new Error('The Supabase repository is not initialised. Call initialiseSupabase() first.');
  return pool;
};

const query = (sql, params) => requirePool().query(sql, params);

// Translates driver errors into messages the API can return safely.
const wrapError = (error) => {
  if (error?.code === '23505') {
    const mapped = new Error('An account with that email already exists.');
    mapped.status = 409;
    return mapped;
  }
  if (error?.code === '23503') {
    const mapped = new Error('A referenced record does not exist.');
    mapped.status = 400;
    return mapped;
  }
  if (error?.code === '42P01') {
    const mapped = new Error('The Supabase schema has not been created yet. Run `npm run db:migrate`.');
    mapped.status = 503;
    return mapped;
  }
  return error;
};

const withErrors = async (work) => {
  try {
    return await work();
  } catch (error) {
    throw wrapError(error);
  }
};

/* ------------------------------------------------------------------ */
/* Row mappers (snake_case columns -> camelCase API contract)          */
/* ------------------------------------------------------------------ */

export const userFromRow = (row) => row && {
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  avatar: row.avatar,
  xp: Number(row.xp) || 0,
  streak: Number(row.streak) || 0,
  completedLessonIds: row.completed_lesson_ids ?? [],
  completedGameIds: row.completed_game_ids ?? [],
  attemptedQuizIds: row.attempted_quiz_ids ?? [],
  unlockedCardIds: row.unlocked_card_ids ?? [],
  badges: row.badges ?? [],
  lastActiveAt: isoOrNull(row.last_active_at),
  createdAt: isoOrNull(row.created_at),
  updatedAt: isoOrNull(row.updated_at)
};

export const lessonFromRow = (row) => row && {
  id: row.id,
  title: row.title,
  summary: row.summary,
  category: row.category,
  icon: row.icon,
  color: row.color,
  minutes: row.minutes,
  level: row.level,
  sections: row.sections ?? [],
  published: Boolean(row.published),
  order: row.sort_order,
  createdAt: isoOrNull(row.created_at),
  updatedAt: isoOrNull(row.updated_at)
};

export const quizFromRow = (row) => row && {
  id: row.id,
  lessonId: row.lesson_id,
  title: row.title,
  xpReward: row.xp_reward,
  questions: row.questions ?? []
};

export const attemptFromRow = (row) => row && {
  id: row.id,
  userId: row.user_id,
  quizId: row.quiz_id,
  lessonId: row.lesson_id,
  score: row.score,
  total: row.total,
  answers: row.answers ?? [],
  createdAt: isoOrNull(row.created_at)
};

/* ------------------------------------------------------------------ */
/* Write helpers                                                       */
/* ------------------------------------------------------------------ */

// camelCase API field -> [column, sql cast, encode]. Only these fields may be written.
const USER_COLUMNS = {
  name: ['name', '::text', String],
  email: ['email', '::text', (value) => String(value).toLowerCase()],
  passwordHash: ['password_hash', '::text', String],
  role: ['role', '::text', String],
  avatar: ['avatar', '::text', String],
  xp: ['xp', '::integer', Number],
  streak: ['streak', '::integer', Number],
  completedLessonIds: ['completed_lesson_ids', '::text[]', (value) => value ?? []],
  completedGameIds: ['completed_game_ids', '::text[]', (value) => value ?? []],
  attemptedQuizIds: ['attempted_quiz_ids', '::text[]', (value) => value ?? []],
  unlockedCardIds: ['unlocked_card_ids', '::text[]', (value) => value ?? []],
  badges: ['badges', '::jsonb', (value) => JSON.stringify(value ?? [])],
  lastActiveAt: ['last_active_at', '::timestamptz', (value) => value || null]
};

const LESSON_COLUMNS = {
  title: ['title', '::text', String],
  summary: ['summary', '::text', String],
  category: ['category', '::text', String],
  icon: ['icon', '::text', String],
  color: ['color', '::text', String],
  minutes: ['minutes', '::integer', Number],
  level: ['level', '::text', String],
  sections: ['sections', '::jsonb', (value) => JSON.stringify(value ?? [])],
  published: ['published', '::boolean', Boolean],
  order: ['sort_order', '::integer', Number]
};

// Builds "col = $n::type" pairs from an updates object, using only whitelisted keys.
function buildUpdate(updates, columnMap, startIndex = 1) {
  const sets = [];
  const params = [];
  for (const [key, [column, cast, encode]] of Object.entries(columnMap)) {
    if (!(key in updates)) continue;
    params.push(encode(updates[key]));
    sets.push(`${column} = $${startIndex + params.length - 1}${cast}`);
  }
  return { sets, params };
}

/* ------------------------------------------------------------------ */
/* Schema and seed                                                     */
/* ------------------------------------------------------------------ */

export async function applySchema(target = requirePool()) {
  const sql = await fs.readFile(schemaPath, 'utf8');
  await target.query(sql);
}

// Seeds the starter curriculum, and (outside production) the demo accounts.
// Safe to call on every boot: it returns early once lessons exist.
export async function seedIfEmpty() {
  const existing = await query('SELECT 1 FROM lessons LIMIT 1');
  if (existing.rowCount) return false;

  const demoUsers = [];
  if (process.env.NODE_ENV !== 'production') {
    for (const person of starterUsers) {
      const password = person.role === 'admin' ? 'Admin@123' : 'Learn@123';
      demoUsers.push({ ...person, passwordHash: await bcrypt.hash(password, 10) });
    }
  }

  const client = await requirePool().connect();
  try {
    await client.query('BEGIN');
    for (const [index, lesson] of lessons.entries()) {
      await client.query(
        `INSERT INTO lessons (id, title, summary, category, icon, color, minutes, level, sections, published, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, true, $10)
         ON CONFLICT (id) DO NOTHING`,
        [lesson.id, lesson.title, lesson.summary, lesson.category, lesson.icon, lesson.color,
          lesson.minutes, lesson.level, JSON.stringify(lesson.sections), index + 1]
      );
    }
    for (const quiz of quizzes) {
      await client.query(
        `INSERT INTO quizzes (id, lesson_id, title, xp_reward, questions)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [quiz.id, quiz.lessonId, quiz.title, quiz.xpReward || 30, JSON.stringify(quiz.questions)]
      );
    }
    for (const person of demoUsers) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, avatar, xp, streak)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 0)
         ON CONFLICT (email) DO NOTHING`,
        [person.id, person.name, person.email.toLowerCase(), person.passwordHash, person.role, person.avatar || '🌟']
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw wrapError(error);
  } finally {
    client.release();
  }
  console.log(`Seeded Supabase SafeBuddy content${demoUsers.length ? ' and demo accounts' : ''}.`);
  return true;
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

export async function initialiseSupabase(connectionString = process.env.SUPABASE_DB_URL, options = {}) {
  if (!connectionString) throw new Error('SUPABASE_DB_URL is not set.');
  pool = createPool(connectionString, options);
  try {
    await applySchema();
    await seedIfEmpty();
  } catch (error) {
    await pool.end().catch(() => {});
    pool = null;
    throw wrapError(error);
  }
  console.log('Connected to Supabase Postgres.');
  return 'supabase';
}

export async function closeSupabase() {
  if (!pool) return;
  const closing = pool;
  pool = null;
  await closing.end().catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export async function findUserByEmail(email) {
  return withErrors(async () => {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
    return userFromRow(rows[0]) ?? null;
  });
}

export async function findUserById(id) {
  return withErrors(async () => {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return userFromRow(rows[0]) ?? null;
  });
}

export async function createUser({ name, email, passwordHash, avatar = '🌟', role = 'learner' }) {
  return withErrors(async () => {
    const { rows } = await query(
      `INSERT INTO users (id, name, email, password_hash, role, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [makeId(), name, String(email).toLowerCase(), passwordHash, role, avatar]
    );
    return userFromRow(rows[0]);
  });
}

export async function updateUser(id, updates) {
  return withErrors(async () => {
    const { sets, params } = buildUpdate(updates ?? {}, USER_COLUMNS);
    if (!sets.length) return findUserById(id);
    params.push(id);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return userFromRow(rows[0]) ?? null;
  });
}

// One-time game XP. The WHERE clause makes the award atomic: a second request for the
// same game updates no rows, so it cannot earn the reward twice.
export async function claimGameCompletion({ userId, gameId, xpReward }) {
  return withErrors(async () => {
    const { rows } = await query(
      `UPDATE users
          SET xp = xp + $2, completed_game_ids = array_append(completed_game_ids, $3)
        WHERE id = $1 AND NOT ($3 = ANY(completed_game_ids))
        RETURNING *`,
      [userId, xpReward, gameId]
    );
    if (rows[0]) return { firstCompletion: true, user: userFromRow(rows[0]) };
    return { firstCompletion: false, user: await findUserById(userId) };
  });
}

// First-attempt participation XP and first-pass lesson bonus, claimed atomically.
export async function claimQuizRewards({ userId, quizId, lessonId, quizXp, passed }) {
  return withErrors(async () => {
    const client = await requirePool().connect();
    let isFirstAttemptAtQuiz = false;
    let isFirstPassForLesson = false;
    try {
      await client.query('BEGIN');
      const attempt = await client.query(
        `UPDATE users
            SET xp = xp + $2, attempted_quiz_ids = array_append(attempted_quiz_ids, $3)
          WHERE id = $1 AND NOT ($3 = ANY(attempted_quiz_ids))
          RETURNING id`,
        [userId, PARTICIPATION_XP, quizId]
      );
      isFirstAttemptAtQuiz = attempt.rowCount === 1;
      if (passed) {
        const pass = await client.query(
          `UPDATE users
              SET xp = xp + $2, completed_lesson_ids = array_append(completed_lesson_ids, $3)
            WHERE id = $1 AND NOT ($3 = ANY(completed_lesson_ids))
            RETURNING id`,
          [userId, quizXp, lessonId]
        );
        isFirstPassForLesson = pass.rowCount === 1;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    return {
      isFirstAttemptAtQuiz,
      isFirstPassForLesson,
      reward: quizReward({ quizXp, passed, isFirstAttemptAtQuiz, isFirstPassForLesson }),
      user: await findUserById(userId)
    };
  });
}

/* ------------------------------------------------------------------ */
/* Lessons                                                             */
/* ------------------------------------------------------------------ */

export async function allLessons({ includeUnpublished = false } = {}) {
  return withErrors(async () => {
    const { rows } = includeUnpublished
      ? await query('SELECT * FROM lessons ORDER BY sort_order ASC, created_at ASC')
      : await query('SELECT * FROM lessons WHERE published = true ORDER BY sort_order ASC, created_at ASC');
    return rows.map(lessonFromRow);
  });
}

export async function lessonById(id) {
  return withErrors(async () => {
    const { rows } = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    return lessonFromRow(rows[0]) ?? null;
  });
}

export async function createLesson(payload) {
  return withErrors(async () => {
    const lesson = { published: true, ...payload };
    // The sub-select keeps the new lesson at the end of the list without a second query.
    const { rows } = await query(
      `INSERT INTO lessons (id, title, summary, category, icon, color, minutes, level, sections, published, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10,
               (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM lessons))
       RETURNING *`,
      [makeId(), lesson.title, lesson.summary, lesson.category, lesson.icon ?? '📚', lesson.color ?? '#5B5CE2',
        lesson.minutes ?? 5, lesson.level ?? 'Starter', JSON.stringify(lesson.sections ?? []),
        Boolean(lesson.published)]
    );
    return lessonFromRow(rows[0]);
  });
}

export async function updateLesson(id, updates) {
  return withErrors(async () => {
    const { sets, params } = buildUpdate(updates ?? {}, LESSON_COLUMNS);
    if (!sets.length) return lessonById(id);
    params.push(id);
    const { rows } = await query(
      `UPDATE lessons SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return lessonFromRow(rows[0]) ?? null;
  });
}

/* ------------------------------------------------------------------ */
/* Quizzes                                                             */
/* ------------------------------------------------------------------ */

export async function quizByLessonId(lessonId) {
  return withErrors(async () => {
    const { rows } = await query(
      'SELECT * FROM quizzes WHERE lesson_id = $1 ORDER BY created_at ASC, id ASC LIMIT 1',
      [lessonId]
    );
    return quizFromRow(rows[0]) ?? null;
  });
}

export async function quizById(id) {
  return withErrors(async () => {
    const { rows } = await query('SELECT * FROM quizzes WHERE id = $1', [id]);
    return quizFromRow(rows[0]) ?? null;
  });
}

export async function createQuiz(payload) {
  return withErrors(async () => {
    const quiz = { xpReward: 30, ...payload };
    if (!(await lessonById(quiz.lessonId))) {
      const error = new Error('The lesson for this quiz does not exist.');
      error.status = 400;
      throw error;
    }
    const { rows } = await query(
      `INSERT INTO quizzes (id, lesson_id, title, xp_reward, questions)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [makeId(), quiz.lessonId, quiz.title, Number(quiz.xpReward) || 30, JSON.stringify(quiz.questions ?? [])]
    );
    return quizFromRow(rows[0]);
  });
}

// Appends questions to an existing lesson quiz. Returns null when the quiz is missing.
export async function addQuestionsToQuiz(quizId, questions) {
  return withErrors(async () => {
    const { rows } = await query(
      'UPDATE quizzes SET questions = questions || $2::jsonb WHERE id = $1 RETURNING *',
      [quizId, JSON.stringify(questions ?? [])]
    );
    return quizFromRow(rows[0]) ?? null;
  });
}

export async function totalCounts() {
  return withErrors(async () => {
    const { rows } = await query('SELECT COUNT(*)::int AS count FROM lessons WHERE published = true');
    return { lessons: rows[0]?.count ?? 0 };
  });
}

/* ------------------------------------------------------------------ */
/* Attempts                                                            */
/* ------------------------------------------------------------------ */

export async function attemptsForUser(userId) {
  return withErrors(async () => {
    const { rows } = await query(
      'SELECT * FROM attempts WHERE user_id = $1 ORDER BY created_at DESC, id DESC',
      [userId]
    );
    return rows.map(attemptFromRow);
  });
}

export async function saveAttempt(attempt) {
  return withErrors(async () => {
    const { rows } = await query(
      `INSERT INTO attempts (id, user_id, quiz_id, lesson_id, score, total, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING *`,
      [makeId(), attempt.userId, attempt.quizId, attempt.lessonId, attempt.score, attempt.total,
        JSON.stringify(attempt.answers ?? [])]
    );
    return attemptFromRow(rows[0]);
  });
}
