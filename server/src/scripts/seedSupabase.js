// Seeds the starter lessons, quizzes and (outside production) the demo accounts.
// Safe to re-run: seeding stops as soon as any lesson exists.
import 'dotenv/config';
import { initialiseSupabase, closeSupabase, totalCounts } from '../services/supabaseRepository.js';

if (!process.env.SUPABASE_DB_URL) {
  console.error('Set SUPABASE_DB_URL (a postgres:// connection string) before running db:seed.');
  process.exit(1);
}

try {
  // Applies the schema first, then inserts the starter content when the lessons table is empty.
  await initialiseSupabase();
  const counts = await totalCounts();
  console.log(`Seed complete. Published lessons: ${counts.lessons}`);
} catch (error) {
  console.error(`Could not seed SafeBuddy content: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeSupabase();
}
