// Creates or promotes a SafeBuddy admin account. Works with every storage backend, so it
// is the supported way to get an admin into a production deployment, where the demo
// accounts are deliberately not seeded.
//
// Usage:
//   npm run db:admin -- --email=guide@school.org --password='a-long-unique-password' --name='School Guide'
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:admin
//
// If the email already belongs to a learner, that account is promoted and its password reset.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initialiseRepository, closeRepository, findUserByEmail, createUser, updateUser, repositoryMode } from '../services/repository.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=')];
  })
);

const email = (args.email || process.env.ADMIN_EMAIL || '').trim();
const password = args.password || process.env.ADMIN_PASSWORD || '';
const name = (args.name || process.env.ADMIN_NAME || 'SafeBuddy Guide').trim();

if (!email || !password) {
  console.error('Provide an admin email and password:');
  console.error("  npm run db:admin -- --email=guide@school.org --password='a-long-unique-password'");
  console.error('  or set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.');
  process.exit(1);
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('That email address does not look valid.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Use an admin password with at least 12 characters.');
  process.exit(1);
}

try {
  await initialiseRepository();
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await findUserByEmail(email);
  if (existing) {
    await updateUser(existing.id, { role: 'admin', passwordHash, name: name || existing.name });
    console.log(`Promoted ${email} to admin using ${repositoryMode()} storage.`);
  } else {
    await createUser({ name: name || 'SafeBuddy Guide', email, passwordHash, role: 'admin' });
    console.log(`Created admin ${email} using ${repositoryMode()} storage.`);
  }
  console.log('Sign in, then change this password through your normal process if you shared it.');
} catch (error) {
  console.error(`Could not create the admin account: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeRepository();
}
