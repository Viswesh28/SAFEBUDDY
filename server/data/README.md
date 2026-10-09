`safebuddy.sqlite` is created automatically in this folder the first time the server starts without `MONGO_URI`.

It holds the SQLite database for local demo and development use, including starter lessons, quizzes, demo accounts, learner progress, and quiz attempts. Set `SQLITE_PATH` in `server/.env` to store it somewhere else. The file is ignored by Git.

For production or multi-user deployments, configure `MONGO_URI` in `server/.env`; the server will seed the same starter content into MongoDB on its first run.
