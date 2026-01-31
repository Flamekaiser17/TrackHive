from celery import shared_task

@shared_task
def sync_fatigue_to_db():
    # IMPORTS ANDAR
    from .models import DeliveryAgent
    from core.redis_client import redis_client

    agents = DeliveryAgent.objects.all()
    for agent in agents:
        data = redis_client.hgetall(f"agent:fatigue:{agent.id}")
        if data:
            agent.fatigue_score = float(data.get('score', 0))
            agent.orders_last_4hrs = int(data.get('orders_last_4hrs', 0))
            agent.total_km_today = float(data.get('km_today', 0))
            agent.hours_active = float(data.get('hours_active', 0))
            agent.save()

@shared_task
def reset_fatigue_scores():
    # IMPORTS ANDAR
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