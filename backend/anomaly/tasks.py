import logging
from celery import shared_task
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import datetime

logger = logging.getLogger('trackhive.anomaly')

# YEH UPAR SE HATAO:
# from .models import AnomalyLog
# from tracking.models import LocationUpdate  
# from agents.models import DeliveryAgent
# from orders.models import Order
# from orders.services import haversine

def push_anomaly_to_ws(agent, anomaly_type, order=None, anomaly_log=None):
    """Broadcast a detected anomaly to all connected admin WebSocket clients."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        "admins",
        {
            "type": "anomaly_alert",
            "data": {
                "id": anomaly_log.id if anomaly_log else None,
                "agent_id": agent.id,
                "agent_name": getattr(agent.user, 'username', f"Agent_{agent.id}"),
                "anomaly_type": anomaly_type,
                "order_id": order.id if order else None,
                "detected_at": anomaly_log.detected_at.isoformat() if anomaly_log and anomaly_log.detected_at else timezone.now().isoformat(),
                "resolved": False
            }
        }
    )

@shared_task
def detect_anomalies_task(agent_id, current_lat, current_lng,
                          speed_kmph, order_id=None):
    # IMPORTS ANDAR AAYE — fix hai yeh
    from .models import AnomalyLog
    from tracking.models import LocationUpdate
    from agents.models import DeliveryAgent
    from orders.models import Order
    from orders.services import haversine

    # Structured logging context
    extra = {
        "agent_id": str(agent_id),
        "order_id": str(order_id) if order_id else None
    }
    logger.info("detecting_anomalies_start", extra=extra)

    try:
        agent = DeliveryAgent.objects.get(id=agent_id)
    except DeliveryAgent.DoesNotExist:
        logger.error("agent_not_found", extra=extra)
        return

    recent_updates = list(
        LocationUpdate.objects.filter(agent=agent)
        .order_by('-timestamp')[:5]
    )

    anomaly_detected = None
    if speed_kmph > 120:
        anomaly_detected = 'speed_anomaly'
    elif speed_kmph == 0 and len(recent_updates) >= 2:
        five_mins_ago = timezone.now() - datetime.timedelta(minutes=5)
        stuck = all(
            u.speed_kmph == 0 and u.timestamp > five_mins_ago
            for u in recent_updates
        )
        if stuck:
            anomaly_detected = 'agent_stuck'

    if anomaly_detected:
        logger.warning(
            "anomaly_detected",
            extra={**extra, "anomaly_type": anomaly_detected, "speed": speed_kmph}
        )
        anomaly_log = AnomalyLog.objects.create(
            agent=agent, anomaly_type=anomaly_detected
        )
        push_anomaly_to_ws(agent, anomaly_detected, anomaly_log=anomaly_log)

    active_order = Order.objects.filter(
        agent=agent,
        status__in=['picked_up', 'in_transit']
    ).first()

    if active_order:
        dist_to_pickup = haversine(
            current_lat, current_lng,
            active_order.pickup_lat, active_order.pickup_lng
        )
        dist_to_drop = haversine(
            current_lat, current_lng,
            active_order.drop_lat, active_order.drop_lng
        )
        if dist_to_pickup > 2.0 and dist_to_drop > 2.0:
            logger.warning(
                "anomaly_detected",
                extra={**extra, "anomaly_type": 'route_deviation', "order_id": str(active_order.id)}
            )
            anomaly_log = AnomalyLog.objects.create(
                agent=agent,
                order=active_order,
                anomaly_type='route_deviation'
            )
            push_anomaly_to_ws(agent, 'route_deviation', order=active_order, anomaly_log=anomaly_log)

    logger.info("detecting_anomalies_end", extra=extra)


@shared_task
def check_unreachable_agents():
    # IMPORTS ANDAR AAYE
    from .models import AnomalyLog
    from tracking.models import LocationUpdate
    from agents.models import DeliveryAgent
    from orders.models import Order

    active_orders = Order.objects.filter(
        status__in=['picked_up', 'in_transit']
    )
    three_mins_ago = timezone.now() - datetime.timedelta(minutes=3)
    
    for order in active_orders:
        if order.agent:
            extra = {
                "order_id": str(order.id), 
                "agent_id": str(order.agent.id)
            }
            last_update = LocationUpdate.objects.filter(
                agent=order.agent
            ).order_by('-timestamp').first()
            
            if not last_update or last_update.timestamp < three_mins_ago:
                logger.warning(
                    "anomaly_detected", 
                    extra={**extra, "anomaly_type": 'unreachable'}
                )
                anomaly_log = AnomalyLog.objects.create(
                    agent=order.agent,
                    order=order,
                    anomaly_type='unreachable'
                )
                push_anomaly_to_ws(order.agent, 'unreachable', order=order, anomaly_log=anomaly_log)