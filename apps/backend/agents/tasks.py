from celery import shared_task

@shared_task
def sync_fatigue_to_db():
    from .models import DeliveryAgent
    # Standard sync DB query in Celery task
    agents = DeliveryAgent.objects.select_related('user').all()
    for agent in agents:
        agent.calculate_fatigue()
        agent.save(update_fields=['fatigue_score'])

@shared_task
def reset_fatigue_scores():
    from .models import DeliveryAgent
    from core.redis_client import redis_client

    DeliveryAgent.objects.update(
        fatigue_score=0.0,
        orders_last_4hrs=0,
        total_km_today=0.0,
        hours_active=0.0
    )
    for key in redis_client.scan_iter("agent:fatigue:*"):
        redis_client.delete(key)