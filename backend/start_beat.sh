#!/bin/sh
set -e
# Service type: worker (Scheduler only)
echo "==> Starting Celery Beat scheduler..."
exec celery -A config.celery beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
