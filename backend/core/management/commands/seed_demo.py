import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
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
        self.stdout.write("🏗️ Seeding TrackHive Demo data...")

        # 1. Clean existing data
        User.objects.all().delete()
        
        # 2. Create Admin
        admin = User.objects.create_superuser(
            username='admin@trackhive.com',
            email='admin@trackhive.com',
            password='TrackHive@2024',
            role='admin'
        )

        # 3. Create 5 Agents with specific fatigue levels
        fatigues = [1.2, 4.5, 7.1, 8.8, 2.0]
        agents = []
        for i, f in enumerate(fatigues):
            u = User.objects.create_user(username=f'agent_{i+1}', role='agent', password='password123')
            a = DeliveryAgent.objects.create(
                user=u,
                status='available' if f < 8.0 else 'busy',
                fatigue_score=f,
                current_lat=19.07 + random.uniform(-0.02, 0.02),
                current_lng=72.87 + random.uniform(-0.02, 0.02)
            )
            agents.append(a)

        # 4. Create 10 Orders
        customer = User.objects.create_user(username='demo_customer', role='customer', password='password123')
        
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
