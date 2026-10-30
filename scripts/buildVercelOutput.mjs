// Assembles a Vercel Build Output API directory (.vercel/output).
//
// Why this exists: when the project is deployed without a Git connection, Vercel derives its
// routes purely from the files on disk, which does not cover either the /api/* catch-all or the
// single-page-app fallback. Writing .vercel/output lets us declare those routes explicitly:
//
//   * every /api/* request goes to one Node function that runs the Express app;
//   * every other request falls back to index.html so client routes such as /signin and
//     /learn/right-to-learn return 200 instead of a 404;
//   * the built React app is served as static files straight from client/dist.
//
// Usage: node scripts/buildVercelOutput.mjs   (called by bootstrap.sh after the client build)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, '.vercel', 'output');
const functionDir = path.join(outputRoot, 'functions', 'api.func');
const staticDir = path.join(outputRoot, 'static');

const clientDist = path.join(root, 'client', 'dist');
const serverDir = path.join(root, 'server');

if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.error('client/dist/index.html is missing. Run "npm run build" before this script.');
  process.exit(1);
}

if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
  console.error('server/node_modules is missing. Run "npm install --omit=dev --prefix server".');
  process.exit(1);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(functionDir, { recursive: true });

// Static client build.
fs.cpSync(clientDist, staticDir, { recursive: true });

// The API function: Express source, the SQL schema it applies on boot, and its dependencies.
// Paths mirror the repository layout because the source resolves files relative to itself.
for (const entry of ['src', 'db']) {
  fs.cpSync(path.join(serverDir, entry), path.join(functionDir, 'server', entry), { recursive: true });
}
fs.copyFileSync(path.join(serverDir, 'package.json'), path.join(functionDir, 'server', 'package.json'));
fs.cpSync(path.join(serverDir, 'node_modules'), path.join(functionDir, 'server', 'node_modules'), { recursive: true });

fs.writeFileSync(
  path.join(functionDir, 'index.mjs'),
  `// Vercel Node function entry point for every /api/* request.
import { app, initialiseApp } from './server/src/index.js';

let ready;

export default async function handler(request, response) {
  // Routes in .vercel/output/config.json can only target a function by its exact path, so the
  // original path arrives in the __original_path query parameter and is restored here before
  // Express looks at the request.
  const url = new URL(request.url, 'http://localhost');
  const originalPath = url.searchParams.get('__original_path');
  if (originalPath) {
    url.searchParams.delete('__original_path');
    const search = url.searchParams.toString();
    request.url = \`\${originalPath}\${search ? \`?\${search}\` : ''}\`;
  }

  try {
    ready ??= initialiseApp();
    await ready;
  } catch (error) {
    ready = undefined;
    console.error('SafeBuddy API failed to start:', error);
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    const body = { message: 'The SafeBuddy API could not start. Please try again shortly.' };
    // Set SAFEBUDDY_DEBUG_API=1 in the hosting environment to include the failure reason in the
    // response. Keep it off in production once the deployment is healthy.
    if (process.env.SAFEBUDDY_DEBUG_API === '1') {
      body.debug = { name: error?.name, code: error?.code, reason: error?.message, step: error?.step };
    }
    response.end(JSON.stringify(body));
    return;
  }
  return app(request, response);
}
`
);

fs.writeFileSync(
  path.join(functionDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 30
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(outputRoot, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Functions can only be addressed by their exact path, so /api/* is rewritten to /api
        // with the original path carried in a query parameter that the function restores.
        { src: '/api(.*)', dest: '/api?__original_path=/api$1' },
        { handle: 'filesystem' },
        // Single-page app fallback.
        { src: '/(.*)', dest: '/index.html' }
      ]
    },
    null,
    2
  )
);

const sizeMb = (dir) => {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) total += fs.statSync(path.join(entry.parentPath ?? entry.path, entry.name)).size;
  }
  return (total / 1024 / 1024).toFixed(1);
};

console.log(`Vercel output written to ${path.relative(root, outputRoot)}`);
console.log(`  static:   ${sizeMb(staticDir)} MB`);
console.log(`  function: ${sizeMb(functionDir)} MB`);
