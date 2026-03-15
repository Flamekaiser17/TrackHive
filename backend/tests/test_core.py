import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.urls import reverse
from users.models import User
from agents.models import DeliveryAgent
from orders.models import Order
from anomaly.models import AnomalyLog
from django.utils import timezone

from unittest.mock import patch, MagicMock

@pytest.fixture(autouse=True)
def mocked_redis():
    with patch('core.views.redis_client') as mock_core:
        with patch('orders.services.redis_client') as mock_orders:
            # Setup mock for georadius in assignment
            mock_orders.georadius.return_value = [('1', 0.5)] # Agent ID 1, dist 0.5km
            mock_orders.set.return_value = True # Lock acquired
            
            # Setup mock for health check
            mock_core.ping.return_value = True
            
            yield {
                'core': mock_core,
                'orders': mock_orders
            }

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username='admin_ops',
        email='admin@trackhive.com',
        password='access_key_123',
        role='admin'
    )

@pytest.fixture
def auth_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client

@pytest.fixture
def agent(admin_user):
    # Agents need a corresponding user
    agent_user = User.objects.create_user(username='agent_007', role='agent')
    return DeliveryAgent.objects.create(
        user=agent_user,
        status='available',
        current_lat=12.9716,
        current_lng=77.5946
    )

@pytest.fixture
def customer(db):
    return User.objects.create_user(username='customer_01', role='customer')

# --- TEST 1: JWT Auth Works ---
@pytest.mark.django_db
def test_jwt_auth_works(api_client, admin_user):
    url = '/api/auth/login/'
    data = {
        'username': 'admin_ops',
        'password': 'access_key_123'
    }
    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data

# --- TEST 2: Fatigue Score Calculation ---
@pytest.mark.django_db
def test_fatigue_score_calculation(agent):
    # Setting high intensity telemetry
    agent.orders_last_4hrs = 5
    agent.total_km_today = 30
    agent.hours_active = 4
    # Formula: 5*0.4 + 30*0.3 + 4*0.3 = 2.0 + 9.0 + 1.2 = 12.2
    # Capped at 10.0
    fatigue = agent.calculate_fatigue()
    assert fatigue == 10.0
    
    # Testing low intensity: 1*0.4 + 5*0.3 + 1*0.3 = 0.4 + 1.5 + 0.3 = 2.2
    agent.orders_last_4hrs = 1
    agent.total_km_today = 5
    agent.hours_active = 1
    fatigue = agent.calculate_fatigue()
    assert fatigue == 2.2

# --- TEST 3: Order Assignment — No Double Assign ---
@pytest.mark.django_db
def test_order_assignment_no_double_assign(auth_client, customer, agent):
    # Creating an unassigned order
    order = Order.objects.create(
        customer=customer,
        pickup_lat=12.97, pickup_lng=77.59,
        drop_lat=12.98, drop_lng=77.60,
        status='created'
    )
    # Creating another agent for race condition testing
    u2 = User.objects.create_user(username='agent_008', role='agent')
    a2 = DeliveryAgent.objects.create(user=u2, status='available')
    
    url = reverse('order-assign', kwargs={'pk': order.id})
    
    # Sequential calls (Atomic block or service logic should handle double assignment)
    res1 = auth_client.post(url)
    res2 = auth_client.post(url)
    
    order.refresh_from_db()
    # Ensure only 1 agent assigned
    assert order.agent is not None
    assert order.status == 'assigned'
    
    # Ensure one agent became busy, the other stayed available
    # Actually counting busy agents
    busy_count = DeliveryAgent.objects.filter(status='busy').count()
    assert busy_count == 1

# --- TEST 4: Health Endpoint Returns 200 ---
@pytest.mark.django_db
def test_health_endpoint_returns_200(api_client):
    url = '/api/health/health/' # Based on config/urls.py mapping api/health/ -> include(core.urls) -> health/
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert 'status' in response.data
    assert 'database' in response.data
    assert 'redis' in response.data
    assert response.data['status'] == 'healthy' #core/views.py has 'healthy' not 'ok' in current code

# --- TEST 5: Anomaly Log Creation ---
@pytest.mark.django_db
def test_anomaly_log_creation_and_resolution(auth_client, agent, customer):
    order = Order.objects.create(
        customer=customer, pickup_lat=0, pickup_lng=0, drop_lat=0, drop_lng=0
    )
    # Create anomaly
    anomaly = AnomalyLog.objects.create(
        agent=agent,
        order=order,
        anomaly_type='speed_anomaly',
        resolved=False
    )
    
    # List anomalies
    url_list = reverse('anomaly-list')
    res_list = auth_client.get(url_list)
    assert res_list.status_code == status.HTTP_200_OK
    # Current code returns results as list if DefaultRouter used
    anomalies_data = res_list.data
    assert any(an['id'] == anomaly.id for an in anomalies_data)
    
    # Resolve anomaly
    url_resolve = reverse('anomaly-resolve', kwargs={'pk': anomaly.id})
    res_resolve = auth_client.patch(url_resolve)
    assert res_resolve.status_code == status.HTTP_200_OK
    
    anomaly.refresh_from_db()
    assert anomaly.resolved == True
    assert anomaly.resolved_at is not None
