// XP, streak and badge rules for SafeBuddy.
// Kept as pure functions so they can be unit-tested (see server/test).

export const PARTICIPATION_XP = 5; // awarded once per quiz, on the first attempt
export const PASS_SCORE = 60;      // percentage needed to pass a lesson quiz

const DAY_ZONE = 'Asia/Kolkata';    // learners are in India; streaks follow IST days
const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DAY_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

// Streak: +1 for activity on the day after the last active day, unchanged for
// more activity the same day, and reset to 1 after any missed day.
export function nextStreak(user, now = new Date()) {
  if (!user.lastActiveAt) return 1;
  const today = dayKey(now);
  const last = dayKey(new Date(user.lastActiveAt));
  if (last === today) return Math.max(user.streak || 0, 1);
  if (last === dayKey(new Date(now.getTime() - DAY_MS))) return (user.streak || 0) + 1;
  return 1;
}

// A quiz gives participation XP on its first attempt, and the lesson bonus only
// the first time the learner passes that lesson. Repeats give nothing, so XP
// cannot be farmed by resubmitting.
export function quizReward({ quizXp, passed, isFirstAttemptAtQuiz, isFirstPassForLesson }) {
  const participation = isFirstAttemptAtQuiz ? PARTICIPATION_XP : 0;
  const lessonBonus = passed && isFirstPassForLesson ? quizXp : 0;
  return { participation, lessonBonus, total: participation + lessonBonus };
}

// A game gives its XP once, on the first completion.
export function gameReward({ gameXp, isFirstCompletion }) {
  const total = isFirstCompletion ? gameXp : 0;
  return { participation: 0, lessonBonus: 0, gameBonus: total, total };
}

export const BADGE_RULES = [
  { key: 'first-step', title: 'First Step', icon: '🌟', earned: (u) => u.completedLessonIds.length >= 1 },
  { key: 'safety-scout', title: 'Safety Scout', icon: '🛡️', earned: (u) => u.completedLessonIds.includes('personal-safety') },
  { key: 'sharp-thinker', title: 'Sharp Thinker', icon: '🧠', earned: (u, ctx) => Boolean(ctx.perfectQuiz) },
  { key: 'rights-champion', title: 'Rights Champion', icon: '🏆', earned: (u, ctx) => ctx.totalLessons > 0 && u.completedLessonIds.length >= ctx.totalLessons },
  { key: 'game-explorer', title: 'Game Explorer', icon: '🎮', earned: (u) => u.completedGameIds.length >= 1 },
  { key: 'game-master', title: 'Game Master', icon: '🎯', earned: (u, ctx) => ctx.totalGames > 0 && u.completedGameIds.length >= ctx.totalGames }
];

// Returns the full badge list with any newly earned badges added.
// `user.completedLessonIds` / `user.completedGameIds` must already reflect the current action.
export function awardBadges(user, ctx, now = new Date()) {
  const badges = [...(user.badges || [])];
  for (const rule of BADGE_RULES) {
    if (badges.some((badge) => badge.key === rule.key)) continue;
    if (rule.earned(user, ctx)) badges.push({ key: rule.key, title: rule.title, icon: rule.icon, earnedAt: now.toISOString() });
  }
  return badges;
}
