#!/usr/bin/env bash
# Vercel build step.
#
# Builds the client, installs the server's production dependencies, then assembles a Build Output
# API directory (.vercel/output) so Vercel gets explicit routes: /api/* -> the Express function,
# everything else -> the React single-page app. See docs/VERCEL_DEPLOYMENT.md.
#
# The script works in both deployment modes:
#   * Git-connected project — Vercel checks the repository out, so the source is already present.
#   * No Git connection — the source is fetched from GitHub, from SOURCE_BRANCH (default: main).
set -euo pipefail

SOURCE_BRANCH="${SOURCE_BRANCH:-main}"

if [[ -f scripts/buildVercelOutput.mjs && -f package.json ]]; then
  echo "Building from the checked-out source (${SOURCE_BRANCH})."
else
  echo "No source in the build directory; fetching ${SOURCE_BRANCH} from GitHub."
  curl -fsSL "https://codeload.github.com/Viswesh28/SAFEBUDDY/tar.gz/refs/heads/${SOURCE_BRANCH}" -o /tmp/safebuddy.tgz
  tar -xzf /tmp/safebuddy.tgz --strip-components=1
  rm -rf /tmp/safebuddy.tgz
fi

npm run install:all
npm run build
npm install --omit=dev --prefix server
node scripts/buildVercelOutput.mjs
