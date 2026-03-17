FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && apt-get clean

# Install python dependencies 
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files for production
RUN python manage.py collectstatic --noinput || true

# Port (Render exposes $PORT environment variable)
EXPOSE 8000

# Default command (overridden by render.yaml)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]