from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DeliveryAgent
from .serializers import DeliveryAgentSerializer
from core.permissions import IsAdminUserRole

from rest_framework.pagination import PageNumberPagination

class AgentPagination(PageNumberPagination):
    page_size = 100
    
class DeliveryAgentViewSet(viewsets.ModelViewSet):
    throttle_scope = 'user'
    pagination_class = AgentPagination
    queryset = DeliveryAgent.objects.select_related('user').all()
    serializer_class = DeliveryAgentSerializer
    permission_classes = [IsAdminUserRole]

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUserRole])
    def reset_fatigue(self, request, pk=None):
        agent = self.get_object()
        
        # Reset all performance metrics
        agent.fatigue_score = 0.0
        agent.orders_last_4hrs = 0
        agent.total_km_today = 0.0
        agent.hours_active = 0.0
        agent.save()
        
        serializer = self.get_serializer(agent)
        return Response({
            "status": "success",
            "message": f"Fatigue and metrics reset for agent {agent.user.username}",
            "agent": serializer.data
        }, status=status.HTTP_200_OK)
