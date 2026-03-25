import redis
from django.conf import settings

# ISSUE 1: Connection Pool with retry logic for production stability
connection_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=20,
    socket_keepalive=True,
    socket_keepalive_options={},
    retry_on_timeout=True,
    health_check_interval=30,
)

redis_client = redis.Redis(connection_pool=connection_pool)
