#!/bin/sh
set -e
# Bind a minimal HTTP server so Render's port scan succeeds
python -m http.server ${PORT:-8000} &
echo "==> Starting Celery worker..."
exec celery -A config.celery worker --loglevel=info --concurrency=2
