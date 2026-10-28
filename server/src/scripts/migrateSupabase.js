// Applies server/db/schema.sql to the Supabase database named by SUPABASE_DB_URL.
// The server also runs this on every boot, so the command is mainly for first-time setup,
// CI checks, and confirming what exists.
import 'dotenv/config';
import { createPool, applySchema, closeSupabase } from '../services/supabaseRepository.js';

if (!process.env.SUPABASE_DB_URL) {
  console.error('Set SUPABASE_DB_URL (a postgres:// connection string) before running db:migrate.');
  process.exit(1);
}

const pool = createPool(process.env.SUPABASE_DB_URL);
try {
  await applySchema(pool);
  const { rows } = await pool.query(`
    SELECT table_name, (SELECT COUNT(*)::int FROM information_schema.columns c WHERE c.table_name = t.table_name) AS columns
      FROM information_schema.tables t
     WHERE table_schema = current_schema() AND table_name IN ('users', 'lessons', 'quizzes', 'attempts')
     ORDER BY table_name`);
  const counts = await pool.query(`
    SELECT (SELECT COUNT(*)::int FROM users) AS users,
           (SELECT COUNT(*)::int FROM lessons) AS lessons,
           (SELECT COUNT(*)::int FROM quizzes) AS quizzes,
           (SELECT COUNT(*)::int FROM attempts) AS attempts`);
  console.log('Schema applied. Tables:', rows.map((row) => `${row.table_name} (${row.columns} columns)`).join(', ') || 'none');
  console.log('Row counts:', counts.rows[0]);
} catch (error) {
  console.error(`Could not apply the SafeBuddy schema: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
  await closeSupabase();
}
