from rest_framework import serializers
from .models import DeliveryAgent
from users.serializers import UserSerializer

class DeliveryAgentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = DeliveryAgent
        fields = '__all__'
