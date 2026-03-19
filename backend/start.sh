#!/bin/sh
set -e
echo "==> Running migrations..."
python manage.py migrate --noinput
echo "==> Seeding demo data..."
python manage.py seed_demo
echo "==> Starting Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
