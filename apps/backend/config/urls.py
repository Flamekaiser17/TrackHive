from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt

def health_check(request):
    # Extremely fast, no DB queries, no auth required
    return JsonResponse({"status": "healthy"})

@csrf_exempt
def demo_login(request):
    User = get_user_model()
    user, created = User.objects.get_or_create(
        email='demo@trackhive.com',
        defaults={'username': 'Recruiter Demo', 'role': 'admin'}
    )
    if created:
        user.set_password('demo_secret_2024')
        user.save()
        
    refresh = RefreshToken.for_user(user)
    return JsonResponse({
        'access': str(refresh.access_token),
        'refresh': str(refresh)
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/core/', include('core.urls')),
    path('api/agents/', include('agents.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/anomalies/', include('anomaly.urls')),
    path('api/tracking/', include('tracking.urls')),
    path('api/simulate/', include('simulator.urls')),
    path('health/', health_check, name='health-check'),
    path('demo/', demo_login, name='demo-login'),
    # Keep legacy routing just in case
    path('api/health/', health_check),
    path('', health_check),
]