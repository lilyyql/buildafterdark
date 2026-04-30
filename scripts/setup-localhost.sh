#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js 20+ from https://nodejs.org or: brew install node"
  exit 1
fi

npm install
echo ""
echo "Starting dev server at http://localhost:3000"
npm run dev
