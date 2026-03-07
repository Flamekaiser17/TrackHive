import redis
from django.conf import settings

# We will use DB 1 for regular caching/GEO, while DB 0 is used by Celery
# If CELERY_BROKER_URL is not set appropriately, fallback to redis://localhost:6379/1
redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/1')
redis_client = redis.from_url(redis_url, decode_responses=True)
