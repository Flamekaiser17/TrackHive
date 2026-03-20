from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.utils import timezone
from core.redis_client import redis_client
from config.celery import app as celery_app

class HealthCheckView(APIView):
    permission_classes = [] # Public for Render

    def get(self, request):
        health_status = {
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
            "celery": "workers_active",
            "timestamp": timezone.now().isoformat(),
            "version": "1.0.0"
        }
        
        # 1. Check Database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            health_status["status"] = "unhealthy"
            health_status["database"] = "disconnected"

        # 2. Check Redis
        try:
            redis_client.ping()
        except Exception:
            health_status["status"] = "unhealthy"
            health_status["redis"] = "disconnected"

        # 3. Check Celery
        try:
            inspect = celery_app.control.inspect()
            active = inspect.active()
            if not active:
                # We don't mark unhealthy if workers are just busy, but if none at all respond
                health_status["celery"] = "no_workers_found"
        except Exception:
            health_status["celery"] = "inspector_failed"

        if health_status["status"] == "unhealthy":
            return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(health_status)
