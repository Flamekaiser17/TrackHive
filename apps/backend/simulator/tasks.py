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
from django.utils import timezone

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
    
    distance = 0.0
    if old_lat and old_lng:
        distance = math.sqrt((new_lat - old_lat)**2 + (new_lng - old_lng)**2) * 111
        agent.total_km_today += distance
    
    if hasattr(agent, 'battery_level'):
        agent.battery_level = max(5.0, agent.battery_level - random.uniform(0.1, 0.3))
    if random.random() < 0.05:
        agent.orders_last_4hrs += 1

    # Accumulate active hours (each tick = 2 seconds = 2/3600 of an hour)
    agent.hours_active = round(agent.hours_active + (2 / 3600), 6)

    agent.current_lat = new_lat
    agent.current_lng = new_lng
    speed = random.uniform(20, 60)
    if hasattr(agent, 'current_speed'):
        agent.current_speed = speed

    # Recalculate fatigue score using model method (persists to DB)
    agent.save()  # save position/km first so calculate_fatigue reads fresh values
    agent.calculate_fatigue()  # updates fatigue_score and saves again

    LocationUpdate.objects.create(
        agent=agent, lat=new_lat, lng=new_lng, speed_kmph=speed
    )
    redis_client.geoadd("agents_locations", (new_lng, new_lat, agent.id))

    # --- TASK 1 & 2: UPDATE REDIS CACHE CORRECTLY ---
    payload_data = {
        "agent_id": agent.id,
        "agent_name": agent.user.username if hasattr(agent, 'user') and agent.user else f"Agent_{agent.id}",
        "lat": float(new_lat),
        "lng": float(new_lng),
        "speed": round(float(speed), 1),
        "speed_kmph": round(float(speed), 1),
        "battery": getattr(agent, 'battery_level', 100),
        "distance": round(float(agent.total_km_today), 2),
        "km_today": round(float(agent.total_km_today), 2),
        "status": agent.status,
        "fatigue_score": float(agent.fatigue_score),
        "orders_today": int(agent.orders_last_4hrs),
        "timestamp": timezone.now().isoformat()
    }
    
    try:
        import json
        import redis
        r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        r.hset("fleet_agents", str(agent.id), json.dumps(payload_data))
    except Exception as e:
        logger.error(f"Redis Cache Error in Simulator: {e}")

    # Broadcast full telemetry to admins group for frontend Activity Stream
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            "admins",
            {
                "type": "tracking_message",
                "data": payload_data
            }
        )

    active_order = Order.objects.filter(agent=agent, status__in=['picked_up', 'in_transit']).first()
    try:
        # Run synchronously to avoid queued delay and ensure the new code executes
        detect_anomalies_task(agent.id, new_lat, new_lng, speed, order_id=active_order.id if active_order else None)
    except Exception as e:
        logger.error(f"Simulator Anomaly Check Failed: {e}", exc_info=True)
    
    if active_order:
        try:
            calculate_and_push_eta(active_order.id, new_lat, new_lng, speed)
        except Exception as e:
            logger.error(f"Simulator ETA Check Failed: {e}", exc_info=True)

    raise self.retry(countdown=2.0)
