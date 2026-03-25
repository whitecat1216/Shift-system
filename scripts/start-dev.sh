#!/bin/sh

set -eu

LOCKFILE_STAMP="node_modules/.package-lock.stamp"

needs_install="false"

if [ ! -d "node_modules/pg" ]; then
  needs_install="true"
fi

if [ ! -f "$LOCKFILE_STAMP" ]; then
  needs_install="true"
fi

if [ "$needs_install" = "false" ] && [ "package-lock.json" -nt "$LOCKFILE_STAMP" ]; then
  needs_install="true"
fi

if [ "$needs_install" = "true" ]; then
  echo "Installing npm dependencies inside container..."
  npm ci
  cp package-lock.json "$LOCKFILE_STAMP"
fi

exec npm run dev -- --hostname 0.0.0.0
