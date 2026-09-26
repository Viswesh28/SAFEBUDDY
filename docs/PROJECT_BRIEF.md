# SafeBuddy: project brief and traceability

## Product statement

**SafeBuddy** is a gamified educational platform that helps children explore their rights, personal safety, and introductory legal literacy in an age-appropriate Indian context.

## Requirements derived from the supplied weekly work distribution

| Source theme | Product decision in this implementation |
| --- | --- |
| Children's rights and legal literacy in India | Four starter learning pathways on education, personal safety, safe childhood, and care/fairness. |
| POCSO, Right to Education, Child Labour, Juvenile Justice | Age-appropriate introductory references inside lessons, paired with a non-legal-advice disclaimer. |
| Gamification: quizzes, badges, leaderboards, storytelling | Short scenario-oriented lessons, 3-question quizzes, XP, achievement badges, streaks, and an encouraging leaderboard. |
| MERN architecture and REST APIs | React/Vite interface, Express API, Mongoose schemas, JWT authentication, REST routes, and optional MongoDB persistence. |
| Authentication, user management, and progress tracking | Learner registration/sign-in, role-based admin guard, completed lessons, attempts, XP, badges, and activity timeline. |
| Learning modules, reporting, and progress | Course library, learning detail pages, quiz results, learner journey, and admin content workspace. |
| Usability, accessibility, security, multilingual support | Responsive keyboard-friendly interface, readable layout, semantic controls, password hashing, Helmet, CORS, and a clear future path for reviewed translations. |

## Primary users

### Learner

A child or young learner who wants friendly, short, safe explanations and simple ways to practise understanding. The learner should never be pressured to disclose a real-life situation to use the product.

### Content guide / administrator

An educator or designated project administrator who reviews and publishes age-appropriate lessons and quiz questions.

## Key user journeys

1. **Start safely** — learner opens SafeBuddy, creates a learner account or enters using the demo account.
2. **Explore a topic** — learner selects a concise lesson from the card-based learning path.
3. **Reflect and practise** — learner reads one section at a time and takes a short check-for-understanding quiz.
4. **See progress** — learner receives simple explanations, XP, possible badges, updated completion status, and activity history.
5. **Guide content** — administrator enters the Guide Space to publish a lesson or a quiz question.

## Content approach

The starter content deliberately uses supportive language such as *trusted adult*, *safe support*, *you are not to blame*, and *ask for help*. It avoids asking children to share sensitive details. It provides emergency signposting only as basic educational information and should be reviewed by qualified safeguarding and legal professionals before any live public use.

## MVP boundaries

Included: authentication, learner/admin roles, four content lessons, quizzes, progress, XP, badges, leaderboard, a responsive UI, and MongoDB-ready API structure.

Deferred: professional content review workflow, multilingual copy, teacher/class cohorts, parental controls, real-world incident reporting, analytics, notifications, formal accessibility audit, production observability, and public deployment hardening.
