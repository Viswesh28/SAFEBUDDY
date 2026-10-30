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

// The API function: Express source plus its production dependencies.
fs.cpSync(path.join(serverDir, 'src'), path.join(functionDir, 'server', 'src'), { recursive: true });
fs.copyFileSync(path.join(serverDir, 'package.json'), path.join(functionDir, 'server', 'package.json'));
fs.cpSync(path.join(serverDir, 'node_modules'), path.join(functionDir, 'server', 'node_modules'), { recursive: true });

fs.writeFileSync(
  path.join(functionDir, 'index.mjs'),
  `// Vercel Node function entry point for every /api/* request.
import { app, initialiseApp } from './server/src/index.js';

let ready;

export default async function handler(request, response) {
  try {
    ready ??= initialiseApp();
    await ready;
  } catch (error) {
    ready = undefined;
    console.error('SafeBuddy API failed to start:', error);
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ message: 'The SafeBuddy API could not start. Please try again shortly.' }));
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
        // Keep the full request path ($1) so Express still sees /api/auth/login and friends.
        { src: '/api/(.*)', dest: '/api/$1' },
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
