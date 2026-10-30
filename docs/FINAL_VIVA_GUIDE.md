# SafeBuddy — Final Viva Preparation Guide

## 1. 30-second project pitch

**SafeBuddy is a child-friendly, gamified web learning platform for children's rights, personal safety, and introductory legal literacy in India.** Learners read short lessons, answer quizzes, practise with safety games, and track progress through XP, streaks, and badges. An administrator can publish lesson content and quiz questions. The application uses a React/Vite frontend and an Express REST API; data can be stored in SQLite by default or MongoDB when configured. It is an educational prototype—not legal advice, counselling, or an emergency service.

## 2. Problem, goal, and users

- **Problem:** legal and safety information can be difficult for children to access and understand when presented as dense text.
- **Goal:** turn foundational child-rights and safety concepts into short, supportive, interactive learning experiences.
- **Learner:** reads a lesson, practises its ideas, takes a quiz/game, and sees personal progress.
- **Guide/admin:** publishes lessons and quiz questions through a restricted workspace.
- **Content areas:** Right to Education; personal safety and trusted help; safe childhood; care, fairness, and fresh starts. The material references Indian context including RTE, POCSO, child-labour awareness, juvenile justice, and support signposting.
- It does not ask learners to disclose a real-life safeguarding incident. The product clearly states that it is not a replacement for qualified help.

## 3. Features visible in the application

1. Landing and account sign-in/registration.
2. Learner dashboard and lesson library.
3. Lesson reader with short sections, safety audio, and optional video embeds.
4. Quiz with result feedback and explanations.
5. Safety-game catalogue and interactive game pages.
6. Learner journey/profile with progress, attempt history, XP, streaks, and badges.
7. Collection page with XP levels/badges.
8. Admin/Guide Space to create lessons and add quiz questions.
9. Responsive, keyboard-friendly UI, with game controls that can include keyboard and on-screen input.

**Important implementation scope detail:** there are 10 React game components in the source tree, but the server catalogue currently exposes 3 game IDs to the application (`safe-or-not`, `trusted-helper-match`, and `safe-path-maze`). Do not claim all 10 are currently playable through the catalogue. Similarly, project documents mention a leaderboard as an intended gamification theme, but the current API/UI provides personal levels and collection—not a live cross-user leaderboard.

## 4. Technology stack (what each part does)

### Frontend

- **React 18:** component-based UI and local interactive state.
- **Vite 6:** development server and production bundler; React plugin enables JSX transformation.
- **React Router 7:** client-side navigation and nested/protected routes.
- **Context API:** `AuthContext` shares the signed-in user, token, loading state, and login/register/logout actions.
- **Fetch API:** central helper in `client/src/utils/api.js` sends JSON and bearer tokens to relative `/api/...` paths.
- **CSS:** application styles and responsive presentation.
- **canvas-confetti:** celebratory reward feedback.
- Static MP3 clips live in `client/public/audio`; YouTube videos are shown through a click-to-load privacy-enhanced embed.

### Backend

- **Node.js 22+ / ES modules:** JavaScript server runtime. The default storage uses Node's built-in `node:sqlite` API (`DatabaseSync`), so the documented setup expects a Node version with built-in SQLite support.
- **Express 4:** REST endpoints, middleware, request parsing, and error handling.
- **Mongoose 8 + MongoDB (optional):** document database path and schemas when `MONGO_URI` is configured.
- **SQLite (default):** local file-based relational database at `server/data/safebuddy.sqlite`; created and seeded automatically.
- **bcryptjs:** salted password hashing and password verification.
- **jsonwebtoken:** signed, seven-day JWT access tokens.
- **Helmet:** HTTP security headers.
- **CORS:** restricts allowed origins based on `CLIENT_ORIGIN`.
- **express-rate-limit:** general API and stricter login/register request limits.
- **Morgan:** HTTP request logging.
- **dotenv:** environment-based configuration.
- **Node test runner + Supertest dependency:** unit tests use `node:test` for reward rules; Supertest is available as a development dependency.

### Build/run tools

- Root `concurrently` starts the client and server together.
- Vite proxies `/api` requests to Express in development.
- Express can serve the built client from `client/dist` in production.

### Architecture label: is this MERN?

It is **MERN-style**, not strictly MongoDB-only in its default configuration. The interface is React, the API is Express on Node, and Mongoose/MongoDB is supported. However, zero-setup/local mode uses SQLite through a storage repository abstraction. Explain this as a deliberate ease-of-development/demo feature while retaining the MongoDB deployment path.

## 5. High-level architecture

```text
Browser (React + Vite)
  ├── React Router pages and protected routes
  ├── AuthContext + localStorage JWT
  └── fetch('/api/...') with Bearer token
              │ Vite proxy in development / same-origin in deployment
              ▼
Node.js + Express REST API
  ├── routes: auth, lessons, quizzes, progress, games, collection
  ├── middleware: JWT authentication + admin role checks
  ├── services: repository, content seed, rewards, game catalogue
  └── persistence adapter
        ├── SQLite file by default
        └── MongoDB/Mongoose when MONGO_URI is configured
```

### Layer responsibilities

- **Pages** compose user-facing screens.
- **Components** provide shared layout, route protection, icons, progress visuals, and media.
- **Routes** validate request data, check access, orchestrate operations, and shape responses.
- **Middleware** authenticates users and restricts admin-only routes.
- **Services** hold storage-independent logic, game catalogue, starter content, and XP/streak/badge rules.
- **Models** describe MongoDB documents; the repository maps the same logical records to SQLite or MongoDB.

## 6. Data model

| Entity | Purpose / important fields |
|---|---|
| **User** | ID, name, unique email, password hash, role, avatar, XP, streak, completed lesson/game IDs, attempted quiz IDs, badges, last active timestamp. Password hash is removed from API responses. |
| **Lesson** | ID, title, summary, category, icon/colour, estimated minutes, level, ordered content sections, publish status. |
| **Quiz** | ID, related lesson ID, title, XP reward, questions. A question has prompt, options, correct option index, and explanation. |
| **Attempt** | Learner ID, quiz ID, lesson ID, score, question total, submitted choices, timestamp. |

SQLite stores structured fields in tables and JSON-encodes arrays/sections. MongoDB stores equivalent data through Mongoose schemas. `externalId` in MongoDB gives the API a stable ID shape corresponding to SQLite IDs.

## 7. Important end-to-end flows

### Registration/login

1. Client submits name/email/password (plus optional allowed avatar) to `POST /api/auth/register`, or credentials to `/api/auth/login`.
2. Server validates required fields, email shape, name length, password minimum length, and duplicate email.
3. Password is hashed with bcryptjs (10 salt rounds for registration/demo seeding); login uses bcrypt compare.
4. Server signs a JWT with user ID as `sub`, role, and seven-day expiry; response includes token and a password-free user object.
5. Client stores token as `safebuddy_token` in localStorage. On reload it calls `/api/auth/me`; authenticated API calls include `Authorization: Bearer <token>`.

### Route authorization

- `ProtectedRoute` redirects signed-out users to `/signin`.
- Admin UI is additionally role-gated on the client for user experience.
- **Real enforcement is on the server too:** routes for lesson/quiz mutations use `requireAuth` then `requireAdmin`. Client checks alone are never considered security.

### Quiz completion

1. Learner fetches `/api/quizzes/lesson/:lessonId`.
2. Server removes `answerIndex` and `explanation` from the quiz response so the browser cannot see the answer key before submission.
3. Client sends option indexes to `POST /api/quizzes/:quizId/submit`.
4. Server verifies that all questions are answered and each choice is a valid integer option index, then scores against stored answer keys.
5. Passing threshold is **60%**. It records an attempt, calculates XP, updates completion/streak/badges, and returns score, feedback/explanations, XP breakdown, new badges, and safe user data.
6. Client displays results and refreshes the signed-in user state.

### Game completion

1. Client loads the catalogue with `/api/games` and renders a matching React game component.
2. After play, it submits `score` and `total` to `/api/games/:gameId/complete`.
3. Server checks that the game ID exists and that score/total are whole numbers in range. First completion earns the configured reward; repeats do not earn more XP.
4. The server records completion, streak, and badges, then returns the result.

**Viva precision:** the game scenarios and game score are client-side; the endpoint validates score bounds, but it does not independently replay/verify every game answer. This is acceptable for an educational MVP but should be strengthened if rewards/security become high stakes.

## 8. XP, badges, streaks, and progress

- First attempt of a quiz: **+5 participation XP**.
- First pass of a lesson quiz: additionally earns that quiz's configured reward (seed quizzes: 30–40 XP). Pass means at least 60%.
- Repeated quiz attempts or an already-completed lesson: no repeat quiz XP.
- First game completion: configured one-time reward (25 or 30 XP for the three exposed games); replay gives 0 XP.
- Streaks use **Asia/Kolkata calendar days**: first activity starts at 1; next consecutive day increments; same-day activity leaves it unchanged; missing a day resets it to 1.
- Badges include First Step, Safety Scout, Sharp Thinker, Rights Champion, Game Explorer, and Game Master.
- Progress API returns completed/total lessons, average best score by attempted lesson, quiz count, completed/total games, and attempt history.

## 9. REST API cheat sheet

| Method + path | Access | Purpose |
|---|---|---|
| `GET /api/health` | Public | Health and selected storage mode. |
| `POST /api/auth/register` | Public + rate-limited | Create learner account. |
| `POST /api/auth/login` | Public + rate-limited | Authenticate, issue JWT. |
| `GET /api/auth/me` | Signed in | Return current safe user data. |
| `GET /api/lessons` | Public | List published lessons. |
| `GET /api/lessons/:id` | Public | Get one published lesson. |
| `POST /api/lessons` | Admin | Create lesson with at least one section. |
| `PATCH /api/lessons/:id` | Admin | Update whitelisted lesson fields. |
| `GET /api/quizzes/lesson/:lessonId` | Signed in | Get quiz with answer keys removed. |
| `POST /api/quizzes/:quizId/submit` | Signed in | Score attempt and update rewards/progress. |
| `POST /api/quizzes` | Admin | Create quiz or add questions to the lesson quiz. |
| `GET /api/progress/me` | Signed in | Return personal progress and quiz attempts. |
| `GET /api/games` | Signed in | Return exposed game catalogue and completion state. |
| `POST /api/games/:gameId/complete` | Signed in | Record completion and one-time XP. |
| `GET /api/collection` | Signed in | Return XP levels and badge status. |

All endpoints are mounted under `/api`; unknown API paths return JSON 404 responses.

## 10. Security and privacy discussion

### Implemented

- bcrypt password hashing; plaintext passwords are not stored.
- JWT verification and server-side user lookup on protected routes.
- Admin role guards for content mutations.
- Quiz answer keys are not sent before submission; scoring runs server-side.
- Helmet headers, configured CORS, JSON body size limit, and rate limits (general API 300 requests / 15 minutes; auth endpoints 10 / 15 minutes).
- Parameterized SQL statements; input allowlists/validation on key routes.
- App's normal learning flow avoids collecting sensitive disclosures.
- Production checks require a configured JWT secret.

### Limitations / production hardening

- The browser stores JWT in localStorage, which can be exposed by successful XSS; a production threat model could consider secure, HttpOnly, SameSite cookies and CSRF controls.
- This MVP is not a full child-safety compliance system: age assurance, parental consent, formal retention/deletion process, content review/audit workflow, safeguarding escalation, monitoring, comprehensive validation/tests, and formal accessibility/legal reviews are future work.
- Do not use demo credentials or the development JWT secret in production. Configure a long unique `JWT_SECRET`, production database, origin allowlist, backups, monitoring, and reviewed child-safety/legal content.
- External YouTube content is third-party material; video iframe is loaded only after the user chooses to play it.

## 11. Testing and how to run

- Install: `npm run install:all`.
- Start both services: `npm run dev`.
- Frontend: `http://localhost:5173`; API health: `http://localhost:5000/api/health`.
- Production client build: `npm run build --prefix client`.
- Reward unit tests: `npm test --prefix server`.
- Tests cover quiz XP/pass rules, no repeated XP, one-time game rewards, IST streak boundaries, and badge rules. These are unit tests for reward logic, not a comprehensive API/browser test suite.
- MongoDB is optional: set `MONGO_URI`; otherwise SQLite is used. If Mongo is unreachable, repository initialization falls back to SQLite.
- Demo credentials for local development only: learner `aarav@example.com` / `Learn@123`; admin `admin@safebuddy.in` / `Admin@123`.

## 12. Strengths and trade-offs to explain

- **Child-friendly gamification:** improves engagement and turns abstract concepts into practice.
- **Server-side quiz answers/rewards:** prevents easy answer-key inspection and XP farming by replay.
- **Repository abstraction:** same domain operations with local SQLite or MongoDB.
- **Trade-off:** SQLite lowers setup friction, but a single local file is not an ideal multi-instance production database.
- **Trade-off:** JWT/localStorage keeps the demo simple, but a production child-focused system needs stronger session and privacy design.
- **Trade-off:** client-driven game scoring is acceptable for low-stakes learning, but not trusted for secure competitive rankings.
- **Trade-off:** current guide/admin workflow is intentionally small; it lacks multi-stage editorial review/versioning.

## 13. Likely viva questions and strong answers

**Q: What is the main objective?**  
A: Help children understand foundational rights and personal safety through age-appropriate lessons and practice, and help educators publish reviewed learning content.

**Q: Why did you gamify it?**  
A: Short quizzes, games, XP, streaks, and badges give immediate, encouraging feedback and make learning interactive. Rewards are one-time for completion to discourage repetitive XP farming.

**Q: Why REST?**  
A: The client and server are separate layers, so resource-oriented HTTP endpoints provide a simple, language-independent contract for authentication, lessons, quizzes, progress, and games.

**Q: Why both SQLite and MongoDB?**  
A: SQLite provides zero-setup local/demo persistence. MongoDB/Mongoose is an optional deployment path. A repository layer shields routes and reward logic from storage-specific query details.

**Q: Why do we call it MERN-style rather than simply MERN?**  
A: React, Express, and Node are the default application stack; Mongoose/MongoDB is supported, but SQLite is the default persistence mode. Therefore it is MERN-style with a dual persistence adapter.

**Q: How are answers protected?**  
A: The quiz read route removes the correct option and explanation. The client sends only selected option indexes; the server compares them with stored answers and returns feedback after submission.

**Q: How does authentication work?**  
A: Password hash is checked with bcrypt. The server signs a JWT with a subject and role, expiring after seven days. The client sends it as a bearer token; middleware verifies it and reloads the user.

**Q: What prevents a learner from calling admin endpoints directly?**  
A: `requireAuth` validates identity and `requireAdmin` checks the role at the API layer. Hiding a button or React route is not relied on for authorization.

**Q: What are the key entities?**  
A: User, Lesson, Quiz, and Attempt. Users also retain completion IDs, reward state, badges, and streak metadata.

**Q: How do you calculate score and pass?**  
A: Count correct option indexes on the server; percentage is rounded from correct answers divided by question count; 60% or higher passes.

**Q: How are XP and streak abuse reduced?**  
A: Participation XP is first quiz attempt only, lesson reward is first pass only, and game XP is first completion only. Streak updates compare the last active calendar date in India time.

**Q: What is the biggest limitation?**  
A: It is an academic MVP, not a production child-safeguarding service. Stronger privacy/consent, reviewed content, operational controls, comprehensive testing, secure session strategy, and independent game-score verification are needed before public use.

**Q: What would you build next?**  
A: A safeguarding/legal review and parent/educator consent design first; then multilingual, reviewed content, accessible user testing, CMS review/versioning, stronger secure sessions, audit/retention controls, complete integration/E2E tests, and production monitoring. If game competition is needed, move score validation to trusted server logic before adding a leaderboard.

## 14. Suggested 2-minute presentation script

> Good morning. My project is SafeBuddy, a child-friendly web platform for learning about children's rights and personal safety in the Indian context. The motivation is that legal information is often difficult for children to understand, so SafeBuddy breaks it into short lessons, quizzes, and interactive safety games. Learners can track progress through scores, XP, streaks, and badges, while administrators can add lessons and quiz questions.
>
> Technically, the frontend is built with React and Vite, with React Router for navigation and an authentication context for session state. It calls a Node.js and Express REST API using JSON and bearer JWTs. Passwords are hashed with bcrypt. The server uses Mongoose and MongoDB when configured, and otherwise uses a local SQLite database through a repository layer. The main data entities are users, lessons, quizzes, and quiz attempts.
>
> A key design choice is that quiz answer keys stay on the server. The browser submits selected option indexes; the API validates and scores them, records the attempt, and updates progress and rewards. Admin changes are protected by server-side authentication and role checks. The system also uses Helmet, CORS configuration, and rate limiting.
>
> The project is a functional academic MVP, not legal advice or a production safeguarding service. Before public deployment, it needs expert content review, consent and privacy processes, stronger operational security, accessibility testing, and a broader automated test suite. Thank you.

## 15. Five facts to memorize tonight

1. **Purpose:** child-friendly Indian rights/safety learning.
2. **Stack:** React + Vite → Express/Node REST API → SQLite default / optional MongoDB.
3. **Auth:** bcrypt password hashes + seven-day JWT bearer tokens + server-side role checks.
4. **Quiz integrity:** answer keys stay server-side; 60% pass; XP is awarded once under specific rules.
5. **Scope honesty:** MVP, not legal advice; three games exposed in server catalogue; no implemented cross-user leaderboard; production child-safety review is essential.

## 16. Algorithms used in SafeBuddy

### Short viva answer

> SafeBuddy does not use artificial intelligence or machine learning. It uses deterministic, rule-based algorithms for quiz scoring, reward eligibility, streaks, badges, learner progress, and interactive games. The rules are explicit, testable, and appropriate for a low-stakes educational MVP.

### 16.1 Quiz scoring

The server receives selected option indexes and compares each one with the corresponding answer index stored in the quiz. It validates that every answer is present and is a valid option before calculating the result.

```text
correct = count(submitted answer equals stored answer)
score percentage = round((correct / total questions) * 100)
passed = score percentage >= 60
```

The client receives the correct answers and explanations only after submission. Scoring takes **O(n)** time for *n* questions.

### 16.2 XP eligibility

Reward logic checks whether an action qualifies before adding XP:

- First quiz attempt: 5 participation XP.
- First pass of a lesson: that quiz's configured XP reward.
- Repeated quiz attempts or an already completed lesson: no repeat quiz XP.
- First completion of a game: its configured game reward; replay: 0 XP.

This discourages farming XP by repeatedly submitting the same quiz or game.

### 16.3 Streak calculation

The current activity date and last activity date are compared as calendar dates in the `Asia/Kolkata` timezone:

```text
No previous activity       -> streak = 1
Same calendar day           -> keep streak unchanged
Next consecutive day        -> streak = previous streak + 1
A day or more was missed    -> streak = 1
```

### 16.4 Badge rules

After learning activity, the server checks each badge's condition and adds a badge only if it is newly earned. Examples include: First Step for one completed lesson; Safety Scout for completing Personal Safety; Sharp Thinker for a perfect quiz; Rights Champion for completing all lessons; Game Explorer for the first game; and Game Master for completing all games in the server catalogue.

### 16.5 Levels and progress

For levels, the API compares XP with configured thresholds and selects the highest threshold reached. It calculates progress toward the next threshold as a percentage. For quiz history, progress is grouped by lesson, the best score for each attempted lesson is retained, and those best scores are averaged. These operations are linear in the number of levels or attempts inspected.

### 16.6 Game algorithms

- **Scenario games:** compare the learner's choice with a predefined expected response.
- **Branching stories:** follow predefined graph nodes according to the learner's selected choice.
- **Memory match:** check whether two selected cards have the same pair identifier.
- **Safe Path Maze:** fixed-grid, state-based movement. Each move checks the target cell and bounds, then updates position, collected helpers, or remaining hearts. It does **not** compute a shortest path automatically.

### 16.7 Limitations to state clearly

Game scenario and score logic currently run in the browser. The API checks that submitted score and total values are whole numbers and within allowed bounds, but it does not independently replay every game answer. This is a reasonable simplification for a low-stakes learning MVP. A production leaderboard or high-stakes reward system should validate game outcomes on the server. There is no AI/ML recommendation or prediction component in this project.

### 16.8 Likely algorithm viva question

**Q: Which algorithm is used in the project?**  
A: There is not one single algorithm. The core is a collection of deterministic rule-based algorithms: server-side quiz scoring, one-time XP eligibility, IST-based streak calculation, rule-based badge awarding, XP-level calculation, and state-based game logic. They are simple to test and suit an educational MVP.
