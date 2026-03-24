import time
import random
import logging
import math
from celery import shared_task
from agents.models import DeliveryAgent
from tracking.models import LocationUpdate
from core.redis_client import redis_client
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from anomaly.tasks import detect_anomalies_task
from orders.models import Order
from orders.eta_service import calculate_and_push_eta
from django.conf import settings

logger = logging.getLogger('trackhive.simulator')

@shared_task(bind=True, max_retries=None)
def simulate_agent_movement(self, agent_id):
    CITY_CONFIG = settings.CITY_CONFIG
    try:
        agent = DeliveryAgent.objects.get(id=agent_id)
        if not agent.is_simulated:
            return
    except DeliveryAgent.DoesNotExist:
        return

    channel_layer = get_channel_layer()
    bounds = CITY_CONFIG.get("bounds", {
        "lat_min": CITY_CONFIG["lat"] - 0.1, "lat_max": CITY_CONFIG["lat"] + 0.1,
        "lng_min": CITY_CONFIG["lng"] - 0.1, "lng_max": CITY_CONFIG["lng"] + 0.1
    })

    old_lat, old_lng = agent.current_lat, agent.current_lng
    new_lat = random.uniform(bounds["lat_min"], bounds["lat_max"])
    new_lng = random.uniform(bounds["lng_min"], bounds["lng_max"])
    
    if old_lat and old_lng:
        dist = math.sqrt((new_lat - old_lat)**2 + (new_lng - old_lng)**2) * 111
        agent.total_km_today += dist
    
    agent.battery_level = max(5.0, agent.battery_level - random.uniform(0.1, 0.3))
    if random.random() < 0.05:
        agent.orders_last_4hrs += 1

    agent.current_lat = new_lat
    agent.current_lng = new_lng
    speed = random.uniform(20, 60)
    agent.current_speed = speed
    agent.save()

    loc_update = LocationUpdate.objects.create(
        agent=agent, lat=new_lat, lng=new_lng, speed_kmph=speed
    )
    redis_client.geoadd("agents_locations", (new_lng, new_lat, agent.id))

    payload = {
        "type": "tracking_message",
        "data": {
            "agent_id": agent.id,
            "agent_name": getattr(agent.user, 'username', f"Agent_{agent.id}"),
            "lat": new_lat,
            "lng": new_lng,
            "speed": speed,
            "battery": agent.battery_level,
            "km_today": agent.total_km_today,
            "orders_today": agent.orders_last_4hrs,
            "fatigue_score": agent.fatigue_score,
            "status": agent.status
        }
    }
    if channel_layer:
        async_to_sync(channel_layer.group_send)("admins", payload)

    active_order = Order.objects.filter(agent=agent, status__in=['picked_up', 'in_transit']).first()
    detect_anomalies_task.delay(agent.id, new_lat, new_lng, speed, order_id=active_order.id if active_order else None)
    
    if active_order:
        calculate_and_push_eta(active_order.id, new_lat, new_lng, speed)

    raise self.retry(countdown=2.0)
