from rest_framework import generics
from .models import LocationUpdate
from .serializers import LocationUpdateSerializer
from core.permissions import IsAgentUserRole

class LocationUpdateView(generics.CreateAPIView):
    throttle_scope = 'simulator'
    # This REST view is for initial testing and Phase 2
    # In Phase 3, we move to high-frequency WebSockets
    queryset = LocationUpdate.objects.all()
    serializer_class = LocationUpdateSerializer
    permission_classes = [IsAgentUserRole]
