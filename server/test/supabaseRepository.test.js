// Integration tests for the Supabase (Postgres) storage backend.
//
// They are skipped unless TEST_SUPABASE_DB_URL points at a Postgres database, so
// `npm test` stays offline-friendly:
//
//   TEST_SUPABASE_DB_URL='postgresql://...' npm run test:db
//
// Use a dedicated Supabase project or database branch: the tests seed the starter content
// when the database is empty, and delete their own rows afterwards, but they do write to
// the same `public` schema the app uses. Session-level tricks such as search_path are
// deliberately avoided because Supabase's transaction pooler does not preserve them.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const url = process.env.TEST_SUPABASE_DB_URL;
const skipReason = url ? false : 'Set TEST_SUPABASE_DB_URL to run the Postgres integration tests.';

// Every row this run creates is tagged, so cleanup never touches real data.
const runTag = `test-${crypto.randomBytes(4).toString('hex')}`;
const email = (name) => `${runTag}-${name}@example.com`;
const isLocal = /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)[:/]/.test(url || '');
const connection = { connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } };
const starterLessonIds = ['right-to-learn', 'personal-safety', 'safe-childhood', 'care-and-justice'];

let repo;
let admin;

before(async () => {
  if (skipReason) return;
  repo = await import('../src/services/supabaseRepository.js');
  await repo.initialiseSupabase(url, { ...connection, max: 2 });
  admin = new pg.Client(connection);
  await admin.connect();
});

after(async () => {
  if (skipReason) return;
  await repo.closeSupabase();
  if (!admin) return;
  const users = await admin.query('SELECT id FROM users WHERE email LIKE $1', [`${runTag}-%`]);
  const userIds = users.rows.map((row) => row.id);
  const lessons = await admin.query('SELECT id FROM lessons WHERE title LIKE $1', [`${runTag} %`]);
  const lessonIds = lessons.rows.map((row) => row.id);
  if (userIds.length) {
    await admin.query('DELETE FROM attempts WHERE user_id = ANY($1::text[])', [userIds]);
    await admin.query('DELETE FROM users WHERE id = ANY($1::text[])', [userIds]);
  }
  if (lessonIds.length) {
    await admin.query('DELETE FROM quizzes WHERE lesson_id = ANY($1::text[])', [lessonIds]);
    await admin.query('DELETE FROM lessons WHERE id = ANY($1::text[])', [lessonIds]);
  }
  await admin.end();
});

test('the starter curriculum is present', { skip: skipReason }, async () => {
  const lessons = await repo.allLessons();
  const ids = lessons.map((lesson) => lesson.id);
  for (const id of starterLessonIds) assert.ok(ids.includes(id), `missing starter lesson ${id}`);
  const first = lessons.find((lesson) => lesson.id === 'right-to-learn');
  assert.equal(typeof first.order, 'number');
  assert.ok(first.sections.length >= 1);
  assert.equal(first.published, true);
});

test('creates users and rejects duplicate emails', { skip: skipReason }, async () => {
  const passwordHash = await bcrypt.hash('Learn@1234', 4);
  const mixedCase = `${runTag}-Case@Example.com`;
  const user = await repo.createUser({ name: 'Test Learner', email: mixedCase, passwordHash });
  assert.equal(user.email, mixedCase.toLowerCase());
  assert.equal(user.role, 'learner');
  assert.deepEqual(user.completedLessonIds, []);
  assert.deepEqual(user.badges, []);

  const found = await repo.findUserByEmail(mixedCase.toUpperCase());
  assert.equal(found.id, user.id);

  await assert.rejects(
    () => repo.createUser({ name: 'Duplicate', email: mixedCase, passwordHash }),
    (error) => error.status === 409
  );
});

test('updates arrays, JSON badges and timestamps without losing the rest of the profile', { skip: skipReason }, async () => {
  const created = await repo.createUser({ name: 'Array Test', email: email('arrays'), passwordHash: 'x' });
  const stamp = new Date('2026-10-09T06:30:00Z');
  const updated = await repo.updateUser(created.id, {
    completedLessonIds: ['right-to-learn', 'personal-safety'],
    badges: [{ key: 'first-step', title: 'First Step', icon: '🌟', earnedAt: stamp.toISOString() }],
    xp: 35,
    lastActiveAt: stamp.toISOString()
  });
  assert.deepEqual(updated.completedLessonIds, ['right-to-learn', 'personal-safety']);
  assert.equal(updated.badges[0].key, 'first-step');
  assert.equal(updated.xp, 35);
  assert.equal(updated.lastActiveAt, stamp.toISOString());
  assert.equal(updated.name, 'Array Test');

  const fetched = await repo.findUserById(created.id);
  assert.deepEqual(fetched.completedLessonIds, ['right-to-learn', 'personal-safety']);
});

test('game XP is awarded exactly once', { skip: skipReason }, async () => {
  const user = await repo.createUser({ name: 'Game Test', email: email('games'), passwordHash: 'x' });
  const first = await repo.claimGameCompletion({ userId: user.id, gameId: 'safe-or-not', xpReward: 25 });
  assert.equal(first.firstCompletion, true);
  assert.equal(first.user.xp, 25);
  assert.deepEqual(first.user.completedGameIds, ['safe-or-not']);

  const second = await repo.claimGameCompletion({ userId: user.id, gameId: 'safe-or-not', xpReward: 25 });
  assert.equal(second.firstCompletion, false);
  assert.equal(second.user.xp, 25);
});

test('quiz rewards follow the first-attempt and first-pass rules', { skip: skipReason }, async () => {
  const user = await repo.createUser({ name: 'Quiz Test', email: email('quizzes'), passwordHash: 'x' });
  const first = await repo.claimQuizRewards({
    userId: user.id, quizId: 'quiz-right-to-learn', lessonId: 'right-to-learn', quizXp: 30, passed: true
  });
  assert.equal(first.isFirstAttemptAtQuiz, true);
  assert.equal(first.isFirstPassForLesson, true);
  assert.equal(first.reward.total, 35);
  assert.equal(first.user.xp, 35);

  const repeat = await repo.claimQuizRewards({
    userId: user.id, quizId: 'quiz-right-to-learn', lessonId: 'right-to-learn', quizXp: 30, passed: true
  });
  assert.equal(repeat.reward.total, 0);
  assert.equal(repeat.user.xp, 35);
});

test('lessons can be published, listed and patched', { skip: skipReason }, async () => {
  const before = await repo.allLessons({ includeUnpublished: true });
  const highestOrder = Math.max(0, ...before.map((lesson) => lesson.order ?? 0));

  const created = await repo.createLesson({
    title: `${runTag} Integration Lesson`, summary: 'Created by tests', category: 'Safety', icon: '🧪',
    color: '#123456', minutes: 4, level: 'Starter', sections: [{ heading: 'A', body: 'B', tip: 'C' }]
  });
  assert.equal(created.order, highestOrder + 1);
  assert.equal(created.published, true);

  const patched = await repo.updateLesson(created.id, { summary: 'Patched summary', published: false });
  assert.equal(patched.summary, 'Patched summary');
  assert.equal(patched.published, false);

  const publishedOnly = await repo.allLessons();
  assert.equal(publishedOnly.some((lesson) => lesson.id === created.id), false);
  const everything = await repo.allLessons({ includeUnpublished: true });
  assert.equal(everything.some((lesson) => lesson.id === created.id), true);
  assert.ok(await repo.totalCounts().then((counts) => counts.lessons) >= 4);
});

test('quizzes can be created, appended to and read by lesson', { skip: skipReason }, async () => {
  const lesson = await repo.createLesson({
    title: `${runTag} Quiz Lesson`, summary: 's', category: 'Safety', icon: '🧪', color: '#123456',
    minutes: 4, level: 'Starter', sections: [{ heading: 'A', body: 'B' }]
  });
  const quiz = await repo.createQuiz({
    lessonId: lesson.id, title: 'Quiz Lesson Check', xpReward: 20,
    questions: [{ prompt: 'One?', options: ['a', 'b'], answerIndex: 0, explanation: 'a' }]
  });
  assert.equal(quiz.lessonId, lesson.id);
  assert.equal(quiz.questions.length, 1);

  const appended = await repo.addQuestionsToQuiz(quiz.id, [{ prompt: 'Two?', options: ['a', 'b'], answerIndex: 1, explanation: 'b' }]);
  assert.equal(appended.questions.length, 2);

  const byLesson = await repo.quizByLessonId(lesson.id);
  assert.equal(byLesson.id, quiz.id);
  assert.equal(byLesson.questions.length, 2);

  await assert.rejects(
    () => repo.createQuiz({ lessonId: 'missing-lesson', title: 'Nope', questions: [] }),
    (error) => error.status === 400
  );
});

test('attempts are stored with their JSON answers and listed newest first', { skip: skipReason }, async () => {
  const user = await repo.createUser({ name: 'Attempt Test', email: email('attempts'), passwordHash: 'x' });
  const first = await repo.saveAttempt({
    userId: user.id, quizId: 'quiz-right-to-learn', lessonId: 'right-to-learn', score: 100, total: 3, answers: [1, 1, 0]
  });
  assert.deepEqual(first.answers, [1, 1, 0]);
  assert.match(first.createdAt, /^\d{4}-\d{2}-\d{2}T/);

  await new Promise((resolve) => setTimeout(resolve, 15));
  await repo.saveAttempt({
    userId: user.id, quizId: 'quiz-personal-safety', lessonId: 'personal-safety', score: 67, total: 3, answers: [1, 0, 1]
  });

  const attempts = await repo.attemptsForUser(user.id);
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].quizId, 'quiz-personal-safety');
  assert.equal(attempts[0].score, 67);
});
