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
        
        from django.contrib.auth import get_user_model
        from agents.models import DeliveryAgent
        User = get_user_model()

        # Cleanup leftover sim data from previous aborted or parallel runs
        User.objects.filter(username__startswith='sim_agent_').delete()
        User.objects.filter(username__startswith='sim_customer_').delete()

        DeliveryAgent.objects.all().update(
            fatigue_score=0,
            total_km_today=0,
            orders_last_4hrs=0,
            hours_active=0
        )
        print("Cleanup done — sim agents removed, fatigue reset")
        
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
            if not created:
                # Ensure they are permanent if they already existed from old runs
                a.is_permanent = True
                a.status = 'available' if f < 8.0 else 'busy'
                a.fatigue_score = f
                a.save()
            agents.append(a)
        
        # 3.1 Trigger Simulation for seeded agents immediately
        try:
            from simulator.tasks import simulate_agent_movement
            from core.redis_client import redis_client
            for a in agents:
                # Ensure flag is set BEFORE task starts to avoid race condition
                a.is_simulated = True
                a.save()
                
                from simulator.tasks import simulate_agent_movement
                task = simulate_agent_movement.delay(a.id)
                redis_client.sadd("simulation:active_tasks", task.id)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️ Could not start auto-simulation: {str(e)}"))

        # 4. Create 10 Orders (Only if they don't exist)
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
        
        if not Order.objects.filter(customer=customer).exists():
            self.stdout.write("📦 Creating initial demo orders...")
            # 3 created
            for _ in range(3):
                Order.objects.create(customer=customer, status='created', pickup_lat=12.97, pickup_lng=77.59, drop_lat=12.91, drop_lng=77.62)

            # 3 assigned
            for i in range(3):
                Order.objects.create(customer=customer, agent=agents[i], status='assigned', pickup_lat=12.98, pickup_lng=77.61, drop_lat=12.92, drop_lng=77.58)

            # 2 in_transit (with history)
            for i in range(2):
                order = Order.objects.create(
                    customer=customer, agent=agents[i], status='in_transit', 
                    pickup_lat=12.99, pickup_lng=77.63, drop_lat=12.93, drop_lng=77.57
                )
                # Add movement trail
                for j in range(5):
                    LocationUpdate.objects.create(
                        agent=agents[i],
                        lat=12.99 + (j * 0.005),
                        lng=77.63 + (j * 0.005),
                        speed_kmph=35.0,
                        timestamp=timezone.now() - datetime.timedelta(minutes=(5-j))
                    )

            # 2 delivered
            for i in range(2):
                 Order.objects.create(customer=customer, agent=agents[i], status='delivered', pickup_lat=12.96, pickup_lng=77.60, drop_lat=12.90, drop_lng=77.64)

        # 5. Create Sample Anomalies (Only if they don't exist)
        if not AnomalyLog.objects.exists():
            self.stdout.write("⚠️ Creating initial anomaly logs...")
            AnomalyLog.objects.create(agent=agents[0], anomaly_type='speed_anomaly', resolved=True)
            AnomalyLog.objects.create(agent=agents[1], anomaly_type='agent_stuck', resolved=False)
            AnomalyLog.objects.create(agent=agents[2], anomaly_type='route_deviation', resolved=True)

        self.stdout.write(self.style.SUCCESS("✅ Demo Seeded Successfully!"))
