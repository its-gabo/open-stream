#!/bin/sh
set -e

COMMAND="${1:-server}"

case "$COMMAND" in
  server)
    echo "Starting server..."
    exec bun dist/index.js
    ;;
  worker)
    echo "Starting worker..."
    exec bun dist/worker.js
    ;;
  migrate)
    echo "Running migrations..."
    exec bun dist/db/migrate.js
    ;;
  *)
    echo "Usage: entrypoint.sh [server|worker|migrate]"
    exit 1
    ;;
esac
