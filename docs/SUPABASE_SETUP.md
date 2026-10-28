# Running SafeBuddy on Supabase

SafeBuddy keeps its existing JWT authentication and Express API; Supabase supplies the
**PostgreSQL database** only. One Node process serves the built React app and the `/api`
routes, and talks to Supabase over a normal Postgres connection string.

```text
Browser ──/api──▶ Express (Node) ──Postgres protocol──▶ Supabase Postgres
                      │
                      └── serves client/dist (static + SPA fallback)
```

Storage is chosen at boot in this order: `MONGO_URI` → `SUPABASE_DB_URL` → local SQLite.

---

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and choose **New project**.
2. Pick the **Mumbai (ap-south-1)** region for learners in India, and keep the generated
   database password somewhere safe.
3. Wait for provisioning, then open **Project Settings → Database → Connection string**.

## 2. Copy the right connection string

| Mode | Port | Use it for |
| --- | --- | --- |
| Shared pooler, transaction mode | `6543` | **The API.** IPv4-friendly, survives serverless and small connection limits |
| Shared pooler, session mode | `5432` | Long-lived background jobs and `pg_dump` |
| Direct connection | `5432` (`db.<ref>.supabase.co`) | Migrations/`psql` only — it is IPv6-only on newer projects |

Use the **transaction pooler** string for `SUPABASE_DB_URL` and keep `?sslmode=require`:

```dotenv
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

The API does not use prepared statements or session settings, so transaction mode works
as-is. If you later add an ORM, configure it for pooled transaction mode.

> **RLS note:** `server/db/schema.sql` enables row-level security with **no policies**. The
> browser never sees Postgres, and the API connects as the project's `postgres` role (the
> table owner), which bypasses RLS. If you later add PostgREST/`supabase-js` access, add
> explicit policies first — otherwise those clients see empty tables by design.

## 3. Set up the database locally

From the repository root:

```bash
npm run install:all
```

Then, in `server/.env`:

```dotenv
SUPABASE_DB_URL=postgresql://...:6543/postgres?sslmode=require
JWT_SECRET=use-a-long-unique-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

Apply the schema, seed the starter content, and create your first admin:

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
npm run db:admin --prefix server -- --email=guide@school.org --password='a-long-unique-password' --name='School Guide'
```

- `db:migrate` runs `server/db/schema.sql` (idempotent).
- `db:seed` inserts the four lessons, their quizzes, and — only outside production — the
  three demo learners plus the demo admin.
- `db:admin` promotes an existing account or creates a new admin. It works with any storage
  backend, so it is also the way to get an admin into production, where demo accounts are
  deliberately not seeded.

The server also applies the schema and seeds automatically on first boot, so the two
commands above are a convenience, not a requirement.

## 4. Run it

```bash
npm run dev
```

Check the active backend:

```bash
curl http://localhost:5000/api/health
# {"ok":true,"service":"SafeBuddy API","storage":"supabase"}
```

## 5. Deploy

The repository ships a `render.yaml` that builds the client and starts the API as one web
service:

1. Push the repository to GitHub.
2. In Render: **New → Blueprint**, pick the repo, and apply `render.yaml`.
3. Set the two secret variables it prompts for:
   - `SUPABASE_DB_URL` — the transaction-pooler string from step 2
   - `CLIENT_ORIGIN` — the deployed URL, e.g. `https://safebuddy.onrender.com`
   `JWT_SECRET` is generated automatically; `NODE_ENV=production` is preset.
4. After the first deploy, run the admin bootstrap once from your machine (or any shell with
   the production values):

   ```bash
   SUPABASE_DB_URL='...' npm run db:admin --prefix server -- --email=you@example.org --password='...'
   ```

The same build works on Railway, Fly.io or a VPS: `npm run install:all && npm run build`,
then `npm start` with the environment variables above. A single process means one origin, so
CORS, cookies and `localStorage` tokens all behave exactly as they do locally.

## 5b. Deploying to Vercel

The repository is ready for Vercel: `vercel.json` builds the client, `api/index.mjs` exposes the
Express app as a serverless function, and `server/src/index.js` skips binding a port when
`VERCEL=1`.

1. In Vercel, **Add New → Project → Import Git Repository** and pick the SafeBuddy repo
   (choose the branch you want to ship).
2. Vercel reads `vercel.json`; no build settings need changing.
3. Add these environment variables (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_DB_URL` | the transaction-pooler string from step 2 |
   | `JWT_SECRET` | a long random value |
   | `CLIENT_ORIGIN` | your deployment origin, e.g. `https://safebuddy.vercel.app` |
   | `PG_POOL_MAX` | `2` — keeps each serverless instance inside the pooler budget |
   | `NODE_ENV` | `production` |

4. Deploy, then confirm `https://<your-app>/api/health` returns `"storage":"supabase"`.

Serverless notes:

- Every cold start re-applies `server/db/schema.sql` (it is idempotent) and skips seeding once
  lessons exist, so the first request is a little slower than later ones.
- `CLIENT_ORIGIN` must match the deployed origin exactly. Preview deployments get their own
  origins, so either add them to the comma-separated list or use one stable production domain.
- The in-memory rate limiter is per instance on serverless. That is acceptable for a demo; use a
  shared store (for example Upstash Redis) if the limits need to hold across instances.

## 6. Verify a deployment

- `GET /api/health` → `"storage":"supabase"`
- Sign in as the admin you created, publish a lesson.
- Sign in as a learner, pass a quiz: the first pass gives participation XP plus the lesson
  bonus, and a repeat gives 0 XP.
- Restart the service, sign in again: progress is still there. If it is not, the app is
  running on SQLite rather than Supabase — check `SUPABASE_DB_URL` in the host's dashboard.

## 7. Backups and cost

- Free projects get **no automatic backups** and **pause after about a week of inactivity**.
  Before a demo, open the dashboard and resume the project; a keep-alive request also works.
- To take a backup with the session pooler:

  ```bash
  pg_dump 'postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres' -Fc -f safebuddy.dump
  ```

- Verify current limits and pricing on the Supabase pricing page — the free plan has changed
  over time (500 MB database, 2 projects at the time of writing).

## 8. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `The Supabase schema has not been created yet` | Run `npm run db:migrate --prefix server`, or check the app connects with the right URL |
| `connect ETIMEDOUT 2600:...` | You used the direct IPv6 host; switch to the pooler string (port 6543) |
| `prepared statement "s0" already exists` | An ORM is using named statements in transaction mode; disable prepared statements |
| `remaining connection slots are reserved` | Too many pool connections; lower `PG_POOL_MAX` (default 5) |
| Tables exist but queries return nothing | You connected as `anon`/`authenticated`; the API needs the project's `postgres` role |
| App works, data resets after deploy | `SUPABASE_DB_URL` is missing in production, so SQLite was used |
| `password authentication failed` | Reset the database password in the dashboard and update the URL (the pooler needs the new password too) |

## 9. Where the pieces live

| Path | Purpose |
| --- | --- |
| `server/src/services/supabaseRepository.js` | Postgres implementation of the repository contract |
| `server/src/services/repository.js` | Chooses the backend and re-exports the same functions |
| `server/db/schema.sql` | Tables, indexes, foreign keys, triggers, RLS |
| `server/src/scripts/migrateSupabase.js` | Applies the schema |
| `server/src/scripts/seedSupabase.js` | Idempotent starter content |
| `server/src/scripts/createAdmin.js` | Admin bootstrap for any backend |
| `server/test/supabaseRepository.test.js` | Integration tests (`TEST_SUPABASE_DB_URL=... npm run test:db --prefix server`) |
