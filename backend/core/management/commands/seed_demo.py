import random
from django.contrib.auth import get_user_model

from django.core.management.base import BaseCommand
from django.conf import settings
from agents.models import DeliveryAgent
from orders.models import Order
from anomaly.models import AnomalyLog
from tracking.models import LocationUpdate
from django.utils import timezone
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with professional demo data for interviews."

    def handle(self, *args, **options):
        self.stdout.write("🏗️ Ensuring TrackHive Admin & Demo data...")
        
        # 2. Create or Update Admin
        admin, created = User.objects.get_or_create(
            email='admin@trackhive.com',
            defaults={
                'username': 'admin@trackhive.com',
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin'
            }
        )
        if created:
            admin.set_password('TrackHive@2024')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin created: admin@trackhive.com"))
        else:
            admin.role = 'admin'
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin ensured: admin@trackhive.com"))

        # Ensure demo data is always at optimal state

        # 3. Create 5 Agents with specific fatigue levels
        fatigues = [1.2, 4.5, 7.1, 8.8, 2.0]
        agents = []
        for i, f in enumerate(fatigues):
            username = f'agent_{i+1}'
            u, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@trackhive.com',
                    'role': 'agent'
                }
            )
            if created:
                u.set_password('password123')
                u.save()

            a, created = DeliveryAgent.objects.get_or_create(
                user=u,
                defaults={
                    'status': 'available' if f < 8.0 else 'busy',
                    'fatigue_score': f,
                    'is_permanent': True,
                    'current_lat': settings.CITY_CONFIG["lat"] + random.uniform(-0.02, 0.02),
                    'current_lng': settings.CITY_CONFIG["lng"] + random.uniform(-0.02, 0.02)
                }
            )
            agents.append(a)
        
        # 3.1 Trigger Simulation for seeded agents immediately
        try:
            from simulator.tasks import simulate_agent_movement
            from core.redis_client import redis_client
            for a in agents:
                task = simulate_agent_movement.delay(a.id)
                redis_client.sadd("simulation:active_tasks", task.id)
                a.is_simulated = True 
                a.save()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️ Could not start auto-simulation: {str(e)}"))

        # 4. Create 10 Orders
        customer, created = User.objects.get_or_create(
            username='demo_customer', 
            defaults={
                'email': 'customer@trackhive.com',
                'role': 'customer'
            }
        )
        if created:
            customer.set_password('password123')
            customer.save()
        
        # 3 created
        for _ in range(3):
            Order.objects.create(customer=customer, status='created', pickup_lat=19.05, pickup_lng=72.85, drop_lat=19.09, drop_lng=72.89)

        # 3 assigned
        for i in range(3):
            Order.objects.create(customer=customer, agent=agents[i], status='assigned', pickup_lat=19.05, pickup_lng=72.85, drop_lat=19.09, drop_lng=72.89)

        # 2 in_transit (with history)
        for i in range(2):
            order = Order.objects.create(
                customer=customer, agent=agents[i], status='in_transit', 
                pickup_lat=19.05, pickup_lng=72.85, drop_lat=19.09, drop_lng=72.89
            )
            # Add movement trail
            for j in range(5):
                LocationUpdate.objects.create(
                    agent=agents[i],
                    lat=19.05 + (j * 0.005),
                    lng=72.85 + (j * 0.005),
                    speed_kmph=35.0,
                    timestamp=timezone.now() - datetime.timedelta(minutes=(5-j))
                )

        # 2 delivered
        for i in range(2):
             Order.objects.create(customer=customer, agent=agents[i], status='delivered', pickup_lat=19.05, pickup_lng=72.85, drop_lat=19.09, drop_lng=72.89)

        # 5. Create Sample Anomalies
        AnomalyLog.objects.create(agent=agents[0], anomaly_type='speed_anomaly', resolved=True)
        AnomalyLog.objects.create(agent=agents[1], anomaly_type='agent_stuck', resolved=False)
        AnomalyLog.objects.create(agent=agents[2], anomaly_type='route_deviation', resolved=True)

        self.stdout.write(self.style.SUCCESS("✅ Demo Seeded Successfully!"))
