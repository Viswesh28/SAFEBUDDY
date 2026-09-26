# SafeBuddy architecture

## Overview

```text
React + Vite browser client
         │ relative /api requests
         ▼
Express API ── JWT middleware ── role guard
         │
         ├── JSON demo repository (default, no setup)
         └── Mongoose / MongoDB repository (when MONGO_URI is set)
```

## Application layers

### Client

- **Pages:** landing, authentication, dashboard, lesson library, lesson reader, quiz, leaderboard, profile, and admin guide space.
- **Auth context:** stores the JWT in local storage, restores a session through `/api/auth/me`, and exposes login/register/logout utilities.
- **API utility:** centralises same-origin `/api` requests with bearer tokens.
- **Route protection:** redirects signed-out users to sign-in and prevents non-admin users from entering the Guide Space.

### API

- **Auth routes:** registration, login, and current user retrieval.
- **Lesson routes:** retrieve published lesson content; admin creation and updating.
- **Quiz routes:** retrieve a sanitised quiz without answer keys; score submitted answers only on the server; update XP, badges, and completion.
- **Progress routes:** learner progress, attempt history, and ordered leaderboard.
- **Repository service:** provides a consistent data interface for either the local JSON demo store or MongoDB.

## Data model

| Model | Key fields |
| --- | --- |
| User | external ID, name, email, password hash, role, avatar, XP, streak, completed lesson IDs, badges |
| Lesson | external ID, title, topic/category, colour/icon, duration, level, content sections, published state |
| Quiz | external ID, lesson ID, XP reward, questions, options, correct answer index, explanations |
| Attempt | user ID, quiz ID, lesson ID, score, total, submitted choices, timestamp |

`externalId` keeps the demo JSON and MongoDB route contracts consistent. The client never receives a password hash; quiz answers are stripped from the read endpoint and are evaluated on the server during submission.

## Security choices in the MVP

- Passwords are salted and hashed with `bcryptjs`.
- JWTs expire after seven days.
- Admin-only mutations are protected by both authentication and role middleware.
- Helmet and a restricted CORS policy are enabled.
- The API accepts bounded JSON requests and returns generic error messages.
- Sensitive safety information is not collected as product data in the standard learner journey.

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
- Object-level authoring permissions, rate limiting, test suites, observability, and deployment infrastructure.
