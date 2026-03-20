from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer
from core.permissions import IsAdminUserRole
from .services import assign_order
from agents.services import update_agent_fatigue

from rest_framework.pagination import PageNumberPagination

class OrderPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderViewSet(viewsets.ModelViewSet):
    throttle_scope = 'user'
    pagination_class = OrderPagination
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        elif user.role == 'customer':
            return Order.objects.filter(customer=user)
        elif hasattr(user, 'agent_profile'):
            return Order.objects.filter(agent=user.agent_profile)
        return Order.objects.none()

    def perform_create(self, serializer):
        import structlog
        order = serializer.save(customer=self.request.user)
        log = structlog.get_logger()
        log.info("order_created", 
                 order_id=str(order.id), 
                 customer_id=str(self.request.user.id),
                 pickup=f"{order.pickup_lat},{order.pickup_lng}",
                 drop=f"{order.drop_lat},{order.drop_lng}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def assign(self, request, pk=None):
        order = self.get_object()
        success, message = assign_order(order.id)
        if success:
            return Response({"status": "assigned", "message": message})
        return Response({"status": "failed", "message": message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUserRole])
    def assign_all(self, request):
        unassigned_orders = Order.objects.filter(status='created')
        results = []
        for order in unassigned_orders:
            success, message = assign_order(order.id)
            results.append({"order_id": order.id, "success": success, "message": message})
        return Response(results)

    def partial_update(self, request, *args, **kwargs):
        # Override to trigger fatigue update when delivered
        response = super().partial_update(request, *args, **kwargs)
        order = self.get_object()
        
        if order.status == 'delivered' and order.agent:
            # Recalculate fatigue for the agent
            update_agent_fatigue(
                agent_id=order.agent.id,
                orders_last_4hrs=order.agent.orders_last_4hrs + 1,
                km_today=order.agent.total_km_today, # Simplified for now
                hours_active=order.agent.hours_active # Simplified for now
            )
        return response
