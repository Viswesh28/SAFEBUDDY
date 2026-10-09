import { test } from 'node:test';
import assert from 'node:assert/strict';
import { awardBadges, dayKey, gameReward, nextStreak, quizReward, PARTICIPATION_XP } from '../src/services/rewards.js';

const IST_NOON = (iso) => new Date(iso); // e.g. 2026-10-09T06:30:00Z = 12:00 IST

test('quiz: first attempt gives participation XP, first pass gives the lesson bonus', () => {
  const r = quizReward({ quizXp: 30, passed: true, isFirstAttemptAtQuiz: true, isFirstPassForLesson: true });
  assert.equal(r.total, PARTICIPATION_XP + 30);
});

test('quiz: repeating a passed lesson gives no XP (no farming)', () => {
  const r = quizReward({ quizXp: 30, passed: true, isFirstAttemptAtQuiz: false, isFirstPassForLesson: false });
  assert.equal(r.total, 0);
});

test('quiz: a failed first attempt still gives participation XP but no lesson bonus', () => {
  const r = quizReward({ quizXp: 30, passed: false, isFirstAttemptAtQuiz: true, isFirstPassForLesson: false });
  assert.equal(r.total, PARTICIPATION_XP);
});

test('game: XP only on the first completion', () => {
  assert.equal(gameReward({ gameXp: 25, isFirstCompletion: true }).total, 25);
  assert.equal(gameReward({ gameXp: 25, isFirstCompletion: false }).total, 0);
});

test('streak: first activity starts at 1, next day increments, same day holds, missed day resets', () => {
  const now = IST_NOON('2026-10-09T06:30:00Z');
  assert.equal(nextStreak({ streak: 0, lastActiveAt: null }, now), 1);
  assert.equal(nextStreak({ streak: 3, lastActiveAt: '2026-10-08T05:00:00Z' }, now), 4);
  assert.equal(nextStreak({ streak: 3, lastActiveAt: '2026-10-09T03:00:00Z' }, now), 3);
  assert.equal(nextStreak({ streak: 5, lastActiveAt: '2026-10-06T05:00:00Z' }, now), 1);
});

test('streak uses Indian calendar days, so late-night UTC activity counts for the right day', () => {
  // 2026-10-08 23:30 IST is 2026-10-08 18:00 UTC: still 8 Oct in India
  assert.equal(dayKey(new Date('2026-10-08T18:00:00Z')), '2026-10-08');
  // 2026-10-08 19:00 UTC is 9 Oct 00:30 IST
  assert.equal(dayKey(new Date('2026-10-08T19:00:00Z')), '2026-10-09');
});

test('badges: earned once, never duplicated, and game badges follow completions', () => {
  const now = new Date('2026-10-09T06:30:00Z');
  const user = { completedLessonIds: ['right-to-learn'], completedGameIds: ['safe-or-not'], badges: [] };
  const first = awardBadges(user, { totalLessons: 4, totalGames: 3, perfectQuiz: false }, now);
  const keys = first.map((b) => b.key);
  assert.ok(keys.includes('first-step'));
  assert.ok(keys.includes('game-explorer'));
  assert.ok(!keys.includes('game-master'));
  const again = awardBadges({ ...user, badges: first }, { totalLessons: 4, totalGames: 3, perfectQuiz: false }, now);
  assert.equal(again.length, first.length);
});

test('badges: Game Master needs every game; Rights Champion needs every lesson', () => {
  const user = { completedLessonIds: ['a', 'b'], completedGameIds: ['x', 'y', 'z'], badges: [] };
  const keys = awardBadges(user, { totalLessons: 2, totalGames: 3, perfectQuiz: false }).map((b) => b.key);
  assert.ok(keys.includes('game-master'));
  assert.ok(keys.includes('rights-champion'));
});
