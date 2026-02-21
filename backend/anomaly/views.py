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
            return Response({"status": "resolved", "at": anomaly.resolved_at})
        return Response({"status": "already_resolved"}, status=status.HTTP_400_BAD_REQUEST)
