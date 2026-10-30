// A predictable development-only key keeps the zero-setup demo convenient.
// Production deployments must supply a unique secret through the environment.
const developmentSecret = 'safebuddy-local-development-only-secret-change-before-deploy';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}

export const JWT_SECRET = process.env.JWT_SECRET || developmentSecret;

// Supabase is optional, but a malformed connection string should fail at boot rather than
// on the first sign-in attempt.
if (process.env.SUPABASE_DB_URL && !/^postgres(ql)?:\/\//i.test(process.env.SUPABASE_DB_URL)) {
  throw new Error('SUPABASE_DB_URL must be a postgres:// or postgresql:// connection string.');
}

// SQLite lives on the local filesystem. On most hosts that storage disappears on the next
// deploy, so say so loudly instead of losing learner progress silently.
if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URI && !process.env.SUPABASE_DB_URL) {
  console.warn('No MONGO_URI or SUPABASE_DB_URL set: SafeBuddy will use a local SQLite file. ' +
    'Learner progress will be lost if the host has no persistent disk.');
}
