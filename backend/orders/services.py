import logging
from core.redis_client import redis_client
from agents.models import DeliveryAgent
from .models import Order
from agents.services import get_agent_fatigue
from math import radians, sin, cos, sqrt, atan2

logger = logging.getLogger('trackhive.assignment')

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def assign_order(order_id):
    # Structured logging context
    extra = {"order_id": str(order_id)}
    
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.error("order_not_found", extra=extra)
        return False, "Order not found."
        
    if order.status != 'created':
        logger.warning(
            "order_already_processed", 
            extra={**extra, "status": order.status}
        )
        return False, "Order already assigned or processed."

    # Redis GEOSEARCH
    nearby_agents = redis_client.georadius(
        'agents_locations', 
        order.pickup_lng, 
        order.pickup_lat, 
        5, 
        unit='km', 
        withdist=True
    )
    
    logger.info(
        "assignment_attempt", 
        extra={**extra, "candidates_found": len(nearby_agents)}
    )

    if not nearby_agents:
        logger.warning("no_nearby_agents", extra=extra)
        return False, "No agents within 5km radius."

    candidates = []
    for agent_data in nearby_agents:
        agent_id = int(agent_data[0])
        distance = float(agent_data[1])
        
        agent = DeliveryAgent.objects.filter(id=agent_id, status='available').first()
        if not agent:
            continue
            
        fatigue = get_agent_fatigue(agent_id)
        if fatigue >= 8.0:
            continue
            
        avg_speed = 30.0 
        safe_dist = distance if distance > 0.1 else 0.1
        
        assignment_score = (
            (1 / safe_dist) * 0.4 +
            (avg_speed / 10) * 0.3 + 
            (10 - fatigue) * 0.3
        )
        candidates.append((assignment_score, agent, distance))

    candidates.sort(key=lambda x: x[0], reverse=True)

    for score, agent, dist in candidates:
        lock_key = f"lock:agent_{agent.id}"
        
        # LOCK_EVENT (Attempt)
        logger.info(
            "lock_attempt", 
            extra={**extra, "agent_id": str(agent.id), "ttl_seconds": 10}
        )
        
        acquired = redis_client.set(lock_key, "locked", nx=True, ex=10)
        
        if acquired:
            logger.info("lock_acquired", extra={**extra, "agent_id": str(agent.id)})
            try:
                order.agent = agent
                order.status = 'assigned'
                order.save()
                
                agent.status = 'busy'
                agent.save()
                
                logger.info(
                    "assignment_success", 
                    extra={
                        **extra, 
                        "agent_id": str(agent.id), 
                        "assignment_score": round(score, 2)
                    }
                )
                return True, f"Assigned to agent {agent.user.username}"
            finally:
                redis_client.delete(lock_key)
                logger.info("lock_released", extra={**extra, "agent_id": str(agent.id)})
        else:
            logger.warning("lock_failed", extra={**extra, "agent_id": str(agent.id)})

    return False, "Could not acquire lock for any candidate."
