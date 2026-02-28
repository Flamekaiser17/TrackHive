import time
import random
import logging
from celery import shared_task

logger = logging.getLogger('trackhive.simulator')

@shared_task(bind=True, max_retries=None)
def simulate_agent_movement(self, agent_id):
    # IMPORTS ANDAR
    from agents.models import DeliveryAgent
    from tracking.models import LocationUpdate
    from core.redis_client import redis_client
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    from anomaly.tasks import detect_anomalies_task
    from orders.models import Order
    from orders.eta_service import calculate_and_push_eta

    # Check Redis if simulation still active before retry
    if not redis_client.sismember("simulation:active_tasks", self.request.id):
        logger.info(
            "simulation_task_stopped", 
            extra={"task_id": self.request.id, "agent_id": agent_id}
        )
        return

    try:
        agent = DeliveryAgent.objects.get(id=agent_id)
    except DeliveryAgent.DoesNotExist:
        logger.error("agent_not_found", extra={"agent_id": agent_id})
        return

    channel_layer = get_channel_layer()

    lat = random.uniform(12.85, 13.05)
    lng = random.uniform(77.45, 77.65)
    
    agent.current_lat = lat
    agent.current_lng = lng
    agent.save()

    logger.info(
        "agent_coordinate_update", 
        extra={"agent_id": agent_id, "lat": lat, "lng": lng}
    )

    loc_update = LocationUpdate.objects.create(
        agent=agent,
        lat=lat,
        lng=lng,
        speed_kmph=random.uniform(20, 60)
    )

    redis_client.geoadd("agents_locations", (lng, lat, agent.id))

    payload = {
        "type": "tracking_message",
        "data": {
            "agent_id": agent.id,
            "agent_name": agent.user.username,
            "lat": lat,
            "lng": lng,
            "speed": loc_update.speed_kmph,
            "status": agent.status
        }
    }
    async_to_sync(channel_layer.group_send)("admins", payload)

    active_order = Order.objects.filter(
        agent=agent, 
        status__in=['picked_up', 'in_transit']
    ).first()
    
    detect_anomalies_task.delay(
        agent.id, lat, lng, 
        loc_update.speed_kmph,
        order_id=active_order.id if active_order else None
    )
    
    if active_order:
        calculate_and_push_eta(
            active_order.id, lat, lng, 
            loc_update.speed_kmph
        )

    raise self.retry(countdown=3)
