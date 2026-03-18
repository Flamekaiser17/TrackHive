from core.redis_client import redis_client
from .models import DeliveryAgent

def calculate_fatigue(orders_last_4hrs, km_today, hours_active):
    # Fatigue formula: orders (40%) + km (30%) + hours (30%)
    return (orders_last_4hrs * 0.4) + (km_today * 0.3) + (hours_active * 0.3)

def update_agent_fatigue(agent_id, orders_last_4hrs, km_today, hours_active):
    fatigue = calculate_fatigue(orders_last_4hrs, km_today, hours_active)
    # Fast write to Hash in Redis
    redis_client.hset(f"agent:fatigue:{agent_id}", mapping={
        "score": fatigue,
        "orders_last_4hrs": orders_last_4hrs,
        "km_today": km_today,
        "hours_active": hours_active
    })
    return fatigue

def get_agent_fatigue(agent_id):
    # Fast read
    data = redis_client.hgetall(f"agent:fatigue:{agent_id}")
    if data and 'score' in data:
        return float(data['score'])
    # Fallback to DB if missing
    try:
        agent = DeliveryAgent.objects.get(id=agent_id)
        return agent.fatigue_score
    except DeliveryAgent.DoesNotExist:
        return 0.0
