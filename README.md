# SafeBuddy

> **Learn your rights. Find your voice. Grow with confidence.**

SafeBuddy is a child-friendly, gamified learning platform for children's rights awareness and introductory legal literacy in India. It translates the project proposal into a functional MERN-style MVP with short lessons, friendly quizzes, progress tracking, XP, badges, interactive safety games, and an admin content workspace.

![SafeBuddy stack](https://img.shields.io/badge/Stack-React%20%2B%20Express%20%2B%20MongoDB-5B5CE2?style=flat-square) ![Audience](https://img.shields.io/badge/Audience-Children%20%26%20young%20learners-1D9E75?style=flat-square) ![Status](https://img.shields.io/badge/Status-MVP-E6A535?style=flat-square)

## Why it exists

The project brief identifies a gap in children's ability to understand their rights and legal protections. SafeBuddy approaches that gap through approachable, age-appropriate learning experiences rather than dense legal text.

The starter curriculum covers:

- **Right to Education** — learning, inclusion, and being heard at school
- **Personal safety and trusted help** — boundaries, trusted adults, POCSO awareness, and emergency signposting
- **Safe childhood** — school, play, child-labour awareness, and respectful action
- **Care, fairness, and fresh starts** — the child-centred principles behind juvenile justice and protection

> **Important:** SafeBuddy is an educational prototype, not a substitute for legal advice, safeguarding services, professional counselling, or emergency support. In an immediate emergency in India, call **112** and seek help from a trusted adult.

## Features

### Learner experience

- Friendly landing page and secure registration/sign-in flow
- Four starter lessons with collapsible, easy-to-read learning sections
- Quiz flow that does not expose answers before submission
- Score feedback with explanations for every answer
- XP, streaks, completion tracking, and achievement badges (see [XP and rewards](#xp-and-rewards))
- Three interactive safety games: *Safe or Not?*, *Trusted Helper Match*, and *Safe Path Maze* (see [Safety games](#safety-games))
- Personal learning journey with recent quiz activity
- Responsive layout for desktop and mobile

### Admin experience

- Dedicated guide/admin workspace
- View published learning content
- Publish a new lesson with a first learning section
- Publish a quiz question attached to an existing lesson
- Child-first content guidance inside the workspace

### Technical highlights

- React + Vite frontend with React Router
- Express REST API with JWT-based auth and role checks
- MongoDB/Mongoose schemas for users, lessons, quizzes, and attempts
- **Zero-setup demo mode:** if `MONGO_URI` is absent, the API uses a local SQLite database (created automatically) so the whole platform still works immediately
- MongoDB auto-seeding for the same starter content when `MONGO_URI` is configured
- Protected routes, password hashing with bcrypt, Helmet, CORS, and input validation

## Quick start

### Prerequisites

- Node.js 22.13+ (or 24 LTS) and npm — the server uses Node's built-in SQLite, so no native build step is needed
- Optional: MongoDB 7+ (or a MongoDB Atlas connection string) for database-backed persistence

### Installation

```bash
git clone https://github.com/YOUR-USERNAME/safebuddy.git
cd safebuddy
npm run install:all
```

Create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

Start the client and API together:

```bash
npm run dev
```

- Client: `http://localhost:5173`
- API health check: `http://localhost:5000/api/health`

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Learner | `aarav@example.com` | `Learn@123` |
| Admin | `admin@safebuddy.in` | `Admin@123` |

The learner sign-in screen also includes a **Use learner demo account** shortcut.

## Database modes

### Local SQLite mode (default)

No database configuration is required. When the server starts without `MONGO_URI`, it creates `server/data/safebuddy.sqlite` (SQLite) with starter content and demo users. The file is intentionally ignored by Git; set `SQLITE_PATH` to change its location.

### MongoDB mode

Set `MONGO_URI` in `server/.env`:

```dotenv
PORT=5000
JWT_SECRET=use-a-long-unique-random-secret
MONGO_URI=mongodb://127.0.0.1:27017/safebuddy
CLIENT_ORIGIN=http://localhost:5173
```

On its first connection to an empty database, the API seeds the four lessons, their quizzes, and the demo accounts automatically.

## XP and rewards

All XP rules are enforced on the server (`server/src/services/rewards.js`).

| Action | XP |
| --- | --- |
| First attempt at a lesson quiz | +5 (participation) |
| First time you pass a lesson quiz | + the quiz's XP reward (default 30) |
| Repeating a quiz or a passed lesson | 0 |
| First completion of each safety game | +25 to +30 (per game) |
| Replaying a safety game | 0 |

Streaks count days in Indian Standard Time. Activity on the next day adds one to the streak, and a missed day resets it to 1.

Badges: First Step, Safety Scout, Sharp Thinker, Rights Champion, Game Explorer (first game), and Game Master (all games).

## Safety games

Open **Play** in the learner menu. Each game is a short, original activity:

- **Safe or Not?** Decide whether everyday situations are safe, not safe, or need a trusted adult.
- **Trusted Helper Match.** Choose the right person or helpline for each worry. It includes CHILDLINE 1098 and 112.
- **Safe Path Maze.** Guide your buddy home using the arrow keys, WASD, or on-screen buttons. Collect trusted helpers and avoid risky spots, which cost a heart.

Games are for practice. The server records each completion, awards XP only the first time, and checks the reported score against the game total.

## Open-source credits

SafeBuddy is built with open-source software: React, Vite, React Router, Express, SQLite (`sqlite3`), Mongoose, bcryptjs, jsonwebtoken, Helmet, and canvas-confetti (ISC). The game designs and scenarios are original to SafeBuddy. For further child-safety learning, the open-source [KSG Kid-Safe Games](https://github.com/CaptainLWS/KSG_Kid-Safe-Games) catalogue (MIT) and [eduActiv8](https://www.eduactiv8.org/) (open source) are good places to explore.

## Project structure

```text
safebuddy/
├── client/                  # React + Vite interface
│   └── src/
│       ├── components/      # Navigation, protected routes, reusable UI
│       ├── contexts/        # Authentication state
│       ├── pages/           # Learner and admin views
│       └── utils/           # API client
├── server/                  # Express API
│   └── src/
│       ├── middleware/      # JWT and role guards
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Auth, lessons, quizzes, progress
│       └── services/        # Seed content and storage repository
├── docs/                    # Product brief and architecture notes
├── .env.example
└── package.json
```

## API overview

| Area | Route | Access |
| --- | --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| Current user | `GET /api/auth/me` | Signed-in user |
| Lessons | `GET /api/lessons`, `GET /api/lessons/:id` | Public API / app token |
| Lesson authoring | `POST /api/lessons`, `PATCH /api/lessons/:id` | Admin |
| Lesson quiz | `GET /api/quizzes/lesson/:lessonId` | Signed-in learner |
| Quiz submit | `POST /api/quizzes/:quizId/submit` | Signed-in learner |
| Learning progress | `GET /api/progress/me` | Signed-in learner |
| Games catalogue | `GET /api/games` | Signed-in learner |
| Complete a game | `POST /api/games/:gameId/complete` | Signed-in learner |

## Validation performed

```bash
npm run build --prefix client
```

Automated checks:

```bash
npm test --prefix server   # XP, streak, badge and game-reward rules (unit tests)
```

The API and the browser UI have also been exercised end to end: sign-in for learner and admin, lesson reading, quiz scoring and XP, game completion and replay rules, badges, progress pages, admin quiz additions, and the removed leaderboard route.

## Notes for a production release

This academic MVP provides a strong functional starting point. Before a public release, add:

1. Expert legal and child-safeguarding review of every content item, translated string, and external support number.
2. A verified age-assurance, parental-consent, privacy, moderation, incident-response, and data-retention design.
3. Rate limiting, CSRF strategy where relevant, audit logging, stronger production validation, tests, and monitoring.
4. A dedicated CMS/question editor that supports multi-question quiz editing, draft review, publishing workflow, and versioning.
5. Accessibility testing with real learners, educators, and diverse language communities; then add approved multilingual translations.

## Source material

This implementation is based on the supplied **SafeBuddy – Weekly Work Distribution** document. It reflects its stated project aim, MERN architecture direction, gamification goals (quizzes, badges, leaderboards, storytelling), child-rights topics, learning progress/reporting requirements, and learner/admin scope.

See [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the project traceability and technical design.
