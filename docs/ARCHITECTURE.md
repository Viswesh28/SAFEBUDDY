# SafeBuddy architecture

## Overview

```text
React + Vite browser client
         │ relative /api requests
         ▼
Express API ── JWT middleware ── role guard
         │
         ├── Supabase Postgres repository (when SUPABASE_DB_URL is set)
         ├── Mongoose / MongoDB repository (when MONGO_URI is set)
         └── SQLite repository (default, no setup)
```

## Application layers

### Client

- **Pages:** landing, authentication, dashboard (Home), lesson library (Learn), lesson reader, quiz, safety games (Play), profile (My journey), and admin guide space.
- **Auth context:** stores the JWT in local storage, restores a session through `/api/auth/me`, and exposes login/register/logout utilities.
- **API utility:** centralises same-origin `/api` requests with bearer tokens.
- **Route protection:** redirects signed-out users to sign-in and prevents non-admin users from entering the Guide Space.

### API

- **Auth routes:** registration, login, and current user retrieval.
- **Lesson routes:** retrieve published lesson content; admin creation and updating.
- **Quiz routes:** retrieve a sanitised quiz without answer keys; score submitted answers only on the server; update XP, badges, and completion.
- **Progress routes:** learner progress and attempt history.
- **Game routes:** game catalogue and completion. XP is awarded once per game.
- **Rewards service:** pure XP, streak, and badge rules, covered by unit tests in `server/test`.
- **Repository service:** provides one data interface with three interchangeable backends — Supabase Postgres, MongoDB, or the local SQLite file. `server/src/services/repository.js` picks the backend at boot and delegates to `supabaseRepository.js`, the Mongoose models, or the SQLite statements.

## Data model

| Model | Key fields |
| --- | --- |
| User | external ID, name, email, password hash, role, avatar, XP, streak, completed lesson IDs, badges |
| Lesson | external ID, title, topic/category, colour/icon, duration, level, content sections, published state |
| Quiz | external ID, lesson ID, XP reward, questions, options, correct answer index, explanations |
| Attempt | user ID, quiz ID, lesson ID, score, total, submitted choices, timestamp |

Every backend stores the same values. The Postgres schema (`server/db/schema.sql`) uses
snake_case columns and JSONB/TEXT[] types, and the repository maps them to the camelCase API
contract that the client already consumes. Learners' completed-lesson, completed-game and
attempted-quiz lists are `TEXT[]` in Postgres so that the one-time XP claims can be expressed
as a single conditional `UPDATE`. `externalId`/`id` remains TEXT everywhere, because the
starter lessons use slugs such as `right-to-learn`.

`externalId` keeps the SQLite and MongoDB route contracts consistent. The client never receives a password hash; quiz answers are stripped from the read endpoint and are evaluated on the server during submission.

## Security choices in the MVP

- Passwords are salted and hashed with `bcryptjs`.
- JWTs expire after seven days.
- Admin-only mutations are protected by both authentication and role middleware.
- Helmet and a restricted CORS policy are enabled.
- The API accepts bounded JSON requests and returns generic error messages.
- Sensitive safety information is not collected as product data in the standard learner journey.
- `app.set('trust proxy', 1)` so rate limiting sees the real client IP behind a host proxy.
- The browser never receives a database credential: only the Express server holds
  `SUPABASE_DB_URL` or `MONGO_URI`, and clients authenticate with a JWT.
- In Supabase, row-level security is enabled with no policies. The API connects as the table
  owner (which bypasses RLS), while the public PostgREST roles are denied by default.

## Data-flow example: completing a quiz

1. The client requests `GET /api/quizzes/lesson/:lessonId` with the learner JWT.
2. The API returns only question prompts and options.
3. The learner submits the selected option indexes to `POST /api/quizzes/:quizId/submit`.
4. The server evaluates answers, creates an attempt, calculates reward XP, updates lesson completion/streak/badges, and returns feedback.
5. The client updates the in-memory user context and shows a results screen.

## Future architecture enhancements

- Separate trusted content-management service and publish/review states.
- Dedicated audit trail and safeguarding escalation process designed by specialists.
- i18n resource files and reviewed Tamil/Hindi/other language translations.
- Object-level authoring permissions, shared (cross-instance) rate limiting, observability, and
  a deployment pipeline that runs the Postgres integration tests against a database branch.
