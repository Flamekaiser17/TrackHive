#!/bin/sh
set -e
echo "==> Running migrations..."
python manage.py migrate --noinput
echo "==> Starting Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
