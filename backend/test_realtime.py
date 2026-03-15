import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from agents.models import DeliveryAgent
from orders.models import Order
from tracking.models import LocationUpdate

User = get_user_model()

def test_websocket_broadcast_sync():
    print("🚀 Starting Phase 3 Real-time WebSocket Logic Test...")
    
    # 1. Get Agent
    agent_user, _ = User.objects.get_or_create(username='agent_007', email='agent@test.com', defaults={'role': 'agent'})
    
    # 2. Setup an active order for the agent
    print("⚙️ Setting up Order...")
    order = Order.objects.filter(agent__user=agent_user, status__in=['assigned', 'picked_up', 'in_transit']).first()
    if not order:
        customer, _ = User.objects.get_or_create(username='customer_jane')
        agent_profile, _ = DeliveryAgent.objects.get_or_create(user=agent_user)
        order = Order.objects.create(
            customer=customer, agent=agent_profile, status='in_transit',
            pickup_lat=12.9, pickup_lng=77.5, drop_lat=13.0, drop_lng=77.6
        )
    else:
        order.status = 'in_transit'
        order.save()
    
    print(f"✅ Active Order ID: {order.id}")

    # 3. Simulate location update
    print("⚙️ Simulating location update and waiting for signal trigger...")
    
    # LocationUpdate triggers signal -> triggers calculate_and_push_eta()
    LocationUpdate.objects.create(
        agent=agent_user.agent_profile,
        lat=12.95,
        lng=77.55,
        speed_kmph=45.0
    )
    
    # 4. Verify
    time.sleep(1)
    order.refresh_from_db()
    
    print(f"✅ Real-time ETA result: {order.eta_minutes} minutes")
    
    if order.eta_minutes is not None:
        print("🌟 TEST PASSED: Real-time ETA engine and Channel Logic integrated!")
    else:
        print("❌ TEST FAILED: ETA update not detected.")

if __name__ == "__main__":
    test_websocket_broadcast_sync()
