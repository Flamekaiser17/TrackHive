from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LocationUpdate
from core.redis_client import redis_client
from anomaly.tasks import detect_anomalies_task
from orders.models import Order
from orders.eta_service import calculate_and_push_eta

@receiver(post_save, sender=LocationUpdate)
def trigger_location_updates(sender, instance, created, **kwargs):
    if created:
        # 1. Update Redis GEO cache
        redis_client.geoadd('agents_locations', (instance.lng, instance.lat, instance.agent.id))
        
        # 2. Check for active order to correlate
        active_order = Order.objects.filter(
            agent=instance.agent, 
            status__in=['picked_up', 'in_transit']
        ).first()

        # 3. Trigger async Celery Anomaly Detector
        detect_anomalies_task.delay(
            agent_id=instance.agent.id,
            current_lat=instance.lat,
            current_lng=instance.lng,
            speed_kmph=instance.speed_kmph,
            order_id=active_order.id if active_order else None
        )

        # 4. Handle ETA update
        if active_order:
            calculate_and_push_eta(
                order_id=active_order.id,
                agent_lat=instance.lat,
                agent_lng=instance.lng,
                avg_speed=30.0
            )
