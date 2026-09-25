#!/bin/sh
set -e

REPO_URL="${FRONTEND_REPO_URL:-https://github.com/n1k1tal0x/assistan_testtask_front.git}"

git clone --depth 1 "$REPO_URL" /app
cd /app
npm ci
exec npm run dev -- --host 0.0.0.0 --port 5173
