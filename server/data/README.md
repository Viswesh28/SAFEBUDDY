`demo-db.json` is generated automatically when SafeBuddy starts without `MONGO_URI`.

This provides a working local demonstration without requiring MongoDB. For production or persistent multi-user use, configure `MONGO_URI` in `server/.env`; the server will seed the same starter content into MongoDB on its first run.
