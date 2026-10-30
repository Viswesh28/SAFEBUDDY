#!/usr/bin/env bash
# Vercel build step: fetch the SafeBuddy source, then install and build.
# Used because the Vercel project is not linked to GitHub yet.
set -euo pipefail
BRANCH="arena/7276d320-safebuddy"
curl -fsSL "https://codeload.github.com/Viswesh28/SAFEBUDDY/tar.gz/refs/heads/${BRANCH}" -o /tmp/safebuddy.tgz
tar -xzf /tmp/safebuddy.tgz --strip-components=1
rm -rf /tmp/safebuddy.tgz
npm run install:all
npm run build
