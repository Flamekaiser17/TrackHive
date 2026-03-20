import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from agents.models import DeliveryAgent
from orders.models import Order
from orders.services import assign_order
from tracking.models import LocationUpdate
import time

User = get_user_model()

def run_test():
    print("🚀 Starting Phase 2 Integration Test...")
    
    # 1. Setup User & Agent
    agent_user, _ = User.objects.get_or_create(username='agent_007', email='agent@test.com', defaults={'role': 'agent'})
    agent_user.set_password('password123')
    agent_user.role = 'agent'
    agent_user.save()

    agent_profile, _ = DeliveryAgent.objects.get_or_create(
        user=agent_user,
        defaults={'status': 'available', 'current_lat': 12.97, 'current_lng': 77.59}
    )
    agent_profile.status = 'available'
    agent_profile.save()
    print(f"✅ Agent Profile Ready: {agent_user.username}")

    # 2. Update Location (Simulate REST Update)
    # This triggers the signal -> Redis GEO + Anomaly Check
    LocationUpdate.objects.create(
        agent=agent_profile,
        lat=12.9715,
        lng=77.5945,
        speed_kmph=35.0
    )
    print("✅ Location Updated (Redis GEO populated via Signal)")

    # 3. Create Order
    customer_user, _ = User.objects.get_or_create(username='customer_jane', defaults={'role': 'customer'})
    order = Order.objects.create(
        customer=customer_user,
        pickup_lat=12.9710,
        pickup_lng=77.5940,
        drop_lat=12.9800,
        drop_lng=77.6000,
        status='created'
    )
    print(f"✅ Order Created ID: {order.id}")

    # 4. Run Assignment Engine
    print("⚙️ Running Assignment Engine...")
    success, message = assign_order(order.id)
    print(f"--- Result: {success} | Message: {message} ---")

    # 5. Verify
    order.refresh_from_db()
    agent_profile.refresh_from_db()
    
    if order.status == 'assigned' and order.agent == agent_profile:
        print("🌟 TEST PASSED: Order assigned successfully!")
    else:
        print("❌ TEST FAILED: Assignment logic error.")

    if agent_profile.status == 'busy':
        print("✅ Agent status updated to BUSY.")

if __name__ == "__main__":
    run_test()
