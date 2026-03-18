from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AnomalyLog
from .serializers import AnomalyLogSerializer
from core.permissions import IsAdminUserRole
from django.utils import timezone

from rest_framework.pagination import PageNumberPagination

class AnomalyPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class AnomalyViewSet(viewsets.ModelViewSet):
    throttle_scope = 'user'
    pagination_class = AnomalyPagination
    serializer_class = AnomalyLogSerializer
    queryset = AnomalyLog.objects.all().order_by('-detected_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUserRole])
    def resolve(self, request, pk=None):
        anomaly = self.get_object()
        if not anomaly.resolved:
            anomaly.resolved = True
            anomaly.resolved_at = timezone.now()
            anomaly.save()

            # --- TASK 3: FIX STATUS RESET ---
            agent = anomaly.agent
            agent.status = "NORMAL"
            
            # If fatigue anomaly, clear the score safely
            if anomaly.anomaly_type == 'high_fatigue':
                agent.fatigue_score = 0.0
            agent.save()

            # --- TASK 4: FIX REDIS CACHE AND WEBSOCKET BROADCAST ---
            try:
                import redis
                import json
                from django.conf import settings
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync

                # Overwrite Redis cache with latest guaranteed status
                r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                cached = r.hget("fleet_agents", str(agent.id))
                payload = json.loads(cached) if cached else {}
                
                payload.update({
                    "agent_id": agent.id,
                    "status": agent.status,
                    "fatigue_score": float(agent.fatigue_score),
                    "agent_name": getattr(agent.user, 'username', f"Agent_{agent.id}"),
                    "lat": payload.get('lat', getattr(agent, 'current_lat', 0)),
                    "lng": payload.get('lng', getattr(agent, 'current_lng', 0)),
                    "speed": payload.get('speed', getattr(agent, 'current_speed', 0)),
                    "km_today": getattr(agent, 'total_km_today', 0)
                })
                
                r.hset("fleet_agents", str(agent.id), json.dumps(payload))

                # Immediately Broadcast the restored agent status
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        "admins",
                        {
                            "type": "tracking_message",
                            "data": payload
                        }
                    )
            except Exception as e:
                import logging
                logging.getLogger('trackhive.anomaly').error(f"Status Reset Broadcast Failed: {e}")

            return Response({"status": "resolved", "at": anomaly.resolved_at})
        return Response({"status": "already_resolved"}, status=status.HTTP_400_BAD_REQUEST)
