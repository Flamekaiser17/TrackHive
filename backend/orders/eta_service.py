import structlog
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from orders.models import Order
from .services import haversine

logger = structlog.get_logger()

def calculate_and_push_eta(order_id, agent_lat, agent_lng, avg_speed):
    log = logger.bind(order_id=str(order_id))
    try:
        order = Order.objects.get(id=order_id)
        dist = haversine(agent_lat, agent_lng, order.drop_lat, order.drop_lng)
        
        # Real-time ETA: (dist/speed) * 60
        safe_speed = avg_speed if avg_speed > 5 else 30 # Default to 30 km/h if slow
        eta = (dist / safe_speed) * 60
        
        order.eta_minutes = round(eta, 1)
        order.save()

        # ETA_RECALCULATED Logging
        agent_user_id = getattr(order.agent.user, 'id', None) if order.agent else None
        log.info("eta_recalculated", 
                 agent_id=str(agent_user_id) if agent_user_id else None,
                 eta_minutes=order.eta_minutes,
                 confidence_range=round(eta * 0.15, 2), # Simulated 15% dev
                 remaining_km=round(dist, 2))

        # Push to WS group order_{id}
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"order_{order_id}",
            {
                "type": "tracking_message", 
                "data": {
                    "type": "eta_update",
                    "eta_minutes": order.eta_minutes,
                    "dist_remaining_km": round(dist, 2)
                }
            }
        )
    except Exception as e:
        log.error("eta_calculation_error", error=str(e), exc_info=True)
