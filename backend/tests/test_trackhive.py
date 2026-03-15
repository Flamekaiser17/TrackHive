import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.test import override_settings
from agents.models import DeliveryAgent
from orders.models import Order
from anomaly.models import AnomalyLog
from orders.services import assign_order

@pytest.mark.django_db
class TestTrackHive:

    # Test 1 — Fatigue Score Logic
    def test_fatigue_score_logic(self, agent_profile):
        assert agent_profile.fatigue_score == 0.0
        
        # Simulate orders activity (updates fields used in calculate_fatigue)
        agent_profile.orders_last_4hrs = 5
        agent_profile.total_km_today = 25.0
        agent_profile.hours_active = 4.0
        agent_profile.calculate_fatigue()
        
        assert agent_profile.fatigue_score > 0.0
        # (5 * 0.4) + (25 * 0.3) + (4 * 0.3) = 2.0 + 7.5 + 1.2 = 10.7 (capped at 10.0)
        assert agent_profile.fatigue_score <= 10.0

    # Test 2 — No Double Assignment (Redis lock mock)
    def test_no_double_assignment(self, agent_profile, admin_user):
        # Create two orders
        order1 = Order.objects.create(
            customer=admin_user, pickup_lat=12.97, pickup_lng=77.59, 
            drop_lat=12.98, drop_lng=77.60, status='created'
        )
        order2 = Order.objects.create(
            customer=admin_user, pickup_lat=12.97, pickup_lng=77.59, 
            drop_lat=12.98, drop_lng=77.60, status='created'
        )

        # Mock Redis for availability and locking
        with patch('orders.services.redis_client') as mock_redis:
            # Mock agent is found in georadius
            mock_redis.georadius.return_value = [[str(agent_profile.id), 0.1]]
            
            # First assignment succeeds (lock acquired)
            mock_redis.set.return_value = True
            success1, _ = assign_order(order1.id)
            
            # Second assignment fails if lock not acquired (simulating race)
            mock_redis.set.return_value = False
            success2, _ = assign_order(order2.id)

            assert success1 is True
            assert success2 is False
            
            agent_profile.refresh_from_db()
            assert agent_profile.status == 'busy'
            assert Order.objects.filter(agent=agent_profile).count() == 1

    # Test 3 — Anomaly Detection
    def test_anomaly_detection_creation(self, agent_profile):
        AnomalyLog.objects.create(
            agent=agent_profile,
            anomaly_type='speed_anomaly',
            resolved=False
        )
        
        assert AnomalyLog.objects.count() == 1
        anomaly = AnomalyLog.objects.first()
        assert anomaly.anomaly_type == 'speed_anomaly'
        assert anomaly.resolved is False

    # Test 4 — JWT Auth Enforcement
    def test_jwt_auth_enforcement(self, api_client):
        url = reverse('agent-list')
        response = api_client.get(url)
        assert response.status_code == 401

    # Test 5 — Rate Limiting
    def test_rate_limiting_anonymous(self, api_client):
        """
        Test that rate limiting returns 429 after limit exceeded.
        Senior Dev Note: We mock both 'allow_request' and 'wait' to ensure 
        DRF has all the states it needs when it decides to throttle a request.
        """
        from rest_framework.throttling import AnonRateThrottle
        
        call_count = {'count': 0}
        
        def mock_allow_request(self_throttle, request, view):
            call_count['count'] += 1
            if call_count['count'] > 20:
                return False
            return True

        def mock_wait(self_throttle):
            return 60  # Return a valid wait time to avoid AttributeError
        
        url = reverse('health-check')
        extra = {'REMOTE_ADDR': '127.0.0.1'}
        
        with patch.object(AnonRateThrottle, 'allow_request', mock_allow_request):
            with patch.object(AnonRateThrottle, 'wait', mock_wait):
                for _ in range(20):
                    response = api_client.get(url, **extra)
                    assert response.status_code == 200
                
                response = api_client.get(url, **extra)
                assert response.status_code == 429
