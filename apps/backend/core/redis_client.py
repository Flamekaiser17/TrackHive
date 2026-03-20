import os
import redis

# Use REDIS_URL from environment for both Render and local Docker
REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/1')

connection_pool = redis.ConnectionPool.from_url(
    REDIS_URL,
    max_connections=20,
    socket_keepalive=True,
    retry_on_timeout=True,
    health_check_interval=30,
)

redis_client = redis.Redis(connection_pool=connection_pool)
