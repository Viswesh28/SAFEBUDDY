# Deploying SafeBuddy with Supabase as the database

**Status:** ✅ **Option A implemented** (see [Verification](#12-verification-of-the-implementation) at the
end). This document is kept as the design record: it explains the options, what was ruled out, and why
the Supabase Postgres adapter was the right shape for this codebase.

---

## 1. Short answer

**Yes — it works, and it is the right move if you deploy anywhere serverless.** But Supabase replaces only
the *database* layer of this app. It does **not** host the Express server, so you still need a Node host
(Render, Railway, Fly.io, Vercel as a serverless function, etc.).

The codebase is unusually well prepared for this: every route already talks to a single repository module
`server/src/services/repository.js` that has two backends (MongoDB and SQLite). Supabase is a **third
backend** behind the same 20 backend functions — the routes, the JWT auth, the reward rules and the React client
do not need to change.

| Question | Answer |
| --- | --- |
| Can Supabase be the DB? | Yes — it is plain PostgreSQL, so the existing relational SQLite design maps over almost 1:1 |
| Do we have to stop using MongoDB? | No. `MONGO_URI` can remain as the alternative mode |
| Does Supabase host the Express API? | No. Edge Functions are Deno; you still need Render / Railway / Fly / Vercel |
| Can we keep the current JWT + bcrypt auth? | Yes. Recommended for the MVP (see Option A) |
| Effort for the recommended path | ~1–2 focused days for the adapter + schema, ~1 more for deploy and smoke-testing |
| Cost | ₹0 on free tiers (Supabase free + Render free), with caveats in §8 |

---

## 2. What the app looks like today

Verified from the repository, not from the README:

- **Server:** Express 4 + ESM, entry `server/src/index.js`. It also serves the built client
  (`client/dist`) with an SPA fallback, so one Node process can host the whole product.
- **Auth:** custom JWT (`jsonwebtoken`, 7-day expiry) + `bcryptjs` hashes. Token is kept in
  `localStorage` by `client/src/contexts/AuthContext.jsx`; the API client uses relative `/api` calls.
- **Storage:** `initialiseRepository()` picks MongoDB when `MONGO_URI` is set, otherwise **Node's built-in
  `node:sqlite`** (`DatabaseSync`) writing `server/data/safebuddy.sqlite`.
- **Data model:** `users`, `lessons`, `quizzes`, `attempts`. Array-ish fields
  (`completedLessonIds`, `completedGameIds`, `attemptedQuizIds`, `unlockedCardIds`, `badges`) are stored
  as JSON text in SQLite and as arrays/subdocuments in Mongo. `sections` and `questions` are JSON blobs.
- **Business logic that must stay correct:** `claimGameCompletion()` and `claimQuizRewards()` award XP
  exactly once. SQLite does this with a serialized `BEGIN IMMEDIATE` queue; Mongo with a conditional
  `findOneAndUpdate`. Any new backend has to preserve that guarantee under concurrent requests.
- **Seeding:** `server/src/services/seedData.js` holds 4 lessons, their quizzes and 2 demo users.
  Demo users are only seeded when `NODE_ENV !== 'production'`.
- **Deployment config present:** none. No `Dockerfile`, `vercel.json`, `render.yaml`, or CI workflow.
  That is the missing piece, independent of Supabase.

---

## 3. Why the current SQLite default is a problem when deployed

| Host | SQLite behaviour |
| --- | --- |
| Local dev / college demo on one machine | Perfect, that is what it was designed for |
| Render / Railway / Fly **with a persistent disk**, 1 instance | Works, but no backups and no horizontal scaling |
| Render / Railway **without a disk** (default) | Database is wiped on every redeploy or restart |
| Vercel / Netlify / AWS Lambda | Unusable — read-only filesystem except `/tmp`, and each invocation is a fresh container |
| Any multi-instance setup | Unsafe — two SQLite files mean two divergent scoreboards |

**Conclusion:** Supabase is not strictly required for a single-instance host with a disk, but it is what
makes the app deployable anywhere, survivable across redeploys, and ready for more than one instance.
It also removes the Node 22.13+ constraint that only exists because of `node:sqlite`.

---

## 4. Three ways to bring Supabase in

### Option A — Supabase **Postgres** via a repository adapter *(recommended)*

Supabase exposes a normal Postgres connection string. Add `postgres` (or `pg`) to the server, write
`server/src/services/supabaseRepository.js` with the same exported function names as `repository.js`,
and extend `initialiseRepository()` to choose it when `SUPABASE_DB_URL` / `DATABASE_URL` is set.

- **Keeps:** JWT auth, bcrypt, reward rules, all routes, the whole React client, the tests.
- **Adds:** `pg`/`postgres.js`, one schema SQL file, one seed script, env vars.
- **Touches:** ~700 lines of new code, ~30 lines of wiring in `repository.js`. Zero route changes.
- **You can still run SQLite or Mongo locally** — this becomes a third mode, exactly like the existing two.

### Option B — Supabase **JS SDK** (`@supabase/supabase-js`, PostgREST) from the server

Same idea, but the adapter speaks HTTP to PostgREST using the **service-role key** instead of SQL.

- **Pros:** no connection-pool management, no pooler-port confusion, no Postgres driver in `node_modules`.
- **Cons:** the one-time-XP writes still need an RPC function, so you end up writing SQL anyway; bulk
  filtering/joins are clunkier; a `service_role` key that bypasses RLS must be handled very carefully.
- **Verdict:** fine alternative, not clearly better. Pick it only if you specifically want the SDK.

### Option C — Full Supabase platform (Auth + RLS + browser client)

Replace bcrypt/JWT with Supabase Auth, query tables from the React app, enforce access with RLS, and
move XP logic into Postgres functions or Edge Functions.

- **Big rewrite:** auth routes, `requireAuth` middleware, `AuthContext`, protected routes, admin role
  claims, plus a `profiles` table keyed to `auth.users`.
- **Real risk:** RLS controls *who can read/write*, not *how much XP a quiz is worth*. If the browser can
  write `users.xp`, a curious 12-year-old will find it. All gamification must move server-side first.
- **Effort:** ~1–2 weeks and a lot of regression testing.
- **When to do it:** post-MVP, because Supabase Auth also gives password reset, email verification and
  MFA — features this app currently lacks entirely.

> **Recommendation: Option A now (≈2 days), Option C only if/when this becomes a real product.**

---

## 5. Change surface for Option A (concrete, not implemented)

**Files**

| File | Change |
| --- | --- |
| `server/src/services/repository.js` | Mode selection: `mongo` → `supabase` → `sqlite` fallback |
| `server/src/services/supabaseRepository.js` *(new)* | The 20 backend functions, implemented in SQL |
| `server/db/schema.sql` *(new)* | `CREATE TABLE IF NOT EXISTS` + indexes, mirrors the SQLite `SCHEMA` string |
| `server/db/seed.js` *(new)* | Idempotent `INSERT … ON CONFLICT DO NOTHING` for lessons/quizzes/demo users |
| `server/package.json` | Add `pg` (or `postgres`), a `seed` script |
| `server/.env.example` | Document `SUPABASE_DB_URL` |
| `docs/ARCHITECTURE.md`, `README.md` | Third storage mode in the diagram and tables |

**Schema mapping**

| SQLite today | Supabase Postgres |
| --- | --- |
| `id TEXT PRIMARY KEY` (slugs like `right-to-learn`, UUIDs for users) | `id TEXT PRIMARY KEY` — keep, do **not** convert to `uuid` or the seed IDs break |
| `completedLessonIds TEXT` JSON array | `TEXT[]` or `JSONB` (`JSONB` is a smaller diff) |
| `sections`, `questions`, `answers` JSON | `JSONB` |
| `published INTEGER 0/1` | `BOOLEAN` |
| `createdAt TEXT` ISO | `TIMESTAMPTZ` (map back with `.toISOString()` — the client expects strings) |
| `PRAGMA foreign_keys` | Real `REFERENCES` constraints, enforced by default |
| `sortOrder` column | Same; note the repository field is called `order` |

**Atomic reward writes** — the important part:

```sql
-- one statement, no race: XP is granted only if the game was not already completed
UPDATE users
   SET xp = xp + $1,
       completed_game_ids = array_append(completed_game_ids, $2),
       updated_at = now()
 WHERE id = $3
   AND NOT ($2 = ANY(completed_game_ids))
RETURNING *;
```

For `claimQuizRewards`, either a single CTE-based statement or a `BEGIN … COMMIT` transaction
(transaction-mode pooling supports transactions; it is *session* state it does not keep). Keep the
`withSqliteWriteTransaction` equivalent or drop it in favour of the conditional update.

**Connection string**

- Use the **shared pooler**: transaction mode `:6543` for runtime, session mode `:5432` for
  migrations/seeding. The direct `db.<ref>.supabase.co:5432` host is IPv6-only on new projects and
  fails on hosts without IPv6.
- Transaction mode does not support prepared statements / `SET`: use `pg` without named prepared
  statements, or `postgres.js` with `prepare: false`.
- Keep one small pool per instance (2–5 connections) and one connection per serverless function.

---

## 6. Deployment topologies

### Recommended: one web service + Supabase

```
Browser ──HTTPS──▶ Render/Railway/Fly (Node 20+)
                     ├── serves client/dist (static + SPA fallback)
                     └── /api/* ──▶ Supabase Postgres (ap-south-1 / Mumbai)
```

- Build: `npm run install:all && npm run build`
- Start: `npm start` (already defined → `node server/src/index.js`)
- Env: `NODE_ENV=production`, `JWT_SECRET`, `SUPABASE_DB_URL`, `CLIENT_ORIGIN=https://app.example.com`
- One origin means CORS is a non-issue, `localStorage` tokens work, and the existing relative `/api`
  client needs no changes.
- Verify with `GET /api/health`, which already reports the storage mode.

### Alternative: Vercel client + Render API

Requires two code changes that do not exist today: (1) `client/src/utils/api.js` hard-codes `'/api'`,
so it needs an `import.meta.env.VITE_API_BASE` option; (2) `CLIENT_ORIGIN` must list the Vercel domain.
More moving parts, no real benefit for this app.

### Alternative: everything on Vercel

Wrap the Express app in `api/index.js` and add rewrites. Viable **only** with Supabase (no SQLite), but
cold starts, in-memory rate-limit counters resetting per lambda, and static/`sendFile` handling make it
the fussiest option.

### Not an option

Supabase cannot host the Express server. It is database + auth + storage + realtime, not a Node PaaS.

---

## 7. Environment variables after the change

| Variable | Where | Notes |
| --- | --- | --- |
| `SUPABASE_DB_URL` | server only | Pooler string, `?sslmode=require` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | server only, Option B | **Never** prefix with `VITE_`; that would ship it to the browser |
| `JWT_SECRET` | server | Already mandatory in production — startup throws without it |
| `CLIENT_ORIGIN` | server | Exact origin, comma-separated list supported |
| `NODE_ENV` | server | Controls demo seeding |
| `MONGO_URI` | server | Leave unset |
| `PORT` | server | Most hosts inject it |

Secrets rule: only the Express server ever sees a database credential. The browser keeps talking to
`/api` with a JWT.

---

## 8. Gotchas specific to this repository

1. **`NODE_ENV=production` seeds no demo users.** `seedSqliteIfEmpty()` / `seedMongoIfEmpty()` skip
   `starterUsers` in production, and `/api/auth/register` only ever creates `learner`s. A production
   deploy would have lessons but **no way to reach the admin workspace**. You need an explicit
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap step or a one-off "promote to admin" script.
2. **Demo accounts must not reach production.** `aarav@example.com / Learn@123` is public in the README.
3. **`trust proxy` is not set.** Behind Render/Vercel the client IP is in `X-Forwarded-For`; add
   `app.set('trust proxy', 1)` or `express-rate-limit` will rate-limit the proxy, not the user.
4. **Rate limiting is in-memory**, so it is per instance and resets on restart. Acceptable for an MVP,
   not for a real launch (use Upstash Redis then).
5. **The client must be built on the host.** `client/dist` is git-ignored and the server serves it.
6. **JWT in `localStorage`** — no revocation, no refresh, 7-day expiry, XSS-sensitive. Fine for the MVP;
   httpOnly cookies or Supabase Auth later.
7. **No password reset / email verification** exists today.
8. **Supabase free tier pauses after ~7 days of inactivity**, keeping the data but taking the app
   offline until resumed from the dashboard — plan a keep-alive ping or accept it for a college demo.
   Pro is ~$25/month and never pauses. *Verify current limits on supabase.com/pricing before quoting.*
9. **Free tiers sleep.** Hosting a demo on free plans means a cold start on the first visit.
10. **Backups:** none on Supabase free. Export the seed script + a `pg_dump` before any demo.
11. **Region:** pick Mumbai (`ap-south-1`) for an India-only audience — lower latency and better aligned
    with data-residency expectations.
12. **Child data.** Names, emails and learning progress are personal data of minors under India's DPDP
    Act 2023, which requires verifiable parental consent and bars tracking/behavioural advertising
    aimed at children. Do not enable Supabase analytics, and keep the product data minimal — the app
    already avoids collecting sensitive safety disclosures, which is worth preserving.

---

## 9. Suggested phased plan (if/when you want it built)

| Phase | Work | Output |
| --- | --- | --- |
| 0 | Create the Supabase project (Mumbai), copy the pooler string | Connection available |
| 1 | `schema.sql` + `npm run db:migrate` | Four tables, indexes, FKs, RLS enabled with **no** policies (deny-all for `anon`) |
| 2 | `supabaseRepository.js` implementing the 20 backend functions | Same API contract, new storage mode |
| 3 | Conditional-update versions of the two claim functions | One-time XP still guaranteed under concurrency |
| 4 | Seed script + admin bootstrap | Idempotent content, a real admin account |
| 5 | Deploy to Render, wire env vars | `GET /api/health` → `storage: "supabase"` |
| 6 | Smoke test: register → login → lesson → quiz → XP → game → replay (0 XP) → admin publish | Verified |

**Effort:** ~1–2 days for phases 1–4 by someone who knows the code; half a day for deploy and smoke
tests. Option B adds maybe 20%; Option C is a different project.

---

## 10. If I were to pick

- **Now:** Option A — Supabase Postgres as a third repository backend, deployed as a single Render web
  service. Cheapest path to a link you can share, keeps every feature identical, and the SQLite demo
  still works for offline evaluation.
- **Later, if it becomes a real product:** add Supabase Auth (gives password reset, email verification,
  MFA), move XP into Postgres functions with RLS, and revisit backups, monitoring and the DPDP consent
  design.

---

## 11. Appendix — exact inventory of what gets added

Nothing below exists in the repository today. Line counts are estimates to size the work, not code.

### 11.1 New files

| # | File | ~Lines | What it contains |
| --- | --- | --- | --- |
| 1 | `server/db/schema.sql` | 120 | 4 tables, 8 indexes, foreign keys, `updated_at` trigger, `ALTER TABLE … ENABLE ROW LEVEL SECURITY` |
| 2 | `server/src/services/supabaseRepository.js` | 480 | The 20 backend functions: 17 data operations + 3 lifecycle helpers |
| 3 | `server/src/scripts/migrateSupabase.js` | 40 | Reads `schema.sql`, runs it once, prints a table summary |
| 4 | `server/src/scripts/seedSupabase.js` | 70 | Idempotent `INSERT … ON CONFLICT DO NOTHING` from the existing `seedData.js` |
| 5 | `server/src/scripts/createAdmin.js` | 40 | Creates or promotes an admin from env vars — closes the production gap in §8 |
| 6 | `render.yaml` (or `fly.toml`) | 25 | Build/start commands, health check path, env var declarations |
| 7 | `docs/SUPABASE_SETUP.md` | 60 | Click-by-click project creation, pooler string, region choice |

**Total: ~835 new lines across 7 files.** Swap `render.yaml` for a `Dockerfile` (~15 lines) if you prefer
containers, or drop it entirely and configure the host through its dashboard.

### 11.2 New dependencies

| Package | Where | Why |
| --- | --- | --- |
| `pg` ^8.13 | `server/package.json` dependencies | Postgres driver. Pooling is built in; no native build step |
| *(`postgres` instead)* | alternative | Pick **one**. `postgres.js` needs `prepare: false` in transaction mode; `pg` works as-is if you avoid named statements |

No new client-side dependency. No new dev dependency. `dotenv`, `bcryptjs`, `jsonwebtoken`, `express`,
`helmet`, `cors`, `express-rate-limit` all stay as they are.

### 11.3 New npm scripts

```json
"db:migrate": "node src/scripts/migrateSupabase.js",
"db:seed":    "node src/scripts/seedSupabase.js",
"db:admin":   "node src/scripts/createAdmin.js"
```

The existing `dev`, `start`, `seed` and `test` scripts are untouched. `npm run seed` today only checks
Mongo seeding; it would either be pointed at the new script or left alone for the Mongo path.

### 11.4 New environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_DB_URL` | yes, to enable the mode | Pooler connection string, `?sslmode=require` |
| `ADMIN_EMAIL` | production only | Bootstrap admin identity |
| `ADMIN_PASSWORD` | production only | Bootstrap admin password, used once then unset |

`MONGO_URI`, `SQLITE_PATH`, `PORT`, `CLIENT_ORIGIN`, `JWT_SECRET` and `NODE_ENV` keep their current
meaning. No existing variable changes behaviour.

### 11.5 Database objects created

| Object | Detail |
| --- | --- |
| Tables | `users`, `lessons`, `quizzes`, `attempts` — same column names as the SQLite `SCHEMA` string |
| Indexes | `users.email` (unique), `quizzes.lesson_id`, `attempts(user_id, created_at)`, `lessons.published`, `lessons.sort_order`, plus the `id` primary keys |
| Foreign keys | `quizzes.lesson_id → lessons.id`, `attempts.user_id → users.id`, `attempts.quiz_id → quizzes.id` |
| Arrays | `completed_lesson_ids`, `completed_game_ids`, `attempted_quiz_ids`, `unlocked_card_ids` as `TEXT[]`; `badges` as `JSONB` |
| RLS | Enabled on all four tables with **no** policies — deny-all for `anon`/`authenticated`. Only the server's connection string reaches the data, so the browser never touches Postgres directly |
| Functions *(optional)* | `claim_game_completion()` / `claim_quiz_rewards()` if you prefer one round-trip over a transaction |

### 11.6 Existing files that change (small diffs)

| File | ~Lines changed | Change |
| --- | --- | --- |
| `server/src/services/repository.js` | 30 | Import the new module; add a `supabase` branch in `initialiseRepository()` before the Mongo check; update `repositoryMode()` and `closeRepository()` |
| `server/src/index.js` | 1 | `app.set('trust proxy', 1)` so rate limiting sees real client IPs |
| `server/src/config.js` | 8 | Fail fast in production when `SUPABASE_DB_URL` is malformed |
| `server/package.json` | 5 | One dependency, three scripts |
| `server/.env.example`, `.env.example` | 6 | Document the new variables |
| `README.md` | 20 | Third row in "Database modes", deployment section |
| `docs/ARCHITECTURE.md` | 10 | Storage layer in the diagram and data-model table |

**Roughly 80 modified lines against ~835 new lines.**

### 11.7 Explicitly **not** added (Option A)

- No change to any React file, no change to `client/src/utils/api.js`, no new `VITE_*` variable.
- No change to `routes/*.js`, `middleware/auth.js`, `services/rewards.js` or `services/seedData.js`.
- No Supabase JS SDK, no service-role key, no RLS policies, no RLS-dependent client queries.
- No Supabase Auth migration — bcrypt + JWT stay.
- No new API endpoint; `/api/health` already reports the active storage mode.
- No change to the reward rules or the test suite in `server/test/`.

### 11.8 How Options B and C differ in what gets added

| | Option A (Postgres adapter) | Option B (`supabase-js`) | Option C (full platform) |
| --- | --- | --- | --- |
| New server files | 7 | 6 — `supabaseRepository.js` uses PostgREST instead of SQL | 2–3 plus an RPC/functions folder |
| New dependency | `pg` | `@supabase/supabase-js` | `@supabase/supabase-js` on **both** client and server |
| New client files | 0 | 0 | `client/src/lib/supabase.js`, rewritten `AuthContext`, a `profiles` table, new protected-route logic |
| New env vars | 3 | 4 (adds URL + service key) | 4 public ones (`VITE_*`) plus server keys |
| Database objects | 4 tables, deny-all RLS | same + `SECURITY DEFINER` functions | same + real RLS policies + `auth` triggers |
| Modified existing files | 7 (~80 lines) | 7 (~90 lines) | 15+ (~600 lines) |

---

## 12. Verification of the implementation

Verified locally against **PostgreSQL 18.6** (PGlite, a real Postgres build running in-process)
before any of this was committed. Supabase itself is hosted Postgres, so the SQL, types and
error codes behave the same; the only untested pieces are Supabase-specific (pooler routing,
TLS termination), which the connection string handles.

| Check | Result |
| --- | --- |
| End-to-end API run on Supabase storage | 29/29 checks passed: demo sign-in, lessons, quiz scoring, XP rules, badges, games, progress, registration, admin authoring, 401/403 guards |
| Existing unit tests (`npm test`) | 8/8 passed, unchanged |
| Postgres integration tests (`npm run test:db`) | 8/8 passed |
| SQLite mode after the change | Still boots and behaves identically (health reports `sqlite`, same XP maths, ISO timestamps) |
| Schema re-applied on restart | No errors, no duplicate seed |
| Production boot (`NODE_ENV=production`) | Seeds 4 lessons + 4 quizzes and **0 users**; demo accounts stay out of production |
| Production with an unreachable database | Boot fails instead of silently falling back to SQLite |
| `db:migrate` / `db:seed` / `db:admin` | All work; the bootstrapped admin can sign in and publish |
| Concurrent duplicate game submissions | Stored XP is not inflated (final total stays 25), matching SQLite/Mongo behaviour |

### Deviations from the plan, and why

1. **Tests run in the `public` schema, not an isolated one.** Supabase's transaction pooler
   does not preserve session-level settings, so `search_path` cannot be used for isolation.
   The integration tests therefore tag every row they create and delete it afterwards, and
   only check relative facts (e.g. "the new lesson is ordered after the current last one").
2. **RLS is enabled with no policies.** The API connects as the table owner, which bypasses
   RLS; the public PostgREST roles are denied. If `supabase-js` is added later, policies are
   required first.
3. **The `claimGameCompletion` / `claimQuizRewards` functions are implemented and tested, but
   the routes still use a read-then-write pattern.** That is pre-existing behaviour in all
   three backends: parallel duplicate requests can each *report* an XP award, but the stored
   total is written as an absolute value, so XP is not inflated. Switching the routes to the
   atomic helpers is a contained follow-up, not part of the storage migration.
