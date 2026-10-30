// End-to-end smoke test for a running SafeBuddy deployment.
//
//   node scripts/smokeTest.mjs https://safebuddy-livid.vercel.app
//   node scripts/smokeTest.mjs http://localhost:5000
//
// Checks the health endpoint, the lesson catalogue, both demo sign-ins, an authenticated
// request with the returned token, and the single-page-app fallback for deep links.

const baseUrl = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');

const results = [];

async function check(name, run) {
  try {
    await run();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, message: error.message });
    console.log(`FAIL  ${name}\n        ${error.message}`);
  }
}

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function json(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

const login = (email, password) =>
  json('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

await check('GET /api/health responds ok', async () => {
  const { status, body } = await json('/api/health');
  expect(status === 200, `expected 200, received ${status}`);
  expect(body.ok === true, `expected ok:true, received ${JSON.stringify(body)}`);
  console.log(`        storage: ${body.storage}`);
});

await check('GET /api/lessons returns seeded lessons', async () => {
  const { status, body } = await json('/api/lessons');
  expect(status === 200, `expected 200, received ${status}`);
  expect(Array.isArray(body.lessons) && body.lessons.length > 0, 'no lessons returned');
  console.log(`        lessons: ${body.lessons.length}`);
});

await check('learner demo sign-in (aarav@example.com)', async () => {
  const { status, body } = await login('aarav@example.com', 'Learn@123');
  expect(status === 200, `expected 200, received ${status} ${JSON.stringify(body)}`);
  expect(typeof body.token === 'string', 'no token in response');
  expect(body.user?.role === 'learner', `unexpected role ${body.user?.role}`);

  const authenticated = await json('/api/auth/me', { headers: { Authorization: `Bearer ${body.token}` } });
  expect(authenticated.status === 200, `GET /api/auth/me expected 200, received ${authenticated.status}`);
  expect(authenticated.body.user?.email === 'aarav@example.com', 'wrong user returned from /api/auth/me');
});

await check('admin demo sign-in (admin@safebuddy.in)', async () => {
  const { status, body } = await login('admin@safebuddy.in', 'Admin@123');
  expect(status === 200, `expected 200, received ${status} ${JSON.stringify(body)}`);
  expect(body.user?.role === 'admin', `unexpected role ${body.user?.role}`);
});

await check('POST /api/auth/login rejects a wrong password', async () => {
  const { status } = await login('aarav@example.com', 'not-the-password');
  expect(status === 401, `expected 401, received ${status}`);
});

await check('GET /api/auth/me without a token is rejected', async () => {
  const { status } = await json('/api/auth/me');
  expect(status === 401, `expected 401, received ${status}`);
});

await check('deep link /signin serves the single-page app', async () => {
  const response = await fetch(`${baseUrl}/signin`);
  const html = await response.text();
  expect(response.status === 200, `expected 200, received ${response.status}`);
  expect(/<div id="root">|SafeBuddy/.test(html), 'response does not look like the app shell');
});

await check('deep link /learn/right-to-learn serves the single-page app', async () => {
  const response = await fetch(`${baseUrl}/learn/right-to-learn`);
  const html = await response.text();
  expect(response.status === 200, `expected 200, received ${response.status}`);
  expect(/<div id="root">|SafeBuddy/.test(html), 'response does not look like the app shell');
});

const failed = results.filter((result) => !result.ok);

console.log(`\n${results.length - failed.length}/${results.length} checks passed against ${baseUrl}`);
if (failed.length) {
  console.log(`Failed: ${failed.map((result) => result.name).join(', ')}`);
  process.exit(1);
}
