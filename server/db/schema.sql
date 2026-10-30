-- SafeBuddy schema for Supabase Postgres.
-- Mirrors the SQLite schema in server/src/services/repository.js so that the API contract
-- (field names, JSON shapes, id formats) is identical across every storage mode.
--
-- This file is idempotent: the server applies it on startup and `npm run db:migrate`
-- can run it again safely.

CREATE TABLE IF NOT EXISTS users (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
  avatar               TEXT NOT NULL DEFAULT '🌟',
  xp                   INTEGER NOT NULL DEFAULT 0,
  streak               INTEGER NOT NULL DEFAULT 0,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  completed_game_ids   TEXT[] NOT NULL DEFAULT '{}',
  attempted_quiz_ids   TEXT[] NOT NULL DEFAULT '{}',
  unlocked_card_ids    TEXT[] NOT NULL DEFAULT '{}',
  badges               JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_active_at       TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columns added after the first release of the SQLite database. Kept for parity so an
-- older Supabase project picks them up on the next boot.
ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_game_ids TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS attempted_quiz_ids TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_card_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS lessons (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT '',
  icon       TEXT NOT NULL DEFAULT '📚',
  color      TEXT NOT NULL DEFAULT '#5B5CE2',
  minutes    INTEGER NOT NULL DEFAULT 5,
  level      TEXT NOT NULL DEFAULT 'Starter',
  sections   JSONB NOT NULL DEFAULT '[]'::jsonb,
  published  BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons (published, sort_order);

CREATE TABLE IF NOT EXISTS quizzes (
  id         TEXT PRIMARY KEY,
  lesson_id  TEXT NOT NULL REFERENCES lessons(id),
  title      TEXT NOT NULL DEFAULT '',
  xp_reward  INTEGER NOT NULL DEFAULT 30,
  questions  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes (lesson_id);

CREATE TABLE IF NOT EXISTS attempts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  quiz_id    TEXT NOT NULL REFERENCES quizzes(id),
  lesson_id  TEXT NOT NULL,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  answers    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user_id, created_at DESC);

-- Keeps updated_at accurate even for writes that do not set it explicitly.
CREATE OR REPLACE FUNCTION safebuddy_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION safebuddy_set_updated_at();

DROP TRIGGER IF EXISTS lessons_set_updated_at ON lessons;
CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION safebuddy_set_updated_at();

DROP TRIGGER IF EXISTS quizzes_set_updated_at ON quizzes;
CREATE TRIGGER quizzes_set_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION safebuddy_set_updated_at();

-- The API talks to Postgres with the project's own connection string; the browser never
-- does. RLS is enabled with no policies, which denies the anon/authenticated Supabase API
-- roles by default while leaving the server connection (the table owner) unaffected.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
