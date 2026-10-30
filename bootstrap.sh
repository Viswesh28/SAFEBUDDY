#!/usr/bin/env bash
# Vercel build step: fetch the SafeBuddy source from GitHub, then install and build.
# Also writes a 404.html copy of the app shell as a fallback for hosts that ignore middleware.
set -euo pipefail
BRANCH="arena/7276d320-safebuddy"
curl -fsSL "https://codeload.github.com/Viswesh28/SAFEBUDDY/tar.gz/refs/heads/${BRANCH}" -o /tmp/safebuddy.tgz
tar -xzf /tmp/safebuddy.tgz --strip-components=1
rm -rf /tmp/safebuddy.tgz
npm run install:all
npm run build
cp client/dist/index.html client/dist/404.html
