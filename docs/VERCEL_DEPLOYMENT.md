# Deploying SafeBuddy to Vercel

The public demo runs at **https://safebuddy-livid.vercel.app**. This document explains how that
deployment is built, so it can be reproduced or repaired.

## Shape of the deployment

```text
Browser ──┬── /            ──▶ static files from client/dist (CDN)
          ├── /signin, /learn/:id, /dashboard … ──▶ client/dist/index.html (SPA fallback)
          └── /api/*       ──▶ one Node function running the Express app ──▶ Supabase Postgres
```

Everything is produced by [`bootstrap.sh`](../bootstrap.sh), which is the project's **Build
Command**. Vercel's *Install Command* is set to `echo using prebuilt bootstrap` so the platform
does not try to install dependencies before the source exists.

`bootstrap.sh` works in both deployment modes:

1. **source** — if the repository is already checked out (Git-connected project) it builds what is
   there; otherwise it downloads the tarball of `SOURCE_BRANCH` (default `main`) from
   `codeload.github.com`, so a project without a Git connection still builds the right code;
2. `npm run install:all` and `npm run build` — Vite build into `client/dist`;
3. `npm install --omit=dev --prefix server` — production dependencies only;
4. `node scripts/buildVercelOutput.mjs` — assembles the Build Output API directory.

Set the `SOURCE_BRANCH` environment variable in Vercel to build a different branch without editing
the script.

## Connecting the repository to Vercel

This is a two-part setup, and the parts are independent:

| Step | Where | State |
| --- | --- | --- |
| 1. GitHub **login connection** — authorises the Vercel account against GitHub | Account Settings → Authentication → Login Connections | ✅ Done (2026-10-30) |
| 2. **Link the repository to the project** — installs the push webhook | Project `safebuddy` → Settings → Git → Connect Git Repository | ⬜ Outstanding |

**What step 1 unlocked:** Vercel can now clone the repository itself. A Git-sourced deployment of
`main` (`dpl_4hgNjQKskRK455qbXs5zxstBf2M8`, built from `main@e0a945b`) built and promoted
successfully, and Vercel records the GitHub account on the deployment.

**What step 2 still controls:** automatic deployments. Until the repository is linked, the project
has no `gitRepository` and keeps `gitProviderOptions.createDeployments` disabled, so a push or a
merged pull request does **not** start a deployment — verified by a merge that produced no
deployment at its timestamp. Linking also lets Vercel build without `SOURCE_BRANCH`.

To finish:

1. Project **safebuddy → Settings → Git → Connect Git Repository**, choose `Viswesh28/SAFEBUDDY`
   and set `main` as the production branch.
2. Keep the build command `bash bootstrap.sh`, the install command `echo using prebuilt
   bootstrap`, and the output directory `client/dist`. The script detects the checkout and skips
   the tarball download, so no source changes are needed.

Until then, deploys are created with the Vercel API/connector: `create_deployment` with
`bootstrap.sh` as the only file (which fetches the source during the build), or with
`git_source: { type: "github", ref: "main", repoId: 1389085101 }` now that step 1 is done.

## Why a Build Output API directory

With no `vercel.json` in an uploaded file set, Vercel derives routes from the files on disk. That is not enough here: `/api/*` requests only reached the function for single
segment paths and every client route (`/signin`, `/learn/:id`, …) returned `404 NOT_FOUND`.

[`scripts/buildVercelOutput.mjs`](../scripts/buildVercelOutput.mjs) writes `.vercel/output`
explicitly, which Vercel prefers over framework detection:

```text
.vercel/output
├── config.json            # routes
├── static/                # copy of client/dist
└── functions/api.func/    # Express app + server/db + server/node_modules + .vc-config.json
```

`config.json`:

```json
{
  "version": 3,
  "routes": [
    { "src": "/api(.*)", "dest": "/api?__original_path=/api$1" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

Two details matter:

* **`dest` can only address a function by its exact path.** Rewriting `/api/health` to
  `/api/$1` does not resolve to a function, so the request falls through to the SPA fallback and
  the API appears to "return HTML". The original path therefore travels in the `__original_path`
  query parameter and `index.mjs` restores it into `request.url` before Express sees the request.
* **Anything the server reads at runtime must be bundled.** `applySchema()` reads
  `server/db/schema.sql` relative to the compiled module, so `server/db` is copied next to
  `server/src`. Forgetting it fails every request with
  `ENOENT: no such file or directory, open '/var/task/server/db/schema.sql'`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_DB_URL` | Postgres connection string (shared pooler, transaction mode, port 6543) |
| `JWT_SECRET` | Signing key for session tokens — use a long random value |
| `CLIENT_ORIGIN` | Comma-separated browser origins allowed by CORS, e.g. `https://safebuddy-livid.vercel.app,https://safebuddy-viswesh-saravan-ss-projects.vercel.app` |
| `PG_POOL_MAX` | Pool size per function instance (2 is sensible on serverless) |
| `NODE_ENV` | `production` |
| `SAFEBUDDY_DEBUG_API` | Optional. Set to `1` to include the boot failure reason in 500 responses while debugging. Leave unset in production |

Because `CLIENT_ORIGIN` gates CORS, **every new domain or alias has to be added** or sign-in
POSTs fail even though the credentials are correct.

## Verifying a deployment

```bash
node scripts/smokeTest.mjs https://safebuddy-livid.vercel.app
```

The script checks health, the lesson catalogue, both demo sign-ins, an authenticated
`/api/auth/me`, rejection of a wrong password and an anonymous request, and the SPA fallback for
`/signin` and `/learn/right-to-learn`.

When probing by hand, add a cache-busting query (`/api/health?probe=1`) — an earlier 500 response
can otherwise be served from cache after a fix.

## Notes and limits

* The demo accounts (`aarav@example.com` / `Learn@123`, `admin@safebuddy.in` / `Admin@123`) are
  published demo credentials. **Change the admin password before using this anywhere real** —
  `npm run db:admin --prefix server` provisions an admin with a fresh password.
* Vercel Hobby is a demo host: free functions cold-start, and the Supabase free tier pauses after
  a week of inactivity.
* `SAFEBUDDY_DEBUG_API` responses reveal error names and messages; keep it off in production.
