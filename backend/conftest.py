import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from agents.models import DeliveryAgent
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def agent_user(db):
    user = User.objects.create_user(
        username='test_agent',
        email='agent@test.com',
        password='password123',
        role='agent'
    )
    return user

@pytest.fixture
def agent_profile(agent_user):
    return DeliveryAgent.objects.create(
        user=agent_user,
        status='available',
        current_lat=12.97,
        current_lng=77.59
    )

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='test_admin',
        email='admin@test.com',
        password='password123',
        role='admin'
    )
    return user

@pytest.fixture
def admin_token(admin_user):
    refresh = RefreshToken.for_user(admin_user)
    return str(refresh.access_token)

@pytest.fixture(autouse=True)
def clear_throttle_cache():
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()

@pytest.fixture
def auth_client(api_client, admin_token):
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
    return api_client
