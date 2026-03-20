#!/bin/sh
set -e
# Bind a minimal HTTP server so Render's port scan succeeds
python -m http.server ${PORT:-8000} &
echo "==> Starting Celery Beat scheduler..."
exec celery -A config.celery beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
