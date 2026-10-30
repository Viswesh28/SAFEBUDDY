#!/usr/bin/env bash
# Vercel build step.
#
# This project is deployed without a Git connection, so the build step fetches the source from
# GitHub itself, installs and builds the client, then assembles a Build Output API directory
# (.vercel/output) so Vercel gets explicit routes: /api/* -> Express function, everything else
# -> the React single-page app.
set -euo pipefail
BRANCH="arena/7276d320-safebuddy"
curl -fsSL "https://codeload.github.com/Viswesh28/SAFEBUDDY/tar.gz/refs/heads/${BRANCH}" -o /tmp/safebuddy.tgz
tar -xzf /tmp/safebuddy.tgz --strip-components=1
rm -rf /tmp/safebuddy.tgz
npm run install:all
npm run build
npm install --omit=dev --prefix server
node scripts/buildVercelOutput.mjs
