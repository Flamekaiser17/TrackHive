#!/bin/sh
set -e
# Service type: worker (No port binding needed)
echo "==> Starting Celery worker..."
exec celery -A config.celery worker --loglevel=info --concurrency=2
