from django.contrib import admin
from django.urls import path, include
from rest_framework.throttling import AnonRateThrottle
from rest_framework.decorators import api_view, throttle_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def health_check(request):
    return Response({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/core/', include('core.urls')),
    path('api/agents/', include('agents.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/anomalies/', include('anomaly.urls')),
    path('api/tracking/', include('tracking.urls')),
    path('api/simulate/', include('simulator.urls')),
    path('api/health/', health_check, name='health-check'),
    path('', health_check, name='root-health'),
]